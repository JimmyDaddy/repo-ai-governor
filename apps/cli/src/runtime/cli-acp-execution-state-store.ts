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
}
