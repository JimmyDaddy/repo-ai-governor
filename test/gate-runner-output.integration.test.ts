import { type ExecFileException, execFile } from "node:child_process";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const REPOSITORY_ROOT_PATH = resolve(fileURLToPath(new URL("..", import.meta.url)));

/**
 * Creates a fake `pnpm` executable so gate-runner tests can assert wrapper
 * behavior without executing the full repository gate graph.
 * @param options Script exit behavior override.
 * @returns {Promise<string>}
 */
async function createFakePnpmBinDirectory(
  options: { exitCode?: number; stderrMessage?: string } = {},
) {
  const tempRoot = await mkdtemp(resolve(tmpdir(), "gate-runner-pnpm-"));
  const fakePnpmPath = resolve(tempRoot, "pnpm");
  const exitCode = options.exitCode ?? 0;
  const stderrMessage = options.stderrMessage ?? "";

  await writeFile(
    fakePnpmPath,
    `#!/bin/sh
if [ "$1" = "run" ]; then
  if [ ${exitCode} -ne 0 ]; then
    cat >&2 <<'__REPO_AI_GOVERNOR_FAKE_PNPM_STDERR__'
${stderrMessage}
__REPO_AI_GOVERNOR_FAKE_PNPM_STDERR__
  fi
  exit ${exitCode}
fi
echo "unexpected pnpm args: $*" >&2
exit 1
`,
    "utf8",
  );
  await chmod(fakePnpmPath, 0o755);

  return tempRoot;
}

describe("gate runner wrappers", () => {
  it("prints pure JSON to stdout for repo-global json output mode", async () => {
    const fakePnpmBinDirectory = await createFakePnpmBinDirectory();

    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        ["./scripts/ci/run-repo-global-gates.js", "--group", "governance", "--output", "json"],
        {
          cwd: REPOSITORY_ROOT_PATH,
          env: {
            ...process.env,
            PATH: `${fakePnpmBinDirectory}:${process.env.PATH ?? ""}`,
          },
        },
      );

      expect(stderr).toBe("");
      expect(stdout.trimStart().startsWith("{")).toBe(true);

      const summary = JSON.parse(stdout) as {
        group: string;
        profile: string;
        total: number;
        gates: Array<{ status: string }>;
      };

      expect(summary.profile).toBe("repo-global");
      expect(summary.group).toBe("governance");
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.gates.every((gate) => gate.status === "passed")).toBe(true);
    } finally {
      await rm(fakePnpmBinDirectory, { recursive: true, force: true });
    }
  });

  it("returns an explicit deferred message for the affected profile", async () => {
    try {
      await execFileAsync(
        process.execPath,
        ["./scripts/ci/run-gate-check.js", "--profile", "affected"],
        {
          cwd: REPOSITORY_ROOT_PATH,
        },
      );
      expect.unreachable("Expected affected profile to be rejected as deferred.");
    } catch (error) {
      const execError = error as ExecFileException & { stderr: string; stdout: string };

      expect(execError.code).toBe(2);
      expect(execError.stdout).toBe("");
      expect(execError.stderr).toContain('Profile "affected" is reserved but not implemented');
      expect(execError.stderr).toContain(
        "sprint-003-project-references-affected-check-and-ci-matrix",
      );
      expect(execError.stderr).toContain("TK-287");
    }
  });

  it("keeps extended stderr context in repo-global JSON failure output", async () => {
    const longStderr = Array.from({ length: 40 }, (_, index) => {
      return `gate failure line ${String(index).padStart(2, "0")} ${"x".repeat(48)}`;
    }).join("\n");
    const fakePnpmBinDirectory = await createFakePnpmBinDirectory({
      exitCode: 1,
      stderrMessage: longStderr,
    });

    try {
      await execFileAsync(
        process.execPath,
        ["./scripts/ci/run-repo-global-gates.js", "--group", "governance", "--output", "json"],
        {
          cwd: REPOSITORY_ROOT_PATH,
          env: {
            ...process.env,
            PATH: `${fakePnpmBinDirectory}:${process.env.PATH ?? ""}`,
          },
        },
      );
      expect.unreachable("Expected repo-global gate wrapper to exit non-zero.");
    } catch (error) {
      const execError = error as ExecFileException & { stderr: string; stdout: string };
      const summary = JSON.parse(execError.stdout) as {
        failed: number;
        gates: Array<{ status: string; error?: string }>;
      };
      const firstFailedGate = summary.gates.find((gate) => gate.status === "failed");

      expect(execError.code).toBe(1);
      expect(execError.stderr).toBe("");
      expect(summary.failed).toBeGreaterThan(0);
      expect(firstFailedGate?.error).toContain("gate failure line 00");
      expect(firstFailedGate?.error).toContain("gate failure line 10");
      expect(firstFailedGate?.error).toContain("gate failure line 20");
    }
  });
});
