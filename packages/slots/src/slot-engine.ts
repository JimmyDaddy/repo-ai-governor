import { GovernorErrorCode, RuntimeError } from "../../shared/src/index.js";
import {
  SLOT_ACTION_SEVERITY,
  SLOT_PERMISSION_VALUES,
  SlotConflictStrategy,
  type SlotPermissionCapability,
  SlotRequiredAction,
  SlotSecurityCheckId,
  SlotTrack,
  SlotValidationSeverity,
} from "./constants/index.js";
import type {
  DeclarativeSlotDefinition,
  ResolvedScriptSlot,
  ResolvedSlot,
  ScriptSlotDefinition,
  SlotConflict,
  SlotDefinition,
  SlotEngineOptions,
  SlotExecutionPlan,
  SlotResolutionContext,
  SlotResolveOptions,
  SlotSecurityEvaluation,
  SlotSecurityIssue,
} from "./types/index.js";

interface IndexedSlotDefinition {
  slot: SlotDefinition;
  registrationIndex: number;
}

interface MatchedSlotRow {
  indexedSlot: IndexedSlotDefinition;
  matchedReason: string;
}

interface ConflictResolutionResult {
  winnerRows: MatchedSlotRow[];
  conflicts: SlotConflict[];
}

const SLOT_REQUIRED_ACTION_VALUES = new Set<string>(Object.values(SlotRequiredAction));
const SLOT_CONFLICT_STRATEGY_VALUES = new Set<string>(Object.values(SlotConflictStrategy));

/**
 * Resolves declarative/script slots into one executable plan with security checks.
 *
 * Why this exists:
 * slot governance decisions should be deterministic so runtime/policy/audit layers
 * consume one consistent contract for dual-track slot execution.
 */
export class SlotEngine {
  private readonly indexedSlotById = new Map<string, IndexedSlotDefinition>();
  private registrationSequence = 0;
  private readonly defaultConflictStrategy: SlotConflictStrategy;

  public constructor(options: SlotEngineOptions = {}) {
    this.defaultConflictStrategy =
      options.conflictStrategy ?? SlotConflictStrategy.HIGHEST_PRIORITY;
    this.assertConflictStrategyOrThrow(this.defaultConflictStrategy);

    if (options.slots) {
      this.registerSlots(options.slots);
    }
  }

  /**
   * Registers slot definitions into the in-memory registry.
   * @param slotDefinitions Incoming slot definitions.
   * @returns Nothing.
   */
  public registerSlots(slotDefinitions: SlotDefinition[]): void {
    for (const slotDefinition of slotDefinitions) {
      this.assertSlotDefinitionOrThrow(slotDefinition);
      if (this.indexedSlotById.has(slotDefinition.slotId)) {
        throw new RuntimeError(
          GovernorErrorCode.SLOT_DEFINITION_INVALID,
          `Duplicate slotId "${slotDefinition.slotId}" is not allowed.`,
          {
            slotId: slotDefinition.slotId,
          },
        );
      }

      this.registrationSequence += 1;
      this.indexedSlotById.set(slotDefinition.slotId, {
        slot: slotDefinition,
        registrationIndex: this.registrationSequence,
      });
    }
  }

  /**
   * Lists registered slot definitions with optional disabled filtering.
   * @param options Optional list controls.
   * @returns Ordered slot definitions.
   */
  public listSlots(options: { includeDisabled?: boolean } = {}): SlotDefinition[] {
    const includeDisabled = options.includeDisabled ?? false;

    return this.readIndexedSlotsInRegistrationOrder()
      .map((indexedSlot) => indexedSlot.slot)
      .filter((slotDefinition) => includeDisabled || slotDefinition.enabled);
  }

  /**
   * Builds one execution plan for a runtime context.
   * @param context Runtime stage context.
   * @param options Optional resolve controls.
   * @returns Structured plan with conflict and security outcomes.
   */
  public buildExecutionPlan(
    context: SlotResolutionContext,
    options: SlotResolveOptions = {},
  ): SlotExecutionPlan {
    const normalizedContext = this.normalizeResolutionContext(context);
    const includeDisabled = options.includeDisabled ?? false;
    const conflictStrategy = options.conflictStrategy ?? this.defaultConflictStrategy;
    this.assertConflictStrategyOrThrow(conflictStrategy);

    const matchedRows = this.collectMatchedSlotRows(normalizedContext, includeDisabled);
    const { winnerRows, conflicts } = this.resolveConflicts(matchedRows, conflictStrategy);
    const orderedWinnerRows = this.sortWinnerRows(winnerRows);

    const declarativeSlots: ResolvedSlot<DeclarativeSlotDefinition>[] = [];
    const scriptSlots: ResolvedScriptSlot[] = [];

    for (const winnerRow of orderedWinnerRows) {
      if (winnerRow.indexedSlot.slot.track === SlotTrack.DECLARATIVE) {
        declarativeSlots.push({
          slot: winnerRow.indexedSlot.slot,
          matchedReason: winnerRow.matchedReason,
        });
        continue;
      }

      const security = this.evaluateScriptSlotSecurity(
        winnerRow.indexedSlot.slot,
        normalizedContext,
      );
      scriptSlots.push({
        slot: winnerRow.indexedSlot.slot,
        matchedReason: winnerRow.matchedReason,
        security,
      });
    }

    const requiredAction = this.resolveHighestAction(
      scriptSlots.map((scriptSlot) => scriptSlot.security.requiredAction),
    );

    return {
      context: normalizedContext,
      declarativeSlots,
      scriptSlots,
      conflicts,
      requiredAction,
      shouldBlock: requiredAction === SlotRequiredAction.BLOCK,
    };
  }

  /**
   * Evaluates script-slot security contract and emits audit-ready result.
   * @param slotDefinition Script slot definition.
   * @param context Runtime stage context.
   * @returns Security evaluation with required action and audit fields.
   */
  public evaluateScriptSlotSecurity(
    slotDefinition: ScriptSlotDefinition,
    context: SlotResolutionContext,
  ): SlotSecurityEvaluation {
    if (slotDefinition.track !== SlotTrack.SCRIPT) {
      throw new RuntimeError(
        GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
        "Script security evaluation only accepts script slot definitions.",
        {
          slotId: slotDefinition.slotId,
          track: slotDefinition.track,
        },
      );
    }

    const requestedPermissions = this.readPermissionListOrThrow(
      slotDefinition.scriptPolicy.requestedPermissions,
      "scriptPolicy.requestedPermissions",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    const approvedPermissionSet = new Set(context.approvedPermissions ?? []);
    const grantedPermissions = requestedPermissions.filter((permission) =>
      approvedPermissionSet.has(permission),
    );

    const issues: SlotSecurityIssue[] = [];
    if (!slotDefinition.scriptPolicy.sandbox.enabled) {
      issues.push({
        checkId: SlotSecurityCheckId.SANDBOX_REQUIRED,
        severity: SlotValidationSeverity.ERROR,
        message: "Script slot must run in sandbox mode.",
        recommendedAction: SlotRequiredAction.BLOCK,
      });
    }

    const unapprovedPermissions = requestedPermissions.filter(
      (permission) => !approvedPermissionSet.has(permission),
    );
    if (unapprovedPermissions.length > 0) {
      issues.push({
        checkId: SlotSecurityCheckId.PERMISSION_APPROVAL_REQUIRED,
        severity: SlotValidationSeverity.WARNING,
        message: `Script slot requested unapproved permissions: ${unapprovedPermissions.join(", ")}`,
        recommendedAction: SlotRequiredAction.CONFIRM,
      });
    }

    const resourceLimits = slotDefinition.scriptPolicy.resourceLimits;
    const hasValidResourceLimits =
      Number.isFinite(resourceLimits.maxCpu) &&
      resourceLimits.maxCpu > 0 &&
      Number.isFinite(resourceLimits.maxMemoryMb) &&
      resourceLimits.maxMemoryMb > 0 &&
      Number.isFinite(resourceLimits.maxExecutionTimeSeconds) &&
      resourceLimits.maxExecutionTimeSeconds > 0 &&
      Number.isFinite(resourceLimits.maxOutputBytes) &&
      resourceLimits.maxOutputBytes > 0;
    if (!hasValidResourceLimits) {
      issues.push({
        checkId: SlotSecurityCheckId.RESOURCE_LIMITS_REQUIRED,
        severity: SlotValidationSeverity.ERROR,
        message: "Script slot must declare positive resource limits.",
        recommendedAction: SlotRequiredAction.BLOCK,
      });
    }

    const ioContract = slotDefinition.scriptPolicy.ioContract;
    if (!ioContract.inputSchema || !ioContract.outputSchema) {
      issues.push({
        checkId: SlotSecurityCheckId.IO_CONTRACT_REQUIRED,
        severity: SlotValidationSeverity.ERROR,
        message: "Script slot must declare non-empty input/output schema references.",
        recommendedAction: SlotRequiredAction.BLOCK,
      });
    }

    if (ioContract.sideEffectManifest.length === 0) {
      issues.push({
        checkId: SlotSecurityCheckId.SIDE_EFFECT_MANIFEST_REQUIRED,
        severity: SlotValidationSeverity.ERROR,
        message: "Script slot must declare at least one side effect entry.",
        recommendedAction: SlotRequiredAction.BLOCK,
      });
    }

    const failureIsolation = slotDefinition.scriptPolicy.failureIsolation;
    if (!failureIsolation.isolateOnError) {
      issues.push({
        checkId: SlotSecurityCheckId.FAILURE_ISOLATION_REQUIRED,
        severity: SlotValidationSeverity.ERROR,
        message: "Script slot must isolate failures from the main execution flow.",
        recommendedAction: SlotRequiredAction.BLOCK,
      });
    }

    if (failureIsolation.fallbackAction === SlotRequiredAction.ALLOW) {
      issues.push({
        checkId: SlotSecurityCheckId.FAILURE_ISOLATION_REQUIRED,
        severity: SlotValidationSeverity.WARNING,
        message:
          "Failure isolation fallback action should require manual intervention instead of allow.",
        recommendedAction: SlotRequiredAction.ESCALATE,
      });
    }

    return {
      slotId: slotDefinition.slotId,
      requiredAction: this.resolveHighestAction(issues.map((issue) => issue.recommendedAction)),
      issues,
      auditRecord: {
        slotScriptId: slotDefinition.script.slotScriptId,
        slotScriptVersion: slotDefinition.script.slotScriptVersion,
        slotScriptHash: slotDefinition.script.slotScriptHash,
        requestedPermissions,
        grantedPermissions,
        exitCode: null,
        sandboxProfile: slotDefinition.scriptPolicy.sandbox.profile,
        maxExecutionTimeSeconds: slotDefinition.scriptPolicy.resourceLimits.maxExecutionTimeSeconds,
        maxMemoryMb: slotDefinition.scriptPolicy.resourceLimits.maxMemoryMb,
        maxCpu: slotDefinition.scriptPolicy.resourceLimits.maxCpu,
        maxOutputBytes: slotDefinition.scriptPolicy.resourceLimits.maxOutputBytes,
      },
    };
  }

  /**
   * Reads indexed slots in registration order.
   * @returns Indexed slots sorted by registration index.
   */
  private readIndexedSlotsInRegistrationOrder(): IndexedSlotDefinition[] {
    return Array.from(this.indexedSlotById.values()).sort(
      (left, right) => left.registrationIndex - right.registrationIndex,
    );
  }

  /**
   * Collects slots matching one runtime context.
   * @param context Runtime stage context.
   * @param includeDisabled Whether disabled slots should be considered.
   * @returns Matched slot rows with reasons.
   */
  private collectMatchedSlotRows(
    context: SlotResolutionContext,
    includeDisabled: boolean,
  ): MatchedSlotRow[] {
    const matchedRows: MatchedSlotRow[] = [];

    for (const indexedSlot of this.readIndexedSlotsInRegistrationOrder()) {
      if (!includeDisabled && !indexedSlot.slot.enabled) {
        continue;
      }

      const matchedReason = this.matchSlotAgainstContext(indexedSlot.slot, context);
      if (!matchedReason) {
        continue;
      }

      matchedRows.push({
        indexedSlot,
        matchedReason,
      });
    }

    return matchedRows;
  }

  /**
   * Resolves slot conflicts according to strategy.
   * @param matchedRows Candidate slot rows.
   * @param conflictStrategy Conflict strategy.
   * @returns Winners and conflict records.
   */
  private resolveConflicts(
    matchedRows: MatchedSlotRow[],
    conflictStrategy: SlotConflictStrategy,
  ): ConflictResolutionResult {
    const winnerRows: MatchedSlotRow[] = [];
    const conflictRowsByKey = new Map<string, MatchedSlotRow[]>();
    const conflicts: SlotConflict[] = [];

    for (const matchedRow of matchedRows) {
      const conflictKey = matchedRow.indexedSlot.slot.conflictKey;
      if (!conflictKey) {
        winnerRows.push(matchedRow);
        continue;
      }

      const bucket = conflictRowsByKey.get(conflictKey) ?? [];
      bucket.push(matchedRow);
      conflictRowsByKey.set(conflictKey, bucket);
    }

    for (const [conflictKey, conflictRows] of conflictRowsByKey.entries()) {
      if (conflictRows.length === 1) {
        winnerRows.push(conflictRows[0]);
        continue;
      }

      const participantSlotIds = conflictRows
        .map((conflictRow) => conflictRow.indexedSlot.slot.slotId)
        .sort((left, right) => left.localeCompare(right));
      if (conflictStrategy === SlotConflictStrategy.ERROR) {
        throw new RuntimeError(
          GovernorErrorCode.SLOT_CONFLICT_DETECTED,
          `Slot conflict detected for key "${conflictKey}".`,
          {
            conflictKey,
            participantSlotIds,
          },
        );
      }

      const winner = this.selectConflictWinner(conflictRows, conflictStrategy);
      conflicts.push({
        conflictKey,
        participantSlotIds,
        strategy: conflictStrategy,
        winningSlotId: winner.indexedSlot.slot.slotId,
      });
      winnerRows.push(winner);
    }

    return {
      winnerRows,
      conflicts,
    };
  }

  /**
   * Selects one winner from conflicting slots.
   * @param conflictRows Conflicting rows.
   * @param conflictStrategy Conflict strategy.
   * @returns Winner row.
   */
  private selectConflictWinner(
    conflictRows: MatchedSlotRow[],
    conflictStrategy: SlotConflictStrategy,
  ): MatchedSlotRow {
    if (conflictStrategy === SlotConflictStrategy.LAST_WRITE_WINS) {
      return conflictRows.reduce((winner, candidate) =>
        candidate.indexedSlot.registrationIndex > winner.indexedSlot.registrationIndex
          ? candidate
          : winner,
      );
    }

    return conflictRows.reduce((winner, candidate) => {
      if (candidate.indexedSlot.slot.priority > winner.indexedSlot.slot.priority) {
        return candidate;
      }

      if (candidate.indexedSlot.slot.priority < winner.indexedSlot.slot.priority) {
        return winner;
      }

      return candidate.indexedSlot.registrationIndex > winner.indexedSlot.registrationIndex
        ? candidate
        : winner;
    });
  }

  /**
   * Sorts winners for deterministic execution order.
   * @param winnerRows Winner rows.
   * @returns Sorted rows.
   */
  private sortWinnerRows(winnerRows: MatchedSlotRow[]): MatchedSlotRow[] {
    return [...winnerRows].sort((left, right) => {
      if (left.indexedSlot.slot.priority !== right.indexedSlot.slot.priority) {
        return right.indexedSlot.slot.priority - left.indexedSlot.slot.priority;
      }

      if (left.indexedSlot.registrationIndex !== right.indexedSlot.registrationIndex) {
        return left.indexedSlot.registrationIndex - right.indexedSlot.registrationIndex;
      }

      return left.indexedSlot.slot.slotId.localeCompare(right.indexedSlot.slot.slotId);
    });
  }

  /**
   * Matches one slot against runtime context.
   * @param slotDefinition Slot definition.
   * @param context Runtime context.
   * @returns Match reason when matched, otherwise null.
   */
  private matchSlotAgainstContext(
    slotDefinition: SlotDefinition,
    context: SlotResolutionContext,
  ): string | null {
    const reasons: string[] = [];

    const stageIds = slotDefinition.trigger.stageIds ?? [];
    if (stageIds.length > 0) {
      if (!stageIds.includes(context.stageId)) {
        return null;
      }
      reasons.push("stage");
    }

    const routeKeys = slotDefinition.trigger.routeKeys ?? [];
    if (routeKeys.length > 0) {
      if (!routeKeys.includes(context.routeKey)) {
        return null;
      }
      reasons.push("route");
    }

    const changedPathPatterns = slotDefinition.trigger.changedPathPatterns ?? [];
    if (changedPathPatterns.length > 0) {
      const changedPaths = context.changedPaths ?? [];
      const patternMatched = changedPaths.some((changedPath) =>
        changedPathPatterns.some((pattern) => this.matchSimplePattern(changedPath, pattern)),
      );
      if (!patternMatched) {
        return null;
      }
      reasons.push("changed-path");
    }

    const pathPrefixes = slotDefinition.applicability.pathPrefixes ?? [];
    if (pathPrefixes.length > 0) {
      const changedPaths = context.changedPaths ?? [];
      const prefixMatched = changedPaths.some((changedPath) =>
        pathPrefixes.some((pathPrefix) => changedPath.startsWith(pathPrefix)),
      );
      if (!prefixMatched) {
        return null;
      }
      reasons.push("path-prefix");
    }

    if (reasons.length === 0) {
      return "default";
    }

    return reasons.join("+");
  }

  /**
   * Matches one file path against a simplified wildcard pattern.
   * @param value Candidate value.
   * @param pattern Wildcard pattern with optional `*`.
   * @returns True when value matches pattern.
   */
  private matchSimplePattern(value: string, pattern: string): boolean {
    if (pattern === "*") {
      return true;
    }

    if (!pattern.includes("*")) {
      return value === pattern;
    }

    const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escapedPattern}$`, "u").test(value);
  }

  /**
   * Resolves the highest required action by configured severity.
   * @param actions Candidate actions.
   * @returns Highest-severity action.
   */
  private resolveHighestAction(actions: SlotRequiredAction[]): SlotRequiredAction {
    let highestAction = SlotRequiredAction.ALLOW;

    for (const action of actions) {
      if (SLOT_ACTION_SEVERITY[action] > SLOT_ACTION_SEVERITY[highestAction]) {
        highestAction = action;
      }
    }

    return highestAction;
  }

  /**
   * Validates one slot definition structure before registration.
   * @param slotDefinition Slot definition candidate.
   * @returns Nothing.
   */
  private assertSlotDefinitionOrThrow(slotDefinition: SlotDefinition): void {
    this.readRequiredStringOrThrow(
      slotDefinition.slotId,
      "slotId",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readRequiredStringOrThrow(
      slotDefinition.slotVersion,
      "slotVersion",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.assertFiniteNumberOrThrow(
      slotDefinition.priority,
      "priority",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.assertBooleanOrThrow(
      slotDefinition.enabled,
      "enabled",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.assertBooleanOrThrow(
      slotDefinition.blockOnFailure,
      "blockOnFailure",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readRequiredStringOrThrow(
      slotDefinition.metadata.title,
      "metadata.title",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readRequiredStringOrThrow(
      slotDefinition.metadata.description,
      "metadata.description",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readStringListOrThrow(
      slotDefinition.metadata.tags,
      "metadata.tags",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readStringListOrThrow(
      slotDefinition.promptInjections,
      "promptInjections",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readStringListOrThrow(
      slotDefinition.preChecks,
      "preChecks",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readStringListOrThrow(
      slotDefinition.postChecks,
      "postChecks",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readStringListOrThrow(
      slotDefinition.dependencySlotIds,
      "dependencySlotIds",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readOptionalStringListOrThrow(
      slotDefinition.trigger.stageIds,
      "trigger.stageIds",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readOptionalStringListOrThrow(
      slotDefinition.trigger.routeKeys,
      "trigger.routeKeys",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readOptionalStringListOrThrow(
      slotDefinition.trigger.changedPathPatterns,
      "trigger.changedPathPatterns",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );
    this.readOptionalStringListOrThrow(
      slotDefinition.applicability.pathPrefixes,
      "applicability.pathPrefixes",
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
    );

    if (slotDefinition.track === SlotTrack.DECLARATIVE) {
      this.readRequiredStringOrThrow(
        slotDefinition.declarativeRule.ruleKey,
        "declarativeRule.ruleKey",
        GovernorErrorCode.SLOT_DEFINITION_INVALID,
      );
      return;
    }

    this.assertScriptSlotStructureOrThrow(slotDefinition);
  }

  /**
   * Validates script slot structural fields.
   * @param slotDefinition Script slot definition.
   * @returns Nothing.
   */
  private assertScriptSlotStructureOrThrow(slotDefinition: ScriptSlotDefinition): void {
    this.readRequiredStringOrThrow(
      slotDefinition.script.slotScriptId,
      "script.slotScriptId",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.readRequiredStringOrThrow(
      slotDefinition.script.slotScriptVersion,
      "script.slotScriptVersion",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.readRequiredStringOrThrow(
      slotDefinition.script.slotScriptHash,
      "script.slotScriptHash",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.readRequiredStringOrThrow(
      slotDefinition.script.entryCommand,
      "script.entryCommand",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.readPermissionListOrThrow(
      slotDefinition.scriptPolicy.requestedPermissions,
      "scriptPolicy.requestedPermissions",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.assertBooleanOrThrow(
      slotDefinition.scriptPolicy.sandbox.enabled,
      "scriptPolicy.sandbox.enabled",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.readRequiredStringOrThrow(
      slotDefinition.scriptPolicy.sandbox.profile,
      "scriptPolicy.sandbox.profile",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.assertFiniteNumberOrThrow(
      slotDefinition.scriptPolicy.resourceLimits.maxCpu,
      "scriptPolicy.resourceLimits.maxCpu",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.assertFiniteNumberOrThrow(
      slotDefinition.scriptPolicy.resourceLimits.maxMemoryMb,
      "scriptPolicy.resourceLimits.maxMemoryMb",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.assertFiniteNumberOrThrow(
      slotDefinition.scriptPolicy.resourceLimits.maxExecutionTimeSeconds,
      "scriptPolicy.resourceLimits.maxExecutionTimeSeconds",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.assertFiniteNumberOrThrow(
      slotDefinition.scriptPolicy.resourceLimits.maxOutputBytes,
      "scriptPolicy.resourceLimits.maxOutputBytes",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.readRequiredStringOrThrow(
      slotDefinition.scriptPolicy.ioContract.inputSchema,
      "scriptPolicy.ioContract.inputSchema",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.readRequiredStringOrThrow(
      slotDefinition.scriptPolicy.ioContract.outputSchema,
      "scriptPolicy.ioContract.outputSchema",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.readStringListOrThrow(
      slotDefinition.scriptPolicy.ioContract.sideEffectManifest,
      "scriptPolicy.ioContract.sideEffectManifest",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.assertBooleanOrThrow(
      slotDefinition.scriptPolicy.failureIsolation.isolateOnError,
      "scriptPolicy.failureIsolation.isolateOnError",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
    this.assertSlotRequiredActionOrThrow(
      slotDefinition.scriptPolicy.failureIsolation.fallbackAction,
      "scriptPolicy.failureIsolation.fallbackAction",
      GovernorErrorCode.SLOT_SCRIPT_SECURITY_INVALID,
    );
  }

  /**
   * Validates conflict strategy enum value.
   * @param conflictStrategy Conflict strategy candidate.
   * @returns Nothing.
   */
  private assertConflictStrategyOrThrow(conflictStrategy: SlotConflictStrategy): void {
    if (SLOT_CONFLICT_STRATEGY_VALUES.has(conflictStrategy)) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.SLOT_DEFINITION_INVALID,
      `Unsupported slot conflict strategy "${String(conflictStrategy)}".`,
      {
        conflictStrategy,
      },
    );
  }

  /**
   * Validates required-action enum value.
   * @param action Required action candidate.
   * @param fieldName Field name.
   * @param errorCode Error code.
   * @returns Nothing.
   */
  private assertSlotRequiredActionOrThrow(
    action: SlotRequiredAction,
    fieldName: string,
    errorCode: GovernorErrorCode,
  ): void {
    if (SLOT_REQUIRED_ACTION_VALUES.has(action)) {
      return;
    }

    throw new RuntimeError(errorCode, `Field "${fieldName}" must be a valid SlotRequiredAction.`, {
      fieldName,
      receivedType: typeof action,
      value: String(action),
    });
  }

  /**
   * Normalizes runtime context fields.
   * @param context Runtime context input.
   * @returns Normalized context.
   */
  private normalizeResolutionContext(context: SlotResolutionContext): SlotResolutionContext {
    return {
      executionId: this.readRequiredStringOrThrow(
        context.executionId,
        "context.executionId",
        GovernorErrorCode.SLOT_DEFINITION_INVALID,
      ),
      stageId: this.readRequiredStringOrThrow(
        context.stageId,
        "context.stageId",
        GovernorErrorCode.SLOT_DEFINITION_INVALID,
      ),
      routeKey: this.readRequiredStringOrThrow(
        context.routeKey,
        "context.routeKey",
        GovernorErrorCode.SLOT_DEFINITION_INVALID,
      ),
      changedPaths: context.changedPaths
        ? this.readStringListOrThrow(
            context.changedPaths,
            "context.changedPaths",
            GovernorErrorCode.SLOT_DEFINITION_INVALID,
          )
        : undefined,
      approvedPermissions: context.approvedPermissions
        ? this.readPermissionListOrThrow(
            context.approvedPermissions,
            "context.approvedPermissions",
            GovernorErrorCode.SLOT_DEFINITION_INVALID,
          )
        : undefined,
    };
  }

  /**
   * Validates one required string field.
   * @param value Candidate value.
   * @param fieldName Field name.
   * @param errorCode Error code.
   * @returns Trimmed string value.
   */
  private readRequiredStringOrThrow(
    value: unknown,
    fieldName: string,
    errorCode: GovernorErrorCode,
  ): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new RuntimeError(errorCode, `Field "${fieldName}" must be a non-empty string.`, {
        fieldName,
        receivedType: typeof value,
      });
    }

    return value.trim();
  }

  /**
   * Validates one required boolean field.
   * @param value Candidate value.
   * @param fieldName Field name.
   * @param errorCode Error code.
   * @returns Nothing.
   */
  private assertBooleanOrThrow(
    value: unknown,
    fieldName: string,
    errorCode: GovernorErrorCode,
  ): void {
    if (typeof value === "boolean") {
      return;
    }

    throw new RuntimeError(errorCode, `Field "${fieldName}" must be a boolean.`, {
      fieldName,
      receivedType: typeof value,
    });
  }

  /**
   * Validates one finite numeric field.
   * @param value Candidate value.
   * @param fieldName Field name.
   * @param errorCode Error code.
   * @returns Number value.
   */
  private assertFiniteNumberOrThrow(
    value: unknown,
    fieldName: string,
    errorCode: GovernorErrorCode,
  ): number {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    throw new RuntimeError(errorCode, `Field "${fieldName}" must be a finite number.`, {
      fieldName,
      receivedType: typeof value,
    });
  }

  /**
   * Validates one required string list field.
   * @param value Candidate list.
   * @param fieldName Field name.
   * @param errorCode Error code.
   * @returns Sanitized list.
   */
  private readStringListOrThrow(
    value: unknown,
    fieldName: string,
    errorCode: GovernorErrorCode,
  ): string[] {
    if (!Array.isArray(value)) {
      throw new RuntimeError(errorCode, `Field "${fieldName}" must be a string array.`, {
        fieldName,
        receivedType: typeof value,
      });
    }

    return value.map((item, index) =>
      this.readRequiredStringOrThrow(item, `${fieldName}[${index}]`, errorCode),
    );
  }

  /**
   * Validates one optional string list field.
   * @param value Candidate list.
   * @param fieldName Field name.
   * @param errorCode Error code.
   * @returns Sanitized list or undefined.
   */
  private readOptionalStringListOrThrow(
    value: unknown,
    fieldName: string,
    errorCode: GovernorErrorCode,
  ): string[] | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.readStringListOrThrow(value, fieldName, errorCode);
  }

  /**
   * Validates slot permission list values.
   * @param value Candidate permission list.
   * @param fieldName Field name.
   * @param errorCode Error code.
   * @returns Permission list.
   */
  private readPermissionListOrThrow(
    value: unknown,
    fieldName: string,
    errorCode: GovernorErrorCode,
  ): SlotPermissionCapability[] {
    const permissionValues = this.readStringListOrThrow(value, fieldName, errorCode);
    const normalizedPermissionList = permissionValues.map((permissionValue, index) => {
      if (SLOT_PERMISSION_VALUES.has(permissionValue)) {
        return permissionValue as SlotPermissionCapability;
      }

      throw new RuntimeError(
        errorCode,
        `Field "${fieldName}[${index}]" must be a supported SlotPermissionCapability value.`,
        {
          fieldName,
          value: permissionValue,
        },
      );
    });

    return normalizedPermissionList;
  }
}
