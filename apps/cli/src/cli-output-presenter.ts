import { ErrorOutputEnvironment } from "@repo-ai-governor/shared";
import { CliGovernanceCheckStatus } from "./constants/cli-governance-runtime.constant.js";
import { CliVerbosity } from "./constants/cli-output.constant.js";
import type {
  CliCommandExecutionResultPayload,
  CliCommandExperiencePayload,
  CliCommandResultCheck,
  CliErrorOutputPayload,
  CliRoleStageProgress,
  CliSuccessOutputPayload,
} from "./types/interfaces/index.js";

const ANSI_RESET = "\u001b[0m";
const ANSI_SUCCESS = "\u001b[1;32m";
const ANSI_ERROR = "\u001b[1;31m";

/**
 * Renders and writes CLI output payloads for success/error flows.
 *
 * Why this exists:
 * one presenter keeps `pretty/plain/json` behavior deterministic across commands
 * and ensures non-TTY fallback still emits a stable output contract.
 */
export class CliOutputPresenter {
  /**
   * Creates a presenter bound to runtime stdout/stderr writers.
   * @param io Output writer adapters from CLI runtime.
   */
  public constructor(
    private readonly io: {
      stdout: (value: string) => void;
      stderr: (value: string) => void;
    },
  ) {}

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
      "",
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
    }

    if (commandResult?.check_totals || commandResult?.checks || commandResult?.experience) {
      lines.push("", labels.healthSection);
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
    }

    const nextActions = this.resolvePrettyNextActions(commandResult);
    if (nextActions.length > 0) {
      lines.push("", labels.nextStepsSection);
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
      lines.push("", labels.artifactsSection);
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
      lines.push("", labels.contextSection);
      if (compactPretty) {
        lines.push(
          `  - ${labels.localeLabel}=${payload.diagnostics.locale} | ${labels.profileLabel}=${payload.diagnostics.profile} | ${labels.outputLabel}=${payload.output_mode}`,
        );
      } else {
        lines.push(
          `  - ${labels.localeLabel}: ${payload.diagnostics.locale}`,
          `  - ${labels.profileLabel}: ${payload.diagnostics.profile}`,
          `  - ${labels.outputModeLabel}: ${payload.output_mode}`,
          `  - ${labels.downgradedFromLabel}: ${payload.runtime.downgraded_from ?? "none"}`,
        );
      }
    }

    if (payload.verbosity === CliVerbosity.VERBOSE) {
      lines.push("", labels.debugSection);
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
          .join(", ");
        lines.push(`  - ${labels.checkSummaryLabel}: ${checkSummary}`);
      }
      if (commandResult?.artifacts) {
        const artifactSummary = commandResult.artifacts
          .map((artifact) => `${artifact.id}=${artifact.path}`)
          .join(", ");
        lines.push(`  - ${labels.artifactSummaryLabel}: ${artifactSummary}`);
      }
      if (commandResult?.experience) {
        const roleProgressLines = commandResult.experience.roleProgress
          .map((entry) => this.formatRoleProgress(entry))
          .join("; ");
        if (roleProgressLines.length > 0) {
          lines.push(`  - ${labels.roleProgressLabel}: ${roleProgressLines}`);
        }
        if (commandResult.experience.interactionPrompts.length > 0) {
          const promptLines = commandResult.experience.interactionPrompts
            .map(
              (prompt) =>
                `${prompt.stage}:${prompt.category}:${prompt.blocking ? "blocking" : "non_blocking"}:${prompt.action}`,
            )
            .join("; ");
          lines.push(`  - ${labels.interactionPromptsLabel}: ${promptLines}`);
        }
        if (commandResult.experience.layeredLogs.detailed.length > 0) {
          lines.push(
            `  - ${labels.detailedLogsLabel}: ${commandResult.experience.layeredLogs.detailed.join(" | ")}`,
          );
        }
      }
    }

    return lines.join("\n");
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
      : "";

    if (payload.verbosity === CliVerbosity.QUIET) {
      return `${payload.message} outputMode=${payload.output_mode}${commandResult ? ` operation=${commandResult.operation}` : ""}${progressSuffix}`;
    }

    if (payload.verbosity === CliVerbosity.VERBOSE) {
      return `${payload.message} outputMode=${payload.output_mode} verbosity=${payload.verbosity} configSource=${payload.diagnostics.configSource} downgradedFrom=${payload.runtime.downgraded_from ?? "none"}${commandResult ? ` operation=${commandResult.operation}` : ""}${progressSuffix}`;
    }

    return `${payload.message} outputMode=${payload.output_mode} verbosity=${payload.verbosity}${commandResult ? ` operation=${commandResult.operation}` : ""}${progressSuffix}`;
  }

  /**
   * Renders a pretty error block with stable structured fields.
   * @param payload Failed execution payload.
   * @returns Pretty-formatted error text.
   */
  private renderPrettyError(payload: CliErrorOutputPayload): string {
    const title = this.decorateIfColorEnabled(
      "repo-ai-governor: command failed",
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
        `  downgraded_from: ${payload.runtime.downgraded_from ?? "none"}`,
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

    return lines.join("\n");
  }

  /**
   * Renders a plain one-line error with required structured fields.
   * @param payload Failed execution payload.
   * @returns Plain text output.
   */
  private renderPlainError(payload: CliErrorOutputPayload): string {
    const detailSegments = [
      payload.error_details?.report_path ? `report_path=${payload.error_details.report_path}` : "",
      payload.error_details?.replay_path ? `replay_path=${payload.error_details.replay_path}` : "",
      payload.error_details?.pending_status
        ? `pending_status=${payload.error_details.pending_status}`
        : "",
    ].filter((segment) => segment.length > 0);

    return `${payload.message} error_code=${payload.error_code} hint=${payload.hint} next_action=${payload.next_action}${detailSegments.length > 0 ? ` ${detailSegments.join(" ")}` : ""}`;
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
    return value.endsWith("\n") ? value : `${value}\n`;
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
      .split(" ")
      .map((segment) => {
        const [key, value] = segment.split("=");
        const localizedLabel = statusLabels[key as keyof typeof statusLabels] ?? key;
        if (this.isZhCnLocale(locale)) {
          return `${localizedLabel} ${value}`;
        }
        return `${value} ${localizedLabel}`;
      })
      .join(", ");
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
   * Resolves human-friendly labels for check identifiers.
   * @param checkId Check id string.
   * @returns Human-friendly check label.
   */
  private resolveReadableCheckLabel(checkId: string, locale: string): string {
    const labels = this.resolvePrettyLabels(locale);
    if (checkId === "adapter_verification") {
      return labels.adapterVerificationLabel;
    }

    if (checkId.startsWith("adapter_tool_")) {
      const toolId = checkId.slice("adapter_tool_".length);
      return `${labels.adapterToolLabelPrefix} ${toolId}`;
    }

    return checkId.replaceAll("_", " ");
  }

  /**
   * Resolves human-readable check detail text for pretty output.
   * @param check One command result check row.
   * @param locale Active output locale.
   * @returns Human-readable check detail text.
   */
  private resolveReadableCheckDetail(check: CliCommandResultCheck, locale: string): string {
    if (check.id === "adapter_verification") {
      return this.humanizeAdapterVerificationDetail(check.detail, locale);
    }

    if (check.id.startsWith("adapter_tool_")) {
      return this.humanizeAdapterToolDetail(check.detail, locale);
    }

    return check.detail;
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
      return parts.join("，");
    }

    const parts = [
      requiredRoles ? `required roles ${requiredRoles}` : null,
      requiredFailures ? `failures ${requiredFailures}` : null,
      degradedRoles ? `degraded ${degradedRoles}` : null,
      fallbackRoles ? `fallback ${fallbackRoles}` : null,
    ].filter((part): part is string => Boolean(part));
    return parts.join(", ");
  }

  /**
   * Converts adapter tool availability detail into readable text.
   * @param detail Raw detail string.
   * @param locale Active output locale.
   * @returns Human-readable tool summary.
   */
  private humanizeAdapterToolDetail(detail: string, locale: string): string {
    const availabilityPrefix = this.isZhCnLocale(locale) ? "可用性=" : "availability=";
    const reasonsPrefix = this.isZhCnLocale(locale) ? "原因=" : "reasons=";

    const availabilityMatch = detail.match(/(?:availability|可用性)=([^\s]+)/u);
    const reasonsMatch = detail.match(/(?:reasons|原因)=(.*)$/u);
    const availability = availabilityMatch?.[1] ?? null;
    const reasons = reasonsMatch?.[1]?.trim() || null;
    if (!availability && !reasons) {
      return detail;
    }

    if (this.isZhCnLocale(locale)) {
      return `${availabilityPrefix}${availability ?? "unknown"} ${reasonsPrefix}${reasons ?? "无"}`;
    }
    return `${availabilityPrefix}${availability ?? "unknown"} ${reasonsPrefix}${reasons ?? "none"}`;
  }

  /**
   * Parses space-separated `key=value` detail strings into key-value records.
   * @param detail Raw detail text.
   * @returns Parsed key-value record.
   */
  private parseSpaceSeparatedKeyValueDetail(detail: string): Record<string, string> {
    const parsedDetail: Record<string, string> = {};
    const segments = detail.split(" ").filter((segment) => segment.includes("="));
    for (const segment of segments) {
      const separatorIndex = segment.indexOf("=");
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
        queued: "待开始",
        running: "进行中",
        completed: "已完成",
        waiting: "等待中",
        warning: "告警",
        failed: "失败",
      };
    }

    return {
      queued: "queued",
      running: "running",
      completed: "completed",
      waiting: "waiting",
      warning: "warning",
      failed: "failed",
    };
  }

  /**
   * Resolves pretty-render section/label localization.
   * @param locale Active output locale.
   * @returns Localized label dictionary.
   */
  private resolvePrettyLabels(locale: string): {
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
  } {
    if (this.isZhCnLocale(locale)) {
      return {
        successTitle: "repo-ai-governor：命令执行成功",
        summarySection: "摘要",
        commandLabel: "命令",
        operationLabel: "操作",
        attachModeLabel: "挂载模式",
        healthSection: "健康状态",
        checksLabel: "检查",
        passLabel: "通过",
        warnLabel: "告警",
        failLabel: "失败",
        progressLabel: "进度",
        attentionLabel: "关注项",
        nextStepsSection: "下一步",
        moreHint: "条更多（去掉 --compact 查看完整内容）",
        artifactsSection: "产物",
        artifactsGeneratedLabel: "个产物已生成。",
        primaryLabel: "主产物",
        contextSection: "上下文",
        localeLabel: "语言",
        profileLabel: "配置档",
        outputLabel: "输出",
        outputModeLabel: "输出模式",
        downgradedFromLabel: "降级来源",
        debugSection: "调试",
        configSourceLabel: "配置来源",
        workspaceModeLabel: "工作区模式",
        workspaceModeSourceLabel: "工作区模式来源",
        workspaceIdLabel: "工作区 ID",
        workspaceRootLabel: "工作区根路径",
        memoryStoreEngineLabel: "记忆存储引擎",
        memoryStoreRootLabel: "记忆存储根路径",
        memoryStoreProviderLabel: "记忆存储 Provider",
        checkSummaryLabel: "检查摘要",
        artifactSummaryLabel: "产物摘要",
        roleProgressLabel: "角色进度",
        interactionPromptsLabel: "交互提示",
        detailedLogsLabel: "详细日志",
        adapterVerificationLabel: "Adapter 校验",
        adapterToolLabelPrefix: "Adapter 工具",
      };
    }

    return {
      successTitle: "repo-ai-governor: command succeeded",
      summarySection: "Summary",
      commandLabel: "Command",
      operationLabel: "Operation",
      attachModeLabel: "Attach mode",
      healthSection: "Health",
      checksLabel: "Checks",
      passLabel: "pass",
      warnLabel: "warn",
      failLabel: "fail",
      progressLabel: "Progress",
      attentionLabel: "Attention",
      nextStepsSection: "Next Steps",
      moreHint: "more (rerun without --compact to expand).",
      artifactsSection: "Artifacts",
      artifactsGeneratedLabel: "artifact(s) generated.",
      primaryLabel: "Primary",
      contextSection: "Context",
      localeLabel: "Locale",
      profileLabel: "Profile",
      outputLabel: "Output",
      outputModeLabel: "Output mode",
      downgradedFromLabel: "Downgraded from",
      debugSection: "Debug",
      configSourceLabel: "Config source",
      workspaceModeLabel: "Workspace mode",
      workspaceModeSourceLabel: "Workspace mode source",
      workspaceIdLabel: "Workspace ID",
      workspaceRootLabel: "Workspace root",
      memoryStoreEngineLabel: "Memory store engine",
      memoryStoreRootLabel: "Memory store root",
      memoryStoreProviderLabel: "Memory store provider",
      checkSummaryLabel: "Check summary",
      artifactSummaryLabel: "Artifact summary",
      roleProgressLabel: "Role progress",
      interactionPromptsLabel: "Interaction prompts",
      detailedLogsLabel: "Detailed logs",
      adapterVerificationLabel: "Adapter verification",
      adapterToolLabelPrefix: "Adapter tool",
    };
  }

  /**
   * Checks whether one locale belongs to zh-CN family.
   * @param locale Active output locale.
   * @returns True when locale starts with `zh`.
   */
  private isZhCnLocale(locale: string): boolean {
    return locale.trim().toLowerCase().startsWith("zh");
  }

  /**
   * Formats one role progress row into stable `key=value` segments.
   * @param entry Role progress row.
   * @returns One formatted row string.
   */
  private formatRoleProgress(entry: CliRoleStageProgress): string {
    const backlink =
      entry.backlink && (entry.backlink.stageId || entry.backlink.executionId)
        ? `execution=${entry.backlink.executionId ?? "n/a"},stage=${entry.backlink.stageId ?? "n/a"}`
        : "execution=n/a,stage=n/a";
    return `role=${entry.roleId},stage=${entry.stage},status=${entry.status},category=${entry.category},${backlink}`;
  }
}
