import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { withReleaseTestLock } from "./release-test-lock.js";

const ROOT_DIR = path.resolve(".");

test("release readiness script validates package metadata and dry-run tarball contents", async () => {
  await withReleaseTestLock(() => {
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
    assert.ok(payload.requiredChecks.includes("npm run check:runtime-js-whitelist"));
    assert.ok(payload.requiredChecks.includes("npm run release:verify-local"));
    assert.equal(payload.binEntry, "./dist/bin/repo-ai-governor.js");
    assert.ok(payload.bundledFiles.includes("dist/bin/repo-ai-governor.js"));
    assert.ok(payload.bundledFiles.some((entry: string) => entry.startsWith("dist/src/")));
  });
});

test("runtime JS whitelist script validates packaged JS ownership boundaries", async () => {
  await withReleaseTestLock(() => {
    const output = execFileSync(
      process.execPath,
      [path.join(ROOT_DIR, "scripts", "release", "check-runtime-js-whitelist.js"), "--format=json"],
      {
        cwd: ROOT_DIR,
        encoding: "utf8",
      },
    );
    const payload = JSON.parse(output);

    assert.equal(payload.status, "pass");
    assert.ok(Array.isArray(payload.unownedBundledJsFiles));
    assert.deepEqual(payload.unownedBundledJsFiles, []);
    assert.ok(payload.nonDistBundledJsFiles.includes("bin/repo-ai-governor.js"));
    assert.ok(
      payload.nonDistBundledJsFiles.includes(
        "skills/official/governor-plan-runner/scripts/create-request-draft.js",
      ),
    );
  });
});

test("runtime JS whitelist script fails when non-dist packaged JS is not explicitly owned", async () => {
  await withReleaseTestLock(() => {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-js-whitelist-"));
    const configPath = path.join(temporaryDirectory, "runtime-js-whitelist.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          distAllowList: [
            {
              pathPrefix: "dist",
              owner: "Core",
              purpose: "TypeScript build outputs.",
            },
          ],
          pathAllowList: [],
        },
        null,
        2,
      ),
      "utf8",
    );

    try {
      execFileSync(
        process.execPath,
        [
          path.join(ROOT_DIR, "scripts", "release", "check-runtime-js-whitelist.js"),
          "--format=json",
          "--config",
          configPath,
        ],
        {
          cwd: ROOT_DIR,
          encoding: "utf8",
        },
      );
      assert.fail("Expected runtime JS whitelist check to fail for unowned non-dist JS files.");
    } catch (error) {
      const typedError = error as { stdout?: string };
      const payload = JSON.parse(String(typedError.stdout ?? "{}"));

      assert.equal(payload.status, "fail");
      assert.ok(payload.unownedBundledJsFiles.includes("bin/repo-ai-governor.js"));
    } finally {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});

test("local distribution verification packs installs and executes the CLI", async () => {
  await withReleaseTestLock(() => {
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
});
