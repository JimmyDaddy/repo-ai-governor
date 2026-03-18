import type { UpdateFileAction } from "../aliases/command.type.js";

export interface WorkspaceConfigProject {
  name?: string;
  [key: string]: unknown;
}

export interface WorkspaceConfigExecution {
  currentProject?: string;
  currentSprint?: string;
  [key: string]: unknown;
}

export interface WorkspaceConfigArtifactsTaskFiles {
  checklist: string;
  csv: string;
  csvColumns: string[];
}

export interface WorkspaceConfigArtifacts {
  baseDir: string;
  files: {
    index: string;
    plan: string;
  };
  directories: {
    tasks: string;
    codeReview: string;
  };
  taskFiles: WorkspaceConfigArtifactsTaskFiles;
}

export interface WorkspaceConfigStandards {
  locales: {
    default: string;
  };
}

export interface WorkspaceConfigAdapters {
  enabled: string[];
  directory: string;
}

export interface WorkspaceConfigSlots {
  directory: string;
}

export interface WorkspaceConfigReporting {
  outputDir: string;
}

export interface WorkspaceConfigAgentEntry {
  target: string;
  contextFile: string;
}

export interface WorkspaceConfig {
  project: WorkspaceConfigProject;
  execution: WorkspaceConfigExecution;
  artifacts: WorkspaceConfigArtifacts;
  standards: WorkspaceConfigStandards;
  adapters: WorkspaceConfigAdapters;
  slots: WorkspaceConfigSlots;
  reporting: WorkspaceConfigReporting;
  agentEntry: WorkspaceConfigAgentEntry;
  [key: string]: unknown;
}

export interface InitTemplateContext {
  locale: string;
  currentProject: string;
  currentSprint: string;
  dateStamp: string;
  docsRoot: string;
  planFileName: string;
  planRelativePath: string;
  tasksDirectoryName: string;
  checklistFileName: string;
  checklistRelativePath: string;
  taskCsvFileName: string;
  taskCsvRelativePath: string;
  codeReviewDirectoryName: string;
  configFilePath: string;
  agentEntryPath: string;
  contextFilePath: string;
  enabledAdaptersMarkdown: string;
  csvColumns: string[];
}

export interface SprintArtifacts {
  projectRoot: string;
  sprintRoot: string;
  tasksRoot: string;
  codeReviewRoot: string;
  indexFile: string;
  planFile: string;
  checklistFile: string;
  taskCsvFile: string;
}

export interface GeneratedWorkspaceFile {
  path: string;
  content: string;
  action: UpdateFileAction;
}

export interface BuildGeneratedWorkspaceFilesOptions {
  cwd?: string;
  config: WorkspaceConfig;
  configFilePath: string;
  dateStamp?: string;
}

export interface BuildGeneratedWorkspaceFilesResult {
  sprintArtifacts: SprintArtifacts;
  agentEntryPath: string;
  contextFilePath: string;
  filesByKey: Record<string, GeneratedWorkspaceFile>;
  adapterFiles: Record<string, GeneratedWorkspaceFile>;
}
