import { isAbsolute, resolve } from "node:path";

import type { MemoryStoreProvider } from "@repo-ai-governor/memory-store-adapter";
import { GovernorErrorCode, RuntimeError, standardizeError } from "@repo-ai-governor/shared";
import type { MemoryRuntimeConfig } from "@repo-ai-governor/shared";
import {
  BUILT_IN_MEMORY_PROVIDER_DESCRIPTORS,
  MEMORY_STORE_ENGINE_TO_BUILT_IN_PROVIDER_ID,
  MemoryProviderDistributionMode,
} from "./constants/index.js";
import type {
  MemoryProviderBuiltInDescriptor,
  MemoryProviderConstructor,
  MemoryProviderRegistryLoadRequest,
  MemoryProviderRegistryLoadResult,
  MemoryProviderRegistryOptions,
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

  /**
   * Creates a registry with built-in descriptors and an overridable module loader seam.
   * @param options Optional registry overrides for tests or follow-up plugin expansion.
   */
  public constructor(options: MemoryProviderRegistryOptions = {}) {
    this.builtInDescriptors = options.builtInDescriptors ?? BUILT_IN_MEMORY_PROVIDER_DESCRIPTORS;
    this.moduleLoader = options.moduleLoader ?? this.loadModule;
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
        `External memory provider module "${memoryConfig.provider.module}" is not enabled in the built-in registry baseline.`,
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
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
          `Configured provider.id "${memoryConfig.provider.id}" conflicts with storeEngine "${memoryConfig.storeEngine}".`,
          {
            providerId: memoryConfig.provider.id,
            storeEngine: memoryConfig.storeEngine,
          },
        );
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
   * Loads one built-in provider instance from resolved memory runtime config.
   * @param request Provider-load request from CLI or service host.
   * @returns Resolved provider composition metadata.
   */
  public async loadProvider(
    request: MemoryProviderRegistryLoadRequest,
  ): Promise<MemoryProviderRegistryLoadResult> {
    const descriptor = this.resolveBuiltInDescriptor(request.memoryConfig);
    const memoryStoreRoot = this.resolveMemoryStoreRoot(
      request.workspaceRoot,
      request.memoryConfig.storeRoot,
    );

    let providerModule: Record<string, unknown>;
    try {
      providerModule = await this.moduleLoader(descriptor.packageName);
    } catch (error) {
      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
        `Failed to load memory provider module "${descriptor.packageName}": ${standardizedError.message}${this.resolveDistributionFailureHint(descriptor)}`,
        {
          providerId: descriptor.id,
          packageName: descriptor.packageName,
          distributionMode: descriptor.distributionMode,
        },
        error,
      );
    }

    const providerConstructor = this.resolveProviderConstructor(providerModule, descriptor);

    let provider: MemoryStoreProvider;
    try {
      provider = new providerConstructor({
        rootDirectory: memoryStoreRoot,
      });
    } catch (error) {
      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
        `Failed to initialize memory provider "${descriptor.providerName}": ${standardizedError.message}`,
        {
          providerId: descriptor.id,
          packageName: descriptor.packageName,
          exportName: descriptor.exportName,
          memoryStoreRoot,
        },
        error,
      );
    }

    this.assertProviderContract(provider, descriptor);

    return {
      descriptor,
      memoryStoreRoot,
      providerName: descriptor.providerName,
      provider,
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
   * Validates the minimal runtime contract required by `MemoryStoreProvider`.
   * @param provider Constructed provider instance.
   * @param descriptor Built-in provider descriptor.
   * @returns Void.
   */
  private assertProviderContract(
    provider: MemoryStoreProvider,
    descriptor: MemoryProviderBuiltInDescriptor,
  ): void {
    const requiredMethods = ["read", "write", "query", "snapshot", "archive"] as const;
    for (const methodName of requiredMethods) {
      if (typeof provider[methodName] !== "function") {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_STORE_PROVIDER_EXPORT_INVALID,
          `Memory provider "${descriptor.providerName}" does not implement "${methodName}()".`,
          {
            providerId: descriptor.id,
            packageName: descriptor.packageName,
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
  private resolveDistributionFailureHint(descriptor: MemoryProviderBuiltInDescriptor): string {
    if (descriptor.distributionMode !== MemoryProviderDistributionMode.OPTIONAL) {
      return "";
    }

    return ` This optional built-in provider is not bundled in the default distribution baseline and currently fail-closes unless a plugin-enabled distribution explicitly provides "${descriptor.packageName}".`;
  }
}
