import type { MemoryProviderCompositionSummary } from '@repo-ai-governor/memory-provider-registry';
import type {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
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
}
