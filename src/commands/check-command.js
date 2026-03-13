import fs from "node:fs";
import path from "node:path";
import { loadResolvedConfig } from "../config/load-config.js";
import { DEFAULT_TASK_CSV_COLUMNS } from "../config/repository-layout.js";
import { ConfigError, InputError } from "../cli/runtime/errors.js";
import { EXIT_CODES } from "../cli/runtime/exit-codes.js";
import {
  listRulesForConsumer,
  renderRulesForConsumer,
  resolveStandardsPackage
} from "../standards/official-base-package.js";
import { executeWorkflow } from "../workflow/governance-engine.js";

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
  goal: [/^##\s+Goal\b/m, /^##\s+目标\b/m],
  inScope: [/^##\s+In Scope\b/m, /^##\s+纳入范围\b/m],
  outOfScope: [/^##\s+Out Of Scope\b/m, /^##\s+非范围\b/m],
  risks: [/^##\s+Risks\b/m, /^##\s+风险\b/m],
  acceptance: [/^##\s+Acceptance\b/m, /^##\s+验收标准\b/m],
  verificationPath: [/^##\s+Verification Path\b/m, /^##\s+验证路径\b/m]
});

function toRelativePath(cwd, absolutePath) {
  const relativePath = path.relative(cwd, absolutePath).split(path.sep).join("/");
  return relativePath || ".";
}

function createFinding(options) {
  return {
    id: options.id,
    stageId: options.stageId,
    ruleId: options.ruleId ?? null,
    severity: options.severity ?? "info",
    status: options.status ?? (options.severity === "error" ? "fail" : "pass"),
    message: options.message,
    target: options.target,
    suggestion: options.suggestion ?? null
  };
}

function summarizeFindings(findings) {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  const status = errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass";

  return {
    status,
    exitCode: errors > 0 ? EXIT_CODES.businessCheckFailed : EXIT_CODES.success,
    errors,
    warnings,
    passed: findings.filter((finding) => finding.status === "pass").length
  };
}

function readTextFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function hasAnyPattern(content, patterns) {
  return patterns.some((pattern) => pattern.test(content));
}

function extractTaskIds(content) {
  return new Set(String(content).match(/TK-\d{3}/g) ?? []);
}

function listTaskFileIds(tasksRoot) {
  if (!fs.existsSync(tasksRoot)) {
    return new Set();
  }

  return new Set(
    fs.readdirSync(tasksRoot)
      .filter((entry) => /^TK-\d{3}\.md$/.test(entry))
      .map((entry) => entry.replace(/\.md$/, ""))
  );
}

function compareTaskIdSets(left, right) {
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

function buildArtifactPaths(cwd, resolvedConfig) {
  const currentProject = resolvedConfig.config.execution.currentProject;
  const currentSprint = resolvedConfig.config.execution.currentSprint;

  if (!currentProject || !currentSprint) {
    throw new ConfigError("Check command requires a current project and sprint", {
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

function buildCheckRun(commandContext) {
  const cwd = path.resolve(commandContext.globalOptions.cwd ?? process.cwd());
  const resolvedConfig = loadResolvedConfig({
    cwd,
    configPath: commandContext.globalOptions.config,
    cliOverrides: {
      ...commandContext.globalOptions,
      ...commandContext.commandOptions
    }
  });
  const artifactPaths = buildArtifactPaths(cwd, resolvedConfig);
  const standardsPackage = resolveStandardsPackage(resolvedConfig.config.standards);
  const selectedStage = commandContext.commandOptions.stage ?? "self-check";

  if (!CHECK_WORKFLOW_TEMPLATE.stages.some((stage) => stage.id === selectedStage)) {
    throw new InputError(`Unsupported check stage: ${selectedStage}`, {
      code: "cli.check_invalid_stage",
      details: {
        stage: selectedStage,
        supportedStages: CHECK_WORKFLOW_TEMPLATE.stages.map((stage) => stage.id)
      }
    });
  }

  return {
    cwd,
    selectedStage,
    resolvedConfig,
    standardsPackage,
    artifactPaths,
    changedOnly: commandContext.commandOptions.changedOnly === true,
    writeReport: commandContext.commandOptions.writeReport === true
  };
}

function getStageRules(standardsPackage, stageId, locale) {
  const ruleIds = new Set(STAGE_RULE_IDS[stageId] ?? []);
  const matchingRules = listRulesForConsumer(standardsPackage, "check").filter((rule) =>
    ruleIds.has(rule.id)
  );

  return matchingRules.map((rule) => ({
    id: rule.id,
    level: rule.level,
    ...renderRulesForConsumer(
      {
        ...standardsPackage,
        rules: [rule]
      },
      "check",
      {
        view: "human",
        locale
      }
    )[0]
  }));
}

function createStageResult(stageId, matchedRules, findings, successMessage, failureMessage) {
  const errors = findings.filter((finding) => finding.severity === "error");

  return {
    status: errors.length > 0 ? "failed" : "passed",
    summary: errors.length > 0 ? failureMessage : successMessage,
    details: {
      matchedRules,
      findings
    }
  };
}

function validatePlanStage(runState) {
  const target = toRelativePath(runState.cwd, runState.artifactPaths.planFile);
  const matchedRules = getStageRules(
    runState.standardsPackage,
    "plan",
    runState.resolvedConfig.config.standards.locales.default
  );
  const findings = [];

  if (!fs.existsSync(runState.artifactPaths.planFile)) {
    findings.push(
      createFinding({
        id: "check.plan.file",
        stageId: "plan",
        severity: "error",
        status: "fail",
        message: "Sprint plan file is missing.",
        target,
        suggestion: "Run `repo-ai-governor plan` before running the governance check."
      })
    );

    return createStageResult(
      "plan",
      matchedRules,
      findings,
      "Plan checks passed.",
      "Plan checks failed because the sprint plan is missing."
    );
  }

  const content = readTextFile(runState.artifactPaths.planFile);
  const requiredSections = [
    ["goal", "process-plan-must-state-scope", "Plan contains a goal section.", "Add a Goal section to plan.md."],
    ["inScope", "process-plan-must-state-scope", "Plan contains an in-scope section.", "Add an In Scope section to plan.md."],
    ["outOfScope", "process-plan-must-state-scope", "Plan contains an out-of-scope section.", "Add an Out Of Scope section to plan.md."],
    ["risks", "process-plan-must-state-scope", "Plan contains a risks section.", "Add a Risks section to plan.md."],
    ["acceptance", "process-plan-must-state-scope", "Plan contains an acceptance section.", "Add an Acceptance section to plan.md."],
    ["verificationPath", "quality-verification-before-delivery", "Plan contains a verification path section.", "Add a Verification Path section to plan.md with the intended validation steps."]
  ];

  for (const [sectionId, ruleId, passMessage, suggestion] of requiredSections) {
    if (hasAnyPattern(content, PLAN_SECTION_PATTERNS[sectionId])) {
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
        message: `Plan is missing the required ${sectionId} section.`,
        target,
        suggestion
      })
    );
  }

  return createStageResult(
    "plan",
    matchedRules,
    findings,
    "Plan structure satisfies the current governance rules.",
    "Plan structure does not satisfy the current governance rules."
  );
}

function validateBreakdownStage(runState) {
  const checklistTarget = toRelativePath(runState.cwd, runState.artifactPaths.checklistFile);
  const csvTarget = toRelativePath(runState.cwd, runState.artifactPaths.taskCsvFile);
  const matchedRules = getStageRules(
    runState.standardsPackage,
    "breakdown",
    runState.resolvedConfig.config.standards.locales.default
  );
  const findings = [];

  if (!fs.existsSync(runState.artifactPaths.checklistFile)) {
    findings.push(
      createFinding({
        id: "check.breakdown.checklist-file",
        stageId: "breakdown",
        ruleId: "process-task-records-must-sync",
        severity: "error",
        status: "fail",
        message: "Checklist file is missing.",
        target: checklistTarget,
        suggestion: "Generate or restore tasks/checklist.md before running check."
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
        message: "tasks.csv is missing.",
        target: csvTarget,
        suggestion: "Generate or restore tasks/tasks.csv before running check."
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
        message: "No task card files were found under tasks/.",
        target: toRelativePath(runState.cwd, runState.artifactPaths.tasksRoot),
        suggestion: "Generate task cards so checklist, CSV, and task files can stay aligned."
      })
    );
  }

  if (findings.some((finding) => finding.severity === "error")) {
    return createStageResult(
      "breakdown",
      matchedRules,
      findings,
      "Breakdown artifacts are in sync.",
      "Breakdown artifacts are missing required task records."
    );
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
        message: "Checklist, CSV, and task files do not reference the same task IDs.",
        target: `${checklistTarget}, ${csvTarget}`,
        suggestion: "Resync checklist.md, tasks.csv, and tasks/TK-xxx.md so they reference the same task IDs."
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
        message: "Checklist, CSV, and task files reference the same task IDs.",
        target: `${checklistTarget}, ${csvTarget}`
      })
    );
  }

  return createStageResult(
    "breakdown",
    matchedRules,
    findings,
    "Breakdown artifacts are synchronized.",
    "Breakdown artifacts are not synchronized."
  );
}

function validateSelfCheckStage(runState) {
  const checklistTarget = toRelativePath(runState.cwd, runState.artifactPaths.checklistFile);
  const csvTarget = toRelativePath(runState.cwd, runState.artifactPaths.taskCsvFile);
  const matchedRules = getStageRules(
    runState.standardsPackage,
    "self-check",
    runState.resolvedConfig.config.standards.locales.default
  );
  const findings = [];

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
        message: "Checklist contains execution log records.",
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
        message: "Checklist does not contain execution log records.",
        target: checklistTarget,
        suggestion: "Append execution records under each task entry in checklist.md."
      })
    );
  }

  if (runState.artifactPaths.csvColumns.every((column) => csvHeader.includes(column))) {
    findings.push(
      createFinding({
        id: "check.self-check.csv-columns",
        stageId: "self-check",
        ruleId: "quality-check-results-must-be-recorded",
        severity: "info",
        status: "pass",
        message: "tasks.csv contains the expected governance ledger columns.",
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
        message: "tasks.csv is missing one or more expected governance ledger columns.",
        target: csvTarget,
        suggestion: "Restore the standard tasks.csv header so verify and review_delta fields are present."
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
        message: "tasks.csv contains execution rows.",
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
        message: "tasks.csv does not contain any execution rows.",
        target: csvTarget,
        suggestion: "Append at least one execution record row to tasks.csv."
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
          "changed-only mode currently falls back to the full sprint artifact scan in MVP.",
        target: toRelativePath(runState.cwd, runState.artifactPaths.sprintRoot),
        suggestion: "Treat this run as a full governance scan; changed-only filtering lands in a later iteration."
      })
    );
  }

  return createStageResult(
    "self-check",
    matchedRules,
    findings,
    "Execution records satisfy the minimum governance checks.",
    "Execution records do not satisfy the minimum governance checks."
  );
}

function flattenWorkflowFindings(workflowResult) {
  return workflowResult.stages.flatMap((stageResult) => stageResult.details?.findings ?? []);
}

function renderWorkflowStage(stageResult) {
  return {
    id: stageResult.id,
    status: stageResult.status,
    summary: stageResult.summary,
    blockedBy: stageResult.blockedBy,
    matchedRules: stageResult.details?.matchedRules ?? []
  };
}

function buildCheckPayload(runState, workflowResult, summary, reportFilePath = null) {
  return {
    command: "check",
    status: summary.status,
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
          workflowResult.stages.flatMap((stageResult) =>
            (stageResult.details?.matchedRules ?? []).map((rule) => rule.id)
          )
        )
      )
    },
    summary,
    checks: flattenWorkflowFindings(workflowResult),
    reportFile: reportFilePath ? toRelativePath(runState.cwd, reportFilePath) : null
  };
}

function writeCheckSummary(logger, payload, format) {
  if (format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (format === "markdown") {
    logger.raw(
      [
        "# check",
        "",
        `- Status: ${payload.status}`,
        `- Project: \`${payload.currentProject}\``,
        `- Sprint: \`${payload.currentSprint}\``,
        `- Selected stage: \`${payload.selectedStage}\``,
        `- Workflow: \`${JSON.stringify(payload.workflow.summary)}\``,
        `- Matched rules: \`${JSON.stringify(payload.standards.matchedRuleIds)}\``,
        `- Findings: \`${JSON.stringify(payload.checks)}\``
      ].join("\n"),
      { ignoreQuiet: true }
    );
    return;
  }

  if (payload.status === "pass") {
    logger.success("governance checks passed");
  } else if (payload.status === "warn") {
    logger.warn("governance checks completed with warnings");
  } else {
    logger.error("governance checks failed");
  }

  logger.keyValue("Project", payload.currentProject);
  logger.keyValue("Sprint", payload.currentSprint);
  logger.keyValue("Selected stage", payload.selectedStage);
  logger.keyValue("Workflow summary", JSON.stringify(payload.workflow.summary));
  logger.keyValue("Matched rules", JSON.stringify(payload.standards.matchedRuleIds));

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
    logger.keyValue("Report file", payload.reportFile);
  }
}

function buildReportContent(payload, format) {
  if (format === "json") {
    return `${JSON.stringify(payload, null, 2)}\n`;
  }

  if (format === "markdown") {
    return [
      "# check",
      "",
      `- Status: ${payload.status}`,
      `- Project: \`${payload.currentProject}\``,
      `- Sprint: \`${payload.currentSprint}\``,
      `- Selected stage: \`${payload.selectedStage}\``,
      "",
      "## Workflow",
      "",
      ...payload.workflow.stages.map(
        (stage) => `- \`${stage.id}\`: ${stage.status} - ${stage.summary ?? ""}`.trim()
      ),
      "",
      "## Findings",
      "",
      ...payload.checks.map(
        (finding) =>
          `- [${finding.severity}] \`${finding.id}\` ${finding.message} (\`${finding.target}\`)`
      )
    ].join("\n") + "\n";
  }

  return [
    `status=${payload.status}`,
    `project=${payload.currentProject}`,
    `sprint=${payload.currentSprint}`,
    `selected_stage=${payload.selectedStage}`,
    `workflow=${JSON.stringify(payload.workflow.summary)}`,
    `matched_rules=${payload.standards.matchedRuleIds.join(",")}`,
    ...payload.checks.map(
      (finding) => `${finding.severity}:${finding.id}:${finding.message}:${finding.target}`
    )
  ].join("\n") + "\n";
}

function writeReportFile(runState, payload, format) {
  const outputDir = runState.resolvedConfig.config.reporting.outputDir;
  const reportFileName = runState.resolvedConfig.config.reporting.fileNames?.[format] ??
    runState.resolvedConfig.config.reporting.fileNames?.summary ??
    "latest.txt";
  const reportFilePath = path.resolve(runState.cwd, outputDir, reportFileName);

  fs.mkdirSync(path.dirname(reportFilePath), { recursive: true });
  fs.writeFileSync(reportFilePath, buildReportContent(payload, format), "utf8");
  return reportFilePath;
}

function createCheckHandlers(runState) {
  return {
    plan: () => validatePlanStage(runState),
    breakdown: () => validateBreakdownStage(runState),
    "self-check": () => validateSelfCheckStage(runState)
  };
}

export async function executeCheckCommand(commandContext, logger) {
  const runState = buildCheckRun(commandContext);
  const workflowResult = await executeWorkflow({
    template: CHECK_WORKFLOW_TEMPLATE,
    targetStages: [runState.selectedStage],
    handlers: createCheckHandlers(runState),
    metadata: {
      command: "check",
      changedOnly: runState.changedOnly
    }
  });
  const summary = summarizeFindings(flattenWorkflowFindings(workflowResult));
  const format = commandContext.format;
  let payload = buildCheckPayload(runState, workflowResult, summary);

  if (runState.writeReport) {
    const reportFilePath = writeReportFile(runState, payload, format);
    payload = buildCheckPayload(runState, workflowResult, summary, reportFilePath);
  }

  writeCheckSummary(logger, payload, format);
  return summary.exitCode;
}
