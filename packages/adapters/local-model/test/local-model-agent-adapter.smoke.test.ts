import {
  AgentCancellationReason,
  AgentCancellationScope,
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentConfirmationDecision,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from "@repo-ai-governor/adapter-sdk";
import { LocalModelProvider } from "@repo-ai-governor/shared";
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
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns local-model capability matrix via probe", async () => {
    const adapter = new LocalModelAgentAdapter();

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });
    const toolCallingCapability = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.TOOL_CALLING,
    );
    const structuredOutputCapability = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.STRUCTURED_OUTPUT,
    );
    const parallelTaskCapability = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.PARALLEL_TASK,
    );
    const streamingCapability = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.STREAMING,
    );
    const confirmationCapability = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.CONFIRMATION_GATE,
    );
    const cancellationCapability = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.CANCELLATION,
    );

    expect(probeResult.identity.surface).toBe("ollama");
    expect(probeResult.capabilityMatrix.capabilityStates).toHaveLength(
      Object.values(AgentCapability).length,
    );
    expect(toolCallingCapability?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(structuredOutputCapability?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(parallelTaskCapability?.supportLevel).toBe(AgentCapabilitySupportLevel.DEGRADED);
    expect(streamingCapability?.supportLevel).toBe(AgentCapabilitySupportLevel.DEGRADED);
    expect(confirmationCapability?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(cancellationCapability?.supportLevel).toBe(AgentCapabilitySupportLevel.DEGRADED);
    expect(probeResult.capabilityMatrix.cancellation.supportsCancel).toBe(false);
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

  it("probes configured local-model endpoint and validates configured model", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      expect(String(input)).toContain("/api/tags");
      return new Response(
        JSON.stringify({
          models: [
            {
              name: "qwen2.5-coder:7b",
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const adapter = new LocalModelAgentAdapter({
      localModel: {
        provider: LocalModelProvider.OLLAMA,
        endpoint: "http://127.0.0.1:11434",
        model: "qwen2.5-coder:7b",
      },
      fetchFn: fetchMock as typeof fetch,
    });

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });

    expect(probeResult.availabilityStatus).toBe("available");
    expect(probeResult.unavailableReasons).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("marks probe unavailable when configured model is missing", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            models: [
              {
                name: "llama3.2:3b",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
    );
    const adapter = new LocalModelAgentAdapter({
      localModel: {
        provider: LocalModelProvider.OLLAMA,
        endpoint: "http://127.0.0.1:11434",
        model: "qwen2.5-coder:7b",
      },
      fetchFn: fetchMock as typeof fetch,
    });

    const probeResult = await adapter.probe({
      routeKey: "codegen",
    });

    expect(probeResult.availabilityStatus).toBe("unavailable");
    expect(probeResult.unavailableReasons).toContain(
      "local_model_model_missing:ollama:qwen2.5-coder:7b",
    );
  });

  it("invokes configured local model and maps token usage", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).includes("/api/generate")) {
        expect(init?.method).toBe("POST");
        return new Response(
          JSON.stringify({
            response: "implemented feature",
            done: true,
            prompt_eval_count: 12,
            eval_count: 34,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }
      return new Response(
        JSON.stringify({
          models: [
            {
              name: "qwen2.5-coder:7b",
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    });
    const adapter = new LocalModelAgentAdapter({
      localModel: {
        provider: LocalModelProvider.OLLAMA,
        endpoint: "http://127.0.0.1:11434",
        model: "qwen2.5-coder:7b",
      },
      fetchFn: fetchMock as typeof fetch,
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

    expect(invokeResult.output.responseText).toBe("implemented feature");
    expect(invokeResult.usage?.inputTokens).toBe(12);
    expect(invokeResult.usage?.outputTokens).toBe(34);
    expect(invokeResult.usage?.totalTokens).toBe(46);
  });

  it("retries retryable local-model invocation failures before succeeding", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("socket hang up"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            response: "retry success",
            done: true,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );
    const adapter = new LocalModelAgentAdapter({
      localModel: {
        provider: LocalModelProvider.OLLAMA,
        endpoint: "http://127.0.0.1:11434",
        model: "qwen2.5-coder:7b",
        maxRetries: 1,
      },
      fetchFn: fetchMock as typeof fetch,
    });

    const invokeResult = await adapter.invokeStage({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "codegen",
      input: {
        prompt: "retry once",
      },
    });

    expect(invokeResult.output.responseText).toBe("retry success");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("streams status and completed events", async () => {
    const adapter = new LocalModelAgentAdapter();
    const events = [];

    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
    }

    expect(events).toEqual([AgentStreamEventType.STATUS, AgentStreamEventType.COMPLETED]);
  });

  it("returns conservative confirmation and cancellation semantics", async () => {
    const adapter = new LocalModelAgentAdapter();

    const confirmationResult = await adapter.requestConfirmation({
      processId: "process-1",
      executionId: "execution-1",
      stageId: "stage-1",
      routeKey: "codegen",
      prompt: "apply risky change",
    });
    const cancelResult = await adapter.cancel({
      processId: "process-1",
      executionId: "execution-1",
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    expect(confirmationResult.decision).toBe(AgentConfirmationDecision.REVISE);
    expect(confirmationResult.reason).toBe("local-model-confirmation-gate-unsupported");
    expect(cancelResult.acknowledged).toBe(false);
  });
});
