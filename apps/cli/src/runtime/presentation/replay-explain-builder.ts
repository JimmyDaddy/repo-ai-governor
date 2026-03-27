import {
  type ExecutionReport,
  type ReplayExplainResult,
  ReplayExplainer,
} from "@repo-ai-governor/reporting";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { CLI_RUN_REPLAY_SOURCE_TYPE } from "../../constants/cli-governance-runtime.constant.js";

export interface CliReplayExplainResolution {
  sourceType: string;
  executionId: string;
  explainResult: ReplayExplainResult;
  memorySemantics?: {
    contextSelectedCount: number;
    contextAssemblyOutcome: string;
    promotionOutcome: string | null;
    plannedMergeCount: number;
    mergedCount: number;
    sessionSummaryProjectionKey: string | null;
  } | null;
}

/**
 * Owns replay-explain resolution so replay/report shape parsing stays outside the runtime facade.
 */
export class CliReplayExplainBuilder {
  private readonly replayExplainer = new ReplayExplainer();

  /**
   * Builds one replay-explain payload from an execution report.
   * @param report Execution report payload.
   * @param limit Max replay lines to include.
   * @returns Replay-explain result.
   */
  public buildFromExecutionReport(report: ExecutionReport, limit = 1): ReplayExplainResult {
    const snapshot = this.replayExplainer.createSnapshot({
      report,
    });
    const explainResult = this.replayExplainer.explain({
      snapshot,
      limit,
    });
    const memorySemanticsExplainLines = this.buildMemorySemanticsExplainLines(report);
    if (memorySemanticsExplainLines.length === 0) {
      return explainResult;
    }

    return {
      ...explainResult,
      explainLines: [...explainResult.explainLines, ...memorySemanticsExplainLines],
    };
  }

  /**
   * Resolves replay-explain result from one accepted replay source payload.
   * @param options Replay source context.
   * @returns Replay explain resolution payload.
   */
  public resolveReplayExplainPayload(options: {
    replayPath: string;
    replayPayload: unknown;
  }): CliReplayExplainResolution {
    if (this.isExecutionReportPayload(options.replayPayload)) {
      return {
        sourceType: CLI_RUN_REPLAY_SOURCE_TYPE.EXECUTION_REPORT,
        executionId: options.replayPayload.executionId,
        explainResult: this.buildFromExecutionReport(options.replayPayload, 10),
        memorySemantics: this.extractMemorySemanticsSummary(options.replayPayload),
      };
    }

    if (this.isReplayExplainPayload(options.replayPayload)) {
      return {
        sourceType: CLI_RUN_REPLAY_SOURCE_TYPE.REPLAY_EXPLAIN,
        executionId: options.replayPayload.executionId,
        explainResult: options.replayPayload,
        memorySemantics: null,
      };
    }

    throw new RuntimeError(
      GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
      `Replay source payload is unsupported: ${options.replayPath}.`,
      {
        replayPath: options.replayPath,
      },
    );
  }

  /**
   * Determines whether one payload matches execution report shape.
   * @param payload Replay source payload candidate.
   * @returns True when payload can be treated as execution report.
   */
  private isExecutionReportPayload(payload: unknown): payload is ExecutionReport {
    if (!payload || typeof payload !== "object") {
      return false;
    }

    const candidate = payload as Record<string, unknown>;
    return (
      typeof candidate.executionId === "string" &&
      Array.isArray(candidate.stageSummaries) &&
      Array.isArray(candidate.replayPointers) &&
      typeof candidate.generatedAt === "string"
    );
  }

  /**
   * Determines whether one payload matches replay-explain result shape.
   * @param payload Replay source payload candidate.
   * @returns True when payload can be treated as replay-explain result.
   */
  private isReplayExplainPayload(payload: unknown): payload is ReplayExplainResult {
    if (!payload || typeof payload !== "object") {
      return false;
    }

    const candidate = payload as Record<string, unknown>;
    return (
      typeof candidate.executionId === "string" &&
      typeof candidate.matchedCount === "number" &&
      Array.isArray(candidate.pointers) &&
      Array.isArray(candidate.explainLines) &&
      candidate.query !== null &&
      typeof candidate.query === "object"
    );
  }

  /**
   * Extracts one stable memory-semantics summary from execution report payload.
   * @param report Execution report payload.
   * @returns Replay-facing memory semantics summary.
   */
  private extractMemorySemanticsSummary(
    report: ExecutionReport,
  ): CliReplayExplainResolution["memorySemantics"] {
    if (!report.memorySemantics) {
      return null;
    }

    return {
      contextSelectedCount: report.memorySemantics.contextSummary.selectedRecordCount,
      contextAssemblyOutcome: report.memorySemantics.contextSummary.assemblyOutcome,
      promotionOutcome: report.memorySemantics.promotion?.outcome ?? null,
      plannedMergeCount: report.memorySemantics.promotion?.plannedMergeCount ?? 0,
      mergedCount: report.memorySemantics.promotion?.mergedCount ?? 0,
      sessionSummaryProjectionKey:
        report.memorySemantics.promotion?.sessionSummaryProjection?.key ?? null,
    };
  }

  /**
   * Builds replay-explain lines for memory-semantics facts when execution report carries them.
   * @param report Execution report payload.
   * @returns Stable explain lines appended to replay diagnostics.
   */
  private buildMemorySemanticsExplainLines(report: ExecutionReport): string[] {
    const memorySemantics = this.extractMemorySemanticsSummary(report);
    if (!memorySemantics) {
      return [];
    }

    return [
      `memory_context_selected=${memorySemantics.contextSelectedCount}`,
      `memory_context_outcome=${memorySemantics.contextAssemblyOutcome}`,
      `memory_promotion_outcome=${memorySemantics.promotionOutcome ?? "none"}`,
      `memory_promotion_planned_merge_count=${memorySemantics.plannedMergeCount}`,
      `memory_promotion_merged_count=${memorySemantics.mergedCount}`,
      `memory_session_projection_key=${memorySemantics.sessionSummaryProjectionKey ?? "none"}`,
    ];
  }
}
