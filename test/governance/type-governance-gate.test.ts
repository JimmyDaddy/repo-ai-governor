import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

type AnyRecord = Record<string, any>;

const ROOT_DIR = path.resolve(".");
const SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "governance", "check-type-governance.js");

function createTempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-type-governance-"));
}

function writeRequiredTypeDirectories(workspace: string) {
  fs.mkdirSync(path.join(workspace, "src", "types", "interfaces"), { recursive: true });
  fs.mkdirSync(path.join(workspace, "src", "types", "aliases"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "types", "interfaces", "index.ts"),
    "export {};\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(workspace, "src", "types", "aliases", "index.ts"),
    "export {};\n",
    "utf8",
  );
}

function writeWhitelist(workspace: string, payload: AnyRecord) {
  const directory = path.join(workspace, "scripts", "governance");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, "type-governance-whitelist.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );
}

function runTypeGovernanceGate(cwd: string) {
  return spawnSync(process.execPath, [SCRIPT_PATH, "--cwd", cwd, "--format=json"], {
    encoding: "utf8",
  });
}

test("type governance gate passes for repository baseline", () => {
  const result = runTypeGovernanceGate(ROOT_DIR);
  const payload = JSON.parse(String(result.stdout ?? "{}"));

  assert.equal(result.status, 0);
  assert.equal(payload.status, "pass");
});

test("type governance gate fails for object-shape type alias without allow comment", () => {
  const workspace = createTempWorkspace();
  writeRequiredTypeDirectories(workspace);
  fs.writeFileSync(
    path.join(workspace, "src", "types", "aliases", "user.type.ts"),
    ["export type User = {", "  id: string;", "  name: string;", "};", ""].join("\n"),
    "utf8",
  );

  try {
    const result = runTypeGovernanceGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 1);
    assert.equal(payload.status, "fail");
    assert.equal(
      payload.findings.some((finding: AnyRecord) => finding.code === "type_shape_alias_forbidden"),
      true,
    );
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("type governance gate allows object-shape type alias with explicit allow comment", () => {
  const workspace = createTempWorkspace();
  writeRequiredTypeDirectories(workspace);
  fs.writeFileSync(
    path.join(workspace, "src", "types", "aliases", "compat.type.ts"),
    [
      "// type-shape-allowed: temporary compat boundary",
      "export type CompatShape = {",
      "  id: string;",
      "  enabled: boolean;",
      "};",
      "",
    ].join("\n"),
    "utf8",
  );

  try {
    const result = runTypeGovernanceGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 0);
    assert.equal(payload.status, "pass");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("type governance gate fails when declarations remain outside managed directories", () => {
  const workspace = createTempWorkspace();
  writeRequiredTypeDirectories(workspace);
  fs.writeFileSync(
    path.join(workspace, "src", "legacy.ts"),
    ["export interface LegacyRecord {", "  id: string;", "}", ""].join("\n"),
    "utf8",
  );

  try {
    const result = runTypeGovernanceGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 1);
    assert.equal(payload.status, "fail");
    assert.equal(
      payload.findings.some(
        (finding: AnyRecord) => finding.code === "type_declaration_outside_managed_dirs",
      ),
      true,
    );
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("type governance gate allows legacy declaration paths through whitelist", () => {
  const workspace = createTempWorkspace();
  writeRequiredTypeDirectories(workspace);
  fs.writeFileSync(
    path.join(workspace, "src", "legacy.ts"),
    ["export interface LegacyRecord {", "  id: string;", "}", ""].join("\n"),
    "utf8",
  );
  writeWhitelist(workspace, {
    pathAllowList: [
      {
        path: "src/legacy.ts",
        reason: "migration backlog",
      },
    ],
  });

  try {
    const result = runTypeGovernanceGate(workspace);
    const payload = JSON.parse(String(result.stdout ?? "{}"));

    assert.equal(result.status, 0);
    assert.equal(payload.status, "pass");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
