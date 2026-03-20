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
    profiles: {
      ci: {
        workspace: {
          mode: WorkspaceMode.TOOL_MANAGED,
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
  });

  it("uses default workspace mode when runtime/config override is absent", () => {
    const workspaceResolver = new WorkspaceResolver();
    const resolvedWorkspace = workspaceResolver.resolve({
      currentWorkingDirectory: process.cwd(),
    });

    expect(resolvedWorkspace.mode).toBe(WorkspaceMode.TOOL_MANAGED);
    expect(resolvedWorkspace.modeSource).toBe(WorkspaceModeSource.DEFAULT);
  });
});
