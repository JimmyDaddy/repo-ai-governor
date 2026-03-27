import type { RoleProfileStatus, RoleSource } from '@repo-ai-governor/shared';

/**
 * Describes lifecycle metadata attached to role profiles.
 */
export interface RoleProfileLifecycle {
  aliases: string[];
  supersedes: string[];
  replacedBy?: string;
  deprecatedAt?: string;
  migrationNotes?: string;
}

/**
 * Describes one role profile consumed by runtime role routing.
 */
export interface RoleProfile {
  roleProfileId: string;
  roleProfileVersion: string;
  displayName: string;
  responsibilities: string[];
  capabilities: string[];
  permissionCeiling: string[];
  roleSource: RoleSource;
  status: RoleProfileStatus;
  lifecycle: RoleProfileLifecycle;
}

/**
 * Describes optional context attached to one role resolve request.
 */
export interface RoleRegistryResolveContext {
  processId?: string;
  executionId?: string;
  stageId?: string;
  routeKey?: string;
}

/**
 * Describes audit payload emitted for one role resolve operation.
 */
export interface RoleRegistryAuditRecord {
  requestedRoleProfileId: string;
  resolvedRoleProfileId: string;
  roleProfileVersion: string;
  roleSource: RoleSource;
  roleProfileStatus: RoleProfileStatus;
  resolvedByAlias: boolean;
  resolvedByReplacement: boolean;
  resolvedAt: string;
  processId?: string;
  executionId?: string;
  stageId?: string;
  routeKey?: string;
}

/**
 * Describes normalized output returned by role resolve operations.
 */
export interface RoleRegistryResolveResult {
  profile: RoleProfile;
  auditRecord: RoleRegistryAuditRecord;
}

/**
 * Describes role-registry construction options.
 */
export interface RoleRegistryOptions {
  defaultProfiles?: RoleProfile[];
  customProfiles?: RoleProfile[];
}
