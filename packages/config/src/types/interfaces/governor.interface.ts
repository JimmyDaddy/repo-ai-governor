import type { WorkspaceMigrationPolicy } from '@repo-ai-governor/shared';
import type {
  AdapterAvailability,
  AdapterSurface,
  LocalModelProvider,
} from '@repo-ai-governor/shared';
import type { I18nRuntimeConfig, MemoryRuntimeConfig } from '@repo-ai-governor/shared';
import type { RoleProfileStatus, RoleSource } from '@repo-ai-governor/shared';
import type { WorkspaceMode } from '../aliases/workspace-mode.type.js';

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
  adapters?: Partial<AdaptersConfig>;
}

/**
 * Defines lifecycle metadata accepted by config-level role profile rows.
 */
export interface RoleProfileLifecycleConfig {
  aliases?: string[];
  supersedes?: string[];
  replacedBy?: string;
  deprecatedAt?: string;
  migrationNotes?: string;
}

/**
 * Defines one config-level role profile contract.
 */
export interface RoleProfileConfig {
  roleProfileId: string;
  roleProfileVersion: string;
  displayName: string;
  responsibilities: string[];
  capabilities: string[];
  permissionCeiling: string[];
  roleSource: RoleSource;
  status: RoleProfileStatus;
  lifecycle?: RoleProfileLifecycleConfig;
}

/**
 * Defines one role row consumed by adapter routing governance.
 */
export interface AdapterRoleConfig {
  roleId: string;
  roleProfileId: string;
  requiredCapabilities: string[];
  required: boolean;
}

/**
 * Defines primary/fallback tool binding for one role.
 */
export interface AdapterRoleBindingConfig {
  primarySurface: AdapterSurface;
  fallbackSurfaces?: AdapterSurface[];
}

/**
 * Defines routing section for adapter role bindings.
 */
export interface AdapterRoutingConfig {
  roleBindings: Record<string, AdapterRoleBindingConfig>;
}

/**
 * Defines local-model runtime config accepted by one adapter-tool row.
 */
export interface AdapterToolLocalModelConfig {
  provider: LocalModelProvider;
  endpoint: string;
  model: string;
  requestTimeoutMs?: number;
  maxRetries?: number;
}

/**
 * Defines one adapter-tool row used by connect/doctor/verify runtime checks.
 */
export interface AdapterToolConfig {
  toolId: AdapterSurface;
  enabled?: boolean;
  availability?: AdapterAvailability;
  unavailableReasons?: string[];
  localModel?: AdapterToolLocalModelConfig;
}

/**
 * Defines top-level adapter configuration contract.
 */
export interface AdaptersConfig {
  roles: AdapterRoleConfig[];
  routing: AdapterRoutingConfig;
  tools?: AdapterToolConfig[];
}

/**
 * Defines top-level governor configuration contract.
 */
export interface GovernorConfig {
  schemaVersion: string;
  workspace: WorkspaceConfig;
  i18n: I18nConfig;
  memory?: Partial<MemoryConfig>;
  roles?: RoleProfileConfig[];
  adapters?: AdaptersConfig;
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
