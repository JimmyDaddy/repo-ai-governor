import { DEFAULT_I18N_FALLBACK_LOCALE, DEFAULT_I18N_LOCALE } from "../../../shared/src/index.js";

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
 * Defines default locale policy used by rule renderer.
 */
export const DEFAULT_STANDARDS_RENDER_LOCALE = DEFAULT_I18N_LOCALE;
export const DEFAULT_STANDARDS_FALLBACK_LOCALE = DEFAULT_I18N_FALLBACK_LOCALE;

/**
 * Defines runtime enum value sets for payload validation.
 */
export const STANDARDS_PACK_SOURCE_VALUES = new Set<string>(Object.values(StandardsPackSource));
export const STANDARDS_PACK_SCOPE_VALUES = new Set<string>(Object.values(StandardsPackScope));
export const STANDARDS_PACK_STATUS_VALUES = new Set<string>(Object.values(StandardsPackStatus));
export const STANDARDS_RENDER_TARGET_VALUES = new Set<string>(Object.values(StandardsRenderTarget));
export const STANDARDS_RULE_SEVERITY_VALUES = new Set<string>(Object.values(StandardsRuleSeverity));
