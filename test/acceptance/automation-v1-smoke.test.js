import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT_DIR = path.resolve(".");

test("automation smoke script validates codex/claude/copilot and multi-ai routing", () => {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), "repo-ai-governor-automation-smoke-test-")
  );
  const output = execFileSync(
    "bash",
    [path.join(ROOT_DIR, "scripts", "ci", "run-automation-smoke.sh")],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        REPO_AI_GOVERNOR_AUTOMATION_SMOKE_WORKSPACE: workspace,
        REPO_AI_GOVERNOR_AUTOMATION_SMOKE_FORMAT: "json",
        REPO_AI_GOVERNOR_AUTOMATION_SMOKE_ENTRY: "all"
      },
      encoding: "utf8"
    }
  );
  const payload = JSON.parse(output);
  const scenarioNames = payload.scenarios.map((scenario) => scenario.name);

  assert.equal(payload.status, "pass");
  assert.deepEqual(scenarioNames, [
    "codex",
    "claude-code",
    "github-copilot",
    "multi-ai-dev-review"
  ]);
  assert.ok(payload.scenarios.every((scenario) => scenario.status === "pass"));
});
