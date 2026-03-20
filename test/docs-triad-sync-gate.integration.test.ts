import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

interface TriadSyncFailure {
  rule_id: string;
  message: string;
  details: Record<string, unknown>;
}

interface TriadSyncResult {
  status: "pass" | "fail";
  failures: TriadSyncFailure[];
  changed_files: string[];
  missing_sync_files: string[];
}

interface TriadSyncOutcome {
  exitCode: number;
  result: TriadSyncResult;
}

const PRD_DOC_PATH = ".repo-ai-governor/normative_knowledge_sources/product-requirements.md";
const SOLUTION_DOC_PATH =
  ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md";
const ARCHITECTURE_DOC_PATH =
  ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md";
const BRIEF_DOC_PATH =
  ".repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md";

const TRIAD_DOC_PATHS = [PRD_DOC_PATH, SOLUTION_DOC_PATH, ARCHITECTURE_DOC_PATH];
const ALL_SYNC_DOC_PATHS = [...TRIAD_DOC_PATHS, BRIEF_DOC_PATH].sort();
const SCRIPT_PATH = resolve(process.cwd(), "scripts/governance/check-docs-triad-sync.js");

/**
 * Executes the docs-triad-sync checker and always returns parsed machine output.
 * Why: smoke tests should assert structured contract fields regardless of pass/fail exit code.
 * @param changedFiles Changed file paths injected into checker.
 * @returns Exit code and parsed JSON payload.
 */
function runDocsTriadSync(changedFiles: string[]): TriadSyncOutcome {
  const commandArgs = [SCRIPT_PATH, "--format", "json"];
  for (const filePath of changedFiles) {
    commandArgs.push("--changed-file", filePath);
  }

  try {
    const stdout = execFileSync(process.execPath, commandArgs, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return {
      exitCode: 0,
      result: JSON.parse(stdout) as TriadSyncResult,
    };
  } catch (error) {
    const commandError = error as {
      status?: number;
      stdout?: string | Buffer;
    };
    const rawStdout =
      typeof commandError.stdout === "string"
        ? commandError.stdout
        : (commandError.stdout?.toString("utf8") ?? "");
    return {
      exitCode: commandError.status ?? 1,
      result: JSON.parse(rawStdout) as TriadSyncResult,
    };
  }
}

describe("docs-triad-sync gate smoke", () => {
  it("passes when triad and brief docs are changed together", () => {
    const outcome = runDocsTriadSync([
      PRD_DOC_PATH,
      SOLUTION_DOC_PATH,
      ARCHITECTURE_DOC_PATH,
      BRIEF_DOC_PATH,
    ]);

    expect(outcome.exitCode).toBe(0);
    expect(outcome.result.status).toBe("pass");
    expect(outcome.result.failures).toHaveLength(0);
    expect(outcome.result.missing_sync_files).toHaveLength(0);
    expect(outcome.result.changed_files).toEqual(ALL_SYNC_DOC_PATHS);
  });

  it("fails when triad docs are not changed together", () => {
    const outcome = runDocsTriadSync([ARCHITECTURE_DOC_PATH]);

    expect(outcome.exitCode).toBe(1);
    expect(outcome.result.status).toBe("fail");
    expect(
      outcome.result.failures.some((failure) => failure.rule_id === "triad_changeset_incomplete"),
    ).toBe(true);
    expect(outcome.result.missing_sync_files).toEqual([PRD_DOC_PATH, SOLUTION_DOC_PATH]);
  });

  it("fails when PRD changed without brief", () => {
    const outcome = runDocsTriadSync([PRD_DOC_PATH, SOLUTION_DOC_PATH, ARCHITECTURE_DOC_PATH]);

    expect(outcome.exitCode).toBe(1);
    expect(outcome.result.status).toBe("fail");
    expect(
      outcome.result.failures.some((failure) => failure.rule_id === "prd_brief_sync_missing"),
    ).toBe(true);
    expect(outcome.result.missing_sync_files).toEqual([BRIEF_DOC_PATH]);
  });
});
