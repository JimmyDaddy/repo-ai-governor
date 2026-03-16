import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT_DIR = path.resolve(".");
const SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "governance", "check-code-standards.js");

function createTempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-code-standards-"));
}

function runGate(options = {}) {
  return spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--format=json", ...(options.args ?? [])],
    {
      cwd: options.cwd ?? ROOT_DIR,
      encoding: "utf8"
    }
  );
}

test("code standards gate parses rules and executes verification commands", () => {
  const cwd = createTempWorkspace();
  const standardsPath = path.join(cwd, "code_standards.md");

  fs.writeFileSync(
    standardsPath,
    [
      "# Code Standards",
      "",
      "## Non-negotiable Rules",
      "",
      "- [CS-001] Example required rule.",
      "",
      "## Verification Commands",
      "",
      "```bash",
      "node -e \"process.exit(0)\"",
      "```"
    ].join("\n"),
    "utf8"
  );

  const result = runGate({
    cwd,
    args: ["--standards", "code_standards.md"]
  });
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 0);
  assert.equal(payload.status, "pass");
  assert.equal(payload.ruleCount, 1);
  assert.equal(payload.commandCount, 1);
  assert.equal(payload.commands[0].status, "pass");
});

test("code standards gate fails when verification section is missing", () => {
  const cwd = createTempWorkspace();
  const standardsPath = path.join(cwd, "code_standards.md");

  fs.writeFileSync(
    standardsPath,
    [
      "# Code Standards",
      "",
      "## Non-negotiable Rules",
      "",
      "- [CS-001] Example required rule."
    ].join("\n"),
    "utf8"
  );

  const result = runGate({
    cwd,
    args: ["--standards", "code_standards.md"]
  });
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(payload.status, "fail");
  assert.equal(payload.failures[0].code, "standards.verification_section_missing");
});

test("code standards gate fails on recursive check command", () => {
  const cwd = createTempWorkspace();
  const standardsPath = path.join(cwd, "code_standards.md");

  fs.writeFileSync(
    standardsPath,
    [
      "# Code Standards",
      "",
      "## Non-negotiable Rules",
      "",
      "- [CS-001] Example required rule.",
      "",
      "## Verification Commands",
      "",
      "```bash",
      "npm run check",
      "```"
    ].join("\n"),
    "utf8"
  );

  const result = runGate({
    cwd,
    args: ["--standards", "code_standards.md"]
  });
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(payload.status, "fail");
  assert.equal(payload.failures[0].code, "standards.recursive_gate_command");
});
