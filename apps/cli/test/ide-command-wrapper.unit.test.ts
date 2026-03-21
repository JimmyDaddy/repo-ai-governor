import {
  ErrorOutputEnvironment,
  GovernorErrorCode,
  type RuntimeError,
} from "@repo-ai-governor/shared";
import {
  IdeEntrySurface,
  IdeWrapperEnvironmentKey,
} from "../src/constants/ide-command-wrapper.constant.js";
import { IdeCommandWrapper } from "../src/main.js";

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
    expect(result.env[IdeWrapperEnvironmentKey.STANDARDS_SOURCES]).toContain("AGENTS.md");
    expect(result.env.TEST_ENV).toBe("1");
    expect(result.metadata.command).toBe("check");
    expect(result.metadata.standards.profileId).toBe("stage5-ide");
  });

  it("uses defaults for optional fields", () => {
    const wrapper = new IdeCommandWrapper();
    const result = wrapper.wrapCommand({
      command: "init",
    });

    expect(result.argv).toEqual(["node", "./dist/bin/repo-ai-governor.js", "init"]);
    expect(result.metadata.surface).toBe(IdeEntrySurface.GENERIC_IDE);
    expect(result.metadata.outputMode).toBe(ErrorOutputEnvironment.JSON);
    expect(result.metadata.standards.sources.length).toBeGreaterThan(0);
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
      expect((error as RuntimeError).code).toBe(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      );
    }
  });
});
