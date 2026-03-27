/**
 * Defines shared execution modes for CLI-backed remote adapter implementations.
 */
export enum AgentCliExecutionMode {
  BASELINE = 'baseline',
  CLI_EXEC = 'cli_exec',
}

/**
 * Defines canonical CLI execution operation kinds.
 */
export enum AgentCliExecOperation {
  PROBE = 'probe',
  INVOKE = 'invoke',
}

/**
 * Defines default retry attempts for CLI-backed remote adapter operations.
 */
export const DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS = 2;

/**
 * Defines default linear retry backoff for CLI-backed remote adapter operations.
 */
export const DEFAULT_AGENT_CLI_EXEC_RETRY_BACKOFF_MS = 250;
