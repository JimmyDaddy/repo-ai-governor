import * as vscode from 'vscode';

import {
  OrchestrationGovernanceActionKind,
  OrchestrationHandoffTargetKind,
} from '@repo-ai-governor/orchestration-service-client';
import { standardizeError } from '@repo-ai-governor/shared';
import { VSCODE_EXTENSION_TRUST_MANAGE_COMMAND_ID } from '../constants/index.js';
import type {
  VsCodeExtensionCommandRequest,
  VsCodeExtensionTreeNodeDescriptor,
} from '../types/index.js';
import type { VsCodeExtensionLocalizer } from './vscode-extension-localizer.js';
import type { VsCodeExtensionReviewDetailProvider } from './vscode-extension-review-detail-provider.js';
import type { VsCodeExtensionSelectionStore } from './vscode-extension-selection-store.js';
import type { VsCodeExtensionServiceRuntime } from './vscode-extension-service-runtime.js';
import type { VsCodeExtensionTreeDataProvider } from './vscode-extension-tree-data-provider.js';

interface VsCodeExtensionCommandControllerDependencies {
  taskBoardProvider?: VsCodeExtensionTreeDataProvider;
  executionBoardProvider?: VsCodeExtensionTreeDataProvider;
  hitlInboxProvider: VsCodeExtensionTreeDataProvider;
  reviewQueueProvider?: VsCodeExtensionTreeDataProvider;
  workbenchOverviewProvider?: VsCodeExtensionTreeDataProvider;
  workspaceContextProvider?: VsCodeExtensionTreeDataProvider;
  reviewDetailProvider: VsCodeExtensionReviewDetailProvider;
}

/**
 * Executes the frozen VS Code command contract against service-owned orchestration actions.
 *
 * Why this exists:
 * command handlers must stay thin, consistent, and trust-gated while keeping all actionable
 * behavior routed through the local orchestration service.
 */
export class VsCodeExtensionCommandController {
  public constructor(
    private readonly serviceRuntime: VsCodeExtensionServiceRuntime,
    private readonly selectionStore: VsCodeExtensionSelectionStore,
    private readonly localizer: VsCodeExtensionLocalizer,
    private readonly dependencies: VsCodeExtensionCommandControllerDependencies,
  ) {}

  /**
   * Refreshes all Governor views.
   * @param commandRequest Optional selection override.
   */
  public async refresh(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    this.selectionStore.applyCommandRequest(commandRequest);
    this.dependencies.taskBoardProvider?.refresh();
    this.dependencies.executionBoardProvider?.refresh();
    this.dependencies.hitlInboxProvider.refresh();
    this.dependencies.reviewQueueProvider?.refresh();
    this.dependencies.workbenchOverviewProvider?.refresh();
    this.dependencies.workspaceContextProvider?.refresh();
    await this.dependencies.reviewDetailProvider.refresh();
  }

  /**
   * Opens the detail-only review webview for the selected execution or one review-only backlink.
   * @param commandRequest Optional selection override.
   */
  public async openReviewDetail(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    this.selectionStore.applyCommandRequest(commandRequest);
    await this.dependencies.reviewDetailProvider.refresh(commandRequest);
    this.dependencies.reviewDetailProvider.show(false);
  }

  /**
   * Opens one service-owned handoff target.
   * @param commandRequest Optional command request carrying the routed target.
   */
  public async openHandoffTarget(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const mergedRequest = this.mergeCommandRequest(commandRequest);
      const handoffTarget =
        mergedRequest.handoffTarget ??
        (await this.resolvePreferredHandoffTarget(mergedRequest)) ??
        this.createReviewSourceHandoffTarget(mergedRequest.reviewSourcePath);
      if (!handoffTarget?.targetPath || !handoffTarget.exists) {
        void vscode.window.showInformationMessage(
          this.localizer.localizeText(
            'No available handoff target could be resolved.',
            '当前没有可用的交接目标。',
          ),
        );
        return;
      }

      this.selectionStore.applyCommandRequest(mergedRequest);
      switch (handoffTarget.targetKind) {
        case OrchestrationHandoffTargetKind.EDITOR:
        case OrchestrationHandoffTargetKind.REVIEW_DOCUMENT: {
          const document = await vscode.workspace.openTextDocument(
            vscode.Uri.file(handoffTarget.targetPath),
          );
          await vscode.window.showTextDocument(document, {
            preview: false,
          });
          break;
        }
        case OrchestrationHandoffTargetKind.TERMINAL: {
          const terminal = vscode.window.createTerminal({
            name: this.localizer.localizeText('Governor Handoff', 'Governor 交接'),
            cwd: handoffTarget.targetPath,
          });
          terminal.show();
          break;
        }
        default: {
          await vscode.commands.executeCommand(
            'revealInExplorer',
            vscode.Uri.file(handoffTarget.targetPath),
          );
          break;
        }
      }
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to open the requested handoff target.',
        '打开指定交接目标失败。',
      );
    }
  }

  /**
   * Submits one HITL decision through the service command seam.
   * @param commandRequest Optional command request carrying decision metadata.
   */
  public async submitHitlDecision(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const mergedRequest = this.mergeCommandRequest(commandRequest);
      const hitlEntry = await this.serviceRuntime.resolveHitlInboxEntry(mergedRequest.executionId);
      if (!hitlEntry) {
        void vscode.window.showInformationMessage(
          this.localizer.localizeText(
            'No pending HITL decision is available right now.',
            '当前没有可处理的 HITL 决策。',
          ),
        );
        return;
      }

      const selectedOption =
        mergedRequest.hitlDecisionOption ?? (await this.promptForHitlDecisionOption(hitlEntry));
      if (!selectedOption) {
        return;
      }

      const confirmed = await this.confirmCommand(
        this.localizer.localizeText(
          'Submit this HITL decision back to the orchestration runtime?',
          '要将这个 HITL 决策回灌到编排运行时吗？',
        ),
        this.localizer.localizeText('Submit Decision', '提交决策'),
      );
      if (!confirmed) {
        return;
      }

      const response = await this.serviceRuntime.submitHitlDecision({
        executionId: hitlEntry.execution.executionId,
        executionSessionId: hitlEntry.execution.executionSessionId,
        decision: selectedOption.decision,
        resumeAction: selectedOption.resumeAction,
        actor: 'vscode_extension_user',
        reason: this.localizer.localizeText(
          'Submitted from the VS Code Governor companion.',
          '由 VS Code Governor 伴侣提交。',
        ),
      });
      this.selectionStore.rememberExecution(
        response.executionSummary.executionId,
        response.executionSummary.executionSessionId,
      );
      await this.refresh({
        executionId: response.executionSummary.executionId,
        executionSessionId: response.executionSummary.executionSessionId,
        reviewSourcePath: undefined,
      });
      void vscode.window.showInformationMessage(
        this.localizer.localizeText('HITL decision submitted.', 'HITL 决策已提交。'),
      );
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to submit the HITL decision.',
        '提交 HITL 决策失败。',
      );
    }
  }

  /**
   * Requests recovery for the selected execution.
   * @param commandRequest Optional command request carrying execution metadata.
   */
  public async recoverExecution(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const mergedRequest = this.mergeCommandRequest(commandRequest);
      const executionEntry = await this.serviceRuntime.resolveExecutionBoardEntry(
        mergedRequest.executionId,
      );
      if (!executionEntry) {
        void vscode.window.showInformationMessage(
          this.localizer.localizeText(
            'No recoverable execution is currently selected.',
            '当前没有选中可恢复的执行。',
          ),
        );
        return;
      }

      const response = await this.serviceRuntime.recoverExecution({
        executionId: executionEntry.execution.executionId,
      });
      this.selectionStore.rememberExecution(
        response.executionSummary.executionId,
        response.executionSummary.executionSessionId,
      );
      await this.refresh({
        executionId: response.executionSummary.executionId,
        executionSessionId: response.executionSummary.executionSessionId,
        reviewSourcePath: undefined,
      });
      void vscode.window.showInformationMessage(
        this.localizer.localizeText('Execution recovery requested.', '已请求执行恢复。'),
      );
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to recover the selected execution.',
        '恢复所选执行失败。',
      );
    }
  }

  /**
   * Requests termination for the selected execution.
   * @param commandRequest Optional command request carrying execution metadata.
   */
  public async terminateExecution(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const mergedRequest = this.mergeCommandRequest(commandRequest);
      const executionEntry = await this.serviceRuntime.resolveExecutionBoardEntry(
        mergedRequest.executionId,
      );
      if (!executionEntry) {
        void vscode.window.showInformationMessage(
          this.localizer.localizeText(
            'No terminable execution is currently selected.',
            '当前没有选中可终止的执行。',
          ),
        );
        return;
      }

      const confirmed = await this.confirmCommand(
        this.localizer.localizeText(
          'Terminate the selected execution and preserve partial output?',
          '终止所选执行并保留部分输出吗？',
        ),
        this.localizer.localizeText('Terminate Execution', '终止执行'),
      );
      if (!confirmed) {
        return;
      }

      const response = await this.serviceRuntime.terminateExecution({
        executionId: executionEntry.execution.executionId,
        actor: 'vscode_extension_user',
        preservePartialOutput: true,
        reason: this.localizer.localizeText(
          'Terminated from the VS Code Governor companion.',
          '由 VS Code Governor 伴侣终止。',
        ),
      });
      this.selectionStore.rememberExecution(
        response.executionSummary.executionId,
        response.executionSummary.executionSessionId,
      );
      await this.refresh({
        executionId: response.executionSummary.executionId,
        executionSessionId: response.executionSummary.executionSessionId,
        reviewSourcePath: undefined,
      });
      void vscode.window.showInformationMessage(
        this.localizer.localizeText('Execution termination requested.', '已请求终止执行。'),
      );
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to terminate the selected execution.',
        '终止所选执行失败。',
      );
    }
  }

  /**
   * Records selection changes from the execution board view.
   * @param selection Newly selected tree nodes.
   */
  public async handleExecutionBoardSelection(
    selection: readonly VsCodeExtensionTreeNodeDescriptor[],
  ): Promise<void> {
    const request = selection[0]?.selectionRequest;
    if (!request) {
      return;
    }

    this.selectionStore.applyCommandRequest(request);
    this.dependencies.workbenchOverviewProvider?.refresh();
    this.dependencies.workspaceContextProvider?.refresh();
    await this.dependencies.reviewDetailProvider.refresh(request);
  }

  /**
   * Records selection changes from the HITL inbox view.
   * @param selection Newly selected tree nodes.
   */
  public async handleHitlInboxSelection(
    selection: readonly VsCodeExtensionTreeNodeDescriptor[],
  ): Promise<void> {
    const request = selection[0]?.selectionRequest;
    if (!request) {
      return;
    }

    this.selectionStore.applyCommandRequest(request);
    this.dependencies.workbenchOverviewProvider?.refresh();
    this.dependencies.workspaceContextProvider?.refresh();
    await this.dependencies.reviewDetailProvider.refresh(request);
  }

  /**
   * Records selection changes from the review queue view.
   * @param selection Newly selected tree nodes.
   */
  public async handleReviewQueueSelection(
    selection: readonly VsCodeExtensionTreeNodeDescriptor[],
  ): Promise<void> {
    const request = selection[0]?.selectionRequest;
    if (!request) {
      return;
    }

    this.selectionStore.applyCommandRequest(request);
    this.dependencies.workbenchOverviewProvider?.refresh();
    this.dependencies.workspaceContextProvider?.refresh();
    await this.dependencies.reviewDetailProvider.refresh(request);
  }

  private mergeCommandRequest(
    commandRequest?: VsCodeExtensionCommandRequest,
  ): VsCodeExtensionCommandRequest {
    const selection = this.selectionStore.getSnapshot();
    return {
      executionId:
        commandRequest && 'executionId' in commandRequest
          ? commandRequest.executionId
          : selection.executionId,
      executionSessionId:
        commandRequest && 'executionSessionId' in commandRequest
          ? commandRequest.executionSessionId
          : selection.executionSessionId,
      reviewSourcePath:
        commandRequest && 'reviewSourcePath' in commandRequest
          ? commandRequest.reviewSourcePath
          : selection.reviewSourcePath,
      ...(commandRequest?.handoffTarget
        ? {
            handoffTarget: commandRequest.handoffTarget,
          }
        : {}),
      ...(commandRequest?.hitlDecisionOption
        ? {
            hitlDecisionOption: commandRequest.hitlDecisionOption,
          }
        : {}),
    };
  }

  private async resolvePreferredHandoffTarget(commandRequest: VsCodeExtensionCommandRequest) {
    if (!commandRequest.executionId) {
      return undefined;
    }

    const executionEntry = await this.serviceRuntime.resolveExecutionBoardEntry(
      commandRequest.executionId,
    );
    if (!executionEntry) {
      return undefined;
    }

    const targetPriority = [
      OrchestrationHandoffTargetKind.REVIEW_DOCUMENT,
      OrchestrationHandoffTargetKind.EDITOR,
      OrchestrationHandoffTargetKind.WORKTREE,
      OrchestrationHandoffTargetKind.TERMINAL,
    ];
    return targetPriority
      .flatMap((targetKind) =>
        executionEntry.handoffTargets.filter((target) => target.targetKind === targetKind),
      )
      .find((target) => target.exists && target.targetPath);
  }

  private createReviewSourceHandoffTarget(reviewSourcePath?: string) {
    if (!reviewSourcePath) {
      return undefined;
    }

    return {
      targetId: `review-source:${reviewSourcePath}`,
      executionId: `review-source:${reviewSourcePath}`,
      targetKind: OrchestrationHandoffTargetKind.REVIEW_DOCUMENT,
      targetPath: reviewSourcePath,
      exists: true,
    };
  }

  private async promptForHitlDecisionOption(hitlEntry: {
    execution: { executionId: string; executionSessionId: string };
    actions: readonly {
      actionKind: OrchestrationGovernanceActionKind;
      hitlDecisionOptions?: readonly { optionId: string; decision: string; resumeAction: string }[];
    }[];
  }) {
    const action = hitlEntry.actions.find(
      (entry) => entry.actionKind === OrchestrationGovernanceActionKind.SUBMIT_HITL_DECISION,
    );
    const options = action?.hitlDecisionOptions ?? [];
    if (options.length === 0) {
      return undefined;
    }

    const picked = await vscode.window.showQuickPick(
      options.map((option) => ({
        label: this.localizer.localizeText(
          `${option.decision} / ${option.resumeAction}`,
          `${option.decision} / ${option.resumeAction}`,
        ),
        description: option.optionId,
        option,
      })),
      {
        title: this.localizer.localizeText(
          'Choose one HITL decision to submit',
          '选择一个要提交的 HITL 决策',
        ),
      },
    );
    return picked?.option;
  }

  private async ensureTrusted(): Promise<boolean> {
    if (vscode.workspace.isTrusted) {
      return true;
    }

    const manageTrustLabel = this.localizer.localizeText('Manage Trust', '管理信任');
    const picked = await vscode.window.showWarningMessage(
      this.localizer.localizeText(
        'This command is blocked until the workspace is trusted.',
        '该命令会在工作区受信任前保持阻断。',
      ),
      manageTrustLabel,
    );
    if (picked === manageTrustLabel) {
      await vscode.commands.executeCommand(VSCODE_EXTENSION_TRUST_MANAGE_COMMAND_ID);
    }
    return false;
  }

  private async confirmCommand(message: string, confirmLabel: string): Promise<boolean> {
    const picked = await vscode.window.showWarningMessage(
      message,
      {
        modal: true,
      },
      confirmLabel,
    );
    return picked === confirmLabel;
  }

  private async showCommandError(
    error: unknown,
    englishPrefix: string,
    chinesePrefix: string,
  ): Promise<void> {
    const standardizedError = standardizeError(error);
    await vscode.window.showErrorMessage(
      `${this.localizer.localizeText(englishPrefix, chinesePrefix)} [${standardizedError.code}] ${standardizedError.message}`,
    );
  }
}
