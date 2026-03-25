import { AgentCliExecOperation } from "@repo-ai-governor/adapter-sdk";
import { GovernorErrorCode } from "@repo-ai-governor/shared";
import {
  CliClaudeCodeExecFixtureEnvironmentKey,
  CliClaudeCodeExecFixtureMode,
} from "../../src/constants/claude-code-exec-fixture.constant.js";
import { CliClaudeCodeExecFixtureRuntime } from "../../src/runtime/claude-code-exec-fixture-runtime.js";

describe("Cli claude code exec fixture runtime", () => {
  it("returns deterministic success runner when fixture gate is enabled", async () => {
    const runtime = new CliClaudeCodeExecFixtureRuntime();
    const runner = runtime.resolveExecRunner({
      [CliClaudeCodeExecFixtureEnvironmentKey.ENABLE_FIXTURES]: "1",
      [CliClaudeCodeExecFixtureEnvironmentKey.EXEC_FIXTURE]: CliClaudeCodeExecFixtureMode.SUCCESS,
    });

    expect(runner).toBeDefined();
    if (!runner) {
      return;
    }
    const result = await runner({
      command: "claude",
      commandArgumentsPrefix: [],
      cwd: process.cwd(),
      env: process.env,
      prompt: "Respond with exactly OK.",
      timeoutMs: 1000,
      operation: AgentCliExecOperation.PROBE,
    });
    expect(result.stdout).toContain("OK");
  });

  it("fails closed when fixture mode is configured without enable flag", () => {
    const runtime = new CliClaudeCodeExecFixtureRuntime();

    expect(() =>
      runtime.resolveExecRunner({
        [CliClaudeCodeExecFixtureEnvironmentKey.EXEC_FIXTURE]: CliClaudeCodeExecFixtureMode.SUCCESS,
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      }),
    );
  });

  it("returns credential failure runner", async () => {
    const runtime = new CliClaudeCodeExecFixtureRuntime();
    const runner = runtime.resolveExecRunner({
      [CliClaudeCodeExecFixtureEnvironmentKey.ENABLE_FIXTURES]: "1",
      [CliClaudeCodeExecFixtureEnvironmentKey.EXEC_FIXTURE]:
        CliClaudeCodeExecFixtureMode.CREDENTIAL_MISSING,
    });

    expect(runner).toBeDefined();
    if (!runner) {
      return;
    }

    await expect(
      runner({
        command: "claude",
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
