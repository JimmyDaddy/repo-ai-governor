import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from '@repo-ai-governor/core-orchestration-service';
import type {
  OrchestrationAppendSessionMessageResponse,
  OrchestrationListExecutionsRequest,
  OrchestrationListExecutionsResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationResumeSessionResponse,
  OrchestrationSendSessionTurnResponse,
  OrchestrationServiceHealthResponse,
  OrchestrationSessionTranscriptRole,
  OrchestrationStartExecutionRequest,
  OrchestrationStartExecutionResponse,
  OrchestrationStartSessionResponse,
  OrchestrationSubscribeExecutionRequest,
  OrchestrationSubscribeExecutionResponse,
  OrchestrationSubscribeSessionRequest,
  OrchestrationSubscribeSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import type { ExecutionReportAgentView } from '@repo-ai-governor/reporting';
import { DESKTOP_CONSOLE_DEFAULT_EXECUTION_LIMIT } from '../constants/index.js';
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

  public async listExecutions(
    request?: OrchestrationListExecutionsRequest,
  ): Promise<OrchestrationListExecutionsResponse> {
    return this.orchestrationRuntime.listExecutions(request);
  }

  public async subscribeExecution(
    request: OrchestrationSubscribeExecutionRequest,
  ): Promise<OrchestrationSubscribeExecutionResponse> {
    return this.orchestrationRuntime.subscribeExecution(request);
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
    const [health, sessions, executions, lifecycle] = await Promise.all([
      this.orchestrationRuntime.getHealth(),
      this.sessionBridge.listSessions({
        limit: 1,
      }),
      this.orchestrationRuntime.listExecutions({
        limit: options.executionLimit ?? DESKTOP_CONSOLE_DEFAULT_EXECUTION_LIMIT,
      }),
      this.getLifecycleSnapshot(),
    ]);

    return this.governanceConsoleBuilder.build({
      locale: options.locale,
      workspaceLabel: options.workspaceLabel,
      health,
      sessions: sessions.sessions,
      executions: executions.executions,
      lifecycle,
      ...(options.agentView
        ? {
            agentView: options.agentView,
          }
        : {}),
    });
  }
}
