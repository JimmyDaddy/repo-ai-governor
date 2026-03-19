import type { WorkspaceModeSource } from "../../constants/index.js";
import type { WorkspaceMode } from "../aliases/workspace-mode.type.js";

export interface ResolvedWorkspace {
  workspaceId: string;
  mode: WorkspaceMode;
  modeSource: WorkspaceModeSource;
  repositoryRoot: string;
  workspaceRoot: string;
  configPath: string;
}
