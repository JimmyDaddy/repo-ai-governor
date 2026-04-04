import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
} from '@repo-ai-governor/orchestration-service-client';
import { DesktopArtifactQueryGateState } from '../src/constants/index.js';
import { DesktopPreloadBridge } from '../src/runtime/desktop-preload-bridge.js';

function createLifecycleSnapshot() {
  return {
    serviceLifecycleStatus: 'ready',
    restartCount: 0,
    windowWakeCount: 0,
    notificationCount: 0,
    artifactQueryGateState: DesktopArtifactQueryGateState.READY,
  };
}

function createHealthResponse() {
  return {
    serviceHostKind: 'sidecar',
    serviceTransportKind: 'ipc',
    lifecycleStatus: 'ready',
    checkpointCapable: true,
    workspaceRoot: '/tmp/workspace/.repo-ai-governor',
    startedAt: '2026-04-05T00:00:00.000Z',
    protocolVersion: '1',
  };
}

function createExecutionSummary(executionId: string, executionSessionId: string) {
  return {
    executionId,
    executionSessionId,
    processId: `process-${executionId}`,
    workspaceId: 'workspace-desktop',
    workspaceRoot: '/tmp/workspace/.repo-ai-governor',
    executionKind: OrchestrationExecutionKind.RUN,
    clientSurface: OrchestrationClientSurface.DESKTOP,
    eventStreamToken: `token-${executionId}`,
    serviceHostKind: 'sidecar',
    serviceTransportKind: 'ipc',
    status: OrchestrationExecutionStatus.RUNNING,
    checkpointCapable: true,
    recoveryCapable: true,
    acceptedAt: '2026-04-05T00:00:00.000Z',
    updatedAt: '2026-04-05T00:01:00.000Z',
    pendingHitl: false,
  };
}

function createSessionSummary(sessionId: string) {
  return {
    sessionId,
    status: 'open',
    openedAt: '2026-04-05T00:00:00.000Z',
    latestEventSequence: 0,
    nextCursor: '0',
    eventCount: 0,
    context: {},
  };
}

describe('DesktopPreloadBridge', () => {
  it('prefers the latest standalone session over the execution session when building the governance console snapshot', async () => {
    const artifactPaneRequests: Array<Record<string, unknown>> = [];
    const bridge = new DesktopPreloadBridge(
      {
        getHealth: async () => createHealthResponse(),
        listExecutions: async () => ({
          executions: [createExecutionSummary('execution-2', 'execution-session-2')],
          returnedCount: 1,
          totalMatchedCount: 1,
        }),
        queryArtifactPane: async (request) => {
          artifactPaneRequests.push({ ...(request ?? {}) });
          return {
            artifacts: [],
            reviews: [],
            transcript: [],
          };
        },
      } as never,
      {
        listSessions: async () => ({
          sessions: [createSessionSummary('standalone-session-9')],
          returnedCount: 1,
          totalMatchedCount: 1,
        }),
      } as never,
      {
        getSnapshot: () => createLifecycleSnapshot(),
      } as never,
      {
        build: (payload) => payload,
      } as never,
      async () => ({
        baseline: {} as never,
        health: createHealthResponse(),
        lifecycle: createLifecycleSnapshot(),
      }),
      async () => createLifecycleSnapshot(),
    );

    await bridge.buildGovernanceConsoleSnapshot({
      locale: 'en-US',
      workspaceLabel: 'desktop-workspace',
    });

    expect(artifactPaneRequests).toEqual([
      {
        executionId: 'execution-2',
        sessionId: 'standalone-session-9',
      },
    ]);
  });

  it('falls back to the latest standalone session when no execution summary is available', async () => {
    const artifactPaneRequests: Array<Record<string, unknown>> = [];
    const bridge = new DesktopPreloadBridge(
      {
        getHealth: async () => createHealthResponse(),
        listExecutions: async () => ({
          executions: [],
          returnedCount: 0,
          totalMatchedCount: 0,
        }),
        queryArtifactPane: async (request) => {
          artifactPaneRequests.push({ ...(request ?? {}) });
          return {
            artifacts: [],
            reviews: [],
            transcript: [],
          };
        },
      } as never,
      {
        listSessions: async () => ({
          sessions: [createSessionSummary('standalone-session-9')],
          returnedCount: 1,
          totalMatchedCount: 1,
        }),
      } as never,
      {
        getSnapshot: () => createLifecycleSnapshot(),
      } as never,
      {
        build: (payload) => payload,
      } as never,
      async () => ({
        baseline: {} as never,
        health: createHealthResponse(),
        lifecycle: createLifecycleSnapshot(),
      }),
      async () => createLifecycleSnapshot(),
    );

    await bridge.buildGovernanceConsoleSnapshot({
      locale: 'en-US',
      workspaceLabel: 'desktop-workspace',
    });

    expect(artifactPaneRequests).toEqual([
      {
        executionId: undefined,
        sessionId: 'standalone-session-9',
      },
    ]);
  });

  it('falls back to the latest execution session when no standalone session is available', async () => {
    const artifactPaneRequests: Array<Record<string, unknown>> = [];
    const bridge = new DesktopPreloadBridge(
      {
        getHealth: async () => createHealthResponse(),
        listExecutions: async () => ({
          executions: [createExecutionSummary('execution-2', 'execution-session-2')],
          returnedCount: 1,
          totalMatchedCount: 1,
        }),
        queryArtifactPane: async (request) => {
          artifactPaneRequests.push({ ...(request ?? {}) });
          return {
            artifacts: [],
            reviews: [],
            transcript: [],
          };
        },
      } as never,
      {
        listSessions: async () => ({
          sessions: [],
          returnedCount: 0,
          totalMatchedCount: 0,
        }),
      } as never,
      {
        getSnapshot: () => createLifecycleSnapshot(),
      } as never,
      {
        build: (payload) => payload,
      } as never,
      async () => ({
        baseline: {} as never,
        health: createHealthResponse(),
        lifecycle: createLifecycleSnapshot(),
      }),
      async () => createLifecycleSnapshot(),
    );

    await bridge.buildGovernanceConsoleSnapshot({
      locale: 'en-US',
      workspaceLabel: 'desktop-workspace',
    });

    expect(artifactPaneRequests).toEqual([
      {
        executionId: 'execution-2',
        sessionId: 'execution-session-2',
      },
    ]);
  });
});
