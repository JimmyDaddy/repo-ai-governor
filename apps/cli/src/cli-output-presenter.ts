import { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import {
  CLI_ADAPTER_TOOL_CHECK_ID_PREFIX,
  CLI_PRETTY_KEY_CHECK_IDS,
  CliCommandResultCheckId,
  CliConfirmationItemsDetailField,
  CliMigrationSuggestionDetailField,
  CliPlanCommitReadinessDetailField,
  CliPlanLedgerProjectionDetailField,
  CliPlanReceiptDetailField,
  CliPlanTaskPackageDetailField,
  CliUpgradeApplyReadinessDetailField,
  CliUpgradeReceiptDetailField,
  CliUpgradeSchemaDiffDetailField,
  CliWorkflowCompileStatusDetailField,
  CliWorkflowPreviewModeDetailField,
  CliWorkflowTemplateDetailField,
  CliWorkspaceActionDetailField,
  CliWorkspaceScratchCleanupDetailField,
  CliWorkspaceTargetDetailField,
} from './constants/cli-command-result-check.constant.js';
import { CliGovernanceCheckStatus } from './constants/cli-governance-runtime.constant.js';
import { CliVerbosity } from './constants/cli-output.constant.js';
import { CliAgentProjectionPresenter } from './runtime/presentation/agent-projection-presenter.js';
import type {
  CliCommandExecutionResultPayload,
  CliCommandExperiencePayload,
  CliCommandResultCheck,
  CliErrorOutputPayload,
  CliRoleStageProgress,
  CliSuccessOutputPayload,
} from './types/interfaces/index.js';

const ANSI_RESET = '\u001b[0m';
const ANSI_SUCCESS = '\u001b[1;32m';
const ANSI_ERROR = '\u001b[1;31m';

interface CliPrettyLabels {
  successTitle: string;
  summarySection: string;
  commandLabel: string;
  operationLabel: string;
  attachModeLabel: string;
  healthSection: string;
  checksLabel: string;
  passLabel: string;
  warnLabel: string;
  failLabel: string;
  progressLabel: string;
  attentionLabel: string;
  keyDetailsLabel: string;
  nextStepsSection: string;
  moreHint: string;
  artifactsSection: string;
  artifactsGeneratedLabel: string;
  primaryLabel: string;
  contextSection: string;
  localeLabel: string;
  profileLabel: string;
  outputLabel: string;
  outputModeLabel: string;
  downgradedFromLabel: string;
  debugSection: string;
  configSourceLabel: string;
  workspaceModeLabel: string;
  workspaceModeSourceLabel: string;
  workspaceIdLabel: string;
  workspaceRootLabel: string;
  memoryStoreEngineLabel: string;
  memoryStoreRootLabel: string;
  memoryStoreProviderLabel: string;
  checkSummaryLabel: string;
  artifactSummaryLabel: string;
  roleProgressLabel: string;
  interactionPromptsLabel: string;
  detailedLogsLabel: string;
  adapterVerificationLabel: string;
  adapterToolLabelPrefix: string;
  planTaskPackageLabel: string;
  planCommitReadinessLabel: string;
  planLedgerProjectionLabel: string;
  planCommitReceiptLabel: string;
  upgradeSchemaDiffLabel: string;
  migrationSuggestionsLabel: string;
  confirmationItemsLabel: string;
  upgradeApplyReadinessLabel: string;
  upgradeApplyReceiptLabel: string;
  upgradeVerifyReceiptLabel: string;
  upgradeRollbackReceiptLabel: string;
  rollbackReferenceLabel: string;
  workspaceActionLabel: string;
  workspaceTargetLabel: string;
  workspaceScratchCleanupLabel: string;
  workflowTemplateLabel: string;
  workflowPreviewModeLabel: string;
  workflowCompileStatusLabel: string;
}

interface CliOutputPresenterIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
  translate?: (key: string, interpolation?: Record<string, string>) => string | undefined;
}

const CLI_OUTPUT_TRANSLATION_FALLBACKS = {
  'cli.output.pretty.checkDetails.upgradeSchemaDiff': {
    en: '{{diffs}} diffs, {{source}} -> {{target}}',
    zh: '差异 {{diffs}} 项，{{source}} -> {{target}}',
  },
  'cli.output.pretty.checkDetails.planTaskPackage': {
    en: '{{total}} tasks, {{create}} create, {{retain}} retain',
    zh: '{{total}} 条任务，新增 {{create}} 条，复用 {{retain}} 条',
  },
  'cli.output.pretty.checkDetails.planCommitReadiness': {
    en: 'readiness {{readiness}}, {{missing}} missing fields',
    zh: 'readiness {{readiness}}，缺少 {{missing}} 个字段',
  },
  'cli.output.pretty.checkDetails.planLedgerProjection': {
    en: 'plan.md {{planMd}}, checklist.md {{checklistMd}}, tasks.csv {{tasksCsv}}, TK files {{tkFiles}}',
    zh: 'plan.md {{planMd}}，checklist.md {{checklistMd}}，tasks.csv {{tasksCsv}}，TK 文件 {{tkFiles}}',
  },
  'cli.output.pretty.checkDetails.planCommitReceipt': {
    en: 'status {{status}}, {{created}} created, {{retained}} retained, receipt {{path}}',
    zh: '状态 {{status}}，新增 {{created}} 条，复用 {{retained}} 条，receipt {{path}}',
  },
  'cli.output.pretty.checkDetails.migrationSuggestions': {
    en: '{{count}} suggestions',
    zh: '{{count}} 条建议',
  },
  'cli.output.pretty.checkDetails.confirmationItems': {
    en: 'decision {{decision}}, {{count}} items, {{blocking}} blocking',
    zh: '决策 {{decision}}，确认项 {{count}} 条，阻断 {{blocking}} 条',
  },
  'cli.output.pretty.checkDetails.upgradeApplyReadiness': {
    en: 'readiness {{readiness}}, decision {{decision}}, {{count}} items, {{blocking}} blocking',
    zh: 'readiness {{readiness}}，决策 {{decision}}，确认项 {{count}} 条，阻断 {{blocking}} 条',
  },
  'cli.output.pretty.checkDetails.upgradeReceipt': {
    en: 'status {{status}}, receipt {{path}}',
    zh: '状态 {{status}}，receipt {{path}}',
  },
  'cli.output.pretty.checkDetails.workspaceTarget': {
    en: 'mode {{mode}}, root {{root}}',
    zh: '模式 {{mode}}，根路径 {{root}}',
  },
  'cli.output.pretty.checkDetails.workspaceScratchCleanupRemoved': {
    en: 'scratch root removed: {{root}}',
    zh: 'scratch 根目录已移除：{{root}}',
  },
  'cli.output.pretty.checkDetails.workspaceScratchCleanupRetained': {
    en: 'scratch root retained: {{root}}',
    zh: 'scratch 根目录保留：{{root}}',
  },
  'cli.output.pretty.checkDetails.workflowTemplate': {
    en: 'template {{template}}',
    zh: '模板 {{template}}',
  },
  'cli.output.pretty.checkDetails.workflowPreviewMode': {
    en: 'mode {{mode}}',
    zh: '模式 {{mode}}',
  },
  'cli.output.pretty.checkDetails.workflowCompileStatus': {
    en: 'status {{status}}, {{warnings}} warnings, {{errors}} errors',
    zh: '状态 {{status}}，{{warnings}} 条 warning，{{errors}} 条 error',
  },
  'cli.output.pretty.checkLabels.upgradeSchemaDiff': {
    en: 'Upgrade schema diff',
    zh: '升级 schema diff',
  },
  'cli.output.pretty.checkLabels.planTaskPackage': {
    en: 'Plan task package',
    zh: 'Plan 任务包',
  },
  'cli.output.pretty.checkLabels.planCommitReadiness': {
    en: 'Plan commit readiness',
    zh: 'Plan 提交就绪度',
  },
  'cli.output.pretty.checkLabels.planLedgerProjection': {
    en: 'Plan ledger projection',
    zh: 'Plan 台账投影',
  },
  'cli.output.pretty.checkLabels.planCommitReceipt': {
    en: 'Plan commit receipt',
    zh: 'Plan commit receipt',
  },
  'cli.output.pretty.checkLabels.migrationSuggestions': {
    en: 'Migration suggestions',
    zh: '迁移建议',
  },
  'cli.output.pretty.checkLabels.confirmationItems': {
    en: 'Confirmation items',
    zh: '确认项',
  },
  'cli.output.pretty.checkLabels.upgradeApplyReadiness': {
    en: 'Upgrade apply readiness',
    zh: '升级 apply readiness',
  },
  'cli.output.pretty.checkLabels.upgradeApplyReceipt': {
    en: 'Upgrade apply receipt',
    zh: '升级 apply receipt',
  },
  'cli.output.pretty.checkLabels.upgradeVerifyReceipt': {
    en: 'Upgrade verify receipt',
    zh: '升级 verify receipt',
  },
  'cli.output.pretty.checkLabels.upgradeRollbackReceipt': {
    en: 'Upgrade rollback receipt',
    zh: '升级 rollback receipt',
  },
  'cli.output.pretty.checkLabels.rollbackReference': {
    en: 'Rollback reference',
    zh: '回滚参考',
  },
  'cli.output.pretty.checkLabels.workspaceAction': {
    en: 'Workspace action',
    zh: '工作区动作',
  },
  'cli.output.pretty.checkLabels.workspaceTarget': {
    en: 'Workspace target',
    zh: '工作区目标',
  },
  'cli.output.pretty.checkLabels.workspaceScratchCleanup': {
    en: 'Workspace scratch cleanup',
    zh: '工作区暂存清理',
  },
  'cli.output.pretty.checkLabels.workflowTemplate': {
    en: 'Workflow template',
    zh: '流程模板',
  },
  'cli.output.pretty.checkLabels.workflowPreviewMode': {
    en: 'Workflow preview mode',
    zh: '流程预览模式',
  },
  'cli.output.pretty.checkLabels.workflowCompileStatus': {
    en: 'Workflow compile status',
    zh: '流程编译状态',
  },
} as const;

/**
 * Renders and writes CLI output payloads for success/error flows.
 *
 * Why this exists:
 * one presenter keeps `pretty/plain/json` behavior deterministic across commands
 * and ensures non-TTY fallback still emits a stable output contract.
 */
export class CliOutputPresenter {
  private readonly agentProjectionPresenter = new CliAgentProjectionPresenter();

  /**
   * Creates a presenter bound to runtime stdout/stderr writers.
   * @param io Output writer adapters from CLI runtime.
   */
  public constructor(private readonly io: CliOutputPresenterIo) {}

  /**
   * Writes one successful payload to stdout using resolved output mode.
   * @param payload Successful execution payload.
   * @returns Void.
   */
  public writeSuccess(payload: CliSuccessOutputPayload): void {
    this.io.stdout(this.ensureTrailingNewLine(this.renderSuccess(payload)));
  }

  /**
   * Writes one error payload to stderr using resolved output mode.
   * @param payload Failed execution payload.
   * @returns Void.
   */
  public writeError(payload: CliErrorOutputPayload): void {
    this.io.stderr(this.ensureTrailingNewLine(this.renderError(payload)));
  }

  /**
   * Renders one success payload by mode.
   * @param payload Successful execution payload.
   * @returns Rendered output text.
   */
  private renderSuccess(payload: CliSuccessOutputPayload): string {
    if (payload.output_mode === ErrorOutputEnvironment.JSON) {
      return JSON.stringify(payload);
    }

    if (payload.output_mode === ErrorOutputEnvironment.PRETTY) {
      return this.renderPrettySuccess(payload);
    }

    return this.renderPlainSuccess(payload);
  }

  /**
   * Renders one error payload by mode.
   * @param payload Failed execution payload.
   * @returns Rendered output text.
   */
  private renderError(payload: CliErrorOutputPayload): string {
    if (payload.output_mode === ErrorOutputEnvironment.JSON) {
      return JSON.stringify(payload);
    }

    if (payload.output_mode === ErrorOutputEnvironment.PRETTY) {
      return this.renderPrettyError(payload);
    }

    return this.renderPlainError(payload);
  }

  /**
   * Renders a pretty success message with sectioned key details.
   * @param payload Successful execution payload.
   * @returns Pretty-formatted text.
   */
  private renderPrettySuccess(payload: CliSuccessOutputPayload): string {
    const compactPretty = payload.runtime.compact && payload.verbosity !== CliVerbosity.VERBOSE;
    const labels = this.resolvePrettyLabels(payload.diagnostics.locale);
    const title = this.decorateIfColorEnabled(
      labels.successTitle,
      ANSI_SUCCESS,
      payload.runtime.color_enabled,
    );
    const lines = [
      title,
      '',
      labels.summarySection,
      `  - ${payload.message}`,
      `  - ${labels.commandLabel}: ${payload.command}`,
    ];
    const commandResult = payload.command_result;

    if (commandResult) {
      lines.push(`  - ${labels.operationLabel}: ${commandResult.operation}`);

      if (commandResult.attach_mode) {
        lines.push(`  - ${labels.attachModeLabel}: ${commandResult.attach_mode}`);
      }

      if (commandResult.agentView) {
        lines.push(
          `  - agent view: ${this.resolveAgentViewSummary(commandResult.agentView, payload.diagnostics.locale)}`,
        );
        const agentHighlights = this.resolveAgentViewHighlights(
          commandResult.agentView,
          payload.diagnostics.locale,
        );
        if (agentHighlights.length > 0) {
          if (compactPretty) {
            const [firstHighlight, ...remainingHighlights] = agentHighlights;
            if (firstHighlight) {
              lines.push(`  - agent highlights: ${firstHighlight}`);
            }
            if (remainingHighlights.length > 0) {
              lines.push(`  - agent highlights: +${remainingHighlights.length} ${labels.moreHint}`);
            }
          } else {
            lines.push('  - agent highlights:');
            for (const highlight of agentHighlights) {
              lines.push(`    - ${highlight}`);
            }
          }
        }
      }
    }

    if (commandResult?.check_totals || commandResult?.checks || commandResult?.experience) {
      lines.push('', labels.healthSection);
      if (commandResult.check_totals) {
        lines.push(
          `  - ${labels.checksLabel}: ${commandResult.check_totals.pass} ${labels.passLabel} / ${commandResult.check_totals.warn} ${labels.warnLabel} / ${commandResult.check_totals.fail} ${labels.failLabel}`,
        );
      }
      if (commandResult.experience) {
        lines.push(
          `  - ${labels.progressLabel}: ${this.resolveProgressSummaryHuman(commandResult.experience, payload.diagnostics.locale)}`,
        );
      }
      const attentionChecks = this.resolveAttentionChecks(commandResult);
      if (attentionChecks.length > 0) {
        if (compactPretty) {
          const firstAttentionCheck = attentionChecks[0];
          if (firstAttentionCheck) {
            lines.push(
              `  - ${labels.attentionLabel}: ${this.resolveReadableCheckLabel(firstAttentionCheck.id, payload.diagnostics.locale)}: ${this.resolveReadableCheckDetail(firstAttentionCheck, payload.diagnostics.locale)}`,
            );
          }
          if (attentionChecks.length > 1) {
            lines.push(
              `  - ${labels.attentionLabel}: +${attentionChecks.length - 1} ${labels.moreHint}`,
            );
          }
        } else {
          lines.push(`  - ${labels.attentionLabel}:`);
          for (const check of attentionChecks) {
            lines.push(
              `    - ${this.resolveReadableCheckLabel(check.id, payload.diagnostics.locale)}: ${this.resolveReadableCheckDetail(check, payload.diagnostics.locale)}`,
            );
          }
        }
      }

      const keyChecks = this.resolveKeyChecks(commandResult);
      if (keyChecks.length > 0) {
        if (compactPretty) {
          const firstKeyCheck = keyChecks[0];
          if (firstKeyCheck) {
            lines.push(
              `  - ${labels.keyDetailsLabel}: ${this.resolveReadableCheckLabel(firstKeyCheck.id, payload.diagnostics.locale)}: ${this.resolveReadableCheckDetail(firstKeyCheck, payload.diagnostics.locale)}`,
            );
          }
          if (keyChecks.length > 1) {
            lines.push(
              `  - ${labels.keyDetailsLabel}: +${keyChecks.length - 1} ${labels.moreHint}`,
            );
          }
        } else {
          lines.push(`  - ${labels.keyDetailsLabel}:`);
          for (const check of keyChecks) {
            lines.push(
              `    - ${this.resolveReadableCheckLabel(check.id, payload.diagnostics.locale)}: ${this.resolveReadableCheckDetail(check, payload.diagnostics.locale)}`,
            );
          }
        }
      }
    }

    const nextActions = this.resolvePrettyNextActions(commandResult);
    if (nextActions.length > 0) {
      lines.push('', labels.nextStepsSection);
      if (compactPretty) {
        const firstAction = nextActions[0];
        if (firstAction) {
          lines.push(`  1. ${firstAction}`);
        }
        if (nextActions.length > 1) {
          lines.push(`  2. +${nextActions.length - 1} ${labels.moreHint}`);
        }
      } else {
        for (const [index, action] of nextActions.entries()) {
          lines.push(`  ${index + 1}. ${action}`);
        }
      }
    }

    if (commandResult?.artifacts && commandResult.artifacts.length > 0) {
      lines.push('', labels.artifactsSection);
      if (compactPretty) {
        lines.push(`  - ${commandResult.artifacts.length} ${labels.artifactsGeneratedLabel}`);
        const primaryArtifact = commandResult.artifacts[0];
        if (primaryArtifact) {
          lines.push(
            `  - ${labels.primaryLabel}: ${primaryArtifact.id} -> ${primaryArtifact.path}`,
          );
        }
      } else {
        for (const artifact of commandResult.artifacts) {
          lines.push(`  - ${artifact.id}: ${artifact.path}`);
        }
      }
    }

    if (payload.verbosity !== CliVerbosity.QUIET) {
      lines.push('', labels.contextSection);
      if (compactPretty) {
        lines.push(
          `  - ${labels.localeLabel}=${payload.diagnostics.locale} | ${labels.profileLabel}=${payload.diagnostics.profile} | ${labels.outputLabel}=${payload.output_mode}`,
        );
      } else {
        lines.push(
          `  - ${labels.localeLabel}: ${payload.diagnostics.locale}`,
          `  - ${labels.profileLabel}: ${payload.diagnostics.profile}`,
          `  - ${labels.outputModeLabel}: ${payload.output_mode}`,
          `  - ${labels.downgradedFromLabel}: ${payload.runtime.downgraded_from ?? 'none'}`,
        );
      }
    }

    if (payload.verbosity === CliVerbosity.VERBOSE) {
      lines.push('', labels.debugSection);
      lines.push(
        `  - ${labels.configSourceLabel}: ${payload.diagnostics.configSource}`,
        `  - ${labels.workspaceModeLabel}: ${payload.diagnostics.workspaceMode}`,
        `  - ${labels.workspaceModeSourceLabel}: ${payload.diagnostics.workspaceModeSource}`,
        `  - ${labels.workspaceIdLabel}: ${payload.diagnostics.workspaceId}`,
        `  - ${labels.workspaceRootLabel}: ${payload.diagnostics.workspaceRoot}`,
        `  - ${labels.memoryStoreEngineLabel}: ${payload.diagnostics.memoryStoreEngine}`,
        `  - ${labels.memoryStoreRootLabel}: ${payload.diagnostics.memoryStoreRoot}`,
        `  - ${labels.memoryStoreProviderLabel}: ${payload.diagnostics.memoryStoreProvider}`,
      );

      if (commandResult?.checks) {
        const checkSummary = commandResult.checks
          .map((check) => `${check.id}:${check.status}`)
          .join(', ');
        lines.push(`  - ${labels.checkSummaryLabel}: ${checkSummary}`);
      }
      if (commandResult?.artifacts) {
        const artifactSummary = commandResult.artifacts
          .map((artifact) => `${artifact.id}=${artifact.path}`)
          .join(', ');
        lines.push(`  - ${labels.artifactSummaryLabel}: ${artifactSummary}`);
      }
      if (commandResult?.experience) {
        const roleProgressLines = commandResult.experience.roleProgress
          .map((entry) => this.formatRoleProgress(entry))
          .join('; ');
        if (roleProgressLines.length > 0) {
          lines.push(`  - ${labels.roleProgressLabel}: ${roleProgressLines}`);
        }
        if (commandResult.experience.interactionPrompts.length > 0) {
          const promptLines = commandResult.experience.interactionPrompts
            .map(
              (prompt) =>
                `${prompt.stage}:${prompt.category}:${prompt.blocking ? 'blocking' : 'non_blocking'}:${prompt.action}`,
            )
            .join('; ');
          lines.push(`  - ${labels.interactionPromptsLabel}: ${promptLines}`);
        }
        if (commandResult.experience.layeredLogs.detailed.length > 0) {
          lines.push(
            `  - ${labels.detailedLogsLabel}: ${commandResult.experience.layeredLogs.detailed.join(' | ')}`,
          );
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Renders a plain success message for log-safe deterministic outputs.
   * @param payload Successful execution payload.
   * @returns Plain text output.
   */
  private renderPlainSuccess(payload: CliSuccessOutputPayload): string {
    const commandResult = payload.command_result;
    const progressSuffix = commandResult?.experience
      ? ` progress=${this.resolveProgressSummary(commandResult.experience)}`
      : '';
    const agentViewSuffix = commandResult?.agentView
      ? ` agent_view=${this.resolveAgentViewSummary(commandResult.agentView, payload.diagnostics.locale)}`
      : '';

    if (payload.verbosity === CliVerbosity.QUIET) {
      return `${payload.message} outputMode=${payload.output_mode}${commandResult ? ` operation=${commandResult.operation}` : ''}${progressSuffix}${agentViewSuffix}`;
    }

    if (payload.verbosity === CliVerbosity.VERBOSE) {
      return `${payload.message} outputMode=${payload.output_mode} verbosity=${payload.verbosity} configSource=${payload.diagnostics.configSource} downgradedFrom=${payload.runtime.downgraded_from ?? 'none'}${commandResult ? ` operation=${commandResult.operation}` : ''}${progressSuffix}${agentViewSuffix}`;
    }

    return `${payload.message} outputMode=${payload.output_mode} verbosity=${payload.verbosity}${commandResult ? ` operation=${commandResult.operation}` : ''}${progressSuffix}${agentViewSuffix}`;
  }

  /**
   * Renders a pretty error block with stable structured fields.
   * @param payload Failed execution payload.
   * @returns Pretty-formatted error text.
   */
  private renderPrettyError(payload: CliErrorOutputPayload): string {
    const title = this.decorateIfColorEnabled(
      'repo-ai-governor: command failed',
      ANSI_ERROR,
      payload.runtime.color_enabled,
    );
    const lines = [
      title,
      `  message: ${payload.message}`,
      `  error_code: ${payload.error_code}`,
      `  hint: ${payload.hint}`,
      `  next_action: ${payload.next_action}`,
    ];

    if (payload.verbosity === CliVerbosity.VERBOSE) {
      lines.push(
        `  command: ${payload.command}`,
        `  output_mode: ${payload.output_mode}`,
        `  downgraded_from: ${payload.runtime.downgraded_from ?? 'none'}`,
      );
      if (payload.error_details?.report_path) {
        lines.push(`  report_path: ${payload.error_details.report_path}`);
      }
      if (payload.error_details?.replay_path) {
        lines.push(`  replay_path: ${payload.error_details.replay_path}`);
      }
      if (payload.error_details?.pending_status) {
        lines.push(`  pending_status: ${payload.error_details.pending_status}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Renders a plain one-line error with required structured fields.
   * @param payload Failed execution payload.
   * @returns Plain text output.
   */
  private renderPlainError(payload: CliErrorOutputPayload): string {
    const detailSegments = [
      payload.error_details?.report_path ? `report_path=${payload.error_details.report_path}` : '',
      payload.error_details?.replay_path ? `replay_path=${payload.error_details.replay_path}` : '',
      payload.error_details?.pending_status
        ? `pending_status=${payload.error_details.pending_status}`
        : '',
    ].filter((segment) => segment.length > 0);

    return `${payload.message} error_code=${payload.error_code} hint=${payload.hint} next_action=${payload.next_action}${detailSegments.length > 0 ? ` ${detailSegments.join(' ')}` : ''}`;
  }

  /**
   * Applies ANSI decoration only when color output is allowed.
   * @param text Base plain text.
   * @param colorCode ANSI color code.
   * @param colorEnabled Whether color output is allowed.
   * @returns Decorated or plain text.
   */
  private decorateIfColorEnabled(text: string, colorCode: string, colorEnabled: boolean): string {
    if (!colorEnabled) {
      return text;
    }

    return `${colorCode}${text}${ANSI_RESET}`;
  }

  /**
   * Ensures renderer output always writes exactly one trailing newline.
   * @param value Rendered output text.
   * @returns Output with normalized trailing newline.
   */
  private ensureTrailingNewLine(value: string): string {
    return value.endsWith('\n') ? value : `${value}\n`;
  }

  /**
   * Formats role-level progress summary counts for concise output.
   * @param experience Command experience payload.
   * @returns One-line progress summary.
   */
  private resolveProgressSummary(experience: CliCommandExperiencePayload): string {
    const counts = {
      queued: 0,
      running: 0,
      completed: 0,
      waiting: 0,
      warning: 0,
      failed: 0,
    };

    for (const row of experience.roleProgress) {
      if (row.status in counts) {
        counts[row.status as keyof typeof counts] += 1;
      }
    }

    return `queued=${counts.queued} running=${counts.running} completed=${counts.completed} waiting=${counts.waiting} warning=${counts.warning} failed=${counts.failed}`;
  }

  private resolveAgentViewSummary(
    agentView: NonNullable<CliCommandExecutionResultPayload['agentView']>,
    locale: string,
  ): string {
    return this.agentProjectionPresenter.buildSummaryLine(agentView, locale);
  }

  private resolveAgentViewHighlights(
    agentView: NonNullable<CliCommandExecutionResultPayload['agentView']>,
    locale: string,
  ): string[] {
    return this.agentProjectionPresenter.buildHighlightLines(agentView, locale, 2);
  }

  /**
   * Resolves human-friendly progress summary for pretty output mode.
   * @param experience Command experience payload.
   * @returns Human-readable progress summary.
   */
  private resolveProgressSummaryHuman(
    experience: CliCommandExperiencePayload,
    locale: string,
  ): string {
    const statusLabels = this.resolveProgressStatusLabels(locale);
    const summary = this.resolveProgressSummary(experience);
    return summary
      .split(' ')
      .map((segment) => {
        const [key, value] = segment.split('=');
        const localizedLabel = statusLabels[key as keyof typeof statusLabels] ?? key;
        if (this.isZhCnLocale(locale)) {
          return `${localizedLabel} ${value}`;
        }
        return `${value} ${localizedLabel}`;
      })
      .join(', ');
  }

  /**
   * Resolves checks that need human attention in pretty output mode.
   * @param commandResult Command result payload.
   * @returns Warning/failure check rows.
   */
  private resolveAttentionChecks(
    commandResult: CliCommandExecutionResultPayload,
  ): CliCommandResultCheck[] {
    const checks = commandResult.checks ?? [];
    return checks.filter(
      (check) =>
        check.status === CliGovernanceCheckStatus.WARN ||
        check.status === CliGovernanceCheckStatus.FAIL,
    );
  }

  /**
   * Resolves always-visible success-path checks for key adopter-facing actions.
   * @param commandResult Command result payload.
   * @returns Ordered key-check rows.
   */
  private resolveKeyChecks(
    commandResult: CliCommandExecutionResultPayload,
  ): CliCommandResultCheck[] {
    return (commandResult.checks ?? []).filter(
      (check) =>
        CLI_PRETTY_KEY_CHECK_IDS.has(check.id) && check.status === CliGovernanceCheckStatus.PASS,
    );
  }

  /**
   * Resolves human-friendly labels for check identifiers.
   * @param checkId Check id string.
   * @returns Human-friendly check label.
   */
  private resolveReadableCheckLabel(checkId: string, locale: string): string {
    const labels = this.resolvePrettyLabels(locale);
    if (checkId.startsWith(CLI_ADAPTER_TOOL_CHECK_ID_PREFIX)) {
      const toolId = checkId.slice(CLI_ADAPTER_TOOL_CHECK_ID_PREFIX.length);
      return `${labels.adapterToolLabelPrefix} ${toolId}`;
    }

    switch (checkId) {
      case CliCommandResultCheckId.ADAPTER_VERIFICATION:
        return labels.adapterVerificationLabel;
      case CliCommandResultCheckId.PLAN_TASK_PACKAGE:
        return labels.planTaskPackageLabel;
      case CliCommandResultCheckId.PLAN_COMMIT_READINESS:
        return labels.planCommitReadinessLabel;
      case CliCommandResultCheckId.PLAN_LEDGER_PROJECTION:
        return labels.planLedgerProjectionLabel;
      case CliCommandResultCheckId.PLAN_COMMIT_RECEIPT:
        return labels.planCommitReceiptLabel;
      case CliCommandResultCheckId.UPGRADE_SCHEMA_DIFF:
        return labels.upgradeSchemaDiffLabel;
      case CliCommandResultCheckId.MIGRATION_SUGGESTIONS:
        return labels.migrationSuggestionsLabel;
      case CliCommandResultCheckId.CONFIRMATION_ITEMS:
        return labels.confirmationItemsLabel;
      case CliCommandResultCheckId.UPGRADE_APPLY_READINESS:
        return labels.upgradeApplyReadinessLabel;
      case CliCommandResultCheckId.UPGRADE_APPLY_RECEIPT:
        return labels.upgradeApplyReceiptLabel;
      case CliCommandResultCheckId.UPGRADE_VERIFY_RECEIPT:
        return labels.upgradeVerifyReceiptLabel;
      case CliCommandResultCheckId.UPGRADE_ROLLBACK_RECEIPT:
        return labels.upgradeRollbackReceiptLabel;
      case CliCommandResultCheckId.ROLLBACK_REFERENCE:
        return labels.rollbackReferenceLabel;
      case CliCommandResultCheckId.WORKSPACE_ACTION:
        return labels.workspaceActionLabel;
      case CliCommandResultCheckId.WORKSPACE_TARGET:
        return labels.workspaceTargetLabel;
      case CliCommandResultCheckId.WORKSPACE_SCRATCH_CLEANUP:
        return labels.workspaceScratchCleanupLabel;
      case CliCommandResultCheckId.WORKFLOW_TEMPLATE:
        return labels.workflowTemplateLabel;
      case CliCommandResultCheckId.WORKFLOW_PREVIEW_MODE:
        return labels.workflowPreviewModeLabel;
      case CliCommandResultCheckId.WORKFLOW_COMPILE_STATUS:
        return labels.workflowCompileStatusLabel;
      default:
        return checkId.replaceAll('_', ' ');
    }
  }

  /**
   * Resolves human-readable check detail text for pretty output.
   * @param check One command result check row.
   * @param locale Active output locale.
   * @returns Human-readable check detail text.
   */
  private resolveReadableCheckDetail(check: CliCommandResultCheck, locale: string): string {
    if (check.id.startsWith(CLI_ADAPTER_TOOL_CHECK_ID_PREFIX)) {
      return this.humanizeAdapterToolDetail(check.detail, locale);
    }

    switch (check.id) {
      case CliCommandResultCheckId.ADAPTER_VERIFICATION:
        return this.humanizeAdapterVerificationDetail(check.detail, locale);
      case CliCommandResultCheckId.PLAN_TASK_PACKAGE:
        return this.humanizePlanTaskPackageDetail(check.detail, locale);
      case CliCommandResultCheckId.PLAN_COMMIT_READINESS:
        return this.humanizePlanCommitReadinessDetail(check.detail, locale);
      case CliCommandResultCheckId.PLAN_LEDGER_PROJECTION:
        return this.humanizePlanLedgerProjectionDetail(check.detail, locale);
      case CliCommandResultCheckId.PLAN_COMMIT_RECEIPT:
        return this.humanizePlanCommitReceiptDetail(check.detail, locale);
      case CliCommandResultCheckId.UPGRADE_SCHEMA_DIFF:
        return this.humanizeUpgradeSchemaDiffDetail(check.detail, locale);
      case CliCommandResultCheckId.MIGRATION_SUGGESTIONS:
        return this.humanizeMigrationSuggestionDetail(check.detail, locale);
      case CliCommandResultCheckId.CONFIRMATION_ITEMS:
        return this.humanizeConfirmationItemsDetail(check.detail, locale);
      case CliCommandResultCheckId.UPGRADE_APPLY_READINESS:
        return this.humanizeUpgradeApplyReadinessDetail(check.detail, locale);
      case CliCommandResultCheckId.UPGRADE_APPLY_RECEIPT:
      case CliCommandResultCheckId.UPGRADE_VERIFY_RECEIPT:
      case CliCommandResultCheckId.UPGRADE_ROLLBACK_RECEIPT:
        return this.humanizeUpgradeReceiptDetail(check.detail, locale);
      case CliCommandResultCheckId.WORKSPACE_ACTION:
        return this.humanizeWorkspaceActionDetail(check.detail);
      case CliCommandResultCheckId.WORKSPACE_TARGET:
        return this.humanizeWorkspaceTargetDetail(check.detail, locale);
      case CliCommandResultCheckId.WORKSPACE_SCRATCH_CLEANUP:
        return this.humanizeWorkspaceScratchCleanupDetail(check.detail, locale);
      case CliCommandResultCheckId.WORKFLOW_TEMPLATE:
        return this.humanizeWorkflowTemplateDetail(check.detail, locale);
      case CliCommandResultCheckId.WORKFLOW_PREVIEW_MODE:
        return this.humanizeWorkflowPreviewModeDetail(check.detail, locale);
      case CliCommandResultCheckId.WORKFLOW_COMPILE_STATUS:
        return this.humanizeWorkflowCompileStatusDetail(check.detail, locale);
      default: {
        if (check.id.startsWith('managed:') && check.detail.startsWith('placeholder_resolved:')) {
          return this.humanizePlaceholderResolvedDetail(check.detail, locale);
        }
        return check.detail;
      }
    }
  }

  /**
   * Converts placeholder_resolved diff detail into a friendly status line.
   */
  private humanizePlaceholderResolvedDetail(detail: string, locale: string): string {
    const assetGroup = detail.slice('placeholder_resolved:'.length);
    if (this.isZhCnLocale(locale)) {
      return `占位文件已填写完成 (${assetGroup})`;
    }
    return `placeholder resolved (${assetGroup})`;
  }

  /**
   * Converts adapter verification key-value detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable verification summary.
   */
  private humanizeAdapterVerificationDetail(detail: string, locale: string): string {
    const detailMap = this.parseSpaceSeparatedKeyValueDetail(detail);
    const requiredRoles = detailMap.required_roles;
    const requiredFailures = detailMap.required_failures;
    const degradedRoles = detailMap.degraded_roles;
    const fallbackRoles = detailMap.fallback_roles;

    if (!requiredRoles && !requiredFailures && !degradedRoles && !fallbackRoles) {
      return detail;
    }

    if (this.isZhCnLocale(locale)) {
      const parts = [
        requiredRoles ? `必需角色 ${requiredRoles} 个` : null,
        requiredFailures ? `失败 ${requiredFailures} 个` : null,
        degradedRoles ? `降级 ${degradedRoles} 个` : null,
        fallbackRoles ? `fallback ${fallbackRoles} 个` : null,
      ].filter((part): part is string => Boolean(part));
      return parts.join('，');
    }

    const parts = [
      requiredRoles ? `required roles ${requiredRoles}` : null,
      requiredFailures ? `failures ${requiredFailures}` : null,
      degradedRoles ? `degraded ${degradedRoles}` : null,
      fallbackRoles ? `fallback ${fallbackRoles}` : null,
    ].filter((part): part is string => Boolean(part));
    return parts.join(', ');
  }

  /**
   * Converts adapter tool availability detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable tool summary.
   */
  private humanizeAdapterToolDetail(detail: string, locale: string): string {
    const availabilityPrefix = this.isZhCnLocale(locale) ? '可用性=' : 'availability=';
    const reasonsPrefix = this.isZhCnLocale(locale) ? '原因=' : 'reasons=';

    const availabilityMatch = detail.match(/(?:availability|可用性)=([^\s]+)/u);
    const reasonsMatch = detail.match(/(?:reasons|原因)=(.*)$/u);
    const availability = availabilityMatch?.[1] ?? null;
    const reasons = reasonsMatch?.[1]?.trim() || null;
    if (!availability && !reasons) {
      return detail;
    }

    if (this.isZhCnLocale(locale)) {
      return `${availabilityPrefix}${availability ?? 'unknown'} ${reasonsPrefix}${reasons ?? '无'}`;
    }
    return `${availabilityPrefix}${availability ?? 'unknown'} ${reasonsPrefix}${reasons ?? 'none'}`;
  }

  /**
   * Converts upgrade schema diff detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable diff summary.
   */
  private humanizeUpgradeSchemaDiffDetail(detail: string, locale: string): string {
    const detailMap = this.parseSpaceSeparatedKeyValueDetail(detail);
    const diffs = detailMap[CliUpgradeSchemaDiffDetailField.DIFFS] ?? '0';
    const source = detailMap[CliUpgradeSchemaDiffDetailField.SOURCE] ?? 'unknown';
    const target = detailMap[CliUpgradeSchemaDiffDetailField.TARGET] ?? 'unknown';

    return this.translateText('cli.output.pretty.checkDetails.upgradeSchemaDiff', locale, {
      diffs,
      source,
      target,
    });
  }

  /**
   * Converts plan task-package detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable task-package summary.
   */
  private humanizePlanTaskPackageDetail(detail: string, locale: string): string {
    const detailMap = this.parseJsonOrSpaceSeparatedKeyValueDetail(detail);
    const total = detailMap[CliPlanTaskPackageDetailField.TOTAL] ?? '0';
    const create = detailMap[CliPlanTaskPackageDetailField.CREATE] ?? '0';
    const retain = detailMap[CliPlanTaskPackageDetailField.RETAIN] ?? '0';

    return this.translateText('cli.output.pretty.checkDetails.planTaskPackage', locale, {
      total,
      create,
      retain,
    });
  }

  /**
   * Converts plan commit-readiness detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable readiness summary.
   */
  private humanizePlanCommitReadinessDetail(detail: string, locale: string): string {
    const detailMap = this.parseJsonOrSpaceSeparatedKeyValueDetail(detail);
    const readiness = detailMap[CliPlanCommitReadinessDetailField.READINESS] ?? 'unknown';
    const missing = detailMap[CliPlanCommitReadinessDetailField.MISSING] ?? '0';

    return this.translateText('cli.output.pretty.checkDetails.planCommitReadiness', locale, {
      readiness,
      missing,
    });
  }

  /**
   * Converts plan ledger-projection detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable ledger-projection summary.
   */
  private humanizePlanLedgerProjectionDetail(detail: string, locale: string): string {
    const detailMap = this.parseJsonOrSpaceSeparatedKeyValueDetail(detail);
    const planMd = detailMap[CliPlanLedgerProjectionDetailField.PLAN_MD] ?? 'unknown';
    const checklistMd = detailMap[CliPlanLedgerProjectionDetailField.CHECKLIST_MD] ?? 'unknown';
    const tasksCsv = detailMap[CliPlanLedgerProjectionDetailField.TASKS_CSV] ?? 'unknown';
    const tkFiles = detailMap[CliPlanLedgerProjectionDetailField.TK_FILES] ?? 'unknown';

    return this.translateText('cli.output.pretty.checkDetails.planLedgerProjection', locale, {
      planMd,
      checklistMd,
      tasksCsv,
      tkFiles,
    });
  }

  /**
   * Converts plan commit-receipt detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable plan-commit receipt summary.
   */
  private humanizePlanCommitReceiptDetail(detail: string, locale: string): string {
    const detailMap = this.parseJsonOrSpaceSeparatedKeyValueDetail(detail);
    const status = detailMap[CliPlanReceiptDetailField.STATUS] ?? 'unknown';
    const created = detailMap[CliPlanReceiptDetailField.CREATED] ?? '0';
    const retained = detailMap[CliPlanReceiptDetailField.RETAINED] ?? '0';
    const path = detailMap[CliPlanReceiptDetailField.PATH] ?? detail;

    return this.translateText('cli.output.pretty.checkDetails.planCommitReceipt', locale, {
      status,
      created,
      retained,
      path,
    });
  }

  /**
   * Converts migration suggestion count detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable suggestion summary.
   */
  private humanizeMigrationSuggestionDetail(detail: string, locale: string): string {
    const detailMap = this.parseSpaceSeparatedKeyValueDetail(detail);
    const count = detailMap[CliMigrationSuggestionDetailField.COUNT] ?? '0';

    return this.translateText('cli.output.pretty.checkDetails.migrationSuggestions', locale, {
      count,
    });
  }

  /**
   * Converts upgrade confirmation detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable confirmation summary.
   */
  private humanizeConfirmationItemsDetail(detail: string, locale: string): string {
    const detailMap = this.parseSpaceSeparatedKeyValueDetail(detail);
    const decision = detailMap[CliConfirmationItemsDetailField.DECISION] ?? 'unknown';
    const count = detailMap[CliConfirmationItemsDetailField.COUNT] ?? '0';
    const blocking = detailMap[CliConfirmationItemsDetailField.BLOCKING] ?? '0';

    return this.translateText('cli.output.pretty.checkDetails.confirmationItems', locale, {
      decision,
      count,
      blocking,
    });
  }

  /**
   * Converts upgrade apply-readiness detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable readiness summary.
   */
  private humanizeUpgradeApplyReadinessDetail(detail: string, locale: string): string {
    const detailMap = this.parseSpaceSeparatedKeyValueDetail(detail);
    const readiness = detailMap[CliUpgradeApplyReadinessDetailField.READINESS] ?? 'unknown';
    const decision = detailMap[CliUpgradeApplyReadinessDetailField.DECISION] ?? 'unknown';
    const count = detailMap[CliUpgradeApplyReadinessDetailField.COUNT] ?? '0';
    const blocking = detailMap[CliUpgradeApplyReadinessDetailField.BLOCKING] ?? '0';

    return this.translateText('cli.output.pretty.checkDetails.upgradeApplyReadiness', locale, {
      readiness,
      decision,
      count,
      blocking,
    });
  }

  /**
   * Converts upgrade receipt detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable receipt summary.
   */
  private humanizeUpgradeReceiptDetail(detail: string, locale: string): string {
    const detailMap = this.parseSpaceSeparatedKeyValueDetail(detail);
    const status = detailMap[CliUpgradeReceiptDetailField.STATUS] ?? 'unknown';
    const path = detailMap[CliUpgradeReceiptDetailField.PATH] ?? detail;

    return this.translateText('cli.output.pretty.checkDetails.upgradeReceipt', locale, {
      status,
      path,
    });
  }

  /**
   * Converts workspace action detail into readable text.
   * @param detail Raw detail string.
   * @returns Human-readable action summary.
   */
  private humanizeWorkspaceActionDetail(detail: string): string {
    const detailMap = this.parseSpaceSeparatedKeyValueDetail(detail);
    return detailMap[CliWorkspaceActionDetailField.ACTION] ?? detail;
  }

  /**
   * Converts workspace target detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable workspace target summary.
   */
  private humanizeWorkspaceTargetDetail(detail: string, locale: string): string {
    const detailMap = this.parseJsonOrSpaceSeparatedKeyValueDetail(detail);
    const mode = detailMap[CliWorkspaceTargetDetailField.MODE] ?? 'unknown';
    const root = detailMap[CliWorkspaceTargetDetailField.ROOT] ?? 'unknown';

    return this.translateText('cli.output.pretty.checkDetails.workspaceTarget', locale, {
      mode,
      root,
    });
  }

  /**
   * Converts workspace scratch-cleanup detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable scratch cleanup summary.
   */
  private humanizeWorkspaceScratchCleanupDetail(detail: string, locale: string): string {
    const detailMap = this.parseJsonOrSpaceSeparatedKeyValueDetail(detail);
    const removedRoot = detailMap[CliWorkspaceScratchCleanupDetailField.ROOT_REMOVED];
    const retainedRoot = detailMap[CliWorkspaceScratchCleanupDetailField.ROOT_RETAINED];

    if (removedRoot) {
      return this.translateText(
        'cli.output.pretty.checkDetails.workspaceScratchCleanupRemoved',
        locale,
        {
          root: removedRoot,
        },
      );
    }

    if (retainedRoot) {
      return this.translateText(
        'cli.output.pretty.checkDetails.workspaceScratchCleanupRetained',
        locale,
        {
          root: retainedRoot,
        },
      );
    }

    return detail;
  }

  /**
   * Converts workflow template detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable workflow-template summary.
   */
  private humanizeWorkflowTemplateDetail(detail: string, locale: string): string {
    const detailMap = this.parseJsonOrSpaceSeparatedKeyValueDetail(detail);
    const template = detailMap[CliWorkflowTemplateDetailField.TEMPLATE] ?? 'unknown';

    return this.translateText('cli.output.pretty.checkDetails.workflowTemplate', locale, {
      template,
    });
  }

  /**
   * Converts workflow preview-mode detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable preview-mode summary.
   */
  private humanizeWorkflowPreviewModeDetail(detail: string, locale: string): string {
    const detailMap = this.parseJsonOrSpaceSeparatedKeyValueDetail(detail);
    const mode = detailMap[CliWorkflowPreviewModeDetailField.MODE] ?? 'unknown';

    return this.translateText('cli.output.pretty.checkDetails.workflowPreviewMode', locale, {
      mode,
    });
  }

  /**
   * Converts workflow compile-status detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable compile-status summary.
   */
  private humanizeWorkflowCompileStatusDetail(detail: string, locale: string): string {
    const detailMap = this.parseJsonOrSpaceSeparatedKeyValueDetail(detail);
    const status = detailMap[CliWorkflowCompileStatusDetailField.STATUS] ?? 'unknown';
    const warnings = detailMap[CliWorkflowCompileStatusDetailField.WARNINGS] ?? '0';
    const errors = detailMap[CliWorkflowCompileStatusDetailField.ERRORS] ?? '0';

    return this.translateText('cli.output.pretty.checkDetails.workflowCompileStatus', locale, {
      status,
      warnings,
      errors,
    });
  }

  /**
   * Parses space-separated `key=value` detail strings into key-value records.
   * @param detail Raw detail text.
   * @returns Parsed key-value record.
   */
  private parseSpaceSeparatedKeyValueDetail(detail: string): Record<string, string> {
    const parsedDetail: Record<string, string> = {};
    const segments = detail.split(' ').filter((segment) => segment.includes('='));
    for (const segment of segments) {
      const separatorIndex = segment.indexOf('=');
      if (separatorIndex <= 0) {
        continue;
      }
      const key = segment.slice(0, separatorIndex).trim();
      const value = segment.slice(separatorIndex + 1).trim();
      if (!key || !value) {
        continue;
      }
      parsedDetail[key] = value;
    }
    return parsedDetail;
  }

  /**
   * Parses one check detail from JSON first, then falls back to space-separated `key=value`.
   * @param detail Raw detail text.
   * @returns Parsed key-value record.
   */
  private parseJsonOrSpaceSeparatedKeyValueDetail(detail: string): Record<string, string> {
    const normalizedDetail = detail.trim();
    if (normalizedDetail.startsWith('{') && normalizedDetail.endsWith('}')) {
      try {
        const parsedDetail = JSON.parse(normalizedDetail) as Record<string, unknown>;
        return Object.fromEntries(
          Object.entries(parsedDetail)
            .filter((entry): entry is [string, string | number | boolean] => {
              const [, value] = entry;
              return ['string', 'number', 'boolean'].includes(typeof value);
            })
            .map(([key, value]) => [key, String(value)]),
        );
      } catch {
        return this.parseSpaceSeparatedKeyValueDetail(detail);
      }
    }

    return this.parseSpaceSeparatedKeyValueDetail(detail);
  }

  /**
   * Resolves one presenter translation through i18n runtime when available, otherwise falls back.
   * @param key Stable translation key.
   * @param locale Active output locale.
   * @param interpolation Optional interpolation variables.
   * @returns Resolved localized text.
   */
  private translateText(
    key: string,
    locale: string,
    interpolation?: Record<string, string>,
  ): string {
    const translated = this.io.translate?.(key, interpolation);
    if (translated && translated !== key) {
      return translated;
    }

    const fallback =
      CLI_OUTPUT_TRANSLATION_FALLBACKS[key as keyof typeof CLI_OUTPUT_TRANSLATION_FALLBACKS];
    if (fallback) {
      return this.interpolateTemplate(
        this.isZhCnLocale(locale) ? fallback.zh : fallback.en,
        interpolation,
      );
    }

    return this.interpolateTemplate(key, interpolation);
  }

  /**
   * Applies simple `{{token}}` interpolation on presenter fallback strings.
   * @param template Fallback text template.
   * @param interpolation Optional interpolation variables.
   * @returns Interpolated fallback text.
   */
  private interpolateTemplate(template: string, interpolation?: Record<string, string>): string {
    if (!interpolation) {
      return template;
    }

    let resolvedTemplate = template;
    for (const [token, value] of Object.entries(interpolation)) {
      resolvedTemplate = resolvedTemplate.replaceAll(`{{${token}}}`, value);
    }
    return resolvedTemplate;
  }

  /**
   * Resolves ordered actionable next steps for pretty output.
   * @param commandResult Optional command result payload.
   * @returns Ordered next-action lines.
   */
  private resolvePrettyNextActions(
    commandResult: CliCommandExecutionResultPayload | undefined,
  ): string[] {
    if (!commandResult?.experience) {
      return [];
    }

    const actions: string[] = [];
    for (const prompt of commandResult.experience.interactionPrompts) {
      const actionLine = `${prompt.title}: ${prompt.action}`;
      if (!actions.includes(actionLine)) {
        actions.push(actionLine);
      }
    }
    return actions;
  }

  /**
   * Resolves localized status labels used by progress summaries.
   * @param locale Active output locale.
   * @returns Progress status -> label map.
   */
  private resolveProgressStatusLabels(locale: string): Record<string, string> {
    if (this.isZhCnLocale(locale)) {
      return {
        queued: '待开始',
        running: '进行中',
        completed: '已完成',
        waiting: '等待中',
        warning: '告警',
        failed: '失败',
      };
    }

    return {
      queued: 'queued',
      running: 'running',
      completed: 'completed',
      waiting: 'waiting',
      warning: 'warning',
      failed: 'failed',
    };
  }

  /**
   * Resolves pretty-render section/label localization.
   * @param locale Active output locale.
   * @returns Localized label dictionary.
   */
  private resolvePrettyLabels(locale: string): CliPrettyLabels {
    if (this.isZhCnLocale(locale)) {
      return {
        successTitle: 'repo-ai-governor：命令执行成功',
        summarySection: '摘要',
        commandLabel: '命令',
        operationLabel: '操作',
        attachModeLabel: '挂载模式',
        healthSection: '健康状态',
        checksLabel: '检查',
        passLabel: '通过',
        warnLabel: '告警',
        failLabel: '失败',
        progressLabel: '进度',
        attentionLabel: '关注项',
        keyDetailsLabel: '关键项',
        nextStepsSection: '下一步',
        moreHint: '条更多（去掉 --compact 查看完整内容）',
        artifactsSection: '产物',
        artifactsGeneratedLabel: '个产物已生成。',
        primaryLabel: '主产物',
        contextSection: '上下文',
        localeLabel: '语言',
        profileLabel: '配置档',
        outputLabel: '输出',
        outputModeLabel: '输出模式',
        downgradedFromLabel: '降级来源',
        debugSection: '调试',
        configSourceLabel: '配置来源',
        workspaceModeLabel: '工作区模式',
        workspaceModeSourceLabel: '工作区模式来源',
        workspaceIdLabel: '工作区 ID',
        workspaceRootLabel: '工作区根路径',
        memoryStoreEngineLabel: '记忆存储引擎',
        memoryStoreRootLabel: '记忆存储根路径',
        memoryStoreProviderLabel: '记忆存储 Provider',
        checkSummaryLabel: '检查摘要',
        artifactSummaryLabel: '产物摘要',
        roleProgressLabel: '角色进度',
        interactionPromptsLabel: '交互提示',
        detailedLogsLabel: '详细日志',
        adapterVerificationLabel: 'Adapter 校验',
        adapterToolLabelPrefix: 'Adapter 工具',
        planTaskPackageLabel: this.translateText(
          'cli.output.pretty.checkLabels.planTaskPackage',
          locale,
        ),
        planCommitReadinessLabel: this.translateText(
          'cli.output.pretty.checkLabels.planCommitReadiness',
          locale,
        ),
        planLedgerProjectionLabel: this.translateText(
          'cli.output.pretty.checkLabels.planLedgerProjection',
          locale,
        ),
        planCommitReceiptLabel: this.translateText(
          'cli.output.pretty.checkLabels.planCommitReceipt',
          locale,
        ),
        upgradeSchemaDiffLabel: this.translateText(
          'cli.output.pretty.checkLabels.upgradeSchemaDiff',
          locale,
        ),
        migrationSuggestionsLabel: this.translateText(
          'cli.output.pretty.checkLabels.migrationSuggestions',
          locale,
        ),
        confirmationItemsLabel: this.translateText(
          'cli.output.pretty.checkLabels.confirmationItems',
          locale,
        ),
        upgradeApplyReadinessLabel: this.translateText(
          'cli.output.pretty.checkLabels.upgradeApplyReadiness',
          locale,
        ),
        upgradeApplyReceiptLabel: this.translateText(
          'cli.output.pretty.checkLabels.upgradeApplyReceipt',
          locale,
        ),
        upgradeVerifyReceiptLabel: this.translateText(
          'cli.output.pretty.checkLabels.upgradeVerifyReceipt',
          locale,
        ),
        upgradeRollbackReceiptLabel: this.translateText(
          'cli.output.pretty.checkLabels.upgradeRollbackReceipt',
          locale,
        ),
        rollbackReferenceLabel: this.translateText(
          'cli.output.pretty.checkLabels.rollbackReference',
          locale,
        ),
        workspaceActionLabel: this.translateText(
          'cli.output.pretty.checkLabels.workspaceAction',
          locale,
        ),
        workspaceTargetLabel: this.translateText(
          'cli.output.pretty.checkLabels.workspaceTarget',
          locale,
        ),
        workspaceScratchCleanupLabel: this.translateText(
          'cli.output.pretty.checkLabels.workspaceScratchCleanup',
          locale,
        ),
        workflowTemplateLabel: this.translateText(
          'cli.output.pretty.checkLabels.workflowTemplate',
          locale,
        ),
        workflowPreviewModeLabel: this.translateText(
          'cli.output.pretty.checkLabels.workflowPreviewMode',
          locale,
        ),
        workflowCompileStatusLabel: this.translateText(
          'cli.output.pretty.checkLabels.workflowCompileStatus',
          locale,
        ),
      };
    }

    return {
      successTitle: 'repo-ai-governor: command succeeded',
      summarySection: 'Summary',
      commandLabel: 'Command',
      operationLabel: 'Operation',
      attachModeLabel: 'Attach mode',
      healthSection: 'Health',
      checksLabel: 'Checks',
      passLabel: 'pass',
      warnLabel: 'warn',
      failLabel: 'fail',
      progressLabel: 'Progress',
      attentionLabel: 'Attention',
      keyDetailsLabel: 'Key Details',
      nextStepsSection: 'Next Steps',
      moreHint: 'more (rerun without --compact to expand).',
      artifactsSection: 'Artifacts',
      artifactsGeneratedLabel: 'artifact(s) generated.',
      primaryLabel: 'Primary',
      contextSection: 'Context',
      localeLabel: 'Locale',
      profileLabel: 'Profile',
      outputLabel: 'Output',
      outputModeLabel: 'Output mode',
      downgradedFromLabel: 'Downgraded from',
      debugSection: 'Debug',
      configSourceLabel: 'Config source',
      workspaceModeLabel: 'Workspace mode',
      workspaceModeSourceLabel: 'Workspace mode source',
      workspaceIdLabel: 'Workspace ID',
      workspaceRootLabel: 'Workspace root',
      memoryStoreEngineLabel: 'Memory store engine',
      memoryStoreRootLabel: 'Memory store root',
      memoryStoreProviderLabel: 'Memory store provider',
      checkSummaryLabel: 'Check summary',
      artifactSummaryLabel: 'Artifact summary',
      roleProgressLabel: 'Role progress',
      interactionPromptsLabel: 'Interaction prompts',
      detailedLogsLabel: 'Detailed logs',
      adapterVerificationLabel: 'Adapter verification',
      adapterToolLabelPrefix: 'Adapter tool',
      planTaskPackageLabel: this.translateText(
        'cli.output.pretty.checkLabels.planTaskPackage',
        locale,
      ),
      planCommitReadinessLabel: this.translateText(
        'cli.output.pretty.checkLabels.planCommitReadiness',
        locale,
      ),
      planLedgerProjectionLabel: this.translateText(
        'cli.output.pretty.checkLabels.planLedgerProjection',
        locale,
      ),
      planCommitReceiptLabel: this.translateText(
        'cli.output.pretty.checkLabels.planCommitReceipt',
        locale,
      ),
      upgradeSchemaDiffLabel: this.translateText(
        'cli.output.pretty.checkLabels.upgradeSchemaDiff',
        locale,
      ),
      migrationSuggestionsLabel: this.translateText(
        'cli.output.pretty.checkLabels.migrationSuggestions',
        locale,
      ),
      confirmationItemsLabel: this.translateText(
        'cli.output.pretty.checkLabels.confirmationItems',
        locale,
      ),
      upgradeApplyReadinessLabel: this.translateText(
        'cli.output.pretty.checkLabels.upgradeApplyReadiness',
        locale,
      ),
      upgradeApplyReceiptLabel: this.translateText(
        'cli.output.pretty.checkLabels.upgradeApplyReceipt',
        locale,
      ),
      upgradeVerifyReceiptLabel: this.translateText(
        'cli.output.pretty.checkLabels.upgradeVerifyReceipt',
        locale,
      ),
      upgradeRollbackReceiptLabel: this.translateText(
        'cli.output.pretty.checkLabels.upgradeRollbackReceipt',
        locale,
      ),
      rollbackReferenceLabel: this.translateText(
        'cli.output.pretty.checkLabels.rollbackReference',
        locale,
      ),
      workspaceActionLabel: this.translateText(
        'cli.output.pretty.checkLabels.workspaceAction',
        locale,
      ),
      workspaceTargetLabel: this.translateText(
        'cli.output.pretty.checkLabels.workspaceTarget',
        locale,
      ),
      workspaceScratchCleanupLabel: this.translateText(
        'cli.output.pretty.checkLabels.workspaceScratchCleanup',
        locale,
      ),
      workflowTemplateLabel: this.translateText(
        'cli.output.pretty.checkLabels.workflowTemplate',
        locale,
      ),
      workflowPreviewModeLabel: this.translateText(
        'cli.output.pretty.checkLabels.workflowPreviewMode',
        locale,
      ),
      workflowCompileStatusLabel: this.translateText(
        'cli.output.pretty.checkLabels.workflowCompileStatus',
        locale,
      ),
    };
  }

  /**
   * Checks whether one locale belongs to zh-CN family.
   * @param locale Active output locale.
   * @returns True when locale starts with `zh`.
   */
  private isZhCnLocale(locale: string): boolean {
    return locale.trim().toLowerCase().startsWith('zh');
  }

  /**
   * Formats one role progress row into stable `key=value` segments.
   * @param entry Role progress row.
   * @returns One formatted row string.
   */
  private formatRoleProgress(entry: CliRoleStageProgress): string {
    const backlink =
      entry.backlink && (entry.backlink.stageId || entry.backlink.executionId)
        ? `execution=${entry.backlink.executionId ?? 'n/a'},stage=${entry.backlink.stageId ?? 'n/a'}`
        : 'execution=n/a,stage=n/a';
    return `role=${entry.roleId},stage=${entry.stage},status=${entry.status},category=${entry.category},${backlink}`;
  }
}
