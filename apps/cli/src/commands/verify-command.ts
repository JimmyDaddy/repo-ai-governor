import { resolve } from "node:path";

import { ExecutionProgressStage, GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { CliCommandName } from "../constants/cli-command.constant.js";
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from "../constants/cli-governance-runtime.constant.js";
import type { CliCommandResultArtifact, CliCommandResultCheck } from "../types/index.js";
import type { CliCommandExecutorContext } from "../types/interfaces/cli-governance-runtime.interface.js";
import type { CliCommandExecutor } from "./cli-command-executor.interface.js";

/**
 * Owns `verify` command execution outside the runtime facade.
 */
export class CliVerifyCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.VERIFY;

  public async execute(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    const adapterVerification = await context.resolveAdapterVerification();
    const checks: CliCommandResultCheck[] = [];

    if (!runtimeDebugOptions.adapters) {
      checks.push({
        id: "adapters_flag",
        status: CliGovernanceCheckStatus.WARN,
        detail: "--adapters not set; verify still executed with adapters baseline by default",
      });
    }
    checks.push({
      id: "adapter_verification",
      status: adapterVerification.overallStatus,
      detail: `required_roles=${adapterVerification.requiredRoleCount} required_failures=${adapterVerification.requiredRoleFailedCount} degraded_roles=${adapterVerification.degradedRoleCount} fallback_roles=${adapterVerification.fallbackRoleCount}`,
    });
    for (const roleEvaluation of adapterVerification.roleEvaluations) {
      checks.push({
        id: `role_${roleEvaluation.roleId}`,
        status: roleEvaluation.status,
        detail: context.adapterDiagnosticsRuntime.resolveRoleEvaluationDetail(roleEvaluation),
      });
    }

    const verifyId = `verify-${Date.now()}`;
    const diagnosticsArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      "context",
      "diagnostics",
      "verify",
      `${verifyId}.json`,
    );
    await context.artifactWriter.writeJsonArtifact(diagnosticsArtifactPath, {
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        workspaceMode: context.options.workspace.mode,
      },
      adapters: context.options.adaptersConfig,
      verification:
        context.adapterDiagnosticsRuntime.createAdapterVerificationArtifactPayload(
          adapterVerification,
        ),
      nextActions: adapterVerification.nextActions,
    });

    const artifacts: CliCommandResultArtifact[] = [
      {
        id: "verify_diagnostics",
        path: diagnosticsArtifactPath,
      },
    ];
    const checkTotals = context.calculateCheckTotals(checks);
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: context.adapterDiagnosticsRuntime.createAdapterRoleProgressRows({
        verification: adapterVerification,
        stage: ExecutionProgressStage.VERIFY,
        diagnosticsPath: diagnosticsArtifactPath,
        executionId: verifyId,
      }),
      interactionPrompts: context.adapterDiagnosticsRuntime.createAdapterInteractionPrompts({
        verification: adapterVerification,
        stage: ExecutionProgressStage.VERIFY,
      }),
      layeredLogs: {
        summary: [
          `adapter_status=${adapterVerification.overallStatus}`,
          `required_roles=${adapterVerification.requiredRoleCount}`,
          `required_failures=${adapterVerification.requiredRoleFailedCount}`,
        ],
        detailed: [
          `fallback_roles=${adapterVerification.fallbackRoleCount}`,
          `degraded_roles=${adapterVerification.degradedRoleCount}`,
          `diagnostics_path=${diagnosticsArtifactPath}`,
        ],
      },
    });
    const message = `Verify completed with adapters_status=${adapterVerification.overallStatus}.`;

    if (adapterVerification.overallStatus === CliGovernanceCheckStatus.FAIL) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
        `verify failed because required adapter roles are unavailable or capability gaps exist. diagnostics=${diagnosticsArtifactPath}`,
        {
          reportPath: diagnosticsArtifactPath,
          adapterStatus: adapterVerification.overallStatus,
          requiredRoleCount: adapterVerification.requiredRoleCount,
          requiredRoleFailedCount: adapterVerification.requiredRoleFailedCount,
          degradedRoleCount: adapterVerification.degradedRoleCount,
          fallbackRoleCount: adapterVerification.fallbackRoleCount,
          checkTotals,
        },
      );
    }

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.ADAPTER_VERIFY,
        summary: message,
        check_totals: checkTotals,
        checks,
        artifacts,
        experience,
        details: {
          adapters_status: adapterVerification.overallStatus,
          required_roles: adapterVerification.requiredRoleCount,
          required_role_failures: adapterVerification.requiredRoleFailedCount,
          degraded_roles: adapterVerification.degradedRoleCount,
          fallback_roles: adapterVerification.fallbackRoleCount,
          diagnostics_path: diagnosticsArtifactPath,
        },
      },
    };
  }
}
