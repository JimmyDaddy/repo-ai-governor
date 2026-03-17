import fs from "node:fs";
import path from "node:path";
import { loadResolvedConfig } from "../config/load-config.js";
import { buildSlotRuntime, resolveApplicableSlots } from "../slots/runtime.js";
import {
  renderRulesForConsumer,
  resolveStandardsPackage
} from "../standards/official-base-package.js";
import {
  resolveWorkflowTemplate,
  STANDARD_WORKFLOW_STAGE_SEQUENCE
} from "../workflow/template-model.js";
import { selectWorkflowStages } from "../workflow/governance-engine.js";
import {
  cloneValue as cloneValueShared,
  toRelativePath as toRelativePathValue
} from "../utils/common.js";

export function toRelativePath(cwd, targetPath) {
  return toRelativePathValue(cwd, targetPath);
}

export function cloneValue(value) {
  return cloneValueShared(value);
}

export function ensureTrailingNewline(content) {
  return content.endsWith("\n") ? content : `${content}\n`;
}

export function readOptionalFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      content: null,
      excerpt: null
    };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const excerpt = content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .slice(0, 8)
    .join("\n");

  return {
    exists: true,
    content,
    excerpt
  };
}

export function buildArtifactPaths(cwd, config) {
  const currentProject = config.execution.currentProject;
  const currentSprint = config.execution.currentSprint;
  const sprintRoot = path.resolve(cwd, config.artifacts.baseDir, currentProject, currentSprint);
  const tasksRoot = path.resolve(sprintRoot, config.artifacts.directories.tasks);
  const codeReviewRoot = path.resolve(sprintRoot, config.artifacts.directories.codeReview);

  return {
    sprintRoot,
    tasksRoot,
    codeReviewRoot,
    planFile: path.resolve(sprintRoot, config.artifacts.files.plan),
    checklistFile: path.resolve(tasksRoot, config.artifacts.taskFiles.checklist),
    taskCsvFile: path.resolve(tasksRoot, config.artifacts.taskFiles.csv)
  };
}

export function normalizeCommandStage(command, stageId) {
  const normalizedCommand = command ?? "plan";
  const normalizedStageId = stageId ?? normalizedCommand;

  return {
    command: normalizedCommand,
    stageId: normalizedStageId
  };
}

export function renderStandardsSection(standardsPackage, consumer, locale) {
  return renderRulesForConsumer(standardsPackage, consumer, {
    view: "ai",
    locale
  }).map((ruleView, index) => ({
    order: index + 1,
    title: ruleView.title,
    instruction: ruleView.instruction,
    verification: ruleView.verification
  }));
}

export function renderSlotSummary(slotResolution) {
  return {
    active: slotResolution.activeSlots.map((slot) => ({
      id: slot.id,
      source: slot.source,
      slotType: slot.slotType,
      priority: slot.priority,
      promptKey: slot.inject.ai?.promptKey ?? null,
      docSection: slot.inject.human?.docSection ?? null,
      checks: cloneValue(slot.checks)
    })),
    blocked: cloneValue(slotResolution.blockedSlots),
    suppressed: cloneValue(slotResolution.suppressedSlots),
    injections: cloneValue(slotResolution.injections),
    checks: cloneValue(slotResolution.checks)
  };
}

export function buildBaseAdapterBundle(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const resolvedConfig =
    options.resolvedConfig ??
    loadResolvedConfig({
      cwd,
      configPath: options.configPath,
      cliOverrides: {
        project: options.project,
        sprint: options.sprint,
        locale: options.locale
      }
    });
  const locale = options.locale ?? resolvedConfig.config.standards.locales.default;
  const { command, stageId } = normalizeCommandStage(options.command, options.stageId);
  const workflowTemplate = resolveWorkflowTemplate(resolvedConfig.config.workflow);
  const standardsPackage = resolveStandardsPackage(resolvedConfig.config.standards);
  const slotRuntime = buildSlotRuntime({
    config: resolvedConfig.config,
    slotDefinitions: resolvedConfig.slotDefinitions
  });
  const slotResolution = resolveApplicableSlots(slotRuntime, {
    stageId,
    commandId: command,
    project: resolvedConfig.config.execution.currentProject,
    language: resolvedConfig.config.project.language,
    framework: resolvedConfig.config.project.framework,
    tags: options.tags ?? [],
    paths: options.paths ?? []
  });
  const artifactPaths = buildArtifactPaths(cwd, resolvedConfig.config);
  const adapterPreset = options.adapterPreset;
  const consumer = options.consumer ?? command;

  const bundle = {
    adapter: {
      id: adapterPreset.id,
      products: cloneValue(adapterPreset.targets.products),
      entrypoints: cloneValue(adapterPreset.targets.entrypoints),
      inputSources: cloneValue(adapterPreset.contract.input.sources),
      promptSections: cloneValue(adapterPreset.injection.promptSections)
    },
    runtime: {
      project: resolvedConfig.config.execution.currentProject,
      sprint: resolvedConfig.config.execution.currentSprint,
      command,
      stageId,
      language: resolvedConfig.config.project.language,
      framework: resolvedConfig.config.project.framework,
      locale
    },
    workflow: {
      template: workflowTemplate.id,
      stageSequence: cloneValue(STANDARD_WORKFLOW_STAGE_SEQUENCE),
      selectedStages: selectWorkflowStages(workflowTemplate, [stageId])
    },
    standards: {
      preset: standardsPackage.meta.preset,
      consumer,
      rules: renderStandardsSection(standardsPackage, consumer, locale)
    },
    slots: renderSlotSummary(slotResolution),
    artifacts: {
      sprintRoot: toRelativePath(cwd, artifactPaths.sprintRoot),
      planFile: toRelativePath(cwd, artifactPaths.planFile),
      checklistFile: toRelativePath(cwd, artifactPaths.checklistFile),
      taskCsvFile: toRelativePath(cwd, artifactPaths.taskCsvFile),
      codeReviewRoot: toRelativePath(cwd, artifactPaths.codeReviewRoot)
    }
  };

  if (options.includeEntryFiles) {
    const agentEntryPath = path.resolve(cwd, resolvedConfig.config.agentEntry.target);
    const currentContextPath = path.resolve(cwd, resolvedConfig.config.agentEntry.contextFile);

    bundle.entry = {
      agentEntry: {
        path: toRelativePath(cwd, agentEntryPath),
        ...readOptionalFile(agentEntryPath)
      },
      currentContext: {
        path: toRelativePath(cwd, currentContextPath),
        ...readOptionalFile(currentContextPath)
      }
    };
  }

  if (options.includeRepositoryReferences) {
    const agentEntryPath = path.resolve(cwd, resolvedConfig.config.agentEntry.target);
    const currentContextPath = path.resolve(cwd, resolvedConfig.config.agentEntry.contextFile);

    bundle.references = {
      agentEntryPath: toRelativePath(cwd, agentEntryPath),
      currentContextPath: toRelativePath(cwd, currentContextPath)
    };
  }

  return {
    cwd,
    resolvedConfig,
    bundle
  };
}
