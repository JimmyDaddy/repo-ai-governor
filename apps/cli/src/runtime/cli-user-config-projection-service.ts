import type { AdapterToolConfig, GovernorConfig } from '@repo-ai-governor/config';
import {
  AdapterAvailability,
  AdapterSurface,
  AdapterTransportKind,
  type AdapterVendorBindingKind,
} from '@repo-ai-governor/shared';
import type {
  CliUserConfigRemoteApiAuthoringRecord,
  CliUserConfigToolRecord,
} from '../types/interfaces/cli-user-config.interface.js';
import { CliRemoteApiAuthoringDefaultsService } from './cli-remote-api-authoring-defaults-service.js';
import { CliUserConfigService } from './cli-user-config-service.js';

interface CliUserConfigProjectionServiceDependencies {
  remoteApiAuthoringDefaultsService?: CliRemoteApiAuthoringDefaultsService;
  userConfigService?: CliUserConfigService;
}

/**
 * Owns user-local authoring normalization so runtime consumers can read canonical adapters config
 * without treating raw `user-config.yaml` paths as a second source of truth.
 */
export class CliUserConfigProjectionService {
  private readonly remoteApiAuthoringDefaultsService: CliRemoteApiAuthoringDefaultsService;
  private readonly userConfigService: CliUserConfigService;

  public constructor(dependencies: CliUserConfigProjectionServiceDependencies = {}) {
    this.remoteApiAuthoringDefaultsService =
      dependencies.remoteApiAuthoringDefaultsService ?? new CliRemoteApiAuthoringDefaultsService();
    this.userConfigService = dependencies.userConfigService ?? new CliUserConfigService();
  }

  /**
   * Applies user-local defaults as lowest-precedence adapter truth without mutating the source
   * config object or promoting raw authoring paths into command payloads.
   * @param options Source config plus optional environment override.
   * @returns Cloned governor config with user-local adapter defaults materialized where safe.
   */
  public applyUserLocalDefaults(options: {
    config: GovernorConfig;
    environment?: NodeJS.ProcessEnv;
  }): GovernorConfig {
    const nextConfig = structuredClone(options.config);
    const userConfigDocument = this.userConfigService.loadConfig({
      environment: options.environment,
    });
    if (!nextConfig.adapters || !userConfigDocument.tools) {
      return nextConfig;
    }

    const currentTools = nextConfig.adapters.tools ?? [];
    const toolById = new Map<AdapterSurface, AdapterToolConfig>(
      currentTools.map((tool) => [tool.toolId, this.cloneToolConfig(tool)]),
    );

    for (const [rawToolId, toolDefaults] of Object.entries(userConfigDocument.tools)) {
      if (!toolDefaults) {
        continue;
      }
      const toolId = this.resolveToolId(rawToolId);
      if (!toolId) {
        continue;
      }
      const currentTool = toolById.get(toolId) ?? this.createDefaultToolConfig(toolId);
      const projectedTool = this.projectToolDefaults({
        toolId,
        currentTool,
        toolDefaults,
      });
      toolById.set(toolId, projectedTool);
    }

    nextConfig.adapters.tools = Array.from(toolById.values());
    return nextConfig;
  }

  private resolveToolId(rawToolId: string): AdapterSurface | null {
    const normalizedToolId = rawToolId.trim();
    if (!Object.values(AdapterSurface).includes(normalizedToolId as AdapterSurface)) {
      return null;
    }
    return normalizedToolId as AdapterSurface;
  }

  private createDefaultToolConfig(toolId: AdapterSurface): AdapterToolConfig {
    return {
      toolId,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
    };
  }

  private cloneToolConfig(tool: AdapterToolConfig): AdapterToolConfig {
    return {
      ...tool,
      ...(tool.unavailableReasons ? { unavailableReasons: [...tool.unavailableReasons] } : {}),
      ...(tool.remoteApi ? { remoteApi: { ...tool.remoteApi } } : {}),
      ...(tool.localModel ? { localModel: { ...tool.localModel } } : {}),
    };
  }

  private projectToolDefaults(options: {
    toolId: AdapterSurface | null;
    currentTool: AdapterToolConfig;
    toolDefaults: CliUserConfigToolRecord;
  }): AdapterToolConfig {
    if (!options.toolId) {
      return options.currentTool;
    }

    const projectedTool = this.cloneToolConfig(options.currentTool);
    const projectedRemoteApi = this.projectRemoteApiDefaults({
      toolId: options.toolId,
      currentTool: projectedTool,
      userRemoteApiDefaults: options.toolDefaults.remoteApi,
    });
    if (projectedRemoteApi) {
      projectedTool.remoteApi = projectedRemoteApi;
    }

    if (
      !projectedTool.transport &&
      options.toolDefaults.transport &&
      (options.toolDefaults.transport !== AdapterTransportKind.REMOTE_API || projectedRemoteApi)
    ) {
      projectedTool.transport = options.toolDefaults.transport;
    }

    return projectedTool;
  }

  private projectRemoteApiDefaults(options: {
    toolId: AdapterSurface;
    currentTool: AdapterToolConfig;
    userRemoteApiDefaults?: CliUserConfigRemoteApiAuthoringRecord;
  }) {
    const currentRemoteApi = options.currentTool.remoteApi
      ? { ...options.currentTool.remoteApi }
      : null;
    const userRemoteApiDefaults = options.userRemoteApiDefaults;
    if (!currentRemoteApi && !userRemoteApiDefaults) {
      return null;
    }

    const model = currentRemoteApi?.model ?? userRemoteApiDefaults?.model ?? null;
    if (!model) {
      return currentRemoteApi;
    }

    const provider =
      currentRemoteApi?.provider ??
      userRemoteApiDefaults?.provider ??
      this.remoteApiAuthoringDefaultsService.resolveProviderForTool(options.toolId);
    const vendorBinding =
      currentRemoteApi?.vendorBinding ??
      userRemoteApiDefaults?.vendorBinding ??
      this.resolveVendorBinding(options.toolId, userRemoteApiDefaults?.vendorBinding);

    return {
      provider,
      vendorBinding,
      model,
      credentialEnvVar:
        currentRemoteApi?.credentialEnvVar ??
        userRemoteApiDefaults?.credentialEnvVar ??
        this.resolveCredentialEnvVar(options.toolId),
      credentialRef:
        currentRemoteApi?.credentialRef ?? userRemoteApiDefaults?.credentialRef ?? undefined,
      ...(currentRemoteApi?.allowProviderLocalConfig !== undefined
        ? { allowProviderLocalConfig: currentRemoteApi.allowProviderLocalConfig }
        : {}),
      endpoint: currentRemoteApi?.endpoint ?? userRemoteApiDefaults?.endpoint ?? undefined,
      ...(currentRemoteApi?.requestTimeoutMs !== undefined
        ? { requestTimeoutMs: currentRemoteApi.requestTimeoutMs }
        : {}),
      ...(currentRemoteApi?.maxRetries !== undefined
        ? { maxRetries: currentRemoteApi.maxRetries }
        : {}),
    };
  }

  private resolveVendorBinding(
    toolId: AdapterSurface,
    vendorBinding: AdapterVendorBindingKind | undefined,
  ): AdapterVendorBindingKind {
    if (vendorBinding) {
      return vendorBinding;
    }
    return this.remoteApiAuthoringDefaultsService.resolveVendorBindingForTool(toolId);
  }

  private resolveCredentialEnvVar(toolId: AdapterSurface): string | undefined {
    try {
      return this.remoteApiAuthoringDefaultsService.resolveCredentialEnvVarForTool(toolId);
    } catch {
      return undefined;
    }
  }
}
