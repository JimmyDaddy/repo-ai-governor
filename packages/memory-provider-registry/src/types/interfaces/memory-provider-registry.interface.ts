import type { MemoryStoreProvider } from "@repo-ai-governor/memory-store-adapter";
import type { MemoryRuntimeConfig, MemoryStoreEngine } from "@repo-ai-governor/shared";
import type {
  MemoryProviderBuiltInId,
  MemoryProviderDescriptorKind,
  MemoryProviderDistributionMode,
} from "../../constants/memory-provider-registry.constant.js";
import type { MemoryProviderModuleLoader } from "../aliases/index.js";

/**
 * Defines one built-in memory provider descriptor frozen by the registry.
 */
export interface MemoryProviderBuiltInDescriptor {
  id: MemoryProviderBuiltInId;
  kind: MemoryProviderDescriptorKind;
  distributionMode: MemoryProviderDistributionMode;
  packageName: string;
  exportName: string;
  providerName: string;
  supportedStoreEngines: MemoryStoreEngine[];
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
 * Defines registry construction options.
 */
export interface MemoryProviderRegistryOptions {
  moduleLoader?: MemoryProviderModuleLoader;
  builtInDescriptors?: readonly MemoryProviderBuiltInDescriptor[];
}

/**
 * Defines provider load input consumed by CLI or service hosts.
 */
export interface MemoryProviderRegistryLoadRequest {
  workspaceRoot: string;
  memoryConfig: MemoryRuntimeConfig;
}

/**
 * Defines one resolved provider composition returned by the registry loader.
 */
export interface MemoryProviderRegistryLoadResult {
  descriptor: MemoryProviderBuiltInDescriptor;
  memoryStoreRoot: string;
  providerName: string;
  provider: MemoryStoreProvider;
}
