import type { ChildProcess } from 'node:child_process';

import type { LangGraphRecoveredExecution } from '@repo-ai-governor/core-runtime-langgraph';
import type {
  OrchestrationAppendSessionMessageRequest,
  OrchestrationAppendSessionMessageResponse,
  OrchestrationArchiveSessionRequest,
  OrchestrationArchiveSessionResponse,
  OrchestrationArtifactPaneQueryRequest,
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationExecutionBoardQueryRequest,
  OrchestrationExecutionBoardQueryResponse,
  OrchestrationExecutionSummary,
  OrchestrationForkSessionRequest,
  OrchestrationForkSessionResponse,
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
  OrchestrationTerminateExecutionRequest,
  OrchestrationTerminateExecutionResponse,
  OrchestrationUnarchiveSessionRequest,
  OrchestrationUnarchiveSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import type { GovernorErrorCode, MemoryRuntimeConfig } from '@repo-ai-governor/shared';
import type { LocalOrchestrationServiceSidecarOperation } from '../../constants/index.js';
import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceSaveCheckpointRequest,
  LocalOrchestrationServiceShellDependencies,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from './local-orchestration-service-shell.interface.js';

export interface LocalOrchestrationServiceSidecarSerializedError {
  code: GovernorErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface LocalOrchestrationServiceSidecarRequestEnvelope {
  requestId: string;
  operation: LocalOrchestrationServiceSidecarOperation;
  payload?: unknown;
}

export interface LocalOrchestrationServiceSidecarResponseEnvelope {
  requestId: string;
  ok: boolean;
  payload?: unknown;
  error?: LocalOrchestrationServiceSidecarSerializedError;
}

export interface LocalOrchestrationServiceSidecarStartExecutionPayload {
  request: OrchestrationStartExecutionRequest;
  runtimeContext?: LocalOrchestrationServiceStartExecutionRuntimeContext;
}

export interface LocalOrchestrationServiceSidecarShutdownResponse {
  acknowledged: true;
}

export interface LocalOrchestrationServiceSidecarDispatchTable {
  getHealth(): Promise<OrchestrationServiceHealthResponse>;
  startExecution(
    payload: LocalOrchestrationServiceSidecarStartExecutionPayload,
  ): Promise<OrchestrationStartExecutionResponse>;
  getExecution(executionId: string): Promise<OrchestrationExecutionSummary | undefined>;
  queryExecutionBoard(
    request?: OrchestrationExecutionBoardQueryRequest,
  ): Promise<OrchestrationExecutionBoardQueryResponse>;
  queryHitlInbox(
    request?: OrchestrationHitlInboxQueryRequest,
  ): Promise<OrchestrationHitlInboxQueryResponse>;
  queryQueueOverview(
    request?: OrchestrationQueueOverviewQueryRequest,
  ): Promise<OrchestrationQueueOverviewQueryResponse>;
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
  terminateExecution(
    request: OrchestrationTerminateExecutionRequest,
  ): Promise<OrchestrationTerminateExecutionResponse>;
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
  forkSession(request: OrchestrationForkSessionRequest): Promise<OrchestrationForkSessionResponse>;
  archiveSession(
    request: OrchestrationArchiveSessionRequest,
  ): Promise<OrchestrationArchiveSessionResponse>;
  unarchiveSession(
    request: OrchestrationUnarchiveSessionRequest,
  ): Promise<OrchestrationUnarchiveSessionResponse>;
  publishEvent(request: LocalOrchestrationServicePublishEventRequest): Promise<void>;
  saveCheckpoint(
    request: LocalOrchestrationServiceSaveCheckpointRequest,
  ): Promise<LangGraphRecoveredExecution | undefined>;
}

export interface LocalOrchestrationServiceSidecarHostDependencies
  extends LocalOrchestrationServiceShellDependencies {
  workspaceRoot: string;
}

export interface LocalOrchestrationServiceSidecarClientDependencies {
  sidecarEntryPath?: string;
  requestTimeoutMs?: number;
  repositoryRoot?: string;
  memoryConfig?: MemoryRuntimeConfig;
  env?: NodeJS.ProcessEnv;
  execArgv?: string[];
  childProcessFactory?: (
    workspaceRoot: string,
    sidecarEntryPath: string,
    execArgv: string[],
    env: NodeJS.ProcessEnv,
  ) => ChildProcess;
}

export interface LocalOrchestrationServiceSidecarClientLike {
  dispose(): Promise<void>;
}
