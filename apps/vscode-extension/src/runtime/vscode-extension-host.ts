import * as vscode from 'vscode';

import {
  VSCODE_EXTENSION_CHAT_PARTICIPANT_ID,
  VSCODE_EXTENSION_COMMAND_IDS,
  VSCODE_EXTENSION_CONTEXT_KEYS,
  VSCODE_EXTENSION_VIEW_IDS,
} from '../constants/index.js';
import { VsCodeExtensionChatParticipantRuntime } from './vscode-extension-chat-participant.js';
import { VsCodeExtensionCodeActionProvider } from './vscode-extension-code-action-provider.js';
import { VsCodeExtensionCommandController } from './vscode-extension-command-controller.js';
import { VsCodeExtensionLocalizer } from './vscode-extension-localizer.js';
import { VsCodeExtensionPresentationBuilder } from './vscode-extension-presentation-builder.js';
import { VsCodeExtensionReviewDetailProvider } from './vscode-extension-review-detail-provider.js';
import { VsCodeExtensionSelectionStore } from './vscode-extension-selection-store.js';
import { VsCodeExtensionServiceRuntime } from './vscode-extension-service-runtime.js';
import { VsCodeExtensionTreeDataProvider } from './vscode-extension-tree-data-provider.js';
import { VsCodeExtensionWorkflowStudioProvider } from './vscode-extension-workflow-studio-provider.js';

/**
 * Wires the Phase C VS Code primary workbench baseline during extension activation.
 *
 * Why this exists:
 * activation should assemble task/review/automation/workbench/workflow-studio surfaces around the
 * frozen contract while keeping service access and presentation logic delegated to focused runtime
 * classes.
 */
export class VsCodeExtensionHost {
  private readonly localizer = new VsCodeExtensionLocalizer();
  private readonly selectionStore = new VsCodeExtensionSelectionStore();
  private readonly serviceRuntime = new VsCodeExtensionServiceRuntime();
  private readonly presentationBuilder = new VsCodeExtensionPresentationBuilder(this.localizer);

  /**
   * Activates the Governor workbench baseline inside the VS Code extension host.
   * @param context Extension activation context.
   */
  public async activate(context: vscode.ExtensionContext): Promise<void> {
    const taskBoardProvider = new VsCodeExtensionTreeDataProvider(async () => {
      const executionBoard = await this.serviceRuntime.queryExecutionBoard();
      return [...this.presentationBuilder.buildTaskBoardNodes(executionBoard.executions)];
    });
    const hitlInboxProvider = new VsCodeExtensionTreeDataProvider(async () => {
      const hitlInbox = await this.serviceRuntime.queryHitlInbox();
      return [...this.presentationBuilder.buildHitlInboxNodes(hitlInbox.pendingDecisions)];
    });
    const reviewQueueProvider = new VsCodeExtensionTreeDataProvider(async () => {
      const queueOverview = await this.serviceRuntime.queryQueueOverview();
      return [...this.presentationBuilder.buildReviewQueueNodes(queueOverview.reviewQueue)];
    });
    const automationQueueProvider = new VsCodeExtensionTreeDataProvider(async () => {
      const queueOverview = await this.serviceRuntime.queryQueueOverview();
      return [...this.presentationBuilder.buildAutomationQueueNodes(queueOverview.automationInbox)];
    });
    const workbenchOverviewProvider = new VsCodeExtensionTreeDataProvider(async () => {
      const overviewSnapshot = await this.serviceRuntime.resolveWorkbenchOverviewSnapshot(
        this.selectionStore.getSnapshot(),
      );
      return [...this.presentationBuilder.buildWorkbenchOverviewNodes(overviewSnapshot)];
    });
    const reviewDetailProvider = new VsCodeExtensionReviewDetailProvider(
      this.serviceRuntime,
      this.selectionStore,
      this.presentationBuilder,
    );
    const workflowStudioProvider = new VsCodeExtensionWorkflowStudioProvider(
      this.serviceRuntime,
      this.selectionStore,
      this.presentationBuilder,
    );
    const taskBoardView = vscode.window.createTreeView(VSCODE_EXTENSION_VIEW_IDS.TASK_BOARD, {
      treeDataProvider: taskBoardProvider,
      showCollapseAll: true,
    });
    const hitlInboxView = vscode.window.createTreeView(VSCODE_EXTENSION_VIEW_IDS.HITL_INBOX, {
      treeDataProvider: hitlInboxProvider,
      showCollapseAll: true,
    });
    const reviewQueueView = vscode.window.createTreeView(VSCODE_EXTENSION_VIEW_IDS.REVIEW_QUEUE, {
      treeDataProvider: reviewQueueProvider,
      showCollapseAll: true,
    });
    const automationQueueView = vscode.window.createTreeView(
      VSCODE_EXTENSION_VIEW_IDS.AUTOMATION_QUEUE,
      {
        treeDataProvider: automationQueueProvider,
        showCollapseAll: true,
      },
    );
    const workbenchOverviewView = vscode.window.createTreeView(
      VSCODE_EXTENSION_VIEW_IDS.WORKBENCH_OVERVIEW,
      {
        treeDataProvider: workbenchOverviewProvider,
        showCollapseAll: false,
      },
    );
    const commandController = new VsCodeExtensionCommandController(
      this.serviceRuntime,
      this.selectionStore,
      this.localizer,
      {
        taskBoardProvider,
        hitlInboxProvider,
        reviewQueueProvider,
        automationQueueProvider,
        workbenchOverviewProvider,
        workflowStudioProvider,
        reviewDetailProvider,
      },
    );

    context.subscriptions.push(
      taskBoardView,
      hitlInboxView,
      reviewQueueView,
      automationQueueView,
      workbenchOverviewView,
      vscode.window.registerWebviewViewProvider(
        VSCODE_EXTENSION_VIEW_IDS.WORKFLOW_STUDIO,
        workflowStudioProvider,
      ),
      vscode.window.registerWebviewViewProvider(
        VSCODE_EXTENSION_VIEW_IDS.REVIEW_DETAIL,
        reviewDetailProvider,
      ),
      vscode.languages.registerCodeActionsProvider(
        { scheme: 'file' },
        new VsCodeExtensionCodeActionProvider(this.localizer),
        {
          providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
        },
      ),
      vscode.commands.registerCommand(VSCODE_EXTENSION_COMMAND_IDS.REFRESH, async (request) =>
        commandController.refresh(request),
      ),
      vscode.commands.registerCommand(
        VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKSPACE_BOOTSTRAP,
        async () => commandController.runWorkspaceBootstrap(),
      ),
      vscode.commands.registerCommand(VSCODE_EXTENSION_COMMAND_IDS.RUN_DOCTOR, async () =>
        commandController.runDoctor(),
      ),
      vscode.commands.registerCommand(VSCODE_EXTENSION_COMMAND_IDS.RUN_CHECK, async () =>
        commandController.runCheck(),
      ),
      vscode.commands.registerCommand(VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKFLOW_PREVIEW, async () =>
        commandController.runWorkflowPreview(),
      ),
      vscode.commands.registerCommand(VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKFLOW_CREATE, async () =>
        commandController.runWorkflowCreate(),
      ),
      vscode.commands.registerCommand(VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKFLOW_EDIT, async () =>
        commandController.runWorkflowEdit(),
      ),
      vscode.commands.registerCommand(
        VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
        async (request) => commandController.openReviewDetail(request),
      ),
      vscode.commands.registerCommand(
        VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET,
        async (request) => commandController.openHandoffTarget(request),
      ),
      vscode.commands.registerCommand(
        VSCODE_EXTENSION_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE,
        async (request) => commandController.stageTemporaryBridge(request),
      ),
      vscode.commands.registerCommand(
        VSCODE_EXTENSION_COMMAND_IDS.SUBMIT_HITL_DECISION,
        async (request) => commandController.submitHitlDecision(request),
      ),
      vscode.commands.registerCommand(
        VSCODE_EXTENSION_COMMAND_IDS.RECOVER_EXECUTION,
        async (request) => commandController.recoverExecution(request),
      ),
      vscode.commands.registerCommand(
        VSCODE_EXTENSION_COMMAND_IDS.TERMINATE_EXECUTION,
        async (request) => commandController.terminateExecution(request),
      ),
      vscode.commands.registerCommand(VSCODE_EXTENSION_COMMAND_IDS.OPEN_USER_CONFIG, async () =>
        commandController.openUserConfig(),
      ),
      vscode.commands.registerCommand(
        VSCODE_EXTENSION_COMMAND_IDS.CONFIGURE_USER_DEFAULT,
        async (request) => commandController.configureUserDefault(request),
      ),
      vscode.commands.registerCommand(
        VSCODE_EXTENSION_COMMAND_IDS.SET_MANAGED_SECRET,
        async (request) => commandController.setManagedSecret(request),
      ),
      taskBoardView.onDidChangeSelection((event) => {
        void commandController.handleExecutionBoardSelection(event.selection);
      }),
      hitlInboxView.onDidChangeSelection((event) => {
        void commandController.handleHitlInboxSelection(event.selection);
      }),
      reviewQueueView.onDidChangeSelection((event) => {
        void commandController.handleReviewQueueSelection(event.selection);
      }),
      automationQueueView.onDidChangeSelection((event) => {
        void commandController.handleAutomationQueueSelection(event.selection);
      }),
      workbenchOverviewView.onDidChangeSelection((event) => {
        commandController.handleWorkbenchOverviewSelection(event.selection);
      }),
      vscode.workspace.onDidGrantWorkspaceTrust(() => {
        void this.refreshContextKeys();
        void commandController.refresh();
      }),
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        void commandController.refresh();
      }),
      vscode.window.onDidChangeActiveTextEditor(() => {
        workbenchOverviewProvider.refresh();
      }),
      {
        dispose: () => {
          void this.dispose();
        },
      },
    );

    const chatParticipant = this.createOptionalChatParticipant(context);
    if (chatParticipant) {
      context.subscriptions.push(chatParticipant);
    }

    await this.refreshContextKeys();
    await commandController.refresh();
  }

  /**
   * Disposes extension-owned service resources.
   */
  public async dispose(): Promise<void> {
    await this.serviceRuntime.dispose();
  }

  private async refreshContextKeys(): Promise<void> {
    await vscode.commands.executeCommand(
      'setContext',
      VSCODE_EXTENSION_CONTEXT_KEYS.WORKSPACE_TRUSTED,
      vscode.workspace.isTrusted,
    );
  }

  private createOptionalChatParticipant(
    context: vscode.ExtensionContext,
  ): vscode.Disposable | undefined {
    if (!this.hasChatParticipantSupport()) {
      return undefined;
    }

    const chatParticipant = new VsCodeExtensionChatParticipantRuntime(
      this.serviceRuntime,
      this.selectionStore,
      this.presentationBuilder,
      this.localizer,
    ).createParticipant(VSCODE_EXTENSION_CHAT_PARTICIPANT_ID);
    chatParticipant.iconPath = vscode.Uri.joinPath(
      context.extensionUri,
      'resources',
      'governor.svg',
    );
    return chatParticipant;
  }

  private hasChatParticipantSupport(): boolean {
    return (
      typeof (vscode as typeof vscode & { chat?: { createChatParticipant?: unknown } }).chat
        ?.createChatParticipant === 'function'
    );
  }
}
