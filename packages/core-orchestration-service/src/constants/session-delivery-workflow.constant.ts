/**
 * Defines the shared-session context key that stores the delivery workflow overlay.
 */
export const SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY = 'deliveryWorkflow';

/**
 * Defines the current schema version for persisted delivery workflow state.
 */
export const SESSION_DELIVERY_WORKFLOW_VERSION = 1 as const;

/**
 * Declares the only orchestration-owned parent capability for the delivery workflow overlay.
 */
export const SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID = {
  DELIVER: 'deliver',
} as const;

/**
 * Declares the delivery workflow phase overlay vocabulary.
 */
export const SESSION_DELIVERY_WORKFLOW_PHASE = {
  REQUIREMENT_CAPTURE: 'requirement_capture',
  REQUIREMENT_REVIEW_PENDING: 'requirement_review_pending',
  SOLUTION_DRAFTING: 'solution_drafting',
  SOLUTION_REVIEW_PENDING: 'solution_review_pending',
  TASK_DECOMPOSITION_PREVIEW: 'task_decomposition_preview',
  TASK_PLAN_COMMIT_PENDING: 'task_plan_commit_pending',
  EXECUTION_ACTIVE: 'execution_active',
  REVIEW_PENDING: 'review_pending',
  REVIEW_VERIFY_PENDING: 'review_verify_pending',
  RESOLVED: 'resolved',
  BLOCKED: 'blocked',
} as const;

/**
 * Declares the only requirement-review outcomes that can authorize approved durable briefs.
 */
export const SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME = {
  PENDING: 'pending',
  EXPLICIT_APPROVAL: 'explicit_approval',
  DOCS_ONLY_REVIEW: 'docs_only_review',
  REJECTED: 'rejected',
} as const;
