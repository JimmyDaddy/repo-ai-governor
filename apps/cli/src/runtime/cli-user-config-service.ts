import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import {
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  CLI_REACT_THEME_VALUES,
  type CliReactThemePreset,
  ConfigError,
  GovernorErrorCode,
  RuntimeError,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import { parse, stringify } from 'yaml';
import type { CliUserConfigDocument } from '../types/interfaces/cli-user-config.interface.js';

type CliTextLocalizer = (english: string, chinese: string) => string;

const USER_CONFIG_FILE_NAME = 'user-config.yaml';
const LEGACY_CLI_PREFERENCE_FILE_NAME = 'cli-preferences.yaml';
const SUPPORTED_USER_CONFIG_TOOL_IDS = new Set<string>(Object.values(AdapterSurface));
const SUPPORTED_TRANSPORT_VALUES = new Set<string>(Object.values(AdapterTransportKind));
const SUPPORTED_PROVIDER_VALUES = new Set<string>(Object.values(AdapterProviderKind));
const SUPPORTED_VENDOR_BINDING_VALUES = new Set<string>(Object.values(AdapterVendorBindingKind));
const SUPPORTED_WORKSPACE_MODE_VALUES = new Set<string>(Object.values(WorkspaceMode));
const USER_CONFIG_TOOL_KEY_SUFFIXES = [
  'transport',
  'remoteApi.provider',
  'remoteApi.vendorBinding',
  'remoteApi.model',
  'remoteApi.credentialEnvVar',
  'remoteApi.credentialRef',
  'remoteApi.endpoint',
] as const;
const DEFAULT_LOCALIZE_TEXT: CliTextLocalizer = (english) => english;

interface CliUserConfigServiceDependencies {
  localizeText?: CliTextLocalizer;
}

/**
 * Owns user-local config path resolution, legacy migration reads, and dot-path mutations.
 */
export class CliUserConfigService {
  private localizeText: CliTextLocalizer;

  public constructor(dependencies: CliUserConfigServiceDependencies = {}) {
    this.localizeText = dependencies.localizeText ?? DEFAULT_LOCALIZE_TEXT;
  }

  /**
   * Updates the runtime text localizer used by user-facing validation paths.
   * @param localizeText Locale-aware English/Chinese text resolver.
   * @returns Void.
   */
  public setLocalizeText(localizeText: CliTextLocalizer): void {
    this.localizeText = localizeText;
  }

  /**
   * Resolves the canonical user-local config path for the current user.
   * @param environment Optional environment map honoring isolated HOME overrides.
   * @returns Absolute canonical config path.
   */
  public resolveConfigPath(environment: NodeJS.ProcessEnv = process.env): string {
    return resolve(
      this.resolveHomeDirectory(environment),
      '.repo-ai-governor',
      USER_CONFIG_FILE_NAME,
    );
  }

  /**
   * Resolves the legacy CLI preference path kept for compatibility reads only.
   * @param environment Optional environment map honoring isolated HOME overrides.
   * @returns Absolute legacy preference path.
   */
  public resolveLegacyPreferencePath(environment: NodeJS.ProcessEnv = process.env): string {
    return resolve(
      this.resolveHomeDirectory(environment),
      '.repo-ai-governor',
      LEGACY_CLI_PREFERENCE_FILE_NAME,
    );
  }

  /**
   * Loads the canonical user-local config document without applying legacy compatibility reads.
   * @param options Optional path/environment overrides.
   * @returns Parsed canonical user-local config document.
   */
  public loadCanonicalConfig(
    options: {
      environment?: NodeJS.ProcessEnv;
      configPath?: string;
    } = {},
  ): CliUserConfigDocument {
    const configPath = options.configPath ?? this.resolveConfigPath(options.environment);
    const canonicalDocument = this.loadYamlDocument(configPath);
    if (
      canonicalDocument &&
      (typeof canonicalDocument !== 'object' || Array.isArray(canonicalDocument))
    ) {
      throw new ConfigError(
        GovernorErrorCode.CONFIG_FILE_PARSE_FAILED,
        this.localizeText(
          `User config must parse into one object document at ${configPath}.`,
          `用户本地配置在 ${configPath} 必须解析为一个对象文档。`,
        ),
        {
          configPath,
        },
      );
    }

    return structuredClone(
      (canonicalDocument as CliUserConfigDocument | null) ?? {},
    ) as CliUserConfigDocument;
  }

  /**
   * Loads canonical user-local config and merges legacy theme preference when needed.
   * @param options Optional path/environment overrides.
   * @returns Parsed user-local config document.
   */
  public loadConfig(
    options: {
      environment?: NodeJS.ProcessEnv;
      configPath?: string;
      legacyPreferencePath?: string;
    } = {},
  ): CliUserConfigDocument {
    const legacyPreferencePath =
      options.legacyPreferencePath ?? this.resolveLegacyPreferencePath(options.environment);
    const mergedDocument = this.loadCanonicalConfig(options);
    const legacyThemePreference = this.loadLegacyThemePreference(legacyPreferencePath);
    if (!this.hasKeyPath(mergedDocument, ['ui', 'react', 'theme']) && legacyThemePreference) {
      mergedDocument.ui = mergedDocument.ui ?? {};
      mergedDocument.ui.react = mergedDocument.ui.react ?? {};
      mergedDocument.ui.react.theme = legacyThemePreference;
    }

    return mergedDocument;
  }

  /**
   * Resolves the persisted global React-shell theme preference from canonical or legacy config.
   * @param options Optional path/environment overrides.
   * @returns Supported theme preset or `null`.
   */
  public loadThemePreference(
    options: {
      environment?: NodeJS.ProcessEnv;
      configPath?: string;
      legacyPreferencePath?: string;
    } = {},
  ): CliReactThemePreset | null {
    const document = this.loadConfig(options);
    const rawThemePreset = document.ui?.react?.theme?.trim().toLowerCase() ?? null;
    if (!rawThemePreset || !CLI_REACT_THEME_VALUES.has(rawThemePreset)) {
      return null;
    }
    return rawThemePreset as CliReactThemePreset;
  }

  /**
   * Resolves one user-local workspace mode preference when the canonical config defines it.
   * @param options Optional path/environment overrides.
   * @returns Workspace mode preference or `null`.
   */
  public loadWorkspaceModePreference(
    options: {
      environment?: NodeJS.ProcessEnv;
      configPath?: string;
      legacyPreferencePath?: string;
    } = {},
  ): WorkspaceMode | null {
    const document = this.loadConfig(options);
    const rawModePreference = document.workspace?.mode_preference?.trim().toLowerCase() ?? null;
    if (!rawModePreference || !SUPPORTED_WORKSPACE_MODE_VALUES.has(rawModePreference)) {
      return null;
    }
    return rawModePreference as WorkspaceMode;
  }

  /**
   * Lists all currently populated supported key/value entries from one user-local config document.
   * @param document Parsed user-config document.
   * @returns Stable ordered key/value list.
   */
  public listValues(document: CliUserConfigDocument): Array<{
    keyPath: string;
    value: string;
  }> {
    const entries: Array<{ keyPath: string; value: string }> = [];
    const supportedKeyPaths = [
      'workspace.mode_preference',
      'ui.react.theme',
      ...Object.values(AdapterSurface).flatMap((toolId) =>
        USER_CONFIG_TOOL_KEY_SUFFIXES.map((suffix) => `tools.${toolId}.${suffix}`),
      ),
    ];

    for (const keyPath of supportedKeyPaths) {
      const value = this.getValue(document, keyPath);
      if (value !== null) {
        entries.push({ keyPath, value });
      }
    }

    return entries;
  }

  /**
   * Reads one supported user-config value by dot path.
   * @param document Parsed user-config document.
   * @param keyPath Supported dot path.
   * @returns Stored value or `null` when unset.
   */
  public getValue(document: CliUserConfigDocument, keyPath: string): string | null {
    this.assertSupportedKeyPath(keyPath);
    const segments = keyPath.split('.');
    let cursor: unknown = document;
    for (const segment of segments) {
      if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
        return null;
      }
      cursor = (cursor as Record<string, unknown>)[segment];
    }
    if (typeof cursor !== 'string') {
      return null;
    }
    const normalizedValue = cursor.trim();
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  /**
   * Returns one cloned document with the supplied supported key path set to a validated value.
   * @param document Source document.
   * @param keyPath Supported dot path.
   * @param rawValue Raw CLI value.
   * @returns Cloned document containing the new value.
   */
  public setValue(
    document: CliUserConfigDocument,
    keyPath: string,
    rawValue: string,
  ): CliUserConfigDocument {
    this.assertSupportedKeyPath(keyPath);
    const normalizedValue = this.normalizeValueForKeyPath(keyPath, rawValue);
    const nextDocument = structuredClone(document) as Record<string, unknown>;
    const segments = keyPath.split('.');
    let cursor = nextDocument;
    for (const segment of segments.slice(0, -1)) {
      const currentValue = cursor[segment];
      if (!currentValue || typeof currentValue !== 'object' || Array.isArray(currentValue)) {
        cursor[segment] = {};
      }
      cursor = cursor[segment] as Record<string, unknown>;
    }
    cursor[segments.at(-1) as string] = normalizedValue;
    return nextDocument as CliUserConfigDocument;
  }

  /**
   * Returns one cloned document with the supplied supported key path removed and empty parents pruned.
   * `ui.react.theme` keeps one explicit null tombstone so canonical config can suppress legacy fallback.
   * @param document Source document.
   * @param keyPath Supported dot path.
   * @returns Cloned document without the requested path.
   */
  public unsetValue(document: CliUserConfigDocument, keyPath: string): CliUserConfigDocument {
    this.assertSupportedKeyPath(keyPath);
    const nextDocument = structuredClone(document) as Record<string, unknown>;
    if (keyPath === 'ui.react.theme') {
      // Keep an explicit tombstone so compatibility reads do not resurrect the legacy theme file.
      const uiRecord = this.ensureObjectRecord(nextDocument, 'ui');
      const reactRecord = this.ensureObjectRecord(uiRecord, 'react');
      reactRecord.theme = null;
      return nextDocument as CliUserConfigDocument;
    }
    const segments = keyPath.split('.');
    this.unsetValueAtSegments(nextDocument, segments);
    return nextDocument as CliUserConfigDocument;
  }

  /**
   * Renders one user-config document into stable YAML with trailing newline.
   * @param document Parsed user-config document.
   * @returns UTF-8 YAML content.
   */
  public renderConfigContent(document: CliUserConfigDocument): string {
    return `${stringify(document).trimEnd()}\n`;
  }

  /**
   * Creates one canonical user-config payload that stores only the global React-shell theme.
   * @param themePreset Supported theme preset.
   * @returns UTF-8 YAML content.
   */
  public renderThemePreferenceContent(themePreset: CliReactThemePreset): string {
    return this.renderConfigContent({
      ui: {
        react: {
          theme: themePreset,
        },
      },
    });
  }

  /**
   * Resolves whether canonical or legacy user-local config exists on disk.
   * @param options Optional path/environment overrides.
   * @returns Path-level status payload.
   */
  public resolveStatus(
    options: {
      environment?: NodeJS.ProcessEnv;
      configPath?: string;
      legacyPreferencePath?: string;
    } = {},
  ) {
    const configPath = options.configPath ?? this.resolveConfigPath(options.environment);
    const legacyPreferencePath =
      options.legacyPreferencePath ?? this.resolveLegacyPreferencePath(options.environment);
    return {
      configPath,
      legacyPreferencePath,
      configExists: existsSync(configPath),
      legacyPreferenceExists: existsSync(legacyPreferencePath),
      themePreference: this.loadThemePreference(options),
      workspaceModePreference: this.loadWorkspaceModePreference(options),
    };
  }

  private loadYamlDocument(filePath: string): unknown | null {
    if (!existsSync(filePath)) {
      return null;
    }
    try {
      return parse(readFileSync(filePath, 'utf8')) as unknown;
    } catch (error) {
      throw new ConfigError(
        GovernorErrorCode.CONFIG_FILE_PARSE_FAILED,
        this.localizeText(
          `Failed to parse user-local config file at ${filePath}.`,
          `解析 ${filePath} 处的用户本地配置文件失败。`,
        ),
        {
          configPath: filePath,
        },
        error,
      );
    }
  }

  private loadLegacyThemePreference(legacyPreferencePath: string): CliReactThemePreset | null {
    const legacyDocument = this.loadYamlDocument(legacyPreferencePath);
    if (!legacyDocument || typeof legacyDocument !== 'object' || Array.isArray(legacyDocument)) {
      return null;
    }
    const rawThemePreset = (
      ((legacyDocument as Record<string, unknown>).ui as Record<string, unknown> | undefined)
        ?.react as Record<string, unknown> | undefined
    )?.theme;
    if (typeof rawThemePreset !== 'string') {
      return null;
    }
    const normalizedThemePreset = rawThemePreset.trim().toLowerCase();
    if (!CLI_REACT_THEME_VALUES.has(normalizedThemePreset)) {
      return null;
    }
    return normalizedThemePreset as CliReactThemePreset;
  }

  private assertSupportedKeyPath(keyPath: string): void {
    const normalizedKeyPath = keyPath.trim();
    if (
      normalizedKeyPath === 'workspace.mode_preference' ||
      normalizedKeyPath === 'ui.react.theme'
    ) {
      return;
    }

    const toolPathMatch = normalizedKeyPath.match(
      /^tools\.([a-z0-9-]+)\.(transport|remoteApi\.(provider|vendorBinding|model|credentialEnvVar|credentialRef|endpoint))$/u,
    );
    if (toolPathMatch && SUPPORTED_USER_CONFIG_TOOL_IDS.has(toolPathMatch[1] ?? '')) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.USER_CONFIG_KEY_INVALID,
      this.localizeText(
        `Unsupported user-config key path "${normalizedKeyPath}".`,
        `不支持的用户本地配置键路径 "${normalizedKeyPath}"。`,
      ),
      {
        keyPath: normalizedKeyPath,
      },
    );
  }

  private normalizeValueForKeyPath(keyPath: string, rawValue: string): string {
    const trimmedValue = rawValue.trim();
    if (trimmedValue.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.USER_CONFIG_VALUE_INVALID,
        this.localizeText(
          `User-config value for "${keyPath}" cannot be empty.`,
          `"${keyPath}" 的用户本地配置值不能为空。`,
        ),
        {
          keyPath,
        },
      );
    }

    if (keyPath === 'workspace.mode_preference') {
      const normalizedMode = trimmedValue.toLowerCase();
      if (!SUPPORTED_WORKSPACE_MODE_VALUES.has(normalizedMode)) {
        throw new RuntimeError(
          GovernorErrorCode.USER_CONFIG_VALUE_INVALID,
          this.localizeText(
            `workspace.mode_preference must be one of ${Array.from(SUPPORTED_WORKSPACE_MODE_VALUES).join('|')}.`,
            `workspace.mode_preference 必须是 ${Array.from(SUPPORTED_WORKSPACE_MODE_VALUES).join('|')} 之一。`,
          ),
          {
            keyPath,
            value: rawValue,
          },
        );
      }
      return normalizedMode;
    }

    if (keyPath === 'ui.react.theme') {
      const normalizedTheme = trimmedValue.toLowerCase();
      if (!CLI_REACT_THEME_VALUES.has(normalizedTheme)) {
        throw new RuntimeError(
          GovernorErrorCode.USER_CONFIG_VALUE_INVALID,
          this.localizeText(
            `ui.react.theme must be one of ${Array.from(CLI_REACT_THEME_VALUES).join('|')}.`,
            `ui.react.theme 必须是 ${Array.from(CLI_REACT_THEME_VALUES).join('|')} 之一。`,
          ),
          {
            keyPath,
            value: rawValue,
          },
        );
      }
      return normalizedTheme;
    }

    if (keyPath.endsWith('.transport')) {
      const normalizedTransport = trimmedValue.toLowerCase();
      if (!SUPPORTED_TRANSPORT_VALUES.has(normalizedTransport)) {
        throw new RuntimeError(
          GovernorErrorCode.USER_CONFIG_VALUE_INVALID,
          this.localizeText(
            `transport must be one of ${Array.from(SUPPORTED_TRANSPORT_VALUES).join('|')}.`,
            `transport 必须是 ${Array.from(SUPPORTED_TRANSPORT_VALUES).join('|')} 之一。`,
          ),
          {
            keyPath,
            value: rawValue,
          },
        );
      }
      return normalizedTransport;
    }

    if (keyPath.endsWith('.remoteApi.provider')) {
      const normalizedProvider = trimmedValue.toLowerCase();
      if (!SUPPORTED_PROVIDER_VALUES.has(normalizedProvider)) {
        throw new RuntimeError(
          GovernorErrorCode.USER_CONFIG_VALUE_INVALID,
          this.localizeText(
            `remoteApi.provider must be one of ${Array.from(SUPPORTED_PROVIDER_VALUES).join('|')}.`,
            `remoteApi.provider 必须是 ${Array.from(SUPPORTED_PROVIDER_VALUES).join('|')} 之一。`,
          ),
          {
            keyPath,
            value: rawValue,
          },
        );
      }
      return normalizedProvider;
    }

    if (keyPath.endsWith('.remoteApi.vendorBinding')) {
      const normalizedVendorBinding = trimmedValue.toLowerCase();
      if (!SUPPORTED_VENDOR_BINDING_VALUES.has(normalizedVendorBinding)) {
        throw new RuntimeError(
          GovernorErrorCode.USER_CONFIG_VALUE_INVALID,
          this.localizeText(
            `remoteApi.vendorBinding must be one of ${Array.from(SUPPORTED_VENDOR_BINDING_VALUES).join('|')}.`,
            `remoteApi.vendorBinding 必须是 ${Array.from(SUPPORTED_VENDOR_BINDING_VALUES).join('|')} 之一。`,
          ),
          {
            keyPath,
            value: rawValue,
          },
        );
      }
      return normalizedVendorBinding;
    }

    if (keyPath.endsWith('.remoteApi.credentialRef')) {
      if (!trimmedValue.startsWith('secret://')) {
        throw new RuntimeError(
          GovernorErrorCode.USER_CONFIG_VALUE_INVALID,
          this.localizeText(
            'remoteApi.credentialRef must use secret://... selector syntax.',
            'remoteApi.credentialRef 必须使用 secret://... selector 语法。',
          ),
          {
            keyPath,
            value: rawValue,
          },
        );
      }
      return trimmedValue;
    }

    return trimmedValue;
  }

  private hasKeyPath(document: unknown, segments: string[]): boolean {
    let cursor = document;
    for (const segment of segments) {
      if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
        return false;
      }
      const record = cursor as Record<string, unknown>;
      if (!Object.hasOwn(record, segment)) {
        return false;
      }
      cursor = record[segment];
    }
    return true;
  }

  private ensureObjectRecord(
    cursor: Record<string, unknown>,
    segment: string,
  ): Record<string, unknown> {
    const currentValue = cursor[segment];
    if (!currentValue || typeof currentValue !== 'object' || Array.isArray(currentValue)) {
      cursor[segment] = {};
    }
    return cursor[segment] as Record<string, unknown>;
  }

  private unsetValueAtSegments(
    cursor: Record<string, unknown>,
    segments: string[],
    index = 0,
  ): boolean {
    const segment = segments[index];
    if (!segment) {
      return Object.keys(cursor).length === 0;
    }

    if (index === segments.length - 1) {
      delete cursor[segment];
      return Object.keys(cursor).length === 0;
    }

    const nextCursor = cursor[segment];
    if (!nextCursor || typeof nextCursor !== 'object' || Array.isArray(nextCursor)) {
      return Object.keys(cursor).length === 0;
    }

    const childEmpty = this.unsetValueAtSegments(
      nextCursor as Record<string, unknown>,
      segments,
      index + 1,
    );
    if (childEmpty) {
      delete cursor[segment];
    }
    return Object.keys(cursor).length === 0;
  }

  private resolveHomeDirectory(environment: NodeJS.ProcessEnv): string {
    const homeDirectoryCandidate = environment.HOME?.trim();
    if (homeDirectoryCandidate && homeDirectoryCandidate.length > 0) {
      return resolve(homeDirectoryCandidate);
    }

    const systemHomeDirectory = homedir().trim();
    if (systemHomeDirectory.length > 0) {
      return resolve(systemHomeDirectory);
    }

    throw new RuntimeError(
      GovernorErrorCode.USER_CONFIG_PATH_INVALID,
      this.localizeText(
        'Unable to resolve the current home directory for user-local config.',
        '无法解析当前用户本地配置对应的 home 目录。',
      ),
    );
  }
}
