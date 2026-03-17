import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-upgrade-"));
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
}

test("upgrade preview renders planned operations without mutating files", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  const agentsPath = path.join(cwd, "AGENTS.md");
  const beforeAgents = fs.readFileSync(agentsPath, "utf8");

  const result = await runCommand([
    "upgrade",
    "--cwd",
    cwd,
    "--locale",
    "en-US",
    "--to-version",
    "1",
    "--preview",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "planned");
  assert.equal(payload.targetVersion, "1");
  assert.equal(payload.preview, true);
  assert.equal(payload.operations.length, 3);
  assert.match(payload.warnings[0], /already 1/);
  assert.equal(fs.readFileSync(agentsPath, "utf8"), beforeAgents);
});

test("upgrade with backup rewrites generated files and stores backups", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  const agentsPath = path.join(cwd, "AGENTS.md");
  const configPath = path.join(cwd, ".repo-ai-governor", "governor.yaml");

  fs.writeFileSync(agentsPath, "# stale\n", "utf8");

  const config = YAML.parse(fs.readFileSync(configPath, "utf8"));
  delete config.reporting;
  fs.writeFileSync(configPath, YAML.stringify(config), "utf8");

  const result = await runCommand([
    "upgrade",
    "--cwd",
    cwd,
    "--to-version",
    "1",
    "--backup",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);
  const backupAgents = path.join(cwd, payload.backupDir, "AGENTS.md");
  const upgradedConfig = YAML.parse(fs.readFileSync(configPath, "utf8"));

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "upgraded");
  assert.equal(payload.backups.length >= 1, true);
  assert.equal(fs.existsSync(backupAgents), true);
  assert.equal(fs.readFileSync(backupAgents, "utf8"), "# stale\n");
  assert.match(
    fs.readFileSync(agentsPath, "utf8"),
    /执行前先阅读 `.repo-ai-governor\/context\/current-context.md`/
  );
  assert.equal(upgradedConfig.schemaVersion, "1");
  assert.equal(upgradedConfig.reporting.outputDir, ".repo-ai-governor/reports");
});

test("upgrade rejects unsupported target versions", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const result = await runCommand([
    "upgrade",
    "--cwd",
    cwd,
    "--to-version",
    "2"
  ]);

  assert.equal(result.exitCode, EXIT_CODES.inputError);
  assert.match(result.stderr, /(Unsupported upgrade target version|不支持的升级目标版本)/);
});
