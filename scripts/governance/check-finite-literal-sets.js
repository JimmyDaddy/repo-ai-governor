#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "./gate-output.js";

const GATE_NAME = "finite-literal-sets";
const TARGET_DIRECTORIES = ["apps", "packages", "bin", "test"];
const TARGET_FILE_PATTERN = /\.(ts|tsx|js|mjs|cjs)$/;
const IGNORED_DIRECTORY_NAMES = new Set(["node_modules", "dist", "coverage", ".turbo"]);
const LITERAL_SET_ALLOW_MARKER = "literal-set-allowed:";
const FINITE_LITERAL_TYPE_PATTERN =
  /\btype\s+([A-Za-z][A-Za-z0-9_]*)\s*=\s*((?:"[^"]+"\s*\|\s*)+"[^"]+")\s*;/gm;

/**
 * Recursively collects source files under one directory.
 * @param {string} directoryPath Absolute directory path.
 * @returns {string[]} Absolute source file paths.
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
 * Converts source index to 1-based line number.
 * @param {string} source Full source text.
 * @param {number} index Source index.
 * @returns {number} 1-based line number.
 */
function resolveLineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

/**
 * Collects finite-literal-set violations from one file.
 * @param {string} filePath Absolute source file path.
 * @returns {Array<{filePath: string, lineNumber: number, typeName: string, sourceLine: string}>}
 */
function collectViolations(filePath) {
  const source = readFileSync(filePath, "utf8");
  const lines = source.split(/\r?\n/);
  const violations = [];
  const matches = source.matchAll(FINITE_LITERAL_TYPE_PATTERN);

  for (const match of matches) {
    const [declaration, typeName] = match;
    const lineNumber = resolveLineNumber(source, match.index ?? 0);
    const previousLine = lines[lineNumber - 2] ?? "";
    const currentLine = lines[lineNumber - 1] ?? "";

    if (
      declaration.includes(LITERAL_SET_ALLOW_MARKER) ||
      previousLine.includes(LITERAL_SET_ALLOW_MARKER) ||
      currentLine.includes(LITERAL_SET_ALLOW_MARKER)
    ) {
      continue;
    }

    violations.push({
      filePath,
      lineNumber,
      typeName,
      sourceLine: declaration.replace(/\s+/g, " ").trim(),
    });
  }

  return violations;
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
  gateFail(GATE_NAME, `Found ${allViolations.length} finite literal-set type violation(s).`);
  for (const violation of allViolations) {
    gateInfo(
      GATE_NAME,
      `- ${violation.filePath}:${violation.lineNumber} type "${violation.typeName}" should be enum/constant-managed. source="${violation.sourceLine}"`,
    );
  }
  process.exit(1);
}

gatePass(GATE_NAME, "Finite literal sets are centrally managed.");
