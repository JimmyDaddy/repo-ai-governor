#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

const CLI_PACKAGE_NAME = '@repo-ai-governor/cli';
const DEFAULT_OUTPUT_DIRECTORY = '.tmp/npm-publish/cli';
const DIST_CLI_BIN_PATH = 'dist/bin/repo-ai-governor.js';
const ROOT_PACKAGE_JSON_PATH = 'package.json';
const STAGE_PACKAGE_JSON_PATH = 'package.json';
const STAGE_BIN_DIRECTORY = 'bin';
const STAGE_BIN_FILE_PATH = 'bin/repo-ai-governor.js';

/**
 * Parses the CLI options for the publish-preparation script.
 * @returns {{ outputDirectory: string }}
 */
function parseCliOptions() {
  const rawArgs = process.argv.slice(2);
  let outputDirectory = DEFAULT_OUTPUT_DIRECTORY;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const argument = rawArgs[index];

    if (argument === '--') {
      continue;
    }

    if (argument === '--output') {
      const candidateDirectory = rawArgs[index + 1]?.trim();
      if (!candidateDirectory) {
        throw new Error('Expected a non-empty value after "--output".');
      }
      outputDirectory = candidateDirectory;
      index += 1;
      continue;
    }

    throw new Error(`Unsupported option: ${argument}`);
  }

  return {
    outputDirectory,
  };
}

/**
 * Reads one JSON file from disk.
 * @template T
 * @param {string} filePath Absolute JSON file path.
 * @returns {T}
 */
function readJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

/**
 * Writes one JSON object to disk with trailing newline.
 * @param {string} filePath Absolute JSON file path.
 * @param {unknown} payload Serializable payload.
 */
function writeJsonFile(filePath, payload) {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

/**
 * Resolves the package manager executable for the current platform.
 * @returns {string}
 */
function resolvePnpmCommand() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

/**
 * Runs one command and throws when it fails.
 * @param {string} command Executable name.
 * @param {string[]} args CLI arguments.
 */
function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Command failed (${command} ${args.join(' ')}): exit=${String(result.status)}`);
  }
}

/**
 * Rewrites direct workspace dependency versions to concrete semver values from the deployed tree.
 * @param {Record<string, string> | undefined} dependencies Dependency manifest block.
 * @param {string} stageRoot Absolute staging root.
 * @returns {Record<string, string>}
 */
function resolvePublishableDependencies(dependencies, stageRoot) {
  const resolvedDependencies = {};
  const dependencyEntries = Object.entries(dependencies ?? {});

  for (const [dependencyName, dependencyVersion] of dependencyEntries) {
    if (!dependencyVersion.startsWith('workspace:')) {
      resolvedDependencies[dependencyName] = dependencyVersion;
      continue;
    }

    const dependencyPackageJsonPath = resolve(
      stageRoot,
      'node_modules',
      ...dependencyName.split('/'),
      'package.json',
    );
    if (!existsSync(dependencyPackageJsonPath)) {
      throw new Error(
        `Unable to resolve deployed version for workspace dependency "${dependencyName}" at ${dependencyPackageJsonPath}.`,
      );
    }

    const dependencyManifest = readJsonFile(dependencyPackageJsonPath);
    const dependencyResolvedVersion =
      typeof dependencyManifest.version === 'string' ? dependencyManifest.version.trim() : '';
    if (!dependencyResolvedVersion) {
      throw new Error(`Deployed dependency "${dependencyName}" is missing a publishable version.`);
    }

    resolvedDependencies[dependencyName] = dependencyResolvedVersion;
  }

  return resolvedDependencies;
}

/**
 * Builds the publishable package.json payload for the staged CLI package.
 * @param {Record<string, unknown>} rootManifest Root repository package.json.
 * @param {Record<string, unknown>} stageManifest Deployed CLI package.json.
 * @param {Record<string, string>} resolvedDependencies Concrete dependency map.
 * @returns {Record<string, unknown>}
 */
function createPublishableCliManifest(rootManifest, stageManifest, resolvedDependencies) {
  return {
    name: stageManifest.name,
    version: stageManifest.version,
    description: rootManifest.description,
    license: rootManifest.license,
    type: stageManifest.type,
    repository: rootManifest.repository,
    bugs: rootManifest.bugs,
    homepage: rootManifest.homepage,
    engines: rootManifest.engines,
    bin: {
      'repo-ai-governor': `./${STAGE_BIN_FILE_PATH}`,
    },
    exports: {
      '.': {
        default: './dist/src/main.js',
      },
      './package.json': './package.json',
    },
    files: ['README.md', STAGE_BIN_DIRECTORY, 'dist'],
    bundleDependencies: Object.keys(resolvedDependencies),
    publishConfig: {
      access: 'public',
      provenance: true,
    },
    dependencies: resolvedDependencies,
  };
}

/**
 * Copies the built CLI executable wrapper into the staged npm package root.
 * @param {string} repositoryRoot Absolute repository root.
 * @param {string} stageRoot Absolute staging root.
 */
function writeCliBinEntrypoint(repositoryRoot, stageRoot) {
  const compiledCliBinPath = resolve(repositoryRoot, DIST_CLI_BIN_PATH);
  if (!existsSync(compiledCliBinPath)) {
    throw new Error(
      `Build output is incomplete: expected compiled CLI bin at ${compiledCliBinPath}. Run "pnpm run build" first.`,
    );
  }

  const stageBinDirectoryPath = resolve(stageRoot, STAGE_BIN_DIRECTORY);
  mkdirSync(stageBinDirectoryPath, { recursive: true });
  const stageBinFilePath = resolve(stageRoot, STAGE_BIN_FILE_PATH);
  cpSync(compiledCliBinPath, stageBinFilePath);
  chmodSync(stageBinFilePath, 0o755);
}

/**
 * Prepares one publishable npm package directory for `@repo-ai-governor/cli`.
 * @param {{ outputDirectory: string }} options Parsed CLI options.
 */
function preparePublishableCliPackage(options) {
  const repositoryRoot = process.cwd();
  const stageRoot = resolve(repositoryRoot, options.outputDirectory);
  const rootManifestPath = resolve(repositoryRoot, ROOT_PACKAGE_JSON_PATH);
  const rootManifest = readJsonFile(rootManifestPath);

  rmSync(stageRoot, { recursive: true, force: true });
  runCommand(resolvePnpmCommand(), [
    '--filter',
    CLI_PACKAGE_NAME,
    'deploy',
    '--legacy',
    '--prod',
    stageRoot,
  ]);

  const stageManifestPath = resolve(stageRoot, STAGE_PACKAGE_JSON_PATH);
  const stageManifest = readJsonFile(stageManifestPath);
  const resolvedDependencies = resolvePublishableDependencies(
    stageManifest.dependencies,
    stageRoot,
  );
  const publishableManifest = createPublishableCliManifest(
    rootManifest,
    stageManifest,
    resolvedDependencies,
  );

  writeCliBinEntrypoint(repositoryRoot, stageRoot);
  writeJsonFile(stageManifestPath, publishableManifest);

  process.stdout.write(
    `${JSON.stringify(
      {
        packageName: CLI_PACKAGE_NAME,
        outputDirectory: stageRoot,
        bundledDependencyCount: publishableManifest.bundleDependencies.length,
      },
      null,
      2,
    )}\n`,
  );
}

preparePublishableCliPackage(parseCliOptions());
