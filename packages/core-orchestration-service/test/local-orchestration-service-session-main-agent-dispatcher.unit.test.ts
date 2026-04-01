import { AdapterSurface } from '@repo-ai-governor/shared';
import { SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY } from '../src/constants/index.js';
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

  it('projects low-risk natural-language verify intents into direct-execute command batches', async () => {
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
    expect(result.skillId).toBe('skill.verify.adapters');
    expect(result.handoffExecutionMode).toBe('direct_execute');
    expect(result.commandBatches).toEqual([
      {
        slashQuery: '/verify',
        bridgeArgv: ['verify', '--adapters', '--output', 'pretty'],
        previewCommandLine: 'repo-ai-governor verify --adapters --output pretty',
      },
    ]);
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

  it('routes natural-language planning requests into direct-execute plan command batches', async () => {
    const resolveTurn = vi.fn();
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

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result.responseMode).toBe('command_handoff_preview');
    expect(result.requiresConfirmation).toBe(false);
    expect(result.skillId).toBe('skill.plan.task');
    expect(result.handoffExecutionMode).toBe('direct_execute');
    expect(result.commandBatches).toEqual([
      {
        slashQuery: '/plan',
        bridgeArgv: ['plan', '--output', 'pretty'],
        previewCommandLine: 'repo-ai-governor plan --output pretty',
      },
    ]);
  });

  it('routes natural-language code-review requests into the supervisor with an implicit reviewer delegate', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'role_collaboration' as const,
      interactionMode: 'single_role_delegate' as const,
      assistantDelta: '## Reviewer perspective',
      assistantMessage: '## Reviewer perspective\n\n- one actionable finding',
      executionIntent: 'session.role_delegate.reviewer',
      requiresConfirmation: false,
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.router.single_role_delegate.implicit_role',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: ['reviewer'],
      subagentCount: 1,
    }));
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

    expect(resolveTurn).toHaveBeenCalledTimes(1);
    expect(resolveTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: '很好,帮我 review 一下代码',
        metadata: {
          [SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY]: 'reviewer',
        },
      }),
    );
    expect(result.responseMode).toBe('role_collaboration');
    expect(result.executionIntent).toBe('session.role_delegate.reviewer');
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
        slashQuery: '/verify',
        bridgeArgv: ['verify', '--adapters', '--output', 'pretty'],
        previewCommandLine: 'repo-ai-governor verify --adapters --output pretty',
      },
    ]);
  });
});
