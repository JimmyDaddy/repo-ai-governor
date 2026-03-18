import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ConfigError, InputError } from "../cli/runtime/errors.js";
import { EXIT_CODES } from "../cli/runtime/exit-codes.js";
import { loadResolvedConfig } from "../config/load-config.js";
import {
  DEFAULT_TASK_CSV_COLUMNS,
  createReviewFileName,
  createReviewSlug,
} from "../config/repository-layout.js";
import { LocaleEnum } from "../constants/locale.js";
import {
  renderRulesForConsumer,
  resolveStandardsPackage,
} from "../standards/official-base-package.js";
import type { AnyRecord } from "../types/aliases/index.js";
import type { CommandContext } from "../types/interfaces/cli-runtime.interface.js";
import type { Logger } from "../types/interfaces/cli-ui.interface.js";
import type {
  ReviewAnalysis,
  ReviewArtifactPaths,
  ReviewFinding,
  ReviewLifecycle,
  ReviewPayload,
  ReviewRuleView,
  ReviewRunState,
  ReviewSummary,
  ReviewWorkflowResult,
  ReviewWorkflowStage,
} from "../types/interfaces/command-review.interface.js";
import {
  normalizeLocale,
  toRelativePath as toRelativePathValue,
  translateLocale,
} from "../utils/common.js";
import type { ExecuteWorkflowOptions } from "../workflow/governance-engine.js";
import { executeWorkflow } from "../workflow/governance-engine.js";

const REVIEW_WORKFLOW_TEMPLATE = Object.freeze({
  id: "governance-review",
  version: "1",
  kind: "workflow-template",
  meta: {
    name: {
      "zh-CN": "治理评审流程",
      "en-US": "Governance Review Flow",
    },
    description: {
      "zh-CN": "用于按当前规范对改动范围生成最小 review 结论和 CR 记录。",
      "en-US":
        "Generates a minimal governance review conclusion and CR record for the selected change scope.",
    },
  },
  execution: {
    mode: "serial",
    allowSkipStages: false,
    stopOnFailure: true,
  },
  stages: [
    {
      id: "review",
      name: {
        "zh-CN": "评审阶段",
        "en-US": "Review Stage",
      },
      description: {
        "zh-CN": "根据 review 规范对目标范围生成发现与结论。",
        "en-US":
          "Produces findings and a conclusion against the review-facing governance standards.",
      },
      executor: {
        kind: "internal",
        ref: "run-review",
      },
    },
  ],
});

const TEXT_FILE_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".yaml",
  ".yml",
  ".txt",
]);
const SOURCE_FILE_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);
const TODO_PATTERN = /\b(TODO|FIXME|HACK)\b/;

function getStringOption(options: Record<string, unknown>, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" ? value : undefined;
}

export function toRelativePath(cwd: string, absolutePath: string): string {
  return toRelativePathValue(cwd, absolutePath);
}

function ensureTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function formatDateTime(date: Date = new Date()): string {
  return date.toISOString();
}

function isEnglishLocale(locale: string | null | undefined): boolean {
  return normalizeLocale(locale) === "en-US";
}

function t(locale: string | null | undefined, zhCN: string, enUS: string): string {
  return translateLocale(locale, zhCN, enUS);
}

function createFinding(options: AnyRecord): ReviewFinding {
  return {
    id: options.id,
    ruleId: options.ruleId ?? null,
    severity: options.severity ?? "info",
    status: options.status ?? (options.severity === "error" ? "fail" : "pass"),
    message: options.message,
    target: options.target,
    suggestion: options.suggestion ?? null,
  };
}

export function summarizeFindings(
  findings: ReviewFinding[],
  options: AnyRecord = {},
): ReviewSummary {
  const errors = findings.filter((finding: ReviewFinding) => finding.severity === "error").length;
  const warnings = findings.filter(
    (finding: ReviewFinding) => finding.severity === "warning",
  ).length;
  const failOnWarnings = options.failOnWarnings === true;
  const status = errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass";
  const shouldFail = errors > 0 || (failOnWarnings && warnings > 0);

  return {
    status,
    exitCode: shouldFail ? EXIT_CODES.businessCheckFailed : EXIT_CODES.success,
    errors,
    warnings,
    passed: findings.filter((finding: ReviewFinding) => finding.status === "pass").length,
  };
}

function collectFilesRecursively(targetPath: string, files: string[] = []): string[] {
  const stat = fs.statSync(targetPath);

  if (stat.isFile()) {
    files.push(targetPath);
    return files;
  }

  if (!stat.isDirectory()) {
    return files;
  }

  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    collectFilesRecursively(path.join(targetPath, entry.name), files);
  }

  return files;
}

export function collectPathTargets(cwd: string, targetPath: string, locale = "zh-CN"): string[] {
  const absoluteTargetPath = path.resolve(cwd, targetPath);

  if (!fs.existsSync(absoluteTargetPath)) {
    throw new InputError(
      t(
        locale,
        `未找到评审目标路径：${absoluteTargetPath}`,
        `Review target path not found: ${absoluteTargetPath}`,
      ),
      {
        code: "cli.review_path_missing",
        details: {
          path: absoluteTargetPath,
        },
      },
    );
  }

  return collectFilesRecursively(absoluteTargetPath).filter((filePath: string) =>
    TEXT_FILE_EXTENSIONS.has(path.extname(filePath)),
  );
}

function readGitDiffFiles(cwd: string, args: string[]): string[] {
  try {
    const output = execFileSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (!output) {
      return [];
    }

    return output
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean)
      .map((line: string) => line.split(" -> ").at(-1) ?? "")
      .filter(Boolean)
      .map((relativePath: string) => path.resolve(cwd, relativePath))
      .filter((absolutePath: string) => fs.existsSync(absolutePath));
  } catch {
    return [];
  }
}

function readGitStatusFiles(cwd: string): string[] {
  try {
    const output = execFileSync(
      "git",
      ["-C", cwd, "status", "--porcelain", "--untracked-files=all"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();

    if (!output) {
      return [];
    }

    return output
      .split("\n")
      .map((line: string) => line.slice(3).trim())
      .filter(Boolean)
      .map((relativePath: string) => relativePath.split(" -> ").at(-1) ?? "")
      .filter(Boolean)
      .map((relativePath: string) => path.resolve(cwd, relativePath))
      .filter((absolutePath: string) => fs.existsSync(absolutePath));
  } catch {
    return [];
  }
}

export function collectGitTargets(
  cwd: string,
  base?: string | null,
  head?: string | null,
): string[] {
  if (base || head) {
    const safeBase = base ?? "HEAD";
    const safeHead = head ?? "HEAD";
    return readGitDiffFiles(cwd, ["diff", "--name-only", safeBase, safeHead]).filter(
      (filePath: string) => TEXT_FILE_EXTENSIONS.has(path.extname(filePath)),
    );
  }

  return readGitStatusFiles(cwd).filter((filePath: string) =>
    TEXT_FILE_EXTENSIONS.has(path.extname(filePath)),
  );
}

function extractTaskIds(content: string): Set<string> {
  return new Set(String(content).match(/TK-\d{3}/g) ?? []);
}

function listTaskFileIds(tasksRoot: string): Set<string> {
  if (!fs.existsSync(tasksRoot)) {
    return new Set<string>();
  }

  return new Set(
    fs
      .readdirSync(tasksRoot)
      .filter((entry) => /^TK-\d{3}\.md$/.test(entry))
      .map((entry) => entry.replace(/\.md$/, "")),
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

export function buildArtifactPaths(
  cwd: string,
  resolvedConfig: AnyRecord,
  locale: string = LocaleEnum.ZhCN,
): ReviewArtifactPaths {
  const currentProject = resolvedConfig.config.execution.currentProject;
  const currentSprint = resolvedConfig.config.execution.currentSprint;

  if (!currentProject || !currentSprint) {
    throw new ConfigError(
      t(
        locale,
        "review 命令需要当前 project 与 sprint。",
        "Review command requires a current project and sprint",
      ),
      {
        code: "cli.review_missing_context",
        details: {
          currentProject,
          currentSprint,
        },
      },
    );
  }

  const sprintRoot = path.resolve(
    cwd,
    resolvedConfig.config.artifacts.baseDir,
    currentProject,
    currentSprint,
  );
  const tasksRoot = path.resolve(sprintRoot, resolvedConfig.config.artifacts.directories.tasks);
  const codeReviewRoot = path.resolve(
    sprintRoot,
    resolvedConfig.config.artifacts.directories.codeReview,
  );

  return {
    sprintRoot,
    tasksRoot,
    codeReviewRoot,
    planFile: path.resolve(sprintRoot, resolvedConfig.config.artifacts.files.plan),
    checklistFile: path.resolve(tasksRoot, resolvedConfig.config.artifacts.taskFiles.checklist),
    taskCsvFile: path.resolve(tasksRoot, resolvedConfig.config.artifacts.taskFiles.csv),
    csvColumns: resolvedConfig.config.artifacts.taskFiles.csvColumns ?? DEFAULT_TASK_CSV_COLUMNS,
  };
}

function buildReviewRun(commandContext: CommandContext): ReviewRunState {
  const cwd = path.resolve(getStringOption(commandContext.globalOptions, "cwd") ?? process.cwd());
  const resolvedConfig = loadResolvedConfig({
    cwd,
    configPath: getStringOption(commandContext.globalOptions, "config"),
    cliOverrides: {
      ...commandContext.globalOptions,
      ...commandContext.commandOptions,
    },
  });
  const locale = normalizeLocale(
    getStringOption(commandContext.globalOptions, "locale") ??
      resolvedConfig.config.standards.locales?.default ??
      "zh-CN",
  );
  const artifactPaths = buildArtifactPaths(cwd, resolvedConfig, locale);
  const standardsPackage = resolveStandardsPackage(resolvedConfig.config.standards);
  const pathOption = getStringOption(commandContext.commandOptions, "path");
  const baseOption = getStringOption(commandContext.commandOptions, "base");
  const headOption = getStringOption(commandContext.commandOptions, "head");
  const targetFiles = pathOption
    ? collectPathTargets(cwd, pathOption, locale)
    : collectGitTargets(cwd, baseOption, headOption);

  if (targetFiles.length === 0) {
    throw new InputError(
      t(
        locale,
        "review 命令未找到可评审文件。请使用 --path，或在存在变更的 git 工作区中执行。",
        "Review command could not find any target files. Use --path or run inside a git working tree with changes.",
      ),
      {
        code: "cli.review_no_targets",
        details: {
          cwd,
          path: pathOption ?? null,
          base: baseOption ?? null,
          head: headOption ?? null,
        },
      },
    );
  }

  return {
    cwd,
    resolvedConfig,
    standardsPackage,
    artifactPaths,
    targetFiles,
    pathOption: pathOption ?? null,
    base: baseOption ?? null,
    head: headOption ?? null,
    strict: commandContext.commandOptions.strict === true,
    dryRun: commandContext.globalOptions.dryRun === true,
    locale,
  };
}

export function collectReviewRuleViews(
  standardsPackage: ReviewRunState["standardsPackage"],
  locale: string,
): ReviewRuleView[] {
  return renderRulesForConsumer(standardsPackage, "review", {
    locale,
    view: "human",
  }).map((rule) => ({
    id: rule.id,
    title: "title" in rule ? (rule.title ?? "") : "",
    summary: "summary" in rule ? (rule.summary ?? "") : "",
  }));
}

function findMirroredTestFile(cwd: string, relativeTargetPath: string): string | null {
  const normalizedTargetPath = relativeTargetPath.replace(/\\/g, "/");
  const relativeFromSource = normalizedTargetPath.replace(/^src\//, "");
  const extension = path.extname(relativeFromSource);
  const withoutExtension = relativeFromSource.slice(0, -extension.length);
  const mirroredPath = path.resolve(cwd, "test", `${withoutExtension}.test${extension}`);

  if (fs.existsSync(mirroredPath)) {
    return mirroredPath;
  }

  const basenameTestPath = path.resolve(
    cwd,
    "test",
    `${path.basename(withoutExtension)}.test${extension}`,
  );

  if (fs.existsSync(basenameTestPath)) {
    return basenameTestPath;
  }

  return null;
}

function maybeAddTaskSyncFinding(
  runState: ReviewRunState,
  relativeTargets: string[],
  findings: ReviewFinding[],
  matchedRuleIds: Set<string>,
): void {
  const shouldCheckTaskSync = relativeTargets.some(
    (target) =>
      target.startsWith(toRelativePath(runState.cwd, runState.artifactPaths.tasksRoot)) ||
      target === toRelativePath(runState.cwd, runState.artifactPaths.planFile),
  );

  if (!shouldCheckTaskSync) {
    return;
  }

  const checklistTaskIds = extractTaskIds(
    fs.readFileSync(runState.artifactPaths.checklistFile, "utf8"),
  );
  const csvTaskIds = extractTaskIds(fs.readFileSync(runState.artifactPaths.taskCsvFile, "utf8"));
  const fileTaskIds = listTaskFileIds(runState.artifactPaths.tasksRoot);

  matchedRuleIds.add("process-task-records-must-sync");

  if (
    compareTaskIdSets(checklistTaskIds, csvTaskIds) &&
    compareTaskIdSets(checklistTaskIds, fileTaskIds)
  ) {
    findings.push(
      createFinding({
        id: "review.task-record-sync",
        ruleId: "process-task-records-must-sync",
        severity: "info",
        status: "pass",
        message: t(
          runState.locale,
          "当前评审范围内的 checklist、CSV 与任务卡保持同步。",
          "Task checklist, CSV, and task cards stay synchronized for the reviewed scope.",
        ),
        target: [
          toRelativePath(runState.cwd, runState.artifactPaths.checklistFile),
          toRelativePath(runState.cwd, runState.artifactPaths.taskCsvFile),
        ].join(", "),
      }),
    );
    return;
  }

  findings.push(
    createFinding({
      id: "review.task-record-sync",
      ruleId: "process-task-records-must-sync",
      severity: "error",
      status: "fail",
      message: t(
        runState.locale,
        "任务 checklist、CSV 与任务卡未保持同步。",
        "Task checklist, CSV, and task cards are not synchronized.",
      ),
      target: [
        toRelativePath(runState.cwd, runState.artifactPaths.checklistFile),
        toRelativePath(runState.cwd, runState.artifactPaths.taskCsvFile),
      ].join(", "),
      suggestion: t(
        runState.locale,
        "交付前请先同步 checklist、tasks.csv 与任务卡中的任务编号及执行记录。",
        "Sync the task IDs and execution records across checklist, tasks.csv, and task files before delivery.",
      ),
    }),
  );
}

export function analyzeTargets(runState: ReviewRunState): ReviewAnalysis {
  const findings: ReviewFinding[] = [];
  const matchedRuleIds = new Set<string>();
  const relativeTargets = runState.targetFiles.map((filePath: string) =>
    toRelativePath(runState.cwd, filePath),
  );

  for (const [index, targetFile] of runState.targetFiles.entries()) {
    const relativeTarget = relativeTargets[index];
    const extension = path.extname(targetFile);

    if (!TEXT_FILE_EXTENSIONS.has(extension)) {
      continue;
    }

    const content = fs.readFileSync(targetFile, "utf8");

    if (TODO_PATTERN.test(content)) {
      matchedRuleIds.add("collaboration-risks-and-assumptions-explicit");
      findings.push(
        createFinding({
          id: `review.todo-marker.${index + 1}`,
          ruleId: "collaboration-risks-and-assumptions-explicit",
          severity: "warning",
          status: "warn",
          message: t(
            runState.locale,
            "文件中存在 TODO/FIXME/HACK 标记，交付前应显式处理。",
            "File contains TODO/FIXME/HACK markers that should be made explicit before delivery.",
          ),
          target: relativeTarget,
          suggestion: t(
            runState.locale,
            "请处理该标记，或在任务记录/评审备注中显式记录剩余风险。",
            "Resolve the marker or capture the remaining risk explicitly in the task record or review note.",
          ),
        }),
      );
    }

    if (relativeTarget.startsWith("src/") && SOURCE_FILE_EXTENSIONS.has(extension)) {
      matchedRuleIds.add("quality-verification-before-delivery");
      const mirroredTestFile = findMirroredTestFile(runState.cwd, relativeTarget);

      if (mirroredTestFile) {
        findings.push(
          createFinding({
            id: `review.mirrored-test.${index + 1}`,
            ruleId: "quality-verification-before-delivery",
            severity: "info",
            status: "pass",
            message: t(
              runState.locale,
              "源文件已存在对应测试文件。",
              "Source file has a matching test file.",
            ),
            target: `${relativeTarget} -> ${toRelativePath(runState.cwd, mirroredTestFile)}`,
          }),
        );
      } else {
        findings.push(
          createFinding({
            id: `review.mirrored-test.${index + 1}`,
            ruleId: "quality-verification-before-delivery",
            severity: "warning",
            status: "warn",
            message: t(
              runState.locale,
              "源文件在 test/ 下未找到镜像测试文件。",
              "Source file does not have a mirrored test file in test/.",
            ),
            target: relativeTarget,
            suggestion: t(
              runState.locale,
              "请在 test/ 下补充镜像测试文件，或说明该改动为何有意不覆盖测试。",
              "Add a mirrored test file under test/ or document why the change is intentionally untested.",
            ),
          }),
        );
      }
    }
  }

  maybeAddTaskSyncFinding(runState, relativeTargets, findings, matchedRuleIds);

  return {
    findings,
    matchedRuleIds: [...matchedRuleIds],
    relativeTargets,
  };
}

function createPendingReviewLifecycle(reviewFileName: string): ReviewLifecycle {
  const pendingName = reviewFileName;
  const verifiedName = reviewFileName.replace(/^review_/, "verified_review_");
  const resolvedName = reviewFileName.replace(/^review_/, "resolved_review_");

  return {
    pending: pendingName,
    verified: verifiedName,
    resolved: resolvedName,
  };
}

function buildReviewSlug(runState: ReviewRunState, relativeTargets: string[]): string {
  const taskIdMatch = relativeTargets.map((target) => target.match(/TK-\d{3}/i)).find(Boolean);

  if (taskIdMatch) {
    return createReviewSlug(taskIdMatch[0], "review");
  }

  if (runState.pathOption) {
    return createReviewSlug(...runState.pathOption.split(/[\\/]/).filter(Boolean).slice(-3));
  }

  if (runState.base || runState.head) {
    return createReviewSlug(
      runState.resolvedConfig.config.execution.currentProject ?? "project",
      runState.resolvedConfig.config.execution.currentSprint ?? "sprint",
      "diff",
      runState.base ?? "head",
      runState.head ?? "head",
    );
  }

  if (relativeTargets.length === 1) {
    const target = relativeTargets[0];
    const extension = path.extname(target);
    const withoutExtension = extension ? target.slice(0, -extension.length) : target;
    return createReviewSlug(...withoutExtension.split("/").slice(-3));
  }

  return createReviewSlug(
    runState.resolvedConfig.config.execution.currentProject ?? "project",
    runState.resolvedConfig.config.execution.currentSprint ?? "sprint",
    "working-tree",
  );
}

function buildMarkdownOutput(payload: ReviewPayload): string {
  const locale = normalizeLocale(payload.locale);
  const localized = (zhCN: string, enUS: string) => t(locale, zhCN, enUS);
  const lifecycle = payload.reviewLifecycle;
  const findingsSection =
    payload.findings.length === 0
      ? localized("1. 无阻断或告警级评审发现。", "1. No blocking or warning findings.")
      : payload.findings
          .map((finding: ReviewFinding, index: number) => {
            const lines = [
              `${index + 1}. [${finding.severity}] ${finding.message}`,
              `${localized("目标", "Target")}: \`${finding.target}\``,
            ];

            if (finding.ruleId) {
              lines.push(`${localized("规则", "Rule")}: \`${finding.ruleId}\``);
            }

            if (finding.suggestion) {
              lines.push(`${localized("建议", "Suggestion")}: ${finding.suggestion}`);
            }

            return lines.join("\n");
          })
          .join("\n\n");

  const standardsSection =
    payload.standards.reviewRules.length === 0
      ? localized("1. 未加载面向 review 阶段的规范。", "1. No review-facing standards were loaded.")
      : payload.standards.reviewRules
          .map(
            (rule: ReviewRuleView, index: number) =>
              `${index + 1}. \`${rule.id}\` ${rule.title}\n${localized("摘要", "Summary")}: ${rule.summary}`,
          )
          .join("\n\n");

  const targetSection = payload.targets
    .map((target: string, index: number) => `${index + 1}. \`${target}\``)
    .join("\n");

  return ensureTrailingNewline(
    [
      `${localized("# 评审", "# Review")} ${payload.slug}`,
      "",
      `- ${localized("状态", "Status")}: pending`,
      `- ${localized("结果", "Result")}: ${payload.status}`,
      `- ${localized("时间", "Date")}: ${payload.generatedAt}`,
      `- ${localized("项目", "Project")}: \`${payload.currentProject}\``,
      `- ${localized("Sprint", "Sprint")}: \`${payload.currentSprint}\``,
      `- ${localized("文件生命周期", "File lifecycle")}:`,
      `  - ${localized("待复核", "Pending verify")}: \`${lifecycle.pending}\``,
      `  - ${localized("已复核", "Verified")}: \`${lifecycle.verified}\``,
      `  - ${localized("已解决", "Resolved")}: \`${lifecycle.resolved}\``,
      "",
      `## ${localized("评审范围", "Scope")}`,
      "",
      `${localized("命令", "Command")}: \`review\``,
      runStateLine(localized("严格模式", "Strict mode"), payload.strict ? "true" : ""),
      runStateLine(localized("路径", "Path"), payload.pathOption),
      runStateLine(localized("Base", "Base"), payload.base),
      runStateLine(localized("Head", "Head"), payload.head),
      "",
      `## ${localized("目标文件", "Targets")}`,
      "",
      targetSection,
      "",
      `## ${localized("摘要", "Summary")}`,
      "",
      `1. ${localized("评审结果", "Review result")}: \`${payload.status}\``,
      `2. ${localized("发现数", "Findings")}: \`${payload.findings.length}\``,
      `3. ${localized("错误", "Errors")}: \`${payload.summary.errors}\`, ${localized("告警", "Warnings")}: \`${payload.summary.warnings}\``,
      "",
      `## ${localized("评审发现", "Review Findings")}`,
      "",
      findingsSection,
      "",
      `## ${localized("命中规范", "Matched Standards")}`,
      "",
      standardsSection,
      "",
      `## ${localized("复核追加记录", "Verify Append Log")}`,
      "",
      localized(
        "1. 待复核。请将 review-verify 结果追加到本文件，并重命名为下一状态文件。",
        "1. Pending verification. Append review-verify results to this file and rename it to the next review status.",
      ),
      "",
      `## ${localized("解决记录", "Resolution Log")}`,
      "",
      localized("1. 尚未应用任何解决动作。", "1. No resolutions have been applied yet."),
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

function runStateLine(label: string, value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return `${label}: \`${value}\``;
}

function buildReviewPayload(
  runState: ReviewRunState,
  workflowResult: ReviewWorkflowResult,
  analysis: ReviewAnalysis,
  summary: ReviewSummary,
  reviewFilePath: string | null,
): ReviewPayload {
  const slug = buildReviewSlug(runState, analysis.relativeTargets);
  const reviewFileName = createReviewFileName({ status: "pending", slug });
  const reviewLifecycle = createPendingReviewLifecycle(reviewFileName);
  const reviewRules = collectReviewRuleViews(runState.standardsPackage, runState.locale);

  return {
    command: "review",
    status: summary.status,
    dryRun: runState.dryRun,
    cwd: runState.cwd,
    configFile: runState.resolvedConfig.paths.configFile,
    currentProject: runState.resolvedConfig.config.execution.currentProject,
    currentSprint: runState.resolvedConfig.config.execution.currentSprint,
    pathOption: runState.pathOption,
    base: runState.base,
    head: runState.head,
    strict: runState.strict,
    generatedAt: formatDateTime(),
    locale: runState.locale,
    slug,
    workflow: {
      status: workflowResult.status,
      selectedStageIds: workflowResult.selectedStageIds,
      summary: workflowResult.summary,
      stages: workflowResult.stages.map((stage) => ({
        id: stage.id,
        status: stage.status,
        summary: stage.summary,
        blockedBy: stage.blockedBy,
      })),
    },
    targets: analysis.relativeTargets,
    findings: analysis.findings,
    summary,
    standards: {
      preset: runState.standardsPackage.id,
      totalRules: runState.standardsPackage.rules.length,
      matchedRuleIds: analysis.matchedRuleIds,
      reviewRules,
    },
    reviewLifecycle,
    reviewFile: reviewFilePath
      ? toRelativePath(runState.cwd, reviewFilePath)
      : toRelativePath(
          runState.cwd,
          path.resolve(runState.artifactPaths.codeReviewRoot, reviewFileName),
        ),
  };
}

function writeReviewFile(runState: ReviewRunState, payload: ReviewPayload): string {
  const reviewFilePath = path.resolve(
    runState.artifactPaths.codeReviewRoot,
    payload.reviewLifecycle.pending,
  );

  fs.mkdirSync(path.dirname(reviewFilePath), { recursive: true });
  fs.writeFileSync(reviewFilePath, buildMarkdownOutput(payload), "utf8");
  return reviewFilePath;
}

function writeReviewOutput(
  logger: Logger,
  commandContext: CommandContext,
  payload: ReviewPayload,
): void {
  if (commandContext.format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (commandContext.format === "markdown") {
    logger.raw(buildMarkdownOutput(payload), { ignoreQuiet: true });
    return;
  }

  if (payload.status === "fail") {
    logger.error(t(payload.locale, "评审发现阻断问题", "Review found blocking issues"));
  } else if (payload.status === "warn") {
    logger.warn(t(payload.locale, "评审发现非阻断问题", "Review found non-blocking issues"));
  } else {
    logger.success(t(payload.locale, "评审通过", "Review passed"));
  }

  logger.keyValue(t(payload.locale, "目标文件", "Targets"), String(payload.targets.length));
  logger.keyValue(t(payload.locale, "评审发现", "Findings"), String(payload.findings.length));
  logger.keyValue(t(payload.locale, "评审文件", "Review file"), payload.reviewFile);

  for (const finding of payload.findings) {
    const emitter =
      finding.severity === "error"
        ? logger.error
        : finding.severity === "warning"
          ? logger.warn
          : logger.info;

    emitter(`${finding.message} (${finding.target})`);
  }
}

async function executeReviewWorkflow(runState: ReviewRunState): Promise<{
  workflowResult: ReviewWorkflowResult;
  analysis: ReviewAnalysis;
  summary: ReviewSummary;
}> {
  const workflowResult = await executeWorkflow({
    template: REVIEW_WORKFLOW_TEMPLATE as unknown as ExecuteWorkflowOptions["template"],
    targetStages: ["review"],
    metadata: {
      cwd: runState.cwd,
    },
    handlers: {
      review() {
        const analysis = analyzeTargets(runState);
        const summary = summarizeFindings(analysis.findings, {
          failOnWarnings: runState.strict,
        });

        return {
          status: summary.exitCode === EXIT_CODES.success ? "passed" : "failed",
          summary:
            summary.status === "pass"
              ? t(runState.locale, "评审完成，无待处理发现。", "Review completed without findings.")
              : t(
                  runState.locale,
                  `评审完成，共有 ${analysis.findings.length} 条发现。`,
                  `Review completed with ${analysis.findings.length} findings.`,
                ),
          outputs: {
            analysis,
            summary,
          },
          details: {
            targets: analysis.relativeTargets,
          },
          warnings:
            summary.warnings > 0
              ? [
                  t(
                    runState.locale,
                    `评审报告包含 ${summary.warnings} 条告警发现。`,
                    `Review reported ${summary.warnings} warning findings.`,
                  ),
                ]
              : [],
        };
      },
    },
  });

  const reviewStage = workflowResult.stages.find((stage) => stage.id === "review");
  return {
    workflowResult: workflowResult as unknown as ReviewWorkflowResult,
    analysis: (reviewStage?.outputs.analysis as ReviewAnalysis | undefined) ?? {
      findings: [],
      matchedRuleIds: [],
      relativeTargets: [],
    },
    summary:
      (reviewStage?.outputs.summary as ReviewSummary | undefined) ??
      summarizeFindings([], {
        failOnWarnings: runState.strict,
      }),
  };
}

export async function executeReviewCommand(
  commandContext: CommandContext,
  logger: Logger,
): Promise<number> {
  const runState = buildReviewRun(commandContext);
  const { workflowResult, analysis, summary } = await executeReviewWorkflow(runState);
  let payload = buildReviewPayload(runState, workflowResult, analysis, summary, null);

  if (!runState.dryRun) {
    const reviewFilePath = writeReviewFile(runState, payload);
    payload = buildReviewPayload(runState, workflowResult, analysis, summary, reviewFilePath);
  }

  writeReviewOutput(logger, commandContext, payload);
  return payload.summary.exitCode;
}
