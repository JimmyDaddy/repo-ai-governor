#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { gateFail, gatePass } from "./gate-output.js";

const GATE_NAME = "code-standards";
const REQUIRED_MARKERS = [
  "## Non-negotiable Rules",
  "[CS-001]",
  "[CS-009]",
  "[CS-022]",
  "[CS-023]",
  "[CS-024]",
  "[CS-025]",
  "[CS-026]",
  "## Verification Commands",
  "node ./scripts/governance/check-finite-literal-sets.js",
  "node ./scripts/governance/check-package-dependency-boundary.js --mode warn",
  "node ./scripts/governance/check-artifact-registry-lifecycle.js",
  "node ./scripts/governance/check-code-review-status-sync.js",
  "node ./scripts/governance/check-i18n-parity-fallback.js",
  "node ./scripts/governance/run-normative-loading-manifest-gate.js",
  "pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1",
  "pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1",
];

/**
 * Resolves the standards document path from CLI args.
 * @param {string[]} argv Process arguments.
 * @returns {string} Absolute standards path.
 */
function resolveStandardsPath(argv) {
  const flagIndex = argv.indexOf("--standards");

  if (flagIndex === -1) {
    return resolve(
      process.cwd(),
      ".repo-ai-governor/normative_knowledge_sources/governance/code_standards.md",
    );
  }

  const nextValue = argv[flagIndex + 1];
  if (!nextValue) {
    throw new Error("Flag `--standards` requires a file path.");
  }

  return resolve(process.cwd(), nextValue);
}

try {
  const standardsPath = resolveStandardsPath(process.argv.slice(2));

  if (!existsSync(standardsPath)) {
    throw new Error(`Standards file not found: ${standardsPath}`);
  }

  const standardsContent = readFileSync(standardsPath, "utf8");
  const missingMarkers = REQUIRED_MARKERS.filter((marker) => !standardsContent.includes(marker));

  if (missingMarkers.length > 0) {
    throw new Error(`Standards document is missing required markers: ${missingMarkers.join(", ")}`);
  }

  gatePass(GATE_NAME, `Standards markers are complete (${REQUIRED_MARKERS.length} checks).`);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
