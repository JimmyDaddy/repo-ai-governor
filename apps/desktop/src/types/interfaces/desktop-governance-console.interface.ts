import type {
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
 * Defines one transport-neutral governance-console snapshot for desktop renderer consumers.
 */
export interface DesktopGovernanceConsoleViewModel {
  workspaceHome: DesktopGovernanceConsoleSectionViewModel;
  sessionLane: DesktopGovernanceConsoleSectionViewModel;
  executionTimeline: DesktopExecutionTimelineEntryViewModel[];
  hitlCenter: DesktopGovernanceConsoleSectionViewModel;
  artifactPaneNote: string;
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
  agentView?: ExecutionReportAgentView | null;
}
