#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "./gate-output.js";

const GATE_NAME = "docs-triad-sync";
const TRIAD_DOC_PATHS = [
  ".repo-ai-governor/normative_knowledge_sources/product-requirements.md",
  ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md",
  ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md",
];
const BRIEF_DOC_PATH =
  ".repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md";
const MONITORED_DOC_PATHS = [...TRIAD_DOC_PATHS, BRIEF_DOC_PATH];

/**
 * Resolves CLI options.
 * @param {string[]} argv Raw argv list.
 * @returns {{format: "text" | "json", changedFiles: string[]}}
 */
function resolveCliOptions(argv) {
  /** @type {{format: "text" | "json", changedFiles: string[]}} */
  const options = {
    format: "text",
    changedFiles: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--format") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--format".');
      }
      options.format = readFormatValue(nextValue);
      index += 1;
      continue;
    }

    if (argument.startsWith("--format=")) {
      options.format = readFormatValue(argument.slice("--format=".length));
      continue;
    }

    if (argument === "--changed-file") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--changed-file".');
      }
      options.changedFiles.push(nextValue);
      index += 1;
      continue;
    }

    if (argument.startsWith("--changed-file=")) {
      options.changedFiles.push(argument.slice("--changed-file=".length));
      continue;
    }

    throw new Error(`Unsupported option: ${argument}`);
  }

  return options;
}

/**
 * Validates one output format value.
 * @param {string} value Raw format value.
 * @returns {"text" | "json"}
 */
function readFormatValue(value) {
  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue !== "text" && normalizedValue !== "json") {
    throw new Error(`Unsupported format "${value}". Expected "text" or "json".`);
  }

  return normalizedValue;
}

/**
 * Collects changed file paths from git working tree.
 * @returns {string[]}
 */
function collectChangedFilesFromGit() {
  const changedFiles = new Set([
    ...runGitPathList(["diff", "--name-only", "--relative", "--cached", "HEAD"]),
    ...runGitPathList(["diff", "--name-only", "--relative"]),
    ...runGitPathList(["ls-files", "--others", "--exclude-standard"]),
  ]);

  return Array.from(changedFiles).sort();
}

/**
 * Runs one git command and returns line list.
 * @param {string[]} args Git args.
 * @returns {string[]}
 */
function runGitPathList(args) {
  try {
    const output = execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return output
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => normalizePathSeparators(line));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to collect changed files from git (${args.join(" ")}): ${message}`);
  }
}

/**
 * Normalizes path separators to `/`.
 * @param {string} value Raw path.
 * @returns {string}
 */
function normalizePathSeparators(value) {
  return value.replace(/\\/gu, "/");
}

/**
 * Reads one doc metadata date (`- Date:` or `- 日期：`).
 * @param {string} relativeDocPath Relative doc path.
 * @returns {{date: string | null, missing: boolean}}
 */
function readMetadataDate(relativeDocPath) {
  const absoluteDocPath = resolve(process.cwd(), relativeDocPath);
  if (!existsSync(absoluteDocPath)) {
    return { date: null, missing: true };
  }

  const content = readFileSync(absoluteDocPath, "utf8");
  const matched = content.match(/^- (?:Date|日期)\s*[:：]\s*(\d{4}-\d{2}-\d{2})\s*$/imu);
  if (!matched) {
    return { date: null, missing: false };
  }

  return { date: matched[1], missing: false };
}

/**
 * Builds one failure record.
 * @param {string} ruleId Rule identifier.
 * @param {string} message Human-readable message.
 * @param {Record<string, unknown>} details Extra machine-readable details.
 * @returns {{rule_id: string, message: string, details: Record<string, unknown>}}
 */
function buildFailure(ruleId, message, details) {
  return {
    rule_id: ruleId,
    message,
    details,
  };
}

/**
 * Evaluates spec sync contract and returns structured result.
 * @param {{changedFiles: string[]}} options Input options.
 * @returns {{status: "pass" | "fail", failures: Array<{rule_id: string, message: string, details: Record<string, unknown>}>, changed_files: string[], missing_sync_files: string[]}}
 */
function evaluateSpecSync(options) {
  const changedFiles =
    options.changedFiles.length > 0 ? options.changedFiles : collectChangedFilesFromGit();
  const normalizedChangedFiles = changedFiles.map((filePath) => normalizePathSeparators(filePath));
  const changedFileSet = new Set(normalizedChangedFiles);
  const monitoredChangedFiles = MONITORED_DOC_PATHS.filter((docPath) =>
    changedFileSet.has(docPath),
  );

  /** @type {Array<{rule_id: string, message: string, details: Record<string, unknown>}>} */
  const failures = [];
  const missingSyncFileSet = new Set();

  const triadDateMap = {};
  let hasMissingTriadDoc = false;
  let hasMissingTriadDate = false;
  for (const triadDocPath of TRIAD_DOC_PATHS) {
    const metadataDate = readMetadataDate(triadDocPath);
    if (metadataDate.missing) {
      hasMissingTriadDoc = true;
      failures.push(
        buildFailure("triad_doc_missing", "Triad document is missing.", {
          doc_path: triadDocPath,
        }),
      );
      continue;
    }

    if (!metadataDate.date) {
      hasMissingTriadDate = true;
      failures.push(
        buildFailure(
          "triad_date_metadata_missing",
          "Triad document missing `Date/日期` metadata.",
          {
            doc_path: triadDocPath,
          },
        ),
      );
      continue;
    }

    triadDateMap[triadDocPath] = metadataDate.date;
  }

  if (!hasMissingTriadDoc && !hasMissingTriadDate) {
    const uniqueTriadDates = Array.from(new Set(Object.values(triadDateMap)));
    if (uniqueTriadDates.length > 1) {
      failures.push(
        buildFailure("triad_date_metadata_mismatch", "Triad document dates must be synchronized.", {
          triad_dates: triadDateMap,
        }),
      );
    }
  }

  const changedTriadDocs = TRIAD_DOC_PATHS.filter((docPath) => changedFileSet.has(docPath));
  if (changedTriadDocs.length > 0 && changedTriadDocs.length < TRIAD_DOC_PATHS.length) {
    const missingTriadDocs = TRIAD_DOC_PATHS.filter((docPath) => !changedFileSet.has(docPath));
    for (const docPath of missingTriadDocs) {
      missingSyncFileSet.add(docPath);
    }

    failures.push(
      buildFailure(
        "triad_changeset_incomplete",
        "When one triad document changes, all triad documents must be updated in the same changeset.",
        {
          changed_files: changedTriadDocs,
          required_files: TRIAD_DOC_PATHS,
          missing_sync_files: missingTriadDocs,
        },
      ),
    );
  }

  const prdChanged = changedFileSet.has(TRIAD_DOC_PATHS[0]);
  const briefChanged = changedFileSet.has(BRIEF_DOC_PATH);
  if (prdChanged && !briefChanged) {
    missingSyncFileSet.add(BRIEF_DOC_PATH);
    failures.push(
      buildFailure(
        "prd_brief_sync_missing",
        "When product-requirements.md changes, product-requirements-brief.md must change in the same changeset.",
        {
          changed_files: [TRIAD_DOC_PATHS[0]],
          missing_sync_files: [BRIEF_DOC_PATH],
        },
      ),
    );
  }

  return {
    status: failures.length === 0 ? "pass" : "fail",
    failures,
    changed_files: monitoredChangedFiles.sort(),
    missing_sync_files: Array.from(missingSyncFileSet).sort(),
  };
}

/**
 * Prints text-mode result for humans.
 * @param {{status: "pass" | "fail", failures: Array<{rule_id: string, message: string, details: Record<string, unknown>}>, changed_files: string[], missing_sync_files: string[]}} result
 */
function printTextResult(result) {
  if (result.status === "pass") {
    gatePass(
      GATE_NAME,
      `Triad/brief sync check passed. changed_files=${result.changed_files.length}`,
    );
    if (result.changed_files.length > 0) {
      gateInfo(GATE_NAME, `changed files: ${result.changed_files.join(", ")}`);
    }
    return;
  }

  gateFail(GATE_NAME, "Triad/brief sync check failed.");
  for (const failure of result.failures) {
    gateFail(GATE_NAME, `- rule=${failure.rule_id} message="${failure.message}"`);
    gateInfo(GATE_NAME, `  details=${JSON.stringify(failure.details)}`);
  }
  if (result.missing_sync_files.length > 0) {
    gateInfo(GATE_NAME, `missing_sync_files=${result.missing_sync_files.join(", ")}`);
  }
}

const options = resolveCliOptions(process.argv.slice(2));
const result = evaluateSpecSync(options);

if (options.format === "json") {
  console.info(JSON.stringify(result, null, 2));
} else {
  printTextResult(result);
}

if (result.status === "fail") {
  process.exit(1);
}
