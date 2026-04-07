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
  AgentStageContinuationStatus,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
  type AgentStreamEvent,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
  DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS,
  DEFAULT_AGENT_CLI_EXEC_RETRY_BACKOFF_MS,
  createLayeredHealthCheckFromLegacyReasons,
  resolveAgentStageExecutionPolicy,
} from '@repo-ai-governor/adapter-sdk';
import {
  AdapterRequestCancellationMode,
  AdapterTransportKind,
  GovernorErrorCode,
  RuntimeError,
  matchesHealthCheckEchoResponse,
  standardizeError,
} from '@repo-ai-governor/shared';
import { GithubCopilotAgentAdapterExecutionMode } from './constants/github-copilot-agent-adapter.constant.js';
import type {
  GithubCopilotAgentAdapterOptions,
  GithubCopilotExecRunner,
  GithubCopilotExecRunnerRequest,
  GithubCopilotExecRunnerResult,
} from './types/interfaces/github-copilot-agent-adapter.interface.js';

const GITHUB_COPILOT_DEFAULT_AGENT_ID = 'github-copilot-default-agent';
const GITHUB_COPILOT_DEFAULT_ROLE = 'coder';
const GITHUB_COPILOT_DEFAULT_ROLE_PROFILE_ID = 'coder-default';
const GITHUB_COPILOT_DEFAULT_ROLE_SOURCE = 'default';
const GITHUB_COPILOT_SURFACE = 'github-copilot';
const GITHUB_COPILOT_DIRECT_COMMAND = 'copilot';
const GITHUB_COPILOT_GH_COMMAND = 'gh';
const GITHUB_COPILOT_DEFAULT_TIMEOUT_MS = 30000;
const GITHUB_COPILOT_REPOSITORY_REVIEW_TIMEOUT_MS = 600000;
const GITHUB_COPILOT_REPOSITORY_REVIEW_PROGRESS_INTERVAL_MS = 15000;
const GITHUB_COPILOT_DEFAULT_PROBE_CACHE_TTL_MS = 30000;
const GITHUB_COPILOT_CLI_EXECUTION_CACHE_TTL_MS = 30000;
const GITHUB_COPILOT_CHAT_ONLY_ARGS = ['--available-tools', ''] as const;
const GITHUB_COPILOT_REPOSITORY_REVIEW_SCOPE = 'uncommitted_changes';
const GITHUB_COPILOT_REPOSITORY_REVIEW_ARGS = [
  '--available-tools',
  'shell',
  '--allow-tool',
  'shell(git:*)',
  '--allow-tool',
  'shell(rg:*)',
  '--allow-tool',
  'shell(sed:*)',
  '--allow-tool',
  'shell(cat:*)',
  '--allow-tool',
  'shell(ls:*)',
  '--allow-tool',
  'shell(find:*)',
] as const;
const GITHUB_COPILOT_HEALTH_CHECK_PROMPT = 'Respond with exactly OK.';
const GITHUB_COPILOT_HEALTH_CHECK_EXPECTED_RESPONSE = 'OK';

const GITHUB_COPILOT_BASELINE_CAPABILITY_SUPPORT: Record<
  AgentCapability,
  AgentCapabilitySupportLevel
> = {
  [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STRUCTURED_OUTPUT]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.PARALLEL_TASK]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.STREAMING]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CONFIRMATION_GATE]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.CANCELLATION]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.AGENT_TIMEOUT]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STAGE_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.FLOW_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.CONTEXT_WINDOW]: AgentCapabilitySupportLevel.SUPPORTED,
};

const GITHUB_COPILOT_REAL_CAPABILITY_SUPPORT: Record<AgentCapability, AgentCapabilitySupportLevel> =
  {
    [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.SUPPORTED,
    [AgentCapability.STRUCTURED_OUTPUT]: AgentCapabilitySupportLevel.DEGRADED,
    [AgentCapability.PARALLEL_TASK]: AgentCapabilitySupportLevel.DEGRADED,
    [AgentCapability.STREAMING]: AgentCapabilitySupportLevel.SUPPORTED,
    [AgentCapability.CONFIRMATION_GATE]: AgentCapabilitySupportLevel.UNSUPPORTED,
    [AgentCapability.CANCELLATION]: AgentCapabilitySupportLevel.UNSUPPORTED,
    [AgentCapability.AGENT_TIMEOUT]: AgentCapabilitySupportLevel.SUPPORTED,
    [AgentCapability.STAGE_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
    [AgentCapability.FLOW_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
    [AgentCapability.CONTEXT_WINDOW]: AgentCapabilitySupportLevel.SUPPORTED,
  };

interface GithubCopilotCliJsonEvent {
  type?: string;
  data?: {
    content?: string;
    text?: string;
    delta?: string;
    message?: string;
    errorType?: string;
    statusCode?: number;
  };
  exitCode?: number;
  usage?: AgentInvokeStageResult['usage'];
}

interface GithubCopilotCliParsedOutput {
  responseText: string;
  warnings: string[];
}

interface GithubCopilotCliExecutionRequest {
  processId: string;
  executionId: string;
  stageId: string;
  routeKey: string;
  input: Record<string, unknown>;
  timeoutMs: number;
  signal?: AbortSignal;
}

interface GithubCopilotCliExecutionState {
  key: string;
  events: AgentStreamEvent[];
  waiters: Set<() => void>;
  stdoutLineBuffer: string;
  stderrLineBuffer: string;
  stdoutChunkObserved: boolean;
  stderrChunkObserved: boolean;
  settled: boolean;
  accumulatedAssistantText: string;
  cliOutputSequence: number;
  startedAtMs: number | null;
  startedAt: string | null;
  lastTransportActivityAt: string | null;
  lastSemanticProgressAt: string | null;
  latestEventAt: string | null;
  latestEventType: string | null;
  latestTextPreview: string | null;
  resultPromise: Promise<GithubCopilotExecRunnerResult>;
  cleanupTimer: NodeJS.Timeout | null;
  progressTimer: NodeJS.Timeout | null;
}

type GithubCopilotCliLivenessStatus =
  | 'starting'
  | 'running'
  | 'graceful_interrupting'
  | 'completed'
  | 'failed';
type GithubCopilotCliCancelMechanism = 'none' | 'process_signal' | 'abort_signal';

interface GithubCopilotProbeResolution {
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
}

interface GithubCopilotProbeCacheEntry {
  expiresAt: number;
  resolution: GithubCopilotProbeResolution;
}

interface ResolvedGithubCopilotAgentAdapterOptions {
  agentId: string;
  role: string;
  roleProfileId: string;
  roleSource: string;
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
  executionMode: GithubCopilotAgentAdapterExecutionMode;
  command: string;
  currentWorkingDirectory: string;
  environment?: NodeJS.ProcessEnv;
  requestTimeoutMs: number;
  probeCacheTtlMs: number;
  maxRetryAttempts: number;
  retryBackoffMs: number;
}

/**
 * Implements GitHub Copilot adapter under the shared agent protocol.
 */
export class GithubCopilotAgentAdapter extends AgentProtocol {
  private readonly options: ResolvedGithubCopilotAgentAdapterOptions;
  private readonly execRunner: GithubCopilotExecRunner;
  private readonly cliExecOperationsRuntime: AgentCliExecOperationsRuntime;
  private readonly usesInjectedExecRunner: boolean;
  private readonly inflightCliExecutions = new Map<string, GithubCopilotCliExecutionState>();
  private probeCache: GithubCopilotProbeCacheEntry | null = null;

  /**
   * Creates GitHub Copilot adapter with optional identity and runtime overrides.
   * @param options Adapter construction options.
   */
  public constructor(options: GithubCopilotAgentAdapterOptions = {}) {
    super();
    this.options = {
      agentId: options.agentId ?? GITHUB_COPILOT_DEFAULT_AGENT_ID,
      role: options.role ?? GITHUB_COPILOT_DEFAULT_ROLE,
      roleProfileId: options.roleProfileId ?? GITHUB_COPILOT_DEFAULT_ROLE_PROFILE_ID,
      roleSource: options.roleSource ?? GITHUB_COPILOT_DEFAULT_ROLE_SOURCE,
      availabilityStatus: options.availabilityStatus ?? AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: options.unavailableReasons ?? [],
      executionMode: options.executionMode ?? GithubCopilotAgentAdapterExecutionMode.BASELINE,
      command: options.command ?? GITHUB_COPILOT_DIRECT_COMMAND,
      currentWorkingDirectory: options.currentWorkingDirectory ?? process.cwd(),
      environment: options.environment,
      requestTimeoutMs: options.requestTimeoutMs ?? GITHUB_COPILOT_DEFAULT_TIMEOUT_MS,
      probeCacheTtlMs: options.probeCacheTtlMs ?? GITHUB_COPILOT_DEFAULT_PROBE_CACHE_TTL_MS,
      maxRetryAttempts: options.maxRetryAttempts ?? DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS,
      retryBackoffMs: options.retryBackoffMs ?? DEFAULT_AGENT_CLI_EXEC_RETRY_BACKOFF_MS,
    };
    this.cliExecOperationsRuntime = new AgentCliExecOperationsRuntime(
      GITHUB_COPILOT_SURFACE,
      this.options.maxRetryAttempts,
      this.options.retryBackoffMs,
    );
    this.execRunner =
      options.execRunner ??
      ((request) => {
        return this.executeGithubCopilotCli(request);
      });
    this.usesInjectedExecRunner = options.execRunner !== undefined;
  }

  /**
   * Resolves process environment with adapter overrides taking precedence.
   * @returns Environment payload for GitHub Copilot CLI process launch.
   */
  private resolveEnvironment(): NodeJS.ProcessEnv {
    return {
      ...process.env,
      ...(this.options.environment ?? {}),
    };
  }

  /**
   * Probes GitHub Copilot adapter identity, availability, and capability matrix.
   * @param _request Probe request payload.
   * @returns Probe result payload.
   */
  public override async probe(request: AgentProbeRequest): Promise<AgentProbeResult> {
    const runtimeProbe = await this.resolveProbeResolution(request.signal);
    const capabilityMatrix = this.createCapabilityMatrix();
    const availabilityStatus = this.mergeAvailabilityStatus(
      this.options.availabilityStatus,
      runtimeProbe.availabilityStatus,
    );
    const unavailableReasons = [
      ...this.options.unavailableReasons,
      ...runtimeProbe.unavailableReasons,
    ].filter((reason, index, list) => list.indexOf(reason) === index);
    const unsupportedCapabilities = (request.requiredCapabilities ?? []).filter((capability) => {
      const capabilityState = capabilityMatrix.capabilityStates.find(
        (candidateCapabilityState) => candidateCapabilityState.capability === capability,
      );
      return capabilityState?.supportLevel === AgentCapabilitySupportLevel.UNSUPPORTED;
    });
    const degradedCapabilities = (request.requiredCapabilities ?? []).filter((capability) => {
      const capabilityState = capabilityMatrix.capabilityStates.find(
        (candidateCapabilityState) => candidateCapabilityState.capability === capability,
      );
      return capabilityState?.supportLevel === AgentCapabilitySupportLevel.DEGRADED;
    });
    return {
      identity: {
        agentId: this.options.agentId,
        role: this.options.role,
        surface: GITHUB_COPILOT_SURFACE,
        roleProfileId: this.options.roleProfileId,
        roleSource: this.options.roleSource,
      },
      availabilityStatus,
      capabilityMatrix,
      unavailableReasons,
      healthCheck: createLayeredHealthCheckFromLegacyReasons({
        adapterId: this.options.agentId,
        surfaceId: GITHUB_COPILOT_SURFACE,
        availabilityStatus,
        selectedEntrypoint: this.options.command,
        routeKey: request.routeKey,
        routeRequirements: (request.requiredCapabilities ?? []).map(String),
        fallbackAllowed: true,
        unavailableReasons,
        unsupportedCapabilities: unsupportedCapabilities.map(String),
        degradedCapabilities: degradedCapabilities.map(String),
        transportKind:
          this.options.executionMode === GithubCopilotAgentAdapterExecutionMode.CLI_EXEC
            ? AdapterTransportKind.CLI_EXEC
            : AdapterTransportKind.BASELINE,
        requestCancellationMode:
          this.options.executionMode === GithubCopilotAgentAdapterExecutionMode.CLI_EXEC
            ? AdapterRequestCancellationMode.NOT_SUPPORTED
            : AdapterRequestCancellationMode.LOCAL_ABORT_ONLY,
      }),
    };
  }

  /**
   * Invokes one stage using either baseline behavior or real GitHub Copilot CLI execution.
   * @param request Stage invocation request payload.
   * @returns Stage invocation result payload.
   */
  public override async invokeStage(
    request: AgentInvokeStageRequest,
  ): Promise<AgentInvokeStageResult> {
    const unsupportedContinuation = this.createUnsupportedContinuationResult(request);
    if (this.options.executionMode === GithubCopilotAgentAdapterExecutionMode.BASELINE) {
      return {
        output: {
          adapterSurface: GITHUB_COPILOT_SURFACE,
          routeKey: request.routeKey,
          stageId: request.stageId,
          echoedInput: request.input,
        },
        ...(unsupportedContinuation
          ? {
              continuation: unsupportedContinuation,
            }
          : {}),
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
    const parsedOutput = this.parseGithubCopilotCliOutput(
      executionResult,
      AgentCliExecOperation.INVOKE,
    );
    return {
      output: {
        adapterSurface: GITHUB_COPILOT_SURFACE,
        routeKey: request.routeKey,
        stageId: request.stageId,
        responseText: parsedOutput.responseText,
        warnings: parsedOutput.warnings,
        echoedInput: request.input,
      },
      ...(unsupportedContinuation
        ? {
            continuation: unsupportedContinuation,
          }
        : {}),
      elapsedMs: executionResult.elapsedMs,
    };
  }

  private createUnsupportedContinuationResult(
    request: AgentInvokeStageRequest,
  ): AgentInvokeStageResult['continuation'] | undefined {
    if (!request.continuation) {
      return undefined;
    }

    return {
      status: AgentStageContinuationStatus.UNSUPPORTED,
      ...(request.continuation.laneKey ? { laneKey: request.continuation.laneKey } : {}),
    };
  }

  /**
   * Streams baseline status/completed events for GitHub Copilot stage execution.
   * @param request Stream-events request payload.
   * @returns Async iterable of stream events.
   */
  public override async *streamEvents(
    request: AgentStreamEventsRequest,
  ): AsyncIterable<AgentStreamEvent> {
    if (this.options.executionMode === GithubCopilotAgentAdapterExecutionMode.BASELINE) {
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
          surface: GITHUB_COPILOT_SURFACE,
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
          surface: GITHUB_COPILOT_SURFACE,
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

  private ensureCliExecution(
    request: GithubCopilotCliExecutionRequest,
  ): GithubCopilotCliExecutionState {
    const key = this.createCliExecutionKey(request);
    const existingExecution = this.inflightCliExecutions.get(key);
    if (existingExecution) {
      return existingExecution;
    }

    const executionState: GithubCopilotCliExecutionState = {
      key,
      events: [],
      waiters: new Set(),
      stdoutLineBuffer: '',
      stderrLineBuffer: '',
      stdoutChunkObserved: false,
      stderrChunkObserved: false,
      settled: false,
      accumulatedAssistantText: '',
      cliOutputSequence: 0,
      startedAtMs: null,
      startedAt: null,
      lastTransportActivityAt: null,
      lastSemanticProgressAt: null,
      latestEventAt: null,
      latestEventType: null,
      latestTextPreview: null,
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

  private createCliExecutionKey(request: GithubCopilotCliExecutionRequest): string {
    return [request.processId, request.executionId, request.stageId, request.routeKey].join(':');
  }

  private async startCliExecution(
    state: GithubCopilotCliExecutionState,
    request: GithubCopilotCliExecutionRequest,
  ): Promise<GithubCopilotExecRunnerResult> {
    try {
      state.startedAtMs = Date.now();
      state.startedAt = new Date().toISOString();
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.STATUS,
        timestamp: state.startedAt,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'running',
          surface: GITHUB_COPILOT_SURFACE,
          transportKind: AdapterTransportKind.CLI_EXEC,
          detail: this.shouldUseRepositoryReviewMode(request)
            ? 'GitHub Copilot repository review started; waiting for CLI output.'
            : 'GitHub Copilot turn started.',
          invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
            status: 'starting',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
          }),
        },
      });
      if (this.shouldUseRepositoryReviewMode(request)) {
        this.startRepositoryReviewProgress(state, request);
      }

      const executionPolicy = resolveAgentStageExecutionPolicy(request.input);
      const executionResult = await this.runGithubCopilotOperation({
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
          this.ingestGithubCopilotStdout(state, request, chunk);
        },
        onStderrChunk: (chunk) => {
          this.ingestGithubCopilotStderr(state, request, chunk);
        },
        onGracefulInterruptStart: (cancelMechanism) => {
          this.pushCliGracefulInterruptEvent(state, request, cancelMechanism);
        },
      });

      if (this.usesInjectedExecRunner) {
        if (!state.stdoutChunkObserved && executionResult.stdout.length > 0) {
          this.ingestGithubCopilotStdout(state, request, executionResult.stdout, true);
        }
        if (!state.stderrChunkObserved && executionResult.stderr.length > 0) {
          this.ingestGithubCopilotStderr(state, request, executionResult.stderr, true);
        }
      } else {
        this.ingestGithubCopilotStdout(state, request, '', true);
        this.ingestGithubCopilotStderr(state, request, '', true);
      }

      const completedAt = new Date().toISOString();
      this.recordCliTransportEvent(state, completedAt, AgentStreamEventType.COMPLETED);
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.COMPLETED,
        timestamp: completedAt,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'completed',
          surface: GITHUB_COPILOT_SURFACE,
          transportKind: AdapterTransportKind.CLI_EXEC,
          ...(state.accumulatedAssistantText.length > 0
            ? { responseText: state.accumulatedAssistantText }
            : {}),
          invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
            status: 'completed',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
            lastTerminalSignalAt: completedAt,
          }),
        },
      });
      this.finishCliExecution(state);
      return executionResult;
    } catch (error) {
      const standardizedError = standardizeError(error);
      const failedAt = new Date().toISOString();
      const partialOutputPreserved = state.accumulatedAssistantText.length > 0;
      const suspectReasonCodes = this.resolveCliFailureReasonCodes(error, partialOutputPreserved);
      const cancelMechanism = this.resolveCliFailureCancelMechanism(error, request);
      this.recordCliTransportEvent(
        state,
        failedAt,
        AgentStreamEventType.FAILED,
        partialOutputPreserved ? state.accumulatedAssistantText : standardizedError.message,
      );
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.FAILED,
        timestamp: failedAt,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'failed',
          surface: GITHUB_COPILOT_SURFACE,
          message: standardizedError.message,
          transportKind: AdapterTransportKind.CLI_EXEC,
          ...(partialOutputPreserved
            ? {
                accumulatedText: state.accumulatedAssistantText,
                responseText: state.accumulatedAssistantText,
              }
            : {}),
          invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
            status: 'failed',
            partialOutputPreserved,
            cancelMechanism,
            lastTerminalSignalAt: failedAt,
            ...(suspectReasonCodes.length > 0 ? { suspectReasonCodes } : {}),
          }),
        },
      });
      this.finishCliExecution(state);
      throw error;
    }
  }

  private async *consumeCliExecutionEvents(
    state: GithubCopilotCliExecutionState,
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

  private pushCliExecutionEvent(
    state: GithubCopilotCliExecutionState,
    event: AgentStreamEvent,
  ): void {
    state.events.push(event);
    for (const waiter of state.waiters) {
      waiter();
    }
    state.waiters.clear();
  }

  private finishCliExecution(state: GithubCopilotCliExecutionState): void {
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
    }, GITHUB_COPILOT_CLI_EXECUTION_CACHE_TTL_MS);
    state.cleanupTimer.unref?.();
  }

  private ingestGithubCopilotStdout(
    state: GithubCopilotCliExecutionState,
    request: GithubCopilotCliExecutionRequest,
    chunk: string,
    flushPartial = false,
  ): void {
    if (chunk.length > 0) {
      state.stdoutChunkObserved = true;
    }
    state.stdoutLineBuffer += chunk;
    const lines = state.stdoutLineBuffer.split(/\r?\n/u);
    state.stdoutLineBuffer = lines.pop() ?? '';
    for (const line of lines) {
      this.processGithubCopilotJsonLine(state, request, line);
    }
    if (flushPartial && state.stdoutLineBuffer.trim().length > 0) {
      this.processGithubCopilotJsonLine(state, request, state.stdoutLineBuffer);
      state.stdoutLineBuffer = '';
    }
  }

  private ingestGithubCopilotStderr(
    state: GithubCopilotCliExecutionState,
    request: GithubCopilotCliExecutionRequest,
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
      this.pushGithubCopilotOutputLineEvent(state, request, 'stderr', line);
    }
    if (flushPartial && state.stderrLineBuffer.trim().length > 0) {
      this.pushGithubCopilotOutputLineEvent(state, request, 'stderr', state.stderrLineBuffer);
      state.stderrLineBuffer = '';
    }
  }

  private processGithubCopilotJsonLine(
    state: GithubCopilotCliExecutionState,
    request: GithubCopilotCliExecutionRequest,
    line: string,
  ): void {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('{')) {
      this.pushGithubCopilotOutputLineEvent(state, request, 'stdout', trimmedLine);
      return;
    }

    let parsedEvent: GithubCopilotCliJsonEvent;
    try {
      parsedEvent = JSON.parse(trimmedLine) as GithubCopilotCliJsonEvent;
    } catch {
      return;
    }

    if (parsedEvent.type?.startsWith('assistant.')) {
      this.maybePushAssistantTokenDelta(state, request, parsedEvent);
      return;
    }

    if (this.pushAuxiliaryStatusEvent(state, request, parsedEvent)) {
      return;
    }

    if (parsedEvent.type === 'result' && parsedEvent.exitCode === 0) {
      const timestamp = new Date().toISOString();
      this.recordCliTransportEvent(state, timestamp, parsedEvent.type);
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.STATUS,
        timestamp,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'running',
          surface: GITHUB_COPILOT_SURFACE,
          transportKind: AdapterTransportKind.CLI_EXEC,
          detail: 'GitHub Copilot CLI result received.',
          invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
            status: 'running',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
          }),
        },
      });
    }
  }

  private pushAuxiliaryStatusEvent(
    state: GithubCopilotCliExecutionState,
    request: GithubCopilotCliExecutionRequest,
    parsedEvent: GithubCopilotCliJsonEvent,
  ): boolean {
    const eventType = parsedEvent.type?.trim();
    if (!eventType || eventType.startsWith('assistant.') || eventType === 'result') {
      return false;
    }

    const candidateText = this.normalizeCliOutputLine(this.extractAuxiliaryText(parsedEvent) ?? '');
    if (!candidateText) {
      return false;
    }

    const timestamp = new Date().toISOString();
    this.recordCliSemanticProgress(state, timestamp, eventType, candidateText);
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'running',
        surface: GITHUB_COPILOT_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail: `${GITHUB_COPILOT_SURFACE} ${eventType}: ${candidateText}`,
        activityKey: `${GITHUB_COPILOT_SURFACE}:${eventType}:${String(state.cliOutputSequence++)}`,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      },
    });
    return true;
  }

  private maybePushAssistantTokenDelta(
    state: GithubCopilotCliExecutionState,
    request: GithubCopilotCliExecutionRequest,
    parsedEvent: GithubCopilotCliJsonEvent,
  ): void {
    const candidateText = this.extractAssistantText(parsedEvent);
    if (!candidateText) {
      return;
    }

    const nextTokenState = this.resolveAssistantTokenState(
      state.accumulatedAssistantText,
      candidateText,
      parsedEvent.type === 'assistant.message',
      parsedEvent.data?.delta === candidateText,
    );
    if (!nextTokenState) {
      return;
    }

    state.accumulatedAssistantText = nextTokenState.accumulatedText;
    const timestamp = new Date().toISOString();
    this.recordCliSemanticProgress(
      state,
      timestamp,
      parsedEvent.type ?? AgentStreamEventType.TOKEN,
      nextTokenState.accumulatedText,
    );
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.TOKEN,
      timestamp,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        surface: GITHUB_COPILOT_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        text: nextTokenState.chunkText,
        accumulatedText: nextTokenState.accumulatedText,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      },
    });
  }

  private resolveAssistantTokenState(
    previousAccumulatedText: string,
    candidateText: string,
    isTerminalEvent: boolean,
    isDeltaEvent: boolean,
  ): { chunkText: string; accumulatedText: string } | null {
    if (candidateText === previousAccumulatedText) {
      return null;
    }

    if (isDeltaEvent) {
      return {
        chunkText: candidateText,
        accumulatedText: `${previousAccumulatedText}${candidateText}`,
      };
    }

    if (candidateText.startsWith(previousAccumulatedText)) {
      const chunkText = candidateText.slice(previousAccumulatedText.length);
      return chunkText.length > 0
        ? {
            chunkText,
            accumulatedText: candidateText,
          }
        : null;
    }

    if (previousAccumulatedText.startsWith(candidateText) && !isTerminalEvent) {
      return null;
    }

    if (!isTerminalEvent) {
      return {
        chunkText: candidateText,
        accumulatedText: `${previousAccumulatedText}${candidateText}`,
      };
    }

    return {
      chunkText: candidateText,
      accumulatedText: candidateText,
    };
  }

  private pushGithubCopilotOutputLineEvent(
    state: GithubCopilotCliExecutionState,
    request: GithubCopilotCliExecutionRequest,
    source: 'stderr' | 'stdout',
    line: string,
  ): void {
    const normalizedLine = this.normalizeCliOutputLine(line);
    if (!normalizedLine) {
      return;
    }
    const timestamp = new Date().toISOString();
    this.recordCliTransportEvent(state, timestamp, source, normalizedLine);
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'running',
        surface: GITHUB_COPILOT_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail: `${GITHUB_COPILOT_SURFACE} ${source}: ${normalizedLine}`,
        activityKey: `${GITHUB_COPILOT_SURFACE}:${source}:${String(state.cliOutputSequence++)}`,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      },
    });
  }

  private startRepositoryReviewProgress(
    state: GithubCopilotCliExecutionState,
    request: GithubCopilotCliExecutionRequest,
  ): void {
    this.pushRepositoryReviewProgressEvent(state, request);
    state.progressTimer = setInterval(() => {
      if (state.settled) {
        return;
      }
      this.pushRepositoryReviewProgressEvent(state, request);
    }, GITHUB_COPILOT_REPOSITORY_REVIEW_PROGRESS_INTERVAL_MS);
    state.progressTimer.unref?.();
  }

  private pushRepositoryReviewProgressEvent(
    state: GithubCopilotCliExecutionState,
    request: GithubCopilotCliExecutionRequest,
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
        surface: GITHUB_COPILOT_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail:
          elapsedSeconds === 0
            ? 'GitHub Copilot repository review is running; waiting for CLI output.'
            : `GitHub Copilot repository review is still running (${elapsedSeconds}s elapsed); waiting for CLI output.`,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      },
    });
  }

  private pushCliGracefulInterruptEvent(
    state: GithubCopilotCliExecutionState,
    request: GithubCopilotCliExecutionRequest,
    cancelMechanism: GithubCopilotCliCancelMechanism,
  ): void {
    const interruptedAt = new Date().toISOString();
    this.recordCliTransportEvent(
      state,
      interruptedAt,
      'graceful_interrupting',
      state.accumulatedAssistantText.length > 0 ? state.accumulatedAssistantText : undefined,
    );
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp: interruptedAt,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'graceful_interrupting',
        surface: GITHUB_COPILOT_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail:
          cancelMechanism === 'abort_signal'
            ? 'GitHub Copilot invoke is being interrupted by abort signal.'
            : 'GitHub Copilot invoke exceeded its timeout budget; attempting graceful interrupt.',
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'graceful_interrupting',
          partialOutputPreserved: state.accumulatedAssistantText.length > 0,
          cancelMechanism,
          lastTerminalSignalAt: interruptedAt,
          ...(cancelMechanism === 'process_signal'
            ? { suspectReasonCodes: ['invoke_hard_timeout'] }
            : {}),
        }),
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

  private recordCliTransportEvent(
    state: GithubCopilotCliExecutionState,
    timestamp: string,
    eventType: string,
    previewText?: string,
  ): void {
    state.lastTransportActivityAt = timestamp;
    state.latestEventAt = timestamp;
    state.latestEventType = eventType;
    if (previewText) {
      state.latestTextPreview = previewText;
    }
  }

  private recordCliSemanticProgress(
    state: GithubCopilotCliExecutionState,
    timestamp: string,
    eventType: string,
    previewText: string,
  ): void {
    this.recordCliTransportEvent(state, timestamp, eventType, previewText);
    state.lastSemanticProgressAt = timestamp;
  }

  private buildCliInvokeLivenessSnapshot(
    request: GithubCopilotCliExecutionRequest,
    state: GithubCopilotCliExecutionState,
    options: {
      status: GithubCopilotCliLivenessStatus;
      partialOutputPreserved: boolean;
      cancelMechanism: GithubCopilotCliCancelMechanism;
      lastTerminalSignalAt?: string;
      suspectReasonCodes?: string[];
    },
  ): Record<string, unknown> {
    const startedAt = state.startedAt ?? new Date().toISOString();
    return {
      adapterId: this.options.agentId,
      surfaceId: GITHUB_COPILOT_SURFACE,
      routeKey: request.routeKey,
      startedAt,
      status: options.status,
      ...(state.lastTransportActivityAt
        ? { lastTransportActivityAt: state.lastTransportActivityAt }
        : {}),
      ...(state.lastSemanticProgressAt
        ? { lastSemanticProgressAt: state.lastSemanticProgressAt }
        : {}),
      ...(options.lastTerminalSignalAt
        ? { lastTerminalSignalAt: options.lastTerminalSignalAt }
        : {}),
      ...(state.latestEventAt ? { latestEventAt: state.latestEventAt } : {}),
      ...(state.latestEventType ? { latestEventType: state.latestEventType } : {}),
      ...(state.latestTextPreview ? { latestTextPreview: state.latestTextPreview } : {}),
      activeOperationKind: 'cli_exec_stream',
      activeOperationStartedAt: startedAt,
      partialOutputPreserved: options.partialOutputPreserved,
      transportKind: AdapterTransportKind.CLI_EXEC,
      cancelMechanism: options.cancelMechanism,
      ...(options.suspectReasonCodes && options.suspectReasonCodes.length > 0
        ? { suspectReasonCodes: options.suspectReasonCodes }
        : {}),
    };
  }

  private resolveCliFailureReasonCodes(error: unknown, partialOutputPreserved: boolean): string[] {
    const detail = this.cliExecOperationsRuntime
      .collectErrorDetail(error, standardizeError(error).message)
      .toLowerCase();
    return [
      ...(this.isTimeoutFailure(detail) ? ['invoke_hard_timeout'] : []),
      ...(partialOutputPreserved ? ['invoke_partial_output_preserved'] : []),
    ];
  }

  private resolveCliFailureCancelMechanism(
    error: unknown,
    request: GithubCopilotCliExecutionRequest,
  ): GithubCopilotCliCancelMechanism {
    if (request.signal?.aborted) {
      return 'abort_signal';
    }
    const detail = this.cliExecOperationsRuntime
      .collectErrorDetail(error, standardizeError(error).message)
      .toLowerCase();
    if (/(timed out|timeout)/u.test(detail)) {
      return 'process_signal';
    }
    if (/(aborterror|aborted)/u.test(detail)) {
      return 'abort_signal';
    }
    return 'none';
  }

  /**
   * Requests confirmation through GitHub Copilot adapter flow.
   * @param _request Confirmation request payload.
   * @returns Confirmation decision payload.
   */
  public override async requestConfirmation(
    _request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    if (this.options.executionMode === GithubCopilotAgentAdapterExecutionMode.CLI_EXEC) {
      return {
        decision: AgentConfirmationDecision.REVISE,
        reason: 'github-copilot-cli-confirmation-gate-unsupported',
        constraints: ['escalate_to_human_gate'],
        decidedAt: new Date().toISOString(),
      };
    }

    return {
      decision: AgentConfirmationDecision.APPROVE,
      reason: 'github-copilot-adapter-baseline-approved',
      constraints: [],
      decidedAt: new Date().toISOString(),
    };
  }

  /**
   * Cancels one ongoing GitHub Copilot execution scope.
   * @param request Cancellation request payload.
   * @returns Cancellation acknowledgement payload.
   */
  public override async cancel(request: AgentCancelRequest): Promise<AgentCancelResult> {
    if (this.options.executionMode === GithubCopilotAgentAdapterExecutionMode.CLI_EXEC) {
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
      this.options.executionMode === GithubCopilotAgentAdapterExecutionMode.CLI_EXEC
        ? GITHUB_COPILOT_REAL_CAPABILITY_SUPPORT
        : GITHUB_COPILOT_BASELINE_CAPABILITY_SUPPORT;
    const supportsCancellation =
      this.options.executionMode !== GithubCopilotAgentAdapterExecutionMode.CLI_EXEC;
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
  private async resolveProbeResolution(
    signal?: AbortSignal,
  ): Promise<GithubCopilotProbeResolution> {
    if (this.options.executionMode === GithubCopilotAgentAdapterExecutionMode.BASELINE) {
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
   * Executes one real GitHub Copilot health probe using non-interactive CLI mode.
   * @returns Probe availability resolution.
   */
  private async executeHealthProbe(signal?: AbortSignal): Promise<GithubCopilotProbeResolution> {
    try {
      const executionResult = await this.runGithubCopilotOperation({
        prompt: GITHUB_COPILOT_HEALTH_CHECK_PROMPT,
        timeoutMs: this.options.requestTimeoutMs,
        signal,
        operation: AgentCliExecOperation.PROBE,
      });
      const parsedOutput = this.parseGithubCopilotCliOutput(
        executionResult,
        AgentCliExecOperation.PROBE,
      );
      if (
        !matchesHealthCheckEchoResponse(
          parsedOutput.responseText,
          GITHUB_COPILOT_HEALTH_CHECK_EXPECTED_RESPONSE,
        )
      ) {
        return {
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [
            `health_check_invalid_response:${GITHUB_COPILOT_SURFACE}:${this.cliExecOperationsRuntime.sanitizeReasonSegment(parsedOutput.responseText)}`,
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
   * Runs one GitHub Copilot CLI operation and maps failures into protocol errors.
   * @param request Operation request payload.
   * @returns Raw CLI execution result.
   */
  private async runGithubCopilotOperation(
    request: Pick<
      GithubCopilotExecRunnerRequest,
      'prompt' | 'timeoutMs' | 'signal' | 'operation' | 'onGracefulInterruptStart'
    > & {
      commandArgumentsPrefixResolver?: (
        basePrefix: string[],
        executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>,
      ) => string[];
      executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>;
      onStdoutChunk?: (chunk: string) => void;
      onStderrChunk?: (chunk: string) => void;
    },
  ): Promise<GithubCopilotExecRunnerResult> {
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
                onGracefulInterruptStart: request.onGracefulInterruptStart,
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
        `GitHub Copilot ${request.operation} failed: ${standardizedError.message}`,
        {
          surface: GITHUB_COPILOT_SURFACE,
          operation: request.operation,
        },
      );
    }
  }

  /**
   * Resolves preferred and fallback GitHub Copilot command entrypoints.
   * @returns Ordered command specs.
   */
  private resolveCommandCandidates(): Array<{
    command: string;
    commandArgumentsPrefix: string[];
  }> {
    if (this.options.command === GITHUB_COPILOT_DIRECT_COMMAND) {
      return [
        {
          command: GITHUB_COPILOT_DIRECT_COMMAND,
          commandArgumentsPrefix: [],
        },
        {
          command: GITHUB_COPILOT_GH_COMMAND,
          commandArgumentsPrefix: ['copilot', '--'],
        },
      ];
    }

    if (this.options.command === GITHUB_COPILOT_GH_COMMAND) {
      return [
        {
          command: GITHUB_COPILOT_GH_COMMAND,
          commandArgumentsPrefix: ['copilot', '--'],
        },
        {
          command: GITHUB_COPILOT_DIRECT_COMMAND,
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
   * Parses stdout/stderr emitted by GitHub Copilot CLI JSONL mode.
   * @param executionResult Raw CLI execution result.
   * @param operation Current operation label.
   * @returns Normalized GitHub Copilot output payload.
   */
  private parseGithubCopilotCliOutput(
    executionResult: GithubCopilotExecRunnerResult,
    operation: AgentCliExecOperation,
  ): GithubCopilotCliParsedOutput {
    const jsonEvents = executionResult.stdout
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('{'))
      .map((line) => JSON.parse(line) as GithubCopilotCliJsonEvent);

    const sessionErrorEvent = jsonEvents.find((event) => event.type === 'session.error');
    if (sessionErrorEvent) {
      throw new RuntimeError(
        operation === AgentCliExecOperation.PROBE
          ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
          : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        `GitHub Copilot ${operation} failed: ${sessionErrorEvent.data?.message ?? 'unknown session error'}`,
        this.cliExecOperationsRuntime.createRedactedProcessDetails({
          surface: GITHUB_COPILOT_SURFACE,
          operation,
          stdout: executionResult.stdout,
          stderr: executionResult.stderr,
          statusCode: sessionErrorEvent.data?.statusCode,
          errorType: sessionErrorEvent.data?.errorType,
        }),
      );
    }

    const resultExitCode =
      jsonEvents.find((event) => event.type === 'result')?.exitCode ?? executionResult.exitCode;
    if (typeof resultExitCode === 'number' && resultExitCode !== 0) {
      throw new RuntimeError(
        operation === AgentCliExecOperation.PROBE
          ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
          : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        `GitHub Copilot ${operation} exited with code ${resultExitCode}.`,
        this.cliExecOperationsRuntime.createRedactedProcessDetails({
          surface: GITHUB_COPILOT_SURFACE,
          operation,
          stdout: executionResult.stdout,
          stderr: executionResult.stderr,
          exitCode: resultExitCode,
        }),
      );
    }

    let accumulatedAssistantText = '';
    for (const event of jsonEvents.filter((candidate) =>
      candidate.type?.startsWith('assistant.'),
    )) {
      const candidateText = this.extractAssistantText(event);
      if (!candidateText) {
        continue;
      }
      const nextTokenState = this.resolveAssistantTokenState(
        accumulatedAssistantText,
        candidateText,
        event.type === 'assistant.message',
        event.data?.delta === candidateText,
      );
      if (!nextTokenState) {
        continue;
      }
      accumulatedAssistantText = nextTokenState.accumulatedText;
    }
    const responseText = accumulatedAssistantText.trim();

    if (!responseText) {
      throw new RuntimeError(
        operation === AgentCliExecOperation.PROBE
          ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
          : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        `GitHub Copilot ${operation} returned no assistant response.`,
        this.cliExecOperationsRuntime.createRedactedProcessDetails({
          surface: GITHUB_COPILOT_SURFACE,
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
   * Extracts one text fragment from a GitHub Copilot CLI assistant event.
   * @param event One parsed JSONL event.
   * @returns Extracted text fragment or `null`.
   */
  private extractAssistantText(event: GithubCopilotCliJsonEvent): string | null {
    const candidates = [event.data?.content, event.data?.text, event.data?.delta];
    return (
      candidates.find((candidate): candidate is string => typeof candidate === 'string') ?? null
    );
  }

  private extractAuxiliaryText(event: GithubCopilotCliJsonEvent): string | null {
    const candidates = [
      event.data?.message,
      event.data?.content,
      event.data?.text,
      event.data?.delta,
    ];
    return (
      candidates.find((candidate): candidate is string => typeof candidate === 'string') ?? null
    );
  }

  /**
   * Converts one stage invocation request into a GitHub Copilot prompt payload.
   * @param request Stage invocation request payload.
   * @returns Rendered prompt string.
   */
  private renderInvokePrompt(request: AgentInvokeStageRequest): string {
    const renderedInput = JSON.stringify(request.input, null, 2);
    return [
      'You are executing one Repo AI Governor stage through GitHub Copilot CLI.',
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
      'You are executing one Repo AI Governor repository review stage through GitHub Copilot CLI.',
      `Original user request: ${userMessage}`,
      'Review the current repository uncommitted changes using read-only shell inspection and produce findings-first concise markdown with concrete file references when possible.',
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
      return [`command_missing:${GITHUB_COPILOT_SURFACE}:${this.options.command}`];
    }

    if (this.isCredentialFailure(detail)) {
      return [`credential_missing:${GITHUB_COPILOT_SURFACE}`];
    }

    if (this.isTimeoutFailure(detail)) {
      return [`health_check_timeout:${GITHUB_COPILOT_SURFACE}`];
    }

    if (this.isQuotaFailure(detail)) {
      return [`health_check_failed:${GITHUB_COPILOT_SURFACE}:quota_exhausted`];
    }

    return [
      `health_check_failed:${GITHUB_COPILOT_SURFACE}:${this.cliExecOperationsRuntime.sanitizeReasonSegment(standardizedError.message)}`,
    ];
  }

  /**
   * Checks whether one failure was caused by a missing GitHub CLI executable.
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
    return /(auth|login|credential|token|oauth|not logged in|unauthorized|forbidden)/u.test(detail);
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
   * Checks whether one failure indicates exhausted Copilot quota/budget.
   * @param detail Lower-cased detail string.
   * @returns True when the failure indicates quota exhaustion.
   */
  private isQuotaFailure(detail: string): boolean {
    return /(quota|402|payment required|no quota)/u.test(detail);
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
   * Executes one GitHub Copilot CLI process in non-interactive JSON mode.
   * @param request Exec-runner request payload.
   * @returns Raw process execution result.
   */
  private async executeGithubCopilotCli(
    request: GithubCopilotExecRunnerRequest,
  ): Promise<GithubCopilotExecRunnerResult> {
    const startedAt = Date.now();
    const hasExplicitToolPermissions =
      request.commandArgumentsPrefix.includes('--allow-tool') ||
      request.commandArgumentsPrefix.includes('--deny-tool');
    const args = [
      ...request.commandArgumentsPrefix,
      '-p',
      request.prompt,
      ...(hasExplicitToolPermissions ? [] : ['--allow-all-tools']),
      '--output-format',
      'json',
      '--silent',
      '--no-custom-instructions',
      '--no-auto-update',
      '--add-dir',
      request.cwd,
    ];

    return await new Promise<GithubCopilotExecRunnerResult>((resolveResult, reject) => {
      const childProcess = spawn(request.command, args, {
        cwd: request.cwd,
        env: request.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        ...(request.signal ? { signal: request.signal } : {}),
      });
      let stdout = '';
      let stderr = '';
      let settled = false;
      let gracefulInterruptNotified = false;

      const notifyGracefulInterrupt = (
        cancelMechanism: 'process_signal' | 'abort_signal',
      ): void => {
        if (gracefulInterruptNotified) {
          return;
        }
        gracefulInterruptNotified = true;
        request.onGracefulInterruptStart?.(cancelMechanism);
      };

      const settle = (
        result: GithubCopilotExecRunnerResult | RuntimeError,
        isError: boolean,
      ): void => {
        if (settled) {
          return;
        }
        settled = true;
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        request.signal?.removeEventListener('abort', onAbortSignal);
        if (isError) {
          reject(result);
          return;
        }
        resolveResult(result as GithubCopilotExecRunnerResult);
      };

      const onAbortSignal = () => {
        notifyGracefulInterrupt('abort_signal');
      };

      request.signal?.addEventListener('abort', onAbortSignal, { once: true });

      const timeoutHandle = setTimeout(() => {
        notifyGracefulInterrupt('process_signal');
        childProcess.kill('SIGTERM');
        settle(
          new RuntimeError(
            request.operation === AgentCliExecOperation.PROBE
              ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
              : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
            `GitHub Copilot ${request.operation} timed out after ${request.timeoutMs}ms.`,
            this.cliExecOperationsRuntime.createRedactedProcessDetails({
              surface: GITHUB_COPILOT_SURFACE,
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
            `GitHub Copilot ${request.operation} process launch failed: ${standardizeError(error).message}`,
            this.cliExecOperationsRuntime.createRedactedProcessDetails({
              surface: GITHUB_COPILOT_SURFACE,
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
        ? GITHUB_COPILOT_CHAT_ONLY_ARGS
        : []),
    ];
  }

  private resolveInvokeCommandArgumentsPrefix(
    request: AgentInvokeStageRequest,
    commandArgumentsPrefix: string[],
    executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>,
  ): string[] {
    if (this.shouldUseRepositoryReviewMode(request)) {
      return [...commandArgumentsPrefix, ...GITHUB_COPILOT_REPOSITORY_REVIEW_ARGS];
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
      request.input.reviewScope === GITHUB_COPILOT_REPOSITORY_REVIEW_SCOPE
    );
  }

  private resolveInvokeTimeoutMs(request: AgentInvokeStageRequest): number {
    if (typeof request.agentInvocationTimeoutMs === 'number') {
      return request.agentInvocationTimeoutMs;
    }

    if (this.shouldUseRepositoryReviewMode(request)) {
      return GITHUB_COPILOT_REPOSITORY_REVIEW_TIMEOUT_MS;
    }

    return this.options.requestTimeoutMs;
  }

  private resolveStreamTimeoutMs(request: AgentStreamEventsRequest): number {
    if (typeof request.agentInvocationTimeoutMs === 'number') {
      return request.agentInvocationTimeoutMs;
    }

    if (this.shouldUseRepositoryReviewMode(request)) {
      return GITHUB_COPILOT_REPOSITORY_REVIEW_TIMEOUT_MS;
    }

    return this.options.requestTimeoutMs;
  }
}
