/**
 * Defines supported `plan` command actions.
 */
export enum CliPlanAction {
  PREVIEW = 'preview',
  COMMIT = 'commit',
}

/**
 * Defines explicit confirmation decisions for controlled plan commits.
 */
export enum CliPlanConfirmationDecision {
  APPROVE = 'approve',
  REJECT = 'reject',
}

/**
 * Defines preview-time commit readiness states surfaced to users and artifacts.
 */
export enum CliPlanCommitReadiness {
  READY = 'ready',
  NEEDS_USER_INPUT = 'needs_user_input',
  PREVIEW_ONLY = 'preview_only',
}

/**
 * Defines plan-commit receipt lifecycle states.
 */
export enum CliPlanCommitStatus {
  COMMITTED = 'committed',
  CANCELLED = 'cancelled',
}

/**
 * Defines plan-preview task projection actions.
 */
export enum CliPlanTaskProjectionAction {
  CREATE = 'create',
  RETAIN_EXISTING = 'retain_existing',
}

/**
 * Defines the seeded task status used for newly generated task cards.
 */
export enum CliPlanTaskStatusSeed {
  PLANNED = 'planned',
}

/**
 * Defines previewed ledger projection actions rendered in plan artifacts.
 */
export enum CliPlanLedgerProjectionMode {
  UPDATE = 'update',
  APPEND = 'append',
  CREATE = 'create',
}

/**
 * Defines stable artifact ids emitted by the `plan` command family.
 */
export enum CliPlanArtifactId {
  PREVIEW = 'plan_preview',
  COMMIT_RECEIPT = 'plan_commit_receipt',
}

/**
 * Defines reusable action validation set.
 */
export const CLI_PLAN_ACTION_VALUES = new Set<string>(Object.values(CliPlanAction));

/**
 * Defines reusable confirmation-decision validation set.
 */
export const CLI_PLAN_CONFIRMATION_DECISION_VALUES = new Set<string>(
  Object.values(CliPlanConfirmationDecision),
);

/**
 * Defines the preferred help/validation order for `plan` actions.
 */
export const CLI_PLAN_ACTION_ORDER = [CliPlanAction.PREVIEW, CliPlanAction.COMMIT] as const;
