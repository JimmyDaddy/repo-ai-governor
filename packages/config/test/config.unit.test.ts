import {
  AdapterAvailability,
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  CliReactThemePreset,
  ConfigError,
  DefaultRoleProfileId,
  GovernorErrorCode,
  LocalModelProvider,
  MemoryStoreEngine,
  RoleProfileStatus,
  RoleSource,
} from '@repo-ai-governor/shared';
import {
  type GovernorConfig,
  ProfileResolver,
  SchemaValidator,
  WorkspaceMode,
  WorkspaceModeSource,
  WorkspaceResolver,
} from '../src/index.js';

function createConfigFixture(): GovernorConfig {
  return {
    schemaVersion: '1.0',
    workspace: {
      mode: WorkspaceMode.REPO_LOCAL,
    },
    i18n: {
      runtimeEngine: 'i18next',
      defaultLocale: 'zh-CN',
      fallbackLocale: 'en-US',
      supportedLocales: ['zh-CN', 'en-US'],
    },
    ui: {
      react: {
        theme: CliReactThemePreset.GOVERNOR,
      },
    },
    standards: {
      packSources: {
        official: [
          {
            module: '@repo-ai-governor/standards/examples',
            exportName: 'workflowReviewGovernancePack',
          },
          {
            module: '@repo-ai-governor/standards/examples',
            exportName: 'javascriptMinimalGovernancePack',
          },
        ],
        team: [
          {
            module: '@acme/governor-standards-team',
            exportName: 'teamDeliveryPack',
          },
        ],
        repository: [
          {
            module: './.repo-ai-governor/standards/repository-pack.ts',
            exportName: 'repositoryOverridePack',
          },
        ],
      },
      renderTargets: ['human', 'ai'],
      projectionTargets: [
        {
          targetFile: '.repo-ai-governor/generated/AGENTS.generated.md',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'zh-CN',
      fallbackLocale: 'en-US',
    },
    roles: [
      {
        roleProfileId: 'reviewer-custom',
        roleProfileVersion: '1.0.0',
        displayName: 'Reviewer Custom',
        responsibilities: ['review_changes'],
        capabilities: ['structured_output'],
        permissionCeiling: ['read', 'test'],
        roleSource: RoleSource.CUSTOM,
        status: RoleProfileStatus.ACTIVE,
      },
    ],
    adapters: {
      roles: [
        {
          roleId: 'planner',
          roleProfileId: DefaultRoleProfileId.PLANNER,
          requiredCapabilities: ['structured_output'],
          required: true,
        },
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: ['tool_calling'],
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
        ui: {
          react: {
            theme: CliReactThemePreset.CALM,
          },
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

function requireAdaptersFixture(config: GovernorConfig): NonNullable<GovernorConfig['adapters']> {
  const adapters = config.adapters;
  if (adapters) {
    return adapters;
  }

  throw new ConfigError(
    GovernorErrorCode.CONFIG_SCHEMA_VALIDATION_FAILED,
    'Test fixture must provide adapters config.',
    {
      pointer: '/adapters',
    },
  );
}

describe('config unit', () => {
  it('validates schema payload and resolves profile overrides', () => {
    const validator = new SchemaValidator();
    const profileResolver = new ProfileResolver();

    const validatedConfig = validator.validateOrThrow(createConfigFixture());
    const resolvedConfig = profileResolver.resolve(validatedConfig, 'ci');

    expect(resolvedConfig.profileId).toBe('ci');
    expect(resolvedConfig.config.workspace.mode).toBe(WorkspaceMode.TOOL_MANAGED);
    expect(resolvedConfig.config.ui?.react?.theme).toBe(CliReactThemePreset.CALM);
    expect(resolvedConfig.config.roles?.[0]?.roleProfileId).toBe('reviewer-custom');
  });

  it('accepts layered standards runtime config including team pack path', () => {
    const validator = new SchemaValidator();
    const validatedConfig = validator.validateOrThrow(createConfigFixture());

    expect(validatedConfig.standards?.packSources.official?.map((pack) => pack.exportName)).toEqual(
      ['workflowReviewGovernancePack', 'javascriptMinimalGovernancePack'],
    );
    expect(validatedConfig.standards?.packSources.team?.[0]?.exportName).toBe('teamDeliveryPack');
    expect(validatedConfig.standards?.renderTargets).toEqual(['human', 'ai']);
    expect(validatedConfig.standards?.projectionTargets?.[0]?.targetFile).toBe(
      '.repo-ai-governor/generated/AGENTS.generated.md',
    );
  });

  it('merges adapters profile overrides into base adapters config', () => {
    const validator = new SchemaValidator();
    const profileResolver = new ProfileResolver();

    const validatedConfig = validator.validateOrThrow(createConfigFixture());
    const resolvedConfig = profileResolver.resolve(validatedConfig, 'copilot');

    expect(resolvedConfig.profileId).toBe('copilot');
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

  it('keeps adapters override partial when base adapters are absent', () => {
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
    const resolvedConfig = profileResolver.resolve(validatedConfig, 'toolOnly');

    expect(resolvedConfig.profileId).toBe('toolOnly');
    expect(resolvedConfig.config.adapters?.roles).toBeUndefined();
    expect(resolvedConfig.config.adapters?.routing).toBeUndefined();
    expect(resolvedConfig.config.adapters?.tools?.[0]?.toolId).toBe(AdapterSurface.GITHUB_COPILOT);
    expect(resolvedConfig.config.standards?.packSources.team?.[0]?.exportName).toBe(
      'teamDeliveryPack',
    );
  });

  it('accepts local-model adapter tool with local runtime config', () => {
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
              endpoint: 'http://127.0.0.1:11434',
              model: 'qwen2.5-coder:7b',
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
    expect(localModelTool?.localModel?.model).toBe('qwen2.5-coder:7b');
  });

  it('accepts codex remote_api tool config and materializes transport-aware fields', () => {
    const validator = new SchemaValidator();
    const baseConfig = createConfigFixture();
    const baseAdapters = requireAdaptersFixture(baseConfig);
    const configWithRemoteApi: GovernorConfig = {
      ...baseConfig,
      adapters: {
        ...baseAdapters,
        tools: [
          {
            toolId: AdapterSurface.CODEX,
            enabled: true,
            availability: AdapterAvailability.AVAILABLE,
            transport: AdapterTransportKind.REMOTE_API,
            remoteApi: {
              provider: AdapterProviderKind.OPENAI,
              vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
              model: 'gpt-5',
              credentialEnvVar: 'OPENAI_API_KEY',
            },
          },
        ],
      },
    };

    const validatedConfig = validator.validateOrThrow(configWithRemoteApi);
    const codexTool = validatedConfig.adapters?.tools?.find(
      (tool) => tool.toolId === AdapterSurface.CODEX,
    );

    expect(codexTool?.transport).toBe(AdapterTransportKind.REMOTE_API);
    expect(codexTool?.remoteApi?.provider).toBe(AdapterProviderKind.OPENAI);
    expect(codexTool?.remoteApi?.vendorBinding).toBe(AdapterVendorBindingKind.OPENAI_RESPONSES);
  });

  it('preserves inferred remote_api config when transport is omitted', () => {
    const validator = new SchemaValidator();
    const baseConfig = createConfigFixture();
    const baseAdapters = requireAdaptersFixture(baseConfig);
    const configWithInferredRemoteApi: GovernorConfig = {
      ...baseConfig,
      adapters: {
        ...baseAdapters,
        tools: [
          {
            toolId: AdapterSurface.CODEX,
            enabled: true,
            availability: AdapterAvailability.AVAILABLE,
            remoteApi: {
              provider: AdapterProviderKind.OPENAI,
              vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
              model: 'gpt-5',
              credentialEnvVar: 'OPENAI_API_KEY',
            },
          },
        ],
      },
    };

    const validatedConfig = validator.validateOrThrow(configWithInferredRemoteApi);
    const codexTool = validatedConfig.adapters?.tools?.find(
      (tool) => tool.toolId === AdapterSurface.CODEX,
    );

    expect(codexTool?.transport).toBeUndefined();
    expect(codexTool?.remoteApi?.provider).toBe(AdapterProviderKind.OPENAI);
    expect(codexTool?.remoteApi?.vendorBinding).toBe(AdapterVendorBindingKind.OPENAI_RESPONSES);
  });

  it('accepts explicit cli_exec transport while preserving configured remote_api truth', () => {
    const validator = new SchemaValidator();
    const baseConfig = createConfigFixture();
    const baseAdapters = requireAdaptersFixture(baseConfig);
    const configWithExplicitCliExec: GovernorConfig = {
      ...baseConfig,
      adapters: {
        ...baseAdapters,
        tools: [
          {
            toolId: AdapterSurface.CODEX,
            enabled: true,
            availability: AdapterAvailability.AVAILABLE,
            transport: AdapterTransportKind.CLI_EXEC,
            remoteApi: {
              provider: AdapterProviderKind.OPENAI,
              vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
              model: 'gpt-5',
              credentialEnvVar: 'OPENAI_API_KEY',
            },
          },
        ],
      },
    };

    const validatedConfig = validator.validateOrThrow(configWithExplicitCliExec);
    const codexTool = validatedConfig.adapters?.tools?.find(
      (tool) => tool.toolId === AdapterSurface.CODEX,
    );

    expect(codexTool?.transport).toBe(AdapterTransportKind.CLI_EXEC);
    expect(codexTool?.remoteApi?.provider).toBe(AdapterProviderKind.OPENAI);
    expect(codexTool?.remoteApi?.vendorBinding).toBe(AdapterVendorBindingKind.OPENAI_RESPONSES);
  });

  it('rejects non-canonical acp transport authoring for adapter tools', () => {
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
            transport: 'acp' as AdapterTransportKind,
          },
        ],
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrow(/transport/u);
  });

  it('preserves inferred remote_api selection when remoteApi is configured without transport', () => {
    const validator = new SchemaValidator();
    const baseConfig = createConfigFixture();
    const baseAdapters = requireAdaptersFixture(baseConfig);
    const configWithInferredRemoteApi: GovernorConfig = {
      ...baseConfig,
      adapters: {
        ...baseAdapters,
        tools: [
          {
            toolId: AdapterSurface.CODEX,
            enabled: true,
            availability: AdapterAvailability.AVAILABLE,
            remoteApi: {
              provider: AdapterProviderKind.OPENAI,
              vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
              model: 'gpt-5',
              credentialEnvVar: 'OPENAI_API_KEY',
            },
          },
        ],
      },
    };

    const validatedConfig = validator.validateOrThrow(configWithInferredRemoteApi);
    const codexTool = validatedConfig.adapters?.tools?.find(
      (tool) => tool.toolId === AdapterSurface.CODEX,
    );

    expect(codexTool?.transport).toBeUndefined();
    expect(codexTool?.remoteApi?.provider).toBe(AdapterProviderKind.OPENAI);
    expect(codexTool?.remoteApi?.vendorBinding).toBe(AdapterVendorBindingKind.OPENAI_RESPONSES);
  });

  it('rejects unsupported remote_api provider mapping for codex', () => {
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
            transport: AdapterTransportKind.REMOTE_API,
            remoteApi: {
              provider: AdapterProviderKind.ANTHROPIC,
              model: 'claude-sonnet-4-5',
            },
          },
        ],
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it('accepts remote_api credentialRef and provider-local discovery flags', () => {
    const validator = new SchemaValidator();
    const baseConfig = createConfigFixture();
    const baseAdapters = requireAdaptersFixture(baseConfig);
    const configWithCredentialRef: GovernorConfig = {
      ...baseConfig,
      adapters: {
        ...baseAdapters,
        tools: [
          {
            toolId: AdapterSurface.CODEX,
            transport: AdapterTransportKind.REMOTE_API,
            remoteApi: {
              provider: AdapterProviderKind.OPENAI,
              vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
              model: 'gpt-5',
              credentialRef: 'secret://openai/api-key',
              allowProviderLocalConfig: true,
            },
          },
        ],
      },
    };

    const validatedConfig = validator.validateOrThrow(configWithCredentialRef);
    const codexTool = validatedConfig.adapters?.tools?.find(
      (tool) => tool.toolId === AdapterSurface.CODEX,
    );

    expect(codexTool?.remoteApi?.credentialRef).toBe('secret://openai/api-key');
    expect(codexTool?.remoteApi?.allowProviderLocalConfig).toBe(true);
  });

  it('rejects local-model tool without local runtime config', () => {
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

  it('rejects local-model config when tool surface is non-local', () => {
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
              endpoint: 'http://127.0.0.1:11434',
              model: 'qwen2.5-coder:7b',
            },
          },
        ],
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it('uses default workspace mode when runtime/config override is absent', () => {
    const workspaceResolver = new WorkspaceResolver();
    const resolvedWorkspace = workspaceResolver.resolve({
      currentWorkingDirectory: process.cwd(),
    });

    expect(resolvedWorkspace.mode).toBe(WorkspaceMode.TOOL_MANAGED);
    expect(resolvedWorkspace.modeSource).toBe(WorkspaceModeSource.DEFAULT);
  });

  it('rejects duplicated roleProfileId rows in roles config', () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      roles: [
        {
          roleProfileId: 'duplicate-role',
          roleProfileVersion: '1.0.0',
          displayName: 'Duplicate Role',
          responsibilities: ['review_changes'],
          capabilities: ['structured_output'],
          permissionCeiling: ['read', 'test'],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.ACTIVE,
        },
        {
          roleProfileId: 'duplicate-role',
          roleProfileVersion: '1.0.1',
          displayName: 'Duplicate Role V2',
          responsibilities: ['review_changes'],
          capabilities: ['structured_output'],
          permissionCeiling: ['read', 'test'],
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

  it('rejects roleProfileId with unsupported format', () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      roles: [
        {
          roleProfileId: 'Reviewer-Custom',
          roleProfileVersion: '1.0.0',
          displayName: 'Reviewer Custom',
          responsibilities: ['review_changes'],
          capabilities: ['structured_output'],
          permissionCeiling: ['read', 'test'],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.ACTIVE,
        },
      ],
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it('rejects roleProfileVersion without semver format', () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      roles: [
        {
          roleProfileId: 'reviewer-custom',
          roleProfileVersion: 'v1',
          displayName: 'Reviewer Custom',
          responsibilities: ['review_changes'],
          capabilities: ['structured_output'],
          permissionCeiling: ['read', 'test'],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.ACTIVE,
        },
      ],
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it('rejects role lifecycle aliases that include roleProfileId itself', () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      roles: [
        {
          roleProfileId: 'reviewer-custom',
          roleProfileVersion: '1.0.0',
          displayName: 'Reviewer Custom',
          responsibilities: ['review_changes'],
          capabilities: ['structured_output'],
          permissionCeiling: ['read', 'test'],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.ACTIVE,
          lifecycle: {
            aliases: ['reviewer-custom'],
          },
        },
      ],
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it('rejects role lifecycle replacedBy that does not exist in roles list', () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      roles: [
        {
          roleProfileId: 'reviewer-custom',
          roleProfileVersion: '1.0.0',
          displayName: 'Reviewer Custom',
          responsibilities: ['review_changes'],
          capabilities: ['structured_output'],
          permissionCeiling: ['read', 'test'],
          roleSource: RoleSource.CUSTOM,
          status: RoleProfileStatus.DEPRECATED,
          lifecycle: {
            replacedBy: 'reviewer-next',
          },
        },
      ],
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it('rejects unsupported React shell theme presets in ui config', () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      ui: {
        react: {
          theme: 'aurora' as CliReactThemePreset,
        },
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it('accepts memory provider module config when it uses an allowlist-controlled package specifier', () => {
    const validator = new SchemaValidator();
    const validConfig: GovernorConfig = {
      ...createConfigFixture(),
      memory: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
        provider: {
          module: '@repo-ai-governor/memory-provider-postgres',
          exportName: 'createMemoryStoreProvider',
          options: {
            retentionDays: 30,
          },
        },
      },
    };

    const validatedConfig = validator.validateOrThrow(validConfig);

    expect(validatedConfig.memory?.provider?.module).toBe(
      '@repo-ai-governor/memory-provider-postgres',
    );
    expect(validatedConfig.memory?.provider?.exportName).toBe('createMemoryStoreProvider');
  });

  it('rejects memory provider config when provider.id and provider.module are mixed', () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      memory: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
        provider: {
          id: 'fs-csv',
          module: '@repo-ai-governor/memory-provider-postgres',
        },
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it('rejects memory provider config when provider.module uses a relative path', () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      memory: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
        provider: {
          module: './plugins/postgres-provider',
        },
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it('rejects memory provider exportName when provider.module is absent', () => {
    const validator = new SchemaValidator();
    const invalidConfig: GovernorConfig = {
      ...createConfigFixture(),
      memory: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory',
        provider: {
          exportName: 'createMemoryStoreProvider',
        },
      },
    };

    expect(() => validator.validateOrThrow(invalidConfig)).toThrowError(ConfigError);
  });

  it('accepts standards runtime config for layered pack loading and projection defaults', () => {
    const validator = new SchemaValidator();
    const configWithStandards: GovernorConfig = {
      ...createConfigFixture(),
      standards: {
        packSources: {
          official: [
            {
              module: './standards/official-pack.ts',
              exportName: 'officialPack',
            },
          ],
          repository: [
            {
              module: './standards/repository-pack.ts',
              exportName: 'repositoryPack',
              enabled: true,
            },
          ],
        },
        renderTargets: ['human', 'agents'],
        projectionTargets: [
          {
            targetFile: 'AGENTS.md',
            locale: 'zh-CN',
          },
        ],
        defaultLocale: 'zh-CN',
        fallbackLocale: 'en-US',
      },
    };

    const validatedConfig = validator.validateOrThrow(configWithStandards);

    expect(validatedConfig.standards?.packSources.official?.[0]?.module).toBe(
      './standards/official-pack.ts',
    );
    expect(validatedConfig.standards?.renderTargets).toEqual(['human', 'agents']);
    expect(validatedConfig.standards?.projectionTargets?.[0]?.targetFile).toBe('AGENTS.md');
  });
});
