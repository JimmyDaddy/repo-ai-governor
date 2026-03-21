import { DefaultRoleProfileId, RoleProfileStatus, RoleSource } from "@repo-ai-governor/shared";
import type { RoleProfile } from "../types/index.js";

/**
 * Re-exports baseline naming guard for role-profile identifiers.
 */
export { ROLE_PROFILE_ID_PATTERN } from "@repo-ai-governor/shared";

/**
 * Re-exports baseline naming guard for role-profile semantic versions.
 */
export { ROLE_PROFILE_VERSION_PATTERN } from "@repo-ai-governor/shared";

/**
 * Defines default role-profile version used by built-in role catalog.
 */
export const DEFAULT_ROLE_PROFILE_VERSION = "1.0.0";

/**
 * Creates immutable baseline role profiles used when no custom profiles are configured.
 * @returns Default role profile catalog clone.
 */
export function createDefaultRoleProfiles(): RoleProfile[] {
  return [
    createDefaultRoleProfile(
      DefaultRoleProfileId.PLANNER,
      "Planner",
      ["breakdown_requirements", "build_delivery_plan"],
      ["structured_output", "parallel_task"],
      ["read", "edit", "test"],
    ),
    createDefaultRoleProfile(
      DefaultRoleProfileId.ARCHITECT,
      "Architect",
      ["design_solution", "review_constraints"],
      ["structured_output", "tool_calling"],
      ["read", "edit", "test"],
    ),
    createDefaultRoleProfile(
      DefaultRoleProfileId.CODER,
      "Coder",
      ["implement_changes", "maintain_contracts"],
      ["tool_calling", "streaming"],
      ["read", "edit", "test"],
    ),
    createDefaultRoleProfile(
      DefaultRoleProfileId.TESTER,
      "Tester",
      ["author_tests", "run_regression"],
      ["tool_calling", "parallel_task"],
      ["read", "edit", "test"],
    ),
    createDefaultRoleProfile(
      DefaultRoleProfileId.REVIEWER,
      "Reviewer",
      ["review_changes", "identify_risks"],
      ["structured_output", "parallel_task"],
      ["read", "edit", "test"],
    ),
    createDefaultRoleProfile(
      DefaultRoleProfileId.VERIFIER,
      "Verifier",
      ["verify_gate_results", "confirm_delivery_readiness"],
      ["structured_output", "tool_calling"],
      ["read", "test"],
    ),
  ];
}

/**
 * Creates one default role-profile definition row.
 * @param roleProfileId Stable role-profile identifier.
 * @param displayName Human-readable display name.
 * @param responsibilities Baseline responsibilities list.
 * @param capabilities Baseline capability list.
 * @param permissionCeiling Baseline permission ceiling list.
 * @returns Default role-profile definition.
 */
function createDefaultRoleProfile(
  roleProfileId: DefaultRoleProfileId,
  displayName: string,
  responsibilities: string[],
  capabilities: string[],
  permissionCeiling: string[],
): RoleProfile {
  return {
    roleProfileId,
    roleProfileVersion: DEFAULT_ROLE_PROFILE_VERSION,
    displayName,
    responsibilities,
    capabilities,
    permissionCeiling,
    roleSource: RoleSource.DEFAULT,
    status: RoleProfileStatus.ACTIVE,
    lifecycle: {
      aliases: [],
      supersedes: [],
    },
  };
}
