import * as vscode from 'vscode';

import { standardizeError } from '@repo-ai-governor/shared';
import {
  VSCODE_EXTENSION_CHAT_COMMAND_REVIEW,
  VSCODE_EXTENSION_COMMAND_IDS,
} from '../constants/index.js';
import type { VsCodeExtensionLocalizer } from './vscode-extension-localizer.js';
import type { VsCodeExtensionPresentationBuilder } from './vscode-extension-presentation-builder.js';
import type { VsCodeExtensionSelectionStore } from './vscode-extension-selection-store.js';
import type { VsCodeExtensionServiceRuntime } from './vscode-extension-service-runtime.js';

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
        response.progress(
          this.localizer.localizeText(
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
          request.command === VSCODE_EXTENSION_CHAT_COMMAND_REVIEW
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

        response.markdown(
          this.presentationBuilder.buildChatResponseMarkdown({
            command: request.command,
            workspaceContext,
            executionBoardEntries: executionBoard.executions,
            hitlInboxEntries: hitlInbox.pendingDecisions,
            queueOverview,
            ...(reviewDetailSnapshot
              ? {
                  reviewDetailSnapshot,
                }
              : {}),
          }),
        );
        response.button({
          command: VSCODE_EXTENSION_COMMAND_IDS.REFRESH,
          title: this.localizer.localizeText('Refresh Governor views', '刷新 Governor 视图'),
        });
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
}
