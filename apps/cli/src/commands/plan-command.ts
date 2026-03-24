import { resolve } from "node:path";

import { CliCommandName } from "../constants/cli-command.constant.js";
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from "../constants/cli-governance-runtime.constant.js";
import type { CliCommandExecutorContext } from "../types/index.js";
import type { CliCommandExecutor } from "./cli-command-executor.interface.js";

/**
 * Owns `plan` command execution outside the runtime facade.
 */
export class CliPlanCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.PLAN;

  public async execute(context: CliCommandExecutorContext) {
    const planId = `plan-${Date.now()}`;
    const planPath = resolve(
      context.options.workspace.workspaceRoot,
      "context",
      "plan",
      `${planId}.json`,
    );
    await context.artifactWriter.writeJsonArtifact(planPath, {
      planId,
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        workspaceMode: context.options.workspace.mode,
      },
      commandContract: {
        stage9aHardExit: ["init", "doctor", "check"],
        minimalRuntimeChain: ["compiler", "runtime", "policy", "audit", "report"],
      },
      profileId: context.options.profileId,
      locale: context.options.locale,
      outputMode: context.options.outputMode,
    });

    const message = `Plan snapshot written to ${planPath}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.PLAN_SNAPSHOT,
        summary: message,
        check_totals: {
          pass: 1,
          warn: 0,
          fail: 0,
        },
        checks: [
          {
            id: "plan_snapshot",
            status: CliGovernanceCheckStatus.PASS,
            detail: planId,
          },
        ],
        artifacts: [
          {
            id: "plan_snapshot",
            path: planPath,
          },
        ],
      },
    };
  }
}
