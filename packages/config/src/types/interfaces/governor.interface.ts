import type { WorkspaceMigrationPolicy } from "../../../../shared/src/constants/index.js";
import type { I18nRuntimeConfig } from "../../../../shared/src/types/interfaces/index.js";
import type { WorkspaceMode } from "../aliases/workspace-mode.type.js";

/**
 * Reuses shared i18n runtime contract as config-level i18n contract.
 */
export type I18nConfig = I18nRuntimeConfig;

/**
 * Defines workspace contract consumed by runtime config.
 */
export interface WorkspaceConfig {
  mode: WorkspaceMode;
  toolManagedRoot?: string;
  repoLocalRoot?: string;
  migrationPolicy?: WorkspaceMigrationPolicy;
}

/**
 * Defines workspace override fields accepted from runtime flags.
 */
export interface WorkspaceRuntimeOverrides {
  mode?: WorkspaceMode;
  toolManagedRoot?: string;
  repoLocalRoot?: string;
}

/**
 * Defines one profile payload that can override workspace/i18n fields.
 */
export interface GovernorProfile {
  workspace?: Partial<WorkspaceConfig>;
  i18n?: Partial<I18nConfig>;
}

/**
 * Defines top-level governor configuration contract.
 */
export interface GovernorConfig {
  schemaVersion: string;
  workspace: WorkspaceConfig;
  i18n: I18nConfig;
  activeProfile?: string;
  profiles?: Record<string, GovernorProfile>;
}

/**
 * Defines resolved config and selected profile metadata.
 */
export interface ResolvedConfig {
  profileId: string | null;
  config: GovernorConfig;
}
