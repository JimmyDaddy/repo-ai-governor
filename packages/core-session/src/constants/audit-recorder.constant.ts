/**
 * Defines terminal audit status values used by recorder payloads.
 *
 * Why this exists:
 * keeping finite status literals in one enum prevents cross-package drift in
 * audit/report/replay contracts.
 */
export enum AuditRecordStatus {
  RUNNING = "running",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export { DependencyResolutionStatus } from "@repo-ai-governor/shared";

/**
 * Defines output modes tracked in audit records.
 *
 * Why this exists:
 * output mode values must align with CLI/rendering contracts for reliable replay.
 */
export enum AuditOutputMode {
  PRETTY = "pretty",
  PLAIN = "plain",
  JSON = "json",
}
