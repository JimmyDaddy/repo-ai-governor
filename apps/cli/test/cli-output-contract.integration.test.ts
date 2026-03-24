import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { runCli } from "../src/main.js";

/**
 * Creates buffered IO adapters for output-contract integration tests.
 * @param isStdoutTty Whether runtime stdout should be treated as TTY.
 * @returns Buffers and IO adapters used by CLI runtime.
 */
function createBufferedIo(
  isStdoutTty: boolean,
  currentWorkingDirectory: string = process.cwd(),
): {
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
      cwd: () => currentWorkingDirectory,
      isStdoutTty: () => isStdoutTty,
    },
  };
}

/**
 * Creates one temporary git repository with migration-like changed path for policy-gate testing.
 * @returns Temporary repository absolute path.
 */
async function createPolicyGateFixtureRepo(): Promise<string> {
  const temporaryRepositoryRoot = await mkdtemp(resolve(tmpdir(), "cli-output-policy-"));
  execFileSync("git", ["init"], {
    cwd: temporaryRepositoryRoot,
    stdio: "ignore",
  });
  await mkdir(resolve(temporaryRepositoryRoot, "migrations"), { recursive: true });
  await writeFile(
    resolve(temporaryRepositoryRoot, "migrations", "001.sql"),
    "-- migration\n",
    "utf8",
  );
  return temporaryRepositoryRoot;
}

/**
 * Creates one temporary repo with profile-level adapters tool override and no base adapters block.
 * @returns Temporary repository absolute path.
 */
async function createProfileOnlyAdaptersFixtureRepo(): Promise<string> {
  const temporaryRepositoryRoot = await mkdtemp(resolve(tmpdir(), "cli-output-profile-adapters-"));
  const workspaceRoot = resolve(temporaryRepositoryRoot, ".repo-ai-governor");
  await mkdir(workspaceRoot, { recursive: true });
  await writeFile(
    resolve(workspaceRoot, "governor.yaml"),
    [
      'schemaVersion: "1.1"',
      "workspace:",
      "  mode: repo_local",
      "  migrationPolicy: copy_verify_switch_rollback",
      "i18n:",
      "  runtimeEngine: i18next",
      "  defaultLocale: zh-CN",
      "  fallbackLocale: en-US",
      "  supportedLocales:",
      "    - zh-CN",
      "    - en-US",
      "profiles:",
      "  tool-only:",
      "    adapters:",
      "      tools:",
      "        - toolId: github-copilot",
      "          enabled: true",
      "          availability: degraded",
      "",
    ].join("\n"),
    "utf8",
  );
  return temporaryRepositoryRoot;
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

  it("collapses pretty output detail blocks when --compact is enabled", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true);

    const exitCode = await runCli(
      [
        "node",
        "repo-ai-governor",
        "--locale",
        "en-US",
        "--output",
        "pretty",
        "--compact",
        "--no-color",
        "init",
      ],
      io,
    );

    const stdout = stdoutBuffer.join("");

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join("")).toBe("");
    expect(stdout).toContain("Summary");
    expect(stdout).toContain("Artifacts");
    expect(stdout).toContain("artifact(s) generated.");
    expect(stdout).toContain("Primary:");
    expect(stdout).toContain("Context");
    expect(stdout).toContain("Locale=en-US");
    expect(stdout).not.toContain("Output mode:");
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

  it("maps replay-input failures to dedicated next action with structured replay_path", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);
    const missingReplayPath = resolve(process.cwd(), `.tmp-missing-replay-${Date.now()}.json`);

    const exitCode = await runCli(
      ["node", "repo-ai-governor", "--output", "json", "run", "--replay", missingReplayPath],
      io,
    );
    const payload = JSON.parse(stderrBuffer.join(""));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join("")).toBe("");
    expect(payload.error_code).toBe("REPORT_REPLAY_INPUT_INVALID");
    expect(payload.next_action).toBe("check_replay_source");
    expect(payload.error_details.replay_path).toBe(missingReplayPath);
  });

  it("maps policy-gated run failures to policy diagnostics next action", async () => {
    const fixtureRepositoryRoot = await createPolicyGateFixtureRepo();
    try {
      const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, fixtureRepositoryRoot);
      const exitCode = await runCli(["node", "repo-ai-governor", "--output", "json", "run"], io);
      const payload = JSON.parse(stderrBuffer.join(""));

      expect(exitCode).toBe(1);
      expect(stdoutBuffer.join("")).toBe("");
      expect(["POLICY_GATE_HITL_FEEDBACK_INVALID", "POLICY_GATE_EVALUATION_FAILED"]).toContain(
        payload.error_code,
      );
      expect(payload.next_action).toBe("inspect_policy_diagnostics");
      expect(typeof payload.error_details.report_path).toBe("string");
      expect(typeof payload.error_details.replay_path).toBe("string");
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it("parses HITL decision receipt flags from CLI argv and resumes run", async () => {
    const fixtureRepositoryRoot = await createPolicyGateFixtureRepo();
    try {
      const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, fixtureRepositoryRoot);
      const exitCode = await runCli(
        [
          "node",
          "repo-ai-governor",
          "--output",
          "json",
          "run",
          "--hitl-decision",
          "approve",
          "--hitl-decision-reason",
          "Maintainer approved unattended continuation.",
          "--hitl-decided-by",
          "maintainer@example.com",
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(""));

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join("")).toBe("");
      expect(payload.status).toBe("success");
      expect(payload.command_result.operation).toBe("governance_run");
      expect(payload.command_result.details.original_policy_outcome).toBe("escalate");
      expect(payload.command_result.details.effective_policy_outcome).toBe("allow");
      expect(payload.command_result.details.hitl_decision).toBe("approve");
      expect(payload.command_result.details.hitl_resume_action).toBe("resume");
      expect(typeof payload.command_result.details.hitl_decision_receipt_path).toBe("string");
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it("rejects unsupported HITL decision option values", async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ["node", "repo-ai-governor", "--output", "json", "run", "--hitl-decision", "invalid"],
      io,
    );
    const payload = JSON.parse(stderrBuffer.join(""));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join("")).toBe("");
    expect(payload.error_code).toBe("ENTRYPOINT_COMMAND_WRAPPER_INVALID");
    expect(payload.command).toBe("run");
  });

  it("keeps default adapter baseline when profile only overrides tools", async () => {
    const fixtureRepositoryRoot = await createProfileOnlyAdaptersFixtureRepo();
    try {
      const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, fixtureRepositoryRoot);
      const exitCode = await runCli(
        [
          "node",
          "repo-ai-governor",
          "--output",
          "json",
          "--profile",
          "tool-only",
          "verify",
          "--adapters",
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(""));

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join("")).toBe("");
      expect(payload.status).toBe("success");
      expect(payload.command_result.operation).toBe("adapter_verify");
      expect(payload.command_result.details.required_roles).toBeGreaterThan(0);
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });
});
