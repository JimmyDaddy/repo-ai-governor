import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { ALL_ARTIFACT_LIFECYCLE_STATUSES, ARTIFACT_VERSION_PATTERN } from "./constants/index.js";
import type { ArtifactLifecycleStatus } from "./constants/index.js";
import type {
  ArtifactIndexStore,
  ArtifactRegistryRecord,
  ListArtifactsOptions,
  RegisterArtifactOptions,
} from "./types/index.js";

/**
 * Manages artifact registry records with deterministic validation and query semantics.
 *
 * Why this exists:
 * dependency resolution should consume one normalized artifact contract instead of
 * scattering CSV-field parsing and lifecycle checks across runtime modules.
 */
export class ArtifactRegistry {
  public constructor(private readonly indexStore: ArtifactIndexStore) {}

  /**
   * Registers or updates one artifact record.
   * @param options Artifact upsert options.
   * @returns Persisted artifact record.
   */
  public async registerArtifact(options: RegisterArtifactOptions): Promise<ArtifactRegistryRecord> {
    const artifactId = this.readRequiredString(options.artifactId, "artifactId");
    const artifactType = this.readRequiredString(options.artifactType, "artifactType");
    const artifactPath = this.readRequiredString(options.artifactPath, "artifactPath");
    const artifactVersion = this.readArtifactVersion(options.artifactVersion, "artifactVersion");
    const artifactStatus = this.readArtifactLifecycleStatus(
      options.artifactStatus,
      "artifactStatus",
    );
    const producerTaskId = this.readRequiredString(options.producerTaskId, "producerTaskId");
    const producerExecutionId = this.readRequiredString(
      options.producerExecutionId,
      "producerExecutionId",
    );

    const now = this.toRfc3339SecondsTimestamp(new Date());
    const existingRecord = await this.readExistingRecord(artifactId, artifactVersion);
    const registeredAt = existingRecord?.registeredAt ?? options.registeredAt ?? now;
    const lastUpdatedAt = options.lastUpdatedAt ?? now;

    const normalizedRecord: ArtifactRegistryRecord = {
      artifactId,
      artifactType,
      artifactPath,
      artifactVersion,
      artifactStatus,
      producerTaskId,
      producerExecutionId,
      registeredAt: this.readRfc3339SecondsTimestamp(registeredAt, "registeredAt"),
      lastUpdatedAt: this.readRfc3339SecondsTimestamp(lastUpdatedAt, "lastUpdatedAt"),
      dependentTasks: this.normalizeDependentTasks(options.dependentTasks ?? []),
    };

    return await this.indexStore.upsert(normalizedRecord);
  }

  /**
   * Lists artifact records by optional filter conditions.
   * @param options Query options.
   * @returns Sorted artifact records.
   */
  public async listArtifacts(
    options: ListArtifactsOptions = {},
  ): Promise<ArtifactRegistryRecord[]> {
    const allRecords = await this.indexStore.list();
    const artifactIds = new Set((options.artifactIds ?? []).map((artifactId) => artifactId.trim()));
    const statuses = new Set((options.statuses ?? []).map((status) => status));
    const producerTaskId = options.producerTaskId?.trim();

    return allRecords
      .filter((record) => {
        if (artifactIds.size > 0 && !artifactIds.has(record.artifactId)) {
          return false;
        }

        if (statuses.size > 0 && !statuses.has(record.artifactStatus)) {
          return false;
        }

        if (producerTaskId && record.producerTaskId !== producerTaskId) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        const idOrder = left.artifactId.localeCompare(right.artifactId);
        if (idOrder !== 0) {
          return idOrder;
        }

        return this.compareArtifactVersion(right.artifactVersion, left.artifactVersion);
      });
  }

  /**
   * Lists all versions of one artifact id sorted by highest version first.
   * @param artifactId Artifact id.
   * @returns Artifact-version rows.
   */
  public async listArtifactVersions(artifactId: string): Promise<ArtifactRegistryRecord[]> {
    const normalizedArtifactId = this.readRequiredString(artifactId, "artifactId");
    const records = await this.listArtifacts({
      artifactIds: [normalizedArtifactId],
    });

    return records.sort((left, right) =>
      this.compareArtifactVersion(right.artifactVersion, left.artifactVersion),
    );
  }

  /**
   * Finds one exact artifact row by id and version.
   * @param artifactId Artifact id.
   * @param artifactVersion Artifact version.
   * @returns Matching row when present.
   */
  private async readExistingRecord(
    artifactId: string,
    artifactVersion: string,
  ): Promise<ArtifactRegistryRecord | undefined> {
    const versions = await this.listArtifactVersions(artifactId);
    return versions.find((versionRecord) => versionRecord.artifactVersion === artifactVersion);
  }

  /**
   * Validates one artifact lifecycle status.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @returns Lifecycle status enum value.
   */
  private readArtifactLifecycleStatus(
    candidate: unknown,
    fieldName: string,
  ): ArtifactLifecycleStatus {
    const value = this.readRequiredString(candidate, fieldName);
    if (!ALL_ARTIFACT_LIFECYCLE_STATUSES.has(value)) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_REGISTRY_RECORD_INVALID,
        `Field "${fieldName}" must be one of ${Array.from(ALL_ARTIFACT_LIFECYCLE_STATUSES).join(", ")}.`,
        {
          fieldName,
          value,
        },
      );
    }

    return value as ArtifactLifecycleStatus;
  }

  /**
   * Validates one artifact version field.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @returns Normalized version string.
   */
  private readArtifactVersion(candidate: unknown, fieldName: string): string {
    const version = this.readRequiredString(candidate, fieldName);
    if (!ARTIFACT_VERSION_PATTERN.test(version)) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_REGISTRY_RECORD_INVALID,
        `Field "${fieldName}" must match pattern ${ARTIFACT_VERSION_PATTERN.source}.`,
        {
          fieldName,
          value: version,
        },
      );
    }

    return version;
  }

  /**
   * Validates one required RFC3339 seconds timestamp.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @returns Timestamp value.
   */
  private readRfc3339SecondsTimestamp(candidate: unknown, fieldName: string): string {
    const timestamp = this.readRequiredString(candidate, fieldName);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/u.test(timestamp)) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_REGISTRY_RECORD_INVALID,
        `Field "${fieldName}" must be RFC3339 seconds precision timestamp.`,
        {
          fieldName,
          value: timestamp,
        },
      );
    }

    return timestamp;
  }

  /**
   * Normalizes dependent task ids into unique sorted payload.
   * @param dependentTasks Raw task ids.
   * @returns Stable task id list.
   */
  private normalizeDependentTasks(dependentTasks: string[]): string[] {
    if (!Array.isArray(dependentTasks)) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_REGISTRY_RECORD_INVALID,
        'Field "dependentTasks" must be a string array when provided.',
      );
    }

    const normalizedSet = new Set(
      dependentTasks
        .map((dependentTaskId) => dependentTaskId.trim())
        .filter((dependentTaskId) => dependentTaskId.length > 0),
    );

    return Array.from(normalizedSet.values()).sort((left, right) => left.localeCompare(right));
  }

  /**
   * Validates one required string field.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @returns Trimmed string.
   */
  private readRequiredString(candidate: unknown, fieldName: string): string {
    if (typeof candidate !== "string" || candidate.trim().length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_REGISTRY_RECORD_INVALID,
        `Field "${fieldName}" must be a non-empty string.`,
        {
          fieldName,
          value: candidate,
        },
      );
    }

    return candidate.trim();
  }

  /**
   * Compares artifact versions using numeric segment order.
   * @param leftVersion Left version.
   * @param rightVersion Right version.
   * @returns Comparator result.
   */
  private compareArtifactVersion(leftVersion: string, rightVersion: string): number {
    const leftSegments = this.parseVersionSegments(leftVersion);
    const rightSegments = this.parseVersionSegments(rightVersion);

    for (let segmentIndex = 0; segmentIndex < 3; segmentIndex += 1) {
      const leftSegment = leftSegments[segmentIndex] ?? 0;
      const rightSegment = rightSegments[segmentIndex] ?? 0;
      if (leftSegment !== rightSegment) {
        return leftSegment - rightSegment;
      }
    }

    return 0;
  }

  /**
   * Parses semantic segments from artifact version value.
   * @param artifactVersion Version string.
   * @returns Numeric version segments.
   */
  private parseVersionSegments(artifactVersion: string): [number, number, number] {
    const version = this.readArtifactVersion(artifactVersion, "artifactVersion").replace(/^v/u, "");
    const segments = version.split(".").map((segment) => Number.parseInt(segment, 10));

    return [segments[0] ?? 0, segments[1] ?? 0, segments[2] ?? 0];
  }

  /**
   * Converts date into RFC3339 seconds precision timestamp.
   * @param date Input date.
   * @returns Timestamp without milliseconds.
   */
  private toRfc3339SecondsTimestamp(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/u, "Z");
  }
}
