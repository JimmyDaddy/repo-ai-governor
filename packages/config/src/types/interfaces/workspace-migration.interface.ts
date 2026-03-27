import type { StandardizedError } from '@repo-ai-governor/shared';
import type {
  WorkspaceMigrationStep,
  WorkspaceMigrationStepStatus,
} from '../../constants/index.js';
import type { GovernorConfig, WorkspaceConfig } from './governor.interface.js';
import type { ResolvedWorkspace } from './workspace.interface.js';

/**
 * Defines one step result in workspace migration chain execution.
 */
export interface WorkspaceMigrationStepResult {
  step: WorkspaceMigrationStep;
  status: WorkspaceMigrationStepStatus;
  message: string;
}

/**
 * Defines migration plan with source/target/staging/backup roots.
 */
export interface WorkspaceMigrationPlan {
  migrationId: string;
  sourceWorkspace: ResolvedWorkspace;
  targetWorkspace: ResolvedWorkspace;
  stagingWorkspaceRoot: string;
  backupWorkspaceRoot: string;
  previousTargetBackupRoot: string;
}

/**
 * Defines migration options for plan generation.
 */
export interface WorkspaceMigrationOptions {
  currentWorkingDirectory: string;
  targetWorkspace: WorkspaceConfig;
  config?: GovernorConfig;
  sourceRuntimeOverrides?: Partial<WorkspaceConfig>;
}

/**
 * Defines migration execution output including optional standardized error.
 */
export interface WorkspaceMigrationExecutionResult {
  success: boolean;
  plan: WorkspaceMigrationPlan;
  steps: WorkspaceMigrationStepResult[];
  error?: StandardizedError;
}
