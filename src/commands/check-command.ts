import fs from "node:fs";
import path from "node:path";
import type { CommandContext } from "../cli/runtime/context.js";
import type { Logger } from "../cli/ui/logger.js";
import { loadResolvedConfig } from "../config/load-config.js";
import { DEFAULT_TASK_CSV_COLUMNS } from "../config/repository-layout.js";
import { ConfigError, InputError } from "../cli/runtime/errors.js";
import { EXIT_CODES } from "../cli/runtime/exit-codes.js";
import {
  listRulesForConsumer,
  renderRulesForConsumer,
  resolveStandardsPackage
} from "../standards/official-base-package.js";
import { buildSlotRuntime } from "../slots/runtime.js";
import type { ExecuteWorkflowOptions } from "../workflow/governance-engine.js";
import { executeWorkflow } from "../workflow/governance-engine.js";
import { buildUnifiedReport, renderUnifiedReport } from "../reporting/report-model.js";
import {
  cloneValue,
  normalizeLocale,
  toRelativePath,
  translateLocale
} from "../utils/common.js";

// biome-ignore lint/suspicious/noExplicitAny: transitional typing for large command migration
type AnyRecord = Record<string, any>;

type CheckFinding = {
  id: string;
  stageId: string;
  ruleId: string | null;
  severity: "info" | "warning" | "error";
  status: "pass" | "warn" | "fail";
  message: string;
  target: string;
  suggestion: string | null;
};

const CHECK_WORKFLOW_TEMPLATE = Object.freeze({
  id: "governance-check",
  version: "1",
  kind: "workflow-template",
  meta: {
    name: {
      "zh-CN": "治理检查流程",
      "en-US": "Governance Check Flow"
    },
    description: {
      "zh-CN": "用于校验计划、拆解与执行记录是否满足最小治理要求。",
      "en-US": "Validates planning, breakdown, and execution records against the minimum governance requirements."
    }
  },
  execution: {
    mode: "serial",
    allowSkipStages: false,
    stopOnFailure: true
  },
  stages: [
    {
      id: "plan",
      name: {
        "zh-CN": "方案检查",
        "en-US": "Plan Check"
      },
      description: {
        "zh-CN": "检查 plan.md 是否满足方案结构要求。",
        "en-US": "Validates that plan.md satisfies the expected planning structure."
      },
      executor: {
        kind: "internal",
        ref: "check-plan"
      }
    },
    {
      id: "breakdown",
      name: {
        "zh-CN": "拆解检查",
        "en-US": "Breakdown Check"
      },
      description: {
        "zh-CN": "检查 checklist、CSV 和任务卡是否保持同步。",
        "en-US": "Validates checklist, CSV, and task cards remain in sync."
      },
      dependsOn: ["plan"],
      executor: {
        kind: "internal",
        ref: "check-breakdown"
      }
    },
    {
      id: "self-check",
      name: {
        "zh-CN": "执行记录检查",
        "en-US": "Execution Record Check"
      },
      description: {
        "zh-CN": "检查验证记录、verify 字段和任务台账是否具备最小质量信息。",
        "en-US": "Validates verification records, verify fields, and the minimum task ledger quality signals."
      },
      dependsOn: ["breakdown"],
      executor: {
        kind: "internal",
        ref: "check-self"
      }
    }
  ]
});

const STAGE_RULE_IDS = Object.freeze({
  plan: ["process-plan-must-state-scope", "quality-verification-before-delivery"],
  breakdown: ["process-task-records-must-sync"],
  "self-check": ["quality-check-results-must-be-recorded"]
});

const PLAN_SECTION_PATTERNS = Object.freeze({
  goal: [/^##\s+Goal\b/m, /^##\s+目标$/m],
  inScope: [/^##\s+In Scope\b/m, /^##\s+纳入范围$/m],
  outOfScope: [/^##\s+Out Of Scope\b/m, /^##\s+非范围$/m],
  risks: [/^##\s+Risks\b/m, /^##\s+风险$/m],
  acceptance: [/^##\s+Acceptance\b/m, /^##\s+验收标准$/m],
  verificationPath: [/^##\s+Verification Path\b/m, /^##\s+验证路径$/m]
});

function t(locale: string | null | undefined, zhCN: string, enUS: string): string {
  return translateLocale(locale, zhCN, enUS);
}

function createFinding(options: AnyRecord): CheckFinding {
  return {
    id: options.id,
    stageId: options.stageId,
    ruleId: options.ruleId ?? null,
    severity: options.severity ?? "info",
    status: options.status ?? (options.severity === "error" ? "fail" : "pass"),
    message: options.message,
    target: options.target,
    suggestion: options.suggestion ?? null,
  };
}

function summarizeFindings(findings: CheckFinding[]) {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  const status = errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass";

  return {
    status,
    exitCode: errors > 0 ? EXIT_CODES.businessCheckFailed : EXIT_CODES.success,
    errors,
    warnings,
    passed: findings.filter((finding) => finding.status === "pass").length,
  };
}

function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function hasAnyPattern(content: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern: RegExp) => pattern.test(content));
}

function extractTaskIds(content: string): Set<string> {
  return new Set(String(content).match(/TK-\d{3}/g) ?? []);
}

function listTaskFileIds(tasksRoot: string): Set<string> {
  if (!fs.existsSync(tasksRoot)) {
    return new Set<string>();
  }

  return new Set(
    fs.readdirSync(tasksRoot)
      .filter((entry) => /^TK-\d{3}\.md$/.test(entry))
      .map((entry) => entry.replace(/\.md$/, ""))
  );
}

function compareTaskIdSets(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

function buildArtifactPaths(cwd: string, resolvedConfig: AnyRecord, locale = "zh-CN"): AnyRecord {
  const currentProject = resolvedConfig.config.execution.currentProject;
  const currentSprint = resolvedConfig.config.execution.currentSprint;

  if (!currentProject || !currentSprint) {
    throw new ConfigError(t(locale, "check 命令需要当前 project 与 sprint。", "Check command requires a current project and sprint"), {
      code: "cli.check_missing_context",
      details: {
        currentProject,
        currentSprint
      }
    });
  }

  const sprintRoot = path.resolve(
    cwd,
    resolvedConfig.config.artifacts.baseDir,
    currentProject,
    currentSprint
  );
  const tasksRoot = path.resolve(
    sprintRoot,
    resolvedConfig.config.artifacts.directories.tasks
  );
  const codeReviewRoot = path.resolve(
    sprintRoot,
    resolvedConfig.config.artifacts.directories.codeReview
  );
  const reportsRoot = path.resolve(cwd, resolvedConfig.config.reporting.outputDir);

  return {
    sprintRoot,
    tasksRoot,
    codeReviewRoot,
    reportsRoot,
    planFile: path.resolve(sprintRoot, resolvedConfig.config.artifacts.files.plan),
    checklistFile: path.resolve(tasksRoot, resolvedConfig.config.artifacts.taskFiles.checklist),
    taskCsvFile: path.resolve(tasksRoot, resolvedConfig.config.artifacts.taskFiles.csv),
    csvColumns: resolvedConfig.config.artifacts.taskFiles.csvColumns ?? DEFAULT_TASK_CSV_COLUMNS
  };
}

function getStringOption(options: Record<string, unknown>, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" ? value : undefined;
}

function buildCheckRun(commandContext: CommandContext): AnyRecord {
  const cwd = path.resolve(getStringOption(commandContext.globalOptions, "cwd") ?? process.cwd());
  const resolvedConfig = loadResolvedConfig({
    cwd,
    configPath: getStringOption(commandContext.globalOptions, "config"),
    cliOverrides: {
      ...commandContext.globalOptions,
      ...commandContext.commandOptions
    }
  });
  const locale = normalizeLocale(
    getStringOption(commandContext.globalOptions, "locale") ??
      resolvedConfig.config.standards.locales?.default ??
      "zh-CN",
  );
  const artifactPaths = buildArtifactPaths(cwd, resolvedConfig, locale);
  const standardsPackage = resolveStandardsPackage(resolvedConfig.config.standards);
  const selectedStage = getStringOption(commandContext.commandOptions, "stage") ?? "self-check";

  if (!CHECK_WORKFLOW_TEMPLATE.stages.some((stage) => stage.id === selectedStage)) {
    throw new InputError(
      t(locale, `不支持的 check 阶段：${selectedStage}`, `Unsupported check stage: ${selectedStage}`),
      {
      code: "cli.check_invalid_stage",
      details: {
        stage: selectedStage,
        supportedStages: CHECK_WORKFLOW_TEMPLATE.stages.map((stage) => stage.id)
      }
      }
    );
  }

  return {
    cwd,
    locale,
    selectedStage,
    resolvedConfig,
    standardsPackage,
    slotRuntime: buildSlotRuntime({
      config: resolvedConfig.config,
      slotDefinitions: resolvedConfig.slotDefinitions as any,
    }),
    artifactPaths,
    changedOnly: commandContext.commandOptions.changedOnly === true,
    writeReport: commandContext.commandOptions.writeReport === true
  };
}

function getStageRules(standardsPackage: AnyRecord, stageId: string, locale: string): AnyRecord[] {
  const ruleIds = new Set(
    (STAGE_RULE_IDS as Record<string, string[]>)[stageId] ?? [],
  );
  const matchingRules = listRulesForConsumer(standardsPackage as any, "check").filter((rule) =>
    ruleIds.has(rule.id)
  );

  return matchingRules.map((rule) =>
    renderRulesForConsumer(
      ({
        ...standardsPackage,
        rules: [rule],
      } as any),
      "check",
      {
        view: "human",
        locale,
      },
    )[0],
  );
}

function createStageResult(
  stageId: string,
  matchedRules: AnyRecord[],
  findings: CheckFinding[],
  successMessage: string,
  failureMessage: string,
): AnyRecord {
  const errors = findings.filter((finding) => finding.severity === "error");

  return {
    status: errors.length > 0 ? "failed" : "passed",
    summary: errors.length > 0 ? failureMessage : successMessage,
    details: {
      matchedRules,
      findings,
    },
  };
}

function buildSlotStageDetails(stageContext: AnyRecord): AnyRecord {
  return cloneValue(
    stageContext?.slotResolution ?? {
      activeSlots: [],
      blockedSlots: [],
      suppressedSlots: [],
      injections: {
        aiPromptKeys: [],
        humanDocSections: []
      },
      checks: {
        before: [],
        after: []
      }
    }
  );
}

function validatePlanStage(runState: AnyRecord, stageContext: AnyRecord): AnyRecord {
  const locale = runState.locale;
  const target = toRelativePath(runState.cwd, runState.artifactPaths.planFile);
  const matchedRules = getStageRules(
    runState.standardsPackage,
    "plan",
    runState.resolvedConfig.config.standards.locales.default
  );
  const findings: CheckFinding[] = [];

  if (!fs.existsSync(runState.artifactPaths.planFile)) {
    findings.push(
      createFinding({
        id: "check.plan.file",
        stageId: "plan",
        severity: "error",
        status: "fail",
        message: t(locale, "未找到 sprint 计划文件。", "Sprint plan file is missing."),
        target,
        suggestion: t(
          locale,
          "请先执行 `repo-ai-governor plan` 再运行治理检查。",
          "Run `repo-ai-governor plan` before running the governance check."
        )
      })
    );

    const stageResult = createStageResult(
      "plan",
      matchedRules,
      findings,
      t(locale, "计划检查通过。", "Plan checks passed."),
      t(locale, "计划检查失败：未找到 sprint 计划文件。", "Plan checks failed because the sprint plan is missing.")
    );

    stageResult.details.slots = buildSlotStageDetails(stageContext);
    return stageResult;
  }

  const content = readTextFile(runState.artifactPaths.planFile);
  const requiredSections = [
    {
      sectionId: "goal",
      ruleId: "process-plan-must-state-scope",
      passMessage: t(locale, "plan 已包含目标章节。", "Plan contains a goal section."),
      missingMessage: t(locale, "plan 缺少必需章节：goal。", "Plan is missing the required goal section."),
      suggestion: t(locale, "请在 plan.md 中补充 Goal/目标 章节。", "Add a Goal section to plan.md.")
    },
    {
      sectionId: "inScope",
      ruleId: "process-plan-must-state-scope",
      passMessage: t(locale, "plan 已包含纳入范围章节。", "Plan contains an in-scope section."),
      missingMessage: t(locale, "plan 缺少必需章节：inScope。", "Plan is missing the required inScope section."),
      suggestion: t(locale, "请在 plan.md 中补充 In Scope/纳入范围 章节。", "Add an In Scope section to plan.md.")
    },
    {
      sectionId: "outOfScope",
      ruleId: "process-plan-must-state-scope",
      passMessage: t(locale, "plan 已包含非范围章节。", "Plan contains an out-of-scope section."),
      missingMessage: t(locale, "plan 缺少必需章节：outOfScope。", "Plan is missing the required outOfScope section."),
      suggestion: t(locale, "请在 plan.md 中补充 Out Of Scope/非范围 章节。", "Add an Out Of Scope section to plan.md.")
    },
    {
      sectionId: "risks",
      ruleId: "process-plan-must-state-scope",
      passMessage: t(locale, "plan 已包含风险章节。", "Plan contains a risks section."),
      missingMessage: t(locale, "plan 缺少必需章节：risks。", "Plan is missing the required risks section."),
      suggestion: t(locale, "请在 plan.md 中补充 Risks/风险 章节。", "Add a Risks section to plan.md.")
    },
    {
      sectionId: "acceptance",
      ruleId: "process-plan-must-state-scope",
      passMessage: t(locale, "plan 已包含验收标准章节。", "Plan contains an acceptance section."),
      missingMessage: t(locale, "plan 缺少必需章节：acceptance。", "Plan is missing the required acceptance section."),
      suggestion: t(locale, "请在 plan.md 中补充 Acceptance/验收标准 章节。", "Add an Acceptance section to plan.md.")
    },
    {
      sectionId: "verificationPath",
      ruleId: "quality-verification-before-delivery",
      passMessage: t(locale, "plan 已包含验证路径章节。", "Plan contains a verification path section."),
      missingMessage: t(
        locale,
        "plan 缺少必需章节：verificationPath。",
        "Plan is missing the required verificationPath section."
      ),
      suggestion: t(
        locale,
        "请在 plan.md 中补充 Verification Path/验证路径，并写明验证步骤。",
        "Add a Verification Path section to plan.md with the intended validation steps."
      )
    }
  ];

  for (const { sectionId, ruleId, passMessage, missingMessage, suggestion } of requiredSections) {
    if (hasAnyPattern(content, (PLAN_SECTION_PATTERNS as Record<string, RegExp[]>)[sectionId])) {
      findings.push(
        createFinding({
          id: `check.plan.section.${sectionId}`,
          stageId: "plan",
          ruleId,
          severity: "info",
          status: "pass",
          message: passMessage,
          target
        })
      );
      continue;
    }

    findings.push(
      createFinding({
        id: `check.plan.section.${sectionId}`,
        stageId: "plan",
        ruleId,
        severity: "error",
        status: "fail",
        message: missingMessage,
        target,
        suggestion
      })
    );
  }

  const stageResult = createStageResult(
    "plan",
    matchedRules,
    findings,
    t(locale, "计划结构满足当前治理规则。", "Plan structure satisfies the current governance rules."),
    t(
      locale,
      "计划结构未满足当前治理规则。",
      "Plan structure does not satisfy the current governance rules."
    )
  );

  stageResult.details.slots = buildSlotStageDetails(stageContext);
  return stageResult;
}

function validateBreakdownStage(runState: AnyRecord, stageContext: AnyRecord): AnyRecord {
  const locale = runState.locale;
  const checklistTarget = toRelativePath(runState.cwd, runState.artifactPaths.checklistFile);
  const csvTarget = toRelativePath(runState.cwd, runState.artifactPaths.taskCsvFile);
  const matchedRules = getStageRules(
    runState.standardsPackage,
    "breakdown",
    runState.resolvedConfig.config.standards.locales.default
  );
  const findings: CheckFinding[] = [];

  if (!fs.existsSync(runState.artifactPaths.checklistFile)) {
    findings.push(
      createFinding({
        id: "check.breakdown.checklist-file",
        stageId: "breakdown",
        ruleId: "process-task-records-must-sync",
        severity: "error",
        status: "fail",
        message: t(locale, "未找到 checklist 文件。", "Checklist file is missing."),
        target: checklistTarget,
        suggestion: t(
          locale,
          "请在运行 check 之前生成或恢复 tasks/checklist.md。",
          "Generate or restore tasks/checklist.md before running check."
        )
      })
    );
  }

  if (!fs.existsSync(runState.artifactPaths.taskCsvFile)) {
    findings.push(
      createFinding({
        id: "check.breakdown.csv-file",
        stageId: "breakdown",
        ruleId: "process-task-records-must-sync",
        severity: "error",
        status: "fail",
        message: t(locale, "未找到 tasks.csv。", "tasks.csv is missing."),
        target: csvTarget,
        suggestion: t(
          locale,
          "请在运行 check 之前生成或恢复 tasks/tasks.csv。",
          "Generate or restore tasks/tasks.csv before running check."
        )
      })
    );
  }

  const taskFileIds = listTaskFileIds(runState.artifactPaths.tasksRoot);

  if (taskFileIds.size === 0) {
    findings.push(
      createFinding({
        id: "check.breakdown.task-files",
        stageId: "breakdown",
        ruleId: "process-task-records-must-sync",
        severity: "error",
        status: "fail",
        message: t(locale, "在 tasks/ 下未找到任务卡文件。", "No task card files were found under tasks/."),
        target: toRelativePath(runState.cwd, runState.artifactPaths.tasksRoot),
        suggestion: t(
          locale,
          "请先生成任务卡，确保 checklist、CSV 与任务文件可保持一致。",
          "Generate task cards so checklist, CSV, and task files can stay aligned."
        )
      })
    );
  }

  if (findings.some((finding) => finding.severity === "error")) {
    const stageResult = createStageResult(
      "breakdown",
      matchedRules,
      findings,
      t(locale, "任务拆解产物已同步。", "Breakdown artifacts are in sync."),
      t(locale, "任务拆解产物缺少必需记录。", "Breakdown artifacts are missing required task records.")
    );

    stageResult.details.slots = buildSlotStageDetails(stageContext);
    return stageResult;
  }

  const checklistTaskIds = extractTaskIds(readTextFile(runState.artifactPaths.checklistFile));
  const csvTaskIds = extractTaskIds(readTextFile(runState.artifactPaths.taskCsvFile));
  const idsInSync =
    checklistTaskIds.size > 0 &&
    compareTaskIdSets(checklistTaskIds, csvTaskIds) &&
    compareTaskIdSets(checklistTaskIds, taskFileIds);

  if (!idsInSync) {
    findings.push(
      createFinding({
        id: "check.breakdown.task-id-sync",
        stageId: "breakdown",
        ruleId: "process-task-records-must-sync",
        severity: "error",
        status: "fail",
        message: t(
          locale,
          "checklist、CSV 与任务文件引用的任务编号不一致。",
          "Checklist, CSV, and task files do not reference the same task IDs."
        ),
        target: `${checklistTarget}, ${csvTarget}`,
        suggestion: t(
          locale,
          "请同步 checklist.md、tasks.csv 与 tasks/TK-xxx.md，使其引用相同任务编号。",
          "Resync checklist.md, tasks.csv, and tasks/TK-xxx.md so they reference the same task IDs."
        )
      })
    );
  } else {
    findings.push(
      createFinding({
        id: "check.breakdown.task-id-sync",
        stageId: "breakdown",
        ruleId: "process-task-records-must-sync",
        severity: "info",
        status: "pass",
        message: t(
          locale,
          "checklist、CSV 与任务文件引用的任务编号一致。",
          "Checklist, CSV, and task files reference the same task IDs."
        ),
        target: `${checklistTarget}, ${csvTarget}`
      })
    );
  }

  const stageResult = createStageResult(
    "breakdown",
    matchedRules,
    findings,
    t(locale, "任务拆解产物已保持同步。", "Breakdown artifacts are synchronized."),
    t(locale, "任务拆解产物未保持同步。", "Breakdown artifacts are not synchronized.")
  );

  stageResult.details.slots = buildSlotStageDetails(stageContext);
  return stageResult;
}

function validateSelfCheckStage(runState: AnyRecord, stageContext: AnyRecord): AnyRecord {
  const locale = runState.locale;
  const checklistTarget = toRelativePath(runState.cwd, runState.artifactPaths.checklistFile);
  const csvTarget = toRelativePath(runState.cwd, runState.artifactPaths.taskCsvFile);
  const matchedRules = getStageRules(
    runState.standardsPackage,
    "self-check",
    runState.resolvedConfig.config.standards.locales.default
  );
  const findings: CheckFinding[] = [];

  const checklistContent = readTextFile(runState.artifactPaths.checklistFile);
  const csvContent = readTextFile(runState.artifactPaths.taskCsvFile);
  const csvLines = csvContent.trim().split(/\r?\n/);
  const csvHeader = csvLines[0]?.split(",") ?? [];

  if (/Execution log:|执行记录：/m.test(checklistContent)) {
    findings.push(
      createFinding({
        id: "check.self-check.execution-log",
        stageId: "self-check",
        ruleId: "quality-check-results-must-be-recorded",
        severity: "info",
        status: "pass",
        message: t(locale, "checklist 已包含执行记录。", "Checklist contains execution log records."),
        target: checklistTarget
      })
    );
  } else {
    findings.push(
      createFinding({
        id: "check.self-check.execution-log",
        stageId: "self-check",
        ruleId: "quality-check-results-must-be-recorded",
        severity: "error",
        status: "fail",
        message: t(locale, "checklist 未包含执行记录。", "Checklist does not contain execution log records."),
        target: checklistTarget,
        suggestion: t(
          locale,
          "请在 checklist.md 每个任务条目下追加执行记录。",
          "Append execution records under each task entry in checklist.md."
        )
      })
    );
  }

  if (runState.artifactPaths.csvColumns.every((column: string) => csvHeader.includes(column))) {
    findings.push(
      createFinding({
        id: "check.self-check.csv-columns",
        stageId: "self-check",
        ruleId: "quality-check-results-must-be-recorded",
        severity: "info",
        status: "pass",
        message: t(
          locale,
          "tasks.csv 已包含预期的治理台账字段。",
          "tasks.csv contains the expected governance ledger columns."
        ),
        target: csvTarget
      })
    );
  } else {
    findings.push(
      createFinding({
        id: "check.self-check.csv-columns",
        stageId: "self-check",
        ruleId: "quality-check-results-must-be-recorded",
        severity: "error",
        status: "fail",
        message: t(
          locale,
          "tasks.csv 缺少一个或多个预期治理台账字段。",
          "tasks.csv is missing one or more expected governance ledger columns."
        ),
        target: csvTarget,
        suggestion: t(
          locale,
          "请恢复标准 tasks.csv 表头，确保 verify 与 review_delta 字段存在。",
          "Restore the standard tasks.csv header so verify and review_delta fields are present."
        )
      })
    );
  }

  if (csvLines.length > 1) {
    findings.push(
      createFinding({
        id: "check.self-check.csv-rows",
        stageId: "self-check",
        ruleId: "quality-check-results-must-be-recorded",
        severity: "info",
        status: "pass",
        message: t(locale, "tasks.csv 已包含执行记录行。", "tasks.csv contains execution rows."),
        target: csvTarget
      })
    );
  } else {
    findings.push(
      createFinding({
        id: "check.self-check.csv-rows",
        stageId: "self-check",
        ruleId: "quality-check-results-must-be-recorded",
        severity: "error",
        status: "fail",
        message: t(locale, "tasks.csv 尚未包含任何执行记录行。", "tasks.csv does not contain any execution rows."),
        target: csvTarget,
        suggestion: t(
          locale,
          "请至少在 tasks.csv 追加一条执行记录行。",
          "Append at least one execution record row to tasks.csv."
        )
      })
    );
  }

  if (runState.changedOnly) {
    findings.push(
      createFinding({
        id: "check.self-check.changed-only",
        stageId: "self-check",
        severity: "warning",
        status: "warn",
        message:
          t(
            locale,
            "changed-only 模式在 MVP 阶段会回退为全量 sprint 产物扫描。",
            "changed-only mode currently falls back to the full sprint artifact scan in MVP."
          ),
        target: toRelativePath(runState.cwd, runState.artifactPaths.sprintRoot),
        suggestion: t(
          locale,
          "请将本次结果视为全量治理扫描；changed-only 精确过滤将在后续迭代提供。",
          "Treat this run as a full governance scan; changed-only filtering lands in a later iteration."
        )
      })
    );
  }

  const stageResult = createStageResult(
    "self-check",
    matchedRules,
    findings,
    t(locale, "执行记录满足最小治理检查要求。", "Execution records satisfy the minimum governance checks."),
    t(
      locale,
      "执行记录未满足最小治理检查要求。",
      "Execution records do not satisfy the minimum governance checks."
    )
  );

  stageResult.details.slots = buildSlotStageDetails(stageContext);
  return stageResult;
}

function flattenWorkflowFindings(workflowResult: AnyRecord, locale: string): CheckFinding[] {
  const findings: CheckFinding[] = workflowResult.stages.flatMap(
    (stageResult: AnyRecord) => stageResult.details?.findings ?? [],
  );

  if (workflowResult.status === "failed" && workflowResult.failure) {
    findings.push(
      createFinding({
        id: `check.workflow.${workflowResult.failure.stageId}`,
        stageId: workflowResult.failure.stageId,
        severity: "error",
        status: "fail",
        message: workflowResult.failure.message,
        target: workflowResult.failure.stageId,
        suggestion: t(locale, "请先修复该阶段失败原因后再重新执行 check。", "Resolve the stage-level workflow failure before rerunning check.")
      })
    );
  }

  return findings;
}

function renderWorkflowStage(stageResult: AnyRecord): AnyRecord {
  return {
    id: stageResult.id,
    status: stageResult.status,
    summary: stageResult.summary,
    blockedBy: stageResult.blockedBy,
    matchedRules: stageResult.details?.matchedRules ?? [],
    slots: {
      active: stageResult.details?.slots?.activeSlots ?? [],
      blocked: stageResult.details?.slots?.blockedSlots ?? [],
      suppressed: stageResult.details?.slots?.suppressedSlots ?? [],
      injections: stageResult.details?.slots?.injections ?? {
        aiPromptKeys: [],
        humanDocSections: []
      }
    }
  };
}

function buildCheckPayload(
  runState: AnyRecord,
  workflowResult: AnyRecord,
  summary: AnyRecord,
  reportFilePath: string | null = null,
): AnyRecord {
  return {
    command: "check",
    status: summary.status,
    locale: runState.locale,
    cwd: runState.cwd,
    configFile: runState.resolvedConfig.paths.configFile,
    currentProject: runState.resolvedConfig.config.execution.currentProject,
    currentSprint: runState.resolvedConfig.config.execution.currentSprint,
    selectedStage: runState.selectedStage,
    changedOnly: runState.changedOnly,
    writeReport: runState.writeReport,
    workflow: {
      status: workflowResult.status,
      selectedStageIds: workflowResult.selectedStageIds,
      summary: workflowResult.summary,
      stages: workflowResult.stages.map(renderWorkflowStage)
    },
    standards: {
      preset: runState.standardsPackage.meta.preset,
      totalRules: runState.standardsPackage.rules.length,
      matchedRuleIds: Array.from(
        new Set(
          workflowResult.stages.flatMap((stageResult: AnyRecord) =>
            (stageResult.details?.matchedRules ?? []).map((rule: AnyRecord) => rule.id),
          )
        )
      )
    },
    summary,
    checks: flattenWorkflowFindings(workflowResult, runState.locale),
    reportFile: reportFilePath ? toRelativePath(runState.cwd, reportFilePath) : null
  };
}

function writeCheckSummary(logger: Logger, payload: AnyRecord, format: string): void {
  const locale = normalizeLocale(payload.locale);

  if (format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (format === "markdown") {
    logger.raw(
      [
        "# check",
        "",
        `- ${t(locale, "状态", "Status")}: ${payload.status}`,
        `- ${t(locale, "项目", "Project")}: \`${payload.currentProject}\``,
        `- Sprint: \`${payload.currentSprint}\``,
        `- ${t(locale, "选定阶段", "Selected stage")}: \`${payload.selectedStage}\``,
        `- ${t(locale, "流程", "Workflow")}: \`${JSON.stringify(payload.workflow.summary)}\``,
        `- ${t(locale, "命中规则", "Matched rules")}: \`${JSON.stringify(payload.standards.matchedRuleIds)}\``,
        `- ${t(locale, "发现", "Findings")}: \`${JSON.stringify(payload.checks)}\``
      ].join("\n"),
      { ignoreQuiet: true }
    );
    return;
  }

  if (payload.status === "pass") {
    logger.success(t(locale, "治理检查通过", "governance checks passed"));
  } else if (payload.status === "warn") {
    logger.warn(t(locale, "治理检查完成（含告警）", "governance checks completed with warnings"));
  } else {
    logger.error(t(locale, "治理检查失败", "governance checks failed"));
  }

  logger.keyValue(t(locale, "项目", "Project"), payload.currentProject);
  logger.keyValue("Sprint", payload.currentSprint);
  logger.keyValue(t(locale, "选定阶段", "Selected stage"), payload.selectedStage);
  logger.keyValue(t(locale, "流程摘要", "Workflow summary"), JSON.stringify(payload.workflow.summary));
  logger.keyValue(t(locale, "命中规则", "Matched rules"), JSON.stringify(payload.standards.matchedRuleIds));

  for (const stage of payload.workflow.stages) {
    logger.keyValue(`Stage ${stage.id}`, `${stage.status}: ${stage.summary ?? ""}`.trim());
  }

  for (const finding of payload.checks) {
    const message = `${finding.id}: ${finding.message} [${finding.target}]`;

    if (finding.severity === "error") {
      logger.error(message);
      continue;
    }

    if (finding.severity === "warning") {
      logger.warn(message);
      continue;
    }

    logger.info(message);
  }

  if (payload.reportFile) {
    logger.keyValue(t(locale, "报告文件", "Report file"), payload.reportFile);
  }
}

function buildReportContent(payload: AnyRecord, format: string): string {
  const report = buildUnifiedReport(payload);
  return renderUnifiedReport(report, format as any);
}

function writeReportFile(runState: AnyRecord, payload: AnyRecord, format: string): string {
  const outputDir = runState.resolvedConfig.config.reporting.outputDir;
  const reportFileName = runState.resolvedConfig.config.reporting.fileNames?.[format] ??
    runState.resolvedConfig.config.reporting.fileNames?.summary ??
    "latest.txt";
  const reportFilePath = path.resolve(runState.cwd, outputDir, reportFileName);

  fs.mkdirSync(path.dirname(reportFilePath), { recursive: true });
  fs.writeFileSync(reportFilePath, buildReportContent(payload, format as any), "utf8");
  return reportFilePath;
}

function createCheckHandlers(runState: AnyRecord): AnyRecord {
  return {
    plan: (stageContext: AnyRecord) => validatePlanStage(runState, stageContext),
    breakdown: (stageContext: AnyRecord) => validateBreakdownStage(runState, stageContext),
    "self-check": (stageContext: AnyRecord) => validateSelfCheckStage(runState, stageContext),
  };
}

export async function executeCheckCommand(
  commandContext: CommandContext,
  logger: Logger,
): Promise<number> {
  const runState = buildCheckRun(commandContext);
  const workflowResult = await executeWorkflow({
    template: CHECK_WORKFLOW_TEMPLATE as unknown as ExecuteWorkflowOptions["template"],
    targetStages: [runState.selectedStage],
    handlers: createCheckHandlers(runState) as ExecuteWorkflowOptions["handlers"],
    slotRuntime: runState.slotRuntime,
    metadata: {
      command: "check",
      changedOnly: runState.changedOnly,
      currentProject: runState.resolvedConfig.config.execution.currentProject,
      language: runState.resolvedConfig.config.project.language,
      framework: runState.resolvedConfig.config.project.framework
    }
  });
  const summary = summarizeFindings(flattenWorkflowFindings(workflowResult, runState.locale));
  const format = commandContext.format;
  let payload = buildCheckPayload(runState, workflowResult, summary);

  if (runState.writeReport) {
    const reportFilePath = writeReportFile(runState, payload, format);
    payload = buildCheckPayload(runState, workflowResult, summary, reportFilePath);
  }

  writeCheckSummary(logger, payload, format);
  return summary.exitCode;
}
