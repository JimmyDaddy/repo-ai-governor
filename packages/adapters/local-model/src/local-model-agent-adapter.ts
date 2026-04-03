import {
  AgentAvailabilityStatus,
  type AgentCancelRequest,
  type AgentCancelResult,
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentConfirmationDecision,
  type AgentConfirmationRequest,
  type AgentConfirmationResult,
  type AgentInvokeStageRequest,
  type AgentInvokeStageResult,
  type AgentProbeRequest,
  type AgentProbeResult,
  AgentProtocol,
  type AgentStreamEvent,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
  createLayeredHealthCheckFromLegacyReasons,
} from '@repo-ai-governor/adapter-sdk';
import {
  AdapterTransportKind,
  GovernorErrorCode,
  LocalModelProvider,
  RuntimeError,
  standardizeError,
} from '@repo-ai-governor/shared';

const LOCAL_MODEL_DEFAULT_AGENT_ID = 'local-model-default-agent';
const LOCAL_MODEL_DEFAULT_ROLE = 'coder';
const LOCAL_MODEL_DEFAULT_ROLE_PROFILE_ID = 'coder-default';
const LOCAL_MODEL_DEFAULT_ROLE_SOURCE = 'default';
const LOCAL_MODEL_SURFACE = 'ollama';
const OLLAMA_TAGS_PATH = 'api/tags';
const OLLAMA_GENERATE_PATH = 'api/generate';
const LOCAL_MODEL_DEFAULT_TIMEOUT_MS = 30000;
const LOCAL_MODEL_RETRY_DELAY_MS = 150;
const LOCAL_MODEL_EXECUTION_CACHE_TTL_MS = 30000;
const LOCAL_MODEL_PROGRESS_INTERVAL_MS = 15000;
const LOCAL_MODEL_PREVIEW_TEXT_MAX_LENGTH = 240;

const LOCAL_MODEL_CAPABILITY_SUPPORT: Record<AgentCapability, AgentCapabilitySupportLevel> = {
  [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.UNSUPPORTED,
  [AgentCapability.STRUCTURED_OUTPUT]: AgentCapabilitySupportLevel.UNSUPPORTED,
  [AgentCapability.PARALLEL_TASK]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.STREAMING]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.CONFIRMATION_GATE]: AgentCapabilitySupportLevel.UNSUPPORTED,
  [AgentCapability.CANCELLATION]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.AGENT_TIMEOUT]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STAGE_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.FLOW_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CONTEXT_WINDOW]: AgentCapabilitySupportLevel.SUPPORTED,
};

interface LocalModelRuntimeConfig {
  provider: LocalModelProvider;
  endpoint: string;
  model: string;
  requestTimeoutMs?: number;
  maxRetries?: number;
}

interface OllamaTagsResponse {
  models?: OllamaModelDescriptor[];
}

interface OllamaModelDescriptor {
  name?: string;
}

interface OllamaGenerateResponse {
  response?: string;
  done?: boolean;
  done_reason?: string | null;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface LocalModelExecutionRequest {
  processId: string;
  executionId: string;
  stageId: string;
  routeKey: string;
  input: Record<string, unknown>;
  timeoutMs: number;
  signal?: AbortSignal;
}

interface LocalModelExecutionResult {
  responseText: string;
  usage?: AgentInvokeStageResult['usage'];
  elapsedMs: number;
}

interface LocalModelExecutionState {
  key: string;
  events: AgentStreamEvent[];
  waiters: Set<() => void>;
  lineBuffer: string;
  accumulatedText: string;
  startedAtMs: number | null;
  startedAt: string | null;
  lastTransportActivityAtMs: number | null;
  lastTransportActivityAt: string | null;
  lastSemanticProgressAtMs: number | null;
  lastSemanticProgressAt: string | null;
  latestEventAt: string | null;
  latestEventType: string | null;
  latestTextPreview: string | null;
  settled: boolean;
  cleanupTimer: NodeJS.Timeout | null;
  progressTimer: NodeJS.Timeout | null;
  resultPromise: Promise<LocalModelExecutionResult>;
}

interface LocalModelProbeResolution {
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
}

interface ResolvedLocalModelAgentAdapterOptions {
  agentId: string;
  role: string;
  roleProfileId: string;
  roleSource: string;
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
  localModel: LocalModelRuntimeConfig | null;
  fetchFn: typeof fetch;
}

type LocalModelLivenessStatus = 'starting' | 'running' | 'completed' | 'failed' | 'cancelled';
type LocalModelCancelMechanism = 'none' | 'abort_signal' | 'timeout_abort';

interface LocalModelRequestTimeoutBudget {
  signal: AbortSignal;
  cleanup: () => void;
  didTimeout: () => boolean;
}

/**
 * Defines local-model adapter constructor options.
 */
export interface LocalModelAgentAdapterOptions {
  agentId?: string;
  role?: string;
  roleProfileId?: string;
  roleSource?: string;
  availabilityStatus?: AgentAvailabilityStatus;
  unavailableReasons?: string[];
  localModel?: LocalModelRuntimeConfig;
  fetchFn?: typeof fetch;
}

/**
 * Implements endpoint-backed local-model adapter semantics under unified agent protocol.
 *
 * Why this exists:
 * Stage-9 local-model fallback needs real probe/invoke behavior while capability
 * advertisement remains conservative until structured-output/tool-calling parity exists.
 */
export class LocalModelAgentAdapter extends AgentProtocol {
  private readonly options: ResolvedLocalModelAgentAdapterOptions;
  private readonly inflightExecutions = new Map<string, LocalModelExecutionState>();

  /**
   * Creates local-model adapter with optional identity and status overrides.
   * @param options Adapter construction options.
   */
  public constructor(options: LocalModelAgentAdapterOptions = {}) {
    super();
    this.options = {
      agentId: options.agentId ?? LOCAL_MODEL_DEFAULT_AGENT_ID,
      role: options.role ?? LOCAL_MODEL_DEFAULT_ROLE,
      roleProfileId: options.roleProfileId ?? LOCAL_MODEL_DEFAULT_ROLE_PROFILE_ID,
      roleSource: options.roleSource ?? LOCAL_MODEL_DEFAULT_ROLE_SOURCE,
      availabilityStatus: options.availabilityStatus ?? AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: options.unavailableReasons ?? [],
      localModel: options.localModel ?? null,
      fetchFn: options.fetchFn ?? fetch,
    };
  }

  /**
   * Probes local-model adapter identity, availability, and capability matrix.
   * @param _request Probe request payload.
   * @returns Probe result payload.
   */
  public override async probe(request: AgentProbeRequest): Promise<AgentProbeResult> {
    const localModelProbe = await this.probeLocalModelReadiness(request.signal);
    const capabilityMatrix = this.createCapabilityMatrix();
    const availabilityStatus = this.mergeAvailabilityStatus(
      this.options.availabilityStatus,
      localModelProbe.availabilityStatus,
    );
    const unavailableReasons = [
      ...this.options.unavailableReasons,
      ...localModelProbe.unavailableReasons,
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
        surface: LOCAL_MODEL_SURFACE,
        roleProfileId: this.options.roleProfileId,
        roleSource: this.options.roleSource,
      },
      availabilityStatus,
      capabilityMatrix,
      unavailableReasons,
      healthCheck: createLayeredHealthCheckFromLegacyReasons({
        adapterId: this.options.agentId,
        surfaceId: LOCAL_MODEL_SURFACE,
        availabilityStatus,
        selectedEntrypoint: this.options.localModel?.endpoint ?? LOCAL_MODEL_SURFACE,
        routeKey: request.routeKey,
        routeRequirements: (request.requiredCapabilities ?? []).map(String),
        fallbackAllowed: true,
        unavailableReasons,
        unsupportedCapabilities: unsupportedCapabilities.map(String),
        degradedCapabilities: degradedCapabilities.map(String),
      }),
    };
  }

  /**
   * Invokes one stage using configured local-model behavior.
   * @param request Stage invocation request payload.
   * @returns Stage invocation result payload.
   */
  public override async invokeStage(
    request: AgentInvokeStageRequest,
  ): Promise<AgentInvokeStageResult> {
    if (!this.options.localModel) {
      return {
        output: {
          adapterSurface: LOCAL_MODEL_SURFACE,
          routeKey: request.routeKey,
          stageId: request.stageId,
          echoedInput: request.input,
        },
        elapsedMs: 1,
      };
    }

    this.assertSupportedLocalModelProvider(this.options.localModel);
    const execution = this.ensureExecution({
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      input: request.input,
      timeoutMs: this.resolveRequestTimeoutMs(this.options.localModel, request),
      ...(request.signal ? { signal: request.signal } : {}),
    });
    const executionResult = await execution.resultPromise;

    return {
      output: {
        adapterSurface: LOCAL_MODEL_SURFACE,
        routeKey: request.routeKey,
        stageId: request.stageId,
        provider: this.options.localModel.provider,
        endpoint: this.options.localModel.endpoint,
        model: this.options.localModel.model,
        responseText: executionResult.responseText,
        echoedInput: request.input,
      },
      ...(executionResult.usage ? { usage: executionResult.usage } : {}),
      elapsedMs: executionResult.elapsedMs,
    };
  }

  /**
   * Streams coarse lifecycle events for local-model stage execution.
   * @param request Stream-events request payload.
   * @returns Async iterable of stream events.
   */
  public override async *streamEvents(
    request: AgentStreamEventsRequest,
  ): AsyncIterable<AgentStreamEvent> {
    if (!this.options.localModel) {
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
          surface: LOCAL_MODEL_SURFACE,
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
          surface: LOCAL_MODEL_SURFACE,
        },
      };
      return;
    }

    const execution = this.ensureExecution({
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      input: request.input,
      timeoutMs: this.resolveRequestTimeoutMs(this.options.localModel, request),
      ...(request.signal ? { signal: request.signal } : {}),
    });
    yield* this.consumeExecutionEvents(execution);
  }

  private ensureExecution(request: LocalModelExecutionRequest): LocalModelExecutionState {
    const key = [request.processId, request.executionId, request.stageId, request.routeKey].join(
      ':',
    );
    const existingExecution = this.inflightExecutions.get(key);
    if (existingExecution) {
      return existingExecution;
    }

    const state: LocalModelExecutionState = {
      key,
      events: [],
      waiters: new Set(),
      lineBuffer: '',
      accumulatedText: '',
      startedAtMs: null,
      startedAt: null,
      lastTransportActivityAtMs: null,
      lastTransportActivityAt: null,
      lastSemanticProgressAtMs: null,
      lastSemanticProgressAt: null,
      latestEventAt: null,
      latestEventType: null,
      latestTextPreview: null,
      settled: false,
      cleanupTimer: null,
      progressTimer: null,
      resultPromise: Promise.resolve({
        responseText: '',
        elapsedMs: 0,
      }),
    };
    state.resultPromise = this.startExecution(state, request);
    this.inflightExecutions.set(key, state);
    return state;
  }

  private async startExecution(
    state: LocalModelExecutionState,
    request: LocalModelExecutionRequest,
  ): Promise<LocalModelExecutionResult> {
    if (!this.options.localModel) {
      const result = {
        responseText: '',
        elapsedMs: 0,
      };
      this.finishExecution(state);
      return result;
    }

    try {
      state.startedAtMs = Date.now();
      state.startedAt = new Date(state.startedAtMs).toISOString();
      this.recordLocalModelTransportEvent(state, state.startedAt, 'invoke_started');
      this.pushExecutionEvent(state, {
        eventType: AgentStreamEventType.STATUS,
        timestamp: state.startedAt,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'running',
          surface: LOCAL_MODEL_SURFACE,
          detail: 'Ollama turn started.',
          transportKind: AdapterTransportKind.BASELINE,
          invokeLiveness: this.buildLocalModelInvokeLivenessSnapshot(request, state, {
            status: 'starting',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
          }),
        },
      });
      this.startLongOperationProgress(state, request);
      const startedAt = state.startedAtMs;

      const prompt = this.renderPrompt(request.input);
      const timeoutBudget = this.createRequestTimeoutBudget(request.timeoutMs, request.signal);
      let usage: AgentInvokeStageResult['usage'] | undefined;
      try {
        const response = await this.requestResponse({
          localModel: this.options.localModel,
          path: OLLAMA_GENERATE_PATH,
          method: 'POST',
          request: {
            processId: request.processId,
            executionId: request.executionId,
            stageId: request.stageId,
            routeKey: request.routeKey,
            input: request.input,
            agentInvocationTimeoutMs: request.timeoutMs,
            ...(request.signal ? { signal: request.signal } : {}),
          },
          ...(request.signal ? { signal: request.signal } : {}),
          timeoutSignal: timeoutBudget.signal,
          body: {
            model: this.options.localModel.model,
            prompt,
            stream: true,
          },
          operation: 'invoke',
        });
        usage = await this.consumeGenerateStream(state, request, response);
      } catch (error) {
        if (timeoutBudget.didTimeout() && this.isAbortError(error)) {
          throw this.createLocalModelTimeoutBudgetError(request, error);
        }
        this.throwIfCancelled(error, request.signal, 'invoke');
        throw error;
      } finally {
        timeoutBudget.cleanup();
      }
      const responseText = state.accumulatedText.trim();
      if (responseText.length === 0) {
        throw new RuntimeError(
          GovernorErrorCode.AGENT_PROTOCOL_INVALID,
          `Local model response for stage "${request.stageId}" did not include textual output.`,
          {
            surface: LOCAL_MODEL_SURFACE,
            routeKey: request.routeKey,
            stageId: request.stageId,
          },
        );
      }

      const completedAt = new Date().toISOString();
      this.recordLocalModelTransportEvent(
        state,
        completedAt,
        AgentStreamEventType.COMPLETED,
        responseText,
      );
      this.pushExecutionEvent(state, {
        eventType: AgentStreamEventType.COMPLETED,
        timestamp: completedAt,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'completed',
          surface: LOCAL_MODEL_SURFACE,
          transportKind: AdapterTransportKind.BASELINE,
          accumulatedText: state.accumulatedText,
          responseText,
          invokeLiveness: this.buildLocalModelInvokeLivenessSnapshot(request, state, {
            status: 'completed',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
            lastTerminalSignalAt: completedAt,
          }),
        },
      });
      this.finishExecution(state);
      return {
        responseText,
        ...(usage ? { usage } : {}),
        elapsedMs: Date.now() - startedAt,
      };
    } catch (error) {
      const standardizedError = standardizeError(error);
      const failedAt = new Date().toISOString();
      const partialOutputPreserved = state.accumulatedText.trim().length > 0;
      const cancelMechanism = this.resolveLocalModelFailureCancelMechanism(error, request);
      const failureStatus = this.resolveLocalModelFailureStatus(error);
      const suspectReasonCodes = this.resolveLocalModelFailureReasonCodes(
        error,
        partialOutputPreserved,
      );
      this.recordLocalModelTransportEvent(
        state,
        failedAt,
        AgentStreamEventType.FAILED,
        partialOutputPreserved ? state.accumulatedText : standardizedError.message,
      );
      this.pushExecutionEvent(state, {
        eventType: AgentStreamEventType.FAILED,
        timestamp: failedAt,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'failed',
          surface: LOCAL_MODEL_SURFACE,
          message: standardizedError.message,
          transportKind: AdapterTransportKind.BASELINE,
          ...(partialOutputPreserved
            ? {
                accumulatedText: state.accumulatedText,
                responseText: state.accumulatedText,
              }
            : {}),
          invokeLiveness: this.buildLocalModelInvokeLivenessSnapshot(request, state, {
            status: failureStatus,
            partialOutputPreserved,
            cancelMechanism,
            lastTerminalSignalAt: failedAt,
            ...(suspectReasonCodes.length > 0 ? { suspectReasonCodes } : {}),
          }),
        },
      });
      this.finishExecution(state);
      throw error;
    }
  }

  private async *consumeExecutionEvents(
    state: LocalModelExecutionState,
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

  private pushExecutionEvent(state: LocalModelExecutionState, event: AgentStreamEvent): void {
    state.events.push(event);
    for (const waiter of state.waiters) {
      waiter();
    }
    state.waiters.clear();
  }

  private finishExecution(state: LocalModelExecutionState): void {
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
      this.inflightExecutions.delete(state.key);
    }, LOCAL_MODEL_EXECUTION_CACHE_TTL_MS);
    state.cleanupTimer.unref?.();
  }

  private async consumeGenerateStream(
    state: LocalModelExecutionState,
    request: LocalModelExecutionRequest,
    response: Response,
  ): Promise<AgentInvokeStageResult['usage'] | undefined> {
    if (!response.body) {
      const payload = (await response.json()) as OllamaGenerateResponse;
      this.processGenerateChunk(state, request, payload);
      return this.createTokenUsage(payload);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let usage: AgentInvokeStageResult['usage'] | undefined;
    while (true) {
      const { value, done } = await reader.read();
      if (value) {
        state.lineBuffer += decoder.decode(value, { stream: !done });
        usage = this.processGenerateBuffer(state, request, usage);
      }
      if (done) {
        state.lineBuffer += decoder.decode();
        usage = this.processGenerateBuffer(state, request, usage, true);
        return usage;
      }
    }
  }

  private processGenerateBuffer(
    state: LocalModelExecutionState,
    request: LocalModelExecutionRequest,
    currentUsage?: AgentInvokeStageResult['usage'],
    flushPartial = false,
  ): AgentInvokeStageResult['usage'] | undefined {
    const lines = state.lineBuffer.split(/\r?\n/u);
    state.lineBuffer = lines.pop() ?? '';
    let usage = currentUsage;
    for (const line of lines) {
      usage = this.processGenerateLine(state, request, line, usage);
    }
    if (flushPartial && state.lineBuffer.trim().length > 0) {
      usage = this.processGenerateLine(state, request, state.lineBuffer, usage);
      state.lineBuffer = '';
    }
    return usage;
  }

  private processGenerateLine(
    state: LocalModelExecutionState,
    request: LocalModelExecutionRequest,
    line: string,
    currentUsage?: AgentInvokeStageResult['usage'],
  ): AgentInvokeStageResult['usage'] | undefined {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) {
      return currentUsage;
    }

    let payload: OllamaGenerateResponse;
    try {
      payload = JSON.parse(trimmedLine) as OllamaGenerateResponse;
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        `Local model invoke returned invalid streaming JSON payload for stage "${request.stageId}".`,
        {
          surface: LOCAL_MODEL_SURFACE,
          routeKey: request.routeKey,
          stageId: request.stageId,
        },
        error,
      );
    }

    this.processGenerateChunk(state, request, payload);
    return this.createTokenUsage(payload) ?? currentUsage;
  }

  private processGenerateChunk(
    state: LocalModelExecutionState,
    request: LocalModelExecutionRequest,
    payload: OllamaGenerateResponse,
  ): void {
    if (typeof payload.response === 'string' && payload.response.length > 0) {
      state.accumulatedText += payload.response;
      const timestamp = new Date().toISOString();
      this.recordLocalModelSemanticProgress(
        state,
        timestamp,
        AgentStreamEventType.TOKEN,
        state.accumulatedText,
      );
      this.pushExecutionEvent(state, {
        eventType: AgentStreamEventType.TOKEN,
        timestamp,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          surface: LOCAL_MODEL_SURFACE,
          transportKind: AdapterTransportKind.BASELINE,
          text: payload.response,
          accumulatedText: state.accumulatedText,
          invokeLiveness: this.buildLocalModelInvokeLivenessSnapshot(request, state, {
            status: 'running',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
          }),
        },
      });
    }

    if (payload.done) {
      const timestamp = new Date().toISOString();
      this.recordLocalModelTransportEvent(
        state,
        timestamp,
        'done',
        typeof payload.done_reason === 'string' ? payload.done_reason : state.accumulatedText,
      );
      this.pushExecutionEvent(state, {
        eventType: AgentStreamEventType.STATUS,
        timestamp,
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
        payload: {
          status: 'running',
          surface: LOCAL_MODEL_SURFACE,
          transportKind: AdapterTransportKind.BASELINE,
          detail:
            typeof payload.done_reason === 'string' && payload.done_reason.trim().length > 0
              ? `Ollama stream completed with reason "${payload.done_reason}"; finalizing response.`
              : 'Ollama stream completed; finalizing response.',
          ...(typeof payload.done_reason === 'string' && payload.done_reason.trim().length > 0
            ? { doneReason: payload.done_reason }
            : {}),
          invokeLiveness: this.buildLocalModelInvokeLivenessSnapshot(request, state, {
            status: 'running',
            partialOutputPreserved: false,
            cancelMechanism: 'none',
          }),
        },
      });
    }
  }

  /**
   * Requests confirmation through a conservative fallback path.
   * @param _request Confirmation request payload.
   * @returns Confirmation decision payload.
   */
  public override async requestConfirmation(
    _request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    return {
      decision: AgentConfirmationDecision.REVISE,
      reason: 'local-model-confirmation-gate-unsupported',
      constraints: ['escalate_to_human_gate'],
      decidedAt: new Date().toISOString(),
    };
  }

  /**
   * Cancels one ongoing local-model execution scope.
   * @param request Cancellation request payload.
   * @returns Cancellation acknowledgement payload.
   */
  public override async cancel(request: AgentCancelRequest): Promise<AgentCancelResult> {
    return {
      acknowledged: false,
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
    const capabilityStates = Object.values(AgentCapability).map((capability) => ({
      capability,
      supportLevel: LOCAL_MODEL_CAPABILITY_SUPPORT[capability],
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
        supportsCancel: false,
        supportsReasonPropagation: true,
        supportsAbortSignal: true,
      },
      contextWindow: {
        maxInputTokens: 32000,
        maxOutputTokens: 8000,
        supportsAutoTruncation: true,
      },
    };
  }

  /**
   * Probes the configured local-model endpoint/model when runtime config exists.
   * @returns Availability resolution for local-model readiness.
   */
  private async probeLocalModelReadiness(signal?: AbortSignal): Promise<LocalModelProbeResolution> {
    if (this.options.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: [],
      };
    }

    if (!this.options.localModel) {
      return {
        availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        unavailableReasons: [],
      };
    }

    try {
      this.assertSupportedLocalModelProvider(this.options.localModel);
      const payload = await this.requestJson<OllamaTagsResponse>({
        localModel: this.options.localModel,
        path: OLLAMA_TAGS_PATH,
        method: 'GET',
        operation: 'probe',
        signal,
      });
      if (!this.isOllamaTagsResponse(payload)) {
        return {
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [
            `local_model_probe_invalid_response:${LOCAL_MODEL_SURFACE}:${encodeURIComponent(this.options.localModel.endpoint)}`,
          ],
        };
      }

      if (!this.isConfiguredModelAvailable(this.options.localModel.model, payload.models ?? [])) {
        return {
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [
            `local_model_model_missing:${LOCAL_MODEL_SURFACE}:${this.options.localModel.model}`,
          ],
        };
      }

      return {
        availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        unavailableReasons: [],
      };
    } catch (error) {
      this.throwIfCancelled(error, signal, 'probe');
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: [this.formatProbeFailureReason(error)],
      };
    }
  }

  /**
   * Executes one JSON request against the configured local-model endpoint.
   * @param options Request execution options.
   * @returns Parsed JSON payload.
   */
  private async requestJson<T>(options: {
    localModel: LocalModelRuntimeConfig;
    path: string;
    method: 'GET' | 'POST';
    operation: 'probe' | 'invoke';
    request?: AgentInvokeStageRequest;
    signal?: AbortSignal;
    timeoutSignal?: AbortSignal;
    body?: Record<string, unknown>;
  }): Promise<T> {
    const response = await this.requestResponse(options);
    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        `Local model ${options.operation} returned invalid JSON payload.`,
        {
          surface: LOCAL_MODEL_SURFACE,
          endpoint: options.localModel.endpoint,
          path: options.path,
        },
        error,
      );
    }
  }

  /**
   * Executes one HTTP request against the configured local-model endpoint with retry semantics.
   * @param options Request execution options.
   * @returns Raw successful response.
   */
  private async requestResponse(options: {
    localModel: LocalModelRuntimeConfig;
    path: string;
    method: 'GET' | 'POST';
    operation: 'probe' | 'invoke';
    request?: AgentInvokeStageRequest;
    signal?: AbortSignal;
    timeoutSignal?: AbortSignal;
    body?: Record<string, unknown>;
  }): Promise<Response> {
    const maxRetries = Math.max(0, options.localModel.maxRetries ?? 0);
    const totalAttempts = maxRetries + 1;
    const retrySignal = options.timeoutSignal ?? options.signal ?? options.request?.signal;

    for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(options);
        if (!response.ok) {
          if (this.isRetryableStatusCode(response.status) && attempt + 1 < totalAttempts) {
            await this.delayRetry(attempt, retrySignal);
            continue;
          }
          throw new RuntimeError(
            GovernorErrorCode.AGENT_PROTOCOL_INVALID,
            `Local model ${options.operation} failed with HTTP ${response.status}.`,
            {
              surface: LOCAL_MODEL_SURFACE,
              endpoint: options.localModel.endpoint,
              path: options.path,
              status: response.status,
              attempt: attempt + 1,
              maxAttempts: totalAttempts,
            },
          );
        }
        return response;
      } catch (error) {
        this.throwIfCancelled(error, options.signal ?? options.request?.signal, options.operation);
        if (attempt + 1 < totalAttempts && this.isRetryableRequestError(error)) {
          await this.delayRetry(attempt, retrySignal);
          continue;
        }
        throw error;
      }
    }

    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      'Local model request exhausted retry budget without producing a result.',
      {
        surface: LOCAL_MODEL_SURFACE,
        endpoint: options.localModel.endpoint,
        path: options.path,
      },
    );
  }

  /**
   * Executes fetch with timeout and signal propagation.
   * @param options Local-model request options.
   * @returns Raw fetch response.
   */
  private async fetchWithTimeout(options: {
    localModel: LocalModelRuntimeConfig;
    path: string;
    method: 'GET' | 'POST';
    request?: AgentInvokeStageRequest;
    signal?: AbortSignal;
    timeoutSignal?: AbortSignal;
    body?: Record<string, unknown>;
  }): Promise<Response> {
    if (options.timeoutSignal) {
      return await this.options.fetchFn(this.resolveEndpointUrl(options.localModel, options.path), {
        method: options.method,
        headers: {
          accept: 'application/json',
          ...(options.method === 'POST' ? { 'content-type': 'application/json' } : {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        signal: options.timeoutSignal,
      });
    }

    const timeoutMs = this.resolveRequestTimeoutMs(options.localModel, options.request);
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      abortController.abort(`timeout:${String(timeoutMs)}`);
    }, timeoutMs);
    const upstreamSignal = options.signal ?? options.request?.signal;
    const onAbort = (): void => {
      abortController.abort(upstreamSignal?.reason);
    };

    if (upstreamSignal) {
      if (upstreamSignal.aborted) {
        clearTimeout(timeoutHandle);
        abortController.abort(upstreamSignal.reason);
      } else {
        upstreamSignal.addEventListener('abort', onAbort, { once: true });
      }
    }

    try {
      return await this.options.fetchFn(this.resolveEndpointUrl(options.localModel, options.path), {
        method: options.method,
        headers: {
          accept: 'application/json',
          ...(options.method === 'POST' ? { 'content-type': 'application/json' } : {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        signal: abortController.signal,
      });
    } finally {
      clearTimeout(timeoutHandle);
      if (upstreamSignal) {
        upstreamSignal.removeEventListener('abort', onAbort);
      }
    }
  }

  /**
   * Builds a human-readable prompt from runtime input payload.
   * @param input Runtime input payload.
   * @returns Prompt string sent to the local model.
   */
  private renderPrompt(input: Record<string, unknown>): string {
    const prompt = input.prompt;
    if (typeof prompt === 'string' && prompt.trim().length > 0) {
      return prompt.trim();
    }
    return JSON.stringify(input, null, 2);
  }

  /**
   * Converts Ollama token counts into shared usage payload.
   * @param payload Generate response payload.
   * @returns Token usage payload when counts are available.
   */
  private createTokenUsage(
    payload: OllamaGenerateResponse,
  ): AgentInvokeStageResult['usage'] | undefined {
    const inputTokens = this.readOptionalPositiveInteger(payload.prompt_eval_count);
    const outputTokens = this.readOptionalPositiveInteger(payload.eval_count);
    if (inputTokens === undefined && outputTokens === undefined) {
      return undefined;
    }

    return {
      ...(inputTokens !== undefined ? { inputTokens } : {}),
      ...(outputTokens !== undefined ? { outputTokens } : {}),
      totalTokens: (inputTokens ?? 0) + (outputTokens ?? 0),
    };
  }

  /**
   * Resolves effective request timeout using adapter config and invocation overrides.
   * @param localModel Local-model runtime config.
   * @param request Optional invocation request.
   * @returns Timeout in milliseconds.
   */
  private resolveRequestTimeoutMs(
    localModel: LocalModelRuntimeConfig,
    request?: AgentInvokeStageRequest,
  ): number {
    const timeoutCandidates = [
      localModel.requestTimeoutMs,
      request?.agentInvocationTimeoutMs,
      request?.stageTimeoutMs,
      request?.flowTimeoutMs,
    ].filter((candidate): candidate is number => typeof candidate === 'number' && candidate > 0);

    if (timeoutCandidates.length === 0) {
      return LOCAL_MODEL_DEFAULT_TIMEOUT_MS;
    }
    return Math.min(...timeoutCandidates);
  }

  /**
   * Resolves absolute endpoint URL for one Ollama API path.
   * @param localModel Local-model runtime config.
   * @param path Relative API path.
   * @returns Absolute endpoint URL.
   */
  private resolveEndpointUrl(localModel: LocalModelRuntimeConfig, path: string): string {
    const normalizedBase = localModel.endpoint.endsWith('/')
      ? localModel.endpoint
      : `${localModel.endpoint}/`;
    return new URL(path, normalizedBase).toString();
  }

  /**
   * Merges configured availability with live probe availability.
   * @param configuredStatus Availability forced by constructor/config.
   * @param liveStatus Availability from live local-model probe.
   * @returns Conservative merged availability.
   */
  private mergeAvailabilityStatus(
    configuredStatus: AgentAvailabilityStatus,
    liveStatus: AgentAvailabilityStatus,
  ): AgentAvailabilityStatus {
    if (
      configuredStatus === AgentAvailabilityStatus.UNAVAILABLE ||
      liveStatus === AgentAvailabilityStatus.UNAVAILABLE
    ) {
      return AgentAvailabilityStatus.UNAVAILABLE;
    }
    if (
      configuredStatus === AgentAvailabilityStatus.DEGRADED ||
      liveStatus === AgentAvailabilityStatus.DEGRADED
    ) {
      return AgentAvailabilityStatus.DEGRADED;
    }
    return AgentAvailabilityStatus.AVAILABLE;
  }

  /**
   * Verifies that runtime config uses one supported local-model provider.
   * @param localModel Local-model runtime config.
   */
  private assertSupportedLocalModelProvider(localModel: LocalModelRuntimeConfig): void {
    if (localModel.provider === LocalModelProvider.OLLAMA) {
      return;
    }
    throw new RuntimeError(
      GovernorErrorCode.AGENT_PROTOCOL_INVALID,
      `Unsupported local model provider "${localModel.provider}" for surface "${LOCAL_MODEL_SURFACE}".`,
      {
        surface: LOCAL_MODEL_SURFACE,
        provider: localModel.provider,
      },
    );
  }

  /**
   * Checks whether one tags payload matches Ollama `/api/tags` contract.
   * @param payload Unknown JSON payload.
   * @returns True when payload contains model descriptor rows.
   */
  private isOllamaTagsResponse(payload: unknown): payload is OllamaTagsResponse {
    if (!payload || typeof payload !== 'object') {
      return false;
    }
    const models = (payload as OllamaTagsResponse).models;
    return Array.isArray(models);
  }

  /**
   * Checks whether configured model id exists in the returned tags payload.
   * @param configuredModel Configured model name.
   * @param models Model descriptor list from Ollama.
   * @returns True when one row matches the configured model id.
   */
  private isConfiguredModelAvailable(
    configuredModel: string,
    models: OllamaModelDescriptor[],
  ): boolean {
    const normalizedConfiguredModel = configuredModel.trim().toLowerCase();
    return models.some((model) => {
      if (typeof model.name !== 'string') {
        return false;
      }
      return model.name.trim().toLowerCase() === normalizedConfiguredModel;
    });
  }

  /**
   * Converts unknown probe error into one stable machine-readable reason.
   * @param error Unknown probe failure.
   * @returns Machine-readable unavailable reason.
   */
  private formatProbeFailureReason(error: unknown): string {
    const standardizedError = standardizeError(error);
    const endpoint = this.options.localModel?.endpoint ?? 'unknown';
    return `local_model_endpoint_unreachable:${LOCAL_MODEL_SURFACE}:${encodeURIComponent(endpoint)}:${standardizedError.code}:${standardizedError.message}`;
  }

  /**
   * Determines whether an HTTP status should consume retry budget.
   * @param status HTTP status code.
   * @returns True when retry is safe and meaningful.
   */
  private isRetryableStatusCode(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
  }

  /**
   * Determines whether one request failure is retryable.
   * @param error Unknown request error.
   * @returns True when retry should be attempted.
   */
  private isRetryableRequestError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const errorName = (error as { name?: unknown }).name;
    if (errorName === 'TypeError') {
      return true;
    }
    if (errorName === 'AbortError') {
      return false;
    }
    return false;
  }

  private startLongOperationProgress(
    state: LocalModelExecutionState,
    request: LocalModelExecutionRequest,
  ): void {
    state.progressTimer = setInterval(() => {
      if (state.settled || !this.shouldEmitLongOperationProgress(state)) {
        return;
      }
      this.pushLongOperationProgressEvent(state, request);
    }, LOCAL_MODEL_PROGRESS_INTERVAL_MS);
    state.progressTimer.unref?.();
  }

  private shouldEmitLongOperationProgress(state: LocalModelExecutionState): boolean {
    const baselineMs = state.lastTransportActivityAtMs ?? state.startedAtMs;
    if (baselineMs === null) {
      return false;
    }
    return Date.now() - baselineMs >= LOCAL_MODEL_PROGRESS_INTERVAL_MS;
  }

  private pushLongOperationProgressEvent(
    state: LocalModelExecutionState,
    request: LocalModelExecutionRequest,
  ): void {
    const elapsedSeconds =
      state.startedAtMs === null
        ? 0
        : Math.max(0, Math.floor((Date.now() - state.startedAtMs) / 1000));
    this.pushExecutionEvent(state, {
      eventType: AgentStreamEventType.STATUS,
      timestamp: new Date().toISOString(),
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: 'running',
        surface: LOCAL_MODEL_SURFACE,
        transportKind: AdapterTransportKind.BASELINE,
        detail:
          elapsedSeconds === 0
            ? 'Ollama invoke is still running; waiting for local-model stream output.'
            : `Ollama invoke is still running (${elapsedSeconds}s elapsed); waiting for local-model stream output.`,
        activityKey: `${LOCAL_MODEL_SURFACE}:progress:${elapsedSeconds}`,
        invokeLiveness: this.buildLocalModelInvokeLivenessSnapshot(request, state, {
          status: 'running',
          partialOutputPreserved: state.accumulatedText.trim().length > 0,
          cancelMechanism: 'none',
        }),
      },
    });
  }

  private recordLocalModelTransportEvent(
    state: LocalModelExecutionState,
    timestamp: string,
    eventType: string,
    previewText?: string,
  ): void {
    state.lastTransportActivityAt = timestamp;
    state.lastTransportActivityAtMs = Date.parse(timestamp);
    state.latestEventAt = timestamp;
    state.latestEventType = eventType;
    if (previewText) {
      state.latestTextPreview = this.normalizeLocalModelPreviewText(previewText);
    }
  }

  private recordLocalModelSemanticProgress(
    state: LocalModelExecutionState,
    timestamp: string,
    eventType: string,
    previewText: string,
  ): void {
    this.recordLocalModelTransportEvent(state, timestamp, eventType, previewText);
    state.lastSemanticProgressAt = timestamp;
    state.lastSemanticProgressAtMs = Date.parse(timestamp);
  }

  private normalizeLocalModelPreviewText(text: string): string {
    const normalizedText = text.replace(/\s+/gu, ' ').trim();
    if (normalizedText.length <= LOCAL_MODEL_PREVIEW_TEXT_MAX_LENGTH) {
      return normalizedText;
    }
    return `${normalizedText.slice(0, LOCAL_MODEL_PREVIEW_TEXT_MAX_LENGTH - 3)}...`;
  }

  private buildLocalModelInvokeLivenessSnapshot(
    request: LocalModelExecutionRequest,
    state: LocalModelExecutionState,
    options: {
      status: LocalModelLivenessStatus;
      partialOutputPreserved: boolean;
      cancelMechanism: LocalModelCancelMechanism;
      lastTerminalSignalAt?: string;
      suspectReasonCodes?: string[];
    },
  ): Record<string, unknown> {
    const startedAt = state.startedAt ?? new Date().toISOString();
    return {
      adapterId: this.options.agentId,
      surfaceId: LOCAL_MODEL_SURFACE,
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
      activeOperationKind: 'local_model_stream',
      activeOperationStartedAt: startedAt,
      partialOutputPreserved: options.partialOutputPreserved,
      transportKind: AdapterTransportKind.BASELINE,
      cancelMechanism: options.cancelMechanism,
      ...(options.suspectReasonCodes && options.suspectReasonCodes.length > 0
        ? { suspectReasonCodes: options.suspectReasonCodes }
        : {}),
    };
  }

  private resolveLocalModelFailureStatus(error: unknown): LocalModelLivenessStatus {
    return standardizeError(error).code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED
      ? 'cancelled'
      : 'failed';
  }

  private resolveLocalModelFailureCancelMechanism(
    error: unknown,
    request: LocalModelExecutionRequest,
  ): LocalModelCancelMechanism {
    if (
      request.signal?.aborted ||
      standardizeError(error).code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED
    ) {
      return 'abort_signal';
    }
    if (this.isLocalModelTimeoutBudgetError(error)) {
      return 'timeout_abort';
    }
    return 'none';
  }

  private resolveLocalModelFailureReasonCodes(
    error: unknown,
    partialOutputPreserved: boolean,
  ): string[] {
    return [
      ...(this.isLocalModelTimeoutBudgetError(error) ? ['invoke_hard_timeout'] : []),
      ...(partialOutputPreserved ? ['invoke_partial_output_preserved'] : []),
    ];
  }

  private createLocalModelTimeoutBudgetError(
    request: LocalModelExecutionRequest,
    cause: unknown,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      `Local model invoke exceeded timeout budget (${String(request.timeoutMs)}ms).`,
      {
        surface: LOCAL_MODEL_SURFACE,
        routeKey: request.routeKey,
        stageId: request.stageId,
        timeoutMs: request.timeoutMs,
        timeoutBudgetExceeded: true,
      },
      cause,
    );
  }

  private isLocalModelTimeoutBudgetError(error: unknown): boolean {
    if (!(error instanceof RuntimeError)) {
      return false;
    }
    return (
      error.code === GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED &&
      error.details?.timeoutBudgetExceeded === true
    );
  }

  private createRequestTimeoutBudget(
    timeoutMs: number,
    upstreamSignal?: AbortSignal,
  ): LocalModelRequestTimeoutBudget {
    const timeoutController = new AbortController();
    let didTimeout = false;
    const timeoutHandle = setTimeout(() => {
      didTimeout = true;
      timeoutController.abort(`timeout:${String(timeoutMs)}`);
    }, timeoutMs);
    const onAbort = (): void => {
      timeoutController.abort(upstreamSignal?.reason);
    };

    if (upstreamSignal) {
      if (upstreamSignal.aborted) {
        timeoutController.abort(upstreamSignal.reason);
      } else {
        upstreamSignal.addEventListener('abort', onAbort, { once: true });
      }
    }

    return {
      signal: timeoutController.signal,
      cleanup: () => {
        clearTimeout(timeoutHandle);
        if (upstreamSignal) {
          upstreamSignal.removeEventListener('abort', onAbort);
        }
      },
      didTimeout: () => didTimeout,
    };
  }

  /**
   * Rethrows upstream aborts as standardized cancellation errors before probe fallback logic runs.
   * @param error Unknown request/probe failure.
   * @param signal Optional caller abort signal.
   * @param operation Current local-model operation.
   */
  private throwIfCancelled(
    error: unknown,
    signal: AbortSignal | undefined,
    operation: 'probe' | 'invoke',
  ): void {
    if (
      standardizeError(error).code !== GovernorErrorCode.PROCESS_RUNTIME_CANCELLED &&
      !(signal?.aborted && this.isAbortError(error))
    ) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
      `Local model ${operation} cancelled before completion.`,
      {
        surface: LOCAL_MODEL_SURFACE,
        endpoint: this.options.localModel?.endpoint ?? 'unknown',
        operation,
      },
      error,
    );
  }

  /**
   * Checks whether one unknown failure came from fetch abort semantics.
   * @param error Unknown thrown value from fetch/request execution.
   * @returns True when the error shape matches abort semantics.
   */
  private isAbortError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    return (error as { name?: unknown }).name === 'AbortError';
  }

  /**
   * Waits briefly before the next retry attempt.
   * @param attempt Current zero-based attempt index.
   */
  private async delayRetry(attempt: number, signal?: AbortSignal): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('aborted', 'AbortError'));
        return;
      }

      const timeoutHandle = setTimeout(
        () => {
          if (signal) {
            signal.removeEventListener('abort', onAbort);
          }
          resolve();
        },
        LOCAL_MODEL_RETRY_DELAY_MS * (attempt + 1),
      );

      const onAbort = (): void => {
        clearTimeout(timeoutHandle);
        signal?.removeEventListener('abort', onAbort);
        reject(new DOMException('aborted', 'AbortError'));
      };

      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  /**
   * Reads optional positive integer fields from Ollama payloads.
   * @param value Unknown numeric field.
   * @returns Positive integer when available.
   */
  private readOptionalPositiveInteger(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return undefined;
    }
    return Math.trunc(value);
  }
}
