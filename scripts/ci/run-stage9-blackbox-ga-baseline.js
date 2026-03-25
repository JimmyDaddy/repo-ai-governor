#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";
import {
  createStage9GaMetrics,
  runStage9BlackboxScenarioMatrix,
} from "./stage9-blackbox-ga-lib.js";

const GATE_NAME = "stage9-blackbox-ga";
const DEFAULT_REPORT_PATH = ".tmp/ci/stage9-blackbox-ga/stage9-blackbox-ga-report.json";

/**
 * Resolves optional report output path from CLI args.
 * @returns {string}
 */
function resolveReportPath() {
  const args = process.argv.slice(2);
  const outputIndex = args.findIndex((arg) => arg === "--output");
  if (outputIndex < 0) {
    return DEFAULT_REPORT_PATH;
  }

  const outputPath = args[outputIndex + 1];
  if (typeof outputPath !== "string" || outputPath.trim().length === 0) {
    throw new Error('Expected non-empty path after "--output".');
  }

  return outputPath.trim();
}

/**
 * Writes one report JSON payload to repository-relative path.
 * @param {string} reportPath Repository-relative report path.
 * @param {Record<string, any>} payload JSON payload.
 */
function writeReport(reportPath, payload) {
  const absolutePath = resolve(process.cwd(), reportPath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

try {
  const reportPath = resolveReportPath();
  gateInfo(GATE_NAME, "running Stage 9 unattended blackbox scenario matrix...");
  const scenarioResults = await runStage9BlackboxScenarioMatrix();
  const failedScenarios = scenarioResults.filter((scenario) => scenario.status !== "passed");
  const gaMetrics = createStage9GaMetrics(scenarioResults);

  const reportPayload = {
    reportType: "stage9_blackbox_ga_baseline_v1",
    status: failedScenarios.length === 0 ? "passed" : "failed",
    generatedAt: new Date().toISOString(),
    metrics: gaMetrics,
    scenarios: scenarioResults,
    blockingPolicy: {
      ci: "block on any failed Stage 9 blackbox scenario or missing GA metric snapshot",
      release: "block GA candidate when Stage 9 blackbox baseline report is failed",
    },
  };

  writeReport(reportPath, reportPayload);
  gateInfo(GATE_NAME, `report generated at ${reportPath}`);

  if (failedScenarios.length > 0) {
    const scenarioList = failedScenarios.map((scenario) => scenario.scenarioId).join(", ");
    gateFail(GATE_NAME, `failed scenarios: ${scenarioList}`);
    process.exit(1);
  }

  if (
    typeof gaMetrics.time_to_first_success_ms !== "number" ||
    gaMetrics.unattended_success_rate === null ||
    gaMetrics.human_intervention_rate === null ||
    gaMetrics.fallback_rate === null ||
    gaMetrics.delivery_rehearsal_pass_rate === null
  ) {
    gateFail(GATE_NAME, "Stage 9 GA metrics snapshot is incomplete.");
    process.exit(1);
  }

  gatePass(GATE_NAME, "Stage 9 unattended blackbox baseline and GA metrics passed.");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
