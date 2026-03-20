/**
 * Defines sqlite+fs provider initialization options.
 */
export interface SqliteFsMemoryStoreProviderOptions {
  rootDirectory: string;
  databaseFileName?: string;
  snapshotsDirectoryName?: string;
}
