import type { Theme } from '@inkjs/ui';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';

export interface ReactCliLiveActivityTagPalette {
  neutral: string;
  system: string;
  role: string;
  running: string;
  completed: string;
  todo: string;
  error: string;
}

export interface ReactCliLiveActivityPalette {
  borderColor: string;
  titleColor: string;
  summaryColor: string;
  bulletColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  systemTextColor: string;
  errorTextColor: string;
  tagPalette: ReactCliLiveActivityTagPalette;
}

export interface ReactCliConversationPalette {
  assistantTextColor: string;
  assistantHeadingColor: string;
  assistantQuoteColor: string;
  assistantCodeColor: string;
  userBubbleBorderColor: string;
  userTextColor: string;
}

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
  conversationPalette: ReactCliConversationPalette;
  liveActivityPalette: ReactCliLiveActivityPalette;
}

/**
 * Defines one fully resolved React CLI theme preset with Ink UI and shell palette layers.
 */
export interface ReactCliThemeDefinition {
  preset: CliReactThemePreset;
  inkTheme: Theme;
  shellPalette: ReactCliShellPalette;
}
