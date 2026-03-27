#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

import { gateFail, gateInfo, gatePass, gateWarn } from './gate-output.js';

const GATE_NAME = 'dependency-boundary';
const DEFAULT_MODE = 'warn';
const DEFAULT_FORMAT = 'text';
const DEFAULT_WHITELIST_PATH = 'scripts/governance/dependency-boundary-whitelist.json';
const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|mjs|cjs)$/;
const SKIP_DIRECTORY_NAMES = new Set(['node_modules', 'dist', 'coverage']);
const STATIC_IMPORT_PATTERN =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\sfrom\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT_PATTERN = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
const SUPPORTED_MODES = new Set(['warn', 'block']);
const SUPPORTED_FORMATS = new Set(['text', 'json']);
const NOTIFICATION_DISPATCHER_ALLOWED_CORE_PACKAGE_IDS = new Set([
  'packages/core-policy',
  'packages/core-audit',
]);

/**
 * Resolves CLI options for mode, format, and whitelist path.
 * @param {string[]} argv Raw process argv.
 * @returns {{mode: "warn" | "block", format: "text" | "json", whitelistPath: string}}
 */
function resolveCliOptions(argv) {
  const modeCandidate = readFlagValue(argv, '--mode') ?? DEFAULT_MODE;
  const formatCandidate = readFlagValue(argv, '--format') ?? DEFAULT_FORMAT;
  const whitelistCandidate = readFlagValue(argv, '--whitelist') ?? DEFAULT_WHITELIST_PATH;

  if (!SUPPORTED_MODES.has(modeCandidate)) {
    throw new Error(
      `Unsupported --mode "${modeCandidate}". Expected one of: ${Array.from(SUPPORTED_MODES).join(', ')}`,
    );
  }

  if (!SUPPORTED_FORMATS.has(formatCandidate)) {
    throw new Error(
      `Unsupported --format "${formatCandidate}". Expected one of: ${Array.from(SUPPORTED_FORMATS).join(', ')}`,
    );
  }

  return {
    mode: modeCandidate,
    format: formatCandidate,
    whitelistPath: resolve(process.cwd(), whitelistCandidate),
  };
}

/**
 * Reads one CLI flag value.
 * @param {string[]} argv Raw process argv.
 * @param {string} flagName Flag name.
 * @returns {string | null}
 */
function readFlagValue(argv, flagName) {
  const flagIndex = argv.indexOf(flagName);
  if (flagIndex === -1) {
    return null;
  }

  const nextValue = argv[flagIndex + 1];
  if (!nextValue || nextValue.startsWith('--')) {
    throw new Error(`Flag "${flagName}" requires a value.`);
  }

  return nextValue.trim();
}

/**
 * Loads whitelist payload for temporary boundary exceptions.
 * @param {string} whitelistPath Absolute whitelist path.
 * @returns {{allowEdges: Array<{from: string, to: string, reason: string}>}}
 */
function loadWhitelist(whitelistPath) {
  if (!existsSync(whitelistPath)) {
    return { allowEdges: [] };
  }

  const rawWhitelist = readFileSync(whitelistPath, 'utf8');
  const parsedWhitelist = JSON.parse(rawWhitelist);

  if (!parsedWhitelist || typeof parsedWhitelist !== 'object') {
    throw new Error(`Invalid whitelist payload: ${whitelistPath}`);
  }

  const allowEdges = Array.isArray(parsedWhitelist.allowEdges) ? parsedWhitelist.allowEdges : [];
  const sanitizedEdges = [];

  for (const allowEdge of allowEdges) {
    if (!allowEdge || typeof allowEdge !== 'object') {
      continue;
    }

    const from = normalizePathSeparators(String(allowEdge.from ?? '').trim());
    const to = normalizePathSeparators(String(allowEdge.to ?? '').trim());
    const reason = String(allowEdge.reason ?? '').trim();

    if (!from || !to || !reason) {
      continue;
    }

    sanitizedEdges.push({ from, to, reason });
  }

  return { allowEdges: sanitizedEdges };
}

/**
 * Discovers workspace package roots from apps/packages directories.
 * @returns {Array<{id: string, name: string, rootPath: string, layer: string}>}
 */
function collectWorkspacePackages() {
  const packageDescriptors = [];
  const appsRootPath = resolve(process.cwd(), 'apps');
  const packagesRootPath = resolve(process.cwd(), 'packages');

  if (existsSync(appsRootPath)) {
    for (const entry of readdirSync(appsRootPath)) {
      const packageRootPath = resolve(appsRootPath, entry);
      if (!isDirectory(packageRootPath)) {
        continue;
      }

      const descriptor = readPackageDescriptor(packageRootPath);
      if (descriptor) {
        packageDescriptors.push(descriptor);
      }
    }
  }

  if (existsSync(packagesRootPath)) {
    for (const entry of readdirSync(packagesRootPath)) {
      const packageRootPath = resolve(packagesRootPath, entry);
      if (!isDirectory(packageRootPath)) {
        continue;
      }

      const topLevelDescriptor = readPackageDescriptor(packageRootPath);
      if (topLevelDescriptor) {
        packageDescriptors.push(topLevelDescriptor);
      }

      for (const nestedEntry of readdirSync(packageRootPath)) {
        const nestedPackageRootPath = resolve(packageRootPath, nestedEntry);
        if (!isDirectory(nestedPackageRootPath)) {
          continue;
        }

        const nestedDescriptor = readPackageDescriptor(nestedPackageRootPath);
        if (nestedDescriptor) {
          packageDescriptors.push(nestedDescriptor);
        }
      }
    }
  }

  return packageDescriptors.sort((left, right) => right.rootPath.length - left.rootPath.length);
}

/**
 * Reads one workspace package descriptor when package.json exists.
 * @param {string} packageRootPath Absolute package root path.
 * @returns {{id: string, name: string, rootPath: string, layer: string} | null}
 */
function readPackageDescriptor(packageRootPath) {
  const packageJsonPath = resolve(packageRootPath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  const relativePackageRoot = normalizePathSeparators(relative(process.cwd(), packageRootPath));
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const packageName = String(packageJson.name ?? relativePackageRoot).trim();

  return {
    id: relativePackageRoot,
    name: packageName,
    rootPath: packageRootPath,
    layer: classifyPackageLayer(relativePackageRoot),
  };
}

/**
 * Classifies a workspace package into architecture layer buckets.
 * @param {string} packageId Relative package path.
 * @returns {string}
 */
function classifyPackageLayer(packageId) {
  if (packageId.startsWith('apps/')) {
    return 'app';
  }

  if (packageId === 'packages/shared') {
    return 'shared';
  }

  if (packageId === 'packages/config') {
    return 'config';
  }

  if (packageId.startsWith('packages/core-')) {
    return 'core';
  }

  if (packageId === 'packages/memory-store-adapter') {
    return 'memory-store-adapter';
  }

  if (packageId.startsWith('packages/memory-providers/')) {
    return 'memory-provider';
  }

  if (packageId === 'packages/notification-dispatcher') {
    return 'notification-dispatcher';
  }

  if (packageId.startsWith('packages/notification-providers/')) {
    return 'notification-provider';
  }

  if (packageId === 'packages/artifact-registry') {
    return 'artifact-registry';
  }

  if (packageId === 'packages/adapter-sdk') {
    return 'adapter-sdk';
  }

  if (packageId.startsWith('packages/adapters/')) {
    return 'adapter';
  }

  if (packageId.startsWith('packages/standards')) {
    return 'standards';
  }

  if (packageId.startsWith('packages/slots')) {
    return 'slots';
  }

  if (packageId === 'packages/spec-sync-guard') {
    return 'spec-sync-guard';
  }

  if (packageId === 'packages/reporting') {
    return 'reporting';
  }

  if (packageId.startsWith('packages/')) {
    return 'package';
  }

  return 'unknown';
}

/**
 * Collects source file paths for one package root.
 * @param {string} directoryPath Absolute package root path.
 * @returns {string[]}
 */
function collectSourceFiles(directoryPath) {
  const filePaths = [];
  const entries = readdirSync(directoryPath);

  for (const entry of entries) {
    const entryPath = resolve(directoryPath, entry);
    const entryStat = statSync(entryPath);

    if (entryStat.isDirectory()) {
      if (SKIP_DIRECTORY_NAMES.has(entry)) {
        continue;
      }

      filePaths.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (SOURCE_FILE_PATTERN.test(entryPath)) {
      filePaths.push(entryPath);
    }
  }

  return filePaths;
}

/**
 * Collects import references from one source file.
 * @param {string} filePath Absolute source file path.
 * @returns {Array<{specifier: string, lineNumber: number}>}
 */
function collectImports(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const imports = [];

  collectImportsByPattern(source, STATIC_IMPORT_PATTERN, imports);
  collectImportsByPattern(source, DYNAMIC_IMPORT_PATTERN, imports);

  for (const importReference of imports) {
    importReference.lineNumber = resolveLineNumber(source, importReference.index);
  }

  return imports.map(({ specifier, lineNumber }) => ({ specifier, lineNumber }));
}

/**
 * Extracts imports by one regex pattern.
 * @param {string} source Source code text.
 * @param {RegExp} importPattern Regex pattern with one specifier capture group.
 * @param {Array<{specifier: string, index: number}>} output Output collector.
 */
function collectImportsByPattern(source, importPattern, output) {
  for (const match of source.matchAll(importPattern)) {
    const specifier = String(match[1] ?? '').trim();
    if (!specifier) {
      continue;
    }

    output.push({
      specifier,
      index: match.index ?? 0,
    });
  }
}

/**
 * Resolves one source index into a 1-based line number.
 * @param {string} source Source code text.
 * @param {number} sourceIndex Source index.
 * @returns {number}
 */
function resolveLineNumber(source, sourceIndex) {
  return source.slice(0, sourceIndex).split(/\r?\n/).length;
}

/**
 * Resolves import target package id for internal workspace references.
 * @param {string} sourceFilePath Absolute source file path.
 * @param {string} specifier Import specifier.
 * @param {Map<string, {id: string, name: string, rootPath: string, layer: string}>} packageByName Package map by npm name.
 * @param {Array<{id: string, name: string, rootPath: string, layer: string}>} workspacePackages All workspace packages.
 * @returns {{id: string, name: string, rootPath: string, layer: string} | null}
 */
function resolveTargetPackage(sourceFilePath, specifier, packageByName, workspacePackages) {
  if (specifier.startsWith('.')) {
    const sourceDirectoryPath = dirname(sourceFilePath);
    const targetPath = normalizePathSeparators(resolve(sourceDirectoryPath, specifier));
    return findPackageByFilePath(targetPath, workspacePackages);
  }

  if (packageByName.has(specifier)) {
    return packageByName.get(specifier) ?? null;
  }

  return null;
}

/**
 * Finds package descriptor by absolute file path.
 * @param {string} filePath Absolute path.
 * @param {Array<{id: string, name: string, rootPath: string, layer: string}>} workspacePackages All workspace packages.
 * @returns {{id: string, name: string, rootPath: string, layer: string} | null}
 */
function findPackageByFilePath(filePath, workspacePackages) {
  const normalizedPath = normalizePathSeparators(filePath);
  for (const workspacePackage of workspacePackages) {
    const normalizedRoot = normalizePathSeparators(workspacePackage.rootPath);
    if (normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`)) {
      return workspacePackage;
    }
  }

  return null;
}

/**
 * Evaluates dependency boundary for one source->target package edge.
 * @param {{id: string, layer: string}} sourcePackage Source package descriptor.
 * @param {{id: string, layer: string}} targetPackage Target package descriptor.
 * @returns {{allowed: boolean, ruleId: string, reason: string}}
 */
function evaluateBoundary(sourcePackage, targetPackage) {
  if (sourcePackage.id === targetPackage.id) {
    return { allowed: true, ruleId: 'self-allowed', reason: 'Self package imports are allowed.' };
  }

  if (sourcePackage.layer === 'app') {
    if (targetPackage.layer === 'app') {
      return {
        allowed: false,
        ruleId: 'app-no-app-import',
        reason: 'apps should not form direct cross-app dependencies.',
      };
    }

    return {
      allowed: true,
      ruleId: 'app-to-package-allowed',
      reason: 'apps may depend on workspace packages.',
    };
  }

  if (sourcePackage.layer === 'shared') {
    if (targetPackage.layer !== 'shared') {
      return {
        allowed: false,
        ruleId: 'shared-must-be-leaf',
        reason: 'shared must not depend on business/domain modules.',
      };
    }

    return {
      allowed: true,
      ruleId: 'shared-self-allowed',
      reason: 'shared internal imports are allowed.',
    };
  }

  if (sourcePackage.layer === 'config') {
    if (targetPackage.layer === 'shared' || targetPackage.layer === 'config') {
      return {
        allowed: true,
        ruleId: 'config-to-shared-allowed',
        reason: 'config may depend on shared/config.',
      };
    }

    return {
      allowed: false,
      ruleId: 'config-dependency-restricted',
      reason: 'config may only depend on shared/config packages.',
    };
  }

  if (sourcePackage.layer === 'memory-provider') {
    if (targetPackage.layer === 'memory-store-adapter' || targetPackage.layer === 'shared') {
      return {
        allowed: true,
        ruleId: 'memory-provider-allowed',
        reason: 'memory providers may depend on memory-store-adapter/shared.',
      };
    }

    return {
      allowed: false,
      ruleId: 'memory-provider-restricted',
      reason: 'memory providers must not depend on app/adapter or unrelated core modules.',
    };
  }

  if (sourcePackage.layer === 'notification-dispatcher') {
    const isAllowedNotificationDispatcherCoreDependency =
      targetPackage.layer === 'core' &&
      NOTIFICATION_DISPATCHER_ALLOWED_CORE_PACKAGE_IDS.has(targetPackage.id);

    if (
      targetPackage.layer === 'notification-dispatcher' ||
      isAllowedNotificationDispatcherCoreDependency ||
      targetPackage.layer === 'config' ||
      targetPackage.layer === 'shared'
    ) {
      return {
        allowed: true,
        ruleId: 'notification-dispatcher-allowed',
        reason: 'notification-dispatcher may depend on core-policy/core-audit/config/shared.',
      };
    }

    return {
      allowed: false,
      ruleId: 'notification-dispatcher-restricted',
      reason:
        'notification-dispatcher should not depend on apps/adapters/provider implementations.',
    };
  }

  if (sourcePackage.layer === 'notification-provider') {
    if (targetPackage.layer === 'notification-dispatcher' || targetPackage.layer === 'shared') {
      return {
        allowed: true,
        ruleId: 'notification-provider-allowed',
        reason: 'notification providers may depend on dispatcher/shared.',
      };
    }

    return {
      allowed: false,
      ruleId: 'notification-provider-restricted',
      reason: 'notification providers must not depend on runtime/adapters.',
    };
  }

  if (sourcePackage.layer === 'adapter') {
    if (targetPackage.layer === 'adapter-sdk' || targetPackage.layer === 'shared') {
      return {
        allowed: true,
        ruleId: 'adapter-allowed',
        reason: 'adapters may depend on adapter-sdk/shared.',
      };
    }

    return {
      allowed: false,
      ruleId: 'adapter-restricted',
      reason: 'adapters must not depend on apps or domain packages directly.',
    };
  }

  if (sourcePackage.layer === 'artifact-registry') {
    if (targetPackage.layer === 'app' || targetPackage.layer === 'adapter') {
      return {
        allowed: false,
        ruleId: 'artifact-registry-restricted',
        reason: 'artifact-registry must not depend on apps or concrete adapters.',
      };
    }
  }

  if (sourcePackage.layer === 'standards' || sourcePackage.layer === 'slots') {
    if (targetPackage.layer === 'adapter') {
      return {
        allowed: false,
        ruleId: 'standards-no-adapter-dependency',
        reason: 'standards/slots should remain adapter-agnostic.',
      };
    }
  }

  if (sourcePackage.layer === 'spec-sync-guard') {
    if (
      targetPackage.layer === 'core' ||
      targetPackage.layer === 'adapter' ||
      targetPackage.layer === 'memory-provider' ||
      targetPackage.layer === 'notification-provider'
    ) {
      return {
        allowed: false,
        ruleId: 'spec-sync-guard-restricted',
        reason: 'spec-sync-guard should not depend on runtime/adapter/provider implementations.',
      };
    }
  }

  if (sourcePackage.layer !== 'app' && targetPackage.layer === 'app') {
    return {
      allowed: false,
      ruleId: 'package-to-app-forbidden',
      reason: 'packages must not depend on apps.',
    };
  }

  return {
    allowed: true,
    ruleId: 'default-allowed',
    reason: 'No restrictive rule hit in current baseline.',
  };
}

/**
 * Checks whether one violation edge is allowlisted.
 * @param {{sourcePackageId: string, targetPackageId: string}} violation One violation record.
 * @param {{allowEdges: Array<{from: string, to: string, reason: string}>}} whitelist Whitelist payload.
 * @returns {boolean}
 */
function isAllowlisted(violation, whitelist) {
  return whitelist.allowEdges.some(
    (allowEdge) =>
      allowEdge.from === violation.sourcePackageId && allowEdge.to === violation.targetPackageId,
  );
}

/**
 * Renders check result in text format.
 * @param {{
 *   mode: "warn" | "block",
 *   scannedPackages: number,
 *   scannedImports: number,
 *   violations: Array<{
 *     sourcePackageId: string,
 *     targetPackageId: string,
 *     sourceFilePath: string,
 *     lineNumber: number,
 *     specifier: string,
 *     ruleId: string,
 *     reason: string
 *   }>,
 *   allowlistedViolations: number
 * }} result Check result payload.
 */
function printTextResult(result) {
  gateInfo(
    GATE_NAME,
    `mode=${result.mode} scanned_packages=${result.scannedPackages} scanned_imports=${result.scannedImports} violations=${result.violations.length} allowlisted=${result.allowlistedViolations}`,
  );

  if (result.violations.length === 0) {
    gatePass(GATE_NAME, 'No dependency boundary violations found.');
    return;
  }

  for (const violation of result.violations) {
    const relativeFilePath = normalizePathSeparators(
      relative(process.cwd(), violation.sourceFilePath),
    );
    gateWarn(
      GATE_NAME,
      `- ${relativeFilePath}:${violation.lineNumber} ${violation.sourcePackageId} -> ${violation.targetPackageId} rule=${violation.ruleId} specifier="${violation.specifier}" reason="${violation.reason}"`,
    );
  }

  if (result.mode === 'warn') {
    gateWarn(
      GATE_NAME,
      'Warning mode is active: violations are reported but do not fail this gate.',
    );
  }
}

/**
 * Normalizes path separators for stable cross-platform comparison.
 * @param {string} value Input path.
 * @returns {string}
 */
function normalizePathSeparators(value) {
  return value.replace(/\\/g, '/');
}

/**
 * Checks whether path exists and is a directory.
 * @param {string} pathValue Path to inspect.
 * @returns {boolean}
 */
function isDirectory(pathValue) {
  return existsSync(pathValue) && statSync(pathValue).isDirectory();
}

const options = resolveCliOptions(process.argv.slice(2));
const whitelist = loadWhitelist(options.whitelistPath);
const workspacePackages = collectWorkspacePackages();
const packageByName = new Map(
  workspacePackages.map((workspacePackage) => [workspacePackage.name, workspacePackage]),
);

const violations = [];
let scannedImports = 0;
let allowlistedViolations = 0;

for (const sourcePackage of workspacePackages) {
  const sourceFiles = collectSourceFiles(sourcePackage.rootPath);
  for (const sourceFilePath of sourceFiles) {
    const imports = collectImports(sourceFilePath);
    scannedImports += imports.length;

    for (const importReference of imports) {
      const targetPackage = resolveTargetPackage(
        sourceFilePath,
        importReference.specifier,
        packageByName,
        workspacePackages,
      );

      if (!targetPackage || sourcePackage.id === targetPackage.id) {
        continue;
      }

      const boundaryDecision = evaluateBoundary(sourcePackage, targetPackage);
      if (boundaryDecision.allowed) {
        continue;
      }

      const violation = {
        sourcePackageId: sourcePackage.id,
        targetPackageId: targetPackage.id,
        sourceFilePath,
        lineNumber: importReference.lineNumber,
        specifier: importReference.specifier,
        ruleId: boundaryDecision.ruleId,
        reason: boundaryDecision.reason,
      };

      if (isAllowlisted(violation, whitelist)) {
        allowlistedViolations += 1;
        continue;
      }

      violations.push(violation);
    }
  }
}

const result = {
  mode: options.mode,
  scannedPackages: workspacePackages.length,
  scannedImports,
  violations,
  allowlistedViolations,
};

if (options.format === 'json') {
  console.info(JSON.stringify(result, null, 2));
} else {
  printTextResult(result);
}

if (options.mode === 'block' && violations.length > 0) {
  gateFail(GATE_NAME, 'Blocking mode detected dependency boundary violations.');
  process.exit(1);
}
