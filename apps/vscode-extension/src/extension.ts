import type { ExtensionContext } from 'vscode';

import { VsCodeExtensionHost } from './runtime/vscode-extension-host.js';

let activeExtensionHost: VsCodeExtensionHost | undefined;

/**
 * Activates the VS Code extension entrypoint.
 *
 * Why this exists:
 * TK-562 freezes a real extension app surface under apps/vscode-extension so later sprint tasks
 * can add views, chat, and commands without changing the extension identity or manifest seam.
 */
export async function activate(context: ExtensionContext): Promise<void> {
  activeExtensionHost = new VsCodeExtensionHost();
  await activeExtensionHost.activate(context);
}

/**
 * Deactivates the VS Code extension entrypoint.
 *
 * Why this exists:
 * keeping an explicit deactivate seam makes later runtime disposals additive instead of ad hoc.
 */
export async function deactivate(): Promise<void> {
  await activeExtensionHost?.dispose();
  activeExtensionHost = undefined;
}
