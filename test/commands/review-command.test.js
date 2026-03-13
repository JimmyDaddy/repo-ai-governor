import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-review-"));
}

function createBufferedStream() {
  const chunks = [];

  return {
    isTTY: false,
    write(chunk) {
      chunks.push(String(chunk));
      return true;
    },
    toString() {
      return chunks.join("");
    }
  };
}

async function runCommand(argv) {
  const stdout = createBufferedStream();
  const stderr = createBufferedStream();
  const exitCode = await runCli(argv, { stdout, stderr });

  return {
    exitCode,
    stdout: stdout.toString(),
    stderr: stderr.toString()
  };
}

async function bootstrapRepo(cwd) {
  const initResult = await runCommand([
    "init",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--adapter",
    "codex",
    "--format",
    "json"
  ]);

  assert.equal(initResult.exitCode, EXIT_CODES.success);

  const planResult = await runCommand([
    "plan",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--title",
    "Implement governance review",
    "--format",
    "json"
  ]);

  assert.equal(planResult.exitCode, EXIT_CODES.success);
}

function initializeGitRepo(cwd) {
  const execOptions = {
    cwd,
    stdio: ["ignore", "ignore", "ignore"]
  };

  fs.writeFileSync(path.join(cwd, ".gitignore"), "node_modules/\n", "utf8");
  execFileSync("git", ["init"], execOptions);
  execFileSync("git", ["config", "user.name", "Codex"], execOptions);
  execFileSync("git", ["config", "user.email", "codex@example.com"], execOptions);
  execFileSync("git", ["add", "."], execOptions);
  execFileSync("git", ["commit", "-m", "chore: bootstrap"], execOptions);
}

test("review creates a pending CR file with warning findings for TODO markers and missing tests", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  fs.mkdirSync(path.join(cwd, "src"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "src", "example.js"), "export function example() {\n  // TODO: refine\n  return 1;\n}\n", "utf8");

  const result = await runCommand([
    "review",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--path",
    "src/example.js",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);
  const reviewFilePath = path.join(cwd, payload.reviewFile);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "warn");
  assert.equal(fs.existsSync(reviewFilePath), true);
  assert.ok(payload.findings.some((finding) => finding.id.startsWith("review.todo-marker")));
  assert.ok(payload.findings.some((finding) => finding.id.startsWith("review.mirrored-test")));
  assert.match(fs.readFileSync(reviewFilePath, "utf8"), /Pending verification/);
});

test("review strict mode fails the command when warning findings remain", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  fs.mkdirSync(path.join(cwd, "src"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "src", "strict-example.js"), "export function example() {\n  // TODO: refine\n  return 1;\n}\n", "utf8");

  const result = await runCommand([
    "review",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--path",
    "src/strict-example.js",
    "--strict",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(payload.status, "warn");
  assert.equal(payload.strict, true);
});

test("review fails when sprint task records are out of sync", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const checklistFile = path.join(cwd, "docs/demo/sprint-001/tasks/checklist.md");
  fs.writeFileSync(checklistFile, "# Sprint 001 Checklist\n\n- [ ] **TK-999** Broken sync\n", "utf8");

  const result = await runCommand([
    "review",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--path",
    "docs/demo/sprint-001/tasks",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(payload.status, "fail");
  assert.ok(payload.findings.some((finding) => finding.id === "review.task-record-sync"));
});

test("review passes when a source file has a mirrored test and no warnings", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  fs.mkdirSync(path.join(cwd, "src", "commands"), { recursive: true });
  fs.mkdirSync(path.join(cwd, "test", "commands"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "src", "commands", "sample.js"), "export function sample() {\n  return 1;\n}\n", "utf8");
  fs.writeFileSync(path.join(cwd, "test", "commands", "sample.test.js"), "export default true;\n", "utf8");

  const result = await runCommand([
    "review",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--path",
    "src/commands/sample.js",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "pass");
  assert.equal(payload.summary.warnings, 0);
  assert.ok(payload.findings.some((finding) => finding.id.startsWith("review.mirrored-test")));
});

test("review can infer targets from git working tree changes", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  initializeGitRepo(cwd);

  fs.mkdirSync(path.join(cwd, "src"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "src", "working-tree.js"), "export const value = 1;\n", "utf8");

  const result = await runCommand([
    "review",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.ok(payload.targets.includes("src/working-tree.js"));
});
