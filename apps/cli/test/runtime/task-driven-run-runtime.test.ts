import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { AgentCapability } from "@repo-ai-governor/adapter-sdk";
import type { AdaptersConfig } from "@repo-ai-governor/config";
import { MemoryManager, MemoryScope } from "@repo-ai-governor/core-memory";
import {
  MemoryStoreAdapter,
  type MemoryStoreProvider,
} from "@repo-ai-governor/memory-store-adapter";
import {
  AdapterAvailability,
  AdapterSurface,
  DefaultRoleProfileId,
} from "@repo-ai-governor/shared";
import { CliTaskDrivenRunAssemblyMode } from "../../src/constants/cli-task-driven-run.constant.js";
import { CliTaskDrivenRunRuntime } from "../../src/runtime/task-driven-run-runtime.js";

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
      {
        roleId: "verifier",
        roleProfileId: DefaultRoleProfileId.VERIFIER,
        requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
        required: true,
      },
    ],
    routing: {
      roleBindings: {
        planner: {
          primarySurface: AdapterSurface.CODEX,
        },
        coder: {
          primarySurface: AdapterSurface.GITHUB_COPILOT,
        },
        reviewer: {
          primarySurface: AdapterSurface.CLAUDE_CODE,
        },
        verifier: {
          primarySurface: AdapterSurface.CODEX,
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

function createInMemoryStoreProvider(): MemoryStoreProvider {
  const records = new Map<
    string,
    { value: Record<string, unknown>; tags: string[]; updatedAt: string }
  >();

  return {
    async read(namespace, key) {
      const record = records.get(`${namespace}:${key}`);
      if (!record) {
        return undefined;
      }

      return {
        namespace,
        key,
        value: record.value,
        tags: record.tags,
        updatedAt: record.updatedAt,
      };
    },
    async write(record) {
      records.set(`${record.namespace}:${record.key}`, {
        value: record.value,
        tags: record.tags,
        updatedAt: record.updatedAt,
      });
    },
    async query(request) {
      return Array.from(records.entries())
        .map(([compoundKey, record]) => {
          const delimiterIndex = compoundKey.indexOf(":");
          return {
            namespace: compoundKey.slice(0, delimiterIndex),
            key: compoundKey.slice(delimiterIndex + 1),
            value: record.value,
            tags: record.tags,
            updatedAt: record.updatedAt,
          };
        })
        .filter((record) => {
          if (request.namespace && record.namespace !== request.namespace) {
            return false;
          }

          if (request.keyPrefix && !record.key.startsWith(request.keyPrefix)) {
            return false;
          }

          if (request.tag && !record.tags.includes(request.tag)) {
            return false;
          }

          return true;
        });
    },
    async snapshot() {
      return {
        snapshotId: "snapshot-task-driven-runtime-unit",
        createdAt: "2026-03-24T00:00:00Z",
        recordCount: records.size,
        snapshotPath: "/tmp/snapshot-task-driven-runtime-unit.json",
      };
    },
    async archive() {
      return 0;
    },
  };
}

describe("CliTaskDrivenRunRuntime", () => {
  it("builds task-driven assembly from semantic task-card sections and preserves required input references", async () => {
    const workspaceRoot = await mkdtemp(resolve(tmpdir(), "repo-ai-governor-tk099-"));
    const taskCardPath = resolve(
      workspaceRoot,
      "context/dev/project-010/sprint-002/tasks/TK-099-task-driven-dag-and-run-mainchain-assembly.md",
    );
    await mkdir(resolve(taskCardPath, ".."), { recursive: true });
    await writeFile(
      taskCardPath,
      `# TK-099 任务驱动 DAG 与 \`run\` 主链装配

- Status: in_progress
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: \`project-010-local-model-and-ide-expansion\`
- Sprint: \`sprint-002-autonomous-mainchain-foundation\`

## 1. 任务目标

完成 DAG 装配、验证与回归检查。

## 2.1 Depends On

1. \`TK-098\`

## 2.2 Required Inputs

1. \`.repo-ai-governor/context/dev/project-011/tasks/DA-121-shared-and-package-local-boundary-hardening-and-exports-cleanup.md\`
2. \`.repo-ai-governor/context/dev/project-011/tasks/DA-122-cli-package-regression-smoke-and-test-topology-hardening.md\`
3. \`.repo-ai-governor/context/dev/project-011/project-011-cli-package-decomposition-completion-audit-summary.md\`

## 2.3 Traceback References

1. \`.repo-ai-governor/context/dev/project-010/project-010-rollout-notes.md\`
`,
      "utf8",
    );

    try {
      const runtime = new CliTaskDrivenRunRuntime(workspaceRoot);
      const assembly = await runtime.buildRunAssembly({
        executionId: "cli-run-001",
        taskId: "TK-099",
        adaptersConfig: createAdaptersConfigFixture(),
      });

      expect(assembly.assemblyMode).toBe(CliTaskDrivenRunAssemblyMode.TASK_DRIVEN);
      expect(assembly.taskContext?.taskId).toBe("TK-099");
      expect(assembly.taskContext?.dependsOnTaskIds).toEqual(["TK-098"]);
      expect(assembly.taskContext?.inputReferences).toHaveLength(3);
      expect(assembly.taskContext?.inputArtifacts).toHaveLength(2);
      expect(assembly.taskContext?.tracebackReferences).toHaveLength(1);
      expect(assembly.taskContext?.tracebackReferences).toEqual([
        expect.objectContaining({
          referencePath: ".repo-ai-governor/context/dev/project-010/project-010-rollout-notes.md",
        }),
      ]);
      expect(assembly.taskContext?.inputReferences).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            artifactId: null,
            referencePath:
              ".repo-ai-governor/context/dev/project-011/project-011-cli-package-decomposition-completion-audit-summary.md",
          }),
        ]),
      );
      expect(assembly.stageInputs["node-task-execute"]?.inputReferences).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            referencePath:
              ".repo-ai-governor/context/dev/project-011/project-011-cli-package-decomposition-completion-audit-summary.md",
          }),
        ]),
      );
      expect(
        assembly.processDefinition.nodes.map((node: { stageId?: string }) => node.stageId),
      ).toEqual([
        "stage-task-prepare",
        "stage-artifact-context",
        "stage-task-execute",
        "stage-task-verify",
        "stage-task-review",
        "stage-task-review-verify",
        "stage-task-report",
      ]);
      expect(assembly.processDefinition.globals?.taskContext).toEqual(
        expect.objectContaining({
          inputReferences: expect.arrayContaining([
            expect.objectContaining({
              referencePath:
                ".repo-ai-governor/context/dev/project-011/project-011-cli-package-decomposition-completion-audit-summary.md",
            }),
          ]),
          tracebackReferences: expect.arrayContaining([
            expect.objectContaining({
              referencePath:
                ".repo-ai-governor/context/dev/project-010/project-010-rollout-notes.md",
            }),
          ]),
        }),
      );
      expect(assembly.stageInputs["node-task-execute"]?.executionRoleProfileId).toBe(
        DefaultRoleProfileId.CODER,
      );
      expect(assembly.stageInputs["node-task-verify"]?.verificationRoleProfileId).toBe(
        DefaultRoleProfileId.VERIFIER,
      );
      expect(assembly.stageInputs["node-task-review"]?.managedReviewChain).toBe(true);
      expect(assembly.stageInputs["node-task-review-verify"]?.managedReviewChain).toBe(true);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("falls back to baseline assembly when task card cannot be resolved", async () => {
    const workspaceRoot = await mkdtemp(resolve(tmpdir(), "repo-ai-governor-tk099-missing-"));

    try {
      const runtime = new CliTaskDrivenRunRuntime(workspaceRoot);
      const assembly = await runtime.buildRunAssembly({
        executionId: "cli-run-002",
        taskId: "TK-404",
        adaptersConfig: createAdaptersConfigFixture(),
      });

      expect(assembly.assemblyMode).toBe(CliTaskDrivenRunAssemblyMode.TASK_ID_FALLBACK);
      expect(assembly.processDefinition.nodes).toHaveLength(3);
      expect(assembly.taskContext).toBeNull();
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("falls back to legacy Input References when Required Inputs is absent", async () => {
    const workspaceRoot = await mkdtemp(resolve(tmpdir(), "repo-ai-governor-tk099-legacy-"));
    const taskCardPath = resolve(
      workspaceRoot,
      "context/dev/project-010/sprint-002/tasks/TK-199-legacy-input-reference-shape.md",
    );
    await mkdir(resolve(taskCardPath, ".."), { recursive: true });
    await writeFile(
      taskCardPath,
      `# TK-199 兼容旧版输入引用

- Status: in_progress
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: \`project-010-local-model-and-ide-expansion\`
- Sprint: \`sprint-002-autonomous-mainchain-foundation\`

## 1. 任务目标

验证旧版 \`Input References\` 仍可被 task-driven runtime 解析。

## 2. Depends On

1. \`TK-198\`

## 4. Input References

1. \`.repo-ai-governor/context/dev/project-011/tasks/DA-121-shared-and-package-local-boundary-hardening-and-exports-cleanup.md\`
2. \`.repo-ai-governor/context/dev/project-011/project-011-cli-package-decomposition-completion-audit-summary.md\`
`,
      "utf8",
    );

    try {
      const runtime = new CliTaskDrivenRunRuntime(workspaceRoot);
      const assembly = await runtime.buildRunAssembly({
        executionId: "cli-run-003",
        taskId: "TK-199",
        adaptersConfig: createAdaptersConfigFixture(),
      });

      expect(assembly.assemblyMode).toBe(CliTaskDrivenRunAssemblyMode.TASK_DRIVEN);
      expect(assembly.taskContext?.inputReferences).toHaveLength(2);
      expect(assembly.taskContext?.tracebackReferences).toEqual([]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("injects selective memory snapshot metadata when task context and active stream are available", async () => {
    const workspaceRoot = await mkdtemp(resolve(tmpdir(), "repo-ai-governor-tk099-memory-"));
    const taskCardPath = resolve(
      workspaceRoot,
      "context/dev/project-010/sprint-002/tasks/TK-299-selective-memory-injection.md",
    );
    await mkdir(resolve(taskCardPath, ".."), { recursive: true });
    await writeFile(
      taskCardPath,
      `# TK-299 selective memory 注入

- Status: in_progress
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: \`project-010-local-model-and-ide-expansion\`
- Sprint: \`sprint-002-autonomous-mainchain-foundation\`

## 1. 任务目标

验证 task-driven runtime 只注入命中的 memory snapshot。

## 2. Depends On

1. \`TK-298\`

## 4. Required Inputs

1. \`DA-121\` \`.repo-ai-governor/context/dev/project-011/tasks/DA-121.md\`
`,
      "utf8",
    );

    try {
      const memoryManager = new MemoryManager(
        new MemoryStoreAdapter(createInMemoryStoreProvider()),
      );
      await memoryManager.writeEntry({
        scope: MemoryScope.EXECUTION,
        key: "historic:stage-report:record-1",
        payload: { artifactId: "DA-121" },
        tags: [
          "audit-record",
          "project:project-010-local-model-and-ide-expansion",
          "sprint:sprint-002-autonomous-mainchain-foundation",
          "task:TK-299",
          "artifact:DA-121",
        ],
      });

      const runtime = new CliTaskDrivenRunRuntime(workspaceRoot, memoryManager);
      const assembly = await runtime.buildRunAssembly({
        executionId: "cli-run-004",
        taskId: "TK-299",
        adaptersConfig: createAdaptersConfigFixture(),
        streamMetadata: {
          projectId: "project-010-local-model-and-ide-expansion",
          sprintId: "sprint-002-autonomous-mainchain-foundation",
        },
      });

      expect(assembly.memorySelection).toEqual(
        expect.objectContaining({
          executionId: "cli-run-004",
          taskId: "TK-299",
          projectId: "project-010-local-model-and-ide-expansion",
          sprintId: "sprint-002-autonomous-mainchain-foundation",
          artifactIds: ["DA-121"],
        }),
      );
      expect(assembly.memorySnapshotSummary).toEqual({
        normativeEntryCount: 0,
        executionEntryCount: 1,
        sessionEntryCount: 0,
      });
      expect(assembly.stageInputs["node-task-execute"]?.memorySnapshot).toEqual(
        expect.objectContaining({
          executionEntries: [
            expect.objectContaining({
              key: "historic:stage-report:record-1",
            }),
          ],
        }),
      );
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
