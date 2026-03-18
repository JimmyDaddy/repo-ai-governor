import { validateSchemaDocument } from "../config/schema/validator.js";
import { CommandResultStatusEnum } from "../constants/command-model.js";
import { ReviewStatusEnum } from "../constants/repository-layout.js";
import {
  STANDARD_WORKFLOW_STAGE_SEQUENCE,
  StandardWorkflowStageEnum,
  WorkflowBindingKindEnum,
  WorkflowExecutionModeEnum,
  WorkflowExecutorKindEnum,
  WorkflowGateKindEnum,
  WorkflowTemplateKindEnum,
  WorkflowTemplateSchemaVersionEnum,
} from "../constants/workflow-template.js";
import type {
  FailurePolicy,
  WorkflowBindingKind,
  WorkflowExecutionMode,
  WorkflowExecutorKind,
  WorkflowGateKind,
} from "../types/aliases/workflow.type.js";
import type {
  LocalizedText,
  WorkflowBinding,
  WorkflowConfig,
  WorkflowExecution,
  WorkflowExecutor,
  WorkflowGateCondition,
  WorkflowGateSet,
  WorkflowStage,
  WorkflowStageOverride,
  WorkflowTemplate,
} from "../types/interfaces/workflow-template.interface.js";
import { cloneValue } from "../utils/common.js";
export type {
  FailurePolicy,
  WorkflowExecutorKind,
  WorkflowBindingKind,
  WorkflowGateKind,
  WorkflowExecutionMode,
} from "../types/aliases/workflow.type.js";
export type {
  LocalizedText,
  WorkflowExecutor,
  WorkflowBinding,
  WorkflowGateCondition,
  WorkflowGateSet,
  WorkflowStage,
  WorkflowExecution,
  WorkflowTemplate,
  WorkflowStageOverride,
  WorkflowConfig,
} from "../types/interfaces/workflow-template.interface.js";

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
    version: WorkflowTemplateSchemaVersionEnum.V1,
    kind: WorkflowTemplateKindEnum.WorkflowTemplate,
    meta: {
      name: createLocalizedText("标准研发治理流程", "Standard Engineering Governance Flow"),
      description: createLocalizedText(
        "覆盖方案、拆解、开发、自测、评审、评审复核和任务记录回写的串行流程。",
        "A serial workflow covering planning, breakdown, implementation, self-check, review, review verification, and task record sync.",
      ),
    },
    execution: {
      mode: WorkflowExecutionModeEnum.Serial,
      allowSkipStages: false,
      stopOnFailure: true,
    },
    stages: [
      {
        id: StandardWorkflowStageEnum.Plan,
        name: createLocalizedText("方案", "Plan"),
        description: createLocalizedText(
          "生成 sprint 方案与范围边界。",
          "Generate the sprint plan and scope boundaries.",
        ),
        executor: {
          kind: WorkflowExecutorKindEnum.Command,
          ref: StandardWorkflowStageEnum.Plan,
          command: StandardWorkflowStageEnum.Plan,
          options: {
            phase: "solution",
          },
        },
        inputs: [
          {
            kind: WorkflowBindingKindEnum.Context,
            ref: "project-context",
          },
          {
            kind: WorkflowBindingKindEnum.Config,
            ref: "governor.workflow",
          },
        ],
        outputs: [
          {
            kind: WorkflowBindingKindEnum.Artifact,
            ref: "plan.md",
          },
        ],
        gates: {
          enter: [],
          exit: [
            {
              id: "plan-artifact-written",
              kind: WorkflowGateKindEnum.ArtifactsExist,
              refs: ["plan.md"],
            },
          ],
        },
      },
      {
        id: StandardWorkflowStageEnum.Breakdown,
        name: createLocalizedText("拆解", "Breakdown"),
        description: createLocalizedText(
          "把方案拆成任务卡、checklist 与 CSV 台账。",
          "Break the plan into task cards, checklist entries, and CSV records.",
        ),
        dependsOn: [StandardWorkflowStageEnum.Plan],
        executor: {
          kind: WorkflowExecutorKindEnum.Command,
          ref: StandardWorkflowStageEnum.Plan,
          command: StandardWorkflowStageEnum.Plan,
          options: {
            phase: "breakdown",
          },
        },
        inputs: [
          {
            kind: WorkflowBindingKindEnum.Artifact,
            ref: "plan.md",
          },
        ],
        outputs: [
          {
            kind: WorkflowBindingKindEnum.Artifact,
            ref: "tasks/checklist.md",
          },
          {
            kind: WorkflowBindingKindEnum.Artifact,
            ref: "tasks/tasks.csv",
          },
          {
            kind: WorkflowBindingKindEnum.Artifact,
            ref: "tasks/TK-xxx.md",
            multiple: true,
          },
        ],
        gates: {
          enter: [
            {
              id: "plan-available",
              kind: WorkflowGateKindEnum.ArtifactsExist,
              refs: ["plan.md"],
            },
          ],
          exit: [
            {
              id: "task-records-written",
              kind: WorkflowGateKindEnum.ArtifactsExist,
              refs: ["tasks/checklist.md", "tasks/tasks.csv"],
            },
          ],
        },
      },
      {
        id: StandardWorkflowStageEnum.Implement,
        name: createLocalizedText("开发", "Implement"),
        description: createLocalizedText(
          "根据任务卡推进代码和文档实现。",
          "Implement code and documentation changes against the task cards.",
        ),
        dependsOn: [StandardWorkflowStageEnum.Breakdown],
        executor: {
          kind: WorkflowExecutorKindEnum.Manual,
          ref: StandardWorkflowStageEnum.Implement,
        },
        inputs: [
          {
            kind: WorkflowBindingKindEnum.Artifact,
            ref: "tasks/TK-xxx.md",
            multiple: true,
          },
          {
            kind: WorkflowBindingKindEnum.Workspace,
            ref: "repository-worktree",
          },
        ],
        outputs: [
          {
            kind: WorkflowBindingKindEnum.Workspace,
            ref: "repository-worktree",
          },
        ],
      },
      {
        id: StandardWorkflowStageEnum.SelfCheck,
        name: createLocalizedText("自测", "Self Check"),
        description: createLocalizedText(
          "运行门禁、自测或 CI 等本地校验。",
          "Run local gates, self-checks, or CI-like validations.",
        ),
        dependsOn: [StandardWorkflowStageEnum.Implement],
        executor: {
          kind: WorkflowExecutorKindEnum.Command,
          ref: "check",
          command: "check",
        },
        inputs: [
          {
            kind: WorkflowBindingKindEnum.Workspace,
            ref: "repository-worktree",
          },
        ],
        outputs: [
          {
            kind: WorkflowBindingKindEnum.CheckResult,
            ref: "quality-gate-result",
          },
        ],
        gates: {
          enter: [],
          exit: [
            {
              id: "checks-pass",
              kind: WorkflowGateKindEnum.ChecksPass,
              refs: ["quality-gate-result"],
              expectedStatus: CommandResultStatusEnum.Pass,
            },
          ],
        },
      },
      {
        id: StandardWorkflowStageEnum.Review,
        name: createLocalizedText("评审", "Review"),
        description: createLocalizedText(
          "生成带状态前缀的 code review 报告。",
          "Generate a status-prefixed code review report.",
        ),
        dependsOn: [StandardWorkflowStageEnum.SelfCheck],
        executor: {
          kind: WorkflowExecutorKindEnum.Command,
          ref: StandardWorkflowStageEnum.Review,
          command: StandardWorkflowStageEnum.Review,
        },
        inputs: [
          {
            kind: WorkflowBindingKindEnum.Workspace,
            ref: "repository-worktree",
          },
          {
            kind: WorkflowBindingKindEnum.CheckResult,
            ref: "quality-gate-result",
          },
        ],
        outputs: [
          {
            kind: WorkflowBindingKindEnum.ReviewRecord,
            ref: "code-review/review_<slug>.md",
          },
        ],
      },
      {
        id: StandardWorkflowStageEnum.ReviewVerify,
        name: createLocalizedText("评审复核", "Review Verify"),
        description: createLocalizedText(
          "把复核结果追加到同一份 CR 文件并推进状态。",
          "Append verification results into the same review file and advance its status.",
        ),
        dependsOn: [StandardWorkflowStageEnum.Review],
        executor: {
          kind: WorkflowExecutorKindEnum.Command,
          ref: StandardWorkflowStageEnum.ReviewVerify,
          command: StandardWorkflowStageEnum.ReviewVerify,
        },
        inputs: [
          {
            kind: WorkflowBindingKindEnum.ReviewRecord,
            ref: "code-review/review_<slug>.md",
          },
        ],
        outputs: [
          {
            kind: WorkflowBindingKindEnum.ReviewRecord,
            ref: "code-review/verified_review_<slug>.md",
          },
        ],
        gates: {
          enter: [],
          exit: [
            {
              id: "review-verified",
              kind: WorkflowGateKindEnum.ReviewStatus,
              refs: ["code-review/verified_review_<slug>.md"],
              expectedStatus: ReviewStatusEnum.Verified,
            },
          ],
        },
      },
      {
        id: StandardWorkflowStageEnum.TaskSync,
        name: createLocalizedText("任务记录回写", "Task Record Sync"),
        description: createLocalizedText(
          "把执行与复核结果回写到 checklist 和 tasks.csv。",
          "Write execution and verification results back to checklist and tasks.csv.",
        ),
        dependsOn: [StandardWorkflowStageEnum.ReviewVerify],
        executor: {
          kind: WorkflowExecutorKindEnum.Internal,
          ref: "task-record-sync",
        },
        inputs: [
          {
            kind: WorkflowBindingKindEnum.ReviewRecord,
            ref: "code-review/verified_review_<slug>.md",
          },
          {
            kind: WorkflowBindingKindEnum.Artifact,
            ref: "tasks/checklist.md",
          },
          {
            kind: WorkflowBindingKindEnum.Artifact,
            ref: "tasks/tasks.csv",
          },
        ],
        outputs: [
          {
            kind: WorkflowBindingKindEnum.TaskRecord,
            ref: "tasks/checklist.md",
          },
          {
            kind: WorkflowBindingKindEnum.TaskRecord,
            ref: "tasks/tasks.csv",
          },
        ],
        gates: {
          enter: [],
          exit: [
            {
              id: "task-records-updated",
              kind: WorkflowGateKindEnum.TaskRecordUpdated,
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
