/**
 * Defines explicit connect workflow actions exposed by the CLI surface.
 */
export enum CliConnectAction {
  GENERATE = 'generate',
  DIFF = 'diff',
  APPLY = 'apply',
}

/**
 * Defines deterministic write modes used by connect candidate/apply artifacts.
 */
export enum CliConnectWriteMode {
  MERGE = 'merge',
  OVERWRITE = 'overwrite',
}

/**
 * Defines supported connect workflow actions as a reusable validation set.
 */
export const CLI_CONNECT_ACTION_VALUES = new Set<string>(Object.values(CliConnectAction));

/**
 * Defines supported connect write modes as a reusable validation set.
 */
export const CLI_CONNECT_WRITE_MODE_VALUES = new Set<string>(Object.values(CliConnectWriteMode));
