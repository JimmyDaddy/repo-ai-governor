import type { StandardizedError } from "../../../../shared/src/errors/index.js";
import type { WorkspaceMigrationPlan } from "./workspace-migration-plan.interface.js";
import type { WorkspaceMigrationStepResult } from "./workspace-migration-step-result.interface.js";

export interface WorkspaceMigrationExecutionResult {
  success: boolean;
  plan: WorkspaceMigrationPlan;
  steps: WorkspaceMigrationStepResult[];
  error?: StandardizedError;
}
