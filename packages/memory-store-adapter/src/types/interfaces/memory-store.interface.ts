/**
 * Defines one normalized memory record persisted by a store provider.
 */
export interface MemoryRecord {
  namespace: string;
  key: string;
  value: Record<string, unknown>;
  tags: string[];
  updatedAt: string;
}

/**
 * Defines memory read request payload.
 */
export interface MemoryReadRequest {
  namespace: string;
  key: string;
}

/**
 * Defines memory write request payload.
 */
export interface MemoryWriteRequest {
  namespace: string;
  key: string;
  value: Record<string, unknown>;
  tags?: string[];
  updatedAt?: string;
}

/**
 * Defines memory query request payload.
 */
export interface MemoryQueryRequest {
  namespace?: string;
  keyPrefix?: string;
  tag?: string;
  limit?: number;
}

/**
 * Defines memory snapshot request payload.
 */
export interface MemorySnapshotOptions {
  reason?: string;
  recordKeys?: string[];
}

/**
 * Defines memory snapshot metadata returned by provider.
 */
export interface MemorySnapshotRecord {
  snapshotId: string;
  createdAt: string;
  reason?: string;
  recordCount: number;
  snapshotPath: string;
}

/**
 * Defines memory archive request payload.
 */
export interface MemoryArchiveOptions {
  namespace?: string;
  updatedBefore?: string;
  keys?: string[];
}

/**
 * Defines store-provider contract used by memory adapter.
 */
export interface MemoryStoreProvider {
  /**
   * Reads one record by namespace and key.
   * @param namespace Record namespace.
   * @param key Record key.
   * @returns Matching record when present.
   */
  read(namespace: string, key: string): Promise<MemoryRecord | undefined>;

  /**
   * Writes one normalized memory record.
   * @param record Normalized memory record.
   * @returns Void.
   */
  write(record: MemoryRecord): Promise<void>;

  /**
   * Queries records by namespace/key/tag filters.
   * @param request Query request.
   * @returns Matched records.
   */
  query(request: MemoryQueryRequest): Promise<MemoryRecord[]>;

  /**
   * Creates one memory snapshot and returns snapshot metadata.
   * @param options Snapshot options.
   * @returns Snapshot metadata.
   */
  snapshot(options?: MemorySnapshotOptions): Promise<MemorySnapshotRecord>;

  /**
   * Archives records by namespace/time/key filters.
   * @param options Archive options.
   * @returns Number of archived records.
   */
  archive(options?: MemoryArchiveOptions): Promise<number>;

  /**
   * Releases provider-held resources when provider owns external handles.
   * @returns Void.
   */
  dispose?(): Promise<void>;
}
