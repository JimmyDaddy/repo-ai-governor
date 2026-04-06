import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from '@repo-ai-governor/core-orchestration-service';
import type {
  OrchestrationAppendSessionMessageResponse,
  OrchestrationArtifactPaneQueryRequest,
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationExecutionBoardQueryRequest,
  OrchestrationExecutionBoardQueryResponse,
  OrchestrationExecutionSummary,
  OrchestrationHitlInboxQueryRequest,
  OrchestrationHitlInboxQueryResponse,
  OrchestrationListExecutionsRequest,
  OrchestrationListExecutionsResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationQueueOverviewQueryRequest,
  OrchestrationQueueOverviewQueryResponse,
  OrchestrationRecoverExecutionRequest,
  OrchestrationRecoverExecutionResponse,
  OrchestrationResumeSessionResponse,
  OrchestrationSendSessionTurnResponse,
  OrchestrationServiceHealthResponse,
  OrchestrationSessionTranscriptRole,
  OrchestrationStartExecutionRequest,
  OrchestrationStartExecutionResponse,
  OrchestrationStartSessionResponse,
  OrchestrationSubmitHitlDecisionRequest,
  OrchestrationSubmitHitlDecisionResponse,
  OrchestrationSubscribeExecutionRequest,
  OrchestrationSubscribeExecutionResponse,
  OrchestrationSubscribeSessionRequest,
  OrchestrationSubscribeSessionResponse,
  OrchestrationTerminateExecutionRequest,
  OrchestrationTerminateExecutionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import type { ExecutionReportAgentView } from '@repo-ai-governor/reporting';
import {
  DESKTOP_CONSOLE_DEFAULT_EXECUTION_LIMIT,
  DesktopArtifactQueryGateState,
} from '../constants/index.js';
import type {
  DesktopGovernanceConsoleViewModel,
  DesktopLifecycleSnapshot,
  DesktopPreloadBridgeApi,
  DesktopShellBootstrapSnapshot,
} from '../types/interfaces/index.js';
import type { DesktopGovernanceConsoleViewModelBuilder } from './desktop-governance-console-view-model-builder.js';
import type { DesktopOrchestrationServiceRuntime } from './desktop-orchestration-service-runtime.js';
import type { DesktopRuntimeLifecycleGuard } from './desktop-runtime-lifecycle-guard.js';
import type { DesktopSessionBridge } from './desktop-session-bridge.js';

/**
 * Implements the typed preload bridge consumed by future desktop renderer surfaces.
 *
 * Why this exists:
 * desktop renderer consumers should see one narrow, typed contract that preserves service
 * ownership and lifecycle guards instead of importing runtime or reporting internals directly.
 */
export class DesktopPreloadBridge implements DesktopPreloadBridgeApi {
  public constructor(
    private readonly orchestrationRuntime: DesktopOrchestrationServiceRuntime,
    private readonly sessionBridge: DesktopSessionBridge,
    private readonly lifecycleGuard: DesktopRuntimeLifecycleGuard,
    private readonly governanceConsoleBuilder: DesktopGovernanceConsoleViewModelBuilder,
    private readonly bootstrapProvider: () => Promise<DesktopShellBootstrapSnapshot>,
    private readonly restartServiceHostProvider: (
      reason: string,
    ) => Promise<DesktopLifecycleSnapshot>,
  ) {}

  public async bootstrap(): Promise<DesktopShellBootstrapSnapshot> {
    return this.bootstrapProvider();
  }

  public async getHealth(): Promise<OrchestrationServiceHealthResponse> {
    return this.orchestrationRuntime.getHealth();
  }

  public async startExecution(
    request: OrchestrationStartExecutionRequest,
    runtimeContext?: LocalOrchestrationServiceStartExecutionRuntimeContext,
  ): Promise<OrchestrationStartExecutionResponse> {
    return this.orchestrationRuntime.startExecution(request, runtimeContext);
  }

  public async getExecution(
    executionId: string,
  ): Promise<OrchestrationExecutionSummary | undefined> {
    return this.orchestrationRuntime.getExecution(executionId);
  }

  public async queryExecutionBoard(
    request?: OrchestrationExecutionBoardQueryRequest,
  ): Promise<OrchestrationExecutionBoardQueryResponse> {
    return this.orchestrationRuntime.queryExecutionBoard(request);
  }

  public async queryHitlInbox(
    request?: OrchestrationHitlInboxQueryRequest,
  ): Promise<OrchestrationHitlInboxQueryResponse> {
    return this.orchestrationRuntime.queryHitlInbox(request);
  }

  public async queryQueueOverview(
    request?: OrchestrationQueueOverviewQueryRequest,
  ): Promise<OrchestrationQueueOverviewQueryResponse> {
    return this.orchestrationRuntime.queryQueueOverview(request);
  }

  public async listExecutions(
    request?: OrchestrationListExecutionsRequest,
  ): Promise<OrchestrationListExecutionsResponse> {
    return this.orchestrationRuntime.listExecutions(request);
  }

  public async queryArtifactPane(
    request?: OrchestrationArtifactPaneQueryRequest,
  ): Promise<OrchestrationArtifactPaneQueryResponse> {
    return this.orchestrationRuntime.queryArtifactPane(request);
  }

  public async subscribeExecution(
    request: OrchestrationSubscribeExecutionRequest,
  ): Promise<OrchestrationSubscribeExecutionResponse> {
    return this.orchestrationRuntime.subscribeExecution(request);
  }

  public async submitHitlDecision(
    request: OrchestrationSubmitHitlDecisionRequest,
  ): Promise<OrchestrationSubmitHitlDecisionResponse> {
    return this.orchestrationRuntime.submitHitlDecision(request);
  }

  public async recoverExecution(
    request: OrchestrationRecoverExecutionRequest,
  ): Promise<OrchestrationRecoverExecutionResponse> {
    return this.orchestrationRuntime.recoverExecution(request);
  }

  public async terminateExecution(
    request: OrchestrationTerminateExecutionRequest,
  ): Promise<OrchestrationTerminateExecutionResponse> {
    return this.orchestrationRuntime.terminateExecution(request);
  }

  public async startSession(): Promise<OrchestrationStartSessionResponse> {
    return this.sessionBridge.startSession();
  }

  public async sendMainTurn(
    sessionId: string,
    userMessage: string,
  ): Promise<OrchestrationSendSessionTurnResponse> {
    return this.sessionBridge.sendMainTurn(sessionId, userMessage);
  }

  public async appendMessage(
    sessionId: string,
    role: OrchestrationSessionTranscriptRole,
    lines: string[],
    metadata?: Record<string, unknown>,
  ): Promise<OrchestrationAppendSessionMessageResponse> {
    return this.sessionBridge.appendMessage(sessionId, role, lines, metadata);
  }

  public async resumeSession(sessionId?: string): Promise<OrchestrationResumeSessionResponse> {
    return this.sessionBridge.resumeSession(sessionId);
  }

  public async listSessions(
    request?: OrchestrationListSessionsRequest,
  ): Promise<OrchestrationListSessionsResponse> {
    return this.sessionBridge.listSessions(request);
  }

  public async subscribeSession(
    request: OrchestrationSubscribeSessionRequest,
  ): Promise<OrchestrationSubscribeSessionResponse> {
    return this.sessionBridge.subscribeSession(request);
  }

  public async publishEvent(request: LocalOrchestrationServicePublishEventRequest): Promise<void> {
    return this.orchestrationRuntime.publishEvent(request);
  }

  public async getLifecycleSnapshot(): Promise<DesktopLifecycleSnapshot> {
    const health = await this.orchestrationRuntime.getHealth();
    return this.lifecycleGuard.getSnapshot(health.lifecycleStatus);
  }

  public async requestWindowWake(windowId: string): Promise<DesktopLifecycleSnapshot> {
    const health = await this.orchestrationRuntime.getHealth();
    return this.lifecycleGuard.recordWindowWake(windowId, health.lifecycleStatus);
  }

  public async registerNotification(notificationId: string): Promise<DesktopLifecycleSnapshot> {
    const health = await this.orchestrationRuntime.getHealth();
    return this.lifecycleGuard.recordNotification(notificationId, health.lifecycleStatus);
  }

  public async restartServiceHost(
    reason = 'desktop_renderer_restart',
  ): Promise<DesktopLifecycleSnapshot> {
    return this.restartServiceHostProvider(reason);
  }

  public async buildGovernanceConsoleSnapshot(options: {
    locale: string;
    workspaceLabel: string;
    agentView?: ExecutionReportAgentView | null;
    executionLimit?: number;
  }): Promise<DesktopGovernanceConsoleViewModel> {
    const [health, sessions, executionBoard, hitlInbox, queueOverview, lifecycle] =
      await Promise.all([
        this.orchestrationRuntime.getHealth(),
        this.sessionBridge.listSessions({
          limit: 1,
        }),
        this.orchestrationRuntime.queryExecutionBoard({
          limit: options.executionLimit ?? DESKTOP_CONSOLE_DEFAULT_EXECUTION_LIMIT,
        }),
        this.orchestrationRuntime.queryHitlInbox({
          limit: options.executionLimit ?? DESKTOP_CONSOLE_DEFAULT_EXECUTION_LIMIT,
        }),
        this.orchestrationRuntime.queryQueueOverview({
          limit: options.executionLimit ?? DESKTOP_CONSOLE_DEFAULT_EXECUTION_LIMIT,
          laneLimit: options.executionLimit ?? DESKTOP_CONSOLE_DEFAULT_EXECUTION_LIMIT,
          workspaceLimit: options.executionLimit ?? DESKTOP_CONSOLE_DEFAULT_EXECUTION_LIMIT,
        }),
        this.getLifecycleSnapshot(),
      ]);
    const latestExecution = executionBoard.executions[0]?.execution;
    // Keep transcript selection aligned with sessionLane when a newer standalone session exists.
    const artifactPaneSessionId =
      sessions.sessions[0]?.sessionId ?? latestExecution?.executionSessionId;
    const artifactPane =
      lifecycle.artifactQueryGateState === DesktopArtifactQueryGateState.READY
        ? await this.orchestrationRuntime.queryArtifactPane({
            executionId: latestExecution?.executionId,
            sessionId: artifactPaneSessionId,
          })
        : undefined;

    return this.governanceConsoleBuilder.build({
      locale: options.locale,
      workspaceLabel: options.workspaceLabel,
      health,
      sessions: sessions.sessions,
      executionBoard,
      hitlInbox,
      queueOverview,
      lifecycle,
      ...(artifactPane
        ? {
            artifactPane,
          }
        : {}),
      ...(options.agentView
        ? {
            agentView: options.agentView,
          }
        : {}),
    });
  }
}
