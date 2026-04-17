import type {
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationExecutionBoardEntry,
  OrchestrationGovernanceQueueEntry,
  OrchestrationGovernanceTemporaryBridgeEntry,
  OrchestrationHandoffTarget,
  OrchestrationHitlDecisionOption,
  OrchestrationQueueOverviewQueryResponse,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
} from '@repo-ai-governor/orchestration-service-client';

export interface VsCodeExtensionTreeNodeCommandDescriptor {
  command: string;
  title: string;
  arguments?: readonly unknown[];
}

export interface VsCodeExtensionTreeNodeDescriptor {
  nodeId: string;
  label: string;
  description?: string;
  tooltip?: string;
  themeIconId?: string;
  contextValue?: string;
  resourceUriPath?: string;
  selectionRequest?: VsCodeExtensionCommandRequest;
  command?: VsCodeExtensionTreeNodeCommandDescriptor;
  children?: readonly VsCodeExtensionTreeNodeDescriptor[];
}

export interface VsCodeExtensionServiceDiagnosticsSnapshot {
  lifecycleStatus: OrchestrationServiceLifecycleStatus;
  serviceHostKind: OrchestrationServiceHostKind;
  serviceTransportKind: OrchestrationServiceTransportKind;
  checkpointCapable: boolean;
  memoryStoreProviderId?: string;
  pid?: number;
}

export interface VsCodeExtensionUserConfigEntrySnapshot {
  keyPath: string;
  value: string;
}

export interface VsCodeExtensionUserConfigStatusSnapshot {
  configPath: string;
  configExists: boolean;
  legacyPreferencePath: string;
  legacyPreferenceExists: boolean;
  themePreference?: string;
  workspaceModePreference?: string;
  entries: readonly VsCodeExtensionUserConfigEntrySnapshot[];
}

export interface VsCodeExtensionSecretBackendStatusSnapshot {
  backendId: string;
  available: boolean;
  detail: string;
  warning?: string;
}

export interface VsCodeExtensionSecretRecordSnapshot {
  keyName: string;
  backendId: string;
  exists: boolean;
}

export interface VsCodeExtensionSecretReadinessSnapshot {
  selectedBackendId?: string;
  defaultBackendId?: string;
  indexPath: string;
  backends: readonly VsCodeExtensionSecretBackendStatusSnapshot[];
  records: readonly VsCodeExtensionSecretRecordSnapshot[];
  configuredCredentialRefs: readonly string[];
  unresolvedCredentialRefs: readonly string[];
}

export interface VsCodeExtensionSecureAuthoringSnapshot {
  userConfig?: VsCodeExtensionUserConfigStatusSnapshot;
  secretReadiness?: VsCodeExtensionSecretReadinessSnapshot;
  degradedReason?: string;
}

export interface VsCodeExtensionWorkspaceContextSnapshot {
  workspaceLabel: string;
  workspaceRoot?: string;
  workspaceTrusted: boolean;
  activeEditorPath?: string;
  activeSelectionLabel?: string;
  serviceHealth?: VsCodeExtensionServiceDiagnosticsSnapshot;
}

export interface VsCodeExtensionSelectionSnapshot {
  executionId?: string;
  executionSessionId?: string;
  reviewSourcePath?: string;
  queueEntry?: OrchestrationGovernanceQueueEntry;
  temporaryBridge?: OrchestrationGovernanceTemporaryBridgeEntry;
}

export interface VsCodeExtensionCommandRequest {
  executionId?: string;
  executionSessionId?: string;
  reviewSourcePath?: string;
  queueEntry?: OrchestrationGovernanceQueueEntry;
  handoffTarget?: OrchestrationHandoffTarget;
  temporaryBridge?: OrchestrationGovernanceTemporaryBridgeEntry;
  hitlDecisionOption?: OrchestrationHitlDecisionOption;
  userConfigKeyPath?: string;
  secretKeyName?: string;
}

export interface VsCodeExtensionReviewDetailSnapshot {
  workspaceContext: VsCodeExtensionWorkspaceContextSnapshot;
  selectedExecution?: OrchestrationExecutionBoardEntry;
  artifactPane?: OrchestrationArtifactPaneQueryResponse;
  requestedReviewSourcePath?: string;
}

export interface VsCodeExtensionWorkbenchOverviewSnapshot {
  workspaceContext: VsCodeExtensionWorkspaceContextSnapshot;
  queueOverview: OrchestrationQueueOverviewQueryResponse;
  secureAuthoring?: VsCodeExtensionSecureAuthoringSnapshot;
  selectedExecution?: OrchestrationExecutionBoardEntry;
  reviewSourcePath?: string;
}

export interface VsCodeExtensionWorkflowStudioSnapshot {
  workspaceContext: VsCodeExtensionWorkspaceContextSnapshot;
  queueOverview: OrchestrationQueueOverviewQueryResponse;
  secureAuthoring?: VsCodeExtensionSecureAuthoringSnapshot;
  selectedExecution?: OrchestrationExecutionBoardEntry;
  artifactPane?: OrchestrationArtifactPaneQueryResponse;
  reviewSourcePath?: string;
}

export interface VsCodeExtensionReviewQueueSelectionRequest extends VsCodeExtensionCommandRequest {
  reviewQueueEntry?: OrchestrationGovernanceQueueEntry;
}
