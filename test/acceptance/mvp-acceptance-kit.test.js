import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT_DIR = path.resolve(".");

test("mvp acceptance script bootstraps a workspace and produces end-to-end artifacts", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-acceptance-test-"));
  const output = execFileSync(
    "bash",
    [path.join(ROOT_DIR, "scripts", "acceptance", "run-mvp-acceptance.sh"), workspace],
    {
      cwd: ROOT_DIR,
      encoding: "utf8"
    }
  ).trim();

  assert.equal(output, workspace);
  assert.equal(fs.existsSync(path.join(workspace, "acceptance-record.md")), true);
  assert.equal(
    fs.existsSync(path.join(workspace, ".repo-ai-governor", "reports", "acceptance-latest.md")),
    true
  );

  const codeReviewDir = path.join(workspace, "docs", "demo", "sprint-001", "code-review");
  const reviewFiles = fs.readdirSync(codeReviewDir);

  assert.ok(reviewFiles.some((fileName) => fileName.startsWith("resolved_review_")));
});
