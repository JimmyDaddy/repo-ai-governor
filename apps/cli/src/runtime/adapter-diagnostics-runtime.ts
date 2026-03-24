import { AgentAvailabilityStatus } from "@repo-ai-governor/adapter-sdk";
import { ExecutionInteractionCategory, ExecutionProgressStatus } from "@repo-ai-governor/shared";
import type { ExecutionProgressStage } from "@repo-ai-governor/shared";
import { CliGovernanceCheckStatus } from "../constants/cli-governance-runtime.constant.js";
import type {
  CliAdapterRoleEvaluation,
  CliAdapterToolProbeSnapshot,
  CliAdapterVerificationResolution,
  CliInteractionPrompt,
  CliRoleStageProgress,
} from "../types/index.js";

/**
 * Owns CLI-local adapter diagnostics shaping so payload/progress/prompt builders stay outside the facade.
 */
export class CliAdapterDiagnosticsRuntime {
  public constructor(
    private readonly localizeText: (english: string, chinese: string) => string,
    private readonly createFailureAttributionSummary: (
      verification: CliAdapterVerificationResolution,
    ) => Record<string, number>,
  ) {}

  /**
   * Resolves adapter tool-level check status from one probe snapshot.
   * @param snapshot Adapter tool probe snapshot.
   * @returns Check status used by doctor output.
   */
  public resolveToolProbeCheckStatus(
    snapshot: CliAdapterToolProbeSnapshot,
  ): CliGovernanceCheckStatus {
    if (!snapshot.enabled) {
      return CliGovernanceCheckStatus.WARN;
    }
    if (snapshot.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return CliGovernanceCheckStatus.WARN;
    }
    if (snapshot.availabilityStatus === AgentAvailabilityStatus.DEGRADED) {
      return CliGovernanceCheckStatus.WARN;
    }
    return CliGovernanceCheckStatus.PASS;
  }

  /**
   * Resolves adapter tool-level human-readable detail text from one probe snapshot.
   * @param snapshot Adapter tool probe snapshot.
   * @returns Human-readable detail text.
   */
  public resolveToolProbeCheckDetail(snapshot: CliAdapterToolProbeSnapshot): string {
    if (!snapshot.enabled) {
      return this.localizeText("disabled_by_config", "由配置禁用");
    }

    const readableReasons =
      snapshot.unavailableReasons.length > 0
        ? this.humanizeToolUnavailableReasons(snapshot.unavailableReasons)
        : ["none"];
    const attributionLabel = this.localizeText("attribution", "归因");
    const availabilityLabel = this.localizeText("availability", "可用性");
    const reasonsLabel = this.localizeText("reasons", "原因");
    return `${availabilityLabel}=${snapshot.availabilityStatus} ${attributionLabel}=${snapshot.failureAttributions.join("|") || "none"} ${reasonsLabel}=${readableReasons.join(" | ")}`;
  }

  /**
   * Defines explicit safe_local doctor-fix boundary for operator-facing diagnostics.
   * @param fixEnabled Whether `--fix` is enabled in the current doctor invocation.
   * @returns JSON-serializable safe_local boundary payload.
   */
  public createSafeLocalBoundaryArtifactPayload(fixEnabled: boolean): Record<string, unknown> {
    return {
      mode: "safe_local_only",
      fixEnabled,
      allowedWrites: [
        "workspace_root_directory",
        "workspace_config_template",
        "memory_store_root_directory",
      ],
      blockedMutations: [
        "adapter_credentials",
        "adapter_login_state",
        "local_model_endpoint",
        "local_model_model_pull",
        "remote_provider_installation",
      ],
    };
  }

  /**
   * Converts adapter verification resolution into one JSON-serializable artifact payload.
   * @param verification Adapter verification resolution.
   * @returns Artifact payload.
   */
  public createAdapterVerificationArtifactPayload(
    verification: CliAdapterVerificationResolution,
  ): Record<string, unknown> {
    return {
      overallStatus: verification.overallStatus,
      requiredRoleCount: verification.requiredRoleCount,
      requiredRoleFailedCount: verification.requiredRoleFailedCount,
      degradedRoleCount: verification.degradedRoleCount,
      fallbackRoleCount: verification.fallbackRoleCount,
      failureAttributionSummary: this.createFailureAttributionSummary(verification),
      tools: verification.tools.map((tool) => ({
        toolId: tool.toolId,
        enabled: tool.enabled,
        configuredAvailability: tool.configuredAvailability,
        availabilityStatus: tool.availabilityStatus,
        unavailableReasons: tool.unavailableReasons,
        failureAttributions: tool.failureAttributions,
        capabilitySupportByCapability: Object.fromEntries(
          tool.capabilitySupportByCapability.entries(),
        ),
      })),
      roles: verification.roleEvaluations.map((role) => ({
        roleId: role.roleId,
        roleProfileId: role.roleProfileId,
        required: role.required,
        primarySurface: role.primarySurface,
        selectedSurface: role.selectedSurface,
        selectedBy: role.selectedBy,
        unsupportedCapabilities: role.unsupportedCapabilities,
        degradedCapabilities: role.degradedCapabilities,
        unavailableReasons: role.unavailableReasons,
        failureAttributions: role.failureAttributions,
        status: role.status,
      })),
    };
  }

  /**
   * Converts adapter role evaluations into role/stage progress rows.
   * @param options Stage context and adapter verification snapshot.
   * @returns Role progress rows for command experience output.
   */
  public createAdapterRoleProgressRows(options: {
    verification: CliAdapterVerificationResolution;
    stage: ExecutionProgressStage;
    diagnosticsPath: string;
    executionId: string;
  }): CliRoleStageProgress[] {
    return options.verification.roleEvaluations.map((roleEvaluation) => ({
      roleId: roleEvaluation.roleId,
      stage: options.stage,
      status: this.resolveProgressStatusFromCheck(roleEvaluation.status),
      category:
        roleEvaluation.status === CliGovernanceCheckStatus.FAIL
          ? ExecutionInteractionCategory.RUNTIME_FAILURE
          : ExecutionInteractionCategory.NONE,
      summary: `Role ${roleEvaluation.roleId} routed via ${roleEvaluation.selectedSurface ?? "none"} (${roleEvaluation.selectedBy}).`,
      detail: this.formatRoleEvaluationDetail(roleEvaluation),
      backlink: {
        executionId: options.executionId,
        stageId: options.stage,
        artifactPath: options.diagnosticsPath,
      },
    }));
  }

  /**
   * Builds adapter follow-up prompts from verification diagnostics.
   * @param options Adapter verification context.
   * @returns Ordered interaction prompts.
   */
  public createAdapterInteractionPrompts(options: {
    verification: CliAdapterVerificationResolution;
    stage: ExecutionProgressStage;
  }): CliInteractionPrompt[] {
    return options.verification.nextActions.map((nextAction) => ({
      category:
        options.verification.overallStatus === CliGovernanceCheckStatus.FAIL
          ? ExecutionInteractionCategory.RUNTIME_FAILURE
          : ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION,
      stage: options.stage,
      title:
        options.verification.overallStatus === CliGovernanceCheckStatus.FAIL
          ? this.localizeText("Adapter route blocked", "Adapter 路由已阻断")
          : this.localizeText("Adapter route attention", "Adapter 路由需要关注"),
      action: nextAction,
      blocking: options.verification.overallStatus === CliGovernanceCheckStatus.FAIL,
    }));
  }

  /**
   * Resolves role-level detail text from one adapter role evaluation.
   * @param roleEvaluation One role evaluation row.
   * @returns Human-readable detail text.
   */
  public resolveRoleEvaluationDetail(roleEvaluation: CliAdapterRoleEvaluation): string {
    return this.formatRoleEvaluationDetail(roleEvaluation);
  }

  /**
   * Maps command check status to normalized progress status.
   * @param status Command check status.
   * @returns Progress status consumed by output experience payload.
   */
  private resolveProgressStatusFromCheck(
    status: CliGovernanceCheckStatus,
  ): ExecutionProgressStatus {
    if (status === CliGovernanceCheckStatus.PASS) {
      return ExecutionProgressStatus.COMPLETED;
    }
    if (status === CliGovernanceCheckStatus.WARN) {
      return ExecutionProgressStatus.WARNING;
    }
    return ExecutionProgressStatus.FAILED;
  }

  /**
   * Resolves role-level detail text from one adapter role evaluation.
   * @param roleEvaluation One role evaluation row.
   * @returns Human-readable detail text.
   */
  private formatRoleEvaluationDetail(roleEvaluation: CliAdapterRoleEvaluation): string {
    const unsupported =
      roleEvaluation.unsupportedCapabilities.length > 0
        ? roleEvaluation.unsupportedCapabilities.join("|")
        : "none";
    const degraded =
      roleEvaluation.degradedCapabilities.length > 0
        ? roleEvaluation.degradedCapabilities.join("|")
        : "none";
    const unavailableReasons =
      roleEvaluation.unavailableReasons.length > 0
        ? roleEvaluation.unavailableReasons.join("|")
        : "none";
    const failureAttributions =
      roleEvaluation.failureAttributions.length > 0
        ? roleEvaluation.failureAttributions.join("|")
        : "none";
    return `required=${roleEvaluation.required} selected=${roleEvaluation.selectedSurface ?? "none"} selected_by=${roleEvaluation.selectedBy} unsupported=${unsupported} degraded=${degraded} attribution=${failureAttributions} reasons=${unavailableReasons}`;
  }

  /**
   * Converts machine-readable unavailable reasons into human-friendly diagnostics text.
   * @param reasons Raw unavailable reasons.
   * @returns Human-friendly reason lines.
   */
  private humanizeToolUnavailableReasons(reasons: string[]): string[] {
    return reasons.map((reason) => this.humanizeToolUnavailableReason(reason));
  }

  /**
   * Converts one unavailable reason code into human-friendly diagnostics text.
   * @param reason Raw unavailable reason.
   * @returns Human-friendly reason line.
   */
  private humanizeToolUnavailableReason(reason: string): string {
    if (reason.startsWith("command_missing:")) {
      const [, surface, command] = reason.split(":", 3);
      return this.localizeText(
        `missing command "${command}" for surface "${surface}"`,
        `surface "${surface}" 缺少本地命令 "${command}"`,
      );
    }

    if (reason.startsWith("command_probe_failed:")) {
      const [, surface, command, ...detailParts] = reason.split(":");
      const detail = detailParts.join(":");
      return this.localizeText(
        `command exists but check failed for surface "${surface}" via "${command}" (${detail})`,
        `surface "${surface}" 命令 "${command}" 可执行但探测失败（${detail}）`,
      );
    }

    if (reason.startsWith("probe_failed:")) {
      const [, ...detailParts] = reason.split(":");
      const detail = detailParts.join(":");
      return this.localizeText(`adapter probe failed (${detail})`, `adapter 探测失败（${detail}）`);
    }

    if (reason.startsWith("local_model_model_missing:")) {
      const [, surface, ...modelParts] = reason.split(":");
      const model = modelParts.join(":");
      return this.localizeText(
        `local-model surface "${surface}" is missing configured model "${model}"`,
        `本地模型 surface "${surface}" 缺少已配置模型 "${model}"`,
      );
    }

    if (reason.startsWith("local_model_config_missing:")) {
      const [, surface, missingKeys] = reason.split(":", 3);
      return this.localizeText(
        `local-model surface "${surface}" is missing config fields "${missingKeys}"`,
        `本地模型 surface "${surface}" 缺少配置字段 "${missingKeys}"`,
      );
    }

    if (reason.startsWith("local_model_endpoint_unreachable:")) {
      const [, surface, encodedEndpoint, errorCode, ...messageParts] = reason.split(":");
      const endpoint = decodeURIComponent(encodedEndpoint ?? "");
      const message = messageParts.join(":");
      return this.localizeText(
        `local-model surface "${surface}" cannot reach endpoint "${endpoint}" (${errorCode}: ${message})`,
        `本地模型 surface "${surface}" 无法访问 endpoint "${endpoint}"（${errorCode}: ${message}）`,
      );
    }

    if (reason.startsWith("local_model_probe_invalid_response:")) {
      const [, surface, encodedEndpoint] = reason.split(":");
      const endpoint = decodeURIComponent(encodedEndpoint ?? "");
      return this.localizeText(
        `local-model surface "${surface}" returned invalid probe payload from "${endpoint}"`,
        `本地模型 surface "${surface}" 从 "${endpoint}" 返回了无效探测结果`,
      );
    }

    if (reason.startsWith("disabled_by_config:")) {
      const [, surface] = reason.split(":", 2);
      return this.localizeText(
        `disabled by config for surface "${surface}"`,
        `surface "${surface}" 已被配置禁用`,
      );
    }

    return reason;
  }
}
