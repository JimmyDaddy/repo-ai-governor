import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, resolve } from 'node:path';

import { WorkspaceMode } from '@repo-ai-governor/shared';
import {
  GOVERNOR_CONFIG_FILE_NAME,
  GOVERNOR_WORKSPACE_DIRECTORY_NAME,
  TOOL_MANAGED_WORKSPACES_ROOT_SEGMENTS,
  WorkspaceModeSource,
} from './constants/index.js';
import type { ResolvedWorkspace, WorkspaceResolverOptions } from './types/interfaces/index.js';

/**
 * Resolves effective workspace mode, root, and config path using deterministic precedence.
 *
 * Why this exists:
 * Stage-2 workspace flows must consume one shared resolution policy so CLI/runtime/migration
 * modules do not silently diverge on where `.repo-ai-governor` state lives.
 */
export class WorkspaceResolver {
  /**
   * Resolves workspace context from runtime overrides, config values, and defaults.
   * @param options Resolver input including cwd, optional config, and optional runtime overrides.
   * @returns Effective workspace metadata used by downstream runtime/bootstrap steps.
   */
  public resolve(options: WorkspaceResolverOptions): ResolvedWorkspace {
    const repositoryRoot = options.repositoryRootOverride
      ? resolve(options.repositoryRootOverride)
      : this.resolveRepositoryRoot(options.currentWorkingDirectory);
    const runtimeOverrides = options.runtimeOverrides ?? {};
    const configWorkspace = options.config?.workspace;
    const modeResolution = this.resolveWorkspaceMode(runtimeOverrides.mode, configWorkspace?.mode);
    const workspaceId = this.buildWorkspaceId(repositoryRoot);

    const workspaceRoot =
      modeResolution.mode === WorkspaceMode.REPO_LOCAL
        ? this.resolveRepoLocalWorkspaceRoot(
            repositoryRoot,
            runtimeOverrides.repoLocalRoot,
            configWorkspace?.repoLocalRoot,
          )
        : this.resolveToolManagedWorkspaceRoot(
            repositoryRoot,
            workspaceId,
            runtimeOverrides.toolManagedRoot,
            configWorkspace?.toolManagedRoot,
          );

    return {
      workspaceId,
      mode: modeResolution.mode,
      modeSource: modeResolution.modeSource,
      repositoryRoot,
      workspaceRoot,
      configPath: resolve(workspaceRoot, GOVERNOR_CONFIG_FILE_NAME),
    };
  }

  /**
   * Resolves repository root by walking up from cwd and preferring `.git` boundary.
   * @param currentWorkingDirectory Runtime current working directory.
   * @returns Absolute repository root.
   */
  private resolveRepositoryRoot(currentWorkingDirectory: string): string {
    let cursor = resolve(currentWorkingDirectory);

    while (true) {
      if (existsSync(resolve(cursor, '.git'))) {
        return cursor;
      }

      const parent = dirname(cursor);
      if (parent === cursor) {
        break;
      }
      cursor = parent;
    }

    return resolve(currentWorkingDirectory);
  }

  /**
   * Resolves mode with strict precedence: runtime override > config > default.
   * @param runtimeMode Optional runtime override mode.
   * @param configMode Optional config mode.
   * @returns Effective mode plus source metadata.
   */
  private resolveWorkspaceMode(
    runtimeMode: WorkspaceMode | undefined,
    configMode: WorkspaceMode | undefined,
  ): { mode: WorkspaceMode; modeSource: WorkspaceModeSource } {
    if (runtimeMode) {
      return {
        mode: runtimeMode,
        modeSource: WorkspaceModeSource.RUNTIME,
      };
    }

    if (configMode) {
      return {
        mode: configMode,
        modeSource: WorkspaceModeSource.CONFIG,
      };
    }

    return {
      mode: WorkspaceMode.TOOL_MANAGED,
      modeSource: WorkspaceModeSource.DEFAULT,
    };
  }

  /**
   * Builds deterministic workspace id from repository root.
   * @param repositoryRoot Absolute repository root path.
   * @returns Stable workspace id string.
   */
  private buildWorkspaceId(repositoryRoot: string): string {
    return createHash('sha256').update(repositoryRoot).digest('hex').slice(0, 12);
  }

  /**
   * Resolves repo-local workspace root.
   * @param repositoryRoot Absolute repository root path.
   * @param runtimeRepoLocalRoot Optional runtime repo-local root override.
   * @param configRepoLocalRoot Optional config repo-local root.
   * @returns Absolute repo-local workspace root.
   */
  private resolveRepoLocalWorkspaceRoot(
    repositoryRoot: string,
    runtimeRepoLocalRoot: string | undefined,
    configRepoLocalRoot: string | undefined,
  ): string {
    const rootCandidate =
      runtimeRepoLocalRoot ??
      configRepoLocalRoot ??
      resolve(repositoryRoot, GOVERNOR_WORKSPACE_DIRECTORY_NAME);
    return this.resolveAbsolutePath(rootCandidate, repositoryRoot);
  }

  /**
   * Resolves tool-managed workspace root with repository fingerprint partitioning.
   * @param repositoryRoot Absolute repository root path.
   * @param workspaceId Stable repository fingerprint id.
   * @param runtimeToolManagedRoot Optional runtime tool-managed root override.
   * @param configToolManagedRoot Optional config tool-managed root.
   * @returns Absolute tool-managed workspace root.
   */
  private resolveToolManagedWorkspaceRoot(
    repositoryRoot: string,
    workspaceId: string,
    runtimeToolManagedRoot: string | undefined,
    configToolManagedRoot: string | undefined,
  ): string {
    const defaultToolManagedRoot = resolve(homedir(), ...TOOL_MANAGED_WORKSPACES_ROOT_SEGMENTS);
    const rootCandidate = runtimeToolManagedRoot ?? configToolManagedRoot ?? defaultToolManagedRoot;
    const toolManagedRoot = this.resolveAbsolutePath(rootCandidate, repositoryRoot);
    return resolve(toolManagedRoot, workspaceId, GOVERNOR_WORKSPACE_DIRECTORY_NAME);
  }

  /**
   * Normalizes candidate path to absolute path under repository root when relative.
   * @param pathCandidate Candidate path from runtime/config/default source.
   * @param repositoryRoot Absolute repository root path.
   * @returns Absolute path.
   */
  private resolveAbsolutePath(pathCandidate: string, repositoryRoot: string): string {
    if (isAbsolute(pathCandidate)) {
      return resolve(pathCandidate);
    }
    return resolve(repositoryRoot, pathCandidate);
  }
}
