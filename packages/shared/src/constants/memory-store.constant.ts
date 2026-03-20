import type { MemoryRuntimeConfig } from "../types/interfaces/memory-runtime-config.interface.js";

/**
 * Enumerates supported memory store engines.
 */
export enum MemoryStoreEngine {
  FS_CSV = "fs_csv",
  SQLITE_FS = "sqlite_fs",
}

export const DEFAULT_MEMORY_STORE_ENGINE = MemoryStoreEngine.FS_CSV;
export const DEFAULT_MEMORY_STORE_ROOT_SEGMENTS = ["context", "memory"] as const;
export const DEFAULT_MEMORY_STORE_ROOT = DEFAULT_MEMORY_STORE_ROOT_SEGMENTS.join("/");

/**
 * Provides the default runtime memory-store config.
 *
 * Why this exists:
 * command surfaces and runtime entrypoints should share one deterministic fallback
 * for memory provider selection when repository config omits memory fields.
 */
export const DEFAULT_MEMORY_RUNTIME_CONFIG: MemoryRuntimeConfig = {
  storeEngine: DEFAULT_MEMORY_STORE_ENGINE,
  storeRoot: DEFAULT_MEMORY_STORE_ROOT,
};
