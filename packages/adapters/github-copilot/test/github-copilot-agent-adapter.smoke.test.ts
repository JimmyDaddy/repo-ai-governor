import {
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentCliExecOperation,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from "@repo-ai-governor/adapter-sdk";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  GithubCopilotAgentAdapter,
  GithubCopilotAgentAdapterExecutionMode,
  type GithubCopilotExecRunner,
} from "../src/index.js";

function createStreamRequest(): AgentStreamEventsRequest {
  return {
    processId: "process-1",
    executionId: "execution-1",
    stageId: "stage-1",
    routeKey: "codegen",
    input: {
      prompt: "implement feature",
    },
  };
}

describe("github-copilot-agent-adapter smoke", () => {
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
      elapsedMs: 7,
    });
  }

  it("returns GitHub Copilot capability matrix via probe", async () => {
    const adapter = new GithubCopilotAgentAdapter();

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });
    const structuredOutput = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.STRUCTURED_OUTPUT,
    );

    expect(probeResult.identity.surface).toBe("github-copilot");
    expect(probeResult.capabilityMatrix.capabilityStates).toHaveLength(
      Object.values(AgentCapability).length,
    );
    expect(structuredOutput?.supportLevel).toBe(AgentCapabilitySupportLevel.DEGRADED);
  });

  it("returns truthful capability matrix in cli_exec mode", async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createGithubCopilotExecRunnerFixture(),
    });

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });
    const confirmationGate = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.CONFIRMATION_GATE,
    );
    const cancellation = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.CANCELLATION,
    );

    expect(confirmationGate?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(cancellation?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(probeResult.capabilityMatrix.cancellation.supportsCancel).toBe(false);
  });

  it("returns normalized invocation output shape", async () => {
    const adapter = new GithubCopilotAgentAdapter();
    const invokeResult = await adapter.invokeStage({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "codegen",
      input: {
        prompt: "implement feature",
      },
    });

    expect(invokeResult.output.adapterSurface).toBe("github-copilot");
    expect(invokeResult.output.routeKey).toBe("codegen");
  });

  it("returns normalized invocation output in cli_exec mode", async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createGithubCopilotExecRunnerFixture(),
    });
    const invokeResult = await adapter.invokeStage({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "codegen",
      input: {
        prompt: "implement feature",
      },
    });

    expect(invokeResult.output.adapterSurface).toBe("github-copilot");
    expect(invokeResult.output.responseText).toContain("simulated github copilot response");
  });

  it("treats non-zero process exit as protocol failure even when assistant output is present", async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => ({
        stdout: '{"type":"assistant.message","data":{"content":"partial response"}}',
        stderr: "process failed",
        exitCode: 1,
        signal: null,
        elapsedMs: 6,
      }),
    });

    await expect(
      adapter.invokeStage({
        processId: "process-1",
        executionId: "execution-1",
        stageId: "stage-1",
        routeKey: "codegen",
        input: {
          prompt: "implement feature",
        },
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
    });
  });

  it("treats non-zero JSON result exit code as protocol failure", async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => ({
        stdout: [
          '{"type":"assistant.message","data":{"content":"partial response"}}',
          '{"type":"result","exitCode":2}',
        ].join("\n"),
        stderr: "result failed",
        exitCode: 0,
        signal: null,
        elapsedMs: 6,
      }),
    });

    await expect(
      adapter.invokeStage({
        processId: "process-1",
        executionId: "execution-1",
        stageId: "stage-1",
        routeKey: "codegen",
        input: {
          prompt: "implement feature",
        },
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
    });
  });

  it("maps credential failures into unavailable probe reasons", async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          "GitHub Copilot probe failed: login required",
          {
            surface: "github-copilot",
            operation: AgentCliExecOperation.PROBE,
            stderr: "Authentication required. Run `gh auth login` first.",
          },
        );
      },
    });

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });

    expect(probeResult.availabilityStatus).toBe("unavailable");
    expect(probeResult.unavailableReasons).toContain("credential_missing:github-copilot");
  });

  it("retries transient cli_exec probe failures before surfacing availability", async () => {
    const execRunner = vi
      .fn<GithubCopilotExecRunner>()
      .mockRejectedValueOnce(
        new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          "GitHub Copilot probe failed: rate limited",
          {
            stderr: "429 rate limit exceeded",
          },
        ),
      )
      .mockResolvedValueOnce({
        stdout: [
          '{"type":"assistant.message","data":{"content":"OK"}}',
          '{"type":"result","exitCode":0}',
        ].join("\n"),
        stderr: "",
        exitCode: 0,
        signal: null,
        elapsedMs: 4,
      });
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });

    expect(probeResult.availabilityStatus).toBe("available");
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it("falls back from direct copilot command to gh wrapper when direct binary is missing", async () => {
    const execRunner = vi.fn<GithubCopilotExecRunner>(async (request) => {
      if (request.command === "copilot") {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          "spawn copilot ENOENT",
          {
            stderr: "spawn copilot ENOENT",
          },
        );
      }

      return {
        stdout: [
          '{"type":"assistant.message","data":{"content":"OK"}}',
          '{"type":"result","exitCode":0}',
        ].join("\n"),
        stderr: "",
        exitCode: 0,
        signal: null,
        elapsedMs: 5,
      };
    });
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });

    expect(probeResult.availabilityStatus).toBe("available");
    expect(execRunner).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        command: "copilot",
        commandArgumentsPrefix: [],
      }),
    );
    expect(execRunner).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        command: "gh",
        commandArgumentsPrefix: ["copilot", "--"],
      }),
    );
  });

  it("streams status and completed events", async () => {
    const adapter = new GithubCopilotAgentAdapter();
    const events = [];

    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
    }

    expect(events).toEqual([AgentStreamEventType.STATUS, AgentStreamEventType.COMPLETED]);
  });
});
