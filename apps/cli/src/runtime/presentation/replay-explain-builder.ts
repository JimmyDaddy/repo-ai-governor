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
    return this.replayExplainer.explain({
      snapshot,
      limit,
    });
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
      };
    }

    if (this.isReplayExplainPayload(options.replayPayload)) {
      return {
        sourceType: CLI_RUN_REPLAY_SOURCE_TYPE.REPLAY_EXPLAIN,
        executionId: options.replayPayload.executionId,
        explainResult: options.replayPayload,
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
}
