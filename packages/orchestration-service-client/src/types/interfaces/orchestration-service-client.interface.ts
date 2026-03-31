import type { MemoryProviderCompositionSummary } from '@repo-ai-governor/memory-provider-registry';
import type {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
  OrchestrationSessionEventType,
  OrchestrationSessionRouteId,
  OrchestrationSessionStatus,
  OrchestrationSessionTranscriptRole,
} from '../../constants/index.js';

export interface OrchestrationServiceHealthResponse {
  serviceHostKind: OrchestrationServiceHostKind;
  serviceTransportKind: OrchestrationServiceTransportKind;
  lifecycleStatus: OrchestrationServiceLifecycleStatus;
  checkpointCapable: boolean;
  memoryProvider?: MemoryProviderCompositionSummary;
  workspaceRoot: string;
  startedAt: string;
  protocolVersion: string;
  pid?: number;
}

export interface OrchestrationStartExecutionRequest {
  workspaceId: string;
  workspaceRoot: string;
  executionKind: OrchestrationExecutionKind;
  clientSurface: OrchestrationClientSurface;
  locale?: string;
  outputMode?: string;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
}

export interface OrchestrationStartExecutionResponse {
  executionId: string;
  executionSessionId: string;
  acceptedAt: string;
  status: OrchestrationExecutionStatus;
  checkpointCapable: boolean;
  memoryProvider?: MemoryProviderCompositionSummary;
  serviceHostKind: OrchestrationServiceHostKind;
  serviceTransportKind: OrchestrationServiceTransportKind;
  eventStreamToken: string;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationServiceEvent {
  eventId: string;
  sequence: number;
  streamCursor: string;
  type: OrchestrationServiceEventType;
  executionId: string;
  executionSessionId: string;
  status: OrchestrationExecutionStatus;
  timestamp: string;
  stageId?: string;
  artifactId?: string;
  artifactPath?: string;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
  message: string;
}

export interface OrchestrationExecutionSummary {
  executionId: string;
  executionSessionId: string;
  processId: string;
  workspaceId: string;
  workspaceRoot: string;
  executionKind: OrchestrationExecutionKind;
  clientSurface: OrchestrationClientSurface;
  eventStreamToken: string;
  serviceHostKind: OrchestrationServiceHostKind;
  serviceTransportKind: OrchestrationServiceTransportKind;
  memoryProvider?: MemoryProviderCompositionSummary;
  status: OrchestrationExecutionStatus;
  checkpointCapable: boolean;
  recoveryCapable: boolean;
  acceptedAt: string;
  updatedAt: string;
  pendingHitl: boolean;
  lastEventAt?: string;
  latestEventType?: OrchestrationServiceEventType;
  latestEventSequence?: number;
  nextCursor?: string;
  currentStageId?: string;
  latestArtifactId?: string;
  latestArtifactPath?: string;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
  checkpointSource?: string;
  checkpointPath?: string;
  recoveredNextNodeIds?: string[];
}

export interface OrchestrationListExecutionsFilter {
  workspaceId?: string;
  status?: OrchestrationExecutionStatus;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
}

export interface OrchestrationListExecutionsRequest {
  filter?: OrchestrationListExecutionsFilter;
  limit?: number;
}

export interface OrchestrationListExecutionsResponse {
  executions: OrchestrationExecutionSummary[];
  returnedCount: number;
  totalMatchedCount: number;
}

export interface OrchestrationSubscribeExecutionResponse {
  executionId: string;
  eventStreamToken: string;
  serviceHostKind: OrchestrationServiceHostKind;
  serviceTransportKind: OrchestrationServiceTransportKind;
  latestEventSequence: number;
  nextCursor: string;
  events: OrchestrationServiceEvent[];
}

export interface OrchestrationSubscribeExecutionRequest {
  executionId?: string;
  eventStreamToken?: string;
  cursor?: string;
  afterSequence?: number;
  limit?: number;
}

export interface OrchestrationSubmitHitlDecisionRequest {
  executionId: string;
  executionSessionId: string;
  decision: string;
  resumeAction: string;
  actor: string;
  reason?: string;
  constraints?: Record<string, unknown>;
  decisionReceiptArtifactPath?: string;
}

export interface OrchestrationSubmitHitlDecisionResponse {
  accepted: boolean;
  nextStatus: OrchestrationExecutionStatus;
  decisionReceiptArtifactPath?: string;
  latestEventSequence: number;
  nextCursor: string;
  executionSummary: OrchestrationExecutionSummary;
}

export interface OrchestrationRecoverExecutionRequest {
  executionId: string;
}

export interface OrchestrationRecoverExecutionResponse {
  recovered: boolean;
  recoveryCapable: boolean;
  checkpointSource?: string;
  checkpointPath?: string;
  nextStatus: OrchestrationExecutionStatus;
  latestEventSequence: number;
  nextCursor: string;
  executionSummary: OrchestrationExecutionSummary;
  nextNodeIds?: string[];
}

export interface OrchestrationSessionEvent {
  eventId: string;
  sequence: number;
  streamCursor: string;
  sessionId: string;
  type: OrchestrationSessionEventType;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface OrchestrationSessionSummary {
  sessionId: string;
  status: OrchestrationSessionStatus;
  openedAt: string;
  closedAt?: string;
  serviceHostKind?: OrchestrationServiceHostKind;
  serviceTransportKind?: OrchestrationServiceTransportKind;
  processId?: string;
  executionId?: string;
  currentRouteId?: string;
  latestTurnId?: string;
  latestEventSequence: number;
  nextCursor: string;
  eventCount: number;
  context: Record<string, unknown>;
}

export interface OrchestrationStartSessionRequest {
  sessionId?: string;
  processId?: string;
  executionId?: string;
  initialContext?: Record<string, unknown>;
  routeId?: OrchestrationSessionRouteId | string;
}

export interface OrchestrationStartSessionResponse {
  created: boolean;
  session: OrchestrationSessionSummary;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationSendSessionTurnRequest {
  sessionId: string;
  routeId?: OrchestrationSessionRouteId | string;
  userMessage: string;
  turnId?: string;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationSendSessionTurnResponse {
  session: OrchestrationSessionSummary;
  turnId: string;
  routeId: string;
  acceptedAt: string;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationAppendSessionMessageRequest {
  sessionId: string;
  role: OrchestrationSessionTranscriptRole | string;
  routeId?: OrchestrationSessionRouteId | string;
  lines: string[];
  metadata?: Record<string, unknown>;
}

export interface OrchestrationAppendSessionMessageResponse {
  session: OrchestrationSessionSummary;
  latestEventSequence: number;
  nextCursor: string;
  event: OrchestrationSessionEvent;
}

export interface OrchestrationListSessionsFilter {
  status?: OrchestrationSessionStatus;
  executionId?: string;
  processId?: string;
  routeId?: string;
}

export interface OrchestrationListSessionsRequest {
  filter?: OrchestrationListSessionsFilter;
  limit?: number;
}

export interface OrchestrationListSessionsResponse {
  sessions: OrchestrationSessionSummary[];
  returnedCount: number;
  totalMatchedCount: number;
}

export interface OrchestrationSubscribeSessionRequest {
  sessionId: string;
  cursor?: string;
  afterSequence?: number;
  limit?: number;
}

export interface OrchestrationSubscribeSessionResponse {
  session: OrchestrationSessionSummary;
  latestEventSequence: number;
  nextCursor: string;
  events: OrchestrationSessionEvent[];
}

export interface OrchestrationResumeSessionRequest {
  sessionId?: string;
  preferLatest?: boolean;
}

export interface OrchestrationResumeSessionResponse {
  session: OrchestrationSessionSummary;
  resumeSelector: string;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationServiceClient {
  getHealth(): Promise<OrchestrationServiceHealthResponse>;
  startExecution(
    request: OrchestrationStartExecutionRequest,
  ): Promise<OrchestrationStartExecutionResponse>;
  getExecution(executionId: string): Promise<OrchestrationExecutionSummary | undefined>;
  listExecutions(
    request?: OrchestrationListExecutionsRequest,
  ): Promise<OrchestrationListExecutionsResponse>;
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
}
