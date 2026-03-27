import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { parse } from 'yaml';

export const DEFAULT_TECHNICAL_SOLUTION_MODULE_REGISTRY_PATH =
  '.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml';
export const SUPPORTED_TECHNICAL_SOLUTION_DETAIL_DOC_KINDS = ['contract', 'adr'];

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

  return value.map((entry) => String(entry ?? '').trim()).filter((entry) => entry.length > 0);
}

/**
 * Converts one absolute path to repository-relative slash form.
 * @param {string} absolutePath Absolute file path.
 * @returns {string}
 */
function toRepoRelativePath(absolutePath) {
  return normalizePathSeparators(relative(process.cwd(), absolutePath));
}

/**
 * Resolves one sync policy entry with stable defaults.
 * @param {unknown} value Raw policy entry value.
 * @returns {{classification: string, requires_sync: string[], recommends_sync: string[]}}
 */
function normalizeSyncPolicyEntry(value) {
  if (!value || typeof value !== 'object') {
    return {
      classification: 'unknown',
      requires_sync: [],
      recommends_sync: [],
    };
  }

  const policyEntry = /** @type {Record<string, unknown>} */ (value);
  return {
    classification: String(policyEntry.classification ?? '').trim() || 'unknown',
    requires_sync: toStringArray(policyEntry.requires_sync),
    recommends_sync: toStringArray(policyEntry.recommends_sync),
  };
}

/**
 * Infers one detail doc kind from its path.
 * Why: legacy registry entries were path-only contract docs; inference keeps them compatible.
 * @param {string} detailDocPath Repository-relative path.
 * @returns {string}
 */
function inferDetailDocKind(detailDocPath) {
  if (/\/adrs?\//u.test(detailDocPath)) {
    return 'adr';
  }

  return 'contract';
}

/**
 * Normalizes one detail doc entry.
 * @param {unknown} value Raw detail doc entry.
 * @returns {{path: string, kind: string}}
 */
function normalizeDetailDocEntry(value) {
  if (typeof value === 'string') {
    const normalizedPath = value.trim();
    return {
      path: normalizedPath,
      kind: inferDetailDocKind(normalizedPath),
    };
  }

  if (!value || typeof value !== 'object') {
    return {
      path: '',
      kind: 'contract',
    };
  }

  const detailDocRecord = /** @type {Record<string, unknown>} */ (value);
  const normalizedPath = String(detailDocRecord.path ?? '').trim();
  return {
    path: normalizedPath,
    kind: String(detailDocRecord.kind ?? inferDetailDocKind(normalizedPath)).trim() || 'contract',
  };
}

/**
 * Converts unknown input into a normalized detail doc catalog.
 * @param {unknown} value Raw detail doc input.
 * @returns {Array<{path: string, kind: string}>}
 */
function toDetailDocCatalog(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeDetailDocEntry(entry))
    .filter((entry) => entry.path.length > 0);
}

/**
 * Reads and normalizes the technical solution module registry payload.
 * @param {string} [registryPath] Repository-relative registry path.
 * @returns {{
 *   registry_path: string,
 *   schema_version: number | string | null,
 *   allowed_layers: string[],
 *   change_impact_classes: string[],
 *   sync_target_tokens: string[],
 *   modules: Array<{
 *     module_id: string,
 *     status: string,
 *     owner: string,
 *     layer: string,
 *     summary_doc: string,
 *     detail_docs: string[],
 *     detail_doc_catalog: Array<{path: string, kind: string}>,
 *     north_star_refs: string[],
 *     exports_contracts: string[],
 *     imports_contracts: string[],
 *     depends_on_modules: string[],
 *     load_triggers: string[],
 *     change_impact_policy: Record<string, {classification: string, requires_sync: string[], recommends_sync: string[]}>,
 *     context_budget: Record<string, unknown>,
 *   }>
 * } | null}
 */
export function loadTechnicalSolutionModuleRegistry(
  registryPath = DEFAULT_TECHNICAL_SOLUTION_MODULE_REGISTRY_PATH,
) {
  const absoluteRegistryPath = resolve(process.cwd(), registryPath);
  if (!existsSync(absoluteRegistryPath)) {
    return null;
  }

  const payload = parse(readFileSync(absoluteRegistryPath, 'utf8'));
  const rootRecord =
    payload && typeof payload === 'object' ? /** @type {Record<string, unknown>} */ (payload) : {};
  const modules = Array.isArray(rootRecord.modules) ? rootRecord.modules : [];

  return {
    registry_path: normalizePathSeparators(registryPath),
    schema_version:
      typeof rootRecord.schema_version === 'number' || typeof rootRecord.schema_version === 'string'
        ? rootRecord.schema_version
        : null,
    allowed_layers: toStringArray(rootRecord.allowed_layers),
    change_impact_classes: toStringArray(rootRecord.change_impact_classes),
    sync_target_tokens: toStringArray(rootRecord.sync_target_tokens),
    modules: modules.map((moduleValue) => {
      const moduleRecord =
        moduleValue && typeof moduleValue === 'object'
          ? /** @type {Record<string, unknown>} */ (moduleValue)
          : {};
      const rawPolicy =
        moduleRecord.change_impact_policy && typeof moduleRecord.change_impact_policy === 'object'
          ? /** @type {Record<string, unknown>} */ (moduleRecord.change_impact_policy)
          : {};
      /** @type {Record<string, {classification: string, requires_sync: string[], recommends_sync: string[]}>} */
      const normalizedPolicy = {};
      for (const [policyKey, policyValue] of Object.entries(rawPolicy)) {
        normalizedPolicy[policyKey] = normalizeSyncPolicyEntry(policyValue);
      }

      const detailDocCatalog = toDetailDocCatalog(moduleRecord.detail_docs);

      return {
        module_id: String(moduleRecord.module_id ?? '').trim(),
        status: String(moduleRecord.status ?? '').trim(),
        owner: String(moduleRecord.owner ?? '').trim(),
        layer: String(moduleRecord.layer ?? '').trim(),
        summary_doc: String(moduleRecord.summary_doc ?? '').trim(),
        detail_docs: detailDocCatalog.map((detailDocEntry) => detailDocEntry.path),
        detail_doc_catalog: detailDocCatalog,
        north_star_refs: toStringArray(moduleRecord.north_star_refs),
        exports_contracts: toStringArray(moduleRecord.exports_contracts),
        imports_contracts: toStringArray(moduleRecord.imports_contracts),
        depends_on_modules: toStringArray(moduleRecord.depends_on_modules),
        load_triggers: toStringArray(moduleRecord.load_triggers),
        change_impact_policy: normalizedPolicy,
        context_budget:
          moduleRecord.context_budget && typeof moduleRecord.context_budget === 'object'
            ? /** @type {Record<string, unknown>} */ (moduleRecord.context_budget)
            : {},
      };
    }),
  };
}

/**
 * Builds efficient lookup maps for one normalized registry payload.
 * @param {NonNullable<ReturnType<typeof loadTechnicalSolutionModuleRegistry>>} registry Normalized registry.
 * @returns {{
 *   module_by_id: Map<string, ReturnType<typeof loadTechnicalSolutionModuleRegistry>["modules"][number]>,
 *   module_by_summary_doc: Map<string, ReturnType<typeof loadTechnicalSolutionModuleRegistry>["modules"][number]>,
 *   module_by_detail_doc: Map<string, ReturnType<typeof loadTechnicalSolutionModuleRegistry>["modules"][number]>,
 *   detail_doc_by_path: Map<string, {module_id: string, path: string, kind: string}>,
 *   exporting_module_by_contract: Map<string, ReturnType<typeof loadTechnicalSolutionModuleRegistry>["modules"][number]>,
 *   direct_consumers_by_module_id: Map<string, string[]>,
 * }}
 */
export function buildTechnicalSolutionModuleIndex(registry) {
  const moduleById = new Map();
  const moduleBySummaryDoc = new Map();
  const moduleByDetailDoc = new Map();
  const detailDocByPath = new Map();
  const exportingModuleByContract = new Map();

  for (const moduleEntry of registry.modules) {
    moduleById.set(moduleEntry.module_id, moduleEntry);
    if (moduleEntry.summary_doc) {
      moduleBySummaryDoc.set(moduleEntry.summary_doc, moduleEntry);
    }
    for (const detailDocEntry of moduleEntry.detail_doc_catalog) {
      moduleByDetailDoc.set(detailDocEntry.path, moduleEntry);
      detailDocByPath.set(detailDocEntry.path, {
        module_id: moduleEntry.module_id,
        path: detailDocEntry.path,
        kind: detailDocEntry.kind,
      });
    }
    for (const contractId of moduleEntry.exports_contracts) {
      exportingModuleByContract.set(contractId, moduleEntry);
    }
  }

  const directConsumersByModuleId = new Map();
  for (const moduleEntry of registry.modules) {
    for (const importedContractId of moduleEntry.imports_contracts) {
      const exporter = exportingModuleByContract.get(importedContractId);
      if (!exporter) {
        continue;
      }
      const consumerSet = new Set(directConsumersByModuleId.get(exporter.module_id) ?? []);
      consumerSet.add(moduleEntry.module_id);
      directConsumersByModuleId.set(exporter.module_id, Array.from(consumerSet).sort());
    }
  }

  return {
    module_by_id: moduleById,
    module_by_summary_doc: moduleBySummaryDoc,
    module_by_detail_doc: moduleByDetailDoc,
    detail_doc_by_path: detailDocByPath,
    exporting_module_by_contract: exportingModuleByContract,
    direct_consumers_by_module_id: directConsumersByModuleId,
  };
}

/**
 * Resolves one path to repository-relative slash form.
 * @param {string} absolutePath Absolute path.
 * @returns {string}
 */
export function normalizeRepoRelativePath(absolutePath) {
  return toRepoRelativePath(absolutePath);
}
