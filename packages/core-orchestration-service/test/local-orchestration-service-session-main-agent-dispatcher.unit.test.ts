import { AdapterSurface } from '@repo-ai-governor/shared';
import {
  SESSION_MAIN_CAPABILITY_ID,
  SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY,
} from '../src/constants/index.js';
import { LocalOrchestrationServiceSessionMainAgentDispatcher } from '../src/local-orchestration-service-session-main-agent-dispatcher.js';

describe('LocalOrchestrationServiceSessionMainAgentDispatcher', () => {
  it('routes short conversational greetings into the supervisor instead of short-input follow-up', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: '你好',
      assistantMessage: '你好，我可以继续帮你处理仓库里的事情。',
      requiresConfirmation: false,
      selectedSurface: AdapterSurface.OLLAMA,
      selectedBy: 'session.main.answer.safe_fallback',
      sessionRoutingPreferenceApplied: true,
      invokedRoleIds: [],
      subagentCount: 0,
    }));
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-greeting-001',
      routeId: 'session.main',
      turnId: 'turn-greeting-001',
      turnIndex: 1,
      userMessage: '你好',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.preference.default',
      sessionRoutingPreferenceApplied: true,
      metadata: {
        sessionRoutingPreference: 'codex',
      },
    });

    expect(resolveTurn).toHaveBeenCalledTimes(1);
    expect(resolveTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: '你好',
        selectedSurface: AdapterSurface.CODEX,
        selectedBy: 'session.main.preference.default',
        sessionRoutingPreferenceApplied: true,
      }),
    );
    expect(result.responseMode).toBe('answer');
    expect(result.assistantMessage).toContain('你好');
  });

  it('keeps ambiguous short inputs on the follow-up path when they are not greetings', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: 'unused',
      assistantMessage: 'unused',
      requiresConfirmation: false,
      selectedSurface: AdapterSurface.OLLAMA,
      selectedBy: 'session.main.answer.safe_fallback',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: [],
      subagentCount: 0,
    }));
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-greeting-002',
      routeId: 'session.main',
      turnId: 'turn-greeting-002',
      turnIndex: 2,
      userMessage: 'next?',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result.responseMode).toBe('follow_up_question');
    expect(result.routerDecisionReason).toBe('session.main.router.follow_up.short_input');
  });

  it('routes short repo questions into the supervisor instead of the follow-up whitelist', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: 'weather',
      assistantMessage: '我可以先告诉你当前没有实时天气数据。',
      requiresConfirmation: false,
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.answer.primary',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: [],
      subagentCount: 0,
    }));
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-question-001',
      routeId: 'session.main',
      turnId: 'turn-question-001',
      turnIndex: 3,
      userMessage: '今天天气如何',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).toHaveBeenCalledTimes(1);
    expect(result.responseMode).toBe('answer');
    expect(result.assistantMessage).toContain('天气');
  });

  it('routes explicit capability explanation requests before governed skill intent routing', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-capability-001',
      routeId: 'session.main',
      turnId: 'turn-capability-001',
      turnIndex: 4,
      userMessage: '先说说 review 是做什么的',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        interactionMode: 'direct_answer',
        capabilityAnswerKind: 'detail',
        executionIntent: 'session.capability_explainer',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.REVIEW],
        suggestedActions: expect.arrayContaining([
          expect.objectContaining({
            suggestedSlashCommand: '/review',
          }),
        ]),
      }),
    );
    expect(result.assistantMessage).toContain('/review');
  });

  it('keeps capability explanation output aligned with the active locale instead of the prompt script', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-capability-locale-001',
      routeId: 'session.main',
      turnId: 'turn-capability-locale-001',
      turnIndex: 5,
      userMessage: 'tell me about review',
      locale: 'zh-CN',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        capabilityAnswerKind: 'detail',
        executionIntent: 'session.capability_explainer',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.REVIEW],
      }),
    );
    expect(result.assistantMessage).toContain('建议的 slash command：');
    expect(result.assistantMessage).toContain('执行路径：');
  });

  it('keeps capability comparison questions on the explainer route instead of review-verify handoff', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-capability-compare-001',
      routeId: 'session.main',
      turnId: 'turn-capability-compare-001',
      turnIndex: 5,
      userMessage: 'compare review and review verify',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        capabilityAnswerKind: 'comparison',
        executionIntent: 'session.capability_explainer',
        referencedCapabilityIds: [
          SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
          SESSION_MAIN_CAPABILITY_ID.REVIEW,
        ],
      }),
    );
    expect(result.assistantMessage).toContain('/review verify');
  });

  it('migrates low-risk natural-language verify intents into direct-execute doctor command batches', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-001',
      routeId: 'session.main',
      turnId: 'turn-skill-001',
      turnIndex: 4,
      userMessage: '帮我验证一下 adapter 状态',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result.responseMode).toBe('command_handoff_preview');
    expect(result.requiresConfirmation).toBe(false);
    expect(result.skillId).toBe('skill.doctor.environment');
    expect(result.handoffExecutionMode).toBe('direct_execute');
    expect(result.commandBatches).toEqual([
      {
        slashQuery: '/doctor',
        bridgeArgv: ['doctor', '--adapters', '--output', 'pretty'],
        previewCommandLine: 'repo-ai-governor doctor --adapters --output pretty',
      },
    ]);
  });

  it('keeps the official review-verify examples on the governed review-verify workflow instead of migrating them to doctor', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-review-verify-001',
      routeId: 'session.main',
      turnId: 'turn-skill-review-verify-001',
      turnIndex: 5,
      userMessage: 'Verify that the review findings are fixed.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'command_handoff_preview',
        requiresConfirmation: false,
        skillId: 'skill.review.verify',
        handoffExecutionMode: 'direct_execute',
        executionIntent: 'review.verify',
        suggestedSlashCommand: '/review verify',
      }),
    );
    expect(result.commandBatches).toEqual([
      {
        slashQuery: '/review verify',
        bridgeArgv: ['review-verify'],
        previewCommandLine: 'repo-ai-governor review-verify',
      },
    ]);
  });

  it('preserves explicit @reviewer verify-style turns for raw-role collaboration', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: '@reviewer verify raw-role path',
      assistantMessage: '@reviewer verify raw-role path',
      requiresConfirmation: false,
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: ['reviewer'],
      subagentCount: 1,
    }));
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: (message) => (message.includes('@reviewer') ? 'reviewer' : null),
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-reviewer-verify-001',
      routeId: 'session.main',
      turnId: 'turn-skill-reviewer-verify-001',
      turnIndex: 6,
      userMessage: '@reviewer verify that the review findings are fixed.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        assistantMessage: '@reviewer verify raw-role path',
        invokedRoleIds: ['reviewer'],
      }),
    );
  });

  it('lets generic implementation asks fall through to the supervisor instead of defaulting to /run', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: 'Let us clarify scope first.',
      assistantMessage: 'Let us clarify scope first.',
      requiresConfirmation: false,
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: [],
      subagentCount: 0,
    }));
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-generic-implementation-001',
      routeId: 'session.main',
      turnId: 'turn-generic-implementation-001',
      turnIndex: 7,
      userMessage: 'please implement the new settings page',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        interactionMode: 'direct_answer',
        assistantMessage: 'Let us clarify scope first.',
      }),
    );
  });

  it('projects branch-switch requests into preview-confirm command batches', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-branch-switch-001',
      routeId: 'session.main',
      turnId: 'turn-skill-branch-switch-001',
      turnIndex: 5,
      userMessage: '帮我把当前代码分支切换到 main',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'command_handoff_preview',
        suggestedSlashCommand: '/workspace switch-branch',
        executionIntent: 'workspace.branch_switch',
        requiresConfirmation: true,
        skillId: 'skill.workspace.switch_branch',
        handoffExecutionMode: 'preview_confirm',
      }),
    );
    expect(result.commandBatches).toEqual([
      {
        slashQuery: '/workspace switch-branch main',
        bridgeArgv: ['workspace', 'switch-branch', 'main'],
        previewCommandLine: 'repo-ai-governor workspace switch-branch main',
      },
    ]);
  });

  it('projects Git-valid branch targets such as bugfix@bar into preview-confirm command batches', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-branch-switch-002',
      routeId: 'session.main',
      turnId: 'turn-skill-branch-switch-002',
      turnIndex: 6,
      userMessage: 'checkout bugfix@bar',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'command_handoff_preview',
        suggestedSlashCommand: '/workspace switch-branch',
        executionIntent: 'workspace.branch_switch',
        requiresConfirmation: true,
        skillId: 'skill.workspace.switch_branch',
        handoffExecutionMode: 'preview_confirm',
      }),
    );
    expect(result.commandBatches).toEqual([
      {
        slashQuery: '/workspace switch-branch bugfix@bar',
        bridgeArgv: ['workspace', 'switch-branch', 'bugfix@bar'],
        previewCommandLine: 'repo-ai-governor workspace switch-branch bugfix@bar',
      },
    ]);
  });

  it('bridges same-turn explain-plus-execute verify requests into the migrated doctor handoff', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
      resolveCapabilityAvailability: async () => [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.DOCTOR,
          status: 'available',
        },
      ],
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-verify-bridge-001',
      routeId: 'session.main',
      turnId: 'turn-skill-verify-bridge-001',
      turnIndex: 5,
      userMessage: '给我一个 verify 的例子，然后顺便验证一下当前 adapter 状态',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'command_handoff_preview',
        handoffExecutionMode: 'direct_execute',
        skillId: 'skill.doctor.environment',
        requiresConfirmation: false,
        executionIntent: 'doctor.adapters',
      }),
    );
    expect(result.commandBatches).toEqual([
      {
        slashQuery: '/doctor',
        bridgeArgv: ['doctor', '--adapters', '--output', 'pretty'],
        previewCommandLine: 'repo-ai-governor doctor --adapters --output pretty',
      },
    ]);
  });

  it('keeps same-turn explain-plus-execute requests on the answer path when setup is still required', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
      resolveCapabilityAvailability: async () => [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
          status: 'setup_required',
          requiresSetup: true,
          suggestedNextStep: '/connect',
          reason: 'No governed reviewer surface passed the local readiness checks.',
        },
      ],
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-review-bridge-guard-001',
      routeId: 'session.main',
      turnId: 'turn-skill-review-bridge-guard-001',
      turnIndex: 5,
      userMessage: '先说说 review，再帮我 review 当前改动',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        capabilityAnswerKind: 'detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.REVIEW],
      }),
    );
    expect(result.assistantMessage).toContain('Current availability:');
    expect(result.assistantMessage).toContain('/connect');
    expect(result.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          suggestedSlashCommand: '/connect',
        }),
      ]),
    );
  });

  it('removes verify from the direct-answer fallback guidance copy', async () => {
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher();

    const result = await dispatcher.dispatch({
      sessionId: 'session-fallback-001',
      routeId: 'session.main',
      turnId: 'turn-fallback-001',
      turnIndex: 6,
      userMessage: 'please help with this repository',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        routerDecisionReason: 'session.main.router.direct_answer.fallback',
      }),
    );
    expect(result.assistantMessage).toContain('connect, doctor, plan, review, workflow, or run');
    expect(result.assistantMessage).not.toContain('connect, doctor, verify, review, or run');
  });

  it('keeps same-turn review bridge requests on the governed /review workflow instead of implicit reviewer delegation', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
      resolveCapabilityAvailability: async () => [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
          status: 'available',
          selectedSurface: AdapterSurface.CODEX,
          selectedBy: 'session.main.preference',
        },
      ],
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-review-bridge-001',
      routeId: 'session.main',
      turnId: 'turn-skill-review-bridge-001',
      turnIndex: 7,
      userMessage: '先说说 review，再帮我 review 当前改动',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'command_handoff_preview',
        suggestedSlashCommand: '/review',
        executionIntent: 'review.start',
        handoffExecutionMode: 'direct_execute',
        requiresConfirmation: false,
      }),
    );
  });

  it('routes current-project diagnosis requests into direct-execute doctor command batches', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-003',
      routeId: 'session.main',
      turnId: 'turn-skill-003',
      turnIndex: 6,
      userMessage: '帮我诊断当前项目',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result.responseMode).toBe('command_handoff_preview');
    expect(result.requiresConfirmation).toBe(false);
    expect(result.skillId).toBe('skill.doctor.environment');
    expect(result.handoffExecutionMode).toBe('direct_execute');
    expect(result.commandBatches).toEqual([
      {
        slashQuery: '/doctor',
        bridgeArgv: ['doctor', '--adapters', '--output', 'pretty'],
        previewCommandLine: 'repo-ai-governor doctor --adapters --output pretty',
      },
    ]);
  });

  it('routes natural-language planning requests into the supervisor with an implicit planner delegate', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'role_collaboration' as const,
      interactionMode: 'single_role_delegate' as const,
      assistantDelta: '## Planner perspective',
      assistantMessage: '## Planner perspective\n\n- structured plan ready',
      executionIntent: 'session.role_delegate.planner',
      requiresConfirmation: false,
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.router.single_role_delegate.implicit_role',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: ['planner'],
      subagentCount: 1,
    }));
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-plan-001',
      routeId: 'session.main',
      turnId: 'turn-skill-plan-001',
      turnIndex: 7,
      userMessage: '帮我拆一下任务计划',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: '帮我拆一下任务计划',
        metadata: expect.objectContaining({
          [SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY]: 'planner',
        }),
      }),
    );
    expect(result.responseMode).toBe('role_collaboration');
    expect(result.requiresConfirmation).toBe(false);
    expect(result.executionIntent).toBe('session.role_delegate.planner');
  });

  it('routes natural-language code-review requests into the governed /review workflow', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-review-001',
      routeId: 'session.main',
      turnId: 'turn-skill-review-001',
      turnIndex: 7,
      userMessage: '很好,帮我 review 一下代码',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'command_handoff_preview',
        suggestedSlashCommand: '/review',
        executionIntent: 'review.start',
        handoffExecutionMode: 'direct_execute',
        requiresConfirmation: false,
      }),
    );
  });

  it('projects bundle onboarding intents into preview-confirm command batches', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-skill-002',
      routeId: 'session.main',
      turnId: 'turn-skill-002',
      turnIndex: 5,
      userMessage: '把 adapter onboarding 全走一遍',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result.responseMode).toBe('command_handoff_preview');
    expect(result.requiresConfirmation).toBe(true);
    expect(result.skillId).toBe('skill.onboard.adapters');
    expect(result.handoffExecutionMode).toBe('preview_confirm');
    expect(result.commandBatches).toEqual([
      {
        slashQuery: '/connect',
        bridgeArgv: ['connect', '--preset', 'multi-tool-default', '--output', 'pretty'],
        previewCommandLine: 'repo-ai-governor connect --preset multi-tool-default --output pretty',
      },
      {
        slashQuery: '/doctor',
        bridgeArgv: ['doctor', '--adapters', '--output', 'pretty'],
        previewCommandLine: 'repo-ai-governor doctor --adapters --output pretty',
      },
    ]);
  });
});
