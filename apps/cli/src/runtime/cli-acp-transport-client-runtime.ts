import type {
  AgentCancelRequest,
  AgentCancelResult,
  AgentConfirmationRequest,
  AgentConfirmationResult,
  AgentInvokeStageRequest,
  AgentInvokeStageResult,
  AgentStreamEvent,
  AgentStreamEventsRequest,
} from '@repo-ai-governor/adapter-sdk';
import {
  AgentCancellationReason,
  AgentCancellationScope,
  AgentConfirmationDecision,
  AgentStreamEventType,
} from '@repo-ai-governor/adapter-sdk';
import {
  type AdapterSurface,
  AdapterTransportKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import type {
  CliAcpInvocationExecutionState,
  CliAcpPermissionRequestResolution,
} from '../types/index.js';

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
const CLI_ACP_FIXTURE_BRIDGE_CAPABILITY = {
  TERMINAL: 'terminal',
  FS_READ_TEXT_FILE: 'fs.readTextFile',
  FS_WRITE_TEXT_FILE: 'fs.writeTextFile',
} as const;

interface CliAcpTransportClientRuntimeOptions {
  forgetInvocationState?: (invocationState: CliAcpInvocationExecutionState) => void;
}

type CliAcpFixtureBridgeCapability =
  (typeof CLI_ACP_FIXTURE_BRIDGE_CAPABILITY)[keyof typeof CLI_ACP_FIXTURE_BRIDGE_CAPABILITY];

interface CliAcpResolvedPermissionBridgeRequest {
  acpPermissionRequestId: string;
  toolCallId: string;
  allowedDecisions: AgentConfirmationDecision[];
  decision: AgentConfirmationDecision;
  constraints: string[];
  reason: string;
}

interface CliAcpFixtureBridgeCapabilities {
  terminal: boolean;
  fsReadTextFile: boolean;
  fsWriteTextFile: boolean;
}

interface CliAcpFixtureToolCallRequest {
  toolCallId: string;
  toolName: string;
  detail: string;
  activityKey: string;
  terminalId?: string;
  requiredCapabilities: CliAcpFixtureBridgeCapability[];
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
   * @returns Confirmation result once active tool-call metadata is available for transport mapping.
   */
  public async requestPermission(options: {
    surfaceId: AdapterSurface;
    request: AgentConfirmationRequest;
    invocationState?: CliAcpInvocationExecutionState;
    localizeText: (english: string, chinese: string) => string;
  }): Promise<AgentConfirmationResult> {
    const permissionBridgeRequest = this.resolvePermissionBridgeRequest(
      options.request,
      options.localizeText,
    );
    const activeExecution = options.invocationState
      ? this.promptTurnExecutionByInvocationKey.get(options.invocationState.invocationKey)
      : undefined;
    if (
      !options.invocationState ||
      !permissionBridgeRequest ||
      !activeExecution ||
      activeExecution.cancelled ||
      activeExecution.settled ||
      !options.invocationState.emittedToolCallIds.includes(permissionBridgeRequest.toolCallId)
    ) {
      throw this.createPermissionBridgeUnavailableError(
        options.surfaceId,
        options.request,
        options.localizeText,
      );
    }

    const existingPermissionResolution =
      options.invocationState.permissionRequestResolutionsById[
        permissionBridgeRequest.acpPermissionRequestId
      ];
    if (existingPermissionResolution) {
      if (
        !this.isEquivalentPermissionBridgeRequest(
          existingPermissionResolution,
          permissionBridgeRequest,
        )
      ) {
        throw this.createPermissionBridgeReplayMismatchError(
          options.surfaceId,
          options.request,
          options.localizeText,
        );
      }

      return {
        decision: existingPermissionResolution.decision,
        reason: existingPermissionResolution.reason,
        constraints: [...existingPermissionResolution.constraints],
        decidedAt: existingPermissionResolution.decidedAt,
      };
    }

    const decidedAt = new Date().toISOString();
    if (
      !options.invocationState.permissionRequestIds.includes(
        permissionBridgeRequest.acpPermissionRequestId,
      )
    ) {
      options.invocationState.permissionRequestIds.push(
        permissionBridgeRequest.acpPermissionRequestId,
      );
    }
    options.invocationState.permissionRequestResolutionsById[
      permissionBridgeRequest.acpPermissionRequestId
    ] = {
      toolCallId: permissionBridgeRequest.toolCallId,
      allowedDecisions: [...permissionBridgeRequest.allowedDecisions],
      decision: permissionBridgeRequest.decision,
      constraints: [...permissionBridgeRequest.constraints],
      reason: permissionBridgeRequest.reason,
      decidedAt,
    };
    options.invocationState.updatedAt = new Date().toISOString();

    return {
      decision: permissionBridgeRequest.decision,
      reason: permissionBridgeRequest.reason,
      constraints: permissionBridgeRequest.constraints,
      decidedAt,
    };
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

      const fixtureToolCalls = this.resolveFixtureToolCalls({
        surfaceId: options.surfaceId,
        input: options.request.input,
        localizeText: options.localizeText,
      });
      for (const toolCall of fixtureToolCalls) {
        this.assertFixtureToolCallCapabilities({
          surfaceId: options.surfaceId,
          toolCall,
          input: options.request.input,
          localizeText: options.localizeText,
        });
        this.rememberToolCallCarrierState(options.invocationState, toolCall);
        this.pushPromptTurnEvent(options.invocationState, options.execution, {
          eventType: AgentStreamEventType.TOOL_CALL,
          timestamp: new Date().toISOString(),
          processId: options.request.processId,
          executionId: options.request.executionId,
          stageId: options.request.stageId,
          routeKey: options.request.routeKey,
          payload: {
            toolName: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            detail: toolCall.detail,
            activityKey: toolCall.activityKey,
            surface: options.surfaceId,
            transportKind: AdapterTransportKind.ACP_EXEC,
            acpSessionId,
            acpInvocationKey: options.invocationState.invocationKey,
          },
        });
        await this.checkForCancelledExecution(options);
      }

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

  private createPermissionBridgeUnavailableError(
    surfaceId: AdapterSurface,
    request: AgentConfirmationRequest,
    localizeText: (english: string, chinese: string) => string,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_CONFIRMATION_FAILED,
      localizeText(
        `ACP permission bridge for ${surfaceId} requires active tool-call metadata on a live ACP prompt turn before confirmation can continue.`,
        `在 ${surfaceId} 上继续 confirmation 之前，ACP permission bridge 需要 live ACP prompt turn 上的 active tool-call metadata。`,
      ),
      {
        surfaceId,
        transportKind: AdapterTransportKind.ACP_EXEC,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
      },
    );
  }

  private createPermissionBridgeReplayMismatchError(
    surfaceId: AdapterSurface,
    request: AgentConfirmationRequest,
    localizeText: (english: string, chinese: string) => string,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_CONFIRMATION_FAILED,
      localizeText(
        `ACP permission bridge for ${surfaceId} rejected a replayed permission request because the bound confirmation facts changed.`,
        `在 ${surfaceId} 上，ACP permission bridge 拒绝了重复 permission request，因为绑定的 confirmation facts 已发生变化。`,
      ),
      {
        surfaceId,
        transportKind: AdapterTransportKind.ACP_EXEC,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
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
      this.cleanupInterruptedHostOperationCarrierState(invocationState);
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

  private isEquivalentPermissionBridgeRequest(
    existingResolution: CliAcpPermissionRequestResolution,
    request: CliAcpResolvedPermissionBridgeRequest,
  ): boolean {
    return (
      existingResolution.toolCallId === request.toolCallId &&
      existingResolution.decision === request.decision &&
      this.hasSameItems(existingResolution.allowedDecisions, request.allowedDecisions) &&
      this.hasSameItems(existingResolution.constraints, request.constraints) &&
      existingResolution.reason === request.reason
    );
  }

  private hasSameItems<T extends string>(left: T[], right: T[]): boolean {
    return (
      left.length === right.length &&
      left.every((value) => right.includes(value)) &&
      right.every((value) => left.includes(value))
    );
  }

  private resolveFixtureToolCalls(options: {
    surfaceId: AdapterSurface;
    input: Record<string, unknown>;
    localizeText: (english: string, chinese: string) => string;
  }): CliAcpFixtureToolCallRequest[] {
    const rawToolCalls = options.input.toolCalls;
    if (typeof rawToolCalls === 'undefined') {
      return [];
    }
    if (!Array.isArray(rawToolCalls)) {
      throw this.createInvalidFixtureToolCallError(
        options.surfaceId,
        options.localizeText,
        options.localizeText('toolCalls must be an array.', 'toolCalls 必须是数组。'),
      );
    }

    return rawToolCalls.map((candidate, index) =>
      this.parseFixtureToolCall({
        surfaceId: options.surfaceId,
        candidate,
        index,
        localizeText: options.localizeText,
      }),
    );
  }

  private parseFixtureToolCall(options: {
    surfaceId: AdapterSurface;
    candidate: unknown;
    index: number;
    localizeText: (english: string, chinese: string) => string;
  }): CliAcpFixtureToolCallRequest {
    if (
      !options.candidate ||
      typeof options.candidate !== 'object' ||
      Array.isArray(options.candidate)
    ) {
      throw this.createInvalidFixtureToolCallError(
        options.surfaceId,
        options.localizeText,
        options.localizeText(
          `toolCalls[${String(options.index)}] must be an object.`,
          `toolCalls[${String(options.index)}] 必须是对象。`,
        ),
      );
    }

    const record = options.candidate as Record<string, unknown>;
    const toolCallId = this.readRequiredFixtureToolCallString(
      record.toolCallId,
      options.surfaceId,
      options.localizeText,
      `toolCalls[${String(options.index)}].toolCallId`,
    );
    const toolName = this.readRequiredFixtureToolCallString(
      record.toolName,
      options.surfaceId,
      options.localizeText,
      `toolCalls[${String(options.index)}].toolName`,
    );
    if (toolName.startsWith('fs/') && !this.isSupportedFilesystemToolName(toolName)) {
      throw this.createUnsupportedFixtureBridgeCarrierError(
        options.surfaceId,
        toolName,
        options.localizeText,
      );
    }
    const requiredCapabilities = this.resolveFixtureToolCallCapabilities({
      surfaceId: options.surfaceId,
      toolName,
      candidate: record.requiredCapabilities,
      fieldPath: `toolCalls[${String(options.index)}].requiredCapabilities`,
      localizeText: options.localizeText,
    });

    return {
      toolCallId,
      toolName,
      detail:
        typeof record.detail === 'string' && record.detail.trim().length > 0
          ? record.detail.trim()
          : options.localizeText(
              `ACP bridge invoked ${toolName}.`,
              `ACP bridge 已调用 ${toolName}。`,
            ),
      activityKey:
        typeof record.activityKey === 'string' && record.activityKey.trim().length > 0
          ? record.activityKey.trim()
          : `acp-tool:${toolCallId}`,
      terminalId:
        typeof record.terminalId === 'string' && record.terminalId.trim().length > 0
          ? record.terminalId.trim()
          : undefined,
      requiredCapabilities,
    };
  }

  private readRequiredFixtureToolCallString(
    candidate: unknown,
    surfaceId: AdapterSurface,
    localizeText: (english: string, chinese: string) => string,
    fieldPath: string,
  ): string {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }

    throw this.createInvalidFixtureToolCallError(
      surfaceId,
      localizeText,
      localizeText(`${fieldPath} must be a non-empty string.`, `${fieldPath} 必须是非空字符串。`),
    );
  }

  private resolveFixtureToolCallCapabilities(options: {
    surfaceId: AdapterSurface;
    toolName: string;
    candidate: unknown;
    fieldPath: string;
    localizeText: (english: string, chinese: string) => string;
  }): CliAcpFixtureBridgeCapability[] {
    if (typeof options.candidate === 'undefined') {
      return this.resolveDefaultFixtureToolCallCapabilities(options.toolName);
    }
    if (!Array.isArray(options.candidate)) {
      throw this.createInvalidFixtureToolCallError(
        options.surfaceId,
        options.localizeText,
        options.localizeText(
          `${options.fieldPath} must be an array when provided.`,
          `${options.fieldPath} 提供时必须是数组。`,
        ),
      );
    }

    const resolvedCapabilities = options.candidate.map((value) => {
      const capability = this.resolveFixtureBridgeCapability(value);
      if (capability) {
        return capability;
      }

      throw this.createInvalidFixtureToolCallError(
        options.surfaceId,
        options.localizeText,
        options.localizeText(
          `${options.fieldPath} contains an unsupported capability id.`,
          `${options.fieldPath} 包含不支持的 capability id。`,
        ),
      );
    });

    return [...new Set(resolvedCapabilities)];
  }

  private resolveDefaultFixtureToolCallCapabilities(
    toolName: string,
  ): CliAcpFixtureBridgeCapability[] {
    if (toolName.startsWith('terminal/')) {
      return [CLI_ACP_FIXTURE_BRIDGE_CAPABILITY.TERMINAL];
    }
    if (toolName === 'fs/read_text_file') {
      return [CLI_ACP_FIXTURE_BRIDGE_CAPABILITY.FS_READ_TEXT_FILE];
    }
    if (toolName === 'fs/write_text_file') {
      return [CLI_ACP_FIXTURE_BRIDGE_CAPABILITY.FS_WRITE_TEXT_FILE];
    }
    return [];
  }

  private isSupportedFilesystemToolName(toolName: string): boolean {
    return toolName === 'fs/read_text_file' || toolName === 'fs/write_text_file';
  }

  private resolveFixtureBridgeCapability(candidate: unknown): CliAcpFixtureBridgeCapability | null {
    return Object.values(CLI_ACP_FIXTURE_BRIDGE_CAPABILITY).includes(
      candidate as CliAcpFixtureBridgeCapability,
    )
      ? (candidate as CliAcpFixtureBridgeCapability)
      : null;
  }

  private assertFixtureToolCallCapabilities(options: {
    surfaceId: AdapterSurface;
    toolCall: CliAcpFixtureToolCallRequest;
    input: Record<string, unknown>;
    localizeText: (english: string, chinese: string) => string;
  }): void {
    const bridgeCapabilities = this.resolveFixtureBridgeCapabilities(options.input);
    for (const capability of options.toolCall.requiredCapabilities) {
      if (this.hasFixtureBridgeCapability(bridgeCapabilities, capability)) {
        continue;
      }

      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CAPABILITY_UNSATISFIED,
        options.localizeText(
          `ACP fixture bridge for ${options.toolCall.toolName} requires ${capability} capability on ${options.surfaceId}.`,
          `在 ${options.surfaceId} 上执行 ${options.toolCall.toolName} 需要 ${capability} capability。`,
        ),
        {
          surfaceId: options.surfaceId,
          transportKind: AdapterTransportKind.ACP_EXEC,
          toolName: options.toolCall.toolName,
          toolCallId: options.toolCall.toolCallId,
          requiredCapability: capability,
        },
      );
    }
  }

  private resolveFixtureBridgeCapabilities(
    input: Record<string, unknown>,
  ): CliAcpFixtureBridgeCapabilities {
    const rawCapabilities = input.acpCapabilities;
    if (!rawCapabilities || typeof rawCapabilities !== 'object' || Array.isArray(rawCapabilities)) {
      return {
        terminal: false,
        fsReadTextFile: false,
        fsWriteTextFile: false,
      };
    }

    const capabilities = rawCapabilities as Record<string, unknown>;
    return {
      terminal: capabilities.terminal === true,
      fsReadTextFile: capabilities.fsReadTextFile === true,
      fsWriteTextFile: capabilities.fsWriteTextFile === true,
    };
  }

  private hasFixtureBridgeCapability(
    capabilities: CliAcpFixtureBridgeCapabilities,
    capability: CliAcpFixtureBridgeCapability,
  ): boolean {
    switch (capability) {
      case CLI_ACP_FIXTURE_BRIDGE_CAPABILITY.TERMINAL:
        return capabilities.terminal;
      case CLI_ACP_FIXTURE_BRIDGE_CAPABILITY.FS_READ_TEXT_FILE:
        return capabilities.fsReadTextFile;
      case CLI_ACP_FIXTURE_BRIDGE_CAPABILITY.FS_WRITE_TEXT_FILE:
        return capabilities.fsWriteTextFile;
      default:
        return false;
    }
  }

  private rememberToolCallCarrierState(
    invocationState: CliAcpInvocationExecutionState,
    toolCall: CliAcpFixtureToolCallRequest,
  ): void {
    if (!invocationState.emittedToolCallIds.includes(toolCall.toolCallId)) {
      invocationState.emittedToolCallIds.push(toolCall.toolCallId);
      invocationState.updatedAt = new Date().toISOString();
    }

    if (
      !toolCall.toolName.startsWith('terminal/') ||
      !toolCall.terminalId ||
      invocationState.terminalIds.includes(toolCall.terminalId)
    ) {
      return;
    }

    invocationState.terminalIds.push(toolCall.terminalId);
    invocationState.updatedAt = new Date().toISOString();
  }

  private cleanupInterruptedHostOperationCarrierState(
    invocationState: CliAcpInvocationExecutionState,
  ): void {
    invocationState.emittedToolCallIds = [];
    invocationState.permissionRequestResolutionsById = {};
    invocationState.permissionRequestIds = [];
    invocationState.terminalIds = [];
    invocationState.updatedAt = new Date().toISOString();
  }

  private createUnsupportedFixtureBridgeCarrierError(
    surfaceId: AdapterSurface,
    toolName: string,
    localizeText: (english: string, chinese: string) => string,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_ROUTE_CAPABILITY_UNSATISFIED,
      localizeText(
        `ACP fixture bridge does not support unknown filesystem carrier ${toolName} on ${surfaceId}.`,
        `在 ${surfaceId} 上，ACP fixture bridge 不支持未知的 filesystem carrier ${toolName}。`,
      ),
      {
        surfaceId,
        transportKind: AdapterTransportKind.ACP_EXEC,
        toolName,
      },
    );
  }

  private createInvalidFixtureToolCallError(
    surfaceId: AdapterSurface,
    localizeText: (english: string, chinese: string) => string,
    detail: string,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      localizeText(
        `ACP fixture tool-call payload for ${surfaceId} is invalid: ${detail}`,
        `${surfaceId} 的 ACP fixture tool-call payload 非法：${detail}`,
      ),
      {
        surfaceId,
        transportKind: AdapterTransportKind.ACP_EXEC,
        detail,
      },
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
    invocationState.emittedToolCallIds = [];
    invocationState.permissionRequestResolutionsById = {};
    invocationState.permissionRequestIds = [];
    invocationState.terminalIds = [];
    invocationState.bufferedStreamEvents = [];
    invocationState.updatedAt = new Date().toISOString();
  }

  private compactFailedInvocationState(invocationState: CliAcpInvocationExecutionState): void {
    invocationState.acpSessionId = null;
    invocationState.invokeResultPromise = undefined;
    invocationState.emittedToolCallIds = [];
    invocationState.permissionRequestResolutionsById = {};
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
    invocationState.emittedToolCallIds = [];
    invocationState.permissionRequestResolutionsById = {};
    invocationState.permissionRequestIds = [];
    invocationState.terminalIds = [];
    invocationState.bufferedStreamEvents = [];
    invocationState.updatedAt = new Date().toISOString();
  }

  private resolvePermissionBridgeRequest(
    request: AgentConfirmationRequest,
    localizeText: (english: string, chinese: string) => string,
  ): CliAcpResolvedPermissionBridgeRequest | null {
    if (
      !request.metadata ||
      typeof request.metadata !== 'object' ||
      Array.isArray(request.metadata)
    ) {
      return null;
    }

    const metadata = request.metadata as Record<string, unknown>;
    const acpPermissionRequestId =
      typeof metadata.acpPermissionRequestId === 'string' &&
      metadata.acpPermissionRequestId.trim().length > 0
        ? metadata.acpPermissionRequestId.trim()
        : null;
    const toolCallId =
      typeof metadata.toolCallId === 'string' && metadata.toolCallId.trim().length > 0
        ? metadata.toolCallId.trim()
        : null;
    const allowedDecisions = Array.isArray(metadata.allowedDecisions)
      ? metadata.allowedDecisions.filter((value): value is AgentConfirmationDecision =>
          Object.values(AgentConfirmationDecision).includes(value as AgentConfirmationDecision),
        )
      : [];

    if (!acpPermissionRequestId || !toolCallId || allowedDecisions.length === 0) {
      return null;
    }

    const requestedDecision =
      typeof metadata.decision === 'string' &&
      Object.values(AgentConfirmationDecision).includes(
        metadata.decision as AgentConfirmationDecision,
      )
        ? (metadata.decision as AgentConfirmationDecision)
        : null;
    if (!requestedDecision || !allowedDecisions.includes(requestedDecision)) {
      return null;
    }

    return {
      acpPermissionRequestId,
      toolCallId,
      allowedDecisions,
      decision: requestedDecision,
      constraints: Array.isArray(metadata.constraints)
        ? metadata.constraints.filter((value): value is string => typeof value === 'string')
        : [],
      reason:
        typeof metadata.reason === 'string' && metadata.reason.trim().length > 0
          ? metadata.reason.trim()
          : localizeText(
              `ACP permission decision mapped for ${toolCallId}.`,
              `ACP permission decision 已映射到 ${toolCallId}。`,
            ),
    };
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
