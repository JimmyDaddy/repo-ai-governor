import * as vscode from 'vscode';

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
        const commandExecution = await this.commandController.executeChatRequest(
          request.command,
          request.prompt,
        );
        const trimmedPrompt = request.prompt?.trim();
        const resolvedCommandName = request.command ?? commandExecution?.commandName;
        const wasPromptInferred = request.command === undefined && commandExecution !== undefined;
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
        response.progress(
          wasPromptInferred
            ? this.localizer.localizeText(
                `Interpreted your request as /${commandExecution.commandName}. Refreshing the Governor snapshot…`,
                `已将你的请求解析为 /${commandExecution.commandName}。正在刷新 Governor 快照...`,
              )
            : commandExecution
              ? this.localizer.localizeText(
                  `Executed /${resolvedCommandName}. Refreshing the Governor snapshot…`,
                  `已执行 /${resolvedCommandName}。正在刷新 Governor 快照...`,
                )
              : this.localizer.localizeText(
                  'Refreshing Governor status from the local orchestration service…',
                  '正在从本地编排服务刷新 Governor 状态...',
                ),
        );
        const workspaceContext = await this.serviceRuntime.resolveWorkspaceContextSnapshot();
        const [executionBoard, hitlInbox, queueOverview] = await Promise.all([
          this.serviceRuntime.queryExecutionBoard(),
          this.serviceRuntime.queryHitlInbox(),
          this.serviceRuntime.queryQueueOverview(),
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
                statusMarkdown,
                wasPromptInferred,
              )
            : statusMarkdown,
        );
        response.button({
          command: VSCODE_EXTENSION_COMMAND_IDS.REFRESH,
          title: this.localizer.localizeText('Refresh Governor views', '刷新 Governor 视图'),
        });
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

  private buildCommandExecutionMarkdown(
    commandName: string,
    commandExecution: VsCodeExtensionChatCommandExecutionResult,
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
      '',
      statusMarkdown,
    ];
    return lines.join('\n');
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
