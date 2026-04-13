import { setTimeout as delay } from 'node:timers/promises';

import {
  AgentAvailabilityStatus,
  type AgentCancelRequest,
  type AgentCancelResult,
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentCliExecOperation,
  AgentCliExecOperationsRuntime,
  type AgentCliLaunchDiagnostics,
  AgentConfirmationDecision,
  type AgentConfirmationRequest,
  type AgentConfirmationResult,
  type AgentHealthCheckDiagnostic,
  type AgentInvokeStageRequest,
  type AgentInvokeStageResult,
  type AgentProbeRequest,
  type AgentProbeResult,
  AgentProtocol,
  AgentStageContinuationHandleKind,
  AgentStageContinuationStatus,
  AgentStageContinuationTransportKind,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
  type AgentStreamEvent,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
  DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS,
  DEFAULT_AGENT_CLI_EXEC_RETRY_BACKOFF_MS,
  NativeCliExecProcessRuntime,
  type ProviderContinuationHandle,
  buildLayeredHealthCheckResult,
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
const CODEX_CLI_WATCHDOG_MIN_INTERVAL_MS = 1000;
const CODEX_CLI_WATCHDOG_MAX_INTERVAL_MS = 5000;
const CODEX_CLI_WATCHDOG_MIN_TRANSPORT_IDLE_MS = 5000;
const CODEX_CLI_WATCHDOG_MAX_TRANSPORT_IDLE_MS = 25000;
const CODEX_CLI_WATCHDOG_MIN_SEMANTIC_STALL_MS = 8000;
const CODEX_CLI_WATCHDOG_MAX_SEMANTIC_STALL_MS = 28000;
const CODEX_CLI_TERMINATE_GRACE_MIN_MS = 250;
const CODEX_CLI_TERMINATE_GRACE_MAX_MS = 2000;
const CODEX_EXEC_ARGS = ['exec', '--skip-git-repo-check', '--json', '-'] as const;
const CODEX_REVIEW_EXEC_ARGS = [
  'exec',
  'review',
  '--skip-git-repo-check',
  '--json',
  '--uncommitted',
] as const;
const CODEX_CHAT_ONLY_EXEC_ARGS = ['--sandbox', 'read-only'] as const;
const CODEX_HEALTH_CHECK_PROMPT = 'Respond with exactly OK.';
const CODEX_HEALTH_CHECK_EXPECTED_RESPONSE = 'OK';
const CODEX_REPOSITORY_REVIEW_SCOPE = 'uncommitted_changes';
const CODEX_REMOTE_API_DEFAULT_ENDPOINT = 'https://api.openai.com/v1/responses';
const CODEX_REMOTE_API_DEFAULT_CREDENTIAL_ENV_VAR = 'OPENAI_API_KEY';
const CODEX_REMOTE_API_DEFAULT_MAX_RETRIES = 2;
const CODEX_REMOTE_API_SSE_EVENT_DELIMITER = '\n\n';

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
  text?: string;
  delta?: string;
  content?: unknown;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  item?: {
    id?: string;
    type?: string;
    text?: string;
    delta?: string;
    content?: unknown;
    command?: string;
    aggregated_output?: string;
    exit_code?: number | null;
    status?: string;
    items?: Array<{
      text?: string;
      completed?: boolean;
    }>;
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
  startedAt: string | null;
  lastTransportActivityAt: string | null;
  lastSemanticProgressAt: string | null;
  latestEventAt: string | null;
  latestEventType: string | null;
  latestTextPreview: string | null;
  transportIdleSuspectActive: boolean;
  semanticStallSuspectActive: boolean;
  resultPromise: Promise<CodexExecRunnerResult>;
  cleanupTimer: NodeJS.Timeout | null;
  progressTimer: NodeJS.Timeout | null;
  watchdogTimer: NodeJS.Timeout | null;
}

interface CodexProbeResolution {
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
  launchDiagnostics?: AgentCliLaunchDiagnostics | null;
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
  remoteApi?: AdapterRemoteApiConfig;
  resolveCredentialRef?: (selector: string) => Promise<string | null>;
  fetchImplementation: typeof fetch;
}

interface ResolvedCodexRemoteApiOptions {
  provider: AdapterProviderKind.OPENAI;
  vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES;
  model: string;
  endpoint: string;
  endpointSource: AdapterEndpointSource;
  credentialEnvVar: string;
  credentialEnvVarExplicit: boolean;
  credentialRef: string | null;
  requestTimeoutMs: number;
  maxRetries: number;
}

interface CodexRemoteApiCredentialResolution {
  source: AdapterCredentialSource;
  value: string | null;
  detail: string;
}

type CodexRemoteApiLivenessStatus = 'starting' | 'running' | 'completed' | 'failed' | 'cancelled';
type CodexRemoteApiCancelMechanism = 'none' | 'http_stream_abort';
type CodexCliLivenessStatus =
  | 'starting'
  | 'running'
  | 'transport_idle_suspect'
  | 'semantic_stall_suspect'
  | 'graceful_interrupting'
  | 'hard_terminating'
  | 'completed'
  | 'failed';
type CodexCliCancelMechanism = 'none' | 'process_signal' | 'abort_signal';

interface CodexRemoteApiFetchResult {
  response: Response;
  cleanup: () => void;
  didTimeout: () => boolean;
}

interface CodexRemoteApiLivenessState {
  startedAt: string;
  accumulatedText: string;
  remoteRequestId: string | null;
  lastTransportActivityAt: string | null;
  lastSemanticProgressAt: string | null;
  latestEventAt: string | null;
  latestEventType: string | null;
  latestTextPreview: string | null;
}

interface CodexRemoteApiContinuationReuseResolution {
  laneKey?: string;
  previousResponseId?: string;
  priorHandlePresent: boolean;
  invalidationReason?: string;
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
  private readonly cliProcessRuntime: NativeCliExecProcessRuntime;
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
      ...(options.remoteApi
        ? {
            remoteApi: options.remoteApi,
          }
        : {}),
      ...(options.resolveCredentialRef
        ? {
            resolveCredentialRef: options.resolveCredentialRef,
          }
        : {}),
      fetchImplementation: options.fetchImplementation ?? fetch,
    };
    this.cliExecOperationsRuntime = new AgentCliExecOperationsRuntime(
      CODEX_SURFACE,
      this.options.maxRetryAttempts,
      this.options.retryBackoffMs,
    );
    this.cliProcessRuntime = new NativeCliExecProcessRuntime(this.cliExecOperationsRuntime);
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
    const remoteApiOptions = this.resolveRemoteApiOptions();
    const remoteApiCredentialResolution = remoteApiOptions
      ? await this.resolveRemoteApiCredentialResolution(remoteApiOptions)
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
        surface: CODEX_SURFACE,
        roleProfileId: this.options.roleProfileId,
        roleSource: this.options.roleSource,
      },
      availabilityStatus,
      capabilityMatrix,
      unavailableReasons,
      healthCheck: buildLayeredHealthCheckResult({
        adapterId: this.options.agentId,
        surfaceId: CODEX_SURFACE,
        availabilityStatus,
        selectedEntrypoint:
          remoteApiOptions?.endpoint ??
          runtimeProbe.launchDiagnostics?.selectedEntrypoint ??
          this.options.command,
        routeKey: request.routeKey,
        routeRequirements: (request.requiredCapabilities ?? []).map(String),
        fallbackAllowed: true,
        unavailableReasons,
        unsupportedCapabilities: unsupportedCapabilities.map(String),
        degradedCapabilities: degradedCapabilities.map(String),
        transportKind:
          this.options.executionMode === CodexAgentAdapterExecutionMode.REMOTE_API
            ? AdapterTransportKind.REMOTE_API
            : this.options.executionMode === CodexAgentAdapterExecutionMode.CLI_EXEC
              ? AdapterTransportKind.CLI_EXEC
              : AdapterTransportKind.BASELINE,
        providerKind: remoteApiOptions?.provider ?? null,
        vendorBindingKind: remoteApiOptions?.vendorBinding ?? null,
        model: remoteApiOptions?.model ?? null,
        credentialSource: remoteApiCredentialResolution?.source ?? null,
        endpointSource: remoteApiOptions?.endpointSource ?? null,
        diagnostics: remoteApiOptions
          ? remoteApiCredentialResolution?.source === AdapterCredentialSource.CREDENTIAL_REF &&
            remoteApiCredentialResolution.value &&
            remoteApiCredentialResolution.detail.length > 0
            ? [
                {
                  layer: 'auth',
                  status: 'pass',
                  code: 'auth.credential_reference_resolved',
                  detail: remoteApiCredentialResolution.detail,
                },
              ]
            : []
          : this.buildCliLaunchHealthDiagnostics(runtimeProbe.launchDiagnostics),
        requestCancellationMode:
          this.options.executionMode === CodexAgentAdapterExecutionMode.REMOTE_API
            ? AdapterRequestCancellationMode.LOCAL_ABORT_ONLY
            : this.resolveCliRequestCancellationMode(),
      }),
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
        ...(request.continuation
          ? {
              continuation: {
                status: AgentStageContinuationStatus.UNSUPPORTED,
                ...(request.continuation.laneKey ? { laneKey: request.continuation.laneKey } : {}),
              },
            }
          : {}),
        elapsedMs: 1,
      };
    }

    if (this.options.executionMode === CodexAgentAdapterExecutionMode.REMOTE_API) {
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
      ...(request.continuation
        ? {
            continuation: {
              status: AgentStageContinuationStatus.UNSUPPORTED,
              ...(request.continuation.laneKey ? { laneKey: request.continuation.laneKey } : {}),
            },
          }
        : {}),
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

    if (this.options.executionMode === CodexAgentAdapterExecutionMode.REMOTE_API) {
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

  /**
   * Requests confirmation via Codex adapter baseline flow.
   * @param _request Confirmation request payload.
   * @returns Confirmation decision payload.
   */
  public override async requestConfirmation(
    _request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    if (
      this.options.executionMode === CodexAgentAdapterExecutionMode.CLI_EXEC ||
      this.options.executionMode === CodexAgentAdapterExecutionMode.REMOTE_API
    ) {
      return {
        decision: AgentConfirmationDecision.REVISE,
        reason:
          this.options.executionMode === CodexAgentAdapterExecutionMode.REMOTE_API
            ? 'codex-remote-api-confirmation-gate-unsupported'
            : 'codex-cli-confirmation-gate-unsupported',
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
    if (this.options.executionMode === CodexAgentAdapterExecutionMode.REMOTE_API) {
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
        supportsReasonPropagation:
          this.options.executionMode === CodexAgentAdapterExecutionMode.REMOTE_API
            ? false
            : supportsCancellation,
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
        launchDiagnostics: null,
      };
    }

    if (this.options.executionMode === CodexAgentAdapterExecutionMode.REMOTE_API) {
      return await this.executeRemoteApiHealthProbe(signal);
    }

    if (this.options.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: [],
        launchDiagnostics: null,
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
      if (
        !matchesHealthCheckEchoResponse(
          parsedOutput.responseText,
          CODEX_HEALTH_CHECK_EXPECTED_RESPONSE,
        )
      ) {
        return {
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [
            `health_check_invalid_response:${CODEX_SURFACE}:${this.cliExecOperationsRuntime.sanitizeReasonSegment(parsedOutput.responseText)}`,
          ],
          launchDiagnostics: executionResult.launchDiagnostics ?? null,
        };
      }

      return {
        availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        unavailableReasons: [],
        launchDiagnostics: executionResult.launchDiagnostics ?? null,
      };
    } catch (error) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: this.resolveProbeFailureReasons(error),
        launchDiagnostics: this.readCliLaunchDiagnosticsFromError(error),
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
      onStdoutChunk?: (chunk: string) => void;
      onStderrChunk?: (chunk: string) => void;
      onGracefulInterruptStart?: (cancelMechanism: 'process_signal' | 'abort_signal') => void;
      onHardTerminateStart?: (cancelMechanism: 'process_signal' | 'abort_signal') => void;
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
            onStdoutChunk: request.onStdoutChunk,
            onStderrChunk: request.onStderrChunk,
            onGracefulInterruptStart: request.onGracefulInterruptStart,
            onHardTerminateStart: request.onHardTerminateStart,
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
    let jsonEvents: CodexCliJsonEvent[];
    try {
      jsonEvents = executionResult.stdout
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('{'))
        .map((line) => JSON.parse(line) as CodexCliJsonEvent);
    } catch (error) {
      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        operation === AgentCliExecOperation.PROBE
          ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
          : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        `Codex ${operation} returned malformed JSON output: ${standardizedError.message}`,
        this.createCodexCliFailureDetails(executionResult, operation, {
          parseError: standardizedError.message,
        }),
      );
    }

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
        this.createCodexCliFailureDetails(executionResult, operation),
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

  private createCodexCliFailureDetails(
    executionResult: CodexExecRunnerResult,
    operation: AgentCliExecOperation,
    extraDetails: Record<string, unknown> = {},
  ) {
    return this.cliExecOperationsRuntime.createRedactedProcessDetails({
      surface: CODEX_SURFACE,
      operation,
      stdout: executionResult.stdout,
      stderr: executionResult.stderr,
      ...extraDetails,
      ...(executionResult.launchDiagnostics
        ? {
            selectedEntrypoint: executionResult.launchDiagnostics.selectedEntrypoint,
            shellWrapped: executionResult.launchDiagnostics.shellWrapped,
            processTreePolicy: executionResult.launchDiagnostics.processTreePolicy,
            ...(executionResult.launchDiagnostics.spawnErrorCode
              ? {
                  spawnErrorCode: executionResult.launchDiagnostics.spawnErrorCode,
                }
              : {}),
          }
        : {}),
    });
  }

  private resolveRemoteApiOptions(): ResolvedCodexRemoteApiOptions | null {
    if (this.options.executionMode !== CodexAgentAdapterExecutionMode.REMOTE_API) {
      return null;
    }

    const configuredRemoteApi = this.options.remoteApi;
    if (!configuredRemoteApi) {
      return null;
    }

    const credentialEnvVar =
      configuredRemoteApi.credentialEnvVar ?? CODEX_REMOTE_API_DEFAULT_CREDENTIAL_ENV_VAR;

    return {
      provider: AdapterProviderKind.OPENAI,
      vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
      model: configuredRemoteApi.model,
      endpoint: configuredRemoteApi.endpoint ?? CODEX_REMOTE_API_DEFAULT_ENDPOINT,
      endpointSource: configuredRemoteApi.endpoint
        ? AdapterEndpointSource.CONFIG_EXPLICIT
        : AdapterEndpointSource.VENDOR_DEFAULT,
      credentialEnvVar,
      credentialEnvVarExplicit: configuredRemoteApi.credentialEnvVar !== undefined,
      credentialRef: configuredRemoteApi.credentialRef ?? null,
      requestTimeoutMs: configuredRemoteApi.requestTimeoutMs ?? this.options.requestTimeoutMs,
      maxRetries: configuredRemoteApi.maxRetries ?? CODEX_REMOTE_API_DEFAULT_MAX_RETRIES,
    };
  }

  private resolveRemoteApiCredentialResolution(
    remoteApiOptions: ResolvedCodexRemoteApiOptions,
  ): Promise<CodexRemoteApiCredentialResolution> {
    return this.resolveRemoteApiCredentialResolutionAsync(remoteApiOptions);
  }

  private async resolveRemoteApiCredentialResolutionAsync(
    remoteApiOptions: ResolvedCodexRemoteApiOptions,
  ): Promise<CodexRemoteApiCredentialResolution> {
    const environment = this.resolveEnvironment();
    const credentialValue = environment[remoteApiOptions.credentialEnvVar];
    if (typeof credentialValue === 'string' && credentialValue.trim().length > 0) {
      return {
        source: remoteApiOptions.credentialEnvVarExplicit
          ? AdapterCredentialSource.ENV_EXPLICIT
          : AdapterCredentialSource.ENV_DEFAULT,
        value: credentialValue.trim(),
        detail: `${CODEX_SURFACE}:${remoteApiOptions.credentialEnvVar}`,
      };
    }

    if (remoteApiOptions.credentialRef) {
      const resolvedCredentialValue =
        (await this.options.resolveCredentialRef?.(remoteApiOptions.credentialRef)) ?? null;
      return {
        source: AdapterCredentialSource.CREDENTIAL_REF,
        value:
          typeof resolvedCredentialValue === 'string' && resolvedCredentialValue.trim().length > 0
            ? resolvedCredentialValue.trim()
            : null,
        detail: `${CODEX_SURFACE}:${remoteApiOptions.credentialRef}`,
      };
    }

    return {
      source: remoteApiOptions.credentialEnvVarExplicit
        ? AdapterCredentialSource.ENV_EXPLICIT
        : AdapterCredentialSource.ENV_DEFAULT,
      value: null,
      detail: `${CODEX_SURFACE}:${remoteApiOptions.credentialEnvVar}`,
    };
  }

  private async executeRemoteApiHealthProbe(signal?: AbortSignal): Promise<CodexProbeResolution> {
    const remoteApiOptions = this.resolveRemoteApiOptions();
    if (!remoteApiOptions) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: ['vendor_binding_required:codex'],
      };
    }

    const credentialResolution = await this.resolveRemoteApiCredentialResolution(remoteApiOptions);
    if (!credentialResolution.value) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: [`credential_missing:${credentialResolution.detail}`],
      };
    }

    try {
      const response = await this.executeRemoteApiJsonRequest({
        prompt: CODEX_HEALTH_CHECK_PROMPT,
        timeoutMs: remoteApiOptions.requestTimeoutMs,
        signal,
      });
      if (
        !matchesHealthCheckEchoResponse(response.responseText, CODEX_HEALTH_CHECK_EXPECTED_RESPONSE)
      ) {
        return {
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [
            `health_check_invalid_response:${CODEX_SURFACE}:${this.cliExecOperationsRuntime.sanitizeReasonSegment(response.responseText)}`,
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
    const prompt = this.shouldUseRepositoryReviewCommand(request)
      ? this.renderRepositoryReviewPrompt(request)
      : this.renderInvokePrompt(request);
    const continuationReuse = this.resolveRemoteApiContinuationReuse(
      request.continuation,
      remoteApiOptions,
    );
    let invalidationReason = continuationReuse.invalidationReason;
    let response: {
      responseId: string | null;
      responseText: string;
      usage?: AgentInvokeStageResult['usage'];
      elapsedMs: number;
    };
    try {
      response = await this.executeRemoteApiJsonRequest({
        prompt,
        timeoutMs: this.resolveInvokeTimeoutMs(request),
        ...(continuationReuse.previousResponseId
          ? {
              previousResponseId: continuationReuse.previousResponseId,
            }
          : {}),
        ...(request.signal ? { signal: request.signal } : {}),
      });
    } catch (error) {
      if (continuationReuse.previousResponseId && this.isInvalidRemoteApiContinuationError(error)) {
        invalidationReason = this.resolveRemoteApiContinuationInvalidationReason(error);
        response = await this.executeRemoteApiJsonRequest({
          prompt,
          timeoutMs: this.resolveInvokeTimeoutMs(request),
          ...(request.signal ? { signal: request.signal } : {}),
        });
      } else {
        throw error;
      }
    }

    return {
      output: {
        adapterSurface: CODEX_SURFACE,
        routeKey: request.routeKey,
        stageId: request.stageId,
        responseText: response.responseText,
        threadId: response.responseId,
        remoteResponseId: response.responseId,
        vendorBindingKind: remoteApiOptions.vendorBinding,
        echoedInput: request.input,
      },
      ...(request.continuation
        ? {
            continuation: this.buildRemoteApiContinuationResult({
              request,
              responseId: response.responseId,
              remoteApiOptions,
              continuationReuse: {
                ...continuationReuse,
                ...(invalidationReason ? { invalidationReason } : {}),
              },
            }),
          }
        : {}),
      ...(response.usage ? { usage: response.usage } : {}),
      elapsedMs: response.elapsedMs,
    };
  }

  private resolveRemoteApiContinuationReuse(
    continuation: AgentInvokeStageRequest['continuation'],
    remoteApiOptions: ResolvedCodexRemoteApiOptions,
  ): CodexRemoteApiContinuationReuseResolution {
    if (!continuation) {
      return {
        priorHandlePresent: false,
      };
    }

    if (!continuation.handle) {
      return {
        laneKey: continuation.laneKey,
        priorHandlePresent: false,
      };
    }

    const handle = continuation.handle;
    if (handle.transportKind !== AgentStageContinuationTransportKind.REMOTE_API) {
      return {
        laneKey: continuation.laneKey,
        priorHandlePresent: true,
        invalidationReason: 'transport_incompatible',
      };
    }
    if (handle.surface !== CODEX_SURFACE) {
      return {
        laneKey: continuation.laneKey,
        priorHandlePresent: true,
        invalidationReason: 'surface_incompatible',
      };
    }
    if (handle.providerId !== remoteApiOptions.provider && handle.providerId !== CODEX_SURFACE) {
      return {
        laneKey: continuation.laneKey,
        priorHandlePresent: true,
        invalidationReason: 'provider_incompatible',
      };
    }
    if (handle.handleKind !== AgentStageContinuationHandleKind.RESPONSE_ID) {
      return {
        laneKey: continuation.laneKey,
        priorHandlePresent: true,
        invalidationReason: 'handle_kind_incompatible',
      };
    }
    if (
      typeof handle.model === 'string' &&
      handle.model.trim().length > 0 &&
      handle.model !== remoteApiOptions.model
    ) {
      return {
        laneKey: continuation.laneKey,
        priorHandlePresent: true,
        invalidationReason: 'model_incompatible',
      };
    }
    if (handle.value.trim().length === 0) {
      return {
        laneKey: continuation.laneKey,
        priorHandlePresent: true,
        invalidationReason: 'handle_value_missing',
      };
    }

    return {
      laneKey: continuation.laneKey,
      previousResponseId: handle.value,
      priorHandlePresent: true,
    };
  }

  private buildRemoteApiContinuationResult(options: {
    request: AgentInvokeStageRequest;
    responseId: string | null;
    remoteApiOptions: ResolvedCodexRemoteApiOptions;
    continuationReuse: CodexRemoteApiContinuationReuseResolution;
  }): AgentInvokeStageResult['continuation'] {
    const laneKey = options.request.continuation?.laneKey;
    if (!options.responseId) {
      return {
        status: AgentStageContinuationStatus.CLEARED,
        ...(laneKey ? { laneKey } : {}),
        ...(options.continuationReuse.invalidationReason
          ? { invalidationReason: options.continuationReuse.invalidationReason }
          : {}),
      };
    }

    return {
      status: options.continuationReuse.invalidationReason
        ? AgentStageContinuationStatus.REFRESHED
        : options.continuationReuse.previousResponseId
          ? AgentStageContinuationStatus.REUSED
          : AgentStageContinuationStatus.CREATED,
      ...(laneKey ? { laneKey } : {}),
      handle: this.createRemoteApiContinuationHandle(options.responseId, options.remoteApiOptions),
      ...(options.continuationReuse.invalidationReason
        ? { invalidationReason: options.continuationReuse.invalidationReason }
        : {}),
    };
  }

  private async *streamRemoteApiEvents(
    request: AgentStreamEventsRequest,
  ): AsyncIterable<AgentStreamEvent> {
    const remoteApiOptions = this.requireRemoteApiOptions();
    const prompt = this.shouldUseRepositoryReviewCommand(request)
      ? this.renderRepositoryReviewPrompt(request as AgentInvokeStageRequest)
      : this.renderInvokePrompt(request as AgentInvokeStageRequest);
    const livenessState = this.createRemoteApiLivenessState();
    this.recordRemoteApiObservedEvent(
      livenessState,
      livenessState.startedAt,
      'status',
      'Codex remote API stream started.',
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
        surface: CODEX_SURFACE,
        transportKind: AdapterTransportKind.REMOTE_API,
        vendorBindingKind: remoteApiOptions.vendorBinding,
        detail: 'Codex remote API stream started.',
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
              surface: CODEX_SURFACE,
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
        const livenessStatus: CodexRemoteApiLivenessStatus =
          event.eventType === AgentStreamEventType.COMPLETED ? 'completed' : 'running';
        yield {
          ...event,
          processId: request.processId,
          executionId: request.executionId,
          stageId: request.stageId,
          routeKey: request.routeKey,
          payload: {
            ...event.payload,
            surface: CODEX_SURFACE,
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
            surface: CODEX_SURFACE,
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
          surface: CODEX_SURFACE,
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

  private createRemoteApiContinuationHandle(
    responseId: string,
    remoteApiOptions: ResolvedCodexRemoteApiOptions,
  ): ProviderContinuationHandle {
    return {
      providerId: remoteApiOptions.provider,
      surface: CODEX_SURFACE,
      transportKind: AgentStageContinuationTransportKind.REMOTE_API,
      handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
      value: responseId,
      model: remoteApiOptions.model,
      acquiredAt: new Date().toISOString(),
      metadata: {
        vendorBindingKind: remoteApiOptions.vendorBinding,
      },
    };
  }

  private isInvalidRemoteApiContinuationError(error: unknown): boolean {
    const standardizedError = standardizeError(error);
    const details =
      standardizedError.details && typeof standardizedError.details === 'object'
        ? (standardizedError.details as Record<string, unknown>)
        : {};
    const httpStatus = typeof details.httpStatus === 'number' ? details.httpStatus : undefined;
    const responseBodySnippet =
      typeof details.responseBodySnippet === 'string'
        ? details.responseBodySnippet.toLowerCase()
        : '';
    if (httpStatus === 404) {
      return true;
    }
    if (httpStatus !== 400) {
      return false;
    }
    return (
      responseBodySnippet.includes('previous_response_id') ||
      responseBodySnippet.includes('previous response') ||
      responseBodySnippet.includes('response id') ||
      responseBodySnippet.includes('conversation') ||
      responseBodySnippet.includes('not found') ||
      responseBodySnippet.includes('invalid')
    );
  }

  private resolveRemoteApiContinuationInvalidationReason(error: unknown): string {
    const standardizedError = standardizeError(error);
    const details =
      standardizedError.details && typeof standardizedError.details === 'object'
        ? (standardizedError.details as Record<string, unknown>)
        : {};
    const httpStatus = typeof details.httpStatus === 'number' ? details.httpStatus : undefined;
    if (httpStatus === 404) {
      return 'provider_handle_not_found';
    }
    return 'provider_handle_invalid';
  }

  private async executeRemoteApiJsonRequest(request: {
    prompt: string;
    timeoutMs: number;
    previousResponseId?: string;
    signal?: AbortSignal;
  }): Promise<{
    responseId: string | null;
    responseText: string;
    usage?: AgentInvokeStageResult['usage'];
    elapsedMs: number;
  }> {
    const remoteApiOptions = this.requireRemoteApiOptions();
    const credentialResolution = await this.resolveRemoteApiCredentialResolution(remoteApiOptions);
    if (!credentialResolution.value) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
        `Codex remote API credential selector "${credentialResolution.detail}" is missing.`,
        {
          surface: CODEX_SURFACE,
          credentialSelector: credentialResolution.detail,
        },
      );
    }

    const startedAt = Date.now();
    const fetchResult = await this.executeRemoteApiWithRetry<CodexRemoteApiFetchResult>(
      request.timeoutMs,
      request.signal,
      async ({ timeoutMs, signal }) => {
        const controller = this.createRemoteApiAbortController(signal, timeoutMs);
        try {
          const response = await this.options.fetchImplementation(remoteApiOptions.endpoint, {
            method: 'POST',
            headers: {
              authorization: `Bearer ${credentialResolution.value}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: remoteApiOptions.model,
              input: request.prompt,
              ...(request.previousResponseId
                ? {
                    previous_response_id: request.previousResponseId,
                  }
                : {}),
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
        output_text?: string;
        output?: Array<{
          type?: string;
          content?: Array<{
            type?: string;
            text?: string;
          }>;
        }>;
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
        };
      };
      const responseText = this.extractRemoteApiResponseText(parsedBody);
      return {
        responseId: parsedBody.id ?? null,
        responseText,
        ...(parsedBody.usage
          ? {
              usage: {
                inputTokens: parsedBody.usage.input_tokens,
                outputTokens: parsedBody.usage.output_tokens,
                totalTokens: parsedBody.usage.total_tokens,
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
    const credentialResolution = await this.resolveRemoteApiCredentialResolution(remoteApiOptions);
    if (!credentialResolution.value) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
        `Codex remote API credential selector "${credentialResolution.detail}" is missing.`,
        {
          surface: CODEX_SURFACE,
          credentialSelector: credentialResolution.detail,
        },
      );
    }

    const fetchResult = await this.executeRemoteApiWithRetry<CodexRemoteApiFetchResult>(
      request.timeoutMs,
      request.signal,
      async ({ timeoutMs, signal }) => {
        const controller = this.createRemoteApiAbortController(signal, timeoutMs);
        try {
          const response = await this.options.fetchImplementation(remoteApiOptions.endpoint, {
            method: 'POST',
            headers: {
              authorization: `Bearer ${credentialResolution.value}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: remoteApiOptions.model,
              input: request.prompt,
              stream: true,
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
          'Codex remote API stream response body is missing.',
          {
            surface: CODEX_SURFACE,
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
        const rawEvents = buffer.split(CODEX_REMOTE_API_SSE_EVENT_DELIMITER);
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
      `Codex remote API request exhausted the timeout budget of ${timeoutMs}ms.`,
      {
        surface: CODEX_SURFACE,
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

  private createRemoteApiLivenessState(): CodexRemoteApiLivenessState {
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
    remoteApiOptions: ResolvedCodexRemoteApiOptions,
    state: CodexRemoteApiLivenessState,
    options: {
      status: CodexRemoteApiLivenessStatus;
      cancelMechanism: CodexRemoteApiCancelMechanism;
      partialOutputPreserved: boolean;
      lastTerminalSignalAt?: string;
      suspectReasonCodes?: string[];
    },
  ): Record<string, unknown> {
    const roleId = this.resolveRemoteApiRoleId(request.input);
    return {
      adapterId: this.options.agentId,
      surfaceId: CODEX_SURFACE,
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
    state: CodexRemoteApiLivenessState,
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
    state: CodexRemoteApiLivenessState,
    timestamp: string,
  ): void {
    state.lastSemanticProgressAt = timestamp;
    state.latestTextPreview = this.resolveRemoteApiTextPreview(state.accumulatedText);
  }

  private recordRemoteApiObservedEvent(
    state: CodexRemoteApiLivenessState,
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
    const candidates = [payload.remoteRequestId, payload.remoteResponseId];
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
    const dataLines = rawEvent
      .split(/\r?\n/u)
      .map((line) => line.trim())
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
      delta?: string;
      response?: {
        id?: string;
      };
    };
    if (
      payload.type === 'response.created' &&
      typeof payload.response?.id === 'string' &&
      payload.response.id.trim().length > 0
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
          detail: 'Codex remote response created.',
          remoteRequestId: payload.response.id,
          remoteResponseId: payload.response.id,
        },
      };
      return;
    }
    if (payload.type === 'response.output_text.delta' && typeof payload.delta === 'string') {
      yield {
        eventType: AgentStreamEventType.TOKEN,
        timestamp: new Date().toISOString(),
        processId: '',
        executionId: '',
        stageId: '',
        routeKey: '',
        payload: {
          delta: payload.delta,
          text: payload.delta,
        },
      };
      return;
    }

    if (payload.type === 'response.completed') {
      yield {
        eventType: AgentStreamEventType.COMPLETED,
        timestamp: new Date().toISOString(),
        processId: '',
        executionId: '',
        stageId: '',
        routeKey: '',
        payload: {
          status: 'completed',
          remoteRequestId: payload.response?.id ?? null,
          remoteResponseId: payload.response?.id ?? null,
        },
      };
    }
  }

  private extractRemoteApiResponseText(payload: {
    output_text?: string;
    output?: Array<{
      type?: string;
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  }): string {
    if (typeof payload.output_text === 'string' && payload.output_text.trim().length > 0) {
      return payload.output_text;
    }

    const contentText = (payload.output ?? [])
      .flatMap((outputItem) => outputItem.content ?? [])
      .map((contentItem) => contentItem.text ?? '')
      .join('')
      .trim();
    if (contentText.length > 0) {
      return contentText;
    }

    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      'Codex remote API returned no output text.',
      {
        surface: CODEX_SURFACE,
      },
    );
  }

  private resolveRemoteApiProbeFailureReasons(
    error: unknown,
    remoteApiOptions: ResolvedCodexRemoteApiOptions,
  ): string[] {
    const standardizedError = standardizeError(error);
    const detail = JSON.stringify(standardizedError.details ?? {});
    if (detail.includes('"httpStatus":401') || detail.includes('"httpStatus":403')) {
      return [`credential_invalid:${CODEX_SURFACE}:${remoteApiOptions.credentialEnvVar}`];
    }
    if (detail.includes('"httpStatus":429')) {
      return [`provider_rate_limited:${CODEX_SURFACE}`];
    }
    return [`endpoint_unreachable:${CODEX_SURFACE}`];
  }

  private createRemoteApiHttpError(status: number, bodyText: string): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      `Codex remote API request failed with status ${String(status)}.`,
      {
        surface: CODEX_SURFACE,
        httpStatus: status,
        responseBodySnippet: bodyText.slice(0, 400),
      },
    );
  }

  private requireRemoteApiOptions(): ResolvedCodexRemoteApiOptions {
    const remoteApiOptions = this.resolveRemoteApiOptions();
    if (remoteApiOptions) {
      return remoteApiOptions;
    }
    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      'Codex remote API transport requires remoteApi config.',
      {
        surface: CODEX_SURFACE,
      },
    );
  }

  /**
   * Converts one stage invocation request into a Codex prompt payload.
   * @param request Stage invocation request payload.
   * @returns Rendered prompt string.
   */
  private renderInvokePrompt(request: AgentInvokeStageRequest): string {
    const renderedInput = JSON.stringify(request.input, null, 2);
    const executionPolicy = resolveAgentStageExecutionPolicy(request.input);
    return [
      'You are executing one Repo AI Governor stage through Codex CLI.',
      `Route Key: ${request.routeKey}`,
      `Stage ID: ${request.stageId}`,
      ...(this.shouldUseDryRunFastPathPrompt(request.input, executionPolicy)
        ? [
            [
              'Dry-run fast path instructions:',
              '- The canonical input declares dryRun=true under a chat-only, no-tool execution policy.',
              '- Do not attempt repository execution, file inspection, planning, or permission escalation.',
              '- Do not ask follow-up questions or wait for additional input.',
              '- Return immediately with a compact JSON object containing stageId, routeKey, phase, dryRun, status, summary, sideEffects, and nextStepRequirements.',
              '- Set status to "simulated" and sideEffects to "none".',
            ].join('\n'),
          ]
        : []),
      'Treat the following JSON payload as the canonical stage input.',
      renderedInput,
    ].join('\n\n');
  }

  private shouldUseDryRunFastPathPrompt(
    input: Record<string, unknown>,
    executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>,
  ): boolean {
    return (
      input.dryRun === true &&
      executionPolicy?.interactionMode === AgentStageExecutionMode.CHAT_ONLY &&
      executionPolicy.toolUsePolicy === AgentStageToolUsePolicy.FORBIDDEN
    );
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
      startedAt: null,
      lastTransportActivityAt: null,
      lastSemanticProgressAt: null,
      latestEventAt: null,
      latestEventType: null,
      latestTextPreview: null,
      transportIdleSuspectActive: false,
      semanticStallSuspectActive: false,
      resultPromise: Promise.resolve({
        stdout: '',
        stderr: '',
        exitCode: null,
        signal: null,
        elapsedMs: 0,
      }),
      cleanupTimer: null,
      progressTimer: null,
      watchdogTimer: null,
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
      state.startedAt = new Date(state.startedAtMs).toISOString();
      this.startCliWatchdog(state, request);
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
          onStdoutChunk: (chunk) => {
            state.stdout += chunk;
            this.ingestCodexStdout(state, request, chunk);
          },
          onStderrChunk: (chunk) => {
            state.stderr += chunk;
            this.ingestCodexStderr(state, request, chunk);
          },
          onGracefulInterruptStart: (cancelMechanism) => {
            this.pushCliGracefulInterruptEvent(state, request, cancelMechanism);
          },
          onHardTerminateStart: (cancelMechanism) => {
            this.pushCliHardTerminationEvent(state, request, cancelMechanism);
          },
        });
        if (state.stdout.length === 0 && executionResult.stdout.length > 0) {
          state.stdout = executionResult.stdout;
          this.ingestCodexStdout(state, request, executionResult.stdout, true);
        } else {
          this.ingestCodexStdout(state, request, '', true);
        }
        if (state.stderr.length === 0 && executionResult.stderr.length > 0) {
          state.stderr = executionResult.stderr;
          this.ingestCodexStderr(state, request, executionResult.stderr, true);
        } else {
          this.ingestCodexStderr(state, request, '', true);
        }
        if (!state.events.some((event) => event.eventType === AgentStreamEventType.COMPLETED)) {
          const completedAt = new Date().toISOString();
          this.recordCliTransportEvent(
            state,
            completedAt,
            AgentStreamEventType.COMPLETED,
            state.accumulatedAssistantText.length > 0 ? state.accumulatedAssistantText : undefined,
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
              surface: CODEX_SURFACE,
              transportKind: AdapterTransportKind.CLI_EXEC,
              ...(state.accumulatedAssistantText
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
        }
        this.finishCliExecution(state);
        return executionResult;
      }

      const executionResult = await this.executeCodexCliStreaming(request, state);
      this.finishCliExecution(state);
      return executionResult;
    } catch (error) {
      const standardizedError = standardizeError(error);
      const failedAt = new Date().toISOString();
      const partialOutputPreserved = state.accumulatedAssistantText.length > 0;
      const cancelMechanism = this.resolveCliFailureCancelMechanism(error, request);
      const suspectReasonCodes = this.resolveCliFailureReasonCodes(
        error,
        partialOutputPreserved,
        state,
      );
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
          surface: CODEX_SURFACE,
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
    if (state.watchdogTimer) {
      clearInterval(state.watchdogTimer);
      state.watchdogTimer = null;
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
          surface: CODEX_SURFACE,
          transportKind: AdapterTransportKind.CLI_EXEC,
          detailOrigin: 'system',
          detail: this.shouldUseRepositoryReviewCommand(request)
            ? 'Codex repository review thread started.'
            : 'Codex thread started.',
          invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
            status: 'starting',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
          }),
        },
      });
      return;
    }

    if (parsedEvent.type === 'turn.started') {
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
          surface: CODEX_SURFACE,
          transportKind: AdapterTransportKind.CLI_EXEC,
          detailOrigin: 'system',
          detail: this.shouldUseRepositoryReviewCommand(request)
            ? 'Codex repository review started; waiting for CLI output.'
            : 'Codex turn started.',
          invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
            status: 'running',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
          }),
        },
      });
      return;
    }

    if (
      parsedEvent.item?.type === 'agent_message' &&
      this.maybePushAssistantTokenDelta(state, request, parsedEvent)
    ) {
      return;
    }

    if (parsedEvent.item?.type === 'command_execution') {
      this.pushCommandExecutionEvent(state, request, parsedEvent);
      return;
    }

    if (parsedEvent.item?.type === 'todo_list') {
      this.pushTodoListEvents(state, request, parsedEvent);
      return;
    }

    if (this.pushAuxiliaryItemStatusEvent(state, request, parsedEvent)) {
      return;
    }

    if (parsedEvent.type === 'turn.completed') {
      const timestamp = new Date().toISOString();
      this.recordCliTransportEvent(
        state,
        timestamp,
        parsedEvent.type,
        state.accumulatedAssistantText.length > 0 ? state.accumulatedAssistantText : undefined,
      );
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.COMPLETED,
        timestamp,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'completed',
          surface: CODEX_SURFACE,
          transportKind: AdapterTransportKind.CLI_EXEC,
          ...(state.accumulatedAssistantText
            ? { responseText: state.accumulatedAssistantText }
            : {}),
          invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
            status: 'completed',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
            lastTerminalSignalAt: timestamp,
          }),
        },
      });
    }
  }

  private pushCommandExecutionEvent(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    parsedEvent: CodexCliJsonEvent,
  ): void {
    const commandSummary = this.summarizeCommand(parsedEvent.item?.command);
    if (!commandSummary) {
      return;
    }

    const activityKey = parsedEvent.item?.id
      ? `${CODEX_SURFACE}:command:${parsedEvent.item.id}`
      : `${CODEX_SURFACE}:command:${String(state.cliOutputSequence++)}`;
    const detail =
      parsedEvent.type === 'item.completed'
        ? `Completed command${this.formatExitCodeSuffix(parsedEvent.item?.exit_code)}: ${commandSummary}`
        : `Running command: ${commandSummary}`;
    const timestamp = new Date().toISOString();
    this.recordCliSemanticProgress(
      state,
      timestamp,
      parsedEvent.type ?? 'command_execution',
      detail,
    );
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'running',
        surface: CODEX_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail,
        activityKey,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      },
    });
  }

  private pushTodoListEvents(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    parsedEvent: CodexCliJsonEvent,
  ): void {
    for (const [index, todoItem] of (parsedEvent.item?.items ?? []).entries()) {
      const todoText = this.normalizeCliOutputLine(todoItem.text ?? '');
      if (!todoText) {
        continue;
      }
      const activityKey = parsedEvent.item?.id
        ? `${CODEX_SURFACE}:todo:${parsedEvent.item.id}:${String(index)}`
        : `${CODEX_SURFACE}:todo:${String(index)}`;
      const detail = todoItem.completed ? `Completed todo: ${todoText}` : `Todo: ${todoText}`;
      const timestamp = new Date().toISOString();
      this.recordCliSemanticProgress(state, timestamp, parsedEvent.type ?? 'todo_list', detail);
      this.pushCliExecutionEvent(state, {
        eventType: AgentStreamEventType.STATUS,
        timestamp,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'running',
          surface: CODEX_SURFACE,
          transportKind: AdapterTransportKind.CLI_EXEC,
          detail,
          activityKey,
          invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
            status: 'running',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
          }),
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
    const timestamp = new Date().toISOString();
    this.recordCliTransportEvent(state, timestamp, source, sanitizedLine);
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'running',
        surface: CODEX_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail,
        activityKey,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      },
    });
  }

  private pushAuxiliaryItemStatusEvent(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    parsedEvent: CodexCliJsonEvent,
  ): boolean {
    const itemType = this.readOptionalRawString(parsedEvent.item?.type);
    if (!itemType || itemType === 'agent_message') {
      return false;
    }

    const candidateText = this.normalizeCliOutputLine(
      this.extractRawTextFromUnknown(parsedEvent.item?.content) ??
        this.readOptionalRawString(parsedEvent.item?.text) ??
        this.readOptionalRawString(parsedEvent.item?.delta) ??
        this.readOptionalRawString(parsedEvent.text) ??
        this.readOptionalRawString(parsedEvent.delta) ??
        '',
    );
    if (!candidateText) {
      return false;
    }

    const activityKey = parsedEvent.item?.id
      ? `${CODEX_SURFACE}:${itemType}:${parsedEvent.item.id}`
      : `${CODEX_SURFACE}:${itemType}:${String(state.cliOutputSequence++)}`;
    const timestamp = new Date().toISOString();
    this.recordCliSemanticProgress(state, timestamp, itemType, candidateText);
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'running',
        surface: CODEX_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail: `${CODEX_SURFACE} ${itemType}: ${candidateText}`,
        activityKey,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      },
    });
    return true;
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
        transportKind: AdapterTransportKind.CLI_EXEC,
        detailOrigin: 'system',
        detail:
          elapsedSeconds === 0
            ? 'Codex repository review is running; waiting for CLI output.'
            : `Codex repository review is still running (${elapsedSeconds}s elapsed); waiting for CLI output.`,
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      },
    });
  }

  private startCliWatchdog(state: CodexCliExecutionState, request: CodexCliExecutionRequest): void {
    const intervalMs = this.resolveCliWatchdogIntervalMs(request.timeoutMs);
    state.watchdogTimer = setInterval(() => {
      if (state.settled) {
        return;
      }

      const suspectStatus = this.resolveCliWatchdogSuspectStatus(state, request.timeoutMs);
      if (suspectStatus === 'transport_idle_suspect') {
        if (!state.transportIdleSuspectActive) {
          state.transportIdleSuspectActive = true;
          state.semanticStallSuspectActive = false;
          this.pushCliSuspectEvent(state, request, suspectStatus);
        }
        return;
      }

      state.transportIdleSuspectActive = false;

      if (suspectStatus === 'semantic_stall_suspect') {
        if (!state.semanticStallSuspectActive) {
          state.semanticStallSuspectActive = true;
          this.pushCliSuspectEvent(state, request, suspectStatus);
        }
        return;
      }

      state.semanticStallSuspectActive = false;
    }, intervalMs);
    state.watchdogTimer.unref?.();
  }

  private resolveCliWatchdogSuspectStatus(
    state: CodexCliExecutionState,
    timeoutMs: number,
  ): Extract<CodexCliLivenessStatus, 'transport_idle_suspect' | 'semantic_stall_suspect'> | null {
    const startedAtMs = state.startedAtMs;
    if (startedAtMs === null) {
      return null;
    }

    const now = Date.now();
    const transportIdleTimeoutMs = this.resolveCliTransportIdleTimeoutMs(timeoutMs);
    const semanticStallTimeoutMs = this.resolveCliSemanticStallTimeoutMs(timeoutMs);
    const lastTransportAtMs = state.lastTransportActivityAt
      ? Date.parse(state.lastTransportActivityAt)
      : startedAtMs;
    const lastSemanticAtMs = state.lastSemanticProgressAt
      ? Date.parse(state.lastSemanticProgressAt)
      : startedAtMs;

    if (now - lastTransportAtMs >= transportIdleTimeoutMs) {
      return 'transport_idle_suspect';
    }

    if (now - lastSemanticAtMs >= semanticStallTimeoutMs) {
      return 'semantic_stall_suspect';
    }

    return null;
  }

  private pushCliSuspectEvent(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    status: Extract<CodexCliLivenessStatus, 'transport_idle_suspect' | 'semantic_stall_suspect'>,
  ): void {
    const emittedAt = new Date().toISOString();
    const suspectReasonCode =
      status === 'transport_idle_suspect'
        ? 'invoke_transport_idle_timeout'
        : 'invoke_semantic_stall_timeout';
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp: emittedAt,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status,
        surface: CODEX_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail:
          status === 'transport_idle_suspect'
            ? 'Codex invoke looks transport-idle; waiting for last real CLI output before escalating.'
            : 'Codex invoke still has transport activity but no semantic progress; waiting through grace before escalation.',
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status,
          partialOutputPreserved: state.accumulatedAssistantText.length > 0,
          cancelMechanism: 'none',
          suspectReasonCodes: [suspectReasonCode],
        }),
      },
    });
  }

  private pushCliGracefulInterruptEvent(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    cancelMechanism: CodexCliCancelMechanism,
  ): void {
    const interruptedAt = new Date().toISOString();
    const suspectReasonCodes = this.resolveActiveCliSuspectReasonCodes(state, cancelMechanism);
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
        surface: CODEX_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail:
          cancelMechanism === 'abort_signal'
            ? 'Codex invoke is being interrupted by abort signal.'
            : 'Codex invoke exceeded its timeout budget; attempting graceful interrupt.',
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'graceful_interrupting',
          partialOutputPreserved: state.accumulatedAssistantText.length > 0,
          cancelMechanism,
          lastTerminalSignalAt: interruptedAt,
          ...(suspectReasonCodes.length > 0 ? { suspectReasonCodes } : {}),
        }),
      },
    });
  }

  private pushCliHardTerminationEvent(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    cancelMechanism: CodexCliCancelMechanism,
  ): void {
    const terminatedAt = new Date().toISOString();
    const suspectReasonCodes = [
      ...this.resolveActiveCliSuspectReasonCodes(state, cancelMechanism),
      'invoke_graceful_interrupt_exceeded',
    ].filter((value, index, list) => list.indexOf(value) === index);
    this.recordCliTransportEvent(
      state,
      terminatedAt,
      'hard_terminating',
      state.accumulatedAssistantText.length > 0 ? state.accumulatedAssistantText : undefined,
    );
    this.pushCliExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp: terminatedAt,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'hard_terminating',
        surface: CODEX_SURFACE,
        transportKind: AdapterTransportKind.CLI_EXEC,
        detail:
          cancelMechanism === 'abort_signal'
            ? 'Codex invoke did not stop after abort signal; forcing hard termination.'
            : 'Codex invoke did not stop after graceful interrupt; forcing hard termination.',
        invokeLiveness: this.buildCliInvokeLivenessSnapshot(request, state, {
          status: 'hard_terminating',
          partialOutputPreserved: state.accumulatedAssistantText.length > 0,
          cancelMechanism,
          lastTerminalSignalAt: terminatedAt,
          suspectReasonCodes,
        }),
      },
    });
  }

  private recordCliTransportEvent(
    state: CodexCliExecutionState,
    timestamp: string,
    eventType: string,
    previewText?: string,
  ): void {
    state.transportIdleSuspectActive = false;
    state.lastTransportActivityAt = timestamp;
    state.latestEventAt = timestamp;
    state.latestEventType = eventType;
    if (previewText) {
      state.latestTextPreview = previewText;
    }
  }

  private recordCliSemanticProgress(
    state: CodexCliExecutionState,
    timestamp: string,
    eventType: string,
    previewText: string,
  ): void {
    this.recordCliTransportEvent(state, timestamp, eventType, previewText);
    state.lastSemanticProgressAt = timestamp;
    state.transportIdleSuspectActive = false;
    state.semanticStallSuspectActive = false;
  }

  private buildCliInvokeLivenessSnapshot(
    request: CodexCliExecutionRequest,
    state: CodexCliExecutionState,
    options: {
      status: CodexCliLivenessStatus;
      partialOutputPreserved: boolean;
      cancelMechanism: CodexCliCancelMechanism;
      lastTerminalSignalAt?: string;
      suspectReasonCodes?: string[];
    },
  ): Record<string, unknown> {
    const startedAt = state.startedAt ?? new Date().toISOString();
    return {
      adapterId: this.options.agentId,
      surfaceId: CODEX_SURFACE,
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

  private resolveActiveCliSuspectReasonCodes(
    state: CodexCliExecutionState,
    cancelMechanism: CodexCliCancelMechanism,
  ): string[] {
    return [
      ...(state.transportIdleSuspectActive ? ['invoke_transport_idle_timeout'] : []),
      ...(state.semanticStallSuspectActive ? ['invoke_semantic_stall_timeout'] : []),
      ...(cancelMechanism === 'process_signal' ? ['invoke_hard_timeout'] : []),
    ].filter((value, index, list) => list.indexOf(value) === index);
  }

  private resolveCliFailureReasonCodes(
    error: unknown,
    partialOutputPreserved: boolean,
    state: CodexCliExecutionState,
  ): string[] {
    const detail = this.cliExecOperationsRuntime
      .collectErrorDetail(error, standardizeError(error).message)
      .toLowerCase();
    return [
      ...(state.transportIdleSuspectActive ? ['invoke_transport_idle_timeout'] : []),
      ...(state.semanticStallSuspectActive ? ['invoke_semantic_stall_timeout'] : []),
      ...(this.isTimeoutFailure(detail) ? ['invoke_hard_timeout'] : []),
      ...(/graceful interrupt (window|exceeded)|hardterminated/u.test(detail)
        ? ['invoke_graceful_interrupt_exceeded']
        : []),
      ...(partialOutputPreserved ? ['invoke_partial_output_preserved'] : []),
    ].filter((value, index, list) => list.indexOf(value) === index);
  }

  private resolveCliFailureCancelMechanism(
    error: unknown,
    request: CodexCliExecutionRequest,
  ): CodexCliCancelMechanism {
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

  private resolveCliWatchdogIntervalMs(timeoutMs: number): number {
    return Math.min(
      CODEX_CLI_WATCHDOG_MAX_INTERVAL_MS,
      Math.max(CODEX_CLI_WATCHDOG_MIN_INTERVAL_MS, Math.floor(timeoutMs / 10)),
    );
  }

  private resolveCliTransportIdleTimeoutMs(timeoutMs: number): number {
    return Math.min(
      CODEX_CLI_WATCHDOG_MAX_TRANSPORT_IDLE_MS,
      Math.max(CODEX_CLI_WATCHDOG_MIN_TRANSPORT_IDLE_MS, Math.floor(timeoutMs * 0.7)),
    );
  }

  private resolveCliSemanticStallTimeoutMs(timeoutMs: number): number {
    return Math.min(
      CODEX_CLI_WATCHDOG_MAX_SEMANTIC_STALL_MS,
      Math.max(CODEX_CLI_WATCHDOG_MIN_SEMANTIC_STALL_MS, Math.floor(timeoutMs * 0.85)),
    );
  }

  private resolveCliTerminateGraceMs(timeoutMs: number): number {
    return Math.min(
      CODEX_CLI_TERMINATE_GRACE_MAX_MS,
      Math.max(CODEX_CLI_TERMINATE_GRACE_MIN_MS, Math.floor(timeoutMs * 0.1)),
    );
  }

  private resolveCliProcessTreePolicy(): 'process_group_best_effort' {
    return 'process_group_best_effort';
  }

  private resolveCliRequestCancellationMode(): AdapterRequestCancellationMode {
    return AdapterRequestCancellationMode.NOT_SUPPORTED;
  }

  private buildCliLaunchHealthDiagnostics(
    launchDiagnostics?: AgentCliLaunchDiagnostics | null,
  ): AgentHealthCheckDiagnostic[] {
    if (!launchDiagnostics) {
      return [];
    }
    return [
      {
        layer: 'install',
        status: 'pass',
        code: 'install.entrypoint_resolution',
        detail: launchDiagnostics.selectedEntrypoint,
      },
      {
        layer: 'protocol',
        status: 'pass',
        code: 'protocol.shell_wrapped',
        detail: String(launchDiagnostics.shellWrapped),
      },
      {
        layer: launchDiagnostics.spawnErrorCode ? 'install' : 'protocol',
        status: launchDiagnostics.spawnErrorCode ? 'fail' : 'pass',
        code: launchDiagnostics.spawnErrorCode
          ? 'install.spawn_error_code'
          : 'protocol.process_tree_policy',
        detail: launchDiagnostics.spawnErrorCode ?? launchDiagnostics.processTreePolicy,
      },
    ];
  }

  private readCliLaunchDiagnosticsFromError(error: unknown): AgentCliLaunchDiagnostics | null {
    const details =
      error && typeof error === 'object' && 'details' in error && error.details
        ? error.details
        : error && typeof error === 'object' && 'metadata' in error && error.metadata
          ? error.metadata
          : null;
    if (!details || typeof details !== 'object') {
      return null;
    }
    const detailsRecord = details as Record<string, unknown>;
    const selectedEntrypoint =
      typeof detailsRecord.selectedEntrypoint === 'string'
        ? detailsRecord.selectedEntrypoint
        : null;
    const shellWrapped =
      typeof detailsRecord.shellWrapped === 'boolean' ? detailsRecord.shellWrapped : null;
    const processTreePolicy =
      typeof detailsRecord.processTreePolicy === 'string' ? detailsRecord.processTreePolicy : null;
    if (!selectedEntrypoint || shellWrapped === null || !processTreePolicy) {
      return null;
    }
    return {
      selectedEntrypoint,
      shellWrapped,
      processTreePolicy:
        processTreePolicy === 'process_group_best_effort'
          ? 'process_group_best_effort'
          : 'process_only',
      ...(typeof detailsRecord.spawnErrorCode === 'string'
        ? { spawnErrorCode: detailsRecord.spawnErrorCode }
        : {}),
    };
  }

  private normalizeCliOutputLine(line: string): string | undefined {
    const normalizedLine = line.replace(/\s+/gu, ' ').trim();
    if (normalizedLine.length === 0) {
      return undefined;
    }
    return normalizedLine.length > 240 ? `${normalizedLine.slice(0, 237)}...` : normalizedLine;
  }

  private summarizeCommand(command: string | undefined): string | undefined {
    if (!command) {
      return undefined;
    }

    const shellWrappedCommand = command.match(/^\/bin\/zsh -lc ['"]([\s\S]+)['"]$/u)?.[1];
    return this.normalizeCliOutputLine(shellWrappedCommand ?? command);
  }

  private formatExitCodeSuffix(exitCode: number | null | undefined): string {
    if (typeof exitCode !== 'number') {
      return '';
    }
    return exitCode === 0 ? ' (exit 0)' : ` (exit ${String(exitCode)})`;
  }

  private maybePushAssistantTokenDelta(
    state: CodexCliExecutionState,
    request: CodexCliExecutionRequest,
    parsedEvent: CodexCliJsonEvent,
  ): boolean {
    const candidateText = this.extractAssistantTextCandidate(parsedEvent);
    if (!candidateText) {
      return false;
    }

    const nextTokenState = this.resolveAssistantTokenState(
      state.accumulatedAssistantText,
      candidateText,
      parsedEvent.type === 'item.completed',
    );
    if (!nextTokenState) {
      return false;
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
        surface: CODEX_SURFACE,
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
    return true;
  }

  private extractAssistantTextCandidate(parsedEvent: CodexCliJsonEvent): string | undefined {
    return (
      this.readOptionalRawString(parsedEvent.item?.delta) ??
      this.readOptionalRawString(parsedEvent.delta) ??
      this.readOptionalRawString(parsedEvent.item?.text) ??
      this.readOptionalRawString(parsedEvent.text) ??
      this.extractRawTextFromUnknown(parsedEvent.item?.content) ??
      this.extractRawTextFromUnknown(parsedEvent.content)
    );
  }

  private resolveAssistantTokenState(
    previousAccumulatedText: string,
    candidateText: string,
    isTerminalEvent: boolean,
  ): { chunkText: string; accumulatedText: string } | null {
    if (candidateText === previousAccumulatedText) {
      return null;
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

  private extractRawTextFromUnknown(candidate: unknown): string | undefined {
    if (typeof candidate === 'string') {
      return this.readOptionalRawString(candidate);
    }

    if (Array.isArray(candidate)) {
      const flattenedText = candidate
        .map((item) => this.extractRawTextFromUnknown(item))
        .filter((item): item is string => typeof item === 'string')
        .join('');
      return this.readOptionalRawString(flattenedText);
    }

    if (!candidate || typeof candidate !== 'object') {
      return undefined;
    }

    const recordCandidate = candidate as Record<string, unknown>;
    return (
      this.readOptionalRawString(recordCandidate.text) ??
      this.readOptionalRawString(recordCandidate.delta) ??
      this.extractRawTextFromUnknown(recordCandidate.content)
    );
  }

  private readOptionalRawString(candidate: unknown): string | undefined {
    return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
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
    return await this.cliProcessRuntime.execute(
      this.createCodexCliLaunchPlan({
        operation: request.operation,
        prompt: request.prompt,
        timeoutMs: request.timeoutMs,
        signal: request.signal,
        commandArguments: request.commandArguments,
        onStdoutChunk: request.onStdoutChunk,
        onStderrChunk: request.onStderrChunk,
        onGracefulInterruptStart: request.onGracefulInterruptStart,
        onHardTerminateStart: request.onHardTerminateStart,
      }),
    );
  }

  private async executeCodexCliStreaming(
    request: CodexCliExecutionRequest,
    state: CodexCliExecutionState,
  ): Promise<CodexExecRunnerResult> {
    const executionPolicy = resolveAgentStageExecutionPolicy(request.input);
    const prompt = this.shouldUseRepositoryReviewCommand(request)
      ? this.renderRepositoryReviewPrompt(request)
      : this.renderInvokePrompt(request);
    const executionResult = await this.cliProcessRuntime.execute(
      this.createCodexCliLaunchPlan({
        operation: AgentCliExecOperation.INVOKE,
        prompt,
        timeoutMs: request.timeoutMs,
        signal: request.signal,
        commandArguments: this.resolveInvokeCommandArguments(request, executionPolicy),
        onStdoutChunk: (chunk) => {
          state.stdout += chunk;
          this.ingestCodexStdout(state, request, chunk);
        },
        onStderrChunk: (chunk) => {
          state.stderr += chunk;
          this.ingestCodexStderr(state, request, chunk);
        },
        onGracefulInterruptStart: (cancelMechanism) => {
          this.pushCliGracefulInterruptEvent(state, request, cancelMechanism);
        },
        onHardTerminateStart: (cancelMechanism) => {
          this.pushCliHardTerminationEvent(state, request, cancelMechanism);
        },
      }),
    );
    this.ingestCodexStdout(state, request, '', true);
    this.ingestCodexStderr(state, request, '', true);
    return {
      ...executionResult,
      stdout: state.stdout,
      stderr: state.stderr,
    };
  }

  private createCodexCliLaunchPlan(options: {
    operation: AgentCliExecOperation;
    prompt: string;
    timeoutMs: number;
    signal?: AbortSignal;
    commandArguments: string[];
    onStdoutChunk?: (chunk: string) => void;
    onStderrChunk?: (chunk: string) => void;
    onGracefulInterruptStart?: (cancelMechanism: 'process_signal' | 'abort_signal') => void;
    onHardTerminateStart?: (cancelMechanism: 'process_signal' | 'abort_signal') => void;
  }) {
    return {
      surfaceId: CODEX_SURFACE,
      operation: options.operation,
      command: this.options.command,
      commandArguments: options.commandArguments,
      cwd: this.options.currentWorkingDirectory,
      env: this.resolveEnvironment(),
      timeoutMs: options.timeoutMs,
      ...(options.signal ? { signal: options.signal } : {}),
      stdinMode: 'pipe' as const,
      stdinPayload: options.prompt,
      terminateGraceMs: this.resolveCliTerminateGraceMs(options.timeoutMs),
      launchDiagnostics: {
        selectedEntrypoint: this.options.command,
        shellWrapped: false,
        processTreePolicy: this.resolveCliProcessTreePolicy(),
      },
      onStdoutChunk: options.onStdoutChunk,
      onStderrChunk: options.onStderrChunk,
      onGracefulInterruptStart: options.onGracefulInterruptStart,
      onHardTerminateStart: options.onHardTerminateStart,
    };
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
    if (typeof request.agentInvocationTimeoutMs === 'number') {
      return request.agentInvocationTimeoutMs;
    }

    if (this.shouldUseRepositoryReviewCommand(request)) {
      return CODEX_REPOSITORY_REVIEW_TIMEOUT_MS;
    }

    return this.options.requestTimeoutMs;
  }
}
