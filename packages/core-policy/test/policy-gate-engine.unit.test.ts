import {
  type ChangeRiskEvaluationResult,
  ChangeRiskLevel,
  ChangeRiskReasonCode,
  ChangeRiskRequiredAction,
} from "@repo-ai-governor/core-change-risk";
import { PolicyDecisionSource, PolicyGateEngine, PolicyGateRuleId } from "../src/index.js";

function createRiskEvaluationFixture(
  overrides: Partial<ChangeRiskEvaluationResult> = {},
): ChangeRiskEvaluationResult {
  return {
    riskLevel: ChangeRiskLevel.LOW,
    riskReasons: [
      {
        code: ChangeRiskReasonCode.HIGH_RISK_COMMAND_CLASS,
        message: "baseline reason",
        evidence: ["command_class=code_edit"],
      },
    ],
    requiredAction: ChangeRiskRequiredAction.ALLOW,
    requiredReviewerRoles: [],
    matchedPolicies: ["policy.risk.action.allow"],
    ...overrides,
  };
}

describe("core-policy unit", () => {
  it("upgrades allow decision to block when proposal approval is missing", () => {
    const engine = new PolicyGateEngine();
    const result = engine.evaluate({
      riskEvaluation: createRiskEvaluationFixture(),
      context: {
        executionId: "exec-policy-unit-001",
        stageId: "stage-policy",
        routeKey: "policy",
        proposalApproved: false,
        reviewVerifyConsecutiveFailures: 0,
      },
    });

    expect(result.policyOutcome).toBe(ChangeRiskRequiredAction.BLOCK);
    expect(result.decisionSource).toBe(PolicyDecisionSource.POLICY_RULE);
    expect(result.matchedRuleIds).toContain(PolicyGateRuleId.PROPOSAL_APPROVAL_REQUIRED);
  });
});
