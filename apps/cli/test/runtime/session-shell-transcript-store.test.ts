import {
  OrchestrationSessionEventType,
  OrchestrationSessionTranscriptRole,
} from '@repo-ai-governor/orchestration-service-client';
import { describe, expect, it } from 'vitest';
import { CliSessionShellTranscriptStore } from '../../src/runtime/interactive-shell/session-shell-transcript-store.js';

describe('CliSessionShellTranscriptStore', () => {
  it('renders command handoff preview payloads from completed session.main turns', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-001',
      [
        {
          eventId: 'event-1',
          sequence: 1,
          streamCursor: 'cursor-1',
          sessionId: 'session-001',
          type: OrchestrationSessionEventType.TURN_COMPLETED,
          createdAt: '2026-03-31T12:00:00Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: 'session.main',
            turnIndex: 1,
            responseMode: 'command_handoff_preview',
            suggestedSlashCommand: '/connect',
            executionIntent: 'connect.adapters.bootstrap',
            handoffCommandPreview: 'repo-ai-governor connect --output pretty',
            selectedSurface: 'claude-code',
            selectedBy: 'session.main.preference',
            handoffBacklinks: [
              {
                kind: 'slash_command',
                label: 'slash:/connect',
                target: '/connect',
              },
              {
                kind: 'execution_intent',
                label: 'intent:connect.adapters.bootstrap',
                target: 'connect.adapters.bootstrap',
              },
            ],
          },
        },
      ],
      (key, interpolation) => {
        if (key === 'cli.sessionShell.transcript.assistantLabel') {
          return 'Governor';
        }
        if (key === 'cli.sessionShell.responses.mainTurnSuggestedSlash') {
          return `Suggested next step: ${interpolation?.command ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnHandoffPreview') {
          return `Preview: ${interpolation?.preview ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnExecutionIntent') {
          return `Intent: ${interpolation?.executionIntent ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnRoutingSelection') {
          return `Routing: surface=${interpolation?.selectedSurface ?? ''} selected_by=${interpolation?.selectedBy ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnBacklink') {
          return `Backlink: kind=${interpolation?.kind ?? ''} label=${interpolation?.label ?? ''} target=${interpolation?.target ?? ''}`;
        }
        return key;
      },
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.lines).toEqual([
      'Suggested next step: /connect',
      'Preview: repo-ai-governor connect --output pretty',
      'Intent: connect.adapters.bootstrap',
      'Routing: surface=claude-code selected_by=session.main.preference',
      'Backlink: kind=slash_command label=slash:/connect target=/connect',
      'Backlink: kind=execution_intent label=intent:connect.adapters.bootstrap target=connect.adapters.bootstrap',
    ]);
  });

  it('renders failed and cancelled main-agent turn events as system transcript items', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-002',
      [
        {
          eventId: 'event-1',
          sequence: 1,
          streamCursor: 'cursor-1',
          sessionId: 'session-002',
          type: OrchestrationSessionEventType.TURN_FAILED,
          createdAt: '2026-03-31T12:05:00Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.SYSTEM,
            errorMessage: 'dispatcher failure',
          },
        },
        {
          eventId: 'event-2',
          sequence: 2,
          streamCursor: 'cursor-2',
          sessionId: 'session-002',
          type: OrchestrationSessionEventType.TURN_CANCELLED,
          createdAt: '2026-03-31T12:05:01Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.SYSTEM,
          },
        },
      ],
      (key, interpolation) => {
        if (key === 'cli.sessionShell.transcript.systemLabel') {
          return 'System';
        }
        if (key === 'cli.sessionShell.responses.turnFailed') {
          return `The main session turn failed. reason=${interpolation?.reason ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.turnCancelled') {
          return 'The main session turn was cancelled before completion.';
        }
        if (key === 'cli.sessionShell.responses.turnRecoverableHint') {
          return 'You can keep chatting, retry the turn, or switch to /resume.';
        }
        return key;
      },
    );

    expect(items).toHaveLength(2);
    expect(items[0]?.lines).toEqual([
      'The main session turn failed. reason=dispatcher failure',
      'You can keep chatting, retry the turn, or switch to /resume.',
    ]);
    expect(items[1]?.lines).toEqual([
      'The main session turn was cancelled before completion.',
      'You can keep chatting, retry the turn, or switch to /resume.',
    ]);
  });

  it('keeps an echo recap for plain completed session.main answers', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-003',
      [
        {
          eventId: 'event-1',
          sequence: 1,
          streamCursor: 'cursor-1',
          sessionId: 'session-003',
          type: OrchestrationSessionEventType.TURN_COMPLETED,
          createdAt: '2026-03-31T12:10:00Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: 'session.main',
            turnIndex: 1,
            responseMode: 'answer',
            latestUserMessage: 'governor line one\ngovernor line two',
            executionIntent: 'session.answer',
            selectedSurface: 'codex',
            selectedBy: 'session.main.default',
          },
        },
      ],
      (key, interpolation) => {
        if (key === 'cli.sessionShell.transcript.assistantLabel') {
          return 'Governor';
        }
        if (key === 'cli.sessionShell.responses.mainTurnAccepted') {
          return `route=${interpolation?.routeId ?? ''} turn=${interpolation?.turnIndex ?? ''} accepted`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnEcho') {
          return `echo=${interpolation?.userMessage ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnExecutionIntent') {
          return `Intent: ${interpolation?.executionIntent ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnRoutingSelection') {
          return `Routing: surface=${interpolation?.selectedSurface ?? ''} selected_by=${interpolation?.selectedBy ?? ''}`;
        }
        return key;
      },
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.lines).toEqual([
      'route=session.main turn=1 accepted',
      'echo=governor line one\ngovernor line two',
      'Intent: session.answer',
      'Routing: surface=codex selected_by=session.main.default',
    ]);
  });
});
