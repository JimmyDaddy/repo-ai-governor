export const WORKFLOW_STAGE_RESULT_STATUS = Object.freeze({
  pending: "pending",
  running: "running",
  passed: "passed",
  failed: "failed",
  skipped: "skipped",
  blocked: "blocked",
} as const);

export const WORKFLOW_EXECUTION_STATUS = Object.freeze({
  passed: "passed",
  failed: "failed",
} as const);
