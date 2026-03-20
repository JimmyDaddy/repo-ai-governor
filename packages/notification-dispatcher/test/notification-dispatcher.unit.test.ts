import { ChangeRiskLevel, ChangeRiskRequiredAction } from "@repo-ai-governor/core-change-risk";
import { PolicyDecisionSource } from "@repo-ai-governor/core-policy";
import {
  NotificationChannel,
  NotificationDispatchStatus,
  NotificationDispatcher,
  type NotificationProvider,
} from "../src/index.js";

function createProvider(): NotificationProvider {
  return {
    providerId: "provider-webhook",
    channel: NotificationChannel.WEBHOOK,
    async send() {
      return {
        delivered: true,
      };
    },
  };
}

describe("notification-dispatcher unit", () => {
  it("dispatches through primary channel for confirm outcome", async () => {
    const dispatcher = new NotificationDispatcher({
      providers: [createProvider()],
    });
    const result = await dispatcher.dispatch({
      policyEvaluation: {
        policyOutcome: ChangeRiskRequiredAction.CONFIRM,
        decisionSource: PolicyDecisionSource.POLICY_RULE,
        reason: "manual confirmation required",
        matchedPolicies: ["policy.risk.action.confirm"],
        matchedRuleIds: ["policy.risk.action.confirm"],
        requiredReviewerRoles: ["Maintainer"],
        shouldTriggerHitl: true,
        hitlFeedbackSchema: {
          requiredFields: ["decision", "reason"],
          optionalFields: [],
        },
        auditRecord: {
          executionId: "exec-notify-unit-001",
          stageId: "stage-policy",
          routeKey: "policy",
          policyOutcome: ChangeRiskRequiredAction.CONFIRM,
          decisionSource: PolicyDecisionSource.POLICY_RULE,
          reason: "manual confirmation required",
          riskLevel: ChangeRiskLevel.LOW,
          requiredAction: ChangeRiskRequiredAction.CONFIRM,
          matchedPolicies: ["policy.risk.action.confirm"],
          matchedRuleIds: ["policy.risk.action.confirm"],
          requiredReviewerRoles: ["Maintainer"],
        },
      },
    });

    expect(result.dispatchStatus).toBe(NotificationDispatchStatus.DELIVERED_PRIMARY);
    expect(result.selectedChannel).toBe(NotificationChannel.WEBHOOK);
    expect(result.attemptedChannels).toHaveLength(1);
  });
});
