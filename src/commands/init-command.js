import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { loadResolvedConfig } from "../config/load-config.js";
import { normalizeProjectSlug } from "../config/repository-layout.js";
import { ConfigError } from "../cli/runtime/errors.js";
import { renderInitDocument } from "./templates/init-documents.js";

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
  const templateContext = buildInitTemplateContext(config, {
    dateStamp,
    configFilePath: toRelativePath(cwd, resolved.paths.configFile),
    agentEntryPath: toRelativePath(cwd, agentEntryPath)
  });

  const directories = [
    path.dirname(resolved.paths.configFile),
    path.resolve(cwd, config.slots.directory),
    path.resolve(cwd, config.adapters.directory),
    path.resolve(cwd, config.reporting.outputDir),
    path.resolve(path.dirname(resolved.paths.configFile), "templates"),
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
    currentProject: plan.config.execution.currentProject,
    currentSprint: plan.config.execution.currentSprint,
    enabledAdapters: plan.config.adapters.enabled,
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
  logger.keyValue("Project", payload.currentProject);
  logger.keyValue("Sprint", payload.currentSprint);
  logger.keyValue("Enabled adapters", JSON.stringify(payload.enabledAdapters));
  logger.keyValue("Directories", JSON.stringify(payload.directories));
  logger.keyValue("Files", JSON.stringify(payload.files));
}

export function executeInitCommand(commandContext, logger) {
  const plan = buildInitPlan(commandContext);
  const conflicts = detectConflicts(plan.files);
  const dryRun = commandContext.globalOptions.dryRun === true;
  const force = commandContext.commandOptions.force === true;

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
  }

  writeInitSummary(logger, renderInitPayload(plan, commandContext, { dryRun }), commandContext.format);
}
