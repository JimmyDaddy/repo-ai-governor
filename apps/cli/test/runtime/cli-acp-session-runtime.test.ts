import {
  AgentCancellationReason,
  AgentCancellationScope,
  AgentStreamEventType,
} from '@repo-ai-governor/adapter-sdk';
import { AdapterSurface } from '@repo-ai-governor/shared';
import { CliAcpSessionRuntime } from '../../src/runtime/cli-acp-session-runtime.js';

describe('CliAcpSessionRuntime', () => {
  it('reuses one mutable shared invocation state for invokeStage and streamEvents on the same ACP turn', () => {
    const runtime = new CliAcpSessionRuntime();
    const invokeState = runtime.ensureInvocationState(AdapterSurface.CODEX, {
      processId: 'process-001',
      executionId: 'execution-001',
      stageId: 'stage-001',
      routeKey: 'route-001',
      input: {},
    });
    const streamState = runtime.ensureInvocationState(AdapterSurface.CODEX, {
      processId: 'process-001',
      executionId: 'execution-001',
      stageId: 'stage-001',
      routeKey: 'route-001',
      input: {},
    });

    streamState.acpSessionId = 'acp-session-001';
    streamState.permissionRequestIds.push('permission-001');

    expect(streamState).toBe(invokeState);
    expect(streamState.invocationKey).toBe(invokeState.invocationKey);
    expect(streamState.createdAt).toBe(invokeState.createdAt);
    expect(streamState.processId).toBe('process-001');
    expect(streamState.executionId).toBe('execution-001');
    expect(streamState.stageId).toBe('stage-001');
    expect(streamState.routeKey).toBe('route-001');
    expect(invokeState.acpSessionId).toBe('acp-session-001');
    expect(invokeState.permissionRequestIds).toEqual(['permission-001']);
    expect(streamState.terminalIds).toEqual([]);
  });

  it('preserves the same mutable shared invocation state when stream attaches before a later invoke lookup', () => {
    const runtime = new CliAcpSessionRuntime();
    const streamState = runtime.ensureInvocationState(AdapterSurface.CODEX, {
      processId: 'process-002',
      executionId: 'execution-002',
      stageId: 'stage-002',
      routeKey: 'route-002',
      input: {},
    });
    const invokeState = runtime.ensureInvocationState(AdapterSurface.CODEX, {
      processId: 'process-002',
      executionId: 'execution-002',
      stageId: 'stage-002',
      routeKey: 'route-002',
      input: {},
    });

    invokeState.terminalIds.push('terminal-001');
    invokeState.bufferedStreamEvents.push({
      eventType: AgentStreamEventType.TOKEN,
      timestamp: '2026-04-20T00:00:00.000Z',
      processId: 'process-002',
      executionId: 'execution-002',
      stageId: 'stage-002',
      routeKey: 'route-002',
      payload: {
        delta: 'hello',
      },
    });

    expect(invokeState).toBe(streamState);
    expect(streamState.terminalIds).toEqual(['terminal-001']);
    expect(streamState.bufferedStreamEvents).toHaveLength(1);
    expect(streamState.bufferedStreamEvents[0]?.eventType).toBe(AgentStreamEventType.TOKEN);
    expect(streamState.bufferedStreamEvents[0]?.payload.delta).toBe('hello');
  });

  it('returns the same shared invocation state for one exact confirmation lookup on the ACP turn', () => {
    const runtime = new CliAcpSessionRuntime();
    const invocationState = runtime.ensureInvocationState(AdapterSurface.CODEX, {
      processId: 'process-002-confirmation',
      executionId: 'execution-002-confirmation',
      stageId: 'stage-002-confirmation',
      routeKey: 'route-002-confirmation',
      input: {},
    });

    expect(
      runtime.findInvocationStateForConfirmation(AdapterSurface.CODEX, {
        processId: 'process-002-confirmation',
        executionId: 'execution-002-confirmation',
        stageId: 'stage-002-confirmation',
        routeKey: 'route-002-confirmation',
        prompt: 'Confirm the shared ACP tool call.',
      }),
    ).toBe(invocationState);
  });

  it('returns undefined for process/execution-local cancel lookup when multiple live invocations match', () => {
    const runtime = new CliAcpSessionRuntime();
    runtime.ensureInvocationState(AdapterSurface.CODEX, {
      processId: 'process-003',
      executionId: 'execution-003',
      stageId: 'stage-003-a',
      routeKey: 'route-003-a',
      input: {},
    });
    runtime.ensureInvocationState(AdapterSurface.CODEX, {
      processId: 'process-003',
      executionId: 'execution-003',
      stageId: 'stage-003-b',
      routeKey: 'route-003-b',
      input: {},
    });

    expect(
      runtime.findInvocationState(AdapterSurface.CODEX, {
        processId: 'process-003',
        executionId: 'execution-003',
        scope: AgentCancellationScope.AGENT,
        reason: AgentCancellationReason.USER_REQUESTED,
      }),
    ).toBeUndefined();
  });
});
