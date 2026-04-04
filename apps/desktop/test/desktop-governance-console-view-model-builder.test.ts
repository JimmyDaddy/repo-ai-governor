import { AgentProjectionPanelStatusVariant } from '@repo-ai-governor/reporting';
import { DesktopArtifactQueryGateState } from '../src/constants/index.js';
import { DesktopGovernanceConsoleViewModelBuilder } from '../src/runtime/desktop-governance-console-view-model-builder.js';

describe('DesktopGovernanceConsoleViewModelBuilder', () => {
  it('builds workspace, session, timeline, hitl, and shared agent projection sections', () => {
    const builder = new DesktopGovernanceConsoleViewModelBuilder();
    const viewModel = builder.build({
      locale: 'en-US',
      workspaceLabel: 'desktop-workspace',
      health: {
        serviceHostKind: 'sidecar',
        serviceTransportKind: 'ipc',
        lifecycleStatus: 'ready',
        checkpointCapable: true,
        workspaceRoot: '/tmp/workspace/.repo-ai-governor',
        startedAt: '2026-04-04T00:00:00.000Z',
        protocolVersion: '1.0',
        memoryProvider: {
          memoryStoreEngine: 'fs_csv',
          memoryStoreProvider: 'FsCsvMemoryStoreProvider',
          memoryStoreProviderId: 'fs-csv',
          memoryStoreDistributionMode: 'default',
          memoryStoreResolutionSource: 'legacy_store_engine',
          memoryStoreHostSurface: 'local_orchestration_service',
          memoryStoreRuntimeMode: 'daemon',
        },
      },
      sessions: [
        {
          sessionId: 'session-1',
          status: 'open',
          openedAt: '2026-04-04T00:00:00.000Z',
          latestEventSequence: 4,
          nextCursor: '4',
          eventCount: 4,
          currentRouteId: 'main',
          context: {},
        },
      ],
      executions: [
        {
          executionId: 'execution-1',
          executionSessionId: 'execution-session-1',
          processId: 'desktop-process',
          workspaceId: 'desktop-workspace',
          workspaceRoot: '/tmp/workspace/.repo-ai-governor',
          executionKind: 'run',
          clientSurface: 'desktop',
          eventStreamToken: 'token-1',
          serviceHostKind: 'sidecar',
          serviceTransportKind: 'ipc',
          status: 'running',
          checkpointCapable: true,
          recoveryCapable: true,
          acceptedAt: '2026-04-04T00:00:00.000Z',
          updatedAt: '2026-04-04T00:01:00.000Z',
          pendingHitl: true,
          latestEventSequence: 3,
          nextCursor: '3',
          latestEventType: 'execution_running',
          currentStageId: 'review',
        },
      ],
      lifecycle: {
        serviceLifecycleStatus: 'ready',
        restartCount: 1,
        lastRestartReason: 'desktop-restart',
        windowWakeCount: 1,
        notificationCount: 1,
        artifactQueryGateState: DesktopArtifactQueryGateState.BLOCKED,
      },
      agentView: createAgentView(),
    } as never);

    expect(viewModel.workspaceHome.statusVariant).toBe(AgentProjectionPanelStatusVariant.WARNING);
    expect(viewModel.workspaceHome.detailLines).toContain('workspace=desktop-workspace');
    expect(viewModel.sessionLane.detailLines).toContain('session=session-1');
    expect(viewModel.executionTimeline[0]?.title).toBe('execution-1 -> running');
    expect(viewModel.hitlCenter.statusVariant).toBe(AgentProjectionPanelStatusVariant.WARNING);
    expect(viewModel.agentProjectionPanel?.rows[0]?.title).toBe('coder -> github-copilot');
    expect(viewModel.artifactPaneNote).toContain(
      'service-owned artifact query contract is not ready',
    );
  });
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
        executionId: 'execution-1',
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
  } as never;
}
