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
