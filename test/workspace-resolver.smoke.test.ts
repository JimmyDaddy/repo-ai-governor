import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  type GovernorConfig,
  WorkspaceMode,
  WorkspaceModeSource,
  WorkspaceResolver,
} from "../packages/config/src/index.js";

/**
 * Creates a minimal config fixture for workspace resolver tests.
 * @param mode Workspace mode for this fixture.
 * @param overrides Optional workspace root overrides.
 * @returns Schema-compatible governor config.
 */
function createConfigFixture(
  mode: WorkspaceMode,
  overrides?: {
    toolManagedRoot?: string;
    repoLocalRoot?: string;
  },
): GovernorConfig {
  return {
    schemaVersion: "1.0",
    workspace: {
      mode,
      ...(overrides?.toolManagedRoot ? { toolManagedRoot: overrides.toolManagedRoot } : {}),
      ...(overrides?.repoLocalRoot ? { repoLocalRoot: overrides.repoLocalRoot } : {}),
    },
    i18n: {
      runtimeEngine: "i18next",
      defaultLocale: "zh-CN",
      fallbackLocale: "en-US",
      supportedLocales: ["zh-CN", "en-US"],
    },
  };
}

describe("WorkspaceResolver smoke", () => {
  it("defaults to tool_managed mode when runtime/config do not provide mode", () => {
    const resolver = new WorkspaceResolver();

    const resolvedWorkspace = resolver.resolve({
      currentWorkingDirectory: process.cwd(),
    });

    expect(resolvedWorkspace.mode).toBe(WorkspaceMode.TOOL_MANAGED);
    expect(resolvedWorkspace.modeSource).toBe(WorkspaceModeSource.DEFAULT);
    expect(resolvedWorkspace.workspaceRoot).toContain(
      join(resolvedWorkspace.workspaceId, ".repo-ai-governor"),
    );
    expect(resolvedWorkspace.configPath).toBe(
      join(resolvedWorkspace.workspaceRoot, "governor.yaml"),
    );
  });

  it("uses config workspace mode when runtime override is absent", () => {
    const resolver = new WorkspaceResolver();
    const repositoryRoot = process.cwd();
    const repoLocalRoot = ".repo-ai-governor";

    const resolvedWorkspace = resolver.resolve({
      currentWorkingDirectory: repositoryRoot,
      config: createConfigFixture(WorkspaceMode.REPO_LOCAL, { repoLocalRoot }),
    });

    expect(resolvedWorkspace.mode).toBe(WorkspaceMode.REPO_LOCAL);
    expect(resolvedWorkspace.modeSource).toBe(WorkspaceModeSource.CONFIG);
    expect(resolvedWorkspace.workspaceRoot).toBe(resolve(repositoryRoot, repoLocalRoot));
  });

  it("prioritizes runtime overrides over config values", () => {
    const resolver = new WorkspaceResolver();
    const repositoryRoot = process.cwd();

    const resolvedWorkspace = resolver.resolve({
      currentWorkingDirectory: repositoryRoot,
      config: createConfigFixture(WorkspaceMode.REPO_LOCAL, {
        repoLocalRoot: ".repo-ai-governor",
      }),
      runtimeOverrides: {
        mode: WorkspaceMode.TOOL_MANAGED,
        toolManagedRoot: ".tmp/custom-workspaces",
      },
    });

    expect(resolvedWorkspace.mode).toBe(WorkspaceMode.TOOL_MANAGED);
    expect(resolvedWorkspace.modeSource).toBe(WorkspaceModeSource.RUNTIME);
    expect(resolvedWorkspace.workspaceRoot).toContain(
      resolve(repositoryRoot, ".tmp/custom-workspaces"),
    );
  });
});
