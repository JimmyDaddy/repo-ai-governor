import { ClaudeCodeAgentAdapter } from "@repo-ai-governor/adapter-claude-code";
import { CodexAgentAdapter } from "@repo-ai-governor/adapter-codex";
import { GithubCopilotAgentAdapter } from "@repo-ai-governor/adapter-github-copilot";
import {
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCapabilityFallbackAction,
  AgentRouteRunner,
  AgentRouteSelectionSource,
} from "@repo-ai-governor/adapter-sdk";

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
        codex: new CodexAgentAdapter(),
        "github-copilot": new GithubCopilotAgentAdapter(),
        "claude-code": new ClaudeCodeAgentAdapter(),
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
        }),
        "github-copilot": new GithubCopilotAgentAdapter(),
        "claude-code": new ClaudeCodeAgentAdapter(),
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

  it("falls through degraded Copilot capability and selects Claude Code", async () => {
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
        }),
        "github-copilot": new GithubCopilotAgentAdapter(),
        "claude-code": new ClaudeCodeAgentAdapter(),
      },
    });

    const result = await runner.dispatchStage({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "spec-review",
      input: {
        prompt: "review plan with structured output",
      },
    });

    expect(result.selectedSurface).toBe("claude-code");
    expect(result.auditRecord.selectedBy).toBe(AgentRouteSelectionSource.FALLBACK);
    expect(result.auditRecord.requiredFallbackActions).toContain(
      AgentCapabilityFallbackAction.USE_FALLBACK_SURFACE,
    );
  });
});
