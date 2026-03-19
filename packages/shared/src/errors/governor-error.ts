import { ErrorOutputEnvironment, ErrorScenario } from "../constants/error.constant.js";
import type { StandardizedError } from "../types/interfaces/standardized-error.interface.js";
import { GovernorErrorCode } from "./error-code.constant.js";

const ERROR_OUTPUT_ENVIRONMENT_ENV_KEY = "REPO_AI_GOVERNOR_ERROR_OUTPUT";
const ERROR_OUTPUT_ENVIRONMENTS = new Set(Object.values(ErrorOutputEnvironment));

/**
 * Represents the shared abstract base for all standardized governance errors.
 *
 * Why this exists:
 * all package-level errors should follow one output contract so CLI/reporting layers
 * can render failures consistently across text and machine-readable modes.
 */
export abstract class BaseError extends Error {
  public readonly details?: Record<string, unknown>;
  public readonly cause?: unknown;
  public abstract readonly scenario: ErrorScenario;

  /**
   * Creates a standardized base error with shared metadata.
   * @param code Stable error code for downstream output and automation decisions.
   * @param message Human-readable error summary.
   * @param details Optional structured diagnostics payload.
   * @param cause Optional lower-level cause object.
   */
  public constructor(
    public readonly code: GovernorErrorCode,
    message: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.cause = cause;
  }

  /**
   * Renders this error into environment-aware output text.
   * @returns Formatted error string based on resolved output environment.
   */
  public override toString(): string {
    const outputEnvironment = this.resolveOutputEnvironment();
    const outputPayload = this.toOutputPayload();

    if (outputEnvironment === ErrorOutputEnvironment.JSON) {
      return JSON.stringify(outputPayload);
    }

    if (outputEnvironment === ErrorOutputEnvironment.PRETTY) {
      const detailsSuffix = this.details ? `\n  details: ${JSON.stringify(this.details)}` : "";
      return `[${outputPayload.scenario}/${outputPayload.code}] ${outputPayload.message}${detailsSuffix}`;
    }

    return `${outputPayload.code}: ${outputPayload.message}`;
  }

  /**
   * Builds a stable output payload from this error instance.
   * @returns Structured payload used by pretty/plain/json renderers.
   */
  protected toOutputPayload(): StandardizedError & { scenario: ErrorScenario } {
    return {
      code: this.code,
      message: this.message,
      scenario: this.scenario,
    };
  }

  /**
   * Resolves preferred output environment from process context.
   * @returns One of `pretty/plain/json`.
   */
  protected resolveOutputEnvironment(): ErrorOutputEnvironment {
    const configuredEnvironment = process.env[ERROR_OUTPUT_ENVIRONMENT_ENV_KEY];
    if (isErrorOutputEnvironment(configuredEnvironment)) {
      return configuredEnvironment;
    }

    if (process.stdout.isTTY) {
      return ErrorOutputEnvironment.PRETTY;
    }

    return ErrorOutputEnvironment.PLAIN;
  }
}

/**
 * Represents standardized errors for config loading/validation/profile flows.
 */
export class ConfigError extends BaseError {
  public readonly scenario: ErrorScenario = ErrorScenario.CONFIG;
}

/**
 * Represents standardized errors for i18n runtime initialization and translation flows.
 */
export class I18nError extends BaseError {
  public readonly scenario: ErrorScenario = ErrorScenario.I18N;
}

/**
 * Represents standardized errors for generic runtime/bootstrap flows.
 */
export class RuntimeError extends BaseError {
  public readonly scenario: ErrorScenario = ErrorScenario.RUNTIME;
}

/**
 * Backward-compatible alias for existing imports.
 * Why this exists: keep prior references stable while runtime errors migrate.
 */
export class GovernorError extends RuntimeError {}

/**
 * Converts unknown inputs into standardized output payload.
 * @param error Unknown runtime error object.
 * @returns Stable `{code, message}` payload for output rendering.
 */
export function standardizeError(error: unknown): StandardizedError {
  if (error instanceof BaseError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (isErrorLike(error)) {
    return {
      code: GovernorErrorCode.UNKNOWN,
      message: error.message,
    };
  }

  return {
    code: GovernorErrorCode.UNKNOWN,
    message: String(error),
  };
}

/**
 * Checks whether a value exposes a string `message` field.
 * @param candidate Unknown value to inspect.
 * @returns True when candidate contains a string `message`.
 */
function isErrorLike(candidate: unknown): candidate is { message: string } {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const message = (candidate as { message?: unknown }).message;
  return typeof message === "string";
}

/**
 * Checks whether the configured output mode belongs to supported enum values.
 * @param value Raw environment value.
 * @returns True when value matches `ErrorOutputEnvironment`.
 */
function isErrorOutputEnvironment(value: unknown): value is ErrorOutputEnvironment {
  return (
    typeof value === "string" && ERROR_OUTPUT_ENVIRONMENTS.has(value as ErrorOutputEnvironment)
  );
}
