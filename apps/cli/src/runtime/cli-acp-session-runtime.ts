import type {
  AgentCancelRequest,
  AgentInvokeStageRequest,
  AgentStreamEventsRequest,
} from '@repo-ai-governor/adapter-sdk';
import type { AdapterSurface } from '@repo-ai-governor/shared';
import type { CliAcpInvocationContext, CliAcpInvocationExecutionState } from '../types/index.js';
import { CliAcpExecutionStateStore } from './cli-acp-execution-state-store.js';

/**
 * Owns additive ACP session/invocation bookkeeping without modifying canonical session truth.
 */
export class CliAcpSessionRuntime {
  public constructor(
    private readonly executionStateStore: CliAcpExecutionStateStore = new CliAcpExecutionStateStore(),
  ) {}

  /**
   * Creates one ACP-local invocation context from invoke/stream request facts.
   * @param surfaceId Selected ACP surface id.
   * @param request Invoke or stream request payload.
   * @returns Transport-scoped invocation context for shared ACP execution.
   */
  public createInvocationContext(
    surfaceId: AdapterSurface,
    request: AgentInvokeStageRequest | AgentStreamEventsRequest,
  ): CliAcpInvocationContext {
    return {
      surfaceId,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
    };
  }

  /**
   * Returns the additive ACP execution state that backs invoke/stream shared-turn attachment.
   * @param surfaceId Selected ACP surface id.
   * @param request Invoke or stream request payload.
   * @returns Transport-scoped execution state for the current ACP turn.
   */
  public ensureInvocationState(
    surfaceId: AdapterSurface,
    request: AgentInvokeStageRequest | AgentStreamEventsRequest,
  ): CliAcpInvocationExecutionState {
    return this.executionStateStore.ensureInvocationState(
      this.createInvocationContext(surfaceId, request),
    );
  }

  /**
   * Returns the existing ACP execution state for one cancellation request when the request can be
   * resolved back to a concrete invocation key or one unambiguous process/execution-local match.
   * @param surfaceId Selected ACP surface id.
   * @param request Cancellation payload.
   * @returns Existing transport-scoped execution state when the current request maps to a turn.
   */
  public findInvocationState(
    surfaceId: AdapterSurface,
    request: AgentCancelRequest,
  ): CliAcpInvocationExecutionState | undefined {
    return this.executionStateStore.findInvocationState({
      surfaceId,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
    });
  }

  /**
   * Forgets one transport-scoped ACP execution state after retention or lifecycle cleanup.
   * @param invocationState Shared ACP execution state to forget when it is still current.
   * @returns Nothing.
   */
  public forgetInvocationState(invocationState: CliAcpInvocationExecutionState): void {
    this.executionStateStore.forgetInvocationState(invocationState);
  }
}
