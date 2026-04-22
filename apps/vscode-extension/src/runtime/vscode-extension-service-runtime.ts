import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import * as vscode from 'vscode';

import {
  ConfigLoader,
  WorkspaceConfigDiscoveryService,
  WorkspaceResolver,
} from '@repo-ai-governor/config';
import { LOCAL_ORCHESTRATION_SERVICE_SIDECAR_LOCALE_ENV } from '@repo-ai-governor/core-orchestration-service';
import { LocalOrchestrationServiceSidecarClient } from '@repo-ai-governor/core-orchestration-service/sidecar-client';
import type {
  OrchestrationApplyProviderOnboardingResponse,
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationBootstrapReadinessSnapshot,
  OrchestrationCommitWorkflowDraftRequest,
  OrchestrationExecutionBoardEntry,
  OrchestrationExecutionBoardQueryResponse,
  OrchestrationExecutionSummary,
  OrchestrationGovernanceQueueEntry,
  OrchestrationHitlDecisionPacket,
  OrchestrationHitlInboxEntry,
  OrchestrationHitlInboxQueryResponse,
  OrchestrationProviderOnboardingSnapshot,
  OrchestrationQueueOverviewQueryResponse,
  OrchestrationRecoverExecutionRequest,
  OrchestrationRecoverExecutionResponse,
  OrchestrationRoleLaneStatusQueryResponse,
  OrchestrationServiceHealthResponse,
  OrchestrationSessionContinuitySnapshot,
  OrchestrationSessionEvent,
  OrchestrationSubmitHitlDecisionRequest,
  OrchestrationSubmitHitlDecisionResponse,
  OrchestrationTerminateExecutionRequest,
  OrchestrationTerminateExecutionResponse,
  OrchestrationUpdateWorkflowDraftEdgeRequest,
  OrchestrationUpdateWorkflowDraftNodeRequest,
  OrchestrationUpdateWorkflowDraftPolicyRequest,
  OrchestrationValidateWorkflowDraftRequest,
  OrchestrationWorkflowDraftMutationResponse,
  OrchestrationWorkflowDraftSession,
  OrchestrationWorkflowDraftSessionQueryRequest,
  OrchestrationWorkspaceOperationKind,
  OrchestrationWorkspaceOperationResponse,
} from '@repo-ai-governor/orchestration-service-client';
import {
  OrchestrationClientSurface as OrchestrationClientSurfaceValue,
  OrchestrationGovernanceNotificationStatus as OrchestrationGovernanceNotificationStatusValue,
  OrchestrationSessionEventType,
  OrchestrationSessionRouteId,
  OrchestrationSessionStatus,
} from '@repo-ai-governor/orchestration-service-client';
import type { OrchestrationStartWorkflowDraftRequest } from '@repo-ai-governor/orchestration-service-client';
import {
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  GovernorErrorCode,
  RuntimeError,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  VSCODE_EXTENSION_COMMAND_IDS,
  VSCODE_EXTENSION_DEFAULT_EXECUTION_LIMIT,
  VSCODE_EXTENSION_DEFAULT_LANE_LIMIT,
  VSCODE_EXTENSION_DEFAULT_QUEUE_LIMIT,
  VSCODE_EXTENSION_DEFAULT_WORKSPACE_SUMMARY_LIMIT,
  VSCODE_EXTENSION_PROVIDER_LIFECYCLE_ACTION_IDS,
  VSCODE_EXTENSION_PROVIDER_LIFECYCLE_STATUSES,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_CONFIG_TARGET_SUFFIXES,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_CREDENTIAL_REF_STRATEGY,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_ENTRYPOINT_KINDS,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_MUTATION_MODE,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_READINESS_PROJECTION_SOURCES,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_RECEIPT_FIELDS,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_SECRET_CAPTURE_MODE,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_SECRET_OWNER,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_SURFACE_ID,
} from '../constants/index.js';
import type {
  VsCodeExtensionProviderLifecycleSnapshot,
  VsCodeExtensionProviderOnboardingApplyReceipt,
  VsCodeExtensionProviderOnboardingApplyRequest,
  VsCodeExtensionProviderOnboardingEntrypointKind,
  VsCodeExtensionProviderOnboardingSnapshot,
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
const EMBEDDED_CLI_ARGV_ENVIRONMENT_KEY = 'REPO_AI_GOVERNOR_EMBEDDED_CLI_ARGV';
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

function createEmptyRoleLaneStatusResponse(): OrchestrationRoleLaneStatusQueryResponse {
  return {
    generatedAt: '',
    lanes: [],
    returnedCount: 0,
    totalMatchedCount: 0,
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

interface VsCodeExtensionSessionCommandBatch {
  slashQuery?: string;
  bridgeArgv?: string[];
  previewCommandLine?: string;
}

interface VsCodeExtensionSessionHandoffBacklink {
  kind?: string;
  label?: string;
  target?: string;
}

export interface VsCodeExtensionSessionTurnResult {
  sessionId: string;
  turnId: string;
  assistantMessage: string;
  responseMode?: string;
  interactionMode?: string;
  executionIntent?: string;
  suggestedSlashCommand?: string;
  handoffCommandPreview?: string;
  selectedSurface?: string;
  selectedBy?: string;
  handoffExecutionMode?: string;
  sessionRoutingPreferenceApplied?: boolean;
  commandBatches: readonly VsCodeExtensionSessionCommandBatch[];
  handoffBacklinks: readonly VsCodeExtensionSessionHandoffBacklink[];
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

interface VsCodeExtensionResolvedProviderOnboardingState {
  provider: AdapterProviderKind;
  vendorBinding: AdapterVendorBindingKind;
  credentialRef: string;
  model?: string;
  endpoint?: string;
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
  private readonly preferEmbeddedCliExecutor: boolean;
  private readonly workspaceConfigDiscovery: Pick<
    WorkspaceConfigDiscoveryService,
    'loadRepositoryWorkspaceConfig'
  >;
  private secureAuthoringSnapshotPromise: Promise<VsCodeExtensionSecureAuthoringSnapshot> | null =
    null;
  private secureAuthoringRepositoryRoot: string | undefined;
  private mainSessionId: string | undefined;
  private mainSessionWorkspaceRoot: string | undefined;
  private mainSessionRepositoryRoot: string | undefined;

  public constructor(dependencies: VsCodeExtensionServiceRuntimeDependencies = {}) {
    this.configLoader = dependencies.configLoader ?? new ConfigLoader();
    this.workspaceResolver = dependencies.workspaceResolver ?? new WorkspaceResolver();
    this.pathExists = dependencies.pathExists ?? existsSync;
    this.embeddedCliExecutor =
      dependencies.embeddedCliExecutor ?? this.executeEmbeddedCliCommand.bind(this);
    this.preferEmbeddedCliExecutor = Boolean(dependencies.embeddedCliExecutor);
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
   * Queries the orchestration-owned role-lane status projection.
   * @param executionId Optional execution selector for workflow-studio focus.
   * @returns Role-lane status payload, or an empty payload without a workspace.
   */
  public async queryRoleLaneStatus(
    executionId?: string,
  ): Promise<OrchestrationRoleLaneStatusQueryResponse> {
    const client = await this.resolveClient();
    if (!client) {
      return createEmptyRoleLaneStatusResponse();
    }

    try {
      return (
        (await client.queryRoleLaneStatus(
          executionId
            ? {
                executionId,
              }
            : undefined,
        )) ?? createEmptyRoleLaneStatusResponse()
      );
    } catch {
      return createEmptyRoleLaneStatusResponse();
    }
  }

  /**
   * Queries the orchestration-owned session continuity projection.
   * @param sessionId Optional session selector for workflow-studio focus.
   * @param executionId Optional execution selector when session id is not available.
   * @returns Session continuity snapshot when available.
   */
  public async querySessionContinuity(
    sessionId?: string,
    executionId?: string,
  ): Promise<OrchestrationSessionContinuitySnapshot | undefined> {
    const client = await this.resolveClient();
    if (!client) {
      return sessionId
        ? {
            sessionId,
            degradedReason: this.localizeText(
              'Local orchestration service is unavailable.',
              '当前本地编排服务不可用。',
            ),
          }
        : undefined;
    }

    let continuityQueryFailed = false;
    try {
      const continuitySnapshot = await client.querySessionContinuity({
        ...(sessionId
          ? {
              sessionId,
            }
          : {}),
        ...(executionId
          ? {
              executionId,
            }
          : {}),
        locale: this.resolveEmbeddedCliLocale(),
      });
      if (continuitySnapshot) {
        return continuitySnapshot;
      }
    } catch {
      continuityQueryFailed = true;
    }

    const fallbackSessionId =
      sessionId ??
      (executionId ? (await this.getExecutionSummary(executionId))?.executionSessionId : undefined);
    if (!fallbackSessionId) {
      return undefined;
    }

    try {
      const session = await client.getSession(fallbackSessionId);
      if (session) {
        return {
          sessionId: session.sessionId,
          sessionStatus: session.status,
          currentRouteId: session.currentRouteId,
          latestTurnId: session.latestTurnId,
          latestEventSequence: session.latestEventSequence,
          nextCursor: session.nextCursor,
          resumeSelector: session.sessionId,
        };
      }
    } catch {
      // Fall through to the degraded continuity payload below.
    }

    return {
      sessionId: fallbackSessionId,
      degradedReason: this.localizeText(
        continuityQueryFailed
          ? 'Session continuity query failed.'
          : 'Session continuity is unavailable.',
        continuityQueryFailed ? '会话连续性查询失败。' : '当前无法获取会话连续性。',
      ),
    };
  }

  /**
   * Queries the orchestration-owned HITL decision packet.
   * @param executionId Optional execution selector for workflow-studio focus.
   * @param sessionId Optional session selector when execution id is not available.
   * @returns Decision packet when available.
   */
  public async queryHitlDecisionPacket(
    executionId?: string,
    sessionId?: string,
  ): Promise<OrchestrationHitlDecisionPacket | undefined> {
    const client = await this.resolveClient();
    if (!client) {
      return undefined;
    }

    try {
      return await client.queryHitlDecisionPacket({
        ...(executionId
          ? {
              executionId,
            }
          : {}),
        ...(sessionId
          ? {
              sessionId,
            }
          : {}),
        locale: this.resolveEmbeddedCliLocale(),
      });
    } catch {
      return undefined;
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
   * Sends one free-form chat turn through the shared `session.main` service route.
   * @param userMessage Operator-authored prompt to route through the governed conversation seam.
   * @returns Structured session-turn output projected from the terminal turn event payload.
   */
  public async executeMainSessionTurn(
    userMessage: string,
  ): Promise<VsCodeExtensionSessionTurnResult> {
    const trimmedUserMessage = userMessage.trim();
    if (trimmedUserMessage.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        'VS Code Governor chat requires one non-empty message.',
        {
          surface: 'vscode_extension_chat',
        },
      );
    }

    const client = await this.requireClient();
    const session = await this.resolveOrCreateMainSession();
    const previousLatestEventSequence = session.latestEventSequence;
    const turnResult = await client.sendSessionTurn({
      sessionId: session.sessionId,
      routeId: OrchestrationSessionRouteId.MAIN,
      userMessage: trimmedUserMessage,
      metadata: {
        locale: this.resolveEmbeddedCliLocale(),
      },
    });
    const subscription = await client.subscribeSession({
      sessionId: turnResult.session.sessionId,
      afterSequence: previousLatestEventSequence,
    });
    const completedEvent = this.findLatestSessionEvent(
      subscription.events,
      OrchestrationSessionEventType.TURN_COMPLETED,
    );
    const fallbackDeltaEvent = this.findLatestSessionEvent(
      subscription.events,
      OrchestrationSessionEventType.TURN_STREAM_DELTA,
    );
    const completionPayload = completedEvent?.payload ?? {};
    const fallbackAssistantMessage =
      this.readOptionalRecordString(fallbackDeltaEvent?.payload, 'accumulatedText') ??
      this.readOptionalRecordString(fallbackDeltaEvent?.payload, 'delta') ??
      this.localizeText(
        'The local orchestration service did not return one assistant message.',
        '本地编排服务没有返回 assistant 消息。',
      );
    this.rememberMainSession(turnResult.session.sessionId);

    return {
      sessionId: turnResult.session.sessionId,
      turnId: turnResult.turnId,
      assistantMessage:
        this.readOptionalRecordString(completionPayload, 'assistantMessage') ??
        fallbackAssistantMessage,
      responseMode: this.readOptionalRecordString(completionPayload, 'responseMode'),
      interactionMode: this.readOptionalRecordString(completionPayload, 'interactionMode'),
      executionIntent: this.readOptionalRecordString(completionPayload, 'executionIntent'),
      suggestedSlashCommand: this.readOptionalRecordString(
        completionPayload,
        'suggestedSlashCommand',
      ),
      handoffCommandPreview: this.readOptionalRecordString(
        completionPayload,
        'handoffCommandPreview',
      ),
      selectedSurface: this.readOptionalRecordString(completionPayload, 'selectedSurface'),
      selectedBy: this.readOptionalRecordString(completionPayload, 'selectedBy'),
      handoffExecutionMode: this.readOptionalRecordString(
        completionPayload,
        'handoffExecutionMode',
      ),
      sessionRoutingPreferenceApplied: completionPayload.sessionRoutingPreferenceApplied === true,
      commandBatches: this.readSessionCommandBatches(completionPayload.commandBatches),
      handoffBacklinks: this.readSessionHandoffBacklinks(completionPayload.handoffBacklinks),
    };
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
    const [
      workspaceContext,
      bootstrapReadiness,
      queueOverview,
      secureAuthoring,
      providerLifecycleSnapshots,
      selectedExecution,
    ] = await Promise.all([
      this.resolveWorkspaceContextSnapshot(),
      this.queryBootstrapReadiness(),
      this.queryQueueOverview(),
      this.resolveSecureAuthoringSnapshot(),
      this.resolveProviderLifecycleSnapshots(),
      this.resolveSelectedExecution(selection),
    ]);

    return {
      workspaceContext,
      ...(bootstrapReadiness
        ? {
            bootstrapReadiness,
          }
        : {}),
      queueOverview,
      ...(secureAuthoring
        ? {
            secureAuthoring,
          }
        : {}),
      ...(providerLifecycleSnapshots.length > 0
        ? {
            providerLifecycleSnapshots,
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
    const [
      workspaceContext,
      bootstrapReadiness,
      queueOverview,
      secureAuthoring,
      providerLifecycleSnapshots,
      selectedExecution,
      workflowDraftSession,
    ] = await Promise.all([
      this.resolveWorkspaceContextSnapshot(),
      this.queryBootstrapReadiness(),
      this.queryQueueOverview(),
      this.resolveSecureAuthoringSnapshot(),
      this.resolveProviderLifecycleSnapshots(),
      this.resolveSelectedExecution(selection),
      this.queryWorkflowDraftSession(
        selection.workflowDraftId
          ? {
              workflowDraftId: selection.workflowDraftId,
            }
          : {
              preferLatest: true,
            },
      ),
    ]);
    const [artifactPane, roleLaneStatus, sessionContinuity, hitlDecisionPacket] = await Promise.all(
      [
        selectedExecution
          ? this.queryArtifactPaneForExecution(
              selectedExecution.execution.executionId,
              selectedExecution.execution.executionSessionId,
            )
          : Promise.resolve(undefined),
        this.queryRoleLaneStatus(selectedExecution?.execution.executionId),
        this.querySessionContinuity(
          selectedExecution?.execution.executionSessionId,
          selectedExecution?.execution.executionId,
        ),
        this.queryHitlDecisionPacket(
          selectedExecution?.execution.executionId,
          selectedExecution?.execution.executionSessionId,
        ),
      ],
    );

    return {
      workspaceContext,
      ...(bootstrapReadiness
        ? {
            bootstrapReadiness,
          }
        : {}),
      queueOverview,
      ...(secureAuthoring
        ? {
            secureAuthoring,
          }
        : {}),
      ...(providerLifecycleSnapshots.length > 0
        ? {
            providerLifecycleSnapshots,
          }
        : {}),
      ...(selectedExecution
        ? {
            selectedExecution,
          }
        : {}),
      ...(workflowDraftSession
        ? {
            workflowDraftSession,
          }
        : {}),
      ...(selection.workflowFocusStageId
        ? {
            workflowFocusStageId: selection.workflowFocusStageId,
          }
        : {}),
      ...(selection.workflowFocusBacklinkTarget
        ? {
            workflowFocusBacklinkTarget: selection.workflowFocusBacklinkTarget,
          }
        : {}),
      ...(selection.workflowFocusBacklinkKind
        ? {
            workflowFocusBacklinkKind: selection.workflowFocusBacklinkKind,
          }
        : {}),
      ...(roleLaneStatus.returnedCount > 0
        ? {
            roleLaneStatus,
          }
        : {}),
      ...(artifactPane
        ? {
            artifactPane,
          }
        : {}),
      ...(sessionContinuity
        ? {
            sessionContinuity,
          }
        : {}),
      ...(hitlDecisionPacket
        ? {
            hitlDecisionPacket,
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
   * Resolves bootstrap/readiness facts through the local orchestration service seam.
   * @returns Service-owned bootstrap readiness snapshot when a workspace is open.
   */
  public async queryBootstrapReadiness(): Promise<
    OrchestrationBootstrapReadinessSnapshot | undefined
  > {
    const client = await this.resolveClient();
    if (!client) {
      return undefined;
    }

    try {
      return await client.queryBootstrapReadiness();
    } catch {
      return undefined;
    }
  }

  /**
   * Resolves user-config + secret-backend readiness through the service-owned workspace ops seam.
   * @returns One additive readiness snapshot, or a degraded snapshot when the service cannot
   * project the secure-authoring surface safely.
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
    this.secureAuthoringSnapshotPromise = (async () => {
      try {
        if (this.preferEmbeddedCliExecutor) {
          return await this.loadSecureAuthoringSnapshot(serviceWorkspaceContext.repositoryRoot);
        }

        const client = await this.requireClient();
        return await client.querySecureAuthoring({
          locale: this.resolveEmbeddedCliLocale(),
        });
      } catch (error) {
        return {
          degradedReason: standardizeError(error).message,
        };
      }
    })().then((snapshot) => {
      if (snapshot?.degradedReason) {
        this.clearSecureAuthoringSnapshotCache();
      }
      return snapshot;
    });
    return this.secureAuthoringSnapshotPromise;
  }

  /**
   * Persists one user-local default value through the service-owned workspace ops seam.
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
    const payload = this.preferEmbeddedCliExecutor
      ? await this.executeEmbeddedCliJsonCommand(
          {
            args: ['config', 'set', keyPath, value],
            currentWorkingDirectory: this.requireRepositoryRootForEmbeddedCli(),
          },
          'Failed to persist the requested user-local default.',
          '写入请求的用户本地默认值失败。',
        )
      : await (await this.requireClient()).setUserConfigValue({
          keyPath,
          value,
          locale: this.resolveEmbeddedCliLocale(),
        });
    this.clearSecureAuthoringSnapshotCache();
    return {
      message:
        typeof payload.message === 'string' && payload.message.trim().length > 0
          ? payload.message
          : this.readPayloadMessage(payload as VsCodeExtensionCliCommandSuccessPayload),
      configPath:
        'configPath' in payload
          ? payload.configPath
          : this.readDetailString(payload, 'config_path'),
      persistedValue:
        'persistedValue' in payload
          ? payload.persistedValue
          : this.readDetailString(payload, 'value'),
    };
  }

  /**
   * Clears one user-local default through the embedded CLI seam when a mutation must remove stale
   * compatibility state instead of persisting another value.
   * @param keyPath Canonical user-config key path to remove.
   */
  private async unsetUserConfigValueInEmbeddedCli(keyPath: string): Promise<void> {
    await this.executeEmbeddedCliJsonCommand(
      {
        args: ['config', 'unset', keyPath],
        currentWorkingDirectory: this.requireRepositoryRootForEmbeddedCli(),
      },
      'Failed to clear the requested user-local default.',
      '清除请求的用户本地默认值失败。',
    );
    this.clearSecureAuthoringSnapshotCache();
  }

  /**
   * Persists one managed secret value through the service-owned workspace ops seam without
   * exposing the raw value to argv, transcript, or local command previews.
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
    const payload = this.preferEmbeddedCliExecutor
      ? await this.executeEmbeddedCliJsonCommand(
          {
            args: [
              'secret',
              'set',
              keyName,
              ...(backendId ? ['--backend', backendId] : []),
              '--stdin',
            ],
            currentWorkingDirectory: this.requireRepositoryRootForEmbeddedCli(),
            stdin: value,
          },
          'Failed to write the requested managed secret.',
          '写入请求的受管 secret 失败。',
        )
      : await (await this.requireClient()).setManagedSecret({
          keyName,
          value,
          locale: this.resolveEmbeddedCliLocale(),
          ...(backendId
            ? {
                backendId,
              }
            : {}),
        });
    this.clearSecureAuthoringSnapshotCache();
    return {
      message:
        typeof payload.message === 'string' && payload.message.trim().length > 0
          ? payload.message
          : this.readPayloadMessage(payload as VsCodeExtensionCliCommandSuccessPayload),
      selector:
        'selector' in payload ? payload.selector : this.readDetailString(payload, 'selector'),
      backendId:
        'backendId' in payload ? payload.backendId : this.readDetailString(payload, 'backend'),
      warning: 'warning' in payload ? payload.warning : this.readDetailString(payload, 'warning'),
    };
  }

  /**
   * Resolves the service-owned provider-onboarding baseline for one VS Code host entrypoint.
   * @param tool Tool surface that will receive provider defaults.
   * @param entrypointKind Host-native entrypoint that requested the snapshot.
   * @param provider Optional provider override chosen by the host before apply.
   * @returns One typed snapshot that keeps host UX aligned with managed secret and selector truth.
   */
  public async resolveProviderOnboardingSnapshot(
    tool: AdapterSurface,
    entrypointKind: VsCodeExtensionProviderOnboardingEntrypointKind,
    provider?: AdapterProviderKind,
  ): Promise<VsCodeExtensionProviderOnboardingSnapshot | undefined> {
    if (!this.preferEmbeddedCliExecutor) {
      const client = await this.requireClient();
      return this.mapProviderOnboardingSnapshot(
        await client.queryProviderOnboarding({
          tool,
          entrypointKind,
          ...(provider
            ? {
                provider,
              }
            : {}),
          locale: this.resolveEmbeddedCliLocale(),
        }),
      );
    }

    const secureAuthoring = await this.resolveSecureAuthoringSnapshot();
    const resolvedState = this.resolveProviderOnboardingState(secureAuthoring, tool, provider);
    const warnings = this.buildProviderOnboardingWarnings(
      secureAuthoring?.secretReadiness,
      resolvedState.credentialRef,
    );

    return {
      surfaceId: VSCODE_EXTENSION_PROVIDER_ONBOARDING_SURFACE_ID,
      entrypointKind,
      mutationMode: VSCODE_EXTENSION_PROVIDER_ONBOARDING_MUTATION_MODE,
      tool,
      transport: AdapterTransportKind.REMOTE_API,
      provider: resolvedState.provider,
      vendorBinding: resolvedState.vendorBinding,
      secretCaptureMode: VSCODE_EXTENSION_PROVIDER_ONBOARDING_SECRET_CAPTURE_MODE,
      secretOwner: VSCODE_EXTENSION_PROVIDER_ONBOARDING_SECRET_OWNER,
      credentialRefStrategy: VSCODE_EXTENSION_PROVIDER_ONBOARDING_CREDENTIAL_REF_STRATEGY,
      readinessProjectionSource:
        VSCODE_EXTENSION_PROVIDER_ONBOARDING_READINESS_PROJECTION_SOURCES.SNAPSHOT,
      configTargets: this.resolveProviderOnboardingConfigTargets(tool),
      receiptFields: VSCODE_EXTENSION_PROVIDER_ONBOARDING_RECEIPT_FIELDS,
      credentialRef: resolvedState.credentialRef,
      ...(resolvedState.model
        ? {
            model: resolvedState.model,
          }
        : {}),
      ...(resolvedState.endpoint
        ? {
            endpoint: resolvedState.endpoint,
          }
        : {}),
      ...(secureAuthoring?.secretReadiness?.selectedBackendId
        ? {
            selectedBackendId: secureAuthoring.secretReadiness.selectedBackendId,
          }
        : {}),
      ...(secureAuthoring?.secretReadiness?.defaultBackendId
        ? {
            defaultBackendId: secureAuthoring.secretReadiness.defaultBackendId,
          }
        : {}),
      availableBackends: secureAuthoring?.secretReadiness?.backends ?? [],
      warnings,
    };
  }

  /**
   * Resolves host-facing provider lifecycle summaries for the current workspace without inventing
   * a second readiness taxonomy outside the provider-onboarding and secure-authoring seams.
   * @returns Provider lifecycle snapshots ordered by visible workbench priority.
   */
  public async resolveProviderLifecycleSnapshots(): Promise<
    readonly VsCodeExtensionProviderLifecycleSnapshot[]
  > {
    const secureAuthoring = await this.resolveSecureAuthoringSnapshot();
    const tools = this.resolveProviderLifecycleTools(secureAuthoring);
    const snapshots = await Promise.all(
      tools.map(async (tool) => {
        try {
          const snapshot = await this.resolveProviderOnboardingSnapshot(
            tool,
            VSCODE_EXTENSION_PROVIDER_ONBOARDING_ENTRYPOINT_KINDS.OVERVIEW_CTA,
          );
          return snapshot
            ? this.buildProviderLifecycleSnapshot(snapshot, secureAuthoring)
            : undefined;
        } catch {
          return undefined;
        }
      }),
    );

    return snapshots.filter((snapshot): snapshot is VsCodeExtensionProviderLifecycleSnapshot =>
      Boolean(snapshot),
    );
  }

  /**
   * Applies one explicit provider-onboarding mutation through the managed secret and config seams.
   * @param request One direct-onboarding request carrying the redacted authoring boundary.
   * @returns Redacted receipt that the host can surface without leaking raw API-key content.
   */
  public async applyProviderOnboarding(
    request: VsCodeExtensionProviderOnboardingApplyRequest,
  ): Promise<VsCodeExtensionProviderOnboardingApplyReceipt> {
    if (!this.preferEmbeddedCliExecutor) {
      const client = await this.requireClient();
      return this.mapProviderOnboardingApplyReceipt(
        await client.applyProviderOnboarding({
          ...request,
          locale: this.resolveEmbeddedCliLocale(),
        }),
      );
    }

    const reuseExistingCredential = request.reuseExistingCredential === true;
    const normalizedApiKey = request.apiKey.trim();
    if (!reuseExistingCredential && normalizedApiKey.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'Provider onboarding requires one non-empty API key value.',
      );
    }
    const normalizedModel = request.model.trim();
    if (normalizedModel.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'Provider onboarding requires one non-empty model value.',
      );
    }

    const snapshot = await this.resolveProviderOnboardingSnapshot(
      request.tool,
      request.entrypointKind,
      request.provider,
    );
    if (!snapshot) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'Provider onboarding snapshot is unavailable for the current workspace.',
      );
    }

    const backendId = this.resolveProviderOnboardingBackendId(
      snapshot.availableBackends,
      request.backendId,
      snapshot.defaultBackendId,
      snapshot.selectedBackendId,
    );
    const secretKeyName = this.extractManagedSecretKeyName(snapshot.credentialRef);
    if (!secretKeyName) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Provider onboarding credentialRef must use ${CREDENTIAL_SELECTOR_PREFIX} selectors.`,
      );
    }

    const secureAuthoring = await this.resolveSecureAuthoringSnapshot();
    if (secureAuthoring?.degradedReason || !secureAuthoring?.secretReadiness) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        secureAuthoring?.degradedReason ??
          'Provider onboarding secure-authoring snapshot is unavailable for the current workspace.',
      );
    }
    const existingCredentialRecord = this.findManagedSecretRecord(
      secureAuthoring.secretReadiness.records,
      secretKeyName,
      backendId,
    );
    if (reuseExistingCredential) {
      if (!existingCredentialRecord || existingCredentialRecord.backendId !== backendId) {
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
          `Provider onboarding can reuse ${snapshot.credentialRef} only when the managed secret already exists on backend ${backendId}.`,
        );
      }
    } else if (existingCredentialRecord) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Provider onboarding will not overwrite existing managed secret ${snapshot.credentialRef}. Use the dedicated update/reconnect flow instead.`,
      );
    }

    const secretResult = reuseExistingCredential
      ? {
          selector: snapshot.credentialRef,
          backendId,
          warning: undefined,
        }
      : await this.setManagedSecret(secretKeyName, normalizedApiKey, backendId);
    const endpointKeyPath = `tools.${request.tool}.remoteApi.endpoint`;
    const configWrites = [
      {
        keyPath: `tools.${request.tool}.transport`,
        value: AdapterTransportKind.REMOTE_API,
      },
      {
        keyPath: `tools.${request.tool}.remoteApi.provider`,
        value: snapshot.provider,
      },
      {
        keyPath: `tools.${request.tool}.remoteApi.vendorBinding`,
        value: snapshot.vendorBinding,
      },
      {
        keyPath: `tools.${request.tool}.remoteApi.model`,
        value: normalizedModel,
      },
      {
        keyPath: `tools.${request.tool}.remoteApi.credentialRef`,
        value: snapshot.credentialRef,
      },
    ];
    for (const write of configWrites) {
      await this.setUserConfigValue(write.keyPath, write.value);
    }
    const configTargets = configWrites.map((write) => write.keyPath);
    if (request.endpoint !== undefined) {
      if (request.endpoint.trim().length > 0) {
        await this.setUserConfigValue(endpointKeyPath, request.endpoint.trim());
      } else {
        await this.unsetUserConfigValueInEmbeddedCli(endpointKeyPath);
      }
      configTargets.push(endpointKeyPath);
    }
    configTargets.push(`tools.${request.tool}.remoteApi.credentialEnvVar`);
    await this.unsetUserConfigValueInEmbeddedCli(
      `tools.${request.tool}.remoteApi.credentialEnvVar`,
    );

    return {
      surfaceId: VSCODE_EXTENSION_PROVIDER_ONBOARDING_SURFACE_ID,
      entrypointKind: request.entrypointKind,
      mutationMode: VSCODE_EXTENSION_PROVIDER_ONBOARDING_MUTATION_MODE,
      tool: request.tool,
      transport: AdapterTransportKind.REMOTE_API,
      provider: snapshot.provider,
      vendorBinding: snapshot.vendorBinding,
      credentialRef: secretResult.selector ?? snapshot.credentialRef,
      secretBackend: secretResult.backendId ?? backendId,
      configTargets,
      receiptFields: VSCODE_EXTENSION_PROVIDER_ONBOARDING_RECEIPT_FIELDS,
      warnings: [...snapshot.warnings, ...(secretResult.warning ? [secretResult.warning] : [])],
      nextAction: VSCODE_EXTENSION_COMMAND_IDS.RUN_CONNECT,
    };
  }

  /**
   * Runs one service-owned workspace operation and returns the structured result.
   * @param operationKind Stable workspace operation kind.
   * @param arguments Optional operation-specific arguments.
   * @returns Structured execution summary from the local orchestration service.
   */
  public async runWorkspaceOperation(
    operationKind: OrchestrationWorkspaceOperationKind,
    argumentsRecord?: Record<string, boolean | number | string | readonly string[] | null>,
  ): Promise<OrchestrationWorkspaceOperationResponse> {
    const client = await this.requireClient();
    return client.runWorkspaceOperation({
      operationKind,
      locale: this.resolveEmbeddedCliLocale(),
      ...(argumentsRecord
        ? {
            arguments: argumentsRecord,
          }
        : {}),
    });
  }

  public async queryWorkflowDraftSession(
    request?: OrchestrationWorkflowDraftSessionQueryRequest,
  ): Promise<OrchestrationWorkflowDraftSession | undefined> {
    const client = await this.resolveClient();
    if (!client) {
      return undefined;
    }

    try {
      return await client.queryWorkflowDraftSession({
        ...(request ?? {}),
        locale: this.resolveEmbeddedCliLocale(),
      });
    } catch (error) {
      const standardizedError = standardizeError(error);
      if (standardizedError.code === GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED) {
        throw error;
      }

      return undefined;
    }
  }

  /**
   * Queries one workflow draft-session for mutating flows where backend failures must surface.
   * @param request Optional workflow draft query selector.
   * @returns The queried draft-session, or `undefined` when no draft exists yet.
   */
  public async queryWorkflowDraftSessionStrict(
    request?: OrchestrationWorkflowDraftSessionQueryRequest,
  ): Promise<OrchestrationWorkflowDraftSession | undefined> {
    const client = await this.requireClient();
    return client.queryWorkflowDraftSession({
      ...(request ?? {}),
      locale: this.resolveEmbeddedCliLocale(),
    });
  }

  public async startWorkflowDraft(
    request: OrchestrationStartWorkflowDraftRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    const client = await this.requireClient();
    return client.startWorkflowDraft({
      ...request,
      locale: this.resolveEmbeddedCliLocale(),
    });
  }

  public async updateWorkflowDraftNode(
    request: OrchestrationUpdateWorkflowDraftNodeRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    const client = await this.requireClient();
    return client.updateWorkflowDraftNode({
      ...request,
      locale: this.resolveEmbeddedCliLocale(),
    });
  }

  public async updateWorkflowDraftEdge(
    request: OrchestrationUpdateWorkflowDraftEdgeRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    const client = await this.requireClient();
    return client.updateWorkflowDraftEdge({
      ...request,
      locale: this.resolveEmbeddedCliLocale(),
    });
  }

  public async updateWorkflowDraftPolicy(
    request: OrchestrationUpdateWorkflowDraftPolicyRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    const client = await this.requireClient();
    return client.updateWorkflowDraftPolicy({
      ...request,
      locale: this.resolveEmbeddedCliLocale(),
    });
  }

  public async validateWorkflowDraft(
    request: OrchestrationValidateWorkflowDraftRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    const client = await this.requireClient();
    return client.validateWorkflowDraft({
      ...request,
      locale: this.resolveEmbeddedCliLocale(),
    });
  }

  public async commitWorkflowDraft(
    request: OrchestrationCommitWorkflowDraftRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    const client = await this.requireClient();
    return client.commitWorkflowDraft({
      ...request,
      locale: this.resolveEmbeddedCliLocale(),
    });
  }

  /**
   * Disposes any live sidecar client owned by the extension host.
   * @returns Promise that settles after disposal finishes.
   */
  public async dispose(): Promise<void> {
    if (!this.clientPromise) {
      this.clientWorkspaceRoot = undefined;
      this.clientRepositoryRoot = undefined;
      this.mainSessionId = undefined;
      this.mainSessionWorkspaceRoot = undefined;
      this.mainSessionRepositoryRoot = undefined;
      return;
    }

    const client = await this.clientPromise.catch(() => undefined);
    this.clientPromise = null;
    this.clientWorkspaceRoot = undefined;
    this.clientRepositoryRoot = undefined;
    this.mainSessionId = undefined;
    this.mainSessionWorkspaceRoot = undefined;
    this.mainSessionRepositoryRoot = undefined;
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

  private async resolveOrCreateMainSession() {
    const client = await this.requireClient();
    const openedWorkspaceRoot = this.getWorkspaceRoot();
    const serviceWorkspaceContext = openedWorkspaceRoot
      ? this.resolveServiceWorkspaceContext(openedWorkspaceRoot)
      : undefined;

    if (
      this.mainSessionId &&
      this.mainSessionWorkspaceRoot === serviceWorkspaceContext?.governanceWorkspaceRoot &&
      this.mainSessionRepositoryRoot === serviceWorkspaceContext?.repositoryRoot
    ) {
      const existingSession = await client.getSession(this.mainSessionId);
      if (existingSession?.status === OrchestrationSessionStatus.ACTIVE) {
        return existingSession;
      }
    }

    const startedSession = await client.startSession({
      routeId: OrchestrationSessionRouteId.MAIN,
      initialContext: {
        surface: 'vscode_extension_chat',
      },
    });
    this.rememberMainSession(startedSession.session.sessionId);
    return startedSession.session;
  }

  private rememberMainSession(sessionId: string): void {
    const openedWorkspaceRoot = this.getWorkspaceRoot();
    const serviceWorkspaceContext = openedWorkspaceRoot
      ? this.resolveServiceWorkspaceContext(openedWorkspaceRoot)
      : undefined;
    this.mainSessionId = sessionId;
    this.mainSessionWorkspaceRoot = serviceWorkspaceContext?.governanceWorkspaceRoot;
    this.mainSessionRepositoryRoot = serviceWorkspaceContext?.repositoryRoot;
  }

  private findLatestSessionEvent(
    events: readonly OrchestrationSessionEvent[],
    eventType: OrchestrationSessionEventType,
  ): OrchestrationSessionEvent | undefined {
    return [...events].reverse().find((event) => event.type === eventType);
  }

  private readOptionalRecordString(
    record: Record<string, unknown> | undefined,
    key: string,
  ): string | undefined {
    const value = record?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private readSessionCommandBatches(value: unknown): readonly VsCodeExtensionSessionCommandBatch[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object',
      )
      .map((entry) => ({
        slashQuery: this.readOptionalRecordString(entry, 'slashQuery'),
        bridgeArgv: Array.isArray(entry.bridgeArgv)
          ? entry.bridgeArgv.filter(
              (argvEntry): argvEntry is string =>
                typeof argvEntry === 'string' && argvEntry.trim().length > 0,
            )
          : undefined,
        previewCommandLine: this.readOptionalRecordString(entry, 'previewCommandLine'),
      }));
  }

  private readSessionHandoffBacklinks(
    value: unknown,
  ): readonly VsCodeExtensionSessionHandoffBacklink[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object',
      )
      .map((entry) => ({
        kind: this.readOptionalRecordString(entry, 'kind'),
        label: this.readOptionalRecordString(entry, 'label'),
        target: this.readOptionalRecordString(entry, 'target'),
      }));
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
        env: {
          ...process.env,
          [LOCAL_ORCHESTRATION_SERVICE_SIDECAR_LOCALE_ENV]: this.resolveEmbeddedCliLocale(),
        },
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
    const cliModulePath = this.resolveEmbeddedCliModulePath();
    const cliArgv = [
      '--locale',
      this.resolveEmbeddedCliLocale(),
      '--output',
      'json',
      '--no-color',
      '--no-interactive',
      ...request.args,
    ];
    return new Promise<unknown>((resolvePromise, reject) => {
      const childProcess = spawn(
        process.execPath,
        [
          '--input-type=module',
          '--eval',
          this.renderEmbeddedCliBootstrapSource(
            cliModulePath,
            this.resolveEmbeddedCliBootstrapFailureMessage(),
          ),
        ],
        {
          cwd: request.currentWorkingDirectory,
          env: {
            ...process.env,
            [EMBEDDED_CLI_ARGV_ENVIRONMENT_KEY]: JSON.stringify(cliArgv),
          },
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

  private resolveEmbeddedCliModulePath(): string {
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

  private renderEmbeddedCliBootstrapSource(cliModulePath: string, failureMessage: string): string {
    return [
      `const cliModule = await import(${JSON.stringify(pathToFileURL(cliModulePath).href)});`,
      "if (typeof cliModule.runCli !== 'function') {",
      `  process.stderr.write(JSON.stringify({ error_code: ${JSON.stringify(GovernorErrorCode.UNKNOWN)}, message: ${JSON.stringify(failureMessage)} }));`,
      '  process.exit(1);',
      '}',
      `const cliArgv = JSON.parse(process.env.${EMBEDDED_CLI_ARGV_ENVIRONMENT_KEY} ?? '[]');`,
      "process.exitCode = await cliModule.runCli(['node', 'repo-ai-governor', ...cliArgv]);",
    ].join('\n');
  }

  private resolveEmbeddedCliBootstrapFailureMessage(): string {
    return this.localizeText(
      'The embedded CLI module did not expose runCli().',
      '当前内嵌 CLI 模块未导出 runCli()。',
    );
  }

  private resolveEmbeddedCliLocale(): string {
    const normalizedLanguage = vscode.env.language.trim();
    return normalizedLanguage.length > 0 ? normalizedLanguage : 'en-US';
  }

  private localizeText(english: string, chinese: string): string {
    return vscode.env.language.trim().toLowerCase().startsWith('zh') ? chinese : english;
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

  private resolveProviderOnboardingState(
    secureAuthoring: VsCodeExtensionSecureAuthoringSnapshot | undefined,
    tool: AdapterSurface,
    provider?: AdapterProviderKind,
  ): VsCodeExtensionResolvedProviderOnboardingState {
    const configuredProvider = this.readUserConfigEntryValue(
      secureAuthoring,
      tool,
      'remoteApi.provider',
    );
    const resolvedProvider =
      provider ??
      (configuredProvider &&
      Object.values(AdapterProviderKind).includes(configuredProvider as AdapterProviderKind)
        ? (configuredProvider as AdapterProviderKind)
        : this.resolveDefaultRemoteApiProvider(tool));
    const resolvedCompatibility = this.resolveProviderOnboardingCompatibility(
      tool,
      resolvedProvider,
    );
    const configuredVendorBinding = this.readUserConfigEntryValue(
      secureAuthoring,
      tool,
      'remoteApi.vendorBinding',
    );
    if (
      configuredVendorBinding &&
      Object.values(AdapterVendorBindingKind).includes(
        configuredVendorBinding as AdapterVendorBindingKind,
      ) &&
      configuredVendorBinding !== resolvedCompatibility.vendorBinding
    ) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Provider onboarding requires ${resolvedCompatibility.vendorBinding} when tool ${tool} uses provider ${resolvedCompatibility.provider}.`,
      );
    }
    const credentialRef =
      this.readUserConfigEntryValue(secureAuthoring, tool, 'remoteApi.credentialRef') ??
      this.resolveDefaultCredentialRefSelector(resolvedCompatibility.provider);

    return {
      provider: resolvedCompatibility.provider,
      vendorBinding: resolvedCompatibility.vendorBinding,
      credentialRef,
      ...(this.readUserConfigEntryValue(secureAuthoring, tool, 'remoteApi.model')
        ? {
            model: this.readUserConfigEntryValue(secureAuthoring, tool, 'remoteApi.model'),
          }
        : {}),
      ...(this.readUserConfigEntryValue(secureAuthoring, tool, 'remoteApi.endpoint')
        ? {
            endpoint: this.readUserConfigEntryValue(secureAuthoring, tool, 'remoteApi.endpoint'),
          }
        : {}),
    };
  }

  private resolveProviderLifecycleTools(
    secureAuthoring: VsCodeExtensionSecureAuthoringSnapshot | undefined,
  ): readonly AdapterSurface[] {
    const configuredTools = new Set<AdapterSurface>();
    for (const entry of secureAuthoring?.userConfig?.entries ?? []) {
      const match = /^tools\.([^.]+)\./u.exec(entry.keyPath);
      const toolId = match?.[1];
      if (!toolId || !Object.values(AdapterSurface).includes(toolId as AdapterSurface)) {
        continue;
      }
      configuredTools.add(toolId as AdapterSurface);
    }

    if (configuredTools.size === 0) {
      configuredTools.add(AdapterSurface.CODEX);
    }

    return [...configuredTools];
  }

  private buildProviderLifecycleSnapshot(
    snapshot: VsCodeExtensionProviderOnboardingSnapshot,
    secureAuthoring: VsCodeExtensionSecureAuthoringSnapshot | undefined,
  ): VsCodeExtensionProviderLifecycleSnapshot {
    const configuredCredentialRef = this.readUserConfigEntryValue(
      secureAuthoring,
      snapshot.tool,
      'remoteApi.credentialRef',
    );
    const configuredModel = this.readUserConfigEntryValue(
      secureAuthoring,
      snapshot.tool,
      'remoteApi.model',
    );
    const preferredBackendId = this.resolveProviderLifecyclePreferredBackendId(snapshot);
    const keyName = this.extractManagedSecretKeyName(snapshot.credentialRef);
    const credentialResolved =
      keyName && secureAuthoring?.secretReadiness
        ? Boolean(
            this.findManagedSecretRecord(
              secureAuthoring.secretReadiness.records,
              keyName,
              preferredBackendId,
            ),
          )
        : false;
    const preferredBackendWarning =
      preferredBackendId &&
      snapshot.availableBackends.find((backend) => backend.backendId === preferredBackendId)
        ?.warning;
    const degradedReason =
      secureAuthoring?.degradedReason ??
      preferredBackendWarning ??
      (snapshot.availableBackends.some((backend) => backend.available)
        ? undefined
        : 'Provider onboarding does not currently have a writable managed secret backend.');

    const status = degradedReason
      ? VSCODE_EXTENSION_PROVIDER_LIFECYCLE_STATUSES.DEGRADED
      : !configuredCredentialRef || !configuredModel
        ? VSCODE_EXTENSION_PROVIDER_LIFECYCLE_STATUSES.CONNECT_REQUIRED
        : credentialResolved
          ? VSCODE_EXTENSION_PROVIDER_LIFECYCLE_STATUSES.READY
          : VSCODE_EXTENSION_PROVIDER_LIFECYCLE_STATUSES.RECONNECT_REQUIRED;

    const availableActions =
      status === VSCODE_EXTENSION_PROVIDER_LIFECYCLE_STATUSES.DEGRADED
        ? [
            VSCODE_EXTENSION_PROVIDER_LIFECYCLE_ACTION_IDS.RUN_DOCTOR,
            ...(configuredCredentialRef
              ? [VSCODE_EXTENSION_PROVIDER_LIFECYCLE_ACTION_IDS.UPDATE_API_KEY]
              : []),
          ]
        : status === VSCODE_EXTENSION_PROVIDER_LIFECYCLE_STATUSES.CONNECT_REQUIRED
          ? [VSCODE_EXTENSION_PROVIDER_LIFECYCLE_ACTION_IDS.CONNECT_PROVIDER]
          : status === VSCODE_EXTENSION_PROVIDER_LIFECYCLE_STATUSES.RECONNECT_REQUIRED
            ? [
                VSCODE_EXTENSION_PROVIDER_LIFECYCLE_ACTION_IDS.UPDATE_API_KEY,
                VSCODE_EXTENSION_PROVIDER_LIFECYCLE_ACTION_IDS.RUN_DOCTOR,
              ]
            : [
                VSCODE_EXTENSION_PROVIDER_LIFECYCLE_ACTION_IDS.UPDATE_API_KEY,
                ...(configuredModel && credentialResolved
                  ? [VSCODE_EXTENSION_PROVIDER_LIFECYCLE_ACTION_IDS.RECONNECT_PROVIDER]
                  : []),
              ];

    return {
      tool: snapshot.tool,
      provider: snapshot.provider,
      vendorBinding: snapshot.vendorBinding,
      readinessProjectionSource: snapshot.readinessProjectionSource,
      status,
      availableActions,
      credentialRef: snapshot.credentialRef,
      ...(snapshot.model
        ? {
            model: snapshot.model,
          }
        : {}),
      ...(snapshot.endpoint
        ? {
            endpoint: snapshot.endpoint,
          }
        : {}),
      ...(preferredBackendId
        ? {
            preferredBackendId,
          }
        : {}),
      ...(snapshot.defaultBackendId
        ? {
            defaultBackendId: snapshot.defaultBackendId,
          }
        : {}),
      ...(snapshot.selectedBackendId
        ? {
            selectedBackendId: snapshot.selectedBackendId,
          }
        : {}),
      configuredCredentialRef: Boolean(configuredCredentialRef),
      configuredModel: Boolean(configuredModel),
      credentialResolved,
      ...(degradedReason
        ? {
            degradedReason,
          }
        : {}),
      warnings: [...snapshot.warnings],
    };
  }

  private buildProviderOnboardingWarnings(
    secretReadiness: VsCodeExtensionSecretReadinessSnapshot | undefined,
    credentialRef: string,
  ): string[] {
    const warnings =
      secretReadiness?.backends
        .map((backend) => backend.warning)
        .filter((warning): warning is string => Boolean(warning)) ?? [];
    if (secretReadiness?.unresolvedCredentialRefs.includes(credentialRef)) {
      warnings.push(`${credentialRef} does not resolve through the current managed backend state.`);
    }
    return warnings;
  }

  private mapProviderOnboardingSnapshot(
    snapshot: OrchestrationProviderOnboardingSnapshot,
  ): VsCodeExtensionProviderOnboardingSnapshot {
    return {
      ...snapshot,
      entrypointKind: snapshot.entrypointKind as VsCodeExtensionProviderOnboardingEntrypointKind,
      readinessProjectionSource:
        snapshot.readinessProjectionSource as VsCodeExtensionProviderOnboardingSnapshot['readinessProjectionSource'],
      availableBackends: [...snapshot.availableBackends],
      configTargets: [...snapshot.configTargets],
      receiptFields: [...snapshot.receiptFields],
      warnings: [...snapshot.warnings],
    };
  }

  private mapProviderOnboardingApplyReceipt(
    receipt: OrchestrationApplyProviderOnboardingResponse,
  ): VsCodeExtensionProviderOnboardingApplyReceipt {
    return {
      ...receipt,
      entrypointKind: receipt.entrypointKind as VsCodeExtensionProviderOnboardingEntrypointKind,
      configTargets: [...receipt.configTargets],
      receiptFields: [...receipt.receiptFields],
      warnings: [...receipt.warnings],
    };
  }

  private resolveProviderOnboardingConfigTargets(tool: AdapterSurface): string[] {
    return VSCODE_EXTENSION_PROVIDER_ONBOARDING_CONFIG_TARGET_SUFFIXES.map(
      (suffix) => `tools.${tool}.${suffix}`,
    );
  }

  private resolveProviderLifecyclePreferredBackendId(
    snapshot: VsCodeExtensionProviderOnboardingSnapshot,
  ): string | undefined {
    if (!snapshot.availableBackends.some((backend) => backend.available)) {
      return undefined;
    }

    return this.resolveProviderOnboardingBackendId(
      snapshot.availableBackends,
      undefined,
      snapshot.defaultBackendId,
      snapshot.selectedBackendId,
    );
  }

  private resolveProviderOnboardingBackendId(
    availableBackends: readonly VsCodeExtensionSecretBackendStatusSnapshot[],
    requestedBackendId?: string,
    defaultBackendId?: string,
    selectedBackendId?: string,
  ): string {
    const writableBackends = availableBackends.filter((backend) => backend.available);
    const matchedRequestedBackend =
      requestedBackendId &&
      writableBackends.find((backend) => backend.backendId === requestedBackendId);
    if (requestedBackendId && !matchedRequestedBackend) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Requested secret backend ${requestedBackendId} is not writable for provider onboarding.`,
      );
    }
    if (matchedRequestedBackend) {
      return matchedRequestedBackend.backendId;
    }

    const matchedDefaultBackend =
      defaultBackendId &&
      writableBackends.find((backend) => backend.backendId === defaultBackendId);
    if (matchedDefaultBackend) {
      return matchedDefaultBackend.backendId;
    }
    if (defaultBackendId) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Default secret backend ${defaultBackendId} is not writable for provider onboarding.`,
      );
    }

    const matchedSelectedBackend =
      selectedBackendId &&
      writableBackends.find((backend) => backend.backendId === selectedBackendId);
    if (matchedSelectedBackend) {
      return matchedSelectedBackend.backendId;
    }
    if (selectedBackendId) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Selected secret backend ${selectedBackendId} is not writable for provider onboarding.`,
      );
    }

    const fallbackBackend = writableBackends[0];
    if (!fallbackBackend) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'No writable secret backend is available for provider onboarding.',
      );
    }

    return fallbackBackend.backendId;
  }

  private findManagedSecretRecord(
    records: readonly VsCodeExtensionSecretRecordSnapshot[],
    keyName: string,
    preferredBackendId?: string,
  ): VsCodeExtensionSecretRecordSnapshot | undefined {
    return (
      (preferredBackendId
        ? records.find(
            (record) =>
              record.keyName === keyName &&
              record.backendId === preferredBackendId &&
              record.exists,
          )
        : undefined) ?? records.find((record) => record.keyName === keyName && record.exists)
    );
  }

  private extractManagedSecretKeyName(selector: string): string | undefined {
    if (!selector.startsWith(CREDENTIAL_SELECTOR_PREFIX)) {
      return undefined;
    }

    const keyName = selector.slice(CREDENTIAL_SELECTOR_PREFIX.length).trim();
    return keyName.length > 0 ? keyName : undefined;
  }

  private readUserConfigEntryValue(
    secureAuthoring: VsCodeExtensionSecureAuthoringSnapshot | undefined,
    tool: AdapterSurface,
    suffix: string,
  ): string | undefined {
    return secureAuthoring?.userConfig?.entries.find(
      (entry) => entry.keyPath === `tools.${tool}.${suffix}`,
    )?.value;
  }

  private resolveDefaultRemoteApiProvider(tool: AdapterSurface): AdapterProviderKind {
    return tool === AdapterSurface.CLAUDE_CODE
      ? AdapterProviderKind.ANTHROPIC
      : AdapterProviderKind.OPENAI;
  }

  private resolveProviderOnboardingCompatibility(
    tool: AdapterSurface,
    provider: AdapterProviderKind,
  ): {
    provider: AdapterProviderKind;
    vendorBinding: AdapterVendorBindingKind;
  } {
    switch (tool) {
      case AdapterSurface.CODEX:
        if (provider !== AdapterProviderKind.OPENAI) {
          throw new RuntimeError(
            GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
            `Provider onboarding only supports provider ${AdapterProviderKind.OPENAI} for tool ${tool}.`,
          );
        }
        return {
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        };
      case AdapterSurface.CLAUDE_CODE:
        if (provider !== AdapterProviderKind.ANTHROPIC) {
          throw new RuntimeError(
            GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
            `Provider onboarding only supports provider ${AdapterProviderKind.ANTHROPIC} for tool ${tool}.`,
          );
        }
        return {
          provider: AdapterProviderKind.ANTHROPIC,
          vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        };
      default:
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
          `Provider onboarding is not supported for tool ${tool}.`,
        );
    }
  }

  private resolveDefaultCredentialRefSelector(provider: AdapterProviderKind): string {
    return `${CREDENTIAL_SELECTOR_PREFIX}${provider}/api-key`;
  }
}
