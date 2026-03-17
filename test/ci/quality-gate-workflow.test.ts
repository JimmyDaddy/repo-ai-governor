import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";

const ROOT_DIR = path.resolve(".");

test("quality gate workflow runs ci quality gate on push and pull request", () => {
  const workflowPath = path.join(ROOT_DIR, ".github", "workflows", "quality-gate.yml");
  const workflow = fs.readFileSync(workflowPath, "utf8");

  assert.match(workflow, /name:\s*Quality Gate/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run ci:quality/);
});
