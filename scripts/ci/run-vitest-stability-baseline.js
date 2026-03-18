#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_RUNS = 3;
const DEFAULT_SLOW_FILE_MS = 2000;
const DEFAULT_MAX_WORKERS = "50%";
const DEFAULT_OUTPUT_DIR = ".repo-ai-governor/reports/vitest-stability";
const MAX_OUTPUT_LENGTH = 2000;

function parsePositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallbackValue;
}

function truncateOutput(value) {
  if (typeof value !== "string") {
    return "";
  }

  if (value.length <= MAX_OUTPUT_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_OUTPUT_LENGTH)}\n...<truncated>`;
}

function parseArguments(argv) {
  const options = {
    cwd: process.cwd(),
    runs: DEFAULT_RUNS,
    slowFileMs: DEFAULT_SLOW_FILE_MS,
    maxWorkers: DEFAULT_MAX_WORKERS,
    fileParallelism: true,
    isolate: true,
    outputDir: DEFAULT_OUTPUT_DIR,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--cwd") {
      options.cwd = argv[index + 1] ?? options.cwd;
      index += 1;
    } else if (token === "--runs") {
      options.runs = parsePositiveInteger(argv[index + 1], options.runs);
      index += 1;
    } else if (token === "--slow-file-ms") {
      options.slowFileMs = parsePositiveInteger(argv[index + 1], options.slowFileMs);
      index += 1;
    } else if (token === "--max-workers") {
      options.maxWorkers = String(argv[index + 1] ?? options.maxWorkers);
      index += 1;
    } else if (token === "--output-dir") {
      options.outputDir = String(argv[index + 1] ?? options.outputDir);
      index += 1;
    } else if (token === "--no-file-parallelism") {
      options.fileParallelism = false;
    } else if (token === "--no-isolate") {
      options.isolate = false;
    }
  }

  options.cwd = path.resolve(options.cwd);
  options.outputDir = path.resolve(options.cwd, options.outputDir);
  return options;
}

function toRelativePath(cwd, absolutePath) {
  const relativePath = path.relative(cwd, absolutePath).split(path.sep).join("/");
  return relativePath || ".";
}

function formatRunId(runIndex) {
  return String(runIndex).padStart(2, "0");
}

function ensureDirectory(targetDirectory) {
  fs.mkdirSync(targetDirectory, { recursive: true });
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function computeSuiteDuration(suiteResult) {
  if (typeof suiteResult?.startTime === "number" && typeof suiteResult?.endTime === "number") {
    return Math.max(0, suiteResult.endTime - suiteResult.startTime);
  }

  const assertionResults = Array.isArray(suiteResult?.assertionResults)
    ? suiteResult.assertionResults
    : [];
  return assertionResults.reduce((total, assertionResult) => {
    const duration = typeof assertionResult?.duration === "number" ? assertionResult.duration : 0;
    return total + Math.max(0, duration);
  }, 0);
}

function runVitestForIteration(options, runIndex) {
  const runLabel = formatRunId(runIndex);
  const runReportPath = path.join(options.outputDir, `run-${runLabel}.json`);
  const commandArgs = [
    "vitest",
    "run",
    "--reporter=json",
    `--outputFile=${runReportPath}`,
    "--maxWorkers",
    options.maxWorkers,
  ];

  if (!options.fileParallelism) {
    commandArgs.push("--no-file-parallelism");
  }

  if (!options.isolate) {
    commandArgs.push("--no-isolate");
  }

  const startedAt = Date.now();
  const executionResult = spawnSync("npx", commandArgs, {
    cwd: options.cwd,
    encoding: "utf8",
    env: process.env,
  });
  const durationMs = Date.now() - startedAt;
  const report = safeReadJson(runReportPath);
  const reportSuccess = report?.success === true;
  const passed = executionResult.status === 0 && reportSuccess;

  return {
    runIndex,
    runReportPath,
    durationMs,
    passed,
    exitCode: typeof executionResult.status === "number" ? executionResult.status : 1,
    stdout: truncateOutput(executionResult.stdout),
    stderr: truncateOutput(executionResult.stderr),
    report,
    command: `npx ${commandArgs.join(" ")}`,
  };
}

function summarizeFileMetrics(runResults, cwd) {
  const fileMetricsMap = new Map();

  for (const runResult of runResults) {
    const suites = Array.isArray(runResult.report?.testResults) ? runResult.report.testResults : [];

    for (const suite of suites) {
      const suiteName = typeof suite?.name === "string" ? suite.name : "unknown-suite";
      const relativeSuitePath = suiteName.startsWith(cwd)
        ? toRelativePath(cwd, suiteName)
        : suiteName.split(path.sep).join("/");
      const durationMs = computeSuiteDuration(suite);
      const suiteStatus = String(suite?.status ?? "unknown");
      const existingMetric = fileMetricsMap.get(relativeSuitePath) ?? {
        filePath: relativeSuitePath,
        durationsMs: [],
        failRuns: [],
      };

      existingMetric.durationsMs.push(durationMs);

      if (suiteStatus !== "passed") {
        existingMetric.failRuns.push(runResult.runIndex);
      }

      fileMetricsMap.set(relativeSuitePath, existingMetric);
    }
  }

  return [...fileMetricsMap.values()].map((fileMetric) => {
    const totalDurationMs = fileMetric.durationsMs.reduce(
      (total, durationMs) => total + durationMs,
      0,
    );
    const avgDurationMs =
      fileMetric.durationsMs.length > 0 ? totalDurationMs / fileMetric.durationsMs.length : 0;
    const maxDurationMs =
      fileMetric.durationsMs.length > 0 ? Math.max(...fileMetric.durationsMs) : totalDurationMs;
    const minDurationMs =
      fileMetric.durationsMs.length > 0 ? Math.min(...fileMetric.durationsMs) : totalDurationMs;

    return {
      filePath: fileMetric.filePath,
      samples: fileMetric.durationsMs.length,
      avgDurationMs,
      maxDurationMs,
      minDurationMs,
      totalDurationMs,
      failRuns: fileMetric.failRuns,
      flaky: fileMetric.failRuns.length > 0 && fileMetric.failRuns.length < runResults.length,
    };
  });
}

function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}

function renderMarkdownSummary(summary) {
  const topSlowRows = summary.topSlowFiles.map((fileMetric) => {
    return `| ${fileMetric.filePath} | ${roundToTwo(fileMetric.avgDurationMs)} | ${roundToTwo(fileMetric.maxDurationMs)} | ${fileMetric.samples} |`;
  });
  const flakyRows = summary.flakyFiles.map((fileMetric) => {
    return `- ${fileMetric.filePath} (fail-runs: ${fileMetric.failRuns.join(", ")})`;
  });
  const runRows = summary.runs.map((run) => {
    return `- run-${formatRunId(run.runIndex)}: status=${run.passed ? "pass" : "fail"}, durationMs=${run.durationMs}, exitCode=${run.exitCode}`;
  });

  return `# Vitest Stability Baseline

- Generated At: ${summary.generatedAt}
- Status: ${summary.status}
- Runs: ${summary.runCount}
- Run Failures: ${summary.runFailures}
- Slow File Threshold (ms): ${summary.slowFileThresholdMs}
- Slow Files (avg >= threshold): ${summary.slowFiles.length}
- Flaky Files: ${summary.flakyFiles.length}

## Run Summary

${runRows.join("\n")}

## Top Slow Test Files

| File | Avg Duration (ms) | Max Duration (ms) | Samples |
| --- | ---: | ---: | ---: |
${topSlowRows.length > 0 ? topSlowRows.join("\n") : "| (none) | 0 | 0 | 0 |"}

## Flaky Candidates

${flakyRows.length > 0 ? flakyRows.join("\n") : "- none"}
`;
}

function buildSummary(options, runResults) {
  const fileMetrics = summarizeFileMetrics(runResults, options.cwd);
  const sortedByAvgDuration = [...fileMetrics].sort(
    (left, right) => right.avgDurationMs - left.avgDurationMs,
  );
  const runFailures = runResults.filter((runResult) => !runResult.passed);
  const slowFiles = sortedByAvgDuration.filter(
    (fileMetric) => fileMetric.avgDurationMs >= options.slowFileMs,
  );
  const flakyFiles = sortedByAvgDuration.filter((fileMetric) => fileMetric.flaky);
  const status = runFailures.length === 0 ? "pass" : "fail";

  return {
    status,
    generatedAt: new Date().toISOString(),
    cwd: options.cwd,
    runCount: runResults.length,
    runFailures: runFailures.length,
    slowFileThresholdMs: options.slowFileMs,
    runs: runResults.map((runResult) => ({
      runIndex: runResult.runIndex,
      passed: runResult.passed,
      exitCode: runResult.exitCode,
      durationMs: runResult.durationMs,
      command: runResult.command,
      reportFile: toRelativePath(options.cwd, runResult.runReportPath),
      stdout: runResult.stdout,
      stderr: runResult.stderr,
    })),
    topSlowFiles: sortedByAvgDuration.slice(0, 10).map((fileMetric) => ({
      ...fileMetric,
      avgDurationMs: roundToTwo(fileMetric.avgDurationMs),
      maxDurationMs: roundToTwo(fileMetric.maxDurationMs),
      minDurationMs: roundToTwo(fileMetric.minDurationMs),
      totalDurationMs: roundToTwo(fileMetric.totalDurationMs),
    })),
    slowFiles: slowFiles.map((fileMetric) => ({
      ...fileMetric,
      avgDurationMs: roundToTwo(fileMetric.avgDurationMs),
      maxDurationMs: roundToTwo(fileMetric.maxDurationMs),
      minDurationMs: roundToTwo(fileMetric.minDurationMs),
      totalDurationMs: roundToTwo(fileMetric.totalDurationMs),
    })),
    flakyFiles,
  };
}

function writeSummaryOutputs(options, summary) {
  const summaryJsonPath = path.join(options.outputDir, "latest.json");
  const summaryMarkdownPath = path.join(options.outputDir, "latest.md");
  const markdown = renderMarkdownSummary(summary);

  fs.writeFileSync(summaryJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(summaryMarkdownPath, markdown, "utf8");
  return { summaryJsonPath, summaryMarkdownPath };
}

function printSummary(summary, summaryPaths, options) {
  process.stdout.write(
    `${[
      "vitest-stability-baseline",
      `status=${summary.status}`,
      `runs=${summary.runCount}`,
      `runFailures=${summary.runFailures}`,
      `slowFileThresholdMs=${options.slowFileMs}`,
      `slowFiles=${summary.slowFiles.length}`,
      `flakyFiles=${summary.flakyFiles.length}`,
      `summaryJson=${toRelativePath(options.cwd, summaryPaths.summaryJsonPath)}`,
      `summaryMarkdown=${toRelativePath(options.cwd, summaryPaths.summaryMarkdownPath)}`,
    ].join("\n")}\n`,
  );
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  ensureDirectory(options.outputDir);

  const runResults = [];

  for (let runIndex = 1; runIndex <= options.runs; runIndex += 1) {
    runResults.push(runVitestForIteration(options, runIndex));
  }

  const summary = buildSummary(options, runResults);
  const summaryPaths = writeSummaryOutputs(options, summary);
  printSummary(summary, summaryPaths, options);
  process.exitCode = summary.status === "pass" ? 0 : 1;
}

main();
