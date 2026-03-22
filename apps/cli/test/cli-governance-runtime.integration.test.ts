import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import {
  type ResolvedWorkspace,
  WorkspaceMode,
  WorkspaceModeSource,
} from "@repo-ai-governor/config";
import { MemoryManager } from "@repo-ai-governor/core-memory";
import { AuditRecorder } from "@repo-ai-governor/core-session";
import { FsCsvMemoryStoreProvider } from "@repo-ai-governor/memory-provider-fs-csv";
import { MemoryStoreAdapter } from "@repo-ai-governor/memory-store-adapter";
import {
  DEFAULT_MEMORY_RUNTIME_CONFIG,
  ErrorOutputEnvironment,
  GovernorErrorCode,
} from "@repo-ai-governor/shared";
import { CliGovernanceRuntime } from "../src/cli-governance-runtime.js";
import { CliCommandName } from "../src/constants/cli-command.constant.js";

interface RuntimeFixture {
  tempRoot: string;
  workspaceRoot: string;
  runtime: CliGovernanceRuntime;
  provider: FsCsvMemoryStoreProvider;
}

/**
 * Creates one isolated runtime fixture for command integration tests.
 * @returns Runtime fixture with workspace and provider handles.
 */
async function createRuntimeFixture(): Promise<RuntimeFixture> {
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
  });

  return {
    tempRoot,
    workspaceRoot,
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
): Promise<void> {
  const fixture = await createRuntimeFixture();
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

  it("keeps review-verify source pinned to queued review request artifacts", async () => {
    await withRuntimeFixture(async (fixture) => {
      await fixture.runtime.execute(CliCommandName.REVIEW);
      await fixture.runtime.execute(CliCommandName.REVIEW_VERIFY);
      const secondVerifyResult = await fixture.runtime.execute(CliCommandName.REVIEW_VERIFY);

      const verifyArtifactPath = secondVerifyResult.commandResult.artifacts?.[0]?.path;
      expect(typeof verifyArtifactPath).toBe("string");
      const verifyPayload = JSON.parse(
        await readFile(String(verifyArtifactPath), "utf8"),
      ) as Record<string, unknown>;

      expect(String(verifyArtifactPath)).toMatch(/review-queue[\\/]+results[\\/]+review-verify-/u);
      expect(String(verifyPayload.sourceRequestPath)).toMatch(
        /review-queue[\\/]+requests[\\/]+review-/u,
      );
      expect(String(verifyPayload.sourceRequestPath)).not.toContain("review-verify-");
    });
  });
});
