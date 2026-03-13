import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { loadResolvedConfig } from "../config/load-config.js";
import { resolveRepositoryLayout } from "../config/repository-layout.js";
import { ConfigurationError } from "../config/errors.js";
import { EXIT_CODES } from "../cli/runtime/exit-codes.js";
import { InputError } from "../cli/runtime/errors.js";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json");

function toRelativePath(cwd, targetPath) {
  const relativePath = path.relative(cwd, targetPath).split(path.sep).join("/");
  return relativePath || ".";
}

function parseVersion(value) {
  const match = String(value).trim().match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/);

  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

function compareVersions(left, right) {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;

    if (leftPart > rightPart) {
      return 1;
    }

    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

function parseMinimumVersion(engineRange) {
  const match = String(engineRange ?? "").trim().match(/^>=\s*(\d+(?:\.\d+)?(?:\.\d+)?)/);
  return match ? parseVersion(match[1]) : null;
}

function createFinding(options) {
  return {
    id: options.id,
    category: options.category,
    severity: options.severity,
    status: options.status ?? (options.severity === "error" ? "fail" : "pass"),
    message: options.message,
    target: options.target,
    suggestion: options.suggestion,
    fixable: options.fixable ?? false,
    fixed: options.fixed ?? false
  };
}

function createNodeVersionFinding() {
  const runtimeVersion = parseVersion(process.versions.node);
  const minimumVersion = parseMinimumVersion(packageJson.engines?.node);
  const target = `node ${process.versions.node}`;

  if (!runtimeVersion || !minimumVersion) {
    return createFinding({
      id: "environment.node-version",
      category: "environment",
      severity: "warning",
      status: "warn",
      message: "Unable to validate Node.js version against package engines.",
      target,
      suggestion: "Review package.json engines.node and verify the active runtime manually."
    });
  }

  if (compareVersions(runtimeVersion, minimumVersion) < 0) {
    return createFinding({
      id: "environment.node-version",
      category: "environment",
      severity: "error",
      status: "fail",
      message: `Node.js ${process.versions.node} does not satisfy ${packageJson.engines.node}.`,
      target,
      suggestion: `Upgrade Node.js to ${packageJson.engines.node} or newer before running the CLI.`
    });
  }

  return createFinding({
    id: "environment.node-version",
    category: "environment",
    severity: "info",
    status: "pass",
    message: `Node.js ${process.versions.node} satisfies ${packageJson.engines.node}.`,
    target
  });
}

function createPathFinding(options) {
  const exists = fs.existsSync(options.path);
  const relativeTarget = toRelativePath(options.cwd, options.path);

  if (!exists) {
    return createFinding({
      id: options.id,
      category: options.category,
      severity: options.severity,
      status: options.severity === "error" ? "fail" : "warn",
      message: options.missingMessage,
      target: relativeTarget,
      suggestion: options.suggestion,
      fixable: options.fixable
    });
  }

  if (options.kind === "directory" && !fs.statSync(options.path).isDirectory()) {
    return createFinding({
      id: options.id,
      category: options.category,
      severity: "error",
      status: "fail",
      message: "Expected directory path exists but is not a directory.",
      target: relativeTarget,
      suggestion: "Replace the path with a directory or update the repository configuration."
    });
  }

  if (options.kind === "file" && !fs.statSync(options.path).isFile()) {
    return createFinding({
      id: options.id,
      category: options.category,
      severity: "error",
      status: "fail",
      message: "Expected file path exists but is not a regular file.",
      target: relativeTarget,
      suggestion: "Replace the path with a file or update the repository configuration."
    });
  }

  return createFinding({
    id: options.id,
    category: options.category,
    severity: "info",
    status: "pass",
    message: options.presentMessage,
    target: relativeTarget
  });
}

function buildDoctorPayload(options = {}) {
  return {
    command: "doctor",
    status: options.status,
    strict: options.strict,
    fix: options.fix,
    cwd: options.cwd,
    configFile: options.configFile,
    currentProject: options.currentProject,
    currentSprint: options.currentSprint,
    summary: options.summary,
    checks: options.checks
  };
}

function buildArtifactPaths(cwd, resolvedConfig) {
  const configFile = resolvedConfig.paths.configFile;
  const configRoot = path.dirname(configFile);
  const currentProject = resolvedConfig.config.execution.currentProject;
  const currentSprint = resolvedConfig.config.execution.currentSprint;
  const reportingDir = path.resolve(cwd, resolvedConfig.config.reporting.outputDir);
  const templatesDir = path.resolve(configRoot, "templates");
  const agentEntryPath = path.resolve(cwd, resolvedConfig.config.agentEntry.target);
  const contextFilePath = path.resolve(cwd, resolvedConfig.config.agentEntry.contextFile);
  const artifactPaths = {
    configRoot,
    contextDir: path.dirname(contextFilePath),
    contextFilePath,
    slotsDir: resolvedConfig.paths.slotsDirectory,
    adaptersDir: resolvedConfig.paths.adaptersDirectory,
    reportsDir: reportingDir,
    templatesDir,
    agentEntryPath
  };

  if (currentProject && currentSprint) {
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

    artifactPaths.sprintRoot = sprintRoot;
    artifactPaths.tasksRoot = tasksRoot;
    artifactPaths.codeReviewRoot = codeReviewRoot;
    artifactPaths.indexFile = path.resolve(
      sprintRoot,
      resolvedConfig.config.artifacts.files.index
    );
    artifactPaths.planFile = path.resolve(
      sprintRoot,
      resolvedConfig.config.artifacts.files.plan
    );
    artifactPaths.checklistFile = path.resolve(
      tasksRoot,
      resolvedConfig.config.artifacts.taskFiles.checklist
    );
    artifactPaths.taskCsvFile = path.resolve(
      tasksRoot,
      resolvedConfig.config.artifacts.taskFiles.csv
    );
  }

  return artifactPaths;
}

function applySafeFixes(findings) {
  let fixesApplied = 0;

  for (const finding of findings) {
    if (!finding.fixable || finding.severity !== "warning" || finding.kind !== "directory") {
      continue;
    }

    fs.mkdirSync(finding.absoluteTarget, { recursive: true });
    finding.status = "fixed";
    finding.fixed = true;
    finding.message = `${finding.message} Automatically created by --fix.`;
    fixesApplied += 1;
  }

  return fixesApplied;
}

function summarizeChecks(findings, strict, fixesApplied) {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter(
    (finding) => finding.severity === "warning" && finding.status !== "fixed"
  ).length;

  let status = "pass";
  let exitCode = EXIT_CODES.success;

  if (errors > 0) {
    status = "fail";
    exitCode = EXIT_CODES.businessCheckFailed;
  } else if (warnings > 0) {
    status = "warn";
    exitCode = strict ? EXIT_CODES.businessCheckFailed : EXIT_CODES.success;
  }

  return {
    status,
    exitCode,
    errors,
    warnings,
    fixesApplied,
    passed: findings.filter((finding) => finding.status === "pass").length,
    fixed: findings.filter((finding) => finding.status === "fixed").length
  };
}

function writeDoctorSummary(logger, payload, format) {
  if (format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (format === "markdown") {
    logger.raw(
      [
        "# doctor",
        "",
        `- Status: ${payload.status}`,
        `- Strict: ${payload.strict}`,
        `- Fix: ${payload.fix}`,
        `- Config file: \`${payload.configFile}\``,
        `- Project: \`${payload.currentProject ?? ""}\``,
        `- Sprint: \`${payload.currentSprint ?? ""}\``,
        `- Summary: \`${JSON.stringify(payload.summary)}\``,
        `- Checks: \`${JSON.stringify(payload.checks)}\``
      ].join("\n"),
      { ignoreQuiet: true }
    );
    return;
  }

  if (payload.status === "pass") {
    logger.success("doctor checks passed");
  } else if (payload.status === "warn") {
    logger.warn("doctor checks completed with warnings");
  } else {
    logger.error("doctor checks failed");
  }

  logger.keyValue("Config file", toRelativePath(payload.cwd, payload.configFile));
  logger.keyValue("Project", payload.currentProject ?? "(unset)");
  logger.keyValue("Sprint", payload.currentSprint ?? "(unset)");
  logger.keyValue(
    "Summary",
    JSON.stringify({
      errors: payload.summary.errors,
      warnings: payload.summary.warnings,
      fixesApplied: payload.summary.fixesApplied
    })
  );

  for (const finding of payload.checks) {
    const summary = `${finding.id}: ${finding.message} [${finding.target}]`;

    if (finding.severity === "error") {
      logger.error(summary);
      continue;
    }

    if (finding.status === "fixed") {
      logger.success(summary);
      continue;
    }

    if (finding.severity === "warning") {
      logger.warn(summary);
      continue;
    }

    logger.info(summary);
  }
}

export function executeDoctorCommand(commandContext, logger) {
  const cwd = path.resolve(commandContext.globalOptions.cwd ?? process.cwd());
  const layout = resolveRepositoryLayout({ cwd });
  const configFilePath = commandContext.globalOptions.config
    ? path.resolve(cwd, commandContext.globalOptions.config)
    : layout.absolute.configFile;
  const strict = commandContext.commandOptions.strict === true;
  const fix = commandContext.commandOptions.fix === true;
  const findings = [createNodeVersionFinding()];
  const configFileFinding = createPathFinding({
    cwd,
    id: "config.main-file",
    category: "config",
    severity: "error",
    kind: "file",
    path: configFilePath,
    missingMessage: "Main governor config file is missing.",
    presentMessage: "Main governor config file is present.",
    suggestion: "Run `repo-ai-governor init` to bootstrap repository configuration."
  });

  findings.push(configFileFinding);

  let resolvedConfig = null;

  if (configFileFinding.status !== "fail") {
    try {
      resolvedConfig = loadResolvedConfig({
        cwd,
        configPath: commandContext.globalOptions.config,
        cliOverrides: {
          ...commandContext.globalOptions,
          ...commandContext.commandOptions
        }
      });
      findings.push(
        createFinding({
          id: "config.load",
          category: "config",
          severity: "info",
          status: "pass",
          message: "Governor configuration loaded successfully.",
          target: toRelativePath(cwd, resolvedConfig.paths.configFile)
        })
      );
    } catch (error) {
      if (error instanceof TypeError) {
        throw new InputError(error.message, {
          code: "cli.invalid_naming_convention",
          details: {
            project: commandContext.globalOptions.project,
            sprint: commandContext.globalOptions.sprint
          }
        });
      }

      if (error instanceof ConfigurationError) {
        findings.push(
          createFinding({
            id: "config.load",
            category: "config",
            severity: "error",
            status: "fail",
            message: error.message,
            target: toRelativePath(cwd, configFilePath),
            suggestion:
              "Fix the configuration error, or rerun `repo-ai-governor init` after reviewing repository settings."
          })
        );
      } else {
        throw error;
      }
    }
  }

  if (resolvedConfig) {
    if (!resolvedConfig.config.execution.currentProject) {
      findings.push(
        createFinding({
          id: "config.current-project",
          category: "config",
          severity: "warning",
          status: "warn",
          message: "Current project is not set in the resolved configuration.",
          target: toRelativePath(cwd, resolvedConfig.paths.configFile),
          suggestion: "Set execution.currentProject in governor.yaml or pass --project when running commands."
        })
      );
    }

    if (!resolvedConfig.config.execution.currentSprint) {
      findings.push(
        createFinding({
          id: "config.current-sprint",
          category: "config",
          severity: "warning",
          status: "warn",
          message: "Current sprint is not set in the resolved configuration.",
          target: toRelativePath(cwd, resolvedConfig.paths.configFile),
          suggestion: "Set execution.currentSprint in governor.yaml or pass --sprint when running commands."
        })
      );
    }

    const artifactPaths = buildArtifactPaths(cwd, resolvedConfig);
    const directoryChecks = [
      {
        id: "artifacts.config-root",
        path: artifactPaths.configRoot,
        message: "Config root directory is present."
      },
      {
        id: "artifacts.slots-directory",
        path: artifactPaths.slotsDir,
        message: "Slots directory is present."
      },
      {
        id: "artifacts.adapters-directory",
        path: artifactPaths.adaptersDir,
        message: "Adapters directory is present."
      },
      {
        id: "artifacts.reports-directory",
        path: artifactPaths.reportsDir,
        message: "Reports directory is present."
      },
      {
        id: "artifacts.templates-directory",
        path: artifactPaths.templatesDir,
        message: "Templates directory is present."
      },
      {
        id: "artifacts.context-directory",
        path: artifactPaths.contextDir,
        message: "Current context directory is present."
      }
    ];

    if (artifactPaths.sprintRoot) {
      directoryChecks.push(
        {
          id: "artifacts.sprint-directory",
          path: artifactPaths.sprintRoot,
          message: "Sprint root directory is present."
        },
        {
          id: "artifacts.tasks-directory",
          path: artifactPaths.tasksRoot,
          message: "Tasks directory is present."
        },
        {
          id: "artifacts.code-review-directory",
          path: artifactPaths.codeReviewRoot,
          message: "Code review directory is present."
        }
      );
    }

    for (const directoryCheck of directoryChecks) {
      const finding = createPathFinding({
        cwd,
        id: directoryCheck.id,
        category: "artifacts",
        severity: "warning",
        kind: "directory",
        path: directoryCheck.path,
        missingMessage: directoryCheck.message.replace("is present", "is missing"),
        presentMessage: directoryCheck.message,
        suggestion:
          "Run `repo-ai-governor doctor --fix` to create the missing directory, or rerun `repo-ai-governor init` after review.",
        fixable: true
      });

      finding.kind = "directory";
      finding.absoluteTarget = directoryCheck.path;
      findings.push(finding);
    }

    const fileChecks = [
      {
        id: "artifacts.agent-entry",
        path: artifactPaths.agentEntryPath,
        message: "Agent entry file is present."
      },
      {
        id: "artifacts.current-context-file",
        path: artifactPaths.contextFilePath,
        severity: "warning",
        message: "Current context file is present.",
        suggestion:
          "Generate the context file with `repo-ai-governor init --force` or create it manually."
      }
    ];

    if (artifactPaths.indexFile) {
      fileChecks.push(
        {
          id: "artifacts.sprint-index",
          path: artifactPaths.indexFile,
          message: "Sprint index file is present."
        },
        {
          id: "artifacts.sprint-plan",
          path: artifactPaths.planFile,
          message: "Sprint plan file is present."
        },
        {
          id: "artifacts.sprint-checklist",
          path: artifactPaths.checklistFile,
          message: "Sprint checklist file is present."
        },
        {
          id: "artifacts.sprint-task-csv",
          path: artifactPaths.taskCsvFile,
          message: "Sprint task CSV file is present."
        }
      );
    }

    for (const fileCheck of fileChecks) {
      findings.push(
        createPathFinding({
          cwd,
          id: fileCheck.id,
          category: "artifacts",
          severity: fileCheck.severity ?? "warning",
          kind: "file",
          path: fileCheck.path,
          missingMessage: fileCheck.message.replace("is present", "is missing"),
          presentMessage: fileCheck.message,
          suggestion:
            fileCheck.suggestion ??
            "Regenerate bootstrap files with `repo-ai-governor init --force` after reviewing existing repository state."
        })
      );
    }
  }

  const fixesApplied = fix ? applySafeFixes(findings) : 0;
  const summary = summarizeChecks(findings, strict, fixesApplied);
  const payload = buildDoctorPayload({
    status: summary.status,
    strict,
    fix,
    cwd,
    configFile: configFilePath,
    currentProject: resolvedConfig?.config.execution.currentProject,
    currentSprint: resolvedConfig?.config.execution.currentSprint,
    summary,
    checks: findings.map((finding) => ({
      id: finding.id,
      category: finding.category,
      severity: finding.severity,
      status: finding.status,
      message: finding.message,
      target: finding.target,
      suggestion: finding.suggestion,
      fixed: finding.fixed
    }))
  });

  writeDoctorSummary(logger, payload, commandContext.format);
  return summary.exitCode;
}
