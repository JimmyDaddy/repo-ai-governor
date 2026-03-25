import type {
  LangGraphRuntimeEventType,
  LangGraphRuntimeExecutionStatus,
  LangGraphRuntimeInterruptKind,
  LangGraphRuntimeTerminalStatus,
} from "../../constants/index.js";
import type { LangGraphCompiledGraphPlan } from "./langgraph-compiled-graph-plan.interface.js";

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
  initialNodeIds: string[];
  currentStatus: LangGraphRuntimeExecutionStatus;
  supportedInterruptKinds: LangGraphRuntimeInterruptKind[];
  supportedTerminalStatuses: LangGraphRuntimeTerminalStatus[];
  lifecycleEvents: LangGraphRuntimeLifecycleEvent[];
}
