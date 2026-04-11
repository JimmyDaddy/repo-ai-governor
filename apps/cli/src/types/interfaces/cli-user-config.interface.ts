import type {
  AdapterProviderKind,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  CliReactThemePreset,
  WorkspaceMode,
} from '@repo-ai-governor/shared';

export interface CliUserConfigRemoteApiAuthoringRecord {
  provider?: AdapterProviderKind;
  vendorBinding?: AdapterVendorBindingKind;
  model?: string;
  credentialEnvVar?: string;
  credentialRef?: string;
  endpoint?: string;
}

export interface CliUserConfigToolRecord {
  transport?: AdapterTransportKind;
  remoteApi?: CliUserConfigRemoteApiAuthoringRecord;
}

export interface CliUserConfigWorkspaceRecord {
  mode_preference?: WorkspaceMode;
}

export interface CliUserConfigUiRecord {
  react?: {
    theme?: CliReactThemePreset | null;
  };
}

export interface CliUserConfigDocument {
  workspace?: CliUserConfigWorkspaceRecord;
  ui?: CliUserConfigUiRecord;
  tools?: Record<string, CliUserConfigToolRecord | undefined>;
}
