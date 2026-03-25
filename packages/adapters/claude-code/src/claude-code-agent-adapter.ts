import { spawn } from "node:child_process";

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
  type AgentStreamEvent,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
  DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS,
  DEFAULT_AGENT_CLI_EXEC_RETRY_BACKOFF_MS,
} from "@repo-ai-governor/adapter-sdk";
import { GovernorErrorCode, RuntimeError, standardizeError } from "@repo-ai-governor/shared";
import { ClaudeCodeAgentAdapterExecutionMode } from "./constants/claude-code-agent-adapter.constant.js";
import type {
  ClaudeCodeAgentAdapterOptions,
  ClaudeCodeExecRunner,
  ClaudeCodeExecRunnerRequest,
  ClaudeCodeExecRunnerResult,
} from "./types/interfaces/claude-code-agent-adapter.interface.js";

const CLAUDE_CODE_DEFAULT_AGENT_ID = "claude-code-default-agent";
const CLAUDE_CODE_DEFAULT_ROLE = "coder";
const CLAUDE_CODE_DEFAULT_ROLE_PROFILE_ID = "coder-default";
const CLAUDE_CODE_DEFAULT_ROLE_SOURCE = "default";
const CLAUDE_CODE_SURFACE = "claude-code";
const CLAUDE_CODE_DIRECT_COMMAND = "claude";
const CLAUDE_CODE_FALLBACK_COMMAND = "claude-code";
const CLAUDE_CODE_DEFAULT_TIMEOUT_MS = 30000;
const CLAUDE_CODE_DEFAULT_PROBE_CACHE_TTL_MS = 30000;
const CLAUDE_CODE_HEALTH_CHECK_PROMPT = "Respond with exactly OK.";
const CLAUDE_CODE_HEALTH_CHECK_EXPECTED_RESPONSE = "OK";

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
  public override async probe(_request: AgentProbeRequest): Promise<AgentProbeResult> {
    const runtimeProbe = await this.resolveProbeResolution();
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

    const executionResult = await this.runClaudeCodeOperation({
      prompt: this.renderInvokePrompt(request),
      timeoutMs: request.agentInvocationTimeoutMs ?? this.options.requestTimeoutMs,
      signal: request.signal,
      operation: AgentCliExecOperation.INVOKE,
    });
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
    const timestamp = new Date().toISOString();
    yield {
      eventType: AgentStreamEventType.STATUS,
      timestamp,
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      payload: {
        status: "running",
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
        status: "completed",
        surface: CLAUDE_CODE_SURFACE,
      },
    };
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
        reason: "claude-code-cli-confirmation-gate-unsupported",
        constraints: ["escalate_to_human_gate"],
        decidedAt: new Date().toISOString(),
      };
    }

    return {
      decision: AgentConfirmationDecision.APPROVE,
      reason: "claude-code-adapter-baseline-approved",
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
  private createCapabilityMatrix(): AgentProbeResult["capabilityMatrix"] {
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
  private async resolveProbeResolution(): Promise<ClaudeCodeProbeResolution> {
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

    const resolution = await this.executeHealthProbe();
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
  private async executeHealthProbe(): Promise<ClaudeCodeProbeResolution> {
    try {
      const executionResult = await this.runClaudeCodeOperation({
        prompt: CLAUDE_CODE_HEALTH_CHECK_PROMPT,
        timeoutMs: this.options.requestTimeoutMs,
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
    request: Pick<ClaudeCodeExecRunnerRequest, "prompt" | "timeoutMs" | "signal" | "operation">,
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
                commandArgumentsPrefix: [...commandSpec.commandArgumentsPrefix],
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
      "You are executing one Repo AI Governor stage through Claude Code CLI.",
      `Route Key: ${request.routeKey}`,
      `Stage ID: ${request.stageId}`,
      "Treat the following JSON payload as the canonical stage input.",
      renderedInput,
    ].join("\n\n");
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
    if (detail.includes("enoent")) {
      return true;
    }
    if (!error || typeof error !== "object") {
      return false;
    }
    return (error as { code?: unknown }).code === "ENOENT";
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
      "--print",
      "--output-format",
      "text",
      "--no-session-persistence",
      "--dangerously-skip-permissions",
      "--add-dir",
      request.cwd,
      request.prompt,
    ];

    return await new Promise<ClaudeCodeExecRunnerResult>((resolveResult, reject) => {
      const childProcess = spawn(request.command, args, {
        cwd: request.cwd,
        env: request.env,
        stdio: ["ignore", "pipe", "pipe"],
        ...(request.signal ? { signal: request.signal } : {}),
      });
      let stdout = "";
      let stderr = "";
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
        childProcess.kill("SIGTERM");
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

      childProcess.stdout.setEncoding("utf8");
      childProcess.stderr.setEncoding("utf8");
      childProcess.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });
      childProcess.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });
      childProcess.on("error", (error) => {
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
      childProcess.on("close", (exitCode, signal) => {
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
}
