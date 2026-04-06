export { ConfigLoader } from './config-loader.js';
export { ProfileResolver } from './profile-resolver.js';
export { SchemaValidator } from './schema-validator.js';
export {
  GovernorSchemaVersion,
  UpgradeConfirmationDecision,
  UpgradeConfirmationReason,
  UpgradeMigrationSuggestionType,
  UpgradeSchemaDiffType,
  WorkspaceModeSource,
} from './constants/index.js';
export { WorkspaceMigrationStep, WorkspaceMigrationStepStatus } from './constants/index.js';
export { UpgradeSchemaDiffService } from './upgrade-schema-diff-service.js';
export { WorkspaceMigrationService } from './workspace-migration-service.js';
export { WorkspaceResolver } from './workspace-resolver.js';
export { WorkspaceMode } from '@repo-ai-governor/shared';
export type {
  AdaptersConfig,
  AdapterRoleBindingConfig,
  AdapterRoleConfig,
  AdapterRoutingConfig,
  AdapterToolConfig,
  GovernorConfig,
  GovernorProfile,
  I18nConfig,
  MemoryConfig,
  StandardsConfig,
  StandardsPackSourceConfig,
  StandardsPackSourcesConfig,
  StandardsProjectionTargetConfig,
  RoleProfileConfig,
  RoleProfileLifecycleConfig,
  ResolvedConfig,
  UiConfig,
  UiReactConfig,
  ResolvedWorkspace,
  UpgradeConfirmationItem,
  UpgradeMigrationSuggestion,
  UpgradeSchemaDiffItem,
  UpgradeSchemaDiffOptions,
  UpgradeSchemaDiffResult,
  WorkspaceConfig,
  WorkspaceMigrationExecutionResult,
  WorkspaceMigrationOptions,
  WorkspaceMigrationPlan,
  WorkspaceMigrationStepResult,
  WorkspaceResolverOptions,
  WorkspaceRuntimeOverrides,
} from './types/interfaces/index.js';
