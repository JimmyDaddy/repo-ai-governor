#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TRIAD_FILES = Object.freeze([
  "docs/product-requirements.md",
  "docs/repo-ai-governor-overall-technical-solution.md",
  "docs/repo-ai-governor-architecture-and-repo-layering.md",
]);
const BRIEF_FILE = "docs/product-requirements-brief.md";
const DATE_PATTERN = /^\s*-\s*(?:Date|日期)\s*[:：]\s*(\d{4}-\d{2}-\d{2})\s*$/m;

function parseArguments(argv) {
  const options = {
    cwd: process.cwd(),
    format: "summary",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--cwd") {
      options.cwd = path.resolve(argv[index + 1] ?? options.cwd);
      index += 1;
      continue;
    }

    if (token.startsWith("--cwd=")) {
      options.cwd = path.resolve(token.slice("--cwd=".length));
      continue;
    }

    if (token === "--format=json") {
      options.format = "json";
    }
  }

  return options;
}

function normalizePath(value) {
  return String(value).replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

function loadDocumentMetadata(cwd, relativePath) {
  const absolutePath = path.resolve(cwd, relativePath);
  const exists = fs.existsSync(absolutePath);

  if (!exists) {
    return {
      path: normalizePath(relativePath),
      exists: false,
      date: null,
    };
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  const match = content.match(DATE_PATTERN);

  return {
    path: normalizePath(relativePath),
    exists: true,
    date: match?.[1] ?? null,
  };
}

function detectChangedFiles(cwd, trackedPaths) {
  try {
    const output = execFileSync(
      "git",
      ["-C", cwd, "diff", "--name-only", "HEAD", "--", ...trackedPaths],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const changedFiles = String(output)
      .split(/\r?\n/)
      .map((line) => normalizePath(line.trim()))
      .filter(Boolean);

    return {
      source: "git",
      changedFiles,
    };
  } catch {
    return {
      source: "unavailable",
      changedFiles: [],
    };
  }
}

function addFailure(payload, code, message, details = undefined) {
  payload.status = "fail";
  payload.failures.push({
    code,
    message,
    ...(details ? { details } : {}),
  });
}

function writeOutput(payload, format) {
  if (format === "json") {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stdout.write(
    `${[
      "docs-triad-sync-check",
      `status=${payload.status}`,
      `triadFiles=${payload.triad.files.length}`,
      `triadDate=${payload.triad.date ?? "-"}`,
      `changedTriadFiles=${payload.workingTree.changedTriadFiles.length}`,
      `changedBrief=${payload.workingTree.changedBriefFile}`,
      `failures=${payload.failures.length}`,
    ].join("\n")}\n`,
  );

  if (payload.failures.length > 0) {
    for (const failure of payload.failures) {
      process.stderr.write(`${failure.message}\n`);
    }
  }
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const cwd = path.resolve(options.cwd);
  const triadMetadata = TRIAD_FILES.map((filePath) => loadDocumentMetadata(cwd, filePath));
  const briefMetadata = loadDocumentMetadata(cwd, BRIEF_FILE);
  const trackedPaths = [...TRIAD_FILES, BRIEF_FILE];
  const changeDetection = detectChangedFiles(cwd, trackedPaths);
  const changedTriadFiles = changeDetection.changedFiles.filter((filePath) =>
    TRIAD_FILES.includes(filePath),
  );
  const changedTriadSet = new Set(changedTriadFiles);
  const changedBriefFile = changeDetection.changedFiles.includes(BRIEF_FILE);
  const payload = {
    status: "pass",
    cwd: normalizePath(cwd),
    triad: {
      files: triadMetadata,
      date: null,
    },
    brief: briefMetadata,
    workingTree: {
      source: changeDetection.source,
      changedFiles: changeDetection.changedFiles,
      changedTriadFiles,
      changedBriefFile,
      missingTriadFiles: [],
    },
    failures: [],
  };

  const missingTriadFiles = triadMetadata.filter((entry) => !entry.exists);

  if (missingTriadFiles.length > 0) {
    addFailure(
      payload,
      "docs.triad_files_missing",
      `Triad files missing: ${missingTriadFiles.map((entry) => entry.path).join(", ")}`,
      {
        missingFiles: missingTriadFiles.map((entry) => entry.path),
      },
    );
  }

  if (!briefMetadata.exists) {
    addFailure(
      payload,
      "docs.brief_file_missing",
      `Brief PRD file missing: ${briefMetadata.path}`,
      {
        missingFile: briefMetadata.path,
      },
    );
  }

  const triadDates = triadMetadata.map((entry) => entry.date);
  const missingTriadDateFiles = triadMetadata.filter((entry) => entry.exists && !entry.date);

  if (missingTriadDateFiles.length > 0) {
    addFailure(
      payload,
      "docs.triad_date_missing",
      `Triad date metadata missing in: ${missingTriadDateFiles
        .map((entry) => entry.path)
        .join(", ")}`,
      {
        missingDateFiles: missingTriadDateFiles.map((entry) => entry.path),
      },
    );
  }

  if (briefMetadata.exists && !briefMetadata.date) {
    addFailure(
      payload,
      "docs.brief_date_missing",
      `Brief PRD date metadata missing: ${briefMetadata.path}`,
      {
        missingDateFile: briefMetadata.path,
      },
    );
  }

  const uniqueTriadDates = [...new Set(triadDates.filter(Boolean))];
  if (uniqueTriadDates.length === 1) {
    payload.triad.date = uniqueTriadDates[0];
  }

  if (uniqueTriadDates.length > 1) {
    addFailure(
      payload,
      "docs.triad_date_mismatch",
      "Requirement/Solution/Architecture dates are not synchronized.",
      {
        dates: triadMetadata.map((entry) => ({
          path: entry.path,
          date: entry.date,
        })),
      },
    );
  }

  const prdDate = triadMetadata[0]?.date ?? null;
  if (prdDate && briefMetadata.date && prdDate !== briefMetadata.date) {
    addFailure(
      payload,
      "docs.brief_date_mismatch",
      `Brief PRD date must match PRD date (${prdDate}), got ${briefMetadata.date}.`,
      {
        prdDate,
        briefDate: briefMetadata.date,
      },
    );
  }

  if (changeDetection.source === "git") {
    if (changedTriadFiles.length > 0 && changedTriadFiles.length < TRIAD_FILES.length) {
      const missingTriadForThisChange = TRIAD_FILES.filter(
        (filePath) => !changedTriadSet.has(filePath),
      );
      payload.workingTree.missingTriadFiles = missingTriadForThisChange;
      addFailure(
        payload,
        "docs.triad_partial_change",
        `Triad change is incomplete. Missing changed files: ${missingTriadForThisChange.join(", ")}`,
        {
          changedTriadFiles,
          missingTriadFiles: missingTriadForThisChange,
        },
      );
    }

    if (changedTriadSet.has(TRIAD_FILES[0]) && !changedBriefFile) {
      addFailure(
        payload,
        "docs.prd_without_brief_sync",
        `PRD changed but brief PRD not changed: ${BRIEF_FILE}`,
      );
    }

    if (!changedTriadSet.has(TRIAD_FILES[0]) && changedBriefFile) {
      addFailure(
        payload,
        "docs.brief_without_prd_sync",
        `Brief PRD changed without PRD change: ${TRIAD_FILES[0]}`,
      );
    }
  }

  writeOutput(payload, options.format);
  process.exitCode = payload.status === "pass" ? 0 : 1;
}

main();
