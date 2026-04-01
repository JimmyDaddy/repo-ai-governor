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
import { ClaudeCodeAgentAdapterExecutionMode } from './constants/claude-code-agent-adapter.constant.js';
import type {
  ClaudeCodeAgentAdapterOptions,
  ClaudeCodeExecRunner,
  ClaudeCodeExecRunnerRequest,
  ClaudeCodeExecRunnerResult,
} from './types/interfaces/claude-code-agent-adapter.interface.js';

const CLAUDE_CODE_DEFAULT_AGENT_ID = 'claude-code-default-agent';
const CLAUDE_CODE_DEFAULT_ROLE = 'coder';
const CLAUDE_CODE_DEFAULT_ROLE_PROFILE_ID = 'coder-default';
const CLAUDE_CODE_DEFAULT_ROLE_SOURCE = 'default';
const CLAUDE_CODE_SURFACE = 'claude-code';
const CLAUDE_CODE_DIRECT_COMMAND = 'claude';
const CLAUDE_CODE_FALLBACK_COMMAND = 'claude-code';
const CLAUDE_CODE_DEFAULT_TIMEOUT_MS = 30000;
const CLAUDE_CODE_REPOSITORY_REVIEW_TIMEOUT_MS = 600000;
const CLAUDE_CODE_REPOSITORY_REVIEW_PROGRESS_INTERVAL_MS = 15000;
const CLAUDE_CODE_DEFAULT_PROBE_CACHE_TTL_MS = 30000;
const CLAUDE_CODE_CLI_EXECUTION_CACHE_TTL_MS = 30000;
const CLAUDE_CODE_CHAT_ONLY_ARGS = ['--tools', ''] as const;
const CLAUDE_CODE_REPOSITORY_REVIEW_SCOPE = 'uncommitted_changes';
const CLAUDE_CODE_REPOSITORY_REVIEW_ARGS = [
  '--allowedTools',
  'Bash(git:*) Bash(rg:*) Bash(sed:*) Bash(cat:*) Bash(ls:*) Bash(find:*) Read Grep Glob LS',
] as const;
const CLAUDE_CODE_HEALTH_CHECK_PROMPT = 'Respond with exactly OK.';
const CLAUDE_CODE_HEALTH_CHECK_EXPECTED_RESPONSE = 'OK';

const CLAUDE_CODE_BASELINE_CAPABILITY_SUPPORT: Record<
  AgentCapability,
  AgentCapabilitySupportLevel
> = {
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

const CLAUDE_CODE_REAL_CAPABILITY_SUPPORT: Record<AgentCapability, AgentCapabilitySupportLevel> = {
  [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STRUCTURED_OUTPUT]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.PARALLEL_TASK]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.STREAMING]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.CONFIRMATION_GATE]: AgentCapabilitySupportLevel.UNSUPPORTED,
  [AgentCapability.CANCELLATION]: AgentCapabilitySupportLevel.UNSUPPORTED,
  [AgentCapability.AGENT_TIMEOUT]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STAGE_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.FLOW_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CONTEXT_WINDOW]: AgentCapabilitySupportLevel.SUPPORTED,
};

interface ClaudeCodeCliParsedOutput {
  responseText: string;
  warnings: string[];
}

interface ClaudeCodeCliExecutionRequest {
  processId: string;
  executionId: string;
  stageId: string;
  routeKey: string;
  input: Record<string, unknown>;
  timeoutMs: number;
  signal?: AbortSignal;
}

interface ClaudeCodeCliExecutionState {
  key: string;
  events: AgentStreamEvent[];
  waiters: Set<() => void>;
  stderrLineBuffer: string;
  stdoutChunkObserved: boolean;
  stderrChunkObserved: boolean;
  settled: boolean;
  accumulatedAssistantText: string;
  cliOutputSequence: number;
  startedAtMs: number | null;
  resultPromise: Promise<ClaudeCodeExecRunnerResult>;
  cleanupTimer: NodeJS.Timeout | null;
  progressTimer: NodeJS.Timeout | null;
}

interface ClaudeCodeProbeResolution {
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
}

interface ClaudeCodeProbeCacheEntry {
  expiresAt: number;
  resolution: ClaudeCodeProbeResolution;
}

interface ResolvedClaudeCodeAgentAdapterOptions {
  agentId: string;
  role: string;
  roleProfileId: string;
  roleSource: string;
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
  executionMode: ClaudeCodeAgentAdapterExecutionMode;
  command: string;
  currentWorkingDirectory: string;
  environment?: NodeJS.ProcessEnv;
  requestTimeoutMs: number;
  probeCacheTtlMs: number;
  maxRetryAttempts: number;
  retryBackoffMs: number;
}

/**
 * Implements Claude Code adapter under the shared agent protocol.
 */
export class ClaudeCodeAgentAdapter extends AgentProtocol {
  private readonly options: ResolvedClaudeCodeAgentAdapterOptions;
  private readonly execRunner: ClaudeCodeExecRunner;
  private readonly cliExecOperationsRuntime: AgentCliExecOperationsRuntime;
  private readonly usesInjectedExecRunner: boolean;
  private readonly inflightCliExecutions = new Map<string, ClaudeCodeCliExecutionState>();
  private probeCache: ClaudeCodeProbeCacheEntry | null = null;

  /**
   * Creates Claude Code adapter with optional identity and runtime overrides.
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
      executionMode: options.executionMode ?? ClaudeCodeAgentAdapterExecutionMode.BASELINE,
      command: options.command ?? CLAUDE_CODE_DIRECT_COMMAND,
      currentWorkingDirectory: options.currentWorkingDirectory ?? process.cwd(),
      environment: options.environment,
      requestTimeoutMs: options.requestTimeoutMs ?? CLAUDE_CODE_DEFAULT_TIMEOUT_MS,
      probeCacheTtlMs: options.probeCacheTtlMs ?? CLAUDE_CODE_DEFAULT_PROBE_CACHE_TTL_MS,
      maxRetryAttempts: options.maxRetryAttempts ?? DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS,
      retryBackoffMs: options.retryBackoffMs ?? DEFAULT_AGENT_CLI_EXEC_RETRY_BACKOFF_MS,
    };
    this.cliExecOperationsRuntime = new AgentCliExecOperationsRuntime(
      CLAUDE_CODE_SURFACE,
      this.options.maxRetryAttempts,
      this.options.retryBackoffMs,
    );
    this.execRunner =
      options.execRunner ??
      ((request) => {
        return this.executeClaudeCodeCli(request);
      });
    this.usesInjectedExecRunner = options.execRunner !== undefined;
  }

  /**
   * Resolves process environment with adapter overrides taking precedence.
   * @returns Environment payload for Claude Code CLI process launch.
   */
  private resolveEnvironment(): NodeJS.ProcessEnv {
    return {
      ...process.env,
      ...(this.options.environment ?? {}),
    };
  }

  /**
   * Probes Claude Code adapter identity, availability, and capability matrix.
   * @param _request Probe request payload.
   * @returns Probe result payload.
   */
  public override async probe(request: AgentProbeRequest): Promise<AgentProbeResult> {
    const runtimeProbe = await this.resolveProbeResolution(request.signal);
    return {
      identity: {
        agentId: this.options.agentId,
        role: this.options.role,
        surface: CLAUDE_CODE_SURFACE,
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
   * Invokes one stage using either baseline behavior or real Claude Code CLI execution.
   * @param request Stage invocation request payload.
   * @returns Stage invocation result payload.
   */
  public override async invokeStage(
    request: AgentInvokeStageRequest,
  ): Promise<AgentInvokeStageResult> {
    if (this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.BASELINE) {
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
    const parsedOutput = this.parseClaudeCodeCliOutput(
      executionResult,
      AgentCliExecOperation.INVOKE,
    );
    return {
      output: {
        adapterSurface: CLAUDE_CODE_SURFACE,
        routeKey: request.routeKey,
        stageId: request.stageId,
        responseText: parsedOutput.responseText,
        warnings: parsedOutput.warnings,
        echoedInput: request.input,
      },
      elapsedMs: executionResult.elapsedMs,
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
    if (this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.BASELINE) {
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
          status: 'completed',
          surface: CLAUDE_CODE_SURFACE,
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
      ...(request.signal ? { signal: request.signal } : {}),
    });
    yield* this.consumeCliExecutionEvents(execution);
  }

  private ensureCliExecution(request: ClaudeCodeCliExecutionRequest): ClaudeCodeCliExecutionState {
    const key = this.createCliExecutionKey(request);
    const existingExecution = this.inflightCliExecutions.get(key);
    if (existingExecution) {
      return existingExecution;
    }

    const executionState: ClaudeCodeCliExecutionState = {
      key,
      events: [],
      waiters: new Set(),
      stderrLineBuffer: '',
      stdoutChunkObserved: false,
      stderrChunkObserved: false,
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

  private createCliExecutionKey(request: ClaudeCodeCliExecutionRequest): string {
    return [request.processId, request.executionId, request.stageId, request.routeKey].join(':');
  }

  private async startCliExecution(
    state: ClaudeCodeCliExecutionState,
    request: ClaudeCodeCliExecutionRequest,
  ): Promise<ClaudeCodeExecRunnerResult> {
    try {
      state.startedAtMs = Date.now();
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.STATUS,
        timestamp: new Date().toISOString(),
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'running',
          surface: CLAUDE_CODE_SURFACE,
          detail: this.shouldUseRepositoryReviewMode(request)
            ? 'Claude Code repository review started; waiting for CLI output.'
            : 'Claude Code turn started.',
        },
      });
      if (this.shouldUseRepositoryReviewMode(request)) {
        this.startRepositoryReviewProgress(state, request);
      }

      const executionPolicy = resolveAgentStageExecutionPolicy(request.input);
      const executionResult = await this.runClaudeCodeOperation({
        prompt: this.shouldUseRepositoryReviewMode(request)
          ? this.renderRepositoryReviewPrompt(request)
          : this.renderInvokePrompt(request),
        timeoutMs: request.timeoutMs,
        signal: request.signal,
        operation: AgentCliExecOperation.INVOKE,
        executionPolicy,
        commandArgumentsPrefixResolver: (basePrefix, resolvedExecutionPolicy) =>
          this.resolveInvokeCommandArgumentsPrefix(
            {
              processId: request.processId,
              executionId: request.executionId,
              stageId: request.stageId,
              routeKey: request.routeKey,
              input: request.input,
            },
            basePrefix,
            resolvedExecutionPolicy,
          ),
        onStdoutChunk: (chunk) => {
          this.ingestClaudeStdout(state, request, chunk);
        },
        onStderrChunk: (chunk) => {
          this.ingestClaudeStderr(state, request, chunk);
        },
      });

      if (this.usesInjectedExecRunner) {
        if (!state.stdoutChunkObserved && executionResult.stdout.length > 0) {
          this.ingestClaudeStdout(state, request, executionResult.stdout, true);
        }
        if (!state.stderrChunkObserved && executionResult.stderr.length > 0) {
          this.ingestClaudeStderr(state, request, executionResult.stderr, true);
        }
      } else {
        this.ingestClaudeStderr(state, request, '', true);
      }

      const completedResponseText =
        state.accumulatedAssistantText.length > 0
          ? state.accumulatedAssistantText
          : executionResult.stdout.trim();
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.COMPLETED,
        timestamp: new Date().toISOString(),
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'completed',
          surface: CLAUDE_CODE_SURFACE,
          ...(completedResponseText.length > 0 ? { responseText: completedResponseText } : {}),
        },
      });
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
          surface: CLAUDE_CODE_SURFACE,
          message: standardizedError.message,
        },
      });
      this.finishCliExecution(state);
      throw error;
    }
  }

  private async *consumeCliExecutionEvents(
    state: ClaudeCodeCliExecutionState,
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

  private pushCliExecutionEvent(state: ClaudeCodeCliExecutionState, event: AgentStreamEvent): void {
    state.events.push(event);
    for (const waiter of state.waiters) {
      waiter();
    }
    state.waiters.clear();
  }

  private finishCliExecution(state: ClaudeCodeCliExecutionState): void {
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
    }, CLAUDE_CODE_CLI_EXECUTION_CACHE_TTL_MS);
    state.cleanupTimer.unref?.();
  }

  private ingestClaudeStdout(
    state: ClaudeCodeCliExecutionState,
    request: ClaudeCodeCliExecutionRequest,
    chunk: string,
    _flushPartial = false,
  ): void {
    if (chunk.length === 0) {
      return;
    }

    state.stdoutChunkObserved = true;
    state.accumulatedAssistantText += chunk;
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.TOKEN,
      timestamp: new Date().toISOString(),
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        surface: CLAUDE_CODE_SURFACE,
        text: chunk,
        accumulatedText: state.accumulatedAssistantText,
      },
    });
  }

  private ingestClaudeStderr(
    state: ClaudeCodeCliExecutionState,
    request: ClaudeCodeCliExecutionRequest,
    chunk: string,
    flushPartial = false,
  ): void {
    if (chunk.length > 0) {
      state.stderrChunkObserved = true;
    }
    state.stderrLineBuffer += chunk;
    const lines = state.stderrLineBuffer.split(/\r?\n/u);
    state.stderrLineBuffer = lines.pop() ?? '';
    for (const line of lines) {
      this.pushClaudeCliOutputLineEvent(state, request, line);
    }
    if (flushPartial && state.stderrLineBuffer.trim().length > 0) {
      this.pushClaudeCliOutputLineEvent(state, request, state.stderrLineBuffer);
      state.stderrLineBuffer = '';
    }
  }

  private pushClaudeCliOutputLineEvent(
    state: ClaudeCodeCliExecutionState,
    request: ClaudeCodeCliExecutionRequest,
    line: string,
  ): void {
    const normalizedLine = this.normalizeCliOutputLine(line);
    if (!normalizedLine) {
      return;
    }
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp: new Date().toISOString(),
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'running',
        surface: CLAUDE_CODE_SURFACE,
        detail: `${CLAUDE_CODE_SURFACE} stderr: ${normalizedLine}`,
        activityKey: `${CLAUDE_CODE_SURFACE}:stderr:${String(state.cliOutputSequence++)}`,
      },
    });
  }

  private startRepositoryReviewProgress(
    state: ClaudeCodeCliExecutionState,
    request: ClaudeCodeCliExecutionRequest,
  ): void {
    this.pushRepositoryReviewProgressEvent(state, request);
    state.progressTimer = setInterval(() => {
      if (state.settled) {
        return;
      }
      this.pushRepositoryReviewProgressEvent(state, request);
    }, CLAUDE_CODE_REPOSITORY_REVIEW_PROGRESS_INTERVAL_MS);
    state.progressTimer.unref?.();
  }

  private pushRepositoryReviewProgressEvent(
    state: ClaudeCodeCliExecutionState,
    request: ClaudeCodeCliExecutionRequest,
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
        surface: CLAUDE_CODE_SURFACE,
        detail:
          elapsedSeconds === 0
            ? 'Claude Code repository review is running; waiting for CLI output.'
            : `Claude Code repository review is still running (${elapsedSeconds}s elapsed); waiting for CLI output.`,
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
   * Requests confirmation through Claude Code adapter flow.
   * @param _request Confirmation request payload.
   * @returns Confirmation decision payload.
   */
  public override async requestConfirmation(
    _request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    if (this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC) {
      return {
        decision: AgentConfirmationDecision.REVISE,
        reason: 'claude-code-cli-confirmation-gate-unsupported',
        constraints: ['escalate_to_human_gate'],
        decidedAt: new Date().toISOString(),
      };
    }

    return {
      decision: AgentConfirmationDecision.APPROVE,
      reason: 'claude-code-adapter-baseline-approved',
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
    if (this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC) {
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
   * Creates capability matrix aligned with the current execution mode.
   * @returns Capability matrix payload.
   */
  private createCapabilityMatrix(): AgentProbeResult['capabilityMatrix'] {
    const capabilitySupport =
      this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC
        ? CLAUDE_CODE_REAL_CAPABILITY_SUPPORT
        : CLAUDE_CODE_BASELINE_CAPABILITY_SUPPORT;
    const supportsCancellation =
      this.options.executionMode !== ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC;
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
        maxTimeoutMs: 120000,
      },
      cancellation: {
        supportsCancel: supportsCancellation,
        supportsReasonPropagation: supportsCancellation,
        supportsAbortSignal: supportsCancellation,
      },
      contextWindow: {
        maxInputTokens: 200000,
        maxOutputTokens: 16000,
        supportsAutoTruncation: true,
      },
    };
  }

  /**
   * Resolves probe result for the current execution mode with short-lived caching.
   * @returns Probe availability resolution.
   */
  private async resolveProbeResolution(signal?: AbortSignal): Promise<ClaudeCodeProbeResolution> {
    if (this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.BASELINE) {
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
   * Executes one real Claude Code health probe using non-interactive print mode.
   * @returns Probe availability resolution.
   */
  private async executeHealthProbe(signal?: AbortSignal): Promise<ClaudeCodeProbeResolution> {
    try {
      const executionResult = await this.runClaudeCodeOperation({
        prompt: CLAUDE_CODE_HEALTH_CHECK_PROMPT,
        timeoutMs: this.options.requestTimeoutMs,
        signal,
        operation: AgentCliExecOperation.PROBE,
      });
      const parsedOutput = this.parseClaudeCodeCliOutput(
        executionResult,
        AgentCliExecOperation.PROBE,
      );
      if (parsedOutput.responseText.trim() !== CLAUDE_CODE_HEALTH_CHECK_EXPECTED_RESPONSE) {
        return {
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [
            `health_check_invalid_response:${CLAUDE_CODE_SURFACE}:${this.cliExecOperationsRuntime.sanitizeReasonSegment(parsedOutput.responseText)}`,
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
   * Runs one Claude Code CLI operation and maps failures into protocol errors.
   * @param request Operation request payload.
   * @returns Raw CLI execution result.
   */
  private async runClaudeCodeOperation(
    request: Pick<ClaudeCodeExecRunnerRequest, 'prompt' | 'timeoutMs' | 'signal' | 'operation'> & {
      commandArgumentsPrefixResolver?: (
        basePrefix: string[],
        executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>,
      ) => string[];
      executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>;
      onStdoutChunk?: (chunk: string) => void;
      onStderrChunk?: (chunk: string) => void;
    },
  ): Promise<ClaudeCodeExecRunnerResult> {
    try {
      return await this.cliExecOperationsRuntime.executeWithRetry(
        request.operation,
        async (remainingTimeoutMs) => {
          let lastError: unknown;
          for (const commandSpec of this.resolveCommandCandidates()) {
            try {
              return await this.execRunner({
                command: commandSpec.command,
                commandArgumentsPrefix:
                  request.commandArgumentsPrefixResolver?.(
                    commandSpec.commandArgumentsPrefix,
                    request.executionPolicy,
                  ) ??
                  this.resolveCommandArgumentsPrefix(
                    commandSpec.commandArgumentsPrefix,
                    request.executionPolicy,
                  ),
                cwd: this.options.currentWorkingDirectory,
                env: this.resolveEnvironment(),
                prompt: request.prompt,
                timeoutMs: remainingTimeoutMs ?? request.timeoutMs,
                signal: request.signal,
                operation: request.operation,
                onStdoutChunk: request.onStdoutChunk,
                onStderrChunk: request.onStderrChunk,
              });
            } catch (error) {
              lastError = error;
              const detail = this.cliExecOperationsRuntime
                .collectErrorDetail(error, standardizeError(error).message)
                .toLowerCase();
              if (!this.isMissingCommandFailure(error, detail)) {
                throw error;
              }
            }
          }
          throw lastError;
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
        `Claude Code ${request.operation} failed: ${standardizedError.message}`,
        {
          surface: CLAUDE_CODE_SURFACE,
          operation: request.operation,
        },
      );
    }
  }

  /**
   * Resolves preferred and fallback Claude Code command entrypoints.
   * @returns Ordered command specs.
   */
  private resolveCommandCandidates(): Array<{
    command: string;
    commandArgumentsPrefix: string[];
  }> {
    if (this.options.command === CLAUDE_CODE_DIRECT_COMMAND) {
      return [
        {
          command: CLAUDE_CODE_DIRECT_COMMAND,
          commandArgumentsPrefix: [],
        },
        {
          command: CLAUDE_CODE_FALLBACK_COMMAND,
          commandArgumentsPrefix: [],
        },
      ];
    }

    if (this.options.command === CLAUDE_CODE_FALLBACK_COMMAND) {
      return [
        {
          command: CLAUDE_CODE_FALLBACK_COMMAND,
          commandArgumentsPrefix: [],
        },
        {
          command: CLAUDE_CODE_DIRECT_COMMAND,
          commandArgumentsPrefix: [],
        },
      ];
    }

    return [
      {
        command: this.options.command,
        commandArgumentsPrefix: [],
      },
    ];
  }

  /**
   * Parses stdout/stderr emitted by Claude Code print mode.
   * @param executionResult Raw CLI execution result.
   * @param operation Current operation label.
   * @returns Normalized Claude Code output payload.
   */
  private parseClaudeCodeCliOutput(
    executionResult: ClaudeCodeExecRunnerResult,
    operation: AgentCliExecOperation,
  ): ClaudeCodeCliParsedOutput {
    if (executionResult.exitCode !== 0) {
      throw new RuntimeError(
        operation === AgentCliExecOperation.PROBE
          ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
          : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        `Claude Code ${operation} failed with exit code ${executionResult.exitCode}.`,
        this.cliExecOperationsRuntime.createRedactedProcessDetails({
          surface: CLAUDE_CODE_SURFACE,
          operation,
          stdout: executionResult.stdout,
          stderr: executionResult.stderr,
          exitCode: executionResult.exitCode,
          signal: executionResult.signal,
        }),
      );
    }

    const responseText = executionResult.stdout.trim();
    if (!responseText) {
      throw new RuntimeError(
        operation === AgentCliExecOperation.PROBE
          ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
          : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        `Claude Code ${operation} returned no response text.`,
        this.cliExecOperationsRuntime.createRedactedProcessDetails({
          surface: CLAUDE_CODE_SURFACE,
          operation,
          stdout: executionResult.stdout,
          stderr: executionResult.stderr,
        }),
      );
    }

    return {
      responseText,
      warnings: executionResult.stderr
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    };
  }

  /**
   * Converts one stage invocation request into a Claude Code prompt payload.
   * @param request Stage invocation request payload.
   * @returns Rendered prompt string.
   */
  private renderInvokePrompt(request: AgentInvokeStageRequest): string {
    const renderedInput = JSON.stringify(request.input, null, 2);
    return [
      'You are executing one Repo AI Governor stage through Claude Code CLI.',
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
      'You are executing one Repo AI Governor repository review stage through Claude Code.',
      `Original user request: ${userMessage}`,
      'Review the current repository uncommitted changes and produce findings-first concise markdown with concrete file references when possible.',
      ...(governorInstructions
        ? [`Additional Governor instructions:\n${governorInstructions}`]
        : []),
    ].join('\n\n');
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
      return [`command_missing:${CLAUDE_CODE_SURFACE}:${this.options.command}`];
    }

    if (this.isCredentialFailure(detail)) {
      return [`credential_missing:${CLAUDE_CODE_SURFACE}`];
    }

    if (this.isTimeoutFailure(detail)) {
      return [`health_check_timeout:${CLAUDE_CODE_SURFACE}`];
    }

    if (this.isRateLimitFailure(detail)) {
      return [`health_check_failed:${CLAUDE_CODE_SURFACE}:rate_limited`];
    }

    return [
      `health_check_failed:${CLAUDE_CODE_SURFACE}:${this.cliExecOperationsRuntime.sanitizeReasonSegment(standardizedError.message)}`,
    ];
  }

  /**
   * Checks whether one failure was caused by a missing Claude Code executable.
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
    return /(auth|login|credential|api key|token|oauth|not logged in|unauthorized|forbidden)/u.test(
      detail,
    );
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
   * Checks whether one failure indicates a rate-limit or overload condition.
   * @param detail Lower-cased detail string.
   * @returns True when the failure indicates rate limiting.
   */
  private isRateLimitFailure(detail: string): boolean {
    return /(rate limit|429|overloaded|quota|budget)/u.test(detail);
  }

  /**
   * Merges configured adapter availability with runtime probe availability.
   * @param configuredStatus Availability status from config or constructor override.
   * @param runtimeStatus Availability status from live probe.
   * @returns Merged status.
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
   * Executes one Claude Code CLI process in non-interactive print mode.
   * Why: this adapter must stay non-interactive under unified governance, so provider-level
   * permission prompts are bypassed and approval remains owned by the outer governance layer.
   * @param request Exec-runner request payload.
   * @returns Raw process execution result.
   */
  private async executeClaudeCodeCli(
    request: ClaudeCodeExecRunnerRequest,
  ): Promise<ClaudeCodeExecRunnerResult> {
    const startedAt = Date.now();
    const args = [
      ...request.commandArgumentsPrefix,
      '--print',
      '--output-format',
      'text',
      '--no-session-persistence',
      '--dangerously-skip-permissions',
      '--add-dir',
      request.cwd,
      request.prompt,
    ];

    return await new Promise<ClaudeCodeExecRunnerResult>((resolveResult, reject) => {
      const childProcess = spawn(request.command, args, {
        cwd: request.cwd,
        env: request.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        ...(request.signal ? { signal: request.signal } : {}),
      });
      let stdout = '';
      let stderr = '';
      let settled = false;

      const settle = (
        result: ClaudeCodeExecRunnerResult | RuntimeError,
        isError: boolean,
      ): void => {
        if (settled) {
          return;
        }
        settled = true;
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        if (isError) {
          reject(result);
          return;
        }
        resolveResult(result as ClaudeCodeExecRunnerResult);
      };

      const timeoutHandle = setTimeout(() => {
        childProcess.kill('SIGTERM');
        settle(
          new RuntimeError(
            request.operation === AgentCliExecOperation.PROBE
              ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
              : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
            `Claude Code ${request.operation} timed out after ${request.timeoutMs}ms.`,
            this.cliExecOperationsRuntime.createRedactedProcessDetails({
              surface: CLAUDE_CODE_SURFACE,
              operation: request.operation,
              timeoutMs: request.timeoutMs,
              stdout,
              stderr,
            }),
          ),
          true,
        );
      }, request.timeoutMs);

      childProcess.stdout.setEncoding('utf8');
      childProcess.stderr.setEncoding('utf8');
      childProcess.stdout.on('data', (chunk: string) => {
        stdout += chunk;
        request.onStdoutChunk?.(chunk);
      });
      childProcess.stderr.on('data', (chunk: string) => {
        stderr += chunk;
        request.onStderrChunk?.(chunk);
      });
      childProcess.on('error', (error) => {
        settle(
          new RuntimeError(
            request.operation === AgentCliExecOperation.PROBE
              ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
              : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
            `Claude Code ${request.operation} process launch failed: ${standardizeError(error).message}`,
            this.cliExecOperationsRuntime.createRedactedProcessDetails({
              surface: CLAUDE_CODE_SURFACE,
              operation: request.operation,
              command: request.command,
              stdout,
              stderr,
            }),
          ),
          true,
        );
      });
      childProcess.on('close', (exitCode, signal) => {
        settle(
          {
            stdout,
            stderr,
            exitCode,
            signal,
            elapsedMs: Date.now() - startedAt,
          },
          false,
        );
      });
    });
  }

  private resolveCommandArgumentsPrefix(
    commandArgumentsPrefix: string[],
    executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>,
  ): string[] {
    return [
      ...commandArgumentsPrefix,
      ...(executionPolicy?.interactionMode === AgentStageExecutionMode.CHAT_ONLY &&
      executionPolicy?.toolUsePolicy === AgentStageToolUsePolicy.FORBIDDEN
        ? CLAUDE_CODE_CHAT_ONLY_ARGS
        : []),
    ];
  }

  private resolveInvokeCommandArgumentsPrefix(
    request: AgentInvokeStageRequest,
    commandArgumentsPrefix: string[],
    executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>,
  ): string[] {
    if (this.shouldUseRepositoryReviewMode(request)) {
      return [...commandArgumentsPrefix, ...CLAUDE_CODE_REPOSITORY_REVIEW_ARGS];
    }

    return this.resolveCommandArgumentsPrefix(commandArgumentsPrefix, executionPolicy);
  }

  private shouldUseRepositoryReviewMode(request: {
    routeKey: string;
    input: Record<string, unknown>;
  }): boolean {
    return (
      request.routeKey === 'session.main.role.reviewer' &&
      request.input.roleId === 'reviewer' &&
      request.input.reviewScope === CLAUDE_CODE_REPOSITORY_REVIEW_SCOPE
    );
  }

  private resolveInvokeTimeoutMs(request: AgentInvokeStageRequest): number {
    if (typeof request.agentInvocationTimeoutMs === 'number') {
      return request.agentInvocationTimeoutMs;
    }

    if (this.shouldUseRepositoryReviewMode(request)) {
      return CLAUDE_CODE_REPOSITORY_REVIEW_TIMEOUT_MS;
    }

    return this.options.requestTimeoutMs;
  }

  private resolveStreamTimeoutMs(request: AgentStreamEventsRequest): number {
    if (typeof request.agentInvocationTimeoutMs === 'number') {
      return request.agentInvocationTimeoutMs;
    }

    if (this.shouldUseRepositoryReviewMode(request)) {
      return CLAUDE_CODE_REPOSITORY_REVIEW_TIMEOUT_MS;
    }

    return this.options.requestTimeoutMs;
  }
}
