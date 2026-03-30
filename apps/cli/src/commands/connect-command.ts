import { readFile } from 'node:fs/promises';
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
import { CliConnectAction } from '../constants/cli-connect.constant.js';
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
import { CliConnectWorkflowRuntime } from '../runtime/connect-workflow-runtime.js';
import type { CliCommandResultArtifact, CliCommandResultCheck } from '../types/index.js';
import type { CliCommandExecutorContext } from '../types/interfaces/cli-governance-runtime.interface.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

interface CliConnectCommandDependencies {
  descriptorCatalog?: ReactCliCommandDescriptorCatalog;
  viewModelBuilder?: ReactCliCommandViewModelBuilder;
  connectWorkflowRuntime?: CliConnectWorkflowRuntime;
}

/**
 * Owns `connect` command execution outside the runtime facade.
 */
export class CliConnectCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.CONNECT;

  private readonly descriptorCatalog: ReactCliCommandDescriptorCatalog;
  private readonly viewModelBuilder: ReactCliCommandViewModelBuilder;
  private readonly connectWorkflowRuntime: CliConnectWorkflowRuntime;

  public constructor(dependencies: CliConnectCommandDependencies = {}) {
    this.descriptorCatalog =
      dependencies.descriptorCatalog ?? new ReactCliCommandDescriptorCatalog();
    this.viewModelBuilder = dependencies.viewModelBuilder ?? new ReactCliCommandViewModelBuilder();
    this.connectWorkflowRuntime =
      dependencies.connectWorkflowRuntime ?? new CliConnectWorkflowRuntime();
  }

  public async execute(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.connectAction === CliConnectAction.DIFF) {
      return await this.executeDiff(context);
    }

    if (runtimeDebugOptions.connectAction === CliConnectAction.APPLY) {
      return await this.executeApply(context);
    }

    return await this.executeGenerate(context);
  }

  private async executeGenerate(context: CliCommandExecutorContext) {
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
    const candidateDiffArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
      `${connectId}.diff.json`,
    );
    const candidateDiffMarkdownArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
      `${connectId}.diff.md`,
    );
    const candidateMergeExplainArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
      `${connectId}.merge-explain.json`,
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
    const candidateArtifacts = this.connectWorkflowRuntime.buildCandidateArtifacts({
      sourceConfig: context.options.config,
      candidateConfig: effectiveCandidateConfig,
      overwrite: runtimeDebugOptions.overwrite,
      candidateValidationError: candidateConfigValidationError,
      adapterVerification: {
        overallStatus: adapterVerification.overallStatus,
        requiredRoleFailedCount: adapterVerification.requiredRoleFailedCount,
        degradedRoleCount: adapterVerification.degradedRoleCount,
        fallbackRoleCount: adapterVerification.fallbackRoleCount,
      },
    });
    await context.artifactWriter.writeJsonArtifact(
      candidateDiffArtifactPath,
      candidateArtifacts.diffSummary,
    );
    await context.artifactWriter.writeTextArtifact(
      candidateDiffMarkdownArtifactPath,
      candidateArtifacts.diffMarkdown,
    );
    await context.artifactWriter.writeJsonArtifact(
      candidateMergeExplainArtifactPath,
      candidateArtifacts.mergeExplain,
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
      sourceConfig: context.options.config,
      sourceAdapters: context.options.adaptersConfig,
      candidateConfigPath: candidateConfigArtifactPath,
      candidateConfig: effectiveCandidateConfig,
      candidateConfigValidationError,
      candidateArtifacts: {
        diffJsonPath: candidateDiffArtifactPath,
        diffMarkdownPath: candidateDiffMarkdownArtifactPath,
        mergeExplainPath: candidateMergeExplainArtifactPath,
      },
      candidateFingerprint: {
        sourceConfigHash: candidateArtifacts.sourceConfigHash,
        candidateConfigHash: candidateArtifacts.candidateConfigHash,
        writeMode: candidateArtifacts.writeMode,
        applyReady: candidateArtifacts.applyReady,
        applyBlockers: candidateArtifacts.applyBlockers,
        riskNotes: candidateArtifacts.riskNotes,
      },
      candidateDiff: candidateArtifacts.diffSummary,
      mergeExplain: candidateArtifacts.mergeExplain,
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
        id: 'candidate_diff',
        status: CliGovernanceCheckStatus.PASS,
        detail: candidateDiffArtifactPath,
      },
      {
        id: 'candidate_merge_explain',
        status: CliGovernanceCheckStatus.PASS,
        detail: candidateMergeExplainArtifactPath,
      },
      {
        id: 'candidate_apply_ready',
        status: candidateArtifacts.applyReady
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
        detail:
          candidateArtifacts.applyBlockers.length > 0
            ? candidateArtifacts.applyBlockers.join('|')
            : 'apply_ready=true',
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
      {
        id: 'connect_candidate_diff',
        path: candidateDiffArtifactPath,
      },
      {
        id: 'connect_candidate_diff_markdown',
        path: candidateDiffMarkdownArtifactPath,
      },
      {
        id: 'connect_candidate_merge_explain',
        path: candidateMergeExplainArtifactPath,
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
          `candidate_diff_path=${candidateDiffArtifactPath}`,
          `candidate_merge_explain_path=${candidateMergeExplainArtifactPath}`,
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
          candidate_diff_path: candidateDiffArtifactPath,
          candidate_merge_explain_path: candidateMergeExplainArtifactPath,
          candidate_config_valid: candidateConfigValidationError === null,
          source_config_hash: candidateArtifacts.sourceConfigHash,
          candidate_config_hash: candidateArtifacts.candidateConfigHash,
          candidate_write_mode: candidateArtifacts.writeMode,
          candidate_apply_ready: candidateArtifacts.applyReady,
          candidate_apply_blockers:
            candidateArtifacts.applyBlockers.length > 0
              ? candidateArtifacts.applyBlockers.join('|')
              : null,
          selected_tools: candidateConfigResolution.selectedTools.join('|'),
          preset_id: runtimeDebugOptions.presetId,
          record_ledger: runtimeDebugOptions.recordLedger,
          task_id: runtimeDebugOptions.taskId,
        },
      },
    };
  }

  private async executeDiff(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    const diffId = `connect-diff-${Date.now()}`;
    const candidateReference = await this.connectWorkflowRuntime.resolveCandidateReference({
      currentWorkingDirectory: context.options.currentWorkingDirectory,
      workspaceRoot: context.options.workspace.workspaceRoot,
      candidatePath: runtimeDebugOptions.connectCandidatePath,
      latest: runtimeDebugOptions.connectLatest,
      validateGovernorConfig: (candidate) => context.validateGovernorConfig(candidate),
      fallbackAdaptersConfig: context.options.adaptersConfig,
      resolveAdapterVerificationForConfig: async (adaptersConfig) => {
        const verification = await context.resolveAdapterVerificationForConfig(adaptersConfig);
        return {
          overallStatus: verification.overallStatus,
          requiredRoleFailedCount: verification.requiredRoleFailedCount,
          degradedRoleCount: verification.degradedRoleCount,
          fallbackRoleCount: verification.fallbackRoleCount,
        };
      },
    });
    const sourceFingerprintCurrent = this.connectWorkflowRuntime.isSourceFingerprintCurrent(
      context.options.config,
      candidateReference,
    );
    if (!sourceFingerprintCurrent && !runtimeDebugOptions.connectForce) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `connect diff blocked because active governor.yaml diverged from candidate source fingerprint. candidate=${candidateReference.candidatePath}`,
        {
          candidatePath: candidateReference.candidatePath,
          diagnosticsPath: candidateReference.diagnosticsPath,
        },
      );
    }

    const refreshedArtifacts = this.connectWorkflowRuntime.buildDiffArtifacts({
      currentConfig: context.options.config,
      candidateReference,
    });
    const diffArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
      'diff',
      `${diffId}.diff.json`,
    );
    const diffMarkdownArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
      'diff',
      `${diffId}.diff.md`,
    );
    const mergeExplainArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
      'diff',
      `${diffId}.merge-explain.json`,
    );
    await context.artifactWriter.writeJsonArtifact(
      diffArtifactPath,
      refreshedArtifacts.diffSummary,
    );
    await context.artifactWriter.writeTextArtifact(
      diffMarkdownArtifactPath,
      refreshedArtifacts.diffMarkdown,
    );
    await context.artifactWriter.writeJsonArtifact(
      mergeExplainArtifactPath,
      refreshedArtifacts.mergeExplain,
    );

    const checks: CliCommandResultCheck[] = [
      {
        id: 'candidate_reference',
        status: CliGovernanceCheckStatus.PASS,
        detail: candidateReference.candidatePath,
      },
      {
        id: 'source_fingerprint',
        status: sourceFingerprintCurrent
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
        detail: sourceFingerprintCurrent ? 'current=true' : 'current=false force=true',
      },
      {
        id: 'candidate_diff',
        status: CliGovernanceCheckStatus.PASS,
        detail: diffArtifactPath,
      },
      {
        id: 'candidate_fingerprint',
        status: candidateReference.candidateFingerprintCurrent
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
        detail: candidateReference.candidateFingerprintCurrent
          ? 'current=true'
          : 'current=false diagnostics_stale=true',
      },
      {
        id: 'candidate_merge_explain',
        status: CliGovernanceCheckStatus.PASS,
        detail: mergeExplainArtifactPath,
      },
      {
        id: 'candidate_apply_ready',
        status: candidateReference.applyReady
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
        detail:
          candidateReference.applyBlockers.length > 0
            ? candidateReference.applyBlockers.join('|')
            : 'apply_ready=true',
      },
    ];
    const artifacts: CliCommandResultArtifact[] = [
      { id: 'connect_diff', path: diffArtifactPath },
      { id: 'connect_diff_markdown', path: diffMarkdownArtifactPath },
      { id: 'connect_merge_explain', path: mergeExplainArtifactPath },
    ];
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [],
      interactionPrompts: [],
      layeredLogs: {
        summary: [
          `connect_diff_id=${diffId}`,
          `candidate_path=${candidateReference.candidatePath}`,
          `source_fingerprint_current=${sourceFingerprintCurrent}`,
        ],
        detailed: [
          `diagnostics_path=${candidateReference.diagnosticsPath}`,
          `diff_path=${diffArtifactPath}`,
          `merge_explain_path=${mergeExplainArtifactPath}`,
        ],
      },
    });
    const message = context.localizeText(
      `Connect diff refreshed from ${candidateReference.candidatePath}.`,
      `已根据 ${candidateReference.candidatePath} 刷新 connect diff。`,
    );

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.ADAPTER_CONNECT_DIFF,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        details: {
          candidate_path: candidateReference.candidatePath,
          diagnostics_path: candidateReference.diagnosticsPath,
          source_fingerprint_current: sourceFingerprintCurrent,
          candidate_fingerprint_current: candidateReference.candidateFingerprintCurrent,
          diagnostics_candidate_config_hash: candidateReference.diagnosticsCandidateConfigHash,
          source_config_hash: candidateReference.sourceConfigHash,
          candidate_config_hash: candidateReference.candidateConfigHash,
          write_mode: candidateReference.writeMode,
          diff_path: diffArtifactPath,
          diff_markdown_path: diffMarkdownArtifactPath,
          merge_explain_path: mergeExplainArtifactPath,
        },
      },
    };
  }

  private async executeApply(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    const candidateReference = await this.connectWorkflowRuntime.resolveCandidateReference({
      currentWorkingDirectory: context.options.currentWorkingDirectory,
      workspaceRoot: context.options.workspace.workspaceRoot,
      candidatePath: runtimeDebugOptions.connectCandidatePath,
      latest: runtimeDebugOptions.connectLatest,
      validateGovernorConfig: (candidate) => context.validateGovernorConfig(candidate),
      fallbackAdaptersConfig: context.options.adaptersConfig,
      resolveAdapterVerificationForConfig: async (adaptersConfig) => {
        const verification = await context.resolveAdapterVerificationForConfig(adaptersConfig);
        return {
          overallStatus: verification.overallStatus,
          requiredRoleFailedCount: verification.requiredRoleFailedCount,
          degradedRoleCount: verification.degradedRoleCount,
          fallbackRoleCount: verification.fallbackRoleCount,
        };
      },
    });
    const sourceFingerprintCurrent = this.connectWorkflowRuntime.isSourceFingerprintCurrent(
      context.options.config,
      candidateReference,
    );
    if (candidateReference.applyBlockers.length > 0 && !runtimeDebugOptions.connectForce) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `connect apply blocked because candidate is not apply-ready: ${candidateReference.applyBlockers.join(', ')}`,
        {
          candidatePath: candidateReference.candidatePath,
          diagnosticsPath: candidateReference.diagnosticsPath,
        },
      );
    }
    if (!sourceFingerprintCurrent && !runtimeDebugOptions.connectForce) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `connect apply blocked because active governor.yaml diverged from candidate source fingerprint. candidate=${candidateReference.candidatePath}`,
        {
          candidatePath: candidateReference.candidatePath,
          diagnosticsPath: candidateReference.diagnosticsPath,
        },
      );
    }

    const configWritable = await context.canWritePath(context.options.workspace.configPath);
    if (!configWritable) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        `connect apply requires write access to ${context.options.workspace.configPath}.`,
        {
          configPath: context.options.workspace.configPath,
        },
      );
    }

    const applyId = `connect-apply-${Date.now()}`;
    const rollbackArtifactPath = runtimeDebugOptions.connectRollbackEnabled
      ? resolve(
          context.options.workspace.workspaceRoot,
          'context',
          'diagnostics',
          'connect',
          'apply',
          `${applyId}.rollback.governor.yaml`,
        )
      : null;
    const applyReceiptArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
      'apply',
      `${applyId}.json`,
    );
    const currentConfigContent = await readFile(context.options.workspace.configPath, 'utf8');
    if (rollbackArtifactPath) {
      await context.artifactWriter.writeTextArtifact(rollbackArtifactPath, currentConfigContent);
    }
    await context.artifactWriter.writeTextArtifact(
      context.options.workspace.configPath,
      `${stringify(candidateReference.candidateConfig).trimEnd()}\n`,
    );
    const appliedConfig = context.validateGovernorConfig(candidateReference.candidateConfig);
    const applyReceipt = {
      ...this.connectWorkflowRuntime.buildApplyReceipt({
        currentConfig: context.options.config,
        candidateReference,
        rollbackArtifactPath,
        sourceConfigPath: context.options.workspace.configPath,
        applyId,
        force: runtimeDebugOptions.connectForce,
        rollbackEnabled: runtimeDebugOptions.connectRollbackEnabled,
      }),
      appliedConfigHash: this.connectWorkflowRuntime.hashConfig(appliedConfig),
      appliedAt: context.toRfc3339SecondsTimestamp(new Date()),
    };
    await context.artifactWriter.writeJsonArtifact(applyReceiptArtifactPath, applyReceipt);

    const checks: CliCommandResultCheck[] = [
      {
        id: 'candidate_reference',
        status: CliGovernanceCheckStatus.PASS,
        detail: candidateReference.candidatePath,
      },
      {
        id: 'source_fingerprint',
        status: sourceFingerprintCurrent
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
        detail: sourceFingerprintCurrent ? 'current=true' : 'current=false force=true',
      },
      {
        id: 'candidate_fingerprint',
        status: candidateReference.candidateFingerprintCurrent
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
        detail: candidateReference.candidateFingerprintCurrent
          ? 'current=true'
          : 'current=false diagnostics_stale=true',
      },
      {
        id: CliCommandResultCheckId.ROLLBACK_REFERENCE,
        status: runtimeDebugOptions.connectRollbackEnabled
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
        detail: rollbackArtifactPath ?? 'rollback_disabled',
      },
      {
        id: 'apply_receipt',
        status: CliGovernanceCheckStatus.PASS,
        detail: applyReceiptArtifactPath,
      },
    ];
    const artifacts: CliCommandResultArtifact[] = [
      { id: 'connect_apply_receipt', path: applyReceiptArtifactPath },
      ...(rollbackArtifactPath
        ? [{ id: 'connect_apply_rollback_snapshot', path: rollbackArtifactPath }]
        : []),
    ];
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [],
      interactionPrompts: [
        {
          category: ExecutionInteractionCategory.NONE,
          stage: ExecutionProgressStage.CONNECT,
          title: context.localizeText('Follow-up', '后续动作'),
          action:
            'repo-ai-governor doctor --adapters && repo-ai-governor verify --adapters && repo-ai-governor run --dry-run --trace',
          blocking: false,
        },
      ],
      layeredLogs: {
        summary: [
          `connect_apply_id=${applyId}`,
          `candidate_path=${candidateReference.candidatePath}`,
          `source_fingerprint_current=${sourceFingerprintCurrent}`,
        ],
        detailed: [
          `receipt_path=${applyReceiptArtifactPath}`,
          `rollback_enabled=${runtimeDebugOptions.connectRollbackEnabled}`,
          ...(rollbackArtifactPath ? [`rollback_path=${rollbackArtifactPath}`] : []),
        ],
      },
    });
    const message = context.localizeText(
      `Connect candidate applied to ${context.options.workspace.configPath}.`,
      `connect 候选配置已应用到 ${context.options.workspace.configPath}。`,
    );

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.ADAPTER_CONNECT_APPLY,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        details: {
          candidate_path: candidateReference.candidatePath,
          diagnostics_path: candidateReference.diagnosticsPath,
          apply_receipt_path: applyReceiptArtifactPath,
          rollback_artifact_path: rollbackArtifactPath,
          source_fingerprint_current: sourceFingerprintCurrent,
          candidate_fingerprint_current: candidateReference.candidateFingerprintCurrent,
          diagnostics_candidate_config_hash: candidateReference.diagnosticsCandidateConfigHash,
          source_config_hash: candidateReference.sourceConfigHash,
          candidate_config_hash: candidateReference.candidateConfigHash,
          applied_config_hash: applyReceipt.appliedConfigHash,
          write_mode: candidateReference.writeMode,
          force: runtimeDebugOptions.connectForce,
          rollback_enabled: runtimeDebugOptions.connectRollbackEnabled,
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
