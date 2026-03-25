import type {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
} from "../../constants/index.js";

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
  eventStreamToken: string;
}

export interface OrchestrationServiceEvent {
  type: OrchestrationServiceEventType;
  executionId: string;
  executionSessionId: string;
  status: OrchestrationExecutionStatus;
  timestamp: string;
  stageId?: string;
  artifactId?: string;
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
  status: OrchestrationExecutionStatus;
  checkpointCapable: boolean;
  acceptedAt: string;
  updatedAt: string;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
  checkpointSource?: string;
  checkpointPath?: string;
  recoveredNextNodeIds?: string[];
  pendingHitl?: boolean;
}

export interface OrchestrationSubscribeExecutionResponse {
  executionId: string;
  eventStreamToken: string;
  events: OrchestrationServiceEvent[];
}

export interface OrchestrationSubmitHitlDecisionRequest {
  executionId: string;
  executionSessionId: string;
  decision: string;
  resumeAction: string;
  actor: string;
  reason?: string;
  constraints?: Record<string, unknown>;
}

export interface OrchestrationSubmitHitlDecisionResponse {
  accepted: boolean;
  nextStatus: OrchestrationExecutionStatus;
  decisionReceiptArtifactPath?: string;
}

export interface OrchestrationRecoverExecutionResponse {
  recovered: boolean;
  checkpointSource?: string;
  checkpointPath?: string;
  nextStatus: OrchestrationExecutionStatus;
  nextNodeIds?: string[];
}

export interface OrchestrationServiceClient {
  startExecution(
    request: OrchestrationStartExecutionRequest,
  ): Promise<OrchestrationStartExecutionResponse>;
  getExecution(executionId: string): Promise<OrchestrationExecutionSummary | undefined>;
  subscribeExecution(
    executionIdOrEventStreamToken: string,
  ): Promise<OrchestrationSubscribeExecutionResponse>;
  submitHitlDecision(
    request: OrchestrationSubmitHitlDecisionRequest,
  ): Promise<OrchestrationSubmitHitlDecisionResponse>;
  recoverExecution(executionId: string): Promise<OrchestrationRecoverExecutionResponse>;
}
