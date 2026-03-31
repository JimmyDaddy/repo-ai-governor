import {
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCapabilitySupportLevel,
  type AgentProtocolContract,
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig } from '@repo-ai-governor/config';
import { AdapterAvailability, AdapterSurface, LocalModelProvider } from '@repo-ai-governor/shared';
import { CliAdapterRoutingRuntime } from '../../src/runtime/adapter-routing-runtime.js';
import { CliSessionMainSupervisorRuntime } from '../../src/runtime/session-main-supervisor-runtime.js';

function createAvailableProtocol(
  surface: AdapterSurface,
  responseText: string,
  options: {
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
            capability === AgentCapability.TOOL_CALLING
              ? toolCallingSupportLevel
              : AgentCapabilitySupportLevel.SUPPORTED,
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
    roles: [],
    routing: {
      roleBindings: {},
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

  it('falls back to the next safe no-tool surface when the preferred surface is tool-capable', async () => {
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

    expect(outcome.assistantMessage).toBe('Fallback answer from local model');
    expect(outcome.selectedSurface).toBe(AdapterSurface.OLLAMA);
    expect(outcome.selectedBy).toBe('session.main.answer.safe_fallback');
  });

  it('returns a governed fallback answer and does not invoke tool-capable adapters when no safe surface is active', async () => {
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
      [AdapterSurface.CODEX]: createAvailableProtocol(AdapterSurface.CODEX, 'unsafe codex answer', {
        invokeStageSpy: codexInvokeStage,
      }),
      [AdapterSurface.CLAUDE_CODE]: createAvailableProtocol(
        AdapterSurface.CLAUDE_CODE,
        'unsafe claude answer',
      ),
    });

    const runtime = new CliSessionMainSupervisorRuntime({
      workspaceRoot: '/workspace/repo/.repo-ai-governor',
      currentWorkingDirectory: '/workspace/repo',
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
    expect(outcome.assistantMessage).toContain('restricted to no-tool surfaces');
  });
});
