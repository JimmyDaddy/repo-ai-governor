import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';

export type ReactCliStatusVariant = 'info' | 'success' | 'warning' | 'error';

export interface ReactCliSectionViewModel {
  title: string;
  lines: string[];
}

export interface ReactCliViewModel {
  title: string;
  subtitle?: string;
  themePreset?: CliReactThemePreset;
  statusMessage?: string;
  statusVariant?: ReactCliStatusVariant;
  attentionSection?: ReactCliSectionViewModel;
  sections: ReactCliSectionViewModel[];
  helpSection?: ReactCliSectionViewModel;
  footerShortcutsTitle: string;
  footerShortcuts: string[];
}
