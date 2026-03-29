/**
 * Defines supported `workflow` command actions for the explicit subcommand tree.
 */
export enum CliWorkflowAction {
  CREATE = 'create',
  EDIT = 'edit',
  PREVIEW = 'preview',
}

/**
 * Defines supported preview persistence modes for the read-only workflow surface.
 */
export enum CliWorkflowPreviewMode {
  READ_ONLY = 'read_only',
}

/**
 * Defines workflow entry-flow modes surfaced by the shared React shell.
 */
export enum CliWorkflowEntryMode {
  READ_ONLY = 'read_only',
  CREATE_SEED = 'create_seed',
  EDIT_SEED = 'edit_seed',
}

/**
 * Defines where one workflow definition/session was sourced from.
 */
export enum CliWorkflowDefinitionSource {
  PREVIEW_TEMPLATE = 'preview_template',
  TEMPLATE_SEED = 'template_seed',
  WORKSPACE_SAVED = 'workspace_saved',
}

/**
 * Defines supported built-in workflow preview template identifiers.
 */
export enum CliWorkflowTemplateId {
  PARALLEL_REVIEW = 'parallel-review',
  LOOP_GUARDED = 'loop-guarded',
  CONDITION_ROUTE = 'condition-route',
}

/**
 * Defines preview compile-state summaries surfaced by checks and details.
 */
export enum CliWorkflowCompileStatus {
  COMPILABLE = 'compilable',
  WARNING = 'warning',
  CONTRACT_FALLBACK = 'contract_fallback',
}

/**
 * Defines severity levels emitted by the workflow editor semantic validator.
 */
export enum CliWorkflowEditorIssueSeverity {
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Defines stable issue codes for workflow editor semantic validation.
 */
export enum CliWorkflowEditorIssueCode {
  CONDITION_BRANCH_REQUIRED = 'CONDITION_BRANCH_REQUIRED',
  CONDITION_BRANCH_KEY_REQUIRED = 'CONDITION_BRANCH_KEY_REQUIRED',
  CONDITION_BRANCH_DUPLICATED = 'CONDITION_BRANCH_DUPLICATED',
}

/**
 * Defines default workflow template for preview when CLI args omit explicit selection.
 */
export const DEFAULT_CLI_WORKFLOW_TEMPLATE_ID = CliWorkflowTemplateId.PARALLEL_REVIEW;

/**
 * Defines the supported workflow template id set for raw argv validation.
 */
export const CLI_WORKFLOW_TEMPLATE_IDS = new Set<string>(Object.values(CliWorkflowTemplateId));

/**
 * Defines the `<workspace_root>` relative directory that stores saved workflow definitions.
 */
export const CLI_WORKFLOW_ROOT_SEGMENTS = ['context', 'workflow'] as const;

/**
 * Defines the canonical saved workflow definition file name.
 */
export const CLI_WORKFLOW_DEFINITION_FILE_NAME = 'active-workflow.definition.json';

/**
 * Defines the saved workflow definition artifact schema version.
 */
export const CLI_WORKFLOW_DEFINITION_SCHEMA_VERSION = 'cli_workflow_definition_v1';
