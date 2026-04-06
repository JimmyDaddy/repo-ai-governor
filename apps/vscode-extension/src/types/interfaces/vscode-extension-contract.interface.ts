import type { VsCodeExtensionCommandId, VsCodeExtensionViewId } from '../aliases/index.js';

export interface VsCodeExtensionViewContribution {
  id: VsCodeExtensionViewId;
  titleKey: string;
  kind: 'tree' | 'webview';
  trustSensitive: boolean;
}

export interface VsCodeExtensionCommandContribution {
  id: VsCodeExtensionCommandId;
  titleKey: string;
  trustSensitive: boolean;
}

export interface VsCodeExtensionChatCommandContribution {
  name: string;
  descriptionKey: string;
}

export interface VsCodeExtensionContractSnapshot {
  containerId: string;
  chatParticipantId: string;
  chatParticipantName: string;
  trustMode: 'limited';
  views: readonly VsCodeExtensionViewContribution[];
  commands: readonly VsCodeExtensionCommandContribution[];
  chatCommands: readonly VsCodeExtensionChatCommandContribution[];
}
