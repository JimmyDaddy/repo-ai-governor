import { AdapterSurface, AdapterTransportKind } from '@repo-ai-governor/shared';

/**
 * Freezes VS Code extension contribution identifiers and trust-gated command boundaries.
 *
 * Why this exists:
 * Phase H keeps the public primary-workbench claim aligned with packaged-evidence truth
 * without letting the extension host invent queue truth or bypass the shared local
 * orchestration service seam.
 */
export const VSCODE_EXTENSION_DEFAULT_EXECUTION_LIMIT = 5;
export const VSCODE_EXTENSION_DEFAULT_QUEUE_LIMIT = 5;
export const VSCODE_EXTENSION_DEFAULT_LANE_LIMIT = 3;
export const VSCODE_EXTENSION_DEFAULT_WORKSPACE_SUMMARY_LIMIT = 3;
export const VSCODE_EXTENSION_CONTAINER_ID = 'repoAiGovernor';
export const VSCODE_EXTENSION_CHAT_PARTICIPANT_ID = 'repo-ai-governor.governor';
export const VSCODE_EXTENSION_CHAT_PARTICIPANT_NAME = 'governor';
export const VSCODE_EXTENSION_CHAT_COMMAND_IDS = {
  STATUS: 'status',
  REVIEW: 'review',
  REFRESH: 'refresh',
  WORKSPACE_BOOTSTRAP: 'workspace-bootstrap',
  CONNECT: 'connect',
  DOCTOR: 'doctor',
  CHECK: 'check',
  WORKFLOW_PREVIEW: 'workflow-preview',
  WORKFLOW_CREATE: 'workflow-create',
  WORKFLOW_EDIT: 'workflow-edit',
  OPEN_WORKFLOW_STUDIO: 'workflow-studio',
  OPEN_REVIEW_DETAIL: 'review-detail',
  OPEN_HANDOFF_TARGET: 'handoff-target',
  STAGE_TEMPORARY_BRIDGE: 'repository-operation',
  SUBMIT_HITL_DECISION: 'submit-hitl-decision',
  RECOVER_EXECUTION: 'recover-execution',
  TERMINATE_EXECUTION: 'terminate-execution',
  OPEN_USER_CONFIG: 'open-user-config',
  CONFIGURE_USER_DEFAULT: 'configure-user-default',
  SET_MANAGED_SECRET: 'set-managed-secret',
} as const;
export const VSCODE_EXTENSION_CHAT_COMMAND_STATUS = VSCODE_EXTENSION_CHAT_COMMAND_IDS.STATUS;
export const VSCODE_EXTENSION_CHAT_COMMAND_REVIEW = VSCODE_EXTENSION_CHAT_COMMAND_IDS.REVIEW;
export const VSCODE_EXTENSION_SURFACE_ID = 'vscode_governance_workbench';
export const VSCODE_EXTENSION_SURFACE_ROLE = 'primary_governance_workbench';
export const VSCODE_EXTENSION_TRUTH_OWNER = 'local_orchestration_service';
export const VSCODE_EXTENSION_WEBVIEW_USAGE_MODE = 'workbench_panel_allowed';
export const VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL = 'primary_workbench_claim';
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
  WORKFLOW_STUDIO: 'repoAiGovernor.workflowStudio',
  REVIEW_DETAIL: 'repoAiGovernor.reviewDetail',
} as const;
export const VSCODE_EXTENSION_COMMAND_IDS = {
  REFRESH: 'repoAiGovernor.refresh',
  RUN_WORKSPACE_BOOTSTRAP: 'repoAiGovernor.runWorkspaceBootstrap',
  RUN_CONNECT: 'repoAiGovernor.runConnect',
  RUN_DOCTOR: 'repoAiGovernor.runDoctor',
  RUN_CHECK: 'repoAiGovernor.runCheck',
  RUN_WORKFLOW_PREVIEW: 'repoAiGovernor.runWorkflowPreview',
  RUN_WORKFLOW_CREATE: 'repoAiGovernor.runWorkflowCreate',
  RUN_WORKFLOW_EDIT: 'repoAiGovernor.runWorkflowEdit',
  OPEN_WORKFLOW_STUDIO: 'repoAiGovernor.openWorkflowStudio',
  OPEN_REVIEW_DETAIL: 'repoAiGovernor.openReviewDetail',
  OPEN_HANDOFF_TARGET: 'repoAiGovernor.openHandoffTarget',
  STAGE_TEMPORARY_BRIDGE: 'repoAiGovernor.stageTemporaryBridge',
  SUBMIT_HITL_DECISION: 'repoAiGovernor.submitHitlDecision',
  RECOVER_EXECUTION: 'repoAiGovernor.recoverExecution',
  TERMINATE_EXECUTION: 'repoAiGovernor.terminateExecution',
  OPEN_USER_CONFIG: 'repoAiGovernor.openUserConfig',
  CONFIGURE_USER_DEFAULT: 'repoAiGovernor.configureUserDefault',
  SET_MANAGED_SECRET: 'repoAiGovernor.setManagedSecret',
} as const;
export const VSCODE_EXTENSION_USER_DEFAULT_KEY_PATHS = {
  WORKSPACE_MODE: 'workspace.mode_preference',
  REACT_THEME: 'ui.react.theme',
} as const;
export const VSCODE_EXTENSION_CONNECT_PRESET_IDS = {
  SINGLE_TOOL_MINIMAL: 'single-tool-minimal',
  MULTI_TOOL_DEFAULT: 'multi-tool-default',
  SINGLE_TOOL_ALL_ROLES: 'single-tool-all-roles',
  RESTRICTED_NETWORK_SAFE: 'restricted-network-safe',
} as const;
export const VSCODE_EXTENSION_CONNECT_PRESET_ORDER = [
  VSCODE_EXTENSION_CONNECT_PRESET_IDS.MULTI_TOOL_DEFAULT,
  VSCODE_EXTENSION_CONNECT_PRESET_IDS.SINGLE_TOOL_MINIMAL,
  VSCODE_EXTENSION_CONNECT_PRESET_IDS.SINGLE_TOOL_ALL_ROLES,
  VSCODE_EXTENSION_CONNECT_PRESET_IDS.RESTRICTED_NETWORK_SAFE,
] as const;
export const VSCODE_EXTENSION_CONNECT_TRANSPORT_OPTIONS = {
  [AdapterSurface.CODEX]: [AdapterTransportKind.CLI_EXEC, AdapterTransportKind.REMOTE_API],
  [AdapterSurface.CLAUDE_CODE]: [AdapterTransportKind.CLI_EXEC, AdapterTransportKind.REMOTE_API],
  [AdapterSurface.GITHUB_COPILOT]: [AdapterTransportKind.CLI_EXEC],
  [AdapterSurface.OLLAMA]: [AdapterTransportKind.BASELINE],
} as const;
export const VSCODE_EXTENSION_TOOL_USER_DEFAULT_KEY_SUFFIXES = [
  'transport',
  'remoteApi.provider',
  'remoteApi.vendorBinding',
  'remoteApi.model',
  'remoteApi.credentialEnvVar',
  'remoteApi.credentialRef',
  'remoteApi.endpoint',
] as const;
export const VSCODE_EXTENSION_PROVIDER_ONBOARDING_SURFACE_ID = 'vscode_provider_onboarding';
export const VSCODE_EXTENSION_PROVIDER_ONBOARDING_ENTRYPOINT_KINDS = {
  OVERVIEW_CTA: 'overview_cta',
  COMMAND_PALETTE: 'command_palette',
  CHAT_COMMAND: 'chat_command',
  QUICK_PICK_FORM: 'quick_pick_form',
} as const;
export const VSCODE_EXTENSION_PROVIDER_ONBOARDING_MUTATION_MODE =
  'explicit_provider_onboarding_command';
export const VSCODE_EXTENSION_PROVIDER_ONBOARDING_SECRET_CAPTURE_MODE = 'host_secure_prompt';
export const VSCODE_EXTENSION_PROVIDER_ONBOARDING_SECRET_OWNER = 'governor_managed_secret_backend';
export const VSCODE_EXTENSION_PROVIDER_ONBOARDING_CREDENTIAL_REF_STRATEGY =
  'provider_default_api_key';
export const VSCODE_EXTENSION_PROVIDER_ONBOARDING_READINESS_PROJECTION_SOURCES = {
  SNAPSHOT: 'provider_onboarding_snapshot',
  AGENT_ONBOARDING_SUMMARY: 'agent_onboarding_summary',
} as const;
export const VSCODE_EXTENSION_PROVIDER_LIFECYCLE_STATUSES = {
  CONNECT_REQUIRED: 'connect_required',
  READY: 'ready',
  RECONNECT_REQUIRED: 'reconnect_required',
  DEGRADED: 'degraded',
} as const;
export const VSCODE_EXTENSION_PROVIDER_LIFECYCLE_ACTION_IDS = {
  CONNECT_PROVIDER: 'connect_provider',
  UPDATE_API_KEY: 'update_api_key',
  RECONNECT_PROVIDER: 'reconnect_provider',
  RUN_DOCTOR: 'run_doctor',
} as const;
export const VSCODE_EXTENSION_PROVIDER_ONBOARDING_CONFIG_TARGET_SUFFIXES = [
  'transport',
  'remoteApi.provider',
  'remoteApi.vendorBinding',
  'remoteApi.model',
  'remoteApi.endpoint',
  'remoteApi.credentialEnvVar',
  'remoteApi.credentialRef',
] as const;
export const VSCODE_EXTENSION_PROVIDER_ONBOARDING_RECEIPT_FIELDS = [
  'tool',
  'provider',
  'credentialRef',
  'secretBackend',
  'warnings',
  'nextAction',
] as const;
export const VSCODE_EXTENSION_SECRET_SELECTOR_PREFIX = 'secret://';
export const VSCODE_EXTENSION_UPGRADE_CONFIRMATION_APPROVE = 'approve';
export const VSCODE_EXTENSION_TRUST_GATED_COMMAND_IDS = [
  VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKSPACE_BOOTSTRAP,
  VSCODE_EXTENSION_COMMAND_IDS.RUN_CONNECT,
  VSCODE_EXTENSION_COMMAND_IDS.RUN_DOCTOR,
  VSCODE_EXTENSION_COMMAND_IDS.RUN_CHECK,
  VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKFLOW_PREVIEW,
  VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKFLOW_CREATE,
  VSCODE_EXTENSION_COMMAND_IDS.RUN_WORKFLOW_EDIT,
  VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET,
  VSCODE_EXTENSION_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE,
  VSCODE_EXTENSION_COMMAND_IDS.SUBMIT_HITL_DECISION,
  VSCODE_EXTENSION_COMMAND_IDS.RECOVER_EXECUTION,
  VSCODE_EXTENSION_COMMAND_IDS.TERMINATE_EXECUTION,
  VSCODE_EXTENSION_COMMAND_IDS.OPEN_USER_CONFIG,
  VSCODE_EXTENSION_COMMAND_IDS.CONFIGURE_USER_DEFAULT,
  VSCODE_EXTENSION_COMMAND_IDS.SET_MANAGED_SECRET,
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
  'workflow_studio',
  'artifact_workbench',
  'workbench_overview',
] as const;
// Contract-level capability metadata must stay aligned with the frozen workbench/facade vocabulary.
// Extension-local command ids continue to live under VSCODE_EXTENSION_COMMAND_IDS.
export const VSCODE_EXTENSION_QUERY_CAPABILITY_CLASSES = [
  'task_board',
  'review_queue',
  'bootstrap_readiness',
  'workflow_preview',
  'workflow_stage_progress',
  'automation_queue',
  'adoption_status',
  'host_distribution_status',
  'upgrade_status',
  'workbench_overview',
] as const;
export const VSCODE_EXTENSION_COMMAND_CAPABILITY_CLASSES = [
  'workspace_bootstrap',
  'adapter_connect',
  'workspace_doctor',
  'workspace_check',
  'workflow_authoring',
  'execution_recover',
  'execution_terminate',
  'user_default_authoring',
  'secret_authoring',
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
