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
} from '@repo-ai-governor/adapter-sdk';
import {
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
  prompt_eval_count?: number;
  eval_count?: number;
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
  public override async probe(_request: AgentProbeRequest): Promise<AgentProbeResult> {
    const localModelProbe = await this.probeLocalModelReadiness();
    return {
      identity: {
        agentId: this.options.agentId,
        role: this.options.role,
        surface: LOCAL_MODEL_SURFACE,
        roleProfileId: this.options.roleProfileId,
        roleSource: this.options.roleSource,
      },
      availabilityStatus: this.mergeAvailabilityStatus(
        this.options.availabilityStatus,
        localModelProbe.availabilityStatus,
      ),
      capabilityMatrix: this.createCapabilityMatrix(),
      unavailableReasons: [
        ...this.options.unavailableReasons,
        ...localModelProbe.unavailableReasons,
      ].filter((reason, index, list) => list.indexOf(reason) === index),
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
    const startedAt = Date.now();
    const prompt = this.renderPrompt(request.input);
    const generateResponse = await this.requestJson<OllamaGenerateResponse>({
      localModel: this.options.localModel,
      path: OLLAMA_GENERATE_PATH,
      method: 'POST',
      request,
      body: {
        model: this.options.localModel.model,
        prompt,
        stream: false,
      },
      operation: 'invoke',
    });
    const responseText = this.readGeneratedText(generateResponse, request);
    const usage = this.createTokenUsage(generateResponse);

    return {
      output: {
        adapterSurface: LOCAL_MODEL_SURFACE,
        routeKey: request.routeKey,
        stageId: request.stageId,
        provider: this.options.localModel.provider,
        endpoint: this.options.localModel.endpoint,
        model: this.options.localModel.model,
        responseText,
        echoedInput: request.input,
      },
      ...(usage ? { usage } : {}),
      elapsedMs: Date.now() - startedAt,
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
  private async probeLocalModelReadiness(): Promise<LocalModelProbeResolution> {
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
    body?: Record<string, unknown>;
  }): Promise<T> {
    const maxRetries = Math.max(0, options.localModel.maxRetries ?? 0);
    const totalAttempts = maxRetries + 1;

    for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(options);
        if (!response.ok) {
          if (this.isRetryableStatusCode(response.status) && attempt + 1 < totalAttempts) {
            await this.delayRetry(attempt);
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
              attempt: attempt + 1,
              maxAttempts: totalAttempts,
            },
            error,
          );
        }
      } catch (error) {
        if (attempt + 1 < totalAttempts && this.isRetryableRequestError(error)) {
          await this.delayRetry(attempt);
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
    body?: Record<string, unknown>;
  }): Promise<Response> {
    const timeoutMs = this.resolveRequestTimeoutMs(options.localModel, options.request);
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      abortController.abort(`timeout:${String(timeoutMs)}`);
    }, timeoutMs);
    const onAbort = (): void => {
      abortController.abort(options.request?.signal?.reason);
    };

    if (options.request?.signal) {
      if (options.request.signal.aborted) {
        clearTimeout(timeoutHandle);
        abortController.abort(options.request.signal.reason);
      } else {
        options.request.signal.addEventListener('abort', onAbort, { once: true });
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
      if (options.request?.signal) {
        options.request.signal.removeEventListener('abort', onAbort);
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
   * Reads generated text from Ollama response payload.
   * @param payload Generate response payload.
   * @param request Invocation request metadata.
   * @returns Non-empty response text.
   */
  private readGeneratedText(
    payload: OllamaGenerateResponse,
    request: AgentInvokeStageRequest,
  ): string {
    if (typeof payload.response === 'string' && payload.response.trim().length > 0) {
      return payload.response.trim();
    }
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
    if (errorName === 'AbortError' || errorName === 'TypeError') {
      return true;
    }
    return false;
  }

  /**
   * Waits briefly before the next retry attempt.
   * @param attempt Current zero-based attempt index.
   */
  private async delayRetry(attempt: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, LOCAL_MODEL_RETRY_DELAY_MS * (attempt + 1));
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
