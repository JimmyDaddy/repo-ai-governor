import { ChangeRiskLevel, ChangeRiskRequiredAction } from "../../core-change-risk/src/index.js";
import {
  PolicyDecisionSource,
  type PolicyGateEvaluationResult,
} from "../../core-policy/src/index.js";
import { GovernorErrorCode, RuntimeError } from "../../shared/src/index.js";
import {
  NotificationChannel,
  NotificationDispatchStatus,
  NotificationDispatcher,
  type NotificationProvider,
  type NotificationProviderReceipt,
} from "../src/index.js";

interface ProviderOutcome {
  delivered?: boolean;
  errorMessage?: string;
  throwMessage?: string;
}

type PolicyEvaluationFixtureOverrides = Omit<Partial<PolicyGateEvaluationResult>, "auditRecord"> & {
  auditRecord?: Partial<PolicyGateEvaluationResult["auditRecord"]>;
};

/**
 * Creates one deterministic policy evaluation fixture for notification tests.
 * @param overrides Optional override fields.
 * @returns Policy evaluation payload.
 */
function createPolicyEvaluationFixture(
  overrides: PolicyEvaluationFixtureOverrides = {},
): PolicyGateEvaluationResult {
  const baseFixture: PolicyGateEvaluationResult = {
    policyOutcome: ChangeRiskRequiredAction.CONFIRM,
    decisionSource: PolicyDecisionSource.POLICY_RULE,
    reason: "manual confirmation required",
    matchedPolicies: ["policy.risk.action.confirm"],
    matchedRuleIds: ["policy.risk.action.confirm"],
    requiredReviewerRoles: ["Maintainer"],
    shouldTriggerHitl: true,
    hitlFeedbackSchema: {
      requiredFields: ["decision", "reason"],
      optionalFields: ["constraints"],
    },
    auditRecord: {
      executionId: "exec-notify-001",
      stageId: "stage-policy",
      routeKey: "policy.gate",
      policyOutcome: ChangeRiskRequiredAction.CONFIRM,
      decisionSource: PolicyDecisionSource.POLICY_RULE,
      reason: "manual confirmation required",
      riskLevel: ChangeRiskLevel.LOW,
      requiredAction: ChangeRiskRequiredAction.CONFIRM,
      matchedPolicies: ["policy.risk.action.confirm"],
      matchedRuleIds: ["policy.risk.action.confirm"],
      requiredReviewerRoles: ["Maintainer"],
    },
  };

  return {
    ...baseFixture,
    ...overrides,
    matchedPolicies: overrides.matchedPolicies ?? baseFixture.matchedPolicies,
    matchedRuleIds: overrides.matchedRuleIds ?? baseFixture.matchedRuleIds,
    requiredReviewerRoles: overrides.requiredReviewerRoles ?? baseFixture.requiredReviewerRoles,
    hitlFeedbackSchema: overrides.hitlFeedbackSchema ?? baseFixture.hitlFeedbackSchema,
    auditRecord: {
      ...baseFixture.auditRecord,
      ...(overrides.auditRecord ?? {}),
    },
  };
}

/**
 * Creates one provider double with deterministic delivery outcomes.
 * @param channel Provider channel.
 * @param providerId Provider identifier.
 * @param outcomes Sequence of outcomes returned by send attempts.
 * @returns Notification provider test double.
 */
function createProvider(
  channel: NotificationChannel,
  providerId: string,
  outcomes: ProviderOutcome[],
): NotificationProvider {
  let sendCount = 0;

  return {
    providerId,
    channel,
    async send(): Promise<NotificationProviderReceipt> {
      const resolvedOutcome = outcomes[sendCount] ?? outcomes[outcomes.length - 1] ?? {};
      sendCount += 1;

      if (resolvedOutcome.throwMessage) {
        throw { message: resolvedOutcome.throwMessage };
      }

      return {
        delivered: Boolean(resolvedOutcome.delivered),
        ...(resolvedOutcome.errorMessage ? { errorMessage: resolvedOutcome.errorMessage } : {}),
      };
    },
  };
}

describe("NotificationDispatcher smoke", () => {
  it("skips dispatch when policy outcome does not require HITL notification", async () => {
    const notificationDispatcher = new NotificationDispatcher();

    const result = await notificationDispatcher.dispatch({
      policyEvaluation: createPolicyEvaluationFixture({
        policyOutcome: ChangeRiskRequiredAction.ALLOW,
        shouldTriggerHitl: false,
        auditRecord: {
          policyOutcome: ChangeRiskRequiredAction.ALLOW,
          requiredAction: ChangeRiskRequiredAction.ALLOW,
        },
      }),
    });

    expect(result.shouldNotify).toBe(false);
    expect(result.dispatchStatus).toBe(NotificationDispatchStatus.SKIPPED);
    expect(result.selectedChannel).toBeNull();
  });

  it("delivers on primary channel when primary provider succeeds", async () => {
    const notificationDispatcher = new NotificationDispatcher({
      providers: [
        createProvider(NotificationChannel.WEBHOOK, "provider-webhook", [
          {
            delivered: true,
          },
        ]),
      ],
    });

    const result = await notificationDispatcher.dispatch({
      policyEvaluation: createPolicyEvaluationFixture(),
    });

    expect(result.shouldNotify).toBe(true);
    expect(result.dispatchStatus).toBe(NotificationDispatchStatus.DELIVERED_PRIMARY);
    expect(result.selectedChannel).toBe(NotificationChannel.WEBHOOK);
    expect(result.attemptedChannels).toHaveLength(1);
    expect(result.auditRecord.notificationStatus).toBe(
      NotificationDispatchStatus.DELIVERED_PRIMARY,
    );
  });

  it("records provider-not-found diagnostics and falls back to backup channel", async () => {
    const notificationDispatcher = new NotificationDispatcher({
      providers: [
        createProvider(NotificationChannel.CHAT_IM, "provider-chat", [
          {
            delivered: true,
          },
        ]),
      ],
    });

    const result = await notificationDispatcher.dispatch({
      policyEvaluation: createPolicyEvaluationFixture(),
    });

    expect(result.dispatchStatus).toBe(NotificationDispatchStatus.DELIVERED_FALLBACK);
    expect(result.selectedChannel).toBe(NotificationChannel.CHAT_IM);
    expect(result.attemptedChannels[0]?.errorMessage).toContain(
      GovernorErrorCode.NOTIFICATION_PROVIDER_NOT_FOUND,
    );
  });

  it("falls back to backup channel when primary channel keeps failing", async () => {
    const notificationDispatcher = new NotificationDispatcher({
      providers: [
        createProvider(NotificationChannel.WEBHOOK, "provider-webhook", [
          {
            delivered: false,
            errorMessage: "webhook timeout",
          },
          {
            delivered: false,
            errorMessage: "webhook timeout",
          },
        ]),
        createProvider(NotificationChannel.CHAT_IM, "provider-chat", [
          {
            delivered: true,
          },
        ]),
      ],
    });

    const result = await notificationDispatcher.dispatch({
      policyEvaluation: createPolicyEvaluationFixture(),
    });

    expect(result.dispatchStatus).toBe(NotificationDispatchStatus.DELIVERED_FALLBACK);
    expect(result.selectedChannel).toBe(NotificationChannel.CHAT_IM);
    expect(result.attemptedChannels.map((attempt) => attempt.channel)).toEqual([
      NotificationChannel.WEBHOOK,
      NotificationChannel.WEBHOOK,
      NotificationChannel.CHAT_IM,
    ]);
  });

  it("falls back to backup channel when primary provider throws exceptions", async () => {
    const notificationDispatcher = new NotificationDispatcher({
      providers: [
        createProvider(NotificationChannel.WEBHOOK, "provider-webhook", [
          {
            throwMessage: "webhook provider crashed",
          },
          {
            throwMessage: "webhook provider crashed",
          },
        ]),
        createProvider(NotificationChannel.CHAT_IM, "provider-chat", [
          {
            delivered: true,
          },
        ]),
      ],
    });

    const result = await notificationDispatcher.dispatch({
      policyEvaluation: createPolicyEvaluationFixture(),
    });

    expect(result.dispatchStatus).toBe(NotificationDispatchStatus.DELIVERED_FALLBACK);
    expect(result.selectedChannel).toBe(NotificationChannel.CHAT_IM);
    expect(result.attemptedChannels.slice(0, 2).map((attempt) => attempt.errorMessage)).toEqual([
      "webhook provider crashed",
      "webhook provider crashed",
    ]);
  });

  it("escalates to escalation channel when primary and fallback channels all fail", async () => {
    const notificationDispatcher = new NotificationDispatcher({
      providers: [
        createProvider(NotificationChannel.CHAT_IM, "provider-chat", [
          {
            delivered: false,
            errorMessage: "chat provider unavailable",
          },
          {
            delivered: false,
            errorMessage: "chat provider unavailable",
          },
        ]),
        createProvider(NotificationChannel.WEBHOOK, "provider-webhook", [
          {
            delivered: false,
            errorMessage: "webhook rejected payload",
          },
        ]),
        createProvider(NotificationChannel.EMAIL, "provider-email", [
          {
            delivered: false,
            errorMessage: "smtp unreachable",
          },
        ]),
        createProvider(NotificationChannel.ISSUE_SYSTEM, "provider-issue", [
          {
            delivered: true,
          },
        ]),
      ],
    });

    const result = await notificationDispatcher.dispatch({
      policyEvaluation: createPolicyEvaluationFixture({
        policyOutcome: ChangeRiskRequiredAction.ESCALATE,
        auditRecord: {
          policyOutcome: ChangeRiskRequiredAction.ESCALATE,
          requiredAction: ChangeRiskRequiredAction.ESCALATE,
          riskLevel: ChangeRiskLevel.MEDIUM,
        },
      }),
    });

    expect(result.dispatchStatus).toBe(NotificationDispatchStatus.ESCALATED);
    expect(result.selectedChannel).toBe(NotificationChannel.ISSUE_SYSTEM);
    expect(result.attemptedChannels.map((attempt) => attempt.channel)).toEqual([
      NotificationChannel.CHAT_IM,
      NotificationChannel.CHAT_IM,
      NotificationChannel.WEBHOOK,
      NotificationChannel.EMAIL,
      NotificationChannel.ISSUE_SYSTEM,
    ]);
  });

  it("throws standardized error when all channels are exhausted without delivery", async () => {
    const notificationDispatcher = new NotificationDispatcher({
      providers: [
        createProvider(NotificationChannel.WEBHOOK, "provider-webhook", [
          {
            delivered: false,
            errorMessage: "webhook failed",
          },
          {
            delivered: false,
            errorMessage: "webhook failed",
          },
        ]),
        createProvider(NotificationChannel.CHAT_IM, "provider-chat", [
          {
            delivered: false,
            errorMessage: "chat failed",
          },
        ]),
        createProvider(NotificationChannel.ISSUE_SYSTEM, "provider-issue", [
          {
            delivered: false,
            errorMessage: "issue system failed",
          },
        ]),
      ],
    });

    await expect(() =>
      notificationDispatcher.dispatch({
        policyEvaluation: createPolicyEvaluationFixture(),
      }),
    ).rejects.toThrowError(RuntimeError);

    try {
      await notificationDispatcher.dispatch({
        policyEvaluation: createPolicyEvaluationFixture(),
      });
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.NOTIFICATION_DISPATCH_FAILED);
    }
  });

  it("throws standardized error when riskLevel is unsupported", async () => {
    const notificationDispatcher = new NotificationDispatcher();

    await expect(() =>
      notificationDispatcher.dispatch({
        policyEvaluation: createPolicyEvaluationFixture({
          auditRecord: {
            riskLevel: "not-supported-risk-level" as ChangeRiskLevel,
          },
        }),
      }),
    ).rejects.toThrowError(RuntimeError);

    try {
      await notificationDispatcher.dispatch({
        policyEvaluation: createPolicyEvaluationFixture({
          auditRecord: {
            riskLevel: "not-supported-risk-level" as ChangeRiskLevel,
          },
        }),
      });
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID);
    }
  });
});
