import type { GenericRecord, ResolvedConfigState } from "../aliases/adapter-bundle.type.js";
import type { SlotConflictPolicy } from "../aliases/slot.type.js";
import type { AdapterDefinition } from "./adapter.interface.js";

export interface AdapterRuntimeConfig {
  execution: {
    currentProject: string;
    currentSprint: string;
  };
  artifacts: {
    baseDir: string;
    files: {
      plan: string;
    };
    directories: {
      tasks: string;
      codeReview: string;
    };
    taskFiles: {
      checklist: string;
      csv: string;
    };
  };
  workflow: GenericRecord;
  standards: {
    locales: {
      default: string;
    };
  };
  project: {
    language: string | null;
    framework: string | null;
  };
  agentEntry: {
    target: string;
    contextFile: string;
  };
  slots: {
    enabled?: string[];
    disabled?: string[];
    conflictPolicy?: SlotConflictPolicy;
  };
}

export interface OptionalFileState {
  exists: boolean;
  content: string | null;
  excerpt: string | null;
}

export interface ArtifactPaths {
  sprintRoot: string;
  tasksRoot: string;
  codeReviewRoot: string;
  planFile: string;
  checklistFile: string;
  taskCsvFile: string;
}

export interface StandardsSectionItem {
  order: number;
  title: string | null;
  instruction: string | null;
  verification: string | null;
}

export interface SlotSummaryActiveItem {
  id: string;
  source: string;
  slotType: string;
  priority: number;
  promptKey: string | null;
  docSection: string | null;
  checks: GenericRecord;
}

export interface SlotSummaryInjections {
  aiPromptKeys: string[];
  humanDocSections: string[];
}

export interface SlotSummaryChecks {
  before: string[];
  after: string[];
}

export interface SlotSummary {
  active: SlotSummaryActiveItem[];
  blocked: unknown[];
  suppressed: unknown[];
  injections: SlotSummaryInjections;
  checks: SlotSummaryChecks;
}

export interface AdapterBundleEntryFile extends OptionalFileState {
  path: string;
}

export interface AdapterBundleEntry {
  agentEntry: AdapterBundleEntryFile;
  currentContext: AdapterBundleEntryFile;
}

export interface AdapterBundleReferences {
  agentEntryPath: string;
  currentContextPath: string;
}

export interface AdapterBaseBundle {
  adapter: {
    id: string;
    products: AdapterDefinition["targets"]["products"];
    entrypoints: AdapterDefinition["targets"]["entrypoints"];
    inputSources: AdapterDefinition["contract"]["input"]["sources"];
    promptSections: AdapterDefinition["injection"]["promptSections"];
  };
  runtime: {
    project: string;
    sprint: string;
    command: string;
    stageId: string;
    language: string | null;
    framework: string | null;
    locale: string;
  };
  workflow: {
    template: string;
    stageSequence: readonly string[];
    selectedStages: string[];
  };
  standards: {
    preset: string | null;
    consumer: string;
    rules: StandardsSectionItem[];
  };
  slots: SlotSummary;
  artifacts: {
    sprintRoot: string;
    planFile: string;
    checklistFile: string;
    taskCsvFile: string;
    codeReviewRoot: string;
  };
  entry?: AdapterBundleEntry;
  references?: AdapterBundleReferences;
}

export interface BuildBaseAdapterBundleOptions {
  cwd?: string;
  resolvedConfig?: ResolvedConfigState;
  configPath?: string;
  project?: string;
  sprint?: string;
  locale?: string;
  command?: string;
  stageId?: string;
  tags?: string[];
  paths?: string[];
  adapterPreset: AdapterDefinition;
  consumer?: string;
  includeEntryFiles?: boolean;
  includeRepositoryReferences?: boolean;
}

export interface AdapterPromptFile {
  path: string;
  content: string;
}

export interface ClaudeCodeAdapterBundleFiles {
  systemPrompt: AdapterPromptFile;
  taskPrompt: AdapterPromptFile;
}

export interface ClaudeCodeAdapterBundle extends AdapterBaseBundle {
  files: ClaudeCodeAdapterBundleFiles;
  prompt: string;
}

export interface CodexAdapterBundle extends AdapterBaseBundle {
  prompt: string;
}

export interface GitHubCopilotAdapterBundleFiles {
  ideInstructions: AdapterPromptFile;
  cliPrompt: AdapterPromptFile;
}

export interface GitHubCopilotAdapterBundle extends AdapterBaseBundle {
  files: GitHubCopilotAdapterBundleFiles;
  prompt: string;
}
