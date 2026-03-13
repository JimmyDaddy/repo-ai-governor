import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadResolvedConfig } from "../config/load-config.js";
import {
  createReviewFileName,
  createReviewSlug,
  DEFAULT_TASK_CSV_COLUMNS
} from "../config/repository-layout.js";
import { ConfigError, InputError } from "../cli/runtime/errors.js";
import { EXIT_CODES } from "../cli/runtime/exit-codes.js";
import {
  listRulesForConsumer,
  renderRulesForConsumer,
  resolveStandardsPackage
} from "../standards/official-base-package.js";
import { executeWorkflow } from "../workflow/governance-engine.js";

const REVIEW_WORKFLOW_TEMPLATE = Object.freeze({
  id: "governance-review",
  version: "1",
  kind: "workflow-template",
  meta: {
    name: {
      "zh-CN": "治理评审流程",
      "en-US": "Governance Review Flow"
    },
    description: {
      "zh-CN": "用于按当前规范对改动范围生成最小 review 结论和 CR 记录。",
      "en-US": "Generates a minimal governance review conclusion and CR record for the selected change scope."
    }
  },
  execution: {
    mode: "serial",
    allowSkipStages: false,
    stopOnFailure: true
  },
  stages: [
    {
      id: "review",
      name: {
        "zh-CN": "评审阶段",
        "en-US": "Review Stage"
      },
      description: {
        "zh-CN": "根据 review 规范对目标范围生成发现与结论。",
        "en-US": "Produces findings and a conclusion against the review-facing governance standards."
      },
      executor: {
        kind: "internal",
        ref: "run-review"
      }
    }
  ]
});

const TEXT_FILE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".json", ".md", ".yaml", ".yml", ".txt"]);
const SOURCE_FILE_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);
const TODO_PATTERN = /\b(TODO|FIXME|HACK)\b/;

export function toRelativePath(cwd, absolutePath) {
  const relativePath = path.relative(cwd, absolutePath).split(path.sep).join("/");
  return relativePath || ".";
}

function ensureTrailingNewline(content) {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function formatDateTime(date = new Date()) {
  return date.toISOString();
}

function createFinding(options) {
  return {
    id: options.id,
    ruleId: options.ruleId ?? null,
    severity: options.severity ?? "info",
    status: options.status ?? (options.severity === "error" ? "fail" : "pass"),
    message: options.message,
    target: options.target,
    suggestion: options.suggestion ?? null
  };
}

export function summarizeFindings(findings, options = {}) {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  const failOnWarnings = options.failOnWarnings === true;
  const status = errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass";
  const shouldFail = errors > 0 || (failOnWarnings && warnings > 0);

  return {
    status,
    exitCode: shouldFail ? EXIT_CODES.businessCheckFailed : EXIT_CODES.success,
    errors,
    warnings,
    passed: findings.filter((finding) => finding.status === "pass").length
  };
}

function collectFilesRecursively(targetPath, files = []) {
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

export function collectPathTargets(cwd, targetPath) {
  const absoluteTargetPath = path.resolve(cwd, targetPath);

  if (!fs.existsSync(absoluteTargetPath)) {
    throw new InputError(`Review target path not found: ${absoluteTargetPath}`, {
      code: "cli.review_path_missing",
      details: {
        path: absoluteTargetPath
      }
    });
  }

  return collectFilesRecursively(absoluteTargetPath).filter((filePath) =>
    TEXT_FILE_EXTENSIONS.has(path.extname(filePath))
  );
}

function readGitDiffFiles(cwd, args) {
  try {
    const output = execFileSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();

    if (!output) {
      return [];
    }

    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(" -> ").at(-1))
      .map((relativePath) => path.resolve(cwd, relativePath))
      .filter((absolutePath) => fs.existsSync(absolutePath));
  } catch {
    return [];
  }
}

function readGitStatusFiles(cwd) {
  try {
    const output = execFileSync(
      "git",
      ["-C", cwd, "status", "--porcelain", "--untracked-files=all"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      }
    ).trim();

    if (!output) {
      return [];
    }

    return output
      .split("\n")
      .map((line) => line.slice(3).trim())
      .filter(Boolean)
      .map((relativePath) => relativePath.split(" -> ").at(-1))
      .map((relativePath) => path.resolve(cwd, relativePath))
      .filter((absolutePath) => fs.existsSync(absolutePath));
  } catch {
    return [];
  }
}

export function collectGitTargets(cwd, base, head) {
  if (base || head) {
    const safeBase = base ?? "HEAD";
    const safeHead = head ?? "HEAD";
    return readGitDiffFiles(cwd, ["diff", "--name-only", safeBase, safeHead]).filter((filePath) =>
      TEXT_FILE_EXTENSIONS.has(path.extname(filePath))
    );
  }

  return readGitStatusFiles(cwd).filter((filePath) =>
    TEXT_FILE_EXTENSIONS.has(path.extname(filePath))
  );
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

export function buildArtifactPaths(cwd, resolvedConfig) {
  const currentProject = resolvedConfig.config.execution.currentProject;
  const currentSprint = resolvedConfig.config.execution.currentSprint;

  if (!currentProject || !currentSprint) {
    throw new ConfigError("Review command requires a current project and sprint", {
      code: "cli.review_missing_context",
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

  return {
    sprintRoot,
    tasksRoot,
    codeReviewRoot,
    planFile: path.resolve(sprintRoot, resolvedConfig.config.artifacts.files.plan),
    checklistFile: path.resolve(tasksRoot, resolvedConfig.config.artifacts.taskFiles.checklist),
    taskCsvFile: path.resolve(tasksRoot, resolvedConfig.config.artifacts.taskFiles.csv),
    csvColumns: resolvedConfig.config.artifacts.taskFiles.csvColumns ?? DEFAULT_TASK_CSV_COLUMNS
  };
}

function buildReviewRun(commandContext) {
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
  const targetFiles =
    commandContext.commandOptions.path
      ? collectPathTargets(cwd, commandContext.commandOptions.path)
      : collectGitTargets(cwd, commandContext.commandOptions.base, commandContext.commandOptions.head);

  if (targetFiles.length === 0) {
    throw new InputError(
      "Review command could not find any target files. Use --path or run inside a git working tree with changes.",
      {
        code: "cli.review_no_targets",
        details: {
          cwd,
          path: commandContext.commandOptions.path ?? null,
          base: commandContext.commandOptions.base ?? null,
          head: commandContext.commandOptions.head ?? null
        }
      }
    );
  }

  return {
    cwd,
    resolvedConfig,
    standardsPackage,
    artifactPaths,
    targetFiles,
    pathOption: commandContext.commandOptions.path ?? null,
    base: commandContext.commandOptions.base ?? null,
    head: commandContext.commandOptions.head ?? null,
    strict: commandContext.commandOptions.strict === true,
    dryRun: commandContext.globalOptions.dryRun === true,
    locale: commandContext.globalOptions.locale ?? resolvedConfig.config.execution.defaultLocale
  };
}

export function collectReviewRuleViews(standardsPackage, locale) {
  return renderRulesForConsumer(standardsPackage, "review", locale);
}

function findMirroredTestFile(cwd, relativeTargetPath) {
  const normalizedTargetPath = relativeTargetPath.replace(/\\/g, "/");
  const relativeFromSource = normalizedTargetPath.replace(/^src\//, "");
  const extension = path.extname(relativeFromSource);
  const withoutExtension = relativeFromSource.slice(0, -extension.length);
  const mirroredPath = path.resolve(cwd, "test", `${withoutExtension}.test${extension}`);

  if (fs.existsSync(mirroredPath)) {
    return mirroredPath;
  }

  const basenameTestPath = path.resolve(cwd, "test", `${path.basename(withoutExtension)}.test${extension}`);

  if (fs.existsSync(basenameTestPath)) {
    return basenameTestPath;
  }

  return null;
}

function maybeAddTaskSyncFinding(runState, relativeTargets, findings, matchedRuleIds) {
  const shouldCheckTaskSync = relativeTargets.some(
    (target) =>
      target.startsWith(
        toRelativePath(runState.cwd, runState.artifactPaths.tasksRoot)
      ) ||
      target === toRelativePath(runState.cwd, runState.artifactPaths.planFile)
  );

  if (!shouldCheckTaskSync) {
    return;
  }

  const checklistTaskIds = extractTaskIds(fs.readFileSync(runState.artifactPaths.checklistFile, "utf8"));
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
        message: "Task checklist, CSV, and task cards stay synchronized for the reviewed scope.",
        target: [
          toRelativePath(runState.cwd, runState.artifactPaths.checklistFile),
          toRelativePath(runState.cwd, runState.artifactPaths.taskCsvFile)
        ].join(", ")
      })
    );
    return;
  }

  findings.push(
    createFinding({
      id: "review.task-record-sync",
      ruleId: "process-task-records-must-sync",
      severity: "error",
      status: "fail",
      message: "Task checklist, CSV, and task cards are not synchronized.",
      target: [
        toRelativePath(runState.cwd, runState.artifactPaths.checklistFile),
        toRelativePath(runState.cwd, runState.artifactPaths.taskCsvFile)
      ].join(", "),
      suggestion: "Sync the task IDs and execution records across checklist, tasks.csv, and task files before delivery."
    })
  );
}

export function analyzeTargets(runState) {
  const findings = [];
  const matchedRuleIds = new Set();
  const relativeTargets = runState.targetFiles.map((filePath) => toRelativePath(runState.cwd, filePath));

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
          message: "File contains TODO/FIXME/HACK markers that should be made explicit before delivery.",
          target: relativeTarget,
          suggestion: "Resolve the marker or capture the remaining risk explicitly in the task record or review note."
        })
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
            message: "Source file has a matching test file.",
            target: `${relativeTarget} -> ${toRelativePath(runState.cwd, mirroredTestFile)}`
          })
        );
      } else {
        findings.push(
          createFinding({
            id: `review.mirrored-test.${index + 1}`,
            ruleId: "quality-verification-before-delivery",
            severity: "warning",
            status: "warn",
            message: "Source file does not have a mirrored test file in test/.",
            target: relativeTarget,
            suggestion: "Add a mirrored test file under test/ or document why the change is intentionally untested."
          })
        );
      }
    }
  }

  maybeAddTaskSyncFinding(runState, relativeTargets, findings, matchedRuleIds);

  return {
    findings,
    matchedRuleIds: [...matchedRuleIds],
    relativeTargets
  };
}

function createPendingReviewLifecycle(reviewFileName) {
  const pendingName = reviewFileName;
  const verifiedName = reviewFileName.replace(/^review_/, "verified_review_");
  const resolvedName = reviewFileName.replace(/^review_/, "resolved_review_");

  return {
    pending: pendingName,
    verified: verifiedName,
    resolved: resolvedName
  };
}

function buildReviewSlug(runState, relativeTargets) {
  const taskIdMatch = relativeTargets
    .map((target) => target.match(/TK-\d{3}/i))
    .find(Boolean);

  if (taskIdMatch) {
    return createReviewSlug(taskIdMatch[0], "review");
  }

  if (runState.pathOption) {
    return createReviewSlug(
      ...runState.pathOption.split(/[\\/]/).filter(Boolean).slice(-3)
    );
  }

  if (runState.base || runState.head) {
    return createReviewSlug(
      runState.resolvedConfig.config.execution.currentProject,
      runState.resolvedConfig.config.execution.currentSprint,
      "diff",
      runState.base ?? "head",
      runState.head ?? "head"
    );
  }

  if (relativeTargets.length === 1) {
    const target = relativeTargets[0];
    const extension = path.extname(target);
    const withoutExtension = extension ? target.slice(0, -extension.length) : target;
    return createReviewSlug(...withoutExtension.split("/").slice(-3));
  }

  return createReviewSlug(
    runState.resolvedConfig.config.execution.currentProject,
    runState.resolvedConfig.config.execution.currentSprint,
    "working-tree"
  );
}

function buildMarkdownOutput(payload) {
  const lifecycle = payload.reviewLifecycle;
  const findingsSection =
    payload.findings.length === 0
      ? "1. No blocking or warning findings."
      : payload.findings
          .map((finding, index) => {
            const lines = [
              `${index + 1}. [${finding.severity}] ${finding.message}`,
              `Target: \`${finding.target}\``
            ];

            if (finding.ruleId) {
              lines.push(`Rule: \`${finding.ruleId}\``);
            }

            if (finding.suggestion) {
              lines.push(`Suggestion: ${finding.suggestion}`);
            }

            return lines.join("\n");
          })
          .join("\n\n");

  const standardsSection =
    payload.standards.reviewRules.length === 0
      ? "1. No review-facing standards were loaded."
      : payload.standards.reviewRules
          .map(
            (rule, index) =>
              `${index + 1}. \`${rule.id}\` ${rule.title}\nSummary: ${rule.summary}`
          )
          .join("\n\n");

  const targetSection = payload.targets.map((target, index) => `${index + 1}. \`${target}\``).join("\n");

  return ensureTrailingNewline(
    [
      `# Review ${payload.slug}`,
      "",
      `- Status: pending`,
      `- Result: ${payload.status}`,
      `- Date: ${payload.generatedAt}`,
      `- Project: \`${payload.currentProject}\``,
      `- Sprint: \`${payload.currentSprint}\``,
      `- File lifecycle:`,
      `  - Pending verify: \`${lifecycle.pending}\``,
      `  - Verified: \`${lifecycle.verified}\``,
      `  - Resolved: \`${lifecycle.resolved}\``,
      "",
      "## Scope",
      "",
      `Command: \`review\``,
      runStateLine("Strict mode", payload.strict ? "true" : ""),
      runStateLine("Path", payload.pathOption),
      runStateLine("Base", payload.base),
      runStateLine("Head", payload.head),
      "",
      "## Targets",
      "",
      targetSection,
      "",
      "## Summary",
      "",
      `1. Review result: \`${payload.status}\``,
      `2. Findings: \`${payload.findings.length}\``,
      `3. Errors: \`${payload.summary.errors}\`, warnings: \`${payload.summary.warnings}\``,
      "",
      "## Review Findings",
      "",
      findingsSection,
      "",
      "## Matched Standards",
      "",
      standardsSection,
      "",
      "## Verify Append Log",
      "",
      "1. Pending verification. Append review-verify results to this file and rename it to the next review status.",
      "",
      "## Resolution Log",
      "",
      "1. No resolutions have been applied yet."
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function runStateLine(label, value) {
  if (!value) {
    return "";
  }

  return `${label}: \`${value}\``;
}

function buildReviewPayload(runState, workflowResult, analysis, summary, reviewFilePath) {
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
    slug,
    workflow: {
      status: workflowResult.status,
      selectedStageIds: workflowResult.selectedStageIds,
      summary: workflowResult.summary,
      stages: workflowResult.stages.map((stage) => ({
        id: stage.id,
        status: stage.status,
        summary: stage.summary,
        blockedBy: stage.blockedBy
      }))
    },
    targets: analysis.relativeTargets,
    findings: analysis.findings,
    summary,
    standards: {
      preset: runState.standardsPackage.id,
      totalRules: runState.standardsPackage.rules.length,
      matchedRuleIds: analysis.matchedRuleIds,
      reviewRules
    },
    reviewLifecycle,
    reviewFile: reviewFilePath
      ? toRelativePath(runState.cwd, reviewFilePath)
      : toRelativePath(
          runState.cwd,
          path.resolve(runState.artifactPaths.codeReviewRoot, reviewFileName)
        )
  };
}

function writeReviewFile(runState, payload) {
  const reviewFilePath = path.resolve(
    runState.artifactPaths.codeReviewRoot,
    payload.reviewLifecycle.pending
  );

  fs.mkdirSync(path.dirname(reviewFilePath), { recursive: true });
  fs.writeFileSync(reviewFilePath, buildMarkdownOutput(payload), "utf8");
  return reviewFilePath;
}

function writeReviewOutput(logger, commandContext, payload) {
  if (commandContext.format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (commandContext.format === "markdown") {
    logger.raw(buildMarkdownOutput(payload), { ignoreQuiet: true });
    return;
  }

  if (payload.status === "fail") {
    logger.error("Review found blocking issues");
  } else if (payload.status === "warn") {
    logger.warn("Review found non-blocking issues");
  } else {
    logger.success("Review passed");
  }

  logger.keyValue("Targets", String(payload.targets.length));
  logger.keyValue("Findings", String(payload.findings.length));
  logger.keyValue("Review file", payload.reviewFile);

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

async function executeReviewWorkflow(runState) {
  const workflowResult = await executeWorkflow({
    template: REVIEW_WORKFLOW_TEMPLATE,
    targetStages: ["review"],
    metadata: {
      cwd: runState.cwd
    },
    handlers: {
      review() {
        const analysis = analyzeTargets(runState);
        const summary = summarizeFindings(analysis.findings, {
          failOnWarnings: runState.strict
        });

        return {
          status: summary.exitCode === EXIT_CODES.success ? "passed" : "failed",
          summary:
            summary.status === "pass"
              ? "Review completed without findings."
              : `Review completed with ${analysis.findings.length} findings.`,
          outputs: {
            analysis,
            summary
          },
          details: {
            targets: analysis.relativeTargets
          },
          warnings:
            summary.warnings > 0
              ? [`Review reported ${summary.warnings} warning findings.`]
              : []
        };
      }
    }
  });

  const reviewStage = workflowResult.stages.find((stage) => stage.id === "review");
  return {
    workflowResult,
    analysis: reviewStage?.outputs.analysis ?? { findings: [], matchedRuleIds: [], relativeTargets: [] },
    summary: reviewStage?.outputs.summary ?? summarizeFindings([], {
      failOnWarnings: runState.strict
    })
  };
}

export async function executeReviewCommand(commandContext, logger) {
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
