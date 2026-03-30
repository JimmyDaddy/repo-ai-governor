import { resolve } from 'node:path';
import { stringify } from 'yaml';

import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { CliCommandResultCheckId } from '../constants/cli-command-result-check.constant.js';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_REVIEW_LEDGER_BACKFILL_STATUS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../constants/cli-interactive-shell.constant.js';
import { DEFAULT_CLI_REACT_THEME_PRESET } from '../constants/cli-react-theme.constant.js';
import {
  ReactCliCommandDescriptorCatalog,
  ReactCliCommandViewModelBuilder,
  type ReactCliViewModel,
} from '../react-cli/index.js';
import type { CliCommandResultArtifact, CliCommandResultCheck } from '../types/index.js';
import type { CliCommandExecutorContext } from '../types/interfaces/cli-governance-runtime.interface.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

interface CliConnectCommandDependencies {
  descriptorCatalog?: ReactCliCommandDescriptorCatalog;
  viewModelBuilder?: ReactCliCommandViewModelBuilder;
}

/**
 * Owns `connect` command execution outside the runtime facade.
 */
export class CliConnectCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.CONNECT;

  private readonly descriptorCatalog: ReactCliCommandDescriptorCatalog;
  private readonly viewModelBuilder: ReactCliCommandViewModelBuilder;

  public constructor(dependencies: CliConnectCommandDependencies = {}) {
    this.descriptorCatalog =
      dependencies.descriptorCatalog ?? new ReactCliCommandDescriptorCatalog();
    this.viewModelBuilder = dependencies.viewModelBuilder ?? new ReactCliCommandViewModelBuilder();
  }

  public async execute(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.recordLedger && !runtimeDebugOptions.taskId) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        'connect --record-ledger requires --task-id <id>.',
        {
          command: CliCommandName.CONNECT,
          option: '--task-id',
        },
      );
    }

    const connectId = `connect-${Date.now()}`;
    const diagnosticsArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
      `${connectId}.json`,
    );
    const candidateConfigArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
      `${connectId}.governor.yaml`,
    );
    const candidateConfigResolution = context.onboardingRuntime.buildConnectCandidateConfig({
      sourceConfig: context.options.config,
      presetId: runtimeDebugOptions.presetId,
      requestedTools: runtimeDebugOptions.requestedTools,
      overwrite: runtimeDebugOptions.overwrite,
      singleToolAllRoles: runtimeDebugOptions.singleToolAllRoles,
      roleBindingOverrides: runtimeDebugOptions.roleBindingOverrides,
    });
    let validatedCandidateConfig: typeof candidateConfigResolution.candidateConfig | null = null;
    let candidateConfigValidationError: string | null = null;
    try {
      validatedCandidateConfig = context.validateGovernorConfig(
        candidateConfigResolution.candidateConfig,
      );
    } catch (error) {
      candidateConfigValidationError = context.formatExecFailureDetail(error);
    }
    const effectiveCandidateConfig =
      validatedCandidateConfig ?? candidateConfigResolution.candidateConfig;
    await context.artifactWriter.writeTextArtifact(
      candidateConfigArtifactPath,
      `${stringify(effectiveCandidateConfig).trimEnd()}\n`,
    );

    const adapterVerification = await context.resolveAdapterVerificationForConfig(
      effectiveCandidateConfig.adapters ?? context.options.adaptersConfig,
    );
    const diagnosticSummary = `status=${adapterVerification.overallStatus} required_failures=${adapterVerification.requiredRoleFailedCount} fallback_roles=${adapterVerification.fallbackRoleCount} degraded_roles=${adapterVerification.degradedRoleCount}`;
    const onboardingContract = context.onboardingRuntime.createOnboardingContractPayload({
      commandName: 'connect',
      executionId: connectId,
      workspaceId: context.options.workspace.workspaceId,
      verificationStatus: adapterVerification.overallStatus,
      nextActions: adapterVerification.nextActions,
      enabledTools: candidateConfigResolution.selectedTools,
      adaptersConfig: effectiveCandidateConfig.adapters ?? context.options.adaptersConfig,
      dryRun: runtimeDebugOptions.dryRun,
      overwrite: runtimeDebugOptions.overwrite,
      singleToolAllRoles: runtimeDebugOptions.singleToolAllRoles,
      presetId: runtimeDebugOptions.presetId,
      diagnosticSummary,
    });
    const agentView = context.agentProjectionRuntime.createCliAgentView({
      descriptors: context.agentProjectionRuntime.createDescriptorsFromRoleEvaluations({
        adaptersConfig: effectiveCandidateConfig.adapters ?? context.options.adaptersConfig,
        verification: adapterVerification,
        workspace: context.options.workspace,
        executionId: connectId,
      }),
    });

    await context.artifactWriter.writeJsonArtifact(diagnosticsArtifactPath, {
      connectId,
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        workspaceMode: context.options.workspace.mode,
      },
      sourceAdapters: context.options.adaptersConfig,
      candidateConfigPath: candidateConfigArtifactPath,
      candidateConfig: effectiveCandidateConfig,
      candidateConfigValidationError,
      onboardingContract,
      agentView,
      verification:
        context.adapterDiagnosticsRuntime.createAdapterVerificationArtifactPayload(
          adapterVerification,
        ),
      nextActions: adapterVerification.nextActions,
      behavior: {
        recordLedger: runtimeDebugOptions.recordLedger,
        taskId: runtimeDebugOptions.taskId,
      },
    });

    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.ADAPTER_VERIFICATION,
        status: adapterVerification.overallStatus,
        detail: `required_roles=${adapterVerification.requiredRoleCount} required_failures=${adapterVerification.requiredRoleFailedCount} degraded_roles=${adapterVerification.degradedRoleCount} fallback_roles=${adapterVerification.fallbackRoleCount}`,
      },
      {
        id: 'candidate_config',
        status:
          candidateConfigValidationError === null
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.WARN,
        detail: candidateConfigArtifactPath,
      },
      {
        id: 'agent_projection',
        status: CliGovernanceCheckStatus.PASS,
        detail: `descriptors=${agentView.descriptors.length} preset=${runtimeDebugOptions.presetId ?? 'none'}`,
      },
      {
        id: 'diagnostics_artifact',
        status: CliGovernanceCheckStatus.PASS,
        detail: diagnosticsArtifactPath,
      },
    ];
    const artifacts: CliCommandResultArtifact[] = [
      {
        id: 'connect_diagnostics',
        path: diagnosticsArtifactPath,
      },
      {
        id: 'connect_candidate_config',
        path: candidateConfigArtifactPath,
      },
    ];

    if (runtimeDebugOptions.recordLedger && runtimeDebugOptions.taskId) {
      const ledgerBackfillPath = resolve(
        context.options.workspace.workspaceRoot,
        'context',
        'ledger-backfill',
        'connect',
        `${connectId}.json`,
      );
      await context.artifactWriter.writeJsonArtifact(ledgerBackfillPath, {
        ledgerBackfillId: `ledger-backfill-${connectId}`,
        status: CLI_REVIEW_LEDGER_BACKFILL_STATUS.PENDING,
        createdAt: context.toRfc3339SecondsTimestamp(new Date()),
        taskId: runtimeDebugOptions.taskId,
        connectId,
        diagnosticsArtifactPath,
        candidateConfigArtifactPath,
        attribution: {
          chain: 'connect->doctor->verify',
          chainStep: 'connect',
        },
      });
      checks.push({
        id: 'ledger_backfill',
        status: CliGovernanceCheckStatus.PASS,
        detail: `task_id=${runtimeDebugOptions.taskId}`,
      });
      artifacts.push({
        id: 'connect_ledger_backfill',
        path: ledgerBackfillPath,
      });
    } else if (runtimeDebugOptions.taskId) {
      checks.push({
        id: 'ledger_backfill',
        status: CliGovernanceCheckStatus.WARN,
        detail: '--task-id ignored because --record-ledger is not set',
      });
    }

    const roleProgress = context.adapterDiagnosticsRuntime.createAdapterRoleProgressRows({
      verification: adapterVerification,
      stage: ExecutionProgressStage.CONNECT,
      diagnosticsPath: diagnosticsArtifactPath,
      executionId: connectId,
    });
    if (runtimeDebugOptions.recordLedger && runtimeDebugOptions.taskId) {
      roleProgress.push({
        roleId: 'ledger-backfill',
        stage: ExecutionProgressStage.LEDGER_BACKFILL,
        status: ExecutionProgressStatus.WAITING,
        category: ExecutionInteractionCategory.NONE,
        summary: 'Ledger backfill artifact is ready for task-record consumption.',
        detail: `task_id=${runtimeDebugOptions.taskId}`,
        backlink: {
          executionId: connectId,
          stageId: ExecutionProgressStage.LEDGER_BACKFILL,
          artifactPath: diagnosticsArtifactPath,
        },
      });
    }
    const interactionPrompts = context.adapterDiagnosticsRuntime.createAdapterInteractionPrompts({
      verification: adapterVerification,
      stage: ExecutionProgressStage.CONNECT,
    });
    if (runtimeDebugOptions.recordLedger && runtimeDebugOptions.taskId) {
      interactionPrompts.push({
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.LEDGER_BACKFILL,
        title: this.translate(context, 'cli.reactShell.connect.prompt.consumeLedgerBackfill'),
        action: this.translate(context, 'cli.reactShell.connect.prompt.resolveLedgerBackfill'),
        blocking: false,
      });
    }
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress,
      interactionPrompts,
      layeredLogs: {
        summary: [
          `connect_id=${connectId}`,
          `adapter_status=${adapterVerification.overallStatus}`,
          `preset=${runtimeDebugOptions.presetId ?? 'none'}`,
          `required_failures=${adapterVerification.requiredRoleFailedCount}`,
        ],
        detailed: [
          `diagnostics_path=${diagnosticsArtifactPath}`,
          `candidate_config_path=${candidateConfigArtifactPath}`,
          `fallback_roles=${adapterVerification.fallbackRoleCount}`,
          `degraded_roles=${adapterVerification.degradedRoleCount}`,
          `record_ledger=${runtimeDebugOptions.recordLedger}`,
        ],
      },
    });
    const message = this.translate(context, 'cli.reactShell.connect.message.completed', {
      status: adapterVerification.overallStatus,
      diagnosticsPath: diagnosticsArtifactPath,
    });
    const reactCliViewModel = this.buildReactCliViewModel(context, {
      runtimeDebugOptions,
      diagnosticsArtifactPath,
      adapterVerification,
      checks,
      interactionPrompts,
      message,
    });
    return {
      message,
      reactCliViewModel,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.ADAPTER_CONNECT,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        agentView,
        details: {
          adapter_status: adapterVerification.overallStatus,
          required_roles: adapterVerification.requiredRoleCount,
          required_role_failures: adapterVerification.requiredRoleFailedCount,
          diagnostics_path: diagnosticsArtifactPath,
          candidate_config_path: candidateConfigArtifactPath,
          candidate_config_valid: candidateConfigValidationError === null,
          selected_tools: candidateConfigResolution.selectedTools.join('|'),
          preset_id: runtimeDebugOptions.presetId,
          record_ledger: runtimeDebugOptions.recordLedger,
          task_id: runtimeDebugOptions.taskId,
        },
      },
    };
  }

  /**
   * Builds the shared React CLI summary view for `connect` when React mode is active.
   * @param context Command execution context.
   * @param options Local execution facts used to populate the shared shell.
   * @returns Shared shell view model or `undefined`.
   */
  private buildReactCliViewModel(
    context: CliCommandExecutorContext,
    options: {
      runtimeDebugOptions: ReturnType<CliCommandExecutorContext['resolveRuntimeDebugOptions']>;
      diagnosticsArtifactPath: string;
      adapterVerification: Awaited<
        ReturnType<CliCommandExecutorContext['resolveAdapterVerification']>
      >;
      checks: CliCommandResultCheck[];
      interactionPrompts: ReturnType<
        CliCommandExecutorContext['adapterDiagnosticsRuntime']['createAdapterInteractionPrompts']
      >;
      message: string;
    },
  ): ReactCliViewModel | undefined {
    if (options.runtimeDebugOptions.uiMode !== CliInteractiveUiMode.REACT) {
      return undefined;
    }

    const descriptor = this.descriptorCatalog
      .createRegistry({
        translate: context.translate,
      })
      .resolve(CliCommandName.CONNECT);

    if (!descriptor) {
      return undefined;
    }

    const resolvedThemePreset =
      options.runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET;
    return this.viewModelBuilder.build({
      commandName: CliCommandName.CONNECT,
      descriptor,
      subtitle: `ui=${options.runtimeDebugOptions.uiMode} theme=${resolvedThemePreset} stdout=${context.options.outputMode} workspace=${context.options.workspace.mode}`,
      inputTitle: this.translate(context, 'cli.reactShell.shared.inputs'),
      summaryTitle: this.translate(context, 'cli.reactShell.shared.summary'),
      attentionTitle: this.translate(context, 'cli.reactShell.shared.attention'),
      themePreset: resolvedThemePreset,
      statusMessage: this.translate(context, 'cli.reactShell.connect.status.verification', {
        status: options.adapterVerification.overallStatus,
      }),
      statusVariant: this.viewModelBuilder.resolveStatusVariantFromChecks(options.checks),
      fieldValues: {
        workspaceRoot: context.options.workspace.workspaceRoot,
        recordLedger: this.translate(
          context,
          options.runtimeDebugOptions.recordLedger
            ? 'cli.reactShell.shared.enabled'
            : 'cli.reactShell.shared.disabled',
        ),
        taskId:
          options.runtimeDebugOptions.taskId ??
          this.translate(context, 'cli.reactShell.shared.notSet'),
      },
      summaryLines: [
        options.message,
        this.translate(context, 'cli.reactShell.connect.summary.diagnosticsArtifact', {
          path: options.diagnosticsArtifactPath,
        }),
        this.translate(context, 'cli.reactShell.connect.summary.roleTotals', {
          requiredRoles: String(options.adapterVerification.requiredRoleCount),
          requiredFailures: String(options.adapterVerification.requiredRoleFailedCount),
          degradedRoles: String(options.adapterVerification.degradedRoleCount),
          fallbackRoles: String(options.adapterVerification.fallbackRoleCount),
        }),
      ],
      footerShortcutsTitle: this.translate(context, 'cli.reactShell.shared.shortcuts'),
      checks: options.checks,
      interactionPrompts: options.interactionPrompts,
    });
  }

  /**
   * Resolves one localized React-shell string through i18n runtime.
   * @param context Command execution context.
   * @param key Translation key.
   * @param interpolation Optional translation variables.
   * @returns Localized string or the key when translation runtime is unavailable.
   */
  private translate(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    key: string,
    interpolation?: Record<string, string>,
  ): string {
    return context.translate?.(key, interpolation) ?? key;
  }
}
