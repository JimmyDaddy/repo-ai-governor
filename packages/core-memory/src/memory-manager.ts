import type { MemoryStoreAdapter } from "@repo-ai-governor/memory-store-adapter";
import { MemoryScope } from "./constants/index.js";
import type {
  MemoryArchiveEntriesRequest,
  MemoryLayeredSnapshot,
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
  public async loadLayeredSnapshot(): Promise<MemoryLayeredSnapshot> {
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
}
