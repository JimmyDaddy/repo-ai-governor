import type { ProcessNodeType } from '@repo-ai-governor/core-process';
import type { GovernorErrorCode, RoleSource } from '@repo-ai-governor/shared';
import type {
  LangGraphRuntimeEventType,
  LangGraphRuntimeExecutionMode,
  LangGraphRuntimeExecutionStatus,
  LangGraphRuntimeInterruptKind,
  LangGraphRuntimeStageStatus,
  LangGraphRuntimeTerminalStatus,
} from '../../constants/index.js';
import type { LangGraphCompiledGraphPlan } from './langgraph-compiled-graph-plan.interface.js';

export interface LangGraphRuntimeLifecycleEvent {
  type: LangGraphRuntimeEventType;
  processId: string;
  executionId: string;
  status: LangGraphRuntimeExecutionStatus;
  occurredAt: string;
  nodeId?: string;
  edgeId?: string;
  message: string;
}

export interface LangGraphPreparedExecution {
  plan: LangGraphCompiledGraphPlan;
  executionMode: LangGraphRuntimeExecutionMode;
  initialNodeIds: string[];
  currentStatus: LangGraphRuntimeExecutionStatus;
  supportedInterruptKinds: LangGraphRuntimeInterruptKind[];
  supportedTerminalStatuses: LangGraphRuntimeTerminalStatus[];
  lifecycleEvents: LangGraphRuntimeLifecycleEvent[];
}

export interface LangGraphRuntimeStageContext {
  processId: string;
  executionId: string;
  nodeId: string;
  stageId: string;
  nodeType: ProcessNodeType;
  routeKey: string;
  roleProfileId: string;
  roleProfileVersion?: string;
  roleSource?: RoleSource;
  attempt: number;
  elapsedFlowMs: number;
  input: Record<string, unknown>;
}

export interface LangGraphRuntimeStageResult {
  nodeId: string;
  stageId: string;
  nodeType: ProcessNodeType;
  status: LangGraphRuntimeStageStatus;
  attempt: number;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  output?: Record<string, unknown>;
  errorCode?: GovernorErrorCode;
  errorMessage?: string;
}

export interface LangGraphRuntimeExecutionInterruption {
  reason: 'timeout' | 'cancelled';
  errorCode: GovernorErrorCode;
  message: string;
  timeoutScope?: 'stage' | 'flow';
}

export interface LangGraphRuntimeConditionContext {
  processId: string;
  executionId: string;
  nodeId: string;
  stageId: string;
  outgoingEdges: Array<{
    edgeId: string;
    fromNodeId: string;
    toNodeId: string;
    conditionKey?: string;
  }>;
  stageOutput: Record<string, unknown>;
}

export interface LangGraphRuntimeConditionResolver {
  resolveConditionKey(
    context: LangGraphRuntimeConditionContext,
  ): Promise<string | undefined> | string | undefined;
}

export interface LangGraphRuntimeLoopContext {
  processId: string;
  executionId: string;
  nodeId: string;
  stageId: string;
  cycle: number;
  maxCycles: number;
  maxWallTimeSeconds: number;
  elapsedLoopMs: number;
  stageOutput: Record<string, unknown>;
}

export interface LangGraphRuntimeLoopController {
  shouldContinue(context: LangGraphRuntimeLoopContext): Promise<boolean> | boolean;
}

export interface LangGraphRuntimeExecuteOptions {
  stageTimeoutMs?: number;
  flowTimeoutMs?: number;
  maxTransitions?: number;
  signal?: AbortSignal;
  stageInputs?: Record<string, Record<string, unknown>>;
  conditionResolver?: LangGraphRuntimeConditionResolver;
  loopController?: LangGraphRuntimeLoopController;
  nowProvider?: () => Date;
}

export type LangGraphRuntimeStageHandler = (
  context: LangGraphRuntimeStageContext,
) => Promise<Record<string, unknown> | undefined>;

export interface LangGraphRuntimeExecutionResult {
  processId: string;
  executionId: string;
  status: 'succeeded' | 'failed' | 'timeout' | 'cancelled';
  startedAt: string;
  endedAt: string;
  durationMs: number;
  visitedNodeIds: string[];
  stageResults: LangGraphRuntimeStageResult[];
  interruption?: LangGraphRuntimeExecutionInterruption;
}
