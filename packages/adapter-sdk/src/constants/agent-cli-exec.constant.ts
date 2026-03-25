/**
 * Defines shared execution modes for CLI-backed remote adapter implementations.
 */
export enum AgentCliExecutionMode {
  BASELINE = "baseline",
  CLI_EXEC = "cli_exec",
}

/**
 * Defines canonical CLI execution operation kinds.
 */
export enum AgentCliExecOperation {
  PROBE = "probe",
  INVOKE = "invoke",
}
