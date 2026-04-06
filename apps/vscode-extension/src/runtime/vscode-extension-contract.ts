import {
  VSCODE_EXTENSION_CHAT_COMMAND_REVIEW,
  VSCODE_EXTENSION_CHAT_COMMAND_STATUS,
  VSCODE_EXTENSION_CHAT_PARTICIPANT_ID,
  VSCODE_EXTENSION_CHAT_PARTICIPANT_NAME,
  VSCODE_EXTENSION_COMMAND_IDS,
  VSCODE_EXTENSION_CONTAINER_ID,
  VSCODE_EXTENSION_TRUST_GATED_COMMAND_IDS,
  VSCODE_EXTENSION_VIEW_IDS,
} from '../constants/index.js';
import type {
  VsCodeExtensionChatCommandContribution,
  VsCodeExtensionCommandContribution,
  VsCodeExtensionContractSnapshot,
  VsCodeExtensionViewContribution,
} from '../types/interfaces/index.js';

/**
 * Builds the frozen extension contribution snapshot that package.json must mirror.
 *
 * Why this exists:
 * sprint-002 contract freeze should keep one code-level truth for IDs and trust-sensitive
 * boundaries before implementation adds actual view/chat/command behavior.
 */
export class VsCodeExtensionContract {
  public createSnapshot(): VsCodeExtensionContractSnapshot {
    return {
      containerId: VSCODE_EXTENSION_CONTAINER_ID,
      chatParticipantId: VSCODE_EXTENSION_CHAT_PARTICIPANT_ID,
      chatParticipantName: VSCODE_EXTENSION_CHAT_PARTICIPANT_NAME,
      trustMode: 'limited',
      views: this.createViews(),
      commands: this.createCommands(),
      chatCommands: this.createChatCommands(),
    };
  }

  private createViews(): readonly VsCodeExtensionViewContribution[] {
    return [
      {
        id: VSCODE_EXTENSION_VIEW_IDS.EXECUTION_BOARD,
        titleKey: 'views.executionBoard.title',
        kind: 'tree',
        trustSensitive: false,
      },
      {
        id: VSCODE_EXTENSION_VIEW_IDS.HITL_INBOX,
        titleKey: 'views.hitlInbox.title',
        kind: 'tree',
        trustSensitive: false,
      },
      {
        id: VSCODE_EXTENSION_VIEW_IDS.WORKSPACE_CONTEXT,
        titleKey: 'views.workspaceContext.title',
        kind: 'tree',
        trustSensitive: false,
      },
      {
        id: VSCODE_EXTENSION_VIEW_IDS.REVIEW_DETAIL,
        titleKey: 'views.reviewDetail.title',
        kind: 'webview',
        trustSensitive: false,
      },
    ];
  }

  private createCommands(): readonly VsCodeExtensionCommandContribution[] {
    return [
      this.createCommand(VSCODE_EXTENSION_COMMAND_IDS.REFRESH, 'commands.refresh.title'),
      this.createCommand(
        VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
        'commands.openReviewDetail.title',
      ),
      this.createCommand(
        VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET,
        'commands.openHandoffTarget.title',
      ),
      this.createCommand(
        VSCODE_EXTENSION_COMMAND_IDS.SUBMIT_HITL_DECISION,
        'commands.submitHitlDecision.title',
      ),
      this.createCommand(
        VSCODE_EXTENSION_COMMAND_IDS.RECOVER_EXECUTION,
        'commands.recoverExecution.title',
      ),
      this.createCommand(
        VSCODE_EXTENSION_COMMAND_IDS.TERMINATE_EXECUTION,
        'commands.terminateExecution.title',
      ),
    ];
  }

  private createChatCommands(): readonly VsCodeExtensionChatCommandContribution[] {
    return [
      {
        name: VSCODE_EXTENSION_CHAT_COMMAND_STATUS,
        descriptionKey: 'chat.commands.status.description',
      },
      {
        name: VSCODE_EXTENSION_CHAT_COMMAND_REVIEW,
        descriptionKey: 'chat.commands.review.description',
      },
    ];
  }

  private createCommand(
    id: VsCodeExtensionCommandContribution['id'],
    titleKey: string,
  ): VsCodeExtensionCommandContribution {
    return {
      id,
      titleKey,
      trustSensitive: VSCODE_EXTENSION_TRUST_GATED_COMMAND_IDS.includes(
        id as (typeof VSCODE_EXTENSION_TRUST_GATED_COMMAND_IDS)[number],
      ),
    };
  }
}
