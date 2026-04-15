import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { CliAdoptAction } from '../constants/cli-adopt.constant.js';
import { CliCommandResultCheckId } from '../constants/cli-command-result-check.constant.js';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import { CliAdoptionPackBootstrapRuntime } from '../runtime/adoption-pack-bootstrap-runtime.js';
import { CliAdoptionPackRuntime } from '../runtime/adoption-pack-runtime.js';
import type {
  CliCommandExecutorContext,
  CliCommandResultArtifact,
  CliCommandResultCheck,
} from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

/**
 * Owns the `adopt` command surface for high-level adoption-pack lifecycle workflows.
 */
export class CliAdoptCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.ADOPT;

  public constructor(
    private readonly runtimeFactory: (
      currentWorkingDirectory: string,
      localizeText: (english: string, chinese: string) => string,
    ) => CliAdoptionPackRuntime = (currentWorkingDirectory, localizeText) =>
      new CliAdoptionPackRuntime(currentWorkingDirectory, localizeText),
    private readonly bootstrapRuntimeFactory: (
      currentWorkingDirectory: string,
      localizeText: (english: string, chinese: string) => string,
    ) => CliAdoptionPackBootstrapRuntime = (currentWorkingDirectory, localizeText) =>
      new CliAdoptionPackBootstrapRuntime(currentWorkingDirectory, localizeText),
  ) {}

  public async execute(context: CliCommandExecutorContext) {
    const options = context.options.adoptCommandOptions;
    if (!options?.action) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        context.translate('cli.commands.adopt.subcommandRequired'),
      );
    }

    const runtime = this.runtimeFactory(
      context.options.currentWorkingDirectory,
      context.localizeText,
    );
    const bootstrapRuntime = this.bootstrapRuntimeFactory(
      context.options.currentWorkingDirectory,
      context.localizeText,
    );
    const operationResult =
      options.action === CliAdoptAction.LIST
        ? await runtime.list(options)
        : options.action === CliAdoptAction.BOOTSTRAP
          ? await bootstrapRuntime.bootstrap(options)
          : options.action === CliAdoptAction.APPLY
            ? await runtime.apply(options)
            : options.action === CliAdoptAction.DIFF
              ? await runtime.diff(options)
              : options.action === CliAdoptAction.VERIFY
                ? await runtime.verify(options)
                : options.action === CliAdoptAction.UPGRADE
                  ? await runtime.upgrade(options)
                  : await runtime.remove(options);
    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.ADOPT_ACTION,
        status: this.toCliStatus(operationResult.verificationStatus),
        detail: `action=${operationResult.action}`,
      },
      {
        id: CliCommandResultCheckId.ADOPT_TARGET,
        status: this.toCliStatus(operationResult.verificationStatus),
        detail:
          operationResult.packId && operationResult.profileId
            ? `pack=${operationResult.packId} profile=${operationResult.profileId}`
            : `repo=${operationResult.repoRoot}`,
      },
      ...operationResult.checks.map((check) => ({
        id: check.checkId,
        status: this.toCliStatus(check.status),
        detail: check.detail,
      })),
      ...(operationResult.receiptPath
        ? [
            {
              id: CliCommandResultCheckId.ADOPT_RECEIPT,
              status: this.toCliStatus(operationResult.verificationStatus),
              detail: `receipt=${operationResult.receiptPath}`,
            },
          ]
        : []),
    ];
    const artifacts: CliCommandResultArtifact[] = [
      ...(operationResult.receiptPath
        ? [
            {
              id: 'adoption_install_receipt',
              path: operationResult.receiptPath,
            },
          ]
        : []),
      ...(operationResult.verificationSummaryPath
        ? [
            {
              id: 'adoption_verification_summary',
              path: operationResult.verificationSummaryPath,
            },
          ]
        : []),
      ...(operationResult.diffReportPath
        ? [
            {
              id: 'adoption_diff_report',
              path: operationResult.diffReportPath,
            },
          ]
        : []),
      ...(operationResult.initManifestPath
        ? [
            {
              id: 'init_manifest',
              path: operationResult.initManifestPath,
            },
          ]
        : []),
      ...(operationResult.doctorDiagnosticsPath
        ? [
            {
              id: 'doctor_diagnostics',
              path: operationResult.doctorDiagnosticsPath,
            },
          ]
        : []),
      ...(operationResult.bootstrapSummaryPath
        ? [
            {
              id: 'adoption_bootstrap_summary',
              path: operationResult.bootstrapSummaryPath,
            },
          ]
        : []),
    ];
    const message = this.resolveMessage(
      context,
      operationResult.action,
      operationResult.packId,
      operationResult.verificationStatus,
      operationResult.userFacingMessage ?? null,
    );
    const checkTotals = context.calculateCheckTotals(checks);
    const blockingChecks = checks
      .filter((check) => check.status === CliGovernanceCheckStatus.FAIL)
      .map((check) => check.id);

    if (operationResult.verificationStatus === 'fail') {
      throw new RuntimeError(GovernorErrorCode.STANDARDS_PACK_INVALID, message, {
        action: operationResult.action,
        packId: operationResult.packId,
        profileId: operationResult.profileId,
        repoRoot: operationResult.repoRoot,
        ...(operationResult.receiptPath ? { receiptPath: operationResult.receiptPath } : {}),
        ...(operationResult.verificationSummaryPath
          ? { verificationSummaryPath: operationResult.verificationSummaryPath }
          : {}),
        ...(operationResult.diffReportPath
          ? { diffReportPath: operationResult.diffReportPath }
          : {}),
        ...(operationResult.initManifestPath
          ? { initManifestPath: operationResult.initManifestPath }
          : {}),
        ...(operationResult.doctorDiagnosticsPath
          ? { doctorDiagnosticsPath: operationResult.doctorDiagnosticsPath }
          : {}),
        ...(operationResult.bootstrapSummaryPath
          ? { bootstrapSummaryPath: operationResult.bootstrapSummaryPath }
          : {}),
        checks,
        blockingChecks,
        checkTotals,
        artifacts,
      });
    }

    return {
      message,
      commandResult: {
        operation: this.resolveOperation(operationResult.action),
        summary: message,
        check_totals: checkTotals,
        checks,
        artifacts,
        details: {
          repo_root: operationResult.repoRoot,
          ...(operationResult.packId ? { pack_id: operationResult.packId } : {}),
          ...(operationResult.profileId ? { profile_id: operationResult.profileId } : {}),
          ...(operationResult.workspaceMode
            ? { workspace_mode: operationResult.workspaceMode }
            : {}),
          managed_file_count: String(operationResult.managedFileCount),
          host_target_count: String(operationResult.hostTargets.length),
          ...(operationResult.availablePacks
            ? { available_pack_count: String(operationResult.availablePacks.length) }
            : {}),
          ...(operationResult.selectorResolution
            ? { selector_resolution: operationResult.selectorResolution }
            : {}),
          ...(operationResult.reentryMode ? { reentry_mode: operationResult.reentryMode } : {}),
          ...(operationResult.initManifestPath
            ? { init_manifest_path: operationResult.initManifestPath }
            : {}),
          ...(operationResult.doctorDiagnosticsPath
            ? { doctor_diagnostics_path: operationResult.doctorDiagnosticsPath }
            : {}),
          ...(operationResult.bootstrapSummaryPath
            ? { bootstrap_summary_path: operationResult.bootstrapSummaryPath }
            : {}),
        },
      },
    };
  }

  private resolveOperation(action: CliAdoptAction) {
    switch (action) {
      case CliAdoptAction.LIST:
        return CLI_RUNTIME_OPERATION.ADOPTION_LIST;
      case CliAdoptAction.BOOTSTRAP:
        return CLI_RUNTIME_OPERATION.ADOPTION_BOOTSTRAP;
      case CliAdoptAction.APPLY:
        return CLI_RUNTIME_OPERATION.ADOPTION_APPLY;
      case CliAdoptAction.DIFF:
        return CLI_RUNTIME_OPERATION.ADOPTION_DIFF;
      case CliAdoptAction.VERIFY:
        return CLI_RUNTIME_OPERATION.ADOPTION_VERIFY;
      case CliAdoptAction.UPGRADE:
        return CLI_RUNTIME_OPERATION.ADOPTION_UPGRADE;
      default:
        return CLI_RUNTIME_OPERATION.ADOPTION_REMOVE;
    }
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
    action: CliAdoptAction,
    packId: string | null,
    verificationStatus: string,
    userFacingMessage: string | null,
  ): string {
    if (userFacingMessage) {
      return userFacingMessage;
    }
    const packInterpolation = packId ? { packId } : undefined;
    if (verificationStatus === 'fail' && action === CliAdoptAction.BOOTSTRAP) {
      if (!packInterpolation) {
        return context.translate('cli.commands.adopt.bootstrapBlockedGeneric');
      }
      return context.translate('cli.commands.adopt.bootstrapBlocked', packInterpolation);
    }
    switch (action) {
      case CliAdoptAction.LIST:
        return context.translate('cli.commands.adopt.listCompleted');
      case CliAdoptAction.BOOTSTRAP:
        return context.translate('cli.commands.adopt.bootstrapCompleted', packInterpolation);
      case CliAdoptAction.APPLY:
        return context.translate('cli.commands.adopt.applyCompleted', packInterpolation);
      case CliAdoptAction.DIFF:
        return context.translate('cli.commands.adopt.diffCompleted', packInterpolation);
      case CliAdoptAction.VERIFY:
        return context.translate('cli.commands.adopt.verifyCompleted', packInterpolation);
      case CliAdoptAction.UPGRADE:
        return context.translate('cli.commands.adopt.upgradeCompleted', packInterpolation);
      default:
        return context.translate('cli.commands.adopt.removeCompleted', packInterpolation);
    }
  }
}
