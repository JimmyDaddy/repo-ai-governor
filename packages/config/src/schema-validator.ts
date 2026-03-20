import {
  I18N_RUNTIME_ENGINE,
  MemoryStoreEngine,
  WorkspaceMigrationPolicy,
  WorkspaceMode,
} from "@repo-ai-governor/shared";
import { ConfigError, GovernorErrorCode } from "@repo-ai-governor/shared";
import { GovernorSchemaVersion, SUPPORTED_GOVERNOR_SCHEMA_VERSIONS } from "./constants/index.js";
import type {
  GovernorConfig,
  GovernorProfile,
  I18nConfig,
  MemoryConfig,
  WorkspaceConfig,
} from "./types/interfaces/index.js";

const WORKSPACE_MODE_VALUES = new Set<string>(Object.values(WorkspaceMode));
const WORKSPACE_MIGRATION_POLICY_VALUES = new Set<string>(Object.values(WorkspaceMigrationPolicy));
const MEMORY_STORE_ENGINE_VALUES = new Set<string>(Object.values(MemoryStoreEngine));

/**
 * Validates governor config payloads against the shared baseline contract.
 *
 * Why this exists:
 * keeping schema checks in one place prevents CLI/runtime flows from accepting
 * different field semantics for the same config file.
 */
export class SchemaValidator {
  /**
   * Ensures input config satisfies the baseline schema before downstream usage.
   * @param candidate Raw configuration object loaded from file or memory.
   * @returns Strongly-typed governor config when validation succeeds.
   */
  public validateOrThrow(candidate: unknown): GovernorConfig {
    const root = this.expectRecord(candidate, "/");

    const schemaVersion = this.resolveSchemaVersion(root.schemaVersion, "/schemaVersion");
    const workspace = this.validateWorkspace(
      root.workspace,
      "/workspace",
      false,
      schemaVersion,
    ) as WorkspaceConfig;
    const i18n = this.validateI18n(root.i18n, "/i18n", false) as I18nConfig;
    const memory = this.validateMemory(root.memory, "/memory", false) as
      | Partial<MemoryConfig>
      | undefined;
    const activeProfile = this.expectOptionalString(root.activeProfile, "/activeProfile");
    const profiles = this.validateProfiles(root.profiles, "/profiles", schemaVersion);

    this.assertNoUnknownKeys(
      root,
      new Set(["schemaVersion", "workspace", "i18n", "memory", "activeProfile", "profiles"]),
      "/",
    );

    return {
      schemaVersion,
      workspace,
      i18n,
      ...(memory ? { memory } : {}),
      ...(activeProfile ? { activeProfile } : {}),
      ...(profiles ? { profiles } : {}),
    };
  }

  /**
   * Parses profile map and validates each profile against the allowed override fields.
   * @param candidate Raw `profiles` field.
   * @param pointer Error pointer path.
   * @returns Profile dictionary when provided; otherwise undefined.
   */
  private validateProfiles(
    candidate: unknown,
    pointer: string,
    schemaVersion: GovernorSchemaVersion,
  ): Record<string, GovernorProfile> | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    const profileRecord = this.expectRecord(candidate, pointer);
    const profiles: Record<string, GovernorProfile> = {};

    for (const [profileId, profileValue] of Object.entries(profileRecord)) {
      const profilePointer = `${pointer}/${profileId}`;
      const profile = this.expectRecord(profileValue, profilePointer);
      this.assertNoUnknownKeys(profile, new Set(["workspace", "i18n", "memory"]), profilePointer);

      profiles[profileId] = {
        ...(profile.workspace !== undefined
          ? {
              workspace: this.validateWorkspace(
                profile.workspace,
                `${profilePointer}/workspace`,
                true,
                schemaVersion,
              ),
            }
          : {}),
        ...(profile.i18n !== undefined
          ? {
              i18n: this.validateI18n(profile.i18n, `${profilePointer}/i18n`, true),
            }
          : {}),
        ...(profile.memory !== undefined
          ? {
              memory: this.validateMemory(profile.memory, `${profilePointer}/memory`, true),
            }
          : {}),
      };
    }

    return profiles;
  }

  /**
   * Validates workspace shape and mode constraints.
   * @param candidate Raw workspace object or profile override.
   * @param pointer Error pointer path.
   * @param isPartial Whether required fields can be omitted for profile overrides.
   * @returns Typed workspace config object.
   */
  private validateWorkspace(
    candidate: unknown,
    pointer: string,
    isPartial: boolean,
    schemaVersion: GovernorSchemaVersion,
  ): WorkspaceConfig | Partial<WorkspaceConfig> {
    const workspace = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(
      workspace,
      new Set(["mode", "toolManagedRoot", "repoLocalRoot", "migrationPolicy"]),
      pointer,
    );

    const mode = this.expectOptionalString(workspace.mode, `${pointer}/mode`);
    if (!isPartial && !mode) {
      this.throwConfigSchemaValidationError(`${pointer}/mode is required.`, pointer);
    }
    const resolvedMode = this.resolveWorkspaceMode(mode, pointer);

    const toolManagedRoot = this.expectOptionalString(
      workspace.toolManagedRoot,
      `${pointer}/toolManagedRoot`,
    );
    const repoLocalRoot = this.expectOptionalString(
      workspace.repoLocalRoot,
      `${pointer}/repoLocalRoot`,
    );
    const migrationPolicy = this.expectOptionalString(
      workspace.migrationPolicy,
      `${pointer}/migrationPolicy`,
    );
    const resolvedMigrationPolicy = this.resolveWorkspaceMigrationPolicy(migrationPolicy, pointer);

    if (!isPartial && schemaVersion === GovernorSchemaVersion.V1_1 && !resolvedMigrationPolicy) {
      this.throwConfigSchemaValidationError(
        `${pointer}/migrationPolicy is required for schemaVersion ${schemaVersion}.`,
        pointer,
      );
    }

    return {
      ...(resolvedMode ? { mode: resolvedMode } : {}),
      ...(toolManagedRoot ? { toolManagedRoot } : {}),
      ...(repoLocalRoot ? { repoLocalRoot } : {}),
      ...(resolvedMigrationPolicy ? { migrationPolicy: resolvedMigrationPolicy } : {}),
    };
  }

  /**
   * Resolves and validates schema version against supported baseline set.
   * @param schemaVersionCandidate Raw schema version value.
   * @param pointer Error pointer path.
   * @returns Supported schema version enum.
   */
  private resolveSchemaVersion(
    schemaVersionCandidate: unknown,
    pointer: string,
  ): GovernorSchemaVersion {
    const schemaVersion = this.expectString(schemaVersionCandidate, pointer);
    if (SUPPORTED_GOVERNOR_SCHEMA_VERSIONS.has(schemaVersion)) {
      return schemaVersion as GovernorSchemaVersion;
    }

    throw new ConfigError(
      GovernorErrorCode.CONFIG_SCHEMA_VERSION_UNSUPPORTED,
      `${pointer} must be one of: ${Array.from(SUPPORTED_GOVERNOR_SCHEMA_VERSIONS).join(", ")}.`,
      {
        pointer,
        schemaVersion,
      },
    );
  }

  /**
   * Converts optional mode value to enum and throws on unsupported values.
   * @param mode Optional raw mode string from config.
   * @param pointer Error pointer path.
   * @returns Workspace mode enum when provided; otherwise undefined.
   */
  private resolveWorkspaceMode(
    mode: string | undefined,
    pointer: string,
  ): WorkspaceMode | undefined {
    if (mode === undefined) {
      return undefined;
    }

    if (!WORKSPACE_MODE_VALUES.has(mode)) {
      this.throwConfigSchemaValidationError(
        `${pointer}/mode must be one of: ${Array.from(WORKSPACE_MODE_VALUES).join(", ")}.`,
        pointer,
      );
    }

    return mode as WorkspaceMode;
  }

  /**
   * Converts optional migration policy to enum and throws on unsupported values.
   * @param migrationPolicy Optional raw migration policy value.
   * @param pointer Error pointer path.
   * @returns Workspace migration policy enum when provided; otherwise undefined.
   */
  private resolveWorkspaceMigrationPolicy(
    migrationPolicy: string | undefined,
    pointer: string,
  ): WorkspaceMigrationPolicy | undefined {
    if (migrationPolicy === undefined) {
      return undefined;
    }

    if (!WORKSPACE_MIGRATION_POLICY_VALUES.has(migrationPolicy)) {
      this.throwConfigSchemaValidationError(
        `${pointer}/migrationPolicy must be one of: ${Array.from(
          WORKSPACE_MIGRATION_POLICY_VALUES,
        ).join(", ")}.`,
        pointer,
      );
    }

    return migrationPolicy as WorkspaceMigrationPolicy;
  }

  /**
   * Validates i18n shape and baseline locale requirements.
   * @param candidate Raw i18n object or profile override.
   * @param pointer Error pointer path.
   * @param isPartial Whether required fields can be omitted for profile overrides.
   * @returns Typed i18n config object.
   */
  private validateI18n(
    candidate: unknown,
    pointer: string,
    isPartial: boolean,
  ): I18nConfig | Partial<I18nConfig> {
    const i18n = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(
      i18n,
      new Set(["runtimeEngine", "defaultLocale", "fallbackLocale", "supportedLocales"]),
      pointer,
    );

    const runtimeEngine = this.expectOptionalString(i18n.runtimeEngine, `${pointer}/runtimeEngine`);
    const defaultLocale = this.expectOptionalString(i18n.defaultLocale, `${pointer}/defaultLocale`);
    const fallbackLocale = this.expectOptionalString(
      i18n.fallbackLocale,
      `${pointer}/fallbackLocale`,
    );
    const supportedLocales = this.expectOptionalStringArray(
      i18n.supportedLocales,
      `${pointer}/supportedLocales`,
    );

    if (!isPartial) {
      if (!runtimeEngine) {
        this.throwConfigSchemaValidationError(`${pointer}/runtimeEngine is required.`, pointer);
      }
      if (runtimeEngine !== I18N_RUNTIME_ENGINE) {
        this.throwConfigSchemaValidationError(
          `${pointer}/runtimeEngine must be '${I18N_RUNTIME_ENGINE}'.`,
          pointer,
        );
      }
      if (!defaultLocale) {
        this.throwConfigSchemaValidationError(`${pointer}/defaultLocale is required.`, pointer);
      }
      if (!fallbackLocale) {
        this.throwConfigSchemaValidationError(`${pointer}/fallbackLocale is required.`, pointer);
      }
      if (!supportedLocales || supportedLocales.length === 0) {
        this.throwConfigSchemaValidationError(
          `${pointer}/supportedLocales must contain at least one locale.`,
          pointer,
        );
      }
    }

    if (runtimeEngine && runtimeEngine !== I18N_RUNTIME_ENGINE) {
      this.throwConfigSchemaValidationError(
        `${pointer}/runtimeEngine must be '${I18N_RUNTIME_ENGINE}'.`,
        pointer,
      );
    }

    return {
      ...(runtimeEngine ? { runtimeEngine: I18N_RUNTIME_ENGINE } : {}),
      ...(defaultLocale ? { defaultLocale } : {}),
      ...(fallbackLocale ? { fallbackLocale } : {}),
      ...(supportedLocales ? { supportedLocales } : {}),
    };
  }

  /**
   * Validates memory-store shape and engine constraints.
   * @param candidate Raw memory object or profile override.
   * @param pointer Error pointer path.
   * @param isPartial Whether required fields can be omitted for profile overrides.
   * @returns Typed memory config object when provided.
   */
  private validateMemory(
    candidate: unknown,
    pointer: string,
    isPartial: boolean,
  ): MemoryConfig | Partial<MemoryConfig> | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    const memory = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(memory, new Set(["storeEngine", "storeRoot"]), pointer);

    const storeEngine = this.expectOptionalString(memory.storeEngine, `${pointer}/storeEngine`);
    const storeRoot = this.expectOptionalString(memory.storeRoot, `${pointer}/storeRoot`);

    if (!isPartial && !storeEngine) {
      this.throwConfigSchemaValidationError(`${pointer}/storeEngine is required.`, pointer);
    }

    if (storeEngine && !MEMORY_STORE_ENGINE_VALUES.has(storeEngine)) {
      this.throwConfigSchemaValidationError(
        `${pointer}/storeEngine must be one of: ${Array.from(MEMORY_STORE_ENGINE_VALUES).join(", ")}.`,
        pointer,
      );
    }

    return {
      ...(storeEngine ? { storeEngine: storeEngine as MemoryStoreEngine } : {}),
      ...(storeRoot ? { storeRoot } : {}),
    };
  }

  /**
   * Asserts candidate is a plain object record.
   * @param candidate Value to validate.
   * @param pointer Error pointer path.
   * @returns Candidate cast as string-keyed record.
   */
  private expectRecord(candidate: unknown, pointer: string): Record<string, unknown> {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      this.throwConfigSchemaValidationError(`${pointer} must be an object.`, pointer);
    }
    return candidate as Record<string, unknown>;
  }

  /**
   * Asserts required string fields and provides stable pointer-based errors.
   * @param candidate Value to validate.
   * @param pointer Error pointer path.
   * @returns Non-empty string field value.
   */
  private expectString(candidate: unknown, pointer: string): string {
    if (typeof candidate !== "string" || candidate.length === 0) {
      this.throwConfigSchemaValidationError(`${pointer} must be a non-empty string.`, pointer);
    }
    return candidate;
  }

  /**
   * Validates optional string fields when present.
   * @param candidate Value to validate.
   * @param pointer Error pointer path.
   * @returns String value when present; otherwise undefined.
   */
  private expectOptionalString(candidate: unknown, pointer: string): string | undefined {
    if (candidate === undefined) {
      return undefined;
    }
    return this.expectString(candidate, pointer);
  }

  /**
   * Validates optional string-array fields when present.
   * @param candidate Value to validate.
   * @param pointer Error pointer path.
   * @returns String array when present; otherwise undefined.
   */
  private expectOptionalStringArray(candidate: unknown, pointer: string): string[] | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (!Array.isArray(candidate)) {
      this.throwConfigSchemaValidationError(`${pointer} must be an array of strings.`, pointer);
    }

    candidate.forEach((item, index) => {
      if (typeof item !== "string" || item.length === 0) {
        this.throwConfigSchemaValidationError(
          `${pointer}/${index} must be a non-empty string.`,
          pointer,
        );
      }
    });

    return candidate;
  }

  /**
   * Blocks unknown keys so config evolution remains explicit and auditable.
   * @param record Parsed object record.
   * @param allowList Allowed field names.
   * @param pointer Error pointer path.
   * @returns Void.
   */
  private assertNoUnknownKeys(
    record: Record<string, unknown>,
    allowList: Set<string>,
    pointer: string,
  ): void {
    const unknownKeys = Object.keys(record).filter((key) => !allowList.has(key));
    if (unknownKeys.length > 0) {
      this.throwConfigSchemaValidationError(
        `${pointer} contains unsupported keys: ${unknownKeys.join(", ")}.`,
        pointer,
      );
    }
  }

  /**
   * Throws a standardized config-schema validation error.
   * @param message Human-readable validation error.
   * @param pointer Schema pointer where validation failed.
   * @returns Never.
   */
  private throwConfigSchemaValidationError(message: string, pointer: string): never {
    throw new ConfigError(GovernorErrorCode.CONFIG_SCHEMA_VALIDATION_FAILED, message, {
      pointer,
    });
  }
}
