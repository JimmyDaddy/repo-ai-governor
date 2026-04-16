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

  it('routes the official English deliver example to the governed deliver workflow', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const deliverPlan = registry.resolvePlan(
      'Help me deliver this requirement through the governed path.',
      {
        preferredSurface: AdapterSurface.CODEX,
        configuredRoleMentionPresent: false,
      },
    );

    expect(deliverPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.deliver.workflow',
        executionIntent: 'deliver.requirement_to_cr',
        suggestedSlashCommand: '/deliver',
        handoffExecutionMode: 'direct_execute',
      }),
    );
  });

  it('routes the official Chinese deliver example to the governed deliver workflow', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const deliverPlan = registry.resolvePlan('帮我把这个需求按受治理主路径交付下去。', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(deliverPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.deliver.workflow',
        executionIntent: 'deliver.requirement_to_cr',
        suggestedSlashCommand: '/deliver',
        handoffExecutionMode: 'direct_execute',
      }),
    );
  });

  it('keeps direct-object English governed-path delivery requests on the deliver workflow even without help-me phrasing', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const deliverPlan = registry.resolvePlan(
      'Please deliver this requirement through the governed path.',
      {
        preferredSurface: AdapterSurface.CODEX,
        configuredRoleMentionPresent: false,
      },
    );

    expect(deliverPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.deliver.workflow',
        executionIntent: 'deliver.requirement_to_cr',
        suggestedSlashCommand: '/deliver',
        handoffExecutionMode: 'direct_execute',
      }),
    );
  });

  it('keeps explicit requirement-to-cr review starts on the review child capability', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const reviewPlan = registry.resolvePlan('Start the requirement-to-cr review.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(reviewPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.review.code',
        executionIntent: 'review.start',
        suggestedSlashCommand: '/review',
      }),
    );
  });

  it('keeps explicit requirement-to-cr planning starts on the plan child capability', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const planPlan = registry.resolvePlan('Run the requirement-to-cr planning workflow.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(planPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.plan.task',
        executionIntent: 'plan.generate',
        suggestedSlashCommand: '/plan',
      }),
    );
  });

  it('keeps explicit task-driven execution asks on the run child capability', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const runPlan = registry.resolvePlan('Run the requirement-to-cr task-driven execution flow.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(runPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.run.task',
        executionIntent: 'run.task',
        suggestedSlashCommand: '/run',
      }),
    );
  });

  it('does not hijack review requests that only mention requirement-to-cr by name', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const reviewPlan = registry.resolvePlan('Review the requirement-to-cr design.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(reviewPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.review.code',
        executionIntent: 'review.start',
        suggestedSlashCommand: '/review',
      }),
    );
  });

  it('does not hijack planning requests that reference delivery orchestration by name', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const planPlan = registry.resolvePlan(
      'Plan the requirement-to-cr delivery orchestration rollout.',
      {
        preferredSurface: AdapterSurface.CODEX,
        configuredRoleMentionPresent: false,
      },
    );

    expect(planPlan).toEqual(
      expect.objectContaining({
        executionIntent: 'plan.generate',
        suggestedSlashCommand: '/plan',
      }),
    );
  });

  it('does not route generic deliver-the-artifact asks into the requirement-to-cr workflow', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const reviewFixPlan = registry.resolvePlan('Help me deliver the review fixes.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });
    const releaseNotesPlan = registry.resolvePlan('Help me deliver the release notes.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });
    const repositoryCleanupPlan = registry.resolvePlan('Help me deliver the repository cleanup.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });
    const repoMigrationPlan = registry.resolvePlan('Help me deliver the repo migration.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });
    const requirementBriefPlan = registry.resolvePlan(
      'Help me deliver the requirement brief to the team.',
      {
        preferredSurface: AdapterSurface.CODEX,
        configuredRoleMentionPresent: false,
      },
    );
    const requirementSummaryPlan = registry.resolvePlan(
      'Can you deliver this requirement summary by email?',
      {
        preferredSurface: AdapterSurface.CODEX,
        configuredRoleMentionPresent: false,
      },
    );
    const startReleaseNotesPlan = registry.resolvePlan('开始交付 release notes。', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });
    const startDrillPlan = registry.resolvePlan('发起交付演练。', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });
    const docsUpdatePlan = registry.resolvePlan('Start the requirement-to-cr docs update.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(reviewFixPlan?.executionIntent).not.toBe('deliver.requirement_to_cr');
    expect(releaseNotesPlan).toBeNull();
    expect(repositoryCleanupPlan).toBeNull();
    expect(repoMigrationPlan).toBeNull();
    expect(requirementBriefPlan).toBeNull();
    expect(requirementSummaryPlan).toBeNull();
    expect(startReleaseNotesPlan).toBeNull();
    expect(startDrillPlan).toBeNull();
    expect(docsUpdatePlan).toBeNull();
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

  it('keeps preview-style delivery workflow asks on /workflow instead of starting deliver', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const workflowPlan = registry.resolvePlan('Start the delivery workflow preview.', {
      preferredSurface: AdapterSurface.CODEX,
      configuredRoleMentionPresent: false,
    });

    expect(workflowPlan).toEqual(
      expect.objectContaining({
        skillId: 'skill.workflow.preview',
        executionIntent: 'workflow.preview',
        suggestedSlashCommand: '/workflow',
        handoffExecutionMode: 'direct_execute',
      }),
    );
  });

  it('lets generic delivery workflow asks fall through until requirement-to-cr or governed-path intent is explicit', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();

    const startWorkflowPlan = registry.resolvePlan(
      'Start the delivery workflow for the release notes.',
      {
        preferredSurface: AdapterSurface.CODEX,
        configuredRoleMentionPresent: false,
      },
    );
    const runWorkflowPlan = registry.resolvePlan(
      'Run the delivery workflow for our docs handoff.',
      {
        preferredSurface: AdapterSurface.CODEX,
        configuredRoleMentionPresent: false,
      },
    );

    expect(startWorkflowPlan).toBeNull();
    expect(runWorkflowPlan).toBeNull();
  });

  it('does not route explain-style governed-path deliver prompts into the requirement-to-cr workflow', () => {
    const registry = new LocalOrchestrationServiceSessionMainSkillRegistry();
    const explanationPrompts = [
      'Tell me about deliver in the governed path.',
      'Tell me about the deliver governed path capability.',
      'Show me examples for the deliver governed path capability.',
      'What does deliver in the governed path do?',
      'What can deliver in the governed path do?',
      'When should I use deliver in the governed path?',
      'Why should I use deliver in the governed path?',
      'Tell me what deliver in the governed path does.',
      'How should I use deliver in the governed path?',
      'How do I deliver this requirement through the governed path?',
      'What steps should we follow to deliver this requirement through the governed path?',
      'Could you show me how to deliver this requirement through the governed path?',
    ];

    for (const prompt of explanationPrompts) {
      const plan = registry.resolvePlan(prompt, {
        preferredSurface: AdapterSurface.CODEX,
        configuredRoleMentionPresent: false,
      });
      expect(plan).toBeNull();
    }
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
        handoffExecutionMode: 'direct_execute',
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
        handoffExecutionMode: 'direct_execute',
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
        handoffExecutionMode: 'direct_execute',
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
        handoffExecutionMode: 'direct_execute',
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
            bridgeArgv: [
              'doctor',
              '--adapters',
              '--output',
              'pretty',
              '--single-tool-all-roles',
              'codex',
            ],
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
        handoffExecutionMode: 'direct_execute',
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
