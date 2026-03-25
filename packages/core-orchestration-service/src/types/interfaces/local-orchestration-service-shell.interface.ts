import type {
  LangGraphCheckpointer,
  LangGraphSaveCheckpointOptions,
} from "@repo-ai-governor/core-runtime-langgraph";
import type {
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
} from "@repo-ai-governor/orchestration-service-client";

export interface LocalOrchestrationServiceShellDependencies {
  checkpointer?: LangGraphCheckpointer;
  nowProvider?: () => Date;
  eventStreamTokenProvider?: (executionId: string) => string;
  executionIdProvider?: () => string;
  executionSessionIdProvider?: (executionId: string) => string;
}

export interface LocalOrchestrationServiceStartExecutionRuntimeContext {
  processId: string;
  executionId?: string;
  executionSessionId?: string;
}

export interface LocalOrchestrationServicePublishEventRequest {
  executionId: string;
  type: OrchestrationServiceEventType;
  status: OrchestrationExecutionStatus;
  message: string;
  stageId?: string;
  artifactId?: string;
}

export interface LocalOrchestrationServiceSaveCheckpointRequest
  extends LangGraphSaveCheckpointOptions {
  executionId: string;
}
