export type { LocaleOptions } from "./locale-options.interface.js";
export type {
  AdapterDefinition,
  LocalizedText as AdapterLocalizedText,
} from "./adapter.interface.js";
export type {
  AdapterRuntimeConfig,
  OptionalFileState,
  ArtifactPaths,
  StandardsSectionItem,
  SlotSummaryActiveItem,
  SlotSummaryInjections,
  SlotSummaryChecks,
  SlotSummary,
  AdapterBundleEntryFile,
  AdapterBundleEntry,
  AdapterBundleReferences,
  AdapterBaseBundle,
  BuildBaseAdapterBundleOptions,
  AdapterPromptFile,
  ClaudeCodeAdapterBundleFiles,
  ClaudeCodeAdapterBundle,
  CodexAdapterBundle,
  GitHubCopilotAdapterBundleFiles,
  GitHubCopilotAdapterBundle,
} from "./adapter-bundle.interface.js";
export type {
  OptionDefinition,
  ArgumentDefinition,
  CommandDefinition,
} from "./cli-command-registry.interface.js";
export type { CommandContext, CliErrorOptions } from "./cli-runtime.interface.js";
export type {
  WritableLike,
  RawOptions,
  KeyValueOptions,
  LoggerOptions,
  Logger,
  Theme,
} from "./cli-ui.interface.js";
export type { CliIo, CliProgram, PackageJsonLike } from "./cli-main.interface.js";
export type {
  WorkspaceConfigProject,
  WorkspaceConfigExecution,
  WorkspaceConfigArtifactsTaskFiles,
  WorkspaceConfigArtifacts,
  WorkspaceConfigStandards,
  WorkspaceConfigAdapters,
  WorkspaceConfigSlots,
  WorkspaceConfigReporting,
  WorkspaceConfigAgentEntry,
  WorkspaceConfig,
  InitTemplateContext,
  SprintArtifacts,
  GeneratedWorkspaceFile,
  BuildGeneratedWorkspaceFilesOptions,
  BuildGeneratedWorkspaceFilesResult,
} from "./command-bootstrap.interface.js";
export type { CheckFinding, CheckFindingOptions } from "./command-check.interface.js";
export type {
  DoctorFinding,
  DoctorFindingDraft,
  DoctorPathFindingOptions,
  DoctorSummary,
  DoctorCheckPayload,
  DoctorPayload,
  DoctorArtifactPaths,
  DoctorDirectoryCheck,
  DoctorFileCheck,
  DoctorPackageJsonLike,
  DoctorResolvedConfigData,
  DoctorResolvedConfig,
  DoctorCommandState,
} from "./command-doctor.interface.js";
export type {
  GovernorDocument,
  UpgradeFile,
  UpgradePlan,
  UpgradeOperation,
  UpgradePayload,
} from "./command-upgrade.interface.js";
