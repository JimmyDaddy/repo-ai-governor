import {
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCapabilitySupportLevel,
  type AgentProtocolContract,
} from '@repo-ai-governor/adapter-sdk';
import { type AdaptersConfig, WorkspaceMode } from '@repo-ai-governor/config';
import { AdapterAvailability, AdapterSurface, LocalModelProvider } from '@repo-ai-governor/shared';
import { CliAdapterRoutingRuntime } from '../../src/runtime/adapter-routing-runtime.js';
import { CliSessionMainSupervisorRuntime } from '../../src/runtime/session-main-supervisor-runtime.js';

function createAvailableProtocol(
  surface: AdapterSurface,
  responseText: string,
  options: {
    capabilitySupportOverrides?: Partial<Record<AgentCapability, AgentCapabilitySupportLevel>>;
    toolCallingSupportLevel?: AgentCapabilitySupportLevel;
    invokeStageSpy?: ReturnType<typeof vi.fn>;
  } = {},
): AgentProtocolContract {
  const toolCallingSupportLevel =
    options.toolCallingSupportLevel ?? AgentCapabilitySupportLevel.SUPPORTED;
  return {
    probe: async () => ({
      identity: {
        agentId: `${surface}-agent`,
        role: 'session-main',
        surface,
        roleProfileId: 'session-main',
        roleSource: 'test',
      },
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      capabilityMatrix: {
        capabilityStates: Object.values(AgentCapability).map((capability) => ({
          capability,
          supportLevel:
            options.capabilitySupportOverrides?.[capability] ??
            (capability === AgentCapability.TOOL_CALLING
              ? toolCallingSupportLevel
              : AgentCapabilitySupportLevel.SUPPORTED),
        })),
        timeout: {
          supportsAgentInvocationTimeout: true,
          supportsStageTimeoutSignal: true,
          supportsFlowTimeoutSignal: true,
        },
        cancellation: {
          supportsCancel: true,
          supportsReasonPropagation: true,
          supportsAbortSignal: true,
        },
        contextWindow: {
          maxInputTokens: 8000,
          maxOutputTokens: 4000,
          supportsAutoTruncation: true,
        },
      },
      unavailableReasons: [],
    }),
    invokeStage:
      options.invokeStageSpy ??
      (async (request) => ({
        output: {
          adapterSurface: surface,
          routeKey: request.routeKey,
          stageId: request.stageId,
          responseText,
        },
        elapsedMs: 1,
      })),
    streamEvents: async function* () {},
    requestConfirmation: async () => ({
      decision: 'approve',
      reason: 'unused',
      constraints: [],
      decidedAt: new Date('2026-03-31T12:00:00Z').toISOString(),
    }),
    cancel: async (request) => ({
      acknowledged: true,
      scope: request.scope,
      reason: request.reason,
      cancelledAt: new Date('2026-03-31T12:00:00Z').toISOString(),
    }),
  };
}

function createUnavailableProtocol(surface: AdapterSurface): AgentProtocolContract {
  return {
    probe: async () => ({
      identity: {
        agentId: `${surface}-agent`,
        role: 'session-main',
        surface,
        roleProfileId: 'session-main',
        roleSource: 'test',
      },
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      capabilityMatrix: {
        capabilityStates: Object.values(AgentCapability).map((capability) => ({
          capability,
          supportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
        })),
        timeout: {
          supportsAgentInvocationTimeout: true,
          supportsStageTimeoutSignal: true,
          supportsFlowTimeoutSignal: true,
        },
        cancellation: {
          supportsCancel: true,
          supportsReasonPropagation: true,
          supportsAbortSignal: true,
        },
        contextWindow: {
          supportsAutoTruncation: true,
        },
      },
      unavailableReasons: ['unavailable-for-test'],
    }),
    invokeStage: async () => ({
      output: {},
      elapsedMs: 1,
    }),
    streamEvents: async function* () {},
    requestConfirmation: async () => ({
      decision: 'approve',
      reason: 'unused',
      constraints: [],
      decidedAt: new Date('2026-03-31T12:00:00Z').toISOString(),
    }),
    cancel: async (request) => ({
      acknowledged: true,
      scope: request.scope,
      reason: request.reason,
      cancelledAt: new Date('2026-03-31T12:00:00Z').toISOString(),
    }),
  };
}

describe('Cli session-main supervisor runtime', () => {
  const adaptersConfig: AdaptersConfig = {
    roles: [
      {
        roleId: 'architect',
        roleProfileId: 'architect-default',
        requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
        required: true,
      },
      {
        roleId: 'planner',
        roleProfileId: 'planner-default',
        requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
        required: true,
      },
      {
        roleId: 'reviewer',
        roleProfileId: 'reviewer-default',
        requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
        required: true,
      },
      {
        roleId: 'verifier',
        roleProfileId: 'verifier-default',
        requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
        required: true,
      },
    ],
    routing: {
      roleBindings: {
        architect: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.CLAUDE_CODE],
        },
        planner: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.CLAUDE_CODE],
        },
        reviewer: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.CLAUDE_CODE],
        },
        verifier: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.CLAUDE_CODE],
        },
      },
    },
    tools: [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
      {
        toolId: AdapterSurface.CLAUDE_CODE,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
      {
        toolId: AdapterSurface.OLLAMA,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        localModel: {
          provider: LocalModelProvider.OLLAMA,
          endpoint: 'http://127.0.0.1:11434',
          model: 'qwen2.5-coder:7b',
          maxRetries: 0,
        },
      },
    ],
  };
  const workspace = {
    workspaceId: 'workspace-001',
    mode: WorkspaceMode.REPO_LOCAL,
  } as const;

  it('returns direct-answer outcome from a safe no-tool surface', async () => {
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.OLLAMA]: createAvailableProtocol(
        AdapterSurface.OLLAMA,
        '## Workspace status\n\n- clean',
        {
          toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
        },
      ),
      [AdapterSurface.CODEX]: createUnavailableProtocol(AdapterSurface.CODEX),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'fallback response',
      ),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'zh-CN',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-001',
      routeId: 'session.main',
      turnId: 'turn-001',
      turnIndex: 1,
      userMessage: '帮我检查当前工作区状态',
      selectedSurface: AdapterSurface.OLLAMA,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(outcome.responseMode).toBe('answer');
    expect(outcome.interactionMode).toBe('direct_answer');
    expect(outcome.assistantMessage).toBe('## Workspace status\n\n- clean');
    expect(outcome.selectedSurface).toBe(AdapterSurface.OLLAMA);
    expect(outcome.selectedBy).toBe('session.main.answer.primary');
    expect(outcome.invokedRoleIds).toEqual([]);
  });

  it('allows direct-answer turns to stay on the preferred tool-capable surface', async () => {
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unsafe codex answer'),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'Fallback answer from Claude Code',
      ),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(
        AdapterSurface.OLLAMA,
        'Fallback answer from local model',
        {
          toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
        },
      ),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-002',
      routeId: 'session.main',
      turnId: 'turn-002',
      turnIndex: 2,
      userMessage: 'Summarize the workspace state',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(outcome.assistantMessage).toBe('unsafe codex answer');
    expect(outcome.selectedSurface).toBe(AdapterSurface.CODEX);
    expect(outcome.selectedBy).toBe('session.main.answer.primary');
  });

  it('returns a guarded fallback answer when no eligible direct-answer surface is available', async () => {
    const codexInvokeStage = vi.fn(async () => ({
      output: {
        responseText: 'unsafe codex answer',
      },
      elapsedMs: 1,
    }));
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime({
      ...adaptersConfig,
      tools: adaptersConfig.tools?.filter((tool) => tool.toolId !== AdapterSurface.OLLAMA),
    }) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createUnavailableProtocol(AdapterSurface.CODEX),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig: {
        ...adaptersConfig,
        tools: adaptersConfig.tools?.filter((tool) => tool.toolId !== AdapterSurface.OLLAMA),
      },
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-003',
      routeId: 'session.main',
      turnId: 'turn-003',
      turnIndex: 3,
      userMessage: 'Inspect the workspace status',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(codexInvokeStage).not.toHaveBeenCalled();
    expect(outcome.selectedSurface).toBe('guarded-direct-answer');
    expect(outcome.selectedBy).toBe('session.main.answer.guard');
    expect(outcome.assistantMessage).toContain('No eligible direct-answer surface');
  });

  it('delegates explicit @planner turns through a single-role safe fallback path', async () => {
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(
        AdapterSurface.CODEX,
        'unsafe planner answer',
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'unsafe fallback answer',
      ),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(
        AdapterSurface.OLLAMA,
        '## Planner perspective\n\n- break work into two checkpoints',
        {
          toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
        },
      ),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-004',
      routeId: 'session.main',
      turnId: 'turn-004',
      turnIndex: 4,
      userMessage: '@planner help me break this delivery into milestones',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('single_role_delegate');
    expect(outcome.executionIntent).toBe('session.role_delegate.planner');
    expect(outcome.assistantMessage).toBe(
      '## Planner perspective\n\n- break work into two checkpoints',
    );
    expect(outcome.selectedSurface).toBe(AdapterSurface.OLLAMA);
    expect(outcome.selectedBy).toBe('session.main.role_delegate.safe_fallback');
    expect(outcome.invokedRoleIds).toEqual(['planner']);
    expect(outcome.subagentCount).toBe(1);
  });

  it('routes explicit @planner @reviewer turns through one serial collaboration path', async () => {
    const serialInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      if (request.stageId === 'stage-session-main-role-planner') {
        return {
          output: {
            responseText: '## Planner perspective\n\n- milestone 1\n- milestone 2',
          },
          elapsedMs: 1,
        };
      }

      expect(request.stageId).toBe('stage-session-main-role-reviewer');
      expect(request.routeKey).toBe('session.main.role.reviewer');
      expect(request.input).toEqual(
        expect.objectContaining({
          interactionMode: 'serial_role_collaboration',
          collaborationRoleOrder: ['planner', 'reviewer'],
          priorRoleOutputs: [
            {
              roleId: 'planner',
              assistantMessage: '## Planner perspective\n\n- milestone 1\n- milestone 2',
            },
          ],
        }),
      );
      return {
        output: {
          responseText: '## Reviewer perspective\n\n- sequencing looks safe',
        },
        elapsedMs: 1,
      };
    });
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(
        AdapterSurface.CODEX,
        'unsafe collaborative answer',
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'unsafe fallback answer',
      ),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused', {
        invokeStageSpy: serialInvokeStage,
        toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
      }),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-004-serial',
      routeId: 'session.main',
      turnId: 'turn-004-serial',
      turnIndex: 4,
      userMessage: '@planner @reviewer collaborate on this rollout plan',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(serialInvokeStage).toHaveBeenCalledTimes(2);
    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('serial_role_collaboration');
    expect(outcome.routerDecisionReason).toBe(
      'session.main.router.serial_role_collaboration.explicit_roles',
    );
    expect(outcome.executionIntent).toBe('session.role_delegate.planner.reviewer');
    expect(outcome.assistantMessage).toContain('## Planner -> Reviewer Collaboration');
    expect(outcome.assistantMessage).toContain('### Planner');
    expect(outcome.assistantMessage).toContain('### Reviewer');
    expect(outcome.selectedSurface).toBe('planner:ollama -> reviewer:ollama');
    expect(outcome.selectedBy).toBe(
      'planner:session.main.role_delegate.safe_fallback -> reviewer:session.main.role_delegate.safe_fallback',
    );
    expect(outcome.invokedRoleIds).toEqual(['planner', 'reviewer']);
    expect(outcome.subagentCount).toBe(2);
  });

  it('routes explicit @planner @reviewer parallel requests through one parallel fan-out path', async () => {
    const parallelInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      if (request.stageId === 'stage-session-main-role-planner') {
        expect(request.input).toEqual(
          expect.objectContaining({
            interactionMode: 'parallel_role_fanout',
            collaborationRoleOrder: ['planner', 'reviewer'],
            synthesisMode: 'parallel_analysis',
          }),
        );
        return {
          output: {
            responseText: '## Planner perspective\n\n- planning risk',
          },
          elapsedMs: 1,
        };
      }

      expect(request.stageId).toBe('stage-session-main-role-reviewer');
      expect(request.input).toEqual(
        expect.objectContaining({
          interactionMode: 'parallel_role_fanout',
          collaborationRoleOrder: ['planner', 'reviewer'],
          synthesisMode: 'parallel_analysis',
        }),
      );
      return {
        output: {
          responseText: '## Reviewer perspective\n\n- review risk',
        },
        elapsedMs: 1,
      };
    });
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(
        AdapterSurface.CODEX,
        'unsafe collaborative answer',
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'unsafe fallback answer',
      ),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused', {
        invokeStageSpy: parallelInvokeStage,
        toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
      }),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-004-parallel',
      routeId: 'session.main',
      turnId: 'turn-004-parallel',
      turnIndex: 5,
      userMessage: '@planner @reviewer parallel assess this rollout risk',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(parallelInvokeStage).toHaveBeenCalledTimes(2);
    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('parallel_role_fanout');
    expect(outcome.routerDecisionReason).toBe(
      'session.main.router.parallel_role_fanout.explicit_roles',
    );
    expect(outcome.synthesisMode).toBe('parallel_analysis');
    expect(outcome.executionIntent).toBe('session.role_delegate.parallel.planner.reviewer');
    expect(outcome.assistantMessage).toContain('Planner + Reviewer Parallel Analysis');
    expect(outcome.selectedSurface).toBe('planner:ollama | reviewer:ollama');
    expect(outcome.selectedBy).toBe(
      'planner:session.main.role_delegate.safe_fallback | reviewer:session.main.role_delegate.safe_fallback',
    );
    expect(outcome.invokedRoleIds).toEqual(['planner', 'reviewer']);
    expect(outcome.subagentCount).toBe(2);
  });

  it('routes explicit three-role parallel requests through one three-role fan-out pilot', async () => {
    const parallelInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.input).toEqual(
        expect.objectContaining({
          interactionMode: 'parallel_role_fanout',
          collaborationRoleOrder: ['architect', 'reviewer', 'verifier'],
          synthesisMode: 'parallel_analysis',
        }),
      );

      if (request.stageId === 'stage-session-main-role-architect') {
        return {
          output: {
            responseText: '## Architect perspective\n\n- architecture risk',
          },
          elapsedMs: 1,
        };
      }
      if (request.stageId === 'stage-session-main-role-reviewer') {
        return {
          output: {
            responseText: '## Reviewer perspective\n\n- review risk',
          },
          elapsedMs: 1,
        };
      }

      expect(request.stageId).toBe('stage-session-main-role-verifier');
      return {
        output: {
          responseText: '## Verifier perspective\n\n- verification risk',
        },
        elapsedMs: 1,
      };
    });
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(
        AdapterSurface.CODEX,
        'unsafe collaborative answer',
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'unsafe fallback answer',
      ),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused', {
        invokeStageSpy: parallelInvokeStage,
        toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
      }),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-004-parallel-three-role',
      routeId: 'session.main',
      turnId: 'turn-004-parallel-three-role',
      turnIndex: 6,
      userMessage: '@architect @reviewer @verifier parallel assess this rollout risk',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(parallelInvokeStage).toHaveBeenCalledTimes(3);
    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('parallel_role_fanout');
    expect(outcome.routerDecisionReason).toBe(
      'session.main.router.parallel_role_fanout.explicit_roles',
    );
    expect(outcome.synthesisMode).toBe('parallel_analysis');
    expect(outcome.executionIntent).toBe(
      'session.role_delegate.parallel.architect.reviewer.verifier',
    );
    expect(outcome.assistantMessage).toContain('Architect + Reviewer + Verifier Parallel Analysis');
    expect(outcome.assistantMessage).toContain('### Architect');
    expect(outcome.assistantMessage).toContain('### Reviewer');
    expect(outcome.assistantMessage).toContain('### Verifier');
    expect(outcome.selectedSurface).toBe('architect:ollama | reviewer:ollama | verifier:ollama');
    expect(outcome.selectedBy).toBe(
      'architect:session.main.role_delegate.safe_fallback | reviewer:session.main.role_delegate.safe_fallback | verifier:session.main.role_delegate.safe_fallback',
    );
    expect(outcome.invokedRoleIds).toEqual(['architect', 'reviewer', 'verifier']);
    expect(outcome.subagentCount).toBe(3);
  });

  it('fails closed when explicit serial collaboration mentions exceed the pilot limit', async () => {
    const serialInvokeStage = vi.fn(async () => ({
      output: {
        responseText: 'this should not run',
      },
      elapsedMs: 1,
    }));
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(
        AdapterSurface.CODEX,
        'unsafe collaborative answer',
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'unsafe fallback answer',
      ),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused', {
        invokeStageSpy: serialInvokeStage,
        toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
      }),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-004-serial-overflow',
      routeId: 'session.main',
      turnId: 'turn-004-serial-overflow',
      turnIndex: 7,
      userMessage: '@planner @reviewer @verifier collaborate on this rollout plan',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(serialInvokeStage).not.toHaveBeenCalled();
    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('serial_role_collaboration');
    expect(outcome.routerDecisionReason).toBe(
      'session.main.router.serial_role_collaboration.overflow',
    );
    expect(outcome.selectedSurface).toBe('guarded-role-delegate');
    expect(outcome.selectedBy).toBe('session.main.serial_role_collaboration.overflow');
    expect(outcome.invokedRoleIds).toEqual([]);
    expect(outcome.subagentCount).toBe(0);
    expect(outcome.assistantMessage).toContain('supports at most 2 explicit roles');
    expect(outcome.assistantMessage).toContain('@planner @reviewer @verifier');
  });

  it('fails closed when explicit parallel collaboration mentions exceed the pilot limit', async () => {
    const parallelInvokeStage = vi.fn(async () => ({
      output: {
        responseText: 'this should not run',
      },
      elapsedMs: 1,
    }));
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(
        AdapterSurface.CODEX,
        'unsafe collaborative answer',
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'unsafe fallback answer',
      ),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused', {
        invokeStageSpy: parallelInvokeStage,
        toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
      }),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-004-parallel-overflow',
      routeId: 'session.main',
      turnId: 'turn-004-parallel-overflow',
      turnIndex: 8,
      userMessage: '@planner @architect @reviewer @verifier parallel analyze this change',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(parallelInvokeStage).not.toHaveBeenCalled();
    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('parallel_role_fanout');
    expect(outcome.routerDecisionReason).toBe('session.main.router.parallel_role_fanout.overflow');
    expect(outcome.synthesisMode).toBe('parallel_analysis');
    expect(outcome.selectedSurface).toBe('guarded-role-delegate');
    expect(outcome.selectedBy).toBe('session.main.parallel_role_fanout.overflow');
    expect(outcome.invokedRoleIds).toEqual([]);
    expect(outcome.subagentCount).toBe(0);
    expect(outcome.assistantMessage).toContain('supports at most 3 explicit roles');
    expect(outcome.assistantMessage).toContain('@planner @architect @reviewer @verifier');
  });

  it('blocks explicit @planner delegation when the only no-tool fallback misses one required capability', async () => {
    const ollamaInvokeStage = vi.fn(async () => ({
      output: {
        responseText: '## Planner perspective\n\n- this should not run',
      },
      elapsedMs: 1,
    }));
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(
        AdapterSurface.CODEX,
        'unsafe planner answer',
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'unsafe fallback answer',
      ),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(
        AdapterSurface.OLLAMA,
        '## Planner perspective\n\n- this should not run',
        {
          capabilitySupportOverrides: {
            [AgentCapability.STRUCTURED_OUTPUT]: AgentCapabilitySupportLevel.UNSUPPORTED,
          },
          invokeStageSpy: ollamaInvokeStage,
          toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
        },
      ),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-004b',
      routeId: 'session.main',
      turnId: 'turn-004b',
      turnIndex: 4,
      userMessage: '@planner help me break this delivery into milestones',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(ollamaInvokeStage).not.toHaveBeenCalled();
    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('single_role_delegate');
    expect(outcome.selectedSurface).toBe('guarded-role-delegate');
    expect(outcome.selectedBy).toBe('session.main.role_delegate.guard');
    expect(outcome.invokedRoleIds).toEqual([]);
    expect(outcome.subagentCount).toBe(0);
    expect(outcome.assistantMessage).toContain('missing one required capability');
  });

  it('keeps explicit @planner turns on the governed side when only tool-capable role surfaces are active', async () => {
    const codexInvokeStage = vi.fn(async () => ({
      output: {
        responseText: 'unsafe planner answer',
      },
      elapsedMs: 1,
    }));
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime({
      ...adaptersConfig,
      tools: adaptersConfig.tools?.filter((tool) => tool.toolId !== AdapterSurface.OLLAMA),
    }) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(
        AdapterSurface.CODEX,
        'unsafe planner answer',
        {
          invokeStageSpy: codexInvokeStage,
        },
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'unsafe fallback answer',
      ),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig: {
        ...adaptersConfig,
        tools: adaptersConfig.tools?.filter((tool) => tool.toolId !== AdapterSurface.OLLAMA),
      },
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-005',
      routeId: 'session.main',
      turnId: 'turn-005',
      turnIndex: 5,
      userMessage: '@planner break this release into milestones',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(codexInvokeStage).not.toHaveBeenCalled();
    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('single_role_delegate');
    expect(outcome.selectedSurface).toBe('guarded-role-delegate');
    expect(outcome.selectedBy).toBe('session.main.role_delegate.guard');
    expect(outcome.invokedRoleIds).toEqual([]);
    expect(outcome.subagentCount).toBe(0);
    expect(outcome.assistantMessage).toContain('restricted to no-tool surfaces');
  });
});
