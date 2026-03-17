import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

type AnyRecord = Record<string, any>;

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-run-"));
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

function readJson(filePath: any) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
  writeFile(
    path.join(cwd, "docs", "demo", "sprint-001", "tasks", "TK-001.md"),
    "# TK-001\n\n- Status: todo\n"
  );
}

function writeGovernorConfig(cwd: any, updateFn: any) {
  const configPath = path.join(cwd, ".repo-ai-governor", "governor.yaml");
  const config = YAML.parse(fs.readFileSync(configPath, "utf8"));
  const updatedConfig = updateFn(config) ?? config;
  fs.writeFileSync(configPath, YAML.stringify(updatedConfig), "utf8");
}

function createSurfaceWorkspaceBindings(cwd: any) {
  fs.mkdirSync(path.join(cwd, ".codex", "skills"), { recursive: true });
  fs.mkdirSync(path.join(cwd, ".claude", "skills"), { recursive: true });
  fs.mkdirSync(path.join(cwd, ".github", "skills"), { recursive: true });
}

function createExecutable(filePath: any, content: any) {
  writeFile(filePath, content);
  fs.chmodSync(filePath, 0o755);
}

function createFakeSurfaceBinaries(cwd: any, options: AnyRecord = {}) {
  const binDir = path.join(cwd, ".fake-bin");
  const withCodex = options.codex !== false;
  const withClaude = options.claude !== false;
  const withGh = options.gh !== false;

  fs.mkdirSync(binDir, { recursive: true });

  if (withCodex) {
    createExecutable(
      path.join(binDir, "codex"),
      ["#!/bin/sh", 'echo "codex 0.0.1"', "exit 0", ""].join("\n")
    );
  }

  if (withClaude) {
    createExecutable(
      path.join(binDir, "claude"),
      ["#!/bin/sh", 'echo "claude 0.0.1"', "exit 0", ""].join("\n")
    );
  }

  if (withGh) {
    createExecutable(
      path.join(binDir, "gh"),
      [
        "#!/bin/sh",
        'if [ "$1" = "copilot" ]; then',
        '  echo "copilot help"',
        "  exit 0",
        "fi",
        'echo "gh 0.0.1"',
        "exit 0",
        ""
      ].join("\n")
    );
  }

  return binDir;
}

async function runWithPrependedPath(prefix: any, callback: any, options: AnyRecord = {}) {
  const originalPath = process.env.PATH ?? "";
  const appendOriginal = options.appendOriginal ?? true;
  process.env.PATH = appendOriginal
    ? `${prefix}${path.delimiter}${originalPath}`
    : prefix;

  try {
    return await callback();
  } finally {
    process.env.PATH = originalPath;
  }
}

function indexRoutingDecisions(payload: AnyRecord): Map<string, AnyRecord> {
  return new Map<string, AnyRecord>(
    (payload.routing?.routes ?? []).map((decision: AnyRecord) => [String(decision.routeKey), decision]),
  );
}

test("run aligns with plan-task flow and routes ai roles before review/task loops", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nImplement run orchestration.\n");
  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: true,
    gh: true
  });

  const result = await runWithPrependedPath(
    binDir,
    () =>
    runCommand([
      "run",
      "--cwd",
      cwd,
      "--project",
      "demo",
      "--sprint",
      "sprint-001",
      "--mode",
      "assisted",
      "--input",
      "request.md",
      "--dry-run",
      "--format",
      "json"
    ]),
    {
      appendOriginal: false
    }
  );
  const payload = JSON.parse(result.stdout);
  const routingByStage = indexRoutingDecisions(payload);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "pass");
  assert.equal(payload.process.source, "default");
  assert.ok(Array.isArray(payload.process.snapshot.workflow.stageOrder));
  assert.equal(payload.preflight.status, "passed");
  assert.equal(payload.workflow.status, "passed");
  assert.equal(routingByStage.get("requirements-draft")?.resolvedSurface, "codex");
  assert.equal(routingByStage.get("draft-review")?.resolvedSurface, "claude-code");
  assert.equal(routingByStage.get("draft-review-verify")?.resolvedSurface, "codex");
  assert.equal(routingByStage.get("technical-solution-review")?.resolvedSurface, "claude-code");
  assert.equal(routingByStage.get("task-implementation")?.resolvedSurface, "codex");
  assert.equal(routingByStage.get("task-code-review")?.resolvedSurface, "github-copilot");
  assert.ok(payload.workflow.stages.some((stage: any) => stage.id === "draft-review-loop"));
  assert.ok(payload.workflow.stages.some((stage: any) => stage.id === "technical-solution-loop"));
  assert.ok(payload.workflow.stages.some((stage: any) => stage.id === "task-breakdown"));
  assert.ok(payload.workflow.stages.some((stage: any) => stage.id === "task-delivery-loop"));
});

test("run dry-run previews dispatch without side effects", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nDry run.\n");
  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: true,
    gh: true
  });

  const result = await runWithPrependedPath(
    binDir,
    () =>
    runCommand([
      "run",
      "--cwd",
      cwd,
      "--project",
      "demo",
      "--sprint",
      "sprint-001",
      "--mode",
      "assisted",
      "--input",
      "request.md",
      "--dry-run",
      "--format",
      "json"
    ]),
    {
      appendOriginal: false
    }
  );
  const payload = JSON.parse(result.stdout);
  const draftLoopStage = payload.workflow.stages.find((stage: any) => stage.id === "draft-review-loop");
  const solutionLoopStage = payload.workflow.stages.find((stage: any) => stage.id === "technical-solution-loop");
  const taskLoopStage = payload.workflow.stages.find((stage: any) => stage.id === "task-delivery-loop");

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.dryRun, true);
  assert.equal(draftLoopStage?.loop?.maxReviewCycles, 2);
  assert.equal(draftLoopStage?.loop?.resolved, true);
  assert.equal(solutionLoopStage?.loop?.maxReviewCycles, 3);
  assert.equal(solutionLoopStage?.loop?.resolved, true);
  assert.equal(taskLoopStage?.loop?.maxReviewCycles, 3);
  assert.equal(taskLoopStage?.loop?.processedTasks >= 1, true);
});

test("run fails preflight when required surfaces are unavailable", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nNeed preflight.\n");
  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: false,
    gh: true
  });

  const result = await runWithPrependedPath(
    binDir,
    () =>
    runCommand([
      "run",
      "--cwd",
      cwd,
      "--project",
      "demo",
      "--sprint",
      "sprint-001",
      "--mode",
      "assisted",
      "--non-interactive",
      "--input",
      "request.md",
      "--format",
      "json"
    ]),
    {
      appendOriginal: false
    }
  );
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.environmentError);
  assert.equal(payload.status, "fail");
  assert.equal(payload.preflight.status, "failed");
  assert.equal(payload.workflow.failure?.stageId, "preflight");
  assert.ok(
    payload.preflight.blocking.some(
      (issue: any) =>
        issue.id.includes("draft-review") || issue.id.includes("technical-solution-review")
    )
  );
  assert.ok(payload.preflight.blocking.every((issue: any) => issue.strategy === "block"));
});

test("run pauses preflight in interactive mode when required surfaces are unavailable", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nNeed preflight pause.\n");
  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: false,
    gh: true
  });

  const result = await runWithPrependedPath(
    binDir,
    () =>
      runCommand([
        "run",
        "--cwd",
        cwd,
        "--project",
        "demo",
        "--sprint",
        "sprint-001",
        "--mode",
        "assisted",
        "--input",
        "request.md",
        "--format",
        "json"
      ]),
    {
      appendOriginal: false
    }
  );
  const payload = JSON.parse(result.stdout);
  const routingByStage = indexRoutingDecisions(payload);
  const preflightStage = payload.workflow.stages.find((stage: any) => stage.id === "preflight");

  assert.equal(result.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(payload.status, "fail");
  assert.equal(payload.preflight.status, "blocked");
  assert.equal(preflightStage?.status, "blocked");
  assert.ok(payload.preflight.pausing.length > 0);
  assert.ok(payload.preflight.pausing.every((issue: any) => issue.strategy === "pause_for_approval"));
  assert.equal(routingByStage.get("draft-review")?.decision, "pause_for_approval");
  assert.equal(payload.workflow.failure, null);
});

test("run uses cli route overrides before routing profile defaults", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nRoute override.\n");
  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: false,
    gh: true
  });

  const result = await runWithPrependedPath(
    binDir,
    () =>
    runCommand([
      "run",
      "--cwd",
      cwd,
      "--project",
      "demo",
      "--sprint",
      "sprint-001",
      "--mode",
      "assisted",
      "--route",
      "draft-review=codex",
      "--route",
      "technical-solution-review=codex",
      "--input",
      "request.md",
      "--dry-run",
      "--format",
      "json"
    ]),
    {
      appendOriginal: false
    }
  );
  const payload = JSON.parse(result.stdout);
  const routingByStage = indexRoutingDecisions(payload);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "pass");
  assert.equal(routingByStage.get("draft-review")?.source, "cli");
  assert.equal(routingByStage.get("draft-review")?.resolvedSurface, "codex");
  assert.equal(routingByStage.get("technical-solution-review")?.source, "cli");
  assert.equal(routingByStage.get("technical-solution-review")?.resolvedSurface, "codex");
});

test("run supports configurable ai role routing and configurable surface probes", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nConfigurable roles.\n");
  fs.mkdirSync(path.join(cwd, ".custom", "writer"), { recursive: true });
  fs.mkdirSync(path.join(cwd, ".custom", "reviewer"), { recursive: true });
  fs.mkdirSync(path.join(cwd, ".custom", "planner"), { recursive: true });
  fs.mkdirSync(path.join(cwd, ".custom", "dev"), { recursive: true });

  writeGovernorConfig(cwd, (config: any) => {
    config.automation.routingProfile = "custom-role-flow";
    config.automation.profiles = {
      "custom-role-flow": {
        defaultSurface: "dev-bot",
        routing: {
          "requirements-draft": "writer-bot",
          "draft-review": "reviewer-bot",
          "draft-review-verify": "reviewer-bot",
          "technical-solution": "writer-bot",
          "technical-solution-review": "reviewer-bot",
          "technical-solution-revise": "dev-bot",
          "task-breakdown": "planner-bot",
          "task-implementation": "dev-bot",
          "task-code-review": "reviewer-bot"
        }
      }
    };
    config.automation.surfaces = {
      "writer-bot": {
        binary: "writerbot",
        binaryArgs: ["--version"],
        healthArgs: ["--version"],
        workspaceDir: ".custom/writer"
      },
      "reviewer-bot": {
        binary: "reviewerbot",
        binaryArgs: ["--version"],
        healthArgs: ["--version"],
        workspaceDir: ".custom/reviewer"
      },
      "planner-bot": {
        binary: "plannerbot",
        binaryArgs: ["--version"],
        healthArgs: ["--version"],
        workspaceDir: ".custom/planner"
      },
      "dev-bot": {
        binary: "devbot",
        binaryArgs: ["--version"],
        healthArgs: ["--version"],
        workspaceDir: ".custom/dev"
      }
    };
    return config;
  });

  const binDir = path.join(cwd, ".fake-custom-bin");
  fs.mkdirSync(binDir, { recursive: true });
  createExecutable(path.join(binDir, "writerbot"), "#!/bin/sh\necho writerbot\nexit 0\n");
  createExecutable(path.join(binDir, "reviewerbot"), "#!/bin/sh\necho reviewerbot\nexit 0\n");
  createExecutable(path.join(binDir, "plannerbot"), "#!/bin/sh\necho plannerbot\nexit 0\n");
  createExecutable(path.join(binDir, "devbot"), "#!/bin/sh\necho devbot\nexit 0\n");

  const result = await runWithPrependedPath(
    binDir,
    () =>
      runCommand([
        "run",
        "--cwd",
        cwd,
        "--project",
        "demo",
        "--sprint",
        "sprint-001",
        "--mode",
        "assisted",
        "--input",
        "request.md",
        "--dry-run",
        "--format",
        "json"
      ]),
    {
      appendOriginal: false
    }
  );
  const payload = JSON.parse(result.stdout);
  const routingByStage = indexRoutingDecisions(payload);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "pass");
  assert.equal(routingByStage.get("requirements-draft")?.resolvedSurface, "writer-bot");
  assert.equal(routingByStage.get("draft-review")?.resolvedSurface, "reviewer-bot");
  assert.equal(routingByStage.get("draft-review-verify")?.resolvedSurface, "reviewer-bot");
  assert.equal(routingByStage.get("technical-solution")?.resolvedSurface, "writer-bot");
  assert.equal(routingByStage.get("technical-solution-review")?.resolvedSurface, "reviewer-bot");
  assert.equal(routingByStage.get("technical-solution-revise")?.resolvedSurface, "dev-bot");
  assert.equal(routingByStage.get("task-breakdown")?.resolvedSurface, "planner-bot");
  assert.equal(routingByStage.get("task-implementation")?.resolvedSurface, "dev-bot");
  assert.equal(routingByStage.get("task-code-review")?.resolvedSurface, "reviewer-bot");
  assert.ok(payload.preflight.reports.some((report: any) => report.surface === "writer-bot"));
  assert.ok(payload.preflight.reports.some((report: any) => report.surface === "reviewer-bot"));
});

test("run blocks high-risk actions in non-interactive mode without approval", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nPlease execute rm -rf /tmp/cache.\n");
  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: true,
    gh: true
  });

  const result = await runWithPrependedPath(
    binDir,
    () =>
      runCommand([
        "run",
        "--cwd",
        cwd,
        "--project",
        "demo",
        "--sprint",
        "sprint-001",
        "--mode",
        "assisted",
        "--non-interactive",
        "--input",
        "request.md",
        "--dry-run",
        "--format",
        "json"
      ]),
    {
      appendOriginal: false
    }
  );
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(payload.policy.decision, "block");
  assert.ok(payload.policy.riskTags.includes("dangerous_command"));
  assert.ok(payload.policy.missingApprovals.includes("dangerous_command"));
  assert.equal(payload.workflow.failure?.stageId, "policy-gate");
});

test("run pauses high-risk actions in interactive mode until approval is provided", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nPlease execute rm -rf /tmp/cache.\n");
  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: true,
    gh: true
  });

  const result = await runWithPrependedPath(
    binDir,
    () =>
      runCommand([
        "run",
        "--cwd",
        cwd,
        "--project",
        "demo",
        "--sprint",
        "sprint-001",
        "--mode",
        "assisted",
        "--input",
        "request.md",
        "--dry-run",
        "--format",
        "json"
      ]),
    {
      appendOriginal: false
    }
  );
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(payload.policy.decision, "pause_for_approval");
  assert.equal(payload.policy.stageStatus, "blocked");
  assert.ok(payload.policy.missingApprovals.includes("dangerous_command"));
});

test("run proceeds after explicit high-risk approval", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nPlease execute rm -rf /tmp/cache.\n");
  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: true,
    gh: true
  });

  const result = await runWithPrependedPath(
    binDir,
    () =>
      runCommand([
        "run",
        "--cwd",
        cwd,
        "--project",
        "demo",
        "--sprint",
        "sprint-001",
        "--mode",
        "assisted",
        "--input",
        "request.md",
        "--approve-risk",
        "dangerous-command",
        "--dry-run",
        "--format",
        "json"
      ]),
    {
      appendOriginal: false
    }
  );
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "pass");
  assert.equal(payload.policy.decision, "allow");
  assert.ok(payload.policy.requiredApprovalTags.includes("dangerous_command"));
  assert.ok(payload.policy.approvedRiskTags.includes("dangerous_command"));
  assert.equal(payload.workflow.status, "passed");
});

test("run marks process source as customized when automation.process overrides are configured", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nCustomized process.\n");
  writeGovernorConfig(cwd, (config: any) => {
    config.automation.process.taskLoop.maxReviewCycles = 5;
    return config;
  });

  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: true,
    gh: true
  });

  const result = await runWithPrependedPath(
    binDir,
    () =>
      runCommand([
        "run",
        "--cwd",
        cwd,
        "--project",
        "demo",
        "--sprint",
        "sprint-001",
        "--mode",
        "assisted",
        "--input",
        "request.md",
        "--dry-run",
        "--format",
        "json"
      ]),
    {
      appendOriginal: false
    }
  );
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.process.source, "customized");
  assert.equal(payload.process.snapshot.taskLoop.maxReviewCycles, 5);
});

test("run explain-process outputs compiled process snapshot without execution side effects", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const result = await runCommand([
    "run",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--mode",
    "assisted",
    "--explain-process",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "pass");
  assert.equal(payload.explainProcess, true);
  assert.equal(payload.validateProcess, false);
  assert.equal(payload.process.source, "default");
  assert.ok(Array.isArray(payload.process.snapshot.stages));
  assert.ok(Array.isArray(payload.process.snapshot.routeDefinitions));
  assert.equal(
    fs.existsSync(path.join(cwd, ".repo-ai-governor", "reports", "runs")),
    false
  );
});

test("run validate-process succeeds without dispatch or audit writes", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const result = await runCommand([
    "run",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--mode",
    "assisted",
    "--validate-process",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "pass");
  assert.equal(payload.validateProcess, true);
  assert.equal(payload.explainProcess, false);
  assert.equal(
    fs.existsSync(path.join(cwd, ".repo-ai-governor", "reports", "runs")),
    false
  );
});

test("run validate-process fails with actionable errors when process configuration is invalid", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  writeGovernorConfig(cwd, (config: any) => {
    config.automation.process.stageDefinitions = [
      {
        id: "duplicate-stage",
        kind: "ai",
        routeKey: "duplicate-stage"
      },
      {
        id: "duplicate-stage",
        kind: "ai",
        routeKey: "duplicate-stage-2"
      }
    ];
    return config;
  });

  const result = await runCommand([
    "run",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--mode",
    "assisted",
    "--validate-process",
    "--format",
    "json"
  ]);

  assert.equal(result.exitCode, EXIT_CODES.inputError);
  assert.match(result.stderr, /duplicate-stage/i);
});

test("run writes unique audit records with stage checkpoints into report artifacts", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nAudit trail.\n");
  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: true,
    gh: true
  });

  const firstRun = await runWithPrependedPath(
    binDir,
    () =>
      runCommand([
        "run",
        "--cwd",
        cwd,
        "--project",
        "demo",
        "--sprint",
        "sprint-001",
        "--mode",
        "assisted",
        "--input",
        "request.md",
        "--dry-run",
        "--format",
        "json"
      ]),
    {
      appendOriginal: false
    }
  );
  const firstPayload = JSON.parse(firstRun.stdout);
  const firstAuditFile = path.resolve(cwd, firstPayload.audit.recordFile);
  const firstLatestFile = path.resolve(cwd, firstPayload.audit.latestFile);
  const firstRecord = readJson(firstAuditFile);

  assert.equal(firstRun.exitCode, EXIT_CODES.success);
  assert.equal(firstPayload.kind, "run-audit-record");
  assert.ok(fs.existsSync(firstAuditFile));
  assert.ok(fs.existsSync(firstLatestFile));
  assert.equal(firstRecord.executionId, firstPayload.executionId);
  assert.ok(Array.isArray(firstRecord.checkpoints?.stages));
  assert.ok(firstRecord.checkpoints.stages.some((stage: any) => stage.id === "preflight"));
  assert.ok(firstRecord.checkpoints.stages.some((stage: any) => stage.id === "policy-gate"));
  assert.equal(firstRecord.auditTrail?.policyDecision, firstPayload.policy.decision);

  const secondRun = await runWithPrependedPath(
    binDir,
    () =>
      runCommand([
        "run",
        "--cwd",
        cwd,
        "--project",
        "demo",
        "--sprint",
        "sprint-001",
        "--mode",
        "assisted",
        "--input",
        "request.md",
        "--dry-run",
        "--format",
        "json"
      ]),
    {
      appendOriginal: false
    }
  );
  const secondPayload = JSON.parse(secondRun.stdout);

  assert.equal(secondRun.exitCode, EXIT_CODES.success);
  assert.notEqual(secondPayload.audit.recordFile, firstPayload.audit.recordFile);
  assert.ok(fs.existsSync(path.resolve(cwd, secondPayload.audit.recordFile)));
});

test("run can resume from checkpoint records in assisted mode", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);
  createSurfaceWorkspaceBindings(cwd);
  writeFile(path.join(cwd, "request.md"), "# Requirement\n\nPlease execute rm -rf /tmp/cache.\n");
  const binDir = createFakeSurfaceBinaries(cwd, {
    codex: true,
    claude: true,
    gh: true
  });

  const blockedRun = await runWithPrependedPath(
    binDir,
    () =>
      runCommand([
        "run",
        "--cwd",
        cwd,
        "--project",
        "demo",
        "--sprint",
        "sprint-001",
        "--mode",
        "assisted",
        "--input",
        "request.md",
        "--dry-run",
        "--format",
        "json"
      ]),
    {
      appendOriginal: false
    }
  );
  const blockedPayload = JSON.parse(blockedRun.stdout);

  assert.equal(blockedRun.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(blockedPayload.policy.decision, "pause_for_approval");
  assert.equal(blockedPayload.recovery.nextStageId, "policy-gate");
  assert.ok(blockedPayload.recovery.resumeAvailable);

  const resumedRun = await runWithPrependedPath(
    binDir,
    () =>
      runCommand([
        "run",
        "--cwd",
        cwd,
        "--project",
        "demo",
        "--sprint",
        "sprint-001",
        "--mode",
        "assisted",
        "--resume-from",
        blockedPayload.audit.recordFile,
        "--input",
        "request.md",
        "--approve-risk",
        "dangerous_command",
        "--dry-run",
        "--format",
        "json"
      ]),
    {
      appendOriginal: false
    }
  );
  const resumedPayload = JSON.parse(resumedRun.stdout);
  const restoredPreflightCheckpoint = resumedPayload.checkpoints.stages.find(
    (stage: any) => stage.id === "preflight"
  );

  assert.equal(resumedRun.exitCode, EXIT_CODES.success);
  assert.equal(resumedPayload.status, "pass");
  assert.equal(resumedPayload.recovery.resumed, true);
  assert.equal(resumedPayload.recovery.resumeSource, blockedPayload.audit.recordFile);
  assert.equal(resumedPayload.recovery.resumeStageId, "policy-gate");
  assert.ok(resumedPayload.recovery.restoredStages.includes("preflight"));
  assert.equal(
    restoredPreflightCheckpoint?.details?.checkpointRestore?.sourceFile,
    blockedPayload.audit.recordFile
  );
});
