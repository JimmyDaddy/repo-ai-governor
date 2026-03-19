import type {
  GovernorSchemaVersion,
  UpgradeConfirmationDecision,
} from "../../constants/schema-upgrade.constant.js";
import type { GovernorConfig } from "./governor-config.interface.js";
import type { UpgradeConfirmationItem } from "./upgrade-confirmation-item.interface.js";
import type { UpgradeMigrationSuggestion } from "./upgrade-migration-suggestion.interface.js";
import type { UpgradeSchemaDiffItem } from "./upgrade-schema-diff-item.interface.js";

export interface UpgradeSchemaDiffResult {
  sourceVersion: string;
  targetVersion: GovernorSchemaVersion;
  diffs: UpgradeSchemaDiffItem[];
  suggestions: UpgradeMigrationSuggestion[];
  confirmationDecision: UpgradeConfirmationDecision;
  confirmationItems: UpgradeConfirmationItem[];
  autoMigratedConfig: GovernorConfig;
}
