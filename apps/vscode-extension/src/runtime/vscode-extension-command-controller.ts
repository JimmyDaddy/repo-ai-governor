import { existsSync } from 'node:fs';
import { isAbsolute as isNativeAbsolutePath, win32 as win32Path } from 'node:path';

import * as vscode from 'vscode';

import { ProcessNodeType } from '@repo-ai-governor/core-process';
import {
  ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS,
  OrchestrationGovernanceActionDisabledReason,
  OrchestrationGovernanceActionKind,
  type OrchestrationHandoffTarget,
  OrchestrationHandoffTargetKind,
  OrchestrationWorkbenchBacklinkKind,
  OrchestrationWorkflowDraftEntryMode,
  OrchestrationWorkflowDraftSupportedPatchOp,
  OrchestrationWorkspaceOperationKind,
} from '@repo-ai-governor/orchestration-service-client';
import {
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  CLI_REACT_THEME_VALUES,
  GovernorErrorCode,
  RuntimeError,
  WorkspaceMode,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  VSCODE_EXTENSION_CHAT_COMMAND_IDS,
  VSCODE_EXTENSION_CONNECT_PRESET_IDS,
  VSCODE_EXTENSION_CONNECT_PRESET_ORDER,
  VSCODE_EXTENSION_CONNECT_TRANSPORT_OPTIONS,
  VSCODE_EXTENSION_CONTAINER_ID,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_ENTRYPOINT_KINDS,
  VSCODE_EXTENSION_SECRET_SELECTOR_PREFIX,
  VSCODE_EXTENSION_TOOL_USER_DEFAULT_KEY_SUFFIXES,
  VSCODE_EXTENSION_TRUST_MANAGE_COMMAND_ID,
  VSCODE_EXTENSION_UPGRADE_CONFIRMATION_APPROVE,
  VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS,
} from '../constants/index.js';
import type {
  VsCodeExtensionCommandRequest,
  VsCodeExtensionProviderOnboardingApplyRequest,
  VsCodeExtensionSecureAuthoringSnapshot,
  VsCodeExtensionTreeNodeDescriptor,
  VsCodeExtensionWorkflowDraftSessionSnapshot,
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

type VsCodeExtensionChatCommandExecutionStatus =
  | 'blocked'
  | 'cancelled'
  | 'completed'
  | 'dispatched'
  | 'failed';

export interface VsCodeExtensionChatCommandExecutionResult {
  commandName: string;
  status: VsCodeExtensionChatCommandExecutionStatus;
  summary: string;
  detail?: string;
}

type VsCodeExtensionWorkspaceOperationArguments = Record<
  string,
  boolean | number | string | readonly string[] | null
>;

type VsCodeExtensionChatPromptRoutingMode = 'full_prompt' | 'none' | 'suffix';

interface VsCodeExtensionResolvedChatRequest {
  commandName: string;
  promptText?: string;
}

interface VsCodeExtensionChatCommandExecutionHooks {
  onDidStart?: (event: VsCodeExtensionChatCommandStartEvent) => void;
}

interface VsCodeExtensionChatCommandStartEvent {
  commandName: string;
  promptText?: string;
  inferredFromPrompt: boolean;
  allowPendingRunningSummary: boolean;
}

interface VsCodeExtensionChatPromptIntentRule {
  commandName: string;
  promptRoutingMode: VsCodeExtensionChatPromptRoutingMode;
  exactPhrases?: readonly string[];
  leadingPhrases?: readonly string[];
}

interface VsCodeExtensionConnectOperationPlan {
  workspaceOperationArguments: VsCodeExtensionWorkspaceOperationArguments;
  providerOnboardingRequest?: VsCodeExtensionProviderOnboardingApplyRequest;
}

// literal-allowed: chat intent routing vocabulary is intentionally kept local to the controller
// because it tunes participant-only prompt matching without changing the frozen contribution
// contract exported from src/constants.
const VSCODE_EXTENSION_CHAT_POLITE_PREFIXES = [
  'please help',
  'could you',
  'would you',
  'can you',
  'help me',
  '请帮我',
  '麻烦你',
  'please',
  '帮我',
  '麻烦',
  '请',
] as const;

// literal-allowed: these regexes intentionally stay local to the chat controller because they
// recognize participant-only imperative phrasing that should reuse the governed `/doctor` path
// without widening the frozen slash-command contribution surface.
const VSCODE_EXTENSION_CHAT_WORKSPACE_DOCTOR_PATTERNS = [
  /^(?:diagnose|check)\s+(?:the\s+)?current\s+(?:workspace|project|repo)(?:[.?!])?$/iu,
  /^(?:诊断|检查|体检)(?:一下)?(?:当前|这个)?(?:项目|仓库|工作区)(?:的)?(?:环境|状态|健康状况)?(?:[吧呀啊呢吗])?(?:[.。!！?？])?$/u,
] as const;

const VSCODE_EXTENSION_CHAT_PROMPT_INTENT_RULES: readonly VsCodeExtensionChatPromptIntentRule[] = [
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.REFRESH,
    promptRoutingMode: 'none',
    exactPhrases: ['refresh', '刷新'],
    leadingPhrases: ['refresh governor', 'refresh views', 'reload governor', '刷新视图'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKSPACE_BOOTSTRAP,
    promptRoutingMode: 'none',
    exactPhrases: ['bootstrap', 'workspace bootstrap', '初始化工作区'],
    leadingPhrases: [
      'run bootstrap',
      'run workspace bootstrap',
      'bootstrap workspace',
      'initialize workspace',
      '初始化工作区',
      '运行工作区 bootstrap',
    ],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.CONNECT,
    promptRoutingMode: 'suffix',
    exactPhrases: ['connect', 'setup provider', '配置 provider', '连接 provider'],
    leadingPhrases: [
      'run connect',
      'connect provider',
      'connect tool',
      'setup provider',
      'setup ai provider',
      'configure provider',
      '连接 provider',
      '连接 ai provider',
      '配置 provider',
      '配置 ai provider',
      '连接工具',
    ],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.DOCTOR,
    promptRoutingMode: 'none',
    exactPhrases: ['doctor', '诊断'],
    leadingPhrases: [
      'run doctor',
      'execute doctor',
      'diagnose workspace',
      '运行 doctor',
      '执行 doctor',
      '环境诊断',
    ],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.CHECK,
    promptRoutingMode: 'none',
    exactPhrases: ['check', '检查'],
    leadingPhrases: [
      'run check',
      'execute check',
      'check workspace',
      '运行 check',
      '执行 check',
      '检查工作区',
      '检查仓库',
    ],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_PREVIEW,
    promptRoutingMode: 'suffix',
    exactPhrases: ['workflow preview', 'preview workflow', '工作流预览', '预览工作流'],
    leadingPhrases: ['workflow preview', 'preview workflow', '工作流预览', '预览工作流'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_CREATE,
    promptRoutingMode: 'suffix',
    exactPhrases: ['workflow create', 'create workflow', '工作流创建', '创建工作流'],
    leadingPhrases: ['workflow create', 'create workflow', '工作流创建', '创建工作流'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_EDIT,
    promptRoutingMode: 'suffix',
    exactPhrases: ['workflow edit', 'edit workflow', '工作流编辑', '编辑工作流'],
    leadingPhrases: ['workflow edit', 'edit workflow', '工作流编辑', '编辑工作流'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_WORKFLOW_STUDIO,
    promptRoutingMode: 'none',
    exactPhrases: ['workflow studio', 'workflow-studio', '工作流工作台'],
    leadingPhrases: [
      'open workflow studio',
      'show workflow studio',
      '打开 workflow studio',
      '打开工作流工作台',
    ],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_REVIEW_DETAIL,
    promptRoutingMode: 'none',
    exactPhrases: ['review detail', 'review-detail', '评审详情'],
    leadingPhrases: ['open review detail', 'show review detail', '打开评审详情'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_HANDOFF_TARGET,
    promptRoutingMode: 'none',
    exactPhrases: ['handoff target', 'handoff-target', '交接目标'],
    leadingPhrases: ['open handoff target', 'show handoff target', '打开交接目标'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE,
    promptRoutingMode: 'full_prompt',
    exactPhrases: [
      'repository operation',
      'upgrade',
      'upgrade preview',
      'preview upgrade',
      'upgrade apply',
      'apply upgrade',
      'host verify',
      'verify host',
      'host export',
      'export host',
      'host pack',
      'pack host',
      'adopt bootstrap',
      'bootstrap adopt',
      'adoption apply',
      'apply adoption',
      '仓库操作',
      '升级',
      '升级预览',
      '预览升级',
      '应用升级',
      '导出宿主资产',
      '校验宿主资产',
      '打包宿主 bundle',
    ],
    leadingPhrases: [
      'run repository operation',
      'run upgrade preview',
      'run apply upgrade',
      'run host verify',
      'run host export',
      'run host pack',
      'run adopt bootstrap',
      'run adoption apply',
      '执行仓库操作',
      '执行升级预览',
      '执行应用升级',
      '执行宿主导出',
      '执行宿主校验',
      '执行宿主打包',
    ],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.SUBMIT_HITL_DECISION,
    promptRoutingMode: 'none',
    exactPhrases: ['submit hitl decision', 'submit decision', 'hitl decision', '提交 hitl 决策'],
    leadingPhrases: ['submit hitl decision', 'submit decision', '提交审批决策'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.RECOVER_EXECUTION,
    promptRoutingMode: 'none',
    exactPhrases: ['recover execution', 'resume execution', '恢复执行'],
    leadingPhrases: ['recover execution', 'resume execution', '恢复执行'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.TERMINATE_EXECUTION,
    promptRoutingMode: 'none',
    exactPhrases: ['terminate execution', 'stop execution', 'cancel execution', '终止执行'],
    leadingPhrases: ['terminate execution', 'stop execution', 'cancel execution', '停止执行'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_USER_CONFIG,
    promptRoutingMode: 'none',
    exactPhrases: ['open user config', 'open config', '打开用户配置'],
    leadingPhrases: ['open user config', 'open config', '打开用户配置'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.CONFIGURE_USER_DEFAULT,
    promptRoutingMode: 'none',
    exactPhrases: ['configure user default', 'set user default', '配置用户默认值'],
    leadingPhrases: ['configure user default', 'set user default', '设置用户默认值'],
  },
  {
    commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.SET_MANAGED_SECRET,
    promptRoutingMode: 'none',
    exactPhrases: ['set managed secret', 'set secret', 'configure secret', '设置密钥'],
    leadingPhrases: [
      'set managed secret',
      'set secret',
      'configure secret',
      '设置 secret',
      '配置密钥',
    ],
  },
] as const;

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
   * Executes one chat request, resolving imperative natural-language prompts to the same
   * executable command surface used by explicit slash commands.
   *
   * Why this exists:
   * the chat participant should stay zero-duplication on command semantics while still letting
   * users trigger the governed command surface through short imperative prompts.
   * @param commandName Slash-command name when the user invoked one explicitly.
   * @param promptText Optional chat prompt text that may carry either suffix arguments or one
   * imperative natural-language request.
   * @returns One structured execution summary when the prompt resolves to an executable action.
   */
  public async executeChatRequest(
    commandName: string | undefined,
    promptText?: string,
    hooks?: VsCodeExtensionChatCommandExecutionHooks,
  ): Promise<VsCodeExtensionChatCommandExecutionResult | undefined> {
    const inferredFromPrompt = commandName === undefined;
    const resolvedChatRequest = inferredFromPrompt
      ? this.resolveChatPromptIntentRequest(promptText)
      : {
          commandName,
          promptText,
        };
    if (!resolvedChatRequest) {
      return undefined;
    }

    if (
      resolvedChatRequest.commandName !== VSCODE_EXTENSION_CHAT_COMMAND_IDS.STATUS &&
      resolvedChatRequest.commandName !== VSCODE_EXTENSION_CHAT_COMMAND_IDS.REVIEW
    ) {
      hooks?.onDidStart?.({
        commandName: resolvedChatRequest.commandName,
        promptText: resolvedChatRequest.promptText,
        inferredFromPrompt,
        allowPendingRunningSummary: this.shouldAllowPendingRunningSummary(
          resolvedChatRequest.commandName,
          resolvedChatRequest.promptText,
        ),
      });
    }

    return this.executeChatCommand(resolvedChatRequest.commandName, resolvedChatRequest.promptText);
  }

  /**
   * Executes one chat-exposed slash command against the existing workbench controller surface.
   *
   * Why this exists:
   * the chat participant should reuse the same service-backed controller contract as the activity-
   * bar workbench instead of inventing a second command path with different semantics.
   * @param commandName Slash-command name contributed by the chat participant.
   * @param promptText Optional free-form trailing text entered after the slash command.
   * @returns One structured execution summary when the slash command maps to an executable action.
   */
  public async executeChatCommand(
    commandName: string,
    promptText?: string,
  ): Promise<VsCodeExtensionChatCommandExecutionResult | undefined> {
    const trimmedPrompt = promptText?.trim();

    switch (commandName) {
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.STATUS:
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.REVIEW:
        return undefined;
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.REFRESH: {
        await this.refresh();
        return this.createChatCommandExecutionResult(
          commandName,
          'completed',
          'Governor views refreshed.',
          'Governor 视图已刷新。',
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKSPACE_BOOTSTRAP: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        const succeeded = await this.runWorkspaceOperationWithHandledError(
          OrchestrationWorkspaceOperationKind.WORKSPACE_BOOTSTRAP,
        );
        return succeeded
          ? this.createChatCommandExecutionResult(
              commandName,
              'completed',
              'Workspace bootstrap finished and the workbench snapshot was refreshed.',
              '工作区 bootstrap 已完成，Workbench 快照也已刷新。',
            )
          : this.createChatCommandExecutionResult(
              commandName,
              'failed',
              'Workspace bootstrap failed. Check the VS Code notification for details.',
              '工作区 bootstrap 失败。请查看 VS Code 通知里的详细信息。',
            );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.CONNECT: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }

        const connectSeedArguments =
          this.resolveConnectWorkspaceOperationArgumentsFromPrompt(trimmedPrompt);
        const succeeded = await this.runConnect({
          ...(connectSeedArguments
            ? {
                workspaceOperationArguments: connectSeedArguments,
              }
            : {}),
        });
        return succeeded
          ? this.createChatCommandExecutionResult(
              commandName,
              'completed',
              'Connect finished and the refreshed provider readiness is now available in the workbench.',
              'Connect 已完成，刷新后的 Provider Readiness 现在已经可在 Workbench 中查看。',
            )
          : this.createChatCommandExecutionResult(
              commandName,
              'failed',
              'Connect failed. Check the VS Code notification for details.',
              'Connect 失败。请查看 VS Code 通知里的详细信息。',
            );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.DOCTOR: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        const succeeded = await this.runWorkspaceOperationWithHandledError(
          OrchestrationWorkspaceOperationKind.DOCTOR,
        );
        return succeeded
          ? this.createChatCommandExecutionResult(
              commandName,
              'completed',
              'Doctor finished and the latest diagnostics were projected back into the workbench.',
              'Doctor 已完成，最新诊断结果也已回投到 Workbench。',
            )
          : this.createChatCommandExecutionResult(
              commandName,
              'failed',
              'Doctor failed. Check the VS Code notification for details.',
              'Doctor 失败。请查看 VS Code 通知里的详细信息。',
            );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.CHECK: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        const succeeded = await this.runWorkspaceOperationWithHandledError(
          OrchestrationWorkspaceOperationKind.CHECK,
        );
        return succeeded
          ? this.createChatCommandExecutionResult(
              commandName,
              'completed',
              'Check finished and the refreshed workbench snapshot is shown below.',
              'Check 已完成，下面展示的是刷新后的 Workbench 快照。',
            )
          : this.createChatCommandExecutionResult(
              commandName,
              'failed',
              'Check failed. Check the VS Code notification for details.',
              'Check 失败。请查看 VS Code 通知里的详细信息。',
            );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_PREVIEW: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        if (trimmedPrompt) {
          const resolvedTemplateId = await this.startWorkflowDraftFlow(
            OrchestrationWorkflowDraftEntryMode.READ_ONLY,
            trimmedPrompt,
          );
          return resolvedTemplateId
            ? this.createChatCommandExecutionResult(
                commandName,
                'completed',
                `Workflow preview draft is ready for template ${resolvedTemplateId}.`,
                `工作流预览草稿已就绪，模板为 ${resolvedTemplateId}。`,
              )
            : this.createChatCommandExecutionResult(
                commandName,
                'failed',
                'Workflow preview failed. Check the VS Code notification for details.',
                '工作流预览失败。请查看 VS Code 通知里的详细信息。',
              );
        }
        await this.runWorkflowPreview();
        return this.createChatCommandExecutionResult(
          commandName,
          'dispatched',
          'Workflow preview flow started from chat.',
          '工作流预览流程已从 chat 发起。',
          this.localizer.localizeText(
            'If no template id was supplied in chat, VS Code may ask for one before the preview runs.',
            '如果没有在 chat 里直接提供模板 ID，VS Code 可能会先要求你输入一个模板 ID。',
          ),
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_CREATE: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        if (trimmedPrompt) {
          const resolvedTemplateId = await this.startWorkflowDraftFlow(
            OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
            trimmedPrompt,
          );
          return resolvedTemplateId
            ? this.createChatCommandExecutionResult(
                commandName,
                'completed',
                `Workflow creation draft is ready for template ${resolvedTemplateId}.`,
                `工作流创建草稿已就绪，模板为 ${resolvedTemplateId}。`,
              )
            : this.createChatCommandExecutionResult(
                commandName,
                'failed',
                'Workflow creation failed. Check the VS Code notification for details.',
                '工作流创建失败。请查看 VS Code 通知里的详细信息。',
              );
        }
        await this.runWorkflowCreate();
        return this.createChatCommandExecutionResult(
          commandName,
          'dispatched',
          'Workflow creation flow started from chat.',
          '工作流创建流程已从 chat 发起。',
          this.localizer.localizeText(
            'If no template id was supplied in chat, VS Code may ask for one before the workflow entry is created.',
            '如果没有在 chat 里直接提供模板 ID，VS Code 可能会先要求你输入一个模板 ID，然后再创建工作流入口。',
          ),
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_EDIT: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        if (trimmedPrompt) {
          const succeeded = await this.startWorkflowDraftFlow(
            OrchestrationWorkflowDraftEntryMode.EDIT_SEED,
          );
          return succeeded
            ? this.createChatCommandExecutionResult(
                commandName,
                'completed',
                'Workflow edit draft is ready from the saved workflow definition.',
                '工作流编辑草稿已从已保存工作流定义载入。',
              )
            : this.createChatCommandExecutionResult(
                commandName,
                'failed',
                'Workflow edit failed. Check the VS Code notification for details.',
                '工作流编辑失败。请查看 VS Code 通知里的详细信息。',
              );
        }
        await this.runWorkflowEdit();
        return this.createChatCommandExecutionResult(
          commandName,
          'dispatched',
          'Workflow edit flow started from chat.',
          '工作流编辑流程已从 chat 发起。',
          this.localizer.localizeText(
            'This flow only opens the saved workflow definition; if none exists yet, VS Code will show an error instead of seeding a template.',
            '这个流程只会打开已保存工作流定义；如果当前还不存在，VS Code 会直接报错，而不会静默改成模板建稿。',
          ),
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_WORKFLOW_STUDIO: {
        await this.openWorkflowStudio();
        return this.createChatCommandExecutionResult(
          commandName,
          'completed',
          'Workflow Studio opened and refreshed.',
          'Workflow Studio 已打开并刷新。',
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_REVIEW_DETAIL: {
        await this.openReviewDetail();
        return this.createChatCommandExecutionResult(
          commandName,
          'completed',
          'Review Detail opened or refreshed.',
          '评审详情已打开或刷新。',
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_HANDOFF_TARGET: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        await this.openHandoffTarget();
        return this.createChatCommandExecutionResult(
          commandName,
          'dispatched',
          'Handoff-target flow ran from chat.',
          '交接目标流程已从 chat 发起。',
          this.localizer.localizeText(
            'If a preferred handoff target was available, VS Code opened the corresponding editor, explorer, or compatibility surface.',
            '如果有可用的首选交接目标，VS Code 会打开对应的编辑器、资源管理器或兼容表面。',
          ),
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        const promptOperation = trimmedPrompt
          ? this.resolveWorkspaceOperationRequestFromChatPrompt(trimmedPrompt)
          : undefined;
        if (promptOperation) {
          const resolvedArguments = await this.resolveWorkspaceOperationArguments(
            promptOperation.workspaceOperationKind,
            promptOperation.workspaceOperationArguments,
          );
          if (resolvedArguments === null) {
            return this.createChatCommandExecutionResult(
              commandName,
              'cancelled',
              'Repository operation was cancelled before execution.',
              '仓库操作在执行前已取消。',
            );
          }
          const succeeded = await this.runWorkspaceOperationWithHandledError(
            promptOperation.workspaceOperationKind,
            resolvedArguments ?? undefined,
            {
              workspaceOperationKind: promptOperation.workspaceOperationKind,
              ...(resolvedArguments
                ? {
                    workspaceOperationArguments: resolvedArguments,
                  }
                : {}),
            },
          );
          return succeeded
            ? this.createChatCommandExecutionResult(
                commandName,
                'completed',
                `${this.localizeWorkspaceOperationKind(promptOperation.workspaceOperationKind)} finished from chat.`,
                `${this.localizeWorkspaceOperationKind(promptOperation.workspaceOperationKind)} 已从 chat 完成。`,
                this.localizer.localizeText(
                  `Prompt resolved to "${trimmedPrompt}".`,
                  `已从提示解析出 "${trimmedPrompt}"。`,
                ),
              )
            : this.createChatCommandExecutionResult(
                commandName,
                'failed',
                'Repository operation failed. Check the VS Code notification for details.',
                '仓库操作失败。请查看 VS Code 通知里的详细信息。',
              );
        }
        await this.stageTemporaryBridge();
        return this.createChatCommandExecutionResult(
          commandName,
          'dispatched',
          'Repository-operation flow started from chat.',
          '仓库操作流程已从 chat 发起。',
          this.localizer.localizeText(
            'If the prompt did not name one supported operation, VS Code may ask you to choose a governed repository operation.',
            '如果 chat 文本没有明确命中一个受支持的操作，VS Code 可能会要求你再选择一个受治理仓库操作。',
          ),
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.SUBMIT_HITL_DECISION: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        await this.submitHitlDecision();
        return this.createChatCommandExecutionResult(
          commandName,
          'dispatched',
          'HITL decision flow started from chat.',
          'HITL 决策流程已从 chat 发起。',
          this.localizer.localizeText(
            'If more than one decision was available, VS Code may ask you to choose and confirm one.',
            '如果当前有多个可选决策，VS Code 可能会要求你先选择并确认一个。',
          ),
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.RECOVER_EXECUTION: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        await this.recoverExecution();
        return this.createChatCommandExecutionResult(
          commandName,
          'completed',
          'Execution recovery flow ran from chat.',
          '执行恢复流程已从 chat 发起。',
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.TERMINATE_EXECUTION: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        await this.terminateExecution();
        return this.createChatCommandExecutionResult(
          commandName,
          'dispatched',
          'Execution-termination flow started from chat.',
          '执行终止流程已从 chat 发起。',
          this.localizer.localizeText(
            'VS Code may ask for confirmation before the termination request is sent.',
            '在真正提交终止请求之前，VS Code 可能会要求你先确认一次。',
          ),
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_USER_CONFIG: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        await this.openUserConfig();
        return this.createChatCommandExecutionResult(
          commandName,
          'completed',
          'User-config flow finished from chat.',
          '用户配置流程已从 chat 完成。',
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.CONFIGURE_USER_DEFAULT: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        await this.configureUserDefault();
        return this.createChatCommandExecutionResult(
          commandName,
          'dispatched',
          'User-default authoring flow started from chat.',
          '用户默认值编写流程已从 chat 发起。',
          this.localizer.localizeText(
            'VS Code may ask you to choose one setting key and provide a value before the update is written.',
            '在真正写入前，VS Code 可能会要求你先选择一个设置键并输入对应的值。',
          ),
        );
      }
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.SET_MANAGED_SECRET: {
        if (this.isChatCommandTrustBlocked(commandName)) {
          return this.createBlockedChatCommandExecutionResult(commandName);
        }
        await this.setManagedSecret();
        return this.createChatCommandExecutionResult(
          commandName,
          'dispatched',
          'Managed-secret authoring flow started from chat.',
          '受管 secret 编写流程已从 chat 发起。',
          this.localizer.localizeText(
            'VS Code may ask you to choose a selector/backend and then capture the secret through a secure input box.',
            'VS Code 可能会要求你先选择 selector/backend，然后通过安全输入框采集 secret。',
          ),
        );
      }
      default:
        return undefined;
    }
  }

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
        this.createFocusedBacklinkHandoffTarget(mergedRequest) ??
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

  /**
   * Runs the plugin-native connect flow so provider onboarding no longer depends on manual CLI.
   * @param commandRequest Optional request carrying prefilled connect arguments from chat/buttons.
   * @returns True when the connect flow reached a successful completion.
   */
  public async runConnect(commandRequest?: VsCodeExtensionCommandRequest): Promise<boolean> {
    if (!(await this.ensureTrusted())) {
      return false;
    }

    try {
      const connectPlan = await this.resolveConnectOperationPlan(
        commandRequest?.workspaceOperationArguments,
      );
      if (!connectPlan) {
        return false;
      }

      const response = await this.serviceRuntime.runWorkspaceOperation(
        OrchestrationWorkspaceOperationKind.CONNECT,
        this.createConnectWorkspaceOperationArguments(connectPlan),
      );

      this.selectionStore.applyCommandRequest(commandRequest);
      await this.refresh(commandRequest);
      await this.showWorkspaceOperationCompletionMessage(response);
      return true;
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to connect the requested AI provider configuration.',
        '连接请求的 AI provider 配置失败。',
      );
      return false;
    }
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

  // god-object-exception: TK-1042 project-121 closeout keeps workflow-draft command flow in the
  // legacy controller until the tracked follow-up decomposition extracts a focused authoring seam.
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
    await this.startWorkflowDraftFlow(OrchestrationWorkflowDraftEntryMode.READ_ONLY, templateId);
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
    await this.startWorkflowDraftFlow(OrchestrationWorkflowDraftEntryMode.CREATE_SEED, templateId);
  }

  public async runWorkflowEdit(): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }
    await this.startWorkflowDraftFlow(OrchestrationWorkflowDraftEntryMode.EDIT_SEED);
  }

  public async mutateWorkflowDraft(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const mergedRequest = this.mergeCommandRequest(commandRequest);
      const draftSession = await this.requireWorkflowDraftSession(mergedRequest);
      const patchOp =
        mergedRequest.workflowDraftPatchOp ??
        OrchestrationWorkflowDraftSupportedPatchOp.UPSERT_NODE;
      this.assertWorkflowDraftPatchOpSupported(draftSession, patchOp);
      switch (patchOp) {
        case OrchestrationWorkflowDraftSupportedPatchOp.UPSERT_NODE:
          await this.applyWorkflowNodeMutation(draftSession);
          return;
        case OrchestrationWorkflowDraftSupportedPatchOp.REMOVE_NODE:
          await this.removeWorkflowNode(draftSession);
          return;
        case OrchestrationWorkflowDraftSupportedPatchOp.UPSERT_EDGE:
          await this.applyWorkflowEdgeMutation(draftSession);
          return;
        case OrchestrationWorkflowDraftSupportedPatchOp.REMOVE_EDGE:
          await this.removeWorkflowEdge(draftSession);
          return;
        case OrchestrationWorkflowDraftSupportedPatchOp.UPDATE_WORKFLOW_METADATA:
          await this.applyWorkflowMetadataMutation(draftSession);
          return;
        case OrchestrationWorkflowDraftSupportedPatchOp.UPDATE_NODE_POLICY:
          await this.applyWorkflowNodePolicyMutation(draftSession);
          return;
        default:
          throw new RuntimeError(
            GovernorErrorCode.AGENT_PROTOCOL_INVALID,
            this.localizer.localizeText(
              'The requested workflow draft mutation is not supported by the VS Code authoring baseline.',
              '当前 VS Code authoring 基线还不支持这个工作流草稿变更操作。',
            ),
            {
              workflowDraftPatchOp: patchOp,
            },
          );
      }
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to mutate the workflow draft session.',
        '修改工作流草稿会话失败。',
      );
    }
  }

  public async validateWorkflowDraft(
    commandRequest?: VsCodeExtensionCommandRequest,
  ): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const draftSession = await this.requireWorkflowDraftSession(
        this.mergeCommandRequest(commandRequest),
      );
      this.assertWorkflowDraftPatchOpSupported(
        draftSession,
        OrchestrationWorkflowDraftSupportedPatchOp.VALIDATE,
      );
      const response = await this.serviceRuntime.validateWorkflowDraft({
        workflowDraftId: draftSession.workflowDraftId,
        draftRevision: draftSession.draftRevision,
      });
      await this.handleWorkflowDraftMutationResponse(response);
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to validate the workflow draft session.',
        '校验工作流草稿会话失败。',
      );
    }
  }

  public async commitWorkflowDraft(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    if (!(await this.ensureTrusted())) {
      return;
    }

    try {
      const draftSession = await this.requireWorkflowDraftSession(
        this.mergeCommandRequest(commandRequest),
      );
      this.assertWorkflowDraftPatchOpSupported(
        draftSession,
        OrchestrationWorkflowDraftSupportedPatchOp.COMMIT,
      );
      const confirmed = await this.confirmCommand(
        this.localizer.localizeText(
          'Commit this workflow draft into the canonical workflow definition?',
          '要把这个工作流草稿提交到规范工作流定义吗？',
        ),
        this.localizer.localizeText('Commit Draft', '提交草稿'),
      );
      if (!confirmed) {
        return;
      }

      const response = await this.serviceRuntime.commitWorkflowDraft({
        workflowDraftId: draftSession.workflowDraftId,
        draftRevision: draftSession.draftRevision,
      });
      await this.handleWorkflowDraftMutationResponse(response);
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to commit the workflow draft session.',
        '提交工作流草稿会话失败。',
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
      const hitlAction = hitlEntry.actions.find(
        (entry) => entry.actionKind === OrchestrationGovernanceActionKind.SUBMIT_HITL_DECISION,
      );
      const hitlDecisionOptions = hitlAction?.hitlDecisionOptions ?? [];
      if (!hitlAction?.enabled || hitlDecisionOptions.length === 0) {
        void vscode.window.showInformationMessage(
          this.localizeHitlActionUnavailableReason(hitlAction?.disabledReason),
        );
        return;
      }

      const selectedOption =
        mergedRequest.hitlDecisionOption ?? (await this.promptForHitlDecisionOption(hitlAction));
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
        locale: vscode.env.language,
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

  private async resolveConnectOperationPlan(
    prefilledArguments?: VsCodeExtensionWorkspaceOperationArguments,
  ): Promise<VsCodeExtensionConnectOperationPlan | null> {
    const seedArguments = prefilledArguments ? { ...prefilledArguments } : {};
    if (this.hasExecutableConnectArguments(seedArguments)) {
      return {
        workspaceOperationArguments: seedArguments,
      };
    }

    const presetId =
      this.readConnectArgumentString(seedArguments, 'presetId') ??
      (await this.promptForConnectPreset());
    if (!presetId) {
      return null;
    }

    const connectScope = this.resolveConnectScopeFromArguments(seedArguments);
    const resolvedScope = connectScope ?? (await this.promptForConnectScope());
    if (!resolvedScope) {
      return null;
    }

    const workspaceOperationArguments: VsCodeExtensionWorkspaceOperationArguments = {
      presetId,
    };
    if (resolvedScope === 'preset_defaults') {
      return {
        workspaceOperationArguments,
      };
    }

    const selectedTool =
      this.readConnectSelectedTool(seedArguments) ?? (await this.promptForConnectTool());
    if (!selectedTool) {
      return null;
    }

    if (resolvedScope === 'single_tool_all_roles') {
      workspaceOperationArguments.singleToolAllRoles = selectedTool;
    } else {
      workspaceOperationArguments.tools = [selectedTool];
    }

    const resolvedTransport =
      this.readConnectTransportBinding(seedArguments, selectedTool) ??
      (await this.promptForConnectTransport(selectedTool));
    if (resolvedTransport === null) {
      return null;
    }
    if (resolvedTransport) {
      workspaceOperationArguments.toolTransportBindings = [`${selectedTool}=${resolvedTransport}`];
    }

    if (resolvedTransport !== AdapterTransportKind.REMOTE_API) {
      return {
        workspaceOperationArguments,
      };
    }

    const remoteApiProvider = await this.promptForConnectRemoteApiProvider(selectedTool);
    if (remoteApiProvider === false) {
      return null;
    }

    const snapshot = await this.serviceRuntime.resolveProviderOnboardingSnapshot(
      selectedTool,
      VSCODE_EXTENSION_PROVIDER_ONBOARDING_ENTRYPOINT_KINDS.QUICK_PICK_FORM,
      remoteApiProvider,
    );
    if (!snapshot) {
      return null;
    }

    const remoteApiModel =
      this.readConnectStringBinding(seedArguments, 'remoteApiModelBindings', selectedTool) ??
      (await this.promptForConnectModel(selectedTool));
    if (!remoteApiModel) {
      return null;
    }
    workspaceOperationArguments.remoteApiModelBindings = [
      `${selectedTool}=${remoteApiModel.trim()}`,
    ];

    const endpointValue = await this.promptForConnectEndpoint(selectedTool);
    if (endpointValue === undefined) {
      return null;
    }
    if (endpointValue.trim().length > 0) {
      workspaceOperationArguments.remoteApiEndpointBindings = [
        `${selectedTool}=${endpointValue.trim()}`,
      ];
    }

    const backendSelection = await this.promptForProviderOnboardingBackend(snapshot);
    if (backendSelection === false) {
      return null;
    }

    const secureAuthoring = await this.serviceRuntime.resolveSecureAuthoringSnapshot();
    const existingManagedSecretRecord = this.resolveManagedSecretRecord(
      secureAuthoring,
      snapshot.credentialRef,
      typeof backendSelection === 'string' ? backendSelection : undefined,
    );
    if (existingManagedSecretRecord) {
      if (backendSelection === existingManagedSecretRecord.backendId) {
        return {
          workspaceOperationArguments,
          providerOnboardingRequest: {
            tool: selectedTool,
            entrypointKind: VSCODE_EXTENSION_PROVIDER_ONBOARDING_ENTRYPOINT_KINDS.QUICK_PICK_FORM,
            provider: snapshot.provider,
            model: remoteApiModel.trim(),
            apiKey: '',
            reuseExistingCredential: true,
            endpoint: endpointValue.trim(),
            ...(typeof backendSelection === 'string'
              ? {
                  backendId: backendSelection,
                }
              : {}),
          },
        };
      }

      void vscode.window.showInformationMessage(
        this.localizer.localizeText(
          'Connect can reuse an existing managed secret on the same backend, but rotating the key or moving it to another backend still requires the dedicated managed-secret update flow.',
          'Connect 可以复用同一 backend 上已有的受管 secret，但若要轮换 key 或迁移到其他 backend，仍需使用专门的受管 secret 更新流程。',
        ),
      );
      return null;
    }

    const apiKey = await this.promptForProviderOnboardingApiKey(selectedTool, snapshot.provider);
    if (!apiKey) {
      return null;
    }

    return {
      workspaceOperationArguments,
      providerOnboardingRequest: {
        tool: selectedTool,
        entrypointKind: VSCODE_EXTENSION_PROVIDER_ONBOARDING_ENTRYPOINT_KINDS.QUICK_PICK_FORM,
        provider: snapshot.provider,
        model: remoteApiModel.trim(),
        apiKey,
        endpoint: endpointValue.trim(),
        ...(typeof backendSelection === 'string'
          ? {
              backendId: backendSelection,
            }
          : {}),
      },
    };
  }

  private hasExecutableConnectArguments(
    argumentsRecord: VsCodeExtensionWorkspaceOperationArguments,
  ): boolean {
    return this.readConnectArgumentString(argumentsRecord, 'presetId') !== undefined;
  }

  private createConnectWorkspaceOperationArguments(
    connectPlan: VsCodeExtensionConnectOperationPlan,
  ): VsCodeExtensionWorkspaceOperationArguments {
    if (!connectPlan.providerOnboardingRequest) {
      return connectPlan.workspaceOperationArguments;
    }

    return {
      ...connectPlan.workspaceOperationArguments,
      [ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.TOOL]:
        connectPlan.providerOnboardingRequest.tool,
      [ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.ENTRYPOINT_KIND]:
        connectPlan.providerOnboardingRequest.entrypointKind,
      [ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.MODEL]:
        connectPlan.providerOnboardingRequest.model,
      [ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.ENDPOINT]:
        connectPlan.providerOnboardingRequest.endpoint ?? '',
      ...(connectPlan.providerOnboardingRequest.reuseExistingCredential
        ? {
            [ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.REUSE_EXISTING_CREDENTIAL]: true,
          }
        : connectPlan.providerOnboardingRequest.apiKey.length > 0
          ? {
              [ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.API_KEY]:
                connectPlan.providerOnboardingRequest.apiKey,
            }
          : {}),
      ...(connectPlan.providerOnboardingRequest.provider
        ? {
            [ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.PROVIDER]:
              connectPlan.providerOnboardingRequest.provider,
          }
        : {}),
      ...(connectPlan.providerOnboardingRequest.backendId
        ? {
            [ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.BACKEND_ID]:
              connectPlan.providerOnboardingRequest.backendId,
          }
        : {}),
    };
  }

  private async promptForConnectPreset(): Promise<string | undefined> {
    const picked = await vscode.window.showQuickPick(
      VSCODE_EXTENSION_CONNECT_PRESET_ORDER.map((presetId) => ({
        label: presetId,
        description:
          presetId === VSCODE_EXTENSION_CONNECT_PRESET_IDS.MULTI_TOOL_DEFAULT
            ? this.localizer.localizeText('Recommended preset', '推荐预设')
            : undefined,
        detail: this.describeConnectPreset(presetId),
        presetId,
      })),
      {
        title: this.localizer.localizeText(
          'Choose one Governor connect preset',
          '选择一个 Governor connect 预设',
        ),
        ignoreFocusOut: true,
      },
    );
    return picked?.presetId;
  }

  private async promptForConnectScope(): Promise<
    'preset_defaults' | 'single_tool' | 'single_tool_all_roles' | undefined
  > {
    const picked = await vscode.window.showQuickPick(
      [
        {
          label: this.localizer.localizeText('Use preset defaults', '使用预设默认工具集合'),
          description: this.localizer.localizeText('Recommended', '推荐'),
          detail: this.localizer.localizeText(
            'Run connect with the preset-owned tool selection and routing defaults.',
            '按预设自带的工具集合和路由默认值执行 connect。',
          ),
          scopeId: 'preset_defaults' as const,
        },
        {
          label: this.localizer.localizeText('Configure one tool', '配置单个工具'),
          detail: this.localizer.localizeText(
            'Target one specific tool and optionally author remote API details.',
            '只针对一个工具执行，并可继续填写 Remote API 细节。',
          ),
          scopeId: 'single_tool' as const,
        },
        {
          label: this.localizer.localizeText(
            'Use one tool for all roles',
            '让一个工具承接全部角色',
          ),
          detail: this.localizer.localizeText(
            'Configure one tool and project it across every governed role.',
            '配置一个工具并把它投影到所有受治理角色。',
          ),
          scopeId: 'single_tool_all_roles' as const,
        },
      ],
      {
        title: this.localizer.localizeText(
          'Choose how Governor should connect this workspace',
          '选择 Governor 连接这个工作区的方式',
        ),
        ignoreFocusOut: true,
      },
    );

    return picked?.scopeId;
  }

  private async promptForConnectTool(): Promise<AdapterSurface | undefined> {
    const picked = await vscode.window.showQuickPick(
      Object.values(AdapterSurface).map((toolId) => ({
        label: toolId,
        description:
          toolId === AdapterSurface.CODEX
            ? this.localizer.localizeText('Recommended default', '推荐默认值')
            : undefined,
        toolId,
      })),
      {
        title: this.localizer.localizeText('Choose one tool to connect', '选择一个要连接的工具'),
        ignoreFocusOut: true,
      },
    );

    return picked?.toolId;
  }

  private async promptForConnectTransport(
    toolId: AdapterSurface,
  ): Promise<AdapterTransportKind | undefined | null> {
    const supportedTransports = VSCODE_EXTENSION_CONNECT_TRANSPORT_OPTIONS[toolId];
    const picked = await vscode.window.showQuickPick(
      [
        {
          label: this.localizer.localizeText('Use preset transport', '使用预设默认 transport'),
          description: this.localizer.localizeText(
            'Leaves transport resolution to the preset/default contract.',
            '交给预设/默认契约来决定 transport。',
          ),
          transport: undefined,
        },
        ...supportedTransports.map((transport) => ({
          label: transport,
          description:
            transport === AdapterTransportKind.REMOTE_API
              ? this.localizer.localizeText(
                  'Required when you want provider/model credentials in the plugin.',
                  '当你希望在插件里配置 provider/model/credential 时需要选择它。',
                )
              : undefined,
          transport,
        })),
      ],
      {
        title: this.localizer.localizeText(
          `Choose the transport for ${toolId}`,
          `为 ${toolId} 选择 transport`,
        ),
        ignoreFocusOut: true,
      },
    );

    if (!picked) {
      return null;
    }

    return picked.transport;
  }

  private async promptForConnectModel(toolId: AdapterSurface): Promise<string | undefined> {
    return vscode.window.showInputBox({
      title: this.localizer.localizeText('Configure remote API model', '配置 Remote API Model'),
      prompt: this.localizer.localizeText(
        `Enter the remote API model for ${toolId}.`,
        `请输入 ${toolId} 使用的 Remote API Model。`,
      ),
      ignoreFocusOut: true,
      validateInput: (candidate) =>
        candidate.trim().length > 0
          ? undefined
          : this.localizer.localizeText('Model is required.', '请输入模型名称。'),
    });
  }

  private async promptForConnectRemoteApiProvider(
    toolId: AdapterSurface,
  ): Promise<AdapterProviderKind | undefined | false> {
    const defaultProvider = this.resolveDefaultRemoteApiProvider(toolId);
    const picked = await vscode.window.showQuickPick(
      [
        {
          label: this.localizer.localizeText('Use tool default provider', '使用工具默认 provider'),
          description: defaultProvider,
          provider: undefined,
        },
        ...Object.values(AdapterProviderKind).map((provider) => ({
          label: provider,
          description:
            provider === defaultProvider
              ? this.localizer.localizeText('Tool default', '工具默认值')
              : undefined,
          provider,
        })),
      ],
      {
        title: this.localizer.localizeText(
          `Choose the remote API provider for ${toolId}`,
          `为 ${toolId} 选择 Remote API Provider`,
        ),
        ignoreFocusOut: true,
      },
    );

    if (!picked) {
      return false;
    }

    return picked.provider;
  }

  private async promptForProviderOnboardingApiKey(
    toolId: AdapterSurface,
    provider: AdapterProviderKind,
  ): Promise<string | undefined> {
    return vscode.window.showInputBox({
      title: this.localizer.localizeText('Enter provider API key', '输入 Provider API Key'),
      prompt: this.localizer.localizeText(
        `Enter the API key that ${toolId} should use with ${provider}. The key is written through the managed secret backend only.`,
        `输入 ${toolId} 连接 ${provider} 时使用的 API key。该 key 只会通过受管 secret backend 写入。`,
      ),
      password: true,
      ignoreFocusOut: true,
      validateInput: (candidate) =>
        candidate.trim().length > 0
          ? undefined
          : this.localizer.localizeText('API key is required.', '请输入 API key。'),
    });
  }

  private async promptForConnectEndpoint(toolId: AdapterSurface): Promise<string | undefined> {
    return vscode.window.showInputBox({
      title: this.localizer.localizeText(
        'Configure remote API endpoint',
        '配置 Remote API Endpoint',
      ),
      prompt: this.localizer.localizeText(
        `Optional: enter a custom endpoint for ${toolId}. Leave empty to keep the provider default endpoint.`,
        `可选：为 ${toolId} 输入自定义 Endpoint；留空则保留 Provider 默认 Endpoint。`,
      ),
      ignoreFocusOut: true,
    });
  }

  private async promptForProviderOnboardingBackend(snapshot: {
    selectedBackendId?: string;
    defaultBackendId?: string;
    availableBackends: ReadonlyArray<{
      backendId: string;
      available: boolean;
      detail: string;
      warning?: string;
    }>;
  }): Promise<string | undefined | false> {
    return this.promptForManagedSecretBackendSelection({
      availableBackends: snapshot.availableBackends,
      selectedBackendId: snapshot.selectedBackendId,
      defaultBackendId: snapshot.defaultBackendId,
    });
  }

  private resolveManagedSecretRecord(
    secureAuthoring: VsCodeExtensionSecureAuthoringSnapshot | undefined,
    selector: string,
    preferredBackendId?: string,
  ):
    | {
        backendId: string;
        keyName: string;
      }
    | undefined {
    const keyName = this.extractManagedSecretKeyName(selector);
    if (!keyName) {
      return undefined;
    }

    const records = secureAuthoring?.secretReadiness?.records;
    const record =
      (preferredBackendId
        ? records?.find(
            (candidate) =>
              candidate.keyName === keyName &&
              candidate.backendId === preferredBackendId &&
              candidate.exists,
          )
        : undefined) ??
      records?.find((candidate) => candidate.keyName === keyName && candidate.exists);
    return record
      ? {
          backendId: record.backendId,
          keyName: record.keyName,
        }
      : undefined;
  }

  private describeConnectPreset(presetId: string): string {
    switch (presetId) {
      case VSCODE_EXTENSION_CONNECT_PRESET_IDS.MULTI_TOOL_DEFAULT:
        return this.localizer.localizeText(
          'Primary human-facing preset that keeps multiple tools available.',
          '面向日常使用的主预设，会保留多个工具可用。',
        );
      case VSCODE_EXTENSION_CONNECT_PRESET_IDS.SINGLE_TOOL_MINIMAL:
        return this.localizer.localizeText(
          'Smallest connect footprint for one preferred tool.',
          '针对一个首选工具的最小连接方案。',
        );
      case VSCODE_EXTENSION_CONNECT_PRESET_IDS.SINGLE_TOOL_ALL_ROLES:
        return this.localizer.localizeText(
          'Projects one selected tool across every governed role.',
          '把一个选中的工具投影到所有受治理角色。',
        );
      case VSCODE_EXTENSION_CONNECT_PRESET_IDS.RESTRICTED_NETWORK_SAFE:
        return this.localizer.localizeText(
          'Safer preset for restricted-network environments.',
          '更适合受限网络环境的保守预设。',
        );
      default:
        return presetId;
    }
  }

  private resolveConnectScopeFromArguments(
    argumentsRecord: VsCodeExtensionWorkspaceOperationArguments,
  ): 'single_tool' | 'single_tool_all_roles' | undefined {
    if (this.readConnectArgumentString(argumentsRecord, 'singleToolAllRoles')) {
      return 'single_tool_all_roles';
    }

    return this.readConnectSelectedTool(argumentsRecord) ? 'single_tool' : undefined;
  }

  private readConnectSelectedTool(
    argumentsRecord: VsCodeExtensionWorkspaceOperationArguments,
  ): AdapterSurface | undefined {
    const singleToolAllRoles = this.readConnectArgumentString(
      argumentsRecord,
      'singleToolAllRoles',
    );
    if (
      singleToolAllRoles &&
      Object.values(AdapterSurface).includes(singleToolAllRoles as AdapterSurface)
    ) {
      return singleToolAllRoles as AdapterSurface;
    }

    const [requestedTool] = this.readConnectArgumentArray(argumentsRecord, 'tools');
    return requestedTool && Object.values(AdapterSurface).includes(requestedTool as AdapterSurface)
      ? (requestedTool as AdapterSurface)
      : undefined;
  }

  private readConnectTransportBinding(
    argumentsRecord: VsCodeExtensionWorkspaceOperationArguments,
    toolId: AdapterSurface,
  ): AdapterTransportKind | undefined {
    const bindingValue =
      this.readConnectStringBinding(argumentsRecord, 'toolTransportBindings', toolId) ??
      this.readConnectStringBinding(argumentsRecord, 'toolTransport', toolId);
    return bindingValue &&
      Object.values(AdapterTransportKind).includes(bindingValue as AdapterTransportKind)
      ? (bindingValue as AdapterTransportKind)
      : undefined;
  }

  private readConnectStringBinding(
    argumentsRecord: VsCodeExtensionWorkspaceOperationArguments,
    key: string,
    toolId: AdapterSurface,
  ): string | undefined {
    for (const binding of this.readConnectArgumentArray(argumentsRecord, key)) {
      const separatorIndex = binding.indexOf('=');
      if (separatorIndex <= 0) {
        continue;
      }

      const bindingToolId = binding.slice(0, separatorIndex).trim();
      const bindingValue = binding.slice(separatorIndex + 1).trim();
      if (bindingToolId === toolId && bindingValue.length > 0) {
        return bindingValue;
      }
    }

    return undefined;
  }

  private readConnectArgumentString(
    argumentsRecord: VsCodeExtensionWorkspaceOperationArguments,
    key: string,
  ): string | undefined {
    const value = argumentsRecord[key];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  private readConnectArgumentArray(
    argumentsRecord: VsCodeExtensionWorkspaceOperationArguments,
    key: string,
  ): string[] {
    const value = argumentsRecord[key];
    if (Array.isArray(value)) {
      return value.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
      );
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }

    return [];
  }

  private resolveDefaultRemoteApiProvider(toolId: AdapterSurface): AdapterProviderKind {
    return toolId === AdapterSurface.CLAUDE_CODE
      ? AdapterProviderKind.ANTHROPIC
      : AdapterProviderKind.OPENAI;
  }

  private async promptForManagedSecretBackendSelection(options: {
    availableBackends: ReadonlyArray<{
      backendId: string;
      available: boolean;
      detail: string;
      warning?: string;
    }>;
    selectedBackendId?: string;
    defaultBackendId?: string;
  }): Promise<string | undefined | false> {
    const availableBackends = options.availableBackends.filter((backend) => backend.available);
    if (availableBackends.length === 0) {
      return false;
    }
    const defaultBackend =
      availableBackends.find((backend) => backend.backendId === options.selectedBackendId) ??
      availableBackends.find((backend) => backend.backendId === options.defaultBackendId) ??
      availableBackends[0];
    if (availableBackends.length <= 1) {
      if (!defaultBackend) {
        return undefined;
      }
      if (!defaultBackend.warning) {
        return defaultBackend.backendId;
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
            options.defaultBackendId ??
            options.selectedBackendId ??
            this.localizer.localizeText('No explicit default reported', '当前没有显式默认值'),
          backendId:
            options.defaultBackendId ?? options.selectedBackendId ?? defaultBackend?.backendId,
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
    const clearWorkflowFocus = commandRequest?.clearWorkflowFocus === true;
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
      workflowDraftId:
        commandRequest && 'workflowDraftId' in commandRequest
          ? commandRequest.workflowDraftId
          : selection.workflowDraftId,
      workflowDraftRevision:
        commandRequest && 'workflowDraftRevision' in commandRequest
          ? commandRequest.workflowDraftRevision
          : selection.workflowDraftRevision,
      workflowFocusStageId:
        clearExecutionSelection || clearWorkflowFocus
          ? undefined
          : commandRequest && 'workflowFocusStageId' in commandRequest
            ? commandRequest.workflowFocusStageId
            : selection.workflowFocusStageId,
      workflowFocusBacklinkTarget:
        clearExecutionSelection || clearWorkflowFocus
          ? undefined
          : commandRequest && 'workflowFocusBacklinkTarget' in commandRequest
            ? commandRequest.workflowFocusBacklinkTarget
            : selection.workflowFocusBacklinkTarget,
      workflowFocusBacklinkKind:
        clearExecutionSelection || clearWorkflowFocus
          ? undefined
          : commandRequest && 'workflowFocusBacklinkKind' in commandRequest
            ? commandRequest.workflowFocusBacklinkKind
            : selection.workflowFocusBacklinkKind,
      ...(clearExecutionSelection
        ? {
            clearExecutionSelection: true,
          }
        : {}),
      ...(clearWorkflowFocus
        ? {
            clearWorkflowFocus: true,
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
      ...(commandRequest && 'workflowDraftEntryMode' in commandRequest
        ? {
            workflowDraftEntryMode: commandRequest.workflowDraftEntryMode,
          }
        : {}),
      ...(commandRequest && 'workflowDraftPatchOp' in commandRequest
        ? {
            workflowDraftPatchOp: commandRequest.workflowDraftPatchOp,
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
    return this.promptForManagedSecretBackendSelection({
      availableBackends: secretReadiness?.backends ?? [],
      selectedBackendId: secretReadiness?.selectedBackendId,
      defaultBackendId: secretReadiness?.defaultBackendId,
    });
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

  private createFocusedBacklinkHandoffTarget(
    commandRequest: VsCodeExtensionCommandRequest,
  ): OrchestrationHandoffTarget | undefined {
    if (
      !commandRequest.workflowFocusBacklinkTarget ||
      !commandRequest.workflowFocusBacklinkKind ||
      !this.isAbsoluteHandoffPath(commandRequest.workflowFocusBacklinkTarget)
    ) {
      return undefined;
    }

    const targetPath = commandRequest.workflowFocusBacklinkTarget;
    return {
      targetId: `workflow-studio:${commandRequest.workflowFocusBacklinkKind}:${targetPath}`,
      executionId:
        commandRequest.executionId ?? `workflow-studio:${commandRequest.workflowFocusBacklinkKind}`,
      targetKind:
        commandRequest.workflowFocusBacklinkKind === OrchestrationWorkbenchBacklinkKind.REVIEW
          ? OrchestrationHandoffTargetKind.REVIEW_DOCUMENT
          : commandRequest.workflowFocusBacklinkKind ===
              OrchestrationWorkbenchBacklinkKind.WORKSPACE
            ? OrchestrationHandoffTargetKind.WORKTREE
            : OrchestrationHandoffTargetKind.EDITOR,
      targetPath,
      exists: existsSync(targetPath),
    };
  }

  private isAbsoluteHandoffPath(targetPath: string): boolean {
    return isNativeAbsolutePath(targetPath) || win32Path.isAbsolute(targetPath);
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

  private async promptForHitlDecisionOption(hitlAction?: {
    hitlDecisionOptions?: readonly { optionId: string; decision: string; resumeAction: string }[];
  }) {
    const options = hitlAction?.hitlDecisionOptions ?? [];
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

  private localizeHitlActionUnavailableReason(
    reason?: OrchestrationGovernanceActionDisabledReason,
  ): string {
    switch (reason) {
      case OrchestrationGovernanceActionDisabledReason.HITL_DECISION_UNAVAILABLE:
        return this.localizer.localizeText(
          'No allowed HITL decision is available right now.',
          '当前没有可提交的合法 HITL 决策。',
        );
      case OrchestrationGovernanceActionDisabledReason.HITL_NOT_PENDING:
        return this.localizer.localizeText(
          'No pending HITL decision is available right now.',
          '当前没有可处理的 HITL 决策。',
        );
      default:
        return this.localizer.localizeText(
          'The HITL action is currently unavailable.',
          '当前 HITL 动作不可用。',
        );
    }
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
    await this.showWorkspaceOperationCompletionMessage(response);
  }

  private async showWorkspaceOperationCompletionMessage(response: {
    message: string;
    result: {
      artifacts?: Array<{
        path: string;
      }>;
    };
  }): Promise<void> {
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
  ): Promise<boolean> {
    try {
      await this.runWorkspaceOperationWithFeedback(operationKind, argumentsRecord, commandRequest);
      return true;
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to execute the requested workspace operation.',
        '执行请求的工作区操作失败。',
      );
      return false;
    }
  }

  private async startWorkflowDraftFlow(
    entryMode: OrchestrationWorkflowDraftEntryMode,
    templateId?: string,
  ): Promise<string | undefined> {
    try {
      const existingDraftSession = await this.serviceRuntime.queryWorkflowDraftSessionStrict({
        preferLatest: true,
      });
      const replaceExistingDraftSession =
        existingDraftSession && this.isMutableWorkflowDraftSession(existingDraftSession)
          ? await this.confirmWorkflowDraftReplacement(existingDraftSession, entryMode)
          : false;
      if (existingDraftSession && this.isMutableWorkflowDraftSession(existingDraftSession)) {
        if (!replaceExistingDraftSession) {
          return undefined;
        }
      }

      const response = await this.serviceRuntime.startWorkflowDraft({
        entryMode,
        ...(replaceExistingDraftSession
          ? {
              replaceExistingDraftSession: true,
            }
          : {}),
        ...(templateId
          ? {
              templateId,
            }
          : {}),
      });
      await this.handleWorkflowDraftMutationResponse(response, {
        workflowDraftEntryMode: response.draftSession.entryMode,
      });
      return response.applied ? response.draftSession.templateId : undefined;
    } catch (error) {
      await this.showCommandError(
        error,
        'Failed to start the workflow draft session.',
        '启动工作流草稿会话失败。',
      );
      return undefined;
    }
  }

  private async requireWorkflowDraftSession(
    commandRequest?: VsCodeExtensionCommandRequest,
  ): Promise<VsCodeExtensionWorkflowDraftSessionSnapshot> {
    const request = this.mergeCommandRequest(commandRequest);
    const workflowDraftSession = await this.serviceRuntime.queryWorkflowDraftSessionStrict(
      request.workflowDraftId
        ? {
            workflowDraftId: request.workflowDraftId,
          }
        : {
            preferLatest: true,
          },
    );
    if (workflowDraftSession) {
      if (
        request.workflowDraftRevision &&
        request.workflowDraftRevision !== workflowDraftSession.draftRevision
      ) {
        throw new RuntimeError(
          GovernorErrorCode.AGENT_PROTOCOL_INVALID,
          this.localizer.localizeText(
            'The workflow draft revision in the current view is stale. Refresh Workflow Studio before continuing.',
            '当前视图中的工作流草稿 revision 已过期；请先刷新 Workflow Studio 再继续。',
          ),
          {
            requestedWorkflowDraftRevision: request.workflowDraftRevision,
            latestWorkflowDraftRevision: workflowDraftSession.draftRevision,
          },
        );
      }
      return workflowDraftSession;
    }

    throw new RuntimeError(
      GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
      this.localizer.localizeText(
        'No workflow draft session is available yet. Start preview, create, or edit first.',
        '当前还没有可用的工作流草稿会话；请先启动预览、创建或编辑流程。',
      ),
    );
  }

  private async applyWorkflowNodeMutation(
    draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot,
  ): Promise<void> {
    type WorkflowNodeActionItem =
      | {
          label: string;
          description: string;
          mode: 'create';
        }
      | {
          label: string;
          description: string;
          mode: 'edit';
          node: VsCodeExtensionWorkflowDraftSessionSnapshot['nodeSpecs'][number];
        };

    const existingChoice: WorkflowNodeActionItem | undefined =
      draftSession.nodeSpecs.length > 0
        ? await vscode.window.showQuickPick<WorkflowNodeActionItem>(
            [
              {
                label: this.localizer.localizeText('Create new node', '创建新节点'),
                description: this.localizer.localizeText(
                  'Append one schema-first workflow node.',
                  '追加一个 schema-first 工作流节点。',
                ),
                mode: 'create' as const,
              },
              ...draftSession.nodeSpecs.map(
                (node: VsCodeExtensionWorkflowDraftSessionSnapshot['nodeSpecs'][number]) => ({
                  label: node.nodeId,
                  description: `${node.stageId} · ${node.routeKey} · ${node.roleProfileId}`,
                  mode: 'edit' as const,
                  node,
                }),
              ),
            ],
            {
              title: this.localizer.localizeText(
                'Choose a workflow node authoring action',
                '选择一个工作流节点编辑动作',
              ),
            },
          )
        : {
            label: this.localizer.localizeText('Create new node', '创建新节点'),
            description: this.localizer.localizeText(
              'Append one schema-first workflow node.',
              '追加一个 schema-first 工作流节点。',
            ),
            mode: 'create' as const,
          };
    if (!existingChoice) {
      return;
    }

    const existingNode = 'node' in existingChoice ? existingChoice.node : undefined;
    const nodeId =
      existingNode?.nodeId ??
      (await this.promptForRequiredText(
        this.localizer.localizeText('Workflow node id', '工作流节点 ID'),
        this.localizer.localizeText(
          'Enter one stable node identifier.',
          '输入一个稳定的节点标识。',
        ),
      ));
    if (!nodeId) {
      return;
    }
    const nodeType = await this.promptForWorkflowNodeType(existingNode?.nodeType);
    if (!nodeType) {
      return;
    }
    const stageId = await this.promptForRequiredText(
      this.localizer.localizeText('Stage id', '阶段 ID'),
      this.localizer.localizeText('Enter the stage id for this node.', '输入该节点的阶段 ID。'),
      existingNode?.stageId,
    );
    if (!stageId) {
      return;
    }
    const routeKey = await this.promptForRequiredText(
      this.localizer.localizeText('Route key', '路由键'),
      this.localizer.localizeText('Enter the route key for this node.', '输入该节点的路由键。'),
      existingNode?.routeKey,
    );
    if (!routeKey) {
      return;
    }
    const roleProfileId = await this.promptForRequiredText(
      this.localizer.localizeText('Role profile id', '角色配置 ID'),
      this.localizer.localizeText(
        'Enter the role profile id used by this node.',
        '输入该节点使用的角色配置 ID。',
      ),
      existingNode?.roleProfileId,
    );
    if (!roleProfileId) {
      return;
    }
    const inputSchemaRef = await this.promptForOptionalText(
      this.localizer.localizeText('Input schema ref', '输入 schema ref'),
      this.localizer.localizeText(
        'Optional: enter the input schema reference.',
        '可选：输入输入 schema 引用。',
      ),
      existingNode?.inputSchemaRef,
    );
    if (inputSchemaRef === null) {
      return;
    }
    const outputSchemaRef = await this.promptForOptionalText(
      this.localizer.localizeText('Output schema ref', '输出 schema ref'),
      this.localizer.localizeText(
        'Optional: enter the output schema reference.',
        '可选：输入输出 schema 引用。',
      ),
      existingNode?.outputSchemaRef,
    );
    if (outputSchemaRef === null) {
      return;
    }
    const retryPolicyRef = await this.promptForOptionalText(
      this.localizer.localizeText('Retry policy ref', '重试策略 ref'),
      this.localizer.localizeText(
        'Optional: enter the retry policy reference.',
        '可选：输入重试策略引用。',
      ),
      existingNode?.retryPolicyRef,
    );
    if (retryPolicyRef === null) {
      return;
    }
    const timeoutPolicyRef = await this.promptForOptionalText(
      this.localizer.localizeText('Timeout policy ref', '超时策略 ref'),
      this.localizer.localizeText(
        'Optional: enter the timeout policy reference.',
        '可选：输入超时策略引用。',
      ),
      existingNode?.timeoutPolicyRef,
    );
    if (timeoutPolicyRef === null) {
      return;
    }
    const budgetPolicyRef = await this.promptForOptionalText(
      this.localizer.localizeText('Budget policy ref', '预算策略 ref'),
      this.localizer.localizeText(
        'Optional: enter the budget policy reference.',
        '可选：输入预算策略引用。',
      ),
      existingNode?.budgetPolicyRef,
    );
    if (budgetPolicyRef === null) {
      return;
    }
    const maxCycles =
      nodeType === ProcessNodeType.LOOP
        ? await this.promptForOptionalNumber(
            this.localizer.localizeText('Loop max cycles', '循环最大轮次'),
            this.localizer.localizeText(
              'Optional: enter the max cycle count for loop nodes.',
              '可选：输入循环节点的最大轮次。',
            ),
            existingNode?.maxCycles,
          )
        : undefined;
    if (maxCycles === null) {
      return;
    }
    const maxWallTimeSeconds =
      nodeType === ProcessNodeType.LOOP
        ? await this.promptForOptionalNumber(
            this.localizer.localizeText('Loop max wall time (seconds)', '循环最大墙钟时间（秒）'),
            this.localizer.localizeText(
              'Optional: enter the max wall time in seconds for loop nodes.',
              '可选：输入循环节点的最大墙钟时间（秒）。',
            ),
            existingNode?.maxWallTimeSeconds,
          )
        : undefined;
    if (maxWallTimeSeconds === null) {
      return;
    }

    const response = await this.serviceRuntime.updateWorkflowDraftNode({
      workflowDraftId: draftSession.workflowDraftId,
      draftRevision: draftSession.draftRevision,
      nodeId,
      nodeSpec: {
        nodeId,
        stageId,
        nodeType,
        routeKey,
        roleProfileId,
        ...(inputSchemaRef !== undefined
          ? {
              inputSchemaRef,
            }
          : {}),
        ...(outputSchemaRef !== undefined
          ? {
              outputSchemaRef,
            }
          : {}),
        ...(retryPolicyRef !== undefined
          ? {
              retryPolicyRef,
            }
          : {}),
        ...(timeoutPolicyRef !== undefined
          ? {
              timeoutPolicyRef,
            }
          : {}),
        ...(budgetPolicyRef !== undefined
          ? {
              budgetPolicyRef,
            }
          : {}),
        ...(maxCycles !== undefined
          ? {
              maxCycles,
            }
          : {}),
        ...(maxWallTimeSeconds !== undefined
          ? {
              maxWallTimeSeconds,
            }
          : {}),
      },
    });
    await this.handleWorkflowDraftMutationResponse(response);
  }

  private async removeWorkflowNode(
    draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot,
  ): Promise<void> {
    if (draftSession.nodeSpecs.length === 0) {
      void vscode.window.showInformationMessage(
        this.localizer.localizeText(
          'No workflow node is available to remove.',
          '当前没有可移除的工作流节点。',
        ),
      );
      return;
    }

    const pickedNode = await vscode.window.showQuickPick<{
      label: string;
      description: string;
      node: VsCodeExtensionWorkflowDraftSessionSnapshot['nodeSpecs'][number];
    }>(
      draftSession.nodeSpecs.map(
        (node: VsCodeExtensionWorkflowDraftSessionSnapshot['nodeSpecs'][number]) => ({
          label: node.nodeId,
          description: `${node.stageId} · ${node.routeKey} · ${node.roleProfileId}`,
          node,
        }),
      ),
      {
        title: this.localizer.localizeText(
          'Choose one workflow node to remove',
          '选择一个要移除的工作流节点',
        ),
      },
    );
    if (!pickedNode) {
      return;
    }

    const response = await this.serviceRuntime.updateWorkflowDraftNode({
      workflowDraftId: draftSession.workflowDraftId,
      draftRevision: draftSession.draftRevision,
      nodeId: pickedNode.node.nodeId,
      remove: true,
    });
    await this.handleWorkflowDraftMutationResponse(response);
  }

  private async applyWorkflowEdgeMutation(
    draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot,
  ): Promise<void> {
    if (draftSession.nodeSpecs.length < 2) {
      void vscode.window.showInformationMessage(
        this.localizer.localizeText(
          'At least two workflow nodes are required before you can author an edge.',
          '至少需要两个工作流节点后才能编辑连线。',
        ),
      );
      return;
    }

    type WorkflowEdgeActionItem =
      | {
          label: string;
          description: string;
          mode: 'create';
        }
      | {
          label: string;
          description: string;
          mode: 'edit';
          edge: VsCodeExtensionWorkflowDraftSessionSnapshot['edgeSpecs'][number];
        };

    const existingChoice: WorkflowEdgeActionItem | undefined =
      draftSession.edgeSpecs.length > 0
        ? await vscode.window.showQuickPick<WorkflowEdgeActionItem>(
            [
              {
                label: this.localizer.localizeText('Create new edge', '创建新连线'),
                description: this.localizer.localizeText(
                  'Append one workflow edge between two nodes.',
                  '在两个节点之间追加一条工作流连线。',
                ),
                mode: 'create' as const,
              },
              ...draftSession.edgeSpecs.map(
                (edge: VsCodeExtensionWorkflowDraftSessionSnapshot['edgeSpecs'][number]) => ({
                  label: `${edge.fromNodeId} -> ${edge.toNodeId}`,
                  description:
                    edge.conditionKey ?? this.localizer.localizeText('No condition', '无条件'),
                  mode: 'edit' as const,
                  edge,
                }),
              ),
            ],
            {
              title: this.localizer.localizeText(
                'Choose a workflow edge authoring action',
                '选择一个工作流连线编辑动作',
              ),
            },
          )
        : {
            label: this.localizer.localizeText('Create new edge', '创建新连线'),
            description: this.localizer.localizeText(
              'Append one workflow edge between two nodes.',
              '在两个节点之间追加一条工作流连线。',
            ),
            mode: 'create' as const,
          };
    if (!existingChoice) {
      return;
    }

    const existingEdge = 'edge' in existingChoice ? existingChoice.edge : undefined;
    const fromNode = await this.promptForWorkflowNodeChoice(
      draftSession,
      this.localizer.localizeText('Choose the source node', '选择源节点'),
      existingEdge?.fromNodeId,
      this.localizer.localizeText('Current source node', '当前源节点'),
    );
    if (!fromNode) {
      return;
    }
    const toNode = await this.promptForWorkflowNodeChoice(
      draftSession,
      this.localizer.localizeText('Choose the target node', '选择目标节点'),
      existingEdge?.toNodeId,
      this.localizer.localizeText('Current target node', '当前目标节点'),
    );
    if (!toNode) {
      return;
    }
    const conditionKey = await this.promptForOptionalText(
      this.localizer.localizeText('Condition key', '条件键'),
      this.localizer.localizeText(
        'Optional: enter a condition key for conditional routing.',
        '可选：输入条件路由使用的 condition key。',
      ),
      existingEdge?.conditionKey,
    );
    if (conditionKey === null) {
      return;
    }

    const response = await this.serviceRuntime.updateWorkflowDraftEdge({
      workflowDraftId: draftSession.workflowDraftId,
      draftRevision: draftSession.draftRevision,
      edgeSpec: {
        fromNodeId: fromNode.nodeId,
        toNodeId: toNode.nodeId,
        ...(conditionKey !== undefined
          ? {
              conditionKey,
            }
          : {}),
      },
      ...(existingEdge
        ? {
            previousEdgeSpec: {
              fromNodeId: existingEdge.fromNodeId,
              toNodeId: existingEdge.toNodeId,
              ...(existingEdge.conditionKey !== undefined
                ? {
                    conditionKey: existingEdge.conditionKey,
                  }
                : {}),
            },
          }
        : {}),
    });
    await this.handleWorkflowDraftMutationResponse(response);
  }

  private async removeWorkflowEdge(
    draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot,
  ): Promise<void> {
    if (draftSession.edgeSpecs.length === 0) {
      void vscode.window.showInformationMessage(
        this.localizer.localizeText(
          'No workflow edge is available to remove.',
          '当前没有可移除的工作流连线。',
        ),
      );
      return;
    }

    const pickedEdge = await vscode.window.showQuickPick<{
      label: string;
      description: string;
      edge: VsCodeExtensionWorkflowDraftSessionSnapshot['edgeSpecs'][number];
    }>(
      draftSession.edgeSpecs.map(
        (edge: VsCodeExtensionWorkflowDraftSessionSnapshot['edgeSpecs'][number]) => ({
          label: `${edge.fromNodeId} -> ${edge.toNodeId}`,
          description: edge.conditionKey ?? this.localizer.localizeText('No condition', '无条件'),
          edge,
        }),
      ),
      {
        title: this.localizer.localizeText(
          'Choose one workflow edge to remove',
          '选择一个要移除的工作流连线',
        ),
      },
    );
    if (!pickedEdge) {
      return;
    }

    const response = await this.serviceRuntime.updateWorkflowDraftEdge({
      workflowDraftId: draftSession.workflowDraftId,
      draftRevision: draftSession.draftRevision,
      edgeSpec: pickedEdge.edge,
      remove: true,
    });
    await this.handleWorkflowDraftMutationResponse(response);
  }

  private async applyWorkflowMetadataMutation(
    draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot,
  ): Promise<void> {
    const processId = await this.promptForRequiredText(
      this.localizer.localizeText('Workflow process id', '工作流 process id'),
      this.localizer.localizeText(
        'Enter the canonical workflow process identifier.',
        '输入规范工作流 process 标识。',
      ),
      draftSession.compiledIrPreview.processId,
    );
    if (!processId) {
      return;
    }

    const entryNode = await this.promptForWorkflowNodeChoice(
      draftSession,
      this.localizer.localizeText('Choose the entry node', '选择入口节点'),
      draftSession.compiledIrPreview.entryNodeId,
    );
    if (!entryNode) {
      return;
    }

    const response = await this.serviceRuntime.updateWorkflowDraftPolicy({
      workflowDraftId: draftSession.workflowDraftId,
      draftRevision: draftSession.draftRevision,
      processId,
      entryNodeId: entryNode.nodeId,
    });
    await this.handleWorkflowDraftMutationResponse(response);
  }

  private async applyWorkflowNodePolicyMutation(
    draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot,
  ): Promise<void> {
    const node = await this.promptForWorkflowNodeChoice(
      draftSession,
      this.localizer.localizeText('Choose the node to update', '选择要更新的节点'),
    );
    if (!node) {
      return;
    }

    const inputSchemaRef = await this.promptForOptionalText(
      this.localizer.localizeText('Input schema ref', '输入 schema 引用'),
      this.localizer.localizeText(
        'Leave the field empty to keep the current input schema binding.',
        '留空则保留当前输入 schema 绑定。',
      ),
      node.inputSchemaRef,
    );
    if (inputSchemaRef === null) {
      return;
    }

    const outputSchemaRef = await this.promptForOptionalText(
      this.localizer.localizeText('Output schema ref', '输出 schema 引用'),
      this.localizer.localizeText(
        'Leave the field empty to keep the current output schema binding.',
        '留空则保留当前输出 schema 绑定。',
      ),
      node.outputSchemaRef,
    );
    if (outputSchemaRef === null) {
      return;
    }

    const retryPolicyRef = await this.promptForOptionalText(
      this.localizer.localizeText('Retry policy ref', '重试策略引用'),
      this.localizer.localizeText(
        'Leave the field empty to keep the current retry policy binding.',
        '留空则保留当前重试策略绑定。',
      ),
      node.retryPolicyRef,
    );
    if (retryPolicyRef === null) {
      return;
    }

    const timeoutPolicyRef = await this.promptForOptionalText(
      this.localizer.localizeText('Timeout policy ref', '超时策略引用'),
      this.localizer.localizeText(
        'Leave the field empty to keep the current timeout policy binding.',
        '留空则保留当前超时策略绑定。',
      ),
      node.timeoutPolicyRef,
    );
    if (timeoutPolicyRef === null) {
      return;
    }

    const budgetPolicyRef = await this.promptForOptionalText(
      this.localizer.localizeText('Budget policy ref', '预算策略引用'),
      this.localizer.localizeText(
        'Leave the field empty to keep the current budget policy binding.',
        '留空则保留当前预算策略绑定。',
      ),
      node.budgetPolicyRef,
    );
    if (budgetPolicyRef === null) {
      return;
    }

    const response = await this.serviceRuntime.updateWorkflowDraftPolicy({
      workflowDraftId: draftSession.workflowDraftId,
      draftRevision: draftSession.draftRevision,
      nodeId: node.nodeId,
      ...(inputSchemaRef === undefined ? {} : { inputSchemaRef }),
      ...(outputSchemaRef === undefined ? {} : { outputSchemaRef }),
      ...(retryPolicyRef === undefined ? {} : { retryPolicyRef }),
      ...(timeoutPolicyRef === undefined ? {} : { timeoutPolicyRef }),
      ...(budgetPolicyRef === undefined ? {} : { budgetPolicyRef }),
    });
    await this.handleWorkflowDraftMutationResponse(response);
  }

  private async handleWorkflowDraftMutationResponse(
    response: {
      applied: boolean;
      message: string;
      draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot;
      definitionPath?: string;
      compiledIrPath?: string;
    },
    commandRequest?: VsCodeExtensionCommandRequest,
  ): Promise<void> {
    const nextRequest: VsCodeExtensionCommandRequest = {
      ...commandRequest,
      workflowDraftId: response.draftSession.workflowDraftId,
      workflowDraftRevision: response.draftSession.draftRevision,
    };
    this.selectionStore.applyCommandRequest(nextRequest);
    await this.openWorkflowStudio(nextRequest);

    const artifactPath = response.definitionPath ?? response.compiledIrPath;
    const openArtifactLabel = this.localizer.localizeText('Open Artifact', '打开产物');
    const picked = response.applied
      ? await vscode.window.showInformationMessage(
          response.message,
          ...(artifactPath ? [openArtifactLabel] : []),
        )
      : await vscode.window.showWarningMessage(
          response.message,
          ...(artifactPath ? [openArtifactLabel] : []),
        );
    if (picked !== openArtifactLabel || !artifactPath) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(artifactPath));
    await vscode.window.showTextDocument(document, { preview: false });
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

  private async promptForRequiredText(
    title: string,
    prompt: string,
    value?: string,
  ): Promise<string | null> {
    const nextValue = await vscode.window.showInputBox({
      title,
      prompt,
      value,
      ignoreFocusOut: true,
      validateInput: (candidate) =>
        candidate.trim().length > 0
          ? undefined
          : this.localizer.localizeText('This field is required.', '该字段为必填项。'),
    });
    return nextValue === undefined ? null : nextValue.trim();
  }

  private async promptForOptionalText(
    title: string,
    prompt: string,
    value?: string,
  ): Promise<string | undefined | null> {
    const nextValue = await vscode.window.showInputBox({
      title,
      prompt,
      value,
      ignoreFocusOut: true,
    });
    if (nextValue === undefined) {
      return null;
    }

    return nextValue.trim().length > 0 ? nextValue.trim() : undefined;
  }

  private async promptForOptionalNumber(
    title: string,
    prompt: string,
    value?: number,
  ): Promise<number | undefined | null> {
    const nextValue = await vscode.window.showInputBox({
      title,
      prompt,
      value: value === undefined ? undefined : String(value),
      ignoreFocusOut: true,
      validateInput: (candidate) =>
        candidate.trim().length === 0 || Number.isFinite(Number(candidate))
          ? undefined
          : this.localizer.localizeText(
              'Enter one numeric value or leave the field empty.',
              '请输入数值，或保持为空。',
            ),
    });
    if (nextValue === undefined) {
      return null;
    }
    if (nextValue.trim().length === 0) {
      return undefined;
    }

    return Number(nextValue);
  }

  private async promptForWorkflowNodeType(
    currentType?: ProcessNodeType,
  ): Promise<ProcessNodeType | null> {
    const picked = await vscode.window.showQuickPick(
      Object.values(ProcessNodeType).map((nodeType) => ({
        label: this.localizeWorkflowNodeType(nodeType),
        description:
          nodeType === currentType
            ? this.localizer.localizeText('Current value', '当前值')
            : undefined,
        nodeType,
      })),
      {
        title: this.localizer.localizeText('Choose the workflow node type', '选择工作流节点类型'),
      },
    );
    return picked?.nodeType ?? null;
  }

  private localizeWorkflowNodeType(nodeType: ProcessNodeType): string {
    switch (nodeType) {
      case ProcessNodeType.SEQUENTIAL:
        return this.localizer.localizeText('Sequential', '串行');
      case ProcessNodeType.PARALLEL:
        return this.localizer.localizeText('Parallel', '并行');
      case ProcessNodeType.LOOP:
        return this.localizer.localizeText('Loop', '循环');
      case ProcessNodeType.CONDITION:
        return this.localizer.localizeText('Condition', '条件分支');
      default:
        return nodeType;
    }
  }

  private async promptForWorkflowNodeChoice(
    draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot,
    title: string,
    currentNodeId?: string,
    currentNodeDetail?: string,
  ): Promise<VsCodeExtensionWorkflowDraftSessionSnapshot['nodeSpecs'][number] | null> {
    const picked = await vscode.window.showQuickPick<{
      label: string;
      description: string;
      detail?: string;
      node: VsCodeExtensionWorkflowDraftSessionSnapshot['nodeSpecs'][number];
    }>(
      draftSession.nodeSpecs.map(
        (node: VsCodeExtensionWorkflowDraftSessionSnapshot['nodeSpecs'][number]) => ({
          label: node.nodeId,
          description: `${node.stageId} · ${node.routeKey} · ${node.roleProfileId}`,
          detail:
            node.nodeId === currentNodeId
              ? (currentNodeDetail ??
                this.localizer.localizeText('Current entry node', '当前入口节点'))
              : undefined,
          node,
        }),
      ),
      {
        title,
      },
    );
    return picked?.node ?? null;
  }

  private assertWorkflowDraftPatchOpSupported(
    draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot,
    patchOp: OrchestrationWorkflowDraftSupportedPatchOp,
  ): void {
    if (draftSession.supportedPatchOps.includes(patchOp)) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.AGENT_PROTOCOL_INVALID,
      this.localizer.localizeText(
        'The current workflow draft session does not support this authoring action.',
        '当前工作流草稿会话不支持这个 authoring 操作。',
      ),
      {
        workflowDraftId: draftSession.workflowDraftId,
        workflowDraftPatchOp: patchOp,
      },
    );
  }

  private isMutableWorkflowDraftSession(
    draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot,
  ): boolean {
    return draftSession.entryMode !== OrchestrationWorkflowDraftEntryMode.READ_ONLY;
  }

  private async confirmWorkflowDraftReplacement(
    draftSession: VsCodeExtensionWorkflowDraftSessionSnapshot,
    nextEntryMode: OrchestrationWorkflowDraftEntryMode,
  ): Promise<boolean> {
    return this.confirmCommand(
      this.localizer.localizeText(
        `Workflow draft ${draftSession.workflowDraftId} still has uncommitted mutable changes. Replacing it will discard those edits before starting ${this.localizeWorkflowDraftEntryMode(nextEntryMode)}.`,
        `工作流草稿 ${draftSession.workflowDraftId} 仍有未提交的可编辑变更。替换它会先丢弃这些编辑，然后再启动 ${this.localizeWorkflowDraftEntryMode(nextEntryMode)}。`,
      ),
      this.localizer.localizeText('Replace Draft', '替换草稿'),
    );
  }

  private localizeWorkflowDraftEntryMode(entryMode: OrchestrationWorkflowDraftEntryMode): string {
    switch (entryMode) {
      case OrchestrationWorkflowDraftEntryMode.READ_ONLY:
        return this.localizer.localizeText('workflow preview', '工作流预览');
      case OrchestrationWorkflowDraftEntryMode.CREATE_SEED:
        return this.localizer.localizeText('workflow creation', '工作流创建');
      case OrchestrationWorkflowDraftEntryMode.EDIT_SEED:
        return this.localizer.localizeText('workflow editing', '工作流编辑');
      default:
        return entryMode;
    }
  }

  private localizeWorkspaceOperationKind(
    operationKind: OrchestrationWorkspaceOperationKind,
  ): string {
    switch (operationKind) {
      case OrchestrationWorkspaceOperationKind.CONNECT:
        return this.localizer.localizeText('Run connect', '执行 connect');
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

  private createBlockedChatCommandExecutionResult(
    commandName: string,
  ): VsCodeExtensionChatCommandExecutionResult {
    return this.createChatCommandExecutionResult(
      commandName,
      'blocked',
      'This command is blocked until the workspace is trusted.',
      '该命令会在工作区受信任前保持阻断。',
      this.localizer.localizeText(
        'Grant Workspace Trust and then run the slash command again.',
        '请先授予工作区信任，然后再重新执行这个 slash command。',
      ),
    );
  }

  private createChatCommandExecutionResult(
    commandName: string,
    status: VsCodeExtensionChatCommandExecutionStatus,
    englishSummary: string,
    chineseSummary: string,
    detail?: string,
  ): VsCodeExtensionChatCommandExecutionResult {
    return {
      commandName,
      status,
      summary: this.localizer.localizeText(englishSummary, chineseSummary),
      ...(detail
        ? {
            detail,
          }
        : {}),
    };
  }

  private shouldAllowPendingRunningSummary(commandName: string, promptText?: string): boolean {
    const trimmedPrompt = promptText?.trim();
    switch (commandName) {
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKSPACE_BOOTSTRAP:
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.DOCTOR:
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.CHECK:
        return true;
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_PREVIEW:
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_CREATE:
      case VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_EDIT:
        return typeof trimmedPrompt === 'string' && trimmedPrompt.length > 0;
      default:
        return false;
    }
  }

  private isChatCommandTrustBlocked(commandName: string): boolean {
    if (vscode.workspace.isTrusted) {
      return false;
    }

    const trustBlockedCommands: readonly string[] = [
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKSPACE_BOOTSTRAP,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.CONNECT,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.DOCTOR,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.CHECK,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_PREVIEW,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_CREATE,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.WORKFLOW_EDIT,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_HANDOFF_TARGET,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.SUBMIT_HITL_DECISION,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.RECOVER_EXECUTION,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.TERMINATE_EXECUTION,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_USER_CONFIG,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.CONFIGURE_USER_DEFAULT,
      VSCODE_EXTENSION_CHAT_COMMAND_IDS.SET_MANAGED_SECRET,
    ];

    return trustBlockedCommands.includes(commandName);
  }

  private resolveChatPromptIntentRequest(
    promptText?: string,
  ): VsCodeExtensionResolvedChatRequest | undefined {
    const collapsedPrompt = this.collapseChatPromptWhitespace(promptText);
    if (!collapsedPrompt) {
      return undefined;
    }

    const strippedPrompt = this.stripChatPromptPolitePrefixes(collapsedPrompt);
    if (!strippedPrompt) {
      return undefined;
    }

    const normalizedPrompt = strippedPrompt.toLowerCase();
    const workspaceDoctorRequest =
      this.resolveImplicitWorkspaceDoctorPromptIntent(normalizedPrompt);
    if (workspaceDoctorRequest) {
      return workspaceDoctorRequest;
    }

    for (const rule of VSCODE_EXTENSION_CHAT_PROMPT_INTENT_RULES) {
      const matchedPhrase =
        rule.exactPhrases?.find((phrase) => normalizedPrompt === phrase) ??
        rule.leadingPhrases?.find((phrase) => this.matchesLeadingPhrase(normalizedPrompt, phrase));
      if (!matchedPhrase) {
        continue;
      }

      const promptSuffix = strippedPrompt.slice(matchedPhrase.length).trim();
      switch (rule.promptRoutingMode) {
        case 'full_prompt':
          return {
            commandName: rule.commandName,
            promptText: strippedPrompt,
          };
        case 'suffix':
          return {
            commandName: rule.commandName,
            ...(promptSuffix
              ? {
                  promptText: promptSuffix,
                }
              : {}),
          };
        default:
          return {
            commandName: rule.commandName,
          };
      }
    }

    return undefined;
  }

  /**
   * Resolves tightly-scoped natural-language workspace health-check prompts to `/doctor`.
   *
   * Why this exists:
   * users often phrase the request as “帮我诊断一下当前项目” instead of typing `/doctor`, and we
   * want that wording to execute the governed doctor operation directly without accidentally
   * hijacking broader repo-analysis conversations such as “检查一下当前项目结构”.
   * @param normalizedPrompt Lowercased, de-prefixed prompt text.
   * @returns The governed doctor command when the prompt is clearly a workspace diagnosis request.
   */
  private resolveImplicitWorkspaceDoctorPromptIntent(
    normalizedPrompt: string,
  ): VsCodeExtensionResolvedChatRequest | undefined {
    if (
      VSCODE_EXTENSION_CHAT_WORKSPACE_DOCTOR_PATTERNS.some((pattern) =>
        pattern.test(normalizedPrompt),
      )
    ) {
      return {
        commandName: VSCODE_EXTENSION_CHAT_COMMAND_IDS.DOCTOR,
      };
    }

    return undefined;
  }

  private collapseChatPromptWhitespace(promptText?: string): string | undefined {
    const collapsedPrompt = promptText?.replace(/\s+/gu, ' ').trim();
    return collapsedPrompt ? collapsedPrompt : undefined;
  }

  private stripChatPromptPolitePrefixes(promptText: string): string {
    let strippedPrompt = promptText;
    while (strippedPrompt.length > 0) {
      const normalizedPrompt = strippedPrompt.toLowerCase();
      const matchedPrefix = VSCODE_EXTENSION_CHAT_POLITE_PREFIXES.find((prefix) =>
        normalizedPrompt.startsWith(prefix),
      );
      if (!matchedPrefix) {
        return strippedPrompt;
      }

      strippedPrompt = strippedPrompt
        .slice(matchedPrefix.length)
        .replace(/^[\s,，:：-]+/u, '')
        .trim();
    }

    return strippedPrompt;
  }

  private matchesLeadingPhrase(normalizedPrompt: string, phrase: string): boolean {
    return (
      normalizedPrompt === phrase ||
      normalizedPrompt.startsWith(`${phrase} `) ||
      normalizedPrompt.startsWith(`${phrase},`) ||
      normalizedPrompt.startsWith(`${phrase}，`) ||
      normalizedPrompt.startsWith(`${phrase}:`) ||
      normalizedPrompt.startsWith(`${phrase}：`) ||
      normalizedPrompt.startsWith(`${phrase}-`)
    );
  }

  private resolveConnectWorkspaceOperationArgumentsFromPrompt(
    promptText?: string,
  ): VsCodeExtensionWorkspaceOperationArguments | undefined {
    if (!promptText) {
      return undefined;
    }

    const normalizedPrompt = promptText.trim().toLowerCase();
    const mentionedTool = this.resolveMentionedAdapterSurfaceInPrompt(normalizedPrompt);
    if (!mentionedTool) {
      return undefined;
    }

    return {
      ...(normalizedPrompt.includes('all roles') || normalizedPrompt.includes('所有角色')
        ? {
            singleToolAllRoles: mentionedTool,
          }
        : {
            tools: [mentionedTool],
          }),
      ...(normalizedPrompt.includes('remote api') || normalizedPrompt.includes('远程 api')
        ? {
            toolTransportBindings: [`${mentionedTool}=${AdapterTransportKind.REMOTE_API}`],
          }
        : {}),
    };
  }

  private resolveMentionedAdapterSurfaceInPrompt(
    normalizedPrompt: string,
  ): AdapterSurface | undefined {
    if (normalizedPrompt.includes('claude')) {
      return AdapterSurface.CLAUDE_CODE;
    }
    if (normalizedPrompt.includes('copilot')) {
      return AdapterSurface.GITHUB_COPILOT;
    }
    if (normalizedPrompt.includes('ollama') || normalizedPrompt.includes('local model')) {
      return AdapterSurface.OLLAMA;
    }
    if (normalizedPrompt.includes('codex')) {
      return AdapterSurface.CODEX;
    }

    return undefined;
  }

  private resolveWorkspaceOperationRequestFromChatPrompt(promptText: string):
    | {
        workspaceOperationKind: OrchestrationWorkspaceOperationKind;
        workspaceOperationArguments?: VsCodeExtensionWorkspaceOperationArguments;
      }
    | undefined {
    const normalizedPrompt = promptText.trim().toLowerCase();
    const containsAny = (...candidates: string[]): boolean =>
      candidates.some((candidate) => normalizedPrompt.includes(candidate));

    if (containsAny('preview upgrade', 'upgrade preview', '预览升级', '升级预览')) {
      return {
        workspaceOperationKind: OrchestrationWorkspaceOperationKind.UPGRADE_PREVIEW,
      };
    }
    if (
      containsAny('apply upgrade', 'upgrade apply', '应用升级') ||
      normalizedPrompt === 'upgrade' ||
      normalizedPrompt === '升级'
    ) {
      return {
        workspaceOperationKind: OrchestrationWorkspaceOperationKind.UPGRADE_APPLY,
      };
    }
    if (containsAny('adopt bootstrap', 'bootstrap adopt', 'adopt 初始化')) {
      return {
        workspaceOperationKind: OrchestrationWorkspaceOperationKind.ADOPT_BOOTSTRAP,
      };
    }
    if (containsAny('apply adoption', 'adoption apply', 'adopt apply', '应用 adopt')) {
      return {
        workspaceOperationKind: OrchestrationWorkspaceOperationKind.ADOPTION_APPLY,
      };
    }
    if (containsAny('host export', 'export host', '导出宿主资产', '宿主导出')) {
      return {
        workspaceOperationKind: OrchestrationWorkspaceOperationKind.HOST_EXPORT,
      };
    }
    if (containsAny('host verify', 'verify host', '校验宿主资产', '宿主校验')) {
      return {
        workspaceOperationKind: OrchestrationWorkspaceOperationKind.HOST_VERIFY,
      };
    }
    if (containsAny('host pack', 'pack host', '打包宿主 bundle', '宿主打包')) {
      return {
        workspaceOperationKind: OrchestrationWorkspaceOperationKind.HOST_PACK,
      };
    }

    return undefined;
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
