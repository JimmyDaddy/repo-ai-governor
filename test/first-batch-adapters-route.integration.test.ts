import {
  ClaudeCodeAgentAdapter,
  ClaudeCodeAgentAdapterExecutionMode,
  type ClaudeCodeExecRunner,
} from "@repo-ai-governor/adapter-claude-code";
import {
  CodexAgentAdapter,
  CodexAgentAdapterExecutionMode,
  type CodexExecRunner,
} from "@repo-ai-governor/adapter-codex";
import {
  GithubCopilotAgentAdapter,
  GithubCopilotAgentAdapterExecutionMode,
  type GithubCopilotExecRunner,
} from "@repo-ai-governor/adapter-github-copilot";
import {
  AGENT_LOCAL_FALLBACK_SURFACE,
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCapabilityFallbackAction,
  AgentCliExecOperation,
  AgentNetworkMode,
  AgentRouteRunner,
  AgentRouteSelectionSource,
  AgentSurfaceNetworkRequirement,
  AgentSurfaceSkipReason,
} from "@repo-ai-governor/adapter-sdk";
import { GovernorErrorCode } from "@repo-ai-governor/shared";

function createCodexExecRunnerFixture(): CodexExecRunner {
  return async ({ prompt, operation }) => ({
    stdout: [
      '{"type":"thread.started","thread_id":"thread-1"}',
      `{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"${operation === AgentCliExecOperation.PROBE || prompt.includes("Respond with exactly OK.") ? "OK" : "simulated codex response"}"}}`,
      '{"type":"turn.completed","usage":{"input_tokens":13,"output_tokens":8}}',
    ].join("\n"),
    stderr: "",
    exitCode: 0,
    signal: null,
    elapsedMs: 8,
  });
}

function createGithubCopilotExecRunnerFixture(): GithubCopilotExecRunner {
  return async ({ prompt, operation }) => ({
    stdout:
      operation === AgentCliExecOperation.PROBE || prompt.includes("Respond with exactly OK.")
        ? [
            '{"type":"assistant.message","data":{"content":"OK"}}',
            '{"type":"result","exitCode":0}',
          ].join("\n")
        : [
            '{"type":"assistant.message","data":{"content":"simulated github copilot response"}}',
            '{"type":"result","exitCode":0}',
          ].join("\n"),
    stderr: "",
    exitCode: 0,
    signal: null,
    elapsedMs: 8,
  });
}

function createClaudeCodeExecRunnerFixture(): ClaudeCodeExecRunner {
  return async ({ prompt, operation }) => ({
    stdout:
      operation === AgentCliExecOperation.PROBE || prompt.includes("Respond with exactly OK.")
        ? "OK\n"
        : "simulated claude code response\n",
    stderr: "",
    exitCode: 0,
    signal: null,
    elapsedMs: 8,
  });
}

describe("first-batch adapters route integration", () => {
  it("selects Codex as primary surface when available", async () => {
    const runner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: "codegen",
          primarySurface: "codex",
          fallbackSurfaces: ["github-copilot", "claude-code"],
          capabilityRequirement: {
            requiredCapabilities: [AgentCapability.TOOL_CALLING],
          },
        },
      ],
      protocolBySurface: {
        codex: new CodexAgentAdapter({
          executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createCodexExecRunnerFixture(),
        }),
        "github-copilot": new GithubCopilotAgentAdapter({
          executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createGithubCopilotExecRunnerFixture(),
        }),
        "claude-code": new ClaudeCodeAgentAdapter({
          executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createClaudeCodeExecRunnerFixture(),
        }),
      },
    });

    const result = await runner.dispatchStage({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "codegen",
      input: {
        prompt: "implement feature",
      },
    });

    expect(result.selectedSurface).toBe("codex");
    expect(result.auditRecord.selectedBy).toBe(AgentRouteSelectionSource.PRIMARY);
  });

  it("falls back to GitHub Copilot when Codex is unavailable", async () => {
    const runner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: "codegen",
          primarySurface: "codex",
          fallbackSurfaces: ["github-copilot", "claude-code"],
        },
      ],
      protocolBySurface: {
        codex: new CodexAgentAdapter({
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ["surface unavailable"],
          executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createCodexExecRunnerFixture(),
        }),
        "github-copilot": new GithubCopilotAgentAdapter({
          executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createGithubCopilotExecRunnerFixture(),
        }),
        "claude-code": new ClaudeCodeAgentAdapter({
          executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createClaudeCodeExecRunnerFixture(),
        }),
      },
    });

    const result = await runner.dispatchStage({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "codegen",
      input: {
        prompt: "implement feature",
      },
    });

    expect(result.selectedSurface).toBe("github-copilot");
    expect(result.auditRecord.selectedBy).toBe(AgentRouteSelectionSource.FALLBACK);
  });

  it("fails closed when all structured-output fallbacks are degraded", async () => {
    const runner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: "spec-review",
          primarySurface: "codex",
          fallbackSurfaces: ["github-copilot", "claude-code"],
          capabilityRequirement: {
            requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
            fallbackRules: [
              {
                capability: AgentCapability.STRUCTURED_OUTPUT,
                onUnsupported: AgentCapabilityFallbackAction.USE_FALLBACK_SURFACE,
                onDegraded: AgentCapabilityFallbackAction.USE_FALLBACK_SURFACE,
              },
            ],
          },
        },
      ],
      protocolBySurface: {
        codex: new CodexAgentAdapter({
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ["surface unavailable"],
          executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createCodexExecRunnerFixture(),
        }),
        "github-copilot": new GithubCopilotAgentAdapter({
          executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createGithubCopilotExecRunnerFixture(),
        }),
        "claude-code": new ClaudeCodeAgentAdapter({
          executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createClaudeCodeExecRunnerFixture(),
        }),
      },
    });

    await expect(
      runner.dispatchStage({
        processId: "process-1",
        executionId: "execution-1",
        stageId: "stage-1",
        routeKey: "spec-review",
        input: {
          prompt: "review plan with structured output",
        },
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
      details: expect.objectContaining({
        requiredFallbackActions: expect.arrayContaining([
          AgentCapabilityFallbackAction.USE_FALLBACK_SURFACE,
        ]),
      }),
    });
  });

  it("uses local fallback when restricted network blocks external adapters", async () => {
    const runner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: "restricted-review",
          primarySurface: "codex",
          fallbackSurfaces: ["github-copilot", "claude-code"],
        },
      ],
      protocolBySurface: {
        codex: new CodexAgentAdapter({
          executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createCodexExecRunnerFixture(),
        }),
        "github-copilot": new GithubCopilotAgentAdapter({
          executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createGithubCopilotExecRunnerFixture(),
        }),
        "claude-code": new ClaudeCodeAgentAdapter({
          executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
          execRunner: createClaudeCodeExecRunnerFixture(),
        }),
      },
      surfaceNetworkRequirementBySurface: {
        codex: AgentSurfaceNetworkRequirement.EXTERNAL_NETWORK,
        "github-copilot": AgentSurfaceNetworkRequirement.EXTERNAL_NETWORK,
        "claude-code": AgentSurfaceNetworkRequirement.EXTERNAL_NETWORK,
      },
    });

    const result = await runner.dispatchStage({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-restricted",
      routeKey: "restricted-review",
      input: {
        prompt: "review plan under restricted network",
      },
      runtimeContext: {
        networkMode: AgentNetworkMode.RESTRICTED,
        restrictedReason: "offline-ci",
      },
    });

    expect(result.selectedSurface).toBe(AGENT_LOCAL_FALLBACK_SURFACE);
    expect(result.auditRecord.selectedBy).toBe(AgentRouteSelectionSource.LOCAL_FALLBACK);
    expect(result.auditRecord.restrictedReason).toBe("offline-ci");
    for (const evaluatedSurface of result.auditRecord.evaluatedSurfaces) {
      expect(evaluatedSurface.skippedReason).toBe(AgentSurfaceSkipReason.NETWORK_RESTRICTED);
    }
  });
});
