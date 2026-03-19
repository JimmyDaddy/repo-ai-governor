import type { WorkspaceMode } from "../aliases/workspace-mode.type.js";

export interface WorkspaceRuntimeOverrides {
  mode?: WorkspaceMode;
  toolManagedRoot?: string;
  repoLocalRoot?: string;
}
