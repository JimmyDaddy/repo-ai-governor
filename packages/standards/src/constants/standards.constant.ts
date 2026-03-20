import { DEFAULT_I18N_FALLBACK_LOCALE, DEFAULT_I18N_LOCALE } from "@repo-ai-governor/shared";

/**
 * Defines supported standards-pack source categories.
 */
export enum StandardsPackSource {
  OFFICIAL = "official",
  TEAM = "team",
  REPOSITORY = "repository",
}

/**
 * Defines supported standards-pack scope values.
 */
export enum StandardsPackScope {
  GLOBAL = "global",
  TEAM = "team",
  REPOSITORY = "repository",
}

/**
 * Defines lifecycle status values for standards packs.
 */
export enum StandardsPackStatus {
  ACTIVE = "active",
  FROZEN = "frozen",
  DEPRECATED = "deprecated",
}

/**
 * Defines render targets for one semantic standards rule.
 */
export enum StandardsRenderTarget {
  HUMAN = "human",
  AI = "ai",
  AGENTS = "agents",
}

/**
 * Defines rule severity used by standards governance.
 */
export enum StandardsRuleSeverity {
  REQUIRED = "required",
  RECOMMENDED = "recommended",
  ADVISORY = "advisory",
}

/**
 * Defines conflict classes used by standards-upgrade UX.
 */
export enum StandardsUpgradeConflictLevel {
  BLOCK = "block",
  AUTO_FIXABLE = "auto_fixable",
  ADVISORY = "advisory",
}

/**
 * Defines change types tracked during standards-pack upgrades.
 */
export enum StandardsUpgradeChangeType {
  ADDED = "added",
  REMOVED = "removed",
  VERSION_CHANGED = "version_changed",
  SOURCE_CHANGED = "source_changed",
  SCOPE_CHANGED = "scope_changed",
}

/**
 * Defines required-action summary for one upgrade plan.
 */
export enum StandardsUpgradeRequiredAction {
  ALLOW = "allow",
  CONFIRM = "confirm",
  BLOCK = "block",
}

/**
 * Defines supported version pin modes for standards packs.
 */
export enum StandardsVersionPinMode {
  MAJOR_LOCKED = "major_locked",
  EXACT_VERSION = "exact_version",
}

/**
 * Defines rollback strategies for failed upgrades.
 */
export enum StandardsUpgradeRollbackStrategy {
  RESTORE_PREVIOUS_SNAPSHOT = "restore_previous_snapshot",
}

/**
 * Defines default locale policy used by rule renderer.
 */
export const DEFAULT_STANDARDS_RENDER_LOCALE = DEFAULT_I18N_LOCALE;
export const DEFAULT_STANDARDS_FALLBACK_LOCALE = DEFAULT_I18N_FALLBACK_LOCALE;
export const DEFAULT_AGENTS_PROJECTION_TARGET = "AGENTS.md";
export const DEFAULT_STANDARDS_VERSION_PIN_MODE = StandardsVersionPinMode.MAJOR_LOCKED;
export const DEFAULT_STANDARDS_ALLOW_MINOR_AUTO_UPGRADE = true;
export const DEFAULT_STANDARDS_ALLOW_PATCH_AUTO_UPGRADE = true;

/**
 * Defines metadata keys rendered in AGENTS projection header.
 */
export enum AgentsProjectionMetadataKey {
  PROJECTION_TARGET = "projection_target",
  PROJECTED_AT = "projected_at",
  LOCALE = "locale",
  SOURCE_PACK_REFS = "source_pack_refs",
  PROJECTION_PARITY = "projection_parity",
}

/**
 * Defines runtime enum value sets for payload validation.
 */
export const STANDARDS_PACK_SOURCE_VALUES = new Set<string>(Object.values(StandardsPackSource));
export const STANDARDS_PACK_SCOPE_VALUES = new Set<string>(Object.values(StandardsPackScope));
export const STANDARDS_PACK_STATUS_VALUES = new Set<string>(Object.values(StandardsPackStatus));
export const STANDARDS_RENDER_TARGET_VALUES = new Set<string>(Object.values(StandardsRenderTarget));
export const STANDARDS_RULE_SEVERITY_VALUES = new Set<string>(Object.values(StandardsRuleSeverity));
export const STANDARDS_UPGRADE_CONFLICT_LEVEL_VALUES = new Set<string>(
  Object.values(StandardsUpgradeConflictLevel),
);
export const STANDARDS_UPGRADE_CHANGE_TYPE_VALUES = new Set<string>(
  Object.values(StandardsUpgradeChangeType),
);
export const STANDARDS_UPGRADE_REQUIRED_ACTION_VALUES = new Set<string>(
  Object.values(StandardsUpgradeRequiredAction),
);
export const STANDARDS_VERSION_PIN_MODE_VALUES = new Set<string>(
  Object.values(StandardsVersionPinMode),
);
