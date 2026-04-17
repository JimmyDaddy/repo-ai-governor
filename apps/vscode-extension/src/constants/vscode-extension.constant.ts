/**
 * Freezes VS Code extension contribution identifiers and trust-gated command boundaries.
 *
 * Why this exists:
 * Phase B extends the primary workbench baseline without letting the extension host invent
 * queue truth or bypass the shared local orchestration service seam.
 */
export const VSCODE_EXTENSION_DEFAULT_EXECUTION_LIMIT = 5;
export const VSCODE_EXTENSION_DEFAULT_QUEUE_LIMIT = 5;
export const VSCODE_EXTENSION_DEFAULT_LANE_LIMIT = 3;
export const VSCODE_EXTENSION_DEFAULT_WORKSPACE_SUMMARY_LIMIT = 3;
export const VSCODE_EXTENSION_CONTAINER_ID = 'repoAiGovernor';
export const VSCODE_EXTENSION_CHAT_PARTICIPANT_ID = 'repo-ai-governor.governor';
export const VSCODE_EXTENSION_CHAT_PARTICIPANT_NAME = 'governor';
export const VSCODE_EXTENSION_CHAT_COMMAND_STATUS = 'status';
export const VSCODE_EXTENSION_CHAT_COMMAND_REVIEW = 'review';
export const VSCODE_EXTENSION_SURFACE_ID = 'vscode_governance_workbench';
export const VSCODE_EXTENSION_SURFACE_ROLE = 'primary_governance_workbench';
export const VSCODE_EXTENSION_TRUTH_OWNER = 'local_orchestration_service';
export const VSCODE_EXTENSION_WEBVIEW_USAGE_MODE = 'workbench_panel_allowed';
export const VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL = 'workbench_baseline_in_progress';
export const VSCODE_EXTENSION_DESKTOP_RELATIONSHIP = 'foundation_only_secondary_surface';
export const VSCODE_EXTENSION_CONTEXT_KEYS = {
  WORKSPACE_TRUSTED: 'repoAiGovernor.workspaceTrusted',
  REVIEW_DETAIL_AVAILABLE: 'repoAiGovernor.reviewDetailAvailable',
} as const;
export const VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES = {
  EXECUTION: 'repoAiGovernor.execution',
  HITL_EXECUTION: 'repoAiGovernor.hitlExecution',
  REVIEW_QUEUE_ENTRY: 'repoAiGovernor.reviewQueueEntry',
  REVIEW_ACTION: 'repoAiGovernor.reviewAction',
  HITL_ACTION: 'repoAiGovernor.hitlAction',
  HANDOFF_ACTION: 'repoAiGovernor.handoffAction',
  WORKBENCH_OVERVIEW: 'repoAiGovernor.workbenchOverview',
  INFO: 'repoAiGovernor.info',
} as const;
export const VSCODE_EXTENSION_TRUST_MANAGE_COMMAND_ID = 'workbench.trust.manage';
export const VSCODE_EXTENSION_VIEW_IDS = {
  TASK_BOARD: 'repoAiGovernor.executionBoard',
  EXECUTION_BOARD: 'repoAiGovernor.executionBoard',
  HITL_INBOX: 'repoAiGovernor.hitlInbox',
  REVIEW_QUEUE: 'repoAiGovernor.reviewQueue',
  AUTOMATION_QUEUE: 'repoAiGovernor.automationQueue',
  WORKBENCH_OVERVIEW: 'repoAiGovernor.workspaceContext',
  WORKSPACE_CONTEXT: 'repoAiGovernor.workspaceContext',
  REVIEW_DETAIL: 'repoAiGovernor.reviewDetail',
} as const;
export const VSCODE_EXTENSION_COMMAND_IDS = {
  REFRESH: 'repoAiGovernor.refresh',
  OPEN_REVIEW_DETAIL: 'repoAiGovernor.openReviewDetail',
  OPEN_HANDOFF_TARGET: 'repoAiGovernor.openHandoffTarget',
  STAGE_TEMPORARY_BRIDGE: 'repoAiGovernor.stageTemporaryBridge',
  SUBMIT_HITL_DECISION: 'repoAiGovernor.submitHitlDecision',
  RECOVER_EXECUTION: 'repoAiGovernor.recoverExecution',
  TERMINATE_EXECUTION: 'repoAiGovernor.terminateExecution',
} as const;
export const VSCODE_EXTENSION_TRUST_GATED_COMMAND_IDS = [
  VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET,
  VSCODE_EXTENSION_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE,
  VSCODE_EXTENSION_COMMAND_IDS.SUBMIT_HITL_DECISION,
  VSCODE_EXTENSION_COMMAND_IDS.RECOVER_EXECUTION,
  VSCODE_EXTENSION_COMMAND_IDS.TERMINATE_EXECUTION,
] as const;
export const VSCODE_EXTENSION_NATIVE_ENTRYPOINTS = [
  'tree_view',
  'commands',
  'chat',
  'code_actions',
] as const;
export const VSCODE_EXTENSION_WORKBENCH_PANELS = [
  'task_board',
  'review_queue',
  'automation_queue',
  'artifact_workbench',
  'workbench_overview',
] as const;
// Contract-level capability metadata must stay aligned with the frozen workbench/facade vocabulary.
// Extension-local command ids continue to live under VSCODE_EXTENSION_COMMAND_IDS.
export const VSCODE_EXTENSION_QUERY_CAPABILITY_CLASSES = [
  'task_board',
  'review_queue',
  'workflow_preview',
  'workflow_stage_progress',
  'automation_queue',
  'adoption_status',
  'host_distribution_status',
  'workbench_overview',
] as const;
export const VSCODE_EXTENSION_COMMAND_CAPABILITY_CLASSES = [
  'execution_recover',
  'execution_terminate',
] as const;
export const VSCODE_EXTENSION_TEMPORARY_BRIDGE_CAPABILITY_CLASSES = [
  'adopt_bootstrap',
  'adoption_apply',
  'host_export',
  'host_verify',
  'host_pack',
  'upgrade',
] as const;
export const VSCODE_EXTENSION_HANDOFF_TARGET_CLASSES = [
  'review_document',
  'editor',
  'worktree',
  'terminal',
] as const;
export const VSCODE_EXTENSION_CONTINUITY_TOKENS = [
  'execution_id',
  'execution_session_id',
  'review_source_path',
  'task_id',
  'project_id',
  'sprint_id',
] as const;
