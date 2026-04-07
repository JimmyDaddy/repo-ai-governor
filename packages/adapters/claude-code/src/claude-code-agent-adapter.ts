import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

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
  AdapterCredentialSource,
  AdapterEndpointSource,
  AdapterProviderKind,
  type AdapterRemoteApiConfig,
  AdapterRequestCancellationMode,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  GovernorErrorCode,
  RuntimeError,
  matchesHealthCheckEchoResponse,
  standardizeError,
} from '@repo-ai-governor/shared';
import { ClaudeCodeProviderLocalConfigRuntime } from './claude-code-provider-local-config-runtime.js';
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
const CLAUDE_CODE_MIN_TIMEOUT_MS = 500;
const CLAUDE_CODE_MAX_TIMEOUT_MS = 600000;
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
const CLAUDE_CODE_REMOTE_API_DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const CLAUDE_CODE_REMOTE_API_DEFAULT_CREDENTIAL_ENV_VAR = 'ANTHROPIC_API_KEY';
const CLAUDE_CODE_REMOTE_API_DEFAULT_MAX_RETRIES = 2;
const CLAUDE_CODE_REMOTE_API_DEFAULT_MAX_TOKENS = 1024;
const CLAUDE_CODE_REMOTE_API_SSE_EVENT_DELIMITER = '\n\n';

function normalizeClaudeCodeTimeoutMs(timeoutMs: number): number {
  if (!Number.isFinite(timeoutMs)) {
    return CLAUDE_CODE_DEFAULT_TIMEOUT_MS;
  }

  const normalizedTimeoutMs = Math.floor(timeoutMs);
  return Math.min(
    CLAUDE_CODE_MAX_TIMEOUT_MS,
    Math.max(CLAUDE_CODE_MIN_TIMEOUT_MS, normalizedTimeoutMs),
  );
}

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
  structuredResponse?: unknown;
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
  startedAt: string | null;
  lastTransportActivityAt: string | null;
  lastSemanticProgressAt: string | null;
  latestEventAt: string | null;
  latestEventType: string | null;
  latestTextPreview: string | null;
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
  remoteApi?: AdapterRemoteApiConfig;
  fetchImplementation: typeof fetch;
}

interface ResolvedClaudeCodeRemoteApiOptions {
  provider: AdapterProviderKind.ANTHROPIC;
  vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES;
  model: string;
  endpoint: string;
  endpointSource: AdapterEndpointSource;
  credentialEnvVar: string;
  credentialEnvVarExplicit: boolean;
  credentialRef: string | null;
  providerLocalDiscoveryEnabled: boolean;
  providerLocalCredentialValue: string | null;
  requestTimeoutMs: number;
  maxRetries: number;
}

interface ClaudeCodeRemoteApiCredentialResolution {
  source: AdapterCredentialSource;
  value: string | null;
  detail: string;
}

type ClaudeCodeRemoteApiLivenessStatus =
  | 'starting'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';
type ClaudeCodeRemoteApiCancelMechanism = 'none' | 'http_stream_abort';
type ClaudeCodeCliLivenessStatus =
  | 'starting'
  | 'running'
  | 'graceful_interrupting'
  | 'completed'
  | 'failed';
type ClaudeCodeCliCancelMechanism = 'none' | 'process_signal' | 'abort_signal';

interface ClaudeCodeRemoteApiFetchResult {
  response: Response;
  cleanup: () => void;
  didTimeout: () => boolean;
}

interface ClaudeCodeRemoteApiLivenessState {
  startedAt: string;
  accumulatedText: string;
  remoteRequestId: string | null;
  lastTransportActivityAt: string | null;
  lastSemanticProgressAt: string | null;
  latestEventAt: string | null;
  latestEventType: string | null;
  latestTextPreview: string | null;
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
      requestTimeoutMs: normalizeClaudeCodeTimeoutMs(
        options.requestTimeoutMs ?? CLAUDE_CODE_DEFAULT_TIMEOUT_MS,
      ),
      probeCacheTtlMs: options.probeCacheTtlMs ?? CLAUDE_CODE_DEFAULT_PROBE_CACHE_TTL_MS,
      maxRetryAttempts: options.maxRetryAttempts ?? DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS,
      retryBackoffMs: options.retryBackoffMs ?? DEFAULT_AGENT_CLI_EXEC_RETRY_BACKOFF_MS,
      ...(options.remoteApi
        ? {
            remoteApi: options.remoteApi,
          }
        : {}),
      fetchImplementation: options.fetchImplementation ?? fetch,
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
    const remoteApiOptions = this.resolveRemoteApiOptions();
    const remoteApiCredentialResolution = remoteApiOptions
      ? this.resolveRemoteApiCredentialResolution(remoteApiOptions)
      : null;
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
        surface: CLAUDE_CODE_SURFACE,
        roleProfileId: this.options.roleProfileId,
        roleSource: this.options.roleSource,
      },
      availabilityStatus,
      capabilityMatrix,
      unavailableReasons,
      healthCheck: createLayeredHealthCheckFromLegacyReasons({
        adapterId: this.options.agentId,
        surfaceId: CLAUDE_CODE_SURFACE,
        availabilityStatus,
        selectedEntrypoint: remoteApiOptions?.endpoint ?? this.options.command,
        routeKey: request.routeKey,
        routeRequirements: (request.requiredCapabilities ?? []).map(String),
        fallbackAllowed: true,
        unavailableReasons,
        unsupportedCapabilities: unsupportedCapabilities.map(String),
        degradedCapabilities: degradedCapabilities.map(String),
        transportKind:
          this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.REMOTE_API
            ? AdapterTransportKind.REMOTE_API
            : this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC
              ? AdapterTransportKind.CLI_EXEC
              : AdapterTransportKind.BASELINE,
        providerKind: remoteApiOptions?.provider ?? null,
        vendorBindingKind: remoteApiOptions?.vendorBinding ?? null,
        model: remoteApiOptions?.model ?? null,
        credentialSource: remoteApiCredentialResolution?.source ?? null,
        endpointSource: remoteApiOptions?.endpointSource ?? null,
        requestCancellationMode:
          this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.REMOTE_API
            ? AdapterRequestCancellationMode.LOCAL_ABORT_ONLY
            : AdapterRequestCancellationMode.NOT_SUPPORTED,
      }),
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
    const unsupportedContinuation = this.createUnsupportedContinuationResult(request);
    if (this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.BASELINE) {
      return {
        output: {
          adapterSurface: CLAUDE_CODE_SURFACE,
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

    if (this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.REMOTE_API) {
      return await this.invokeRemoteApiStage(request);
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
        ...(parsedOutput.structuredResponse !== undefined
          ? {
              structuredResponse: parsedOutput.structuredResponse,
            }
          : {}),
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

    if (this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.REMOTE_API) {
      yield* this.streamRemoteApiEvents(request);
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

  private createCliExecutionKey(request: ClaudeCodeCliExecutionRequest): string {
    return [request.processId, request.executionId, request.stageId, request.routeKey].join(':');
  }

  private async startCliExecution(
    state: ClaudeCodeCliExecutionState,
    request: ClaudeCodeCliExecutionRequest,
  ): Promise<ClaudeCodeExecRunnerResult> {
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
          surface: CLAUDE_CODE_SURFACE,
          transportKind: AdapterTransportKind.CLI_EXEC,
          detail: this.shouldUseRepositoryReviewMode(request)
            ? 'Claude Code repository review started; waiting for CLI output.'
            : 'Claude Code turn started.',
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
        onGracefulInterruptStart: (cancelMechanism) => {
          this.pushCliGracefulInterruptEvent(state, request, cancelMechanism);
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
      const completedAt = new Date().toISOString();
      this.recordCliTransportEvent(
        state,
        completedAt,
        AgentStreamEventType.COMPLETED,
        completedResponseText.length > 0 ? completedResponseText : undefined,
      );
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.COMPLETED,
        timestamp: completedAt,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'completed',
          surface: CLAUDE_CODE_SURFACE,
          transportKind: AdapterTransportKind.CLI_EXEC,
          ...(completedResponseText.length > 0 ? { responseText: completedResponseText } : {}),
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
          surface: CLAUDE_CODE_SURFACE,
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
    const timestamp = new Date().toISOString();
    this.recordCliSemanticProgress(
      state,
      timestamp,
      AgentStreamEventType.TOKEN,
      state.accumulatedAssistantText,
    );
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.TOKEN,
      timestamp,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        surface: CLAUDE_CODE_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        text: chunk,
        accumulatedText: state.accumulatedAssistantText,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
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
    const timestamp = new Date().toISOString();
    this.recordCliTransportEvent(state, timestamp, 'stderr', normalizedLine);
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'running',
        surface: CLAUDE_CODE_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail: `${CLAUDE_CODE_SURFACE} stderr: ${normalizedLine}`,
        activityKey: `${CLAUDE_CODE_SURFACE}:stderr:${String(state.cliOutputSequence++)}`,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
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
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail:
          elapsedSeconds === 0
            ? 'Claude Code repository review is running; waiting for CLI output.'
            : `Claude Code repository review is still running (${elapsedSeconds}s elapsed); waiting for CLI output.`,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      },
    });
  }

  private pushCliGracefulInterruptEvent(
    state: ClaudeCodeCliExecutionState,
    request: ClaudeCodeCliExecutionRequest,
    cancelMechanism: ClaudeCodeCliCancelMechanism,
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
        surface: CLAUDE_CODE_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail:
          cancelMechanism === 'abort_signal'
            ? 'Claude Code invoke is being interrupted by abort signal.'
            : 'Claude Code invoke exceeded its timeout budget; attempting graceful interrupt.',
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
    state: ClaudeCodeCliExecutionState,
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
    state: ClaudeCodeCliExecutionState,
    timestamp: string,
    eventType: string,
    previewText: string,
  ): void {
    this.recordCliTransportEvent(state, timestamp, eventType, previewText);
    state.lastSemanticProgressAt = timestamp;
  }

  private buildCliInvokeLivenessSnapshot(
    request: ClaudeCodeCliExecutionRequest,
    state: ClaudeCodeCliExecutionState,
    options: {
      status: ClaudeCodeCliLivenessStatus;
      partialOutputPreserved: boolean;
      cancelMechanism: ClaudeCodeCliCancelMechanism;
      lastTerminalSignalAt?: string;
      suspectReasonCodes?: string[];
    },
  ): Record<string, unknown> {
    const startedAt = state.startedAt ?? new Date().toISOString();
    return {
      adapterId: this.options.agentId,
      surfaceId: CLAUDE_CODE_SURFACE,
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
    request: ClaudeCodeCliExecutionRequest,
  ): ClaudeCodeCliCancelMechanism {
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
   * Requests confirmation through Claude Code adapter flow.
   * @param _request Confirmation request payload.
   * @returns Confirmation decision payload.
   */
  public override async requestConfirmation(
    _request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    if (
      this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC ||
      this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.REMOTE_API
    ) {
      return {
        decision: AgentConfirmationDecision.REVISE,
        reason:
          this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.REMOTE_API
            ? 'claude-code-remote-api-confirmation-gate-unsupported'
            : 'claude-code-cli-confirmation-gate-unsupported',
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

    if (this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.REMOTE_API) {
      return {
        acknowledged: true,
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
        minTimeoutMs: CLAUDE_CODE_MIN_TIMEOUT_MS,
        maxTimeoutMs: CLAUDE_CODE_MAX_TIMEOUT_MS,
      },
      cancellation: {
        supportsCancel: supportsCancellation,
        supportsReasonPropagation:
          this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.REMOTE_API
            ? false
            : supportsCancellation,
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

    if (this.options.executionMode === ClaudeCodeAgentAdapterExecutionMode.REMOTE_API) {
      return await this.executeRemoteApiHealthProbe(signal);
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
      if (
        !matchesHealthCheckEchoResponse(
          parsedOutput.responseText,
          CLAUDE_CODE_HEALTH_CHECK_EXPECTED_RESPONSE,
        )
      ) {
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
    request: Pick<
      ClaudeCodeExecRunnerRequest,
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

    const structuredResponse = this.resolveStructuredResponse(responseText);
    return {
      responseText,
      warnings: executionResult.stderr
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
      ...(structuredResponse !== undefined
        ? {
            structuredResponse,
          }
        : {}),
    };
  }

  private resolveStructuredResponse(responseText: string): unknown | undefined {
    const normalizedResponseText = responseText.trim();
    if (normalizedResponseText.length === 0) {
      return undefined;
    }

    const directJsonPayload = this.tryParseJsonValue(normalizedResponseText);
    if (directJsonPayload !== undefined) {
      return directJsonPayload;
    }

    for (const fencedPayload of this.extractFencedJsonPayloads(normalizedResponseText)) {
      const structuredResponse = this.tryParseJsonValue(fencedPayload);
      if (structuredResponse !== undefined) {
        return structuredResponse;
      }
    }

    return undefined;
  }

  private *extractFencedJsonPayloads(responseText: string): Generator<string> {
    const jsonFencePattern = /```(?:json)?\s*([\s\S]*?)```/giu;
    for (const match of responseText.matchAll(jsonFencePattern)) {
      const payload = match[1]?.trim();
      if (payload) {
        yield payload;
      }
    }
  }

  private tryParseJsonValue(payloadText: string): unknown | undefined {
    try {
      return JSON.parse(payloadText) as unknown;
    } catch {
      return undefined;
    }
  }

  private resolveRemoteApiOptions(): ResolvedClaudeCodeRemoteApiOptions | null {
    if (this.options.executionMode !== ClaudeCodeAgentAdapterExecutionMode.REMOTE_API) {
      return null;
    }

    const configuredRemoteApi = this.options.remoteApi;
    if (!configuredRemoteApi) {
      return null;
    }

    const providerLocalDiscoveryEnabled = configuredRemoteApi.allowProviderLocalConfig === true;
    const providerLocalConfig = providerLocalDiscoveryEnabled
      ? new ClaudeCodeProviderLocalConfigRuntime({
          currentWorkingDirectory: this.options.currentWorkingDirectory,
          environment: this.options.environment,
        }).discover()
      : null;
    const credentialEnvVar =
      configuredRemoteApi.credentialEnvVar ?? CLAUDE_CODE_REMOTE_API_DEFAULT_CREDENTIAL_ENV_VAR;

    return {
      provider: AdapterProviderKind.ANTHROPIC,
      vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
      model: configuredRemoteApi.model,
      endpoint:
        configuredRemoteApi.endpoint ??
        providerLocalConfig?.endpoint ??
        CLAUDE_CODE_REMOTE_API_DEFAULT_ENDPOINT,
      endpointSource: configuredRemoteApi.endpoint
        ? AdapterEndpointSource.CONFIG_EXPLICIT
        : providerLocalConfig?.endpoint
          ? AdapterEndpointSource.PROVIDER_LOCAL
          : AdapterEndpointSource.VENDOR_DEFAULT,
      credentialEnvVar,
      credentialEnvVarExplicit: configuredRemoteApi.credentialEnvVar !== undefined,
      credentialRef: configuredRemoteApi.credentialRef ?? null,
      providerLocalDiscoveryEnabled,
      providerLocalCredentialValue: providerLocalConfig?.apiKey ?? null,
      requestTimeoutMs: normalizeClaudeCodeTimeoutMs(
        configuredRemoteApi.requestTimeoutMs ?? this.options.requestTimeoutMs,
      ),
      maxRetries: configuredRemoteApi.maxRetries ?? CLAUDE_CODE_REMOTE_API_DEFAULT_MAX_RETRIES,
    };
  }

  private resolveRemoteApiCredentialResolution(
    remoteApiOptions: ResolvedClaudeCodeRemoteApiOptions,
  ): ClaudeCodeRemoteApiCredentialResolution {
    const environment = this.resolveEnvironment();
    const credentialValue = environment[remoteApiOptions.credentialEnvVar];
    if (typeof credentialValue === 'string' && credentialValue.trim().length > 0) {
      return {
        source: remoteApiOptions.credentialEnvVarExplicit
          ? AdapterCredentialSource.ENV_EXPLICIT
          : AdapterCredentialSource.ENV_DEFAULT,
        value: credentialValue.trim(),
        detail: `${CLAUDE_CODE_SURFACE}:${remoteApiOptions.credentialEnvVar}`,
      };
    }

    if (remoteApiOptions.credentialRef) {
      return {
        source: AdapterCredentialSource.CREDENTIAL_REF,
        value: null,
        detail: `${CLAUDE_CODE_SURFACE}:${remoteApiOptions.credentialRef}`,
      };
    }

    if (remoteApiOptions.providerLocalCredentialValue) {
      return {
        source: AdapterCredentialSource.PROVIDER_LOCAL,
        value: remoteApiOptions.providerLocalCredentialValue,
        detail: `${CLAUDE_CODE_SURFACE}:provider-local`,
      };
    }

    if (remoteApiOptions.providerLocalDiscoveryEnabled) {
      return {
        source: AdapterCredentialSource.PROVIDER_LOCAL,
        value: null,
        detail: `${CLAUDE_CODE_SURFACE}:provider-local`,
      };
    }

    return {
      source: remoteApiOptions.credentialEnvVarExplicit
        ? AdapterCredentialSource.ENV_EXPLICIT
        : AdapterCredentialSource.ENV_DEFAULT,
      value: null,
      detail: `${CLAUDE_CODE_SURFACE}:${remoteApiOptions.credentialEnvVar}`,
    };
  }

  private async executeRemoteApiHealthProbe(
    signal?: AbortSignal,
  ): Promise<ClaudeCodeProbeResolution> {
    const remoteApiOptions = this.resolveRemoteApiOptions();
    if (!remoteApiOptions) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: ['vendor_binding_required:claude-code'],
      };
    }

    const credentialResolution = this.resolveRemoteApiCredentialResolution(remoteApiOptions);
    if (!credentialResolution.value) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: [`credential_missing:${credentialResolution.detail}`],
      };
    }

    try {
      const response = await this.executeRemoteApiJsonRequest({
        prompt: CLAUDE_CODE_HEALTH_CHECK_PROMPT,
        timeoutMs: remoteApiOptions.requestTimeoutMs,
        signal,
      });
      if (
        !matchesHealthCheckEchoResponse(
          response.responseText,
          CLAUDE_CODE_HEALTH_CHECK_EXPECTED_RESPONSE,
        )
      ) {
        return {
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [
            `health_check_invalid_response:${CLAUDE_CODE_SURFACE}:${this.cliExecOperationsRuntime.sanitizeReasonSegment(response.responseText)}`,
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
        unavailableReasons: this.resolveRemoteApiProbeFailureReasons(error, remoteApiOptions),
      };
    }
  }

  private async invokeRemoteApiStage(
    request: AgentInvokeStageRequest,
  ): Promise<AgentInvokeStageResult> {
    const remoteApiOptions = this.requireRemoteApiOptions();
    const prompt = this.shouldUseRepositoryReviewMode(request)
      ? this.renderRepositoryReviewPrompt(request)
      : this.renderInvokePrompt(request);
    const response = await this.executeRemoteApiJsonRequest({
      prompt,
      timeoutMs: this.resolveInvokeTimeoutMs(request),
      ...(request.signal ? { signal: request.signal } : {}),
    });

    return {
      output: {
        adapterSurface: CLAUDE_CODE_SURFACE,
        routeKey: request.routeKey,
        stageId: request.stageId,
        responseText: response.responseText,
        remoteMessageId: response.responseId,
        vendorBindingKind: remoteApiOptions.vendorBinding,
        ...(response.structuredResponse !== undefined
          ? {
              structuredResponse: response.structuredResponse,
            }
          : {}),
        echoedInput: request.input,
      },
      ...(request.continuation
        ? {
            continuation: this.createUnsupportedContinuationResult(request),
          }
        : {}),
      ...(response.usage ? { usage: response.usage } : {}),
      elapsedMs: response.elapsedMs,
    };
  }

  private async *streamRemoteApiEvents(
    request: AgentStreamEventsRequest,
  ): AsyncIterable<AgentStreamEvent> {
    const remoteApiOptions = this.requireRemoteApiOptions();
    const prompt = this.shouldUseRepositoryReviewMode(request as ClaudeCodeCliExecutionRequest)
      ? this.renderRepositoryReviewPrompt(request as AgentInvokeStageRequest)
      : this.renderInvokePrompt(request as AgentInvokeStageRequest);
    const livenessState = this.createRemoteApiLivenessState();
    this.recordRemoteApiObservedEvent(
      livenessState,
      livenessState.startedAt,
      'status',
      'Claude Code remote API stream started.',
    );
    yield {
      eventType: AgentStreamEventType.STATUS,
      timestamp: livenessState.startedAt,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'starting',
        surface: CLAUDE_CODE_SURFACE,
        transportKind: AdapterTransportKind.REMOTE_API,
        vendorBindingKind: remoteApiOptions.vendorBinding,
        detail: 'Claude Code remote API stream started.',
        invokeLiveness: this.buildRemoteApiInvokeLivenessSnapshot(
          request,
          remoteApiOptions,
          livenessState,
          {
            status: 'starting',
            cancelMechanism: 'none',
            partialOutputPreserved: false,
          },
        ),
      },
    };

    let completedEmitted = false;
    try {
      for await (const event of this.executeRemoteApiStreamRequest({
        prompt,
        timeoutMs: this.resolveStreamTimeoutMs(request),
        ...(request.signal ? { signal: request.signal } : {}),
      })) {
        this.captureRemoteApiTransportEvent(livenessState, event);
        if (event.eventType === AgentStreamEventType.TOKEN) {
          const text =
            typeof event.payload.delta === 'string'
              ? event.payload.delta
              : typeof event.payload.text === 'string'
                ? event.payload.text
                : '';
          livenessState.accumulatedText += text;
          this.captureRemoteApiSemanticProgress(livenessState, event.timestamp);
          yield {
            ...event,
            processId: request.processId,
            executionId: request.executionId,
            stageId: request.stageId,
            routeKey: request.routeKey,
            payload: {
              ...event.payload,
              surface: CLAUDE_CODE_SURFACE,
              transportKind: AdapterTransportKind.REMOTE_API,
              vendorBindingKind: remoteApiOptions.vendorBinding,
              remoteRequestId: livenessState.remoteRequestId,
              accumulatedText: livenessState.accumulatedText,
              invokeLiveness: this.buildRemoteApiInvokeLivenessSnapshot(
                request,
                remoteApiOptions,
                livenessState,
                {
                  status: 'running',
                  cancelMechanism: 'none',
                  partialOutputPreserved: false,
                },
              ),
            },
          };
          continue;
        }

        if (event.eventType === AgentStreamEventType.COMPLETED) {
          completedEmitted = true;
        }
        const livenessStatus: ClaudeCodeRemoteApiLivenessStatus =
          event.eventType === AgentStreamEventType.COMPLETED ? 'completed' : 'running';
        yield {
          ...event,
          processId: request.processId,
          executionId: request.executionId,
          stageId: request.stageId,
          routeKey: request.routeKey,
          payload: {
            ...event.payload,
            surface: CLAUDE_CODE_SURFACE,
            transportKind: AdapterTransportKind.REMOTE_API,
            vendorBindingKind: remoteApiOptions.vendorBinding,
            remoteRequestId: livenessState.remoteRequestId,
            ...(livenessState.accumulatedText.length > 0
              ? {
                  accumulatedText: livenessState.accumulatedText,
                  responseText: livenessState.accumulatedText,
                }
              : {}),
            invokeLiveness: this.buildRemoteApiInvokeLivenessSnapshot(
              request,
              remoteApiOptions,
              livenessState,
              {
                status: livenessStatus,
                cancelMechanism: 'none',
                partialOutputPreserved: false,
                ...(event.eventType === AgentStreamEventType.COMPLETED
                  ? {
                      lastTerminalSignalAt: event.timestamp,
                    }
                  : {}),
              },
            ),
          },
        };
      }
      if (!completedEmitted) {
        const completedAt = new Date().toISOString();
        this.recordRemoteApiObservedEvent(
          livenessState,
          completedAt,
          AgentStreamEventType.COMPLETED,
          livenessState.accumulatedText,
        );
        yield {
          eventType: AgentStreamEventType.COMPLETED,
          timestamp: completedAt,
          processId: request.processId,
          executionId: request.executionId,
          stageId: request.stageId,
          routeKey: request.routeKey,
          payload: {
            status: 'completed',
            surface: CLAUDE_CODE_SURFACE,
            transportKind: AdapterTransportKind.REMOTE_API,
            vendorBindingKind: remoteApiOptions.vendorBinding,
            remoteRequestId: livenessState.remoteRequestId,
            ...(livenessState.accumulatedText.length > 0
              ? {
                  accumulatedText: livenessState.accumulatedText,
                  responseText: livenessState.accumulatedText,
                }
              : {}),
            invokeLiveness: this.buildRemoteApiInvokeLivenessSnapshot(
              request,
              remoteApiOptions,
              livenessState,
              {
                status: 'completed',
                cancelMechanism: 'none',
                partialOutputPreserved: false,
                lastTerminalSignalAt: completedAt,
              },
            ),
          },
        };
      }
    } catch (error) {
      const standardizedError = standardizeError(error);
      const failedAt = new Date().toISOString();
      const partialOutputPreserved = livenessState.accumulatedText.length > 0;
      this.recordRemoteApiObservedEvent(
        livenessState,
        failedAt,
        AgentStreamEventType.FAILED,
        partialOutputPreserved ? livenessState.accumulatedText : standardizedError.message,
      );
      const suspectReasonCodes = [
        ...(this.isRemoteApiTimeoutBudgetError(error) ? ['invoke_hard_timeout'] : []),
        ...(partialOutputPreserved ? ['invoke_partial_output_preserved'] : []),
      ];
      yield {
        eventType: AgentStreamEventType.FAILED,
        timestamp: failedAt,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'failed',
          surface: CLAUDE_CODE_SURFACE,
          message: standardizedError.message,
          transportKind: AdapterTransportKind.REMOTE_API,
          vendorBindingKind: remoteApiOptions.vendorBinding,
          remoteRequestId: livenessState.remoteRequestId,
          ...(partialOutputPreserved
            ? {
                accumulatedText: livenessState.accumulatedText,
                responseText: livenessState.accumulatedText,
              }
            : {}),
          invokeLiveness: this.buildRemoteApiInvokeLivenessSnapshot(
            request,
            remoteApiOptions,
            livenessState,
            {
              status:
                this.isRemoteApiAbortError(error) && request.signal?.aborted
                  ? 'cancelled'
                  : 'failed',
              cancelMechanism:
                this.isRemoteApiAbortError(error) || this.isRemoteApiTimeoutBudgetError(error)
                  ? 'http_stream_abort'
                  : 'none',
              partialOutputPreserved,
              lastTerminalSignalAt: failedAt,
              ...(suspectReasonCodes.length > 0 ? { suspectReasonCodes } : {}),
            },
          ),
        },
      };
      throw error;
    }
  }

  private async executeRemoteApiJsonRequest(request: {
    prompt: string;
    timeoutMs: number;
    signal?: AbortSignal;
  }): Promise<{
    responseId: string | null;
    responseText: string;
    structuredResponse?: unknown;
    usage?: AgentInvokeStageResult['usage'];
    elapsedMs: number;
  }> {
    const remoteApiOptions = this.requireRemoteApiOptions();
    const credentialResolution = this.resolveRemoteApiCredentialResolution(remoteApiOptions);
    if (!credentialResolution.value) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
        `Claude Code remote API credential selector "${credentialResolution.detail}" is missing.`,
        {
          surface: CLAUDE_CODE_SURFACE,
          credentialSelector: credentialResolution.detail,
        },
      );
    }
    const credentialValue = credentialResolution.value;

    const startedAt = Date.now();
    const fetchResult = await this.executeRemoteApiWithRetry<ClaudeCodeRemoteApiFetchResult>(
      request.timeoutMs,
      request.signal,
      async ({ timeoutMs, signal }) => {
        const controller = this.createRemoteApiAbortController(signal, timeoutMs);
        try {
          const response = await this.options.fetchImplementation(remoteApiOptions.endpoint, {
            method: 'POST',
            headers: {
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
              'x-api-key': credentialValue,
            },
            body: JSON.stringify({
              model: remoteApiOptions.model,
              max_tokens: CLAUDE_CODE_REMOTE_API_DEFAULT_MAX_TOKENS,
              messages: [
                {
                  role: 'user',
                  content: request.prompt,
                },
              ],
            }),
            signal: controller.signal,
          });
          return {
            response,
            cleanup: controller.cleanup,
            didTimeout: controller.didTimeout,
          };
        } catch (error) {
          controller.cleanup();
          if (this.isRemoteApiAbortError(error) && controller.didTimeout()) {
            throw this.createRemoteApiTimeoutBudgetError(timeoutMs);
          }
          throw error;
        }
      },
    );
    try {
      const responseBodyText = await fetchResult.response.text();
      if (!fetchResult.response.ok) {
        throw this.createRemoteApiHttpError(fetchResult.response.status, responseBodyText);
      }

      const parsedBody = JSON.parse(responseBodyText) as {
        id?: string;
        content?: Array<{
          type?: string;
          text?: string;
        }>;
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
        };
      };
      const responseText = this.extractRemoteApiResponseText(parsedBody);
      const structuredResponse = this.resolveStructuredResponse(responseText);
      return {
        responseId: parsedBody.id ?? null,
        responseText,
        ...(structuredResponse !== undefined
          ? {
              structuredResponse,
            }
          : {}),
        ...(parsedBody.usage
          ? {
              usage: {
                inputTokens: parsedBody.usage.input_tokens,
                outputTokens: parsedBody.usage.output_tokens,
                totalTokens:
                  (parsedBody.usage.input_tokens ?? 0) + (parsedBody.usage.output_tokens ?? 0),
              },
            }
          : {}),
        elapsedMs: Date.now() - startedAt,
      };
    } catch (error) {
      if (this.isRemoteApiAbortError(error) && fetchResult.didTimeout()) {
        throw this.createRemoteApiTimeoutBudgetError(request.timeoutMs);
      }
      throw error;
    } finally {
      fetchResult.cleanup();
    }
  }

  private async *executeRemoteApiStreamRequest(request: {
    prompt: string;
    timeoutMs: number;
    signal?: AbortSignal;
  }): AsyncIterable<AgentStreamEvent> {
    const remoteApiOptions = this.requireRemoteApiOptions();
    const credentialResolution = this.resolveRemoteApiCredentialResolution(remoteApiOptions);
    if (!credentialResolution.value) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
        `Claude Code remote API credential selector "${credentialResolution.detail}" is missing.`,
        {
          surface: CLAUDE_CODE_SURFACE,
          credentialSelector: credentialResolution.detail,
        },
      );
    }
    const credentialValue = credentialResolution.value;

    const fetchResult = await this.executeRemoteApiWithRetry<ClaudeCodeRemoteApiFetchResult>(
      request.timeoutMs,
      request.signal,
      async ({ timeoutMs, signal }) => {
        const controller = this.createRemoteApiAbortController(signal, timeoutMs);
        try {
          const response = await this.options.fetchImplementation(remoteApiOptions.endpoint, {
            method: 'POST',
            headers: {
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
              'x-api-key': credentialValue,
            },
            body: JSON.stringify({
              model: remoteApiOptions.model,
              max_tokens: CLAUDE_CODE_REMOTE_API_DEFAULT_MAX_TOKENS,
              stream: true,
              messages: [
                {
                  role: 'user',
                  content: request.prompt,
                },
              ],
            }),
            signal: controller.signal,
          });
          return {
            response,
            cleanup: controller.cleanup,
            didTimeout: controller.didTimeout,
          };
        } catch (error) {
          controller.cleanup();
          if (this.isRemoteApiAbortError(error) && controller.didTimeout()) {
            throw this.createRemoteApiTimeoutBudgetError(timeoutMs);
          }
          throw error;
        }
      },
    );
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      if (!fetchResult.response.ok) {
        throw this.createRemoteApiHttpError(
          fetchResult.response.status,
          await fetchResult.response.text(),
        );
      }
      if (!fetchResult.response.body) {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
          'Claude Code remote API stream response body is missing.',
          {
            surface: CLAUDE_CODE_SURFACE,
          },
        );
      }

      reader = fetchResult.response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const chunkResult = await reader.read();
        if (chunkResult.done) {
          if (buffer.trim().length > 0) {
            yield* this.parseRemoteApiSseChunk(buffer);
          }
          return;
        }
        buffer += decoder.decode(chunkResult.value, {
          stream: true,
        });
        const rawEvents = buffer.split(CLAUDE_CODE_REMOTE_API_SSE_EVENT_DELIMITER);
        buffer = rawEvents.pop() ?? '';
        for (const rawEvent of rawEvents) {
          yield* this.parseRemoteApiSseChunk(rawEvent);
        }
      }
    } catch (error) {
      if (this.isRemoteApiAbortError(error) && fetchResult.didTimeout()) {
        throw this.createRemoteApiTimeoutBudgetError(request.timeoutMs);
      }
      throw error;
    } finally {
      await reader?.cancel().catch(() => undefined);
      fetchResult.cleanup();
    }
  }

  private async executeRemoteApiWithRetry<T>(
    timeoutMs: number,
    signal: AbortSignal | undefined,
    runner: (request: {
      timeoutMs: number;
      signal?: AbortSignal;
    }) => Promise<T>,
  ): Promise<T> {
    const remoteApiOptions = this.requireRemoteApiOptions();
    const deadlineAt = Date.now() + Math.max(1, timeoutMs);
    let attempt = 0;
    let lastError: unknown;
    while (true) {
      const remainingTimeoutMs = this.resolveRemainingRemoteApiTimeoutMs(deadlineAt, timeoutMs);
      if (remainingTimeoutMs <= 0) {
        throw lastError ?? this.createRemoteApiTimeoutBudgetError(timeoutMs);
      }
      try {
        return await runner({
          timeoutMs: remainingTimeoutMs,
          ...(signal ? { signal } : {}),
        });
      } catch (error) {
        lastError = error;
        attempt += 1;
        if (
          attempt > remoteApiOptions.maxRetries ||
          signal?.aborted ||
          this.isRemoteApiAbortError(error)
        ) {
          throw error;
        }
        const remainingBudgetAfterFailure = this.resolveRemainingRemoteApiTimeoutMs(
          deadlineAt,
          timeoutMs,
        );
        const retryBackoffMs = this.resolveRemoteApiRetryBackoffMs(
          attempt,
          remainingBudgetAfterFailure,
        );
        if (retryBackoffMs <= 0) {
          throw error;
        }
        await delay(retryBackoffMs, undefined, {
          ...(signal ? { signal } : {}),
        });
      }
    }
  }

  private resolveRemainingRemoteApiTimeoutMs(
    deadlineAt: number,
    fallbackTimeoutMs: number,
  ): number {
    if (!Number.isFinite(deadlineAt)) {
      return fallbackTimeoutMs;
    }
    return Math.max(0, deadlineAt - Date.now());
  }

  private resolveRemoteApiRetryBackoffMs(attempt: number, remainingBudgetMs: number): number {
    if (remainingBudgetMs <= 0) {
      return 0;
    }
    return Math.max(
      0,
      Math.min(Math.max(1, this.options.retryBackoffMs) * attempt, remainingBudgetMs),
    );
  }

  private isRemoteApiAbortError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const name = (error as { name?: unknown }).name;
    return typeof name === 'string' && name === 'AbortError';
  }

  private isRemoteApiTimeoutBudgetError(error: unknown): boolean {
    if (!(error instanceof RuntimeError)) {
      return false;
    }
    return (
      error.code === GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED &&
      error.message.includes('exhausted the timeout budget')
    );
  }

  private createRemoteApiTimeoutBudgetError(timeoutMs: number): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      `Claude Code remote API request exhausted the timeout budget of ${timeoutMs}ms.`,
      {
        surface: CLAUDE_CODE_SURFACE,
        timeoutMs,
      },
    );
  }

  private createRemoteApiAbortController(
    signal: AbortSignal | undefined,
    timeoutMs: number,
  ): {
    signal: AbortSignal;
    cleanup: () => void;
    didTimeout: () => boolean;
  } {
    const controller = new AbortController();
    let didTimeout = false;
    const timeoutHandle = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, timeoutMs);
    if (signal) {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }
    return {
      signal: controller.signal,
      cleanup: () => {
        clearTimeout(timeoutHandle);
      },
      didTimeout: () => didTimeout,
    };
  }

  private createRemoteApiLivenessState(): ClaudeCodeRemoteApiLivenessState {
    return {
      startedAt: new Date().toISOString(),
      accumulatedText: '',
      remoteRequestId: null,
      lastTransportActivityAt: null,
      lastSemanticProgressAt: null,
      latestEventAt: null,
      latestEventType: null,
      latestTextPreview: null,
    };
  }

  private buildRemoteApiInvokeLivenessSnapshot(
    request: Pick<AgentStreamEventsRequest, 'routeKey' | 'input'>,
    remoteApiOptions: ResolvedClaudeCodeRemoteApiOptions,
    state: ClaudeCodeRemoteApiLivenessState,
    options: {
      status: ClaudeCodeRemoteApiLivenessStatus;
      cancelMechanism: ClaudeCodeRemoteApiCancelMechanism;
      partialOutputPreserved: boolean;
      lastTerminalSignalAt?: string;
      suspectReasonCodes?: string[];
    },
  ): Record<string, unknown> {
    const roleId = this.resolveRemoteApiRoleId(request.input);
    return {
      adapterId: this.options.agentId,
      surfaceId: CLAUDE_CODE_SURFACE,
      routeKey: request.routeKey,
      ...(roleId ? { roleId } : {}),
      startedAt: state.startedAt,
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
      activeOperationKind: 'remote_api_stream',
      activeOperationStartedAt: state.startedAt,
      partialOutputPreserved: options.partialOutputPreserved,
      transportKind: AdapterTransportKind.REMOTE_API,
      vendorBindingKind: remoteApiOptions.vendorBinding,
      remoteRequestId: state.remoteRequestId,
      cancelMechanism: options.cancelMechanism,
      ...(options.suspectReasonCodes && options.suspectReasonCodes.length > 0
        ? { suspectReasonCodes: options.suspectReasonCodes }
        : {}),
    };
  }

  private captureRemoteApiTransportEvent(
    state: ClaudeCodeRemoteApiLivenessState,
    event: AgentStreamEvent,
  ): void {
    state.lastTransportActivityAt = event.timestamp;
    state.remoteRequestId = this.resolveRemoteApiRequestId(event.payload) ?? state.remoteRequestId;
    this.recordRemoteApiObservedEvent(
      state,
      event.timestamp,
      event.eventType,
      this.resolveRemoteApiEventPreview(event.payload) ?? state.accumulatedText,
    );
  }

  private captureRemoteApiSemanticProgress(
    state: ClaudeCodeRemoteApiLivenessState,
    timestamp: string,
  ): void {
    state.lastSemanticProgressAt = timestamp;
    state.latestTextPreview = this.resolveRemoteApiTextPreview(state.accumulatedText);
  }

  private recordRemoteApiObservedEvent(
    state: ClaudeCodeRemoteApiLivenessState,
    timestamp: string,
    eventType: string,
    previewSource?: string,
  ): void {
    state.latestEventAt = timestamp;
    state.latestEventType = eventType;
    const preview = this.resolveRemoteApiTextPreview(previewSource);
    if (preview) {
      state.latestTextPreview = preview;
    }
  }

  private resolveRemoteApiEventPreview(payload: Record<string, unknown>): string | undefined {
    const candidates = [
      payload.detail,
      payload.message,
      payload.responseText,
      payload.accumulatedText,
      payload.text,
      payload.delta,
    ];
    const previewSource = candidates.find((candidate) => typeof candidate === 'string');
    return typeof previewSource === 'string' ? previewSource : undefined;
  }

  private resolveRemoteApiRequestId(payload: Record<string, unknown>): string | null {
    const candidates = [payload.remoteRequestId, payload.remoteMessageId];
    const requestId = candidates.find(
      (candidate) => typeof candidate === 'string' && candidate.trim().length > 0,
    );
    return typeof requestId === 'string' ? requestId : null;
  }

  private resolveRemoteApiTextPreview(source: string | undefined): string | null {
    if (typeof source !== 'string') {
      return null;
    }
    const normalized = source.trim();
    if (normalized.length === 0) {
      return null;
    }
    return normalized.length > 160 ? normalized.slice(-160) : normalized;
  }

  private resolveRemoteApiRoleId(input: Record<string, unknown>): string | undefined {
    const roleId = input.roleId;
    return typeof roleId === 'string' && roleId.trim().length > 0 ? roleId : undefined;
  }

  private *parseRemoteApiSseChunk(rawEvent: string): Generator<AgentStreamEvent> {
    const eventLines = rawEvent
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (eventLines.length === 0) {
      return;
    }

    const eventName =
      eventLines
        .find((line) => line.startsWith('event:'))
        ?.slice('event:'.length)
        .trim() ?? '';
    const dataLines = eventLines
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).trim());
    if (dataLines.length === 0) {
      return;
    }

    const payloadText = dataLines.join('\n');
    if (payloadText === '[DONE]') {
      return;
    }

    const payload = JSON.parse(payloadText) as {
      type?: string;
      delta?: {
        type?: string;
        text?: string;
      };
      message?: {
        id?: string;
      };
    };
    if (
      (eventName === 'message_start' || payload.type === 'message_start') &&
      typeof payload.message?.id === 'string' &&
      payload.message.id.trim().length > 0
    ) {
      yield {
        eventType: AgentStreamEventType.STATUS,
        timestamp: new Date().toISOString(),
        processId: '',
        executionId: '',
        stageId: '',
        routeKey: '',
        payload: {
          status: 'running',
          detail: 'Claude Code remote message created.',
          remoteRequestId: payload.message.id,
          remoteMessageId: payload.message.id,
        },
      };
      return;
    }
    if (
      (eventName === 'content_block_delta' || payload.type === 'content_block_delta') &&
      payload.delta?.type === 'text_delta' &&
      typeof payload.delta.text === 'string'
    ) {
      yield {
        eventType: AgentStreamEventType.TOKEN,
        timestamp: new Date().toISOString(),
        processId: '',
        executionId: '',
        stageId: '',
        routeKey: '',
        payload: {
          delta: payload.delta.text,
          text: payload.delta.text,
        },
      };
      return;
    }

    if (eventName === 'message_stop' || payload.type === 'message_stop') {
      yield {
        eventType: AgentStreamEventType.COMPLETED,
        timestamp: new Date().toISOString(),
        processId: '',
        executionId: '',
        stageId: '',
        routeKey: '',
        payload: {
          status: 'completed',
          remoteRequestId: payload.message?.id ?? null,
          remoteMessageId: payload.message?.id ?? null,
        },
      };
    }
  }

  private extractRemoteApiResponseText(payload: {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }): string {
    const text = (payload.content ?? [])
      .map((contentItem) => contentItem.text ?? '')
      .join('')
      .trim();
    if (text.length > 0) {
      return text;
    }

    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      'Claude Code remote API returned no output text.',
      {
        surface: CLAUDE_CODE_SURFACE,
      },
    );
  }

  private resolveRemoteApiProbeFailureReasons(
    error: unknown,
    remoteApiOptions: ResolvedClaudeCodeRemoteApiOptions,
  ): string[] {
    const standardizedError = standardizeError(error);
    const detail = JSON.stringify(standardizedError.details ?? {});
    if (detail.includes('"httpStatus":401') || detail.includes('"httpStatus":403')) {
      return [`credential_invalid:${CLAUDE_CODE_SURFACE}:${remoteApiOptions.credentialEnvVar}`];
    }
    if (detail.includes('"httpStatus":429')) {
      return [`provider_rate_limited:${CLAUDE_CODE_SURFACE}`];
    }
    return [`endpoint_unreachable:${CLAUDE_CODE_SURFACE}`];
  }

  private createRemoteApiHttpError(status: number, bodyText: string): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      `Claude Code remote API request failed with status ${String(status)}.`,
      {
        surface: CLAUDE_CODE_SURFACE,
        httpStatus: status,
        responseBodySnippet: bodyText.slice(0, 400),
      },
    );
  }

  private requireRemoteApiOptions(): ResolvedClaudeCodeRemoteApiOptions {
    const remoteApiOptions = this.resolveRemoteApiOptions();
    if (remoteApiOptions) {
      return remoteApiOptions;
    }
    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      'Claude Code remote API transport requires remoteApi config.',
      {
        surface: CLAUDE_CODE_SURFACE,
      },
    );
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
        request.signal?.removeEventListener('abort', onAbortSignal);
        if (isError) {
          reject(result);
          return;
        }
        resolveResult(result as ClaudeCodeExecRunnerResult);
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
      return normalizeClaudeCodeTimeoutMs(request.agentInvocationTimeoutMs);
    }

    if (this.shouldUseRepositoryReviewMode(request)) {
      return normalizeClaudeCodeTimeoutMs(CLAUDE_CODE_REPOSITORY_REVIEW_TIMEOUT_MS);
    }

    return normalizeClaudeCodeTimeoutMs(this.options.requestTimeoutMs);
  }

  private resolveStreamTimeoutMs(request: AgentStreamEventsRequest): number {
    if (typeof request.agentInvocationTimeoutMs === 'number') {
      return normalizeClaudeCodeTimeoutMs(request.agentInvocationTimeoutMs);
    }

    if (this.shouldUseRepositoryReviewMode(request)) {
      return normalizeClaudeCodeTimeoutMs(CLAUDE_CODE_REPOSITORY_REVIEW_TIMEOUT_MS);
    }

    return normalizeClaudeCodeTimeoutMs(this.options.requestTimeoutMs);
  }
}
