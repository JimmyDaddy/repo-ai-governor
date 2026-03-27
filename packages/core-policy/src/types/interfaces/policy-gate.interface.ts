import type {
  ChangeRiskEvaluationResult,
  ChangeRiskLevel,
  ChangeRiskRequiredAction,
} from '@repo-ai-governor/core-change-risk';
import type { PolicyDecisionSource, PolicyHitlDecision } from '../../constants/index.js';
import type { PolicyGateOutcome, PolicyGateRuleKey, PolicyReviewerRole } from '../aliases/index.js';

/**
 * Defines one structured condition block for policy-rule matching.
 */
export interface PolicyGateRuleCondition {
  proposalApproved?: boolean;
  minReviewVerifyConsecutiveFailures?: number;
  requiredActions?: ChangeRiskRequiredAction[];
  riskLevels?: ChangeRiskLevel[];
  matchedPoliciesAny?: string[];
}

/**
 * Defines one structured policy rule consumed by policy gate engine.
 */
export interface PolicyGateRule {
  ruleId: PolicyGateRuleKey;
  description: string;
  reason: string;
  outcome: PolicyGateOutcome;
  priority: number;
  enabled: boolean;
  condition: PolicyGateRuleCondition;
  requiredReviewerRoles?: PolicyReviewerRole[];
}

/**
 * Defines runtime context facts consumed by policy-rule matching.
 */
export interface PolicyGateEvaluationContext {
  executionId: string;
  stageId: string;
  routeKey: string;
  proposalApproved: boolean;
  reviewVerifyConsecutiveFailures: number;
}

/**
 * Defines policy gate evaluate input payload.
 */
export interface PolicyGateEvaluateInput {
  riskEvaluation: ChangeRiskEvaluationResult;
  context: PolicyGateEvaluationContext;
  compiledRules?: PolicyGateRule[];
}

/**
 * Defines policy gate engine initialization options.
 */
export interface PolicyGateEngineOptions {
  defaultRules?: PolicyGateRule[];
  reviewVerifyFailureEscalationThreshold?: number;
}

/**
 * Defines human feedback payload for confirm/escalate callbacks.
 */
export interface PolicyHitlFeedback {
  decision: PolicyHitlDecision;
  reason: string;
  constraints?: string[];
}

/**
 * Defines required/optional fields contract for HITL callback forms.
 */
export interface PolicyHitlFeedbackSchema {
  requiredFields: string[];
  optionalFields: string[];
}

/**
 * Defines policy audit record payload for downstream ledger sinks.
 */
export interface PolicyGateAuditRecord {
  executionId: string;
  stageId: string;
  routeKey: string;
  policyOutcome: PolicyGateOutcome;
  decisionSource: PolicyDecisionSource;
  reason: string;
  riskLevel: ChangeRiskLevel;
  requiredAction: ChangeRiskRequiredAction;
  matchedPolicies: string[];
  matchedRuleIds: string[];
  requiredReviewerRoles: PolicyReviewerRole[];
}

/**
 * Defines policy gate evaluation output.
 */
export interface PolicyGateEvaluationResult {
  policyOutcome: PolicyGateOutcome;
  decisionSource: PolicyDecisionSource;
  reason: string;
  matchedPolicies: string[];
  matchedRuleIds: string[];
  requiredReviewerRoles: PolicyReviewerRole[];
  shouldTriggerHitl: boolean;
  hitlFeedbackSchema: PolicyHitlFeedbackSchema | null;
  auditRecord: PolicyGateAuditRecord;
}

/**
 * Defines policy result after HITL decision is applied.
 */
export interface PolicyGateHitlResolutionResult {
  finalOutcome: PolicyGateOutcome;
  decisionSource: PolicyDecisionSource;
  reason: string;
  feedback: PolicyHitlFeedback;
  auditRecord: PolicyGateAuditRecord;
}
