/**
 * Defines slot execution tracks.
 */
export enum SlotTrack {
  DECLARATIVE = 'declarative',
  SCRIPT = 'script',
}

/**
 * Defines slot source domains.
 */
export enum SlotSource {
  OFFICIAL = 'official',
  TEAM = 'team',
  REPOSITORY = 'repository',
}

/**
 * Defines slot scope boundaries.
 */
export enum SlotScope {
  GLOBAL = 'global',
  REPOSITORY = 'repository',
  DIRECTORY = 'directory',
  STAGE = 'stage',
}

/**
 * Defines slot conflict resolution strategies.
 */
export enum SlotConflictStrategy {
  ERROR = 'error',
  HIGHEST_PRIORITY = 'highest_priority',
  LAST_WRITE_WINS = 'last_write_wins',
}

/**
 * Defines slot permission capabilities for script slots.
 */
export enum SlotPermissionCapability {
  FILESYSTEM = 'filesystem',
  NETWORK = 'network',
  COMMAND = 'command',
  ENV = 'env',
}

/**
 * Defines slot safety actions consumed by downstream policy routing.
 */
export enum SlotRequiredAction {
  ALLOW = 'allow',
  CONFIRM = 'confirm',
  ESCALATE = 'escalate',
  BLOCK = 'block',
}

/**
 * Defines slot security issue severity levels.
 */
export enum SlotValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
}

/**
 * Defines security checklist identifiers for script slot baseline.
 */
export enum SlotSecurityCheckId {
  SANDBOX_REQUIRED = 'sandbox_required',
  PERMISSION_APPROVAL_REQUIRED = 'permission_approval_required',
  RESOURCE_LIMITS_REQUIRED = 'resource_limits_required',
  IO_CONTRACT_REQUIRED = 'io_contract_required',
  SIDE_EFFECT_MANIFEST_REQUIRED = 'side_effect_manifest_required',
  FAILURE_ISOLATION_REQUIRED = 'failure_isolation_required',
}

/**
 * Defines fallback resource limits used by plan rendering.
 */
export const DEFAULT_SLOT_RESOURCE_LIMITS = Object.freeze({
  maxCpu: 1,
  maxMemoryMb: 256,
  maxExecutionTimeSeconds: 60,
  maxOutputBytes: 65536,
});

/**
 * Defines deterministic action severity for aggregate plan decisions.
 */
export const SLOT_ACTION_SEVERITY: Record<SlotRequiredAction, number> = {
  [SlotRequiredAction.ALLOW]: 1,
  [SlotRequiredAction.CONFIRM]: 2,
  [SlotRequiredAction.ESCALATE]: 3,
  [SlotRequiredAction.BLOCK]: 4,
};

/**
 * Defines runtime validation set for script permission values.
 */
export const SLOT_PERMISSION_VALUES = new Set<string>(Object.values(SlotPermissionCapability));
