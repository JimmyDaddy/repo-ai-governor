import * as vscode from 'vscode';

import { VSCODE_EXTENSION_COMMAND_IDS } from '../constants/index.js';
import type { VsCodeExtensionLocalizer } from './vscode-extension-localizer.js';

/**
 * Provides editor-local Governor code actions for lightweight companion entry points.
 *
 * Why this exists:
 * sprint-002 requires editor-native affordances without turning the extension into a full IDE
 * shell or inventing new command identities outside the frozen contract.
 */
export class VsCodeExtensionCodeActionProvider implements vscode.CodeActionProvider {
  public constructor(private readonly localizer: VsCodeExtensionLocalizer) {}

  /**
   * Creates editor-local Governor code actions.
   * @returns Quick-fix style code actions that route into the frozen command seam.
   */
  public provideCodeActions(): vscode.CodeAction[] {
    const openReviewDetailAction = new vscode.CodeAction(
      this.localizer.localizeText('Governor: Open review detail', 'Governor：打开评审详情'),
      vscode.CodeActionKind.QuickFix,
    );
    openReviewDetailAction.command = {
      command: VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
      title: this.localizer.localizeText('Open review detail', '打开评审详情'),
    };

    const refreshAction = new vscode.CodeAction(
      this.localizer.localizeText('Governor: Refresh governance views', 'Governor：刷新治理视图'),
      vscode.CodeActionKind.QuickFix,
    );
    refreshAction.command = {
      command: VSCODE_EXTENSION_COMMAND_IDS.REFRESH,
      title: this.localizer.localizeText('Refresh governance views', '刷新治理视图'),
    };

    return [openReviewDetailAction, refreshAction];
  }
}
