import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import type { ClaudeCodeExecRunner } from "@repo-ai-governor/adapter-claude-code";
import type { CodexExecRunner } from "@repo-ai-governor/adapter-codex";
import type { GithubCopilotExecRunner } from "@repo-ai-governor/adapter-github-copilot";
import {
  AGENT_LOCAL_FALLBACK_SURFACE,
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCliExecOperation,
} from "@repo-ai-governor/adapter-sdk";
import {
  type AdaptersConfig,
  type ResolvedWorkspace,
  WorkspaceMode,
  WorkspaceModeSource,
} from "@repo-ai-governor/config";
import { MemoryManager } from "@repo-ai-governor/core-memory";
import { AuditRecorder } from "@repo-ai-governor/core-session";
import { FsCsvMemoryStoreProvider } from "@repo-ai-governor/memory-provider-fs-csv";
import { MemoryStoreAdapter } from "@repo-ai-governor/memory-store-adapter";
import {
  AdapterAvailability,
  AdapterSurface,
  DEFAULT_MEMORY_RUNTIME_CONFIG,
  DefaultRoleProfileId,
  ErrorOutputEnvironment,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  LocalModelProvider,
  RuntimeError,
} from "@repo-ai-governor/shared";
import { CliGovernanceRuntime } from "../src/cli-governance-runtime.js";
import { CliCommandName } from "../src/constants/cli-command.constant.js";
import type { CliRuntimeDebugOptions } from "../src/types/index.js";

interface RuntimeFixture {
  tempRoot: string;
  workspace: ResolvedWorkspace;
  workspaceRoot: string;
  memoryStoreRoot: string;
  runtime: CliGovernanceRuntime;
  provider: FsCsvMemoryStoreProvider;
}

interface RuntimeFixtureOptions {
  runtimeDebugOptions?: CliRuntimeDebugOptions;
  adaptersConfig?: AdaptersConfig;
  adapterLocalProbeOverrides?: Partial<
    Record<
      AdapterSurface,
      {
        availabilityStatus: AgentAvailabilityStatus;
        unavailableReasons: string[];
      }
    >
  >;
  commandProbeExecutor?: (command: string, args: readonly string[]) => Promise<void>;
  claudeCodeExecRunner?: ClaudeCodeExecRunner;
  codexExecRunner?: CodexExecRunner;
  githubCopilotExecRunner?: GithubCopilotExecRunner;
}

function createCodexExecRunnerFixture(): CodexExecRunner {
  return async ({ prompt, operation }) => {
    const responseText =
      operation === AgentCliExecOperation.PROBE || prompt.includes("Respond with exactly OK.")
        ? "OK"
        : "simulated codex response";
    return {
      stdout: [
        '{"type":"thread.started","thread_id":"thread-1"}',
        `{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"${responseText}"}}`,
        '{"type":"turn.completed","usage":{"input_tokens":21,"output_tokens":13}}',
      ].join("\n"),
      stderr: "",
      exitCode: 0,
      signal: null,
      elapsedMs: 9,
    };
  };
}

function createCodexCredentialFailureRunner(): CodexExecRunner {
  return async () => {
    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
      "Codex probe failed: login required",
      {
        surface: AdapterSurface.CODEX,
        operation: AgentCliExecOperation.PROBE,
        stderr: "Not logged in. Run `codex login` first.",
      },
    );
  };
}

function createClaudeCodeExecRunnerFixture(): ClaudeCodeExecRunner {
  return async ({ prompt, operation }) => ({
    stdout:
      operation === AgentCliExecOperation.PROBE || prompt.includes("Respond with exactly OK.")
        ? "OK\n"
        : "simulated claude code response\n",
    stderr: "",
    exitCode: 0,
    signal: null,
    elapsedMs: 8,
  });
}

function createClaudeCodeCredentialFailureRunner(): ClaudeCodeExecRunner {
  return async () => {
    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
      "Claude Code probe failed: login required",
      {
        surface: AdapterSurface.CLAUDE_CODE,
        operation: AgentCliExecOperation.PROBE,
        stderr: "Authentication required. Run `claude auth login` first.",
      },
    );
  };
}

function createGithubCopilotExecRunnerFixture(): GithubCopilotExecRunner {
  return async ({ prompt, operation }) => ({
    stdout:
      operation === AgentCliExecOperation.PROBE || prompt.includes("Respond with exactly OK.")
        ? [
            '{"type":"assistant.message","data":{"content":"OK"}}',
            '{"type":"result","exitCode":0}',
          ].join("\n")
        : [
            '{"type":"assistant.message","data":{"content":"simulated github copilot response"}}',
            '{"type":"result","exitCode":0}',
          ].join("\n"),
    stderr: "",
    exitCode: 0,
    signal: null,
    elapsedMs: 8,
  });
}

function createGithubCopilotCredentialFailureRunner(): GithubCopilotExecRunner {
  return async () => {
    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
      "GitHub Copilot probe failed: login required",
      {
        surface: AdapterSurface.GITHUB_COPILOT,
        operation: AgentCliExecOperation.PROBE,
        stderr: "Authentication required. Run `gh auth login` or `gh copilot -- login` first.",
      },
    );
  };
}

/**
 * Creates adapters config fixture used by CLI runtime tests.
 * @returns Minimal adapters/routing/tool config payload.
 */
function createAdaptersConfigFixture(): AdaptersConfig {
  return {
    roles: [
      {
        roleId: "planner",
        roleProfileId: DefaultRoleProfileId.PLANNER,
        requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
        required: true,
      },
      {
        roleId: "coder",
        roleProfileId: DefaultRoleProfileId.CODER,
        requiredCapabilities: [AgentCapability.TOOL_CALLING],
        required: true,
      },
      {
        roleId: "reviewer",
        roleProfileId: DefaultRoleProfileId.REVIEWER,
        requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
        required: true,
      },
    ],
    routing: {
      roleBindings: {
        planner: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.CLAUDE_CODE],
        },
        coder: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.GITHUB_COPILOT],
        },
        reviewer: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.CLAUDE_CODE],
        },
      },
    },
    tools: [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
      {
        toolId: AdapterSurface.GITHUB_COPILOT,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
      {
        toolId: AdapterSurface.CLAUDE_CODE,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
    ],
  };
}

/**
 * Creates deterministic local-probe override map for CLI adapter tests.
 * @returns Surface availability map with all tools marked available.
 */
function createAdapterLocalProbeOverrides(): Partial<
  Record<
    AdapterSurface,
    {
      availabilityStatus: AgentAvailabilityStatus;
      unavailableReasons: string[];
    }
  >
> {
  return {
    [AdapterSurface.CODEX]: {
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: [],
    },
    [AdapterSurface.CLAUDE_CODE]: {
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: [],
    },
    [AdapterSurface.GITHUB_COPILOT]: {
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: [],
    },
    [AdapterSurface.OLLAMA]: {
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: [],
    },
  };
}

/**
 * Creates adapters config where remote tools are unavailable and Ollama acts as local fallback.
 * @returns Adapters config with one enabled local-model tool row.
 */
function createLocalFallbackAdaptersConfig(): AdaptersConfig {
  const adaptersConfig = createAdaptersConfigFixture();
  adaptersConfig.tools = [
    {
      toolId: AdapterSurface.CODEX,
      enabled: true,
      availability: AdapterAvailability.UNAVAILABLE,
      unavailableReasons: ["login_required"],
    },
    {
      toolId: AdapterSurface.GITHUB_COPILOT,
      enabled: true,
      availability: AdapterAvailability.UNAVAILABLE,
      unavailableReasons: ["login_required"],
    },
    {
      toolId: AdapterSurface.CLAUDE_CODE,
      enabled: true,
      availability: AdapterAvailability.UNAVAILABLE,
      unavailableReasons: ["login_required"],
    },
    {
      toolId: AdapterSurface.OLLAMA,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
      localModel: {
        provider: LocalModelProvider.OLLAMA,
        endpoint: "http://127.0.0.1:11434",
        model: "qwen2.5-coder:7b",
        maxRetries: 0,
      },
    },
  ];
  return adaptersConfig;
}

/**
 * Creates adapters config where remote surfaces stay primary-capable and Ollama is available
 * only as restricted-network fallback.
 * @returns Adapters config for restricted-network rehearsal.
 */
function createRestrictedNetworkRehearsalAdaptersConfig(): AdaptersConfig {
  const adaptersConfig = createAdaptersConfigFixture();
  adaptersConfig.tools = [
    ...(adaptersConfig.tools ?? []),
    {
      toolId: AdapterSurface.OLLAMA,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
      localModel: {
        provider: LocalModelProvider.OLLAMA,
        endpoint: "http://127.0.0.1:11434",
        model: "qwen2.5-coder:7b",
        maxRetries: 0,
      },
    },
  ];
  return adaptersConfig;
}

/**
 * Creates one restricted-network rehearsal config where the local-model surface satisfies
 * the route capability requirement, allowing positive takeover verification.
 * @returns Adapters config for positive restricted-network local-fallback rehearsal.
 */
function createRestrictedNetworkCapabilityCompatibleAdaptersConfig(): AdaptersConfig {
  const adaptersConfig = createRestrictedNetworkRehearsalAdaptersConfig();
  adaptersConfig.roles = adaptersConfig.roles.map((role) => ({
    ...role,
    requiredCapabilities: [AgentCapability.CONTEXT_WINDOW],
  }));
  return adaptersConfig;
}

/**
 * Creates one isolated runtime fixture for command integration tests.
 * @returns Runtime fixture with workspace and provider handles.
 */
async function createRuntimeFixture(options: RuntimeFixtureOptions = {}): Promise<RuntimeFixture> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), "cli-governance-runtime-"));
  const workspaceRoot = resolve(tempRoot, ".repo-ai-governor");
  const memoryStoreRoot = resolve(workspaceRoot, "context", "memory");
  await mkdir(memoryStoreRoot, { recursive: true });

  const workspace: ResolvedWorkspace = {
    workspaceId: "test-workspace",
    mode: WorkspaceMode.REPO_LOCAL,
    modeSource: WorkspaceModeSource.RUNTIME,
    repositoryRoot: tempRoot,
    workspaceRoot,
    configPath: resolve(workspaceRoot, "governor.yaml"),
  };
  const provider = new FsCsvMemoryStoreProvider({
    rootDirectory: memoryStoreRoot,
  });
  const runtime = new CliGovernanceRuntime({
    currentWorkingDirectory: tempRoot,
    workspace,
    configSource: "default",
    profileId: null,
    locale: "en-US",
    outputMode: ErrorOutputEnvironment.PLAIN,
    isTty: false,
    memoryConfig: {
      ...DEFAULT_MEMORY_RUNTIME_CONFIG,
      storeRoot: "context/memory",
    },
    memoryStoreRoot,
    memoryStoreProviderName: provider.constructor.name,
    memoryStoreProvider: provider,
    adaptersConfig: options.adaptersConfig ?? createAdaptersConfigFixture(),
    runtimeDebugOptions: options.runtimeDebugOptions,
    adapterLocalProbeOverrides:
      options.adapterLocalProbeOverrides ?? createAdapterLocalProbeOverrides(),
    commandProbeExecutor: options.commandProbeExecutor,
    claudeCodeExecRunner: options.claudeCodeExecRunner ?? createClaudeCodeExecRunnerFixture(),
    codexExecRunner: options.codexExecRunner ?? createCodexExecRunnerFixture(),
    githubCopilotExecRunner:
      options.githubCopilotExecRunner ?? createGithubCopilotExecRunnerFixture(),
  });

  return {
    tempRoot,
    workspace,
    workspaceRoot,
    memoryStoreRoot,
    runtime,
    provider,
  };
}

/**
 * Runs one async test block with isolated runtime fixture and guaranteed cleanup.
 * @param runner Async test runner callback.
 * @returns Void.
 */
async function withRuntimeFixture(
  runner: (fixture: RuntimeFixture) => Promise<void>,
  options: RuntimeFixtureOptions = {},
): Promise<void> {
  const fixture = await createRuntimeFixture(options);
  try {
    await runner(fixture);
  } finally {
    await fixture.provider.dispose();
    await rm(fixture.tempRoot, { recursive: true, force: true });
  }
}

/**
 * Writes one canonical task card fixture used by task-driven run assembly integration tests.
 * @param workspaceRoot Workspace root under temporary fixture.
 * @param taskId Task id used by runtime debug options.
 * @returns Absolute task-card path.
 */
async function writeTaskCardFixture(workspaceRoot: string, taskId: string): Promise<string> {
  const taskCardPath = resolve(
    workspaceRoot,
    "context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks",
    `${taskId}-task-driven-dag-and-run-mainchain-assembly.md`,
  );
  await mkdir(resolve(taskCardPath, ".."), { recursive: true });
  await writeFile(
    taskCardPath,
    `# ${taskId} 任务驱动 DAG 与 \`run\` 主链装配

- Status: in_progress
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: \`project-010-local-model-and-ide-expansion\`
- Sprint: \`sprint-002-autonomous-mainchain-foundation\`

## 1. 任务目标

完成任务驱动 DAG 装配、实现和回归验证。

## 2.1 Depends On

1. \`TK-098\`

## 2.2 Required Inputs

1. \`.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-121-shared-and-package-local-boundary-hardening-and-exports-cleanup.md\`
2. \`.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-122-cli-package-regression-smoke-and-test-topology-hardening.md\`
3. \`.repo-ai-governor/context/dev/project-011-cli-package-decomposition/project-011-cli-package-decomposition-completion-audit-summary.md\`

## 2.3 Traceback References

1. \`.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md\`
`,
    "utf8",
  );

  return taskCardPath;
}

/**
 * Writes one canonical delivery task card fixture used by controlled delivery rehearsal integration tests.
 * @param workspaceRoot Workspace root under temporary fixture.
 * @param taskId Task id used by runtime debug options.
 * @returns Absolute task-card path.
 */
async function writeDeliveryTaskCardFixture(
  workspaceRoot: string,
  taskId: string,
): Promise<string> {
  const taskCardPath = resolve(
    workspaceRoot,
    "context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks",
    `${taskId}-controlled-delivery-rehearsal-and-audit-replay-integration.md`,
  );
  await mkdir(resolve(taskCardPath, ".."), { recursive: true });
  await writeFile(
    taskCardPath,
    `# ${taskId} 受控 delivery rehearsal 与 audit/replay 集成

- Status: in_progress
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: \`project-010-local-model-and-ide-expansion\`
- Sprint: \`sprint-003-delivery-ide-and-ga-hardening\`

## 1. 任务目标

将 \`commit\` 或 \`PR draft\` rehearsal 纳入策略门禁、审计回放与人工接管边界。

## 2. Depends On

1. \`TK-102\`

## 4. Input References

1. \`.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/DA-106-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md\`
`,
    "utf8",
  );

  return taskCardPath;
}

describe("CliGovernanceRuntime policy/review safeguards", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fails run when policy outcome requires HITL confirmation", async () => {
    await withRuntimeFixture(async (fixture) => {
      const runtimeWithOverrides = fixture.runtime as unknown as {
        collectGitChangedPaths: () => Promise<string[]>;
      };
      // Why: deterministic change facts keep this test independent from host git state.
      runtimeWithOverrides.collectGitChangedPaths = async () => ["migrations/001.sql"];

      await expect(fixture.runtime.execute(CliCommandName.RUN)).rejects.toMatchObject({
        code: GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
        details: {
          pendingStatus: ExecutionProgressStage.HUMAN_CONFIRMATION,
        },
      });
    });
  });

  it("writes HITL notification artifact when policy outcome requires confirmation", async () => {
    await withRuntimeFixture(async (fixture) => {
      const runtimeWithOverrides = fixture.runtime as unknown as {
        collectGitChangedPaths: () => Promise<string[]>;
      };
      runtimeWithOverrides.collectGitChangedPaths = async () => ["migrations/001.sql"];

      await expect(fixture.runtime.execute(CliCommandName.RUN)).rejects.toMatchObject({
        code: GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
        details: {
          pendingStatus: ExecutionProgressStage.HUMAN_CONFIRMATION,
        },
      });

      const notificationDirectoryPath = resolve(
        fixture.workspaceRoot,
        "context",
        "hitl",
        "notifications",
      );
      const notificationFileNames = await readdir(notificationDirectoryPath);
      expect(notificationFileNames).toHaveLength(1);

      const notificationPayload = JSON.parse(
        await readFile(resolve(notificationDirectoryPath, notificationFileNames[0] ?? ""), "utf8"),
      ) as {
        channel?: string;
        payload?: {
          policyOutcome?: string;
        };
      };
      expect(notificationPayload.channel).toBe("webhook");
      expect(notificationPayload.payload?.policyOutcome).toBe("escalate");
    });
  });

  it("does not persist HITL notification artifacts during dry-run high-risk execution", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => ["migrations/001.sql"];

        await expect(fixture.runtime.execute(CliCommandName.RUN)).rejects.toMatchObject({
          code: GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
          details: {
            pendingStatus: ExecutionProgressStage.HUMAN_CONFIRMATION,
            runtimeBackend: "langgraph",
            runtimeRecoveryState: "recovered",
          },
        });

        const notificationFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "hitl", "notifications"),
        ).catch(() => []);
        const decisionFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "hitl", "decisions"),
        ).catch(() => []);

        expect(notificationFiles).toHaveLength(0);
        expect(decisionFiles).toHaveLength(0);
      },
      {
        runtimeDebugOptions: {
          dryRun: true,
          trace: false,
          replayPath: null,
        },
      },
    );
  });

  it("does not persist inline review side effects when task-driven run requires HITL confirmation", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        await writeTaskCardFixture(fixture.workspaceRoot, "TK-099");
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => ["migrations/001.sql"];

        await expect(fixture.runtime.execute(CliCommandName.RUN)).rejects.toMatchObject({
          code: GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
          details: {
            pendingStatus: ExecutionProgressStage.HUMAN_CONFIRMATION,
          },
        });

        const requestFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "review-queue", "requests"),
        ).catch(() => []);
        const resultFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "review-queue", "results"),
        ).catch(() => []);
        const ledgerFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "ledger-backfill", "review-verify"),
        ).catch(() => []);

        expect(requestFiles).toHaveLength(0);
        expect(resultFiles).toHaveLength(0);
        expect(ledgerFiles).toHaveLength(0);
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
          taskId: "TK-099",
        },
      },
    );
  });

  it("skips inline review side effects during task-driven dry-run execution", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        await writeTaskCardFixture(fixture.workspaceRoot, "TK-099");
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => [];

        const runResult = await fixture.runtime.execute(CliCommandName.RUN);
        expect(runResult.commandResult.details?.inline_review_chain_status).toBe("dry_run");
        expect(runResult.commandResult.details?.inline_review_chain_skip_reason).toBe("dry_run");
        expect(runResult.commandResult.details?.inline_review_request_path).toBeNull();
        expect(runResult.commandResult.details?.inline_review_verify_path).toBeNull();
        expect(runResult.commandResult.details?.inline_review_ledger_backfill_path).toBeNull();
        expect(
          runResult.commandResult.checks?.find((check) => check.id === "review_chain")?.detail,
        ).toContain("status=dry_run");
        expect(
          runResult.commandResult.experience?.roleProgress.some(
            (row) =>
              row.stage === ExecutionProgressStage.REVIEW &&
              row.status === ExecutionProgressStatus.WARNING,
          ),
        ).toBe(true);

        const requestFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "review-queue", "requests"),
        ).catch(() => []);
        const resultFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "review-queue", "results"),
        ).catch(() => []);
        const ledgerFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "ledger-backfill", "review-verify"),
        ).catch(() => []);

        expect(requestFiles).toHaveLength(0);
        expect(resultFiles).toHaveLength(0);
        expect(ledgerFiles).toHaveLength(0);
      },
      {
        runtimeDebugOptions: {
          dryRun: true,
          trace: false,
          replayPath: null,
          adapters: true,
          taskId: "TK-099",
        },
      },
    );
  });

  it("resumes task-driven review subchain when an approve HITL decision receipt is supplied", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        await writeTaskCardFixture(fixture.workspaceRoot, "TK-099");
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => ["migrations/001.sql"];

        const runResult = await fixture.runtime.execute(CliCommandName.RUN);
        expect(runResult.commandResult.details?.original_policy_outcome).toBe("escalate");
        expect(runResult.commandResult.details?.effective_policy_outcome).toBe("allow");
        expect(runResult.commandResult.details?.task_id).toBe("TK-099");
        expect(runResult.commandResult.details?.runtime_backend).toBe("langgraph");
        expect(runResult.commandResult.details?.runtime_comparison_backend).toBeNull();
        expect(runResult.commandResult.details?.runtime_parity_mode).toBe("disabled");
        expect(runResult.commandResult.details?.hitl_decision).toBe("approve");
        expect(runResult.commandResult.details?.hitl_resume_action).toBe("resume");
        expect(runResult.commandResult.details?.langgraph_checkpoint_source).toBe("sqlite-fs");
        expect(runResult.commandResult.details?.langgraph_recovery_state).toBe("recovered");
        expect(runResult.commandResult.details?.inline_review_chain_enabled).toBe(true);
        expect(runResult.commandResult.details?.inline_review_chain_status).toBe("applied");
        expect(
          runResult.commandResult.checks?.find((check) => check.id === "runtime_backend")?.detail,
        ).toContain("primary=langgraph");
        expect(
          runResult.commandResult.checks?.find((check) => check.id === "runtime_backend")?.detail,
        ).toContain("comparison=none");
        expect(
          runResult.commandResult.checks?.find((check) => check.id === "recovery")?.detail,
        ).toContain("state=recovered");
        expect(
          runResult.commandResult.checks?.find((check) => check.id === "hitl")?.detail,
        ).toContain("decision=approve");
        expect(
          runResult.commandResult.checks?.find((check) => check.id === "review_chain")?.detail,
        ).toContain("status=applied");
        expect(
          runResult.commandResult.artifacts?.some(
            (artifact) => artifact.id === "hitl_notification",
          ),
        ).toBe(true);
        expect(
          runResult.commandResult.artifacts?.some(
            (artifact) => artifact.id === "hitl_decision_receipt",
          ),
        ).toBe(true);
        expect(
          runResult.commandResult.artifacts?.some(
            (artifact) => artifact.id === "langgraph_checkpoint",
          ),
        ).toBe(true);

        const decisionReceiptPath = runResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "hitl_decision_receipt",
        )?.path;
        expect(typeof decisionReceiptPath).toBe("string");
        expect(typeof runResult.commandResult.details?.langgraph_checkpoint_path).toBe("string");
        expect(runResult.commandResult.details?.langgraph_checkpoint_path).toContain(
          "langgraph-checkpoints.sqlite#",
        );
        expect(typeof runResult.commandResult.details?.orchestration_event_stream_token).toBe(
          "string",
        );
        expect(runResult.commandResult.details?.orchestration_status).toBe("completed");

        const decisionReceiptPayload = JSON.parse(
          await readFile(String(decisionReceiptPath), "utf8"),
        ) as {
          decision?: string;
          resumeAction?: string;
          finalPolicyOutcome?: string;
          decidedBy?: string;
        };
        expect(decisionReceiptPayload.decision).toBe("approve");
        expect(decisionReceiptPayload.resumeAction).toBe("resume");
        expect(decisionReceiptPayload.finalPolicyOutcome).toBe("allow");
        expect(decisionReceiptPayload.decidedBy).toBe("maintainer@example.com");
        expect(
          runResult.commandResult.artifacts?.some(
            (artifact) => artifact.id === "inline_review_request",
          ),
        ).toBe(true);
        expect(
          runResult.commandResult.artifacts?.some(
            (artifact) => artifact.id === "inline_review_verify_result",
          ),
        ).toBe(true);
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          taskId: "TK-099",
          hitlDecision: "approve",
          hitlDecisionReason: "Maintainer approved unattended continuation.",
          hitlDecidedBy: "maintainer@example.com",
        },
      },
    );
  });

  it("terminates task-driven run when a reject HITL decision receipt is supplied", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        await writeTaskCardFixture(fixture.workspaceRoot, "TK-099");
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => ["migrations/001.sql"];

        const runtimeError = await fixture.runtime
          .execute(CliCommandName.RUN)
          .then(() => null)
          .catch((error: RuntimeError) => error);

        expect(runtimeError).toMatchObject({
          code: GovernorErrorCode.POLICY_GATE_EVALUATION_FAILED,
          details: {
            hitlResumeAction: "terminate",
          },
        });

        const decisionReceiptPath = runtimeError?.details?.hitlDecisionReceiptPath;
        expect(typeof decisionReceiptPath).toBe("string");

        const decisionReceiptPayload = JSON.parse(
          await readFile(String(decisionReceiptPath), "utf8"),
        ) as {
          decision?: string;
          resumeAction?: string;
          finalPolicyOutcome?: string;
        };
        expect(decisionReceiptPayload.decision).toBe("reject");
        expect(decisionReceiptPayload.resumeAction).toBe("terminate");
        expect(decisionReceiptPayload.finalPolicyOutcome).toBe("block");

        const requestFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "review-queue", "requests"),
        ).catch(() => []);
        const resultFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "review-queue", "results"),
        ).catch(() => []);
        expect(requestFiles).toHaveLength(0);
        expect(resultFiles).toHaveLength(0);
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          taskId: "TK-099",
          hitlDecision: "reject",
          hitlDecisionReason: "Maintainer rejected unattended continuation.",
          hitlDecidedBy: "maintainer@example.com",
        },
      },
    );
  });

  it("keeps run in HITL follow-up when a revise decision degrades execution", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        await writeTaskCardFixture(fixture.workspaceRoot, "TK-099");
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => ["migrations/001.sql"];

        const runtimeError = await fixture.runtime
          .execute(CliCommandName.RUN)
          .then(() => null)
          .catch((error: RuntimeError) => error);

        expect(runtimeError).toMatchObject({
          code: GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
          details: {
            pendingStatus: ExecutionProgressStage.HUMAN_CONFIRMATION,
            hitlResumeAction: "degrade",
          },
        });

        const decisionReceiptPath = runtimeError?.details?.hitlDecisionReceiptPath;
        expect(typeof decisionReceiptPath).toBe("string");

        const decisionReceiptPayload = JSON.parse(
          await readFile(String(decisionReceiptPath), "utf8"),
        ) as {
          decision?: string;
          resumeAction?: string;
          finalPolicyOutcome?: string;
        };
        expect(decisionReceiptPayload.decision).toBe("revise");
        expect(decisionReceiptPayload.resumeAction).toBe("degrade");
        expect(decisionReceiptPayload.finalPolicyOutcome).toBe("escalate");

        const requestFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "review-queue", "requests"),
        ).catch(() => []);
        const resultFiles = await readdir(
          resolve(fixture.workspaceRoot, "context", "review-queue", "results"),
        ).catch(() => []);
        expect(requestFiles).toHaveLength(0);
        expect(resultFiles).toHaveLength(0);
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          taskId: "TK-099",
          hitlDecision: "revise",
          hitlDecisionReason: "Maintainer requested a guarded manual follow-up.",
          hitlResumeAction: "degrade",
          hitlDecidedBy: "maintainer@example.com",
        },
      },
    );
  });

  it("reads project/sprint audit tags from workspace current-context", async () => {
    await withRuntimeFixture(async (fixture) => {
      const currentContextPath = resolve(fixture.workspaceRoot, "context", "current-context.md");
      await mkdir(resolve(fixture.workspaceRoot, "context"), { recursive: true });
      await writeFile(
        currentContextPath,
        [
          "# Workspace Current Context",
          "",
          "## Primary Stream",
          "",
          "- Status: active",
          "- Project: `project-target-runtime`",
          "- Sprint: `sprint-900-policy`",
          "",
        ].join("\n"),
        "utf8",
      );

      const runtimeWithOverrides = fixture.runtime as unknown as {
        collectGitChangedPaths: () => Promise<string[]>;
      };
      runtimeWithOverrides.collectGitChangedPaths = async () => [];

      const executionResult = await fixture.runtime.execute(CliCommandName.RUN);
      const executionId = executionResult.commandResult.details?.execution_id;
      expect(typeof executionId).toBe("string");

      const auditRecorder = new AuditRecorder(
        new MemoryManager(new MemoryStoreAdapter(fixture.provider)),
      );
      const auditRecords = await auditRecorder.listEvents({
        executionId: String(executionId),
      });

      expect(auditRecords.length).toBeGreaterThan(0);
      for (const auditRecord of auditRecords) {
        expect(auditRecord.event.projectId).toBe("project-target-runtime");
        expect(auditRecord.event.sprintId).toBe("sprint-900-policy");
      }
      const stageRecords = auditRecords.filter(
        (auditRecord) => auditRecord.event.stageId !== "stage-policy-gate",
      );
      expect(
        stageRecords.some((auditRecord) => {
          const memoryDelta = (auditRecord.event.memoryDelta ?? {}) as Record<string, unknown>;
          const output =
            memoryDelta.output && typeof memoryDelta.output === "object"
              ? (memoryDelta.output as Record<string, unknown>)
              : null;
          return (
            output?.handledBy === "adapter-route-runner" &&
            typeof output.adapterSurface === "string"
          );
        }),
      ).toBe(true);
    });
  });

  it("blocks run when only ollama fallback remains but required capabilities are unsupported", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input).includes("/api/tags")) {
        return new Response(
          JSON.stringify({
            models: [
              {
                name: "qwen2.5-coder:7b",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          response: "local fallback completed",
          done: true,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await withRuntimeFixture(
      async (fixture) => {
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => [];
        const runResult = await fixture.runtime.execute(CliCommandName.RUN);

        expect(runResult.commandResult.details?.runtime_status).toBe("failed");
        expect(
          runResult.commandResult.checks?.some(
            (check) => check.id === "runtime" && check.detail.includes("status=failed"),
          ),
        ).toBe(true);
      },
      {
        adaptersConfig: createLocalFallbackAdaptersConfig(),
      },
    );
  });

  it("drains queued review request after review-verify emits verify/backfill artifacts", async () => {
    await withRuntimeFixture(async (fixture) => {
      await fixture.runtime.execute(CliCommandName.REVIEW);
      const firstVerifyResult = await fixture.runtime.execute(CliCommandName.REVIEW_VERIFY);

      const verifyArtifactPath = firstVerifyResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === "review_verify_result",
      )?.path;
      expect(typeof verifyArtifactPath).toBe("string");
      const verifyPayload = JSON.parse(await readFile(String(verifyArtifactPath), "utf8")) as {
        verifyId?: string;
        sourceRequestPath?: string;
      };
      expect(verifyPayload.sourceRequestPath).toMatch(/review-queue[\\/]+requests[\\/]+review-/u);
      expect(verifyPayload.sourceRequestPath).not.toContain("review-verify-");

      const sourceRequestPath = String(verifyPayload.sourceRequestPath);
      const sourceRequestPayload = JSON.parse(await readFile(sourceRequestPath, "utf8")) as {
        status?: string;
        consumedByVerifyId?: string;
      };
      expect(sourceRequestPayload.status).toBe("verified");
      expect(sourceRequestPayload.consumedByVerifyId).toBe(verifyPayload.verifyId);
      const experience = firstVerifyResult.commandResult.experience;
      expect(experience).toBeDefined();
      expect(
        experience?.roleProgress.some(
          (row) =>
            row.stage === ExecutionProgressStage.REVIEW_VERIFY &&
            row.status === ExecutionProgressStatus.COMPLETED,
        ),
      ).toBe(true);
      expect(
        experience?.roleProgress.some(
          (row) =>
            row.stage === ExecutionProgressStage.LEDGER_BACKFILL &&
            row.status === ExecutionProgressStatus.WAITING,
        ),
      ).toBe(true);

      await expect(fixture.runtime.execute(CliCommandName.REVIEW_VERIFY)).rejects.toMatchObject({
        code: GovernorErrorCode.UNKNOWN,
      });

      const backfillDirectoryPath = resolve(
        fixture.workspaceRoot,
        "context",
        "ledger-backfill",
        "review-verify",
      );
      const backfillFileNames = await readdir(backfillDirectoryPath);
      expect(backfillFileNames.length).toBe(1);
    });
  });

  it("emits layered diagnostics trace when dry-run/trace debug mode is enabled", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => [];

        const executionResult = await fixture.runtime.execute(CliCommandName.RUN);
        const diagnosticsTracePath = executionResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "diagnostics_trace",
        )?.path;
        expect(typeof diagnosticsTracePath).toBe("string");

        const diagnosticsTrace = JSON.parse(
          await readFile(String(diagnosticsTracePath), "utf8"),
        ) as Record<string, unknown>;
        expect((diagnosticsTrace.mode as Record<string, unknown>).dryRun).toBe(true);
        expect((diagnosticsTrace.mode as Record<string, unknown>).trace).toBe(true);
        expect(Array.isArray(diagnosticsTrace.stageTimings)).toBe(true);
        expect(
          Array.isArray((diagnosticsTrace.errorContext as Record<string, unknown>).stageErrors),
        ).toBe(true);
      },
      {
        runtimeDebugOptions: {
          dryRun: true,
          trace: true,
          replayPath: null,
        },
      },
    );
  });

  it("supports replay diagnostics from execution report artifacts", async () => {
    await withRuntimeFixture(async (fixture) => {
      const runtimeWithOverrides = fixture.runtime as unknown as {
        collectGitChangedPaths: () => Promise<string[]>;
      };
      runtimeWithOverrides.collectGitChangedPaths = async () => [];
      const runResult = await fixture.runtime.execute(CliCommandName.RUN);
      const reportPath = runResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === "execution_report",
      )?.path;
      expect(typeof reportPath).toBe("string");

      const replayRuntime = new CliGovernanceRuntime({
        currentWorkingDirectory: fixture.tempRoot,
        workspace: fixture.workspace,
        configSource: "default",
        profileId: null,
        locale: "en-US",
        outputMode: ErrorOutputEnvironment.PLAIN,
        isTty: false,
        memoryConfig: {
          ...DEFAULT_MEMORY_RUNTIME_CONFIG,
          storeRoot: "context/memory",
        },
        memoryStoreRoot: fixture.memoryStoreRoot,
        memoryStoreProviderName: fixture.provider.constructor.name,
        memoryStoreProvider: fixture.provider,
        adaptersConfig: createAdaptersConfigFixture(),
        adapterLocalProbeOverrides: createAdapterLocalProbeOverrides(),
        codexExecRunner: createCodexExecRunnerFixture(),
        runtimeDebugOptions: {
          dryRun: false,
          trace: true,
          replayPath: String(reportPath),
        },
      });
      const replayResult = await replayRuntime.execute(CliCommandName.RUN);

      expect(replayResult.commandResult.operation).toBe("governance_run_replay");
      expect(replayResult.commandResult.details?.replay_source_type).toBe("execution_report");
      const replayDiagnosticsPath = replayResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === "replay_diagnostics",
      )?.path;
      expect(typeof replayDiagnosticsPath).toBe("string");
    });
  });

  it("writes review-verify ledger backfill artifact with attribution metadata", async () => {
    await withRuntimeFixture(async (fixture) => {
      await fixture.runtime.execute(CliCommandName.REVIEW);
      const verifyResult = await fixture.runtime.execute(CliCommandName.REVIEW_VERIFY);

      const verifyArtifactPath = verifyResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === "review_verify_result",
      )?.path;
      const backfillArtifactPath = verifyResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === "review_ledger_backfill",
      )?.path;
      expect(typeof verifyArtifactPath).toBe("string");
      expect(typeof backfillArtifactPath).toBe("string");

      const verifyPayload = JSON.parse(await readFile(String(verifyArtifactPath), "utf8")) as {
        ledgerBackfillPath?: string;
      };
      const backfillPayload = JSON.parse(await readFile(String(backfillArtifactPath), "utf8")) as {
        status?: string;
        attribution?: { chain?: string };
      };
      expect(verifyPayload.ledgerBackfillPath).toBe(backfillArtifactPath);
      expect(backfillPayload.status).toBe("pending");
      expect(backfillPayload.attribution?.chain).toBe("review->review-verify->ledger-backfill");
    });
  });

  it("auto-applies task ledger backfill when review chain runs with --record-ledger and --task-id", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        await writeTaskCardFixture(fixture.workspaceRoot, "TK-130");
        await fixture.runtime.execute(CliCommandName.REVIEW);
        const verifyResult = await fixture.runtime.execute(CliCommandName.REVIEW_VERIFY);

        const backfillArtifactPath = verifyResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "review_ledger_backfill",
        )?.path;
        expect(typeof backfillArtifactPath).toBe("string");

        const backfillPayload = JSON.parse(
          await readFile(String(backfillArtifactPath), "utf8"),
        ) as {
          status?: string;
          taskId?: string;
        };
        expect(backfillPayload.status).toBe("applied");
        expect(backfillPayload.taskId).toBe("TK-130");
        expect(
          verifyResult.commandResult.experience?.roleProgress.some(
            (row) =>
              row.stage === ExecutionProgressStage.LEDGER_BACKFILL &&
              row.status === ExecutionProgressStatus.COMPLETED,
          ),
        ).toBe(true);

        const tasksCsvPath = resolve(
          fixture.workspaceRoot,
          "context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/tasks.csv",
        );
        const checklistPath = resolve(
          fixture.workspaceRoot,
          "context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/checklist.md",
        );
        const tasksCsvContent = await readFile(tasksCsvPath, "utf8");
        const checklistContent = await readFile(checklistPath, "utf8");

        expect(tasksCsvContent).toContain("TK-130");
        expect(tasksCsvContent).toContain("review-verify review-verify-");
        expect(tasksCsvContent).toContain("managed ledger backfill applied from review-verify-");
        expect(checklistContent).toContain("自动消费 review-verify 产物并完成 ledger backfill");
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          recordLedger: true,
          taskId: "TK-130",
        },
      },
    );
  });

  it("writes connect diagnostics and optional ledger-backfill artifacts", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const connectResult = await fixture.runtime.execute(CliCommandName.CONNECT);

        expect(connectResult.commandResult.operation).toBe("adapter_connect");
        const diagnosticsArtifactPath = connectResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "connect_diagnostics",
        )?.path;
        const ledgerArtifactPath = connectResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "connect_ledger_backfill",
        )?.path;
        expect(typeof diagnosticsArtifactPath).toBe("string");
        expect(typeof ledgerArtifactPath).toBe("string");
        const ledgerPayload = JSON.parse(await readFile(String(ledgerArtifactPath), "utf8")) as {
          taskId?: string;
          attribution?: { chainStep?: string };
        };
        expect(ledgerPayload.taskId).toBe("TK-082");
        expect(ledgerPayload.attribution?.chainStep).toBe("connect");
        expect(
          connectResult.commandResult.experience?.roleProgress.some(
            (row) => row.stage === ExecutionProgressStage.CONNECT,
          ),
        ).toBe(true);
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
          recordLedger: true,
          taskId: "TK-082",
        },
      },
    );
  });

  it("dispatches extracted init/check/plan/upgrade/run commands through the facade registry", async () => {
    await withRuntimeFixture(async (fixture) => {
      const initResult = await fixture.runtime.execute(CliCommandName.INIT);
      const checkResult = await fixture.runtime.execute(CliCommandName.CHECK);
      const planResult = await fixture.runtime.execute(CliCommandName.PLAN);
      const upgradeResult = await fixture.runtime.execute(CliCommandName.UPGRADE);
      const runtimeWithOverrides = fixture.runtime as unknown as {
        collectGitChangedPaths: () => Promise<string[]>;
      };
      runtimeWithOverrides.collectGitChangedPaths = async () => [];
      const runResult = await fixture.runtime.execute(CliCommandName.RUN);

      expect(initResult.commandResult.operation).toBe("workspace_init");
      expect(checkResult.commandResult.operation).toBe("governance_check");
      expect(planResult.commandResult.operation).toBe("plan_snapshot");
      expect(upgradeResult.commandResult.operation).toBe("schema_upgrade_analyze");
      expect(runResult.commandResult.operation).toBe("governance_run");
    });
  });

  it("assembles task-driven run flow when --task-id points to a canonical task card", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        await writeTaskCardFixture(fixture.workspaceRoot, "TK-099");
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => [];

        const runResult = await fixture.runtime.execute(CliCommandName.RUN);

        expect(runResult.commandResult.operation).toBe("governance_run");
        expect(runResult.commandResult.details?.assembly_mode).toBe("task_driven");
        expect(runResult.commandResult.details?.task_id).toBe("TK-099");
        expect(runResult.commandResult.details?.assembly_node_count).toBe(6);
        expect(runResult.commandResult.details?.input_reference_count).toBe(3);
        expect(runResult.commandResult.details?.input_artifact_count).toBe(2);
        expect(runResult.commandResult.details?.inline_review_chain_enabled).toBe(true);
        expect(runResult.commandResult.details?.inline_review_chain_status).toBe("applied");
        expect(typeof runResult.commandResult.details?.inline_review_request_path).toBe("string");
        expect(typeof runResult.commandResult.details?.inline_review_verify_path).toBe("string");
        expect(typeof runResult.commandResult.details?.inline_review_ledger_backfill_path).toBe(
          "string",
        );
        expect(
          runResult.commandResult.checks?.find((check) => check.id === "assembly")?.detail,
        ).toContain("mode=task_driven");
        expect(
          runResult.commandResult.checks?.find((check) => check.id === "assembly")?.detail,
        ).toContain("input_references=3");
        expect(
          runResult.commandResult.checks?.find((check) => check.id === "review_chain")?.detail,
        ).toContain("status=applied");
        expect(
          runResult.commandResult.artifacts?.some(
            (artifact) => artifact.id === "inline_review_request",
          ),
        ).toBe(true);
        expect(
          runResult.commandResult.artifacts?.some(
            (artifact) => artifact.id === "inline_review_verify_result",
          ),
        ).toBe(true);
        expect(
          runResult.commandResult.artifacts?.some(
            (artifact) => artifact.id === "inline_review_ledger_backfill",
          ),
        ).toBe(true);
        expect(
          runResult.commandResult.experience?.roleProgress.some(
            (row) =>
              row.stage === ExecutionProgressStage.REVIEW &&
              row.status === ExecutionProgressStatus.COMPLETED,
          ),
        ).toBe(true);
        expect(
          runResult.commandResult.experience?.roleProgress.some(
            (row) =>
              row.stage === ExecutionProgressStage.REVIEW_VERIFY &&
              row.status === ExecutionProgressStatus.COMPLETED,
          ),
        ).toBe(true);
        expect(
          runResult.commandResult.experience?.roleProgress.some(
            (row) =>
              row.stage === ExecutionProgressStage.LEDGER_BACKFILL &&
              row.status === ExecutionProgressStatus.COMPLETED,
          ),
        ).toBe(true);

        const reviewQueueRequestDirectoryPath = resolve(
          fixture.workspaceRoot,
          "context",
          "review-queue",
          "requests",
        );
        const reviewQueueResultDirectoryPath = resolve(
          fixture.workspaceRoot,
          "context",
          "review-queue",
          "results",
        );
        const reviewQueueRequestFileNames = await readdir(reviewQueueRequestDirectoryPath);
        const reviewQueueResultFileNames = await readdir(reviewQueueResultDirectoryPath);
        expect(reviewQueueRequestFileNames.some((fileName) => fileName.startsWith("review-"))).toBe(
          true,
        );
        expect(
          reviewQueueResultFileNames.some((fileName) => fileName.startsWith("review-verify-")),
        ).toBe(true);

        const sourceRequestPath = resolve(
          reviewQueueRequestDirectoryPath,
          reviewQueueRequestFileNames[0] ?? "",
        );
        const sourceRequestPayload = JSON.parse(await readFile(sourceRequestPath, "utf8")) as {
          status?: string;
          ledgerBackfillStatus?: string;
        };
        expect(sourceRequestPayload.status).toBe("verified");
        expect(sourceRequestPayload.ledgerBackfillStatus).toBe("applied");
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
          taskId: "TK-099",
        },
      },
    );
  });

  it("persists controlled delivery rehearsal artifacts and exposes replay-linked audit pointers", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        await writeDeliveryTaskCardFixture(fixture.workspaceRoot, "TK-107");
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => [];

        const runResult = await fixture.runtime.execute(CliCommandName.RUN);

        expect(runResult.commandResult.details?.task_id).toBe("TK-107");
        expect(runResult.commandResult.details?.delivery_rehearsal_enabled).toBe(true);
        expect(runResult.commandResult.details?.delivery_rehearsal_status).toBe("applied");
        expect(runResult.commandResult.details?.delivery_rehearsal_action).toBe("pr_draft");
        expect(typeof runResult.commandResult.details?.delivery_rehearsal_path).toBe("string");
        expect(
          runResult.commandResult.checks?.find((check) => check.id === "delivery_rehearsal")
            ?.detail,
        ).toContain("status=applied");
        expect(
          runResult.commandResult.artifacts?.some(
            (artifact) => artifact.id === "delivery_rehearsal",
          ),
        ).toBe(true);
        expect(
          runResult.commandResult.experience?.roleProgress.some(
            (row) =>
              row.stage === ExecutionProgressStage.DELIVERY_REHEARSAL &&
              row.status === ExecutionProgressStatus.COMPLETED,
          ),
        ).toBe(true);

        const deliveryRehearsalPath = String(
          runResult.commandResult.details?.delivery_rehearsal_path,
        );
        const deliveryRehearsalPayload = JSON.parse(
          await readFile(deliveryRehearsalPath, "utf8"),
        ) as {
          rehearsalAction?: string;
          mode?: string;
          auditReplay?: { artifactId?: string; stageId?: string };
        };
        expect(deliveryRehearsalPayload.rehearsalAction).toBe("pr_draft");
        expect(deliveryRehearsalPayload.mode).toBe("rehearsal_only");
        expect(deliveryRehearsalPayload.auditReplay?.artifactId).toBe("delivery_rehearsal");
        expect(deliveryRehearsalPayload.auditReplay?.stageId).toBe("stage-delivery-rehearsal");

        const reportPath = String(
          runResult.commandResult.artifacts?.find((artifact) => artifact.id === "execution_report")
            ?.path,
        );
        const executionReport = JSON.parse(await readFile(reportPath, "utf8")) as {
          replayPointers?: Array<{ stageId?: string; artifactId?: string }>;
        };
        expect(
          executionReport.replayPointers?.some(
            (pointer) =>
              pointer.stageId === "stage-delivery-rehearsal" &&
              pointer.artifactId === "delivery_rehearsal",
          ),
        ).toBe(true);
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
          taskId: "TK-107",
        },
      },
    );
  });

  it("skips delivery rehearsal side effects during task-driven dry-run execution", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        await writeDeliveryTaskCardFixture(fixture.workspaceRoot, "TK-107");
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => [];

        const runResult = await fixture.runtime.execute(CliCommandName.RUN);

        expect(runResult.commandResult.details?.delivery_rehearsal_enabled).toBe(true);
        expect(runResult.commandResult.details?.delivery_rehearsal_status).toBe("dry_run");
        expect(runResult.commandResult.details?.delivery_rehearsal_path).toBeNull();
        expect(
          runResult.commandResult.artifacts?.some(
            (artifact) => artifact.id === "delivery_rehearsal",
          ),
        ).toBe(false);
        expect(
          runResult.commandResult.experience?.roleProgress.some(
            (row) =>
              row.stage === ExecutionProgressStage.DELIVERY_REHEARSAL &&
              row.status === ExecutionProgressStatus.WARNING,
          ),
        ).toBe(true);
      },
      {
        runtimeDebugOptions: {
          dryRun: true,
          trace: false,
          replayPath: null,
          adapters: true,
          taskId: "TK-107",
        },
      },
    );
  });

  it("auto-bootstraps workspace config when connect runs before explicit init", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        await rm(fixture.workspace.configPath, { force: true });
        await fixture.runtime.execute(CliCommandName.CONNECT);
        const configContent = await readFile(fixture.workspace.configPath, "utf8");

        expect(configContent).toContain('schemaVersion: "1.1"');
        expect(configContent).toContain("workspace:");
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
      },
    );
  });

  it("marks runtime availability unavailable when local probe fails despite configured available", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const connectResult = await fixture.runtime.execute(CliCommandName.CONNECT);
        const diagnosticsArtifactPath = connectResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "connect_diagnostics",
        )?.path;
        expect(typeof diagnosticsArtifactPath).toBe("string");

        const diagnosticsPayload = JSON.parse(
          await readFile(String(diagnosticsArtifactPath), "utf8"),
        ) as {
          verification?: {
            tools?: Array<{
              toolId?: string;
              configuredAvailability?: string | null;
              availabilityStatus?: string;
              unavailableReasons?: string[];
            }>;
          };
        };
        const codexSnapshot = diagnosticsPayload.verification?.tools?.find(
          (tool) => tool.toolId === AdapterSurface.CODEX,
        );
        expect(codexSnapshot?.configuredAvailability).toBe(AdapterAvailability.AVAILABLE);
        expect(codexSnapshot?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
        expect(codexSnapshot?.unavailableReasons ?? []).toContain("command_missing:codex:codex");
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
        adapterLocalProbeOverrides: {
          [AdapterSurface.CODEX]: {
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            unavailableReasons: ["command_missing:codex:codex"],
          },
          [AdapterSurface.CLAUDE_CODE]: {
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            unavailableReasons: [],
          },
          [AdapterSurface.GITHUB_COPILOT]: {
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            unavailableReasons: [],
          },
        },
      },
    );
  });

  it("renders human-friendly unavailable reason details in doctor adapter checks", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const doctorResult = await fixture.runtime.execute(CliCommandName.DOCTOR);
        const codexCheck = doctorResult.commandResult.checks?.find(
          (check) => check.id === "adapter_tool_codex",
        );
        const claudeCheck = doctorResult.commandResult.checks?.find(
          (check) => check.id === "adapter_tool_claude-code",
        );

        expect(codexCheck?.detail).toContain('missing command "codex"');
        expect(claudeCheck?.detail).toContain("command exists but check failed");
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
        adapterLocalProbeOverrides: {
          [AdapterSurface.CODEX]: {
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            unavailableReasons: ["command_missing:codex:codex"],
          },
          [AdapterSurface.CLAUDE_CODE]: {
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            unavailableReasons: [
              "command_probe_failed:claude-code:claude:exit_code_1:login_required",
            ],
          },
          [AdapterSurface.GITHUB_COPILOT]: {
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            unavailableReasons: [],
          },
        },
      },
    );
  });

  it("surfaces codex credential failures as diagnostics and next actions", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const connectResult = await fixture.runtime.execute(CliCommandName.CONNECT);
        const diagnosticsArtifactPath = connectResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "connect_diagnostics",
        )?.path;
        expect(typeof diagnosticsArtifactPath).toBe("string");

        const diagnosticsPayload = JSON.parse(
          await readFile(String(diagnosticsArtifactPath), "utf8"),
        ) as {
          verification?: {
            tools?: Array<{
              toolId?: string;
              availabilityStatus?: string;
              unavailableReasons?: string[];
            }>;
            nextActions?: string[];
          };
        };
        const codexSnapshot = diagnosticsPayload.verification?.tools?.find(
          (tool) => tool.toolId === AdapterSurface.CODEX,
        );

        expect(codexSnapshot?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
        expect(codexSnapshot?.unavailableReasons ?? []).toContain("credential_missing:codex");
        expect(
          diagnosticsPayload.verification?.nextActions?.some((action) =>
            action.includes("Authenticate or refresh login"),
          ),
        ).toBe(true);

        const doctorResult = await fixture.runtime.execute(CliCommandName.DOCTOR);
        const codexCheck = doctorResult.commandResult.checks?.find(
          (check) => check.id === "adapter_tool_codex",
        );
        expect(codexCheck?.detail).toContain("missing required credentials or login state");
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
        codexExecRunner: createCodexCredentialFailureRunner(),
      },
    );
  });

  it("surfaces github copilot credential failures as diagnostics and next actions", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const connectResult = await fixture.runtime.execute(CliCommandName.CONNECT);
        const diagnosticsArtifactPath = connectResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "connect_diagnostics",
        )?.path;
        expect(typeof diagnosticsArtifactPath).toBe("string");

        const diagnosticsPayload = JSON.parse(
          await readFile(String(diagnosticsArtifactPath), "utf8"),
        ) as {
          verification?: {
            tools?: Array<{
              toolId?: string;
              availabilityStatus?: string;
              unavailableReasons?: string[];
            }>;
            nextActions?: string[];
          };
        };
        const githubCopilotSnapshot = diagnosticsPayload.verification?.tools?.find(
          (tool) => tool.toolId === AdapterSurface.GITHUB_COPILOT,
        );

        expect(githubCopilotSnapshot?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
        expect(githubCopilotSnapshot?.unavailableReasons ?? []).toContain(
          "credential_missing:github-copilot",
        );
        expect(
          diagnosticsPayload.verification?.nextActions?.some((action) =>
            action.includes("Authenticate or refresh login"),
          ),
        ).toBe(true);

        const doctorResult = await fixture.runtime.execute(CliCommandName.DOCTOR);
        const githubCopilotCheck = doctorResult.commandResult.checks?.find(
          (check) => check.id === "adapter_tool_github-copilot",
        );
        expect(githubCopilotCheck?.detail).toContain("missing required credentials or login state");
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
        githubCopilotExecRunner: createGithubCopilotCredentialFailureRunner(),
      },
    );
  });

  it("surfaces claude code credential failures as diagnostics and next actions", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const connectResult = await fixture.runtime.execute(CliCommandName.CONNECT);
        const diagnosticsArtifactPath = connectResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "connect_diagnostics",
        )?.path;
        expect(typeof diagnosticsArtifactPath).toBe("string");

        const diagnosticsPayload = JSON.parse(
          await readFile(String(diagnosticsArtifactPath), "utf8"),
        ) as {
          verification?: {
            tools?: Array<{
              toolId?: string;
              availabilityStatus?: string;
              unavailableReasons?: string[];
            }>;
            nextActions?: string[];
          };
        };
        const claudeCodeSnapshot = diagnosticsPayload.verification?.tools?.find(
          (tool) => tool.toolId === AdapterSurface.CLAUDE_CODE,
        );

        expect(claudeCodeSnapshot?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
        expect(claudeCodeSnapshot?.unavailableReasons ?? []).toContain(
          "credential_missing:claude-code",
        );
        expect(
          diagnosticsPayload.verification?.nextActions?.some((action) =>
            action.includes("Authenticate or refresh login"),
          ),
        ).toBe(true);

        const doctorResult = await fixture.runtime.execute(CliCommandName.DOCTOR);
        const claudeCodeCheck = doctorResult.commandResult.checks?.find(
          (check) => check.id === "adapter_tool_claude-code",
        );
        expect(claudeCodeCheck?.detail).toContain("missing required credentials or login state");
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
        claudeCodeExecRunner: createClaudeCodeCredentialFailureRunner(),
      },
    );
  });

  it("persists safe_local boundary and final next-actions in doctor diagnostics when fix is enabled", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const doctorResult = await fixture.runtime.execute(CliCommandName.DOCTOR);
        const diagnosticsArtifactPath = doctorResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "doctor_diagnostics",
        )?.path;
        expect(typeof diagnosticsArtifactPath).toBe("string");

        const diagnosticsPayload = JSON.parse(
          await readFile(String(diagnosticsArtifactPath), "utf8"),
        ) as {
          safeLocalBoundary?: {
            mode?: string;
            fixEnabled?: boolean;
            blockedMutations?: string[];
          };
          checks?: Array<{
            id?: string;
          }>;
          nextActions?: string[];
        };

        expect(diagnosticsPayload.safeLocalBoundary?.mode).toBe("safe_local_only");
        expect(diagnosticsPayload.safeLocalBoundary?.fixEnabled).toBe(true);
        expect(diagnosticsPayload.safeLocalBoundary?.blockedMutations ?? []).toContain(
          "local_model_model_pull",
        );
        expect(
          (diagnosticsPayload.checks ?? []).some((check) => check.id === "safe_local_fix"),
        ).toBe(true);
        expect(
          (diagnosticsPayload.nextActions ?? []).some((action) =>
            action.includes(
              "safe_local fix only creates writable workspace/config/memory baseline paths",
            ),
          ),
        ).toBe(true);
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
          fix: true,
        },
      },
    );
  });

  it("writes doctor diagnostics even when fix runs without adapters", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const doctorResult = await fixture.runtime.execute(CliCommandName.DOCTOR);
        const diagnosticsArtifactPath = doctorResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "doctor_diagnostics",
        )?.path;
        expect(typeof diagnosticsArtifactPath).toBe("string");

        const diagnosticsPayload = JSON.parse(
          await readFile(String(diagnosticsArtifactPath), "utf8"),
        ) as {
          options?: {
            adapters?: boolean;
            fix?: boolean;
          };
          safeLocalBoundary?: {
            mode?: string;
          };
          checks?: Array<{
            id?: string;
          }>;
          nextActions?: string[];
          verification?: unknown;
        };

        expect(diagnosticsPayload.options?.adapters).toBe(false);
        expect(diagnosticsPayload.options?.fix).toBe(true);
        expect(diagnosticsPayload.safeLocalBoundary?.mode).toBe("safe_local_only");
        expect(
          (diagnosticsPayload.checks ?? []).some((check) => check.id === "safe_local_fix"),
        ).toBe(true);
        expect(diagnosticsPayload.verification).toBeUndefined();
        expect(
          (diagnosticsPayload.nextActions ?? []).some((action) =>
            action.includes(
              "safe_local fix only creates writable workspace/config/memory baseline paths",
            ),
          ),
        ).toBe(true);
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: false,
          fix: true,
        },
      },
    );
  });

  it("emits actionable next-actions for missing command and probe failures", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const connectResult = await fixture.runtime.execute(CliCommandName.CONNECT);
        const diagnosticsArtifactPath = connectResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "connect_diagnostics",
        )?.path;
        expect(typeof diagnosticsArtifactPath).toBe("string");

        const diagnosticsPayload = JSON.parse(
          await readFile(String(diagnosticsArtifactPath), "utf8"),
        ) as {
          nextActions?: string[];
        };
        const nextActions = diagnosticsPayload.nextActions ?? [];
        expect(
          nextActions.some((action) =>
            action.includes("Install missing local commands before connect/verify"),
          ),
        ).toBe(true);
        expect(
          nextActions.some((action) => action.includes("Some commands exist but probe failed")),
        ).toBe(true);
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
        adapterLocalProbeOverrides: {
          [AdapterSurface.CODEX]: {
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            unavailableReasons: ["command_missing:codex:codex"],
          },
          [AdapterSurface.CLAUDE_CODE]: {
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            unavailableReasons: [
              "command_probe_failed:claude-code:claude:exit_code_1:login_required",
            ],
          },
          [AdapterSurface.GITHUB_COPILOT]: {
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            unavailableReasons: [],
          },
        },
      },
    );
  });

  it("fails verify when required role routing has no available tool", async () => {
    const failingAdaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: "coder",
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CODEX,
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.UNAVAILABLE,
          unavailableReasons: ["login_required"],
        },
      ],
    };

    await withRuntimeFixture(
      async (fixture) => {
        await expect(fixture.runtime.execute(CliCommandName.VERIFY)).rejects.toMatchObject({
          code: GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
        });
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
        adaptersConfig: failingAdaptersConfig,
      },
    );
  });

  it("returns adapter_verify operation when verify passes", async () => {
    await withRuntimeFixture(
      async (fixture) => {
        const verifyResult = await fixture.runtime.execute(CliCommandName.VERIFY);

        expect(verifyResult.commandResult.operation).toBe("adapter_verify");
        expect(verifyResult.commandResult.details?.adapters_status).toBe("pass");
        expect(
          verifyResult.commandResult.experience?.roleProgress.some(
            (row) =>
              row.stage === ExecutionProgressStage.VERIFY &&
              row.status === ExecutionProgressStatus.COMPLETED,
          ),
        ).toBe(true);
      },
      {
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
      },
    );
  });

  it("fails verify when only local-model fallback is available for unsupported required roles", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            models: [
              {
                name: "qwen2.5-coder:7b",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await withRuntimeFixture(
      async (fixture) => {
        await expect(fixture.runtime.execute(CliCommandName.VERIFY)).rejects.toMatchObject({
          code: GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
        });
      },
      {
        adaptersConfig: createLocalFallbackAdaptersConfig(),
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
        adapterLocalProbeOverrides: {
          [AdapterSurface.CODEX]: {
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            unavailableReasons: [],
          },
          [AdapterSurface.CLAUDE_CODE]: {
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            unavailableReasons: [],
          },
          [AdapterSurface.GITHUB_COPILOT]: {
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            unavailableReasons: [],
          },
        },
        commandProbeExecutor: async () => undefined,
      },
    );
  });

  it("keeps endpoint-backed ollama probe available when local binary is missing", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            models: [
              {
                name: "qwen2.5-coder:7b",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await withRuntimeFixture(
      async (fixture) => {
        const connectResult = await fixture.runtime.execute(CliCommandName.CONNECT);
        const diagnosticsArtifactPath = connectResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "connect_diagnostics",
        )?.path;
        expect(typeof diagnosticsArtifactPath).toBe("string");

        const diagnosticsPayload = JSON.parse(
          await readFile(String(diagnosticsArtifactPath), "utf8"),
        ) as {
          verification?: {
            tools?: Array<{
              toolId?: string;
              availabilityStatus?: string;
              unavailableReasons?: string[];
            }>;
          };
        };
        const ollamaSnapshot = diagnosticsPayload.verification?.tools?.find(
          (tool) => tool.toolId === AdapterSurface.OLLAMA,
        );

        expect(ollamaSnapshot?.availabilityStatus).toBe(AgentAvailabilityStatus.AVAILABLE);
        expect(ollamaSnapshot?.unavailableReasons ?? []).not.toContain(
          "command_missing:ollama:ollama",
        );
      },
      {
        adaptersConfig: createLocalFallbackAdaptersConfig(),
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
        adapterLocalProbeOverrides: {
          [AdapterSurface.CODEX]: {
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            unavailableReasons: [],
          },
          [AdapterSurface.CLAUDE_CODE]: {
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            unavailableReasons: [],
          },
          [AdapterSurface.GITHUB_COPILOT]: {
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            unavailableReasons: [],
          },
        },
        commandProbeExecutor: async (command) => {
          if (command === "ollama") {
            const error = new RuntimeError(
              GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
              "spawn ollama ENOENT",
            ) as NodeJS.ErrnoException;
            error.code = "ENOENT";
            throw error;
          }
        },
      },
    );
  });

  it("reports configuration_missing attribution for incomplete local-model config", async () => {
    const adaptersConfig = createRestrictedNetworkRehearsalAdaptersConfig();
    const ollamaTool = adaptersConfig.tools?.find((tool) => tool.toolId === AdapterSurface.OLLAMA);
    if (ollamaTool) {
      ollamaTool.localModel = undefined;
    }

    await withRuntimeFixture(
      async (fixture) => {
        const connectResult = await fixture.runtime.execute(CliCommandName.CONNECT);
        const diagnosticsArtifactPath = connectResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "connect_diagnostics",
        )?.path;
        expect(typeof diagnosticsArtifactPath).toBe("string");

        const diagnosticsPayload = JSON.parse(
          await readFile(String(diagnosticsArtifactPath), "utf8"),
        ) as {
          nextActions?: string[];
          verification?: {
            failureAttributionSummary?: Record<string, number>;
            tools?: Array<{
              toolId?: string;
              unavailableReasons?: string[];
              failureAttributions?: string[];
            }>;
          };
        };
        const ollamaSnapshot = diagnosticsPayload.verification?.tools?.find(
          (tool) => tool.toolId === AdapterSurface.OLLAMA,
        );

        expect(ollamaSnapshot?.unavailableReasons ?? []).toContain(
          "local_model_config_missing:ollama:provider|endpoint|model",
        );
        expect(ollamaSnapshot?.failureAttributions ?? []).toContain("configuration_missing");
        expect(
          diagnosticsPayload.verification?.failureAttributionSummary?.configuration_missing ?? 0,
        ).toBeGreaterThan(0);
        expect(
          (diagnosticsPayload.nextActions ?? []).some((action) =>
            action.includes("Provide adapters.tools[].localModel"),
          ),
        ).toBe(true);
      },
      {
        adaptersConfig,
        runtimeDebugOptions: {
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
        },
      },
    );
  });

  it("keeps restricted-network local fallback gated by required capabilities", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input).includes("/api/tags")) {
        return new Response(
          JSON.stringify({
            models: [
              {
                name: "qwen2.5-coder:7b",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          response: "restricted-network local fallback completed",
          done: true,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await withRuntimeFixture(
      async (fixture) => {
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => [];

        const runResult = await fixture.runtime.execute(CliCommandName.RUN);
        expect(runResult.commandResult.details?.runtime_status).toBe("failed");
        expect(
          runResult.commandResult.checks?.some(
            (check) => check.id === "runtime" && check.detail.includes("status=failed"),
          ),
        ).toBe(true);
      },
      {
        adaptersConfig: createRestrictedNetworkRehearsalAdaptersConfig(),
        runtimeDebugOptions: {
          dryRun: false,
          trace: true,
          replayPath: null,
          restrictedNetwork: true,
          restrictedReason: "ci_restricted_rehearsal",
          allowLocalFallback: true,
        },
      },
    );
  });

  it("supports restricted-network local fallback rehearsal during run when capability-compatible", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input).includes("/api/tags")) {
        return new Response(
          JSON.stringify({
            models: [
              {
                name: "qwen2.5-coder:7b",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          response: "restricted-network local fallback completed",
          done: true,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await withRuntimeFixture(
      async (fixture) => {
        const runtimeWithOverrides = fixture.runtime as unknown as {
          collectGitChangedPaths: () => Promise<string[]>;
        };
        runtimeWithOverrides.collectGitChangedPaths = async () => [];

        const runResult = await fixture.runtime.execute(CliCommandName.RUN);
        const diagnosticsTracePath = runResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === "diagnostics_trace",
        )?.path;
        expect(runResult.commandResult.details?.runtime_status).toBe("succeeded");
        expect(typeof diagnosticsTracePath).toBe("string");

        const tracePayload = JSON.parse(await readFile(String(diagnosticsTracePath), "utf8")) as {
          adapterInvocationSummary?: Array<{
            selectedSurface?: string;
            adapterSurface?: string;
            localFallbackActivated?: boolean;
            restrictedReason?: string | null;
          }>;
        };

        expect(
          (tracePayload.adapterInvocationSummary ?? []).some(
            (stage) =>
              stage.selectedSurface === AGENT_LOCAL_FALLBACK_SURFACE &&
              stage.adapterSurface === AdapterSurface.OLLAMA &&
              stage.localFallbackActivated === true &&
              stage.restrictedReason === "ci_restricted_rehearsal",
          ),
        ).toBe(true);
      },
      {
        adaptersConfig: createRestrictedNetworkCapabilityCompatibleAdaptersConfig(),
        runtimeDebugOptions: {
          dryRun: false,
          trace: true,
          replayPath: null,
          restrictedNetwork: true,
          restrictedReason: "ci_restricted_rehearsal",
          allowLocalFallback: true,
        },
      },
    );
  });
});
