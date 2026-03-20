/**
 * Defines runtime execution lifecycle statuses.
 */
export enum RuntimeExecutionStatus {
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  TIMEOUT = "timeout",
  CANCELLED = "cancelled",
}

/**
 * Defines per-stage execution statuses.
 */
export enum RuntimeStageStatus {
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  TIMEOUT = "timeout",
  CANCELLED = "cancelled",
}

/**
 * Defines timeout scopes used for interruption records.
 */
export enum RuntimeTimeoutScope {
  STAGE = "stage",
  FLOW = "flow",
}

/**
 * Defines default flow timeout milliseconds when options do not provide one.
 */
export const DEFAULT_RUNTIME_FLOW_TIMEOUT_MS = 300000;

/**
 * Defines default stage timeout milliseconds when options do not provide one.
 */
export const DEFAULT_RUNTIME_STAGE_TIMEOUT_MS = 30000;

/**
 * Defines maximum transition safety valve for one flow execution.
 */
export const DEFAULT_RUNTIME_MAX_TRANSITIONS = 1000;
