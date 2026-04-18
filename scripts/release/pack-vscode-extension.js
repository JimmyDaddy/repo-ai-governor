#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const GATE_NAME = 'release-pack-vscode-extension';
const APP_MANIFEST_PATH = resolve(PROJECT_ROOT, 'apps/vscode-extension/package.json');
const APP_DIST_ENTRY_PATH = resolve(PROJECT_ROOT, 'apps/vscode-extension/dist/src/extension.js');
const VSCE_BINARY_PATH = resolve(PROJECT_ROOT, 'node_modules/.bin/vsce');
const SAFE_WORKING_ROOT_BASE = resolve(PROJECT_ROOT, '.tmp/release-vscode-extension-package');
const DEPLOY_ROOT_NAME = 'deployed-extension';
const PACKAGE_ROOT_NAME = 'packaged-extension';
const VSIX_STAGE_ROOT_NAME = 'vsix-stage';
const REQUIRED_PACKAGED_PATHS = [
  'package.json',
  'package.nls.json',
  'package.nls.zh-cn.json',
  'README.md',
  'resources/governor.svg',
  'dist/src/extension.js',
  'dist/src/index.js',
  'src/index.ts',
  'node_modules/.modules.yaml',
  'node_modules/@repo-ai-governor/cli/package.json',
  'node_modules/@repo-ai-governor/config/package.json',
  'node_modules/@repo-ai-governor/core-orchestration-service/package.json',
  'node_modules/@repo-ai-governor/orchestration-service-client/package.json',
  'node_modules/@repo-ai-governor/shared/package.json',
  'node_modules/@repo-ai-governor/core-runtime-langgraph/package.json',
  'node_modules/@repo-ai-governor/core-memory/package.json',
  'node_modules/@repo-ai-governor/core-session/package.json',
  'node_modules/@repo-ai-governor/memory-provider-registry/package.json',
  'node_modules/@repo-ai-governor/memory-store-adapter/package.json',
  'node_modules/@repo-ai-governor/artifact-registry/package.json',
  'node_modules/i18next/package.json',
];
const PNPM_DEPLOY_ARGS = [
  '--config.inject-workspace-packages=true',
  '--config.node-linker=hoisted',
];

/**
 * Reads and normalizes the VS Code extension manifest.
 * @returns {{name: string; publisher: string; version: string; main: string; exports?: {'.'?: {default?: string}}}}
 */
function readExtensionManifest() {
  return JSON.parse(readFileSync(APP_MANIFEST_PATH, 'utf8'));
}

/**
 * Parses CLI options for local VSIX packaging.
 * @returns {{outputPath: string | null; reportPath: string | null; workingRoot: string}}
 */
function parseCliOptions() {
  const args = process.argv.slice(2);
  let outputPath = null;
  let reportPath = null;
  let workingRoot = SAFE_WORKING_ROOT_BASE;

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
      outputPath = candidatePath;
      index += 1;
      continue;
    }

    if (arg === '--report') {
      const candidatePath = args[index + 1]?.trim();
      if (!candidatePath) {
        throw new Error('Expected a non-empty value after "--report".');
      }
      reportPath = candidatePath;
      index += 1;
      continue;
    }

    if (arg === '--working-root') {
      const candidatePath = args[index + 1]?.trim();
      if (!candidatePath) {
        throw new Error('Expected a non-empty value after "--working-root".');
      }
      workingRoot = resolve(PROJECT_ROOT, candidatePath);
      index += 1;
      continue;
    }

    throw new Error(`Unsupported option: ${arg}`);
  }

  return {
    outputPath,
    reportPath,
    workingRoot,
  };
}

/**
 * Ensures the pack working root stays inside the dedicated temp subtree.
 * @param {string} workingRoot Absolute working-root candidate.
 */
function assertSafeWorkingRoot(workingRoot) {
  const tmpRoot = resolve(PROJECT_ROOT, '.tmp');
  if (workingRoot === PROJECT_ROOT || !workingRoot.startsWith(`${tmpRoot}/`)) {
    throw new Error(
      `Unsafe --working-root path: ${workingRoot}. Expected a path under ${SAFE_WORKING_ROOT_BASE}`,
    );
  }
}

/**
 * Ensures one required build/runtime artifact exists before packaging.
 * @param {string} absolutePath Absolute artifact path.
 * @param {string} label Human-readable label.
 */
function assertArtifactExists(absolutePath, label) {
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing required ${label}: ${absolutePath}`);
  }
}

/**
 * Runs one child-process command and throws on failure.
 * @param {string} command Command binary.
 * @param {string[]} args Command arguments.
 * @param {{cwd?: string; env?: NodeJS.ProcessEnv; label: string}} options Command options.
 * @returns {{stdout: string; stderr: string}}
 */
function runCommand(command, args, options) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? PROJECT_ROOT,
    env: options.env ?? process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw new Error(`${options.label} failed to execute: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(
      `${options.label} failed (exit=${result.status}) stdout="${result.stdout.trim()}" stderr="${result.stderr.trim()}"`,
    );
  }

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

/**
 * Resolves the default VSIX output path for the current extension version.
 * @param {{name: string; publisher: string; version: string}} manifest Parsed extension manifest.
 * @param {string} workingRoot Absolute working root.
 * @returns {string}
 */
function resolveDefaultVsixPath(manifest, workingRoot) {
  return resolve(workingRoot, `${manifest.publisher}.${manifest.name}-${manifest.version}.vsix`);
}

/**
 * Copies the deployed extension root into a packaged root.
 * @param {string} deployedRoot Absolute deployed-root path.
 * @param {string} packageRoot Absolute packaged-root path.
 */
function materializePackagedRoot(deployedRoot, packageRoot) {
  rmSync(packageRoot, { recursive: true, force: true });
  cpSync(deployedRoot, packageRoot, {
    recursive: true,
  });
}

/**
 * Removes packaged CLI shim directories because VS Code installations do not preserve symlink
 * entries reliably and the extension runtime never executes package-manager bin shims.
 * @param {string} packageRoot Absolute packaged-root path.
 */
function pruneNodeModulesBinDirectories(packageRoot) {
  const rootNodeModulesPath = resolve(packageRoot, 'node_modules');
  const pendingDirectories = [rootNodeModulesPath];

  while (pendingDirectories.length > 0) {
    const currentDirectoryPath = pendingDirectories.pop();
    if (!currentDirectoryPath || !existsSync(currentDirectoryPath)) {
      continue;
    }

    for (const entry of readdirSync(currentDirectoryPath, { withFileTypes: true })) {
      const entryPath = resolve(currentDirectoryPath, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === '.bin') {
          rmSync(entryPath, { recursive: true, force: true });
          continue;
        }

        pendingDirectories.push(entryPath);
      }
    }
  }
}

/**
 * Verifies the packaged extension root contains the minimum supported payload.
 * @param {string} packageRoot Absolute packaged-root path.
 */
function verifyPackagedRoot(packageRoot) {
  for (const relativePath of REQUIRED_PACKAGED_PATHS) {
    assertArtifactExists(
      resolve(packageRoot, relativePath),
      `packaged extension path ${relativePath}`,
    );
  }
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
 * Repackages the VSIX skeleton so the archive carries the full packaged runtime dependency tree.
 * @param {string} packageRoot Absolute packaged extension root.
 * @param {string} vsixPath Absolute VSIX path.
 * @param {string} workingRoot Absolute packaging working root.
 */
function repackVsixWithRuntimeDependencies(packageRoot, vsixPath, workingRoot) {
  const stageRoot = resolve(workingRoot, VSIX_STAGE_ROOT_NAME);
  const stageExtensionRoot = resolve(stageRoot, 'extension');

  rmSync(stageRoot, { recursive: true, force: true });
  mkdirSync(stageRoot, { recursive: true });

  runCommand('unzip', ['-q', vsixPath, '-d', stageRoot], {
    cwd: PROJECT_ROOT,
    label: 'unzip packaged VSIX',
  });
  rmSync(resolve(stageExtensionRoot, 'node_modules'), { recursive: true, force: true });
  cpSync(resolve(packageRoot, 'node_modules'), resolve(stageExtensionRoot, 'node_modules'), {
    recursive: true,
    verbatimSymlinks: true,
  });

  rmSync(vsixPath, { force: true });
  runCommand('zip', ['-y', '-q', '-r', vsixPath, '.'], {
    cwd: stageRoot,
    label: 'zip packaged VSIX',
  });
}

/**
 * Packages the VS Code extension from the built source checkout into one local VSIX plus unpacked root.
 * @param {{outputPath?: string | null; reportPath?: string | null; workingRoot?: string}} [options] Packaging options.
 * @returns {{
 *   status: 'pass';
 *   packageName: string;
 *   publisher: string;
 *   version: string;
 *   workingRoot: string;
 *   deployedRoot: string;
 *   packageRoot: string;
 *   vsixPath: string;
 *   packagedPaths: string[];
 * }}
 */
export function packageVscodeExtensionDistribution(options = {}) {
  const manifest = readExtensionManifest();
  const workingRoot = options.workingRoot
    ? resolve(PROJECT_ROOT, options.workingRoot)
    : SAFE_WORKING_ROOT_BASE;
  const vsixPath = resolve(
    PROJECT_ROOT,
    options.outputPath ?? resolveDefaultVsixPath(manifest, workingRoot),
  );
  const reportPath = options.reportPath ? resolve(PROJECT_ROOT, options.reportPath) : null;
  const deployedRoot = resolve(workingRoot, DEPLOY_ROOT_NAME);
  const packageRoot = resolve(workingRoot, PACKAGE_ROOT_NAME);

  assertSafeWorkingRoot(workingRoot);
  assertArtifactExists(APP_DIST_ENTRY_PATH, 'built VS Code extension entry');
  assertArtifactExists(VSCE_BINARY_PATH, 'vsce binary');

  rmSync(workingRoot, { recursive: true, force: true });
  mkdirSync(workingRoot, { recursive: true });
  rmSync(vsixPath, { force: true });

  runCommand(
    'pnpm',
    [...PNPM_DEPLOY_ARGS, '--filter', manifest.name, 'deploy', '--prod', deployedRoot],
    {
      cwd: PROJECT_ROOT,
      label: 'pnpm deploy',
    },
  );

  materializePackagedRoot(deployedRoot, packageRoot);
  pruneNodeModulesBinDirectories(packageRoot);
  verifyPackagedRoot(packageRoot);

  runCommand(
    VSCE_BINARY_PATH,
    [
      'package',
      '--out',
      vsixPath,
      '--no-yarn',
      '--no-dependencies',
      '--allow-missing-repository',
      '--allow-unused-files-pattern',
      '--skip-license',
    ],
    {
      cwd: packageRoot,
      label: 'vsce package',
    },
  );
  repackVsixWithRuntimeDependencies(packageRoot, vsixPath, workingRoot);

  const report = {
    status: 'pass',
    packageName: manifest.name,
    publisher: manifest.publisher,
    version: manifest.version,
    workingRoot,
    deployedRoot,
    packageRoot,
    vsixPath,
    packagedPaths: REQUIRED_PACKAGED_PATHS,
  };

  if (reportPath) {
    writeReport(reportPath, report);
  }

  return report;
}

async function main() {
  try {
    const options = parseCliOptions();
    const report = packageVscodeExtensionDistribution(options);
    gateInfo(
      GATE_NAME,
      `packaged ${report.publisher}.${report.packageName}@${report.version} -> ${report.vsixPath}`,
    );
    gatePass(GATE_NAME, `packaged local VSIX at ${report.vsixPath}`);
    console.info(JSON.stringify(report, null, 2));
  } catch (error) {
    gateFail(GATE_NAME, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  void main();
}
