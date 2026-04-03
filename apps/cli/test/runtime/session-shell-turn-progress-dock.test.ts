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
          return `${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnRoleActivity') {
          return `${interpolation?.role ?? ''}: ${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnRoleReply') {
          return `${interpolation?.role ?? ''} reply: ${interpolation?.detail ?? ''}`;
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
      'codex stdout: warn one',
      'codex stderr: progress two',
    ]);
  });

  it('captures live activity details for the completed turn before clearing the dock', () => {
    const dock = new CliSessionShellTurnProgressDock({
      translate: (key, interpolation) => {
        if (key === 'cli.sessionShell.responses.liveTurnRunningSummary') {
          return `Running · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnCurrentDetail') {
          return `${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnRoleReply') {
          return `${interpolation?.role ?? ''} reply: ${interpolation?.detail ?? ''}`;
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
      expect.stringMatching(/^\[\d{2}:\d{2}:\d{2}\] codex review started$/u),
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
          return `${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnRoleReply') {
          return `${interpolation?.role ?? ''} reply: ${interpolation?.detail ?? ''}`;
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
    expect(liveActivityItem?.lines[0]).toBe('log line 1');
    expect(liveActivityItem?.lines[9]).toBe('log line 10');
  });

  it('marks system-origin role activity separately from AI-authored role detail lines', () => {
    const dock = new CliSessionShellTurnProgressDock({
      translate: (key, interpolation) => {
        if (key === 'cli.sessionShell.responses.liveTurnRunningSummary') {
          return `Running · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnCurrentDetail') {
          return `${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnRoleActivity') {
          return `${interpolation?.role ?? ''}: ${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnRoleReply') {
          return `${interpolation?.role ?? ''} reply: ${interpolation?.detail ?? ''}`;
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

  it('surfaces the latest agent reply draft in live activity and completed execution details', () => {
    const dock = new CliSessionShellTurnProgressDock({
      translate: (key, interpolation) => {
        if (key === 'cli.sessionShell.responses.liveTurnRunningSummary') {
          return `Running · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnCurrentDetail') {
          return `${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnRoleReply') {
          return `${interpolation?.role ?? ''} reply: ${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnActivityTitle') {
          return 'Live activity';
        }
        if (key === 'cli.sessionShell.transcript.assistantLabel') {
          return 'Governor';
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
          role: OrchestrationSessionTranscriptRole.ASSISTANT,
          turnId: 'turn-1',
          roleId: 'reviewer',
          streamKind: 'token',
          chunkText: 'Review',
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
          role: OrchestrationSessionTranscriptRole.ASSISTANT,
          turnId: 'turn-1',
          roleId: 'reviewer',
          streamKind: 'token',
          accumulatedText: 'Review findings complete',
        },
      },
    ]);

    const liveActivityItem = dock
      .projectTranscriptItems('session-1', [])
      .find((item) => item.renderKind === 'live_activity');

    expect(liveActivityItem?.summaryLine).toBe('Running · 0s');

    dock.applySessionEvents([
      {
        eventId: 'event-3',
        sequence: 3,
        streamCursor: 'cursor-3',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_FAILED,
        createdAt: '2026-04-01T07:00:02Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.ASSISTANT,
          turnId: 'turn-1',
        },
      },
    ]);

    expect(dock.projectTranscriptItems('session-1', [])).toEqual([]);
    expect(dock.consumeCompletedTurnDetails('turn-1')).toEqual([
      expect.stringMatching(/^\[\d{2}:\d{2}:\d{2}\] reviewer reply: Review findings complete$/u),
    ]);
  });

  it('projects invoke-liveness suspect and interrupt states into completed execution details', () => {
    const dock = new CliSessionShellTurnProgressDock({
      translate: (key, interpolation) => {
        if (key === 'cli.sessionShell.responses.liveTurnRunningSummary') {
          return `Running · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnWaitingTransportSummary') {
          return `Waiting for transport · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnWaitingProgressSummary') {
          return `Waiting for semantic progress · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnGracefulInterruptSummary') {
          return `Graceful interrupt · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnHardTerminateSummary') {
          return `Hard terminate · ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnCurrentDetail') {
          return `${interpolation?.detail ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnWaitingTransportDetail') {
          return `Still waiting for transport activity on ${interpolation?.surface ?? ''}.`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnWaitingProgressDetail') {
          return `Still waiting for semantic progress on ${interpolation?.surface ?? ''}.`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnGracefulInterruptDetail') {
          return `Graceful interrupt is in progress on ${interpolation?.surface ?? ''}.`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnHardTerminateDetail') {
          return `Hard termination is in progress on ${interpolation?.surface ?? ''}.`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnLivenessReasons') {
          return `Reasons: ${interpolation?.reasons ?? ''}.`;
        }
        if (key === 'cli.sessionShell.responses.liveTurnPartialOutputPreserved') {
          return 'Partial output is preserved.';
        }
        if (key === 'cli.sessionShell.responses.liveTurnReasonTransportIdleTimeout') {
          return 'transport stayed idle too long';
        }
        if (key === 'cli.sessionShell.responses.liveTurnReasonSemanticStallTimeout') {
          return 'semantic progress stalled too long';
        }
        if (key === 'cli.sessionShell.responses.liveTurnReasonPartialOutputPreserved') {
          return 'partial output preserved';
        }
        if (key === 'cli.sessionShell.responses.liveTurnReasonGracefulInterruptExceeded') {
          return 'graceful interrupt exceeded budget';
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
        createdAt: '2026-04-03T12:00:00Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          turnId: 'turn-1',
          streamKind: 'lifecycle',
          detail: 'Codex has not produced CLI stdout recently.',
          selectedSurface: 'codex',
          invokeLiveness: {
            status: 'transport_idle_suspect',
            surfaceId: 'codex',
            suspectReasonCodes: ['invoke_transport_idle_timeout'],
            partialOutputPreserved: false,
          },
        },
      },
      {
        eventId: 'event-2',
        sequence: 2,
        streamCursor: 'cursor-2',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
        createdAt: '2026-04-03T12:00:01Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          turnId: 'turn-1',
          streamKind: 'lifecycle',
          detail: 'Graceful interrupt requested before timeout.',
          selectedSurface: 'codex',
          invokeLiveness: {
            status: 'graceful_interrupting',
            surfaceId: 'codex',
            suspectReasonCodes: ['invoke_partial_output_preserved'],
            partialOutputPreserved: true,
          },
        },
      },
      {
        eventId: 'event-3',
        sequence: 3,
        streamCursor: 'cursor-3',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
        createdAt: '2026-04-03T12:00:02Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          turnId: 'turn-1',
          streamKind: 'lifecycle',
          detail: 'Codex is still alive but has not made semantic progress.',
          selectedSurface: 'codex',
          invokeLiveness: {
            status: 'semantic_stall_suspect',
            surfaceId: 'codex',
            suspectReasonCodes: ['invoke_semantic_stall_timeout'],
            partialOutputPreserved: false,
          },
        },
      },
      {
        eventId: 'event-4',
        sequence: 4,
        streamCursor: 'cursor-4',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
        createdAt: '2026-04-03T12:00:03Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          turnId: 'turn-1',
          streamKind: 'lifecycle',
          detail: 'Codex ignored the graceful interrupt window.',
          selectedSurface: 'codex',
          invokeLiveness: {
            status: 'hard_terminating',
            surfaceId: 'codex',
            suspectReasonCodes: ['invoke_graceful_interrupt_exceeded'],
            partialOutputPreserved: true,
          },
        },
      },
    ]);

    const liveActivityItem = dock
      .projectTranscriptItems('session-1', [])
      .find((item) => item.renderKind === 'live_activity');

    expect(liveActivityItem?.summaryLine).toBe('Hard terminate · 0s');

    dock.applySessionEvents([
      {
        eventId: 'event-5',
        sequence: 5,
        streamCursor: 'cursor-5',
        sessionId: 'session-1',
        type: OrchestrationSessionEventType.TURN_COMPLETED,
        createdAt: '2026-04-03T12:00:04Z',
        payload: {
          role: OrchestrationSessionTranscriptRole.ASSISTANT,
          turnId: 'turn-1',
        },
      },
    ]);

    expect(dock.consumeCompletedTurnDetails('turn-1')).toEqual([
      expect.stringContaining(
        'Still waiting for transport activity on codex. Codex has not produced CLI stdout recently. Reasons: transport stayed idle too long.',
      ),
      expect.stringContaining(
        'Graceful interrupt is in progress on codex. Graceful interrupt requested before timeout. Reasons: partial output preserved. Partial output is preserved.',
      ),
      expect.stringContaining(
        'Still waiting for semantic progress on codex. Codex is still alive but has not made semantic progress. Reasons: semantic progress stalled too long.',
      ),
      expect.stringContaining(
        'Hard termination is in progress on codex. Codex ignored the graceful interrupt window. Reasons: graceful interrupt exceeded budget. Partial output is preserved.',
      ),
    ]);
  });
});
