import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface ModuleGraphFailure {
  rule_id: string;
  message: string;
  details: Record<string, unknown>;
}

interface ModuleGraphResult {
  status: 'pass' | 'fail';
  failures: ModuleGraphFailure[];
  modules_scanned: number;
  contracts_scanned: number;
  registry_path: string;
}

interface ModuleGraphOutcome {
  exitCode: number;
  result: ModuleGraphResult;
}

const SCRIPT_PATH = resolve(
  process.cwd(),
  'scripts/governance/check-technical-solution-module-graph.js',
);
const DEFAULT_REGISTRY_PATH =
  '.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml';

/**
 * Executes the module graph checker and always returns machine output.
 * @param {string} registryPath Registry path under test.
 * @returns {ModuleGraphOutcome}
 */
function runModuleGraphGate(registryPath: string): ModuleGraphOutcome {
  const commandArgs = [SCRIPT_PATH, '--format', 'json', '--registry', registryPath];

  try {
    const stdout = execFileSync(process.execPath, commandArgs, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return {
      exitCode: 0,
      result: JSON.parse(stdout) as ModuleGraphResult,
    };
  } catch (error) {
    const commandError = error as {
      status?: number;
      stdout?: string | Buffer;
    };
    const rawStdout =
      typeof commandError.stdout === 'string'
        ? commandError.stdout
        : (commandError.stdout?.toString('utf8') ?? '');

    return {
      exitCode: commandError.status ?? 1,
      result: JSON.parse(rawStdout) as ModuleGraphResult,
    };
  }
}

describe('technical-solution-module-graph gate', () => {
  it('passes for the repository registry', () => {
    const outcome = runModuleGraphGate(DEFAULT_REGISTRY_PATH);

    expect(outcome.exitCode).toBe(0);
    expect(outcome.result.status).toBe('pass');
    expect(outcome.result.failures).toHaveLength(0);
    expect(outcome.result.modules_scanned).toBeGreaterThan(0);
    expect(outcome.result.contracts_scanned).toBeGreaterThan(0);
  });

  it('fails for unresolved imports and dependency cycles', () => {
    const tempRoot = resolve(process.cwd(), '.tmp/module-graph-gate-test');
    const docsRoot = join(tempRoot, 'docs');
    rmSync(tempRoot, { recursive: true, force: true });
    mkdirSync(join(docsRoot, 'module-a'), { recursive: true });
    mkdirSync(join(docsRoot, 'module-b'), { recursive: true });

    writeFileSync(
      join(docsRoot, 'module-a', 'module-overview.md'),
      '# module-a\n\n- Status: active\n- Date: 2026-03-26\n',
      'utf8',
    );
    writeFileSync(
      join(docsRoot, 'module-b', 'module-overview.md'),
      '# module-b\n\n- Status: active\n- Date: 2026-03-26\n',
      'utf8',
    );

    const registryPath = join(tempRoot, 'invalid-registry.yaml');
    writeFileSync(
      registryPath,
      [
        'schema_version: 1',
        'generated_at: 2026-03-26',
        'status: active',
        'allowed_layers:',
        '  - governance-core',
        'modules:',
        '  - module_id: module-a',
        '    status: active',
        '    owner: architecture',
        '    layer: governance-core',
        `    summary_doc: ${join(docsRoot, 'module-a', 'module-overview.md').replace(/\\/g, '/')}`,
        '    detail_docs: []',
        '    north_star_refs:',
        '      - prd.docs-sync',
        '    exports_contracts:',
        '      - contract.module-a.v1',
        '    imports_contracts:',
        '      - contract.missing.v1',
        '    depends_on_modules:',
        '      - module-b',
        '  - module_id: module-b',
        '    status: active',
        '    owner: architecture',
        '    layer: governance-core',
        `    summary_doc: ${join(docsRoot, 'module-b', 'module-overview.md').replace(/\\/g, '/')}`,
        '    detail_docs: []',
        '    north_star_refs:',
        '      - prd.docs-sync',
        '    exports_contracts:',
        '      - contract.module-b.v1',
        '    imports_contracts: []',
        '    depends_on_modules:',
        '      - module-a',
      ].join('\n'),
      'utf8',
    );

    const outcome = runModuleGraphGate(registryPath);
    rmSync(tempRoot, { recursive: true, force: true });

    expect(outcome.exitCode).toBe(1);
    expect(outcome.result.status).toBe('fail');
    expect(
      outcome.result.failures.some((failure) => failure.rule_id === 'import_contract_unresolved'),
    ).toBe(true);
    expect(
      outcome.result.failures.some((failure) => failure.rule_id === 'module_dependency_cycle'),
    ).toBe(true);
  });

  it('fails when detail_doc kind is invalid', () => {
    const tempRoot = resolve(process.cwd(), '.tmp/module-graph-gate-kind-test');
    const docsRoot = join(tempRoot, 'docs');
    rmSync(tempRoot, { recursive: true, force: true });
    mkdirSync(join(docsRoot, 'module-a', 'contracts'), { recursive: true });

    writeFileSync(
      join(docsRoot, 'module-a', 'module-overview.md'),
      '# module-a\n\n- Status: active\n- Date: 2026-03-26\n',
      'utf8',
    );
    writeFileSync(
      join(docsRoot, 'module-a', 'contracts', 'module-a-contract.md'),
      '# module-a contract\n\n- Status: active\n- Date: 2026-03-26\n',
      'utf8',
    );

    const registryPath = join(tempRoot, 'invalid-detail-kind-registry.yaml');
    writeFileSync(
      registryPath,
      [
        'schema_version: 2',
        'generated_at: 2026-03-26',
        'status: active',
        'allowed_layers:',
        '  - governance-core',
        'modules:',
        '  - module_id: module-a',
        '    status: active',
        '    owner: architecture',
        '    layer: governance-core',
        `    summary_doc: ${join(docsRoot, 'module-a', 'module-overview.md').replace(/\\/g, '/')}`,
        '    detail_docs:',
        `      - path: ${join(docsRoot, 'module-a', 'contracts', 'module-a-contract.md').replace(
          /\\/g,
          '/',
        )}`,
        '        kind: note',
        '    north_star_refs:',
        '      - prd.docs-sync',
        '    exports_contracts:',
        '      - contract.module-a.v1',
        '    imports_contracts: []',
        '    depends_on_modules: []',
      ].join('\n'),
      'utf8',
    );

    const outcome = runModuleGraphGate(registryPath);
    rmSync(tempRoot, { recursive: true, force: true });

    expect(outcome.exitCode).toBe(1);
    expect(outcome.result.status).toBe('fail');
    expect(
      outcome.result.failures.some((failure) => failure.rule_id === 'detail_doc_kind_invalid'),
    ).toBe(true);
  });
});
