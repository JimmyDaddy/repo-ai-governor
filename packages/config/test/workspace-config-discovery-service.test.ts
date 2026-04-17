import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  ConfigLoader,
  WorkspaceConfigDiscoveryService,
  WorkspaceMode,
  WorkspaceResolver,
} from '../src/index.js';

/**
 * Renders one minimal config fixture for discovery-service tests.
 * @param repoLocalRoot Repo-local workspace root persisted into the fixture config.
 * @returns YAML config content accepted by the shared config loader.
 */
function renderGovernorConfigContent(repoLocalRoot: string): string {
  return [
    'schemaVersion: "1.0"',
    'workspace:',
    `  mode: ${WorkspaceMode.REPO_LOCAL}`,
    `  repoLocalRoot: ${JSON.stringify(repoLocalRoot)}`,
    'i18n:',
    '  runtimeEngine: i18next',
    '  defaultLocale: zh-CN',
    '  fallbackLocale: en-US',
    '  supportedLocales:',
    '    - zh-CN',
    '    - en-US',
    '',
  ].join('\n');
}

/**
 * Creates the minimum canonical workspace markers required by safe repo-local discovery.
 * @param workspaceRoot Candidate workspace root under test.
 */
function writeWorkspaceMarkers(workspaceRoot: string): void {
  mkdirSync(join(workspaceRoot, 'context'), { recursive: true });
  writeFileSync(join(workspaceRoot, 'context', 'current-context.md'), '# test\n', 'utf8');
  mkdirSync(join(workspaceRoot, 'normative_knowledge_sources'), { recursive: true });
  writeFileSync(
    join(workspaceRoot, 'normative_knowledge_sources', 'normative-loading-manifest.yaml'),
    'schema_version: 1\n',
    'utf8',
  );
}

describe('WorkspaceConfigDiscoveryService', () => {
  it('reuses the cached custom repo-local candidate without rewalking the repository', () => {
    const scratchRoot = mkdtempSync(join(tmpdir(), 'repo-ai-governor-config-discovery-'));
    const repositoryRoot = join(scratchRoot, 'repo');
    const customWorkspaceRoot = join(repositoryRoot, 'governance', 'state');
    let readDirectoryEntriesCallCount = 0;

    mkdirSync(customWorkspaceRoot, { recursive: true });
    writeWorkspaceMarkers(customWorkspaceRoot);
    writeFileSync(
      join(customWorkspaceRoot, 'governor.yaml'),
      renderGovernorConfigContent('governance/state'),
      'utf8',
    );

    const discoveryService = new WorkspaceConfigDiscoveryService(
      new ConfigLoader(),
      new WorkspaceResolver(),
      existsSync,
      (directoryPath) => {
        readDirectoryEntriesCallCount += 1;
        return readdirSync(directoryPath, { withFileTypes: true });
      },
    );

    try {
      const firstConfig = discoveryService.loadRepositoryWorkspaceConfig(repositoryRoot);
      const firstPassDirectoryReads = readDirectoryEntriesCallCount;
      const secondConfig = discoveryService.loadRepositoryWorkspaceConfig(repositoryRoot);

      expect(firstConfig?.workspace.repoLocalRoot).toBe('governance/state');
      expect(secondConfig?.workspace.repoLocalRoot).toBe('governance/state');
      expect(firstPassDirectoryReads).toBeGreaterThan(0);
      expect(readDirectoryEntriesCallCount).toBe(firstPassDirectoryReads);
    } finally {
      rmSync(scratchRoot, { recursive: true, force: true });
    }
  });
});
