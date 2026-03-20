import {
  ChangeRiskEvaluator,
  ChangeRiskFileCategory,
  ChangeRiskLevel,
  ChangeRiskRequiredAction,
} from "../packages/core-change-risk/src/index.js";
import {
  GovernanceReviewerRole,
  GovernorErrorCode,
  RuntimeError,
} from "../packages/shared/src/index.js";

describe("ChangeRiskEvaluator smoke", () => {
  it("returns low risk allow decision for baseline code change", () => {
    const evaluator = new ChangeRiskEvaluator();

    const result = evaluator.evaluate({
      changedPaths: ["packages/core-process/src/process-compiler.ts"],
      fileCategories: [ChangeRiskFileCategory.CODE],
      requestedPermissions: [],
      commandClass: "code_edit",
      lockfileDelta: false,
      migrationDetected: false,
      ciWorkflowChanged: false,
      releaseScriptChanged: false,
    });

    expect(result.riskLevel).toBe(ChangeRiskLevel.LOW);
    expect(result.requiredAction).toBe(ChangeRiskRequiredAction.ALLOW);
    expect(result.requiredReviewerRoles).toEqual([]);
    expect(result.matchedPolicies).toContain("policy.risk.action.allow");
  });

  it("returns critical risk block decision for stacked high-risk facts", () => {
    const evaluator = new ChangeRiskEvaluator();

    const result = evaluator.evaluate({
      changedPaths: [".github/workflows/release.yml", "infra/prod/main.tf"],
      fileCategories: [
        ChangeRiskFileCategory.CI_WORKFLOW,
        ChangeRiskFileCategory.INFRA,
        ChangeRiskFileCategory.RELEASE,
      ],
      requestedPermissions: ["filesystem.write.repo", "network.external.http"],
      commandClass: "deployment",
      lockfileDelta: true,
      migrationDetected: true,
      ciWorkflowChanged: true,
      releaseScriptChanged: true,
    });

    expect(result.riskLevel).toBe(ChangeRiskLevel.CRITICAL);
    expect(result.requiredAction).toBe(ChangeRiskRequiredAction.BLOCK);
    expect(result.requiredReviewerRoles).toEqual([
      GovernanceReviewerRole.MAINTAINER,
      GovernanceReviewerRole.SECURITY_REVIEWER,
    ]);
    expect(result.riskReasons.length).toBeGreaterThan(3);
    expect(result.matchedPolicies).toContain("policy.risk.action.block");
  });

  it("throws standardized error when commandClass is missing", () => {
    const evaluator = new ChangeRiskEvaluator();

    expect(() =>
      evaluator.evaluate({
        changedPaths: ["packages/config/src/schema-validator.ts"],
        fileCategories: [ChangeRiskFileCategory.CODE],
        requestedPermissions: [],
        commandClass: "",
        lockfileDelta: false,
        migrationDetected: false,
        ciWorkflowChanged: false,
        releaseScriptChanged: false,
      }),
    ).toThrowError(RuntimeError);

    try {
      evaluator.evaluate({
        changedPaths: ["packages/config/src/schema-validator.ts"],
        fileCategories: [ChangeRiskFileCategory.CODE],
        requestedPermissions: [],
        commandClass: "",
        lockfileDelta: false,
        migrationDetected: false,
        ciWorkflowChanged: false,
        releaseScriptChanged: false,
      });
    } catch (error) {
      const standardizedError = error as RuntimeError;
      expect(standardizedError.code).toBe(GovernorErrorCode.CHANGE_RISK_FACTS_INVALID);
    }
  });
});
