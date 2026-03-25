import { GovernorErrorCode, RuntimeError, standardizeError } from "@repo-ai-governor/shared";
import { AgentCliExecOperation } from "./constants/index.js";

const REDACTION_PATTERNS = [
  /(authorization\s*:\s*bearer\s+)([^\s]+)/giu,
  /(bearer\s+)([^\s]+)/giu,
  /((?:api[-_ ]?key|token|secret|password)\s*[=:]\s*)([^\s,;]+)/giu,
  /(ghp_[a-z0-9]+)/giu,
  /(github_pat_[a-z0-9_]+)/giu,
  /(sk-[a-z0-9]+)/giu,
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/gu,
] as const;

/**
 * Owns shared retry/backoff, error-detail collection, and output redaction for CLI-backed adapters.
 */
export class AgentCliExecOperationsRuntime {
  public constructor(
    private readonly surface: string,
    private readonly maxRetryAttempts: number,
    private readonly retryBackoffMs: number,
  ) {}

  /**
   * Executes one CLI-backed adapter operation with conservative retry semantics.
   * @param operation Probe/invoke operation label.
   * @param executeAttempt Operation body.
   * @returns Successful operation result.
   */
  public async executeWithRetry<T>(
    operation: AgentCliExecOperation,
    executeAttempt: (remainingTimeoutMs: number | undefined) => Promise<T>,
    options: {
      signal?: AbortSignal;
      timeoutMs?: number;
    } = {},
  ): Promise<T> {
    const deadlineAt =
      typeof options.timeoutMs === "number" && Number.isFinite(options.timeoutMs)
        ? Date.now() + Math.max(0, options.timeoutMs)
        : undefined;
    let attempt = 0;
    let lastError: unknown;
    while (attempt < this.maxRetryAttempts) {
      this.throwIfAborted(operation, options.signal);
      const remainingTimeoutMs = this.resolveRemainingTimeoutMs(deadlineAt, options.timeoutMs);
      if (remainingTimeoutMs !== undefined && remainingTimeoutMs <= 0) {
        throw this.createOperationRuntimeError(
          operation,
          `${operation} timed out before retry budget remained.`,
        );
      }
      attempt += 1;
      try {
        return await executeAttempt(remainingTimeoutMs);
      } catch (error) {
        lastError = error;
        const detail = this.collectErrorDetail(
          error,
          standardizeError(error).message,
        ).toLowerCase();
        if (
          this.isAbortFailure(detail) ||
          !this.isRetriableFailure(detail) ||
          attempt >= this.maxRetryAttempts
        ) {
          throw error;
        }
        const remainingBudgetAfterFailure = this.resolveRemainingBudget(deadlineAt);
        if (remainingBudgetAfterFailure !== undefined && remainingBudgetAfterFailure <= 0) {
          throw error;
        }
        const backoffMs = this.resolveRetryBackoffMs(attempt, remainingBudgetAfterFailure);
        if (backoffMs <= 0) {
          throw error;
        }
        await this.sleep(operation, backoffMs, options.signal);
      }
    }

    throw lastError;
  }

  /**
   * Builds one detail string by combining standard message and error details payloads.
   * @param error Unknown error object.
   * @param fallbackMessage Standardized fallback message.
   * @returns Concatenated detail string.
   */
  public collectErrorDetail(error: unknown, fallbackMessage: string): string {
    if (!error || typeof error !== "object") {
      return fallbackMessage;
    }

    const detailsRecord = this.readStructuredDetails(error);
    const stderr = typeof detailsRecord?.stderr === "string" ? detailsRecord.stderr : "";
    const stdout = typeof detailsRecord?.stdout === "string" ? detailsRecord.stdout : "";
    return [fallbackMessage, stderr, stdout].filter((value) => value.length > 0).join(" ");
  }

  /**
   * Normalizes one text value for use inside machine-readable reason payloads.
   * @param value Raw text payload.
   * @returns Sanitized single-line string.
   */
  public sanitizeReasonSegment(value: string): string {
    return this.redactSensitiveText(value).replace(/\s+/gu, " ").trim();
  }

  /**
   * Redacts sensitive process output fields before they are attached to runtime errors.
   * @param details Raw process/runtime details.
   * @returns Redacted details payload.
   */
  public createRedactedProcessDetails(details: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(details).map(([key, value]) => {
        if (key === "stdout" || key === "stderr" || key === "message") {
          return [key, typeof value === "string" ? this.redactSensitiveText(value) : value];
        }
        return [key, value];
      }),
    );
  }

  /**
   * Reads runtime error details from both canonical `details` and legacy `metadata` fields.
   * @param error Unknown error object.
   * @returns Structured details record when present.
   */
  private readStructuredDetails(error: unknown): Record<string, unknown> | undefined {
    if (!error || typeof error !== "object") {
      return undefined;
    }

    const details = (error as { details?: unknown }).details;
    if (details && typeof details === "object") {
      return details as Record<string, unknown>;
    }

    const metadata = (error as { metadata?: unknown }).metadata;
    if (metadata && typeof metadata === "object") {
      return metadata as Record<string, unknown>;
    }

    return undefined;
  }

  /**
   * Checks whether one CLI operation failure is safe to retry automatically.
   * @param detail Lower-cased detail string.
   * @returns True when the failure is likely transient.
   */
  private isRetriableFailure(detail: string): boolean {
    return /(timed out|timeout|rate limit|429|quota|payment required|overloaded|temporarily unavailable|econnreset|503|502|504)/u.test(
      detail,
    );
  }

  /**
   * Checks whether one failure was caused by caller or process cancellation semantics.
   * @param detail Lower-cased detail string.
   * @returns True when the failure indicates abort/cancel semantics.
   */
  private isAbortFailure(detail: string): boolean {
    return /(aborterror|aborted|cancelled|canceled|interrupted)/u.test(detail);
  }

  /**
   * Redacts token-like or secret-like substrings from one text payload.
   * @param value Raw text payload.
   * @returns Redacted text payload.
   */
  private redactSensitiveText(value: string): string {
    let redactedValue = value;
    for (const pattern of REDACTION_PATTERNS) {
      redactedValue = redactedValue.replace(pattern, (...groups) => {
        const prefix = typeof groups[1] === "string" ? groups[1] : "";
        return prefix.length > 0 ? `${prefix}[REDACTED]` : "[REDACTED]";
      });
    }
    return redactedValue;
  }

  /**
   * Sleeps for one bounded backoff interval between retries.
   * @param durationMs Backoff duration in milliseconds.
   * @returns Promise resolved after the delay.
   */
  private async sleep(
    operation: AgentCliExecOperation,
    durationMs: number,
    signal?: AbortSignal,
  ): Promise<void> {
    if (durationMs <= 0) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(
          this.createOperationRuntimeError(operation, "Operation aborted during retry backoff."),
        );
        return;
      }

      const timeoutHandle = setTimeout(() => {
        cleanup();
        resolve();
      }, durationMs);

      const onAbort = () => {
        clearTimeout(timeoutHandle);
        cleanup();
        reject(
          this.createOperationRuntimeError(operation, "Operation aborted during retry backoff."),
        );
      };

      const cleanup = () => {
        signal?.removeEventListener("abort", onAbort);
      };

      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }

  /**
   * Throws immediately when the upstream caller signal is already aborted.
   * @param signal Optional caller abort signal.
   */
  private throwIfAborted(operation: AgentCliExecOperation, signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw this.createOperationRuntimeError(operation, "Operation aborted before retry attempt.");
    }
  }

  /**
   * Creates one standardized runtime error for shared CLI exec orchestration failures.
   * @param operation Probe/invoke operation label.
   * @param message Human-readable failure message.
   * @returns Standardized runtime error.
   */
  private createOperationRuntimeError(
    operation: AgentCliExecOperation,
    message: string,
  ): RuntimeError {
    return new RuntimeError(
      operation === AgentCliExecOperation.PROBE
        ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
        : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      message,
      {
        surface: this.surface,
        operation,
      },
    );
  }

  /**
   * Resolves the remaining per-attempt timeout budget from one overall deadline.
   * @param deadlineAt Absolute deadline in milliseconds since epoch.
   * @param timeoutMs Fallback timeout budget when no absolute deadline is tracked.
   * @returns Remaining timeout budget for the next attempt.
   */
  private resolveRemainingTimeoutMs(
    deadlineAt: number | undefined,
    timeoutMs: number | undefined,
  ): number | undefined {
    if (deadlineAt === undefined) {
      return timeoutMs;
    }
    return Math.max(0, deadlineAt - Date.now());
  }

  /**
   * Resolves remaining global retry budget after one failed attempt.
   * @param deadlineAt Absolute deadline in milliseconds since epoch.
   * @returns Remaining budget or `undefined` when no deadline is tracked.
   */
  private resolveRemainingBudget(deadlineAt: number | undefined): number | undefined {
    if (deadlineAt === undefined) {
      return undefined;
    }
    return Math.max(0, deadlineAt - Date.now());
  }

  /**
   * Resolves one bounded retry backoff interval without exceeding the remaining deadline budget.
   * @param attempt Current attempt index.
   * @param remainingBudgetMs Remaining deadline budget after the failed attempt.
   * @returns Backoff duration to apply before retrying.
   */
  private resolveRetryBackoffMs(attempt: number, remainingBudgetMs: number | undefined): number {
    const requestedBackoffMs = this.retryBackoffMs * attempt;
    if (remainingBudgetMs === undefined) {
      return requestedBackoffMs;
    }
    return Math.min(requestedBackoffMs, remainingBudgetMs);
  }
}
