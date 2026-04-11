import type { CliReactThemePreset } from '../constants/cli-react-theme.constant.js';
import { CliUserConfigService } from './cli-user-config-service.js';

/**
 * Resolves and updates the canonical global React-shell theme preference inside user-config.
 *
 * Why this exists:
 * the CLI needs one small cross-workspace preference layer without promoting a second
 * full governor config surface.
 */
export class GlobalCliThemePreferenceService {
  private readonly userConfigService: CliUserConfigService;

  public constructor(userConfigService = new CliUserConfigService()) {
    this.userConfigService = userConfigService;
  }

  /**
   * Resolves the canonical global preference file path for the current user.
   * @param environment Optional environment map used to honor isolated HOME overrides.
   * @returns Absolute global preference file path.
   */
  public resolvePreferencePath(environment: NodeJS.ProcessEnv = process.env): string {
    return this.userConfigService.resolveConfigPath(environment);
  }

  /**
   * Loads one persisted global React-shell theme preference when present and valid.
   * @param options Optional environment/path overrides used by tests and isolated runtimes.
   * @returns Supported theme preset or `null` when the file is missing or invalid.
   */
  public loadThemePreference(
    options: {
      environment?: NodeJS.ProcessEnv;
      preferencePath?: string;
    } = {},
  ): CliReactThemePreset | null {
    return this.userConfigService.loadThemePreference({
      environment: options.environment,
      configPath: options.preferencePath ?? undefined,
    });
  }

  /**
   * Renders one merged YAML payload that updates only the global theme preference while
   * preserving the rest of canonical user-config state.
   * @param options Theme preset plus optional environment/path overrides.
   * @returns Serialized YAML content with trailing newline.
   */
  public renderMergedPreferenceContent(options: {
    themePreset: CliReactThemePreset;
    environment?: NodeJS.ProcessEnv;
    preferencePath?: string;
  }): string {
    const existingDocument = this.userConfigService.loadCanonicalConfig({
      environment: options.environment,
      configPath: options.preferencePath,
    });
    const nextDocument = this.userConfigService.setValue(
      existingDocument,
      'ui.react.theme',
      options.themePreset,
    );
    return this.userConfigService.renderConfigContent(nextDocument);
  }
}
