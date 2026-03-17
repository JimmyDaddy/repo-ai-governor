import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { withReleaseTestLock } from "./release-test-lock.js";

const ROOT_DIR = path.resolve(".");

test("getting-started acceptance script installs the package and produces onboarding artifacts", async () => {
  await withReleaseTestLock(() => {
    const output = execFileSync(
      "/bin/bash",
      [
        path.join(ROOT_DIR, "scripts", "release", "run-getting-started-check.sh"),
        "--format=json",
        "--keep-artifacts",
      ],
      {
        cwd: ROOT_DIR,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: process.env.PATH ?? "",
        },
      },
    );
    const payload = JSON.parse(output);

    assert.equal(payload.status, "pass");
    assert.ok(fs.existsSync(payload.artifacts.plan));
    assert.ok(fs.existsSync(payload.artifacts.checklist));
    assert.ok(fs.existsSync(payload.artifacts.csv));
    assert.ok(fs.existsSync(payload.artifacts.report));
    assert.ok(fs.existsSync(payload.artifacts.record));

    fs.rmSync(payload.workspace, { recursive: true, force: true });
    fs.rmSync(payload.installDir, { recursive: true, force: true });
    fs.rmSync(path.join(ROOT_DIR, payload.tarball), { force: true });
  });
});
