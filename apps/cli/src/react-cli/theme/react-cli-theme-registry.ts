import { defaultTheme, extendTheme } from '@inkjs/ui';
import type { Theme } from '@inkjs/ui';
import {
  CliReactThemePreset,
  DEFAULT_CLI_REACT_THEME_PRESET,
} from '../../constants/cli-react-theme.constant.js';
import type { ReactCliShellPalette, ReactCliThemeDefinition } from '../../types/index.js';

interface ReactCliInkAccentPalette {
  info: string;
  success: string;
  warning: string;
  error: string;
  focus: string;
  selected: string;
  input: string;
}

/**
 * Creates one Ink UI theme by overlaying shared control colors onto the library defaults.
 * @param palette Accent palette mapped to status and focus semantics.
 * @returns Ink UI theme consumed by `ThemeProvider`.
 */
function createInkTheme(palette: ReactCliInkAccentPalette): Theme {
  return extendTheme(defaultTheme, {
    components: {
      Alert: {
        styles: {
          container: ({ variant }: { variant: keyof ReactCliInkAccentPalette }) => ({
            borderColor: palette[variant] ?? palette.info,
          }),
          icon: ({ variant }: { variant: keyof ReactCliInkAccentPalette }) => ({
            color: palette[variant] ?? palette.info,
          }),
          title: ({ variant }: { variant: keyof ReactCliInkAccentPalette }) => ({
            color: palette[variant] ?? palette.info,
            bold: true,
          }),
        },
      },
      ConfirmInput: {
        styles: {
          input: ({ isFocused }: { isFocused: boolean }) => ({
            color: isFocused ? palette.focus : palette.input,
            dimColor: !isFocused,
          }),
        },
      },
      EmailInput: {
        styles: {
          value: () => ({
            color: palette.input,
          }),
        },
      },
      MultiSelect: {
        styles: {
          focusIndicator: () => ({
            color: palette.focus,
          }),
          selectedIndicator: () => ({
            color: palette.selected,
          }),
          label: ({
            isFocused,
            isSelected,
          }: {
            isFocused: boolean;
            isSelected: boolean;
          }) => ({
            color: isFocused ? palette.focus : isSelected ? palette.selected : palette.input,
          }),
        },
      },
      PasswordInput: {
        styles: {
          value: () => ({
            color: palette.input,
          }),
        },
      },
      Select: {
        styles: {
          focusIndicator: () => ({
            color: palette.focus,
          }),
          selectedIndicator: () => ({
            color: palette.selected,
          }),
          label: ({
            isFocused,
            isSelected,
          }: {
            isFocused: boolean;
            isSelected: boolean;
          }) => ({
            color: isFocused ? palette.focus : isSelected ? palette.selected : palette.input,
          }),
        },
      },
      StatusMessage: {
        styles: {
          icon: ({ variant }: { variant: keyof ReactCliInkAccentPalette }) => ({
            color: palette[variant] ?? palette.info,
          }),
          message: () => ({
            color: palette.input,
          }),
        },
      },
      TextInput: {
        styles: {
          value: () => ({
            color: palette.input,
          }),
        },
      },
    },
  });
}

/**
 * Creates one resolved React CLI theme definition.
 * @param preset Stable preset identifier.
 * @param shellPalette Shell-level tokens used by the shared frame renderers.
 * @param inkPalette Ink UI accent tokens used by form controls and status surfaces.
 * @returns Resolved theme definition.
 */
function createThemeDefinition(
  preset: CliReactThemePreset,
  shellPalette: ReactCliShellPalette,
  inkPalette: ReactCliInkAccentPalette,
): ReactCliThemeDefinition {
  return {
    preset,
    inkTheme: createInkTheme(inkPalette),
    shellPalette,
  };
}

const REACT_CLI_THEME_REGISTRY: Record<CliReactThemePreset, ReactCliThemeDefinition> = {
  [CliReactThemePreset.GOVERNOR]: createThemeDefinition(
    CliReactThemePreset.GOVERNOR,
    {
      borderColor: '#5E81AC',
      titleColor: '#88C0D0',
      subtitleColor: '#81A1C1',
      attentionColor: '#EBCB8B',
      sectionTitleColor: '#ECEFF4',
      helpColor: '#A7B4C4',
      footerColor: '#8FBCBB',
      promptTitleColor: '#88C0D0',
      conversationPalette: {
        assistantTextColor: '#ECEFF4',
        assistantHeadingColor: '#88C0D0',
        assistantQuoteColor: '#81A1C1',
        assistantCodeColor: '#88C0D0',
        userBubbleBorderColor: '#8FBCBB',
        userTextColor: '#ECEFF4',
      },
      liveActivityPalette: {
        borderColor: '#5E81AC',
        titleColor: '#A7B4C4',
        summaryColor: '#88C0D0',
        bulletColor: '#A7B4C4',
        primaryTextColor: '#ECEFF4',
        secondaryTextColor: '#A7B4C4',
        errorTextColor: '#EBCB8B',
        tagPalette: {
          neutral: '#81A1C1',
          role: '#5E81AC',
          running: '#88C0D0',
          completed: '#A3BE8C',
          todo: '#EBCB8B',
          error: '#BF616A',
        },
      },
    },
    {
      info: '#5E81AC',
      success: '#A3BE8C',
      warning: '#EBCB8B',
      error: '#BF616A',
      focus: '#88C0D0',
      selected: '#A3BE8C',
      input: '#E5E9F0',
    },
  ),
  [CliReactThemePreset.CATPPUCCIN]: createThemeDefinition(
    CliReactThemePreset.CATPPUCCIN,
    {
      borderColor: '#8AADF4',
      titleColor: '#C6A0F6',
      subtitleColor: '#939AB7',
      attentionColor: '#EED49F',
      sectionTitleColor: '#CAD3F5',
      helpColor: '#A5ADCB',
      footerColor: '#F5BDE6',
      promptTitleColor: '#8AADF4',
      conversationPalette: {
        assistantTextColor: '#CAD3F5',
        assistantHeadingColor: '#C6A0F6',
        assistantQuoteColor: '#939AB7',
        assistantCodeColor: '#8AADF4',
        userBubbleBorderColor: '#F5BDE6',
        userTextColor: '#CAD3F5',
      },
      liveActivityPalette: {
        borderColor: '#8AADF4',
        titleColor: '#A5ADCB',
        summaryColor: '#C6A0F6',
        bulletColor: '#A5ADCB',
        primaryTextColor: '#CAD3F5',
        secondaryTextColor: '#A5ADCB',
        errorTextColor: '#ED8796',
        tagPalette: {
          neutral: '#939AB7',
          role: '#91A6D9',
          running: '#8AADF4',
          completed: '#A6DA95',
          todo: '#EED49F',
          error: '#ED8796',
        },
      },
    },
    {
      info: '#8AADF4',
      success: '#A6DA95',
      warning: '#EED49F',
      error: '#ED8796',
      focus: '#C6A0F6',
      selected: '#A6DA95',
      input: '#CAD3F5',
    },
  ),
  [CliReactThemePreset.CALM]: createThemeDefinition(
    CliReactThemePreset.CALM,
    {
      borderColor: '#9CCFD8',
      titleColor: '#C4A7E7',
      subtitleColor: '#908CAA',
      attentionColor: '#F6C177',
      sectionTitleColor: '#E0DEF4',
      helpColor: '#908CAA',
      footerColor: '#9CCFD8',
      promptTitleColor: '#EBBCBA',
      conversationPalette: {
        assistantTextColor: '#E0DEF4',
        assistantHeadingColor: '#C4A7E7',
        assistantQuoteColor: '#908CAA',
        assistantCodeColor: '#EBBCBA',
        userBubbleBorderColor: '#9CCFD8',
        userTextColor: '#E0DEF4',
      },
      liveActivityPalette: {
        borderColor: '#9CCFD8',
        titleColor: '#908CAA',
        summaryColor: '#C4A7E7',
        bulletColor: '#908CAA',
        primaryTextColor: '#E0DEF4',
        secondaryTextColor: '#908CAA',
        errorTextColor: '#EB6F92',
        tagPalette: {
          neutral: '#908CAA',
          role: '#9CB4D8',
          running: '#9CCFD8',
          completed: '#31748F',
          todo: '#F6C177',
          error: '#EB6F92',
        },
      },
    },
    {
      info: '#9CCFD8',
      success: '#31748F',
      warning: '#F6C177',
      error: '#EB6F92',
      focus: '#C4A7E7',
      selected: '#31748F',
      input: '#E0DEF4',
    },
  ),
};

/**
 * Resolves one React CLI theme preset to a concrete theme definition.
 * @param preset Optional requested preset.
 * @returns Resolved theme definition, defaulting to `governor`.
 */
export function resolveReactCliTheme(preset?: CliReactThemePreset | null): ReactCliThemeDefinition {
  return REACT_CLI_THEME_REGISTRY[preset ?? DEFAULT_CLI_REACT_THEME_PRESET];
}
