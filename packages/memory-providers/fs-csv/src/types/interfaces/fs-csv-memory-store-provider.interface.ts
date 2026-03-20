/**
 * Defines fs-csv provider initialization options.
 */
export interface FsCsvMemoryStoreProviderOptions {
  rootDirectory: string;
  recordsFileName?: string;
  snapshotsFileName?: string;
  archiveFileName?: string;
  snapshotsDirectoryName?: string;
}
