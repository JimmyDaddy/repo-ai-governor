export enum WorkspaceModeSource {
  RUNTIME = "runtime",
  CONFIG = "config",
  DEFAULT = "default",
}

export const GOVERNOR_WORKSPACE_DIRECTORY_NAME = ".repo-ai-governor";
export const GOVERNOR_CONFIG_FILE_NAME = "governor.yaml";
export const TOOL_MANAGED_WORKSPACES_ROOT_SEGMENTS = [".repo-ai-governor", "workspaces"] as const;
