import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

interface ClaudeCodeSettingsFilePayload {
  env?: Record<string, unknown>;
}

export interface ClaudeCodeProviderLocalConfigDiscovery {
  apiKey: string | null;
  endpoint: string | null;
}

/**
 * Reads the official Claude Code settings scopes in precedence order without mutating them.
 *
 * Why this exists:
 * TK-503 needs provider-local discovery to stay explicitly read-only while still
 * letting onboarding and verification observe user/project settings when enabled.
 */
export class ClaudeCodeProviderLocalConfigRuntime {
  public constructor(
    private readonly options: {
      currentWorkingDirectory: string;
      environment?: NodeJS.ProcessEnv;
    },
  ) {}

  /**
   * Resolves provider-local API key and endpoint hints from Claude Code settings files.
   * @returns Discovered provider-local credential and endpoint selectors.
   */
  public discover(): ClaudeCodeProviderLocalConfigDiscovery {
    const resolvedEnvironment: Record<string, string> = {};
    for (const settingsPath of this.resolveSettingsPathsInMergeOrder()) {
      const payload = this.readSettingsPayload(settingsPath);
      if (!payload?.env) {
        continue;
      }
      for (const [key, value] of Object.entries(payload.env)) {
        if (typeof value !== 'string') {
          continue;
        }
        const normalizedValue = value.trim();
        if (normalizedValue.length === 0) {
          continue;
        }
        resolvedEnvironment[key] = normalizedValue;
      }
    }

    return {
      apiKey: resolvedEnvironment.ANTHROPIC_API_KEY ?? null,
      endpoint: resolvedEnvironment.ANTHROPIC_BASE_URL ?? null,
    };
  }

  private resolveSettingsPathsInMergeOrder(): string[] {
    const paths: string[] = [];
    const userHomeDirectory = this.resolveHomeDirectory();
    if (userHomeDirectory) {
      paths.push(join(userHomeDirectory, '.claude', 'settings.json'));
    }
    const workspaceDirectories = this.resolveWorkspaceSearchDirectories();
    for (const directoryPath of workspaceDirectories) {
      paths.push(join(directoryPath, '.claude', 'settings.json'));
    }
    for (const directoryPath of workspaceDirectories) {
      paths.push(join(directoryPath, '.claude', 'settings.local.json'));
    }
    return [...new Set(paths)];
  }

  private resolveWorkspaceSearchDirectories(): string[] {
    const resolvedCurrentWorkingDirectory = resolve(this.options.currentWorkingDirectory);
    const workspaceBoundaryDirectory = this.resolveWorkspaceBoundaryDirectory(
      resolvedCurrentWorkingDirectory,
    );
    const directories: string[] = [];

    let currentDirectory = resolvedCurrentWorkingDirectory;
    while (true) {
      directories.push(currentDirectory);
      if (currentDirectory === workspaceBoundaryDirectory) {
        break;
      }
      const parentDirectory = dirname(currentDirectory);
      if (parentDirectory === currentDirectory) {
        break;
      }
      currentDirectory = parentDirectory;
    }

    return directories.reverse();
  }

  private resolveWorkspaceBoundaryDirectory(currentWorkingDirectory: string): string {
    let currentDirectory = currentWorkingDirectory;
    while (true) {
      if (this.isWorkspaceBoundaryDirectory(currentDirectory)) {
        return currentDirectory;
      }
      const parentDirectory = dirname(currentDirectory);
      if (parentDirectory === currentDirectory) {
        return currentWorkingDirectory;
      }
      currentDirectory = parentDirectory;
    }
  }

  private isWorkspaceBoundaryDirectory(directoryPath: string): boolean {
    return (
      existsSync(join(directoryPath, '.git')) ||
      existsSync(join(directoryPath, '.repo-ai-governor'))
    );
  }

  private resolveHomeDirectory(): string | null {
    const environmentHomeDirectory =
      this.options.environment?.HOME ?? this.options.environment?.USERPROFILE;
    if (
      typeof environmentHomeDirectory === 'string' &&
      environmentHomeDirectory.trim().length > 0
    ) {
      return environmentHomeDirectory.trim();
    }

    const resolvedHomeDirectory = homedir().trim();
    return resolvedHomeDirectory.length > 0 ? resolvedHomeDirectory : null;
  }

  private readSettingsPayload(settingsPath: string): ClaudeCodeSettingsFilePayload | null {
    if (!existsSync(settingsPath)) {
      return null;
    }

    try {
      const fileText = readFileSync(settingsPath, 'utf8');
      const parsedPayload = JSON.parse(fileText) as ClaudeCodeSettingsFilePayload;
      return parsedPayload && typeof parsedPayload === 'object' ? parsedPayload : null;
    } catch {
      return null;
    }
  }
}
