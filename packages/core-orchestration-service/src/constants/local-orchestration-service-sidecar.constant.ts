export const LOCAL_ORCHESTRATION_SERVICE_SIDECAR_PROTOCOL_VERSION = '1';
export const LOCAL_ORCHESTRATION_SERVICE_SIDECAR_MEMORY_CONFIG_ENV =
  'REPO_AI_GOVERNOR_LOCAL_ORCHESTRATION_MEMORY_CONFIG_JSON';

export enum LocalOrchestrationServiceSidecarOperation {
  GET_HEALTH = 'get_health',
  START_EXECUTION = 'start_execution',
  GET_EXECUTION = 'get_execution',
  LIST_EXECUTIONS = 'list_executions',
  QUERY_ARTIFACT_PANE = 'query_artifact_pane',
  SUBSCRIBE_EXECUTION = 'subscribe_execution',
  SUBMIT_HITL_DECISION = 'submit_hitl_decision',
  RECOVER_EXECUTION = 'recover_execution',
  START_SESSION = 'start_session',
  SEND_SESSION_TURN = 'send_session_turn',
  APPEND_SESSION_MESSAGE = 'append_session_message',
  GET_SESSION = 'get_session',
  LIST_SESSIONS = 'list_sessions',
  SUBSCRIBE_SESSION = 'subscribe_session',
  RESUME_SESSION = 'resume_session',
  FORK_SESSION = 'fork_session',
  ARCHIVE_SESSION = 'archive_session',
  UNARCHIVE_SESSION = 'unarchive_session',
  PUBLISH_EVENT = 'publish_event',
  SAVE_CHECKPOINT = 'save_checkpoint',
  SHUTDOWN = 'shutdown',
}
