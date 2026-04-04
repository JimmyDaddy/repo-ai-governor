import {
  AdapterAvailability,
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  CLI_REACT_THEME_VALUES,
  I18N_RUNTIME_ENGINE,
  LocalModelProvider,
  MemoryStoreEngine,
  ROLE_PROFILE_ID_PATTERN,
  ROLE_PROFILE_VERSION_PATTERN,
  RoleProfileStatus,
  RoleSource,
  WorkspaceMigrationPolicy,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import type { AdapterRemoteApiConfig } from '@repo-ai-governor/shared';
import type { CliReactThemePreset } from '@repo-ai-governor/shared';
import { ConfigError, GovernorErrorCode } from '@repo-ai-governor/shared';
import { GovernorSchemaVersion, SUPPORTED_GOVERNOR_SCHEMA_VERSIONS } from './constants/index.js';
import type {
  AdapterRoleBindingConfig,
  AdapterRoleConfig,
  AdapterToolConfig,
  AdapterToolLocalModelConfig,
  AdaptersConfig,
  GovernorConfig,
  GovernorProfile,
  I18nConfig,
  MemoryConfig,
  RoleProfileConfig,
  StandardsConfig,
  StandardsPackSourceConfig,
  StandardsPackSourcesConfig,
  StandardsProjectionTargetConfig,
  UiConfig,
  UiReactConfig,
  WorkspaceConfig,
} from './types/interfaces/index.js';

const WORKSPACE_MODE_VALUES = new Set<string>(Object.values(WorkspaceMode));
const WORKSPACE_MIGRATION_POLICY_VALUES = new Set<string>(Object.values(WorkspaceMigrationPolicy));
const MEMORY_STORE_ENGINE_VALUES = new Set<string>(Object.values(MemoryStoreEngine));
const ROLE_SOURCE_VALUES = new Set<string>(Object.values(RoleSource));
const ROLE_PROFILE_STATUS_VALUES = new Set<string>(Object.values(RoleProfileStatus));
const ADAPTER_SURFACE_VALUES = new Set<string>(Object.values(AdapterSurface));
const ADAPTER_AVAILABILITY_VALUES = new Set<string>(Object.values(AdapterAvailability));
const ADAPTER_TRANSPORT_KIND_VALUES = new Set<string>(Object.values(AdapterTransportKind));
const ADAPTER_PROVIDER_KIND_VALUES = new Set<string>(Object.values(AdapterProviderKind));
const ADAPTER_VENDOR_BINDING_KIND_VALUES = new Set<string>(Object.values(AdapterVendorBindingKind));
const LOCAL_MODEL_PROVIDER_VALUES = new Set<string>(Object.values(LocalModelProvider));
const STANDARDS_RENDER_TARGET_VALUES = new Set(['human', 'ai', 'agents']);
const STANDARDS_PACK_LAYER_VALUES = new Set(['official', 'team', 'repository']);
const MEMORY_PROVIDER_MODULE_PACKAGE_SPECIFIER_PATTERN =
  /^(?:@[a-z0-9][a-z0-9-.]*\/)?[a-z0-9][a-z0-9-.]*$/u;
const MEMORY_PROVIDER_EXPORT_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/u;

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
    const root = this.expectRecord(candidate, '/');

    const schemaVersion = this.resolveSchemaVersion(root.schemaVersion, '/schemaVersion');
    const workspace = this.validateWorkspace(
      root.workspace,
      '/workspace',
      false,
      schemaVersion,
    ) as WorkspaceConfig;
    const i18n = this.validateI18n(root.i18n, '/i18n', false) as I18nConfig;
    const memory = this.validateMemory(root.memory, '/memory', false) as
      | Partial<MemoryConfig>
      | undefined;
    const ui = this.validateUi(root.ui, '/ui');
    const standards = this.validateStandards(root.standards, '/standards');
    const roles = this.validateRoles(root.roles, '/roles');
    const adapters = this.validateAdapters(root.adapters, '/adapters', false) as
      | AdaptersConfig
      | undefined;
    const activeProfile = this.expectOptionalString(root.activeProfile, '/activeProfile');
    const profiles = this.validateProfiles(root.profiles, '/profiles', schemaVersion);

    this.assertNoUnknownKeys(
      root,
      new Set([
        'schemaVersion',
        'workspace',
        'i18n',
        'memory',
        'ui',
        'standards',
        'roles',
        'adapters',
        'activeProfile',
        'profiles',
      ]),
      '/',
    );

    return {
      schemaVersion,
      workspace,
      i18n,
      ...(memory ? { memory } : {}),
      ...(ui ? { ui } : {}),
      ...(standards ? { standards } : {}),
      ...(roles ? { roles } : {}),
      ...(adapters ? { adapters } : {}),
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
      this.assertNoUnknownKeys(
        profile,
        new Set(['workspace', 'i18n', 'memory', 'ui', 'adapters']),
        profilePointer,
      );

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
        ...(profile.ui !== undefined
          ? {
              ui: this.validateUi(profile.ui, `${profilePointer}/ui`),
            }
          : {}),
        ...(profile.adapters !== undefined
          ? {
              adapters: this.validateAdapters(profile.adapters, `${profilePointer}/adapters`, true),
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
      new Set(['mode', 'toolManagedRoot', 'repoLocalRoot', 'migrationPolicy']),
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
   * Validates optional UI config accepted by React-shell surfaces.
   * @param candidate Raw UI object from config or profile override.
   * @param pointer Error pointer path.
   * @returns Typed UI config when provided.
   */
  private validateUi(candidate: unknown, pointer: string): UiConfig | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    const ui = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(ui, new Set(['react']), pointer);
    const react = this.validateUiReact(ui.react, `${pointer}/react`);

    return {
      ...(react ? { react } : {}),
    };
  }

  /**
   * Validates standards runtime config used for pack auto-loading and projection defaults.
   * @param candidate Raw standards config payload.
   * @param pointer Error pointer path.
   * @returns Typed standards config when provided.
   */
  private validateStandards(candidate: unknown, pointer: string): StandardsConfig | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    const standards = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(
      standards,
      new Set([
        'packSources',
        'renderTargets',
        'projectionTargets',
        'defaultLocale',
        'fallbackLocale',
      ]),
      pointer,
    );

    const packSources = this.validateStandardsPackSources(
      standards.packSources,
      `${pointer}/packSources`,
    );
    const renderTargets = this.validateStandardsRenderTargets(
      standards.renderTargets,
      `${pointer}/renderTargets`,
    );
    const projectionTargets = this.validateStandardsProjectionTargets(
      standards.projectionTargets,
      `${pointer}/projectionTargets`,
    );
    const defaultLocale = this.expectOptionalString(
      standards.defaultLocale,
      `${pointer}/defaultLocale`,
    );
    const fallbackLocale = this.expectOptionalString(
      standards.fallbackLocale,
      `${pointer}/fallbackLocale`,
    );

    return {
      packSources,
      ...(renderTargets ? { renderTargets } : {}),
      ...(projectionTargets ? { projectionTargets } : {}),
      ...(defaultLocale ? { defaultLocale } : {}),
      ...(fallbackLocale ? { fallbackLocale } : {}),
    };
  }

  /**
   * Validates grouped standards source references for official/team/repository layers.
   * @param candidate Raw pack source record.
   * @param pointer Error pointer path.
   * @returns Typed layered source config.
   */
  private validateStandardsPackSources(
    candidate: unknown,
    pointer: string,
  ): StandardsPackSourcesConfig {
    const packSources = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(packSources, STANDARDS_PACK_LAYER_VALUES, pointer);

    return {
      ...(packSources.official !== undefined
        ? {
            official: this.validateStandardsPackSourceList(
              packSources.official,
              `${pointer}/official`,
            ),
          }
        : {}),
      ...(packSources.team !== undefined
        ? {
            team: this.validateStandardsPackSourceList(packSources.team, `${pointer}/team`),
          }
        : {}),
      ...(packSources.repository !== undefined
        ? {
            repository: this.validateStandardsPackSourceList(
              packSources.repository,
              `${pointer}/repository`,
            ),
          }
        : {}),
    };
  }

  /**
   * Validates one list of standards source descriptors.
   * @param candidate Raw list payload.
   * @param pointer Error pointer path.
   * @returns Typed source descriptor array.
   */
  private validateStandardsPackSourceList(
    candidate: unknown,
    pointer: string,
  ): StandardsPackSourceConfig[] {
    const sourceList = this.expectArray(candidate, pointer);

    return sourceList.map((entry, index) => {
      const sourcePointer = `${pointer}/${index}`;
      const source = this.expectRecord(entry, sourcePointer);
      this.assertNoUnknownKeys(source, new Set(['module', 'exportName', 'enabled']), sourcePointer);

      const module = this.expectRequiredString(source.module, `${sourcePointer}/module`);
      const exportName = this.expectRequiredString(
        source.exportName,
        `${sourcePointer}/exportName`,
      );
      const enabled = this.expectOptionalBoolean(source.enabled, `${sourcePointer}/enabled`);

      return {
        module,
        exportName,
        ...(enabled !== undefined ? { enabled } : {}),
      };
    });
  }

  /**
   * Validates standards render target declarations.
   * @param candidate Raw render target list.
   * @param pointer Error pointer path.
   * @returns Typed target list when provided.
   */
  private validateStandardsRenderTargets(
    candidate: unknown,
    pointer: string,
  ): StandardsConfig['renderTargets'] {
    if (candidate === undefined) {
      return undefined;
    }

    const renderTargets = this.expectArray(candidate, pointer);
    return renderTargets.map((entry, index) => {
      const value = this.expectRequiredString(entry, `${pointer}/${index}`);
      if (!STANDARDS_RENDER_TARGET_VALUES.has(value)) {
        this.throwConfigSchemaValidationError(
          `${pointer}/${index} must be one of: ${Array.from(STANDARDS_RENDER_TARGET_VALUES).join(', ')}.`,
          `${pointer}/${index}`,
        );
      }

      return value as 'human' | 'ai' | 'agents';
    });
  }

  /**
   * Validates standards projection target declarations.
   * @param candidate Raw projection target list.
   * @param pointer Error pointer path.
   * @returns Typed projection target list when provided.
   */
  private validateStandardsProjectionTargets(
    candidate: unknown,
    pointer: string,
  ): StandardsProjectionTargetConfig[] | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    const projectionTargets = this.expectArray(candidate, pointer);
    return projectionTargets.map((entry, index) => {
      const targetPointer = `${pointer}/${index}`;
      const projectionTarget = this.expectRecord(entry, targetPointer);
      this.assertNoUnknownKeys(projectionTarget, new Set(['targetFile', 'locale']), targetPointer);

      const targetFile = this.expectRequiredString(
        projectionTarget.targetFile,
        `${targetPointer}/targetFile`,
      );
      const locale = this.expectOptionalString(projectionTarget.locale, `${targetPointer}/locale`);

      return {
        targetFile,
        ...(locale ? { locale } : {}),
      };
    });
  }

  /**
   * Validates React-shell specific UI preferences.
   * @param candidate Raw React-shell config object.
   * @param pointer Error pointer path.
   * @returns Typed React-shell config when provided.
   */
  private validateUiReact(candidate: unknown, pointer: string): UiReactConfig | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    const reactUi = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(reactUi, new Set(['theme']), pointer);
    const theme = this.expectOptionalString(reactUi.theme, `${pointer}/theme`);
    const resolvedTheme = this.resolveReactCliThemePreset(theme, pointer);

    return {
      ...(resolvedTheme ? { theme: resolvedTheme } : {}),
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
      `${pointer} must be one of: ${Array.from(SUPPORTED_GOVERNOR_SCHEMA_VERSIONS).join(', ')}.`,
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
        `${pointer}/mode must be one of: ${Array.from(WORKSPACE_MODE_VALUES).join(', ')}.`,
        pointer,
      );
    }

    return mode as WorkspaceMode;
  }

  /**
   * Converts optional React-shell theme value to enum and throws on unsupported presets.
   * @param theme Optional raw theme string from config.
   * @param pointer Error pointer path.
   * @returns Theme preset when provided; otherwise undefined.
   */
  private resolveReactCliThemePreset(
    theme: string | undefined,
    pointer: string,
  ): CliReactThemePreset | undefined {
    if (theme === undefined) {
      return undefined;
    }

    if (!CLI_REACT_THEME_VALUES.has(theme)) {
      this.throwConfigSchemaValidationError(
        `${pointer}/theme must be one of: ${Array.from(CLI_REACT_THEME_VALUES).join(', ')}.`,
        pointer,
      );
    }

    return theme as CliReactThemePreset;
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
        ).join(', ')}.`,
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
      new Set(['runtimeEngine', 'defaultLocale', 'fallbackLocale', 'supportedLocales']),
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
   * Validates role profile list and lifecycle metadata from config.
   * @param candidate Raw roles field from config.
   * @param pointer Error pointer path.
   * @returns Normalized role profile list when present.
   */
  private validateRoles(candidate: unknown, pointer: string): RoleProfileConfig[] | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (!Array.isArray(candidate)) {
      this.throwConfigSchemaValidationError(`${pointer} must be an array.`, pointer);
    }

    const roleProfileIds = new Set<string>();
    const roles = candidate.map((item, index) => {
      const rolePointer = `${pointer}/${index}`;
      const roleRecord = this.expectRecord(item, rolePointer);
      this.assertNoUnknownKeys(
        roleRecord,
        new Set([
          'roleProfileId',
          'roleProfileVersion',
          'displayName',
          'responsibilities',
          'capabilities',
          'permissionCeiling',
          'roleSource',
          'status',
          'lifecycle',
        ]),
        rolePointer,
      );

      const roleProfileId = this.expectString(
        roleRecord.roleProfileId,
        `${rolePointer}/roleProfileId`,
      );
      if (!ROLE_PROFILE_ID_PATTERN.test(roleProfileId)) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/roleProfileId has unsupported format.`,
          `${rolePointer}/roleProfileId`,
        );
      }
      if (roleProfileIds.has(roleProfileId)) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/roleProfileId must be unique.`,
          `${rolePointer}/roleProfileId`,
        );
      }
      roleProfileIds.add(roleProfileId);

      const roleProfileVersion = this.expectString(
        roleRecord.roleProfileVersion,
        `${rolePointer}/roleProfileVersion`,
      );
      if (!ROLE_PROFILE_VERSION_PATTERN.test(roleProfileVersion)) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/roleProfileVersion must use semantic version format (x.y.z).`,
          `${rolePointer}/roleProfileVersion`,
        );
      }
      const displayName = this.expectString(roleRecord.displayName, `${rolePointer}/displayName`);
      const responsibilities = this.expectOptionalStringArray(
        roleRecord.responsibilities,
        `${rolePointer}/responsibilities`,
      );
      const capabilities = this.expectOptionalStringArray(
        roleRecord.capabilities,
        `${rolePointer}/capabilities`,
      );
      const permissionCeiling = this.expectOptionalStringArray(
        roleRecord.permissionCeiling,
        `${rolePointer}/permissionCeiling`,
      );
      const roleSource = this.expectString(roleRecord.roleSource, `${rolePointer}/roleSource`);
      const status = this.expectString(roleRecord.status, `${rolePointer}/status`);

      if (!responsibilities || responsibilities.length === 0) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/responsibilities must contain at least one value.`,
          `${rolePointer}/responsibilities`,
        );
      }
      if (!capabilities || capabilities.length === 0) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/capabilities must contain at least one value.`,
          `${rolePointer}/capabilities`,
        );
      }
      if (!permissionCeiling || permissionCeiling.length === 0) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/permissionCeiling must contain at least one value.`,
          `${rolePointer}/permissionCeiling`,
        );
      }
      if (!ROLE_SOURCE_VALUES.has(roleSource)) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/roleSource must be one of: ${Array.from(ROLE_SOURCE_VALUES).join(', ')}.`,
          `${rolePointer}/roleSource`,
        );
      }
      if (!ROLE_PROFILE_STATUS_VALUES.has(status)) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/status must be one of: ${Array.from(ROLE_PROFILE_STATUS_VALUES).join(', ')}.`,
          `${rolePointer}/status`,
        );
      }

      const lifecycle = this.validateRoleLifecycle(
        roleRecord.lifecycle,
        `${rolePointer}/lifecycle`,
      );
      if (lifecycle?.replacedBy && lifecycle.replacedBy === roleProfileId) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/lifecycle/replacedBy must not equal roleProfileId.`,
          `${rolePointer}/lifecycle/replacedBy`,
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
        ...(lifecycle ? { lifecycle } : {}),
      };
    });

    roles.forEach((role, index) => {
      const rolePointer = `${pointer}/${index}`;
      const aliases = role.lifecycle?.aliases ?? [];
      const replacedBy = role.lifecycle?.replacedBy;

      if (aliases.includes(role.roleProfileId)) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/lifecycle/aliases must not include roleProfileId itself.`,
          `${rolePointer}/lifecycle/aliases`,
        );
      }
      if (replacedBy && !roleProfileIds.has(replacedBy)) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/lifecycle/replacedBy must reference an existing roleProfileId.`,
          `${rolePointer}/lifecycle/replacedBy`,
        );
      }
    });

    return roles;
  }

  /**
   * Validates optional role lifecycle payload.
   * @param candidate Raw lifecycle field from role profile.
   * @param pointer Error pointer path.
   * @returns Normalized lifecycle record when present.
   */
  private validateRoleLifecycle(
    candidate: unknown,
    pointer: string,
  ):
    | {
        aliases?: string[];
        supersedes?: string[];
        replacedBy?: string;
        deprecatedAt?: string;
        migrationNotes?: string;
      }
    | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    const lifecycle = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(
      lifecycle,
      new Set(['aliases', 'supersedes', 'replacedBy', 'deprecatedAt', 'migrationNotes']),
      pointer,
    );

    const aliases = this.expectOptionalStringArray(lifecycle.aliases, `${pointer}/aliases`);
    const supersedes = this.expectOptionalStringArray(
      lifecycle.supersedes,
      `${pointer}/supersedes`,
    );
    const replacedBy = this.expectOptionalString(lifecycle.replacedBy, `${pointer}/replacedBy`);
    const deprecatedAt = this.expectOptionalString(
      lifecycle.deprecatedAt,
      `${pointer}/deprecatedAt`,
    );
    const migrationNotes = this.expectOptionalString(
      lifecycle.migrationNotes,
      `${pointer}/migrationNotes`,
    );

    return {
      ...(aliases ? { aliases } : {}),
      ...(supersedes ? { supersedes } : {}),
      ...(replacedBy ? { replacedBy } : {}),
      ...(deprecatedAt ? { deprecatedAt } : {}),
      ...(migrationNotes ? { migrationNotes } : {}),
    };
  }

  /**
   * Validates adapter/runtime routing config shape.
   * @param candidate Raw adapters field.
   * @param pointer Error pointer path.
   * @param isPartial Whether required fields can be omitted for profile overrides.
   * @returns Normalized adapters config when present.
   */
  private validateAdapters(
    candidate: unknown,
    pointer: string,
    isPartial: boolean,
  ): AdaptersConfig | Partial<AdaptersConfig> | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    const adapters = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(adapters, new Set(['roles', 'routing', 'tools']), pointer);

    const roles = this.validateAdapterRoles(adapters.roles, `${pointer}/roles`, isPartial);
    const routing = this.validateAdapterRouting(
      adapters.routing,
      `${pointer}/routing`,
      roles ?? [],
      isPartial,
    );
    const tools = this.validateAdapterTools(adapters.tools, `${pointer}/tools`);

    return {
      ...(roles ? { roles } : {}),
      ...(routing ? { routing } : {}),
      ...(tools ? { tools } : {}),
    };
  }

  /**
   * Validates adapter role rows.
   * @param candidate Raw role rows.
   * @param pointer Error pointer path.
   * @param isPartial Whether required fields can be omitted for profile overrides.
   * @returns Normalized role rows when present.
   */
  private validateAdapterRoles(
    candidate: unknown,
    pointer: string,
    isPartial: boolean,
  ): AdapterRoleConfig[] | undefined {
    if (candidate === undefined) {
      if (isPartial) {
        return undefined;
      }
      this.throwConfigSchemaValidationError(`${pointer} is required.`, pointer);
    }

    if (!Array.isArray(candidate)) {
      this.throwConfigSchemaValidationError(`${pointer} must be an array.`, pointer);
    }

    const roleIdSet = new Set<string>();
    const roles = candidate.map((entry, index) => {
      const rolePointer = `${pointer}/${index}`;
      const roleRecord = this.expectRecord(entry, rolePointer);
      this.assertNoUnknownKeys(
        roleRecord,
        new Set(['roleId', 'roleProfileId', 'requiredCapabilities', 'required']),
        rolePointer,
      );

      const roleId = this.expectString(roleRecord.roleId, `${rolePointer}/roleId`);
      if (!ROLE_PROFILE_ID_PATTERN.test(roleId)) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/roleId has unsupported format.`,
          `${rolePointer}/roleId`,
        );
      }
      if (roleIdSet.has(roleId)) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/roleId must be unique.`,
          `${rolePointer}/roleId`,
        );
      }
      roleIdSet.add(roleId);

      const roleProfileId = this.expectString(
        roleRecord.roleProfileId,
        `${rolePointer}/roleProfileId`,
      );
      if (!ROLE_PROFILE_ID_PATTERN.test(roleProfileId)) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/roleProfileId has unsupported format.`,
          `${rolePointer}/roleProfileId`,
        );
      }

      const requiredCapabilities = this.expectOptionalStringArray(
        roleRecord.requiredCapabilities,
        `${rolePointer}/requiredCapabilities`,
      );
      if (!requiredCapabilities || requiredCapabilities.length === 0) {
        this.throwConfigSchemaValidationError(
          `${rolePointer}/requiredCapabilities must contain at least one value.`,
          `${rolePointer}/requiredCapabilities`,
        );
      }

      const required = this.expectOptionalBoolean(roleRecord.required, `${rolePointer}/required`);

      return {
        roleId,
        roleProfileId,
        requiredCapabilities,
        required: required ?? true,
      };
    });

    if (!isPartial && roles.length === 0) {
      this.throwConfigSchemaValidationError(`${pointer} must contain at least one role.`, pointer);
    }

    return roles;
  }

  /**
   * Validates adapter role-binding routing map.
   * @param candidate Raw routing object.
   * @param pointer Error pointer path.
   * @param roles Normalized role rows.
   * @param isPartial Whether required fields can be omitted for profile overrides.
   * @returns Normalized routing config when present.
   */
  private validateAdapterRouting(
    candidate: unknown,
    pointer: string,
    roles: AdapterRoleConfig[],
    isPartial: boolean,
  ): { roleBindings: Record<string, AdapterRoleBindingConfig> } | undefined {
    if (candidate === undefined) {
      if (isPartial) {
        return undefined;
      }
      this.throwConfigSchemaValidationError(`${pointer} is required.`, pointer);
    }

    const routing = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(routing, new Set(['roleBindings']), pointer);
    const roleBindingsRecord = this.expectRecord(routing.roleBindings, `${pointer}/roleBindings`);

    const roleBindings: Record<string, AdapterRoleBindingConfig> = {};
    for (const [roleId, value] of Object.entries(roleBindingsRecord)) {
      const roleBindingPointer = `${pointer}/roleBindings/${roleId}`;
      if (!ROLE_PROFILE_ID_PATTERN.test(roleId)) {
        this.throwConfigSchemaValidationError(
          `${roleBindingPointer} role key has unsupported format.`,
          roleBindingPointer,
        );
      }
      const roleBinding = this.expectRecord(value, roleBindingPointer);
      this.assertNoUnknownKeys(
        roleBinding,
        new Set(['primarySurface', 'fallbackSurfaces']),
        roleBindingPointer,
      );

      const primarySurface = this.resolveAdapterSurface(
        roleBinding.primarySurface,
        `${roleBindingPointer}/primarySurface`,
      );
      const fallbackSurfacesRaw = this.expectOptionalStringArray(
        roleBinding.fallbackSurfaces,
        `${roleBindingPointer}/fallbackSurfaces`,
      );
      const fallbackSurfaces = (fallbackSurfacesRaw ?? [])
        .map((surface, index) =>
          this.resolveAdapterSurface(
            surface,
            `${roleBindingPointer}/fallbackSurfaces/${String(index)}`,
          ),
        )
        .filter((surface) => surface !== primarySurface);
      const fallbackSurfaceSet = new Set<AdapterSurface>();
      const dedupedFallbackSurfaces: AdapterSurface[] = [];
      for (const fallbackSurface of fallbackSurfaces) {
        if (fallbackSurfaceSet.has(fallbackSurface)) {
          continue;
        }
        fallbackSurfaceSet.add(fallbackSurface);
        dedupedFallbackSurfaces.push(fallbackSurface);
      }

      roleBindings[roleId] = {
        primarySurface,
        ...(dedupedFallbackSurfaces.length > 0
          ? {
              fallbackSurfaces: dedupedFallbackSurfaces,
            }
          : {}),
      };
    }

    const roleIdSet = new Set(roles.map((role) => role.roleId));
    const enforceRoleBindingCoverage = !isPartial || roleIdSet.size > 0;
    if (enforceRoleBindingCoverage) {
      for (const roleId of roleIdSet) {
        if (roleBindings[roleId]) {
          continue;
        }
        this.throwConfigSchemaValidationError(
          `${pointer}/roleBindings is missing binding for role "${roleId}".`,
          `${pointer}/roleBindings`,
        );
      }
      for (const roleId of Object.keys(roleBindings)) {
        if (roleIdSet.has(roleId)) {
          continue;
        }
        this.throwConfigSchemaValidationError(
          `${pointer}/roleBindings/${roleId} must reference an existing adapters.roles roleId.`,
          `${pointer}/roleBindings/${roleId}`,
        );
      }
    }

    return {
      roleBindings,
    };
  }

  /**
   * Validates optional adapter-tool rows.
   * @param candidate Raw tool rows.
   * @param pointer Error pointer path.
   * @returns Normalized tool rows when present.
   */
  private validateAdapterTools(
    candidate: unknown,
    pointer: string,
  ): AdapterToolConfig[] | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (!Array.isArray(candidate)) {
      this.throwConfigSchemaValidationError(`${pointer} must be an array.`, pointer);
    }

    const toolIdSet = new Set<AdapterSurface>();
    return candidate.map((entry, index) => {
      const toolPointer = `${pointer}/${index}`;
      const toolRecord = this.expectRecord(entry, toolPointer);
      this.assertNoUnknownKeys(
        toolRecord,
        new Set([
          'toolId',
          'enabled',
          'availability',
          'unavailableReasons',
          'transport',
          'remoteApi',
          'localModel',
        ]),
        toolPointer,
      );

      const toolId = this.resolveAdapterSurface(toolRecord.toolId, `${toolPointer}/toolId`);
      if (toolIdSet.has(toolId)) {
        this.throwConfigSchemaValidationError(
          `${toolPointer}/toolId must be unique.`,
          `${toolPointer}/toolId`,
        );
      }
      toolIdSet.add(toolId);

      const enabled = this.expectOptionalBoolean(toolRecord.enabled, `${toolPointer}/enabled`);
      const availability = this.resolveAdapterAvailability(
        toolRecord.availability,
        `${toolPointer}/availability`,
      );
      const unavailableReasons = this.expectOptionalStringArray(
        toolRecord.unavailableReasons,
        `${toolPointer}/unavailableReasons`,
      );
      const transport = this.resolveAdapterTransportKind(
        toolRecord.transport,
        `${toolPointer}/transport`,
      );
      const remoteApi = this.validateAdapterToolRemoteApi(
        toolRecord.remoteApi,
        `${toolPointer}/remoteApi`,
        toolId,
      );
      if (toolId !== AdapterSurface.OLLAMA && toolRecord.localModel !== undefined) {
        this.throwConfigSchemaValidationError(
          `${toolPointer}/localModel is only supported when toolId="${AdapterSurface.OLLAMA}".`,
          `${toolPointer}/localModel`,
        );
      }
      if (toolId === AdapterSurface.OLLAMA && toolRecord.transport !== undefined) {
        this.throwConfigSchemaValidationError(
          `${toolPointer}/transport is not supported when toolId="${AdapterSurface.OLLAMA}".`,
          `${toolPointer}/transport`,
        );
      }
      if (toolId === AdapterSurface.OLLAMA && toolRecord.remoteApi !== undefined) {
        this.throwConfigSchemaValidationError(
          `${toolPointer}/remoteApi is not supported when toolId="${AdapterSurface.OLLAMA}".`,
          `${toolPointer}/remoteApi`,
        );
      }
      if (remoteApi && transport && transport !== AdapterTransportKind.REMOTE_API) {
        this.throwConfigSchemaValidationError(
          `${toolPointer}/transport must be "${AdapterTransportKind.REMOTE_API}" when remoteApi is configured.`,
          `${toolPointer}/transport`,
        );
      }
      if (!remoteApi && transport === AdapterTransportKind.REMOTE_API) {
        this.throwConfigSchemaValidationError(
          `${toolPointer}/remoteApi is required when transport="${AdapterTransportKind.REMOTE_API}".`,
          `${toolPointer}/remoteApi`,
        );
      }
      const localModel = this.validateAdapterToolLocalModel(
        toolRecord.localModel,
        `${toolPointer}/localModel`,
        toolId === AdapterSurface.OLLAMA,
      );
      const resolvedTransport = remoteApi ? AdapterTransportKind.REMOTE_API : transport;

      return {
        toolId,
        ...(enabled !== undefined ? { enabled } : {}),
        ...(availability ? { availability } : {}),
        ...(unavailableReasons ? { unavailableReasons } : {}),
        ...(resolvedTransport ? { transport: resolvedTransport } : {}),
        ...(remoteApi ? { remoteApi } : {}),
        ...(localModel ? { localModel } : {}),
      };
    });
  }

  /**
   * Validates optional local-model runtime config for one adapter tool row.
   * @param candidate Raw local-model object.
   * @param pointer Error pointer path.
   * @param required Whether local-model config is mandatory for this tool row.
   * @returns Normalized local-model config when present.
   */
  private validateAdapterToolLocalModel(
    candidate: unknown,
    pointer: string,
    required: boolean,
  ): AdapterToolLocalModelConfig | undefined {
    if (candidate === undefined) {
      if (!required) {
        return undefined;
      }
      this.throwConfigSchemaValidationError(
        `${pointer} is required for local-model tool.`,
        pointer,
      );
    }

    const localModel = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(
      localModel,
      new Set(['provider', 'endpoint', 'model', 'requestTimeoutMs', 'maxRetries']),
      pointer,
    );

    const provider = this.expectString(localModel.provider, `${pointer}/provider`);
    if (!LOCAL_MODEL_PROVIDER_VALUES.has(provider)) {
      this.throwConfigSchemaValidationError(
        `${pointer}/provider must be one of: ${Array.from(LOCAL_MODEL_PROVIDER_VALUES).join(', ')}.`,
        `${pointer}/provider`,
      );
    }
    const endpoint = this.expectString(localModel.endpoint, `${pointer}/endpoint`);
    const model = this.expectString(localModel.model, `${pointer}/model`);
    const requestTimeoutMs = this.expectOptionalPositiveInteger(
      localModel.requestTimeoutMs,
      `${pointer}/requestTimeoutMs`,
    );
    const maxRetries = this.expectOptionalNonNegativeInteger(
      localModel.maxRetries,
      `${pointer}/maxRetries`,
    );

    return {
      provider: provider as LocalModelProvider,
      endpoint,
      model,
      ...(requestTimeoutMs !== undefined ? { requestTimeoutMs } : {}),
      ...(maxRetries !== undefined ? { maxRetries } : {}),
    };
  }

  /**
   * Resolves adapter-surface enum from unknown input.
   * @param candidate Raw value.
   * @param pointer Error pointer path.
   * @returns Adapter surface enum value.
   */
  private resolveAdapterSurface(candidate: unknown, pointer: string): AdapterSurface {
    const value = this.expectString(candidate, pointer);
    if (!ADAPTER_SURFACE_VALUES.has(value)) {
      this.throwConfigSchemaValidationError(
        `${pointer} must be one of: ${Array.from(ADAPTER_SURFACE_VALUES).join(', ')}.`,
        pointer,
      );
    }
    return value as AdapterSurface;
  }

  /**
   * Resolves optional adapter-availability enum from unknown input.
   * @param candidate Raw value.
   * @param pointer Error pointer path.
   * @returns Adapter availability enum value when provided.
   */
  private resolveAdapterAvailability(
    candidate: unknown,
    pointer: string,
  ): AdapterAvailability | undefined {
    const value = this.expectOptionalString(candidate, pointer);
    if (!value) {
      return undefined;
    }
    if (!ADAPTER_AVAILABILITY_VALUES.has(value)) {
      this.throwConfigSchemaValidationError(
        `${pointer} must be one of: ${Array.from(ADAPTER_AVAILABILITY_VALUES).join(', ')}.`,
        pointer,
      );
    }
    return value as AdapterAvailability;
  }

  /**
   * Resolves optional adapter-transport enum from unknown input.
   * @param candidate Raw value.
   * @param pointer Error pointer path.
   * @returns Adapter transport enum value when provided.
   */
  private resolveAdapterTransportKind(
    candidate: unknown,
    pointer: string,
  ): AdapterTransportKind | undefined {
    const value = this.expectOptionalString(candidate, pointer);
    if (!value) {
      return undefined;
    }
    if (!ADAPTER_TRANSPORT_KIND_VALUES.has(value)) {
      this.throwConfigSchemaValidationError(
        `${pointer} must be one of: ${Array.from(ADAPTER_TRANSPORT_KIND_VALUES).join(', ')}.`,
        pointer,
      );
    }
    return value as AdapterTransportKind;
  }

  /**
   * Validates optional remote-api runtime config for one adapter tool row.
   * @param candidate Raw remote-api object.
   * @param pointer Error pointer path.
   * @param toolId Resolved adapter surface.
   * @returns Normalized remote-api config when present.
   */
  private validateAdapterToolRemoteApi(
    candidate: unknown,
    pointer: string,
    toolId: AdapterSurface,
  ): AdapterRemoteApiConfig | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    const remoteApi = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(
      remoteApi,
      new Set([
        'provider',
        'vendorBinding',
        'model',
        'credentialEnvVar',
        'credentialRef',
        'allowProviderLocalConfig',
        'endpoint',
        'requestTimeoutMs',
        'maxRetries',
      ]),
      pointer,
    );

    const provider = this.resolveAdapterProviderKind(remoteApi.provider, `${pointer}/provider`);
    const vendorBinding = this.resolveAdapterVendorBindingKind(
      remoteApi.vendorBinding,
      `${pointer}/vendorBinding`,
    );
    const model = this.expectString(remoteApi.model, `${pointer}/model`);
    const credentialEnvVar = this.expectOptionalString(
      remoteApi.credentialEnvVar,
      `${pointer}/credentialEnvVar`,
    );
    const credentialRef = this.expectOptionalString(
      remoteApi.credentialRef,
      `${pointer}/credentialRef`,
    );
    const allowProviderLocalConfig = this.expectOptionalBoolean(
      remoteApi.allowProviderLocalConfig,
      `${pointer}/allowProviderLocalConfig`,
    );
    const endpoint = this.expectOptionalString(remoteApi.endpoint, `${pointer}/endpoint`);
    const requestTimeoutMs = this.expectOptionalPositiveInteger(
      remoteApi.requestTimeoutMs,
      `${pointer}/requestTimeoutMs`,
    );
    const maxRetries = this.expectOptionalNonNegativeInteger(
      remoteApi.maxRetries,
      `${pointer}/maxRetries`,
    );

    if (toolId === AdapterSurface.GITHUB_COPILOT) {
      this.throwConfigSchemaValidationError(
        `${pointer} is not yet supported when toolId="${AdapterSurface.GITHUB_COPILOT}".`,
        pointer,
      );
    }

    if (toolId === AdapterSurface.CODEX && provider !== AdapterProviderKind.OPENAI) {
      this.throwConfigSchemaValidationError(
        `${pointer}/provider must be "${AdapterProviderKind.OPENAI}" when toolId="${AdapterSurface.CODEX}".`,
        `${pointer}/provider`,
      );
    }
    if (
      toolId === AdapterSurface.CODEX &&
      vendorBinding !== undefined &&
      vendorBinding !== AdapterVendorBindingKind.OPENAI_RESPONSES
    ) {
      this.throwConfigSchemaValidationError(
        `${pointer}/vendorBinding must be "${AdapterVendorBindingKind.OPENAI_RESPONSES}" when toolId="${AdapterSurface.CODEX}".`,
        `${pointer}/vendorBinding`,
      );
    }

    if (toolId === AdapterSurface.CLAUDE_CODE && provider !== AdapterProviderKind.ANTHROPIC) {
      this.throwConfigSchemaValidationError(
        `${pointer}/provider must be "${AdapterProviderKind.ANTHROPIC}" when toolId="${AdapterSurface.CLAUDE_CODE}".`,
        `${pointer}/provider`,
      );
    }
    if (
      toolId === AdapterSurface.CLAUDE_CODE &&
      vendorBinding !== undefined &&
      vendorBinding !== AdapterVendorBindingKind.ANTHROPIC_MESSAGES
    ) {
      this.throwConfigSchemaValidationError(
        `${pointer}/vendorBinding must be "${AdapterVendorBindingKind.ANTHROPIC_MESSAGES}" when toolId="${AdapterSurface.CLAUDE_CODE}".`,
        `${pointer}/vendorBinding`,
      );
    }

    return {
      provider,
      model,
      ...(vendorBinding !== undefined ? { vendorBinding } : {}),
      ...(credentialEnvVar ? { credentialEnvVar } : {}),
      ...(credentialRef ? { credentialRef } : {}),
      ...(allowProviderLocalConfig !== undefined ? { allowProviderLocalConfig } : {}),
      ...(endpoint ? { endpoint } : {}),
      ...(requestTimeoutMs !== undefined ? { requestTimeoutMs } : {}),
      ...(maxRetries !== undefined ? { maxRetries } : {}),
    };
  }

  /**
   * Resolves optional adapter-provider enum from unknown input.
   * @param candidate Raw value.
   * @param pointer Error pointer path.
   * @returns Adapter provider enum value.
   */
  private resolveAdapterProviderKind(candidate: unknown, pointer: string): AdapterProviderKind {
    const value = this.expectString(candidate, pointer);
    if (!ADAPTER_PROVIDER_KIND_VALUES.has(value)) {
      this.throwConfigSchemaValidationError(
        `${pointer} must be one of: ${Array.from(ADAPTER_PROVIDER_KIND_VALUES).join(', ')}.`,
        pointer,
      );
    }
    return value as AdapterProviderKind;
  }

  /**
   * Resolves optional adapter vendor-binding enum from unknown input.
   * @param candidate Raw value.
   * @param pointer Error pointer path.
   * @returns Adapter vendor-binding enum value when provided.
   */
  private resolveAdapterVendorBindingKind(
    candidate: unknown,
    pointer: string,
  ): AdapterVendorBindingKind | undefined {
    const value = this.expectOptionalString(candidate, pointer);
    if (!value) {
      return undefined;
    }
    if (!ADAPTER_VENDOR_BINDING_KIND_VALUES.has(value)) {
      this.throwConfigSchemaValidationError(
        `${pointer} must be one of: ${Array.from(ADAPTER_VENDOR_BINDING_KIND_VALUES).join(', ')}.`,
        pointer,
      );
    }
    return value as AdapterVendorBindingKind;
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
    this.assertNoUnknownKeys(memory, new Set(['storeEngine', 'storeRoot', 'provider']), pointer);

    const storeEngine = this.expectOptionalString(memory.storeEngine, `${pointer}/storeEngine`);
    const storeRoot = this.expectOptionalString(memory.storeRoot, `${pointer}/storeRoot`);
    const provider = this.validateMemoryProvider(memory.provider, `${pointer}/provider`);

    if (!isPartial && !storeEngine) {
      this.throwConfigSchemaValidationError(`${pointer}/storeEngine is required.`, pointer);
    }

    if (storeEngine && !MEMORY_STORE_ENGINE_VALUES.has(storeEngine)) {
      this.throwConfigSchemaValidationError(
        `${pointer}/storeEngine must be one of: ${Array.from(MEMORY_STORE_ENGINE_VALUES).join(', ')}.`,
        pointer,
      );
    }

    return {
      ...(storeEngine ? { storeEngine: storeEngine as MemoryStoreEngine } : {}),
      ...(storeRoot ? { storeRoot } : {}),
      ...(provider ? { provider } : {}),
    };
  }

  /**
   * Validates optional memory-provider extension fields reserved for built-in/plugin resolution.
   * @param candidate Raw provider object.
   * @param pointer Error pointer path.
   * @returns Provider extension payload when present.
   */
  private validateMemoryProvider(
    candidate: unknown,
    pointer: string,
  ): MemoryConfig['provider'] | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    const provider = this.expectRecord(candidate, pointer);
    this.assertNoUnknownKeys(provider, new Set(['id', 'module', 'exportName', 'options']), pointer);

    const id = this.expectOptionalString(provider.id, `${pointer}/id`);
    const module = this.expectOptionalString(provider.module, `${pointer}/module`);
    const exportName = this.expectOptionalString(provider.exportName, `${pointer}/exportName`);
    const options =
      provider.options === undefined
        ? undefined
        : this.expectRecord(provider.options, `${pointer}/options`);

    if (module && id) {
      this.throwConfigSchemaValidationError(
        `${pointer}/id must not be combined with ${pointer}/module in the optional plugin baseline.`,
        `${pointer}/id`,
      );
    }

    if (module && !MEMORY_PROVIDER_MODULE_PACKAGE_SPECIFIER_PATTERN.test(module)) {
      this.throwConfigSchemaValidationError(
        `${pointer}/module must use an allowlist-controlled bare package specifier in the current optional plugin baseline.`,
        `${pointer}/module`,
      );
    }

    if (exportName && !module) {
      this.throwConfigSchemaValidationError(
        `${pointer}/exportName requires ${pointer}/module.`,
        `${pointer}/exportName`,
      );
    }

    if (exportName && !MEMORY_PROVIDER_EXPORT_NAME_PATTERN.test(exportName)) {
      this.throwConfigSchemaValidationError(
        `${pointer}/exportName must be a valid JavaScript identifier.`,
        `${pointer}/exportName`,
      );
    }

    if (options && !module) {
      this.throwConfigSchemaValidationError(
        `${pointer}/options requires ${pointer}/module.`,
        `${pointer}/options`,
      );
    }

    return {
      ...(id ? { id } : {}),
      ...(module ? { module } : {}),
      ...(exportName ? { exportName } : {}),
      ...(options ? { options } : {}),
    };
  }

  /**
   * Asserts candidate is a plain object record.
   * @param candidate Value to validate.
   * @param pointer Error pointer path.
   * @returns Candidate cast as string-keyed record.
   */
  private expectRecord(candidate: unknown, pointer: string): Record<string, unknown> {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
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
    if (typeof candidate !== 'string' || candidate.length === 0) {
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
   * Reads one required string field and emits a schema pointer on failure.
   * @param candidate Raw candidate value.
   * @param pointer Error pointer path.
   * @returns Trimmed string value.
   */
  private expectRequiredString(candidate: unknown, pointer: string): string {
    const value = this.expectOptionalString(candidate, pointer);
    if (value) {
      return value;
    }

    this.throwConfigSchemaValidationError(`${pointer} is required.`, pointer);
  }

  /**
   * Validates optional boolean fields when present.
   * @param candidate Value to validate.
   * @param pointer Error pointer path.
   * @returns Boolean value when present; otherwise undefined.
   */
  private expectOptionalBoolean(candidate: unknown, pointer: string): boolean | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate !== 'boolean') {
      this.throwConfigSchemaValidationError(`${pointer} must be a boolean.`, pointer);
    }

    return candidate;
  }

  /**
   * Validates array payloads and preserves item typing for downstream validators.
   * @param candidate Value to validate.
   * @param pointer Error pointer path.
   * @returns Array payload.
   */
  private expectArray(candidate: unknown, pointer: string): unknown[] {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    this.throwConfigSchemaValidationError(`${pointer} must be an array.`, pointer);
  }

  /**
   * Validates optional positive integer fields when present.
   * @param candidate Value to validate.
   * @param pointer Error pointer path.
   * @returns Positive integer value when present; otherwise undefined.
   */
  private expectOptionalPositiveInteger(candidate: unknown, pointer: string): number | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate !== 'number' || !Number.isInteger(candidate) || candidate <= 0) {
      this.throwConfigSchemaValidationError(`${pointer} must be a positive integer.`, pointer);
    }

    return candidate;
  }

  /**
   * Validates optional non-negative integer fields when present.
   * @param candidate Value to validate.
   * @param pointer Error pointer path.
   * @returns Non-negative integer value when present; otherwise undefined.
   */
  private expectOptionalNonNegativeInteger(
    candidate: unknown,
    pointer: string,
  ): number | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate !== 'number' || !Number.isInteger(candidate) || candidate < 0) {
      this.throwConfigSchemaValidationError(`${pointer} must be a non-negative integer.`, pointer);
    }

    return candidate;
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
      if (typeof item !== 'string' || item.length === 0) {
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
        `${pointer} contains unsupported keys: ${unknownKeys.join(', ')}.`,
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
