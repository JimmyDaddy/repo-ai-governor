import {
  GovernorErrorCode,
  RoleProfileStatus,
  RoleSource,
  RuntimeError,
} from "@repo-ai-governor/shared";
import {
  ROLE_PROFILE_ID_PATTERN,
  ROLE_PROFILE_VERSION_PATTERN,
  createDefaultRoleProfiles,
} from "./constants/index.js";
import type {
  RoleProfile,
  RoleProfileById,
  RoleProfileIdByAlias,
  RoleRegistryOptions,
  RoleRegistryResolveContext,
  RoleRegistryResolveResult,
} from "./types/index.js";

const ROLE_SOURCE_VALUES = new Set<string>(Object.values(RoleSource));
const ROLE_PROFILE_STATUS_VALUES = new Set<string>(Object.values(RoleProfileStatus));

/**
 * Resolves and governs role profiles used by runtime stage routing.
 *
 * Why this exists:
 * role profile definitions and lifecycle semantics should be centralized so
 * runtime, policy, and adapter layers consume one deterministic source.
 */
export class RoleRegistry {
  private readonly profileById: RoleProfileById = new Map();
  private readonly profileIdByAlias: RoleProfileIdByAlias = new Map();

  /**
   * Creates a role registry with default and optional custom role profiles.
   * @param options Optional role profile overrides.
   */
  public constructor(options: RoleRegistryOptions = {}) {
    const defaultProfiles = options.defaultProfiles ?? createDefaultRoleProfiles();
    const customProfiles = options.customProfiles ?? [];

    this.registerProfiles(defaultProfiles, "defaultProfiles");
    this.registerProfiles(customProfiles, "customProfiles");
    this.validateReplacementTargets();
  }

  /**
   * Lists all registered role profiles.
   * @returns Snapshot list of registered profiles.
   */
  public listProfiles(): RoleProfile[] {
    return Array.from(this.profileById.values()).map((profile) => this.cloneProfile(profile));
  }

  /**
   * Resolves one role profile by id or alias.
   * @param requestedRoleProfileId Requested profile id or alias.
   * @param context Optional context attached to audit metadata.
   * @returns Resolved role profile with audit record, or null when not found.
   */
  public resolve(
    requestedRoleProfileId: string,
    context: RoleRegistryResolveContext = {},
  ): RoleRegistryResolveResult | null {
    const normalizedRequestedId = this.readRequiredString(
      requestedRoleProfileId,
      "requestedRoleProfileId",
    );

    let resolvedByAlias = false;
    let profile = this.profileById.get(normalizedRequestedId);

    if (!profile) {
      const mappedRoleProfileId = this.profileIdByAlias.get(normalizedRequestedId);
      if (!mappedRoleProfileId) {
        return null;
      }

      profile = this.profileById.get(mappedRoleProfileId);
      resolvedByAlias = true;
    }

    if (!profile) {
      return null;
    }

    const replacementResult = this.resolveReplacementProfile(profile);
    const resolvedProfile = replacementResult.profile;

    if (resolvedProfile.status === RoleProfileStatus.RETIRED) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_RETIRED,
        `Role profile "${resolvedProfile.roleProfileId}" is retired and cannot be resolved.`,
        {
          requestedRoleProfileId: normalizedRequestedId,
          resolvedRoleProfileId: resolvedProfile.roleProfileId,
        },
      );
    }

    const resolvedAt = new Date().toISOString();
    return {
      profile: this.cloneProfile(resolvedProfile),
      auditRecord: {
        requestedRoleProfileId: normalizedRequestedId,
        resolvedRoleProfileId: resolvedProfile.roleProfileId,
        roleProfileVersion: resolvedProfile.roleProfileVersion,
        roleSource: resolvedProfile.roleSource,
        roleProfileStatus: resolvedProfile.status,
        resolvedByAlias,
        resolvedByReplacement: replacementResult.resolvedByReplacement,
        resolvedAt,
        ...(context.processId ? { processId: context.processId } : {}),
        ...(context.executionId ? { executionId: context.executionId } : {}),
        ...(context.stageId ? { stageId: context.stageId } : {}),
        ...(context.routeKey ? { routeKey: context.routeKey } : {}),
      },
    };
  }

  /**
   * Resolves one role profile and throws when profile does not exist.
   * @param requestedRoleProfileId Requested profile id or alias.
   * @param context Optional context attached to audit metadata.
   * @returns Resolved role profile and audit record.
   */
  public resolveOrThrow(
    requestedRoleProfileId: string,
    context: RoleRegistryResolveContext = {},
  ): RoleRegistryResolveResult {
    const resolvedRole = this.resolve(requestedRoleProfileId, context);
    if (resolvedRole) {
      return resolvedRole;
    }

    throw new RuntimeError(
      GovernorErrorCode.ROLE_REGISTRY_PROFILE_NOT_FOUND,
      `Role profile "${requestedRoleProfileId}" is not registered.`,
      {
        requestedRoleProfileId,
      },
    );
  }

  /**
   * Registers one profile list into registry maps.
   * @param profiles Profile list.
   * @param pointer Pointer label for validation errors.
   */
  private registerProfiles(profiles: RoleProfile[], pointer: string): void {
    if (!Array.isArray(profiles)) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer} must be an array of role profiles.`,
        {
          pointer,
        },
      );
    }

    profiles.forEach((profile, index) => {
      const profilePointer = `${pointer}[${index}]`;
      const normalizedProfile = this.normalizeProfile(profile, profilePointer);
      this.registerOneProfile(normalizedProfile, profilePointer);
    });
  }

  /**
   * Registers one validated role profile to canonical and alias indexes.
   * @param profile Normalized role profile.
   * @param pointer Pointer label for validation errors.
   */
  private registerOneProfile(profile: RoleProfile, pointer: string): void {
    if (this.profileById.has(profile.roleProfileId)) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_DUPLICATE,
        `Duplicate role profile id "${profile.roleProfileId}" is not allowed.`,
        {
          pointer,
          roleProfileId: profile.roleProfileId,
        },
      );
    }

    for (const alias of profile.lifecycle.aliases) {
      const aliasOwnerRoleProfileId = this.profileIdByAlias.get(alias);
      if (aliasOwnerRoleProfileId || this.profileById.has(alias)) {
        throw new RuntimeError(
          GovernorErrorCode.ROLE_REGISTRY_PROFILE_DUPLICATE,
          `Alias "${alias}" conflicts with another role profile identifier.`,
          {
            pointer,
            alias,
            aliasOwnerRoleProfileId,
          },
        );
      }
    }

    this.profileById.set(profile.roleProfileId, profile);
    for (const alias of profile.lifecycle.aliases) {
      this.profileIdByAlias.set(alias, profile.roleProfileId);
    }
  }

  /**
   * Validates replacement targets after all profile rows are registered.
   */
  private validateReplacementTargets(): void {
    for (const profile of this.profileById.values()) {
      const replacedBy = profile.lifecycle.replacedBy;
      if (!replacedBy) {
        continue;
      }

      if (!this.profileById.has(replacedBy)) {
        throw new RuntimeError(
          GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
          `Role profile "${profile.roleProfileId}" declares missing replacement "${replacedBy}".`,
          {
            roleProfileId: profile.roleProfileId,
            replacedBy,
          },
        );
      }
    }
  }

  /**
   * Normalizes one role profile and validates lifecycle constraints.
   * @param profileCandidate Raw role profile candidate.
   * @param pointer Pointer label for validation errors.
   * @returns Normalized role profile.
   */
  private normalizeProfile(profileCandidate: RoleProfile, pointer: string): RoleProfile {
    if (!profileCandidate || typeof profileCandidate !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer} must be an object.`,
        {
          pointer,
        },
      );
    }

    const roleProfileId = this.readRequiredString(
      profileCandidate.roleProfileId,
      `${pointer}.roleProfileId`,
    );
    if (!ROLE_PROFILE_ID_PATTERN.test(roleProfileId)) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer}.roleProfileId has unsupported format.`,
        {
          pointer,
          roleProfileId,
        },
      );
    }

    const roleProfileVersion = this.readRequiredString(
      profileCandidate.roleProfileVersion,
      `${pointer}.roleProfileVersion`,
    );
    if (!ROLE_PROFILE_VERSION_PATTERN.test(roleProfileVersion)) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer}.roleProfileVersion must use semantic version format (x.y.z).`,
        {
          pointer,
          roleProfileVersion,
        },
      );
    }

    const displayName = this.readRequiredString(
      profileCandidate.displayName,
      `${pointer}.displayName`,
    );
    const responsibilities = this.normalizeStringList(
      profileCandidate.responsibilities,
      `${pointer}.responsibilities`,
    );
    const capabilities = this.normalizeStringList(
      profileCandidate.capabilities,
      `${pointer}.capabilities`,
    );
    const permissionCeiling = this.normalizeStringList(
      profileCandidate.permissionCeiling,
      `${pointer}.permissionCeiling`,
    );

    const roleSource = this.readRequiredString(
      profileCandidate.roleSource,
      `${pointer}.roleSource`,
    );
    if (!ROLE_SOURCE_VALUES.has(roleSource)) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer}.roleSource must be one of: ${Array.from(ROLE_SOURCE_VALUES).join(", ")}.`,
        {
          pointer,
          roleSource,
        },
      );
    }

    const status = this.readRequiredString(profileCandidate.status, `${pointer}.status`);
    if (!ROLE_PROFILE_STATUS_VALUES.has(status)) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer}.status must be one of: ${Array.from(ROLE_PROFILE_STATUS_VALUES).join(", ")}.`,
        {
          pointer,
          status,
        },
      );
    }

    const lifecycleRecord: Partial<RoleProfile["lifecycle"]> =
      profileCandidate.lifecycle && typeof profileCandidate.lifecycle === "object"
        ? profileCandidate.lifecycle
        : {};
    const aliases = this.normalizeStringList(
      lifecycleRecord.aliases ?? [],
      `${pointer}.lifecycle.aliases`,
    );
    const supersedes = this.normalizeStringList(
      lifecycleRecord.supersedes ?? [],
      `${pointer}.lifecycle.supersedes`,
    );
    const replacedByRaw = lifecycleRecord.replacedBy;
    const replacedBy =
      replacedByRaw === undefined
        ? undefined
        : this.readRequiredString(replacedByRaw, `${pointer}.lifecycle.replacedBy`);
    const deprecatedAtRaw = lifecycleRecord.deprecatedAt;
    const deprecatedAt =
      deprecatedAtRaw === undefined
        ? undefined
        : this.readRequiredString(deprecatedAtRaw, `${pointer}.lifecycle.deprecatedAt`);
    const migrationNotesRaw = lifecycleRecord.migrationNotes;
    const migrationNotes =
      migrationNotesRaw === undefined
        ? undefined
        : this.readRequiredString(migrationNotesRaw, `${pointer}.lifecycle.migrationNotes`);

    if (aliases.includes(roleProfileId)) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer}.lifecycle.aliases must not include roleProfileId itself.`,
        {
          pointer,
          roleProfileId,
        },
      );
    }

    if (replacedBy === roleProfileId) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer}.lifecycle.replacedBy must not equal roleProfileId.`,
        {
          pointer,
          roleProfileId,
        },
      );
    }

    return {
      roleProfileId,
      roleProfileVersion,
      displayName,
      responsibilities,
      capabilities,
      permissionCeiling,
      roleSource: roleSource as RoleSource,
      status: status as RoleProfileStatus,
      lifecycle: {
        aliases,
        supersedes,
        ...(replacedBy ? { replacedBy } : {}),
        ...(deprecatedAt ? { deprecatedAt } : {}),
        ...(migrationNotes ? { migrationNotes } : {}),
      },
    };
  }

  /**
   * Resolves replacement profile when deprecated profile declares one.
   * @param profile Initial resolved profile.
   * @returns Possibly replaced profile with replacement marker.
   */
  private resolveReplacementProfile(profile: RoleProfile): {
    profile: RoleProfile;
    resolvedByReplacement: boolean;
  } {
    if (profile.status !== RoleProfileStatus.DEPRECATED || !profile.lifecycle.replacedBy) {
      return {
        profile,
        resolvedByReplacement: false,
      };
    }

    const replacementProfile = this.profileById.get(profile.lifecycle.replacedBy);
    if (!replacementProfile) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `Role profile "${profile.roleProfileId}" replacement target is missing.`,
        {
          roleProfileId: profile.roleProfileId,
          replacedBy: profile.lifecycle.replacedBy,
        },
      );
    }

    return {
      profile: replacementProfile,
      resolvedByReplacement: true,
    };
  }

  /**
   * Normalizes one string list into deduplicated trim-safe values.
   * @param values Raw string list.
   * @param pointer Pointer label for validation errors.
   * @returns Normalized string list.
   */
  private normalizeStringList(values: unknown, pointer: string): string[] {
    if (!Array.isArray(values)) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer} must be an array of strings.`,
        {
          pointer,
        },
      );
    }

    const normalizedValues = values.map((value, index) =>
      this.readRequiredString(value, `${pointer}[${index}]`),
    );

    return Array.from(new Set(normalizedValues));
  }

  /**
   * Reads one required string field and trims whitespace.
   * @param candidate Raw value.
   * @param pointer Pointer label for validation errors.
   * @returns Trimmed non-empty string.
   */
  private readRequiredString(candidate: unknown, pointer: string): string {
    if (typeof candidate !== "string") {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer} must be a non-empty string.`,
        {
          pointer,
        },
      );
    }

    const normalizedValue = candidate.trim();
    if (!normalizedValue) {
      throw new RuntimeError(
        GovernorErrorCode.ROLE_REGISTRY_PROFILE_INVALID,
        `${pointer} must be a non-empty string.`,
        {
          pointer,
        },
      );
    }

    return normalizedValue;
  }

  /**
   * Clones one role profile for safe external consumption.
   * @param profile Internal profile record.
   * @returns Deep-cloned role profile.
   */
  private cloneProfile(profile: RoleProfile): RoleProfile {
    return {
      ...profile,
      responsibilities: [...profile.responsibilities],
      capabilities: [...profile.capabilities],
      permissionCeiling: [...profile.permissionCeiling],
      lifecycle: {
        ...profile.lifecycle,
        aliases: [...profile.lifecycle.aliases],
        supersedes: [...profile.lifecycle.supersedes],
      },
    };
  }
}
