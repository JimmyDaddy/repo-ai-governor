import type {
  GovernorSchemaVersion,
  UpgradeConfirmationDecision,
  UpgradeConfirmationReason,
  UpgradeMigrationSuggestionType,
  UpgradeSchemaDiffType,
} from "../../constants/schema-upgrade.constant.js";
import type { GovernorConfig } from "./governor.interface.js";

/**
 * Defines one schema diff row for upgrade analysis.
 */
export interface UpgradeSchemaDiffItem {
  path: string;
  diffType: UpgradeSchemaDiffType;
  reason: string;
  fromValue?: unknown;
  toValue?: unknown;
}

/**
 * Defines one migration suggestion produced by upgrade analysis.
 */
export interface UpgradeMigrationSuggestion {
  suggestionId: string;
  path: string;
  suggestionType: UpgradeMigrationSuggestionType;
  reason: string;
  fromValue?: unknown;
  toValue?: unknown;
}

/**
 * Defines one manual confirmation requirement produced by upgrade analysis.
 */
export interface UpgradeConfirmationItem {
  reason: UpgradeConfirmationReason;
  message: string;
  paths: string[];
  blocking: boolean;
}

/**
 * Defines upgrade analysis input payload.
 */
export interface UpgradeSchemaDiffOptions {
  sourceConfig: GovernorConfig;
  targetVersion?: GovernorSchemaVersion;
}

/**
 * Defines upgrade analysis output payload.
 */
export interface UpgradeSchemaDiffResult {
  sourceVersion: string;
  targetVersion: GovernorSchemaVersion;
  diffs: UpgradeSchemaDiffItem[];
  suggestions: UpgradeMigrationSuggestion[];
  confirmationDecision: UpgradeConfirmationDecision;
  confirmationItems: UpgradeConfirmationItem[];
  autoMigratedConfig: GovernorConfig;
}
