import type {
  AgentCancelRequest,
  AgentCancelResult,
  AgentConfirmationResult,
  AgentInvokeStageRequest,
  AgentInvokeStageResult,
  AgentStreamEvent,
  AgentStreamEventsRequest,
} from '@repo-ai-governor/adapter-sdk';
import {
  AgentCancellationReason,
  AgentCancellationScope,
  AgentStreamEventType,
} from '@repo-ai-governor/adapter-sdk';
import {
  type AdapterSurface,
  AdapterTransportKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import type { CliAcpInvocationExecutionState } from '../types/index.js';

const CLI_ACP_HOST_ACTION_LABELS = {
  invoke: {
    english: 'invoke',
    chinese: '调用',
  },
  stream: {
    english: 'stream',
    chinese: '流式输出',
  },
  confirm: {
    english: 'confirm',
    chinese: '确认',
  },
} as const;
const CLI_ACP_COMPLETED_INVOCATION_RETENTION_LIMIT = 32;
const CLI_ACP_FAILED_INVOCATION_RETENTION_LIMIT = 32;

interface CliAcpTransportClientRuntimeOptions {
  forgetInvocationState?: (invocationState: CliAcpInvocationExecutionState) => void;
}

interface CliAcpSharedPromptTurnExecution {
  settled: boolean;
  cancelled: boolean;
  terminalStatus: 'completed' | 'failed' | null;
  cancelScope: AgentCancellationScope;
  cancelReason: AgentCancellationReason;
  waiters: Set<() => void>;
  resultPromise: Promise<AgentInvokeStageResult>;
}

/**
 * Owns the ACP protocol transport seam beneath the host-facing protocol entrypoint.
 *
 * Why this exists:
 * sprint-002 turns ACP invoke/stream/cancel into a real, transport-scoped execution baseline
 * without turning CliAcpHostProtocol into a new God object or reinterpreting ACP as cli_exec.
 */
export class CliAcpTransportClientRuntime {
  /**
   * Builds one transport runtime with optional hooks for session-owned invocation cleanup.
   * @param options Optional lifecycle hooks that keep transport retention aligned with the shared
   * session-owned invocation store.
   */
  public constructor(private readonly options: CliAcpTransportClientRuntimeOptions = {}) {}

  private readonly promptTurnExecutionByInvocationKey = new Map<
    string,
    CliAcpSharedPromptTurnExecution
  >();
  private readonly completedInvocationStateByInvocationKey = new Map<
    string,
    CliAcpInvocationExecutionState
  >();
  private readonly completedInvocationRetentionOrder: string[] = [];
  private readonly failedInvocationStateByInvocationKey = new Map<
    string,
    CliAcpInvocationExecutionState
  >();
  private readonly failedInvocationRetentionOrder: string[] = [];

  /**
   * Executes one ACP prompt turn for invokeStage.
   * @param options Surface-local invoke context.
   * @returns Final prompt-turn result for one transport-scoped ACP execution.
   */
  public async invokePromptTurn(options: {
    surfaceId: AdapterSurface;
    request: AgentInvokeStageRequest;
    invocationState: CliAcpInvocationExecutionState;
    localizeText: (english: string, chinese: string) => string;
  }): Promise<AgentInvokeStageResult> {
    await this.waitForCancelledExecutionToSettle(options.invocationState);
    this.resetFailedInvocationStateIfNeeded(options.invocationState);
    const completedResultPromise = this.resolveCompletedInvocationResultPromise(
      options.invocationState,
    );
    if (completedResultPromise) {
      return await completedResultPromise;
    }

    const execution = this.ensurePromptTurnExecution({
      surfaceId: options.surfaceId,
      request: options.request,
      invocationState: options.invocationState,
      localizeText: options.localizeText,
    });
    options.invocationState.invokeResultPromise = execution.resultPromise;
    return await execution.resultPromise;
  }

  /**
   * Attaches to one ACP prompt turn for streamEvents.
   * @param options Surface-local stream context.
   * @returns Async iterable of buffered/live events from the shared ACP prompt turn.
   */
  public async *streamPromptTurn(options: {
    surfaceId: AdapterSurface;
    request: AgentStreamEventsRequest;
    invocationState: CliAcpInvocationExecutionState;
    localizeText: (english: string, chinese: string) => string;
  }): AsyncIterable<AgentStreamEvent> {
    const existingExecution = this.promptTurnExecutionByInvocationKey.get(
      options.invocationState.invocationKey,
    );
    if (!existingExecution && this.hasTerminalEvent(options.invocationState)) {
      yield* options.invocationState.bufferedStreamEvents;
      return;
    }

    const execution = this.ensurePromptTurnExecution({
      surfaceId: options.surfaceId,
      request: options.request,
      invocationState: options.invocationState,
      localizeText: options.localizeText,
    });
    options.invocationState.invokeResultPromise = execution.resultPromise;
    let cursor = 0;
    while (true) {
      while (cursor < options.invocationState.bufferedStreamEvents.length) {
        const event = options.invocationState.bufferedStreamEvents[cursor];
        cursor += 1;
        if (event) {
          yield event;
        }
      }

      if (execution.settled) {
        return;
      }

      await new Promise<void>((resolve) => {
        execution.waiters.add(resolve);
      });
    }
  }

  /**
   * Bridges one ACP-native permission request back into the host-facing confirmation seam.
   * @param options Surface-local confirmation context.
   * @returns Never resolves during the sprint-001 fail-closed baseline.
   */
  public async requestPermission(options: {
    surfaceId: AdapterSurface;
    localizeText: (english: string, chinese: string) => string;
  }): Promise<AgentConfirmationResult> {
    throw this.createUnavailableError(options.surfaceId, 'confirm', options.localizeText);
  }

  /**
   * Cancels one active ACP prompt turn when a transport-scoped invocation is currently in flight.
   * @param options Surface-local cancellation context.
   * @returns Cancellation acknowledgement for the shared ACP prompt turn.
   */
  public async cancelPromptTurn(options: {
    surfaceId: AdapterSurface;
    request: AgentCancelRequest;
    invocationState?: CliAcpInvocationExecutionState;
    localizeText: (english: string, chinese: string) => string;
  }): Promise<AgentCancelResult> {
    const cancelledAt = new Date().toISOString();
    const resolvedScope = options.request.scope;
    const resolvedReason = options.request.reason;
    if (!options.invocationState) {
      return {
        acknowledged: false,
        scope: resolvedScope,
        reason: resolvedReason,
        cancelledAt,
      };
    }

    const execution = this.promptTurnExecutionByInvocationKey.get(
      options.invocationState.invocationKey,
    );
    if (!execution || execution.settled) {
      return {
        acknowledged: false,
        scope: resolvedScope,
        reason: resolvedReason,
        cancelledAt,
      };
    }

    execution.cancelled = true;
    execution.cancelScope = resolvedScope;
    execution.cancelReason = resolvedReason;
    options.invocationState.updatedAt = cancelledAt;
    for (const waiter of execution.waiters) {
      waiter();
    }
    execution.waiters.clear();
    return {
      acknowledged: true,
      scope: resolvedScope,
      reason: resolvedReason,
      cancelledAt,
    };
  }

  protected async startPromptTurnExecution(options: {
    surfaceId: AdapterSurface;
    request: AgentInvokeStageRequest | AgentStreamEventsRequest;
    invocationState: CliAcpInvocationExecutionState;
    execution: CliAcpSharedPromptTurnExecution;
    localizeText: (english: string, chinese: string) => string;
  }): Promise<AgentInvokeStageResult> {
    const startedAtMs = Date.now();
    try {
      const acpSessionId = this.ensureAcpSessionId(options.invocationState, options.surfaceId);
      this.pushPromptTurnEvent(options.invocationState, options.execution, {
        eventType: AgentStreamEventType.STATUS,
        timestamp: new Date().toISOString(),
        processId: options.request.processId,
        executionId: options.request.executionId,
        stageId: options.request.stageId,
        routeKey: options.request.routeKey,
        payload: {
          status: 'running',
          detail: options.localizeText(
            `ACP session/prompt started for ${options.surfaceId}.`,
            `ACP session/prompt 已为 ${options.surfaceId} 启动。`,
          ),
          surface: options.surfaceId,
          transportKind: AdapterTransportKind.ACP_EXEC,
          acpSessionId,
          acpInvocationKey: options.invocationState.invocationKey,
        },
      });
      await this.checkForCancelledExecution(options);

      const responseText = this.resolveFixtureResponseText(options);
      this.pushPromptTurnEvent(options.invocationState, options.execution, {
        eventType: AgentStreamEventType.TOKEN,
        timestamp: new Date().toISOString(),
        processId: options.request.processId,
        executionId: options.request.executionId,
        stageId: options.request.stageId,
        routeKey: options.request.routeKey,
        payload: {
          delta: responseText,
          text: responseText,
          accumulatedText: responseText,
          surface: options.surfaceId,
          transportKind: AdapterTransportKind.ACP_EXEC,
          acpSessionId,
          acpInvocationKey: options.invocationState.invocationKey,
        },
      });
      await this.checkForCancelledExecution(options);

      const result: AgentInvokeStageResult = {
        output: {
          adapterSurface: options.surfaceId,
          routeKey: options.request.routeKey,
          stageId: options.request.stageId,
          responseText,
          acpSessionId,
          acpInvocationKey: options.invocationState.invocationKey,
        },
        elapsedMs: Math.max(Date.now() - startedAtMs, 1),
      };
      options.execution.terminalStatus = 'completed';
      this.pushPromptTurnEvent(options.invocationState, options.execution, {
        eventType: AgentStreamEventType.COMPLETED,
        timestamp: new Date().toISOString(),
        processId: options.request.processId,
        executionId: options.request.executionId,
        stageId: options.request.stageId,
        routeKey: options.request.routeKey,
        payload: {
          status: 'completed',
          responseText,
          surface: options.surfaceId,
          transportKind: AdapterTransportKind.ACP_EXEC,
          acpSessionId,
          acpInvocationKey: options.invocationState.invocationKey,
        },
      });
      return result;
    } catch (error) {
      const message =
        error instanceof RuntimeError
          ? error.message
          : options.localizeText('ACP prompt turn failed.', 'ACP prompt turn 执行失败。');
      options.execution.terminalStatus = 'failed';
      const alreadyFailed = options.invocationState.bufferedStreamEvents.some(
        (event) => event.eventType === AgentStreamEventType.FAILED,
      );
      if (!alreadyFailed) {
        this.pushPromptTurnEvent(options.invocationState, options.execution, {
          eventType: AgentStreamEventType.FAILED,
          timestamp: new Date().toISOString(),
          processId: options.request.processId,
          executionId: options.request.executionId,
          stageId: options.request.stageId,
          routeKey: options.request.routeKey,
          payload: {
            status: 'failed',
            message,
            surface: options.surfaceId,
            transportKind: AdapterTransportKind.ACP_EXEC,
            acpSessionId: options.invocationState.acpSessionId,
            acpInvocationKey: options.invocationState.invocationKey,
          },
        });
      }
      throw error;
    } finally {
      this.finishPromptTurnExecution(options.invocationState, options.execution);
    }
  }

  private createUnavailableError(
    surfaceId: AdapterSurface,
    action: 'invoke' | 'stream' | 'confirm',
    localizeText: (english: string, chinese: string) => string,
  ): RuntimeError {
    const actionLabels = CLI_ACP_HOST_ACTION_LABELS[action];
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
      localizeText(
        `ACP host-facing transport is not ready for ${surfaceId}; ${actionLabels.english} is fail-closed until rollout enablement completes.`,
        `ACP host-facing transport 尚未为 ${surfaceId} 就绪；在 rollout enablement 完成前，${actionLabels.chinese} 将保持 fail-closed。`,
      ),
      {
        surfaceId,
        transportKind: AdapterTransportKind.ACP_EXEC,
        action,
      },
    );
  }

  private ensurePromptTurnExecution(options: {
    surfaceId: AdapterSurface;
    request: AgentInvokeStageRequest | AgentStreamEventsRequest;
    invocationState: CliAcpInvocationExecutionState;
    localizeText: (english: string, chinese: string) => string;
  }): CliAcpSharedPromptTurnExecution {
    const existingExecution = this.promptTurnExecutionByInvocationKey.get(
      options.invocationState.invocationKey,
    );
    if (existingExecution) {
      return existingExecution;
    }

    const execution: CliAcpSharedPromptTurnExecution = {
      settled: false,
      cancelled: false,
      terminalStatus: null,
      cancelScope: AgentCancellationScope.AGENT,
      cancelReason: AgentCancellationReason.SYSTEM_GUARD,
      waiters: new Set(),
      resultPromise: Promise.resolve({
        output: {},
        elapsedMs: 0,
      }),
    };
    execution.resultPromise = this.startPromptTurnExecution({
      surfaceId: options.surfaceId,
      request: options.request,
      invocationState: options.invocationState,
      execution,
      localizeText: options.localizeText,
    });
    this.promptTurnExecutionByInvocationKey.set(options.invocationState.invocationKey, execution);
    return execution;
  }

  private ensureAcpSessionId(
    invocationState: CliAcpInvocationExecutionState,
    surfaceId: AdapterSurface,
  ): string {
    if (invocationState.acpSessionId) {
      return invocationState.acpSessionId;
    }

    invocationState.acpSessionId = [
      surfaceId,
      invocationState.processId,
      invocationState.executionId,
      invocationState.stageId,
      'acp-session',
    ].join('::');
    return invocationState.acpSessionId;
  }

  private pushPromptTurnEvent(
    invocationState: CliAcpInvocationExecutionState,
    execution: CliAcpSharedPromptTurnExecution,
    event: AgentStreamEvent,
  ): void {
    invocationState.bufferedStreamEvents.push(event);
    invocationState.updatedAt = event.timestamp;
    for (const waiter of execution.waiters) {
      waiter();
    }
    execution.waiters.clear();
  }

  private finishPromptTurnExecution(
    invocationState: CliAcpInvocationExecutionState,
    execution: CliAcpSharedPromptTurnExecution,
  ): void {
    execution.settled = true;
    invocationState.updatedAt = new Date().toISOString();
    if (this.promptTurnExecutionByInvocationKey.get(invocationState.invocationKey) === execution) {
      this.promptTurnExecutionByInvocationKey.delete(invocationState.invocationKey);
    }
    if (execution.cancelled || execution.terminalStatus === 'failed') {
      this.forgetCompletedInvocationStateIfCurrent(invocationState);
      invocationState.invokeResultPromise = undefined;
      this.rememberFailedInvocationState(invocationState);
    } else if (execution.terminalStatus === 'completed') {
      this.rememberCompletedInvocationState(invocationState);
    }
    for (const waiter of execution.waiters) {
      waiter();
    }
    execution.waiters.clear();
  }

  private async checkForCancelledExecution(options: {
    surfaceId: AdapterSurface;
    invocationState: CliAcpInvocationExecutionState;
    execution: CliAcpSharedPromptTurnExecution;
    localizeText: (english: string, chinese: string) => string;
  }): Promise<void> {
    await Promise.resolve();
    if (!options.execution.cancelled) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
      options.localizeText(
        `ACP prompt turn was cancelled for ${options.surfaceId}.`,
        `ACP prompt turn 已为 ${options.surfaceId} 取消。`,
      ),
      {
        surfaceId: options.surfaceId,
        transportKind: AdapterTransportKind.ACP_EXEC,
        invocationKey: options.invocationState.invocationKey,
        acpSessionId: options.invocationState.acpSessionId,
        cancelScope: options.execution.cancelScope,
        cancelReason: options.execution.cancelReason,
      },
    );
  }

  private resolveFixtureResponseText(options: {
    surfaceId: AdapterSurface;
    request: AgentInvokeStageRequest | AgentStreamEventsRequest;
    localizeText: (english: string, chinese: string) => string;
  }): string {
    const explicitResponseText = options.request.input.responseText;
    if (typeof explicitResponseText === 'string' && explicitResponseText.trim().length > 0) {
      return explicitResponseText.trim();
    }

    const promptText = options.request.input.prompt;
    if (typeof promptText === 'string' && promptText.trim().length > 0) {
      return options.localizeText(
        `ACP(${options.surfaceId}): ${promptText.trim()}`,
        `ACP（${options.surfaceId}）：${promptText.trim()}`,
      );
    }

    const userMessage = options.request.input.userMessage;
    if (typeof userMessage === 'string' && userMessage.trim().length > 0) {
      return options.localizeText(
        `ACP(${options.surfaceId}): ${userMessage.trim()}`,
        `ACP（${options.surfaceId}）：${userMessage.trim()}`,
      );
    }

    return options.localizeText(
      `ACP fixture execution completed for ${options.surfaceId}.`,
      `ACP fixture 执行已为 ${options.surfaceId} 完成。`,
    );
  }

  private hasFailedTerminalEvent(invocationState: CliAcpInvocationExecutionState): boolean {
    return invocationState.bufferedStreamEvents.at(-1)?.eventType === AgentStreamEventType.FAILED;
  }

  private hasCompletedTerminalEvent(invocationState: CliAcpInvocationExecutionState): boolean {
    return (
      invocationState.bufferedStreamEvents.at(-1)?.eventType === AgentStreamEventType.COMPLETED
    );
  }

  private hasTerminalEvent(invocationState: CliAcpInvocationExecutionState): boolean {
    const terminalEventType = invocationState.bufferedStreamEvents.at(-1)?.eventType;
    return (
      terminalEventType === AgentStreamEventType.COMPLETED ||
      terminalEventType === AgentStreamEventType.FAILED
    );
  }

  private resolveCompletedInvocationResultPromise(
    invocationState: CliAcpInvocationExecutionState,
  ): Promise<AgentInvokeStageResult> | undefined {
    if (!this.hasCompletedTerminalEvent(invocationState)) {
      return undefined;
    }

    return invocationState.invokeResultPromise;
  }

  private rememberCompletedInvocationState(invocationState: CliAcpInvocationExecutionState): void {
    this.forgetFailedInvocationStateByKey(invocationState.invocationKey);
    this.forgetCompletedInvocationStateByKey(invocationState.invocationKey);
    this.completedInvocationStateByInvocationKey.set(
      invocationState.invocationKey,
      invocationState,
    );
    this.completedInvocationRetentionOrder.push(invocationState.invocationKey);
    this.trimCompletedInvocationRetention();
  }

  private rememberFailedInvocationState(invocationState: CliAcpInvocationExecutionState): void {
    this.forgetFailedInvocationStateByKey(invocationState.invocationKey);
    this.failedInvocationStateByInvocationKey.set(invocationState.invocationKey, invocationState);
    this.failedInvocationRetentionOrder.push(invocationState.invocationKey);
    this.trimFailedInvocationRetention();
  }

  private forgetCompletedInvocationStateByKey(invocationKey: string): void {
    if (!this.completedInvocationStateByInvocationKey.delete(invocationKey)) {
      return;
    }

    const retainedIndex = this.completedInvocationRetentionOrder.indexOf(invocationKey);
    if (retainedIndex >= 0) {
      this.completedInvocationRetentionOrder.splice(retainedIndex, 1);
    }
  }

  private forgetCompletedInvocationStateIfCurrent(
    invocationState: CliAcpInvocationExecutionState,
  ): void {
    if (
      this.completedInvocationStateByInvocationKey.get(invocationState.invocationKey) !==
      invocationState
    ) {
      return;
    }

    this.forgetCompletedInvocationStateByKey(invocationState.invocationKey);
  }

  private forgetFailedInvocationStateByKey(invocationKey: string): void {
    if (!this.failedInvocationStateByInvocationKey.delete(invocationKey)) {
      return;
    }

    const retainedIndex = this.failedInvocationRetentionOrder.indexOf(invocationKey);
    if (retainedIndex >= 0) {
      this.failedInvocationRetentionOrder.splice(retainedIndex, 1);
    }
  }

  private forgetFailedInvocationStateIfCurrent(
    invocationState: CliAcpInvocationExecutionState,
  ): void {
    if (
      this.failedInvocationStateByInvocationKey.get(invocationState.invocationKey) !==
      invocationState
    ) {
      return;
    }

    this.forgetFailedInvocationStateByKey(invocationState.invocationKey);
  }

  private trimCompletedInvocationRetention(): void {
    while (
      this.completedInvocationRetentionOrder.length > CLI_ACP_COMPLETED_INVOCATION_RETENTION_LIMIT
    ) {
      const evictedInvocationKey = this.completedInvocationRetentionOrder.shift();
      if (!evictedInvocationKey) {
        return;
      }

      const evictedState = this.completedInvocationStateByInvocationKey.get(evictedInvocationKey);
      this.completedInvocationStateByInvocationKey.delete(evictedInvocationKey);
      if (evictedState) {
        this.compactCompletedInvocationState(evictedState);
        this.options.forgetInvocationState?.(evictedState);
      }
    }
  }

  private trimFailedInvocationRetention(): void {
    while (this.failedInvocationRetentionOrder.length > CLI_ACP_FAILED_INVOCATION_RETENTION_LIMIT) {
      const evictedInvocationKey = this.failedInvocationRetentionOrder.shift();
      if (!evictedInvocationKey) {
        return;
      }

      const evictedState = this.failedInvocationStateByInvocationKey.get(evictedInvocationKey);
      this.failedInvocationStateByInvocationKey.delete(evictedInvocationKey);
      if (evictedState) {
        this.compactFailedInvocationState(evictedState);
        this.options.forgetInvocationState?.(evictedState);
      }
    }
  }

  private compactCompletedInvocationState(invocationState: CliAcpInvocationExecutionState): void {
    invocationState.acpSessionId = null;
    invocationState.invokeResultPromise = undefined;
    invocationState.permissionRequestIds = [];
    invocationState.terminalIds = [];
    invocationState.bufferedStreamEvents = [];
    invocationState.updatedAt = new Date().toISOString();
  }

  private compactFailedInvocationState(invocationState: CliAcpInvocationExecutionState): void {
    invocationState.acpSessionId = null;
    invocationState.invokeResultPromise = undefined;
    invocationState.permissionRequestIds = [];
    invocationState.terminalIds = [];
    invocationState.bufferedStreamEvents = [];
    invocationState.updatedAt = new Date().toISOString();
  }

  private resetFailedInvocationStateIfNeeded(
    invocationState: CliAcpInvocationExecutionState,
  ): void {
    if (!this.hasFailedTerminalEvent(invocationState)) {
      return;
    }

    this.forgetFailedInvocationStateIfCurrent(invocationState);
    invocationState.acpSessionId = null;
    invocationState.invokeResultPromise = undefined;
    invocationState.permissionRequestIds = [];
    invocationState.terminalIds = [];
    invocationState.bufferedStreamEvents = [];
    invocationState.updatedAt = new Date().toISOString();
  }

  private async waitForCancelledExecutionToSettle(
    invocationState: CliAcpInvocationExecutionState,
  ): Promise<void> {
    const execution = this.promptTurnExecutionByInvocationKey.get(invocationState.invocationKey);
    if (!execution || !execution.cancelled) {
      return;
    }

    try {
      await execution.resultPromise;
    } catch {
      return;
    }
  }
}
