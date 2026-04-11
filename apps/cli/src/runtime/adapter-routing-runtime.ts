import {
  ClaudeCodeAgentAdapter,
  ClaudeCodeAgentAdapterExecutionMode,
  type ClaudeCodeExecRunner,
} from '@repo-ai-governor/adapter-claude-code';
import {
  CodexAgentAdapter,
  CodexAgentAdapterExecutionMode,
  type CodexExecRunner,
} from '@repo-ai-governor/adapter-codex';
import {
  GithubCopilotAgentAdapter,
  GithubCopilotAgentAdapterExecutionMode,
  type GithubCopilotExecRunner,
} from '@repo-ai-governor/adapter-github-copilot';
import { LocalModelAgentAdapter } from '@repo-ai-governor/adapter-local-model';
import {
  AgentAvailabilityStatus,
  AgentCapabilityEvaluator,
  type AgentProtocolContract,
  type AgentRestrictedNetworkFallbackContext,
  AgentSurfaceNetworkRequirement,
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig } from '@repo-ai-governor/config';
import {
  AdapterAvailability,
  AdapterSurface,
  AdapterTransportKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';

/**
 * Owns CLI-local adapter surface resolution, protocol construction, and restricted fallback wiring.
 */
export class CliAdapterRoutingRuntime {
  private static readonly sharedProtocolCacheByNamespace = new Map<
    string,
    Map<
      AdapterSurface,
      {
        fingerprint: string;
        protocol: AgentProtocolContract;
      }
    >
  >();

  private readonly protocolCacheBySurface = new Map<
    AdapterSurface,
    {
      fingerprint: string;
      protocol: AgentProtocolContract;
    }
  >();

  public constructor(
    private readonly adaptersConfig: AdaptersConfig,
    private readonly options: {
      claudeCodeExecRunner?: ClaudeCodeExecRunner;
      codexExecRunner?: CodexExecRunner;
      githubCopilotExecRunner?: GithubCopilotExecRunner;
      resolveCredentialRef?: (selector: string) => Promise<string | null>;
      sharedProtocolCacheNamespace?: string;
    } = {},
  ) {}

  /**
   * Creates protocol map for all tracked adapter surfaces using tool config overrides.
   * @param toolConfigBySurface Optional surface -> tool config lookup map.
   * @returns Surface -> protocol instance map.
   */
  public createProtocolBySurface(
    toolConfigBySurface: Map<
      AdapterSurface,
      NonNullable<AdaptersConfig['tools']>[number]
    > = this.createToolConfigBySurfaceMap(),
  ): Record<string, AgentProtocolContract> {
    const protocolBySurface: Record<string, AgentProtocolContract> = {};
    const surfaces = this.resolveTrackedAdapterSurfaces(toolConfigBySurface);
    const protocolCache = this.resolveProtocolCache();
    for (const surface of surfaces) {
      const toolConfig = toolConfigBySurface.get(surface);
      const enabled = toolConfig?.enabled ?? true;
      const configuredAvailability = enabled
        ? (toolConfig?.availability ?? null)
        : AdapterAvailability.UNAVAILABLE;
      const unavailableReasons = [...(toolConfig?.unavailableReasons ?? [])];
      if (!enabled) {
        unavailableReasons.push(`disabled_by_config:${surface}`);
      }
      const availabilityStatus = enabled
        ? this.resolveAdapterAvailabilityStatus(configuredAvailability)
        : AgentAvailabilityStatus.UNAVAILABLE;
      const adapterOptions = {
        availabilityStatus,
        unavailableReasons,
      };
      const fingerprint = this.createProtocolCacheFingerprint(surface, toolConfig, adapterOptions);
      const cachedProtocolEntry = protocolCache.get(surface);
      if (cachedProtocolEntry?.fingerprint === fingerprint) {
        protocolBySurface[surface] = cachedProtocolEntry.protocol;
        continue;
      }

      const protocol = this.createProtocolForSurface(surface, toolConfig, adapterOptions);
      protocolCache.set(surface, {
        fingerprint,
        protocol,
      });
      protocolBySurface[surface] = protocol;
    }

    return protocolBySurface;
  }

  /**
   * Builds one reusable tool-config lookup map from adapters config.
   * @returns Surface -> tool config lookup.
   */
  public createToolConfigBySurfaceMap(): Map<
    AdapterSurface,
    NonNullable<AdaptersConfig['tools']>[number]
  > {
    const toolConfigBySurface = new Map<
      AdapterSurface,
      NonNullable<AdaptersConfig['tools']>[number]
    >();
    for (const toolConfig of this.adaptersConfig.tools ?? []) {
      toolConfigBySurface.set(toolConfig.toolId, toolConfig);
    }
    return toolConfigBySurface;
  }

  /**
   * Resolves candidate surfaces for one role binding with local-model fallback appended.
   * @param roleBinding Role binding from adapters routing config.
   * @param toolConfigBySurface Tool config lookup map.
   * @param includeLocalModelFallbackCandidate Whether automatic local fallback should be appended.
   * @returns Ordered candidate surfaces shared by runtime and diagnostics.
   */
  public resolveRoleBindingCandidateSurfaces(
    roleBinding: AdaptersConfig['routing']['roleBindings'][string],
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
    includeLocalModelFallbackCandidate = true,
  ): AdapterSurface[] {
    const candidateSurfaces = [
      roleBinding.primarySurface,
      ...(roleBinding.fallbackSurfaces ?? []),
    ].filter((surface, index, list) => list.indexOf(surface) === index);
    const localModelFallbackSurface = includeLocalModelFallbackCandidate
      ? this.resolveLocalModelFallbackSurface(toolConfigBySurface)
      : null;
    if (localModelFallbackSurface && !candidateSurfaces.includes(localModelFallbackSurface)) {
      candidateSurfaces.push(localModelFallbackSurface);
    }
    return candidateSurfaces;
  }

  /**
   * Resolves whether local-model surface should participate as automatic fallback.
   * @param toolConfigBySurface Tool config lookup map.
   * @returns Local-model surface when enabled, otherwise `null`.
   */
  public resolveLocalModelFallbackSurface(
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
  ): AdapterSurface | null {
    const localModelToolConfig = toolConfigBySurface.get(AdapterSurface.OLLAMA);
    if (!localModelToolConfig || localModelToolConfig.enabled === false) {
      return null;
    }
    return AdapterSurface.OLLAMA;
  }

  /**
   * Creates one network-requirement map for route runner restricted-mode decisions.
   * @param toolConfigBySurface Tool config lookup map.
   * @returns Surface -> network requirement map.
   */
  public createSurfaceNetworkRequirementMap(
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
  ): Partial<Record<string, AgentSurfaceNetworkRequirement>> {
    const requirementBySurface: Partial<Record<string, AgentSurfaceNetworkRequirement>> = {};
    for (const surface of this.resolveTrackedAdapterSurfaces(toolConfigBySurface)) {
      requirementBySurface[surface] =
        surface === AdapterSurface.OLLAMA
          ? AgentSurfaceNetworkRequirement.LOCAL_ONLY
          : AgentSurfaceNetworkRequirement.EXTERNAL_NETWORK;
    }
    return requirementBySurface;
  }

  /**
   * Creates restricted-network fallback handler backed by the local-model adapter.
   * @param toolConfigBySurface Tool config lookup map.
   * @param protocolBySurface Protocol map already built for route runner.
   * @returns Restricted-network fallback handler when local-model tool is enabled.
   */
  public createRestrictedNetworkFallbackHandler(
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
    protocolBySurface: Record<string, AgentProtocolContract>,
  ):
    | {
        invokeFallback(
          context: AgentRestrictedNetworkFallbackContext,
        ): ReturnType<AgentProtocolContract['invokeStage']>;
      }
    | undefined {
    const localModelFallbackSurface = this.resolveLocalModelFallbackSurface(toolConfigBySurface);
    if (!localModelFallbackSurface) {
      return undefined;
    }
    const localModelProtocol = protocolBySurface[localModelFallbackSurface];
    if (!localModelProtocol) {
      return undefined;
    }
    const capabilityEvaluator = new AgentCapabilityEvaluator();
    return {
      invokeFallback: async (context: AgentRestrictedNetworkFallbackContext) => {
        const capabilityRequirement =
          context.request.capabilityRequirementOverride ??
          context.routePolicy.capabilityRequirement;
        const probeResult = await localModelProtocol.probe({
          routeKey: context.request.routeKey,
          ...(context.request.signal ? { signal: context.request.signal } : {}),
          ...(capabilityRequirement
            ? {
                requiredCapabilities: capabilityRequirement.requiredCapabilities,
              }
            : {}),
        });

        if (probeResult.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
          throw new RuntimeError(
            GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
            `Restricted network local fallback surface "${localModelFallbackSurface}" is unavailable for route "${context.request.routeKey}".`,
            {
              routeKey: context.request.routeKey,
              restrictedReason: context.reason,
              fallbackSurface: localModelFallbackSurface,
              unavailableReasons: probeResult.unavailableReasons,
            },
          );
        }

        if (capabilityRequirement) {
          const capabilityEvaluation = capabilityEvaluator.evaluate(
            probeResult.capabilityMatrix,
            capabilityRequirement,
          );
          if (!capabilityEvaluation.isSatisfied) {
            throw new RuntimeError(
              GovernorErrorCode.ADAPTER_ROUTE_CAPABILITY_UNSATISFIED,
              `Restricted network local fallback surface "${localModelFallbackSurface}" does not satisfy route "${context.request.routeKey}" capability requirement.`,
              {
                routeKey: context.request.routeKey,
                restrictedReason: context.reason,
                fallbackSurface: localModelFallbackSurface,
                unsupportedCapabilities: capabilityEvaluation.unsupportedCapabilities,
                degradedCapabilities: capabilityEvaluation.degradedCapabilities,
                requiredFallbackActions: capabilityEvaluation.requiredFallbackActions,
              },
            );
          }
        }

        return localModelProtocol.invokeStage(context.request);
      },
    };
  }

  /**
   * Resolves adapter surfaces that should be tracked by runtime diagnostics/routing.
   * @param toolConfigBySurface Optional tool config lookup map.
   * @returns Deduplicated surface list derived from routing/tool contracts.
   */
  public resolveTrackedAdapterSurfaces(
    toolConfigBySurface?: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
  ): AdapterSurface[] {
    const surfaceSet = new Set<AdapterSurface>();
    if (toolConfigBySurface) {
      for (const surface of toolConfigBySurface.keys()) {
        surfaceSet.add(surface);
      }
    }
    for (const roleBinding of Object.values(this.adaptersConfig.routing.roleBindings)) {
      surfaceSet.add(roleBinding.primarySurface);
      for (const fallbackSurface of roleBinding.fallbackSurfaces ?? []) {
        surfaceSet.add(fallbackSurface);
      }
    }

    if (surfaceSet.size > 0) {
      return Array.from(surfaceSet.values());
    }

    return [AdapterSurface.CODEX, AdapterSurface.GITHUB_COPILOT, AdapterSurface.CLAUDE_CODE];
  }

  /**
   * Converts optional config availability override into adapter-sdk availability enum.
   * @param availability Optional config-level availability override.
   * @returns Adapter availability status used by adapter constructor options.
   */
  private resolveAdapterAvailabilityStatus(
    availability: AdapterAvailability | null,
  ): AgentAvailabilityStatus {
    if (availability === AdapterAvailability.DEGRADED) {
      return AgentAvailabilityStatus.DEGRADED;
    }
    if (availability === AdapterAvailability.UNAVAILABLE) {
      return AgentAvailabilityStatus.UNAVAILABLE;
    }
    return AgentAvailabilityStatus.AVAILABLE;
  }

  private createProtocolForSurface(
    surface: AdapterSurface,
    toolConfig: NonNullable<AdaptersConfig['tools']>[number] | undefined,
    adapterOptions: {
      availabilityStatus: AgentAvailabilityStatus;
      unavailableReasons: string[];
    },
  ): AgentProtocolContract {
    const transportKind = this.resolveSurfaceTransportKind(surface, toolConfig);
    if (surface === AdapterSurface.CODEX) {
      return new CodexAgentAdapter({
        ...adapterOptions,
        executionMode: this.resolveCodexExecutionMode(transportKind),
        ...(toolConfig?.remoteApi
          ? {
              remoteApi: toolConfig.remoteApi,
            }
          : {}),
        ...(this.options.resolveCredentialRef
          ? {
              resolveCredentialRef: this.options.resolveCredentialRef,
            }
          : {}),
        ...(this.options.codexExecRunner
          ? {
              execRunner: this.options.codexExecRunner,
            }
          : {}),
      });
    }

    if (surface === AdapterSurface.GITHUB_COPILOT) {
      return new GithubCopilotAgentAdapter({
        ...adapterOptions,
        executionMode:
          transportKind === AdapterTransportKind.BASELINE
            ? GithubCopilotAgentAdapterExecutionMode.BASELINE
            : GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
        ...(this.options.githubCopilotExecRunner
          ? {
              execRunner: this.options.githubCopilotExecRunner,
            }
          : {}),
      });
    }

    if (surface === AdapterSurface.CLAUDE_CODE) {
      return new ClaudeCodeAgentAdapter({
        ...adapterOptions,
        executionMode: this.resolveClaudeCodeExecutionMode(transportKind),
        ...(toolConfig?.remoteApi
          ? {
              remoteApi: toolConfig.remoteApi,
            }
          : {}),
        ...(this.options.resolveCredentialRef
          ? {
              resolveCredentialRef: this.options.resolveCredentialRef,
            }
          : {}),
        ...(this.options.claudeCodeExecRunner
          ? {
              execRunner: this.options.claudeCodeExecRunner,
            }
          : {}),
      });
    }

    return new LocalModelAgentAdapter({
      ...adapterOptions,
      ...(toolConfig?.localModel
        ? {
            localModel: toolConfig.localModel,
          }
        : {}),
    });
  }

  private createProtocolCacheFingerprint(
    surface: AdapterSurface,
    toolConfig: NonNullable<AdaptersConfig['tools']>[number] | undefined,
    adapterOptions: {
      availabilityStatus: AgentAvailabilityStatus;
      unavailableReasons: string[];
    },
  ): string {
    return JSON.stringify({
      surface,
      enabled: toolConfig?.enabled ?? true,
      configuredAvailability: toolConfig?.availability ?? null,
      availabilityStatus: adapterOptions.availabilityStatus,
      unavailableReasons: [...adapterOptions.unavailableReasons].sort(),
      transportKind: this.resolveSurfaceTransportKind(surface, toolConfig),
      remoteApi: toolConfig?.remoteApi ?? null,
      localModel: toolConfig?.localModel ?? null,
    });
  }

  private resolveSurfaceTransportKind(
    surface: AdapterSurface,
    toolConfig: NonNullable<AdaptersConfig['tools']>[number] | undefined,
  ): AdapterTransportKind {
    if (toolConfig?.transport) {
      return toolConfig.transport;
    }
    if (toolConfig?.remoteApi) {
      return AdapterTransportKind.REMOTE_API;
    }
    if (surface === AdapterSurface.CODEX || surface === AdapterSurface.GITHUB_COPILOT) {
      return AdapterTransportKind.CLI_EXEC;
    }
    if (surface === AdapterSurface.CLAUDE_CODE) {
      return AdapterTransportKind.CLI_EXEC;
    }
    return AdapterTransportKind.BASELINE;
  }

  private resolveCodexExecutionMode(
    transportKind: AdapterTransportKind,
  ): CodexAgentAdapterExecutionMode {
    if (transportKind === AdapterTransportKind.BASELINE) {
      return CodexAgentAdapterExecutionMode.BASELINE;
    }
    if (transportKind === AdapterTransportKind.REMOTE_API) {
      return CodexAgentAdapterExecutionMode.REMOTE_API;
    }
    return CodexAgentAdapterExecutionMode.CLI_EXEC;
  }

  private resolveClaudeCodeExecutionMode(
    transportKind: AdapterTransportKind,
  ): ClaudeCodeAgentAdapterExecutionMode {
    if (transportKind === AdapterTransportKind.BASELINE) {
      return ClaudeCodeAgentAdapterExecutionMode.BASELINE;
    }
    if (transportKind === AdapterTransportKind.REMOTE_API) {
      return ClaudeCodeAgentAdapterExecutionMode.REMOTE_API;
    }
    return ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC;
  }

  private resolveProtocolCache(): Map<
    AdapterSurface,
    {
      fingerprint: string;
      protocol: AgentProtocolContract;
    }
  > {
    const namespace = this.options.sharedProtocolCacheNamespace?.trim();
    if (!namespace) {
      return this.protocolCacheBySurface;
    }

    let sharedCache = CliAdapterRoutingRuntime.sharedProtocolCacheByNamespace.get(namespace);
    if (!sharedCache) {
      sharedCache = new Map();
      CliAdapterRoutingRuntime.sharedProtocolCacheByNamespace.set(namespace, sharedCache);
    }
    return sharedCache;
  }
}
