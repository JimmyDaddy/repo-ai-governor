import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

import { stringify } from 'yaml';
import { parseDocument } from 'yaml';

export const ROOT_NORMATIVE_LOADING_MANIFEST_PATH =
  '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml';
export const ARCHIVE_NORMATIVE_LOADING_MANIFEST_PATH =
  '.repo-ai-governor/normative_knowledge_sources/archive/normative-loading-manifest.archive.yaml';
export const DEFAULT_NORMATIVE_LOADING_DEPRECATED_DAYS = 14;
export const NORMATIVE_LOADING_ARCHIVE_ROLE = 'archived_catalog_sidecar';

const DOCUMENT_FIELD_ORDER = [
  'doc_id',
  'path',
  'tier',
  'status',
  'default_load',
  'load_trigger',
  'owner',
  'last_reviewed_at',
  'notes',
  'deprecated_at',
];
const ROOT_MANIFEST_FIELD_ORDER = [
  'schema_version',
  'generated_at',
  'status',
  'owner',
  'default_policy',
  'external_required_inputs',
  'documents',
];
const ARCHIVE_MANIFEST_FIELD_ORDER = [
  'schema_version',
  'generated_at',
  'status',
  'owner',
  'root_manifest_path',
  'archive_role',
  'documents',
];

/**
 * Normalizes slash separators for stable path comparisons.
 * @param {unknown} value Raw path value.
 * @returns {string}
 */
function normalizePath(value) {
  return String(value ?? '')
    .trim()
    .replace(/\\/gu, '/');
}

/**
 * Returns whether a value is a plain object.
 * @param {unknown} value Raw candidate.
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Normalizes one status string to the lifecycle vocabulary.
 * @param {unknown} value Raw status value.
 * @returns {string}
 */
export function normalizeNormativeDocumentStatus(value) {
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
 * Parses one YYYY-MM-DD date string.
 * @param {unknown} value Raw date value.
 * @returns {Date | null}
 */
export function parseIsoDate(value) {
  const normalized = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(normalized)) {
    return null;
  }

  const parsedDate = new Date(`${normalized}T00:00:00Z`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

/**
 * Formats a Date into YYYY-MM-DD.
 * @param {Date} value Date instance.
 * @returns {string}
 */
export function formatIsoDate(value) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates whole-day distance between two UTC-normalized dates.
 * @param {Date} fromDate Start date.
 * @param {Date} toDate End date.
 * @returns {number}
 */
export function calculateDayDistance(fromDate, toDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay);
}

/**
 * Clones one manifest document entry with stable key ordering.
 * @param {Record<string, unknown>} rawEntry Raw document entry.
 * @returns {Record<string, unknown>}
 */
function cloneDocumentEntry(rawEntry) {
  const orderedEntry = {};

  for (const key of DOCUMENT_FIELD_ORDER) {
    if (key in rawEntry) {
      orderedEntry[key] = rawEntry[key];
    }
  }

  for (const [key, value] of Object.entries(rawEntry)) {
    if (key in orderedEntry) {
      continue;
    }
    orderedEntry[key] = value;
  }

  return orderedEntry;
}

/**
 * Clones one manifest root object with stable key ordering.
 * @param {Record<string, unknown>} rawManifest Raw manifest object.
 * @param {"root" | "archive"} manifestKind Manifest kind.
 * @returns {Record<string, unknown>}
 */
function cloneManifestObject(rawManifest, manifestKind) {
  const fieldOrder =
    manifestKind === 'archive' ? ARCHIVE_MANIFEST_FIELD_ORDER : ROOT_MANIFEST_FIELD_ORDER;
  const orderedManifest = {};

  for (const key of fieldOrder) {
    if (key in rawManifest) {
      orderedManifest[key] = rawManifest[key];
    }
  }

  for (const [key, value] of Object.entries(rawManifest)) {
    if (key in orderedManifest) {
      continue;
    }
    orderedManifest[key] = value;
  }

  return orderedManifest;
}

/**
 * Parses one YAML file into a manifest object.
 * @param {string} manifestPath Absolute manifest path.
 * @returns {Record<string, unknown>}
 */
function parseManifestFile(manifestPath) {
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest file not found: ${manifestPath}`);
  }

  const document = parseDocument(readFileSync(manifestPath, 'utf8'));
  const parsedValue = document.toJSON();
  if (!isPlainObject(parsedValue)) {
    throw new Error(`Manifest must parse to an object: ${manifestPath}`);
  }

  return parsedValue;
}

/**
 * Normalizes document entries for stable downstream processing.
 * @param {unknown} rawDocuments Raw documents payload.
 * @param {string} manifestPath Absolute manifest path.
 * @returns {Array<Record<string, unknown>>}
 */
function normalizeDocumentEntries(rawDocuments, manifestPath) {
  if (!Array.isArray(rawDocuments)) {
    throw new Error(`Manifest documents must be an array: ${manifestPath}`);
  }

  return rawDocuments.map((rawEntry, index) => {
    if (!isPlainObject(rawEntry)) {
      throw new Error(`Manifest document at index ${index} must be an object: ${manifestPath}`);
    }

    const normalizedEntry = cloneDocumentEntry(rawEntry);
    normalizedEntry.doc_id = String(rawEntry.doc_id ?? '').trim();
    normalizedEntry.path = normalizePath(rawEntry.path);
    normalizedEntry.tier = String(rawEntry.tier ?? '').trim();
    normalizedEntry.status = normalizeNormativeDocumentStatus(rawEntry.status);
    normalizedEntry.default_load = Boolean(rawEntry.default_load);
    normalizedEntry.load_trigger = Array.isArray(rawEntry.load_trigger)
      ? rawEntry.load_trigger.map((value) => String(value).trim()).filter(Boolean)
      : [];
    normalizedEntry.owner = String(rawEntry.owner ?? '').trim();
    normalizedEntry.last_reviewed_at = String(rawEntry.last_reviewed_at ?? '').trim();
    normalizedEntry.notes = String(rawEntry.notes ?? '').trim();

    if ('deprecated_at' in rawEntry && String(rawEntry.deprecated_at ?? '').trim()) {
      normalizedEntry.deprecated_at = String(rawEntry.deprecated_at ?? '').trim();
      return normalizedEntry;
    }

    const { deprecated_at: _deprecatedAt, ...entryWithoutDeprecatedAt } = normalizedEntry;
    return entryWithoutDeprecatedAt;
  });
}

/**
 * Resolves one date option.
 * @param {Date | string | undefined} value Explicit option value.
 * @returns {Date}
 */
export function resolveNormativeLoadingToday(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Invalid --today value: expected a valid Date instance.');
    }
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim();
    if (normalizedValue.length > 0) {
      const parsedDate = parseIsoDate(normalizedValue);
      if (!parsedDate) {
        throw new Error(`Invalid --today value: "${normalizedValue}". Expected YYYY-MM-DD.`);
      }
      return parsedDate;
    }
  }

  const currentDate = parseIsoDate(formatIsoDate(new Date()));
  if (!currentDate) {
    throw new Error('Unable to resolve current date for normative-loading lifecycle tooling.');
  }
  return currentDate;
}

/**
 * Reads root + archive manifest state for lifecycle tooling.
 * @param {{
 *   rootManifestPath?: string;
 *   archiveManifestPath?: string;
 * }} [options] Optional path overrides.
 * @returns {{
 *   rootManifestPath: string;
 *   archiveManifestPath: string;
 *   expectedRootManifestPathValue: string;
 *   rootManifest: Record<string, unknown>;
 *   archiveManifest: Record<string, unknown>;
 *   rootDocuments: Array<Record<string, unknown>>;
 *   archiveDocuments: Array<Record<string, unknown>>;
 * }}
 */
export function readNormativeLoadingManifestState(options = {}) {
  const rootManifestPath = resolve(
    process.cwd(),
    options.rootManifestPath ?? ROOT_NORMATIVE_LOADING_MANIFEST_PATH,
  );
  const archiveManifestPath = resolve(
    process.cwd(),
    options.archiveManifestPath ?? ARCHIVE_NORMATIVE_LOADING_MANIFEST_PATH,
  );
  const rootManifest = parseManifestFile(rootManifestPath);
  const archiveManifest = parseManifestFile(archiveManifestPath);

  return {
    rootManifestPath,
    archiveManifestPath,
    expectedRootManifestPathValue: normalizePath(relative(process.cwd(), rootManifestPath)),
    rootManifest,
    archiveManifest,
    rootDocuments: normalizeDocumentEntries(rootManifest.documents, rootManifestPath),
    archiveDocuments: normalizeDocumentEntries(archiveManifest.documents, archiveManifestPath),
  };
}

/**
 * Collects archive-integrity issues and monthly-audit findings.
 * @param {{
 *   rootManifestPath?: string;
 *   archiveManifestPath?: string;
 *   deprecationDays?: number;
 *   today?: Date | string;
 * }} [options] Validation options.
 * @returns {{
 *   state: ReturnType<typeof readNormativeLoadingManifestState>;
 *   issues: string[];
 *   summary: {
 *     rootDocumentCount: number;
 *     archiveDocumentCount: number;
 *     rootArchivedCount: number;
 *     overdueDeprecatedCount: number;
 *     missingDeprecatedAtCount: number;
 *     deprecationDays: number;
 *   };
 * }}
 */
export function collectNormativeLoadingArchiveIssues(options = {}) {
  const deprecationDays = Number(
    options.deprecationDays ?? DEFAULT_NORMATIVE_LOADING_DEPRECATED_DAYS,
  );
  if (!Number.isFinite(deprecationDays) || deprecationDays < 0) {
    throw new Error(`Invalid deprecationDays value: ${deprecationDays}`);
  }

  const today = resolveNormativeLoadingToday(options.today);
  const state = readNormativeLoadingManifestState(options);
  const issues = [];
  const rootDocIdMap = new Map();
  const rootPathMap = new Map();
  const archiveDocIdMap = new Map();
  const archivePathMap = new Map();
  let rootArchivedCount = 0;
  let overdueDeprecatedCount = 0;
  let missingDeprecatedAtCount = 0;

  if (
    normalizePath(state.archiveManifest.root_manifest_path) !== state.expectedRootManifestPathValue
  ) {
    issues.push(
      `archive root_manifest_path must equal "${state.expectedRootManifestPathValue}" but found "${state.archiveManifest.root_manifest_path ?? ''}"`,
    );
  }

  if (normalizePath(state.archiveManifest.archive_role) !== NORMATIVE_LOADING_ARCHIVE_ROLE) {
    issues.push(
      `archive archive_role must equal "${NORMATIVE_LOADING_ARCHIVE_ROLE}" but found "${state.archiveManifest.archive_role ?? ''}"`,
    );
  }

  for (const documentEntry of state.rootDocuments) {
    if (!documentEntry.doc_id) {
      issues.push('root manifest contains document with empty doc_id');
      continue;
    }

    if (!documentEntry.path) {
      issues.push(`root manifest document "${documentEntry.doc_id}" has empty path`);
      continue;
    }

    if (rootDocIdMap.has(documentEntry.doc_id)) {
      issues.push(`root manifest duplicate doc_id: ${documentEntry.doc_id}`);
    }
    rootDocIdMap.set(documentEntry.doc_id, documentEntry.path);

    if (rootPathMap.has(documentEntry.path)) {
      issues.push(`root manifest duplicate path: ${documentEntry.path}`);
    }
    rootPathMap.set(documentEntry.path, documentEntry.doc_id);

    if (documentEntry.path.includes('/draft/')) {
      issues.push(`draft path must not be registered in root manifest: ${documentEntry.path}`);
    }

    const status = normalizeNormativeDocumentStatus(documentEntry.status);
    if (status === 'archived') {
      rootArchivedCount += 1;
      issues.push(`root manifest must not retain archived entry: ${documentEntry.doc_id}`);
    }

    if (status !== 'deprecated') {
      continue;
    }

    if (documentEntry.default_load) {
      issues.push(`deprecated document must not default load: ${documentEntry.doc_id}`);
    }

    const deprecatedAt = parseIsoDate(documentEntry.deprecated_at);
    if (!deprecatedAt) {
      missingDeprecatedAtCount += 1;
      issues.push(`deprecated document missing valid deprecated_at: ${documentEntry.doc_id}`);
      continue;
    }

    const ageInDays = calculateDayDistance(deprecatedAt, today);
    if (ageInDays >= deprecationDays) {
      overdueDeprecatedCount += 1;
      issues.push(
        `deprecated document exceeded ${deprecationDays} day grace window: ${documentEntry.doc_id} age=${ageInDays}`,
      );
    }
  }

  for (const documentEntry of state.archiveDocuments) {
    if (!documentEntry.doc_id) {
      issues.push('archive manifest contains document with empty doc_id');
      continue;
    }

    if (!documentEntry.path) {
      issues.push(`archive manifest document "${documentEntry.doc_id}" has empty path`);
      continue;
    }

    if (archiveDocIdMap.has(documentEntry.doc_id)) {
      issues.push(`archive manifest duplicate doc_id: ${documentEntry.doc_id}`);
    }
    archiveDocIdMap.set(documentEntry.doc_id, documentEntry.path);

    if (archivePathMap.has(documentEntry.path)) {
      issues.push(`archive manifest duplicate path: ${documentEntry.path}`);
    }
    archivePathMap.set(documentEntry.path, documentEntry.doc_id);

    if (documentEntry.path.includes('/draft/')) {
      issues.push(`draft path must not be registered in archive manifest: ${documentEntry.path}`);
    }

    if (normalizeNormativeDocumentStatus(documentEntry.status) !== 'archived') {
      issues.push(`archive manifest document must have status=archived: ${documentEntry.doc_id}`);
    }

    if (documentEntry.default_load) {
      issues.push(`archive manifest document must not default load: ${documentEntry.doc_id}`);
    }

    if ('deprecated_at' in documentEntry) {
      issues.push(
        `archive manifest document must not keep deprecated_at metadata: ${documentEntry.doc_id}`,
      );
    }

    if (rootDocIdMap.has(documentEntry.doc_id)) {
      issues.push(`root/archive duplicate doc_id detected: ${documentEntry.doc_id}`);
    }

    if (rootPathMap.has(documentEntry.path)) {
      issues.push(`root/archive duplicate path detected: ${documentEntry.path}`);
    }
  }

  return {
    state,
    issues,
    summary: {
      rootDocumentCount: state.rootDocuments.length,
      archiveDocumentCount: state.archiveDocuments.length,
      rootArchivedCount,
      overdueDeprecatedCount,
      missingDeprecatedAtCount,
      deprecationDays,
    },
  };
}

/**
 * Writes both manifests with stable key ordering.
 * @param {{
 *   rootManifestPath: string;
 *   archiveManifestPath: string;
 *   rootManifest: Record<string, unknown>;
 *   archiveManifest: Record<string, unknown>;
 * }} options Write payload.
 */
export function writeNormativeLoadingManifestState(options) {
  const rootManifest = cloneManifestObject(options.rootManifest, 'root');
  const archiveManifest = cloneManifestObject(options.archiveManifest, 'archive');

  rootManifest.documents = normalizeDocumentEntries(
    rootManifest.documents ?? [],
    options.rootManifestPath,
  );
  archiveManifest.documents = normalizeDocumentEntries(
    archiveManifest.documents ?? [],
    options.archiveManifestPath,
  );

  mkdirSync(dirname(options.rootManifestPath), { recursive: true });
  mkdirSync(dirname(options.archiveManifestPath), { recursive: true });
  writeFileSync(
    options.rootManifestPath,
    `${stringify(rootManifest, { lineWidth: 0, sortMapEntries: false }).trimEnd()}\n`,
    'utf8',
  );
  writeFileSync(
    options.archiveManifestPath,
    `${stringify(archiveManifest, { lineWidth: 0, sortMapEntries: false }).trimEnd()}\n`,
    'utf8',
  );
}
