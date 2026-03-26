import { join } from "node:path";

import { GovernorErrorCode, MemoryStoreEngine, RuntimeError } from "@repo-ai-governor/shared";
import { describe, expect, it } from "vitest";

import {
  BUILT_IN_MEMORY_PROVIDER_DESCRIPTORS,
  MemoryProviderBuiltInId,
  MemoryProviderDistributionMode,
  MemoryProviderRegistry,
} from "../src/index.js";

describe("MemoryProviderRegistry", () => {
  it("freezes built-in descriptors with default and optional distribution modes", () => {
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

  it("loads the built-in fs-csv provider from legacy storeEngine config", async () => {
    const registry = new MemoryProviderRegistry();
    const result = await registry.loadProvider({
      workspaceRoot: "/tmp/repo-ai-governor-memory-provider-registry",
      memoryConfig: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: "context/memory",
      },
    });

    expect(result.descriptor.id).toBe(MemoryProviderBuiltInId.FS_CSV);
    expect(result.providerName).toBe("FsCsvMemoryStoreProvider");
    expect(result.memoryStoreRoot).toBe(
      join("/tmp/repo-ai-governor-memory-provider-registry", "context/memory"),
    );
    expect(typeof result.provider.read).toBe("function");
  });

  it("resolves a built-in descriptor from provider.id when it matches storeEngine", () => {
    const registry = new MemoryProviderRegistry();
    const descriptor = registry.resolveBuiltInDescriptor({
      storeEngine: MemoryStoreEngine.SQLITE_FS,
      storeRoot: "context/memory",
      provider: {
        id: MemoryProviderBuiltInId.SQLITE_FS,
      },
    });

    expect(descriptor.id).toBe(MemoryProviderBuiltInId.SQLITE_FS);
    expect(descriptor.providerName).toBe("SqliteFsMemoryStoreProvider");
  });

  it("fails closed with explicit default-distribution guidance when an optional built-in provider package is unavailable", async () => {
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
        workspaceRoot: "/tmp/repo-ai-governor-memory-provider-registry",
        memoryConfig: {
          storeEngine: MemoryStoreEngine.SQLITE_FS,
          storeRoot: "context/memory",
        },
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
      message: expect.stringContaining("not bundled in the default distribution baseline"),
    });
  });

  it("fails closed when the provider export is missing", async () => {
    const registry = new MemoryProviderRegistry({
      moduleLoader: async () => ({}),
    });

    await expect(
      registry.loadProvider({
        workspaceRoot: "/tmp/repo-ai-governor-memory-provider-registry",
        memoryConfig: {
          storeEngine: MemoryStoreEngine.SQLITE_FS,
          storeRoot: "context/memory",
        },
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.MEMORY_STORE_PROVIDER_EXPORT_INVALID,
    });
  });

  it("fails closed when an external provider.module is configured before plugin mode is enabled", () => {
    const registry = new MemoryProviderRegistry();

    try {
      registry.resolveBuiltInDescriptor({
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: "context/memory",
        provider: {
          module: "@scope/custom-memory-provider",
          exportName: "createMemoryStoreProvider",
        },
      });
      expect.unreachable("Expected registry.resolveBuiltInDescriptor() to throw.");
    } catch (error) {
      expect(error).toMatchObject({
        code: GovernorErrorCode.MEMORY_STORE_PROVIDER_INIT_FAILED,
      });
    }
  });
});
