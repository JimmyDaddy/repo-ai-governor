import {
  AgentCancellationReason,
  AgentCancellationScope,
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentCliExecOperation,
  AgentConfirmationDecision,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from "@repo-ai-governor/adapter-sdk";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  ClaudeCodeAgentAdapter,
  ClaudeCodeAgentAdapterExecutionMode,
  type ClaudeCodeExecRunner,
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

describe("claude-code-agent-adapter smoke", () => {
  const createClaudeCodeExecRunner = (responseText = "OK"): ClaudeCodeExecRunner => {
    return async ({ prompt, operation }) => ({
      stdout:
        operation === AgentCliExecOperation.PROBE || prompt.includes("Respond with exactly OK.")
          ? "OK\n"
          : `${responseText}\n`,
      stderr: "",
      exitCode: 0,
      signal: null,
      elapsedMs: 11,
    });
  };

  it("returns Claude Code capability matrix via probe", async () => {
    const adapter = new ClaudeCodeAgentAdapter();

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });
    const parallelTaskCapability = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.PARALLEL_TASK,
    );

    expect(probeResult.identity.surface).toBe("claude-code");
    expect(probeResult.capabilityMatrix.capabilityStates).toHaveLength(
      Object.values(AgentCapability).length,
    );
    expect(parallelTaskCapability?.supportLevel).toBe(AgentCapabilitySupportLevel.DEGRADED);
  });

  it("returns truthful capability matrix in cli_exec mode", async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createClaudeCodeExecRunner(),
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
    const structuredOutput = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.STRUCTURED_OUTPUT,
    );

    expect(probeResult.availabilityStatus).toBe("available");
    expect(structuredOutput?.supportLevel).toBe(AgentCapabilitySupportLevel.DEGRADED);
    expect(confirmationGate?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(cancellation?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(probeResult.capabilityMatrix.cancellation.supportsCancel).toBe(false);
  });

  it("returns normalized invocation output shape", async () => {
    const adapter = new ClaudeCodeAgentAdapter();
    const invokeResult = await adapter.invokeStage({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "codegen",
      input: {
        prompt: "implement feature",
      },
    });

    expect(invokeResult.output.adapterSurface).toBe("claude-code");
    expect(invokeResult.output.routeKey).toBe("codegen");
  });

  it("returns normalized invocation output in cli_exec mode", async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createClaudeCodeExecRunner("simulated claude code response"),
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

    expect(invokeResult.output.adapterSurface).toBe("claude-code");
    expect(invokeResult.output.responseText).toContain("simulated claude code response");
  });

  it("degrades confirmation/cancel semantics in cli_exec mode", async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createClaudeCodeExecRunner(),
    });

    const confirmationResult = await adapter.requestConfirmation({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "codegen",
      prompt: "confirm",
    });
    const cancelResult = await adapter.cancel({
      processId: "process-1",
      executionId: "execution-1",
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    expect(confirmationResult.decision).toBe(AgentConfirmationDecision.REVISE);
    expect(cancelResult.acknowledged).toBe(false);
  });

  it("maps credential failures into unavailable probe reasons", async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          "Claude Code probe failed: login required",
          {
            surface: "claude-code",
            operation: AgentCliExecOperation.PROBE,
            stderr: "Authentication required. Run `claude auth login` first.",
          },
        );
      },
    });

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });

    expect(probeResult.availabilityStatus).toBe("unavailable");
    expect(probeResult.unavailableReasons).toContain("credential_missing:claude-code");
  });

  it("treats non-zero process exit as protocol failure even when stdout is present", async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => ({
        stdout: "partial response\n",
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

  it("falls back from claude to claude-code when the primary binary is missing", async () => {
    const execRunner = vi.fn<ClaudeCodeExecRunner>(async (request) => {
      if (request.command === "claude") {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          "spawn claude ENOENT",
          {
            stderr: "spawn claude ENOENT",
          },
        );
      }

      return {
        stdout: "OK\n",
        stderr: "",
        exitCode: 0,
        signal: null,
        elapsedMs: 5,
      };
    });
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });

    expect(probeResult.availabilityStatus).toBe("available");
    expect(execRunner).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        command: "claude",
      }),
    );
    expect(execRunner).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        command: "claude-code",
      }),
    );
  });

  it("streams status and completed events", async () => {
    const adapter = new ClaudeCodeAgentAdapter();
    const events = [];

    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
    }

    expect(events).toEqual([AgentStreamEventType.STATUS, AgentStreamEventType.COMPLETED]);
  });
});
