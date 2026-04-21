import * as vscode from 'vscode';

import {
  OrchestrationWorkspaceOperationKind,
  type OrchestrationWorkspaceOperationSnapshot,
} from '@repo-ai-governor/orchestration-service-client';
import { standardizeError } from '@repo-ai-governor/shared';
import {
  VSCODE_EXTENSION_CHAT_COMMAND_IDS,
  VSCODE_EXTENSION_CHAT_COMMAND_REVIEW,
  VSCODE_EXTENSION_COMMAND_IDS,
} from '../constants/index.js';
import type {
  VsCodeExtensionChatCommandExecutionResult,
  VsCodeExtensionCommandController,
} from './vscode-extension-command-controller.js';
import type { VsCodeExtensionLocalizer } from './vscode-extension-localizer.js';
import type { VsCodeExtensionPresentationBuilder } from './vscode-extension-presentation-builder.js';
import type { VsCodeExtensionSelectionStore } from './vscode-extension-selection-store.js';
import type {
  VsCodeExtensionServiceRuntime,
  VsCodeExtensionSessionTurnResult,
} from './vscode-extension-service-runtime.js';

const VSCODE_BUILTIN_OPEN_COMMAND_ID = 'vscode.open';
const WORKSPACE_OPERATION_PRIMARY_DIAGNOSTICS_ARTIFACT_ID = 'doctor_diagnostics';
const WORKSPACE_OPERATION_DIAGNOSTICS_ARTIFACT_KEYWORD = 'diagnostic';
const CHAT_COMMAND_COMPLETION_TIMEOUT_MS = 4000;
type WorkspaceOperationArtifact = NonNullable<
  OrchestrationWorkspaceOperationSnapshot['result']['artifacts']
>[number];

interface VsCodeExtensionPendingChatCommandExecution {
  commandName: string;
  inferredFromPrompt: boolean;
  allowPendingRunningSummary: boolean;
}

/**
 * Creates the `@governor` chat participant for editor-local governance guidance.
 *
 * Why this exists:
 * sprint-002 needs one lightweight chat entry point that summarizes service-backed governance
 * state without duplicating orchestration logic inside the extension host.
 */
export class VsCodeExtensionChatParticipantRuntime {
  public constructor(
    private readonly serviceRuntime: VsCodeExtensionServiceRuntime,
    private readonly selectionStore: VsCodeExtensionSelectionStore,
    private readonly commandController: VsCodeExtensionCommandController,
    private readonly presentationBuilder: VsCodeExtensionPresentationBuilder,
    private readonly localizer: VsCodeExtensionLocalizer,
  ) {}

  /**
   * Creates the chat participant instance.
   * @returns Chat participant bound to service-backed status queries.
   */
  public createParticipant(participantId: string): vscode.ChatParticipant {
    return vscode.chat.createChatParticipant(participantId, async (request, _context, response) => {
      try {
        let didAnnounceCommandExecutionStart = false;
        let pendingCommandExecution: VsCodeExtensionPendingChatCommandExecution | undefined;
        const commandExecutionPromise = this.commandController.executeChatRequest(
          request.command,
          request.prompt,
          {
            onDidStart: ({ commandName, inferredFromPrompt, allowPendingRunningSummary }) => {
              didAnnounceCommandExecutionStart = true;
              pendingCommandExecution = {
                commandName,
                inferredFromPrompt,
                allowPendingRunningSummary,
              };
              response.progress(
                inferredFromPrompt
                  ? this.localizer.localizeText(
                      `Interpreted your request as /${commandName}. Refreshing the Governor snapshot…`,
                      `已将你的请求解析为 /${commandName}。正在刷新 Governor 快照...`,
                    )
                  : this.localizer.localizeText(
                      `Executed /${commandName}. Refreshing the Governor snapshot…`,
                      `已执行 /${commandName}。正在刷新 Governor 快照...`,
                    ),
              );
            },
          },
        );
        let commandExecution = await this.awaitChatCommandExecution(commandExecutionPromise);
        if (commandExecution === null && pendingCommandExecution?.allowPendingRunningSummary) {
          response.markdown(this.buildPendingCommandExecutionMarkdown(pendingCommandExecution));
          response.button({
            command: VSCODE_EXTENSION_COMMAND_IDS.REFRESH,
            title: this.localizer.localizeText('Refresh Governor views', '刷新 Governor 视图'),
          });
          return {
            metadata: {
              executedChatCommand: pendingCommandExecution.commandName,
              commandStatus: 'dispatched',
              commandPending: true,
            },
          };
        }
        if (commandExecution === null && pendingCommandExecution) {
          commandExecution = await commandExecutionPromise;
        }
        if (commandExecution === null) {
          response.markdown(
            this.localizer.localizeText(
              'The requested Governor action is still running. Use Refresh Governor views to pull the latest snapshot.',
              '请求的 Governor 动作仍在执行中。请使用“刷新 Governor 视图”拉取最新快照。',
            ),
          );
          response.button({
            command: VSCODE_EXTENSION_COMMAND_IDS.REFRESH,
            title: this.localizer.localizeText('Refresh Governor views', '刷新 Governor 视图'),
          });
          return {
            metadata: {
              commandStatus: 'dispatched',
              commandPending: true,
            },
          };
        }
        const trimmedPrompt = request.prompt?.trim();
        const resolvedCommandName = request.command ?? commandExecution?.commandName;
        const wasPromptInferred =
          request.command === undefined &&
          commandExecution !== undefined &&
          commandExecution !== null;
        const isFreeConversation =
          request.command === undefined &&
          commandExecution === undefined &&
          typeof trimmedPrompt === 'string' &&
          trimmedPrompt.length > 0;
        if (isFreeConversation) {
          response.progress(
            this.localizer.localizeText(
              'Routing your request through the Governor main session…',
              '正在通过 Governor 主会话处理你的请求...',
            ),
          );
          const sessionTurn = await this.serviceRuntime.executeMainSessionTurn(trimmedPrompt);
          response.markdown(this.buildSessionTurnMarkdown(sessionTurn));
          this.appendSessionTurnButtons(sessionTurn, response);
          return {
            metadata: {
              sessionId: sessionTurn.sessionId,
              turnId: sessionTurn.turnId,
              ...(sessionTurn.responseMode
                ? {
                    responseMode: sessionTurn.responseMode,
                  }
                : {}),
              ...(sessionTurn.interactionMode
                ? {
                    interactionMode: sessionTurn.interactionMode,
                  }
                : {}),
              ...(sessionTurn.executionIntent
                ? {
                    executionIntent: sessionTurn.executionIntent,
                  }
                : {}),
              ...(sessionTurn.suggestedSlashCommand
                ? {
                    suggestedSlashCommand: sessionTurn.suggestedSlashCommand,
                  }
                : {}),
            },
          };
        }
        if (!didAnnounceCommandExecutionStart) {
          response.progress(
            commandExecution
              ? wasPromptInferred
                ? this.localizer.localizeText(
                    `Interpreted your request as /${commandExecution.commandName}. Refreshing the Governor snapshot…`,
                    `已将你的请求解析为 /${commandExecution.commandName}。正在刷新 Governor 快照...`,
                  )
                : this.localizer.localizeText(
                    `Executed /${resolvedCommandName}. Refreshing the Governor snapshot…`,
                    `已执行 /${resolvedCommandName}。正在刷新 Governor 快照...`,
                  )
              : this.localizer.localizeText(
                  'Refreshing Governor status from the local orchestration service…',
                  '正在从本地编排服务刷新 Governor 状态...',
                ),
          );
        }
        const workspaceContext = await this.serviceRuntime.resolveWorkspaceContextSnapshot();
        const [executionBoard, hitlInbox, queueOverview, providerLifecycleSnapshots] =
          await Promise.all([
            this.serviceRuntime.queryExecutionBoard(),
            this.serviceRuntime.queryHitlInbox(),
            this.serviceRuntime.queryQueueOverview(),
            this.serviceRuntime.resolveProviderLifecycleSnapshots(),
          ]);
        const reviewDetailSnapshot =
          resolvedCommandName === VSCODE_EXTENSION_CHAT_COMMAND_REVIEW ||
          resolvedCommandName === VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_REVIEW_DETAIL
            ? await this.serviceRuntime.resolveReviewDetailSnapshot(
                this.selectionStore.getSnapshot(),
              )
            : undefined;
        if (reviewDetailSnapshot?.selectedExecution) {
          this.selectionStore.rememberExecution(
            reviewDetailSnapshot.selectedExecution.execution.executionId,
            reviewDetailSnapshot.selectedExecution.execution.executionSessionId,
          );
        }
        if (reviewDetailSnapshot?.artifactPane?.reviewSourcePath) {
          this.selectionStore.rememberReviewSourcePath(
            reviewDetailSnapshot.artifactPane.reviewSourcePath,
          );
        }

        const statusMarkdown = this.presentationBuilder.buildChatResponseMarkdown({
          command: resolvedCommandName,
          workspaceContext,
          executionBoardEntries: executionBoard.executions,
          hitlInboxEntries: hitlInbox.pendingDecisions,
          queueOverview,
          providerLifecycleSnapshots,
          ...(reviewDetailSnapshot
            ? {
                reviewDetailSnapshot,
              }
            : {}),
        });
        response.markdown(
          commandExecution
            ? this.buildCommandExecutionMarkdown(
                resolvedCommandName ?? commandExecution.commandName,
                commandExecution,
                this.buildLatestWorkspaceOperationMarkdown(queueOverview.latestWorkspaceOperation),
                statusMarkdown,
                wasPromptInferred,
              )
            : statusMarkdown,
        );
        response.button({
          command: VSCODE_EXTENSION_COMMAND_IDS.REFRESH,
          title: this.localizer.localizeText('Refresh Governor views', '刷新 Governor 视图'),
        });
        this.appendLatestWorkspaceOperationButtons(
          queueOverview.latestWorkspaceOperation,
          response,
        );
        if (resolvedCommandName === VSCODE_EXTENSION_CHAT_COMMAND_IDS.OPEN_WORKFLOW_STUDIO) {
          response.button({
            command: VSCODE_EXTENSION_COMMAND_IDS.OPEN_WORKFLOW_STUDIO,
            title: this.localizer.localizeText('Open workflow studio', '打开 Workflow Studio'),
          });
        }
        if (executionBoard.executions[0]) {
          response.button({
            command: VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
            title: this.localizer.localizeText('Open review detail', '打开评审详情'),
            arguments: [
              {
                executionId: executionBoard.executions[0].execution.executionId,
                executionSessionId: executionBoard.executions[0].execution.executionSessionId,
              },
            ],
          });
        }
        for (const button of this.presentationBuilder.buildProviderLifecycleChatButtons(
          providerLifecycleSnapshots,
        )) {
          response.button(button);
        }

        return {
          metadata: {
            executionCount: executionBoard.executions.length,
            pendingHitlCount: hitlInbox.pendingDecisions.length,
            reviewQueueCount: queueOverview.reviewQueue.length,
            ...(commandExecution
              ? {
                  executedChatCommand: commandExecution.commandName,
                  commandStatus: commandExecution.status,
                }
              : {}),
          },
        };
      } catch (error) {
        const standardizedError = standardizeError(error);
        return {
          errorDetails: {
            message: standardizedError.message,
          },
        };
      }
    });
  }

  private async awaitChatCommandExecution(
    commandExecutionPromise: Promise<VsCodeExtensionChatCommandExecutionResult | undefined>,
  ): Promise<VsCodeExtensionChatCommandExecutionResult | undefined | null> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timedExecutionPromise = commandExecutionPromise.finally(() => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    });
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutHandle = setTimeout(() => {
        resolve(null);
      }, CHAT_COMMAND_COMPLETION_TIMEOUT_MS);
    });
    return Promise.race([timedExecutionPromise, timeoutPromise]);
  }

  private buildCommandExecutionMarkdown(
    commandName: string,
    commandExecution: VsCodeExtensionChatCommandExecutionResult,
    workspaceOperationMarkdown: string | undefined,
    statusMarkdown: string,
    wasPromptInferred: boolean,
  ): string {
    const lines = [
      `## ${this.localizer.localizeText('Command execution', '命令执行')}`,
      `- ${this.localizer.localizeText(
        wasPromptInferred ? 'Resolved command' : 'Slash command',
        wasPromptInferred ? '解析出的命令' : 'Slash 命令',
      )}: \`/${commandName}\``,
      `- ${this.localizer.localizeText('Outcome', '结果')}: ${this.localizeCommandExecutionStatus(commandExecution.status)}`,
      `- ${this.localizer.localizeText('Summary', '摘要')}: ${commandExecution.summary}`,
      ...(commandExecution.detail
        ? [`- ${this.localizer.localizeText('Detail', '详情')}: ${commandExecution.detail}`]
        : []),
      ...(workspaceOperationMarkdown ? ['', workspaceOperationMarkdown] : []),
      '',
      statusMarkdown,
    ];
    return lines.join('\n');
  }

  private buildPendingCommandExecutionMarkdown(
    pendingExecution: VsCodeExtensionPendingChatCommandExecution,
  ): string {
    const lines = [
      `## ${this.localizer.localizeText('Command execution', '命令执行')}`,
      `- ${this.localizer.localizeText(
        pendingExecution.inferredFromPrompt ? 'Resolved command' : 'Slash command',
        pendingExecution.inferredFromPrompt ? '解析出的命令' : 'Slash 命令',
      )}: \`/${pendingExecution.commandName}\``,
      `- ${this.localizer.localizeText('Outcome', '结果')}: ${this.localizer.localizeText('Running', '执行中')}`,
      `- ${this.localizer.localizeText('Summary', '摘要')}: ${this.localizer.localizeText(
        `/${pendingExecution.commandName} is still running. When it finishes, the latest result will appear in the Governor workbench and VS Code notifications.`,
        `/${pendingExecution.commandName} 仍在执行中。完成后，最新结果会显示在 Governor Workbench 和 VS Code 通知里。`,
      )}`,
      `- ${this.localizer.localizeText('What you can do now', '你现在可以做什么')}: ${this.localizer.localizeText(
        'You can keep working, then use Refresh Governor views to pull the latest snapshot.',
        '你可以继续操作；稍后点击“刷新 Governor 视图”即可拉取最新快照。',
      )}`,
    ];
    return lines.join('\n');
  }

  private buildLatestWorkspaceOperationMarkdown(
    snapshot: OrchestrationWorkspaceOperationSnapshot | undefined,
  ): string | undefined {
    if (!snapshot) {
      return undefined;
    }

    const lines = [
      `## ${this.localizer.localizeText('Result details', '结果详情')}`,
      `- ${this.localizer.localizeText('Operation', '操作')}: ${this.localizeWorkspaceOperationKind(snapshot.operationKind)}`,
      `- ${this.localizer.localizeText('Runtime operation', '运行时操作')}: ${snapshot.result.operation}`,
      `- ${this.localizer.localizeText('Summary', '摘要')}: ${this.getVisibleWorkspaceOperationSummary(snapshot)}`,
      `- ${this.localizer.localizeText('Completed at', '完成时间')}: ${snapshot.completedAt}`,
    ];

    if (snapshot.locale) {
      lines.push(
        `- ${this.localizer.localizeText('Captured locale', '采集语言')}: ${snapshot.locale}`,
      );
    }

    const checkSummary = this.formatWorkspaceOperationCheckTotals(snapshot.result.checkTotals);
    if (checkSummary) {
      lines.push(`${this.localizer.localizeText('Checks', '检查')}: ${checkSummary}`);
    }

    const failedChecks = (snapshot.result.checks ?? []).filter((check) => check.status === 'fail');
    const warningChecks = (snapshot.result.checks ?? []).filter((check) => check.status === 'warn');
    if (failedChecks.length > 0 || warningChecks.length > 0) {
      lines.push(
        '',
        `## ${this.localizer.localizeText('What to watch', '需要关注')}`,
        ...failedChecks.map(
          (check) =>
            `- ${this.localizer.localizeText('Failure', '失败')}: \`${check.id}\` · ${check.detail}`,
        ),
        ...warningChecks
          .slice(0, 4)
          .map(
            (check) =>
              `- ${this.localizer.localizeText('Warning', '警告')}: \`${check.id}\` · ${check.detail}`,
          ),
      );
      const hiddenWarningCount = Math.max(warningChecks.length - 4, 0);
      if (hiddenWarningCount > 0) {
        lines.push(
          `- ${this.localizer.localizeText('More warnings', '更多警告')}: ${this.localizer.localizeText(
            `${hiddenWarningCount} more warning item(s) are available in the Governor workbench details.`,
            `还有 ${hiddenWarningCount} 条警告可在 Governor 工作台详情中查看。`,
          )}`,
        );
      }
    }

    const prompts = snapshot.result.interactionPrompts ?? [];
    if (prompts.length > 0) {
      lines.push(
        '',
        `## ${this.localizer.localizeText('Suggested next steps', '建议下一步')}`,
        ...prompts.map(
          (prompt) =>
            `- ${prompt.title} · ${prompt.action}${prompt.blocking ? ` (${this.localizer.localizeText('blocking', '阻塞项')})` : ''}`,
        ),
      );
    }

    const summaryLogs = snapshot.result.layeredLogs?.summary ?? [];
    if (summaryLogs.length > 0) {
      lines.push(
        '',
        `## ${this.localizer.localizeText('Key status', '关键状态')}`,
        ...summaryLogs.map((line) => `- ${line}`),
      );
    }

    const artifacts = snapshot.result.artifacts ?? [];
    if (artifacts.length > 0) {
      lines.push(
        '',
        `## ${this.localizer.localizeText('Diagnostics', '诊断产物')}`,
        ...artifacts.map((artifact) => `- \`${artifact.id}\`: \`${artifact.path}\``),
      );
    }

    return lines.join('\n');
  }

  private appendLatestWorkspaceOperationButtons(
    snapshot: OrchestrationWorkspaceOperationSnapshot | undefined,
    response: vscode.ChatResponseStream,
  ): void {
    const preferredArtifact = this.resolvePreferredWorkspaceOperationArtifact(snapshot);
    if (!preferredArtifact) {
      return;
    }
    const isDiagnosticsArtifact = this.isDiagnosticsArtifact(preferredArtifact.id);

    response.button({
      command: VSCODE_BUILTIN_OPEN_COMMAND_ID,
      title: this.localizer.localizeText(
        isDiagnosticsArtifact ? 'Open diagnostics file' : 'Open artifact file',
        isDiagnosticsArtifact ? '打开诊断文件' : '打开产物文件',
      ),
      arguments: [vscode.Uri.file(preferredArtifact.path)],
    });
  }

  private resolvePreferredWorkspaceOperationArtifact(
    snapshot: OrchestrationWorkspaceOperationSnapshot | undefined,
  ): WorkspaceOperationArtifact | undefined {
    const artifacts = snapshot?.result.artifacts ?? [];
    return (
      artifacts.find(
        (artifact) => artifact.id === WORKSPACE_OPERATION_PRIMARY_DIAGNOSTICS_ARTIFACT_ID,
      ) ??
      artifacts.find((artifact) => this.isDiagnosticsArtifact(artifact.id)) ??
      artifacts[0]
    );
  }

  private isDiagnosticsArtifact(artifactId: string): boolean {
    return artifactId
      .trim()
      .toLowerCase()
      .includes(WORKSPACE_OPERATION_DIAGNOSTICS_ARTIFACT_KEYWORD);
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
          'Captured in another locale. Rerun this workspace operation from the current workbench to refresh localized summary and details.',
          '该结果是在另一种语言下采集的。请从当前 workbench 重新执行该工作区操作，以刷新本地化摘要和详情。',
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

  private getUiLocaleFamily(): string {
    return this.localizer.localizeText('__locale_en__', '__locale_zh__') === '__locale_zh__'
      ? 'zh'
      : 'en';
  }

  private normalizeWorkspaceOperationLocaleFamily(locale: string): string {
    return locale.trim().toLowerCase().startsWith('zh') ? 'zh' : 'en';
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
      case OrchestrationWorkspaceOperationKind.CONNECT:
        return this.localizer.localizeText('Run connect', '执行 connect');
      default:
        return operationKind;
    }
  }

  private buildSessionTurnMarkdown(sessionTurn: VsCodeExtensionSessionTurnResult): string {
    const shouldReplaceBareSlashReply =
      sessionTurn.responseMode === 'command_handoff_preview' &&
      typeof sessionTurn.suggestedSlashCommand === 'string' &&
      sessionTurn.suggestedSlashCommand.trim().length > 0 &&
      sessionTurn.assistantMessage.trim() === sessionTurn.suggestedSlashCommand.trim();
    const lines = shouldReplaceBareSlashReply
      ? [
          `## ${this.localizer.localizeText('Suggested next step', '建议的下一步')}`,
          this.localizer.localizeText(
            'Governor routed this request to one governed command handoff.',
            'Governor 已将这个请求路由到一个受治理命令交接。',
          ),
        ]
      : [sessionTurn.assistantMessage];
    const metadataLines: string[] = [];
    if (sessionTurn.suggestedSlashCommand) {
      metadataLines.push(
        `- ${this.localizer.localizeText('Suggested slash command', '建议的 slash command')}: \`${sessionTurn.suggestedSlashCommand}\``,
      );
    }
    if (sessionTurn.handoffCommandPreview) {
      metadataLines.push(
        `- ${this.localizer.localizeText('Governed preview', '受治理预览')}: \`${sessionTurn.handoffCommandPreview}\``,
      );
    }
    if (sessionTurn.selectedSurface) {
      metadataLines.push(
        `- ${this.localizer.localizeText('Selected surface', '选中的表面')}: \`${sessionTurn.selectedSurface}\``,
      );
    }
    if (sessionTurn.commandBatches.length > 0) {
      metadataLines.push(
        `- ${this.localizer.localizeText('Command handoff batches', '命令交接批次')}: ${sessionTurn.commandBatches
          .map(
            (commandBatch) =>
              commandBatch.previewCommandLine ??
              commandBatch.slashQuery ??
              this.localizer.localizeText('unnamed batch', '未命名批次'),
          )
          .join(' | ')}`,
      );
    }
    if (sessionTurn.handoffBacklinks.length > 0) {
      metadataLines.push(
        `- ${this.localizer.localizeText('Backlinks', '回链')}: ${sessionTurn.handoffBacklinks
          .map((backlink) => backlink.target ?? backlink.label ?? backlink.kind ?? '')
          .filter((entry) => entry.length > 0)
          .join(' | ')}`,
      );
    }
    if (metadataLines.length === 0) {
      return lines.join('\n');
    }

    return [
      ...lines,
      '',
      `## ${this.localizer.localizeText('Session metadata', '会话元数据')}`,
      ...metadataLines,
    ].join('\n');
  }

  private appendSessionTurnButtons(
    sessionTurn: VsCodeExtensionSessionTurnResult,
    response: vscode.ChatResponseStream,
  ): void {
    response.button({
      command: VSCODE_EXTENSION_COMMAND_IDS.REFRESH,
      title: this.localizer.localizeText('Refresh Governor views', '刷新 Governor 视图'),
    });

    const suggestedButton =
      this.resolveSessionTurnCommandButton(sessionTurn.suggestedSlashCommand) ??
      this.resolveSessionTurnCommandButton(sessionTurn.commandBatches[0]?.slashQuery);
    if (!suggestedButton) {
      return;
    }

    response.button(suggestedButton);
  }

  private resolveSessionTurnCommandButton(
    suggestedSlashCommand?: string,
  ): { command: string; title: string } | undefined {
    const normalizedSlashCommand = suggestedSlashCommand?.trim().replace(/^\/+/u, '').toLowerCase();
    if (!normalizedSlashCommand) {
      return undefined;
    }

    if (normalizedSlashCommand === VSCODE_EXTENSION_CHAT_COMMAND_IDS.CONNECT) {
      return {
        command: VSCODE_EXTENSION_COMMAND_IDS.RUN_CONNECT,
        title: this.localizer.localizeText('Run /connect', '执行 /connect'),
      };
    }
    if (normalizedSlashCommand === VSCODE_EXTENSION_CHAT_COMMAND_IDS.DOCTOR) {
      return {
        command: VSCODE_EXTENSION_COMMAND_IDS.RUN_DOCTOR,
        title: this.localizer.localizeText('Run /doctor', '执行 /doctor'),
      };
    }
    if (normalizedSlashCommand === VSCODE_EXTENSION_CHAT_COMMAND_IDS.CHECK) {
      return {
        command: VSCODE_EXTENSION_COMMAND_IDS.RUN_CHECK,
        title: this.localizer.localizeText('Run /check', '执行 /check'),
      };
    }
    if (normalizedSlashCommand.startsWith(VSCODE_EXTENSION_CHAT_COMMAND_IDS.REVIEW)) {
      return {
        command: VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
        title: this.localizer.localizeText('Open Review Detail', '打开评审详情'),
      };
    }
    if (normalizedSlashCommand.startsWith('workflow')) {
      return {
        command: VSCODE_EXTENSION_COMMAND_IDS.OPEN_WORKFLOW_STUDIO,
        title: this.localizer.localizeText('Open Workflow Studio', '打开 Workflow Studio'),
      };
    }

    return undefined;
  }

  private localizeCommandExecutionStatus(
    status: VsCodeExtensionChatCommandExecutionResult['status'],
  ): string {
    switch (status) {
      case 'blocked':
        return this.localizer.localizeText('Blocked', '已阻断');
      case 'cancelled':
        return this.localizer.localizeText('Cancelled', '已取消');
      case 'completed':
        return this.localizer.localizeText('Completed', '已完成');
      case 'dispatched':
        return this.localizer.localizeText('Dispatched', '已发起');
      case 'failed':
        return this.localizer.localizeText('Failed', '失败');
      default:
        return status;
    }
  }
}
