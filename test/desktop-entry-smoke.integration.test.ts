import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import {
  MemoryProviderHostSurface,
  MemoryProviderRuntimeMode,
} from '@repo-ai-governor/memory-provider-registry';
import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceTransportKind,
  OrchestrationSessionTranscriptRole,
} from '@repo-ai-governor/orchestration-service-client';
import { MemoryStoreEngine } from '@repo-ai-governor/shared';
import { DesktopArtifactQueryGateState } from '../apps/desktop/src/constants/index.js';
import { DesktopShellBootstrap } from '../apps/desktop/src/runtime/desktop-shell-bootstrap.js';

describe('desktop entry smoke integration', () => {
  it.each([
    {
      distributionMode: 'default',
      memoryConfig: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory/desktop-default',
      },
      expectedMemoryProvider: {
        memoryStoreProviderId: 'fs-csv',
        memoryStoreDistributionMode: 'default',
        memoryStoreResolutionSource: 'legacy_store_engine',
      },
    },
    {
      distributionMode: 'plugin-enabled',
      memoryConfig: {
        storeEngine: MemoryStoreEngine.SQLITE_FS,
        storeRoot: 'context/memory/desktop-plugin',
        provider: {
          module: '@repo-ai-governor/memory-provider-sqlite-fs',
          exportName: 'createMemoryStoreProvider',
        },
      },
      expectedMemoryProvider: {
        memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
        memoryStoreProviderModule: '@repo-ai-governor/memory-provider-sqlite-fs',
        memoryStoreDistributionMode: 'optional',
        memoryStoreResolutionSource: 'plugin_module',
      },
    },
  ])(
    'runs desktop shell bootstrap over the sidecar IPC runtime for $distributionMode distribution',
    async ({ memoryConfig, expectedMemoryProvider }) => {
      const tempRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-desktop-entry-'));
      const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');

      try {
        const bootstrap = new DesktopShellBootstrap(workspaceRoot, {
          runtimeDependencies: {
            memoryConfig,
          },
        });
        const preloadBridge = bootstrap.getPreloadBridge();
        const bootstrapSnapshot = await preloadBridge.bootstrap();
        const health = await preloadBridge.getHealth();
        const started = await preloadBridge.startExecution(
          {
            workspaceId: 'desktop-workspace',
            workspaceRoot,
            executionKind: OrchestrationExecutionKind.RUN,
            clientSurface: OrchestrationClientSurface.DESKTOP,
          },
          {
            processId: 'desktop-process',
            executionId: 'desktop-execution',
            executionSessionId: 'desktop-session',
          },
        );

        await preloadBridge.publishEvent({
          executionId: started.executionId,
          type: OrchestrationServiceEventType.ARTIFACT_READY,
          status: OrchestrationExecutionStatus.RUNNING,
          artifactId: 'artifact-desktop',
          artifactPath: resolve(workspaceRoot, 'artifact-desktop.json'),
          message: 'desktop artifact ready',
        });
        await preloadBridge.publishEvent({
          executionId: started.executionId,
          type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
          status: OrchestrationExecutionStatus.COMPLETED,
          message: 'desktop execution completed',
        });

        const session = await preloadBridge.startSession();
        await preloadBridge.appendMessage(
          session.session.sessionId,
          OrchestrationSessionTranscriptRole.ASSISTANT,
          ['desktop baseline active'],
        );
        const resumed = await preloadBridge.resumeSession(session.session.sessionId);
        const listedSessions = await preloadBridge.listSessions({
          limit: 1,
        });
        const subscribedSession = await preloadBridge.subscribeSession({
          sessionId: session.session.sessionId,
        });
        const listedExecutions = await preloadBridge.listExecutions({
          filter: {
            workspaceId: 'desktop-workspace',
          },
        });
        const fetchedExecution = await preloadBridge.getExecution(started.executionId);
        const executionBoard = await preloadBridge.queryExecutionBoard({
          filter: {
            workspaceId: 'desktop-workspace',
          },
        });
        const hitlInbox = await preloadBridge.queryHitlInbox({
          filter: {
            workspaceId: 'desktop-workspace',
          },
        });
        const subscribedExecution = await preloadBridge.subscribeExecution({
          executionId: started.executionId,
        });
        const wakeSnapshot = await preloadBridge.requestWindowWake('main-window');
        const notificationSnapshot = await preloadBridge.registerNotification('review-ready');
        const restartSnapshot = await preloadBridge.restartServiceHost('desktop-smoke-restart');
        const artifactPane = await preloadBridge.queryArtifactPane({
          executionId: started.executionId,
          sessionId: session.session.sessionId,
        });
        const consoleSnapshot = await preloadBridge.buildGovernanceConsoleSnapshot({
          locale: 'en-US',
          workspaceLabel: 'desktop-workspace',
          agentView: createAgentView() as never,
        });

        expect(bootstrapSnapshot.baseline.packageName).toBe('@repo-ai-governor/desktop');
        expect(bootstrapSnapshot.baseline.artifactQueryGateState).toBe(
          DesktopArtifactQueryGateState.READY,
        );
        expect(bootstrapSnapshot.baseline.sessionBridgeOperations).toContain(
          'buildGovernanceConsoleSnapshot',
        );
        expect(bootstrapSnapshot.baseline.sessionBridgeOperations).toContain('queryArtifactPane');
        expect(bootstrapSnapshot.baseline.sessionBridgeOperations).toContain('queryQueueOverview');
        expect(bootstrapSnapshot.health.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
        expect(health.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
        expect(health.memoryProvider).toEqual(
          expect.objectContaining({
            ...expectedMemoryProvider,
            memoryStoreHostSurface: MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
            memoryStoreRuntimeMode: MemoryProviderRuntimeMode.DAEMON,
          }),
        );
        expect(started.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
        expect(started.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
        expect(started.memoryProvider).toEqual(health.memoryProvider);
        expect(fetchedExecution?.executionId).toBe(started.executionId);
        expect(listedExecutions.executions).toHaveLength(1);
        expect(listedExecutions.executions[0]?.memoryProvider).toEqual(health.memoryProvider);
        expect(executionBoard.executions[0]?.execution.executionId).toBe(started.executionId);
        expect(hitlInbox.pendingDecisions).toEqual([]);
        expect(subscribedExecution.events.map((event) => event.type)).toEqual([
          OrchestrationServiceEventType.EXECUTION_STARTED,
          OrchestrationServiceEventType.ARTIFACT_READY,
          OrchestrationServiceEventType.EXECUTION_COMPLETED,
        ]);
        expect(resumed.session.sessionId).toBe(session.session.sessionId);
        expect(listedSessions.sessions[0]?.sessionId).toBe(session.session.sessionId);
        expect(subscribedSession.session.sessionId).toBe(session.session.sessionId);
        expect(wakeSnapshot.windowWakeCount).toBe(1);
        expect(notificationSnapshot.notificationCount).toBe(1);
        expect(restartSnapshot.restartCount).toBe(1);
        expect(artifactPane.resolvedExecutionId).toBe(started.executionId);
        expect(artifactPane.resolvedSessionId).toBe(session.session.sessionId);
        expect(artifactPane.transcript[0]?.lines).toContain('desktop baseline active');
        expect(consoleSnapshot.workspaceHome.title).toBe('Workspace home');
        expect(consoleSnapshot.executionBoard.entries[0]?.title).toBe(
          'desktop-execution -> completed',
        );
        expect(consoleSnapshot.hitlInbox.entries).toEqual([]);
        expect(consoleSnapshot.queueOverview.title).toBe('Queue & workspace overview');
        expect(consoleSnapshot.queueOverview.notificationOwnership.title).toBe(
          'Notification ownership',
        );
        expect(consoleSnapshot.artifactPane.gateState).toBe(DesktopArtifactQueryGateState.READY);
        expect(consoleSnapshot.artifactPane.transcript.entries[0]?.detailLines).toContain(
          'desktop baseline active',
        );
        expect(consoleSnapshot.agentProjectionPanel?.rows[0]?.title).toBe(
          'coder -> github-copilot',
        );

        await bootstrap.dispose();
      } finally {
        await rm(tempRoot, { recursive: true, force: true });
      }
    },
  );
});

function createAgentView() {
  return {
    descriptors: [
      {
        agentId: 'coder:coder:coder',
        agentRole: 'coder',
        roleProfileId: 'coder-default',
        roleSource: 'default',
        primarySurface: 'codex',
        fallbackSurfaces: ['github-copilot'],
        capabilities: ['tool_calling'],
        permissionLevel: 'edit',
        inputSchemaRef: null,
        outputSchemaRef: null,
        errorContractRef: null,
        maxExecutionTimeSeconds: 300,
        stageTimeoutSeconds: 300,
        tokenBudget: null,
        costBudget: null,
        timeBudgetSeconds: null,
        retryPolicyRef: null,
        timeoutPolicyRef: null,
        budgetPolicyRef: null,
        workspaceId: 'desktop-workspace',
        workspaceMode: 'repo_local',
        executionId: 'desktop-execution',
        sessionId: null,
        selectedBy: 'fallback',
        selectedSurface: 'github-copilot',
        projectionStatus: 'warn',
        failureReasons: ['primary_surface_unavailable'],
        unsupportedCapabilities: [],
        degradedCapabilities: ['tool_calling'],
      },
    ],
    sessionProjection: null,
  };
}
