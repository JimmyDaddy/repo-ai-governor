/**
 * Defines normalized risk levels consumed by policy gate and audit trails.
 */
export enum ChangeRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Defines required action hints for downstream policy routing.
 */
export enum ChangeRiskRequiredAction {
  ALLOW = 'allow',
  CONFIRM = 'confirm',
  ESCALATE = 'escalate',
  BLOCK = 'block',
}

/**
 * Defines standardized risk reason codes produced by evaluator.
 */
export enum ChangeRiskReasonCode {
  LOCKFILE_DELTA = 'lockfile_delta',
  MIGRATION_DETECTED = 'migration_detected',
  CI_WORKFLOW_CHANGED = 'ci_workflow_changed',
  RELEASE_SCRIPT_CHANGED = 'release_script_changed',
  SENSITIVE_PATH_CHANGED = 'sensitive_path_changed',
  HIGH_RISK_FILE_CATEGORY = 'high_risk_file_category',
  HIGH_RISK_PERMISSION = 'high_risk_permission',
  HIGH_RISK_COMMAND_CLASS = 'high_risk_command_class',
}

/**
 * Defines baseline file-category tags for change classification.
 */
export enum ChangeRiskFileCategory {
  CODE = 'code',
  MIGRATION = 'migration',
  CI_WORKFLOW = 'ci_workflow',
  RELEASE = 'release',
  INFRA = 'infra',
  SECRET = 'secret',
}

/**
 * Defines score thresholds for risk-level derivation.
 */
export const CHANGE_RISK_SCORE_THRESHOLDS = {
  LOW_MAX: 1,
  MEDIUM_MAX: 4,
  HIGH_MAX: 7,
} as const;

/**
 * Lists path segments considered sensitive by baseline policy.
 */
export const DEFAULT_SENSITIVE_PATH_SEGMENTS = [
  '.github/workflows/',
  'infra/',
  'infrastructure/',
  'deploy/',
  'scripts/release',
  'secrets/',
] as const;

/**
 * Lists file categories that should immediately increase risk.
 */
export const DEFAULT_HIGH_RISK_FILE_CATEGORIES = [
  ChangeRiskFileCategory.MIGRATION,
  ChangeRiskFileCategory.CI_WORKFLOW,
  ChangeRiskFileCategory.RELEASE,
  ChangeRiskFileCategory.INFRA,
  ChangeRiskFileCategory.SECRET,
] as const;

/**
 * Lists command classes mapped to high-risk execution intent.
 */
export const DEFAULT_HIGH_RISK_COMMAND_CLASSES = [
  'deployment',
  'database_migration',
  'infra_change',
] as const;

/**
 * Lists permission prefixes considered sensitive by default.
 */
export const DEFAULT_HIGH_RISK_PERMISSION_PREFIXES = [
  'filesystem.write',
  'network.external',
  'shell.execute',
  'secrets.',
] as const;
