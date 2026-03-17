import fs from "node:fs";
import path from "node:path";
import type { CommandContext } from "../cli/runtime/context.js";
import { ConfigError, InputError } from "../cli/runtime/errors.js";
import type { Logger } from "../cli/ui/logger.js";
import { loadResolvedConfig } from "../config/load-config.js";
import {
  DEFAULT_TASK_CSV_COLUMNS,
  normalizeProjectSlug,
  normalizeSprintName,
  resolveRepositoryLayout,
} from "../config/repository-layout.js";
import {
  OFFICIAL_BASE_STANDARDS_PACKAGE,
  listRulesForConsumer,
  renderRulesForConsumer,
  resolveStandardsPackage,
} from "../standards/official-base-package.js";
import { normalizeLocale, toRelativePath, translateLocale } from "../utils/common.js";
import type { ExecuteWorkflowOptions } from "../workflow/governance-engine.js";
import { executeWorkflow } from "../workflow/governance-engine.js";
import { renderPlanDocument, resolvePlanTemplateLocale } from "./templates/plan-documents.js";

// biome-ignore lint/suspicious/noExplicitAny: transitional typing for large command migration
type AnyRecord = Record<string, any>;

function t(locale: string | null | undefined, zhCN: string, enUS: string): string {
  return translateLocale(locale, zhCN, enUS);
}

function formatDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function addDays(dateValue: string, days: number): string {
  const value = new Date(dateValue);
  value.setUTCDate(value.getUTCDate() + days);
  return formatDate(value);
}

function ensureTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function getStringOption(options: Record<string, unknown>, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" ? value : undefined;
}

function readInputFile(cwd: string, inputPath: string, locale = "zh-CN"): AnyRecord {
  const absoluteInputPath = path.resolve(cwd, inputPath);

  if (!fs.existsSync(absoluteInputPath)) {
    throw new InputError(
      t(
        locale,
        `未找到 plan 输入文件：${absoluteInputPath}`,
        `Plan input file not found: ${absoluteInputPath}`,
      ),
      {
        code: "cli.plan_input_missing",
        details: {
          inputPath: absoluteInputPath,
        },
      },
    );
  }

  return {
    path: absoluteInputPath,
    content: fs.readFileSync(absoluteInputPath, "utf8").trim(),
  };
}

function summarizeText(value: unknown, maxLength = 220): string {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function normalizeTaskPrefix(value: unknown): string {
  const normalized = String(value ?? "TK")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");

  return normalized || "TK";
}

function createTaskId(prefix: string, taskNumber: number): string {
  return `${prefix}-${String(taskNumber).padStart(3, "0")}`;
}

function collectTaskNumbersFromText(content: string, prefix: string): number[] {
  const matcher = new RegExp(`${prefix}-(\\d{3})`, "g");
  const numbers = [];

  for (const match of String(content).matchAll(matcher)) {
    numbers.push(Number(match[1]));
  }

  return numbers;
}

function collectExistingTaskNumbers(paths: AnyRecord, prefix: string): number[] {
  const numbers = [];

  if (fs.existsSync(paths.tasksRoot)) {
    for (const entry of fs.readdirSync(paths.tasksRoot)) {
      const match = entry.match(new RegExp(`^${prefix}-(\\d{3})\\.md$`));

      if (match) {
        numbers.push(Number(match[1]));
      }
    }
  }

  for (const filePath of [paths.checklistFile, paths.taskCsvFile]) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    numbers.push(...collectTaskNumbersFromText(fs.readFileSync(filePath, "utf8"), prefix));
  }

  return numbers;
}

function createLocalizedTaskBlueprints(
  locale: string,
  title: string,
  standardsPackage: AnyRecord,
  startTaskNumber: number,
  dateStamp: string,
  taskPrefix: string,
): AnyRecord[] {
  const planRuleIds = listRulesForConsumer(standardsPackage as any, "plan").map((rule) => rule.id);
  const checkRuleIds = listRulesForConsumer(standardsPackage as any, "check").map(
    (rule) => rule.id,
  );
  const reviewRuleIds = listRulesForConsumer(standardsPackage as any, "review").map(
    (rule) => rule.id,
  );

  const blueprints =
    locale === "en-US"
      ? [
          {
            title: `Clarify scope and acceptance for ${title}`,
            owner: "Workflow",
            priority: "P0",
            dueDate: addDays(dateStamp, 1),
            goal: `Confirm the goal, scope boundaries, risks, and acceptance criteria for ${title}.`,
            planSummary: `Clarify the goal, scope, risks, and acceptance criteria for ${title}.`,
            deliverables: [
              "An updated sprint plan with explicit scope and risk sections.",
              "A requirement snapshot with the key constraints and assumptions.",
              "A task sequence aligned with the standard workflow.",
            ],
            acceptance: [
              "The plan states goal, in-scope items, out-of-scope items, risks, and acceptance criteria.",
              "The request summary is specific enough for implementation work to start.",
              "The task sequence aligns with the standard workflow stages.",
            ],
            ruleIds: planRuleIds,
          },
          {
            title: `Implement the core changes for ${title}`,
            owner: "Implementation",
            priority: "P0",
            dueDate: addDays(dateStamp, 2),
            goal: `Implement the code and documentation changes required for ${title} while staying close to the existing repository structure.`,
            planSummary: `Implement the core code and document updates for ${title} while respecting current repository patterns.`,
            deliverables: [
              "Code changes that satisfy the task scope.",
              "Any required documentation or configuration updates.",
              "A clear list of changed files and intended outcomes.",
            ],
            acceptance: [
              "The implementation follows existing repository conventions unless the plan justifies a refactor.",
              "Relevant docs or config files are updated together with code.",
              "The change scope matches the task goal.",
            ],
            ruleIds: [...planRuleIds, "code-follow-existing-structure"],
          },
          {
            title: `Validate gates and regressions for ${title}`,
            owner: "Quality",
            priority: "P0",
            dueDate: addDays(dateStamp, 3),
            goal: `Run the required validation path for ${title} and record the expected pass criteria before delivery.`,
            planSummary: `Define and execute the validation path for ${title}, then capture commands and expected results.`,
            deliverables: [
              "A concrete verification checklist or command list.",
              "Recorded gate results and regression notes.",
              "Any follow-up fixes required to reach a passing state.",
            ],
            acceptance: [
              "The task includes explicit validation commands or actions.",
              "The verification result can be written back to checklist and CSV.",
              "Known regressions are either fixed or explicitly called out.",
            ],
            ruleIds: [...planRuleIds, ...checkRuleIds],
          },
          {
            title: `Prepare review notes and task record sync for ${title}`,
            owner: "Workflow",
            priority: "P1",
            dueDate: addDays(dateStamp, 4),
            goal: `Prepare review-ready context for ${title} and keep the task records aligned with the actual delivery state.`,
            planSummary: `Prepare review context and keep checklist/CSV aligned with the final delivery state for ${title}.`,
            deliverables: [
              "Review-ready context with risks and assumptions called out.",
              "Checklist and CSV records that reflect the latest execution state.",
              "A clean hand-off note for review or delivery.",
            ],
            acceptance: [
              "Risks and assumptions are explicitly documented.",
              "Checklist and CSV remain in sync with the latest execution state.",
              "The task is ready for review without hidden context.",
            ],
            ruleIds: [...planRuleIds, ...reviewRuleIds],
          },
        ]
      : [
          {
            title: `澄清 ${title} 的目标与验收边界`,
            owner: "Workflow",
            priority: "P0",
            dueDate: addDays(dateStamp, 1),
            goal: `确认 ${title} 的目标、范围边界、关键风险和验收标准。`,
            planSummary: `澄清 ${title} 的目标、范围、风险和验收标准。`,
            deliverables: [
              "补齐目标、范围、风险和验收标准的 sprint 方案。",
              "提炼当前需求快照、关键约束和假设。",
              "把任务拆解映射到标准 workflow。",
            ],
            acceptance: [
              "方案明确给出目标、纳入范围、非范围、风险和验收标准。",
              "需求摘要足够支撑后续实现。",
              "任务顺序与标准 workflow 阶段对齐。",
            ],
            ruleIds: planRuleIds,
          },
          {
            title: `实现 ${title} 的核心变更`,
            owner: "Implementation",
            priority: "P0",
            dueDate: addDays(dateStamp, 2),
            goal: `完成 ${title} 所需的代码与文档改动，并尽量贴合现有仓库结构与实现模式。`,
            planSummary: `实现 ${title} 的核心代码和文档改动，并保持与现有仓库模式一致。`,
            deliverables: [
              "满足任务范围的代码改动。",
              "需要同步更新的文档或配置文件。",
              "清晰的改动范围和预期结果说明。",
            ],
            acceptance: [
              "实现优先遵循现有目录结构和模块边界。",
              "代码、文档和配置改动保持同步。",
              "改动范围与任务目标一致。",
            ],
            ruleIds: [...planRuleIds, "code-follow-existing-structure"],
          },
          {
            title: `验证 ${title} 的门禁与回归`,
            owner: "Quality",
            priority: "P0",
            dueDate: addDays(dateStamp, 3),
            goal: `为 ${title} 规划并执行验证路径，在交付前明确需要通过的门禁和期望结果。`,
            planSummary: `规划并执行 ${title} 的验证路径，记录验证命令和预期结果。`,
            deliverables: [
              "明确的验证步骤或命令清单。",
              "门禁结果与回归检查记录。",
              "为达到通过状态需要补充的修复项。",
            ],
            acceptance: [
              "任务包含明确的验证命令或验证动作。",
              "验证结果可以同步回写 checklist 与 CSV。",
              "已知回归要么修复，要么被显式记录。",
            ],
            ruleIds: [...planRuleIds, ...checkRuleIds],
          },
          {
            title: `整理 ${title} 的评审与任务记录`,
            owner: "Workflow",
            priority: "P1",
            dueDate: addDays(dateStamp, 4),
            goal: `为 ${title} 准备可评审的上下文，并保持 checklist 与 CSV 记录和真实交付状态一致。`,
            planSummary: `为 ${title} 准备评审上下文，并保持 checklist/CSV 与最终交付状态一致。`,
            deliverables: [
              "带有风险和假设说明的评审上下文。",
              "与最新执行状态一致的 checklist 和 CSV 记录。",
              "可直接进入 review 的交付说明。",
            ],
            acceptance: [
              "风险、假设和未验证项被显式记录。",
              "checklist 和 CSV 与执行状态保持同步。",
              "任务进入 review 时不存在隐藏上下文。",
            ],
            ruleIds: [...planRuleIds, ...reviewRuleIds],
          },
        ];

  return blueprints.map((blueprint, index) => ({
    id: createTaskId(taskPrefix, startTaskNumber + index),
    status: "todo",
    dependsOn: index === 0 ? [] : [createTaskId(taskPrefix, startTaskNumber + index - 1)],
    ...blueprint,
    ruleIds: [...new Set(blueprint.ruleIds)],
  }));
}

function createPlanStrategy(locale: string, title: string): string[] {
  return locale === "en-US"
    ? [
        `State the scope, risks, and acceptance criteria for ${title} before implementation starts.`,
        "Use the standard workflow to separate planning, implementation, validation, and review hand-off.",
        "Keep checklist, CSV, and task cards aligned so later review and reporting can reuse the same artifacts.",
      ]
    : [
        `在进入实现前先明确 ${title} 的目标、范围、风险和验收标准。`,
        "按标准 workflow 把方案、实现、验证和评审交接拆开处理。",
        "保持 checklist、CSV 和任务卡一致，方便后续 review 与 report 复用。",
      ];
}

function createPlanScope(
  locale: string,
  title: string,
): { inScope: string[]; outOfScope: string[] } {
  if (locale === "en-US") {
    return {
      inScope: [
        `Generate an executable sprint plan for ${title}.`,
        "Create synchronized checklist, CSV, and task card artifacts.",
        "Apply official standards and workflow guidance to the generated artifacts.",
      ],
      outOfScope: [
        "Implement the feature itself.",
        "Run code review or review verification flows.",
        "Automate CI reporting beyond the generated planning artifacts.",
      ],
    };
  }

  return {
    inScope: [
      `为 ${title} 生成可执行的 sprint 方案。`,
      "同步生成 checklist、CSV 和任务卡产物。",
      "把官方规范和 workflow 约束应用到生成结果里。",
    ],
    outOfScope: [
      "不直接实现业务功能本身。",
      "不在本命令里执行 review 或 review-verify。",
      "不在本命令里收口 CI 报告能力。",
    ],
  };
}

function createPlanRisks(locale: string, title: string, hasInputFile: boolean): string[] {
  return locale === "en-US"
    ? [
        `If the requirement for ${title} is still ambiguous, the implementation scope may drift.`,
        "If checklist and CSV drift from task cards, later review and reporting will lose a reliable source of truth.",
        hasInputFile
          ? "The request was sourced from an input file; confirm whether any details were intentionally omitted."
          : "The request was provided inline; confirm whether any external constraints still need to be added.",
      ]
    : [
        `${title} 的需求如果仍有歧义，后续实现范围可能继续漂移。`,
        "如果 checklist、CSV 和任务卡不同步，后续 review 与 report 会失去统一事实源。",
        hasInputFile
          ? "当前需求来自输入文件，仍需确认是否存在尚未写入文件的补充约束。"
          : "当前需求来自命令行标题，仍需确认是否存在外部背景或隐藏约束。",
      ];
}

function createPlanAcceptance(locale: string): string[] {
  return locale === "en-US"
    ? [
        "The generated plan states the goal, scope, risks, acceptance criteria, and verification path.",
        "Checklist, CSV, and task cards are generated together under the current project and sprint.",
        "The generated tasks can be consumed by later check, review, and delivery flows.",
      ]
    : [
        "生成的 plan.md 明确包含目标、范围、风险、验收标准和验证路径。",
        "checklist、CSV 和任务卡在当前项目与 sprint 目录下同步生成。",
        "生成的任务可被后续 check、review 和交付流程直接消费。",
      ];
}

function createPlanVerificationPath(locale: string): string[] {
  return locale === "en-US"
    ? [
        "Run `repo-ai-governor check --project <project> --sprint <sprint> --format json` after planning artifacts are generated.",
        "Confirm checklist, tasks.csv, and task cards stay in sync for the same task IDs.",
        "Verify the generated plan includes standards guidance, risks, and acceptance criteria.",
      ]
    : [
        "在生成计划产物后运行 `repo-ai-governor check --project <project> --sprint <sprint> --format json`。",
        "确认 checklist、tasks.csv 和任务卡的任务编号保持同步。",
        "确认 plan.md 包含规范约束、风险和验收标准。",
      ];
}

function resolveArtifactPaths(
  cwd: string,
  config: AnyRecord,
  commandContext: CommandContext,
  locale: string,
): AnyRecord {
  const currentProject =
    getStringOption(commandContext.globalOptions, "project") ?? config.execution.currentProject;
  const currentSprint =
    getStringOption(commandContext.globalOptions, "sprint") ?? config.execution.currentSprint;

  if (!currentProject || !currentSprint) {
    throw new ConfigError(
      t(
        locale,
        "plan 命令需要当前 project 与 sprint。",
        "Plan command requires a current project and sprint",
      ),
      {
        code: "cli.plan_missing_context",
        details: {
          currentProject,
          currentSprint,
        },
      },
    );
  }

  const normalizedProject = normalizeProjectSlug(currentProject);
  const normalizedSprint = normalizeSprintName(currentSprint);
  const layout = resolveRepositoryLayout({
    cwd,
    project: normalizedProject,
    sprint: normalizedSprint,
  });
  const bundleDirOption = getStringOption(commandContext.commandOptions, "bundleDir");
  const outputOption = getStringOption(commandContext.commandOptions, "out");
  const bundleRoot = bundleDirOption
    ? path.resolve(cwd, bundleDirOption)
    : layout.absolute.sprintDir;
  const tasksRoot = path.resolve(bundleRoot, config.artifacts.directories.tasks);
  const codeReviewRoot = path.resolve(bundleRoot, config.artifacts.directories.codeReview);

  return {
    currentProject: normalizedProject,
    currentSprint: normalizedSprint,
    bundleRoot,
    tasksRoot,
    codeReviewRoot,
    planFile: path.resolve(bundleRoot, config.artifacts.files.plan),
    checklistFile: path.resolve(tasksRoot, config.artifacts.taskFiles.checklist),
    taskCsvFile: path.resolve(tasksRoot, config.artifacts.taskFiles.csv),
    outputFile: outputOption ? path.resolve(cwd, outputOption) : null,
    csvColumns: config.artifacts.taskFiles.csvColumns ?? DEFAULT_TASK_CSV_COLUMNS,
  };
}

function resolvePlanIntent(cwd: string, commandContext: CommandContext, locale: string): AnyRecord {
  const inputOption = getStringOption(commandContext.commandOptions, "input");
  const titleOption = getStringOption(commandContext.commandOptions, "title");
  const inputFile = inputOption ? readInputFile(cwd, inputOption, locale) : null;
  const title = titleOption ?? summarizeText(inputFile?.content ?? "");

  if (!title) {
    throw new InputError(
      t(locale, "plan 命令需要 --title 或 --input。", "Plan command requires --title or --input"),
      {
        code: "cli.plan_missing_title",
      },
    );
  }

  return {
    title,
    inputFile,
    requirementSummary: summarizeText(inputFile?.content ?? title, 320),
  };
}

function buildPlanRun(commandContext: CommandContext): AnyRecord {
  const cwd = path.resolve(getStringOption(commandContext.globalOptions, "cwd") ?? process.cwd());
  const resolved = loadResolvedConfig({
    cwd,
    configPath: getStringOption(commandContext.globalOptions, "config"),
    cliOverrides: {
      ...commandContext.globalOptions,
      ...commandContext.commandOptions,
    },
  });
  const locale = resolvePlanTemplateLocale(
    getStringOption(commandContext.globalOptions, "locale") ??
      resolved.config.standards.locales?.default ??
      "zh-CN",
  );
  const intent = resolvePlanIntent(cwd, commandContext, locale);
  const artifactPaths = resolveArtifactPaths(cwd, resolved.config, commandContext, locale);
  const standardsPackage = resolveStandardsPackage(resolved.config.standards);
  const existingTaskNumbers = collectExistingTaskNumbers(
    artifactPaths,
    normalizeTaskPrefix(resolved.config.execution.taskPrefix),
  );
  const nextTaskNumber = Math.max(...existingTaskNumbers, 0) + 1;
  const dateStamp = formatDate();
  const taskPrefix = normalizeTaskPrefix(resolved.config.execution.taskPrefix);
  const planRules = renderRulesForConsumer(standardsPackage, "plan", {
    view: "human",
    locale,
  });
  const planningTasks = createLocalizedTaskBlueprints(
    locale,
    intent.title,
    standardsPackage,
    nextTaskNumber,
    dateStamp,
    taskPrefix,
  );
  const strategy = createPlanStrategy(locale, intent.title);
  const scope = createPlanScope(locale, intent.title);
  const risks = createPlanRisks(locale, intent.title, Boolean(intent.inputFile));
  const acceptance = createPlanAcceptance(locale);
  const verificationPath = createPlanVerificationPath(locale);

  return {
    cwd,
    resolvedConfig: resolved,
    locale,
    dateStamp,
    intent,
    artifactPaths,
    standardsPackage,
    planRules,
    planningTasks,
    strategy,
    risks,
    scope,
    acceptance,
    verificationPath,
  };
}

function buildGeneratedFiles(runState: AnyRecord, workflowResult: AnyRecord): AnyRecord[] {
  const documents = workflowResult.state.documents ?? {};
  const files = [
    {
      path: runState.artifactPaths.planFile,
      content: documents.plan,
      action: fs.existsSync(runState.artifactPaths.planFile) ? "update" : "create",
    },
    {
      path: runState.artifactPaths.checklistFile,
      content: documents.checklist,
      action: fs.existsSync(runState.artifactPaths.checklistFile) ? "update" : "create",
    },
    {
      path: runState.artifactPaths.taskCsvFile,
      content: documents.tasksCsv,
      action: fs.existsSync(runState.artifactPaths.taskCsvFile) ? "update" : "create",
    },
    ...runState.planningTasks.map((task: AnyRecord) => {
      const filePath = path.resolve(runState.artifactPaths.tasksRoot, `${task.id}.md`);

      return {
        path: filePath,
        content: documents.taskFiles[task.id],
        action: fs.existsSync(filePath) ? "update" : "create",
      };
    }),
  ];

  return files;
}

function writeSummaryOutput(
  filePath: string | null,
  payload: AnyRecord,
  format: string,
): string | null {
  if (!filePath) {
    return null;
  }

  const directoryPath = path.dirname(filePath);
  fs.mkdirSync(directoryPath, { recursive: true });
  const content =
    format === "json"
      ? `${JSON.stringify(payload, null, 2)}\n`
      : ensureTrailingNewline(
          renderPlanDocument("summary", {
            locale: payload.locale,
            status: payload.status,
            dryRun: payload.dryRun,
            currentProject: payload.currentProject,
            currentSprint: payload.currentSprint,
            title: payload.title,
            workflowStatus: payload.workflow.status,
            workflowStages: payload.workflow.selectedStageIds,
            standardsPreset: payload.standards.preset,
            tasks: payload.tasks,
            files: payload.files,
          } as any),
        );

  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

function createWorkflowHandlers(runState: AnyRecord): AnyRecord {
  return {
    plan: ({ state, selectedStageIds }: AnyRecord) => {
      state.documents = state.documents ?? {};
      state.tasks = runState.planningTasks;
      state.documents.plan = renderPlanDocument("sprintPlan", {
        locale: runState.locale,
        currentProject: runState.artifactPaths.currentProject,
        currentSprint: runState.artifactPaths.currentSprint,
        dateStamp: runState.dateStamp,
        title: runState.intent.title,
        goal:
          runState.locale === "en-US"
            ? `Prepare an executable sprint plan and task breakdown for ${runState.intent.title}.`
            : `为 ${runState.intent.title} 生成可执行的 sprint 方案和任务拆解。`,
        requirementSummary: runState.intent.requirementSummary,
        inScope: runState.scope.inScope,
        outOfScope: runState.scope.outOfScope,
        workflowStages: selectedStageIds,
        planRules: runState.planRules,
        strategy: runState.strategy,
        risks: runState.risks,
        acceptance: runState.acceptance,
        verificationPath: runState.verificationPath,
        tasks: runState.planningTasks,
      } as any);

      return {
        summary:
          runState.locale === "en-US"
            ? "Sprint plan document generated."
            : "已生成 sprint 方案文档。",
        outputs: {
          "plan.md": {
            title: runState.intent.title,
            taskCount: runState.planningTasks.length,
          },
        },
      };
    },
    breakdown: ({ state }: AnyRecord) => {
      state.documents = state.documents ?? {};
      state.documents.checklist = renderPlanDocument("checklist", {
        locale: runState.locale,
        currentSprint: runState.artifactPaths.currentSprint,
        tasks: runState.planningTasks,
      } as any);
      state.documents.tasksCsv = renderPlanDocument("tasksCsv", {
        locale: runState.locale,
        dateStamp: runState.dateStamp,
        csvColumns: runState.artifactPaths.csvColumns,
        currentProject: runState.artifactPaths.currentProject,
        currentSprint: runState.artifactPaths.currentSprint,
        tasks: runState.planningTasks,
      } as any);
      state.documents.taskFiles = Object.fromEntries(
        runState.planningTasks.map((task: AnyRecord) => [
          task.id,
          renderPlanDocument("taskFile", {
            locale: runState.locale,
            dateStamp: runState.dateStamp,
            currentProject: runState.artifactPaths.currentProject,
            currentSprint: runState.artifactPaths.currentSprint,
            task,
          } as any),
        ]),
      );

      return {
        summary:
          runState.locale === "en-US"
            ? "Checklist, CSV, and task cards generated."
            : "已生成 checklist、CSV 和任务卡。",
        outputs: {
          "tasks/checklist.md": {
            taskCount: runState.planningTasks.length,
          },
          "tasks/tasks.csv": {
            rows: runState.planningTasks.length,
          },
        },
      };
    },
  };
}

function renderPlanPayload(
  runState: AnyRecord,
  workflowResult: AnyRecord,
  commandContext: CommandContext,
  files: AnyRecord[],
  outputFilePath: string | null = null,
): AnyRecord {
  return {
    command: "plan",
    status: commandContext.globalOptions.dryRun === true ? "planned" : "generated",
    dryRun: commandContext.globalOptions.dryRun === true,
    cwd: runState.cwd,
    locale: runState.locale,
    title: runState.intent.title,
    inputFile: runState.intent.inputFile
      ? toRelativePath(runState.cwd, runState.intent.inputFile.path)
      : null,
    currentProject: runState.artifactPaths.currentProject,
    currentSprint: runState.artifactPaths.currentSprint,
    bundleDir: toRelativePath(runState.cwd, runState.artifactPaths.bundleRoot),
    workflow: {
      status: workflowResult.status,
      selectedStageIds: workflowResult.selectedStageIds,
      summary: workflowResult.summary,
    },
    standards: {
      preset: runState.standardsPackage.meta.preset,
      defaultLocale: runState.standardsPackage.locales.default,
      totalRules: runState.standardsPackage.rules.length,
      planRuleIds: listRulesForConsumer(runState.standardsPackage, "plan").map(
        (rule: AnyRecord) => rule.id,
      ),
    },
    tasks: runState.planningTasks,
    files: files.map((file: AnyRecord) => ({
      path: toRelativePath(runState.cwd, file.path),
      action: file.action,
    })),
    outputFile: outputFilePath ? toRelativePath(runState.cwd, outputFilePath) : null,
  };
}

function writePlanSummary(logger: Logger, payload: AnyRecord, format: string): void {
  const locale = normalizeLocale(payload.locale);

  if (format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (format === "markdown") {
    logger.raw(
      renderPlanDocument("summary", {
        locale: payload.locale,
        status: payload.status,
        dryRun: payload.dryRun,
        currentProject: payload.currentProject,
        currentSprint: payload.currentSprint,
        title: payload.title,
        workflowStatus: payload.workflow.status,
        workflowStages: payload.workflow.selectedStageIds,
        standardsPreset: payload.standards.preset,
        tasks: payload.tasks,
        files: payload.files,
      } as any),
      { ignoreQuiet: true },
    );
    return;
  }

  logger.success(
    payload.dryRun
      ? t(locale, "plan 预览已就绪", "plan dry-run is ready")
      : t(locale, "plan 产物已生成", "plan artifacts generated"),
  );
  logger.keyValue(t(locale, "项目", "Project"), payload.currentProject);
  logger.keyValue(t(locale, "Sprint", "Sprint"), payload.currentSprint);
  logger.keyValue(t(locale, "标题", "Title"), payload.title);
  logger.keyValue(t(locale, "流程状态", "Workflow status"), payload.workflow.status);
  logger.keyValue(
    t(locale, "流程阶段", "Workflow stages"),
    JSON.stringify(payload.workflow.selectedStageIds),
  );
  logger.keyValue(t(locale, "规范预设", "Standards preset"), payload.standards.preset);
  logger.keyValue(
    t(locale, "生成任务", "Generated tasks"),
    JSON.stringify(payload.tasks.map((task: AnyRecord) => task.id)),
  );
  logger.keyValue(t(locale, "文件", "Files"), JSON.stringify(payload.files));

  if (payload.outputFile) {
    logger.keyValue(t(locale, "输出文件", "Output file"), payload.outputFile);
  }
}

export async function executePlanCommand(
  commandContext: CommandContext,
  logger: Logger,
): Promise<void> {
  let runState: AnyRecord;

  try {
    runState = buildPlanRun(commandContext);
  } catch (error) {
    if (error instanceof InputError || error instanceof ConfigError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ConfigError(error.message, {
        code: "cli.plan_invalid_config",
      });
    }

    throw error;
  }

  const workflowConfig = structuredClone(runState.resolvedConfig.config.workflow) as AnyRecord;

  if (getStringOption(commandContext.commandOptions, "template")) {
    workflowConfig.template = getStringOption(commandContext.commandOptions, "template");
  }

  const workflowResult = await executeWorkflow({
    workflowConfig: workflowConfig as ExecuteWorkflowOptions["workflowConfig"],
    targetStages: ["breakdown"],
    handlers: createWorkflowHandlers(runState) as ExecuteWorkflowOptions["handlers"],
    initialState: {
      documents: {},
      tasks: [],
    },
    metadata: {
      command: "plan",
      title: runState.intent.title,
      preset: OFFICIAL_BASE_STANDARDS_PACKAGE.meta.preset,
    },
  });
  const directories = [
    runState.artifactPaths.bundleRoot,
    runState.artifactPaths.tasksRoot,
    runState.artifactPaths.codeReviewRoot,
  ];
  const files = buildGeneratedFiles(runState, workflowResult);
  const dryRun = commandContext.globalOptions.dryRun === true;

  if (!dryRun) {
    for (const directoryPath of directories) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    for (const file of files) {
      fs.writeFileSync(file.path, file.content, "utf8");
    }
  }

  const payload = renderPlanPayload(runState, workflowResult, commandContext, files);
  const outputFilePath: string | null =
    !dryRun && runState.artifactPaths.outputFile
      ? writeSummaryOutput(runState.artifactPaths.outputFile, payload, commandContext.format)
      : null;
  const finalPayload = {
    ...payload,
    outputFile: outputFilePath ? toRelativePath(runState.cwd, outputFilePath) : payload.outputFile,
  };

  writePlanSummary(logger, finalPayload, commandContext.format);
}
