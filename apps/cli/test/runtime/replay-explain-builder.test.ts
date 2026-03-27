import { AuditOutputMode, AuditRecordStatus } from '@repo-ai-governor/core-session';
import type { ExecutionReport } from '@repo-ai-governor/reporting';
import { CliRunReplaySourceType } from '../../src/constants/cli-governance-runtime.constant.js';
import {
  CliReplayExplainBuilder,
  type CliReplayExplainResolution,
} from '../../src/runtime/presentation/replay-explain-builder.js';

function createExecutionReportFixture(): ExecutionReport {
  return {
    executionId: 'exec-123',
    generatedAt: '2026-03-24T12:00:00Z',
    totalRecords: 1,
    stageSummaries: [],
    riskSummary: {
      riskLevels: ['medium'],
      riskReasons: ['code'],
      matchedPolicies: [],
      requiredActions: ['allow'],
    },
    failureSummary: {
      failedRecordIds: [],
      cancelledRecordIds: [],
      timeoutRecordIds: [],
    },
    replayPointers: [
      {
        recordId: 'record-1',
        recordedAt: '2026-03-24T12:00:00Z',
        stageId: 'stage-execute',
        routeKey: 'route.execute',
        status: AuditRecordStatus.SUCCEEDED,
        policyOutcome: 'allow',
        outputMode: AuditOutputMode.JSON,
        outputLocale: 'zh-CN',
      },
    ],
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
          overallAction: 'warn',
          actionCounts: {
            allow: 0,
            warn: 1,
            redact: 0,
            block: 0,
          },
          allowedRecordCount: 0,
          warningRecordCount: 1,
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
        phaseResults: [],
        sessionSummaryProjection: {
          scope: 'session',
          key: 'session-123',
          promotedRecordIds: ['execution:record-1'],
          updatedAt: '2026-03-24T12:00:00Z',
        },
      },
    },
  };
}

describe('Cli replay explain builder', () => {
  it('resolves execution reports into replay explain payloads', () => {
    const builder = new CliReplayExplainBuilder();
    const report = createExecutionReportFixture();

    const explain = builder.buildFromExecutionReport(report, 1);
    const resolution = builder.resolveReplayExplainPayload({
      replayPath: '/tmp/report.json',
      replayPayload: report,
    });

    expect(explain.executionId).toBe('exec-123');
    expect(explain.matchedCount).toBe(1);
    expect((resolution as CliReplayExplainResolution).sourceType).toBe(
      CliRunReplaySourceType.EXECUTION_REPORT,
    );
    expect(resolution.explainResult.explainLines[0]).toContain('stage=stage-execute');
    expect(resolution.explainResult.explainLines).toContain(
      'memory_promotion_outcome=session_summary_merged',
    );
    expect(resolution.explainResult.explainLines).toContain('memory_policy_action=warn');
    expect(resolution.memorySemantics?.sessionSummaryProjectionKey).toBe('session-123');
  });

  it('passes through replay-explain payloads without rebuilding snapshot', () => {
    const builder = new CliReplayExplainBuilder();
    const replayExplainPayload = {
      executionId: 'exec-234',
      query: {
        limit: 1,
      },
      matchedCount: 0,
      pointers: [],
      explainLines: ['No replay matches found.'],
    };

    const resolution = builder.resolveReplayExplainPayload({
      replayPath: '/tmp/replay.json',
      replayPayload: replayExplainPayload,
    });

    expect(resolution.sourceType).toBe(CliRunReplaySourceType.REPLAY_EXPLAIN);
    expect(resolution.executionId).toBe('exec-234');
    expect(resolution.explainResult).toEqual(replayExplainPayload);
  });
});
