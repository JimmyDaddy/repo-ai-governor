import { GovernorErrorCode, type RuntimeError } from '@repo-ai-governor/shared';
import {
  AgentAvailabilityStatus,
  type AgentCancelRequest,
  AgentCancellationReason,
  AgentCancellationScope,
  AgentCapability,
  AgentCapabilityEvaluator,
  AgentCapabilityFallbackAction,
  type AgentCapabilityMatrix,
  AgentCapabilitySupportLevel,
  AgentConfirmationDecision,
  type AgentConfirmationRequest,
  type AgentInvokeStageRequest,
  type AgentProbeRequest,
  AgentProtocol,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from '../src/index.js';

function createCapabilityMatrix(): AgentCapabilityMatrix {
  return {
    capabilityStates: [
      {
        capability: AgentCapability.TOOL_CALLING,
        supportLevel: AgentCapabilitySupportLevel.SUPPORTED,
      },
      {
        capability: AgentCapability.STRUCTURED_OUTPUT,
        supportLevel: AgentCapabilitySupportLevel.SUPPORTED,
      },
      {
        capability: AgentCapability.STREAMING,
        supportLevel: AgentCapabilitySupportLevel.DEGRADED,
      },
    ],
    timeout: {
      supportsAgentInvocationTimeout: true,
      supportsStageTimeoutSignal: true,
      supportsFlowTimeoutSignal: false,
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
  };
}

class FakeAgentProtocol extends AgentProtocol {
  public override async probe(_request: AgentProbeRequest) {
    return {
      identity: {
        agentId: 'fake-agent',
        role: 'coder',
        surface: 'fake-surface',
        roleProfileId: 'coder-default',
        roleSource: 'default',
      },
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      capabilityMatrix: createCapabilityMatrix(),
      unavailableReasons: [],
    };
  }

  public override async invokeStage(_request: AgentInvokeStageRequest) {
    return {
      output: {
        status: 'ok',
      },
      elapsedMs: 1,
    };
  }

  public override async *streamEvents(_request: AgentStreamEventsRequest) {
    yield {
      eventType: AgentStreamEventType.STATUS,
      timestamp: new Date().toISOString(),
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'route',
      payload: {
        status: 'running',
      },
    };
  }

  public override async requestConfirmation(_request: AgentConfirmationRequest) {
    return {
      decision: AgentConfirmationDecision.APPROVE,
      reason: 'approved',
      constraints: [],
      decidedAt: new Date().toISOString(),
    };
  }

  public override async cancel(_request: AgentCancelRequest) {
    return {
      acknowledged: true,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
      cancelledAt: new Date().toISOString(),
    };
  }
}

describe('adapter-sdk unit', () => {
  it('keeps capability requirement satisfied when all required capabilities are supported', () => {
    const evaluator = new AgentCapabilityEvaluator();
    const result = evaluator.evaluate(createCapabilityMatrix(), {
      requiredCapabilities: [AgentCapability.TOOL_CALLING, AgentCapability.STRUCTURED_OUTPUT],
    });

    expect(result.isSatisfied).toBe(true);
    expect(result.unsupportedCapabilities).toEqual([]);
    expect(result.degradedCapabilities).toEqual([]);
  });

  it('marks unsupported capabilities and applies default escalate fallback', () => {
    const evaluator = new AgentCapabilityEvaluator();
    const result = evaluator.evaluate(createCapabilityMatrix(), {
      requiredCapabilities: [AgentCapability.PARALLEL_TASK],
    });

    expect(result.isSatisfied).toBe(false);
    expect(result.unsupportedCapabilities).toEqual([AgentCapability.PARALLEL_TASK]);
    expect(result.requiredFallbackActions).toContain(AgentCapabilityFallbackAction.ESCALATE);
  });

  it('marks degraded capabilities when they are not explicitly allowed', () => {
    const evaluator = new AgentCapabilityEvaluator();
    const result = evaluator.evaluate(createCapabilityMatrix(), {
      requiredCapabilities: [AgentCapability.STREAMING],
    });

    expect(result.isSatisfied).toBe(false);
    expect(result.degradedCapabilities).toEqual([AgentCapability.STREAMING]);
    expect(result.requiredFallbackActions).toContain(
      AgentCapabilityFallbackAction.REQUIRE_CONFIRMATION,
    );
  });

  it('treats degraded capabilities as satisfied when allowDegradedCapabilities includes them', () => {
    const evaluator = new AgentCapabilityEvaluator();
    const result = evaluator.evaluate(createCapabilityMatrix(), {
      requiredCapabilities: [AgentCapability.STREAMING],
      allowDegradedCapabilities: [AgentCapability.STREAMING],
    });

    expect(result.isSatisfied).toBe(true);
    expect(result.degradedCapabilities).toEqual([]);
    expect(result.requiredFallbackActions).toEqual([]);
  });

  it('uses custom fallback rules for unsupported capabilities', () => {
    const evaluator = new AgentCapabilityEvaluator();
    const result = evaluator.evaluate(createCapabilityMatrix(), {
      requiredCapabilities: [AgentCapability.CANCELLATION],
      fallbackRules: [
        {
          capability: AgentCapability.CANCELLATION,
          onUnsupported: AgentCapabilityFallbackAction.BLOCK,
          onDegraded: AgentCapabilityFallbackAction.REQUIRE_CONFIRMATION,
          note: 'cancellation is mandatory for this route',
        },
      ],
    });

    expect(result.requiredFallbackActions).toEqual([AgentCapabilityFallbackAction.BLOCK]);
    expect(result.capabilityGaps[0]?.note).toBe('cancellation is mandatory for this route');
  });

  it('throws standardized error when requirement payload is invalid', () => {
    const evaluator = new AgentCapabilityEvaluator();
    expect(() =>
      evaluator.evaluate(createCapabilityMatrix(), {
        requiredCapabilities: [],
      }),
    ).toThrowError();

    try {
      evaluator.evaluate(createCapabilityMatrix(), {
        requiredCapabilities: [],
      });
    } catch (error) {
      expect((error as RuntimeError).code).toBe(
        GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
      );
    }
  });

  it('throws standardized error when allowDegradedCapabilities is not an array', () => {
    const evaluator = new AgentCapabilityEvaluator();
    expect(() =>
      evaluator.evaluate(createCapabilityMatrix(), {
        requiredCapabilities: [AgentCapability.STREAMING],
        allowDegradedCapabilities: 'streaming' as unknown as AgentCapability[],
      }),
    ).toThrowError();

    try {
      evaluator.evaluate(createCapabilityMatrix(), {
        requiredCapabilities: [AgentCapability.STREAMING],
        allowDegradedCapabilities: 'streaming' as unknown as AgentCapability[],
      });
    } catch (error) {
      expect((error as RuntimeError).code).toBe(
        GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
      );
    }
  });

  it('throws standardized error when fallbackRules is not an array', () => {
    const evaluator = new AgentCapabilityEvaluator();
    expect(() =>
      evaluator.evaluate(createCapabilityMatrix(), {
        requiredCapabilities: [AgentCapability.STREAMING],
        fallbackRules: {} as unknown as never[],
      }),
    ).toThrowError();

    try {
      evaluator.evaluate(createCapabilityMatrix(), {
        requiredCapabilities: [AgentCapability.STREAMING],
        fallbackRules: {} as unknown as never[],
      });
    } catch (error) {
      expect((error as RuntimeError).code).toBe(
        GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
      );
    }
  });

  it('exposes class-based protocol contract for adapters', async () => {
    const protocol = new FakeAgentProtocol();
    const probeResult = await protocol.probe({
      routeKey: 'route',
    });
    const invokeResult = await protocol.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'route',
      input: {
        foo: 'bar',
      },
    });
    const eventIterator = protocol.streamEvents({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'route',
      input: {
        foo: 'bar',
      },
    });
    const firstEvent = await eventIterator.next();

    expect(probeResult.availabilityStatus).toBe(AgentAvailabilityStatus.AVAILABLE);
    expect(invokeResult.output.status).toBe('ok');
    expect(firstEvent.value?.eventType).toBe(AgentStreamEventType.STATUS);
  });
});
