import type { ConfigurationErrorOptions } from "../types/interfaces/config-error.interface.js";

export type { ConfigurationErrorOptions } from "../types/interfaces/config-error.interface.js";

export class ConfigurationError extends Error {
  code: string;
  details: unknown;

  constructor(message: string, options: ConfigurationErrorOptions = {}) {
    super(message);
    this.name = options.name ?? this.constructor.name;
    this.code = options.code ?? "config.error";
    this.details = options.details;
  }
}

export class ConfigurationConflictError extends ConfigurationError {
  constructor(message: string, options: ConfigurationErrorOptions = {}) {
    super(message, {
      ...options,
      name: "ConfigurationConflictError",
      code: options.code ?? "config.conflict",
    });
  }
}

export class ConfigurationValidationError extends ConfigurationError {
  constructor(message: string, options: ConfigurationErrorOptions = {}) {
    super(message, {
      ...options,
      name: "ConfigurationValidationError",
      code: options.code ?? "config.validation_failed",
    });
  }
}

export class ConfigurationFileError extends ConfigurationError {
  constructor(message: string, options: ConfigurationErrorOptions = {}) {
    super(message, {
      ...options,
      name: "ConfigurationFileError",
      code: options.code ?? "config.file_error",
    });
  }
}
