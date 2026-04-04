import type {
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationExecutionSummary,
  OrchestrationServiceHealthResponse,
  OrchestrationSessionSummary,
} from '@repo-ai-governor/orchestration-service-client';
import type { ExecutionReportAgentView } from '@repo-ai-governor/reporting';
import type {
  AgentProjectionPanelStatusVariant,
  AgentProjectionPanelViewModel,
} from '@repo-ai-governor/reporting';
import type { DesktopLifecycleSnapshot } from './desktop-shell.interface.js';

/**
 * Defines one simple desktop panel section view-model.
 */
export interface DesktopGovernanceConsoleSectionViewModel {
  title: string;
  statusVariant: AgentProjectionPanelStatusVariant;
  detailLines: string[];
}

/**
 * Defines one execution-timeline row rendered inside the desktop governance console.
 */
export interface DesktopExecutionTimelineEntryViewModel {
  id: string;
  title: string;
  statusVariant: AgentProjectionPanelStatusVariant;
  detailLines: string[];
}

/**
 * Defines one artifact-pane row rendered inside desktop governance console slices.
 */
export interface DesktopArtifactPaneEntryViewModel {
  id: string;
  title: string;
  detailLines: string[];
}

/**
 * Defines one artifact-pane sub-collection rendered inside the governance console.
 */
export interface DesktopArtifactPaneCollectionViewModel {
  title: string;
  emptyState: string;
  entries: DesktopArtifactPaneEntryViewModel[];
}

/**
 * Defines one structured artifact-pane snapshot for desktop renderer consumers.
 */
export interface DesktopArtifactPaneViewModel {
  title: string;
  statusVariant: AgentProjectionPanelStatusVariant;
  gateState: DesktopLifecycleSnapshot['artifactQueryGateState'];
  detailLines: string[];
  artifacts: DesktopArtifactPaneCollectionViewModel;
  reviews: DesktopArtifactPaneCollectionViewModel;
  transcript: DesktopArtifactPaneCollectionViewModel;
}

/**
 * Defines one transport-neutral governance-console snapshot for desktop renderer consumers.
 */
export interface DesktopGovernanceConsoleViewModel {
  workspaceHome: DesktopGovernanceConsoleSectionViewModel;
  sessionLane: DesktopGovernanceConsoleSectionViewModel;
  executionTimeline: DesktopExecutionTimelineEntryViewModel[];
  hitlCenter: DesktopGovernanceConsoleSectionViewModel;
  artifactPane: DesktopArtifactPaneViewModel;
  agentProjectionPanel?: AgentProjectionPanelViewModel;
}

/**
 * Defines one build request for the transport-neutral governance-console snapshot.
 */
export interface DesktopGovernanceConsoleBuildOptions {
  locale: string;
  workspaceLabel: string;
  health: OrchestrationServiceHealthResponse;
  sessions: OrchestrationSessionSummary[];
  executions: OrchestrationExecutionSummary[];
  lifecycle: DesktopLifecycleSnapshot;
  artifactPane?: OrchestrationArtifactPaneQueryResponse;
  artifactPaneDeferredReason?: string;
  agentView?: ExecutionReportAgentView | null;
}
