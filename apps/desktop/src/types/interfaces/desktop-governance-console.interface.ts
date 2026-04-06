import type {
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationExecutionBoardQueryResponse,
  OrchestrationGovernanceActionAffordance,
  OrchestrationGovernanceActionDisabledReason,
  OrchestrationGovernanceActionKind,
  OrchestrationHandoffTarget,
  OrchestrationHandoffTargetKind,
  OrchestrationHitlInboxQueryResponse,
  OrchestrationQueueOverviewQueryResponse,
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
 * Defines one service-owned governance action rendered by the desktop console.
 */
export interface DesktopGovernanceActionViewModel {
  id: string;
  actionKind: OrchestrationGovernanceActionKind;
  enabled: boolean;
  requiresConfirmation: boolean;
  title: string;
  disabledReason?: OrchestrationGovernanceActionDisabledReason;
  targetId?: string;
  detailLines: string[];
}

/**
 * Defines one service-owned handoff target rendered by the desktop console.
 */
export interface DesktopHandoffTargetViewModel {
  id: string;
  targetKind: OrchestrationHandoffTargetKind;
  title: string;
  exists: boolean;
  targetPath?: string;
  detailLines: string[];
}

/**
 * Defines one execution-board row rendered inside the desktop governance console.
 */
export interface DesktopExecutionBoardEntryViewModel {
  id: string;
  title: string;
  statusVariant: AgentProjectionPanelStatusVariant;
  detailLines: string[];
  actions: DesktopGovernanceActionViewModel[];
  handoffTargets: DesktopHandoffTargetViewModel[];
}

/**
 * Backward-compatible alias kept for packages that still reference the timeline name.
 */
export type DesktopExecutionTimelineEntryViewModel = DesktopExecutionBoardEntryViewModel;

/**
 * Defines one HITL inbox row rendered inside the desktop governance console.
 */
export interface DesktopHitlInboxEntryViewModel {
  id: string;
  title: string;
  statusVariant: AgentProjectionPanelStatusVariant;
  detailLines: string[];
  actions: DesktopGovernanceActionViewModel[];
  handoffTargets: DesktopHandoffTargetViewModel[];
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
  policyTrace: DesktopGovernanceConsoleSectionViewModel;
  reviewLifecycle: DesktopGovernanceConsoleSectionViewModel;
  workbench: DesktopGovernanceConsoleSectionViewModel;
  evidenceBacklinks: DesktopArtifactPaneCollectionViewModel;
  artifacts: DesktopArtifactPaneCollectionViewModel;
  reviews: DesktopArtifactPaneCollectionViewModel;
  transcript: DesktopArtifactPaneCollectionViewModel;
}

/**
 * Defines one queue entry rendered inside the desktop governance queue overview.
 */
export interface DesktopGovernanceQueueEntryViewModel {
  id: string;
  title: string;
  statusVariant: AgentProjectionPanelStatusVariant;
  detailLines: string[];
  actions: DesktopGovernanceActionViewModel[];
  handoffTargets: DesktopHandoffTargetViewModel[];
}

/**
 * Defines one parallel-lane summary rendered inside the desktop governance queue overview.
 */
export interface DesktopGovernanceParallelLaneViewModel {
  id: string;
  title: string;
  statusVariant: AgentProjectionPanelStatusVariant;
  detailLines: string[];
}

/**
 * Defines one workspace summary row rendered inside the desktop governance queue overview.
 */
export interface DesktopGovernanceWorkspaceSummaryViewModel {
  id: string;
  title: string;
  statusVariant: AgentProjectionPanelStatusVariant;
  detailLines: string[];
}

/**
 * Defines one queue/overview snapshot rendered inside the desktop governance console.
 */
export interface DesktopGovernanceQueueOverviewViewModel {
  title: string;
  statusVariant: AgentProjectionPanelStatusVariant;
  detailLines: string[];
  notificationOwnership: DesktopGovernanceConsoleSectionViewModel;
  automationInbox: DesktopGovernanceConsoleCollectionViewModel<DesktopGovernanceQueueEntryViewModel>;
  reviewQueue: DesktopGovernanceConsoleCollectionViewModel<DesktopGovernanceQueueEntryViewModel>;
  parallelLanes: DesktopGovernanceConsoleCollectionViewModel<DesktopGovernanceParallelLaneViewModel>;
  workspaceSummary: DesktopGovernanceConsoleCollectionViewModel<DesktopGovernanceWorkspaceSummaryViewModel>;
}

/**
 * Defines one collection slice rendered inside the desktop governance console.
 */
export interface DesktopGovernanceConsoleCollectionViewModel<TEntry> {
  title: string;
  statusVariant: AgentProjectionPanelStatusVariant;
  emptyState: string;
  entries: TEntry[];
}

/**
 * Defines one transport-neutral governance-console snapshot for desktop renderer consumers.
 */
export interface DesktopGovernanceConsoleViewModel {
  workspaceHome: DesktopGovernanceConsoleSectionViewModel;
  sessionLane: DesktopGovernanceConsoleSectionViewModel;
  executionBoard: DesktopGovernanceConsoleCollectionViewModel<DesktopExecutionBoardEntryViewModel>;
  hitlInbox: DesktopGovernanceConsoleCollectionViewModel<DesktopHitlInboxEntryViewModel>;
  queueOverview: DesktopGovernanceQueueOverviewViewModel;
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
  executionBoard: OrchestrationExecutionBoardQueryResponse;
  hitlInbox: OrchestrationHitlInboxQueryResponse;
  queueOverview?: OrchestrationQueueOverviewQueryResponse;
  lifecycle: DesktopLifecycleSnapshot;
  artifactPane?: OrchestrationArtifactPaneQueryResponse;
  artifactPaneDeferredReason?: string;
  agentView?: ExecutionReportAgentView | null;
}

export interface DesktopGovernanceActionBuildInput {
  locale: string;
  affordance: OrchestrationGovernanceActionAffordance;
}

export interface DesktopHandoffTargetBuildInput {
  locale: string;
  target: OrchestrationHandoffTarget;
}
