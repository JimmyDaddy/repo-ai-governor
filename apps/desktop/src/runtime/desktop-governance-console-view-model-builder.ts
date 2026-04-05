import {
  type OrchestrationArtifactPaneQueryResponse,
  type OrchestrationExecutionBoardEntry,
  OrchestrationExecutionStatus,
  OrchestrationGovernanceActionDisabledReason,
  OrchestrationGovernanceActionKind,
  OrchestrationGovernanceAttentionLevel,
  OrchestrationGovernanceNotificationStatus,
  type OrchestrationGovernanceParallelLaneEntry,
  type OrchestrationGovernanceQueueEntry,
  type OrchestrationGovernanceWorkspaceSummary,
  OrchestrationHandoffTargetKind,
  type OrchestrationHitlDecisionOption,
  OrchestrationSessionStatus,
} from '@repo-ai-governor/orchestration-service-client';
import {
  AgentProjectionPanelStatusVariant,
  AgentProjectionPanelViewModelBuilder,
} from '@repo-ai-governor/reporting';
import {
  DESKTOP_ARTIFACT_PANE_DEFERRED_REASON,
  DESKTOP_ARTIFACT_PANE_READY_NOTE,
  DesktopArtifactQueryGateState,
} from '../constants/index.js';
import type {
  DesktopArtifactPaneCollectionViewModel,
  DesktopArtifactPaneEntryViewModel,
  DesktopExecutionBoardEntryViewModel,
  DesktopGovernanceActionBuildInput,
  DesktopGovernanceActionViewModel,
  DesktopGovernanceConsoleBuildOptions,
  DesktopGovernanceConsoleSectionViewModel,
  DesktopGovernanceConsoleViewModel,
  DesktopGovernanceParallelLaneViewModel,
  DesktopGovernanceQueueEntryViewModel,
  DesktopGovernanceWorkspaceSummaryViewModel,
  DesktopHandoffTargetBuildInput,
  DesktopHandoffTargetViewModel,
  DesktopHitlInboxEntryViewModel,
} from '../types/interfaces/index.js';

/**
 * Builds one transport-neutral desktop governance-console snapshot from service-owned DTOs.
 *
 * Why this exists:
 * desktop renderer work should stay a pure consumer of service-backed data and shared reporting
 * seams instead of assembling runtime truth or UI-only action contracts inside the renderer.
 */
export class DesktopGovernanceConsoleViewModelBuilder {
  public constructor(
    private readonly agentProjectionPanelBuilder: AgentProjectionPanelViewModelBuilder = new AgentProjectionPanelViewModelBuilder(),
  ) {}

  /**
   * Builds one governance-console snapshot from service-owned DTOs and lifecycle facts.
   * @param options Shared DTO payload plus locale/workspace metadata.
   * @returns Transport-neutral desktop console view-model.
   */
  public build(options: DesktopGovernanceConsoleBuildOptions): DesktopGovernanceConsoleViewModel {
    return {
      workspaceHome: this.buildWorkspaceHome(options),
      sessionLane: this.buildSessionLane(options.locale, options.sessions),
      executionBoard: this.buildExecutionBoard(options),
      hitlInbox: this.buildHitlInbox(options),
      queueOverview: this.buildQueueOverview(options),
      artifactPane: this.buildArtifactPane(
        options.locale,
        options.lifecycle.artifactQueryGateState,
        options.artifactPane,
        options.artifactPaneDeferredReason,
      ),
      ...(options.agentView
        ? {
            agentProjectionPanel: this.agentProjectionPanelBuilder.build({
              agentView: options.agentView,
              locale: options.locale,
              title: this.localizeText(options.locale, 'Agent projection', 'Agent 投影'),
              maxRows: 5,
            }),
          }
        : {}),
    };
  }

  private buildExecutionBoard(
    options: DesktopGovernanceConsoleBuildOptions,
  ): DesktopGovernanceConsoleViewModel['executionBoard'] {
    const entries = options.executionBoard.executions.map((entry) =>
      this.buildExecutionBoardEntry(options.locale, entry),
    );
    return {
      title: this.localizeText(options.locale, 'Execution board', '执行看板'),
      statusVariant: entries.some(
        (entry) => entry.statusVariant === AgentProjectionPanelStatusVariant.ERROR,
      )
        ? AgentProjectionPanelStatusVariant.ERROR
        : entries.some((entry) => entry.statusVariant === AgentProjectionPanelStatusVariant.WARNING)
          ? AgentProjectionPanelStatusVariant.WARNING
          : entries.length > 0
            ? AgentProjectionPanelStatusVariant.SUCCESS
            : AgentProjectionPanelStatusVariant.INFO,
      emptyState: this.localizeText(
        options.locale,
        'No desktop executions have been recorded yet.',
        '当前还没有记录到 desktop 执行。',
      ),
      entries,
    };
  }

  private buildHitlInbox(
    options: DesktopGovernanceConsoleBuildOptions,
  ): DesktopGovernanceConsoleViewModel['hitlInbox'] {
    const entries = options.hitlInbox.pendingDecisions.map((entry) =>
      this.buildHitlInboxEntry(options.locale, entry),
    );
    return {
      title: this.localizeText(options.locale, 'HITL inbox', 'HITL 收件箱'),
      statusVariant:
        entries.length > 0
          ? AgentProjectionPanelStatusVariant.WARNING
          : options.lifecycle.restartCount > 0
            ? AgentProjectionPanelStatusVariant.WARNING
            : AgentProjectionPanelStatusVariant.SUCCESS,
      emptyState: this.localizeText(
        options.locale,
        'No pending human decision is waiting in the desktop console.',
        '当前没有待处理的人类决策。',
      ),
      entries,
    };
  }

  private buildQueueOverview(
    options: DesktopGovernanceConsoleBuildOptions,
  ): DesktopGovernanceConsoleViewModel['queueOverview'] {
    const queueOverview = options.queueOverview ?? {
      generatedAt: '',
      automationInbox: [],
      reviewQueue: [],
      parallelLanes: [],
      workspaceSummary: [],
      notificationOwnership: {
        ownerSurface: 'desktop',
        pendingItemCount: 0,
        dueSoonItemCount: 0,
        overdueItemCount: 0,
        activeWorkspaceCount: 0,
        defaultFollowUpSlaMinutes: 0,
        notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
      },
    };
    const automationInboxEntries = queueOverview.automationInbox.map((entry) =>
      this.buildQueueEntry(options.locale, entry),
    );
    const reviewQueueEntries = queueOverview.reviewQueue.map((entry) =>
      this.buildQueueEntry(options.locale, entry),
    );
    const parallelLaneEntries = queueOverview.parallelLanes.map((entry) =>
      this.buildParallelLaneEntry(options.locale, entry),
    );
    const workspaceSummaryEntries = queueOverview.workspaceSummary.map((entry) =>
      this.buildWorkspaceSummaryEntry(options.locale, entry),
    );

    return {
      title: this.localizeText(options.locale, 'Queue & workspace overview', '队列与工作区总览'),
      statusVariant: this.resolveNotificationStatusVariant(
        queueOverview.notificationOwnership.notificationStatus,
      ),
      detailLines: [
        `generated_at=${queueOverview.generatedAt || 'none'}`,
        this.localizeText(
          options.locale,
          `pending=${queueOverview.notificationOwnership.pendingItemCount} due_soon=${queueOverview.notificationOwnership.dueSoonItemCount} overdue=${queueOverview.notificationOwnership.overdueItemCount}`,
          `待处理=${queueOverview.notificationOwnership.pendingItemCount} 即将到期=${queueOverview.notificationOwnership.dueSoonItemCount} 已逾期=${queueOverview.notificationOwnership.overdueItemCount}`,
        ),
        this.localizeText(
          options.locale,
          `owner_surface=${queueOverview.notificationOwnership.ownerSurface} active_workspaces=${queueOverview.notificationOwnership.activeWorkspaceCount}`,
          `通知归属=${queueOverview.notificationOwnership.ownerSurface} 活跃工作区=${queueOverview.notificationOwnership.activeWorkspaceCount}`,
        ),
      ],
      notificationOwnership: {
        title: this.localizeText(options.locale, 'Notification ownership', '通知归属'),
        statusVariant: this.resolveNotificationStatusVariant(
          queueOverview.notificationOwnership.notificationStatus,
        ),
        detailLines: [
          `owner_surface=${queueOverview.notificationOwnership.ownerSurface}`,
          this.localizeText(
            options.locale,
            `pending=${queueOverview.notificationOwnership.pendingItemCount} due_soon=${queueOverview.notificationOwnership.dueSoonItemCount} overdue=${queueOverview.notificationOwnership.overdueItemCount}`,
            `待处理=${queueOverview.notificationOwnership.pendingItemCount} 即将到期=${queueOverview.notificationOwnership.dueSoonItemCount} 已逾期=${queueOverview.notificationOwnership.overdueItemCount}`,
          ),
          this.localizeText(
            options.locale,
            `default_follow_up_sla_minutes=${queueOverview.notificationOwnership.defaultFollowUpSlaMinutes}`,
            `默认跟进 SLA（分钟）=${queueOverview.notificationOwnership.defaultFollowUpSlaMinutes}`,
          ),
        ],
      },
      automationInbox: {
        title: this.localizeText(options.locale, 'Automation inbox', '自动化收件箱'),
        statusVariant: this.resolveCollectionStatusVariant(automationInboxEntries),
        emptyState: this.localizeText(
          options.locale,
          'No automation follow-up item currently needs the desktop command center.',
          '当前没有需要桌面端处理的自动化跟进项。',
        ),
        entries: automationInboxEntries,
      },
      reviewQueue: {
        title: this.localizeText(options.locale, 'Review queue', '评审队列'),
        statusVariant: this.resolveCollectionStatusVariant(reviewQueueEntries),
        emptyState: this.localizeText(
          options.locale,
          'No open review item is waiting in the review queue.',
          '当前没有待处理的评审队列项。',
        ),
        entries: reviewQueueEntries,
      },
      parallelLanes: {
        title: this.localizeText(options.locale, 'Parallel lanes', '并行泳道'),
        statusVariant: this.resolveCollectionStatusVariant(parallelLaneEntries),
        emptyState: this.localizeText(
          options.locale,
          'No active parallel lane is running right now.',
          '当前没有活跃的并行泳道。',
        ),
        entries: parallelLaneEntries,
      },
      workspaceSummary: {
        title: this.localizeText(options.locale, 'Workspace summary', '工作区摘要'),
        statusVariant: this.resolveCollectionStatusVariant(workspaceSummaryEntries),
        emptyState: this.localizeText(
          options.locale,
          'No governed workspace summary is available yet.',
          '当前还没有可用的治理工作区摘要。',
        ),
        entries: workspaceSummaryEntries,
      },
    };
  }

  private buildExecutionBoardEntry(
    locale: string,
    entry: OrchestrationExecutionBoardEntry,
  ): DesktopExecutionBoardEntryViewModel {
    return {
      id: entry.execution.executionId,
      title: `${entry.execution.executionId} -> ${entry.execution.status}`,
      statusVariant: this.resolveExecutionStatusVariant(
        entry.execution.status,
        entry.execution.pendingHitl,
      ),
      detailLines: [
        `workspace=${entry.execution.workspaceId} stage=${entry.execution.currentStageId ?? 'none'}`,
        `events=${entry.execution.latestEventSequence ?? 0} latest=${entry.execution.latestEventType ?? 'none'}`,
        this.localizeText(
          locale,
          `pending_hitl=${entry.execution.pendingHitl} artifact=${entry.execution.latestArtifactId ?? 'none'}`,
          `待处理 HITL=${entry.execution.pendingHitl} 产物=${entry.execution.latestArtifactId ?? 'none'}`,
        ),
      ],
      actions: entry.actions.map((affordance) =>
        this.buildGovernanceAction({
          locale,
          affordance,
        }),
      ),
      handoffTargets: entry.handoffTargets.map((target) =>
        this.buildHandoffTarget({
          locale,
          target,
        }),
      ),
    };
  }

  private buildHitlInboxEntry(
    locale: string,
    entry: OrchestrationExecutionBoardEntry,
  ): DesktopHitlInboxEntryViewModel {
    return {
      id: entry.execution.executionId,
      title: `${entry.execution.executionId} -> ${entry.execution.status}`,
      statusVariant: AgentProjectionPanelStatusVariant.WARNING,
      detailLines: [
        `execution=${entry.execution.executionId}`,
        `status=${entry.execution.status} latest=${entry.execution.latestEventType ?? 'none'}`,
        this.localizeText(
          locale,
          'Desktop renderer should surface only service-owned HITL options here.',
          '这里的 HITL 选项必须继续只消费 service-owned contract。',
        ),
      ],
      actions: entry.actions.map((affordance) =>
        this.buildGovernanceAction({
          locale,
          affordance,
        }),
      ),
      handoffTargets: entry.handoffTargets.map((target) =>
        this.buildHandoffTarget({
          locale,
          target,
        }),
      ),
    };
  }

  private buildQueueEntry(
    locale: string,
    entry: OrchestrationGovernanceQueueEntry,
  ): DesktopGovernanceQueueEntryViewModel {
    return {
      id: entry.queueEntryId,
      title: entry.reviewId
        ? `${entry.reviewId} -> ${entry.reviewLifecycleStatus ?? 'open'}`
        : `${entry.executionId ?? entry.queueEntryId} -> ${entry.executionStatus ?? 'pending'}`,
      statusVariant: this.resolveAttentionStatusVariant(entry.attentionLevel),
      detailLines: [
        `workspace=${entry.workspaceId}`,
        `queue=${entry.queueKind} attention=${entry.attentionLevel}`,
        `notification=${entry.notificationStatus} sla=${entry.followUpSlaState}`,
        `task=${entry.taskId ?? 'none'} project=${entry.projectId ?? 'none'} sprint=${entry.sprintId ?? 'none'}`,
        ...(entry.reviewFilePath ? [`review_path=${entry.reviewFilePath}`] : []),
        ...(entry.followUpDueAt ? [`follow_up_due_at=${entry.followUpDueAt}`] : []),
        ...(entry.pendingSince ? [`pending_since=${entry.pendingSince}`] : []),
        ...(entry.updatedAt ? [`updated_at=${entry.updatedAt}`] : []),
      ],
      actions: entry.actions.map((affordance) =>
        this.buildGovernanceAction({
          locale,
          affordance,
        }),
      ),
      handoffTargets: entry.handoffTargets.map((target) =>
        this.buildHandoffTarget({
          locale,
          target,
        }),
      ),
    };
  }

  private buildParallelLaneEntry(
    locale: string,
    entry: OrchestrationGovernanceParallelLaneEntry,
  ): DesktopGovernanceParallelLaneViewModel {
    return {
      id: entry.laneId,
      title: this.localizeText(
        locale,
        `${entry.workspaceId} -> ${entry.activeExecutionCount} active`,
        `${entry.workspaceId} -> ${entry.activeExecutionCount} 个活跃执行`,
      ),
      statusVariant: this.resolveAttentionStatusVariant(entry.attentionLevel),
      detailLines: [
        `workspace=${entry.workspaceId}`,
        `running=${entry.runningExecutionCount} pending_hitl=${entry.pendingHitlCount} interrupted=${entry.interruptedCount}`,
        `attention_executions=${entry.attentionExecutionCount}`,
        ...(entry.latestExecutionId ? [`latest_execution=${entry.latestExecutionId}`] : []),
        ...(entry.latestUpdatedAt ? [`latest_updated_at=${entry.latestUpdatedAt}`] : []),
        ...(entry.activeExecutionIds.length > 0
          ? [`execution_ids=${entry.activeExecutionIds.join(', ')}`]
          : []),
      ],
    };
  }

  private buildWorkspaceSummaryEntry(
    _locale: string,
    entry: OrchestrationGovernanceWorkspaceSummary,
  ): DesktopGovernanceWorkspaceSummaryViewModel {
    return {
      id: `${entry.workspaceId}:${entry.workspaceRoot}`,
      title: entry.workspaceId,
      statusVariant: this.resolveAttentionStatusVariant(entry.attentionLevel),
      detailLines: [
        `root=${entry.workspaceRoot}`,
        `total_executions=${entry.totalExecutionCount} active=${entry.activeExecutionCount} pending_hitl=${entry.pendingHitlCount}`,
        `automation_inbox=${entry.automationInboxCount} review_queue=${entry.reviewQueueCount} overdue_follow_up=${entry.overdueFollowUpCount}`,
        ...(entry.latestExecutionId ? [`latest_execution=${entry.latestExecutionId}`] : []),
        ...(entry.latestUpdatedAt ? [`latest_updated_at=${entry.latestUpdatedAt}`] : []),
      ],
    };
  }

  private buildGovernanceAction(
    input: DesktopGovernanceActionBuildInput,
  ): DesktopGovernanceActionViewModel {
    const { affordance, locale } = input;
    return {
      id: affordance.actionId,
      actionKind: affordance.actionKind,
      enabled: affordance.enabled,
      requiresConfirmation: affordance.requiresConfirmation,
      title: this.localizeGovernanceActionTitle(locale, affordance.actionKind),
      ...(affordance.disabledReason
        ? {
            disabledReason: affordance.disabledReason,
          }
        : {}),
      ...(affordance.targetId
        ? {
            targetId: affordance.targetId,
          }
        : {}),
      detailLines: [
        `execution=${affordance.executionId}`,
        `enabled=${affordance.enabled} confirmation=${affordance.requiresConfirmation}`,
        ...(affordance.hitlDecisionOptions && affordance.hitlDecisionOptions.length > 0
          ? [this.localizeHitlDecisionOptions(locale, affordance.hitlDecisionOptions)]
          : []),
        ...(affordance.disabledReason
          ? [this.localizeGovernanceDisabledReason(locale, affordance.disabledReason)]
          : []),
        ...(affordance.targetId ? [`target=${affordance.targetId}`] : []),
      ],
    };
  }

  private buildHandoffTarget(input: DesktopHandoffTargetBuildInput): DesktopHandoffTargetViewModel {
    const { target, locale } = input;
    return {
      id: target.targetId,
      targetKind: target.targetKind,
      title: this.localizeHandoffTargetTitle(locale, target.targetKind),
      exists: target.exists,
      ...(target.targetPath
        ? {
            targetPath: target.targetPath,
          }
        : {}),
      detailLines: [
        `execution=${target.executionId}`,
        `exists=${target.exists}`,
        ...(target.targetPath ? [`path=${target.targetPath}`] : []),
      ],
    };
  }

  private buildArtifactPane(
    locale: string,
    gateState: DesktopArtifactQueryGateState,
    artifactPane: OrchestrationArtifactPaneQueryResponse | undefined,
    deferredReason?: string,
  ): DesktopGovernanceConsoleViewModel['artifactPane'] {
    if (gateState === DesktopArtifactQueryGateState.BLOCKED) {
      return {
        title: this.localizeText(locale, 'Artifact pane', '产物面板'),
        statusVariant: AgentProjectionPanelStatusVariant.INFO,
        gateState,
        detailLines: [
          this.localizeText(
            locale,
            deferredReason ?? DESKTOP_ARTIFACT_PANE_DEFERRED_REASON,
            'service-owned artifact query contract 尚未就绪；当前仍阻止 filesystem bypass。',
          ),
        ],
        policyTrace: this.buildArtifactPaneDetailSection(
          locale,
          'Policy & standards lens',
          '策略与标准透镜',
          AgentProjectionPanelStatusVariant.INFO,
          [
            this.localizeText(
              locale,
              'Policy trace detail stays deferred until the service-owned evidence contract is ready.',
              'policy trace detail 会在 service-owned evidence contract 就绪前继续延后。',
            ),
          ],
        ),
        reviewLifecycle: this.buildArtifactPaneDetailSection(
          locale,
          'Review lifecycle navigation',
          '评审生命周期导航',
          AgentProjectionPanelStatusVariant.INFO,
          [
            this.localizeText(
              locale,
              'Review lifecycle navigation remains blocked with the artifact query gate.',
              'review lifecycle navigation 会随 artifact query gate 一起保持阻止。',
            ),
          ],
        ),
        workbench: this.buildArtifactPaneDetailSection(
          locale,
          'Artifact & review workbench',
          '产物与评审工作台',
          AgentProjectionPanelStatusVariant.INFO,
          [
            this.localizeText(
              locale,
              'Workbench detail will appear once the service-owned evidence read model is available.',
              'service-owned evidence read model 就绪后，这里会显示 workbench detail。',
            ),
          ],
        ),
        evidenceBacklinks: this.buildArtifactPaneCollection(
          locale,
          'Governance evidence backlinks',
          '治理证据回链',
          [],
          {
            english: 'Evidence backlinks stay deferred until the service contract is ready.',
            chinese: 'evidence backlinks 会在 service contract 就绪前继续延后。',
          },
        ),
        artifacts: this.buildArtifactPaneCollection(locale, 'Artifacts', '产物', [], {
          english: 'Artifact query gate is still blocked.',
          chinese: '当前 artifact query gate 仍然阻止中。',
        }),
        reviews: this.buildArtifactPaneCollection(locale, 'Reviews', '评审', [], {
          english: 'Review query stays deferred until the service contract is ready.',
          chinese: 'review query 会在 service contract 就绪前继续延后。',
        }),
        transcript: this.buildArtifactPaneCollection(locale, 'Transcript', '转录', [], {
          english: 'Transcript query stays service-owned and currently deferred.',
          chinese: 'transcript query 继续保持 service-owned，当前仍延后。',
        }),
      };
    }

    const resolvedArtifactPane = artifactPane ?? {
      artifacts: [],
      reviews: [],
      transcript: [],
      reviewLifecycle: {
        totalReviewCount: 0,
        pendingReviewCount: 0,
        verifiedReviewCount: 0,
        resolvedReviewCount: 0,
        navigationReviewIds: [],
      },
      workbench: {
        artifactCount: 0,
        reviewCount: 0,
        transcriptCount: 0,
      },
      evidenceBacklinks: {
        artifactPaths: [],
        reviewPaths: [],
        transcriptEntryIds: [],
      },
    };
    const detailLines = [
      this.localizeText(
        locale,
        deferredReason ?? DESKTOP_ARTIFACT_PANE_READY_NOTE,
        'service-owned artifact pane contract 已就绪，可直接供 desktop renderer 消费。',
      ),
      ...(resolvedArtifactPane.resolvedExecutionId
        ? [
            this.localizeText(
              locale,
              `execution=${resolvedArtifactPane.resolvedExecutionId}`,
              `执行=${resolvedArtifactPane.resolvedExecutionId}`,
            ),
          ]
        : []),
      ...(resolvedArtifactPane.resolvedSessionId
        ? [
            this.localizeText(
              locale,
              `session=${resolvedArtifactPane.resolvedSessionId}`,
              `会话=${resolvedArtifactPane.resolvedSessionId}`,
            ),
          ]
        : []),
      ...(resolvedArtifactPane.reviewSourcePath
        ? [
            this.localizeText(
              locale,
              `review_source=${resolvedArtifactPane.reviewSourcePath}`,
              `评审源=${resolvedArtifactPane.reviewSourcePath}`,
            ),
          ]
        : []),
    ];

    return {
      title: this.localizeText(locale, 'Artifact pane', '产物面板'),
      statusVariant: this.resolveArtifactPaneStatusVariant(resolvedArtifactPane),
      gateState,
      detailLines,
      policyTrace: this.buildPolicyTraceSection(locale, resolvedArtifactPane),
      reviewLifecycle: this.buildReviewLifecycleSection(locale, resolvedArtifactPane),
      workbench: this.buildWorkbenchSection(locale, resolvedArtifactPane),
      evidenceBacklinks: this.buildEvidenceBacklinksCollection(locale, resolvedArtifactPane),
      artifacts: this.buildArtifactPaneCollection(
        locale,
        'Artifacts',
        '产物',
        resolvedArtifactPane.artifacts.map(
          (artifact: OrchestrationArtifactPaneQueryResponse['artifacts'][number]) => ({
            id: artifact.artifactId,
            title: `${artifact.artifactType} -> ${artifact.artifactStatus}`,
            detailLines: [
              `artifact=${artifact.artifactId} version=${artifact.artifactVersion}`,
              `task=${artifact.producerTaskId} execution=${artifact.producerExecutionId}`,
              `path=${artifact.artifactPath}`,
            ],
          }),
        ),
        {
          english: 'No service-owned artifacts are available yet.',
          chinese: '当前还没有可用的 service-owned 产物。',
        },
      ),
      reviews: this.buildArtifactPaneCollection(
        locale,
        'Reviews',
        '评审',
        resolvedArtifactPane.reviews.map(
          (review: OrchestrationArtifactPaneQueryResponse['reviews'][number]) => ({
            id: review.reviewId,
            title: `${review.lifecycleStatus} -> ${review.title}`,
            detailLines: [
              `file=${review.filePath}`,
              ...(review.scope ? [`scope=${review.scope}`] : []),
              `updated=${review.updatedAt}`,
            ],
          }),
        ),
        {
          english: 'No review lifecycle records were found.',
          chinese: '当前没有发现评审生命周期记录。',
        },
      ),
      transcript: this.buildArtifactPaneCollection(
        locale,
        'Transcript',
        '转录',
        resolvedArtifactPane.transcript.map(
          (entry: OrchestrationArtifactPaneQueryResponse['transcript'][number]) => ({
            id: entry.entryId,
            title: `${entry.role} -> ${entry.eventType}`,
            detailLines: [
              `session=${entry.sessionId} route=${entry.routeId ?? 'main'}`,
              `at=${entry.createdAt}`,
              ...entry.lines,
            ],
          }),
        ),
        {
          english: 'No service-owned transcript events are available yet.',
          chinese: '当前还没有可用的 service-owned transcript 事件。',
        },
      ),
    };
  }

  private buildWorkspaceHome(
    options: DesktopGovernanceConsoleBuildOptions,
  ): DesktopGovernanceConsoleSectionViewModel {
    const memoryProviderLabel = options.health.memoryProvider?.memoryStoreProviderId ?? 'none';
    return {
      title: this.localizeText(options.locale, 'Workspace home', '工作区主页'),
      statusVariant:
        options.lifecycle.restartCount > 0
          ? AgentProjectionPanelStatusVariant.WARNING
          : AgentProjectionPanelStatusVariant.SUCCESS,
      detailLines: [
        this.localizeText(
          options.locale,
          `workspace=${options.workspaceLabel}`,
          `工作区=${options.workspaceLabel}`,
        ),
        `root=${options.health.workspaceRoot}`,
        `host=${options.health.serviceHostKind} transport=${options.health.serviceTransportKind}`,
        this.localizeText(
          options.locale,
          `memory_provider=${memoryProviderLabel}`,
          `内存提供方=${memoryProviderLabel}`,
        ),
        this.localizeText(
          options.locale,
          `lifecycle=${options.lifecycle.serviceLifecycleStatus} restarts=${options.lifecycle.restartCount}`,
          `生命周期=${options.lifecycle.serviceLifecycleStatus} 重启=${options.lifecycle.restartCount}`,
        ),
      ],
    };
  }

  private buildSessionLane(
    locale: string,
    sessions: DesktopGovernanceConsoleBuildOptions['sessions'],
  ): DesktopGovernanceConsoleSectionViewModel {
    const latestSession = sessions[0];
    if (!latestSession) {
      return {
        title: this.localizeText(locale, 'Session lane', '会话通道'),
        statusVariant: AgentProjectionPanelStatusVariant.INFO,
        detailLines: [
          this.localizeText(
            locale,
            'No persisted desktop session is available yet.',
            '当前还没有可恢复的 desktop 会话。',
          ),
        ],
      };
    }

    return {
      title: this.localizeText(locale, 'Session lane', '会话通道'),
      statusVariant:
        latestSession.status === OrchestrationSessionStatus.ACTIVE
          ? AgentProjectionPanelStatusVariant.SUCCESS
          : AgentProjectionPanelStatusVariant.INFO,
      detailLines: [
        `session=${latestSession.sessionId}`,
        `status=${latestSession.status} route=${latestSession.currentRouteId ?? 'none'}`,
        this.localizeText(
          locale,
          `events=${latestSession.eventCount} next_cursor=${latestSession.nextCursor}`,
          `事件=${latestSession.eventCount} next_cursor=${latestSession.nextCursor}`,
        ),
      ],
    };
  }

  private resolveExecutionStatusVariant(
    status: string,
    pendingHitl: boolean,
  ): AgentProjectionPanelStatusVariant {
    if (status === OrchestrationExecutionStatus.FAILED) {
      return AgentProjectionPanelStatusVariant.ERROR;
    }

    if (pendingHitl || status === OrchestrationExecutionStatus.RUNNING) {
      return AgentProjectionPanelStatusVariant.WARNING;
    }

    if (status === OrchestrationExecutionStatus.COMPLETED) {
      return AgentProjectionPanelStatusVariant.SUCCESS;
    }

    return AgentProjectionPanelStatusVariant.INFO;
  }

  private resolveAttentionStatusVariant(
    attentionLevel: OrchestrationGovernanceAttentionLevel,
  ): AgentProjectionPanelStatusVariant {
    switch (attentionLevel) {
      case OrchestrationGovernanceAttentionLevel.CRITICAL:
        return AgentProjectionPanelStatusVariant.ERROR;
      case OrchestrationGovernanceAttentionLevel.WARNING:
        return AgentProjectionPanelStatusVariant.WARNING;
      case OrchestrationGovernanceAttentionLevel.INFO:
        return AgentProjectionPanelStatusVariant.INFO;
    }
  }

  private resolveNotificationStatusVariant(
    notificationStatus: OrchestrationGovernanceNotificationStatus,
  ): AgentProjectionPanelStatusVariant {
    switch (notificationStatus) {
      case OrchestrationGovernanceNotificationStatus.ESCALATION_RECOMMENDED:
        return AgentProjectionPanelStatusVariant.ERROR;
      case OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED:
        return AgentProjectionPanelStatusVariant.WARNING;
      case OrchestrationGovernanceNotificationStatus.IDLE:
        return AgentProjectionPanelStatusVariant.SUCCESS;
    }
  }

  private resolveCollectionStatusVariant(
    entries: Array<{
      statusVariant: AgentProjectionPanelStatusVariant;
    }>,
  ): AgentProjectionPanelStatusVariant {
    if (entries.some((entry) => entry.statusVariant === AgentProjectionPanelStatusVariant.ERROR)) {
      return AgentProjectionPanelStatusVariant.ERROR;
    }

    if (
      entries.some((entry) => entry.statusVariant === AgentProjectionPanelStatusVariant.WARNING)
    ) {
      return AgentProjectionPanelStatusVariant.WARNING;
    }

    if (entries.length > 0) {
      return AgentProjectionPanelStatusVariant.SUCCESS;
    }

    return AgentProjectionPanelStatusVariant.INFO;
  }

  private resolveArtifactPaneStatusVariant(
    artifactPane: OrchestrationArtifactPaneQueryResponse,
  ): AgentProjectionPanelStatusVariant {
    if (artifactPane.reviewLifecycle.pendingReviewCount > 0) {
      return AgentProjectionPanelStatusVariant.WARNING;
    }

    if (
      artifactPane.artifacts.length > 0 ||
      artifactPane.reviews.length > 0 ||
      artifactPane.transcript.length > 0 ||
      artifactPane.reviewLifecycle.totalReviewCount > 0
    ) {
      return AgentProjectionPanelStatusVariant.SUCCESS;
    }

    return AgentProjectionPanelStatusVariant.INFO;
  }

  private buildPolicyTraceSection(
    locale: string,
    artifactPane: OrchestrationArtifactPaneQueryResponse,
  ): DesktopGovernanceConsoleSectionViewModel {
    const policyTrace = artifactPane.policyTrace;
    if (!policyTrace) {
      return this.buildArtifactPaneDetailSection(
        locale,
        'Policy & standards lens',
        '策略与标准透镜',
        AgentProjectionPanelStatusVariant.INFO,
        [
          this.localizeText(
            locale,
            'No execution-scoped policy trace detail is available yet.',
            '当前还没有可用的 execution-scoped policy trace detail。',
          ),
        ],
      );
    }

    return this.buildArtifactPaneDetailSection(
      locale,
      'Policy & standards lens',
      '策略与标准透镜',
      this.resolveExecutionStatusVariant(policyTrace.executionStatus, policyTrace.pendingHitl),
      [
        `execution=${policyTrace.executionId} status=${policyTrace.executionStatus}`,
        `pending_hitl=${policyTrace.pendingHitl} recovery_capable=${policyTrace.recoveryCapable}`,
        `stage=${policyTrace.currentStageId ?? 'none'} latest=${policyTrace.latestEventType ?? 'none'}`,
        `task=${policyTrace.taskId ?? 'none'} project=${policyTrace.projectId ?? 'none'} sprint=${policyTrace.sprintId ?? 'none'}`,
        ...(policyTrace.latestArtifactId || policyTrace.latestArtifactPath
          ? [
              `artifact=${policyTrace.latestArtifactId ?? 'none'} path=${policyTrace.latestArtifactPath ?? 'none'}`,
            ]
          : []),
        ...(policyTrace.reviewDocumentPath
          ? [`review_document=${policyTrace.reviewDocumentPath}`]
          : []),
      ],
    );
  }

  private buildReviewLifecycleSection(
    locale: string,
    artifactPane: OrchestrationArtifactPaneQueryResponse,
  ): DesktopGovernanceConsoleSectionViewModel {
    const reviewLifecycle = artifactPane.reviewLifecycle;
    const statusVariant =
      reviewLifecycle.pendingReviewCount > 0
        ? AgentProjectionPanelStatusVariant.WARNING
        : reviewLifecycle.totalReviewCount > 0
          ? AgentProjectionPanelStatusVariant.SUCCESS
          : AgentProjectionPanelStatusVariant.INFO;

    return this.buildArtifactPaneDetailSection(
      locale,
      'Review lifecycle navigation',
      '评审生命周期导航',
      statusVariant,
      [
        `review_source=${reviewLifecycle.reviewSourcePath ?? artifactPane.reviewSourcePath ?? 'none'}`,
        `latest_review=${reviewLifecycle.latestReviewId ?? 'none'} status=${reviewLifecycle.latestLifecycleStatus ?? 'none'}`,
        `pending=${reviewLifecycle.pendingReviewCount} verified=${reviewLifecycle.verifiedReviewCount} resolved=${reviewLifecycle.resolvedReviewCount}`,
        `review_count=${reviewLifecycle.totalReviewCount}`,
        ...(reviewLifecycle.latestReviewFilePath
          ? [`latest_review_path=${reviewLifecycle.latestReviewFilePath}`]
          : []),
        ...(reviewLifecycle.navigationReviewIds.length > 0
          ? [`navigation=${reviewLifecycle.navigationReviewIds.join(' -> ')}`]
          : []),
      ],
    );
  }

  private buildWorkbenchSection(
    locale: string,
    artifactPane: OrchestrationArtifactPaneQueryResponse,
  ): DesktopGovernanceConsoleSectionViewModel {
    const workbench = artifactPane.workbench;
    const hasEntries =
      workbench.artifactCount > 0 || workbench.reviewCount > 0 || workbench.transcriptCount > 0;

    return this.buildArtifactPaneDetailSection(
      locale,
      'Artifact & review workbench',
      '产物与评审工作台',
      hasEntries
        ? AgentProjectionPanelStatusVariant.SUCCESS
        : AgentProjectionPanelStatusVariant.INFO,
      [
        `artifacts=${workbench.artifactCount} reviews=${workbench.reviewCount} transcript_entries=${workbench.transcriptCount}`,
        `latest_artifact=${workbench.latestArtifactId ?? 'none'}`,
        `latest_review=${workbench.latestReviewId ?? 'none'}`,
        `latest_transcript=${workbench.latestTranscriptEntryId ?? 'none'}`,
        ...(workbench.latestArtifactPath
          ? [`latest_artifact_path=${workbench.latestArtifactPath}`]
          : []),
        ...(workbench.latestReviewFilePath
          ? [`latest_review_path=${workbench.latestReviewFilePath}`]
          : []),
        ...(workbench.latestTranscriptCreatedAt
          ? [`latest_transcript_at=${workbench.latestTranscriptCreatedAt}`]
          : []),
      ],
    );
  }

  private buildEvidenceBacklinksCollection(
    locale: string,
    artifactPane: OrchestrationArtifactPaneQueryResponse,
  ): DesktopArtifactPaneCollectionViewModel {
    const entries: DesktopArtifactPaneEntryViewModel[] = [
      ...(artifactPane.evidenceBacklinks.governanceWorkspacePath
        ? [
            {
              id: 'governance-workspace-backlink',
              title: this.localizeText(locale, 'governance workspace', '治理工作区'),
              detailLines: [`path=${artifactPane.evidenceBacklinks.governanceWorkspacePath}`],
            } satisfies DesktopArtifactPaneEntryViewModel,
          ]
        : []),
      ...artifactPane.evidenceBacklinks.artifactPaths.map((artifactPath, index) => ({
        id: `artifact-backlink-${index + 1}`,
        title: this.localizeText(locale, 'artifact backlink', '产物回链'),
        detailLines: [`path=${artifactPath}`],
      })),
      ...artifactPane.evidenceBacklinks.reviewPaths.map((reviewPath, index) => ({
        id: `review-backlink-${index + 1}`,
        title: this.localizeText(locale, 'review backlink', '评审回链'),
        detailLines: [`path=${reviewPath}`],
      })),
      ...artifactPane.evidenceBacklinks.transcriptEntryIds.map((transcriptEntryId, index) => ({
        id: `transcript-backlink-${index + 1}`,
        title: this.localizeText(locale, 'transcript backlink', '转录回链'),
        detailLines: [`entry=${transcriptEntryId}`],
      })),
    ];

    return this.buildArtifactPaneCollection(
      locale,
      'Governance evidence backlinks',
      '治理证据回链',
      entries,
      {
        english: 'No governance evidence backlink is available yet.',
        chinese: '当前还没有可用的治理证据回链。',
      },
    );
  }

  private buildArtifactPaneCollection(
    locale: string,
    englishTitle: string,
    chineseTitle: string,
    entries: DesktopArtifactPaneEntryViewModel[],
    emptyState: {
      english: string;
      chinese: string;
    },
  ): DesktopArtifactPaneCollectionViewModel {
    return {
      title: this.localizeText(locale, englishTitle, chineseTitle),
      emptyState: this.localizeText(locale, emptyState.english, emptyState.chinese),
      entries,
    };
  }

  private buildArtifactPaneDetailSection(
    locale: string,
    englishTitle: string,
    chineseTitle: string,
    statusVariant: AgentProjectionPanelStatusVariant,
    detailLines: string[],
  ): DesktopGovernanceConsoleSectionViewModel {
    return {
      title: this.localizeText(locale, englishTitle, chineseTitle),
      statusVariant,
      detailLines,
    };
  }

  private localizeGovernanceActionTitle(
    locale: string,
    actionKind: OrchestrationGovernanceActionKind,
  ): string {
    switch (actionKind) {
      case OrchestrationGovernanceActionKind.VIEW_EXECUTION:
        return this.localizeText(locale, 'View execution', '查看执行');
      case OrchestrationGovernanceActionKind.SUBMIT_HITL_DECISION:
        return this.localizeText(locale, 'Submit HITL decision', '提交 HITL 决策');
      case OrchestrationGovernanceActionKind.RECOVER_EXECUTION:
        return this.localizeText(locale, 'Recover execution', '恢复执行');
      case OrchestrationGovernanceActionKind.TERMINATE_EXECUTION:
        return this.localizeText(locale, 'Terminate execution', '终止执行');
      case OrchestrationGovernanceActionKind.OPEN_HANDOFF_TARGET:
        return this.localizeText(locale, 'Open handoff target', '打开交接目标');
    }
  }

  private localizeHandoffTargetTitle(
    locale: string,
    targetKind: OrchestrationHandoffTargetKind,
  ): string {
    switch (targetKind) {
      case OrchestrationHandoffTargetKind.WORKTREE:
        return this.localizeText(locale, 'Worktree', '工作树');
      case OrchestrationHandoffTargetKind.EDITOR:
        return this.localizeText(locale, 'Editor', '编辑器');
      case OrchestrationHandoffTargetKind.TERMINAL:
        return this.localizeText(locale, 'Terminal', '终端');
      case OrchestrationHandoffTargetKind.REVIEW_DOCUMENT:
        return this.localizeText(locale, 'Review document', '评审文档');
    }
  }

  private localizeGovernanceDisabledReason(
    locale: string,
    reason: OrchestrationGovernanceActionDisabledReason,
  ): string {
    switch (reason) {
      case OrchestrationGovernanceActionDisabledReason.EXECUTION_TERMINAL:
        return this.localizeText(
          locale,
          'Action disabled because the execution is already terminal.',
          '该动作已禁用，因为执行已经处于终态。',
        );
      case OrchestrationGovernanceActionDisabledReason.HITL_NOT_PENDING:
        return this.localizeText(
          locale,
          'Action disabled because no HITL decision is currently pending.',
          '该动作已禁用，因为当前没有待处理的 HITL 决策。',
        );
      case OrchestrationGovernanceActionDisabledReason.RECOVERY_NOT_AVAILABLE:
        return this.localizeText(
          locale,
          'Action disabled because recovery is not available for this execution.',
          '该动作已禁用，因为当前执行不具备恢复能力。',
        );
      case OrchestrationGovernanceActionDisabledReason.TARGET_UNAVAILABLE:
        return this.localizeText(
          locale,
          'Action disabled because the handoff target is unavailable.',
          '该动作已禁用，因为交接目标当前不可用。',
        );
    }
  }

  private localizeHitlDecisionOptions(
    locale: string,
    options: OrchestrationHitlDecisionOption[],
  ): string {
    const renderedOptions = options.map((option) => `${option.decision}/${option.resumeAction}`);
    return this.localizeText(
      locale,
      `decision_options=${renderedOptions.join(', ')}`,
      `决策选项=${renderedOptions.join('，')}`,
    );
  }

  private localizeText(locale: string, english: string, chinese: string): string {
    return locale.toLowerCase() === 'zh-cn' ? chinese : english;
  }
}
