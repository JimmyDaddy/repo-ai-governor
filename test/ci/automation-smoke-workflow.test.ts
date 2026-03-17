import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";

const ROOT_DIR = path.resolve(".");

test("automation smoke workflow installs dependencies and runs smoke gate", () => {
  const workflowPath = path.join(ROOT_DIR, ".github", "workflows", "automation-smoke.yml");
  const workflow = fs.readFileSync(workflowPath, "utf8");

  assert.match(workflow, /name:\s*Automation Smoke/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /bash scripts\/ci\/run-automation-smoke\.sh/);
});
