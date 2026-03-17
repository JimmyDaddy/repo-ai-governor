import { EXIT_CODES } from "./exit-codes.js";

type CliErrorOptions = {
  name?: string;
  code?: string;
  exitCode?: number;
  details?: unknown;
};

export class CliError extends Error {
  code: string;
  exitCode: number;
  details: unknown;

  constructor(message: string, options: CliErrorOptions = {}) {
    super(message);
    this.name = options.name ?? this.constructor.name;
    this.code = options.code ?? "cli.internal_error";
    this.exitCode = options.exitCode ?? EXIT_CODES.internalError;
    this.details = options.details;
  }
}

export class BusinessCheckError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, {
      ...options,
      name: "BusinessCheckError",
      code: options.code ?? "cli.business_check_failed",
      exitCode: EXIT_CODES.businessCheckFailed,
    });
  }
}

export class ConfigError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, {
      ...options,
      name: "ConfigError",
      code: options.code ?? "cli.config_error",
      exitCode: EXIT_CODES.configError,
    });
  }
}

export class EnvironmentError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, {
      ...options,
      name: "EnvironmentError",
      code: options.code ?? "cli.environment_error",
      exitCode: EXIT_CODES.environmentError,
    });
  }
}

export class InputError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, {
      ...options,
      name: "InputError",
      code: options.code ?? "cli.input_error",
      exitCode: EXIT_CODES.inputError,
    });
  }
}

export class InternalExecutionError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, {
      ...options,
      name: "InternalExecutionError",
      code: options.code ?? "cli.internal_error",
      exitCode: EXIT_CODES.internalError,
    });
  }
}

export function isCliError(error: unknown): error is CliError {
  return error instanceof CliError;
}
