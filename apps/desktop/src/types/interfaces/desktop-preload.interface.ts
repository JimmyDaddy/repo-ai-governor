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
import type { DesktopGovernanceConsoleViewModel } from './desktop-governance-console.interface.js';
import type { DesktopOrchestrationServiceRuntimeDependencies } from './desktop-orchestration-runtime.interface.js';
import type {
  DesktopLifecycleSnapshot,
  DesktopShellBootstrapSnapshot,
} from './desktop-shell.interface.js';

/**
 * Defines the typed preload API exposed to desktop renderer consumers.
 */
export interface DesktopPreloadBridgeApi {
  bootstrap(): Promise<DesktopShellBootstrapSnapshot>;
  getHealth(): Promise<OrchestrationServiceHealthResponse>;
  startExecution(
    request: OrchestrationStartExecutionRequest,
    runtimeContext?: LocalOrchestrationServiceStartExecutionRuntimeContext,
  ): Promise<OrchestrationStartExecutionResponse>;
  listExecutions(
    request?: OrchestrationListExecutionsRequest,
  ): Promise<OrchestrationListExecutionsResponse>;
  subscribeExecution(
    request: OrchestrationSubscribeExecutionRequest,
  ): Promise<OrchestrationSubscribeExecutionResponse>;
  startSession(): Promise<OrchestrationStartSessionResponse>;
  sendMainTurn(
    sessionId: string,
    userMessage: string,
  ): Promise<OrchestrationSendSessionTurnResponse>;
  appendMessage(
    sessionId: string,
    role: OrchestrationSessionTranscriptRole,
    lines: string[],
    metadata?: Record<string, unknown>,
  ): Promise<OrchestrationAppendSessionMessageResponse>;
  resumeSession(sessionId?: string): Promise<OrchestrationResumeSessionResponse>;
  listSessions(
    request?: OrchestrationListSessionsRequest,
  ): Promise<OrchestrationListSessionsResponse>;
  subscribeSession(
    request: OrchestrationSubscribeSessionRequest,
  ): Promise<OrchestrationSubscribeSessionResponse>;
  publishEvent(request: LocalOrchestrationServicePublishEventRequest): Promise<void>;
  getLifecycleSnapshot(): Promise<DesktopLifecycleSnapshot>;
  requestWindowWake(windowId: string): Promise<DesktopLifecycleSnapshot>;
  registerNotification(notificationId: string): Promise<DesktopLifecycleSnapshot>;
  restartServiceHost(reason?: string): Promise<DesktopLifecycleSnapshot>;
  buildGovernanceConsoleSnapshot(options: {
    locale: string;
    workspaceLabel: string;
    agentView?: ExecutionReportAgentView | null;
    executionLimit?: number;
  }): Promise<DesktopGovernanceConsoleViewModel>;
}

/**
 * Defines shell-bootstrap options exposed at the package root.
 */
export interface DesktopShellBootstrapDependencies {
  locale?: string;
  artifactQueryGateState?: import('../../constants/index.js').DesktopArtifactQueryGateState;
  runtimeDependencies?: DesktopOrchestrationServiceRuntimeDependencies;
}
