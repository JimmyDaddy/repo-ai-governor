import {
  AgentCapability,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from "@repo-ai-governor/adapter-sdk";
import { CodexAgentAdapter } from "../src/index.js";

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

describe("codex-agent-adapter smoke", () => {
  it("returns Codex capability matrix via probe", async () => {
    const adapter = new CodexAgentAdapter();

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });

    expect(probeResult.identity.surface).toBe("codex");
    expect(probeResult.capabilityMatrix.capabilityStates).toHaveLength(
      Object.values(AgentCapability).length,
    );
  });

  it("returns normalized invocation output shape", async () => {
    const adapter = new CodexAgentAdapter();
    const invokeResult = await adapter.invokeStage({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "codegen",
      input: {
        prompt: "implement feature",
      },
    });

    expect(invokeResult.output.adapterSurface).toBe("codex");
    expect(invokeResult.output.routeKey).toBe("codegen");
  });

  it("streams status and completed events", async () => {
    const adapter = new CodexAgentAdapter();
    const events = [];

    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
    }

    expect(events).toEqual([AgentStreamEventType.STATUS, AgentStreamEventType.COMPLETED]);
  });
});
