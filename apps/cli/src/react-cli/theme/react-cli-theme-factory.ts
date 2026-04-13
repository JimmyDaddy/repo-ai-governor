import { defaultTheme, extendTheme } from '@inkjs/ui';
import type { Theme } from '@inkjs/ui';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import type { ReactCliShellPalette, ReactCliThemeDefinition } from '../../types/index.js';

export interface ReactCliInkAccentPalette {
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
 * Creates one resolved React CLI theme definition from shell and Ink accent tokens.
 * @param preset Stable preset identifier.
 * @param shellPalette Shell-level tokens used by the shared frame renderers.
 * @param inkPalette Ink UI accent tokens used by form controls and status surfaces.
 * @returns Resolved theme definition.
 */
export function createReactCliThemeDefinition(
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
