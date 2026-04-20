import { AgentStreamEventType } from '@repo-ai-governor/adapter-sdk';
import type { CliAcpInvocationContext, CliAcpInvocationExecutionState } from '../types/index.js';

/**
 * Owns transport-scoped ACP execution state without promoting ACP-local ids into canonical session
 * truth or provider continuation handles.
 */
export class CliAcpExecutionStateStore {
  private readonly executionStateByInvocationKey = new Map<
    string,
    CliAcpInvocationExecutionState
  >();

  /**
   * Resolves one deterministic shared-execution key for ACP invoke/stream attachment.
   * @param context ACP-local invocation facts.
   * @returns Stable invocation key for the current ACP stage execution.
   */
  public resolveInvocationKey(context: CliAcpInvocationContext): string {
    return [
      context.surfaceId,
      context.processId,
      context.executionId,
      context.stageId,
      context.routeKey,
    ].join('::');
  }

  /**
   * Returns the existing additive ACP state for one invocation or creates a new baseline row.
   * @param context ACP-local invocation facts.
   * @returns Mutable execution state for the shared ACP invocation.
   */
  public ensureInvocationState(context: CliAcpInvocationContext): CliAcpInvocationExecutionState {
    const invocationKey = this.resolveInvocationKey(context);
    const existingState = this.executionStateByInvocationKey.get(invocationKey);
    if (existingState) {
      existingState.updatedAt = new Date().toISOString();
      return existingState;
    }

    const now = new Date().toISOString();
    const createdState: CliAcpInvocationExecutionState = {
      ...context,
      invocationKey,
      acpSessionId: null,
      emittedToolCallIds: [],
      permissionRequestResolutionsById: {},
      permissionRequestIds: [],
      terminalIds: [],
      createdAt: now,
      updatedAt: now,
      bufferedStreamEvents: [],
    };
    this.executionStateByInvocationKey.set(invocationKey, createdState);
    return createdState;
  }

  /**
   * Returns one ACP execution state when it already exists.
   * @param invocationKey Shared ACP execution key.
   * @returns Existing execution state when present.
   */
  public getInvocationState(invocationKey: string): CliAcpInvocationExecutionState | undefined {
    return this.executionStateByInvocationKey.get(invocationKey);
  }

  /**
   * Resolves one invocation state from either the full stage-scoped key or an unambiguous
   * process/execution-local match when stage/route facts are absent from the cancel request.
   * @param context Cancellation lookup facts.
   * @returns Matching invocation state when the lookup is unique.
   */
  public findInvocationState(
    context: Pick<CliAcpInvocationContext, 'surfaceId' | 'processId' | 'executionId'> &
      Partial<Pick<CliAcpInvocationContext, 'stageId' | 'routeKey'>>,
  ): CliAcpInvocationExecutionState | undefined {
    if (typeof context.stageId === 'string' && typeof context.routeKey === 'string') {
      return this.executionStateByInvocationKey.get(
        this.resolveInvocationKey({
          surfaceId: context.surfaceId,
          processId: context.processId,
          executionId: context.executionId,
          stageId: context.stageId,
          routeKey: context.routeKey,
        }),
      );
    }

    const matchingStates = [...this.executionStateByInvocationKey.values()].filter((state) => {
      if (
        state.surfaceId !== context.surfaceId ||
        state.processId !== context.processId ||
        state.executionId !== context.executionId
      ) {
        return false;
      }

      if (typeof context.stageId === 'string' && state.stageId !== context.stageId) {
        return false;
      }

      if (typeof context.routeKey === 'string' && state.routeKey !== context.routeKey) {
        return false;
      }

      return true;
    });

    const cancellableStates = matchingStates.filter(
      (state) =>
        state.bufferedStreamEvents.at(-1)?.eventType !== AgentStreamEventType.COMPLETED &&
        state.bufferedStreamEvents.at(-1)?.eventType !== AgentStreamEventType.FAILED,
    );

    return cancellableStates.length === 1 ? cancellableStates[0] : undefined;
  }

  /**
   * Forgets one additive ACP execution state when transport retention or lifecycle cleanup no
   * longer needs that exact invocation object to stay addressable.
   * @param invocationState Shared ACP execution state to forget when it is still current.
   * @returns Nothing.
   */
  public forgetInvocationState(invocationState: CliAcpInvocationExecutionState): void {
    const currentState = this.executionStateByInvocationKey.get(invocationState.invocationKey);
    if (currentState !== invocationState) {
      return;
    }

    this.executionStateByInvocationKey.delete(invocationState.invocationKey);
  }
}
