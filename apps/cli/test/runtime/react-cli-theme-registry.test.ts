import {
  CLI_REACT_THEME_PRESET_ORDER,
  CliReactThemePreset,
} from '../../src/constants/cli-react-theme.constant.js';
import { resolveReactCliTheme } from '../../src/react-cli/theme/react-cli-theme-registry.js';

describe('resolveReactCliTheme', () => {
  it('returns the governor preset by default', () => {
    const theme = resolveReactCliTheme();

    expect(theme.preset).toBe(CliReactThemePreset.GOVERNOR);
    expect(theme.shellPalette.borderColor).toBeTruthy();
    expect(theme.shellPalette.commandLogPalette.error).toBeTruthy();
    expect(theme.inkTheme.components.StatusMessage).toBeDefined();
  });

  it('returns distinct shell palettes for supported presets', () => {
    const governorTheme = resolveReactCliTheme(CliReactThemePreset.GOVERNOR);
    const copilotTheme = resolveReactCliTheme(CliReactThemePreset.COPILOT);
    const catppuccinTheme = resolveReactCliTheme(CliReactThemePreset.CATPPUCCIN);
    const calmTheme = resolveReactCliTheme(CliReactThemePreset.CALM);

    expect(copilotTheme.preset).toBe(CliReactThemePreset.COPILOT);
    expect(catppuccinTheme.preset).toBe(CliReactThemePreset.CATPPUCCIN);
    expect(calmTheme.preset).toBe(CliReactThemePreset.CALM);
    expect(governorTheme.shellPalette.borderColor).not.toBe(
      catppuccinTheme.shellPalette.borderColor,
    );
    expect(copilotTheme.shellPalette.promptTitleColor).not.toBe(
      governorTheme.shellPalette.promptTitleColor,
    );
    expect(calmTheme.shellPalette.titleColor).not.toBe(governorTheme.shellPalette.titleColor);
  });

  it('resolves every preset from the shared preset order', () => {
    expect(
      CLI_REACT_THEME_PRESET_ORDER.map((preset) => resolveReactCliTheme(preset).preset),
    ).toEqual([...CLI_REACT_THEME_PRESET_ORDER]);
  });

  it('provides log severity colors for every preset', () => {
    for (const preset of CLI_REACT_THEME_PRESET_ORDER) {
      const commandLogPalette = resolveReactCliTheme(preset).shellPalette.commandLogPalette;

      expect(commandLogPalette.debug).toBeTruthy();
      expect(commandLogPalette.info).toBeTruthy();
      expect(commandLogPalette.success).toBeTruthy();
      expect(commandLogPalette.warning).toBeTruthy();
      expect(commandLogPalette.error).toBeTruthy();
    }
  });

  it('provides composer token colors for every preset', () => {
    for (const preset of CLI_REACT_THEME_PRESET_ORDER) {
      const composerTokenPalette = resolveReactCliTheme(preset).shellPalette.composerTokenPalette;

      expect(composerTokenPalette.plain).toBeTruthy();
      expect(composerTokenPalette.slash).toBeTruthy();
      expect(composerTokenPalette.mention).toBeTruthy();
      expect(composerTokenPalette.slash).not.toBe(composerTokenPalette.plain);
      expect(composerTokenPalette.mention).not.toBe(composerTokenPalette.plain);
      expect(composerTokenPalette.mention).not.toBe(composerTokenPalette.slash);
    }
  });
});
