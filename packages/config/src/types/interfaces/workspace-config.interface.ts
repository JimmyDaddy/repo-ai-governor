import type { WorkspaceMigrationPolicy } from "../../../../shared/src/constants/index.js";
import type { WorkspaceMode } from "../aliases/workspace-mode.type.js";

export interface WorkspaceConfig {
  mode: WorkspaceMode;
  toolManagedRoot?: string;
  repoLocalRoot?: string;
  migrationPolicy?: WorkspaceMigrationPolicy;
}
