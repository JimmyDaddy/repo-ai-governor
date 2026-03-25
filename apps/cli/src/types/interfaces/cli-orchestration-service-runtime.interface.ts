import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceSaveCheckpointRequest,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from "@repo-ai-governor/core-orchestration-service";
import type { LangGraphRecoveredExecution } from "@repo-ai-governor/core-runtime-langgraph";
import type {
  OrchestrationServiceClient,
  OrchestrationStartExecutionRequest,
  OrchestrationStartExecutionResponse,
} from "@repo-ai-governor/orchestration-service-client";

/**
 * Defines the minimal owner-side orchestration service surface required by CLI runtime.
 */
export interface CliOrchestrationServiceOwner extends OrchestrationServiceClient {
  startExecution(
    request: OrchestrationStartExecutionRequest,
    runtimeContext?: LocalOrchestrationServiceStartExecutionRuntimeContext,
  ): Promise<OrchestrationStartExecutionResponse>;
  publishEvent(request: LocalOrchestrationServicePublishEventRequest): Promise<void>;
  saveCheckpoint(
    request: LocalOrchestrationServiceSaveCheckpointRequest,
  ): Promise<LangGraphRecoveredExecution | undefined>;
}

/**
 * Defines runtime dependencies that choose the concrete local orchestration service owner.
 */
export interface CliOrchestrationServiceRuntimeDependencies {
  serviceOwnerProvider?: (workspaceRoot: string) => Promise<CliOrchestrationServiceOwner>;
}
