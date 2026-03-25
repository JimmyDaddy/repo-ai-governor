import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceSaveCheckpointRequest,
  LocalOrchestrationServiceSidecarClientDependencies,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from "@repo-ai-governor/core-orchestration-service";
import type { LangGraphRecoveredExecution } from "@repo-ai-governor/core-runtime-langgraph";
import type {
  OrchestrationServiceClient,
  OrchestrationStartExecutionRequest,
  OrchestrationStartExecutionResponse,
} from "@repo-ai-governor/orchestration-service-client";
import type { CliOrchestrationServiceRuntimeMode } from "../../constants/orchestration-service-runtime.constant.js";

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
  dispose?(): Promise<void>;
}

/**
 * Defines runtime dependencies that choose the concrete local orchestration service owner.
 */
export interface CliOrchestrationServiceRuntimeDependencies {
  runtimeMode?: CliOrchestrationServiceRuntimeMode;
  serviceOwnerProvider?: (workspaceRoot: string) => Promise<CliOrchestrationServiceOwner>;
  sidecarClientDependencies?: LocalOrchestrationServiceSidecarClientDependencies;
}
