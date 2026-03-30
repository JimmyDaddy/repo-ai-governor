import {
  type OrchestrationSessionEvent,
  OrchestrationSessionEventType,
  OrchestrationSessionTranscriptRole,
} from '@repo-ai-governor/orchestration-service-client';
import { CliSessionTranscriptRole } from '../../constants/cli-session-shell.constant.js';
import type { CliSessionShellTranscriptItem } from '../../types/index.js';

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

      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: this.mapTranscriptRole(role),
        label: this.resolveTranscriptLabel(role, translate),
        lines,
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
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_COMPLETED) {
      const routeId = this.readOptionalString(event.payload.routeId) ?? 'session.main';
      const turnIndex = this.readOptionalNumber(event.payload.turnIndex);
      const latestUserMessage = this.readOptionalString(event.payload.latestUserMessage) ?? '';
      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.ASSISTANT,
        label: translate('cli.sessionShell.transcript.assistantLabel'),
        lines: [
          translate('cli.sessionShell.responses.mainTurnAccepted', {
            routeId,
            turnIndex: String(turnIndex ?? event.sequence),
          }),
          translate('cli.sessionShell.responses.mainTurnEcho', {
            userMessage: latestUserMessage,
          }),
        ],
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
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_STREAM_DELTA) {
      return null;
    }

    if (event.type !== OrchestrationSessionEventType.SESSION_STARTED) {
      return null;
    }

    return {
      id: `${event.sessionId}:${String(event.sequence)}`,
      role: CliSessionTranscriptRole.SYSTEM,
      label: translate('cli.sessionShell.transcript.systemLabel'),
      lines: [
        translate('cli.sessionShell.responses.welcome'),
        translate('cli.sessionShell.responses.stderrOnly'),
        translate('cli.sessionShell.responses.sessionStarted', {
          sessionId: event.sessionId,
          routeId: this.readOptionalString(event.payload.routeId) ?? 'session.main',
        }),
      ],
    };
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
}
