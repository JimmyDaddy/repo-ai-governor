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

export const LANGGRAPH_CHECKPOINT_SOURCES = ["file-backed", "sqlite-fs"] as const;

export type LangGraphCheckpointSource = (typeof LANGGRAPH_CHECKPOINT_SOURCES)[number];

export const LANGGRAPH_COMMUNITY_VENDOR_RUNTIME_KINDS = ["langchain_langgraph_js"] as const;

export type LangGraphCommunityVendorRuntimeKind =
  (typeof LANGGRAPH_COMMUNITY_VENDOR_RUNTIME_KINDS)[number];

export const LANGGRAPH_COMMUNITY_VENDOR_BINDING_STATUSES = [
  "available",
  "module_missing",
  "export_missing",
  "load_failed",
] as const;

export type LangGraphCommunityVendorBindingStatus =
  (typeof LANGGRAPH_COMMUNITY_VENDOR_BINDING_STATUSES)[number];

export const LANGGRAPH_COMMUNITY_VENDOR_DEFAULT_PACKAGE_NAME = "@langchain/langgraph";

export const LANGGRAPH_COMMUNITY_VENDOR_REQUIRED_EXPORTS = ["StateGraph", "START", "END"] as const;

export const LANGGRAPH_RUNTIME_EXECUTION_STATUSES = [
  "pending",
  "succeeded",
  "failed",
  "timeout",
  "cancelled",
] as const;

export type LangGraphRuntimeExecutionStatus = (typeof LANGGRAPH_RUNTIME_EXECUTION_STATUSES)[number];

export const LANGGRAPH_RUNTIME_TERMINAL_STATUSES = [
  "succeeded",
  "failed",
  "timeout",
  "cancelled",
] as const;

export type LangGraphRuntimeTerminalStatus = (typeof LANGGRAPH_RUNTIME_TERMINAL_STATUSES)[number];

export const LANGGRAPH_RUNTIME_STAGE_STATUSES = [
  "succeeded",
  "failed",
  "timeout",
  "cancelled",
] as const;

export type LangGraphRuntimeStageStatus = (typeof LANGGRAPH_RUNTIME_STAGE_STATUSES)[number];

export const LANGGRAPH_RUNTIME_EXECUTION_MODES = ["prepare_only", "graph_first_dispatch"] as const;

export type LangGraphRuntimeExecutionMode = (typeof LANGGRAPH_RUNTIME_EXECUTION_MODES)[number];

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

export const LANGGRAPH_SQLITE_FS_CHECKPOINTER_DATABASE_FILE_NAME = "langgraph-checkpoints.sqlite";

export const LANGGRAPH_SQLITE_FS_CHECKPOINTER_TABLE_NAME = "langgraph_checkpoints";
