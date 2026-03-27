import { GovernorErrorCode, type RuntimeError } from '@repo-ai-governor/shared';
import {
  AGENT_LOCAL_FALLBACK_SURFACE,
  AgentAvailabilityStatus,
  type AgentCancelRequest,
  AgentCancellationReason,
  AgentCancellationScope,
  AgentCapability,
  AgentCapabilityFallbackAction,
  type AgentCapabilityMatrix,
  AgentCapabilitySupportLevel,
  AgentConfirmationDecision,
  type AgentConfirmationRequest,
  type AgentInvokeStageRequest,
  AgentNetworkMode,
  type AgentProbeRequest,
  AgentProtocol,
  type AgentRestrictedNetworkFallbackContext,
  AgentRouteRunner,
  AgentRouteSelectionSource,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
  AgentSurfaceNetworkRequirement,
  AgentSurfaceSkipReason,
} from '../src/index.js';

interface FakeAgentProtocolOptions {
  surface: string;
  availabilityStatus: AgentAvailabilityStatus;
  capabilitySupportById?: Partial<Record<AgentCapability, AgentCapabilitySupportLevel>>;
  throwOnProbe?: boolean;
  throwOnInvoke?: boolean;
}

function createCapabilityMatrix(
  capabilitySupportById: Partial<Record<AgentCapability, AgentCapabilitySupportLevel>>,
): AgentCapabilityMatrix {
  const capabilityStates = Object.values(AgentCapability).map((capability) => ({
    capability,
    supportLevel: capabilitySupportById[capability] ?? AgentCapabilitySupportLevel.UNSUPPORTED,
  }));

  return {
    capabilityStates,
    timeout: {
      supportsAgentInvocationTimeout: true,
      supportsStageTimeoutSignal: true,
      supportsFlowTimeoutSignal: true,
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
  public constructor(private readonly options: FakeAgentProtocolOptions) {
    super();
  }

  public override async probe(_request: AgentProbeRequest) {
    if (this.options.throwOnProbe) {
      throw {
        message: 'probe failed',
      };
    }
    return {
      identity: {
        agentId: `${this.options.surface}-agent`,
        role: 'coder',
        surface: this.options.surface,
        roleProfileId: 'coder-default',
        roleSource: 'default',
      },
      availabilityStatus: this.options.availabilityStatus,
      capabilityMatrix: createCapabilityMatrix(this.options.capabilitySupportById ?? {}),
      unavailableReasons:
        this.options.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE
          ? ['surface unavailable']
          : [],
    };
  }

  public override async invokeStage(_request: AgentInvokeStageRequest) {
    if (this.options.throwOnInvoke) {
      throw {
        message: 'invoke failed',
      };
    }
    return {
      output: {
        surface: this.options.surface,
      },
      elapsedMs: 3,
    };
  }

  public override async *streamEvents(_request: AgentStreamEventsRequest) {
    yield {
      eventType: AgentStreamEventType.STATUS,
      timestamp: '2026-03-21T00:00:00.000Z',
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
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
      decidedAt: '2026-03-21T00:00:00.000Z',
    };
  }

  public override async cancel(_request: AgentCancelRequest) {
    return {
      acknowledged: true,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
      cancelledAt: '2026-03-21T00:00:00.000Z',
    };
  }
}

describe('adapter-route-runner smoke', () => {
  it('selects primary surface when primary is available and capability requirement is satisfied', async () => {
    const routeRunner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: 'codegen',
          primarySurface: 'codex',
          fallbackSurfaces: ['claude'],
          capabilityRequirement: {
            requiredCapabilities: [AgentCapability.TOOL_CALLING],
          },
        },
      ],
      protocolBySurface: {
        codex: new FakeAgentProtocol({
          surface: 'codex',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          capabilitySupportById: {
            [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.SUPPORTED,
          },
        }),
        claude: new FakeAgentProtocol({
          surface: 'claude',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          capabilitySupportById: {
            [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.SUPPORTED,
          },
        }),
      },
    });

    const result = await routeRunner.dispatchStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
    });

    expect(result.selectedSurface).toBe('codex');
    expect(result.auditRecord.selectedBy).toBe(AgentRouteSelectionSource.PRIMARY);
    expect(result.auditRecord.fallbackTriggered).toBe(false);
  });

  it('falls back to secondary surface when primary surface is unavailable', async () => {
    const routeRunner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: 'codegen',
          primarySurface: 'codex',
          fallbackSurfaces: ['claude'],
        },
      ],
      protocolBySurface: {
        codex: new FakeAgentProtocol({
          surface: 'codex',
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        }),
        claude: new FakeAgentProtocol({
          surface: 'claude',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        }),
      },
    });

    const result = await routeRunner.dispatchStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
    });

    expect(result.selectedSurface).toBe('claude');
    expect(result.auditRecord.selectedBy).toBe(AgentRouteSelectionSource.FALLBACK);
    expect(result.auditRecord.fallbackTriggered).toBe(true);
  });

  it('falls back when primary capability is unsupported and fallback rule requests fallback surface', async () => {
    const routeRunner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: 'codegen',
          primarySurface: 'codex',
          fallbackSurfaces: ['claude'],
          capabilityRequirement: {
            requiredCapabilities: [AgentCapability.TOOL_CALLING],
            fallbackRules: [
              {
                capability: AgentCapability.TOOL_CALLING,
                onUnsupported: AgentCapabilityFallbackAction.USE_FALLBACK_SURFACE,
                onDegraded: AgentCapabilityFallbackAction.REQUIRE_CONFIRMATION,
              },
            ],
          },
        },
      ],
      protocolBySurface: {
        codex: new FakeAgentProtocol({
          surface: 'codex',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          capabilitySupportById: {
            [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.UNSUPPORTED,
          },
        }),
        claude: new FakeAgentProtocol({
          surface: 'claude',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          capabilitySupportById: {
            [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.SUPPORTED,
          },
        }),
      },
    });

    const result = await routeRunner.dispatchStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
    });

    expect(result.selectedSurface).toBe('claude');
    expect(result.auditRecord.requiredFallbackActions).toContain(
      AgentCapabilityFallbackAction.USE_FALLBACK_SURFACE,
    );
  });

  it('throws standardized no-available-surface error when no candidate can run', async () => {
    const routeRunner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: 'codegen',
          primarySurface: 'codex',
          fallbackSurfaces: ['claude'],
        },
      ],
      protocolBySurface: {
        codex: new FakeAgentProtocol({
          surface: 'codex',
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        }),
      },
    });

    await expect(
      routeRunner.dispatchStage({
        processId: 'process-1',
        executionId: 'execution-1',
        stageId: 'stage-1',
        routeKey: 'codegen',
        input: {
          prompt: 'implement feature',
        },
      }),
    ).rejects.toThrowError();

    try {
      await routeRunner.dispatchStage({
        processId: 'process-1',
        executionId: 'execution-1',
        stageId: 'stage-1',
        routeKey: 'codegen',
        input: {
          prompt: 'implement feature',
        },
      });
    } catch (error) {
      expect((error as RuntimeError).code).toBe(
        GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
      );
    }
  });

  it('activates local fallback when restricted network blocks all external surfaces', async () => {
    const routeRunner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: 'codegen',
          primarySurface: 'codex',
          fallbackSurfaces: ['claude'],
        },
      ],
      protocolBySurface: {
        codex: new FakeAgentProtocol({
          surface: 'codex',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        }),
        claude: new FakeAgentProtocol({
          surface: 'claude',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        }),
      },
      surfaceNetworkRequirementBySurface: {
        codex: AgentSurfaceNetworkRequirement.EXTERNAL_NETWORK,
        claude: AgentSurfaceNetworkRequirement.EXTERNAL_NETWORK,
      },
    });

    const result = await routeRunner.dispatchStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
      runtimeContext: {
        networkMode: AgentNetworkMode.RESTRICTED,
        restrictedReason: 'ci-network-policy',
      },
    });

    expect(result.selectedSurface).toBe(AGENT_LOCAL_FALLBACK_SURFACE);
    expect(result.auditRecord.selectedBy).toBe(AgentRouteSelectionSource.LOCAL_FALLBACK);
    expect(result.auditRecord.networkMode).toBe(AgentNetworkMode.RESTRICTED);
    expect(result.auditRecord.localFallbackActivated).toBe(true);
    expect(result.auditRecord.restrictedReason).toBe('ci-network-policy');
    expect(result.auditRecord.evaluatedSurfaces).toHaveLength(2);
    for (const record of result.auditRecord.evaluatedSurfaces) {
      expect(record.skippedReason).toBe(AgentSurfaceSkipReason.NETWORK_RESTRICTED);
    }
  });

  it('throws restricted-network-blocked error when local fallback is disabled', async () => {
    const routeRunner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: 'codegen',
          primarySurface: 'codex',
        },
      ],
      protocolBySurface: {
        codex: new FakeAgentProtocol({
          surface: 'codex',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        }),
      },
      surfaceNetworkRequirementBySurface: {
        codex: AgentSurfaceNetworkRequirement.EXTERNAL_NETWORK,
      },
    });

    try {
      await routeRunner.dispatchStage({
        processId: 'process-1',
        executionId: 'execution-1',
        stageId: 'stage-1',
        routeKey: 'codegen',
        input: {
          prompt: 'implement feature',
        },
        runtimeContext: {
          networkMode: AgentNetworkMode.RESTRICTED,
          allowLocalFallback: false,
        },
      });
    } catch (error) {
      expect((error as RuntimeError).code).toBe(
        GovernorErrorCode.ADAPTER_ROUTE_RESTRICTED_NETWORK_BLOCKED,
      );
    }
  });

  it('does not trigger local fallback when restricted mode failure is not network-related', async () => {
    const routeRunner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: 'codegen',
          primarySurface: 'codex',
        },
      ],
      protocolBySurface: {
        codex: new FakeAgentProtocol({
          surface: 'codex',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          throwOnProbe: true,
        }),
      },
      surfaceNetworkRequirementBySurface: {
        codex: AgentSurfaceNetworkRequirement.LOCAL_ONLY,
      },
    });

    try {
      await routeRunner.dispatchStage({
        processId: 'process-1',
        executionId: 'execution-1',
        stageId: 'stage-1',
        routeKey: 'codegen',
        input: {
          prompt: 'implement feature',
        },
        runtimeContext: {
          networkMode: AgentNetworkMode.RESTRICTED,
        },
      });
    } catch (error) {
      expect((error as RuntimeError).code).toBe(
        GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
      );
    }
  });

  it('throws restricted-network-fallback-failed error when custom fallback handler fails', async () => {
    const routeRunner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: 'codegen',
          primarySurface: 'codex',
        },
      ],
      protocolBySurface: {
        codex: new FakeAgentProtocol({
          surface: 'codex',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        }),
      },
      surfaceNetworkRequirementBySurface: {
        codex: AgentSurfaceNetworkRequirement.EXTERNAL_NETWORK,
      },
      restrictedNetworkFallbackHandler: {
        async invokeFallback(_context: AgentRestrictedNetworkFallbackContext) {
          throw {
            message: 'local fallback failed',
          };
        },
      },
    });

    try {
      await routeRunner.dispatchStage({
        processId: 'process-1',
        executionId: 'execution-1',
        stageId: 'stage-1',
        routeKey: 'codegen',
        input: {
          prompt: 'implement feature',
        },
        runtimeContext: {
          networkMode: AgentNetworkMode.RESTRICTED,
        },
      });
    } catch (error) {
      expect((error as RuntimeError).code).toBe(
        GovernorErrorCode.ADAPTER_ROUTE_RESTRICTED_NETWORK_FALLBACK_FAILED,
      );
    }
  });

  it('maps invoke-stage failures to standardized adapter protocol error', async () => {
    const routeRunner = new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: 'codegen',
          primarySurface: 'codex',
        },
      ],
      protocolBySurface: {
        codex: new FakeAgentProtocol({
          surface: 'codex',
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          throwOnInvoke: true,
        }),
      },
    });

    try {
      await routeRunner.dispatchStage({
        processId: 'process-1',
        executionId: 'execution-1',
        stageId: 'stage-1',
        routeKey: 'codegen',
        input: {
          prompt: 'implement feature',
        },
      });
    } catch (error) {
      expect((error as RuntimeError).code).toBe(GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED);
    }
  });

  it('throws standardized config error when capabilityRequirement nested shape is invalid', () => {
    expect(
      () =>
        new AgentRouteRunner({
          routePolicies: [
            {
              routeKey: 'codegen',
              primarySurface: 'codex',
              capabilityRequirement: {
                requiredCapabilities: [AgentCapability.TOOL_CALLING],
                fallbackRules: {} as unknown as never[],
              },
            },
          ],
          protocolBySurface: {
            codex: new FakeAgentProtocol({
              surface: 'codex',
              availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            }),
          },
        }),
    ).toThrowError();

    try {
      new AgentRouteRunner({
        routePolicies: [
          {
            routeKey: 'codegen',
            primarySurface: 'codex',
            capabilityRequirement: {
              requiredCapabilities: [AgentCapability.TOOL_CALLING],
              fallbackRules: {} as unknown as never[],
            },
          },
        ],
        protocolBySurface: {
          codex: new FakeAgentProtocol({
            surface: 'codex',
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          }),
        },
      });
    } catch (error) {
      expect((error as RuntimeError).code).toBe(GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID);
    }
  });
});
