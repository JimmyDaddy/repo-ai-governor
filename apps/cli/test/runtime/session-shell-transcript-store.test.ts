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
        return key;
      },
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.renderKind).toBe('command_recap');
    expect(items[0]?.backlinks).toEqual([
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
    ]);
    expect(items[0]?.lines).toEqual([
      'Suggested next step: /connect',
      'Preview: repo-ai-governor connect --output pretty',
      'Intent: connect.adapters.bootstrap',
      'Routing: surface=claude-code selected_by=session.main.preference',
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
    expect(items[0]?.renderKind).toBe('system_notice');
    expect(items[1]?.renderKind).toBe('system_notice');
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
    expect(items[0]?.renderKind).toBe('command_recap');
    expect(items[0]?.lines).toEqual([
      'route=session.main turn=1 accepted',
      'echo=governor line one\ngovernor line two',
      'Intent: session.answer',
      'Routing: surface=codex selected_by=session.main.default',
    ]);
  });

  it('marks assistant completed answers as markdown transcript items', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-004',
      [
        {
          eventId: 'event-1',
          sequence: 1,
          streamCursor: 'cursor-1',
          sessionId: 'session-004',
          type: OrchestrationSessionEventType.TURN_COMPLETED,
          createdAt: '2026-03-31T12:15:00Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: 'session.main',
            turnIndex: 1,
            responseMode: 'answer',
            assistantMessage: '# Plan\n- inspect repo\n- summarize risks',
          },
        },
      ],
      (key) => (key === 'cli.sessionShell.transcript.assistantLabel' ? 'Governor' : key),
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.renderKind).toBe('markdown');
    expect(items[0]?.markdownSource).toBe('# Plan\n- inspect repo\n- summarize risks');
    expect(items[0]?.lines).toEqual(['# Plan\n- inspect repo\n- summarize risks']);
  });

  it('maps role-collaboration turns into structured collaboration recap items', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-004-role-collaboration',
      [
        {
          eventId: 'event-1',
          sequence: 1,
          streamCursor: 'cursor-1',
          sessionId: 'session-004-role-collaboration',
          type: OrchestrationSessionEventType.TURN_COMPLETED,
          createdAt: '2026-03-31T12:16:00Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: 'session.main',
            turnIndex: 1,
            responseMode: 'role_collaboration',
            interactionMode: 'parallel_role_fanout',
            assistantMessage:
              '## Architect + Reviewer + Verifier Parallel Analysis\n\n### Architect\n\n- architecture risk\n\n### Reviewer\n\n- review risk\n\n### Verifier\n\n- verification risk',
            synthesisMode: 'parallel_analysis',
            executionIntent: 'session.role_delegate.parallel.architect.reviewer.verifier',
            selectedSurface: 'architect:ollama | reviewer:ollama | verifier:ollama',
            selectedBy:
              'architect:session.main.role_delegate.safe_fallback | reviewer:session.main.role_delegate.safe_fallback | verifier:session.main.role_delegate.safe_fallback',
            invokedRoleIds: ['architect', 'reviewer', 'verifier'],
            subagentCount: 3,
          },
        },
      ],
      (key, interpolation) => {
        if (key === 'cli.sessionShell.transcript.assistantLabel') {
          return 'Governor';
        }
        if (key === 'cli.sessionShell.responses.mainTurnCollaborationAccepted') {
          return `${interpolation?.mode ?? ''} completed.`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnCollaborationRoles') {
          return `Roles: ${interpolation?.roles ?? ''} (count=${interpolation?.count ?? ''})`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnCollaborationSynthesis') {
          return `Synthesis: ${interpolation?.synthesisMode ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnCollaborationModeParallel') {
          return 'Parallel role fan-out';
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
    expect(items[0]?.renderKind).toBe('collaboration_recap');
    expect(items[0]?.markdownSource).toContain('Architect + Reviewer + Verifier Parallel Analysis');
    expect(items[0]?.lines).toEqual([
      'Parallel role fan-out completed.',
      'Roles: architect · reviewer · verifier (count=3)',
      'Synthesis: parallel_analysis',
      'Intent: session.role_delegate.parallel.architect.reviewer.verifier',
      'Routing: surface=architect:ollama | reviewer:ollama | verifier:ollama selected_by=architect:session.main.role_delegate.safe_fallback | reviewer:session.main.role_delegate.safe_fallback | verifier:session.main.role_delegate.safe_fallback',
    ]);
  });

  it('uses metadata renderKind for appended assistant recap messages', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-005',
      [
        {
          eventId: 'event-1',
          sequence: 1,
          streamCursor: 'cursor-1',
          sessionId: 'session-005',
          type: OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED,
          createdAt: '2026-03-31T12:20:00Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: 'main',
            lines: [
              'doctor 的 command handoff 已完成。',
              '摘要：Doctor completed with attach_mode=read_write.',
              '关键状态：attach_mode=read_write · adapter_probe=false',
            ],
            metadata: {
              renderKind: 'command_recap',
            },
          },
        },
      ],
      (key) => (key === 'cli.sessionShell.transcript.assistantLabel' ? 'Governor' : key),
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.renderKind).toBe('command_recap');
    expect(items[0]?.lines).toEqual([
      'doctor 的 command handoff 已完成。',
      '摘要：Doctor completed with attach_mode=read_write.',
      '关键状态：attach_mode=read_write · adapter_probe=false',
    ]);
  });
});
