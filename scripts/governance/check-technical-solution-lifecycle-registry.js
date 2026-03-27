#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parse } from 'yaml';

import { gateFail, gateInfo, gatePass } from './gate-output.js';
import {
  DEFAULT_TECHNICAL_SOLUTION_LIFECYCLE_REGISTRY_PATH,
  SUPPORTED_TECHNICAL_SOLUTION_LIFECYCLE_STATUSES,
  buildTechnicalSolutionLifecycleIndex,
  loadTechnicalSolutionLifecycleRegistry,
} from './technical-solution-lifecycle-registry.js';
import {
  DEFAULT_TECHNICAL_SOLUTION_MODULE_REGISTRY_PATH,
  loadTechnicalSolutionModuleRegistry,
} from './technical-solution-module-registry.js';

const GATE_NAME = 'technical-solution-lifecycle-registry';
const DEFAULT_MANIFEST_PATH =
  '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml';
const STATUS_REQUIRES_REVIEW = new Set(['review_pending', 'approved', 'active', 'superseded']);
const STATUS_REQUIRES_APPROVAL = new Set(['approved', 'active', 'superseded']);

/**
 * Resolves CLI options.
 * @param {string[]} argv Raw args.
 * @returns {{format: "text" | "json", registryPath: string, moduleRegistryPath: string, manifestPath: string}}
 */
function resolveCliOptions(argv) {
  /** @type {{format: "text" | "json", registryPath: string, moduleRegistryPath: string, manifestPath: string}} */
  const options = {
    format: 'text',
    registryPath: DEFAULT_TECHNICAL_SOLUTION_LIFECYCLE_REGISTRY_PATH,
    moduleRegistryPath: DEFAULT_TECHNICAL_SOLUTION_MODULE_REGISTRY_PATH,
    manifestPath: DEFAULT_MANIFEST_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--format') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--format".');
      }
      options.format = readFormatValue(nextValue);
      index += 1;
      continue;
    }

    if (argument.startsWith('--format=')) {
      options.format = readFormatValue(argument.slice('--format='.length));
      continue;
    }

    if (argument === '--registry') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--registry".');
      }
      options.registryPath = nextValue.trim();
      index += 1;
      continue;
    }

    if (argument.startsWith('--registry=')) {
      options.registryPath = argument.slice('--registry='.length).trim();
      continue;
    }

    if (argument === '--module-registry') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--module-registry".');
      }
      options.moduleRegistryPath = nextValue.trim();
      index += 1;
      continue;
    }

    if (argument.startsWith('--module-registry=')) {
      options.moduleRegistryPath = argument.slice('--module-registry='.length).trim();
      continue;
    }

    if (argument === '--manifest') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--manifest".');
      }
      options.manifestPath = nextValue.trim();
      index += 1;
      continue;
    }

    if (argument.startsWith('--manifest=')) {
      options.manifestPath = argument.slice('--manifest='.length).trim();
      continue;
    }

    throw new Error(`Unsupported option: ${argument}`);
  }

  return options;
}

/**
 * Validates one output format value.
 * @param {string} value Raw format value.
 * @returns {"text" | "json"}
 */
function readFormatValue(value) {
  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue !== 'text' && normalizedValue !== 'json') {
    throw new Error(`Unsupported format "${value}". Expected "text" or "json".`);
  }

  return normalizedValue;
}

/**
 * Builds one failure record.
 * @param {string} ruleId Rule identifier.
 * @param {string} message Human-readable message.
 * @param {Record<string, unknown>} details Extra details.
 * @returns {{rule_id: string, message: string, details: Record<string, unknown>}}
 */
function buildFailure(ruleId, message, details) {
  return {
    rule_id: ruleId,
    message,
    details,
  };
}

/**
 * Loads the manifest path catalog with active/frozen status information.
 * @param {string} manifestPath Repository-relative manifest path.
 * @returns {{all_paths: Set<string>, active_paths: Set<string>}}
 */
function loadManifestPathCatalog(manifestPath) {
  const absoluteManifestPath = resolve(process.cwd(), manifestPath);
  if (!existsSync(absoluteManifestPath)) {
    return {
      all_paths: new Set(),
      active_paths: new Set(),
    };
  }

  const payload = parse(readFileSync(absoluteManifestPath, 'utf8'));
  const rootRecord =
    payload && typeof payload === 'object' ? /** @type {Record<string, unknown>} */ (payload) : {};
  const allPaths = new Set();
  const activePaths = new Set();
  const entryGroups = [
    Array.isArray(rootRecord.documents) ? rootRecord.documents : [],
    Array.isArray(rootRecord.external_required_inputs) ? rootRecord.external_required_inputs : [],
  ];

  for (const entryGroup of entryGroups) {
    for (const entryValue of entryGroup) {
      const entryRecord =
        entryValue && typeof entryValue === 'object'
          ? /** @type {Record<string, unknown>} */ (entryValue)
          : {};
      const pathValue = String(entryRecord.path ?? '')
        .trim()
        .replace(/\\/gu, '/');
      const statusValue = String(entryRecord.status ?? '').trim();
      if (!pathValue) {
        continue;
      }
      allPaths.add(pathValue);
      if (statusValue === 'active' || statusValue === 'frozen') {
        activePaths.add(pathValue);
      }
    }
  }

  return {
    all_paths: allPaths,
    active_paths: activePaths,
  };
}

/**
 * Evaluates one lifecycle registry payload.
 * @param {{registryPath: string, moduleRegistryPath: string, manifestPath: string}} options Gate options.
 * @returns {{status: "pass" | "fail", failures: Array<{rule_id: string, message: string, details: Record<string, unknown>}>, solutions_scanned: number, draft_paths_scanned: number, final_paths_scanned: number, registry_path: string}}
 */
function evaluateLifecycleRegistry(options) {
  const lifecycleRegistry = loadTechnicalSolutionLifecycleRegistry(options.registryPath);
  /** @type {Array<{rule_id: string, message: string, details: Record<string, unknown>}>} */
  const failures = [];

  if (!lifecycleRegistry) {
    failures.push(
      buildFailure(
        'lifecycle_registry_missing',
        'Technical solution lifecycle registry is missing.',
        {
          registry_path: options.registryPath,
        },
      ),
    );
    return {
      status: 'fail',
      failures,
      solutions_scanned: 0,
      draft_paths_scanned: 0,
      final_paths_scanned: 0,
      registry_path: options.registryPath,
    };
  }

  const moduleRegistry = loadTechnicalSolutionModuleRegistry(options.moduleRegistryPath);
  if (!moduleRegistry) {
    failures.push(
      buildFailure('module_registry_missing', 'Technical solution module registry is missing.', {
        registry_path: options.moduleRegistryPath,
      }),
    );
  }

  const manifestCatalog = loadManifestPathCatalog(options.manifestPath);
  const solutionIdSet = new Set();
  const draftPathSet = new Set();
  const finalPathSet = new Set();

  for (const solutionEntry of lifecycleRegistry.solutions) {
    if (!solutionEntry.solution_id) {
      failures.push(
        buildFailure('solution_id_missing', 'Lifecycle entry is missing solution_id.', {
          registry_path: lifecycleRegistry.registry_path,
        }),
      );
      continue;
    }

    if (solutionIdSet.has(solutionEntry.solution_id)) {
      failures.push(
        buildFailure('duplicate_solution_id', 'solution_id must be unique.', {
          solution_id: solutionEntry.solution_id,
        }),
      );
    }
    solutionIdSet.add(solutionEntry.solution_id);

    if (
      !solutionEntry.status ||
      !SUPPORTED_TECHNICAL_SOLUTION_LIFECYCLE_STATUSES.includes(solutionEntry.status) ||
      (lifecycleRegistry.allowed_statuses.length > 0 &&
        !lifecycleRegistry.allowed_statuses.includes(solutionEntry.status))
    ) {
      failures.push(
        buildFailure('solution_status_invalid', 'Lifecycle status is invalid.', {
          solution_id: solutionEntry.solution_id,
          status: solutionEntry.status,
          allowed_statuses:
            lifecycleRegistry.allowed_statuses.length > 0
              ? lifecycleRegistry.allowed_statuses
              : SUPPORTED_TECHNICAL_SOLUTION_LIFECYCLE_STATUSES,
        }),
      );
    }

    if (solutionEntry.draft_paths.length === 0 && solutionEntry.final_paths.length === 0) {
      failures.push(
        buildFailure(
          'solution_paths_missing',
          'Lifecycle entry must declare draft_paths or final_paths.',
          {
            solution_id: solutionEntry.solution_id,
          },
        ),
      );
    }

    if (
      (solutionEntry.status === 'active' || solutionEntry.status === 'superseded') &&
      solutionEntry.north_star_refs.length === 0
    ) {
      failures.push(
        buildFailure(
          'north_star_refs_missing',
          'Active lifecycle entries must declare north_star_refs.',
          {
            solution_id: solutionEntry.solution_id,
          },
        ),
      );
    }

    if (
      STATUS_REQUIRES_REVIEW.has(solutionEntry.status) &&
      solutionEntry.review_paths.length === 0
    ) {
      failures.push(
        buildFailure('review_paths_missing', 'Lifecycle status requires review_paths evidence.', {
          solution_id: solutionEntry.solution_id,
          status: solutionEntry.status,
        }),
      );
    }

    if (
      STATUS_REQUIRES_APPROVAL.has(solutionEntry.status) &&
      (!solutionEntry.approved_at || !solutionEntry.approved_by)
    ) {
      failures.push(
        buildFailure(
          'approval_metadata_missing',
          'Lifecycle status requires approved_at and approved_by.',
          {
            solution_id: solutionEntry.solution_id,
            status: solutionEntry.status,
          },
        ),
      );
    }

    if (solutionEntry.status === 'draft' && solutionEntry.final_paths.length > 0) {
      failures.push(
        buildFailure('draft_entry_has_final_paths', 'Draft entries must not declare final_paths.', {
          solution_id: solutionEntry.solution_id,
          final_paths: solutionEntry.final_paths,
        }),
      );
    }

    if (solutionEntry.status === 'review_pending' && solutionEntry.final_paths.length > 0) {
      failures.push(
        buildFailure(
          'review_pending_entry_has_final_paths',
          'review_pending entries must not declare final_paths.',
          {
            solution_id: solutionEntry.solution_id,
            final_paths: solutionEntry.final_paths,
          },
        ),
      );
    }

    if (solutionEntry.status === 'approved' && solutionEntry.final_paths.length > 0) {
      failures.push(
        buildFailure(
          'approved_entry_has_final_paths',
          'approved entries must promote before declaring final_paths.',
          {
            solution_id: solutionEntry.solution_id,
            final_paths: solutionEntry.final_paths,
          },
        ),
      );
    }

    if (
      (solutionEntry.status === 'draft' || solutionEntry.status === 'review_pending') &&
      solutionEntry.draft_paths.length === 0
    ) {
      failures.push(
        buildFailure(
          'draft_paths_missing',
          'Draft-like lifecycle entries must declare draft_paths.',
          {
            solution_id: solutionEntry.solution_id,
            status: solutionEntry.status,
          },
        ),
      );
    }

    if (
      (solutionEntry.status === 'active' || solutionEntry.status === 'superseded') &&
      solutionEntry.final_paths.length === 0
    ) {
      failures.push(
        buildFailure(
          'final_paths_missing',
          'Active/superseded lifecycle entries must declare final_paths.',
          {
            solution_id: solutionEntry.solution_id,
            status: solutionEntry.status,
          },
        ),
      );
    }

    for (const targetModuleId of solutionEntry.target_module_ids) {
      if (
        !moduleRegistry?.modules.some((moduleEntry) => moduleEntry.module_id === targetModuleId)
      ) {
        failures.push(
          buildFailure(
            'target_module_unresolved',
            'target_module_ids must resolve to existing modules.',
            {
              solution_id: solutionEntry.solution_id,
              target_module_id: targetModuleId,
            },
          ),
        );
      }
    }

    for (const draftPath of solutionEntry.draft_paths) {
      if (draftPathSet.has(draftPath)) {
        failures.push(
          buildFailure(
            'duplicate_draft_path',
            'draft_paths must be unique across lifecycle entries.',
            {
              solution_id: solutionEntry.solution_id,
              draft_path: draftPath,
            },
          ),
        );
      }
      draftPathSet.add(draftPath);

      if (!draftPath.startsWith('.repo-ai-governor/draft/')) {
        failures.push(
          buildFailure(
            'draft_path_outside_draft_root',
            'draft_paths must stay under .repo-ai-governor/draft/.',
            {
              solution_id: solutionEntry.solution_id,
              draft_path: draftPath,
            },
          ),
        );
      }

      if (!existsSync(resolve(process.cwd(), draftPath))) {
        failures.push(
          buildFailure('draft_path_missing', 'draft_paths entry does not exist.', {
            solution_id: solutionEntry.solution_id,
            draft_path: draftPath,
          }),
        );
      }

      if (manifestCatalog.all_paths.has(draftPath)) {
        failures.push(
          buildFailure(
            'draft_path_registered_in_manifest',
            'draft_paths must not be registered in manifest.',
            {
              solution_id: solutionEntry.solution_id,
              draft_path: draftPath,
            },
          ),
        );
      }
    }

    for (const reviewPath of solutionEntry.review_paths) {
      if (!existsSync(resolve(process.cwd(), reviewPath))) {
        failures.push(
          buildFailure('review_path_missing', 'review_paths entry does not exist.', {
            solution_id: solutionEntry.solution_id,
            review_path: reviewPath,
          }),
        );
      }
    }

    for (const finalPath of solutionEntry.final_paths) {
      if (finalPathSet.has(finalPath)) {
        failures.push(
          buildFailure(
            'duplicate_final_path',
            'final_paths must be unique across lifecycle entries.',
            {
              solution_id: solutionEntry.solution_id,
              final_path: finalPath,
            },
          ),
        );
      }
      finalPathSet.add(finalPath);

      if (finalPath.startsWith('.repo-ai-governor/draft/')) {
        failures.push(
          buildFailure('final_path_inside_draft_root', 'final_paths must not point into draft/.', {
            solution_id: solutionEntry.solution_id,
            final_path: finalPath,
          }),
        );
      }

      if (!existsSync(resolve(process.cwd(), finalPath))) {
        failures.push(
          buildFailure('final_path_missing', 'final_paths entry does not exist.', {
            solution_id: solutionEntry.solution_id,
            final_path: finalPath,
          }),
        );
      }

      if (!manifestCatalog.active_paths.has(finalPath)) {
        failures.push(
          buildFailure(
            'final_path_not_manifest_registered',
            'final_paths must be registered as active/frozen in manifest.',
            {
              solution_id: solutionEntry.solution_id,
              final_path: finalPath,
            },
          ),
        );
      }
    }
  }

  const lifecycleIndex = buildTechnicalSolutionLifecycleIndex(lifecycleRegistry);

  for (const solutionEntry of lifecycleRegistry.solutions) {
    for (const supersededId of solutionEntry.supersedes) {
      if (
        supersededId === solutionEntry.solution_id ||
        !lifecycleIndex.solution_by_id.has(supersededId)
      ) {
        failures.push(
          buildFailure(
            'supersedes_reference_invalid',
            'supersedes must point to another known solution_id.',
            {
              solution_id: solutionEntry.solution_id,
              supersedes: supersededId,
            },
          ),
        );
      }
    }

    if (solutionEntry.status === 'superseded') {
      if (!solutionEntry.superseded_by) {
        failures.push(
          buildFailure('superseded_by_missing', 'superseded entries must declare superseded_by.', {
            solution_id: solutionEntry.solution_id,
          }),
        );
      } else if (
        solutionEntry.superseded_by === solutionEntry.solution_id ||
        !lifecycleIndex.solution_by_id.has(solutionEntry.superseded_by)
      ) {
        failures.push(
          buildFailure(
            'superseded_by_invalid',
            'superseded_by must point to another known solution_id.',
            {
              solution_id: solutionEntry.solution_id,
              superseded_by: solutionEntry.superseded_by,
            },
          ),
        );
      }
    }
  }

  return {
    status: failures.length === 0 ? 'pass' : 'fail',
    failures,
    solutions_scanned: lifecycleRegistry.solutions.length,
    draft_paths_scanned: Array.from(draftPathSet).length,
    final_paths_scanned: Array.from(finalPathSet).length,
    registry_path: lifecycleRegistry.registry_path,
  };
}

/**
 * Prints one human-readable result.
 * @param {{status: "pass" | "fail", failures: Array<{rule_id: string, message: string, details: Record<string, unknown>}>, solutions_scanned: number, draft_paths_scanned: number, final_paths_scanned: number, registry_path: string}} result
 */
function printTextResult(result) {
  if (result.status === 'pass') {
    gatePass(
      GATE_NAME,
      `Lifecycle validation passed. solutions=${result.solutions_scanned} drafts=${result.draft_paths_scanned} finals=${result.final_paths_scanned}`,
    );
    gateInfo(GATE_NAME, `registry_path=${result.registry_path}`);
    return;
  }

  gateFail(GATE_NAME, 'Lifecycle validation failed.');
  for (const failure of result.failures) {
    gateFail(GATE_NAME, `- rule=${failure.rule_id} message="${failure.message}"`);
    gateInfo(GATE_NAME, `  details=${JSON.stringify(failure.details)}`);
  }
}

const options = resolveCliOptions(process.argv.slice(2));
const result = evaluateLifecycleRegistry(options);

if (options.format === 'json') {
  console.info(JSON.stringify(result, null, 2));
} else {
  printTextResult(result);
}

if (result.status === 'fail') {
  process.exit(1);
}
