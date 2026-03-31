import { AdapterSurface } from '@repo-ai-governor/shared';
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
});
