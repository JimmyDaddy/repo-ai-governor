import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

import * as vscode from 'vscode';

import {
  ConfigLoader,
  WorkspaceConfigDiscoveryService,
  WorkspaceResolver,
} from '@repo-ai-governor/config';
import { LocalOrchestrationServiceSidecarClient } from '@repo-ai-governor/core-orchestration-service/sidecar-client';
import type {
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationExecutionBoardEntry,
  OrchestrationExecutionBoardQueryResponse,
  OrchestrationExecutionSummary,
  OrchestrationGovernanceQueueEntry,
  OrchestrationHitlInboxEntry,
  OrchestrationHitlInboxQueryResponse,
  OrchestrationQueueOverviewQueryResponse,
  OrchestrationRecoverExecutionRequest,
  OrchestrationRecoverExecutionResponse,
  OrchestrationServiceHealthResponse,
  OrchestrationSubmitHitlDecisionRequest,
  OrchestrationSubmitHitlDecisionResponse,
  OrchestrationTerminateExecutionRequest,
  OrchestrationTerminateExecutionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import {
  OrchestrationClientSurface as OrchestrationClientSurfaceValue,
  OrchestrationGovernanceNotificationStatus as OrchestrationGovernanceNotificationStatusValue,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';
import {
  VSCODE_EXTENSION_DEFAULT_EXECUTION_LIMIT,
  VSCODE_EXTENSION_DEFAULT_LANE_LIMIT,
  VSCODE_EXTENSION_DEFAULT_QUEUE_LIMIT,
  VSCODE_EXTENSION_DEFAULT_WORKSPACE_SUMMARY_LIMIT,
} from '../constants/index.js';
import type {
  VsCodeExtensionReviewDetailSnapshot,
  VsCodeExtensionSecretBackendStatusSnapshot,
  VsCodeExtensionSecretReadinessSnapshot,
  VsCodeExtensionSecretRecordSnapshot,
  VsCodeExtensionSecureAuthoringSnapshot,
  VsCodeExtensionSelectionSnapshot,
  VsCodeExtensionServiceDiagnosticsSnapshot,
  VsCodeExtensionUserConfigEntrySnapshot,
  VsCodeExtensionUserConfigStatusSnapshot,
  VsCodeExtensionWorkbenchOverviewSnapshot,
  VsCodeExtensionWorkflowStudioSnapshot,
  VsCodeExtensionWorkspaceContextSnapshot,
} from '../types/index.js';

const EXECUTION_LOOKUP_LIMIT = 20;
const EMBEDDED_CLI_PACKAGE_SPECIFIER = '@repo-ai-governor/cli';
const DEFAULT_USER_CONFIG_ENTRY_DELIMITER = ' | ';
const DEFAULT_SECRET_RECORD_DELIMITER = ' | ';
const CREDENTIAL_SELECTOR_PREFIX = 'secret://';
const UNSAFE_LOCAL_FILE_SECRET_BACKEND_ID = 'unsafe-local-file';
const requireFromRuntime = createRequire(import.meta.url);

// oop-function-allowed: These fallback DTO builders are pure value factories that keep the
// service-owned catch branches concise without adding mutable state or orchestration behavior.
function createEmptyExecutionBoardResponse(): OrchestrationExecutionBoardQueryResponse {
  return {
    executions: [],
    returnedCount: 0,
    totalMatchedCount: 0,
  };
}

function createEmptyHitlInboxResponse(): OrchestrationHitlInboxQueryResponse {
  return {
    pendingDecisions: [],
    returnedCount: 0,
    totalMatchedCount: 0,
  };
}

function createEmptyQueueOverviewResponse(): OrchestrationQueueOverviewQueryResponse {
  return {
    generatedAt: '',
    automationInbox: [],
    reviewQueue: [],
    parallelLanes: [],
    workspaceSummary: [],
    temporaryBridges: [],
    notificationOwnership: {
      ownerSurface: OrchestrationClientSurfaceValue.DESKTOP,
      pendingItemCount: 0,
      dueSoonItemCount: 0,
      overdueItemCount: 0,
      activeWorkspaceCount: 0,
      defaultFollowUpSlaMinutes: 0,
      notificationStatus: OrchestrationGovernanceNotificationStatusValue.IDLE,
    },
  };
}

interface VsCodeExtensionServiceRuntimeDependencies {
  configLoader?: Pick<ConfigLoader, 'loadFromFile'>;
  workspaceResolver?: Pick<WorkspaceResolver, 'resolve'>;
  pathExists?: (path: string) => boolean;
  embeddedCliExecutor?: (request: VsCodeExtensionEmbeddedCliRequest) => Promise<unknown>;
}

interface VsCodeExtensionEmbeddedCliRequest {
  args: readonly string[];
  currentWorkingDirectory: string;
  stdin?: string;
}

interface VsCodeExtensionCliCommandSuccessPayload {
  message?: string;
  command_result?: {
    details?: Record<string, unknown>;
    checks?: Array<{
      id?: string;
      status?: string;
      detail?: string;
    }>;
    experience?: {
      interactionPrompts?: Array<{
        action?: string;
      }>;
    };
  };
}

/**
 * Owns lazy local-orchestration-service access for the VS Code extension host.
 *
 * Why this exists:
 * the extension must consume the same service-owned query/command seam as desktop without
 * importing CLI internals, building extension-only orchestration state, or recreating bridge
 * governance metadata outside the local orchestration service.
 */
export class VsCodeExtensionServiceRuntime {
  private clientPromise: Promise<LocalOrchestrationServiceSidecarClient> | null = null;
  private clientWorkspaceRoot: string | undefined;
  private clientRepositoryRoot: string | undefined;
  private readonly configLoader: Pick<ConfigLoader, 'loadFromFile'>;
  private readonly workspaceResolver: Pick<WorkspaceResolver, 'resolve'>;
  private readonly pathExists: (path: string) => boolean;
  private readonly embeddedCliExecutor: (
    request: VsCodeExtensionEmbeddedCliRequest,
  ) => Promise<unknown>;
  private readonly workspaceConfigDiscovery: Pick<
    WorkspaceConfigDiscoveryService,
    'loadRepositoryWorkspaceConfig'
  >;
  private secureAuthoringSnapshotPromise: Promise<VsCodeExtensionSecureAuthoringSnapshot> | null =
    null;
  private secureAuthoringRepositoryRoot: string | undefined;

  public constructor(dependencies: VsCodeExtensionServiceRuntimeDependencies = {}) {
    this.configLoader = dependencies.configLoader ?? new ConfigLoader();
    this.workspaceResolver = dependencies.workspaceResolver ?? new WorkspaceResolver();
    this.pathExists = dependencies.pathExists ?? existsSync;
    this.embeddedCliExecutor =
      dependencies.embeddedCliExecutor ?? this.executeEmbeddedCliCommand.bind(this);
    this.workspaceConfigDiscovery = new WorkspaceConfigDiscoveryService(
      this.configLoader,
      this.workspaceResolver,
      this.pathExists,
    );
  }

  /**
   * Returns the current workspace-root path used by the extension host.
   * @returns First workspace-folder path when available.
   */
  public getWorkspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  /**
   * Returns the display label for the current workspace.
   * @returns Workspace-folder name or a friendly empty-state label.
   */
  public getWorkspaceLabel(): string {
    return vscode.workspace.workspaceFolders?.[0]?.name ?? 'No Workspace';
  }

  /**
   * Builds one editor-local workspace context snapshot for extension views and chat.
   * @returns Current workspace + trust + active-editor facts.
   */
  public buildWorkspaceContextSnapshot(): VsCodeExtensionWorkspaceContextSnapshot {
    const activeEditor = vscode.window.activeTextEditor;
    const selection = activeEditor?.selection;
    const isMeaningfulSelection =
      selection &&
      !selection.isEmpty &&
      selection.start.line >= 0 &&
      selection.end.line >= selection.start.line;

    return {
      workspaceLabel: this.getWorkspaceLabel(),
      workspaceRoot: this.getWorkspaceRoot(),
      workspaceTrusted: vscode.workspace.isTrusted,
      ...(activeEditor?.document.uri.scheme === 'file'
        ? {
            activeEditorPath: activeEditor.document.uri.fsPath,
          }
        : {}),
      ...(isMeaningfulSelection
        ? {
            activeSelectionLabel: `L${selection.start.line + 1}:C${selection.start.character + 1} - L${selection.end.line + 1}:C${selection.end.character + 1}`,
          }
        : {}),
    };
  }

  /**
   * Resolves one workspace-context snapshot plus current service diagnostics when available.
   * @returns Current workspace/editor facts enriched with service-health metadata.
   */
  public async resolveWorkspaceContextSnapshot(): Promise<VsCodeExtensionWorkspaceContextSnapshot> {
    const workspaceContext = this.buildWorkspaceContextSnapshot();
    if (!workspaceContext.workspaceRoot) {
      return workspaceContext;
    }

    try {
      const health = await this.getHealth();
      if (!health) {
        return workspaceContext;
      }

      return {
        ...workspaceContext,
        serviceHealth: this.createServiceDiagnosticsSnapshot(health),
      };
    } catch {
      // Service-health diagnostics are additive; a transient probe failure must not blank the
      // editor-local workspace context that the extension can already render safely.
      return workspaceContext;
    }
  }

  /**
   * Queries the orchestration-owned execution-board read model.
   * @param limit Maximum number of executions to request.
   * @returns One service-owned execution-board payload, or an empty payload without a workspace.
   */
  public async queryExecutionBoard(
    limit = VSCODE_EXTENSION_DEFAULT_EXECUTION_LIMIT,
  ): Promise<OrchestrationExecutionBoardQueryResponse> {
    const client = await this.resolveClient();
    if (!client) {
      return createEmptyExecutionBoardResponse();
    }

    try {
      return await client.queryExecutionBoard({
        limit,
      });
    } catch {
      return createEmptyExecutionBoardResponse();
    }
  }

  /**
   * Queries the orchestration-owned HITL inbox read model.
   * @param limit Maximum number of HITL entries to request.
   * @returns One service-owned HITL payload, or an empty payload without a workspace.
   */
  public async queryHitlInbox(
    limit = VSCODE_EXTENSION_DEFAULT_EXECUTION_LIMIT,
  ): Promise<OrchestrationHitlInboxQueryResponse> {
    const client = await this.resolveClient();
    if (!client) {
      return createEmptyHitlInboxResponse();
    }

    try {
      return await client.queryHitlInbox({
        limit,
      });
    } catch {
      return createEmptyHitlInboxResponse();
    }
  }

  /**
   * Queries the orchestration-owned queue/workbench overview read model.
   * @param limit Maximum number of queue entries to request per queue slice.
   * @param laneLimit Maximum number of parallel lanes to request.
   * @param workspaceLimit Maximum number of workspace summaries to request.
   * @returns Queue/workbench overview payload plus temporary bridge metadata, or an empty payload
   * without a workspace.
   */
  public async queryQueueOverview(
    limit = VSCODE_EXTENSION_DEFAULT_QUEUE_LIMIT,
    laneLimit = VSCODE_EXTENSION_DEFAULT_LANE_LIMIT,
    workspaceLimit = VSCODE_EXTENSION_DEFAULT_WORKSPACE_SUMMARY_LIMIT,
  ): Promise<OrchestrationQueueOverviewQueryResponse> {
    const client = await this.resolveClient();
    if (!client) {
      return createEmptyQueueOverviewResponse();
    }

    try {
      return await client.queryQueueOverview({
        limit,
        laneLimit,
        workspaceLimit,
      });
    } catch {
      return createEmptyQueueOverviewResponse();
    }
  }

  /**
   * Queries service health for workspace status views.
   * @returns Service health payload when a workspace is open.
   */
  public async getHealth(): Promise<OrchestrationServiceHealthResponse | undefined> {
    const client = await this.resolveClient();
    return client?.getHealth();
  }

  /**
   * Resolves one execution-board entry by identifier, or falls back to the newest visible entry.
   * @param executionId Preferred execution identifier.
   * @returns Matching execution-board entry when available.
   */
  public async resolveExecutionBoardEntry(
    executionId?: string,
  ): Promise<OrchestrationExecutionBoardEntry | undefined> {
    const executionBoard = await this.queryExecutionBoard(EXECUTION_LOOKUP_LIMIT);
    if (executionId) {
      const executionEntry = executionBoard.executions.find(
        (entry) => entry.execution.executionId === executionId,
      );
      if (executionEntry) {
        return executionEntry;
      }

      const execution = await this.getExecutionSummary(executionId);
      if (!execution) {
        return undefined;
      }

      return {
        execution,
        actions: [],
        handoffTargets: [],
      };
    }

    return executionBoard.executions[0];
  }

  /**
   * Resolves one HITL inbox entry by identifier, or falls back to the newest pending item.
   * @param executionId Preferred execution identifier.
   * @returns Matching pending HITL entry when available.
   */
  public async resolveHitlInboxEntry(
    executionId?: string,
  ): Promise<OrchestrationHitlInboxEntry | undefined> {
    const hitlInbox = await this.queryHitlInbox(EXECUTION_LOOKUP_LIMIT);
    if (executionId) {
      return hitlInbox.pendingDecisions.find(
        (entry) => entry.execution.executionId === executionId,
      );
    }

    return hitlInbox.pendingDecisions[0];
  }

  /**
   * Queries artifact/review detail for the currently selected execution.
   * @param selection Current transient selection snapshot.
   * @returns Detail snapshot for the review-detail webview.
   */
  public async resolveReviewDetailSnapshot(
    selection: VsCodeExtensionSelectionSnapshot,
  ): Promise<VsCodeExtensionReviewDetailSnapshot> {
    const workspaceContext = await this.resolveWorkspaceContextSnapshot();
    const selectedExecution = await this.resolveSelectedExecution(selection);
    const artifactPane = selectedExecution
      ? await this.queryArtifactPaneForExecution(
          selectedExecution.execution.executionId,
          selectedExecution.execution.executionSessionId,
        )
      : undefined;

    return {
      workspaceContext,
      ...(selectedExecution
        ? {
            selectedExecution,
          }
        : {}),
      ...(artifactPane
        ? {
            artifactPane,
          }
        : {}),
      ...(selection.reviewSourcePath
        ? {
            requestedReviewSourcePath: selection.reviewSourcePath,
          }
        : {}),
    };
  }

  /**
   * Resolves one workbench-overview snapshot from workspace facts plus service-owned queue data.
   * @param selection Current transient selection snapshot.
   * @returns Workbench overview facts for the primary VS Code governance workbench baseline.
   */
  public async resolveWorkbenchOverviewSnapshot(
    selection: VsCodeExtensionSelectionSnapshot,
  ): Promise<VsCodeExtensionWorkbenchOverviewSnapshot> {
    const [workspaceContext, queueOverview, secureAuthoring, selectedExecution] = await Promise.all(
      [
        this.resolveWorkspaceContextSnapshot(),
        this.queryQueueOverview(),
        this.resolveSecureAuthoringSnapshot(),
        this.resolveSelectedExecution(selection),
      ],
    );

    return {
      workspaceContext,
      queueOverview,
      ...(secureAuthoring
        ? {
            secureAuthoring,
          }
        : {}),
      ...(selectedExecution
        ? {
            selectedExecution,
          }
        : {}),
      ...(selection.reviewSourcePath
        ? {
            reviewSourcePath: selection.reviewSourcePath,
          }
        : {}),
    };
  }

  /**
   * Resolves one workflow-studio snapshot from the current selection plus service-owned read models.
   * @param selection Current transient selection snapshot.
   * @returns Workflow-studio evidence inputs for the Phase C webview.
   */
  public async resolveWorkflowStudioSnapshot(
    selection: VsCodeExtensionSelectionSnapshot,
  ): Promise<VsCodeExtensionWorkflowStudioSnapshot> {
    const [workspaceContext, queueOverview, secureAuthoring, selectedExecution] = await Promise.all(
      [
        this.resolveWorkspaceContextSnapshot(),
        this.queryQueueOverview(),
        this.resolveSecureAuthoringSnapshot(),
        this.resolveSelectedExecution(selection),
      ],
    );
    const artifactPane = selectedExecution
      ? await this.queryArtifactPaneForExecution(
          selectedExecution.execution.executionId,
          selectedExecution.execution.executionSessionId,
        )
      : undefined;

    return {
      workspaceContext,
      queueOverview,
      ...(secureAuthoring
        ? {
            secureAuthoring,
          }
        : {}),
      ...(selectedExecution
        ? {
            selectedExecution,
          }
        : {}),
      ...(artifactPane
        ? {
            artifactPane,
          }
        : {}),
      ...(selection.reviewSourcePath
        ? {
            reviewSourcePath: selection.reviewSourcePath,
          }
        : {}),
    };
  }

  private createServiceDiagnosticsSnapshot(
    health: OrchestrationServiceHealthResponse,
  ): VsCodeExtensionServiceDiagnosticsSnapshot {
    return {
      lifecycleStatus: health.lifecycleStatus,
      serviceHostKind: health.serviceHostKind,
      serviceTransportKind: health.serviceTransportKind,
      checkpointCapable: health.checkpointCapable,
      memoryStoreProviderId: health.memoryProvider?.memoryStoreProviderId,
      pid: health.pid,
    };
  }

  /**
   * Submits one HITL decision through the orchestration command seam.
   * @param request Service-owned HITL command request.
   * @returns Accepted decision response.
   */
  public async submitHitlDecision(
    request: OrchestrationSubmitHitlDecisionRequest,
  ): Promise<OrchestrationSubmitHitlDecisionResponse> {
    const client = await this.requireClient();
    return client.submitHitlDecision(request);
  }

  /**
   * Requests execution recovery through the orchestration command seam.
   * @param request Service-owned recovery command request.
   * @returns Recovery result.
   */
  public async recoverExecution(
    request: OrchestrationRecoverExecutionRequest,
  ): Promise<OrchestrationRecoverExecutionResponse> {
    const client = await this.requireClient();
    return client.recoverExecution(request);
  }

  /**
   * Requests execution termination through the orchestration command seam.
   * @param request Service-owned termination command request.
   * @returns Termination result.
   */
  public async terminateExecution(
    request: OrchestrationTerminateExecutionRequest,
  ): Promise<OrchestrationTerminateExecutionResponse> {
    const client = await this.requireClient();
    return client.terminateExecution(request);
  }

  /**
   * Resolves user-config + secret-backend readiness through the embedded CLI JSON contract.
   * @returns One additive readiness snapshot, or a degraded snapshot when the embedded contract
   * cannot be reached safely.
   */
  public async resolveSecureAuthoringSnapshot(): Promise<
    VsCodeExtensionSecureAuthoringSnapshot | undefined
  > {
    const openedWorkspaceRoot = this.getWorkspaceRoot();
    if (!openedWorkspaceRoot) {
      return undefined;
    }

    const serviceWorkspaceContext = this.resolveServiceWorkspaceContext(openedWorkspaceRoot);
    if (
      this.secureAuthoringSnapshotPromise &&
      this.secureAuthoringRepositoryRoot === serviceWorkspaceContext.repositoryRoot
    ) {
      return this.secureAuthoringSnapshotPromise;
    }

    this.secureAuthoringRepositoryRoot = serviceWorkspaceContext.repositoryRoot;
    this.secureAuthoringSnapshotPromise = this.loadSecureAuthoringSnapshot(
      serviceWorkspaceContext.repositoryRoot,
    ).then((snapshot) => {
      if (snapshot.degradedReason) {
        this.clearSecureAuthoringSnapshotCache();
      }
      return snapshot;
    });
    return this.secureAuthoringSnapshotPromise;
  }

  /**
   * Persists one user-local default value through the embedded CLI contract.
   * @param keyPath Canonical user-config key path.
   * @param value Validated user-local default value.
   * @returns Redacted mutation summary plus canonical config path.
   */
  public async setUserConfigValue(
    keyPath: string,
    value: string,
  ): Promise<{
    message: string;
    configPath?: string;
    persistedValue?: string;
  }> {
    const repositoryRoot = this.requireRepositoryRootForEmbeddedCli();
    const payload = await this.executeEmbeddedCliJsonCommand(
      {
        args: ['config', 'set', keyPath, value],
        currentWorkingDirectory: repositoryRoot,
      },
      'Failed to persist the requested user-local default.',
      '写入请求的用户本地默认值失败。',
    );
    this.clearSecureAuthoringSnapshotCache();
    return {
      message: this.readPayloadMessage(payload),
      configPath: this.readDetailString(payload, 'config_path'),
      persistedValue: this.readDetailString(payload, 'value'),
    };
  }

  /**
   * Persists one managed secret value through the embedded CLI contract without exposing the raw
   * value to argv, transcript, or local command previews.
   * @param keyName Canonical managed secret key.
   * @param value Raw secret value that will be written through stdin only.
   * @param backendId Optional explicit backend override.
   * @returns Redacted mutation summary and selector/backend metadata.
   */
  public async setManagedSecret(
    keyName: string,
    value: string,
    backendId?: string,
  ): Promise<{
    message: string;
    selector?: string;
    backendId?: string;
    warning?: string;
  }> {
    const repositoryRoot = this.requireRepositoryRootForEmbeddedCli();
    const payload = await this.executeEmbeddedCliJsonCommand(
      {
        args: ['secret', 'set', keyName, ...(backendId ? ['--backend', backendId] : []), '--stdin'],
        currentWorkingDirectory: repositoryRoot,
        stdin: value,
      },
      'Failed to write the requested managed secret.',
      '写入请求的受管 secret 失败。',
    );
    this.clearSecureAuthoringSnapshotCache();
    return {
      message: this.readPayloadMessage(payload),
      selector: this.readDetailString(payload, 'selector'),
      backendId: this.readDetailString(payload, 'backend'),
      warning: this.readDetailString(payload, 'warning'),
    };
  }

  /**
   * Disposes any live sidecar client owned by the extension host.
   * @returns Promise that settles after disposal finishes.
   */
  public async dispose(): Promise<void> {
    if (!this.clientPromise) {
      this.clientWorkspaceRoot = undefined;
      this.clientRepositoryRoot = undefined;
      return;
    }

    const client = await this.clientPromise.catch(() => undefined);
    this.clientPromise = null;
    this.clientWorkspaceRoot = undefined;
    this.clientRepositoryRoot = undefined;
    this.clearSecureAuthoringSnapshotCache();
    await client?.dispose();
  }

  private async queryArtifactPaneForExecution(
    executionId: string,
    executionSessionId?: string,
  ): Promise<OrchestrationArtifactPaneQueryResponse | undefined> {
    const client = await this.resolveClient();
    if (!client) {
      return undefined;
    }

    try {
      return await client.queryArtifactPane({
        executionId,
        ...(executionSessionId
          ? {
              sessionId: executionSessionId,
            }
          : {}),
      });
    } catch (error) {
      throw standardizeError(error);
    }
  }

  private async getExecutionSummary(
    executionId: string,
  ): Promise<OrchestrationExecutionSummary | undefined> {
    const client = await this.resolveClient();
    if (!client) {
      return undefined;
    }

    try {
      return await client.getExecution(executionId);
    } catch {
      return undefined;
    }
  }

  private async resolveQueueSelectionExecution(
    queueEntry: OrchestrationGovernanceQueueEntry,
  ): Promise<OrchestrationExecutionBoardEntry | undefined> {
    if (!queueEntry.executionId) {
      return undefined;
    }

    const executionEntry = await this.resolveExecutionBoardEntry(queueEntry.executionId);
    if (!executionEntry) {
      return undefined;
    }
    if (executionEntry.actions.length > 0 || executionEntry.handoffTargets.length > 0) {
      return executionEntry;
    }

    return {
      execution: executionEntry.execution,
      actions: [...queueEntry.actions],
      handoffTargets: [...queueEntry.handoffTargets],
    };
  }

  /**
   * Resolves the transient execution selection without reintroducing fallback when the caller
   * explicitly cleared execution identifiers in favor of a review-only selection.
   * @param selection Current transient selection snapshot.
   * @returns Matching execution entry, the newest execution when no explicit selection exists, or
   * `undefined` when the caller intentionally cleared execution selection.
   */
  private async resolveSelectedExecution(
    selection: VsCodeExtensionSelectionSnapshot,
  ): Promise<OrchestrationExecutionBoardEntry | undefined> {
    if ('executionId' in selection) {
      if (!selection.executionId) {
        return undefined;
      }

      if (selection.queueEntry?.executionId === selection.executionId) {
        return this.resolveQueueSelectionExecution(selection.queueEntry);
      }

      return this.resolveExecutionBoardEntry(selection.executionId);
    }

    return this.resolveExecutionBoardEntry();
  }

  private async requireClient(): Promise<LocalOrchestrationServiceSidecarClient> {
    const client = await this.resolveClient();
    if (client) {
      return client;
    }

    throw new RuntimeError(
      GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
      'VS Code Governor companion requires one open workspace folder.',
      {
        surface: 'vscode_extension',
      },
    );
  }

  private async resolveClient(): Promise<LocalOrchestrationServiceSidecarClient | undefined> {
    const openedWorkspaceRoot = this.getWorkspaceRoot();
    if (!openedWorkspaceRoot) {
      await this.dispose();
      return undefined;
    }

    const serviceWorkspaceContext = this.resolveServiceWorkspaceContext(openedWorkspaceRoot);
    if (
      this.clientPromise &&
      this.clientWorkspaceRoot === serviceWorkspaceContext.governanceWorkspaceRoot &&
      this.clientRepositoryRoot === serviceWorkspaceContext.repositoryRoot
    ) {
      return this.clientPromise;
    }

    if (
      this.clientPromise &&
      (this.clientWorkspaceRoot !== serviceWorkspaceContext.governanceWorkspaceRoot ||
        this.clientRepositoryRoot !== serviceWorkspaceContext.repositoryRoot)
    ) {
      await this.dispose();
    }

    this.clientWorkspaceRoot = serviceWorkspaceContext.governanceWorkspaceRoot;
    this.clientRepositoryRoot = serviceWorkspaceContext.repositoryRoot;
    this.clientPromise = Promise.resolve(
      new LocalOrchestrationServiceSidecarClient(serviceWorkspaceContext.governanceWorkspaceRoot, {
        repositoryRoot: serviceWorkspaceContext.repositoryRoot,
      }),
    );
    return this.clientPromise;
  }

  private resolveServiceWorkspaceContext(openedWorkspaceRoot: string): {
    repositoryRoot: string;
    governanceWorkspaceRoot: string;
  } {
    const baselineWorkspace = this.workspaceResolver.resolve({
      currentWorkingDirectory: openedWorkspaceRoot,
    });
    const repositoryWorkspaceConfig = this.workspaceConfigDiscovery.loadRepositoryWorkspaceConfig(
      baselineWorkspace.repositoryRoot,
    );
    const resolvedWorkspace = this.workspaceResolver.resolve({
      currentWorkingDirectory: openedWorkspaceRoot,
      ...(repositoryWorkspaceConfig
        ? {
            config: repositoryWorkspaceConfig,
          }
        : {}),
    });

    return {
      repositoryRoot: resolvedWorkspace.repositoryRoot,
      governanceWorkspaceRoot: resolvedWorkspace.workspaceRoot,
    };
  }

  private async loadSecureAuthoringSnapshot(
    repositoryRoot: string,
  ): Promise<VsCodeExtensionSecureAuthoringSnapshot> {
    try {
      const [configStatusPayload, configListPayload, secretStatusPayload, secretListPayload] =
        await Promise.all([
          this.executeEmbeddedCliJsonCommand(
            {
              args: ['config', 'status'],
              currentWorkingDirectory: repositoryRoot,
            },
            'Failed to resolve user-local config readiness.',
            '解析用户本地配置 readiness 失败。',
          ),
          this.executeEmbeddedCliJsonCommand(
            {
              args: ['config', 'list'],
              currentWorkingDirectory: repositoryRoot,
            },
            'Failed to list user-local config defaults.',
            '列出用户本地配置默认值失败。',
          ),
          this.executeEmbeddedCliJsonCommand(
            {
              args: ['secret', 'status'],
              currentWorkingDirectory: repositoryRoot,
            },
            'Failed to resolve secret-backend readiness.',
            '解析 secret backend readiness 失败。',
          ),
          this.executeEmbeddedCliJsonCommand(
            {
              args: ['secret', 'list'],
              currentWorkingDirectory: repositoryRoot,
            },
            'Failed to list managed secret readiness.',
            '列出受管 secret readiness 失败。',
          ),
        ]);

      const userConfigStatus = this.parseUserConfigStatusSnapshot(
        configStatusPayload,
        configListPayload,
      );
      const secretReadiness = this.parseSecretReadinessSnapshot(
        secretStatusPayload,
        secretListPayload,
        userConfigStatus.entries,
      );

      return {
        userConfig: userConfigStatus,
        secretReadiness,
      };
    } catch (error) {
      const standardizedError = standardizeError(error);
      return {
        degradedReason: standardizedError.message,
      };
    }
  }

  private parseUserConfigStatusSnapshot(
    configStatusPayload: VsCodeExtensionCliCommandSuccessPayload,
    configListPayload: VsCodeExtensionCliCommandSuccessPayload,
  ): VsCodeExtensionUserConfigStatusSnapshot {
    return {
      configPath: this.readRequiredDetailString(configStatusPayload, 'config_path'),
      configExists: this.readDetailBoolean(configStatusPayload, 'config_exists'),
      legacyPreferencePath: this.readRequiredDetailString(
        configStatusPayload,
        'legacy_preference_path',
      ),
      legacyPreferenceExists: this.readDetailBoolean(
        configStatusPayload,
        'legacy_preference_exists',
      ),
      ...(this.readDetailString(configStatusPayload, 'theme_preference')
        ? {
            themePreference: this.readDetailString(configStatusPayload, 'theme_preference'),
          }
        : {}),
      ...(this.readDetailString(configStatusPayload, 'workspace_mode_preference')
        ? {
            workspaceModePreference: this.readDetailString(
              configStatusPayload,
              'workspace_mode_preference',
            ),
          }
        : {}),
      entries: this.parseUserConfigEntries(this.readDetailString(configListPayload, 'entries')),
    };
  }

  private parseSecretReadinessSnapshot(
    secretStatusPayload: VsCodeExtensionCliCommandSuccessPayload,
    secretListPayload: VsCodeExtensionCliCommandSuccessPayload,
    userConfigEntries: readonly VsCodeExtensionUserConfigEntrySnapshot[],
  ): VsCodeExtensionSecretReadinessSnapshot {
    const records = this.parseSecretRecords(this.readDetailString(secretListPayload, 'records'));
    const configuredCredentialRefs = userConfigEntries
      .filter((entry) => entry.keyPath.endsWith('.remoteApi.credentialRef'))
      .map((entry) => entry.value)
      .filter((value) => value.startsWith(CREDENTIAL_SELECTOR_PREFIX));
    const resolvedSelectors = new Set(
      records
        .filter((record) => record.exists)
        .map((record) => `${CREDENTIAL_SELECTOR_PREFIX}${record.keyName}`),
    );

    return {
      ...(this.readDetailString(secretStatusPayload, 'selected_backend')
        ? {
            selectedBackendId: this.readDetailString(secretStatusPayload, 'selected_backend'),
          }
        : {}),
      ...(this.readDetailString(secretStatusPayload, 'default_backend')
        ? {
            defaultBackendId: this.readDetailString(secretStatusPayload, 'default_backend'),
          }
        : {}),
      indexPath: this.readRequiredDetailString(secretStatusPayload, 'index_path'),
      backends: this.parseSecretBackendStatuses(secretStatusPayload),
      records,
      configuredCredentialRefs,
      unresolvedCredentialRefs: configuredCredentialRefs.filter(
        (selector) => !resolvedSelectors.has(selector),
      ),
    };
  }

  private parseUserConfigEntries(
    entriesSummary?: string,
  ): readonly VsCodeExtensionUserConfigEntrySnapshot[] {
    if (!entriesSummary) {
      return [];
    }

    return entriesSummary
      .split(DEFAULT_USER_CONFIG_ENTRY_DELIMITER)
      .map((entrySummary) => {
        const dividerIndex = entrySummary.indexOf('=');
        if (dividerIndex <= 0) {
          return undefined;
        }

        return {
          keyPath: entrySummary.slice(0, dividerIndex).trim(),
          value: entrySummary.slice(dividerIndex + 1).trim(),
        } satisfies VsCodeExtensionUserConfigEntrySnapshot;
      })
      .filter((entry): entry is VsCodeExtensionUserConfigEntrySnapshot => Boolean(entry));
  }

  private parseSecretBackendStatuses(
    payload: VsCodeExtensionCliCommandSuccessPayload,
  ): readonly VsCodeExtensionSecretBackendStatusSnapshot[] {
    const checks = payload.command_result?.checks ?? [];
    const unsafeFallbackWarning =
      this.readDetailString(payload, 'warning') ?? this.readInteractionPromptAction(payload);
    return checks
      .filter((check) => check.id?.startsWith('secret_backend_'))
      .map((check) => ({
        backendId: check.id?.replace('secret_backend_', '') ?? 'unknown',
        available: check.status === 'pass',
        detail: check.detail ?? '',
        ...(check.id?.replace('secret_backend_', '') === UNSAFE_LOCAL_FILE_SECRET_BACKEND_ID &&
        unsafeFallbackWarning
          ? {
              warning: unsafeFallbackWarning,
            }
          : {}),
      }));
  }

  private parseSecretRecords(
    recordsSummary?: string,
  ): readonly VsCodeExtensionSecretRecordSnapshot[] {
    if (!recordsSummary) {
      return [];
    }

    return recordsSummary
      .split(DEFAULT_SECRET_RECORD_DELIMITER)
      .map((recordSummary) => {
        const [backendDescriptor, existsDescriptor] = recordSummary.split(':');
        const dividerIndex = backendDescriptor?.lastIndexOf('@') ?? -1;
        if (!backendDescriptor || dividerIndex <= 0) {
          return undefined;
        }

        return {
          keyName: backendDescriptor.slice(0, dividerIndex).trim(),
          backendId: backendDescriptor.slice(dividerIndex + 1).trim(),
          exists: existsDescriptor?.trim() === 'present',
        } satisfies VsCodeExtensionSecretRecordSnapshot;
      })
      .filter((record): record is VsCodeExtensionSecretRecordSnapshot => Boolean(record));
  }

  private async executeEmbeddedCliJsonCommand(
    request: VsCodeExtensionEmbeddedCliRequest,
    englishFailurePrefix: string,
    chineseFailurePrefix: string,
  ): Promise<VsCodeExtensionCliCommandSuccessPayload> {
    const payload = await this.embeddedCliExecutor(request);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        vscode.env.language.trim().toLowerCase().startsWith('zh')
          ? `${chineseFailurePrefix}：CLI 返回了无法识别的 JSON 结构。`
          : `${englishFailurePrefix}: embedded CLI returned an unexpected JSON payload.`,
      );
    }

    return payload as VsCodeExtensionCliCommandSuccessPayload;
  }

  private async executeEmbeddedCliCommand(
    request: VsCodeExtensionEmbeddedCliRequest,
  ): Promise<unknown> {
    const cliEntryPath = this.resolveEmbeddedCliEntryPath();
    return new Promise<unknown>((resolvePromise, reject) => {
      const childProcess = spawn(
        process.execPath,
        [
          cliEntryPath,
          '--locale',
          this.resolveEmbeddedCliLocale(),
          '--output',
          'json',
          '--no-color',
          '--no-interactive',
          ...request.args,
        ],
        {
          cwd: request.currentWorkingDirectory,
          env: process.env,
          stdio: 'pipe',
        },
      );
      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (chunk) => {
        stdout += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
      });
      childProcess.stderr.on('data', (chunk) => {
        stderr += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
      });
      childProcess.on('error', (error) => {
        reject(standardizeError(error));
      });
      childProcess.on('close', (exitCode) => {
        const successPayload = this.tryParseJsonPayload(stdout);
        if (exitCode === 0 && successPayload) {
          resolvePromise(successPayload);
          return;
        }

        const failurePayload = this.tryParseJsonPayload(stderr) ?? this.tryParseJsonPayload(stdout);
        if (
          failurePayload &&
          typeof failurePayload === 'object' &&
          !Array.isArray(failurePayload)
        ) {
          const payloadRecord = failurePayload as Record<string, unknown>;
          reject(
            new RuntimeError(
              this.readGovernorErrorCode(payloadRecord.error_code),
              this.readGovernorErrorMessage(payloadRecord.message, stderr, stdout),
              {
                exitCode,
              },
            ),
          );
          return;
        }

        reject(
          new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            this.readGovernorErrorMessage(undefined, stderr, stdout),
            {
              exitCode,
            },
          ),
        );
      });

      if (request.stdin !== undefined) {
        childProcess.stdin.end(request.stdin);
      } else {
        childProcess.stdin.end();
      }
    });
  }

  private resolveEmbeddedCliEntryPath(): string {
    try {
      return requireFromRuntime.resolve(EMBEDDED_CLI_PACKAGE_SPECIFIER);
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
        vscode.env.language.trim().toLowerCase().startsWith('zh')
          ? '当前 VS Code 安装中缺少内嵌的 Repo AI Governor CLI 依赖。'
          : 'The embedded Repo AI Governor CLI dependency is missing from this VS Code installation.',
        undefined,
        error,
      );
    }
  }

  private resolveEmbeddedCliLocale(): string {
    const normalizedLanguage = vscode.env.language.trim();
    return normalizedLanguage.length > 0 ? normalizedLanguage : 'en-US';
  }

  private tryParseJsonPayload(content: string): unknown {
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(trimmedContent) as unknown;
    } catch {
      return undefined;
    }
  }

  private readGovernorErrorCode(errorCode: unknown): GovernorErrorCode {
    return typeof errorCode === 'string' &&
      Object.values(GovernorErrorCode).includes(errorCode as GovernorErrorCode)
      ? (errorCode as GovernorErrorCode)
      : GovernorErrorCode.UNKNOWN;
  }

  private readGovernorErrorMessage(message: unknown, stderr: string, stdout: string): string {
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    const stderrContent = stderr.trim();
    if (stderrContent.length > 0) {
      return stderrContent;
    }

    const stdoutContent = stdout.trim();
    if (stdoutContent.length > 0) {
      return stdoutContent;
    }

    return vscode.env.language.trim().toLowerCase().startsWith('zh')
      ? '内嵌 CLI 没有返回可解析的结果。'
      : 'The embedded CLI did not return a parseable result.';
  }

  private readPayloadMessage(payload: VsCodeExtensionCliCommandSuccessPayload): string {
    return typeof payload.message === 'string' && payload.message.trim().length > 0
      ? payload.message
      : vscode.env.language.trim().toLowerCase().startsWith('zh')
        ? '命令已完成。'
        : 'Command completed.';
  }

  private readRequiredDetailString(
    payload: VsCodeExtensionCliCommandSuccessPayload,
    key: string,
  ): string {
    const value = this.readDetailString(payload, key);
    if (value) {
      return value;
    }

    throw new RuntimeError(
      GovernorErrorCode.UNKNOWN,
      vscode.env.language.trim().toLowerCase().startsWith('zh')
        ? `内嵌 CLI 缺少必需字段：${key}。`
        : `The embedded CLI payload is missing required field "${key}".`,
    );
  }

  private readDetailString(
    payload: VsCodeExtensionCliCommandSuccessPayload,
    key: string,
  ): string | undefined {
    const value = payload.command_result?.details?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private readDetailBoolean(
    payload: VsCodeExtensionCliCommandSuccessPayload,
    key: string,
  ): boolean {
    return payload.command_result?.details?.[key] === true;
  }

  private readInteractionPromptAction(
    payload: VsCodeExtensionCliCommandSuccessPayload,
  ): string | undefined {
    const action = payload.command_result?.experience?.interactionPrompts?.[0]?.action;
    return typeof action === 'string' && action.trim().length > 0 ? action : undefined;
  }

  private requireRepositoryRootForEmbeddedCli(): string {
    const openedWorkspaceRoot = this.getWorkspaceRoot();
    if (!openedWorkspaceRoot) {
      throw new RuntimeError(
        GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
        vscode.env.language.trim().toLowerCase().startsWith('zh')
          ? '请先打开一个受治理的工作区后再执行本地 authoring 操作。'
          : 'Open one governed workspace before running local authoring actions.',
      );
    }

    return this.resolveServiceWorkspaceContext(openedWorkspaceRoot).repositoryRoot;
  }

  private clearSecureAuthoringSnapshotCache(): void {
    this.secureAuthoringSnapshotPromise = null;
    this.secureAuthoringRepositoryRoot = undefined;
  }
}
