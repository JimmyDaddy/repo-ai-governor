import { ChangeRiskLevel, ChangeRiskRequiredAction } from '@repo-ai-governor/core-change-risk';
import { GovernanceReviewerRole, GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  DEFAULT_REVIEW_VERIFY_FAILURE_ESCALATION_THRESHOLD,
  POLICY_GATE_OUTCOME_VALUES,
  POLICY_HITL_DECISION_VALUES,
  POLICY_OUTCOME_SEVERITY,
  PolicyDecisionSource,
  PolicyGateRuleId,
  PolicyHitlDecision,
} from './constants/index.js';
import type {
  PolicyGateEngineOptions,
  PolicyGateEvaluateInput,
  PolicyGateEvaluationResult,
  PolicyGateHitlResolutionResult,
  PolicyGateRule,
  PolicyHitlFeedback,
  PolicyReviewerRole,
} from './types/index.js';

interface ResolvedPolicyGateOptions {
  defaultRules: PolicyGateRule[];
}

interface NormalizedEvaluateInput {
  riskEvaluation: PolicyGateEvaluateInput['riskEvaluation'];
  context: PolicyGateEvaluateInput['context'];
  compiledRules: PolicyGateRule[];
}

const CHANGE_RISK_LEVEL_VALUES = new Set<string>(Object.values(ChangeRiskLevel));

/**
 * Evaluates structured risk signals against policy rules and emits gate decisions.
 *
 * Why this exists:
 * policy and HITL routing should be centralized so runtime/adapter layers avoid
 * duplicating gate logic with inconsistent escalation behavior.
 */
export class PolicyGateEngine {
  private readonly resolvedOptions: ResolvedPolicyGateOptions;

  public constructor(options: PolicyGateEngineOptions = {}) {
    this.resolvedOptions = this.resolveOptions(options);
  }

  /**
   * Evaluates one policy-gate input and returns structured decision output.
   * @param input Risk evaluation output plus policy context and optional compiled rules.
   * @returns Structured decision payload with audit-ready fields.
   */
  public evaluate(input: PolicyGateEvaluateInput): PolicyGateEvaluationResult {
    try {
      const normalizedInput = this.normalizeEvaluateInput(input);
      const allRules = [...this.resolvedOptions.defaultRules, ...normalizedInput.compiledRules];
      const matchedRules = this.resolveMatchedRules(allRules, normalizedInput);
      const selectedRule = this.selectRuleByPriority(matchedRules);
      const policyOutcome = selectedRule?.outcome ?? normalizedInput.riskEvaluation.requiredAction;
      const decisionSource = selectedRule
        ? PolicyDecisionSource.POLICY_RULE
        : PolicyDecisionSource.RISK_REQUIRED_ACTION;
      const reason =
        selectedRule?.reason ??
        `Policy outcome follows risk requiredAction (${normalizedInput.riskEvaluation.requiredAction}).`;
      const matchedRuleIds = this.normalizeStringList(matchedRules.map((rule) => rule.ruleId));
      const matchedPolicies = this.normalizeStringList([
        ...normalizedInput.riskEvaluation.matchedPolicies,
        ...matchedRuleIds,
      ]);
      const requiredReviewerRoles = this.resolveRequiredReviewerRoles(
        selectedRule,
        normalizedInput.riskEvaluation.requiredReviewerRoles,
      );
      const shouldTriggerHitl =
        policyOutcome === ChangeRiskRequiredAction.CONFIRM ||
        policyOutcome === ChangeRiskRequiredAction.ESCALATE;

      const evaluationResult: PolicyGateEvaluationResult = {
        policyOutcome,
        decisionSource,
        reason,
        matchedPolicies,
        matchedRuleIds,
        requiredReviewerRoles,
        shouldTriggerHitl,
        hitlFeedbackSchema: shouldTriggerHitl
          ? {
              requiredFields: ['decision', 'reason'],
              optionalFields: ['constraints'],
            }
          : null,
        auditRecord: {
          executionId: normalizedInput.context.executionId,
          stageId: normalizedInput.context.stageId,
          routeKey: normalizedInput.context.routeKey,
          policyOutcome,
          decisionSource,
          reason,
          riskLevel: normalizedInput.riskEvaluation.riskLevel,
          requiredAction: normalizedInput.riskEvaluation.requiredAction,
          matchedPolicies,
          matchedRuleIds,
          requiredReviewerRoles,
        },
      };

      return evaluationResult;
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }

      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_EVALUATION_FAILED,
        'Policy gate evaluation failed unexpectedly.',
        undefined,
        error,
      );
    }
  }

  /**
   * Applies human feedback to a HITL-pending policy result.
   * @param evaluationResult Existing evaluation result that requires HITL feedback.
   * @param feedback Human feedback payload.
   * @returns Final outcome with feedback-aware audit payload.
   */
  public applyHitlFeedback(
    evaluationResult: PolicyGateEvaluationResult,
    feedback: PolicyHitlFeedback,
  ): PolicyGateHitlResolutionResult {
    const normalizedFeedback = this.normalizeHitlFeedback(feedback);
    if (!evaluationResult.shouldTriggerHitl) {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
        'HITL feedback is only accepted for confirm/escalate outcomes.',
        {
          policyOutcome: evaluationResult.policyOutcome,
        },
      );
    }

    const finalOutcome = this.resolveHitlFinalOutcome(normalizedFeedback.decision);
    const decisionSource = PolicyDecisionSource.HITL_FEEDBACK;
    const reason = `HITL feedback resolved with decision "${normalizedFeedback.decision}": ${normalizedFeedback.reason}`;
    const matchedPolicies = this.normalizeStringList([
      ...evaluationResult.matchedPolicies,
      `policy.hitl.feedback.${normalizedFeedback.decision}`,
    ]);
    const auditRecord = {
      ...evaluationResult.auditRecord,
      policyOutcome: finalOutcome,
      decisionSource,
      reason,
      matchedPolicies,
    };

    return {
      finalOutcome,
      decisionSource,
      reason,
      feedback: normalizedFeedback,
      auditRecord,
    };
  }

  /**
   * Resolves runtime options and baseline rules.
   * @param options Optional policy-gate options.
   * @returns Resolved options.
   */
  private resolveOptions(options: PolicyGateEngineOptions): ResolvedPolicyGateOptions {
    const failureEscalationThreshold =
      options.reviewVerifyFailureEscalationThreshold ??
      DEFAULT_REVIEW_VERIFY_FAILURE_ESCALATION_THRESHOLD;
    this.assertNonNegativeInteger(
      failureEscalationThreshold,
      'reviewVerifyFailureEscalationThreshold',
    );

    const defaultRules =
      options.defaultRules ?? this.createDefaultRules(failureEscalationThreshold);

    return {
      defaultRules: this.normalizePolicyRules(defaultRules, 'defaultRules'),
    };
  }

  /**
   * Creates baseline policy rules aligned with product requirements.
   * @param failureEscalationThreshold Consecutive review-verify failure threshold.
   * @returns Baseline policy-rule list.
   */
  private createDefaultRules(failureEscalationThreshold: number): PolicyGateRule[] {
    return [
      {
        ruleId: PolicyGateRuleId.PROPOSAL_APPROVAL_REQUIRED,
        description: 'Block coding flow when proposal is not approved.',
        reason: 'Coding cannot proceed before proposal review approval.',
        outcome: ChangeRiskRequiredAction.BLOCK,
        priority: 100,
        enabled: true,
        condition: {
          proposalApproved: false,
        },
        requiredReviewerRoles: [GovernanceReviewerRole.MAINTAINER],
      },
      {
        ruleId: PolicyGateRuleId.REVIEW_VERIFY_FAILURE_ESCALATION,
        description: 'Escalate when review-verify failures reach threshold.',
        reason: 'Consecutive review-verify failures require manual escalation.',
        outcome: ChangeRiskRequiredAction.ESCALATE,
        priority: 90,
        enabled: true,
        condition: {
          minReviewVerifyConsecutiveFailures: failureEscalationThreshold,
        },
        requiredReviewerRoles: [
          GovernanceReviewerRole.MAINTAINER,
          GovernanceReviewerRole.SECURITY_REVIEWER,
        ],
      },
      {
        ruleId: PolicyGateRuleId.RISK_ACTION_BLOCK,
        description: 'Map risk requiredAction=block to policy block outcome.',
        reason: 'Risk evaluator signaled mandatory block outcome.',
        outcome: ChangeRiskRequiredAction.BLOCK,
        priority: 70,
        enabled: true,
        condition: {
          requiredActions: [ChangeRiskRequiredAction.BLOCK],
        },
      },
      {
        ruleId: PolicyGateRuleId.RISK_ACTION_ESCALATE,
        description: 'Map risk requiredAction=escalate to policy escalate outcome.',
        reason: 'Risk evaluator signaled escalation outcome.',
        outcome: ChangeRiskRequiredAction.ESCALATE,
        priority: 60,
        enabled: true,
        condition: {
          requiredActions: [ChangeRiskRequiredAction.ESCALATE],
        },
      },
      {
        ruleId: PolicyGateRuleId.RISK_ACTION_CONFIRM,
        description: 'Map risk requiredAction=confirm to policy confirm outcome.',
        reason: 'Risk evaluator signaled confirmation outcome.',
        outcome: ChangeRiskRequiredAction.CONFIRM,
        priority: 50,
        enabled: true,
        condition: {
          requiredActions: [ChangeRiskRequiredAction.CONFIRM],
        },
      },
    ];
  }

  /**
   * Validates and normalizes evaluate input payload.
   * @param input Raw evaluate input.
   * @returns Normalized input payload.
   */
  private normalizeEvaluateInput(input: PolicyGateEvaluateInput): NormalizedEvaluateInput {
    if (!input || typeof input !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_INPUT_INVALID,
        'Policy gate evaluate input must be a non-null object.',
      );
    }

    const riskEvaluation = input.riskEvaluation;
    if (!riskEvaluation || typeof riskEvaluation !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_INPUT_INVALID,
        'Policy gate evaluate input requires riskEvaluation object.',
      );
    }

    const requiredAction = String(riskEvaluation.requiredAction ?? '').trim();
    if (!POLICY_GATE_OUTCOME_VALUES.has(requiredAction)) {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_INPUT_INVALID,
        'Policy gate evaluate input has unsupported risk requiredAction.',
        {
          requiredAction,
        },
      );
    }
    const riskLevel = String(riskEvaluation.riskLevel ?? '').trim();
    if (!CHANGE_RISK_LEVEL_VALUES.has(riskLevel)) {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_INPUT_INVALID,
        'Policy gate evaluate input has unsupported risk level.',
        {
          riskLevel,
        },
      );
    }

    const context = input.context;
    if (!context || typeof context !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_INPUT_INVALID,
        'Policy gate evaluate input requires context object.',
      );
    }

    const executionId = this.readRequiredString(context.executionId, 'context.executionId');
    const stageId = this.readRequiredString(context.stageId, 'context.stageId');
    const routeKey = this.readRequiredString(context.routeKey, 'context.routeKey');
    if (typeof context.proposalApproved !== 'boolean') {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_INPUT_INVALID,
        'Policy gate context.proposalApproved must be a boolean.',
      );
    }
    this.assertNonNegativeInteger(
      context.reviewVerifyConsecutiveFailures,
      'context.reviewVerifyConsecutiveFailures',
    );

    return {
      riskEvaluation: {
        ...riskEvaluation,
        riskLevel: riskLevel as ChangeRiskLevel,
        requiredAction: requiredAction as ChangeRiskRequiredAction,
        matchedPolicies: this.normalizeStringList(riskEvaluation.matchedPolicies),
        requiredReviewerRoles: this.normalizeStringList(riskEvaluation.requiredReviewerRoles),
      },
      context: {
        executionId,
        stageId,
        routeKey,
        proposalApproved: context.proposalApproved,
        reviewVerifyConsecutiveFailures: context.reviewVerifyConsecutiveFailures,
      },
      compiledRules: this.normalizePolicyRules(input.compiledRules ?? [], 'compiledRules'),
    };
  }

  /**
   * Validates and normalizes policy-rule list.
   * @param rules Rule list.
   * @param fieldName Field name for diagnostics.
   * @returns Normalized rule list.
   */
  private normalizePolicyRules(rules: unknown, fieldName: string): PolicyGateRule[] {
    if (!Array.isArray(rules)) {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_RULE_INVALID,
        `Policy rules field "${fieldName}" must be an array.`,
      );
    }

    return rules.map((rawRule, index) => {
      if (!rawRule || typeof rawRule !== 'object') {
        throw new RuntimeError(
          GovernorErrorCode.POLICY_GATE_RULE_INVALID,
          `Policy rule "${fieldName}[${index}]" must be an object.`,
        );
      }

      const ruleId = this.readRequiredString(
        (rawRule as { ruleId?: unknown }).ruleId,
        `${fieldName}[${index}].ruleId`,
        GovernorErrorCode.POLICY_GATE_RULE_INVALID,
      );
      const description = this.readRequiredString(
        (rawRule as { description?: unknown }).description,
        `${fieldName}[${index}].description`,
        GovernorErrorCode.POLICY_GATE_RULE_INVALID,
      );
      const reason = this.readRequiredString(
        (rawRule as { reason?: unknown }).reason,
        `${fieldName}[${index}].reason`,
        GovernorErrorCode.POLICY_GATE_RULE_INVALID,
      );
      const outcome = this.readRequiredString(
        (rawRule as { outcome?: unknown }).outcome,
        `${fieldName}[${index}].outcome`,
        GovernorErrorCode.POLICY_GATE_RULE_INVALID,
      );
      if (!POLICY_GATE_OUTCOME_VALUES.has(outcome)) {
        throw new RuntimeError(
          GovernorErrorCode.POLICY_GATE_RULE_INVALID,
          `Policy rule "${fieldName}[${index}].outcome" is unsupported.`,
          {
            outcome,
          },
        );
      }

      const priority = Number((rawRule as { priority?: unknown }).priority);
      if (!Number.isFinite(priority)) {
        throw new RuntimeError(
          GovernorErrorCode.POLICY_GATE_RULE_INVALID,
          `Policy rule "${fieldName}[${index}].priority" must be a finite number.`,
        );
      }

      const enabled = (rawRule as { enabled?: unknown }).enabled;
      if (typeof enabled !== 'boolean') {
        throw new RuntimeError(
          GovernorErrorCode.POLICY_GATE_RULE_INVALID,
          `Policy rule "${fieldName}[${index}].enabled" must be a boolean.`,
        );
      }

      const condition = (rawRule as { condition?: unknown }).condition;
      if (!condition || typeof condition !== 'object') {
        throw new RuntimeError(
          GovernorErrorCode.POLICY_GATE_RULE_INVALID,
          `Policy rule "${fieldName}[${index}].condition" must be an object.`,
        );
      }

      const rawRequiredActions = (condition as { requiredActions?: unknown }).requiredActions;
      const requiredActions = Array.isArray(rawRequiredActions)
        ? this.normalizeOutcomeList(
            rawRequiredActions,
            `${fieldName}[${index}].condition.requiredActions`,
          )
        : undefined;
      const rawRiskLevels = (condition as { riskLevels?: unknown }).riskLevels;
      const riskLevels = Array.isArray(rawRiskLevels)
        ? this.normalizeRiskLevelList(rawRiskLevels, `${fieldName}[${index}].condition.riskLevels`)
        : undefined;
      const matchedPoliciesAny = Array.isArray(
        (condition as { matchedPoliciesAny?: unknown }).matchedPoliciesAny,
      )
        ? this.normalizeStringList(
            (condition as { matchedPoliciesAny?: unknown }).matchedPoliciesAny,
            GovernorErrorCode.POLICY_GATE_RULE_INVALID,
          )
        : undefined;
      const minReviewVerifyConsecutiveFailuresValue = (
        condition as {
          minReviewVerifyConsecutiveFailures?: unknown;
        }
      ).minReviewVerifyConsecutiveFailures;
      let minReviewVerifyConsecutiveFailures: number | undefined;
      if (minReviewVerifyConsecutiveFailuresValue !== undefined) {
        this.assertNonNegativeInteger(
          minReviewVerifyConsecutiveFailuresValue,
          `${fieldName}[${index}].condition.minReviewVerifyConsecutiveFailures`,
          GovernorErrorCode.POLICY_GATE_RULE_INVALID,
        );
        minReviewVerifyConsecutiveFailures = Number(minReviewVerifyConsecutiveFailuresValue);
      }

      const proposalApprovedValue = (condition as { proposalApproved?: unknown }).proposalApproved;
      let proposalApproved: boolean | undefined;
      if (proposalApprovedValue !== undefined && typeof proposalApprovedValue !== 'boolean') {
        throw new RuntimeError(
          GovernorErrorCode.POLICY_GATE_RULE_INVALID,
          `Policy rule "${fieldName}[${index}].condition.proposalApproved" must be a boolean when provided.`,
        );
      }
      if (typeof proposalApprovedValue === 'boolean') {
        proposalApproved = proposalApprovedValue;
      }

      const requiredReviewerRoles = Array.isArray(
        (rawRule as { requiredReviewerRoles?: unknown }).requiredReviewerRoles,
      )
        ? this.normalizeStringList(
            (rawRule as { requiredReviewerRoles?: unknown }).requiredReviewerRoles,
            GovernorErrorCode.POLICY_GATE_RULE_INVALID,
          )
        : undefined;

      return {
        ruleId,
        description,
        reason,
        outcome: outcome as ChangeRiskRequiredAction,
        priority,
        enabled,
        condition: {
          ...(proposalApproved !== undefined ? { proposalApproved } : {}),
          ...(minReviewVerifyConsecutiveFailures !== undefined
            ? { minReviewVerifyConsecutiveFailures }
            : {}),
          ...(requiredActions ? { requiredActions } : {}),
          ...(riskLevels ? { riskLevels } : {}),
          ...(matchedPoliciesAny ? { matchedPoliciesAny } : {}),
        },
        ...(requiredReviewerRoles ? { requiredReviewerRoles } : {}),
      };
    });
  }

  /**
   * Selects rules that match current risk and context facts.
   * @param rules Candidate rules.
   * @param input Normalized evaluate input.
   * @returns Matched rules.
   */
  private resolveMatchedRules(
    rules: PolicyGateRule[],
    input: NormalizedEvaluateInput,
  ): PolicyGateRule[] {
    return rules.filter((rule) => {
      if (!rule.enabled) {
        return false;
      }

      const condition = rule.condition;
      if (
        condition.proposalApproved !== undefined &&
        condition.proposalApproved !== input.context.proposalApproved
      ) {
        return false;
      }

      if (
        condition.minReviewVerifyConsecutiveFailures !== undefined &&
        input.context.reviewVerifyConsecutiveFailures < condition.minReviewVerifyConsecutiveFailures
      ) {
        return false;
      }

      if (
        condition.requiredActions &&
        !condition.requiredActions.includes(input.riskEvaluation.requiredAction)
      ) {
        return false;
      }

      if (condition.riskLevels && !condition.riskLevels.includes(input.riskEvaluation.riskLevel)) {
        return false;
      }

      if (
        condition.matchedPoliciesAny &&
        !condition.matchedPoliciesAny.some((policyId) =>
          input.riskEvaluation.matchedPolicies.includes(policyId),
        )
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Selects one final rule from matched rules with deterministic ordering.
   * @param matchedRules Matched rule list.
   * @returns Final selected rule or undefined.
   */
  private selectRuleByPriority(matchedRules: PolicyGateRule[]): PolicyGateRule | undefined {
    if (matchedRules.length === 0) {
      return undefined;
    }

    const sortedRules = [...matchedRules].sort((leftRule, rightRule) => {
      if (rightRule.priority !== leftRule.priority) {
        return rightRule.priority - leftRule.priority;
      }

      return POLICY_OUTCOME_SEVERITY[rightRule.outcome] - POLICY_OUTCOME_SEVERITY[leftRule.outcome];
    });

    return sortedRules[0];
  }

  /**
   * Resolves reviewer roles from selected rule or risk output.
   * @param selectedRule Selected rule.
   * @param riskReviewerRoles Reviewer roles from risk output.
   * @returns Final reviewer-role list.
   */
  private resolveRequiredReviewerRoles(
    selectedRule: PolicyGateRule | undefined,
    riskReviewerRoles: string[],
  ): PolicyReviewerRole[] {
    const selectedReviewerRoles = selectedRule?.requiredReviewerRoles;
    if (!selectedReviewerRoles || selectedReviewerRoles.length === 0) {
      return this.normalizeStringList(riskReviewerRoles);
    }

    return this.normalizeStringList(selectedReviewerRoles);
  }

  /**
   * Validates and normalizes one HITL feedback payload.
   * @param feedback Raw feedback payload.
   * @returns Normalized feedback payload.
   */
  private normalizeHitlFeedback(feedback: PolicyHitlFeedback): PolicyHitlFeedback {
    if (!feedback || typeof feedback !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
        'HITL feedback must be a non-null object.',
      );
    }

    const decision = this.readRequiredString(
      feedback.decision,
      'feedback.decision',
      GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
    );
    if (!POLICY_HITL_DECISION_VALUES.has(decision)) {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
        'HITL feedback decision is unsupported.',
        {
          decision,
        },
      );
    }

    const reason = this.readRequiredString(
      feedback.reason,
      'feedback.reason',
      GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
    );
    const constraints =
      feedback.constraints === undefined
        ? undefined
        : this.normalizeStringList(
            feedback.constraints,
            GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
          );

    return {
      decision: decision as PolicyHitlDecision,
      reason,
      ...(constraints ? { constraints } : {}),
    };
  }

  /**
   * Maps HITL decisions to final policy outcomes.
   * @param decision HITL feedback decision.
   * @returns Final policy outcome.
   */
  private resolveHitlFinalOutcome(decision: PolicyHitlDecision): ChangeRiskRequiredAction {
    if (decision === PolicyHitlDecision.APPROVE) {
      return ChangeRiskRequiredAction.ALLOW;
    }

    if (decision === PolicyHitlDecision.REJECT) {
      return ChangeRiskRequiredAction.BLOCK;
    }

    // Why this exists:
    // `revise` means the change cannot continue automatically and should enter
    // guarded manual follow-up until a reviewer confirms a safe next action.
    return ChangeRiskRequiredAction.ESCALATE;
  }

  /**
   * Validates that one value is a non-empty string.
   * @param value Raw value.
   * @param fieldName Field name for diagnostics.
   * @returns Normalized string value.
   */
  private readRequiredString(
    value: unknown,
    fieldName: string,
    errorCode: GovernorErrorCode = GovernorErrorCode.POLICY_GATE_INPUT_INVALID,
  ): string {
    if (typeof value !== 'string') {
      throw new RuntimeError(errorCode, `Field "${fieldName}" must be a string.`);
    }

    const normalizedValue = value.trim();
    if (!normalizedValue) {
      throw new RuntimeError(errorCode, `Field "${fieldName}" cannot be empty.`);
    }

    return normalizedValue;
  }

  /**
   * Validates integer-like non-negative numeric fields.
   * @param value Raw value.
   * @param fieldName Field name for diagnostics.
   * @returns Void.
   */
  private assertNonNegativeInteger(
    value: unknown,
    fieldName: string,
    errorCode: GovernorErrorCode = GovernorErrorCode.POLICY_GATE_INPUT_INVALID,
  ): void {
    if (!Number.isInteger(value) || Number(value) < 0) {
      throw new RuntimeError(errorCode, `Field "${fieldName}" must be a non-negative integer.`, {
        value,
      });
    }
  }

  /**
   * Normalizes list-like inputs with deterministic order and deduplication.
   * @param values Raw values.
   * @returns Normalized string array.
   */
  private normalizeStringList(
    values: unknown,
    errorCode: GovernorErrorCode = GovernorErrorCode.POLICY_GATE_INPUT_INVALID,
  ): string[] {
    if (!Array.isArray(values)) {
      throw new RuntimeError(errorCode, 'Policy gate list fields must be arrays.');
    }

    const uniqueValues = new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    );

    return Array.from(uniqueValues.values());
  }

  /**
   * Validates and normalizes one policy-outcome list.
   * @param values Raw outcome values.
   * @param fieldName Field name for diagnostics.
   * @returns Normalized outcome list.
   */
  private normalizeOutcomeList(values: unknown[], fieldName: string): ChangeRiskRequiredAction[] {
    const normalizedValues = this.normalizeStringList(
      values,
      GovernorErrorCode.POLICY_GATE_RULE_INVALID,
    );
    for (const value of normalizedValues) {
      if (!POLICY_GATE_OUTCOME_VALUES.has(value)) {
        throw new RuntimeError(
          GovernorErrorCode.POLICY_GATE_RULE_INVALID,
          `Field "${fieldName}" contains unsupported outcome value.`,
          {
            value,
          },
        );
      }
    }

    return normalizedValues as ChangeRiskRequiredAction[];
  }

  /**
   * Validates and normalizes one risk-level list.
   * @param values Raw risk-level values.
   * @param fieldName Field name for diagnostics.
   * @returns Normalized risk-level list.
   */
  private normalizeRiskLevelList(values: unknown[], fieldName: string): ChangeRiskLevel[] {
    const normalizedValues = this.normalizeStringList(
      values,
      GovernorErrorCode.POLICY_GATE_RULE_INVALID,
    );
    for (const value of normalizedValues) {
      if (!CHANGE_RISK_LEVEL_VALUES.has(value)) {
        throw new RuntimeError(
          GovernorErrorCode.POLICY_GATE_RULE_INVALID,
          `Field "${fieldName}" contains unsupported risk level value.`,
          {
            value,
          },
        );
      }
    }

    return normalizedValues as ChangeRiskLevel[];
  }
}
