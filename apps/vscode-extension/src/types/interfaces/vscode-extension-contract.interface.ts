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
  surfaceId: string;
  surfaceRole: string;
  truthOwner: string;
  nativeEntrypoints: readonly string[];
  workbenchPanels: readonly string[];
  queryCapabilityClasses: readonly string[];
  commandCapabilityClasses: readonly string[];
  temporaryBridgeCapabilityClasses: readonly string[];
  webviewUsageMode: string;
  publicSupportLevel: string;
  desktopRelationship: string;
  handoffTargets: readonly string[];
  continuityTokens: readonly string[];
  containerId: string;
  chatParticipantId: string;
  chatParticipantName: string;
  trustMode: 'limited';
  views: readonly VsCodeExtensionViewContribution[];
  commands: readonly VsCodeExtensionCommandContribution[];
  chatCommands: readonly VsCodeExtensionChatCommandContribution[];
}
