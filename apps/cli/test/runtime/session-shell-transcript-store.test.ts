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

  it('renders direct-execute handoffs as auto-running command recap items', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-001',
      [
        {
          eventId: 'event-2',
          sequence: 2,
          streamCursor: 'cursor-2',
          sessionId: 'session-001',
          type: OrchestrationSessionEventType.TURN_COMPLETED,
          createdAt: '2026-03-31T12:00:01Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: 'session.main',
            turnIndex: 2,
            responseMode: 'command_handoff_preview',
            suggestedSlashCommand: '/doctor',
            executionIntent: 'doctor.adapters',
            handoffExecutionMode: 'direct_execute',
            handoffCommandPreview: 'repo-ai-governor doctor --adapters --output pretty',
            selectedSurface: 'codex',
            selectedBy: 'session.main.intent_router',
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
        if (key === 'cli.sessionShell.responses.mainTurnAutoExecuteSlash') {
          return `Auto-running: ${interpolation?.command ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnHandoffPreview') {
          return `Preview: ${interpolation?.preview ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnAutoExecuteCommand') {
          return `Running: ${interpolation?.preview ?? ''}`;
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
      'Auto-running: /doctor',
      'Running: repo-ai-governor doctor --adapters --output pretty',
      'Intent: doctor.adapters',
      'Routing: surface=codex selected_by=session.main.intent_router',
    ]);
  });

  it('attaches execution details blocks to command recap session messages when metadata includes them', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-001',
      [
        {
          eventId: 'event-3',
          sequence: 3,
          streamCursor: 'cursor-3',
          sessionId: 'session-001',
          type: OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED,
          createdAt: '2026-03-31T12:00:02Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            lines: [
              'Command handoff completed for run.',
              'Failure: stage=stage-review reason=timeout',
            ],
            metadata: {
              renderKind: 'command_recap',
              executionDetailsLines: [
                'Running run…',
                'Execute runtime graph · stage=stage-review',
                'stage=stage-review reason=timeout',
              ],
            },
          },
        },
      ],
      (key, interpolation) => {
        if (key === 'cli.sessionShell.transcript.assistantLabel') {
          return 'Governor';
        }
        if (key === 'cli.sessionShell.responses.executionDetailsTitle') {
          return 'Execution details';
        }
        if (key === 'cli.sessionShell.responses.executionDetailsCollapsed') {
          return `▶ Collapsed · ${interpolation?.count ?? '0'} entries · Ctrl+O to open`;
        }
        return key;
      },
    );

    expect(items[0]?.renderKind).toBe('command_recap');
    expect(items[0]?.details).toEqual({
      title: 'Execution details',
      summaryLine: '▶ Collapsed · 3 entries · Ctrl+O to open',
      lines: [
        'Running run…',
        'Execute runtime graph · stage=stage-review',
        'stage=stage-review reason=timeout',
      ],
      expanded: false,
    });
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
            turnId: 'turn-failed',
            errorMessage: 'dispatcher failure',
            errorDetail: 'codex stderr: authentication required',
            executionDetailsLines: ['performance.dispatch_ms=47'],
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
            turnId: 'turn-cancelled',
            executionDetailsLines: ['performance.dispatch_ms=12'],
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
        if (key === 'cli.sessionShell.responses.executionDetailsTitle') {
          return 'Execution details';
        }
        if (key === 'cli.sessionShell.responses.executionDetailsCollapsed') {
          return `Collapsed count=${interpolation?.count ?? ''}`;
        }
        return key;
      },
      (turnId) => {
        if (turnId === 'turn-failed') {
          return ['stage=probe reason=unavailable'];
        }
        if (turnId === 'turn-cancelled') {
          return ['stage=dispatch reason=cancelled'];
        }
        return [];
      },
    );

    expect(items).toHaveLength(2);
    expect(items[0]?.renderKind).toBe('system_notice');
    expect(items[1]?.renderKind).toBe('system_notice');
    expect(items[0]?.lines).toEqual([
      'The main session turn failed. reason=dispatcher failure',
      'codex stderr: authentication required',
      'You can keep chatting, retry the turn, or switch to /resume.',
    ]);
    expect(items[1]?.lines).toEqual([
      'The main session turn was cancelled before completion.',
      'You can keep chatting, retry the turn, or switch to /resume.',
    ]);
    expect(items[0]?.details).toEqual({
      title: 'Execution details',
      summaryLine: 'Collapsed count=2',
      lines: ['performance.dispatch_ms=47', 'stage=probe reason=unavailable'],
      expanded: false,
    });
    expect(items[1]?.details).toEqual({
      title: 'Execution details',
      summaryLine: 'Collapsed count=2',
      lines: ['performance.dispatch_ms=12', 'stage=dispatch reason=cancelled'],
      expanded: false,
    });
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

  it('preserves capability explanation metadata and suggested action affordances on markdown answers', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-004-capability-answer',
      [
        {
          eventId: 'event-1',
          sequence: 1,
          streamCursor: 'cursor-1',
          sessionId: 'session-004-capability-answer',
          type: OrchestrationSessionEventType.TURN_COMPLETED,
          createdAt: '2026-04-03T22:00:00Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: 'session.main',
            turnIndex: 1,
            responseMode: 'answer',
            capabilityAnswerKind: 'detail',
            referencedCapabilityIds: ['review'],
            suggestedActions: [
              {
                label: 'Review',
                target: '/review',
                suggestedSlashCommand: '/review',
              },
              {
                label: 'Review Verify',
                target: '/review verify',
                suggestedSlashCommand: '/review verify',
              },
            ],
            assistantMessage:
              '## Review\n\nUse this capability when you want a governed code review.',
          },
        },
      ],
      (key) => {
        if (key === 'cli.sessionShell.transcript.assistantLabel') {
          return 'Governor';
        }
        if (key === 'cli.sessionShell.responses.mainTurnSuggestedActionsTitle') {
          return 'Suggested next steps';
        }
        return key;
      },
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.renderKind).toBe('markdown');
    expect(items[0]?.capabilityAnswerKind).toBe('detail');
    expect(items[0]?.referencedCapabilityIds).toEqual(['review']);
    expect(items[0]?.suggestedActionsBlock).toEqual({
      title: 'Suggested next steps',
      actions: [
        {
          label: 'Review',
          target: '/review',
          suggestedSlashCommand: '/review',
        },
        {
          label: 'Review Verify',
          target: '/review verify',
          suggestedSlashCommand: '/review verify',
        },
      ],
    });
  });

  it('keeps explanation markdown attached to bridged command recap items', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-004-capability-bridge',
      [
        {
          eventId: 'event-1',
          sequence: 1,
          streamCursor: 'cursor-1',
          sessionId: 'session-004-capability-bridge',
          type: OrchestrationSessionEventType.TURN_COMPLETED,
          createdAt: '2026-04-03T23:00:00Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: 'session.main',
            turnIndex: 1,
            responseMode: 'command_handoff_preview',
            assistantMessage:
              '## Verify\n\nThis capability is ready now, and I already prepared the governed execution handoff.',
            suggestedSlashCommand: '/verify',
            executionIntent: 'verify.adapters',
            handoffExecutionMode: 'direct_execute',
            requiresConfirmation: false,
            handoffCommandPreview: 'repo-ai-governor verify --adapters --output pretty',
          },
        },
      ],
      (key, interpolation) => {
        if (key === 'cli.sessionShell.transcript.assistantLabel') {
          return 'Governor';
        }
        if (key === 'cli.sessionShell.responses.mainTurnAutoExecuteSlash') {
          return `Auto-running: ${interpolation?.command ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnAutoExecuteCommand') {
          return `Running: ${interpolation?.preview ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnExecutionIntent') {
          return `Intent: ${interpolation?.executionIntent ?? ''}`;
        }
        return key;
      },
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.renderKind).toBe('command_recap');
    expect(items[0]?.markdownSource).toContain('## Verify');
    expect(items[0]?.lines).toEqual([
      'Auto-running: /verify',
      'Running: repo-ai-governor verify --adapters --output pretty',
      'Intent: verify.adapters',
    ]);
  });

  it('attaches completed-turn execution details carried directly on the payload', () => {
    const store = new CliSessionShellTranscriptStore();
    const items = store.applyEvents(
      'session-004-guarded-answer',
      [
        {
          eventId: 'event-1',
          sequence: 1,
          streamCursor: 'cursor-1',
          sessionId: 'session-004-guarded-answer',
          type: OrchestrationSessionEventType.TURN_COMPLETED,
          createdAt: '2026-04-01T12:15:30Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: 'session.main',
            turnId: 'turn-guarded-1',
            turnIndex: 1,
            responseMode: 'answer',
            assistantMessage: [
              '## Session Main Answer',
              '',
              'No eligible direct-answer surface is currently available for this turn.',
            ].join('\n'),
            executionDetailsLines: [
              'Surface probe diagnostics for this turn:',
              'codex · not eligible · Codex probe exited with code 1.',
              'claude-code · not eligible · Claude Code probe failed with exit code 1.',
            ],
          },
        },
      ],
      (key, interpolation) => {
        if (key === 'cli.sessionShell.transcript.assistantLabel') {
          return 'Governor';
        }
        if (key === 'cli.sessionShell.responses.executionDetailsTitle') {
          return 'Execution details';
        }
        if (key === 'cli.sessionShell.responses.executionDetailsCollapsed') {
          return `▶ Collapsed · ${interpolation?.count ?? '0'} entries · Ctrl+O to open`;
        }
        return key;
      },
    );

    expect(items[0]?.renderKind).toBe('markdown');
    expect(items[0]?.details).toEqual({
      title: 'Execution details',
      summaryLine: '▶ Collapsed · 3 entries · Ctrl+O to open',
      lines: [
        'Surface probe diagnostics for this turn:',
        'codex · not eligible · Codex probe exited with code 1.',
        'claude-code · not eligible · Claude Code probe failed with exit code 1.',
      ],
      expanded: false,
    });
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
          return `Active role: ${interpolation?.roles ?? ''} (count=${interpolation?.count ?? ''})`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnCollaborationSynthesis') {
          return `Synthesis: ${interpolation?.synthesisMode ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnCollaborationModeParallel') {
          return 'Parallel role fan-out';
        }
        if (key === 'cli.sessionShell.responses.mainTurnExecutionSurface') {
          return `Execution surface: ${interpolation?.selectedSurface ?? ''}`;
        }
        if (key === 'cli.sessionShell.responses.mainTurnExecutionSurfaceFallback') {
          return 'Execution surface selection: switched to a fallback automatically.';
        }
        return key;
      },
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.renderKind).toBe('collaboration_recap');
    expect(items[0]?.markdownSource).toContain('Architect + Reviewer + Verifier Parallel Analysis');
    expect(items[0]?.lines).toEqual([
      'Parallel role fan-out completed.',
      'Active role: architect · reviewer · verifier (count=3)',
      'Synthesis: parallel_analysis',
      'Execution surface: architect:ollama | reviewer:ollama | verifier:ollama',
      'Execution surface selection: switched to a fallback automatically.',
    ]);
  });

  it('attaches collapsed execution details to the final turn item and can toggle them open', () => {
    const store = new CliSessionShellTranscriptStore();
    const translate = (key: string, interpolation?: Record<string, string>) => {
      if (key === 'cli.sessionShell.transcript.assistantLabel') {
        return 'Governor';
      }
      if (key === 'cli.sessionShell.responses.mainTurnCollaborationAccepted') {
        return `${interpolation?.mode ?? ''} completed.`;
      }
      if (key === 'cli.sessionShell.responses.mainTurnCollaborationRoles') {
        return `Active role: ${interpolation?.roles ?? ''} (count=${interpolation?.count ?? ''})`;
      }
      if (key === 'cli.sessionShell.responses.mainTurnCollaborationModeSingleRole') {
        return 'Single-role delegate';
      }
      if (key === 'cli.sessionShell.responses.executionDetailsTitle') {
        return 'Execution details';
      }
      if (key === 'cli.sessionShell.responses.executionDetailsCollapsed') {
        return `▶ Collapsed · ${interpolation?.count ?? '0'} entries · Ctrl+O to open`;
      }
      if (key === 'cli.sessionShell.responses.executionDetailsExpanded') {
        return `▼ Expanded · ${interpolation?.count ?? '0'} entries · Ctrl+O to hide`;
      }
      return key;
    };

    const items = store.applyEvents(
      'session-005-details',
      [
        {
          eventId: 'event-1',
          sequence: 1,
          streamCursor: 'cursor-1',
          sessionId: 'session-005-details',
          type: OrchestrationSessionEventType.TURN_COMPLETED,
          createdAt: '2026-04-01T08:16:00Z',
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: 'session.main',
            turnId: 'turn-1',
            turnIndex: 1,
            responseMode: 'role_collaboration',
            interactionMode: 'single_role_delegate',
            assistantMessage: 'Review result body',
            invokedRoleIds: ['reviewer'],
            subagentCount: 1,
          },
        },
      ],
      translate,
      () => [
        'reviewer: Running command: git diff --stat',
        'reviewer: Completed todo: inspect patch',
      ],
    );

    expect(items[0]?.details?.title).toBe('Execution details');
    expect(items[0]?.details?.summaryLine).toBe('▶ Collapsed · 2 entries · Ctrl+O to open');
    expect(items[0]?.details?.expanded).toBe(false);
    expect(items[0]?.details?.lines).toEqual([
      'reviewer: Running command: git diff --stat',
      'reviewer: Completed todo: inspect patch',
    ]);

    expect(store.toggleLatestExecutionDetails(translate)).toBe(true);
    expect(store.listItems()[0]?.details?.title).toBe('Execution details');
    expect(store.listItems()[0]?.details?.summaryLine).toBe(
      '▼ Expanded · 2 entries · Ctrl+O to hide',
    );
    expect(store.listItems()[0]?.details?.expanded).toBe(true);
    expect(store.listItems()[0]?.details?.lines).toEqual([
      'reviewer: Running command: git diff --stat',
      'reviewer: Completed todo: inspect patch',
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
