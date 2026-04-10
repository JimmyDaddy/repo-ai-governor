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

  it('keeps review-verify on direct execute because the catalog now treats it as an AI fixed workflow', () => {
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
        handoffExecutionMode: 'direct_execute',
      }),
    );
  });

  it('routes the official English review-verify example to review verify instead of doctor', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const reviewVerifyPlan = registry.resolvePlan('Verify that the review findings are fixed.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(reviewVerifyPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.review.verify',
        executionIntent: 'review.verify',
        suggestedSlashCommand: '/review verify',
        handoffExecutionMode: 'direct_execute',
      }),
    );
  });

  it('routes the official Chinese review-verify example to review verify instead of doctor', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const reviewVerifyPlan = registry.resolvePlan('帮我验证 review findings 是否都修好了。', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(reviewVerifyPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.review.verify',
        executionIntent: 'review.verify',
        suggestedSlashCommand: '/review verify',
        handoffExecutionMode: 'direct_execute',
      }),
    );
  });

  it('does not steal verify-style asks when an explicit reviewer role mention is already present', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const reviewVerifyPlan = registry.resolvePlan('verify that the review findings are fixed.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: true,
    });

    expect(reviewVerifyPlan).toBeNull();
  });

  it('keeps the /review ai-workflow prompt on review instead of workflow preview', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const reviewPlan = registry.resolvePlan(
      [
        'Run the standard governed code-review workflow for the current working scope.',
        'Focus on user-visible regressions, behavior risk, and missing tests.',
        'Return a structured review-style result instead of a free-form expert brainstorm.',
      ].join('\n'),
      {
        preferredSurface: AdapterSurface.CODEX,
        configuredRoleMentionPresent: false,
      },
    );

    expect(reviewPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.review.code',
        executionIntent: 'review.start',
        suggestedSlashCommand: '/review',
        handoffExecutionMode: 'direct_execute',
      }),
    );
  });

  it('keeps the /review verify ai-workflow prompt on review verify instead of workflow preview', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const reviewVerifyPlan = registry.resolvePlan(
      [
        'Run the standard review-verification workflow for the latest governed review context.',
        'Recheck the existing review artifact or fix result and determine whether accepted findings are actually resolved.',
        'Return a structured verification result rather than an open-ended expert discussion.',
      ].join('\n'),
      {
        preferredSurface: AdapterSurface.CODEX,
        configuredRoleMentionPresent: false,
      },
    );

    expect(reviewVerifyPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.review.verify',
        executionIntent: 'review.verify',
        suggestedSlashCommand: '/review verify',
        handoffExecutionMode: 'direct_execute',
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

  it('does not bridge generic implementation asks into /run by default', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const runPlan = registry.resolvePlan('please implement the new settings page', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(runPlan).toBeNull();
  });

  it('does not hijack generic validation asks into /doctor after verify removal', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const doctorPlan = registry.resolvePlan('please validate this API response shape', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(doctorPlan).toBeNull();
  });

  it('keeps explicit adapter readiness validation on the migrated /doctor path', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const doctorPlan = registry.resolvePlan('帮我校验当前适配器接入是否就绪', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(doctorPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.doctor.environment',
        executionIntent: 'doctor.adapters',
        suggestedSlashCommand: '/doctor',
        handoffExecutionMode: 'direct_execute',
        commandBatches: [
          expect.objectContaining({
            slashQuery: '/doctor',
            bridgeArgv: ['doctor', '--adapters', '--output', 'pretty', '--single-tool-all-roles', 'codex'],
          }),
        ],
      }),
    );
  });

  it('keeps explicit reusable workflow execution asks on the governed /run handoff', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const runPlan = registry.resolvePlan('run the next governed workflow for this repo', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(runPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.run.task',
        executionIntent: 'run.task',
        suggestedSlashCommand: '/run',
        handoffExecutionMode: 'preview_confirm',
        commandBatches: [
          expect.objectContaining({
            slashQuery: '/run',
            bridgeArgv: ['run', '--dry-run', '--trace', '--single-tool-all-roles', 'codex'],
          }),
        ],
      }),
    );
  });
});
