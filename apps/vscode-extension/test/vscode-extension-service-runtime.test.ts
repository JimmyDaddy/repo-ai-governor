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
  OrchestrationSessionEventType,
  OrchestrationSessionRouteId,
  OrchestrationSessionStatus,
  OrchestrationWorkbenchBacklinkKind,
  OrchestrationWorkspaceOperationKind,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, MemoryStoreEngine, RuntimeError } from '@repo-ai-governor/shared';

const serviceClientMock = vi.hoisted(() => ({
  construct: vi.fn(),
  getHealth: vi.fn(),
  getExecution: vi.fn(),
  queryExecutionBoard: vi.fn(),
  queryHitlInbox: vi.fn(),
  queryRoleLaneStatus: vi.fn(),
  querySessionContinuity: vi.fn(),
  queryHitlDecisionPacket: vi.fn(),
  queryQueueOverview: vi.fn(),
  queryArtifactPane: vi.fn(),
  queryBootstrapReadiness: vi.fn(),
  querySecureAuthoring: vi.fn(),
  queryProviderOnboarding: vi.fn(),
  queryWorkflowDraftSession: vi.fn(),
  startWorkflowDraft: vi.fn(),
  updateWorkflowDraftNode: vi.fn(),
  updateWorkflowDraftEdge: vi.fn(),
  updateWorkflowDraftPolicy: vi.fn(),
  validateWorkflowDraft: vi.fn(),
  commitWorkflowDraft: vi.fn(),
  startSession: vi.fn(),
  sendSessionTurn: vi.fn(),
  subscribeSession: vi.fn(),
  getSession: vi.fn(),
  resumeSession: vi.fn(),
  setUserConfigValue: vi.fn(),
  setManagedSecret: vi.fn(),
  applyProviderOnboarding: vi.fn(),
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

vi.mock('vscode', () => ({
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
}));

vi.mock('@repo-ai-governor/core-orchestration-service/sidecar-client', () => ({
  LocalOrchestrationServiceSidecarClient: class LocalOrchestrationServiceSidecarClient {
    public constructor(
      workspaceRoot: string,
      dependencies?: { repositoryRoot?: string; env?: NodeJS.ProcessEnv },
    ) {
      serviceClientMock.construct(workspaceRoot, dependencies);
    }

    public readonly getHealth = serviceClientMock.getHealth;
    public readonly getExecution = serviceClientMock.getExecution;
    public readonly queryExecutionBoard = serviceClientMock.queryExecutionBoard;
    public readonly queryHitlInbox = serviceClientMock.queryHitlInbox;
    public readonly queryRoleLaneStatus = serviceClientMock.queryRoleLaneStatus;
    public readonly querySessionContinuity = serviceClientMock.querySessionContinuity;
    public readonly queryHitlDecisionPacket = serviceClientMock.queryHitlDecisionPacket;
    public readonly queryQueueOverview = serviceClientMock.queryQueueOverview;
    public readonly queryArtifactPane = serviceClientMock.queryArtifactPane;
    public readonly queryBootstrapReadiness = serviceClientMock.queryBootstrapReadiness;
    public readonly querySecureAuthoring = serviceClientMock.querySecureAuthoring;
    public readonly queryProviderOnboarding = serviceClientMock.queryProviderOnboarding;
    public readonly queryWorkflowDraftSession = serviceClientMock.queryWorkflowDraftSession;
    public readonly startWorkflowDraft = serviceClientMock.startWorkflowDraft;
    public readonly updateWorkflowDraftNode = serviceClientMock.updateWorkflowDraftNode;
    public readonly updateWorkflowDraftEdge = serviceClientMock.updateWorkflowDraftEdge;
    public readonly updateWorkflowDraftPolicy = serviceClientMock.updateWorkflowDraftPolicy;
    public readonly validateWorkflowDraft = serviceClientMock.validateWorkflowDraft;
    public readonly commitWorkflowDraft = serviceClientMock.commitWorkflowDraft;
    public readonly startSession = serviceClientMock.startSession;
    public readonly sendSessionTurn = serviceClientMock.sendSessionTurn;
    public readonly subscribeSession = serviceClientMock.subscribeSession;
    public readonly getSession = serviceClientMock.getSession;
    public readonly resumeSession = serviceClientMock.resumeSession;
    public readonly setUserConfigValue = serviceClientMock.setUserConfigValue;
    public readonly setManagedSecret = serviceClientMock.setManagedSecret;
    public readonly applyProviderOnboarding = serviceClientMock.applyProviderOnboarding;
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
    serviceClientMock.queryRoleLaneStatus.mockReset();
    serviceClientMock.querySessionContinuity.mockReset();
    serviceClientMock.queryHitlDecisionPacket.mockReset();
    serviceClientMock.queryQueueOverview.mockReset();
    serviceClientMock.queryArtifactPane.mockReset();
    serviceClientMock.queryBootstrapReadiness.mockReset();
    serviceClientMock.querySecureAuthoring.mockReset();
    serviceClientMock.queryProviderOnboarding.mockReset();
    serviceClientMock.queryWorkflowDraftSession.mockReset();
    serviceClientMock.startWorkflowDraft.mockReset();
    serviceClientMock.updateWorkflowDraftNode.mockReset();
    serviceClientMock.updateWorkflowDraftEdge.mockReset();
    serviceClientMock.updateWorkflowDraftPolicy.mockReset();
    serviceClientMock.validateWorkflowDraft.mockReset();
    serviceClientMock.commitWorkflowDraft.mockReset();
    serviceClientMock.startSession.mockReset();
    serviceClientMock.sendSessionTurn.mockReset();
    serviceClientMock.subscribeSession.mockReset();
    serviceClientMock.getSession.mockReset();
    serviceClientMock.resumeSession.mockReset();
    serviceClientMock.setUserConfigValue.mockReset();
    serviceClientMock.setManagedSecret.mockReset();
    serviceClientMock.applyProviderOnboarding.mockReset();
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

  it('falls back to getSession when the session-continuity query throws', async () => {
    serviceClientMock.querySessionContinuity.mockRejectedValueOnce(
      new RuntimeError(GovernorErrorCode.UNKNOWN, 'session continuity query failed', {
        surface: 'vscode_extension_test',
      }),
    );
    serviceClientMock.getSession.mockResolvedValueOnce({
      sessionId: 'session-fallback',
      status: OrchestrationSessionStatus.ACTIVE,
      currentRouteId: OrchestrationSessionRouteId.MAIN,
      latestTurnId: 'turn-fallback',
      latestEventSequence: 12,
      nextCursor: 'cursor-fallback',
      openedAt: '2026-04-22T00:00:00.000Z',
      eventCount: 12,
      context: {},
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.querySessionContinuity('session-fallback')).resolves.toEqual({
      sessionId: 'session-fallback',
      sessionStatus: OrchestrationSessionStatus.ACTIVE,
      currentRouteId: OrchestrationSessionRouteId.MAIN,
      latestTurnId: 'turn-fallback',
      latestEventSequence: 12,
      nextCursor: 'cursor-fallback',
      resumeSelector: 'session-fallback',
    });
    expect(serviceClientMock.getSession).toHaveBeenCalledWith('session-fallback');
  });

  it('keeps draft-session queries soft for backend refresh failures but surfaces durable draft corruption', async () => {
    serviceClientMock.queryWorkflowDraftSession.mockRejectedValueOnce(
      new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'draft query failed',
        {
          surface: 'vscode_extension_test',
        },
      ),
    );

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(
      runtime.queryWorkflowDraftSession({
        workflowDraftId: 'workflow-draft-soft',
      }),
    ).resolves.toBeUndefined();

    serviceClientMock.queryWorkflowDraftSession.mockRejectedValueOnce(
      new RuntimeError(
        GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED,
        'persisted draft session is corrupted',
        {
          artifactPath:
            '/repo/.repo-ai-governor/context/workflow/draft-sessions/direct-workbench.active.json',
        },
      ),
    );

    await expect(
      runtime.queryWorkflowDraftSession({
        workflowDraftId: 'workflow-draft-corrupt',
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED,
      message: 'persisted draft session is corrupted',
    });

    serviceClientMock.queryWorkflowDraftSession.mockRejectedValueOnce(
      new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'draft query failed',
        {
          surface: 'vscode_extension_test',
        },
      ),
    );

    await expect(
      runtime.queryWorkflowDraftSessionStrict({
        workflowDraftId: 'workflow-draft-strict',
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
      message: 'draft query failed',
    });
  });

  it('falls back through executionId to reconstruct session continuity for older sidecars', async () => {
    serviceClientMock.querySessionContinuity.mockRejectedValueOnce(
      new RuntimeError(GovernorErrorCode.UNKNOWN, 'session continuity query failed', {
        surface: 'vscode_extension_test',
      }),
    );
    serviceClientMock.getExecution.mockResolvedValueOnce({
      executionId: 'execution-fallback',
      executionSessionId: 'session-from-execution',
      processId: 'process-fallback',
      workspaceId: 'workspace-fallback',
      workspaceRoot: '/repo',
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-fallback',
      serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
      serviceTransportKind: OrchestrationServiceTransportKind.IPC,
      status: OrchestrationExecutionStatus.RUNNING,
      checkpointCapable: true,
      recoveryCapable: true,
      acceptedAt: '2026-04-22T00:00:00.000Z',
      updatedAt: '2026-04-22T00:05:00.000Z',
      pendingHitl: false,
    });
    serviceClientMock.getSession.mockResolvedValueOnce({
      sessionId: 'session-from-execution',
      status: OrchestrationSessionStatus.ACTIVE,
      currentRouteId: OrchestrationSessionRouteId.MAIN,
      latestTurnId: 'turn-fallback-execution',
      latestEventSequence: 18,
      nextCursor: 'cursor-fallback-execution',
      openedAt: '2026-04-22T00:00:00.000Z',
      eventCount: 18,
      context: {},
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.querySessionContinuity(undefined, 'execution-fallback')).resolves.toEqual({
      sessionId: 'session-from-execution',
      sessionStatus: OrchestrationSessionStatus.ACTIVE,
      currentRouteId: OrchestrationSessionRouteId.MAIN,
      latestTurnId: 'turn-fallback-execution',
      latestEventSequence: 18,
      nextCursor: 'cursor-fallback-execution',
      resumeSelector: 'session-from-execution',
    });
    expect(serviceClientMock.getExecution).toHaveBeenCalledWith('execution-fallback');
    expect(serviceClientMock.getSession).toHaveBeenCalledWith('session-from-execution');
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

  it('localizes embedded CLI bootstrap failure copy from the active VS Code locale', () => {
    vscodeMock.state.language = 'zh-CN';
    const runtime = new VsCodeExtensionServiceRuntime();

    const zhBootstrapSource = (
      runtime as unknown as {
        renderEmbeddedCliBootstrapSource: (cliModulePath: string, failureMessage: string) => string;
        resolveEmbeddedCliBootstrapFailureMessage: () => string;
      }
    ).renderEmbeddedCliBootstrapSource(
      '/repo/node_modules/@repo-ai-governor/cli/dist/src/index.js',
      (
        runtime as unknown as {
          resolveEmbeddedCliBootstrapFailureMessage: () => string;
        }
      ).resolveEmbeddedCliBootstrapFailureMessage(),
    );

    expect(zhBootstrapSource).toContain('当前内嵌 CLI 模块未导出 runCli()。');
    expect(zhBootstrapSource).not.toContain('Embedded CLI module did not expose runCli().');
  });

  it('routes free-form chat turns through one extension-owned main session', async () => {
    serviceClientMock.startSession.mockResolvedValueOnce({
      session: {
        sessionId: 'session-main',
        status: OrchestrationSessionStatus.ACTIVE,
        currentRouteId: OrchestrationSessionRouteId.MAIN,
        latestTurnId: undefined,
        latestEventSequence: 0,
        nextCursor: 'cursor-0',
      },
    });
    serviceClientMock.sendSessionTurn.mockResolvedValueOnce({
      session: {
        sessionId: 'session-main',
      },
      turnId: 'turn-1',
      routeId: OrchestrationSessionRouteId.MAIN,
    });
    serviceClientMock.subscribeSession.mockResolvedValueOnce({
      events: [
        {
          sequence: 1,
          sessionId: 'session-main',
          turnId: 'turn-1',
          routeId: OrchestrationSessionRouteId.MAIN,
          type: OrchestrationSessionEventType.TURN_COMPLETED,
          streamCursor: 'cursor-1',
          payload: {
            assistantMessage: '## Workspace status\n\n- ready',
            responseMode: 'answer',
            interactionMode: 'direct_answer',
            executionIntent: 'session.answer',
            selectedSurface: 'codex',
            selectedBy: 'session.main.answer.primary',
          },
        },
      ],
      latestEventSequence: 1,
      nextCursor: 'cursor-1',
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.executeMainSessionTurn('what can you do?')).resolves.toMatchObject({
      sessionId: 'session-main',
      turnId: 'turn-1',
      assistantMessage: '## Workspace status\n\n- ready',
      responseMode: 'answer',
      interactionMode: 'direct_answer',
      executionIntent: 'session.answer',
      selectedSurface: 'codex',
      selectedBy: 'session.main.answer.primary',
    });
    expect(serviceClientMock.startSession).toHaveBeenCalledWith({
      routeId: OrchestrationSessionRouteId.MAIN,
      initialContext: {
        surface: 'vscode_extension_chat',
      },
    });
    expect(serviceClientMock.sendSessionTurn).toHaveBeenCalledWith({
      sessionId: 'session-main',
      routeId: OrchestrationSessionRouteId.MAIN,
      userMessage: 'what can you do?',
      metadata: {
        locale: 'en-US',
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

  it('projects provider lifecycle snapshots into the workbench overview without inventing new readiness truth', async () => {
    serviceClientMock.queryExecutionBoard.mockResolvedValueOnce({
      executions: [],
      returnedCount: 0,
      totalMatchedCount: 0,
    });
    serviceClientMock.queryQueueOverview.mockResolvedValueOnce({
      generatedAt: '2026-04-20T18:00:00.000Z',
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
    serviceClientMock.querySecureAuthoring.mockResolvedValueOnce({
      userConfig: {
        configPath: '/Users/test/.repo-ai-governor/user-config.yaml',
        configExists: true,
        legacyPreferencePath: '/Users/test/.repo-ai-governor/cli-preferences.yaml',
        legacyPreferenceExists: false,
        entries: [
          {
            keyPath: 'tools.codex.remoteApi.provider',
            value: 'openai',
          },
          {
            keyPath: 'tools.codex.remoteApi.model',
            value: 'gpt-5.4',
          },
          {
            keyPath: 'tools.codex.remoteApi.credentialRef',
            value: 'secret://openai/api-key',
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
        configuredCredentialRefs: ['secret://openai/api-key'],
        unresolvedCredentialRefs: [],
      },
    });
    serviceClientMock.queryProviderOnboarding.mockResolvedValueOnce({
      surfaceId: 'vscode_provider_onboarding',
      entrypointKind: 'overview_cta',
      mutationMode: 'explicit_provider_onboarding_command',
      tool: 'codex',
      transport: 'remote_api',
      provider: 'openai',
      vendorBinding: 'openai_responses',
      secretCaptureMode: 'host_secure_prompt',
      secretOwner: 'governor_managed_secret_backend',
      credentialRefStrategy: 'provider_default_api_key',
      readinessProjectionSource: 'provider_onboarding_snapshot',
      configTargets: [
        'tools.codex.transport',
        'tools.codex.remoteApi.provider',
        'tools.codex.remoteApi.vendorBinding',
        'tools.codex.remoteApi.model',
        'tools.codex.remoteApi.endpoint',
        'tools.codex.remoteApi.credentialRef',
      ],
      receiptFields: [
        'tool',
        'provider',
        'credentialRef',
        'secretBackend',
        'warnings',
        'nextAction',
      ],
      credentialRef: 'secret://openai/api-key',
      model: 'gpt-5.4',
      defaultBackendId: 'os-keychain',
      availableBackends: [
        {
          backendId: 'os-keychain',
          available: true,
          detail: 'Ready',
        },
      ],
      warnings: [],
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.resolveWorkbenchOverviewSnapshot({})).resolves.toMatchObject({
      providerLifecycleSnapshots: [
        {
          tool: 'codex',
          provider: 'openai',
          status: 'ready',
          preferredBackendId: 'os-keychain',
          configuredCredentialRef: true,
          configuredModel: true,
          credentialResolved: true,
          availableActions: ['update_api_key', 'reconnect_provider'],
          readinessProjectionSource: 'provider_onboarding_snapshot',
        },
      ],
    });
    expect(serviceClientMock.queryProviderOnboarding).toHaveBeenCalledWith({
      tool: 'codex',
      entrypointKind: 'overview_cta',
      locale: 'en-US',
    });
  });

  it('marks provider lifecycle as degraded when the preferred backend only remains available with warnings', async () => {
    serviceClientMock.querySecureAuthoring.mockResolvedValueOnce({
      userConfig: {
        configPath: '/Users/test/.repo-ai-governor/user-config.yaml',
        configExists: true,
        legacyPreferencePath: '/Users/test/.repo-ai-governor/cli-preferences.yaml',
        legacyPreferenceExists: false,
        entries: [
          {
            keyPath: 'tools.codex.remoteApi.model',
            value: 'gpt-5.4',
          },
          {
            keyPath: 'tools.codex.remoteApi.credentialRef',
            value: 'secret://openai/api-key',
          },
        ],
      },
      secretReadiness: {
        selectedBackendId: 'unsafe-local-file',
        defaultBackendId: 'unsafe-local-file',
        indexPath: '/Users/test/.repo-ai-governor/secret-index.json',
        backends: [
          {
            backendId: 'unsafe-local-file',
            available: true,
            detail: 'Local plaintext',
            warning: 'plaintext fallback',
          },
        ],
        records: [
          {
            keyName: 'openai/api-key',
            backendId: 'unsafe-local-file',
            exists: true,
          },
        ],
        configuredCredentialRefs: ['secret://openai/api-key'],
        unresolvedCredentialRefs: [],
      },
    });
    serviceClientMock.queryProviderOnboarding.mockResolvedValueOnce({
      surfaceId: 'vscode_provider_onboarding',
      entrypointKind: 'overview_cta',
      mutationMode: 'explicit_provider_onboarding_command',
      tool: 'codex',
      transport: 'remote_api',
      provider: 'openai',
      vendorBinding: 'openai_responses',
      secretCaptureMode: 'host_secure_prompt',
      secretOwner: 'governor_managed_secret_backend',
      credentialRefStrategy: 'provider_default_api_key',
      readinessProjectionSource: 'provider_onboarding_snapshot',
      configTargets: [
        'tools.codex.transport',
        'tools.codex.remoteApi.provider',
        'tools.codex.remoteApi.vendorBinding',
        'tools.codex.remoteApi.model',
        'tools.codex.remoteApi.endpoint',
        'tools.codex.remoteApi.credentialRef',
      ],
      receiptFields: [
        'tool',
        'provider',
        'credentialRef',
        'secretBackend',
        'warnings',
        'nextAction',
      ],
      credentialRef: 'secret://openai/api-key',
      model: 'gpt-5.4',
      defaultBackendId: 'unsafe-local-file',
      selectedBackendId: 'unsafe-local-file',
      availableBackends: [
        {
          backendId: 'unsafe-local-file',
          available: true,
          detail: 'Local plaintext',
          warning: 'plaintext fallback',
        },
      ],
      warnings: ['plaintext fallback'],
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.resolveProviderLifecycleSnapshots()).resolves.toEqual([
      expect.objectContaining({
        tool: 'codex',
        status: 'degraded',
        preferredBackendId: 'unsafe-local-file',
        availableActions: ['run_doctor', 'update_api_key'],
        degradedReason: 'plaintext fallback',
      }),
    ]);
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
      expect.objectContaining({
        repositoryRoot: '/repo',
        env: expect.objectContaining({
          REPO_AI_GOVERNOR_LOCAL_ORCHESTRATION_LOCALE: 'en-US',
        }),
      }),
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
    serviceClientMock.queryRoleLaneStatus.mockResolvedValueOnce({
      generatedAt: '2026-04-07T03:06:00.000Z',
      lanes: [
        {
          roleId: 'reviewer-default',
          executionId: 'execution-1',
          sessionId: 'session-1',
          currentStageId: 'review_verify',
          status: 'waiting_for_hitl',
          latestEventType: 'hitl.required',
          updatedAt: '2026-04-07T03:10:00.000Z',
          pendingHitl: true,
          artifactBacklinks: [
            {
              backlinkId: 'execution-1:artifact:1',
              backlinkKind: 'artifact',
              label: '/repo/.repo-ai-governor/context/review.md',
              target: '/repo/.repo-ai-governor/context/review.md',
            },
          ],
          reviewBacklinks: [
            {
              backlinkId: 'execution-1:review:1',
              backlinkKind: 'review',
              label: '/repo/.repo-ai-governor/review/resolved.md',
              target: '/repo/.repo-ai-governor/review/resolved.md',
            },
          ],
        },
      ],
      returnedCount: 1,
      totalMatchedCount: 1,
    });
    serviceClientMock.querySessionContinuity.mockResolvedValueOnce({
      sessionId: 'session-1',
      status: OrchestrationSessionStatus.ACTIVE,
      sessionStatus: OrchestrationSessionStatus.ACTIVE,
      currentRouteId: 'workflow_authoring',
      latestTurnId: 'turn-1',
      latestEventSequence: 5,
      nextCursor: 'cursor-session-1',
      resumeSelector: 'session-1',
    });
    serviceClientMock.queryHitlDecisionPacket.mockResolvedValueOnce({
      executionId: 'execution-1',
      executionSessionId: 'session-1',
      taskId: 'TK-940',
      reviewId: 'review-1',
      riskFacts: [
        {
          riskId: 'execution-1:risk-hitl-pending',
          riskCategory: 'hitl-decision-pending',
          riskLevel: 'L2',
          evidence: ['execution_id=execution-1'],
          changeScope: 'TK-940',
          confidence: 0.86,
          triggerRule: 'runtime-hitl-pending',
        },
      ],
      policyAction: 'confirm',
      slaDeadlineAt: '2026-04-07T07:06:00.000Z',
      defaultTimeoutAction: 'block',
      allowedDecisions: [
        {
          optionId: 'execution-1:hitl:approve-resume',
          decision: 'approve',
          resumeAction: 'resume',
        },
      ],
      impactSummary: 'Execution execution-1 is waiting on one HITL decision for TK-940.',
      backlinks: [
        {
          backlinkId: 'execution-1:review:1',
          backlinkKind: 'review',
          label: '/repo/.repo-ai-governor/review/resolved.md',
          target: '/repo/.repo-ai-governor/review/resolved.md',
        },
      ],
    });
    serviceClientMock.queryWorkflowDraftSession.mockResolvedValueOnce({
      workflowDraftId: 'workflow-draft-001',
      draftRevision: 'draft-revision-001',
      baseDefinitionRevision: 'base-revision-001',
      templateId: 'starter-template',
      entryMode: 'edit_seed',
      nodeSpecs: [],
      edgeSpecs: [],
      supportedPatchOps: ['upsert_node', 'remove_node', 'upsert_edge', 'remove_edge'],
      validationIssues: [],
      conflictState: {
        hasConflict: false,
        conflictKind: 'none',
        detectedAt: '2026-04-07T03:06:30.000Z',
      },
      compiledIrPreview: {
        processId: 'process-1',
        entryNodeId: 'entry-node',
        compiledAt: '2026-04-07T03:06:30.000Z',
        nodeCount: 0,
        edgeCount: 0,
        compileWarningCount: 0,
        compileErrorCount: 0,
        compileWarnings: [],
        compileErrors: [],
      },
      backlinkArtifacts: [],
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(
      runtime.resolveWorkflowStudioSnapshot({
        executionId: 'execution-1',
        reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
        workflowFocusStageId: 'review_verify',
        workflowFocusBacklinkTarget: '/repo/.repo-ai-governor/review/resolved.md',
        workflowFocusBacklinkKind: OrchestrationWorkbenchBacklinkKind.REVIEW,
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
      workflowDraftSession: {
        workflowDraftId: 'workflow-draft-001',
        draftRevision: 'draft-revision-001',
        entryMode: 'edit_seed',
      },
      workflowFocusStageId: 'review_verify',
      workflowFocusBacklinkTarget: '/repo/.repo-ai-governor/review/resolved.md',
      workflowFocusBacklinkKind: OrchestrationWorkbenchBacklinkKind.REVIEW,
      roleLaneStatus: {
        returnedCount: 1,
      },
      artifactPane: {
        reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
      },
      sessionContinuity: {
        sessionId: 'session-1',
        sessionStatus: OrchestrationSessionStatus.ACTIVE,
        currentRouteId: 'workflow_authoring',
        latestTurnId: 'turn-1',
        latestEventSequence: 5,
        nextCursor: 'cursor-session-1',
        resumeSelector: 'session-1',
      },
      hitlDecisionPacket: {
        executionId: 'execution-1',
        policyAction: 'confirm',
        defaultTimeoutAction: 'block',
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
      status: OrchestrationSessionStatus.ACTIVE,
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
        sessionStatus: OrchestrationSessionStatus.ACTIVE,
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
    serviceClientMock.queryProviderOnboarding.mockResolvedValueOnce({
      surfaceId: 'vscode_provider_onboarding',
      entrypointKind: 'quick_pick_form',
      mutationMode: 'explicit_provider_onboarding_command',
      tool: 'codex',
      transport: 'remote_api',
      provider: 'openai',
      vendorBinding: 'openai_responses',
      secretCaptureMode: 'host_secure_prompt',
      secretOwner: 'governor_managed_secret_backend',
      credentialRefStrategy: 'provider_default_api_key',
      readinessProjectionSource: 'provider_onboarding_snapshot',
      configTargets: [
        'tools.codex.transport',
        'tools.codex.remoteApi.provider',
        'tools.codex.remoteApi.vendorBinding',
        'tools.codex.remoteApi.model',
        'tools.codex.remoteApi.endpoint',
        'tools.codex.remoteApi.credentialEnvVar',
        'tools.codex.remoteApi.credentialRef',
      ],
      receiptFields: [
        'tool',
        'provider',
        'credentialRef',
        'secretBackend',
        'warnings',
        'nextAction',
      ],
      credentialRef: 'secret://openai/api-key',
      defaultBackendId: 'os-keychain',
      availableBackends: [
        {
          backendId: 'os-keychain',
          available: true,
          detail: 'ready',
        },
      ],
      warnings: [],
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
    serviceClientMock.applyProviderOnboarding.mockResolvedValueOnce({
      surfaceId: 'vscode_provider_onboarding',
      entrypointKind: 'quick_pick_form',
      mutationMode: 'explicit_provider_onboarding_command',
      tool: 'codex',
      transport: 'remote_api',
      provider: 'openai',
      vendorBinding: 'openai_responses',
      credentialRef: 'secret://openai/api-key',
      secretBackend: 'os-keychain',
      configTargets: [
        'tools.codex.transport',
        'tools.codex.remoteApi.provider',
        'tools.codex.remoteApi.vendorBinding',
        'tools.codex.remoteApi.model',
        'tools.codex.remoteApi.credentialEnvVar',
        'tools.codex.remoteApi.credentialRef',
      ],
      receiptFields: [
        'tool',
        'provider',
        'credentialRef',
        'secretBackend',
        'warnings',
        'nextAction',
      ],
      warnings: ['仅限本地使用'],
      nextAction: 'repoAiGovernor.runConnect',
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
    await expect(
      runtime.resolveProviderOnboardingSnapshot('codex' as never, 'quick_pick_form'),
    ).resolves.toEqual({
      surfaceId: 'vscode_provider_onboarding',
      entrypointKind: 'quick_pick_form',
      mutationMode: 'explicit_provider_onboarding_command',
      tool: 'codex',
      transport: 'remote_api',
      provider: 'openai',
      vendorBinding: 'openai_responses',
      secretCaptureMode: 'host_secure_prompt',
      secretOwner: 'governor_managed_secret_backend',
      credentialRefStrategy: 'provider_default_api_key',
      readinessProjectionSource: 'provider_onboarding_snapshot',
      configTargets: [
        'tools.codex.transport',
        'tools.codex.remoteApi.provider',
        'tools.codex.remoteApi.vendorBinding',
        'tools.codex.remoteApi.model',
        'tools.codex.remoteApi.endpoint',
        'tools.codex.remoteApi.credentialEnvVar',
        'tools.codex.remoteApi.credentialRef',
      ],
      receiptFields: [
        'tool',
        'provider',
        'credentialRef',
        'secretBackend',
        'warnings',
        'nextAction',
      ],
      credentialRef: 'secret://openai/api-key',
      defaultBackendId: 'os-keychain',
      availableBackends: [
        {
          backendId: 'os-keychain',
          available: true,
          detail: 'ready',
        },
      ],
      warnings: [],
    });
    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        provider: 'openai' as never,
        model: 'gpt-5.4',
        apiKey: 'sk-managed-secret',
      }),
    ).resolves.toEqual({
      surfaceId: 'vscode_provider_onboarding',
      entrypointKind: 'quick_pick_form',
      mutationMode: 'explicit_provider_onboarding_command',
      tool: 'codex',
      transport: 'remote_api',
      provider: 'openai',
      vendorBinding: 'openai_responses',
      credentialRef: 'secret://openai/api-key',
      secretBackend: 'os-keychain',
      configTargets: [
        'tools.codex.transport',
        'tools.codex.remoteApi.provider',
        'tools.codex.remoteApi.vendorBinding',
        'tools.codex.remoteApi.model',
        'tools.codex.remoteApi.credentialEnvVar',
        'tools.codex.remoteApi.credentialRef',
      ],
      receiptFields: [
        'tool',
        'provider',
        'credentialRef',
        'secretBackend',
        'warnings',
        'nextAction',
      ],
      warnings: ['仅限本地使用'],
      nextAction: 'repoAiGovernor.runConnect',
    });

    expect(serviceClientMock.querySecureAuthoring).toHaveBeenCalledWith({
      locale: 'zh-CN',
    });
    expect(serviceClientMock.queryProviderOnboarding).toHaveBeenCalledWith({
      tool: 'codex',
      entrypointKind: 'quick_pick_form',
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
    expect(serviceClientMock.applyProviderOnboarding).toHaveBeenCalledWith({
      tool: 'codex',
      entrypointKind: 'quick_pick_form',
      provider: 'openai',
      model: 'gpt-5.4',
      apiKey: 'sk-managed-secret',
      locale: 'zh-CN',
    });
  });

  it('builds provider-onboarding snapshot and receipt through the embedded secure-authoring seam', async () => {
    const embeddedCliExecutor = vi
      .fn()
      .mockResolvedValueOnce({
        command_result: {
          details: {
            config_path: '/Users/test/.repo-ai-governor/user-config.yaml',
            config_exists: true,
            legacy_preference_path: '/Users/test/.repo-ai-governor/cli-preferences.yaml',
            legacy_preference_exists: false,
          },
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            entries:
              'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-5.4 | tools.codex.remoteApi.credentialRef=secret://openai/api-key',
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
          ],
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            records: 'openai/api-key@os-keychain:missing',
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
      })
      .mockResolvedValueOnce({
        message: 'config updated',
        command_result: {
          details: {
            value: 'remote_api',
          },
        },
      })
      .mockResolvedValueOnce({
        message: 'config updated',
        command_result: {
          details: {
            value: 'openai',
          },
        },
      })
      .mockResolvedValueOnce({
        message: 'config updated',
        command_result: {
          details: {
            value: 'openai_responses',
          },
        },
      })
      .mockResolvedValueOnce({
        message: 'config updated',
        command_result: {
          details: {
            value: 'gpt-5.5',
          },
        },
      })
      .mockResolvedValueOnce({
        message: 'config updated',
        command_result: {
          details: {
            value: 'secret://openai/api-key',
          },
        },
      })
      .mockResolvedValueOnce({
        message: 'config cleared',
        command_result: {
          details: {},
        },
      });

    const runtime = new VsCodeExtensionServiceRuntime({
      embeddedCliExecutor,
    });

    await expect(
      runtime.resolveProviderOnboardingSnapshot('codex' as never, 'quick_pick_form'),
    ).resolves.toMatchObject({
      tool: 'codex',
      provider: 'openai',
      transport: 'remote_api',
      credentialRef: 'secret://openai/api-key',
      model: 'gpt-5.4',
      selectedBackendId: 'os-keychain',
      defaultBackendId: 'os-keychain',
    });
    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: 'sk-live',
      }),
    ).resolves.toMatchObject({
      tool: 'codex',
      provider: 'openai',
      secretBackend: 'os-keychain',
      nextAction: 'repoAiGovernor.runConnect',
    });
    expect(embeddedCliExecutor).toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: 'sk-live',
    });
    expect(embeddedCliExecutor).toHaveBeenCalledWith({
      args: ['config', 'set', 'tools.codex.transport', 'remote_api'],
      currentWorkingDirectory: '/repo',
    });
    expect(embeddedCliExecutor).toHaveBeenCalledWith({
      args: ['config', 'unset', 'tools.codex.remoteApi.credentialEnvVar'],
      currentWorkingDirectory: '/repo',
    });
  });

  it('prefers defaultBackendId over selectedBackendId when embedded onboarding omits an explicit backend override', async () => {
    const embeddedCliExecutor = vi
      .fn()
      .mockResolvedValueOnce({
        command_result: {
          details: {
            config_path: '/Users/test/.repo-ai-governor/user-config.yaml',
            config_exists: true,
            legacy_preference_path: '/Users/test/.repo-ai-governor/cli-preferences.yaml',
            legacy_preference_exists: false,
          },
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            entries:
              'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-5.4 | tools.codex.remoteApi.credentialRef=secret://openai/api-key',
          },
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            selected_backend: 'unsafe-local-file',
            default_backend: 'os-keychain',
            index_path: '/Users/test/.repo-ai-governor/secret-index.json',
          },
          checks: [
            {
              id: 'secret_backend_unsafe-local-file',
              status: 'pass',
              detail: 'Local plaintext',
            },
            {
              id: 'secret_backend_os-keychain',
              status: 'pass',
              detail: 'Ready',
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            records: 'openai/api-key@os-keychain:missing',
          },
        },
      })
      .mockResolvedValue({
        message: 'config updated',
        command_result: {
          details: {
            value: 'remote_api',
          },
        },
      });

    const runtime = new VsCodeExtensionServiceRuntime({
      embeddedCliExecutor,
    });

    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: 'sk-live',
      }),
    ).resolves.toMatchObject({
      tool: 'codex',
      provider: 'openai',
      secretBackend: 'os-keychain',
    });

    expect(embeddedCliExecutor).toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: 'sk-live',
    });
  });

  it('reuses an existing managed secret during embedded direct provider onboarding without rewriting it', async () => {
    const embeddedCliExecutor = vi
      .fn()
      .mockResolvedValueOnce({
        command_result: {
          details: {
            config_path: '/Users/test/.repo-ai-governor/user-config.yaml',
            config_exists: true,
            legacy_preference_path: '/Users/test/.repo-ai-governor/cli-preferences.yaml',
            legacy_preference_exists: false,
          },
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            entries:
              'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-4o | tools.codex.remoteApi.credentialRef=secret://openai/api-key | tools.codex.remoteApi.credentialEnvVar=OPENAI_API_KEY',
          },
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            selected_backend: 'unsafe-local-file',
            default_backend: 'os-keychain',
            index_path: '/Users/test/.repo-ai-governor/secret-index.json',
          },
          checks: [
            {
              id: 'secret_backend_unsafe-local-file',
              status: 'pass',
              detail: 'Local plaintext',
            },
            {
              id: 'secret_backend_os-keychain',
              status: 'pass',
              detail: 'Ready',
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            records:
              'openai/api-key@unsafe-local-file:present | openai/api-key@os-keychain:present',
          },
        },
      })
      .mockResolvedValue({
        message: 'config updated',
        command_result: {
          details: {
            value: 'remote_api',
          },
        },
      });

    const runtime = new VsCodeExtensionServiceRuntime({
      embeddedCliExecutor,
    });

    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: '',
        reuseExistingCredential: true,
      }),
    ).resolves.toMatchObject({
      tool: 'codex',
      provider: 'openai',
      secretBackend: 'os-keychain',
      credentialRef: 'secret://openai/api-key',
    });

    expect(embeddedCliExecutor).not.toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: '',
    });
    expect(embeddedCliExecutor).toHaveBeenCalledWith({
      args: ['config', 'unset', 'tools.codex.remoteApi.credentialEnvVar'],
      currentWorkingDirectory: '/repo',
    });
  });

  it('clears one stale endpoint when embedded onboarding receives an explicit blank endpoint override', async () => {
    const embeddedCliExecutor = vi
      .fn()
      .mockResolvedValueOnce({
        command_result: {
          details: {
            config_path: '/Users/test/.repo-ai-governor/user-config.yaml',
            config_exists: true,
            legacy_preference_path: '/Users/test/.repo-ai-governor/cli-preferences.yaml',
            legacy_preference_exists: false,
          },
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            entries:
              'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-5.4 | tools.codex.remoteApi.credentialRef=secret://openai/api-key | tools.codex.remoteApi.endpoint=https://stale.example/v1',
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
          ],
        },
      })
      .mockResolvedValueOnce({
        command_result: {
          details: {
            records: 'openai/api-key@os-keychain:missing',
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
      })
      .mockResolvedValue({
        message: 'config updated',
        command_result: {
          details: {
            value: 'updated',
          },
        },
      });

    const runtime = new VsCodeExtensionServiceRuntime({
      embeddedCliExecutor,
    });

    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: 'sk-live',
        endpoint: '',
      }),
    ).resolves.toMatchObject({
      configTargets: expect.arrayContaining(['tools.codex.remoteApi.endpoint']),
    });

    expect(embeddedCliExecutor).toHaveBeenCalledWith({
      args: ['config', 'unset', 'tools.codex.remoteApi.endpoint'],
      currentWorkingDirectory: '/repo',
    });
  });

  it('falls back to defaultBackendId in the embedded onboarding path when the selected backend is unavailable', async () => {
    const embeddedCliExecutor = vi.fn(async (request: { args: readonly string[] }) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
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
              entries:
                'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-5.4 | tools.codex.remoteApi.credentialRef=secret://openai/api-key',
            },
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: {
              selected_backend: 'unsafe-local-file',
              default_backend: 'os-keychain',
              index_path: '/Users/test/.repo-ai-governor/secret-index.json',
            },
            checks: [
              {
                id: 'secret_backend_unsafe-local-file',
                status: 'fail',
                detail: 'disabled',
              },
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
            records: 'openai/api-key@os-keychain:missing',
          },
        },
      };
    });
    const runtime = new VsCodeExtensionServiceRuntime({
      embeddedCliExecutor,
    });

    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: 'sk-live',
      }),
    ).resolves.toMatchObject({
      tool: 'codex',
      provider: 'openai',
      secretBackend: 'os-keychain',
    });

    expect(embeddedCliExecutor).toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: 'sk-live',
    });
  });

  it('fails closed in the embedded onboarding path for unsupported tool/provider pairings', async () => {
    const embeddedCliExecutor = vi.fn(async (request: { args: readonly string[] }) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
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
              entries: '',
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
            records: '',
          },
        },
      };
    });
    const runtime = new VsCodeExtensionServiceRuntime({
      embeddedCliExecutor,
    });

    await expect(
      runtime.resolveProviderOnboardingSnapshot(
        'codex' as never,
        'quick_pick_form',
        'anthropic' as never,
      ),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
      message: 'Provider onboarding only supports provider openai for tool codex.',
    });
    await expect(
      runtime.resolveProviderOnboardingSnapshot(
        'claude-code' as never,
        'quick_pick_form',
        'openai' as never,
      ),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
      message: 'Provider onboarding only supports provider anthropic for tool claude-code.',
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

      expect(serviceClientMock.construct).toHaveBeenNthCalledWith(
        1,
        defaultWorkspaceRoot,
        expect.objectContaining({
          repositoryRoot,
          env: expect.objectContaining({
            REPO_AI_GOVERNOR_LOCAL_ORCHESTRATION_LOCALE: 'en-US',
          }),
        }),
      );
      expect(serviceClientMock.construct).toHaveBeenNthCalledWith(
        2,
        nextWorkspaceRoot,
        expect.objectContaining({
          repositoryRoot,
          env: expect.objectContaining({
            REPO_AI_GOVERNOR_LOCAL_ORCHESTRATION_LOCALE: 'en-US',
          }),
        }),
      );
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

      expect(serviceClientMock.construct).toHaveBeenCalledWith(
        customWorkspaceRoot,
        expect.objectContaining({
          repositoryRoot,
          env: expect.objectContaining({
            REPO_AI_GOVERNOR_LOCAL_ORCHESTRATION_LOCALE: 'en-US',
          }),
        }),
      );
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

      expect(serviceClientMock.construct).toHaveBeenCalledWith(
        expectedWorkspaceRoot,
        expect.objectContaining({
          repositoryRoot,
          env: expect.objectContaining({
            REPO_AI_GOVERNOR_LOCAL_ORCHESTRATION_LOCALE: 'en-US',
          }),
        }),
      );
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
