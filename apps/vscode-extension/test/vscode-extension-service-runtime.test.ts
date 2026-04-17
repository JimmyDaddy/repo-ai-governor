import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { vi } from 'vitest';

import { WorkspaceResolver } from '@repo-ai-governor/config';
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
  OrchestrationGovernanceActionKind,
  OrchestrationGovernanceAttentionLevel,
  OrchestrationGovernanceFollowUpSlaState,
  OrchestrationGovernanceNotificationStatus,
  OrchestrationGovernanceQueueKind,
  OrchestrationHandoffTargetKind,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, MemoryStoreEngine, RuntimeError } from '@repo-ai-governor/shared';

const serviceClientMock = vi.hoisted(() => ({
  construct: vi.fn(),
  getHealth: vi.fn(),
  getExecution: vi.fn(),
  queryExecutionBoard: vi.fn(),
  queryHitlInbox: vi.fn(),
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
    public constructor(workspaceRoot: string, dependencies?: { repositoryRoot?: string }) {
      serviceClientMock.construct(workspaceRoot, dependencies);
    }

    public readonly getHealth = serviceClientMock.getHealth;
    public readonly getExecution = serviceClientMock.getExecution;
    public readonly queryExecutionBoard = serviceClientMock.queryExecutionBoard;
    public readonly queryHitlInbox = serviceClientMock.queryHitlInbox;
    public readonly queryQueueOverview = serviceClientMock.queryQueueOverview;
    public readonly queryArtifactPane = serviceClientMock.queryArtifactPane;

    public readonly dispose = serviceClientMock.dispose;
  },
}));

import { VsCodeExtensionServiceRuntime } from '../src/runtime/vscode-extension-service-runtime.js';

/**
 * Renders one minimal workspace config fixture for runtime discovery tests.
 * @param options Workspace mode plus optional root overrides to persist into `governor.yaml`.
 * @returns YAML config content accepted by the shared config loader.
 */
function renderGovernorConfigContent(options: {
  mode: 'repo_local' | 'tool_managed';
  repoLocalRoot?: string;
  toolManagedRoot?: string;
}): string {
  return [
    'schemaVersion: "1.0"',
    'workspace:',
    `  mode: ${options.mode}`,
    ...(options.repoLocalRoot ? [`  repoLocalRoot: ${JSON.stringify(options.repoLocalRoot)}`] : []),
    ...(options.toolManagedRoot
      ? [`  toolManagedRoot: ${JSON.stringify(options.toolManagedRoot)}`]
      : []),
    'i18n:',
    '  runtimeEngine: i18next',
    '  defaultLocale: zh-CN',
    '  fallbackLocale: en-US',
    '  supportedLocales:',
    '    - zh-CN',
    '    - en-US',
    '',
  ].join('\n');
}

/**
 * Creates the minimum canonical workspace markers required for safe auto-discovery.
 * @param workspaceRoot Candidate repo-local workspace root under test.
 */
function writeWorkspaceMarkers(workspaceRoot: string): void {
  mkdirSync(join(workspaceRoot, 'context'), { recursive: true });
  writeFileSync(join(workspaceRoot, 'context', 'current-context.md'), '# test\n', 'utf8');
  mkdirSync(join(workspaceRoot, 'normative_knowledge_sources'), { recursive: true });
  writeFileSync(
    join(workspaceRoot, 'normative_knowledge_sources', 'normative-loading-manifest.yaml'),
    'schema_version: 1\n',
    'utf8',
  );
}

describe('VsCodeExtensionServiceRuntime', () => {
  beforeEach(() => {
    serviceClientMock.construct.mockReset();
    serviceClientMock.getHealth.mockReset();
    serviceClientMock.getExecution.mockReset();
    serviceClientMock.queryExecutionBoard.mockReset();
    serviceClientMock.queryHitlInbox.mockReset();
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
      temporaryBridges: [],
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

  it('falls back to an empty queue overview when the sidecar-backed queue query fails', async () => {
    serviceClientMock.queryQueueOverview.mockRejectedValueOnce(
      new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        'queue overview failed during packaged-sidecar startup',
      ),
    );

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.queryQueueOverview()).resolves.toEqual({
      generatedAt: '',
      automationInbox: [],
      reviewQueue: [],
      parallelLanes: [],
      workspaceSummary: [],
      temporaryBridges: [],
      notificationOwnership: {
        ownerSurface: OrchestrationClientSurface.DESKTOP,
        pendingItemCount: 0,
        dueSoonItemCount: 0,
        overdueItemCount: 0,
        activeWorkspaceCount: 0,
        defaultFollowUpSlaMinutes: 0,
        notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
      },
    });
  });

  it('falls back to an empty execution board when the sidecar-backed execution query fails', async () => {
    serviceClientMock.queryExecutionBoard.mockRejectedValueOnce(
      new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        'execution board failed during packaged-sidecar startup',
      ),
    );

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.queryExecutionBoard()).resolves.toEqual({
      executions: [],
      returnedCount: 0,
      totalMatchedCount: 0,
    });
  });

  it('falls back to an empty HITL inbox when the sidecar-backed inbox query fails', async () => {
    serviceClientMock.queryHitlInbox.mockRejectedValueOnce(
      new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        'HITL inbox failed during packaged-sidecar startup',
      ),
    );

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.queryHitlInbox()).resolves.toEqual({
      pendingDecisions: [],
      returnedCount: 0,
      totalMatchedCount: 0,
    });
  });

  it('resolves tool-managed governance workspace roots before creating the sidecar client', async () => {
    serviceClientMock.queryQueueOverview.mockResolvedValueOnce({
      generatedAt: '2026-04-07T03:05:00.000Z',
      automationInbox: [],
      reviewQueue: [],
      parallelLanes: [],
      workspaceSummary: [],
      temporaryBridges: [],
      notificationOwnership: {
        ownerSurface: OrchestrationClientSurface.DESKTOP,
        pendingItemCount: 0,
        dueSoonItemCount: 0,
        overdueItemCount: 0,
        activeWorkspaceCount: 0,
        defaultFollowUpSlaMinutes: 60,
        notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
      },
    });

    const runtime = new VsCodeExtensionServiceRuntime({
      workspaceResolver: {
        resolve: vi
          .fn()
          .mockReturnValueOnce({
            repositoryRoot: '/repo',
            workspaceRoot: '/Users/test/.repo-ai-governor/workspaces/abcd1234/.repo-ai-governor',
          })
          .mockReturnValueOnce({
            repositoryRoot: '/repo',
            workspaceRoot: '/Users/test/.repo-ai-governor/workspaces/abcd1234/.repo-ai-governor',
          }),
      },
      pathExists: vi.fn().mockReturnValue(false),
    });

    await runtime.queryQueueOverview();

    expect(serviceClientMock.construct).toHaveBeenCalledWith(
      '/Users/test/.repo-ai-governor/workspaces/abcd1234/.repo-ai-governor',
      {
        repositoryRoot: '/repo',
      },
    );
  });

  it('resolves workflow-studio snapshots from queue overview, selected execution, and artifact evidence', async () => {
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
            currentStageId: 'review_verify',
            latestEventSequence: 1,
            nextCursor: 'cursor-1',
            taskId: 'TK-940',
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
      temporaryBridges: [],
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
    serviceClientMock.queryArtifactPane.mockResolvedValueOnce({
      artifacts: [],
      reviews: [],
      transcript: [],
      resolvedExecutionId: 'execution-1',
      resolvedSessionId: 'session-1',
      reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
      reviewLifecycle: {
        totalReviewCount: 1,
        pendingReviewCount: 0,
        verifiedReviewCount: 0,
        resolvedReviewCount: 1,
        latestReviewId: 'review-1',
        latestLifecycleStatus: 'resolved',
        latestReviewFilePath: '/repo/.repo-ai-governor/review/resolved.md',
        navigationReviewIds: ['review-1'],
      },
      workbench: {
        artifactCount: 1,
        reviewCount: 1,
        transcriptCount: 0,
        latestArtifactId: 'artifact-1',
      },
      evidenceBacklinks: {
        governanceWorkspacePath: '/repo/.repo-ai-governor',
        artifactPaths: ['/repo/.repo-ai-governor/context/review.md'],
        reviewPaths: ['/repo/.repo-ai-governor/review/resolved.md'],
        transcriptEntryIds: [],
      },
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(
      runtime.resolveWorkflowStudioSnapshot({
        executionId: 'execution-1',
        reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
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
          currentStageId: 'review_verify',
          taskId: 'TK-940',
        },
      },
      artifactPane: {
        reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
      },
      reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
    });
  });

  it('refreshes the resolved governance workspace after an in-session config change', async () => {
    const scratchRoot = mkdtempSync(join(tmpdir(), 'repo-ai-governor-vscode-runtime-'));
    const repositoryRoot = join(scratchRoot, 'repo');
    const defaultWorkspaceRoot = join(repositoryRoot, '.repo-ai-governor');
    const nextWorkspaceRoot = join(repositoryRoot, 'governance', 'next-state');

    writeWorkspaceMarkers(defaultWorkspaceRoot);
    writeWorkspaceMarkers(nextWorkspaceRoot);
    writeFileSync(
      join(defaultWorkspaceRoot, 'governor.yaml'),
      renderGovernorConfigContent({
        mode: 'repo_local',
        repoLocalRoot: '.repo-ai-governor',
      }),
      'utf8',
    );

    vscodeMock.state.workspaceFolders = [
      {
        name: 'repo-with-config-change',
        uri: {
          fsPath: repositoryRoot,
        },
      },
    ];
    serviceClientMock.queryQueueOverview.mockResolvedValue({
      generatedAt: '2026-04-07T03:05:00.000Z',
      automationInbox: [],
      reviewQueue: [],
      parallelLanes: [],
      workspaceSummary: [],
      temporaryBridges: [],
      notificationOwnership: {
        ownerSurface: OrchestrationClientSurface.DESKTOP,
        pendingItemCount: 0,
        dueSoonItemCount: 0,
        overdueItemCount: 0,
        activeWorkspaceCount: 0,
        defaultFollowUpSlaMinutes: 60,
        notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
      },
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    try {
      await runtime.queryQueueOverview();

      writeFileSync(
        join(defaultWorkspaceRoot, 'governor.yaml'),
        renderGovernorConfigContent({
          mode: 'repo_local',
          repoLocalRoot: 'governance/next-state',
        }),
        'utf8',
      );
      await runtime.queryQueueOverview();

      expect(serviceClientMock.construct).toHaveBeenNthCalledWith(1, defaultWorkspaceRoot, {
        repositoryRoot,
      });
      expect(serviceClientMock.construct).toHaveBeenNthCalledWith(2, nextWorkspaceRoot, {
        repositoryRoot,
      });
    } finally {
      await runtime.dispose();
      rmSync(scratchRoot, { recursive: true, force: true });
    }
  });

  it('discovers custom repo-local workspace roots when the default shadow config path is absent', async () => {
    const scratchRoot = mkdtempSync(join(tmpdir(), 'repo-ai-governor-vscode-runtime-'));
    const repositoryRoot = join(scratchRoot, 'repo');
    const customWorkspaceRoot = join(repositoryRoot, 'governance', 'state');

    mkdirSync(customWorkspaceRoot, { recursive: true });
    writeWorkspaceMarkers(customWorkspaceRoot);
    writeFileSync(
      join(customWorkspaceRoot, 'governor.yaml'),
      renderGovernorConfigContent({
        mode: 'repo_local',
        repoLocalRoot: 'governance/state',
      }),
      'utf8',
    );

    vscodeMock.state.workspaceFolders = [
      {
        name: 'custom-repo-local',
        uri: {
          fsPath: repositoryRoot,
        },
      },
    ];
    serviceClientMock.queryQueueOverview.mockResolvedValueOnce({
      generatedAt: '2026-04-07T03:05:00.000Z',
      automationInbox: [],
      reviewQueue: [],
      parallelLanes: [],
      workspaceSummary: [],
      temporaryBridges: [],
      notificationOwnership: {
        ownerSurface: OrchestrationClientSurface.DESKTOP,
        pendingItemCount: 0,
        dueSoonItemCount: 0,
        overdueItemCount: 0,
        activeWorkspaceCount: 0,
        defaultFollowUpSlaMinutes: 60,
        notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
      },
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    try {
      await runtime.queryQueueOverview();

      expect(serviceClientMock.construct).toHaveBeenCalledWith(customWorkspaceRoot, {
        repositoryRoot,
      });
    } finally {
      await runtime.dispose();
      rmSync(scratchRoot, { recursive: true, force: true });
    }
  });

  it('does not let unrelated nested custom governor configs hijack repo-opened discovery', async () => {
    const scratchRoot = mkdtempSync(join(tmpdir(), 'repo-ai-governor-vscode-runtime-'));
    const repositoryRoot = join(scratchRoot, 'repo');
    const fixtureWorkspaceRoot = join(repositoryRoot, 'fixtures', 'sample-governance');
    const expectedWorkspaceRoot = new WorkspaceResolver().resolve({
      currentWorkingDirectory: repositoryRoot,
    }).workspaceRoot;

    mkdirSync(fixtureWorkspaceRoot, { recursive: true });
    writeFileSync(
      join(fixtureWorkspaceRoot, 'governor.yaml'),
      renderGovernorConfigContent({
        mode: 'repo_local',
        repoLocalRoot: 'fixtures/sample-governance',
      }),
      'utf8',
    );

    vscodeMock.state.workspaceFolders = [
      {
        name: 'repo-with-fixture',
        uri: {
          fsPath: repositoryRoot,
        },
      },
    ];
    serviceClientMock.queryQueueOverview.mockResolvedValueOnce({
      generatedAt: '2026-04-07T03:05:00.000Z',
      automationInbox: [],
      reviewQueue: [],
      parallelLanes: [],
      workspaceSummary: [],
      temporaryBridges: [],
      notificationOwnership: {
        ownerSurface: OrchestrationClientSurface.DESKTOP,
        pendingItemCount: 0,
        dueSoonItemCount: 0,
        overdueItemCount: 0,
        activeWorkspaceCount: 0,
        defaultFollowUpSlaMinutes: 60,
        notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
      },
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    try {
      await runtime.queryQueueOverview();

      expect(serviceClientMock.construct).toHaveBeenCalledWith(expectedWorkspaceRoot, {
        repositoryRoot,
      });
    } finally {
      await runtime.dispose();
      rmSync(scratchRoot, { recursive: true, force: true });
    }
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
      temporaryBridges: [],
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
        temporaryBridges: [],
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

  it('hydrates queue-driven review detail with exact execution fallback when the board window misses', async () => {
    serviceClientMock.queryExecutionBoard.mockResolvedValueOnce({
      executions: [],
      returnedCount: 0,
      totalMatchedCount: 20,
    });
    serviceClientMock.getExecution.mockResolvedValueOnce({
      executionId: 'execution-older',
      executionSessionId: 'session-older',
      processId: 'process-older',
      workspaceId: 'workspace-1',
      workspaceRoot: '/repo',
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-older',
      serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
      serviceTransportKind: OrchestrationServiceTransportKind.IPC,
      status: OrchestrationExecutionStatus.INTERRUPTED,
      checkpointCapable: true,
      recoveryCapable: true,
      acceptedAt: '2026-04-07T03:00:00.000Z',
      updatedAt: '2026-04-07T03:10:00.000Z',
      pendingHitl: false,
      latestEventSequence: 7,
      nextCursor: 'cursor-older',
      taskId: 'TK-938',
    });
    serviceClientMock.queryArtifactPane.mockResolvedValueOnce({
      artifacts: [],
      reviews: [],
      transcript: [],
      resolvedExecutionId: 'execution-older',
      resolvedSessionId: 'session-older',
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
        artifactPaths: [],
        reviewPaths: [],
        transcriptEntryIds: [],
      },
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(
      runtime.resolveReviewDetailSnapshot({
        executionId: 'execution-older',
        executionSessionId: undefined,
        reviewSourcePath: undefined,
        queueEntry: {
          queueEntryId: 'automation:execution-older',
          queueKind: OrchestrationGovernanceQueueKind.AUTOMATION_INBOX,
          workspaceId: 'workspace-1',
          workspaceRoot: '/repo',
          executionId: 'execution-older',
          executionKind: OrchestrationExecutionKind.RUN,
          executionStatus: OrchestrationExecutionStatus.INTERRUPTED,
          taskId: 'TK-938',
          attentionLevel: OrchestrationGovernanceAttentionLevel.WARNING,
          notificationStatus: OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED,
          followUpSlaState: OrchestrationGovernanceFollowUpSlaState.OVERDUE,
          actions: [
            {
              actionId: 'execution-older:recover',
              actionKind: OrchestrationGovernanceActionKind.RECOVER_EXECUTION,
              executionId: 'execution-older',
              enabled: true,
              requiresConfirmation: false,
            },
          ],
          handoffTargets: [
            {
              targetId: 'execution-older:review',
              executionId: 'execution-older',
              targetKind: OrchestrationHandoffTargetKind.REVIEW_DOCUMENT,
              targetPath: '/repo/.repo-ai-governor/review/recovered.md',
              exists: true,
            },
          ],
        },
      }),
    ).resolves.toMatchObject({
      selectedExecution: {
        execution: {
          executionId: 'execution-older',
          executionSessionId: 'session-older',
        },
        actions: [
          {
            actionId: 'execution-older:recover',
          },
        ],
        handoffTargets: [
          {
            targetId: 'execution-older:review',
          },
        ],
      },
      artifactPane: {
        resolvedExecutionId: 'execution-older',
      },
    });

    expect(serviceClientMock.getExecution).toHaveBeenCalledWith('execution-older');
    expect(serviceClientMock.queryArtifactPane).toHaveBeenCalledWith({
      executionId: 'execution-older',
      sessionId: 'session-older',
    });
  });

  it('rejects review-detail snapshot restoration when the artifact pane query fails', async () => {
    serviceClientMock.queryExecutionBoard.mockResolvedValueOnce({
      executions: [
        {
          execution: {
            executionId: 'execution-restore-failure',
            executionSessionId: 'session-restore-failure',
            processId: 'process-restore-failure',
            workspaceId: 'workspace-1',
            workspaceRoot: '/repo',
            executionKind: OrchestrationExecutionKind.RUN,
            clientSurface: OrchestrationClientSurface.DESKTOP,
            eventStreamToken: 'stream-restore-failure',
            serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
            serviceTransportKind: OrchestrationServiceTransportKind.IPC,
            status: OrchestrationExecutionStatus.RUNNING,
            checkpointCapable: true,
            recoveryCapable: true,
            acceptedAt: '2026-04-07T03:00:00.000Z',
            updatedAt: '2026-04-07T03:10:00.000Z',
            pendingHitl: false,
            latestEventSequence: 7,
            nextCursor: 'cursor-restore-failure',
            taskId: 'TK-949',
          },
          actions: [],
          handoffTargets: [],
        },
      ],
      returnedCount: 1,
      totalMatchedCount: 1,
    });
    serviceClientMock.queryArtifactPane.mockRejectedValueOnce(
      new RuntimeError(GovernorErrorCode.PROCESS_RUNTIME_CANCELLED, 'artifact pane restore failed'),
    );

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(
      runtime.resolveReviewDetailSnapshot({
        executionId: 'execution-restore-failure',
      }),
    ).rejects.toMatchObject({
      message: 'artifact pane restore failed',
    });
  });

  it('rejects workflow-studio snapshot restoration when the artifact pane query fails', async () => {
    serviceClientMock.queryQueueOverview.mockResolvedValueOnce({
      generatedAt: '2026-04-07T03:05:00.000Z',
      automationInbox: [],
      reviewQueue: [],
      parallelLanes: [],
      workspaceSummary: [],
      temporaryBridges: [],
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
    serviceClientMock.queryExecutionBoard.mockResolvedValueOnce({
      executions: [
        {
          execution: {
            executionId: 'execution-workflow-restore-failure',
            executionSessionId: 'session-workflow-restore-failure',
            processId: 'process-workflow-restore-failure',
            workspaceId: 'workspace-1',
            workspaceRoot: '/repo',
            executionKind: OrchestrationExecutionKind.RUN,
            clientSurface: OrchestrationClientSurface.DESKTOP,
            eventStreamToken: 'stream-workflow-restore-failure',
            serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
            serviceTransportKind: OrchestrationServiceTransportKind.IPC,
            status: OrchestrationExecutionStatus.RUNNING,
            checkpointCapable: true,
            recoveryCapable: true,
            acceptedAt: '2026-04-07T03:00:00.000Z',
            updatedAt: '2026-04-07T03:10:00.000Z',
            pendingHitl: false,
            latestEventSequence: 7,
            nextCursor: 'cursor-workflow-restore-failure',
            taskId: 'TK-949',
          },
          actions: [],
          handoffTargets: [],
        },
      ],
      returnedCount: 1,
      totalMatchedCount: 1,
    });
    serviceClientMock.queryArtifactPane.mockRejectedValueOnce(
      new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        'workflow studio artifact restore failed',
      ),
    );

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(
      runtime.resolveWorkflowStudioSnapshot({
        executionId: 'execution-workflow-restore-failure',
      }),
    ).rejects.toMatchObject({
      message: 'workflow studio artifact restore failed',
    });
  });
});
