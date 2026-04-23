import type { ChildProcess } from 'node:child_process';

import type { LangGraphRecoveredExecution } from '@repo-ai-governor/core-runtime-langgraph';
import type {
  OrchestrationAppendSessionMessageRequest,
  OrchestrationAppendSessionMessageResponse,
  OrchestrationApplyProviderOnboardingRequest,
  OrchestrationApplyProviderOnboardingResponse,
  OrchestrationArchiveSessionRequest,
  OrchestrationArchiveSessionResponse,
  OrchestrationArtifactPaneQueryRequest,
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationBootstrapReadinessSnapshot,
  OrchestrationCommitWorkflowDraftRequest,
  OrchestrationExecutionBoardQueryRequest,
  OrchestrationExecutionBoardQueryResponse,
  OrchestrationExecutionSummary,
  OrchestrationForkSessionRequest,
  OrchestrationForkSessionResponse,
  OrchestrationHitlDecisionPacket,
  OrchestrationHitlDecisionPacketQueryRequest,
  OrchestrationHitlInboxQueryRequest,
  OrchestrationHitlInboxQueryResponse,
  OrchestrationListExecutionsRequest,
  OrchestrationListExecutionsResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationProviderOnboardingSnapshot,
  OrchestrationProviderOnboardingSnapshotRequest,
  OrchestrationQueueOverviewQueryRequest,
  OrchestrationQueueOverviewQueryResponse,
  OrchestrationRecoverExecutionRequest,
  OrchestrationRecoverExecutionResponse,
  OrchestrationResumeSessionRequest,
  OrchestrationResumeSessionResponse,
  OrchestrationRoleLaneStatusQueryRequest,
  OrchestrationRoleLaneStatusQueryResponse,
  OrchestrationSecureAuthoringQueryRequest,
  OrchestrationSecureAuthoringSnapshot,
  OrchestrationSendSessionTurnRequest,
  OrchestrationSendSessionTurnResponse,
  OrchestrationServiceHealthResponse,
  OrchestrationSessionContinuityQueryRequest,
  OrchestrationSessionContinuitySnapshot,
  OrchestrationSessionSummary,
  OrchestrationSetManagedSecretRequest,
  OrchestrationSetManagedSecretResponse,
  OrchestrationSetUserConfigValueRequest,
  OrchestrationSetUserConfigValueResponse,
  OrchestrationStartExecutionRequest,
  OrchestrationStartExecutionResponse,
  OrchestrationStartSessionRequest,
  OrchestrationStartSessionResponse,
  OrchestrationStartWorkflowDraftRequest,
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
  OrchestrationUpdateWorkflowDraftEdgeRequest,
  OrchestrationUpdateWorkflowDraftNodeRequest,
  OrchestrationUpdateWorkflowDraftPolicyRequest,
  OrchestrationValidateWorkflowDraftRequest,
  OrchestrationWorkflowDraftMutationResponse,
  OrchestrationWorkflowDraftSession,
  OrchestrationWorkflowDraftSessionQueryRequest,
  OrchestrationWorkspaceOperationRequest,
  OrchestrationWorkspaceOperationResponse,
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
  queryBootstrapReadiness(): Promise<OrchestrationBootstrapReadinessSnapshot>;
  querySecureAuthoring(
    request?: OrchestrationSecureAuthoringQueryRequest,
  ): Promise<OrchestrationSecureAuthoringSnapshot>;
  queryProviderOnboarding(
    request: OrchestrationProviderOnboardingSnapshotRequest,
  ): Promise<OrchestrationProviderOnboardingSnapshot>;
  setUserConfigValue(
    request: OrchestrationSetUserConfigValueRequest,
  ): Promise<OrchestrationSetUserConfigValueResponse>;
  setManagedSecret(
    request: OrchestrationSetManagedSecretRequest,
  ): Promise<OrchestrationSetManagedSecretResponse>;
  applyProviderOnboarding(
    request: OrchestrationApplyProviderOnboardingRequest,
  ): Promise<OrchestrationApplyProviderOnboardingResponse>;
  queryWorkflowDraftSession(
    request?: OrchestrationWorkflowDraftSessionQueryRequest,
  ): Promise<OrchestrationWorkflowDraftSession | undefined>;
  startWorkflowDraft(
    request: OrchestrationStartWorkflowDraftRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse>;
  updateWorkflowDraftNode(
    request: OrchestrationUpdateWorkflowDraftNodeRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse>;
  updateWorkflowDraftEdge(
    request: OrchestrationUpdateWorkflowDraftEdgeRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse>;
  updateWorkflowDraftPolicy(
    request: OrchestrationUpdateWorkflowDraftPolicyRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse>;
  validateWorkflowDraft(
    request: OrchestrationValidateWorkflowDraftRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse>;
  commitWorkflowDraft(
    request: OrchestrationCommitWorkflowDraftRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse>;
  runWorkspaceOperation(
    request: OrchestrationWorkspaceOperationRequest,
  ): Promise<OrchestrationWorkspaceOperationResponse>;
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
  queryRoleLaneStatus(
    request?: OrchestrationRoleLaneStatusQueryRequest,
  ): Promise<OrchestrationRoleLaneStatusQueryResponse>;
  querySessionContinuity(
    request?: OrchestrationSessionContinuityQueryRequest,
  ): Promise<OrchestrationSessionContinuitySnapshot | undefined>;
  queryHitlDecisionPacket(
    request?: OrchestrationHitlDecisionPacketQueryRequest,
  ): Promise<OrchestrationHitlDecisionPacket | undefined>;
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
  workspaceOperationRequestTimeoutMs?: number;
  sessionTurnRequestTimeoutMs?: number;
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
