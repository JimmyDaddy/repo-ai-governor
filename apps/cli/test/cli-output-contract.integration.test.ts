import { runCli } from "../src/main.js";

/**
 * Creates buffered IO adapters for output-contract integration tests.
 * @param isStdoutTty Whether runtime stdout should be treated as TTY.
 * @returns Buffers and IO adapters used by CLI runtime.
 */
function createBufferedIo(isStdoutTty: boolean): {
  stdoutBuffer: string[];
  stderrBuffer: string[];
  io: {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
    cwd: () => string;
    isStdoutTty: () => boolean;
  };
} {
  const stdoutBuffer: string[] = [];
  const stderrBuffer: string[] = [];

  return {
    stdoutBuffer,
    stderrBuffer,
    io: {
      stdout: (value: string) => {
        stdoutBuffer.push(value);
      },
      stderr: (value: string) => {
        stderrBuffer.push(value);
      },
      cwd: () => process.cwd(),
      isStdoutTty: () => isStdoutTty,
    },
  };
}

describe("CLI output contract integration", () => {
  it("renders stable JSON schema in --output json mode", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ["node", "repo-ai-governor", "--locale", "en-US", "--output", "json", "init"],
      io,
    );

    const payload = JSON.parse(stdoutBuffer.join(""));

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join("")).toBe("");
    expect(payload.schema_version).toBe("cli_output_v1");
    expect(payload.status).toBe("success");
    expect(payload.output_mode).toBe("json");
    expect(payload.verbosity).toBe("normal");
    expect(payload.command).toBe("init");
    expect(payload.runtime.is_tty).toBe(false);
    expect(payload.runtime.downgraded_from).toBeNull();
    expect(payload.message).toContain("Initialized workspace at");
    expect(payload.command_result.operation).toBe("workspace_init");
  });

  it("downgrades pretty to plain in non-TTY environment", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ["node", "repo-ai-governor", "--locale", "en-US", "--output", "pretty", "init"],
      io,
    );

    const stdout = stdoutBuffer.join("");

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join("")).toBe("");
    expect(stdout).toContain("outputMode=plain");
    expect(stdout).not.toContain("\u001b[");
  });

  it("honors --no-color in pretty mode when stdout is TTY", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true);

    const exitCode = await runCli(
      ["node", "repo-ai-governor", "--locale", "en-US", "--output", "pretty", "--no-color", "init"],
      io,
    );

    const stdout = stdoutBuffer.join("");

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join("")).toBe("");
    expect(stdout).toContain("repo-ai-governor: command succeeded");
    expect(stdout).not.toContain("\u001b[");
  });

  it("outputs structured error fields in JSON mode for invalid command", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ["node", "repo-ai-governor", "--output", "json", "unknown-command"],
      io,
    );

    const payload = JSON.parse(stderrBuffer.join(""));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join("")).toBe("");
    expect(payload.schema_version).toBe("cli_output_v1");
    expect(payload.status).toBe("error");
    expect(payload.output_mode).toBe("json");
    expect(payload.error_code).toBe("ENTRYPOINT_COMMAND_WRAPPER_INVALID");
    expect(payload.hint).toContain("Command name or option values");
    expect(payload.next_action).toBe("check_command_usage");
    expect(payload.command).toBe("unknown-command");
  });

  it("keeps JSON error contract when another global option fails validation", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ["node", "repo-ai-governor", "--output", "json", "--verbosity", "invalid", "init"],
      io,
    );

    const payload = JSON.parse(stderrBuffer.join(""));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join("")).toBe("");
    expect(payload.status).toBe("error");
    expect(payload.output_mode).toBe("json");
    expect(payload.error_code).toBe("ENTRYPOINT_COMMAND_WRAPPER_INVALID");
    expect(payload.command).toBe("init");
  });

  it("reduces diagnostics noise in quiet mode", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      [
        "node",
        "repo-ai-governor",
        "--locale",
        "en-US",
        "--output",
        "plain",
        "--verbosity",
        "quiet",
        "init",
      ],
      io,
    );

    const stdout = stdoutBuffer.join("");

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join("")).toBe("");
    expect(stdout).toContain("Initialized workspace at");
    expect(stdout).toContain("outputMode=plain");
    expect(stdout).not.toContain("workspaceRoot=");
    expect(stdout).not.toContain("memoryStoreRoot=");
    expect(stdout).not.toContain("verbosity=");
  });
});
