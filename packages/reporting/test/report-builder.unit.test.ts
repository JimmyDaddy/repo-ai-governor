import { AuditRecordStatus, type PersistedAuditRecord } from "@repo-ai-governor/core-session";
import { GovernorErrorCode } from "@repo-ai-governor/shared";
import { type AuditRecordReader, ReportBuilder } from "../src/index.js";

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
  overrides: Partial<PersistedAuditRecord["event"]> = {},
): PersistedAuditRecord {
  return {
    recordId,
    recordedAt,
    event: {
      executionId: "exec-report-001",
      stageId: "stage-001",
      routeKey: "route.core.runtime",
      surface: "codex",
      agentRole: "governance_reviewer",
      roleProfileId: "role.default.governance-reviewer",
      roleSource: "default",
      policyOutcome: "allow",
      status: AuditRecordStatus.SUCCEEDED,
      startedAt: "2026-03-21T10:00:00Z",
      endedAt: "2026-03-21T10:00:05Z",
      startedAtDisplay: "2026-03-21 18:00:00 UTC+08:00",
      endedAtDisplay: "2026-03-21 18:00:05 UTC+08:00",
      executionSessionId: "session-report-001",
      memoryScope: "execution",
      memoryDelta: {
        writes: 1,
      },
      workspaceId: "workspace-report-001",
      workspaceMode: "tool_managed",
      workspaceRoot: "/tmp/repo-report",
      ...overrides,
    },
  };
}

describe("report-builder unit", () => {
  it("aggregates stage, risk, failure, and replay pointer summaries", async () => {
    const reader = new StubAuditRecordReader([
      createPersistedRecord("record-001", "2026-03-21T10:00:05Z", {
        stageId: "stage-001",
        status: AuditRecordStatus.SUCCEEDED,
        riskLevel: "low",
        matchedPolicies: ["policy.allow.default"],
      }),
      createPersistedRecord("record-002", "2026-03-21T10:00:10Z", {
        stageId: "stage-001",
        status: AuditRecordStatus.FAILED,
        policyOutcome: "confirm",
        riskLevel: "high",
        riskReasons: ["dependency-upgrade"],
        matchedPolicies: ["policy.hitl.dependency"],
        requiredAction: "human-review",
        timeoutIndicator: true,
        artifactId: "DA-057",
      }),
      createPersistedRecord("record-003", "2026-03-21T10:00:15Z", {
        stageId: "stage-002",
        routeKey: "route.core.replay",
        status: AuditRecordStatus.CANCELLED,
        policyOutcome: "escalate",
        riskLevel: "critical",
      }),
    ]);
    const builder = new ReportBuilder(reader);

    const report = await builder.buildExecutionReport({
      executionId: "exec-report-001",
      includeRecords: true,
    });

    expect(report.executionId).toBe("exec-report-001");
    expect(report.totalRecords).toBe(3);
    expect(report.stageSummaries).toHaveLength(2);
    expect(report.stageSummaries[0]?.statusBreakdown[AuditRecordStatus.SUCCEEDED]).toBe(1);
    expect(report.stageSummaries[0]?.statusBreakdown[AuditRecordStatus.FAILED]).toBe(1);
    expect(report.stageSummaries[1]?.statusBreakdown[AuditRecordStatus.CANCELLED]).toBe(1);
    expect(report.failureSummary.failedRecordIds).toEqual(["record-002"]);
    expect(report.failureSummary.cancelledRecordIds).toEqual(["record-003"]);
    expect(report.failureSummary.timeoutRecordIds).toEqual(["record-002"]);
    expect(report.riskSummary.riskLevels).toEqual(["critical", "high", "low"]);
    expect(report.replayPointers[1]?.artifactId).toBe("DA-057");
    expect(report.records).toHaveLength(3);
  });

  it("rejects report records when execution id does not match build options", async () => {
    const reader = new StubAuditRecordReader([
      createPersistedRecord("record-001", "2026-03-21T10:00:05Z", {
        executionId: "exec-report-mismatch",
      }),
    ]);
    const builder = new ReportBuilder(reader);

    await expect(
      builder.buildExecutionReport({
        executionId: "exec-report-001",
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.REPORT_BUILD_INPUT_INVALID,
    });
  });

  it("sorts same-second records by recordId for deterministic report output", async () => {
    const reader = new StubAuditRecordReader([
      createPersistedRecord("record-b", "2026-03-21T10:00:05Z"),
      createPersistedRecord("record-a", "2026-03-21T10:00:05Z"),
    ]);
    const builder = new ReportBuilder(reader);

    const report = await builder.buildExecutionReport({
      executionId: "exec-report-001",
      includeRecords: true,
    });

    expect(report.replayPointers.map((pointer) => pointer.recordId)).toEqual([
      "record-a",
      "record-b",
    ]);
    expect(report.records?.map((record) => record.recordId)).toEqual(["record-a", "record-b"]);
  });
});
