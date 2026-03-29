import { CliReactThemePreset } from '../../src/constants/cli-react-theme.constant.js';
import { resolveReactCliTheme } from '../../src/react-cli/theme/react-cli-theme-registry.js';

describe('resolveReactCliTheme', () => {
  it('returns the governor preset by default', () => {
    const theme = resolveReactCliTheme();

    expect(theme.preset).toBe(CliReactThemePreset.GOVERNOR);
    expect(theme.shellPalette.borderColor).toBeTruthy();
    expect(theme.inkTheme.components.StatusMessage).toBeDefined();
  });

  it('returns distinct shell palettes for supported presets', () => {
    const governorTheme = resolveReactCliTheme(CliReactThemePreset.GOVERNOR);
    const catppuccinTheme = resolveReactCliTheme(CliReactThemePreset.CATPPUCCIN);
    const calmTheme = resolveReactCliTheme(CliReactThemePreset.CALM);

    expect(catppuccinTheme.preset).toBe(CliReactThemePreset.CATPPUCCIN);
    expect(calmTheme.preset).toBe(CliReactThemePreset.CALM);
    expect(governorTheme.shellPalette.borderColor).not.toBe(
      catppuccinTheme.shellPalette.borderColor,
    );
    expect(calmTheme.shellPalette.titleColor).not.toBe(governorTheme.shellPalette.titleColor);
  });
});
