import { AuditRecordStatus, type PersistedAuditRecord } from '@repo-ai-governor/core-session';
import { GovernorErrorCode } from '@repo-ai-governor/shared';
import { type AuditRecordReader, ReportBuilder } from '../src/index.js';

class StubAuditRecordReader implements AuditRecordReader {
  public constructor(private readonly records: PersistedAuditRecord[]) {}

  public async listEvents(options: { executionId: string; stageId?: string; limit?: number }) {
    const stageFilteredRecords = this.records.filter((record) => {
      if (record.event.executionId !== options.executionId) {
        return true;
      }

      if (!options.stageId) {
        return true;
      }

      return record.event.stageId === options.stageId;
    });

    return stageFilteredRecords.slice(0, options.limit ?? Number.POSITIVE_INFINITY);
  }
}

function createPersistedRecord(
  recordId: string,
  recordedAt: string,
  overrides: Partial<PersistedAuditRecord['event']> = {},
): PersistedAuditRecord {
  return {
    recordId,
    recordedAt,
    event: {
      executionId: 'exec-report-001',
      stageId: 'stage-001',
      routeKey: 'route.core.runtime',
      surface: 'codex',
      agentRole: 'governance_reviewer',
      roleProfileId: 'role.default.governance-reviewer',
      roleSource: 'default',
      policyOutcome: 'allow',
      status: AuditRecordStatus.SUCCEEDED,
      startedAt: '2026-03-21T10:00:00Z',
      endedAt: '2026-03-21T10:00:05Z',
      startedAtDisplay: '2026-03-21 18:00:00 UTC+08:00',
      endedAtDisplay: '2026-03-21 18:00:05 UTC+08:00',
      executionSessionId: 'session-report-001',
      memoryScope: 'execution',
      memoryDelta: {
        writes: 1,
      },
      workspaceId: 'workspace-report-001',
      workspaceMode: 'tool_managed',
      workspaceRoot: '/tmp/repo-report',
      ...overrides,
    },
  };
}

describe('report-builder unit', () => {
  it('aggregates stage, risk, failure, and replay pointer summaries', async () => {
    const reader = new StubAuditRecordReader([
      createPersistedRecord('record-001', '2026-03-21T10:00:05Z', {
        stageId: 'stage-001',
        status: AuditRecordStatus.SUCCEEDED,
        riskLevel: 'low',
        matchedPolicies: ['policy.allow.default'],
      }),
      createPersistedRecord('record-002', '2026-03-21T10:00:10Z', {
        stageId: 'stage-001',
        status: AuditRecordStatus.FAILED,
        policyOutcome: 'confirm',
        riskLevel: 'high',
        riskReasons: ['dependency-upgrade'],
        matchedPolicies: ['policy.hitl.dependency'],
        requiredAction: 'human-review',
        timeoutIndicator: true,
        artifactId: 'DA-057',
        outputLocale: 'en-US',
      }),
      createPersistedRecord('record-003', '2026-03-21T10:00:15Z', {
        stageId: 'stage-002',
        routeKey: 'route.core.replay',
        status: AuditRecordStatus.CANCELLED,
        policyOutcome: 'escalate',
        riskLevel: 'critical',
      }),
    ]);
    const builder = new ReportBuilder(reader);

    const report = await builder.buildExecutionReport({
      executionId: 'exec-report-001',
      includeRecords: true,
    });

    expect(report.executionId).toBe('exec-report-001');
    expect(report.totalRecords).toBe(3);
    expect(report.stageSummaries).toHaveLength(2);
    expect(report.stageSummaries[0]?.statusBreakdown[AuditRecordStatus.SUCCEEDED]).toBe(1);
    expect(report.stageSummaries[0]?.statusBreakdown[AuditRecordStatus.FAILED]).toBe(1);
    expect(report.stageSummaries[1]?.statusBreakdown[AuditRecordStatus.CANCELLED]).toBe(1);
    expect(report.failureSummary.failedRecordIds).toEqual(['record-002']);
    expect(report.failureSummary.cancelledRecordIds).toEqual(['record-003']);
    expect(report.failureSummary.timeoutRecordIds).toEqual(['record-002']);
    expect(report.riskSummary.riskLevels).toEqual(['critical', 'high', 'low']);
    expect(report.replayPointers[1]?.artifactId).toBe('DA-057');
    expect(report.replayPointers[1]?.outputLocale).toBe('en-US');
    expect(report.records).toHaveLength(3);
  });

  it('rejects report records when execution id does not match build options', async () => {
    const reader = new StubAuditRecordReader([
      createPersistedRecord('record-001', '2026-03-21T10:00:05Z', {
        executionId: 'exec-report-mismatch',
      }),
    ]);
    const builder = new ReportBuilder(reader);

    await expect(
      builder.buildExecutionReport({
        executionId: 'exec-report-001',
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.REPORT_BUILD_INPUT_INVALID,
    });
  });

  it('sorts same-second records by recordId for deterministic report output', async () => {
    const reader = new StubAuditRecordReader([
      createPersistedRecord('record-b', '2026-03-21T10:00:05Z'),
      createPersistedRecord('record-a', '2026-03-21T10:00:05Z'),
    ]);
    const builder = new ReportBuilder(reader);

    const report = await builder.buildExecutionReport({
      executionId: 'exec-report-001',
      includeRecords: true,
    });

    expect(report.replayPointers.map((pointer) => pointer.recordId)).toEqual([
      'record-a',
      'record-b',
    ]);
    expect(report.records?.map((record) => record.recordId)).toEqual(['record-a', 'record-b']);
  });

  it('carries optional memory-semantics summary into the execution report', async () => {
    const reader = new StubAuditRecordReader([
      createPersistedRecord('record-001', '2026-03-21T10:00:05Z'),
    ]);
    const builder = new ReportBuilder(reader);

    const report = await builder.buildExecutionReport({
      executionId: 'exec-report-001',
      memorySemantics: {
        contextSummary: {
          queryIntent: 'cli_task_driven_execution',
          assemblyOutcome: 'context_ready',
          selectedRecordCount: 1,
          sourceRefCount: 1,
          recordsMissingExplicitSourceRefs: 0,
          truncationReason: null,
          layerCounts: {
            execution: 1,
          },
          memoryKindCounts: {
            execution_short_term_fact: 1,
          },
          safetyNotes: [],
          policySummary: {
            overallAction: 'allow',
            actionCounts: {
              allow: 1,
              warn: 0,
              redact: 0,
              block: 0,
            },
            allowedRecordCount: 1,
            warningRecordCount: 0,
            redactedRecordCount: 0,
            blockedRecordCount: 0,
          },
        },
        promotion: {
          outcome: 'session_summary_merged',
          candidateCount: 1,
          promotableCount: 1,
          plannedMergeCount: 1,
          mergedCount: 1,
          skippedCount: 0,
          rejectedCount: 0,
          targetLayerCounts: {
            session: 1,
          },
          failureReasonCounts: {},
          phaseResults: [
            {
              phase: 'merge_or_persist',
              status: 'completed',
              candidateCount: 1,
              detail: 'session_summary_merged=1',
            },
          ],
          sessionSummaryProjection: {
            scope: 'session',
            key: 'session-report-001',
            promotedRecordIds: ['execution:record-001'],
            updatedAt: '2026-03-21T10:00:05Z',
          },
        },
      },
    });

    expect(report.memorySemantics).toEqual(
      expect.objectContaining({
        contextSummary: expect.objectContaining({
          assemblyOutcome: 'context_ready',
          selectedRecordCount: 1,
        }),
        promotion: expect.objectContaining({
          outcome: 'session_summary_merged',
          mergedCount: 1,
          sessionSummaryProjection: expect.objectContaining({
            key: 'session-report-001',
          }),
        }),
      }),
    );
  });

  it('carries optional agent-view summary into the execution report', async () => {
    const reader = new StubAuditRecordReader([
      createPersistedRecord('record-001', '2026-03-21T10:00:05Z'),
    ]);
    const builder = new ReportBuilder(reader);

    const report = await builder.buildExecutionReport({
      executionId: 'exec-report-001',
      agentView: {
        descriptors: [
          {
            agentId: 'stage-review:reviewer:review',
            agentRole: 'reviewer',
            roleProfileId: 'reviewer-default',
            roleSource: 'default',
            primarySurface: 'claude-code',
            fallbackSurfaces: ['codex'],
            capabilities: ['structured_output'],
            permissionLevel: 'read',
            inputSchemaRef: null,
            outputSchemaRef: null,
            errorContractRef: null,
            maxExecutionTimeSeconds: 300,
            stageTimeoutSeconds: 300,
            tokenBudget: null,
            costBudget: null,
            timeBudgetSeconds: null,
            retryPolicyRef: null,
            timeoutPolicyRef: null,
            budgetPolicyRef: null,
            workspaceId: 'workspace-report-001',
            workspaceMode: 'tool_managed',
            executionId: 'exec-report-001',
            sessionId: 'shared-exec-001',
            selectedBy: 'primary',
            selectedSurface: 'claude-code',
            projectionStatus: 'completed',
            failureReasons: [],
          },
        ],
        sessionProjection: {
          sessionId: 'shared-exec-001',
          executionId: 'exec-report-001',
          sessionStatus: 'completed',
          openedAt: '2026-03-21T10:00:00Z',
          closedAt: '2026-03-21T10:00:05Z',
          totalEventCount: 2,
          agentEntries: [
            {
              agentId: 'stage-review:reviewer:review',
              agentRole: 'reviewer',
              roleProfileId: 'reviewer-default',
              sessionId: 'shared-exec-001',
              executionId: 'exec-report-001',
              sessionStatus: 'completed',
              sessionEventCount: 2,
              lastEventAt: '2026-03-21T10:00:05Z',
              contextKeys: ['workspace_id'],
            },
          ],
        },
      },
    });

    expect(report.agentView).toEqual(
      expect.objectContaining({
        descriptors: [
          expect.objectContaining({
            agentId: 'stage-review:reviewer:review',
          }),
        ],
        sessionProjection: expect.objectContaining({
          sessionId: 'shared-exec-001',
          totalEventCount: 2,
        }),
      }),
    );
  });
});
