/**
 * Defines runtime execution lifecycle statuses.
 */
export enum RuntimeExecutionStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

/**
 * Defines per-stage execution statuses.
 */
export enum RuntimeStageStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

/**
 * Defines timeout scopes used for interruption records.
 */
export enum RuntimeTimeoutScope {
  STAGE = 'stage',
  FLOW = 'flow',
}

/**
 * Defines runtime facade backend kinds.
 */
export const PROCESS_RUNTIME_BACKEND_KINDS = ['legacy', 'langgraph'] as const;

export type ProcessRuntimeBackendKind = (typeof PROCESS_RUNTIME_BACKEND_KINDS)[number];

/**
 * Defines parity harness execution modes.
 */
export const PROCESS_RUNTIME_PARITY_MODES = ['disabled', 'comparison'] as const;

export type ProcessRuntimeParityMode = (typeof PROCESS_RUNTIME_PARITY_MODES)[number];

/**
 * Defines parity diff severities.
 */
export const PROCESS_RUNTIME_PARITY_SEVERITIES = ['blocking', 'advisory'] as const;

export type ProcessRuntimeParitySeverity = (typeof PROCESS_RUNTIME_PARITY_SEVERITIES)[number];

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
