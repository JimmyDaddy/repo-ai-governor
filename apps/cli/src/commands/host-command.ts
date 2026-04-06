import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { CliCommandResultCheckId } from '../constants/cli-command-result-check.constant.js';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import { CliHostAction } from '../constants/cli-host.constant.js';
import { CliHostDistributionRuntime } from '../runtime/host-distribution-runtime.js';
import type {
  CliCommandExecutorContext,
  CliCommandResultArtifact,
  CliCommandResultCheck,
} from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

/**
 * Owns the `host` command surface for staged export, verify, and pack workflows.
 */
export class CliHostCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.HOST;

  public constructor(
    private readonly runtimeFactory: (
      currentWorkingDirectory: string,
      localizeText: (english: string, chinese: string) => string,
    ) => CliHostDistributionRuntime = (currentWorkingDirectory, localizeText) =>
      new CliHostDistributionRuntime(currentWorkingDirectory, localizeText),
  ) {}

  public async execute(context: CliCommandExecutorContext) {
    const options = context.options.hostCommandOptions;
    if (!options?.action) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        context.translate('cli.commands.host.subcommandRequired'),
      );
    }

    const runtime = this.runtimeFactory(
      context.options.currentWorkingDirectory,
      context.localizeText,
    );
    const operationResult =
      options.action === CliHostAction.EXPORT
        ? await runtime.export(options)
        : options.action === CliHostAction.PACK
          ? await runtime.pack(options)
          : await runtime.verify(options);
    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.HOST_ACTION,
        status: this.toCliStatus(operationResult.verificationStatus),
        detail: `action=${operationResult.action} mode=${operationResult.mode}`,
      },
      {
        id: CliCommandResultCheckId.HOST_TARGET,
        status: this.toCliStatus(operationResult.verificationStatus),
        detail: `host=${operationResult.host} target=${operationResult.target}`,
      },
      ...operationResult.checks.map((check) => ({
        id: check.checkId,
        status: this.toCliStatus(check.status),
        detail: check.detail,
      })),
      {
        id:
          options.action === CliHostAction.EXPORT
            ? CliCommandResultCheckId.HOST_EXPORT_RECEIPT
            : options.action === CliHostAction.PACK
              ? CliCommandResultCheckId.HOST_PACK_RECEIPT
              : CliCommandResultCheckId.HOST_VERIFY_RECEIPT,
        status: this.toCliStatus(operationResult.verificationStatus),
        detail: `manifest=${operationResult.exportManifestPath} verification=${operationResult.verificationSummaryPath}`,
      },
    ];
    const checkTotals = context.calculateCheckTotals(checks);
    const artifacts: CliCommandResultArtifact[] = [
      {
        id: 'host_export_manifest',
        path: operationResult.exportManifestPath,
      },
      {
        id: 'host_verification_summary',
        path: operationResult.verificationSummaryPath,
      },
      ...(operationResult.applyReportPath
        ? [
            {
              id: 'host_apply_report',
              path: operationResult.applyReportPath,
            },
          ]
        : []),
      ...(operationResult.packReportPath
        ? [
            {
              id: 'host_pack_report',
              path: operationResult.packReportPath,
            },
          ]
        : []),
    ];
    const message = this.resolveMessage(context, options.action, operationResult.target);
    const blockingChecks = checks
      .filter((check) => check.status === CliGovernanceCheckStatus.FAIL)
      .map((check) => check.id);

    if (blockingChecks.length > 0) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        context.localizeText(
          `host ${options.action} failed because blocking verification issues remain for ${operationResult.target}. verification=${operationResult.verificationSummaryPath}`,
          `host ${options.action} 失败，因为 ${operationResult.target} 仍存在阻断性校验问题。verification=${operationResult.verificationSummaryPath}`,
        ),
        {
          action: operationResult.action,
          host: operationResult.host,
          mode: operationResult.mode,
          target: operationResult.target,
          exportManifestPath: operationResult.exportManifestPath,
          verificationSummaryPath: operationResult.verificationSummaryPath,
          blockingChecks,
          checkTotals,
          artifacts,
        },
      );
    }

    return {
      message,
      commandResult: {
        operation:
          options.action === CliHostAction.EXPORT
            ? CLI_RUNTIME_OPERATION.HOST_EXPORT
            : options.action === CliHostAction.PACK
              ? CLI_RUNTIME_OPERATION.HOST_PACK
              : CLI_RUNTIME_OPERATION.HOST_VERIFY,
        summary: message,
        check_totals: checkTotals,
        checks,
        artifacts,
        details: {
          host: operationResult.host,
          mode: operationResult.mode,
          target: operationResult.target,
          workflow_count: String(operationResult.workflowIds.length),
          staged_export_root: operationResult.stagedExportRoot,
          ...(operationResult.applyRoot ? { apply_root: operationResult.applyRoot } : {}),
          ...(operationResult.bundleRoot ? { bundle_root: operationResult.bundleRoot } : {}),
        },
      },
    };
  }

  private toCliStatus(status: string): CliGovernanceCheckStatus {
    switch (status) {
      case 'pass':
        return CliGovernanceCheckStatus.PASS;
      case 'warn':
        return CliGovernanceCheckStatus.WARN;
      default:
        return CliGovernanceCheckStatus.FAIL;
    }
  }

  private resolveMessage(
    context: CliCommandExecutorContext,
    action: CliHostAction,
    target: string,
  ): string {
    switch (action) {
      case CliHostAction.EXPORT:
        return context.translate('cli.commands.host.exportCompleted', {
          target,
        });
      case CliHostAction.PACK:
        return context.translate('cli.commands.host.packCompleted', {
          target,
        });
      default:
        return context.translate('cli.commands.host.verifyCompleted', {
          target,
        });
    }
  }
}
