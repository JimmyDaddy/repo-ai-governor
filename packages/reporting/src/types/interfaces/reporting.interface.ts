import type {
  AuditOutputMode,
  AuditRecordStatus,
  DependencyResolutionStatus,
  ListAuditRecordsOptions,
  PersistedAuditRecord,
} from "@repo-ai-governor/core-session";
import type { ReportStatusBreakdown } from "../aliases/index.js";

/**
 * Defines one adapter contract for reading persisted audit records.
 */
export interface AuditRecordReader {
  listEvents(options: ListAuditRecordsOptions): Promise<PersistedAuditRecord[]>;
}

/**
 * Defines one report build request.
 */
export interface BuildExecutionReportOptions {
  executionId: string;
  stageId?: string;
  limit?: number;
  includeRecords?: boolean;
  memorySemantics?: ExecutionReportMemorySemanticsSummary | null;
}

/**
 * Defines one stage-level aggregation block in execution report.
 */
export interface ExecutionReportStageSummary {
  stageId: string;
  routeKeys: string[];
  totalRecords: number;
  statusBreakdown: ReportStatusBreakdown;
  firstRecordedAt: string;
  lastRecordedAt: string;
  failedRecordCount: number;
  timedOutRecordCount: number;
}

/**
 * Defines one risk summary block in execution report.
 */
export interface ExecutionReportRiskSummary {
  riskLevels: string[];
  riskReasons: string[];
  matchedPolicies: string[];
  requiredActions: string[];
}

/**
 * Defines one failure summary block in execution report.
 */
export interface ExecutionReportFailureSummary {
  failedRecordIds: string[];
  cancelledRecordIds: string[];
  timeoutRecordIds: string[];
}

/**
 * Defines one report-safe memory-context summary block.
 */
export interface ExecutionReportMemoryContextSummary {
  queryIntent: string;
  assemblyOutcome: string;
  selectedRecordCount: number;
  sourceRefCount: number;
  recordsMissingExplicitSourceRefs: number;
  truncationReason: string | null;
  layerCounts: Record<string, number>;
  memoryKindCounts: Record<string, number>;
  safetyNotes: string[];
  policySummary: {
    overallAction: string;
    actionCounts: Record<string, number>;
    allowedRecordCount: number;
    warningRecordCount: number;
    redactedRecordCount: number;
    blockedRecordCount: number;
  };
}

/**
 * Defines one report-safe session-summary projection row.
 */
export interface ExecutionReportSessionSummaryProjection {
  scope: string;
  key: string;
  promotedRecordIds: string[];
  updatedAt: string;
}

/**
 * Defines one report-safe promotion summary block.
 */
export interface ExecutionReportPromotionSummary {
  outcome: string;
  candidateCount: number;
  promotableCount: number;
  plannedMergeCount: number;
  mergedCount: number;
  skippedCount: number;
  rejectedCount: number;
  targetLayerCounts: Record<string, number>;
  failureReasonCounts: Record<string, number>;
  phaseResults: Array<{
    phase: string;
    status: "completed" | "skipped";
    candidateCount: number;
    detail: string;
  }>;
  sessionSummaryProjection: ExecutionReportSessionSummaryProjection | null;
}

/**
 * Defines one optional memory-semantics block for reporting-facing consumers.
 */
export interface ExecutionReportMemorySemanticsSummary {
  contextSummary: ExecutionReportMemoryContextSummary;
  promotion: ExecutionReportPromotionSummary | null;
}

/**
 * Defines one replay pointer row derived from audit records.
 */
export interface ReplayPointer {
  recordId: string;
  recordedAt: string;
  stageId: string;
  routeKey: string;
  status: AuditRecordStatus;
  policyOutcome: string;
  riskLevel?: string;
  artifactId?: string;
  dependencyResolutionStatus?: DependencyResolutionStatus;
  outputMode?: AuditOutputMode;
  outputLocale?: string;
}

/**
 * Defines one execution-level report payload.
 */
export interface ExecutionReport {
  executionId: string;
  generatedAt: string;
  totalRecords: number;
  stageSummaries: ExecutionReportStageSummary[];
  riskSummary: ExecutionReportRiskSummary;
  failureSummary: ExecutionReportFailureSummary;
  replayPointers: ReplayPointer[];
  memorySemantics?: ExecutionReportMemorySemanticsSummary;
  records?: PersistedAuditRecord[];
}

/**
 * Defines one replay snapshot creation request.
 */
export interface CreateReplaySnapshotOptions {
  report: ExecutionReport;
}

/**
 * Defines one deterministic replay snapshot payload.
 */
export interface ReplaySnapshot {
  executionId: string;
  generatedAt: string;
  pointerByRecordId: Record<string, ReplayPointer>;
  stageIndex: Record<string, string[]>;
  routeIndex: Record<string, string[]>;
}

/**
 * Defines one replay explain request payload.
 */
export interface ExplainReplayOptions {
  snapshot: ReplaySnapshot;
  stageId?: string;
  routeKey?: string;
  recordId?: string;
  outputLocale?: string;
  limit?: number;
}

/**
 * Defines one replay explain query summary.
 */
export interface ReplayExplainQuery {
  stageId?: string;
  routeKey?: string;
  recordId?: string;
  outputLocale?: string;
  limit: number;
}

/**
 * Defines one replay explain response payload.
 */
export interface ReplayExplainResult {
  executionId: string;
  query: ReplayExplainQuery;
  matchedCount: number;
  pointers: ReplayPointer[];
  explainLines: string[];
}
