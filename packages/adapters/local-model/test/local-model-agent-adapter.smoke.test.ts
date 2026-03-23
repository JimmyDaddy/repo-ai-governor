import {
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from "@repo-ai-governor/adapter-sdk";
import { LocalModelAgentAdapter } from "../src/index.js";

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

describe("local-model-agent-adapter smoke", () => {
  it("returns local-model capability matrix via probe", async () => {
    const adapter = new LocalModelAgentAdapter();

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });
    const parallelTaskCapability = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.PARALLEL_TASK,
    );

    expect(probeResult.identity.surface).toBe("ollama");
    expect(probeResult.capabilityMatrix.capabilityStates).toHaveLength(
      Object.values(AgentCapability).length,
    );
    expect(parallelTaskCapability?.supportLevel).toBe(AgentCapabilitySupportLevel.DEGRADED);
  });

  it("returns normalized invocation output shape", async () => {
    const adapter = new LocalModelAgentAdapter();
    const invokeResult = await adapter.invokeStage({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "codegen",
      input: {
        prompt: "implement feature",
      },
    });

    expect(invokeResult.output.adapterSurface).toBe("ollama");
    expect(invokeResult.output.routeKey).toBe("codegen");
  });

  it("streams status and completed events", async () => {
    const adapter = new LocalModelAgentAdapter();
    const events = [];

    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
    }

    expect(events).toEqual([AgentStreamEventType.STATUS, AgentStreamEventType.COMPLETED]);
  });
});
