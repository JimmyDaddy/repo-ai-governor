import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

const ROOT_DIR = path.resolve(".");
const SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "governance", "check-dynamic-import-usage.js");

function createTempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-dynamic-import-"));
}

function runDynamicImportGate(cwd: string) {
  return spawnSync(process.execPath, [SCRIPT_PATH, "--cwd", cwd, "--paths", "src"], {
    encoding: "utf8",
  });
}

test("dynamic import gate fails when import() is used without allow comment", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "index.ts"),
    ["export async function load(path: string) {", "  return import(path);", "}", ""].join("\n"),
    "utf8",
  );

  try {
    const result = runDynamicImportGate(workspace);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /status=fail/);
    assert.match(result.stderr, /\[dynamic-import\]/);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("dynamic import gate fails when require() is used without allow comment", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "index.ts"),
    ["export function loadPkg() {", '  return require("./pkg.json");', "}", ""].join("\n"),
    "utf8",
  );

  try {
    const result = runDynamicImportGate(workspace);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /status=fail/);
    assert.match(result.stderr, /\[require\]/);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("dynamic import gate passes when usage includes allow comment", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "index.ts"),
    [
      'import { createRequire } from "node:module";',
      "const require = createRequire(import.meta.url);",
      "// dynamic-import-allowed: load optional package metadata at runtime",
      'const pkg = require("./pkg.json");',
      "export async function load(path: string) {",
      "  // dynamic-import-allowed: platform-conditional loader path",
      "  return import(path);",
      "}",
      "export { pkg };",
      "",
    ].join("\n"),
    "utf8",
  );

  try {
    const result = runDynamicImportGate(workspace);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /status=pass/);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
