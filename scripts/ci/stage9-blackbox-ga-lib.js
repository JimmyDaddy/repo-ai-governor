import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const FIXTURE_PROJECT_ID = "project-stage9-blackbox";
const FIXTURE_SPRINT_ID = "sprint-001-unattended-ga";
const DEFAULT_LOCAL_MODEL = "qwen2.5-coder:7b";
const CODEX_EXEC_FIXTURE_ENABLE_ENV_KEY = "REPO_AI_GOVERNOR_ENABLE_TEST_FIXTURES";
const CODEX_EXEC_FIXTURE_ENV_KEY = "REPO_AI_GOVERNOR_CODEX_EXEC_FIXTURE";
const CODEX_EXEC_FIXTURE_SUCCESS = "success";
const GITHUB_COPILOT_EXEC_FIXTURE_ENV_KEY = "REPO_AI_GOVERNOR_GITHUB_COPILOT_EXEC_FIXTURE";
const GITHUB_COPILOT_EXEC_FIXTURE_SUCCESS = "success";

/**
 * Resolves a runnable CLI dist entry for blackbox validation.
 * @returns {string}
 */
export function resolveCliEntryPath() {
  const distEntryPath = resolve(process.cwd(), "dist/bin/repo-ai-governor.js");
  if (existsSync(distEntryPath)) {
    return distEntryPath;
  }

  const buildResult = spawnSync("pnpm", ["run", "build"], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
  });

  if (buildResult.status !== 0) {
    throw new Error(`failed to build dist entry (exit=${buildResult.status ?? "unknown"})`);
  }

  if (!existsSync(distEntryPath)) {
    throw new Error(`dist entry is missing after build: ${distEntryPath}`);
  }

  return distEntryPath;
}

/**
 * Creates one isolated repository/home fixture for blackbox scenarios.
 * @param {string} prefix Scenario prefix for temp directory naming.
 * @returns {{
 *   repositoryPath: string;
 *   workspaceRoot: string;
 *   runtimeEnv: NodeJS.ProcessEnv;
 * }}
 */
export function createBlackboxScenario(prefix) {
  const scenarioRoot = mkdtempSync(join(tmpdir(), `repo-ai-governor-${prefix}-`));
  const repositoryPath = resolve(scenarioRoot, "target-repo");
  const homePath = resolve(scenarioRoot, "home");
  const workspaceRoot = resolve(repositoryPath, ".repo-ai-governor");

  mkdirSync(repositoryPath, { recursive: true });
  mkdirSync(homePath, { recursive: true });
  mkdirSync(workspaceRoot, { recursive: true });

  writeFileSync(
    resolve(repositoryPath, "package.json"),
    `${JSON.stringify(
      {
        name: "repo-ai-governor-stage9-blackbox",
        private: true,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return {
    repositoryPath,
    workspaceRoot,
    runtimeEnv: {
      ...process.env,
      HOME: homePath,
      XDG_CONFIG_HOME: resolve(homePath, ".config"),
      XDG_CACHE_HOME: resolve(homePath, ".cache"),
      XDG_DATA_HOME: resolve(homePath, ".local", "share"),
      [CODEX_EXEC_FIXTURE_ENABLE_ENV_KEY]: "1",
      [CODEX_EXEC_FIXTURE_ENV_KEY]: CODEX_EXEC_FIXTURE_SUCCESS,
      [GITHUB_COPILOT_EXEC_FIXTURE_ENV_KEY]: GITHUB_COPILOT_EXEC_FIXTURE_SUCCESS,
    },
  };
}

/**
 * Writes repo-local workspace config and current-context fixture.
 * @param {{
 *   workspaceRoot: string;
 *   localModelEndpoint?: string | null;
 *   contextWindowOnlyRoles?: boolean;
 *   localModelMaxRetries?: number;
 * }} options Fixture config options.
 */
export function writeRepoLocalFixtureConfig(options) {
  mkdirSync(resolve(options.workspaceRoot, "context"), { recursive: true });
  const governorConfigLines = [
    'schemaVersion: "1.1"',
    "workspace:",
    "  mode: repo_local",
    "  migrationPolicy: copy_verify_switch_rollback",
    "i18n:",
    "  runtimeEngine: i18next",
    "  defaultLocale: en-US",
    "  fallbackLocale: en-US",
    "  supportedLocales:",
    "    - en-US",
    "memory:",
    "  storeEngine: fs_csv",
    "  storeRoot: context/memory",
  ];

  if (typeof options.localModelEndpoint === "string" && options.localModelEndpoint.length > 0) {
    const requiredCapabilities = options.contextWindowOnlyRoles
      ? "[context_window]"
      : "[tool_calling]";
    governorConfigLines.push(
      "adapters:",
      "  roles:",
      "    - roleId: planner",
      "      roleProfileId: planner-default",
      `      requiredCapabilities: ${requiredCapabilities}`,
      "      required: true",
      "    - roleId: architect",
      "      roleProfileId: architect-default",
      `      requiredCapabilities: ${requiredCapabilities}`,
      "      required: true",
      "    - roleId: coder",
      "      roleProfileId: coder-default",
      `      requiredCapabilities: ${requiredCapabilities}`,
      "      required: true",
      "    - roleId: tester",
      "      roleProfileId: tester-default",
      `      requiredCapabilities: ${requiredCapabilities}`,
      "      required: true",
      "    - roleId: reviewer",
      "      roleProfileId: reviewer-default",
      `      requiredCapabilities: ${requiredCapabilities}`,
      "      required: true",
      "    - roleId: verifier",
      "      roleProfileId: verifier-default",
      `      requiredCapabilities: ${requiredCapabilities}`,
      "      required: true",
      "  routing:",
      "    roleBindings:",
      "      planner:",
      "        primarySurface: codex",
      "        fallbackSurfaces: [claude-code, github-copilot]",
      "      architect:",
      "        primarySurface: codex",
      "        fallbackSurfaces: [claude-code, github-copilot]",
      "      coder:",
      "        primarySurface: codex",
      "        fallbackSurfaces: [github-copilot, claude-code]",
      "      tester:",
      "        primarySurface: github-copilot",
      "        fallbackSurfaces: [codex, claude-code]",
      "      reviewer:",
      "        primarySurface: claude-code",
      "        fallbackSurfaces: [codex, github-copilot]",
      "      verifier:",
      "        primarySurface: codex",
      "        fallbackSurfaces: [claude-code, github-copilot]",
      "  tools:",
      "    - toolId: codex",
      "      enabled: true",
      "      availability: available",
      "    - toolId: github-copilot",
      "      enabled: true",
      "      availability: available",
      "    - toolId: claude-code",
      "      enabled: true",
      "      availability: available",
      "    - toolId: ollama",
      "      enabled: true",
      "      availability: available",
      "      localModel:",
      "        provider: ollama",
      `        endpoint: "${options.localModelEndpoint}"`,
      `        model: "${DEFAULT_LOCAL_MODEL}"`,
      "        requestTimeoutMs: 1000",
      `        maxRetries: ${options.localModelMaxRetries ?? 1}`,
    );
  }

  writeFileSync(
    resolve(options.workspaceRoot, "governor.yaml"),
    `${governorConfigLines.join("\n")}\n`,
    "utf8",
  );

  const currentContextContent = [
    "# Workspace Current Context",
    "",
    "## Primary Stream",
    "",
    "- Status: active",
    `- Project: \`${FIXTURE_PROJECT_ID}\``,
    `- Sprint: \`${FIXTURE_SPRINT_ID}\``,
    `- Docs root: \`.repo-ai-governor/context/dev/${FIXTURE_PROJECT_ID}\``,
    `- Task records: \`.repo-ai-governor/context/dev/${FIXTURE_PROJECT_ID}/${FIXTURE_SPRINT_ID}/tasks/\``,
    `- Review records: \`.repo-ai-governor/context/dev/${FIXTURE_PROJECT_ID}/${FIXTURE_SPRINT_ID}/review/\``,
    "",
  ].join("\n");

  writeFileSync(
    resolve(options.workspaceRoot, "context", "current-context.md"),
    currentContextContent,
    "utf8",
  );
}

/**
 * Writes one task card and input artifact fixture for task-driven run.
 * @param {{
 *   workspaceRoot: string;
 *   taskId: string;
 *   title: string;
 *   goal: string;
 * }} options Task-card options.
 * @returns {string}
 */
export function writeTaskDrivenFixture(options) {
  const tasksDirectory = resolve(
    options.workspaceRoot,
    "context",
    "dev",
    FIXTURE_PROJECT_ID,
    FIXTURE_SPRINT_ID,
    "tasks",
  );
  const reviewDirectory = resolve(
    options.workspaceRoot,
    "context",
    "dev",
    FIXTURE_PROJECT_ID,
    FIXTURE_SPRINT_ID,
    "review",
  );
  mkdirSync(tasksDirectory, { recursive: true });
  mkdirSync(reviewDirectory, { recursive: true });

  const inputArtifactPath = resolve(tasksDirectory, "DA-001-stage9-input.md");
  writeFileSync(
    inputArtifactPath,
    "# DA-001 Stage 9 blackbox input\n\n- Scope: blackbox fixture\n",
    "utf8",
  );

  const taskCardPath = resolve(tasksDirectory, `${options.taskId}-${slugify(options.title)}.md`);
  const taskCardContent = [
    `# ${options.taskId} ${options.title}`,
    "",
    "- Status: planned",
    "- Date: 2026-03-24",
    "- Owner: AI-Agent",
    "- Priority: P0",
    `- Project: \`${FIXTURE_PROJECT_ID}\``,
    `- Sprint: \`${FIXTURE_SPRINT_ID}\``,
    "",
    "## 1. 任务目标",
    "",
    options.goal,
    "",
    "## 2. Depends On",
    "",
    "1. TK-001",
    "",
    "## 4. Input References",
    "",
    `1. \`DA-001\` \`.repo-ai-governor/context/dev/${FIXTURE_PROJECT_ID}/${FIXTURE_SPRINT_ID}/tasks/DA-001-stage9-input.md\``,
    "",
  ].join("\n");

  writeFileSync(taskCardPath, `${taskCardContent}\n`, "utf8");
  return taskCardPath;
}

/**
 * Initializes a git repository and writes one untracked migration file.
 * @param {string} repositoryPath Repo root.
 */
export function seedMigrationRiskFixture(repositoryPath) {
  const gitInitResult = spawnSync("git", ["init"], {
    cwd: repositoryPath,
    encoding: "utf8",
    stdio: "ignore",
  });
  if (gitInitResult.status !== 0) {
    throw new Error("failed to initialize git fixture repository");
  }

  const migrationPath = resolve(repositoryPath, "migrations", "001.sql");
  mkdirSync(dirname(migrationPath), { recursive: true });
  writeFileSync(migrationPath, "-- migration fixture\n", "utf8");
}

/**
 * Executes one CLI command in JSON mode and returns parsed payload with process metadata.
 * @param {{
 *   cliEntryPath: string;
 *   scenario: { repositoryPath: string; runtimeEnv: NodeJS.ProcessEnv };
 *   args: string[];
 *   expectExitCode?: number;
 * }} options Command options.
 * @returns {{
 *   durationMs: number;
 *   exitCode: number;
 *   payload: Record<string, any>;
 * }}
 */
export function executeCliJsonCommand(options) {
  const startedAt = Date.now();
  const result = spawnSync(
    process.execPath,
    [options.cliEntryPath, "--output", "json", ...options.args],
    {
      cwd: options.scenario.repositoryPath,
      env: options.scenario.runtimeEnv,
      encoding: "utf8",
    },
  );
  const durationMs = Date.now() - startedAt;
  const exitCode = typeof result.status === "number" ? result.status : 1;
  const expectedExitCode = options.expectExitCode ?? 0;
  const rawPayload = exitCode === 0 ? result.stdout : result.stderr;

  if (exitCode !== expectedExitCode) {
    throw new Error(
      `command "${options.args.join(" ")}" exited with ${exitCode}, expected ${expectedExitCode}.\nstdout=${result.stdout}\nstderr=${result.stderr}`,
    );
  }

  if (!rawPayload.trim()) {
    throw new Error(`command "${options.args.join(" ")}" returned empty JSON payload`);
  }

  return {
    durationMs,
    exitCode,
    payload: JSON.parse(rawPayload),
  };
}

/**
 * Executes one CLI command through compiled `runCli()` in the current process.
 * @param {{
 *   scenario: { repositoryPath: string };
 *   args: string[];
 *   expectExitCode?: number;
 * }} options Command options.
 * @returns {Promise<{
 *   durationMs: number;
 *   exitCode: number;
 *   payload: Record<string, any>;
 * }>}
 */
export async function executeCliJsonCommandInProcess(options) {
  const mainEntryPath = resolve(process.cwd(), "dist/apps/cli/src/main.js");
  if (!existsSync(mainEntryPath)) {
    resolveCliEntryPath();
  }

  const bufferedStdout = [];
  const bufferedStderr = [];
  const { runCli } = await import(pathToFileURL(mainEntryPath).href);
  const startedAt = Date.now();
  const exitCode = await runCli(["node", "repo-ai-governor", "--output", "json", ...options.args], {
    stdout: (value) => {
      bufferedStdout.push(value);
    },
    stderr: (value) => {
      bufferedStderr.push(value);
    },
    cwd: () => options.scenario.repositoryPath,
    isStdoutTty: () => false,
    env: () => options.scenario.runtimeEnv,
  });
  const durationMs = Date.now() - startedAt;
  const expectedExitCode = options.expectExitCode ?? 0;
  const rawPayload = exitCode === 0 ? bufferedStdout.join("") : bufferedStderr.join("");

  if (exitCode !== expectedExitCode) {
    throw new Error(
      `in-process command "${options.args.join(" ")}" exited with ${exitCode}, expected ${expectedExitCode}.\nstdout=${bufferedStdout.join("")}\nstderr=${bufferedStderr.join("")}`,
    );
  }

  if (!rawPayload.trim()) {
    throw new Error(`in-process command "${options.args.join(" ")}" returned empty JSON payload`);
  }

  return {
    durationMs,
    exitCode,
    payload: JSON.parse(rawPayload),
  };
}

/**
 * Resolves one artifact path from CLI JSON payload.
 * @param {Record<string, any>} payload CLI JSON payload.
 * @param {string} artifactId Artifact identifier.
 * @returns {string | null}
 */
export function resolveArtifactPath(payload, artifactId) {
  const artifacts = payload.command_result?.artifacts;
  if (!Array.isArray(artifacts)) {
    return null;
  }

  const matchedArtifact = artifacts.find((artifact) => artifact?.id === artifactId);
  return typeof matchedArtifact?.path === "string" ? matchedArtifact.path : null;
}

/**
 * Reads one artifact JSON payload by artifact id.
 * @param {Record<string, any>} payload CLI JSON payload.
 * @param {string} artifactId Artifact identifier.
 * @returns {Record<string, any> | null}
 */
export function readArtifactJson(payload, artifactId) {
  const artifactPath = resolveArtifactPath(payload, artifactId);
  if (!artifactPath) {
    return null;
  }
  return JSON.parse(readFileSync(artifactPath, "utf8"));
}

/**
 * Starts one mock Ollama-compatible server for restricted-network local-fallback rehearsals.
 * @param {{ mode: "success" | "retry_exhausted" }} options Mock mode.
 * @returns {Promise<{
 *   endpoint: string;
 *   close: () => Promise<void>;
 *   counters: { generateRequests: number };
 * }>}
 */
export async function startMockOllamaServer(options) {
  const counters = {
    generateRequests: 0,
  };

  const server = createServer((request, response) => {
    if (request.url === "/api/tags") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          models: [
            {
              name: DEFAULT_LOCAL_MODEL,
            },
          ],
        }),
      );
      return;
    }

    if (request.url === "/api/generate") {
      counters.generateRequests += 1;
      if (options.mode === "retry_exhausted") {
        response.writeHead(503, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "provider outage" }));
        return;
      }

      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          response: "stage9 local fallback completed",
          done: true,
        }),
      );
      return;
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not found" }));
  });

  await new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectPromise);
      resolvePromise(undefined);
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to resolve mock ollama server address");
  }

  return {
    endpoint: `http://127.0.0.1:${address.port}`,
    counters,
    close: () =>
      new Promise((resolvePromise, rejectPromise) => {
        server.close((error) => {
          if (error) {
            rejectPromise(error);
            return;
          }
          resolvePromise();
        });
      }),
  };
}

/**
 * Executes unattended task-driven delivery rehearsal scenario.
 * @param {{ cliEntryPath?: string }} [options]
 * @returns {Promise<Record<string, any>>}
 */
export async function runUnattendedDeliveryScenario(options = {}) {
  const cliEntryPath = options.cliEntryPath ?? resolveCliEntryPath();
  const scenario = createBlackboxScenario("stage9-unattended-delivery");
  writeRepoLocalFixtureConfig({
    workspaceRoot: scenario.workspaceRoot,
  });
  writeTaskDrivenFixture({
    workspaceRoot: scenario.workspaceRoot,
    taskId: "TK-900",
    title: "Controlled delivery rehearsal PR draft blackbox",
    goal: "Execute unattended delivery rehearsal, review verification, and report replay validation.",
  });

  const runResult = executeCliJsonCommand({
    cliEntryPath,
    scenario,
    args: ["--task-id", "TK-900", "--trace", "run"],
  });

  return summarizeRunScenario({
    scenarioId: "unattended-delivery-rehearsal",
    expectedRuntimeStatus: "succeeded",
    runResult,
    expectHitl: false,
  });
}

/**
 * Executes HITL resume blackbox scenario with migration-risk trigger.
 * @param {{ cliEntryPath?: string }} [options]
 * @returns {Promise<Record<string, any>>}
 */
export async function runHitlResumeScenario(options = {}) {
  const cliEntryPath = options.cliEntryPath ?? resolveCliEntryPath();
  const scenario = createBlackboxScenario("stage9-hitl-resume");
  writeRepoLocalFixtureConfig({
    workspaceRoot: scenario.workspaceRoot,
  });
  writeTaskDrivenFixture({
    workspaceRoot: scenario.workspaceRoot,
    taskId: "TK-901",
    title: "Delivery rehearsal migration gate blackbox",
    goal: "Execute delivery rehearsal through HITL resume after migration-risk policy escalation.",
  });
  seedMigrationRiskFixture(scenario.repositoryPath);

  const runResult = executeCliJsonCommand({
    cliEntryPath,
    scenario,
    args: [
      "--task-id",
      "TK-901",
      "--trace",
      "--hitl-decision",
      "approve",
      "--hitl-decision-reason",
      "Maintainer approved unattended continuation.",
      "--hitl-decided-by",
      "maintainer@example.com",
      "run",
    ],
  });

  return summarizeRunScenario({
    scenarioId: "hitl-approve-resume-delivery",
    expectedRuntimeStatus: "succeeded",
    runResult,
    expectHitl: true,
  });
}

/**
 * Executes restricted-network local-fallback success scenario through mock local model.
 * @param {{ cliEntryPath?: string }} [options]
 * @returns {Promise<Record<string, any>>}
 */
export async function runRestrictedFallbackSuccessScenario(options = {}) {
  const cliEntryPath = options.cliEntryPath ?? resolveCliEntryPath();
  const server = await startMockOllamaServer({ mode: "success" });

  try {
    const scenario = createBlackboxScenario("stage9-fallback-success");
    writeRepoLocalFixtureConfig({
      workspaceRoot: scenario.workspaceRoot,
      localModelEndpoint: server.endpoint,
      contextWindowOnlyRoles: true,
      localModelMaxRetries: 1,
    });
    writeTaskDrivenFixture({
      workspaceRoot: scenario.workspaceRoot,
      taskId: "TK-902",
      title: "Restricted network delivery fallback blackbox",
      goal: "Execute restricted-network fallback and delivery rehearsal through local model takeover.",
    });

    const runResult = await executeCliJsonCommandInProcess({
      scenario,
      args: [
        "--task-id",
        "TK-902",
        "--trace",
        "--restricted-network",
        "--restricted-reason",
        "ci_stage9_blackbox",
        "run",
      ],
    });

    const summary = summarizeRunScenario({
      scenarioId: "restricted-network-local-fallback-success",
      expectedRuntimeStatus: "succeeded",
      runResult,
      expectHitl: false,
    });
    summary.localModelGenerateRequests = server.counters.generateRequests;
    return summary;
  } finally {
    await server.close();
  }
}

/**
 * Executes restricted-network fallback failure scenario with retry exhaustion.
 * @param {{ cliEntryPath?: string }} [options]
 * @returns {Promise<Record<string, any>>}
 */
export async function runRestrictedFallbackFailureScenario(options = {}) {
  const cliEntryPath = options.cliEntryPath ?? resolveCliEntryPath();
  const server = await startMockOllamaServer({ mode: "retry_exhausted" });

  try {
    const scenario = createBlackboxScenario("stage9-fallback-failure");
    writeRepoLocalFixtureConfig({
      workspaceRoot: scenario.workspaceRoot,
      localModelEndpoint: server.endpoint,
      contextWindowOnlyRoles: true,
      localModelMaxRetries: 1,
    });
    writeTaskDrivenFixture({
      workspaceRoot: scenario.workspaceRoot,
      taskId: "TK-903",
      title: "Provider outage retry exhaustion fallback blackbox",
      goal: "Validate provider outage, retry exhaustion, and restricted-network fallback failure semantics.",
    });

    const runResult = await executeCliJsonCommandInProcess({
      scenario,
      args: [
        "--task-id",
        "TK-903",
        "--trace",
        "--restricted-network",
        "--restricted-reason",
        "provider_outage_retry_exhausted",
        "run",
      ],
    });

    const summary = summarizeRunScenario({
      scenarioId: "provider-outage-retry-exhausted",
      expectedRuntimeStatus: "failed",
      runResult,
      expectHitl: false,
    });
    summary.localModelGenerateRequests = server.counters.generateRequests;
    return summary;
  } finally {
    await server.close();
  }
}

/**
 * Runs the Stage 9 blackbox scenario matrix.
 * @param {{ cliEntryPath?: string }} [options]
 * @returns {Promise<Record<string, any>[]>}
 */
export async function runStage9BlackboxScenarioMatrix(options = {}) {
  const cliEntryPath = options.cliEntryPath ?? resolveCliEntryPath();
  const scenarioResults = [];
  scenarioResults.push(await runUnattendedDeliveryScenario({ cliEntryPath }));
  scenarioResults.push(await runHitlResumeScenario({ cliEntryPath }));
  scenarioResults.push(await runRestrictedFallbackSuccessScenario({ cliEntryPath }));
  scenarioResults.push(await runRestrictedFallbackFailureScenario({ cliEntryPath }));
  return scenarioResults;
}

/**
 * Creates GA metric snapshot from Stage 9 blackbox scenario results.
 * @param {Array<Record<string, any>>} scenarioResults Scenario summaries.
 * @returns {Record<string, any>}
 */
export function createStage9GaMetrics(scenarioResults) {
  const runScenarioResults = scenarioResults.filter((scenario) => scenario.kind === "run");
  const unattendedScenarioResults = runScenarioResults.filter((scenario) => !scenario.hitlRequired);
  const successfulUnattendedResults = unattendedScenarioResults.filter(
    (scenario) => scenario.runtimeStatus === "succeeded",
  );
  const humanInterventionResults = runScenarioResults.filter((scenario) => scenario.hitlRequired);
  const fallbackActivatedResults = runScenarioResults.filter(
    (scenario) => scenario.localFallbackActivated,
  );
  const deliveryEligibleResults = runScenarioResults.filter(
    (scenario) => scenario.deliveryRehearsalEnabled,
  );
  const deliveryPassResults = deliveryEligibleResults.filter(
    (scenario) => scenario.deliveryRehearsalStatus === "applied",
  );
  const firstSuccessfulResult = [...successfulUnattendedResults].sort(
    (left, right) => left.durationMs - right.durationMs,
  )[0];

  return {
    time_to_first_success_ms: firstSuccessfulResult?.durationMs ?? null,
    unattended_success_rate: toRate(
      successfulUnattendedResults.length,
      unattendedScenarioResults.length,
    ),
    human_intervention_rate: toRate(humanInterventionResults.length, runScenarioResults.length),
    fallback_rate: toRate(fallbackActivatedResults.length, runScenarioResults.length),
    delivery_rehearsal_pass_rate: toRate(
      deliveryPassResults.length,
      deliveryEligibleResults.length,
    ),
    totals: {
      run_scenarios: runScenarioResults.length,
      unattended_scenarios: unattendedScenarioResults.length,
      human_intervention_scenarios: humanInterventionResults.length,
      fallback_activated_scenarios: fallbackActivatedResults.length,
      delivery_rehearsal_eligible_scenarios: deliveryEligibleResults.length,
      delivery_rehearsal_pass_scenarios: deliveryPassResults.length,
    },
  };
}

/**
 * Normalizes one run scenario into a metric-friendly summary payload.
 * @param {{
 *   scenarioId: string;
 *   expectedRuntimeStatus: "succeeded" | "failed";
 *   runResult: { durationMs: number; payload: Record<string, any> };
 *   expectHitl: boolean;
 * }} options Summary options.
 * @returns {Record<string, any>}
 */
function summarizeRunScenario(options) {
  const details = options.runResult.payload.command_result?.details ?? {};
  const diagnosticsTracePayload = readArtifactJson(options.runResult.payload, "diagnostics_trace");
  const adapterInvocationSummary = Array.isArray(diagnosticsTracePayload?.adapterInvocationSummary)
    ? diagnosticsTracePayload.adapterInvocationSummary
    : [];
  const localFallbackActivated = adapterInvocationSummary.some(
    (entry) => entry?.localFallbackActivated === true,
  );
  const runtimeStatus =
    typeof details.runtime_status === "string" ? details.runtime_status : "unknown";
  const hitlRequired = details.hitl_required === true;
  const deliveryRehearsalEnabled = details.delivery_rehearsal_enabled === true;
  const deliveryRehearsalStatus =
    typeof details.delivery_rehearsal_status === "string"
      ? details.delivery_rehearsal_status
      : "disabled";
  const inlineReviewChainStatus =
    typeof details.inline_review_chain_status === "string"
      ? details.inline_review_chain_status
      : "disabled";
  const passed =
    options.runResult.payload.status === "success" &&
    runtimeStatus === options.expectedRuntimeStatus &&
    hitlRequired === options.expectHitl;

  return {
    scenarioId: options.scenarioId,
    kind: "run",
    status: passed ? "passed" : "failed",
    durationMs: options.runResult.durationMs,
    runtimeStatus,
    hitlRequired,
    hitlDecision: typeof details.hitl_decision === "string" ? details.hitl_decision : null,
    localFallbackActivated,
    deliveryRehearsalEnabled,
    deliveryRehearsalStatus,
    inlineReviewChainStatus,
    assemblyMode: typeof details.assembly_mode === "string" ? details.assembly_mode : null,
    reportPath: resolveArtifactPath(options.runResult.payload, "execution_report"),
    replayPath: resolveArtifactPath(options.runResult.payload, "replay_explain"),
    hitlNotificationPath: resolveArtifactPath(options.runResult.payload, "hitl_notification"),
    hitlDecisionReceiptPath: resolveArtifactPath(
      options.runResult.payload,
      "hitl_decision_receipt",
    ),
    diagnosticsTracePath: resolveArtifactPath(options.runResult.payload, "diagnostics_trace"),
    deliveryRehearsalPath: resolveArtifactPath(options.runResult.payload, "delivery_rehearsal"),
    payloadStatus: options.runResult.payload.status,
  };
}

/**
 * Converts one ratio into a fixed-precision decimal.
 * @param {number} numerator
 * @param {number} denominator
 * @returns {number | null}
 */
function toRate(numerator, denominator) {
  if (denominator <= 0) {
    return null;
  }
  return Number((numerator / denominator).toFixed(4));
}

/**
 * Converts arbitrary title text into one stable filename slug.
 * @param {string} value Raw title.
 * @returns {string}
 */
function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80);
}
