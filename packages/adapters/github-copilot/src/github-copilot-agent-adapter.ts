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
const GITHUB_COPILOT_DEFAULT_PROBE_CACHE_TTL_MS = 30000;
const GITHUB_COPILOT_CHAT_ONLY_ARGS = ['--available-tools', ''] as const;
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
    return {
      identity: {
        agentId: this.options.agentId,
        role: this.options.role,
        surface: GITHUB_COPILOT_SURFACE,
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
   * Invokes one stage using either baseline behavior or real GitHub Copilot CLI execution.
   * @param request Stage invocation request payload.
   * @returns Stage invocation result payload.
   */
  public override async invokeStage(
    request: AgentInvokeStageRequest,
  ): Promise<AgentInvokeStageResult> {
    if (this.options.executionMode === GithubCopilotAgentAdapterExecutionMode.BASELINE) {
      return {
        output: {
          adapterSurface: GITHUB_COPILOT_SURFACE,
          routeKey: request.routeKey,
          stageId: request.stageId,
          echoedInput: request.input,
        },
        elapsedMs: 1,
      };
    }

    const executionResult = await this.runGithubCopilotOperation({
      prompt: this.renderInvokePrompt(request),
      timeoutMs: request.agentInvocationTimeoutMs ?? this.options.requestTimeoutMs,
      signal: request.signal,
      operation: AgentCliExecOperation.INVOKE,
      executionPolicy: resolveAgentStageExecutionPolicy(request.input),
    });
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
      elapsedMs: executionResult.elapsedMs,
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
      if (parsedOutput.responseText.trim() !== GITHUB_COPILOT_HEALTH_CHECK_EXPECTED_RESPONSE) {
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
      'prompt' | 'timeoutMs' | 'signal' | 'operation'
    > & {
      executionPolicy?: ReturnType<typeof resolveAgentStageExecutionPolicy>;
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
                commandArgumentsPrefix: this.resolveCommandArgumentsPrefix(
                  commandSpec.commandArgumentsPrefix,
                  request.executionPolicy,
                ),
                cwd: this.options.currentWorkingDirectory,
                env: this.resolveEnvironment(),
                prompt: request.prompt,
                timeoutMs: remainingTimeoutMs ?? request.timeoutMs,
                signal: request.signal,
                operation: request.operation,
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

    const responseText = jsonEvents
      .filter((event) => event.type?.startsWith('assistant.'))
      .map((event) => this.extractAssistantText(event))
      .filter((value): value is string => Boolean(value && value.trim().length > 0))
      .join('\n')
      .trim();

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
    const args = [
      ...request.commandArgumentsPrefix,
      '-p',
      request.prompt,
      '--allow-all-tools',
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
        if (isError) {
          reject(result);
          return;
        }
        resolveResult(result as GithubCopilotExecRunnerResult);
      };

      const timeoutHandle = setTimeout(() => {
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
      });
      childProcess.stderr.on('data', (chunk: string) => {
        stderr += chunk;
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
}
