import type {
  LangGraphCheckpointer,
  LangGraphSaveCheckpointOptions,
} from '@repo-ai-governor/core-runtime-langgraph';
import type {
  MemoryProviderCompositionSummary,
  MemoryProviderRegistry,
  MemoryProviderRuntimeMode,
} from '@repo-ai-governor/memory-provider-registry';
import type {
  OrchestrationExecutionLivenessSnapshot,
  OrchestrationExecutionStatus,
  OrchestrationHitlDecisionOption,
  OrchestrationRiskFact,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
} from '@repo-ai-governor/orchestration-service-client';
import type { MemoryRuntimeConfig } from '@repo-ai-governor/shared';
import type { SessionMainSupervisorRuntimeContract } from './session-main-supervisor-runtime.interface.js';

export interface LocalOrchestrationServiceShellDependencies {
  repositoryRoot?: string;
  checkpointer?: LangGraphCheckpointer;
  memoryConfig?: MemoryRuntimeConfig;
  memoryProviderRegistry?: MemoryProviderRegistry;
  memoryProviderRuntimeMode?: MemoryProviderRuntimeMode;
  sessionMainSupervisorRuntime?: SessionMainSupervisorRuntimeContract;
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

export interface LocalOrchestrationServiceMemoryProviderState {
  composition: MemoryProviderCompositionSummary;
}

export interface LocalOrchestrationServiceStartExecutionRuntimeContext {
  processId: string;
  executionId?: string;
  executionSessionId?: string;
}

export interface LocalOrchestrationServiceHitlDecisionState {
  riskFacts: OrchestrationRiskFact[];
  policyAction: string;
  slaDeadlineAt?: string;
  defaultTimeoutAction: string;
  allowedDecisions: OrchestrationHitlDecisionOption[];
  recordedAt: string;
}

export interface LocalOrchestrationServicePublishEventRequest {
  executionId: string;
  type: OrchestrationServiceEventType;
  status?: OrchestrationExecutionStatus;
  message: string;
  stageId?: string;
  artifactId?: string;
  artifactPath?: string;
  livenessSnapshot?: OrchestrationExecutionLivenessSnapshot;
  hitlDecisionState?: LocalOrchestrationServiceHitlDecisionState;
}

export interface LocalOrchestrationServiceSaveCheckpointRequest
  extends LangGraphSaveCheckpointOptions {
  executionId: string;
}
