export const LOCAL_ORCHESTRATION_SERVICE_SIDECAR_PROTOCOL_VERSION = "1";
export const LOCAL_ORCHESTRATION_SERVICE_SIDECAR_MEMORY_CONFIG_ENV =
  "REPO_AI_GOVERNOR_LOCAL_ORCHESTRATION_MEMORY_CONFIG_JSON";

export enum LocalOrchestrationServiceSidecarOperation {
  GET_HEALTH = "get_health",
  START_EXECUTION = "start_execution",
  GET_EXECUTION = "get_execution",
  LIST_EXECUTIONS = "list_executions",
  SUBSCRIBE_EXECUTION = "subscribe_execution",
  SUBMIT_HITL_DECISION = "submit_hitl_decision",
  RECOVER_EXECUTION = "recover_execution",
  PUBLISH_EVENT = "publish_event",
  SAVE_CHECKPOINT = "save_checkpoint",
  SHUTDOWN = "shutdown",
}
