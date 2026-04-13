import { DEFAULT_CLI_REACT_THEME_PRESET } from '../../constants/cli-react-theme.constant.js';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import type { ReactCliThemeDefinition } from '../../types/index.js';
import { REACT_CLI_THEME_PRESET_REGISTRY } from './react-cli-theme-presets.js';

/**
 * Resolves one React CLI theme preset to a concrete theme definition.
 * @param preset Optional requested preset.
 * @returns Resolved theme definition, defaulting to `governor`.
 */
export function resolveReactCliTheme(preset?: CliReactThemePreset | null): ReactCliThemeDefinition {
  return REACT_CLI_THEME_PRESET_REGISTRY[preset ?? DEFAULT_CLI_REACT_THEME_PRESET];
}
