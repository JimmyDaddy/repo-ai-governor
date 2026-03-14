import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT_DIR = path.resolve(".");

test("release readiness script validates package metadata and dry-run tarball contents", () => {
  const output = execFileSync(
    process.execPath,
    [path.join(ROOT_DIR, "scripts", "release", "check-release-ready.js"), "--format=json"],
    {
      cwd: ROOT_DIR,
      encoding: "utf8"
    }
  );
  const payload = JSON.parse(output);

  assert.equal(payload.status, "pass");
  assert.equal(payload.private, false);
  assert.ok(payload.bundledFiles.includes("bin/repo-ai-governor.js"));
  assert.ok(payload.bundledFiles.some((entry) => entry.startsWith("src/")));
});

test("local distribution verification packs installs and executes the CLI", () => {
  const output = execFileSync(
    process.execPath,
    [path.join(ROOT_DIR, "scripts", "release", "verify-local-distribution.js"), "--format=json"],
    {
      cwd: ROOT_DIR,
      encoding: "utf8"
    }
  );
  const payload = JSON.parse(output);

  assert.equal(payload.status, "pass");
  assert.equal(payload.checks.help, true);
  assert.equal(payload.checks.version, true);
  assert.match(payload.tarball, /\.tgz$/);
});
