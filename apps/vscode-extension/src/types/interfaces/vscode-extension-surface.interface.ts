import type {
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationExecutionBoardEntry,
  OrchestrationHandoffTarget,
  OrchestrationHitlDecisionOption,
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

export interface VsCodeExtensionWorkspaceContextSnapshot {
  workspaceLabel: string;
  workspaceRoot?: string;
  workspaceTrusted: boolean;
  activeEditorPath?: string;
  activeSelectionLabel?: string;
}

export interface VsCodeExtensionSelectionSnapshot {
  executionId?: string;
  executionSessionId?: string;
  reviewSourcePath?: string;
}

export interface VsCodeExtensionCommandRequest {
  executionId?: string;
  executionSessionId?: string;
  reviewSourcePath?: string;
  handoffTarget?: OrchestrationHandoffTarget;
  hitlDecisionOption?: OrchestrationHitlDecisionOption;
}

export interface VsCodeExtensionReviewDetailSnapshot {
  workspaceContext: VsCodeExtensionWorkspaceContextSnapshot;
  selectedExecution?: OrchestrationExecutionBoardEntry;
  artifactPane?: OrchestrationArtifactPaneQueryResponse;
}
