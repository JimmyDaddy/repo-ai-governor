import { existsSync } from 'node:fs';

import {
  OrchestrationExecutionStatus,
  type OrchestrationExecutionSummary,
  type OrchestrationGovernanceActionAffordance,
  OrchestrationGovernanceActionDisabledReason,
  OrchestrationGovernanceActionKind,
  type OrchestrationHandoffTarget,
  OrchestrationHandoffTargetKind,
  type OrchestrationHitlDecisionOption,
} from '@repo-ai-governor/orchestration-service-client';
import { LocalOrchestrationServiceHitlDecisionStateFactory } from './local-orchestration-service-hitl-decision-state-factory.js';
import { LocalOrchestrationServiceReviewRoutingRuntime } from './local-orchestration-service-review-routing-runtime.js';

interface LocalOrchestrationServiceGovernanceAffordanceBuilderDependencies {
  workspaceRoot: string;
}

interface LocalOrchestrationServiceGovernanceHandoffTargetOptions {
  reviewDocumentPath?: string;
}

/**
 * Builds shared governance action and handoff affordances for service-owned read models.
 *
 * Why this exists:
 * execution board, HITL inbox, and queue surfaces must reuse one orchestration-owned truth for
 * actions and handoff paths instead of drifting across multiple query runtimes.
 */
export class LocalOrchestrationServiceGovernanceAffordanceBuilder {
  private readonly reviewRoutingRuntime: LocalOrchestrationServiceReviewRoutingRuntime;
  private readonly hitlDecisionStateFactory: LocalOrchestrationServiceHitlDecisionStateFactory;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceGovernanceAffordanceBuilderDependencies,
  ) {
    this.reviewRoutingRuntime = new LocalOrchestrationServiceReviewRoutingRuntime({
      workspaceRoot: dependencies.workspaceRoot,
    });
    this.hitlDecisionStateFactory = new LocalOrchestrationServiceHitlDecisionStateFactory();
  }

  /**
   * Builds the service-owned handoff targets for one execution.
   * @param execution Execution summary that anchors path truth.
   * @returns Handoff targets for worktree, editor, terminal, and review document.
   */
  public async buildHandoffTargets(
    execution: OrchestrationExecutionSummary,
    options: LocalOrchestrationServiceGovernanceHandoffTargetOptions = {},
  ): Promise<OrchestrationHandoffTarget[]> {
    const reviewDocumentPath =
      'reviewDocumentPath' in options
        ? options.reviewDocumentPath
        : await this.reviewRoutingRuntime.resolveExecutionReviewDocumentPath(execution);
    const editorTargetPath = this.pickFirstExistingPath([
      execution.latestArtifactPath,
      reviewDocumentPath,
      execution.workspaceRoot,
    ]);

    return [
      {
        targetId: `${execution.executionId}:worktree`,
        executionId: execution.executionId,
        targetKind: OrchestrationHandoffTargetKind.WORKTREE,
        targetPath: execution.workspaceRoot,
        exists: existsSync(execution.workspaceRoot),
      },
      {
        targetId: `${execution.executionId}:editor`,
        executionId: execution.executionId,
        targetKind: OrchestrationHandoffTargetKind.EDITOR,
        ...(editorTargetPath
          ? {
              targetPath: editorTargetPath,
            }
          : {}),
        exists: editorTargetPath ? existsSync(editorTargetPath) : false,
      },
      {
        targetId: `${execution.executionId}:terminal`,
        executionId: execution.executionId,
        targetKind: OrchestrationHandoffTargetKind.TERMINAL,
        targetPath: execution.workspaceRoot,
        exists: existsSync(execution.workspaceRoot),
      },
      {
        targetId: `${execution.executionId}:review-document`,
        executionId: execution.executionId,
        targetKind: OrchestrationHandoffTargetKind.REVIEW_DOCUMENT,
        ...(reviewDocumentPath
          ? {
              targetPath: reviewDocumentPath,
            }
          : {}),
        exists: reviewDocumentPath ? existsSync(reviewDocumentPath) : false,
      },
    ];
  }

  /**
   * Builds service-owned governance actions for one execution.
   * @param execution Execution summary that owns execution-level action truth.
   * @param handoffTargets Handoff targets already resolved by the service.
   * @returns Governance action affordances that clients can render without guessing availability.
   */
  public buildActionAffordances(
    execution: OrchestrationExecutionSummary,
    handoffTargets: OrchestrationHandoffTarget[],
    hitlDecisionOptions?: readonly OrchestrationHitlDecisionOption[],
  ): OrchestrationGovernanceActionAffordance[] {
    const isTerminal = this.isTerminalExecutionStatus(execution.status);
    const resolvedHitlDecisionOptions =
      hitlDecisionOptions ??
      this.hitlDecisionStateFactory.buildAllowedDecisions(execution.executionId);
    const hasAvailableHitlDecisionOptions = resolvedHitlDecisionOptions.length > 0;

    return [
      {
        actionId: `${execution.executionId}:view`,
        actionKind: OrchestrationGovernanceActionKind.VIEW_EXECUTION,
        executionId: execution.executionId,
        enabled: true,
        requiresConfirmation: false,
      },
      {
        actionId: `${execution.executionId}:submit-hitl`,
        actionKind: OrchestrationGovernanceActionKind.SUBMIT_HITL_DECISION,
        executionId: execution.executionId,
        enabled: execution.pendingHitl && hasAvailableHitlDecisionOptions,
        requiresConfirmation: true,
        ...(execution.pendingHitl && hasAvailableHitlDecisionOptions
          ? {
              hitlDecisionOptions: resolvedHitlDecisionOptions.map((decisionOption) => ({
                ...decisionOption,
              })),
            }
          : {
              disabledReason: execution.pendingHitl
                ? OrchestrationGovernanceActionDisabledReason.HITL_DECISION_UNAVAILABLE
                : OrchestrationGovernanceActionDisabledReason.HITL_NOT_PENDING,
            }),
      },
      {
        actionId: `${execution.executionId}:recover`,
        actionKind: OrchestrationGovernanceActionKind.RECOVER_EXECUTION,
        executionId: execution.executionId,
        enabled: execution.recoveryCapable && !isTerminal,
        requiresConfirmation: false,
        ...(execution.recoveryCapable && !isTerminal
          ? {}
          : {
              disabledReason: isTerminal
                ? OrchestrationGovernanceActionDisabledReason.EXECUTION_TERMINAL
                : OrchestrationGovernanceActionDisabledReason.RECOVERY_NOT_AVAILABLE,
            }),
      },
      {
        actionId: `${execution.executionId}:terminate`,
        actionKind: OrchestrationGovernanceActionKind.TERMINATE_EXECUTION,
        executionId: execution.executionId,
        enabled: !isTerminal,
        requiresConfirmation: true,
        ...(!isTerminal
          ? {}
          : {
              disabledReason: OrchestrationGovernanceActionDisabledReason.EXECUTION_TERMINAL,
            }),
      },
      ...handoffTargets.map((target) => ({
        actionId: `${execution.executionId}:handoff:${target.targetKind}`,
        actionKind: OrchestrationGovernanceActionKind.OPEN_HANDOFF_TARGET,
        executionId: execution.executionId,
        enabled: target.exists && typeof target.targetPath === 'string',
        requiresConfirmation: false,
        targetId: target.targetId,
        ...(target.exists && typeof target.targetPath === 'string'
          ? {}
          : {
              disabledReason: OrchestrationGovernanceActionDisabledReason.TARGET_UNAVAILABLE,
            }),
      })),
    ];
  }

  private pickFirstExistingPath(candidates: Array<string | undefined>): string | undefined {
    return candidates.find((candidate) => typeof candidate === 'string' && existsSync(candidate));
  }

  private isTerminalExecutionStatus(status: OrchestrationExecutionStatus): boolean {
    return [
      OrchestrationExecutionStatus.COMPLETED,
      OrchestrationExecutionStatus.FAILED,
      OrchestrationExecutionStatus.CANCELLED,
    ].includes(status);
  }
}
