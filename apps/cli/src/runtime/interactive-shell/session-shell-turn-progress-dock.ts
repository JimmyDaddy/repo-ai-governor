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

const LIVE_ACTIVITY_MAX_ENTRIES = 8;

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
  private liveTurnStartedAtMs: number | null = null;
  private readonly liveActivityEntries = new Map<string, LiveTurnActivityEntry>();
  private readonly activityHistoryLines: string[] = [];
  private readonly completedTurnDetails = new Map<string, string[]>();

  public constructor(private readonly options: CliSessionShellTurnProgressDockOptions) {}

  /**
   * Seeds one optimistic streaming state before the first service delta arrives.
   * @returns Nothing.
   */
  public seedRunningState(): void {
    this.liveTurnActive = true;
    this.activeTurnId = null;
    this.currentAssistantDraft = null;
    this.liveTurnStartedAtMs = Date.now();
    this.liveActivityEntries.clear();
    this.activityHistoryLines.splice(0, this.activityHistoryLines.length);
    this.nextActivityOrder = 0;
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
          this.captureCompletedTurnDetails(turnId);
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
    const summaryLine = this.renderHeartbeatText();
    if (summaryLine || activityLines.length > 0) {
      projectedItems.push({
        id: `${sessionId}:live:activity`,
        role: CliSessionTranscriptRole.SYSTEM,
        label: this.options.translate('cli.sessionShell.responses.liveTurnActivityTitle'),
        lines: activityLines,
        renderKind: 'live_activity',
        summaryLine,
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
    this.liveTurnStartedAtMs = null;
    this.liveActivityEntries.clear();
    this.activityHistoryLines.splice(0, this.activityHistoryLines.length);
    this.nextActivityOrder = 0;
  }

  /**
   * Consumes saved execution details captured for one completed turn.
   * @param turnId Terminal turn id.
   * @returns Saved detail lines, if any.
   */
  public consumeCompletedTurnDetails(turnId: string): string[] {
    const details = this.completedTurnDetails.get(turnId);
    if (!details) {
      return [];
    }

    this.completedTurnDetails.delete(turnId);
    return [...details];
  }

  /**
   * Refresh is intentionally a no-op for transcript-owned live streaming.
   * @returns Nothing.
   */
  public refresh(): void {
    return;
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
    const entryKey =
      this.readOptionalString(event.payload.activityKey) ??
      (roleId ? `lifecycle:${roleId}` : 'lifecycle:session.main.detail');
    const text = roleId
      ? this.options.translate('cli.sessionShell.responses.liveTurnRoleActivity', {
          role: roleId,
          detail,
        })
      : this.options.translate('cli.sessionShell.responses.liveTurnCurrentDetail', {
          detail,
        });

    this.upsertActivityEntry(entryKey, text);
  }

  private upsertActivityEntry(activityId: string, text: string): void {
    this.recordActivityHistory(text);
    const existingEntry = this.liveActivityEntries.get(activityId);
    this.liveActivityEntries.set(activityId, {
      order: existingEntry?.order ?? this.nextActivityOrder++,
      text,
    });
    if (this.liveActivityEntries.size <= LIVE_ACTIVITY_MAX_ENTRIES) {
      return;
    }

    const oldestEntry = [...this.liveActivityEntries.entries()].sort(
      (left, right) => left[1].order - right[1].order,
    )[0];
    if (!oldestEntry || oldestEntry[0] === activityId) {
      return;
    }
    this.liveActivityEntries.delete(oldestEntry[0]);
  }

  private renderHeartbeatText(): string | undefined {
    if (!this.liveTurnActive) {
      return undefined;
    }

    const elapsedSeconds =
      this.liveTurnStartedAtMs === null
        ? 0
        : Math.max(0, Math.floor((Date.now() - this.liveTurnStartedAtMs) / 1000));
    return this.options.translate('cli.sessionShell.responses.liveTurnRunningSummary', {
      elapsed: `${elapsedSeconds}s`,
    });
  }

  private readOptionalString(candidate: unknown): string | undefined {
    return typeof candidate === 'string' && candidate.trim().length > 0
      ? candidate.trim()
      : undefined;
  }

  private captureCompletedTurnDetails(turnId: string | undefined): void {
    if (!turnId) {
      return;
    }

    const detailLines =
      this.activityHistoryLines.length > 0
        ? [...this.activityHistoryLines]
        : [...this.liveActivityEntries.values()]
            .sort((left, right) => left.order - right.order)
            .map((entry) => entry.text.trim())
            .filter((line) => line.length > 0);
    if (detailLines.length === 0) {
      return;
    }

    this.completedTurnDetails.set(turnId, detailLines);
  }

  private recordActivityHistory(text: string): void {
    const normalizedText = text.trim();
    if (!normalizedText) {
      return;
    }

    const latestRecordedText = this.activityHistoryLines.at(-1);
    if (latestRecordedText === normalizedText) {
      return;
    }

    this.activityHistoryLines.push(normalizedText);
    if (this.activityHistoryLines.length > LIVE_ACTIVITY_MAX_ENTRIES * 8) {
      this.activityHistoryLines.splice(
        0,
        this.activityHistoryLines.length - LIVE_ACTIVITY_MAX_ENTRIES * 8,
      );
    }
  }
}
