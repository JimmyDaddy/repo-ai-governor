import { WorkspaceMigrationPolicy } from "../../../shared/src/constants/index.js";

export enum GovernorSchemaVersion {
  V1_0 = "1.0",
  V1_1 = "1.1",
}

export const GOVERNOR_LATEST_SCHEMA_VERSION = GovernorSchemaVersion.V1_1;
export const SUPPORTED_GOVERNOR_SCHEMA_VERSIONS = new Set<string>(
  Object.values(GovernorSchemaVersion),
);

export enum UpgradeSchemaDiffType {
  ADDED = "added",
  CHANGED = "changed",
  REMOVED = "removed",
}

export enum UpgradeMigrationSuggestionType {
  AUTO_APPLY = "auto_apply",
  CONFIRM_REQUIRED = "confirm_required",
  MANUAL_ACTION = "manual_action",
}

export enum UpgradeConfirmationDecision {
  ALLOW = "allow",
  CONFIRM = "confirm",
  BLOCK = "block",
}

export enum UpgradeConfirmationReason {
  SCHEMA_VERSION_BUMP = "schema_version_bump",
  MANUAL_MIGRATION_REVIEW = "manual_migration_review",
}

export const DEFAULT_WORKSPACE_MIGRATION_POLICY =
  WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK;
