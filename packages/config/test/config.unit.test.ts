import {
  AdapterAvailability,
  AdapterSurface,
  ConfigError,
  DefaultRoleProfileId,
  GovernorErrorCode,
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
});
