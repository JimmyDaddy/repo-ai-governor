import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT_DIR = path.resolve(".");

test("render-release-notes extracts a version section from CHANGELOG", () => {
  const output = execFileSync(
    process.execPath,
    [
      path.join(ROOT_DIR, "scripts", "release", "render-release-notes.js"),
      "--version",
      "0.1.0",
      "--format=json"
    ],
    {
      cwd: ROOT_DIR,
      encoding: "utf8"
    }
  );
  const payload = JSON.parse(output);

  assert.equal(payload.status, "pass");
  assert.equal(payload.version, "0.1.0");
  assert.equal(payload.targetSection, "0.1.0");
  assert.match(payload.body, /Release 0\.1\.0/);
  assert.match(payload.body, /Commander-based CLI/);
});

test("release workflow skeleton includes gate notes and publish steps", () => {
  const workflowPath = path.join(ROOT_DIR, ".github", "workflows", "release-ga.yml");
  const workflow = fs.readFileSync(workflowPath, "utf8");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /name:\s*Release GA \(Manual\)/);
  assert.match(workflow, /npm run release:ga-check/);
  assert.match(workflow, /render-release-notes\.js/);
  assert.match(workflow, /RELEASE_TARBALL=/);
  assert.match(workflow, /softprops\/action-gh-release@v2/);
  assert.doesNotMatch(workflow, /publish_npm/);
  assert.doesNotMatch(workflow, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}/);
  assert.doesNotMatch(workflow, /npm publish --access public/);
  assert.doesNotMatch(workflow, /repo-ai-governor-\$\{\{ env\.RELEASE_VERSION \}\}\.tgz/);
});

test("publish workflow runs GA gate before npm publish with provenance", () => {
  const workflowPath = path.join(ROOT_DIR, ".github", "workflows", "publish-npm.yml");
  const workflow = fs.readFileSync(workflowPath, "utf8");

  assert.match(workflow, /release:\s*\n\s*types:\s*\n\s*-\s*published/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /node-version:\s*24/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run release:ga-check/);
  assert.match(workflow, /npm publish --provenance --access public/);
});

test("release-it config uses GA gate and delegates npm publish to CI", () => {
  const configPath = path.join(ROOT_DIR, ".release-it.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  assert.equal(config.git.commitMessage, "chore(release): ${version}");
  assert.equal(config.git.tagName, "v${version}");
  assert.deepEqual(config.git.requireBranch, ["main"]);
  assert.equal(config.npm.publish, false);
  assert.equal(config.github.release, true);
  assert.ok(Array.isArray(config.hooks["before:init"]));
  assert.ok(config.hooks["before:init"].includes("npm run release:ga-check"));
});

test("render-release-notes can write release notes to an output file", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-release-notes-"));
  const outputPath = path.join(outputDir, "release-notes.md");

  execFileSync(
    process.execPath,
    [
      path.join(ROOT_DIR, "scripts", "release", "render-release-notes.js"),
      "--version",
      "0.1.0",
      "--out",
      outputPath
    ],
    {
      cwd: ROOT_DIR,
      encoding: "utf8"
    }
  );

  const content = fs.readFileSync(outputPath, "utf8");

  assert.match(content, /# Release 0\.1\.0/);
  assert.match(content, /local distribution verification/);
});
