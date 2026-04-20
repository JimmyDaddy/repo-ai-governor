import { type Dirent, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { WorkspaceMode } from '@repo-ai-governor/shared';
import { ConfigLoader } from './config-loader.js';
import { GOVERNOR_CONFIG_FILE_NAME } from './constants/index.js';
import type { GovernorConfig } from './types/interfaces/index.js';
import { WorkspaceResolver } from './workspace-resolver.js';

const DISCOVERY_IGNORED_DIRECTORY_NAMES = new Set(['.git', 'coverage', 'dist', 'node_modules']);
const REPOSITORY_LOCAL_CONFIG_PATH_SEGMENTS = [
  '.repo-ai-governor',
  GOVERNOR_CONFIG_FILE_NAME,
] as const;
const DISCOVERABLE_WORKSPACE_MARKER_PATHS = [
  ['context', 'current-context.md'],
  ['normative_knowledge_sources', 'normative-loading-manifest.yaml'],
] as const;

/**
 * Discovers repository-owned workspace config from a repo root before host surfaces start clients.
 *
 * Why this exists:
 * repo-opened hosts like VS Code need one shared discovery path that can still find repo-local
 * custom workspace roots after the active `governor.yaml` moves away from the default
 * `.repo-ai-governor/governor.yaml` location.
 */
export class WorkspaceConfigDiscoveryService {
  private readonly discoveredConfigPathByRepositoryRoot = new Map<string, string>();

  public constructor(
    private readonly configLoader: Pick<ConfigLoader, 'loadFromFile'> = new ConfigLoader(),
    private readonly workspaceResolver: Pick<
      WorkspaceResolver,
      'resolve'
    > = new WorkspaceResolver(),
    private readonly pathExists: (path: string) => boolean = existsSync,
    private readonly readDirectoryEntries: (path: string) => Dirent[] = (directoryPath) =>
      readdirSync(directoryPath, { withFileTypes: true }),
  ) {}

  /**
   * Loads the best repository-discoverable workspace config for one opened repository root.
   * @param repositoryRoot Repository root opened by the host surface.
   * @returns Active workspace config when repository-local discovery can find one.
   */
  public loadRepositoryWorkspaceConfig(repositoryRoot: string): GovernorConfig | undefined {
    const defaultRepositoryConfigPath = resolve(
      repositoryRoot,
      ...REPOSITORY_LOCAL_CONFIG_PATH_SEGMENTS,
    );
    if (this.pathExists(defaultRepositoryConfigPath)) {
      this.discoveredConfigPathByRepositoryRoot.delete(repositoryRoot);
      return this.configLoader.loadFromFile(defaultRepositoryConfigPath);
    }

    const cachedCandidateConfigPath = this.discoveredConfigPathByRepositoryRoot.get(repositoryRoot);
    if (cachedCandidateConfigPath) {
      const cachedCandidateConfig = this.resolveDiscoverableCandidateConfig(
        repositoryRoot,
        cachedCandidateConfigPath,
      );
      if (cachedCandidateConfig) {
        return cachedCandidateConfig;
      }

      this.discoveredConfigPathByRepositoryRoot.delete(repositoryRoot);
    }

    let discoveredCandidateConfigPath: string | undefined;
    let discoveredConfig: GovernorConfig | undefined;
    for (const candidateConfigPath of this.listRepositoryConfigCandidates(repositoryRoot)) {
      const candidateConfig = this.resolveDiscoverableCandidateConfig(
        repositoryRoot,
        candidateConfigPath,
      );
      if (!candidateConfig) {
        continue;
      }

      if (discoveredConfig) {
        this.discoveredConfigPathByRepositoryRoot.delete(repositoryRoot);
        return undefined;
      }

      discoveredConfig = candidateConfig;
      discoveredCandidateConfigPath = candidateConfigPath;
    }

    if (discoveredConfig && discoveredCandidateConfigPath) {
      this.discoveredConfigPathByRepositoryRoot.set(repositoryRoot, discoveredCandidateConfigPath);
    }

    return discoveredConfig;
  }

  /**
   * Recursively lists repo-owned `governor.yaml` candidates with deterministic ordering.
   * @param repositoryRoot Repository root opened by the host surface.
   * @returns Candidate config paths under the repository root.
   */
  private listRepositoryConfigCandidates(repositoryRoot: string): string[] {
    const candidatePaths: string[] = [];
    const directoryQueue = [repositoryRoot];

    while (directoryQueue.length > 0) {
      const currentDirectory = directoryQueue.shift();
      if (!currentDirectory) {
        continue;
      }

      let childEntries: Dirent[];
      try {
        childEntries = this.readDirectoryEntries(currentDirectory).sort((left, right) =>
          left.name.localeCompare(right.name),
        );
      } catch {
        continue;
      }

      if (
        childEntries.some((entry) => entry.isFile() && entry.name === GOVERNOR_CONFIG_FILE_NAME)
      ) {
        candidatePaths.push(resolve(currentDirectory, GOVERNOR_CONFIG_FILE_NAME));
      }

      for (const childEntry of childEntries) {
        if (!childEntry.isDirectory()) {
          continue;
        }

        if (DISCOVERY_IGNORED_DIRECTORY_NAMES.has(childEntry.name)) {
          continue;
        }

        directoryQueue.push(resolve(currentDirectory, childEntry.name));
      }
    }

    return candidatePaths;
  }

  /**
   * Best-effort loads a discovery candidate without letting unrelated config files break bootstrap.
   * @param candidateConfigPath Candidate `governor.yaml` path discovered under the repo root.
   * @returns Parsed config when the candidate is valid.
   */
  private tryLoadConfig(candidateConfigPath: string): GovernorConfig | undefined {
    try {
      return this.configLoader.loadFromFile(candidateConfigPath);
    } catch {
      return undefined;
    }
  }

  /**
   * Validates one cached or freshly discovered candidate against repo-local discovery rules.
   * @param repositoryRoot Repository root opened by the host surface.
   * @param candidateConfigPath Candidate `governor.yaml` path under that repository.
   * @returns Parsed config when the candidate is still one authorized repo-local workspace root.
   */
  private resolveDiscoverableCandidateConfig(
    repositoryRoot: string,
    candidateConfigPath: string,
  ): GovernorConfig | undefined {
    const candidateConfig = this.tryLoadConfig(candidateConfigPath);
    if (!candidateConfig) {
      return undefined;
    }

    const resolvedWorkspace = this.workspaceResolver.resolve({
      currentWorkingDirectory: repositoryRoot,
      repositoryRootOverride: repositoryRoot,
      config: candidateConfig,
    });
    if (
      resolvedWorkspace.mode !== WorkspaceMode.REPO_LOCAL ||
      resolvedWorkspace.configPath !== candidateConfigPath ||
      !this.isDiscoverableWorkspaceRoot(resolvedWorkspace.workspaceRoot)
    ) {
      return undefined;
    }

    return candidateConfig;
  }

  /**
   * Limits auto-discovery to initialized workspace roots instead of arbitrary nested fixtures.
   * @param workspaceRoot Candidate workspace root resolved from one discovered config file.
   * @returns `true` only when the candidate already contains canonical workspace markers.
   */
  private isDiscoverableWorkspaceRoot(workspaceRoot: string): boolean {
    return DISCOVERABLE_WORKSPACE_MARKER_PATHS.every((pathSegments) =>
      this.pathExists(resolve(workspaceRoot, ...pathSegments)),
    );
  }
}
