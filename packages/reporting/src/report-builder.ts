import { AuditRecordStatus, type PersistedAuditRecord } from "@repo-ai-governor/core-session";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import type {
  AuditRecordReader,
  BuildExecutionReportOptions,
  ExecutionReport,
  ReplayPointer,
  ReportStatusBreakdown,
} from "./types/index.js";

interface MutableStageAggregate {
  stageId: string;
  routeKeys: Set<string>;
  totalRecords: number;
  statusBreakdown: ReportStatusBreakdown;
  firstRecordedAt: string;
  lastRecordedAt: string;
  failedRecordCount: number;
  timedOutRecordCount: number;
}

/**
 * Builds execution-level report payloads from normalized audit records.
 *
 * Why this exists:
 * report/replay/output layers need one shared aggregation contract so every
 * surface can reuse the same execution summary and trace pointers.
 */
export class ReportBuilder {
  public constructor(private readonly auditRecordReader: AuditRecordReader) {}

  /**
   * Builds one execution report from audit records.
   * @param options Build request options.
   * @returns Structured report payload with stage/risk/failure summaries.
   */
  public async buildExecutionReport(
    options: BuildExecutionReportOptions,
  ): Promise<ExecutionReport> {
    const executionId = this.readRequiredString(options.executionId, "executionId");
    const stageId = this.readOptionalString(options.stageId, "stageId");
    const limit = this.readOptionalPositiveInteger(options.limit, "limit");
    const includeRecords = this.readOptionalBoolean(options.includeRecords, "includeRecords");
    const memorySemantics = options.memorySemantics ?? null;

    const records = await this.auditRecordReader.listEvents({
      executionId,
      ...(stageId ? { stageId } : {}),
      ...(limit !== undefined ? { limit } : {}),
    });
    const filteredRecords = this.filterAndSortRecords(records, executionId, stageId);

    const stageAggregates = new Map<string, MutableStageAggregate>();
    const riskLevelSet = new Set<string>();
    const riskReasonSet = new Set<string>();
    const matchedPolicySet = new Set<string>();
    const requiredActionSet = new Set<string>();
    const failedRecordIds: string[] = [];
    const cancelledRecordIds: string[] = [];
    const timeoutRecordIds: string[] = [];
    const replayPointers: ReplayPointer[] = [];

    for (const record of filteredRecords) {
      const event = record.event;
      const stageAggregate = this.ensureStageAggregate(stageAggregates, record);
      stageAggregate.routeKeys.add(event.routeKey);
      stageAggregate.totalRecords += 1;
      stageAggregate.firstRecordedAt = this.pickEarlierTimestamp(
        stageAggregate.firstRecordedAt,
        record.recordedAt,
      );
      stageAggregate.lastRecordedAt = this.pickLaterTimestamp(
        stageAggregate.lastRecordedAt,
        record.recordedAt,
      );
      stageAggregate.statusBreakdown[event.status] =
        (stageAggregate.statusBreakdown[event.status] ?? 0) + 1;

      if (event.status === AuditRecordStatus.FAILED) {
        failedRecordIds.push(record.recordId);
        stageAggregate.failedRecordCount += 1;
      }

      if (event.status === AuditRecordStatus.CANCELLED) {
        cancelledRecordIds.push(record.recordId);
      }

      if (event.timeoutIndicator === true) {
        timeoutRecordIds.push(record.recordId);
        stageAggregate.timedOutRecordCount += 1;
      }

      if (event.riskLevel) {
        riskLevelSet.add(event.riskLevel);
      }

      for (const riskReason of event.riskReasons ?? []) {
        riskReasonSet.add(riskReason);
      }

      for (const matchedPolicy of event.matchedPolicies ?? []) {
        matchedPolicySet.add(matchedPolicy);
      }

      if (event.requiredAction) {
        requiredActionSet.add(event.requiredAction);
      }

      replayPointers.push(this.toReplayPointer(record));
    }

    const stageSummaries = Array.from(stageAggregates.values())
      .sort((left, right) => {
        const firstRecordedAtCompare = left.firstRecordedAt.localeCompare(right.firstRecordedAt);
        if (firstRecordedAtCompare !== 0) {
          return firstRecordedAtCompare;
        }

        return left.stageId.localeCompare(right.stageId);
      })
      .map((aggregate) => ({
        stageId: aggregate.stageId,
        routeKeys: Array.from(aggregate.routeKeys.values()).sort((left, right) =>
          left.localeCompare(right),
        ),
        totalRecords: aggregate.totalRecords,
        statusBreakdown: aggregate.statusBreakdown,
        firstRecordedAt: aggregate.firstRecordedAt,
        lastRecordedAt: aggregate.lastRecordedAt,
        failedRecordCount: aggregate.failedRecordCount,
        timedOutRecordCount: aggregate.timedOutRecordCount,
      }));

    return {
      executionId,
      generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
      totalRecords: filteredRecords.length,
      stageSummaries,
      riskSummary: {
        riskLevels: this.sortStableValues(riskLevelSet),
        riskReasons: this.sortStableValues(riskReasonSet),
        matchedPolicies: this.sortStableValues(matchedPolicySet),
        requiredActions: this.sortStableValues(requiredActionSet),
      },
      failureSummary: {
        failedRecordIds,
        cancelledRecordIds,
        timeoutRecordIds,
      },
      replayPointers,
      ...(memorySemantics ? { memorySemantics } : {}),
      ...(includeRecords ? { records: filteredRecords } : {}),
    };
  }

  /**
   * Filters and validates records for one report request.
   * @param records Raw records from audit reader.
   * @param executionId Requested execution id.
   * @param stageId Optional stage filter.
   * @returns Deterministically sorted records.
   */
  private filterAndSortRecords(
    records: PersistedAuditRecord[],
    executionId: string,
    stageId?: string,
  ): PersistedAuditRecord[] {
    if (!Array.isArray(records)) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_BUILD_INPUT_INVALID,
        "Audit record reader must return an array payload.",
      );
    }

    return records
      .filter((record) => {
        if (!record || typeof record !== "object") {
          throw new RuntimeError(
            GovernorErrorCode.REPORT_BUILD_INPUT_INVALID,
            "Audit record row must be an object.",
          );
        }

        if (record.event.executionId !== executionId) {
          throw new RuntimeError(
            GovernorErrorCode.REPORT_BUILD_INPUT_INVALID,
            "Audit record executionId does not match report request.",
            {
              requestedExecutionId: executionId,
              actualExecutionId: record.event.executionId,
              recordId: record.recordId,
            },
          );
        }

        if (!stageId) {
          return true;
        }

        return record.event.stageId === stageId;
      })
      .sort((left, right) => this.compareByRecordedAtThenRecordId(left, right));
  }

  /**
   * Compares persisted records by timestamp and record id to keep ties deterministic.
   * @param left Left record.
   * @param right Right record.
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
   * Creates one stage aggregate on-demand to keep report output deterministic.
   * @param stageAggregates Stage aggregate map.
   * @param record Persisted audit record.
   * @returns Mutable stage aggregate.
   */
  private ensureStageAggregate(
    stageAggregates: Map<string, MutableStageAggregate>,
    record: PersistedAuditRecord,
  ): MutableStageAggregate {
    const stageId = this.readRequiredString(record.event.stageId, "record.event.stageId");
    const existing = stageAggregates.get(stageId);
    if (existing) {
      return existing;
    }

    const created: MutableStageAggregate = {
      stageId,
      routeKeys: new Set<string>(),
      totalRecords: 0,
      statusBreakdown: {},
      firstRecordedAt: record.recordedAt,
      lastRecordedAt: record.recordedAt,
      failedRecordCount: 0,
      timedOutRecordCount: 0,
    };
    stageAggregates.set(stageId, created);
    return created;
  }

  /**
   * Converts one persisted audit record into replay pointer payload.
   * @param record Persisted audit record.
   * @returns Replay pointer.
   */
  private toReplayPointer(record: PersistedAuditRecord): ReplayPointer {
    const event = record.event;
    return {
      recordId: this.readRequiredString(record.recordId, "record.recordId"),
      recordedAt: this.readRequiredString(record.recordedAt, "record.recordedAt"),
      stageId: this.readRequiredString(event.stageId, "record.event.stageId"),
      routeKey: this.readRequiredString(event.routeKey, "record.event.routeKey"),
      status: event.status,
      policyOutcome: this.readRequiredString(event.policyOutcome, "record.event.policyOutcome"),
      ...(event.riskLevel ? { riskLevel: event.riskLevel } : {}),
      ...(event.artifactId ? { artifactId: event.artifactId } : {}),
      ...(event.dependencyResolutionStatus
        ? { dependencyResolutionStatus: event.dependencyResolutionStatus }
        : {}),
      ...(event.outputMode ? { outputMode: event.outputMode } : {}),
      ...(event.outputLocale ? { outputLocale: event.outputLocale } : {}),
    };
  }

  /**
   * Keeps lexical timestamp ordering deterministic for aggregate boundaries.
   * @param left Current aggregate timestamp.
   * @param right Candidate timestamp.
   * @returns Earlier timestamp.
   */
  private pickEarlierTimestamp(left: string, right: string): string {
    return left.localeCompare(right) <= 0 ? left : right;
  }

  /**
   * Keeps lexical timestamp ordering deterministic for aggregate boundaries.
   * @param left Current aggregate timestamp.
   * @param right Candidate timestamp.
   * @returns Later timestamp.
   */
  private pickLaterTimestamp(left: string, right: string): string {
    return left.localeCompare(right) >= 0 ? left : right;
  }

  /**
   * Sorts set values for stable report snapshots.
   * @param values Source set.
   * @returns Sorted value list.
   */
  private sortStableValues(values: Set<string>): string[] {
    return Array.from(values.values()).sort((left, right) => left.localeCompare(right));
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
        GovernorErrorCode.REPORT_BUILD_INPUT_INVALID,
        `Field "${fieldName}" must be a non-empty string.`,
        { fieldName },
      );
    }

    return candidate.trim();
  }

  /**
   * Validates one optional string field.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @returns Trimmed string or undefined.
   */
  private readOptionalString(candidate: unknown, fieldName: string): string | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    return this.readRequiredString(candidate, fieldName);
  }

  /**
   * Validates one optional positive integer field.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @returns Integer value or undefined.
   */
  private readOptionalPositiveInteger(candidate: unknown, fieldName: string): number | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (!Number.isInteger(candidate) || (candidate as number) < 1) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_BUILD_INPUT_INVALID,
        `Field "${fieldName}" must be an integer greater than 0 when provided.`,
        {
          fieldName,
          value: candidate,
        },
      );
    }

    return candidate as number;
  }

  /**
   * Validates one optional boolean field.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @returns Boolean value.
   */
  private readOptionalBoolean(candidate: unknown, fieldName: string): boolean {
    if (candidate === undefined) {
      return false;
    }

    if (typeof candidate !== "boolean") {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_BUILD_INPUT_INVALID,
        `Field "${fieldName}" must be a boolean when provided.`,
        {
          fieldName,
          value: candidate,
        },
      );
    }

    return candidate;
  }

  /**
   * Converts date to RFC3339 seconds precision for stable snapshot fields.
   * @param date Input date.
   * @returns Timestamp without milliseconds.
   */
  private toRfc3339SecondsTimestamp(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/u, "Z");
  }
}
