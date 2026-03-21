#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";

const GATE_NAME = "ga-candidate-unified-gate";
const DEFAULT_REPORT_PATH =
  ".repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-062-ga-candidate-unified-gate-report.json";

const UNIFIED_GATE_STEPS = [
  {
    stepId: "contract-baseline",
    command: ["pnpm", "run", "test:contract", "--", "--maxWorkers=1", "--maxConcurrency=1"],
  },
  {
    stepId: "resilience-regression",
    command: ["pnpm", "run", "test:resilience"],
  },
  {
    stepId: "integration-regression",
    command: ["pnpm", "run", "test:integration", "--", "--maxWorkers=1", "--maxConcurrency=1"],
  },
  {
    stepId: "e2e-regression",
    command: ["pnpm", "run", "test:e2e", "--", "--maxWorkers=1", "--maxConcurrency=1"],
  },
  {
    stepId: "release-ga-check",
    command: ["pnpm", "run", "release:ga-check"],
  },
  {
    stepId: "rollback-rehearsal",
    command: ["pnpm", "run", "release:rollback-rehearsal"],
  },
  {
    stepId: "governance-gate",
    command: ["pnpm", "run", "check"],
  },
];

/**
 * Parses optional `--output` report path from CLI flags.
 * @returns {string}
 */
function resolveReportPath() {
  const args = process.argv.slice(2);
  const outputIndex = args.findIndex((arg) => arg === "--output");
  if (outputIndex === -1) {
    return DEFAULT_REPORT_PATH;
  }

  const outputPath = args[outputIndex + 1];
  if (typeof outputPath !== "string" || outputPath.trim().length === 0) {
    throw new Error('Expected non-empty path after "--output".');
  }

  return outputPath.trim();
}

/**
 * Runs one step command and returns execution metrics.
 * @param {string[]} command Command tuple.
 * @param {string} stepId Step id for diagnostics.
 * @returns {{exitCode: number; durationMs: number; errorMessage: string | null}}
 */
function runStepCommand(command, stepId) {
  const [bin, ...args] = command;
  const startedAtMs = Date.now();
  const result = spawnSync(bin, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
  const durationMs = Date.now() - startedAtMs;
  const exitCode = typeof result.status === "number" ? result.status : 1;
  const errorMessage =
    result.error?.message ??
    (exitCode === 0 ? null : `${stepId} failed with exit code ${exitCode}.`);

  return {
    exitCode,
    durationMs,
    errorMessage,
  };
}

/**
 * Writes one unified gate report payload for replay and audit.
 * @param {string} reportPath Relative report path.
 * @param {Record<string, unknown>} reportPayload Report payload.
 */
function writeReport(reportPath, reportPayload) {
  const absolutePath = resolve(process.cwd(), reportPath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(reportPayload, null, 2)}\n`, "utf8");
}

let reportPath = DEFAULT_REPORT_PATH;
let status = "passed";
let failedStepId = null;
let failureMessage = null;
const stepResults = [];

try {
  reportPath = resolveReportPath();
  for (const step of UNIFIED_GATE_STEPS) {
    gateInfo(GATE_NAME, `${step.stepId}: command="${step.command.join(" ")}"`);
    const commandResult = runStepCommand(step.command, step.stepId);
    const stepResult = {
      stepId: step.stepId,
      command: step.command.join(" "),
      exitCode: commandResult.exitCode,
      durationMs: commandResult.durationMs,
    };
    if (typeof commandResult.errorMessage === "string") {
      stepResult.errorMessage = commandResult.errorMessage;
    }
    stepResults.push(stepResult);

    if (commandResult.exitCode !== 0) {
      status = "failed";
      failedStepId = step.stepId;
      failureMessage = commandResult.errorMessage ?? `${step.stepId} failed.`;
      break;
    }
  }
} catch (error) {
  status = "failed";
  failureMessage = error instanceof Error ? error.message : String(error);
}

const reportPayload = {
  reportType: "ga_candidate_unified_gate_v1",
  status,
  generatedAt: new Date().toISOString(),
  steps: stepResults,
};

if (status === "failed") {
  reportPayload.failedStepId = failedStepId;
  reportPayload.errorMessage = failureMessage;
}

try {
  writeReport(reportPath, reportPayload);
  gateInfo(GATE_NAME, `report generated at ${reportPath}`);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, `failed to persist ga unified gate report: ${errorMessage}`);
  process.exit(1);
}

if (status === "passed") {
  gatePass(GATE_NAME, "ga candidate unified gate passed.");
} else {
  gateFail(GATE_NAME, failureMessage ?? "ga candidate unified gate failed.");
  process.exit(1);
}
