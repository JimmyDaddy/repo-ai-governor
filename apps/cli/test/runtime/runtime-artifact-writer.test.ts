import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { WorkspaceMode } from "@repo-ai-governor/config";
import { AuditOutputMode, AuditRecordStatus } from "@repo-ai-governor/core-session";
import type { ExecutionReport } from "@repo-ai-governor/reporting";
import { CliRuntimeArtifactWriter } from "../../src/runtime/artifacts/runtime-artifact-writer.js";
import { CliReplayExplainBuilder } from "../../src/runtime/presentation/replay-explain-builder.js";

function createExecutionReportFixture(): ExecutionReport {
  return {
    executionId: "exec-123",
    generatedAt: "2026-03-24T12:00:00Z",
    totalRecords: 1,
    stageSummaries: [],
    riskSummary: {
      riskLevels: ["medium"],
      riskReasons: ["code"],
      matchedPolicies: [],
      requiredActions: ["allow"],
    },
    failureSummary: {
      failedRecordIds: [],
      cancelledRecordIds: [],
      timeoutRecordIds: [],
    },
    replayPointers: [
      {
        recordId: "record-1",
        recordedAt: "2026-03-24T12:00:00Z",
        stageId: "stage-report",
        routeKey: "route.report",
        status: AuditRecordStatus.SUCCEEDED,
        policyOutcome: "allow",
        outputMode: AuditOutputMode.JSON,
        outputLocale: "zh-CN",
      },
    ],
  };
}

describe("Cli runtime artifact writer", () => {
  it("persists report/replay outputs and replay diagnostics artifacts", async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), "cli-artifacts-"));
    const writer = new CliRuntimeArtifactWriter(
      {
        workspaceId: "ws-123",
        mode: WorkspaceMode.REPO_LOCAL,
        workspaceRoot: tempRoot,
      },
      (value) => value.toISOString().replace(/\.\d{3}Z$/u, "Z"),
    );

    try {
      const report = createExecutionReportFixture();
      const replayExplainBuilder = new CliReplayExplainBuilder();
      const replayExplainResult = replayExplainBuilder.buildFromExecutionReport(report, 1);

      const { reportPath, replayPath } = await writer.writeExecutionReportArtifacts({
        executionId: report.executionId,
        executionReport: report,
        replayExplainResult,
      });
      const reportPayload = await writer.safeReadJson(reportPath);
      const replayPayload = await writer.safeReadJson(replayPath);

      expect(reportPayload?.executionId).toBe("exec-123");
      expect(replayPayload?.executionId).toBe("exec-123");

      const replayArtifacts = await writer.writeReplayDiagnosticsArtifacts({
        replayPath,
        replayResolution: {
          sourceType: "execution_report",
          executionId: "exec-123",
          explainResult: replayExplainResult,
        },
        locale: "zh-CN",
        runtimeDebugOptions: {
          dryRun: false,
          trace: true,
        },
        nextActions: ["Persist replay diagnostics for reproducibility."],
      });
      const diagnosticsPayload = (await writer.safeReadJson(replayArtifacts.diagnosticsPath)) as {
        replay?: {
          sourceType?: string;
        };
      } | null;

      expect(replayArtifacts.tracePath).not.toBeNull();
      expect(diagnosticsPayload?.replay?.sourceType).toBe("execution_report");
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
