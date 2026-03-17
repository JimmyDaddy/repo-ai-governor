import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

const ROOT_DIR = path.resolve(".");
type AnyRecord = Record<string, any>;
type BufferedStream = {
  isTTY: boolean;
  write: (chunk: unknown) => boolean;
  toString: () => string;
};

function createTempRepo(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function createBufferedStream(): BufferedStream {
  const chunks: string[] = [];

  return {
    isTTY: false,
    write(chunk: unknown) {
      chunks.push(String(chunk));
      return true;
    },
    toString() {
      return chunks.join("");
    }
  };
}

async function runCommand(argv: string[]) {
  const stdout = createBufferedStream();
  const stderr = createBufferedStream();
  const exitCode = await runCli(argv, { stdout, stderr });

  return {
    exitCode,
    stdout: stdout.toString(),
    stderr: stderr.toString()
  };
}

async function bootstrapRepo(cwd: string) {
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
    "Governance CI flow",
    "--format",
    "json"
  ]);
  assert.equal(planResult.exitCode, EXIT_CODES.success);
}

test("governance check CI script runs doctor, check, and report generation", async () => {
  const cwd = createTempRepo("repo-ai-governor-ci-check-");
  await bootstrapRepo(cwd);

  execFileSync("bash", [path.join(ROOT_DIR, "scripts", "ci", "run-governance-check.sh")], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      REPO_AI_GOVERNOR_CWD: cwd,
      REPO_AI_GOVERNOR_PROJECT: "demo",
      REPO_AI_GOVERNOR_SPRINT: "sprint-001"
    },
    encoding: "utf8"
  });

  assert.equal(
    fs.existsSync(path.join(cwd, ".repo-ai-governor", "reports", "latest.json")),
    true
  );
  assert.equal(
    fs.existsSync(path.join(cwd, ".repo-ai-governor", "reports", "latest.md")),
    true
  );
});

test("governance review CI script supports strict mode for warning findings", async () => {
  const cwd = createTempRepo("repo-ai-governor-ci-review-");
  await bootstrapRepo(cwd);

  fs.mkdirSync(path.join(cwd, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "src", "example.js"),
    "export function example() {\n  // TODO: refine\n  return 1;\n}\n",
    "utf8"
  );

  let failed = false;

  try {
    execFileSync("bash", [path.join(ROOT_DIR, "scripts", "ci", "run-governance-review.sh")], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        REPO_AI_GOVERNOR_CWD: cwd,
        REPO_AI_GOVERNOR_PROJECT: "demo",
        REPO_AI_GOVERNOR_SPRINT: "sprint-001",
        REPO_AI_GOVERNOR_REVIEW_PATH: "src/example.js",
        REPO_AI_GOVERNOR_FAIL_ON_WARNING: "1"
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    failed = true;
    assert.equal((error as AnyRecord).status, EXIT_CODES.businessCheckFailed);
  }

  assert.equal(failed, true);
});
