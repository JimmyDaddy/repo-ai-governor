import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface ContractMatrixEntry {
  contractId: string;
  component: string;
  testPath: string;
  failurePolicy: string;
  rationale: string;
}

interface ContractMatrixManifest {
  schemaVersion: string;
  updatedAt: string;
  entries: ContractMatrixEntry[];
}

const REQUIRED_COMPONENTS = [
  'adapter-sdk',
  'memory-store-adapter',
  'artifact-registry',
  'notification-dispatcher',
  'process-dsl-ir',
  'risk-policy',
  'standards-projection-parity',
];

const ALLOWED_FAILURE_POLICIES = new Set(['block', 'warn']);

/**
 * Reads the contract matrix manifest from repository test assets.
 * @returns Parsed manifest used by Stage 7 contract baseline checks.
 */
function readContractMatrixManifest(): ContractMatrixManifest {
  const currentFileDirectory = dirname(fileURLToPath(import.meta.url));
  const manifestPath = resolve(currentFileDirectory, './contract-test-matrix.manifest.json');
  const manifestText = readFileSync(manifestPath, 'utf8');
  return JSON.parse(manifestText) as ContractMatrixManifest;
}

describe('contract test matrix baseline', () => {
  it('covers all Stage-7 required contract components', () => {
    const manifest = readContractMatrixManifest();
    const coveredComponents = new Set(manifest.entries.map((entry) => entry.component));

    for (const component of REQUIRED_COMPONENTS) {
      expect(coveredComponents.has(component)).toBe(true);
    }
  });

  it('keeps unique contract ids and valid failure policies', () => {
    const manifest = readContractMatrixManifest();
    const contractIds = new Set<string>();

    for (const entry of manifest.entries) {
      expect(contractIds.has(entry.contractId)).toBe(false);
      contractIds.add(entry.contractId);
      expect(ALLOWED_FAILURE_POLICIES.has(entry.failurePolicy)).toBe(true);
    }
  });

  it('resolves every matrix test path to an existing file', () => {
    const manifest = readContractMatrixManifest();
    const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

    for (const entry of manifest.entries) {
      const absoluteTestPath = resolve(repositoryRoot, entry.testPath);
      expect(existsSync(absoluteTestPath)).toBe(true);
    }
  });
});
