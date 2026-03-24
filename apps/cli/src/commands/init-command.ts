import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { CliCommandName } from "../constants/cli-command.constant.js";
import {
  CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from "../constants/cli-governance-runtime.constant.js";
import type {
  CliCommandExecutorContext,
  CliCommandResultArtifact,
  CliCommandResultCheck,
} from "../types/index.js";
import type { CliCommandExecutor } from "./cli-command-executor.interface.js";

/**
 * Owns `init` command execution outside the runtime facade.
 */
export class CliInitCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.INIT;

  public async execute(context: CliCommandExecutorContext) {
    const checks: CliCommandResultCheck[] = [];
    const artifacts: CliCommandResultArtifact[] = [];
    const ensuredDirectoryPaths: string[] = [];
    const createdDirectoryPaths: string[] = [];

    for (const segments of CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS) {
      const directoryPath = resolve(context.options.workspace.workspaceRoot, ...segments);
      const directoryExisted = existsSync(directoryPath);
      await mkdir(directoryPath, { recursive: true });
      ensuredDirectoryPaths.push(directoryPath);
      if (!directoryExisted) {
        createdDirectoryPaths.push(directoryPath);
      }
    }

    checks.push({
      id: "workspace_directories",
      status: CliGovernanceCheckStatus.PASS,
      detail: `ensured=${ensuredDirectoryPaths.length} created=${createdDirectoryPaths.length}`,
    });

    const configPath = context.options.workspace.configPath;
    const configCreated = !existsSync(configPath);
    if (configCreated) {
      await context.artifactWriter.writeTextArtifact(
        configPath,
        context.buildDefaultConfigContent(),
      );
    }

    checks.push({
      id: "workspace_config",
      status: CliGovernanceCheckStatus.PASS,
      detail: configCreated ? `created=${configPath}` : `reused=${configPath}`,
    });
    artifacts.push({
      id: "workspace_config",
      path: configPath,
    });

    const initManifestPath = resolve(
      context.options.workspace.workspaceRoot,
      "context",
      "bootstrap",
      "init-manifest.json",
    );
    await context.artifactWriter.writeJsonArtifact(initManifestPath, {
      initializedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspaceId: context.options.workspace.workspaceId,
      workspaceRoot: context.options.workspace.workspaceRoot,
      workspaceMode: context.options.workspace.mode,
      configPath,
      configSource: context.options.configSource,
      profileId: context.options.profileId,
      locale: context.options.locale,
      memoryStoreEngine: context.options.memoryConfig.storeEngine,
      memoryStoreRoot: context.options.memoryStoreRoot,
    });
    artifacts.push({
      id: "init_manifest",
      path: initManifestPath,
    });

    const message = `Initialized workspace at ${context.options.workspace.workspaceRoot}; config ${configCreated ? "created" : "reused"}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.WORKSPACE_INIT,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        details: {
          workspace_mode: context.options.workspace.mode,
          workspace_mode_source: context.options.workspace.modeSource,
        },
      },
    };
  }
}
