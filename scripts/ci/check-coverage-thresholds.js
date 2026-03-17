#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const COVERAGE_METRICS = ["statements", "branches", "functions", "lines"];

function parseArguments(argv) {
  const options = {
    cwd: process.cwd(),
    summary: "coverage/coverage-summary.json",
    thresholds: "scripts/ci/coverage-thresholds.json",
    format: "summary",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--cwd") {
      options.cwd = argv[index + 1] ?? options.cwd;
      index += 1;
      continue;
    }

    if (token === "--summary") {
      options.summary = argv[index + 1] ?? options.summary;
      index += 1;
      continue;
    }

    if (token === "--thresholds") {
      options.thresholds = argv[index + 1] ?? options.thresholds;
      index += 1;
      continue;
    }

    if (token === "--format=json") {
      options.format = "json";
    }
  }

  options.cwd = path.resolve(options.cwd);
  options.summaryPath = path.resolve(options.cwd, options.summary);
  options.thresholdsPath = path.resolve(options.cwd, options.thresholds);
  return options;
}

function toRelativePath(cwd, absolutePath) {
  const relativePath = path.relative(cwd, absolutePath).split(path.sep).join("/");
  return relativePath || ".";
}

function readJsonFile(targetPath, label) {
  try {
    return JSON.parse(fs.readFileSync(targetPath, "utf8"));
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : `Unable to parse ${label} JSON at ${targetPath}`;
    throw new Error(`${label} load failed: ${reason}`);
  }
}

function normalizeCoverageRecord(entry) {
  return {
    statements: entry?.statements ?? null,
    branches: entry?.branches ?? null,
    functions: entry?.functions ?? null,
    lines: entry?.lines ?? null,
  };
}

function aggregateCoverage(records) {
  const aggregated = {
    statements: { covered: 0, total: 0, pct: 100 },
    branches: { covered: 0, total: 0, pct: 100 },
    functions: { covered: 0, total: 0, pct: 100 },
    lines: { covered: 0, total: 0, pct: 100 },
  };

  for (const record of records) {
    for (const metric of COVERAGE_METRICS) {
      aggregated[metric].covered += Number(record?.[metric]?.covered ?? 0);
      aggregated[metric].total += Number(record?.[metric]?.total ?? 0);
    }
  }

  for (const metric of COVERAGE_METRICS) {
    const total = aggregated[metric].total;
    const covered = aggregated[metric].covered;
    aggregated[metric].pct = total > 0 ? Math.round((covered / total) * 10000) / 100 : 100;
  }

  return aggregated;
}

function validateThresholdShape(thresholds, subjectLabel, failures) {
  for (const metric of COVERAGE_METRICS) {
    const thresholdValue = thresholds?.[metric];
    if (typeof thresholdValue !== "number" || Number.isNaN(thresholdValue)) {
      failures.push({
        type: "invalid-threshold",
        subject: subjectLabel,
        message: `${subjectLabel} missing numeric threshold for ${metric}`,
      });
    }
  }
}

function evaluateThresholds(actual, thresholds, subjectLabel, failures) {
  for (const metric of COVERAGE_METRICS) {
    const thresholdValue = Number(thresholds?.[metric]);
    const actualPct = Number(actual?.[metric]?.pct ?? 0);

    if (actualPct < thresholdValue) {
      failures.push({
        type: "threshold-breach",
        subject: subjectLabel,
        metric,
        expected: thresholdValue,
        actual: actualPct,
        message: `${subjectLabel} ${metric} ${actualPct}% is below threshold ${thresholdValue}%`,
      });
    }
  }
}

function buildScopeReport(scopeDefinition, fileCoverageRecords, failures) {
  const includes = Array.isArray(scopeDefinition?.include) ? scopeDefinition.include : [];
  const matchingRecords = fileCoverageRecords.filter((fileCoverageRecord) =>
    includes.some((prefix) => fileCoverageRecord.filePath.startsWith(prefix)),
  );

  if (matchingRecords.length === 0) {
    failures.push({
      type: "scope-empty",
      subject: scopeDefinition?.id ?? "unknown-scope",
      message: `Coverage scope "${scopeDefinition?.id ?? "unknown-scope"}" matched no files.`,
    });

    return {
      id: scopeDefinition?.id ?? "unknown-scope",
      label: scopeDefinition?.label ?? scopeDefinition?.id ?? "unknown-scope",
      include: includes,
      fileCount: 0,
      thresholds: scopeDefinition?.thresholds ?? {},
      actual: aggregateCoverage([]),
      status: "fail",
    };
  }

  const actual = aggregateCoverage(matchingRecords.map((record) => record.coverage));
  const scopeLabel = scopeDefinition?.id ?? "unknown-scope";
  validateThresholdShape(scopeDefinition?.thresholds, scopeLabel, failures);
  evaluateThresholds(actual, scopeDefinition?.thresholds, scopeLabel, failures);

  return {
    id: scopeDefinition?.id ?? "unknown-scope",
    label: scopeDefinition?.label ?? scopeDefinition?.id ?? "unknown-scope",
    include: includes,
    fileCount: matchingRecords.length,
    thresholds: scopeDefinition?.thresholds ?? {},
    actual,
    status: "pass",
  };
}

function buildPayload(options, summaryJson, thresholdJson) {
  const failures = [];
  const overallCoverage = normalizeCoverageRecord(summaryJson?.total);
  const coverageFiles = Object.entries(summaryJson ?? {})
    .filter(([filePath]) => filePath !== "total")
    .map(([filePath, coverage]) => ({
      filePath: path.relative(options.cwd, filePath).split(path.sep).join("/"),
      coverage: normalizeCoverageRecord(coverage),
    }));

  validateThresholdShape(thresholdJson?.overall, "overall", failures);
  const aggregatedOverall = aggregateCoverage([overallCoverage]);
  evaluateThresholds(aggregatedOverall, thresholdJson?.overall, "overall", failures);

  const scopes = Array.isArray(thresholdJson?.scopes)
    ? thresholdJson.scopes.map((scope) => buildScopeReport(scope, coverageFiles, failures))
    : [];

  if (!Array.isArray(thresholdJson?.scopes)) {
    failures.push({
      type: "invalid-thresholds-config",
      subject: "scopes",
      message: "Threshold config must define scopes as an array.",
    });
  }

  return {
    status: failures.length === 0 ? "pass" : "fail",
    summaryPath: toRelativePath(options.cwd, options.summaryPath),
    thresholdsPath: toRelativePath(options.cwd, options.thresholdsPath),
    meta: thresholdJson?.meta ?? {},
    overall: {
      thresholds: thresholdJson?.overall ?? {},
      actual: aggregatedOverall,
    },
    scopes,
    failures,
  };
}

function writeOutput(payload, format) {
  if (format === "json") {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stdout.write(
    `${[
      "coverage-threshold-check",
      `status=${payload.status}`,
      `summary=${payload.summaryPath}`,
      `thresholds=${payload.thresholdsPath}`,
      `overallStatements=${payload.overall.actual.statements.pct}`,
      `overallBranches=${payload.overall.actual.branches.pct}`,
      `overallFunctions=${payload.overall.actual.functions.pct}`,
      `overallLines=${payload.overall.actual.lines.pct}`,
      `scopeCount=${payload.scopes.length}`,
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
  const payload = {
    status: "fail",
    summaryPath: toRelativePath(options.cwd, options.summaryPath),
    thresholdsPath: toRelativePath(options.cwd, options.thresholdsPath),
    meta: {},
    overall: {
      thresholds: {},
      actual: aggregateCoverage([]),
    },
    scopes: [],
    failures: [],
  };

  try {
    const summaryJson = readJsonFile(options.summaryPath, "coverage summary");
    const thresholdJson = readJsonFile(options.thresholdsPath, "coverage thresholds");
    const result = buildPayload(options, summaryJson, thresholdJson);
    writeOutput(result, options.format);
    process.exitCode = result.status === "pass" ? 0 : 1;
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown coverage threshold error.";
    payload.failures.push({
      type: "runtime-error",
      subject: "coverage-threshold-check",
      message,
    });
    writeOutput(payload, options.format);
    process.exitCode = 1;
  }
}

main();
