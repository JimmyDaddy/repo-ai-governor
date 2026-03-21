import {
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from "@repo-ai-governor/adapter-sdk";
import { ClaudeCodeAgentAdapter } from "../src/index.js";

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

  it("streams status and completed events", async () => {
    const adapter = new ClaudeCodeAgentAdapter();
    const events = [];

    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
    }

    expect(events).toEqual([AgentStreamEventType.STATUS, AgentStreamEventType.COMPLETED]);
  });
});
