import type { Locale } from "../aliases/locale.type.js";
import type { ReportDocumentKind, ReportSchemaVersion } from "../aliases/report.type.js";

export interface NormalizedFinding {
  id: string;
  ruleId: string | null;
  severity: string;
  status: string;
  message: string;
  target: string | null;
  suggestion: string | null;
  stageId: string | null;
}

export interface NormalizedWorkflowStage {
  id: string;
  status: string | null;
  summary: unknown;
  blockedBy: string[];
  matchedRules: string[];
}

export interface NormalizedWorkflow {
  status: string | null;
  selectedStageIds: string[];
  summary: unknown;
  stages: NormalizedWorkflowStage[];
}

export interface NormalizedStandards {
  preset: string | null;
  totalRules: number;
  matchedRuleIds: string[];
}

export interface ReportArtifacts {
  reportFile: string | null;
  reviewFile: string | null;
  sourceFile: string | null;
  outputFile: string | null;
}

export interface UnifiedReport {
  schemaVersion: ReportSchemaVersion;
  kind: ReportDocumentKind;
  command: string | null;
  status: string | null;
  generatedAt: string;
  context: {
    cwd: string | null;
    configFile: string | null;
    project: string | null;
    sprint: string | null;
    locale: Locale;
  };
  summary: unknown;
  workflow: NormalizedWorkflow | null;
  standards: NormalizedStandards;
  findings: NormalizedFinding[];
  artifacts: ReportArtifacts;
  nextActions: string[];
}

export interface BuildUnifiedReportOptions {
  locale?: string;
  generatedAt?: string;
}
