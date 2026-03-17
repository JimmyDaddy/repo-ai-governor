import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT_DIR = path.resolve(".");
const SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "governance", "check-esm-import-specifiers.js");

function createTempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-esm-specifier-"));
}

function runSpecifierCheck(cwd: string) {
  return spawnSync(process.execPath, [SCRIPT_PATH, "--cwd", cwd, "--paths", "src"], {
    encoding: "utf8"
  });
}

test("import specifier gate rejects relative imports without explicit extension", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "src", "index.js"), 'import "./dep";\n', "utf8");
  fs.writeFileSync(path.join(workspace, "src", "dep.js"), 'export const value = 1;\n', "utf8");

  try {
    const result = runSpecifierCheck(workspace);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /status=fail/);
    assert.ok(result.stderr.includes('invalid import specifier "./dep"'));
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("import specifier gate rejects non-relative specifiers ending with .js", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "src", "index.js"), 'import "pkg/subpath.js";\n', "utf8");

  try {
    const result = runSpecifierCheck(workspace);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /status=fail/);
    assert.ok(result.stderr.includes('invalid import specifier "pkg/subpath.js"'));
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("import specifier gate allows relative .js and package export imports", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, "src", "index.js"),
    ['import "./dep.js";', 'import "yaml";', ""].join("\n"),
    "utf8"
  );
  fs.writeFileSync(path.join(workspace, "src", "dep.js"), 'export const value = 1;\n', "utf8");

  try {
    const result = runSpecifierCheck(workspace);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /status=pass/);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
