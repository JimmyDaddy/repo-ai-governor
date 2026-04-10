#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { gateInfo, gatePass } from './gate-output.js';
import {
  ARCHIVE_NORMATIVE_LOADING_MANIFEST_PATH,
  DEFAULT_NORMATIVE_LOADING_DEPRECATED_DAYS,
  NORMATIVE_LOADING_ARCHIVE_ROLE,
  ROOT_NORMATIVE_LOADING_MANIFEST_PATH,
  calculateDayDistance,
  formatIsoDate,
  normalizeNormativeDocumentStatus,
  parseIsoDate,
  readNormativeLoadingManifestState,
  resolveNormativeLoadingToday,
  writeNormativeLoadingManifestState,
} from './normative-loading-manifest-canonical.js';

const GATE_NAME = 'normative-loading-manifest-compact';
const DEFAULT_FORMAT = 'text';
const SUPPORTED_FORMATS = new Set(['text', 'json']);

/**
 * Reads one CLI flag value.
 * @param {string[]} argv Raw CLI args.
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
 * Resolves dry-run/apply CLI options.
 * @param {string[]} argv Raw CLI args.
 * @returns {{
 *   dryRun: boolean;
 *   format: "text" | "json";
 *   rootManifestPath: string;
 *   archiveManifestPath: string;
 *   deprecationDays: number;
 *   today?: string;
 * }}
 */
function resolveCliOptions(argv) {
  const format = readFlagValue(argv, '--format') ?? DEFAULT_FORMAT;
  if (!SUPPORTED_FORMATS.has(format)) {
    throw new Error(
      `Unsupported --format "${format}". Expected one of: ${Array.from(SUPPORTED_FORMATS).join(', ')}`,
    );
  }

  const deprecationDays = Number(
    readFlagValue(argv, '--deprecation-days') ?? DEFAULT_NORMATIVE_LOADING_DEPRECATED_DAYS,
  );
  if (!Number.isFinite(deprecationDays) || deprecationDays < 0) {
    throw new Error(`Invalid --deprecation-days value: ${deprecationDays}`);
  }

  return {
    dryRun: !argv.includes('--apply'),
    format,
    rootManifestPath:
      readFlagValue(argv, '--root-manifest') ?? ROOT_NORMATIVE_LOADING_MANIFEST_PATH,
    archiveManifestPath:
      readFlagValue(argv, '--archive-manifest') ?? ARCHIVE_NORMATIVE_LOADING_MANIFEST_PATH,
    deprecationDays,
    today: readFlagValue(argv, '--today') ?? undefined,
  };
}

/**
 * Removes deprecated-only fields when a document moves into archive.
 * @param {Record<string, unknown>} documentEntry Source document entry.
 * @param {string} todayString Current YYYY-MM-DD string.
 * @param {"root_archived_cleanup" | "deprecated_grace_window_elapsed"} reason Move reason.
 * @returns {Record<string, unknown>}
 */
function buildArchivedEntry(documentEntry, todayString, reason) {
  const { deprecated_at: _deprecatedAt, ...documentEntryWithoutDeprecatedAt } = documentEntry;
  const archivedEntry = {
    ...documentEntryWithoutDeprecatedAt,
    status: 'archived',
    default_load: false,
  };

  const appendedNote =
    reason === 'deprecated_grace_window_elapsed'
      ? `archived via compaction on ${todayString} after deprecated grace window elapsed`
      : `archived via compaction on ${todayString} to clear root archived backlog`;
  const existingNotes = String(documentEntry.notes ?? '').trim();
  archivedEntry.notes = existingNotes ? `${existingNotes}; ${appendedNote}` : appendedNote;
  return archivedEntry;
}

/**
 * Plans and optionally applies normative-loading compaction.
 * @param {{
 *   dryRun?: boolean;
 *   rootManifestPath?: string;
 *   archiveManifestPath?: string;
 *   deprecationDays?: number;
 *   today?: Date | string;
 *   emitGateOutput?: boolean;
 *   writeOutputs?: boolean;
 * }} [options] Compaction options.
 * @returns {{
 *   dryRun: boolean;
 *   summary: {
 *     rootDocumentsBefore: number;
 *     rootDocumentsAfter: number;
 *     archiveDocumentsBefore: number;
 *     archiveDocumentsAfter: number;
 *     movedDocumentCount: number;
 *     movedArchivedBacklogCount: number;
 *     movedDeprecatedCount: number;
 *     skippedMissingDeprecatedAtCount: number;
 *     deprecationDays: number;
 *   };
 *   movedDocuments: Array<{ docId: string; path: string; reason: string; ageInDays: number | null }>;
 *   rootManifestPath: string;
 *   archiveManifestPath: string;
 * }}
 */
export function compactNormativeLoadingManifest(options = {}) {
  const dryRun = options.dryRun !== false;
  const deprecationDays = Number(
    options.deprecationDays ?? DEFAULT_NORMATIVE_LOADING_DEPRECATED_DAYS,
  );
  if (!Number.isFinite(deprecationDays) || deprecationDays < 0) {
    throw new Error(`Invalid deprecationDays value: ${deprecationDays}`);
  }

  const today = resolveNormativeLoadingToday(options.today);
  const todayString = formatIsoDate(today);
  const emitGateOutput = options.emitGateOutput !== false;
  const writeOutputs = options.writeOutputs !== false;
  const state = readNormativeLoadingManifestState(options);
  const nextRootDocuments = [];
  const nextArchiveDocuments = state.archiveDocuments.map((entry) => ({ ...entry }));
  const archiveDocIdMap = new Map(nextArchiveDocuments.map((entry) => [entry.doc_id, entry]));
  const archivePathMap = new Map(nextArchiveDocuments.map((entry) => [entry.path, entry]));
  const movedDocuments = [];
  let movedArchivedBacklogCount = 0;
  let movedDeprecatedCount = 0;
  let skippedMissingDeprecatedAtCount = 0;

  for (const documentEntry of state.rootDocuments) {
    const status = normalizeNormativeDocumentStatus(documentEntry.status);

    if (status === 'archived') {
      movedArchivedBacklogCount += 1;
      const archiveEntry = buildArchivedEntry(documentEntry, todayString, 'root_archived_cleanup');
      const existingByDocId = archiveDocIdMap.get(documentEntry.doc_id);
      const existingByPath = archivePathMap.get(documentEntry.path);

      if (!existingByDocId && !existingByPath) {
        nextArchiveDocuments.push(archiveEntry);
        archiveDocIdMap.set(archiveEntry.doc_id, archiveEntry);
        archivePathMap.set(archiveEntry.path, archiveEntry);
      } else if (
        existingByDocId?.path !== documentEntry.path ||
        existingByPath?.doc_id !== documentEntry.doc_id
      ) {
        throw new Error(
          `Archive manifest already contains conflicting doc_id/path for archived cleanup: ${documentEntry.doc_id}`,
        );
      }

      movedDocuments.push({
        docId: documentEntry.doc_id,
        path: documentEntry.path,
        reason: 'root_archived_cleanup',
        ageInDays: null,
      });
      continue;
    }

    if (status === 'deprecated') {
      const deprecatedAt = parseIsoDate(documentEntry.deprecated_at);
      if (!deprecatedAt) {
        skippedMissingDeprecatedAtCount += 1;
        nextRootDocuments.push({ ...documentEntry });
        continue;
      }

      const ageInDays = calculateDayDistance(deprecatedAt, today);
      if (ageInDays >= deprecationDays) {
        movedDeprecatedCount += 1;
        const archiveEntry = buildArchivedEntry(
          documentEntry,
          todayString,
          'deprecated_grace_window_elapsed',
        );
        const existingByDocId = archiveDocIdMap.get(documentEntry.doc_id);
        const existingByPath = archivePathMap.get(documentEntry.path);

        if (!existingByDocId && !existingByPath) {
          nextArchiveDocuments.push(archiveEntry);
          archiveDocIdMap.set(archiveEntry.doc_id, archiveEntry);
          archivePathMap.set(archiveEntry.path, archiveEntry);
        } else if (
          existingByDocId?.path !== documentEntry.path ||
          existingByPath?.doc_id !== documentEntry.doc_id
        ) {
          throw new Error(
            `Archive manifest already contains conflicting doc_id/path for compaction: ${documentEntry.doc_id}`,
          );
        }

        movedDocuments.push({
          docId: documentEntry.doc_id,
          path: documentEntry.path,
          reason: 'deprecated_grace_window_elapsed',
          ageInDays,
        });
        continue;
      }
    }

    nextRootDocuments.push({ ...documentEntry });
  }

  const summary = {
    rootDocumentsBefore: state.rootDocuments.length,
    rootDocumentsAfter: nextRootDocuments.length,
    archiveDocumentsBefore: state.archiveDocuments.length,
    archiveDocumentsAfter: nextArchiveDocuments.length,
    movedDocumentCount: movedDocuments.length,
    movedArchivedBacklogCount,
    movedDeprecatedCount,
    skippedMissingDeprecatedAtCount,
    deprecationDays,
  };

  if (!dryRun && writeOutputs && movedDocuments.length > 0) {
    writeNormativeLoadingManifestState({
      rootManifestPath: state.rootManifestPath,
      archiveManifestPath: state.archiveManifestPath,
      rootManifest: {
        ...state.rootManifest,
        generated_at: todayString,
        documents: nextRootDocuments,
      },
      archiveManifest: {
        ...state.archiveManifest,
        generated_at: todayString,
        root_manifest_path: state.expectedRootManifestPathValue,
        archive_role: NORMATIVE_LOADING_ARCHIVE_ROLE,
        documents: nextArchiveDocuments,
      },
    });
  }

  if (emitGateOutput) {
    gateInfo(
      GATE_NAME,
      `dry_run=${dryRun} root_before=${summary.rootDocumentsBefore} root_after=${summary.rootDocumentsAfter} archive_before=${summary.archiveDocumentsBefore} archive_after=${summary.archiveDocumentsAfter} moved=${summary.movedDocumentCount} skipped_missing_deprecated_at=${summary.skippedMissingDeprecatedAtCount}`,
    );

    for (const movedDocument of movedDocuments) {
      const ageSuffix =
        typeof movedDocument.ageInDays === 'number' ? ` age=${movedDocument.ageInDays}` : '';
      gateInfo(
        GATE_NAME,
        `candidate doc_id=${movedDocument.docId} reason=${movedDocument.reason}${ageSuffix}`,
      );
    }

    gatePass(
      GATE_NAME,
      dryRun
        ? `Dry-run completed with ${summary.movedDocumentCount} compaction candidate(s).`
        : `Applied compaction for ${summary.movedDocumentCount} document(s).`,
    );
  }

  return {
    dryRun,
    summary,
    movedDocuments,
    rootManifestPath: state.rootManifestPath,
    archiveManifestPath: state.archiveManifestPath,
  };
}

function runCli() {
  const options = resolveCliOptions(process.argv.slice(2));
  const result = compactNormativeLoadingManifest({
    ...options,
    emitGateOutput: options.format !== 'json',
  });

  if (options.format === 'json') {
    console.info(JSON.stringify(result, null, 2));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
