import type {
  AuditOutputMode,
  AuditRecordStatus,
  DependencyResolutionStatus,
} from '../../constants/index.js';

/**
 * Defines one normalized audit event payload.
 */
export interface AuditEventRecord {
  executionId: string;
  stageId: string;
  routeKey: string;
  surface: string;
  agentRole: string;
  roleProfileId: string;
  roleSource: string;
  policyOutcome: string;
  riskLevel?: string;
  riskReasons?: string[];
  requiredAction?: string;
  matchedPolicies?: string[];
  skillId?: string;
  skillVersion?: string;
  status: AuditRecordStatus;
  startedAt: string;
  endedAt: string;
  startedAtDisplay: string;
  endedAtDisplay: string;
  error?: string;
  executionSessionId: string;
  memoryScope: string;
  memoryDelta: Record<string, unknown>;
  notificationChannel?: string;
  notificationStatus?: string;
  notifiedAtDisplay?: string;
  tokenBudget?: number;
  tokenUsed?: number;
  costBudget?: number;
  costUsed?: number;
  maxExecutionTimeSeconds?: number;
  executionTimeSeconds?: number;
  cancellationReason?: string;
  timeoutIndicator?: boolean;
  timeoutScope?: string;
  workspaceId: string;
  workspaceMode: string;
  workspaceRoot: string;
  projectId?: string;
  sprintId?: string;
  artifactId?: string;
  artifactVersion?: string;
  producerTaskId?: string;
  consumerTaskId?: string;
  dependencyResolutionStatus?: DependencyResolutionStatus;
  outputMode?: AuditOutputMode;
  isTty?: boolean;
  outputLocale?: string;
  specSyncStatus?: string;
  specSyncFailures?: string[];
}

/**
 * Defines privacy-governance defaults consumed by audit recorder runtime.
 */
export interface AuditPrivacyGovernanceConfig {
  retentionDays: number;
  maskingEnabled: boolean;
  maskedValue: string;
}

/**
 * Defines one persisted audit row shape.
 */
export interface PersistedAuditRecord {
  recordId: string;
  recordedAt: string;
  event: AuditEventRecord;
}

/**
 * Defines one record-write request payload.
 */
export interface RecordAuditEventOptions {
  event: AuditEventRecord;
  recordId?: string;
  recordedAt?: string;
}

/**
 * Defines one audit-query request payload.
 */
export interface ListAuditRecordsOptions {
  executionId: string;
  stageId?: string;
  limit?: number;
}

/**
 * Defines one export request for privacy-governed audit records.
 */
export interface ExportAuditRecordsOptions {
  executionId?: string;
  projectId?: string;
  sprintId?: string;
  fromRecordedAt?: string;
  toRecordedAt?: string;
  limit?: number;
}

/**
 * Defines one delete request for privacy-governed audit records.
 */
export type DeleteAuditRecordsOptions = ExportAuditRecordsOptions;

/**
 * Defines one retention execution request payload.
 */
export interface ApplyAuditRetentionOptions {
  retentionDays?: number;
  now?: string;
}

/**
 * Defines one retention execution result payload.
 */
export interface AuditRetentionExecutionResult {
  retentionDays: number;
  archivedBefore: string;
  archivedCount: number;
}
