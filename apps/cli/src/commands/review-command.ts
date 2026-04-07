import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ChangeRiskEvaluationResult } from '@repo-ai-governor/core-change-risk';
import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
} from '@repo-ai-governor/orchestration-service-client';
import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { ReviewFindingSourceType } from '@repo-ai-governor/standards';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_REVIEW_REQUEST_STATUS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import {
  CliDelegatedReviewActivationLevel,
  CliReviewArtifactId,
  CliReviewFindingExecutionMode,
  CliReviewFindingSeverity,
  CliReviewFindingSourceType,
  CliReviewLifecycleStatus,
  CliReviewScopeMode,
} from '../constants/cli-review.constant.js';
import { CliHybridReviewRuntime } from '../runtime/review/cli-hybrid-review-runtime.js';
import { CliReviewFindingGenerator } from '../runtime/review/cli-review-finding-generator.js';
import { CliReviewLifecycleRuntime } from '../runtime/review/cli-review-lifecycle-runtime.js';
import { CliReviewTaskCardRuntime } from '../runtime/review/cli-review-task-card-runtime.js';
import type { CliCommandResultArtifact, CliCommandResultCheck } from '../types/interfaces/index.js';
import type {
  CliCommandExecutorContext,
  CliHybridReviewContext,
  CliReviewFinding,
  CliReviewRequestArtifactPayload,
  CliReviewStreamContext,
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
 * Owns `review` command execution outside the runtime facade.
 */
export class CliReviewCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.REVIEW;

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
    const hybridReviewRuntime = new CliHybridReviewRuntime(
      context.options.workspace.repositoryRoot,
    );
    const findingGenerator = new CliReviewFindingGenerator(
      context.options.workspace.repositoryRoot,
      (english, chinese) => context.localizeText(english, chinese),
    );
    const requestId = `review-${Date.now()}`;
    const generatedAt = new Date();
    const generatedAtTimestamp = context.toRfc3339SecondsTimestamp(generatedAt);
    const requestPath = resolve(reviewQueueDirectories.requestDirectoryPath, `${requestId}.json`);
    const correlationId = `review-chain-${requestId}`;
    const taskId = runtimeDebugOptions.taskId;
    const executionSessionId = `session-${requestId}`;
    const managedLedgerBackfill =
      runtimeDebugOptions.recordLedger === true && typeof taskId === 'string';
    const reviewMode = taskId ? CliReviewScopeMode.TASK_SCOPE : CliReviewScopeMode.WORKING_TREE;
    const streamMetadata = await context.resolveExecutionStreamMetadata();
    const streamContext = await reviewRuntime.resolveStreamContext();
    const changedPaths = await reviewRuntime.collectGitChangedPaths({
      excludePaths: reviewRuntime.resolveGeneratedPathPrefixes(),
    });
    const riskEvaluation = reviewRuntime.evaluateRisk(changedPaths);
    const generatedFindings = await findingGenerator.generateFindings({
      changedPaths,
      riskEvaluation,
    });
    const scopeSummary = this.buildScopeSummary(
      context,
      reviewMode,
      taskId,
      changedPaths,
      riskEvaluation,
      streamContext,
    );
    const initialHybridReviewContext = hybridReviewRuntime.buildHybridReviewContext({
      requestId,
      scope: {
        reviewMode,
        scopeSummary,
        reviewedPaths: changedPaths,
        excludedPaths: reviewRuntime.resolveGeneratedPathPrefixes(),
        riskLevel: riskEvaluation.riskLevel,
        requiredAction: riskEvaluation.requiredAction,
      },
      changedPaths,
      findings: generatedFindings,
    });
    const lifecycleGuardFindings = this.buildLifecycleGuardFindings(
      context,
      changedPaths,
      initialHybridReviewContext,
    );
    const seededFindings =
      lifecycleGuardFindings.length > 0
        ? [...generatedFindings, ...lifecycleGuardFindings]
        : generatedFindings;
    const hybridReviewContext =
      seededFindings === generatedFindings
        ? initialHybridReviewContext
        : hybridReviewRuntime.buildHybridReviewContext({
            requestId,
            scope: {
              reviewMode,
              scopeSummary,
              reviewedPaths: changedPaths,
              excludedPaths: reviewRuntime.resolveGeneratedPathPrefixes(),
              riskLevel: riskEvaluation.riskLevel,
              requiredAction: riskEvaluation.requiredAction,
            },
            changedPaths,
            findings: seededFindings,
          });
    const findings = hybridReviewRuntime.mergeFindings({
      deterministicFindings: hybridReviewContext.deterministicFindings,
      delegatedFindings: hybridReviewContext.standardsGuidedFindings,
      riskFindings: hybridReviewContext.riskFindings,
    });
    const hasOpenReviewLifecycle = findings.length > 0;
    const hasCoverageGap = this.hasCoverageGap(hybridReviewContext);
    const reviewSlug = reviewRuntime.createReviewSlug({
      taskId,
      createdAt: generatedAt,
    });
    const reviewStatus = hasOpenReviewLifecycle
      ? CliReviewLifecycleStatus.REVIEW_PENDING
      : CliReviewLifecycleStatus.RESOLVED;
    const reviewArtifactPath = reviewRuntime.resolveArtifactPath({
      reviewDirPath: streamContext.reviewDirPath,
      status: reviewStatus,
      slug: reviewSlug,
    });
    const notes = this.buildReviewNotes(
      context,
      reviewStatus,
      changedPaths.length,
      findings.length,
      hybridReviewContext,
    );
    const managedReviewContext = await reviewTaskCardRuntime.resolveManagedContext({
      streamContext,
      scopeTaskId: taskId,
    });
    const reviewTaskRecord = managedReviewContext
      ? await reviewTaskCardRuntime.createReviewTaskCard(context, {
          managedContext: managedReviewContext,
          reviewMode,
          scopeTaskId: taskId,
          reviewSlug,
          reviewStatus,
          occurredAt: generatedAtTimestamp,
          reviewArtifactPath,
          requestPath,
        })
      : null;
    const finalizedReviewDocument = this.renderReviewArtifact(context, {
      requestId,
      generatedAt,
      taskId,
      reviewMode,
      reviewStatus,
      reviewTaskId: reviewTaskRecord?.reviewTaskId ?? null,
      reviewSlug,
      reviewArtifactPath,
      changedPaths,
      findings,
      hybridReviewContext,
      scopeSummary,
      notes,
      streamContext,
      riskEvaluation,
    });
    const reviewRequestPayload: CliReviewRequestArtifactPayload = {
      requestId,
      status: CLI_REVIEW_REQUEST_STATUS.QUEUED,
      createdAt: generatedAtTimestamp,
      workspaceId: context.options.workspace.workspaceId,
      workspaceRoot: context.options.workspace.workspaceRoot,
      locale: context.options.locale,
      outputMode: context.options.outputMode,
      ...(taskId ? { taskId } : {}),
      ...(streamMetadata.projectId ? { projectId: streamMetadata.projectId } : {}),
      ...(streamMetadata.sprintId ? { sprintId: streamMetadata.sprintId } : {}),
      recordLedger: managedLedgerBackfill,
      reviewSlug,
      reviewArtifactPath,
      reviewArtifactStatus: reviewStatus,
      ...(reviewTaskRecord
        ? {
            reviewTaskId: reviewTaskRecord.reviewTaskId,
            reviewTaskCardPath: reviewTaskRecord.reviewTaskCardPath,
          }
        : {}),
      scope: {
        reviewMode,
        scopeSummary,
        reviewedPaths: changedPaths,
        excludedPaths: reviewRuntime.resolveGeneratedPathPrefixes(),
        riskLevel: riskEvaluation.riskLevel,
        requiredAction: riskEvaluation.requiredAction,
      },
      findings,
      hybridReviewContext,
      notes,
      generatedArtifactPaths: [
        reviewRuntime.toRepositoryRelativePath(requestPath),
        reviewRuntime.toRepositoryRelativePath(reviewArtifactPath),
        ...(reviewTaskRecord
          ? [reviewRuntime.toRepositoryRelativePath(reviewTaskRecord.reviewTaskCardPath)]
          : []),
      ],
      diagnosticContext: {
        correlationId,
        queueStage: 'review',
        chain: 'review->review-verify->ledger-backfill',
        ...(taskId ? { taskId } : {}),
        reviewChainMode: managedLedgerBackfill ? 'managed_task_chain' : 'queued_external_chain',
      },
      orchestrationExecutionId: requestId,
      orchestrationEventStreamToken: `pending-${requestId}`,
    };
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
        processId: 'review-queue',
      },
    );
    reviewRequestPayload.orchestrationExecutionId = orchestrationExecution.executionId;
    reviewRequestPayload.orchestrationEventStreamToken = orchestrationExecution.eventStreamToken;

    await context.artifactWriter.writeTextArtifact(reviewArtifactPath, finalizedReviewDocument);
    await context.artifactWriter.writeJsonArtifact(requestPath, reviewRequestPayload);
    if (reviewTaskRecord) {
      await this.runTaskLedgerSync(context, {
        reviewTaskId: reviewTaskRecord.reviewTaskId,
        reviewStatus,
        reviewArtifactPath,
      });
    }
    await context.orchestrationServiceRuntime.publishEvent({
      executionId: requestId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: OrchestrationExecutionStatus.RUNNING,
      artifactId: CliReviewArtifactId.REVIEW_REQUEST,
      artifactPath: requestPath,
      message: context.localizeText(
        `Queued review transport artifact at ${requestPath}.`,
        `已在 ${requestPath} 写入 review transport 产物。`,
      ),
    });
    await context.orchestrationServiceRuntime.publishEvent({
      executionId: requestId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: OrchestrationExecutionStatus.RUNNING,
      artifactId: CliReviewArtifactId.REVIEW_ARTIFACT,
      artifactPath: reviewArtifactPath,
      message: context.localizeText(
        `Persisted review lifecycle artifact at ${reviewArtifactPath}.`,
        `已在 ${reviewArtifactPath} 写入 review lifecycle artifact。`,
      ),
    });
    await context.orchestrationServiceRuntime.publishEvent({
      executionId: requestId,
      type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
      status: OrchestrationExecutionStatus.COMPLETED,
      message: context.localizeText(
        `Review execution ${requestId} completed.`,
        `Review 执行 ${requestId} 已完成。`,
      ),
    });
    const orchestrationSummary = await context.orchestrationServiceRuntime.getExecution(
      orchestrationExecution.executionId,
    );

    const reviewVerifyAction = managedLedgerBackfill
      ? context.localizeText(
          `Execute \`repo-ai-governor review-verify --record-ledger --task-id ${taskId}\` to continue the managed review chain.`,
          `执行 \`repo-ai-governor review-verify --record-ledger --task-id ${taskId}\` 以继续托管的 review 链路。`,
        )
      : context.localizeText(
          'Execute `repo-ai-governor review-verify` to verify the persisted review artifact.',
          '执行 `repo-ai-governor review-verify` 以复核已落盘的 review artifact。',
        );
    const checks = this.buildChecks(
      findings,
      reviewStatus,
      requestPath,
      reviewArtifactPath,
      hybridReviewContext,
    );
    const artifacts: CliCommandResultArtifact[] = [
      {
        id: CliReviewArtifactId.REVIEW_REQUEST,
        path: requestPath,
      },
      {
        id: CliReviewArtifactId.REVIEW_ARTIFACT,
        path: reviewArtifactPath,
      },
      ...(reviewTaskRecord
        ? [
            {
              id: CliReviewArtifactId.REVIEW_TASK_CARD,
              path: reviewTaskRecord.reviewTaskCardPath,
            } satisfies CliCommandResultArtifact,
          ]
        : []),
    ];
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'reviewer',
          stage: ExecutionProgressStage.REVIEW,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: context.localizeText(
            hasOpenReviewLifecycle
              ? 'Review findings were generated and persisted.'
              : 'Review completed with no actionable findings.',
            hasOpenReviewLifecycle
              ? '已生成并落盘 review findings。'
              : 'review 已完成，当前没有可执行 finding。',
          ),
          detail: `request_id=${requestId} findings=${findings.length}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW,
            artifactPath: reviewArtifactPath,
          },
        },
        {
          roleId: 'verifier',
          stage: ExecutionProgressStage.REVIEW_VERIFY,
          status: hasOpenReviewLifecycle
            ? ExecutionProgressStatus.QUEUED
            : ExecutionProgressStatus.COMPLETED,
          category: hasOpenReviewLifecycle
            ? ExecutionInteractionCategory.POLICY_WAITING
            : ExecutionInteractionCategory.NONE,
          summary: hasOpenReviewLifecycle
            ? context.localizeText(
                'Review verify is available for the persisted artifact.',
                '已可针对落盘的 review artifact 执行 review-verify。',
              )
            : context.localizeText(
                hasCoverageGap
                  ? 'No review-verify action is required because no findings were emitted; uncovered projected rules were recorded for future delegated or manual follow-up.'
                  : 'No follow-up verify action is required unless you want an explicit closure record.',
                hasCoverageGap
                  ? '由于当前没有生成 finding，因此无需执行 review-verify；uncovered projected rules 已记录为后续 delegated 或人工补充复核的输入。'
                  : '除非你需要显式 closure 记录，否则当前无需额外执行 review-verify。',
              ),
          detail: taskId ? `chain=${correlationId} task_id=${taskId}` : `chain=${correlationId}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW_VERIFY,
            artifactPath: requestPath,
          },
        },
      ],
      interactionPrompts: hasOpenReviewLifecycle
        ? [
            {
              category: ExecutionInteractionCategory.POLICY_WAITING,
              stage: ExecutionProgressStage.REVIEW_VERIFY,
              title: context.localizeText('Run review-verify', '执行 review-verify'),
              action: reviewVerifyAction,
              blocking: false,
            },
          ]
        : [],
      layeredLogs: {
        summary: [
          `review_request=${requestId}`,
          `review_status=${reviewStatus}`,
          `finding_count=${findings.length}`,
          `uncovered_rule_count=${hybridReviewContext.uncoveredRuleIds.length}`,
          `coverage_residual_gap_count=${hybridReviewContext.coverageSummary.residualGapRuleCount}`,
          `delegated_activation_policy=${hybridReviewContext.delegatedReviewActivationPolicy.level}`,
        ],
        detailed: [
          `request_path=${requestPath}`,
          `review_artifact_path=${reviewArtifactPath}`,
          `scope_mode=${reviewMode}`,
          `projected_rule_bundle=${hybridReviewContext.projectedRuleBundle.bundleId}@${hybridReviewContext.projectedRuleBundle.bundleVersion}`,
          `coverage_total_rule_count=${hybridReviewContext.coverageSummary.totalApplicableRuleCount}`,
          `manual_only_gap_count=${hybridReviewContext.coverageSummary.manualOnlyGapRuleCount}`,
          ...(taskId ? [`task_id=${taskId}`] : []),
        ],
      },
    });
    const message = hasOpenReviewLifecycle
      ? context.localizeText(
          `Review completed with ${findings.length} finding(s); artifact=${reviewArtifactPath}.`,
          `review 已完成，共生成 ${findings.length} 条 finding；artifact=${reviewArtifactPath}。`,
        )
      : context.localizeText(
          hasCoverageGap
            ? `Review completed with no actionable findings; uncovered projected rules were recorded for future delegated or manual follow-up; artifact=${reviewArtifactPath}.`
            : `Review completed with no actionable findings; artifact=${reviewArtifactPath}.`,
          hasCoverageGap
            ? `review 已完成，当前没有可执行 finding；uncovered projected rules 已记录为后续 delegated 或人工补充复核输入；artifact=${reviewArtifactPath}。`
            : `review 已完成，当前没有可执行 finding；artifact=${reviewArtifactPath}。`,
        );

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.REVIEW_QUEUE,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        details: {
          review_artifact_path: reviewArtifactPath,
          review_status: reviewStatus,
          review_mode: reviewMode,
          ...(reviewTaskRecord
            ? {
                review_task_id: reviewTaskRecord.reviewTaskId,
                review_task_card_path: reviewTaskRecord.reviewTaskCardPath,
              }
            : {}),
          request_path: requestPath,
          finding_count: findings.length,
          deterministic_finding_count: hybridReviewContext.deterministicFindings.length,
          standards_guided_finding_count: hybridReviewContext.standardsGuidedFindings.length,
          risk_finding_count: hybridReviewContext.riskFindings.length,
          projected_rule_bundle_id: hybridReviewContext.projectedRuleBundle.bundleId,
          projected_rule_bundle_version: hybridReviewContext.projectedRuleBundle.bundleVersion,
          uncovered_rule_count: hybridReviewContext.uncoveredRuleIds.length,
          coverage_total_rule_count: hybridReviewContext.coverageSummary.totalApplicableRuleCount,
          coverage_deterministic_rule_count:
            hybridReviewContext.coverageSummary.deterministicCoveredRuleCount,
          coverage_standards_guided_rule_count:
            hybridReviewContext.coverageSummary.standardsGuidedCoveredRuleCount,
          coverage_residual_gap_rule_count:
            hybridReviewContext.coverageSummary.residualGapRuleCount,
          coverage_manual_only_gap_rule_count:
            hybridReviewContext.coverageSummary.manualOnlyGapRuleCount,
          delegated_activation_policy: hybridReviewContext.delegatedReviewActivationPolicy.level,
          reviewed_path_count: changedPaths.length,
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

  private buildChecks(
    findings: CliReviewFinding[],
    reviewStatus: CliReviewLifecycleStatus,
    requestPath: string,
    reviewArtifactPath: string,
    hybridReviewContext: CliHybridReviewContext,
  ): CliCommandResultCheck[] {
    return [
      {
        id: CliReviewArtifactId.REVIEW_REQUEST,
        status: CliGovernanceCheckStatus.PASS,
        detail: requestPath,
      },
      {
        id: CliReviewArtifactId.REVIEW_ARTIFACT,
        status: CliGovernanceCheckStatus.PASS,
        detail: `status=${reviewStatus} path=${reviewArtifactPath}`,
      },
      {
        id: 'review_findings',
        status:
          findings.length > 0 || this.hasCoverageGap(hybridReviewContext)
            ? CliGovernanceCheckStatus.WARN
            : CliGovernanceCheckStatus.PASS,
        detail: `count=${findings.length} deterministic=${hybridReviewContext.deterministicFindings.length} standards_guided=${hybridReviewContext.standardsGuidedFindings.length} risk=${hybridReviewContext.riskFindings.length} residual_gap=${hybridReviewContext.coverageSummary.residualGapRuleCount} delegated_policy=${hybridReviewContext.delegatedReviewActivationPolicy.level}`,
      },
    ];
  }

  private async runTaskLedgerSync(
    context: CliCommandExecutorContext,
    options: {
      reviewTaskId: string;
      reviewStatus: CliReviewLifecycleStatus;
      reviewArtifactPath: string;
    },
  ): Promise<void> {
    const syncScriptPath = resolveTaskLedgerSyncScriptPath();
    if (!syncScriptPath) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        context.localizeText(
          'sync-task-ledger.js could not be resolved from current installation.',
          '当前安装中无法解析 sync-task-ledger.js。',
        ),
      );
    }

    await context.runNodeScript(syncScriptPath, [
      '--workspace-root',
      context.options.workspace.workspaceRoot,
      '--task-id',
      options.reviewTaskId,
      '--execution-id',
      `review-${Date.now()}`,
      '--result',
      `review artifact ${options.reviewArtifactPath} created with status ${options.reviewStatus}`,
      '--verify',
      `review command initialized ${options.reviewTaskId} as ${options.reviewStatus}`,
      '--review-delta',
      options.reviewArtifactPath,
      '--checklist-note',
      context.localizeText(
        `review initialized ${options.reviewTaskId} from ${options.reviewArtifactPath}.`,
        `review 已从 ${options.reviewArtifactPath} 初始化 ${options.reviewTaskId}。`,
      ),
    ]);
  }

  private buildScopeSummary(
    context: CliCommandExecutorContext,
    reviewMode: CliReviewScopeMode,
    taskId: string | null,
    changedPaths: string[],
    riskEvaluation: ChangeRiskEvaluationResult,
    streamContext: CliReviewStreamContext,
  ): string {
    const scopeLabel =
      reviewMode === CliReviewScopeMode.TASK_SCOPE && taskId
        ? context.localizeText(`task ${taskId}`, `任务 ${taskId}`)
        : context.localizeText('current working tree', '当前 working tree');
    const streamLabel =
      streamContext.projectId && streamContext.sprintId
        ? context.localizeText(
            `stream ${streamContext.projectId}/${streamContext.sprintId}`,
            `执行流 ${streamContext.projectId}/${streamContext.sprintId}`,
          )
        : context.localizeText('fallback review directory', 'fallback review 目录');
    return context.localizeText(
      `${scopeLabel}; changed_paths=${changedPaths.length}; risk_level=${riskEvaluation.riskLevel}; required_action=${riskEvaluation.requiredAction}; ${streamLabel}.`,
      `${scopeLabel}；changed_paths=${changedPaths.length}；risk_level=${riskEvaluation.riskLevel}；required_action=${riskEvaluation.requiredAction}；${streamLabel}。`,
    );
  }

  private buildReviewNotes(
    context: CliCommandExecutorContext,
    reviewStatus: CliReviewLifecycleStatus,
    changedPathCount: number,
    _findingCount: number,
    hybridReviewContext: CliHybridReviewContext,
  ): string[] {
    const applicableRuleIds = hybridReviewContext.projectedRules.map((rule) => rule.ruleId);
    const coverageGapRuleIds = this.collectCoverageGapRuleIds(hybridReviewContext);
    const hasCoverageGap = coverageGapRuleIds.length > 0;

    return [
      context.localizeText(
        `Projected rule bundle: ${hybridReviewContext.projectedRuleBundle.bundleId}@${hybridReviewContext.projectedRuleBundle.bundleVersion}.`,
        `已加载 projected rule bundle：${hybridReviewContext.projectedRuleBundle.bundleId}@${hybridReviewContext.projectedRuleBundle.bundleVersion}。`,
      ),
      context.localizeText(
        applicableRuleIds.length > 0
          ? `Applicable projected rules: ${applicableRuleIds.join(', ')}.`
          : 'No projected review rules were applicable to the current scope.',
        applicableRuleIds.length > 0
          ? `当前 scope 适用的 projected rules：${applicableRuleIds.join('、')}。`
          : '当前 scope 没有命中的 projected review rules。',
      ),
      context.localizeText(
        hasCoverageGap
          ? `Coverage gap rule ids reserved for future delegated and/or manual follow-up: ${coverageGapRuleIds.join(', ')}.`
          : 'No projected rule coverage gaps remain for the current scope.',
        hasCoverageGap
          ? `已为后续 delegated 和/或人工补充复核保留 coverage gap rule ids：${coverageGapRuleIds.join('、')}。`
          : '当前 scope 没有剩余的 projected rule coverage gap。',
      ),
      context.localizeText(
        `Hybrid dedupe strategy: ${hybridReviewContext.dedupeStrategy}.`,
        `hybrid 去重策略：${hybridReviewContext.dedupeStrategy}。`,
      ),
      this.buildDelegatedActivationNote(context, hybridReviewContext),
      ...this.buildManualGapNotes(context, hybridReviewContext),
      context.localizeText(
        'Queued review request artifacts remain transport-only; the lifecycle markdown artifact is the canonical review truth.',
        'queued review request 产物只保留为 transport-only；canonical review truth 固定落在 lifecycle markdown artifact。',
      ),
      changedPathCount === 0
        ? context.localizeText(
            'No git working-tree paths were detected for the current scope, so this review resolved without actionable findings.',
            '当前 scope 没有检测到 git working-tree 路径，因此这次 review 以“无可执行 finding”收口。',
          )
        : reviewStatus === CliReviewLifecycleStatus.RESOLVED && hasCoverageGap
          ? context.localizeText(
              'This lifecycle artifact resolved without emitted findings; remaining projected rule coverage gaps were recorded for future delegated or manual follow-up outside review-verify.',
              '这份 lifecycle artifact 已在“无 emitted finding”状态下 resolved；剩余 projected rule coverage gaps 已记录为后续 delegated 或人工补充复核输入，不再通过 review-verify 持续保持 pending。',
            )
          : reviewStatus === CliReviewLifecycleStatus.REVIEW_PENDING
            ? context.localizeText(
                'Run review-verify after applying fixes or when you want an explicit verification decision.',
                '当修复完成，或需要显式 verification decision 时，再执行 review-verify。',
              )
            : context.localizeText(
                'This review already resolved at generation time; review-verify is optional and only needed for an explicit closure receipt.',
                '这次 review 在生成阶段就已 resolved；review-verify 仅在需要显式 closure receipt 时才是可选动作。',
              ),
    ];
  }

  private buildLifecycleGuardFindings(
    context: CliCommandExecutorContext,
    changedPaths: string[],
    hybridReviewContext: CliHybridReviewContext,
  ): CliReviewFinding[] {
    const buildEvidenceFinding = this.buildBuildEvidenceGuardFinding(
      context,
      changedPaths,
      hybridReviewContext,
    );

    return buildEvidenceFinding ? [buildEvidenceFinding] : [];
  }

  private buildBuildEvidenceGuardFinding(
    context: CliCommandExecutorContext,
    changedPaths: string[],
    hybridReviewContext: CliHybridReviewContext,
  ): CliReviewFinding | null {
    if (!hybridReviewContext.uncoveredRuleIds.includes('review-rule.cs-034-build-evidence')) {
      return null;
    }

    const firstCodeAffectingPath =
      changedPaths.find((changedPath) => /^(apps|packages|bin|test)\//u.test(changedPath)) ?? null;
    if (!firstCodeAffectingPath) {
      return null;
    }

    return {
      findingId: this.createSyntheticFindingId(
        'review-rule.cs-034-build-evidence',
        firstCodeAffectingPath,
      ),
      fingerprint: `review-rule.cs-034-build-evidence:${firstCodeAffectingPath}:0`,
      ruleId: 'review-rule.cs-034-build-evidence',
      severity: CliReviewFindingSeverity.P1,
      sourceType: CliReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE,
      executionMode: CliReviewFindingExecutionMode.STANDARDS_GUIDED,
      semanticKey: 'code-standards.cs-034',
      standardsSourceRefs: [
        '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-034',
        '.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md#completion-claim-and-review-closure-build-protocol',
      ],
      title: context.localizeText(
        'Same-window build evidence is required before this review can resolve',
        '在这次 review 可以 resolved 之前，必须补齐同窗口 build 证据。',
      ),
      file: firstCodeAffectingPath,
      summary: context.localizeText(
        'This scope changes code-affecting paths, but the current review window still lacks the required same-window `pnpm run build` evidence.',
        '当前 scope 修改了 code-affecting 路径，但这次 review 窗口里仍缺少必需的同窗口 `pnpm run build` 证据。',
      ),
      impact: context.localizeText(
        'Emitting a resolved lifecycle artifact without build evidence would create a false-green closeout path for code-affecting work.',
        '如果在缺少 build 证据时仍输出 resolved lifecycle artifact，会为 code-affecting 变更制造一条 false-green 的收口路径。',
      ),
      suggestedAction: context.localizeText(
        'Run `pnpm run build` in the same change window and keep this review open until that evidence is recorded in the closeout trail.',
        '在同一变更窗口执行 `pnpm run build`，并在 closeout 证据链记录该结果之前保持这轮 review 处于打开状态。',
      ),
      evidence: [
        firstCodeAffectingPath,
        '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-034',
        '.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md#completion-claim-and-review-closure-build-protocol',
      ],
      reviewerRationale: context.localizeText(
        'The projected CS-034 rule is applicable to this scope and must stay actionable until build evidence exists.',
        '投影出的 CS-034 规则已经命中当前 scope；在 build 证据存在之前，它必须保持为可执行 finding。',
      ),
    };
  }

  private createSyntheticFindingId(ruleId: string, filePath: string, line = 0): string {
    return `${ruleId}-${filePath}-${line}`
      .replace(/[^A-Za-z0-9]+/gu, '-')
      .replace(/^-+/u, '')
      .replace(/-+$/u, '')
      .toLowerCase();
  }

  private renderReviewArtifact(
    context: CliCommandExecutorContext,
    options: {
      requestId: string;
      generatedAt: Date;
      taskId: string | null;
      reviewMode: CliReviewScopeMode;
      reviewStatus: CliReviewLifecycleStatus;
      reviewTaskId: string | null;
      reviewSlug: string;
      reviewArtifactPath: string;
      changedPaths: string[];
      findings: CliReviewFinding[];
      hybridReviewContext: CliHybridReviewContext;
      scopeSummary: string;
      notes: string[];
      streamContext: CliReviewStreamContext;
      riskEvaluation: ChangeRiskEvaluationResult;
    },
  ): string {
    const dateOnly = this.formatDateOnly(options.generatedAt);
    const title = options.taskId
      ? context.localizeText(`Code Review: ${options.taskId}`, `代码评审：${options.taskId}`)
      : context.localizeText('Code Review: working tree', '代码评审：working tree');
    const scopeHeading = context.localizeText('## 1. Review Scope', '## 1. 评审范围');
    const deterministicHeading = context.localizeText(
      '## 2. Deterministic Rule Findings',
      '## 2. 确定性规则发现',
    );
    const standardsGuidedHeading = context.localizeText(
      '## 3. Standards-Guided Findings',
      '## 3. 标准引导推断发现',
    );
    const riskHeading = context.localizeText(
      '## 4. Residual Risk Observations',
      '## 4. 剩余风险观察',
    );
    const coverageHeading = context.localizeText('## 5. Coverage Summary', '## 5. 覆盖率摘要');
    const notesHeading = context.localizeText('## 6. Notes', '## 6. 说明');
    const handoffHeading = context.localizeText(
      '## 7. Delegated Reviewer Handoff',
      '## 7. 委托 reviewer 交接契约',
    );
    const deterministicFindings = options.findings.filter(
      (finding) => finding.sourceType === ReviewFindingSourceType.DETERMINISTIC_RULE,
    );
    const standardsGuidedFindings = options.findings.filter(
      (finding) => finding.sourceType === ReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE,
    );
    const riskFindings = options.findings.filter(
      (finding) => finding.sourceType === ReviewFindingSourceType.RISK_INFERENCE,
    );

    return [
      `# ${title}`,
      '',
      `- Status: ${options.reviewStatus}`,
      `- Date: ${dateOnly}`,
      `- Reviewer: ${context.localizeText('repo-ai-governor CLI', 'repo-ai-governor CLI')}`,
      `- Task: \`${options.taskId ?? 'n/a'}\``,
      ...(options.reviewTaskId
        ? [`- ${context.localizeText('Review Task', '评审任务')}: \`${options.reviewTaskId}\``]
        : []),
      `- ${context.localizeText('Review Type', '评审类型')}: ${
        options.reviewMode === CliReviewScopeMode.TASK_SCOPE
          ? context.localizeText('task-aware review', '任务感知评审')
          : context.localizeText('working tree review', '工作树评审')
      }`,
      `- ${context.localizeText('Scope Mode', '范围模式')}: \`${options.reviewMode}\``,
      `- ${context.localizeText('Request ID', '请求 ID')}: \`${options.requestId}\``,
      `- ${context.localizeText('Review Slug', '评审 Slug')}: \`${options.reviewSlug}\``,
      `- ${context.localizeText('Review Artifact', '评审产物')}: \`${options.reviewArtifactPath}\``,
      `- ${context.localizeText('Projected Rule Bundle', '规则投影包')}: \`${options.hybridReviewContext.projectedRuleBundle.bundleId}@${options.hybridReviewContext.projectedRuleBundle.bundleVersion}\``,
      ...(options.streamContext.projectId
        ? [`- Project: \`${options.streamContext.projectId}\``]
        : []),
      ...(options.streamContext.sprintId
        ? [`- Sprint: \`${options.streamContext.sprintId}\``]
        : []),
      '',
      scopeHeading,
      '',
      `1. ${options.scopeSummary}`,
      `2. ${context.localizeText('Changed paths', '变更路径')}: ${
        options.changedPaths.length > 0 ? options.changedPaths.length : 0
      }`,
      ...(options.changedPaths.length > 0
        ? options.changedPaths.map((changedPath, index) => `${index + 3}. \`${changedPath}\``)
        : [
            context.localizeText(
              '3. No changed paths were detected.',
              '3. 当前没有检测到变更路径。',
            ),
          ]),
      `${options.changedPaths.length + 3}. ${context.localizeText('Risk level', '风险级别')}: \`${options.riskEvaluation.riskLevel}\``,
      `${options.changedPaths.length + 4}. ${context.localizeText('Required action', '所需动作')}: \`${options.riskEvaluation.requiredAction}\``,
      `${options.changedPaths.length + 5}. ${context.localizeText('Applicable projected rules', '适用 projected rules')}: ${options.hybridReviewContext.projectedRules.length}`,
      `${options.changedPaths.length + 6}. ${context.localizeText('Uncovered delegated rules', '待 delegated 覆盖规则数')}: ${options.hybridReviewContext.uncoveredRuleIds.length}`,
      '',
      deterministicHeading,
      '',
      this.renderFindingSection(context, deterministicFindings, 2),
      '',
      standardsGuidedHeading,
      '',
      this.renderFindingSection(context, standardsGuidedFindings, 3),
      '',
      riskHeading,
      '',
      this.renderFindingSection(context, riskFindings, 4),
      '',
      coverageHeading,
      '',
      ...this.renderCoverageSummary(context, options.hybridReviewContext),
      '',
      notesHeading,
      '',
      ...options.notes.map((note, index) => `${index + 1}. ${note}`),
      '',
      handoffHeading,
      '',
      ...this.renderDelegatedReviewHandoff(context, options.hybridReviewContext),
      '',
    ].join('\n');
  }

  private renderFindingSection(
    context: CliCommandExecutorContext,
    findings: CliReviewFinding[],
    sectionNumber: number,
  ): string {
    if (findings.length === 0) {
      return context.localizeText(
        'No actionable findings were identified for this provenance group.',
        '该 provenance 分组下没有识别到可执行的 finding。',
      );
    }

    return findings
      .map((finding, index) => this.renderFindingEntry(context, finding, sectionNumber, index + 1))
      .join('\n\n');
  }

  private renderFindingEntry(
    context: CliCommandExecutorContext,
    finding: CliReviewFinding,
    sectionNumber: number,
    findingNumber: number,
  ): string {
    return [
      `### ${sectionNumber}.${findingNumber} [${finding.severity}] ${finding.title}`,
      `- ${context.localizeText('Finding ID', '发现 ID')}: \`${finding.findingId}\``,
      `- ${context.localizeText('Rule ID', '规则 ID')}: \`${finding.ruleId}\``,
      ...(finding.sourceType
        ? [`- ${context.localizeText('Source Type', '来源类型')}: \`${finding.sourceType}\``]
        : []),
      ...(finding.executionMode
        ? [`- ${context.localizeText('Execution Mode', '执行模式')}: \`${finding.executionMode}\``]
        : []),
      ...(finding.semanticKey
        ? [`- ${context.localizeText('Semantic Key', '语义键')}: \`${finding.semanticKey}\``]
        : []),
      `- ${context.localizeText('File', '文件')}: \`${finding.file}\`${typeof finding.line === 'number' ? `:${finding.line}` : ''}`,
      `- ${context.localizeText('Summary', '摘要')}: ${finding.summary}`,
      `- ${context.localizeText('Impact', '影响')}: ${finding.impact}`,
      `- ${context.localizeText('Suggested Action', '建议动作')}: ${finding.suggestedAction}`,
      ...(typeof finding.confidence === 'number'
        ? [`- ${context.localizeText('Confidence', '置信度')}: \`${finding.confidence}\``]
        : []),
      ...this.renderListField(
        context.localizeText('Standards Source', '规范来源'),
        finding.standardsSourceRefs ?? [],
      ),
      ...this.renderListField(
        context.localizeText('Projected Pack', '投影包'),
        finding.projectedPackRefs ?? [],
      ),
      ...finding.evidence.map(
        (evidence, evidenceIndex) =>
          `- ${context.localizeText('Evidence', '证据')} ${evidenceIndex + 1}: ${evidence}`,
      ),
    ].join('\n');
  }

  private renderListField(label: string, values: string[]): string[] {
    return values.map((value, index) => `- ${label} ${index + 1}: ${value}`);
  }

  private renderDelegatedReviewHandoff(
    context: CliCommandExecutorContext,
    hybridReviewContext: CliHybridReviewContext,
  ): string[] {
    const delegatedReviewRequest = hybridReviewContext.delegatedReviewRequest;

    return [
      `1. ${context.localizeText('Structured request id', '结构化请求 ID')}: \`${delegatedReviewRequest.requestId}\``,
      `2. ${context.localizeText('Review surface count', 'review surface 数量')}: ${delegatedReviewRequest.reviewSurface.length}`,
      `3. ${context.localizeText('Projected rules handed off', '交接的 projected rules 数量')}: ${delegatedReviewRequest.projectedRules.length}`,
      `4. ${context.localizeText('Uncovered delegated rule ids', '待 delegated 处理规则数')}: ${delegatedReviewRequest.uncoveredRuleIds.length}`,
      `5. ${context.localizeText('Delegated activation policy', 'delegated 激活策略')}: \`${delegatedReviewRequest.delegatedReviewActivationPolicy.level}\``,
      `6. ${context.localizeText('Manual follow-up required', '是否需要人工补充跟进')}: \`${delegatedReviewRequest.delegatedReviewActivationPolicy.manualFollowUpRequired}\``,
      `7. ${context.localizeText('Deterministic findings already covered', '已覆盖的 deterministic finding 数量')}: ${delegatedReviewRequest.deterministicFindings.length}`,
      `8. ${context.localizeText('Adapter-neutral transport note', 'adapter-neutral 传输说明')}: ${context.localizeText(
        'The markdown reviewer prompt is only a rendered transport view of this structured handoff contract.',
        'markdown reviewer prompt 只是这份结构化 handoff contract 的 transport view。',
      )}`,
      ...delegatedReviewRequest.delegatedReviewActivationPolicy.reasonCodes.map(
        (reasonCode, index) =>
          `- ${context.localizeText('Activation Reason', '激活原因')} ${index + 1}: \`${reasonCode}\``,
      ),
      ...delegatedReviewRequest.reviewSurface.map(
        (reviewSurface, index) =>
          `- ${context.localizeText('Review Surface', 'Review Surface')} ${index + 1}: \`${reviewSurface}\``,
      ),
      ...delegatedReviewRequest.requiredNormativeInputs.map(
        (requiredInput, index) =>
          `- ${context.localizeText('Required Normative Input', '必需规范输入')} ${index + 1}: \`${requiredInput}\``,
      ),
    ];
  }

  private renderCoverageSummary(
    context: CliCommandExecutorContext,
    hybridReviewContext: CliHybridReviewContext,
  ): string[] {
    const coverageSummary = hybridReviewContext.coverageSummary;
    const activationPolicy = hybridReviewContext.delegatedReviewActivationPolicy;

    return [
      `1. ${context.localizeText('Total applicable projected rules', '适用 projected rules 总数')}: ${coverageSummary.totalApplicableRuleCount}`,
      `2. ${context.localizeText('Deterministically covered rules', '确定性覆盖规则数')}: ${coverageSummary.deterministicCoveredRuleCount}`,
      `3. ${context.localizeText('Standards-guided covered rules', '标准引导已覆盖规则数')}: ${coverageSummary.standardsGuidedCoveredRuleCount}`,
      `4. ${context.localizeText('Residual gap rules', '剩余覆盖缺口规则数')}: ${coverageSummary.residualGapRuleCount}`,
      `5. ${context.localizeText('Manual-only gaps', '仅人工缺口规则数')}: ${coverageSummary.manualOnlyGapRuleCount}`,
      `6. ${context.localizeText('Delegated activation policy', 'delegated 激活策略')}: \`${activationPolicy.level}\``,
      ...this.renderListField(
        context.localizeText('Deterministic Coverage Rule', '确定性覆盖规则'),
        coverageSummary.deterministicCoveredRuleIds,
      ),
      ...this.renderListField(
        context.localizeText('Standards-Guided Coverage Rule', '标准引导已覆盖规则'),
        coverageSummary.standardsGuidedCoveredRuleIds,
      ),
      ...this.renderListField(
        context.localizeText('Residual Gap Rule', '剩余缺口规则'),
        coverageSummary.residualGapRuleIds,
      ),
      ...this.renderListField(
        context.localizeText('Manual-Only Gap Rule', '仅人工缺口规则'),
        coverageSummary.manualOnlyGapRuleIds,
      ),
    ];
  }

  private buildDelegatedActivationNote(
    context: CliCommandExecutorContext,
    hybridReviewContext: CliHybridReviewContext,
  ): string {
    const activationPolicy = hybridReviewContext.delegatedReviewActivationPolicy;
    if (activationPolicy.level === CliDelegatedReviewActivationLevel.REQUIRED) {
      return context.localizeText(
        'Delegated review should be treated as required for this scope because standards-guided coverage gaps remain and the current risk decision is not allow.',
        '当前 scope 仍存在 standards-guided coverage gaps，且风险决策不是 allow，因此 delegated review 应视为 required。',
      );
    }

    if (activationPolicy.level === CliDelegatedReviewActivationLevel.RECOMMENDED) {
      return context.localizeText(
        'Delegated review is recommended for this scope because standards-guided coverage gaps remain after the deterministic pass.',
        'deterministic pass 之后仍存在 standards-guided coverage gaps，因此当前 scope 推荐开启 delegated review。',
      );
    }

    return context.localizeText(
      'Delegated review remains optional because no delegatable coverage gaps remain for the current scope.',
      '当前 scope 没有剩余可交给 delegated review 的 coverage gap，因此 delegated review 保持 optional。',
    );
  }

  private buildManualGapNotes(
    context: CliCommandExecutorContext,
    hybridReviewContext: CliHybridReviewContext,
  ): string[] {
    if (!hybridReviewContext.delegatedReviewActivationPolicy.manualFollowUpRequired) {
      return [];
    }

    return [
      context.localizeText(
        'Manual-only coverage gaps remain; delegated review alone is not sufficient and an explicit human/manual follow-up is still required.',
        '当前仍有 manual-only coverage gaps；仅靠 delegated review 不足以收口，仍需要显式人工补充跟进。',
      ),
    ];
  }

  private hasCoverageGap(hybridReviewContext: CliHybridReviewContext): boolean {
    return this.collectCoverageGapRuleIds(hybridReviewContext).length > 0;
  }

  private collectCoverageGapRuleIds(hybridReviewContext: CliHybridReviewContext): string[] {
    return Array.from(
      new Set([
        ...hybridReviewContext.coverageSummary.residualGapRuleIds,
        ...hybridReviewContext.coverageSummary.manualOnlyGapRuleIds,
      ]),
    );
  }

  private formatDateOnly(value: Date): string {
    const year = String(value.getFullYear());
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
