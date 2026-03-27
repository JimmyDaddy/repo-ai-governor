/**
 * Defines migration policy identifiers for workspace upgrade flows.
 *
 * Why this exists:
 * upgrade planning and config validation must share one canonical policy id
 * to avoid string drift across packages.
 */
export enum WorkspaceMigrationPolicy {
  COPY_VERIFY_SWITCH_ROLLBACK = 'copy_verify_switch_rollback',
}
