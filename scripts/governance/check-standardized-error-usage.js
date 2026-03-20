#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "./gate-output.js";

const GATE_NAME = "standardized-errors";
const TARGET_DIRECTORIES = ["apps", "packages", "bin", "test"];
const TARGET_FILE_PATTERN = /\.(ts|tsx|js|mjs|cjs)$/;
const IGNORED_DIRECTORY_NAMES = new Set(["node_modules", "dist", "coverage", ".turbo"]);
const BASE_ERROR_IMPLEMENTATION_ALLOWLIST = [
  /\/packages\/shared\/src\/errors\/governor-error\.ts$/,
];
const VIOLATION_PATTERNS = [
  {
    pattern: /\bnew\s+Error\s*\(/,
    reason: "Use `GovernorError` instead of native `new Error(...)`.",
  },
  {
    pattern: /\bextends\s+Error\b/,
    reason: "Only abstract BaseError implementation may extend native Error.",
    allowPathPatterns: BASE_ERROR_IMPLEMENTATION_ALLOWLIST,
  },
  {
    pattern: /\binstanceof\s+Error\b/,
    reason: "Use `standardizeError(...)` instead of `instanceof Error` checks.",
  },
];

/**
 * Collects file paths recursively under a root directory.
 * @param {string} directoryPath Absolute directory path.
 * @returns {string[]} Absolute file paths.
 */
function collectFiles(directoryPath) {
  const filePaths = [];
  const entries = readdirSync(directoryPath);

  for (const entry of entries) {
    const entryPath = resolve(directoryPath, entry);
    const entryStat = statSync(entryPath);

    if (entryStat.isDirectory()) {
      if (IGNORED_DIRECTORY_NAMES.has(entry)) {
        continue;
      }
      filePaths.push(...collectFiles(entryPath));
      continue;
    }

    if (TARGET_FILE_PATTERN.test(entryPath)) {
      filePaths.push(entryPath);
    }
  }

  return filePaths;
}

/**
 * Builds violation records for one source file.
 * @param {string} filePath Absolute source file path.
 * @returns {Array<{filePath: string, lineNumber: number, reason: string, sourceLine: string}>}
 */
function collectViolations(filePath) {
  const source = readFileSync(filePath, "utf8");
  const lines = source.split(/\r?\n/);
  const violations = [];

  lines.forEach((line, index) => {
    for (const violationPattern of VIOLATION_PATTERNS) {
      if (!violationPattern.pattern.test(line)) {
        continue;
      }

      if (isPathAllowed(filePath, violationPattern.allowPathPatterns)) {
        continue;
      }

      violations.push({
        filePath,
        lineNumber: index + 1,
        reason: violationPattern.reason,
        sourceLine: line.trim(),
      });
    }
  });

  return violations;
}

/**
 * Checks whether a source file path is allowed for a violation pattern.
 * @param {string} filePath Absolute file path.
 * @param {RegExp[] | undefined} allowPathPatterns Path allowlist patterns.
 * @returns {boolean}
 */
function isPathAllowed(filePath, allowPathPatterns) {
  if (!allowPathPatterns || allowPathPatterns.length === 0) {
    return false;
  }

  return allowPathPatterns.some((allowPattern) => allowPattern.test(filePath));
}

const workspaceRoot = process.cwd();
const allViolations = [];

for (const targetDirectory of TARGET_DIRECTORIES) {
  const targetPath = resolve(workspaceRoot, targetDirectory);
  if (!existsSync(targetPath)) {
    continue;
  }

  const sourceFiles = collectFiles(targetPath);
  for (const sourceFile of sourceFiles) {
    allViolations.push(...collectViolations(sourceFile));
  }
}

if (allViolations.length > 0) {
  gateFail(GATE_NAME, `Found ${allViolations.length} standardized-error violation(s).`);
  for (const violation of allViolations) {
    gateInfo(
      GATE_NAME,
      `- ${violation.filePath}:${violation.lineNumber} ${violation.reason} source="${violation.sourceLine}"`,
    );
  }
  process.exit(1);
}

gatePass(GATE_NAME, "Native Error usage is standardized.");
