/**
 * Freezes VS Code extension contribution identifiers and trust-gated command boundaries.
 *
 * Why this exists:
 * sprint-002 must lock extension manifest IDs and trust-sensitive surfaces before the
 * implementation grows views, chat, and editor actions around them.
 */
export const VSCODE_EXTENSION_DEFAULT_EXECUTION_LIMIT = 5;
export const VSCODE_EXTENSION_CONTAINER_ID = 'repoAiGovernor';
export const VSCODE_EXTENSION_CHAT_PARTICIPANT_ID = 'repo-ai-governor.governor';
export const VSCODE_EXTENSION_CHAT_PARTICIPANT_NAME = 'governor';
export const VSCODE_EXTENSION_CHAT_COMMAND_STATUS = 'status';
export const VSCODE_EXTENSION_CHAT_COMMAND_REVIEW = 'review';
export const VSCODE_EXTENSION_CONTEXT_KEYS = {
  WORKSPACE_TRUSTED: 'repoAiGovernor.workspaceTrusted',
  REVIEW_DETAIL_AVAILABLE: 'repoAiGovernor.reviewDetailAvailable',
} as const;
export const VSCODE_EXTENSION_TREE_ITEM_CONTEXT_VALUES = {
  EXECUTION: 'repoAiGovernor.execution',
  HITL_EXECUTION: 'repoAiGovernor.hitlExecution',
  REVIEW_ACTION: 'repoAiGovernor.reviewAction',
  HITL_ACTION: 'repoAiGovernor.hitlAction',
  HANDOFF_ACTION: 'repoAiGovernor.handoffAction',
  WORKSPACE_CONTEXT: 'repoAiGovernor.workspaceContext',
  INFO: 'repoAiGovernor.info',
} as const;
export const VSCODE_EXTENSION_TRUST_MANAGE_COMMAND_ID = 'workbench.trust.manage';
export const VSCODE_EXTENSION_VIEW_IDS = {
  EXECUTION_BOARD: 'repoAiGovernor.executionBoard',
  HITL_INBOX: 'repoAiGovernor.hitlInbox',
  WORKSPACE_CONTEXT: 'repoAiGovernor.workspaceContext',
  REVIEW_DETAIL: 'repoAiGovernor.reviewDetail',
} as const;
export const VSCODE_EXTENSION_COMMAND_IDS = {
  REFRESH: 'repoAiGovernor.refresh',
  OPEN_REVIEW_DETAIL: 'repoAiGovernor.openReviewDetail',
  OPEN_HANDOFF_TARGET: 'repoAiGovernor.openHandoffTarget',
  SUBMIT_HITL_DECISION: 'repoAiGovernor.submitHitlDecision',
  RECOVER_EXECUTION: 'repoAiGovernor.recoverExecution',
  TERMINATE_EXECUTION: 'repoAiGovernor.terminateExecution',
} as const;
export const VSCODE_EXTENSION_TRUST_GATED_COMMAND_IDS = [
  VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET,
  VSCODE_EXTENSION_COMMAND_IDS.SUBMIT_HITL_DECISION,
  VSCODE_EXTENSION_COMMAND_IDS.RECOVER_EXECUTION,
  VSCODE_EXTENSION_COMMAND_IDS.TERMINATE_EXECUTION,
] as const;
