import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import type {
  AgentCancelRequest,
  AgentConfirmationRequest,
  AgentInvokeStageRequest,
  AgentStreamEventsRequest,
} from "./types/index.js";

/**
 * Maps adapter protocol failures to standardized runtime errors.
 *
 * Why this exists:
 * route runner and adapter invokers should emit consistent error codes and
 * metadata so policy, audit, and CLI layers can diagnose failures uniformly.
 */
export class AgentProtocolErrorMapper {
  /**
   * Maps probe failures to standardized runtime errors.
   * @param surface Adapter surface identifier.
   * @param routeKey Route identifier.
   * @param error Raw probe error.
   * @returns Standardized runtime error.
   */
  public mapProbeError(surface: string, routeKey: string, error: unknown): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
      `Failed to probe adapter surface "${surface}" for route "${routeKey}".`,
      {
        surface,
        routeKey,
      },
      error,
    );
  }

  /**
   * Maps invoke-stage failures to standardized runtime errors.
   * @param surface Adapter surface identifier.
   * @param request Stage invocation request payload.
   * @param error Raw invoke error.
   * @returns Standardized runtime error.
   */
  public mapInvokeError(
    surface: string,
    request: AgentInvokeStageRequest,
    error: unknown,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      `Failed to invoke stage "${request.stageId}" on adapter surface "${surface}".`,
      {
        surface,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
      },
      error,
    );
  }

  /**
   * Maps stream-event failures to standardized runtime errors.
   * @param surface Adapter surface identifier.
   * @param request Stream-events request payload.
   * @param error Raw stream error.
   * @returns Standardized runtime error.
   */
  public mapStreamError(
    surface: string,
    request: AgentStreamEventsRequest,
    error: unknown,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_STREAM_FAILED,
      `Failed to stream events for stage "${request.stageId}" on adapter surface "${surface}".`,
      {
        surface,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
      },
      error,
    );
  }

  /**
   * Maps confirmation failures to standardized runtime errors.
   * @param surface Adapter surface identifier.
   * @param request Confirmation request payload.
   * @param error Raw confirmation error.
   * @returns Standardized runtime error.
   */
  public mapConfirmationError(
    surface: string,
    request: AgentConfirmationRequest,
    error: unknown,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_CONFIRMATION_FAILED,
      `Failed to request confirmation for stage "${request.stageId}" on adapter surface "${surface}".`,
      {
        surface,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
      },
      error,
    );
  }

  /**
   * Maps cancellation failures to standardized runtime errors.
   * @param surface Adapter surface identifier.
   * @param request Cancellation request payload.
   * @param error Raw cancel error.
   * @returns Standardized runtime error.
   */
  public mapCancelError(
    surface: string,
    request: AgentCancelRequest,
    error: unknown,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_CANCEL_FAILED,
      `Failed to cancel execution on adapter surface "${surface}".`,
      {
        surface,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        scope: request.scope,
        reason: request.reason,
      },
      error,
    );
  }
}
