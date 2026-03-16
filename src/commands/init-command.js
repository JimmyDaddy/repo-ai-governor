import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import YAML from "yaml";
import { loadResolvedConfig } from "../config/load-config.js";
import { normalizeProjectSlug } from "../config/repository-layout.js";
import { ConfigError } from "../cli/runtime/errors.js";
import { renderInitDocument } from "./templates/init-documents.js";
import { loadOfficialSkillCatalog } from "../skills/catalog.js";
import {
  resolveSkillInstallTarget,
  validateSkillSurface,
  validateSkillScope
} from "../skills/runtime.js";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json");

function toRelativePath(cwd, absolutePath) {
  const relativePath = path.relative(cwd, absolutePath).split(path.sep).join("/");
  return relativePath || ".";
}

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function buildAdapterTemplate(adapterId, locale) {
  return {
    id: adapterId,
    version: "1",
    type: "ide-or-cli",
    enabled: true,
    capabilities: {
      promptInjection: true,
      structuredOutput: true,
      toolCalling: true
    },
    injection: {
      mode: "file-and-template",
      sources: ["standards", "workflow", "slots"]
    },
    render: {
      locale,
      views: ["ai"]
    },
    policy: {
      strictWorkflow: true,
      nonInteractiveSafe: true,
      allowAutonomousExecution: false
    }
  };
}

function ensureTrailingNewline(content) {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function isNpxInvocation() {
  return process.env.npm_command === "exec" || process.env.npm_lifecycle_event === "npx";
}

function normalizePackageName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sortObjectKeys(value) {
  return Object.fromEntries(
    Object.entries(value ?? {}).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  );
}

function resolvePackageManager(cwd) {
  const npmExecPath = process.env.npm_execpath ?? "";

  if (npmExecPath.includes("pnpm")) {
    return {
      name: "pnpm",
      installCommand: ["pnpm", "add", "--save-dev"]
    };
  }

  if (npmExecPath.includes("yarn")) {
    return {
      name: "yarn",
      installCommand: ["yarn", "add", "--dev"]
    };
  }

  if (npmExecPath.includes("bun")) {
    return {
      name: "bun",
      installCommand: ["bun", "add", "--dev"]
    };
  }

  if (fs.existsSync(path.resolve(cwd, "pnpm-lock.yaml"))) {
    return {
      name: "pnpm",
      installCommand: ["pnpm", "add", "--save-dev"]
    };
  }

  if (fs.existsSync(path.resolve(cwd, "yarn.lock"))) {
    return {
      name: "yarn",
      installCommand: ["yarn", "add", "--dev"]
    };
  }

  if (
    fs.existsSync(path.resolve(cwd, "bun.lockb")) ||
    fs.existsSync(path.resolve(cwd, "bun.lock"))
  ) {
    return {
      name: "bun",
      installCommand: ["bun", "add", "--dev"]
    };
  }

  return {
    name: "npm",
    installCommand: ["npm", "install", "--save-dev"]
  };
}

function ensureLocalPackageManifest(cwd, dependencyName, dependencyVersionRange) {
  const packageFilePath = path.resolve(cwd, "package.json");
  const packageFileExists = fs.existsSync(packageFilePath);
  let packageDocument = {};

  if (packageFileExists) {
    try {
      packageDocument = JSON.parse(fs.readFileSync(packageFilePath, "utf8"));
    } catch (error) {
      throw new ConfigError(`Failed to parse package.json: ${packageFilePath}`, {
        code: "cli.init_package_json_parse_failed",
        details: {
          packageFilePath,
          cause: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }

  if (!packageDocument.name) {
    packageDocument.name = normalizePackageName(path.basename(cwd)) || "repo-ai-governor-workspace";
  }

  if (!packageDocument.version) {
    packageDocument.version = "0.0.0";
  }

  if (typeof packageDocument.private !== "boolean") {
    packageDocument.private = true;
  }

  const currentVersionRange =
    packageDocument.devDependencies?.[dependencyName] ??
    packageDocument.dependencies?.[dependencyName] ??
    packageDocument.optionalDependencies?.[dependencyName] ??
    null;
  const shouldWriteDependency = currentVersionRange !== dependencyVersionRange;

  if (!packageDocument.devDependencies || typeof packageDocument.devDependencies !== "object") {
    packageDocument.devDependencies = {};
  }

  packageDocument.devDependencies[dependencyName] = dependencyVersionRange;
  packageDocument.devDependencies = sortObjectKeys(packageDocument.devDependencies);

  const serializedPackageDocument = `${JSON.stringify(packageDocument, null, 2)}\n`;
  const previousSerializedContent = packageFileExists ? fs.readFileSync(packageFilePath, "utf8") : "";
  const contentChanged = previousSerializedContent !== serializedPackageDocument;

  if (contentChanged) {
    fs.writeFileSync(packageFilePath, serializedPackageDocument, "utf8");
  }

  return {
    packageFilePath,
    packageCreated: !packageFileExists,
    packageUpdated: contentChanged,
    dependencyName,
    dependencyVersionRange,
    dependencyAddedOrUpdated: shouldWriteDependency
  };
}

function installLocalToolDependency(
  cwd,
  dependencyName,
  dependencyVersionRange,
  options = {}
) {
  const installTargetOverride = options.installTargetOverride?.trim() || null;
  const saveDependency = options.saveDependency !== false;
  const installTarget = installTargetOverride ?? `${dependencyName}@${dependencyVersionRange}`;

  if (installTargetOverride) {
    const result = spawnSync("npm", ["install", "--no-save", installTarget], {
      cwd,
      encoding: "utf8"
    });

    if (result.status !== 0) {
      throw new ConfigError(`Failed to install ${installTarget} via npm.`, {
        code: "cli.init_dependency_install_failed",
        details: {
          packageManager: "npm",
          command: "npm",
          args: ["install", "--no-save", installTarget],
          stdout: result.stdout,
          stderr: result.stderr
        }
      });
    }

    return {
      packageManager: "npm",
      command: "npm",
      args: ["install", "--no-save", installTarget],
      installTarget
    };
  }

  const packageManager = resolvePackageManager(cwd);
  const [command, ...baseArgs] = packageManager.installCommand;
  const installArgs = saveDependency ? [...baseArgs, installTarget] : [installTarget];
  const result = spawnSync(command, installArgs, {
    cwd,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new ConfigError(`Failed to install ${installTarget} via ${packageManager.name}.`, {
      code: "cli.init_dependency_install_failed",
      details: {
        packageManager: packageManager.name,
        command,
        args: installArgs,
        stdout: result.stdout,
        stderr: result.stderr
      }
    });
  }

  return {
    packageManager: packageManager.name,
    command,
    args: installArgs,
    installTarget
  };
}

function installBundledSkills(options) {
  const {
    cwd,
    surfaces,
    scope = "repo",
    force = false,
    dryRun = false
  } = options;
  const normalizedScope = validateSkillScope(scope);
  const normalizedSurfaces = [...new Set(surfaces.map((surface) => validateSkillSurface(surface)))];
  const catalogState = loadOfficialSkillCatalog({ cwd });
  const operations = [];
  const targetRoots = [];

  for (const surface of normalizedSurfaces) {
    const target = resolveSkillInstallTarget({
      cwd,
      surface,
      scope: normalizedScope
    });
    const surfaceSkills = catalogState.skills.filter((skill) => skill.surfaces.includes(surface));
    targetRoots.push(target.targetPath);

    if (!dryRun && surfaceSkills.length > 0) {
      fs.mkdirSync(target.targetPath, { recursive: true });
    }

    for (const skill of surfaceSkills) {
      const destinationRoot = path.resolve(target.targetPath, skill.id);
      const destinationExists = fs.existsSync(destinationRoot);

      if (destinationExists && !force) {
        operations.push({
          id: skill.id,
          surface,
          status: "skipped",
          path: destinationRoot,
          reason: "already-installed"
        });
        continue;
      }

      if (!dryRun) {
        fs.rmSync(destinationRoot, { recursive: true, force: true });
        fs.cpSync(skill.skillRoot, destinationRoot, { recursive: true });
      }

      operations.push({
        id: skill.id,
        surface,
        status: dryRun ? "planned" : "installed",
        path: destinationRoot,
        mode: skill.defaultInstallMode
      });
    }
  }

  return {
    catalogPath: catalogState.catalogPath,
    operations,
    targetRoots
  };
}

function buildInitTemplateContext(config, options = {}) {
  const currentProject = config.execution.currentProject;
  const currentSprint = config.execution.currentSprint;

  return {
    locale: config.standards.locales.default,
    currentProject,
    currentSprint,
    dateStamp: options.dateStamp ?? formatDate(),
    docsRoot: `${config.artifacts.baseDir}/${currentProject}/${currentSprint}`,
    planFileName: config.artifacts.files.plan,
    planRelativePath: `./${config.artifacts.files.plan}`,
    tasksDirectoryName: config.artifacts.directories.tasks,
    checklistFileName: config.artifacts.taskFiles.checklist,
    checklistRelativePath: `./${config.artifacts.directories.tasks}/${config.artifacts.taskFiles.checklist}`,
    taskCsvFileName: config.artifacts.taskFiles.csv,
    taskCsvRelativePath: `./${config.artifacts.directories.tasks}/${config.artifacts.taskFiles.csv}`,
    codeReviewDirectoryName: config.artifacts.directories.codeReview,
    configFilePath: options.configFilePath ?? ".repo-ai-governor/governor.yaml",
    agentEntryPath: options.agentEntryPath ?? config.agentEntry.target,
    contextFilePath: options.contextFilePath ?? config.agentEntry.contextFile,
    enabledAdaptersMarkdown:
      config.adapters.enabled.length > 0
        ? config.adapters.enabled.map((adapterId) => `\`${adapterId}\``).join(", ")
        : "`none`",
    csvColumns: config.artifacts.taskFiles.csvColumns
  };
}

function resolveSprintArtifacts(cwd, config) {
  const projectRoot = path.resolve(cwd, config.artifacts.baseDir, config.execution.currentProject);
  const sprintRoot = path.resolve(projectRoot, config.execution.currentSprint);
  const tasksRoot = path.resolve(sprintRoot, config.artifacts.directories.tasks);
  const codeReviewRoot = path.resolve(sprintRoot, config.artifacts.directories.codeReview);

  return {
    projectRoot,
    sprintRoot,
    tasksRoot,
    codeReviewRoot,
    indexFile: path.resolve(sprintRoot, config.artifacts.files.index),
    planFile: path.resolve(sprintRoot, config.artifacts.files.plan),
    checklistFile: path.resolve(tasksRoot, config.artifacts.taskFiles.checklist),
    taskCsvFile: path.resolve(tasksRoot, config.artifacts.taskFiles.csv)
  };
}

function applyInitDefaults(config, cwd) {
  const repositoryName = path.basename(cwd);

  if (!config.project.name) {
    config.project.name = repositoryName;
  }

  if (!config.execution.currentProject) {
    config.execution.currentProject = normalizeProjectSlug(repositoryName);
  }

  if (!config.execution.currentSprint) {
    config.execution.currentSprint = "sprint-001";
  }

  if (!Array.isArray(config.adapters.enabled) || config.adapters.enabled.length === 0) {
    config.adapters.enabled = ["codex"];
  }

  return config;
}

function applyConfigRootOverrides(config, cwd, configFilePath) {
  const configRootAbsolutePath = path.dirname(configFilePath);
  const configRootRelativePath = toRelativePath(cwd, configRootAbsolutePath);

  if (configRootRelativePath === ".repo-ai-governor") {
    return config;
  }

  const basePath = configRootRelativePath === "." ? "" : configRootRelativePath;
  const joinPath = (entry) => (basePath ? `${basePath}/${entry}` : entry);

  config.slots.directory = joinPath("slots");
  config.adapters.directory = joinPath("adapters");
  config.reporting.outputDir = joinPath("reports");
  config.agentEntry.contextFile = joinPath("context/current-context.md");

  return config;
}

function buildInitPlan(commandContext) {
  const cwd = path.resolve(commandContext.globalOptions.cwd ?? process.cwd());
  const resolved = loadResolvedConfig({
    cwd,
    configPath: commandContext.globalOptions.config,
    cliOverrides: {
      ...commandContext.globalOptions,
      ...commandContext.commandOptions
    },
    skipEnabledDefinitionCheck: true
  });
  const config = applyConfigRootOverrides(
    applyInitDefaults(structuredClone(resolved.config), cwd),
    cwd,
    resolved.paths.configFile
  );
  const dateStamp = formatDate();
  const sprintArtifacts = resolveSprintArtifacts(cwd, config);
  const agentEntryPath = path.resolve(cwd, config.agentEntry.target);
  const contextFilePath = path.resolve(cwd, config.agentEntry.contextFile);
  const templateContext = buildInitTemplateContext(config, {
    dateStamp,
    configFilePath: toRelativePath(cwd, resolved.paths.configFile),
    agentEntryPath: toRelativePath(cwd, agentEntryPath),
    contextFilePath: toRelativePath(cwd, contextFilePath)
  });

  const directories = [
    path.dirname(resolved.paths.configFile),
    path.resolve(cwd, config.slots.directory),
    path.resolve(cwd, config.adapters.directory),
    path.resolve(cwd, config.reporting.outputDir),
    path.resolve(path.dirname(resolved.paths.configFile), "templates"),
    path.dirname(contextFilePath),
    sprintArtifacts.projectRoot,
    sprintArtifacts.sprintRoot,
    sprintArtifacts.tasksRoot,
    sprintArtifacts.codeReviewRoot
  ];

  if (path.dirname(agentEntryPath) !== cwd) {
    directories.push(path.dirname(agentEntryPath));
  }

  const files = [
    {
      path: resolved.paths.configFile,
      content: ensureTrailingNewline(YAML.stringify(config)),
      action: fs.existsSync(resolved.paths.configFile) ? "update" : "create"
    },
    {
      path: agentEntryPath,
      content: renderInitDocument("agents", templateContext),
      action: fs.existsSync(agentEntryPath) ? "update" : "create"
    },
    {
      path: contextFilePath,
      content: renderInitDocument("currentContext", templateContext),
      action: fs.existsSync(contextFilePath) ? "update" : "create"
    },
    {
      path: sprintArtifacts.indexFile,
      content: renderInitDocument("sprintIndex", templateContext),
      action: fs.existsSync(sprintArtifacts.indexFile) ? "update" : "create"
    },
    {
      path: sprintArtifacts.planFile,
      content: renderInitDocument("sprintPlan", templateContext),
      action: fs.existsSync(sprintArtifacts.planFile) ? "update" : "create"
    },
    {
      path: sprintArtifacts.checklistFile,
      content: renderInitDocument("checklist", templateContext),
      action: fs.existsSync(sprintArtifacts.checklistFile) ? "update" : "create"
    },
    {
      path: sprintArtifacts.taskCsvFile,
      content: renderInitDocument("tasksCsv", templateContext),
      action: fs.existsSync(sprintArtifacts.taskCsvFile) ? "update" : "create"
    },
    {
      path: path.resolve(cwd, config.adapters.directory, "README.md"),
      content: renderInitDocument("adaptersReadme", templateContext),
      action: fs.existsSync(path.resolve(cwd, config.adapters.directory, "README.md"))
        ? "update"
        : "create"
    },
    {
      path: path.resolve(cwd, config.slots.directory, "README.md"),
      content: renderInitDocument("slotsReadme", templateContext),
      action: fs.existsSync(path.resolve(cwd, config.slots.directory, "README.md")) ? "update" : "create"
    },
    {
      path: path.resolve(path.dirname(resolved.paths.configFile), "templates", "README.md"),
      content: renderInitDocument("templatesReadme", templateContext),
      action: fs.existsSync(path.resolve(path.dirname(resolved.paths.configFile), "templates", "README.md"))
        ? "update"
        : "create"
    },
    {
      path: path.resolve(cwd, config.reporting.outputDir, "README.md"),
      content: renderInitDocument("reportsReadme", templateContext),
      action: fs.existsSync(path.resolve(cwd, config.reporting.outputDir, "README.md"))
        ? "update"
        : "create"
    }
  ];

  for (const adapterId of config.adapters.enabled) {
    const adapterFilePath = path.resolve(cwd, config.adapters.directory, `${adapterId}.yaml`);
    files.push({
      path: adapterFilePath,
      content: ensureTrailingNewline(
        YAML.stringify(buildAdapterTemplate(adapterId, config.standards.locales.default))
      ),
      action: fs.existsSync(adapterFilePath) ? "update" : "create"
    });
  }

  return {
    cwd,
    config,
    configFilePath: resolved.paths.configFile,
    agentEntryPath,
    contextFilePath,
    sprintArtifacts,
    directories: [...new Set(directories)],
    files
  };
}

function detectConflicts(files) {
  return files.filter((file) => fs.existsSync(file.path)).map((file) => file.path);
}

function renderInitPayload(plan, commandContext, options = {}) {
  return {
    command: "init",
    status: options.dryRun ? "planned" : "initialized",
    dryRun: options.dryRun,
    force: commandContext.commandOptions.force === true,
    cwd: plan.cwd,
    configFile: plan.configFilePath,
    agentEntry: plan.agentEntryPath,
    contextFile: plan.contextFilePath,
    currentProject: plan.config.execution.currentProject,
    currentSprint: plan.config.execution.currentSprint,
    enabledAdapters: plan.config.adapters.enabled,
    dependencyBootstrap: options.dependencyBootstrap ?? null,
    skillBootstrap: options.skillBootstrap ?? null,
    directories: plan.directories.map((directoryPath) => toRelativePath(plan.cwd, directoryPath)),
    files: plan.files.map((file) => ({
      path: toRelativePath(plan.cwd, file.path),
      action: file.action
    }))
  };
}

function writeInitSummary(logger, payload, format) {
  if (format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (format === "markdown") {
    logger.raw(
      [
        "# init",
        "",
        `- Status: ${payload.status}`,
        `- Dry run: ${payload.dryRun}`,
        `- Config file: \`${payload.configFile}\``,
        `- Context file: \`${payload.contextFile}\``,
        `- Project: \`${payload.currentProject}\``,
        `- Sprint: \`${payload.currentSprint}\``,
        `- Enabled adapters: \`${JSON.stringify(payload.enabledAdapters)}\``,
        `- Directories: \`${JSON.stringify(payload.directories)}\``,
        `- Files: \`${JSON.stringify(payload.files)}\``
      ].join("\n"),
      { ignoreQuiet: true }
    );
    return;
  }

  logger.success(payload.dryRun ? "init plan is ready" : "repository init completed");
  logger.keyValue("Config file", toRelativePath(payload.cwd, payload.configFile));
  logger.keyValue("Agent entry", toRelativePath(payload.cwd, payload.agentEntry));
  logger.keyValue("Context file", toRelativePath(payload.cwd, payload.contextFile));
  logger.keyValue("Project", payload.currentProject);
  logger.keyValue("Sprint", payload.currentSprint);
  logger.keyValue("Enabled adapters", JSON.stringify(payload.enabledAdapters));
  if (payload.dependencyBootstrap) {
    logger.keyValue("Dependency bootstrap", JSON.stringify(payload.dependencyBootstrap));
  }
  if (payload.skillBootstrap) {
    logger.keyValue("Skill bootstrap", JSON.stringify(payload.skillBootstrap));
  }
  logger.keyValue("Directories", JSON.stringify(payload.directories));
  logger.keyValue("Files", JSON.stringify(payload.files));
}

export function executeInitCommand(commandContext, logger) {
  const plan = buildInitPlan(commandContext);
  const conflicts = detectConflicts(plan.files);
  const dryRun = commandContext.globalOptions.dryRun === true;
  const force = commandContext.commandOptions.force === true;
  const selfInstallRequested = commandContext.commandOptions.selfInstall === true;
  const skipSelfInstall = commandContext.commandOptions.skipSelfInstall === true;
  const skipSkillInstall = commandContext.commandOptions.skipSkillInstall === true;
  const selfInstallSource = process.env.REPO_AI_GOVERNOR_SELF_INSTALL_SOURCE?.trim() || null;
  const shouldSelfInstall = !dryRun && !skipSelfInstall && (selfInstallRequested || isNpxInvocation());
  const shouldInstallSkills = !dryRun && !skipSkillInstall;
  const dependencyBootstrap = {
    enabled: shouldSelfInstall,
    reason: shouldSelfInstall ? (selfInstallRequested ? "explicit" : "npx-auto") : "disabled",
    packageName: packageJson.name,
    versionRange: `^${packageJson.version}`,
    installSource: selfInstallSource ? "override" : "registry"
  };
  let skillBootstrap = {
    enabled: shouldInstallSkills,
    surfaces: plan.config.adapters.enabled,
    operations: [],
    targetRoots: []
  };

  if (conflicts.length > 0 && !dryRun && !force) {
    throw new ConfigError("Refusing to overwrite existing init targets without --force", {
      code: "cli.init_conflict",
      details: {
        conflicts
      }
    });
  }

  if (!dryRun) {
    for (const directoryPath of plan.directories) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    for (const file of plan.files) {
      fs.writeFileSync(file.path, file.content, "utf8");
    }

    if (shouldSelfInstall) {
      const manifestResult = ensureLocalPackageManifest(
        plan.cwd,
        packageJson.name,
        dependencyBootstrap.versionRange
      );
      const installResult = installLocalToolDependency(
        plan.cwd,
        packageJson.name,
        dependencyBootstrap.versionRange,
        {
          installTargetOverride: selfInstallSource,
          saveDependency: !selfInstallSource
        }
      );

      dependencyBootstrap.packageFile = toRelativePath(plan.cwd, manifestResult.packageFilePath);
      dependencyBootstrap.packageCreated = manifestResult.packageCreated;
      dependencyBootstrap.packageUpdated = manifestResult.packageUpdated;
      dependencyBootstrap.dependencyAddedOrUpdated = manifestResult.dependencyAddedOrUpdated;
      dependencyBootstrap.packageManager = installResult.packageManager;
      dependencyBootstrap.installCommand = [installResult.command, ...installResult.args].join(" ");
      dependencyBootstrap.installTarget = installResult.installTarget;
    }

    if (shouldInstallSkills) {
      const installState = installBundledSkills({
        cwd: plan.cwd,
        surfaces: plan.config.adapters.enabled,
        force
      });

      skillBootstrap = {
        ...skillBootstrap,
        catalogPath: toRelativePath(plan.cwd, installState.catalogPath),
        targetRoots: installState.targetRoots.map((targetRoot) => toRelativePath(plan.cwd, targetRoot)),
        operations: installState.operations.map((operation) => ({
          ...operation,
          path: toRelativePath(plan.cwd, operation.path)
        })),
        summary: {
          installed: installState.operations.filter((operation) => operation.status === "installed")
            .length,
          skipped: installState.operations.filter((operation) => operation.status === "skipped").length
        }
      };
    }
  }

  writeInitSummary(
    logger,
    renderInitPayload(plan, commandContext, { dryRun, dependencyBootstrap, skillBootstrap }),
    commandContext.format
  );
}
