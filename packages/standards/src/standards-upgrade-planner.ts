import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  DEFAULT_STANDARDS_ALLOW_MINOR_AUTO_UPGRADE,
  DEFAULT_STANDARDS_ALLOW_PATCH_AUTO_UPGRADE,
  DEFAULT_STANDARDS_VERSION_PIN_MODE,
  STANDARDS_PACK_SCOPE_VALUES,
  STANDARDS_PACK_SOURCE_VALUES,
  type StandardsPackScope,
  type StandardsPackSource,
  StandardsUpgradeChangeType,
  StandardsUpgradeConflictLevel,
  StandardsUpgradeRequiredAction,
  StandardsUpgradeRollbackStrategy,
  StandardsVersionPinMode,
} from "./constants/index.js";
import type {
  StandardsUpgradeAutoFixSuggestion,
  StandardsUpgradeConflict,
  StandardsUpgradePackState,
  StandardsUpgradePinDecision,
  StandardsUpgradePlanInput,
  StandardsUpgradePlanResult,
  StandardsUpgradePlannerOptions,
  StandardsVersionPinPolicy,
} from "./types/index.js";
import { readRequiredString } from "./utils/index.js";

interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
}

interface IndexedUpgradePackState extends StandardsUpgradePackState {
  parsedVersion: ParsedSemver;
}

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/u;

/**
 * Plans standards-pack upgrades with conflict grading, pin policy, and rollback semantics.
 *
 * Why this exists:
 * upgrade UX should produce one deterministic planning payload so downstream flows
 * can classify block/auto-fix/advisory outcomes without re-implementing policy logic.
 */
export class StandardsUpgradePlanner {
  private readonly defaultPinPolicy: StandardsVersionPinPolicy;

  public constructor(options: StandardsUpgradePlannerOptions = {}) {
    this.defaultPinPolicy = this.resolvePinPolicy(options.defaultPinPolicy);
  }

  /**
   * Builds one standards-upgrade plan from current and target pack descriptors.
   * @param input Upgrade planning input.
   * @returns Structured plan payload for upgrade UX and audit handoff.
   */
  public plan(input: StandardsUpgradePlanInput): StandardsUpgradePlanResult {
    try {
      const pinPolicy = this.resolvePinPolicy(input.pinPolicy);
      const indexedCurrentPacks = this.indexPackStates(input.currentPacks, "currentPacks");
      const indexedTargetPacks = this.indexPackStates(input.targetPacks, "targetPacks");
      const allPackIds = Array.from(
        new Set([...indexedCurrentPacks.keys(), ...indexedTargetPacks.keys()]),
      ).sort((left, right) => left.localeCompare(right));
      const blockingConflicts: StandardsUpgradeConflict[] = [];
      const autoFixableConflicts: StandardsUpgradeConflict[] = [];
      const advisoryConflicts: StandardsUpgradeConflict[] = [];
      const autoFixSuggestions: StandardsUpgradeAutoFixSuggestion[] = [];
      const pinDecisions: StandardsUpgradePinDecision[] = [];

      for (const packId of allPackIds) {
        const currentPack = indexedCurrentPacks.get(packId);
        const targetPack = indexedTargetPacks.get(packId);

        if (currentPack && !targetPack) {
          const conflict = this.createConflict({
            conflictId: `${packId}:removed`,
            packId,
            level: StandardsUpgradeConflictLevel.BLOCK,
            changeType: StandardsUpgradeChangeType.REMOVED,
            message: `Removing standards pack "${packId}" is blocked by baseline policy.`,
            fromVersion: currentPack.packVersion,
            recommendedAction: StandardsUpgradeRequiredAction.BLOCK,
          });
          blockingConflicts.push(conflict);
          autoFixSuggestions.push({
            suggestionId: `${packId}:restore-current`,
            packId,
            description: "Restore the removed pack from current baseline snapshot.",
            suggestedTargetVersion: currentPack.packVersion,
          });
          continue;
        }

        if (!currentPack && targetPack) {
          advisoryConflicts.push(
            this.createConflict({
              conflictId: `${packId}:added`,
              packId,
              level: StandardsUpgradeConflictLevel.ADVISORY,
              changeType: StandardsUpgradeChangeType.ADDED,
              message: `New standards pack "${packId}" should be manually confirmed before rollout.`,
              toVersion: targetPack.packVersion,
              recommendedAction: StandardsUpgradeRequiredAction.CONFIRM,
            }),
          );
          pinDecisions.push(this.createPinDecision(undefined, targetPack, pinPolicy));
          continue;
        }

        if (!currentPack || !targetPack) {
          continue;
        }

        pinDecisions.push(this.createPinDecision(currentPack, targetPack, pinPolicy));

        if (currentPack.packSource !== targetPack.packSource) {
          advisoryConflicts.push(
            this.createConflict({
              conflictId: `${packId}:source-changed`,
              packId,
              level: StandardsUpgradeConflictLevel.ADVISORY,
              changeType: StandardsUpgradeChangeType.SOURCE_CHANGED,
              message: `Pack "${packId}" source changed from "${currentPack.packSource}" to "${targetPack.packSource}".`,
              fromVersion: currentPack.packVersion,
              toVersion: targetPack.packVersion,
              recommendedAction: StandardsUpgradeRequiredAction.CONFIRM,
            }),
          );
        }

        if (currentPack.scope !== targetPack.scope) {
          advisoryConflicts.push(
            this.createConflict({
              conflictId: `${packId}:scope-changed`,
              packId,
              level: StandardsUpgradeConflictLevel.ADVISORY,
              changeType: StandardsUpgradeChangeType.SCOPE_CHANGED,
              message: `Pack "${packId}" scope changed from "${currentPack.scope}" to "${targetPack.scope}".`,
              fromVersion: currentPack.packVersion,
              toVersion: targetPack.packVersion,
              recommendedAction: StandardsUpgradeRequiredAction.CONFIRM,
            }),
          );
        }

        if (currentPack.parsedVersion.major !== targetPack.parsedVersion.major) {
          blockingConflicts.push(
            this.createConflict({
              conflictId: `${packId}:major-changed`,
              packId,
              level: StandardsUpgradeConflictLevel.BLOCK,
              changeType: StandardsUpgradeChangeType.VERSION_CHANGED,
              message:
                `Pack "${packId}" major version changed from ${currentPack.parsedVersion.major} to ` +
                `${targetPack.parsedVersion.major}, which violates major-locked baseline.`,
              fromVersion: currentPack.packVersion,
              toVersion: targetPack.packVersion,
              recommendedAction: StandardsUpgradeRequiredAction.BLOCK,
            }),
          );
          autoFixSuggestions.push({
            suggestionId: `${packId}:pin-major`,
            packId,
            description: "Pin target version to current major line before retry.",
            suggestedTargetVersion: `${currentPack.parsedVersion.major}.x`,
          });
          continue;
        }

        const semverDelta = this.compareSemver(currentPack.parsedVersion, targetPack.parsedVersion);
        if (semverDelta === 0) {
          continue;
        }

        if (pinPolicy.mode === StandardsVersionPinMode.EXACT_VERSION) {
          advisoryConflicts.push(
            this.createConflict({
              conflictId: `${packId}:exact-version-confirm`,
              packId,
              level: StandardsUpgradeConflictLevel.ADVISORY,
              changeType: StandardsUpgradeChangeType.VERSION_CHANGED,
              message: `Pack "${packId}" exact-version pin requires manual confirmation for any version change.`,
              fromVersion: currentPack.packVersion,
              toVersion: targetPack.packVersion,
              recommendedAction: StandardsUpgradeRequiredAction.CONFIRM,
            }),
          );
          continue;
        }

        if (semverDelta > 0) {
          advisoryConflicts.push(
            this.createConflict({
              conflictId: `${packId}:downgrade`,
              packId,
              level: StandardsUpgradeConflictLevel.ADVISORY,
              changeType: StandardsUpgradeChangeType.VERSION_CHANGED,
              message: `Pack "${packId}" version downgrade requires manual confirmation.`,
              fromVersion: currentPack.packVersion,
              toVersion: targetPack.packVersion,
              recommendedAction: StandardsUpgradeRequiredAction.CONFIRM,
            }),
          );
          continue;
        }

        const isMinorUpgrade = targetPack.parsedVersion.minor > currentPack.parsedVersion.minor;
        const isPatchUpgrade =
          targetPack.parsedVersion.minor === currentPack.parsedVersion.minor &&
          targetPack.parsedVersion.patch > currentPack.parsedVersion.patch;
        if (isMinorUpgrade && pinPolicy.allowMinorAutoUpgrade) {
          autoFixableConflicts.push(
            this.createConflict({
              conflictId: `${packId}:minor-upgrade`,
              packId,
              level: StandardsUpgradeConflictLevel.AUTO_FIXABLE,
              changeType: StandardsUpgradeChangeType.VERSION_CHANGED,
              message: `Pack "${packId}" minor upgrade can be auto-applied under current pin policy.`,
              fromVersion: currentPack.packVersion,
              toVersion: targetPack.packVersion,
              recommendedAction: StandardsUpgradeRequiredAction.ALLOW,
            }),
          );
          autoFixSuggestions.push({
            suggestionId: `${packId}:apply-minor`,
            packId,
            description: "Apply validated minor upgrade and refresh standards projection snapshot.",
            suggestedTargetVersion: targetPack.packVersion,
          });
          continue;
        }

        if (isPatchUpgrade && pinPolicy.allowPatchAutoUpgrade) {
          autoFixableConflicts.push(
            this.createConflict({
              conflictId: `${packId}:patch-upgrade`,
              packId,
              level: StandardsUpgradeConflictLevel.AUTO_FIXABLE,
              changeType: StandardsUpgradeChangeType.VERSION_CHANGED,
              message: `Pack "${packId}" patch upgrade can be auto-applied under current pin policy.`,
              fromVersion: currentPack.packVersion,
              toVersion: targetPack.packVersion,
              recommendedAction: StandardsUpgradeRequiredAction.ALLOW,
            }),
          );
          autoFixSuggestions.push({
            suggestionId: `${packId}:apply-patch`,
            packId,
            description: "Apply validated patch upgrade and re-run standards parity checks.",
            suggestedTargetVersion: targetPack.packVersion,
          });
          continue;
        }

        advisoryConflicts.push(
          this.createConflict({
            conflictId: `${packId}:version-confirm`,
            packId,
            level: StandardsUpgradeConflictLevel.ADVISORY,
            changeType: StandardsUpgradeChangeType.VERSION_CHANGED,
            message: `Pack "${packId}" version change requires manual confirmation under current pin policy.`,
            fromVersion: currentPack.packVersion,
            toVersion: targetPack.packVersion,
            recommendedAction: StandardsUpgradeRequiredAction.CONFIRM,
          }),
        );
      }

      return {
        requiredAction: this.resolveRequiredAction(blockingConflicts, advisoryConflicts),
        blockingConflicts,
        autoFixableConflicts,
        advisoryConflicts,
        autoFixSuggestions,
        pinDecisions,
        rollbackPlan: {
          strategy: StandardsUpgradeRollbackStrategy.RESTORE_PREVIOUS_SNAPSHOT,
          rollbackRef: this.resolveRollbackRef(input.rollbackRef),
          rollbackSteps: [
            "restore standards pack versions from pre-upgrade snapshot",
            "rebuild standards render outputs (human/ai/agents)",
            "re-run standards parity and docs sync gates",
          ],
        },
      };
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }

      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_UPGRADE_PLAN_FAILED,
        "Standards upgrade planning failed unexpectedly.",
        undefined,
        error,
      );
    }
  }

  /**
   * Resolves effective version pin policy.
   * @param policy Optional user policy.
   * @returns Normalized pin policy.
   */
  private resolvePinPolicy(policy?: StandardsVersionPinPolicy): StandardsVersionPinPolicy {
    const mode = policy?.mode ?? this.defaultPinPolicy?.mode ?? DEFAULT_STANDARDS_VERSION_PIN_MODE;
    if (!Object.values(StandardsVersionPinMode).includes(mode)) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_UPGRADE_INVALID,
        `Unsupported standards version pin mode "${String(mode)}".`,
        {
          mode,
        },
      );
    }

    return {
      mode,
      allowMinorAutoUpgrade:
        policy?.allowMinorAutoUpgrade ??
        this.defaultPinPolicy?.allowMinorAutoUpgrade ??
        DEFAULT_STANDARDS_ALLOW_MINOR_AUTO_UPGRADE,
      allowPatchAutoUpgrade:
        policy?.allowPatchAutoUpgrade ??
        this.defaultPinPolicy?.allowPatchAutoUpgrade ??
        DEFAULT_STANDARDS_ALLOW_PATCH_AUTO_UPGRADE,
    };
  }

  /**
   * Indexes pack states by pack id with semver parsing.
   * @param packStates Pack-state rows.
   * @param fieldName Field name for diagnostics.
   * @returns Indexed map.
   */
  private indexPackStates(
    packStates: StandardsUpgradePackState[],
    fieldName: string,
  ): Map<string, IndexedUpgradePackState> {
    if (!Array.isArray(packStates)) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_UPGRADE_INVALID,
        `Field "${fieldName}" must be an array.`,
        {
          fieldName,
          receivedType: typeof packStates,
        },
      );
    }

    const indexedPacks = new Map<string, IndexedUpgradePackState>();
    for (let index = 0; index < packStates.length; index += 1) {
      const packState = packStates[index];
      const fieldPrefix = `${fieldName}[${index}]`;
      const packId = readRequiredString(
        packState?.packId,
        `${fieldPrefix}.packId`,
        GovernorErrorCode.STANDARDS_UPGRADE_INVALID,
      );
      if (indexedPacks.has(packId)) {
        throw new RuntimeError(
          GovernorErrorCode.STANDARDS_UPGRADE_INVALID,
          `Duplicate packId "${packId}" detected in "${fieldName}".`,
          {
            fieldName,
            packId,
          },
        );
      }

      const packVersion = readRequiredString(
        packState?.packVersion,
        `${fieldPrefix}.packVersion`,
        GovernorErrorCode.STANDARDS_UPGRADE_INVALID,
      );
      const parsedVersion = this.parseSemver(packVersion, `${fieldPrefix}.packVersion`);
      const packSource = this.readEnumString<StandardsPackSource>(
        packState?.packSource,
        STANDARDS_PACK_SOURCE_VALUES,
        `${fieldPrefix}.packSource`,
      );
      const scope = this.readEnumString<StandardsPackScope>(
        packState?.scope,
        STANDARDS_PACK_SCOPE_VALUES,
        `${fieldPrefix}.scope`,
      );

      indexedPacks.set(packId, {
        packId,
        packVersion,
        packSource,
        scope,
        parsedVersion,
      });
    }

    return indexedPacks;
  }

  /**
   * Parses one semver string (`x.y.z`) used by upgrade baseline.
   * @param version Semver string.
   * @param fieldName Field name.
   * @returns Parsed semver object.
   */
  private parseSemver(version: string, fieldName: string): ParsedSemver {
    const matched = version.match(SEMVER_PATTERN);
    if (!matched) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_UPGRADE_INVALID,
        `Field "${fieldName}" must match semver format "x.y.z".`,
        {
          fieldName,
          value: version,
        },
      );
    }

    return {
      major: Number(matched[1]),
      minor: Number(matched[2]),
      patch: Number(matched[3]),
    };
  }

  /**
   * Reads one enum-like string from value sets.
   * @param value Candidate value.
   * @param valueSet Allowed value set.
   * @param fieldName Field name.
   * @returns Normalized value.
   */
  private readEnumString<TValue extends string>(
    value: unknown,
    valueSet: Set<string>,
    fieldName: string,
  ): TValue {
    const normalizedValue = readRequiredString(
      value,
      fieldName,
      GovernorErrorCode.STANDARDS_UPGRADE_INVALID,
    );
    if (valueSet.has(normalizedValue)) {
      return normalizedValue as TValue;
    }

    throw new RuntimeError(
      GovernorErrorCode.STANDARDS_UPGRADE_INVALID,
      `Field "${fieldName}" contains unsupported enum value "${normalizedValue}".`,
      {
        fieldName,
        value: normalizedValue,
      },
    );
  }

  /**
   * Compares semver objects.
   * @param left Left semver.
   * @param right Right semver.
   * @returns Positive when left>right; negative when left<right; 0 when equal.
   */
  private compareSemver(left: ParsedSemver, right: ParsedSemver): number {
    if (left.major !== right.major) {
      return left.major - right.major;
    }

    if (left.minor !== right.minor) {
      return left.minor - right.minor;
    }

    return left.patch - right.patch;
  }

  /**
   * Creates one conflict row with consistent field ordering.
   * @param conflict Conflict payload.
   * @returns Conflict object.
   */
  private createConflict(conflict: StandardsUpgradeConflict): StandardsUpgradeConflict {
    return {
      conflictId: conflict.conflictId,
      packId: conflict.packId,
      level: conflict.level,
      changeType: conflict.changeType,
      message: conflict.message,
      fromVersion: conflict.fromVersion,
      toVersion: conflict.toVersion,
      recommendedAction: conflict.recommendedAction,
    };
  }

  /**
   * Creates one pin decision row for target pack.
   * @param currentPack Optional current pack state.
   * @param targetPack Target pack state.
   * @param pinPolicy Effective pin policy.
   * @returns Pin decision.
   */
  private createPinDecision(
    currentPack: IndexedUpgradePackState | undefined,
    targetPack: IndexedUpgradePackState,
    pinPolicy: StandardsVersionPinPolicy,
  ): StandardsUpgradePinDecision {
    const pinnedMajor = currentPack?.parsedVersion.major ?? targetPack.parsedVersion.major;
    return {
      packId: targetPack.packId,
      fromVersion: currentPack?.packVersion,
      toVersion: targetPack.packVersion,
      policyMode: pinPolicy.mode,
      isPinned: true,
      pinnedMajor,
    };
  }

  /**
   * Resolves required action from conflict buckets.
   * @param blockingConflicts Blocking conflicts.
   * @param advisoryConflicts Advisory conflicts.
   * @returns Required action summary.
   */
  private resolveRequiredAction(
    blockingConflicts: StandardsUpgradeConflict[],
    advisoryConflicts: StandardsUpgradeConflict[],
  ): StandardsUpgradeRequiredAction {
    if (blockingConflicts.length > 0) {
      return StandardsUpgradeRequiredAction.BLOCK;
    }

    if (advisoryConflicts.length > 0) {
      return StandardsUpgradeRequiredAction.CONFIRM;
    }

    return StandardsUpgradeRequiredAction.ALLOW;
  }

  /**
   * Resolves rollback reference for upgrade plan.
   * @param rollbackRef Optional user-provided rollback ref.
   * @returns Rollback reference.
   */
  private resolveRollbackRef(rollbackRef?: string): string {
    if (rollbackRef) {
      return readRequiredString(
        rollbackRef,
        "rollbackRef",
        GovernorErrorCode.STANDARDS_UPGRADE_INVALID,
      );
    }

    return "standards-upgrade-rollback";
  }
}
