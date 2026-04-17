import { vi } from 'vitest';

import {
  MemoryProviderDistributionMode,
  MemoryProviderHostSurface,
  MemoryProviderResolutionSource,
  MemoryProviderRuntimeMode,
} from '@repo-ai-governor/memory-provider-registry';
import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationGovernanceNotificationStatus,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, MemoryStoreEngine, RuntimeError } from '@repo-ai-governor/shared';

const serviceClientMock = vi.hoisted(() => ({
  getHealth: vi.fn(),
  queryExecutionBoard: vi.fn(),
  queryQueueOverview: vi.fn(),
  queryArtifactPane: vi.fn(),
  dispose: vi.fn(),
}));

const vscodeMock = vi.hoisted(() => ({
  state: {
    trusted: true,
    workspaceFolders: [
      {
        name: 'ai-governor',
        uri: {
          fsPath: '/repo',
        },
      },
    ],
    activeTextEditor: undefined,
  },
}));

vi.mock(
  'vscode',
  () => ({
    workspace: {
      get isTrusted() {
        return vscodeMock.state.trusted;
      },
      get workspaceFolders() {
        return vscodeMock.state.workspaceFolders;
      },
    },
    window: {
      get activeTextEditor() {
        return vscodeMock.state.activeTextEditor;
      },
    },
  }),
  { virtual: true },
);

vi.mock('@repo-ai-governor/core-orchestration-service/sidecar-client', () => ({
  LocalOrchestrationServiceSidecarClient: class LocalOrchestrationServiceSidecarClient {
    public readonly getHealth = serviceClientMock.getHealth;
    public readonly queryExecutionBoard = serviceClientMock.queryExecutionBoard;
    public readonly queryQueueOverview = serviceClientMock.queryQueueOverview;
    public readonly queryArtifactPane = serviceClientMock.queryArtifactPane;

    public readonly dispose = serviceClientMock.dispose;
  },
}));

import { VsCodeExtensionServiceRuntime } from '../src/runtime/vscode-extension-service-runtime.js';

describe('VsCodeExtensionServiceRuntime', () => {
  beforeEach(() => {
    serviceClientMock.getHealth.mockReset();
    serviceClientMock.queryExecutionBoard.mockReset();
    serviceClientMock.queryQueueOverview.mockReset();
    serviceClientMock.queryArtifactPane.mockReset();
    serviceClientMock.dispose.mockReset();
    vscodeMock.state.trusted = true;
    vscodeMock.state.workspaceFolders = [
      {
        name: 'ai-governor',
        uri: {
          fsPath: '/repo',
        },
      },
    ];
    vscodeMock.state.activeTextEditor = undefined;
  });

  it('keeps editor-local workspace facts available when the health probe fails', async () => {
    serviceClientMock.getHealth.mockRejectedValueOnce(
      new RuntimeError(GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND, 'health probe failed', {
        surface: 'vscode_extension_test',
      }),
    );

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.resolveWorkspaceContextSnapshot()).resolves.toEqual({
      workspaceLabel: 'ai-governor',
      workspaceRoot: '/repo',
      workspaceTrusted: true,
    });
  });

  it('adds service diagnostics when the health probe succeeds', async () => {
    serviceClientMock.getHealth.mockResolvedValueOnce({
      serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
      serviceTransportKind: OrchestrationServiceTransportKind.IPC,
      lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
      checkpointCapable: true,
      workspaceRoot: '/repo',
      startedAt: '2026-04-07T03:00:00.000Z',
      protocolVersion: '1',
      pid: 4321,
      memoryProvider: {
        memoryStoreEngine: MemoryStoreEngine.SQLITE_FS,
        memoryStoreRoot: 'context/memory/service',
        memoryStoreProvider: 'sqlite-fs',
        memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
        memoryStoreDistributionMode: MemoryProviderDistributionMode.DEFAULT,
        memoryStoreResolutionSource: MemoryProviderResolutionSource.PLUGIN_MODULE,
        memoryStoreHostSurface: MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
        memoryStoreRuntimeMode: MemoryProviderRuntimeMode.DAEMON,
      },
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.resolveWorkspaceContextSnapshot()).resolves.toEqual({
      workspaceLabel: 'ai-governor',
      workspaceRoot: '/repo',
      workspaceTrusted: true,
      serviceHealth: {
        lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
        serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
        serviceTransportKind: OrchestrationServiceTransportKind.IPC,
        checkpointCapable: true,
        memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
        pid: 4321,
      },
    });
  });

  it('resolves workbench overview from the service-owned queue seam', async () => {
    serviceClientMock.getHealth.mockResolvedValueOnce({
      serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
      serviceTransportKind: OrchestrationServiceTransportKind.IPC,
      lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
      checkpointCapable: true,
      workspaceRoot: '/repo',
      startedAt: '2026-04-07T03:00:00.000Z',
      protocolVersion: '1',
    });
    serviceClientMock.queryExecutionBoard.mockResolvedValueOnce({
      executions: [
        {
          execution: {
            executionId: 'execution-1',
            executionSessionId: 'session-1',
            processId: 'process-1',
            workspaceId: 'workspace-1',
            workspaceRoot: '/repo',
            executionKind: OrchestrationExecutionKind.RUN,
            clientSurface: OrchestrationClientSurface.DESKTOP,
            eventStreamToken: 'stream-1',
            serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
            serviceTransportKind: OrchestrationServiceTransportKind.IPC,
            status: OrchestrationExecutionStatus.RUNNING,
            checkpointCapable: true,
            recoveryCapable: true,
            acceptedAt: '2026-04-07T03:00:00.000Z',
            updatedAt: '2026-04-07T03:05:00.000Z',
            pendingHitl: false,
            latestEventSequence: 1,
            nextCursor: 'cursor-1',
            taskId: 'TK-936',
          },
          actions: [],
          handoffTargets: [],
        },
      ],
      returnedCount: 1,
      totalMatchedCount: 1,
    });
    serviceClientMock.queryQueueOverview.mockResolvedValueOnce({
      generatedAt: '2026-04-07T03:05:00.000Z',
      automationInbox: [],
      reviewQueue: [],
      parallelLanes: [],
      workspaceSummary: [],
      notificationOwnership: {
        ownerSurface: OrchestrationClientSurface.DESKTOP,
        pendingItemCount: 0,
        dueSoonItemCount: 0,
        overdueItemCount: 0,
        activeWorkspaceCount: 1,
        defaultFollowUpSlaMinutes: 60,
        notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
      },
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(
      runtime.resolveWorkbenchOverviewSnapshot({
        executionId: 'execution-1',
        reviewSourcePath: '/repo/review.md',
      }),
    ).resolves.toMatchObject({
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
      },
      queueOverview: {
        generatedAt: '2026-04-07T03:05:00.000Z',
      },
      selectedExecution: {
        execution: {
          executionId: 'execution-1',
          taskId: 'TK-936',
        },
      },
      reviewSourcePath: '/repo/review.md',
    });
  });

  it('keeps review-only detail anchored to the requested review source when execution is cleared', async () => {
    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(
      runtime.resolveReviewDetailSnapshot({
        executionId: undefined,
        executionSessionId: undefined,
        reviewSourcePath: '/repo/review-only.md',
      }),
    ).resolves.toEqual({
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
      },
      requestedReviewSourcePath: '/repo/review-only.md',
    });

    expect(serviceClientMock.queryExecutionBoard).not.toHaveBeenCalled();
    expect(serviceClientMock.queryArtifactPane).not.toHaveBeenCalled();
  });

  it('does not fall back to the newest execution for workbench overview when review-only selection clears execution', async () => {
    serviceClientMock.queryQueueOverview.mockResolvedValueOnce({
      generatedAt: '2026-04-07T03:05:00.000Z',
      automationInbox: [],
      reviewQueue: [],
      parallelLanes: [],
      workspaceSummary: [],
      notificationOwnership: {
        ownerSurface: OrchestrationClientSurface.DESKTOP,
        pendingItemCount: 0,
        dueSoonItemCount: 0,
        overdueItemCount: 0,
        activeWorkspaceCount: 1,
        defaultFollowUpSlaMinutes: 60,
        notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
      },
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(
      runtime.resolveWorkbenchOverviewSnapshot({
        executionId: undefined,
        executionSessionId: undefined,
        reviewSourcePath: '/repo/review-only.md',
      }),
    ).resolves.toEqual({
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
      },
      queueOverview: {
        generatedAt: '2026-04-07T03:05:00.000Z',
        automationInbox: [],
        reviewQueue: [],
        parallelLanes: [],
        workspaceSummary: [],
        notificationOwnership: {
          ownerSurface: OrchestrationClientSurface.DESKTOP,
          pendingItemCount: 0,
          dueSoonItemCount: 0,
          overdueItemCount: 0,
          activeWorkspaceCount: 1,
          defaultFollowUpSlaMinutes: 60,
          notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
        },
      },
      reviewSourcePath: '/repo/review-only.md',
    });

    expect(serviceClientMock.queryExecutionBoard).not.toHaveBeenCalled();
  });
});
