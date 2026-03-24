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
  restrictedNetwork?: boolean;
  restrictedReason?: string | null;
  allowLocalFallback?: boolean;
  hitlDecision?: string | null;
  hitlDecisionReason?: string | null;
  hitlResumeAction?: string | null;
  hitlDecidedBy?: string | null;
  hitlConstraints?: string[];
}
