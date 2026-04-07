import {
  ReviewFindingSourceType,
  ReviewRuleExecutionMode,
  ReviewRuleSeverity,
} from '@repo-ai-governor/standards';

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
 * Defines per-finding verification decisions retained for source-aware closure audit.
 */
export enum CliReviewFindingVerificationDecision {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

/**
 * Defines matching strategies used by review-verify for different finding provenance groups.
 */
export enum CliReviewFindingVerificationMatchStrategy {
  FINGERPRINT_EXACT = 'fingerprint_exact',
  RULE_AND_FILE = 'rule_and_file',
  FILE_AND_RISK_SIGNAL = 'file_and_risk_signal',
}

/**
 * Re-exports governed source-type values used by structured review findings.
 */
export {
  ReviewFindingSourceType as CliReviewFindingSourceType,
  ReviewRuleExecutionMode as CliReviewFindingExecutionMode,
  ReviewRuleSeverity as CliReviewFindingSeverity,
};

/**
 * Defines stable rule or classifier identifiers emitted by the CLI review pipeline.
 */
export enum CliReviewFindingRuleId {
  CS_003_UNRESOLVED_MARKERS = 'review-rule.cs-003-unresolved-markers',
  LOCKFILE_DELTA = 'lockfile_delta',
  MIGRATION_DETECTED = 'migration_detected',
  CI_WORKFLOW_CHANGED = 'ci_workflow_changed',
  RELEASE_SCRIPT_CHANGED = 'release_script_changed',
  SENSITIVE_PATH_CHANGED = 'sensitive_path_changed',
  CODE_CHANGE_WITHOUT_TEST_CHANGE = 'code_change_without_test_change',
}

/**
 * Defines artifact ids emitted by review lifecycle commands.
 */
export enum CliReviewArtifactId {
  REVIEW_REQUEST = 'review_request',
  REVIEW_ARTIFACT = 'review_artifact',
  REVIEW_TASK_CARD = 'review_task_card',
  REVIEW_VERIFY_RESULT = 'review_verify_result',
  REVIEW_LEDGER_BACKFILL = 'review_ledger_backfill',
}

/**
 * Declares the baseline normative inputs that delegated reviewer handoff must keep explicit.
 */
export const CLI_REVIEW_REQUIRED_NORMATIVE_INPUTS = [
  'AGENTS.md',
  '.repo-ai-governor/context/current-context.md',
  '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml',
  '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md',
] as const;

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
export const CLI_REVIEW_FINDING_SEVERITY_PRIORITY: Record<ReviewRuleSeverity, number> = {
  [ReviewRuleSeverity.P0]: 0,
  [ReviewRuleSeverity.P1]: 1,
  [ReviewRuleSeverity.P2]: 2,
  [ReviewRuleSeverity.P3]: 3,
};

/**
 * Declares the current deterministic check ids already wired into native CLI review.
 */
export const CLI_REVIEW_SUPPORTED_DETERMINISTIC_CHECK_IDS = [
  'cli-review.todo-marker-scan',
] as const;

/**
 * Narrows CS-033 follow-up to paths that are likely to own user-facing copy.
 */
export const CLI_REVIEW_USER_FACING_TEXT_PATH_PATTERNS = [
  /^apps\/[^/]+\/src\/commands\//u,
  /^apps\/[^/]+\/src\/(i18n|locales|prompts|ui)\//u,
  /^packages\/[^/]+\/src\/(i18n|locales|prompts|ui)\//u,
] as const;

/**
 * Provides lightweight content hints for changed files that likely own user-facing copy.
 */
export const CLI_REVIEW_USER_FACING_TEXT_CONTENT_MARKERS = [
  'localizeText(',
  'I18nRuntime',
  '.t(',
] as const;

/**
 * Identifies test-only files that should not trigger user-facing text follow-up on their own.
 */
export const CLI_REVIEW_TEST_FILE_PATH_PATTERN =
  /(?:^test\/|\/test\/|\.test\.ts$|\.integration\.test\.ts$|\.e2e\.test\.ts$|\.contract\.test\.ts$)/u;

/**
 * Declares the canonical dedupe key strategy shared by hybrid review passes.
 */
export const CLI_REVIEW_HYBRID_DEDUPE_STRATEGY = 'ruleId+file+line';
