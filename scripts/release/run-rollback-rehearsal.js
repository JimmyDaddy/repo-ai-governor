#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";

const GATE_NAME = "release-rollback-rehearsal";
const RELEASE_POLICY_CONFIG_PATH = "scripts/release/release-governance-policy.json";
const DEFAULT_REPORT_PATH =
  ".repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-061-rollback-rehearsal-report.json";

const REHEARSAL_SCENARIOS = [
  {
    scenarioId: "critical-production-regression",
    rollbackTrigger: "critical production regression detected",
    requiredEvidence: "release_check_report",
    command: ["pnpm", "run", "release:check"],
  },
  {
    scenarioId: "post-promotion-gate-violation",
    rollbackTrigger: "release gate violation after channel promotion",
    requiredEvidence: "distribution_verify_result",
    command: ["pnpm", "run", "release:verify-local"],
  },
  {
    scenarioId: "lockstep-contract-incompatibility",
    rollbackTrigger: "incompatible contract change in lockstep group",
    requiredEvidence: "channel_promotion_record",
    command: ["pnpm", "run", "release:ga-check"],
  },
];

/**
 * Parses optional report output path from CLI flags.
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
 * Reads and validates release policy payload.
 * @returns {Record<string, unknown>}
 */
function readReleasePolicyConfig() {
  const absolutePath = resolve(process.cwd(), RELEASE_POLICY_CONFIG_PATH);
  const raw = readFileSync(absolutePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("release-governance-policy must be a JSON object.");
  }

  return parsed;
}

/**
 * Runs one command and throws when exit code is non-zero.
 * @param {string[]} command Command tuple.
 * @param {string} scenarioId Scenario id for diagnostics.
 * @returns {{exitCode: number; durationMs: number; errorMessage: string | null}}
 */
function runCommand(command, scenarioId) {
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
    (exitCode === 0 ? null : `${scenarioId} failed with exit code ${exitCode}.`);

  return {
    exitCode,
    durationMs,
    errorMessage,
  };
}

/**
 * Writes one rollback rehearsal report JSON for audit replay.
 * @param {string} reportPath Relative report path from repository root.
 * @param {Record<string, unknown>} reportPayload Report payload.
 */
function writeReport(reportPath, reportPayload) {
  const absolutePath = resolve(process.cwd(), reportPath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(reportPayload, null, 2)}\n`, "utf8");
}

let reportPath = DEFAULT_REPORT_PATH;
let status = "passed";
let failedScenarioId = null;
let failureMessage = null;
const scenarioResults = [];
const evidenceByKey = {};

try {
  reportPath = resolveReportPath();
  const policyConfig = readReleasePolicyConfig();
  const minimumAuditEvidence = policyConfig.minimumAuditEvidence;

  if (!Array.isArray(minimumAuditEvidence) || minimumAuditEvidence.length === 0) {
    throw new Error("release-governance-policy.minimumAuditEvidence must be a non-empty array.");
  }

  for (const scenario of REHEARSAL_SCENARIOS) {
    gateInfo(
      GATE_NAME,
      `${scenario.scenarioId}: trigger="${scenario.rollbackTrigger}" command="${scenario.command.join(" ")}"`,
    );
    const commandResult = runCommand(scenario.command, scenario.scenarioId);
    const scenarioResult = {
      scenarioId: scenario.scenarioId,
      rollbackTrigger: scenario.rollbackTrigger,
      command: scenario.command.join(" "),
      exitCode: commandResult.exitCode,
      durationMs: commandResult.durationMs,
    };
    if (typeof commandResult.errorMessage === "string") {
      scenarioResult.errorMessage = commandResult.errorMessage;
    }
    scenarioResults.push(scenarioResult);
    evidenceByKey[scenario.requiredEvidence] = scenarioResult;

    if (commandResult.exitCode !== 0) {
      status = "failed";
      failedScenarioId = scenario.scenarioId;
      failureMessage = commandResult.errorMessage ?? `${scenario.scenarioId} failed.`;
      break;
    }
  }

  if (status === "passed") {
    for (const evidenceKey of minimumAuditEvidence) {
      if (typeof evidenceKey !== "string" || evidenceKey.trim().length === 0) {
        throw new Error("minimumAuditEvidence must contain non-empty strings.");
      }

      if (!(evidenceKey in evidenceByKey)) {
        throw new Error(
          `rollback rehearsal evidence is missing "${evidenceKey}". update scenario mapping first.`,
        );
      }
    }
  }
} catch (error) {
  status = "failed";
  failureMessage = error instanceof Error ? error.message : String(error);
}

const reportPayload = {
  reportType: "rollback_rehearsal_v1",
  status,
  generatedAt: new Date().toISOString(),
  policySource: RELEASE_POLICY_CONFIG_PATH,
  scenarios: scenarioResults,
  evidence: evidenceByKey,
};

if (status === "failed") {
  reportPayload.failedScenarioId = failedScenarioId;
  reportPayload.errorMessage = failureMessage;
}

try {
  writeReport(reportPath, reportPayload);
  gateInfo(GATE_NAME, `report generated at ${reportPath}`);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, `failed to persist rollback rehearsal report: ${errorMessage}`);
  process.exit(1);
}

if (status === "passed") {
  gatePass(GATE_NAME, "rollback rehearsal baseline passed.");
} else {
  gateFail(GATE_NAME, failureMessage ?? "rollback rehearsal baseline failed.");
  process.exit(1);
}
