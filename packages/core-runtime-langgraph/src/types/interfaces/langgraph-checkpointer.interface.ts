import type {
  LangGraphCheckpointSource,
  LangGraphReducedStateKey,
  LangGraphRuntimeInterruptKind,
} from '../../constants/index.js';
import type { LangGraphCompiledGraphPlan } from './langgraph-compiled-graph-plan.interface.js';

export interface LangGraphCheckpointPendingInterrupt {
  kind: LangGraphRuntimeInterruptKind;
  recordedAt: string;
  reason?: string;
  payload?: Record<string, unknown>;
}

export interface LangGraphFileCheckpointerOptions {
  rootDirectory: string;
}

export interface LangGraphSqliteFsCheckpointerOptions {
  rootDirectory: string;
  databaseFileName?: string;
  tableName?: string;
}

export interface LangGraphSaveCheckpointOptions {
  plan: LangGraphCompiledGraphPlan;
  executionSessionId: string;
  activeNodeIds: string[];
  visitedNodeIds: string[];
  reducedState: Partial<Record<LangGraphReducedStateKey, unknown>>;
  artifactReferenceIds?: string[];
  taskReferenceId?: string;
  pendingInterrupt?: LangGraphCheckpointPendingInterrupt;
}

export interface LangGraphCheckpointEnvelope {
  checkpointId: string;
  checkpointSource: LangGraphCheckpointSource;
  processId: string;
  executionId: string;
  executionSessionId: string;
  createdAt: string;
  updatedAt: string;
  checkpointPath: string;
  activeNodeIds: string[];
  visitedNodeIds: string[];
  reducedState: Partial<Record<LangGraphReducedStateKey, unknown>>;
  artifactReferenceIds: string[];
  taskReferenceId?: string;
  pendingInterrupt?: LangGraphCheckpointPendingInterrupt;
}

export interface LangGraphRecoveredExecution {
  recovered: true;
  checkpointSource: LangGraphCheckpointSource;
  checkpointId: string;
  checkpointPath: string;
  processId: string;
  executionId: string;
  executionSessionId: string;
  nextNodeIds: string[];
  visitedNodeIds: string[];
  pendingInterrupt?: LangGraphCheckpointPendingInterrupt;
  recoveredAt: string;
}

export interface LangGraphCheckpointer {
  save(options: LangGraphSaveCheckpointOptions): Promise<LangGraphCheckpointEnvelope>;
  read(
    executionId: string,
    executionSessionId: string,
    expectedProcessId: string,
  ): Promise<LangGraphCheckpointEnvelope | undefined>;
  recover(
    executionId: string,
    executionSessionId: string,
    expectedProcessId: string,
  ): Promise<LangGraphRecoveredExecution | undefined>;
}
