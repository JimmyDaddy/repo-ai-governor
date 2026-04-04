/**
 * Defines supported `upgrade` command actions.
 */
export enum CliUpgradeAction {
  PREVIEW = 'preview',
  APPLY = 'apply',
  ROLLBACK = 'rollback',
}

/**
 * Defines supported explicit confirmation decisions for controlled upgrade apply.
 */
export enum CliUpgradeConfirmationDecision {
  APPROVE = 'approve',
  REJECT = 'reject',
}

/**
 * Defines preview-time apply readiness states surfaced to users and artifacts.
 */
export enum CliUpgradeApplyReadiness {
  READY = 'ready',
  NEEDS_CONFIRMATION = 'needs_confirmation',
  BLOCKED = 'blocked',
}

/**
 * Defines apply-result lifecycle states for controlled upgrade execution.
 */
export enum CliUpgradeApplyStatus {
  APPLIED = 'applied',
  REJECTED = 'rejected',
  VERIFY_FAILED = 'verify_failed',
}

/**
 * Defines verify-receipt result states written after upgrade apply/rollback verification.
 */
export enum CliUpgradeVerifyStatus {
  PASSED = 'passed',
  FAILED = 'failed',
}

/**
 * Defines rollback receipt states for controlled upgrade recovery.
 */
export enum CliUpgradeRollbackStatus {
  ROLLED_BACK = 'rolled_back',
}

/**
 * Defines rollback source types accepted by the upgrade rollback command.
 */
export enum CliUpgradeRollbackSourceType {
  APPLY_RECEIPT = 'apply_receipt',
  ROLLBACK_SNAPSHOT = 'rollback_snapshot',
}

/**
 * Defines stable artifact ids emitted by the upgrade command family.
 */
export enum CliUpgradeArtifactId {
  REPORT = 'upgrade_report',
  AUTO_MIGRATED_CONFIG = 'upgrade_auto_migrated_config',
  ROLLBACK_SNAPSHOT = 'upgrade_rollback_snapshot',
  APPLY_RECEIPT = 'upgrade_apply_receipt',
  VERIFY_RECEIPT = 'upgrade_verify_receipt',
  ROLLBACK_RECEIPT = 'upgrade_rollback_receipt',
}

/**
 * Defines reusable action validation set.
 */
export const CLI_UPGRADE_ACTION_VALUES = new Set<string>(Object.values(CliUpgradeAction));

/**
 * Defines reusable confirmation-decision validation set.
 */
export const CLI_UPGRADE_CONFIRMATION_DECISION_VALUES = new Set<string>(
  Object.values(CliUpgradeConfirmationDecision),
);

/**
 * Defines the preferred help/validation order for upgrade actions.
 */
export const CLI_UPGRADE_ACTION_ORDER = [
  CliUpgradeAction.PREVIEW,
  CliUpgradeAction.APPLY,
  CliUpgradeAction.ROLLBACK,
] as const;
