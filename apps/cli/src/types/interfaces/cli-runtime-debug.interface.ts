/**
 * Defines normalized runtime flags consumed by command execution paths.
 */
export interface CliRuntimeDebugOptions {
  dryRun: boolean;
  trace: boolean;
  replayPath: string | null;
  adapters?: boolean;
  fix?: boolean;
  recordLedger?: boolean;
  taskId?: string | null;
}
