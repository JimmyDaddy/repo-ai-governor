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
  CliDelegatedReviewActivationLevel,
  CliDelegatedReviewActivationReason,
  CliReviewCoverageState,
  CliReviewFindingRuleId,
  CliReviewFindingSeverity,
  CliReviewFindingVerificationDecision,
  CliReviewFindingVerificationMatchStrategy,
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
  ruleId: CliReviewFindingRuleId | string;
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
  reviewerRationale?: string;
}

/**
 * Describes the hybrid review pipeline context retained for delegated handoff and audit.
 */
export interface CliDelegatedReviewRequest {
  requestId: string;
  scopeSummary: string;
  reviewMode: CliReviewScopeMode;
  reviewSurface: string[];
  requiredNormativeInputs: string[];
  projectedRuleBundle: ProjectedReviewRuleBundle;
  projectedRules: ReviewRuleDefinition[];
  deterministicFindings: CliReviewFinding[];
  coverageSummary: CliReviewCoverageSummary;
  delegatedReviewActivationPolicy: CliDelegatedReviewActivationPolicy;
  uncoveredRuleIds: string[];
}

/**
 * Describes one projected-rule coverage bucket used by reporting surfaces.
 */
export interface CliReviewCoverageBucket {
  state: CliReviewCoverageState;
  ruleIds: string[];
  count: number;
}

/**
 * Describes aggregate standards-native review coverage for the current scope.
 */
export interface CliReviewCoverageSummary {
  totalApplicableRuleCount: number;
  deterministicCoveredRuleCount: number;
  standardsGuidedCoveredRuleCount: number;
  residualGapRuleCount: number;
  manualOnlyGapRuleCount: number;
  deterministicCoveredRuleIds: string[];
  standardsGuidedCoveredRuleIds: string[];
  residualGapRuleIds: string[];
  manualOnlyGapRuleIds: string[];
  coverageBuckets: CliReviewCoverageBucket[];
}

/**
 * Describes whether delegated review should be treated as optional, recommended, or required.
 */
export interface CliDelegatedReviewActivationPolicy {
  level: CliDelegatedReviewActivationLevel;
  reasonCodes: CliDelegatedReviewActivationReason[];
  delegatableGapRuleIds: string[];
  manualOnlyGapRuleIds: string[];
  manualFollowUpRequired: boolean;
}

/**
 * Describes one source-aware per-finding verification record retained for audit.
 */
export interface CliReviewFindingVerificationRecord {
  findingId: string;
  ruleId: CliReviewFindingRuleId | string;
  sourceType?: ReviewFindingSourceType;
  decision: CliReviewFindingVerificationDecision;
  matchStrategy: CliReviewFindingVerificationMatchStrategy;
  matchedCurrentFindingId?: string;
  reviewerRationale?: string;
  verificationRationale: string;
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
  coverageSummary: CliReviewCoverageSummary;
  delegatedReviewActivationPolicy: CliDelegatedReviewActivationPolicy;
  uncoveredRuleIds: string[];
  delegatedReviewEnabled: boolean;
  dedupeStrategy: string;
  delegatedReviewRequest: CliDelegatedReviewRequest;
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
  findingDecisions?: CliReviewFindingVerificationRecord[];
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
  findingDecisions: CliReviewFindingVerificationRecord[];
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
