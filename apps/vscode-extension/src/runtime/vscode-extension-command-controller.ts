import * as vscode from 'vscode';

import {
  OrchestrationGovernanceActionKind,
  type OrchestrationHandoffTarget,
  OrchestrationHandoffTargetKind,
  OrchestrationWorkspaceOperationKind,
} from '@repo-ai-governor/orchestration-service-client';
import {
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  CLI_REACT_THEME_VALUES,
  WorkspaceMode,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  VSCODE_EXTENSION_CONTAINER_ID,
  VSCODE_EXTENSION_SECRET_SELECTOR_PREFIX,
  VSCODE_EXTENSION_TOOL_USER_DEFAULT_KEY_SUFFIXES,
  VSCODE_EXTENSION_TRUST_MANAGE_COMMAND_ID,
  VSCODE_EXTENSION_UPGRADE_CONFIRMATION_APPROVE,
  VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS,
} from '../constants/index.js';
import type {
  VsCodeExtensionCommandRequest,
  VsCodeExtensionSecureAuthoringSnapshot,
  VsCodeExtensionTreeNodeDescriptor,
} from '../types/index.js';
import type { VsCodeExtensionLocalizer } from './vscode-extension-localizer.js';
import type { VsCodeExtensionReviewDetailProvider } from './vscode-extension-review-detail-provider.js';
import type { VsCodeExtensionSelectionStore } from './vscode-extension-selection-store.js';
import type { VsCodeExtensionServiceRuntime } from './vscode-extension-service-runtime.js';
import type { VsCodeExtensionTreeDataProvider } from './vscode-extension-tree-data-provider.js';
import type { VsCodeExtensionWorkflowStudioProvider } from './vscode-extension-workflow-studio-provider.js';

interface VsCodeExtensionCommandControllerDependencies {
  taskBoardProvider?: VsCodeExtensionTreeDataProvider;
  executionBoardProvider?: VsCodeExtensionTreeDataProvider;
  hitlInboxProvider: VsCodeExtensionTreeDataProvider;
  reviewQueueProvider?: VsCodeExtensionTreeDataProvider;
  automationQueueProvider?: VsCodeExtensionTreeDataProvider;
  workbenchOverviewProvider?: VsCodeExtensionTreeDataProvider;
  workspaceContextProvider?: VsCodeExtensionTreeDataProvider;
  workflowStudioProvider?: VsCodeExtensionWorkflowStudioProvider;
  reviewDetailProvider: VsCodeExtensionReviewDetailProvider;
}

type VsCodeExtensionWorkspaceOperationArguments = Record<
  string,
  boolean | number | string | readonly string[] | null
>;

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
    this.dependencies.automationQueueProvider?.refresh();
    this.dependencies.workbenchOverviewProvider?.refresh();
    this.dependencies.workspaceContextProvider?.refresh();
    void this.dependencies.workflowStudioProvider?.refresh();
    await this.dependencies.reviewDetailProvider.refresh();
  }

  /**
   * Opens the detail-only review webview for the selected execution or one review-only backlink.
   * @param commandRequest Optional selection override.
   */
  public async openReviewDetail(
    commandRequest?: VsCodeExtensionCommandRequest | VsCodeExtensionTreeNodeDescriptor,
  ): Promise<void> {
    const normalizedRequest = this.normalizeCommandRequest(commandRequest);
    this.selectionStore.applyCommandRequest(normalizedRequest);
    await this.revealWorkbenchContainer();
    await this.dependencies.reviewDetailProvider.refresh(normalizedRequest);
    this.dependencies.reviewDetailProvider.show?.(false);
  }

  /**
   * Opens the workflow-studio workbench view for the selected execution or queue item.
   * @param commandRequest Optional selection override.
   */
  public async openWorkflowStudio(
    commandRequest?: VsCodeExtensionCommandRequest | VsCodeExtensionTreeNodeDescriptor,
  ): Promise<void> {
    const normalizedRequest = this.normalizeCommandRequest(commandRequest);
    this.selectionStore.applyCommandRequest(normalizedRequest);
    await this.revealWorkbenchContainer();
    await this.dependencies.workflowStudioProvider?.refresh(normalizedRequest);
    this.dependencies.workflowStudioProvider?.show(false);
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
          void vscode.window.showInformationMessage(
            this.localizer.localizeText(
              'Terminal handoff stays compatibility-only. Use Workflow Studio or Review Detail for the plugin-primary path.',
              '终端交接仅保留为兼容入口。插件主路径请使用 Workflow Studio 或评审详情。',
            ),
          );
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
   * Executes one service-backed repository operation from either a compatibility bridge request or
   * one direct workbench-native workspace-operation request.
   * @param commandRequest Optional command request carrying a direct operation or bridge metadata.
   */
  public async stageTemporaryBridge(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const operationRequest = await this.resolveWorkspaceOperationRequest(commandRequest);
      if (!operationRequest) {
        return;
      }
      this.selectionStore.applyCommandRequest(operationRequest.commandRequest);
      await this.runWorkspaceOperationWithFeedback(
        operationRequest.operationKind,
        operationRequest.argumentsRecord,
        operationRequest.commandRequest,
      );
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to execute the requested workspace operation.',
        '执行请求的工作区操作失败。',
      );
    }
  }

  public async runWorkspaceBootstrap(): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    await this.runWorkspaceOperationWithHandledError(
      OrchestrationWorkspaceOperationKind.WORKSPACE_BOOTSTRAP,
    );
  }

  public async runDoctor(): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    await this.runWorkspaceOperationWithHandledError(OrchestrationWorkspaceOperationKind.DOCTOR);
  }

  public async runCheck(): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    await this.runWorkspaceOperationWithHandledError(OrchestrationWorkspaceOperationKind.CHECK);
  }

  public async runWorkflowPreview(): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    const templateId = await this.promptForWorkflowTemplateId(
      this.localizer.localizeText('Preview workflow template', '预览工作流模板'),
    );
    if (templateId === null) {
      return;
    }
    await this.runWorkspaceOperationWithHandledError(
      OrchestrationWorkspaceOperationKind.WORKFLOW_PREVIEW,
      templateId
        ? {
            templateId,
          }
        : undefined,
    );
  }

  public async runWorkflowCreate(): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    const templateId = await this.promptForWorkflowTemplateId(
      this.localizer.localizeText('Create workflow entry', '创建工作流入口'),
    );
    if (templateId === null) {
      return;
    }
    await this.runWorkspaceOperationWithHandledError(
      OrchestrationWorkspaceOperationKind.WORKFLOW_CREATE,
      templateId
        ? {
            templateId,
          }
        : undefined,
    );
  }

  public async runWorkflowEdit(): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    const templateId = await this.promptForWorkflowTemplateId(
      this.localizer.localizeText('Edit workflow entry', '编辑工作流入口'),
    );
    if (templateId === null) {
      return;
    }
    await this.runWorkspaceOperationWithHandledError(
      OrchestrationWorkspaceOperationKind.WORKFLOW_EDIT,
      templateId
        ? {
            templateId,
          }
        : undefined,
    );
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
   * Opens the canonical user-local config file when it already exists.
   */
  public async openUserConfig(): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const secureAuthoring = await this.serviceRuntime.resolveSecureAuthoringSnapshot();
      const configPath = secureAuthoring?.userConfig?.configPath;
      if (!configPath) {
        void vscode.window.showInformationMessage(
          this.localizer.localizeText(
            'Canonical user-config diagnostics are not available yet.',
            '当前还无法获取 canonical user-config 诊断信息。',
          ),
        );
        return;
      }

      if (!secureAuthoring.userConfig?.configExists) {
        void vscode.window.showInformationMessage(
          this.localizer.localizeText(
            `Canonical user-config does not exist yet. Configure one user-local default first to initialize ${configPath}.`,
            `canonical user-config 尚未创建。请先配置一个用户本地默认值来初始化 ${configPath}。`,
          ),
        );
        return;
      }

      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(configPath));
      await vscode.window.showTextDocument(document, { preview: false });
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to open the canonical user-config file.',
        '打开 canonical user-config 文件失败。',
      );
    }
  }

  /**
   * Prompts for one user-local default and persists it through the embedded CLI seam.
   * @param commandRequest Optional command request carrying one preselected key path.
   */
  public async configureUserDefault(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const mergedRequest = this.mergeCommandRequest(commandRequest);
      const secureAuthoring = await this.serviceRuntime.resolveSecureAuthoringSnapshot();
      const keyPath = await this.promptForUserConfigKeyPath(
        mergedRequest.userConfigKeyPath,
        secureAuthoring,
      );
      if (!keyPath) {
        return;
      }

      const value = await this.promptForUserConfigValue(
        keyPath,
        this.readCurrentUserConfigValue(secureAuthoring, keyPath),
      );
      if (!value) {
        return;
      }

      const result = await this.serviceRuntime.setUserConfigValue(keyPath, value);
      this.selectionStore.applyCommandRequest(mergedRequest);
      await this.refresh();
      void vscode.window.showInformationMessage(
        this.localizer.localizeText(
          `Configured ${keyPath}=${result.persistedValue ?? value}.`,
          `已配置 ${keyPath}=${result.persistedValue ?? value}。`,
        ),
      );
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to configure the requested user-local default.',
        '配置请求的用户本地默认值失败。',
      );
    }
  }

  /**
   * Securely captures one managed secret and writes it through stdin-only mutation.
   * @param commandRequest Optional command request carrying one preselected secret key.
   */
  public async setManagedSecret(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const mergedRequest = this.mergeCommandRequest(commandRequest);
      const secureAuthoring = await this.serviceRuntime.resolveSecureAuthoringSnapshot();
      const keyName = await this.promptForManagedSecretKeyName(
        mergedRequest.secretKeyName,
        secureAuthoring,
      );
      if (!keyName) {
        return;
      }

      const backendSelection = await this.promptForManagedSecretBackend(secureAuthoring);
      if (backendSelection === false) {
        return;
      }

      const secretValue = await vscode.window.showInputBox({
        title: this.localizer.localizeText('Set managed secret', '设置受管 secret'),
        prompt: this.localizer.localizeText(
          `Enter the managed secret value for ${keyName}.`,
          `请输入 ${keyName} 的受管 secret 值。`,
        ),
        password: true,
        ignoreFocusOut: true,
        validateInput: (candidate) =>
          candidate.trim().length > 0
            ? undefined
            : this.localizer.localizeText('Secret value is required.', '请输入 secret 值。'),
      });
      if (!secretValue) {
        return;
      }

      const result = await this.serviceRuntime.setManagedSecret(
        keyName,
        secretValue,
        typeof backendSelection === 'string' ? backendSelection : undefined,
      );
      this.selectionStore.applyCommandRequest(mergedRequest);
      await this.refresh();
      void vscode.window.showInformationMessage(
        this.localizer.localizeText(
          result.warning
            ? `Managed secret updated for ${result.selector ?? keyName}. Warning: ${result.warning}`
            : `Managed secret updated for ${result.selector ?? keyName}.`,
          result.warning
            ? `${result.selector ?? keyName} 的受管 secret 已更新。警告：${result.warning}`
            : `${result.selector ?? keyName} 的受管 secret 已更新。`,
        ),
      );
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to write the requested managed secret.',
        '写入请求的受管 secret 失败。',
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
    void this.dependencies.workflowStudioProvider?.refresh(request);
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
    void this.dependencies.workflowStudioProvider?.refresh(request);
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
    void this.dependencies.workflowStudioProvider?.refresh(request);
    await this.dependencies.reviewDetailProvider.refresh(request);
  }

  /**
   * Records selection changes from the automation queue view.
   * @param selection Newly selected tree nodes.
   */
  public async handleAutomationQueueSelection(
    selection: readonly VsCodeExtensionTreeNodeDescriptor[],
  ): Promise<void> {
    const request = selection[0]?.selectionRequest;
    if (!request) {
      return;
    }

    this.selectionStore.applyCommandRequest(request);
    this.dependencies.workbenchOverviewProvider?.refresh();
    this.dependencies.workspaceContextProvider?.refresh();
    void this.dependencies.workflowStudioProvider?.refresh(request);
    await this.dependencies.reviewDetailProvider.refresh(request);
  }

  /**
   * Records selection changes from the workbench-overview view.
   * @param selection Newly selected tree nodes.
   */
  public handleWorkbenchOverviewSelection(
    selection: readonly VsCodeExtensionTreeNodeDescriptor[],
  ): void {
    const request = selection[0]?.selectionRequest;
    if (!request) {
      return;
    }

    this.selectionStore.applyCommandRequest(request);
    void this.dependencies.workflowStudioProvider?.refresh(request);
    void this.dependencies.reviewDetailProvider.refresh(request);
  }

  private mergeCommandRequest(
    commandRequest?: VsCodeExtensionCommandRequest,
  ): VsCodeExtensionCommandRequest {
    const selection = this.selectionStore.getSnapshot();
    const clearExecutionSelection = commandRequest?.clearExecutionSelection === true;
    const requestContainsTemporaryBridge = Boolean(
      commandRequest && 'temporaryBridge' in commandRequest,
    );
    return {
      executionId: clearExecutionSelection
        ? undefined
        : commandRequest && 'executionId' in commandRequest
          ? commandRequest.executionId
          : selection.executionId,
      executionSessionId: clearExecutionSelection
        ? undefined
        : commandRequest && 'executionSessionId' in commandRequest
          ? commandRequest.executionSessionId
          : selection.executionSessionId,
      reviewSourcePath:
        commandRequest && 'reviewSourcePath' in commandRequest
          ? commandRequest.reviewSourcePath
          : selection.reviewSourcePath,
      ...(clearExecutionSelection
        ? {
            clearExecutionSelection: true,
          }
        : {}),
      queueEntry: clearExecutionSelection
        ? undefined
        : commandRequest && 'queueEntry' in commandRequest
          ? commandRequest.queueEntry
          : selection.queueEntry,
      ...(commandRequest?.handoffTarget
        ? {
            handoffTarget: commandRequest.handoffTarget,
          }
        : {}),
      ...(clearExecutionSelection
        ? {
            temporaryBridge: undefined,
          }
        : commandRequest && 'temporaryBridge' in commandRequest
          ? {
              temporaryBridge: commandRequest.temporaryBridge,
            }
          : selection.temporaryBridge
            ? {
                temporaryBridge: selection.temporaryBridge,
              }
            : {}),
      ...(commandRequest?.hitlDecisionOption
        ? {
            hitlDecisionOption: commandRequest.hitlDecisionOption,
          }
        : {}),
      ...(commandRequest && 'workspaceOperationKind' in commandRequest
        ? {
            workspaceOperationKind: commandRequest.workspaceOperationKind,
          }
        : !requestContainsTemporaryBridge && selection.workspaceOperationKind
          ? {
              workspaceOperationKind: selection.workspaceOperationKind,
            }
          : {}),
      ...(commandRequest && 'workspaceOperationArguments' in commandRequest
        ? {
            workspaceOperationArguments: commandRequest.workspaceOperationArguments
              ? { ...commandRequest.workspaceOperationArguments }
              : undefined,
          }
        : !requestContainsTemporaryBridge && selection.workspaceOperationArguments
          ? {
              workspaceOperationArguments: { ...selection.workspaceOperationArguments },
            }
          : {}),
      ...(commandRequest && 'userConfigKeyPath' in commandRequest
        ? {
            userConfigKeyPath: commandRequest.userConfigKeyPath,
          }
        : {}),
      ...(commandRequest && 'secretKeyName' in commandRequest
        ? {
            secretKeyName: commandRequest.secretKeyName,
          }
        : {}),
    };
  }

  private async promptForUserConfigKeyPath(
    preselectedKeyPath?: string,
    secureAuthoring?: VsCodeExtensionSecureAuthoringSnapshot,
  ): Promise<string | undefined> {
    if (preselectedKeyPath) {
      return preselectedKeyPath;
    }

    const directChoice = await vscode.window.showQuickPick(
      [
        {
          label: this.localizer.localizeText('React theme default', 'React 主题默认值'),
          description: this.readCurrentUserConfigValue(
            secureAuthoring,
            VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS.REACT_THEME,
          ),
          keyPath: VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS.REACT_THEME,
        },
        {
          label: this.localizer.localizeText('Workspace mode preference', '工作区模式偏好'),
          description: this.readCurrentUserConfigValue(
            secureAuthoring,
            VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS.WORKSPACE_MODE,
          ),
          keyPath: VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS.WORKSPACE_MODE,
        },
        {
          label: this.localizer.localizeText('Tool remote API default', '工具 Remote API 默认值'),
          description: this.localizer.localizeText(
            'Choose one tool and one field to author.',
            '选择一个工具和一个字段进行配置。',
          ),
          scope: 'tool',
        },
      ],
      {
        title: this.localizer.localizeText(
          'Choose one user-local default to configure',
          '选择一个要配置的用户本地默认值',
        ),
      },
    );
    if (!directChoice) {
      return undefined;
    }
    if (directChoice.keyPath) {
      return directChoice.keyPath;
    }

    const toolChoice = await vscode.window.showQuickPick(
      Object.values(AdapterSurface).map((toolId) => ({
        label: toolId,
        description:
          (secureAuthoring?.userConfig?.entries?.filter((entry) =>
            entry.keyPath.startsWith(`tools.${toolId}.`),
          ).length ?? 0) > 0
            ? this.localizer.localizeText('Has existing defaults', '已有默认值')
            : this.localizer.localizeText('No current default', '当前无默认值'),
        toolId,
      })),
      {
        title: this.localizer.localizeText(
          'Choose one tool for user-local defaults',
          '选择一个要配置默认值的工具',
        ),
      },
    );
    if (!toolChoice) {
      return undefined;
    }

    const fieldChoice = await vscode.window.showQuickPick(
      VSCODE_EXTENSION_TOOL_USER_DEFAULT_KEY_SUFFIXES.map((keySuffix) => ({
        label: keySuffix,
        description: this.readCurrentUserConfigValue(
          secureAuthoring,
          `tools.${toolChoice.toolId}.${keySuffix}`,
        ),
        keyPath: `tools.${toolChoice.toolId}.${keySuffix}`,
      })),
      {
        title: this.localizer.localizeText(
          'Choose one tool default field',
          '选择一个工具默认值字段',
        ),
      },
    );
    return fieldChoice?.keyPath;
  }

  private async promptForUserConfigValue(
    keyPath: string,
    currentValue?: string,
  ): Promise<string | undefined> {
    if (keyPath === VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS.WORKSPACE_MODE) {
      const picked = await vscode.window.showQuickPick(
        Object.values(WorkspaceMode).map((value) => ({
          label: value,
          description:
            currentValue === value
              ? this.localizer.localizeText('Current value', '当前值')
              : undefined,
          value,
        })),
        {
          title: this.localizer.localizeText(
            'Choose one workspace mode preference',
            '选择一个工作区模式偏好',
          ),
        },
      );
      return picked?.value;
    }

    if (keyPath === VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS.REACT_THEME) {
      const picked = await vscode.window.showQuickPick(
        Array.from(CLI_REACT_THEME_VALUES).map((value) => ({
          label: value,
          description:
            currentValue === value
              ? this.localizer.localizeText('Current value', '当前值')
              : undefined,
          value,
        })),
        {
          title: this.localizer.localizeText(
            'Choose one React shell theme',
            '选择一个 React shell 主题',
          ),
        },
      );
      return picked?.value;
    }

    if (keyPath.endsWith('.transport')) {
      const picked = await vscode.window.showQuickPick(
        Object.values(AdapterTransportKind).map((value) => ({
          label: value,
          description:
            currentValue === value
              ? this.localizer.localizeText('Current value', '当前值')
              : undefined,
          value,
        })),
        {
          title: this.localizer.localizeText(
            'Choose one transport default',
            '选择一个 transport 默认值',
          ),
        },
      );
      return picked?.value;
    }

    if (keyPath.endsWith('.remoteApi.provider')) {
      const picked = await vscode.window.showQuickPick(
        Object.values(AdapterProviderKind).map((value) => ({
          label: value,
          description:
            currentValue === value
              ? this.localizer.localizeText('Current value', '当前值')
              : undefined,
          value,
        })),
        {
          title: this.localizer.localizeText(
            'Choose one remote API provider',
            '选择一个 Remote API Provider',
          ),
        },
      );
      return picked?.value;
    }

    if (keyPath.endsWith('.remoteApi.vendorBinding')) {
      const picked = await vscode.window.showQuickPick(
        Object.values(AdapterVendorBindingKind).map((value) => ({
          label: value,
          description:
            currentValue === value
              ? this.localizer.localizeText('Current value', '当前值')
              : undefined,
          value,
        })),
        {
          title: this.localizer.localizeText(
            'Choose one remote API vendor binding',
            '选择一个 Remote API vendor binding',
          ),
        },
      );
      return picked?.value;
    }

    return vscode.window.showInputBox({
      title: this.localizer.localizeText('Configure user-local default', '配置用户本地默认值'),
      prompt: this.localizer.localizeText(
        `Enter the value for ${keyPath}.`,
        `请输入 ${keyPath} 的值。`,
      ),
      value: currentValue,
      validateInput: (candidate) => {
        const normalizedCandidate = candidate.trim();
        if (normalizedCandidate.length === 0) {
          return this.localizer.localizeText('A value is required.', '请输入一个值。');
        }
        if (
          keyPath.endsWith('.remoteApi.credentialRef') &&
          !normalizedCandidate.startsWith(VSCODE_EXTENSION_SECRET_SELECTOR_PREFIX)
        ) {
          return this.localizer.localizeText(
            'credentialRef must use secret://... selector syntax.',
            'credentialRef 必须使用 secret://... selector 语法。',
          );
        }
        return undefined;
      },
    });
  }

  private async promptForManagedSecretKeyName(
    preselectedKeyName?: string,
    secureAuthoring?: VsCodeExtensionSecureAuthoringSnapshot,
  ): Promise<string | undefined> {
    if (preselectedKeyName) {
      return preselectedKeyName;
    }

    const candidateKeyNames = [
      ...(secureAuthoring?.secretReadiness?.configuredCredentialRefs ?? [])
        .map((selector) => this.extractManagedSecretKeyName(selector))
        .filter((value): value is string => Boolean(value)),
      ...(secureAuthoring?.secretReadiness?.records ?? []).map((record) => record.keyName),
    ];
    const uniqueKeyNames = [...new Set(candidateKeyNames)];

    if (uniqueKeyNames.length > 0) {
      const picked = await vscode.window.showQuickPick(
        [
          ...uniqueKeyNames.map((keyName) => ({
            label: keyName,
            description: this.localizer.localizeText('Managed secret key', '受管 secret key'),
            keyName,
          })),
          {
            label: this.localizer.localizeText('Custom key...', '自定义 key...'),
            description: this.localizer.localizeText(
              'Enter a different managed secret key name.',
              '输入另一个受管 secret key 名称。',
            ),
            keyName: '__custom__',
          },
        ],
        {
          title: this.localizer.localizeText(
            'Choose one managed secret key',
            '选择一个受管 secret key',
          ),
        },
      );
      if (!picked) {
        return undefined;
      }
      if (picked.keyName !== '__custom__') {
        return picked.keyName;
      }
    }

    return vscode.window.showInputBox({
      title: this.localizer.localizeText('Set managed secret', '设置受管 secret'),
      prompt: this.localizer.localizeText(
        'Enter the managed secret key name.',
        '请输入受管 secret key 名称。',
      ),
      validateInput: (candidate) =>
        candidate.trim().length > 0
          ? undefined
          : this.localizer.localizeText('Secret key name is required.', '请输入 secret key 名称。'),
    });
  }

  private async promptForManagedSecretBackend(
    secureAuthoring?: VsCodeExtensionSecureAuthoringSnapshot,
  ): Promise<string | undefined | false> {
    const secretReadiness = secureAuthoring?.secretReadiness;
    const availableBackends =
      secretReadiness?.backends.filter((backend) => backend.available) ?? [];
    const defaultBackend =
      availableBackends.find(
        (backend) => backend.backendId === secretReadiness?.selectedBackendId,
      ) ??
      availableBackends.find(
        (backend) => backend.backendId === secretReadiness?.defaultBackendId,
      ) ??
      availableBackends[0];
    if (availableBackends.length <= 1) {
      if (!defaultBackend?.warning) {
        return undefined;
      }

      return (await this.confirmWarningBearingManagedSecretBackend(defaultBackend))
        ? defaultBackend.backendId
        : false;
    }

    const picked = await vscode.window.showQuickPick(
      [
        {
          label: this.localizer.localizeText('Use CLI default backend', '使用 CLI 默认 backend'),
          description:
            secretReadiness?.selectedBackendId ??
            secretReadiness?.defaultBackendId ??
            this.localizer.localizeText('No explicit default reported', '当前没有显式默认值'),
          backendId: undefined,
        },
        ...availableBackends.map((backend) => ({
          label: backend.backendId,
          description: backend.warning
            ? this.localizer.localizeText('Available with warning', '可用但有警告')
            : backend.detail,
          detail: backend.detail,
          warning: backend.warning,
          backendId: backend.backendId,
        })),
      ],
      {
        title: this.localizer.localizeText(
          'Choose one backend for this secret mutation',
          '为这次 secret 写入选择一个 backend',
        ),
      },
    );
    if (!picked) {
      return false;
    }

    const selectedBackend =
      (picked.backendId
        ? availableBackends.find((backend) => backend.backendId === picked.backendId)
        : defaultBackend) ?? defaultBackend;
    if (selectedBackend?.warning) {
      return (await this.confirmWarningBearingManagedSecretBackend(selectedBackend))
        ? selectedBackend.backendId
        : false;
    }

    return picked.backendId;
  }

  private readCurrentUserConfigValue(
    secureAuthoring: VsCodeExtensionSecureAuthoringSnapshot | undefined,
    keyPath: string,
  ): string | undefined {
    const userConfig = secureAuthoring?.userConfig;
    if (!userConfig) {
      return undefined;
    }
    if (keyPath === VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS.REACT_THEME) {
      return userConfig.themePreference;
    }
    if (keyPath === VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS.WORKSPACE_MODE) {
      return userConfig.workspaceModePreference;
    }
    return userConfig.entries.find((entry) => entry.keyPath === keyPath)?.value;
  }

  private extractManagedSecretKeyName(selector: string): string | undefined {
    if (!selector.startsWith(VSCODE_EXTENSION_SECRET_SELECTOR_PREFIX)) {
      return undefined;
    }

    const keyName = selector.slice(VSCODE_EXTENSION_SECRET_SELECTOR_PREFIX.length).trim();
    return keyName.length > 0 ? keyName : undefined;
  }

  private async confirmWarningBearingManagedSecretBackend(backend: {
    backendId: string;
    warning?: string;
  }): Promise<boolean> {
    return this.confirmCommand(
      this.localizer.localizeText(
        `The ${backend.backendId} backend is warning-bearing and may store plaintext secrets locally. ${backend.warning ?? ''}`.trim(),
        `${backend.backendId} backend 带有警告，可能会在本地存储明文 secret。${backend.warning ?? ''}`.trim(),
      ),
      this.localizer.localizeText('Use Warning Backend', '继续使用告警 backend'),
    );
  }

  private async resolvePreferredHandoffTarget(commandRequest: VsCodeExtensionCommandRequest) {
    const queueEntryHandoffTarget = this.selectPreferredHandoffTarget(
      commandRequest.queueEntry?.handoffTargets,
    );
    if (queueEntryHandoffTarget) {
      return queueEntryHandoffTarget;
    }

    if (!commandRequest.executionId) {
      return undefined;
    }

    const executionEntry = await this.serviceRuntime.resolveExecutionBoardEntry(
      commandRequest.executionId,
    );
    if (!executionEntry) {
      return undefined;
    }

    return this.selectPreferredHandoffTarget(executionEntry.handoffTargets);
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

  /**
   * Keeps queue-only selections actionable when the execution-board window cannot rehydrate them.
   * @param handoffTargets Candidate handoff targets from queue or execution-board state.
   * @returns Highest-priority existing handoff target when one is available.
   */
  private selectPreferredHandoffTarget(
    handoffTargets?: readonly OrchestrationHandoffTarget[],
  ): OrchestrationHandoffTarget | undefined {
    if (!handoffTargets || handoffTargets.length === 0) {
      return undefined;
    }

    const targetPriority = [
      OrchestrationHandoffTargetKind.REVIEW_DOCUMENT,
      OrchestrationHandoffTargetKind.EDITOR,
      OrchestrationHandoffTargetKind.WORKTREE,
    ];
    return targetPriority
      .flatMap((targetKind) => handoffTargets.filter((target) => target.targetKind === targetKind))
      .find((target) => target.exists && target.targetPath);
  }

  private async revealWorkbenchContainer(): Promise<void> {
    await vscode.commands.executeCommand(
      `workbench.view.extension.${VSCODE_EXTENSION_CONTAINER_ID}`,
    );
  }

  /**
   * Normalizes raw VS Code tree-item context arguments into the command request contract.
   * @param commandRequest Optional direct request or tree-node descriptor from one inline action.
   * @returns One command request that can safely drive service-backed refresh and selection updates.
   */
  private normalizeCommandRequest(
    commandRequest?: VsCodeExtensionCommandRequest | VsCodeExtensionTreeNodeDescriptor,
  ): VsCodeExtensionCommandRequest | undefined {
    if (!commandRequest) {
      return undefined;
    }

    return 'nodeId' in commandRequest ? commandRequest.selectionRequest : commandRequest;
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

  private async resolveWorkspaceOperationRequest(
    commandRequest?: VsCodeExtensionCommandRequest,
  ): Promise<{
    commandRequest: VsCodeExtensionCommandRequest;
    operationKind: OrchestrationWorkspaceOperationKind;
    argumentsRecord?: VsCodeExtensionWorkspaceOperationArguments;
  } | null> {
    const mergedRequest = this.mergeCommandRequest(commandRequest);
    const requestContainsWorkspaceOperationKind = Boolean(
      commandRequest && 'workspaceOperationKind' in commandRequest,
    );
    const requestContainsTemporaryBridge = Boolean(
      commandRequest && 'temporaryBridge' in commandRequest,
    );
    if (requestContainsWorkspaceOperationKind && mergedRequest.workspaceOperationKind) {
      const argumentsRecord = await this.resolveWorkspaceOperationArguments(
        mergedRequest.workspaceOperationKind,
        mergedRequest.workspaceOperationArguments,
      );
      if (argumentsRecord === null) {
        return null;
      }

      return {
        commandRequest: mergedRequest,
        operationKind: mergedRequest.workspaceOperationKind,
        ...(argumentsRecord
          ? {
              argumentsRecord,
            }
          : {}),
      };
    }

    if (requestContainsTemporaryBridge && mergedRequest.temporaryBridge) {
      return this.resolveWorkspaceOperationRequestFromTemporaryBridge(
        mergedRequest,
        mergedRequest.temporaryBridge,
      );
    }

    if (mergedRequest.workspaceOperationKind) {
      const argumentsRecord = await this.resolveWorkspaceOperationArguments(
        mergedRequest.workspaceOperationKind,
        mergedRequest.workspaceOperationArguments,
      );
      if (argumentsRecord === null) {
        return null;
      }

      return {
        commandRequest: mergedRequest,
        operationKind: mergedRequest.workspaceOperationKind,
        ...(argumentsRecord
          ? {
              argumentsRecord,
            }
          : {}),
      };
    }

    if (mergedRequest.temporaryBridge) {
      return this.resolveWorkspaceOperationRequestFromTemporaryBridge(
        mergedRequest,
        mergedRequest.temporaryBridge,
      );
    }

    const promptedOperation = await this.promptForWorkspaceOperationRequest();
    if (!promptedOperation) {
      return null;
    }

    const argumentsRecord = await this.resolveWorkspaceOperationArguments(
      promptedOperation.workspaceOperationKind,
      promptedOperation.workspaceOperationArguments,
    );
    if (argumentsRecord === null) {
      return null;
    }

    return {
      commandRequest: promptedOperation,
      operationKind: promptedOperation.workspaceOperationKind,
      ...(argumentsRecord
        ? {
            argumentsRecord,
          }
        : {}),
    };
  }

  private async resolveWorkspaceOperationRequestFromTemporaryBridge(
    commandRequest: VsCodeExtensionCommandRequest,
    temporaryBridge: NonNullable<VsCodeExtensionCommandRequest['temporaryBridge']>,
  ): Promise<{
    commandRequest: VsCodeExtensionCommandRequest;
    operationKind: OrchestrationWorkspaceOperationKind;
    argumentsRecord?: VsCodeExtensionWorkspaceOperationArguments;
  } | null> {
    const operationKind =
      temporaryBridge.operationKind ??
      this.resolveWorkspaceOperationKindFromTemporaryBridge(temporaryBridge);
    if (!operationKind) {
      void vscode.window.showInformationMessage(
        this.localizer.localizeText(
          'This workspace operation is not service-backed yet.',
          '这个工作区操作目前还没有 service-backed 实现。',
        ),
      );
      return null;
    }

    const argumentsRecord = await this.resolveWorkspaceOperationArguments(
      operationKind,
      temporaryBridge.operationArguments,
    );
    if (argumentsRecord === null) {
      return null;
    }

    return {
      commandRequest,
      operationKind,
      ...(argumentsRecord
        ? {
            argumentsRecord,
          }
        : {}),
    };
  }

  private async promptForWorkspaceOperationRequest(): Promise<{
    workspaceOperationKind: OrchestrationWorkspaceOperationKind;
    workspaceOperationArguments?: VsCodeExtensionWorkspaceOperationArguments;
  } | null> {
    const queueOverview = await this.serviceRuntime.queryQueueOverview();
    const candidates = this.buildPromptableWorkspaceOperationRequests(
      queueOverview.temporaryBridges,
    );
    if (candidates.length === 0) {
      void vscode.window.showInformationMessage(
        this.localizer.localizeText(
          'No governed workspace operation is available right now.',
          '当前没有可用的受治理工作区操作。',
        ),
      );
      return null;
    }

    const picked = await vscode.window.showQuickPick(candidates, {
      title: this.localizer.localizeText(
        'Choose one governed repository operation',
        '选择一个受治理仓库操作',
      ),
      matchOnDescription: true,
      matchOnDetail: true,
      ignoreFocusOut: true,
    });
    if (!picked) {
      return null;
    }

    return {
      workspaceOperationKind: picked.workspaceOperationKind,
      ...(picked.workspaceOperationArguments
        ? {
            workspaceOperationArguments: {
              ...picked.workspaceOperationArguments,
            },
          }
        : {}),
    };
  }

  private buildPromptableWorkspaceOperationRequests(
    temporaryBridges: readonly NonNullable<VsCodeExtensionCommandRequest['temporaryBridge']>[],
  ): Array<
    vscode.QuickPickItem & {
      workspaceOperationKind: OrchestrationWorkspaceOperationKind;
      workspaceOperationArguments?: VsCodeExtensionWorkspaceOperationArguments;
    }
  > {
    const items: Array<
      vscode.QuickPickItem & {
        workspaceOperationKind: OrchestrationWorkspaceOperationKind;
        workspaceOperationArguments?: VsCodeExtensionWorkspaceOperationArguments;
      }
    > = [
      {
        label: this.localizeWorkspaceOperationKind(
          OrchestrationWorkspaceOperationKind.UPGRADE_PREVIEW,
        ),
        description: this.localizer.localizeText(
          'Inspect the latest upgrade plan before applying it.',
          '在应用升级前先查看最新升级计划。',
        ),
        detail: this.localizer.localizeText(
          'Runs the service-owned upgrade preview without applying changes.',
          '执行 service-owned 的升级预览，不会直接应用变更。',
        ),
        workspaceOperationKind: OrchestrationWorkspaceOperationKind.UPGRADE_PREVIEW,
      },
    ];

    for (const temporaryBridge of temporaryBridges) {
      const operationKind =
        temporaryBridge.operationKind ??
        this.resolveWorkspaceOperationKindFromTemporaryBridge(temporaryBridge);
      if (!operationKind) {
        continue;
      }

      items.push({
        label: this.localizeWorkspaceOperationKind(operationKind),
        description: this.localizer.localizeText(
          'Runs this repository operation through the local orchestration service.',
          '通过本地编排服务执行这个仓库操作。',
        ),
        detail: temporaryBridge.previewCommandLine,
        workspaceOperationKind: operationKind,
        ...(temporaryBridge.operationArguments
          ? {
              workspaceOperationArguments: {
                ...temporaryBridge.operationArguments,
              },
            }
          : {}),
      });
    }

    return items;
  }

  private async resolveWorkspaceOperationArguments(
    operationKind: OrchestrationWorkspaceOperationKind,
    argumentsRecord?: VsCodeExtensionWorkspaceOperationArguments,
  ): Promise<VsCodeExtensionWorkspaceOperationArguments | null | undefined> {
    const clonedArguments = argumentsRecord ? { ...argumentsRecord } : undefined;
    if (operationKind !== OrchestrationWorkspaceOperationKind.UPGRADE_APPLY) {
      return clonedArguments;
    }

    const confirmed = await this.confirmCommand(
      this.localizer.localizeText(
        'Applying this prepared upgrade may overwrite host-native assets. Continue?',
        '应用这个已准备好的升级可能会覆盖宿主原生资产。是否继续？',
      ),
      this.localizer.localizeText('Apply Upgrade', '应用升级'),
    );
    if (!confirmed) {
      return null;
    }

    return {
      ...clonedArguments,
      confirmUpgrade: VSCODE_EXTENSION_UPGRADE_CONFIRMATION_APPROVE,
    };
  }

  private resolveWorkspaceOperationKindFromTemporaryBridge(
    temporaryBridge: NonNullable<VsCodeExtensionCommandRequest['temporaryBridge']>,
  ): OrchestrationWorkspaceOperationKind | undefined {
    switch (temporaryBridge.capabilityClass) {
      case 'adopt_bootstrap':
        return OrchestrationWorkspaceOperationKind.ADOPT_BOOTSTRAP;
      case 'adoption_apply':
        return OrchestrationWorkspaceOperationKind.ADOPTION_APPLY;
      case 'host_export':
        return OrchestrationWorkspaceOperationKind.HOST_EXPORT;
      case 'host_verify':
        return OrchestrationWorkspaceOperationKind.HOST_VERIFY;
      case 'host_pack':
        return OrchestrationWorkspaceOperationKind.HOST_PACK;
      case 'upgrade':
        return OrchestrationWorkspaceOperationKind.UPGRADE_APPLY;
      default:
        return undefined;
    }
  }

  private async runWorkspaceOperationWithFeedback(
    operationKind: OrchestrationWorkspaceOperationKind,
    argumentsRecord?: Record<string, boolean | number | string | readonly string[] | null>,
    commandRequest?: VsCodeExtensionCommandRequest,
  ): Promise<void> {
    const response = await this.serviceRuntime.runWorkspaceOperation(
      operationKind,
      argumentsRecord,
    );
    this.selectionStore.applyCommandRequest(commandRequest);
    await this.refresh(commandRequest);

    const primaryArtifactPath = response.result.artifacts?.[0]?.path;
    const openArtifactLabel = this.localizer.localizeText('Open Artifact', '打开产物');
    const picked = await vscode.window.showInformationMessage(
      response.message,
      ...(primaryArtifactPath ? [openArtifactLabel] : []),
    );
    if (picked !== openArtifactLabel || !primaryArtifactPath) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(primaryArtifactPath));
    await vscode.window.showTextDocument(document, { preview: false });
  }

  private async runWorkspaceOperationWithHandledError(
    operationKind: OrchestrationWorkspaceOperationKind,
    argumentsRecord?: Record<string, boolean | number | string | readonly string[] | null>,
    commandRequest?: VsCodeExtensionCommandRequest,
  ): Promise<void> {
    try {
      await this.runWorkspaceOperationWithFeedback(operationKind, argumentsRecord, commandRequest);
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to execute the requested workspace operation.',
        '执行请求的工作区操作失败。',
      );
    }
  }

  private async promptForWorkflowTemplateId(title: string): Promise<string | null | undefined> {
    const value = await vscode.window.showInputBox({
      title,
      prompt: this.localizer.localizeText(
        'Optional: enter a workflow template id. Leave empty to use the runtime default.',
        '可选：输入工作流模板 ID；留空则使用运行时默认模板。',
      ),
      ignoreFocusOut: true,
    });

    if (value === undefined) {
      return null;
    }

    return value?.trim().length ? value.trim() : undefined;
  }

  private localizeWorkspaceOperationKind(
    operationKind: OrchestrationWorkspaceOperationKind,
  ): string {
    switch (operationKind) {
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
      default:
        return operationKind;
    }
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
