import type { MemoryStoreAdapter } from "@repo-ai-governor/memory-store-adapter";
import type { MemoryRecord } from "@repo-ai-governor/memory-store-adapter";
import { MemoryScope } from "./constants/index.js";
import type {
  MemoryArchiveEntriesRequest,
  MemoryLayeredSnapshot,
  MemoryLayeredSnapshotRequest,
  MemoryQueryEntriesRequest,
  MemoryReadEntryRequest,
  MemorySnapshotMetadata,
  MemorySnapshotPayload,
  MemoryWriteEntryRequest,
} from "./types/index.js";

/**
 * Manages layered memory access through one store adapter boundary.
 *
 * Why this exists:
 * runtime/session modules should read and write memory through one deterministic
 * manager so scope semantics stay consistent across flows.
 */
export class MemoryManager {
  constructor(private readonly memoryStoreAdapter: MemoryStoreAdapter) {}

  /**
   * Reads one scoped memory entry.
   * @param request Read request.
   * @returns Matching record when present.
   */
  public async readEntry(request: MemoryReadEntryRequest) {
    return this.memoryStoreAdapter.read({
      namespace: request.scope,
      key: request.key,
    });
  }

  /**
   * Writes one scoped memory entry.
   * @param request Write request.
   * @returns Normalized stored record.
   */
  public async writeEntry(request: MemoryWriteEntryRequest) {
    return this.memoryStoreAdapter.write({
      namespace: request.scope,
      key: request.key,
      value: request.payload,
      tags: request.tags,
      updatedAt: request.updatedAt,
    });
  }

  /**
   * Queries scoped memory entries by optional filters.
   * @param request Query request.
   * @returns Matched records.
   */
  public async queryEntries(request: MemoryQueryEntriesRequest = {}) {
    return this.memoryStoreAdapter.query({
      namespace: request.scope,
      keyPrefix: request.keyPrefix,
      tag: request.tag,
      limit: request.limit,
    });
  }

  /**
   * Creates one memory snapshot through adapter.
   * @param request Snapshot request.
   * @returns Snapshot metadata.
   */
  public async snapshot(request: MemorySnapshotPayload = {}): Promise<MemorySnapshotMetadata> {
    return this.memoryStoreAdapter.snapshot(request);
  }

  /**
   * Archives scoped memory entries.
   * @param request Archive request.
   * @returns Archived record count.
   */
  public async archiveEntries(request: MemoryArchiveEntriesRequest = {}) {
    return this.memoryStoreAdapter.archive({
      namespace: request.scope,
      updatedBefore: request.updatedBefore,
      keys: request.keys,
    });
  }

  /**
   * Loads layered memory snapshot for runtime/session composition.
   * @returns Layered memory entries grouped by baseline scopes.
   */
  public async loadLayeredSnapshot(
    request: MemoryLayeredSnapshotRequest = {},
  ): Promise<MemoryLayeredSnapshot> {
    const hasSelectiveFilters =
      Boolean(request.executionId) ||
      Boolean(request.projectId) ||
      Boolean(request.sprintId) ||
      Boolean(request.taskId) ||
      Boolean(request.sessionId) ||
      Boolean(request.normativeKeyPrefixes?.length) ||
      Boolean(request.normativeTags?.length) ||
      Boolean(request.artifactIds?.length);

    if (!hasSelectiveFilters) {
      const [normativeEntries, executionEntries, sessionEntries] = await Promise.all([
        this.queryEntries({ scope: MemoryScope.NORMATIVE }),
        this.queryEntries({ scope: MemoryScope.EXECUTION }),
        this.queryEntries({ scope: MemoryScope.SESSION }),
      ]);

      return {
        normativeEntries,
        executionEntries,
        sessionEntries,
      };
    }

    const limitPerQuery = request.limitPerQuery;
    const [normativeEntries, executionEntries, sessionEntries] = await Promise.all([
      this.collectScopedEntries(MemoryScope.NORMATIVE, {
        keyPrefixes: request.normativeKeyPrefixes ?? [],
        tags: request.normativeTags ?? [],
        limitPerQuery,
        includeBaseline: request.includeNormativeBaseline !== false,
      }),
      this.collectScopedEntries(MemoryScope.EXECUTION, {
        keyPrefixes: request.executionId ? [`${request.executionId}:`] : [],
        tags: [
          ...(request.executionId ? [`execution:${request.executionId}`] : []),
          ...(request.projectId ? [`project:${request.projectId}`] : []),
          ...(request.sprintId ? [`sprint:${request.sprintId}`] : []),
          ...(request.taskId ? [`task:${request.taskId}`] : []),
          ...(request.artifactIds ?? []).map((artifactId) => `artifact:${artifactId}`),
        ],
        limitPerQuery,
      }),
      request.sessionId
        ? this.collectSessionEntriesBySessionId(request.sessionId)
        : this.collectScopedEntries(MemoryScope.SESSION, {
            tags: request.executionId ? [`execution:${request.executionId}`] : [],
            limitPerQuery,
          }),
    ]);

    return {
      normativeEntries,
      executionEntries,
      sessionEntries,
    };
  }

  /**
   * Collects one deduplicated subset of scoped memory entries using key-prefix and tag selectors.
   * @param scope Target memory scope.
   * @param options Selector set.
   * @returns Deduplicated matched records.
   */
  private async collectScopedEntries(
    scope: string,
    options: {
      keyPrefixes?: string[];
      tags?: string[];
      limitPerQuery?: number;
      includeBaseline?: boolean;
    } = {},
  ): Promise<MemoryRecord[]> {
    const recordsByKey = new Map<string, MemoryRecord>();
    const keyPrefixes = options.keyPrefixes ?? [];
    const tags = options.tags ?? [];

    if (options.includeBaseline || (keyPrefixes.length === 0 && tags.length === 0)) {
      for (const entry of await this.queryEntries({
        scope,
        ...(typeof options.limitPerQuery === "number" ? { limit: options.limitPerQuery } : {}),
      })) {
        recordsByKey.set(`${entry.namespace}:${entry.key}`, entry);
      }
    }

    for (const keyPrefix of keyPrefixes) {
      for (const entry of await this.queryEntries({
        scope,
        keyPrefix,
        ...(typeof options.limitPerQuery === "number" ? { limit: options.limitPerQuery } : {}),
      })) {
        recordsByKey.set(`${entry.namespace}:${entry.key}`, entry);
      }
    }

    for (const tag of tags) {
      for (const entry of await this.queryEntries({
        scope,
        tag,
        ...(typeof options.limitPerQuery === "number" ? { limit: options.limitPerQuery } : {}),
      })) {
        recordsByKey.set(`${entry.namespace}:${entry.key}`, entry);
      }
    }

    return Array.from(recordsByKey.values()).sort((left, right) =>
      left.key.localeCompare(right.key),
    );
  }

  /**
   * Collects one session record by explicit session id.
   * @param sessionId Session id selector.
   * @returns Matching session record or empty list.
   */
  private async collectSessionEntriesBySessionId(sessionId: string): Promise<MemoryRecord[]> {
    const sessionEntry = await this.readEntry({
      scope: MemoryScope.SESSION,
      key: sessionId,
    });

    return sessionEntry ? [sessionEntry] : [];
  }
}
