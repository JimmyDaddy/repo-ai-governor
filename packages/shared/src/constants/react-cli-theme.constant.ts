/**
 * Defines the supported React CLI theme presets shared by config validation and shell renderers.
 *
 * Why this exists:
 * config schema and CLI surfaces must validate against one canonical preset catalog.
 */
export enum CliReactThemePreset {
  GOVERNOR = 'governor',
  CATPPUCCIN = 'catppuccin',
  CALM = 'calm',
}

/**
 * Defines the canonical display order for supported React CLI theme presets.
 */
export const CLI_REACT_THEME_PRESET_ORDER = [
  CliReactThemePreset.GOVERNOR,
  CliReactThemePreset.CATPPUCCIN,
  CliReactThemePreset.CALM,
] as const;

/**
 * Defines the default React CLI theme used when no explicit preset is requested.
 */
export const DEFAULT_CLI_REACT_THEME_PRESET = CliReactThemePreset.GOVERNOR;

/**
 * Defines supported React CLI theme values as a reusable runtime validation set.
 */
export const CLI_REACT_THEME_VALUES = new Set<string>(CLI_REACT_THEME_PRESET_ORDER);
