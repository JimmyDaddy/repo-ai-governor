import type {
  VSCODE_EXTENSION_COMMAND_IDS,
  VSCODE_EXTENSION_VIEW_IDS,
} from '../../constants/index.js';

export type VsCodeExtensionViewId =
  (typeof VSCODE_EXTENSION_VIEW_IDS)[keyof typeof VSCODE_EXTENSION_VIEW_IDS];

export type VsCodeExtensionCommandId =
  (typeof VSCODE_EXTENSION_COMMAND_IDS)[keyof typeof VSCODE_EXTENSION_COMMAND_IDS];
