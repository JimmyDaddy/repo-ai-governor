import {
  type OrchestrationSessionEvent,
  OrchestrationSessionEventType,
} from '@repo-ai-governor/orchestration-service-client';
import { ExecutionProgressStatus } from '@repo-ai-governor/shared';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import { ReactCliCommandProgressController } from '../../react-cli/index.js';
import type { CliCommandProgressPanelViewModel } from '../../types/index.js';

interface CliSessionShellTurnProgressDockOptions {
  themePreset?: CliReactThemePreset;
  translate: (key: string, interpolation?: Record<string, string>) => string;
  onPanelUpdate: (panel: CliCommandProgressPanelViewModel | undefined) => void;
  onRenderRequested: () => void;
}

const SESSION_MAIN_STREAM_COMMAND_NAME = 'session.main';
const SESSION_MAIN_STREAM_TITLE = '[session-shell:session.main] session.main turn';
const SESSION_MAIN_STREAM_SUBTITLE = 'service-owned streaming turn progress';

/**
 * Owns running-panel projection for service-backed `session.main` stream deltas.
 *
 * Why this exists:
 * supervisor streaming should light up the foreground running presenter instead of degrading
 * into append-only transcript noise.
 */
export class CliSessionShellTurnProgressDock {
  private readonly controller: ReactCliCommandProgressController;
  private activeTurnId: string | null = null;

  public constructor(private readonly options: CliSessionShellTurnProgressDockOptions) {
    this.controller = new ReactCliCommandProgressController({
      commandName: SESSION_MAIN_STREAM_COMMAND_NAME,
      initialTitle: SESSION_MAIN_STREAM_TITLE,
      initialSubtitle: SESSION_MAIN_STREAM_SUBTITLE,
      themePreset: options.themePreset,
      translate: options.translate,
    });
  }

  /**
   * Applies session events to the running-progress panel when they belong to one active turn.
   * @param events Incremental session events.
   * @returns Nothing.
   */
  public applySessionEvents(events: OrchestrationSessionEvent[]): void {
    for (const event of events) {
      if (event.type === OrchestrationSessionEventType.TURN_STREAM_DELTA) {
        this.applyStreamDelta(event);
        continue;
      }

      const turnId = this.readOptionalString(event.payload.turnId);
      if (!turnId || turnId !== this.activeTurnId) {
        continue;
      }

      if (
        event.type === OrchestrationSessionEventType.TURN_COMPLETED ||
        event.type === OrchestrationSessionEventType.TURN_FAILED ||
        event.type === OrchestrationSessionEventType.TURN_CANCELLED
      ) {
        this.clear();
      }
    }
  }

  /**
   * Refreshes elapsed/heartbeat state while one turn is still active.
   * @returns Nothing.
   */
  public refresh(): void {
    if (!this.activeTurnId) {
      return;
    }

    const snapshot = this.controller.refresh();
    this.options.onPanelUpdate(snapshot.commandProgressPanel);
    this.options.onRenderRequested();
  }

  /**
   * Clears the current turn-running panel.
   * @returns Nothing.
   */
  public clear(): void {
    if (!this.activeTurnId) {
      return;
    }
    this.activeTurnId = null;
    this.options.onPanelUpdate(undefined);
    this.options.onRenderRequested();
  }

  private applyStreamDelta(event: OrchestrationSessionEvent): void {
    const turnId = this.readOptionalString(event.payload.turnId);
    if (!turnId) {
      return;
    }
    if (this.activeTurnId && this.activeTurnId !== turnId) {
      return;
    }
    this.activeTurnId = turnId;

    const streamKind = this.readOptionalString(event.payload.streamKind) ?? 'lifecycle';
    const streamState = this.readOptionalString(event.payload.streamState) ?? 'running';
    const roleId = this.readOptionalString(event.payload.roleId);
    const title =
      this.readOptionalString(event.payload.title) ??
      (roleId ? `${roleId} streaming` : 'Session main');
    const detail =
      this.readOptionalString(event.payload.accumulatedText) ??
      this.readOptionalString(event.payload.chunkText) ??
      this.readOptionalString(event.payload.detail) ??
      this.readOptionalString(event.payload.delta) ??
      title;
    const selectedSurface = this.readOptionalString(event.payload.selectedSurface);
    const toolName = this.readOptionalString(event.payload.toolName);
    const toolCallId = this.readOptionalString(event.payload.toolCallId);
    const rowId =
      streamKind === 'tool_call'
        ? `tool:${toolCallId ?? toolName ?? roleId ?? 'call'}`
        : streamKind === 'token'
          ? `draft:${roleId ?? 'assistant'}`
          : `lifecycle:${roleId ?? 'session.main'}`;

    const snapshot = this.controller.apply({
      commandName: SESSION_MAIN_STREAM_COMMAND_NAME,
      title:
        selectedSurface && selectedSurface.length > 0 ? `${title} (${selectedSurface})` : title,
      subtitle: SESSION_MAIN_STREAM_SUBTITLE,
      runState:
        streamState === 'completed' ? 'success' : streamState === 'failed' ? 'failure' : 'running',
      statusLine:
        selectedSurface && selectedSurface.length > 0
          ? `${detail} [surface=${selectedSurface}]`
          : detail,
      currentStepTitle: title,
      row: {
        id: rowId,
        title: streamKind === 'tool_call' && toolName ? `Tool: ${toolName}` : title,
        status:
          streamState === 'completed'
            ? ExecutionProgressStatus.COMPLETED
            : streamState === 'failed'
              ? ExecutionProgressStatus.FAILED
              : ExecutionProgressStatus.RUNNING,
        detail,
      },
      ...(streamKind === 'tool_call' && toolName
        ? {
            logLine: `${toolName}: ${detail}`,
          }
        : {}),
      occurredAt: event.createdAt,
    });
    this.options.onPanelUpdate(snapshot.commandProgressPanel);
    this.options.onRenderRequested();
  }

  private readOptionalString(candidate: unknown): string | undefined {
    return typeof candidate === 'string' && candidate.trim().length > 0
      ? candidate.trim()
      : undefined;
  }
}
