import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

type AnyRecord = Record<string, any>;

const ROOT_DIR = path.resolve(".");
const SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "governance", "check-finite-literal-sets.js");

function createTempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-finite-literal-set-"));
}

function runFiniteLiteralSetGate(cwd: string) {
  return spawnSync(process.execPath, [SCRIPT_PATH, "--cwd", cwd, "--format=json"], {
    encoding: "utf8",
  });
}

function writeWhitelist(workspace: string, payload: AnyRecord) {
  const whitelistDirectory = path.join(workspace, "scripts", "governance");
  fs.mkdirSync(whitelistDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(whitelistDirectory, "literal-set-whitelist.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );
}

test("finite literal set gate fails when implementation layer declares inline finite sets", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "feature.ts"),
    [
      'const TASK_STATUSES = ["todo", "done"] as const;',
      "export function isDone(status: string) {",
      "  return TASK_STATUSES.includes(status as any);",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );

  try {
    const result = runFiniteLiteralSetGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 1);
    assert.equal(payload.status, "fail");
    assert.equal(payload.findings.length, 1);
    assert.equal(payload.findings[0].identifier, "TASK_STATUSES");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("finite literal set gate allows one-off local literals with reason comment", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "feature.ts"),
    [
      "// literal-set-allowed: one-off local branch check",
      'const TASK_STATUSES = ["todo", "done"] as const;',
      "export function isDone(status: string) {",
      "  return TASK_STATUSES.includes(status as any);",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );

  try {
    const result = runFiniteLiteralSetGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 0);
    assert.equal(payload.status, "pass");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("finite literal set gate allows declarations under src/constants", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src", "constants"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "constants", "workflow.ts"),
    'export const STAGES = ["plan", "implement", "review"] as const;\n',
    "utf8",
  );

  try {
    const result = runFiniteLiteralSetGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 0);
    assert.equal(payload.status, "pass");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("finite literal set gate allows legacy paths listed in whitelist", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "legacy.ts"),
    'const LEGACY_VALUES = ["A", "B"] as const;\n',
    "utf8",
  );
  writeWhitelist(workspace, {
    pathAllowList: [
      {
        path: "src/legacy.ts",
        reason: "legacy migration backlog",
      },
    ],
  });

  try {
    const result = runFiniteLiteralSetGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 0);
    assert.equal(payload.status, "pass");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
