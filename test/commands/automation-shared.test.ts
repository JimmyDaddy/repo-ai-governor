import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  findPatternEvidence,
  normalizeRiskTag,
  normalizeStringList,
  parseRiskTagList,
  readTextFileIfExists,
  toPositiveInteger
} from "../../src/commands/automation-shared.js";

test("automation shared helpers normalize and parse risk tags", () => {
  assert.equal(normalizeRiskTag("Dangerous-Command"), "dangerous_command");
  assert.deepEqual(normalizeStringList(["a", "a", " b "]), ["a", "b"]);
  assert.deepEqual(
    parseRiskTagList(["dangerous-command, infra_or_deploy", "dangerous_command"]),
    ["dangerous_command", "infra_or_deploy"]
  );
});

test("automation shared helpers resolve number fallback and pattern evidence", () => {
  assert.equal(toPositiveInteger("4.8", 1), 4);
  assert.equal(toPositiveInteger("0", 3), 3);

  const evidence = findPatternEvidence("please run rm -rf ./tmp/cache now", /rm\s+-rf/i);
  assert.equal(evidence, "rm -rf");
});

test("automation shared helpers read file content when file exists", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-automation-shared-"));
  const existingPath = path.join(dir, "exists.txt");
  fs.writeFileSync(existingPath, "hello world", "utf8");

  assert.equal(readTextFileIfExists(existingPath), "hello world");
  assert.equal(readTextFileIfExists(path.join(dir, "missing.txt")), "");
});
