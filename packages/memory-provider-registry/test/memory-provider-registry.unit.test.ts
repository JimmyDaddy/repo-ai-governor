import { join } from 'node:path';

import { GovernorErrorCode, MemoryStoreEngine, RuntimeError } from '@repo-ai-governor/shared';
import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_MEMORY_PROVIDER_DESCRIPTORS,
  DEFAULT_MEMORY_PROVIDER_PLUGIN_EXPORT_NAME,
  MemoryProviderBuiltInId,
  MemoryProviderDescriptorKind,
  MemoryProviderDistributionMode,
  MemoryProviderHostSurface,
  MemoryProviderPluginResolutionPolicyKind,
  MemoryProviderPluginSpecifierKind,
  MemoryProviderRegistry,
  MemoryProviderResolutionSource,
  MemoryProviderRuntimeMode,
} from '../src/index.js';

describe('MemoryProviderRegistry', () => {
  it('freezes built-in descriptors with default and optional distribution modes', () => {
    expect(BUILT_IN_MEMORY_PROVIDER_DESCRIPTORS).toEqual([
      expect.objectContaining({
        id: MemoryProviderBuiltInId.FS_CSV,
        distributionMode: MemoryProviderDistributionMode.DEFAULT,
      }),
      expect.objectContaining({
        id: MemoryProviderBuiltInId.SQLITE_FS,
        distributionMode: MemoryProviderDistributionMode.OPTIONAL,
      }),
    ]);
  });

  it('loads the built-in fs-csv provider from legacy storeEngine config', async () => {
    const registry = new MemoryProviderRegistry();
    const result = await registry.loadProvider({
      workspaceRoot: '/tmp/repo-ai-governor-memory-provider-registry',
      memoryConfig: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
      },
    });

    expect(result.descriptor.id).toBe(MemoryProviderBuiltInId.FS_CSV);
    expect(result.providerName).toBe('FsCsvMemoryStoreProvider');
    expect(result.memoryStoreRoot).toBe(
      join('/tmp/repo-ai-governor-memory-provider-registry', 'context/memory'),
    );
    expect(result.summary).toEqual(
      expect.objectContaining({
        memoryStoreEngine: MemoryStoreEngine.FS_CSV,
        memoryStoreProvider: 'FsCsvMemoryStoreProvider',
        memoryStoreProviderId: MemoryProviderBuiltInId.FS_CSV,
        memoryStoreDistributionMode: MemoryProviderDistributionMode.DEFAULT,
        memoryStoreResolutionSource: MemoryProviderResolutionSource.LEGACY_STORE_ENGINE,
        memoryStoreHostSurface: MemoryProviderHostSurface.CLI,
        memoryStoreRuntimeMode: MemoryProviderRuntimeMode.EMBEDDED,
      }),
    );
    expect(typeof result.provider.read).toBe('function');
  });

  it('resolves a built-in descriptor from provider.id when it matches storeEngine', () => {
    const registry = new MemoryProviderRegistry();
    const descriptor = registry.resolveBuiltInDescriptor({
      storeEngine: MemoryStoreEngine.SQLITE_FS,
      storeRoot: 'context/memory',
      provider: {
        id: MemoryProviderBuiltInId.SQLITE_FS,
      },
    });

    expect(descriptor.id).toBe(MemoryProviderBuiltInId.SQLITE_FS);
    expect(descriptor.providerName).toBe('SqliteFsMemoryStoreProvider');
  });

  it('resolves an allowlisted plugin descriptor from provider.module', () => {
    const registry = new MemoryProviderRegistry({
      pluginPolicy: {
        allowedModules: ['@acme/memory-provider-postgres'],
        allowedPackagePrefixes: [],
      },
    });

    const resolution = registry.resolveDescriptor({
      storeEngine: MemoryStoreEngine.FS_CSV,
      storeRoot: 'context/memory',
      provider: {
        module: '@acme/memory-provider-postgres',
      },
    });

    expect(resolution.resolutionSource).toBe(MemoryProviderResolutionSource.PLUGIN_MODULE);
    expect(resolution.descriptor).toEqual(
      expect.objectContaining({
        id: '@acme/memory-provider-postgres',
        kind: MemoryProviderDescriptorKind.PLUGIN,
        exportName: DEFAULT_MEMORY_PROVIDER_PLUGIN_EXPORT_NAME,
        specifierKind: MemoryProviderPluginSpecifierKind.PACKAGE_NAME,
        resolutionPolicyKind: MemoryProviderPluginResolutionPolicyKind.EXACT_ALLOWLIST,
      }),
    );
  });

  it('loads an allowlisted plugin provider via the factory contract', async () => {
    const registry = new MemoryProviderRegistry({
      pluginPolicy: {
        allowedModules: ['@acme/memory-provider-postgres'],
        allowedPackagePrefixes: [],
      },
      moduleLoader: async () => ({
        createMemoryStoreProvider: async (context: {
          memoryStoreRoot: string;
          providerOptions: Record<string, unknown>;
        }) => ({
          read: async () => null,
          write: async () => undefined,
          query: async () => [],
          snapshot: async () => undefined,
          archive: async () => undefined,
          context,
        }),
      }),
    });

    const result = await registry.loadPluginProvider({
      workspaceRoot: '/tmp/repo-ai-governor-memory-provider-registry',
      memoryConfig: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
        provider: {
          module: '@acme/memory-provider-postgres',
          options: {
            retentionDays: 30,
          },
        },
      },
    });

    expect(result.resolutionSource).toBe(MemoryProviderResolutionSource.PLUGIN_MODULE);
    expect(result.descriptor.kind).toBe(MemoryProviderDescriptorKind.PLUGIN);
    expect(result.providerName).toBe('@acme/memory-provider-postgres');
    expect(result.memoryStoreRoot).toBe(
      join('/tmp/repo-ai-governor-memory-provider-registry', 'context/memory'),
    );
    expect(result.summary).toEqual(
      expect.objectContaining({
        memoryStoreProviderId: '@acme/memory-provider-postgres',
        memoryStoreProviderModule: '@acme/memory-provider-postgres',
        memoryStoreDistributionMode: MemoryProviderDistributionMode.OPTIONAL,
        memoryStoreResolutionSource: MemoryProviderResolutionSource.PLUGIN_MODULE,
        memoryStoreHostSurface: MemoryProviderHostSurface.CLI,
        memoryStoreRuntimeMode: MemoryProviderRuntimeMode.EMBEDDED,
      }),
    );
  });

  it('records service-host hostSurface/runtimeMode in composition summary when explicitly requested', async () => {
    const registry = new MemoryProviderRegistry();

    const result = await registry.loadProvider({
      workspaceRoot: '/tmp/repo-ai-governor-memory-provider-registry',
      memoryConfig: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
      },
      hostSurface: MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
      runtimeMode: MemoryProviderRuntimeMode.DAEMON,
    });

    expect(result.hostSurface).toBe(MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE);
    expect(result.runtimeMode).toBe(MemoryProviderRuntimeMode.DAEMON);
    expect(result.summary.memoryStoreHostSurface).toBe(
      MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
    );
    expect(result.summary.memoryStoreRuntimeMode).toBe(MemoryProviderRuntimeMode.DAEMON);
  });

  it('routes loadProvider through plugin resolution when provider.module is configured', async () => {
    const registry = new MemoryProviderRegistry({
      pluginPolicy: {
        allowedModules: ['@acme/memory-provider-postgres'],
        allowedPackagePrefixes: [],
      },
      moduleLoader: async () => ({
        createMemoryStoreProvider: async () => ({
          read: async () => null,
          write: async () => undefined,
          query: async () => [],
          snapshot: async () => undefined,
          archive: async () => undefined,
        }),
      }),
    });

    const result = await registry.loadProvider({
      workspaceRoot: '/tmp/repo-ai-governor-memory-provider-registry',
      memoryConfig: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
        provider: {
          module: '@acme/memory-provider-postgres',
        },
      },
    });

    expect(result.resolutionSource).toBe(MemoryProviderResolutionSource.PLUGIN_MODULE);
    expect(result.descriptor.kind).toBe(MemoryProviderDescriptorKind.PLUGIN);
    expect(result.providerName).toBe('@acme/memory-provider-postgres');
  });

  it('fails closed when a plugin module is not allowlisted', () => {
    const registry = new MemoryProviderRegistry({
      pluginPolicy: {
        allowedModules: [],
        allowedPackagePrefixes: ['@repo-ai-governor/memory-provider-'],
      },
    });

    expect(() =>
      registry.resolvePluginDescriptor({
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
        provider: {
          module: '@acme/memory-provider-postgres',
        },
      }),
    ).toThrowError(RuntimeError);
  });

  it('fails closed when a plugin module uses a relative path', () => {
    const registry = new MemoryProviderRegistry();

    expect(() =>
      registry.resolvePluginDescriptor({
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
        provider: {
          module: './plugins/postgres-provider',
        },
      }),
    ).toThrowError(RuntimeError);
  });

  it('fails closed with explicit default-distribution guidance when an optional built-in provider package is unavailable', async () => {
    const registry = new MemoryProviderRegistry({
      moduleLoader: async (specifier) => {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
          `Cannot find package "${specifier}" imported from test fixture`,
        );
      },
    });

    await expect(
      registry.loadProvider({
        workspaceRoot: '/tmp/repo-ai-governor-memory-provider-registry',
        memoryConfig: {
          storeEngine: MemoryStoreEngine.SQLITE_FS,
          storeRoot: 'context/memory',
        },
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
      message: expect.stringContaining('not bundled in the default distribution baseline'),
    });
  });

  it('fails closed when the provider export is missing', async () => {
    const registry = new MemoryProviderRegistry({
      moduleLoader: async () => ({}),
    });

    await expect(
      registry.loadProvider({
        workspaceRoot: '/tmp/repo-ai-governor-memory-provider-registry',
        memoryConfig: {
          storeEngine: MemoryStoreEngine.SQLITE_FS,
          storeRoot: 'context/memory',
        },
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.MEMORY_STORE_PROVIDER_EXPORT_INVALID,
    });
  });

  it('fails closed when an external provider.module is configured before plugin mode is enabled', () => {
    const registry = new MemoryProviderRegistry();

    try {
      registry.resolveBuiltInDescriptor({
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
        provider: {
          module: '@scope/custom-memory-provider',
          exportName: 'createMemoryStoreProvider',
        },
      });
      expect.unreachable('Expected registry.resolveBuiltInDescriptor() to throw.');
    } catch (error) {
      expect(error).toMatchObject({
        code: GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
      });
    }
  });
});
