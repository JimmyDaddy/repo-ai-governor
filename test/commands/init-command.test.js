import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-init-"));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
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

test("init dry-run renders planned bootstrap files without writing to disk", async () => {
  const cwd = createTempRepo();
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
    "json",
    "--dry-run"
  ]);
  const payload = JSON.parse(result.stdout);
  const plannedFiles = new Set(payload.files.map((entry) => entry.path));

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "planned");
  assert.equal(payload.currentProject, "mvp");
  assert.equal(payload.currentSprint, "sprint-001");
  assert.deepEqual(payload.enabledAdapters, ["codex"]);
  assert.equal(fs.existsSync(path.join(cwd, ".repo-ai-governor/governor.yaml")), false);
  assert.equal(fs.existsSync(path.join(cwd, "AGENTS.md")), false);
  assert.equal(fs.existsSync(path.join(cwd, ".repo-ai-governor/context/current-context.md")), false);
  assert.equal(fs.existsSync(path.join(cwd, "docs/mvp/sprint-001/plan.md")), false);
  assert.ok(plannedFiles.has(".repo-ai-governor/governor.yaml"));
  assert.ok(plannedFiles.has("AGENTS.md"));
  assert.ok(plannedFiles.has(".repo-ai-governor/context/current-context.md"));
  assert.ok(plannedFiles.has(".repo-ai-governor/adapters/codex.yaml"));
  assert.ok(plannedFiles.has("docs/mvp/sprint-001/index.md"));
  assert.ok(plannedFiles.has("docs/mvp/sprint-001/plan.md"));
  assert.ok(plannedFiles.has("docs/mvp/sprint-001/tasks/checklist.md"));
  assert.ok(plannedFiles.has("docs/mvp/sprint-001/tasks/tasks.csv"));
});

test("init creates config agents and sprint scaffolding for a new repository", async () => {
  const cwd = createTempRepo();
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
  const configFilePath = path.join(cwd, ".repo-ai-governor/governor.yaml");
  const configDocument = YAML.parse(fs.readFileSync(configFilePath, "utf8"));
  const agentsContent = fs.readFileSync(path.join(cwd, "AGENTS.md"), "utf8");
  const currentContextContent = fs.readFileSync(
    path.join(cwd, ".repo-ai-governor/context/current-context.md"),
    "utf8"
  );
  const checklistContent = fs.readFileSync(
    path.join(cwd, "docs/mvp/sprint-001/tasks/checklist.md"),
    "utf8"
  );
  const csvContent = fs.readFileSync(path.join(cwd, "docs/mvp/sprint-001/tasks/tasks.csv"), "utf8");
  const payload = JSON.parse(result.stdout);
  const actions = new Set(payload.files.map((entry) => entry.action));

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "initialized");
  assert.deepEqual(actions, new Set(["create"]));
  assert.equal(configDocument.execution.currentProject, "mvp");
  assert.equal(configDocument.execution.currentSprint, "sprint-001");
  assert.deepEqual(configDocument.adapters.enabled, ["codex"]);
  assert.equal(fs.existsSync(path.join(cwd, ".repo-ai-governor/adapters/codex.yaml")), true);
  assert.equal(fs.existsSync(path.join(cwd, ".repo-ai-governor/context/current-context.md")), true);
  assert.equal(fs.existsSync(path.join(cwd, "docs/mvp/sprint-001/index.md")), true);
  assert.equal(fs.existsSync(path.join(cwd, "docs/mvp/sprint-001/plan.md")), true);
  assert.equal(fs.statSync(path.join(cwd, "docs/mvp/sprint-001/code-review")).isDirectory(), true);
  assert.match(agentsContent, /Read `.repo-ai-governor\/context\/current-context.md` before acting/);
  assert.match(currentContextContent, /Project: `mvp`/);
  assert.match(currentContextContent, /Sprint: `sprint-001`/);
  assert.match(checklistContent, /\*\*TK-001\*\*/);
  assert.match(csvContent, /^execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at/m);
});

test("init refuses to overwrite existing bootstrap targets without force", async () => {
  const cwd = createTempRepo();

  writeFile(path.join(cwd, "AGENTS.md"), "# Existing\n");

  const result = await runCommand([
    "init",
    "--cwd",
    cwd,
    "--project",
    "mvp",
    "--sprint",
    "sprint-001",
    "--adapter",
    "codex"
  ]);

  assert.equal(result.exitCode, EXIT_CODES.configError);
  assert.match(result.stderr, /Refusing to overwrite existing init targets without --force/);
});

test("init can render locale-specific bootstrap templates", async () => {
  const cwd = createTempRepo();
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
    "--locale",
    "en-US",
    "--format",
    "json"
  ]);
  const indexContent = fs.readFileSync(path.join(cwd, "docs/mvp/sprint-001/index.md"), "utf8");
  const planContent = fs.readFileSync(path.join(cwd, "docs/mvp/sprint-001/plan.md"), "utf8");
  const checklistContent = fs.readFileSync(
    path.join(cwd, "docs/mvp/sprint-001/tasks/checklist.md"),
    "utf8"
  );

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.match(indexContent, /This directory stores execution artifacts/);
  assert.match(planContent, /Bootstrap repository governance/);
  assert.match(checklistContent, /Add the first real task to this sprint/);
});
