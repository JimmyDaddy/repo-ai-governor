import { test } from "vitest";
import assert from "node:assert/strict";
import {
  DEFAULT_TASK_CSV_COLUMNS,
  DEFAULT_REPOSITORY_LAYOUT,
  createReviewFileName,
  createReviewSlug,
  createTaskFileName,
  normalizeProjectSlug,
  normalizeSprintName,
  normalizeTaskId,
  resolveRepositoryLayout
} from "../../src/config/repository-layout.js";

test("resolveRepositoryLayout returns default config and sprint artifact paths", () => {
  const layout = resolveRepositoryLayout({
    cwd: "/workspace/repo-ai-governor",
    project: "mvp",
    sprint: "sprint-001"
  });

  assert.equal(layout.relative.configRoot, ".repo-ai-governor");
  assert.equal(layout.relative.configFile, ".repo-ai-governor/governor.yaml");
  assert.equal(layout.relative.contextDir, ".repo-ai-governor/context");
  assert.equal(layout.relative.currentContextFile, ".repo-ai-governor/context/current-context.md");
  assert.equal(layout.relative.slotsDir, ".repo-ai-governor/slots");
  assert.equal(layout.relative.adaptersDir, ".repo-ai-governor/adapters");
  assert.equal(layout.relative.projectDir, "docs/mvp");
  assert.equal(layout.relative.sprintDir, "docs/mvp/sprint-001");
  assert.equal(layout.relative.indexFile, "docs/mvp/sprint-001/index.md");
  assert.equal(layout.relative.planFile, "docs/mvp/sprint-001/plan.md");
  assert.equal(layout.relative.tasksDir, "docs/mvp/sprint-001/tasks");
  assert.equal(layout.relative.taskChecklistFile, "docs/mvp/sprint-001/tasks/checklist.md");
  assert.equal(layout.relative.taskCsvFile, "docs/mvp/sprint-001/tasks/tasks.csv");
  assert.equal(layout.relative.codeReviewDir, "docs/mvp/sprint-001/code-review");
  assert.deepEqual(layout.naming.taskCsvColumns, DEFAULT_TASK_CSV_COLUMNS);
  assert.equal(
    layout.absolute.configFile,
    "/workspace/repo-ai-governor/.repo-ai-governor/governor.yaml"
  );
  assert.equal(
    layout.absolute.currentContextFile,
    "/workspace/repo-ai-governor/.repo-ai-governor/context/current-context.md"
  );
  assert.equal(
    layout.absolute.codeReviewDir,
    "/workspace/repo-ai-governor/docs/mvp/sprint-001/code-review"
  );
});

test("naming helpers normalize project sprint task and review names", () => {
  assert.equal(normalizeProjectSlug("MVP Workflow"), "mvp-workflow");
  assert.equal(normalizeSprintName("SPRINT-001"), "sprint-001");
  assert.equal(normalizeTaskId("tk-101"), "TK-101");
  assert.equal(createTaskFileName("tk-101"), "TK-101.md");
  assert.equal(createReviewSlug("TK-101", "Design Config Layout"), "tk-101-design-config-layout");
  assert.equal(
    createReviewFileName({ status: "verified", slug: "TK-101 Design Config Layout" }),
    "verified_review_tk-101-design-config-layout.md"
  );
});

test("resolveRepositoryLayout exposes stable review filename conventions", () => {
  const layout = resolveRepositoryLayout();

  assert.deepEqual(layout.naming.reviewPatterns, DEFAULT_REPOSITORY_LAYOUT.artifacts.reviewFiles);
  assert.deepEqual(layout.naming.taskCsvColumns, DEFAULT_REPOSITORY_LAYOUT.artifacts.taskFiles.csvColumns);
  assert.equal(layout.naming.reviewExamples.pending, "review_tk-101-design-config-layout.md");
  assert.equal(
    layout.naming.reviewExamples.resolved,
    "resolved_review_tk-101-design-config-layout.md"
  );
});
