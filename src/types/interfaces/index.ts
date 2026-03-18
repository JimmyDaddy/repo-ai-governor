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
