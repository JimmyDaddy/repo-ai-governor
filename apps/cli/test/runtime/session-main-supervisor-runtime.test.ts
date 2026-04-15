import {
  AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY,
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCapabilitySupportLevel,
  type AgentProtocolContract,
  AgentStageContinuationHandleKind,
  AgentStageContinuationMode,
  AgentStageContinuationStatus,
  AgentStageContinuationTransportKind,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
  AgentStreamEventType,
} from '@repo-ai-governor/adapter-sdk';
import { type AdaptersConfig, WorkspaceMode } from '@repo-ai-governor/config';
import {
  SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS,
  SESSION_MAIN_CAPABILITY_ID,
  type SessionProviderContinuationSessionState,
} from '@repo-ai-governor/core-orchestration-service';
import {
  AdapterAvailability,
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  GovernorErrorCode,
  LocalModelProvider,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { SessionMainProviderContinuationPolicyEnvelope } from '../../src/constants/session-main-provider-continuation.constant.js';
import { CliAdapterRoutingRuntime } from '../../src/runtime/adapter-routing-runtime.js';
import { CliSessionMainSupervisorRuntime } from '../../src/runtime/session-main-supervisor-runtime.js';

const SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY = 'implicitRoleDelegateRoleId';

function createAvailableProtocol(
  surface: AdapterSurface,
  responseText: string,
  options: {
    capabilitySupportOverrides?: Partial<Record<AgentCapability, AgentCapabilitySupportLevel>>;
    omittedCapabilities?: AgentCapability[];
    toolCallingSupportLevel?: AgentCapabilitySupportLevel;
    probeSpy?: ReturnType<typeof vi.fn>;
    invokeStageSpy?: ReturnType<typeof vi.fn>;
    streamEvents?: Array<{
      eventType: AgentStreamEventType;
      payload: Record<string, unknown>;
    }>;
  } = {},
): AgentProtocolContract {
  const toolCallingSupportLevel =
    options.toolCallingSupportLevel ?? AgentCapabilitySupportLevel.SUPPORTED;
  const omittedCapabilities = new Set(options.omittedCapabilities ?? []);
  return {
    probe:
      options.probeSpy ??
      (async () => ({
        identity: {
          agentId: `${surface}-agent`,
          role: 'session-main',
          surface,
          roleProfileId: 'session-main',
          roleSource: 'test',
        },
        availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        capabilityMatrix: {
          capabilityStates: Object.values(AgentCapability)
            .filter((capability) => !omittedCapabilities.has(capability))
            .map((capability) => ({
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
      })),
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
    streamEvents: async function* () {
      for (const event of options.streamEvents ?? []) {
        yield event;
      }
    },
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

function createProbeThrowingProtocol(
  surface: AdapterSurface,
  errorMessage = 'probe exploded for test',
): AgentProtocolContract {
  return {
    probe: async () => {
      throw new RuntimeError(GovernorErrorCode.PROCESS_RUNTIME_FAILED, errorMessage, {
        surface,
      });
    },
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
    expect(outcome.executionDetailsLines).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/preflight probes finished in|预检探针耗时/u),
        '本轮 turn 的 surface 探针诊断：',
        expect.stringMatching(/invoke completed in|调用在/u),
      ]),
    );
    expect(outcome.invokedRoleIds).toEqual([]);
    expect(outcome.invokedRoles).toEqual([]);
  });

  it('allows free-form direct answers on tool-capable surfaces when chat-only policy forbids tool use', async () => {
    const codexInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.input).toEqual(
        expect.objectContaining({
          [AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY]: {
            interactionMode: AgentStageExecutionMode.CHAT_ONLY,
            toolUsePolicy: AgentStageToolUsePolicy.FORBIDDEN,
          },
        }),
      );
      return {
        output: {
          responseText: '你好，我可以继续帮你处理仓库里的事情。',
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
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unused', {
        invokeStageSpy: codexInvokeStage,
      }),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'fallback answer',
      ),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
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
      sessionId: 'session-001-tool-capable',
      routeId: 'session.main',
      turnId: 'turn-001-tool-capable',
      turnIndex: 2,
      userMessage: '你好',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(codexInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.responseMode).toBe('answer');
    expect(outcome.interactionMode).toBe('direct_answer');
    expect(outcome.assistantMessage).toBe('你好，我可以继续帮你处理仓库里的事情。');
    expect(outcome.selectedSurface).toBe(AdapterSurface.CODEX);
    expect(outcome.selectedBy).toBe('session.main.answer.primary');
    expect(outcome.routerDecisionReason).toBe('session.main.router.direct_answer.default');
  });

  it('short-circuits direct-answer preflight after the first safe preferred surface', async () => {
    const codexProbeSpy = vi.fn(async () => ({
      identity: {
        agentId: 'codex-agent',
        role: 'session-main',
        surface: AdapterSurface.CODEX,
        roleProfileId: 'session-main',
        roleSource: 'test',
      },
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      capabilityMatrix: {
        capabilityStates: Object.values(AgentCapability).map((capability) => ({
          capability,
          supportLevel: AgentCapabilitySupportLevel.SUPPORTED,
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
    }));
    const claudeProbeSpy = vi.fn(async () => ({
      identity: {
        agentId: 'claude-agent',
        role: 'session-main',
        surface: AdapterSurface.CLAUDE_CODE,
        roleProfileId: 'session-main',
        roleSource: 'test',
      },
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      capabilityMatrix: {
        capabilityStates: Object.values(AgentCapability).map((capability) => ({
          capability,
          supportLevel: AgentCapabilitySupportLevel.SUPPORTED,
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
    }));
    const codexInvokeStage = vi.fn(async () => ({
      output: {
        responseText: 'Primary answer from Codex',
      },
      elapsedMs: 5,
    }));
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unused', {
        probeSpy: codexProbeSpy,
        invokeStageSpy: codexInvokeStage,
      }),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(AdapterSurface.CLAUDE_CODE, 'unused', {
        probeSpy: claudeProbeSpy,
      }),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused', {
        probeSpy: vi.fn(async () => {
          throw new RuntimeError(
            GovernorErrorCode.PROCESS_RUNTIME_FAILED,
            'ollama probe should not run after preferred surface succeeds',
          );
        }),
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
      sessionId: 'session-001-short-circuit',
      routeId: 'session.main',
      turnId: 'turn-001-short-circuit',
      turnIndex: 3,
      userMessage: 'hello',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(outcome.assistantMessage).toBe('Primary answer from Codex');
    expect(codexProbeSpy).toHaveBeenCalledTimes(2);
    expect(claudeProbeSpy).not.toHaveBeenCalled();
    expect(codexInvokeStage).toHaveBeenCalledTimes(1);
  });

  it('retries direct-answer invoke on the next eligible surface when the preferred surface fails', async () => {
    const codexProbeSpy = vi.fn(async () => ({
      identity: {
        agentId: 'codex-agent',
        role: 'session-main',
        surface: AdapterSurface.CODEX,
        roleProfileId: 'session-main',
        roleSource: 'test',
      },
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      capabilityMatrix: {
        capabilityStates: Object.values(AgentCapability).map((capability) => ({
          capability,
          supportLevel: AgentCapabilitySupportLevel.SUPPORTED,
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
    }));
    const claudeProbeSpy = vi.fn(async () => ({
      identity: {
        agentId: 'claude-agent',
        role: 'session-main',
        surface: AdapterSurface.CLAUDE_CODE,
        roleProfileId: 'session-main',
        roleSource: 'test',
      },
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      capabilityMatrix: {
        capabilityStates: Object.values(AgentCapability).map((capability) => ({
          capability,
          supportLevel: AgentCapabilitySupportLevel.SUPPORTED,
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
    }));
    const codexInvokeStage = vi.fn(async () => {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        'primary codex invoke failed',
      );
    });
    const claudeInvokeStage = vi.fn(async () => ({
      output: {
        responseText: 'Recovered answer from Claude Code',
      },
      elapsedMs: 9,
    }));
    const publishedStreamEvents: Array<Record<string, unknown>> = [];
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unused', {
        probeSpy: codexProbeSpy,
        invokeStageSpy: codexInvokeStage,
      }),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(AdapterSurface.CLAUDE_CODE, 'unused', {
        probeSpy: claudeProbeSpy,
        invokeStageSpy: claudeInvokeStage,
      }),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
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
      sessionId: 'session-001-invoke-fallback',
      routeId: 'session.main',
      turnId: 'turn-001-invoke-fallback',
      turnIndex: 4,
      userMessage: 'hello',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      publishStreamEvent: async (event) => {
        publishedStreamEvents.push(event as Record<string, unknown>);
      },
    });

    expect(codexProbeSpy).toHaveBeenCalledTimes(2);
    expect(codexInvokeStage).toHaveBeenCalledTimes(1);
    expect(claudeProbeSpy).toHaveBeenCalledTimes(2);
    expect(claudeInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.assistantMessage).toBe('Recovered answer from Claude Code');
    expect(outcome.selectedSurface).toBe(AdapterSurface.CLAUDE_CODE);
    expect(outcome.selectedBy).toBe('session.main.answer.fallback');
    expect(outcome.executionDetailsLines).toEqual(
      expect.arrayContaining([
        expect.stringContaining('codex · invoke failed · primary codex invoke failed'),
      ]),
    );
    expect(publishedStreamEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'running',
          detail:
            'The primary direct-answer surface failed, so the supervisor is retrying on claude-code.',
          selectedSurface: 'claude-code',
        }),
      ]),
    );
  });

  it('publishes the recovered fallback answer when the failed surface already streamed partial tokens', async () => {
    const codexProbeSpy = vi.fn(async () => ({
      identity: {
        agentId: 'codex-agent',
        role: 'session-main',
        surface: AdapterSurface.CODEX,
        roleProfileId: 'session-main',
        roleSource: 'test',
      },
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      capabilityMatrix: {
        capabilityStates: Object.values(AgentCapability).map((capability) => ({
          capability,
          supportLevel: AgentCapabilitySupportLevel.SUPPORTED,
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
    }));
    const claudeProbeSpy = vi.fn(async () => ({
      identity: {
        agentId: 'claude-agent',
        role: 'session-main',
        surface: AdapterSurface.CLAUDE_CODE,
        roleProfileId: 'session-main',
        roleSource: 'test',
      },
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      capabilityMatrix: {
        capabilityStates: Object.values(AgentCapability).map((capability) => ({
          capability,
          supportLevel: AgentCapabilitySupportLevel.SUPPORTED,
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
    }));
    const codexInvokeStage = vi.fn(async () => {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        'primary codex invoke failed after partial output',
      );
    });
    const claudeInvokeStage = vi.fn(async () => ({
      output: {
        responseText: 'Recovered answer from Claude Code',
      },
      elapsedMs: 9,
    }));
    const publishedStreamEvents: Array<Record<string, unknown>> = [];
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unused', {
        probeSpy: codexProbeSpy,
        invokeStageSpy: codexInvokeStage,
        streamEvents: [
          {
            eventType: AgentStreamEventType.TOKEN,
            payload: {
              title: 'Codex Draft',
              chunkText: 'Partial answer from Codex',
              accumulatedText: 'Partial answer from Codex',
              surface: AdapterSurface.CODEX,
            },
          },
        ],
      }),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(AdapterSurface.CLAUDE_CODE, 'unused', {
        probeSpy: claudeProbeSpy,
        invokeStageSpy: claudeInvokeStage,
      }),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
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
      sessionId: 'session-001-fallback-publishes-final-answer',
      routeId: 'session.main',
      turnId: 'turn-001-fallback-publishes-final-answer',
      turnIndex: 5,
      userMessage: 'hello',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      publishStreamEvent: async (event) => {
        publishedStreamEvents.push(event as Record<string, unknown>);
      },
    });

    expect(outcome.assistantMessage).toBe('Recovered answer from Claude Code');
    expect(outcome.selectedSurface).toBe(AdapterSurface.CLAUDE_CODE);
    expect(publishedStreamEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'token',
          chunkText: 'Partial answer from Codex',
          selectedSurface: AdapterSurface.CODEX,
        }),
        expect.objectContaining({
          kind: 'token',
          chunkText: 'Recovered answer from Claude Code',
          selectedSurface: AdapterSurface.CLAUDE_CODE,
          selectedBy: 'session.main.answer.fallback',
        }),
      ]),
    );
  });

  it('keeps free-form direct answers available when surface metadata omits tool-calling capability', async () => {
    const codexInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.input).toEqual(
        expect.objectContaining({
          [AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY]: {
            interactionMode: AgentStageExecutionMode.CHAT_ONLY,
            toolUsePolicy: AgentStageToolUsePolicy.FORBIDDEN,
          },
        }),
      );
      return {
        output: {
          responseText: '你好，我仍然可以先陪你对话，再帮你衔接后续任务。',
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
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unused', {
        omittedCapabilities: [AgentCapability.TOOL_CALLING],
        invokeStageSpy: codexInvokeStage,
      }),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
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
      sessionId: 'session-001-missing-tool-capability',
      routeId: 'session.main',
      turnId: 'turn-001-missing-tool-capability',
      turnIndex: 3,
      userMessage: '你好',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(codexInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.responseMode).toBe('answer');
    expect(outcome.interactionMode).toBe('direct_answer');
    expect(outcome.assistantMessage).toBe('你好，我仍然可以先陪你对话，再帮你衔接后续任务。');
    expect(outcome.selectedSurface).toBe(AdapterSurface.CODEX);
    expect(outcome.selectedBy).toBe('session.main.answer.primary');
    expect(outcome.routerDecisionReason).toBe('session.main.router.direct_answer.default');
  });

  it('passes lane-scoped continuation requests into direct-answer invocations and projects reuse summaries', async () => {
    const laneKey = 'session.main::stage-session-main-answer::session.main::codex::chat_only';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [laneKey]: {
          laneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-answer',
          roleId: null,
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: 'chat_only',
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'resp-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T00:00:00.000Z',
          },
          updatedAt: '2026-04-04T00:00:00.000Z',
        },
      },
    };
    const codexInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.continuation).toEqual(
        expect.objectContaining({
          mode: AgentStageContinuationMode.PREFER_REUSE,
          sessionId: 'session-continuation-001',
          laneKey,
          handle: expect.objectContaining({
            value: 'resp-existing',
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
          }),
        }),
      );
      return {
        output: {
          responseText: 'continued direct answer',
        },
        continuation: {
          status: AgentStageContinuationStatus.REUSED,
          laneKey,
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'resp-next',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T00:05:00.000Z',
          },
        },
        elapsedMs: 1,
      };
    });
    const continuationAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools:
        adaptersConfig.tools?.map((tool) =>
          tool.toolId === AdapterSurface.CODEX
            ? {
                ...tool,
                transport: AdapterTransportKind.REMOTE_API,
                remoteApi: {
                  provider: AdapterProviderKind.OPENAI,
                  vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
                  model: 'gpt-5',
                },
              }
            : tool,
        ) ?? [],
    };
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      continuationAdaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unused', {
        invokeStageSpy: codexInvokeStage,
      }),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig: continuationAdaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-continuation-001',
      routeId: 'session.main',
      turnId: 'turn-continuation-001',
      turnIndex: 1,
      userMessage: 'follow up on the previous answer',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      providerContinuationState,
    });

    expect(codexInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.assistantMessage).toBe('continued direct answer');
    expect(outcome.providerContinuationSummaries).toEqual([
      expect.objectContaining({
        laneKey,
        laneLabel: 'session.main',
        status: AgentStageContinuationStatus.REUSED,
        surface: AdapterSurface.CODEX,
        providerId: AdapterProviderKind.OPENAI,
        model: 'gpt-5',
      }),
    ]);
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey,
        slot: expect.objectContaining({
          handle: expect.objectContaining({
            value: 'resp-next',
          }),
        }),
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.REUSED,
        }),
      }),
    ]);
  });

  it('projects unsupported continuation attempts into direct-answer outcomes even without an existing slot', async () => {
    const laneKey = 'session.main::stage-session-main-answer::session.main::codex::chat_only';
    const codexInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.input).toEqual(
        expect.objectContaining({
          sessionContinuityNote: {
            latestNoteSummary:
              'goal=ask for a follow-up | last_reply=Summarized the previous answer | surface=codex',
            previewSummary: 'Summarized the previous answer',
          },
        }),
      );
      expect(request.continuation).toEqual(
        expect.objectContaining({
          mode: AgentStageContinuationMode.PREFER_REUSE,
          sessionId: 'session-continuation-unsupported-001',
          laneKey,
        }),
      );
      return {
        output: {
          responseText: 'fresh stateless answer',
        },
        continuation: {
          status: AgentStageContinuationStatus.UNSUPPORTED,
          laneKey,
          invalidationReason: 'provider_session_not_supported',
        },
        elapsedMs: 1,
      };
    });
    const continuationAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools:
        adaptersConfig.tools?.map((tool) =>
          tool.toolId === AdapterSurface.CODEX
            ? {
                ...tool,
                transport: AdapterTransportKind.REMOTE_API,
                remoteApi: {
                  provider: AdapterProviderKind.OPENAI,
                  vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
                  model: 'gpt-5',
                },
              }
            : tool,
        ) ?? [],
    };
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      continuationAdaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unused', {
        invokeStageSpy: codexInvokeStage,
      }),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig: continuationAdaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-continuation-unsupported-001',
      routeId: 'session.main',
      turnId: 'turn-continuation-unsupported-001',
      turnIndex: 1,
      userMessage: 'follow up on the previous answer',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      latestNoteSummary:
        'goal=ask for a follow-up | last_reply=Summarized the previous answer | surface=codex',
      previewSummary: 'Summarized the previous answer',
    });

    expect(codexInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.assistantMessage).toBe('fresh stateless answer');
    expect(outcome.providerContinuationSummaries).toEqual([
      expect.objectContaining({
        laneKey,
        laneLabel: 'session.main',
        status: AgentStageContinuationStatus.UNSUPPORTED,
        surface: AdapterSurface.CODEX,
        providerId: AdapterProviderKind.OPENAI,
        model: 'gpt-5',
        invalidationReason: 'provider_session_not_supported',
        lightweightSessionFallbackApplied: true,
      }),
    ]);
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.UNSUPPORTED,
          invalidationReason: 'provider_session_not_supported',
        }),
      }),
    ]);
  });

  it('preserves unsupported continuation summaries while clearing an existing reused slot', async () => {
    const laneKey = 'session.main::stage-session-main-answer::session.main::codex::chat_only';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [laneKey]: {
          laneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-answer',
          roleId: null,
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.CHAT_ONLY,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'resp-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
    const codexInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.continuation).toEqual(
        expect.objectContaining({
          mode: AgentStageContinuationMode.PREFER_REUSE,
          sessionId: 'session-continuation-unsupported-existing-001',
          laneKey,
          handle: expect.objectContaining({
            value: 'resp-existing',
          }),
        }),
      );
      return {
        output: {
          responseText: 'fresh stateless answer after unsupported reuse',
        },
        continuation: {
          status: AgentStageContinuationStatus.UNSUPPORTED,
          laneKey,
          invalidationReason: 'provider_session_not_supported',
        },
        elapsedMs: 1,
      };
    });
    const continuationAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools:
        adaptersConfig.tools?.map((tool) =>
          tool.toolId === AdapterSurface.CODEX
            ? {
                ...tool,
                transport: AdapterTransportKind.REMOTE_API,
                remoteApi: {
                  provider: AdapterProviderKind.OPENAI,
                  vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
                  model: 'gpt-5',
                },
              }
            : tool,
        ) ?? [],
    };
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      continuationAdaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unused', {
        invokeStageSpy: codexInvokeStage,
      }),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig: continuationAdaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-continuation-unsupported-existing-001',
      routeId: 'session.main',
      turnId: 'turn-continuation-unsupported-existing-001',
      turnIndex: 2,
      userMessage: 'follow up on the previous answer again',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      providerContinuationState,
    });

    expect(codexInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.assistantMessage).toBe('fresh stateless answer after unsupported reuse');
    expect(outcome.providerContinuationSummaries).toEqual([
      expect.objectContaining({
        laneKey,
        laneLabel: 'session.main',
        status: AgentStageContinuationStatus.UNSUPPORTED,
        surface: AdapterSurface.CODEX,
        providerId: AdapterProviderKind.OPENAI,
        model: 'gpt-5',
        invalidationReason: 'provider_session_not_supported',
      }),
    ]);
    expect(outcome.providerContinuationMutations).toHaveLength(1);
    expect(outcome.providerContinuationMutations?.[0]).toEqual(
      expect.objectContaining({
        laneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.UNSUPPORTED,
          invalidationReason: 'provider_session_not_supported',
        }),
      }),
    );
    expect(outcome.providerContinuationMutations?.[0]?.slot).toBeUndefined();
    expect(outcome.providerContinuationSummaries?.[0]).not.toHaveProperty(
      'lightweightSessionFallbackApplied',
    );
  });

  it('invalidates remote_api continuation handles when explicit cli_exec transport is selected', async () => {
    const laneKey = 'session.main::stage-session-main-answer::session.main::codex::chat_only';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [laneKey]: {
          laneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-answer',
          roleId: null,
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.CHAT_ONLY,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'resp-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
    const publishedStreamEvents: Array<Record<string, unknown>> = [];
    const codexInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.continuation).toEqual(
        expect.objectContaining({
          mode: AgentStageContinuationMode.PREFER_REUSE,
          sessionId: 'session-continuation-cli-exec-001',
          laneKey,
        }),
      );
      expect(request.continuation).not.toHaveProperty('handle');
      return {
        output: {
          responseText: 'cli exec answer',
        },
        continuation: {
          status: AgentStageContinuationStatus.UNSUPPORTED,
          laneKey,
        },
        elapsedMs: 1,
      };
    });
    const continuationAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools:
        adaptersConfig.tools?.map((tool) =>
          tool.toolId === AdapterSurface.CODEX
            ? {
                ...tool,
                transport: AdapterTransportKind.CLI_EXEC,
                remoteApi: {
                  provider: AdapterProviderKind.OPENAI,
                  vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
                  model: 'gpt-5',
                },
              }
            : tool,
        ) ?? [],
    };
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      continuationAdaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unused', {
        invokeStageSpy: codexInvokeStage,
        streamEvents: [
          {
            eventType: AgentStreamEventType.STATUS,
            payload: {
              title: 'Session Main Answer',
              detail: 'Codex CLI execution started.',
              surface: AdapterSurface.CODEX,
            },
          },
          {
            eventType: AgentStreamEventType.TOKEN,
            payload: {
              title: 'Assistant Draft',
              text: 'cli exec draft',
              accumulatedText: 'cli exec draft',
              surface: AdapterSurface.CODEX,
            },
          },
        ],
      }),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig: continuationAdaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-continuation-cli-exec-001',
      routeId: 'session.main',
      turnId: 'turn-continuation-cli-exec-001',
      turnIndex: 3,
      userMessage: 'follow up using the configured codex surface',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      providerContinuationState,
      publishStreamEvent: async (event) => {
        publishedStreamEvents.push(event as Record<string, unknown>);
      },
    });

    expect(codexInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.assistantMessage).toBe('cli exec answer');
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.CLEARED,
          invalidationReason: 'provider_changed',
          providerId: AdapterSurface.CODEX,
          transportKind: AgentStageContinuationTransportKind.CLI_EXEC,
          model: null,
        }),
      }),
      expect.objectContaining({
        laneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.UNSUPPORTED,
          providerId: AdapterSurface.CODEX,
          transportKind: AgentStageContinuationTransportKind.CLI_EXEC,
          model: null,
        }),
      }),
    ]);
    expect(outcome.providerContinuationSummaries).toEqual([
      expect.objectContaining({
        laneKey,
        status: AgentStageContinuationStatus.CLEARED,
        providerId: AdapterSurface.CODEX,
        transportKind: AgentStageContinuationTransportKind.CLI_EXEC,
        model: null,
      }),
      expect.objectContaining({
        laneKey,
        status: AgentStageContinuationStatus.UNSUPPORTED,
        providerId: AdapterSurface.CODEX,
        transportKind: AgentStageContinuationTransportKind.CLI_EXEC,
        model: null,
      }),
    ]);
    expect(publishedStreamEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'running',
          title: 'Session Main Answer',
          detail: 'Codex CLI execution started.',
          selectedSurface: AdapterSurface.CODEX,
        }),
        expect.objectContaining({
          kind: 'token',
          state: 'running',
          title: 'Assistant Draft',
          accumulatedText: 'cli exec draft',
          selectedSurface: AdapterSurface.CODEX,
        }),
      ]),
    );
  });

  it('clears stale continuation state when acp_exec is rejected during direct-answer preflight', async () => {
    const laneKey = 'session.main::stage-session-main-answer::session.main::codex::chat_only';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [laneKey]: {
          laneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-answer',
          roleId: null,
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.CHAT_ONLY,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'resp-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
    const continuationAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools:
        adaptersConfig.tools?.map((tool) =>
          tool.toolId === AdapterSurface.CODEX
            ? {
                ...tool,
                transport: AdapterTransportKind.ACP_EXEC,
              }
            : tool,
        ) ?? [],
    };
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      continuationAdaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createUnavailableProtocol(AdapterSurface.CODEX),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig: continuationAdaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-continuation-acp-preflight-001',
      routeId: 'session.main',
      turnId: 'turn-continuation-acp-preflight-001',
      turnIndex: 4,
      userMessage: 'follow up using the configured codex surface',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      providerContinuationState,
    });

    expect(outcome.selectedBy).toBe('session.main.answer.guard');
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.UNSUPPORTED,
          invalidationReason: 'transport_not_continuation_capable',
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
        }),
      }),
    ]);
    expect(outcome.providerContinuationMutations?.[0]?.slot).toBeUndefined();
    expect(outcome.providerContinuationSummaries).toEqual([
      expect.objectContaining({
        laneKey,
        laneLabel: 'session.main',
        status: AgentStageContinuationStatus.UNSUPPORTED,
        surface: AdapterSurface.CODEX,
        providerId: AdapterProviderKind.OPENAI,
        transportKind: AgentStageContinuationTransportKind.REMOTE_API,
        model: 'gpt-5',
        invalidationReason: 'transport_not_continuation_capable',
      }),
    ]);
  });

  it('publishes mapped direct-answer stream events while preserving empty invoked-role truth', async () => {
    const publishedStreamEvents: Array<Record<string, unknown>> = [];
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createUnavailableProtocol(AdapterSurface.CODEX),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'Fallback answer from Claude Code',
      ),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(
        AdapterSurface.OLLAMA,
        '## Workspace status\n\n- clean',
        {
          toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
          streamEvents: [
            {
              eventType: AgentStreamEventType.STATUS,
              payload: {
                title: 'Session Main Answer',
                detail: 'Planning current workspace answer.',
                surface: 'ollama',
              },
            },
            {
              eventType: AgentStreamEventType.TOKEN,
              payload: {
                title: 'Assistant Draft',
                text: '## Workspace status',
                accumulatedText: '## Workspace status\n\n- clean',
                surface: 'ollama',
                invokeLiveness: {
                  status: 'running',
                  transportKind: 'remote_api',
                  vendorBindingKind: 'ollama_chat',
                  remoteRequestId: 'req-ollama-1',
                  lastTransportActivityAt: '2026-04-03T10:00:00.000Z',
                  lastSemanticProgressAt: '2026-04-03T10:00:01.000Z',
                  latestEventAt: '2026-04-03T10:00:01.000Z',
                  latestEventType: 'token',
                  latestTextPreview: '## Workspace status',
                  partialOutputPreserved: false,
                  cancelMechanism: 'none',
                },
              },
            },
          ],
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
      sessionId: 'session-002-stream',
      routeId: 'session.main',
      turnId: 'turn-002-stream',
      turnIndex: 2,
      userMessage: 'Summarize the workspace state',
      selectedSurface: AdapterSurface.OLLAMA,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      publishStreamEvent: async (event) => {
        publishedStreamEvents.push(event as Record<string, unknown>);
      },
    });

    expect(outcome.assistantMessage).toBe('## Workspace status\n\n- clean');
    expect(outcome.invokedRoleIds).toEqual([]);
    expect(outcome.invokedRoles).toEqual([]);
    expect(publishedStreamEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'started',
          title: 'Session Main Answer',
          detail: 'The supervisor is checking available direct-answer surfaces.',
          activityKey: 'session.main.answer.preflight',
        }),
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'running',
          title: 'Session Main Answer',
          detail: 'ollama is eligible for this turn.',
          activityKey: 'surface-probe:session.main.answer:session.main:ollama',
          selectedSurface: 'ollama',
        }),
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'running',
          title: 'Session Main Answer',
          detail: 'The supervisor is preparing a direct answer.',
          activityKey: 'session.main.answer.preflight',
          selectedSurface: 'ollama',
        }),
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'running',
          title: 'Session Main Answer',
          detail: 'Planning current workspace answer.',
          selectedSurface: 'ollama',
        }),
        expect.objectContaining({
          kind: 'token',
          state: 'running',
          title: 'Assistant Draft',
          accumulatedText: '## Workspace status\n\n- clean',
          selectedSurface: 'ollama',
          invokeLiveness: expect.objectContaining({
            status: 'running',
            remoteRequestId: 'req-ollama-1',
            lastTransportActivityAt: '2026-04-03T10:00:00.000Z',
            lastSemanticProgressAt: '2026-04-03T10:00:01.000Z',
          }),
        }),
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'completed',
          title: 'Session Main Answer',
          selectedSurface: 'ollama',
        }),
      ]),
    );
  });

  it('answers targeted surface availability questions from the local probe path without invoking codex', async () => {
    const codexInvokeStageSpy = vi.fn(async () => ({
      output: {
        adapterSurface: AdapterSurface.CODEX,
        responseText: 'should not run',
      },
      elapsedMs: 1,
    }));
    const githubCopilotProbeSpy = vi.fn(async () => ({
      identity: {
        agentId: `${AdapterSurface.GITHUB_COPILOT}-agent`,
        role: 'session-main',
        surface: AdapterSurface.GITHUB_COPILOT,
        roleProfileId: 'session-main',
        roleSource: 'test',
      },
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      capabilityMatrix: {
        capabilityStates: Object.values(AgentCapability).map((capability) => ({
          capability,
          supportLevel: AgentCapabilitySupportLevel.SUPPORTED,
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
    }));
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'should not run', {
        invokeStageSpy: codexInvokeStageSpy,
      }),
      [AdapterSurface.GITHUB_COPILOT]: createAvailableProtocol(
        AdapterSurface.GITHUB_COPILOT,
        'unused',
        {
          probeSpy: githubCopilotProbeSpy,
        },
      ),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
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
      sessionId: 'session-availability-001',
      routeId: 'session.main',
      turnId: 'turn-availability-001',
      turnIndex: 1,
      userMessage: '当前我的电脑上 github copilot cli 是否可用?',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(outcome.responseMode).toBe('answer');
    expect(outcome.interactionMode).toBe('direct_answer');
    expect(outcome.assistantMessage).toContain('GitHub Copilot CLI');
    expect(outcome.assistantMessage).toContain('`available`');
    expect(outcome.selectedSurface).toBe(AdapterSurface.GITHUB_COPILOT);
    expect(outcome.selectedBy).toBe('session.main.answer.surface_availability_probe');
    expect(outcome.routerDecisionReason).toBe(
      'session.main.router.direct_answer.surface_availability_probe',
    );
    expect(githubCopilotProbeSpy).toHaveBeenCalledTimes(1);
    expect(codexInvokeStageSpy).not.toHaveBeenCalled();
  });

  it('keeps local-only plan and review-verify capabilities available without adapter setup', async () => {
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createUnavailableProtocol(AdapterSurface.CODEX),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const availability = await runtime.resolveCapabilityAvailability(
      {
        sessionId: 'session-availability-local-001',
        routeId: 'session.main',
        turnId: 'turn-availability-local-001',
        turnIndex: 1,
        userMessage: 'recheck the review report and update the plan',
        selectedSurface: AdapterSurface.CODEX,
        selectedBy: 'session.main.default',
        sessionRoutingPreferenceApplied: false,
      },
      [
        SESSION_MAIN_CAPABILITY_ID.PLAN,
        SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
        SESSION_MAIN_CAPABILITY_ID.REVIEW,
      ],
    );

    expect(availability).toEqual([
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
        status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE,
      }),
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
        status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE,
      }),
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
        status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.SETUP_REQUIRED,
        requiresSetup: true,
        suggestedNextStep: '/connect',
      }),
    ]);
    expect(availability[0]).not.toHaveProperty('selectedSurface');
    expect(availability[1]).not.toHaveProperty('selectedSurface');
  });

  it('falls back to the next available direct-answer surface while preserving chat-only governance', async () => {
    const claudeInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.input).toEqual(
        expect.objectContaining({
          [AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY]: {
            interactionMode: AgentStageExecutionMode.CHAT_ONLY,
            toolUsePolicy: AgentStageToolUsePolicy.FORBIDDEN,
          },
        }),
      );
      return {
        output: {
          responseText: 'Fallback answer from Claude Code',
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
      [AdapterSurface.CODEX]: createUnavailableProtocol(AdapterSurface.CODEX),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(AdapterSurface.CLAUDE_CODE, 'unused', {
        invokeStageSpy: claudeInvokeStage,
      }),
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

    expect(claudeInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.assistantMessage).toBe('Fallback answer from Claude Code');
    expect(outcome.selectedSurface).toBe(AdapterSurface.CLAUDE_CODE);
    expect(outcome.selectedBy).toBe('session.main.answer.safe_fallback');
  });

  it('returns a guarded fallback answer when no eligible direct-answer surface is available', async () => {
    const publishedStreamEvents: Array<Record<string, unknown>> = [];
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
      publishStreamEvent: async (event) => {
        publishedStreamEvents.push(event as Record<string, unknown>);
      },
    });

    expect(codexInvokeStage).not.toHaveBeenCalled();
    expect(outcome.selectedSurface).toBe('guarded-direct-answer');
    expect(outcome.selectedBy).toBe('session.main.answer.guard');
    expect(outcome.assistantMessage).toContain('No eligible direct-answer surface');
    expect(outcome.executionDetailsLines).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/preflight probes finished in/u),
        'Surface probe diagnostics for this turn:',
        'codex · not eligible · unavailable-for-test',
        'claude-code · not eligible · unavailable-for-test',
      ]),
    );
    expect(publishedStreamEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'started',
          title: 'Session Main Answer',
          detail: 'The supervisor is checking available direct-answer surfaces.',
          activityKey: 'session.main.answer.preflight',
        }),
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'running',
          title: 'Session Main Answer',
          detail: 'Probing codex availability and route eligibility.',
          activityKey: 'surface-probe:session.main.answer:session.main:codex',
          selectedSurface: 'codex',
        }),
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'running',
          title: 'Session Main Answer',
          detail: 'codex is unavailable for this turn: unavailable-for-test',
          activityKey: 'surface-probe:session.main.answer:session.main:codex',
          selectedSurface: 'codex',
        }),
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'failed',
          title: 'Session Main Answer',
          detail: 'No eligible direct-answer surface passed preflight checks.',
          activityKey: 'session.main.answer.preflight',
        }),
      ]),
    );
  });

  it('continues direct-answer preflight when one surface probe throws and falls back to the next eligible surface', async () => {
    const claudeInvokeStage = vi.fn(async () => ({
      output: {
        responseText: 'Fallback answer from Claude Code',
      },
      elapsedMs: 7,
    }));
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createProbeThrowingProtocol(
        AdapterSurface.CODEX,
        'codex probe crashed',
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(AdapterSurface.CLAUDE_CODE, 'unused', {
        invokeStageSpy: claudeInvokeStage,
      }),
      [AdapterSurface.OLLAMA]: createUnavailableProtocol(AdapterSurface.OLLAMA),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig,
      adapterRoutingRuntime,
    });
    const publishedStreamEvents: Array<Record<string, unknown>> = [];
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-003-probe-throw',
      routeId: 'session.main',
      turnId: 'turn-003-probe-throw',
      turnIndex: 3,
      userMessage: 'hello',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      publishStreamEvent: async (event) => {
        publishedStreamEvents.push(event as Record<string, unknown>);
      },
    });

    expect(claudeInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.responseMode).toBe('answer');
    expect(outcome.assistantMessage).toBe('Fallback answer from Claude Code');
    expect(outcome.selectedSurface).toBe(AdapterSurface.CLAUDE_CODE);
    expect(outcome.selectedBy).toBe('session.main.answer.safe_fallback');
    expect(outcome.executionDetailsLines).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/preflight probes finished in/u),
        'Surface probe diagnostics for this turn:',
        'codex · not eligible · codex probe crashed',
      ]),
    );
    expect(publishedStreamEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'lifecycle',
          state: 'running',
          detail: 'codex probe failed for this turn: codex probe crashed',
          selectedSurface: 'codex',
        }),
      ]),
    );
  });

  it('delegates explicit @planner turns through a single-role safe fallback path', async () => {
    const plannerLaneKey =
      'session.main::stage-session-main-role-planner::planner::codex::mutation_capable';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [plannerLaneKey]: {
          laneKey: plannerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-planner',
          roleId: 'planner',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'planner-resp-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
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
      providerContinuationState,
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
    expect(outcome.invokedRoles).toEqual([
      expect.objectContaining({
        roleId: 'planner',
        roleProfileId: 'planner-default',
        dispatchBoundary: 'local_projection',
        transportKind: 'local_protocol',
      }),
    ]);
    expect(outcome.subagentCount).toBe(1);
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey: plannerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.CLEARED,
          invalidationReason: 'provider_changed',
          providerId: AdapterSurface.CODEX,
          transportKind: AgentStageContinuationTransportKind.CLI_EXEC,
          model: null,
        }),
      }),
    ]);
  });

  it('clears stale planner continuation state when acp_exec falls back to a no-tool single-role surface', async () => {
    const plannerLaneKey =
      'session.main::stage-session-main-role-planner::planner::codex::mutation_capable';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [plannerLaneKey]: {
          laneKey: plannerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-planner',
          roleId: 'planner',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'planner-acp-fallback-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
    const acpRoleDelegateAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools:
        adaptersConfig.tools?.map((tool) =>
          tool.toolId === AdapterSurface.CODEX
            ? {
                ...tool,
                transport: AdapterTransportKind.ACP_EXEC,
                remoteApi: {
                  provider: AdapterProviderKind.OPENAI,
                  vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
                  model: 'gpt-5',
                },
              }
            : tool,
        ) ?? [],
    };
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      acpRoleDelegateAdaptersConfig,
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
      adaptersConfig: acpRoleDelegateAdaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-planner-acp-fallback-001',
      routeId: 'session.main',
      turnId: 'turn-planner-acp-fallback-001',
      turnIndex: 5,
      userMessage: '@planner help me break this delivery into milestones',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      providerContinuationState,
    });

    expect(outcome.selectedSurface).toBe(AdapterSurface.OLLAMA);
    expect(outcome.selectedBy).toBe('session.main.role_delegate.safe_fallback');
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey: plannerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.UNSUPPORTED,
          invalidationReason: 'transport_not_continuation_capable',
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
        }),
      }),
    ]);
    expect(outcome.providerContinuationMutations?.[0]?.slot).toBeUndefined();
    expect(outcome.providerContinuationSummaries).toEqual([
      expect.objectContaining({
        laneKey: plannerLaneKey,
        laneLabel: 'planner',
        status: AgentStageContinuationStatus.UNSUPPORTED,
        surface: AdapterSurface.CODEX,
        providerId: AdapterProviderKind.OPENAI,
        transportKind: AgentStageContinuationTransportKind.REMOTE_API,
        model: 'gpt-5',
        invalidationReason: 'transport_not_continuation_capable',
      }),
    ]);
  });

  it('delegates explicit @reviewer turns through one governed single-role path instead of collapsing into /review', async () => {
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createAvailableProtocol(
        AdapterSurface.CODEX,
        'unsafe reviewer answer',
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'unsafe fallback answer',
      ),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(
        AdapterSurface.OLLAMA,
        '## Reviewer perspective\n\n- inspect the current diff for regression risk',
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
      sessionId: 'session-004-reviewer',
      routeId: 'session.main',
      turnId: 'turn-004-reviewer',
      turnIndex: 4,
      userMessage: '@reviewer check the current diff for regression risk',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
    });

    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('single_role_delegate');
    expect(outcome.executionIntent).toBe('session.role_delegate.reviewer');
    expect(outcome.assistantMessage).toBe('unsafe reviewer answer');
    expect(outcome.selectedSurface).toBe(AdapterSurface.CODEX);
    expect(outcome.selectedBy).toBe('session.main.role_delegate.primary');
    expect(outcome.invokedRoleIds).toEqual(['reviewer']);
    expect(outcome.invokedRoles).toEqual([
      expect.objectContaining({
        roleId: 'reviewer',
        roleProfileId: 'reviewer-default',
      }),
    ]);
    expect(outcome.subagentCount).toBe(1);
  });

  it('routes explicit @planner @reviewer turns through one serial collaboration path', async () => {
    const plannerLaneKey =
      'session.main::stage-session-main-role-planner::planner::codex::mutation_capable';
    const reviewerLaneKey =
      'session.main::stage-session-main-role-reviewer::reviewer::codex::read_only';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [plannerLaneKey]: {
          laneKey: plannerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-planner',
          roleId: 'planner',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'planner-resp-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
        [reviewerLaneKey]: {
          laneKey: reviewerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-reviewer',
          roleId: 'reviewer',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.READ_ONLY,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'reviewer-resp-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
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
      providerContinuationState,
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
    expect(outcome.invokedRoles).toEqual([
      expect.objectContaining({
        roleId: 'planner',
        roleProfileId: 'planner-default',
        dispatchBoundary: 'local_projection',
        transportKind: 'local_protocol',
      }),
      expect.objectContaining({
        roleId: 'reviewer',
        roleProfileId: 'reviewer-default',
        dispatchBoundary: 'local_projection',
        transportKind: 'local_protocol',
      }),
    ]);
    expect(outcome.subagentCount).toBe(2);
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey: plannerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.CLEARED,
          invalidationReason: 'provider_changed',
          providerId: AdapterSurface.CODEX,
          transportKind: AgentStageContinuationTransportKind.CLI_EXEC,
          model: null,
        }),
      }),
      expect.objectContaining({
        laneKey: reviewerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.CLEARED,
          invalidationReason: 'provider_changed',
          providerId: AdapterSurface.CODEX,
          transportKind: AgentStageContinuationTransportKind.CLI_EXEC,
          model: null,
        }),
      }),
    ]);
  });

  it('clears stale planner/reviewer continuation state when acp_exec falls back during serial collaboration', async () => {
    const plannerLaneKey =
      'session.main::stage-session-main-role-planner::planner::codex::mutation_capable';
    const reviewerLaneKey =
      'session.main::stage-session-main-role-reviewer::reviewer::codex::read_only';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [plannerLaneKey]: {
          laneKey: plannerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-planner',
          roleId: 'planner',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'planner-acp-serial-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
        [reviewerLaneKey]: {
          laneKey: reviewerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-reviewer',
          roleId: 'reviewer',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.READ_ONLY,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'reviewer-acp-serial-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
    const acpRoleDelegateAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools:
        adaptersConfig.tools?.map((tool) =>
          tool.toolId === AdapterSurface.CODEX
            ? {
                ...tool,
                transport: AdapterTransportKind.ACP_EXEC,
                remoteApi: {
                  provider: AdapterProviderKind.OPENAI,
                  vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
                  model: 'gpt-5',
                },
              }
            : tool,
        ) ?? [],
    };
    const serialInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      if (request.stageId === 'stage-session-main-role-planner') {
        return {
          output: {
            responseText: '## Planner perspective\n\n- milestone 1\n- milestone 2',
          },
          elapsedMs: 1,
        };
      }

      return {
        output: {
          responseText: '## Reviewer perspective\n\n- sequencing looks safe',
        },
        elapsedMs: 1,
      };
    });
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      acpRoleDelegateAdaptersConfig,
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
      adaptersConfig: acpRoleDelegateAdaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-serial-acp-fallback-001',
      routeId: 'session.main',
      turnId: 'turn-serial-acp-fallback-001',
      turnIndex: 5,
      userMessage: '@planner @reviewer collaborate on this rollout plan',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      providerContinuationState,
    });

    expect(outcome.selectedSurface).toBe('planner:ollama -> reviewer:ollama');
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey: plannerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.UNSUPPORTED,
          invalidationReason: 'transport_not_continuation_capable',
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
        }),
      }),
      expect.objectContaining({
        laneKey: reviewerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.UNSUPPORTED,
          invalidationReason: 'transport_not_continuation_capable',
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
        }),
      }),
    ]);
    expect(outcome.providerContinuationSummaries).toEqual([
      expect.objectContaining({
        laneKey: plannerLaneKey,
        laneLabel: 'planner',
        status: AgentStageContinuationStatus.UNSUPPORTED,
        surface: AdapterSurface.CODEX,
        providerId: AdapterProviderKind.OPENAI,
        transportKind: AgentStageContinuationTransportKind.REMOTE_API,
        model: 'gpt-5',
        invalidationReason: 'transport_not_continuation_capable',
      }),
      expect.objectContaining({
        laneKey: reviewerLaneKey,
        laneLabel: 'reviewer',
        status: AgentStageContinuationStatus.UNSUPPORTED,
        surface: AdapterSurface.CODEX,
        providerId: AdapterProviderKind.OPENAI,
        transportKind: AgentStageContinuationTransportKind.REMOTE_API,
        model: 'gpt-5',
        invalidationReason: 'transport_not_continuation_capable',
      }),
    ]);
  });

  it('routes implicit reviewer delegation through one single-role collaboration path for natural-language review requests', async () => {
    const publishedStreamEvents: Array<Record<string, unknown>> = [];
    const reviewerInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.stageId).toBe('stage-session-main-role-reviewer');
      expect(request.routeKey).toBe('session.main.role.reviewer');
      expect(request.input).toEqual(
        expect.objectContaining({
          userMessage: '很好,帮我 review 一下代码',
          interactionMode: 'single_role_delegate',
          roleId: 'reviewer',
          reviewScope: 'uncommitted_changes',
          governorInstructions: expect.stringContaining(
            'inspect the repository in a read-only manner',
          ),
        }),
      );
      return {
        output: {
          responseText: '## Reviewer perspective\n\n- review current worktree changes directly',
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
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unused', {
        invokeStageSpy: reviewerInvokeStage,
      }),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(AdapterSurface.CLAUDE_CODE, 'unused', {
        invokeStageSpy: reviewerInvokeStage,
      }),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused local', {
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
      sessionId: 'session-implicit-reviewer-001',
      routeId: 'session.main',
      turnId: 'turn-implicit-reviewer-001',
      turnIndex: 5,
      userMessage: '很好,帮我 review 一下代码',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      metadata: {
        [SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY]: 'reviewer',
      },
      publishStreamEvent: async (event) => {
        publishedStreamEvents.push(event as Record<string, unknown>);
      },
    });

    expect(reviewerInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('single_role_delegate');
    expect(outcome.routerDecisionReason).toBe(
      'session.main.router.single_role_delegate.implicit_role',
    );
    expect(outcome.executionIntent).toBe('session.role_delegate.reviewer');
    expect(outcome.assistantMessage).toContain('Reviewer perspective');
    expect(outcome.invokedRoleIds).toEqual(['reviewer']);
    const preflightStartedIndex = publishedStreamEvents.findIndex(
      (event) =>
        event.state === 'started' &&
        event.activityKey === 'role-preflight:session.main.role.reviewer:reviewer',
    );
    const probeStartedIndex = publishedStreamEvents.findIndex(
      (event) =>
        event.state === 'running' &&
        event.activityKey === 'surface-probe:session.main.role.reviewer:reviewer:codex' &&
        event.detail === 'Probing codex availability and route eligibility.',
    );
    const preflightCompletedIndex = publishedStreamEvents.findIndex(
      (event) =>
        event.state === 'completed' &&
        event.activityKey === 'role-preflight:session.main.role.reviewer:reviewer',
    );
    const dispatchStartedIndex = publishedStreamEvents.findIndex(
      (event) =>
        event.state === 'started' &&
        event.roleId === 'reviewer' &&
        event.stageId === 'stage-session-main-role-reviewer' &&
        event.detail === 'Dispatching the reviewer role.',
    );
    expect(preflightStartedIndex).toBeGreaterThanOrEqual(0);
    expect(probeStartedIndex).toBeGreaterThan(preflightStartedIndex);
    expect(preflightCompletedIndex).toBeGreaterThan(probeStartedIndex);
    expect(dispatchStartedIndex).toBeGreaterThan(preflightCompletedIndex);
  });

  it('keeps repository-review reviewer delegation dispatchable when an available fallback surface omits tool capability metadata', async () => {
    const reviewerInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.stageId).toBe('stage-session-main-role-reviewer');
      expect(request.routeKey).toBe('session.main.role.reviewer');
      expect(request.input).toEqual(
        expect.objectContaining({
          userMessage: '帮我 review 一下代码',
          roleId: 'reviewer',
          reviewScope: 'uncommitted_changes',
        }),
      );
      return {
        output: {
          responseText: '## Reviewer fallback\n\n- review current worktree changes directly',
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
      [AdapterSurface.CODEX]: createUnavailableProtocol(AdapterSurface.CODEX),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(AdapterSurface.CLAUDE_CODE, 'unused', {
        omittedCapabilities: [AgentCapability.TOOL_CALLING],
        invokeStageSpy: reviewerInvokeStage,
      }),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused local', {
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
      sessionId: 'session-implicit-reviewer-fallback-001',
      routeId: 'session.main',
      turnId: 'turn-implicit-reviewer-fallback-001',
      turnIndex: 6,
      userMessage: '帮我 review 一下代码',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      metadata: {
        [SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY]: 'reviewer',
      },
    });

    expect(reviewerInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.selectedSurface).toBe(AdapterSurface.CLAUDE_CODE);
    expect(outcome.selectedBy).toContain('session.main.role_delegate.safe_fallback');
    expect(outcome.assistantMessage).toContain('Reviewer fallback');
    expect(outcome.invokedRoleIds).toEqual(['reviewer']);
  });

  it('keeps repository-review reviewer delegation dispatchable when the primary probe throws before fallback recovery', async () => {
    const reviewerInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      expect(request.stageId).toBe('stage-session-main-role-reviewer');
      expect(request.routeKey).toBe('session.main.role.reviewer');
      return {
        output: {
          responseText:
            '## Reviewer fallback after probe error\n\n- review current worktree changes directly',
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
      [AdapterSurface.CODEX]: createProbeThrowingProtocol(
        AdapterSurface.CODEX,
        'codex reviewer probe crashed',
      ),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(AdapterSurface.CLAUDE_CODE, 'unused', {
        invokeStageSpy: reviewerInvokeStage,
      }),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused local', {
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
      sessionId: 'session-implicit-reviewer-probe-throw-001',
      routeId: 'session.main',
      turnId: 'turn-implicit-reviewer-probe-throw-001',
      turnIndex: 7,
      userMessage: '帮我 review 一下代码',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      metadata: {
        [SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY]: 'reviewer',
      },
    });

    expect(reviewerInvokeStage).toHaveBeenCalledTimes(1);
    expect(outcome.selectedSurface).toBe(AdapterSurface.CLAUDE_CODE);
    expect(outcome.selectedBy).toContain('session.main.role_delegate.safe_fallback');
    expect(outcome.assistantMessage).toContain('Reviewer fallback after probe error');
    expect(outcome.invokedRoleIds).toEqual(['reviewer']);
  });

  it('guards repository-review reviewer delegation when only local-model fallback remains', async () => {
    const reviewerLaneKey =
      'session.main::stage-session-main-role-reviewer::reviewer::codex::read_only';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [reviewerLaneKey]: {
          laneKey: reviewerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-reviewer',
          roleId: 'reviewer',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.READ_ONLY,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'reviewer-resp-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
    const localReviewInvokeStage = vi.fn(async () => ({
      output: {
        responseText: 'unsafe local reviewer answer',
      },
      elapsedMs: 1,
    }));
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createUnavailableProtocol(AdapterSurface.CODEX),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused local', {
        invokeStageSpy: localReviewInvokeStage,
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
      sessionId: 'session-implicit-reviewer-local-guard-001',
      routeId: 'session.main',
      turnId: 'turn-implicit-reviewer-local-guard-001',
      turnIndex: 7,
      userMessage: '帮我 review 一下代码',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      metadata: {
        [SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY]: 'reviewer',
      },
      providerContinuationState,
    });

    expect(localReviewInvokeStage).not.toHaveBeenCalled();
    expect(outcome.responseMode).toBe('role_collaboration');
    expect(outcome.interactionMode).toBe('single_role_delegate');
    expect(outcome.routerDecisionReason).toBe('session.main.router.single_role_delegate.guard');
    expect(outcome.selectedSurface).toBe('guarded-role-delegate');
    expect(outcome.selectedBy).toBe('session.main.role_delegate.guard');
    expect(outcome.assistantMessage).toContain('repository-review preflight checks');
    expect(outcome.invokedRoleIds).toEqual([]);
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey: reviewerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.CLEARED,
          invalidationReason: 'provider_changed',
          providerId: AdapterSurface.CODEX,
          transportKind: AgentStageContinuationTransportKind.CLI_EXEC,
          model: null,
        }),
      }),
    ]);
  });

  it('clears stale reviewer continuation state when repository-review guard rejects acp_exec preferred surfaces', async () => {
    const reviewerLaneKey =
      'session.main::stage-session-main-role-reviewer::reviewer::codex::read_only';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [reviewerLaneKey]: {
          laneKey: reviewerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-reviewer',
          roleId: 'reviewer',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.READ_ONLY,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'reviewer-acp-guard-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
    const acpRoleDelegateAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools:
        adaptersConfig.tools?.map((tool) =>
          tool.toolId === AdapterSurface.CODEX
            ? {
                ...tool,
                transport: AdapterTransportKind.ACP_EXEC,
                remoteApi: {
                  provider: AdapterProviderKind.OPENAI,
                  vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
                  model: 'gpt-5',
                },
              }
            : tool,
        ) ?? [],
    };
    const localReviewInvokeStage = vi.fn(async () => ({
      output: {
        responseText: 'unsafe local reviewer answer',
      },
      elapsedMs: 1,
    }));
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      acpRoleDelegateAdaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
    };
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: createUnavailableProtocol(AdapterSurface.CODEX),
      [AdapterSurface.CLAUDE_CODE]: createUnavailableProtocol(AdapterSurface.CLAUDE_CODE),
      [AdapterSurface.OLLAMA]: createAvailableProtocol(AdapterSurface.OLLAMA, 'unused local', {
        invokeStageSpy: localReviewInvokeStage,
        toolCallingSupportLevel: AgentCapabilitySupportLevel.UNSUPPORTED,
      }),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
      workspace,
      locale: 'en-US',
      adaptersConfig: acpRoleDelegateAdaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-implicit-reviewer-acp-guard-001',
      routeId: 'session.main',
      turnId: 'turn-implicit-reviewer-acp-guard-001',
      turnIndex: 8,
      userMessage: '帮我 review 一下代码',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      metadata: {
        [SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY]: 'reviewer',
      },
      providerContinuationState,
    });

    expect(localReviewInvokeStage).not.toHaveBeenCalled();
    expect(outcome.selectedSurface).toBe('guarded-role-delegate');
    expect(outcome.selectedBy).toBe('session.main.role_delegate.guard');
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey: reviewerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.UNSUPPORTED,
          invalidationReason: 'transport_not_continuation_capable',
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
        }),
      }),
    ]);
    expect(outcome.providerContinuationSummaries).toEqual([
      expect.objectContaining({
        laneKey: reviewerLaneKey,
        laneLabel: 'reviewer',
        status: AgentStageContinuationStatus.UNSUPPORTED,
        surface: AdapterSurface.CODEX,
        providerId: AdapterProviderKind.OPENAI,
        transportKind: AgentStageContinuationTransportKind.REMOTE_API,
        model: 'gpt-5',
        invalidationReason: 'transport_not_continuation_capable',
      }),
    ]);
  });

  it('routes explicit @planner @reviewer parallel requests through one parallel fan-out path', async () => {
    const plannerLaneKey =
      'session.main::stage-session-main-role-planner::planner::codex::mutation_capable';
    const reviewerLaneKey =
      'session.main::stage-session-main-role-reviewer::reviewer::codex::read_only';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [plannerLaneKey]: {
          laneKey: plannerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-planner',
          roleId: 'planner',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'planner-resp-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
        [reviewerLaneKey]: {
          laneKey: reviewerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-reviewer',
          roleId: 'reviewer',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.READ_ONLY,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'reviewer-resp-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
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
      providerContinuationState,
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
    expect(outcome.invokedRoles).toEqual([
      expect.objectContaining({
        roleId: 'planner',
        roleProfileId: 'planner-default',
        dispatchBoundary: 'local_projection',
        transportKind: 'local_protocol',
      }),
      expect.objectContaining({
        roleId: 'reviewer',
        roleProfileId: 'reviewer-default',
        dispatchBoundary: 'local_projection',
        transportKind: 'local_protocol',
      }),
    ]);
    expect(outcome.subagentCount).toBe(2);
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey: plannerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.CLEARED,
          invalidationReason: 'provider_changed',
          providerId: AdapterSurface.CODEX,
          transportKind: AgentStageContinuationTransportKind.CLI_EXEC,
          model: null,
        }),
      }),
      expect.objectContaining({
        laneKey: reviewerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.CLEARED,
          invalidationReason: 'provider_changed',
          providerId: AdapterSurface.CODEX,
          transportKind: AgentStageContinuationTransportKind.CLI_EXEC,
          model: null,
        }),
      }),
    ]);
  });

  it('clears stale planner/reviewer continuation state when acp_exec falls back during parallel collaboration', async () => {
    const plannerLaneKey =
      'session.main::stage-session-main-role-planner::planner::codex::mutation_capable';
    const reviewerLaneKey =
      'session.main::stage-session-main-role-reviewer::reviewer::codex::read_only';
    const providerContinuationState: SessionProviderContinuationSessionState = {
      version: 1,
      slots: {
        [plannerLaneKey]: {
          laneKey: plannerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-planner',
          roleId: 'planner',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'planner-acp-parallel-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
        [reviewerLaneKey]: {
          laneKey: reviewerLaneKey,
          routeId: 'session.main',
          stageId: 'stage-session-main-role-reviewer',
          roleId: 'reviewer',
          selectedSurface: AdapterSurface.CODEX,
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.READ_ONLY,
          workspaceRoot: '/workspace/repo/.repo-ai-governor',
          currentWorkingDirectory: '/workspace/repo',
          handle: {
            providerId: AdapterProviderKind.OPENAI,
            surface: AdapterSurface.CODEX,
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
            value: 'reviewer-acp-parallel-existing',
            model: 'gpt-5',
            acquiredAt: '2026-04-04T12:00:00.000Z',
          },
          updatedAt: '2026-04-04T12:00:00.000Z',
        },
      },
    };
    const acpRoleDelegateAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools:
        adaptersConfig.tools?.map((tool) =>
          tool.toolId === AdapterSurface.CODEX
            ? {
                ...tool,
                transport: AdapterTransportKind.ACP_EXEC,
                remoteApi: {
                  provider: AdapterProviderKind.OPENAI,
                  vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
                  model: 'gpt-5',
                },
              }
            : tool,
        ) ?? [],
    };
    const parallelInvokeStage = vi.fn(async (request: Record<string, unknown>) => {
      if (request.stageId === 'stage-session-main-role-planner') {
        return {
          output: {
            responseText: '## Planner perspective\n\n- planning risk',
          },
          elapsedMs: 1,
        };
      }

      return {
        output: {
          responseText: '## Reviewer perspective\n\n- review risk',
        },
        elapsedMs: 1,
      };
    });
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      acpRoleDelegateAdaptersConfig,
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
      adaptersConfig: acpRoleDelegateAdaptersConfig,
      adapterRoutingRuntime,
    });
    const outcome = await runtime.resolveTurn({
      sessionId: 'session-parallel-acp-fallback-001',
      routeId: 'session.main',
      turnId: 'turn-parallel-acp-fallback-001',
      turnIndex: 6,
      userMessage: '@planner @reviewer parallel assess this rollout risk',
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.default',
      sessionRoutingPreferenceApplied: false,
      providerContinuationState,
    });

    expect(outcome.selectedSurface).toBe('planner:ollama | reviewer:ollama');
    expect(outcome.providerContinuationMutations).toEqual([
      expect.objectContaining({
        laneKey: plannerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.UNSUPPORTED,
          invalidationReason: 'transport_not_continuation_capable',
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
        }),
      }),
      expect.objectContaining({
        laneKey: reviewerLaneKey,
        summary: expect.objectContaining({
          status: AgentStageContinuationStatus.UNSUPPORTED,
          invalidationReason: 'transport_not_continuation_capable',
          providerId: AdapterProviderKind.OPENAI,
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
        }),
      }),
    ]);
    expect(outcome.providerContinuationSummaries).toEqual([
      expect.objectContaining({
        laneKey: plannerLaneKey,
        laneLabel: 'planner',
        status: AgentStageContinuationStatus.UNSUPPORTED,
        surface: AdapterSurface.CODEX,
        providerId: AdapterProviderKind.OPENAI,
        transportKind: AgentStageContinuationTransportKind.REMOTE_API,
        model: 'gpt-5',
        invalidationReason: 'transport_not_continuation_capable',
      }),
      expect.objectContaining({
        laneKey: reviewerLaneKey,
        laneLabel: 'reviewer',
        status: AgentStageContinuationStatus.UNSUPPORTED,
        surface: AdapterSurface.CODEX,
        providerId: AdapterProviderKind.OPENAI,
        transportKind: AgentStageContinuationTransportKind.REMOTE_API,
        model: 'gpt-5',
        invalidationReason: 'transport_not_continuation_capable',
      }),
    ]);
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
    expect(outcome.invokedRoles).toEqual([
      expect.objectContaining({
        roleId: 'architect',
        roleProfileId: 'architect-default',
        dispatchBoundary: 'local_projection',
        transportKind: 'local_protocol',
      }),
      expect.objectContaining({
        roleId: 'reviewer',
        roleProfileId: 'reviewer-default',
        dispatchBoundary: 'local_projection',
        transportKind: 'local_protocol',
      }),
      expect.objectContaining({
        roleId: 'verifier',
        roleProfileId: 'verifier-default',
        dispatchBoundary: 'local_projection',
        transportKind: 'local_protocol',
      }),
    ]);
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
