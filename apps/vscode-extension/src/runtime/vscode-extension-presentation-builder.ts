import {
  OrchestrationClientSurface,
  OrchestrationExecutionStatus,
  OrchestrationGovernanceActionDisabledReason,
  OrchestrationGovernanceActionKind,
  OrchestrationGovernanceAttentionLevel,
  OrchestrationGovernanceFollowUpSlaState,
  OrchestrationGovernanceNotificationStatus,
  OrchestrationGovernanceQueueKind,
  OrchestrationHandoffTargetKind,
  OrchestrationServiceLifecycleStatus,
} from '@repo-ai-governor/orchestration-service-client';
import type {
  OrchestrationExecutionBoardEntry,
  OrchestrationExecutionSummary,
  OrchestrationGovernanceActionAffordance,
  OrchestrationGovernanceQueueEntry,
  OrchestrationGovernanceWorkspaceSummary,
  OrchestrationHandoffTarget,
  OrchestrationHitlInboxEntry,
  OrchestrationQueueOverviewQueryResponse,
} from '@repo-ai-governor/orchestration-service-client';
import { VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL } from '../constants/index.js';
import {
  VSCODE_EXTENSION_CHAT_COMMAND_REVIEW,
  VSCODE_EXTENSION_COMMAND_IDS,
  VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES,
} from '../constants/index.js';
import type {
  VsCodeExtensionCommandRequest,
  VsCodeExtensionReviewDetailSnapshot,
  VsCodeExtensionTreeNodeDescriptor,
  VsCodeExtensionWorkbenchOverviewSnapshot,
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
    const selectedExecution = snapshot.selectedExecution;
    const reviewSourcePath = snapshot.reviewSourcePath;
    const latestWorkspaceSummary = queueOverview.workspaceSummary[0];
    const latestAutomationEntry = queueOverview.automationInbox[0];

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
      {
        nodeId: 'public-support-level',
        label: this.localizer.localizeText('Public support level', '公开支持级别'),
        description: this.localizePublicSupportLevel(VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL),
        tooltip: this.localizer.localizeText(
          'Phase A keeps the VS Code surface at workbench baseline in progress until later evidence is complete.',
          'Phase A 会让 VS Code 保持在 workbench baseline in progress，直到后续证据面闭环。',
        ),
        themeIconId: 'workspace-trusted',
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
        nodeId: 'workspace-summary',
        label: this.localizer.localizeText('Workspace summary', '工作区摘要'),
        description: latestWorkspaceSummary
          ? this.localizer.localizeText(
              `${latestWorkspaceSummary.activeExecutionCount} active execution(s)`,
              `${latestWorkspaceSummary.activeExecutionCount} 个活跃执行`,
            )
          : this.localizer.localizeText('No workspace summary yet', '暂时没有工作区摘要'),
        tooltip: latestWorkspaceSummary
          ? this.getWorkspaceSummaryTooltip(latestWorkspaceSummary)
          : this.localizer.localizeText(
              'The service will project governed workspace summary here when executions exist.',
              '当存在执行记录时，服务会在这里投影治理工作区摘要。',
            ),
        themeIconId: latestWorkspaceSummary ? 'organization' : 'circle-slash',
        contextValue: VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES.WORKBENCH_OVERVIEW,
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
          this.localizer.localizeText('Review lifecycle', '评审生命周期'),
          artifactPane.reviews.map(
            (review) =>
              `${review.title} (${review.lifecycleStatus})${review.scope ? ` · ${review.scope}` : ''}`,
          ),
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
      );
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
    );

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
    };
  }

  private createReviewQueueRequest(
    entry: OrchestrationGovernanceQueueEntry,
  ): VsCodeExtensionCommandRequest {
    return {
      executionId: entry.executionId,
      executionSessionId: undefined,
      reviewSourcePath: entry.reviewFilePath,
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
    if (level === 'workbench_baseline_in_progress') {
      return this.localizer.localizeText(
        'Workbench baseline in progress',
        'Workbench baseline 进行中',
      );
    }

    return level;
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
