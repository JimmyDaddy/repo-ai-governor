import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { InputError } from "../cli/runtime/errors.js";
import { EXIT_CODES } from "../cli/runtime/exit-codes.js";
import { ConfigurationError } from "../config/errors.js";
import { loadResolvedConfig } from "../config/load-config.js";
import { resolveRepositoryLayout } from "../config/repository-layout.js";
import type { ParsedOptions } from "../types/aliases/cli.type.js";
import type {
  FindingKind,
  FindingSeverity,
  FindingStatus,
  VersionParts,
} from "../types/aliases/command.type.js";
import type { CommandContext } from "../types/interfaces/cli-runtime.interface.js";
import type { Logger } from "../types/interfaces/cli-ui.interface.js";
import type {
  DoctorArtifactPaths as ArtifactPaths,
  DoctorDirectoryCheck as DirectoryCheck,
  DoctorPayload,
  DoctorSummary,
  DoctorFileCheck as FileCheck,
  DoctorFinding as Finding,
  DoctorFindingDraft as FindingDraft,
  DoctorPackageJsonLike as PackageJsonLike,
  DoctorPathFindingOptions as PathFindingOptions,
  DoctorResolvedConfig as ResolvedConfig,
} from "../types/interfaces/command-doctor.interface.js";
import { normalizeLocale, toRelativePath, translateLocale } from "../utils/common.js";

const require = createRequire(import.meta.url);
// dynamic-import-allowed: read package engines/version from package metadata during doctor checks
const packageJson = require("../../package.json") as PackageJsonLike;

function t(locale: string | null | undefined, zhCN: string, enUS: string): string {
  return translateLocale(locale, zhCN, enUS);
}

function getStringOption(options: ParsedOptions, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" ? value : undefined;
}

function resolveLocale(
  commandContext: CommandContext,
  resolvedConfig: ResolvedConfig | null = null,
): string {
  return normalizeLocale(
    getStringOption(commandContext.globalOptions, "locale") ??
      resolvedConfig?.config?.standards?.locales?.default ??
      "zh-CN",
  );
}

function parseVersion(value: unknown): VersionParts | null {
  const match = String(value)
    .trim()
    .match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/);

  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

function compareVersions(left: number[], right: number[]): number {
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

function parseMinimumVersion(engineRange: unknown): VersionParts | null {
  const match = String(engineRange ?? "")
    .trim()
    .match(/^>=\s*(\d+(?:\.\d+)?(?:\.\d+)?)/);
  return match ? parseVersion(match[1]) : null;
}

function createFinding(options: FindingDraft): Finding {
  return {
    id: options.id,
    category: options.category,
    severity: options.severity,
    status: options.status ?? (options.severity === "error" ? "fail" : "pass"),
    message: options.message,
    target: options.target,
    suggestion: options.suggestion,
    fixable: options.fixable ?? false,
    fixed: options.fixed ?? false,
  };
}

function createNodeVersionFinding(locale = "zh-CN"): Finding {
  const engineRequirement = packageJson.engines?.node;
  const runtimeVersion = parseVersion(process.versions.node);
  const minimumVersion = parseMinimumVersion(engineRequirement);
  const target = `node ${process.versions.node}`;

  if (!runtimeVersion || !minimumVersion || !engineRequirement) {
    return createFinding({
      id: "environment.node-version",
      category: "environment",
      severity: "warning",
      status: "warn",
      message: t(
        locale,
        "无法基于 package engines 校验当前 Node.js 版本。",
        "Unable to validate Node.js version against package engines.",
      ),
      target,
      suggestion: t(
        locale,
        "请检查 package.json 的 engines.node，并手动确认当前运行时版本。",
        "Review package.json engines.node and verify the active runtime manually.",
      ),
    });
  }

  if (compareVersions(runtimeVersion, minimumVersion) < 0) {
    return createFinding({
      id: "environment.node-version",
      category: "environment",
      severity: "error",
      status: "fail",
      message: t(
        locale,
        `Node.js ${process.versions.node} 不满足 ${engineRequirement} 要求。`,
        `Node.js ${process.versions.node} does not satisfy ${engineRequirement}.`,
      ),
      target,
      suggestion: t(
        locale,
        `请先升级 Node.js 至 ${engineRequirement} 或更高版本，再运行 CLI。`,
        `Upgrade Node.js to ${engineRequirement} or newer before running the CLI.`,
      ),
    });
  }

  return createFinding({
    id: "environment.node-version",
    category: "environment",
    severity: "info",
    status: "pass",
    message: t(
      locale,
      `Node.js ${process.versions.node} 满足 ${engineRequirement} 要求。`,
      `Node.js ${process.versions.node} satisfies ${engineRequirement}.`,
    ),
    target,
  });
}

function createPathFinding(options: PathFindingOptions): Finding {
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
      fixable: options.fixable,
    });
  }

  if (options.kind === "directory" && !fs.statSync(options.path).isDirectory()) {
    return createFinding({
      id: options.id,
      category: options.category,
      severity: "error",
      status: "fail",
      message: t(
        options.locale,
        "目标目录路径存在，但不是目录。",
        "Expected directory path exists but is not a directory.",
      ),
      target: relativeTarget,
      suggestion: t(
        options.locale,
        "请将该路径替换为目录，或更新仓库配置。",
        "Replace the path with a directory or update the repository configuration.",
      ),
    });
  }

  if (options.kind === "file" && !fs.statSync(options.path).isFile()) {
    return createFinding({
      id: options.id,
      category: options.category,
      severity: "error",
      status: "fail",
      message: t(
        options.locale,
        "目标文件路径存在，但不是普通文件。",
        "Expected file path exists but is not a regular file.",
      ),
      target: relativeTarget,
      suggestion: t(
        options.locale,
        "请将该路径替换为文件，或更新仓库配置。",
        "Replace the path with a file or update the repository configuration.",
      ),
    });
  }

  return createFinding({
    id: options.id,
    category: options.category,
    severity: "info",
    status: "pass",
    message: options.presentMessage,
    target: relativeTarget,
  });
}

function buildDoctorPayload(options: Omit<DoctorPayload, "command">): DoctorPayload {
  return {
    command: "doctor",
    status: options.status,
    locale: options.locale,
    strict: options.strict,
    fix: options.fix,
    cwd: options.cwd,
    configFile: options.configFile,
    currentProject: options.currentProject,
    currentSprint: options.currentSprint,
    summary: options.summary,
    checks: options.checks,
  };
}

function buildArtifactPaths(cwd: string, resolvedConfig: ResolvedConfig): ArtifactPaths {
  const configFile = resolvedConfig.paths.configFile;
  const configRoot = path.dirname(configFile);
  const currentProject = resolvedConfig.config.execution.currentProject;
  const currentSprint = resolvedConfig.config.execution.currentSprint;
  const reportingDir = path.resolve(cwd, resolvedConfig.config.reporting.outputDir);
  const templatesDir = path.resolve(configRoot, "templates");
  const agentEntryPath = path.resolve(cwd, resolvedConfig.config.agentEntry.target);
  const contextFilePath = path.resolve(cwd, resolvedConfig.config.agentEntry.contextFile);
  const artifactPaths: ArtifactPaths = {
    configRoot,
    contextDir: path.dirname(contextFilePath),
    contextFilePath,
    slotsDir: resolvedConfig.paths.slotsDirectory,
    adaptersDir: resolvedConfig.paths.adaptersDirectory,
    reportsDir: reportingDir,
    templatesDir,
    agentEntryPath,
  };

  if (currentProject && currentSprint) {
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

    artifactPaths.sprintRoot = sprintRoot;
    artifactPaths.tasksRoot = tasksRoot;
    artifactPaths.codeReviewRoot = codeReviewRoot;
    artifactPaths.indexFile = path.resolve(sprintRoot, resolvedConfig.config.artifacts.files.index);
    artifactPaths.planFile = path.resolve(sprintRoot, resolvedConfig.config.artifacts.files.plan);
    artifactPaths.checklistFile = path.resolve(
      tasksRoot,
      resolvedConfig.config.artifacts.taskFiles.checklist,
    );
    artifactPaths.taskCsvFile = path.resolve(
      tasksRoot,
      resolvedConfig.config.artifacts.taskFiles.csv,
    );
  }

  return artifactPaths;
}

function applySafeFixes(findings: Finding[], locale: string): number {
  let fixesApplied = 0;

  for (const finding of findings) {
    if (!finding.fixable || finding.severity !== "warning" || finding.kind !== "directory") {
      continue;
    }

    if (!finding.absoluteTarget) {
      continue;
    }

    fs.mkdirSync(finding.absoluteTarget, { recursive: true });
    finding.status = "fixed";
    finding.fixed = true;
    finding.message = `${finding.message} ${t(locale, "已由 --fix 自动创建。", "Automatically created by --fix.")}`;
    fixesApplied += 1;
  }

  return fixesApplied;
}

function summarizeChecks(
  findings: Finding[],
  strict: boolean,
  fixesApplied: number,
): DoctorSummary {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter(
    (finding) => finding.severity === "warning" && finding.status !== "fixed",
  ).length;

  let status: DoctorSummary["status"] = "pass";
  let exitCode: (typeof EXIT_CODES)[keyof typeof EXIT_CODES] = EXIT_CODES.success;

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
    fixed: findings.filter((finding) => finding.status === "fixed").length,
  };
}

function writeDoctorSummary(logger: Logger, payload: DoctorPayload, format: string): void {
  const locale = normalizeLocale(payload.locale);

  if (format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (format === "markdown") {
    logger.raw(
      [
        "# doctor",
        "",
        `- ${t(locale, "状态", "Status")}: ${payload.status}`,
        `- ${t(locale, "严格模式", "Strict")}: ${payload.strict}`,
        `- ${t(locale, "自动修复", "Fix")}: ${payload.fix}`,
        `- ${t(locale, "配置文件", "Config file")}: \`${payload.configFile}\``,
        `- ${t(locale, "项目", "Project")}: \`${payload.currentProject ?? ""}\``,
        `- ${t(locale, "Sprint", "Sprint")}: \`${payload.currentSprint ?? ""}\``,
        `- ${t(locale, "摘要", "Summary")}: \`${JSON.stringify(payload.summary)}\``,
        `- ${t(locale, "检查项", "Checks")}: \`${JSON.stringify(payload.checks)}\``,
      ].join("\n"),
      { ignoreQuiet: true },
    );
    return;
  }

  if (payload.status === "pass") {
    logger.success(t(locale, "doctor 检查通过", "doctor checks passed"));
  } else if (payload.status === "warn") {
    logger.warn(t(locale, "doctor 检查完成，存在告警", "doctor checks completed with warnings"));
  } else {
    logger.error(t(locale, "doctor 检查失败", "doctor checks failed"));
  }

  logger.keyValue(
    t(locale, "配置文件", "Config file"),
    toRelativePath(payload.cwd, payload.configFile),
  );
  logger.keyValue(
    t(locale, "项目", "Project"),
    payload.currentProject ?? t(locale, "(未设置)", "(unset)"),
  );
  logger.keyValue(
    t(locale, "Sprint", "Sprint"),
    payload.currentSprint ?? t(locale, "(未设置)", "(unset)"),
  );
  logger.keyValue(
    t(locale, "摘要", "Summary"),
    JSON.stringify({
      errors: payload.summary.errors,
      warnings: payload.summary.warnings,
      fixesApplied: payload.summary.fixesApplied,
    }),
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

export function executeDoctorCommand(commandContext: CommandContext, logger: Logger): number {
  const cwd = path.resolve(getStringOption(commandContext.globalOptions, "cwd") ?? process.cwd());
  const layout = resolveRepositoryLayout({ cwd });
  const configOverride = getStringOption(commandContext.globalOptions, "config");
  const configFilePath = configOverride
    ? path.resolve(cwd, configOverride)
    : layout.absolute.configFile;
  const strict = commandContext.commandOptions.strict === true;
  const fix = commandContext.commandOptions.fix === true;
  const locale = resolveLocale(commandContext);
  const findings: Finding[] = [createNodeVersionFinding(locale)];
  const configFileFinding = createPathFinding({
    locale,
    cwd,
    id: "config.main-file",
    category: "config",
    severity: "error",
    kind: "file",
    path: configFilePath,
    missingMessage: t(locale, "主配置文件缺失。", "Main governor config file is missing."),
    presentMessage: t(locale, "主配置文件已存在。", "Main governor config file is present."),
    suggestion: t(
      locale,
      "请执行 `repo-ai-governor init` 初始化仓库治理配置。",
      "Run `repo-ai-governor init` to bootstrap repository configuration.",
    ),
  });

  findings.push(configFileFinding);

  let resolvedConfig: ResolvedConfig | null = null;

  if (configFileFinding.status !== "fail") {
    try {
      resolvedConfig = loadResolvedConfig({
        cwd,
        configPath: configOverride,
        cliOverrides: {
          ...commandContext.globalOptions,
          ...commandContext.commandOptions,
        },
      }) as unknown as ResolvedConfig;
      findings.push(
        createFinding({
          id: "config.load",
          category: "config",
          severity: "info",
          status: "pass",
          message: t(locale, "治理配置加载成功。", "Governor configuration loaded successfully."),
          target: toRelativePath(cwd, resolvedConfig.paths.configFile),
        }),
      );
    } catch (error) {
      if (error instanceof TypeError) {
        throw new InputError(error.message, {
          code: "cli.invalid_naming_convention",
          details: {
            project: commandContext.globalOptions.project,
            sprint: commandContext.globalOptions.sprint,
          },
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
            suggestion: t(
              locale,
              "请先修复配置错误，或在确认仓库设置后重新执行 `repo-ai-governor init`。",
              "Fix the configuration error, or rerun `repo-ai-governor init` after reviewing repository settings.",
            ),
          }),
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
          message: t(
            locale,
            "解析后的配置未设置 currentProject。",
            "Current project is not set in the resolved configuration.",
          ),
          target: toRelativePath(cwd, resolvedConfig.paths.configFile),
          suggestion: t(
            locale,
            "请在 governor.yaml 设置 execution.currentProject，或执行命令时传入 --project。",
            "Set execution.currentProject in governor.yaml or pass --project when running commands.",
          ),
        }),
      );
    }

    if (!resolvedConfig.config.execution.currentSprint) {
      findings.push(
        createFinding({
          id: "config.current-sprint",
          category: "config",
          severity: "warning",
          status: "warn",
          message: t(
            locale,
            "解析后的配置未设置 currentSprint。",
            "Current sprint is not set in the resolved configuration.",
          ),
          target: toRelativePath(cwd, resolvedConfig.paths.configFile),
          suggestion: t(
            locale,
            "请在 governor.yaml 设置 execution.currentSprint，或执行命令时传入 --sprint。",
            "Set execution.currentSprint in governor.yaml or pass --sprint when running commands.",
          ),
        }),
      );
    }

    const artifactPaths = buildArtifactPaths(cwd, resolvedConfig);
    const directoryChecks: DirectoryCheck[] = [
      {
        id: "artifacts.config-root",
        path: artifactPaths.configRoot,
        presentMessage: t(locale, "配置根目录已存在。", "Config root directory is present."),
        missingMessage: t(locale, "配置根目录缺失。", "Config root directory is missing."),
      },
      {
        id: "artifacts.slots-directory",
        path: artifactPaths.slotsDir,
        presentMessage: t(locale, "slots 目录已存在。", "Slots directory is present."),
        missingMessage: t(locale, "slots 目录缺失。", "Slots directory is missing."),
      },
      {
        id: "artifacts.adapters-directory",
        path: artifactPaths.adaptersDir,
        presentMessage: t(locale, "adapters 目录已存在。", "Adapters directory is present."),
        missingMessage: t(locale, "adapters 目录缺失。", "Adapters directory is missing."),
      },
      {
        id: "artifacts.reports-directory",
        path: artifactPaths.reportsDir,
        presentMessage: t(locale, "reports 目录已存在。", "Reports directory is present."),
        missingMessage: t(locale, "reports 目录缺失。", "Reports directory is missing."),
      },
      {
        id: "artifacts.templates-directory",
        path: artifactPaths.templatesDir,
        presentMessage: t(locale, "templates 目录已存在。", "Templates directory is present."),
        missingMessage: t(locale, "templates 目录缺失。", "Templates directory is missing."),
      },
      {
        id: "artifacts.context-directory",
        path: artifactPaths.contextDir,
        presentMessage: t(
          locale,
          "current context 目录已存在。",
          "Current context directory is present.",
        ),
        missingMessage: t(
          locale,
          "current context 目录缺失。",
          "Current context directory is missing.",
        ),
      },
    ];

    const sprintRoot = artifactPaths.sprintRoot;
    const tasksRoot = artifactPaths.tasksRoot;
    const codeReviewRoot = artifactPaths.codeReviewRoot;

    if (sprintRoot && tasksRoot && codeReviewRoot) {
      directoryChecks.push(
        {
          id: "artifacts.sprint-directory",
          path: sprintRoot,
          presentMessage: t(locale, "sprint 根目录已存在。", "Sprint root directory is present."),
          missingMessage: t(locale, "sprint 根目录缺失。", "Sprint root directory is missing."),
        },
        {
          id: "artifacts.tasks-directory",
          path: tasksRoot,
          presentMessage: t(locale, "tasks 目录已存在。", "Tasks directory is present."),
          missingMessage: t(locale, "tasks 目录缺失。", "Tasks directory is missing."),
        },
        {
          id: "artifacts.code-review-directory",
          path: codeReviewRoot,
          presentMessage: t(
            locale,
            "code-review 目录已存在。",
            "Code review directory is present.",
          ),
          missingMessage: t(locale, "code-review 目录缺失。", "Code review directory is missing."),
        },
      );
    }

    for (const directoryCheck of directoryChecks) {
      const finding = createPathFinding({
        locale,
        cwd,
        id: directoryCheck.id,
        category: "artifacts",
        severity: "warning",
        kind: "directory",
        path: directoryCheck.path,
        missingMessage: directoryCheck.missingMessage,
        presentMessage: directoryCheck.presentMessage,
        suggestion: t(
          locale,
          "请执行 `repo-ai-governor doctor --fix` 创建缺失目录，或复核后重新执行 `repo-ai-governor init`。",
          "Run `repo-ai-governor doctor --fix` to create the missing directory, or rerun `repo-ai-governor init` after review.",
        ),
        fixable: true,
      });

      finding.kind = "directory";
      finding.absoluteTarget = directoryCheck.path;
      findings.push(finding);
    }

    const fileChecks: FileCheck[] = [
      {
        id: "artifacts.agent-entry",
        path: artifactPaths.agentEntryPath,
        presentMessage: t(locale, "Agent 入口文件已存在。", "Agent entry file is present."),
        missingMessage: t(locale, "Agent 入口文件缺失。", "Agent entry file is missing."),
      },
      {
        id: "artifacts.current-context-file",
        path: artifactPaths.contextFilePath,
        severity: "warning",
        presentMessage: t(
          locale,
          "current context 文件已存在。",
          "Current context file is present.",
        ),
        missingMessage: t(locale, "current context 文件缺失。", "Current context file is missing."),
        suggestion: t(
          locale,
          "请使用 `repo-ai-governor init --force` 生成 context 文件，或手动创建。",
          "Generate the context file with `repo-ai-governor init --force` or create it manually.",
        ),
      },
    ];

    const indexFile = artifactPaths.indexFile;
    const planFile = artifactPaths.planFile;
    const checklistFile = artifactPaths.checklistFile;
    const taskCsvFile = artifactPaths.taskCsvFile;

    if (indexFile && planFile && checklistFile && taskCsvFile) {
      fileChecks.push(
        {
          id: "artifacts.sprint-index",
          path: indexFile,
          presentMessage: t(locale, "sprint index 文件已存在。", "Sprint index file is present."),
          missingMessage: t(locale, "sprint index 文件缺失。", "Sprint index file is missing."),
        },
        {
          id: "artifacts.sprint-plan",
          path: planFile,
          presentMessage: t(locale, "sprint plan 文件已存在。", "Sprint plan file is present."),
          missingMessage: t(locale, "sprint plan 文件缺失。", "Sprint plan file is missing."),
        },
        {
          id: "artifacts.sprint-checklist",
          path: checklistFile,
          presentMessage: t(
            locale,
            "sprint checklist 文件已存在。",
            "Sprint checklist file is present.",
          ),
          missingMessage: t(
            locale,
            "sprint checklist 文件缺失。",
            "Sprint checklist file is missing.",
          ),
        },
        {
          id: "artifacts.sprint-task-csv",
          path: taskCsvFile,
          presentMessage: t(
            locale,
            "sprint tasks.csv 文件已存在。",
            "Sprint task CSV file is present.",
          ),
          missingMessage: t(
            locale,
            "sprint tasks.csv 文件缺失。",
            "Sprint task CSV file is missing.",
          ),
        },
      );
    }

    for (const fileCheck of fileChecks) {
      findings.push(
        createPathFinding({
          locale,
          cwd,
          id: fileCheck.id,
          category: "artifacts",
          severity: fileCheck.severity ?? "warning",
          kind: "file",
          path: fileCheck.path,
          missingMessage: fileCheck.missingMessage,
          presentMessage: fileCheck.presentMessage,
          suggestion:
            fileCheck.suggestion ??
            t(
              locale,
              "请在复核当前仓库状态后，通过 `repo-ai-governor init --force` 重新生成初始化文件。",
              "Regenerate bootstrap files with `repo-ai-governor init --force` after reviewing existing repository state.",
            ),
        }),
      );
    }
  }

  const fixesApplied = fix ? applySafeFixes(findings, locale) : 0;
  const summary = summarizeChecks(findings, strict, fixesApplied);
  const payload = buildDoctorPayload({
    status: summary.status,
    locale: resolveLocale(commandContext, resolvedConfig) ?? locale,
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
      fixed: finding.fixed,
    })),
  });

  writeDoctorSummary(logger, payload, commandContext.format);
  return summary.exitCode;
}
