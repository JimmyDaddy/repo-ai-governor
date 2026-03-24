import type { ChangeRiskRequiredAction } from "@repo-ai-governor/core-change-risk";
import type { RuntimeExecutionResult, RuntimeStageStatus } from "@repo-ai-governor/core-runtime";
import { RuntimeExecutionStatus } from "@repo-ai-governor/core-runtime";
import {
  EXECUTION_PROGRESS_STATUS_LABELS,
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
} from "@repo-ai-governor/shared";
import { CLI_DIAGNOSTIC_ROOT_CAUSE } from "../../constants/cli-governance-runtime.constant.js";
import type {
  CliCommandExperiencePayload,
  CliInteractionPrompt,
  CliLayeredLogs,
  CliRoleStageProgress,
} from "../../types/index.js";
import type { CliReplayExplainResolution } from "./replay-explain-builder.js";

/**
 * Owns CLI-local experience shaping so progress rows, prompts, and root-cause narration stay outside the facade.
 */
export class CliCommandExperienceBuilder {
  /**
   * Builds one human-friendly experience payload from progress/log/prompt primitives.
   * @param options Experience payload source blocks.
   * @returns Stable command experience object.
   */
  public buildExperiencePayload(options: {
    roleProgress: CliRoleStageProgress[];
    layeredLogs: CliLayeredLogs;
    interactionPrompts?: CliInteractionPrompt[];
  }): CliCommandExperiencePayload {
    return {
      statusDictionary: { ...EXECUTION_PROGRESS_STATUS_LABELS },
      roleProgress: options.roleProgress,
      layeredLogs: options.layeredLogs,
      interactionPrompts: options.interactionPrompts ?? [],
    };
  }

  /**
   * Resolves diagnostics root-cause for run-command execution outputs.
   * @param options Run-command result status context.
   * @returns Root-cause category.
   */
  public resolveRunDiagnosticRootCause(options: {
    policyOutcome: ChangeRiskRequiredAction;
    runtimeStatus: RuntimeExecutionStatus;
  }): string {
    if (options.policyOutcome === "block") {
      return CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_BLOCKED;
    }

    if (options.policyOutcome === "confirm" || options.policyOutcome === "escalate") {
      return CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_HITL_REQUIRED;
    }

    if (options.runtimeStatus !== RuntimeExecutionStatus.SUCCEEDED) {
      return CLI_DIAGNOSTIC_ROOT_CAUSE.RUNTIME_FAILURE;
    }

    return CLI_DIAGNOSTIC_ROOT_CAUSE.NONE;
  }

  /**
   * Resolves operator-facing next actions by diagnostics root-cause category.
   * @param options Root-cause and execution-state context.
   * @returns Ordered next-action list.
   */
  public resolveDiagnosticNextActions(options: {
    rootCause: string;
    policyOutcome: ChangeRiskRequiredAction | null;
    runtimeStatus: RuntimeExecutionStatus | null;
  }): string[] {
    if (options.rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_BLOCKED) {
      return [
        "Inspect matched policy rules and reduce high-risk changes before retrying run.",
        "Re-run with --trace and review diagnostics trace for blocked rule evidence.",
      ];
    }

    if (options.rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_HITL_REQUIRED) {
      return [
        "Trigger review/review-verify flow and complete required human confirmation.",
        "Use diagnostics trace to explain why policy outcome is not allow.",
      ];
    }

    if (options.rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.RUNTIME_FAILURE) {
      return [
        "Inspect stage-level errorContext in diagnostics trace and fix runtime stage failures.",
        "Replay diagnostics with --replay <report-or-replay-path> after fixes.",
      ];
    }

    if (options.rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.ENVIRONMENT_PRECONDITION) {
      return [
        "Run doctor/check to verify local prerequisites before rerunning the command.",
        "Compare workspace mode and memory provider diagnostics across environments.",
      ];
    }

    if (options.rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.PERMISSION_CONFIRMATION) {
      return [
        "Complete the required permission/approval workflow before continuing execution.",
        "Record confirmation evidence in review and ledger-backfill artifacts.",
      ];
    }

    const summary = [
      "Persist replay diagnostics for reproducibility and share with follow-up tasks.",
      "Keep using --trace in local debugging to preserve stage/policy attribution.",
    ];
    if (options.policyOutcome && options.runtimeStatus) {
      summary.push(
        `Current state: policy_outcome=${options.policyOutcome}, runtime_status=${options.runtimeStatus}.`,
      );
    }
    return summary;
  }

  /**
   * Builds run-command human-friendly experience payload from runtime/policy/report facts.
   * @param options Run command result context.
   * @returns Command experience payload.
   */
  public createRunCommandExperience(options: {
    executionId: string;
    runtimeResult: RuntimeExecutionResult;
    policyResult: {
      policyOutcome: ChangeRiskRequiredAction;
      matchedRuleIds: string[];
    };
    reportPath: string;
    replayPath: string;
    diagnosticsTracePath: string | null;
  }): CliCommandExperiencePayload {
    const rootCause = this.resolveRunDiagnosticRootCause({
      policyOutcome: options.policyResult.policyOutcome,
      runtimeStatus: options.runtimeResult.status,
    });
    const interactionCategory = this.resolveInteractionCategoryFromRootCause(rootCause);
    const roleProgress: CliRoleStageProgress[] = [
      {
        roleId: "compiler",
        stage: ExecutionProgressStage.RUN_COMPILE,
        status: ExecutionProgressStatus.COMPLETED,
        category: ExecutionInteractionCategory.NONE,
        summary: "Process IR compile completed.",
        detail: `execution_id=${options.executionId}`,
        backlink: {
          executionId: options.executionId,
          stageId: ExecutionProgressStage.RUN_COMPILE,
        },
      },
      ...options.runtimeResult.stageResults.map((stageResult) => ({
        roleId: stageResult.stageId,
        stage: ExecutionProgressStage.RUN_RUNTIME,
        status: this.resolveRuntimeStageProgressStatus(stageResult.status),
        category:
          this.resolveRuntimeStageProgressStatus(stageResult.status) ===
          ExecutionProgressStatus.FAILED
            ? ExecutionInteractionCategory.RUNTIME_FAILURE
            : ExecutionInteractionCategory.NONE,
        summary: `Stage ${stageResult.stageId} finished with ${stageResult.status}.`,
        detail: `duration_ms=${stageResult.durationMs}`,
        backlink: {
          executionId: options.executionId,
          stageId: stageResult.stageId,
        },
      })),
      {
        roleId: "policy-gate",
        stage: ExecutionProgressStage.POLICY_WAITING,
        status: this.resolvePolicyProgressStatus(options.policyResult.policyOutcome),
        category: interactionCategory,
        summary: `Policy outcome resolved as ${options.policyResult.policyOutcome}.`,
        detail: `matched_rules=${options.policyResult.matchedRuleIds.join("|") || "none"}`,
        backlink: {
          executionId: options.executionId,
          stageId: "stage-policy-gate",
          reportPath: options.reportPath,
          replayPath: options.replayPath,
        },
      },
      {
        roleId: "reporting",
        stage: ExecutionProgressStage.REPORT,
        status: ExecutionProgressStatus.COMPLETED,
        category: ExecutionInteractionCategory.NONE,
        summary: "Execution report artifact persisted.",
        detail: options.reportPath,
        backlink: {
          executionId: options.executionId,
          stageId: ExecutionProgressStage.REPORT,
          reportPath: options.reportPath,
        },
      },
      {
        roleId: "replay",
        stage: ExecutionProgressStage.REPLAY,
        status: ExecutionProgressStatus.COMPLETED,
        category: ExecutionInteractionCategory.NONE,
        summary: "Replay explain artifact persisted.",
        detail: options.replayPath,
        backlink: {
          executionId: options.executionId,
          stageId: ExecutionProgressStage.REPLAY,
          replayPath: options.replayPath,
        },
      },
    ];

    if (
      options.policyResult.policyOutcome === "confirm" ||
      options.policyResult.policyOutcome === "escalate"
    ) {
      roleProgress.push({
        roleId: "human-reviewer",
        stage: ExecutionProgressStage.HUMAN_CONFIRMATION,
        status: ExecutionProgressStatus.WAITING,
        category: ExecutionInteractionCategory.HUMAN_CONFIRMATION,
        summary: "Awaiting human confirmation before unattended chain can continue.",
        detail: "Run review/review-verify and provide explicit confirmation decision.",
        backlink: {
          executionId: options.executionId,
          stageId: ExecutionProgressStage.HUMAN_CONFIRMATION,
          reportPath: options.reportPath,
          replayPath: options.replayPath,
        },
      });
    }

    const nextActions = this.resolveDiagnosticNextActions({
      rootCause,
      policyOutcome: options.policyResult.policyOutcome,
      runtimeStatus: options.runtimeResult.status,
    });
    const interactionPrompts: CliInteractionPrompt[] = nextActions.map((nextAction) => ({
      category: interactionCategory,
      stage:
        interactionCategory === ExecutionInteractionCategory.HUMAN_CONFIRMATION
          ? ExecutionProgressStage.HUMAN_CONFIRMATION
          : ExecutionProgressStage.POLICY_WAITING,
      title: "Next action",
      action: nextAction,
      blocking:
        interactionCategory === ExecutionInteractionCategory.POLICY_WAITING ||
        interactionCategory === ExecutionInteractionCategory.HUMAN_CONFIRMATION ||
        interactionCategory === ExecutionInteractionCategory.RUNTIME_FAILURE,
    }));

    return this.buildExperiencePayload({
      roleProgress,
      interactionPrompts,
      layeredLogs: {
        summary: [
          `runtime_status=${options.runtimeResult.status}`,
          `policy_outcome=${options.policyResult.policyOutcome}`,
          `root_cause=${rootCause}`,
        ],
        detailed: [
          `report_path=${options.reportPath}`,
          `replay_path=${options.replayPath}`,
          `diagnostics_trace_path=${options.diagnosticsTracePath ?? "none"}`,
        ],
      },
    });
  }

  /**
   * Builds replay-command experience payload from replay diagnostics facts.
   * @param options Replay command context.
   * @returns Command experience payload.
   */
  public createReplayCommandExperience(options: {
    replayPath: string;
    diagnosticsPath: string;
    replayResolution: CliReplayExplainResolution;
  }): CliCommandExperiencePayload {
    const nextActions = this.resolveDiagnosticNextActions({
      rootCause: CLI_DIAGNOSTIC_ROOT_CAUSE.NONE,
      policyOutcome: null,
      runtimeStatus: null,
    });
    return this.buildExperiencePayload({
      roleProgress: [
        {
          roleId: "replay",
          stage: ExecutionProgressStage.REPLAY,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: "Replay diagnostics resolved from source payload.",
          detail: `source_type=${options.replayResolution.sourceType}`,
          backlink: {
            executionId: options.replayResolution.executionId,
            stageId: ExecutionProgressStage.REPLAY,
            replayPath: options.replayPath,
            artifactPath: options.diagnosticsPath,
          },
        },
      ],
      interactionPrompts: nextActions.map((nextAction) => ({
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.REPLAY,
        title: "Next action",
        action: nextAction,
        blocking: false,
      })),
      layeredLogs: {
        summary: [
          `source_type=${options.replayResolution.sourceType}`,
          `matched_count=${options.replayResolution.explainResult.matchedCount}`,
        ],
        detailed: [
          `source_path=${options.replayPath}`,
          `diagnostics_path=${options.diagnosticsPath}`,
        ],
      },
    });
  }

  /**
   * Resolves runtime stage status into one progress status value.
   * @param status Runtime stage status.
   * @returns Normalized progress status.
   */
  private resolveRuntimeStageProgressStatus(status: RuntimeStageStatus): ExecutionProgressStatus {
    if (status === "succeeded") {
      return ExecutionProgressStatus.COMPLETED;
    }
    return ExecutionProgressStatus.FAILED;
  }

  /**
   * Resolves policy outcome into progress status for policy-waiting stage.
   * @param policyOutcome Policy gate outcome.
   * @returns Normalized progress status.
   */
  private resolvePolicyProgressStatus(
    policyOutcome: ChangeRiskRequiredAction,
  ): ExecutionProgressStatus {
    if (policyOutcome === "allow") {
      return ExecutionProgressStatus.COMPLETED;
    }
    if (policyOutcome === "block") {
      return ExecutionProgressStatus.FAILED;
    }
    return ExecutionProgressStatus.WAITING;
  }

  /**
   * Resolves interaction category from diagnostic root-cause.
   * @param rootCause Root-cause value.
   * @returns Normalized interaction category.
   */
  private resolveInteractionCategoryFromRootCause(rootCause: string): ExecutionInteractionCategory {
    if (rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_HITL_REQUIRED) {
      return ExecutionInteractionCategory.HUMAN_CONFIRMATION;
    }
    if (rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_BLOCKED) {
      return ExecutionInteractionCategory.POLICY_WAITING;
    }
    if (rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.ENVIRONMENT_PRECONDITION) {
      return ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION;
    }
    if (rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.PERMISSION_CONFIRMATION) {
      return ExecutionInteractionCategory.PERMISSION_CONFIRMATION;
    }
    if (rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.RUNTIME_FAILURE) {
      return ExecutionInteractionCategory.RUNTIME_FAILURE;
    }
    return ExecutionInteractionCategory.NONE;
  }
}
