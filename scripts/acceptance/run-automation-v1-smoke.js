#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CLI_PATH = path.resolve(ROOT_DIR, "bin", "repo-ai-governor.js");
const DEFAULT_PROJECT = "automation-smoke";
const DEFAULT_SPRINT = "sprint-001";
const ROUTE_KEYS = Object.freeze([
  "requirements-draft",
  "draft-review",
  "draft-review-verify",
  "technical-solution",
  "technical-solution-review",
  "technical-solution-revise",
  "task-breakdown",
  "task-implementation",
  "task-code-review",
]);
const MULTI_AI_EXPECTED_ROUTES = Object.freeze({
  "requirements-draft": "codex",
  "draft-review": "claude-code",
  "draft-review-verify": "codex",
  "technical-solution": "codex",
  "technical-solution-review": "claude-code",
  "technical-solution-revise": "codex",
  "task-breakdown": "codex",
  "task-implementation": "codex",
  "task-code-review": "github-copilot",
});

function parseArguments(argv) {
  const options = {
    entry: "all",
    format: "summary",
    workspace: null,
    requestFile: path.resolve(ROOT_DIR, "scripts", "acceptance", "inputs", "automation-request.md"),
    project: DEFAULT_PROJECT,
    sprint: DEFAULT_SPRINT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--entry") {
      options.entry = String(argv[index + 1] ?? "all").trim();
      index += 1;
      continue;
    }

    if (token === "--format") {
      options.format = String(argv[index + 1] ?? "summary").trim();
      index += 1;
      continue;
    }

    if (token === "--workspace") {
      options.workspace = path.resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (token === "--request") {
      options.requestFile = path.resolve(argv[index + 1] ?? options.requestFile);
      index += 1;
    }
  }

  return options;
}

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd: options.cwd ?? ROOT_DIR,
    encoding: "utf8",
    env: options.env ?? process.env,
  });

  if (result.status !== 0) {
    const error = new Error(`CLI command failed: ${args.join(" ")}`);
    error.details = {
      command: args.join(" "),
      status: result.status ?? 1,
      stdout: result.stdout,
      stderr: result.stderr,
    };
    throw error;
  }

  return result.stdout;
}

function ensureWorkspace(options) {
  const workspace =
    options.workspace ??
    fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-automation-smoke-"));

  fs.mkdirSync(workspace, { recursive: true });
  return workspace;
}

function createExecutable(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
  fs.chmodSync(filePath, 0o755);
}

function prepareFakeSurfaceEnvironment(workspace) {
  const fakeBinDir = path.resolve(workspace, ".fake-bin");

  fs.mkdirSync(fakeBinDir, { recursive: true });
  fs.mkdirSync(path.resolve(workspace, ".codex", "skills"), { recursive: true });
  fs.mkdirSync(path.resolve(workspace, ".claude", "skills"), { recursive: true });
  fs.mkdirSync(path.resolve(workspace, ".github", "skills"), { recursive: true });

  createExecutable(
    path.resolve(fakeBinDir, "codex"),
    ["#!/bin/sh", 'echo "codex 0.0.1"', "exit 0", ""].join("\n"),
  );
  createExecutable(
    path.resolve(fakeBinDir, "claude"),
    ["#!/bin/sh", 'echo "claude 0.0.1"', "exit 0", ""].join("\n"),
  );
  createExecutable(
    path.resolve(fakeBinDir, "gh"),
    [
      "#!/bin/sh",
      'if [ "$1" = "copilot" ]; then',
      '  echo "copilot help"',
      "  exit 0",
      "fi",
      'echo "gh 0.0.1"',
      "exit 0",
      "",
    ].join("\n"),
  );

  return {
    fakeBinDir,
    env: {
      ...process.env,
      PATH: `${fakeBinDir}${path.delimiter}${process.env.PATH ?? ""}`,
    },
  };
}

function bootstrapWorkspace(workspace, requestFile, project, sprint, env) {
  runCli(
    [
      "init",
      "--cwd",
      workspace,
      "--project",
      project,
      "--sprint",
      sprint,
      "--adapter",
      "codex",
      "--adapter",
      "claude-code",
      "--adapter",
      "github-copilot",
      "--format",
      "json",
    ],
    {
      env,
    },
  );

  const requestTarget = path.resolve(workspace, "automation-request.md");
  fs.copyFileSync(requestFile, requestTarget);

  runCli(
    [
      "plan",
      "--cwd",
      workspace,
      "--project",
      project,
      "--sprint",
      sprint,
      "--input",
      requestTarget,
      "--title",
      "Automation smoke flow",
      "--format",
      "json",
    ],
    {
      env,
    },
  );

  return requestTarget;
}

function parseJsonOutput(content, label) {
  try {
    return JSON.parse(content);
  } catch (error) {
    const parsingError = new Error(`Failed to parse JSON output for ${label}`);
    parsingError.details = {
      label,
      cause: error instanceof Error ? error.message : String(error),
      content,
    };
    throw parsingError;
  }
}

function routeMapFromPayload(payload) {
  return Object.fromEntries(
    (payload.routing?.routes ?? []).map((route) => [route.routeKey, route.resolvedSurface]),
  );
}

function ensureScenarioPass(payload, scenarioName) {
  if (payload.status !== "pass") {
    const error = new Error(`Scenario ${scenarioName} failed with status=${payload.status}`);
    error.details = {
      scenarioName,
      status: payload.status,
      summary: payload.summary,
    };
    throw error;
  }
}

function runSingleSurfaceScenario(surface, workspace, requestPath, project, sprint, env) {
  const args = [
    "run",
    "--cwd",
    workspace,
    "--project",
    project,
    "--sprint",
    sprint,
    "--mode",
    "assisted",
    "--non-interactive",
    "--dry-run",
    "--format",
    "json",
    "--input",
    requestPath,
    "--default-surface",
    surface,
  ];

  for (const routeKey of ROUTE_KEYS) {
    args.push("--route", `${routeKey}=${surface}`);
  }

  const payload = parseJsonOutput(runCli(args, { env }), surface);
  ensureScenarioPass(payload, surface);
  const routeMap = routeMapFromPayload(payload);

  for (const routeKey of ROUTE_KEYS) {
    if (routeMap[routeKey] !== surface) {
      const error = new Error(`Scenario ${surface} has unexpected route surface for ${routeKey}`);
      error.details = {
        scenario: surface,
        routeKey,
        expected: surface,
        actual: routeMap[routeKey],
      };
      throw error;
    }
  }

  return {
    name: surface,
    status: payload.status,
    executionId: payload.executionId,
    routeMap,
  };
}

function runMultiAiScenario(workspace, requestPath, project, sprint, env) {
  const payload = parseJsonOutput(
    runCli(
      [
        "run",
        "--cwd",
        workspace,
        "--project",
        project,
        "--sprint",
        sprint,
        "--mode",
        "assisted",
        "--routing-profile",
        "multi-ai-dev-review",
        "--non-interactive",
        "--dry-run",
        "--format",
        "json",
        "--input",
        requestPath,
      ],
      {
        env,
      },
    ),
    "multi-ai-dev-review",
  );
  ensureScenarioPass(payload, "multi-ai-dev-review");
  const routeMap = routeMapFromPayload(payload);

  for (const [routeKey, expectedSurface] of Object.entries(MULTI_AI_EXPECTED_ROUTES)) {
    if (routeMap[routeKey] !== expectedSurface) {
      const error = new Error(`Multi-AI scenario mismatch for ${routeKey}`);
      error.details = {
        scenario: "multi-ai-dev-review",
        routeKey,
        expected: expectedSurface,
        actual: routeMap[routeKey],
      };
      throw error;
    }
  }

  return {
    name: "multi-ai-dev-review",
    status: payload.status,
    executionId: payload.executionId,
    routeMap,
  };
}

function resolveScenarioEntries(entry) {
  if (entry === "all") {
    return ["codex", "claude-code", "github-copilot", "multi-ai-dev-review"];
  }

  if (["codex", "claude-code", "github-copilot", "multi-ai-dev-review"].includes(entry)) {
    return [entry];
  }

  throw new Error(
    `Unsupported --entry value: ${entry}. Use one of all|codex|claude-code|github-copilot|multi-ai-dev-review.`,
  );
}

function renderSummary(payload) {
  const lines = [
    "automation-smoke",
    `status=${payload.status}`,
    `workspace=${payload.workspace}`,
    `scenarios=${payload.scenarios.length}`,
  ];

  for (const scenario of payload.scenarios) {
    lines.push(`scenario=${scenario.name}:${scenario.status}:${scenario.executionId}`);
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const workspace = ensureWorkspace(options);
  const { env } = prepareFakeSurfaceEnvironment(workspace);
  const requestPath = bootstrapWorkspace(
    workspace,
    options.requestFile,
    options.project,
    options.sprint,
    env,
  );
  const scenarioEntries = resolveScenarioEntries(options.entry);
  const scenarios = [];

  for (const scenario of scenarioEntries) {
    if (scenario === "multi-ai-dev-review") {
      scenarios.push(
        runMultiAiScenario(workspace, requestPath, options.project, options.sprint, env),
      );
      continue;
    }

    scenarios.push(
      runSingleSurfaceScenario(
        scenario,
        workspace,
        requestPath,
        options.project,
        options.sprint,
        env,
      ),
    );
  }

  const payload = {
    status: "pass",
    workspace,
    project: options.project,
    sprint: options.sprint,
    request: path.relative(workspace, requestPath).split(path.sep).join("/"),
    scenarios,
  };

  if (options.format === "json") {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stdout.write(renderSummary(payload));
}

try {
  main();
} catch (error) {
  const payload = {
    status: "fail",
    message: error instanceof Error ? error.message : String(error),
    details: error?.details ?? null,
  };
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = 1;
}
