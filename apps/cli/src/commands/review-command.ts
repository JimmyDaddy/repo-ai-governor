import { resolve } from "node:path";

import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
} from "@repo-ai-governor/orchestration-service-client";
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
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    const reviewQueueDirectories = context.reviewQueueRuntime.resolveReviewQueueDirectories();
    const requestId = `review-${Date.now()}`;
    const requestPath = resolve(reviewQueueDirectories.requestDirectoryPath, `${requestId}.json`);
    const correlationId = `review-chain-${requestId}`;
    const taskId = runtimeDebugOptions.taskId;
    const executionSessionId = `session-${requestId}`;
    const managedLedgerBackfill =
      runtimeDebugOptions.recordLedger === true && typeof taskId === "string";
    const reviewVerifyAction = managedLedgerBackfill
      ? `Execute \`repo-ai-governor review-verify --record-ledger --task-id ${taskId}\` to continue managed review chain.`
      : "Execute `repo-ai-governor review-verify` to consume queued review request.";
    const streamMetadata = await context.resolveExecutionStreamMetadata();
    const orchestrationExecution = await context.orchestrationServiceRuntime.startExecution(
      {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        executionKind: OrchestrationExecutionKind.REVIEW,
        clientSurface: OrchestrationClientSurface.CLI,
        locale: context.options.locale,
        outputMode: context.options.outputMode,
        ...(taskId ? { taskId } : {}),
        ...streamMetadata,
      },
      {
        executionId: requestId,
        executionSessionId,
        processId: "review-queue",
      },
    );
    await context.artifactWriter.writeJsonArtifact(requestPath, {
      requestId,
      status: CLI_REVIEW_REQUEST_STATUS.QUEUED,
      createdAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspaceId: context.options.workspace.workspaceId,
      workspaceRoot: context.options.workspace.workspaceRoot,
      locale: context.options.locale,
      outputMode: context.options.outputMode,
      ...(taskId ? { taskId } : {}),
      recordLedger: managedLedgerBackfill,
      diagnosticContext: {
        correlationId,
        queueStage: "review",
        chain: "review->review-verify->ledger-backfill",
        ...(taskId ? { taskId } : {}),
        reviewChainMode: managedLedgerBackfill ? "managed_task_chain" : "queued_external_chain",
      },
      orchestrationExecutionId: orchestrationExecution.executionId,
      orchestrationEventStreamToken: orchestrationExecution.eventStreamToken,
    });
    await context.orchestrationServiceRuntime.publishEvent({
      executionId: requestId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: OrchestrationExecutionStatus.RUNNING,
      artifactId: "review_request",
      artifactPath: requestPath,
      message: `Queued review request artifact at ${requestPath}.`,
    });
    await context.orchestrationServiceRuntime.publishEvent({
      executionId: requestId,
      type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
      status: OrchestrationExecutionStatus.COMPLETED,
      message: `Review queue request ${requestId} completed.`,
    });
    const orchestrationSummary = await context.orchestrationServiceRuntime.getExecution(
      orchestrationExecution.executionId,
    );

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
          detail: taskId ? `chain=${correlationId} task_id=${taskId}` : `chain=${correlationId}`,
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
          action: reviewVerifyAction,
          blocking: true,
        },
      ],
      layeredLogs: {
        summary: [
          `review_request=${requestId}`,
          "chain=review->review-verify->ledger-backfill",
          `managed_ledger_backfill=${managedLedgerBackfill}`,
        ],
        detailed: [
          `request_path=${requestPath}`,
          `correlation_id=${correlationId}`,
          ...(taskId ? [`task_id=${taskId}`] : []),
        ],
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
        details: {
          orchestration_execution_id: orchestrationExecution.executionId,
          orchestration_event_stream_token: orchestrationExecution.eventStreamToken,
          orchestration_status:
            orchestrationSummary?.status ?? OrchestrationExecutionStatus.COMPLETED,
          orchestration_service_host_kind:
            orchestrationSummary?.serviceHostKind ?? orchestrationExecution.serviceHostKind,
          orchestration_service_transport_kind:
            orchestrationSummary?.serviceTransportKind ??
            orchestrationExecution.serviceTransportKind,
          orchestration_latest_event_sequence:
            orchestrationSummary?.latestEventSequence ?? orchestrationExecution.latestEventSequence,
          orchestration_next_cursor:
            orchestrationSummary?.nextCursor ?? orchestrationExecution.nextCursor,
        },
      },
    };
  }
}
