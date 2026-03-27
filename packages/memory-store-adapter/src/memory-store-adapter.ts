import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type {
  MemoryArchiveOptions,
  MemoryQueryRequest,
  MemoryReadRequest,
  MemoryRecord,
  MemorySnapshotOptions,
  MemorySnapshotRecord,
  MemoryStoreProvider,
  MemoryWriteRequest,
} from './types/index.js';

/**
 * Encapsulates provider contract calls with consistent error and payload handling.
 *
 * Why this exists:
 * memory domain callers should depend on one stable adapter entry and avoid repeating
 * provider-specific error wrapping logic in each module.
 */
export class MemoryStoreAdapter {
  constructor(private readonly storeProvider: MemoryStoreProvider) {}

  /**
   * Reads one record from provider by namespace/key.
   * @param request Read request.
   * @returns Matching record, or undefined when record is absent.
   */
  public async read(request: MemoryReadRequest): Promise<MemoryRecord | undefined> {
    try {
      return await this.storeProvider.read(request.namespace, request.key);
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_READ_FAILED,
        'Failed to read memory record from store provider.',
        {
          namespace: request.namespace,
          key: request.key,
        },
        error,
      );
    }
  }

  /**
   * Writes one record and returns normalized write payload.
   * @param request Write request.
   * @returns Normalized record sent to provider.
   */
  public async write(request: MemoryWriteRequest): Promise<MemoryRecord> {
    const normalizedRecord: MemoryRecord = {
      namespace: request.namespace,
      key: request.key,
      value: request.value,
      tags: request.tags ?? [],
      updatedAt: request.updatedAt ?? new Date().toISOString(),
    };

    try {
      await this.storeProvider.write(normalizedRecord);
      return normalizedRecord;
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_WRITE_FAILED,
        'Failed to write memory record to store provider.',
        {
          namespace: request.namespace,
          key: request.key,
          tags: normalizedRecord.tags,
        },
        error,
      );
    }
  }

  /**
   * Queries records from provider using filter options.
   * @param request Query request.
   * @returns Matched records.
   */
  public async query(request: MemoryQueryRequest): Promise<MemoryRecord[]> {
    try {
      return await this.storeProvider.query(request);
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_QUERY_FAILED,
        'Failed to query memory records from store provider.',
        {
          namespace: request.namespace,
          keyPrefix: request.keyPrefix,
          tag: request.tag,
          limit: request.limit,
        },
        error,
      );
    }
  }

  /**
   * Creates one snapshot from provider.
   * @param options Snapshot options.
   * @returns Snapshot metadata.
   */
  public async snapshot(options: MemorySnapshotOptions = {}): Promise<MemorySnapshotRecord> {
    try {
      return await this.storeProvider.snapshot(options);
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_SNAPSHOT_FAILED,
        'Failed to create memory snapshot from store provider.',
        {
          reason: options.reason,
          recordKeys: options.recordKeys ?? [],
        },
        error,
      );
    }
  }

  /**
   * Archives records by filter options.
   * @param options Archive options.
   * @returns Number of archived records.
   */
  public async archive(options: MemoryArchiveOptions = {}): Promise<number> {
    try {
      return await this.storeProvider.archive(options);
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_ARCHIVE_FAILED,
        'Failed to archive memory records from store provider.',
        {
          namespace: options.namespace,
          updatedBefore: options.updatedBefore,
          keys: options.keys ?? [],
        },
        error,
      );
    }
  }
}
