import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

type AnyRecord = Record<string, any>;

const ROOT_DIR = path.resolve(".");
const SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "governance", "check-ts-only-residue.js");
const DEFAULT_CONFIG = {
  scopes: ["src", "test"],
  allowList: [],
  pathAllowList: [],
  outOfScopeAllowList: []
};

function createTempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-ts-only-"));
}

function writeWhitelistConfig(workspace: string, payload: AnyRecord = DEFAULT_CONFIG) {
  const configDirectory = path.join(workspace, "scripts", "governance");
  fs.mkdirSync(configDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, "ts-only-whitelist.json"),
    JSON.stringify(payload, null, 2),
    "utf8"
  );
}

function runTsOnlyGate(args: string[] = []): AnyRecord {
  const output = execFileSync(process.execPath, [SCRIPT_PATH, "--format=json", ...args], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });
  return JSON.parse(output);
}

test("TS-only gate passes for the repository src/test scopes", () => {
  const payload = runTsOnlyGate();

  assert.equal(payload.status, "pass");
  assert.deepEqual(payload.violations, []);
});

test("TS-only gate reports violations for new JavaScript files in audited scopes", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "src", "legacy.js"), "export const legacy = true;\n", "utf8");
  writeWhitelistConfig(workspace);

  try {
    runTsOnlyGate(["--cwd", workspace]);
    assert.fail("Expected TS-only gate to fail when src/**/*.js exists.");
  } catch (error) {
    const output = String((error as AnyRecord).stdout ?? "");
    const payload = JSON.parse(output);

    assert.equal(payload.status, "fail");
    assert.deepEqual(payload.violations, ["src/legacy.js"]);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("TS-only gate allows files explicitly listed in the whitelist", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "src", "legacy.js"), "export const legacy = true;\n", "utf8");
  writeWhitelistConfig(workspace, {
    scopes: ["src", "test"],
    allowList: ["src/legacy.js"]
  });

  try {
    const payload = runTsOnlyGate(["--cwd", workspace]);

    assert.equal(payload.status, "pass");
    assert.deepEqual(payload.violations, []);
    assert.deepEqual(payload.jsFiles, ["src/legacy.js"]);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("TS-only gate supports structured pathAllowList entries with explicit reasons", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "src"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "src", "legacy.js"), "export const legacy = true;\n", "utf8");
  writeWhitelistConfig(workspace, {
    scopes: ["src", "test"],
    pathAllowList: [
      {
        path: "src/legacy.js",
        reason: "runtime bootstrap entry that must stay JavaScript"
      }
    ]
  });

  try {
    const payload = runTsOnlyGate(["--cwd", workspace]);

    assert.equal(payload.status, "pass");
    assert.deepEqual(payload.violations, []);
    assert.deepEqual(payload.allowList, ["src/legacy.js"]);
    assert.equal(payload.pathAllowList.length, 1);
    assert.equal(payload.pathAllowList[0].path, "src/legacy.js");
    assert.equal(payload.pathAllowList[0].reason, "runtime bootstrap entry that must stay JavaScript");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("TS-only gate reports out-of-scope JavaScript files when no explicit exemption exists", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "bin"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "bin", "runtime.js"), "console.log('runtime');\n", "utf8");
  writeWhitelistConfig(workspace, DEFAULT_CONFIG);

  try {
    runTsOnlyGate(["--cwd", workspace]);
    assert.fail("Expected TS-only gate to fail when out-of-scope JS is not explicitly exempted.");
  } catch (error) {
    const output = String((error as AnyRecord).stdout ?? "");
    const payload = JSON.parse(output);

    assert.equal(payload.status, "fail");
    assert.deepEqual(payload.outsideScopeViolations, ["bin/runtime.js"]);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("TS-only gate allows out-of-scope JavaScript files explicitly listed in outOfScopeAllowList", () => {
  const workspace = createTempWorkspace();
  fs.mkdirSync(path.join(workspace, "bin"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "bin", "runtime.js"), "console.log('runtime');\n", "utf8");
  writeWhitelistConfig(workspace, {
    scopes: ["src", "test"],
    pathAllowList: [],
    outOfScopeAllowList: [
      {
        path: "bin",
        reason: "runtime bootstrap remains JavaScript"
      }
    ]
  });

  try {
    const payload = runTsOnlyGate(["--cwd", workspace]);

    assert.equal(payload.status, "pass");
    assert.deepEqual(payload.outsideScopeViolations, []);
    assert.deepEqual(payload.outsideScopeJsFiles, ["bin/runtime.js"]);
    assert.equal(payload.outsideScopeAllowList.length, 1);
    assert.equal(payload.outsideScopeAllowList[0].path, "bin");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
