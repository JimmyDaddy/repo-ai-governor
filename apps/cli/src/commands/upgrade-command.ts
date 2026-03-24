import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  ConfigLoader,
  GovernorSchemaVersion,
  UpgradeSchemaDiffService,
} from "@repo-ai-governor/config";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { CliCommandName } from "../constants/cli-command.constant.js";
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from "../constants/cli-governance-runtime.constant.js";
import type { CliCommandExecutorContext } from "../types/index.js";
import type { CliCommandExecutor } from "./cli-command-executor.interface.js";

/**
 * Owns `upgrade` command execution outside the runtime facade.
 */
export class CliUpgradeCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.UPGRADE;

  public async execute(context: CliCommandExecutorContext) {
    if (!existsSync(context.options.workspace.configPath)) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        `upgrade requires config file at ${context.options.workspace.configPath}; run \`init\` first.`,
        {
          configPath: context.options.workspace.configPath,
        },
      );
    }

    const configLoader = new ConfigLoader();
    const upgradeSchemaDiffService = new UpgradeSchemaDiffService();
    const sourceConfig = configLoader.loadFromFile(context.options.workspace.configPath);
    const upgradeDiffResult = upgradeSchemaDiffService.analyze({
      sourceConfig,
      targetVersion: GovernorSchemaVersion.V1_1,
    });
    const reportPath = resolve(
      context.options.workspace.workspaceRoot,
      "context",
      "upgrade",
      `upgrade-diff-${Date.now()}.json`,
    );
    await context.artifactWriter.writeJsonArtifact(reportPath, upgradeDiffResult);

    const warningCount =
      upgradeDiffResult.confirmationDecision === "allow"
        ? 0
        : upgradeDiffResult.confirmationItems.length;
    const message = `Upgrade analysis completed with decision=${upgradeDiffResult.confirmationDecision}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.SCHEMA_UPGRADE_ANALYZE,
        summary: message,
        check_totals: {
          pass: 1,
          warn: warningCount,
          fail: 0,
        },
        checks: [
          {
            id: "upgrade_schema_diff",
            status:
              upgradeDiffResult.confirmationDecision === "allow"
                ? CliGovernanceCheckStatus.PASS
                : CliGovernanceCheckStatus.WARN,
            detail: `diffs=${upgradeDiffResult.diffs.length} suggestions=${upgradeDiffResult.suggestions.length}`,
          },
        ],
        artifacts: [
          {
            id: "upgrade_diff_report",
            path: reportPath,
          },
        ],
        details: {
          source_version: upgradeDiffResult.sourceVersion,
          target_version: upgradeDiffResult.targetVersion,
          confirmation_decision: upgradeDiffResult.confirmationDecision,
        },
      },
    };
  }
}
