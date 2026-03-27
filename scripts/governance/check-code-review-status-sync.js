#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from './gate-output.js';

const GATE_NAME = 'code-review-status-sync';
const DEV_CONTEXT_ROOT = '.repo-ai-governor/context/dev';
const REVIEW_FILE_STATUS_RULES = [
  {
    prefixes: ['resolved_code_review_', 'resolved_review_'],
    expectedStatus: 'resolved',
  },
  {
    prefixes: ['verified_code_review_', 'verified_review_'],
    expectedStatus: 'verified',
  },
  {
    prefixes: ['code_review_', 'review_'],
    expectedStatus: 'review_pending',
  },
];

/**
 * Collects all review directories under the dev context root.
 * Why: we only want lifecycle artifacts, not task markdown or other docs.
 * @param {string} directoryPath Absolute directory path.
 * @returns {string[]}
 */
function collectReviewDirectories(directoryPath) {
  /** @type {string[]} */
  const reviewDirectories = [];

  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const entryPath = join(directoryPath, entry.name);
    if (entry.name === 'review') {
      reviewDirectories.push(entryPath);
      continue;
    }

    reviewDirectories.push(...collectReviewDirectories(entryPath));
  }

  return reviewDirectories;
}

/**
 * Resolves the expected status for one review filename.
 * @param {string} fileName Markdown file name.
 * @returns {string | null}
 */
function resolveExpectedStatus(fileName) {
  for (const rule of REVIEW_FILE_STATUS_RULES) {
    if (rule.prefixes.some((prefix) => fileName.startsWith(prefix))) {
      return rule.expectedStatus;
    }
  }

  return null;
}

/**
 * Reads the top-level `- Status:` metadata value from a review artifact.
 * Why: CS-026 requires lifecycle status to live in the header metadata block, not anywhere in body text.
 * @param {string} filePath Absolute review file path.
 * @returns {string | null}
 */
function readReviewStatus(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => /^#\s+/.test(line.trim()));
  if (headingIndex < 0) {
    return null;
  }

  let lineIndex = headingIndex + 1;
  while (lineIndex < lines.length && lines[lineIndex].trim().length === 0) {
    lineIndex += 1;
  }

  let sawMetadataLine = false;

  for (; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    const trimmedLine = rawLine.trim();

    if (trimmedLine.length === 0) {
      if (sawMetadataLine) {
        continue;
      }

      continue;
    }

    if (trimmedLine.startsWith('## ')) {
      break;
    }

    const metadataMatch = rawLine.match(/^- ([^:]+):\s*(.+)$/);
    if (!metadataMatch) {
      // Why: top metadata must be contiguous; any body content ends metadata parsing.
      break;
    }

    sawMetadataLine = true;
    if (metadataMatch[1].trim().toLowerCase() === 'status') {
      return metadataMatch[2].trim();
    }
  }

  return null;
}

try {
  const devContextRoot = resolve(process.cwd(), DEV_CONTEXT_ROOT);
  if (!existsSync(devContextRoot)) {
    throw new Error(`Dev context root not found: ${devContextRoot}`);
  }

  const reviewDirectories = collectReviewDirectories(devContextRoot);
  let scannedReviewFileCount = 0;
  /** @type {string[]} */
  const mismatches = [];

  for (const reviewDirectory of reviewDirectories) {
    for (const entry of readdirSync(reviewDirectory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        continue;
      }

      const expectedStatus = resolveExpectedStatus(entry.name);
      if (!expectedStatus) {
        continue;
      }

      scannedReviewFileCount += 1;

      const filePath = join(reviewDirectory, entry.name);
      const actualStatus = readReviewStatus(filePath);
      if (actualStatus !== expectedStatus) {
        mismatches.push(
          `${relative(process.cwd(), filePath)} => expected \`${expectedStatus}\`, found \`${actualStatus ?? '<missing>'}\``,
        );
      }
    }
  }

  gateInfo(
    GATE_NAME,
    `Scanned ${scannedReviewFileCount} lifecycle review artifact(s) across ${reviewDirectories.length} review director${reviewDirectories.length === 1 ? 'y' : 'ies'}.`,
  );

  if (mismatches.length > 0) {
    throw new Error(`Status drift detected:\n- ${mismatches.join('\n- ')}`);
  }

  gatePass(GATE_NAME, 'Review file prefixes and Status metadata are synchronized.');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
