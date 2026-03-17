import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { test } from "vitest";

const ROOT_DIR = path.resolve(".");

test("release readiness script validates package metadata and dry-run tarball contents", () => {
  const output = execFileSync(
    process.execPath,
    [path.join(ROOT_DIR, "scripts", "release", "check-release-ready.js"), "--format=json"],
    {
      cwd: ROOT_DIR,
      encoding: "utf8",
    },
  );
  const payload = JSON.parse(output);

  assert.equal(payload.status, "pass");
  assert.equal(payload.private, false);
  assert.match(payload.repositoryUrl, /repo-ai-governor/);
  assert.equal(payload.publishAccess, "public");
  assert.equal(payload.publishProvenance, true);
  assert.equal(payload.changelogExists, true);
  assert.equal(payload.changelogZhExists, true);
  assert.equal(payload.readmeExists, true);
  assert.equal(payload.readmeZhExists, true);
  assert.equal(payload.publishWorkflowExists, true);
  assert.equal(payload.releaseItConfigExists, true);
  assert.equal(payload.gettingStartedScriptExists, true);
  assert.ok(Array.isArray(payload.requiredChecks));
  assert.ok(payload.requiredChecks.includes("npm run ci:quality"));
  assert.ok(payload.requiredChecks.includes("npm run check:ts-only"));
  assert.ok(payload.requiredChecks.includes("npm run release:verify-local"));
  assert.equal(payload.binEntry, "./dist/bin/repo-ai-governor.js");
  assert.ok(payload.bundledFiles.includes("dist/bin/repo-ai-governor.js"));
  assert.ok(payload.bundledFiles.some((entry: string) => entry.startsWith("dist/src/")));
});

test("local distribution verification packs installs and executes the CLI", () => {
  const output = execFileSync(
    process.execPath,
    [path.join(ROOT_DIR, "scripts", "release", "verify-local-distribution.js"), "--format=json"],
    {
      cwd: ROOT_DIR,
      encoding: "utf8",
    },
  );
  const payload = JSON.parse(output);

  assert.equal(payload.status, "pass");
  assert.equal(payload.checks.help, true);
  assert.equal(payload.checks.version, true);
  assert.equal(payload.checks.distEntrypoint, true);
  assert.equal(payload.binEntry, "./dist/bin/repo-ai-governor.js");
  assert.match(payload.tarball, /\.tgz$/);
});
