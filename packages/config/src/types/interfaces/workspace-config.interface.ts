import type { WorkspaceMode } from "../aliases/workspace-mode.type.js";

export interface WorkspaceConfig {
  mode: WorkspaceMode;
  toolManagedRoot?: string;
  repoLocalRoot?: string;
}
