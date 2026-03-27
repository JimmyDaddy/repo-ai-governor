import type { WorkspaceModeSource } from '../../constants/index.js';
import type { WorkspaceMode } from '../aliases/workspace-mode.type.js';
import type { GovernorConfig } from './governor.interface.js';
import type { WorkspaceRuntimeOverrides } from './governor.interface.js';

/**
 * Defines resolved workspace metadata used by runtime/bootstrap flows.
 */
export interface ResolvedWorkspace {
  workspaceId: string;
  mode: WorkspaceMode;
  modeSource: WorkspaceModeSource;
  repositoryRoot: string;
  workspaceRoot: string;
  configPath: string;
}

/**
 * Defines workspace resolver inputs from cwd, config, and runtime overrides.
 */
export interface WorkspaceResolverOptions {
  currentWorkingDirectory: string;
  config?: GovernorConfig;
  runtimeOverrides?: WorkspaceRuntimeOverrides;
}
