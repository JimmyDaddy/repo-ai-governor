import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { AgentAvailabilityStatus } from "@repo-ai-governor/adapter-sdk";
import type { AdaptersConfig } from "@repo-ai-governor/config";
import { AdapterSurface, LocalModelProvider } from "@repo-ai-governor/shared";
import type {
  CliLocalAdapterProbeOverride,
  CliLocalAdapterProbeResolution,
} from "../types/index.js";

const execFileAsync = promisify(execFile);
const CLI_ADAPTER_LOCAL_PROBE_TIMEOUT_MS = 5000;
const CLI_ADAPTER_LOCAL_PROBE_MAX_BUFFER_BYTES = 65536;
const CLI_CLAUDE_CODE_COMMAND_CANDIDATES = [
  {
    command: "claude",
    args: ["--version"],
  },
  {
    command: "claude-code",
    args: ["--version"],
  },
] as const;

/**
 * Encapsulates local command and endpoint readiness checks for adapter surfaces.
 */
export class CliLocalModelProbeRuntime {
  public constructor(
    private readonly adapterLocalProbeOverrides:
      | Partial<Record<AdapterSurface, CliLocalAdapterProbeOverride>>
      | undefined,
    private readonly commandProbeExecutor:
      | ((command: string, args: readonly string[]) => Promise<void>)
      | undefined,
    private readonly formatExecFailureDetail: (error: unknown) => string,
  ) {}

  /**
   * Probes local machine readiness for one adapter surface.
   * @param surface Adapter surface id.
   * @param toolConfig Optional tool config row.
   * @returns Runtime availability and reasons from local probe.
   */
  public async probeLocalAdapterAvailability(
    surface: AdapterSurface,
    toolConfig?: NonNullable<AdaptersConfig["tools"]>[number],
  ): Promise<CliLocalAdapterProbeResolution> {
    const overrideResolution = this.adapterLocalProbeOverrides?.[surface];
    if (overrideResolution) {
      return {
        availabilityStatus: overrideResolution.availabilityStatus,
        unavailableReasons: [...overrideResolution.unavailableReasons],
      };
    }

    if (surface === AdapterSurface.CODEX) {
      return this.probeSingleCommandAvailability(surface, "codex", ["--version"]);
    }

    if (surface === AdapterSurface.CLAUDE_CODE) {
      const unavailableReasons: string[] = [];
      for (const candidate of CLI_CLAUDE_CODE_COMMAND_CANDIDATES) {
        const probeResult = await this.probeSingleCommandAvailability(
          surface,
          candidate.command,
          candidate.args,
        );
        if (probeResult.availabilityStatus === AgentAvailabilityStatus.AVAILABLE) {
          return probeResult;
        }
        unavailableReasons.push(...probeResult.unavailableReasons);
      }
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: unavailableReasons.filter(
          (reason, index, list) => list.indexOf(reason) === index,
        ),
      };
    }

    if (surface === AdapterSurface.OLLAMA) {
      if (this.shouldTrustEndpointBackedLocalModelProbe(toolConfig)) {
        return {
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          unavailableReasons: [],
        };
      }
      return this.probeSingleCommandAvailability(surface, "ollama", ["--version"]);
    }

    const githubCliProbe = await this.probeSingleCommandAvailability(surface, "gh", ["--version"]);
    if (githubCliProbe.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return githubCliProbe;
    }

    return this.probeSingleCommandAvailability(surface, "gh", ["copilot", "--help"]);
  }

  /**
   * Validates runtime local-model config presence for one tracked adapter surface.
   * @param surface Adapter surface under inspection.
   * @param toolConfig Optional tool config row.
   * @returns Availability-style resolution for config completeness checks.
   */
  public resolveLocalModelConfigurationResolution(
    surface: AdapterSurface,
    toolConfig?: NonNullable<AdaptersConfig["tools"]>[number],
  ): CliLocalAdapterProbeResolution {
    if (surface !== AdapterSurface.OLLAMA) {
      return {
        availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        unavailableReasons: [],
      };
    }

    const missingKeys: string[] = [];
    const localModel = toolConfig?.localModel;
    if (!localModel) {
      missingKeys.push("provider", "endpoint", "model");
    } else {
      if (typeof localModel.provider !== "string" || localModel.provider.trim().length === 0) {
        missingKeys.push("provider");
      }
      if (typeof localModel.endpoint !== "string" || localModel.endpoint.trim().length === 0) {
        missingKeys.push("endpoint");
      }
      if (typeof localModel.model !== "string" || localModel.model.trim().length === 0) {
        missingKeys.push("model");
      }
    }

    if (missingKeys.length === 0) {
      return {
        availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        unavailableReasons: [],
      };
    }

    return {
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      unavailableReasons: [
        `local_model_config_missing:${surface}:${missingKeys.filter((key, index, list) => list.indexOf(key) === index).join("|")}`,
      ],
    };
  }

  /**
   * Merges pre-flight config validation with async local probe execution.
   * @param baseResolution Synchronous resolution from config checks.
   * @param probePromise Async runtime probe promise.
   * @returns Merged local-probe availability.
   */
  public async mergeLocalProbeResolutions(
    baseResolution: CliLocalAdapterProbeResolution,
    probePromise: Promise<CliLocalAdapterProbeResolution>,
  ): Promise<CliLocalAdapterProbeResolution> {
    const probeResolution = await probePromise;
    return {
      availabilityStatus: this.mergeAvailabilityStatus(
        baseResolution.availabilityStatus,
        probeResolution.availabilityStatus,
      ),
      unavailableReasons: [
        ...baseResolution.unavailableReasons,
        ...probeResolution.unavailableReasons,
      ].filter((reason, index, list) => list.indexOf(reason) === index),
    };
  }

  /**
   * Merges adapter-protocol status with local command probe status.
   * @param protocolStatus Availability resolved by adapter protocol probe.
   * @param localStatus Availability resolved by local command probe.
   * @returns Merged availability status.
   */
  public mergeAvailabilityStatus(
    protocolStatus: AgentAvailabilityStatus,
    localStatus: AgentAvailabilityStatus,
  ): AgentAvailabilityStatus {
    if (
      protocolStatus === AgentAvailabilityStatus.UNAVAILABLE ||
      localStatus === AgentAvailabilityStatus.UNAVAILABLE
    ) {
      return AgentAvailabilityStatus.UNAVAILABLE;
    }
    if (
      protocolStatus === AgentAvailabilityStatus.DEGRADED ||
      localStatus === AgentAvailabilityStatus.DEGRADED
    ) {
      return AgentAvailabilityStatus.DEGRADED;
    }
    return AgentAvailabilityStatus.AVAILABLE;
  }

  /**
   * Executes one command probe and translates process result into availability status.
   * @param surface Adapter surface that owns this probe.
   * @param command Command name.
   * @param args Command arguments.
   * @returns Probe resolution for this command.
   */
  private async probeSingleCommandAvailability(
    surface: AdapterSurface,
    command: string,
    args: readonly string[],
  ): Promise<CliLocalAdapterProbeResolution> {
    try {
      if (this.commandProbeExecutor) {
        await this.commandProbeExecutor(command, args);
      } else {
        await execFileAsync(command, [...args], {
          timeout: CLI_ADAPTER_LOCAL_PROBE_TIMEOUT_MS,
          maxBuffer: CLI_ADAPTER_LOCAL_PROBE_MAX_BUFFER_BYTES,
        });
      }
      return {
        availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        unavailableReasons: [],
      };
    } catch (error) {
      if (this.isMissingCommandFailure(error)) {
        return {
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [`command_missing:${surface}:${command}`],
        };
      }
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: [
          `command_probe_failed:${surface}:${command}:${this.formatExecFailureDetail(error)}`,
        ],
      };
    }
  }

  /**
   * Resolves whether an Ollama-like tool row should trust endpoint health over local binary presence.
   * @param toolConfig Optional adapter tool config row.
   * @returns `true` when endpoint-backed local-model config is present.
   */
  private shouldTrustEndpointBackedLocalModelProbe(
    toolConfig?: NonNullable<AdaptersConfig["tools"]>[number],
  ): boolean {
    const localModel = toolConfig?.localModel;
    return (
      toolConfig?.toolId === AdapterSurface.OLLAMA &&
      localModel?.provider === LocalModelProvider.OLLAMA &&
      typeof localModel.endpoint === "string" &&
      localModel.endpoint.trim().length > 0 &&
      typeof localModel.model === "string" &&
      localModel.model.trim().length > 0
    );
  }

  /**
   * Checks whether one command-probe failure indicates executable-not-found.
   * @param error Unknown probe failure.
   * @returns True when process failed because command is missing.
   */
  private isMissingCommandFailure(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }
    const errorCode = (error as { code?: unknown }).code;
    return errorCode === "ENOENT";
  }
}
