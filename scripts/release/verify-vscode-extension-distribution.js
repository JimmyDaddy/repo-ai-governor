#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { OrchestrationServiceLifecycleStatus } from '../../packages/orchestration-service-client/dist/src/constants/orchestration-service.constant.js';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';
import { packageVscodeExtensionDistribution } from './pack-vscode-extension.js';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const GATE_NAME = 'release-verify-vscode-extension-distribution';
const DEFAULT_REPORT_PATH = resolve(
  PROJECT_ROOT,
  '.tmp/release-vscode-extension-distribution-report.json',
);
const VSIX_EXTRACT_ROOT_NAME = 'vsix-extracted';
const REQUIRED_ARCHIVE_ENTRIES = [
  'extension/package.json',
  'extension/package.nls.json',
  'extension/package.nls.zh-cn.json',
  'extension/readme.md',
  'extension/resources/governor.svg',
  'extension/dist/src/extension.js',
  'extension/dist/src/index.js',
  'extension/node_modules/.modules.yaml',
  'extension/node_modules/.pnpm/lock.yaml',
  'extension/node_modules/@repo-ai-governor/cli/package.json',
  'extension/node_modules/@repo-ai-governor/config/package.json',
];
const ALLOWED_SYMLINK_SEGMENTS = [
  '/node_modules/.bin/',
  '/node_modules/@langchain/core/node_modules/.bin/',
  '/node_modules/@langchain/langgraph-sdk/node_modules/.bin/',
];

/**
 * Resolves one isolated scratch workspace root for CLI-backed packaged smoke runs.
 * This keeps release verification from mutating the maintainer's live workspace truth surfaces.
 * @param {string} workingRoot Absolute packaging working root.
 * @param {string} smokeId Human-readable smoke lane label.
 * @returns {string}
 */
export function resolveCliBackedSmokeWorkspaceRoot(workingRoot, smokeId) {
  const normalizedSmokeId = smokeId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  return resolve(
    workingRoot,
    'cli-backed-smoke-workspaces',
    normalizedSmokeId.length > 0 ? normalizedSmokeId : 'default',
  );
}

/**
 * Checks whether one candidate path stays inside the declared parent root.
 * @param {string} parentRoot Absolute parent root.
 * @param {string} candidatePath Candidate path to validate.
 * @returns {boolean}
 */
function isPathInside(parentRoot, candidatePath) {
  const relativePath = relative(resolve(parentRoot), resolve(candidatePath));
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

/**
 * Reads one `key=value` entry from layered log lines.
 * @param {string[] | undefined} logLines Candidate layered log lines.
 * @param {string} key Key prefix to match.
 * @returns {string | null}
 */
function readLayeredLogValue(logLines, key) {
  if (!Array.isArray(logLines)) {
    return null;
  }

  const prefix = `${key}=`;
  const matchedLine = logLines.find((line) => typeof line === 'string' && line.startsWith(prefix));
  if (!matchedLine) {
    return null;
  }

  const value = matchedLine.slice(prefix.length).trim();
  return value.length > 0 ? value : null;
}

/**
 * Parses CLI options for packaged-extension verification.
 * @returns {{outputPath: string; workingRoot: string | undefined}}
 */
function parseCliOptions() {
  const args = process.argv.slice(2);
  let outputPath = DEFAULT_REPORT_PATH;
  let workingRoot;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--output') {
      const candidatePath = args[index + 1]?.trim();
      if (!candidatePath) {
        throw new Error('Expected a non-empty value after "--output".');
      }
      outputPath = resolve(PROJECT_ROOT, candidatePath);
      index += 1;
      continue;
    }

    if (arg === '--working-root') {
      const candidatePath = args[index + 1]?.trim();
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
 * Writes one JSON report to disk.
 * @param {string} outputPath Output file path.
 * @param {Record<string, unknown>} payload Report payload.
 */
function writeReport(outputPath, payload) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

/**
 * Lists archive entries from one VSIX file.
 * @param {string} vsixPath Absolute VSIX path.
 * @returns {string[]}
 */
function listArchiveEntries(vsixPath) {
  const result = spawnSync('unzip', ['-Z1', vsixPath], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw new Error(`unzip failed to execute: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`unzip failed (exit=${result.status}) stderr="${result.stderr.trim()}"`);
  }

  return result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Creates a minimal runtime stub for the editor-host-provided `vscode` module.
 * @param {string} packageRoot Absolute packaged extension root.
 * @returns {string}
 */
function installVscodeStub(packageRoot) {
  const stubRoot = resolve(packageRoot, 'node_modules/vscode');
  mkdirSync(stubRoot, { recursive: true });
  writeFileSync(
    resolve(stubRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: 'vscode',
        version: '0.0.0-smoke',
        type: 'module',
        exports: './index.js',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    resolve(stubRoot, 'index.js'),
    [
      'const noop = () => undefined;',
      'export const workspace = {};',
      'export const window = {};',
      'export const commands = { executeCommand: noop, registerCommand: noop };',
      'export const languages = { registerCodeActionsProvider: noop };',
      'export const Uri = { joinPath: () => ({}) };',
      'export const CodeActionKind = { QuickFix: {} };',
      'export default { workspace, window, commands, languages, Uri, CodeActionKind };',
      '',
    ].join('\n'),
    'utf8',
  );
  return stubRoot;
}

/**
 * Executes a module-resolution smoke against the packaged extension root.
 * @param {string} packageRoot Absolute packaged extension root.
 * @returns {Promise<{mainEntry: string; exportEntry: string}>}
 */
async function runPackagedModuleSmoke(packageRoot) {
  const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
  const stubRoot = installVscodeStub(packageRoot);

  try {
    const mainEntry = resolve(packageRoot, manifest.main);
    const exportEntry = resolve(packageRoot, manifest.exports['.'].default);
    const mainModule = await import(`${pathToFileURL(mainEntry).href}?smoke=${Date.now()}`);
    const exportModule = await import(`${pathToFileURL(exportEntry).href}?smoke=${Date.now() + 1}`);

    if (typeof mainModule.activate !== 'function' || typeof mainModule.deactivate !== 'function') {
      throw new Error(
        'Packaged extension main entry did not expose activate/deactivate functions.',
      );
    }

    if (typeof exportModule.VsCodeExtensionContract !== 'function') {
      throw new Error('Packaged extension export entry did not expose VsCodeExtensionContract.');
    }

    return {
      mainEntry,
      exportEntry,
    };
  } finally {
    rmSync(stubRoot, { recursive: true, force: true });
  }
}

/**
 * Executes one real sidecar health + queue-overview smoke against a packaged extension root.
 * @param {string} packageRoot Absolute packaged extension root.
 * @returns {Promise<{serviceLifecycle: string; queueGeneratedAt: string}>}
 */
async function runPackagedSidecarSmoke(packageRoot) {
  const clientModulePath = resolve(
    packageRoot,
    'node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-sidecar-client.js',
  );
  const clientModule = await import(`${pathToFileURL(clientModulePath).href}?smoke=${Date.now()}`);
  const client = new clientModule.LocalOrchestrationServiceSidecarClient(PROJECT_ROOT, {
    repositoryRoot: PROJECT_ROOT,
  });

  try {
    const health = await client.getHealth();
    const queueOverview = await client.queryQueueOverview({
      limit: 1,
      laneLimit: 1,
      workspaceLimit: 1,
    });
    return {
      serviceLifecycle: health.lifecycleStatus,
      queueGeneratedAt: queueOverview.generatedAt,
    };
  } finally {
    await client.dispose().catch(() => undefined);
  }
}

/**
 * Executes one packaged secure-authoring + doctor smoke so CLI-backed runtime seams stay truthful.
 * Any temporary workspace-operation snapshot written during the smoke is restored afterwards.
 * @param {string} packageRoot Absolute packaged extension root.
 * @param {string} workingRoot Absolute packaging working root.
 * @param {string} smokeId Human-readable smoke lane label.
 * @returns {Promise<{smokeWorkspaceRoot: string; secureAuthoringDegradedReason: string | null; doctorOperation: string; doctorSummary: string; doctorDiagnosticsPath: string | null; resolvedWorkspaceRoot: string | null; doctorCheckTotals?: {pass?: number; warn?: number; fail?: number}}>}
 */
async function runPackagedCliBackedSmoke(packageRoot, workingRoot, smokeId) {
  const workspaceOpsModulePath = resolve(
    packageRoot,
    'node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-workspace-ops-runtime.js',
  );
  const workspaceOpsModule = await import(
    `${pathToFileURL(workspaceOpsModulePath).href}?smoke=${Date.now()}`
  );
  const smokeWorkspaceRoot = resolveCliBackedSmokeWorkspaceRoot(workingRoot, smokeId);
  rmSync(smokeWorkspaceRoot, { recursive: true, force: true });
  mkdirSync(smokeWorkspaceRoot, { recursive: true });
  const runtime = new workspaceOpsModule.LocalOrchestrationServiceWorkspaceOpsRuntime({
    workspaceRoot: smokeWorkspaceRoot,
    repositoryRoot: PROJECT_ROOT,
  });

  const secureAuthoring = await runtime.querySecureAuthoring({
    locale: 'en-US',
  });
  const doctorResponse = await runtime.runWorkspaceOperation({
    operationKind: 'doctor',
    locale: 'en-US',
  });
  return {
    smokeWorkspaceRoot,
    secureAuthoringDegradedReason: secureAuthoring.degradedReason ?? null,
    doctorOperation: doctorResponse.result.operation,
    doctorSummary: doctorResponse.result.summary,
    doctorDiagnosticsPath:
      doctorResponse.result.artifacts?.find((artifact) => artifact.id === 'doctor_diagnostics')
        ?.path ?? null,
    resolvedWorkspaceRoot:
      readLayeredLogValue(doctorResponse.result.layeredLogs?.detailed, 'workspace_root') ?? null,
    ...(doctorResponse.result.checkTotals
      ? {
          doctorCheckTotals: doctorResponse.result.checkTotals,
        }
      : {}),
  };
}

/**
 * Enforces the release-evidence contract for one packaged sidecar smoke path.
 * @param {string} smokeLabel Human-readable packaged path label.
 * @param {{serviceLifecycle: string; queueGeneratedAt: string}} sidecarSmoke Recorded smoke result.
 * @returns {{serviceLifecycle: string; queueGeneratedAt: string}}
 */
export function assertReadySidecarSmoke(smokeLabel, sidecarSmoke) {
  if (sidecarSmoke.serviceLifecycle !== OrchestrationServiceLifecycleStatus.READY) {
    throw new Error(
      `${smokeLabel} sidecar smoke must report lifecycle "${OrchestrationServiceLifecycleStatus.READY}" before distribution verification can pass (received "${sidecarSmoke.serviceLifecycle}")`,
    );
  }

  return sidecarSmoke;
}

/**
 * Enforces the supported release-evidence contract for one packaged CLI-backed smoke path.
 *
 * Why this exists:
 * the packaging gate proves executable secure-authoring plus scratch-isolated doctor diagnostics
 * capture for the packaged root and extracted VSIX views. The recorded doctor check totals remain
 * truth-carrying evidence and may still contain non-blocking warnings under the current contract.
 *
 * @param {string} smokeLabel Human-readable packaged path label.
 * @param {{smokeWorkspaceRoot: string; secureAuthoringDegradedReason: string | null; doctorOperation: string; doctorSummary: string; doctorDiagnosticsPath: string | null; resolvedWorkspaceRoot: string | null; doctorCheckTotals?: {pass?: number; warn?: number; fail?: number}}} cliBackedSmoke Recorded smoke result.
 * @returns {{smokeWorkspaceRoot: string; secureAuthoringDegradedReason: string | null; doctorOperation: string; doctorSummary: string; doctorDiagnosticsPath: string | null; resolvedWorkspaceRoot: string | null; doctorCheckTotals?: {pass?: number; warn?: number; fail?: number}}}
 */
export function assertSupportedCliBackedSmoke(smokeLabel, cliBackedSmoke) {
  if (
    typeof cliBackedSmoke.secureAuthoringDegradedReason === 'string' &&
    cliBackedSmoke.secureAuthoringDegradedReason.trim().length > 0
  ) {
    throw new Error(
      `${smokeLabel} secure-authoring smoke must not degrade before distribution verification can pass (received "${cliBackedSmoke.secureAuthoringDegradedReason}")`,
    );
  }

  if (cliBackedSmoke.doctorOperation !== 'env_doctor') {
    throw new Error(
      `${smokeLabel} doctor smoke must report operation "env_doctor" before distribution verification can pass (received "${cliBackedSmoke.doctorOperation}")`,
    );
  }

  if (
    typeof cliBackedSmoke.doctorSummary !== 'string' ||
    cliBackedSmoke.doctorSummary.trim().length === 0
  ) {
    throw new Error(
      `${smokeLabel} doctor smoke must return a non-empty summary before distribution verification can pass.`,
    );
  }

  if (
    typeof cliBackedSmoke.smokeWorkspaceRoot !== 'string' ||
    cliBackedSmoke.smokeWorkspaceRoot.trim().length === 0
  ) {
    throw new Error(
      `${smokeLabel} doctor smoke must declare the scratch workspace root before distribution verification can pass.`,
    );
  }

  if (
    typeof cliBackedSmoke.resolvedWorkspaceRoot !== 'string' ||
    cliBackedSmoke.resolvedWorkspaceRoot.trim().length === 0
  ) {
    throw new Error(
      `${smokeLabel} doctor smoke must report the effective workspace_root before distribution verification can pass.`,
    );
  }

  if (
    resolve(cliBackedSmoke.smokeWorkspaceRoot) !== resolve(cliBackedSmoke.resolvedWorkspaceRoot)
  ) {
    throw new Error(
      `${smokeLabel} doctor smoke must resolve workspace_root to "${cliBackedSmoke.smokeWorkspaceRoot}" (received "${cliBackedSmoke.resolvedWorkspaceRoot}")`,
    );
  }

  if (
    typeof cliBackedSmoke.doctorDiagnosticsPath !== 'string' ||
    cliBackedSmoke.doctorDiagnosticsPath.trim().length === 0
  ) {
    throw new Error(
      `${smokeLabel} doctor smoke must report the diagnostics artifact path before distribution verification can pass.`,
    );
  }

  const expectedDiagnosticsRoot = resolve(
    cliBackedSmoke.smokeWorkspaceRoot,
    'context',
    'diagnostics',
    'doctor',
  );
  if (!isPathInside(expectedDiagnosticsRoot, cliBackedSmoke.doctorDiagnosticsPath)) {
    throw new Error(
      `${smokeLabel} doctor smoke must keep diagnostics inside "${expectedDiagnosticsRoot}" (received "${cliBackedSmoke.doctorDiagnosticsPath}")`,
    );
  }

  return cliBackedSmoke;
}

/**
 * Extracts one VSIX into a temp directory and returns the unpacked extension root.
 * @param {string} vsixPath Absolute VSIX path.
 * @param {string} workingRoot Absolute packaging working root.
 * @returns {string}
 */
export function extractVsix(vsixPath, workingRoot) {
  const extractRoot = resolve(workingRoot, VSIX_EXTRACT_ROOT_NAME);
  rmSync(extractRoot, { recursive: true, force: true });
  mkdirSync(extractRoot, { recursive: true });

  const result = spawnSync('unzip', ['-q', vsixPath, '-d', extractRoot], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw new Error(`unzip failed to execute: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`unzip failed (exit=${result.status}) stderr="${result.stderr.trim()}"`);
  }

  return resolve(extractRoot, 'extension');
}

/**
 * Collects packaged symlink paths so verification can block runtime-relevant symlink payload.
 * @param {string} rootPath Absolute root to inspect.
 * @returns {string[]}
 */
function collectSymbolicLinks(rootPath) {
  const pendingDirectories = [rootPath];
  const symbolicLinks = [];

  while (pendingDirectories.length > 0) {
    const currentDirectoryPath = pendingDirectories.pop();
    if (!currentDirectoryPath || !existsSync(currentDirectoryPath)) {
      continue;
    }

    for (const entry of readdirSync(currentDirectoryPath, { withFileTypes: true })) {
      const entryPath = resolve(currentDirectoryPath, entry.name);
      const entryStat = lstatSync(entryPath);

      if (entryStat.isSymbolicLink()) {
        symbolicLinks.push(entryPath);
        continue;
      }

      if (entry.isDirectory()) {
        pendingDirectories.push(entryPath);
      }
    }
  }

  return symbolicLinks.sort();
}

/**
 * Ensures packaged runtime payload does not rely on install-time-unsafe symlinks.
 * @param {string} rootPath Absolute root to inspect.
 * @returns {string[]}
 */
export function verifySymlinkPayload(rootPath) {
  const symbolicLinks = collectSymbolicLinks(rootPath);
  const disallowedSymbolicLinks = symbolicLinks.filter(
    (symbolicLinkPath) =>
      !ALLOWED_SYMLINK_SEGMENTS.some((allowedSegment) => symbolicLinkPath.includes(allowedSegment)),
  );

  if (disallowedSymbolicLinks.length > 0) {
    throw new Error(
      `Packaged extension contains install-unsafe symlinks: ${disallowedSymbolicLinks.join(', ')}`,
    );
  }

  return symbolicLinks;
}

async function main() {
  try {
    const options = parseCliOptions();
    const packReport = packageVscodeExtensionDistribution({
      workingRoot: options.workingRoot,
    });

    if (!existsSync(packReport.vsixPath)) {
      throw new Error(`Packaged VSIX is missing: ${packReport.vsixPath}`);
    }

    const archiveEntries = listArchiveEntries(packReport.vsixPath);
    for (const requiredEntry of REQUIRED_ARCHIVE_ENTRIES) {
      if (!archiveEntries.includes(requiredEntry)) {
        throw new Error(`VSIX archive is missing required entry: ${requiredEntry}`);
      }
    }

    const moduleSmoke = await runPackagedModuleSmoke(packReport.packageRoot);
    const packageSidecarSmoke = assertReadySidecarSmoke(
      'packaged root',
      await runPackagedSidecarSmoke(packReport.packageRoot),
    );
    const packageCliBackedSmoke = assertSupportedCliBackedSmoke(
      'packaged root',
      await runPackagedCliBackedSmoke(
        packReport.packageRoot,
        packReport.workingRoot,
        'packaged-root',
      ),
    );
    const packageSymlinks = verifySymlinkPayload(packReport.packageRoot);
    const extractedExtensionRoot = extractVsix(packReport.vsixPath, packReport.workingRoot);
    const extractedSymlinks = verifySymlinkPayload(extractedExtensionRoot);
    const installedModuleSmoke = await runPackagedModuleSmoke(extractedExtensionRoot);
    const installedSidecarSmoke = assertReadySidecarSmoke(
      'extracted VSIX',
      await runPackagedSidecarSmoke(extractedExtensionRoot),
    );
    const installedCliBackedSmoke = assertSupportedCliBackedSmoke(
      'extracted VSIX',
      await runPackagedCliBackedSmoke(
        extractedExtensionRoot,
        packReport.workingRoot,
        'installed-vsix',
      ),
    );

    const report = {
      status: 'pass',
      vsixPath: packReport.vsixPath,
      packageRoot: packReport.packageRoot,
      archiveEntriesChecked: REQUIRED_ARCHIVE_ENTRIES,
      packageSymlinks,
      moduleSmoke,
      packageSidecarSmoke,
      packageCliBackedSmoke,
      extractedExtensionRoot,
      extractedSymlinks,
      installedModuleSmoke,
      installedSidecarSmoke,
      installedCliBackedSmoke,
    };

    writeReport(options.outputPath, report);
    gateInfo(GATE_NAME, `verified packaged VSIX at ${packReport.vsixPath}`);
    gatePass(
      GATE_NAME,
      `validated local VSIX archive and packaged extension root. report=${options.outputPath}`,
    );
    console.info(JSON.stringify(report, null, 2));
  } catch (error) {
    gateFail(GATE_NAME, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
