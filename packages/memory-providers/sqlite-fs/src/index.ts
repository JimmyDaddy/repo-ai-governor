import { SqliteFsMemoryStoreProvider } from './sqlite-fs-memory-store-provider.js';

export { SqliteFsMemoryStoreProvider } from './sqlite-fs-memory-store-provider.js';
export type { SqliteFsMemoryStoreProviderOptions } from './types/index.js';

/**
 * Creates one sqlite-fs memory provider instance through the plugin factory contract.
 * @param context Plugin load context.
 * @returns Provider instance.
 */
export async function createMemoryStoreProvider(context: {
  memoryStoreRoot: string;
}): Promise<SqliteFsMemoryStoreProvider> {
  return new SqliteFsMemoryStoreProvider({
    rootDirectory: context.memoryStoreRoot,
  });
}
