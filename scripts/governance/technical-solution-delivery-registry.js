import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parse } from 'yaml';

export const DEFAULT_TECHNICAL_SOLUTION_DELIVERY_REGISTRY_PATH =
  '.repo-ai-governor/context/technical-solution-delivery-registry.yaml';
export const SUPPORTED_TECHNICAL_SOLUTION_DELIVERY_MODES = [
  'docs_only',
  'existing_stream',
  'followup_required',
];
export const SUPPORTED_TECHNICAL_SOLUTION_CONSUMER_SURFACES = [
  'internal_governance',
  'adopter_cli',
  'packaged_distribution',
  'runtime_service',
  'docs_playbook',
];
export const SUPPORTED_TECHNICAL_SOLUTION_USER_IMPACT_LEVELS = ['none', 'low', 'medium', 'high'];
export const SUPPORTED_TECHNICAL_SOLUTION_EXECUTION_STATUSES = [
  'not_required',
  'planned',
  'in_progress',
  'completed',
];
export const SUPPORTED_TECHNICAL_SOLUTION_ROLLOUT_STATUSES = [
  'not_required',
  'planned',
  'in_progress',
  'completed',
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
 * Reads and normalizes the technical solution delivery registry payload.
 * @param {string} [registryPath] Repository-relative registry path.
 * @returns {{
 *   registry_path: string,
 *   schema_version: number | string | null,
 *   allowed_delivery_modes: string[],
 *   allowed_consumer_surfaces: string[],
 *   allowed_user_impact_levels: string[],
 *   allowed_execution_statuses: string[],
 *   allowed_rollout_statuses: string[],
 *   deliveries: Array<{
 *     solution_id: string,
 *     delivery_mode: string,
 *     consumer_surfaces: string[],
 *     user_impact_level: string,
 *     execution_status: string,
 *     rollout_status: string,
 *     owner: string,
 *     project_ref: string,
 *     sprint_ref: string,
 *     task_ids: string[],
 *     project_plan_path: string,
 *     sprint_plan_path: string,
 *     task_csv_path: string,
 *     handoff_artifact_path: string,
 *     rollout_artifacts: string[],
 *     accepted_at: string,
 *   }>
 * } | null}
 */
export function loadTechnicalSolutionDeliveryRegistry(
  registryPath = DEFAULT_TECHNICAL_SOLUTION_DELIVERY_REGISTRY_PATH,
) {
  const absoluteRegistryPath = resolve(process.cwd(), registryPath);
  if (!existsSync(absoluteRegistryPath)) {
    return null;
  }

  const payload = parse(readFileSync(absoluteRegistryPath, 'utf8'));
  const rootRecord =
    payload && typeof payload === 'object' ? /** @type {Record<string, unknown>} */ (payload) : {};
  const deliveries = Array.isArray(rootRecord.deliveries) ? rootRecord.deliveries : [];

  return {
    registry_path: normalizePathSeparators(registryPath),
    schema_version:
      typeof rootRecord.schema_version === 'number' || typeof rootRecord.schema_version === 'string'
        ? rootRecord.schema_version
        : null,
    allowed_delivery_modes: toStringArray(rootRecord.allowed_delivery_modes),
    allowed_consumer_surfaces: toStringArray(rootRecord.allowed_consumer_surfaces),
    allowed_user_impact_levels: toStringArray(rootRecord.allowed_user_impact_levels),
    allowed_execution_statuses: toStringArray(rootRecord.allowed_execution_statuses),
    allowed_rollout_statuses: toStringArray(rootRecord.allowed_rollout_statuses),
    deliveries: deliveries.map((deliveryValue) => {
      const deliveryRecord =
        deliveryValue && typeof deliveryValue === 'object'
          ? /** @type {Record<string, unknown>} */ (deliveryValue)
          : {};

      return {
        solution_id: String(deliveryRecord.solution_id ?? '').trim(),
        delivery_mode: String(deliveryRecord.delivery_mode ?? '').trim(),
        consumer_surfaces: toStringArray(deliveryRecord.consumer_surfaces),
        user_impact_level: String(deliveryRecord.user_impact_level ?? '').trim(),
        execution_status: String(deliveryRecord.execution_status ?? '').trim(),
        rollout_status: String(deliveryRecord.rollout_status ?? '').trim(),
        owner: String(deliveryRecord.owner ?? '').trim(),
        project_ref: String(deliveryRecord.project_ref ?? '').trim(),
        sprint_ref: String(deliveryRecord.sprint_ref ?? '').trim(),
        task_ids: toStringArray(deliveryRecord.task_ids),
        project_plan_path: String(deliveryRecord.project_plan_path ?? '').trim(),
        sprint_plan_path: String(deliveryRecord.sprint_plan_path ?? '').trim(),
        task_csv_path: String(deliveryRecord.task_csv_path ?? '').trim(),
        handoff_artifact_path: String(deliveryRecord.handoff_artifact_path ?? '').trim(),
        rollout_artifacts: toStringArray(deliveryRecord.rollout_artifacts),
        accepted_at: String(deliveryRecord.accepted_at ?? '').trim(),
      };
    }),
  };
}

/**
 * Builds efficient lookup maps for one normalized delivery registry payload.
 * @param {NonNullable<ReturnType<typeof loadTechnicalSolutionDeliveryRegistry>>} registry Normalized registry.
 * @returns {{
 *   delivery_by_solution_id: Map<string, ReturnType<typeof loadTechnicalSolutionDeliveryRegistry>["deliveries"][number]>,
 * }}
 */
export function buildTechnicalSolutionDeliveryIndex(registry) {
  const deliveryBySolutionId = new Map();

  for (const deliveryEntry of registry.deliveries) {
    deliveryBySolutionId.set(deliveryEntry.solution_id, deliveryEntry);
  }

  return {
    delivery_by_solution_id: deliveryBySolutionId,
  };
}
