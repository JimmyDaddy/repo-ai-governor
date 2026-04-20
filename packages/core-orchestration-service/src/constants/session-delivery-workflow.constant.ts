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
 * Declares the delivery workflow pending-action vocabulary owned by orchestration.
 */
export const SESSION_DELIVERY_WORKFLOW_PENDING_ACTION = {
  CAPTURE_REQUIREMENT_OR_ATTACH_APPROVED_BRIEF: 'capture_requirement_or_attach_approved_brief',
  CONFIRM_TASK_PLAN_COMMIT: 'confirm_task_plan_commit',
  REFINE_TASK_PLAN_PREVIEW: 'refine_task_plan_preview',
  START_TASK_DRIVEN_EXECUTION_FLOW: 'start_task_driven_execution_flow',
  REFINE_TASK_PLAN_PREVIEW_OR_RECONFIRM: 'refine_task_plan_preview_or_reconfirm',
  START_GOVERNED_REVIEW_FLOW: 'start_governed_review_flow',
  RUN_REVIEW_VERIFY: 'run_review_verify',
  ADDRESS_ACCEPTED_REVIEW_FINDINGS: 'address_accepted_review_findings',
  RUN_FRESH_CLEAN_RECHECK: 'run_fresh_clean_recheck',
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
