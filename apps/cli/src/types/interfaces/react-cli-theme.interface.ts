import type { Theme } from '@inkjs/ui';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';

/**
 * Defines one shell-level color token set used by the shared React CLI layout.
 */
export interface ReactCliShellPalette {
  borderColor: string;
  titleColor: string;
  subtitleColor: string;
  attentionColor: string;
  sectionTitleColor: string;
  helpColor: string;
  footerColor: string;
  promptTitleColor: string;
}

/**
 * Defines one fully resolved React CLI theme preset with Ink UI and shell palette layers.
 */
export interface ReactCliThemeDefinition {
  preset: CliReactThemePreset;
  inkTheme: Theme;
  shellPalette: ReactCliShellPalette;
}
