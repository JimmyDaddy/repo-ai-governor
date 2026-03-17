import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-doctor-"));
}

function writeFile(filePath: any, content: any) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function createBufferedStream() {
  const chunks: string[] = [];

  return {
    isTTY: false,
    write(chunk: any) {
      chunks.push(String(chunk));
      return true;
    },
    toString() {
      return chunks.join("");
    }
  };
}

async function runCommand(argv: any) {
  const stdout = createBufferedStream();
  const stderr = createBufferedStream();
  const exitCode = await runCli(argv, { stdout, stderr });

  return {
    exitCode,
    stdout: stdout.toString(),
    stderr: stderr.toString()
  };
}

async function bootstrapRepository(cwd: any) {
  const result = await runCommand([
    "init",
    "--cwd",
    cwd,
    "--project",
    "mvp",
    "--sprint",
    "sprint-001",
    "--adapter",
    "codex",
    "--format",
    "json"
  ]);

  assert.equal(result.exitCode, EXIT_CODES.success);
}

test("doctor passes on a bootstrapped repository", async () => {
  const cwd = createTempRepo();
  await bootstrapRepository(cwd);

  const result = await runCommand([
    "doctor",
    "--cwd",
    cwd,
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "pass");
  assert.equal(payload.summary.errors, 0);
  assert.equal(payload.summary.warnings, 0);
  assert.equal(payload.currentProject, "mvp");
  assert.equal(payload.currentSprint, "sprint-001");
});

test("doctor fails when the main config file is missing", async () => {
  const cwd = createTempRepo();
  const result = await runCommand([
    "doctor",
    "--cwd",
    cwd,
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);
  const configCheck = payload.checks.find((check: any) => check.id === "config.main-file");

  assert.equal(result.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(payload.status, "fail");
  assert.equal(payload.summary.errors, 1);
  assert.equal(configCheck.status, "fail");
  assert.match(configCheck.message, /(Main governor config file is missing|主配置文件缺失)/);
});

test("doctor strict fails on missing artifact warnings and --fix recreates safe directories", async () => {
  const cwd = createTempRepo();

  writeFile(
    path.join(cwd, ".repo-ai-governor/governor.yaml"),
    [
      'schemaVersion: "1"',
      "execution:",
      "  currentProject: mvp",
      "  currentSprint: sprint-001"
    ].join("\n")
  );

  const strictResult = await runCommand([
    "doctor",
    "--cwd",
    cwd,
    "--strict",
    "--format",
    "json"
  ]);
  const strictPayload = JSON.parse(strictResult.stdout);

  assert.equal(strictResult.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(strictPayload.status, "warn");
  assert.ok(strictPayload.summary.warnings > 0);

  const fixResult = await runCommand([
    "doctor",
    "--cwd",
    cwd,
    "--fix",
    "--format",
    "json"
  ]);
  const fixPayload = JSON.parse(fixResult.stdout);
  const fixedChecks = fixPayload.checks.filter((check: any) => check.status === "fixed");

  assert.equal(fixResult.exitCode, EXIT_CODES.success);
  assert.ok(fixPayload.summary.fixesApplied > 0);
  assert.ok(fixedChecks.length > 0);
  assert.equal(fs.statSync(path.join(cwd, ".repo-ai-governor/context")).isDirectory(), true);
  assert.equal(fs.statSync(path.join(cwd, ".repo-ai-governor/slots")).isDirectory(), true);
  assert.equal(fs.statSync(path.join(cwd, ".repo-ai-governor/adapters")).isDirectory(), true);
  assert.equal(fs.statSync(path.join(cwd, ".repo-ai-governor/reports")).isDirectory(), true);
  assert.equal(fs.statSync(path.join(cwd, ".repo-ai-governor/templates")).isDirectory(), true);
  assert.equal(fs.statSync(path.join(cwd, "docs/mvp/sprint-001/tasks")).isDirectory(), true);
  assert.equal(fs.statSync(path.join(cwd, "docs/mvp/sprint-001/code-review")).isDirectory(), true);
});
