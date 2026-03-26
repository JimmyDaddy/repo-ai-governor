import { runCli } from "../src/main.js";

/**
 * Creates in-memory IO adapters for CLI integration tests.
 * @returns Buffers and io adapters used by the CLI runtime.
 */
function createBufferedIo(): {
  stdoutBuffer: string[];
  stderrBuffer: string[];
  io: {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
    cwd: () => string;
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
    },
  };
}

describe("CLI command integration", () => {
  it("prints executable init output for workspace bootstrap", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo();

    const exitCode = await runCli(["node", "repo-ai-governor", "--locale", "en-US", "init"], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join("")).toBe("");
    expect(stdoutBuffer.join("")).toContain("Initialized workspace at");
    expect(stdoutBuffer.join("")).toContain("operation=workspace_init");
    expect(stdoutBuffer.join("")).toContain("outputMode=plain");
    expect(stdoutBuffer.join("")).toContain("verbosity=normal");
  });

  it("shows help with all Stage-1 commands", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo();

    const exitCode = await runCli(["node", "repo-ai-governor", "--help"], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join("")).toBe("");
    expect(stdoutBuffer.join("")).toContain("connect");
    expect(stdoutBuffer.join("")).toContain("review-verify");
    expect(stdoutBuffer.join("")).toContain("verify");
    expect(stdoutBuffer.join("")).toContain("upgrade");
    expect(stdoutBuffer.join("")).toContain("workspace");
  });
});
