/**
 * Defines finite UI mode values supported by the CLI interactive-shell contract.
 */
export enum CliInteractiveUiMode {
  NONE = 'none',
  CLASSIC = 'classic',
  REACT = 'react',
  TUI = 'tui',
}

/**
 * Defines allowed raw `--ui` option values.
 */
export const CLI_INTERACTIVE_UI_MODE_VALUES = new Set<string>(Object.values(CliInteractiveUiMode));

/**
 * Defines the default interactive UI mode when no explicit `--ui` option is provided.
 */
export const DEFAULT_CLI_INTERACTIVE_UI_MODE = CliInteractiveUiMode.CLASSIC;

/**
 * Defines lifecycle run states exposed by the minimal interactive-shell session.
 */
export enum CliInteractiveShellRunState {
  IDLE = 'idle',
  EDITING = 'editing',
  VALIDATING = 'validating',
  CONFIRMING = 'confirming',
  SUBMITTING = 'submitting',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCELLED = 'cancelled',
}

/**
 * Defines stderr rendering ownership for shell sessions.
 */
export enum CliInteractiveShellStderrRenderingMode {
  STDERR_ONLY = 'stderr_only',
}

/**
 * Defines controlled fallback reasons for UI mode resolution and shell downgrade handling.
 */
export enum CliInteractiveShellFallbackBehavior {
  NO_INTERACTIVE = 'no_interactive',
  NON_TTY = 'non_tty',
  OUTPUT_MODE_BLOCKED = 'output_mode_blocked',
  TUI_NOT_IMPLEMENTED = 'tui_not_implemented',
  SHELL_INIT_FAILED = 'shell_init_failed',
  SIGINT = 'sigint',
}

/**
 * Defines the first minimal descriptor id used by the `init` React-style shell.
 */
export const CLI_INIT_REACT_SHELL_DESCRIPTOR_ID = 'cli.init.bootstrap.m1';
