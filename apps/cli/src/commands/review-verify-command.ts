import { existsSync } from 'node:fs';
import { mkdir, readFile, rename } from 'node:fs/promises';
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
import {
  CliReviewArtifactId,
  CliReviewLifecycleStatus,
  CliReviewScopeMode,
  CliReviewVerifyDecision,
} from '../constants/cli-review.constant.js';
import { CliReviewFindingGenerator } from '../runtime/review/cli-review-finding-generator.js';
import { CliReviewLifecycleRuntime } from '../runtime/review/cli-review-lifecycle-runtime.js';
import { CliReviewTaskCardRuntime } from '../runtime/review/cli-review-task-card-runtime.js';
import type {
  CliCommandExecutorContext,
  CliCommandResultArtifact,
  CliCommandResultCheck,
  CliReviewFinding,
  CliReviewRequestArtifactPayload,
  CliReviewStreamContext,
  CliReviewVerifyResultArtifactPayload,
} from '../types/interfaces/index.js';
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
  private resolveRequestTaskId(
    requestPayload: CliReviewRequestArtifactPayload | null,
  ): string | null {
    return requestPayload &&
      typeof requestPayload.taskId === 'string' &&
      requestPayload.taskId.trim().length > 0
      ? requestPayload.taskId.trim()
      : null;
  }

  /**
   * Resolves managed `CR-xxx` review task id from queued request payload or runtime options.
   * @param requestPayload Parsed queued request payload.
   * @param runtimeTaskId Task id requested through runtime debug options.
   * @returns Review task id when the chain is CR-managed.
   */
  private resolveReviewTaskId(
    requestPayload: CliReviewRequestArtifactPayload | null,
    runtimeTaskId: string | null,
  ): string | null {
    if (
      requestPayload &&
      typeof requestPayload.reviewTaskId === 'string' &&
      requestPayload.reviewTaskId.trim().length > 0
    ) {
      return requestPayload.reviewTaskId.trim();
    }

    const candidateTaskIds = [requestPayload?.taskId ?? null, runtimeTaskId];
    for (const candidateTaskId of candidateTaskIds) {
      if (
        typeof candidateTaskId === 'string' &&
        candidateTaskId.trim().toUpperCase().startsWith('CR-')
      ) {
        return candidateTaskId.trim();
      }
    }

    return null;
  }

  /**
   * Identifies queued requests that still deserve default verification priority.
   * Why: resolved/no-op requests may remain queued for explicit closure receipts, but
   * they should not displace real pending reviews during the default "latest" selection.
   * Managed ledger-backfill requests stay prioritized even when the review artifact is resolved.
   * @param requestPayload Parsed queued review payload.
   * @returns True when default no-arg review-verify should prefer this request.
   */
  private shouldPrioritizeForDefaultSelection(
    requestPayload: CliReviewRequestArtifactPayload | null,
  ): boolean {
    if (!requestPayload) {
      return false;
    }

    return (
      requestPayload.reviewArtifactStatus !== CliReviewLifecycleStatus.RESOLVED ||
      requestPayload.recordLedger === true
    );
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
    requestPayload: CliReviewRequestArtifactPayload | null;
  }> {
    const queuedRequestSelections = [];

    for (const queuedRequestArtifact of queuedRequestArtifacts) {
      const requestPayload = (await context.artifactWriter.safeReadJson(
        queuedRequestArtifact.filePath,
      )) as CliReviewRequestArtifactPayload | null;
      queuedRequestSelections.push({
        queuedRequestArtifact,
        requestPayload,
      });
    }

    if (requestedTaskId) {
      const matchingQueuedRequests = queuedRequestSelections.filter(
        ({ requestPayload }) =>
          this.resolveRequestTaskId(requestPayload) === requestedTaskId ||
          this.resolveReviewTaskId(requestPayload, requestedTaskId) === requestedTaskId,
      );
      const selectedQueuedRequest =
        matchingQueuedRequests[matchingQueuedRequests.length - 1] ?? null;
      if (!selectedQueuedRequest) {
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          context.localizeText(
            `review-verify could not find queued review request for task_id=${requestedTaskId}.`,
            `review-verify 找不到 task_id=${requestedTaskId} 对应的 queued review request。`,
          ),
          {
            taskId: requestedTaskId,
            queuedRequestCount: queuedRequestArtifacts.length,
          },
        );
      }

      return selectedQueuedRequest;
    }

    const readableQueuedRequests = queuedRequestSelections.filter(
      ({ requestPayload }) => requestPayload !== null,
    );
    const prioritizedQueuedRequests = readableQueuedRequests.filter(({ requestPayload }) =>
      this.shouldPrioritizeForDefaultSelection(requestPayload),
    );
    const latestQueuedRequest =
      prioritizedQueuedRequests[prioritizedQueuedRequests.length - 1] ??
      readableQueuedRequests[readableQueuedRequests.length - 1] ??
      queuedRequestSelections[queuedRequestSelections.length - 1] ??
      null;
    if (!latestQueuedRequest) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        context.localizeText(
          'review-verify failed to resolve queued request artifact.',
          'review-verify 无法解析 queued request artifact。',
        ),
      );
    }

    return latestQueuedRequest;
  }

  public async execute(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    const reviewQueueDirectories = context.reviewQueueRuntime.resolveReviewQueueDirectories();
    const reviewRuntime = new CliReviewLifecycleRuntime(
      context.options.workspace.repositoryRoot,
      context.options.workspace.workspaceRoot,
    );
    const reviewTaskCardRuntime = new CliReviewTaskCardRuntime(
      context.options.workspace.repositoryRoot,
      context.options.workspace.workspaceRoot,
    );
    const findingGenerator = new CliReviewFindingGenerator(
      context.options.workspace.repositoryRoot,
      (english, chinese) => context.localizeText(english, chinese),
    );
    await mkdir(reviewQueueDirectories.requestDirectoryPath, { recursive: true });
    await mkdir(reviewQueueDirectories.resultDirectoryPath, { recursive: true });

    const queuedRequestArtifacts =
      await context.reviewQueueRuntime.collectQueuedReviewRequestArtifacts(reviewQueueDirectories);

    if (queuedRequestArtifacts.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        context.localizeText(
          'review-verify requires at least one queued review request artifact.',
          'review-verify 至少需要一份 queued review request artifact。',
        ),
      );
    }

    const { queuedRequestArtifact: latestQueuedRequest, requestPayload } =
      await this.resolveQueuedRequestSelection(
        context,
        queuedRequestArtifacts,
        runtimeDebugOptions.taskId,
      );
    const streamContext = await reviewRuntime.resolveStreamContext();
    const verifyId = `review-verify-${Date.now()}`;
    const verifyPath = resolve(reviewQueueDirectories.resultDirectoryPath, `${verifyId}.json`);
    const sourceRequestId =
      typeof requestPayload?.requestId === 'string'
        ? requestPayload.requestId
        : latestQueuedRequest.requestId;
    const requestTaskId = this.resolveRequestTaskId(requestPayload);
    const taskId = requestTaskId ?? runtimeDebugOptions.taskId;
    const reviewTaskId = this.resolveReviewTaskId(requestPayload, runtimeDebugOptions.taskId);
    const ledgerTaskId = reviewTaskId ?? taskId;
    const shouldAutoApplyLedgerBackfill =
      Boolean(reviewTaskId) ||
      (Boolean(taskId) &&
        ((requestPayload && requestPayload.recordLedger === true) ||
          runtimeDebugOptions.recordLedger));
    const diagnosticContext =
      requestPayload &&
      typeof requestPayload.diagnosticContext === 'object' &&
      requestPayload.diagnosticContext
        ? requestPayload.diagnosticContext
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

    const sourceFindings = this.resolveSourceFindings(requestPayload);
    const reviewSlug = this.resolveReviewSlug(reviewRuntime, requestPayload, sourceRequestId);
    const sourceReviewArtifactStatus = this.resolveLifecycleStatus(requestPayload, sourceFindings);
    const sourceReviewArtifactPath = this.resolveSourceReviewArtifactPath(
      reviewRuntime,
      requestPayload,
      reviewSlug,
      sourceReviewArtifactStatus,
      streamContext,
    );
    await this.ensureSourceReviewArtifactExists(context, {
      taskId,
      reviewMode:
        requestPayload?.scope?.reviewMode === CliReviewScopeMode.TASK_SCOPE
          ? CliReviewScopeMode.TASK_SCOPE
          : CliReviewScopeMode.WORKING_TREE,
      sourceReviewArtifactPath,
      sourceReviewArtifactStatus,
      sourceFindings,
      streamContext,
      requestPayload,
    });

    const changedPaths = await reviewRuntime.collectGitChangedPaths({
      excludePaths: [
        ...reviewRuntime.resolveGeneratedPathPrefixes(),
        ...(requestPayload?.generatedArtifactPaths ?? []),
      ],
    });
    const riskEvaluation = reviewRuntime.evaluateRisk(changedPaths);
    const currentFindings = await findingGenerator.generateFindings({
      changedPaths,
      riskEvaluation,
    });
    const currentFindingFingerprints = new Set(
      currentFindings.map((finding) => finding.fingerprint),
    );
    const acceptedFindings = sourceFindings.filter((finding) =>
      currentFindingFingerprints.has(finding.fingerprint),
    );
    const rejectedFindings = sourceFindings.filter(
      (finding) => !currentFindingFingerprints.has(finding.fingerprint),
    );
    const overallDecision =
      acceptedFindings.length > 0 && rejectedFindings.length > 0
        ? CliReviewVerifyDecision.PARTIALLY_ACCEPTED
        : acceptedFindings.length > 0
          ? CliReviewVerifyDecision.ACCEPTED
          : CliReviewVerifyDecision.REJECTED;
    const reviewArtifactStatus =
      acceptedFindings.length > 0
        ? CliReviewLifecycleStatus.VERIFIED
        : CliReviewLifecycleStatus.RESOLVED;
    const reviewArtifactPath = reviewRuntime.resolveArtifactPath({
      reviewDirPath: dirname(sourceReviewArtifactPath),
      status: reviewArtifactStatus,
      slug: reviewSlug,
    });
    await this.transitionReviewArtifact(context, {
      sourceReviewArtifactPath,
      reviewArtifactPath,
      reviewArtifactStatus,
      verifyId,
      verifiedAt,
      acceptedFindings,
      rejectedFindings,
      overallDecision,
      changedPaths,
      riskEvaluation,
    });

    let ledgerBackfillStatus = shouldAutoApplyLedgerBackfill
      ? CLI_REVIEW_LEDGER_BACKFILL_STATUS.PENDING
      : CLI_REVIEW_LEDGER_BACKFILL_STATUS.NOT_REQUESTED;
    let ledgerBackfillApplied = false;
    let ledgerBackfillErrorMessage: string | null = null;

    const managedReviewContext = reviewTaskId
      ? await reviewTaskCardRuntime.resolveManagedContext({
          streamContext,
          scopeTaskId: taskId ?? reviewTaskId,
        })
      : null;
    let reviewTaskCardRecord = reviewTaskId
      ? await reviewTaskCardRuntime.updateReviewTaskCard(context, {
          managedContext: managedReviewContext,
          reviewTaskId,
          reviewTaskCardPath: requestPayload?.reviewTaskCardPath ?? null,
          reviewMode:
            requestPayload?.scope?.reviewMode === CliReviewScopeMode.TASK_SCOPE
              ? CliReviewScopeMode.TASK_SCOPE
              : CliReviewScopeMode.WORKING_TREE,
          scopeTaskId: taskId,
          reviewSlug,
          reviewStatus: reviewArtifactStatus,
          occurredAt: verifiedAt,
          reviewArtifactPath,
          requestPath: latestQueuedRequest.filePath,
          executionNote: `${verifiedAt.slice(0, 10)}: review-verify moved ${reviewTaskId} to ${reviewArtifactStatus} (verify_id=${verifyId}).`,
        })
      : null;

    if (shouldAutoApplyLedgerBackfill && ledgerTaskId) {
      const syncScriptPath = resolveTaskLedgerSyncScriptPath();
      if (!syncScriptPath) {
        ledgerBackfillStatus = CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED;
        ledgerBackfillErrorMessage = context.localizeText(
          'sync-task-ledger.js could not be resolved from current installation.',
          '当前安装中无法解析 sync-task-ledger.js。',
        );
      } else {
        try {
          await context.runNodeScript(syncScriptPath, [
            '--workspace-root',
            context.options.workspace.workspaceRoot,
            '--task-id',
            ledgerTaskId,
            '--execution-id',
            verifyId,
            '--result',
            `review artifact ${reviewArtifactPath} transitioned to ${reviewArtifactStatus}`,
            '--verify',
            `review-verify ${verifyId} decision=${overallDecision} accepted=${acceptedFindings.length} rejected=${rejectedFindings.length}`,
            '--review-delta',
            reviewArtifactPath,
            '--checklist-note',
            context.localizeText(
              `${verifiedAt.slice(0, 10)}: review-verify updated ${reviewArtifactPath} and applied ledger backfill (verify_id=${verifyId}).`,
              `${verifiedAt.slice(0, 10)}：review-verify 已更新 ${reviewArtifactPath} 并完成 ledger backfill（verify_id=${verifyId}）。`,
            ),
          ]);
          ledgerBackfillStatus = CLI_REVIEW_LEDGER_BACKFILL_STATUS.APPLIED;
          ledgerBackfillApplied = true;
          if (reviewTaskId) {
            reviewTaskCardRecord =
              (await reviewTaskCardRuntime.updateReviewTaskCard(context, {
                managedContext: managedReviewContext,
                reviewTaskId,
                reviewTaskCardPath:
                  reviewTaskCardRecord?.reviewTaskCardPath ??
                  requestPayload?.reviewTaskCardPath ??
                  null,
                reviewMode:
                  requestPayload?.scope?.reviewMode === CliReviewScopeMode.TASK_SCOPE
                    ? CliReviewScopeMode.TASK_SCOPE
                    : CliReviewScopeMode.WORKING_TREE,
                scopeTaskId: taskId,
                reviewSlug,
                reviewStatus: reviewArtifactStatus,
                occurredAt: verifiedAt,
                reviewArtifactPath,
                requestPath: latestQueuedRequest.filePath,
                verifyResultPath: verifyPath,
                ledgerBackfillPath,
                executionNote: `${verifiedAt.slice(0, 10)}: ledger backfill applied for ${reviewTaskId} after review-verify ${verifyId}.`,
              })) ?? reviewTaskCardRecord;
          }
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
      sourceReviewArtifactPath,
      reviewArtifactPath,
      workspaceId: context.options.workspace.workspaceId,
      workspaceRoot: context.options.workspace.workspaceRoot,
      ...(ledgerTaskId ? { taskId: ledgerTaskId } : {}),
      ...(reviewTaskCardRecord
        ? {
            reviewTaskId: reviewTaskCardRecord.reviewTaskId,
            reviewTaskCardPath: reviewTaskCardRecord.reviewTaskCardPath,
          }
        : {}),
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
        note:
          ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.APPLIED
            ? context.localizeText(
                'Managed review chain auto-applied task ledger backfill.',
                '托管 review 链路已自动完成 task ledger backfill。',
              )
            : ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.NOT_REQUESTED
              ? context.localizeText(
                  'Ledger backfill was not requested for this review-verify execution.',
                  '本次 review-verify 没有请求 ledger backfill。',
                )
              : context.localizeText(
                  'Review truth was updated, but ledger backfill still needs retry.',
                  'review truth 已更新，但 ledger backfill 仍需重试。',
                ),
        ...(ledgerBackfillErrorMessage ? { error: ledgerBackfillErrorMessage } : {}),
      },
    });

    const verifyResultStatus =
      ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED
        ? CLI_REVIEW_REQUEST_STATUS.FAILED
        : CLI_REVIEW_REQUEST_STATUS.VERIFIED;
    const shouldKeepQueuedRequest =
      ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED ||
      reviewArtifactStatus === CliReviewLifecycleStatus.VERIFIED;
    const sourceRequestStatus = shouldKeepQueuedRequest
      ? CLI_REVIEW_REQUEST_STATUS.QUEUED
      : CLI_REVIEW_REQUEST_STATUS.VERIFIED;
    const verifyPayload: CliReviewVerifyResultArtifactPayload = {
      verifyId,
      status: verifyResultStatus,
      verifiedAt,
      sourceRequestPath: latestQueuedRequest.filePath,
      sourceRequestId,
      sourceReviewArtifactPath,
      reviewArtifactPath,
      reviewArtifactStatus,
      ...(reviewTaskCardRecord
        ? {
            reviewTaskId: reviewTaskCardRecord.reviewTaskId,
            reviewTaskCardPath: reviewTaskCardRecord.reviewTaskCardPath,
          }
        : {}),
      overallDecision,
      acceptedFindingIds: acceptedFindings.map((finding) => finding.findingId),
      rejectedFindingIds: rejectedFindings.map((finding) => finding.findingId),
      ledgerBackfillPath,
      ledgerBackfillStatus,
      ...(ledgerTaskId ? { taskId: ledgerTaskId } : {}),
      diagnosticAttribution: {
        correlationId,
        chain: 'review->review-verify->ledger-backfill',
        chainStep: 'review-verify',
      },
      orchestrationExecutionId: orchestrationExecution.executionId,
      orchestrationEventStreamToken: orchestrationExecution.eventStreamToken,
    };
    await context.artifactWriter.writeJsonArtifact(verifyPath, verifyPayload);

    await context.artifactWriter.writeJsonArtifact(latestQueuedRequest.filePath, {
      ...(requestPayload ?? {}),
      requestId: sourceRequestId,
      status: sourceRequestStatus,
      ...(taskId ? { taskId } : {}),
      ...(reviewTaskCardRecord
        ? {
            reviewTaskId: reviewTaskCardRecord.reviewTaskId,
            reviewTaskCardPath: reviewTaskCardRecord.reviewTaskCardPath,
          }
        : {}),
      reviewSlug,
      reviewArtifactPath,
      reviewArtifactStatus,
      ...(requestPayload?.scope ? { scope: requestPayload.scope } : {}),
      findings: sourceFindings,
      overallDecision,
      acceptedFindingIds: acceptedFindings.map((finding) => finding.findingId),
      rejectedFindingIds: rejectedFindings.map((finding) => finding.findingId),
      generatedArtifactPaths: [
        reviewRuntime.toRepositoryRelativePath(latestQueuedRequest.filePath),
        reviewRuntime.toRepositoryRelativePath(reviewArtifactPath),
        ...(reviewTaskCardRecord
          ? [reviewRuntime.toRepositoryRelativePath(reviewTaskCardRecord.reviewTaskCardPath)]
          : []),
      ],
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
            : reviewArtifactStatus === CliReviewLifecycleStatus.VERIFIED
              ? 'review-verify-open'
              : 'review-verify-consumed',
        chain: 'review->review-verify->ledger-backfill',
        ...(ledgerTaskId ? { taskId: ledgerTaskId } : {}),
        reviewChainMode: shouldAutoApplyLedgerBackfill
          ? 'managed_task_chain'
          : 'queued_external_chain',
        ...(ledgerBackfillErrorMessage
          ? {
              lastLedgerBackfillError: ledgerBackfillErrorMessage,
            }
          : {}),
      },
    });

    await context.orchestrationServiceRuntime.publishEvent({
      executionId: verifyId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status:
        ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED
          ? OrchestrationExecutionStatus.FAILED
          : OrchestrationExecutionStatus.RUNNING,
      artifactId: CliReviewArtifactId.REVIEW_VERIFY_RESULT,
      artifactPath: verifyPath,
      message: context.localizeText(
        `Persisted review-verify result at ${verifyPath}.`,
        `已在 ${verifyPath} 写入 review-verify result。`,
      ),
    });
    await context.orchestrationServiceRuntime.publishEvent({
      executionId: verifyId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status:
        ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED
          ? OrchestrationExecutionStatus.FAILED
          : OrchestrationExecutionStatus.RUNNING,
      artifactId: CliReviewArtifactId.REVIEW_LEDGER_BACKFILL,
      artifactPath: ledgerBackfillPath,
      message: context.localizeText(
        `Persisted review ledger-backfill artifact at ${ledgerBackfillPath}.`,
        `已在 ${ledgerBackfillPath} 写入 review ledger-backfill artifact。`,
      ),
    });
    await context.orchestrationServiceRuntime.publishEvent({
      executionId: verifyId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status:
        ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED
          ? OrchestrationExecutionStatus.FAILED
          : OrchestrationExecutionStatus.RUNNING,
      artifactId: CliReviewArtifactId.REVIEW_ARTIFACT,
      artifactPath: reviewArtifactPath,
      message: context.localizeText(
        `Review lifecycle artifact transitioned to ${reviewArtifactStatus} at ${reviewArtifactPath}.`,
        `review lifecycle artifact 已在 ${reviewArtifactPath} 迁移到 ${reviewArtifactStatus}。`,
      ),
    });

    if (ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED) {
      await context.orchestrationServiceRuntime.publishEvent({
        executionId: verifyId,
        type: OrchestrationServiceEventType.EXECUTION_FAILED,
        status: OrchestrationExecutionStatus.FAILED,
        artifactId: CliReviewArtifactId.REVIEW_LEDGER_BACKFILL,
        artifactPath: ledgerBackfillPath,
        message: context.localizeText(
          `Review verify ${verifyId} failed during managed ledger backfill.`,
          `Review verify ${verifyId} 在 managed ledger backfill 阶段失败。`,
        ),
      });
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        context.localizeText(
          `review-verify updated the review artifact but failed to apply managed ledger backfill for ${ledgerTaskId ?? sourceRequestId}.`,
          `review-verify 已更新 review artifact，但未能为 ${ledgerTaskId ?? sourceRequestId} 完成 managed ledger backfill。`,
        ),
        {
          taskId: ledgerTaskId,
          verifyId,
          reviewArtifactPath,
          ledgerBackfillPath,
          error: ledgerBackfillErrorMessage,
        },
      );
    }

    await context.orchestrationServiceRuntime.publishEvent({
      executionId: verifyId,
      type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
      status: OrchestrationExecutionStatus.COMPLETED,
      message: context.localizeText(
        `Review verify execution ${verifyId} completed.`,
        `Review verify 执行 ${verifyId} 已完成。`,
      ),
    });
    const orchestrationSummary = await context.orchestrationServiceRuntime.getExecution(
      orchestrationExecution.executionId,
    );

    const message =
      reviewArtifactStatus === CliReviewLifecycleStatus.VERIFIED
        ? context.localizeText(
            `Review verify completed; ${acceptedFindings.length} finding(s) remain open. artifact=${reviewArtifactPath}.`,
            `review-verify 已完成；仍有 ${acceptedFindings.length} 条 finding 未关闭。artifact=${reviewArtifactPath}。`,
          )
        : context.localizeText(
            `Review verify completed and resolved the review artifact at ${reviewArtifactPath}.`,
            `review-verify 已完成，并已将 review artifact 收口到 ${reviewArtifactPath}。`,
          );
    const checks = this.buildChecks({
      overallDecision,
      reviewArtifactStatus,
      reviewArtifactPath,
      acceptedFindingCount: acceptedFindings.length,
      rejectedFindingCount: rejectedFindings.length,
      ledgerBackfillStatus,
      ledgerBackfillPath,
    });
    const artifacts: CliCommandResultArtifact[] = [
      {
        id: CliReviewArtifactId.REVIEW_VERIFY_RESULT,
        path: verifyPath,
      },
      {
        id: CliReviewArtifactId.REVIEW_ARTIFACT,
        path: reviewArtifactPath,
      },
      {
        id: CliReviewArtifactId.REVIEW_LEDGER_BACKFILL,
        path: ledgerBackfillPath,
      },
      ...(reviewTaskCardRecord
        ? [
            {
              id: CliReviewArtifactId.REVIEW_TASK_CARD,
              path: reviewTaskCardRecord.reviewTaskCardPath,
            } satisfies CliCommandResultArtifact,
          ]
        : []),
    ];
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'verifier',
          stage: ExecutionProgressStage.REVIEW_VERIFY,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary:
            reviewArtifactStatus === CliReviewLifecycleStatus.VERIFIED
              ? context.localizeText(
                  'Review verification completed; some findings remain open.',
                  'review verification 已完成；仍有 finding 未关闭。',
                )
              : context.localizeText(
                  'Review verification completed and the artifact is resolved.',
                  'review verification 已完成，artifact 已 resolved。',
                ),
          detail: `verify_id=${verifyId} decision=${overallDecision}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW_VERIFY,
            artifactPath: reviewArtifactPath,
          },
        },
        {
          roleId: 'ledger-backfill',
          stage: ExecutionProgressStage.LEDGER_BACKFILL,
          status:
            ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.APPLIED
              ? ExecutionProgressStatus.COMPLETED
              : ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.NOT_REQUESTED
                ? ExecutionProgressStatus.COMPLETED
                : ExecutionProgressStatus.WARNING,
          category: ExecutionInteractionCategory.NONE,
          summary:
            ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.APPLIED
              ? context.localizeText(
                  'Managed ledger backfill applied.',
                  'managed ledger backfill 已完成。',
                )
              : context.localizeText(
                  'Ledger backfill was not requested for this verify path.',
                  '本次 verify 路径没有请求 ledger backfill。',
                ),
          detail: taskId
            ? `source_request_id=${sourceRequestId} task_id=${ledgerTaskId ?? taskId}`
            : `source_request_id=${sourceRequestId}`,
          backlink: {
            stageId: ExecutionProgressStage.LEDGER_BACKFILL,
            artifactPath: ledgerBackfillPath,
          },
        },
      ],
      interactionPrompts:
        reviewArtifactStatus === CliReviewLifecycleStatus.VERIFIED
          ? [
              {
                category: ExecutionInteractionCategory.POLICY_WAITING,
                stage: ExecutionProgressStage.REVIEW_VERIFY,
                title: context.localizeText(
                  'Apply fixes and rerun review-verify',
                  '修复后重新执行 review-verify',
                ),
                action: context.localizeText(
                  'Address the accepted findings, then run `repo-ai-governor review-verify` again to move the same artifact toward resolved.',
                  '先处理已接受的 finding，然后再次执行 `repo-ai-governor review-verify`，把同一份 artifact 继续推进到 resolved。',
                ),
                blocking: false,
              },
            ]
          : [],
      layeredLogs: {
        summary: [
          `verify_id=${verifyId}`,
          `decision=${overallDecision}`,
          `review_status=${reviewArtifactStatus}`,
          `ledger_backfill_status=${ledgerBackfillStatus}`,
        ],
        detailed: [
          `verify_path=${verifyPath}`,
          `source_review_artifact_path=${sourceReviewArtifactPath}`,
          `review_artifact_path=${reviewArtifactPath}`,
          `ledger_backfill_path=${ledgerBackfillPath}`,
          ...(ledgerTaskId ? [`task_id=${ledgerTaskId}`] : []),
        ],
      },
    });

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.REVIEW_VERIFY,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        details: {
          overall_decision: overallDecision,
          review_artifact_path: reviewArtifactPath,
          review_status: reviewArtifactStatus,
          ...(reviewTaskCardRecord
            ? {
                review_task_id: reviewTaskCardRecord.reviewTaskId,
                review_task_card_path: reviewTaskCardRecord.reviewTaskCardPath,
              }
            : {}),
          accepted_finding_count: acceptedFindings.length,
          rejected_finding_count: rejectedFindings.length,
          ledger_backfill_status: ledgerBackfillStatus,
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

  private buildChecks(options: {
    overallDecision: CliReviewVerifyDecision;
    reviewArtifactStatus: CliReviewLifecycleStatus;
    reviewArtifactPath: string;
    acceptedFindingCount: number;
    rejectedFindingCount: number;
    ledgerBackfillStatus: string;
    ledgerBackfillPath: string;
  }): CliCommandResultCheck[] {
    return [
      {
        id: 'review_verify',
        status: CliGovernanceCheckStatus.PASS,
        detail: `decision=${options.overallDecision} accepted=${options.acceptedFindingCount} rejected=${options.rejectedFindingCount}`,
      },
      {
        id: CliReviewArtifactId.REVIEW_ARTIFACT,
        status: CliGovernanceCheckStatus.PASS,
        detail: `status=${options.reviewArtifactStatus} path=${options.reviewArtifactPath}`,
      },
      {
        id: CliReviewArtifactId.REVIEW_LEDGER_BACKFILL,
        status:
          options.ledgerBackfillStatus === CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED
            ? CliGovernanceCheckStatus.FAIL
            : CliGovernanceCheckStatus.PASS,
        detail: `status=${options.ledgerBackfillStatus} path=${options.ledgerBackfillPath}`,
      },
    ];
  }

  private resolveSourceFindings(
    requestPayload: CliReviewRequestArtifactPayload | null,
  ): CliReviewFinding[] {
    if (!Array.isArray(requestPayload?.findings)) {
      return [];
    }

    return requestPayload.findings.filter(
      (finding): finding is CliReviewFinding =>
        typeof finding?.findingId === 'string' &&
        typeof finding?.fingerprint === 'string' &&
        typeof finding?.file === 'string' &&
        typeof finding?.summary === 'string',
    );
  }

  private resolveReviewSlug(
    reviewRuntime: CliReviewLifecycleRuntime,
    requestPayload: CliReviewRequestArtifactPayload | null,
    sourceRequestId: string,
  ): string {
    if (typeof requestPayload?.reviewSlug === 'string' && requestPayload.reviewSlug.length > 0) {
      return requestPayload.reviewSlug;
    }

    if (
      typeof requestPayload?.reviewArtifactPath === 'string' &&
      requestPayload.reviewArtifactPath.length > 0
    ) {
      return reviewRuntime.extractReviewSlugFromArtifactPath(requestPayload.reviewArtifactPath);
    }

    return sourceRequestId.replace(/^review-/u, '');
  }

  private resolveLifecycleStatus(
    requestPayload: CliReviewRequestArtifactPayload | null,
    sourceFindings: CliReviewFinding[],
  ): CliReviewLifecycleStatus {
    if (requestPayload?.reviewArtifactStatus === CliReviewLifecycleStatus.VERIFIED) {
      return CliReviewLifecycleStatus.VERIFIED;
    }

    if (requestPayload?.reviewArtifactStatus === CliReviewLifecycleStatus.RESOLVED) {
      return CliReviewLifecycleStatus.RESOLVED;
    }

    return sourceFindings.length > 0
      ? CliReviewLifecycleStatus.REVIEW_PENDING
      : CliReviewLifecycleStatus.RESOLVED;
  }

  private resolveSourceReviewArtifactPath(
    reviewRuntime: CliReviewLifecycleRuntime,
    requestPayload: CliReviewRequestArtifactPayload | null,
    reviewSlug: string,
    sourceReviewArtifactStatus: CliReviewLifecycleStatus,
    streamContext: CliReviewStreamContext,
  ): string {
    if (
      typeof requestPayload?.reviewArtifactPath === 'string' &&
      requestPayload.reviewArtifactPath.length > 0
    ) {
      return requestPayload.reviewArtifactPath;
    }

    return reviewRuntime.resolveArtifactPath({
      reviewDirPath: streamContext.reviewDirPath,
      status: sourceReviewArtifactStatus,
      slug: reviewSlug,
    });
  }

  private async ensureSourceReviewArtifactExists(
    context: CliCommandExecutorContext,
    options: {
      taskId: string | null;
      reviewMode: CliReviewScopeMode;
      sourceReviewArtifactPath: string;
      sourceReviewArtifactStatus: CliReviewLifecycleStatus;
      sourceFindings: CliReviewFinding[];
      streamContext: CliReviewStreamContext;
      requestPayload: CliReviewRequestArtifactPayload | null;
    },
  ): Promise<void> {
    if (existsSync(options.sourceReviewArtifactPath)) {
      return;
    }

    const title = options.taskId
      ? context.localizeText(`Code Review: ${options.taskId}`, `代码评审：${options.taskId}`)
      : context.localizeText('Code Review: working tree', '代码评审：working tree');
    const dateOnly = new Date().toISOString().slice(0, 10);
    const bootstrapNote = context.localizeText(
      'Bootstrap lifecycle artifact generated by review-verify because the queued transport artifact came from an older baseline.',
      '由于 queued transport artifact 来自旧基线，review-verify 已自动补建 lifecycle artifact。',
    );

    const findingsSection =
      options.sourceFindings.length > 0
        ? options.sourceFindings
            .map((finding, index) =>
              [
                `### 2.${index + 1} [${finding.severity}] ${finding.title}`,
                `- File: \`${finding.file}\`${typeof finding.line === 'number' ? `:${finding.line}` : ''}`,
                `- Summary: ${finding.summary}`,
              ].join('\n'),
            )
            .join('\n\n')
        : context.localizeText(
            'No actionable findings were carried by the legacy transport artifact.',
            '旧 transport artifact 没有携带可执行 finding。',
          );

    await context.artifactWriter.writeTextArtifact(
      options.sourceReviewArtifactPath,
      [
        `# ${title}`,
        '',
        `- Status: ${options.sourceReviewArtifactStatus}`,
        `- Date: ${dateOnly}`,
        `- Reviewer: ${context.localizeText('repo-ai-governor CLI', 'repo-ai-governor CLI')}`,
        `- Task: \`${options.taskId ?? 'n/a'}\``,
        ...(options.requestPayload?.reviewTaskId
          ? [`- Review Task: \`${options.requestPayload.reviewTaskId}\``]
          : []),
        `- Review Type: ${
          options.reviewMode === CliReviewScopeMode.TASK_SCOPE
            ? context.localizeText('task-aware review', 'task-aware review')
            : context.localizeText('working tree review', 'working tree review')
        }`,
        ...(options.streamContext.projectId
          ? [`- Project: \`${options.streamContext.projectId}\``]
          : []),
        ...(options.streamContext.sprintId
          ? [`- Sprint: \`${options.streamContext.sprintId}\``]
          : []),
        '',
        `## ${context.localizeText('1. Review Scope', '1. 评审范围')}`,
        '',
        `1. ${
          options.requestPayload?.scope?.scopeSummary ??
          context.localizeText(
            'Scope summary unavailable in legacy transport artifact.',
            '旧 transport artifact 中没有 scope summary。',
          )
        }`,
        '',
        `## ${context.localizeText('2. Findings', '2. Findings')}`,
        '',
        findingsSection,
        '',
        `## ${context.localizeText('3. Notes', '3. 说明')}`,
        '',
        `1. ${bootstrapNote}`,
        '',
      ].join('\n'),
    );
  }

  private async transitionReviewArtifact(
    context: CliCommandExecutorContext,
    options: {
      sourceReviewArtifactPath: string;
      reviewArtifactPath: string;
      reviewArtifactStatus: CliReviewLifecycleStatus;
      verifyId: string;
      verifiedAt: string;
      acceptedFindings: CliReviewFinding[];
      rejectedFindings: CliReviewFinding[];
      overallDecision: CliReviewVerifyDecision;
      changedPaths: string[];
      riskEvaluation: ReturnType<CliReviewLifecycleRuntime['evaluateRisk']>;
    },
  ): Promise<void> {
    const sourceContent = await readFile(options.sourceReviewArtifactPath, 'utf8');
    const normalizedContent = sourceContent.replace(
      /^- Status:\s*.+$/mu,
      `- Status: ${options.reviewArtifactStatus}`,
    );
    const verificationSection = this.renderVerificationSection(context, options);

    if (options.sourceReviewArtifactPath !== options.reviewArtifactPath) {
      await rename(options.sourceReviewArtifactPath, options.reviewArtifactPath);
    }

    await context.artifactWriter.writeTextArtifact(
      options.reviewArtifactPath,
      `${normalizedContent.trimEnd()}\n\n${verificationSection}\n`,
    );
  }

  private renderVerificationSection(
    context: CliCommandExecutorContext,
    options: {
      reviewArtifactStatus: CliReviewLifecycleStatus;
      verifyId: string;
      verifiedAt: string;
      acceptedFindings: CliReviewFinding[];
      rejectedFindings: CliReviewFinding[];
      overallDecision: CliReviewVerifyDecision;
      changedPaths: string[];
      riskEvaluation: ReturnType<CliReviewLifecycleRuntime['evaluateRisk']>;
    },
  ): string {
    const acceptedSection =
      options.acceptedFindings.length > 0
        ? options.acceptedFindings
            .map(
              (finding, index) =>
                `${index + 1}. \`${finding.findingId}\` ${context.localizeText('still reproduces in the current scope.', '在当前 scope 中仍可复现。')}`,
            )
            .join('\n')
        : context.localizeText(
            '1. No findings remain reproducible in the current scope.',
            '1. 当前 scope 中已没有仍可复现的 finding。',
          );
    const rejectedSection =
      options.rejectedFindings.length > 0
        ? options.rejectedFindings
            .map(
              (finding, index) =>
                `${index + 1}. \`${finding.findingId}\` ${context.localizeText('no longer reproduces in the current scope.', '在当前 scope 中已不再复现。')}`,
            )
            .join('\n')
        : context.localizeText(
            '1. No findings were rejected in this verification pass.',
            '1. 本次 verification 没有 rejected finding。',
          );

    return [
      `## ${context.localizeText('Verification Decision', '复核结论')} (${options.verifiedAt.slice(0, 10)})`,
      '',
      `- ${context.localizeText('Verify ID', 'Verify ID')}: \`${options.verifyId}\``,
      `- ${context.localizeText('Overall Decision', 'Overall Decision')}: \`${options.overallDecision}\``,
      `- ${context.localizeText('Review Artifact Status', 'Review Artifact Status')}: \`${options.reviewArtifactStatus}\``,
      `- ${context.localizeText('Accepted Findings', 'Accepted Findings')}: ${options.acceptedFindings.length}`,
      `- ${context.localizeText('Rejected Findings', 'Rejected Findings')}: ${options.rejectedFindings.length}`,
      `- ${context.localizeText('Changed paths in verify scope', 'verify scope 中的变更路径')}: ${options.changedPaths.length}`,
      `- ${context.localizeText('Risk level', '风险级别')}: \`${options.riskEvaluation.riskLevel}\``,
      '',
      `### ${context.localizeText('Accepted Findings', 'Accepted Findings')}`,
      '',
      acceptedSection,
      '',
      `### ${context.localizeText('Rejected Findings', 'Rejected Findings')}`,
      '',
      rejectedSection,
      '',
      `## ${context.localizeText('Follow-Up', '后续动作')}`,
      '',
      options.reviewArtifactStatus === CliReviewLifecycleStatus.VERIFIED
        ? `1. ${context.localizeText(
            'Apply fixes for the accepted findings, then rerun `repo-ai-governor review-verify` to continue the same lifecycle artifact.',
            '请先修复 accepted finding，然后重新执行 `repo-ai-governor review-verify`，继续推进同一份 lifecycle artifact。',
          )}`
        : `1. ${context.localizeText(
            'The review artifact is now resolved. Keep the artifact path as the canonical audit reference.',
            '当前 review artifact 已 resolved；请把该 artifact 路径保留为 canonical audit reference。',
          )}`,
      '',
    ].join('\n');
  }
}
