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
  selectedExecution?: OrchestrationExecutionBoardEntry;
  reviewSourcePath?: string;
}

export interface VsCodeExtensionWorkflowStudioSnapshot {
  workspaceContext: VsCodeExtensionWorkspaceContextSnapshot;
  queueOverview: OrchestrationQueueOverviewQueryResponse;
  selectedExecution?: OrchestrationExecutionBoardEntry;
  artifactPane?: OrchestrationArtifactPaneQueryResponse;
  reviewSourcePath?: string;
}

export interface VsCodeExtensionReviewQueueSelectionRequest extends VsCodeExtensionCommandRequest {
  reviewQueueEntry?: OrchestrationGovernanceQueueEntry;
}
