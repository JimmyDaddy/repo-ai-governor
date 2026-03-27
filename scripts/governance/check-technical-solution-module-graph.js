#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from './gate-output.js';
import {
  DEFAULT_TECHNICAL_SOLUTION_MODULE_REGISTRY_PATH,
  SUPPORTED_TECHNICAL_SOLUTION_DETAIL_DOC_KINDS,
  buildTechnicalSolutionModuleIndex,
  loadTechnicalSolutionModuleRegistry,
} from './technical-solution-module-registry.js';

const GATE_NAME = 'technical-solution-module-graph';

/**
 * Resolves CLI options.
 * @param {string[]} argv Raw args.
 * @returns {{format: "text" | "json", registryPath: string}}
 */
function resolveCliOptions(argv) {
  /** @type {{format: "text" | "json", registryPath: string}} */
  const options = {
    format: 'text',
    registryPath: DEFAULT_TECHNICAL_SOLUTION_MODULE_REGISTRY_PATH,
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

    throw new Error(`Unsupported option: ${argument}`);
  }

  return options;
}

/**
 * Validates one output format value.
 * @param {string} value Raw format string.
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
 * Detects cycles in one directed graph.
 * @param {Map<string, string[]>} dependencyMap Directed adjacency map.
 * @returns {string[][]}
 */
function detectCycles(dependencyMap) {
  const visiting = new Set();
  const visited = new Set();
  /** @type {string[]} */
  const pathStack = [];
  /** @type {string[][]} */
  const cycles = [];

  /**
   * Walks one graph node.
   * @param {string} nodeId Current node id.
   */
  function walk(nodeId) {
    if (visiting.has(nodeId)) {
      const cycleStartIndex = pathStack.indexOf(nodeId);
      const cyclePath = [...pathStack.slice(cycleStartIndex), nodeId];
      cycles.push(cyclePath);
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);
    pathStack.push(nodeId);

    for (const dependencyId of dependencyMap.get(nodeId) ?? []) {
      walk(dependencyId);
    }

    pathStack.pop();
    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  for (const nodeId of dependencyMap.keys()) {
    walk(nodeId);
  }

  return cycles;
}

/**
 * Evaluates one module registry payload.
 * @param {{registryPath: string}} options Gate options.
 * @returns {{status: "pass" | "fail", failures: Array<{rule_id: string, message: string, details: Record<string, unknown>}>, modules_scanned: number, contracts_scanned: number, registry_path: string}}
 */
function evaluateModuleGraph(options) {
  const registry =
    loadTechnicalSolutionModuleRegistry(options.registryPath) ??
    (() => {
      const absoluteRegistryPath = resolve(process.cwd(), options.registryPath);
      return existsSync(absoluteRegistryPath) ? null : null;
    })();

  /** @type {Array<{rule_id: string, message: string, details: Record<string, unknown>}>} */
  const failures = [];

  if (!registry) {
    failures.push(
      buildFailure('module_registry_missing', 'Technical solution module registry is missing.', {
        registry_path: options.registryPath,
      }),
    );
    return {
      status: 'fail',
      failures,
      modules_scanned: 0,
      contracts_scanned: 0,
      registry_path: options.registryPath,
    };
  }

  const moduleIdSet = new Set();
  const exportContractSet = new Set();
  const detailDocPathSet = new Set();
  const dependencyMap = new Map();

  for (const moduleEntry of registry.modules) {
    if (!moduleEntry.module_id) {
      failures.push(
        buildFailure('module_id_missing', 'Module entry is missing module_id.', {
          registry_path: registry.registry_path,
        }),
      );
      continue;
    }

    if (moduleIdSet.has(moduleEntry.module_id)) {
      failures.push(
        buildFailure('duplicate_module_id', 'Module id must be unique.', {
          module_id: moduleEntry.module_id,
        }),
      );
    }
    moduleIdSet.add(moduleEntry.module_id);

    if (!moduleEntry.layer || !registry.allowed_layers.includes(moduleEntry.layer)) {
      failures.push(
        buildFailure('module_layer_invalid', 'Module layer must exist in allowed_layers.', {
          module_id: moduleEntry.module_id,
          layer: moduleEntry.layer,
          allowed_layers: registry.allowed_layers,
        }),
      );
    }

    if (!moduleEntry.summary_doc) {
      failures.push(
        buildFailure('summary_doc_missing', 'Module must define summary_doc.', {
          module_id: moduleEntry.module_id,
        }),
      );
    } else if (!existsSync(resolve(process.cwd(), moduleEntry.summary_doc))) {
      failures.push(
        buildFailure('summary_doc_path_missing', 'summary_doc path does not exist.', {
          module_id: moduleEntry.module_id,
          summary_doc: moduleEntry.summary_doc,
        }),
      );
    }

    let contractDetailDocCount = 0;
    for (const detailDocEntry of moduleEntry.detail_doc_catalog) {
      if (!SUPPORTED_TECHNICAL_SOLUTION_DETAIL_DOC_KINDS.includes(detailDocEntry.kind)) {
        failures.push(
          buildFailure('detail_doc_kind_invalid', 'detail_docs entry kind is invalid.', {
            module_id: moduleEntry.module_id,
            detail_doc: detailDocEntry.path,
            kind: detailDocEntry.kind,
            allowed_kinds: SUPPORTED_TECHNICAL_SOLUTION_DETAIL_DOC_KINDS,
          }),
        );
      }

      if (detailDocPathSet.has(detailDocEntry.path)) {
        failures.push(
          buildFailure(
            'duplicate_detail_doc_path',
            'detail_docs paths must be unique across modules.',
            {
              module_id: moduleEntry.module_id,
              detail_doc: detailDocEntry.path,
            },
          ),
        );
      }
      detailDocPathSet.add(detailDocEntry.path);

      if (!existsSync(resolve(process.cwd(), detailDocEntry.path))) {
        failures.push(
          buildFailure('detail_doc_path_missing', 'detail_docs entry does not exist.', {
            module_id: moduleEntry.module_id,
            detail_doc: detailDocEntry.path,
            kind: detailDocEntry.kind,
          }),
        );
      }

      if (detailDocEntry.kind === 'contract') {
        contractDetailDocCount += 1;
      }
    }

    if (moduleEntry.exports_contracts.length > 0 && contractDetailDocCount === 0) {
      failures.push(
        buildFailure(
          'contract_detail_doc_missing',
          'Modules that export contracts must declare at least one contract detail doc.',
          {
            module_id: moduleEntry.module_id,
            exports_contracts: moduleEntry.exports_contracts,
          },
        ),
      );
    }

    if (moduleEntry.north_star_refs.length === 0) {
      failures.push(
        buildFailure('north_star_refs_missing', 'Module must declare north_star_refs.', {
          module_id: moduleEntry.module_id,
        }),
      );
    }

    for (const contractId of moduleEntry.exports_contracts) {
      if (exportContractSet.has(contractId)) {
        failures.push(
          buildFailure('duplicate_export_contract', 'Exported contract ids must be unique.', {
            module_id: moduleEntry.module_id,
            contract_id: contractId,
          }),
        );
      }
      exportContractSet.add(contractId);
    }

    dependencyMap.set(moduleEntry.module_id, [...moduleEntry.depends_on_modules]);
  }

  const registryIndex = buildTechnicalSolutionModuleIndex(registry);

  for (const moduleEntry of registry.modules) {
    for (const importedContractId of moduleEntry.imports_contracts) {
      if (!registryIndex.exporting_module_by_contract.has(importedContractId)) {
        failures.push(
          buildFailure(
            'import_contract_unresolved',
            'Imported contract must resolve to an exported contract.',
            {
              module_id: moduleEntry.module_id,
              import_contract: importedContractId,
            },
          ),
        );
      }
    }

    for (const dependencyModuleId of moduleEntry.depends_on_modules) {
      if (!registryIndex.module_by_id.has(dependencyModuleId)) {
        failures.push(
          buildFailure(
            'depends_on_module_unresolved',
            'depends_on_modules must reference an existing module.',
            {
              module_id: moduleEntry.module_id,
              depends_on_module: dependencyModuleId,
            },
          ),
        );
      }
    }
  }

  for (const cyclePath of detectCycles(dependencyMap)) {
    failures.push(
      buildFailure('module_dependency_cycle', 'Module dependency cycle detected.', {
        cycle: cyclePath,
      }),
    );
  }

  const contractCount = registry.modules.reduce(
    (count, moduleEntry) => count + moduleEntry.exports_contracts.length,
    0,
  );

  return {
    status: failures.length === 0 ? 'pass' : 'fail',
    failures,
    modules_scanned: registry.modules.length,
    contracts_scanned: contractCount,
    registry_path: registry.registry_path,
  };
}

/**
 * Prints one human-readable result.
 * @param {{status: "pass" | "fail", failures: Array<{rule_id: string, message: string, details: Record<string, unknown>}>, modules_scanned: number, contracts_scanned: number, registry_path: string}} result
 */
function printTextResult(result) {
  if (result.status === 'pass') {
    gatePass(
      GATE_NAME,
      `Module graph validation passed. modules=${result.modules_scanned} contracts=${result.contracts_scanned}`,
    );
    gateInfo(GATE_NAME, `registry_path=${result.registry_path}`);
    return;
  }

  gateFail(GATE_NAME, 'Module graph validation failed.');
  for (const failure of result.failures) {
    gateFail(GATE_NAME, `- rule=${failure.rule_id} message="${failure.message}"`);
    gateInfo(GATE_NAME, `  details=${JSON.stringify(failure.details)}`);
  }
}

const options = resolveCliOptions(process.argv.slice(2));
const result = evaluateModuleGraph(options);

if (options.format === 'json') {
  console.info(JSON.stringify(result, null, 2));
} else {
  printTextResult(result);
}

if (result.status === 'fail') {
  process.exit(1);
}
