/**
 * Defines stable command-result check identifiers shared by command executors and presenters.
 *
 * Why this exists:
 * one enum source prevents presenter/command drift when human-readable check handling expands.
 */
export enum CliCommandResultCheckId {
  ADAPTER_VERIFICATION = 'adapter_verification',
  PLAN_TASK_PACKAGE = 'plan_task_package',
  PLAN_COMMIT_READINESS = 'plan_commit_readiness',
  PLAN_LEDGER_PROJECTION = 'plan_ledger_projection',
  PLAN_COMMIT_RECEIPT = 'plan_commit_receipt',
  UPGRADE_SCHEMA_DIFF = 'upgrade_schema_diff',
  MIGRATION_SUGGESTIONS = 'migration_suggestions',
  CONFIRMATION_ITEMS = 'confirmation_items',
  UPGRADE_APPLY_READINESS = 'upgrade_apply_readiness',
  UPGRADE_APPLY_RECEIPT = 'upgrade_apply_receipt',
  UPGRADE_VERIFY_RECEIPT = 'upgrade_verify_receipt',
  UPGRADE_ROLLBACK_RECEIPT = 'upgrade_rollback_receipt',
  ROLLBACK_REFERENCE = 'rollback_reference',
  WORKSPACE_ACTION = 'workspace_action',
  WORKSPACE_TARGET = 'workspace_target',
  WORKSPACE_SCRATCH_CLEANUP = 'workspace_scratch_cleanup',
  WORKFLOW_TEMPLATE = 'workflow_template',
  WORKFLOW_PREVIEW_MODE = 'workflow_preview_mode',
  WORKFLOW_COMPILE_STATUS = 'workflow_compile_status',
}

/**
 * Defines the stable prefix used by per-tool adapter probe checks.
 */
export const CLI_ADAPTER_TOOL_CHECK_ID_PREFIX = 'adapter_tool_' as const;

/**
 * Defines success-path checks that should always remain visible in pretty output.
 */
export const CLI_PRETTY_KEY_CHECK_IDS = new Set<string>([
  CliCommandResultCheckId.PLAN_TASK_PACKAGE,
  CliCommandResultCheckId.PLAN_COMMIT_READINESS,
  CliCommandResultCheckId.PLAN_LEDGER_PROJECTION,
  CliCommandResultCheckId.PLAN_COMMIT_RECEIPT,
  CliCommandResultCheckId.UPGRADE_APPLY_READINESS,
  CliCommandResultCheckId.UPGRADE_APPLY_RECEIPT,
  CliCommandResultCheckId.UPGRADE_VERIFY_RECEIPT,
  CliCommandResultCheckId.UPGRADE_ROLLBACK_RECEIPT,
  CliCommandResultCheckId.WORKSPACE_ACTION,
  CliCommandResultCheckId.WORKSPACE_TARGET,
  CliCommandResultCheckId.ROLLBACK_REFERENCE,
  CliCommandResultCheckId.WORKFLOW_TEMPLATE,
  CliCommandResultCheckId.WORKFLOW_PREVIEW_MODE,
  CliCommandResultCheckId.WORKFLOW_COMPILE_STATUS,
]);

/**
 * Defines workspace-action detail fields used by human-readable rendering.
 */
export enum CliWorkspaceActionDetailField {
  ACTION = 'action',
}

/**
 * Defines plan task-package detail fields used by machine/human-readable rendering.
 */
export enum CliPlanTaskPackageDetailField {
  TOTAL = 'total',
  CREATE = 'create',
  RETAIN = 'retain',
}

/**
 * Defines plan commit-readiness detail fields used by machine/human-readable rendering.
 */
export enum CliPlanCommitReadinessDetailField {
  READINESS = 'readiness',
  MISSING = 'missing',
}

/**
 * Defines plan ledger-projection detail fields used by machine/human-readable rendering.
 */
export enum CliPlanLedgerProjectionDetailField {
  PLAN_MD = 'plan_md',
  CHECKLIST_MD = 'checklist_md',
  TASKS_CSV = 'tasks_csv',
  TK_FILES = 'tk_files',
}

/**
 * Defines plan receipt detail fields used by machine/human-readable rendering.
 */
export enum CliPlanReceiptDetailField {
  STATUS = 'status',
  CREATED = 'created',
  RETAINED = 'retained',
  PATH = 'path',
}

/**
 * Defines upgrade schema-diff detail fields used by human-readable rendering.
 */
export enum CliUpgradeSchemaDiffDetailField {
  DIFFS = 'diffs',
  SOURCE = 'source',
  TARGET = 'target',
}

/**
 * Defines migration-suggestion detail fields used by human-readable rendering.
 */
export enum CliMigrationSuggestionDetailField {
  COUNT = 'count',
}

/**
 * Defines confirmation-item detail fields used by human-readable rendering.
 */
export enum CliConfirmationItemsDetailField {
  DECISION = 'decision',
  COUNT = 'count',
  BLOCKING = 'blocking',
}

/**
 * Defines upgrade apply-readiness detail fields used by machine/human-readable rendering.
 */
export enum CliUpgradeApplyReadinessDetailField {
  READINESS = 'readiness',
  DECISION = 'decision',
  COUNT = 'count',
  BLOCKING = 'blocking',
}

/**
 * Defines upgrade receipt detail fields used by machine/human-readable rendering.
 */
export enum CliUpgradeReceiptDetailField {
  STATUS = 'status',
  PATH = 'path',
}

/**
 * Defines workspace-target detail fields used by machine/human-readable rendering.
 */
export enum CliWorkspaceTargetDetailField {
  MODE = 'mode',
  ROOT = 'root',
}

/**
 * Defines finite scratch-cleanup result states encoded into workspace artifacts.
 */
export enum CliWorkspaceScratchCleanupStatus {
  REMOVED = 'removed',
  RETAINED = 'retained',
}

/**
 * Defines workspace scratch-cleanup detail fields used by machine/human-readable rendering.
 */
export enum CliWorkspaceScratchCleanupDetailField {
  ROOT_REMOVED = 'scratch_root_removed',
  ROOT_RETAINED = 'scratch_root_retained',
}

/**
 * Defines workflow-template detail fields used by machine/human-readable rendering.
 */
export enum CliWorkflowTemplateDetailField {
  TEMPLATE = 'template',
}

/**
 * Defines workflow preview-mode detail fields used by machine/human-readable rendering.
 */
export enum CliWorkflowPreviewModeDetailField {
  MODE = 'mode',
}

/**
 * Defines workflow compile-status detail fields used by machine/human-readable rendering.
 */
export enum CliWorkflowCompileStatusDetailField {
  STATUS = 'status',
  WARNINGS = 'warnings',
  ERRORS = 'errors',
}
