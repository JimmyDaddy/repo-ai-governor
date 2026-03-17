import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-plan-"));
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

async function bootstrapRepo(cwd: any) {
  const result = await runCommand([
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

  assert.equal(result.exitCode, EXIT_CODES.success);
}

test("plan dry-run renders generated sprint artifacts without writing task files", async () => {
  const cwd = createTempRepo();

  await bootstrapRepo(cwd);

  const result = await runCommand([
    "plan",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--title",
    "Implement planning workflow",
    "--format",
    "json",
    "--dry-run"
  ]);
  const payload = JSON.parse(result.stdout);
  const plannedFiles = new Set(payload.files.map((entry: any) => entry.path));

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "planned");
  assert.equal(payload.workflow.status, "passed");
  assert.deepEqual(payload.workflow.selectedStageIds, ["plan", "breakdown"]);
  assert.equal(payload.tasks.length, 4);
  assert.ok(plannedFiles.has("docs/demo/sprint-001/plan.md"));
  assert.ok(plannedFiles.has("docs/demo/sprint-001/tasks/checklist.md"));
  assert.ok(plannedFiles.has("docs/demo/sprint-001/tasks/tasks.csv"));
  assert.ok(plannedFiles.has("docs/demo/sprint-001/tasks/TK-002.md"));
  assert.equal(fs.existsSync(path.join(cwd, "docs/demo/sprint-001/tasks/TK-002.md")), false);
});

test("plan writes plan checklist csv and task files for a bootstrapped sprint", async () => {
  const cwd = createTempRepo();
  const inputFilePath = path.join(cwd, "request.md");

  writeFile(
    inputFilePath,
    [
      "# Request",
      "",
      "Implement a deterministic sprint planning flow for the repository.",
      "It should generate plan.md, checklist.md, tasks.csv, and task cards."
    ].join("\n")
  );

  await bootstrapRepo(cwd);

  const result = await runCommand([
    "plan",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--title",
    "Implement sprint planning flow",
    "--input",
    "request.md",
    "--locale",
    "en-US",
    "--format",
    "json",
    "--out",
    ".repo-ai-governor/reports/plan-summary.md"
  ]);
  const payload = JSON.parse(result.stdout);
  const planContent = fs.readFileSync(path.join(cwd, "docs/demo/sprint-001/plan.md"), "utf8");
  const checklistContent = fs.readFileSync(
    path.join(cwd, "docs/demo/sprint-001/tasks/checklist.md"),
    "utf8"
  );
  const csvContent = fs.readFileSync(path.join(cwd, "docs/demo/sprint-001/tasks/tasks.csv"), "utf8");
  const taskFileContent = fs.readFileSync(
    path.join(cwd, "docs/demo/sprint-001/tasks/TK-002.md"),
    "utf8"
  );
  const summaryContent = fs.readFileSync(
    path.join(cwd, ".repo-ai-governor/reports/plan-summary.md"),
    "utf8"
  );

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "generated");
  assert.equal(payload.currentProject, "demo");
  assert.equal(payload.currentSprint, "sprint-001");
  assert.equal(payload.standards.preset, "official/base");
  assert.equal(payload.tasks.length, 4);
  assert.equal(payload.outputFile, ".repo-ai-governor/reports/plan-summary.md");
  assert.match(planContent, /Implement sprint planning flow/);
  assert.match(planContent, /Standards For This Plan/);
  assert.match(checklistContent, /\*\*TK-002\*\*/);
  assert.match(csvContent, /^execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at/m);
  assert.match(taskFileContent, /Relevant standards:/);
  assert.match(summaryContent, /"command": "plan"/);
  assert.equal(fs.existsSync(path.join(cwd, "docs/demo/sprint-001/tasks/TK-005.md")), true);
});
