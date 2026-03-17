import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-report-"));
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
    },
  };
}

async function runCommand(argv: any) {
  const stdout = createBufferedStream();
  const stderr = createBufferedStream();
  const exitCode = await runCli(argv, { stdout, stderr });

  return {
    exitCode,
    stdout: stdout.toString(),
    stderr: stderr.toString(),
  };
}

async function bootstrapRepo(cwd: any) {
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
    "json",
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
    "Implement governance report",
    "--format",
    "json",
  ]);

  assert.equal(planResult.exitCode, EXIT_CODES.success);
}

test("report renders a check JSON payload into markdown and writes the default report file", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const checkResult = await runCommand([
    "check",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--locale",
    "en-US",
    "--format",
    "json",
  ]);

  const sourceFile = path.join(cwd, "check-result.json");
  fs.writeFileSync(sourceFile, checkResult.stdout, "utf8");

  const reportResult = await runCommand([
    "report",
    "--cwd",
    cwd,
    "--source",
    "check-result.json",
    "--format",
    "markdown",
  ]);
  const outputFilePath = path.join(cwd, ".repo-ai-governor/reports/latest.md");

  assert.equal(reportResult.exitCode, EXIT_CODES.success);
  assert.equal(fs.existsSync(outputFilePath), true);
  assert.match(fs.readFileSync(outputFilePath, "utf8"), /# Governance Report: check/);
  assert.match(reportResult.stdout, /# Governance Report: check/);
});

test("report can consume a review markdown record and render unified json in dry-run mode", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  fs.mkdirSync(path.join(cwd, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "src", "example.js"),
    "export function example() {\n  // TODO: refine\n  return 1;\n}\n",
    "utf8",
  );

  const reviewResult = await runCommand([
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
    "json",
  ]);
  const reviewPayload = JSON.parse(reviewResult.stdout);

  const reportResult = await runCommand([
    "report",
    "--cwd",
    cwd,
    "--source",
    reviewPayload.reviewFile,
    "--format",
    "json",
    "--dry-run",
  ]);
  const renderedReport = JSON.parse(reportResult.stdout);

  assert.equal(reportResult.exitCode, EXIT_CODES.success);
  assert.equal(renderedReport.kind, "governance-report");
  assert.equal(renderedReport.command, "review");
  assert.ok(renderedReport.findings.length >= 1);
  assert.equal(renderedReport.artifacts.reviewFile, path.resolve(cwd, reviewPayload.reviewFile));
});

test("report can consume a verified review markdown record and render summary output", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  fs.mkdirSync(path.join(cwd, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "src", "example.js"),
    "export function example() {\n  // TODO: refine\n  return 1;\n}\n",
    "utf8",
  );

  const reviewResult = await runCommand([
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
    "json",
  ]);
  const reviewPayload = JSON.parse(reviewResult.stdout);

  const verifyResult = await runCommand([
    "review-verify",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--source",
    reviewPayload.reviewFile,
    "--format",
    "json",
  ]);
  const verifyPayload = JSON.parse(verifyResult.stdout);

  const reportResult = await runCommand([
    "report",
    "--cwd",
    cwd,
    "--source",
    verifyPayload.outputFile,
    "--format",
    "summary",
    "--dry-run",
  ]);

  assert.equal(reportResult.exitCode, EXIT_CODES.success);
  assert.match(reportResult.stdout, /command=review-verify/);
  assert.match(reportResult.stdout, /status=warn/);
});
