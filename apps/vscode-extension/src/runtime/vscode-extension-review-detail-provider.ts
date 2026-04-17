import * as vscode from 'vscode';

import { VSCODE_EXTENSION_CONTEXT_KEYS } from '../constants/index.js';
import type { VsCodeExtensionCommandRequest } from '../types/index.js';
import type { VsCodeExtensionPresentationBuilder } from './vscode-extension-presentation-builder.js';
import type { VsCodeExtensionSelectionStore } from './vscode-extension-selection-store.js';
import type { VsCodeExtensionServiceRuntime } from './vscode-extension-service-runtime.js';

/**
 * Owns the detail-only review webview for the Governor companion.
 *
 * Why this exists:
 * sprint-002 keeps rich review drill-down limited to one focused webview while tree views remain
 * lightweight and service-backed.
 */
export class VsCodeExtensionReviewDetailProvider implements vscode.WebviewViewProvider {
  private webviewView: vscode.WebviewView | undefined;

  public constructor(
    private readonly serviceRuntime: VsCodeExtensionServiceRuntime,
    private readonly selectionStore: VsCodeExtensionSelectionStore,
    private readonly presentationBuilder: VsCodeExtensionPresentationBuilder,
  ) {}

  /**
   * Resolves the contributed review-detail webview.
   * @param webviewView Contributed webview instance.
   */
  public async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this.webviewView = webviewView;
    webviewView.webview.options = {
      enableCommandUris: false,
    };
    await this.render();
  }

  /**
   * Refreshes the review-detail payload using current selection.
   * @param commandRequest Optional command-derived selection override.
   */
  public async refresh(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    this.selectionStore.applyCommandRequest(commandRequest);
    await this.render();
  }

  /**
   * Reveals the webview when it has already been resolved.
   * @param preserveFocus Whether to preserve current focus.
   */
  public show(preserveFocus = false): void {
    this.webviewView?.show(preserveFocus);
  }

  private async render(): Promise<void> {
    if (!this.webviewView) {
      return;
    }

    const currentSelection = this.selectionStore.getSnapshot();
    const detailSnapshot = await this.serviceRuntime.resolveReviewDetailSnapshot(currentSelection);
    if (detailSnapshot.selectedExecution) {
      const preservedQueueEntry =
        currentSelection.queueEntry?.executionId ===
        detailSnapshot.selectedExecution.execution.executionId
          ? currentSelection.queueEntry
          : undefined;
      this.selectionStore.applyCommandRequest({
        executionId: detailSnapshot.selectedExecution.execution.executionId,
        executionSessionId: detailSnapshot.selectedExecution.execution.executionSessionId,
        reviewSourcePath: currentSelection.reviewSourcePath,
        queueEntry: preservedQueueEntry,
        temporaryBridge: currentSelection.temporaryBridge,
      });
    }
    this.selectionStore.rememberReviewSourcePath(
      detailSnapshot.artifactPane?.reviewSourcePath ?? detailSnapshot.requestedReviewSourcePath,
    );

    this.webviewView.webview.html = this.presentationBuilder.buildReviewDetailHtml(detailSnapshot);
    await vscode.commands.executeCommand(
      'setContext',
      VSCODE_EXTENSION_CONTEXT_KEYS.REVIEW_DETAIL_AVAILABLE,
      Boolean(detailSnapshot.selectedExecution || detailSnapshot.requestedReviewSourcePath),
    );
  }
}
