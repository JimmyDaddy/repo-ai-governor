import type {
  SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME,
  SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID,
  SESSION_DELIVERY_WORKFLOW_PHASE,
  SESSION_DELIVERY_WORKFLOW_VERSION,
} from '../../constants/session-delivery-workflow.constant.js';
import type { SessionMainCapabilityId } from '../aliases/session-main-capability.type.js';

export type SessionDeliveryWorkflowVersion = typeof SESSION_DELIVERY_WORKFLOW_VERSION;

export type SessionDeliveryWorkflowCapabilityId =
  (typeof SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID)[keyof typeof SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID];

export type SessionDeliveryWorkflowPhase =
  (typeof SESSION_DELIVERY_WORKFLOW_PHASE)[keyof typeof SESSION_DELIVERY_WORKFLOW_PHASE];

export type SessionDeliveryRequirementReviewOutcome =
  (typeof SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME)[keyof typeof SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME];

/**
 * Defines the requirement-review gate that controls approved durable-brief writes.
 */
export interface SessionDeliveryRequirementReviewGate {
  outcome: SessionDeliveryRequirementReviewOutcome;
  evidenceArtifactPath: string | null;
}

/**
 * Defines one presenter-safe backlink to an existing child workflow artifact.
 */
export interface SessionDeliveryWorkflowBacklink {
  capabilityId: SessionMainCapabilityId;
  artifactPath: string;
  summary: string | null;
}

/**
 * Defines the shared-session delivery workflow overlay owned by runtime.orchestration.
 */
export interface SessionDeliveryWorkflowSessionState {
  version: SessionDeliveryWorkflowVersion;
  workflowId: string;
  capabilityId: SessionDeliveryWorkflowCapabilityId;
  currentPhase: SessionDeliveryWorkflowPhase;
  requirementReviewGate: SessionDeliveryRequirementReviewGate;
  approvedDeliveryBriefPath: string | null;
  pendingAction: string | null;
  selectedTargetStream: string | null;
  relatedArtifactPaths: string[];
  childWorkflowBacklinks: SessionDeliveryWorkflowBacklink[];
  blockedReason: string | null;
  resultSummary: string | null;
}
