export interface WritableLike {
  isTTY?: boolean;
  write: (chunk: string) => unknown;
}

export interface RawOptions {
  stderr?: boolean;
  ignoreQuiet?: boolean;
}

export interface KeyValueOptions {
  stderr?: boolean;
  force?: boolean;
}

export interface LoggerOptions {
  stdout?: WritableLike;
  stderr?: WritableLike;
  quiet?: boolean;
  verbose?: boolean;
  colorEnabled?: boolean;
}

export interface Logger {
  raw: (message: string, rawOptions?: RawOptions) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
  keyValue: (label: string, value: string, keyValueOptions?: KeyValueOptions) => void;
}

export interface Theme {
  successLabel: (value: string) => string;
  infoLabel: (value: string) => string;
  warnLabel: (value: string) => string;
  errorLabel: (value: string) => string;
  debugLabel: (value: string) => string;
  dim: (value: string) => string;
}
