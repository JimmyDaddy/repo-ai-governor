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
  type NotificationChannelAttempt,
  type NotificationDispatchResult,
  NotificationDispatchStatus,
  NotificationDispatcher,
  type NotificationMessage,
  type NotificationProvider,
  NotificationRiskLevel,
  type NotificationRiskLevelPolicyMatrix,
} from "@repo-ai-governor/notification-dispatcher";
import { GovernorErrorCode, standardizeError } from "@repo-ai-governor/shared";
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
  notificationProviders?: NotificationProvider[];
  notificationPolicyMatrix?: NotificationRiskLevelPolicyMatrix;
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
    const notificationProviders = this.resolveNotificationProviders();
    const notificationPolicyMatrix = this.resolveNotificationPolicyMatrix(notificationProviders);
    const notificationDispatcher = new NotificationDispatcher({
      providers: notificationProviders,
      ...(notificationPolicyMatrix
        ? {
            policyMatrix: notificationPolicyMatrix,
          }
        : {}),
    });
    const deadlineAt = this.resolveDeadlineAt(options.policyResult.policyOutcome);
    const notificationMessage = this.createNotificationMessage(options.policyResult);
    const notificationResult = await this.dispatchNotification({
      notificationDispatcher,
      policyResult: options.policyResult,
      deadlineAt,
      message: notificationMessage,
    });
    await this.writeNotificationArtifact({
      executionId: options.executionId,
      notificationArtifactPath,
      notificationResult,
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

  private resolveNotificationProviders(): NotificationProvider[] {
    if (this.options.notificationProviders && this.options.notificationProviders.length > 0) {
      return [...this.options.notificationProviders];
    }

    return [this.createArtifactNotificationProvider()];
  }

  private resolveNotificationPolicyMatrix(
    providers: NotificationProvider[],
  ): NotificationRiskLevelPolicyMatrix | undefined {
    if (this.options.notificationPolicyMatrix) {
      return this.options.notificationPolicyMatrix;
    }

    const availableChannels = Array.from(new Set(providers.map((provider) => provider.channel)));
    if (availableChannels.length === 0) {
      return undefined;
    }

    const primaryChannel = availableChannels[0];
    const fallbackChannels = availableChannels.filter((channel) => channel !== primaryChannel);
    const escalationChannel = fallbackChannels[0] ?? primaryChannel;

    return {
      [NotificationRiskLevel.LOW]: {
        primaryChannel,
        fallbackChannels,
        escalationChannel,
      },
      [NotificationRiskLevel.MEDIUM]: {
        primaryChannel,
        fallbackChannels,
        escalationChannel,
      },
      [NotificationRiskLevel.HIGH]: {
        primaryChannel,
        fallbackChannels,
        escalationChannel,
      },
      [NotificationRiskLevel.CRITICAL]: {
        primaryChannel,
        fallbackChannels,
        escalationChannel,
      },
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

  private createArtifactNotificationProvider(): NotificationProvider {
    return {
      providerId: "cli-artifact-webhook",
      channel: NotificationChannel.WEBHOOK,
      send: async (request) => ({
        delivered: true,
        providerMessageId: `artifact-${request.payload.executionId}`,
        metadata: {
          mode: "artifact_fallback",
          channel: request.channel,
        },
      }),
    };
  }

  private createNotificationMessage(policyResult: PolicyGateEvaluationResult): NotificationMessage {
    return {
      title: `HITL ${policyResult.policyOutcome} required`,
      body: policyResult.reason,
      metadata: {
        executionId: policyResult.auditRecord.executionId,
        matchedRuleIds: policyResult.matchedRuleIds,
      },
    };
  }

  private async dispatchNotification(options: {
    notificationDispatcher: NotificationDispatcher;
    policyResult: PolicyGateEvaluationResult;
    deadlineAt: string;
    message: NotificationMessage;
  }): Promise<NotificationDispatchResult> {
    try {
      return await options.notificationDispatcher.dispatch({
        policyEvaluation: options.policyResult,
        deadlineAt: options.deadlineAt,
        message: options.message,
      });
    } catch (error) {
      const standardizedError = standardizeError(error);
      if (standardizedError.code !== GovernorErrorCode.NOTIFICATION_DISPATCH_FAILED) {
        throw error;
      }

      return this.createFailedNotificationResult({
        policyResult: options.policyResult,
        deadlineAt: options.deadlineAt,
        message: options.message,
        attemptedChannels: this.readAttemptedChannels(standardizedError.details?.attemptedChannels),
      });
    }
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

  private createFailedNotificationResult(options: {
    policyResult: PolicyGateEvaluationResult;
    deadlineAt: string;
    message: NotificationMessage;
    attemptedChannels: NotificationChannelAttempt[];
  }): NotificationDispatchResult {
    const failedAt = this.options.toRfc3339SecondsTimestamp(new Date());
    return {
      shouldNotify: true,
      dispatchStatus: NotificationDispatchStatus.FAILED,
      attemptedChannels: options.attemptedChannels,
      selectedChannel: null,
      payload: this.createNotificationPayload(options.policyResult, options.deadlineAt),
      message: options.message,
      auditRecord: {
        notificationChannel: null,
        notificationStatus: NotificationDispatchStatus.FAILED,
        notifiedAtDisplay: this.options.toDisplayTimestamp(failedAt),
      },
    };
  }

  private readAttemptedChannels(value: unknown): NotificationChannelAttempt[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((attempt): attempt is NotificationChannelAttempt => {
      if (!attempt || typeof attempt !== "object") {
        return false;
      }

      const attemptRecord = attempt as Record<string, unknown>;
      return (
        typeof attemptRecord.channel === "string" &&
        Object.values(NotificationChannel).includes(attemptRecord.channel as NotificationChannel) &&
        typeof attemptRecord.attempt === "number" &&
        typeof attemptRecord.delivered === "boolean"
      );
    });
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

  private async writeNotificationArtifact(options: {
    executionId: string;
    notificationArtifactPath: string;
    notificationResult: NotificationDispatchResult;
  }): Promise<void> {
    await this.options.artifactWriter.writeJsonArtifact(options.notificationArtifactPath, {
      notificationId: `hitl-notification-${options.executionId}`,
      sentAt: this.options.toRfc3339SecondsTimestamp(new Date()),
      channel: options.notificationResult.selectedChannel,
      dispatchStatus: options.notificationResult.dispatchStatus,
      attemptedChannels: options.notificationResult.attemptedChannels,
      message: options.notificationResult.message,
      payload: options.notificationResult.payload,
      auditRecord: options.notificationResult.auditRecord,
    });
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
