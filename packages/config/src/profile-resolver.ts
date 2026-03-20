import { ConfigError, GovernorErrorCode } from "@repo-ai-governor/shared";
import type { GovernorConfig, GovernorProfile, ResolvedConfig } from "./types/interfaces/index.js";

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
    };
  }
}
