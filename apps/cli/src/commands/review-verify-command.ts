import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
} from "@repo-ai-governor/shared";
import { CliCommandName } from "../constants/cli-command.constant.js";
import {
  CLI_DIAGNOSTIC_ROOT_CAUSE,
  CLI_REVIEW_LEDGER_BACKFILL_STATUS,
  CLI_REVIEW_REQUEST_STATUS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from "../constants/cli-governance-runtime.constant.js";
import type { CliCommandExecutorContext } from "../types/interfaces/cli-governance-runtime.interface.js";
import type { CliCommandExecutor } from "./cli-command-executor.interface.js";

/**
 * Owns `review-verify` command execution outside the runtime facade.
 */
export class CliReviewVerifyCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.REVIEW_VERIFY;

  public async execute(context: CliCommandExecutorContext) {
    const reviewQueueDirectories = context.reviewQueueRuntime.resolveReviewQueueDirectories();
    await mkdir(reviewQueueDirectories.requestDirectoryPath, { recursive: true });
    await mkdir(reviewQueueDirectories.resultDirectoryPath, { recursive: true });

    const queuedRequestArtifacts =
      await context.reviewQueueRuntime.collectQueuedReviewRequestArtifacts(reviewQueueDirectories);

    if (queuedRequestArtifacts.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        "review-verify requires at least one queued review request artifact.",
      );
    }

    const latestQueuedRequest =
      queuedRequestArtifacts[queuedRequestArtifacts.length - 1] ?? queuedRequestArtifacts[0];
    if (!latestQueuedRequest) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        "review-verify failed to resolve queued request artifact.",
      );
    }

    const verifyId = `review-verify-${Date.now()}`;
    const verifyPath = resolve(reviewQueueDirectories.resultDirectoryPath, `${verifyId}.json`);
    const requestPayload = await context.artifactWriter.safeReadJson(latestQueuedRequest.filePath);
    const sourceRequestId =
      typeof requestPayload?.requestId === "string"
        ? requestPayload.requestId
        : latestQueuedRequest.requestId;
    const diagnosticContext =
      requestPayload &&
      typeof requestPayload.diagnosticContext === "object" &&
      requestPayload.diagnosticContext
        ? (requestPayload.diagnosticContext as Record<string, unknown>)
        : null;
    const correlationId =
      diagnosticContext && typeof diagnosticContext.correlationId === "string"
        ? diagnosticContext.correlationId
        : `review-chain-${sourceRequestId}`;
    const ledgerBackfillPath = resolve(
      context.options.workspace.workspaceRoot,
      "context",
      "ledger-backfill",
      "review-verify",
      `${verifyId}.json`,
    );
    const verifiedAt = context.toRfc3339SecondsTimestamp(new Date());

    await context.artifactWriter.writeJsonArtifact(ledgerBackfillPath, {
      ledgerBackfillId: `ledger-backfill-${verifyId}`,
      status: CLI_REVIEW_LEDGER_BACKFILL_STATUS.PENDING,
      createdAt: verifiedAt,
      verifyId,
      sourceRequestId,
      sourceRequestPath: latestQueuedRequest.filePath,
      workspaceId: context.options.workspace.workspaceId,
      workspaceRoot: context.options.workspace.workspaceRoot,
      attribution: {
        correlationId,
        chain: "review->review-verify->ledger-backfill",
        chainStep: "ledger-backfill",
      },
      diagnostics: {
        rootCause: CLI_DIAGNOSTIC_ROOT_CAUSE.NONE,
        note: "Ready for tasks/checklist/csv backfill consumption.",
      },
    });

    await context.artifactWriter.writeJsonArtifact(verifyPath, {
      verifyId,
      status: CLI_REVIEW_REQUEST_STATUS.VERIFIED,
      verifiedAt,
      sourceRequestPath: latestQueuedRequest.filePath,
      sourceRequestId,
      ledgerBackfillPath,
      diagnosticAttribution: {
        correlationId,
        chain: "review->review-verify->ledger-backfill",
        chainStep: "review-verify",
      },
    });

    await context.artifactWriter.writeJsonArtifact(latestQueuedRequest.filePath, {
      ...(requestPayload ?? {}),
      requestId: sourceRequestId,
      status: CLI_REVIEW_REQUEST_STATUS.VERIFIED,
      verifiedAt,
      consumedAt: verifiedAt,
      consumedByVerifyId: verifyId,
      ledgerBackfillPath,
      diagnosticContext: {
        ...(diagnosticContext ?? {}),
        correlationId,
        queueStage: "review-verify-consumed",
        chain: "review->review-verify->ledger-backfill",
      },
    });

    const message = `Review request verified from ${latestQueuedRequest.filePath}.`;
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: "verifier",
          stage: ExecutionProgressStage.REVIEW_VERIFY,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: "Review verification artifact persisted.",
          detail: `verify_id=${verifyId}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW_VERIFY,
            artifactPath: verifyPath,
          },
        },
        {
          roleId: "ledger-backfill",
          stage: ExecutionProgressStage.LEDGER_BACKFILL,
          status: ExecutionProgressStatus.WAITING,
          category: ExecutionInteractionCategory.POLICY_WAITING,
          summary: "Ledger backfill pending downstream task ledger consumption.",
          detail: `source_request_id=${sourceRequestId}`,
          backlink: {
            stageId: ExecutionProgressStage.LEDGER_BACKFILL,
            artifactPath: ledgerBackfillPath,
          },
        },
      ],
      interactionPrompts: [
        {
          category: ExecutionInteractionCategory.POLICY_WAITING,
          stage: ExecutionProgressStage.LEDGER_BACKFILL,
          title: "Consume ledger-backfill artifact",
          action:
            "Apply ledger-backfill payload into tasks/checklist/tasks.csv to close review chain.",
          blocking: true,
        },
      ],
      layeredLogs: {
        summary: [`verify_id=${verifyId}`, "chain=review->review-verify->ledger-backfill"],
        detailed: [
          `verify_path=${verifyPath}`,
          `ledger_backfill_path=${ledgerBackfillPath}`,
          `source_request_path=${latestQueuedRequest.filePath}`,
        ],
      },
    });
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.REVIEW_VERIFY,
        summary: message,
        check_totals: {
          pass: 1,
          warn: 0,
          fail: 0,
        },
        checks: [
          {
            id: "review_verify",
            status: CliGovernanceCheckStatus.PASS,
            detail: latestQueuedRequest.fileName,
          },
        ],
        artifacts: [
          {
            id: "review_verify_result",
            path: verifyPath,
          },
          {
            id: "review_ledger_backfill",
            path: ledgerBackfillPath,
          },
        ],
        experience,
      },
    };
  }
}
