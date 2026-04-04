/**
 * Defines review scope modes supported by the CLI review lifecycle.
 */
export enum CliReviewScopeMode {
  WORKING_TREE = 'working_tree',
  TASK_SCOPE = 'task_scope',
}

/**
 * Defines lifecycle states for canonical review markdown artifacts.
 */
export enum CliReviewLifecycleStatus {
  REVIEW_PENDING = 'review_pending',
  VERIFIED = 'verified',
  RESOLVED = 'resolved',
}

/**
 * Defines normalized verifier decisions projected into review lifecycle artifacts.
 */
export enum CliReviewVerifyDecision {
  ACCEPTED = 'accepted',
  PARTIALLY_ACCEPTED = 'partially_accepted',
  REJECTED = 'rejected',
}

/**
 * Defines severity levels used by structured review findings.
 */
export enum CliReviewFindingSeverity {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

/**
 * Defines stable finding-rule identifiers emitted by the heuristic review baseline.
 */
export enum CliReviewFindingRuleId {
  LOCKFILE_DELTA = 'lockfile_delta',
  MIGRATION_DETECTED = 'migration_detected',
  CI_WORKFLOW_CHANGED = 'ci_workflow_changed',
  RELEASE_SCRIPT_CHANGED = 'release_script_changed',
  SENSITIVE_PATH_CHANGED = 'sensitive_path_changed',
  TODO_MARKER = 'todo_marker',
  CODE_CHANGE_WITHOUT_TEST_CHANGE = 'code_change_without_test_change',
}

/**
 * Defines artifact ids emitted by review lifecycle commands.
 */
export enum CliReviewArtifactId {
  REVIEW_REQUEST = 'review_request',
  REVIEW_ARTIFACT = 'review_artifact',
  REVIEW_VERIFY_RESULT = 'review_verify_result',
  REVIEW_LEDGER_BACKFILL = 'review_ledger_backfill',
}

/**
 * Maps lifecycle status to canonical review filename prefixes accepted by governance gates.
 */
export const CLI_REVIEW_ARTIFACT_FILE_PREFIX_BY_STATUS: Record<CliReviewLifecycleStatus, string> = {
  [CliReviewLifecycleStatus.REVIEW_PENDING]: 'code_review_',
  [CliReviewLifecycleStatus.VERIFIED]: 'verified_review_',
  [CliReviewLifecycleStatus.RESOLVED]: 'resolved_code_review_',
};

/**
 * Lists generated path prefixes that should be excluded from working-tree review scope.
 */
export const CLI_REVIEW_GENERATED_PATH_PREFIXES = [
  '.repo-ai-governor/context/review-queue/',
  '.repo-ai-governor/context/ledger-backfill/review-verify/',
] as const;

/**
 * Lists marker tokens treated as actionable review findings in changed files.
 */
export const CLI_REVIEW_TODO_MARKERS = ['TODO', 'FIXME', 'HACK'] as const;

/**
 * Defines severity ordering used for stable finding sorting.
 */
export const CLI_REVIEW_FINDING_SEVERITY_PRIORITY: Record<CliReviewFindingSeverity, number> = {
  [CliReviewFindingSeverity.P0]: 0,
  [CliReviewFindingSeverity.P1]: 1,
  [CliReviewFindingSeverity.P2]: 2,
  [CliReviewFindingSeverity.P3]: 3,
};
