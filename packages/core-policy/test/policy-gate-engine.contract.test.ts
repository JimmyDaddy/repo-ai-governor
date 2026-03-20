import {
  type ChangeRiskEvaluationResult,
  ChangeRiskLevel,
  ChangeRiskReasonCode,
  ChangeRiskRequiredAction,
} from "../../core-change-risk/src/index.js";
import { GovernanceReviewerRole, GovernorErrorCode, RuntimeError } from "../../shared/src/index.js";
import {
  PolicyDecisionSource,
  PolicyGateEngine,
  PolicyGateRuleId,
  PolicyHitlDecision,
} from "../src/index.js";

/**
 * Creates baseline risk evaluation payload for policy smoke tests.
 * @param overrides Optional override fields.
 * @returns Risk evaluation payload.
 */
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

describe("PolicyGateEngine smoke", () => {
  it("keeps allow when baseline risk requires no manual gate", () => {
    const policyGateEngine = new PolicyGateEngine();

    const result = policyGateEngine.evaluate({
      riskEvaluation: createRiskEvaluationFixture(),
      context: {
        executionId: "exec-policy-001",
        stageId: "stage-policy",
        routeKey: "policy",
        proposalApproved: true,
        reviewVerifyConsecutiveFailures: 0,
      },
    });

    expect(result.policyOutcome).toBe(ChangeRiskRequiredAction.ALLOW);
    expect(result.decisionSource).toBe(PolicyDecisionSource.RISK_REQUIRED_ACTION);
    expect(result.shouldTriggerHitl).toBe(false);
    expect(result.matchedRuleIds).toEqual([]);
  });

  it("maps risk confirm action to confirm policy outcome and requires HITL", () => {
    const policyGateEngine = new PolicyGateEngine();

    const result = policyGateEngine.evaluate({
      riskEvaluation: createRiskEvaluationFixture({
        requiredAction: ChangeRiskRequiredAction.CONFIRM,
        matchedPolicies: ["policy.risk.action.confirm"],
      }),
      context: {
        executionId: "exec-policy-002",
        stageId: "stage-policy",
        routeKey: "policy",
        proposalApproved: true,
        reviewVerifyConsecutiveFailures: 0,
      },
    });

    expect(result.policyOutcome).toBe(ChangeRiskRequiredAction.CONFIRM);
    expect(result.decisionSource).toBe(PolicyDecisionSource.POLICY_RULE);
    expect(result.shouldTriggerHitl).toBe(true);
    expect(result.matchedRuleIds).toContain(PolicyGateRuleId.RISK_ACTION_CONFIRM);
  });

  it("blocks when proposal approval is missing", () => {
    const policyGateEngine = new PolicyGateEngine();

    const result = policyGateEngine.evaluate({
      riskEvaluation: createRiskEvaluationFixture({
        requiredAction: ChangeRiskRequiredAction.ALLOW,
      }),
      context: {
        executionId: "exec-policy-003",
        stageId: "stage-policy",
        routeKey: "policy",
        proposalApproved: false,
        reviewVerifyConsecutiveFailures: 0,
      },
    });

    expect(result.policyOutcome).toBe(ChangeRiskRequiredAction.BLOCK);
    expect(result.matchedRuleIds).toContain(PolicyGateRuleId.PROPOSAL_APPROVAL_REQUIRED);
    expect(result.requiredReviewerRoles).toEqual([GovernanceReviewerRole.MAINTAINER]);
  });

  it("escalates when review-verify failures exceed threshold", () => {
    const policyGateEngine = new PolicyGateEngine({
      reviewVerifyFailureEscalationThreshold: 2,
    });

    const result = policyGateEngine.evaluate({
      riskEvaluation: createRiskEvaluationFixture({
        requiredAction: ChangeRiskRequiredAction.ALLOW,
      }),
      context: {
        executionId: "exec-policy-004",
        stageId: "stage-policy",
        routeKey: "policy",
        proposalApproved: true,
        reviewVerifyConsecutiveFailures: 2,
      },
    });

    expect(result.policyOutcome).toBe(ChangeRiskRequiredAction.ESCALATE);
    expect(result.matchedRuleIds).toContain(PolicyGateRuleId.REVIEW_VERIFY_FAILURE_ESCALATION);
    expect(result.shouldTriggerHitl).toBe(true);
  });

  it("applies HITL feedback and resolves final policy outcome", () => {
    const policyGateEngine = new PolicyGateEngine();
    const evaluationResult = policyGateEngine.evaluate({
      riskEvaluation: createRiskEvaluationFixture({
        requiredAction: ChangeRiskRequiredAction.CONFIRM,
        matchedPolicies: ["policy.risk.action.confirm"],
      }),
      context: {
        executionId: "exec-policy-005",
        stageId: "stage-policy",
        routeKey: "policy",
        proposalApproved: true,
        reviewVerifyConsecutiveFailures: 0,
      },
    });

    const approvedResolution = policyGateEngine.applyHitlFeedback(evaluationResult, {
      decision: PolicyHitlDecision.APPROVE,
      reason: "human reviewer approved",
      constraints: ["no force push"],
    });
    const rejectedResolution = policyGateEngine.applyHitlFeedback(evaluationResult, {
      decision: PolicyHitlDecision.REJECT,
      reason: "change violates release policy",
    });
    const reviseResolution = policyGateEngine.applyHitlFeedback(evaluationResult, {
      decision: PolicyHitlDecision.REVISE,
      reason: "requires patch update and re-check",
    });

    expect(approvedResolution.finalOutcome).toBe(ChangeRiskRequiredAction.ALLOW);
    expect(rejectedResolution.finalOutcome).toBe(ChangeRiskRequiredAction.BLOCK);
    expect(reviseResolution.finalOutcome).toBe(ChangeRiskRequiredAction.ESCALATE);
    expect(approvedResolution.auditRecord.matchedPolicies).toContain(
      "policy.hitl.feedback.approve",
    );
    expect(reviseResolution.auditRecord.matchedPolicies).toContain("policy.hitl.feedback.revise");
  });

  it("throws standardized error for invalid risk level", () => {
    const policyGateEngine = new PolicyGateEngine();

    expect(() =>
      policyGateEngine.evaluate({
        riskEvaluation: {
          ...createRiskEvaluationFixture(),
          riskLevel: "not-a-valid-level" as ChangeRiskLevel,
        },
        context: {
          executionId: "exec-policy-007",
          stageId: "stage-policy",
          routeKey: "policy",
          proposalApproved: true,
          reviewVerifyConsecutiveFailures: 0,
        },
      }),
    ).toThrowError(RuntimeError);

    try {
      policyGateEngine.evaluate({
        riskEvaluation: {
          ...createRiskEvaluationFixture(),
          riskLevel: "not-a-valid-level" as ChangeRiskLevel,
        },
        context: {
          executionId: "exec-policy-007",
          stageId: "stage-policy",
          routeKey: "policy",
          proposalApproved: true,
          reviewVerifyConsecutiveFailures: 0,
        },
      });
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.POLICY_GATE_INPUT_INVALID);
    }
  });

  it("throws standardized error for invalid HITL feedback", () => {
    const policyGateEngine = new PolicyGateEngine();
    const evaluationResult = policyGateEngine.evaluate({
      riskEvaluation: createRiskEvaluationFixture({
        requiredAction: ChangeRiskRequiredAction.CONFIRM,
      }),
      context: {
        executionId: "exec-policy-006",
        stageId: "stage-policy",
        routeKey: "policy",
        proposalApproved: true,
        reviewVerifyConsecutiveFailures: 0,
      },
    });

    expect(() =>
      policyGateEngine.applyHitlFeedback(evaluationResult, {
        decision: PolicyHitlDecision.APPROVE,
        reason: "",
      }),
    ).toThrowError(RuntimeError);

    try {
      policyGateEngine.applyHitlFeedback(evaluationResult, {
        decision: PolicyHitlDecision.APPROVE,
        reason: "",
      });
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID);
    }
  });
});
