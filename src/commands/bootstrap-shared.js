import path from "node:path";
import YAML from "yaml";
import { normalizeProjectSlug } from "../config/repository-layout.js";
import { renderInitDocument } from "./templates/init-documents.js";

export function toRelativePath(cwd, absolutePath) {
  const relativePath = path.relative(cwd, absolutePath).split(path.sep).join("/");
  return relativePath || ".";
}

export function ensureTrailingNewline(content) {
  return content.endsWith("\n") ? content : `${content}\n`;
}

export function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function buildAdapterTemplate(adapterId, locale) {
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

export function buildInitTemplateContext(config, options = {}) {
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

export function resolveSprintArtifacts(cwd, config) {
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

export function applyInitDefaults(config, cwd) {
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

export function applyConfigRootOverrides(config, cwd, configFilePath) {
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

export function buildGeneratedWorkspaceFiles(options) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const config = options.config;
  const configFilePath = options.configFilePath;
  const dateStamp = options.dateStamp ?? formatDate();
  const sprintArtifacts = resolveSprintArtifacts(cwd, config);
  const agentEntryPath = path.resolve(cwd, config.agentEntry.target);
  const contextFilePath = path.resolve(cwd, config.agentEntry.contextFile);
  const templateContext = buildInitTemplateContext(config, {
    dateStamp,
    configFilePath: toRelativePath(cwd, configFilePath),
    agentEntryPath: toRelativePath(cwd, agentEntryPath),
    contextFilePath: toRelativePath(cwd, contextFilePath)
  });

  const filesByKey = {
    config: {
      path: configFilePath,
      content: ensureTrailingNewline(YAML.stringify(config)),
      action: "update"
    },
    agentEntry: {
      path: agentEntryPath,
      content: renderInitDocument("agents", templateContext),
      action: "update"
    },
    currentContext: {
      path: contextFilePath,
      content: renderInitDocument("currentContext", templateContext),
      action: "update"
    },
    sprintIndex: {
      path: sprintArtifacts.indexFile,
      content: renderInitDocument("sprintIndex", templateContext),
      action: "update"
    },
    sprintPlan: {
      path: sprintArtifacts.planFile,
      content: renderInitDocument("sprintPlan", templateContext),
      action: "update"
    },
    checklist: {
      path: sprintArtifacts.checklistFile,
      content: renderInitDocument("checklist", templateContext),
      action: "update"
    },
    taskCsv: {
      path: sprintArtifacts.taskCsvFile,
      content: renderInitDocument("tasksCsv", templateContext),
      action: "update"
    }
  };

  const adapterFiles = Object.fromEntries(
    config.adapters.enabled.map((adapterId) => {
      const adapterFilePath = path.resolve(cwd, config.adapters.directory, `${adapterId}.yaml`);

      return [
        adapterId,
        {
          path: adapterFilePath,
          content: ensureTrailingNewline(
            YAML.stringify(buildAdapterTemplate(adapterId, config.standards.locales.default))
          ),
          action: "update"
        }
      ];
    })
  );

  return {
    sprintArtifacts,
    agentEntryPath,
    contextFilePath,
    filesByKey,
    adapterFiles
  };
}
