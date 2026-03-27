/**
 * Defines normalized execution stages shown by CLI progress and diagnostics artifacts.
 *
 * Why this exists:
 * one finite stage dictionary keeps role progress, audit/replay links, and human-facing
 * interaction prompts aligned across command outputs.
 */
export enum ExecutionProgressStage {
  CONNECT = 'connect',
  DOCTOR = 'doctor',
  VERIFY = 'verify',
  RUN_COMPILE = 'run_compile',
  RUN_RUNTIME = 'run_runtime',
  DELIVERY_REHEARSAL = 'delivery_rehearsal',
  REPORT = 'report',
  REPLAY = 'replay',
  REVIEW = 'review',
  REVIEW_VERIFY = 'review_verify',
  LEDGER_BACKFILL = 'ledger_backfill',
  POLICY_WAITING = 'policy_waiting',
  HUMAN_CONFIRMATION = 'human_confirmation',
}

/**
 * Defines lifecycle statuses for one role/stage progress row.
 *
 * Why this exists:
 * output consumers need stable status values to render concise summaries, filter blockers,
 * and automate follow-up actions.
 */
export enum ExecutionProgressStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  WAITING = 'waiting',
  WARNING = 'warning',
  FAILED = 'failed',
}

/**
 * Defines normalized interaction categories for human-facing prompts.
 *
 * Why this exists:
 * category tags preserve root-cause semantics from diagnostics so prompts remain actionable
 * without forcing users to inspect raw artifacts first.
 */
export enum ExecutionInteractionCategory {
  NONE = 'none',
  POLICY_WAITING = 'policy_waiting',
  HUMAN_CONFIRMATION = 'human_confirmation',
  ENVIRONMENT_PRECONDITION = 'environment_precondition',
  PERMISSION_CONFIRMATION = 'permission_confirmation',
  RUNTIME_FAILURE = 'runtime_failure',
}

/**
 * Defines human-readable labels for progress statuses.
 */
export const EXECUTION_PROGRESS_STATUS_LABELS: Record<ExecutionProgressStatus, string> = {
  [ExecutionProgressStatus.QUEUED]: 'Queued',
  [ExecutionProgressStatus.RUNNING]: 'Running',
  [ExecutionProgressStatus.COMPLETED]: 'Completed',
  [ExecutionProgressStatus.WAITING]: 'Waiting for action',
  [ExecutionProgressStatus.WARNING]: 'Completed with warning',
  [ExecutionProgressStatus.FAILED]: 'Failed',
};
