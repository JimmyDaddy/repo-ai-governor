import { validateSchemaDocument } from "../config/schema/validator.js";
import { STANDARD_WORKFLOW_STAGE_SEQUENCE } from "../constants/workflow-template.js";
import { cloneValue } from "../utils/common.js";

export type LocalizedText = {
  "zh-CN": string;
  "en-US": string;
};

export type FailurePolicy = "stop" | "continue" | "warn";

export type WorkflowExecutorKind = "command" | "manual" | "internal";

export type WorkflowBindingKind =
  | "context"
  | "config"
  | "artifact"
  | "workspace"
  | "review-record"
  | "check-result"
  | "task-record";

export type WorkflowGateKind =
  | "artifacts-exist"
  | "checks-pass"
  | "review-status"
  | "task-record-updated"
  | "manual-approval";

export type WorkflowExecutor = {
  kind: WorkflowExecutorKind;
  ref: string;
  command?: string;
  options?: Record<string, unknown>;
};

export type WorkflowBinding = {
  kind: WorkflowBindingKind;
  ref: string;
  required?: boolean;
  multiple?: boolean;
};

export type WorkflowGateCondition = {
  id: string;
  kind: WorkflowGateKind;
  refs?: string[];
  expectedStatus?: string;
  message?: LocalizedText;
};

export type WorkflowGateSet = {
  enter?: WorkflowGateCondition[];
  exit?: WorkflowGateCondition[];
};

export type WorkflowStage = {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  dependsOn?: string[];
  executor: WorkflowExecutor;
  inputs?: WorkflowBinding[];
  outputs?: WorkflowBinding[];
  gates?: WorkflowGateSet;
  enabled?: boolean;
  required?: boolean;
  onFailure?: FailurePolicy;
  requiresApproval?: boolean;
};

export type WorkflowExecution = {
  mode: "serial";
  allowSkipStages: boolean;
  stopOnFailure: boolean;
};

export type WorkflowTemplate = {
  id: string;
  version: "1";
  kind: "workflow-template";
  meta: {
    name: LocalizedText;
    description?: LocalizedText;
  };
  execution: WorkflowExecution;
  stages: WorkflowStage[];
};

export type WorkflowStageOverride = {
  id: string;
} & Partial<Omit<WorkflowStage, "id">>;

export type WorkflowConfig = {
  template?: string;
  stages?: WorkflowStageOverride[];
  allowSkipStages?: boolean;
  stopOnFailure?: boolean;
  requireHumanApprovalFor?: string[];
};

export const STANDARD_WORKFLOW_TEMPLATE_ID = "standard";
export { STANDARD_WORKFLOW_STAGE_SEQUENCE };

function createLocalizedText(zhCN: string, enUS: string): LocalizedText {
  return {
    "zh-CN": zhCN,
    "en-US": enUS,
  };
}

export function validateWorkflowTemplate(template: WorkflowTemplate): WorkflowTemplate {
  const candidate = validateSchemaDocument("workflowTemplate", template) as WorkflowTemplate;
  const stageIds = new Set<string>();

  for (const stage of candidate.stages) {
    if (stageIds.has(stage.id)) {
      throw new TypeError(`Duplicate workflow stage id: ${stage.id}`);
    }

    stageIds.add(stage.id);
  }

  for (const stage of candidate.stages) {
    for (const dependency of stage.dependsOn ?? []) {
      if (!stageIds.has(dependency)) {
        throw new TypeError(`Unknown workflow dependency "${dependency}" for stage "${stage.id}"`);
      }
    }
  }

  return candidate;
}

export const STANDARD_WORKFLOW_TEMPLATE: Readonly<WorkflowTemplate> = Object.freeze(
  validateWorkflowTemplate({
    id: STANDARD_WORKFLOW_TEMPLATE_ID,
    version: "1",
    kind: "workflow-template",
    meta: {
      name: createLocalizedText("标准研发治理流程", "Standard Engineering Governance Flow"),
      description: createLocalizedText(
        "覆盖方案、拆解、开发、自测、评审、评审复核和任务记录回写的串行流程。",
        "A serial workflow covering planning, breakdown, implementation, self-check, review, review verification, and task record sync.",
      ),
    },
    execution: {
      mode: "serial",
      allowSkipStages: false,
      stopOnFailure: true,
    },
    stages: [
      {
        id: "plan",
        name: createLocalizedText("方案", "Plan"),
        description: createLocalizedText(
          "生成 sprint 方案与范围边界。",
          "Generate the sprint plan and scope boundaries.",
        ),
        executor: {
          kind: "command",
          ref: "plan",
          command: "plan",
          options: {
            phase: "solution",
          },
        },
        inputs: [
          {
            kind: "context",
            ref: "project-context",
          },
          {
            kind: "config",
            ref: "governor.workflow",
          },
        ],
        outputs: [
          {
            kind: "artifact",
            ref: "plan.md",
          },
        ],
        gates: {
          enter: [],
          exit: [
            {
              id: "plan-artifact-written",
              kind: "artifacts-exist",
              refs: ["plan.md"],
            },
          ],
        },
      },
      {
        id: "breakdown",
        name: createLocalizedText("拆解", "Breakdown"),
        description: createLocalizedText(
          "把方案拆成任务卡、checklist 与 CSV 台账。",
          "Break the plan into task cards, checklist entries, and CSV records.",
        ),
        dependsOn: ["plan"],
        executor: {
          kind: "command",
          ref: "plan",
          command: "plan",
          options: {
            phase: "breakdown",
          },
        },
        inputs: [
          {
            kind: "artifact",
            ref: "plan.md",
          },
        ],
        outputs: [
          {
            kind: "artifact",
            ref: "tasks/checklist.md",
          },
          {
            kind: "artifact",
            ref: "tasks/tasks.csv",
          },
          {
            kind: "artifact",
            ref: "tasks/TK-xxx.md",
            multiple: true,
          },
        ],
        gates: {
          enter: [
            {
              id: "plan-available",
              kind: "artifacts-exist",
              refs: ["plan.md"],
            },
          ],
          exit: [
            {
              id: "task-records-written",
              kind: "artifacts-exist",
              refs: ["tasks/checklist.md", "tasks/tasks.csv"],
            },
          ],
        },
      },
      {
        id: "implement",
        name: createLocalizedText("开发", "Implement"),
        description: createLocalizedText(
          "根据任务卡推进代码和文档实现。",
          "Implement code and documentation changes against the task cards.",
        ),
        dependsOn: ["breakdown"],
        executor: {
          kind: "manual",
          ref: "implement",
        },
        inputs: [
          {
            kind: "artifact",
            ref: "tasks/TK-xxx.md",
            multiple: true,
          },
          {
            kind: "workspace",
            ref: "repository-worktree",
          },
        ],
        outputs: [
          {
            kind: "workspace",
            ref: "repository-worktree",
          },
        ],
      },
      {
        id: "self-check",
        name: createLocalizedText("自测", "Self Check"),
        description: createLocalizedText(
          "运行门禁、自测或 CI 等本地校验。",
          "Run local gates, self-checks, or CI-like validations.",
        ),
        dependsOn: ["implement"],
        executor: {
          kind: "command",
          ref: "check",
          command: "check",
        },
        inputs: [
          {
            kind: "workspace",
            ref: "repository-worktree",
          },
        ],
        outputs: [
          {
            kind: "check-result",
            ref: "quality-gate-result",
          },
        ],
        gates: {
          enter: [],
          exit: [
            {
              id: "checks-pass",
              kind: "checks-pass",
              refs: ["quality-gate-result"],
              expectedStatus: "passed",
            },
          ],
        },
      },
      {
        id: "review",
        name: createLocalizedText("评审", "Review"),
        description: createLocalizedText(
          "生成带状态前缀的 code review 报告。",
          "Generate a status-prefixed code review report.",
        ),
        dependsOn: ["self-check"],
        executor: {
          kind: "command",
          ref: "review",
          command: "review",
        },
        inputs: [
          {
            kind: "workspace",
            ref: "repository-worktree",
          },
          {
            kind: "check-result",
            ref: "quality-gate-result",
          },
        ],
        outputs: [
          {
            kind: "review-record",
            ref: "code-review/review_<slug>.md",
          },
        ],
      },
      {
        id: "review-verify",
        name: createLocalizedText("评审复核", "Review Verify"),
        description: createLocalizedText(
          "把复核结果追加到同一份 CR 文件并推进状态。",
          "Append verification results into the same review file and advance its status.",
        ),
        dependsOn: ["review"],
        executor: {
          kind: "command",
          ref: "review-verify",
          command: "review-verify",
        },
        inputs: [
          {
            kind: "review-record",
            ref: "code-review/review_<slug>.md",
          },
        ],
        outputs: [
          {
            kind: "review-record",
            ref: "code-review/verified_review_<slug>.md",
          },
        ],
        gates: {
          enter: [],
          exit: [
            {
              id: "review-verified",
              kind: "review-status",
              refs: ["code-review/verified_review_<slug>.md"],
              expectedStatus: "verified",
            },
          ],
        },
      },
      {
        id: "task-sync",
        name: createLocalizedText("任务记录回写", "Task Record Sync"),
        description: createLocalizedText(
          "把执行与复核结果回写到 checklist 和 tasks.csv。",
          "Write execution and verification results back to checklist and tasks.csv.",
        ),
        dependsOn: ["review-verify"],
        executor: {
          kind: "internal",
          ref: "task-record-sync",
        },
        inputs: [
          {
            kind: "review-record",
            ref: "code-review/verified_review_<slug>.md",
          },
          {
            kind: "artifact",
            ref: "tasks/checklist.md",
          },
          {
            kind: "artifact",
            ref: "tasks/tasks.csv",
          },
        ],
        outputs: [
          {
            kind: "task-record",
            ref: "tasks/checklist.md",
          },
          {
            kind: "task-record",
            ref: "tasks/tasks.csv",
          },
        ],
        gates: {
          enter: [],
          exit: [
            {
              id: "task-records-updated",
              kind: "task-record-updated",
              refs: ["tasks/checklist.md", "tasks/tasks.csv"],
              expectedStatus: "updated",
            },
          ],
        },
      },
    ],
  }),
);

function applyStageOverrides(
  template: WorkflowTemplate,
  overrides: WorkflowStageOverride[] | undefined,
  requireHumanApprovalFor: string[] | undefined,
): WorkflowStage[] {
  const overrideMap = new Map<string, WorkflowStageOverride>(
    (overrides ?? []).map((stageOverride) => [stageOverride.id, stageOverride]),
  );

  return template.stages.map((stage) => {
    const override = overrideMap.get(stage.id);
    const listedForApproval = (requireHumanApprovalFor ?? []).includes(stage.id);

    if (!override && !listedForApproval) {
      return stage;
    }

    return {
      ...stage,
      ...(override ?? {}),
      requiresApproval: listedForApproval || override?.requiresApproval || false,
    };
  });
}

export function resolveWorkflowTemplate(workflowConfig: WorkflowConfig = {}): WorkflowTemplate {
  if (
    (workflowConfig.template ?? STANDARD_WORKFLOW_TEMPLATE_ID) !== STANDARD_WORKFLOW_TEMPLATE_ID
  ) {
    throw new TypeError(`Unsupported workflow template: ${workflowConfig.template}`);
  }

  const resolvedTemplate = cloneValue(STANDARD_WORKFLOW_TEMPLATE) as WorkflowTemplate;

  resolvedTemplate.execution.allowSkipStages =
    workflowConfig.allowSkipStages ?? resolvedTemplate.execution.allowSkipStages;
  resolvedTemplate.execution.stopOnFailure =
    workflowConfig.stopOnFailure ?? resolvedTemplate.execution.stopOnFailure;
  resolvedTemplate.stages = applyStageOverrides(
    resolvedTemplate,
    workflowConfig.stages,
    workflowConfig.requireHumanApprovalFor,
  );

  return validateWorkflowTemplate(resolvedTemplate);
}

export function listWorkflowStageIds(
  template: WorkflowTemplate = STANDARD_WORKFLOW_TEMPLATE as WorkflowTemplate,
): string[] {
  return template.stages.map((stage) => stage.id);
}
