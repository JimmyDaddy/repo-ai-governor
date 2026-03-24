import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { AgentCapability } from "@repo-ai-governor/adapter-sdk";
import type { AdaptersConfig } from "@repo-ai-governor/config";
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

describe("CliTaskDrivenRunRuntime", () => {
  it("builds task-driven assembly from semantic task-card sections and preserves full input references", async () => {
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

## 2.2 Input References

1. \`.repo-ai-governor/context/dev/project-011/tasks/DA-121-shared-and-package-local-boundary-hardening-and-exports-cleanup.md\`
2. \`.repo-ai-governor/context/dev/project-011/tasks/DA-122-cli-package-regression-smoke-and-test-topology-hardening.md\`
3. \`.repo-ai-governor/context/dev/project-011/project-011-cli-package-decomposition-completion-audit-summary.md\`
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
        }),
      );
      expect(assembly.stageInputs["node-task-execute"]?.executionRoleProfileId).toBe(
        DefaultRoleProfileId.CODER,
      );
      expect(assembly.stageInputs["node-task-verify"]?.verificationRoleProfileId).toBe(
        DefaultRoleProfileId.VERIFIER,
      );
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
});
