import type { ParsedOptions } from "../aliases/cli.type.js";
import type {
  CommandResultStatus,
  DoctorCommandName,
  FindingKind,
  FindingSeverity,
  FindingStatus,
} from "../aliases/command.type.js";

export interface DoctorFinding {
  id: string;
  category: string;
  severity: FindingSeverity;
  status: FindingStatus;
  message: string;
  target: string;
  suggestion?: string;
  fixable: boolean;
  fixed: boolean;
  kind?: FindingKind;
  absoluteTarget?: string;
}

export interface DoctorFindingDraft {
  id: string;
  category: string;
  severity: FindingSeverity;
  status?: FindingStatus;
  message: string;
  target: string;
  suggestion?: string;
  fixable?: boolean;
  fixed?: boolean;
}

export interface DoctorPathFindingOptions {
  locale: string;
  cwd: string;
  id: string;
  category: string;
  severity: FindingSeverity;
  kind: FindingKind;
  path: string;
  missingMessage: string;
  presentMessage: string;
  suggestion?: string;
  fixable?: boolean;
}

export interface DoctorSummary {
  status: CommandResultStatus;
  exitCode: number;
  errors: number;
  warnings: number;
  fixesApplied: number;
  passed: number;
  fixed: number;
}

export interface DoctorCheckPayload {
  id: string;
  category: string;
  severity: FindingSeverity;
  status: FindingStatus;
  message: string;
  target: string;
  suggestion?: string;
  fixed: boolean;
}

export interface DoctorPayload {
  command: DoctorCommandName;
  status: CommandResultStatus;
  locale: string;
  strict: boolean;
  fix: boolean;
  cwd: string;
  configFile: string;
  currentProject?: string;
  currentSprint?: string;
  summary: DoctorSummary;
  checks: DoctorCheckPayload[];
}

export interface DoctorArtifactPaths {
  configRoot: string;
  contextDir: string;
  contextFilePath: string;
  slotsDir: string;
  adaptersDir: string;
  reportsDir: string;
  templatesDir: string;
  agentEntryPath: string;
  sprintRoot?: string;
  tasksRoot?: string;
  codeReviewRoot?: string;
  indexFile?: string;
  planFile?: string;
  checklistFile?: string;
  taskCsvFile?: string;
}

export interface DoctorDirectoryCheck {
  id: string;
  path: string;
  presentMessage: string;
  missingMessage: string;
}

export interface DoctorFileCheck {
  id: string;
  path: string;
  severity?: FindingSeverity;
  presentMessage: string;
  missingMessage: string;
  suggestion?: string;
}

export interface DoctorPackageJsonLike {
  engines?: {
    node?: string;
  };
}

export interface DoctorResolvedConfigData {
  standards?: {
    locales?: {
      default?: string;
    };
  };
  execution: {
    currentProject?: string;
    currentSprint?: string;
  };
  reporting: {
    outputDir: string;
  };
  agentEntry: {
    target: string;
    contextFile: string;
  };
  artifacts: {
    baseDir: string;
    directories: {
      tasks: string;
      codeReview: string;
    };
    files: {
      index: string;
      plan: string;
    };
    taskFiles: {
      checklist: string;
      csv: string;
    };
  };
}

export interface DoctorResolvedConfig {
  paths: {
    configFile: string;
    slotsDirectory: string;
    adaptersDirectory: string;
  };
  config: DoctorResolvedConfigData;
}

export interface DoctorCommandState {
  logger: {
    success: (message: string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    raw: (message: string, options?: { ignoreQuiet?: boolean; stderr?: boolean }) => void;
  };
  parsedOptions: ParsedOptions;
}
