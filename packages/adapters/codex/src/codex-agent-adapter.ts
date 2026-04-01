import { spawn } from 'node:child_process';

import {
  AgentAvailabilityStatus,
  type AgentCancelRequest,
  type AgentCancelResult,
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentCliExecOperation,
  AgentCliExecOperationsRuntime,
  AgentConfirmationDecision,
  type AgentConfirmationRequest,
  type AgentConfirmationResult,
  type AgentInvokeStageRequest,
  type AgentInvokeStageResult,
  type AgentProbeRequest,
  type AgentProbeResult,
  AgentProtocol,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
  type AgentStreamEvent,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
  DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS,
  DEFAULT_AGENT_CLI_EXEC_RETRY_BACKOFF_MS,
  resolveAgentStageExecutionPolicy,
} from '@repo-ai-governor/adapter-sdk';
import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';
import { CodexAgentAdapterExecutionMode } from './constants/codex-agent-adapter.constant.js';
import type {
  CodexAgentAdapterOptions,
  CodexExecRunner,
  CodexExecRunnerRequest,
  CodexExecRunnerResult,
} from './types/interfaces/codex-agent-adapter.interface.js';

const CODEX_DEFAULT_AGENT_ID = 'codex-default-agent';
const CODEX_DEFAULT_ROLE = 'coder';
const CODEX_DEFAULT_ROLE_PROFILE_ID = 'coder-default';
const CODEX_DEFAULT_ROLE_SOURCE = 'default';
const CODEX_SURFACE = 'codex';
const CODEX_COMMAND = 'codex';
const CODEX_DEFAULT_TIMEOUT_MS = 30000;
const CODEX_REPOSITORY_REVIEW_TIMEOUT_MS = 600000;
const CODEX_REPOSITORY_REVIEW_PROGRESS_INTERVAL_MS = 15000;
const CODEX_DEFAULT_PROBE_CACHE_TTL_MS = 30000;
const CODEX_CLI_EXECUTION_CACHE_TTL_MS = 30000;
const CODEX_EXEC_ARGS = ['exec', '--skip-git-repo-check', '--json', '-'] as const;
const CODEX_REVIEW_EXEC_ARGS = ['exec', 'review', '--json', '--uncommitted'] as const;
const CODEX_CHAT_ONLY_EXEC_ARGS = ['--sandbox', 'read-only'] as const;
const CODEX_HEALTH_CHECK_PROMPT = 'Respond with exactly OK.';
const CODEX_HEALTH_CHECK_EXPECTED_RESPONSE = 'OK';
const CODEX_REPOSITORY_REVIEW_SCOPE = 'uncommitted_changes';

const CODEX_BASELINE_CAPABILITY_SUPPORT: Record<AgentCapability, AgentCapabilitySupportLevel> = {
  [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STRUCTURED_OUTPUT]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.PARALLEL_TASK]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STREAMING]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CONFIRMATION_GATE]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CANCELLATION]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.AGENT_TIMEOUT]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STAGE_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.FLOW_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CONTEXT_WINDOW]: AgentCapabilitySupportLevel.SUPPORTED,
};

const CODEX_REAL_CAPABILITY_SUPPORT: Record<AgentCapability, AgentCapabilitySupportLevel> = {
  [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STRUCTURED_OUTPUT]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.PARALLEL_TASK]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.STREAMING]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.CONFIRMATION_GATE]: AgentCapabilitySupportLevel.UNSUPPORTED,
  [AgentCapability.CANCELLATION]: AgentCapabilitySupportLevel.UNSUPPORTED,
  [AgentCapability.AGENT_TIMEOUT]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STAGE_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.FLOW_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CONTEXT_WINDOW]: AgentCapabilitySupportLevel.SUPPORTED,
};

interface CodexCliJsonEvent {
  type?: string;
  thread_id?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  item?: {
    type?: string;
    text?: string;
  };
}

interface CodexCliParsedOutput {
  responseText: string;
  threadId: string | null;
  usage?: AgentInvokeStageResult['usage'];
  warnings: string[];
}

interface CodexCliExecutionRequest {
  processId: string;
  executionId: string;
  stageId: string;
  routeKey: string;
  input: Record<string, unknown>;
  timeoutMs: number;
  signal?: AbortSignal;
}

interface CodexCliExecutionState {
  key: string;
  events: AgentStreamEvent[];
  waiters: Set<() => void>;
  stdout: string;
  stderr: string;
  stdoutLineBuffer: string;
  stderrLineBuffer: string;
  settled: boolean;
  accumulatedAssistantText: string;
  cliOutputSequence: number;
  startedAtMs: number | null;
  resultPromise: Promise<CodexExecRunnerResult>;
  cleanupTimer: NodeJS.Timeout | null;
  progressTimer: NodeJS.Timeout | null;
}

interface CodexProbeResolution {
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
}

interface CodexProbeCacheEntry {
  expiresAt: number;
  resolution: CodexProbeResolution;
}

interface ResolvedCodexAgentAdapterOptions {
  agentId: string;
  role: string;
  roleProfileId: string;
  roleSource: string;
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
  executionMode: CodexAgentAdapterExecutionMode;
  command: string;
  currentWorkingDirectory: string;
  environment?: NodeJS.ProcessEnv;
  requestTimeoutMs: number;
  probeCacheTtlMs: number;
  maxRetryAttempts: number;
  retryBackoffMs: number;
}

/**
 * Implements Codex adapter baseline under unified agent protocol.
 *
 * Why this exists:
 * TK-036 needs first-batch adapter implementations to prove Codex can be
 * routed by shared contract and capability matrix without surface-specific branches.
 */
export class CodexAgentAdapter extends AgentProtocol {
  private readonly options: ResolvedCodexAgentAdapterOptions;
  private readonly execRunner: CodexExecRunner;
  private readonly cliExecOperationsRuntime: AgentCliExecOperationsRuntime;
  private readonly usesInjectedExecRunner: boolean;
  private readonly inflightCliExecutions = new Map<string, CodexCliExecutionState>();
  private probeCache: CodexProbeCacheEntry | null = null;

  /**
   * Creates Codex adapter with optional identity and availability overrides.
   * @param options Adapter construction options.
   */
  public constructor(options: CodexAgentAdapterOptions = {}) {
    super();
    this.options = {
      agentId: options.agentId ?? CODEX_DEFAULT_AGENT_ID,
      role: options.role ?? CODEX_DEFAULT_ROLE,
      roleProfileId: options.roleProfileId ?? CODEX_DEFAULT_ROLE_PROFILE_ID,
      roleSource: options.roleSource ?? CODEX_DEFAULT_ROLE_SOURCE,
      availabilityStatus: options.availabilityStatus ?? AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: options.unavailableReasons ?? [],
      executionMode: options.executionMode ?? CodexAgentAdapterExecutionMode.BASELINE,
      command: options.command ?? CODEX_COMMAND,
      currentWorkingDirectory: options.currentWorkingDirectory ?? process.cwd(),
      environment: options.environment,
      requestTimeoutMs: options.requestTimeoutMs ?? CODEX_DEFAULT_TIMEOUT_MS,
      probeCacheTtlMs: options.probeCacheTtlMs ?? CODEX_DEFAULT_PROBE_CACHE_TTL_MS,
      maxRetryAttempts: options.maxRetryAttempts ?? DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS,
      retryBackoffMs: options.retryBackoffMs ?? DEFAULT_AGENT_CLI_EXEC_RETRY_BACKOFF_MS,
    };
    this.cliExecOperationsRuntime = new AgentCliExecOperationsRuntime(
      CODEX_SURFACE,
      this.options.maxRetryAttempts,
      this.options.retryBackoffMs,
    );
    this.usesInjectedExecRunner = options.execRunner !== undefined;
    this.execRunner =
      options.execRunner ??
      ((request) => {
        return this.executeCodexCli(request);
      });
  }

  /**
   * Resolves execution environment with explicit adapter overrides taking precedence.
   * @returns Environment payload for Codex CLI process launch.
   */
  private resolveEnvironment(): NodeJS.ProcessEnv {
    return {
      ...process.env,
      ...(this.options.environment ?? {}),
    };
  }

  /**
   * Probes Codex adapter identity, availability, and capability matrix.
   * @param _request Probe request payload.
   * @returns Probe result payload.
   */
  public override async probe(request: AgentProbeRequest): Promise<AgentProbeResult> {
    const runtimeProbe = await this.resolveProbeResolution(request.signal);
    return {
      identity: {
        agentId: this.options.agentId,
        role: this.options.role,
        surface: CODEX_SURFACE,
        roleProfileId: this.options.roleProfileId,
        roleSource: this.options.roleSource,
      },
      availabilityStatus: this.mergeAvailabilityStatus(
        this.options.availabilityStatus,
        runtimeProbe.availabilityStatus,
      ),
      capabilityMatrix: this.createCapabilityMatrix(),
      unavailableReasons: [
        ...this.options.unavailableReasons,
        ...runtimeProbe.unavailableReasons,
      ].filter((reason, index, list) => list.indexOf(reason) === index),
    };
  }

  /**
   * Invokes one stage using Codex baseline behavior.
   * @param request Stage invocation request payload.
   * @returns Stage invocation result payload.
   */
  public override async invokeStage(
    request: AgentInvokeStageRequest,
  ): Promise<AgentInvokeStageResult> {
    if (this.options.executionMode === CodexAgentAdapterExecutionMode.BASELINE) {
      return {
        output: {
          adapterSurface: CODEX_SURFACE,
          routeKey: request.routeKey,
          stageId: request.stageId,
          echoedInput: request.input,
        },
        elapsedMs: 1,
      };
    }

    const execution = this.ensureCliExecution({
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      input: request.input,
      timeoutMs: this.resolveInvokeTimeoutMs(request),
      ...(request.signal ? { signal: request.signal } : {}),
    });
    const executionResult = await execution.resultPromise;
    const parsedOutput = this.parseCodexCliOutput(executionResult, AgentCliExecOperation.INVOKE);
    return {
      output: {
        adapterSurface: CODEX_SURFACE,
        routeKey: request.routeKey,
        stageId: request.stageId,
        responseText: parsedOutput.responseText,
        threadId: parsedOutput.threadId,
        warnings: parsedOutput.warnings,
        echoedInput: request.input,
      },
      ...(parsedOutput.usage ? { usage: parsedOutput.usage } : {}),
      elapsedMs: executionResult.elapsedMs,
    };
  }

  /**
   * Streams baseline status/completed events for Codex stage execution.
   * @param request Stream-events request payload.
   * @returns Async iterable of stream events.
   */
  public override async *streamEvents(
    request: AgentStreamEventsRequest,
  ): AsyncIterable<AgentStreamEvent> {
    if (this.options.executionMode === CodexAgentAdapterExecutionMode.BASELINE) {
      const timestamp = new Date().toISOString();
      yield {
        eventType: AgentStreamEventType.STATUS,
        timestamp,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'running',
          surface: CODEX_SURFACE,
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
          status: 'completed',
          surface: CODEX_SURFACE,
        },
      };
      return;
    }

    const execution = this.ensureCliExecution({
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      input: request.input,
      timeoutMs: this.resolveStreamTimeoutMs(request),
    });
    yield* this.consumeCliExecutionEvents(execution);
  }

  /**
   * Requests confirmation via Codex adapter baseline flow.
   * @param _request Confirmation request payload.
   * @returns Confirmation decision payload.
   */
  public override async requestConfirmation(
    _request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    if (this.options.executionMode === CodexAgentAdapterExecutionMode.CLI_EXEC) {
      return {
        decision: AgentConfirmationDecision.REVISE,
        reason: 'codex-cli-confirmation-gate-unsupported',
        constraints: ['escalate_to_human_gate'],
        decidedAt: new Date().toISOString(),
      };
    }
    return {
      decision: AgentConfirmationDecision.APPROVE,
      reason: 'codex-adapter-baseline-approved',
      constraints: [],
      decidedAt: new Date().toISOString(),
    };
  }

  /**
   * Cancels one ongoing Codex execution scope.
   * @param request Cancellation request payload.
   * @returns Cancellation acknowledgement payload.
   */
  public override async cancel(request: AgentCancelRequest): Promise<AgentCancelResult> {
    if (this.options.executionMode === CodexAgentAdapterExecutionMode.CLI_EXEC) {
      return {
        acknowledged: false,
        scope: request.scope,
        reason: request.reason,
        cancelledAt: new Date().toISOString(),
      };
    }
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
  private createCapabilityMatrix(): AgentProbeResult['capabilityMatrix'] {
    const capabilitySupport =
      this.options.executionMode === CodexAgentAdapterExecutionMode.CLI_EXEC
        ? CODEX_REAL_CAPABILITY_SUPPORT
        : CODEX_BASELINE_CAPABILITY_SUPPORT;
    const supportsCancellation =
      this.options.executionMode !== CodexAgentAdapterExecutionMode.CLI_EXEC;
    const capabilityStates = Object.values(AgentCapability).map((capability) => ({
      capability,
      supportLevel: capabilitySupport[capability],
    }));

    return {
      capabilityStates,
      timeout: {
        supportsAgentInvocationTimeout: true,
        supportsStageTimeoutSignal: true,
        supportsFlowTimeoutSignal: true,
        minTimeoutMs: 500,
        maxTimeoutMs: CODEX_REPOSITORY_REVIEW_TIMEOUT_MS,
      },
      cancellation: {
        supportsCancel: supportsCancellation,
        supportsReasonPropagation: supportsCancellation,
        supportsAbortSignal: supportsCancellation,
      },
      contextWindow: {
        maxInputTokens: 128000,
        maxOutputTokens: 16000,
        supportsAutoTruncation: true,
      },
    };
  }

  /**
   * Resolves probe result for the current execution mode with short-lived caching.
   * @returns Probe availability resolution.
   */
  private async resolveProbeResolution(signal?: AbortSignal): Promise<CodexProbeResolution> {
    if (this.options.executionMode === CodexAgentAdapterExecutionMode.BASELINE) {
      return {
        availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        unavailableReasons: [],
      };
    }

    if (this.options.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: [],
      };
    }

    const now = Date.now();
    if (this.probeCache && this.probeCache.expiresAt > now) {
      return this.probeCache.resolution;
    }

    const resolution = await this.executeHealthProbe(signal);
    this.probeCache = {
      expiresAt: now + this.options.probeCacheTtlMs,
      resolution,
    };
    return resolution;
  }

  /**
   * Executes one real Codex health probe using non-interactive CLI mode.
   * @returns Probe availability resolution.
   */
  private async executeHealthProbe(signal?: AbortSignal): Promise<CodexProbeResolution> {
    try {
      const executionResult = await this.runCodexOperation({
        prompt: CODEX_HEALTH_CHECK_PROMPT,
        timeoutMs: this.options.requestTimeoutMs,
        signal,
        operation: AgentCliExecOperation.PROBE,
      });
      const parsedOutput = this.parseCodexCliOutput(executionResult, AgentCliExecOperation.PROBE);
      if (parsedOutput.responseText.trim() !== CODEX_HEALTH_CHECK_EXPECTED_RESPONSE) {
        return {
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [
            `health_check_invalid_response:${CODEX_SURFACE}:${this.cliExecOperationsRuntime.sanitizeReasonSegment(parsedOutput.responseText)}`,
          ],
        };
      }

      return {
        availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        unavailableReasons: [],
      };
    } catch (error) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: this.resolveProbeFailureReasons(error),
      };
    }
  }

  /**
   * Runs one Codex CLI operation and maps launch/process failures into protocol errors.
   * @param request Operation request payload.
   * @returns Raw CLI execution result.
   */
  private async runCodexOperation(
    request: Pick<CodexExecRunnerRequest, 'prompt' | 'timeoutMs' | 'signal' | 'operation'> & {
      commandArguments?: string[];
      executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>;
    },
  ): Promise<CodexExecRunnerResult> {
    try {
      return await this.cliExecOperationsRuntime.executeWithRetry(
        request.operation,
        async (remainingTimeoutMs) => {
          return await this.execRunner({
            command: this.options.command,
            commandArguments:
              request.commandArguments ?? this.resolveCommandArguments(request.executionPolicy),
            cwd: this.options.currentWorkingDirectory,
            env: this.resolveEnvironment(),
            prompt: request.prompt,
            timeoutMs: remainingTimeoutMs ?? request.timeoutMs,
            signal: request.signal,
            operation: request.operation,
          });
        },
        {
          signal: request.signal,
          timeoutMs: request.timeoutMs,
        },
      );
    } catch (error) {
      if (
        error instanceof RuntimeError &&
        (error.code === GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED ||
          error.code === GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED)
      ) {
        throw error;
      }

      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        request.operation === AgentCliExecOperation.PROBE
          ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
          : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        `Codex ${request.operation} failed: ${standardizedError.message}`,
        {
          surface: CODEX_SURFACE,
          operation: request.operation,
        },
      );
    }
  }

  /**
   * Parses stdout/stderr emitted by `codex exec --json`.
   * @param executionResult Raw CLI execution result.
   * @param operation Current operation label.
   * @returns Normalized Codex output payload.
   */
  private parseCodexCliOutput(
    executionResult: CodexExecRunnerResult,
    operation: AgentCliExecOperation,
  ): CodexCliParsedOutput {
    const jsonEvents: CodexCliJsonEvent[] = executionResult.stdout
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('{'))
      .map((line) => JSON.parse(line) as CodexCliJsonEvent);

    const completedMessage = jsonEvents
      .filter((event) => event.type === 'item.completed' && event.item?.type === 'agent_message')
      .map((event) => event.item?.text ?? '')
      .filter((text) => text.trim().length > 0)
      .at(-1);

    if (!completedMessage) {
      throw new RuntimeError(
        operation === AgentCliExecOperation.PROBE
          ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
          : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        `Codex ${operation} returned no completed agent_message event.`,
        this.cliExecOperationsRuntime.createRedactedProcessDetails({
          surface: CODEX_SURFACE,
          operation,
          stdout: executionResult.stdout,
          stderr: executionResult.stderr,
        }),
      );
    }

    const turnCompletedEvent = jsonEvents.find((event) => event.type === 'turn.completed');
    const threadStartedEvent = jsonEvents.find((event) => event.type === 'thread.started');
    const usage = turnCompletedEvent?.usage
      ? {
          inputTokens: turnCompletedEvent.usage.input_tokens,
          outputTokens: turnCompletedEvent.usage.output_tokens,
          totalTokens:
            turnCompletedEvent.usage.total_tokens ??
            [turnCompletedEvent.usage.input_tokens, turnCompletedEvent.usage.output_tokens]
              .filter((value): value is number => typeof value === 'number')
              .reduce((sum, value) => sum + value, 0),
        }
      : undefined;

    return {
      responseText: completedMessage,
      threadId: threadStartedEvent?.thread_id ?? null,
      ...(usage ? { usage } : {}),
      warnings: executionResult.stderr
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    };
  }

  /**
   * Converts one stage invocation request into a Codex prompt payload.
   * @param request Stage invocation request payload.
   * @returns Rendered prompt string.
   */
  private renderInvokePrompt(request: AgentInvokeStageRequest): string {
    const renderedInput = JSON.stringify(request.input, null, 2);
    return [
      'You are executing one Repo AI Governor stage through Codex CLI.',
      `Route Key: ${request.routeKey}`,
      `Stage ID: ${request.stageId}`,
      'Treat the following JSON payload as the canonical stage input.',
      renderedInput,
    ].join('\n\n');
  }

  private renderRepositoryReviewPrompt(request: AgentInvokeStageRequest): string {
    const userMessage =
      typeof request.input.userMessage === 'string' && request.input.userMessage.trim().length > 0
        ? request.input.userMessage.trim()
        : 'Review the current repository changes.';
    const governorInstructions =
      typeof request.input.governorInstructions === 'string' &&
      request.input.governorInstructions.trim().length > 0
        ? request.input.governorInstructions.trim()
        : null;

    return [
      'You are executing one Repo AI Governor repository review stage through Codex CLI.',
      `Original user request: ${userMessage}`,
      'Review the current repository uncommitted changes and produce findings-first concise markdown with concrete file references when possible.',
      ...(governorInstructions
        ? [`Additional Governor instructions:\n${governorInstructions}`]
        : []),
    ].join('\n\n');
  }

  private ensureCliExecution(request: CodexCliExecutionRequest): CodexCliExecutionState {
    const key = this.createCliExecutionKey(request);
    const existingExecution = this.inflightCliExecutions.get(key);
    if (existingExecution) {
      return existingExecution;
    }

    const executionState: CodexCliExecutionState = {
      key,
      events: [],
      waiters: new Set(),
      stdout: '',
      stderr: '',
      stdoutLineBuffer: '',
      stderrLineBuffer: '',
      settled: false,
      accumulatedAssistantText: '',
      cliOutputSequence: 0,
      startedAtMs: null,
      resultPromise: Promise.resolve({
        stdout: '',
        stderr: '',
        exitCode: null,
        signal: null,
        elapsedMs: 0,
      }),
      cleanupTimer: null,
      progressTimer: null,
    };
    executionState.resultPromise = this.startCliExecution(executionState, request);
    this.inflightCliExecutions.set(key, executionState);
    return executionState;
  }

  private createCliExecutionKey(request: CodexCliExecutionRequest): string {
    return [request.processId, request.executionId, request.stageId, request.routeKey].join(':');
  }

  private async startCliExecution(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
  ): Promise<CodexExecRunnerResult> {
    try {
      state.startedAtMs = Date.now();
      if (this.shouldUseRepositoryReviewCommand(request)) {
        this.startRepositoryReviewProgress(state, request);
      }
      const executionPolicy = resolveAgentStageExecutionPolicy(request.input);
      const prompt = this.shouldUseRepositoryReviewCommand(request)
        ? this.renderRepositoryReviewPrompt(request)
        : this.renderInvokePrompt(request);
      const commandArguments = this.resolveInvokeCommandArguments(request, executionPolicy);
      if (this.usesInjectedExecRunner) {
        const executionResult = await this.runCodexOperation({
          prompt,
          timeoutMs: request.timeoutMs,
          signal: request.signal,
          operation: AgentCliExecOperation.INVOKE,
          executionPolicy,
          commandArguments,
        });
        state.stdout = executionResult.stdout;
        state.stderr = executionResult.stderr;
        this.ingestCodexStdout(state, request, executionResult.stdout, true);
        this.ingestCodexStderr(state, request, executionResult.stderr, true);
        if (!state.events.some((event) => event.eventType === AgentStreamEventType.COMPLETED)) {
          this.pushCliExecutionEvent(state, {
            eventType: AgentStreamEventType.COMPLETED,
            timestamp: new Date().toISOString(),
            processId: request.processId,
            executionId: request.executionId,
            stageId: request.stageId,
            routeKey: request.routeKey,
            payload: {
              status: 'completed',
              surface: CODEX_SURFACE,
              ...(state.accumulatedAssistantText
                ? { responseText: state.accumulatedAssistantText }
                : {}),
            },
          });
        }
        this.finishCliExecution(state);
        return executionResult;
      }

      const executionResult = await this.executeCodexCliStreaming(request, state);
      this.finishCliExecution(state);
      return executionResult;
    } catch (error) {
      const standardizedError = standardizeError(error);
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.FAILED,
        timestamp: new Date().toISOString(),
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'failed',
          surface: CODEX_SURFACE,
          message: standardizedError.message,
        },
      });
      this.finishCliExecution(state);
      throw error;
    }
  }

  private async *consumeCliExecutionEvents(
    state: CodexCliExecutionState,
  ): AsyncIterable<AgentStreamEvent> {
    let cursor = 0;
    while (true) {
      while (cursor < state.events.length) {
        const event = state.events[cursor];
        cursor += 1;
        if (event) {
          yield event;
        }
      }

      if (state.settled) {
        return;
      }

      await new Promise<void>((resolve) => {
        state.waiters.add(resolve);
      });
    }
  }

  private pushCliExecutionEvent(state: CodexCliExecutionState, event: AgentStreamEvent): void {
    state.events.push(event);
    for (const waiter of state.waiters) {
      waiter();
    }
    state.waiters.clear();
  }

  private finishCliExecution(state: CodexCliExecutionState): void {
    state.settled = true;
    if (state.progressTimer) {
      clearInterval(state.progressTimer);
      state.progressTimer = null;
    }
    for (const waiter of state.waiters) {
      waiter();
    }
    state.waiters.clear();
    if (state.cleanupTimer) {
      clearTimeout(state.cleanupTimer);
    }
    state.cleanupTimer = setTimeout(() => {
      this.inflightCliExecutions.delete(state.key);
    }, CODEX_CLI_EXECUTION_CACHE_TTL_MS);
    state.cleanupTimer.unref?.();
  }

  private ingestCodexStdout(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    chunk: string,
    flushPartial = false,
  ): void {
    state.stdoutLineBuffer += chunk;
    const lines = state.stdoutLineBuffer.split(/\r?\n/u);
    state.stdoutLineBuffer = lines.pop() ?? '';
    for (const line of lines) {
      this.processCodexJsonLine(state, request, line);
    }
    if (flushPartial && state.stdoutLineBuffer.trim().length > 0) {
      this.processCodexJsonLine(state, request, state.stdoutLineBuffer);
      state.stdoutLineBuffer = '';
    }
  }

  private ingestCodexStderr(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    chunk: string,
    flushPartial = false,
  ): void {
    state.stderrLineBuffer += chunk;
    const lines = state.stderrLineBuffer.split(/\r?\n/u);
    state.stderrLineBuffer = lines.pop() ?? '';
    for (const line of lines) {
      this.pushCliOutputLineEvent(state, request, 'stderr', line);
    }
    if (flushPartial && state.stderrLineBuffer.trim().length > 0) {
      this.pushCliOutputLineEvent(state, request, 'stderr', state.stderrLineBuffer);
      state.stderrLineBuffer = '';
    }
  }

  private processCodexJsonLine(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    line: string,
  ): void {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('{')) {
      this.pushCliOutputLineEvent(state, request, 'stdout', trimmedLine);
      return;
    }

    let parsedEvent: CodexCliJsonEvent;
    try {
      parsedEvent = JSON.parse(trimmedLine) as CodexCliJsonEvent;
    } catch {
      return;
    }

    if (parsedEvent.type === 'thread.started') {
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.STATUS,
        timestamp: new Date().toISOString(),
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'running',
          surface: CODEX_SURFACE,
          detail: this.shouldUseRepositoryReviewCommand(request)
            ? 'Codex repository review thread started.'
            : 'Codex thread started.',
        },
      });
      return;
    }

    if (parsedEvent.type === 'turn.started') {
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.STATUS,
        timestamp: new Date().toISOString(),
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'running',
          surface: CODEX_SURFACE,
          detail: this.shouldUseRepositoryReviewCommand(request)
            ? 'Codex repository review started; waiting for CLI output.'
            : 'Codex turn started.',
        },
      });
      return;
    }

    if (parsedEvent.type === 'item.completed' && parsedEvent.item?.type === 'agent_message') {
      const assistantText = parsedEvent.item.text?.trim() ?? '';
      if (assistantText.length === 0) {
        return;
      }
      state.accumulatedAssistantText = assistantText;
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.TOKEN,
        timestamp: new Date().toISOString(),
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          surface: CODEX_SURFACE,
          text: assistantText,
          accumulatedText: assistantText,
        },
      });
      return;
    }

    if (parsedEvent.type === 'turn.completed') {
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.COMPLETED,
        timestamp: new Date().toISOString(),
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'completed',
          surface: CODEX_SURFACE,
          ...(state.accumulatedAssistantText
            ? { responseText: state.accumulatedAssistantText }
            : {}),
        },
      });
    }
  }

  private pushCliOutputLineEvent(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    source: 'stderr' | 'stdout',
    line: string,
  ): void {
    const sanitizedLine = this.normalizeCliOutputLine(line);
    if (!sanitizedLine) {
      return;
    }
    const detail = `${CODEX_SURFACE} ${source}: ${sanitizedLine}`;
    const activityKey = `${CODEX_SURFACE}:${source}:${String(state.cliOutputSequence++)}`;
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp: new Date().toISOString(),
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'running',
        surface: CODEX_SURFACE,
        detail,
        activityKey,
      },
    });
  }

  private startRepositoryReviewProgress(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
  ): void {
    this.pushRepositoryReviewProgressEvent(state, request);
    state.progressTimer = setInterval(() => {
      if (state.settled) {
        return;
      }
      this.pushRepositoryReviewProgressEvent(state, request);
    }, CODEX_REPOSITORY_REVIEW_PROGRESS_INTERVAL_MS);
    state.progressTimer.unref?.();
  }

  private pushRepositoryReviewProgressEvent(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
  ): void {
    const elapsedSeconds =
      state.startedAtMs === null
        ? 0
        : Math.max(0, Math.floor((Date.now() - state.startedAtMs) / 1000));
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp: new Date().toISOString(),
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'running',
        surface: CODEX_SURFACE,
        detail:
          elapsedSeconds === 0
            ? 'Codex repository review is running; waiting for CLI output.'
            : `Codex repository review is still running (${elapsedSeconds}s elapsed); waiting for CLI output.`,
      },
    });
  }

  private normalizeCliOutputLine(line: string): string | undefined {
    const normalizedLine = line.replace(/\s+/gu, ' ').trim();
    if (normalizedLine.length === 0) {
      return undefined;
    }
    return normalizedLine.length > 240 ? `${normalizedLine.slice(0, 237)}...` : normalizedLine;
  }

  /**
   * Maps one probe failure into unavailable reason codes consumed by CLI diagnostics.
   * @param error Unknown probe failure.
   * @returns Stable unavailable-reason list.
   */
  private resolveProbeFailureReasons(error: unknown): string[] {
    const standardizedError = standardizeError(error);
    const detail = this.cliExecOperationsRuntime
      .collectErrorDetail(error, standardizedError.message)
      .toLowerCase();

    if (this.isMissingCommandFailure(error, detail)) {
      return [`command_missing:${CODEX_SURFACE}:${this.options.command}`];
    }

    if (this.isCredentialFailure(detail)) {
      return [`credential_missing:${CODEX_SURFACE}`];
    }

    if (this.isTimeoutFailure(detail)) {
      return [`health_check_timeout:${CODEX_SURFACE}`];
    }

    return [
      `health_check_failed:${CODEX_SURFACE}:${this.cliExecOperationsRuntime.sanitizeReasonSegment(standardizedError.message)}`,
    ];
  }

  /**
   * Checks whether one failure was caused by a missing Codex executable.
   * @param error Unknown error object.
   * @param detail Lower-cased detail string.
   * @returns True when the failure indicates executable-not-found.
   */
  private isMissingCommandFailure(error: unknown, detail: string): boolean {
    if (detail.includes('enoent')) {
      return true;
    }
    if (!error || typeof error !== 'object') {
      return false;
    }
    return (error as { code?: unknown }).code === 'ENOENT';
  }

  /**
   * Checks whether one failure looks like an authentication/login problem.
   * @param detail Lower-cased detail string.
   * @returns True when the failure likely indicates missing credentials.
   */
  private isCredentialFailure(detail: string): boolean {
    return /(auth|login|credential|api key|not logged in|unauthorized|forbidden)/u.test(detail);
  }

  /**
   * Checks whether one failure was caused by timeout/abort semantics.
   * @param detail Lower-cased detail string.
   * @returns True when the failure indicates a timeout.
   */
  private isTimeoutFailure(detail: string): boolean {
    return /(timed out|timeout|aborterror|aborted)/u.test(detail);
  }

  /**
   * Merges configured availability and runtime probe availability.
   * @param configuredStatus Status resolved from static config.
   * @param runtimeStatus Status resolved by Codex runtime probe.
   * @returns Merged availability status.
   */
  private mergeAvailabilityStatus(
    configuredStatus: AgentAvailabilityStatus,
    runtimeStatus: AgentAvailabilityStatus,
  ): AgentAvailabilityStatus {
    if (
      configuredStatus === AgentAvailabilityStatus.UNAVAILABLE ||
      runtimeStatus === AgentAvailabilityStatus.UNAVAILABLE
    ) {
      return AgentAvailabilityStatus.UNAVAILABLE;
    }
    if (
      configuredStatus === AgentAvailabilityStatus.DEGRADED ||
      runtimeStatus === AgentAvailabilityStatus.DEGRADED
    ) {
      return AgentAvailabilityStatus.DEGRADED;
    }
    return AgentAvailabilityStatus.AVAILABLE;
  }

  /**
   * Executes one non-interactive `codex exec --json` request.
   * @param request Execution request payload.
   * @returns Captured process result.
   */
  private async executeCodexCli(request: CodexExecRunnerRequest): Promise<CodexExecRunnerResult> {
    return new Promise<CodexExecRunnerResult>((resolve, reject) => {
      const startedAt = Date.now();
      const child = spawn(request.command, [...request.commandArguments], {
        cwd: request.cwd,
        env: request.env,
        stdio: ['pipe', 'pipe', 'pipe'],
        signal: request.signal,
      });

      let stdout = '';
      let stderr = '';
      let settled = false;
      let timedOut = false;

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, request.timeoutMs);

      const finishReject = (error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutHandle);
        reject(error);
      };

      child.on('error', (error) => {
        finishReject(error);
      });

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        stdout += chunk;
      });

      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk: string) => {
        stderr += chunk;
      });

      child.on('close', (exitCode, signal) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutHandle);

        if (timedOut) {
          reject(
            new RuntimeError(
              request.operation === AgentCliExecOperation.PROBE
                ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
                : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
              `Codex ${request.operation} timed out after ${request.timeoutMs}ms.`,
              this.cliExecOperationsRuntime.createRedactedProcessDetails({
                surface: CODEX_SURFACE,
                operation: request.operation,
                timeoutMs: request.timeoutMs,
                stdout,
                stderr,
                exitCode,
                signal,
              }),
            ),
          );
          return;
        }

        if (exitCode !== 0) {
          reject(
            new RuntimeError(
              request.operation === AgentCliExecOperation.PROBE
                ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
                : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
              `Codex ${request.operation} exited with code ${exitCode ?? 'null'}.`,
              this.cliExecOperationsRuntime.createRedactedProcessDetails({
                surface: CODEX_SURFACE,
                operation: request.operation,
                stdout,
                stderr,
                exitCode,
                signal,
              }),
            ),
          );
          return;
        }

        resolve({
          stdout,
          stderr,
          exitCode,
          signal,
          elapsedMs: Date.now() - startedAt,
        });
      });

      child.stdin.end(request.prompt);
    });
  }

  private async executeCodexCliStreaming(
    request: CodexCliExecutionRequest,
    state: CodexCliExecutionState,
  ): Promise<CodexExecRunnerResult> {
    return await new Promise<CodexExecRunnerResult>((resolve, reject) => {
      const startedAt = Date.now();
      const executionPolicy = resolveAgentStageExecutionPolicy(request.input);
      const prompt = this.shouldUseRepositoryReviewCommand(request)
        ? this.renderRepositoryReviewPrompt(request)
        : this.renderInvokePrompt(request);
      const child = spawn(
        this.options.command,
        [...this.resolveInvokeCommandArguments(request, executionPolicy)],
        {
          cwd: this.options.currentWorkingDirectory,
          env: this.resolveEnvironment(),
          stdio: ['pipe', 'pipe', 'pipe'],
          ...(request.signal ? { signal: request.signal } : {}),
        },
      );

      let settled = false;
      let timedOut = false;

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, request.timeoutMs);

      const finishReject = (error: unknown): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutHandle);
        reject(error);
      };

      child.on('error', (error) => {
        finishReject(error);
      });

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        state.stdout += chunk;
        this.ingestCodexStdout(state, request, chunk);
      });

      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk: string) => {
        state.stderr += chunk;
        this.ingestCodexStderr(state, request, chunk);
      });

      child.on('close', (exitCode, signal) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutHandle);
        this.ingestCodexStdout(state, request, '', true);
        this.ingestCodexStderr(state, request, '', true);

        if (timedOut) {
          reject(
            new RuntimeError(
              GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
              `Codex invoke timed out after ${request.timeoutMs}ms.`,
              this.cliExecOperationsRuntime.createRedactedProcessDetails({
                surface: CODEX_SURFACE,
                operation: AgentCliExecOperation.INVOKE,
                timeoutMs: request.timeoutMs,
                stdout: state.stdout,
                stderr: state.stderr,
                exitCode,
                signal,
              }),
            ),
          );
          return;
        }

        if (exitCode !== 0) {
          reject(
            new RuntimeError(
              GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
              `Codex invoke exited with code ${exitCode ?? 'null'}.`,
              this.cliExecOperationsRuntime.createRedactedProcessDetails({
                surface: CODEX_SURFACE,
                operation: AgentCliExecOperation.INVOKE,
                stdout: state.stdout,
                stderr: state.stderr,
                exitCode,
                signal,
              }),
            ),
          );
          return;
        }

        resolve({
          stdout: state.stdout,
          stderr: state.stderr,
          exitCode,
          signal,
          elapsedMs: Date.now() - startedAt,
        });
      });

      child.stdin.end(prompt);
    });
  }

  private resolveCommandArguments(
    executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>,
  ): string[] {
    return [
      ...CODEX_EXEC_ARGS,
      ...(executionPolicy?.interactionMode === AgentStageExecutionMode.CHAT_ONLY &&
      executionPolicy?.toolUsePolicy === AgentStageToolUsePolicy.FORBIDDEN
        ? CODEX_CHAT_ONLY_EXEC_ARGS
        : []),
    ];
  }

  private resolveInvokeCommandArguments(
    request: AgentInvokeStageRequest,
    executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>,
  ): string[] {
    if (this.shouldUseRepositoryReviewCommand(request)) {
      return [...CODEX_REVIEW_EXEC_ARGS];
    }

    return this.resolveCommandArguments(executionPolicy);
  }

  private shouldUseRepositoryReviewCommand(request: {
    routeKey: string;
    input: Record<string, unknown>;
  }): boolean {
    return (
      request.routeKey === 'session.main.role.reviewer' &&
      request.input.roleId === 'reviewer' &&
      request.input.reviewScope === CODEX_REPOSITORY_REVIEW_SCOPE
    );
  }

  private resolveInvokeTimeoutMs(request: AgentInvokeStageRequest): number {
    if (typeof request.agentInvocationTimeoutMs === 'number') {
      return request.agentInvocationTimeoutMs;
    }

    if (this.shouldUseRepositoryReviewCommand(request)) {
      return CODEX_REPOSITORY_REVIEW_TIMEOUT_MS;
    }

    return this.options.requestTimeoutMs;
  }

  private resolveStreamTimeoutMs(request: AgentStreamEventsRequest): number {
    if (this.shouldUseRepositoryReviewCommand(request)) {
      return CODEX_REPOSITORY_REVIEW_TIMEOUT_MS;
    }

    return this.options.requestTimeoutMs;
  }
}
