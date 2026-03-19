import type { ResolvedWorkspace } from "./resolved-workspace.interface.js";

export interface WorkspaceMigrationPlan {
  migrationId: string;
  sourceWorkspace: ResolvedWorkspace;
  targetWorkspace: ResolvedWorkspace;
  stagingWorkspaceRoot: string;
  backupWorkspaceRoot: string;
  previousTargetBackupRoot: string;
}
