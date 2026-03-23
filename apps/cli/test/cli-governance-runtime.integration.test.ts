import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { AgentCapability } from "@repo-ai-governor/adapter-sdk";
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
  GovernorErrorCode,
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
          primarySurface: AdapterSurface.CLAUDE_CODE,
          fallbackSurfaces: [AdapterSurface.CODEX],
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

describe("CliGovernanceRuntime policy/review safeguards", () => {
  it("fails run when policy outcome requires HITL confirmation", async () => {
    await withRuntimeFixture(async (fixture) => {
      const runtimeWithOverrides = fixture.runtime as unknown as {
        collectGitChangedPaths: () => Promise<string[]>;
      };
      // Why: deterministic change facts keep this test independent from host git state.
      runtimeWithOverrides.collectGitChangedPaths = async () => ["migrations/001.sql"];

      await expect(fixture.runtime.execute(CliCommandName.RUN)).rejects.toMatchObject({
        code: GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
      });
    });
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
    });
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
});
