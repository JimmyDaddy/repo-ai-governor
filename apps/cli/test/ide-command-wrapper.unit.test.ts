import {
  ErrorOutputEnvironment,
  GovernorErrorCode,
  type RuntimeError,
} from "@repo-ai-governor/shared";
import {
  IDE_SURFACE_REGISTRY,
  IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS,
  IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS,
  IdeEntrySurface,
  IdeStandardsSourceId,
  IdeSurfaceDegradeMode,
  IdeWrapperEnvironmentKey,
} from "../src/constants/ide-command-wrapper.constant.js";
import { IdeCommandWrapper, standardizeIdeWrapperError } from "../src/main.js";

describe("IDE command wrapper", () => {
  it("builds deterministic argv/env payload with standards injection metadata", () => {
    const wrapper = new IdeCommandWrapper();

    const result = wrapper.wrapCommand({
      command: "check",
      args: ["--verbose"],
      locale: "zh-CN",
      profileId: "team-A",
      surface: IdeEntrySurface.VSCODE,
      outputMode: ErrorOutputEnvironment.PLAIN,
      standardsProfileId: "stage5-ide",
      additionalEnv: {
        TEST_ENV: "1",
      },
    });

    expect(result.argv).toEqual([
      "node",
      "./dist/bin/repo-ai-governor.js",
      "--locale",
      "zh-CN",
      "--profile",
      "team-A",
      "check",
      "--verbose",
    ]);
    expect(result.env[IdeWrapperEnvironmentKey.OUTPUT_MODE]).toBe(ErrorOutputEnvironment.PLAIN);
    expect(result.env[IdeWrapperEnvironmentKey.ENTRY_SURFACE]).toBe(IdeEntrySurface.VSCODE);
    expect(result.env[IdeWrapperEnvironmentKey.STANDARDS_PROFILE_ID]).toBe("stage5-ide");
    expect(result.env[IdeWrapperEnvironmentKey.STANDARDS_SOURCES]).toBe(
      IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS.join(","),
    );
    expect(result.env.TEST_ENV).toBe("1");
    expect(result.metadata.command).toBe("check");
    expect(result.metadata.standards.profileId).toBe("stage5-ide");
    expect(result.metadata.standards.sourceIds).toEqual([
      ...IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS,
    ]);
    expect(result.metadata.standards.resolvedSources.at(-1)?.sourceId).toBe(
      IdeStandardsSourceId.AGENTS_PROJECTION,
    );
    expect(result.metadata.standards.resolvedSources.at(-1)?.resolvedPath).toBe("AGENTS.md");
  });

  it("uses defaults for optional fields", () => {
    const wrapper = new IdeCommandWrapper();
    const result = wrapper.wrapCommand({
      command: "init",
    });

    expect(result.argv).toEqual(["node", "./dist/bin/repo-ai-governor.js", "init"]);
    expect(result.metadata.surface).toBe(IdeEntrySurface.GENERIC_IDE);
    expect(result.metadata.outputMode).toBe(ErrorOutputEnvironment.JSON);
    expect(result.metadata.standards.sourceIds.length).toBeGreaterThan(0);
    expect(result.metadata.standards.resolvedSources.length).toBeGreaterThan(0);
    expect(result.metadata.surfaceContract.degradeMode).toBe(
      IdeSurfaceDegradeMode.PRESERVE_BASELINE,
    );
  });

  it.each([
    IdeEntrySurface.VSCODE,
    IdeEntrySurface.JETBRAINS,
    IdeEntrySurface.CURSOR,
    IdeEntrySurface.CLAUDE_CODE,
  ])("keeps metadata and env shape stable for %s", (surface) => {
    const wrapper = new IdeCommandWrapper();
    const result = wrapper.wrapCommand({
      command: "doctor",
      surface,
    });

    expect(result.argv).toEqual(["node", "./dist/bin/repo-ai-governor.js", "doctor"]);
    expect(result.env[IdeWrapperEnvironmentKey.ENTRY_SURFACE]).toBe(surface);
    expect(result.metadata.surface).toBe(surface);
    expect(result.metadata.surfaceContract.surfaceId).toBe(surface);
    expect(result.metadata.surfaceContract.reservedEnvironmentKeys).toEqual([
      ...IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS,
    ]);
    expect(result.metadata.surfaceContract.degradeMode).toBe(
      IdeSurfaceDegradeMode.FALLBACK_TO_GENERIC_IDE,
    );
    expect(result.metadata.nextAction).toBe(result.metadata.surfaceContract.nextAction);
  });

  it("throws when additionalEnv tries to override reserved wrapper env keys", () => {
    const wrapper = new IdeCommandWrapper();

    try {
      wrapper.wrapCommand({
        command: "init",
        additionalEnv: {
          [IdeWrapperEnvironmentKey.OUTPUT_MODE]: "plain",
        },
      });
    } catch (error) {
      expect((error as RuntimeError).code).toBe(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      );
    }
  });

  it("throws standardized wrapper error when command is unsupported", () => {
    const wrapper = new IdeCommandWrapper();

    try {
      wrapper.wrapCommand({
        command: "non-existing-command",
      });
    } catch (error) {
      const standardizedError = standardizeIdeWrapperError(error);
      expect((error as RuntimeError).code).toBe(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      );
      expect(standardizedError.details?.nextAction).toBe(
        "Retry with one of the supported wrapper commands declared by the IDE contract.",
      );
    }
  });

  it("keeps exported surface registry aligned with wrapper defaults", () => {
    const wrapper = new IdeCommandWrapper();
    const genericSurface = IDE_SURFACE_REGISTRY.find(
      (surfaceContract) => surfaceContract.surfaceId === IdeEntrySurface.GENERIC_IDE,
    );

    expect(genericSurface).toBeDefined();
    expect(wrapper.buildStandardsInjection().sourceIds).toContain(
      IdeStandardsSourceId.AGENTS_PROJECTION,
    );
    expect(wrapper.buildStandardsInjection().resolvedSources.at(-1)?.resolvedPath).toBe(
      "AGENTS.md",
    );
    expect(genericSurface?.reservedEnvironmentKeys).toEqual([
      ...IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS,
    ]);
  });
});
