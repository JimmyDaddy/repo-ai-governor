/**
 * Defines finite workspace command actions supported by the CLI.
 */
export enum CliWorkspaceAction {
  DRY_RUN = 'dry-run',
  EXECUTE = 'execute',
  ROLLBACK = 'rollback',
  CLEAR_CONFIG = 'clear-config',
  BRANCH_SWITCH = 'switch-branch',
  SET_UI_THEME = 'set-ui-theme',
}

/**
 * Defines finite scopes supported by `workspace set-ui-theme`.
 */
export enum CliWorkspaceThemeScope {
  WORKSPACE = 'workspace',
  GLOBAL = 'global',
}

/**
 * Defines supported theme-persistence scopes as one reusable validation set.
 */
export const CLI_WORKSPACE_THEME_SCOPE_VALUES = new Set<string>(
  Object.values(CliWorkspaceThemeScope),
);
