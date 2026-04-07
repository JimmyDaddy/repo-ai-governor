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

/**
 * Wires the full VS Code companion MVP during extension activation.
 *
 * Why this exists:
 * activation should assemble lightweight views, chat, and commands around the frozen contract
 * while keeping service access and presentation logic delegated to focused runtime classes.
 */
export class VsCodeExtensionHost {
  private readonly localizer = new VsCodeExtensionLocalizer();
  private readonly selectionStore = new VsCodeExtensionSelectionStore();
  private readonly serviceRuntime = new VsCodeExtensionServiceRuntime();
  private readonly presentationBuilder = new VsCodeExtensionPresentationBuilder(this.localizer);

  /**
   * Activates the Governor companion inside the VS Code extension host.
   * @param context Extension activation context.
   */
  public async activate(context: vscode.ExtensionContext): Promise<void> {
    const executionBoardProvider = new VsCodeExtensionTreeDataProvider(async () => {
      const executionBoard = await this.serviceRuntime.queryExecutionBoard();
      return [...this.presentationBuilder.buildExecutionBoardNodes(executionBoard.executions)];
    });
    const hitlInboxProvider = new VsCodeExtensionTreeDataProvider(async () => {
      const hitlInbox = await this.serviceRuntime.queryHitlInbox();
      return [...this.presentationBuilder.buildHitlInboxNodes(hitlInbox.pendingDecisions)];
    });
    const workspaceContextProvider = new VsCodeExtensionTreeDataProvider(async () => {
      const [workspaceContext, selectedExecution] = await Promise.all([
        this.serviceRuntime.resolveWorkspaceContextSnapshot(),
        this.serviceRuntime.resolveExecutionBoardEntry(
          this.selectionStore.getSnapshot().executionId,
        ),
      ]);
      return [
        ...this.presentationBuilder.buildWorkspaceContextNodes(
          workspaceContext,
          selectedExecution,
          this.selectionStore.getSnapshot().reviewSourcePath,
        ),
      ];
    });
    const reviewDetailProvider = new VsCodeExtensionReviewDetailProvider(
      this.serviceRuntime,
      this.selectionStore,
      this.presentationBuilder,
    );
    const executionBoardView = vscode.window.createTreeView(
      VSCODE_EXTENSION_VIEW_IDS.EXECUTION_BOARD,
      {
        treeDataProvider: executionBoardProvider,
        showCollapseAll: true,
      },
    );
    const hitlInboxView = vscode.window.createTreeView(VSCODE_EXTENSION_VIEW_IDS.HITL_INBOX, {
      treeDataProvider: hitlInboxProvider,
      showCollapseAll: true,
    });
    const workspaceContextView = vscode.window.createTreeView(
      VSCODE_EXTENSION_VIEW_IDS.WORKSPACE_CONTEXT,
      {
        treeDataProvider: workspaceContextProvider,
        showCollapseAll: false,
      },
    );
    const commandController = new VsCodeExtensionCommandController(
      this.serviceRuntime,
      this.selectionStore,
      this.localizer,
      {
        executionBoardProvider,
        hitlInboxProvider,
        workspaceContextProvider,
        reviewDetailProvider,
      },
    );
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

    context.subscriptions.push(
      executionBoardView,
      hitlInboxView,
      workspaceContextView,
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
      chatParticipant,
      vscode.commands.registerCommand(VSCODE_EXTENSION_COMMAND_IDS.REFRESH, async (request) =>
        commandController.refresh(request),
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
      executionBoardView.onDidChangeSelection((event) => {
        void commandController.handleExecutionBoardSelection(event.selection);
      }),
      hitlInboxView.onDidChangeSelection((event) => {
        void commandController.handleHitlInboxSelection(event.selection);
      }),
      vscode.workspace.onDidGrantWorkspaceTrust(() => {
        void this.refreshContextKeys();
        void commandController.refresh();
      }),
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        void commandController.refresh();
      }),
      vscode.window.onDidChangeActiveTextEditor(() => {
        workspaceContextProvider.refresh();
      }),
      {
        dispose: () => {
          void this.dispose();
        },
      },
    );

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
}
