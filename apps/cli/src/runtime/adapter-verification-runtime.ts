import {
  AgentAvailabilityStatus,
  AgentCapabilitySupportLevel,
  type AgentProbeResult,
} from "@repo-ai-governor/adapter-sdk";
import type { AdaptersConfig } from "@repo-ai-governor/config";
import { AdapterAvailability, AdapterSurface } from "@repo-ai-governor/shared";
import {
  CLI_ADAPTER_FAILURE_ATTRIBUTION,
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from "../constants/cli-governance-runtime.constant.js";
import type {
  CliAdapterToolProbeSnapshot,
  CliAdapterVerificationResolution,
} from "../types/index.js";
import type { CliAdapterRoutingRuntime } from "./adapter-routing-runtime.js";
import type { CliLocalModelProbeRuntime } from "./local-model-probe-runtime.js";

/**
 * Aggregates adapter probe snapshots into role-level verification and next-action diagnostics.
 */
export class CliAdapterVerificationRuntime {
  public constructor(
    private readonly adaptersConfig: AdaptersConfig,
    private readonly localizeText: (english: string, chinese: string) => string,
    private readonly formatExecFailureDetail: (error: unknown) => string,
    private readonly adapterRoutingRuntime: CliAdapterRoutingRuntime,
    private readonly localModelProbeRuntime: CliLocalModelProbeRuntime,
  ) {}

  /**
   * Resolves adapters/routing verification summary used by connect/doctor/verify commands.
   * @returns Adapter verification resolution.
   */
  public async resolveAdapterVerification(): Promise<CliAdapterVerificationResolution> {
    const toolConfigBySurface = this.adapterRoutingRuntime.createToolConfigBySurfaceMap();
    const toolSnapshots = await this.collectAdapterToolSnapshotsBySurface(toolConfigBySurface);
    const toolSnapshotBySurface = new Map<AdapterSurface, CliAdapterToolProbeSnapshot>(
      toolSnapshots.map((snapshot) => [snapshot.toolId, snapshot]),
    );
    const routingByRole = this.adaptersConfig.routing.roleBindings;
    const fallbackPrimarySurface = this.adaptersConfig.tools?.[0]?.toolId ?? AdapterSurface.CODEX;
    const roleEvaluations = this.adaptersConfig.roles.map<
      CliAdapterVerificationResolution["roleEvaluations"][number]
    >((role) => {
      const roleBinding = routingByRole[role.roleId];
      if (!roleBinding) {
        const unavailableReasons = [`missing_role_binding:${role.roleId}`];
        return {
          roleId: role.roleId,
          roleProfileId: role.roleProfileId,
          required: role.required,
          primarySurface: fallbackPrimarySurface,
          selectedSurface: null,
          selectedBy: CliAdapterRoleSelectionSource.NONE,
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          unavailableReasons,
          failureAttributions: this.resolveFailureAttributions({
            unavailableReasons,
          }),
          status: role.required ? CliGovernanceCheckStatus.FAIL : CliGovernanceCheckStatus.WARN,
        };
      }

      const candidateSurfaces = this.adapterRoutingRuntime.resolveRoleBindingCandidateSurfaces(
        roleBinding,
        toolConfigBySurface,
      );
      const unavailableReasons: string[] = [];

      for (const candidateSurface of candidateSurfaces) {
        const toolSnapshot = toolSnapshotBySurface.get(candidateSurface);
        if (!toolSnapshot) {
          unavailableReasons.push(`missing_tool_snapshot:${candidateSurface}`);
          continue;
        }
        if (!toolSnapshot.enabled) {
          unavailableReasons.push(`tool_disabled:${candidateSurface}`);
          continue;
        }
        if (toolSnapshot.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
          unavailableReasons.push(
            `surface_unavailable:${candidateSurface}:${toolSnapshot.unavailableReasons.join("|") || "unavailable"}`,
          );
          continue;
        }

        const unsupportedCapabilities: string[] = [];
        const degradedCapabilities: string[] = [];
        for (const requiredCapability of role.requiredCapabilities) {
          const supportLevel =
            toolSnapshot.capabilitySupportByCapability.get(requiredCapability) ??
            AgentCapabilitySupportLevel.UNSUPPORTED;
          if (supportLevel === AgentCapabilitySupportLevel.UNSUPPORTED) {
            unsupportedCapabilities.push(requiredCapability);
            continue;
          }
          if (supportLevel === AgentCapabilitySupportLevel.DEGRADED) {
            degradedCapabilities.push(requiredCapability);
          }
        }
        if (unsupportedCapabilities.length > 0) {
          unavailableReasons.push(
            `capability_gap:${candidateSurface}:${unsupportedCapabilities.join("|")}`,
          );
          continue;
        }

        const selectedBy =
          candidateSurface === roleBinding.primarySurface
            ? CliAdapterRoleSelectionSource.PRIMARY
            : CliAdapterRoleSelectionSource.FALLBACK;
        const degraded =
          toolSnapshot.availabilityStatus === AgentAvailabilityStatus.DEGRADED ||
          degradedCapabilities.length > 0;
        return {
          roleId: role.roleId,
          roleProfileId: role.roleProfileId,
          required: role.required,
          primarySurface: roleBinding.primarySurface,
          selectedSurface: candidateSurface,
          selectedBy,
          unsupportedCapabilities: [],
          degradedCapabilities,
          unavailableReasons,
          failureAttributions: this.resolveFailureAttributions({
            unavailableReasons,
            degradedCapabilities,
          }),
          status:
            selectedBy === CliAdapterRoleSelectionSource.FALLBACK || degraded
              ? CliGovernanceCheckStatus.WARN
              : CliGovernanceCheckStatus.PASS,
        };
      }

      const resolvedUnavailableReasons =
        unavailableReasons.length > 0
          ? unavailableReasons
          : [`surface_unavailable:${roleBinding.primarySurface}`];
      return {
        roleId: role.roleId,
        roleProfileId: role.roleProfileId,
        required: role.required,
        primarySurface: roleBinding.primarySurface,
        selectedSurface: null,
        selectedBy: CliAdapterRoleSelectionSource.NONE,
        unsupportedCapabilities: [],
        degradedCapabilities: [],
        unavailableReasons: resolvedUnavailableReasons,
        failureAttributions: this.resolveFailureAttributions({
          unavailableReasons: resolvedUnavailableReasons,
        }),
        status: role.required ? CliGovernanceCheckStatus.FAIL : CliGovernanceCheckStatus.WARN,
      };
    });

    const requiredRoleCount = roleEvaluations.filter((role) => role.required).length;
    const requiredRoleFailedCount = roleEvaluations.filter(
      (role) => role.required && role.status === CliGovernanceCheckStatus.FAIL,
    ).length;
    const degradedRoleCount = roleEvaluations.filter(
      (role) => role.status === CliGovernanceCheckStatus.WARN,
    ).length;
    const fallbackRoleCount = roleEvaluations.filter(
      (role) => role.selectedBy === CliAdapterRoleSelectionSource.FALLBACK,
    ).length;
    const hasToolLevelWarning = toolSnapshots.some(
      (tool) => this.resolveToolProbeCheckStatus(tool) === CliGovernanceCheckStatus.WARN,
    );

    let overallStatus = CliGovernanceCheckStatus.PASS;
    if (requiredRoleCount === 0 || requiredRoleFailedCount > 0) {
      overallStatus = CliGovernanceCheckStatus.FAIL;
    } else if (degradedRoleCount > 0 || hasToolLevelWarning) {
      overallStatus = CliGovernanceCheckStatus.WARN;
    }

    const nextActions: string[] = [];
    if (requiredRoleCount === 0) {
      nextActions.push(
        this.localizeText(
          "Define at least one adapters.roles item with required=true.",
          "至少定义一个 adapters.roles 且 required=true 的角色。",
        ),
      );
    }
    if (requiredRoleFailedCount > 0) {
      nextActions.push(
        this.localizeText(
          "Check adapters.routing.roleBindings primary/fallback surfaces and ensure required roles have at least one available surface.",
          "请检查 adapters.routing.roleBindings 的主备 surface，确保必需角色至少有一个可用 surface。",
        ),
      );
    }
    const unavailableToolIds = toolSnapshots
      .filter((tool) => tool.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE)
      .map((tool) => tool.toolId);
    const missingCommands = this.collectMissingCommandsFromToolSnapshots(toolSnapshots);
    const failedProbeCommands = this.collectFailedProbeCommandsFromToolSnapshots(toolSnapshots);
    if (
      unavailableToolIds.length > 0 &&
      missingCommands.length === 0 &&
      failedProbeCommands.length === 0
    ) {
      nextActions.push(
        this.localizeText(
          `Probe/login dependencies are unavailable for: ${unavailableToolIds.join(", ")}.`,
          `以下工具的探测或登录依赖不可用：${unavailableToolIds.join(", ")}。`,
        ),
      );
    }
    if (missingCommands.length > 0) {
      nextActions.push(
        this.localizeText(
          `Install missing local commands before connect/verify: ${missingCommands.join(", ")}.`,
          `请先安装缺失的本地命令后再执行 connect/verify：${missingCommands.join(", ")}。`,
        ),
      );
    }
    if (failedProbeCommands.length > 0) {
      nextActions.push(
        this.localizeText(
          `Some commands exist but probe failed (${failedProbeCommands.join(", ")}). Run them manually to verify login/extension status.`,
          `部分命令可执行但探测失败（${failedProbeCommands.join(", ")}），请手动执行命令确认登录/扩展状态。`,
        ),
      );
    }
    const missingLocalModels = this.collectToolReasonPayloads(
      toolSnapshots,
      "local_model_model_missing:",
    );
    if (missingLocalModels.length > 0) {
      nextActions.push(
        this.localizeText(
          `Pull or configure the missing local models before unattended execution: ${missingLocalModels.join(", ")}.`,
          `请先拉取或修正以下缺失的本地模型，再进行无人值守执行：${missingLocalModels.join(", ")}。`,
        ),
      );
    }
    const missingLocalModelConfigs = this.collectToolReasonPayloads(
      toolSnapshots,
      "local_model_config_missing:",
    );
    if (missingLocalModelConfigs.length > 0) {
      nextActions.push(
        this.localizeText(
          `Provide adapters.tools[].localModel { provider, endpoint, model } for: ${missingLocalModelConfigs.join(", ")}.`,
          `请为以下工具补齐 adapters.tools[].localModel 的 provider、endpoint、model 配置：${missingLocalModelConfigs.join(", ")}。`,
        ),
      );
    }
    if (
      this.collectToolReasonPayloads(toolSnapshots, "local_model_endpoint_unreachable:").length >
        0 ||
      this.collectToolReasonPayloads(toolSnapshots, "local_model_probe_invalid_response:").length >
        0
    ) {
      nextActions.push(
        this.localizeText(
          "Check local-model endpoint reachability and Ollama health before relying on fallback routing.",
          "请先确认本地模型 endpoint 可达且 Ollama 服务健康，再依赖 fallback 路由。",
        ),
      );
    }
    if (fallbackRoleCount > 0 || degradedRoleCount > 0) {
      nextActions.push(
        this.localizeText(
          "Primary surfaces are degraded or fallback is in use; review cost/latency/risk routing priorities before unattended execution.",
          "当前使用降级或 fallback 路由，建议在无人值守执行前复核成本/时延/风险优先级。",
        ),
      );
    }

    return {
      overallStatus,
      tools: toolSnapshots,
      roleEvaluations,
      requiredRoleCount,
      requiredRoleFailedCount,
      degradedRoleCount,
      fallbackRoleCount,
      nextActions,
    };
  }

  /**
   * Aggregates tool/role attribution counts for diagnostics artifacts.
   * @param verification Adapter verification snapshot.
   * @returns Summary object keyed by attribution id.
   */
  public createFailureAttributionSummary(
    verification: CliAdapterVerificationResolution,
  ): Record<string, number> {
    const summary = new Map<string, number>();
    for (const attribution of [
      ...verification.tools.flatMap((tool) => tool.failureAttributions),
      ...verification.roleEvaluations.flatMap((role) => role.failureAttributions),
    ]) {
      summary.set(attribution, (summary.get(attribution) ?? 0) + 1);
    }
    return Object.fromEntries(summary.entries());
  }

  /**
   * Probes all tracked adapter tools using one shared tool-config lookup map.
   * @param toolConfigBySurface Surface -> tool config lookup map.
   * @returns Tool-level probe snapshots.
   */
  private async collectAdapterToolSnapshotsBySurface(
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig["tools"]>[number]>,
  ): Promise<CliAdapterToolProbeSnapshot[]> {
    const protocolBySurface =
      this.adapterRoutingRuntime.createProtocolBySurface(toolConfigBySurface);

    const snapshots: CliAdapterToolProbeSnapshot[] = [];
    const surfaces = this.adapterRoutingRuntime.resolveTrackedAdapterSurfaces(toolConfigBySurface);
    for (const surface of surfaces) {
      const toolConfig = toolConfigBySurface.get(surface);
      const enabled = toolConfig?.enabled ?? true;
      const configuredAvailability = enabled
        ? (toolConfig?.availability ?? null)
        : AdapterAvailability.UNAVAILABLE;
      const configuredUnavailableReasons = [...(toolConfig?.unavailableReasons ?? [])];
      const protocol = protocolBySurface[surface];
      const localModelConfigResolution = enabled
        ? this.localModelProbeRuntime.resolveLocalModelConfigurationResolution(surface, toolConfig)
        : {
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            unavailableReasons: [`disabled_by_config:${surface}`],
          };
      const localProbeResolution = enabled
        ? localModelConfigResolution.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE
          ? localModelConfigResolution
          : await this.localModelProbeRuntime.mergeLocalProbeResolutions(
              localModelConfigResolution,
              this.localModelProbeRuntime.probeLocalAdapterAvailability(surface, toolConfig),
            )
        : {
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            unavailableReasons: [`disabled_by_config:${surface}`],
          };
      try {
        const probeResult = await protocol.probe({
          routeKey: `cli.adapter.probe.${surface}`,
          requiredCapabilities: [],
        });
        const unavailableReasons = [
          ...configuredUnavailableReasons,
          ...probeResult.unavailableReasons,
          ...localProbeResolution.unavailableReasons,
        ].filter((reason, index, list) => list.indexOf(reason) === index);
        snapshots.push({
          toolId: surface,
          enabled,
          configuredAvailability,
          availabilityStatus: this.localModelProbeRuntime.mergeAvailabilityStatus(
            probeResult.availabilityStatus,
            localProbeResolution.availabilityStatus,
          ),
          unavailableReasons,
          capabilitySupportByCapability: this.createCapabilitySupportMap(probeResult),
          failureAttributions: this.resolveFailureAttributions({
            unavailableReasons,
          }),
        });
      } catch (error) {
        const unavailableReasons = [
          ...configuredUnavailableReasons,
          ...(enabled ? [] : [`disabled_by_config:${surface}`]),
          `probe_failed:${this.formatExecFailureDetail(error)}`,
        ].filter((reason, index, list) => list.indexOf(reason) === index);
        snapshots.push({
          toolId: surface,
          enabled,
          configuredAvailability,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons,
          capabilitySupportByCapability: new Map(),
          failureAttributions: this.resolveFailureAttributions({
            unavailableReasons,
          }),
        });
      }
    }

    return snapshots;
  }

  /**
   * Collects missing command names from adapter tool snapshots.
   * @param toolSnapshots Tool-level snapshots.
   * @returns Unique command names that are missing locally.
   */
  private collectMissingCommandsFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): string[] {
    const commands: string[] = [];
    for (const snapshot of toolSnapshots) {
      for (const reason of snapshot.unavailableReasons) {
        if (!reason.startsWith("command_missing:")) {
          continue;
        }
        const [, , command] = reason.split(":", 3);
        if (command && !commands.includes(command)) {
          commands.push(command);
        }
      }
    }
    return commands;
  }

  /**
   * Collects command probes that failed despite command presence.
   * @param toolSnapshots Tool-level snapshots.
   * @returns Unique `<surface>:<command>` command probe identifiers.
   */
  private collectFailedProbeCommandsFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): string[] {
    const failedCommands: string[] = [];
    for (const snapshot of toolSnapshots) {
      for (const reason of snapshot.unavailableReasons) {
        if (!reason.startsWith("command_probe_failed:")) {
          continue;
        }
        const [, surface, command] = reason.split(":", 4);
        if (!surface || !command) {
          continue;
        }
        const failedCommandId = `${surface}:${command}`;
        if (!failedCommands.includes(failedCommandId)) {
          failedCommands.push(failedCommandId);
        }
      }
    }
    return failedCommands;
  }

  /**
   * Collects payload suffixes for one unavailable-reason prefix across tool snapshots.
   * @param toolSnapshots Tool-level probe snapshots.
   * @param prefix Machine-readable reason prefix.
   * @returns Unique payload suffixes preserving original order.
   */
  private collectToolReasonPayloads(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
    prefix: string,
  ): string[] {
    const payloads: string[] = [];
    for (const snapshot of toolSnapshots) {
      for (const reason of snapshot.unavailableReasons) {
        if (!reason.startsWith(prefix)) {
          continue;
        }
        const payload = reason.slice(prefix.length);
        if (!payloads.includes(payload)) {
          payloads.push(payload);
        }
      }
    }
    return payloads;
  }

  /**
   * Resolves deterministic failure-attribution buckets from reasons and capability gaps.
   * @param options Unavailable reasons plus optional capability gaps.
   * @returns Ordered attribution categories without duplicates.
   */
  private resolveFailureAttributions(options: {
    unavailableReasons: string[];
    unsupportedCapabilities?: string[];
    degradedCapabilities?: string[];
  }): string[] {
    const attributions: string[] = [];

    const pushAttribution = (attribution: string): void => {
      if (!attributions.includes(attribution)) {
        attributions.push(attribution);
      }
    };

    if (
      (options.unsupportedCapabilities?.length ?? 0) > 0 ||
      (options.degradedCapabilities?.length ?? 0) > 0
    ) {
      pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.CAPABILITY_GAP);
    }

    for (const reason of options.unavailableReasons) {
      if (
        reason.startsWith("local_model_config_missing:") ||
        reason.startsWith("missing_role_binding:") ||
        reason.startsWith("disabled_by_config:") ||
        reason.startsWith("tool_disabled:")
      ) {
        pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.CONFIGURATION_MISSING);
        continue;
      }

      if (reason.startsWith("local_model_model_missing:")) {
        pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.MODEL_UNAVAILABLE);
        continue;
      }

      if (reason.startsWith("capability_gap:")) {
        pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.CAPABILITY_GAP);
        continue;
      }

      if (reason.startsWith("surface_unavailable:")) {
        if (reason.includes("local_model_config_missing:")) {
          pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.CONFIGURATION_MISSING);
        }
        if (reason.includes("local_model_model_missing:")) {
          pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.MODEL_UNAVAILABLE);
        }
        if (reason.includes("capability_gap:")) {
          pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.CAPABILITY_GAP);
        }
        pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.ENVIRONMENT_PRECONDITION);
        continue;
      }

      if (
        reason.startsWith("command_missing:") ||
        reason.startsWith("command_probe_failed:") ||
        reason.startsWith("probe_failed:") ||
        reason.startsWith("local_model_endpoint_unreachable:") ||
        reason.startsWith("local_model_probe_invalid_response:")
      ) {
        pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.ENVIRONMENT_PRECONDITION);
      }
    }

    return attributions;
  }

  /**
   * Resolves adapter tool-level check status from probe snapshot.
   * @param snapshot Adapter tool probe snapshot.
   * @returns Check status used by verification summary.
   */
  private resolveToolProbeCheckStatus(
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
   * Creates capability support lookup map from one probe result.
   * @param probeResult Adapter probe result.
   * @returns Capability -> support level lookup.
   */
  private createCapabilitySupportMap(
    probeResult: AgentProbeResult,
  ): Map<string, AgentCapabilitySupportLevel> {
    return new Map(
      probeResult.capabilityMatrix.capabilityStates.map((capabilityState) => [
        capabilityState.capability,
        capabilityState.supportLevel,
      ]),
    );
  }
}
