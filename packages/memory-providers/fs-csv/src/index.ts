import { FsCsvMemoryStoreProvider } from './fs-csv-memory-store-provider.js';

export { FsCsvMemoryStoreProvider } from './fs-csv-memory-store-provider.js';
export type { FsCsvMemoryStoreProviderOptions } from './types/index.js';

/**
 * Creates one fs-csv memory provider instance through the plugin factory contract.
 * @param context Plugin load context.
 * @returns Provider instance.
 */
export async function createMemoryStoreProvider(context: {
  memoryStoreRoot: string;
}): Promise<FsCsvMemoryStoreProvider> {
  return new FsCsvMemoryStoreProvider({
    rootDirectory: context.memoryStoreRoot,
  });
}
