import {
  AgentAvailabilityStatus,
  type AgentCancelRequest,
  type AgentCancelResult,
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentConfirmationDecision,
  type AgentConfirmationRequest,
  type AgentConfirmationResult,
  type AgentInvokeStageRequest,
  type AgentInvokeStageResult,
  type AgentProbeRequest,
  type AgentProbeResult,
  AgentProtocol,
  type AgentStreamEvent,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from "@repo-ai-governor/adapter-sdk";

const LOCAL_MODEL_DEFAULT_AGENT_ID = "local-model-default-agent";
const LOCAL_MODEL_DEFAULT_ROLE = "coder";
const LOCAL_MODEL_DEFAULT_ROLE_PROFILE_ID = "coder-default";
const LOCAL_MODEL_DEFAULT_ROLE_SOURCE = "default";
const LOCAL_MODEL_SURFACE = "ollama";

const LOCAL_MODEL_CAPABILITY_SUPPORT: Record<AgentCapability, AgentCapabilitySupportLevel> = {
  [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STRUCTURED_OUTPUT]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.PARALLEL_TASK]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.STREAMING]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CONFIRMATION_GATE]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CANCELLATION]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.AGENT_TIMEOUT]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STAGE_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.FLOW_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CONTEXT_WINDOW]: AgentCapabilitySupportLevel.SUPPORTED,
};

/**
 * Defines local-model adapter constructor options.
 */
export interface LocalModelAgentAdapterOptions {
  agentId?: string;
  role?: string;
  roleProfileId?: string;
  roleSource?: string;
  availabilityStatus?: AgentAvailabilityStatus;
  unavailableReasons?: string[];
}

/**
 * Implements local-model adapter baseline under unified agent protocol.
 *
 * Why this exists:
 * TK-095 needs local-model surface semantics connected to routing/config contracts
 * before TK-096 upgrades this baseline to real provider invocation behavior.
 */
export class LocalModelAgentAdapter extends AgentProtocol {
  private readonly options: Required<LocalModelAgentAdapterOptions>;

  /**
   * Creates local-model adapter with optional identity and status overrides.
   * @param options Adapter construction options.
   */
  public constructor(options: LocalModelAgentAdapterOptions = {}) {
    super();
    this.options = {
      agentId: options.agentId ?? LOCAL_MODEL_DEFAULT_AGENT_ID,
      role: options.role ?? LOCAL_MODEL_DEFAULT_ROLE,
      roleProfileId: options.roleProfileId ?? LOCAL_MODEL_DEFAULT_ROLE_PROFILE_ID,
      roleSource: options.roleSource ?? LOCAL_MODEL_DEFAULT_ROLE_SOURCE,
      availabilityStatus: options.availabilityStatus ?? AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: options.unavailableReasons ?? [],
    };
  }

  /**
   * Probes local-model adapter identity, availability, and capability matrix.
   * @param _request Probe request payload.
   * @returns Probe result payload.
   */
  public override async probe(_request: AgentProbeRequest): Promise<AgentProbeResult> {
    return {
      identity: {
        agentId: this.options.agentId,
        role: this.options.role,
        surface: LOCAL_MODEL_SURFACE,
        roleProfileId: this.options.roleProfileId,
        roleSource: this.options.roleSource,
      },
      availabilityStatus: this.options.availabilityStatus,
      capabilityMatrix: this.createCapabilityMatrix(),
      unavailableReasons: this.options.unavailableReasons,
    };
  }

  /**
   * Invokes one stage using local-model baseline behavior.
   * @param request Stage invocation request payload.
   * @returns Stage invocation result payload.
   */
  public override async invokeStage(
    request: AgentInvokeStageRequest,
  ): Promise<AgentInvokeStageResult> {
    return {
      output: {
        adapterSurface: LOCAL_MODEL_SURFACE,
        routeKey: request.routeKey,
        stageId: request.stageId,
        echoedInput: request.input,
      },
      elapsedMs: 1,
    };
  }

  /**
   * Streams baseline status/completed events for local-model stage execution.
   * @param request Stream-events request payload.
   * @returns Async iterable of stream events.
   */
  public override async *streamEvents(
    request: AgentStreamEventsRequest,
  ): AsyncIterable<AgentStreamEvent> {
    const timestamp = new Date().toISOString();
    yield {
      eventType: AgentStreamEventType.STATUS,
      timestamp,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: "running",
        surface: LOCAL_MODEL_SURFACE,
      },
    };

    yield {
      eventType: AgentStreamEventType.COMPLETED,
      timestamp: new Date().toISOString(),
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: "completed",
        surface: LOCAL_MODEL_SURFACE,
      },
    };
  }

  /**
   * Requests confirmation via local-model adapter baseline flow.
   * @param _request Confirmation request payload.
   * @returns Confirmation decision payload.
   */
  public override async requestConfirmation(
    _request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    return {
      decision: AgentConfirmationDecision.APPROVE,
      reason: "local-model-adapter-baseline-approved",
      constraints: [],
      decidedAt: new Date().toISOString(),
    };
  }

  /**
   * Cancels one ongoing local-model execution scope.
   * @param request Cancellation request payload.
   * @returns Cancellation acknowledgement payload.
   */
  public override async cancel(request: AgentCancelRequest): Promise<AgentCancelResult> {
    return {
      acknowledged: true,
      scope: request.scope,
      reason: request.reason,
      cancelledAt: new Date().toISOString(),
    };
  }

  /**
   * Creates capability matrix aligned with adapter-sdk contract.
   * @returns Capability matrix payload.
   */
  private createCapabilityMatrix(): AgentProbeResult["capabilityMatrix"] {
    const capabilityStates = Object.values(AgentCapability).map((capability) => ({
      capability,
      supportLevel: LOCAL_MODEL_CAPABILITY_SUPPORT[capability],
    }));

    return {
      capabilityStates,
      timeout: {
        supportsAgentInvocationTimeout: true,
        supportsStageTimeoutSignal: true,
        supportsFlowTimeoutSignal: true,
        minTimeoutMs: 500,
        maxTimeoutMs: 120000,
      },
      cancellation: {
        supportsCancel: true,
        supportsReasonPropagation: true,
        supportsAbortSignal: true,
      },
      contextWindow: {
        maxInputTokens: 32000,
        maxOutputTokens: 8000,
        supportsAutoTruncation: true,
      },
    };
  }
}
