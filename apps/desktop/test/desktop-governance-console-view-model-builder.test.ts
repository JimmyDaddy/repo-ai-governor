import { AgentProjectionPanelStatusVariant } from '@repo-ai-governor/reporting';
import { DesktopArtifactQueryGateState } from '../src/constants/index.js';
import { DesktopGovernanceConsoleViewModelBuilder } from '../src/runtime/desktop-governance-console-view-model-builder.js';

describe('DesktopGovernanceConsoleViewModelBuilder', () => {
  it('builds workspace, session, timeline, hitl, artifact pane, and shared agent projection sections', () => {
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
        artifactQueryGateState: DesktopArtifactQueryGateState.READY,
      },
      artifactPane: {
        artifacts: [
          {
            artifactId: 'artifact-1',
            artifactType: 'review_report',
            artifactPath: '/tmp/workspace/review/report.md',
            artifactVersion: 'v1',
            artifactStatus: 'active',
            producerTaskId: 'TK-551',
            producerExecutionId: 'execution-1',
            registeredAt: '2026-04-04T00:00:00.000Z',
            lastUpdatedAt: '2026-04-04T00:01:00.000Z',
          },
        ],
        reviews: [
          {
            reviewId: 'code_review_tk-551.md',
            title: 'Desktop artifact pane readiness',
            lifecycleStatus: 'review_pending',
            filePath: '/tmp/workspace/review/code_review_tk-551.md',
            updatedAt: '2026-04-04T00:02:00.000Z',
          },
        ],
        transcript: [
          {
            entryId: 'session-event-1',
            sessionId: 'session-1',
            eventType: 'turn_submitted',
            role: 'user',
            routeId: 'main',
            lines: ['Please open the latest review report.'],
            createdAt: '2026-04-04T00:03:00.000Z',
          },
        ],
        resolvedExecutionId: 'execution-1',
        resolvedSessionId: 'session-1',
        reviewSourcePath: '/tmp/workspace/review',
      },
      agentView: createAgentView(),
    } as never);

    expect(viewModel.workspaceHome.statusVariant).toBe(AgentProjectionPanelStatusVariant.WARNING);
    expect(viewModel.workspaceHome.detailLines).toContain('workspace=desktop-workspace');
    expect(viewModel.sessionLane.detailLines).toContain('session=session-1');
    expect(viewModel.executionTimeline[0]?.title).toBe('execution-1 -> running');
    expect(viewModel.hitlCenter.statusVariant).toBe(AgentProjectionPanelStatusVariant.WARNING);
    expect(viewModel.agentProjectionPanel?.rows[0]?.title).toBe('coder -> github-copilot');
    expect(viewModel.artifactPane.statusVariant).toBe(AgentProjectionPanelStatusVariant.WARNING);
    expect(viewModel.artifactPane.artifacts.entries[0]?.title).toBe('review_report -> active');
    expect(viewModel.artifactPane.reviews.entries[0]?.title).toBe(
      'review_pending -> Desktop artifact pane readiness',
    );
    expect(viewModel.artifactPane.transcript.entries[0]?.detailLines).toContain(
      'Please open the latest review report.',
    );
  });

  it('keeps the artifact pane deferred when the gate is explicitly blocked', () => {
    const builder = new DesktopGovernanceConsoleViewModelBuilder();
    const viewModel = builder.build({
      locale: 'zh-CN',
      workspaceLabel: 'desktop-workspace',
      health: {
        serviceHostKind: 'sidecar',
        serviceTransportKind: 'ipc',
        lifecycleStatus: 'ready',
        checkpointCapable: true,
        workspaceRoot: '/tmp/workspace/.repo-ai-governor',
        startedAt: '2026-04-04T00:00:00.000Z',
        protocolVersion: '1.0',
      },
      sessions: [],
      executions: [],
      lifecycle: {
        serviceLifecycleStatus: 'ready',
        restartCount: 0,
        windowWakeCount: 0,
        notificationCount: 0,
        artifactQueryGateState: DesktopArtifactQueryGateState.BLOCKED,
      },
    } as never);

    expect(viewModel.artifactPane.gateState).toBe(DesktopArtifactQueryGateState.BLOCKED);
    expect(viewModel.artifactPane.detailLines[0]).toContain(
      'service-owned artifact query contract',
    );
    expect(viewModel.artifactPane.artifacts.entries).toHaveLength(0);
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
