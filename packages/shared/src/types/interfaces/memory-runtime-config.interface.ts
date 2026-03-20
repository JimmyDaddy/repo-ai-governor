import type { MemoryStoreEngine } from "../../constants/memory-store.constant.js";

/**
 * Defines runtime memory-store selection and root placement contract.
 */
export interface MemoryRuntimeConfig {
  storeEngine: MemoryStoreEngine;
  storeRoot: string;
}
