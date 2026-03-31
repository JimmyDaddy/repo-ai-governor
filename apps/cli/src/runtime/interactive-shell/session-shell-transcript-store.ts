import {
  type OrchestrationSessionEvent,
  OrchestrationSessionEventType,
  OrchestrationSessionTranscriptRole,
} from '@repo-ai-governor/orchestration-service-client';
import { CliSessionTranscriptRole } from '../../constants/cli-session-shell.constant.js';
import type {
  CliSessionShellTranscriptBacklink,
  CliSessionShellTranscriptItem,
} from '../../types/index.js';

/**
 * Owns the presenter-side transcript cache derived from service-backed session events.
 *
 * Why this exists:
 * the CLI should render incremental event deltas without becoming the canonical owner of the
 * session transcript or cursor state.
 */
export class CliSessionShellTranscriptStore {
  private currentSessionId: string | null = null;
  private latestSequence = 0;
  private nextCursor: string | null = null;
  private readonly transcriptItems: CliSessionShellTranscriptItem[] = [];

  /**
   * Resets local presenter state before hydrating a new canonical session stream.
   * @param sessionId Canonical session id.
   * @returns Nothing.
   */
  public reset(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.latestSequence = 0;
    this.nextCursor = null;
    this.transcriptItems.splice(0, this.transcriptItems.length);
  }

  /**
   * Applies incremental service events and appends newly-renderable transcript items only once.
   * @param sessionId Canonical session id.
   * @param events Incremental session events.
   * @param translate CLI i18n translation function.
   * @returns Cloned transcript items after the delta is applied.
   */
  public applyEvents(
    sessionId: string,
    events: OrchestrationSessionEvent[],
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionShellTranscriptItem[] {
    if (this.currentSessionId !== sessionId) {
      this.reset(sessionId);
    }

    for (const event of events) {
      if (event.sequence <= this.latestSequence) {
        continue;
      }

      const transcriptItem = this.mapEventToTranscriptItem(event, translate);
      if (transcriptItem) {
        this.transcriptItems.push(transcriptItem);
      }
      this.latestSequence = event.sequence;
      this.nextCursor = event.streamCursor;
    }

    return this.listItems();
  }

  /**
   * Returns the current subscribe cursor for the presenter's incremental stream sync.
   * @returns Next cursor or `null` before the first sync completes.
   */
  public getNextCursor(): string | null {
    return this.nextCursor;
  }

  /**
   * Clears the current presenter transcript view while keeping the canonical session cursor intact.
   * @returns Nothing.
   */
  public clearView(): void {
    this.transcriptItems.splice(0, this.transcriptItems.length);
  }

  /**
   * Returns cloned transcript items so callers do not mutate store-owned state.
   * @returns Current transcript snapshot.
   */
  public listItems(): CliSessionShellTranscriptItem[] {
    return this.transcriptItems.map((item) => ({
      ...item,
      lines: [...item.lines],
      ...(item.backlinks ? { backlinks: item.backlinks.map((backlink) => ({ ...backlink })) } : {}),
    }));
  }

  private mapEventToTranscriptItem(
    event: OrchestrationSessionEvent,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionShellTranscriptItem | null {
    const role = event.payload.role;
    if (
      role !== OrchestrationSessionTranscriptRole.SYSTEM &&
      role !== OrchestrationSessionTranscriptRole.USER &&
      role !== OrchestrationSessionTranscriptRole.ASSISTANT &&
      role !== OrchestrationSessionTranscriptRole.SLASH_COMMAND
    ) {
      return null;
    }

    if (event.type === OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED) {
      const lines = this.readStringArray(event.payload.lines);
      if (lines.length === 0) {
        return null;
      }
      const requestedRenderKind = this.readTranscriptRenderKind(event.payload.metadata);

      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: this.mapTranscriptRole(role),
        label: this.resolveTranscriptLabel(role, translate),
        lines,
        renderKind:
          requestedRenderKind ??
          (role === OrchestrationSessionTranscriptRole.SYSTEM ? 'system_notice' : 'plain_text'),
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_SUBMITTED) {
      const content = this.readOptionalString(event.payload.content);
      if (!content) {
        return null;
      }

      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.USER,
        label: translate('cli.sessionShell.transcript.userLabel'),
        lines: [content],
        renderKind: 'plain_text',
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_COMPLETED) {
      const routeId = this.readOptionalString(event.payload.routeId) ?? 'session.main';
      const turnIndex = this.readOptionalNumber(event.payload.turnIndex);
      const assistantMessage = this.readOptionalString(event.payload.assistantMessage);
      const suggestedSlashCommand = this.readOptionalString(event.payload.suggestedSlashCommand);
      const executionIntent = this.readOptionalString(event.payload.executionIntent);
      const followUpQuestion = this.readOptionalString(event.payload.followUpQuestion);
      const handoffCommandPreview = this.readOptionalString(event.payload.handoffCommandPreview);
      const latestUserMessage = this.readOptionalString(event.payload.latestUserMessage);
      const responseMode = this.readOptionalString(event.payload.responseMode);
      const interactionMode = this.readOptionalString(event.payload.interactionMode);
      const selectedSurface = this.readOptionalString(event.payload.selectedSurface);
      const selectedBy = this.readOptionalString(event.payload.selectedBy);
      const synthesisMode = this.readOptionalString(event.payload.synthesisMode);
      const invokedRoleIds = this.readStringArray(event.payload.invokedRoleIds);
      const subagentCount = this.readOptionalNumber(event.payload.subagentCount);
      const handoffBacklinks = this.readBacklinks(event.payload.handoffBacklinks);
      if (assistantMessage && responseMode === 'role_collaboration') {
        return {
          id: `${event.sessionId}:${String(event.sequence)}`,
          role: CliSessionTranscriptRole.ASSISTANT,
          label: translate('cli.sessionShell.transcript.assistantLabel'),
          lines: this.buildCollaborationRecapLines({
            interactionMode,
            invokedRoleIds,
            subagentCount,
            synthesisMode,
            executionIntent,
            selectedSurface,
            selectedBy,
            translate,
          }),
          renderKind: 'collaboration_recap',
          markdownSource: assistantMessage,
        };
      }

      if (assistantMessage) {
        return {
          id: `${event.sessionId}:${String(event.sequence)}`,
          role: CliSessionTranscriptRole.ASSISTANT,
          label: translate('cli.sessionShell.transcript.assistantLabel'),
          lines: [assistantMessage],
          renderKind: 'markdown',
          markdownSource: assistantMessage,
        };
      }

      if (responseMode === 'command_handoff_preview' && suggestedSlashCommand) {
        return {
          id: `${event.sessionId}:${String(event.sequence)}`,
          role: CliSessionTranscriptRole.ASSISTANT,
          label: translate('cli.sessionShell.transcript.assistantLabel'),
          lines: [
            translate('cli.sessionShell.responses.mainTurnSuggestedSlash', {
              command: suggestedSlashCommand,
            }),
            ...(handoffCommandPreview
              ? [
                  translate('cli.sessionShell.responses.mainTurnHandoffPreview', {
                    preview: handoffCommandPreview,
                  }),
                ]
              : []),
            ...(executionIntent
              ? [
                  translate('cli.sessionShell.responses.mainTurnExecutionIntent', {
                    executionIntent,
                  }),
                ]
              : []),
            ...(selectedSurface && selectedBy
              ? [
                  translate('cli.sessionShell.responses.mainTurnRoutingSelection', {
                    selectedSurface,
                    selectedBy,
                  }),
                ]
              : []),
          ],
          renderKind: 'command_recap',
          backlinks: handoffBacklinks,
        };
      }

      if (responseMode === 'follow_up_question' && followUpQuestion) {
        return {
          id: `${event.sessionId}:${String(event.sequence)}`,
          role: CliSessionTranscriptRole.ASSISTANT,
          label: translate('cli.sessionShell.transcript.assistantLabel'),
          lines: [
            translate('cli.sessionShell.responses.mainTurnFollowUpPrompt'),
            followUpQuestion,
            ...(selectedSurface && selectedBy
              ? [
                  translate('cli.sessionShell.responses.mainTurnRoutingSelection', {
                    selectedSurface,
                    selectedBy,
                  }),
                ]
              : []),
          ],
          renderKind: 'system_notice',
          backlinks: handoffBacklinks,
        };
      }

      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.ASSISTANT,
        label: translate('cli.sessionShell.transcript.assistantLabel'),
        lines: [
          translate('cli.sessionShell.responses.mainTurnAccepted', {
            routeId,
            turnIndex: String(turnIndex ?? event.sequence),
          }),
          ...(latestUserMessage
            ? [
                translate('cli.sessionShell.responses.mainTurnEcho', {
                  userMessage: latestUserMessage,
                }),
              ]
            : []),
          ...(executionIntent
            ? [
                translate('cli.sessionShell.responses.mainTurnExecutionIntent', {
                  executionIntent,
                }),
              ]
            : []),
          ...(selectedSurface && selectedBy
            ? [
                translate('cli.sessionShell.responses.mainTurnRoutingSelection', {
                  selectedSurface,
                  selectedBy,
                }),
              ]
            : []),
        ],
        renderKind: 'command_recap',
        backlinks: handoffBacklinks,
      };
    }

    if (event.type === OrchestrationSessionEventType.SESSION_RESUMED) {
      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.SYSTEM,
        label: translate('cli.sessionShell.transcript.systemLabel'),
        lines: [
          translate('cli.sessionShell.responses.sessionResumed', {
            sessionId: event.sessionId,
            resumeSelector: this.readOptionalString(event.payload.resumeSelector) ?? 'latest',
          }),
        ],
        renderKind: 'system_notice',
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_FAILED) {
      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.SYSTEM,
        label: translate('cli.sessionShell.transcript.systemLabel'),
        lines: [
          translate('cli.sessionShell.responses.turnFailed', {
            reason: this.readOptionalString(event.payload.errorMessage) ?? 'unknown',
          }),
          translate('cli.sessionShell.responses.turnRecoverableHint'),
        ],
        renderKind: 'system_notice',
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_CANCELLED) {
      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.SYSTEM,
        label: translate('cli.sessionShell.transcript.systemLabel'),
        lines: [
          translate('cli.sessionShell.responses.turnCancelled'),
          translate('cli.sessionShell.responses.turnRecoverableHint'),
        ],
        renderKind: 'system_notice',
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_STREAM_DELTA) {
      return null;
    }

    return null;
  }

  private buildCollaborationRecapLines(options: {
    interactionMode?: string;
    invokedRoleIds: string[];
    subagentCount?: number;
    synthesisMode?: string;
    executionIntent?: string;
    selectedSurface?: string;
    selectedBy?: string;
    translate: (key: string, interpolation?: Record<string, string>) => string;
  }): string[] {
    const modeLabel = this.resolveCollaborationModeLabel(
      options.interactionMode,
      options.translate,
    );
    const lines = [
      options.translate('cli.sessionShell.responses.mainTurnCollaborationAccepted', {
        mode: modeLabel,
      }),
    ];
    if (options.invokedRoleIds.length > 0) {
      lines.push(
        options.translate('cli.sessionShell.responses.mainTurnCollaborationRoles', {
          roles: options.invokedRoleIds.join(' · '),
          count: String(options.subagentCount ?? options.invokedRoleIds.length),
        }),
      );
    }
    if (options.synthesisMode) {
      lines.push(
        options.translate('cli.sessionShell.responses.mainTurnCollaborationSynthesis', {
          synthesisMode: options.synthesisMode,
        }),
      );
    }
    if (options.executionIntent) {
      lines.push(
        options.translate('cli.sessionShell.responses.mainTurnExecutionIntent', {
          executionIntent: options.executionIntent,
        }),
      );
    }
    if (options.selectedSurface && options.selectedBy) {
      lines.push(
        options.translate('cli.sessionShell.responses.mainTurnRoutingSelection', {
          selectedSurface: options.selectedSurface,
          selectedBy: options.selectedBy,
        }),
      );
    }
    return lines;
  }

  private resolveCollaborationModeLabel(
    interactionMode: string | undefined,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): string {
    switch (interactionMode) {
      case 'single_role_delegate':
        return translate('cli.sessionShell.responses.mainTurnCollaborationModeSingleRole');
      case 'serial_role_collaboration':
        return translate('cli.sessionShell.responses.mainTurnCollaborationModeSerial');
      case 'parallel_role_fanout':
        return translate('cli.sessionShell.responses.mainTurnCollaborationModeParallel');
      default:
        return interactionMode ?? 'role collaboration';
    }
  }

  private mapTranscriptRole(role: OrchestrationSessionTranscriptRole): CliSessionTranscriptRole {
    if (role === OrchestrationSessionTranscriptRole.USER) {
      return CliSessionTranscriptRole.USER;
    }
    if (role === OrchestrationSessionTranscriptRole.ASSISTANT) {
      return CliSessionTranscriptRole.ASSISTANT;
    }
    if (role === OrchestrationSessionTranscriptRole.SLASH_COMMAND) {
      return CliSessionTranscriptRole.SLASH_COMMAND;
    }
    return CliSessionTranscriptRole.SYSTEM;
  }

  private resolveTranscriptLabel(
    role: OrchestrationSessionTranscriptRole,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): string {
    if (role === OrchestrationSessionTranscriptRole.USER) {
      return translate('cli.sessionShell.transcript.userLabel');
    }
    if (role === OrchestrationSessionTranscriptRole.ASSISTANT) {
      return translate('cli.sessionShell.transcript.assistantLabel');
    }
    if (role === OrchestrationSessionTranscriptRole.SLASH_COMMAND) {
      return translate('cli.sessionShell.transcript.slashLabel');
    }
    return translate('cli.sessionShell.transcript.systemLabel');
  }

  private readOptionalString(candidate: unknown): string | undefined {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }

    return undefined;
  }

  private readOptionalNumber(candidate: unknown): number | undefined {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    return undefined;
  }

  private readStringArray(candidate: unknown): string[] {
    if (!Array.isArray(candidate)) {
      return [];
    }

    return candidate.filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
  }

  private readTranscriptRenderKind(
    candidate: unknown,
  ): CliSessionShellTranscriptItem['renderKind'] | undefined {
    if (!candidate || typeof candidate !== 'object') {
      return undefined;
    }

    const renderKind = (candidate as Record<string, unknown>).renderKind;
    if (
      renderKind === 'plain_text' ||
      renderKind === 'markdown' ||
      renderKind === 'system_notice' ||
      renderKind === 'command_recap' ||
      renderKind === 'collaboration_recap'
    ) {
      return renderKind;
    }

    return undefined;
  }

  private readBacklinks(candidate: unknown): CliSessionShellTranscriptBacklink[] {
    if (!Array.isArray(candidate)) {
      return [];
    }

    return candidate
      .map((value) => {
        if (!value || typeof value !== 'object') {
          return null;
        }
        const backlink = value as {
          kind?: unknown;
          label?: unknown;
          target?: unknown;
        };
        if (
          typeof backlink.kind !== 'string' ||
          typeof backlink.label !== 'string' ||
          typeof backlink.target !== 'string'
        ) {
          return null;
        }

        return {
          kind: backlink.kind,
          label: backlink.label,
          target: backlink.target,
        };
      })
      .filter((backlink): backlink is CliSessionShellTranscriptBacklink => backlink !== null);
  }
}
