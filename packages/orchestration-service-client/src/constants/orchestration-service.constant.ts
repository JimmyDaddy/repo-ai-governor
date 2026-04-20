/**
 * Defines stable execution kinds supported by the local orchestration service surface.
 */
export enum OrchestrationExecutionKind {
  RUN = 'run',
  REVIEW = 'review',
  REVIEW_VERIFY = 'review_verify',
}

/**
 * Defines supported client surfaces that may call the local orchestration service.
 */
export enum OrchestrationClientSurface {
  CLI = 'cli',
  DESKTOP = 'desktop',
}

/**
 * Defines transport-neutral service host shapes for future desktop or daemon rollout.
 */
export enum OrchestrationServiceHostKind {
  EMBEDDED = 'embedded',
  SIDECAR = 'sidecar',
  DAEMON = 'daemon',
}

/**
 * Defines transport kinds without binding the client contract to one concrete channel.
 */
export enum OrchestrationServiceTransportKind {
  IN_PROCESS = 'in_process',
  IPC = 'ipc',
  HTTP = 'http',
}

/**
 * Defines service lifecycle states exposed by orchestration health probes.
 */
export enum OrchestrationServiceLifecycleStatus {
  STARTING = 'starting',
  READY = 'ready',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
}

/**
 * Defines persisted execution statuses exposed by the local orchestration service.
 */
export enum OrchestrationExecutionStatus {
  ACCEPTED = 'accepted',
  RUNNING = 'running',
  HITL_REQUIRED = 'hitl_required',
  INTERRUPTED = 'interrupted',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Defines transport-neutral event kinds emitted by the local orchestration service.
 */
export enum OrchestrationServiceEventType {
  EXECUTION_STARTED = 'execution.started',
  EXECUTION_LIVENESS_UPDATED = 'execution.liveness.updated',
  EXECUTION_GRACEFUL_INTERRUPT_STARTED = 'execution.graceful_interrupt.started',
  EXECUTION_HARD_TERMINATION_STARTED = 'execution.hard_termination.started',
  EXECUTION_PARTIAL_SNAPSHOT_PERSISTED = 'execution.partial_snapshot.persisted',
  STAGE_PROGRESS = 'stage.progress',
  STAGE_COMPLETED = 'stage.completed',
  ARTIFACT_READY = 'artifact.ready',
  HITL_REQUIRED = 'hitl.required',
  EXECUTION_INTERRUPTED = 'execution.interrupted',
  EXECUTION_COMPLETED = 'execution.completed',
  EXECUTION_FAILED = 'execution.failed',
}

/**
 * Defines governance-surface action affordance kinds shared across desktop and future IDE clients.
 */
export enum OrchestrationGovernanceActionKind {
  VIEW_EXECUTION = 'view_execution',
  SUBMIT_HITL_DECISION = 'submit_hitl_decision',
  RECOVER_EXECUTION = 'recover_execution',
  TERMINATE_EXECUTION = 'terminate_execution',
  OPEN_HANDOFF_TARGET = 'open_handoff_target',
}

/**
 * Defines stable disabled-reason codes so clients do not infer why one action is unavailable.
 */
export enum OrchestrationGovernanceActionDisabledReason {
  EXECUTION_TERMINAL = 'execution_terminal',
  HITL_NOT_PENDING = 'hitl_not_pending',
  RECOVERY_NOT_AVAILABLE = 'recovery_not_available',
  TARGET_UNAVAILABLE = 'target_unavailable',
}

/**
 * Defines stable governance queue slices exposed to desktop command-center consumers.
 */
export enum OrchestrationGovernanceQueueKind {
  AUTOMATION_INBOX = 'automation_inbox',
  REVIEW_QUEUE = 'review_queue',
}

/**
 * Defines normalized attention levels so desktop and future IDE clients do not invent their own.
 */
export enum OrchestrationGovernanceAttentionLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Defines follow-up SLA states for queue and notification consumers.
 */
export enum OrchestrationGovernanceFollowUpSlaState {
  HEALTHY = 'healthy',
  DUE_SOON = 'due_soon',
  OVERDUE = 'overdue',
}

/**
 * Defines stable notification ownership states surfaced by governance queue overviews.
 */
export enum OrchestrationGovernanceNotificationStatus {
  IDLE = 'idle',
  FOLLOW_UP_REQUIRED = 'follow_up_required',
  ESCALATION_RECOMMENDED = 'escalation_recommended',
}

/**
 * Defines the temporary CLI-bridge capability classes exposed to governed workbench consumers.
 */
export enum OrchestrationGovernanceTemporaryBridgeCapabilityClass {
  ADOPT_BOOTSTRAP = 'adopt_bootstrap',
  ADOPTION_APPLY = 'adoption_apply',
  HOST_EXPORT = 'host_export',
  HOST_VERIFY = 'host_verify',
  HOST_PACK = 'host_pack',
  UPGRADE = 'upgrade',
}

/**
 * Defines the receipt artifacts that temporary bridges must keep visible to clients.
 */
export enum OrchestrationGovernanceTemporaryBridgeReceiptKind {
  ADOPTION_INSTALL_RECEIPT = 'adoption_install_receipt',
  HOST_EXPORT_RECEIPT = 'host_export_receipt',
  HOST_VERIFY_RECEIPT = 'host_verify_receipt',
  HOST_PACK_RECEIPT = 'host_pack_receipt',
  UPGRADE_APPLY_RECEIPT = 'upgrade_apply_receipt',
}

/**
 * Defines the governed consumer surface that should expose bridge receipt backlinks.
 */
export enum OrchestrationGovernanceTemporaryBridgeBacklinkSurface {
  ARTIFACT_WORKBENCH = 'artifact_workbench',
  WORKBENCH_OVERVIEW = 'workbench_overview',
}

/**
 * Defines the explicit exit-criteria codes that justify retiring one temporary CLI bridge.
 */
export enum OrchestrationGovernanceTemporaryBridgeExitCriterion {
  SERVICE_NATIVE_ADOPTION_QUERY = 'service_native_adoption_query',
  SERVICE_NATIVE_HOST_QUERY = 'service_native_host_query',
  SERVICE_NATIVE_UPGRADE_QUERY = 'service_native_upgrade_query',
  ARTIFACT_BACKLINK_PROJECTED = 'artifact_backlink_projected',
  COMMAND_SEAM_REPLACES_BRIDGE = 'command_seam_replaces_bridge',
}

/**
 * Defines service-owned workspace operations exposed to IDE workbench consumers.
 */
export enum OrchestrationBootstrapReadinessActionId {
  RUN_WORKSPACE_BOOTSTRAP = 'run_workspace_bootstrap',
  REFRESH_WORKSPACE_STATE = 'refresh_workspace_state',
}

/**
 * Defines service-owned workspace operations exposed to IDE workbench consumers.
 */
export enum OrchestrationWorkspaceOperationKind {
  WORKSPACE_BOOTSTRAP = 'workspace_bootstrap',
  CONNECT = 'connect',
  DOCTOR = 'doctor',
  CHECK = 'check',
  ADOPT_BOOTSTRAP = 'adopt_bootstrap',
  ADOPTION_APPLY = 'adoption_apply',
  HOST_EXPORT = 'host_export',
  HOST_VERIFY = 'host_verify',
  HOST_PACK = 'host_pack',
  UPGRADE_PREVIEW = 'upgrade_preview',
  UPGRADE_APPLY = 'upgrade_apply',
  WORKFLOW_PREVIEW = 'workflow_preview',
  WORKFLOW_CREATE = 'workflow_create',
  WORKFLOW_EDIT = 'workflow_edit',
}

/**
 * Defines stable handoff target kinds exposed through service-owned governance read models.
 */
export enum OrchestrationHandoffTargetKind {
  WORKTREE = 'worktree',
  EDITOR = 'editor',
  TERMINAL = 'terminal',
  REVIEW_DOCUMENT = 'review_document',
}

/**
 * Defines shared session lifecycle states exposed by the orchestration service.
 */
export enum OrchestrationSessionStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

/**
 * Defines stable session routes that can accept conversation turns.
 */
export enum OrchestrationSessionRouteId {
  MAIN = 'session.main',
}

/**
 * Defines the metadata key used when a client needs transcript/history surfaces to preserve the
 * operator-authored turn text while routing a different internal prompt through the same turn.
 */
export const ORCHESTRATION_SESSION_DISPLAY_USER_MESSAGE_METADATA_KEY = 'sessionDisplayUserMessage';

/**
 * Defines transport-neutral session event kinds emitted by the orchestration service.
 */
export enum OrchestrationSessionEventType {
  SESSION_STARTED = 'session.started',
  SESSION_MESSAGE_APPENDED = 'session.message.appended',
  SESSION_RESUMED = 'session.resumed',
  TURN_SUBMITTED = 'session.turn.submitted',
  TURN_STREAM_DELTA = 'session.turn.stream_delta',
  TURN_COMPLETED = 'session.turn.completed',
  TURN_FAILED = 'session.turn.failed',
  TURN_CANCELLED = 'session.turn.cancelled',
}

/**
 * Defines transcript roles shared by CLI and future desktop session presenters.
 */
export enum OrchestrationSessionTranscriptRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  SLASH_COMMAND = 'slash_command',
}
