import type {
  SlotConflictStrategy,
  SlotPermissionCapability,
  SlotRequiredAction,
  SlotScope,
  SlotSecurityCheckId,
  SlotSource,
  SlotTrack,
  SlotValidationSeverity,
} from '../../constants/index.js';

/**
 * Defines one reusable slot metadata block.
 */
export interface SlotMetadata {
  title: string;
  description: string;
  tags: string[];
}

/**
 * Defines one slot trigger selector.
 */
export interface SlotTriggerCondition {
  stageIds?: string[];
  routeKeys?: string[];
  changedPathPatterns?: string[];
}

/**
 * Defines one slot applicability selector.
 */
export interface SlotApplicability {
  pathPrefixes?: string[];
}

/**
 * Defines common slot fields shared by declarative and script tracks.
 */
export interface SlotDefinitionBase {
  slotId: string;
  slotVersion: string;
  track: SlotTrack;
  source: SlotSource;
  scope: SlotScope;
  priority: number;
  enabled: boolean;
  blockOnFailure: boolean;
  metadata: SlotMetadata;
  trigger: SlotTriggerCondition;
  applicability: SlotApplicability;
  promptInjections: string[];
  preChecks: string[];
  postChecks: string[];
  dependencySlotIds: string[];
  conflictKey?: string;
}

/**
 * Defines declarative slot rule payload.
 */
export interface DeclarativeSlotRule {
  ruleKey: string;
  parameters: Record<string, unknown>;
}

/**
 * Defines one declarative slot definition.
 */
export interface DeclarativeSlotDefinition extends SlotDefinitionBase {
  track: SlotTrack.DECLARATIVE;
  declarativeRule: DeclarativeSlotRule;
}

/**
 * Defines script identity fields required for audit replay.
 */
export interface SlotScriptIdentity {
  slotScriptId: string;
  slotScriptVersion: string;
  slotScriptHash: string;
  entryCommand: string;
}

/**
 * Defines script sandbox policy.
 */
export interface SlotSandboxPolicy {
  enabled: boolean;
  profile: string;
}

/**
 * Defines script resource limits.
 */
export interface SlotResourceLimits {
  maxCpu: number;
  maxMemoryMb: number;
  maxExecutionTimeSeconds: number;
  maxOutputBytes: number;
}

/**
 * Defines script I/O contract.
 */
export interface SlotIoContract {
  inputSchema: string;
  outputSchema: string;
  sideEffectManifest: string[];
}

/**
 * Defines script failure isolation policy.
 */
export interface SlotFailureIsolationPolicy {
  isolateOnError: boolean;
  fallbackAction: SlotRequiredAction;
}

/**
 * Defines full script slot security policy.
 */
export interface SlotScriptSecurityPolicy {
  requestedPermissions: SlotPermissionCapability[];
  sandbox: SlotSandboxPolicy;
  resourceLimits: SlotResourceLimits;
  ioContract: SlotIoContract;
  failureIsolation: SlotFailureIsolationPolicy;
}

/**
 * Defines one script slot definition.
 */
export interface ScriptSlotDefinition extends SlotDefinitionBase {
  track: SlotTrack.SCRIPT;
  script: SlotScriptIdentity;
  scriptPolicy: SlotScriptSecurityPolicy;
}

/**
 * Defines runtime context used during slot resolution.
 */
export interface SlotResolutionContext {
  executionId: string;
  stageId: string;
  routeKey: string;
  changedPaths?: string[];
  approvedPermissions?: SlotPermissionCapability[];
}

/**
 * Defines optional slot resolve controls.
 */
export interface SlotResolveOptions {
  conflictStrategy?: SlotConflictStrategy;
  includeDisabled?: boolean;
}

/**
 * Defines one resolved slot row in execution plan.
 */
export interface ResolvedSlot<TSlot extends SlotDefinitionBase = SlotDefinitionBase> {
  slot: TSlot;
  matchedReason: string;
}

/**
 * Defines one detected slot conflict row.
 */
export interface SlotConflict {
  conflictKey: string;
  participantSlotIds: string[];
  strategy: SlotConflictStrategy;
  winningSlotId?: string;
}

/**
 * Defines one script security issue row.
 */
export interface SlotSecurityIssue {
  checkId: SlotSecurityCheckId;
  severity: SlotValidationSeverity;
  message: string;
  recommendedAction: SlotRequiredAction;
}

/**
 * Defines minimum script audit fields required by security baseline.
 */
export interface SlotScriptAuditRecord {
  slotScriptId: string;
  slotScriptVersion: string;
  slotScriptHash: string;
  requestedPermissions: SlotPermissionCapability[];
  grantedPermissions: SlotPermissionCapability[];
  exitCode: number | null;
  sandboxProfile: string;
  maxExecutionTimeSeconds: number;
  maxMemoryMb: number;
  maxCpu: number;
  maxOutputBytes: number;
}

/**
 * Defines script security evaluation output.
 */
export interface SlotSecurityEvaluation {
  slotId: string;
  requiredAction: SlotRequiredAction;
  issues: SlotSecurityIssue[];
  auditRecord: SlotScriptAuditRecord;
}

/**
 * Defines one resolved script slot row with security summary.
 */
export interface ResolvedScriptSlot extends ResolvedSlot<ScriptSlotDefinition> {
  security: SlotSecurityEvaluation;
}

/**
 * Defines final slot execution plan payload.
 */
export interface SlotExecutionPlan {
  context: SlotResolutionContext;
  declarativeSlots: ResolvedSlot<DeclarativeSlotDefinition>[];
  scriptSlots: ResolvedScriptSlot[];
  conflicts: SlotConflict[];
  requiredAction: SlotRequiredAction;
  shouldBlock: boolean;
}

/**
 * Defines slot-engine initialization options.
 */
export interface SlotEngineOptions {
  slots?: Array<DeclarativeSlotDefinition | ScriptSlotDefinition>;
  conflictStrategy?: SlotConflictStrategy;
}
