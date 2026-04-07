/**
 * Defines supported execution modes for projected review rules.
 */
export enum ReviewRuleExecutionMode {
  DETERMINISTIC = 'deterministic',
  STANDARDS_GUIDED = 'standards_guided',
  MANUAL_ONLY = 'manual_only',
}

/**
 * Defines provenance types retained by governed review findings.
 */
export enum ReviewFindingSourceType {
  DETERMINISTIC_RULE = 'deterministic_rule',
  STANDARDS_GUIDED_INFERENCE = 'standards_guided_inference',
  RISK_INFERENCE = 'risk_inference',
}

/**
 * Defines severity levels for review-rule findings.
 */
export enum ReviewRuleSeverity {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

/**
 * Defines boundary triggers used to activate projected review rules.
 */
export enum ReviewRuleApplicability {
  ALWAYS = 'always',
  GOVERNANCE_DOC_CHANGE = 'governance_doc_change',
  TASK_LEDGER_CHANGE = 'task_ledger_change',
  REVIEW_LIFECYCLE_CHANGE = 'review_lifecycle_change',
  USER_FACING_TEXT_CHANGE = 'user_facing_text_change',
  CODE_AFFECTING_CHANGE = 'code_affecting_change',
}

/**
 * Defines runtime enum value sets for review-rule validation.
 */
export const REVIEW_RULE_EXECUTION_MODE_VALUES = new Set<string>(
  Object.values(ReviewRuleExecutionMode),
);
export const REVIEW_FINDING_SOURCE_TYPE_VALUES = new Set<string>(
  Object.values(ReviewFindingSourceType),
);
export const REVIEW_RULE_SEVERITY_VALUES = new Set<string>(Object.values(ReviewRuleSeverity));
export const REVIEW_RULE_APPLICABILITY_VALUES = new Set<string>(
  Object.values(ReviewRuleApplicability),
);
