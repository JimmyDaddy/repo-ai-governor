import { MemoryStoreEngine } from '@repo-ai-governor/shared';
import type {
  MemoryProviderBuiltInDescriptor,
  MemoryProviderPluginPolicy,
} from '../types/interfaces/index.js';

/**
 * Enumerates supported built-in memory provider identifiers.
 */
export enum MemoryProviderBuiltInId {
  FS_CSV = 'fs-csv',
  SQLITE_FS = 'sqlite-fs',
}

/**
 * Enumerates registry descriptor kinds.
 */
export enum MemoryProviderDescriptorKind {
  BUILT_IN = 'built_in',
  PLUGIN = 'plugin',
}

/**
 * Enumerates built-in provider distribution modes.
 */
export enum MemoryProviderDistributionMode {
  DEFAULT = 'default',
  OPTIONAL = 'optional',
}

/**
 * Enumerates plugin module specifier classes accepted by the registry.
 */
export enum MemoryProviderPluginSpecifierKind {
  PACKAGE_NAME = 'package_name',
  RELATIVE_PATH = 'relative_path',
  ABSOLUTE_PATH = 'absolute_path',
  FILE_URL = 'file_url',
}

/**
 * Enumerates allowlist policy kinds used for plugin module admission.
 */
export enum MemoryProviderPluginResolutionPolicyKind {
  EXACT_ALLOWLIST = 'exact_allowlist',
  PREFIX_ALLOWLIST = 'prefix_allowlist',
}

/**
 * Enumerates descriptor-resolution sources recorded by the registry.
 */
export enum MemoryProviderResolutionSource {
  LEGACY_STORE_ENGINE = 'legacy_store_engine',
  BUILT_IN_ID = 'built_in_id',
  PLUGIN_MODULE = 'plugin_module',
}

/**
 * Enumerates host surfaces that can request plugin-backed memory providers.
 */
export enum MemoryProviderHostSurface {
  CLI = 'cli',
  LOCAL_ORCHESTRATION_SERVICE = 'local_orchestration_service',
}

/**
 * Enumerates runtime modes that can consume plugin-backed memory providers.
 */
export enum MemoryProviderRuntimeMode {
  EMBEDDED = 'embedded',
  DAEMON = 'daemon',
}

export const DEFAULT_MEMORY_PROVIDER_PLUGIN_EXPORT_NAME = 'createMemoryStoreProvider';
export const DEFAULT_MEMORY_PROVIDER_PLUGIN_ALLOWED_PACKAGE_PREFIXES = [
  '@repo-ai-governor/memory-provider-',
] as const;
export const DEFAULT_MEMORY_PROVIDER_PLUGIN_ALLOWED_MODULES = [] as const;
export const DEFAULT_MEMORY_PROVIDER_PLUGIN_POLICY: MemoryProviderPluginPolicy = {
  allowedModules: [...DEFAULT_MEMORY_PROVIDER_PLUGIN_ALLOWED_MODULES],
  allowedPackagePrefixes: [...DEFAULT_MEMORY_PROVIDER_PLUGIN_ALLOWED_PACKAGE_PREFIXES],
  allowWorkspaceRelativeModules: false,
};

export const BUILT_IN_MEMORY_PROVIDER_DESCRIPTORS: readonly MemoryProviderBuiltInDescriptor[] = [
  {
    id: MemoryProviderBuiltInId.FS_CSV,
    kind: MemoryProviderDescriptorKind.BUILT_IN,
    distributionMode: MemoryProviderDistributionMode.DEFAULT,
    packageName: '@repo-ai-governor/memory-provider-fs-csv',
    exportName: 'FsCsvMemoryStoreProvider',
    providerName: 'FsCsvMemoryStoreProvider',
    supportedStoreEngines: [MemoryStoreEngine.FS_CSV],
  },
  {
    id: MemoryProviderBuiltInId.SQLITE_FS,
    kind: MemoryProviderDescriptorKind.BUILT_IN,
    distributionMode: MemoryProviderDistributionMode.DEFAULT,
    packageName: '@repo-ai-governor/memory-provider-sqlite-fs',
    exportName: 'SqliteFsMemoryStoreProvider',
    providerName: 'SqliteFsMemoryStoreProvider',
    supportedStoreEngines: [MemoryStoreEngine.SQLITE_FS],
  },
] as const;

export const MEMORY_STORE_ENGINE_TO_BUILT_IN_PROVIDER_ID: Readonly<
  Record<MemoryStoreEngine, MemoryProviderBuiltInId>
> = {
  [MemoryStoreEngine.FS_CSV]: MemoryProviderBuiltInId.FS_CSV,
  [MemoryStoreEngine.SQLITE_FS]: MemoryProviderBuiltInId.SQLITE_FS,
};
