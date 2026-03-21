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

const CLAUDE_CODE_DEFAULT_AGENT_ID = "claude-code-default-agent";
const CLAUDE_CODE_DEFAULT_ROLE = "coder";
const CLAUDE_CODE_DEFAULT_ROLE_PROFILE_ID = "coder-default";
const CLAUDE_CODE_DEFAULT_ROLE_SOURCE = "default";
const CLAUDE_CODE_SURFACE = "claude-code";

const CLAUDE_CODE_CAPABILITY_SUPPORT: Record<AgentCapability, AgentCapabilitySupportLevel> = {
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
 * Defines Claude Code adapter constructor options.
 */
export interface ClaudeCodeAgentAdapterOptions {
  agentId?: string;
  role?: string;
  roleProfileId?: string;
  roleSource?: string;
  availabilityStatus?: AgentAvailabilityStatus;
  unavailableReasons?: string[];
}

/**
 * Implements Claude Code adapter baseline under unified agent protocol.
 *
 * Why this exists:
 * TK-036 requires first-batch adapters to expose one shared protocol surface
 * while preserving per-tool capability support metadata.
 */
export class ClaudeCodeAgentAdapter extends AgentProtocol {
  private readonly options: Required<ClaudeCodeAgentAdapterOptions>;

  /**
   * Creates Claude Code adapter with optional identity and status overrides.
   * @param options Adapter construction options.
   */
  public constructor(options: ClaudeCodeAgentAdapterOptions = {}) {
    super();
    this.options = {
      agentId: options.agentId ?? CLAUDE_CODE_DEFAULT_AGENT_ID,
      role: options.role ?? CLAUDE_CODE_DEFAULT_ROLE,
      roleProfileId: options.roleProfileId ?? CLAUDE_CODE_DEFAULT_ROLE_PROFILE_ID,
      roleSource: options.roleSource ?? CLAUDE_CODE_DEFAULT_ROLE_SOURCE,
      availabilityStatus: options.availabilityStatus ?? AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: options.unavailableReasons ?? [],
    };
  }

  /**
   * Probes Claude Code adapter identity, availability, and capability matrix.
   * @param _request Probe request payload.
   * @returns Probe result payload.
   */
  public override async probe(_request: AgentProbeRequest): Promise<AgentProbeResult> {
    return {
      identity: {
        agentId: this.options.agentId,
        role: this.options.role,
        surface: CLAUDE_CODE_SURFACE,
        roleProfileId: this.options.roleProfileId,
        roleSource: this.options.roleSource,
      },
      availabilityStatus: this.options.availabilityStatus,
      capabilityMatrix: this.createCapabilityMatrix(),
      unavailableReasons: this.options.unavailableReasons,
    };
  }

  /**
   * Invokes one stage using Claude Code baseline behavior.
   * @param request Stage invocation request payload.
   * @returns Stage invocation result payload.
   */
  public override async invokeStage(
    request: AgentInvokeStageRequest,
  ): Promise<AgentInvokeStageResult> {
    return {
      output: {
        adapterSurface: CLAUDE_CODE_SURFACE,
        routeKey: request.routeKey,
        stageId: request.stageId,
        echoedInput: request.input,
      },
      elapsedMs: 1,
    };
  }

  /**
   * Streams baseline status/completed events for Claude Code stage execution.
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
        surface: CLAUDE_CODE_SURFACE,
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
        surface: CLAUDE_CODE_SURFACE,
      },
    };
  }

  /**
   * Requests confirmation via Claude Code adapter baseline flow.
   * @param _request Confirmation request payload.
   * @returns Confirmation decision payload.
   */
  public override async requestConfirmation(
    _request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    return {
      decision: AgentConfirmationDecision.APPROVE,
      reason: "claude-code-adapter-baseline-approved",
      constraints: [],
      decidedAt: new Date().toISOString(),
    };
  }

  /**
   * Cancels one ongoing Claude Code execution scope.
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
      supportLevel: CLAUDE_CODE_CAPABILITY_SUPPORT[capability],
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
        maxInputTokens: 200000,
        maxOutputTokens: 16000,
        supportsAutoTruncation: true,
      },
    };
  }
}
