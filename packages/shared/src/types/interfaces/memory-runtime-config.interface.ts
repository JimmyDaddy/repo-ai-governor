import type { MemoryStoreEngine } from '../../constants/memory-store.constant.js';

/**
 * Defines optional provider override fields shared by built-in and pluginized memory resolution.
 */
export interface MemoryProviderRuntimeConfig {
  id?: string;
  module?: string;
  exportName?: string;
  options?: Record<string, unknown>;
}

/**
 * Defines runtime memory-store selection and root placement contract.
 */
export interface MemoryRuntimeConfig {
  storeEngine: MemoryStoreEngine;
  storeRoot: string;
  provider?: MemoryProviderRuntimeConfig;
}
