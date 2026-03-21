/**
 * Defines origin categories for role profiles.
 *
 * Why this exists:
 * role governance decisions rely on stable source tags to separate built-in
 * defaults from repository-specific custom profiles.
 */
export enum RoleSource {
  DEFAULT = "default",
  CUSTOM = "custom",
}

/**
 * Defines baseline naming guard for role-profile identifiers.
 *
 * Why this exists:
 * config and runtime layers must enforce the same identifier contract to avoid
 * accepting invalid role ids during schema validation and failing later.
 */
export const ROLE_PROFILE_ID_PATTERN = /^[a-z][a-z0-9-]*$/u;

/**
 * Defines baseline naming guard for role-profile semantic versions.
 *
 * Why this exists:
 * keeping semver format checks centralized prevents config/runtime drift for
 * role profile lifecycle and compatibility decisions.
 */
export const ROLE_PROFILE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/u;

/**
 * Defines lifecycle states for role profiles.
 *
 * Why this exists:
 * lifecycle-aware status values avoid ad-hoc strings and keep migration semantics
 * consistent across config, runtime, and audit outputs.
 */
export enum RoleProfileStatus {
  ACTIVE = "active",
  DEPRECATED = "deprecated",
  RETIRED = "retired",
}

/**
 * Defines built-in role-profile identifiers shipped by default registry baseline.
 */
export enum DefaultRoleProfileId {
  PLANNER = "planner-default",
  ARCHITECT = "architect-default",
  CODER = "coder-default",
  TESTER = "tester-default",
  REVIEWER = "reviewer-default",
  VERIFIER = "verifier-default",
}
