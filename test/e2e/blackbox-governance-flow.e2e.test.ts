import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runUnattendedDeliveryScenario } from "../../scripts/ci/stage9-blackbox-ga-lib.js";

interface CliSuccessPayload {
  status?: string;
  command_result?: {
    operation?: string;
    artifacts?: Array<{
      id?: string;
      path?: string;
    }>;
    check_totals?: {
      pass?: number;
      warn?: number;
      fail?: number;
    };
  };
}

interface BlackboxScenario {
  repositoryPath: string;
  runtimeEnv: NodeJS.ProcessEnv;
}

let cliEntryPath = "";

/**
 * Resolves a runnable dist entry for blackbox CLI validation.
 * Why: e2e should execute the packaged runtime entrypoint rather than in-process mocks.
 */
function resolveCliEntryPath(): string {
  const distEntryPath = resolve(process.cwd(), "dist/bin/repo-ai-governor.js");
  if (!existsSync(distEntryPath)) {
    const build = spawnSync("pnpm", ["run", "build"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(build.status).toBe(0);
  }

  return distEntryPath;
}

/**
 * Creates an isolated repository/runtime home pair for one blackbox scenario.
 * Why: each path should run with independent workspace state to avoid cross-test coupling.
 */
function createBlackboxScenario(prefix: string): BlackboxScenario {
  const scenarioRoot = mkdtempSync(join(tmpdir(), `repo-ai-governor-${prefix}-`));
  const repositoryPath = resolve(scenarioRoot, "target-repo");
  const homePath = resolve(scenarioRoot, "home");
  mkdirSync(repositoryPath, { recursive: true });
  mkdirSync(homePath, { recursive: true });
  writeFileSync(
    resolve(repositoryPath, "package.json"),
    `${JSON.stringify(
      {
        name: "repo-ai-governor-blackbox-e2e",
        private: true,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return {
    repositoryPath,
    runtimeEnv: {
      ...process.env,
      HOME: homePath,
      XDG_CONFIG_HOME: resolve(homePath, ".config"),
      XDG_CACHE_HOME: resolve(homePath, ".cache"),
      XDG_DATA_HOME: resolve(homePath, ".local", "share"),
    },
  };
}

/**
 * Executes one CLI command and parses JSON output.
 * Why: blackbox assertions should validate real process boundaries and stable output contracts.
 */
function executeCliJsonCommand(options: {
  scenario: BlackboxScenario;
  args: string[];
}): CliSuccessPayload {
  const result = spawnSync(process.execPath, [cliEntryPath, "--output", "json", ...options.args], {
    cwd: options.scenario.repositoryPath,
    env: options.scenario.runtimeEnv,
    encoding: "utf8",
  });

  expect(result.status).toBe(0);
  expect(result.stdout.trim().length).toBeGreaterThan(0);
  return JSON.parse(result.stdout) as CliSuccessPayload;
}

/**
 * Resolves artifact path by id from one command payload.
 * Why: replay/report chain assertions need deterministic artifact lookup by contract id.
 */
function resolveArtifactPath(payload: CliSuccessPayload, artifactId: string): string | undefined {
  return payload.command_result?.artifacts?.find((artifact) => artifact.id === artifactId)?.path;
}

describe("CLI blackbox governance flow e2e", () => {
  beforeAll(() => {
    cliEntryPath = resolveCliEntryPath();
    expect(existsSync(cliEntryPath)).toBe(true);
  });

  it("covers read-only-safe bootstrap path: init -> doctor -> check without mutating repo root", () => {
    const scenario = createBlackboxScenario("blackbox-readonly-safe");
    const initialEntries = readdirSync(scenario.repositoryPath).sort();

    const initPayload = executeCliJsonCommand({
      scenario,
      args: ["init"],
    });
    const doctorPayload = executeCliJsonCommand({
      scenario,
      args: ["doctor"],
    });
    const checkPayload = executeCliJsonCommand({
      scenario,
      args: ["check"],
    });

    const finalEntries = readdirSync(scenario.repositoryPath).sort();

    expect(initPayload.status).toBe("success");
    expect(initPayload.command_result?.operation).toBe("workspace_init");
    expect(doctorPayload.status).toBe("success");
    expect(doctorPayload.command_result?.operation).toBe("env_doctor");
    expect(checkPayload.status).toBe("success");
    expect(checkPayload.command_result?.operation).toBe("governance_check");
    expect(checkPayload.command_result?.check_totals?.fail ?? 0).toBe(0);
    expect(finalEntries).toEqual(initialEntries);
  });

  it("covers governance chain path: plan -> run -> review -> review-verify -> replay", () => {
    const scenario = createBlackboxScenario("blackbox-governance-chain");

    const planPayload = executeCliJsonCommand({
      scenario,
      args: ["plan"],
    });
    const runPayload = executeCliJsonCommand({
      scenario,
      args: ["--adapters", "--dry-run", "--trace", "run"],
    });
    const reviewPayload = executeCliJsonCommand({
      scenario,
      args: ["review"],
    });
    const reviewVerifyPayload = executeCliJsonCommand({
      scenario,
      args: ["review-verify"],
    });

    const reportPath = resolveArtifactPath(runPayload, "execution_report");
    const replayPath = resolveArtifactPath(runPayload, "replay_explain");

    expect(planPayload.status).toBe("success");
    expect(planPayload.command_result?.operation).toBe("plan_snapshot");
    expect(runPayload.status).toBe("success");
    expect(runPayload.command_result?.operation).toBe("governance_run");
    expect(typeof reportPath).toBe("string");
    expect(typeof replayPath).toBe("string");
    expect(existsSync(String(reportPath))).toBe(true);
    expect(existsSync(String(replayPath))).toBe(true);
    expect(reviewPayload.status).toBe("success");
    expect(reviewPayload.command_result?.operation).toBe("review_queue");
    expect(reviewVerifyPayload.status).toBe("success");
    expect(reviewVerifyPayload.command_result?.operation).toBe("review_verify");

    const replayPayload = executeCliJsonCommand({
      scenario,
      args: ["--replay", String(replayPath), "run"],
    });
    expect(replayPayload.status).toBe("success");
    expect(replayPayload.command_result?.operation).toBe("governance_run_replay");
  });

  it("covers Stage 9 task-driven delivery path with replay-linked rehearsal artifacts", async () => {
    const scenarioSummary = await runUnattendedDeliveryScenario({
      cliEntryPath,
    });

    expect(scenarioSummary.status).toBe("passed");
    expect(scenarioSummary.runtimeStatus).toBe("succeeded");
    expect(scenarioSummary.assemblyMode).toBe("task_driven");
    expect(scenarioSummary.deliveryRehearsalEnabled).toBe(true);
    expect(scenarioSummary.deliveryRehearsalStatus).toBe("applied");
    expect(scenarioSummary.inlineReviewChainStatus).toBe("applied");
    expect(typeof scenarioSummary.reportPath).toBe("string");
    expect(typeof scenarioSummary.replayPath).toBe("string");
    expect(typeof scenarioSummary.deliveryRehearsalPath).toBe("string");
  });
});
