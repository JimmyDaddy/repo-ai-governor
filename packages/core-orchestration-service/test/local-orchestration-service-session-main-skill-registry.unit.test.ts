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

  it('derives governed branch-switch metadata from the canonical capability catalog seed', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const branchSwitchPlan = registry.resolvePlan('帮我把当前代码分支切换到 main', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(branchSwitchPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.workspace.switch_branch',
        executionIntent: 'workspace.branch_switch',
        suggestedSlashCommand: '/workspace switch-branch',
        handoffExecutionMode: 'preview_confirm',
        commandBatches: [
          expect.objectContaining({
            slashQuery: '/workspace switch-branch main',
            bridgeArgv: ['workspace', 'switch-branch', 'main', '--single-tool-all-roles', 'codex'],
          }),
        ],
      }),
    );
  });

  it('accepts Git-valid branch names such as feature+foo in natural-language branch-switch requests', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const branchSwitchPlan = registry.resolvePlan('帮我把当前代码分支切换到 feature+foo', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(branchSwitchPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.workspace.switch_branch',
        executionIntent: 'workspace.branch_switch',
        suggestedSlashCommand: '/workspace switch-branch',
        handoffExecutionMode: 'preview_confirm',
        commandBatches: [
          expect.objectContaining({
            slashQuery: '/workspace switch-branch feature+foo',
            bridgeArgv: [
              'workspace',
              'switch-branch',
              'feature+foo',
              '--single-tool-all-roles',
              'codex',
            ],
          }),
        ],
      }),
    );
  });

  it('accepts Unicode branch names in natural-language branch-switch requests', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const branchSwitchPlan = registry.resolvePlan('checkout 修复-分支', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(branchSwitchPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.workspace.switch_branch',
        executionIntent: 'workspace.branch_switch',
        suggestedSlashCommand: '/workspace switch-branch',
        handoffExecutionMode: 'preview_confirm',
        commandBatches: [
          expect.objectContaining({
            slashQuery: '/workspace switch-branch 修复-分支',
            bridgeArgv: [
              'workspace',
              'switch-branch',
              '修复-分支',
              '--single-tool-all-roles',
              'codex',
            ],
          }),
        ],
      }),
    );
  });

  it('accepts dotted branch names and strips trailing sentence punctuation in natural-language requests', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const branchSwitchPlan = registry.resolvePlan('checkout release/1.2.3.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(branchSwitchPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.workspace.switch_branch',
        executionIntent: 'workspace.branch_switch',
        suggestedSlashCommand: '/workspace switch-branch',
        handoffExecutionMode: 'preview_confirm',
        commandBatches: [
          expect.objectContaining({
            slashQuery: '/workspace switch-branch release/1.2.3',
            bridgeArgv: [
              'workspace',
              'switch-branch',
              'release/1.2.3',
              '--single-tool-all-roles',
              'codex',
            ],
          }),
        ],
      }),
    );
  });
});
