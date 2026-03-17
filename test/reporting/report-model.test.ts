import { test } from "vitest";
import assert from "node:assert/strict";
import { buildUnifiedReport, renderUnifiedReport } from "../../src/reporting/report-model.js";

test("buildUnifiedReport normalizes check payloads into a shared report shape", () => {
  const payload = {
    command: "check",
    status: "warn",
    cwd: "/tmp/demo",
    currentProject: "demo",
    currentSprint: "sprint-001",
    workflow: {
      status: "passed",
      summary: {
        passed: 3,
        failed: 0,
      },
      selectedStageIds: ["plan", "breakdown", "self-check"],
      stages: [
        {
          id: "plan",
          status: "passed",
          summary: "Plan structure satisfies the current governance rules.",
        },
      ],
    },
    standards: {
      preset: "official/base",
      totalRules: 7,
      matchedRuleIds: ["process-plan-must-state-scope"],
    },
    summary: {
      status: "warn",
      exitCode: 0,
      errors: 0,
      warnings: 1,
    },
    checks: [
      {
        id: "check.plan.section.goal",
        ruleId: "process-plan-must-state-scope",
        severity: "warning",
        status: "warn",
        message: "Plan is missing one optional section.",
        target: "docs/demo/sprint-001/plan.md",
        suggestion: "Restore the missing section.",
      },
    ],
    reportFile: ".repo-ai-governor/reports/latest.json",
  };

  const report = buildUnifiedReport(payload, { generatedAt: "2026-03-14T00:00:00.000Z" });

  assert.equal(report.kind, "governance-report");
  assert.equal(report.command, "check");
  assert.equal(report.workflow?.stages.length, 1);
  assert.equal(report.findings.length, 1);
  assert.deepEqual(report.nextActions, ["Restore the missing section."]);
  assert.equal(report.artifacts.reportFile, ".repo-ai-governor/reports/latest.json");
});

test("buildUnifiedReport supports review-style payloads with findings", () => {
  const payload = {
    command: "review",
    status: "pass",
    currentProject: "demo",
    currentSprint: "sprint-001",
    standards: {
      preset: "official/base",
      totalRules: 7,
      matchedRuleIds: ["quality-verification-before-delivery"],
    },
    summary: {
      status: "pass",
      exitCode: 0,
      errors: 0,
      warnings: 0,
    },
    findings: [
      {
        id: "review.mirrored-test.1",
        ruleId: "quality-verification-before-delivery",
        severity: "info",
        status: "pass",
        message: "Source file has a matching test file.",
        target: "src/example.js -> test/example.test.js",
      },
    ],
    reviewFile: "docs/demo/sprint-001/code-review/review_example.md",
  };

  const report = buildUnifiedReport(payload, { generatedAt: "2026-03-14T00:00:00.000Z" });

  assert.equal(report.findings[0].id, "review.mirrored-test.1");
  assert.equal(report.artifacts.reviewFile, "docs/demo/sprint-001/code-review/review_example.md");
  assert.deepEqual(report.nextActions, ["No follow-up actions required."]);
});

test("renderUnifiedReport outputs summary markdown and json variants", () => {
  const report = buildUnifiedReport(
    {
      command: "review-verify",
      status: "fail",
      currentProject: "demo",
      currentSprint: "sprint-001",
      summary: {
        status: "fail",
        exitCode: 1,
        errors: 1,
        warnings: 0,
      },
      findings: [
        {
          id: "review.task-record-sync",
          severity: "error",
          status: "fail",
          message: "Task records are not synchronized.",
          target: "docs/demo/sprint-001/tasks/checklist.md",
          suggestion: "Sync checklist and tasks.csv before delivery.",
        },
      ],
    },
    { generatedAt: "2026-03-14T00:00:00.000Z" },
  );

  const summary = renderUnifiedReport(report, "summary");
  const markdown = renderUnifiedReport(report, "markdown");
  const json = renderUnifiedReport(report, "json");

  assert.match(summary, /status=fail/);
  assert.match(summary, /next_action_1=Sync checklist and tasks.csv before delivery\./);
  assert.match(markdown, /# Governance Report: review-verify/);
  assert.match(markdown, /## Next Actions/);
  assert.match(json, /"kind": "governance-report"/);
});
