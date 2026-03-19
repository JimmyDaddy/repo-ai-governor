import type { GovernorConfig } from "./governor-config.interface.js";
import type { WorkspaceConfig } from "./workspace-config.interface.js";

export interface WorkspaceMigrationOptions {
  currentWorkingDirectory: string;
  targetWorkspace: WorkspaceConfig;
  config?: GovernorConfig;
  sourceRuntimeOverrides?: Partial<WorkspaceConfig>;
}
