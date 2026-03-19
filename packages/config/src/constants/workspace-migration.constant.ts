export enum WorkspaceMigrationStep {
  COPY = "copy",
  VERIFY = "verify",
  SWITCH = "switch",
  ROLLBACK = "rollback",
}

export enum WorkspaceMigrationStepStatus {
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  SKIPPED = "skipped",
}

export const WORKSPACE_MIGRATION_ROOT_SEGMENTS = [".repo-ai-governor-migration"] as const;
