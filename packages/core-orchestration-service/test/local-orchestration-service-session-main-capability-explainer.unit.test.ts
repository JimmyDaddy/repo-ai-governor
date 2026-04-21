import {
  LocalOrchestrationServiceSessionMainCapabilityExplainer,
  SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS,
  SESSION_MAIN_CAPABILITY_ID,
} from '../src/index.js';

describe('LocalOrchestrationServiceSessionMainCapabilityExplainer', () => {
  it('renders an overview answer for generic capability discovery questions', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('what can you do here?', {
      locale: 'en-US',
    });

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'overview',
        routerDecisionReason: 'session.main.router.capability_answer.overview',
        referencedCapabilityIds: expect.arrayContaining([
          SESSION_MAIN_CAPABILITY_ID.CONNECT,
          SESSION_MAIN_CAPABILITY_ID.BRANCH_SWITCH,
          SESSION_MAIN_CAPABILITY_ID.REVIEW,
          SESSION_MAIN_CAPABILITY_ID.RUN,
        ]),
      }),
    );
    expect(answer?.assistantMessage).toContain('/connect');
    expect(answer?.assistantMessage).toContain('/workspace switch-branch');
    expect(answer?.assistantMessage).toContain('/review');
  });

  it('renders a detail answer when a specific governed capability is explained', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('说说 review 是做什么的', {
      locale: 'zh-CN',
    });

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

  it('recognizes Chinese capability-detail wording such as “是什么” for connect', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('connect 是什么？', {
      locale: 'zh-CN',
    });

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        routerDecisionReason: 'session.main.router.capability_answer.detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.CONNECT],
      }),
    );
    expect(answer?.assistantMessage).toContain('/connect');
  });

  it('recognizes Chinese capability-usage wording such as “怎么用” for doctor', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('doctor 怎么用？', {
      locale: 'zh-CN',
    });

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'examples',
        routerDecisionReason: 'session.main.router.capability_answer.examples',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DOCTOR],
      }),
    );
    expect(answer?.assistantMessage).toContain('/doctor');
  });

  it('keeps help chat-first without advertising a deliver-style optional alias', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('tell me about help', {
      locale: 'en-US',
    });

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.HELP],
      }),
    );
    expect(answer?.assistantMessage).toContain('Primary entry: direct chat request');
    expect(answer?.assistantMessage).not.toContain('Optional discoverability alias: `/help`');
    expect(answer?.assistantMessage).not.toContain('Suggested slash command: `/help`');
  });

  it('renders a comparison answer when two governed capabilities are compared', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('compare review and review verify', {
      locale: 'en-US',
    });

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

    const answer = await explainer.resolveAnswer('tell me about review', {
      locale: 'zh-CN',
    });

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.REVIEW],
      }),
    );
    expect(answer?.assistantMessage).toContain('建议的 slash command：');
    expect(answer?.assistantMessage).toContain('执行路径：');
  });

  it('renders workflow detail answers only for explicit workflow capability asks', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('tell me about workflow', {
      locale: 'en-US',
    });

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.WORKFLOW],
      }),
    );
    expect(answer?.assistantMessage).toContain('/workflow');
  });

  it('renders availability selection labels as user-facing prose instead of raw routing markers', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('tell me about review', {
      locale: 'en-US',
      availabilityOverlay: [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
          status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE,
          selectedSurface: 'claude-code',
          selectedBy: 'session.main.availability.fallback',
        },
      ],
    });

    expect(answer?.assistantMessage).toContain(
      'Suggested surface: `claude-code` (fallback after availability probe)',
    );
    expect(answer?.assistantMessage).not.toContain('session.main.availability.fallback');
  });

  it('describes deliver as a chat-first capability while keeping the alias non-canonical', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('tell me about deliver', {
      locale: 'en-US',
    });

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
        suggestedActions: expect.arrayContaining([
          expect.objectContaining({
            label: 'Deliver',
            target: 'Help me deliver this requirement through the governed path.',
          }),
        ]),
      }),
    );
    expect(answer?.assistantMessage).toContain('Primary entry: direct chat request');
    expect(answer?.assistantMessage).toContain('Optional discoverability alias: `/deliver`');
    expect(answer?.assistantMessage).not.toContain('Suggested slash command: `/deliver`');
  });

  it('describes deliver for Chinese capability-detail prompts without over-capturing generic delivery nouns', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const capabilityAnswer = await explainer.resolveAnswer('说说交付是做什么的', {
      locale: 'zh-CN',
    });
    const genericDrillAnswer = await explainer.resolveAnswer('说说交付演练', {
      locale: 'zh-CN',
    });
    const genericTeamAnswer = await explainer.resolveAnswer('解释一下交付到团队', {
      locale: 'zh-CN',
    });

    expect(capabilityAnswer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
      }),
    );
    expect(capabilityAnswer?.assistantMessage).toContain('可选 discoverability alias： `/deliver`');
    expect(genericDrillAnswer).toBeNull();
    expect(genericTeamAnswer).toBeNull();
  });

  it('does not hijack generic English delivery prose into the deliver capability explainer', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer(
      'Tell me about how we deliver the release notes.',
      {
        locale: 'en-US',
      },
    );
    const deliveryWorkflowDetailAnswer = await explainer.resolveAnswer(
      'Tell me about the delivery workflow for the release notes.',
      {
        locale: 'en-US',
      },
    );
    const deliveryWorkflowExamplesAnswer = await explainer.resolveAnswer(
      'Show me examples for the delivery workflow for release notes.',
      {
        locale: 'en-US',
      },
    );

    expect(answer).toBeNull();
    expect(deliveryWorkflowDetailAnswer).toBeNull();
    expect(deliveryWorkflowExamplesAnswer).toBeNull();
  });

  it('keeps requirement-to-cr review verify explainer requests on the child capability', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer(
      'tell me about review verify in the requirement-to-cr flow',
      {
        locale: 'en-US',
      },
    );

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY],
      }),
    );
    expect(answer?.assistantMessage).toContain('/review verify');
    expect(answer?.assistantMessage).not.toContain('Optional discoverability alias: `/deliver`');
  });

  it('keeps requirement-to-cr example prompts on plan instead of the deliver parent capability', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer(
      'show me examples for plan in the requirement-to-cr flow',
      {
        locale: 'en-US',
      },
    );

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'examples',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.PLAN],
      }),
    );
    expect(answer?.assistantMessage).toContain('/plan');
    expect(answer?.assistantMessage).not.toContain('Optional discoverability alias: `/deliver`');
  });

  it('still maps requirement-to-cr domain questions to deliver when no child capability is requested', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer(
      'explain the requirement-to-cr delivery orchestration flow',
      {
        locale: 'en-US',
      },
    );

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
      }),
    );
    expect(answer?.assistantMessage).toContain('Optional discoverability alias: `/deliver`');
  });

  it('keeps governed-path deliver explanation prompts on the deliver capability explainer', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();
    const detailPrompts = [
      'Tell me about deliver in the governed path.',
      'Tell me about the deliver governed path capability.',
      'What does deliver in the governed path do?',
      'What can deliver in the governed path do?',
      'When should I use deliver in the governed path?',
      'Why should I use deliver in the governed path?',
      'Tell me what deliver in the governed path does.',
      'How should I use deliver in the governed path?',
    ];
    const detailAnswers = await Promise.all(
      detailPrompts.map((prompt) =>
        explainer.resolveAnswer(prompt, {
          locale: 'en-US',
        }),
      ),
    );
    const examplePrompts = [
      'Show me examples for the deliver governed path capability.',
      'How do I deliver this requirement through the governed path?',
      'What steps should we follow to deliver this requirement through the governed path?',
      'Could you show me how to deliver this requirement through the governed path?',
    ];
    const exampleAnswers = await Promise.all(
      examplePrompts.map((prompt) =>
        explainer.resolveAnswer(prompt, {
          locale: 'en-US',
        }),
      ),
    );

    for (const answer of detailAnswers) {
      expect(answer).toEqual(
        expect.objectContaining({
          answerKind: 'detail',
          referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
        }),
      );
      expect(answer?.assistantMessage).toContain('Optional discoverability alias: `/deliver`');
    }
    for (const answer of exampleAnswers) {
      expect(answer).toEqual(
        expect.objectContaining({
          answerKind: 'examples',
          referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
        }),
      );
      expect(answer?.assistantMessage).toContain('Optional discoverability alias: `/deliver`');
    }
  });

  it('keeps deliver suggested actions chat-first even when the availability overlay says setup is required', async () => {
    const explainer = new LocalOrchestrationServiceSessionMainCapabilityExplainer();

    const answer = await explainer.resolveAnswer('tell me about deliver', {
      locale: 'en-US',
      availabilityOverlay: [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.DELIVER,
          status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.SETUP_REQUIRED,
          selectedSurface: 'codex',
          selectedBy: 'session.main.availability.fallback',
          suggestedNextStep: '/connect',
          reason: 'Deliver should stay chat-first even when downstream surfaces are not ready.',
        },
      ],
    });

    expect(answer).toEqual(
      expect.objectContaining({
        answerKind: 'detail',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
        suggestedActions: expect.arrayContaining([
          expect.objectContaining({
            label: 'Deliver',
            target: 'Help me deliver this requirement through the governed path.',
          }),
        ]),
      }),
    );
    expect(answer?.assistantMessage).not.toContain('Current availability:');
    expect(answer?.assistantMessage).not.toContain('/connect');
    expect(answer?.assistantMessage).not.toContain('(needs /connect first)');
  });
});
