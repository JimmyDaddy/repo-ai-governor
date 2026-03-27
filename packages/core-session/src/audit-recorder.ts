import { randomUUID } from 'node:crypto';

import { type MemoryManager, MemoryScope } from '@repo-ai-governor/core-memory';
import {
  ALL_DEPENDENCY_RESOLUTION_STATUSES,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  AUDIT_NON_SENSITIVE_FIELD_NAME_EXCEPTIONS,
  AUDIT_SENSITIVE_FIELD_NAME_MARKERS,
  AUDIT_SENSITIVE_FIELD_SUFFIX_MARKERS,
  AUDIT_SENSITIVE_TEXT_PATTERNS,
  AuditRecordStatus,
  DEFAULT_AUDIT_MASKED_VALUE,
  DEFAULT_AUDIT_MASKING_ENABLED,
  DEFAULT_AUDIT_RETENTION_DAYS,
  MILLISECONDS_PER_DAY,
} from './constants/index.js';
import type {
  ApplyAuditRetentionOptions,
  AuditEventRecord,
  AuditPrivacyGovernanceConfig,
  AuditRetentionExecutionResult,
  DeleteAuditRecordsOptions,
  ExportAuditRecordsOptions,
  ListAuditRecordsOptions,
  PersistedAuditRecord,
  RecordAuditEventOptions,
} from './types/index.js';

const AUDIT_RECORD_TAG = 'audit-record';
const RFC3339_SECONDS_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/u;
const DISPLAY_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC(?:\+|-)\d{2}:\d{2}$/u;
const AUDIT_RECORD_STATUS_VALUES = new Set<string>(Object.values(AuditRecordStatus));
const DEPENDENCY_RESOLUTION_STATUS_VALUES = ALL_DEPENDENCY_RESOLUTION_STATUSES;
const AUDIT_SENSITIVE_FIELD_NAME_VALUES = new Set<string>(
  AUDIT_SENSITIVE_FIELD_NAME_MARKERS.map((fieldName) => normalizeAuditFieldName(fieldName)),
);
const AUDIT_SENSITIVE_FIELD_SUFFIX_VALUES = new Set<string>(
  AUDIT_SENSITIVE_FIELD_SUFFIX_MARKERS.map((fieldName) => normalizeAuditFieldName(fieldName)),
);
const AUDIT_NON_SENSITIVE_FIELD_NAME_EXCEPTION_VALUES = new Set<string>(
  AUDIT_NON_SENSITIVE_FIELD_NAME_EXCEPTIONS.map((fieldName) => normalizeAuditFieldName(fieldName)),
);

interface PersistedAuditStorageRow {
  storageKey: string;
  updatedAt: string;
  record: PersistedAuditRecord;
}

/**
 * Normalizes one object field name for stable mask-rule matching.
 * @param value Raw field name.
 * @returns Lowercase alphanumeric field key.
 */
function normalizeAuditFieldName(value: string): string {
  return value.replace(/[^a-z0-9]/giu, '').toLowerCase();
}

/**
 * Records and queries normalized audit events through the shared memory manager.
 *
 * Why this exists:
 * Stage 6 needs one deterministic audit-event contract so report/replay layers can
 * consume stable fields without rebuilding schema logic in every package.
 */
export class AuditRecorder {
  private readonly privacyGovernanceConfig: AuditPrivacyGovernanceConfig;

  public constructor(
    private readonly memoryManager: MemoryManager,
    privacyGovernanceConfig?: Partial<AuditPrivacyGovernanceConfig>,
  ) {
    this.privacyGovernanceConfig = {
      retentionDays: privacyGovernanceConfig?.retentionDays ?? DEFAULT_AUDIT_RETENTION_DAYS,
      maskingEnabled: privacyGovernanceConfig?.maskingEnabled ?? DEFAULT_AUDIT_MASKING_ENABLED,
      maskedValue: privacyGovernanceConfig?.maskedValue ?? DEFAULT_AUDIT_MASKED_VALUE,
    };
    this.validatePrivacyGovernanceConfig(this.privacyGovernanceConfig);
  }

  /**
   * Persists one normalized audit event into execution memory scope.
   * @param options Record-event options.
   * @returns Persisted audit record payload.
   */
  public async recordEvent(options: RecordAuditEventOptions): Promise<PersistedAuditRecord> {
    const normalizedEvent = this.normalizeAuditEvent(options.event);
    const maskedEvent = this.applySensitiveDataMasking(normalizedEvent);
    const recordId = options.recordId ?? randomUUID();
    const recordedAt = this.resolveRfc3339SecondsTimestamp(options.recordedAt, 'recordedAt');
    const persistedRecord: PersistedAuditRecord = {
      recordId,
      recordedAt,
      event: maskedEvent,
    };

    await this.memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: this.buildExecutionKey(maskedEvent.executionId, maskedEvent.stageId, recordId),
      payload: persistedRecord as unknown as Record<string, unknown>,
      tags: [
        AUDIT_RECORD_TAG,
        `execution:${maskedEvent.executionId}`,
        `stage:${maskedEvent.stageId}`,
        `status:${maskedEvent.status}`,
        ...(maskedEvent.projectId ? [`project:${maskedEvent.projectId}`] : []),
        ...(maskedEvent.sprintId ? [`sprint:${maskedEvent.sprintId}`] : []),
        ...(maskedEvent.producerTaskId
          ? [`task:${maskedEvent.producerTaskId}`, `producer_task:${maskedEvent.producerTaskId}`]
          : []),
        ...(maskedEvent.consumerTaskId
          ? [`task:${maskedEvent.consumerTaskId}`, `consumer_task:${maskedEvent.consumerTaskId}`]
          : []),
        ...(maskedEvent.artifactId ? [`artifact:${maskedEvent.artifactId}`] : []),
      ],
    });

    return persistedRecord;
  }

  /**
   * Lists normalized audit records for one execution id.
   * @param options Audit-query options.
   * @returns Matching audit records ordered by `recordedAt`, then `recordId`.
   */
  public async listEvents(options: ListAuditRecordsOptions): Promise<PersistedAuditRecord[]> {
    const executionId = this.readRequiredString(options.executionId, 'executionId');
    const stageId = this.readOptionalString(options.stageId, 'stageId');
    const records = await this.memoryManager.queryEntries({
      scope: MemoryScope.EXECUTION,
      keyPrefix: this.buildExecutionKeyPrefix(executionId),
      tag: AUDIT_RECORD_TAG,
      limit: options.limit,
    });
    const parsedRecords = records.map((record) => this.parsePersistedAuditRecord(record.value));
    const stageFilteredRecords = stageId
      ? parsedRecords.filter((record) => record.event.stageId === stageId)
      : parsedRecords;

    return stageFilteredRecords.sort((left, right) =>
      this.compareByRecordedAtThenRecordId(left, right),
    );
  }

  /**
   * Exports audit records by scoped filters for replay and compliance workflows.
   * @param options Export filter options.
   * @returns Matched persisted records sorted by timestamp and record id.
   */
  public async exportEvents(options: ExportAuditRecordsOptions): Promise<PersistedAuditRecord[]> {
    const selectedRows = await this.selectAuditStorageRows(options);
    return selectedRows.map((row) => row.record);
  }

  /**
   * Deletes audit records by scoped filters through archive semantics.
   * @param options Delete filter options.
   * @returns Number of archived/deleted records.
   */
  public async deleteEvents(options: DeleteAuditRecordsOptions): Promise<number> {
    const selectedRows = await this.selectAuditStorageRows(options);
    if (selectedRows.length === 0) {
      return 0;
    }

    return this.memoryManager.archiveEntries({
      scope: MemoryScope.EXECUTION,
      keys: selectedRows.map((row) => row.storageKey),
    });
  }

  /**
   * Applies retention policy to audit records and archives stale rows.
   * @param options Retention execution options.
   * @returns Retention execution summary.
   */
  public async applyRetentionPolicy(
    options: ApplyAuditRetentionOptions = {},
  ): Promise<AuditRetentionExecutionResult> {
    const retentionDays = this.readPositiveInteger(
      options.retentionDays ?? this.privacyGovernanceConfig.retentionDays,
      'retentionDays',
    );
    const nowTimestamp = this.resolveRfc3339SecondsTimestamp(options.now, 'now');
    const archiveThreshold = this.toRfc3339SecondsTimestamp(
      new Date(
        this.toTimestampMilliseconds(nowTimestamp, 'now') - retentionDays * MILLISECONDS_PER_DAY,
      ),
    );

    const allRows = await this.loadAuditStorageRows({
      skipInvalidRows: true,
    });
    const rowsToArchive = allRows.filter(
      (row) =>
        this.toTimestampMilliseconds(row.record.recordedAt, 'recordedAt') <
        this.toTimestampMilliseconds(archiveThreshold, 'archiveThreshold'),
    );

    if (rowsToArchive.length === 0) {
      return {
        retentionDays,
        archivedBefore: archiveThreshold,
        archivedCount: 0,
      };
    }

    const archivedCount = await this.memoryManager.archiveEntries({
      scope: MemoryScope.EXECUTION,
      keys: rowsToArchive.map((row) => row.storageKey),
    });

    return {
      retentionDays,
      archivedBefore: archiveThreshold,
      archivedCount,
    };
  }

  /**
   * Normalizes and validates one audit event payload.
   * @param event Raw audit event payload.
   * @returns Normalized audit event payload.
   */
  private normalizeAuditEvent(event: AuditEventRecord): AuditEventRecord {
    const status = this.readRequiredString(event.status, 'status');
    if (!AUDIT_RECORD_STATUS_VALUES.has(status)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "status" must be one of ${Array.from(AUDIT_RECORD_STATUS_VALUES).join(', ')}.`,
        {
          fieldName: 'status',
          value: status,
        },
      );
    }
    const dependencyResolutionStatus = this.readOptionalDependencyResolutionStatus(
      event.dependencyResolutionStatus,
    );

    const normalizedRecord: AuditEventRecord = {
      executionId: this.readRequiredString(event.executionId, 'executionId'),
      stageId: this.readRequiredString(event.stageId, 'stageId'),
      routeKey: this.readRequiredString(event.routeKey, 'routeKey'),
      surface: this.readRequiredString(event.surface, 'surface'),
      agentRole: this.readRequiredString(event.agentRole, 'agentRole'),
      roleProfileId: this.readRequiredString(event.roleProfileId, 'roleProfileId'),
      roleSource: this.readRequiredString(event.roleSource, 'roleSource'),
      policyOutcome: this.readRequiredString(event.policyOutcome, 'policyOutcome'),
      status: status as AuditRecordStatus,
      startedAt: this.resolveRfc3339SecondsTimestamp(event.startedAt, 'startedAt'),
      endedAt: this.resolveRfc3339SecondsTimestamp(event.endedAt, 'endedAt'),
      startedAtDisplay: this.readDisplayTimestamp(event.startedAtDisplay, 'startedAtDisplay'),
      endedAtDisplay: this.readDisplayTimestamp(event.endedAtDisplay, 'endedAtDisplay'),
      executionSessionId: this.readRequiredString(event.executionSessionId, 'executionSessionId'),
      memoryScope: this.readRequiredString(event.memoryScope, 'memoryScope'),
      memoryDelta: this.readRecord(event.memoryDelta, 'memoryDelta'),
      workspaceId: this.readRequiredString(event.workspaceId, 'workspaceId'),
      workspaceMode: this.readRequiredString(event.workspaceMode, 'workspaceMode'),
      workspaceRoot: this.readRequiredString(event.workspaceRoot, 'workspaceRoot'),
      ...(this.readOptionalString(event.projectId, 'projectId')
        ? { projectId: this.readOptionalString(event.projectId, 'projectId') }
        : {}),
      ...(this.readOptionalString(event.sprintId, 'sprintId')
        ? { sprintId: this.readOptionalString(event.sprintId, 'sprintId') }
        : {}),
      ...(this.readOptionalString(event.riskLevel, 'riskLevel')
        ? { riskLevel: this.readOptionalString(event.riskLevel, 'riskLevel') }
        : {}),
      ...(this.readOptionalStringArray(event.riskReasons, 'riskReasons')
        ? { riskReasons: this.readOptionalStringArray(event.riskReasons, 'riskReasons') }
        : {}),
      ...(this.readOptionalString(event.requiredAction, 'requiredAction')
        ? { requiredAction: this.readOptionalString(event.requiredAction, 'requiredAction') }
        : {}),
      ...(this.readOptionalStringArray(event.matchedPolicies, 'matchedPolicies')
        ? {
            matchedPolicies: this.readOptionalStringArray(event.matchedPolicies, 'matchedPolicies'),
          }
        : {}),
      ...(this.readOptionalString(event.skillId, 'skillId')
        ? { skillId: this.readOptionalString(event.skillId, 'skillId') }
        : {}),
      ...(this.readOptionalString(event.skillVersion, 'skillVersion')
        ? { skillVersion: this.readOptionalString(event.skillVersion, 'skillVersion') }
        : {}),
      ...(this.readOptionalString(event.error, 'error')
        ? { error: this.readOptionalString(event.error, 'error') }
        : {}),
      ...(this.readOptionalString(event.notificationChannel, 'notificationChannel')
        ? {
            notificationChannel: this.readOptionalString(
              event.notificationChannel,
              'notificationChannel',
            ),
          }
        : {}),
      ...(this.readOptionalString(event.notificationStatus, 'notificationStatus')
        ? {
            notificationStatus: this.readOptionalString(
              event.notificationStatus,
              'notificationStatus',
            ),
          }
        : {}),
      ...(this.readOptionalDisplayTimestamp(event.notifiedAtDisplay, 'notifiedAtDisplay')
        ? {
            notifiedAtDisplay: this.readOptionalDisplayTimestamp(
              event.notifiedAtDisplay,
              'notifiedAtDisplay',
            ),
          }
        : {}),
      ...(this.readOptionalNumber(event.tokenBudget, 'tokenBudget') !== undefined
        ? { tokenBudget: this.readOptionalNumber(event.tokenBudget, 'tokenBudget') }
        : {}),
      ...(this.readOptionalNumber(event.tokenUsed, 'tokenUsed') !== undefined
        ? { tokenUsed: this.readOptionalNumber(event.tokenUsed, 'tokenUsed') }
        : {}),
      ...(this.readOptionalNumber(event.costBudget, 'costBudget') !== undefined
        ? { costBudget: this.readOptionalNumber(event.costBudget, 'costBudget') }
        : {}),
      ...(this.readOptionalNumber(event.costUsed, 'costUsed') !== undefined
        ? { costUsed: this.readOptionalNumber(event.costUsed, 'costUsed') }
        : {}),
      ...(this.readOptionalNumber(event.maxExecutionTimeSeconds, 'maxExecutionTimeSeconds') !==
      undefined
        ? {
            maxExecutionTimeSeconds: this.readOptionalNumber(
              event.maxExecutionTimeSeconds,
              'maxExecutionTimeSeconds',
            ),
          }
        : {}),
      ...(this.readOptionalNumber(event.executionTimeSeconds, 'executionTimeSeconds') !== undefined
        ? {
            executionTimeSeconds: this.readOptionalNumber(
              event.executionTimeSeconds,
              'executionTimeSeconds',
            ),
          }
        : {}),
      ...(this.readOptionalString(event.cancellationReason, 'cancellationReason')
        ? {
            cancellationReason: this.readOptionalString(
              event.cancellationReason,
              'cancellationReason',
            ),
          }
        : {}),
      ...(this.readOptionalBoolean(event.timeoutIndicator, 'timeoutIndicator') !== undefined
        ? {
            timeoutIndicator: this.readOptionalBoolean(event.timeoutIndicator, 'timeoutIndicator'),
          }
        : {}),
      ...(this.readOptionalString(event.timeoutScope, 'timeoutScope')
        ? { timeoutScope: this.readOptionalString(event.timeoutScope, 'timeoutScope') }
        : {}),
      ...(this.readOptionalString(event.artifactId, 'artifactId')
        ? { artifactId: this.readOptionalString(event.artifactId, 'artifactId') }
        : {}),
      ...(this.readOptionalString(event.artifactVersion, 'artifactVersion')
        ? { artifactVersion: this.readOptionalString(event.artifactVersion, 'artifactVersion') }
        : {}),
      ...(this.readOptionalString(event.producerTaskId, 'producerTaskId')
        ? { producerTaskId: this.readOptionalString(event.producerTaskId, 'producerTaskId') }
        : {}),
      ...(this.readOptionalString(event.consumerTaskId, 'consumerTaskId')
        ? { consumerTaskId: this.readOptionalString(event.consumerTaskId, 'consumerTaskId') }
        : {}),
      ...(dependencyResolutionStatus
        ? {
            dependencyResolutionStatus,
          }
        : {}),
      ...(this.readOptionalString(event.outputMode, 'outputMode')
        ? {
            outputMode: this.readOptionalString(
              event.outputMode,
              'outputMode',
            ) as AuditEventRecord['outputMode'],
          }
        : {}),
      ...(this.readOptionalBoolean(event.isTty, 'isTty') !== undefined
        ? { isTty: this.readOptionalBoolean(event.isTty, 'isTty') }
        : {}),
      ...(this.readOptionalString(event.outputLocale, 'outputLocale')
        ? { outputLocale: this.readOptionalString(event.outputLocale, 'outputLocale') }
        : {}),
      ...(this.readOptionalString(event.specSyncStatus, 'specSyncStatus')
        ? { specSyncStatus: this.readOptionalString(event.specSyncStatus, 'specSyncStatus') }
        : {}),
      ...(this.readOptionalStringArray(event.specSyncFailures, 'specSyncFailures')
        ? {
            specSyncFailures: this.readOptionalStringArray(
              event.specSyncFailures,
              'specSyncFailures',
            ),
          }
        : {}),
    };

    return normalizedRecord;
  }

  /**
   * Parses one persisted record payload from memory entry.
   * @param payload Raw memory payload.
   * @returns Parsed persisted audit record.
   */
  private parsePersistedAuditRecord(payload: Record<string, unknown>): PersistedAuditRecord {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_PAYLOAD_INVALID,
        'Audit persisted payload must be an object.',
      );
    }

    const record = payload as Record<string, unknown>;
    const eventCandidate = this.readRecord(record.event, 'event');
    return {
      recordId: this.readRequiredString(record.recordId, 'recordId'),
      recordedAt: this.resolveRfc3339SecondsTimestamp(record.recordedAt, 'recordedAt'),
      event: this.normalizeAuditEvent(eventCandidate as unknown as AuditEventRecord),
    };
  }

  /**
   * Builds execution-scoped key prefix for memory queries.
   * @param executionId Execution id.
   * @returns Scoped key prefix.
   */
  private buildExecutionKeyPrefix(executionId: string): string {
    return `${executionId}:`;
  }

  /**
   * Builds one deterministic execution key.
   * @param executionId Execution id.
   * @param stageId Stage id.
   * @param recordId Record id.
   * @returns Deterministic key.
   */
  private buildExecutionKey(executionId: string, stageId: string, recordId: string): string {
    return `${executionId}:${stageId}:${recordId}`;
  }

  /**
   * Compares records by timestamp first, then by record id for deterministic ties.
   * @param left Left audit record.
   * @param right Right audit record.
   * @returns Sort comparator value.
   */
  private compareByRecordedAtThenRecordId(
    left: PersistedAuditRecord,
    right: PersistedAuditRecord,
  ): number {
    const timestampCompare = left.recordedAt.localeCompare(right.recordedAt);
    if (timestampCompare !== 0) {
      return timestampCompare;
    }

    return left.recordId.localeCompare(right.recordId);
  }

  /**
   * Validates privacy-governance config at construction time.
   * @param config Candidate governance config.
   * @returns Void.
   */
  private validatePrivacyGovernanceConfig(config: AuditPrivacyGovernanceConfig): void {
    this.readPositiveInteger(config.retentionDays, 'retentionDays');
    this.readRequiredString(config.maskedValue, 'maskedValue');
  }

  /**
   * Applies masking policy before persisting one audit event.
   * @param event Normalized audit event.
   * @returns Masked audit event payload.
   */
  private applySensitiveDataMasking(event: AuditEventRecord): AuditEventRecord {
    if (!this.privacyGovernanceConfig.maskingEnabled) {
      return event;
    }

    const maskedEventCandidate = this.maskSensitiveValue(event) as AuditEventRecord;
    return this.normalizeAuditEvent(maskedEventCandidate);
  }

  /**
   * Loads raw audit storage rows used by export/delete/retention operations.
   * @returns Parsed storage rows with original memory keys.
   */
  private async loadAuditStorageRows(
    options: {
      executionId?: string;
      skipInvalidRows?: boolean;
    } = {},
  ): Promise<PersistedAuditStorageRow[]> {
    const rawRows = await this.memoryManager.queryEntries({
      scope: MemoryScope.EXECUTION,
      tag: AUDIT_RECORD_TAG,
      ...(options.executionId
        ? { keyPrefix: this.buildExecutionKeyPrefix(options.executionId) }
        : {}),
    });

    const storageRows: PersistedAuditStorageRow[] = [];
    for (const row of rawRows) {
      try {
        storageRows.push({
          storageKey: row.key,
          updatedAt: row.updatedAt,
          record: this.parsePersistedAuditRecord(row.value),
        });
      } catch (error) {
        if (!options.skipInvalidRows) {
          throw error;
        }
      }
    }

    return storageRows;
  }

  /**
   * Selects one stable sorted subset of audit rows using governance filters.
   * @param options Filter options.
   * @returns Filtered rows sorted by `recordedAt` then `recordId`.
   */
  private async selectAuditStorageRows(
    options: ExportAuditRecordsOptions,
  ): Promise<PersistedAuditStorageRow[]> {
    const executionId = this.readOptionalString(options.executionId, 'executionId');
    const projectId = this.readOptionalString(options.projectId, 'projectId');
    const sprintId = this.readOptionalString(options.sprintId, 'sprintId');
    const fromRecordedAt = this.readOptionalRfc3339SecondsTimestamp(
      options.fromRecordedAt,
      'fromRecordedAt',
    );
    const toRecordedAt = this.readOptionalRfc3339SecondsTimestamp(
      options.toRecordedAt,
      'toRecordedAt',
    );
    const limit = this.readOptionalPositiveInteger(options.limit, 'limit');

    const loadedRows = await this.loadAuditStorageRows({
      ...(executionId ? { executionId } : {}),
      skipInvalidRows: true,
    });
    const filteredRows = loadedRows
      .filter((row) => {
        if (executionId && row.record.event.executionId !== executionId) {
          return false;
        }

        if (projectId && row.record.event.projectId !== projectId) {
          return false;
        }

        if (sprintId && row.record.event.sprintId !== sprintId) {
          return false;
        }

        const recordedAtMilliseconds = this.toTimestampMilliseconds(
          row.record.recordedAt,
          'recordedAt',
        );
        if (
          fromRecordedAt &&
          recordedAtMilliseconds < this.toTimestampMilliseconds(fromRecordedAt, 'fromRecordedAt')
        ) {
          return false;
        }

        if (
          toRecordedAt &&
          recordedAtMilliseconds > this.toTimestampMilliseconds(toRecordedAt, 'toRecordedAt')
        ) {
          return false;
        }

        return true;
      })
      .sort((left, right) => this.compareByRecordedAtThenRecordId(left.record, right.record));

    if (!limit) {
      return filteredRows;
    }

    return filteredRows.slice(0, limit);
  }

  /**
   * Masks one unknown candidate by field-name and text-pattern rules.
   * @param candidate Candidate value.
   * @param fieldName Current field name for object traversal.
   * @returns Masked value.
   */
  private maskSensitiveValue(candidate: unknown, fieldName = ''): unknown {
    if (candidate === undefined || candidate === null) {
      return candidate;
    }

    if (this.isSensitiveFieldName(fieldName)) {
      return this.privacyGovernanceConfig.maskedValue;
    }

    if (typeof candidate === 'string') {
      return this.maskSensitiveText(candidate);
    }

    if (Array.isArray(candidate)) {
      return candidate.map((item) => this.maskSensitiveValue(item, fieldName));
    }

    if (typeof candidate === 'object') {
      const maskedRecord: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(candidate)) {
        maskedRecord[key] = this.maskSensitiveValue(value, key);
      }

      return maskedRecord;
    }

    return candidate;
  }

  /**
   * Masks sensitive token-like fragments in free-form text fields.
   * @param value Raw text value.
   * @returns Masked text.
   */
  private maskSensitiveText(value: string): string {
    let maskedText = value;
    for (const pattern of AUDIT_SENSITIVE_TEXT_PATTERNS) {
      maskedText = maskedText.replace(pattern, (...match) => {
        const wholeMatch = typeof match[0] === 'string' ? match[0] : '';
        const prefix = typeof match[1] === 'string' && match[1] !== wholeMatch ? match[1] : '';
        return `${prefix}${this.privacyGovernanceConfig.maskedValue}`;
      });
    }

    return maskedText;
  }

  /**
   * Checks whether one object field name should be treated as sensitive.
   * @param fieldName Candidate field name.
   * @returns True when field should be masked by key rule.
   */
  private isSensitiveFieldName(fieldName: string): boolean {
    const normalizedFieldName = normalizeAuditFieldName(fieldName);
    if (!normalizedFieldName) {
      return false;
    }

    if (AUDIT_NON_SENSITIVE_FIELD_NAME_EXCEPTION_VALUES.has(normalizedFieldName)) {
      return false;
    }

    if (AUDIT_SENSITIVE_FIELD_NAME_VALUES.has(normalizedFieldName)) {
      return true;
    }

    for (const sensitiveSuffix of AUDIT_SENSITIVE_FIELD_SUFFIX_VALUES) {
      if (normalizedFieldName.endsWith(sensitiveSuffix)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Parses one RFC3339 seconds timestamp into epoch milliseconds.
   * @param timestamp RFC3339 seconds timestamp.
   * @param fieldName Field name for diagnostics.
   * @returns Epoch milliseconds.
   */
  private toTimestampMilliseconds(timestamp: string, fieldName: string): number {
    const parsed = Date.parse(timestamp);
    if (!Number.isFinite(parsed)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "${fieldName}" must be a valid RFC3339 timestamp.`,
        { fieldName, value: timestamp },
      );
    }

    return parsed;
  }

  /**
   * Reads one required string field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed string.
   */
  private readRequiredString(candidate: unknown, fieldName: string): string {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.AUDIT_RECORD_INVALID,
      `Audit event field "${fieldName}" must be a non-empty string.`,
      { fieldName },
    );
  }

  /**
   * Reads one optional string field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed string or undefined.
   */
  private readOptionalString(candidate: unknown, fieldName: string): string | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.AUDIT_RECORD_INVALID,
      `Audit event field "${fieldName}" must be a non-empty string when provided.`,
      { fieldName },
    );
  }

  /**
   * Reads one optional dependency-resolution status with strict enum validation.
   * @param candidate Candidate value.
   * @returns Parsed status or undefined.
   */
  private readOptionalDependencyResolutionStatus(
    candidate: unknown,
  ): AuditEventRecord['dependencyResolutionStatus'] | undefined {
    const status = this.readOptionalString(candidate, 'dependencyResolutionStatus');
    if (status === undefined) {
      return undefined;
    }

    if (!DEPENDENCY_RESOLUTION_STATUS_VALUES.has(status)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "dependencyResolutionStatus" must be one of ${Array.from(
          DEPENDENCY_RESOLUTION_STATUS_VALUES,
        ).join(', ')} when provided.`,
        {
          fieldName: 'dependencyResolutionStatus',
          value: status,
        },
      );
    }

    return status as AuditEventRecord['dependencyResolutionStatus'];
  }

  /**
   * Reads one optional string array field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed array or undefined.
   */
  private readOptionalStringArray(candidate: unknown, fieldName: string): string[] | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (!Array.isArray(candidate) || candidate.some((value) => typeof value !== 'string')) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "${fieldName}" must be a string array when provided.`,
        { fieldName },
      );
    }

    return candidate;
  }

  /**
   * Reads one optional number field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed number or undefined.
   */
  private readOptionalNumber(candidate: unknown, fieldName: string): number | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.AUDIT_RECORD_INVALID,
      `Audit event field "${fieldName}" must be a finite number when provided.`,
      { fieldName },
    );
  }

  /**
   * Reads one optional boolean field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed boolean or undefined.
   */
  private readOptionalBoolean(candidate: unknown, fieldName: string): boolean | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate === 'boolean') {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.AUDIT_RECORD_INVALID,
      `Audit event field "${fieldName}" must be a boolean when provided.`,
      { fieldName },
    );
  }

  /**
   * Reads one object field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed object.
   */
  private readRecord(candidate: unknown, fieldName: string): Record<string, unknown> {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }

    throw new RuntimeError(
      GovernorErrorCode.AUDIT_RECORD_INVALID,
      `Audit event field "${fieldName}" must be an object.`,
      { fieldName },
    );
  }

  /**
   * Reads one required display timestamp field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed display timestamp string.
   */
  private readDisplayTimestamp(candidate: unknown, fieldName: string): string {
    const timestamp = this.readRequiredString(candidate, fieldName);
    if (!DISPLAY_TIMESTAMP_PATTERN.test(timestamp)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "${fieldName}" must use format YYYY-MM-DD HH:mm:ss UTC±HH:MM.`,
        { fieldName, value: timestamp },
      );
    }

    return timestamp;
  }

  /**
   * Reads one optional display timestamp field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed timestamp string or undefined.
   */
  private readOptionalDisplayTimestamp(candidate: unknown, fieldName: string): string | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    return this.readDisplayTimestamp(candidate, fieldName);
  }

  /**
   * Reads one optional RFC3339 seconds timestamp.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed timestamp or undefined.
   */
  private readOptionalRfc3339SecondsTimestamp(
    candidate: unknown,
    fieldName: string,
  ): string | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    return this.resolveRfc3339SecondsTimestamp(candidate, fieldName);
  }

  /**
   * Reads one optional positive integer field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Positive integer or undefined.
   */
  private readOptionalPositiveInteger(candidate: unknown, fieldName: string): number | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    return this.readPositiveInteger(candidate, fieldName);
  }

  /**
   * Reads one required positive integer field.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Positive integer.
   */
  private readPositiveInteger(candidate: unknown, fieldName: string): number {
    if (typeof candidate !== 'number' || !Number.isInteger(candidate) || candidate <= 0) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "${fieldName}" must be a positive integer.`,
        { fieldName, value: candidate },
      );
    }

    return candidate;
  }

  /**
   * Normalizes Date objects to RFC3339 seconds precision.
   * @param date Candidate date instance.
   * @returns RFC3339 seconds timestamp.
   */
  private toRfc3339SecondsTimestamp(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/u, 'Z');
  }

  /**
   * Resolves one RFC3339 seconds timestamp value.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed RFC3339 seconds string.
   */
  private resolveRfc3339SecondsTimestamp(candidate: unknown, fieldName: string): string {
    if (candidate === undefined) {
      return new Date().toISOString().replace(/\.\d{3}Z$/u, 'Z');
    }

    const timestamp = this.readRequiredString(candidate, fieldName);
    if (!RFC3339_SECONDS_PATTERN.test(timestamp)) {
      throw new RuntimeError(
        GovernorErrorCode.AUDIT_RECORD_INVALID,
        `Audit event field "${fieldName}" must be RFC3339 seconds precision.`,
        { fieldName, value: timestamp },
      );
    }

    return timestamp;
  }
}
