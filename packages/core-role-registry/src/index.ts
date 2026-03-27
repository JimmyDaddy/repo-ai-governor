export {
  DEFAULT_ROLE_PROFILE_VERSION,
  ROLE_PROFILE_ID_PATTERN,
  ROLE_PROFILE_VERSION_PATTERN,
  createDefaultRoleProfiles,
} from './constants/index.js';
export { RoleRegistry } from './role-registry.js';
export type {
  RoleProfile,
  RoleProfileById,
  RoleProfileIdByAlias,
  RoleProfileLifecycle,
  RoleRegistryAuditRecord,
  RoleRegistryOptions,
  RoleRegistryResolveContext,
  RoleRegistryResolveResult,
} from './types/index.js';
