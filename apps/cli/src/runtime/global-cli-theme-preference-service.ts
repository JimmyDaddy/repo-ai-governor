import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import { parse, stringify } from 'yaml';
import {
  CLI_REACT_THEME_VALUES,
  type CliReactThemePreset,
} from '../constants/cli-react-theme.constant.js';

interface GlobalCliThemePreferencePayload {
  ui?: {
    react?: {
      theme?: string;
    };
  };
}

/**
 * Resolves and renders the lightweight global React-shell theme preference file.
 *
 * Why this exists:
 * the CLI needs one small cross-workspace preference layer without promoting a second
 * full governor config surface.
 */
export class GlobalCliThemePreferenceService {
  /**
   * Resolves the canonical global preference file path for the current user.
   * @param environment Optional environment map used to honor isolated HOME overrides.
   * @returns Absolute global preference file path.
   */
  public resolvePreferencePath(environment: NodeJS.ProcessEnv = process.env): string {
    return resolve(
      this.resolveHomeDirectory(environment),
      '.repo-ai-governor',
      'cli-preferences.yaml',
    );
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
    const preferencePath =
      options.preferencePath ?? this.resolvePreferencePath(options.environment);
    if (!existsSync(preferencePath)) {
      return null;
    }

    try {
      const parsedPayload = parse(
        readFileSync(preferencePath, 'utf8'),
      ) as GlobalCliThemePreferencePayload | null;
      const rawThemePreset = parsedPayload?.ui?.react?.theme?.trim().toLowerCase();
      if (!rawThemePreset || !CLI_REACT_THEME_VALUES.has(rawThemePreset)) {
        return null;
      }

      return rawThemePreset as CliReactThemePreset;
    } catch {
      return null;
    }
  }

  /**
   * Renders one minimal YAML payload that stores only the global theme preference.
   * @param themePreset Supported theme preset that should become the new global default.
   * @returns Serialized YAML content with trailing newline.
   */
  public renderPreferenceContent(themePreset: CliReactThemePreset): string {
    return `${stringify({
      ui: {
        react: {
          theme: themePreset,
        },
      },
    }).trimEnd()}\n`;
  }

  /**
   * Resolves the user home directory while honoring explicit HOME overrides in tests.
   * @param environment Environment map used by the current runtime.
   * @returns Absolute home directory path.
   */
  private resolveHomeDirectory(environment: NodeJS.ProcessEnv): string {
    const homeDirectoryCandidate = environment.HOME?.trim();
    return homeDirectoryCandidate && homeDirectoryCandidate.length > 0
      ? resolve(homeDirectoryCandidate)
      : homedir();
  }
}
