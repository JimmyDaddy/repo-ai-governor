import type {
  ChangeRiskRequiredAction,
  ChangeRiskReviewerRole,
} from '@repo-ai-governor/core-change-risk';
import type { PolicyGateRuleId } from '../../constants/index.js';

/**
 * Defines policy-gate outcomes; values align with change-risk required actions.
 */
export type PolicyGateOutcome = ChangeRiskRequiredAction;

/**
 * Defines reviewer role identifiers carried through policy output.
 */
export type PolicyReviewerRole = ChangeRiskReviewerRole;

/**
 * Defines policy rule id value space with extension support.
 */
export type PolicyGateRuleKey = PolicyGateRuleId | (string & {});
