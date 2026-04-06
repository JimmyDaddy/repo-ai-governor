import * as vscode from 'vscode';

/**
 * Resolves inline bilingual copy for the VS Code extension runtime.
 *
 * Why this exists:
 * the extension needs lightweight runtime copy without introducing a second localization system
 * outside the repository's shared i18n and bilingual bridge constraints.
 */
export class VsCodeExtensionLocalizer {
  /**
   * Resolves locale-aware text from English/Chinese variants.
   * @param english English fallback text.
   * @param chinese Simplified-Chinese text.
   * @returns Locale-aware text for the current VS Code UI language.
   */
  public localizeText(english: string, chinese: string): string {
    return vscode.env.language.trim().toLowerCase().startsWith('zh') ? chinese : english;
  }
}
