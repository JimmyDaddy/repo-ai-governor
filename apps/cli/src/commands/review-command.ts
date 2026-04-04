import { resolve } from 'node:path';
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
} from '@repo-ai-governor/shared';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_REVIEW_REQUEST_STATUS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import {
  CliReviewArtifactId,
  CliReviewLifecycleStatus,
  CliReviewScopeMode,
} from '../constants/cli-review.constant.js';
import { CliReviewFindingGenerator } from '../runtime/review/cli-review-finding-generator.js';
import { CliReviewLifecycleRuntime } from '../runtime/review/cli-review-lifecycle-runtime.js';
import type { CliCommandResultArtifact, CliCommandResultCheck } from '../types/interfaces/index.js';
import type {
  CliCommandExecutorContext,
  CliReviewFinding,
  CliReviewRequestArtifactPayload,
  CliReviewStreamContext,
} from '../types/interfaces/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

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
    const findings = await findingGenerator.generateFindings({
      changedPaths,
      riskEvaluation,
    });
    const reviewSlug = reviewRuntime.createReviewSlug({
      taskId,
      createdAt: generatedAt,
    });
    const reviewStatus =
      findings.length > 0
        ? CliReviewLifecycleStatus.REVIEW_PENDING
        : CliReviewLifecycleStatus.RESOLVED;
    const reviewArtifactPath = reviewRuntime.resolveArtifactPath({
      reviewDirPath: streamContext.reviewDirPath,
      status: reviewStatus,
      slug: reviewSlug,
    });
    const scopeSummary = this.buildScopeSummary(
      context,
      reviewMode,
      taskId,
      changedPaths,
      riskEvaluation,
      streamContext,
    );
    const notes = this.buildReviewNotes(context, reviewStatus, changedPaths.length);
    const reviewDocument = this.renderReviewArtifact(context, {
      requestId,
      generatedAt,
      taskId,
      reviewMode,
      reviewStatus,
      reviewSlug,
      reviewArtifactPath,
      changedPaths,
      findings,
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
      scope: {
        reviewMode,
        scopeSummary,
        reviewedPaths: changedPaths,
        excludedPaths: reviewRuntime.resolveGeneratedPathPrefixes(),
        riskLevel: riskEvaluation.riskLevel,
        requiredAction: riskEvaluation.requiredAction,
      },
      findings,
      notes,
      generatedArtifactPaths: [
        reviewRuntime.toRepositoryRelativePath(requestPath),
        reviewRuntime.toRepositoryRelativePath(reviewArtifactPath),
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

    await context.artifactWriter.writeTextArtifact(reviewArtifactPath, reviewDocument);
    await context.artifactWriter.writeJsonArtifact(requestPath, reviewRequestPayload);
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
    const checks = this.buildChecks(findings, reviewStatus, requestPath, reviewArtifactPath);
    const artifacts: CliCommandResultArtifact[] = [
      {
        id: CliReviewArtifactId.REVIEW_REQUEST,
        path: requestPath,
      },
      {
        id: CliReviewArtifactId.REVIEW_ARTIFACT,
        path: reviewArtifactPath,
      },
    ];
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'reviewer',
          stage: ExecutionProgressStage.REVIEW,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: context.localizeText(
            findings.length > 0
              ? 'Review findings were generated and persisted.'
              : 'Review completed with no actionable findings.',
            findings.length > 0
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
          status:
            findings.length > 0
              ? ExecutionProgressStatus.QUEUED
              : ExecutionProgressStatus.COMPLETED,
          category:
            findings.length > 0
              ? ExecutionInteractionCategory.POLICY_WAITING
              : ExecutionInteractionCategory.NONE,
          summary:
            findings.length > 0
              ? context.localizeText(
                  'Review verify is available for the persisted artifact.',
                  '已可针对落盘的 review artifact 执行 review-verify。',
                )
              : context.localizeText(
                  'No follow-up verify action is required unless you want an explicit closure record.',
                  '除非你需要显式 closure 记录，否则当前无需额外执行 review-verify。',
                ),
          detail: taskId ? `chain=${correlationId} task_id=${taskId}` : `chain=${correlationId}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW_VERIFY,
            artifactPath: requestPath,
          },
        },
      ],
      interactionPrompts:
        findings.length > 0
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
        ],
        detailed: [
          `request_path=${requestPath}`,
          `review_artifact_path=${reviewArtifactPath}`,
          `scope_mode=${reviewMode}`,
          ...(taskId ? [`task_id=${taskId}`] : []),
        ],
      },
    });
    const message =
      findings.length > 0
        ? context.localizeText(
            `Review completed with ${findings.length} finding(s); artifact=${reviewArtifactPath}.`,
            `review 已完成，共生成 ${findings.length} 条 finding；artifact=${reviewArtifactPath}。`,
          )
        : context.localizeText(
            `Review completed with no actionable findings; artifact=${reviewArtifactPath}.`,
            `review 已完成，当前没有可执行 finding；artifact=${reviewArtifactPath}。`,
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
          request_path: requestPath,
          finding_count: findings.length,
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
        status: findings.length > 0 ? CliGovernanceCheckStatus.WARN : CliGovernanceCheckStatus.PASS,
        detail: `count=${findings.length}`,
      },
    ];
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
  ): string[] {
    return [
      context.localizeText(
        'Queued review request artifacts remain transport-only; the lifecycle markdown artifact is the canonical review truth.',
        'queued review request 产物只保留为 transport-only；canonical review truth 固定落在 lifecycle markdown artifact。',
      ),
      changedPathCount === 0
        ? context.localizeText(
            'No git working-tree paths were detected for the current scope, so this review resolved without actionable findings.',
            '当前 scope 没有检测到 git working-tree 路径，因此这次 review 以“无可执行 finding”收口。',
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

  private renderReviewArtifact(
    context: CliCommandExecutorContext,
    options: {
      requestId: string;
      generatedAt: Date;
      taskId: string | null;
      reviewMode: CliReviewScopeMode;
      reviewStatus: CliReviewLifecycleStatus;
      reviewSlug: string;
      reviewArtifactPath: string;
      changedPaths: string[];
      findings: CliReviewFinding[];
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
    const findingsHeading = context.localizeText('## 2. Findings', '## 2. Findings');
    const notesHeading = context.localizeText('## 3. Notes', '## 3. 说明');
    const noFindingsLine = context.localizeText(
      'No actionable findings were identified for the current scope.',
      '当前 scope 没有识别到可执行的 finding。',
    );
    const findingsSection =
      options.findings.length > 0
        ? options.findings
            .map((finding, index) =>
              [
                `### 2.${index + 1} [${finding.severity}] ${finding.title}`,
                `- ${context.localizeText('Finding ID', 'Finding ID')}: \`${finding.findingId}\``,
                `- ${context.localizeText('File', '文件')}: \`${finding.file}\`${typeof finding.line === 'number' ? `:${finding.line}` : ''}`,
                `- ${context.localizeText('Summary', '摘要')}: ${finding.summary}`,
                `- ${context.localizeText('Impact', '影响')}: ${finding.impact}`,
                `- ${context.localizeText('Suggested Action', '建议动作')}: ${finding.suggestedAction}`,
                ...finding.evidence.map(
                  (evidence, evidenceIndex) =>
                    `- ${context.localizeText('Evidence', '证据')} ${evidenceIndex + 1}: ${evidence}`,
                ),
              ].join('\n'),
            )
            .join('\n\n')
        : noFindingsLine;

    return [
      `# ${title}`,
      '',
      `- Status: ${options.reviewStatus}`,
      `- Date: ${dateOnly}`,
      `- Reviewer: ${context.localizeText('repo-ai-governor CLI', 'repo-ai-governor CLI')}`,
      `- Task: \`${options.taskId ?? 'n/a'}\``,
      `- ${context.localizeText('Review Type', 'Review Type')}: ${
        options.reviewMode === CliReviewScopeMode.TASK_SCOPE
          ? context.localizeText('task-aware review', 'task-aware review')
          : context.localizeText('working tree review', 'working tree review')
      }`,
      `- ${context.localizeText('Scope Mode', 'Scope Mode')}: \`${options.reviewMode}\``,
      `- ${context.localizeText('Request ID', 'Request ID')}: \`${options.requestId}\``,
      `- ${context.localizeText('Review Slug', 'Review Slug')}: \`${options.reviewSlug}\``,
      `- ${context.localizeText('Review Artifact', 'Review Artifact')}: \`${options.reviewArtifactPath}\``,
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
      '',
      findingsHeading,
      '',
      findingsSection,
      '',
      notesHeading,
      '',
      ...options.notes.map((note, index) => `${index + 1}. ${note}`),
      '',
    ].join('\n');
  }

  private formatDateOnly(value: Date): string {
    const year = String(value.getFullYear());
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
