import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Resolves a runnable CLI command for e2e validation.
 * Why: `test:e2e` may run before or after `dist` build artifacts exist.
 * @returns Command and arguments used for e2e invocation.
 */
function resolveCliInvocation(): {
  command: string;
  args: string[];
} {
  const distEntry = resolve(process.cwd(), "dist/bin/repo-ai-governor.js");
  if (existsSync(distEntry)) {
    return {
      command: process.execPath,
      args: [distEntry, "--help"],
    };
  }

  return {
    command: "pnpm",
    args: ["run", "help"],
  };
}

describe("CLI help e2e", () => {
  it("prints stable help output from runtime entrypoint", () => {
    const invocation = resolveCliInvocation();
    const result = spawnSync(invocation.command, invocation.args, {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Usage: repo-ai-governor");
    expect(result.stdout).toContain("Commands:");
    expect(result.stderr).toBe("");
  });
});
