import { AgentCliExecOperation } from "@repo-ai-governor/adapter-sdk";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  CliGithubCopilotExecFixtureEnvironmentKey,
  CliGithubCopilotExecFixtureMode,
} from "../../src/constants/github-copilot-exec-fixture.constant.js";
import { CliGithubCopilotExecFixtureRuntime } from "../../src/runtime/github-copilot-exec-fixture-runtime.js";

describe("Cli github copilot exec fixture runtime", () => {
  it("returns deterministic success runner when fixture gate is enabled", async () => {
    const runtime = new CliGithubCopilotExecFixtureRuntime();
    const runner = runtime.resolveExecRunner({
      [CliGithubCopilotExecFixtureEnvironmentKey.ENABLE_FIXTURES]: "1",
      [CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE]:
        CliGithubCopilotExecFixtureMode.SUCCESS,
    });

    expect(runner).toBeDefined();
    if (!runner) {
      return;
    }
    const result = await runner({
      command: "copilot",
      commandArgumentsPrefix: [],
      cwd: process.cwd(),
      env: process.env,
      prompt: "Respond with exactly OK.",
      timeoutMs: 1000,
      operation: AgentCliExecOperation.PROBE,
    });
    expect(result.stdout).toContain('"content":"OK"');
  });

  it("fails closed when fixture mode is configured without enable flag", () => {
    const runtime = new CliGithubCopilotExecFixtureRuntime();

    expect(() =>
      runtime.resolveExecRunner({
        [CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE]:
          CliGithubCopilotExecFixtureMode.SUCCESS,
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      }),
    );
  });

  it("returns credential failure runner", async () => {
    const runtime = new CliGithubCopilotExecFixtureRuntime();
    const runner = runtime.resolveExecRunner({
      [CliGithubCopilotExecFixtureEnvironmentKey.ENABLE_FIXTURES]: "1",
      [CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE]:
        CliGithubCopilotExecFixtureMode.CREDENTIAL_MISSING,
    });
    expect(runner).toBeDefined();
    if (!runner) {
      return;
    }

    await expect(
      runner({
        command: "copilot",
        commandArgumentsPrefix: [],
        cwd: process.cwd(),
        env: process.env,
        prompt: "Respond with exactly OK.",
        timeoutMs: 1000,
        operation: AgentCliExecOperation.PROBE,
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
    });
  });
});
