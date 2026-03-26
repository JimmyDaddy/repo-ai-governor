/**
 * Defines the module-loader seam used by the registry for lazy provider imports.
 */
export type MemoryProviderModuleLoader = (specifier: string) => Promise<Record<string, unknown>>;
