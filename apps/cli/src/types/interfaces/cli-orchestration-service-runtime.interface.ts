import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceSaveCheckpointRequest,
  LocalOrchestrationServiceShellDependencies,
  LocalOrchestrationServiceSidecarClientDependencies,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from '@repo-ai-governor/core-orchestration-service';
import type { LangGraphRecoveredExecution } from '@repo-ai-governor/core-runtime-langgraph';
import type {
  OrchestrationAppendSessionMessageRequest,
  OrchestrationAppendSessionMessageResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationResumeSessionRequest,
  OrchestrationResumeSessionResponse,
  OrchestrationSendSessionTurnRequest,
  OrchestrationSendSessionTurnResponse,
  OrchestrationServiceClient,
  OrchestrationSessionSummary,
  OrchestrationStartExecutionRequest,
  OrchestrationStartExecutionResponse,
  OrchestrationStartSessionRequest,
  OrchestrationStartSessionResponse,
  OrchestrationSubscribeSessionRequest,
  OrchestrationSubscribeSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import type { MemoryRuntimeConfig } from '@repo-ai-governor/shared';
import type { CliOrchestrationServiceRuntimeMode } from '../../constants/orchestration-service-runtime.constant.js';

/**
 * Defines the minimal owner-side orchestration service surface required by CLI runtime.
 */
export interface CliOrchestrationServiceOwner extends OrchestrationServiceClient {
  startExecution(
    request: OrchestrationStartExecutionRequest,
    runtimeContext?: LocalOrchestrationServiceStartExecutionRuntimeContext,
  ): Promise<OrchestrationStartExecutionResponse>;
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
  dispose?(): Promise<void>;
}

/**
 * Defines runtime dependencies that choose the concrete local orchestration service owner.
 */
export interface CliOrchestrationServiceRuntimeDependencies {
  runtimeMode?: CliOrchestrationServiceRuntimeMode;
  memoryConfig?: MemoryRuntimeConfig;
  serviceOwnerProvider?: (workspaceRoot: string) => Promise<CliOrchestrationServiceOwner>;
  sidecarClientDependencies?: LocalOrchestrationServiceSidecarClientDependencies;
  embeddedShellDependencies?: Omit<LocalOrchestrationServiceShellDependencies, 'memoryConfig'>;
}
