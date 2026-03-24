import { GovernorErrorCode, type RuntimeError } from "@repo-ai-governor/shared";
import {
  CliCodexExecFixtureEnvironmentKey,
  CliCodexExecFixtureMode,
} from "../../src/constants/codex-exec-fixture.constant.js";
import { CliCodexExecFixtureRuntime } from "../../src/runtime/codex-exec-fixture-runtime.js";

describe("Cli codex exec fixture runtime", () => {
  it("returns one deterministic success runner for success fixture mode", async () => {
    const runtime = new CliCodexExecFixtureRuntime();

    const runner = runtime.resolveExecRunner({
      [CliCodexExecFixtureEnvironmentKey.ENABLE_FIXTURES]: "1",
      [CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE]: CliCodexExecFixtureMode.SUCCESS,
    });

    expect(runner).toBeDefined();
    const result = await runner?.({
      command: "codex",
      cwd: process.cwd(),
      env: process.env,
      prompt: "probe",
      timeoutMs: 1000,
      operation: "probe",
    });

    expect(result?.exitCode).toBe(0);
    expect(result?.stdout).toContain('"type":"item.completed"');
  });

  it("rejects unsupported fixture mode values", () => {
    const runtime = new CliCodexExecFixtureRuntime();

    expect(() =>
      runtime.resolveExecRunner({
        [CliCodexExecFixtureEnvironmentKey.ENABLE_FIXTURES]: "1",
        [CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE]: "invalid",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<RuntimeError>>({
        code: GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      }),
    );
  });

  it("rejects fixture override when test fixtures are not explicitly enabled", () => {
    const runtime = new CliCodexExecFixtureRuntime();

    expect(() =>
      runtime.resolveExecRunner({
        [CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE]: CliCodexExecFixtureMode.SUCCESS,
      }),
    ).toThrowError(
      expect.objectContaining<Partial<RuntimeError>>({
        code: GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      }),
    );
  });
});
