import { resolve } from "node:path";

import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
} from "@repo-ai-governor/shared";
import { CliCommandName } from "../constants/cli-command.constant.js";
import {
  CLI_REVIEW_REQUEST_STATUS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from "../constants/cli-governance-runtime.constant.js";
import type { CliCommandExecutorContext } from "../types/interfaces/cli-governance-runtime.interface.js";
import type { CliCommandExecutor } from "./cli-command-executor.interface.js";

/**
 * Owns `review` command execution outside the runtime facade.
 */
export class CliReviewCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.REVIEW;

  public async execute(context: CliCommandExecutorContext) {
    const reviewQueueDirectories = context.reviewQueueRuntime.resolveReviewQueueDirectories();
    const requestId = `review-${Date.now()}`;
    const requestPath = resolve(reviewQueueDirectories.requestDirectoryPath, `${requestId}.json`);
    const correlationId = `review-chain-${requestId}`;
    await context.artifactWriter.writeJsonArtifact(requestPath, {
      requestId,
      status: CLI_REVIEW_REQUEST_STATUS.QUEUED,
      createdAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspaceId: context.options.workspace.workspaceId,
      workspaceRoot: context.options.workspace.workspaceRoot,
      locale: context.options.locale,
      outputMode: context.options.outputMode,
      diagnosticContext: {
        correlationId,
        queueStage: "review",
        chain: "review->review-verify->ledger-backfill",
      },
    });

    const message = `Review request queued at ${requestPath}.`;
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: "reviewer",
          stage: ExecutionProgressStage.REVIEW,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: "Review request artifact queued.",
          detail: `request_id=${requestId}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW,
            artifactPath: requestPath,
          },
        },
        {
          roleId: "verifier",
          stage: ExecutionProgressStage.REVIEW_VERIFY,
          status: ExecutionProgressStatus.QUEUED,
          category: ExecutionInteractionCategory.POLICY_WAITING,
          summary: "Awaiting review-verify consumption.",
          detail: `chain=${correlationId}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW_VERIFY,
            artifactPath: requestPath,
          },
        },
      ],
      interactionPrompts: [
        {
          category: ExecutionInteractionCategory.POLICY_WAITING,
          stage: ExecutionProgressStage.REVIEW_VERIFY,
          title: "Run review-verify",
          action: "Execute `repo-ai-governor review-verify` to consume queued review request.",
          blocking: true,
        },
      ],
      layeredLogs: {
        summary: [`review_request=${requestId}`, "chain=review->review-verify->ledger-backfill"],
        detailed: [`request_path=${requestPath}`, `correlation_id=${correlationId}`],
      },
    });
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.REVIEW_QUEUE,
        summary: message,
        check_totals: {
          pass: 1,
          warn: 0,
          fail: 0,
        },
        checks: [
          {
            id: "review_request",
            status: CliGovernanceCheckStatus.PASS,
            detail: requestId,
          },
        ],
        artifacts: [
          {
            id: "review_request",
            path: requestPath,
          },
        ],
        experience,
      },
    };
  }
}
