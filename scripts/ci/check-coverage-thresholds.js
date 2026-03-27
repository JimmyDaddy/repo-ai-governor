#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';

const GATE_NAME = 'coverage-thresholds';
const COVERAGE_SUMMARY_PATH = 'coverage/coverage-summary.json';
const COVERAGE_THRESHOLD_CONFIG_PATH = 'scripts/ci/coverage-thresholds.json';
const COVERAGE_METRIC_NAMES = ['lines', 'statements', 'functions', 'branches'];

/**
 * Reads one JSON file from repository root.
 * @param {string} relativePath Relative path from repository root.
 * @returns {unknown}
 */
function readJsonFile(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Required JSON file is missing: ${relativePath}`);
  }

  const rawContent = readFileSync(absolutePath, 'utf8');
  return JSON.parse(rawContent);
}

/**
 * Reads coverage thresholds from config.
 * @returns {Record<string, number>}
 */
function readCoverageThresholds() {
  const parsedConfig = readJsonFile(COVERAGE_THRESHOLD_CONFIG_PATH);
  if (!parsedConfig || typeof parsedConfig !== 'object') {
    throw new Error('Coverage threshold config must be a JSON object.');
  }

  const minimum = parsedConfig.minimum;
  if (!minimum || typeof minimum !== 'object') {
    throw new Error('Coverage threshold config must define object field "minimum".');
  }

  /** @type {Record<string, number>} */
  const thresholds = {};
  for (const metricName of COVERAGE_METRIC_NAMES) {
    const thresholdValue = minimum[metricName];
    if (typeof thresholdValue !== 'number' || !Number.isFinite(thresholdValue)) {
      throw new Error(`Coverage threshold "minimum.${metricName}" must be a finite number.`);
    }

    thresholds[metricName] = thresholdValue;
  }

  return thresholds;
}

/**
 * Reads actual coverage percentages from vitest coverage summary.
 * @returns {Record<string, number>}
 */
function readCoveragePercentages() {
  const summaryJson = readJsonFile(COVERAGE_SUMMARY_PATH);
  if (!summaryJson || typeof summaryJson !== 'object') {
    throw new Error('Coverage summary payload is invalid.');
  }

  const total = summaryJson.total;
  if (!total || typeof total !== 'object') {
    throw new Error('Coverage summary must define object field "total".');
  }

  /** @type {Record<string, number>} */
  const percentages = {};
  for (const metricName of COVERAGE_METRIC_NAMES) {
    const metricObject = total[metricName];
    if (!metricObject || typeof metricObject !== 'object') {
      throw new Error(`Coverage summary is missing total metric "${metricName}".`);
    }

    const percentage = metricObject.pct;
    if (typeof percentage !== 'number' || !Number.isFinite(percentage)) {
      throw new Error(`Coverage metric "${metricName}.pct" must be a finite number.`);
    }

    percentages[metricName] = percentage;
  }

  return percentages;
}

try {
  const thresholds = readCoverageThresholds();
  const percentages = readCoveragePercentages();
  const violations = [];

  for (const metricName of COVERAGE_METRIC_NAMES) {
    const actualPercentage = percentages[metricName];
    const minimumPercentage = thresholds[metricName];
    if (actualPercentage < minimumPercentage) {
      violations.push({
        metricName,
        actualPercentage,
        minimumPercentage,
      });
    }
  }

  if (violations.length > 0) {
    gateFail(GATE_NAME, `Coverage threshold violations detected (${violations.length}).`);
    for (const violation of violations) {
      gateInfo(
        GATE_NAME,
        `metric=${violation.metricName} actual=${violation.actualPercentage}% minimum=${violation.minimumPercentage}%`,
      );
    }
    process.exit(1);
  }

  gateInfo(
    GATE_NAME,
    `coverage=${JSON.stringify(percentages)} thresholds=${JSON.stringify(thresholds)}`,
  );
  gatePass(GATE_NAME, 'coverage thresholds check passed.');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
