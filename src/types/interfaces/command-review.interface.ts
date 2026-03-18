import type { resolveStandardsPackage } from "../../standards/official-base-package.js";
import type {
  CommandResultStatus,
  FindingSeverity,
  FindingStatus,
  ReviewCommandName,
} from "../aliases/command.type.js";
import type { ResolvedConfigState } from "../aliases/index.js";
import type { ReviewStatus } from "../aliases/repository-layout.type.js";

export interface ReviewFinding {
  id: string;
  ruleId: string | null;
  severity: FindingSeverity;
  status: FindingStatus;
  message: string;
  target: string;
  suggestion: string | null;
}

export interface ReviewSummary {
  status: CommandResultStatus;
  exitCode: number;
  errors: number;
  warnings: number;
  passed: number;
}

export interface ReviewAnalysis {
  findings: ReviewFinding[];
  matchedRuleIds: string[];
  relativeTargets: string[];
}

export interface ReviewWorkflowStageOutputs {
  analysis?: ReviewAnalysis;
  summary?: ReviewSummary;
}

export interface ReviewWorkflowStage {
  id: string;
  status: string;
  summary: unknown;
  blockedBy?: string[] | null;
  outputs?: ReviewWorkflowStageOutputs;
}

export interface ReviewWorkflowResult {
  status: string;
  selectedStageIds: string[];
  summary: unknown;
  stages: ReviewWorkflowStage[];
}

export interface ReviewLifecycle extends Record<ReviewStatus, string> {
  pending: string;
  verified: string;
  resolved: string;
}

export interface ReviewRuleView {
  id: string;
  title: string;
  summary: string;
}

export interface ReviewArtifactPaths {
  sprintRoot: string;
  tasksRoot: string;
  codeReviewRoot: string;
  planFile: string;
  checklistFile: string;
  taskCsvFile: string;
  csvColumns: readonly string[];
}

export interface ReviewRunState {
  cwd: string;
  resolvedConfig: ResolvedConfigState;
  standardsPackage: ReturnType<typeof resolveStandardsPackage>;
  artifactPaths: ReviewArtifactPaths;
  targetFiles: string[];
  pathOption: string | null;
  base: string | null;
  head: string | null;
  strict: boolean;
  dryRun: boolean;
  locale: string;
}

export interface ReviewPayloadWorkflowStage {
  id: string;
  status: string;
  summary: unknown;
  blockedBy?: string[] | null;
}

export interface ReviewPayloadWorkflow {
  status: string;
  selectedStageIds: string[];
  summary: unknown;
  stages: ReviewPayloadWorkflowStage[];
}

export interface ReviewPayloadStandards {
  preset: string;
  totalRules: number;
  matchedRuleIds: string[];
  reviewRules: ReviewRuleView[];
}

export interface ReviewPayload {
  command: ReviewCommandName;
  status: ReviewSummary["status"];
  dryRun: boolean;
  cwd: string;
  configFile: string;
  currentProject?: string;
  currentSprint?: string;
  pathOption: string | null;
  base: string | null;
  head: string | null;
  strict: boolean;
  generatedAt: string;
  locale: string;
  slug: string;
  workflow: ReviewPayloadWorkflow;
  targets: string[];
  findings: ReviewFinding[];
  summary: ReviewSummary;
  standards: ReviewPayloadStandards;
  reviewLifecycle: ReviewLifecycle;
  reviewFile: string;
}
