import type { WorkspaceMigrationPolicy } from "@repo-ai-governor/shared";
import type { I18nRuntimeConfig, MemoryRuntimeConfig } from "@repo-ai-governor/shared";
import type { WorkspaceMode } from "../aliases/workspace-mode.type.js";

/**
 * Reuses shared i18n runtime contract as config-level i18n contract.
 */
export type I18nConfig = I18nRuntimeConfig;

/**
 * Reuses shared memory runtime contract as config-level memory contract.
 */
export type MemoryConfig = MemoryRuntimeConfig;

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
  memory?: Partial<MemoryConfig>;
}

/**
 * Defines top-level governor configuration contract.
 */
export interface GovernorConfig {
  schemaVersion: string;
  workspace: WorkspaceConfig;
  i18n: I18nConfig;
  memory?: Partial<MemoryConfig>;
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
