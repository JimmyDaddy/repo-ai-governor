import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import {
  type GovernorConfig,
  WorkspaceMigrationService,
  WorkspaceMigrationStep,
  WorkspaceMigrationStepStatus,
  WorkspaceMode,
} from "../packages/config/src/index.js";

const TEMP_DIRECTORIES: string[] = [];

/**
 * Creates a minimal config fixture that satisfies schema baseline.
 * @param mode Active workspace mode.
 * @param toolManagedRoot Optional tool-managed root override.
 * @returns Config fixture.
 */
function createConfigFixture(mode: WorkspaceMode, toolManagedRoot?: string): GovernorConfig {
  return {
    schemaVersion: "1.0",
    workspace: {
      mode,
      ...(toolManagedRoot ? { toolManagedRoot } : {}),
    },
    i18n: {
      runtimeEngine: "i18next",
      defaultLocale: "zh-CN",
      fallbackLocale: "en-US",
      supportedLocales: ["zh-CN", "en-US"],
    },
  };
}

afterEach(async () => {
  await Promise.all(
    TEMP_DIRECTORIES.map(async (directoryPath) => {
      await rm(directoryPath, { recursive: true, force: true });
    }),
  );
  TEMP_DIRECTORIES.length = 0;
});

describe("WorkspaceMigrationService smoke", () => {
  it("migrates workspace through copy verify switch chain", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "repo-ai-governor-migration-"));
    TEMP_DIRECTORIES.push(tempRoot);
    const repositoryRoot = resolve(tempRoot, "repository");
    const toolManagedRoot = resolve(tempRoot, "tool-managed-root");

    await mkdir(resolve(repositoryRoot, ".git"), { recursive: true });
    await mkdir(resolve(repositoryRoot, ".repo-ai-governor"), { recursive: true });
    await writeFile(
      resolve(repositoryRoot, ".repo-ai-governor", "governor.yaml"),
      'schemaVersion: "1.0"\nworkspace:\n  mode: repo_local\ni18n:\n  runtimeEngine: i18next\n  defaultLocale: zh-CN\n  fallbackLocale: en-US\n  supportedLocales:\n    - zh-CN\n    - en-US\n',
      "utf8",
    );
    await mkdir(resolve(repositoryRoot, ".repo-ai-governor", "context"), { recursive: true });
    await writeFile(
      resolve(repositoryRoot, ".repo-ai-governor", "context", "current-context.md"),
      "# test\n",
      "utf8",
    );

    const service = new WorkspaceMigrationService();
    const plan = service.plan({
      currentWorkingDirectory: repositoryRoot,
      config: createConfigFixture(WorkspaceMode.REPO_LOCAL, toolManagedRoot),
      targetWorkspace: {
        mode: WorkspaceMode.TOOL_MANAGED,
        toolManagedRoot,
      },
    });
    const result = await service.execute(plan);

    expect(result.success).toBe(true);
    expect(result.steps).toEqual([
      {
        step: WorkspaceMigrationStep.COPY,
        status: WorkspaceMigrationStepStatus.SUCCEEDED,
        message: "copy completed",
      },
      {
        step: WorkspaceMigrationStep.VERIFY,
        status: WorkspaceMigrationStepStatus.SUCCEEDED,
        message: "verify completed",
      },
      {
        step: WorkspaceMigrationStep.SWITCH,
        status: WorkspaceMigrationStepStatus.SUCCEEDED,
        message: "switch completed",
      },
    ]);

    const migratedContext = await readFile(
      resolve(plan.targetWorkspace.workspaceRoot, "context", "current-context.md"),
      "utf8",
    );
    expect(migratedContext).toContain("# test");
  });

  it("restores previous target snapshot when rollback is called", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "repo-ai-governor-rollback-"));
    TEMP_DIRECTORIES.push(tempRoot);
    const repositoryRoot = resolve(tempRoot, "repository");
    const toolManagedRoot = resolve(tempRoot, "tool-managed-root");

    await mkdir(resolve(repositoryRoot, ".git"), { recursive: true });
    await mkdir(resolve(repositoryRoot, ".repo-ai-governor"), { recursive: true });
    await writeFile(
      resolve(repositoryRoot, ".repo-ai-governor", "governor.yaml"),
      'schemaVersion: "1.0"\nworkspace:\n  mode: repo_local\ni18n:\n  runtimeEngine: i18next\n  defaultLocale: zh-CN\n  fallbackLocale: en-US\n  supportedLocales:\n    - zh-CN\n    - en-US\n',
      "utf8",
    );

    const service = new WorkspaceMigrationService();
    const plan = service.plan({
      currentWorkingDirectory: repositoryRoot,
      config: createConfigFixture(WorkspaceMode.REPO_LOCAL, toolManagedRoot),
      targetWorkspace: {
        mode: WorkspaceMode.TOOL_MANAGED,
        toolManagedRoot,
      },
    });

    await mkdir(plan.targetWorkspace.workspaceRoot, { recursive: true });
    await writeFile(resolve(plan.targetWorkspace.workspaceRoot, "state.txt"), "broken", "utf8");
    await mkdir(dirname(plan.previousTargetBackupRoot), { recursive: true });
    await mkdir(plan.previousTargetBackupRoot, { recursive: true });
    await writeFile(resolve(plan.previousTargetBackupRoot, "state.txt"), "restored", "utf8");

    const rollbackResult = await service.rollback(plan);

    expect(rollbackResult.status).toBe(WorkspaceMigrationStepStatus.SUCCEEDED);
    const restoredState = await readFile(
      resolve(plan.targetWorkspace.workspaceRoot, "state.txt"),
      "utf8",
    );
    expect(restoredState).toBe("restored");
  });
});
