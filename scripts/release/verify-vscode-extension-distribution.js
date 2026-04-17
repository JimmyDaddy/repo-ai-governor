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
import { dirname, resolve } from 'node:path';
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
];
const ALLOWED_SYMLINK_SEGMENTS = [
  '/node_modules/.bin/',
  '/node_modules/@langchain/core/node_modules/.bin/',
  '/node_modules/@langchain/langgraph-sdk/node_modules/.bin/',
];

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
    const packageSymlinks = verifySymlinkPayload(packReport.packageRoot);
    const extractedExtensionRoot = extractVsix(packReport.vsixPath, packReport.workingRoot);
    const extractedSymlinks = verifySymlinkPayload(extractedExtensionRoot);
    const installedModuleSmoke = await runPackagedModuleSmoke(extractedExtensionRoot);
    const installedSidecarSmoke = assertReadySidecarSmoke(
      'extracted VSIX',
      await runPackagedSidecarSmoke(extractedExtensionRoot),
    );

    const report = {
      status: 'pass',
      vsixPath: packReport.vsixPath,
      packageRoot: packReport.packageRoot,
      archiveEntriesChecked: REQUIRED_ARCHIVE_ENTRIES,
      packageSymlinks,
      moduleSmoke,
      packageSidecarSmoke,
      extractedExtensionRoot,
      extractedSymlinks,
      installedModuleSmoke,
      installedSidecarSmoke,
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
