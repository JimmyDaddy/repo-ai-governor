import type { ErrorOutputEnvironment, GovernorErrorCode } from "@repo-ai-governor/shared";
import type {
  CliNextAction,
  CliOutputStatus,
  CliVerbosity,
} from "../../constants/cli-output.constant.js";

/**
 * Defines runtime output context resolved from CLI flags and terminal state.
 */
export interface CliResolvedOutputContext {
  outputMode: ErrorOutputEnvironment;
  verbosity: CliVerbosity;
  noColor: boolean;
  isTty: boolean;
  colorEnabled: boolean;
  downgradedFrom: ErrorOutputEnvironment | null;
}

/**
 * Defines one command execution diagnostics snapshot rendered in CLI output.
 */
export interface CliCommandDiagnostics {
  configSource: "default" | "file";
  locale: string;
  profile: string;
  workspaceMode: string;
  workspaceModeSource: string;
  workspaceId: string;
  workspaceRoot: string;
  memoryStoreEngine: string;
  memoryStoreRoot: string;
  memoryStoreProvider: string;
}

/**
 * Defines one successful CLI output payload in stable machine-readable shape.
 */
export interface CliSuccessOutputPayload {
  schema_version: string;
  status: CliOutputStatus;
  output_mode: ErrorOutputEnvironment;
  verbosity: CliVerbosity;
  command: string;
  message: string;
  runtime: {
    is_tty: boolean;
    color_enabled: boolean;
    downgraded_from: ErrorOutputEnvironment | null;
  };
  diagnostics: CliCommandDiagnostics;
}

/**
 * Defines one failed CLI output payload in stable machine-readable shape.
 */
export interface CliErrorOutputPayload {
  schema_version: string;
  status: CliOutputStatus;
  output_mode: ErrorOutputEnvironment;
  verbosity: CliVerbosity;
  command: string;
  message: string;
  error_code: GovernorErrorCode;
  hint: string;
  next_action: CliNextAction;
  runtime: {
    is_tty: boolean;
    color_enabled: boolean;
    downgraded_from: ErrorOutputEnvironment | null;
  };
}
