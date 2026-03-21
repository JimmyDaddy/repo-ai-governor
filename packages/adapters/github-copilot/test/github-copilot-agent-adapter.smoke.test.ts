import {
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from "@repo-ai-governor/adapter-sdk";
import { GithubCopilotAgentAdapter } from "../src/index.js";

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

  it("streams status and completed events", async () => {
    const adapter = new GithubCopilotAgentAdapter();
    const events = [];

    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
    }

    expect(events).toEqual([AgentStreamEventType.STATUS, AgentStreamEventType.COMPLETED]);
  });
});
