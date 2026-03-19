#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED_MARKERS = [
  "## Non-negotiable Rules",
  "[CS-001]",
  "[CS-020]",
  "## Verification Commands",
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

const standardsPath = resolveStandardsPath(process.argv.slice(2));

if (!existsSync(standardsPath)) {
  throw new Error(`Standards file not found: ${standardsPath}`);
}

const standardsContent = readFileSync(standardsPath, "utf8");
const missingMarkers = REQUIRED_MARKERS.filter((marker) => !standardsContent.includes(marker));

if (missingMarkers.length > 0) {
  throw new Error(`Standards document is missing required markers: ${missingMarkers.join(", ")}`);
}
