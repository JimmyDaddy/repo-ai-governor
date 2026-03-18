import fs from "node:fs";
import path from "node:path";
import { loadResolvedConfig } from "../config/load-config.js";
import { buildSlotRuntime, resolveApplicableSlots } from "../slots/runtime.js";
import { validateSlotDefinition } from "../slots/slot-model.js";
import type { SlotDefinition } from "../slots/slot-model.js";
import {
  renderRulesForConsumer,
  resolveStandardsPackage,
} from "../standards/official-base-package.js";
import type { AiRuleView } from "../standards/package-model.js";
import type { GenericRecord, ResolvedConfigState } from "../types/aliases/adapter-bundle.type.js";
import type {
  AdapterBaseBundle,
  AdapterRuntimeConfig,
  ArtifactPaths,
  BuildBaseAdapterBundleOptions,
  OptionalFileState,
  SlotSummary,
  StandardsSectionItem,
} from "../types/interfaces/adapter-bundle.interface.js";
import {
  cloneValue as cloneValueShared,
  toRelativePath as toRelativePathValue,
} from "../utils/common.js";
import { selectWorkflowStages } from "../workflow/governance-engine.js";
import {
  STANDARD_WORKFLOW_STAGE_SEQUENCE,
  resolveWorkflowTemplate,
} from "../workflow/template-model.js";

export function toRelativePath(cwd: string, targetPath: string): string {
  return toRelativePathValue(cwd, targetPath);
}

export function cloneValue<T>(value: T): T {
  return cloneValueShared(value);
}

export function ensureTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}

export function readOptionalFile(filePath: string): OptionalFileState {
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      content: null,
      excerpt: null,
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
    excerpt,
  };
}

export function buildArtifactPaths(cwd: string, config: AdapterRuntimeConfig): ArtifactPaths {
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
    taskCsvFile: path.resolve(tasksRoot, config.artifacts.taskFiles.csv),
  };
}

export function normalizeCommandStage(
  command?: string,
  stageId?: string,
): {
  command: string;
  stageId: string;
} {
  const normalizedCommand = command ?? "plan";
  const normalizedStageId = stageId ?? normalizedCommand;

  return {
    command: normalizedCommand,
    stageId: normalizedStageId,
  };
}

export function renderStandardsSection(
  standardsPackage: Parameters<typeof renderRulesForConsumer>[0],
  consumer: string,
  locale: string,
): StandardsSectionItem[] {
  const rendered = renderRulesForConsumer(standardsPackage, consumer as never, {
    view: "ai",
    locale,
  }) as AiRuleView[];

  return rendered.map((ruleView, index) => ({
    order: index + 1,
    title: null,
    instruction: ruleView.instruction,
    verification: ruleView.verification,
  }));
}

export function renderSlotSummary(
  slotResolution: ReturnType<typeof resolveApplicableSlots>,
): SlotSummary {
  return {
    active: slotResolution.activeSlots.map((slot) => ({
      id: slot.id,
      source: slot.source,
      slotType: slot.slotType,
      priority: slot.priority,
      promptKey: slot.inject.ai?.promptKey ?? null,
      docSection: slot.inject.human?.docSection ?? null,
      checks: cloneValue(slot.checks) as GenericRecord,
    })),
    blocked: cloneValue(slotResolution.blockedSlots),
    suppressed: cloneValue(slotResolution.suppressedSlots),
    injections: cloneValue(slotResolution.injections),
    checks: cloneValue(slotResolution.checks),
  };
}

export function buildBaseAdapterBundle(options: BuildBaseAdapterBundleOptions): {
  cwd: string;
  resolvedConfig: ResolvedConfigState;
  bundle: AdapterBaseBundle;
} {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const resolvedConfig =
    options.resolvedConfig ??
    loadResolvedConfig({
      cwd,
      configPath: options.configPath,
      cliOverrides: {
        project: options.project,
        sprint: options.sprint,
        locale: options.locale,
      },
    });
  const config = resolvedConfig.config as unknown as AdapterRuntimeConfig;
  const locale = options.locale ?? config.standards.locales.default;
  const { command, stageId } = normalizeCommandStage(options.command, options.stageId);
  const workflowTemplate = resolveWorkflowTemplate(config.workflow);
  const standardsPackage = resolveStandardsPackage(config.standards);
  const slotDefinitions = resolvedConfig.slotDefinitions.map((entry) => ({
    config: validateSlotDefinition(entry.config as SlotDefinition),
    filePath: entry.filePath,
  }));
  const slotRuntime = buildSlotRuntime({
    config: {
      execution: {
        currentProject: config.execution.currentProject,
      },
      project: {
        language: config.project.language ?? undefined,
        framework: config.project.framework ?? undefined,
      },
      slots: {
        enabled: config.slots.enabled,
        disabled: config.slots.disabled,
        conflictPolicy: config.slots.conflictPolicy,
      },
    },
    slotDefinitions,
  });
  const slotResolution = resolveApplicableSlots(slotRuntime, {
    stageId,
    commandId: command,
    project: config.execution.currentProject,
    language: config.project.language ?? undefined,
    framework: config.project.framework ?? undefined,
    tags: options.tags ?? [],
    paths: options.paths ?? [],
  });
  const artifactPaths = buildArtifactPaths(cwd, config);
  const adapterPreset = options.adapterPreset;
  const consumer = options.consumer ?? command;

  const bundle: AdapterBaseBundle = {
    adapter: {
      id: adapterPreset.id,
      products: cloneValue(adapterPreset.targets.products),
      entrypoints: cloneValue(adapterPreset.targets.entrypoints),
      inputSources: cloneValue(adapterPreset.contract.input.sources),
      promptSections: cloneValue(adapterPreset.injection.promptSections),
    },
    runtime: {
      project: config.execution.currentProject,
      sprint: config.execution.currentSprint,
      command,
      stageId,
      language: config.project.language,
      framework: config.project.framework,
      locale,
    },
    workflow: {
      template: workflowTemplate.id,
      stageSequence: cloneValue(STANDARD_WORKFLOW_STAGE_SEQUENCE),
      selectedStages: selectWorkflowStages(workflowTemplate, [stageId]),
    },
    standards: {
      preset: standardsPackage.meta.preset ?? null,
      consumer,
      rules: renderStandardsSection(standardsPackage, consumer, locale),
    },
    slots: renderSlotSummary(slotResolution),
    artifacts: {
      sprintRoot: toRelativePath(cwd, artifactPaths.sprintRoot),
      planFile: toRelativePath(cwd, artifactPaths.planFile),
      checklistFile: toRelativePath(cwd, artifactPaths.checklistFile),
      taskCsvFile: toRelativePath(cwd, artifactPaths.taskCsvFile),
      codeReviewRoot: toRelativePath(cwd, artifactPaths.codeReviewRoot),
    },
  };

  if (options.includeEntryFiles) {
    const agentEntryPath = path.resolve(cwd, config.agentEntry.target);
    const currentContextPath = path.resolve(cwd, config.agentEntry.contextFile);

    bundle.entry = {
      agentEntry: {
        path: toRelativePath(cwd, agentEntryPath),
        ...readOptionalFile(agentEntryPath),
      },
      currentContext: {
        path: toRelativePath(cwd, currentContextPath),
        ...readOptionalFile(currentContextPath),
      },
    };
  }

  if (options.includeRepositoryReferences) {
    const agentEntryPath = path.resolve(cwd, config.agentEntry.target);
    const currentContextPath = path.resolve(cwd, config.agentEntry.contextFile);

    bundle.references = {
      agentEntryPath: toRelativePath(cwd, agentEntryPath),
      currentContextPath: toRelativePath(cwd, currentContextPath),
    };
  }

  return {
    cwd,
    resolvedConfig,
    bundle,
  };
}
