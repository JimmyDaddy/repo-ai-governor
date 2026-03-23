import { ConfigError, GovernorErrorCode } from "@repo-ai-governor/shared";
import type {
  AdaptersConfig,
  GovernorConfig,
  GovernorProfile,
  ResolvedConfig,
} from "./types/interfaces/index.js";

/**
 * Resolves active profile overrides into a single effective config object.
 *
 * Why this exists:
 * profile selection is a governance decision point, so merge precedence must stay
 * deterministic and reusable across command surfaces.
 */
export class ProfileResolver {
  /**
   * Resolves final config from base config and optional runtime profile id.
   * @param baseConfig Baseline config loaded from schema-validated source.
   * @param requestedProfileId Optional profile id from runtime flags/env.
   * @returns Effective config and selected profile id for audit traceability.
   */
  public resolve(baseConfig: GovernorConfig, requestedProfileId?: string): ResolvedConfig {
    const profileId = requestedProfileId ?? baseConfig.activeProfile ?? null;

    if (!profileId) {
      return {
        profileId: null,
        config: baseConfig,
      };
    }

    const selectedProfile = baseConfig.profiles?.[profileId];
    if (!selectedProfile) {
      throw new ConfigError(
        GovernorErrorCode.CONFIG_PROFILE_NOT_FOUND,
        `Profile '${profileId}' was not found in governor config.`,
        { profileId },
      );
    }

    return {
      profileId,
      config: this.mergeProfile(baseConfig, selectedProfile),
    };
  }

  /**
   * Merges allowed profile fields while keeping base config as the stable source.
   * @param baseConfig Base config from repository facts.
   * @param profile Profile overrides to apply.
   * @returns New config object with deterministic override precedence.
   */
  private mergeProfile(baseConfig: GovernorConfig, profile: GovernorProfile): GovernorConfig {
    const mergedMemory = profile.memory
      ? {
          ...(baseConfig.memory ?? {}),
          ...profile.memory,
        }
      : baseConfig.memory;
    const mergedAdapters = this.mergeAdapters(baseConfig.adapters, profile.adapters);

    return {
      ...baseConfig,
      workspace: {
        ...baseConfig.workspace,
        ...(profile.workspace ?? {}),
      },
      i18n: {
        ...baseConfig.i18n,
        ...(profile.i18n ?? {}),
      },
      ...(mergedMemory ? { memory: mergedMemory as GovernorConfig["memory"] } : {}),
      ...(mergedAdapters ? { adapters: mergedAdapters as GovernorConfig["adapters"] } : {}),
    };
  }

  /**
   * Merges optional adapters profile overrides onto base adapters config.
   * @param baseAdapters Base adapters config.
   * @param profileAdapters Profile-level adapters override config.
   * @returns Merged adapters config when base or profile defines adapters.
   */
  private mergeAdapters(
    baseAdapters: GovernorConfig["adapters"],
    profileAdapters: GovernorProfile["adapters"],
  ): Partial<AdaptersConfig> | undefined {
    if (!baseAdapters && !profileAdapters) {
      return undefined;
    }

    const baseToolsById = new Map((baseAdapters?.tools ?? []).map((tool) => [tool.toolId, tool]));
    for (const overrideTool of profileAdapters?.tools ?? []) {
      baseToolsById.set(overrideTool.toolId, {
        ...(baseToolsById.get(overrideTool.toolId) ?? {}),
        ...overrideTool,
        ...(overrideTool.unavailableReasons
          ? {
              unavailableReasons: [...overrideTool.unavailableReasons],
            }
          : {}),
      });
    }

    const hasProfileRoles = profileAdapters?.roles !== undefined;
    const hasProfileRouting = profileAdapters?.routing !== undefined;
    const mergedRoles = (profileAdapters?.roles ?? baseAdapters?.roles)?.map((role) => ({
      ...role,
      requiredCapabilities: [...role.requiredCapabilities],
    }));
    const mergedRoleBindings = {
      ...(baseAdapters?.routing?.roleBindings ?? {}),
      ...Object.fromEntries(
        Object.entries(profileAdapters?.routing?.roleBindings ?? {}).map(([roleId, binding]) => [
          roleId,
          {
            ...binding,
            ...(binding.fallbackSurfaces
              ? {
                  fallbackSurfaces: [...binding.fallbackSurfaces],
                }
              : {}),
          },
        ]),
      ),
    };

    return {
      ...(baseAdapters ?? {}),
      ...(profileAdapters ?? {}),
      ...(mergedRoles || hasProfileRoles
        ? {
            roles: mergedRoles ?? [],
          }
        : {}),
      ...(Object.keys(mergedRoleBindings).length > 0 || hasProfileRouting
        ? {
            routing: {
              roleBindings: mergedRoleBindings,
            },
          }
        : {}),
      ...(baseToolsById.size > 0
        ? {
            tools: Array.from(baseToolsById.values()).map((tool) => ({
              ...tool,
              ...(tool.unavailableReasons
                ? {
                    unavailableReasons: [...tool.unavailableReasons],
                  }
                : {}),
            })),
          }
        : {}),
    };
  }
}
