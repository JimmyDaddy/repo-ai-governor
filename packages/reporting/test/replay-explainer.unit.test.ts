import { AuditRecordStatus } from '@repo-ai-governor/core-session';
import { GovernorErrorCode } from '@repo-ai-governor/shared';
import type { ExecutionReport, ReplayPointer } from '../src/index.js';
import { ReplayExplainer } from '../src/index.js';

function createReplayPointer(
  recordId: string,
  recordedAt: string,
  overrides: Partial<ReplayPointer> = {},
): ReplayPointer {
  return {
    recordId,
    recordedAt,
    stageId: 'stage-001',
    routeKey: 'route.core.runtime',
    status: AuditRecordStatus.SUCCEEDED,
    policyOutcome: 'allow',
    ...overrides,
  };
}

function createExecutionReport(overrides: Partial<ExecutionReport> = {}): ExecutionReport {
  return {
    executionId: 'exec-replay-001',
    generatedAt: '2026-03-21T12:00:00Z',
    totalRecords: 3,
    stageSummaries: [],
    riskSummary: {
      riskLevels: [],
      riskReasons: [],
      matchedPolicies: [],
      requiredActions: [],
    },
    failureSummary: {
      failedRecordIds: [],
      cancelledRecordIds: [],
      timeoutRecordIds: [],
    },
    replayPointers: [
      createReplayPointer('record-001', '2026-03-21T12:00:01Z'),
      createReplayPointer('record-002', '2026-03-21T12:00:02Z', {
        stageId: 'stage-002',
        routeKey: 'route.core.replay',
        status: AuditRecordStatus.FAILED,
        policyOutcome: 'confirm',
        riskLevel: 'high',
        artifactId: 'DA-057',
        outputLocale: 'en-US',
      }),
      createReplayPointer('record-003', '2026-03-21T12:00:03Z', {
        stageId: 'stage-002',
        routeKey: 'route.core.replay',
        status: AuditRecordStatus.CANCELLED,
        policyOutcome: 'escalate',
      }),
    ],
    ...overrides,
  };
}

describe('replay-explainer unit', () => {
  it('creates snapshot and resolves explain rows by stage filter', () => {
    const explainer = new ReplayExplainer();
    const snapshot = explainer.createSnapshot({
      report: createExecutionReport(),
    });

    const explainResult = explainer.explain({
      snapshot,
      stageId: 'stage-002',
      limit: 10,
    });

    expect(explainResult.executionId).toBe('exec-replay-001');
    expect(explainResult.matchedCount).toBe(2);
    expect(explainResult.pointers[0]?.recordId).toBe('record-002');
    expect(explainResult.pointers[1]?.recordId).toBe('record-003');
    expect(explainResult.explainLines[0]).toContain('stage=stage-002');
    expect(explainResult.explainLines[0]).toContain('route=route.core.replay');
    expect(explainResult.explainLines[0]).toContain('output_locale=en-US');
  });

  it('returns no-match explain line when filters resolve nothing', () => {
    const explainer = new ReplayExplainer();
    const snapshot = explainer.createSnapshot({
      report: createExecutionReport(),
    });

    const explainResult = explainer.explain({
      snapshot,
      routeKey: 'route.unknown',
    });

    expect(explainResult.matchedCount).toBe(0);
    expect(explainResult.explainLines).toEqual(['No replay pointers matched the query filters.']);
  });

  it('rejects explain request when record id does not exist in snapshot', () => {
    const explainer = new ReplayExplainer();
    const snapshot = explainer.createSnapshot({
      report: createExecutionReport(),
    });

    try {
      explainer.explain({
        snapshot,
        recordId: 'record-missing',
      });
      expect.unreachable('Expected explain to throw when recordId is missing.');
    } catch (error) {
      expect(error).toMatchObject({
        code: GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
      });
    }
  });

  it('rejects snapshot creation when report pointer ids are duplicated', () => {
    const explainer = new ReplayExplainer();

    try {
      explainer.createSnapshot({
        report: createExecutionReport({
          replayPointers: [
            createReplayPointer('record-001', '2026-03-21T12:00:01Z'),
            createReplayPointer('record-001', '2026-03-21T12:00:02Z'),
          ],
        }),
      });
      expect.unreachable('Expected snapshot creation to throw on duplicate record ids.');
    } catch (error) {
      expect(error).toMatchObject({
        code: GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
      });
    }
  });

  it('sorts same-second replay pointers by recordId for deterministic explain order', () => {
    const explainer = new ReplayExplainer();
    const snapshot = explainer.createSnapshot({
      report: createExecutionReport({
        replayPointers: [
          createReplayPointer('record-b', '2026-03-21T12:00:01Z', {
            stageId: 'stage-002',
          }),
          createReplayPointer('record-a', '2026-03-21T12:00:01Z', {
            stageId: 'stage-002',
          }),
        ],
      }),
    });

    const explainResult = explainer.explain({
      snapshot,
      stageId: 'stage-002',
      limit: 10,
    });

    expect(explainResult.pointers.map((pointer) => pointer.recordId)).toEqual([
      'record-a',
      'record-b',
    ]);
  });

  it('filters replay explain by outputLocale for i18n issue localization', () => {
    const explainer = new ReplayExplainer();
    const snapshot = explainer.createSnapshot({
      report: createExecutionReport({
        replayPointers: [
          createReplayPointer('record-001', '2026-03-21T12:00:01Z', {
            outputLocale: 'zh-CN',
          }),
          createReplayPointer('record-002', '2026-03-21T12:00:02Z', {
            outputLocale: 'en-US',
          }),
        ],
      }),
    });

    const explainResult = explainer.explain({
      snapshot,
      outputLocale: 'en-US',
    });

    expect(explainResult.query.outputLocale).toBe('en-US');
    expect(explainResult.matchedCount).toBe(1);
    expect(explainResult.pointers[0]?.recordId).toBe('record-002');
    expect(explainResult.explainLines[0]).toContain('output_locale=en-US');
  });
});
