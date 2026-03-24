import { ChangeRiskRequiredAction } from "@repo-ai-governor/core-change-risk";
import { ProcessNodeType } from "@repo-ai-governor/core-process";
import { RuntimeExecutionStatus, RuntimeStageStatus } from "@repo-ai-governor/core-runtime";
import type { RuntimeExecutionResult } from "@repo-ai-governor/core-runtime";
import { ExecutionProgressStage } from "@repo-ai-governor/shared";
import { CliInlineReviewChainStatus } from "../../src/constants/cli-task-driven-run.constant.js";
import { CliCommandExperienceBuilder } from "../../src/runtime/presentation/command-experience-builder.js";

function createRuntimeResultFixture(): RuntimeExecutionResult {
  return {
    processId: "cli-minimal-governance-run",
    executionId: "exec-123",
    status: RuntimeExecutionStatus.SUCCEEDED,
    startedAt: "2026-03-24T12:00:00Z",
    endedAt: "2026-03-24T12:00:05Z",
    durationMs: 5000,
    visitedNodeIds: ["node-prepare", "node-execute"],
    stageResults: [
      {
        nodeId: "node-prepare",
        stageId: "stage-prepare",
        nodeType: ProcessNodeType.SEQUENTIAL,
        status: RuntimeStageStatus.SUCCEEDED,
        attempt: 1,
        startedAt: "2026-03-24T12:00:00Z",
        endedAt: "2026-03-24T12:00:01Z",
        durationMs: 1000,
      },
      {
        nodeId: "node-execute",
        stageId: "stage-execute",
        nodeType: ProcessNodeType.SEQUENTIAL,
        status: RuntimeStageStatus.SUCCEEDED,
        attempt: 1,
        startedAt: "2026-03-24T12:00:01Z",
        endedAt: "2026-03-24T12:00:05Z",
        durationMs: 4000,
      },
    ],
  };
}

describe("Cli command experience builder", () => {
  it("surfaces HITL follow-up and human confirmation progress for confirm outcomes", () => {
    const builder = new CliCommandExperienceBuilder();
    const experience = builder.createRunCommandExperience({
      executionId: "exec-123",
      runtimeResult: createRuntimeResultFixture(),
      policyResult: {
        policyOutcome: ChangeRiskRequiredAction.CONFIRM,
        matchedRuleIds: ["POL-1"],
      },
      reportPath: "/tmp/exec-123.report.json",
      replayPath: "/tmp/exec-123.replay.json",
      diagnosticsTracePath: "/tmp/exec-123.trace.json",
      reviewChain: {
        enabled: false,
        status: CliInlineReviewChainStatus.DISABLED,
        skipReason: null,
        reviewRequestPath: null,
        reviewVerifyPath: null,
        ledgerBackfillPath: null,
        reviewStageStatus: null,
        reviewVerifyStageStatus: null,
      },
    });

    expect(
      experience.roleProgress.some(
        (row) =>
          row.roleId === "human-reviewer" &&
          row.stage === ExecutionProgressStage.HUMAN_CONFIRMATION,
      ),
    ).toBe(true);
    expect(experience.interactionPrompts[0]?.blocking).toBe(true);
    expect(experience.layeredLogs.summary).toContain("root_cause=policy_hitl_required");
  });

  it("builds replay experience with diagnostics backlink and non-blocking prompts", () => {
    const builder = new CliCommandExperienceBuilder();
    const experience = builder.createReplayCommandExperience({
      replayPath: "/tmp/source.replay.json",
      diagnosticsPath: "/tmp/replay-diagnostics.json",
      replayResolution: {
        sourceType: "execution_report",
        executionId: "exec-234",
        explainResult: {
          executionId: "exec-234",
          query: {
            limit: 1,
          },
          matchedCount: 1,
          pointers: [],
          explainLines: ["line"],
        },
      },
    });

    expect(experience.roleProgress[0]?.backlink?.artifactPath).toBe("/tmp/replay-diagnostics.json");
    expect(experience.interactionPrompts.every((prompt) => prompt.blocking === false)).toBe(true);
  });
});
