import type {
  MemoryArchiveOptions,
  MemoryQueryRequest,
  MemoryRecord,
  MemorySnapshotOptions,
  MemorySnapshotRecord,
} from '@repo-ai-governor/memory-store-adapter';

/**
 * Defines memory read request payload.
 */
export interface MemoryReadEntryRequest {
  scope: string;
  key: string;
}

/**
 * Defines memory write request payload.
 */
export interface MemoryWriteEntryRequest {
  scope: string;
  key: string;
  payload: Record<string, unknown>;
  tags?: string[];
  updatedAt?: string;
}

/**
 * Defines memory query request payload.
 */
export interface MemoryQueryEntriesRequest {
  scope?: string;
  keyPrefix?: string;
  tag?: string;
  limit?: number;
}

/**
 * Defines one selective layered snapshot request used by runtime/session composition.
 */
export interface MemoryLayeredSnapshotRequest {
  includeNormativeBaseline?: boolean;
  normativeKeyPrefixes?: string[];
  normativeTags?: string[];
  executionId?: string;
  projectId?: string;
  sprintId?: string;
  taskId?: string;
  artifactIds?: string[];
  sessionId?: string;
  limitPerQuery?: number;
}

/**
 * Defines memory archive request payload.
 */
export interface MemoryArchiveEntriesRequest {
  scope?: string;
  updatedBefore?: string;
  keys?: string[];
}

/**
 * Defines layered memory snapshot consumed by runtime/session modules.
 */
export interface MemoryLayeredSnapshot {
  normativeEntries: MemoryRecord[];
  executionEntries: MemoryRecord[];
  sessionEntries: MemoryRecord[];
}

/**
 * Reuses adapter query request contract as core-memory internal payload.
 */
export type MemoryQueryPayload = MemoryQueryRequest;

/**
 * Reuses adapter archive request contract as core-memory internal payload.
 */
export type MemoryArchivePayload = MemoryArchiveOptions;

/**
 * Reuses adapter snapshot options contract as core-memory internal payload.
 */
export type MemorySnapshotPayload = MemorySnapshotOptions;

/**
 * Reuses adapter snapshot metadata contract as core-memory return payload.
 */
export type MemorySnapshotMetadata = MemorySnapshotRecord;
