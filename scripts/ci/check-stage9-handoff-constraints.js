#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";

const GATE_NAME = "stage9-handoff-constraints";
const DEFAULT_HANDOFF_DOC_PATH =
  ".repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md";
const REQUIRED_HANDOFF_SNIPPETS = [
  "10. Stage 9A 总体验收结论",
  "结论：accept",
  "7. 试点与黑盒验证前置",
  "8. 运营指标快照",
  "B4：受控 delivery rehearsal",
];

/**
 * Resolves handoff document path from CLI flag/env/default.
 * Why: workflows must consume DA-092 constraints explicitly instead of implicit repo assumptions.
 * @returns {string}
 */
function resolveHandoffDocPath() {
  const args = process.argv.slice(2);
  const pathFlagIndex = args.findIndex((arg) => arg === "--path");
  if (pathFlagIndex >= 0) {
    const pathFromFlag = args[pathFlagIndex + 1];
    if (typeof pathFromFlag !== "string" || pathFromFlag.trim().length === 0) {
      throw new Error('Expected non-empty path after "--path".');
    }
    return pathFromFlag.trim();
  }

  const pathFromEnv = process.env.STAGE9_HANDOFF_PATH;
  if (typeof pathFromEnv === "string" && pathFromEnv.trim().length > 0) {
    return pathFromEnv.trim();
  }

  return DEFAULT_HANDOFF_DOC_PATH;
}

/**
 * Validates required handoff snippets in DA-092 source document.
 * @param {string} handoffDocPath Relative handoff document path.
 */
function validateHandoffDoc(handoffDocPath) {
  const absolutePath = resolve(process.cwd(), handoffDocPath);
  if (!existsSync(absolutePath)) {
    throw new Error(`handoff document is missing: ${handoffDocPath}`);
  }

  const rawContent = readFileSync(absolutePath, "utf8");
  for (const snippet of REQUIRED_HANDOFF_SNIPPETS) {
    if (!rawContent.includes(snippet)) {
      throw new Error(`handoff document is missing required snippet: ${snippet}`);
    }
  }

  gateInfo(
    GATE_NAME,
    `validated ${REQUIRED_HANDOFF_SNIPPETS.length} required constraints from ${handoffDocPath}`,
  );
}

try {
  const handoffDocPath = resolveHandoffDocPath();
  validateHandoffDoc(handoffDocPath);
  gatePass(GATE_NAME, "DA-092 handoff constraints are explicitly consumable.");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
