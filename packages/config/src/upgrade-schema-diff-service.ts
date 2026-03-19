import { ConfigError, GovernorErrorCode } from "../../shared/src/errors/index.js";
import {
  DEFAULT_WORKSPACE_MIGRATION_POLICY,
  GOVERNOR_LATEST_SCHEMA_VERSION,
  GovernorSchemaVersion,
  SUPPORTED_GOVERNOR_SCHEMA_VERSIONS,
  UpgradeConfirmationDecision,
  UpgradeConfirmationReason,
  UpgradeMigrationSuggestionType,
  UpgradeSchemaDiffType,
} from "./constants/index.js";
import { SchemaValidator } from "./schema-validator.js";
import type { GovernorConfig } from "./types/interfaces/governor-config.interface.js";
import type { GovernorProfile } from "./types/interfaces/governor-profile.interface.js";
import type { UpgradeConfirmationItem } from "./types/interfaces/upgrade-confirmation-item.interface.js";
import type { UpgradeMigrationSuggestion } from "./types/interfaces/upgrade-migration-suggestion.interface.js";
import type { UpgradeSchemaDiffItem } from "./types/interfaces/upgrade-schema-diff-item.interface.js";
import type { UpgradeSchemaDiffOptions } from "./types/interfaces/upgrade-schema-diff-options.interface.js";
import type { UpgradeSchemaDiffResult } from "./types/interfaces/upgrade-schema-diff-result.interface.js";

const SUPPORTED_FORWARD_UPGRADE_PATHS = new Set<string>([
  `${GovernorSchemaVersion.V1_0}->${GovernorSchemaVersion.V1_1}`,
]);

/**
 * Produces schema diffs, migration suggestions, and confirmation decisions for config upgrades.
 *
 * Why this exists:
 * upgrade entrypoints must reuse one deterministic evaluator so `schema diff -> suggestion ->
 * human confirmation` decisions are stable across CLI/runtime surfaces.
 */
export class UpgradeSchemaDiffService {
  constructor(private readonly schemaValidator: SchemaValidator = new SchemaValidator()) {}

  /**
   * Analyzes upgrade impact for a source config and target schema version.
   * @param options Source config and optional target schema version.
   * @returns Structured diff report containing auto-migrated config and confirmation requirements.
   */
  public analyze(options: UpgradeSchemaDiffOptions): UpgradeSchemaDiffResult {
    const targetVersion = options.targetVersion ?? GOVERNOR_LATEST_SCHEMA_VERSION;
    this.assertTargetVersionSupported(targetVersion);

    const sourceConfig = this.schemaValidator.validateOrThrow(options.sourceConfig);
    this.assertUpgradePathSupported(sourceConfig.schemaVersion, targetVersion);

    const diffs: UpgradeSchemaDiffItem[] = [];
    const suggestions: UpgradeMigrationSuggestion[] = [];
    const confirmationItems: UpgradeConfirmationItem[] = [];
    const autoMigratedConfig = this.cloneConfig(sourceConfig);

    this.collectSchemaVersionDiff(
      sourceConfig.schemaVersion,
      targetVersion,
      diffs,
      suggestions,
      confirmationItems,
    );
    this.collectWorkspaceMigrationPolicyDiff(
      sourceConfig,
      autoMigratedConfig,
      targetVersion,
      diffs,
      suggestions,
    );

    return {
      sourceVersion: sourceConfig.schemaVersion,
      targetVersion,
      diffs,
      suggestions,
      confirmationDecision: this.resolveConfirmationDecision(confirmationItems),
      confirmationItems,
      autoMigratedConfig,
    };
  }

  /**
   * Collects schemaVersion diff and marks manual confirmation requirement.
   * @param sourceVersion Source schema version.
   * @param targetVersion Requested target schema version.
   * @param diffs Diff accumulator.
   * @param suggestions Suggestion accumulator.
   * @param confirmationItems Confirmation-item accumulator.
   * @returns Void.
   */
  private collectSchemaVersionDiff(
    sourceVersion: string,
    targetVersion: GovernorSchemaVersion,
    diffs: UpgradeSchemaDiffItem[],
    suggestions: UpgradeMigrationSuggestion[],
    confirmationItems: UpgradeConfirmationItem[],
  ): void {
    if (sourceVersion === targetVersion) {
      return;
    }

    diffs.push({
      path: "/schemaVersion",
      diffType: UpgradeSchemaDiffType.CHANGED,
      reason: "schemaVersion controls downstream validator behavior and upgrade compatibility.",
      fromValue: sourceVersion,
      toValue: targetVersion,
    });
    suggestions.push({
      suggestionId: "schema-version-bump",
      path: "/schemaVersion",
      suggestionType: UpgradeMigrationSuggestionType.CONFIRM_REQUIRED,
      reason:
        "Schema version update affects validator contract and should be explicitly acknowledged.",
      fromValue: sourceVersion,
      toValue: targetVersion,
    });
    confirmationItems.push({
      reason: UpgradeConfirmationReason.SCHEMA_VERSION_BUMP,
      message:
        "Confirm schemaVersion bump before writing back config, because downstream validators will switch to new contract.",
      paths: ["/schemaVersion"],
      blocking: false,
    });
  }

  /**
   * Adds auto-migration suggestions for required workspace migration policy in v1.1.
   * @param sourceConfig Source config before upgrade.
   * @param autoMigratedConfig Auto-migrated config draft to mutate.
   * @param targetVersion Requested target schema version.
   * @param diffs Diff accumulator.
   * @param suggestions Suggestion accumulator.
   * @returns Void.
   */
  private collectWorkspaceMigrationPolicyDiff(
    sourceConfig: GovernorConfig,
    autoMigratedConfig: GovernorConfig,
    targetVersion: GovernorSchemaVersion,
    diffs: UpgradeSchemaDiffItem[],
    suggestions: UpgradeMigrationSuggestion[],
  ): void {
    if (targetVersion !== GovernorSchemaVersion.V1_1) {
      return;
    }

    if (!sourceConfig.workspace.migrationPolicy) {
      diffs.push({
        path: "/workspace/migrationPolicy",
        diffType: UpgradeSchemaDiffType.ADDED,
        reason:
          "v1.1 workspace contract requires explicit migration policy for deterministic rollback behavior.",
        toValue: DEFAULT_WORKSPACE_MIGRATION_POLICY,
      });
      suggestions.push({
        suggestionId: "workspace-migration-policy-default",
        path: "/workspace/migrationPolicy",
        suggestionType: UpgradeMigrationSuggestionType.AUTO_APPLY,
        reason:
          "Auto-fill migrationPolicy with repository baseline to keep migration semantics explicit.",
        toValue: DEFAULT_WORKSPACE_MIGRATION_POLICY,
      });
      autoMigratedConfig.workspace = {
        ...autoMigratedConfig.workspace,
        migrationPolicy: DEFAULT_WORKSPACE_MIGRATION_POLICY,
      };
    }

    if (!autoMigratedConfig.profiles) {
      return;
    }

    for (const [profileId, profile] of Object.entries(autoMigratedConfig.profiles)) {
      if (!profile.workspace || profile.workspace.migrationPolicy) {
        continue;
      }

      diffs.push({
        path: `/profiles/${profileId}/workspace/migrationPolicy`,
        diffType: UpgradeSchemaDiffType.ADDED,
        reason:
          "Profile-level workspace overrides should keep migration policy aligned with repository baseline.",
        toValue: DEFAULT_WORKSPACE_MIGRATION_POLICY,
      });
      suggestions.push({
        suggestionId: `profile-${profileId}-workspace-migration-policy-default`,
        path: `/profiles/${profileId}/workspace/migrationPolicy`,
        suggestionType: UpgradeMigrationSuggestionType.AUTO_APPLY,
        reason:
          "Auto-fill profile migrationPolicy to prevent profile-switch drift in workspace migration semantics.",
        toValue: DEFAULT_WORKSPACE_MIGRATION_POLICY,
      });

      autoMigratedConfig.profiles[profileId] = {
        ...profile,
        workspace: {
          ...profile.workspace,
          migrationPolicy: DEFAULT_WORKSPACE_MIGRATION_POLICY,
        },
      };
    }
  }

  /**
   * Ensures requested target schema version is supported by current baseline.
   * @param targetVersion Target schema version.
   * @returns Void.
   */
  private assertTargetVersionSupported(targetVersion: GovernorSchemaVersion): void {
    if (SUPPORTED_GOVERNOR_SCHEMA_VERSIONS.has(targetVersion)) {
      return;
    }

    throw new ConfigError(
      GovernorErrorCode.CONFIG_SCHEMA_VERSION_UNSUPPORTED,
      `Unsupported target schema version: ${targetVersion}.`,
      {
        targetVersion,
        supportedVersions: Array.from(SUPPORTED_GOVERNOR_SCHEMA_VERSIONS),
      },
    );
  }

  /**
   * Ensures source-to-target path belongs to approved forward upgrade routes.
   * @param sourceVersion Source schema version.
   * @param targetVersion Target schema version.
   * @returns Void.
   */
  private assertUpgradePathSupported(
    sourceVersion: string,
    targetVersion: GovernorSchemaVersion,
  ): void {
    if (sourceVersion === targetVersion) {
      return;
    }

    const pathKey = `${sourceVersion}->${targetVersion}`;
    if (SUPPORTED_FORWARD_UPGRADE_PATHS.has(pathKey)) {
      return;
    }

    throw new ConfigError(
      GovernorErrorCode.CONFIG_SCHEMA_UPGRADE_PATH_UNSUPPORTED,
      `Unsupported schema upgrade path: ${pathKey}.`,
      {
        sourceVersion,
        targetVersion,
        supportedPaths: Array.from(SUPPORTED_FORWARD_UPGRADE_PATHS),
      },
    );
  }

  /**
   * Resolves confirmation decision from collected confirmation items.
   * @param confirmationItems Confirmation requirements collected during analysis.
   * @returns Decision enum for downstream policy gate integration.
   */
  private resolveConfirmationDecision(
    confirmationItems: UpgradeConfirmationItem[],
  ): UpgradeConfirmationDecision {
    if (confirmationItems.some((item) => item.blocking)) {
      return UpgradeConfirmationDecision.BLOCK;
    }

    if (confirmationItems.length > 0) {
      return UpgradeConfirmationDecision.CONFIRM;
    }

    return UpgradeConfirmationDecision.ALLOW;
  }

  /**
   * Creates a safe mutable clone for auto-migration draft generation.
   * @param sourceConfig Source config.
   * @returns Deep-cloned config object for controlled in-memory mutations.
   */
  private cloneConfig(sourceConfig: GovernorConfig): GovernorConfig {
    return {
      ...sourceConfig,
      workspace: { ...sourceConfig.workspace },
      i18n: {
        ...sourceConfig.i18n,
        supportedLocales: [...sourceConfig.i18n.supportedLocales],
      },
      ...(sourceConfig.profiles
        ? {
            profiles: Object.fromEntries(
              Object.entries(sourceConfig.profiles).map(([profileId, profile]) => [
                profileId,
                this.cloneProfile(profile),
              ]),
            ),
          }
        : {}),
    };
  }

  /**
   * Clones profile overrides to keep source object immutable during draft mutation.
   * @param profile Source profile override.
   * @returns Cloned profile object.
   */
  private cloneProfile(profile: GovernorProfile): GovernorProfile {
    return {
      ...(profile.workspace ? { workspace: { ...profile.workspace } } : {}),
      ...(profile.i18n
        ? {
            i18n: {
              ...profile.i18n,
              ...(profile.i18n.supportedLocales
                ? { supportedLocales: [...profile.i18n.supportedLocales] }
                : {}),
            },
          }
        : {}),
    };
  }
}
