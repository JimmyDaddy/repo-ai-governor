import type {
  AdapterAvailability,
  AdapterRemoteApiConfig,
  AdapterSurface,
  AdapterTransportKind,
  CliReactThemePreset,
  LocalModelProvider,
  WorkspaceMigrationPolicy,
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
  workspaceRoot?: string;
}

/**
 * Defines React-shell UI preferences accepted from config.
 */
export interface UiReactConfig {
  theme?: CliReactThemePreset;
}

/**
 * Defines top-level UI preferences consumed by CLI/runtime surfaces.
 */
export interface UiConfig {
  react?: UiReactConfig;
}

/**
 * Defines one standards runtime source reference consumed by runtime loaders.
 */
export interface StandardsPackSourceConfig {
  module: string;
  exportName: string;
  enabled?: boolean;
}

/**
 * Defines layered standards source groups aligned with official/team/repository precedence.
 */
export interface StandardsPackSourcesConfig {
  official?: StandardsPackSourceConfig[];
  team?: StandardsPackSourceConfig[];
  repository?: StandardsPackSourceConfig[];
}

/**
 * Defines one standards projection target emitted by the runtime loader.
 */
export interface StandardsProjectionTargetConfig {
  targetFile: string;
  locale?: string;
}

/**
 * Defines standards runtime config consumed by product/runtime surfaces.
 */
export interface StandardsConfig {
  packSources: StandardsPackSourcesConfig;
  renderTargets?: Array<'human' | 'ai' | 'agents'>;
  projectionTargets?: StandardsProjectionTargetConfig[];
  defaultLocale?: string;
  fallbackLocale?: string;
}

/**
 * Defines one profile payload that can override workspace/i18n fields.
 */
export interface GovernorProfile {
  workspace?: Partial<WorkspaceConfig>;
  i18n?: Partial<I18nConfig>;
  memory?: Partial<MemoryConfig>;
  ui?: UiConfig;
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
  transport?: AdapterTransportKind;
  remoteApi?: AdapterRemoteApiConfig;
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
  ui?: UiConfig;
  standards?: StandardsConfig;
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
