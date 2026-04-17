import * as vscode from 'vscode';

import { LocalOrchestrationServiceSidecarClient } from '@repo-ai-governor/core-orchestration-service/sidecar-client';
import type {
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationExecutionBoardEntry,
  OrchestrationExecutionBoardQueryResponse,
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
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  VSCODE_EXTENSION_DEFAULT_EXECUTION_LIMIT,
  VSCODE_EXTENSION_DEFAULT_LANE_LIMIT,
  VSCODE_EXTENSION_DEFAULT_QUEUE_LIMIT,
  VSCODE_EXTENSION_DEFAULT_WORKSPACE_SUMMARY_LIMIT,
} from '../constants/index.js';
import type {
  VsCodeExtensionReviewDetailSnapshot,
  VsCodeExtensionSelectionSnapshot,
  VsCodeExtensionServiceDiagnosticsSnapshot,
  VsCodeExtensionWorkbenchOverviewSnapshot,
  VsCodeExtensionWorkspaceContextSnapshot,
} from '../types/index.js';

const EXECUTION_LOOKUP_LIMIT = 20;

/**
 * Owns lazy local-orchestration-service access for the VS Code extension host.
 *
 * Why this exists:
 * the extension must consume the same service-owned query/command seam as desktop without
 * importing CLI internals or building extension-only orchestration state.
 */
export class VsCodeExtensionServiceRuntime {
  private clientPromise: Promise<LocalOrchestrationServiceSidecarClient> | null = null;
  private clientWorkspaceRoot: string | undefined;

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
      return {
        executions: [],
        returnedCount: 0,
        totalMatchedCount: 0,
      };
    }

    return client.queryExecutionBoard({
      limit,
    });
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
      return {
        pendingDecisions: [],
        returnedCount: 0,
        totalMatchedCount: 0,
      };
    }

    return client.queryHitlInbox({
      limit,
    });
  }

  /**
   * Queries the orchestration-owned queue/workbench overview read model.
   * @param limit Maximum number of queue entries to request per queue slice.
   * @param laneLimit Maximum number of parallel lanes to request.
   * @param workspaceLimit Maximum number of workspace summaries to request.
   * @returns Queue/workbench overview payload, or an empty payload without a workspace.
   */
  public async queryQueueOverview(
    limit = VSCODE_EXTENSION_DEFAULT_QUEUE_LIMIT,
    laneLimit = VSCODE_EXTENSION_DEFAULT_LANE_LIMIT,
    workspaceLimit = VSCODE_EXTENSION_DEFAULT_WORKSPACE_SUMMARY_LIMIT,
  ): Promise<OrchestrationQueueOverviewQueryResponse> {
    const client = await this.resolveClient();
    if (!client) {
      return {
        generatedAt: '',
        automationInbox: [],
        reviewQueue: [],
        parallelLanes: [],
        workspaceSummary: [],
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

    return client.queryQueueOverview({
      limit,
      laneLimit,
      workspaceLimit,
    });
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
      return executionBoard.executions.find((entry) => entry.execution.executionId === executionId);
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
    const [workspaceContext, queueOverview, selectedExecution] = await Promise.all([
      this.resolveWorkspaceContextSnapshot(),
      this.queryQueueOverview(),
      this.resolveSelectedExecution(selection),
    ]);

    return {
      workspaceContext,
      queueOverview,
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
   * Disposes any live sidecar client owned by the extension host.
   * @returns Promise that settles after disposal finishes.
   */
  public async dispose(): Promise<void> {
    if (!this.clientPromise) {
      this.clientWorkspaceRoot = undefined;
      return;
    }

    const client = await this.clientPromise.catch(() => undefined);
    this.clientPromise = null;
    this.clientWorkspaceRoot = undefined;
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

    return client.queryArtifactPane({
      executionId,
      ...(executionSessionId
        ? {
            sessionId: executionSessionId,
          }
        : {}),
    });
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
      return selection.executionId
        ? this.resolveExecutionBoardEntry(selection.executionId)
        : undefined;
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
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      await this.dispose();
      return undefined;
    }

    if (this.clientPromise && this.clientWorkspaceRoot === workspaceRoot) {
      return this.clientPromise;
    }

    if (this.clientPromise && this.clientWorkspaceRoot !== workspaceRoot) {
      await this.dispose();
    }

    this.clientWorkspaceRoot = workspaceRoot;
    this.clientPromise = Promise.resolve(new LocalOrchestrationServiceSidecarClient(workspaceRoot));
    return this.clientPromise;
  }
}
