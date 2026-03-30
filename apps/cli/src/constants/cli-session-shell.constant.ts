/**
 * Defines finite shell-mode values exposed by the session-first CLI shell contract.
 */
export enum CliSessionShellMode {
  SESSION_SHELL = 'session_shell',
  COMMAND_PALETTE = 'command_palette',
  COMMAND_HANDOFF_PREVIEW = 'command_handoff_preview',
  COMMAND_RUNNING = 'command_running',
}

/**
 * Defines finite input-mode values exposed by the session-first CLI shell contract.
 */
export enum CliSessionShellInputMode {
  PLAIN_TEXT = 'plain_text',
  SLASH_COMMAND = 'slash_command',
}

/**
 * Defines finite handoff-state values exposed by the session-first CLI shell contract.
 */
export enum CliSessionShellHandoffState {
  IDLE = 'idle',
  PREVIEWING = 'previewing',
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCELLED = 'cancelled',
}

/**
 * Defines canonical persistence owners for the session-shell presenter contract.
 */
export enum CliSessionShellPersistenceOwner {
  LOCAL_ORCHESTRATION_SERVICE = 'local_orchestration_service',
}

/**
 * Defines transcript roles rendered inside the session-shell transcript pane.
 */
export enum CliSessionTranscriptRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  SLASH_COMMAND = 'slash_command',
}

/**
 * Defines exit reasons surfaced by the session-shell runner baseline.
 */
export enum CliSessionShellExitReason {
  SLASH_EXIT = 'slash_exit',
  SIGINT = 'sigint',
  EOF = 'eof',
}

/**
 * Defines the presenter-owned session id prefix used before service-backed DTOs land.
 */
export const CLI_SESSION_SHELL_PREVIEW_SESSION_ID_PREFIX = 'session-shell-preview';

/**
 * Defines the default prompt label rendered by the readline-backed session shell.
 */
export const CLI_SESSION_SHELL_PROMPT = 'governor> ';
