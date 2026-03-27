#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { gateFail, gateInfo, gatePass, gateWarn } from './gate-output.js';

const GATE_NAME = 'normative-loading-manifest';
const DEFAULT_MODE = 'warn';
const DEFAULT_FORMAT = 'text';
const DEFAULT_MANIFEST_PATH =
  '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml';
const DEFAULT_NORMATIVE_ROOT = '.repo-ai-governor/normative_knowledge_sources';
const SUPPORTED_MODES = new Set(['warn', 'block']);
const SUPPORTED_FORMATS = new Set(['text', 'json']);
const TRIAD_PATHS = [
  '.repo-ai-governor/normative_knowledge_sources/product-requirements.md',
  '.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md',
  '.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md',
];
const ACTIVE_STATUS_SET = new Set(['active', 'frozen']);
const DEFAULT_LOAD_ALLOWED_TIERS = new Set(['L0', 'L1']);

/**
 * Resolves script CLI options.
 * @param {string[]} argv Raw CLI args.
 * @returns {{mode: "warn" | "block", format: "text" | "json", manifestPath: string, normativeRootPath: string}}
 */
function resolveCliOptions(argv) {
  const modeCandidate = readFlagValue(argv, '--mode') ?? DEFAULT_MODE;
  const formatCandidate = readFlagValue(argv, '--format') ?? DEFAULT_FORMAT;
  const manifestCandidate = readFlagValue(argv, '--manifest') ?? DEFAULT_MANIFEST_PATH;
  const rootCandidate = readFlagValue(argv, '--normative-root') ?? DEFAULT_NORMATIVE_ROOT;

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
    manifestPath: resolve(process.cwd(), manifestCandidate),
    normativeRootPath: resolve(process.cwd(), rootCandidate),
  };
}

/**
 * Reads one flag value from argv.
 * @param {string[]} argv Raw argv.
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
 * Parses the manifest YAML using a constrained line parser.
 * Why this parser exists:
 * Repository gate scripts avoid extra runtime dependencies. The manifest schema
 * is intentionally simple, so a deterministic parser keeps this gate portable.
 *
 * @param {string} manifestPath Absolute manifest path.
 * @returns {{
 *   documents: Array<Record<string, unknown>>,
 *   externalRequiredInputs: Array<Record<string, unknown>>,
 * }}
 */
function parseManifest(manifestPath) {
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest file not found: ${manifestPath}`);
  }

  const content = readFileSync(manifestPath, 'utf8');
  const lines = content.split(/\r?\n/);

  const documents = [];
  const externalRequiredInputs = [];
  let currentSection = null;
  let currentEntry = null;
  let listKey = null;

  /**
   * Pushes the current entry into the active section buffer.
   */
  function flushEntry() {
    if (!currentEntry) {
      return;
    }

    if (currentSection === 'documents') {
      documents.push(currentEntry);
    } else if (currentSection === 'external_required_inputs') {
      externalRequiredInputs.push(currentEntry);
    }

    currentEntry = null;
    listKey = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().length === 0 || line.trimStart().startsWith('#')) {
      continue;
    }

    if (line === 'documents:') {
      flushEntry();
      currentSection = 'documents';
      continue;
    }

    if (line === 'external_required_inputs:') {
      flushEntry();
      currentSection = 'external_required_inputs';
      continue;
    }

    const entryMatch = line.match(/^ {2}- doc_id:\s*(.+)$/);
    if (entryMatch) {
      flushEntry();
      currentEntry = { doc_id: parseScalar(entryMatch[1]) };
      listKey = null;
      continue;
    }

    if (!currentEntry) {
      continue;
    }

    const fieldMatch = line.match(/^ {4}([a-z_]+):\s*(.*)$/);
    if (fieldMatch) {
      const [, fieldKey, fieldRawValue] = fieldMatch;
      if (fieldRawValue.length === 0) {
        currentEntry[fieldKey] = [];
        listKey = fieldKey;
      } else {
        currentEntry[fieldKey] = parseScalar(fieldRawValue);
        listKey = null;
      }
      continue;
    }

    const listItemMatch = line.match(/^ {6}-\s*(.+)$/);
    if (listItemMatch && listKey) {
      const listValue = currentEntry[listKey];
      if (!Array.isArray(listValue)) {
        throw new Error(`Manifest list parse error at field "${listKey}".`);
      }
      listValue.push(parseScalar(listItemMatch[1]));
      continue;
    }

    listKey = null;
  }

  flushEntry();

  return {
    documents,
    externalRequiredInputs,
  };
}

/**
 * Parses one scalar value from YAML text token.
 * @param {string} rawValue Raw scalar token.
 * @returns {string | boolean | number}
 */
function parseScalar(rawValue) {
  const value = rawValue.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  return value;
}

/**
 * Recursively collects all files under one directory.
 * @param {string} rootPath Absolute root path.
 * @returns {string[]} Absolute file paths.
 */
function collectFiles(rootPath) {
  if (!existsSync(rootPath)) {
    throw new Error(`Normative root path not found: ${rootPath}`);
  }

  const files = [];

  /**
   * Walks one directory recursively.
   * @param {string} dirPath Absolute directory path.
   */
  function walk(dirPath) {
    for (const entryName of readdirSync(dirPath)) {
      const absolutePath = resolve(dirPath, entryName);
      const entryStat = statSync(absolutePath);
      if (entryStat.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      files.push(absolutePath);
    }
  }

  walk(rootPath);
  return files;
}

/**
 * Normalizes one path string to repository-relative slash form.
 * @param {string} absolutePath Absolute path.
 * @returns {string}
 */
function toRepoRelativePath(absolutePath) {
  return normalizePathSeparators(relative(process.cwd(), absolutePath));
}

/**
 * Normalizes path separators.
 * @param {string} value Raw path.
 * @returns {string}
 */
function normalizePathSeparators(value) {
  return value.replace(/\\/g, '/');
}

/**
 * Normalizes status text for stable comparisons.
 * @param {unknown} value Raw status value.
 * @returns {string}
 */
function normalizeStatus(value) {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase();

  if (!raw) {
    return 'unknown';
  }

  if (raw.includes('archiv') || raw.includes('归档')) {
    return 'archived';
  }

  if (raw.includes('deprecat') || raw.includes('废弃')) {
    return 'deprecated';
  }

  if (raw.includes('frozen') || raw.includes('冻结')) {
    return 'frozen';
  }

  if (raw.includes('active') || raw.includes('执行中') || raw.includes('进行中')) {
    return 'active';
  }

  return raw;
}

/**
 * Reads status from one markdown file metadata header.
 * @param {string} absolutePath Absolute file path.
 * @returns {string}
 */
function readDocumentStatus(absolutePath) {
  const content = readFileSync(absolutePath, 'utf8');
  const lines = content.split(/\r?\n/).slice(0, 80);

  for (const line of lines) {
    const englishStatusMatch = line.match(/^- Status:\s*(.+)$/);
    if (englishStatusMatch) {
      return normalizeStatus(englishStatusMatch[1]);
    }

    const chineseStatusMatch = line.match(/^- 状态：\s*(.+)$/);
    if (chineseStatusMatch) {
      return normalizeStatus(chineseStatusMatch[1]);
    }

    if (line.startsWith('## ')) {
      break;
    }
  }

  return 'unknown';
}

/**
 * Builds validation issues for manifest content and filesystem coverage.
 * @param {{
 *   documents: Array<Record<string, unknown>>,
 *   externalRequiredInputs: Array<Record<string, unknown>>,
 * }} manifest Parsed manifest payload.
 * @param {string} manifestPath Absolute manifest path.
 * @param {string} normativeRootPath Absolute normative root path.
 * @returns {{
 *   issues: string[],
 *   scannedFiles: number,
 *   manifestDocuments: number,
 *   manifestExternal: number,
 * }}
 */
function validateManifest(manifest, manifestPath, normativeRootPath) {
  const issues = [];
  const manifestDocumentByPath = new Map();
  const seenDocIds = new Set();
  const seenPaths = new Set();

  for (const documentEntry of manifest.documents) {
    const docId = String(documentEntry.doc_id ?? '').trim();
    const pathValue = String(documentEntry.path ?? '').trim();
    const tier = String(documentEntry.tier ?? '').trim();
    const status = normalizeStatus(documentEntry.status);
    const defaultLoad = Boolean(documentEntry.default_load);
    const loadTrigger = documentEntry.load_trigger;

    if (!docId) {
      issues.push('Manifest document entry has empty doc_id.');
      continue;
    }

    if (seenDocIds.has(docId)) {
      issues.push(`Duplicate doc_id detected in manifest: ${docId}`);
    }
    seenDocIds.add(docId);

    if (!pathValue) {
      issues.push(`Manifest document "${docId}" has empty path.`);
      continue;
    }

    if (seenPaths.has(pathValue)) {
      issues.push(`Duplicate path detected in manifest documents: ${pathValue}`);
    }
    seenPaths.add(pathValue);

    const absolutePath = resolve(process.cwd(), pathValue);
    if (!existsSync(absolutePath)) {
      issues.push(`Manifest path does not exist: ${pathValue}`);
    }

    if (defaultLoad && !DEFAULT_LOAD_ALLOWED_TIERS.has(tier)) {
      issues.push(
        `Manifest default_load=true requires tier L0/L1. doc_id=${docId} tier=${tier || '(empty)'}`,
      );
    }

    if ((status === 'archived' || status === 'deprecated') && defaultLoad) {
      issues.push(
        `Archived/deprecated document must not default load. doc_id=${docId} status=${status}`,
      );
    }

    if (!Array.isArray(loadTrigger) || loadTrigger.length === 0) {
      issues.push(`Manifest document "${docId}" must include non-empty load_trigger list.`);
    }

    manifestDocumentByPath.set(pathValue, {
      docId,
      path: pathValue,
      status,
      tier,
      defaultLoad,
    });
  }

  const triadEntries = TRIAD_PATHS.map((pathValue) => manifestDocumentByPath.get(pathValue)).filter(
    Boolean,
  );
  if (triadEntries.length !== TRIAD_PATHS.length) {
    issues.push('Triad documents are not fully registered in manifest documents.');
  } else {
    const triadStatuses = triadEntries.map((entry) => entry.status);
    for (const triadStatus of triadStatuses) {
      if (!ACTIVE_STATUS_SET.has(triadStatus)) {
        issues.push(
          `Triad document status must be active/frozen. Found: ${triadStatuses.join(', ')}`,
        );
        break;
      }
    }

    if (new Set(triadStatuses).size > 1) {
      issues.push(`Triad document statuses must be consistent. Found: ${triadStatuses.join(', ')}`);
    }
  }

  const normativeFiles = collectFiles(normativeRootPath);
  const repoRelativeManifestPath = toRepoRelativePath(manifestPath);

  for (const absoluteFilePath of normativeFiles) {
    const relativeFilePath = toRepoRelativePath(absoluteFilePath);
    const normalizedRelativeFilePath = normalizePathSeparators(relativeFilePath);

    if (
      normalizedRelativeFilePath.includes('/archive/') ||
      normalizedRelativeFilePath.includes('/superseded/')
    ) {
      continue;
    }

    const status =
      normalizedRelativeFilePath.endsWith('.md') || normalizedRelativeFilePath.endsWith('.markdown')
        ? readDocumentStatus(absoluteFilePath)
        : 'unknown';

    if (status === 'archived' || status === 'deprecated') {
      continue;
    }

    const isManifestSelf = normalizedRelativeFilePath === repoRelativeManifestPath;
    if (isManifestSelf) {
      continue;
    }

    if (!manifestDocumentByPath.has(normalizedRelativeFilePath)) {
      issues.push(
        `Active normative file is missing from manifest documents: ${normalizedRelativeFilePath}`,
      );
    }
  }

  return {
    issues,
    scannedFiles: normativeFiles.length,
    manifestDocuments: manifest.documents.length,
    manifestExternal: manifest.externalRequiredInputs.length,
  };
}

/**
 * Renders result in text mode.
 * @param {{
 *   mode: "warn" | "block",
 *   summary: {scannedFiles: number, manifestDocuments: number, manifestExternal: number},
 *   issues: string[],
 * }} result Result payload.
 */
function printTextResult(result) {
  gateInfo(
    GATE_NAME,
    `mode=${result.mode} scanned_files=${result.summary.scannedFiles} manifest_documents=${result.summary.manifestDocuments} manifest_external=${result.summary.manifestExternal} issues=${result.issues.length}`,
  );

  if (result.issues.length === 0) {
    gatePass(GATE_NAME, 'Normative loading manifest checks passed.');
    return;
  }

  for (const issue of result.issues) {
    gateWarn(GATE_NAME, `- ${issue}`);
  }

  if (result.mode === 'warn') {
    gateWarn(GATE_NAME, 'Warning mode is active: issues are reported but do not fail this gate.');
  }
}

try {
  const options = resolveCliOptions(process.argv.slice(2));
  const parsedManifest = parseManifest(options.manifestPath);
  const validation = validateManifest(
    parsedManifest,
    options.manifestPath,
    options.normativeRootPath,
  );

  const result = {
    mode: options.mode,
    summary: {
      scannedFiles: validation.scannedFiles,
      manifestDocuments: validation.manifestDocuments,
      manifestExternal: validation.manifestExternal,
    },
    issues: validation.issues,
  };

  if (options.format === 'json') {
    console.info(JSON.stringify(result, null, 2));
  } else {
    printTextResult(result);
  }

  if (options.mode === 'block' && result.issues.length > 0) {
    gateFail(GATE_NAME, 'Blocking mode detected normative loading manifest violations.');
    process.exit(1);
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
