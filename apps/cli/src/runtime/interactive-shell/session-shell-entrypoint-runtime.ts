import {
  SESSION_DELIVERY_WORKFLOW_PHASE,
  SESSION_MAIN_CAPABILITY_ID,
} from '@repo-ai-governor/core-orchestration-service';
import { RuntimeExecutionStatus } from '@repo-ai-governor/core-runtime';
import {
  type ErrorOutputEnvironment,
  ExecutionProgressStatus,
  GovernorErrorCode,
} from '@repo-ai-governor/shared';
import {
  CLI_COMMAND_NAMES,
  CLI_PROGRAM_NAME,
  CliCommandName,
} from '../../constants/cli-command.constant.js';
import { CliRuntimeOperation } from '../../constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../../constants/cli-interactive-shell.constant.js';
import { CLI_OPTIONS_REQUIRING_VALUE, CliNextAction } from '../../constants/cli-output.constant.js';
import {
  CliPlanAction,
  CliPlanCommitReadiness,
  CliPlanCommitStatus,
  CliPlanConfirmationDecision,
} from '../../constants/cli-plan.constant.js';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import { CLI_SESSION_SHELL_DELIVERY_PENDING_ACTION } from '../../constants/cli-session-shell-delivery-workflow.constant.js';
import { CliWorkspaceAction } from '../../constants/cli-workspace.constant.js';
import type {
  CliCommandExperiencePayload,
  CliErrorOutputPayload,
  CliGovernanceCommandExecutionOptions,
  CliNestedCommandExecutionOptions,
  CliRuntimeDebugOptions,
  CliSessionShellCommandExecutionResult,
  CliSessionShellCommandExecutor,
  CliSessionShellCommandFollowUp,
  CliSessionShellDeliveryWorkflowUpdate,
  CliSessionShellRunOptions,
  CliSessionShellSecureSecretMutator,
  CliSessionShellServiceClientLike,
  CliSuccessOutputPayload,
} from '../../types/index.js';
import { CliAgentProjectionPresenter } from '../presentation/agent-projection-presenter.js';

interface CliSessionShellNestedCliIoAdapters {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
  cwd: () => string;
  isStdoutTty: () => boolean;
  isStdinTty: () => boolean;
  isStderrTty: () => boolean;
  env: () => NodeJS.ProcessEnv;
}

interface CliSessionShellNestedCommandExecutorOptions {
  locale: string;
  currentWorkingDirectory: string;
  environment: NodeJS.ProcessEnv;
  translate: (key: string, interpolation?: Record<string, string>) => string;
  executeCli: (
    argv: string[],
    io: CliSessionShellNestedCliIoAdapters,
    executionOptions?: CliNestedCommandExecutionOptions,
  ) => Promise<number>;
}

interface CliSessionShellEntrypointRuntimeOptions {
  sessionClient: CliSessionShellServiceClientLike;
  commandExecutor?: CliSessionShellCommandExecutor;
  commandExecutionOptions?: CliGovernanceCommandExecutionOptions;
  secureSecretMutator?: CliSessionShellSecureSecretMutator;
  mentionableRoleIds?: string[];
  currentWorkingDirectory: string;
  workspaceSummary: string;
  outputMode: ErrorOutputEnvironment;
  uiTheme?: CliReactThemePreset;
  translate: (key: string, interpolation?: Record<string, string>) => string;
}

interface CliSessionShellRunOptionOverrides {
  resumeOnStartup?: boolean;
  requestedSessionId?: string | null;
  initialPrompt?: string | null;
}

/**
 * Owns session-shell entrypoint routing and nested command wiring outside the legacy CLI main file.
 *
 * Why this exists:
 * the session-first shell now has enough bootstrap-specific behavior that the legacy entrypoint
 * should delegate to one focused runtime instead of absorbing more shell-only responsibilities.
 */
export class CliSessionShellEntrypointRuntime {
  private static readonly agentProjectionPresenter = new CliAgentProjectionPresenter();

  public constructor(private readonly options: CliSessionShellEntrypointRuntimeOptions) {}

  /**
   * Creates one nested command executor that re-enters the CLI in non-interactive JSON mode.
   * @param options Nested CLI execution contract.
   * @returns Session-shell bridge executor.
   */
  public static createNestedCommandExecutor(
    options: CliSessionShellNestedCommandExecutorOptions,
  ): CliSessionShellCommandExecutor {
    return async (
      argvTokens: string[],
      executionOptions?: CliGovernanceCommandExecutionOptions,
    ): Promise<CliSessionShellCommandExecutionResult> => {
      const nestedExecutionOptions =
        executionOptions?.progressSink || executionOptions?.abortSignal
          ? {
              ...executionOptions,
              suppressLiveProgressPresenter: executionOptions.progressSink !== undefined,
            }
          : undefined;
      const nestedStdout: string[] = [];
      const nestedStderr: string[] = [];
      const nestedExitCode = await options.executeCli(
        [
          'node',
          CLI_PROGRAM_NAME,
          '--locale',
          options.locale,
          '--output',
          'json',
          '--no-interactive',
          ...argvTokens,
        ],
        {
          stdout: (value: string) => {
            nestedStdout.push(value);
          },
          stderr: (value: string) => {
            nestedStderr.push(value);
          },
          cwd: () => options.currentWorkingDirectory,
          isStdoutTty: () => false,
          isStdinTty: () => false,
          isStderrTty: () => false,
          env: () => options.environment,
        },
        nestedExecutionOptions,
      );

      return CliSessionShellEntrypointRuntime.summarizeCommandResult({
        commandLine: argvTokens.join(' '),
        exitCode: nestedExitCode,
        locale: options.locale,
        stdoutText: nestedStdout.join('').trim(),
        stderrText: nestedStderr.join('').trim(),
        translate: options.translate,
      });
    };
  }

  /**
   * Creates one runner input payload from the shared CLI runtime context.
   * @param overrides Optional startup overrides such as resume or initial prompt.
   * @returns Session-shell run options.
   */
  public createRunOptions(
    overrides: CliSessionShellRunOptionOverrides = {},
  ): CliSessionShellRunOptions {
    return {
      sessionClient: this.options.sessionClient,
      ...(this.options.commandExecutor
        ? {
            commandExecutor: this.options.commandExecutor,
          }
        : {}),
      ...(this.options.commandExecutionOptions
        ? {
            commandExecutionOptions: this.options.commandExecutionOptions,
          }
        : {}),
      ...(this.options.secureSecretMutator
        ? {
            secureSecretMutator: this.options.secureSecretMutator,
          }
        : {}),
      ...(this.options.mentionableRoleIds
        ? {
            mentionableRoleIds: [...this.options.mentionableRoleIds],
          }
        : {}),
      currentWorkingDirectory: this.options.currentWorkingDirectory,
      workspaceSummary: this.options.workspaceSummary,
      outputMode: this.options.outputMode,
      ...(this.options.uiTheme
        ? {
            uiTheme: this.options.uiTheme,
          }
        : {}),
      ...(overrides.resumeOnStartup !== undefined
        ? {
            resumeOnStartup: overrides.resumeOnStartup,
          }
        : {}),
      ...(overrides.requestedSessionId !== undefined
        ? {
            requestedSessionId: overrides.requestedSessionId,
          }
        : {}),
      ...(overrides.initialPrompt !== undefined
        ? {
            initialPrompt: overrides.initialPrompt,
          }
        : {}),
      translate: this.options.translate,
    };
  }

  /**
   * Detects whether the current output/UI contract can host the live session shell.
   * @param runtimeDebugOptions Resolved UI/TTY/interactivity contract snapshot.
   * @returns True when interactive React session shell usage is allowed.
   */
  public isInteractiveSessionShellAllowed(runtimeDebugOptions: CliRuntimeDebugOptions): boolean {
    return runtimeDebugOptions.uiMode === CliInteractiveUiMode.REACT;
  }

  /**
   * Resolves one optional startup prompt when the entrypoint is used like `repo-ai-governor "query"`.
   * @param args CLI args excluding node and binary.
   * @returns Startup prompt text or `null` when argv should not be treated as a session query.
   */
  public resolveSessionStartupQuery(args: string[]): string | null {
    const positionalTokens = this.resolvePositionalTokens(args);
    if (positionalTokens.length === 0) {
      return null;
    }

    const firstToken = positionalTokens[0];
    if (this.isRecognizedTopLevelCommandToken(firstToken)) {
      return null;
    }

    return positionalTokens.join(' ');
  }

  /**
   * Detects whether the entrypoint should default into the session-first shell surface.
   * @param args CLI args excluding node and binary.
   * @param runtimeDebugOptions Resolved UI/TTY/interactivity contract snapshot.
   * @param sessionStartupQuery Resolved startup prompt, if any.
   * @returns True when no explicit command is present and the live session-shell contract is allowed.
   */
  public shouldEnterDefaultSessionShell(
    args: string[],
    runtimeDebugOptions: CliRuntimeDebugOptions,
    sessionStartupQuery: string | null,
  ): boolean {
    if (args.includes('--help') || args.includes('-h')) {
      return false;
    }

    if (!this.isInteractiveSessionShellAllowed(runtimeDebugOptions)) {
      return false;
    }

    if (sessionStartupQuery) {
      return true;
    }

    return this.resolveFirstPositionalToken(args) === null;
  }

  private resolveFirstPositionalToken(args: string[]): string | null {
    return this.resolvePositionalTokens(args)[0] ?? null;
  }

  private resolvePositionalTokens(args: string[]): string[] {
    const positionalTokens: string[] = [];

    for (let index = 0; index < args.length; index += 1) {
      const token = args[index];
      if (!token) {
        continue;
      }

      if (token === '--') {
        if (args[index + 1]) {
          positionalTokens.push(args[index + 1] as string);
        }
        break;
      }

      if (token.startsWith('--')) {
        if (!token.includes('=') && CLI_OPTIONS_REQUIRING_VALUE.has(token)) {
          const nextToken = args[index + 1];
          if (nextToken && !nextToken.startsWith('-')) {
            index += 1;
          }
        }
        continue;
      }

      if (token.startsWith('-')) {
        continue;
      }

      positionalTokens.push(token);
    }

    return positionalTokens;
  }

  private isRecognizedTopLevelCommandToken(token: string | null): boolean {
    if (!token) {
      return false;
    }

    return (
      CLI_COMMAND_NAMES.includes(token as (typeof CLI_COMMAND_NAMES)[number]) ||
      token === CliWorkspaceAction.SET_UI_THEME
    );
  }

  private static summarizeCommandResult(options: {
    commandLine: string;
    exitCode: number;
    locale: string;
    stdoutText: string;
    stderrText: string;
    translate: (key: string, interpolation?: Record<string, string>) => string;
  }): CliSessionShellCommandExecutionResult {
    const parsedPayload = CliSessionShellEntrypointRuntime.parseCliJsonOutput(options.stdoutText);
    if (!parsedPayload) {
      const fallbackMessage =
        options.stderrText || options.stdoutText || 'No CLI payload was captured.';
      return {
        artifactPaths: [],
        commandLine: options.commandLine,
        message: fallbackMessage,
        status: options.exitCode === 0 ? 'success' : 'error',
        summaryLines: [fallbackMessage],
      };
    }

    if ('error_code' in parsedPayload) {
      const artifactPaths = [
        parsedPayload.error_details?.report_path,
        parsedPayload.error_details?.replay_path,
      ].filter((value): value is string => typeof value === 'string' && value.length > 0);
      const readableNextAction =
        CliSessionShellEntrypointRuntime.resolveReadableNextActionDescription(
          parsedPayload.next_action,
          options.translate,
        );
      return {
        artifactPaths,
        commandLine: options.commandLine,
        message: parsedPayload.message,
        status: 'error',
        summaryLines: CliSessionShellEntrypointRuntime.dedupeSummaryLines([
          options.translate('cli.sessionShell.responses.commandErrorHint', {
            hint: parsedPayload.hint,
          }),
          options.translate('cli.sessionShell.responses.commandErrorNextAction', {
            nextAction: readableNextAction,
          }),
          ...CliSessionShellEntrypointRuntime.resolveStructuredErrorRecoveryLines({
            commandLine: options.commandLine,
            commandName: parsedPayload.command,
            errorCode: parsedPayload.error_code,
            message: parsedPayload.message,
            translate: options.translate,
          }),
        ]),
      };
    }

    const artifactPaths =
      parsedPayload.command_result?.artifacts
        ?.map((artifact) => artifact.path)
        .filter((path) => typeof path === 'string' && path.length > 0) ?? [];
    const summaryLocale = parsedPayload.diagnostics?.locale ?? options.locale;
    const commandPresentation = CliSessionShellEntrypointRuntime.resolveCommandPresentation({
      parsedPayload,
      artifactPaths,
      translate: options.translate,
    });
    const primarySummary =
      commandPresentation?.primarySummary ??
      CliSessionShellEntrypointRuntime.resolvePrimarySummaryLine(parsedPayload, artifactPaths);
    const agentViewSummary = parsedPayload.command_result?.agentView
      ? options.translate('cli.sessionShell.responses.commandAgentSummary', {
          summary: CliSessionShellEntrypointRuntime.agentProjectionPresenter.buildSummaryLine(
            parsedPayload.command_result.agentView,
            summaryLocale,
          ),
        })
      : null;
    const agentAttentionLine = parsedPayload.command_result?.agentView
      ? CliSessionShellEntrypointRuntime.resolveAgentAttentionLine(
          parsedPayload.command_result.agentView,
          summaryLocale,
          options.translate,
        )
      : null;
    const keyStatusSummary =
      commandPresentation?.keyStatusSummary ??
      CliSessionShellEntrypointRuntime.resolveKeyStatusSummaryLine(
        parsedPayload.command_result?.experience?.layeredLogs.summary ?? [],
        artifactPaths,
      );
    const logicalFailure = CliSessionShellEntrypointRuntime.resolveLogicalFailure(
      parsedPayload,
      artifactPaths,
    );
    const deliveryWorkflowUpdate =
      logicalFailure.status === 'success'
        ? CliSessionShellEntrypointRuntime.resolveDeliveryWorkflowUpdate(
            parsedPayload,
            artifactPaths,
          )
        : undefined;
    const followUpCommand =
      logicalFailure.status === 'success'
        ? CliSessionShellEntrypointRuntime.resolveFollowUpCommand(parsedPayload)
        : undefined;

    return {
      artifactPaths,
      commandLine: options.commandLine,
      ...(deliveryWorkflowUpdate
        ? {
            deliveryWorkflowUpdate,
          }
        : {}),
      ...(followUpCommand
        ? {
            followUpCommand,
          }
        : {}),
      message: logicalFailure.failureReason ?? parsedPayload.message,
      status: logicalFailure.status,
      summaryLines: CliSessionShellEntrypointRuntime.dedupeSummaryLines([
        primarySummary
          ? options.translate('cli.sessionShell.responses.commandSummary', {
              summary: primarySummary,
            })
          : null,
        agentViewSummary,
        commandPresentation?.attentionSummary,
        agentAttentionLine,
        keyStatusSummary
          ? options.translate('cli.sessionShell.responses.commandStatusSummary', {
              summary: keyStatusSummary,
            })
          : null,
        logicalFailure.failureReason
          ? options.translate('cli.sessionShell.responses.commandFailureSummary', {
              summary: logicalFailure.failureReason,
            })
          : null,
        logicalFailure.nextAction
          ? options.translate('cli.sessionShell.responses.commandErrorNextAction', {
              nextAction: logicalFailure.nextAction,
            })
          : null,
      ]),
    };
  }

  private static resolveDeliveryWorkflowUpdate(
    parsedPayload: CliSuccessOutputPayload,
    artifactPaths: string[],
  ): CliSessionShellDeliveryWorkflowUpdate | undefined {
    const commandResult = parsedPayload.command_result;
    if (!commandResult) {
      return undefined;
    }

    const details = commandResult.details ?? {};
    if (commandResult.operation === CliRuntimeOperation.PLAN_PREVIEW) {
      const commitReadiness =
        typeof details.commit_readiness === 'string' ? details.commit_readiness : null;
      return {
        currentPhase:
          commitReadiness === CliPlanCommitReadiness.READY
            ? SESSION_DELIVERY_WORKFLOW_PHASE.TASK_PLAN_COMMIT_PENDING
            : SESSION_DELIVERY_WORKFLOW_PHASE.TASK_DECOMPOSITION_PREVIEW,
        pendingAction:
          commitReadiness === CliPlanCommitReadiness.READY
            ? CLI_SESSION_SHELL_DELIVERY_PENDING_ACTION.CONFIRM_TASK_PLAN_COMMIT
            : CLI_SESSION_SHELL_DELIVERY_PENDING_ACTION.REFINE_TASK_PLAN_PREVIEW,
        selectedTargetStream:
          CliSessionShellEntrypointRuntime.readDetailString(details, 'target_stream_id') ?? null,
        relatedArtifactPaths: CliSessionShellEntrypointRuntime.dedupeArtifactPaths([
          ...artifactPaths,
          CliSessionShellEntrypointRuntime.readDetailString(details, 'sprint_plan_path'),
          CliSessionShellEntrypointRuntime.readDetailString(details, 'checklist_path'),
          CliSessionShellEntrypointRuntime.readDetailString(details, 'tasks_csv_path'),
        ]),
        resultSummary: commandResult.summary || parsedPayload.message,
        childWorkflowBacklinks:
          artifactPaths[0] === undefined
            ? []
            : [
                {
                  capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
                  artifactPath: artifactPaths[0],
                  summary: commandResult.summary || parsedPayload.message,
                },
              ],
      };
    }

    if (commandResult.operation !== CliRuntimeOperation.PLAN_COMMIT) {
      return undefined;
    }

    const commitStatus = typeof details.commit_status === 'string' ? details.commit_status : null;
    return {
      currentPhase:
        commitStatus === CliPlanCommitStatus.COMMITTED
          ? SESSION_DELIVERY_WORKFLOW_PHASE.EXECUTION_ACTIVE
          : SESSION_DELIVERY_WORKFLOW_PHASE.TASK_DECOMPOSITION_PREVIEW,
      pendingAction:
        commitStatus === CliPlanCommitStatus.COMMITTED
          ? CLI_SESSION_SHELL_DELIVERY_PENDING_ACTION.START_TASK_DRIVEN_EXECUTION_FLOW
          : CLI_SESSION_SHELL_DELIVERY_PENDING_ACTION.REFINE_TASK_PLAN_PREVIEW_OR_RECONFIRM,
      selectedTargetStream:
        CliSessionShellEntrypointRuntime.readDetailString(details, 'target_stream_id') ?? null,
      relatedArtifactPaths: CliSessionShellEntrypointRuntime.dedupeArtifactPaths([
        ...artifactPaths,
        CliSessionShellEntrypointRuntime.readDetailString(details, 'source_preview_path'),
        CliSessionShellEntrypointRuntime.readDetailString(details, 'sprint_plan_path'),
        CliSessionShellEntrypointRuntime.readDetailString(details, 'checklist_path'),
        CliSessionShellEntrypointRuntime.readDetailString(details, 'tasks_csv_path'),
      ]),
      resultSummary: commandResult.summary || parsedPayload.message,
      childWorkflowBacklinks:
        artifactPaths[0] === undefined
          ? []
          : [
              {
                capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
                artifactPath: artifactPaths[0],
                summary: commandResult.summary || parsedPayload.message,
              },
            ],
    };
  }

  private static resolveFollowUpCommand(
    parsedPayload: CliSuccessOutputPayload,
  ): CliSessionShellCommandFollowUp | undefined {
    const commandResult = parsedPayload.command_result;
    if (!commandResult || commandResult.operation !== CliRuntimeOperation.PLAN_PREVIEW) {
      return undefined;
    }

    const details = commandResult.details ?? {};
    const commitReadiness =
      typeof details.commit_readiness === 'string' ? details.commit_readiness : null;
    const previewPath = CliSessionShellEntrypointRuntime.readDetailString(details, 'preview_path');
    if (commitReadiness !== CliPlanCommitReadiness.READY || !previewPath) {
      return undefined;
    }

    const argv = [
      CliCommandName.PLAN,
      CliPlanAction.COMMIT,
      previewPath,
      '--confirm-plan',
      CliPlanConfirmationDecision.APPROVE,
    ];
    return {
      argv,
      previewCommandLine: argv.join(' '),
      slashQuery: '/plan sync',
    };
  }

  private static readDetailString(
    details: NonNullable<NonNullable<CliSuccessOutputPayload['command_result']>['details']>,
    fieldName: string,
  ): string | undefined {
    const value = details[fieldName];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  private static dedupeArtifactPaths(paths: Array<string | undefined>): string[] {
    return [...new Set(paths.filter((path): path is string => typeof path === 'string'))];
  }

  private static resolvePrimarySummaryLine(
    parsedPayload: CliSuccessOutputPayload,
    artifactPaths: string[],
  ): string | null {
    const summaryCandidate =
      parsedPayload.command_result?.summary?.trim() || parsedPayload.message.trim();
    if (summaryCandidate.length === 0) {
      return null;
    }

    return CliSessionShellEntrypointRuntime.replaceArtifactPathsWithDisplayForms(
      summaryCandidate,
      artifactPaths,
    );
  }

  private static resolveCommandPresentation(options: {
    parsedPayload: CliSuccessOutputPayload;
    artifactPaths: string[];
    translate: (key: string, interpolation?: Record<string, string>) => string;
  }): {
    primarySummary: string | null;
    keyStatusSummary: string | null;
    attentionSummary: string | null;
  } | null {
    if (!CliSessionShellEntrypointRuntime.isDoctorPayload(options.parsedPayload)) {
      return null;
    }

    return CliSessionShellEntrypointRuntime.resolveDoctorPresentation(options);
  }

  private static isDoctorPayload(parsedPayload: CliSuccessOutputPayload): boolean {
    return (
      parsedPayload.command === 'doctor' ||
      parsedPayload.command_result?.operation === CliRuntimeOperation.ENV_DOCTOR
    );
  }

  private static resolveDoctorPresentation(options: {
    parsedPayload: CliSuccessOutputPayload;
    artifactPaths: string[];
    translate: (key: string, interpolation?: Record<string, string>) => string;
  }): {
    primarySummary: string | null;
    keyStatusSummary: string | null;
    attentionSummary: string | null;
  } {
    const attachMode = options.parsedPayload.command_result?.attach_mode ?? null;
    const adaptersEnabled =
      typeof options.parsedPayload.command_result?.details?.adapters_enabled === 'boolean'
        ? options.parsedPayload.command_result.details.adapters_enabled
        : null;
    const checkTotals = options.parsedPayload.command_result?.check_totals;
    const warningSegments = CliSessionShellEntrypointRuntime.resolveDoctorWarningSegments(
      options.parsedPayload.command_result?.checks ?? [],
      options.translate,
    );

    const primarySummary =
      attachMode === 'read_write'
        ? options.translate('cli.sessionShell.responses.commandDoctorSummaryReadWrite')
        : attachMode === 'read_only'
          ? options.translate('cli.sessionShell.responses.commandDoctorSummaryReadOnly')
          : options.translate('cli.sessionShell.responses.commandDoctorSummaryGeneric');

    const keyStatusSegments = [
      adaptersEnabled === null
        ? null
        : options.translate(
            adaptersEnabled
              ? 'cli.sessionShell.responses.commandDoctorAdapterChecksEnabled'
              : 'cli.sessionShell.responses.commandDoctorAdapterChecksSkipped',
          ),
      checkTotals
        ? options.translate('cli.sessionShell.responses.commandDoctorCheckTotals', {
            pass: String(checkTotals.pass),
            warn: String(checkTotals.warn),
            fail: String(checkTotals.fail),
          })
        : null,
    ].filter((segment): segment is string => typeof segment === 'string' && segment.length > 0);

    return {
      primarySummary,
      keyStatusSummary: keyStatusSegments.length > 0 ? keyStatusSegments.join(' · ') : null,
      attentionSummary:
        warningSegments.length > 0
          ? options.translate('cli.sessionShell.responses.commandAttentionSummary', {
              summary: warningSegments.join(' · '),
            })
          : null,
    };
  }

  private static resolveDoctorWarningSegments(
    checks: NonNullable<CliSuccessOutputPayload['command_result']>['checks'],
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): string[] {
    const segments: string[] = [];
    for (const check of checks ?? []) {
      if (check.status !== 'warn' && check.status !== 'fail') {
        continue;
      }

      switch (check.id) {
        case 'baseline_docs': {
          const missingMatch = check.detail.match(/missing=(\d+)\/(\d+)/u);
          if (!missingMatch) {
            break;
          }
          segments.push(
            translate('cli.sessionShell.responses.commandDoctorAttentionBaselineDocs', {
              missing: missingMatch[1] ?? '0',
              total: missingMatch[2] ?? '0',
            }),
          );
          break;
        }
        case 'artifact_registry_canonical_truth':
          if (check.detail.includes('state=uninitialized')) {
            segments.push(
              translate(
                'cli.sessionShell.responses.commandDoctorAttentionArtifactRegistryUninitialized',
              ),
            );
          }
          break;
        case 'task_ledger_canonical_truth':
          if (
            check.detail.includes('state=no_sources') ||
            check.detail.includes('state=uninitialized')
          ) {
            segments.push(
              translate('cli.sessionShell.responses.commandDoctorAttentionTaskLedgerUninitialized'),
            );
          }
          break;
        default:
          break;
      }
    }

    return CliSessionShellEntrypointRuntime.dedupeSummaryLines(segments);
  }

  private static resolveKeyStatusSummaryLine(
    experienceLines: string[],
    artifactPaths: string[],
  ): string | null {
    const compactSegments = experienceLines
      .slice(0, 2)
      .map((line) =>
        CliSessionShellEntrypointRuntime.replaceArtifactPathsWithDisplayForms(line, artifactPaths),
      )
      .filter((line) => line.length > 0);
    if (compactSegments.length === 0) {
      return null;
    }

    return compactSegments.join(' · ');
  }

  private static resolveLogicalFailure(
    parsedPayload: CliSuccessOutputPayload,
    artifactPaths: string[],
  ): {
    status: CliSessionShellCommandExecutionResult['status'];
    failureReason: string | null;
    nextAction: string | null;
  } {
    const runtimeStatus =
      typeof parsedPayload.command_result?.details?.runtime_status === 'string'
        ? parsedPayload.command_result.details.runtime_status
        : null;
    const runtimeFailed =
      parsedPayload.command === 'run' &&
      runtimeStatus !== null &&
      runtimeStatus !== RuntimeExecutionStatus.SUCCEEDED;
    if (!runtimeFailed) {
      return {
        status: 'success',
        failureReason: null,
        nextAction: null,
      };
    }

    const failureReason =
      CliSessionShellEntrypointRuntime.resolveExperienceFailureSummary(
        parsedPayload.command_result?.experience,
        artifactPaths,
      ) ??
      CliSessionShellEntrypointRuntime.replaceArtifactPathsWithDisplayForms(
        `runtime_status=${runtimeStatus}`,
        artifactPaths,
      );
    const nextAction =
      parsedPayload.command_result?.experience?.interactionPrompts.find((prompt) => prompt.blocking)
        ?.action ??
      parsedPayload.command_result?.experience?.interactionPrompts[0]?.action ??
      null;
    return {
      status: 'error',
      failureReason,
      nextAction,
    };
  }

  private static resolveExperienceFailureSummary(
    experience: CliCommandExperiencePayload | undefined,
    artifactPaths: string[],
  ): string | null {
    const failedProgressEntry = experience?.roleProgress.find(
      (entry) => entry.status === ExecutionProgressStatus.FAILED,
    );
    if (failedProgressEntry) {
      return CliSessionShellEntrypointRuntime.replaceArtifactPathsWithDisplayForms(
        [failedProgressEntry.summary, failedProgressEntry.detail]
          .filter((segment): segment is string => typeof segment === 'string' && segment.length > 0)
          .join(' · '),
        artifactPaths,
      );
    }

    const failureDetail = experience?.layeredLogs.detailed.find((line) =>
      line.startsWith('failed_reason='),
    );
    return failureDetail
      ? CliSessionShellEntrypointRuntime.replaceArtifactPathsWithDisplayForms(
          failureDetail,
          artifactPaths,
        )
      : null;
  }

  private static resolveAgentAttentionLine(
    agentView: NonNullable<CliSuccessOutputPayload['command_result']>['agentView'],
    locale: string,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): string | null {
    if (!agentView) {
      return null;
    }

    const firstHighlight =
      CliSessionShellEntrypointRuntime.agentProjectionPresenter.buildHighlightLines(
        agentView,
        locale,
        1,
      )[0] ?? null;
    if (!firstHighlight) {
      return null;
    }

    return translate('cli.sessionShell.responses.commandAttentionSummary', {
      summary: CliSessionShellEntrypointRuntime.truncateLine(firstHighlight, 120),
    });
  }

  private static dedupeSummaryLines(lines: Array<string | null | undefined>): string[] {
    const dedupedLines: string[] = [];
    for (const candidate of lines) {
      const normalizedCandidate = candidate?.trim();
      if (!normalizedCandidate || dedupedLines.includes(normalizedCandidate)) {
        continue;
      }
      dedupedLines.push(normalizedCandidate);
    }

    return dedupedLines;
  }

  private static replaceArtifactPathsWithDisplayForms(
    text: string,
    artifactPaths: string[],
  ): string {
    let nextText = text;
    for (const artifactPath of artifactPaths) {
      nextText = nextText.split(artifactPath).join(artifactPath);
    }
    return nextText;
  }

  private static truncateLine(line: string, maxLength: number): string {
    if (line.length <= maxLength) {
      return line;
    }

    return `${line.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
  }

  private static parseCliJsonOutput(
    stdoutText: string,
  ): CliSuccessOutputPayload | CliErrorOutputPayload | null {
    const normalizedText = stdoutText.trim();
    if (normalizedText.length === 0) {
      return null;
    }

    const directPayload =
      CliSessionShellEntrypointRuntime.tryParseCliJsonOutputCandidate(normalizedText);
    if (directPayload) {
      return directPayload;
    }

    const lineCandidates = normalizedText
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    for (let index = lineCandidates.length - 1; index >= 0; index -= 1) {
      const parsedPayload = CliSessionShellEntrypointRuntime.tryParseCliJsonOutputCandidate(
        lineCandidates[index] ?? '',
      );
      if (parsedPayload) {
        return parsedPayload;
      }
    }

    return null;
  }

  private static tryParseCliJsonOutputCandidate(
    candidate: string,
  ): CliSuccessOutputPayload | CliErrorOutputPayload | null {
    try {
      return JSON.parse(candidate) as CliSuccessOutputPayload | CliErrorOutputPayload;
    } catch {
      return null;
    }
  }

  private static resolveReadableNextActionDescription(
    nextAction: CliNextAction,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): string {
    switch (nextAction) {
      case CliNextAction.CHECK_COMMAND_USAGE:
        return translate('cli.sessionShell.responses.commandErrorNextActionCheckCommandUsage');
      case CliNextAction.INSPECT_GOVERNOR_CONFIG:
        return translate('cli.sessionShell.responses.commandErrorNextActionInspectGovernorConfig');
      case CliNextAction.INSPECT_POLICY_DIAGNOSTICS:
        return translate(
          'cli.sessionShell.responses.commandErrorNextActionInspectPolicyDiagnostics',
        );
      case CliNextAction.CHECK_REPLAY_SOURCE:
        return translate('cli.sessionShell.responses.commandErrorNextActionCheckReplaySource');
      case CliNextAction.RETRY_WITH_VERBOSE:
        return translate('cli.sessionShell.responses.commandErrorNextActionRetryWithVerbose');
      case CliNextAction.REPORT_ISSUE:
        return translate('cli.sessionShell.responses.commandErrorNextActionReportIssue');
      default:
        return nextAction;
    }
  }

  private static resolveStructuredErrorRecoveryLines(options: {
    commandLine: string;
    commandName: string;
    errorCode: GovernorErrorCode;
    message: string;
    translate: (key: string, interpolation?: Record<string, string>) => string;
  }): string[] {
    const commandToken = options.commandLine.trim().split(/\s+/u)[0] ?? options.commandName;
    const isConnectMissingAdaptersBaseline =
      options.errorCode === GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID &&
      commandToken === 'connect' &&
      options.message.includes('requires adapters baseline in source config');
    if (!isConnectMissingAdaptersBaseline) {
      return [];
    }

    return [
      options.translate('cli.sessionShell.responses.commandErrorConnectMissingAdaptersBaseline'),
    ];
  }
}
