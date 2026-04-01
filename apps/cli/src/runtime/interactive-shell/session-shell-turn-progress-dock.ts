import {
  type OrchestrationSessionEvent,
  OrchestrationSessionEventType,
} from '@repo-ai-governor/orchestration-service-client';
import { CliSessionTranscriptRole } from '../../constants/cli-session-shell.constant.js';
import type { CliSessionShellTranscriptItem } from '../../types/index.js';

interface CliSessionShellTurnProgressDockOptions {
  translate: (key: string, interpolation?: Record<string, string>) => string;
}

interface LiveTurnActivityEntry {
  order: number;
  text: string;
}

const LIVE_TURN_HEARTBEAT_ENTRY_ID = 'heartbeat:session.main';
const LIVE_TURN_HEARTBEAT_SUFFIX_FRAMES = ['...', '.', '..'] as const;

/**
 * Owns presenter-local streaming projection for service-backed `session.main` turns.
 *
 * Why this exists:
 * the session shell should present `session.main` as one live conversation surface instead of
 * forcing the user to watch a detached progress panel before the final answer lands.
 */
export class CliSessionShellTurnProgressDock {
  private activeTurnId: string | null = null;
  private liveTurnActive = false;
  private nextActivityOrder = 0;
  private currentAssistantDraft: string | null = null;
  private heartbeatFrameIndex = 0;
  private readonly liveActivityEntries = new Map<string, LiveTurnActivityEntry>();

  public constructor(private readonly options: CliSessionShellTurnProgressDockOptions) {}

  /**
   * Seeds one optimistic streaming state before the first service delta arrives.
   * @returns Nothing.
   */
  public seedRunningState(): void {
    this.liveTurnActive = true;
    this.activeTurnId = null;
    this.currentAssistantDraft = null;
    this.liveActivityEntries.clear();
    this.nextActivityOrder = 0;
    this.heartbeatFrameIndex = 0;
    this.upsertActivityEntry(LIVE_TURN_HEARTBEAT_ENTRY_ID, this.renderHeartbeatText());
  }

  /**
   * Applies incremental session events into the presenter-local live turn state.
   * @param events Incremental session events.
   * @returns Nothing.
   */
  public applySessionEvents(events: OrchestrationSessionEvent[]): void {
    for (const event of events) {
      if (event.type === OrchestrationSessionEventType.TURN_STREAM_DELTA) {
        this.applyStreamDelta(event);
        continue;
      }

      if (
        event.type !== OrchestrationSessionEventType.TURN_COMPLETED &&
        event.type !== OrchestrationSessionEventType.TURN_FAILED &&
        event.type !== OrchestrationSessionEventType.TURN_CANCELLED
      ) {
        continue;
      }

      const turnId = this.readOptionalString(event.payload.turnId);
      if (this.activeTurnId) {
        if (turnId === this.activeTurnId) {
          this.clear();
        }
        continue;
      }

      if (this.liveTurnActive) {
        this.clear();
      }
    }
  }

  /**
   * Projects the current live state into transcript items layered on top of canonical transcript.
   * @param sessionId Current foreground session id.
   * @param baseItems Canonical transcript items from the service-backed store.
   * @returns Render-ready transcript items.
   */
  public projectTranscriptItems(
    sessionId: string,
    baseItems: CliSessionShellTranscriptItem[],
  ): CliSessionShellTranscriptItem[] {
    if (!this.liveTurnActive) {
      return [...baseItems];
    }

    const projectedItems = [...baseItems];
    if (this.currentAssistantDraft && this.currentAssistantDraft.trim().length > 0) {
      projectedItems.push({
        id: `${sessionId}:live:assistant`,
        role: CliSessionTranscriptRole.ASSISTANT,
        label: this.options.translate('cli.sessionShell.transcript.assistantLabel'),
        lines: [this.currentAssistantDraft],
        renderKind: 'live_markdown',
        markdownSource: this.currentAssistantDraft,
      });
    }

    const activityLines = [...this.liveActivityEntries.values()]
      .sort((left, right) => left.order - right.order)
      .map((entry) => entry.text);
    if (activityLines.length > 0) {
      projectedItems.push({
        id: `${sessionId}:live:activity`,
        role: CliSessionTranscriptRole.SYSTEM,
        label: this.options.translate('cli.sessionShell.responses.liveTurnActivityTitle'),
        lines: activityLines,
        renderKind: 'live_activity',
      });
    }

    return projectedItems;
  }

  /**
   * Clears the active live turn state after terminal events or local recovery paths.
   * @returns Nothing.
   */
  public clear(): void {
    this.activeTurnId = null;
    this.liveTurnActive = false;
    this.currentAssistantDraft = null;
    this.liveActivityEntries.clear();
    this.nextActivityOrder = 0;
    this.heartbeatFrameIndex = 0;
  }

  /**
   * Refresh is intentionally a no-op for transcript-owned live streaming.
   * @returns Nothing.
   */
  public refresh(): void {
    if (!this.liveTurnActive) {
      return;
    }

    this.upsertActivityEntry(LIVE_TURN_HEARTBEAT_ENTRY_ID, this.renderHeartbeatText());
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
    this.liveTurnActive = true;

    const streamKind = this.readOptionalString(event.payload.streamKind) ?? 'lifecycle';
    if (streamKind === 'token') {
      this.applyTokenDelta(event);
      return;
    }

    if (streamKind === 'tool_call') {
      this.applyToolCallDelta(event);
      return;
    }

    this.applyLifecycleDelta(event);
  }

  private applyTokenDelta(event: OrchestrationSessionEvent): void {
    const accumulatedText = this.readOptionalString(event.payload.accumulatedText);
    if (accumulatedText) {
      this.currentAssistantDraft = accumulatedText;
      return;
    }

    const chunkText =
      this.readOptionalString(event.payload.chunkText) ??
      this.readOptionalString(event.payload.delta);
    if (!chunkText) {
      return;
    }

    this.currentAssistantDraft =
      this.currentAssistantDraft && this.currentAssistantDraft.length > 0
        ? `${this.currentAssistantDraft}${chunkText}`
        : chunkText;
  }

  private applyToolCallDelta(event: OrchestrationSessionEvent): void {
    const toolName =
      this.readOptionalString(event.payload.toolName) ??
      this.readOptionalString(event.payload.title) ??
      'tool';
    const detail =
      this.readOptionalString(event.payload.detail) ??
      this.readOptionalString(event.payload.chunkText) ??
      this.readOptionalString(event.payload.accumulatedText) ??
      toolName;
    const toolCallId =
      this.readOptionalString(event.payload.toolCallId) ??
      this.readOptionalString(event.payload.toolName) ??
      toolName;

    this.upsertActivityEntry(
      `tool:${toolCallId}`,
      this.options.translate('cli.sessionShell.responses.liveTurnToolCall', {
        toolName,
        detail,
      }),
    );
  }

  private applyLifecycleDelta(event: OrchestrationSessionEvent): void {
    const detail =
      this.readOptionalString(event.payload.detail) ??
      this.readOptionalString(event.payload.accumulatedText) ??
      this.readOptionalString(event.payload.chunkText) ??
      this.readOptionalString(event.payload.title);
    if (!detail) {
      return;
    }

    const roleId = this.readOptionalString(event.payload.roleId);
    const entryKey = roleId ? `lifecycle:${roleId}` : 'lifecycle:session.main.detail';
    const text = roleId
      ? this.options.translate('cli.sessionShell.responses.liveTurnRoleActivity', {
          role: roleId,
          detail,
        })
      : this.options.translate('cli.sessionShell.responses.liveTurnThinkingDetail', {
          detail,
        });

    this.upsertActivityEntry(entryKey, text);
  }

  private upsertActivityEntry(activityId: string, text: string): void {
    const existingEntry = this.liveActivityEntries.get(activityId);
    this.liveActivityEntries.set(activityId, {
      order: existingEntry?.order ?? this.nextActivityOrder++,
      text,
    });
  }

  private renderHeartbeatText(): string {
    const suffix = LIVE_TURN_HEARTBEAT_SUFFIX_FRAMES[this.heartbeatFrameIndex] ?? '...';
    this.heartbeatFrameIndex =
      (this.heartbeatFrameIndex + 1) % LIVE_TURN_HEARTBEAT_SUFFIX_FRAMES.length;
    return this.options.translate('cli.sessionShell.responses.liveTurnThinkingPulse', {
      suffix,
    });
  }

  private readOptionalString(candidate: unknown): string | undefined {
    return typeof candidate === 'string' && candidate.trim().length > 0
      ? candidate.trim()
      : undefined;
  }
}
