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
  OrchestrationSessionStatus,
  OrchestrationWorkspaceOperationKind,
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
  queryBootstrapReadiness: vi.fn(),
  querySecureAuthoring: vi.fn(),
  getSession: vi.fn(),
  resumeSession: vi.fn(),
  setUserConfigValue: vi.fn(),
  setManagedSecret: vi.fn(),
  runWorkspaceOperation: vi.fn(),
  dispose: vi.fn(),
}));

const vscodeMock = vi.hoisted(() => ({
  state: {
    trusted: true,
    language: 'en-US',
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
    env: {
      get language() {
        return vscodeMock.state.language;
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
    public readonly queryBootstrapReadiness = serviceClientMock.queryBootstrapReadiness;
    public readonly querySecureAuthoring = serviceClientMock.querySecureAuthoring;
    public readonly getSession = serviceClientMock.getSession;
    public readonly resumeSession = serviceClientMock.resumeSession;
    public readonly setUserConfigValue = serviceClientMock.setUserConfigValue;
    public readonly setManagedSecret = serviceClientMock.setManagedSecret;
    public readonly runWorkspaceOperation = serviceClientMock.runWorkspaceOperation;
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
    serviceClientMock.queryBootstrapReadiness.mockReset();
    serviceClientMock.querySecureAuthoring.mockReset();
    serviceClientMock.getSession.mockReset();
    serviceClientMock.resumeSession.mockReset();
    serviceClientMock.setUserConfigValue.mockReset();
    serviceClientMock.setManagedSecret.mockReset();
    serviceClientMock.runWorkspaceOperation.mockReset();
    serviceClientMock.dispose.mockReset();
    vscodeMock.state.trusted = true;
    vscodeMock.state.language = 'en-US';
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
      latestWorkspaceOperation: {
        operationKind: OrchestrationWorkspaceOperationKind.DOCTOR,
        completedAt: '2026-04-07T03:04:00.000Z',
        message: 'Doctor completed.',
        result: {
          operation: 'env_doctor',
          summary: 'Doctor completed.',
          checkTotals: {
            pass: 5,
            warn: 1,
            fail: 0,
          },
          checks: [
            {
              id: 'workspace_writable',
              status: 'pass',
              detail: 'Workspace is writable.',
            },
            {
              id: 'artifact_registry_state',
              status: 'warn',
              detail: 'artifact registry is not initialized yet',
            },
          ],
          artifacts: [
            {
              id: 'doctor_diagnostics',
              path: '/repo/.repo-ai-governor/context/diagnostics/doctor/doctor-1.json',
            },
          ],
          interactionPrompts: [
            {
              title: 'Workspace is read-only',
              action:
                'Switch to writable attach mode if you need to create/update governance artifacts.',
              blocking: false,
            },
          ],
          layeredLogs: {
            summary: ['attach_mode=read_only'],
            detailed: ['workspace_root=/repo/.repo-ai-governor'],
          },
        },
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
        latestWorkspaceOperation: {
          operationKind: OrchestrationWorkspaceOperationKind.DOCTOR,
          completedAt: '2026-04-07T03:04:00.000Z',
          message: 'Doctor completed.',
          result: {
            summary: 'Doctor completed.',
          },
        },
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

  it('keeps workbench overview restorable when bootstrap readiness fails', async () => {
    serviceClientMock.queryBootstrapReadiness.mockRejectedValueOnce(
      new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        'bootstrap readiness restore failed',
      ),
    );
    serviceClientMock.queryExecutionBoard.mockResolvedValueOnce({
      executions: [],
      returnedCount: 0,
      totalMatchedCount: 0,
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

    await expect(runtime.resolveWorkbenchOverviewSnapshot({})).resolves.toMatchObject({
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
      },
      queueOverview: {
        generatedAt: '2026-04-07T03:05:00.000Z',
      },
    });
  });

  it('keeps workflow studio restorable when bootstrap readiness fails', async () => {
    serviceClientMock.queryBootstrapReadiness.mockRejectedValueOnce(
      new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        'bootstrap readiness restore failed',
      ),
    );
    serviceClientMock.queryExecutionBoard.mockResolvedValueOnce({
      executions: [],
      returnedCount: 0,
      totalMatchedCount: 0,
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

    await expect(runtime.resolveWorkflowStudioSnapshot({})).resolves.toMatchObject({
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
      },
      queueOverview: {
        generatedAt: '2026-04-07T03:05:00.000Z',
      },
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
    serviceClientMock.getSession.mockResolvedValueOnce({
      sessionId: 'session-1',
      status: OrchestrationSessionStatus.OPEN,
      openedAt: '2026-04-07T03:00:00.000Z',
      latestTurnId: 'turn-1',
      latestEventSequence: 5,
      nextCursor: 'cursor-session-1',
      eventCount: 5,
      currentRouteId: 'workflow_authoring',
      executionId: 'execution-1',
      context: {},
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
      sessionContinuity: {
        sessionId: 'session-1',
        sessionStatus: OrchestrationSessionStatus.OPEN,
        currentRouteId: 'workflow_authoring',
        latestTurnId: 'turn-1',
        latestEventSequence: 5,
        nextCursor: 'cursor-session-1',
        resumeSelector: 'session-1',
      },
      reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
    });
    expect(serviceClientMock.resumeSession).not.toHaveBeenCalled();
  });

  it('keeps workflow-studio continuity read-only and never resumes the session during snapshot resolution', async () => {
    serviceClientMock.getHealth.mockResolvedValueOnce({
      serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
      serviceTransportKind: OrchestrationServiceTransportKind.IPC,
      lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
      checkpointCapable: true,
      workspaceRoot: '/repo',
      startedAt: '2026-04-07T03:00:00.000Z',
      protocolVersion: '1',
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
            updatedAt: '2026-04-07T03:10:00.000Z',
            pendingHitl: false,
            latestEventSequence: 7,
            nextCursor: 'cursor-1',
            taskId: 'TK-956',
          },
          actions: [],
          handoffTargets: [],
        },
      ],
      returnedCount: 1,
      totalMatchedCount: 1,
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
      },
      evidenceBacklinks: {
        governanceWorkspacePath: '/repo/.repo-ai-governor',
        artifactPaths: [],
        reviewPaths: ['/repo/.repo-ai-governor/review/resolved.md'],
        transcriptEntryIds: [],
      },
    });
    serviceClientMock.getSession.mockResolvedValueOnce({
      sessionId: 'session-1',
      status: OrchestrationSessionStatus.OPEN,
      openedAt: '2026-04-07T03:00:00.000Z',
      latestTurnId: 'turn-1',
      latestEventSequence: 7,
      nextCursor: 'cursor-1',
      eventCount: 7,
      currentRouteId: 'workflow_authoring',
      executionId: 'execution-1',
      context: {},
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(
      runtime.resolveWorkflowStudioSnapshot({
        executionId: 'execution-1',
      }),
    ).resolves.toMatchObject({
      sessionContinuity: {
        sessionId: 'session-1',
        sessionStatus: OrchestrationSessionStatus.OPEN,
        latestTurnId: 'turn-1',
        latestEventSequence: 7,
        nextCursor: 'cursor-1',
        resumeSelector: 'session-1',
      },
    });
    expect(serviceClientMock.resumeSession).not.toHaveBeenCalled();
  });

  it('resolves secure-authoring diagnostics through the embedded CLI JSON contract and caches the snapshot per repository root', async () => {
    const embeddedCliExecutor = vi
      .fn()
      .mockResolvedValueOnce({
        command_result: {
          details: {
            config_path: '/Users/test/.repo-ai-governor/user-config.yaml',
            config_exists: true,
            legacy_preference_path: '/Users/test/.repo-ai-governor/cli-preferences.yaml',
            legacy_preference_exists: false,
            theme_preference: 'calm',
            workspace_mode_preference: 'repo_local',
          },
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            entries:
              'ui.react.theme=calm | tools.codex.remoteApi.credentialRef=secret://openai/api-key | tools.claude-code.remoteApi.credentialRef=secret://anthropic/api-key',
          },
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            selected_backend: 'os-keychain',
            default_backend: 'os-keychain',
            index_path: '/Users/test/.repo-ai-governor/secret-index.json',
          },
          checks: [
            {
              id: 'secret_backend_os-keychain',
              status: 'pass',
              detail: 'Ready',
            },
            {
              id: 'secret_backend_unsafe-local-file',
              status: 'pass',
              detail: 'Explicit opt-in only',
            },
          ],
          experience: {
            interactionPrompts: [
              {
                action:
                  'unsafe-local-file stores plaintext secrets on disk; use it only with explicit local-only opt-in.',
              },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            records:
              'openai/api-key@os-keychain:present | anthropic/api-key@unsafe-local-file:missing',
          },
        },
      });

    const runtime = new VsCodeExtensionServiceRuntime({
      embeddedCliExecutor,
    });

    await expect(runtime.resolveSecureAuthoringSnapshot()).resolves.toEqual({
      userConfig: {
        configPath: '/Users/test/.repo-ai-governor/user-config.yaml',
        configExists: true,
        legacyPreferencePath: '/Users/test/.repo-ai-governor/cli-preferences.yaml',
        legacyPreferenceExists: false,
        themePreference: 'calm',
        workspaceModePreference: 'repo_local',
        entries: [
          {
            keyPath: 'ui.react.theme',
            value: 'calm',
          },
          {
            keyPath: 'tools.codex.remoteApi.credentialRef',
            value: 'secret://openai/api-key',
          },
          {
            keyPath: 'tools.claude-code.remoteApi.credentialRef',
            value: 'secret://anthropic/api-key',
          },
        ],
      },
      secretReadiness: {
        selectedBackendId: 'os-keychain',
        defaultBackendId: 'os-keychain',
        indexPath: '/Users/test/.repo-ai-governor/secret-index.json',
        backends: [
          {
            backendId: 'os-keychain',
            available: true,
            detail: 'Ready',
          },
          {
            backendId: 'unsafe-local-file',
            available: true,
            detail: 'Explicit opt-in only',
            warning:
              'unsafe-local-file stores plaintext secrets on disk; use it only with explicit local-only opt-in.',
          },
        ],
        records: [
          {
            keyName: 'openai/api-key',
            backendId: 'os-keychain',
            exists: true,
          },
          {
            keyName: 'anthropic/api-key',
            backendId: 'unsafe-local-file',
            exists: false,
          },
        ],
        configuredCredentialRefs: ['secret://openai/api-key', 'secret://anthropic/api-key'],
        unresolvedCredentialRefs: ['secret://anthropic/api-key'],
      },
    });

    await runtime.resolveSecureAuthoringSnapshot();

    expect(embeddedCliExecutor).toHaveBeenCalledTimes(4);
    expect(embeddedCliExecutor).toHaveBeenNthCalledWith(1, {
      args: ['config', 'status'],
      currentWorkingDirectory: '/repo',
    });
    expect(embeddedCliExecutor).toHaveBeenNthCalledWith(4, {
      args: ['secret', 'list'],
      currentWorkingDirectory: '/repo',
    });
  });

  it('threads the active VS Code locale through the sidecar-backed secure-authoring path', async () => {
    vscodeMock.state.language = 'zh-CN';
    serviceClientMock.querySecureAuthoring.mockResolvedValueOnce({
      degradedReason: '中文降级原因',
    });
    serviceClientMock.setUserConfigValue.mockResolvedValueOnce({
      message: '配置已更新',
      configPath: '/Users/test/.repo-ai-governor/user-config.yaml',
      persistedValue: 'tool_managed',
    });
    serviceClientMock.setManagedSecret.mockResolvedValueOnce({
      message: 'Secret 已更新',
      selector: 'secret://openai/api-key',
      backendId: 'os-keychain',
      warning: '仅限本地使用',
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.resolveSecureAuthoringSnapshot()).resolves.toEqual({
      degradedReason: '中文降级原因',
    });
    await expect(
      runtime.setUserConfigValue('workspace.mode_preference', 'tool_managed'),
    ).resolves.toEqual({
      message: '配置已更新',
      configPath: '/Users/test/.repo-ai-governor/user-config.yaml',
      persistedValue: 'tool_managed',
    });
    await expect(
      runtime.setManagedSecret('openai/api-key', 'sk-managed-secret', 'os-keychain'),
    ).resolves.toEqual({
      message: 'Secret 已更新',
      selector: 'secret://openai/api-key',
      backendId: 'os-keychain',
      warning: '仅限本地使用',
    });

    expect(serviceClientMock.querySecureAuthoring).toHaveBeenCalledWith({
      locale: 'zh-CN',
    });
    expect(serviceClientMock.setUserConfigValue).toHaveBeenCalledWith({
      keyPath: 'workspace.mode_preference',
      value: 'tool_managed',
      locale: 'zh-CN',
    });
    expect(serviceClientMock.setManagedSecret).toHaveBeenCalledWith({
      keyName: 'openai/api-key',
      value: 'sk-managed-secret',
      backendId: 'os-keychain',
      locale: 'zh-CN',
    });
  });

  it('retries secure-authoring diagnostics after one transient degraded snapshot instead of pinning the cache', async () => {
    let statusAttempt = 0;
    const embeddedCliExecutor = vi.fn(async (request: { args: readonly string[] }) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        statusAttempt += 1;
        if (statusAttempt === 1) {
          throw new RuntimeError(
            GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
            'transient secure-authoring failure',
          );
        }

        return {
          command_result: {
            details: {
              config_path: '/Users/test/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/Users/test/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            },
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: {
              entries: 'ui.react.theme=calm',
            },
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: {
              selected_backend: 'os-keychain',
              default_backend: 'os-keychain',
              index_path: '/Users/test/.repo-ai-governor/secret-index.json',
            },
            checks: [
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      return {
        command_result: {
          details: {
            records: 'openai/api-key@os-keychain:present',
          },
        },
      };
    });

    const runtime = new VsCodeExtensionServiceRuntime({
      embeddedCliExecutor,
    });

    await expect(runtime.resolveSecureAuthoringSnapshot()).resolves.toEqual({
      degradedReason: 'transient secure-authoring failure',
    });
    await expect(runtime.resolveSecureAuthoringSnapshot()).resolves.toEqual({
      userConfig: {
        configPath: '/Users/test/.repo-ai-governor/user-config.yaml',
        configExists: true,
        legacyPreferencePath: '/Users/test/.repo-ai-governor/cli-preferences.yaml',
        legacyPreferenceExists: false,
        entries: [
          {
            keyPath: 'ui.react.theme',
            value: 'calm',
          },
        ],
      },
      secretReadiness: {
        selectedBackendId: 'os-keychain',
        defaultBackendId: 'os-keychain',
        indexPath: '/Users/test/.repo-ai-governor/secret-index.json',
        backends: [
          {
            backendId: 'os-keychain',
            available: true,
            detail: 'Ready',
          },
        ],
        records: [
          {
            keyName: 'openai/api-key',
            backendId: 'os-keychain',
            exists: true,
          },
        ],
        configuredCredentialRefs: [],
        unresolvedCredentialRefs: [],
      },
    });

    expect(statusAttempt).toBe(2);
  });

  it('writes user defaults and managed secrets through the embedded CLI bridge without putting secrets on argv', async () => {
    const embeddedCliExecutor = vi
      .fn()
      .mockResolvedValueOnce({
        message: 'config updated',
        command_result: {
          details: {
            config_path: '/Users/test/.repo-ai-governor/user-config.yaml',
            value: 'tool_managed',
          },
        },
      })
      .mockResolvedValueOnce({
        message: 'secret updated',
        command_result: {
          details: {
            selector: 'secret://openai/api-key',
            backend: 'os-keychain',
          },
        },
      });

    const runtime = new VsCodeExtensionServiceRuntime({
      embeddedCliExecutor,
    });

    await expect(
      runtime.setUserConfigValue('workspace.mode_preference', 'tool_managed'),
    ).resolves.toEqual({
      message: 'config updated',
      configPath: '/Users/test/.repo-ai-governor/user-config.yaml',
      persistedValue: 'tool_managed',
    });
    await expect(
      runtime.setManagedSecret('openai/api-key', 'sk-managed-secret', 'os-keychain'),
    ).resolves.toEqual({
      message: 'secret updated',
      selector: 'secret://openai/api-key',
      backendId: 'os-keychain',
      warning: undefined,
    });

    expect(embeddedCliExecutor).toHaveBeenNthCalledWith(1, {
      args: ['config', 'set', 'workspace.mode_preference', 'tool_managed'],
      currentWorkingDirectory: '/repo',
    });
    expect(embeddedCliExecutor).toHaveBeenNthCalledWith(2, {
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: 'sk-managed-secret',
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
    ).resolves.toMatchObject({
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
