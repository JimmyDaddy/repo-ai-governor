import type {
  WorkspaceMigrationStep,
  WorkspaceMigrationStepStatus,
} from "../../constants/index.js";

export interface WorkspaceMigrationStepResult {
  step: WorkspaceMigrationStep;
  status: WorkspaceMigrationStepStatus;
  message: string;
}
