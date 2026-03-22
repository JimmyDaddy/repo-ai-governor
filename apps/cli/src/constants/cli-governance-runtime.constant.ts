import { ChangeRiskFileCategory } from "@repo-ai-governor/core-change-risk";

/**
 * Defines normalized check statuses rendered by command-level governance output.
 */
export enum CliGovernanceCheckStatus {
  PASS = "pass",
  WARN = "warn",
  FAIL = "fail",
}

/**
 * Defines workspace attach modes surfaced by `doctor` diagnostics.
 */
export enum CliDoctorAttachMode {
  READ_ONLY = "read_only",
  READ_WRITE = "read_write",
}

/**
 * Defines deterministic operation identifiers for command execution payloads.
 */
export enum CliRuntimeOperation {
  WORKSPACE_INIT = "workspace_init",
  ENV_DOCTOR = "env_doctor",
  GOVERNANCE_CHECK = "governance_check",
  GOVERNANCE_RUN = "governance_run",
  REVIEW_QUEUE = "review_queue",
  REVIEW_VERIFY = "review_verify",
  PLAN_SNAPSHOT = "plan_snapshot",
  SCHEMA_UPGRADE_ANALYZE = "schema_upgrade_analyze",
}

/**
 * Defines finite review-request lifecycle statuses emitted by CLI runtime.
 */
export enum CliReviewRequestStatus {
  QUEUED = "queued",
  VERIFIED = "verified",
}

/**
 * Re-exports attach-mode enum as a constant namespace for runtime callsites.
 */
export const CLI_DOCTOR_ATTACH_MODE = CliDoctorAttachMode;

/**
 * Re-exports operation enum as a constant namespace for runtime callsites.
 */
export const CLI_RUNTIME_OPERATION = CliRuntimeOperation;

/**
 * Re-exports review-request enum as a constant namespace for runtime callsites.
 */
export const CLI_REVIEW_REQUEST_STATUS = CliReviewRequestStatus;

/**
 * Defines standard context directories initialized by `init`.
 */
export const CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS = [
  ["context"],
  ["context", "memory"],
  ["context", "compiled-ir"],
  ["context", "bootstrap"],
  ["context", "review-queue"],
  ["context", "review-queue", "requests"],
  ["context", "review-queue", "results"],
  ["context", "plan"],
  ["context", "reports"],
  ["context", "replay"],
  ["context", "upgrade"],
] as const;

/**
 * Defines governance check scripts probed by `check` command when repository provides them.
 */
export const CLI_OPTIONAL_GOVERNANCE_SCRIPT_PATHS = [
  "scripts/governance/check-task-ledger-sync.js",
  "scripts/governance/check-sprint-plan-status-sync.js",
  "scripts/governance/check-code-review-status-sync.js",
  "scripts/governance/check-docs-triad-sync.js",
] as const;

/**
 * Defines baseline documentation probes used by `doctor` and `check`.
 */
export const CLI_BASELINE_DOC_PATHS = [
  "AGENTS.md",
  ".repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md",
  ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md",
  ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md",
  ".repo-ai-governor/normative_knowledge_sources/governance/code_standards.md",
] as const;

/**
 * Defines path-pattern mapping used to infer risk file categories.
 */
export const CLI_CHANGE_RISK_FILE_CATEGORY_PATTERNS = [
  {
    pattern: ".github/workflows/",
    category: ChangeRiskFileCategory.CI_WORKFLOW,
  },
  {
    pattern: "migration",
    category: ChangeRiskFileCategory.MIGRATION,
  },
  {
    pattern: "migrations/",
    category: ChangeRiskFileCategory.MIGRATION,
  },
  {
    pattern: "infra/",
    category: ChangeRiskFileCategory.INFRA,
  },
  {
    pattern: "infrastructure/",
    category: ChangeRiskFileCategory.INFRA,
  },
  {
    pattern: "release",
    category: ChangeRiskFileCategory.RELEASE,
  },
  {
    pattern: "secret",
    category: ChangeRiskFileCategory.SECRET,
  },
] as const;
