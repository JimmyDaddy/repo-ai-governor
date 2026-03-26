import { isAbsolute, resolve } from "node:path";

import type { MemoryStoreProvider } from "@repo-ai-governor/memory-store-adapter";
import { GovernorErrorCode, RuntimeError, standardizeError } from "@repo-ai-governor/shared";
import type { MemoryRuntimeConfig, MemoryStoreEngine } from "@repo-ai-governor/shared";
import {
  BUILT_IN_MEMORY_PROVIDER_DESCRIPTORS,
  DEFAULT_MEMORY_PROVIDER_PLUGIN_EXPORT_NAME,
  DEFAULT_MEMORY_PROVIDER_PLUGIN_POLICY,
  MEMORY_STORE_ENGINE_TO_BUILT_IN_PROVIDER_ID,
  MemoryProviderDescriptorKind,
  MemoryProviderDistributionMode,
  MemoryProviderHostSurface,
  MemoryProviderPluginResolutionPolicyKind,
  MemoryProviderPluginSpecifierKind,
  MemoryProviderResolutionSource,
  MemoryProviderRuntimeMode,
} from "./constants/index.js";
import type {
  MemoryProviderBuiltInDescriptor,
  MemoryProviderCompositionSummary,
  MemoryProviderConstructor,
  MemoryProviderPluginDescriptor,
  MemoryProviderPluginFactory,
  MemoryProviderPluginPolicy,
  MemoryProviderRegistryLoadRequest,
  MemoryProviderRegistryLoadResult,
  MemoryProviderRegistryOptions,
  MemoryProviderRegistryResolutionResult,
  MemoryProviderResolvedDescriptor,
} from "./types/index.js";

/**
 * Resolves built-in memory provider descriptors and lazily loads provider instances.
 *
 * Why this exists:
 * CLI and future service hosts should share one provider-selection contract instead
 * of embedding provider package knowledge directly in entrypoint code.
 */
export class MemoryProviderRegistry {
  private readonly builtInDescriptors: readonly MemoryProviderBuiltInDescriptor[];
  private readonly moduleLoader: (specifier: string) => Promise<Record<string, unknown>>;
  private readonly pluginPolicy: MemoryProviderPluginPolicy;

  /**
   * Creates a registry with built-in descriptors and an overridable module loader seam.
   * @param options Optional registry overrides for tests or follow-up plugin expansion.
   */
  public constructor(options: MemoryProviderRegistryOptions = {}) {
    this.builtInDescriptors = options.builtInDescriptors ?? BUILT_IN_MEMORY_PROVIDER_DESCRIPTORS;
    this.moduleLoader = options.moduleLoader ?? this.loadModule;
    this.pluginPolicy = {
      allowedModules: [
        ...(options.pluginPolicy?.allowedModules ??
          DEFAULT_MEMORY_PROVIDER_PLUGIN_POLICY.allowedModules),
      ],
      allowedPackagePrefixes: [
        ...(options.pluginPolicy?.allowedPackagePrefixes ??
          DEFAULT_MEMORY_PROVIDER_PLUGIN_POLICY.allowedPackagePrefixes),
      ],
      allowWorkspaceRelativeModules:
        options.pluginPolicy?.allowWorkspaceRelativeModules ??
        DEFAULT_MEMORY_PROVIDER_PLUGIN_POLICY.allowWorkspaceRelativeModules,
    };
  }

  /**
   * Returns built-in descriptors frozen by the current registry instance.
   * @returns Built-in provider descriptor list.
   */
  public getBuiltInDescriptors(): readonly MemoryProviderBuiltInDescriptor[] {
    return this.builtInDescriptors.map((descriptor) => ({
      ...descriptor,
      supportedStoreEngines: [...descriptor.supportedStoreEngines],
    }));
  }

  /**
   * Returns the plugin-policy baseline frozen by the current registry instance.
   * @returns Plugin allowlist and path-policy contract.
   */
  public getPluginPolicy(): MemoryProviderPluginPolicy {
    return {
      allowedModules: [...this.pluginPolicy.allowedModules],
      allowedPackagePrefixes: [...this.pluginPolicy.allowedPackagePrefixes],
      allowWorkspaceRelativeModules: this.pluginPolicy.allowWorkspaceRelativeModules,
    };
  }

  /**
   * Resolves the built-in descriptor that matches one legacy memory runtime config.
   * @param memoryConfig Memory runtime config supplied by config/profile resolution.
   * @returns Matching built-in descriptor.
   */
  public resolveBuiltInDescriptor(
    memoryConfig: MemoryRuntimeConfig,
  ): MemoryProviderBuiltInDescriptor {
    if (memoryConfig.provider?.module) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
        `External memory provider module "${memoryConfig.provider.module}" is not enabled in the built-in registry baseline. Use resolvePluginDescriptor()/loadPluginProvider() with an allowlisted package specifier instead.`,
        {
          providerModule: memoryConfig.provider.module,
          providerExportName: memoryConfig.provider.exportName ?? null,
        },
      );
    }

    if (memoryConfig.provider?.id) {
      const descriptor = this.builtInDescriptors.find(
        (candidate) => candidate.id === memoryConfig.provider?.id,
      );
      if (!descriptor) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_STORE_PROVIDER_NOT_FOUND,
          `No built-in memory provider descriptor matches provider.id "${memoryConfig.provider.id}".`,
          {
            providerId: memoryConfig.provider.id,
          },
        );
      }

      if (!descriptor.supportedStoreEngines.includes(memoryConfig.storeEngine)) {
        this.throwStoreEngineConflict(descriptor.id, memoryConfig.storeEngine);
      }

      return descriptor;
    }

    const builtInProviderId = MEMORY_STORE_ENGINE_TO_BUILT_IN_PROVIDER_ID[memoryConfig.storeEngine];
    const descriptor = this.builtInDescriptors.find(
      (candidate) => candidate.id === builtInProviderId,
    );
    if (descriptor) {
      return descriptor;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_STORE_PROVIDER_NOT_FOUND,
      `No built-in memory provider descriptor matches storeEngine "${memoryConfig.storeEngine}".`,
      {
        storeEngine: memoryConfig.storeEngine,
      },
    );
  }

  /**
   * Resolves one allowlisted plugin descriptor from `memory.provider.module`.
   * @param memoryConfig Memory runtime config supplied by config/profile resolution.
   * @returns Plugin descriptor admitted by current allowlist/prefix policy.
   */
  public resolvePluginDescriptor(
    memoryConfig: MemoryRuntimeConfig,
  ): MemoryProviderPluginDescriptor {
    const moduleSpecifier = memoryConfig.provider?.module;
    if (!moduleSpecifier) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_PROVIDER_NOT_FOUND,
        "No memory.provider.module is configured for plugin resolution.",
        {
          storeEngine: memoryConfig.storeEngine,
        },
      );
    }

    const specifierKind = this.resolvePluginSpecifierKind(moduleSpecifier);
    if (
      specifierKind === MemoryProviderPluginSpecifierKind.FILE_URL ||
      specifierKind === MemoryProviderPluginSpecifierKind.ABSOLUTE_PATH
    ) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
        `Plugin memory provider module "${moduleSpecifier}" is blocked. Only allowlisted bare package specifiers are enabled in the current plugin baseline.`,
        {
          providerModule: moduleSpecifier,
          specifierKind,
        },
      );
    }

    if (specifierKind === MemoryProviderPluginSpecifierKind.RELATIVE_PATH) {
      if (!this.pluginPolicy.allowWorkspaceRelativeModules) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
          `Workspace-relative memory provider module "${moduleSpecifier}" is not enabled in the current plugin baseline.`,
          {
            providerModule: moduleSpecifier,
            specifierKind,
          },
        );
      }

      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
        `Workspace-relative memory provider module "${moduleSpecifier}" is reserved for a future path-policy sprint and is not yet supported.`,
        {
          providerModule: moduleSpecifier,
          specifierKind,
        },
      );
    }

    const resolutionPolicyKind = this.resolvePluginResolutionPolicyKind(moduleSpecifier);
    if (!resolutionPolicyKind) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_PROVIDER_NOT_FOUND,
        `Plugin memory provider module "${moduleSpecifier}" is not allowlisted by the current package allowlist/prefix policy.`,
        {
          providerModule: moduleSpecifier,
          allowedModules: [...this.pluginPolicy.allowedModules],
          allowedPackagePrefixes: [...this.pluginPolicy.allowedPackagePrefixes],
        },
      );
    }

    return {
      id: moduleSpecifier,
      kind: MemoryProviderDescriptorKind.PLUGIN,
      distributionMode: MemoryProviderDistributionMode.OPTIONAL,
      moduleSpecifier,
      exportName: memoryConfig.provider?.exportName ?? DEFAULT_MEMORY_PROVIDER_PLUGIN_EXPORT_NAME,
      providerName: memoryConfig.provider?.id ?? moduleSpecifier,
      specifierKind,
      resolutionPolicyKind,
      supportedStoreEngines: [memoryConfig.storeEngine],
    };
  }

  /**
   * Resolves one provider descriptor using built-in fallbacks first, then plugin policy.
   * @param memoryConfig Memory runtime config supplied by config/profile resolution.
   * @returns Resolved descriptor and the source used to select it.
   */
  public resolveDescriptor(
    memoryConfig: MemoryRuntimeConfig,
  ): MemoryProviderRegistryResolutionResult {
    if (memoryConfig.provider?.module) {
      return {
        descriptor: this.resolvePluginDescriptor(memoryConfig),
        resolutionSource: MemoryProviderResolutionSource.PLUGIN_MODULE,
      };
    }

    if (memoryConfig.provider?.id) {
      return {
        descriptor: this.resolveBuiltInDescriptor(memoryConfig),
        resolutionSource: MemoryProviderResolutionSource.BUILT_IN_ID,
      };
    }

    return {
      descriptor: this.resolveBuiltInDescriptor(memoryConfig),
      resolutionSource: MemoryProviderResolutionSource.LEGACY_STORE_ENGINE,
    };
  }

  /**
   * Loads one built-in provider instance from resolved memory runtime config.
   * @param request Provider-load request from CLI or service host.
   * @returns Resolved provider composition metadata.
   */
  public async loadProvider(
    request: MemoryProviderRegistryLoadRequest,
  ): Promise<MemoryProviderRegistryLoadResult> {
    const resolution = this.resolveDescriptor(request.memoryConfig);
    return this.loadResolvedProvider(resolution.descriptor, resolution.resolutionSource, request);
  }

  /**
   * Loads one allowlisted plugin provider instance using the frozen plugin contract.
   * @param request Provider-load request from CLI or service host.
   * @returns Resolved provider composition metadata.
   */
  public async loadPluginProvider(
    request: MemoryProviderRegistryLoadRequest,
  ): Promise<MemoryProviderRegistryLoadResult> {
    const descriptor = this.resolvePluginDescriptor(request.memoryConfig);
    return this.loadResolvedProvider(
      descriptor,
      MemoryProviderResolutionSource.PLUGIN_MODULE,
      request,
    );
  }

  /**
   * Loads one provider instance after descriptor resolution has completed.
   * @param descriptor Built-in or plugin descriptor.
   * @param resolutionSource Source used to select the descriptor.
   * @param request Provider-load request from CLI or service host.
   * @returns Resolved provider composition metadata.
   */
  private async loadResolvedProvider(
    descriptor: MemoryProviderResolvedDescriptor,
    resolutionSource: MemoryProviderResolutionSource,
    request: MemoryProviderRegistryLoadRequest,
  ): Promise<MemoryProviderRegistryLoadResult> {
    const memoryStoreRoot = this.resolveMemoryStoreRoot(
      request.workspaceRoot,
      request.memoryConfig.storeRoot,
    );

    let providerModule: Record<string, unknown>;
    try {
      providerModule = await this.moduleLoader(this.resolveModuleSpecifier(descriptor));
    } catch (error) {
      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
        `Failed to load memory provider module "${this.resolveModuleSpecifier(descriptor)}": ${standardizedError.message}${this.resolveDistributionFailureHint(descriptor)}`,
        {
          providerId: descriptor.id,
          moduleSpecifier: this.resolveModuleSpecifier(descriptor),
          distributionMode: descriptor.distributionMode,
          descriptorKind: descriptor.kind,
        },
        error,
      );
    }

    const hostSurface = request.hostSurface ?? MemoryProviderHostSurface.CLI;
    const runtimeMode = request.runtimeMode ?? MemoryProviderRuntimeMode.EMBEDDED;
    const provider = await this.initializeProvider(
      providerModule,
      descriptor,
      request.workspaceRoot,
      memoryStoreRoot,
      hostSurface,
      runtimeMode,
      request.memoryConfig.provider?.options ?? {},
    );

    this.assertProviderContract(provider, descriptor);

    return {
      descriptor,
      resolutionSource,
      memoryStoreRoot,
      providerName: descriptor.providerName,
      hostSurface,
      runtimeMode,
      summary: this.createCompositionSummary(
        request.memoryConfig,
        descriptor,
        resolutionSource,
        memoryStoreRoot,
        hostSurface,
        runtimeMode,
      ),
      provider,
    };
  }

  /**
   * Builds one stable diagnostics summary shared by CLI and orchestration-service hosts.
   * @param memoryConfig Validated memory runtime config.
   * @param descriptor Resolved descriptor used for provider loading.
   * @param resolutionSource Source used to select the descriptor.
   * @param memoryStoreRoot Resolved absolute store root.
   * @param hostSurface Host surface requesting provider loading.
   * @param runtimeMode Runtime mode requesting provider loading.
   * @returns Stable provider-composition summary.
   */
  private createCompositionSummary(
    memoryConfig: MemoryRuntimeConfig,
    descriptor: MemoryProviderResolvedDescriptor,
    resolutionSource: MemoryProviderResolutionSource,
    memoryStoreRoot: string,
    hostSurface: MemoryProviderHostSurface,
    runtimeMode: MemoryProviderRuntimeMode,
  ): MemoryProviderCompositionSummary {
    return {
      memoryStoreEngine: memoryConfig.storeEngine,
      memoryStoreRoot,
      memoryStoreProvider: descriptor.providerName,
      memoryStoreProviderId: descriptor.id,
      ...(descriptor.kind === MemoryProviderDescriptorKind.PLUGIN
        ? {
            memoryStoreProviderModule: descriptor.moduleSpecifier,
          }
        : {}),
      memoryStoreDistributionMode: descriptor.distributionMode,
      memoryStoreResolutionSource: resolutionSource,
      memoryStoreHostSurface: hostSurface,
      memoryStoreRuntimeMode: runtimeMode,
    };
  }

  /**
   * Dynamically loads one built-in provider module by package name.
   * @param specifier Provider package specifier.
   * @returns Imported ESM module namespace.
   */
  private async loadModule(specifier: string): Promise<Record<string, unknown>> {
    // dynamic-import-allowed: memory provider registry lazily loads built-in provider packages.
    return (await import(specifier)) as Record<string, unknown>;
  }

  /**
   * Resolves one provider constructor export and validates that it is constructable.
   * @param providerModule Imported provider module namespace.
   * @param descriptor Built-in provider descriptor.
   * @returns Provider constructor.
   */
  private resolveProviderConstructor(
    providerModule: Record<string, unknown>,
    descriptor: MemoryProviderBuiltInDescriptor,
  ): MemoryProviderConstructor {
    const candidate = providerModule[descriptor.exportName];
    if (typeof candidate === "function") {
      return candidate as MemoryProviderConstructor;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_STORE_PROVIDER_EXPORT_INVALID,
      `Memory provider export "${descriptor.exportName}" is missing or invalid in "${descriptor.packageName}".`,
      {
        providerId: descriptor.id,
        packageName: descriptor.packageName,
        exportName: descriptor.exportName,
      },
    );
  }

  /**
   * Resolves one plugin factory export and validates the callable contract.
   * @param providerModule Imported provider module namespace.
   * @param descriptor Plugin descriptor derived from runtime config.
   * @returns Plugin factory callable.
   */
  private resolvePluginFactory(
    providerModule: Record<string, unknown>,
    descriptor: MemoryProviderPluginDescriptor,
  ): MemoryProviderPluginFactory {
    const candidate = providerModule[descriptor.exportName];
    if (typeof candidate === "function") {
      return candidate as MemoryProviderPluginFactory;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_STORE_PROVIDER_EXPORT_INVALID,
      `Memory provider export "${descriptor.exportName}" is missing or invalid in "${descriptor.moduleSpecifier}".`,
      {
        providerId: descriptor.id,
        moduleSpecifier: descriptor.moduleSpecifier,
        exportName: descriptor.exportName,
      },
    );
  }

  /**
   * Initializes one resolved provider instance from built-in or plugin module exports.
   * @param providerModule Imported provider module namespace.
   * @param descriptor Resolved provider descriptor.
   * @param workspaceRoot Resolved workspace root.
   * @param memoryStoreRoot Resolved memory store root.
   * @param hostSurface Host surface requesting provider loading.
   * @param runtimeMode Runtime mode requesting provider loading.
   * @param providerOptions Optional provider options supplied from config.
   * @returns Constructed provider instance.
   */
  private async initializeProvider(
    providerModule: Record<string, unknown>,
    descriptor: MemoryProviderResolvedDescriptor,
    workspaceRoot: string,
    memoryStoreRoot: string,
    hostSurface: MemoryProviderHostSurface,
    runtimeMode: MemoryProviderRuntimeMode,
    providerOptions: Record<string, unknown>,
  ): Promise<MemoryStoreProvider> {
    try {
      if (descriptor.kind === MemoryProviderDescriptorKind.BUILT_IN) {
        const providerConstructor = this.resolveProviderConstructor(providerModule, descriptor);
        return new providerConstructor({
          rootDirectory: memoryStoreRoot,
        });
      }

      const pluginFactory = this.resolvePluginFactory(providerModule, descriptor);
      return await pluginFactory({
        workspaceRoot,
        memoryStoreRoot,
        providerOptions: { ...providerOptions },
        hostSurface,
        runtimeMode,
      });
    } catch (error) {
      if (
        error instanceof RuntimeError &&
        error.code === GovernorErrorCode.MEMORY_STORE_PROVIDER_EXPORT_INVALID
      ) {
        throw error;
      }

      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
        `Failed to initialize memory provider "${descriptor.providerName}": ${standardizedError.message}`,
        {
          providerId: descriptor.id,
          moduleSpecifier: this.resolveModuleSpecifier(descriptor),
          exportName: descriptor.exportName,
          memoryStoreRoot,
          hostSurface,
          runtimeMode,
        },
        error,
      );
    }
  }

  /**
   * Validates the minimal runtime contract required by `MemoryStoreProvider`.
   * @param provider Constructed provider instance.
   * @param descriptor Built-in provider descriptor.
   * @returns Void.
   */
  private assertProviderContract(
    provider: MemoryStoreProvider,
    descriptor: MemoryProviderResolvedDescriptor,
  ): void {
    const requiredMethods = ["read", "write", "query", "snapshot", "archive"] as const;
    for (const methodName of requiredMethods) {
      if (typeof provider[methodName] !== "function") {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_STORE_PROVIDER_EXPORT_INVALID,
          `Memory provider "${descriptor.providerName}" does not implement "${methodName}()".`,
          {
            providerId: descriptor.id,
            moduleSpecifier: this.resolveModuleSpecifier(descriptor),
            exportName: descriptor.exportName,
            methodName,
          },
        );
      }
    }
  }

  /**
   * Resolves configured memory store root to an absolute path.
   * @param workspaceRoot Resolved workspace root.
   * @param storeRoot Configured store root path.
   * @returns Absolute memory store root.
   */
  private resolveMemoryStoreRoot(workspaceRoot: string, storeRoot: string): string {
    if (isAbsolute(storeRoot)) {
      return storeRoot;
    }

    return resolve(workspaceRoot, storeRoot);
  }

  /**
   * Builds one suffix that keeps optional built-in distribution truthfulness explicit.
   * @param descriptor Built-in provider descriptor.
   * @returns Message suffix appended to module-load failures.
   */
  private resolveDistributionFailureHint(descriptor: MemoryProviderResolvedDescriptor): string {
    if (
      descriptor.kind !== MemoryProviderDescriptorKind.BUILT_IN ||
      descriptor.distributionMode !== MemoryProviderDistributionMode.OPTIONAL
    ) {
      return "";
    }

    return ` This optional built-in provider is not bundled in the default distribution baseline and currently fail-closes unless a plugin-enabled distribution explicitly provides "${descriptor.packageName}".`;
  }

  /**
   * Resolves descriptor module specifier across built-in and plugin descriptor shapes.
   * @param descriptor Resolved provider descriptor.
   * @returns Package or module specifier used for dynamic loading.
   */
  private resolveModuleSpecifier(descriptor: MemoryProviderResolvedDescriptor): string {
    if (descriptor.kind === MemoryProviderDescriptorKind.BUILT_IN) {
      return descriptor.packageName;
    }

    return descriptor.moduleSpecifier;
  }

  /**
   * Resolves one plugin module specifier into the canonical policy class.
   * @param moduleSpecifier Raw config-level module specifier.
   * @returns Classified specifier kind.
   */
  private resolvePluginSpecifierKind(moduleSpecifier: string): MemoryProviderPluginSpecifierKind {
    if (moduleSpecifier.startsWith("file:")) {
      return MemoryProviderPluginSpecifierKind.FILE_URL;
    }

    if (isAbsolute(moduleSpecifier) || /^[A-Za-z]:[\\/]/u.test(moduleSpecifier)) {
      return MemoryProviderPluginSpecifierKind.ABSOLUTE_PATH;
    }

    if (moduleSpecifier.startsWith("./") || moduleSpecifier.startsWith("../")) {
      return MemoryProviderPluginSpecifierKind.RELATIVE_PATH;
    }

    return MemoryProviderPluginSpecifierKind.PACKAGE_NAME;
  }

  /**
   * Resolves the allowlist policy kind that admits one plugin package specifier.
   * @param moduleSpecifier Raw config-level module specifier.
   * @returns Matched policy kind or `null` when blocked.
   */
  private resolvePluginResolutionPolicyKind(
    moduleSpecifier: string,
  ): MemoryProviderPluginResolutionPolicyKind | null {
    if (this.pluginPolicy.allowedModules.includes(moduleSpecifier)) {
      return MemoryProviderPluginResolutionPolicyKind.EXACT_ALLOWLIST;
    }

    if (
      this.pluginPolicy.allowedPackagePrefixes.some((prefix) => moduleSpecifier.startsWith(prefix))
    ) {
      return MemoryProviderPluginResolutionPolicyKind.PREFIX_ALLOWLIST;
    }

    return null;
  }

  /**
   * Throws one stable conflict error when provider selection disagrees with storeEngine.
   * @param providerId Provider identifier from config.
   * @param storeEngine Canonical storeEngine value.
   * @returns Never.
   */
  private throwStoreEngineConflict(providerId: string, storeEngine: MemoryStoreEngine): never {
    throw new RuntimeError(
      GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
      `Configured provider.id "${providerId}" conflicts with storeEngine "${storeEngine}".`,
      {
        providerId,
        storeEngine,
      },
    );
  }
}
