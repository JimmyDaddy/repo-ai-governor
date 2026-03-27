import type { ProcessCompiler } from '@repo-ai-governor/core-process';
import type { LangGraphRuntimeBackend } from '@repo-ai-governor/core-runtime-langgraph';
import type {
  ProcessRuntimeBackendKind,
  ProcessRuntimeParityMode,
  ProcessRuntimeParitySeverity,
} from '../../constants/runtime.constant.js';
import type { ProcessRuntimeEngine } from '../../process-runtime-engine.js';
import type { RuntimeStageHandler } from '../aliases/runtime-stage.type.js';
import type { RuntimeExecuteOptions } from './runtime-control.interface.js';
import type { RuntimeExecutionResult } from './runtime-execution.interface.js';

export interface ProcessRuntimeLifecycleEvent {
  type: string;
  processId: string;
  executionId: string;
  status: string;
  occurredAt: string;
  nodeId?: string;
  edgeId?: string;
  message: string;
}

export interface ProcessRuntimePreparedExecutionProfile {
  backend: ProcessRuntimeBackendKind;
  processId: string;
  executionId: string;
  entryNodeId: string;
  currentStatus: string;
  nodeCount: number;
  edgeCount: number;
  initialNodeIds: string[];
  supportedInterruptKinds: string[];
  supportedTerminalStatuses: string[];
  lifecycleEvents: ProcessRuntimeLifecycleEvent[];
}

export interface ProcessRuntimeBackendAvailability {
  legacy: boolean;
  langgraph: boolean;
}

export interface ProcessRuntimeBackendSelectorOptions {
  preferredBackend?: ProcessRuntimeBackendKind;
  comparisonBackend?: ProcessRuntimeBackendKind;
  enableParityHarness?: boolean;
}

export interface ProcessRuntimeBackendSelection {
  primaryBackend: ProcessRuntimeBackendKind;
  comparisonBackend?: ProcessRuntimeBackendKind;
  parityMode: ProcessRuntimeParityMode;
  availability: ProcessRuntimeBackendAvailability;
  reason: string;
}

export interface ProcessRuntimeFacadeDependencies {
  processCompiler?: ProcessCompiler;
  legacyRuntimeEngine?: ProcessRuntimeEngine;
  langgraphRuntimeBackend?: LangGraphRuntimeBackend;
  defaultBackend?: ProcessRuntimeBackendKind;
  nowProvider?: () => Date;
}

export interface ProcessRuntimeFacadePrepareOptions extends ProcessRuntimeBackendSelectorOptions {}

export interface ProcessRuntimePreparedExecution {
  selection: ProcessRuntimeBackendSelection;
  primary: ProcessRuntimePreparedExecutionProfile;
  comparison?: ProcessRuntimePreparedExecutionProfile;
}

export interface ProcessRuntimeFacadeExecuteOptions
  extends ProcessRuntimeFacadePrepareOptions,
    RuntimeExecuteOptions {}

export interface ProcessRuntimeExecutedExecution extends ProcessRuntimePreparedExecution {
  runtimeResult: RuntimeExecutionResult;
}

export interface ProcessRuntimeBackendExecuteRequest {
  compiledIrExecutionId: string;
  stageHandler: RuntimeStageHandler;
  executeOptions: RuntimeExecuteOptions;
}

export interface ProcessRuntimeParityPreparedProfileSnapshot {
  entryNodeId: string;
  currentStatus: string;
  nodeCount: number;
  edgeCount: number;
  initialNodeIds: string[];
  supportedInterruptKinds: string[];
  supportedTerminalStatuses: string[];
}

export interface ProcessRuntimeParityExecutionSnapshot {
  status: string;
  interruptionReason?: string;
  visitedNodeIds?: string[];
  stageResults?: Array<{
    stageId: string;
    status: string;
  }>;
}

export interface ProcessRuntimeParitySnapshot {
  backend: ProcessRuntimeBackendKind;
  preparedProfile?: ProcessRuntimeParityPreparedProfileSnapshot;
  prettyOutput?: Record<string, unknown>;
  plainOutput?: string;
  jsonOutput?: Record<string, unknown>;
  artifactPaths?: string[];
  auditRecordIds?: string[];
  reviewState?: string;
  hitlState?: string;
  recoveryState?: string;
  execution?: ProcessRuntimeParityExecutionSnapshot;
}

export type ProcessRuntimeParityDimension =
  | 'prepared_execution_profile'
  | 'output_contract'
  | 'artifact_state'
  | 'audit_state'
  | 'review_state'
  | 'hitl_state'
  | 'recovery_state'
  | 'execution_state';

export interface ProcessRuntimeParityDiff {
  dimension: ProcessRuntimeParityDimension;
  field: string;
  severity: ProcessRuntimeParitySeverity;
  candidateValue?: unknown;
  baselineValue?: unknown;
  message: string;
}

export interface ProcessRuntimeParityCompareOptions {
  baseline: ProcessRuntimeParitySnapshot;
  candidate: ProcessRuntimeParitySnapshot;
}

export interface ProcessRuntimeParityReport {
  pass: boolean;
  baselineBackend: ProcessRuntimeBackendKind;
  candidateBackend: ProcessRuntimeBackendKind;
  comparedDimensions: ProcessRuntimeParityDimension[];
  blockingDiffs: ProcessRuntimeParityDiff[];
  advisoryDiffs: ProcessRuntimeParityDiff[];
}
