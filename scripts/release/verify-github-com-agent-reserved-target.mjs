#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';

const GATE_NAME = 'release-verify-github-com-agent-reserved-target';
const DIST_CLI_ENTRY_PATH = 'dist/bin/repo-ai-governor.js';
const DEFAULT_OUTPUT_PATH =
  '.tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json';
const DEFAULT_WORKING_ROOT =
  '.tmp/project-068-sprint-002-github-com-agent-reserved-target-validation';
const RESERVED_TARGET = 'github_copilot.github_com_agent';
const EXPECTED_ERROR_CODE = 'STANDARDS_PACK_INVALID';

const RELATED_DOCS = [
  'packages/adapters/github-copilot/README.md',
  'docs/local-adoption-playbook.md',
  'docs/local-adoption-playbook.zh-CN.md',
  'docs/maintainer-validation-playbook.md',
  'docs/maintainer-validation-playbook.zh-CN.md',
  'docs/support-matrix.md',
  'docs/support-matrix.zh-CN.md',
];

const REQUIRED_STAGED_PATHS = [
  'AGENTS.md',
  '.github/copilot-instructions.md',
  '.github/agents/',
  '.github/mcp.json',
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
 * Executes one command and returns the captured payload.
 * @param {string} command Command binary.
 * @param {string[]} args Command arguments.
 * @param {string} label Human-readable label.
 * @returns {{ status: number | null; stdout: string; stderr: string; payload: Record<string, unknown> }}
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

  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';

  return {
    status: result.status,
    stdout,
    stderr,
    payload: parseCliJson(`${stdout}\n${stderr}`, label),
  };
}

/**
 * Parses the JSON object emitted by the CLI from raw output.
 * @param {string} rawOutput Raw stdout/stderr payload.
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

  throw new Error(`${label} did not emit a JSON object. raw_output="${trimmedOutput}"`);
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
 * Returns whether the staged tree contains the expected reserved-target paths.
 * @param {string[]} relativePaths Relative file paths under the staged export root.
 * @returns {Array<{ expectedPath: string; matched: boolean }>}
 */
function checkRequiredPaths(relativePaths) {
  return REQUIRED_STAGED_PATHS.map((expectedPath) => ({
    expectedPath,
    matched: expectedPath.endsWith('/')
      ? relativePaths.some((relativePath) => relativePath.startsWith(expectedPath))
      : relativePaths.includes(expectedPath),
  }));
}

/**
 * Extracts a compact check summary from one verification summary.
 * @param {{ checks?: Array<{ checkId?: string; status?: string }> }} verificationSummary Verification summary payload.
 * @returns {{ pass: number; warn: number; fail: number; blockingCheckIds: string[]; warningCheckIds: string[] }}
 */
function summarizeChecks(verificationSummary) {
  const checks = verificationSummary.checks ?? [];

  return {
    pass: checks.filter((check) => check.status === 'pass').length,
    warn: checks.filter((check) => check.status === 'warn').length,
    fail: checks.filter((check) => check.status === 'fail').length,
    blockingCheckIds: checks
      .filter((check) => check.status === 'fail')
      .map((check) => String(check.checkId ?? 'unknown')),
    warningCheckIds: checks
      .filter((check) => check.status === 'warn')
      .map((check) => String(check.checkId ?? 'unknown')),
  };
}

/**
 * Ensures the CLI returned the expected blocking payload.
 * @param {{ status: number | null; payload: Record<string, unknown> }} commandResult Parsed command result.
 * @param {string} scenarioId Scenario identifier.
 * @param {string[]} messageFragments Required message fragments.
 */
function assertExpectedFailure(commandResult, scenarioId, messageFragments) {
  if (commandResult.status !== 1) {
    throw new Error(
      `${scenarioId} expected exit code 1 but received ${String(commandResult.status)}.`,
    );
  }

  if (commandResult.payload.status !== 'error') {
    throw new Error(`${scenarioId} expected CLI status "error".`);
  }

  if (commandResult.payload.error_code !== EXPECTED_ERROR_CODE) {
    throw new Error(
      `${scenarioId} expected error_code "${EXPECTED_ERROR_CODE}" but received ${String(commandResult.payload.error_code)}.`,
    );
  }

  const message = String(commandResult.payload.message ?? '');
  for (const fragment of messageFragments) {
    if (!message.includes(fragment)) {
      throw new Error(`${scenarioId} missing expected message fragment "${fragment}".`);
    }
  }
}

/**
 * Runs the staged export scenario and captures the generated manifest + summary.
 * @param {string} distCliPath Absolute dist CLI path.
 * @param {string} workingRoot Absolute working root.
 * @returns {Record<string, unknown>}
 */
function runStagedExportScenario(distCliPath, workingRoot) {
  const stagedRoot = resolve(workingRoot, 'staged-export-blocked');
  const manifestPath = resolve(stagedRoot, 'host-export.manifest.json');
  const verificationSummaryPath = resolve(stagedRoot, 'host-verification.summary.json');
  mkdirSync(stagedRoot, { recursive: true });

  const commandResult = runCommand(
    'node',
    [
      distCliPath,
      '--output',
      'json',
      'host',
      'export',
      '--host',
      'github-copilot',
      '--mode',
      'project-local',
      '--copilot-target',
      'github-com-agent',
      '--output-dir',
      stagedRoot,
    ],
    'staged-export-blocked',
  );

  assertExpectedFailure(commandResult, 'staged-export-blocked', [
    RESERVED_TARGET,
    '阻断性校验问题',
  ]);

  const manifest = readJsonFile(manifestPath, 'reserved target export manifest');
  const verificationSummary = readJsonFile(
    verificationSummaryPath,
    'reserved target verification summary',
  );
  const stagedRelativePaths = collectRelativeFilePaths(stagedRoot);
  const requiredPaths = checkRequiredPaths(stagedRelativePaths);
  const checkSummary = summarizeChecks(verificationSummary);

  if (manifest.target !== RESERVED_TARGET) {
    throw new Error(`staged-export-blocked wrote unexpected target "${String(manifest.target)}".`);
  }

  if (verificationSummary.status !== 'fail') {
    throw new Error(
      `staged-export-blocked expected verification summary status "fail" but received "${String(verificationSummary.status)}".`,
    );
  }

  if (!checkSummary.blockingCheckIds.includes('target-capability')) {
    throw new Error('staged-export-blocked expected target-capability to remain blocking.');
  }

  if (!checkSummary.warningCheckIds.includes('mode-support')) {
    throw new Error('staged-export-blocked expected mode-support to remain a warning.');
  }

  if (requiredPaths.some((entry) => !entry.matched)) {
    throw new Error('staged-export-blocked missed one or more required reserved-target paths.');
  }

  return {
    id: 'staged-export-blocked',
    description:
      'Reserved target export keeps schema-safe staged assets but still exits non-zero because verification remains blocking.',
    command: [
      'node',
      DIST_CLI_ENTRY_PATH,
      '--output',
      'json',
      'host',
      'export',
      '--host',
      'github-copilot',
      '--mode',
      'project-local',
      '--copilot-target',
      'github-com-agent',
      '--output-dir',
      stagedRoot,
    ],
    expectedExitCode: 1,
    actualExitCode: commandResult.status,
    cliPayload: commandResult.payload,
    stagedRoot,
    manifestPath,
    verificationSummaryPath,
    stagedRelativePaths,
    requiredPaths,
    manifest,
    verificationSummary,
    checkSummary,
  };
}

/**
 * Runs one expected-rejection scenario that should not materialize a target root.
 * @param {string} distCliPath Absolute dist CLI path.
 * @param {string} workingRoot Absolute working root.
 * @returns {Record<string, unknown>}
 */
function runApplyRejectedScenario(distCliPath, workingRoot) {
  const stagedRoot = resolve(workingRoot, 'apply-rejected');
  const applyRoot = resolve(workingRoot, 'applied', 'github-com-agent');
  const commandResult = runCommand(
    'node',
    [
      distCliPath,
      '--output',
      'json',
      'host',
      'export',
      '--host',
      'github-copilot',
      '--mode',
      'project-local',
      '--copilot-target',
      'github-com-agent',
      '--output-dir',
      stagedRoot,
      '--apply-to-repo',
      applyRoot,
    ],
    'apply-rejected',
  );

  assertExpectedFailure(commandResult, 'apply-rejected', [RESERVED_TARGET, '--apply-to-repo']);

  if (existsSync(applyRoot)) {
    throw new Error('apply-rejected unexpectedly materialized an applied repository root.');
  }

  return {
    id: 'apply-rejected',
    description:
      'Reserved target still rejects --apply-to-repo before any host-local write occurs.',
    command: [
      'node',
      DIST_CLI_ENTRY_PATH,
      '--output',
      'json',
      'host',
      'export',
      '--host',
      'github-copilot',
      '--mode',
      'project-local',
      '--copilot-target',
      'github-com-agent',
      '--output-dir',
      stagedRoot,
      '--apply-to-repo',
      applyRoot,
    ],
    expectedExitCode: 1,
    actualExitCode: commandResult.status,
    cliPayload: commandResult.payload,
    appliedRootExists: existsSync(applyRoot),
  };
}

/**
 * Re-runs verify against the staged manifest and confirms the blocking state remains.
 * @param {string} distCliPath Absolute dist CLI path.
 * @param {string} manifestPath Absolute manifest path from the staged export scenario.
 * @param {string} verificationSummaryPath Absolute verification summary path.
 * @returns {Record<string, unknown>}
 */
function runVerifyBlockedScenario(distCliPath, manifestPath, verificationSummaryPath) {
  // Force host verify to regenerate its own summary so this scenario cannot pass on stale export output.
  rmSync(verificationSummaryPath, {
    force: true,
  });

  const commandResult = runCommand(
    'node',
    [distCliPath, '--output', 'json', 'host', 'verify', '--manifest', manifestPath],
    'verify-blocked',
  );

  assertExpectedFailure(commandResult, 'verify-blocked', [RESERVED_TARGET, '阻断性校验问题']);

  const verificationSummary = readJsonFile(
    verificationSummaryPath,
    'reserved target verification summary after verify',
  );
  const checkSummary = summarizeChecks(verificationSummary);

  if (verificationSummary.status !== 'fail') {
    throw new Error(
      `verify-blocked expected verification summary status "fail" but received "${String(verificationSummary.status)}".`,
    );
  }

  if (!checkSummary.blockingCheckIds.includes('target-capability')) {
    throw new Error('verify-blocked expected target-capability to remain blocking.');
  }

  return {
    id: 'verify-blocked',
    description:
      'Reserved target verify stays fail-closed when replayed against the staged manifest.',
    command: [
      'node',
      DIST_CLI_ENTRY_PATH,
      '--output',
      'json',
      'host',
      'verify',
      '--manifest',
      manifestPath,
    ],
    expectedExitCode: 1,
    actualExitCode: commandResult.status,
    cliPayload: commandResult.payload,
    verificationSummaryPath,
    verificationSummary,
    checkSummary,
  };
}

/**
 * Confirms bundle packaging remains blocked for the reserved target.
 * @param {string} distCliPath Absolute dist CLI path.
 * @param {string} workingRoot Absolute working root.
 * @returns {Record<string, unknown>}
 */
function runPackRejectedScenario(distCliPath, workingRoot) {
  const stagedRoot = resolve(workingRoot, 'pack-rejected');
  const bundleRoot = resolve(workingRoot, 'bundles', 'github-com-agent');
  const commandResult = runCommand(
    'node',
    [
      distCliPath,
      '--output',
      'json',
      'host',
      'pack',
      '--host',
      'github-copilot',
      '--mode',
      'plugin-bundle',
      '--copilot-target',
      'github-com-agent',
      '--output-dir',
      stagedRoot,
      '--bundle-dir',
      bundleRoot,
    ],
    'pack-rejected',
  );

  assertExpectedFailure(commandResult, 'pack-rejected', [RESERVED_TARGET, 'bundle packaging']);

  if (existsSync(bundleRoot)) {
    throw new Error('pack-rejected unexpectedly materialized a bundle root.');
  }

  return {
    id: 'pack-rejected',
    description: 'Reserved target still rejects bundle packaging for GitHub.com agent follow-up.',
    command: [
      'node',
      DIST_CLI_ENTRY_PATH,
      '--output',
      'json',
      'host',
      'pack',
      '--host',
      'github-copilot',
      '--mode',
      'plugin-bundle',
      '--copilot-target',
      'github-com-agent',
      '--output-dir',
      stagedRoot,
      '--bundle-dir',
      bundleRoot,
    ],
    expectedExitCode: 1,
    actualExitCode: commandResult.status,
    cliPayload: commandResult.payload,
    bundleRootExists: existsSync(bundleRoot),
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
      'validating github-com-agent reserved-target fail-closed semantics from a built source checkout',
    );

    const stagedExportScenario = runStagedExportScenario(distCliPath, absoluteWorkingRoot);
    const applyRejectedScenario = runApplyRejectedScenario(distCliPath, absoluteWorkingRoot);
    const verifyBlockedScenario = runVerifyBlockedScenario(
      distCliPath,
      /** @type {string} */ (stagedExportScenario.manifestPath),
      /** @type {string} */ (stagedExportScenario.verificationSummaryPath),
    );
    const packRejectedScenario = runPackRejectedScenario(distCliPath, absoluteWorkingRoot);

    const report = {
      status: 'pass',
      generatedAt: new Date().toISOString(),
      repositoryRoot,
      distCliEntryPath: distCliPath,
      workingRoot: absoluteWorkingRoot,
      outputPath: absoluteOutputPath,
      relatedDocs: RELATED_DOCS.map((relativePath) => resolve(repositoryRoot, relativePath)),
      reservedTargetContract: {
        target: RESERVED_TARGET,
        supportedModes: /** @type {{ targetCapabilities?: Record<string, unknown> }} */ (
          stagedExportScenario.manifest
        ).targetCapabilities?.supportedModes,
        supportedDiscoveryStates: /** @type {{ targetCapabilities?: Record<string, unknown> }} */ (
          stagedExportScenario.manifest
        ).targetCapabilities?.supportedDiscoveryStates,
        supportsApplyToRepo: /** @type {{ targetCapabilities?: Record<string, unknown> }} */ (
          stagedExportScenario.manifest
        ).targetCapabilities?.supportsApplyToRepo,
        supportsBundlePackaging: /** @type {{ targetCapabilities?: Record<string, unknown> }} */ (
          stagedExportScenario.manifest
        ).targetCapabilities?.supportsBundlePackaging,
        isMvpTarget: /** @type {{ targetCapabilities?: Record<string, unknown> }} */ (
          stagedExportScenario.manifest
        ).targetCapabilities?.isMvpTarget,
      },
      scenarios: [
        stagedExportScenario,
        applyRejectedScenario,
        verifyBlockedScenario,
        packRejectedScenario,
      ],
      summary: {
        scenarioCount: 4,
        allExpectedFailuresObserved: true,
        stagedProjectedFileCount: /** @type {{ stagedRelativePaths?: string[] }} */ (
          stagedExportScenario
        ).stagedRelativePaths?.length,
        blockingCheckIds: /** @type {{ checkSummary?: { blockingCheckIds?: string[] } }} */ (
          stagedExportScenario
        ).checkSummary?.blockingCheckIds,
        warningCheckIds: /** @type {{ checkSummary?: { warningCheckIds?: string[] } }} */ (
          stagedExportScenario
        ).checkSummary?.warningCheckIds,
      },
    };

    writeFileSync(absoluteOutputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    gatePass(
      GATE_NAME,
      `validated github-com-agent reserved-target fail-closed semantics. report=${absoluteOutputPath}`,
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
