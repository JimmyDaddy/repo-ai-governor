import {
  LocalOrchestrationServiceSessionMainCapabilityExplainer,
  SESSION_MAIN_CAPABILITY_ID,
} from '../src/index.js';

describe('LocalOrchestrationServiceSessionMainCapabilityExplainer', () => {
  it('renders an overview answer for generic capability discovery questions', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('what can you do here?', 'en-US');

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'overview',
        routerDecisionReason: 'session.main.router.capability_answer.overview',
        referencedCapabilityIds: expect.arrayContaining([
          SESSION_MAIN_CAPABILITY_ID.CONNECT,
          SESSION_MAIN_CAPABILITY_ID.REVIEW,
          SESSION_MAIN_CAPABILITY_ID.RUN,
        ]),
      }),
    );
    expect(answer?.assistantMessage).toContain('/connect');
    expect(answer?.assistantMessage).toContain('/review');
  });

  it('renders a detail answer when a specific governed capability is explained', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('说说 review 是做什么的', 'zh-CN');

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        routerDecisionReason: 'session.main.router.capability_answer.detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.REVIEW],
        suggestedActions: expect.arrayContaining([
          expect.objectContaining({
            suggestedSlashCommand: '/review',
          }),
        ]),
      }),
    );
    expect(answer?.assistantMessage).toContain('/review');
  });

  it('renders a comparison answer when two governed capabilities are compared', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('compare review and review verify', 'en-US');

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'comparison',
        routerDecisionReason: 'session.main.router.capability_answer.comparison',
        referencedCapabilityIds: [
          SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
          SESSION_MAIN_CAPABILITY_ID.REVIEW,
        ],
      }),
    );
    expect(answer?.assistantMessage).toContain('/review');
    expect(answer?.assistantMessage).toContain('/review verify');
  });

  it('renders the explainer answer in the active locale instead of guessing from the prompt script', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('tell me about review', 'zh-CN');

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.REVIEW],
      }),
    );
    expect(answer?.assistantMessage).toContain('建议的 slash command：');
    expect(answer?.assistantMessage).toContain('执行路径：');
  });
});
