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

describe("CLI skeleton integration", () => {
  it("prints command skeleton output for init", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo();

    const exitCode = await runCli(["node", "repo-ai-governor", "--locale", "en-US", "init"], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join("")).toBe("");
    expect(stdoutBuffer.join("")).toContain("Command 'init' skeleton executed");
    expect(stdoutBuffer.join("")).toContain("outputMode=plain");
    expect(stdoutBuffer.join("")).toContain("verbosity=normal");
  });

  it("shows help with all Stage-1 commands", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo();

    const exitCode = await runCli(["node", "repo-ai-governor", "--help"], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join("")).toBe("");
    expect(stdoutBuffer.join("")).toContain("review-verify");
    expect(stdoutBuffer.join("")).toContain("upgrade");
  });
});
