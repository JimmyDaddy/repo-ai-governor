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

  it('keeps Chinese capability-detail prompts on chat answer instead of command handoff', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-capability-zh-001',
      routeId: 'session.main',
      turnId: 'turn-capability-zh-001',
      turnIndex: 5,
      userMessage: 'connect 是什么？',
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
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.CONNECT],
      }),
    );
    expect(result.assistantMessage).toContain('/connect');
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

  it('starts the governed deliver workflow from the official conversational deliver prompt', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-deliver-001',
      routeId: 'session.main',
      turnId: 'turn-deliver-001',
      turnIndex: 6,
      userMessage: 'Help me deliver this requirement through the governed path.',
      locale: 'en-US',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        interactionMode: 'direct_answer',
        executionIntent: 'deliver.requirement_to_cr',
        skillId: 'skill.deliver.workflow',
        handoffExecutionMode: 'direct_execute',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
        deliveryWorkflowState: expect.objectContaining({
          workflowId: 'delivery-workflow-session-deliver-001-turn-deliver-001',
          capabilityId: 'deliver',
          currentPhase: 'requirement_capture',
          pendingAction: 'capture_requirement_or_attach_approved_brief',
          requirementReviewGate: expect.objectContaining({
            outcome: 'pending',
          }),
        }),
      }),
    );
    expect(result.assistantMessage).toContain('Started the governed deliver workflow');
  });

  it('bridges explain-plus-execute deliver turns into the same session-owned deliver workflow', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
      resolveCapabilityAvailability: async () => [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.DELIVER,
          status: 'available',
        },
      ],
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-deliver-bridge-001',
      routeId: 'session.main',
      turnId: 'turn-deliver-bridge-001',
      turnIndex: 7,
      userMessage:
        'Tell me about deliver, and then help me deliver this requirement through the governed path.',
      locale: 'en-US',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        interactionMode: 'direct_answer',
        executionIntent: 'deliver.requirement_to_cr',
        skillId: 'skill.deliver.workflow',
        handoffExecutionMode: 'direct_execute',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
        deliveryWorkflowState: expect.objectContaining({
          capabilityId: 'deliver',
          currentPhase: 'requirement_capture',
        }),
      }),
    );
    expect(result.assistantMessage).toContain('Primary entry: direct chat request');
    expect(result.assistantMessage).toContain('Started the governed deliver workflow');
  });

  it('keeps explain-plus-execute deliver on the chat-first workflow even when availability is not ready', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
      resolveCapabilityAvailability: async () => [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.DELIVER,
          status: 'setup_required',
          requiresSetup: true,
          suggestedNextStep: '/connect',
          reason: 'Local deliver surface checks are not ready yet.',
        },
      ],
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-deliver-bridge-guard-001',
      routeId: 'session.main',
      turnId: 'turn-deliver-bridge-guard-001',
      turnIndex: 8,
      userMessage:
        'Tell me about deliver, and then help me deliver this requirement through the governed path.',
      locale: 'en-US',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        interactionMode: 'direct_answer',
        executionIntent: 'deliver.requirement_to_cr',
        referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
        deliveryWorkflowState: expect.objectContaining({
          capabilityId: 'deliver',
          currentPhase: 'requirement_capture',
        }),
      }),
    );
    expect(result.assistantMessage).toContain('Started the governed deliver workflow');
    expect(result.assistantMessage).not.toContain('/connect');
  });

  it('keeps resumed deliver guidance aligned with the existing shared-session phase state', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-deliver-resume-001',
      routeId: 'session.main',
      turnId: 'turn-deliver-resume-001',
      turnIndex: 8,
      userMessage: 'Help me deliver this requirement through the governed path.',
      locale: 'en-US',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      deliveryWorkflowState: {
        version: 1,
        workflowId: 'delivery-workflow-existing',
        capabilityId: 'deliver',
        currentPhase: 'solution_review_pending',
        requirementReviewGate: {
          outcome: 'explicit_approval',
          evidenceArtifactPath: '.repo-ai-governor/context/evidence/approval.md',
        },
        approvedDeliveryBriefPath: '.repo-ai-governor/context/durable/approved-brief.md',
        pendingAction: 'review_solution_artifact',
        selectedTargetStream: 'stream-project-110-sprint-001',
        relatedArtifactPaths: ['.repo-ai-governor/context/durable/approved-brief.md'],
        childWorkflowBacklinks: [],
        blockedReason: null,
        resultSummary: null,
      },
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        executionIntent: 'deliver.requirement_to_cr',
        deliveryWorkflowState: expect.objectContaining({
          workflowId: 'delivery-workflow-existing',
          currentPhase: 'solution_review_pending',
          pendingAction: 'review_solution_artifact',
        }),
      }),
    );
    expect(result.assistantMessage).toContain('Resumed the governed deliver workflow');
    expect(result.assistantMessage).toContain('solution_review_pending');
    expect(result.assistantMessage).toContain('review_solution_artifact');
    expect(result.assistantMessage).not.toContain('Share the requirement');
  });

  it('keeps explicit en-US deliver replies in English after a default-locale deliver turn warms the cache', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const defaultLocaleResult = await dispatcher.dispatch({
      sessionId: 'session-deliver-locale-001',
      routeId: 'session.main',
      turnId: 'turn-deliver-locale-001',
      turnIndex: 9,
      userMessage: 'Help me deliver this requirement through the governed path.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });
    const englishResult = await dispatcher.dispatch({
      sessionId: 'session-deliver-locale-002',
      routeId: 'session.main',
      turnId: 'turn-deliver-locale-002',
      turnIndex: 10,
      userMessage: 'Help me deliver this requirement through the governed path.',
      locale: 'en-US',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(defaultLocaleResult.assistantMessage).toContain('已启动受治理的 deliver workflow');
    expect(englishResult.assistantMessage).toContain('Started the governed deliver workflow');
    expect(englishResult.assistantMessage).not.toContain('已启动受治理的 deliver workflow');
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

  it('lets generic deliver-the-artifact asks fall through instead of starting the governed requirement-to-cr workflow', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: 'Let us clarify the delivery target first.',
      assistantMessage: 'Let us clarify the delivery target first.',
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
      sessionId: 'session-generic-deliver-001',
      routeId: 'session.main',
      turnId: 'turn-generic-deliver-001',
      turnIndex: 8,
      userMessage: 'Help me deliver the repository cleanup.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        interactionMode: 'direct_answer',
        assistantMessage: 'Let us clarify the delivery target first.',
      }),
    );
    expect(result).not.toHaveProperty('deliveryWorkflowState');
  });

  it('lets generic requirement-document delivery asks fall through instead of starting the governed requirement-to-cr workflow', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: 'Let us clarify the delivery target first.',
      assistantMessage: 'Let us clarify the delivery target first.',
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

    const requirementBriefResult = await dispatcher.dispatch({
      sessionId: 'session-generic-deliver-002',
      routeId: 'session.main',
      turnId: 'turn-generic-deliver-002',
      turnIndex: 9,
      userMessage: 'Help me deliver the requirement brief to the team.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });
    const requirementSummaryResult = await dispatcher.dispatch({
      sessionId: 'session-generic-deliver-003',
      routeId: 'session.main',
      turnId: 'turn-generic-deliver-003',
      turnIndex: 10,
      userMessage: 'Can you deliver this requirement summary by email?',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).toHaveBeenCalledTimes(2);
    expect(requirementBriefResult.assistantMessage).toBe(
      'Let us clarify the delivery target first.',
    );
    expect(requirementSummaryResult.assistantMessage).toBe(
      'Let us clarify the delivery target first.',
    );
    expect(requirementBriefResult).not.toHaveProperty('deliveryWorkflowState');
    expect(requirementSummaryResult).not.toHaveProperty('deliveryWorkflowState');
  });

  it('lets generic start-style delivery asks fall through instead of starting the governed requirement-to-cr workflow', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: 'Let us clarify the delivery target first.',
      assistantMessage: 'Let us clarify the delivery target first.',
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

    const releaseNotesResult = await dispatcher.dispatch({
      sessionId: 'session-generic-deliver-start-001',
      routeId: 'session.main',
      turnId: 'turn-generic-deliver-start-001',
      turnIndex: 11,
      userMessage: '开始交付 release notes。',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });
    const drillResult = await dispatcher.dispatch({
      sessionId: 'session-generic-deliver-start-002',
      routeId: 'session.main',
      turnId: 'turn-generic-deliver-start-002',
      turnIndex: 12,
      userMessage: '发起交付演练。',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });
    const docsUpdateResult = await dispatcher.dispatch({
      sessionId: 'session-generic-deliver-start-003',
      routeId: 'session.main',
      turnId: 'turn-generic-deliver-start-003',
      turnIndex: 13,
      userMessage: 'Start the requirement-to-cr docs update.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).toHaveBeenCalledTimes(3);
    expect(releaseNotesResult.assistantMessage).toBe('Let us clarify the delivery target first.');
    expect(drillResult.assistantMessage).toBe('Let us clarify the delivery target first.');
    expect(docsUpdateResult.assistantMessage).toBe('Let us clarify the delivery target first.');
    expect(releaseNotesResult).not.toHaveProperty('deliveryWorkflowState');
    expect(drillResult).not.toHaveProperty('deliveryWorkflowState');
    expect(docsUpdateResult).not.toHaveProperty('deliveryWorkflowState');
  });

  it('keeps preview-style delivery workflow asks on /workflow instead of mutating deliver session state', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });

    const result = await dispatcher.dispatch({
      sessionId: 'session-delivery-workflow-preview-001',
      routeId: 'session.main',
      turnId: 'turn-delivery-workflow-preview-001',
      turnIndex: 14,
      userMessage: 'Start the delivery workflow preview.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'command_handoff_preview',
        suggestedSlashCommand: '/workflow',
        executionIntent: 'workflow.preview',
        handoffExecutionMode: 'direct_execute',
      }),
    );
    expect(result).not.toHaveProperty('deliveryWorkflowState');
  });

  it('lets generic English delivery discussion fall through instead of returning the deliver capability explainer', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: 'Let us clarify the delivery topic first.',
      assistantMessage: 'Let us clarify the delivery topic first.',
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
      sessionId: 'session-generic-delivery-prose-001',
      routeId: 'session.main',
      turnId: 'turn-generic-delivery-prose-001',
      turnIndex: 15,
      userMessage: 'Tell me about how we deliver the release notes.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        assistantMessage: 'Let us clarify the delivery topic first.',
      }),
    );
    expect(result).not.toHaveProperty('referencedCapabilityIds');
  });

  it('lets generic delivery workflow asks fall through to the supervisor instead of starting deliver session state', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: 'Let us clarify the delivery workflow goal first.',
      assistantMessage: 'Let us clarify the delivery workflow goal first.',
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

    const startResult = await dispatcher.dispatch({
      sessionId: 'session-generic-delivery-workflow-001',
      routeId: 'session.main',
      turnId: 'turn-generic-delivery-workflow-001',
      turnIndex: 16,
      userMessage: 'Start the delivery workflow for the release notes.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });
    const runResult = await dispatcher.dispatch({
      sessionId: 'session-generic-delivery-workflow-002',
      routeId: 'session.main',
      turnId: 'turn-generic-delivery-workflow-002',
      turnIndex: 17,
      userMessage: 'Run the delivery workflow for our docs handoff.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).toHaveBeenCalledTimes(2);
    expect(startResult).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        assistantMessage: 'Let us clarify the delivery workflow goal first.',
      }),
    );
    expect(runResult).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        assistantMessage: 'Let us clarify the delivery workflow goal first.',
      }),
    );
    expect(startResult).not.toHaveProperty('deliveryWorkflowState');
    expect(runResult).not.toHaveProperty('deliveryWorkflowState');
  });

  it('keeps explain-style governed-path deliver prompts on the capability explainer instead of starting deliver session state', async () => {
    const resolveTurn = vi.fn();
    const dispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher({
      resolveTurn,
      resolveMentionedRoleId: () => null,
    });
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
    const detailResults = await Promise.all(
      detailPrompts.map((userMessage, index) =>
        dispatcher.dispatch({
          sessionId: `session-governed-path-deliver-detail-${String(index + 1).padStart(3, '0')}`,
          routeId: 'session.main',
          turnId: `turn-governed-path-deliver-detail-${String(index + 1).padStart(3, '0')}`,
          turnIndex: 18 + index,
          userMessage,
          locale: 'en-US',
          selectedSurface: AdapterSurface.CODEX,
          selectedBy: 'session.main.default',
          sessionRoutingPreferenceApplied: false,
        }),
      ),
    );
    const examplePrompts = [
      'Show me examples for the deliver governed path capability.',
      'How do I deliver this requirement through the governed path?',
      'What steps should we follow to deliver this requirement through the governed path?',
      'Could you show me how to deliver this requirement through the governed path?',
    ];
    const exampleResults = await Promise.all(
      examplePrompts.map((userMessage, index) =>
        dispatcher.dispatch({
          sessionId: `session-governed-path-deliver-example-${String(index + 1).padStart(3, '0')}`,
          routeId: 'session.main',
          turnId: `turn-governed-path-deliver-example-${String(index + 1).padStart(3, '0')}`,
          turnIndex: 26 + index,
          userMessage,
          locale: 'en-US',
          selectedSurface: AdapterSurface.CODEX,
          selectedBy: 'session.main.default',
          sessionRoutingPreferenceApplied: false,
        }),
      ),
    );

    expect(resolveTurn).not.toHaveBeenCalled();
    for (const result of detailResults) {
      expect(result).toEqual(
        expect.objectContaining({
          responseMode: 'answer',
          executionIntent: 'session.capability_explainer',
          capabilityAnswerKind: 'detail',
          referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
        }),
      );
      expect(result).not.toHaveProperty('deliveryWorkflowState');
    }
    for (const result of exampleResults) {
      expect(result).toEqual(
        expect.objectContaining({
          responseMode: 'answer',
          executionIntent: 'session.capability_explainer',
          capabilityAnswerKind: 'examples',
          referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
        }),
      );
      expect(result).not.toHaveProperty('deliveryWorkflowState');
    }
  });

  it('lets generic delivery-workflow detail and example asks fall through instead of returning the deliver capability explainer', async () => {
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer' as const,
      interactionMode: 'direct_answer' as const,
      assistantDelta: 'Let us clarify the workflow topic first.',
      assistantMessage: 'Let us clarify the workflow topic first.',
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

    const detailResult = await dispatcher.dispatch({
      sessionId: 'session-generic-delivery-workflow-prose-001',
      routeId: 'session.main',
      turnId: 'turn-generic-delivery-workflow-prose-001',
      turnIndex: 18,
      userMessage: 'Tell me about the delivery workflow for the release notes.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });
    const examplesResult = await dispatcher.dispatch({
      sessionId: 'session-generic-delivery-workflow-prose-002',
      routeId: 'session.main',
      turnId: 'turn-generic-delivery-workflow-prose-002',
      turnIndex: 19,
      userMessage: 'Show me examples for the delivery workflow for release notes.',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(resolveTurn).toHaveBeenCalledTimes(2);
    expect(detailResult).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        assistantMessage: 'Let us clarify the workflow topic first.',
      }),
    );
    expect(examplesResult).toEqual(
      expect.objectContaining({
        responseMode: 'answer',
        assistantMessage: 'Let us clarify the workflow topic first.',
      }),
    );
    expect(detailResult).not.toHaveProperty('referencedCapabilityIds');
    expect(examplesResult).not.toHaveProperty('referencedCapabilityIds');
  });

  it('projects branch-switch requests into direct-execute command batches', async () => {
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
        requiresConfirmation: false,
        skillId: 'skill.workspace.switch_branch',
        handoffExecutionMode: 'direct_execute',
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

  it('projects Git-valid branch targets such as bugfix@bar into direct-execute command batches', async () => {
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
        requiresConfirmation: false,
        skillId: 'skill.workspace.switch_branch',
        handoffExecutionMode: 'direct_execute',
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

  it('projects bundle onboarding intents into direct-execute command batches', async () => {
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
    expect(result.requiresConfirmation).toBe(false);
    expect(result.skillId).toBe('skill.onboard.adapters');
    expect(result.handoffExecutionMode).toBe('direct_execute');
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
