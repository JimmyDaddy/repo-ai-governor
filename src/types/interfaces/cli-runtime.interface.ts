import type { ParsedOptions } from "../aliases/cli.type.js";

export interface CommandContext {
  command: string;
  globalOptions: ParsedOptions;
  commandOptions: ParsedOptions;
  positionals: string[];
  format: string;
  quiet: boolean;
  verbose: boolean;
}

export interface CliErrorOptions {
  name?: string;
  code?: string;
  exitCode?: number;
  details?: unknown;
}
