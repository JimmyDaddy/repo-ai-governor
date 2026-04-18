import {
  OrchestrationBootstrapReadinessActionId,
  OrchestrationClientSurface,
  OrchestrationExecutionStatus,
  OrchestrationGovernanceActionDisabledReason,
  OrchestrationGovernanceActionKind,
  OrchestrationGovernanceAttentionLevel,
  OrchestrationGovernanceFollowUpSlaState,
  OrchestrationGovernanceNotificationStatus,
  OrchestrationGovernanceQueueKind,
  OrchestrationGovernanceTemporaryBridgeBacklinkSurface,
  OrchestrationGovernanceTemporaryBridgeCapabilityClass,
  OrchestrationGovernanceTemporaryBridgeExitCriterion,
  OrchestrationGovernanceTemporaryBridgeReceiptKind,
  OrchestrationHandoffTargetKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationWorkspaceOperationKind,
} from '@repo-ai-governor/orchestration-service-client';
import type {
  OrchestrationExecutionBoardEntry,
  OrchestrationExecutionSummary,
  OrchestrationGovernanceActionAffordance,
  OrchestrationGovernanceParallelLaneEntry,
  OrchestrationGovernanceQueueEntry,
  OrchestrationGovernanceTemporaryBridgeEntry,
  OrchestrationGovernanceWorkspaceSummary,
  OrchestrationHandoffTarget,
  OrchestrationHitlInboxEntry,
  OrchestrationQueueOverviewQueryResponse,
  OrchestrationWorkspaceOperationSnapshot,
} from '@repo-ai-governor/orchestration-service-client';
import {
  VSCODE_EXTENSION_DESKTOP_RELATIONSHIP,
  VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL,
  VSCODE_EXTENSION_SECRET_SELECTOR_PREFIX,
} from '../constants/index.js';
import {
  VSCODE_EXTENSION_CHAT_COMMAND_REVIEW,
  VSCODE_EXTENSION_COMMAND_IDS,
  VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES,
} from '../constants/index.js';
import type {
  VsCodeExtensionCommandRequest,
  VsCodeExtensionReviewDetailSnapshot,
  VsCodeExtensionSecureAuthoringSnapshot,
  VsCodeExtensionTreeNodeDescriptor,
  VsCodeExtensionWorkbenchOverviewSnapshot,
  VsCodeExtensionWorkflowStudioSnapshot,
  VsCodeExtensionWorkspaceContextSnapshot,
} from '../types/index.js';
import type { VsCodeExtensionLocalizer } from './vscode-extension-localizer.js';

/**
 * Builds tree/webview/chat presentation models from service-owned governance DTOs.
 *
 * Why this exists:
 * VS Code views should stay thin presenters over the orchestration seam instead of handcrafting
 * UI-specific truth in every provider and command handler.
 */
export class VsCodeExtensionPresentationBuilder {
  public constructor(private readonly localizer: VsCodeExtensionLocalizer) {}

  /**
   * Builds task-board tree nodes from service-owned execution-board DTOs.
   * @param entries Service-owned execution-board entries.
   * @returns Tree-node descriptors for the task board view.
   */
  public buildTaskBoardNodes(
    entries: readonly OrchestrationExecutionBoardEntry[],
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    if (entries.length === 0) {
      return [
        this.createInfoNode(
          'task-board-empty',
          'Open a governed workspace and run one task-backed execution to populate the task board.',
          '打开受治理工作区并运行一次任务相关执行后，这里会出现任务看板。',
        ),
      ];
    }

    return entries.map((entry) => ({
      nodeId: `execution:${entry.execution.executionId}`,
      label: this.getExecutionPrimaryLabel(entry.execution),
      description: this.getExecutionDescription(entry.execution),
      tooltip: this.getExecutionTooltip(entry.execution),
      themeIconId: this.getExecutionIconId(entry.execution),
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.EXECUTION,
      selectionRequest: this.createExecutionRequest(entry),
      command: this.createCommandDescriptor(
        VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
        'Open review detail',
        '打开评审详情',
        this.createExecutionRequest(entry),
      ),
      children: [
        ...this.buildTaskBoardSummaryNodes(entry.execution),
        ...this.buildActionNodes(entry),
        ...this.buildHandoffNodes(entry),
      ],
    }));
  }

  /**
   * Backward-compatible alias for the pre-Phase-A execution-board presenter name.
   * @param entries Service-owned execution-board entries.
   * @returns Tree-node descriptors for the task board view.
   */
  public buildExecutionBoardNodes(
    entries: readonly OrchestrationExecutionBoardEntry[],
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    return this.buildTaskBoardNodes(entries);
  }

  /**
   * Builds HITL inbox tree nodes.
   * @param entries Service-owned HITL inbox entries.
   * @returns Tree-node descriptors for the HITL inbox view.
   */
  public buildHitlInboxNodes(
    entries: readonly OrchestrationHitlInboxEntry[],
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    if (entries.length === 0) {
      return [
        this.createInfoNode(
          'hitl-inbox-empty',
          'No pending HITL decisions are waiting for this workspace.',
          '当前工作区没有待处理的 HITL 决策。',
        ),
      ];
    }

    return entries.map((entry) => ({
      nodeId: `hitl:${entry.execution.executionId}`,
      label: this.getExecutionPrimaryLabel(entry.execution),
      description: this.localizer.localizeText('Pending HITL decision', '待处理 HITL 决策'),
      tooltip: this.getExecutionTooltip(entry.execution),
      themeIconId: 'warning',
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.HITL_EXECUTION,
      selectionRequest: this.createExecutionRequest(entry),
      command: this.createCommandDescriptor(
        VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
        'Open review detail',
        '打开评审详情',
        this.createExecutionRequest(entry),
      ),
      children: [...this.buildActionNodes(entry), ...this.buildHandoffNodes(entry)],
    }));
  }

  /**
   * Builds review-queue tree nodes from service-owned queue-overview DTOs.
   * @param entries Service-owned review queue entries.
   * @returns Tree-node descriptors for the review queue view.
   */
  // god-object-exception: TK-938 Phase B temporarily keeps queue/workbench/bridge presentation
  // shaping in one builder; sprint-003 / TK-940 will extract focused builders after clean rollout.
  public buildReviewQueueNodes(
    entries: readonly OrchestrationGovernanceQueueEntry[],
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    if (entries.length === 0) {
      return [
        this.createInfoNode(
          'review-queue-empty',
          'No open review item currently needs workbench attention.',
          '当前没有需要 workbench 处理的评审队列项。',
        ),
      ];
    }

    return entries.map((entry) => {
      const request = this.createReviewQueueRequest(entry);
      const topLevelCommand =
        entry.reviewFilePath || request.executionId
          ? this.createCommandDescriptor(
              VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
              'Open review detail',
              '打开评审详情',
              request,
            )
          : undefined;

      return {
        nodeId: entry.queueEntryId,
        label: entry.taskId ?? entry.reviewId ?? entry.queueEntryId,
        description: this.getReviewQueueDescription(entry),
        tooltip: this.getReviewQueueTooltip(entry),
        themeIconId: this.getReviewQueueIconId(entry),
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.REVIEW_QUEUE_ENTRY,
        selectionRequest: request,
        ...(topLevelCommand
          ? {
              command: topLevelCommand,
            }
          : {}),
        children: [
          ...this.buildReviewQueueSummaryNodes(entry),
          ...this.buildReviewQueueActionNodes(entry, request),
          ...this.buildQueueEntryHandoffNodes(entry, request),
        ],
      };
    });
  }

  /**
   * Builds automation-queue tree nodes from service-owned queue-overview DTOs.
   * @param entries Service-owned automation queue entries.
   * @returns Tree-node descriptors for the automation queue view.
   */
  public buildAutomationQueueNodes(
    entries: readonly OrchestrationGovernanceQueueEntry[],
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    if (entries.length === 0) {
      return [
        this.createInfoNode(
          'automation-queue-empty',
          'No automation follow-up item currently needs workbench attention.',
          '当前没有需要 workbench 处理的自动化跟进项。',
        ),
      ];
    }

    return entries.map((entry) => {
      const request = this.createAutomationQueueRequest(entry);
      const topLevelCommand = request.executionId
        ? this.createCommandDescriptor(
            VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
            'Open review detail',
            '打开评审详情',
            request,
          )
        : undefined;

      return {
        nodeId: entry.queueEntryId,
        label: entry.taskId ?? entry.executionId ?? entry.queueEntryId,
        description: this.getAutomationQueueDescription(entry),
        tooltip: this.getAutomationQueueTooltip(entry),
        themeIconId: this.getAutomationQueueIconId(entry),
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.REVIEW_QUEUE_ENTRY,
        selectionRequest: request,
        ...(topLevelCommand
          ? {
              command: topLevelCommand,
            }
          : {}),
        children: [
          ...this.buildAutomationQueueSummaryNodes(entry, request),
          ...this.buildQueueEntryActionNodes(entry, request),
          ...this.buildQueueEntryHandoffNodes(entry, request),
        ],
      };
    });
  }

  /**
   * Builds workbench-overview tree nodes from workspace facts plus queue overview DTOs.
   * @param snapshot Workbench overview snapshot resolved from service-owned queries.
   * @returns Tree-node descriptors for the workbench overview view.
   */
  public buildWorkbenchOverviewNodes(
    snapshot: VsCodeExtensionWorkbenchOverviewSnapshot,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    const context = snapshot.workspaceContext;
    if (!context.workspaceRoot) {
      return [
        this.createInfoNode(
          'workbench-overview-empty',
          'Open a workspace folder to connect the Governor workbench baseline.',
          '打开一个工作区文件夹后，Governor workbench baseline 才能连接本地治理服务。',
        ),
      ];
    }

    const queueOverview = snapshot.queueOverview;
    const bootstrapReadiness = snapshot.bootstrapReadiness;
    const secureAuthoring = snapshot.secureAuthoring;
    const selectedExecution = snapshot.selectedExecution;
    const reviewSourcePath = snapshot.reviewSourcePath;
    const latestAutomationEntry = queueOverview.automationInbox[0];
    const projectedWorkspaceNodes = this.buildProjectedWorkspaceNodes(
      queueOverview.workspaceSummary,
    );
    const parallelLaneNodes = this.buildParallelLaneNodes(queueOverview.parallelLanes);
    const nativeWorkspaceOperationNodes = this.buildNativeWorkspaceOperationNodes();
    const temporaryBridgeNodes = this.buildTemporaryBridgeNodes(queueOverview.temporaryBridges);

    return [
      {
        nodeId: 'workspace-root',
        label: this.localizer.localizeText('Workspace root', '工作区根目录'),
        description: context.workspaceRoot,
        tooltip: context.workspaceRoot,
        themeIconId: 'folder-library',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'workspace-trust',
        label: this.localizer.localizeText('Workspace trust', '工作区信任'),
        description: context.workspaceTrusted
          ? this.localizer.localizeText('Trusted', '已受信任')
          : this.localizer.localizeText('Limited', '受限'),
        tooltip: context.workspaceTrusted
          ? this.localizer.localizeText(
              'Trust-gated commands are available.',
              '依赖信任的命令已可用。',
            )
          : this.localizer.localizeText(
              'Trust-gated commands stay blocked until the workspace is trusted.',
              '依赖信任的命令会在工作区受信任前保持阻断。',
            ),
        themeIconId: context.workspaceTrusted ? 'shield' : 'shield',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'trust-sensitive-actions',
        label: this.localizer.localizeText('Trust-sensitive actions', '信任敏感动作'),
        description: context.workspaceTrusted
          ? this.localizer.localizeText('Available', '可用')
          : this.localizer.localizeText('Blocked', '已阻断'),
        tooltip: this.getTrustSensitiveActionTooltip(context.workspaceTrusted),
        themeIconId: 'shield',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      this.buildUserConfigAuthoringNode(secureAuthoring),
      this.buildSecretReadinessNode(secureAuthoring),
      this.buildBootstrapReadinessNode(bootstrapReadiness),
      this.buildLatestWorkspaceOperationNode(queueOverview.latestWorkspaceOperation),
      {
        nodeId: 'public-support-level',
        label: this.localizer.localizeText('Public support level', '公开支持级别'),
        description: this.localizePublicSupportLevel(VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL),
        tooltip: this.localizer.localizeText(
          'Phase H keeps the VS Code surface at the public primary-workbench claim for built-source checkout and local VSIX paths.',
          'Phase H 会让 VS Code 在已构建源码仓与本地 VSIX 路径上维持公开主工作台口径。',
        ),
        themeIconId: 'workspace-trusted',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'desktop-relationship',
        label: this.localizer.localizeText('Desktop relationship', 'Desktop 关系'),
        description: this.localizeDesktopRelationship(VSCODE_EXTENSION_DESKTOP_RELATIONSHIP),
        tooltip: this.localizer.localizeText(
          'Desktop remains the governed foundation-only secondary surface after the VS Code primary-workbench claim promotion; it does not become a co-primary workbench.',
          '即使 VS Code 已提升为公开主工作台，Desktop 仍保持 foundation-only 的受治理 secondary surface，不会同步变成并列主工作台。',
        ),
        themeIconId: 'device-desktop',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'workflow-studio-gate',
        label: this.localizer.localizeText('Workflow studio gate', 'Workflow Studio 门槛'),
        description: this.getSupportTruthGateLabel(queueOverview, selectedExecution?.execution),
        tooltip: this.localizer.localizeText(
          'Workflow studio, review detail, and packaged-distribution evidence now keep VS Code on the public primary-workbench claim while desktop remains secondary.',
          'Workflow Studio、Review Detail 与打包分发证据现在会共同维持 VS Code 的公开主工作台口径，而 Desktop 继续保持 secondary surface。',
        ),
        themeIconId: this.isPrimaryWorkbenchClaimActive() ? 'pass-filled' : 'clock',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'queue-overview-status',
        label: this.localizer.localizeText('Queue ownership', '队列归属'),
        description: this.localizeNotificationStatus(
          queueOverview.notificationOwnership.notificationStatus,
        ),
        tooltip: this.localizer.localizeText(
          `owner_surface=${queueOverview.notificationOwnership.ownerSurface} pending=${queueOverview.notificationOwnership.pendingItemCount} due_soon=${queueOverview.notificationOwnership.dueSoonItemCount} overdue=${queueOverview.notificationOwnership.overdueItemCount}`,
          `归属表面=${queueOverview.notificationOwnership.ownerSurface} 待处理=${queueOverview.notificationOwnership.pendingItemCount} 即将到期=${queueOverview.notificationOwnership.dueSoonItemCount} 已逾期=${queueOverview.notificationOwnership.overdueItemCount}`,
        ),
        themeIconId: this.getNotificationIconId(
          queueOverview.notificationOwnership.notificationStatus,
        ),
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'review-queue-count',
        label: this.localizer.localizeText('Review queue', '评审队列'),
        description: this.localizer.localizeText(
          `${queueOverview.reviewQueue.length} open item(s)`,
          `${queueOverview.reviewQueue.length} 个待处理项`,
        ),
        tooltip: this.localizer.localizeText(
          'Stable review queue projection owned by the local orchestration service.',
          '由本地编排服务托管的稳定评审队列投影。',
        ),
        themeIconId: queueOverview.reviewQueue.length > 0 ? 'note' : 'pass-filled',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'automation-queue-count',
        label: this.localizer.localizeText('Automation queue', '自动化队列'),
        description: this.localizer.localizeText(
          `${queueOverview.automationInbox.length} follow-up item(s)`,
          `${queueOverview.automationInbox.length} 个跟进项`,
        ),
        tooltip: latestAutomationEntry
          ? this.localizer.localizeText(
              `Latest automation queue item: ${latestAutomationEntry.executionId ?? latestAutomationEntry.queueEntryId}`,
              `最新自动化队列项：${latestAutomationEntry.executionId ?? latestAutomationEntry.queueEntryId}`,
            )
          : this.localizer.localizeText(
              'No automation follow-up item currently needs workbench attention.',
              '当前没有需要 workbench 处理的自动化跟进项。',
            ),
        themeIconId: queueOverview.automationInbox.length > 0 ? 'clock' : 'pass-filled',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'multi-workspace-overview',
        label: this.localizer.localizeText('Multi-workspace overview', '多工作区总览'),
        description:
          projectedWorkspaceNodes.length > 0
            ? this.localizer.localizeText(
                `${projectedWorkspaceNodes.length} projected workspace(s)`,
                `${projectedWorkspaceNodes.length} 个已投影工作区`,
              )
            : this.localizer.localizeText('No workspace projection yet', '暂时没有工作区投影'),
        tooltip:
          projectedWorkspaceNodes.length > 0
            ? this.localizer.localizeText(
                'Service-owned workspace summaries stay aggregated here so VS Code does not recompute cross-workspace truth.',
                'service-owned 的工作区摘要会聚合显示在这里，避免 VS Code 自己重算跨工作区真值。',
              )
            : this.localizer.localizeText(
                'The service will project governed workspace summary here when executions exist.',
                '当存在执行记录时，服务会在这里投影治理工作区摘要。',
              ),
        themeIconId: projectedWorkspaceNodes.length > 0 ? 'organization' : 'circle-slash',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        children:
          projectedWorkspaceNodes.length > 0
            ? projectedWorkspaceNodes
            : [
                this.createInfoNode(
                  'multi-workspace-overview-empty',
                  'No governed workspace summary is available yet.',
                  '暂时没有可用的治理工作区摘要。',
                ),
              ],
      },
      {
        nodeId: 'parallel-lanes',
        label: this.localizer.localizeText('Parallel execution lanes', '并行执行泳道'),
        description:
          parallelLaneNodes.length > 0
            ? this.localizer.localizeText(
                `${parallelLaneNodes.length} lane(s) visible`,
                `${parallelLaneNodes.length} 条泳道可见`,
              )
            : this.localizer.localizeText('No active lane right now', '当前没有活跃泳道'),
        tooltip: this.localizer.localizeText(
          'Parallel-lane summaries remain service-owned and reflect active execution pressure across workspaces.',
          '并行泳道摘要保持为 service-owned，用于反映跨工作区的活跃执行压力。',
        ),
        themeIconId: parallelLaneNodes.length > 0 ? 'split-horizontal' : 'circle-slash',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        children:
          parallelLaneNodes.length > 0
            ? parallelLaneNodes
            : [
                this.createInfoNode(
                  'parallel-lanes-empty',
                  'No parallel lane currently needs workbench supervision.',
                  '当前没有需要 workbench 监督的并行泳道。',
                ),
              ],
      },
      {
        nodeId: 'workspace-operations',
        label: this.localizer.localizeText('Workspace operations', '工作区操作'),
        description: this.localizer.localizeText(
          `${nativeWorkspaceOperationNodes.length} native command(s)`,
          `${nativeWorkspaceOperationNodes.length} 个原生命令`,
        ),
        tooltip: this.localizer.localizeText(
          'These commands keep bootstrap, diagnostics, and workflow authoring inside the VS Code workbench.',
          '这些命令会把 bootstrap、诊断和工作流编排保留在 VS Code workbench 内完成。',
        ),
        themeIconId: 'tools',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        children: nativeWorkspaceOperationNodes,
      },
      {
        nodeId: 'temporary-bridges',
        label: this.localizer.localizeText('Governed repository operations', '受治理仓库操作'),
        description:
          temporaryBridgeNodes.length > 0
            ? this.localizer.localizeText(
                `${temporaryBridgeNodes.length} service-backed operation(s)`,
                `${temporaryBridgeNodes.length} 个 service-backed 操作`,
              )
            : this.localizer.localizeText(
                'No repository operation is currently projected',
                '当前没有投影出仓库操作',
              ),
        tooltip: this.localizer.localizeText(
          'Adopt, host, and upgrade flows now execute through the local orchestration service without requiring a manual CLI handoff.',
          'adopt、host 与 upgrade 现在会通过本地编排服务直接执行，不再要求手动 CLI 交接。',
        ),
        themeIconId: temporaryBridgeNodes.length > 0 ? 'terminal' : 'circle-slash',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        children:
          temporaryBridgeNodes.length > 0
            ? temporaryBridgeNodes
            : [
                this.createInfoNode(
                  'temporary-bridges-empty',
                  'No adopt, host, or upgrade operation is currently projected into this workbench.',
                  '当前没有 adopt、host 或 upgrade 操作被投影到这个 workbench 中。',
                ),
              ],
      },
      ...this.buildServiceDiagnosticsNodes(context),
      {
        nodeId: 'active-editor',
        label: this.localizer.localizeText('Active editor', '当前编辑器'),
        description:
          context.activeEditorPath ??
          this.localizer.localizeText('No file editor is active', '当前没有活动的文件编辑器'),
        tooltip:
          context.activeSelectionLabel ??
          this.localizer.localizeText(
            'Move the cursor into a file to surface editor-local context.',
            '将光标移入文件后，这里会显示 editor-local 上下文。',
          ),
        themeIconId: 'file-code',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'selected-execution',
        label: this.localizer.localizeText('Selected execution', '当前选中执行'),
        description: selectedExecution
          ? this.getExecutionPrimaryLabel(selectedExecution.execution)
          : this.localizer.localizeText('No execution selected', '尚未选中执行'),
        tooltip: selectedExecution
          ? this.getExecutionTooltip(selectedExecution.execution)
          : this.localizer.localizeText(
              'Select one execution or HITL item to drive review detail and actions.',
              '选择一个执行或 HITL 项后，详情与动作会跟随更新。',
            ),
        themeIconId: selectedExecution
          ? this.getExecutionIconId(selectedExecution.execution)
          : 'circle-slash',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'review-source',
        label: this.localizer.localizeText('Review source', '评审来源'),
        description:
          reviewSourcePath ??
          this.localizer.localizeText('No routed review detail yet', '尚未解析出评审详情来源'),
        tooltip:
          reviewSourcePath ??
          this.localizer.localizeText(
            'Open review detail after selecting an execution to populate routed review metadata.',
            '选中执行并打开评审详情后，这里会显示路由后的评审元数据。',
          ),
        themeIconId: 'note',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        ...(reviewSourcePath
          ? {
              resourceUriPath: reviewSourcePath,
            }
          : {}),
      },
    ];
  }

  /**
   * Backward-compatible alias for the pre-Phase-A workspace-context presenter name.
   * @param context Editor/workspace snapshot.
   * @param selectedExecution Currently selected execution entry.
   * @param reviewSourcePath Routed review source path when available.
   * @returns Tree-node descriptors for the workbench overview view.
   */
  public buildWorkspaceContextNodes(
    context: VsCodeExtensionWorkspaceContextSnapshot,
    selectedExecution?: OrchestrationExecutionBoardEntry,
    reviewSourcePath?: string,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    return this.buildWorkbenchOverviewNodes({
      workspaceContext: context,
      queueOverview: {
        generatedAt: '',
        automationInbox: [],
        reviewQueue: [],
        parallelLanes: [],
        workspaceSummary: [],
        temporaryBridges: [],
        notificationOwnership: {
          ownerSurface: OrchestrationClientSurface.DESKTOP,
          pendingItemCount: 0,
          dueSoonItemCount: 0,
          overdueItemCount: 0,
          activeWorkspaceCount: 0,
          defaultFollowUpSlaMinutes: 0,
          notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
        },
      },
      ...(selectedExecution
        ? {
            selectedExecution,
          }
        : {}),
      ...(reviewSourcePath
        ? {
            reviewSourcePath,
          }
        : {}),
    });
  }

  /**
   * Builds HTML for the review-detail webview.
   * @param snapshot Detail snapshot resolved from service-owned queries.
   * @returns Standalone HTML payload for the webview.
   */
  public buildReviewDetailHtml(snapshot: VsCodeExtensionReviewDetailSnapshot): string {
    const title = this.localizer.localizeText('Governor review detail', 'Governor 评审详情');
    const emptyBody = `
      <section class="card">
        <h2>${this.escapeHtml(this.localizer.localizeText('No execution selected', '尚未选中执行'))}</h2>
        <p>${this.escapeHtml(
          this.localizer.localizeText(
            'Pick a task, review queue item, or HITL item from the lightweight views to inspect service-owned review detail.',
            '请先在轻量视图中选择任务、评审队列项或 HITL 项，再查看 service-owned 评审详情。',
          ),
        )}</p>
      </section>
    `;
    const selectedExecution = snapshot.selectedExecution?.execution;
    const artifactPane = snapshot.artifactPane;
    const requestedReviewSourcePath =
      artifactPane?.reviewSourcePath ?? snapshot.requestedReviewSourcePath;
    const workspaceFacts = this.buildWorkspaceFactLines(snapshot.workspaceContext);
    const workbenchLines = artifactPane ? this.buildArtifactWorkbenchLines(artifactPane) : [];
    const reviewLifecycleLines = artifactPane ? this.buildReviewLifecycleLines(artifactPane) : [];
    const policyTraceLines = artifactPane ? this.buildPolicyTraceLines(artifactPane) : [];
    const evidenceBacklinkLines = artifactPane ? this.buildEvidenceBacklinkLines(artifactPane) : [];
    const body =
      selectedExecution && artifactPane
        ? `
        <section class="card">
          <h2>${this.escapeHtml(this.getExecutionPrimaryLabel(selectedExecution))}</h2>
          <p>${this.escapeHtml(this.getExecutionDescription(selectedExecution))}</p>
          <ul class="facts">
            ${workspaceFacts
              .map(
                (fact) =>
                  `<li><strong>${this.escapeHtml(fact.label)}:</strong> ${this.escapeHtml(fact.value)}</li>`,
              )
              .join('')}
            <li><strong>${this.escapeHtml(this.localizer.localizeText('Execution', '执行'))}:</strong> ${this.escapeHtml(selectedExecution.executionId)}</li>
            <li><strong>${this.escapeHtml(this.localizer.localizeText('Session', '会话'))}:</strong> ${this.escapeHtml(selectedExecution.executionSessionId)}</li>
            <li><strong>${this.escapeHtml(this.localizer.localizeText('Review source', '评审来源'))}:</strong> ${this.escapeHtml(requestedReviewSourcePath ?? this.localizer.localizeText('Unavailable', '不可用'))}</li>
          </ul>
        </section>
        ${this.renderStringSection(
          this.localizer.localizeText('Artifact workbench', '产物工作台'),
          workbenchLines,
        )}
        ${this.renderStringSection(
          this.localizer.localizeText('Review lifecycle', '评审生命周期'),
          reviewLifecycleLines,
        )}
        ${this.renderStringSection(
          this.localizer.localizeText('Policy trace', '策略轨迹'),
          policyTraceLines,
        )}
        ${this.renderStringSection(
          this.localizer.localizeText('Evidence backlinks', '证据回链'),
          evidenceBacklinkLines,
        )}
        ${this.renderStringSection(
          this.localizer.localizeText('Artifacts', '产物'),
          artifactPane.artifacts.map(
            (artifact) =>
              `${artifact.artifactType} · ${artifact.artifactStatus} · ${artifact.artifactPath}`,
          ),
        )}
        ${this.renderStringSection(
          this.localizer.localizeText('Transcript preview', '转录预览'),
          artifactPane.transcript.flatMap((entry) => entry.lines.slice(0, 2)),
        )}
      `
        : requestedReviewSourcePath
          ? `
        <section class="card">
          <h2>${this.escapeHtml(this.localizer.localizeText('Review source selected', '已选择评审来源'))}</h2>
          <p>${this.escapeHtml(
            this.localizer.localizeText(
              'This queue item is currently anchored to a review artifact/backlink instead of one live execution payload.',
              '当前队列项暂时锚定到评审产物或回链，而不是某个实时执行载荷。',
            ),
          )}</p>
          <ul class="facts">
            ${workspaceFacts
              .map(
                (fact) =>
                  `<li><strong>${this.escapeHtml(fact.label)}:</strong> ${this.escapeHtml(fact.value)}</li>`,
              )
              .join('')}
            <li><strong>${this.escapeHtml(this.localizer.localizeText('Review source', '评审来源'))}:</strong> ${this.escapeHtml(requestedReviewSourcePath)}</li>
          </ul>
        </section>
      `
          : emptyBody;

    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      `  <title>${this.escapeHtml(title)}</title>`,
      '  <style>',
      '    :root { color-scheme: light dark; }',
      '    body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }',
      '    h1, h2 { margin: 0 0 8px; }',
      '    .card { border: 1px solid var(--vscode-panel-border); border-radius: 10px; padding: 12px; margin-bottom: 12px; background: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-list-hoverBackground) 8%); }',
      '    .facts { margin: 8px 0 0; padding-left: 16px; }',
      '    .section-list { margin: 0; padding-left: 16px; }',
      '    p, li { line-height: 1.5; }',
      '  </style>',
      '</head>',
      '<body>',
      `  <h1>${this.escapeHtml(title)}</h1>`,
      body,
      '</body>',
      '</html>',
    ].join('\n');
  }

  /**
   * Builds HTML for the workflow-studio evidence surface.
   * @param snapshot Workflow-studio inputs resolved from service-owned queries.
   * @returns Standalone HTML payload for the workflow-studio webview.
   */
  public buildWorkflowStudioHtml(snapshot: VsCodeExtensionWorkflowStudioSnapshot): string {
    const title = this.localizer.localizeText(
      'Governor workflow studio',
      'Governor Workflow Studio',
    );
    if (!snapshot.workspaceContext.workspaceRoot) {
      return [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="UTF-8" />',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        `  <title>${this.escapeHtml(title)}</title>`,
        '  <style>',
        '    :root { color-scheme: light dark; }',
        '    body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }',
        '    h1, h2 { margin: 0 0 8px; }',
        '    .card { border: 1px solid var(--vscode-panel-border); border-radius: 10px; padding: 12px; margin-bottom: 12px; background: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-list-hoverBackground) 8%); }',
        '    .facts { margin: 8px 0 0; padding-left: 16px; }',
        '    .section-list { margin: 0; padding-left: 16px; }',
        '    .action-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }',
        '    .action-item { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 10px; background: color-mix(in srgb, var(--vscode-editor-background) 88%, var(--vscode-button-secondaryBackground) 12%); }',
        '    .action-link { color: var(--vscode-textLink-foreground); text-decoration: none; font-weight: 600; }',
        '    .action-link:hover { text-decoration: underline; }',
        '    .action-disabled { font-weight: 600; color: var(--vscode-disabledForeground); }',
        '    .action-description { margin: 6px 0 0; color: var(--vscode-descriptionForeground); }',
        '    p, li { line-height: 1.5; }',
        '  </style>',
        '</head>',
        '<body>',
        `  <h1>${this.escapeHtml(title)}</h1>`,
        `  <section class="card"><h2>${this.escapeHtml(this.localizer.localizeText('No workspace selected', '尚未选择工作区'))}</h2><p>${this.escapeHtml(this.localizer.localizeText('Open a governed workspace folder to project workflow-studio evidence into VS Code.', '打开一个受治理工作区后，workflow studio 证据面才会投影到 VS Code。'))}</p></section>`,
        '</body>',
        '</html>',
      ].join('\n');
    }

    const queueOverview = snapshot.queueOverview;
    const selectedExecutionEntry = snapshot.selectedExecution;
    const selectedExecution = selectedExecutionEntry?.execution;
    const artifactPane = snapshot.artifactPane;
    const secureAuthoringLines = this.buildSecureAuthoringLines(snapshot.secureAuthoring);
    const workflowLines = this.buildWorkflowStudioSelectionLines(
      selectedExecution,
      artifactPane,
      snapshot.reviewSourcePath,
    );
    const runControlActions = this.buildWorkflowStudioActionDescriptors(
      selectedExecutionEntry,
      queueOverview.temporaryBridges,
      snapshot.reviewSourcePath,
    );
    const continuityLines = this.buildWorkflowStudioContinuityLines(
      snapshot.sessionContinuity,
      selectedExecution,
    );
    const queueLines = this.buildWorkflowStudioQueueLines(queueOverview);
    const latestWorkspaceOperationLines = this.buildLatestWorkspaceOperationLines(
      queueOverview.latestWorkspaceOperation,
    );
    const supportTruthLines = this.buildWorkflowStudioSupportTruthLines(
      queueOverview,
      selectedExecution,
      artifactPane,
    );
    const desktopDecisionLines = this.buildWorkflowStudioDesktopDecisionLines(
      queueOverview,
      selectedExecution,
    );
    const temporaryBridgeLines = this.buildWorkflowStudioTemporaryBridgeLines(
      queueOverview.temporaryBridges,
    );
    const workspaceFacts = this.buildWorkspaceFactLines(snapshot.workspaceContext);

    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      `  <title>${this.escapeHtml(title)}</title>`,
      '  <style>',
      '    :root { color-scheme: light dark; }',
      '    body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }',
      '    h1, h2 { margin: 0 0 8px; }',
      '    .card { border: 1px solid var(--vscode-panel-border); border-radius: 10px; padding: 12px; margin-bottom: 12px; background: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-list-hoverBackground) 8%); }',
      '    .facts { margin: 8px 0 0; padding-left: 16px; }',
      '    .section-list { margin: 0; padding-left: 16px; }',
      '    .action-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }',
      '    .action-item { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 10px; background: color-mix(in srgb, var(--vscode-editor-background) 88%, var(--vscode-button-secondaryBackground) 12%); }',
      '    .action-link { color: var(--vscode-textLink-foreground); text-decoration: none; font-weight: 600; }',
      '    .action-link:hover { text-decoration: underline; }',
      '    .action-disabled { font-weight: 600; color: var(--vscode-disabledForeground); }',
      '    .action-description { margin: 6px 0 0; color: var(--vscode-descriptionForeground); }',
      '    p, li { line-height: 1.5; }',
      '  </style>',
      '</head>',
      '<body>',
      `  <h1>${this.escapeHtml(title)}</h1>`,
      `  <section class="card">
        <h2>${this.escapeHtml(this.localizer.localizeText('Primary workbench evidence surface', '主工作台证据面'))}</h2>
        <p>${this.escapeHtml(
          this.localizer.localizeText(
            'Workflow studio stays service-backed: it shows workflow, queue, bridge, and support-truth evidence without turning VS Code into the owner of governance truth.',
            'Workflow Studio 保持为 service-backed：它只展示 workflow、queue、bridge 与 support-truth 证据，不把 VS Code 变成治理真值拥有者。',
          ),
        )}</p>
        <ul class="facts">
          ${workspaceFacts
            .map(
              (fact) =>
                `<li><strong>${this.escapeHtml(fact.label)}:</strong> ${this.escapeHtml(fact.value)}</li>`,
            )
            .join('')}
          <li><strong>${this.escapeHtml(this.localizer.localizeText('Public support level', '公开支持级别'))}:</strong> ${this.escapeHtml(this.localizePublicSupportLevel(VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL))}</li>
          <li><strong>${this.escapeHtml(this.localizer.localizeText('Desktop relationship', 'Desktop 关系'))}:</strong> ${this.escapeHtml(this.localizeDesktopRelationship(VSCODE_EXTENSION_DESKTOP_RELATIONSHIP))}</li>
        </ul>
      </section>`,
      this.renderStringSection(
        this.localizer.localizeText('Workflow focus', 'Workflow 聚焦'),
        workflowLines,
      ),
      this.renderStringSection(
        this.localizer.localizeText('Latest workspace operation', '最近一次工作区操作'),
        latestWorkspaceOperationLines,
      ),
      this.renderActionSection(
        this.localizer.localizeText('Governed run control', '受治理 Run Control'),
        runControlActions,
      ),
      this.renderStringSection(
        this.localizer.localizeText('Continuity and handoff', '连续性与交接'),
        continuityLines,
      ),
      this.renderStringSection(
        this.localizer.localizeText('Secure authoring readiness', '安全 Authoring Readiness'),
        secureAuthoringLines,
      ),
      this.renderStringSection(
        this.localizer.localizeText('Queue and rollout overview', '队列与 rollout 总览'),
        queueLines,
      ),
      this.renderStringSection(
        this.localizer.localizeText('Support-truth gate', 'Support-Truth 门槛'),
        supportTruthLines,
      ),
      this.renderStringSection(
        this.localizer.localizeText('Desktop decision surface', 'Desktop 决策面'),
        desktopDecisionLines,
      ),
      this.renderStringSection(
        this.localizer.localizeText('Temporary bridge exit evidence', '临时 Bridge 退出证据'),
        temporaryBridgeLines,
      ),
      '</body>',
      '</html>',
    ].join('\n');
  }

  /**
   * Builds one failure-state HTML payload for webviews that could not resolve service-backed data.
   * @param options Localized title/summary inputs plus optional error detail.
   * @returns Standalone HTML payload for degraded-but-restorable webview rendering.
   */
  public buildServiceFailureHtml(options: {
    titleEnglish: string;
    titleChinese: string;
    summaryEnglish: string;
    summaryChinese: string;
    errorMessage?: string;
  }): string {
    const title = this.localizer.localizeText(options.titleEnglish, options.titleChinese);
    const summary = this.localizer.localizeText(options.summaryEnglish, options.summaryChinese);
    const detailHeading = this.localizer.localizeText('Diagnostic detail', '诊断详情');
    const guidance = this.localizer.localizeText(
      'The workbench stays loaded, but the local orchestration sidecar did not return a usable snapshot. Reinstall the latest VSIX or reopen the workspace after the local service dependency chain is available.',
      'Workbench 会保持可见，但本地 orchestration sidecar 没有返回可用快照。请安装最新 VSIX，或在本地服务依赖链可用后重新打开工作区。',
    );

    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      `  <title>${this.escapeHtml(title)}</title>`,
      '  <style>',
      '    :root { color-scheme: light dark; }',
      '    body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }',
      '    h1, h2 { margin: 0 0 8px; }',
      '    .card { border: 1px solid var(--vscode-panel-border); border-radius: 10px; padding: 12px; margin-bottom: 12px; background: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-list-hoverBackground) 8%); }',
      '    p, li, pre { line-height: 1.5; }',
      '    pre { white-space: pre-wrap; overflow-wrap: anywhere; }',
      '  </style>',
      '</head>',
      '<body>',
      `  <h1>${this.escapeHtml(title)}</h1>`,
      `  <section class="card"><h2>${this.escapeHtml(title)}</h2><p>${this.escapeHtml(summary)}</p><p>${this.escapeHtml(guidance)}</p></section>`,
      ...(options.errorMessage
        ? [
            `  <section class="card"><h2>${this.escapeHtml(detailHeading)}</h2><pre>${this.escapeHtml(options.errorMessage)}</pre></section>`,
          ]
        : []),
      '</body>',
      '</html>',
    ].join('\n');
  }

  /**
   * Builds markdown for chat-participant responses.
   * @param options Chat response inputs.
   * @returns Markdown summary for the chat stream.
   */
  public buildChatResponseMarkdown(options: {
    command?: string;
    workspaceContext: VsCodeExtensionWorkspaceContextSnapshot;
    executionBoardEntries: readonly OrchestrationExecutionBoardEntry[];
    hitlInboxEntries: readonly OrchestrationHitlInboxEntry[];
    queueOverview?: OrchestrationQueueOverviewQueryResponse;
    reviewDetailSnapshot?: VsCodeExtensionReviewDetailSnapshot;
  }): string {
    if (!options.workspaceContext.workspaceRoot) {
      return this.localizer.localizeText(
        'Open a workspace folder to let Governor connect to the local orchestration service.',
        '请先打开一个工作区文件夹，让 Governor 连接本地编排服务。',
      );
    }

    const latestExecution = options.executionBoardEntries[0]?.execution;
    const reviewEntries = options.reviewDetailSnapshot?.artifactPane?.reviews ?? [];
    const queueOverview = options.queueOverview;
    const lines = [
      `# ${this.localizer.localizeText('Governor status', 'Governor 状态')}`,
      `- ${this.localizer.localizeText('Workspace', '工作区')}: \`${options.workspaceContext.workspaceLabel}\``,
      `- ${this.localizer.localizeText('Trust', '信任')}: ${options.workspaceContext.workspaceTrusted ? this.localizer.localizeText('Trusted', '已受信任') : this.localizer.localizeText('Limited', '受限')}`,
      `- ${this.localizer.localizeText('Trust-sensitive actions', '信任敏感动作')}: ${this.getTrustSensitiveActionStatus(options.workspaceContext.workspaceTrusted)}`,
      `- ${this.localizer.localizeText('Execution board count', '执行看板数量')}: ${options.executionBoardEntries.length}`,
      `- ${this.localizer.localizeText('Pending HITL count', '待处理 HITL 数量')}: ${options.hitlInboxEntries.length}`,
    ];
    if (queueOverview) {
      lines.push(
        `- ${this.localizer.localizeText('Review queue count', '评审队列数量')}: ${queueOverview.reviewQueue.length}`,
        `- ${this.localizer.localizeText('Automation queue count', '自动化队列数量')}: ${queueOverview.automationInbox.length}`,
        `- ${this.localizer.localizeText('Active workspace count', '活跃工作区数量')}: ${queueOverview.notificationOwnership.activeWorkspaceCount}`,
        `- ${this.localizer.localizeText('Temporary bridge count', '临时 bridge 数量')}: ${queueOverview.temporaryBridges.length}`,
      );
      if (queueOverview.latestWorkspaceOperation) {
        const localeMismatch = this.hasWorkspaceOperationLocaleMismatch(
          queueOverview.latestWorkspaceOperation,
        );
        lines.push(
          `- ${this.localizer.localizeText('Latest workspace operation', '最近一次工作区操作')}: ${this.localizeWorkspaceOperationKind(queueOverview.latestWorkspaceOperation.operationKind)}`,
        );
        if (
          this.getVisibleWorkspaceOperationSummary(queueOverview.latestWorkspaceOperation).trim()
            .length > 0
        ) {
          lines.push(
            `- ${this.localizer.localizeText('Latest workspace summary', '最近一次工作区摘要')}: ${this.getVisibleWorkspaceOperationSummary(queueOverview.latestWorkspaceOperation)}`,
          );
        }
        const checkSummary = this.formatWorkspaceOperationCheckTotals(
          queueOverview.latestWorkspaceOperation.result.checkTotals,
        );
        if (checkSummary) {
          lines.push(
            `- ${this.localizer.localizeText('Latest workspace checks', '最近一次工作区检查')}: ${checkSummary}`,
          );
        }
        if (localeMismatch) {
          lines.push(
            `- ${this.localizer.localizeText('Latest localized details', '最近一次本地化详情')}: ${this.buildWorkspaceOperationLocaleMismatchMessage(queueOverview.latestWorkspaceOperation)}`,
          );
        }
      }
    }
    if (options.workspaceContext.serviceHealth) {
      lines.push(
        `- ${this.localizer.localizeText('Service lifecycle', '服务生命周期')}: ${this.localizeServiceLifecycleStatus(options.workspaceContext.serviceHealth.lifecycleStatus)}`,
        `- ${this.localizer.localizeText('Service topology', '服务拓扑')}: ${this.getServiceTopologyDescription(options.workspaceContext.serviceHealth)}`,
        `- ${this.localizer.localizeText('Checkpoint support', '检查点支持')}: ${this.getCheckpointCapabilityDescription(options.workspaceContext.serviceHealth.checkpointCapable)}`,
        `- ${this.localizer.localizeText('Memory provider', '内存提供方')}: ${this.getMemoryProviderDescription(options.workspaceContext.serviceHealth)}`,
      );
    }
    lines.push(
      `- ${this.localizer.localizeText('Public support level', '公开支持级别')}: ${this.localizePublicSupportLevel(VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL)}`,
      `- ${this.localizer.localizeText('Desktop relationship', 'Desktop 关系')}: ${this.localizeDesktopRelationship(VSCODE_EXTENSION_DESKTOP_RELATIONSHIP)}`,
    );
    if (queueOverview) {
      lines.push(
        `- ${this.localizer.localizeText('Workflow studio gate', 'Workflow Studio 门槛')}: ${this.getSupportTruthGateLabel(queueOverview, latestExecution)}`,
      );
    }

    if (latestExecution) {
      lines.push(
        `- ${this.localizer.localizeText('Latest execution', '最近执行')}: ${this.getExecutionPrimaryLabel(latestExecution)} (${this.localizeExecutionStatus(latestExecution.status)})`,
      );
    }

    if (options.command === VSCODE_EXTENSION_CHAT_COMMAND_REVIEW) {
      lines.push(
        '',
        `## ${this.localizer.localizeText('Review focus', '评审聚焦')}`,
        `- ${this.localizer.localizeText('Visible review records', '可见评审记录')}: ${reviewEntries.length}`,
      );
      for (const review of reviewEntries.slice(0, 3)) {
        lines.push(`- ${review.title} (${review.lifecycleStatus})`);
      }
    }

    return lines.join('\n');
  }

  private buildServiceDiagnosticsNodes(
    context: VsCodeExtensionWorkspaceContextSnapshot,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    if (!context.serviceHealth) {
      return [];
    }

    return [
      {
        nodeId: 'service-lifecycle',
        label: this.localizer.localizeText('Service lifecycle', '服务生命周期'),
        description: this.localizeServiceLifecycleStatus(context.serviceHealth.lifecycleStatus),
        tooltip:
          context.serviceHealth.pid === undefined
            ? this.localizer.localizeText(
                'Current local orchestration service health probe.',
                '当前本地编排服务健康探针结果。',
              )
            : this.localizer.localizeText(
                `Current local orchestration service health probe. PID: ${context.serviceHealth.pid}.`,
                `当前本地编排服务健康探针结果。PID：${context.serviceHealth.pid}。`,
              ),
        themeIconId: 'info',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'service-topology',
        label: this.localizer.localizeText('Service topology', '服务拓扑'),
        description: this.getServiceTopologyDescription(context.serviceHealth),
        tooltip: this.localizer.localizeText(
          'Shows which host shape and transport currently back this workspace.',
          '显示当前工作区背后的服务宿主形态与传输方式。',
        ),
        themeIconId: 'info',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'checkpoint-support',
        label: this.localizer.localizeText('Checkpoint support', '检查点支持'),
        description: this.getCheckpointCapabilityDescription(
          context.serviceHealth.checkpointCapable,
        ),
        tooltip: this.localizer.localizeText(
          'Indicates whether recoverable checkpoints are available for this workspace service.',
          '表示当前工作区服务是否提供可恢复检查点。',
        ),
        themeIconId: 'history',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
      {
        nodeId: 'memory-provider',
        label: this.localizer.localizeText('Memory provider', '内存提供方'),
        description: this.getMemoryProviderDescription(context.serviceHealth),
        tooltip: this.localizer.localizeText(
          'Shows the memory-store provider wired into the local orchestration service.',
          '显示接入本地编排服务的 memory-store provider。',
        ),
        themeIconId: 'database',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      },
    ];
  }

  private buildBootstrapReadinessNode(
    readiness: VsCodeExtensionWorkbenchOverviewSnapshot['bootstrapReadiness'] | undefined,
  ): VsCodeExtensionTreeNodeDescriptor {
    if (!readiness) {
      return {
        nodeId: 'bootstrap-readiness',
        label: this.localizer.localizeText('Bootstrap readiness', '初始化就绪度'),
        description: this.localizer.localizeText('Unavailable', '暂不可用'),
        tooltip: this.localizer.localizeText(
          'Bootstrap readiness is unavailable until the local orchestration service responds.',
          '在本地编排服务可用前，暂时无法读取 bootstrap readiness。',
        ),
        themeIconId: 'circle-slash',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      };
    }

    return {
      nodeId: 'bootstrap-readiness',
      label: this.localizer.localizeText('Bootstrap readiness', '初始化就绪度'),
      description: readiness.configExists
        ? this.localizer.localizeText('Ready', '已就绪')
        : this.localizer.localizeText('Bootstrap required', '需要初始化'),
      tooltip: [
        `${this.localizer.localizeText('Workspace root', '工作区根目录')}: ${readiness.workspaceRoot}`,
        `${this.localizer.localizeText('Config path', '配置路径')}: ${readiness.configPath}`,
        `${this.localizer.localizeText('Workspace mode', '工作区模式')}: ${readiness.workspaceMode}`,
        `${this.localizer.localizeText('Recommended actions', '建议动作')}: ${this.formatBootstrapReadinessActions(readiness.recommendedActions)}`,
      ].join('\n'),
      themeIconId: readiness.configExists ? 'pass-filled' : 'warning',
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      command: readiness.configExists
        ? undefined
        : this.createCommandDescriptor(
            VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKSPACE_BOOTSTRAP,
            'Run workspace bootstrap',
            '执行工作区初始化',
          ),
    };
  }

  private buildLatestWorkspaceOperationNode(
    snapshot: OrchestrationWorkspaceOperationSnapshot | undefined,
  ): VsCodeExtensionTreeNodeDescriptor {
    if (!snapshot) {
      return {
        nodeId: 'latest-workspace-operation',
        label: this.localizer.localizeText('Latest workspace operation', '最近一次工作区操作'),
        description: this.localizer.localizeText(
          'No service-backed result yet',
          '暂时没有 service-backed 结果',
        ),
        tooltip: this.localizer.localizeText(
          'Run workspace bootstrap, doctor, or check from the VS Code workbench to capture the latest service-owned result.',
          '请先从 VS Code workbench 执行 workspace bootstrap、doctor 或 check，以获取最新的 service-owned 结果。',
        ),
        themeIconId: 'circle-slash',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      };
    }

    const checkSummary = this.formatWorkspaceOperationCheckTotals(snapshot.result.checkTotals);
    const descriptionParts = [this.localizeWorkspaceOperationKind(snapshot.operationKind)];
    const localeMismatch = this.hasWorkspaceOperationLocaleMismatch(snapshot);
    if (checkSummary) {
      descriptionParts.push(checkSummary);
    }

    return {
      nodeId: 'latest-workspace-operation',
      label: this.localizer.localizeText('Latest workspace operation', '最近一次工作区操作'),
      description: descriptionParts.join(' · '),
      tooltip: localeMismatch
        ? this.buildWorkspaceOperationLocaleMismatchMessage(snapshot)
        : [
            snapshot.result.summary,
            `${this.localizer.localizeText('Completed at', '完成时间')}: ${snapshot.completedAt}`,
          ].join('\n'),
      themeIconId: this.getWorkspaceOperationIconId(snapshot),
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      children: this.buildLatestWorkspaceOperationDetailNodes(snapshot),
    };
  }

  private buildLatestWorkspaceOperationDetailNodes(
    snapshot: OrchestrationWorkspaceOperationSnapshot,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    const localeMismatch = this.hasWorkspaceOperationLocaleMismatch(snapshot);
    const nodes: VsCodeExtensionTreeNodeDescriptor[] = [
      {
        nodeId: 'latest-workspace-operation:kind',
        label: this.localizer.localizeText('Operation', '操作'),
        description: this.localizeWorkspaceOperationKind(snapshot.operationKind),
        tooltip: snapshot.message,
        themeIconId: this.getWorkspaceOperationIconId(snapshot),
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
      },
      {
        nodeId: 'latest-workspace-operation:runtime-operation',
        label: this.localizer.localizeText('Runtime operation', '运行时操作'),
        description: snapshot.result.operation,
        tooltip: snapshot.result.operation,
        themeIconId: 'symbol-key',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
      },
      {
        nodeId: 'latest-workspace-operation:summary',
        label: this.localizer.localizeText('Summary', '摘要'),
        description: this.getVisibleWorkspaceOperationSummary(snapshot),
        tooltip: localeMismatch
          ? this.buildWorkspaceOperationLocaleMismatchMessage(snapshot)
          : snapshot.message,
        themeIconId: 'note',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
      },
      {
        nodeId: 'latest-workspace-operation:completed-at',
        label: this.localizer.localizeText('Completed at', '完成时间'),
        description: snapshot.completedAt,
        tooltip: snapshot.completedAt,
        themeIconId: 'history',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
      },
    ];
    if (snapshot.locale) {
      nodes.push({
        nodeId: 'latest-workspace-operation:locale',
        label: this.localizer.localizeText('Captured locale', '采集语言'),
        description: snapshot.locale,
        tooltip: snapshot.locale,
        themeIconId: 'globe',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
      });
    }
    const checkSummary = this.formatWorkspaceOperationCheckTotals(snapshot.result.checkTotals);
    if (checkSummary) {
      nodes.push({
        nodeId: 'latest-workspace-operation:checks',
        label: this.localizer.localizeText('Checks', '检查'),
        description: checkSummary,
        tooltip: checkSummary,
        themeIconId: this.getWorkspaceOperationIconId(snapshot),
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
      });
    }
    if (localeMismatch) {
      nodes.push({
        nodeId: 'latest-workspace-operation:localized-details',
        label: this.localizer.localizeText('Localized details', '本地化详情'),
        description: this.localizer.localizeText('Rerun required', '需要重新执行'),
        tooltip: this.buildWorkspaceOperationLocaleMismatchMessage(snapshot),
        themeIconId: 'globe',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
      });
    }

    if (!localeMismatch) {
      for (const [index, check] of (snapshot.result.checks ?? [])
        .filter((entry) => entry.status === 'warn' || entry.status === 'fail')
        .entries()) {
        nodes.push({
          nodeId: `latest-workspace-operation:check:${index}`,
          label: check.id,
          description: check.detail,
          tooltip: check.detail,
          themeIconId: check.status === 'fail' ? 'error' : 'warning',
          contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        });
      }
    }

    for (const [index, artifact] of (snapshot.result.artifacts ?? []).entries()) {
      nodes.push({
        nodeId: `latest-workspace-operation:artifact:${index}`,
        label: this.localizer.localizeText('Receipt/backlink', '回执或回链'),
        description: `${artifact.id} · ${artifact.path}`,
        tooltip: artifact.path,
        themeIconId: 'go-to-file',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        resourceUriPath: artifact.path,
      });
    }

    if (!localeMismatch) {
      for (const [index, prompt] of (snapshot.result.interactionPrompts ?? []).entries()) {
        nodes.push({
          nodeId: `latest-workspace-operation:prompt:${index}`,
          label: prompt.title,
          description: prompt.action,
          tooltip: prompt.action,
          themeIconId: prompt.blocking ? 'warning' : 'lightbulb',
          contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        });
      }

      for (const [index, line] of (snapshot.result.layeredLogs?.summary ?? []).entries()) {
        nodes.push({
          nodeId: `latest-workspace-operation:summary-log:${index}`,
          label: this.localizer.localizeText('Progress', '进度'),
          description: line,
          tooltip: line,
          themeIconId: 'list-selection',
          contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        });
      }

      for (const [index, line] of (snapshot.result.layeredLogs?.detailed ?? []).entries()) {
        nodes.push({
          nodeId: `latest-workspace-operation:detailed-log:${index}`,
          label: this.localizer.localizeText('Detail', '详情'),
          description: line,
          tooltip: line,
          themeIconId: 'list-tree',
          contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        });
      }
    }

    return nodes;
  }

  private buildLatestWorkspaceOperationLines(
    snapshot: OrchestrationWorkspaceOperationSnapshot | undefined,
  ): string[] {
    if (!snapshot) {
      return [];
    }

    const localeMismatch = this.hasWorkspaceOperationLocaleMismatch(snapshot);
    const lines = [
      `${this.localizer.localizeText('Operation', '操作')}: ${this.localizeWorkspaceOperationKind(snapshot.operationKind)}`,
      `${this.localizer.localizeText('Runtime operation', '运行时操作')}: ${snapshot.result.operation}`,
      `${this.localizer.localizeText('Summary', '摘要')}: ${this.getVisibleWorkspaceOperationSummary(snapshot)}`,
      `${this.localizer.localizeText('Completed at', '完成时间')}: ${snapshot.completedAt}`,
    ];
    if (snapshot.locale) {
      lines.push(
        `${this.localizer.localizeText('Captured locale', '采集语言')}: ${snapshot.locale}`,
      );
    }
    const checkSummary = this.formatWorkspaceOperationCheckTotals(snapshot.result.checkTotals);
    if (checkSummary) {
      lines.push(`${this.localizer.localizeText('Checks', '检查')}: ${checkSummary}`);
    }

    if (localeMismatch) {
      lines.push(
        `${this.localizer.localizeText('Localized details', '本地化详情')}: ${this.buildWorkspaceOperationLocaleMismatchMessage(snapshot)}`,
      );
    } else {
      for (const check of (snapshot.result.checks ?? []).filter(
        (entry) => entry.status === 'warn' || entry.status === 'fail',
      )) {
        lines.push(
          `${this.localizer.localizeText('Attention', '关注项')}: ${check.id} · ${check.detail}`,
        );
      }
    }
    for (const artifact of snapshot.result.artifacts ?? []) {
      lines.push(
        `${this.localizer.localizeText('Receipt/backlink', '回执或回链')}: ${artifact.id} · ${artifact.path}`,
      );
    }
    if (!localeMismatch) {
      for (const prompt of snapshot.result.interactionPrompts ?? []) {
        lines.push(
          `${this.localizer.localizeText('Suggested follow-up', '建议后续动作')}: ${prompt.title} · ${prompt.action}`,
        );
      }
      for (const line of snapshot.result.layeredLogs?.summary ?? []) {
        lines.push(`${this.localizer.localizeText('Progress', '进度')}: ${line}`);
      }
      for (const line of snapshot.result.layeredLogs?.detailed ?? []) {
        lines.push(`${this.localizer.localizeText('Detail', '详情')}: ${line}`);
      }
    }

    return lines;
  }

  private formatWorkspaceOperationCheckTotals(
    checkTotals: OrchestrationWorkspaceOperationSnapshot['result']['checkTotals'] | undefined,
  ): string | undefined {
    if (!checkTotals) {
      return undefined;
    }

    return this.localizer.localizeText(
      `${checkTotals.pass} pass / ${checkTotals.warn} warn / ${checkTotals.fail} fail`,
      `${checkTotals.pass} 通过 / ${checkTotals.warn} 警告 / ${checkTotals.fail} 失败`,
    );
  }

  private getVisibleWorkspaceOperationSummary(
    snapshot: OrchestrationWorkspaceOperationSnapshot,
  ): string {
    return this.hasWorkspaceOperationLocaleMismatch(snapshot)
      ? this.localizer.localizeText(
          'Captured in another locale. Rerun this workspace operation from the current workbench to refresh localized summary, prompts, and progress.',
          '该结果是在另一种语言下采集的。请从当前 workbench 重新执行该工作区操作，以刷新本地化摘要、建议动作和进度。',
        )
      : snapshot.result.summary;
  }

  private hasWorkspaceOperationLocaleMismatch(
    snapshot: OrchestrationWorkspaceOperationSnapshot,
  ): boolean {
    if (!snapshot.locale) {
      return false;
    }

    return (
      this.normalizeWorkspaceOperationLocaleFamily(snapshot.locale) !== this.getUiLocaleFamily()
    );
  }

  private buildWorkspaceOperationLocaleMismatchMessage(
    snapshot: OrchestrationWorkspaceOperationSnapshot,
  ): string {
    return this.localizer.localizeText(
      `This result was captured in ${snapshot.locale ?? 'another locale'}. Rerun the workspace operation from the current VS Code language to refresh localized details.`,
      `该结果是在 ${snapshot.locale ?? '另一种语言'} 下采集的。请在当前 VS Code 语言下重新执行该工作区操作，以刷新本地化详情。`,
    );
  }

  private getUiLocaleFamily(): string {
    return this.localizer.localizeText('__locale_en__', '__locale_zh__') === '__locale_zh__'
      ? 'zh'
      : 'en';
  }

  private normalizeWorkspaceOperationLocaleFamily(locale: string): string {
    return locale.trim().toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }

  private getWorkspaceOperationIconId(snapshot: OrchestrationWorkspaceOperationSnapshot): string {
    if ((snapshot.result.checkTotals?.fail ?? 0) > 0) {
      return 'error';
    }
    if ((snapshot.result.checkTotals?.warn ?? 0) > 0) {
      return 'warning';
    }

    switch (snapshot.operationKind) {
      case OrchestrationWorkspaceOperationKind.WORKSPACE_BOOTSTRAP:
        return 'tools';
      case OrchestrationWorkspaceOperationKind.DOCTOR:
        return 'search';
      case OrchestrationWorkspaceOperationKind.CHECK:
        return 'pass-filled';
      default:
        return 'history';
    }
  }

  private localizeWorkspaceOperationKind(
    operationKind: OrchestrationWorkspaceOperationKind,
  ): string {
    switch (operationKind) {
      case OrchestrationWorkspaceOperationKind.WORKSPACE_BOOTSTRAP:
        return this.localizer.localizeText('Run workspace bootstrap', '执行工作区初始化');
      case OrchestrationWorkspaceOperationKind.DOCTOR:
        return this.localizer.localizeText('Run doctor', '执行 doctor');
      case OrchestrationWorkspaceOperationKind.CHECK:
        return this.localizer.localizeText('Run check', '执行 check');
      case OrchestrationWorkspaceOperationKind.ADOPT_BOOTSTRAP:
        return this.localizer.localizeText('Run adopt bootstrap', '执行 adopt bootstrap');
      case OrchestrationWorkspaceOperationKind.ADOPTION_APPLY:
        return this.localizer.localizeText('Apply adoption pack', '应用 adopt 包');
      case OrchestrationWorkspaceOperationKind.HOST_EXPORT:
        return this.localizer.localizeText('Export host assets', '导出宿主资产');
      case OrchestrationWorkspaceOperationKind.HOST_VERIFY:
        return this.localizer.localizeText('Verify host assets', '校验宿主资产');
      case OrchestrationWorkspaceOperationKind.HOST_PACK:
        return this.localizer.localizeText('Pack host bundle', '打包宿主 bundle');
      case OrchestrationWorkspaceOperationKind.UPGRADE_PREVIEW:
        return this.localizer.localizeText('Preview upgrade', '预览升级');
      case OrchestrationWorkspaceOperationKind.UPGRADE_APPLY:
        return this.localizer.localizeText('Apply upgrade', '应用升级');
      case OrchestrationWorkspaceOperationKind.WORKFLOW_PREVIEW:
        return this.localizer.localizeText('Preview workflow', '预览工作流');
      case OrchestrationWorkspaceOperationKind.WORKFLOW_CREATE:
        return this.localizer.localizeText('Create workflow', '创建工作流');
      case OrchestrationWorkspaceOperationKind.WORKFLOW_EDIT:
        return this.localizer.localizeText('Edit workflow', '编辑工作流');
      default:
        return operationKind;
    }
  }

  private formatBootstrapReadinessActions(
    actionIds: readonly OrchestrationBootstrapReadinessActionId[],
  ): string {
    if (actionIds.length === 0) {
      return this.localizer.localizeText('None', '无');
    }

    return actionIds.map((actionId) => this.getBootstrapReadinessActionLabel(actionId)).join(', ');
  }

  private getBootstrapReadinessActionLabel(
    actionId: OrchestrationBootstrapReadinessActionId,
  ): string {
    switch (actionId) {
      case OrchestrationBootstrapReadinessActionId.RUN_WORKSPACE_BOOTSTRAP:
        return this.localizer.localizeText('Run workspace bootstrap', '执行工作区初始化');
      case OrchestrationBootstrapReadinessActionId.REFRESH_WORKSPACE_STATE:
        return this.localizer.localizeText('Refresh governance views', '刷新治理视图');
      default:
        return this.localizer.localizeText('Review workbench guidance', '查看工作台指引');
    }
  }

  private buildNativeWorkspaceOperationNodes(): readonly VsCodeExtensionTreeNodeDescriptor[] {
    return [
      {
        nodeId: 'workspace-operation-bootstrap',
        label: this.localizer.localizeText('Run workspace bootstrap', '执行工作区初始化'),
        description: this.localizer.localizeText(
          'Create baseline directories and config in-place.',
          '在当前工作区内创建基线目录和配置。',
        ),
        themeIconId: 'tools',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        command: this.createCommandDescriptor(
          VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKSPACE_BOOTSTRAP,
          'Run workspace bootstrap',
          '执行工作区初始化',
        ),
      },
      {
        nodeId: 'workspace-operation-doctor',
        label: this.localizer.localizeText('Run doctor', '执行 doctor'),
        description: this.localizer.localizeText(
          'Collect repository diagnostics and readiness evidence.',
          '收集仓库诊断与 readiness 证据。',
        ),
        themeIconId: 'search',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        command: this.createCommandDescriptor(
          VSCODE_EXTENSION_COMMAND_IDS.RUN_DOCTOR,
          'Run doctor',
          '执行 doctor',
        ),
      },
      {
        nodeId: 'workspace-operation-check',
        label: this.localizer.localizeText('Run check', '执行 check'),
        description: this.localizer.localizeText(
          'Run repository governance checks without leaving VS Code.',
          '在 VS Code 内直接执行仓库治理检查。',
        ),
        themeIconId: 'pass-filled',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        command: this.createCommandDescriptor(
          VSCODE_EXTENSION_COMMAND_IDS.RUN_CHECK,
          'Run check',
          '执行 check',
        ),
      },
      {
        nodeId: 'workspace-operation-workflow-preview',
        label: this.localizer.localizeText('Preview workflow', '预览工作流'),
        description: this.localizer.localizeText(
          'Inspect one workflow template from the workbench.',
          '直接从 workbench 预览一个工作流模板。',
        ),
        themeIconId: 'preview',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        command: this.createCommandDescriptor(
          VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKFLOW_PREVIEW,
          'Preview workflow',
          '预览工作流',
        ),
      },
      {
        nodeId: 'workspace-operation-workflow-create',
        label: this.localizer.localizeText('Create workflow', '创建工作流'),
        description: this.localizer.localizeText(
          'Create one workflow authoring entry without a session shell handoff.',
          '无需 session shell 交接，直接创建工作流入口。',
        ),
        themeIconId: 'add',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        command: this.createCommandDescriptor(
          VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKFLOW_CREATE,
          'Create workflow',
          '创建工作流',
        ),
      },
      {
        nodeId: 'workspace-operation-workflow-edit',
        label: this.localizer.localizeText('Edit workflow', '编辑工作流'),
        description: this.localizer.localizeText(
          'Edit one workflow entry from the VS Code workbench.',
          '直接从 VS Code workbench 编辑一个工作流入口。',
        ),
        themeIconId: 'edit',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
        command: this.createCommandDescriptor(
          VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKFLOW_EDIT,
          'Edit workflow',
          '编辑工作流',
        ),
      },
    ];
  }

  private buildWorkspaceFactLines(
    context: VsCodeExtensionWorkspaceContextSnapshot,
  ): ReadonlyArray<{ label: string; value: string }> {
    const facts = [
      {
        label: this.localizer.localizeText('Workspace', '工作区'),
        value: context.workspaceLabel,
      },
      {
        label: this.localizer.localizeText('Trust', '信任'),
        value: context.workspaceTrusted
          ? this.localizer.localizeText('Trusted', '已受信任')
          : this.localizer.localizeText('Limited', '受限'),
      },
      {
        label: this.localizer.localizeText('Trust-sensitive actions', '信任敏感动作'),
        value: this.getTrustSensitiveActionStatus(context.workspaceTrusted),
      },
    ];
    if (!context.serviceHealth) {
      return facts;
    }

    return [
      ...facts,
      {
        label: this.localizer.localizeText('Service lifecycle', '服务生命周期'),
        value: this.localizeServiceLifecycleStatus(context.serviceHealth.lifecycleStatus),
      },
      {
        label: this.localizer.localizeText('Service topology', '服务拓扑'),
        value: this.getServiceTopologyDescription(context.serviceHealth),
      },
      {
        label: this.localizer.localizeText('Checkpoint support', '检查点支持'),
        value: this.getCheckpointCapabilityDescription(context.serviceHealth.checkpointCapable),
      },
      {
        label: this.localizer.localizeText('Memory provider', '内存提供方'),
        value: this.getMemoryProviderDescription(context.serviceHealth),
      },
    ];
  }

  private buildArtifactWorkbenchLines(
    artifactPane: NonNullable<VsCodeExtensionReviewDetailSnapshot['artifactPane']>,
  ): string[] {
    const lines = [
      `${this.localizer.localizeText('Artifact count', '产物数量')}: ${artifactPane.workbench.artifactCount}`,
      `${this.localizer.localizeText('Review count', '评审数量')}: ${artifactPane.workbench.reviewCount}`,
      `${this.localizer.localizeText('Transcript count', '转录数量')}: ${artifactPane.workbench.transcriptCount}`,
    ];
    if (artifactPane.workbench.latestArtifactId) {
      lines.push(
        `${this.localizer.localizeText('Latest artifact', '最新产物')}: ${artifactPane.workbench.latestArtifactId}`,
      );
    }
    if (artifactPane.workbench.latestReviewId) {
      lines.push(
        `${this.localizer.localizeText('Latest review', '最新评审')}: ${artifactPane.workbench.latestReviewId}`,
      );
    }
    if (artifactPane.workbench.latestTranscriptEntryId) {
      lines.push(
        `${this.localizer.localizeText('Latest transcript entry', '最新转录条目')}: ${artifactPane.workbench.latestTranscriptEntryId}`,
      );
    }

    return lines;
  }

  private buildReviewLifecycleLines(
    artifactPane: NonNullable<VsCodeExtensionReviewDetailSnapshot['artifactPane']>,
  ): string[] {
    const lines = [
      `${this.localizer.localizeText('Total review records', '评审记录总数')}: ${artifactPane.reviewLifecycle.totalReviewCount}`,
      `${this.localizer.localizeText('Pending reviews', '待处理评审')}: ${artifactPane.reviewLifecycle.pendingReviewCount}`,
      `${this.localizer.localizeText('Verified reviews', '已验证评审')}: ${artifactPane.reviewLifecycle.verifiedReviewCount}`,
      `${this.localizer.localizeText('Resolved reviews', '已解决评审')}: ${artifactPane.reviewLifecycle.resolvedReviewCount}`,
    ];
    if (artifactPane.reviewLifecycle.latestReviewId) {
      lines.push(
        `${this.localizer.localizeText('Latest lifecycle record', '最新生命周期记录')}: ${artifactPane.reviewLifecycle.latestReviewId}`,
      );
    }
    if (artifactPane.reviewLifecycle.latestLifecycleStatus) {
      lines.push(
        `${this.localizer.localizeText('Latest lifecycle status', '最新生命周期状态')}: ${artifactPane.reviewLifecycle.latestLifecycleStatus}`,
      );
    }
    for (const review of artifactPane.reviews.slice(0, 3)) {
      lines.push(
        `${review.title} (${review.lifecycleStatus})${review.scope ? ` · ${review.scope}` : ''}`,
      );
    }

    return lines;
  }

  private buildPolicyTraceLines(
    artifactPane: NonNullable<VsCodeExtensionReviewDetailSnapshot['artifactPane']>,
  ): string[] {
    if (!artifactPane.policyTrace) {
      return [];
    }

    const lines = [
      `${this.localizer.localizeText('Execution status', '执行状态')}: ${this.localizeExecutionStatus(artifactPane.policyTrace.executionStatus)}`,
      `${this.localizer.localizeText('Pending HITL', '待处理 HITL')}: ${artifactPane.policyTrace.pendingHitl ? this.localizer.localizeText('Yes', '是') : this.localizer.localizeText('No', '否')}`,
      `${this.localizer.localizeText('Recovery capable', '可恢复')}: ${artifactPane.policyTrace.recoveryCapable ? this.localizer.localizeText('Yes', '是') : this.localizer.localizeText('No', '否')}`,
    ];
    if (artifactPane.policyTrace.currentStageId) {
      lines.push(
        `${this.localizer.localizeText('Current stage', '当前阶段')}: ${artifactPane.policyTrace.currentStageId}`,
      );
    }
    if (artifactPane.policyTrace.latestEventType) {
      lines.push(
        `${this.localizer.localizeText('Latest event type', '最新事件类型')}: ${artifactPane.policyTrace.latestEventType}`,
      );
    }
    if (artifactPane.policyTrace.reviewDocumentPath) {
      lines.push(
        `${this.localizer.localizeText('Review document backlink', '评审文档回链')}: ${artifactPane.policyTrace.reviewDocumentPath}`,
      );
    }

    return lines;
  }

  private buildEvidenceBacklinkLines(
    artifactPane: NonNullable<VsCodeExtensionReviewDetailSnapshot['artifactPane']>,
  ): string[] {
    const lines: string[] = [];
    if (artifactPane.evidenceBacklinks.governanceWorkspacePath) {
      lines.push(
        `${this.localizer.localizeText('Governance workspace', '治理工作区')}: ${artifactPane.evidenceBacklinks.governanceWorkspacePath}`,
      );
    }
    lines.push(
      `${this.localizer.localizeText('Artifact backlinks', '产物回链')}: ${artifactPane.evidenceBacklinks.artifactPaths.length}`,
      `${this.localizer.localizeText('Review backlinks', '评审回链')}: ${artifactPane.evidenceBacklinks.reviewPaths.length}`,
      `${this.localizer.localizeText('Transcript backlinks', '转录回链')}: ${artifactPane.evidenceBacklinks.transcriptEntryIds.length}`,
    );
    for (const artifactPath of artifactPane.evidenceBacklinks.artifactPaths.slice(0, 3)) {
      lines.push(`${this.localizer.localizeText('Artifact path', '产物路径')}: ${artifactPath}`);
    }
    for (const reviewPath of artifactPane.evidenceBacklinks.reviewPaths.slice(0, 3)) {
      lines.push(`${this.localizer.localizeText('Review path', '评审路径')}: ${reviewPath}`);
    }

    return lines;
  }

  private buildAutomationQueueSummaryNodes(
    entry: OrchestrationGovernanceQueueEntry,
    request: VsCodeExtensionCommandRequest,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    const nodes: VsCodeExtensionTreeNodeDescriptor[] = [
      {
        nodeId: `${entry.queueEntryId}:queue-kind`,
        label: this.localizer.localizeText('Queue kind', '队列类型'),
        description: this.localizeQueueKind(entry.queueKind),
        tooltip: this.getAutomationQueueTooltip(entry),
        themeIconId: 'list-tree',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: request,
      },
      {
        nodeId: `${entry.queueEntryId}:execution-status`,
        label: this.localizer.localizeText('Execution status', '执行状态'),
        description: entry.executionStatus
          ? this.localizeExecutionStatus(entry.executionStatus)
          : this.localizer.localizeText('Unavailable', '不可用'),
        tooltip:
          entry.executionId ?? this.localizer.localizeText('Execution unavailable', '执行不可用'),
        themeIconId: 'history',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: request,
      },
      {
        nodeId: `${entry.queueEntryId}:follow-up`,
        label: this.localizer.localizeText('Follow-up SLA', '跟进 SLA'),
        description: this.localizeFollowUpState(entry.followUpSlaState),
        tooltip:
          entry.followUpDueAt ??
          this.localizer.localizeText('No due time recorded yet.', '暂时没有记录到截止时间。'),
        themeIconId: this.getFollowUpIconId(entry.followUpSlaState),
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: request,
      },
      {
        nodeId: `${entry.queueEntryId}:workspace`,
        label: this.localizer.localizeText('Workspace root', '工作区根目录'),
        description: entry.workspaceRoot,
        tooltip: entry.workspaceRoot,
        themeIconId: 'folder-library',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: request,
      },
    ];

    if (entry.projectId) {
      nodes.push({
        nodeId: `${entry.queueEntryId}:project`,
        label: this.localizer.localizeText('Project', '项目'),
        description: entry.projectId,
        tooltip: entry.projectId,
        themeIconId: 'briefcase',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: request,
      });
    }
    if (entry.sprintId) {
      nodes.push({
        nodeId: `${entry.queueEntryId}:sprint`,
        label: this.localizer.localizeText('Sprint', '迭代'),
        description: entry.sprintId,
        tooltip: entry.sprintId,
        themeIconId: 'list-tree',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: request,
      });
    }

    return nodes;
  }

  private buildProjectedWorkspaceNodes(
    entries: readonly OrchestrationGovernanceWorkspaceSummary[],
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    return entries.map((entry, index) => ({
      nodeId: `workspace-summary:${entry.workspaceId}:${index}`,
      label: entry.workspaceId,
      description: this.localizer.localizeText(
        `${entry.activeExecutionCount} active · ${entry.reviewQueueCount} review · ${entry.automationInboxCount} automation`,
        `${entry.activeExecutionCount} 活跃 · ${entry.reviewQueueCount} 评审 · ${entry.automationInboxCount} 自动化`,
      ),
      tooltip: this.getWorkspaceSummaryTooltip(entry),
      themeIconId: entry.activeExecutionCount > 0 ? 'organization' : 'folder-opened',
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      resourceUriPath: entry.workspaceRoot,
    }));
  }

  private buildParallelLaneNodes(
    entries: readonly OrchestrationGovernanceParallelLaneEntry[],
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    return entries.map((entry) => ({
      nodeId: `parallel-lane:${entry.laneId}`,
      label: entry.laneId,
      description: this.localizer.localizeText(
        `${entry.activeExecutionCount} active · ${entry.pendingHitlCount} pending HITL`,
        `${entry.activeExecutionCount} 活跃 · ${entry.pendingHitlCount} 个待处理 HITL`,
      ),
      tooltip: [
        `${this.localizer.localizeText('Workspace', '工作区')}: ${entry.workspaceRoot}`,
        `${this.localizer.localizeText('Running executions', '运行中执行')}: ${entry.runningExecutionCount}`,
        `${this.localizer.localizeText('Interrupted', '已中断')}: ${entry.interruptedCount}`,
        `${this.localizer.localizeText('Attention level', '关注级别')}: ${this.localizeAttentionLevel(entry.attentionLevel)}`,
      ].join('\n'),
      themeIconId:
        entry.attentionLevel === OrchestrationGovernanceAttentionLevel.CRITICAL
          ? 'error'
          : entry.attentionLevel === OrchestrationGovernanceAttentionLevel.WARNING
            ? 'warning'
            : 'pass-filled',
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
    }));
  }

  private buildTemporaryBridgeNodes(
    entries: readonly OrchestrationGovernanceTemporaryBridgeEntry[],
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    return entries.map((entry) => {
      const request = {
        executionId: undefined,
        executionSessionId: undefined,
        reviewSourcePath: undefined,
        queueEntry: undefined,
        temporaryBridge: entry,
      } satisfies VsCodeExtensionCommandRequest;

      return {
        nodeId: entry.bridgeId,
        label: this.localizeTemporaryBridgeCapability(entry.capabilityClass),
        description: this.localizer.localizeText(
          `${this.localizeTemporaryBridgeReceiptKind(entry.receiptKind)} -> ${this.localizeTemporaryBridgeBacklinkSurface(entry.backlinkSurface)}`,
          `${this.localizeTemporaryBridgeReceiptKind(entry.receiptKind)} -> ${this.localizeTemporaryBridgeBacklinkSurface(entry.backlinkSurface)}`,
        ),
        tooltip: entry.previewCommandLine,
        themeIconId: 'terminal',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.HANDOFF_ACTION,
        selectionRequest: request,
        command: this.createCommandDescriptor(
          VSCODE_EXTENSION_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE,
          'Run Governor repository operation',
          '运行 Governor 仓库操作',
          request,
        ),
        children: [
          {
            nodeId: `${entry.bridgeId}:preview`,
            label: this.localizer.localizeText('Command preview', '命令预览'),
            description: entry.previewCommandLine,
            tooltip: entry.previewCommandLine,
            themeIconId: 'terminal',
            contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
            selectionRequest: request,
          },
          {
            nodeId: `${entry.bridgeId}:receipt`,
            label: this.localizer.localizeText('Receipt contract', '回执契约'),
            description: this.localizeTemporaryBridgeReceiptKind(entry.receiptKind),
            tooltip: this.localizer.localizeText(
              'Temporary bridge execution must emit the declared receipt artifact.',
              '临时 bridge 执行后必须产出声明的 receipt 产物。',
            ),
            themeIconId: 'note',
            contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
            selectionRequest: request,
          },
          {
            nodeId: `${entry.bridgeId}:backlink`,
            label: this.localizer.localizeText('Backlink surface', '回链面'),
            description: this.localizeTemporaryBridgeBacklinkSurface(entry.backlinkSurface),
            tooltip: this.localizer.localizeText(
              'Bridge receipts must remain discoverable from the declared governed surface.',
              'bridge receipt 必须能从声明的受治理表面中被发现。',
            ),
            themeIconId: 'link',
            contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
            selectionRequest: request,
          },
          ...entry.exitCriteria.map((criterion, index) => ({
            nodeId: `${entry.bridgeId}:exit-criterion:${index + 1}`,
            label: this.localizer.localizeText('Exit criterion', '退出条件'),
            description: this.localizeTemporaryBridgeExitCriterion(criterion),
            tooltip: this.localizer.localizeText(
              'The bridge should retire once this criterion is satisfied.',
              '满足该条件后，这个 bridge 就应当退场。',
            ),
            themeIconId: 'checklist',
            contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
            selectionRequest: request,
          })),
        ],
      };
    });
  }

  private buildTaskBoardSummaryNodes(
    execution: OrchestrationExecutionSummary,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    const nodes: VsCodeExtensionTreeNodeDescriptor[] = [
      {
        nodeId: `${execution.executionId}:status`,
        label: this.localizer.localizeText('Status', '状态'),
        description: this.localizeExecutionStatus(execution.status),
        tooltip: execution.latestEventType ?? execution.executionId,
        themeIconId: 'info',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: {
          executionId: execution.executionId,
          executionSessionId: execution.executionSessionId,
        },
      },
      {
        nodeId: `${execution.executionId}:stage`,
        label: this.localizer.localizeText('Workflow stage', '工作流阶段'),
        description:
          execution.currentStageId ??
          this.localizer.localizeText('Stage unavailable', '阶段不可用'),
        tooltip: this.localizer.localizeText(
          'Service-owned workflow stage progress for the selected task/execution.',
          '所选任务或执行对应的 service-owned 工作流阶段进度。',
        ),
        themeIconId: 'git-merge',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: {
          executionId: execution.executionId,
          executionSessionId: execution.executionSessionId,
        },
      },
      {
        nodeId: `${execution.executionId}:event`,
        label: this.localizer.localizeText('Latest event', '最近事件'),
        description:
          execution.latestEventType ?? this.localizer.localizeText('No event yet', '尚无事件'),
        tooltip:
          execution.lastEventAt ??
          this.localizer.localizeText('Timestamp unavailable', '时间戳不可用'),
        themeIconId: 'history',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: {
          executionId: execution.executionId,
          executionSessionId: execution.executionSessionId,
        },
      },
    ];

    if (execution.projectId) {
      nodes.push({
        nodeId: `${execution.executionId}:project`,
        label: this.localizer.localizeText('Project', '项目'),
        description: execution.projectId,
        tooltip: execution.projectId,
        themeIconId: 'briefcase',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: {
          executionId: execution.executionId,
          executionSessionId: execution.executionSessionId,
        },
      });
    }
    if (execution.sprintId) {
      nodes.push({
        nodeId: `${execution.executionId}:sprint`,
        label: this.localizer.localizeText('Sprint', '迭代'),
        description: execution.sprintId,
        tooltip: execution.sprintId,
        themeIconId: 'list-tree',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: {
          executionId: execution.executionId,
          executionSessionId: execution.executionSessionId,
        },
      });
    }

    return nodes;
  }

  private buildReviewQueueSummaryNodes(
    entry: OrchestrationGovernanceQueueEntry,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    return [
      {
        nodeId: `${entry.queueEntryId}:lifecycle`,
        label: this.localizer.localizeText('Review lifecycle', '评审生命周期'),
        description:
          entry.reviewLifecycleStatus ?? this.localizer.localizeText('Unavailable', '不可用'),
        tooltip: this.getReviewQueueTooltip(entry),
        themeIconId: 'history',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: this.createReviewQueueRequest(entry),
      },
      {
        nodeId: `${entry.queueEntryId}:follow-up`,
        label: this.localizer.localizeText('Follow-up SLA', '跟进 SLA'),
        description: this.localizeFollowUpState(entry.followUpSlaState),
        tooltip:
          entry.followUpDueAt ??
          this.localizer.localizeText('No due time recorded yet.', '暂时没有记录到截止时间。'),
        themeIconId: this.getFollowUpIconId(entry.followUpSlaState),
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: this.createReviewQueueRequest(entry),
      },
      {
        nodeId: `${entry.queueEntryId}:source`,
        label: this.localizer.localizeText('Review source', '评审来源'),
        description:
          entry.reviewFilePath ??
          this.localizer.localizeText('No review file backlink', '暂无评审文件回链'),
        tooltip:
          entry.reviewFilePath ??
          this.localizer.localizeText(
            'This queue item does not currently expose a review file backlink.',
            '当前队列项暂时没有暴露评审文件回链。',
          ),
        themeIconId: 'note',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: this.createReviewQueueRequest(entry),
        ...(entry.reviewFilePath
          ? {
              resourceUriPath: entry.reviewFilePath,
            }
          : {}),
      },
    ];
  }

  private buildReviewQueueActionNodes(
    entry: OrchestrationGovernanceQueueEntry,
    request: VsCodeExtensionCommandRequest,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    const nodes: VsCodeExtensionTreeNodeDescriptor[] = [];
    if (entry.reviewFilePath) {
      nodes.push({
        nodeId: `${entry.queueEntryId}:open-review-document`,
        label: this.localizer.localizeText('Open review document', '打开评审文档'),
        description: this.localizer.localizeText('Canonical review backlink', '规范评审回链'),
        tooltip: entry.reviewFilePath,
        themeIconId: 'go-to-file',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.HANDOFF_ACTION,
        selectionRequest: request,
        resourceUriPath: entry.reviewFilePath,
        command: this.createCommandDescriptor(
          VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET,
          'Open review document',
          '打开评审文档',
          request,
        ),
      });
    }

    if (entry.executionId && entry.executionStatus) {
      nodes.push(...this.buildQueueEntryActionNodes(entry, request));
    }

    return nodes;
  }

  private buildActionNodes(
    entry: OrchestrationExecutionBoardEntry | OrchestrationHitlInboxEntry,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    const nodes: VsCodeExtensionTreeNodeDescriptor[] = [];

    for (const action of entry.actions) {
      if (action.actionKind === OrchestrationGovernanceActionKind.OPEN_HANDOFF_TARGET) {
        continue;
      }

      if (action.actionKind === OrchestrationGovernanceActionKind.SUBMIT_HITL_DECISION) {
        if (action.enabled && action.hitlDecisionOptions) {
          for (const option of action.hitlDecisionOptions) {
            const request = {
              ...this.createExecutionRequest(entry),
              hitlDecisionOption: option,
            } satisfies VsCodeExtensionCommandRequest;
            nodes.push({
              nodeId: option.optionId,
              label: this.getHitlDecisionLabel(option.decision, option.resumeAction),
              description: this.localizer.localizeText('Submit HITL decision', '提交 HITL 决策'),
              tooltip: this.localizer.localizeText(
                'Replays a human decision back into the orchestration runtime.',
                '将人工决策回灌到编排运行时。',
              ),
              themeIconId: 'pass-filled',
              contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.HITL_ACTION,
              selectionRequest: request,
              command: this.createCommandDescriptor(
                VSCODE_EXTENSION_COMMAND_IDS.SUBMIT_HITL_DECISION,
                'Submit HITL decision',
                '提交 HITL 决策',
                request,
              ),
            });
          }
        } else {
          nodes.push(this.createDisabledActionNode(action, entry));
        }
        continue;
      }

      nodes.push(this.createActionNode(action, entry));
    }

    return nodes;
  }

  private buildHandoffNodes(
    entry: OrchestrationExecutionBoardEntry | OrchestrationHitlInboxEntry,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    return entry.handoffTargets.map((target) => {
      const request = {
        ...this.createExecutionRequest(entry),
        handoffTarget: target,
      } satisfies VsCodeExtensionCommandRequest;
      return {
        nodeId: target.targetId,
        label: this.getHandoffLabel(target.targetKind),
        description: target.targetPath,
        tooltip:
          target.targetPath ?? this.localizer.localizeText('Target unavailable', '目标不可用'),
        themeIconId: this.getHandoffIconId(target),
        contextValue: target.exists
          ? VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.HANDOFF_ACTION
          : VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
        selectionRequest: request,
        ...(target.targetPath
          ? {
              resourceUriPath: target.targetPath,
            }
          : {}),
        ...(target.exists && target.targetPath
          ? {
              command: this.createCommandDescriptor(
                VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET,
                'Open handoff target',
                '打开交接目标',
                request,
              ),
            }
          : {}),
      };
    });
  }

  private buildQueueEntryActionNodes(
    entry: OrchestrationGovernanceQueueEntry,
    request: VsCodeExtensionCommandRequest,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    const nodes: VsCodeExtensionTreeNodeDescriptor[] = [];

    for (const action of entry.actions) {
      if (action.actionKind === OrchestrationGovernanceActionKind.OPEN_HANDOFF_TARGET) {
        continue;
      }
      if (!action.enabled) {
        nodes.push(this.createDisabledQueueActionNode(action, request));
        continue;
      }

      const actionLabels = this.getActionCommandLabels(action.actionKind);
      nodes.push({
        nodeId: `${entry.queueEntryId}:${action.actionId}`,
        label: actionLabels.label,
        description: this.localizer.localizeText('Service-backed action', '服务托管动作'),
        tooltip: action.requiresConfirmation
          ? this.localizer.localizeText(
              'This action requires confirmation before execution.',
              '该动作执行前需要确认。',
            )
          : this.localizer.localizeText(
              'Runs through the service command seam.',
              '通过服务命令接缝执行。',
            ),
        themeIconId: actionLabels.iconId,
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.REVIEW_ACTION,
        selectionRequest: request,
        command: this.createCommandDescriptor(
          actionLabels.commandId,
          actionLabels.englishTitle,
          actionLabels.chineseTitle,
          request,
        ),
      });
    }

    return nodes;
  }

  private buildQueueEntryHandoffNodes(
    entry: OrchestrationGovernanceQueueEntry,
    request: VsCodeExtensionCommandRequest,
  ): readonly VsCodeExtensionTreeNodeDescriptor[] {
    return entry.handoffTargets.map((target) => ({
      nodeId: `${entry.queueEntryId}:${target.targetId}`,
      label: this.getHandoffLabel(target.targetKind),
      description: target.targetPath,
      tooltip: target.targetPath ?? this.localizer.localizeText('Target unavailable', '目标不可用'),
      themeIconId: this.getHandoffIconId(target),
      contextValue: target.exists
        ? VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.HANDOFF_ACTION
        : VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
      selectionRequest: {
        ...request,
        handoffTarget: target,
      },
      ...(target.targetPath
        ? {
            resourceUriPath: target.targetPath,
          }
        : {}),
      ...(target.exists && target.targetPath
        ? {
            command: this.createCommandDescriptor(
              VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET,
              'Open handoff target',
              '打开交接目标',
              {
                ...request,
                handoffTarget: target,
              },
            ),
          }
        : {}),
    }));
  }

  private buildUserConfigAuthoringNode(
    secureAuthoring?: VsCodeExtensionSecureAuthoringSnapshot,
  ): VsCodeExtensionTreeNodeDescriptor {
    const degradedReason = secureAuthoring?.degradedReason;
    const userConfig = secureAuthoring?.userConfig;
    const remoteApiEntries =
      userConfig?.entries.filter((entry) => entry.keyPath.startsWith('tools.')) ?? [];

    return {
      nodeId: 'user-default-authoring',
      label: this.localizer.localizeText('User-local defaults', '用户本地默认值'),
      description: degradedReason
        ? this.localizer.localizeText('Degraded', '已降级')
        : userConfig && userConfig.entries.length > 0
          ? this.localizer.localizeText(
              `${userConfig.entries.length} configured value(s)`,
              `${userConfig.entries.length} 个已配置值`,
            )
          : this.localizer.localizeText('No configured default yet', '当前还没有已配置默认值'),
      tooltip: degradedReason
        ? degradedReason
        : this.localizer.localizeText(
            'User-local defaults stay on the canonical user-config.yaml surface. Explicit CLI args and workspace governor.yaml still override these values.',
            '用户本地默认值始终写入 canonical user-config.yaml；显式 CLI 参数和工作区 governor.yaml 仍然拥有更高优先级。',
          ),
      themeIconId: degradedReason ? 'warning' : 'settings-gear',
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      children: degradedReason
        ? [
            this.createInfoNode(
              'user-default-authoring-degraded',
              'Embedded config diagnostics are temporarily unavailable.',
              '内嵌 config 诊断暂时不可用。',
            ),
          ]
        : [
            {
              nodeId: 'user-default-authoring:config-path',
              label: this.localizer.localizeText('Canonical config path', 'Canonical 配置路径'),
              description: userConfig?.configPath,
              tooltip: userConfig?.configPath,
              themeIconId: 'go-to-file',
              contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
              ...(userConfig?.configPath
                ? {
                    resourceUriPath: userConfig.configPath,
                    command: this.createCommandDescriptor(
                      VSCODE_EXTENSION_COMMAND_IDS.OPEN_USER_CONFIG,
                      'Open canonical user-config',
                      '打开 canonical user-config',
                    ),
                  }
                : {}),
            },
            {
              nodeId: 'user-default-authoring:theme',
              label: this.localizer.localizeText('React theme default', 'React 主题默认值'),
              description:
                userConfig?.themePreference ?? this.localizer.localizeText('Unset', '未设置'),
              tooltip: this.localizer.localizeText(
                'Controls the global React-shell theme fallback when no higher-precedence override is present.',
                '当不存在更高优先级覆盖时，这里控制全局 React shell 主题回退值。',
              ),
              themeIconId: 'symbol-color',
              contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
            },
            {
              nodeId: 'user-default-authoring:workspace-mode',
              label: this.localizer.localizeText('Workspace mode preference', '工作区模式偏好'),
              description:
                userConfig?.workspaceModePreference ??
                this.localizer.localizeText('Unset', '未设置'),
              tooltip: this.localizer.localizeText(
                'Lets VS Code surface the user-local fallback for tool-managed versus repo-local workspace mode.',
                '让 VS Code 显示 tool-managed 与 repo-local 工作区模式的用户本地回退偏好。',
              ),
              themeIconId: 'repo',
              contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
            },
            {
              nodeId: 'user-default-authoring:remote-api-defaults',
              label: this.localizer.localizeText('Remote API defaults', 'Remote API 默认值'),
              description:
                remoteApiEntries.length > 0
                  ? this.localizer.localizeText(
                      `${remoteApiEntries.length} configured entry(s)`,
                      `${remoteApiEntries.length} 个已配置项`,
                    )
                  : this.localizer.localizeText('No tool default yet', '当前还没有工具默认值'),
              tooltip: this.localizer.localizeText(
                'Tool-scoped remote API defaults stay in user-config.yaml so host surfaces can author them without creating a second runtime truth.',
                '工具级 remote API 默认值始终保留在 user-config.yaml 中，这样宿主 surface 可以编写它们，而不会制造第二份 runtime 真值。',
              ),
              themeIconId: remoteApiEntries.length > 0 ? 'plug' : 'circle-slash',
              contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
              children:
                remoteApiEntries.length > 0
                  ? remoteApiEntries.map((entry) => ({
                      nodeId: `user-default-authoring:remote-api:${entry.keyPath}`,
                      label: entry.keyPath,
                      description: entry.value,
                      tooltip: `${entry.keyPath}=${entry.value}`,
                      themeIconId: entry.keyPath.endsWith('.credentialRef') ? 'key' : 'settings',
                      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
                      selectionRequest: {
                        userConfigKeyPath: entry.keyPath,
                      },
                      command: this.createCommandDescriptor(
                        VSCODE_EXTENSION_COMMAND_IDS.CONFIGURE_USER_DEFAULT,
                        'Configure user-local default',
                        '配置用户本地默认值',
                        {
                          userConfigKeyPath: entry.keyPath,
                        },
                      ),
                    }))
                  : [
                      this.createInfoNode(
                        'user-default-authoring:remote-api-empty',
                        'Use the configure-default action to seed remote API defaults for one tool.',
                        '使用 configure-default 动作为某个工具写入 remote API 默认值。',
                      ),
                    ],
            },
            this.createInfoNode(
              'user-default-authoring:precedence-boundary',
              'Precedence boundary: explicit CLI args and workspace governor.yaml stay above user-config defaults.',
              '优先级边界：显式 CLI 参数和工作区 governor.yaml 始终高于 user-config 默认值。',
            ),
            this.createWorkbenchActionNode(
              'user-default-authoring:configure',
              'Configure user-local default',
              '配置用户本地默认值',
              'Theme, workspace mode, and remote API defaults',
              '主题、工作区模式与 Remote API 默认值',
              VSCODE_EXTENSION_COMMAND_IDS.CONFIGURE_USER_DEFAULT,
            ),
            this.createWorkbenchActionNode(
              'user-default-authoring:open-config',
              'Open canonical user-config',
              '打开 canonical user-config',
              userConfig?.configExists
                ? 'Open the current canonical user-config file.'
                : 'Open the canonical user-config surface when it already exists.',
              userConfig?.configExists
                ? '打开当前 canonical user-config 文件。'
                : '当 canonical user-config 已存在时打开它。',
              VSCODE_EXTENSION_COMMAND_IDS.OPEN_USER_CONFIG,
            ),
          ],
    };
  }

  private buildSecretReadinessNode(
    secureAuthoring?: VsCodeExtensionSecureAuthoringSnapshot,
  ): VsCodeExtensionTreeNodeDescriptor {
    const degradedReason = secureAuthoring?.degradedReason;
    const secretReadiness = secureAuthoring?.secretReadiness;
    const availableBackends =
      secretReadiness?.backends.filter((backend) => backend.available) ?? [];
    const warningBearingBackends =
      secretReadiness?.backends.filter((backend) => backend.available && backend.warning) ?? [];

    return {
      nodeId: 'secret-readiness',
      label: this.localizer.localizeText('Secret readiness', 'Secret Readiness'),
      description: degradedReason
        ? this.localizer.localizeText('Degraded', '已降级')
        : warningBearingBackends.length > 0
          ? this.localizer.localizeText('Warning', '有警告')
          : secretReadiness && secretReadiness.unresolvedCredentialRefs.length > 0
            ? this.localizer.localizeText(
                `${secretReadiness.unresolvedCredentialRefs.length} unresolved selector(s)`,
                `${secretReadiness.unresolvedCredentialRefs.length} 个未解析 selector`,
              )
            : availableBackends.length > 0
              ? this.localizer.localizeText('Ready', '已就绪')
              : this.localizer.localizeText('No writable backend', '没有可写 backend'),
      tooltip: degradedReason
        ? degradedReason
        : this.localizer.localizeText(
            'Managed secrets stay in the backend only. user-config.yaml and governor.yaml keep selectors such as secret://... instead of plaintext values.',
            '受管 secret 始终只留在 backend 中；user-config.yaml 和 governor.yaml 只保留 secret://... 这样的 selector，而不会写入明文值。',
          ),
      themeIconId: degradedReason
        ? 'warning'
        : warningBearingBackends.length > 0
          ? 'warning'
          : secretReadiness && secretReadiness.unresolvedCredentialRefs.length > 0
            ? 'warning'
            : availableBackends.length > 0
              ? 'key'
              : 'circle-slash',
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      children: degradedReason
        ? [
            this.createInfoNode(
              'secret-readiness-degraded',
              'Embedded secret diagnostics are temporarily unavailable.',
              '内嵌 secret 诊断暂时不可用。',
            ),
          ]
        : [
            {
              nodeId: 'secret-readiness:selected-backend',
              label: this.localizer.localizeText('Selected backend', '当前选定 backend'),
              description:
                secretReadiness?.selectedBackendId ?? this.localizer.localizeText('None', '无'),
              tooltip: this.localizer.localizeText(
                'The selected backend is the current write target after CLI overrides and default-resolution rules are applied.',
                '选定 backend 表示在应用 CLI 覆盖和默认解析规则之后，当前的写入目标。',
              ),
              themeIconId: 'key',
              contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
            },
            {
              nodeId: 'secret-readiness:default-backend',
              label: this.localizer.localizeText('Default backend', '默认 backend'),
              description:
                secretReadiness?.defaultBackendId ?? this.localizer.localizeText('None', '无'),
              tooltip: this.localizer.localizeText(
                'The default backend should prefer OS keychain support when it is available.',
                '默认 backend 应该在可用时优先选择 OS keychain。',
              ),
              themeIconId: 'shield',
              contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
            },
            {
              nodeId: 'secret-readiness:index-path',
              label: this.localizer.localizeText('Managed index path', '受管索引路径'),
              description: secretReadiness?.indexPath,
              tooltip: secretReadiness?.indexPath,
              themeIconId: 'database',
              contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
              ...(secretReadiness?.indexPath
                ? {
                    resourceUriPath: secretReadiness.indexPath,
                  }
                : {}),
            },
            {
              nodeId: 'secret-readiness:selectors',
              label: this.localizer.localizeText('Configured selectors', '已配置 selector'),
              description:
                secretReadiness && secretReadiness.configuredCredentialRefs.length > 0
                  ? this.localizer.localizeText(
                      `${secretReadiness.configuredCredentialRefs.length} selector(s)`,
                      `${secretReadiness.configuredCredentialRefs.length} 个 selector`,
                    )
                  : this.localizer.localizeText('None yet', '当前没有'),
              tooltip: this.localizer.localizeText(
                'These selectors are referenced by user-local remote API defaults.',
                '这些 selector 当前被用户本地 remote API 默认值引用。',
              ),
              themeIconId:
                secretReadiness && secretReadiness.configuredCredentialRefs.length > 0
                  ? 'link'
                  : 'circle-slash',
              contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
              children:
                secretReadiness && secretReadiness.configuredCredentialRefs.length > 0
                  ? secretReadiness.configuredCredentialRefs.map((selector) => ({
                      nodeId: `secret-readiness:selector:${selector}`,
                      label: selector,
                      description: secretReadiness.unresolvedCredentialRefs.includes(selector)
                        ? this.localizer.localizeText('Missing backend value', '缺少 backend 值')
                        : this.localizer.localizeText('Resolved', '已解析'),
                      tooltip: selector,
                      themeIconId: secretReadiness.unresolvedCredentialRefs.includes(selector)
                        ? 'warning'
                        : 'pass-filled',
                      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
                      ...(this.extractManagedSecretKeyName(selector)
                        ? {
                            selectionRequest: {
                              secretKeyName: this.extractManagedSecretKeyName(selector),
                            },
                            command: this.createCommandDescriptor(
                              VSCODE_EXTENSION_COMMAND_IDS.SET_MANAGED_SECRET,
                              'Set managed secret',
                              '设置受管 secret',
                              {
                                secretKeyName: this.extractManagedSecretKeyName(selector),
                              },
                            ),
                          }
                        : {}),
                    }))
                  : [
                      this.createInfoNode(
                        'secret-readiness:selectors-empty',
                        'No user-local credentialRef selector is configured yet.',
                        '当前还没有已配置的用户本地 credentialRef selector。',
                      ),
                    ],
            },
            {
              nodeId: 'secret-readiness:backend-availability',
              label: this.localizer.localizeText('Backend availability', 'Backend 可用性'),
              description:
                secretReadiness && secretReadiness.backends.length > 0
                  ? this.localizer.localizeText(
                      `${secretReadiness.backends.length} backend probe(s)`,
                      `${secretReadiness.backends.length} 个 backend 探测`,
                    )
                  : this.localizer.localizeText('No backend status', '没有 backend 状态'),
              tooltip: this.localizer.localizeText(
                'Warnings stay visible here so unsafe-local fallback never looks equivalent to the default OS-backed path.',
                '这里会保留 warning，从而确保 unsafe-local fallback 不会看起来与默认 OS-backed 路径等价。',
              ),
              themeIconId: secretReadiness?.backends.some((backend) => backend.available)
                ? 'key'
                : 'circle-slash',
              contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
              children:
                secretReadiness && secretReadiness.backends.length > 0
                  ? secretReadiness.backends.map((backend) => ({
                      nodeId: `secret-readiness:backend:${backend.backendId}`,
                      label: backend.backendId,
                      description: backend.warning
                        ? this.localizer.localizeText('Available with warning', '可用但有警告')
                        : backend.available
                          ? this.localizer.localizeText('Available', '可用')
                          : this.localizer.localizeText('Unavailable', '不可用'),
                      tooltip: backend.warning
                        ? `${backend.detail}\n${backend.warning}`
                        : backend.detail,
                      themeIconId: backend.warning
                        ? 'warning'
                        : backend.available
                          ? 'pass-filled'
                          : 'warning',
                      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
                    }))
                  : [
                      this.createInfoNode(
                        'secret-readiness:backend-empty',
                        'No embedded secret backend status is available right now.',
                        '当前没有可用的内嵌 secret backend 状态。',
                      ),
                    ],
            },
            this.createWorkbenchActionNode(
              'secret-readiness:set-managed-secret',
              'Set managed secret',
              '设置受管 secret',
              'Prompt for one secret value locally, then write it through the managed backend seam.',
              '在本地安全提示一个 secret 值，然后通过受管 backend 接缝写入。',
              VSCODE_EXTENSION_COMMAND_IDS.SET_MANAGED_SECRET,
            ),
          ],
    };
  }

  private buildSecureAuthoringLines(
    secureAuthoring?: VsCodeExtensionSecureAuthoringSnapshot,
  ): readonly string[] {
    if (secureAuthoring?.degradedReason) {
      return [
        this.localizer.localizeText(
          `Authoring diagnostics are degraded: ${secureAuthoring.degradedReason}`,
          `Authoring 诊断已降级：${secureAuthoring.degradedReason}`,
        ),
      ];
    }

    const lines: string[] = [];
    if (secureAuthoring?.userConfig) {
      lines.push(
        this.localizer.localizeText(
          `Canonical user-config: ${secureAuthoring.userConfig.configPath}`,
          `Canonical user-config：${secureAuthoring.userConfig.configPath}`,
        ),
        this.localizer.localizeText(
          `Theme default: ${secureAuthoring.userConfig.themePreference ?? 'unset'}`,
          `主题默认值：${secureAuthoring.userConfig.themePreference ?? '未设置'}`,
        ),
        this.localizer.localizeText(
          `Workspace mode preference: ${secureAuthoring.userConfig.workspaceModePreference ?? 'unset'}`,
          `工作区模式偏好：${secureAuthoring.userConfig.workspaceModePreference ?? '未设置'}`,
        ),
        this.localizer.localizeText(
          `Remote API defaults: ${secureAuthoring.userConfig.entries.filter((entry) => entry.keyPath.startsWith('tools.')).length}`,
          `Remote API 默认值：${secureAuthoring.userConfig.entries.filter((entry) => entry.keyPath.startsWith('tools.')).length}`,
        ),
      );
    }
    if (secureAuthoring?.secretReadiness) {
      lines.push(
        this.localizer.localizeText(
          `Selected backend: ${secureAuthoring.secretReadiness.selectedBackendId ?? 'none'}`,
          `当前选定 backend：${secureAuthoring.secretReadiness.selectedBackendId ?? '无'}`,
        ),
        this.localizer.localizeText(
          `Default backend: ${secureAuthoring.secretReadiness.defaultBackendId ?? 'none'}`,
          `默认 backend：${secureAuthoring.secretReadiness.defaultBackendId ?? '无'}`,
        ),
        this.localizer.localizeText(
          `Configured selectors: ${secureAuthoring.secretReadiness.configuredCredentialRefs.length}`,
          `已配置 selector：${secureAuthoring.secretReadiness.configuredCredentialRefs.length}`,
        ),
        this.localizer.localizeText(
          `Unresolved selectors: ${secureAuthoring.secretReadiness.unresolvedCredentialRefs.length}`,
          `未解析 selector：${secureAuthoring.secretReadiness.unresolvedCredentialRefs.length}`,
        ),
      );
      const warningBearingBackends = secureAuthoring.secretReadiness.backends.filter(
        (backend) => backend.available && backend.warning,
      );
      if (warningBearingBackends.length > 0) {
        lines.push(
          this.localizer.localizeText(
            `Warning-bearing backends: ${warningBearingBackends.map((backend) => backend.backendId).join(', ')}`,
            `带警告的 backend：${warningBearingBackends.map((backend) => backend.backendId).join('、')}`,
          ),
        );
      }
    }

    return lines.length > 0
      ? lines
      : [
          this.localizer.localizeText(
            'No secure authoring readiness is projected yet.',
            '当前还没有投影出安全 authoring readiness。',
          ),
        ];
  }

  private createActionNode(
    action: OrchestrationGovernanceActionAffordance,
    entry: OrchestrationExecutionBoardEntry | OrchestrationHitlInboxEntry,
  ): VsCodeExtensionTreeNodeDescriptor {
    if (!action.enabled) {
      return this.createDisabledActionNode(action, entry);
    }

    const request = this.createExecutionRequest(entry);
    const actionLabels = this.getActionCommandLabels(action.actionKind);
    return {
      nodeId: action.actionId,
      label: actionLabels.label,
      description: this.localizer.localizeText('Service-backed action', '服务托管动作'),
      tooltip: action.requiresConfirmation
        ? this.localizer.localizeText(
            'This action requires confirmation before execution.',
            '该动作执行前需要确认。',
          )
        : this.localizer.localizeText(
            'Runs through the service command seam.',
            '通过服务命令接缝执行。',
          ),
      themeIconId: actionLabels.iconId,
      contextValue:
        action.actionKind === OrchestrationGovernanceActionKind.RECOVER_EXECUTION
          ? VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.HITL_ACTION
          : VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.REVIEW_ACTION,
      selectionRequest: request,
      command: this.createCommandDescriptor(
        actionLabels.commandId,
        actionLabels.englishTitle,
        actionLabels.chineseTitle,
        request,
      ),
    };
  }

  private createDisabledActionNode(
    action: OrchestrationGovernanceActionAffordance,
    entry: OrchestrationExecutionBoardEntry | OrchestrationHitlInboxEntry,
  ): VsCodeExtensionTreeNodeDescriptor {
    return {
      nodeId: `${action.actionId}:disabled`,
      label: this.getDisabledActionLabel(action.actionKind),
      description: action.disabledReason
        ? this.localizeDisabledReason(action.disabledReason)
        : this.localizer.localizeText('Unavailable', '不可用'),
      tooltip: this.localizer.localizeText(
        'This service-owned action is currently disabled.',
        '当前这个 service-owned 动作不可用。',
      ),
      themeIconId: 'lock',
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
      selectionRequest: this.createExecutionRequest(entry),
    };
  }

  private createExecutionRequest(
    entry: OrchestrationExecutionBoardEntry | OrchestrationHitlInboxEntry,
  ): VsCodeExtensionCommandRequest {
    return {
      executionId: entry.execution.executionId,
      executionSessionId: entry.execution.executionSessionId,
      reviewSourcePath: undefined,
      queueEntry: undefined,
    };
  }

  private createReviewQueueRequest(
    entry: OrchestrationGovernanceQueueEntry,
  ): VsCodeExtensionCommandRequest {
    return {
      executionId: entry.executionId,
      executionSessionId: undefined,
      reviewSourcePath: entry.reviewFilePath,
      queueEntry: entry,
    };
  }

  private createAutomationQueueRequest(
    entry: OrchestrationGovernanceQueueEntry,
  ): VsCodeExtensionCommandRequest {
    return {
      executionId: entry.executionId,
      executionSessionId: undefined,
      reviewSourcePath: undefined,
      queueEntry: entry,
    };
  }

  private createDisabledQueueActionNode(
    action: OrchestrationGovernanceActionAffordance,
    request: VsCodeExtensionCommandRequest,
  ): VsCodeExtensionTreeNodeDescriptor {
    return {
      nodeId: `${action.actionId}:disabled`,
      label: this.getDisabledActionLabel(action.actionKind),
      description: action.disabledReason
        ? this.localizeDisabledReason(action.disabledReason)
        : this.localizer.localizeText('Unavailable', '不可用'),
      tooltip: this.localizer.localizeText(
        'This service-owned action is currently disabled.',
        '当前这个 service-owned 动作不可用。',
      ),
      themeIconId: 'lock',
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
      selectionRequest: request,
    };
  }

  private createCommandDescriptor(
    command: string,
    englishTitle: string,
    chineseTitle: string,
    request?: VsCodeExtensionCommandRequest,
  ) {
    return {
      command,
      title: this.localizer.localizeText(englishTitle, chineseTitle),
      ...(request
        ? {
            arguments: [request],
          }
        : {}),
    };
  }

  private extractManagedSecretKeyName(selector: string): string | undefined {
    if (!selector.startsWith(VSCODE_EXTENSION_SECRET_SELECTOR_PREFIX)) {
      return undefined;
    }

    const keyName = selector.slice(VSCODE_EXTENSION_SECRET_SELECTOR_PREFIX.length).trim();
    return keyName.length > 0 ? keyName : undefined;
  }

  private createWorkbenchActionNode(
    nodeId: string,
    englishLabel: string,
    chineseLabel: string,
    englishDescription: string,
    chineseDescription: string,
    commandId: string,
    request?: VsCodeExtensionCommandRequest,
  ): VsCodeExtensionTreeNodeDescriptor {
    return {
      nodeId,
      label: this.localizer.localizeText(englishLabel, chineseLabel),
      description: this.localizer.localizeText(englishDescription, chineseDescription),
      tooltip: this.localizer.localizeText(englishDescription, chineseDescription),
      themeIconId: 'play-circle',
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
      ...(request
        ? {
            selectionRequest: request,
          }
        : {}),
      command: this.createCommandDescriptor(commandId, englishLabel, chineseLabel, request),
    };
  }

  private createInfoNode(
    nodeId: string,
    englishLabel: string,
    chineseLabel: string,
  ): VsCodeExtensionTreeNodeDescriptor {
    return {
      nodeId,
      label: this.localizer.localizeText(englishLabel, chineseLabel),
      themeIconId: 'info',
      contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.INFO,
    };
  }

  private getExecutionPrimaryLabel(execution: OrchestrationExecutionSummary): string {
    return execution.taskId ?? execution.executionId;
  }

  private getExecutionDescription(execution: OrchestrationExecutionSummary): string {
    const parts = [this.localizeExecutionStatus(execution.status)];
    if (execution.pendingHitl) {
      parts.push(this.localizer.localizeText('HITL pending', 'HITL 待处理'));
    }
    if (execution.projectId) {
      parts.push(execution.projectId);
    }
    return parts.join(' · ');
  }

  private getReviewQueueDescription(entry: OrchestrationGovernanceQueueEntry): string {
    const parts = [
      entry.reviewLifecycleStatus ?? this.localizer.localizeText('review item', '评审项'),
      this.localizeFollowUpState(entry.followUpSlaState),
    ];
    if (entry.projectId) {
      parts.push(entry.projectId);
    }

    return parts.join(' · ');
  }

  private getAutomationQueueDescription(entry: OrchestrationGovernanceQueueEntry): string {
    const parts = [this.localizeFollowUpState(entry.followUpSlaState)];
    if (entry.executionStatus) {
      parts.push(this.localizeExecutionStatus(entry.executionStatus));
    }
    if (entry.projectId) {
      parts.push(entry.projectId);
    }

    return parts.join(' · ');
  }

  private getExecutionTooltip(execution: OrchestrationExecutionSummary): string {
    return [
      `${this.localizer.localizeText('Execution', '执行')}: ${execution.executionId}`,
      `${this.localizer.localizeText('Session', '会话')}: ${execution.executionSessionId}`,
      `${this.localizer.localizeText('Workspace', '工作区')}: ${execution.workspaceRoot}`,
    ].join('\n');
  }

  private getReviewQueueTooltip(entry: OrchestrationGovernanceQueueEntry): string {
    return [
      `${this.localizer.localizeText('Queue kind', '队列类型')}: ${this.localizeQueueKind(entry.queueKind)}`,
      `${this.localizer.localizeText('Attention', '关注级别')}: ${this.localizeAttentionLevel(entry.attentionLevel)}`,
      `${this.localizer.localizeText('Notification', '通知状态')}: ${this.localizeNotificationStatus(entry.notificationStatus)}`,
      `${this.localizer.localizeText('Review source', '评审来源')}: ${entry.reviewFilePath ?? this.localizer.localizeText('Unavailable', '不可用')}`,
    ].join('\n');
  }

  private getAutomationQueueTooltip(entry: OrchestrationGovernanceQueueEntry): string {
    return [
      `${this.localizer.localizeText('Queue kind', '队列类型')}: ${this.localizeQueueKind(entry.queueKind)}`,
      `${this.localizer.localizeText('Execution', '执行')}: ${entry.executionId ?? this.localizer.localizeText('Unavailable', '不可用')}`,
      `${this.localizer.localizeText('Notification', '通知状态')}: ${this.localizeNotificationStatus(entry.notificationStatus)}`,
      `${this.localizer.localizeText('Workspace', '工作区')}: ${entry.workspaceRoot}`,
    ].join('\n');
  }

  private getExecutionIconId(execution: OrchestrationExecutionSummary): string {
    switch (execution.status) {
      case OrchestrationExecutionStatus.COMPLETED:
        return 'pass-filled';
      case OrchestrationExecutionStatus.FAILED:
        return 'error';
      case OrchestrationExecutionStatus.HITL_REQUIRED:
        return 'warning';
      case OrchestrationExecutionStatus.INTERRUPTED:
        return 'history';
      case OrchestrationExecutionStatus.RUNNING:
        return 'sync~spin';
      default:
        return execution.pendingHitl ? 'warning' : 'circle-large-outline';
    }
  }

  private getReviewQueueIconId(entry: OrchestrationGovernanceQueueEntry): string {
    if (entry.followUpSlaState === OrchestrationGovernanceFollowUpSlaState.OVERDUE) {
      return 'warning';
    }
    if (entry.attentionLevel === OrchestrationGovernanceAttentionLevel.CRITICAL) {
      return 'error';
    }
    if (entry.reviewLifecycleStatus === 'verified') {
      return 'history';
    }

    return 'note';
  }

  private getAutomationQueueIconId(entry: OrchestrationGovernanceQueueEntry): string {
    if (entry.followUpSlaState === OrchestrationGovernanceFollowUpSlaState.OVERDUE) {
      return 'warning';
    }
    if (entry.attentionLevel === OrchestrationGovernanceAttentionLevel.CRITICAL) {
      return 'error';
    }
    if (entry.executionStatus === OrchestrationExecutionStatus.RUNNING) {
      return 'sync~spin';
    }

    return 'clock';
  }

  private localizeExecutionStatus(status: OrchestrationExecutionStatus): string {
    switch (status) {
      case OrchestrationExecutionStatus.ACCEPTED:
        return this.localizer.localizeText('Accepted', '已接受');
      case OrchestrationExecutionStatus.COMPLETED:
        return this.localizer.localizeText('Completed', '已完成');
      case OrchestrationExecutionStatus.FAILED:
        return this.localizer.localizeText('Failed', '失败');
      case OrchestrationExecutionStatus.HITL_REQUIRED:
        return this.localizer.localizeText('Pending HITL', '等待 HITL');
      case OrchestrationExecutionStatus.INTERRUPTED:
        return this.localizer.localizeText('Interrupted', '已中断');
      case OrchestrationExecutionStatus.RUNNING:
        return this.localizer.localizeText('Running', '运行中');
      case OrchestrationExecutionStatus.CANCELLED:
        return this.localizer.localizeText('Cancelled', '已取消');
      default:
        return status;
    }
  }

  private localizeAttentionLevel(level: OrchestrationGovernanceAttentionLevel): string {
    switch (level) {
      case OrchestrationGovernanceAttentionLevel.CRITICAL:
        return this.localizer.localizeText('Critical', '严重');
      case OrchestrationGovernanceAttentionLevel.WARNING:
        return this.localizer.localizeText('Warning', '警告');
      default:
        return this.localizer.localizeText('Healthy', '健康');
    }
  }

  private localizeFollowUpState(state: OrchestrationGovernanceFollowUpSlaState): string {
    switch (state) {
      case OrchestrationGovernanceFollowUpSlaState.OVERDUE:
        return this.localizer.localizeText('Overdue', '已逾期');
      case OrchestrationGovernanceFollowUpSlaState.DUE_SOON:
        return this.localizer.localizeText('Due soon', '即将到期');
      default:
        return this.localizer.localizeText('Healthy', '健康');
    }
  }

  private getFollowUpIconId(state: OrchestrationGovernanceFollowUpSlaState): string {
    switch (state) {
      case OrchestrationGovernanceFollowUpSlaState.OVERDUE:
        return 'warning';
      case OrchestrationGovernanceFollowUpSlaState.DUE_SOON:
        return 'clock';
      default:
        return 'pass-filled';
    }
  }

  private localizeServiceLifecycleStatus(status: OrchestrationServiceLifecycleStatus): string {
    switch (status) {
      case OrchestrationServiceLifecycleStatus.READY:
        return this.localizer.localizeText('Ready', '已就绪');
      case OrchestrationServiceLifecycleStatus.STARTING:
        return this.localizer.localizeText('Starting', '启动中');
      case OrchestrationServiceLifecycleStatus.STOPPING:
        return this.localizer.localizeText('Stopping', '停止中');
      case OrchestrationServiceLifecycleStatus.STOPPED:
        return this.localizer.localizeText('Stopped', '已停止');
      default:
        return status;
    }
  }

  private localizePublicSupportLevel(level: string): string {
    switch (level) {
      case 'companion_upgraded':
        return this.localizer.localizeText('Companion upgraded', 'Companion 已增强');
      case 'primary_workbench_claim':
        return this.localizer.localizeText(
          'Primary workbench claim active',
          '主工作台公开口径已生效',
        );
      case 'workbench_baseline_in_progress':
        return this.localizer.localizeText(
          'Workbench baseline in progress',
          'Workbench baseline 进行中',
        );
      default:
        return level;
    }
  }

  private localizeDesktopRelationship(relationship: string): string {
    switch (relationship) {
      case 'foundation_only_secondary_surface':
        return this.localizer.localizeText(
          'Foundation-only secondary surface',
          '仅基础能力的 secondary surface',
        );
      case 'coexisting_secondary_surface':
        return this.localizer.localizeText(
          'Coexisting secondary surface',
          '并存的 secondary surface',
        );
      case 'optional_shell_candidate':
        return this.localizer.localizeText('Optional shell candidate', '可选 shell 候选');
      default:
        return relationship;
    }
  }

  private localizeNotificationStatus(status: OrchestrationGovernanceNotificationStatus): string {
    switch (status) {
      case OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED:
        return this.localizer.localizeText('Follow-up required', '需要跟进');
      case OrchestrationGovernanceNotificationStatus.ESCALATION_RECOMMENDED:
        return this.localizer.localizeText('Escalation recommended', '建议升级处理');
      default:
        return this.localizer.localizeText('Idle', '空闲');
    }
  }

  private getNotificationIconId(status: OrchestrationGovernanceNotificationStatus): string {
    switch (status) {
      case OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED:
        return 'warning';
      case OrchestrationGovernanceNotificationStatus.ESCALATION_RECOMMENDED:
        return 'error';
      default:
        return 'pass-filled';
    }
  }

  private localizeQueueKind(kind: OrchestrationGovernanceQueueKind): string {
    switch (kind) {
      case OrchestrationGovernanceQueueKind.REVIEW_QUEUE:
        return this.localizer.localizeText('Review queue', '评审队列');
      default:
        return this.localizer.localizeText('Automation inbox', '自动化收件箱');
    }
  }

  private localizeTemporaryBridgeCapability(
    capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass,
  ): string {
    switch (capabilityClass) {
      case OrchestrationGovernanceTemporaryBridgeCapabilityClass.ADOPT_BOOTSTRAP:
        return this.localizer.localizeText('Adopt bootstrap bridge', '采用 bootstrap bridge');
      case OrchestrationGovernanceTemporaryBridgeCapabilityClass.ADOPTION_APPLY:
        return this.localizer.localizeText('Adoption apply bridge', '采用 apply bridge');
      case OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_EXPORT:
        return this.localizer.localizeText('Host export bridge', '宿主 export bridge');
      case OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_VERIFY:
        return this.localizer.localizeText('Host verify bridge', '宿主 verify bridge');
      case OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_PACK:
        return this.localizer.localizeText('Host pack bridge', '宿主 pack bridge');
      case OrchestrationGovernanceTemporaryBridgeCapabilityClass.UPGRADE:
        return this.localizer.localizeText('Upgrade bridge', '升级 bridge');
      default:
        return capabilityClass;
    }
  }

  private localizeTemporaryBridgeReceiptKind(
    receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind,
  ): string {
    switch (receiptKind) {
      case OrchestrationGovernanceTemporaryBridgeReceiptKind.ADOPTION_INSTALL_RECEIPT:
        return this.localizer.localizeText('Adoption install receipt', '采用安装回执');
      case OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_EXPORT_RECEIPT:
        return this.localizer.localizeText('Host export receipt', '宿主 export 回执');
      case OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_VERIFY_RECEIPT:
        return this.localizer.localizeText('Host verify receipt', '宿主 verify 回执');
      case OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_PACK_RECEIPT:
        return this.localizer.localizeText('Host pack receipt', '宿主 pack 回执');
      case OrchestrationGovernanceTemporaryBridgeReceiptKind.UPGRADE_APPLY_RECEIPT:
        return this.localizer.localizeText('Upgrade apply receipt', '升级 apply 回执');
      default:
        return receiptKind;
    }
  }

  private localizeTemporaryBridgeBacklinkSurface(
    backlinkSurface: OrchestrationGovernanceTemporaryBridgeBacklinkSurface,
  ): string {
    switch (backlinkSurface) {
      case OrchestrationGovernanceTemporaryBridgeBacklinkSurface.ARTIFACT_WORKBENCH:
        return this.localizer.localizeText('Artifact workbench', '产物工作台');
      case OrchestrationGovernanceTemporaryBridgeBacklinkSurface.WORKBENCH_OVERVIEW:
        return this.localizer.localizeText('Workbench overview', 'Workbench 总览');
      default:
        return backlinkSurface;
    }
  }

  private localizeTemporaryBridgeExitCriterion(
    criterion: OrchestrationGovernanceTemporaryBridgeExitCriterion,
  ): string {
    switch (criterion) {
      case OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_ADOPTION_QUERY:
        return this.localizer.localizeText(
          'Service-native adoption query replaces this bridge.',
          'service-native adoption query 取代该 bridge。',
        );
      case OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_HOST_QUERY:
        return this.localizer.localizeText(
          'Service-native host query replaces this bridge.',
          'service-native host query 取代该 bridge。',
        );
      case OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_UPGRADE_QUERY:
        return this.localizer.localizeText(
          'Service-native upgrade query replaces this bridge.',
          'service-native upgrade query 取代该 bridge。',
        );
      case OrchestrationGovernanceTemporaryBridgeExitCriterion.ARTIFACT_BACKLINK_PROJECTED:
        return this.localizer.localizeText(
          'Artifact workbench backlink is projected.',
          '产物工作台回链已投影。',
        );
      case OrchestrationGovernanceTemporaryBridgeExitCriterion.COMMAND_SEAM_REPLACES_BRIDGE:
        return this.localizer.localizeText(
          'A service-owned command seam replaces this bridge.',
          'service-owned 命令接缝已取代该 bridge。',
        );
      default:
        return criterion;
    }
  }

  private getTrustSensitiveActionStatus(workspaceTrusted: boolean): string {
    return workspaceTrusted
      ? this.localizer.localizeText('Available', '可用')
      : this.localizer.localizeText('Blocked until trust is granted', '在授予信任前会保持阻断');
  }

  private getTrustSensitiveActionTooltip(workspaceTrusted: boolean): string {
    return workspaceTrusted
      ? this.localizer.localizeText(
          'Open handoff, submit HITL, recover, and terminate are available for this workspace.',
          '当前工作区已可执行打开交接、提交 HITL、恢复执行与终止执行。',
        )
      : this.localizer.localizeText(
          'Open handoff, submit HITL, recover, and terminate stay blocked until the workspace is trusted.',
          '打开交接、提交 HITL、恢复执行与终止执行会在工作区受信任前保持阻断。',
        );
  }

  private getServiceTopologyDescription(
    serviceHealth: NonNullable<VsCodeExtensionWorkspaceContextSnapshot['serviceHealth']>,
  ): string {
    return this.localizer.localizeText(
      `${serviceHealth.serviceHostKind} via ${serviceHealth.serviceTransportKind}`,
      `${serviceHealth.serviceHostKind} 通过 ${serviceHealth.serviceTransportKind}`,
    );
  }

  private getCheckpointCapabilityDescription(checkpointCapable: boolean): string {
    return checkpointCapable
      ? this.localizer.localizeText('Available', '可用')
      : this.localizer.localizeText('Unavailable', '不可用');
  }

  private getMemoryProviderDescription(
    serviceHealth: NonNullable<VsCodeExtensionWorkspaceContextSnapshot['serviceHealth']>,
  ): string {
    return (
      serviceHealth.memoryStoreProviderId ?? this.localizer.localizeText('Unavailable', '不可用')
    );
  }

  private getWorkspaceSummaryTooltip(entry: OrchestrationGovernanceWorkspaceSummary): string {
    return [
      `${this.localizer.localizeText('Workspace', '工作区')}: ${entry.workspaceRoot}`,
      `${this.localizer.localizeText('Active executions', '活跃执行')}: ${entry.activeExecutionCount}`,
      `${this.localizer.localizeText('Pending HITL', '待处理 HITL')}: ${entry.pendingHitlCount}`,
      `${this.localizer.localizeText('Review queue', '评审队列')}: ${entry.reviewQueueCount}`,
      `${this.localizer.localizeText('Automation queue', '自动化队列')}: ${entry.automationInboxCount}`,
    ].join('\n');
  }

  private getActionCommandLabels(actionKind: OrchestrationGovernanceActionKind): {
    commandId: string;
    label: string;
    englishTitle: string;
    chineseTitle: string;
    iconId: string;
  } {
    switch (actionKind) {
      case OrchestrationGovernanceActionKind.RECOVER_EXECUTION:
        return {
          commandId: VSCODE_EXTENSION_COMMAND_IDS.RECOVER_EXECUTION,
          label: this.localizer.localizeText('Recover execution', '恢复执行'),
          englishTitle: 'Recover execution',
          chineseTitle: '恢复执行',
          iconId: 'history',
        };
      case OrchestrationGovernanceActionKind.TERMINATE_EXECUTION:
        return {
          commandId: VSCODE_EXTENSION_COMMAND_IDS.TERMINATE_EXECUTION,
          label: this.localizer.localizeText('Terminate execution', '终止执行'),
          englishTitle: 'Terminate execution',
          chineseTitle: '终止执行',
          iconId: 'debug-stop',
        };
      default:
        return {
          commandId: VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
          label: this.localizer.localizeText('Open review detail', '打开评审详情'),
          englishTitle: 'Open review detail',
          chineseTitle: '打开评审详情',
          iconId: 'note',
        };
    }
  }

  private getDisabledActionLabel(actionKind: OrchestrationGovernanceActionKind): string {
    switch (actionKind) {
      case OrchestrationGovernanceActionKind.RECOVER_EXECUTION:
        return this.localizer.localizeText('Recovery unavailable', '恢复不可用');
      case OrchestrationGovernanceActionKind.SUBMIT_HITL_DECISION:
        return this.localizer.localizeText('No HITL decision available', '暂无可提交的 HITL 决策');
      case OrchestrationGovernanceActionKind.TERMINATE_EXECUTION:
        return this.localizer.localizeText('Termination unavailable', '终止不可用');
      default:
        return this.localizer.localizeText('Action unavailable', '动作不可用');
    }
  }

  private localizeDisabledReason(reason: OrchestrationGovernanceActionDisabledReason): string {
    switch (reason) {
      case OrchestrationGovernanceActionDisabledReason.EXECUTION_TERMINAL:
        return this.localizer.localizeText('Execution is already terminal.', '执行已进入终态。');
      case OrchestrationGovernanceActionDisabledReason.HITL_NOT_PENDING:
        return this.localizer.localizeText(
          'No pending HITL decision exists.',
          '当前没有待处理的 HITL 决策。',
        );
      case OrchestrationGovernanceActionDisabledReason.RECOVERY_NOT_AVAILABLE:
        return this.localizer.localizeText(
          'No recovery checkpoint is available.',
          '当前没有可恢复的检查点。',
        );
      case OrchestrationGovernanceActionDisabledReason.TARGET_UNAVAILABLE:
        return this.localizer.localizeText('Target is unavailable.', '目标不可用。');
      default:
        return reason;
    }
  }

  private getHitlDecisionLabel(decision: string, resumeAction: string): string {
    if (decision === 'approve' && resumeAction === 'resume') {
      return this.localizer.localizeText('Approve and resume', '批准并继续');
    }
    if (decision === 'request_changes' && resumeAction === 'degrade') {
      return this.localizer.localizeText('Request changes and degrade', '要求修改并降级');
    }
    if (decision === 'reject' && resumeAction === 'terminate') {
      return this.localizer.localizeText('Reject and terminate', '拒绝并终止');
    }

    return `${decision} / ${resumeAction}`;
  }

  private getHandoffLabel(targetKind: OrchestrationHandoffTargetKind): string {
    switch (targetKind) {
      case OrchestrationHandoffTargetKind.EDITOR:
        return this.localizer.localizeText('Open editor target', '打开编辑器目标');
      case OrchestrationHandoffTargetKind.REVIEW_DOCUMENT:
        return this.localizer.localizeText('Open review document', '打开评审文档');
      case OrchestrationHandoffTargetKind.TERMINAL:
        return this.localizer.localizeText('Open terminal handoff', '打开终端交接');
      default:
        return this.localizer.localizeText('Reveal worktree root', '显示工作树根目录');
    }
  }

  private getHandoffIconId(target: OrchestrationHandoffTarget): string {
    if (!target.exists) {
      return 'circle-slash';
    }

    switch (target.targetKind) {
      case OrchestrationHandoffTargetKind.EDITOR:
        return 'go-to-file';
      case OrchestrationHandoffTargetKind.REVIEW_DOCUMENT:
        return 'note';
      case OrchestrationHandoffTargetKind.TERMINAL:
        return 'terminal';
      default:
        return 'folder-opened';
    }
  }

  private buildWorkflowStudioSelectionLines(
    selectedExecution: OrchestrationExecutionSummary | undefined,
    artifactPane: NonNullable<VsCodeExtensionWorkflowStudioSnapshot['artifactPane']> | undefined,
    reviewSourcePath?: string,
  ): string[] {
    if (!selectedExecution) {
      return [
        this.localizer.localizeText(
          'No execution is selected yet. Pick a task, review, or automation item to inspect workflow evidence.',
          '当前还没有选中执行。请选择任务、评审或自动化项来查看 workflow 证据。',
        ),
        `${this.localizer.localizeText('Review source', '评审来源')}: ${reviewSourcePath ?? this.localizer.localizeText('Unavailable', '不可用')}`,
      ];
    }

    const lines = [
      `${this.localizer.localizeText('Execution', '执行')}: ${selectedExecution.executionId}`,
      `${this.localizer.localizeText('Task', '任务')}: ${selectedExecution.taskId ?? this.localizer.localizeText('Unavailable', '不可用')}`,
      `${this.localizer.localizeText('Project / sprint', '项目 / Sprint')}: ${selectedExecution.projectId ?? this.localizer.localizeText('Unavailable', '不可用')} / ${selectedExecution.sprintId ?? this.localizer.localizeText('Unavailable', '不可用')}`,
      `${this.localizer.localizeText('Execution status', '执行状态')}: ${this.localizeExecutionStatus(selectedExecution.status)}`,
      `${this.localizer.localizeText('Current stage', '当前阶段')}: ${selectedExecution.currentStageId ?? this.localizer.localizeText('Unavailable', '不可用')}`,
      `${this.localizer.localizeText('Latest event', '最新事件')}: ${selectedExecution.latestEventType ?? this.localizer.localizeText('Unavailable', '不可用')}`,
      `${this.localizer.localizeText('Pending HITL', '待处理 HITL')}: ${selectedExecution.pendingHitl ? this.localizer.localizeText('Yes', '是') : this.localizer.localizeText('No', '否')}`,
      `${this.localizer.localizeText('Review source', '评审来源')}: ${artifactPane?.reviewSourcePath ?? reviewSourcePath ?? this.localizer.localizeText('Unavailable', '不可用')}`,
    ];
    if (artifactPane?.workbench.latestArtifactId) {
      lines.push(
        `${this.localizer.localizeText('Latest artifact', '最新产物')}: ${artifactPane.workbench.latestArtifactId}`,
      );
    }
    if (artifactPane?.reviewLifecycle.latestReviewId) {
      lines.push(
        `${this.localizer.localizeText('Latest review', '最新评审')}: ${artifactPane.reviewLifecycle.latestReviewId}`,
      );
    }

    return lines;
  }

  private buildWorkflowStudioActionDescriptors(
    selectedExecution: OrchestrationExecutionBoardEntry | undefined,
    temporaryBridges: readonly OrchestrationGovernanceTemporaryBridgeEntry[],
    reviewSourcePath?: string,
  ): Array<{
    label: string;
    description: string;
    href?: string;
    disabledReason?: string;
  }> {
    const actions: Array<{
      label: string;
      description: string;
      href?: string;
      disabledReason?: string;
    }> = [];

    if (selectedExecution) {
      const request = this.createExecutionRequest(selectedExecution);
      actions.push({
        label: this.localizer.localizeText('Open review detail', '打开评审详情'),
        description: this.localizer.localizeText(
          'Inspect the current service-backed artifact, review, and transcript projection.',
          '查看当前 service-backed 的产物、评审与转录投影。',
        ),
        href: this.createCommandUri(VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL, request),
      });

      for (const action of selectedExecution.actions) {
        if (
          action.actionKind === OrchestrationGovernanceActionKind.OPEN_HANDOFF_TARGET ||
          action.actionKind === OrchestrationGovernanceActionKind.VIEW_EXECUTION
        ) {
          continue;
        }

        if (action.actionKind === OrchestrationGovernanceActionKind.SUBMIT_HITL_DECISION) {
          if (action.enabled && action.hitlDecisionOptions) {
            for (const option of action.hitlDecisionOptions) {
              actions.push({
                label: this.getHitlDecisionLabel(option.decision, option.resumeAction),
                description: this.localizer.localizeText(
                  'Replay one human approval back into the orchestration runtime.',
                  '将人工决策回灌到编排运行时。',
                ),
                href: this.createCommandUri(VSCODE_EXTENSION_COMMAND_IDS.SUBMIT_HITL_DECISION, {
                  ...request,
                  hitlDecisionOption: option,
                }),
              });
            }
          } else {
            actions.push({
              label: this.getDisabledActionLabel(action.actionKind),
              description: this.localizer.localizeText(
                'Human review is not currently waiting on this execution.',
                '当前执行暂时不需要人工复核。',
              ),
              disabledReason: action.disabledReason
                ? this.localizeDisabledReason(action.disabledReason)
                : undefined,
            });
          }
          continue;
        }

        const actionLabels = this.getActionCommandLabels(action.actionKind);
        actions.push({
          label: actionLabels.label,
          description: action.enabled
            ? this.localizer.localizeText(
                'Run this service-backed command without leaving the workflow studio.',
                '直接在 Workflow Studio 内触发这个 service-backed 命令。',
              )
            : this.localizer.localizeText(
                'This service-backed command is currently unavailable.',
                '这个 service-backed 命令当前不可用。',
              ),
          ...(action.enabled
            ? {
                href: this.createCommandUri(actionLabels.commandId, request),
              }
            : {
                disabledReason: action.disabledReason
                  ? this.localizeDisabledReason(action.disabledReason)
                  : undefined,
              }),
        });
      }

      for (const target of selectedExecution.handoffTargets) {
        actions.push({
          label: this.getHandoffLabel(target.targetKind),
          description: target.targetPath
            ? this.localizer.localizeText(
                `Open the canonical handoff target at ${target.targetPath}.`,
                `打开规范交接目标 ${target.targetPath}。`,
              )
            : this.localizer.localizeText(
                'The handoff target is currently unavailable.',
                '当前交接目标不可用。',
              ),
          ...(target.exists && target.targetPath
            ? {
                href: this.createCommandUri(VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET, {
                  ...request,
                  handoffTarget: target,
                }),
              }
            : {
                disabledReason: this.localizer.localizeText('Target unavailable', '目标不可用'),
              }),
        });
      }
    } else if (reviewSourcePath) {
      const reviewOnlyRequest = this.createReviewOnlyRequest(reviewSourcePath);
      actions.push({
        label: this.localizer.localizeText('Open review detail', '打开评审详情'),
        description: this.localizer.localizeText(
          'Inspect the review-only projection that is currently selected.',
          '查看当前选中的 review-only 投影。',
        ),
        href: this.createCommandUri(
          VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
          reviewOnlyRequest,
        ),
      });
      actions.push({
        label: this.localizer.localizeText('Open review document', '打开评审文档'),
        description: this.localizer.localizeText(
          'Open the canonical review document directly from the workflow studio.',
          '直接从 Workflow Studio 打开规范评审文档。',
        ),
        href: this.createCommandUri(VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET, {
          ...reviewOnlyRequest,
          handoffTarget: this.createReviewSourceHandoffTarget(reviewSourcePath),
        }),
      });
    }

    for (const entry of temporaryBridges) {
      actions.push({
        label: this.localizer.localizeText(
          `Run repository operation: ${this.localizeTemporaryBridgeCapability(entry.capabilityClass)}`,
          `运行仓库操作：${this.localizeTemporaryBridgeCapability(entry.capabilityClass)}`,
        ),
        description: this.localizer.localizeText(
          `Receipt ${this.localizeTemporaryBridgeReceiptKind(entry.receiptKind)} · Exit ${entry.exitCriteria.map((criterion) => this.localizeTemporaryBridgeExitCriterion(criterion)).join('; ')}`,
          `回执 ${this.localizeTemporaryBridgeReceiptKind(entry.receiptKind)} · 退出条件 ${entry.exitCriteria.map((criterion) => this.localizeTemporaryBridgeExitCriterion(criterion)).join('；')}`,
        ),
        href: this.createCommandUri(VSCODE_EXTENSION_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE, {
          executionId: selectedExecution?.execution.executionId,
          executionSessionId: selectedExecution?.execution.executionSessionId,
          reviewSourcePath,
          temporaryBridge: entry,
        }),
      });
    }

    return actions;
  }

  private buildWorkflowStudioContinuityLines(
    sessionContinuity: VsCodeExtensionWorkflowStudioSnapshot['sessionContinuity'],
    selectedExecution: OrchestrationExecutionSummary | undefined,
  ): string[] {
    if (!selectedExecution) {
      return [
        this.localizer.localizeText(
          'Select one execution to inspect continuity, resume, and handoff metadata.',
          '请选择一个执行以查看连续性、恢复与交接元数据。',
        ),
      ];
    }

    if (!sessionContinuity) {
      return [
        `${this.localizer.localizeText('Session', '会话')}: ${selectedExecution.executionSessionId ?? this.localizer.localizeText('Unavailable', '不可用')}`,
        this.localizer.localizeText(
          'Continuity metadata is not projected yet.',
          '当前还没有投影出连续性元数据。',
        ),
      ];
    }

    const unavailable = this.localizer.localizeText('Unavailable', '不可用');
    const lines = [
      `${this.localizer.localizeText('Session', '会话')}: ${sessionContinuity.sessionId}`,
      `${this.localizer.localizeText('Session status', '会话状态')}: ${sessionContinuity.sessionStatus ?? unavailable}`,
      `${this.localizer.localizeText('Current route', '当前路由')}: ${sessionContinuity.currentRouteId ?? unavailable}`,
      `${this.localizer.localizeText('Latest turn', '最近轮次')}: ${sessionContinuity.latestTurnId ?? unavailable}`,
      `${this.localizer.localizeText('Latest event sequence', '最近事件序号')}: ${String(sessionContinuity.latestEventSequence ?? unavailable)}`,
      `${this.localizer.localizeText('Next cursor', '下一个游标')}: ${sessionContinuity.nextCursor ?? unavailable}`,
    ];
    if (sessionContinuity.resumeSelector) {
      lines.push(
        `${this.localizer.localizeText('Resume selector', '恢复选择器')}: ${sessionContinuity.resumeSelector}`,
      );
    }
    if (sessionContinuity.degradedReason) {
      lines.push(
        `${this.localizer.localizeText('Continuity degradation', '连续性降级')}: ${sessionContinuity.degradedReason}`,
      );
    }

    return lines;
  }

  private buildWorkflowStudioQueueLines(
    queueOverview: OrchestrationQueueOverviewQueryResponse,
  ): string[] {
    return [
      `${this.localizer.localizeText('Queue owner surface', '队列归属表面')}: ${queueOverview.notificationOwnership.ownerSurface}`,
      `${this.localizer.localizeText('Review queue items', '评审队列项')}: ${queueOverview.reviewQueue.length}`,
      `${this.localizer.localizeText('Automation queue items', '自动化队列项')}: ${queueOverview.automationInbox.length}`,
      `${this.localizer.localizeText('Projected workspaces', '已投影工作区')}: ${queueOverview.workspaceSummary.length}`,
      `${this.localizer.localizeText('Parallel lanes', '并行泳道')}: ${queueOverview.parallelLanes.length}`,
      `${this.localizer.localizeText('Temporary bridges', '临时 bridge')}: ${queueOverview.temporaryBridges.length}`,
      `${this.localizer.localizeText('Notification status', '通知状态')}: ${this.localizeNotificationStatus(queueOverview.notificationOwnership.notificationStatus)}`,
    ];
  }

  private buildWorkflowStudioSupportTruthLines(
    queueOverview: OrchestrationQueueOverviewQueryResponse,
    selectedExecution: OrchestrationExecutionSummary | undefined,
    artifactPane: NonNullable<VsCodeExtensionWorkflowStudioSnapshot['artifactPane']> | undefined,
  ): string[] {
    const lines = [
      `${this.localizer.localizeText('Public support level', '公开支持级别')}: ${this.localizePublicSupportLevel(VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL)}`,
      `${this.localizer.localizeText('Workflow studio gate', 'Workflow Studio 门槛')}: ${this.getSupportTruthGateLabel(queueOverview, selectedExecution)}`,
      `${this.localizer.localizeText('Temporary bridge exit backlog', '临时 bridge 退出积压')}: ${queueOverview.temporaryBridges.length}`,
    ];
    if (artifactPane) {
      lines.push(
        `${this.localizer.localizeText('Resolved reviews', '已解决评审')}: ${artifactPane.reviewLifecycle.resolvedReviewCount}`,
        `${this.localizer.localizeText('Pending / verified reviews', '待处理 / 已验证评审')}: ${artifactPane.reviewLifecycle.pendingReviewCount} / ${artifactPane.reviewLifecycle.verifiedReviewCount}`,
        `${this.localizer.localizeText('Evidence backlinks', '证据回链')}: ${artifactPane.evidenceBacklinks.artifactPaths.length} artifact path(s), ${artifactPane.evidenceBacklinks.reviewPaths.length} review path(s)`,
      );
    }
    lines.push(
      this.localizer.localizeText(
        'Keep public docs aligned with the primary-workbench claim evidence window; Marketplace and published npm/tgz install surfaces remain unsupported.',
        '公开文档现在要与主工作台口径证据窗保持一致；Marketplace 与已发布 npm/tgz 安装面仍然不在支持范围内。',
      ),
    );

    return lines;
  }

  private buildWorkflowStudioDesktopDecisionLines(
    queueOverview: OrchestrationQueueOverviewQueryResponse,
    selectedExecution: OrchestrationExecutionSummary | undefined,
  ): string[] {
    return [
      `${this.localizer.localizeText('Desktop relationship', 'Desktop 关系')}: ${this.localizeDesktopRelationship(VSCODE_EXTENSION_DESKTOP_RELATIONSHIP)}`,
      `${this.localizer.localizeText('Queue owner surface', '队列归属表面')}: ${queueOverview.notificationOwnership.ownerSurface}`,
      `${this.localizer.localizeText('Active workspaces', '活跃工作区')}: ${queueOverview.notificationOwnership.activeWorkspaceCount}`,
      `${this.localizer.localizeText('Selected execution', '当前选中执行')}: ${selectedExecution?.executionId ?? this.localizer.localizeText('None', '无')}`,
      `${this.localizer.localizeText('Decision guidance', '决策建议')}: ${this.getDesktopDecisionGuidance(queueOverview)}`,
    ];
  }

  private buildWorkflowStudioTemporaryBridgeLines(
    temporaryBridges: readonly OrchestrationGovernanceTemporaryBridgeEntry[],
  ): string[] {
    if (temporaryBridges.length === 0) {
      return [
        this.localizer.localizeText(
          'No temporary bridge remains projected for this workspace.',
          '当前工作区已经没有临时 bridge 投影。',
        ),
      ];
    }

    return temporaryBridges.map(
      (entry) =>
        `${this.localizeTemporaryBridgeCapability(entry.capabilityClass)} | ${this.localizeTemporaryBridgeReceiptKind(entry.receiptKind)} | ${this.localizeTemporaryBridgeBacklinkSurface(entry.backlinkSurface)} | ${entry.exitCriteria.map((criterion) => this.localizeTemporaryBridgeExitCriterion(criterion)).join('; ')}`,
    );
  }

  private getSupportTruthGateLabel(
    queueOverview: OrchestrationQueueOverviewQueryResponse,
    selectedExecution: OrchestrationExecutionSummary | undefined,
  ): string {
    if (this.isPrimaryWorkbenchClaimActive()) {
      return this.localizer.localizeText(
        'Primary-workbench claim active',
        '主工作台公开口径已生效',
      );
    }
    if (queueOverview.temporaryBridges.length > 0) {
      return this.localizer.localizeText('Evidence in progress', '证据收集中');
    }
    if (selectedExecution?.currentStageId) {
      return this.localizer.localizeText(
        'Ready for support-truth review',
        '可进入 support-truth 复核',
      );
    }

    return this.localizer.localizeText('Evidence in progress', '证据收集中');
  }

  private getDesktopDecisionGuidance(
    queueOverview: OrchestrationQueueOverviewQueryResponse,
  ): string {
    if (this.isPrimaryWorkbenchClaimActive() && queueOverview.temporaryBridges.length === 0) {
      return this.localizer.localizeText(
        'Desktop remains the foundation-only secondary surface while VS Code owns the public primary-workbench claim.',
        '当 VS Code 维持公开主工作台口径时，Desktop 继续保持 foundation-only secondary surface。',
      );
    }

    return this.localizer.localizeText(
      'Keep desktop at foundation-only secondary surface until bridge exits and support-truth evidence both close cleanly.',
      '在 bridge 退出与 support-truth 证据一起 clean 收口前，Desktop 继续保持 foundation-only secondary surface。',
    );
  }

  private isPrimaryWorkbenchClaimActive(): boolean {
    return String(VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL) === 'primary_workbench_claim';
  }

  private createReviewSourceHandoffTarget(reviewSourcePath: string): OrchestrationHandoffTarget {
    return {
      targetId: `review-source:${reviewSourcePath}`,
      executionId: `review-source:${reviewSourcePath}`,
      targetKind: OrchestrationHandoffTargetKind.REVIEW_DOCUMENT,
      targetPath: reviewSourcePath,
      exists: true,
    };
  }

  private createReviewOnlyRequest(reviewSourcePath: string): VsCodeExtensionCommandRequest {
    return {
      reviewSourcePath,
      clearExecutionSelection: true,
    };
  }

  private createCommandUri(command: string, request?: VsCodeExtensionCommandRequest): string {
    if (!request) {
      return `command:${command}`;
    }

    return `command:${command}?${encodeURIComponent(JSON.stringify([request]))}`;
  }

  private renderActionSection(
    title: string,
    actions: ReadonlyArray<{
      label: string;
      description: string;
      href?: string;
      disabledReason?: string;
    }>,
  ): string {
    if (actions.length === 0) {
      return this.renderStringSection(title, []);
    }

    return `
      <section class="card">
        <h2>${this.escapeHtml(title)}</h2>
        <ul class="action-list">
          ${actions
            .map((action) => {
              const labelMarkup = action.href
                ? `<a class="action-link" href="${this.escapeHtml(action.href)}">${this.escapeHtml(action.label)}</a>`
                : `<span class="action-disabled">${this.escapeHtml(action.label)}</span>`;
              const description = action.disabledReason
                ? `${action.description} ${this.localizer.localizeText('Reason', '原因')}: ${action.disabledReason}`
                : action.description;
              return `<li class="action-item">${labelMarkup}<p class="action-description">${this.escapeHtml(description)}</p></li>`;
            })
            .join('')}
        </ul>
      </section>
    `;
  }

  private renderStringSection(title: string, lines: readonly string[]): string {
    if (lines.length === 0) {
      return `
        <section class="card">
          <h2>${this.escapeHtml(title)}</h2>
          <p>${this.escapeHtml(this.localizer.localizeText('No data available yet.', '暂时没有可显示的数据。'))}</p>
        </section>
      `;
    }

    return `
      <section class="card">
        <h2>${this.escapeHtml(title)}</h2>
        <ul class="section-list">
          ${lines.map((line) => `<li>${this.escapeHtml(line)}</li>`).join('')}
        </ul>
      </section>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
