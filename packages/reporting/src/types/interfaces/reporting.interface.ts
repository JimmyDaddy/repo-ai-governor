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
  limit?: number;
}

/**
 * Defines one replay explain query summary.
 */
export interface ReplayExplainQuery {
  stageId?: string;
  routeKey?: string;
  recordId?: string;
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
