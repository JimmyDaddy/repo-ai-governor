import type { ResolvedWorkspace } from "@repo-ai-governor/config";
import { ChangeRiskRequiredAction } from "@repo-ai-governor/core-change-risk";
import {
  CliDeliveryRehearsalAction,
  CliDeliveryRehearsalSkipReason,
  CliDeliveryRehearsalStatus,
} from "../constants/cli-task-driven-run.constant.js";
import type {
  CliArtifactWriter,
  CliNormalizedRuntimeDebugOptions,
} from "../types/interfaces/cli-governance-runtime.interface.js";

interface CliDeliveryRehearsalRuntimeOptions {
  workspace: Pick<ResolvedWorkspace, "workspaceId" | "workspaceRoot" | "mode">;
  artifactWriter: CliArtifactWriter & {
    writeDeliveryRehearsalArtifact(options: {
      executionId: string;
      rehearsalAction: CliDeliveryRehearsalAction;
      payload: Record<string, unknown>;
    }): Promise<string>;
  };
  toRfc3339SecondsTimestamp: (value: Date) => string;
}

/**
 * Owns controlled delivery rehearsal execution so commit/PR-draft planning stays auditable
 * without introducing real repository side effects into the unattended runtime path.
 */
export class CliDeliveryRehearsalRuntime {
  public constructor(private readonly options: CliDeliveryRehearsalRuntimeOptions) {}

  /**
   * Executes one controlled delivery rehearsal stage and persists the rehearsal artifact when allowed.
   * @param options Delivery rehearsal execution context.
   * @returns Stage output consumed by audit/report/presentation layers.
   */
  public async executeDeliveryRehearsal(options: {
    executionId: string;
    stageId: string;
    taskId: string | null;
    taskTitle: string | null;
    rehearsalAction: CliDeliveryRehearsalAction;
    runtimeDebugOptions: Pick<CliNormalizedRuntimeDebugOptions, "dryRun">;
    policyOutcome: ChangeRiskRequiredAction;
    riskLevel: string | null;
    projectId?: string;
    sprintId?: string;
  }): Promise<Record<string, unknown>> {
    if (options.runtimeDebugOptions.dryRun) {
      return {
        handledBy: "delivery-rehearsal-runtime",
        stageId: options.stageId,
        taskId: options.taskId,
        artifactId: "delivery_rehearsal",
        deliveryRehearsalAction: options.rehearsalAction,
        deliveryRehearsalStatus: CliDeliveryRehearsalStatus.DRY_RUN,
        deliveryRehearsalSkipReason: CliDeliveryRehearsalSkipReason.DRY_RUN,
        deliveryRehearsalNextAction: this.resolveNextAction(options.rehearsalAction),
        manualHandoffRequired: true,
      };
    }

    if (options.policyOutcome !== ChangeRiskRequiredAction.ALLOW) {
      return {
        handledBy: "delivery-rehearsal-runtime",
        stageId: options.stageId,
        taskId: options.taskId,
        artifactId: "delivery_rehearsal",
        deliveryRehearsalAction: options.rehearsalAction,
        deliveryRehearsalStatus: CliDeliveryRehearsalStatus.DEFERRED,
        deliveryRehearsalSkipReason: this.resolveSkipReason(options.policyOutcome),
        deliveryRehearsalNextAction: this.resolveNextAction(options.rehearsalAction),
        manualHandoffRequired: true,
      };
    }

    const generatedAt = this.options.toRfc3339SecondsTimestamp(new Date());
    const deliveryRehearsalId = `delivery-rehearsal-${options.executionId}`;
    const deliveryRehearsalSummary =
      options.rehearsalAction === CliDeliveryRehearsalAction.PR_DRAFT
        ? "Prepared one guarded PR draft rehearsal payload without opening a real PR."
        : "Prepared one guarded commit rehearsal payload without creating a real git commit.";
    const rehearsalPath = await this.options.artifactWriter.writeDeliveryRehearsalArtifact({
      executionId: options.executionId,
      rehearsalAction: options.rehearsalAction,
      payload: {
        deliveryRehearsalId,
        executionId: options.executionId,
        generatedAt,
        taskId: options.taskId,
        taskTitle: options.taskTitle,
        stageId: options.stageId,
        rehearsalAction: options.rehearsalAction,
        status: "rehearsed",
        mode: "rehearsal_only",
        policyOutcome: options.policyOutcome,
        riskLevel: options.riskLevel,
        workspace: {
          workspaceId: this.options.workspace.workspaceId,
          workspaceRoot: this.options.workspace.workspaceRoot,
          workspaceMode: this.options.workspace.mode,
        },
        ...(options.projectId ? { projectId: options.projectId } : {}),
        ...(options.sprintId ? { sprintId: options.sprintId } : {}),
        summary: deliveryRehearsalSummary,
        nextAction: this.resolveNextAction(options.rehearsalAction),
        manualHandoffRequired: true,
        auditReplay: {
          artifactId: "delivery_rehearsal",
          executionId: options.executionId,
          stageId: options.stageId,
        },
      },
    });

    return {
      handledBy: "delivery-rehearsal-runtime",
      stageId: options.stageId,
      taskId: options.taskId,
      artifactId: "delivery_rehearsal",
      deliveryRehearsalAction: options.rehearsalAction,
      deliveryRehearsalStatus: CliDeliveryRehearsalStatus.APPLIED,
      deliveryRehearsalPath: rehearsalPath,
      deliveryRehearsalNextAction: this.resolveNextAction(options.rehearsalAction),
      manualHandoffRequired: true,
    };
  }

  /**
   * Maps policy outcomes to stable delivery rehearsal skip reasons.
   * @param policyOutcome Effective policy outcome for current run.
   * @returns Stable skip reason enum.
   */
  private resolveSkipReason(
    policyOutcome: ChangeRiskRequiredAction,
  ): CliDeliveryRehearsalSkipReason {
    if (policyOutcome === ChangeRiskRequiredAction.BLOCK) {
      return CliDeliveryRehearsalSkipReason.POLICY_BLOCK;
    }
    if (policyOutcome === ChangeRiskRequiredAction.ESCALATE) {
      return CliDeliveryRehearsalSkipReason.POLICY_ESCALATE;
    }
    return CliDeliveryRehearsalSkipReason.POLICY_CONFIRM;
  }

  /**
   * Resolves the operator-facing next action for one rehearsal mode.
   * @param rehearsalAction Controlled rehearsal action.
   * @returns Human-readable next action summary.
   */
  private resolveNextAction(rehearsalAction: CliDeliveryRehearsalAction): string {
    return rehearsalAction === CliDeliveryRehearsalAction.PR_DRAFT
      ? "Review the rehearsal artifact, then open a guarded PR draft manually after approval."
      : "Review the rehearsal artifact, then create a guarded git commit manually after approval.";
  }
}
