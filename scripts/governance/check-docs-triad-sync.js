#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from './gate-output.js';
import {
  DEFAULT_TECHNICAL_SOLUTION_MODULE_REGISTRY_PATH,
  buildTechnicalSolutionModuleIndex,
  loadTechnicalSolutionModuleRegistry,
} from './technical-solution-module-registry.js';

const GATE_NAME = 'docs-triad-sync';
const PRD_DOC_PATH = '.repo-ai-governor/normative_knowledge_sources/product-requirements.md';
const SOLUTION_DOC_PATH =
  '.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md';
const ARCHITECTURE_DOC_PATH =
  '.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md';
const BRIEF_DOC_PATH =
  '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md';
const TRIAD_DOC_PATHS = [PRD_DOC_PATH, SOLUTION_DOC_PATH, ARCHITECTURE_DOC_PATH];
const BASE_MONITORED_DOC_PATHS = [...TRIAD_DOC_PATHS, BRIEF_DOC_PATH];
const MODULE_REGISTRY_OWNER_MODULE_ID = 'governance.technical-solution-registry';

/**
 * @typedef {{rule_id: string, message: string, details: Record<string, unknown>}} SyncFailure
 * @typedef {{
 *   module_id: string,
 *   change_kind: "summary_doc_change" | "contract_doc_change" | "adr_doc_change" | "registry_change",
 *   classification: string,
 *   changed_files: string[],
 *   required_sync_files: string[],
 *   recommended_sync_files: string[],
 *   missing_sync_files: string[],
 *   direct_consumers: string[],
 * }} ModuleImpact
 */

/**
 * Resolves CLI options.
 * @param {string[]} argv Raw argv list.
 * @returns {{format: "text" | "json", changedFiles: string[], moduleRegistryPath: string}}
 */
function resolveCliOptions(argv) {
  /** @type {{format: "text" | "json", changedFiles: string[], moduleRegistryPath: string}} */
  const options = {
    format: 'text',
    changedFiles: [],
    moduleRegistryPath: DEFAULT_TECHNICAL_SOLUTION_MODULE_REGISTRY_PATH,
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

    if (argument === '--changed-file') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--changed-file".');
      }
      options.changedFiles.push(nextValue);
      index += 1;
      continue;
    }

    if (argument.startsWith('--changed-file=')) {
      options.changedFiles.push(argument.slice('--changed-file='.length));
      continue;
    }

    if (argument === '--module-registry' || argument === '--registry') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error(`Missing value for "${argument}".`);
      }
      options.moduleRegistryPath = nextValue.trim();
      index += 1;
      continue;
    }

    if (argument.startsWith('--module-registry=')) {
      options.moduleRegistryPath = argument.slice('--module-registry='.length).trim();
      continue;
    }

    if (argument.startsWith('--registry=')) {
      options.moduleRegistryPath = argument.slice('--registry='.length).trim();
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
 * Collects changed file paths from git working tree.
 * @returns {string[]}
 */
function collectChangedFilesFromGit() {
  const changedFiles = new Set([
    ...runGitPathList(['diff', '--name-only', '--relative', '--cached', 'HEAD']),
    ...runGitPathList(['diff', '--name-only', '--relative']),
    ...runGitPathList(['ls-files', '--others', '--exclude-standard']),
  ]);

  return Array.from(changedFiles).sort();
}

/**
 * Runs one git command and returns line list.
 * @param {string[]} args Git args.
 * @returns {string[]}
 */
function runGitPathList(args) {
  try {
    const output = execFileSync('git', args, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return output
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => normalizeChangedFilePath(line));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to collect changed files from git (${args.join(' ')}): ${message}`);
  }
}

/**
 * Normalizes path separators to `/`.
 * @param {string} value Raw path.
 * @returns {string}
 */
function normalizePathSeparators(value) {
  return value.replace(/\\/gu, '/');
}

/**
 * Normalizes one changed file path to repository-relative slash form when possible.
 * @param {string} value Raw file path.
 * @returns {string}
 */
function normalizeChangedFilePath(value) {
  const normalizedValue = normalizePathSeparators(value.trim());
  const normalizedWorkingDirectory = normalizePathSeparators(process.cwd());
  const workingDirectoryPrefix = `${normalizedWorkingDirectory}/`;
  if (normalizedValue.startsWith(workingDirectoryPrefix)) {
    return normalizedValue.slice(workingDirectoryPrefix.length);
  }

  return normalizedValue;
}

/**
 * Reads one doc metadata date (`- Date:` or `- 日期：`).
 * @param {string} relativeDocPath Relative doc path.
 * @returns {{date: string | null, missing: boolean}}
 */
function readMetadataDate(relativeDocPath) {
  const absoluteDocPath = resolve(process.cwd(), relativeDocPath);
  if (!existsSync(absoluteDocPath)) {
    return { date: null, missing: true };
  }

  const content = readFileSync(absoluteDocPath, 'utf8');
  const matched = content.match(/^- (?:Date|日期)\s*[:：]\s*(\d{4}-\d{2}-\d{2})\s*$/imu);
  if (!matched) {
    return { date: null, missing: false };
  }

  return { date: matched[1], missing: false };
}

/**
 * Builds one failure record.
 * @param {string} ruleId Rule identifier.
 * @param {string} message Human-readable message.
 * @param {Record<string, unknown>} details Extra machine-readable details.
 * @returns {SyncFailure}
 */
function buildFailure(ruleId, message, details) {
  return {
    rule_id: ruleId,
    message,
    details,
  };
}

/**
 * Deduplicates and sorts a path list.
 * @param {string[]} values Raw values.
 * @returns {string[]}
 */
function uniqueSortedPaths(values) {
  return Array.from(new Set(values.filter((value) => value.length > 0))).sort();
}

/**
 * Maps one sync target token list to repository paths.
 * @param {string[]} targetTokens Sync target tokens.
 * @param {ReturnType<typeof loadTechnicalSolutionModuleRegistry>["modules"][number]} moduleEntry Module entry.
 * @param {NonNullable<ReturnType<typeof loadTechnicalSolutionModuleRegistry>>} registry Registry payload.
 * @param {ReturnType<typeof buildTechnicalSolutionModuleIndex>} registryIndex Registry index.
 * @returns {string[]}
 */
function resolveSyncTargets(targetTokens, moduleEntry, registry, registryIndex) {
  /** @type {string[]} */
  const resolvedTargets = [];

  for (const targetToken of targetTokens) {
    if (targetToken === 'summary_doc') {
      resolvedTargets.push(moduleEntry.summary_doc);
      continue;
    }

    if (targetToken === 'module_registry') {
      resolvedTargets.push(registry.registry_path);
      continue;
    }

    if (targetToken === 'direct_consumers') {
      const consumerSummaryDocs = (
        registryIndex.direct_consumers_by_module_id.get(moduleEntry.module_id) ?? []
      )
        .map(
          (consumerModuleId) => registryIndex.module_by_id.get(consumerModuleId)?.summary_doc ?? '',
        )
        .filter((summaryDocPath) => summaryDocPath.length > 0);
      resolvedTargets.push(...consumerSummaryDocs);
      continue;
    }

    if (targetToken === 'overall_technical_solution') {
      resolvedTargets.push(SOLUTION_DOC_PATH);
      continue;
    }

    if (targetToken === 'architecture_and_repo_layering') {
      resolvedTargets.push(ARCHITECTURE_DOC_PATH);
      continue;
    }

    if (targetToken === 'product_requirements') {
      resolvedTargets.push(PRD_DOC_PATH);
      continue;
    }

    if (targetToken === 'product_requirements_brief') {
      resolvedTargets.push(BRIEF_DOC_PATH);
    }
  }

  return uniqueSortedPaths(resolvedTargets);
}

/**
 * Builds one module impact descriptor.
 * @param {ReturnType<typeof loadTechnicalSolutionModuleRegistry>["modules"][number]} moduleEntry Module entry.
 * @param {"summary_doc_change" | "contract_doc_change" | "adr_doc_change" | "registry_change"} changeKind Impact change kind.
 * @param {string[]} changedFiles Changed files that triggered the impact.
 * @param {Set<string>} changedFileSet All changed files.
 * @param {NonNullable<ReturnType<typeof loadTechnicalSolutionModuleRegistry>>} registry Registry payload.
 * @param {ReturnType<typeof buildTechnicalSolutionModuleIndex>} registryIndex Registry index.
 * @returns {ModuleImpact}
 */
function buildModuleImpact(
  moduleEntry,
  changeKind,
  changedFiles,
  changedFileSet,
  registry,
  registryIndex,
) {
  const policy = moduleEntry.change_impact_policy[changeKind] ?? {
    classification: 'unknown',
    requires_sync: [],
    recommends_sync: [],
  };
  const requiredSyncFiles = resolveSyncTargets(
    policy.requires_sync,
    moduleEntry,
    registry,
    registryIndex,
  );
  const recommendedSyncFiles = resolveSyncTargets(
    policy.recommends_sync,
    moduleEntry,
    registry,
    registryIndex,
  );

  return {
    module_id: moduleEntry.module_id,
    change_kind: changeKind,
    classification: policy.classification,
    changed_files: uniqueSortedPaths(changedFiles),
    required_sync_files: requiredSyncFiles,
    recommended_sync_files: recommendedSyncFiles,
    missing_sync_files: requiredSyncFiles.filter((filePath) => !changedFileSet.has(filePath)),
    direct_consumers: registryIndex.direct_consumers_by_module_id.get(moduleEntry.module_id) ?? [],
  };
}

/**
 * Evaluates module impacts from the registry-aware solution docs.
 * @param {string[]} normalizedChangedFiles Repository-relative changed files.
 * @param {Set<string>} changedFileSet Changed file set.
 * @param {SyncFailure[]} failures Shared failure accumulator.
 * @param {Set<string>} missingSyncFileSet Shared missing sync accumulator.
 * @param {string} moduleRegistryPath Configured module registry path.
 * @returns {{moduleImpacts: ModuleImpact[], monitoredModulePaths: string[]}}
 */
function evaluateModuleImpacts(changedFileSet, failures, missingSyncFileSet, moduleRegistryPath) {
  /** @type {ModuleImpact[]} */
  const moduleImpacts = [];
  /** @type {string[]} */
  const monitoredModulePaths = [normalizeChangedFilePath(moduleRegistryPath)];
  const registry = loadTechnicalSolutionModuleRegistry(moduleRegistryPath);

  if (!registry) {
    failures.push(
      buildFailure(
        'technical_solution_module_registry_missing',
        'Technical solution module registry is required for module impact classification.',
        {
          registry_path: normalizeChangedFilePath(moduleRegistryPath),
        },
      ),
    );
    return {
      moduleImpacts,
      monitoredModulePaths,
    };
  }

  monitoredModulePaths.push(registry.registry_path);
  const registryIndex = buildTechnicalSolutionModuleIndex(registry);

  for (const moduleEntry of registry.modules) {
    monitoredModulePaths.push(moduleEntry.summary_doc, ...moduleEntry.detail_docs);

    if (changedFileSet.has(moduleEntry.summary_doc)) {
      moduleImpacts.push(
        buildModuleImpact(
          moduleEntry,
          'summary_doc_change',
          [moduleEntry.summary_doc],
          changedFileSet,
          registry,
          registryIndex,
        ),
      );
    }

    const changedContractDocs = moduleEntry.detail_doc_catalog
      .filter((detailDocEntry) => detailDocEntry.kind === 'contract')
      .map((detailDocEntry) => detailDocEntry.path)
      .filter((docPath) => changedFileSet.has(docPath));
    if (changedContractDocs.length > 0) {
      const impact = buildModuleImpact(
        moduleEntry,
        'contract_doc_change',
        changedContractDocs,
        changedFileSet,
        registry,
        registryIndex,
      );
      moduleImpacts.push(impact);

      if (impact.missing_sync_files.length > 0) {
        for (const filePath of impact.missing_sync_files) {
          missingSyncFileSet.add(filePath);
        }
        failures.push(
          buildFailure(
            'module_contract_sync_missing',
            'Module contract changes must synchronize the producer module overview in the same changeset.',
            {
              module_id: impact.module_id,
              classification: impact.classification,
              changed_files: impact.changed_files,
              required_sync_files: impact.required_sync_files,
              missing_sync_files: impact.missing_sync_files,
              recommended_sync_files: impact.recommended_sync_files,
              direct_consumers: impact.direct_consumers,
            },
          ),
        );
      }
    }

    const changedAdrDocs = moduleEntry.detail_doc_catalog
      .filter((detailDocEntry) => detailDocEntry.kind === 'adr')
      .map((detailDocEntry) => detailDocEntry.path)
      .filter((docPath) => changedFileSet.has(docPath));
    if (changedAdrDocs.length > 0) {
      moduleImpacts.push(
        buildModuleImpact(
          moduleEntry,
          'adr_doc_change',
          changedAdrDocs,
          changedFileSet,
          registry,
          registryIndex,
        ),
      );
    }
  }

  if (changedFileSet.has(registry.registry_path)) {
    const registryOwnerModule = registryIndex.module_by_id.get(MODULE_REGISTRY_OWNER_MODULE_ID);
    if (registryOwnerModule) {
      moduleImpacts.push(
        buildModuleImpact(
          registryOwnerModule,
          'registry_change',
          [registry.registry_path],
          changedFileSet,
          registry,
          registryIndex,
        ),
      );
    }
  }

  return {
    moduleImpacts: moduleImpacts.sort((left, right) => {
      const moduleOrder = left.module_id.localeCompare(right.module_id);
      if (moduleOrder !== 0) {
        return moduleOrder;
      }

      return left.change_kind.localeCompare(right.change_kind);
    }),
    monitoredModulePaths: uniqueSortedPaths(monitoredModulePaths),
  };
}

/**
 * Evaluates spec sync contract and returns structured result.
 * @param {{changedFiles: string[], moduleRegistryPath: string}} options Input options.
 * @returns {{
 *   status: "pass" | "fail",
 *   failures: SyncFailure[],
 *   changed_files: string[],
 *   missing_sync_files: string[],
 *   module_impacts: ModuleImpact[],
 * }}
 */
function evaluateSpecSync(options) {
  const changedFiles =
    options.changedFiles.length > 0 ? options.changedFiles : collectChangedFilesFromGit();
  const normalizedChangedFiles = uniqueSortedPaths(
    changedFiles.map((filePath) => normalizeChangedFilePath(filePath)),
  );
  const changedFileSet = new Set(normalizedChangedFiles);

  /** @type {SyncFailure[]} */
  const failures = [];
  const missingSyncFileSet = new Set();

  const triadDateMap = {};
  let hasMissingTriadDoc = false;
  let hasMissingTriadDate = false;
  for (const triadDocPath of TRIAD_DOC_PATHS) {
    const metadataDate = readMetadataDate(triadDocPath);
    if (metadataDate.missing) {
      hasMissingTriadDoc = true;
      failures.push(
        buildFailure('triad_doc_missing', 'Triad document is missing.', {
          doc_path: triadDocPath,
        }),
      );
      continue;
    }

    if (!metadataDate.date) {
      hasMissingTriadDate = true;
      failures.push(
        buildFailure(
          'triad_date_metadata_missing',
          'Triad document missing `Date/日期` metadata.',
          {
            doc_path: triadDocPath,
          },
        ),
      );
      continue;
    }

    triadDateMap[triadDocPath] = metadataDate.date;
  }

  if (!hasMissingTriadDoc && !hasMissingTriadDate) {
    const uniqueTriadDates = Array.from(new Set(Object.values(triadDateMap)));
    if (uniqueTriadDates.length > 1) {
      failures.push(
        buildFailure('triad_date_metadata_mismatch', 'Triad document dates must be synchronized.', {
          triad_dates: triadDateMap,
        }),
      );
    }
  }

  const changedTriadDocs = TRIAD_DOC_PATHS.filter((docPath) => changedFileSet.has(docPath));
  if (changedTriadDocs.length > 0 && changedTriadDocs.length < TRIAD_DOC_PATHS.length) {
    const missingTriadDocs = TRIAD_DOC_PATHS.filter((docPath) => !changedFileSet.has(docPath));
    for (const docPath of missingTriadDocs) {
      missingSyncFileSet.add(docPath);
    }

    failures.push(
      buildFailure(
        'triad_changeset_incomplete',
        'When one triad document changes, all triad documents must be updated in the same changeset.',
        {
          changed_files: changedTriadDocs,
          required_files: TRIAD_DOC_PATHS,
          missing_sync_files: missingTriadDocs,
        },
      ),
    );
  }

  const prdChanged = changedFileSet.has(PRD_DOC_PATH);
  const briefChanged = changedFileSet.has(BRIEF_DOC_PATH);
  if (prdChanged && !briefChanged) {
    missingSyncFileSet.add(BRIEF_DOC_PATH);
    failures.push(
      buildFailure(
        'prd_brief_sync_missing',
        'When product-requirements.md changes, product-requirements-brief.md must change in the same changeset.',
        {
          changed_files: [PRD_DOC_PATH],
          missing_sync_files: [BRIEF_DOC_PATH],
        },
      ),
    );
  }

  const { moduleImpacts, monitoredModulePaths } = evaluateModuleImpacts(
    changedFileSet,
    failures,
    missingSyncFileSet,
    options.moduleRegistryPath,
  );

  const monitoredDocPaths = uniqueSortedPaths([
    ...BASE_MONITORED_DOC_PATHS,
    ...monitoredModulePaths,
  ]);

  return {
    status: failures.length === 0 ? 'pass' : 'fail',
    failures,
    changed_files: monitoredDocPaths.filter((docPath) => changedFileSet.has(docPath)),
    missing_sync_files: Array.from(missingSyncFileSet).sort(),
    module_impacts: moduleImpacts,
  };
}

/**
 * Prints text-mode result for humans.
 * @param {{
 *   status: "pass" | "fail",
 *   failures: SyncFailure[],
 *   changed_files: string[],
 *   missing_sync_files: string[],
 *   module_impacts: ModuleImpact[],
 * }} result
 */
function printTextResult(result) {
  if (result.status === 'pass') {
    gatePass(
      GATE_NAME,
      `Triad/module sync check passed. changed_files=${result.changed_files.length} module_impacts=${result.module_impacts.length}`,
    );
    if (result.changed_files.length > 0) {
      gateInfo(GATE_NAME, `changed files: ${result.changed_files.join(', ')}`);
    }
  } else {
    gateFail(GATE_NAME, 'Triad/module sync check failed.');
    for (const failure of result.failures) {
      gateFail(GATE_NAME, `- rule=${failure.rule_id} message="${failure.message}"`);
      gateInfo(GATE_NAME, `  details=${JSON.stringify(failure.details)}`);
    }
    if (result.missing_sync_files.length > 0) {
      gateInfo(GATE_NAME, `missing_sync_files=${result.missing_sync_files.join(', ')}`);
    }
  }

  for (const impact of result.module_impacts) {
    gateInfo(
      GATE_NAME,
      `module_impact module=${impact.module_id} change=${impact.change_kind} classification=${impact.classification}`,
    );
    if (impact.required_sync_files.length > 0) {
      gateInfo(GATE_NAME, `  required_sync_files=${impact.required_sync_files.join(', ')}`);
    }
    if (impact.recommended_sync_files.length > 0) {
      gateInfo(GATE_NAME, `  recommended_sync_files=${impact.recommended_sync_files.join(', ')}`);
    }
  }
}

const options = resolveCliOptions(process.argv.slice(2));
const result = evaluateSpecSync(options);

if (options.format === 'json') {
  console.info(JSON.stringify(result, null, 2));
} else {
  printTextResult(result);
}

if (result.status === 'fail') {
  process.exit(1);
}
