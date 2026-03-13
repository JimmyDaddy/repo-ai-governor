import {
  createStandardsRule,
  OFFICIAL_BASE_PACKAGE_SKELETON,
  renderRuleView,
  STANDARDS_CONSUMERS,
  STANDARDS_PACKAGE_PRESET,
  validateStandardsPackage
} from "./package-model.js";

function cloneValue(value) {
  return structuredClone(value);
}

function createLocalizedText(zhCN, enUS) {
  return {
    "zh-CN": zhCN,
    "en-US": enUS
  };
}

function createRule(rule) {
  return createStandardsRule(rule);
}

export const OFFICIAL_BASE_PACKAGE_RULES = Object.freeze([
  createRule({
    id: "code-follow-existing-structure",
    category: "code",
    level: "recommended",
    title: createLocalizedText("代码改动应遵循现有仓库结构", "Code Changes Should Follow Existing Repository Structure"),
    statement: createLocalizedText(
      "修改代码时优先延续现有目录、命名、模块边界和实现风格，避免无必要重构。",
      "When changing code, keep the existing directory layout, naming, module boundaries, and implementation style unless a refactor is necessary."
    ),
    consumers: ["plan", "review"],
    automation: {
      blockOnViolation: false,
      severity: "warn",
      stages: ["plan", "review"]
    },
    views: {
      ai: {
        instruction: createLocalizedText(
          "实现方案时优先复用现有结构与模式，不要为了好看而重写无关代码。",
          "Prefer existing repository patterns and structure when planning changes. Do not rewrite unrelated code for style alone."
        ),
        verification: createLocalizedText(
          "检查任务方案是否尊重既有模块边界、命名和文件布局。",
          "Verify the task plan respects current module boundaries, naming, and file layout."
        )
      },
      human: {
        summary: createLocalizedText(
          "方案和实现应尽量贴合现有代码结构。",
          "The plan and implementation should stay close to the existing code structure."
        ),
        rationale: createLocalizedText(
          "这样可以降低回归风险并减少无关改动。",
          "This reduces regression risk and avoids unrelated churn."
        ),
        remediation: createLocalizedText(
          "如果需要重构，先在方案里显式说明原因、范围和收益。",
          "If a refactor is necessary, explain the reason, scope, and expected benefit in the plan first."
        )
      }
    }
  }),
  createRule({
    id: "engineering-conventional-commit-required",
    category: "engineering",
    level: "required",
    title: createLocalizedText("交付必须使用 Conventional Commit", "Delivery Must Use Conventional Commits"),
    statement: createLocalizedText(
      "交付收尾时应使用 Conventional Commit 生成明确的提交信息。",
      "Delivery should use a clear Conventional Commit message."
    ),
    consumers: ["plan", "review"],
    automation: {
      blockOnViolation: true,
      severity: "error",
      stages: ["plan", "review"]
    },
    views: {
      ai: {
        instruction: createLocalizedText(
          "在输出交付计划或提交建议时使用 type(scope): subject 形式的 Conventional Commit。",
          "When suggesting delivery steps or commit messages, use Conventional Commit format: type(scope): subject."
        ),
        verification: createLocalizedText(
          "检查交付说明是否明确提交类型、作用域和动作。",
          "Verify delivery guidance includes an explicit commit type, scope, and action-oriented subject."
        )
      },
      human: {
        summary: createLocalizedText(
          "交付应采用 Conventional Commit 约定。",
          "Delivery should follow Conventional Commit conventions."
        ),
        rationale: createLocalizedText(
          "这能让变更分类、发布说明和回溯更稳定。",
          "This keeps change classification, release notes, and traceability consistent."
        ),
        remediation: createLocalizedText(
          "如果当前提交信息不明确，应在收尾前改成 Conventional Commit。",
          "If the commit message is vague, rewrite it to a Conventional Commit before delivery."
        )
      }
    }
  }),
  createRule({
    id: "process-plan-must-state-scope",
    category: "process",
    level: "required",
    title: createLocalizedText("方案必须明确目标、范围与风险", "Plans Must State Goals, Scope, and Risks"),
    statement: createLocalizedText(
      "任何任务方案都应明确目标、纳入范围、非范围、风险和验收口径。",
      "Every task plan must state the goal, in-scope items, out-of-scope items, risks, and acceptance criteria."
    ),
    consumers: ["plan", "check", "review"],
    automation: {
      blockOnViolation: true,
      severity: "error",
      stages: ["plan", "check"]
    },
    views: {
      ai: {
        instruction: createLocalizedText(
          "生成方案时必须包含目标、范围、非范围、风险和验收标准，不要只给任务列表。",
          "When generating a plan, include the goal, in-scope items, out-of-scope items, risks, and acceptance criteria. Do not output only a task list."
        ),
        verification: createLocalizedText(
          "检查 plan.md 是否包含目标、范围、风险和验收标准章节。",
          "Verify plan.md contains sections for goal, scope, risks, and acceptance criteria."
        )
      },
      human: {
        summary: createLocalizedText(
          "方案必须把目标、范围和风险说清楚。",
          "The plan must make the goal, scope, and risks explicit."
        ),
        rationale: createLocalizedText(
          "这样团队才能在实现前对边界和预期达成一致。",
          "This helps the team align on boundaries and expectations before implementation."
        ),
        remediation: createLocalizedText(
          "如果方案只列了步骤，请补上目标、范围、风险和验收部分。",
          "If the plan only lists steps, add explicit goal, scope, risks, and acceptance sections."
        )
      }
    }
  }),
  createRule({
    id: "process-task-records-must-sync",
    category: "process",
    level: "required",
    title: createLocalizedText("任务拆解必须同步 checklist 与 CSV", "Task Breakdown Must Sync Checklist and CSV"),
    statement: createLocalizedText(
      "任务拆解完成后，必须同步生成或更新 checklist、tasks.csv 和单任务文件。",
      "After task breakdown, checklist, tasks.csv, and individual task files must be generated or updated together."
    ),
    consumers: ["plan", "review-verify"],
    automation: {
      blockOnViolation: true,
      severity: "error",
      stages: ["plan", "review-verify"]
    },
    views: {
      ai: {
        instruction: createLocalizedText(
          "拆解任务时同步写入 plan.md、tasks/checklist.md、tasks/tasks.csv 和 tasks/TK-xxx.md。",
          "When breaking down work, update plan.md, tasks/checklist.md, tasks/tasks.csv, and tasks/TK-xxx.md together."
        ),
        verification: createLocalizedText(
          "检查任务拆解输出是否同时覆盖 plan、checklist、CSV 和任务卡。",
          "Verify the breakdown output includes plan, checklist, CSV, and task cards together."
        )
      },
      human: {
        summary: createLocalizedText(
          "任务拆解需要同步回写 sprint 产物。",
          "Task breakdown needs to update the sprint artifacts together."
        ),
        rationale: createLocalizedText(
          "这样后续执行、复核和报告才有统一事实源。",
          "This keeps a single source of truth for execution, verification, and reporting."
        ),
        remediation: createLocalizedText(
          "如果只更新了某一份记录，请补齐 checklist、CSV 和任务卡。",
          "If only one artifact was updated, bring checklist, CSV, and task cards back into sync."
        )
      }
    }
  }),
  createRule({
    id: "quality-verification-before-delivery",
    category: "quality",
    level: "required",
    title: createLocalizedText("交付前必须给出验证路径", "Delivery Must Include a Verification Path"),
    statement: createLocalizedText(
      "方案和实现都应明确需要运行的检查、测试或验证步骤，以及期望结果。",
      "Both the plan and the implementation must specify which checks, tests, or verification steps will run and what success looks like."
    ),
    consumers: ["plan", "check", "review"],
    automation: {
      blockOnViolation: true,
      severity: "error",
      stages: ["plan", "check", "review"]
    },
    views: {
      ai: {
        instruction: createLocalizedText(
          "在任务方案中写明要运行的门禁、测试或校验命令，并记录预期通过结果。",
          "Include the gates, tests, or validation commands in the task plan and record the expected passing result."
        ),
        verification: createLocalizedText(
          "检查方案和执行记录是否包含明确的验证命令或验证动作。",
          "Verify the plan and execution records include explicit verification commands or validation actions."
        )
      },
      human: {
        summary: createLocalizedText(
          "任务必须带着验证路径一起交付。",
          "Tasks must be delivered with a clear verification path."
        ),
        rationale: createLocalizedText(
          "没有验证路径的交付很难判断风险是否已关闭。",
          "Without a verification path, it is hard to tell whether the risk is actually closed."
        ),
        remediation: createLocalizedText(
          "如果还没有验证计划，请补充会运行什么、何时运行以及通过标准。",
          "If there is no verification plan yet, add what will run, when it will run, and what passing means."
        )
      }
    }
  }),
  createRule({
    id: "quality-check-results-must-be-recorded",
    category: "quality",
    level: "required",
    title: createLocalizedText("校验结果必须记录到任务台账", "Check Results Must Be Recorded in Task Records"),
    statement: createLocalizedText(
      "执行门禁、自测或复核后，应把结果写回 checklist 和 tasks.csv。",
      "After running gates, self-checks, or verification, write the result back to checklist and tasks.csv."
    ),
    consumers: ["check", "review-verify", "report"],
    automation: {
      blockOnViolation: true,
      severity: "error",
      stages: ["check", "review-verify", "task-sync"]
    },
    views: {
      ai: {
        instruction: createLocalizedText(
          "在完成校验后，把验证命令和结果同步记录到 checklist 与 tasks.csv。",
          "After validation, record the command and result in checklist and tasks.csv."
        ),
        verification: createLocalizedText(
          "检查执行记录是否包含 verify 字段和与之对应的结果说明。",
          "Verify execution records contain a verify field and the corresponding outcome."
        )
      },
      human: {
        summary: createLocalizedText(
          "校验结论需要进入任务台账。",
          "Validation outcomes need to be written into the task ledger."
        ),
        rationale: createLocalizedText(
          "这样后续复盘和报告才能追溯真实交付状态。",
          "This keeps delivery status traceable for later review and reporting."
        ),
        remediation: createLocalizedText(
          "如果已经跑过校验但没有记录，请补写到 checklist 和 CSV。",
          "If validation already ran but was not recorded, add it to the checklist and CSV."
        )
      }
    }
  }),
  createRule({
    id: "collaboration-risks-and-assumptions-explicit",
    category: "collaboration",
    level: "recommended",
    title: createLocalizedText("风险与假设应显式记录", "Risks and Assumptions Should Be Explicit"),
    statement: createLocalizedText(
      "在方案、评审和交付说明中，应显式记录关键风险、隐含假设和未验证项。",
      "Plans, reviews, and delivery summaries should explicitly record major risks, hidden assumptions, and unverified areas."
    ),
    consumers: ["plan", "review", "report"],
    automation: {
      blockOnViolation: false,
      severity: "warn",
      stages: ["plan", "review", "report"]
    },
    views: {
      ai: {
        instruction: createLocalizedText(
          "输出方案或评审时，把关键风险、假设和未验证项单独列出，不要把不确定性藏在正文里。",
          "When producing a plan or review, list the major risks, assumptions, and unverified areas explicitly instead of burying them in the body text."
        ),
        verification: createLocalizedText(
          "检查方案或评审是否有清晰的风险与假设部分。",
          "Verify the plan or review contains a clear section for risks and assumptions."
        )
      },
      human: {
        summary: createLocalizedText(
          "风险、假设和未验证项最好单独列出。",
          "Risks, assumptions, and unverified areas are best called out explicitly."
        ),
        rationale: createLocalizedText(
          "这能帮助协作者快速判断是否需要补充确认或审批。",
          "This helps collaborators quickly decide whether more confirmation or approval is needed."
        ),
        remediation: createLocalizedText(
          "如果存在不确定项，请单独补一节记录风险和假设。",
          "If uncertainty remains, add a dedicated section for risks and assumptions."
        )
      }
    }
  })
]);

export const OFFICIAL_BASE_STANDARDS_PACKAGE = Object.freeze(
  validateStandardsPackage({
    ...cloneValue(OFFICIAL_BASE_PACKAGE_SKELETON),
    meta: {
      ...cloneValue(OFFICIAL_BASE_PACKAGE_SKELETON.meta),
      description: createLocalizedText(
        "提供可直接被 plan、check、review 等命令消费的官方默认规范内容。",
        "Provides official default standards content that can be consumed directly by plan, check, review, and related commands."
      )
    },
    rules: cloneValue(OFFICIAL_BASE_PACKAGE_RULES)
  })
);

export function resolveStandardsPackage(standardsConfig = {}) {
  const preset = standardsConfig.preset ?? STANDARDS_PACKAGE_PRESET;

  if (preset !== STANDARDS_PACKAGE_PRESET) {
    throw new TypeError(`Unsupported standards preset: ${preset}`);
  }

  const resolvedPackage = cloneValue(OFFICIAL_BASE_STANDARDS_PACKAGE);

  if (standardsConfig.locales?.default) {
    resolvedPackage.locales.default = standardsConfig.locales.default;
  }

  if (Array.isArray(standardsConfig.locales?.supported) && standardsConfig.locales.supported.length > 0) {
    resolvedPackage.locales.supported = [...standardsConfig.locales.supported];
  }

  return validateStandardsPackage(resolvedPackage);
}

export function listRulesForConsumer(standardsPackage, consumer) {
  if (!STANDARDS_CONSUMERS.includes(consumer)) {
    throw new TypeError(`Unsupported standards consumer: ${consumer}`);
  }

  const resolvedPackage = validateStandardsPackage(standardsPackage);
  return resolvedPackage.rules.filter((rule) => rule.consumers.includes(consumer));
}

export function renderRulesForConsumer(standardsPackage, consumer, options = {}) {
  return listRulesForConsumer(standardsPackage, consumer).map((rule) =>
    renderRuleView(rule, {
      view: options.view ?? "human",
      locale: options.locale ?? standardsPackage.locales.default
    })
  );
}
