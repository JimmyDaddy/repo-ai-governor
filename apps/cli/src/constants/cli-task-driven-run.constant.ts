/**
 * Defines finite assembly modes used by CLI task-driven run planning.
 */
export enum CliTaskDrivenRunAssemblyMode {
  BASELINE = "baseline",
  TASK_DRIVEN = "task_driven",
  TASK_ID_FALLBACK = "task_id_fallback",
}

/**
 * Defines finite reasons explaining why one assembly mode was selected.
 */
export enum CliTaskDrivenRunAssemblyReason {
  NO_TASK_ID = "no_task_id",
  TASK_CONTEXT_LOADED = "task_context_loaded",
  TASK_CARD_NOT_FOUND = "task_card_not_found",
}

/**
 * Defines stable node/stage/route identifiers used by task-driven run assembly.
 */
export const CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS = {
  PREPARE: {
    nodeId: "node-task-prepare",
    stageId: "stage-task-prepare",
    routeKey: "route.task.prepare",
  },
  ARTIFACT_CONTEXT: {
    nodeId: "node-artifact-context",
    stageId: "stage-artifact-context",
    routeKey: "route.task.artifact-context",
  },
  EXECUTE: {
    nodeId: "node-task-execute",
    stageId: "stage-task-execute",
    routeKey: "route.task.execute",
  },
  VERIFY: {
    nodeId: "node-task-verify",
    stageId: "stage-task-verify",
    routeKey: "route.task.verify",
  },
  REPORT: {
    nodeId: "node-task-report",
    stageId: "stage-task-report",
    routeKey: "route.task.report",
  },
} as const;

/**
 * Defines keyword buckets used to infer task-driven execution roles from task goal text.
 */
export const CLI_TASK_DRIVEN_RUN_KEYWORDS = {
  TESTER: ["test", "testing", "smoke", "regression", "测试", "回归"],
  VERIFIER: ["verify", "verification", "diagnostic", "validate", "验收", "验证", "校验", "诊断"],
  REVIEWER: ["review", "reviewer", "评审", "复核"],
} as const;
