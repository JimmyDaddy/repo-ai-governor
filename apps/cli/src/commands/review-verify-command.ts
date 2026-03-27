import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
} from '@repo-ai-governor/shared';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_DIAGNOSTIC_ROOT_CAUSE,
  CLI_REVIEW_LEDGER_BACKFILL_STATUS,
  CLI_REVIEW_REQUEST_STATUS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import type { CliCommandExecutorContext } from '../types/interfaces/cli-governance-runtime.interface.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

function resolveTaskLedgerSyncScriptPath(): string | null {
  const sourceFilePath = fileURLToPath(import.meta.url);
  const searchRoots = [process.cwd(), dirname(sourceFilePath)];

  for (const searchRoot of searchRoots) {
    let currentDirectory = searchRoot;
    for (let depth = 0; depth < 8; depth += 1) {
      const candidatePath = resolve(
        currentDirectory,
        'scripts',
        'governance',
        'sync-task-ledger.js',
      );
      if (existsSync(candidatePath)) {
        return candidatePath;
      }

      const parentDirectory = resolve(currentDirectory, '..');
      if (parentDirectory === currentDirectory) {
        break;
      }

      currentDirectory = parentDirectory;
    }
  }

  return null;
}

/**
 * Owns `review-verify` command execution outside the runtime facade.
 */
export class CliReviewVerifyCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.REVIEW_VERIFY;

  /**
   * Resolves canonical task id from one queued review request payload.
   * @param requestPayload Parsed queued request payload.
   * @returns Normalized task id or null when the payload is not task-aware.
   */
  private resolveRequestTaskId(requestPayload: Record<string, unknown> | null): string | null {
    return requestPayload &&
      typeof requestPayload.taskId === 'string' &&
      requestPayload.taskId.trim().length > 0
      ? requestPayload.taskId.trim()
      : null;
  }

  /**
   * Selects the queued review request that this verify attempt should consume.
   * @param context Command execution context.
   * @param queuedRequestArtifacts Candidate queued request artifacts.
   * @param requestedTaskId Task id requested through CLI flags.
   * @returns Selected queued request artifact together with its payload.
   */
  private async resolveQueuedRequestSelection(
    context: CliCommandExecutorContext,
    queuedRequestArtifacts: Awaited<
      ReturnType<
        CliCommandExecutorContext['reviewQueueRuntime']['collectQueuedReviewRequestArtifacts']
      >
    >,
    requestedTaskId: string | null,
  ): Promise<{
    queuedRequestArtifact: (typeof queuedRequestArtifacts)[number];
    requestPayload: Record<string, unknown> | null;
  }> {
    const queuedRequestSelections = [];

    for (const queuedRequestArtifact of queuedRequestArtifacts) {
      const requestPayload = await context.artifactWriter.safeReadJson(
        queuedRequestArtifact.filePath,
      );
      queuedRequestSelections.push({
        queuedRequestArtifact,
        requestPayload,
      });
    }

    if (requestedTaskId) {
      const matchingQueuedRequests = queuedRequestSelections.filter(
        ({ requestPayload }) => this.resolveRequestTaskId(requestPayload) === requestedTaskId,
      );
      const selectedQueuedRequest =
        matchingQueuedRequests[matchingQueuedRequests.length - 1] ?? null;
      if (!selectedQueuedRequest) {
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          `review-verify could not find queued review request for task_id=${requestedTaskId}.`,
          {
            taskId: requestedTaskId,
            queuedRequestCount: queuedRequestArtifacts.length,
          },
        );
      }

      return selectedQueuedRequest;
    }

    const latestQueuedRequest = queuedRequestSelections[queuedRequestSelections.length - 1] ?? null;
    if (!latestQueuedRequest) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'review-verify failed to resolve queued request artifact.',
      );
    }

    return latestQueuedRequest;
  }

  public async execute(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    const reviewQueueDirectories = context.reviewQueueRuntime.resolveReviewQueueDirectories();
    await mkdir(reviewQueueDirectories.requestDirectoryPath, { recursive: true });
    await mkdir(reviewQueueDirectories.resultDirectoryPath, { recursive: true });

    const queuedRequestArtifacts =
      await context.reviewQueueRuntime.collectQueuedReviewRequestArtifacts(reviewQueueDirectories);

    if (queuedRequestArtifacts.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'review-verify requires at least one queued review request artifact.',
      );
    }

    const { queuedRequestArtifact: latestQueuedRequest, requestPayload } =
      await this.resolveQueuedRequestSelection(
        context,
        queuedRequestArtifacts,
        runtimeDebugOptions.taskId,
      );
    const verifyId = `review-verify-${Date.now()}`;
    const verifyPath = resolve(reviewQueueDirectories.resultDirectoryPath, `${verifyId}.json`);
    const sourceRequestId =
      typeof requestPayload?.requestId === 'string'
        ? requestPayload.requestId
        : latestQueuedRequest.requestId;
    const requestTaskId = this.resolveRequestTaskId(requestPayload);
    const taskId = requestTaskId ?? runtimeDebugOptions.taskId;
    const shouldAutoApplyLedgerBackfill =
      Boolean(taskId) &&
      ((requestPayload && requestPayload.recordLedger === true) ||
        runtimeDebugOptions.recordLedger);
    const diagnosticContext =
      requestPayload &&
      typeof requestPayload.diagnosticContext === 'object' &&
      requestPayload.diagnosticContext
        ? (requestPayload.diagnosticContext as Record<string, unknown>)
        : null;
    const correlationId =
      diagnosticContext && typeof diagnosticContext.correlationId === 'string'
        ? diagnosticContext.correlationId
        : `review-chain-${sourceRequestId}`;
    const ledgerBackfillPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'ledger-backfill',
      'review-verify',
      `${verifyId}.json`,
    );
    const verifiedAt = context.toRfc3339SecondsTimestamp(new Date());
    const executionSessionId = `session-${verifyId}`;
    const streamMetadata = await context.resolveExecutionStreamMetadata();
    const orchestrationExecution = await context.orchestrationServiceRuntime.startExecution(
      {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        executionKind: OrchestrationExecutionKind.REVIEW_VERIFY,
        clientSurface: OrchestrationClientSurface.CLI,
        locale: context.options.locale,
        outputMode: context.options.outputMode,
        ...(taskId ? { taskId } : {}),
        ...streamMetadata,
      },
      {
        executionId: verifyId,
        executionSessionId,
        processId: 'review-verify',
      },
    );
    let ledgerBackfillStatus = CLI_REVIEW_LEDGER_BACKFILL_STATUS.PENDING;
    let ledgerBackfillApplied = false;
    let ledgerBackfillErrorMessage = null;

    if (shouldAutoApplyLedgerBackfill && taskId) {
      const syncScriptPath = resolveTaskLedgerSyncScriptPath();
      if (!syncScriptPath) {
        ledgerBackfillStatus = CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED;
        ledgerBackfillErrorMessage =
          'sync-task-ledger.js could not be resolved from current installation.';
      } else {
        try {
          await context.runNodeScript(syncScriptPath, [
            '--workspace-root',
            context.options.workspace.workspaceRoot,
            '--task-id',
            taskId,
            '--execution-id',
            verifyId,
            '--verify',
            `review-verify ${verifyId} consumed queued request ${sourceRequestId}`,
            '--review-delta',
            `managed ledger backfill applied from ${verifyId}`,
            '--checklist-note',
            `${verifiedAt.slice(0, 10)}：自动消费 review-verify 产物并完成 ledger backfill（verify_id=${verifyId}）。`,
          ]);
          ledgerBackfillStatus = CLI_REVIEW_LEDGER_BACKFILL_STATUS.APPLIED;
          ledgerBackfillApplied = true;
        } catch (error) {
          ledgerBackfillStatus = CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED;
          ledgerBackfillErrorMessage = context.formatExecFailureDetail(error);
        }
      }
    }

    await context.artifactWriter.writeJsonArtifact(ledgerBackfillPath, {
      ledgerBackfillId: `ledger-backfill-${verifyId}`,
      status: ledgerBackfillStatus,
      createdAt: verifiedAt,
      verifyId,
      sourceRequestId,
      sourceRequestPath: latestQueuedRequest.filePath,
      workspaceId: context.options.workspace.workspaceId,
      workspaceRoot: context.options.workspace.workspaceRoot,
      ...(taskId ? { taskId } : {}),
      ...(ledgerBackfillApplied ? { appliedAt: verifiedAt } : {}),
      attribution: {
        correlationId,
        chain: 'review->review-verify->ledger-backfill',
        chainStep: 'ledger-backfill',
      },
      diagnostics: {
        rootCause:
          ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED
            ? CLI_DIAGNOSTIC_ROOT_CAUSE.RUNTIME_FAILURE
            : CLI_DIAGNOSTIC_ROOT_CAUSE.NONE,
        note: ledgerBackfillApplied
          ? 'Managed review chain auto-applied task ledger backfill.'
          : 'Ready for tasks/checklist/csv backfill consumption.',
        ...(ledgerBackfillErrorMessage ? { error: ledgerBackfillErrorMessage } : {}),
      },
    });

    const verifyResultStatus =
      ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED
        ? CLI_REVIEW_REQUEST_STATUS.FAILED
        : CLI_REVIEW_REQUEST_STATUS.VERIFIED;
    const sourceRequestStatus =
      ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED
        ? CLI_REVIEW_REQUEST_STATUS.QUEUED
        : CLI_REVIEW_REQUEST_STATUS.VERIFIED;

    await context.artifactWriter.writeJsonArtifact(verifyPath, {
      verifyId,
      status: verifyResultStatus,
      verifiedAt,
      sourceRequestPath: latestQueuedRequest.filePath,
      sourceRequestId,
      ledgerBackfillPath,
      ...(taskId ? { taskId } : {}),
      ledgerBackfillStatus,
      diagnosticAttribution: {
        correlationId,
        chain: 'review->review-verify->ledger-backfill',
        chainStep: 'review-verify',
      },
      orchestrationExecutionId: orchestrationExecution.executionId,
      orchestrationEventStreamToken: orchestrationExecution.eventStreamToken,
    });

    await context.artifactWriter.writeJsonArtifact(latestQueuedRequest.filePath, {
      ...(requestPayload ?? {}),
      requestId: sourceRequestId,
      status: sourceRequestStatus,
      ...(taskId ? { taskId } : {}),
      ...(sourceRequestStatus === CLI_REVIEW_REQUEST_STATUS.VERIFIED
        ? {
            verifiedAt,
            consumedAt: verifiedAt,
            consumedByVerifyId: verifyId,
          }
        : {
            lastVerifyAttemptAt: verifiedAt,
            lastVerifyId: verifyId,
          }),
      ledgerBackfillPath,
      ledgerBackfillStatus,
      diagnosticContext: {
        ...(diagnosticContext ?? {}),
        correlationId,
        queueStage:
          ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED
            ? 'review-verify-failed'
            : 'review-verify-consumed',
        chain: 'review->review-verify->ledger-backfill',
        ...(taskId ? { taskId } : {}),
        managedLedgerBackfill: shouldAutoApplyLedgerBackfill,
        ...(ledgerBackfillErrorMessage
          ? {
              lastLedgerBackfillError: ledgerBackfillErrorMessage,
            }
          : {}),
      },
    });

    if (ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED) {
      await context.orchestrationServiceRuntime.publishEvent({
        executionId: verifyId,
        type: OrchestrationServiceEventType.ARTIFACT_READY,
        status: OrchestrationExecutionStatus.FAILED,
        artifactId: 'review_verify_result',
        artifactPath: verifyPath,
        message: `Review verify artifact ${verifyId} persisted with failed ledger backfill.`,
      });
      await context.orchestrationServiceRuntime.publishEvent({
        executionId: verifyId,
        type: OrchestrationServiceEventType.EXECUTION_FAILED,
        status: OrchestrationExecutionStatus.FAILED,
        artifactId: 'review_ledger_backfill',
        artifactPath: ledgerBackfillPath,
        message: `Review verify execution ${verifyId} failed during managed ledger backfill.`,
      });
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        `review-verify failed to apply managed ledger backfill for ${taskId ?? sourceRequestId}.`,
        {
          taskId,
          verifyId,
          ledgerBackfillPath,
          error: ledgerBackfillErrorMessage,
        },
      );
    }

    await context.orchestrationServiceRuntime.publishEvent({
      executionId: verifyId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: OrchestrationExecutionStatus.RUNNING,
      artifactId: 'review_verify_result',
      artifactPath: verifyPath,
      message: `Review verify artifact ${verifyId} persisted.`,
    });
    await context.orchestrationServiceRuntime.publishEvent({
      executionId: verifyId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: OrchestrationExecutionStatus.RUNNING,
      artifactId: 'review_ledger_backfill',
      artifactPath: ledgerBackfillPath,
      message: `Review ledger-backfill artifact ${verifyId} persisted.`,
    });
    await context.orchestrationServiceRuntime.publishEvent({
      executionId: verifyId,
      type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
      status: OrchestrationExecutionStatus.COMPLETED,
      message: `Review verify execution ${verifyId} completed.`,
    });
    const orchestrationSummary = await context.orchestrationServiceRuntime.getExecution(
      orchestrationExecution.executionId,
    );

    const message = `Review request verified from ${latestQueuedRequest.filePath}.`;
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'verifier',
          stage: ExecutionProgressStage.REVIEW_VERIFY,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: 'Review verification artifact persisted.',
          detail: `verify_id=${verifyId}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW_VERIFY,
            artifactPath: verifyPath,
          },
        },
        {
          roleId: 'ledger-backfill',
          stage: ExecutionProgressStage.LEDGER_BACKFILL,
          status: ledgerBackfillApplied
            ? ExecutionProgressStatus.COMPLETED
            : ExecutionProgressStatus.WAITING,
          category: ledgerBackfillApplied
            ? ExecutionInteractionCategory.NONE
            : ExecutionInteractionCategory.POLICY_WAITING,
          summary: ledgerBackfillApplied
            ? 'Managed ledger backfill applied.'
            : 'Ledger backfill pending downstream task ledger consumption.',
          detail: taskId
            ? `source_request_id=${sourceRequestId} task_id=${taskId}`
            : `source_request_id=${sourceRequestId}`,
          backlink: {
            stageId: ExecutionProgressStage.LEDGER_BACKFILL,
            artifactPath: ledgerBackfillPath,
          },
        },
      ],
      interactionPrompts: ledgerBackfillApplied
        ? []
        : [
            {
              category: ExecutionInteractionCategory.POLICY_WAITING,
              stage: ExecutionProgressStage.LEDGER_BACKFILL,
              title: 'Consume ledger-backfill artifact',
              action:
                'Apply ledger-backfill payload into tasks/checklist/tasks.csv to close review chain.',
              blocking: true,
            },
          ],
      layeredLogs: {
        summary: [
          `verify_id=${verifyId}`,
          'chain=review->review-verify->ledger-backfill',
          `ledger_backfill_status=${ledgerBackfillStatus}`,
        ],
        detailed: [
          `verify_path=${verifyPath}`,
          `ledger_backfill_path=${ledgerBackfillPath}`,
          `source_request_path=${latestQueuedRequest.filePath}`,
          ...(taskId ? [`task_id=${taskId}`] : []),
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
            id: 'review_verify',
            status: CliGovernanceCheckStatus.PASS,
            detail: latestQueuedRequest.fileName,
          },
        ],
        artifacts: [
          {
            id: 'review_verify_result',
            path: verifyPath,
          },
          {
            id: 'review_ledger_backfill',
            path: ledgerBackfillPath,
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
