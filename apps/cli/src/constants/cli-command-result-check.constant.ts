/**
 * Defines stable command-result check identifiers shared by command executors and presenters.
 *
 * Why this exists:
 * one enum source prevents presenter/command drift when human-readable check handling expands.
 */
export enum CliCommandResultCheckId {
  ADAPTER_VERIFICATION = "adapter_verification",
  UPGRADE_SCHEMA_DIFF = "upgrade_schema_diff",
  MIGRATION_SUGGESTIONS = "migration_suggestions",
  CONFIRMATION_ITEMS = "confirmation_items",
  ROLLBACK_REFERENCE = "rollback_reference",
  WORKSPACE_ACTION = "workspace_action",
  WORKSPACE_TARGET = "workspace_target",
  WORKSPACE_SCRATCH_CLEANUP = "workspace_scratch_cleanup",
}

/**
 * Defines the stable prefix used by per-tool adapter probe checks.
 */
export const CLI_ADAPTER_TOOL_CHECK_ID_PREFIX = "adapter_tool_" as const;

/**
 * Defines success-path checks that should always remain visible in pretty output.
 */
export const CLI_PRETTY_KEY_CHECK_IDS = new Set<string>([
  CliCommandResultCheckId.WORKSPACE_ACTION,
  CliCommandResultCheckId.WORKSPACE_TARGET,
  CliCommandResultCheckId.ROLLBACK_REFERENCE,
]);

/**
 * Defines workspace-action detail fields used by human-readable rendering.
 */
export enum CliWorkspaceActionDetailField {
  ACTION = "action",
}

/**
 * Defines upgrade schema-diff detail fields used by human-readable rendering.
 */
export enum CliUpgradeSchemaDiffDetailField {
  DIFFS = "diffs",
  SOURCE = "source",
  TARGET = "target",
}

/**
 * Defines migration-suggestion detail fields used by human-readable rendering.
 */
export enum CliMigrationSuggestionDetailField {
  COUNT = "count",
}

/**
 * Defines confirmation-item detail fields used by human-readable rendering.
 */
export enum CliConfirmationItemsDetailField {
  DECISION = "decision",
  COUNT = "count",
  BLOCKING = "blocking",
}

/**
 * Defines workspace-target detail fields used by machine/human-readable rendering.
 */
export enum CliWorkspaceTargetDetailField {
  MODE = "mode",
  ROOT = "root",
}

/**
 * Defines finite scratch-cleanup result states encoded into workspace artifacts.
 */
export enum CliWorkspaceScratchCleanupStatus {
  REMOVED = "removed",
  RETAINED = "retained",
}

/**
 * Defines workspace scratch-cleanup detail fields used by machine/human-readable rendering.
 */
export enum CliWorkspaceScratchCleanupDetailField {
  ROOT_REMOVED = "scratch_root_removed",
  ROOT_RETAINED = "scratch_root_retained",
}
