import type { ArtifactIndexStore, ArtifactRegistryRecord } from './types/index.js';

/**
 * Provides an in-memory artifact index store for deterministic unit tests and local runtime.
 *
 * Why this exists:
 * resolver and registry logic should be testable without binding to filesystem/CSV engines.
 */
export class InMemoryArtifactIndexStore implements ArtifactIndexStore {
  private readonly recordsByCompositeId = new Map<string, ArtifactRegistryRecord>();

  /**
   * Lists all artifact records currently held in memory.
   * @returns Registry rows.
   */
  public async list(): Promise<ArtifactRegistryRecord[]> {
    return Array.from(this.recordsByCompositeId.values()).map((record) => ({ ...record }));
  }

  /**
   * Upserts one artifact record by `artifactId + artifactVersion` composite key.
   * @param record Normalized artifact record.
   * @returns Persisted artifact record.
   */
  public async upsert(record: ArtifactRegistryRecord): Promise<ArtifactRegistryRecord> {
    const compositeId = this.createCompositeId(record.artifactId, record.artifactVersion);
    const normalizedRecord: ArtifactRegistryRecord = {
      ...record,
      dependentTasks: [...record.dependentTasks],
    };
    this.recordsByCompositeId.set(compositeId, normalizedRecord);

    return { ...normalizedRecord, dependentTasks: [...normalizedRecord.dependentTasks] };
  }

  /**
   * Builds one deterministic composite id for in-memory map indexing.
   * @param artifactId Artifact id.
   * @param artifactVersion Artifact version.
   * @returns Composite identifier.
   */
  private createCompositeId(artifactId: string, artifactVersion: string): string {
    return `${artifactId}@${artifactVersion}`;
  }
}
