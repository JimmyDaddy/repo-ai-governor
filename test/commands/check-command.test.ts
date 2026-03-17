import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-check-"));
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
    "Implement governance checks",
    "--format",
    "json"
  ]);

  assert.equal(planResult.exitCode, EXIT_CODES.success);
}

test("check passes on generated planning artifacts", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const result = await runCommand([
    "check",
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
  assert.equal(payload.status, "pass");
  assert.equal(payload.workflow.status, "passed");
  assert.deepEqual(payload.workflow.selectedStageIds, ["plan", "breakdown", "self-check"]);
  assert.equal(payload.summary.errors, 0);
  assert.ok(payload.standards.matchedRuleIds.includes("process-plan-must-state-scope"));
  assert.ok(payload.standards.matchedRuleIds.includes("process-task-records-must-sync"));
  assert.ok(payload.standards.matchedRuleIds.includes("quality-check-results-must-be-recorded"));
});

test("check fails when the plan is missing required governance sections", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const planFile = path.join(cwd, "docs/demo/sprint-001/plan.md");
  const currentPlan = fs.readFileSync(planFile, "utf8");
  const brokenPlan = currentPlan.includes("## 验收标准")
    ? currentPlan.replace(/^## 验收标准[\s\S]*?^## 验证路径/m, "## 验证路径")
    : currentPlan.replace(/^## Acceptance[\s\S]*?^## Verification Path/m, "## Verification Path");

  fs.writeFileSync(planFile, brokenPlan, "utf8");

  const result = await runCommand([
    "check",
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
  const acceptanceFinding = payload.checks.find((check: any) => check.id === "check.plan.section.acceptance");

  assert.equal(result.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(payload.status, "fail");
  assert.equal(payload.workflow.stages.find((stage: any) => stage.id === "plan")?.status, "failed");
  assert.equal(payload.workflow.stages.find((stage: any) => stage.id === "breakdown")?.status, "blocked");
  assert.equal(acceptanceFinding?.status, "fail");
});

test("check can write a report file and warns when changed-only falls back to full scan", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const result = await runCommand([
    "check",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--changed-only",
    "--write-report",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);
  const reportFilePath = path.join(cwd, ".repo-ai-governor/reports/latest.json");

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "warn");
  assert.equal(payload.reportFile, ".repo-ai-governor/reports/latest.json");
  assert.equal(fs.existsSync(reportFilePath), true);
  assert.match(fs.readFileSync(reportFilePath, "utf8"), /"command": "check"/);
});

test("check exposes active slot runtime details when enabled slots match a stage", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const configFilePath = path.join(cwd, ".repo-ai-governor/governor.yaml");
  const config = YAML.parse(fs.readFileSync(configFilePath, "utf8"));
  config.slots.enabled = ["check-plan-slot"];
  fs.writeFileSync(configFilePath, YAML.stringify(config), "utf8");

  writeFile(
    path.join(cwd, ".repo-ai-governor/slots/check-plan-slot.yaml"),
    [
      "id: check-plan-slot",
      'version: "1"',
      "kind: governance-slot",
      "meta:",
      "  owner: platform",
      "  source: project-local",
      "  slotType: documentation-output",
      "  name:",
      '    zh-CN: 检查方案插槽',
      '    en-US: Check Plan Slot',
      "trigger:",
      "  match: all",
      "  when:",
      "    stages:",
      "      - plan",
      "    commands:",
      "      - check",
      "behavior:",
      "  priority: 200",
      "  conflictPolicy: merge",
      "  inject:",
      "    ai:",
      "      promptKey: plan-check-checklist",
      "checks:",
      "  before:",
      "    - 检查 plan 阶段是否命中自定义插槽"
    ].join("\n")
  );

  const result = await runCommand([
    "check",
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
  const planStage = payload.workflow.stages.find((stage: any) => stage.id === "plan");

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.deepEqual(planStage?.slots.active.map((slot: any) => slot.id), ["check-plan-slot"]);
  assert.deepEqual(planStage?.slots.injections.aiPromptKeys, ["plan-check-checklist"]);
});
