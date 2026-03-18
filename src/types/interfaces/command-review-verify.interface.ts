import type { resolveStandardsPackage } from "../../standards/official-base-package.js";
import type { ReviewVerifyCommandName } from "../aliases/command.type.js";
import type { ResolvedConfigState } from "../aliases/index.js";
import type { ReviewStatus } from "../aliases/repository-layout.type.js";
import type {
  ReviewAnalysis,
  ReviewArtifactPaths,
  ReviewSummary,
} from "./command-review.interface.js";

export interface ReviewVerifyWorkflowResult {
  status: string;
  selectedStageIds: string[];
  summary: unknown;
  stages: Array<{
    id: string;
    status: string;
    summary: unknown;
    blockedBy?: string[] | null;
    outputs?: {
      analysis?: ReviewAnalysis;
      summary?: ReviewSummary;
    };
  }>;
}

export interface ReviewVerifyRule {
  id: string;
  title: string;
  summary: string;
}

export interface ReviewVerifyPayload {
  command: ReviewVerifyCommandName;
  status: ReviewSummary["status"];
  dryRun: boolean;
  cwd: string;
  configFile: string;
  currentProject?: string;
  currentSprint?: string;
  generatedAt: string;
  locale: string;
  sourceFile: string;
  reviewStatusBefore: ReviewStatus;
  reviewStatusAfter: ReviewStatus;
  strict: boolean;
  slug: string;
  pathOption: string | null;
  base: string | null;
  head: string | null;
  workflow: {
    status: string;
    selectedStageIds: string[];
    summary: unknown;
    stages: Array<{
      id: string;
      status: string;
      summary: unknown;
      blockedBy?: string[] | null;
    }>;
  };
  targets: string[];
  findings: ReviewAnalysis["findings"];
  summary: ReviewSummary;
  standards: {
    preset: string;
    totalRules: number;
    matchedRuleIds: string[];
    reviewVerifyRules: ReviewVerifyRule[];
  };
  reviewLifecycle: Record<ReviewStatus, string>;
  verifyEntries: string[];
  resolutionEntries: string[];
  outputFile: string;
}

export interface ReviewVerifyRunState {
  cwd: string;
  resolvedConfig: ResolvedConfigState;
  standardsPackage: ReturnType<typeof resolveStandardsPackage>;
  artifactPaths: ReviewArtifactPaths;
  sourceFilePath: string;
  sourceFileName: string;
  sourceStatus: ReviewStatus;
  sourceContent: string;
  slug: string;
  targetFiles: string[];
  pathOption: string | null;
  base: string | null;
  head: string | null;
  strict: boolean;
  dryRun: boolean;
  locale: string;
  previousVerifyEntries: string[];
  previousResolutionEntries: string[];
}
