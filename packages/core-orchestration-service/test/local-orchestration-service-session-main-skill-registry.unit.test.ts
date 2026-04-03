import { AdapterSurface } from '@repo-ai-governor/shared';
import { LocalOrchestrationServiceSessionMainSkillRegistry } from '../src/local-orchestration-service-session-main-skill-registry.js';

describe('LocalOrchestrationServiceSessionMainSkillRegistry', () => {
  it('derives governed review metadata from the canonical capability catalog seed', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const reviewPlan = registry.resolvePlan('please review the current diff', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(reviewPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.review.code',
        executionIntent: 'review.start',
        suggestedSlashCommand: '/review',
        handoffExecutionMode: 'direct_execute',
      }),
    );
  });

  it('keeps review-verify on preview-confirm because the catalog marks it as confirmation-required', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const reviewVerifyPlan = registry.resolvePlan('please review verify the fixes', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(reviewVerifyPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.review.verify',
        executionIntent: 'review.verify',
        suggestedSlashCommand: '/review verify',
        handoffExecutionMode: 'preview_confirm',
      }),
    );
  });

  it('derives workflow preview bridge metadata from the canonical capability catalog seed', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const workflowPlan = registry.resolvePlan('show me the workflow preview', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(workflowPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.workflow.preview',
        executionIntent: 'workflow.preview',
        suggestedSlashCommand: '/workflow',
        handoffExecutionMode: 'direct_execute',
        commandBatches: [
          expect.objectContaining({
            slashQuery: '/workflow',
            bridgeArgv: ['workflow', 'preview', '--single-tool-all-roles', AdapterSurface.CODEX],
          }),
        ],
      }),
    );
  });
});
