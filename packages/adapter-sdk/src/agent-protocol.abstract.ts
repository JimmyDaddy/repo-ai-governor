import type {
  AgentCancelRequest,
  AgentCancelResult,
  AgentConfirmationRequest,
  AgentConfirmationResult,
  AgentInvokeStageRequest,
  AgentInvokeStageResult,
  AgentProbeRequest,
  AgentProbeResult,
  AgentProtocolContract,
  AgentStreamEvent,
  AgentStreamEventsRequest,
} from "./types/index.js";

/**
 * Provides class-based baseline for adapter protocol implementations.
 *
 * Why this exists:
 * a shared abstract class keeps adapter implementations aligned on the same
 * execution contract while allowing provider-specific behavior overrides.
 */
export abstract class AgentProtocol implements AgentProtocolContract {
  /**
   * Probes adapter availability and capability matrix.
   * @param request Probe request payload.
   * @returns Probe result payload.
   */
  public abstract probe(request: AgentProbeRequest): Promise<AgentProbeResult>;

  /**
   * Invokes one stage execution on adapter surface.
   * @param request Stage invocation request payload.
   * @returns Stage result payload.
   */
  public abstract invokeStage(request: AgentInvokeStageRequest): Promise<AgentInvokeStageResult>;

  /**
   * Streams execution events for one stage invocation.
   * @param request Stream-events request payload.
   * @returns Async iterable event stream.
   */
  public abstract streamEvents(request: AgentStreamEventsRequest): AsyncIterable<AgentStreamEvent>;

  /**
   * Requests one human confirmation decision from adapter channel.
   * @param request Confirmation request payload.
   * @returns Confirmation decision payload.
   */
  public abstract requestConfirmation(
    request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult>;

  /**
   * Cancels in-flight execution across agent/stage/flow scope.
   * @param request Cancellation request payload.
   * @returns Cancellation acknowledgement payload.
   */
  public abstract cancel(request: AgentCancelRequest): Promise<AgentCancelResult>;
}
