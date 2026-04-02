import {
  OrchestrationSessionEventType,
  OrchestrationSessionTranscriptRole,
} from '@repo-ai-governor/orchestration-service-client';
import { CliSessionShellTurnProgressDock } from '../../src/runtime/interactive-shell/session-shell-turn-progress-dock.js';

describe('session-shell-turn-progress-dock', () => {
  it('keeps multiple lifecycle details when activityKey is provided', () => {
    const dock = new CliSessionShellTurnProgressDock({
      translate: (key, interpolation) => {
        if (key === 'cli.sessionShell.responses.liveTurnRunningSummary') {
          return `Running · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnCurrentDetail') {
          return `Current: ${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnRoleActivity') {
          return `${interpolation?.role ?? ''}: ${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnToolCall') {
          return `Tool: ${interpolation?.toolName ?? ''} - ${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnActivityTitle') {
          return 'Live activity';
        }
        return key;
      },
    });

    dock.seedRunningState();
    dock.applySessionEvents([
      {
        eventId: 'event-1',
        sequence: 1,
        streamCursor: 'cursor-1',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
        createdAt: '2026-04-01T07:00:00Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          turnId: 'turn-1',
          streamKind: 'lifecycle',
          detail: 'codex stdout: warn one',
          activityKey: 'codex:stdout:0',
        },
      },
      {
        eventId: 'event-2',
        sequence: 2,
        streamCursor: 'cursor-2',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
        createdAt: '2026-04-01T07:00:01Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          turnId: 'turn-1',
          streamKind: 'lifecycle',
          detail: 'codex stderr: progress two',
          activityKey: 'codex:stderr:1',
        },
      },
    ]);

    const items = dock.projectTranscriptItems('session-1', []);
    const liveActivityItem = items.find((item) => item.renderKind === 'live_activity');

    expect(liveActivityItem?.lines).toEqual([
      'Current: codex stdout: warn one',
      'Current: codex stderr: progress two',
    ]);
  });

  it('captures live activity details for the completed turn before clearing the dock', () => {
    const dock = new CliSessionShellTurnProgressDock({
      translate: (key, interpolation) => {
        if (key === 'cli.sessionShell.responses.liveTurnRunningSummary') {
          return `Running · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnCurrentDetail') {
          return `Current: ${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnActivityTitle') {
          return 'Live activity';
        }
        return key;
      },
    });

    dock.seedRunningState();
    dock.applySessionEvents([
      {
        eventId: 'event-1',
        sequence: 1,
        streamCursor: 'cursor-1',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
        createdAt: '2026-04-01T07:00:00Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          turnId: 'turn-1',
          streamKind: 'lifecycle',
          detail: 'codex review started',
          activityKey: 'codex:status:1',
        },
      },
      {
        eventId: 'event-2',
        sequence: 2,
        streamCursor: 'cursor-2',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_COMPLETED,
        createdAt: '2026-04-01T07:00:01Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.ASSISTANT,
          turnId: 'turn-1',
        },
      },
    ]);

    expect(dock.projectTranscriptItems('session-1', [])).toEqual([]);
    expect(dock.consumeCompletedTurnDetails('turn-1')).toEqual([
      expect.stringMatching(/^\[\d{2}:\d{2}:\d{2}\] Current: codex review started$/u),
    ]);
    expect(dock.consumeCompletedTurnDetails('turn-1')).toEqual([]);
  });

  it('keeps the full live activity history visible when more than eight details stream in', () => {
    const dock = new CliSessionShellTurnProgressDock({
      translate: (key, interpolation) => {
        if (key === 'cli.sessionShell.responses.liveTurnRunningSummary') {
          return `Running · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnCurrentDetail') {
          return `Current: ${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnActivityTitle') {
          return 'Live activity';
        }
        return key;
      },
    });

    dock.seedRunningState();
    dock.applySessionEvents(
      Array.from({ length: 10 }, (_, index) => ({
        eventId: `event-${String(index + 1)}`,
        sequence: index + 1,
        streamCursor: `cursor-${String(index + 1)}`,
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
        createdAt: `2026-04-01T07:00:${String(index).padStart(2, '0')}Z`,
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          turnId: 'turn-1',
          streamKind: 'lifecycle',
          detail: `log line ${String(index + 1)}`,
          activityKey: `codex:stdout:${String(index + 1)}`,
        },
      })),
    );

    const items = dock.projectTranscriptItems('session-1', []);
    const liveActivityItem = items.find((item) => item.renderKind === 'live_activity');

    expect(liveActivityItem?.lines).toHaveLength(10);
    expect(liveActivityItem?.lines[0]).toBe('Current: log line 1');
    expect(liveActivityItem?.lines[9]).toBe('Current: log line 10');
  });

  it('marks system-origin role activity separately from AI-authored role detail lines', () => {
    const dock = new CliSessionShellTurnProgressDock({
      translate: (key, interpolation) => {
        if (key === 'cli.sessionShell.responses.liveTurnRunningSummary') {
          return `Running · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnCurrentDetail') {
          return `Current: ${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnRoleActivity') {
          return `${interpolation?.role ?? ''}: ${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnActivityTitle') {
          return 'Live activity';
        }
        return key;
      },
    });

    dock.seedRunningState();
    dock.applySessionEvents([
      {
        eventId: 'event-1',
        sequence: 1,
        streamCursor: 'cursor-1',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
        createdAt: '2026-04-01T07:00:00Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          turnId: 'turn-1',
          streamKind: 'lifecycle',
          roleId: 'reviewer',
          detailOrigin: 'system',
          detail: 'Codex repository review is still running (15s elapsed); waiting for CLI output.',
          activityKey: 'reviewer:system:progress',
        },
      },
      {
        eventId: 'event-2',
        sequence: 2,
        streamCursor: 'cursor-2',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
        createdAt: '2026-04-01T07:00:01Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          turnId: 'turn-1',
          streamKind: 'lifecycle',
          roleId: 'reviewer',
          detail: 'Inspecting changed files before drafting findings',
          activityKey: 'reviewer:reasoning:1',
        },
      },
    ]);

    const items = dock.projectTranscriptItems('session-1', []);
    const liveActivityItem = items.find((item) => item.renderKind === 'live_activity');

    expect(liveActivityItem?.lines).toEqual([
      'reviewer system: Codex repository review is still running (15s elapsed); waiting for CLI output.',
      'reviewer: Inspecting changed files before drafting findings',
    ]);
  });
});
