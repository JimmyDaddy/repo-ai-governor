import type { UpgradeMigrationSuggestionType } from "../../constants/schema-upgrade.constant.js";

export interface UpgradeMigrationSuggestion {
  suggestionId: string;
  path: string;
  suggestionType: UpgradeMigrationSuggestionType;
  reason: string;
  fromValue?: unknown;
  toValue?: unknown;
}
