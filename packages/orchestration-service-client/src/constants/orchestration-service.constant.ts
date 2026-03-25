/**
 * Defines stable execution kinds supported by the local orchestration service surface.
 */
export enum OrchestrationExecutionKind {
  RUN = "run",
  REVIEW = "review",
  REVIEW_VERIFY = "review_verify",
}

/**
 * Defines supported client surfaces that may call the local orchestration service.
 */
export enum OrchestrationClientSurface {
  CLI = "cli",
  DESKTOP = "desktop",
}

/**
 * Defines transport-neutral service host shapes for future desktop or daemon rollout.
 */
export enum OrchestrationServiceHostKind {
  EMBEDDED = "embedded",
  SIDECAR = "sidecar",
  DAEMON = "daemon",
}

/**
 * Defines transport kinds without binding the client contract to one concrete channel.
 */
export enum OrchestrationServiceTransportKind {
  IN_PROCESS = "in_process",
  IPC = "ipc",
  HTTP = "http",
}

/**
 * Defines service lifecycle states exposed by orchestration health probes.
 */
export enum OrchestrationServiceLifecycleStatus {
  STARTING = "starting",
  READY = "ready",
  STOPPING = "stopping",
  STOPPED = "stopped",
}

/**
 * Defines persisted execution statuses exposed by the local orchestration service.
 */
export enum OrchestrationExecutionStatus {
  ACCEPTED = "accepted",
  RUNNING = "running",
  HITL_REQUIRED = "hitl_required",
  INTERRUPTED = "interrupted",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/**
 * Defines transport-neutral event kinds emitted by the local orchestration service.
 */
export enum OrchestrationServiceEventType {
  EXECUTION_STARTED = "execution.started",
  STAGE_PROGRESS = "stage.progress",
  STAGE_COMPLETED = "stage.completed",
  ARTIFACT_READY = "artifact.ready",
  HITL_REQUIRED = "hitl.required",
  EXECUTION_INTERRUPTED = "execution.interrupted",
  EXECUTION_COMPLETED = "execution.completed",
  EXECUTION_FAILED = "execution.failed",
}
