export const LANGGRAPH_NODE_BEHAVIORS = ["invoke_stage", "branch", "fan_out", "loop"] as const;

export type LangGraphNodeBehavior = (typeof LANGGRAPH_NODE_BEHAVIORS)[number];

export const LANGGRAPH_EDGE_BEHAVIORS = [
  "direct",
  "conditional",
  "parallel",
  "loop_continue",
  "loop_exit",
] as const;

export type LangGraphEdgeBehavior = (typeof LANGGRAPH_EDGE_BEHAVIORS)[number];

export const LANGGRAPH_RUNTIME_EVENT_TYPES = [
  "execution.ready",
  "graph.compiled",
  "node.ready",
  "edge.ready",
] as const;

export type LangGraphRuntimeEventType = (typeof LANGGRAPH_RUNTIME_EVENT_TYPES)[number];

export const LANGGRAPH_RUNTIME_INTERRUPT_KINDS = ["hitl", "timeout", "cancelled"] as const;

export type LangGraphRuntimeInterruptKind = (typeof LANGGRAPH_RUNTIME_INTERRUPT_KINDS)[number];

export const LANGGRAPH_CHECKPOINT_SOURCES = ["file-backed"] as const;

export type LangGraphCheckpointSource = (typeof LANGGRAPH_CHECKPOINT_SOURCES)[number];

export const LANGGRAPH_RUNTIME_EXECUTION_STATUSES = [
  "pending",
  "succeeded",
  "failed",
  "interrupted",
  "cancelled",
] as const;

export type LangGraphRuntimeExecutionStatus = (typeof LANGGRAPH_RUNTIME_EXECUTION_STATUSES)[number];

export const LANGGRAPH_RUNTIME_TERMINAL_STATUSES = [
  "succeeded",
  "failed",
  "interrupted",
  "cancelled",
] as const;

export type LangGraphRuntimeTerminalStatus = (typeof LANGGRAPH_RUNTIME_TERMINAL_STATUSES)[number];

export const LANGGRAPH_REDUCED_STATE_KEYS = [
  "execution.cursor",
  "execution.visited_nodes",
  "execution.stage_results",
  "execution.pending_interrupt",
  "execution.retry_counters",
  "execution.loop_state",
] as const;

export type LangGraphReducedStateKey = (typeof LANGGRAPH_REDUCED_STATE_KEYS)[number];

export const LANGGRAPH_CHECKPOINTER_STATE_KEYS = [
  "process.id",
  "execution.id",
  "execution.session_id",
  "execution.active_node_ids",
  "execution.visited_node_ids",
  "execution.pending_interrupt",
  "graph.reduced_state",
  "artifact.reference_ids",
  "task.reference_id",
] as const;

export type LangGraphCheckpointerStateKey = (typeof LANGGRAPH_CHECKPOINTER_STATE_KEYS)[number];

export const LANGGRAPH_FILE_CHECKPOINTER_DIRECTORY_NAME = "langgraph-checkpoints";

export const LANGGRAPH_FILE_CHECKPOINTER_FILE_NAME = "checkpoint.json";
