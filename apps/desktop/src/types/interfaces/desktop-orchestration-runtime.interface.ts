import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceSaveCheckpointRequest,
  LocalOrchestrationServiceSidecarClientDependencies,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from '@repo-ai-governor/core-orchestration-service';
import type { LangGraphRecoveredExecution } from '@repo-ai-governor/core-runtime-langgraph';
import type {
  OrchestrationAppendSessionMessageRequest,
  OrchestrationAppendSessionMessageResponse,
  OrchestrationArtifactPaneQueryRequest,
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationExecutionSummary,
  OrchestrationListExecutionsRequest,
  OrchestrationListExecutionsResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationRecoverExecutionRequest,
  OrchestrationRecoverExecutionResponse,
  OrchestrationResumeSessionRequest,
  OrchestrationResumeSessionResponse,
  OrchestrationSendSessionTurnRequest,
  OrchestrationSendSessionTurnResponse,
  OrchestrationServiceHealthResponse,
  OrchestrationSessionSummary,
  OrchestrationStartExecutionRequest,
  OrchestrationStartExecutionResponse,
  OrchestrationStartSessionRequest,
  OrchestrationStartSessionResponse,
  OrchestrationSubmitHitlDecisionRequest,
  OrchestrationSubmitHitlDecisionResponse,
  OrchestrationSubscribeExecutionRequest,
  OrchestrationSubscribeExecutionResponse,
  OrchestrationSubscribeSessionRequest,
  OrchestrationSubscribeSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import type { MemoryRuntimeConfig } from '@repo-ai-governor/shared';
import type { DesktopOrchestrationRuntimeMode } from '../../constants/index.js';

/**
 * Defines the full service-owner surface consumed by desktop bootstrap and preload layers.
 */
export interface DesktopOrchestrationServiceOwner {
  getHealth(): Promise<OrchestrationServiceHealthResponse>;
  startExecution(
    request: OrchestrationStartExecutionRequest,
    runtimeContext?: LocalOrchestrationServiceStartExecutionRuntimeContext,
  ): Promise<OrchestrationStartExecutionResponse>;
  getExecution(executionId: string): Promise<OrchestrationExecutionSummary | undefined>;
  listExecutions(
    request?: OrchestrationListExecutionsRequest,
  ): Promise<OrchestrationListExecutionsResponse>;
  queryArtifactPane(
    request?: OrchestrationArtifactPaneQueryRequest,
  ): Promise<OrchestrationArtifactPaneQueryResponse>;
  subscribeExecution(
    request: OrchestrationSubscribeExecutionRequest,
  ): Promise<OrchestrationSubscribeExecutionResponse>;
  submitHitlDecision(
    request: OrchestrationSubmitHitlDecisionRequest,
  ): Promise<OrchestrationSubmitHitlDecisionResponse>;
  recoverExecution(
    request: OrchestrationRecoverExecutionRequest,
  ): Promise<OrchestrationRecoverExecutionResponse>;
  startSession(
    request: OrchestrationStartSessionRequest,
  ): Promise<OrchestrationStartSessionResponse>;
  sendSessionTurn(
    request: OrchestrationSendSessionTurnRequest,
  ): Promise<OrchestrationSendSessionTurnResponse>;
  appendSessionMessage(
    request: OrchestrationAppendSessionMessageRequest,
  ): Promise<OrchestrationAppendSessionMessageResponse>;
  getSession(sessionId: string): Promise<OrchestrationSessionSummary | undefined>;
  listSessions(
    request?: OrchestrationListSessionsRequest,
  ): Promise<OrchestrationListSessionsResponse>;
  subscribeSession(
    request: OrchestrationSubscribeSessionRequest,
  ): Promise<OrchestrationSubscribeSessionResponse>;
  resumeSession(
    request?: OrchestrationResumeSessionRequest,
  ): Promise<OrchestrationResumeSessionResponse>;
  publishEvent(request: LocalOrchestrationServicePublishEventRequest): Promise<void>;
  saveCheckpoint(
    request: LocalOrchestrationServiceSaveCheckpointRequest,
  ): Promise<LangGraphRecoveredExecution | undefined>;
  dispose(): Promise<void>;
}

/**
 * Defines desktop runtime wiring options while keeping service ownership in the sidecar host.
 */
export interface DesktopOrchestrationServiceRuntimeDependencies {
  runtimeMode?: DesktopOrchestrationRuntimeMode;
  memoryConfig?: MemoryRuntimeConfig;
  serviceOwnerProvider?: (workspaceRoot: string) => Promise<DesktopOrchestrationServiceOwner>;
  sidecarClientDependencies?: LocalOrchestrationServiceSidecarClientDependencies;
}
