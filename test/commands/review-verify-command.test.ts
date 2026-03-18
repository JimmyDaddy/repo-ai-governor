import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

type BufferedStream = {
  isTTY: boolean;
  write: (chunk: string) => boolean;
  toString: () => string;
};

type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

function createTempRepo(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-review-verify-"));
}

function createBufferedStream(): BufferedStream {
  const chunks: string[] = [];

  return {
    isTTY: false,
    write(chunk: string): boolean {
      chunks.push(String(chunk));
      return true;
    },
    toString(): string {
      return chunks.join("");
    },
  };
}

async function runCommand(argv: string[]): Promise<CommandResult> {
  const stdout = createBufferedStream();
  const stderr = createBufferedStream();
  const exitCode = await runCli(argv, { stdout, stderr });

  return {
    exitCode,
    stdout: stdout.toString(),
    stderr: stderr.toString(),
  };
}

async function bootstrapRepo(cwd: string): Promise<void> {
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
    "Implement governance review verify",
    "--format",
    "json",
  ]);

  assert.equal(planResult.exitCode, EXIT_CODES.success);
}

test("review-verify appends verification results and renames pending review files to verified", async () => {
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
  const verifiedFilePath = path.join(cwd, verifyPayload.outputFile);

  assert.equal(verifyResult.exitCode, EXIT_CODES.success);
  assert.equal(verifyPayload.reviewStatusBefore, "pending");
  assert.equal(verifyPayload.reviewStatusAfter, "verified");
  assert.equal(fs.existsSync(path.join(cwd, reviewPayload.reviewFile)), false);
  assert.equal(fs.existsSync(verifiedFilePath), true);
  assert.match(fs.readFileSync(verifiedFilePath, "utf8"), /重新执行 review-verify/);
});

test("review-verify strict mode fails when warning findings remain", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  fs.mkdirSync(path.join(cwd, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "src", "strict-example.js"),
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
    "src/strict-example.js",
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
    "--strict",
    "--format",
    "json",
  ]);
  const verifyPayload = JSON.parse(verifyResult.stdout);

  assert.equal(verifyResult.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(verifyPayload.status, "warn");
  assert.equal(verifyPayload.strict, true);
});

test("review-verify can promote a verified review file to resolved after findings are fixed", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  fs.mkdirSync(path.join(cwd, "src", "commands"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "src", "commands", "sample.js"),
    "export function sample() {\n  // TODO: remove\n  return 1;\n}\n",
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
    "src/commands/sample.js",
    "--format",
    "json",
  ]);
  const reviewPayload = JSON.parse(reviewResult.stdout);

  const firstVerifyResult = await runCommand([
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
  const firstVerifyPayload = JSON.parse(firstVerifyResult.stdout);

  fs.mkdirSync(path.join(cwd, "test", "commands"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "src", "commands", "sample.js"),
    "export function sample() {\n  return 1;\n}\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(cwd, "test", "commands", "sample.test.js"),
    "export default true;\n",
    "utf8",
  );

  const secondVerifyResult = await runCommand([
    "review-verify",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--source",
    firstVerifyPayload.outputFile,
    "--format",
    "json",
  ]);
  const secondVerifyPayload = JSON.parse(secondVerifyResult.stdout);
  const resolvedFilePath = path.join(cwd, secondVerifyPayload.outputFile);

  assert.equal(secondVerifyResult.exitCode, EXIT_CODES.success);
  assert.equal(secondVerifyPayload.reviewStatusBefore, "verified");
  assert.equal(secondVerifyPayload.reviewStatusAfter, "resolved");
  assert.equal(fs.existsSync(path.join(cwd, firstVerifyPayload.outputFile)), false);
  assert.equal(fs.existsSync(resolvedFilePath), true);
  assert.match(fs.readFileSync(resolvedFilePath, "utf8"), /生命周期已推进为 resolved/);
});
