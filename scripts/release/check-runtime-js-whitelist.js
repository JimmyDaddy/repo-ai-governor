#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';

const GATE_NAME = 'release-runtime-js-whitelist';
const WHITELIST_PATH = 'scripts/release/runtime-js-whitelist.json';
const RUNTIME_GLOB = 'dist/{bin,apps,packages}/**/*.{js,mjs,cjs}';

/**
 * Normalizes file path separators for cross-platform matching.
 * @param {string} filePath Candidate file path.
 * @returns {string}
 */
function normalizeFilePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

/**
 * Reads and parses runtime JS whitelist config.
 * @returns {{allowedPathPatterns: string[]; requiredPaths: string[]}}
 */
function readRuntimeJsWhitelist() {
  const absoluteConfigPath = resolve(process.cwd(), WHITELIST_PATH);
  if (!existsSync(absoluteConfigPath)) {
    throw new Error(`Whitelist config not found: ${WHITELIST_PATH}`);
  }

  const rawContent = readFileSync(absoluteConfigPath, 'utf8');
  const parsedConfig = JSON.parse(rawContent);
  if (!Array.isArray(parsedConfig.allowedPathPatterns)) {
    throw new Error('Whitelist config must define allowedPathPatterns.');
  }
  if (!Array.isArray(parsedConfig.requiredPaths)) {
    throw new Error('Whitelist config must define requiredPaths.');
  }

  return {
    allowedPathPatterns: parsedConfig.allowedPathPatterns.map((pattern) =>
      normalizeFilePath(pattern),
    ),
    requiredPaths: parsedConfig.requiredPaths.map((requiredPath) =>
      normalizeFilePath(requiredPath),
    ),
  };
}

/**
 * Converts absolute file paths into repository-relative paths.
 * @param {string[]} absolutePaths Absolute file paths.
 * @returns {string[]}
 */
function toRepositoryRelativePaths(absolutePaths) {
  const repositoryRoot = resolve(process.cwd());
  const repositoryRootPrefix = normalizeFilePath(`${repositoryRoot}/`);
  return absolutePaths.map((absolutePath) =>
    normalizeFilePath(absolutePath).replace(repositoryRootPrefix, ''),
  );
}

/**
 * Builds one lookup set for all allowed file paths from wildcard patterns.
 * Why: this avoids repeated glob filesystem scans per runtime file.
 * @param {string[]} allowedPatterns Allowed glob patterns.
 * @returns {Set<string>}
 */
function buildAllowedPathSet(allowedPatterns) {
  const allowedFiles = new Set();

  for (const pattern of allowedPatterns) {
    const matchedFiles = globSync(pattern, {
      absolute: false,
      nodir: true,
    });

    for (const matchedFile of matchedFiles) {
      allowedFiles.add(normalizeFilePath(matchedFile));
    }
  }

  return allowedFiles;
}

try {
  const whitelist = readRuntimeJsWhitelist();
  const runtimeJsFiles = toRepositoryRelativePaths(
    globSync(RUNTIME_GLOB, {
      absolute: true,
      nodir: true,
    }),
  );
  if (runtimeJsFiles.length === 0) {
    throw new Error(`No runtime JS files matched ${RUNTIME_GLOB}. Run build first.`);
  }
  const recursiveDistArtifacts = runtimeJsFiles.filter((runtimeJsFile) =>
    runtimeJsFile.includes('/dist/dist/'),
  );
  if (recursiveDistArtifacts.length > 0) {
    throw new Error(
      `Detected recursive dist artifacts (${recursiveDistArtifacts.length}). Clean package dist mirrors before build.`,
    );
  }

  const allowedPathSet = buildAllowedPathSet(whitelist.allowedPathPatterns);

  for (const requiredPath of whitelist.requiredPaths) {
    if (!runtimeJsFiles.includes(requiredPath)) {
      throw new Error(`Required runtime JS file is missing: ${requiredPath}`);
    }
  }

  for (const runtimeJsFile of runtimeJsFiles) {
    if (!allowedPathSet.has(runtimeJsFile)) {
      throw new Error(
        `Runtime JS file is not whitelisted: ${runtimeJsFile}. Update ${WHITELIST_PATH}.`,
      );
    }
  }

  gateInfo(
    GATE_NAME,
    `checked ${runtimeJsFiles.length} runtime JS files against ${whitelist.allowedPathPatterns.length} patterns.`,
  );
  gatePass(GATE_NAME, 'runtime JS whitelist check passed.');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
