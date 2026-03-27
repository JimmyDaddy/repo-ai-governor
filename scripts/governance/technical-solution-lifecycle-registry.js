import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { parse } from 'yaml';

export const DEFAULT_TECHNICAL_SOLUTION_LIFECYCLE_REGISTRY_PATH =
  '.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml';
export const SUPPORTED_TECHNICAL_SOLUTION_LIFECYCLE_STATUSES = [
  'draft',
  'review_pending',
  'approved',
  'active',
  'superseded',
  'archived',
];

/**
 * Normalizes path separators.
 * @param {string} value Raw path string.
 * @returns {string}
 */
function normalizePathSeparators(value) {
  return value.replace(/\\/gu, '/');
}

/**
 * Converts unknown input into a normalized string array.
 * @param {unknown} value Raw input.
 * @returns {string[]}
 */
function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => String(entry ?? '').trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => normalizePathSeparators(entry));
}

/**
 * Reads and normalizes the technical solution lifecycle registry payload.
 * @param {string} [registryPath] Repository-relative registry path.
 * @returns {{
 *   registry_path: string,
 *   schema_version: number | string | null,
 *   allowed_statuses: string[],
 *   solutions: Array<{
 *     solution_id: string,
 *     title: string,
 *     status: string,
 *     owner: string,
 *     version: string,
 *     scope: string,
 *     draft_paths: string[],
 *     review_paths: string[],
 *     final_paths: string[],
 *     target_module_ids: string[],
 *     north_star_refs: string[],
 *     approved_at: string,
 *     approved_by: string,
 *     activated_at: string,
 *     supersedes: string[],
 *     superseded_by: string,
 *   }>
 * } | null}
 */
export function loadTechnicalSolutionLifecycleRegistry(
  registryPath = DEFAULT_TECHNICAL_SOLUTION_LIFECYCLE_REGISTRY_PATH,
) {
  const absoluteRegistryPath = resolve(process.cwd(), registryPath);
  if (!existsSync(absoluteRegistryPath)) {
    return null;
  }

  const payload = parse(readFileSync(absoluteRegistryPath, 'utf8'));
  const rootRecord =
    payload && typeof payload === 'object' ? /** @type {Record<string, unknown>} */ (payload) : {};
  const solutions = Array.isArray(rootRecord.solutions) ? rootRecord.solutions : [];

  return {
    registry_path: normalizePathSeparators(registryPath),
    schema_version:
      typeof rootRecord.schema_version === 'number' || typeof rootRecord.schema_version === 'string'
        ? rootRecord.schema_version
        : null,
    allowed_statuses: toStringArray(rootRecord.allowed_statuses),
    solutions: solutions.map((solutionValue) => {
      const solutionRecord =
        solutionValue && typeof solutionValue === 'object'
          ? /** @type {Record<string, unknown>} */ (solutionValue)
          : {};

      return {
        solution_id: String(solutionRecord.solution_id ?? '').trim(),
        title: String(solutionRecord.title ?? '').trim(),
        status: String(solutionRecord.status ?? '').trim(),
        owner: String(solutionRecord.owner ?? '').trim(),
        version: String(solutionRecord.version ?? '').trim(),
        scope: String(solutionRecord.scope ?? '').trim(),
        draft_paths: toStringArray(solutionRecord.draft_paths),
        review_paths: toStringArray(solutionRecord.review_paths),
        final_paths: toStringArray(solutionRecord.final_paths),
        target_module_ids: toStringArray(solutionRecord.target_module_ids),
        north_star_refs: toStringArray(solutionRecord.north_star_refs),
        approved_at: String(solutionRecord.approved_at ?? '').trim(),
        approved_by: String(solutionRecord.approved_by ?? '').trim(),
        activated_at: String(solutionRecord.activated_at ?? '').trim(),
        supersedes: toStringArray(solutionRecord.supersedes),
        superseded_by: String(solutionRecord.superseded_by ?? '').trim(),
      };
    }),
  };
}

/**
 * Builds efficient lookup maps for one normalized lifecycle registry payload.
 * @param {NonNullable<ReturnType<typeof loadTechnicalSolutionLifecycleRegistry>>} registry Normalized registry.
 * @returns {{
 *   solution_by_id: Map<string, ReturnType<typeof loadTechnicalSolutionLifecycleRegistry>["solutions"][number]>,
 *   solution_by_draft_path: Map<string, ReturnType<typeof loadTechnicalSolutionLifecycleRegistry>["solutions"][number]>,
 *   solution_by_final_path: Map<string, ReturnType<typeof loadTechnicalSolutionLifecycleRegistry>["solutions"][number]>,
 * }}
 */
export function buildTechnicalSolutionLifecycleIndex(registry) {
  const solutionById = new Map();
  const solutionByDraftPath = new Map();
  const solutionByFinalPath = new Map();

  for (const solutionEntry of registry.solutions) {
    solutionById.set(solutionEntry.solution_id, solutionEntry);
    for (const draftPath of solutionEntry.draft_paths) {
      solutionByDraftPath.set(draftPath, solutionEntry);
    }
    for (const finalPath of solutionEntry.final_paths) {
      solutionByFinalPath.set(finalPath, solutionEntry);
    }
  }

  return {
    solution_by_id: solutionById,
    solution_by_draft_path: solutionByDraftPath,
    solution_by_final_path: solutionByFinalPath,
  };
}

/**
 * Converts one absolute path to repository-relative slash form.
 * @param {string} absolutePath Absolute file path.
 * @returns {string}
 */
export function toRepoRelativePath(absolutePath) {
  return normalizePathSeparators(relative(process.cwd(), absolutePath));
}
