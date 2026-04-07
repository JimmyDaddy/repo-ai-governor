import type { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import type {
  ProjectedReviewRuleBundle,
  ReviewFindingSourceType,
  ReviewRuleDefinition,
  ReviewRuleExecutionMode,
} from '@repo-ai-governor/standards';
import type {
  CliReviewLedgerBackfillStatus,
  CliReviewRequestStatus,
} from '../../constants/cli-governance-runtime.constant.js';
import type {
  CliReviewFindingRuleId,
  CliReviewFindingSeverity,
  CliReviewLifecycleStatus,
  CliReviewScopeMode,
  CliReviewVerifyDecision,
} from '../../constants/cli-review.constant.js';

/**
 * Describes active-stream review paths resolved from workspace current-context.
 */
export interface CliReviewStreamContext {
  projectId: string | null;
  sprintId: string | null;
  reviewDirPath: string;
  tasksDirPath: string | null;
  checklistPath: string | null;
  csvPath: string | null;
  currentContextPath: string | null;
  usesFallbackReviewDir: boolean;
}

/**
 * Describes one structured review finding emitted by the CLI review baseline.
 */
export interface CliReviewFinding {
  findingId: string;
  fingerprint: string;
  ruleId: CliReviewFindingRuleId;
  severity: CliReviewFindingSeverity;
  sourceType?: ReviewFindingSourceType;
  executionMode?: ReviewRuleExecutionMode;
  semanticKey?: string;
  standardsSourceRefs?: string[];
  projectedPackRefs?: string[];
  title: string;
  file: string;
  line?: number;
  summary: string;
  impact: string;
  suggestedAction: string;
  evidence: string[];
  confidence?: number;
}

/**
 * Describes the hybrid review pipeline context retained for delegated handoff and audit.
 */
export interface CliHybridReviewContext {
  projectedRuleBundle: ProjectedReviewRuleBundle;
  projectedRules: ReviewRuleDefinition[];
  deterministicFindings: CliReviewFinding[];
  standardsGuidedFindings: CliReviewFinding[];
  riskFindings: CliReviewFinding[];
  uncoveredRuleIds: string[];
  delegatedReviewEnabled: boolean;
  dedupeStrategy: string;
}

/**
 * Describes normalized review scope facts captured into transport artifacts.
 */
export interface CliReviewScopeSnapshot {
  reviewMode: CliReviewScopeMode;
  scopeSummary: string;
  reviewedPaths: string[];
  excludedPaths: string[];
  riskLevel: string;
  requiredAction: string;
}

/**
 * Describes the transport-only review request artifact retained for replay/verify handoff.
 */
export interface CliReviewRequestArtifactPayload {
  requestId: string;
  status: CliReviewRequestStatus;
  createdAt: string;
  workspaceId: string;
  workspaceRoot: string;
  locale: string;
  outputMode: ErrorOutputEnvironment;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
  recordLedger: boolean;
  reviewSlug: string;
  reviewArtifactPath: string;
  reviewArtifactStatus: CliReviewLifecycleStatus;
  reviewTaskId?: string;
  reviewTaskCardPath?: string;
  scope: CliReviewScopeSnapshot;
  findings: CliReviewFinding[];
  hybridReviewContext?: CliHybridReviewContext;
  notes: string[];
  generatedArtifactPaths: string[];
  diagnosticContext: {
    correlationId: string;
    queueStage: string;
    chain: string;
    taskId?: string;
    reviewChainMode: string;
    lastLedgerBackfillError?: string;
  };
  orchestrationExecutionId: string;
  orchestrationEventStreamToken: string;
  overallDecision?: CliReviewVerifyDecision;
  acceptedFindingIds?: string[];
  rejectedFindingIds?: string[];
  verifiedAt?: string;
  consumedAt?: string;
  consumedByVerifyId?: string;
  lastVerifyAttemptAt?: string;
  lastVerifyId?: string;
  ledgerBackfillPath?: string;
  ledgerBackfillStatus?: CliReviewLedgerBackfillStatus;
}

/**
 * Describes one persisted review-verify result artifact.
 */
export interface CliReviewVerifyResultArtifactPayload {
  verifyId: string;
  status: CliReviewRequestStatus;
  verifiedAt: string;
  sourceRequestPath: string;
  sourceRequestId: string;
  sourceReviewArtifactPath: string;
  reviewArtifactPath: string;
  reviewArtifactStatus: CliReviewLifecycleStatus;
  reviewTaskId?: string;
  reviewTaskCardPath?: string;
  overallDecision: CliReviewVerifyDecision;
  acceptedFindingIds: string[];
  rejectedFindingIds: string[];
  ledgerBackfillPath: string;
  ledgerBackfillStatus: CliReviewLedgerBackfillStatus;
  taskId?: string;
  diagnosticAttribution: {
    correlationId: string;
    chain: string;
    chainStep: string;
  };
  orchestrationExecutionId: string;
  orchestrationEventStreamToken: string;
}
