import type { GovernorConfig } from "./governor-config.interface.js";
import type { WorkspaceRuntimeOverrides } from "./workspace-runtime-overrides.interface.js";

export interface WorkspaceResolverOptions {
  currentWorkingDirectory: string;
  config?: GovernorConfig;
  runtimeOverrides?: WorkspaceRuntimeOverrides;
}
