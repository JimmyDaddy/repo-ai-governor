#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';

const GATE_NAME = 'release-verify-host-distribution';
const DIST_CLI_ENTRY_PATH = 'dist/bin/repo-ai-governor.js';
const DEFAULT_OUTPUT_PATH = '.tmp/release-host-distribution-validation-report.json';
const DEFAULT_WORKING_ROOT = '.tmp/release-host-distribution-validation';

const RELATED_DOCS = [
  'README.md',
  'README.zh-CN.md',
  'docs/local-adoption-playbook.md',
  'docs/local-adoption-playbook.zh-CN.md',
  'docs/maintainer-validation-playbook.md',
  'docs/maintainer-validation-playbook.zh-CN.md',
  'docs/support-matrix.md',
  'docs/support-matrix.zh-CN.md',
];

const SCENARIOS = [
  {
    id: 'codex-project-local',
    description: 'Codex project-local export/apply/verify from a built source checkout.',
    action: 'export',
    host: 'codex',
    mode: 'project-local',
    expectedGeneratedFiles: [
      {
        label: 'applied AGENTS entry',
        matches: (relativePath) => relativePath === 'AGENTS.md',
      },
      {
        label: 'Codex projected skill',
        matches: (relativePath) => /^\.agents\/skills\/.+\/SKILL\.md$/.test(relativePath),
      },
      {
        label: 'Codex projected subagent',
        matches: (relativePath) => /^\.agents\/subagents\/.+\.json$/.test(relativePath),
      },
      {
        label: 'Codex MCP bridge file',
        matches: (relativePath) => relativePath === '.mcp.json',
      },
    ],
  },
  {
    id: 'claude-code-project-local',
    description: 'Claude Code project-local export/apply/verify from a built source checkout.',
    action: 'export',
    host: 'claude-code',
    mode: 'project-local',
    expectedGeneratedFiles: [
      {
        label: 'Claude projected skill',
        matches: (relativePath) => /^\.claude\/skills\/.+\/SKILL\.md$/.test(relativePath),
      },
      {
        label: 'Claude projected agent',
        matches: (relativePath) => /^\.claude\/agents\/.+\.agent\.md$/.test(relativePath),
      },
      {
        label: 'Claude hooks manifest',
        matches: (relativePath) => relativePath === '.claude/hooks/hooks.json',
      },
      {
        label: 'Claude MCP bridge file',
        matches: (relativePath) => relativePath === '.mcp.json',
      },
    ],
  },
  {
    id: 'codex-plugin-bundle',
    description: 'Codex plugin-bundle pack/verify from a built source checkout.',
    action: 'pack',
    host: 'codex',
    mode: 'plugin-bundle',
    expectedGeneratedFiles: [
      {
        label: 'Codex plugin manifest',
        matches: (relativePath) => relativePath === '.codex-plugin/plugin.json',
      },
      {
        label: 'Codex bundled skill',
        matches: (relativePath) => /^skills\/.+\/SKILL\.md$/.test(relativePath),
      },
      {
        label: 'Codex bundled agent',
        matches: (relativePath) => /^agents\/.+\.agent\.md$/.test(relativePath),
      },
      {
        label: 'Codex bundled MCP bridge file',
        matches: (relativePath) => relativePath === '.mcp.json',
      },
    ],
  },
  {
    id: 'claude-code-plugin-bundle',
    description: 'Claude Code plugin-bundle pack/verify from a built source checkout.',
    action: 'pack',
    host: 'claude-code',
    mode: 'plugin-bundle',
    expectedGeneratedFiles: [
      {
        label: 'Claude plugin manifest',
        matches: (relativePath) => relativePath === '.claude-plugin/plugin.json',
      },
      {
        label: 'Claude bundled skill',
        matches: (relativePath) => /^skills\/.+\/SKILL\.md$/.test(relativePath),
      },
      {
        label: 'Claude bundled agent',
        matches: (relativePath) => /^agents\/.+\.agent\.md$/.test(relativePath),
      },
      {
        label: 'Claude bundled hooks manifest',
        matches: (relativePath) => relativePath === 'hooks/hooks.json',
      },
      {
        label: 'Claude bundled MCP bridge file',
        matches: (relativePath) => relativePath === '.mcp.json',
      },
    ],
  },
];

/**
 * Parses supported CLI flags.
 * @returns {{ outputPath: string; workingRoot: string }}
 */
function parseCliOptions() {
  const rawArgs = process.argv.slice(2);
  let outputPath = DEFAULT_OUTPUT_PATH;
  let workingRoot = DEFAULT_WORKING_ROOT;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--output') {
      const candidatePath = rawArgs[index + 1]?.trim();
      if (!candidatePath) {
        throw new Error('Expected a non-empty value after "--output".');
      }
      outputPath = candidatePath;
      index += 1;
      continue;
    }

    if (arg === '--working-root') {
      const candidatePath = rawArgs[index + 1]?.trim();
      if (!candidatePath) {
        throw new Error('Expected a non-empty value after "--working-root".');
      }
      workingRoot = candidatePath;
      index += 1;
      continue;
    }

    throw new Error(`Unsupported option: ${arg}`);
  }

  return {
    outputPath,
    workingRoot,
  };
}

/**
 * Returns whether one absolute path stays inside the expected base directory.
 * Why: this release validation script performs recursive cleanup and must never delete outside
 * its dedicated temporary subtree.
 * @param {string} basePath Absolute allowed base path.
 * @param {string} candidatePath Absolute candidate path.
 * @returns {boolean}
 */
function isPathInsideBase(basePath, candidatePath) {
  const pathDelta = relative(basePath, candidatePath);
  return pathDelta === '' || (!pathDelta.startsWith('..') && pathDelta !== '..');
}

/**
 * Resolves one safe working root that remains under the dedicated temp subtree.
 * @param {string} repositoryRoot Absolute repository root.
 * @param {string} configuredWorkingRoot CLI-provided working root.
 * @returns {string}
 */
function resolveWorkingRootPath(repositoryRoot, configuredWorkingRoot) {
  const allowedWorkingRootBase = resolve(repositoryRoot, DEFAULT_WORKING_ROOT);
  const resolvedWorkingRoot = resolve(repositoryRoot, configuredWorkingRoot);

  if (!isPathInsideBase(allowedWorkingRootBase, resolvedWorkingRoot)) {
    throw new Error(
      `Unsafe --working-root path: ${resolvedWorkingRoot}. It must stay within ${allowedWorkingRootBase}.`,
    );
  }

  return resolvedWorkingRoot;
}

/**
 * Executes one command and throws on non-zero exit.
 * @param {string} command Command binary.
 * @param {string[]} args Command arguments.
 * @param {string} label Human-readable label.
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function runCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw new Error(`${label} failed to execute: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stdout = result.stdout?.trim() ?? '';
    const stderr = result.stderr?.trim() ?? '';
    throw new Error(
      `${label} exited with code ${String(result.status)}. stdout="${stdout}" stderr="${stderr}"`,
    );
  }

  return result;
}

/**
 * Parses the JSON object emitted by the CLI from raw stdout.
 * @param {string} rawOutput Raw stdout from one CLI invocation.
 * @param {string} label Parse label.
 * @returns {Record<string, unknown>}
 */
function parseCliJson(rawOutput, label) {
  const trimmedOutput = rawOutput.trim();
  const candidateLines = trimmedOutput.split('\n').reverse();

  for (const candidateLine of candidateLines) {
    const candidate = candidateLine.trim();
    if (!candidate.startsWith('{') || !candidate.endsWith('}')) {
      continue;
    }

    try {
      return JSON.parse(candidate);
    } catch {}
  }

  throw new Error(`${label} did not emit a JSON object. raw_stdout="${trimmedOutput}"`);
}

/**
 * Recursively collects relative file paths under one root.
 * @param {string} root Absolute directory root.
 * @param {string} [prefix] Relative prefix.
 * @returns {string[]}
 */
function collectRelativeFilePaths(root, prefix = '') {
  if (!existsSync(root)) {
    return [];
  }

  const absoluteRoot = resolve(root, prefix);
  const directoryEntries = readdirSync(absoluteRoot, {
    withFileTypes: true,
  });

  const collectedPaths = [];
  for (const directoryEntry of directoryEntries) {
    const nextPrefix = prefix.length > 0 ? `${prefix}/${directoryEntry.name}` : directoryEntry.name;
    if (directoryEntry.isDirectory()) {
      collectedPaths.push(...collectRelativeFilePaths(root, nextPrefix));
      continue;
    }
    collectedPaths.push(nextPrefix);
  }

  return collectedPaths;
}

/**
 * Reads one JSON file with explicit missing-file diagnostics.
 * @template T
 * @param {string} filePath Absolute file path.
 * @param {string} label Human-readable label.
 * @returns {T}
 */
function readJsonFile(filePath, label) {
  if (!existsSync(filePath)) {
    throw new Error(`${label} is missing: ${filePath}`);
  }

  return JSON.parse(readFileSync(filePath, 'utf8'));
}

/**
 * Verifies that one generated tree contains the expected files.
 * @param {string} root Absolute tree root.
 * @param {Array<{ label: string; matches: (relativePath: string) => boolean }>} expectations Expectations to validate.
 * @returns {Array<{ label: string; matchedPaths: string[] }>}
 */
function verifyExpectedFiles(root, expectations) {
  const relativePaths = collectRelativeFilePaths(root);

  return expectations.map((expectation) => {
    const matchedPaths = relativePaths.filter((relativePath) => expectation.matches(relativePath));
    if (matchedPaths.length === 0) {
      throw new Error(`Missing expected generated file: ${expectation.label} under ${root}`);
    }

    return {
      label: expectation.label,
      matchedPaths,
    };
  });
}

/**
 * Resolves one stable scenario working directory root.
 * @param {string} workingRoot Absolute validation working root.
 * @param {string} segment Child segment.
 * @param {string} scenarioId Scenario identifier.
 * @returns {string}
 */
function resolveScenarioRoot(workingRoot, segment, scenarioId) {
  return resolve(workingRoot, segment, scenarioId);
}

/**
 * Executes one host-distribution validation scenario end to end.
 * @param {string} distCliPath Absolute dist CLI entry.
 * @param {string} workingRoot Absolute validation working root.
 * @param {{
 *   id: string;
 *   description: string;
 *   action: 'export' | 'pack';
 *   host: 'codex' | 'claude-code';
 *   mode: 'project-local' | 'plugin-bundle';
 *   expectedGeneratedFiles: Array<{ label: string; matches: (relativePath: string) => boolean }>;
 * }} scenario Scenario definition.
 * @returns {Record<string, unknown>}
 */
function runScenario(distCliPath, workingRoot, scenario) {
  const stagedRoot = resolveScenarioRoot(workingRoot, 'staged', scenario.id);
  const targetRoot =
    scenario.action === 'export'
      ? resolveScenarioRoot(workingRoot, 'applied', scenario.id)
      : resolveScenarioRoot(workingRoot, 'bundles', scenario.id);
  const manifestPath = resolve(stagedRoot, 'host-export.manifest.json');
  const reportPath =
    scenario.action === 'export'
      ? resolve(stagedRoot, 'host-apply.report.json')
      : resolve(stagedRoot, 'host-pack.report.json');
  const verificationSummaryPath = resolve(stagedRoot, 'host-verification.summary.json');

  mkdirSync(stagedRoot, { recursive: true });
  mkdirSync(targetRoot, { recursive: true });

  const commandArgs = ['--output', 'json', 'host', scenario.action];
  commandArgs.push('--host', scenario.host, '--mode', scenario.mode, '--output-dir', stagedRoot);
  if (scenario.action === 'export') {
    commandArgs.push('--apply-to-repo', targetRoot);
  } else {
    commandArgs.push('--bundle-dir', targetRoot);
  }

  const actionResult = runCommand(
    'node',
    [distCliPath, ...commandArgs],
    `${scenario.id}:${scenario.action}`,
  );
  const actionPayload = parseCliJson(
    actionResult.stdout ?? '',
    `${scenario.id}:${scenario.action}`,
  );

  const verifyResult = runCommand(
    'node',
    [distCliPath, '--output', 'json', 'host', 'verify', '--manifest', manifestPath],
    `${scenario.id}:verify`,
  );
  const verifyPayload = parseCliJson(verifyResult.stdout ?? '', `${scenario.id}:verify`);

  const verificationSummary = readJsonFile(
    verificationSummaryPath,
    `${scenario.id} verification summary`,
  );
  const artifactReport = readJsonFile(reportPath, `${scenario.id} report artifact`);
  const manifest = readJsonFile(manifestPath, `${scenario.id} export manifest`);
  const matchedFiles = verifyExpectedFiles(targetRoot, scenario.expectedGeneratedFiles);

  if (verificationSummary.status !== 'pass') {
    throw new Error(
      `${scenario.id} verification summary did not pass. actual=${String(verificationSummary.status)}`,
    );
  }

  return {
    id: scenario.id,
    description: scenario.description,
    host: scenario.host,
    mode: scenario.mode,
    action: scenario.action,
    stagedRoot,
    targetRoot,
    manifestPath,
    reportPath,
    verificationSummaryPath,
    manifest,
    artifactReport,
    verificationSummary,
    actionPayload,
    verifyPayload,
    matchedFiles,
  };
}

/**
 * Entry point.
 */
function main() {
  try {
    const { outputPath, workingRoot } = parseCliOptions();
    const repositoryRoot = process.cwd();
    const distCliPath = resolve(repositoryRoot, DIST_CLI_ENTRY_PATH);
    const absoluteOutputPath = resolve(repositoryRoot, outputPath);
    const absoluteWorkingRoot = resolveWorkingRootPath(repositoryRoot, workingRoot);

    if (!existsSync(distCliPath)) {
      throw new Error(
        `Dist CLI entry is missing: ${DIST_CLI_ENTRY_PATH}. Run "pnpm run build" before this script.`,
      );
    }

    rmSync(absoluteWorkingRoot, { recursive: true, force: true });
    mkdirSync(absoluteWorkingRoot, { recursive: true });
    mkdirSync(dirname(absoluteOutputPath), { recursive: true });

    gateInfo(
      GATE_NAME,
      `validating ${String(SCENARIOS.length)} host-distribution scenarios from built source checkout`,
    );

    const scenarios = SCENARIOS.map((scenario) =>
      runScenario(distCliPath, absoluteWorkingRoot, scenario),
    );
    const report = {
      status: 'pass',
      generatedAt: new Date().toISOString(),
      repositoryRoot,
      distCliEntryPath: distCliPath,
      workingRoot: absoluteWorkingRoot,
      outputPath: absoluteOutputPath,
      relatedDocs: RELATED_DOCS.map((relativePath) => resolve(repositoryRoot, relativePath)),
      scenarios,
      summary: {
        scenarioCount: scenarios.length,
        verifiedHosts: [...new Set(scenarios.map((scenario) => scenario.host))],
        supportedModes: [...new Set(scenarios.map((scenario) => scenario.mode))],
      },
    };

    writeFileSync(absoluteOutputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    gatePass(
      GATE_NAME,
      `validated Codex/Claude project-local export/apply/verify and plugin-bundle pack/verify. report=${absoluteOutputPath}`,
    );
  } catch (error) {
    gateFail(
      GATE_NAME,
      error instanceof Error ? error.message : `Unexpected error: ${String(error)}`,
    );
    process.exitCode = 1;
  }
}

main();
