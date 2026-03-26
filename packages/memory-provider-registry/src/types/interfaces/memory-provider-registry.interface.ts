import type { MemoryStoreProvider } from "@repo-ai-governor/memory-store-adapter";
import type { MemoryRuntimeConfig, MemoryStoreEngine } from "@repo-ai-governor/shared";
import type {
  MemoryProviderBuiltInId,
  MemoryProviderDescriptorKind,
  MemoryProviderDistributionMode,
  MemoryProviderHostSurface,
  MemoryProviderPluginResolutionPolicyKind,
  MemoryProviderPluginSpecifierKind,
  MemoryProviderResolutionSource,
  MemoryProviderRuntimeMode,
} from "../../constants/memory-provider-registry.constant.js";
import type { MemoryProviderModuleLoader } from "../aliases/index.js";

/**
 * Defines one built-in memory provider descriptor frozen by the registry.
 */
export interface MemoryProviderBuiltInDescriptor {
  id: MemoryProviderBuiltInId;
  kind: MemoryProviderDescriptorKind.BUILT_IN;
  distributionMode: MemoryProviderDistributionMode;
  packageName: string;
  exportName: string;
  providerName: string;
  supportedStoreEngines: MemoryStoreEngine[];
}

/**
 * Defines one external plugin descriptor derived from runtime config and policy checks.
 */
export interface MemoryProviderPluginDescriptor {
  id: string;
  kind: MemoryProviderDescriptorKind.PLUGIN;
  distributionMode: MemoryProviderDistributionMode.OPTIONAL;
  moduleSpecifier: string;
  exportName: string;
  providerName: string;
  specifierKind: MemoryProviderPluginSpecifierKind;
  resolutionPolicyKind: MemoryProviderPluginResolutionPolicyKind;
  supportedStoreEngines: MemoryStoreEngine[];
}

/**
 * Defines the allowlist policy applied to `memory.provider.module`.
 */
export interface MemoryProviderPluginPolicy {
  allowedModules: string[];
  allowedPackagePrefixes: string[];
  allowWorkspaceRelativeModules: boolean;
}

/**
 * Defines the minimal constructor options shared by built-in providers.
 */
export interface MemoryProviderInstanceOptions {
  rootDirectory: string;
}

/**
 * Defines the constructor contract required by built-in provider exports.
 */
export interface MemoryProviderConstructor {
  new (options: MemoryProviderInstanceOptions): MemoryStoreProvider;
}

/**
 * Defines plugin-factory context shared across CLI and future service hosts.
 */
export interface MemoryProviderPluginLoadContext {
  workspaceRoot: string;
  memoryStoreRoot: string;
  providerOptions: Record<string, unknown>;
  hostSurface: MemoryProviderHostSurface;
  runtimeMode: MemoryProviderRuntimeMode;
}

/**
 * Defines one stable diagnostics summary shared by CLI, service, and desktop-adjacent hosts.
 */
export interface MemoryProviderCompositionSummary {
  memoryStoreEngine: MemoryStoreEngine;
  memoryStoreRoot: string;
  memoryStoreProvider: string;
  memoryStoreProviderId: string;
  memoryStoreProviderModule?: string;
  memoryStoreDistributionMode: MemoryProviderDistributionMode;
  memoryStoreResolutionSource: MemoryProviderResolutionSource;
  memoryStoreHostSurface: MemoryProviderHostSurface;
  memoryStoreRuntimeMode: MemoryProviderRuntimeMode;
}

/**
 * Defines the factory export contract required by plugin-backed providers.
 */
export type MemoryProviderPluginFactory = (
  context: MemoryProviderPluginLoadContext,
) => MemoryStoreProvider | Promise<MemoryStoreProvider>;

/**
 * Defines the registry-resolved descriptor union shared by built-in and plugin paths.
 */
export type MemoryProviderResolvedDescriptor =
  | MemoryProviderBuiltInDescriptor
  | MemoryProviderPluginDescriptor;

/**
 * Defines registry construction options.
 */
export interface MemoryProviderRegistryOptions {
  moduleLoader?: MemoryProviderModuleLoader;
  builtInDescriptors?: readonly MemoryProviderBuiltInDescriptor[];
  pluginPolicy?: Partial<MemoryProviderPluginPolicy>;
}

/**
 * Defines provider load input consumed by CLI or service hosts.
 */
export interface MemoryProviderRegistryLoadRequest {
  workspaceRoot: string;
  memoryConfig: MemoryRuntimeConfig;
  hostSurface?: MemoryProviderHostSurface;
  runtimeMode?: MemoryProviderRuntimeMode;
}

/**
 * Defines one descriptor-resolution result before the module export is loaded.
 */
export interface MemoryProviderRegistryResolutionResult {
  descriptor: MemoryProviderResolvedDescriptor;
  resolutionSource: MemoryProviderResolutionSource;
}

/**
 * Defines one resolved provider composition returned by the registry loader.
 */
export interface MemoryProviderRegistryLoadResult {
  descriptor: MemoryProviderResolvedDescriptor;
  resolutionSource: MemoryProviderResolutionSource;
  memoryStoreRoot: string;
  providerName: string;
  hostSurface: MemoryProviderHostSurface;
  runtimeMode: MemoryProviderRuntimeMode;
  summary: MemoryProviderCompositionSummary;
  provider: MemoryStoreProvider;
}
