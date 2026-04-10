/**
 * Declares the owner module for the canonical `session.main` governed capability catalog.
 *
 * Why this exists:
 * productization work needs one explicit ownership marker so CLI help, explainer answers, and
 * shared session metadata can all point back to the same orchestration-owned truth source.
 */
export const SESSION_MAIN_CAPABILITY_CATALOG_OWNER_MODULE_ID = 'runtime.orchestration' as const;

/**
 * Freezes the current descriptor contract version for governed `session.main` capabilities.
 *
 * Why this exists:
 * catalog producers and downstream consumers need one stable version tag while the explainer
 * stack is being rolled out across multiple sprint tasks.
 */
export const SESSION_MAIN_CAPABILITY_DESCRIPTOR_VERSION = '2026-04-08' as const;

/**
 * Declares the governed interaction-model taxonomy for public `session.main` capability surfaces.
 *
 * Why this exists:
 * orchestration-owned capability truth now needs to distinguish raw role entry, productized AI
 * workflows, deterministic utilities, and unstable public commands without reintroducing ad-hoc
 * UI-only command semantics.
 */
export const SESSION_MAIN_CAPABILITY_INTERACTION_MODEL = {
  RAW_ROLE_ENTRY: 'raw_role_entry',
  AI_FIXED_WORKFLOW: 'ai_fixed_workflow',
  DETERMINISTIC_UTILITY: 'deterministic_utility',
  PENDING_EXISTENCE_REVIEW: 'pending_existence_review',
  EXPLAIN_ONLY: 'explain_only',
} as const;

/**
 * Declares the public primary-entry vocabulary for governed `session.main` capabilities.
 *
 * Why this exists:
 * discoverability and help consumers need one canonical way to explain whether a capability is
 * primarily reached by role mention, slash command, CLI command, or a conversational answer.
 */
export const SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY = {
  ROLE_MENTION: 'role_mention',
  SLASH_COMMAND: 'slash_command',
  CLI_COMMAND: 'cli_command',
  CONVERSATIONAL_ANSWER: 'conversational_answer',
} as const;

/**
 * Declares the backing execution model for governed `session.main` capabilities.
 *
 * Why this exists:
 * downstream consumers need to tell apart raw role delegation, templated AI workflows, and pure
 * command bridges while still reusing the same orchestration-owned capability descriptor surface.
 */
export const SESSION_MAIN_CAPABILITY_BACKING_EXECUTION = {
  RAW_ROLE_DELEGATE: 'raw_role_delegate',
  TEMPLATED_AI_WORKFLOW: 'templated_ai_workflow',
  PURE_COMMAND: 'pure_command',
  UNDECIDED: 'undecided',
} as const;

/**
 * Declares the finite governed capability ids owned by the canonical `session.main` catalog.
 *
 * Why this exists:
 * help discoverability, explanation routing, and shared-session metadata should reuse one
 * centrally managed capability id set instead of drifting as duplicated string literals.
 */
export const SESSION_MAIN_CAPABILITY_ID = {
  HELP: 'help',
  CONNECT: 'connect',
  BRANCH_SWITCH: 'branch_switch',
  DOCTOR: 'doctor',
  VERIFY: 'verify',
  WORKFLOW: 'workflow',
  PLAN: 'plan',
  REVIEW: 'review',
  REVIEW_VERIFY: 'review_verify',
  RUN: 'run',
} as const;

/**
 * Declares the structured capability-answer kinds accepted by the formal shell contract.
 *
 * Why this exists:
 * the orchestration package should publish the same finite-set answer taxonomy that later turn
 * outcome projection and shell consumers will rely on, even before those later tasks land.
 */
export const SESSION_MAIN_CAPABILITY_ANSWER_KIND = {
  OVERVIEW: 'overview',
  DETAIL: 'detail',
  EXAMPLES: 'examples',
  COMPARISON: 'comparison',
} as const;

/**
 * Declares the dynamic availability status values projected on top of the static capability catalog.
 *
 * Why this exists:
 * explainer answers need one governed vocabulary for "ready now" vs "setup required" decisions
 * without reintroducing scattered string literals across dispatcher, runtime, and presenter seams.
 */
export const SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  SETUP_REQUIRED: 'setup_required',
  UNAVAILABLE: 'unavailable',
} as const;
