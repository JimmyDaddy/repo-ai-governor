import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  DEFAULT_REPLAY_EXPLAIN_LIMIT,
  MAX_REPLAY_EXPLAIN_LIMIT,
  NO_REPLAY_MATCH_EXPLAIN_LINE,
} from "./constants/index.js";
import type {
  CreateReplaySnapshotOptions,
  ExplainReplayOptions,
  ReplayExplainResult,
  ReplayPointer,
  ReplaySnapshot,
} from "./types/index.js";

/**
 * Builds replay snapshots and explain output from report pointers.
 *
 * Why this exists:
 * replay consumers need one deterministic index contract so CLI and audit tools
 * can resolve evidence quickly without rebuilding ad-hoc filters.
 */
export class ReplayExplainer {
  /**
   * Creates one replay snapshot from execution report payload.
   * @param options Snapshot creation options.
   * @returns Replay snapshot with record/stage/route indexes.
   */
  public createSnapshot(options: CreateReplaySnapshotOptions): ReplaySnapshot {
    if (!options || typeof options !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        "Replay snapshot options must be an object.",
      );
    }

    const report = options.report;
    if (!report || typeof report !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        "Replay snapshot requires a report payload.",
      );
    }

    const executionId = this.readRequiredString(report.executionId, "report.executionId");
    const generatedAt = this.readRequiredString(report.generatedAt, "report.generatedAt");
    if (!Array.isArray(report.replayPointers)) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        "Replay snapshot requires report.replayPointers array.",
      );
    }

    const pointerByRecordId: Record<string, ReplayPointer> = {};
    const stageIndex: Record<string, string[]> = {};
    const routeIndex: Record<string, string[]> = {};

    for (const pointer of report.replayPointers) {
      const normalizedPointer = this.normalizePointer(pointer);
      if (pointerByRecordId[normalizedPointer.recordId]) {
        throw new RuntimeError(
          GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
          "Replay pointer recordId must be unique in one snapshot.",
          {
            recordId: normalizedPointer.recordId,
          },
        );
      }

      pointerByRecordId[normalizedPointer.recordId] = normalizedPointer;
      stageIndex[normalizedPointer.stageId] = stageIndex[normalizedPointer.stageId] ?? [];
      stageIndex[normalizedPointer.stageId]?.push(normalizedPointer.recordId);
      routeIndex[normalizedPointer.routeKey] = routeIndex[normalizedPointer.routeKey] ?? [];
      routeIndex[normalizedPointer.routeKey]?.push(normalizedPointer.recordId);
    }

    return {
      executionId,
      generatedAt,
      pointerByRecordId,
      stageIndex,
      routeIndex,
    };
  }

  /**
   * Resolves replay pointers by filters and renders explain lines.
   * @param options Explain request options.
   * @returns Explain payload containing matched pointers and human-readable lines.
   */
  public explain(options: ExplainReplayOptions): ReplayExplainResult {
    if (!options || typeof options !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        "Replay explain options must be an object.",
      );
    }

    const snapshot = this.normalizeSnapshot(options.snapshot);
    const stageId = this.readOptionalString(options.stageId, "stageId");
    const routeKey = this.readOptionalString(options.routeKey, "routeKey");
    const recordId = this.readOptionalString(options.recordId, "recordId");
    const outputLocale = this.readOptionalString(options.outputLocale, "outputLocale");
    const limit = this.readOptionalLimit(options.limit, "limit");

    if (recordId && !snapshot.pointerByRecordId[recordId]) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        "Replay explain recordId was not found in snapshot.",
        {
          recordId,
        },
      );
    }

    const matchedPointers = this.filterPointers(
      snapshot,
      stageId,
      routeKey,
      recordId,
      outputLocale,
      limit,
    );
    const explainLines =
      matchedPointers.length > 0
        ? matchedPointers.map((pointer) => this.renderExplainLine(pointer))
        : [NO_REPLAY_MATCH_EXPLAIN_LINE];

    return {
      executionId: snapshot.executionId,
      query: {
        ...(stageId ? { stageId } : {}),
        ...(routeKey ? { routeKey } : {}),
        ...(recordId ? { recordId } : {}),
        ...(outputLocale ? { outputLocale } : {}),
        limit,
      },
      matchedCount: matchedPointers.length,
      pointers: matchedPointers,
      explainLines,
    };
  }

  /**
   * Filters pointers by optional stage/route/record dimensions.
   * @param snapshot Replay snapshot.
   * @param stageId Optional stage id.
   * @param routeKey Optional route key.
   * @param recordId Optional record id.
   * @param outputLocale Optional output locale.
   * @param limit Result-size ceiling.
   * @returns Matched pointer list.
   */
  private filterPointers(
    snapshot: ReplaySnapshot,
    stageId: string | undefined,
    routeKey: string | undefined,
    recordId: string | undefined,
    outputLocale: string | undefined,
    limit: number,
  ): ReplayPointer[] {
    const allPointers = Object.values(snapshot.pointerByRecordId);
    const filtered = allPointers
      .filter((pointer) => {
        if (recordId && pointer.recordId !== recordId) {
          return false;
        }

        if (stageId && pointer.stageId !== stageId) {
          return false;
        }

        if (routeKey && pointer.routeKey !== routeKey) {
          return false;
        }

        if (outputLocale && pointer.outputLocale !== outputLocale) {
          return false;
        }

        return true;
      })
      .sort((left, right) => this.compareByRecordedAtThenRecordId(left, right));

    return filtered.slice(0, limit);
  }

  /**
   * Compares replay pointers by timestamp and record id for deterministic ties.
   * @param left Left pointer.
   * @param right Right pointer.
   * @returns Sort comparator value.
   */
  private compareByRecordedAtThenRecordId(left: ReplayPointer, right: ReplayPointer): number {
    const timestampCompare = left.recordedAt.localeCompare(right.recordedAt);
    if (timestampCompare !== 0) {
      return timestampCompare;
    }

    return left.recordId.localeCompare(right.recordId);
  }

  /**
   * Renders one explain line with stable key-value ordering.
   * @param pointer Replay pointer row.
   * @returns Explain line string.
   */
  private renderExplainLine(pointer: ReplayPointer): string {
    const segments = [
      `[${pointer.recordedAt}]`,
      `stage=${pointer.stageId}`,
      `route=${pointer.routeKey}`,
      `status=${pointer.status}`,
      `policy=${pointer.policyOutcome}`,
    ];

    if (pointer.riskLevel) {
      segments.push(`risk=${pointer.riskLevel}`);
    }

    if (pointer.artifactId) {
      segments.push(`artifact=${pointer.artifactId}`);
    }

    if (pointer.outputLocale) {
      segments.push(`output_locale=${pointer.outputLocale}`);
    }

    return segments.join(" ");
  }

  /**
   * Normalizes replay snapshot payload.
   * @param snapshot Raw snapshot payload.
   * @returns Normalized replay snapshot.
   */
  private normalizeSnapshot(snapshot: ReplaySnapshot): ReplaySnapshot {
    if (!snapshot || typeof snapshot !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        "Replay explain requires snapshot payload.",
      );
    }

    const executionId = this.readRequiredString(snapshot.executionId, "snapshot.executionId");
    const generatedAt = this.readRequiredString(snapshot.generatedAt, "snapshot.generatedAt");
    const pointerByRecordId = this.readObject(
      snapshot.pointerByRecordId,
      "snapshot.pointerByRecordId",
    ) as Record<string, ReplayPointer>;
    const stageIndex = this.readObject(snapshot.stageIndex, "snapshot.stageIndex") as Record<
      string,
      string[]
    >;
    const routeIndex = this.readObject(snapshot.routeIndex, "snapshot.routeIndex") as Record<
      string,
      string[]
    >;

    return {
      executionId,
      generatedAt,
      pointerByRecordId,
      stageIndex,
      routeIndex,
    };
  }

  /**
   * Normalizes replay pointer payload.
   * @param pointer Raw pointer payload.
   * @returns Normalized pointer.
   */
  private normalizePointer(pointer: ReplayPointer): ReplayPointer {
    if (!pointer || typeof pointer !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        "Replay pointer row must be an object.",
      );
    }

    return {
      recordId: this.readRequiredString(pointer.recordId, "pointer.recordId"),
      recordedAt: this.readRequiredString(pointer.recordedAt, "pointer.recordedAt"),
      stageId: this.readRequiredString(pointer.stageId, "pointer.stageId"),
      routeKey: this.readRequiredString(pointer.routeKey, "pointer.routeKey"),
      status: pointer.status,
      policyOutcome: this.readRequiredString(pointer.policyOutcome, "pointer.policyOutcome"),
      ...(this.readOptionalString(pointer.riskLevel, "pointer.riskLevel")
        ? { riskLevel: this.readOptionalString(pointer.riskLevel, "pointer.riskLevel") }
        : {}),
      ...(this.readOptionalString(pointer.artifactId, "pointer.artifactId")
        ? { artifactId: this.readOptionalString(pointer.artifactId, "pointer.artifactId") }
        : {}),
      ...(this.readOptionalString(
        pointer.dependencyResolutionStatus,
        "pointer.dependencyResolutionStatus",
      )
        ? {
            dependencyResolutionStatus: this.readOptionalString(
              pointer.dependencyResolutionStatus,
              "pointer.dependencyResolutionStatus",
            ) as ReplayPointer["dependencyResolutionStatus"],
          }
        : {}),
      ...(this.readOptionalString(pointer.outputMode, "pointer.outputMode")
        ? {
            outputMode: this.readOptionalString(
              pointer.outputMode,
              "pointer.outputMode",
            ) as ReplayPointer["outputMode"],
          }
        : {}),
      ...(this.readOptionalString(pointer.outputLocale, "pointer.outputLocale")
        ? {
            outputLocale: this.readOptionalString(pointer.outputLocale, "pointer.outputLocale"),
          }
        : {}),
    };
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
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
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
   * Validates one optional explain limit.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @returns Normalized limit.
   */
  private readOptionalLimit(candidate: unknown, fieldName: string): number {
    if (candidate === undefined) {
      return DEFAULT_REPLAY_EXPLAIN_LIMIT;
    }

    if (!Number.isInteger(candidate)) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        `Field "${fieldName}" must be an integer when provided.`,
        {
          fieldName,
          value: candidate,
        },
      );
    }

    if ((candidate as number) < 1 || (candidate as number) > MAX_REPLAY_EXPLAIN_LIMIT) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        `Field "${fieldName}" must be between 1 and ${MAX_REPLAY_EXPLAIN_LIMIT}.`,
        {
          fieldName,
          value: candidate,
        },
      );
    }

    return candidate as number;
  }

  /**
   * Validates one object payload.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @returns Object value.
   */
  private readObject(candidate: unknown, fieldName: string): Record<string, unknown> {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        `Field "${fieldName}" must be an object.`,
        { fieldName },
      );
    }

    return candidate as Record<string, unknown>;
  }
}
