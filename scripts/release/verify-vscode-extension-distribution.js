#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';
import { packageVscodeExtensionDistribution } from './pack-vscode-extension.js';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const GATE_NAME = 'release-verify-vscode-extension-distribution';
const DEFAULT_REPORT_PATH = resolve(
  PROJECT_ROOT,
  '.tmp/release-vscode-extension-distribution-report.json',
);
const REQUIRED_ARCHIVE_ENTRIES = [
  'extension/package.json',
  'extension/package.nls.json',
  'extension/package.nls.zh-cn.json',
  'extension/readme.md',
  'extension/resources/governor.svg',
  'extension/dist/src/extension.js',
  'extension/dist/src/index.js',
  'extension/node_modules/@repo-ai-governor/core-orchestration-service/package.json',
  'extension/node_modules/@repo-ai-governor/orchestration-service-client/package.json',
  'extension/node_modules/@repo-ai-governor/shared/package.json',
  'extension/node_modules/i18next/package.json',
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
    const report = {
      status: 'pass',
      vsixPath: packReport.vsixPath,
      packageRoot: packReport.packageRoot,
      archiveEntriesChecked: REQUIRED_ARCHIVE_ENTRIES,
      moduleSmoke,
    };

    writeReport(options.outputPath, report);
    gateInfo(GATE_NAME, `verified packaged VSIX at ${packReport.vsixPath}`);
    gatePass(
      GATE_NAME,
      `validated local VSIX archive and packaged extension root. report=${options.outputPath}`,
    );
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    gateFail(GATE_NAME, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

void main();
