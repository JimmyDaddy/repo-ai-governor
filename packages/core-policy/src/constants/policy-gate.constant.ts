import { ChangeRiskRequiredAction } from "../../../core-change-risk/src/index.js";

/**
 * Defines supported human feedback decisions for HITL callbacks.
 */
export enum PolicyHitlDecision {
  APPROVE = "approve",
  REJECT = "reject",
  REVISE = "revise",
}

/**
 * Defines traceable decision sources for audit records.
 */
export enum PolicyDecisionSource {
  RISK_REQUIRED_ACTION = "risk_required_action",
  POLICY_RULE = "policy_rule",
  HITL_FEEDBACK = "hitl_feedback",
}

/**
 * Defines baseline policy rule identifiers.
 */
export enum PolicyGateRuleId {
  PROPOSAL_APPROVAL_REQUIRED = "policy.hitl.proposal_approval_required",
  REVIEW_VERIFY_FAILURE_ESCALATION = "policy.hitl.review_verify_failure_escalation",
  RISK_ACTION_BLOCK = "policy.risk.action.block",
  RISK_ACTION_ESCALATE = "policy.risk.action.escalate",
  RISK_ACTION_CONFIRM = "policy.risk.action.confirm",
}

/**
 * Defines default escalation threshold for review-verify consecutive failures.
 */
export const DEFAULT_REVIEW_VERIFY_FAILURE_ESCALATION_THRESHOLD = 2;

/**
 * Defines deterministic severity ranking used for tie-breaking matched rules.
 */
export const POLICY_OUTCOME_SEVERITY: Record<ChangeRiskRequiredAction, number> = {
  [ChangeRiskRequiredAction.ALLOW]: 1,
  [ChangeRiskRequiredAction.CONFIRM]: 2,
  [ChangeRiskRequiredAction.ESCALATE]: 3,
  [ChangeRiskRequiredAction.BLOCK]: 4,
};

/**
 * Defines valid policy outcomes accepted by runtime validation.
 */
export const POLICY_GATE_OUTCOME_VALUES = new Set<string>(Object.values(ChangeRiskRequiredAction));

/**
 * Defines valid HITL feedback decisions accepted by runtime validation.
 */
export const POLICY_HITL_DECISION_VALUES = new Set<string>(Object.values(PolicyHitlDecision));
