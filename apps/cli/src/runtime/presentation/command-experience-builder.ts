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
import {
  CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS,
  CliDeliveryRehearsalSkipReason,
  CliDeliveryRehearsalStatus,
  CliInlineReviewChainSkipReason,
  CliInlineReviewChainStatus,
} from "../../constants/cli-task-driven-run.constant.js";
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
    reviewChain: {
      enabled: boolean;
      status: CliInlineReviewChainStatus;
      skipReason: CliInlineReviewChainSkipReason | null;
      reviewRequestPath: string | null;
      reviewVerifyPath: string | null;
      ledgerBackfillPath: string | null;
      reviewStageStatus: RuntimeStageStatus | null;
      reviewVerifyStageStatus: RuntimeStageStatus | null;
    };
    deliveryRehearsal: {
      enabled: boolean;
      status: CliDeliveryRehearsalStatus;
      skipReason: CliDeliveryRehearsalSkipReason | null;
      rehearsalAction: string | null;
      rehearsalPath: string | null;
      stageStatus: RuntimeStageStatus | null;
    };
    memoryPromotion?: {
      outcome: string;
      plannedMergeCount: number;
      mergedCount: number;
      sessionSummaryProjectionKey: string | null;
    } | null;
    memoryPolicy?: {
      overallAction: string;
      warningRecordCount: number;
      redactedRecordCount: number;
      blockedRecordCount: number;
    } | null;
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
      ...options.runtimeResult.stageResults.flatMap((stageResult) => {
        const progressStatus = this.resolveRuntimeStageProgressStatus(stageResult.status);
        const reviewRequestPath = this.readStageOutputString(
          stageResult.output,
          "reviewRequestPath",
        );
        const reviewVerifyPath = this.readStageOutputString(stageResult.output, "reviewVerifyPath");
        const ledgerBackfillPath = this.readStageOutputString(
          stageResult.output,
          "ledgerBackfillPath",
        );
        const reviewChainStatus = this.readStageOutputString(
          stageResult.output,
          "reviewChainStatus",
        );
        const reviewChainSkipReason = this.readStageOutputString(
          stageResult.output,
          "reviewChainSkipReason",
        );

        if (stageResult.stageId === CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REVIEW.stageId) {
          const reviewProgressStatus = this.resolveInlineReviewProgressStatus(
            reviewChainStatus,
            progressStatus,
          );
          const reviewCategory = this.resolveInlineReviewInteractionCategory(reviewChainSkipReason);
          return [
            {
              roleId: "reviewer",
              stage: ExecutionProgressStage.REVIEW,
              status: reviewProgressStatus,
              category:
                reviewProgressStatus === ExecutionProgressStatus.FAILED
                  ? ExecutionInteractionCategory.RUNTIME_FAILURE
                  : reviewCategory,
              summary:
                reviewChainStatus === CliInlineReviewChainStatus.DEFERRED
                  ? "Inline review request deferred until policy outcome becomes allow."
                  : reviewChainStatus === CliInlineReviewChainStatus.DRY_RUN
                    ? "Inline review request skipped in dry-run mode."
                    : reviewProgressStatus === ExecutionProgressStatus.COMPLETED
                      ? "Inline review request persisted."
                      : "Inline review request failed.",
              detail:
                reviewRequestPath ??
                reviewChainSkipReason ??
                `duration_ms=${stageResult.durationMs}`,
              backlink: {
                executionId: options.executionId,
                stageId: stageResult.stageId,
                artifactPath: reviewRequestPath ?? undefined,
              },
            },
          ];
        }

        if (stageResult.stageId === CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REVIEW_VERIFY.stageId) {
          const verifyProgressStatus = this.resolveInlineReviewProgressStatus(
            reviewChainStatus,
            progressStatus,
          );
          const verifyCategory = this.resolveInlineReviewInteractionCategory(reviewChainSkipReason);
          const roleProgress: CliRoleStageProgress[] = [
            {
              roleId: "verifier",
              stage: ExecutionProgressStage.REVIEW_VERIFY,
              status: verifyProgressStatus,
              category:
                verifyProgressStatus === ExecutionProgressStatus.FAILED
                  ? ExecutionInteractionCategory.RUNTIME_FAILURE
                  : verifyCategory,
              summary:
                reviewChainStatus === CliInlineReviewChainStatus.DEFERRED
                  ? "Inline review verification deferred until policy approval."
                  : reviewChainStatus === CliInlineReviewChainStatus.DRY_RUN
                    ? "Inline review verification skipped in dry-run mode."
                    : verifyProgressStatus === ExecutionProgressStatus.COMPLETED
                      ? "Inline review verification persisted."
                      : "Inline review verification failed.",
              detail:
                reviewVerifyPath ??
                reviewChainSkipReason ??
                `duration_ms=${stageResult.durationMs}`,
              backlink: {
                executionId: options.executionId,
                stageId: stageResult.stageId,
                artifactPath: reviewVerifyPath ?? undefined,
              },
            },
          ];

          if (ledgerBackfillPath || reviewChainStatus === CliInlineReviewChainStatus.DRY_RUN) {
            roleProgress.push({
              roleId: "ledger-backfill",
              stage: ExecutionProgressStage.LEDGER_BACKFILL,
              status:
                reviewChainStatus === CliInlineReviewChainStatus.DRY_RUN
                  ? ExecutionProgressStatus.WARNING
                  : verifyProgressStatus,
              category:
                verifyProgressStatus === ExecutionProgressStatus.FAILED
                  ? ExecutionInteractionCategory.RUNTIME_FAILURE
                  : verifyCategory,
              summary:
                reviewChainStatus === CliInlineReviewChainStatus.DRY_RUN
                  ? "Managed ledger backfill skipped in dry-run mode."
                  : verifyProgressStatus === ExecutionProgressStatus.COMPLETED
                    ? "Managed ledger backfill applied."
                    : "Managed ledger backfill failed.",
              detail: ledgerBackfillPath ?? reviewChainSkipReason ?? "dry_run",
              backlink: {
                executionId: options.executionId,
                stageId: ExecutionProgressStage.LEDGER_BACKFILL,
                artifactPath: ledgerBackfillPath ?? undefined,
              },
            });
          }

          return roleProgress;
        }

        if (
          stageResult.stageId === CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.DELIVERY_REHEARSAL.stageId
        ) {
          const deliveryRehearsalStatus = this.readStageOutputString(
            stageResult.output,
            "deliveryRehearsalStatus",
          );
          const deliveryRehearsalPath = this.readStageOutputString(
            stageResult.output,
            "deliveryRehearsalPath",
          );
          const deliveryRehearsalAction = this.readStageOutputString(
            stageResult.output,
            "deliveryRehearsalAction",
          );
          const deliveryRehearsalSkipReason = this.readStageOutputString(
            stageResult.output,
            "deliveryRehearsalSkipReason",
          );

          return [
            {
              roleId: "delivery-ops",
              stage: ExecutionProgressStage.DELIVERY_REHEARSAL,
              status: this.resolveDeliveryRehearsalProgressStatus(
                deliveryRehearsalStatus,
                progressStatus,
              ),
              category: this.resolveDeliveryRehearsalInteractionCategory(
                deliveryRehearsalSkipReason,
              ),
              summary:
                deliveryRehearsalStatus === CliDeliveryRehearsalStatus.DEFERRED
                  ? "Controlled delivery rehearsal deferred until policy outcome becomes allow."
                  : deliveryRehearsalStatus === CliDeliveryRehearsalStatus.DRY_RUN
                    ? "Controlled delivery rehearsal skipped in dry-run mode."
                    : progressStatus === ExecutionProgressStatus.COMPLETED
                      ? "Controlled delivery rehearsal artifact persisted."
                      : "Controlled delivery rehearsal failed.",
              detail:
                deliveryRehearsalPath ??
                deliveryRehearsalSkipReason ??
                deliveryRehearsalAction ??
                `duration_ms=${stageResult.durationMs}`,
              backlink: {
                executionId: options.executionId,
                stageId: stageResult.stageId,
                artifactPath: deliveryRehearsalPath ?? undefined,
              },
            },
          ];
        }

        return [
          {
            roleId: stageResult.stageId,
            stage: ExecutionProgressStage.RUN_RUNTIME,
            status: progressStatus,
            category:
              progressStatus === ExecutionProgressStatus.FAILED
                ? ExecutionInteractionCategory.RUNTIME_FAILURE
                : ExecutionInteractionCategory.NONE,
            summary: `Stage ${stageResult.stageId} finished with ${stageResult.status}.`,
            detail: `duration_ms=${stageResult.durationMs}`,
            backlink: {
              executionId: options.executionId,
              stageId: stageResult.stageId,
            },
          },
        ];
      }),
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
          `inline_review_chain=${options.reviewChain.status}`,
          `inline_review_skip_reason=${options.reviewChain.skipReason ?? "none"}`,
          `delivery_rehearsal=${options.deliveryRehearsal.status}`,
          `delivery_rehearsal_action=${options.deliveryRehearsal.rehearsalAction ?? "none"}`,
          ...(options.memoryPolicy
            ? [
                `memory_policy_action=${options.memoryPolicy.overallAction}`,
                `memory_policy_warn_count=${options.memoryPolicy.warningRecordCount}`,
                `memory_policy_redact_count=${options.memoryPolicy.redactedRecordCount}`,
                `memory_policy_block_count=${options.memoryPolicy.blockedRecordCount}`,
              ]
            : []),
          ...(options.memoryPromotion
            ? [
                `memory_promotion_outcome=${options.memoryPromotion.outcome}`,
                `memory_promotion_planned_merge_count=${options.memoryPromotion.plannedMergeCount}`,
                `memory_promotion_merged_count=${options.memoryPromotion.mergedCount}`,
              ]
            : []),
        ],
        detailed: [
          `report_path=${options.reportPath}`,
          `replay_path=${options.replayPath}`,
          `diagnostics_trace_path=${options.diagnosticsTracePath ?? "none"}`,
          `inline_review_request_path=${options.reviewChain.reviewRequestPath ?? "none"}`,
          `inline_review_verify_path=${options.reviewChain.reviewVerifyPath ?? "none"}`,
          `inline_review_ledger_backfill_path=${options.reviewChain.ledgerBackfillPath ?? "none"}`,
          `delivery_rehearsal_path=${options.deliveryRehearsal.rehearsalPath ?? "none"}`,
          ...(options.memoryPromotion
            ? [
                `memory_session_projection_key=${options.memoryPromotion.sessionSummaryProjectionKey ?? "none"}`,
              ]
            : []),
        ],
      },
    });
  }

  /**
   * Reads one string field from runtime stage output payload.
   * @param output Raw stage output.
   * @param fieldName Expected field name.
   * @returns Trimmed string or null.
   */
  private readStageOutputString(output: unknown, fieldName: string): string | null {
    return output &&
      typeof output === "object" &&
      typeof (output as Record<string, unknown>)[fieldName] === "string" &&
      ((output as Record<string, unknown>)[fieldName] as string).trim().length > 0
      ? ((output as Record<string, unknown>)[fieldName] as string).trim()
      : null;
  }

  /**
   * Resolves progress status for inline review-chain stages when execution is skipped or deferred.
   * @param reviewChainStatus Inline review-chain status emitted by runtime stage output.
   * @param fallbackStatus Runtime-derived fallback status.
   * @returns Progress status suitable for CLI experience rendering.
   */
  private resolveInlineReviewProgressStatus(
    reviewChainStatus: string | null,
    fallbackStatus: ExecutionProgressStatus,
  ): ExecutionProgressStatus {
    if (reviewChainStatus === CliInlineReviewChainStatus.DRY_RUN) {
      return ExecutionProgressStatus.WARNING;
    }
    if (reviewChainStatus === CliInlineReviewChainStatus.DEFERRED) {
      return ExecutionProgressStatus.WAITING;
    }
    return fallbackStatus;
  }

  /**
   * Resolves interaction category for inline review-chain skip reasons.
   * @param reviewChainSkipReason Stable skip reason emitted by runtime stage output.
   * @returns Interaction category for CLI prompts/progress.
   */
  private resolveInlineReviewInteractionCategory(
    reviewChainSkipReason: string | null,
  ): ExecutionInteractionCategory {
    if (
      reviewChainSkipReason === CliInlineReviewChainSkipReason.POLICY_CONFIRM ||
      reviewChainSkipReason === CliInlineReviewChainSkipReason.POLICY_ESCALATE
    ) {
      return ExecutionInteractionCategory.HUMAN_CONFIRMATION;
    }
    if (reviewChainSkipReason === CliInlineReviewChainSkipReason.POLICY_BLOCK) {
      return ExecutionInteractionCategory.POLICY_WAITING;
    }
    return ExecutionInteractionCategory.NONE;
  }

  /**
   * Resolves progress status for delivery rehearsal stages when execution is skipped or deferred.
   * @param deliveryRehearsalStatus Delivery rehearsal status emitted by runtime stage output.
   * @param fallbackStatus Runtime-derived fallback status.
   * @returns Progress status suitable for CLI experience rendering.
   */
  private resolveDeliveryRehearsalProgressStatus(
    deliveryRehearsalStatus: string | null,
    fallbackStatus: ExecutionProgressStatus,
  ): ExecutionProgressStatus {
    if (deliveryRehearsalStatus === CliDeliveryRehearsalStatus.DRY_RUN) {
      return ExecutionProgressStatus.WARNING;
    }
    if (deliveryRehearsalStatus === CliDeliveryRehearsalStatus.DEFERRED) {
      return ExecutionProgressStatus.WAITING;
    }
    return fallbackStatus;
  }

  /**
   * Resolves interaction category for delivery rehearsal skip reasons.
   * @param deliveryRehearsalSkipReason Stable skip reason emitted by runtime stage output.
   * @returns Interaction category for CLI prompts/progress.
   */
  private resolveDeliveryRehearsalInteractionCategory(
    deliveryRehearsalSkipReason: string | null,
  ): ExecutionInteractionCategory {
    if (
      deliveryRehearsalSkipReason === CliDeliveryRehearsalSkipReason.POLICY_CONFIRM ||
      deliveryRehearsalSkipReason === CliDeliveryRehearsalSkipReason.POLICY_ESCALATE
    ) {
      return ExecutionInteractionCategory.HUMAN_CONFIRMATION;
    }
    if (deliveryRehearsalSkipReason === CliDeliveryRehearsalSkipReason.POLICY_BLOCK) {
      return ExecutionInteractionCategory.POLICY_WAITING;
    }
    return ExecutionInteractionCategory.NONE;
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
          ...(options.replayResolution.memorySemantics
            ? [
                `memory_policy_action=${options.replayResolution.memorySemantics.policyOverallAction}`,
                `memory_policy_warn_count=${options.replayResolution.memorySemantics.warningRecordCount}`,
                `memory_policy_redact_count=${options.replayResolution.memorySemantics.redactedRecordCount}`,
                `memory_policy_block_count=${options.replayResolution.memorySemantics.blockedRecordCount}`,
                `memory_promotion_outcome=${options.replayResolution.memorySemantics.promotionOutcome ?? "none"}`,
                `memory_promotion_merged_count=${options.replayResolution.memorySemantics.mergedCount}`,
              ]
            : []),
        ],
        detailed: [
          `source_path=${options.replayPath}`,
          `diagnostics_path=${options.diagnosticsPath}`,
          ...(options.replayResolution.memorySemantics
            ? [
                `memory_session_projection_key=${options.replayResolution.memorySemantics.sessionSummaryProjectionKey ?? "none"}`,
              ]
            : []),
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
