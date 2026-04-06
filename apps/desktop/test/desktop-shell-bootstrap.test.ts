import {
  DesktopArtifactQueryGateState,
  DesktopOrchestrationRuntimeMode,
} from '../src/constants/index.js';
import { DesktopShellBootstrap } from '../src/runtime/desktop-shell-bootstrap.js';

describe('DesktopShellBootstrap', () => {
  it('freezes shell baseline ownership and supports restart-aware preload lifecycle snapshots', async () => {
    let disposeCount = 0;
    const bootstrap = new DesktopShellBootstrap('/tmp/workspace/.repo-ai-governor', {
      artifactQueryGateState: DesktopArtifactQueryGateState.BLOCKED,
      runtimeDependencies: {
        runtimeMode: DesktopOrchestrationRuntimeMode.SIDECAR_IPC,
        serviceOwnerProvider: async () =>
          ({
            getHealth: async () => ({
              serviceHostKind: 'sidecar',
              serviceTransportKind: 'ipc',
              lifecycleStatus: 'ready',
              checkpointCapable: true,
              workspaceRoot: '/tmp/workspace/.repo-ai-governor',
              startedAt: '2026-04-04T00:00:00.000Z',
              protocolVersion: '1.0',
            }),
            startExecution: async () => ({
              executionId: 'execution-1',
              executionSessionId: 'execution-session-1',
              acceptedAt: '2026-04-04T00:00:00.000Z',
              status: 'running',
              checkpointCapable: true,
              serviceHostKind: 'sidecar',
              serviceTransportKind: 'ipc',
              eventStreamToken: 'token',
              latestEventSequence: 0,
              nextCursor: '0',
            }),
            getExecution: async () => undefined,
            listExecutions: async () => ({
              executions: [],
              returnedCount: 0,
              totalMatchedCount: 0,
            }),
            queryArtifactPane: async () => ({
              artifacts: [],
              reviews: [],
              transcript: [],
              reviewLifecycle: {
                totalReviewCount: 0,
                pendingReviewCount: 0,
                verifiedReviewCount: 0,
                resolvedReviewCount: 0,
                navigationReviewIds: [],
              },
              workbench: {
                artifactCount: 0,
                reviewCount: 0,
                transcriptCount: 0,
              },
              evidenceBacklinks: {
                governanceWorkspacePath: '/tmp/workspace/.repo-ai-governor',
                artifactPaths: [],
                reviewPaths: [],
                transcriptEntryIds: [],
              },
            }),
            subscribeExecution: async () => ({
              executionId: 'execution-1',
              eventStreamToken: 'token',
              serviceHostKind: 'sidecar',
              serviceTransportKind: 'ipc',
              latestEventSequence: 0,
              nextCursor: '0',
              events: [],
            }),
            submitHitlDecision: async () => ({
              accepted: true,
              nextStatus: 'running',
              latestEventSequence: 0,
              nextCursor: '0',
              executionSummary: {
                executionId: 'execution-1',
                executionSessionId: 'execution-session-1',
                processId: 'desktop-process',
                workspaceId: 'workspace',
                workspaceRoot: '/tmp/workspace/.repo-ai-governor',
                executionKind: 'run',
                clientSurface: 'desktop',
                eventStreamToken: 'token',
                serviceHostKind: 'sidecar',
                serviceTransportKind: 'ipc',
                status: 'running',
                checkpointCapable: true,
                recoveryCapable: true,
                acceptedAt: '2026-04-04T00:00:00.000Z',
                updatedAt: '2026-04-04T00:00:00.000Z',
                pendingHitl: false,
              },
            }),
            recoverExecution: async () => ({
              recovered: false,
              recoveryCapable: true,
              nextStatus: 'running',
              latestEventSequence: 0,
              nextCursor: '0',
              executionSummary: {
                executionId: 'execution-1',
                executionSessionId: 'execution-session-1',
                processId: 'desktop-process',
                workspaceId: 'workspace',
                workspaceRoot: '/tmp/workspace/.repo-ai-governor',
                executionKind: 'run',
                clientSurface: 'desktop',
                eventStreamToken: 'token',
                serviceHostKind: 'sidecar',
                serviceTransportKind: 'ipc',
                status: 'running',
                checkpointCapable: true,
                recoveryCapable: true,
                acceptedAt: '2026-04-04T00:00:00.000Z',
                updatedAt: '2026-04-04T00:00:00.000Z',
                pendingHitl: false,
              },
            }),
            startSession: async () => ({
              created: true,
              session: {
                sessionId: 'session-1',
                status: 'open',
                openedAt: '2026-04-04T00:00:00.000Z',
                latestEventSequence: 0,
                nextCursor: '0',
                eventCount: 0,
                context: {},
              },
              latestEventSequence: 0,
              nextCursor: '0',
            }),
            sendSessionTurn: async () => ({
              session: {
                sessionId: 'session-1',
                status: 'open',
                openedAt: '2026-04-04T00:00:00.000Z',
                latestEventSequence: 0,
                nextCursor: '0',
                eventCount: 0,
                context: {},
              },
              turnId: 'turn-1',
              routeId: 'main',
              acceptedAt: '2026-04-04T00:00:00.000Z',
              latestEventSequence: 0,
              nextCursor: '0',
            }),
            appendSessionMessage: async () => ({
              session: {
                sessionId: 'session-1',
                status: 'open',
                openedAt: '2026-04-04T00:00:00.000Z',
                latestEventSequence: 0,
                nextCursor: '0',
                eventCount: 0,
                context: {},
              },
              latestEventSequence: 0,
              nextCursor: '0',
              event: {
                eventId: 'event-1',
                sequence: 0,
                streamCursor: '0',
                sessionId: 'session-1',
                type: 'message_appended',
                createdAt: '2026-04-04T00:00:00.000Z',
                payload: {},
              },
            }),
            getSession: async () => undefined,
            listSessions: async () => ({ sessions: [], returnedCount: 0, totalMatchedCount: 0 }),
            subscribeSession: async () => ({
              session: {
                sessionId: 'session-1',
                status: 'open',
                openedAt: '2026-04-04T00:00:00.000Z',
                latestEventSequence: 0,
                nextCursor: '0',
                eventCount: 0,
                context: {},
              },
              latestEventSequence: 0,
              nextCursor: '0',
              events: [],
            }),
            resumeSession: async () => ({
              session: {
                sessionId: 'session-1',
                status: 'open',
                openedAt: '2026-04-04T00:00:00.000Z',
                latestEventSequence: 0,
                nextCursor: '0',
                eventCount: 0,
                context: {},
              },
              resumeSelector: 'latest',
              latestEventSequence: 0,
              nextCursor: '0',
            }),
            publishEvent: async () => undefined,
            saveCheckpoint: async () => undefined,
            dispose: async () => {
              disposeCount += 1;
            },
          }) as never,
      },
    });

    const baseline = bootstrap.describeBaseline();
    const snapshot = await bootstrap.bootstrap();
    const preloadBridge = bootstrap.getPreloadBridge();
    const wakeSnapshot = await preloadBridge.requestWindowWake('main-window');
    const notificationSnapshot = await preloadBridge.registerNotification('review-ready');
    const restartSnapshot = await preloadBridge.restartServiceHost('desktop-smoke-restart');

    expect(baseline.packageName).toBe('@repo-ai-governor/desktop');
    expect(baseline.runtimeMode).toBe(DesktopOrchestrationRuntimeMode.SIDECAR_IPC);
    expect(baseline.artifactQueryGateState).toBe(DesktopArtifactQueryGateState.BLOCKED);
    expect(baseline.artifactPaneDeferredReason).toContain('service-owned artifact query contract');
    expect(baseline.sessionBridgeOperations).toContain('buildGovernanceConsoleSnapshot');
    expect(baseline.sessionBridgeOperations).toContain('queryArtifactPane');
    expect(baseline.sessionBridgeOperations).toContain('queryExecutionBoard');
    expect(baseline.sessionBridgeOperations).toContain('queryQueueOverview');
    expect(baseline.sessionBridgeOperations).toContain('terminateExecution');
    expect(snapshot.health.serviceHostKind).toBe('sidecar');
    expect(wakeSnapshot.windowWakeCount).toBe(1);
    expect(notificationSnapshot.notificationCount).toBe(1);
    expect(restartSnapshot.restartCount).toBe(1);
    expect(restartSnapshot.lastRestartReason).toBe('desktop-smoke-restart');
    expect(disposeCount).toBe(1);
  });
});
