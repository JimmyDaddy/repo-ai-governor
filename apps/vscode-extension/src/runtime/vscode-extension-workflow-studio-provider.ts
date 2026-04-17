import type * as vscode from 'vscode';

import type { VsCodeExtensionCommandRequest } from '../types/index.js';
import type { VsCodeExtensionPresentationBuilder } from './vscode-extension-presentation-builder.js';
import type { VsCodeExtensionSelectionStore } from './vscode-extension-selection-store.js';
import type { VsCodeExtensionServiceRuntime } from './vscode-extension-service-runtime.js';

/**
 * Owns the workflow-studio evidence webview for the Phase C primary workbench rollout.
 *
 * Why this exists:
 * workflow-studio, desktop-decision, and support-truth evidence need one richer surface that still
 * renders only service-backed projections rather than extension-local governance truth.
 */
export class VsCodeExtensionWorkflowStudioProvider implements vscode.WebviewViewProvider {
  private webviewView: vscode.WebviewView | undefined;

  public constructor(
    private readonly serviceRuntime: VsCodeExtensionServiceRuntime,
    private readonly selectionStore: VsCodeExtensionSelectionStore,
    private readonly presentationBuilder: VsCodeExtensionPresentationBuilder,
  ) {}

  /**
   * Resolves the contributed workflow-studio webview.
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
   * Refreshes the workflow-studio payload using the current selection.
   * @param commandRequest Optional command-derived selection override.
   */
  public async refresh(commandRequest?: VsCodeExtensionCommandRequest): Promise<void> {
    this.selectionStore.applyCommandRequest(commandRequest);
    await this.render();
  }

  private async render(): Promise<void> {
    if (!this.webviewView) {
      return;
    }

    const snapshot = await this.serviceRuntime.resolveWorkflowStudioSnapshot(
      this.selectionStore.getSnapshot(),
    );
    this.webviewView.webview.html = this.presentationBuilder.buildWorkflowStudioHtml(snapshot);
  }
}
