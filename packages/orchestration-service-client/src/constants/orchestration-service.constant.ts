/**
 * Defines stable execution kinds supported by the local orchestration service surface.
 */
export enum OrchestrationExecutionKind {
  RUN = "run",
}

/**
 * Defines supported client surfaces that may call the local orchestration service.
 */
export enum OrchestrationClientSurface {
  CLI = "cli",
  DESKTOP = "desktop",
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
