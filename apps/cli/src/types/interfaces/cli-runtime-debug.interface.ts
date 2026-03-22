/**
 * Defines local debug/replay flags consumed by runtime `run` execution paths.
 */
export interface CliRuntimeDebugOptions {
  dryRun: boolean;
  trace: boolean;
  replayPath: string | null;
}
