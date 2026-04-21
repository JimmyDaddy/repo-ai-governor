import { EventEmitter } from 'node:events';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  OrchestrationSessionRouteId,
  OrchestrationWorkspaceOperationKind,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode } from '@repo-ai-governor/shared';
import { LocalOrchestrationServiceSidecarClient } from '../src/local-orchestration-service-sidecar-client.js';

class FakeChildProcess extends EventEmitter {
  public readonly stderr = {
    setEncoding: vi.fn(),
    on: vi.fn(),
  };
  public killed = false;

  public readonly send = vi.fn(
    (_message: unknown, callback?: (error: Error | null | undefined) => void) => {
      callback?.(undefined);
      return true;
    },
  );

  public readonly kill = vi.fn(() => {
    this.killed = true;
    return true;
  });
}

describe('LocalOrchestrationServiceSidecarClient timeout policy', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the workspace-operation timeout budget instead of the generic 10s request timeout', async () => {
    vi.useFakeTimers();

    const childProcess = new FakeChildProcess();
    const client = new LocalOrchestrationServiceSidecarClient('/repo/.repo-ai-governor', {
      sidecarEntryPath: '/tmp/local-orchestration-sidecar-entry.js',
      requestTimeoutMs: 10,
      workspaceOperationRequestTimeoutMs: 50,
      childProcessFactory: () => childProcess as never,
    });

    const readinessPromise = client.queryBootstrapReadiness();
    const readinessRejection = expect(readinessPromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_FLOW_TIMEOUT,
    });
    await vi.advanceTimersByTimeAsync(11);
    await readinessRejection;

    let workspaceOperationSettled = false;
    const workspaceOperationPromise = client
      .runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.DOCTOR,
      })
      .finally(() => {
        workspaceOperationSettled = true;
      });
    const workspaceOperationRejection = expect(workspaceOperationPromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_FLOW_TIMEOUT,
    });

    await vi.advanceTimersByTimeAsync(11);
    await Promise.resolve();
    expect(workspaceOperationSettled).toBe(false);

    await vi.advanceTimersByTimeAsync(40);
    await workspaceOperationRejection;
  });

  it('uses the session-turn timeout budget instead of the generic 10s request timeout', async () => {
    vi.useFakeTimers();

    const childProcess = new FakeChildProcess();
    const client = new LocalOrchestrationServiceSidecarClient('/repo/.repo-ai-governor', {
      sidecarEntryPath: '/tmp/local-orchestration-sidecar-entry.js',
      requestTimeoutMs: 10,
      sessionTurnRequestTimeoutMs: 50,
      childProcessFactory: () => childProcess as never,
    });

    let sessionTurnSettled = false;
    const sessionTurnPromise = client
      .sendSessionTurn({
        sessionId: 'session-main',
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'hello',
      })
      .finally(() => {
        sessionTurnSettled = true;
      });
    const sessionTurnRejection = expect(sessionTurnPromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_FLOW_TIMEOUT,
    });

    await vi.advanceTimersByTimeAsync(11);
    await Promise.resolve();
    expect(sessionTurnSettled).toBe(false);

    await vi.advanceTimersByTimeAsync(40);
    await sessionTurnRejection;
  });
});
