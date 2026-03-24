import { resolve } from "node:path";

import type { ResolvedWorkspace } from "@repo-ai-governor/config";
import { ChangeRiskRequiredAction } from "@repo-ai-governor/core-change-risk";
import { MemoryScope } from "@repo-ai-governor/core-memory";
import {
  PolicyGateEngine,
  type PolicyGateEvaluationResult,
  type PolicyGateHitlResolutionResult,
  PolicyHitlDecision,
} from "@repo-ai-governor/core-policy";
import {
  type AuditOutputMode,
  AuditRecordStatus,
  type AuditRecorder,
} from "@repo-ai-governor/core-session";
import {
  NotificationChannel,
  type NotificationDispatchResult,
  NotificationDispatchStatus,
  NotificationDispatcher,
  type NotificationProvider,
} from "@repo-ai-governor/notification-dispatcher";
import { CliHitlResumeAction } from "../constants/cli-task-driven-run.constant.js";
import type {
  CliArtifactWriter,
  CliNormalizedRuntimeDebugOptions,
} from "../types/interfaces/cli-governance-runtime.interface.js";

interface CliHitlRuntimeOptions {
  workspace: Pick<ResolvedWorkspace, "workspaceId" | "workspaceRoot" | "mode">;
  artifactWriter: CliArtifactWriter;
  toRfc3339SecondsTimestamp: (value: Date) => string;
  toDisplayTimestamp: (value: string) => string;
}

interface CliRunHitlResolution {
  required: boolean;
  notificationArtifactPath: string | null;
  notificationResult: NotificationDispatchResult | null;
  decisionReceiptPath: string | null;
  decisionId: string | null;
  decision: PolicyHitlDecision | null;
  resumeAction: CliHitlResumeAction | null;
  effectivePolicyOutcome: ChangeRiskRequiredAction;
  finalResolution: PolicyGateHitlResolutionResult | null;
  awaitingDecision: boolean;
  terminalDecision: boolean;
}

interface CliRunHitlPreview {
  required: boolean;
  decision: PolicyHitlDecision | null;
  resumeAction: CliHitlResumeAction | null;
  effectivePolicyOutcome: ChangeRiskRequiredAction;
  finalResolution: PolicyGateHitlResolutionResult | null;
  awaitingDecision: boolean;
  terminalDecision: boolean;
}

/**
 * Owns HITL notification/receipt handling so CLI run semantics stay auditable without re-growing the facade.
 */
export class CliHitlRuntime {
  private readonly policyGateEngine = new PolicyGateEngine();

  public constructor(private readonly options: CliHitlRuntimeOptions) {}

  public previewRunHitl(options: {
    policyResult: PolicyGateEvaluationResult;
    runtimeDebugOptions: Pick<
      CliNormalizedRuntimeDebugOptions,
      | "hitlDecision"
      | "hitlDecisionReason"
      | "hitlResumeAction"
      | "hitlDecidedBy"
      | "hitlConstraints"
    >;
  }): CliRunHitlPreview {
    if (!options.policyResult.shouldTriggerHitl) {
      return {
        required: false,
        decision: null,
        resumeAction: null,
        effectivePolicyOutcome: options.policyResult.policyOutcome,
        finalResolution: null,
        awaitingDecision: false,
        terminalDecision: false,
      };
    }

    const decision = this.normalizeDecision(options.runtimeDebugOptions.hitlDecision);
    if (!decision) {
      return {
        required: true,
        decision: null,
        resumeAction: null,
        effectivePolicyOutcome: options.policyResult.policyOutcome,
        finalResolution: null,
        awaitingDecision: true,
        terminalDecision: false,
      };
    }

    const resumeAction =
      options.runtimeDebugOptions.hitlResumeAction ?? this.resolveDefaultResumeAction(decision);
    const decisionReason =
      options.runtimeDebugOptions.hitlDecisionReason ??
      `CLI supplied HITL decision "${decision}" for execution preview.`;
    const finalResolution = this.policyGateEngine.applyHitlFeedback(options.policyResult, {
      decision,
      reason: decisionReason,
      constraints: options.runtimeDebugOptions.hitlConstraints,
    });

    return {
      required: true,
      decision,
      resumeAction,
      effectivePolicyOutcome: finalResolution.finalOutcome,
      finalResolution,
      awaitingDecision:
        finalResolution.finalOutcome !== ChangeRiskRequiredAction.ALLOW &&
        resumeAction !== CliHitlResumeAction.TERMINATE,
      terminalDecision: resumeAction === CliHitlResumeAction.TERMINATE,
    };
  }

  public async processRunHitl(options: {
    executionId: string;
    executionSessionId: string;
    policyResult: PolicyGateEvaluationResult;
    runtimeDebugOptions: Pick<
      CliNormalizedRuntimeDebugOptions,
      | "dryRun"
      | "hitlDecision"
      | "hitlDecisionReason"
      | "hitlResumeAction"
      | "hitlDecidedBy"
      | "hitlConstraints"
    >;
    preview: CliRunHitlPreview;
    auditRecorder: AuditRecorder;
    outputMode: AuditOutputMode;
    outputLocale: string;
    isTty: boolean;
    consumerTaskId?: string;
    projectId?: string;
    sprintId?: string;
  }): Promise<CliRunHitlResolution> {
    if (!options.preview.required) {
      return {
        required: false,
        notificationArtifactPath: null,
        notificationResult: null,
        decisionReceiptPath: null,
        decisionId: null,
        decision: options.preview.decision,
        resumeAction: options.preview.resumeAction,
        effectivePolicyOutcome: options.preview.effectivePolicyOutcome,
        finalResolution: null,
        awaitingDecision: options.preview.awaitingDecision,
        terminalDecision: options.preview.terminalDecision,
      };
    }

    if (options.runtimeDebugOptions.dryRun) {
      return {
        required: true,
        notificationArtifactPath: null,
        notificationResult: this.createPredictedNotificationResult(options.policyResult),
        decisionReceiptPath: null,
        decisionId: null,
        decision: options.preview.decision,
        resumeAction: options.preview.resumeAction,
        effectivePolicyOutcome: options.preview.effectivePolicyOutcome,
        finalResolution: options.preview.finalResolution,
        awaitingDecision: options.preview.awaitingDecision,
        terminalDecision: options.preview.terminalDecision,
      };
    }

    const notificationArtifactPath = this.resolveNotificationArtifactPath(options.executionId);
    const notificationDispatcher = new NotificationDispatcher({
      providers: [this.createArtifactNotificationProvider(notificationArtifactPath)],
    });
    const notificationResult = await notificationDispatcher.dispatch({
      policyEvaluation: options.policyResult,
      deadlineAt: this.resolveDeadlineAt(options.policyResult.policyOutcome),
      message: {
        title: `HITL ${options.policyResult.policyOutcome} required`,
        body: options.policyResult.reason,
        metadata: {
          executionId: options.executionId,
          matchedRuleIds: options.policyResult.matchedRuleIds,
        },
      },
    });
    await this.recordNotificationAuditEvent({
      executionId: options.executionId,
      executionSessionId: options.executionSessionId,
      policyResult: options.policyResult,
      notificationResult,
      notificationArtifactPath,
      auditRecorder: options.auditRecorder,
      outputMode: options.outputMode,
      outputLocale: options.outputLocale,
      isTty: options.isTty,
      consumerTaskId: options.consumerTaskId,
      projectId: options.projectId,
      sprintId: options.sprintId,
    });

    const decision = options.preview.decision;
    if (!decision) {
      return {
        required: true,
        notificationArtifactPath,
        notificationResult,
        decisionReceiptPath: null,
        decisionId: null,
        decision: null,
        resumeAction: null,
        effectivePolicyOutcome: options.preview.effectivePolicyOutcome,
        finalResolution: null,
        awaitingDecision: options.preview.awaitingDecision,
        terminalDecision: options.preview.terminalDecision,
      };
    }

    const decisionReason =
      options.runtimeDebugOptions.hitlDecisionReason ??
      `CLI supplied HITL decision "${decision}" for execution ${options.executionId}.`;
    const decisionId = `hitl-decision-${options.executionId}`;
    const decidedAt = this.options.toRfc3339SecondsTimestamp(new Date());
    const resumeAction = options.preview.resumeAction ?? this.resolveDefaultResumeAction(decision);
    const finalResolution =
      options.preview.finalResolution ??
      this.policyGateEngine.applyHitlFeedback(options.policyResult, {
        decision,
        reason: decisionReason,
        constraints: options.runtimeDebugOptions.hitlConstraints,
      });
    const decisionReceiptPath = this.resolveDecisionReceiptPath(decisionId);
    await this.options.artifactWriter.writeJsonArtifact(decisionReceiptPath, {
      decisionId,
      executionId: options.executionId,
      policyOutcome: options.policyResult.policyOutcome,
      finalPolicyOutcome: finalResolution.finalOutcome,
      decision,
      reason: decisionReason,
      constraints: options.runtimeDebugOptions.hitlConstraints,
      resumeAction,
      decidedBy: options.runtimeDebugOptions.hitlDecidedBy ?? "cli-runtime",
      decidedAt,
      notificationArtifactPath,
      notificationStatus: notificationResult.dispatchStatus,
      selectedChannel: notificationResult.selectedChannel,
      auditRecord: finalResolution.auditRecord,
    });
    await this.recordDecisionAuditEvent({
      executionId: options.executionId,
      executionSessionId: options.executionSessionId,
      policyResult: options.policyResult,
      finalResolution,
      decisionId,
      decisionReceiptPath,
      resumeAction,
      decidedAt,
      decidedBy: options.runtimeDebugOptions.hitlDecidedBy ?? "cli-runtime",
      auditRecorder: options.auditRecorder,
      outputMode: options.outputMode,
      outputLocale: options.outputLocale,
      isTty: options.isTty,
      consumerTaskId: options.consumerTaskId,
      projectId: options.projectId,
      sprintId: options.sprintId,
    });

    return {
      required: true,
      notificationArtifactPath,
      notificationResult,
      decisionReceiptPath,
      decisionId,
      decision,
      resumeAction,
      effectivePolicyOutcome: finalResolution.finalOutcome,
      finalResolution,
      awaitingDecision: options.preview.awaitingDecision,
      terminalDecision: options.preview.terminalDecision,
    };
  }

  private createPredictedNotificationResult(
    policyResult: PolicyGateEvaluationResult,
  ): NotificationDispatchResult {
    const payload = this.createNotificationPayload(policyResult, undefined);
    const message = this.createNotificationMessage(policyResult);
    return {
      shouldNotify: true,
      dispatchStatus: NotificationDispatchStatus.SKIPPED,
      attemptedChannels: [],
      selectedChannel: null,
      payload,
      message,
      auditRecord: {
        notificationChannel: null,
        notificationStatus: NotificationDispatchStatus.SKIPPED,
        notifiedAtDisplay: null,
      },
    };
  }

  private createArtifactNotificationProvider(artifactPath: string): NotificationProvider {
    return {
      providerId: "cli-artifact-webhook",
      channel: NotificationChannel.WEBHOOK,
      send: async (request) => {
        const sentAt = this.options.toRfc3339SecondsTimestamp(new Date());
        await this.options.artifactWriter.writeJsonArtifact(artifactPath, {
          notificationId: `hitl-notification-${request.payload.executionId}`,
          sentAt,
          channel: request.channel,
          attempt: request.attempt,
          providerId: "cli-artifact-webhook",
          title: request.message.title,
          body: request.message.body,
          payload: request.payload,
        });
        return {
          delivered: true,
          providerMessageId: `artifact-${request.payload.executionId}`,
          metadata: {
            artifactPath,
          },
        };
      },
    };
  }

  private createNotificationMessage(policyResult: PolicyGateEvaluationResult): {
    title: string;
    body: string;
    metadata: Record<string, unknown>;
  } {
    return {
      title: `HITL ${policyResult.policyOutcome} required`,
      body: policyResult.reason,
      metadata: {
        executionId: policyResult.auditRecord.executionId,
        matchedRuleIds: policyResult.matchedRuleIds,
      },
    };
  }

  private createNotificationPayload(
    policyResult: PolicyGateEvaluationResult,
    deadlineAt: string | undefined,
  ) {
    return {
      executionId: policyResult.auditRecord.executionId,
      stageId: policyResult.auditRecord.stageId,
      routeKey: policyResult.auditRecord.routeKey,
      riskLevel: policyResult.auditRecord.riskLevel,
      requiredAction: policyResult.auditRecord.requiredAction,
      ...(deadlineAt ? { deadlineAt } : {}),
      policyOutcome: policyResult.policyOutcome,
      reason: policyResult.reason,
      matchedPolicies: policyResult.matchedPolicies,
      requiredReviewerRoles: policyResult.requiredReviewerRoles,
    };
  }

  private normalizeDecision(rawDecision: string | null): PolicyHitlDecision | null {
    if (rawDecision === PolicyHitlDecision.APPROVE) {
      return PolicyHitlDecision.APPROVE;
    }
    if (rawDecision === PolicyHitlDecision.REJECT) {
      return PolicyHitlDecision.REJECT;
    }
    if (rawDecision === PolicyHitlDecision.REVISE) {
      return PolicyHitlDecision.REVISE;
    }
    return null;
  }

  private resolveDefaultResumeAction(decision: PolicyHitlDecision): CliHitlResumeAction {
    if (decision === PolicyHitlDecision.APPROVE) {
      return CliHitlResumeAction.RESUME;
    }
    if (decision === PolicyHitlDecision.REJECT) {
      return CliHitlResumeAction.TERMINATE;
    }
    return CliHitlResumeAction.DEGRADE;
  }

  private resolveNotificationArtifactPath(executionId: string): string {
    return resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "hitl",
      "notifications",
      `${executionId}.notification.json`,
    );
  }

  private resolveDecisionReceiptPath(decisionId: string): string {
    return resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "hitl",
      "decisions",
      `${decisionId}.json`,
    );
  }

  private resolveDeadlineAt(policyOutcome: string): string {
    const deadline = new Date();
    const hourOffset = policyOutcome === ChangeRiskRequiredAction.ESCALATE ? 2 : 4;
    deadline.setHours(deadline.getHours() + hourOffset);
    return this.options.toRfc3339SecondsTimestamp(deadline);
  }

  private async recordNotificationAuditEvent(options: {
    executionId: string;
    executionSessionId: string;
    policyResult: PolicyGateEvaluationResult;
    notificationResult: NotificationDispatchResult;
    notificationArtifactPath: string;
    auditRecorder: AuditRecorder;
    outputMode: AuditOutputMode;
    outputLocale: string;
    isTty: boolean;
    consumerTaskId?: string;
    projectId?: string;
    sprintId?: string;
  }): Promise<void> {
    const recordedAt = this.options.toRfc3339SecondsTimestamp(new Date());
    await options.auditRecorder.recordEvent({
      recordId: `${options.executionId}-hitl-notification`,
      recordedAt,
      event: {
        executionId: options.executionId,
        stageId: "stage-hitl-notification",
        routeKey: "policy.gate.cli.run.notification",
        surface: "cli",
        agentRole: "governor_runtime",
        roleProfileId: "role.default.runtime",
        roleSource: "default",
        policyOutcome: options.policyResult.policyOutcome,
        riskLevel: options.policyResult.auditRecord.riskLevel,
        requiredAction: options.policyResult.auditRecord.requiredAction,
        matchedPolicies: options.policyResult.matchedPolicies,
        status: AuditRecordStatus.SUCCEEDED,
        startedAt: recordedAt,
        endedAt: recordedAt,
        startedAtDisplay: this.options.toDisplayTimestamp(recordedAt),
        endedAtDisplay: this.options.toDisplayTimestamp(recordedAt),
        executionSessionId: options.executionSessionId,
        memoryScope: MemoryScope.EXECUTION,
        memoryDelta: {
          dispatchStatus: options.notificationResult.dispatchStatus,
          attemptedChannels: options.notificationResult.attemptedChannels,
          notificationArtifactPath: options.notificationArtifactPath,
        },
        notificationChannel: options.notificationResult.selectedChannel ?? undefined,
        notificationStatus: options.notificationResult.dispatchStatus,
        notifiedAtDisplay:
          options.notificationResult.auditRecord.notifiedAtDisplay ??
          this.options.toDisplayTimestamp(recordedAt),
        workspaceId: this.options.workspace.workspaceId,
        workspaceMode: this.options.workspace.mode,
        workspaceRoot: this.options.workspace.workspaceRoot,
        ...(options.consumerTaskId ? { consumerTaskId: options.consumerTaskId } : {}),
        ...(options.projectId ? { projectId: options.projectId } : {}),
        ...(options.sprintId ? { sprintId: options.sprintId } : {}),
        outputMode: options.outputMode,
        isTty: options.isTty,
        outputLocale: options.outputLocale,
      },
    });
  }

  private async recordDecisionAuditEvent(options: {
    executionId: string;
    executionSessionId: string;
    policyResult: PolicyGateEvaluationResult;
    finalResolution: PolicyGateHitlResolutionResult;
    decisionId: string;
    decisionReceiptPath: string;
    resumeAction: CliHitlResumeAction;
    decidedAt: string;
    decidedBy: string;
    auditRecorder: AuditRecorder;
    outputMode: AuditOutputMode;
    outputLocale: string;
    isTty: boolean;
    consumerTaskId?: string;
    projectId?: string;
    sprintId?: string;
  }): Promise<void> {
    await options.auditRecorder.recordEvent({
      recordId: `${options.executionId}-hitl-decision`,
      recordedAt: options.decidedAt,
      event: {
        executionId: options.executionId,
        stageId: "stage-hitl-decision-receipt",
        routeKey: "policy.gate.cli.run.hitl-decision",
        surface: "cli",
        agentRole: "governor_runtime",
        roleProfileId: "role.default.runtime",
        roleSource: "default",
        policyOutcome: options.finalResolution.finalOutcome,
        riskLevel: options.policyResult.auditRecord.riskLevel,
        requiredAction: options.finalResolution.auditRecord.requiredAction,
        matchedPolicies: options.finalResolution.auditRecord.matchedPolicies,
        status:
          options.resumeAction === CliHitlResumeAction.RESUME
            ? AuditRecordStatus.SUCCEEDED
            : options.resumeAction === CliHitlResumeAction.TERMINATE
              ? AuditRecordStatus.CANCELLED
              : AuditRecordStatus.RUNNING,
        startedAt: options.decidedAt,
        endedAt: options.decidedAt,
        startedAtDisplay: this.options.toDisplayTimestamp(options.decidedAt),
        endedAtDisplay: this.options.toDisplayTimestamp(options.decidedAt),
        executionSessionId: options.executionSessionId,
        memoryScope: MemoryScope.EXECUTION,
        memoryDelta: {
          decisionId: options.decisionId,
          decision: options.finalResolution.feedback.decision,
          constraints: options.finalResolution.feedback.constraints ?? [],
          decidedBy: options.decidedBy,
          resumeAction: options.resumeAction,
          decisionReceiptPath: options.decisionReceiptPath,
        },
        workspaceId: this.options.workspace.workspaceId,
        workspaceMode: this.options.workspace.mode,
        workspaceRoot: this.options.workspace.workspaceRoot,
        ...(options.consumerTaskId ? { consumerTaskId: options.consumerTaskId } : {}),
        ...(options.projectId ? { projectId: options.projectId } : {}),
        ...(options.sprintId ? { sprintId: options.sprintId } : {}),
        outputMode: options.outputMode,
        isTty: options.isTty,
        outputLocale: options.outputLocale,
      },
    });
  }
}
