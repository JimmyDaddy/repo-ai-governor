import type { RoleProfile } from "../interfaces/index.js";

/**
 * Defines registry map keyed by canonical role-profile identifier.
 */
export type RoleProfileById = Map<string, RoleProfile>;

/**
 * Defines alias map that points alias id to canonical role-profile identifier.
 */
export type RoleProfileIdByAlias = Map<string, string>;
