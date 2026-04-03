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
 * Defines shared session lifecycle states exposed by the orchestration service.
 */
export enum OrchestrationSessionStatus {
  ACTIVE = 'active',
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
