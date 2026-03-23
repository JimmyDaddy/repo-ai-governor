import { ErrorOutputEnvironment } from "@repo-ai-governor/shared";

/**
 * Defines verbosity levels supported by the CLI output contract.
 *
 * Why this exists:
 * output density should be controlled through one finite enum instead of scattered literals.
 */
export enum CliVerbosity {
  QUIET = "quiet",
  NORMAL = "normal",
  VERBOSE = "verbose",
}

/**
 * Defines stable CLI result statuses used by output contract payloads.
 *
 * Why this exists:
 * status values are consumed by both human renderers and JSON parsers.
 */
export enum CliOutputStatus {
  SUCCESS = "success",
  ERROR = "error",
}

/**
 * Defines stable suggested next actions for structured error output.
 *
 * Why this exists:
 * downstream automations can branch on finite next_action values.
 */
export enum CliNextAction {
  CHECK_COMMAND_USAGE = "check_command_usage",
  INSPECT_GOVERNOR_CONFIG = "inspect_governor_config",
  INSPECT_POLICY_DIAGNOSTICS = "inspect_policy_diagnostics",
  CHECK_REPLAY_SOURCE = "check_replay_source",
  RETRY_WITH_VERBOSE = "retry_with_verbose",
  REPORT_ISSUE = "report_issue",
}

/**
 * Defines the stable schema version for machine-readable CLI output.
 */
export const CLI_OUTPUT_SCHEMA_VERSION = "cli_output_v1";

/**
 * Defines supported CLI output modes as a reusable runtime validation set.
 */
export const CLI_OUTPUT_MODE_VALUES = new Set<string>(Object.values(ErrorOutputEnvironment));

/**
 * Defines supported CLI verbosity values as a reusable runtime validation set.
 */
export const CLI_VERBOSITY_VALUES = new Set<string>(Object.values(CliVerbosity));

/**
 * Defines canonical status values as a reusable runtime validation set.
 */
export const CLI_OUTPUT_STATUS_VALUES = new Set<string>(Object.values(CliOutputStatus));

/**
 * Defines canonical next actions as a reusable runtime validation set.
 */
export const CLI_NEXT_ACTION_VALUES = new Set<string>(Object.values(CliNextAction));

/**
 * Defines default verbosity for CLI output when flags omit explicit value.
 */
export const DEFAULT_CLI_VERBOSITY = CliVerbosity.NORMAL;

/**
 * Defines default output mode before TTY-aware downgrade policy is applied.
 */
export const DEFAULT_CLI_OUTPUT_MODE = ErrorOutputEnvironment.PRETTY;

/**
 * Defines automatic fallback output mode when pretty rendering is unsafe.
 */
export const NON_TTY_FALLBACK_OUTPUT_MODE = ErrorOutputEnvironment.PLAIN;

/**
 * Defines global CLI options that require one following value token.
 */
export const CLI_OPTIONS_REQUIRING_VALUE = new Set<string>([
  "--locale",
  "--profile",
  "--output",
  "--verbosity",
  "--replay",
  "--task-id",
]);
