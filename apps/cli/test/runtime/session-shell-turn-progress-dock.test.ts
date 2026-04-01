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
});
