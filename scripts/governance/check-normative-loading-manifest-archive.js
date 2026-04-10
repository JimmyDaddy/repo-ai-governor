#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { gateFail, gateInfo, gatePass, gateWarn } from './gate-output.js';
import {
  ARCHIVE_NORMATIVE_LOADING_MANIFEST_PATH,
  DEFAULT_NORMATIVE_LOADING_DEPRECATED_DAYS,
  ROOT_NORMATIVE_LOADING_MANIFEST_PATH,
  collectNormativeLoadingArchiveIssues,
} from './normative-loading-manifest-canonical.js';

const GATE_NAME = 'normative-loading-manifest-archive';
const DEFAULT_MODE = 'block';
const DEFAULT_FORMAT = 'text';
const SUPPORTED_MODES = new Set(['warn', 'block']);
const SUPPORTED_FORMATS = new Set(['text', 'json']);

/**
 * Reads one CLI flag value.
 * @param {string[]} argv Raw CLI args.
 * @param {string} flagName Flag name.
 * @returns {string | null}
 */
function readFlagValue(argv, flagName) {
  const flagIndex = argv.indexOf(flagName);
  if (flagIndex === -1) {
    return null;
  }

  const nextValue = argv[flagIndex + 1];
  if (!nextValue || nextValue.startsWith('--')) {
    throw new Error(`Flag "${flagName}" requires a value.`);
  }

  return nextValue.trim();
}

/**
 * Resolves CLI options for the archive check.
 * @param {string[]} argv Raw CLI args.
 * @returns {{
 *   mode: "warn" | "block";
 *   format: "text" | "json";
 *   rootManifestPath: string;
 *   archiveManifestPath: string;
 *   deprecationDays: number;
 *   today?: string;
 * }}
 */
function resolveCliOptions(argv) {
  const mode = readFlagValue(argv, '--mode') ?? DEFAULT_MODE;
  const format = readFlagValue(argv, '--format') ?? DEFAULT_FORMAT;
  const deprecationDays = Number(
    readFlagValue(argv, '--deprecation-days') ?? DEFAULT_NORMATIVE_LOADING_DEPRECATED_DAYS,
  );

  if (!SUPPORTED_MODES.has(mode)) {
    throw new Error(
      `Unsupported --mode "${mode}". Expected one of: ${Array.from(SUPPORTED_MODES).join(', ')}`,
    );
  }

  if (!SUPPORTED_FORMATS.has(format)) {
    throw new Error(
      `Unsupported --format "${format}". Expected one of: ${Array.from(SUPPORTED_FORMATS).join(', ')}`,
    );
  }

  if (!Number.isFinite(deprecationDays) || deprecationDays < 0) {
    throw new Error(`Invalid --deprecation-days value: ${deprecationDays}`);
  }

  return {
    mode,
    format,
    rootManifestPath:
      readFlagValue(argv, '--root-manifest') ?? ROOT_NORMATIVE_LOADING_MANIFEST_PATH,
    archiveManifestPath:
      readFlagValue(argv, '--archive-manifest') ?? ARCHIVE_NORMATIVE_LOADING_MANIFEST_PATH,
    deprecationDays,
    today: readFlagValue(argv, '--today') ?? undefined,
  };
}

/**
 * Runs the archive integrity check.
 * @param {{
 *   rootManifestPath?: string;
 *   archiveManifestPath?: string;
 *   deprecationDays?: number;
 *   today?: string;
 * }} [options] Check options.
 * @returns {{
 *   issues: string[];
 *   summary: {
 *     rootDocumentCount: number;
 *     archiveDocumentCount: number;
 *     rootArchivedCount: number;
 *     overdueDeprecatedCount: number;
 *     missingDeprecatedAtCount: number;
 *     deprecationDays: number;
 *   };
 * }}
 */
export function checkNormativeLoadingManifestArchive(options = {}) {
  const validation = collectNormativeLoadingArchiveIssues(options);
  return {
    issues: validation.issues,
    summary: validation.summary,
  };
}

/**
 * Prints a text-mode result summary.
 * @param {{
 *   mode: "warn" | "block";
 *   issues: string[];
 *   summary: {
 *     rootDocumentCount: number;
 *     archiveDocumentCount: number;
 *     rootArchivedCount: number;
 *     overdueDeprecatedCount: number;
 *     missingDeprecatedAtCount: number;
 *     deprecationDays: number;
 *   };
 * }} result Result payload.
 */
function printTextResult(result) {
  gateInfo(
    GATE_NAME,
    `mode=${result.mode} root_documents=${result.summary.rootDocumentCount} archive_documents=${result.summary.archiveDocumentCount} root_archived=${result.summary.rootArchivedCount} overdue_deprecated=${result.summary.overdueDeprecatedCount} missing_deprecated_at=${result.summary.missingDeprecatedAtCount} deprecation_days=${result.summary.deprecationDays} issues=${result.issues.length}`,
  );

  if (result.issues.length === 0) {
    gatePass(GATE_NAME, 'Archive integrity and monthly-audit checks passed.');
    return;
  }

  for (const issue of result.issues) {
    gateWarn(GATE_NAME, `- ${issue}`);
  }

  if (result.mode === 'warn') {
    gateWarn(GATE_NAME, 'Warning mode is active: issues are reported but do not fail this gate.');
  }
}

function runCli() {
  const options = resolveCliOptions(process.argv.slice(2));
  const result = {
    mode: options.mode,
    ...checkNormativeLoadingManifestArchive(options),
  };

  if (options.format === 'json') {
    console.info(JSON.stringify(result, null, 2));
  } else {
    printTextResult(result);
  }

  if (result.issues.length > 0 && options.mode === 'block') {
    gateFail(GATE_NAME, `Found ${result.issues.length} archive integrity issue(s).`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    gateFail(GATE_NAME, errorMessage);
    process.exit(1);
  }
}
