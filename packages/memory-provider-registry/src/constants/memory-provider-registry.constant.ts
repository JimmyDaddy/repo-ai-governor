import { MemoryStoreEngine } from "@repo-ai-governor/shared";
import type { MemoryProviderBuiltInDescriptor } from "../types/interfaces/index.js";

/**
 * Enumerates supported built-in memory provider identifiers.
 */
export enum MemoryProviderBuiltInId {
  FS_CSV = "fs-csv",
  SQLITE_FS = "sqlite-fs",
}

/**
 * Enumerates registry descriptor kinds.
 */
export enum MemoryProviderDescriptorKind {
  BUILT_IN = "built_in",
}

/**
 * Enumerates built-in provider distribution modes.
 */
export enum MemoryProviderDistributionMode {
  DEFAULT = "default",
  OPTIONAL = "optional",
}

export const BUILT_IN_MEMORY_PROVIDER_DESCRIPTORS: readonly MemoryProviderBuiltInDescriptor[] = [
  {
    id: MemoryProviderBuiltInId.FS_CSV,
    kind: MemoryProviderDescriptorKind.BUILT_IN,
    distributionMode: MemoryProviderDistributionMode.DEFAULT,
    packageName: "@repo-ai-governor/memory-provider-fs-csv",
    exportName: "FsCsvMemoryStoreProvider",
    providerName: "FsCsvMemoryStoreProvider",
    supportedStoreEngines: [MemoryStoreEngine.FS_CSV],
  },
  {
    id: MemoryProviderBuiltInId.SQLITE_FS,
    kind: MemoryProviderDescriptorKind.BUILT_IN,
    distributionMode: MemoryProviderDistributionMode.OPTIONAL,
    packageName: "@repo-ai-governor/memory-provider-sqlite-fs",
    exportName: "SqliteFsMemoryStoreProvider",
    providerName: "SqliteFsMemoryStoreProvider",
    supportedStoreEngines: [MemoryStoreEngine.SQLITE_FS],
  },
] as const;

export const MEMORY_STORE_ENGINE_TO_BUILT_IN_PROVIDER_ID: Readonly<
  Record<MemoryStoreEngine, MemoryProviderBuiltInId>
> = {
  [MemoryStoreEngine.FS_CSV]: MemoryProviderBuiltInId.FS_CSV,
  [MemoryStoreEngine.SQLITE_FS]: MemoryProviderBuiltInId.SQLITE_FS,
};
