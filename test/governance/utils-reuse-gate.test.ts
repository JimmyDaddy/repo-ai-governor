import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

type AnyRecord = Record<string, any>;

const ROOT_DIR = path.resolve(".");
const SCRIPT_PATH = path.join(
  ROOT_DIR,
  "scripts",
  "governance",
  "check-utils-reuse-governance.js"
);

function createTempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-utils-reuse-"));
}

function writeUtilsWhitelist(workspace: string, payload: AnyRecord) {
  const directory = path.join(workspace, "scripts", "governance");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, "utils-reuse-whitelist.json"),
    JSON.stringify(payload, null, 2),
    "utf8"
  );
}

function writeExecutionNotes(workspace: string, content: string) {
  const notesPath = path.join(workspace, "docs", "demo", "sprint-001", "execution_notes.md");
  fs.mkdirSync(path.dirname(notesPath), { recursive: true });
  fs.writeFileSync(notesPath, content, "utf8");
}

function runUtilsReuseGate(cwd: string) {
  return spawnSync(process.execPath, [SCRIPT_PATH, "--cwd", cwd, "--format=json"], {
    encoding: "utf8"
  });
}

test("utils reuse gate passes for repository baseline", () => {
  const result = runUtilsReuseGate(ROOT_DIR);
  const payload = JSON.parse(String(result.stdout ?? "{}"));

  assert.equal(result.status, 0);
  assert.equal(payload.status, "pass");
});

test("utils reuse gate fails when new utility function misses execution_notes record", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src", "utils"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "utils", "feature.ts"),
    "export function parseFlag(input: string): boolean { return input === \"1\"; }\n",
    "utf8"
  );
  writeUtilsWhitelist(workspace, {
    executionNotesPath: "docs/demo/sprint-001/execution_notes.md",
    allowList: []
  });
  writeExecutionNotes(workspace, "# execution notes\n");

  try {
    const result = runUtilsReuseGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 1);
    assert.equal(payload.status, "fail");
    assert.equal(
      payload.findings.some((finding: AnyRecord) => finding.code === "utils_reuse_note_missing"),
      true
    );
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("utils reuse gate passes when execution_notes records reuse evaluation for new utility", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src", "utils"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "utils", "feature.ts"),
    "export function parseFlag(input: string): boolean { return input === \"1\"; }\n",
    "utf8"
  );
  writeUtilsWhitelist(workspace, {
    executionNotesPath: "docs/demo/sprint-001/execution_notes.md",
    allowList: []
  });
  writeExecutionNotes(
    workspace,
    [
      "# execution notes",
      "",
      "- util: src/utils/feature.ts#parseFlag",
      "  - reuse-eval: searched src/utils/common.ts and no reusable parser exists.",
      ""
    ].join("\n")
  );

  try {
    const result = runUtilsReuseGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 0);
    assert.equal(payload.status, "pass");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("utils reuse gate fails on duplicate utility function names", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src", "utils"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "utils", "a.ts"),
    "export function normalizePath(value: string): string { return value.trim(); }\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(workspace, "src", "utils", "b.ts"),
    "export function normalizePath(value: string): string { return value; }\n",
    "utf8"
  );
  writeUtilsWhitelist(workspace, {
    executionNotesPath: "docs/demo/sprint-001/execution_notes.md",
    allowList: ["src/utils/a.ts#normalizePath", "src/utils/b.ts#normalizePath"]
  });
  writeExecutionNotes(workspace, "# execution notes\n");

  try {
    const result = runUtilsReuseGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 1);
    assert.equal(payload.status, "fail");
    assert.equal(
      payload.findings.some((finding: AnyRecord) => finding.code === "utils_duplicate_name"),
      true
    );
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
