/**
 * Defines presenter-safe delivery workflow pending actions surfaced by the session shell.
 */
export const CLI_SESSION_SHELL_DELIVERY_PENDING_ACTION = {
  CONFIRM_TASK_PLAN_COMMIT: 'confirm_task_plan_commit',
  REFINE_TASK_PLAN_PREVIEW: 'refine_task_plan_preview',
  START_TASK_DRIVEN_EXECUTION_FLOW: 'start_task_driven_execution_flow',
  REFINE_TASK_PLAN_PREVIEW_OR_RECONFIRM: 'refine_task_plan_preview_or_reconfirm',
} as const;
