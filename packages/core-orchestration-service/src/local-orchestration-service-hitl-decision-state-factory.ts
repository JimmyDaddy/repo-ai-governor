import type { OrchestrationHitlDecisionOption } from '@repo-ai-governor/orchestration-service-client';
import {
  LOCAL_ORCHESTRATION_SERVICE_HITL_CONFIRM_SLA_HOURS,
  LOCAL_ORCHESTRATION_SERVICE_HITL_DEFAULT_TIMEOUT_ACTION,
  LOCAL_ORCHESTRATION_SERVICE_HITL_PENDING_POLICY_ACTION,
  LOCAL_ORCHESTRATION_SERVICE_HITL_PENDING_RISK_CATEGORY,
  LOCAL_ORCHESTRATION_SERVICE_HITL_PENDING_RISK_CONFIDENCE,
  LOCAL_ORCHESTRATION_SERVICE_HITL_PENDING_RISK_LEVEL,
  LOCAL_ORCHESTRATION_SERVICE_HITL_PENDING_TRIGGER_RULE,
} from './constants/index.js';
import type { LocalOrchestrationServiceHitlDecisionState } from './types/index.js';

interface LocalOrchestrationServicePendingHitlDecisionStateRequest {
  executionId: string;
  taskId?: string;
  recordedAt: string;
}

/**
 * Builds the canonical HITL decision model for local orchestration surfaces.
 *
 * Why this exists:
 * execution actions, persisted shell state, and governance query fallback must all reuse one
 * service-owned definition for default pending-HITL decisions instead of drifting across call sites.
 */
export class LocalOrchestrationServiceHitlDecisionStateFactory {
  /**
   * Builds the allowed decision set for one pending HITL execution.
   * @param executionId Execution identifier that scopes option ids.
   * @returns Stable service-owned decision options for the execution.
   */
  public buildAllowedDecisions(executionId: string): OrchestrationHitlDecisionOption[] {
    return [
      {
        optionId: `${executionId}:hitl:approve-resume`,
        decision: 'approve',
        resumeAction: 'resume',
      },
      {
        optionId: `${executionId}:hitl:request-changes-degrade`,
        decision: 'request_changes',
        resumeAction: 'degrade',
      },
      {
        optionId: `${executionId}:hitl:reject-terminate`,
        decision: 'reject',
        resumeAction: 'terminate',
      },
    ];
  }

  /**
   * Builds the default persisted state for one pending HITL decision.
   * @param request Execution-specific identifiers and the stable pending origin timestamp.
   * @returns Service-owned decision state anchored to the pending-HITL origin.
   */
  public buildPendingDecisionState(
    request: LocalOrchestrationServicePendingHitlDecisionStateRequest,
  ): LocalOrchestrationServiceHitlDecisionState {
    const scope = request.taskId ?? request.executionId;
    const slaDeadlineAt = this.buildSlaDeadlineAt(request.recordedAt);

    return {
      policyAction: LOCAL_ORCHESTRATION_SERVICE_HITL_PENDING_POLICY_ACTION,
      defaultTimeoutAction: LOCAL_ORCHESTRATION_SERVICE_HITL_DEFAULT_TIMEOUT_ACTION,
      allowedDecisions: this.buildAllowedDecisions(request.executionId),
      riskFacts: [
        {
          riskId: this.buildPendingRiskId(request.executionId, request.recordedAt),
          riskCategory: LOCAL_ORCHESTRATION_SERVICE_HITL_PENDING_RISK_CATEGORY,
          riskLevel: LOCAL_ORCHESTRATION_SERVICE_HITL_PENDING_RISK_LEVEL,
          evidence: this.buildPendingRiskEvidence(request),
          changeScope: scope,
          confidence: LOCAL_ORCHESTRATION_SERVICE_HITL_PENDING_RISK_CONFIDENCE,
          triggerRule: LOCAL_ORCHESTRATION_SERVICE_HITL_PENDING_TRIGGER_RULE,
        },
      ],
      recordedAt: request.recordedAt,
      ...(slaDeadlineAt
        ? {
            slaDeadlineAt,
          }
        : {}),
    };
  }

  private buildPendingRiskId(executionId: string, recordedAt: string): string {
    return `hitl-pending-${executionId}-${recordedAt.replace(/[^0-9]/gu, '')}`;
  }

  private buildPendingRiskEvidence(
    request: LocalOrchestrationServicePendingHitlDecisionStateRequest,
  ): string[] {
    return [
      `execution_id=${request.executionId}`,
      ...(request.taskId ? [`task_id=${request.taskId}`] : []),
      `pending_since=${request.recordedAt}`,
    ];
  }

  private buildSlaDeadlineAt(recordedAt: string): string | undefined {
    const recordedAtDate = new Date(recordedAt);
    if (Number.isNaN(recordedAtDate.getTime())) {
      return undefined;
    }

    return new Date(
      recordedAtDate.getTime() +
        LOCAL_ORCHESTRATION_SERVICE_HITL_CONFIRM_SLA_HOURS * 60 * 60 * 1000,
    ).toISOString();
  }
}
