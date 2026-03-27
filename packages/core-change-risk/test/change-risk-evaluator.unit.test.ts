import {
  ChangeRiskEvaluator,
  ChangeRiskFileCategory,
  ChangeRiskLevel,
  ChangeRiskRequiredAction,
} from '../src/index.js';

describe('core-change-risk unit', () => {
  it('returns low-risk allow outcome for baseline code edits', () => {
    const evaluator = new ChangeRiskEvaluator();
    const result = evaluator.evaluate({
      changedPaths: ['packages/core-process/src/process-compiler.ts'],
      fileCategories: [ChangeRiskFileCategory.CODE],
      requestedPermissions: [],
      commandClass: 'code_edit',
      lockfileDelta: false,
      migrationDetected: false,
      ciWorkflowChanged: false,
      releaseScriptChanged: false,
    });

    expect(result.riskLevel).toBe(ChangeRiskLevel.LOW);
    expect(result.requiredAction).toBe(ChangeRiskRequiredAction.ALLOW);
    expect(result.matchedPolicies).toContain('policy.risk.action.allow');
  });
});
