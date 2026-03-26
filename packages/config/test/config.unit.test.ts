import {
  AdapterAvailability,
  AdapterSurface,
  ConfigError,
  DefaultRoleProfileId,
  GovernorErrorCode,
  LocalModelProvider,
  MemoryStoreEngine,
  RoleProfileStatus,
  RoleSource,
} from "@repo-ai-governor/shared";
import {
  type GovernorConfig,
  ProfileResolver,
  SchemaValidator,
  WorkspaceMode,
  WorkspaceModeSource,
  WorkspaceResolver,
} from "../src/index.js";

function createConfigFixture(): GovernorConfig {
  return {
    schemaVersion: "1.0",
    workspace: {
      mode: WorkspaceMode.REPO_LOCAL,
    },
    i18n: {
      runtimeEngine: "i18next",
      defaultLocale: "zh-CN",
      fallbackLocale: "en-US",
      supportedLocales: ["zh-CN", "en-US"],
    },
    roles: [
      {
        roleProfileId: "reviewer-custom",
        roleProfileVersion: "1.0.0",
        displayName: "Reviewer Custom",
        responsibilities: ["review_changes"],
        capabilities: ["structured_output"],
        permissionCeiling: ["read", "test"],
        roleSource: RoleSource.CUSTOM,
        status: RoleProfileStatus.ACTIVE,
      },
    ],
    adapters: {
      roles: [
        {
          roleId: "planner",
          roleProfileId: DefaultRoleProfileId.PLANNER,
          requiredCapabilities: ["structured_output"],
          required: true,
        },
        {
          roleId: "coder",
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: ["tool_calling"],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          planner: {
            primarySurface: AdapterSurface.CODEX,
            fallbackSurfaces: [AdapterSurface.CLAUDE_CODE],
          },
          coder: {
            primarySurface: AdapterSurface.CODEX,
            fallbackSurfaces: [AdapterSurface.GITHUB_COPILOT],
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
        },
      ],
    },
    profiles: {
      ci: {
        workspace: {
          mode: WorkspaceMode.TOOL_MANAGED,
        },
      },
      copilot: {
        adapters: {
          tools: [
            {
              toolId: AdapterSurface.GITHUB_COPILOT,
              enabled: true,
              availability: AdapterAvailability.DEGRADED,
            },
          ],
        },
      },
    },
  };
}

function requireAdaptersFixture(config: GovernorConfig): NonNullable<GovernorConfig["adapters"]> {
  const adapters = config.adapters;
  if (adapters) {
    return adapters;
  }

  throw new ConfigError(
    GovernorErrorCode.CONFIG_SCHEMA_VALIDATION_FAILED,
    "Test fixture must provide adapters config.",
    {
      pointer: "/adapters",
    },
  );
}

describe("config unit", () => {
  it("validates schema payload and resolves profile overrides", () => {
    const validator = new SchemaValidator();
    const profileResolver = new ProfileResolver();

    const validatedConfig = validator.validateOrThrow(createConfigFixture());
    const resolvedConfig = profileResolver.resolve(validatedConfig, "ci");

    expect(resolvedConfig.profileId).toBe("ci");
    expect(resolvedConfig.config.workspace.mode).toBe(WorkspaceMode.TOOL_MANAGED);
    expect(resolvedConfig.config.roles?.[0]?.roleProfileId).toBe("reviewer-custom");
  });

  it("merges adapters profile overrides into base adapters config", () => {
    const validator = new SchemaValidator();
    const profileResolver = new ProfileResolver();

    const validatedConfig = validator.validateOrThrow(createConfigFixture());
    const resolvedConfig = profileResolver.resolve(validatedConfig, "copilot");

    expect(resolvedConfig.profileId).toBe("copilot");
    expect(resolvedConfig.config.adapters?.roles).toHaveLength(2);
    expect(
      resolvedConfig.config.adapters?.tools?.some((tool) => tool.toolId === AdapterSurface.CODEX),
    ).toBe(true);
    expect(
      resolvedConfig.config.adapters?.tools?.some(
        (tool) =>
          tool.toolId === AdapterSurface.GITHUB_COPILOT &&
          tool.availability === AdapterAvailability.DEGRADED,
      ),
    ).toBe(true);
  });

  it("keeps adapters override partial when base adapters are absent", () => {
    const validator = new SchemaValidator();
    const profileResolver = new ProfileResolver();
    const configWithoutBaseAdapters: GovernorConfig = {
      ...createConfigFixture(),
      adapters: undefined,
      profiles: {
        toolOnly: {
          adapters: {
            tools: [
              {
                toolId: AdapterSurface.GITHUB_COPILOT,
                enabled: true,
                availability: AdapterAvailability.DEGRADED,
              },
            ],
          },
        },
      },
    };

    const validatedConfig = validator.validateOrThrow(configWithoutBaseAdapters);
    const resolvedConfig = profileResolver.resolve(validatedConfig, "toolOnly");

    expect(resolvedConfig.profileId).toBe("toolOnly");
    expect(resolvedConfig.config.adapters?.roles).toBeUndefined();
    expect(resolvedConfig.config.adapters?.routing).toBeUndefined();
    expect(resolvedConfig.config.adapters?.tools?.[0]?.toolId).toBe(AdapterSurface.GITHUB_COPILOT);
  });

  it("accepts local-model adapter tool with local runtime config", () => {
    const validator = new SchemaValidator();
    const baseConfig = createConfigFixture();
    const baseAdapters = requireAdaptersFixture(baseConfig);
    const configWithLocalModel: GovernorConfig = {
      ...baseConfig,
      adapters: {
        ...baseAdapters,
        tools: [
          ...(baseAdapters.tools ?? []),
          {
            toolId: AdapterSurface.OLLAMA,
            enabled: true,
            availability: AdapterAvailability.AVAILABLE,
            localModel: {
              provider: LocalModelProvider.OLLAMA,
              endpoint: "http://127.0.0.1:11434",
              model: "qwen2.5-coder:7b",
              requestTimeoutMs: 120000,
              maxRetries: 2,
            },
          },
        ],
      },
    };

    const validatedConfig = validator.validateOrThrow(configWithLocalModel);
    const localModelTool = validatedConfig.adapters?.tools?.find(
      (tool) => tool.toolId === AdapterSurface.OLLAMA,
    );

    expect(localModelTool?.localModel?.provider).toBe(LocalModelProvider.OLLAMA);
    expect(localModelTool?.localModel?.model).toBe("qwen2.5-coder:7b");
  });

  it("rejects local-model tool without local runtime config", () => {
    const validator = new SchemaValidator();
    const baseConfig = createConfigFixture();
    const baseAdapters = requireAdaptersFixture(baseConfig);
    const invalidConfig: GovernorConfig = {
      ...baseConfig,
      adapters: {
        ...baseAdapters,
        tools: [
          ...(baseAdapters.tools ?? []),
          {
            toolId: AdapterSurface.OLLAMA,
            enabled: true,
            availability: AdapterAvailability.AVAILABLE,
          },
        ],
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it("rejects local-model config when tool surface is non-local", () => {
    const validator = new SchemaValidator();
    const baseConfig = createConfigFixture();
    const baseAdapters = requireAdaptersFixture(baseConfig);
    const invalidConfig: GovernorConfig = {
      ...baseConfig,
      adapters: {
        ...baseAdapters,
        tools: [
          {
            toolId: AdapterSurface.CODEX,
            enabled: true,
            availability: AdapterAvailability.AVAILABLE,
            localModel: {
              provider: LocalModelProvider.OLLAMA,
              endpoint: "http://127.0.0.1:11434",
              model: "qwen2.5-coder:7b",
            },
          },
        ],
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it("uses default workspace mode when runtime/config override is absent", () => {
    const workspaceResolver = new WorkspaceResolver();
    const resolvedWorkspace = workspaceResolver.resolve({
      currentWorkingDirectory: process.cwd(),
    });

    expect(resolvedWorkspace.mode).toBe(WorkspaceMode.TOOL_MANAGED);
    expect(resolvedWorkspace.modeSource).toBe(WorkspaceModeSource.DEFAULT);
  });

  it("rejects duplicated roleProfileId rows in roles config", () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      roles: [
        {
          roleProfileId: "duplicate-role",
          roleProfileVersion: "1.0.0",
          displayName: "Duplicate Role",
          responsibilities: ["review_changes"],
          capabilities: ["structured_output"],
          permissionCeiling: ["read", "test"],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.ACTIVE,
        },
        {
          roleProfileId: "duplicate-role",
          roleProfileVersion: "1.0.1",
          displayName: "Duplicate Role V2",
          responsibilities: ["review_changes"],
          capabilities: ["structured_output"],
          permissionCeiling: ["read", "test"],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.ACTIVE,
        },
      ],
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);

    try {
      validator.validateOrThrow(invalidConfig);
    } catch (error) {
      const configError = error as ConfigError;
      expect(configError.code).toBe(GovernorErrorCode.CONFIG_SCHEMA_VALIDATION_FAILED);
    }
  });

  it("rejects roleProfileId with unsupported format", () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      roles: [
        {
          roleProfileId: "Reviewer-Custom",
          roleProfileVersion: "1.0.0",
          displayName: "Reviewer Custom",
          responsibilities: ["review_changes"],
          capabilities: ["structured_output"],
          permissionCeiling: ["read", "test"],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.ACTIVE,
        },
      ],
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it("rejects roleProfileVersion without semver format", () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      roles: [
        {
          roleProfileId: "reviewer-custom",
          roleProfileVersion: "v1",
          displayName: "Reviewer Custom",
          responsibilities: ["review_changes"],
          capabilities: ["structured_output"],
          permissionCeiling: ["read", "test"],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.ACTIVE,
        },
      ],
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it("rejects role lifecycle aliases that include roleProfileId itself", () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      roles: [
        {
          roleProfileId: "reviewer-custom",
          roleProfileVersion: "1.0.0",
          displayName: "Reviewer Custom",
          responsibilities: ["review_changes"],
          capabilities: ["structured_output"],
          permissionCeiling: ["read", "test"],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.ACTIVE,
          lifecycle: {
            aliases: ["reviewer-custom"],
          },
        },
      ],
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it("rejects role lifecycle replacedBy that does not exist in roles list", () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      roles: [
        {
          roleProfileId: "reviewer-custom",
          roleProfileVersion: "1.0.0",
          displayName: "Reviewer Custom",
          responsibilities: ["review_changes"],
          capabilities: ["structured_output"],
          permissionCeiling: ["read", "test"],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.DEPRECATED,
          lifecycle: {
            replacedBy: "reviewer-next",
          },
        },
      ],
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it("accepts memory provider module config when it uses an allowlist-controlled package specifier", () => {
    const validator = new SchemaValidator();
    const validConfig: GovernorConfig = {
      ...createConfigFixture(),
      memory: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: "context/memory",
        provider: {
          module: "@repo-ai-governor/memory-provider-postgres",
          exportName: "createMemoryStoreProvider",
          options: {
            retentionDays: 30,
          },
        },
      },
    };

    const validatedConfig = validator.validateOrThrow(validConfig);

    expect(validatedConfig.memory?.provider?.module).toBe(
      "@repo-ai-governor/memory-provider-postgres",
    );
    expect(validatedConfig.memory?.provider?.exportName).toBe("createMemoryStoreProvider");
  });

  it("rejects memory provider config when provider.id and provider.module are mixed", () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      memory: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: "context/memory",
        provider: {
          id: "fs-csv",
          module: "@repo-ai-governor/memory-provider-postgres",
        },
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it("rejects memory provider config when provider.module uses a relative path", () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      memory: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: "context/memory",
        provider: {
          module: "./plugins/postgres-provider",
        },
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it("rejects memory provider exportName when provider.module is absent", () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      memory: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: "context/memory",
        provider: {
          exportName: "createMemoryStoreProvider",
        },
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });
});
