import { randomUUID } from "node:crypto";

import { type MemoryManager, MemoryScope } from "@repo-ai-governor/core-memory";
import {
  ALL_DEPENDENCY_RESOLUTION_STATUSES,
  GovernorErrorCode,
  RuntimeError,
} from "@repo-ai-governor/shared";
import { AuditRecordStatus } from "./constants/index.js";
import type {
  AuditEventRecord,
  ListAuditRecordsOptions,
  PersistedAuditRecord,
  RecordAuditEventOptions,
} from "./types/index.js";

const AUDIT_RECORD_TAG = "audit-record";
const RFC3339_SECONDS_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/u;
const DISPLAY_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC(?:\+|-)\d{2}:\d{2}$/u;
const AUDIT_RECORD_STATUS_VALUES = new Set<string>(Object.values(AuditRecordStatus));
const DEPENDENCY_RESOLUTION_STATUS_VALUES = ALL_DEPENDENCY_RESOLUTION_STATUSES;

/**
 * Records and queries normalized audit events through the shared memory manager.
 *
 * Why this exists:
 * Stage 6 needs one deterministic audit-event contract so report/replay layers can
 * consume stable fields without rebuilding schema logic in every package.
 */
export class AuditRecorder {
  public constructor(private readonly memoryManager: MemoryManager) {}

  /**
   * Persists one normalized audit event into execution memory scope.
   * @param options Record-event options.
   * @returns Persisted audit record payload.
   */
  public async recordEvent(options: RecordAuditEventOptions): Promise<PersistedAuditRecord> {
    const normalizedEvent = this.normalizeAuditEvent(options.event);
    const recordId = options.recordId ?? randomUUID();
    const recordedAt = this.resolveRfc3339SecondsTimestamp(options.recordedAt, "recordedAt");
    const persistedRecord: PersistedAuditRecord = {
      recordId,
      recordedAt,
      event: normalizedEvent,
    };

    await this.memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: this.buildExecutionKey(normalizedEvent.executionId, normalizedEvent.stageId, recordId),
      payload: persistedRecord as unknown as Record<string, unknown>,
      tags: [
        AUDIT_RECORD_TAG,
        `execution:${normalizedEvent.executionId}`,
        `stage:${normalizedEvent.stageId}`,
        `status:${normalizedEvent.status}`,
      ],
    });

    return persistedRecord;
  }

  /**
   * Lists normalized audit records for one execution id.
   * @param options Audit-query options.
   * @returns Matching audit records ordered by `recordedAt`, then `recordId`.
   */
  public async listEvents(options: ListAuditRecordsOptions): Promise<PersistedAuditRecord[]> {
    const executionId = this.readRequiredString(options.executionId, "executionId");
    const stageId = this.readOptionalString(options.stageId, "stageId");
    const records = await this.memoryManager.queryEntries({
      scope: MemoryScope.EXECUTION,
      keyPrefix: this.buildExecutionKeyPrefix(executionId),
      tag: AUDIT_RECORD_TAG,
      limit: options.limit,
    });
    const parsedRecords = records.map((record) => this.parsePersistedAuditRecord(record.value));
    const stageFilteredRecords = stageId
      ? parsedRecords.filter((record) => record.event.stageId === stageId)
      : parsedRecords;

    return stageFilteredRecords.sort((left, right) =>
      this.compareByRecordedAtThenRecordId(left, right),
    );
  }

  /**
   * Normalizes and validates one audit event payload.
   * @param event Raw audit event payload.
   * @returns Normalized audit event payload.
   */
  private normalizeAuditEvent(event: AuditEventRecord): AuditEventRecord {
    const status = this.readRequiredString(event.status, "status");
    if (!AUDIT_RECORD_STATUS_VALUES.has(status)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "status" must be one of ${Array.from(AUDIT_RECORD_STATUS_VALUES).join(", ")}.`,
        {
          fieldName: "status",
          value: status,
        },
      );
    }
    const dependencyResolutionStatus = this.readOptionalDependencyResolutionStatus(
      event.dependencyResolutionStatus,
    );

    const normalizedRecord: AuditEventRecord = {
      executionId: this.readRequiredString(event.executionId, "executionId"),
      stageId: this.readRequiredString(event.stageId, "stageId"),
      routeKey: this.readRequiredString(event.routeKey, "routeKey"),
      surface: this.readRequiredString(event.surface, "surface"),
      agentRole: this.readRequiredString(event.agentRole, "agentRole"),
      roleProfileId: this.readRequiredString(event.roleProfileId, "roleProfileId"),
      roleSource: this.readRequiredString(event.roleSource, "roleSource"),
      policyOutcome: this.readRequiredString(event.policyOutcome, "policyOutcome"),
      status: status as AuditRecordStatus,
      startedAt: this.resolveRfc3339SecondsTimestamp(event.startedAt, "startedAt"),
      endedAt: this.resolveRfc3339SecondsTimestamp(event.endedAt, "endedAt"),
      startedAtDisplay: this.readDisplayTimestamp(event.startedAtDisplay, "startedAtDisplay"),
      endedAtDisplay: this.readDisplayTimestamp(event.endedAtDisplay, "endedAtDisplay"),
      executionSessionId: this.readRequiredString(event.executionSessionId, "executionSessionId"),
      memoryScope: this.readRequiredString(event.memoryScope, "memoryScope"),
      memoryDelta: this.readRecord(event.memoryDelta, "memoryDelta"),
      workspaceId: this.readRequiredString(event.workspaceId, "workspaceId"),
      workspaceMode: this.readRequiredString(event.workspaceMode, "workspaceMode"),
      workspaceRoot: this.readRequiredString(event.workspaceRoot, "workspaceRoot"),
      ...(this.readOptionalString(event.riskLevel, "riskLevel")
        ? { riskLevel: this.readOptionalString(event.riskLevel, "riskLevel") }
        : {}),
      ...(this.readOptionalStringArray(event.riskReasons, "riskReasons")
        ? { riskReasons: this.readOptionalStringArray(event.riskReasons, "riskReasons") }
        : {}),
      ...(this.readOptionalString(event.requiredAction, "requiredAction")
        ? { requiredAction: this.readOptionalString(event.requiredAction, "requiredAction") }
        : {}),
      ...(this.readOptionalStringArray(event.matchedPolicies, "matchedPolicies")
        ? {
            matchedPolicies: this.readOptionalStringArray(event.matchedPolicies, "matchedPolicies"),
          }
        : {}),
      ...(this.readOptionalString(event.skillId, "skillId")
        ? { skillId: this.readOptionalString(event.skillId, "skillId") }
        : {}),
      ...(this.readOptionalString(event.skillVersion, "skillVersion")
        ? { skillVersion: this.readOptionalString(event.skillVersion, "skillVersion") }
        : {}),
      ...(this.readOptionalString(event.error, "error")
        ? { error: this.readOptionalString(event.error, "error") }
        : {}),
      ...(this.readOptionalString(event.notificationChannel, "notificationChannel")
        ? {
            notificationChannel: this.readOptionalString(
              event.notificationChannel,
              "notificationChannel",
            ),
          }
        : {}),
      ...(this.readOptionalString(event.notificationStatus, "notificationStatus")
        ? {
            notificationStatus: this.readOptionalString(
              event.notificationStatus,
              "notificationStatus",
            ),
          }
        : {}),
      ...(this.readOptionalDisplayTimestamp(event.notifiedAtDisplay, "notifiedAtDisplay")
        ? {
            notifiedAtDisplay: this.readOptionalDisplayTimestamp(
              event.notifiedAtDisplay,
              "notifiedAtDisplay",
            ),
          }
        : {}),
      ...(this.readOptionalNumber(event.tokenBudget, "tokenBudget") !== undefined
        ? { tokenBudget: this.readOptionalNumber(event.tokenBudget, "tokenBudget") }
        : {}),
      ...(this.readOptionalNumber(event.tokenUsed, "tokenUsed") !== undefined
        ? { tokenUsed: this.readOptionalNumber(event.tokenUsed, "tokenUsed") }
        : {}),
      ...(this.readOptionalNumber(event.costBudget, "costBudget") !== undefined
        ? { costBudget: this.readOptionalNumber(event.costBudget, "costBudget") }
        : {}),
      ...(this.readOptionalNumber(event.costUsed, "costUsed") !== undefined
        ? { costUsed: this.readOptionalNumber(event.costUsed, "costUsed") }
        : {}),
      ...(this.readOptionalNumber(event.maxExecutionTimeSeconds, "maxExecutionTimeSeconds") !==
      undefined
        ? {
            maxExecutionTimeSeconds: this.readOptionalNumber(
              event.maxExecutionTimeSeconds,
              "maxExecutionTimeSeconds",
            ),
          }
        : {}),
      ...(this.readOptionalNumber(event.executionTimeSeconds, "executionTimeSeconds") !== undefined
        ? {
            executionTimeSeconds: this.readOptionalNumber(
              event.executionTimeSeconds,
              "executionTimeSeconds",
            ),
          }
        : {}),
      ...(this.readOptionalString(event.cancellationReason, "cancellationReason")
        ? {
            cancellationReason: this.readOptionalString(
              event.cancellationReason,
              "cancellationReason",
            ),
          }
        : {}),
      ...(this.readOptionalBoolean(event.timeoutIndicator, "timeoutIndicator") !== undefined
        ? {
            timeoutIndicator: this.readOptionalBoolean(event.timeoutIndicator, "timeoutIndicator"),
          }
        : {}),
      ...(this.readOptionalString(event.timeoutScope, "timeoutScope")
        ? { timeoutScope: this.readOptionalString(event.timeoutScope, "timeoutScope") }
        : {}),
      ...(this.readOptionalString(event.artifactId, "artifactId")
        ? { artifactId: this.readOptionalString(event.artifactId, "artifactId") }
        : {}),
      ...(this.readOptionalString(event.artifactVersion, "artifactVersion")
        ? { artifactVersion: this.readOptionalString(event.artifactVersion, "artifactVersion") }
        : {}),
      ...(this.readOptionalString(event.producerTaskId, "producerTaskId")
        ? { producerTaskId: this.readOptionalString(event.producerTaskId, "producerTaskId") }
        : {}),
      ...(this.readOptionalString(event.consumerTaskId, "consumerTaskId")
        ? { consumerTaskId: this.readOptionalString(event.consumerTaskId, "consumerTaskId") }
        : {}),
      ...(dependencyResolutionStatus
        ? {
            dependencyResolutionStatus,
          }
        : {}),
      ...(this.readOptionalString(event.outputMode, "outputMode")
        ? {
            outputMode: this.readOptionalString(
              event.outputMode,
              "outputMode",
            ) as AuditEventRecord["outputMode"],
          }
        : {}),
      ...(this.readOptionalBoolean(event.isTty, "isTty") !== undefined
        ? { isTty: this.readOptionalBoolean(event.isTty, "isTty") }
        : {}),
      ...(this.readOptionalString(event.outputLocale, "outputLocale")
        ? { outputLocale: this.readOptionalString(event.outputLocale, "outputLocale") }
        : {}),
      ...(this.readOptionalString(event.specSyncStatus, "specSyncStatus")
        ? { specSyncStatus: this.readOptionalString(event.specSyncStatus, "specSyncStatus") }
        : {}),
      ...(this.readOptionalStringArray(event.specSyncFailures, "specSyncFailures")
        ? {
            specSyncFailures: this.readOptionalStringArray(
              event.specSyncFailures,
              "specSyncFailures",
            ),
          }
        : {}),
    };

    return normalizedRecord;
  }

  /**
   * Parses one persisted record payload from memory entry.
   * @param payload Raw memory payload.
   * @returns Parsed persisted audit record.
   */
  private parsePersistedAuditRecord(payload: Record<string, unknown>): PersistedAuditRecord {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_PAYLOAD_INVALID,
        "Audit persisted payload must be an object.",
      );
    }

    const record = payload as Record<string, unknown>;
    const eventCandidate = this.readRecord(record.event, "event");
    return {
      recordId: this.readRequiredString(record.recordId, "recordId"),
      recordedAt: this.resolveRfc3339SecondsTimestamp(record.recordedAt, "recordedAt"),
      event: this.normalizeAuditEvent(eventCandidate as unknown as AuditEventRecord),
    };
  }

  /**
   * Builds execution-scoped key prefix for memory queries.
   * @param executionId Execution id.
   * @returns Scoped key prefix.
   */
  private buildExecutionKeyPrefix(executionId: string): string {
    return `${executionId}:`;
  }

  /**
   * Builds one deterministic execution key.
   * @param executionId Execution id.
   * @param stageId Stage id.
   * @param recordId Record id.
   * @returns Deterministic key.
   */
  private buildExecutionKey(executionId: string, stageId: string, recordId: string): string {
    return `${executionId}:${stageId}:${recordId}`;
  }

  /**
   * Compares records by timestamp first, then by record id for deterministic ties.
   * @param left Left audit record.
   * @param right Right audit record.
   * @returns Sort comparator value.
   */
  private compareByRecordedAtThenRecordId(
    left: PersistedAuditRecord,
    right: PersistedAuditRecord,
  ): number {
    const timestampCompare = left.recordedAt.localeCompare(right.recordedAt);
    if (timestampCompare !== 0) {
      return timestampCompare;
    }

    return left.recordId.localeCompare(right.recordId);
  }

  /**
   * Reads one required string field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed string.
   */
  private readRequiredString(candidate: unknown, fieldName: string): string {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.AUDIT_RECORD_INVALID,
      `Audit event field "${fieldName}" must be a non-empty string.`,
      { fieldName },
    );
  }

  /**
   * Reads one optional string field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed string or undefined.
   */
  private readOptionalString(candidate: unknown, fieldName: string): string | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.AUDIT_RECORD_INVALID,
      `Audit event field "${fieldName}" must be a non-empty string when provided.`,
      { fieldName },
    );
  }

  /**
   * Reads one optional dependency-resolution status with strict enum validation.
   * @param candidate Candidate value.
   * @returns Parsed status or undefined.
   */
  private readOptionalDependencyResolutionStatus(
    candidate: unknown,
  ): AuditEventRecord["dependencyResolutionStatus"] | undefined {
    const status = this.readOptionalString(candidate, "dependencyResolutionStatus");
    if (status === undefined) {
      return undefined;
    }

    if (!DEPENDENCY_RESOLUTION_STATUS_VALUES.has(status)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "dependencyResolutionStatus" must be one of ${Array.from(
          DEPENDENCY_RESOLUTION_STATUS_VALUES,
        ).join(", ")} when provided.`,
        {
          fieldName: "dependencyResolutionStatus",
          value: status,
        },
      );
    }

    return status as AuditEventRecord["dependencyResolutionStatus"];
  }

  /**
   * Reads one optional string array field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed array or undefined.
   */
  private readOptionalStringArray(candidate: unknown, fieldName: string): string[] | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (!Array.isArray(candidate) || candidate.some((value) => typeof value !== "string")) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "${fieldName}" must be a string array when provided.`,
        { fieldName },
      );
    }

    return candidate;
  }

  /**
   * Reads one optional number field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed number or undefined.
   */
  private readOptionalNumber(candidate: unknown, fieldName: string): number | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.AUDIT_RECORD_INVALID,
      `Audit event field "${fieldName}" must be a finite number when provided.`,
      { fieldName },
    );
  }

  /**
   * Reads one optional boolean field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed boolean or undefined.
   */
  private readOptionalBoolean(candidate: unknown, fieldName: string): boolean | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate === "boolean") {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.AUDIT_RECORD_INVALID,
      `Audit event field "${fieldName}" must be a boolean when provided.`,
      { fieldName },
    );
  }

  /**
   * Reads one object field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed object.
   */
  private readRecord(candidate: unknown, fieldName: string): Record<string, unknown> {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }

    throw new RuntimeError(
      GovernorErrorCode.AUDIT_RECORD_INVALID,
      `Audit event field "${fieldName}" must be an object.`,
      { fieldName },
    );
  }

  /**
   * Reads one required display timestamp field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed display timestamp string.
   */
  private readDisplayTimestamp(candidate: unknown, fieldName: string): string {
    const timestamp = this.readRequiredString(candidate, fieldName);
    if (!DISPLAY_TIMESTAMP_PATTERN.test(timestamp)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "${fieldName}" must use format YYYY-MM-DD HH:mm:ss UTC±HH:MM.`,
        { fieldName, value: timestamp },
      );
    }

    return timestamp;
  }

  /**
   * Reads one optional display timestamp field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed timestamp string or undefined.
   */
  private readOptionalDisplayTimestamp(candidate: unknown, fieldName: string): string | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    return this.readDisplayTimestamp(candidate, fieldName);
  }

  /**
   * Resolves one RFC3339 seconds timestamp value.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed RFC3339 seconds string.
   */
  private resolveRfc3339SecondsTimestamp(candidate: unknown, fieldName: string): string {
    if (candidate === undefined) {
      return new Date().toISOString().replace(/\.\d{3}Z$/u, "Z");
    }

    const timestamp = this.readRequiredString(candidate, fieldName);
    if (!RFC3339_SECONDS_PATTERN.test(timestamp)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "${fieldName}" must be RFC3339 seconds precision.`,
        { fieldName, value: timestamp },
      );
    }

    return timestamp;
  }
}
