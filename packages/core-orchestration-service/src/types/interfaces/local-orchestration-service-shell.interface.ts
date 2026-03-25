import type {
  LangGraphCheckpointer,
  LangGraphSaveCheckpointOptions,
} from "@repo-ai-governor/core-runtime-langgraph";
import type {
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
} from "@repo-ai-governor/orchestration-service-client";

export interface LocalOrchestrationServiceShellDependencies {
  checkpointer?: LangGraphCheckpointer;
  nowProvider?: () => Date;
  eventStreamTokenProvider?: (executionId: string) => string;
  eventIdProvider?: (executionId: string, sequence: number) => string;
  executionIdProvider?: () => string;
  executionSessionIdProvider?: (executionId: string) => string;
  serviceHostKind?: OrchestrationServiceHostKind;
  serviceTransportKind?: OrchestrationServiceTransportKind;
  lifecycleStatusProvider?: () => OrchestrationServiceLifecycleStatus;
  protocolVersion?: string;
  pidProvider?: () => number | undefined;
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
  artifactPath?: string;
}

export interface LocalOrchestrationServiceSaveCheckpointRequest
  extends LangGraphSaveCheckpointOptions {
  executionId: string;
}
