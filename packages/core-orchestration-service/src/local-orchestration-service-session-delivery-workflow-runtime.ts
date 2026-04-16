import { isDeepStrictEqual } from 'node:util';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME,
  SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID,
  SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY,
  SESSION_DELIVERY_WORKFLOW_PHASE,
  SESSION_DELIVERY_WORKFLOW_VERSION,
} from './constants/session-delivery-workflow.constant.js';
import { SESSION_MAIN_CAPABILITY_ID } from './constants/session-main-capability.constant.js';
import type {
  SessionDeliveryRequirementReviewGate,
  SessionDeliveryRequirementReviewOutcome,
  SessionDeliveryWorkflowBacklink,
  SessionDeliveryWorkflowSessionState,
} from './types/index.js';

const DELIVERY_ALLOWED_CHILD_WORKFLOW_CAPABILITY_IDS: ReadonlySet<string> = new Set([
  SESSION_MAIN_CAPABILITY_ID.PLAN,
  SESSION_MAIN_CAPABILITY_ID.REVIEW,
  SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
  SESSION_MAIN_CAPABILITY_ID.RUN,
]);
const DELIVERY_ALLOWED_APPROVED_BRIEF_OUTCOMES: ReadonlySet<string> = new Set([
  SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.EXPLICIT_APPROVAL,
  SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.DOCS_ONLY_REVIEW,
]);
const DELIVERY_ALLOWED_PHASES: ReadonlySet<string> = new Set(
  Object.values(SESSION_DELIVERY_WORKFLOW_PHASE),
);
const DELIVERY_ALLOWED_REVIEW_OUTCOMES: ReadonlySet<string> = new Set(
  Object.values(SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME),
);

/**
 * Owns shared-session parsing and validation for the delivery workflow overlay.
 *
 * Why this exists:
 * sprint-001 needs one orchestration-owned session truth surface for deliver workflow state and
 * approved durable-brief gating without prematurely introducing durable read-model duplication.
 */
export class LocalOrchestrationServiceSessionDeliveryWorkflowRuntime {
  /**
   * Reads one persisted delivery workflow state from session context when present.
   * @param context Shared-session context snapshot.
   * @returns Parsed delivery workflow state or `undefined` when absent or invalid.
   */
  public readSessionState(
    context: Record<string, unknown> | null | undefined,
  ): SessionDeliveryWorkflowSessionState | undefined {
    if (!context) {
      return undefined;
    }

    return this.parseState(context[SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY]);
  }

  /**
   * Creates one session-context patch for delivery workflow state updates.
   * @param context Current shared-session context snapshot.
   * @param state Next workflow state, or `null` to clear the overlay.
   * @returns Context patch for `updateContext()`, or `null` when nothing changed.
   */
  public createContextPatch(
    context: Record<string, unknown>,
    state: SessionDeliveryWorkflowSessionState | null,
  ): Record<string, unknown> | null {
    const currentState = this.readSessionState(context) ?? null;
    const nextState = state === null ? null : this.requireValidState(state);

    if (isDeepStrictEqual(currentState, nextState)) {
      return null;
    }

    return {
      [SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY]: nextState,
    };
  }

  /**
   * Returns whether the supplied gate or workflow authorizes durable approved-brief writes.
   * @param candidate One outcome string, gate, or full workflow state.
   * @returns `true` when approved durable-brief writes are allowed.
   */
  public canWriteApprovedDeliveryBrief(
    candidate:
      | SessionDeliveryRequirementReviewOutcome
      | SessionDeliveryRequirementReviewGate
      | SessionDeliveryWorkflowSessionState
      | null
      | undefined,
  ): boolean {
    if (!candidate) {
      return false;
    }

    if (typeof candidate === 'string') {
      return false;
    }

    const requirementReviewGate =
      'requirementReviewGate' in candidate ? candidate.requirementReviewGate : candidate;

    return (
      DELIVERY_ALLOWED_APPROVED_BRIEF_OUTCOMES.has(requirementReviewGate.outcome) &&
      this.readString(requirementReviewGate.evidenceArtifactPath) !== undefined
    );
  }

  /**
   * Throws when the supplied gate or workflow does not authorize durable approved-brief writes.
   * @param candidate One outcome string, gate, or full workflow state.
   */
  public requireApprovedDeliveryBriefWriteAllowed(
    candidate:
      | SessionDeliveryRequirementReviewOutcome
      | SessionDeliveryRequirementReviewGate
      | SessionDeliveryWorkflowSessionState
      | null
      | undefined,
  ): void {
    if (this.canWriteApprovedDeliveryBrief(candidate)) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.AGENTS_PROJECTION_INVALID,
      'Approved durable brief writes require explicit approval or docs-only review.',
      {
        candidate,
      },
    );
  }

  private parseState(candidate: unknown): SessionDeliveryWorkflowSessionState | undefined {
    const record = this.readRecord(candidate);
    if (!record || record.version !== SESSION_DELIVERY_WORKFLOW_VERSION) {
      return undefined;
    }

    const workflowId = this.readString(record.workflowId);
    const capabilityId = this.readString(record.capabilityId);
    const currentPhase = this.readString(record.currentPhase);
    const requirementReviewGate = this.parseRequirementReviewGate(record.requirementReviewGate);
    if (
      !workflowId ||
      capabilityId !== SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER ||
      !currentPhase ||
      !DELIVERY_ALLOWED_PHASES.has(currentPhase) ||
      !requirementReviewGate
    ) {
      return undefined;
    }

    const relatedArtifactPaths = this.readStringArray(record.relatedArtifactPaths);
    const childWorkflowBacklinks = this.readChildWorkflowBacklinks(record.childWorkflowBacklinks);
    if (!relatedArtifactPaths || !childWorkflowBacklinks) {
      return undefined;
    }

    const approvedDeliveryBriefPath = this.readNullableString(record.approvedDeliveryBriefPath);
    if (
      approvedDeliveryBriefPath !== null &&
      !this.canWriteApprovedDeliveryBrief(requirementReviewGate)
    ) {
      return undefined;
    }

    return {
      version: SESSION_DELIVERY_WORKFLOW_VERSION,
      workflowId,
      capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
      currentPhase: currentPhase as SessionDeliveryWorkflowSessionState['currentPhase'],
      requirementReviewGate,
      approvedDeliveryBriefPath,
      pendingAction: this.readNullableString(record.pendingAction),
      selectedTargetStream: this.readNullableString(record.selectedTargetStream),
      relatedArtifactPaths,
      childWorkflowBacklinks,
      blockedReason: this.readNullableString(record.blockedReason),
      resultSummary: this.readNullableString(record.resultSummary),
    };
  }

  private requireValidState(
    state: SessionDeliveryWorkflowSessionState,
  ): SessionDeliveryWorkflowSessionState {
    const parsedState = this.parseState(state);
    if (!parsedState) {
      throw new RuntimeError(
        GovernorErrorCode.AGENTS_PROJECTION_INVALID,
        'Invalid delivery workflow session state.',
        {
          state,
        },
      );
    }

    return {
      ...parsedState,
      requirementReviewGate: {
        ...parsedState.requirementReviewGate,
      },
      relatedArtifactPaths: [...parsedState.relatedArtifactPaths],
      childWorkflowBacklinks: parsedState.childWorkflowBacklinks.map((backlink) => ({
        ...backlink,
      })),
    };
  }

  private parseRequirementReviewGate(
    candidate: unknown,
  ): SessionDeliveryRequirementReviewGate | undefined {
    const record = this.readRecord(candidate);
    if (!record) {
      return undefined;
    }

    const outcome = this.readString(record.outcome);
    if (!outcome || !DELIVERY_ALLOWED_REVIEW_OUTCOMES.has(outcome)) {
      return undefined;
    }

    const evidenceArtifactPath = this.readNullableString(record.evidenceArtifactPath);
    if (DELIVERY_ALLOWED_APPROVED_BRIEF_OUTCOMES.has(outcome) && evidenceArtifactPath === null) {
      return undefined;
    }

    return {
      outcome: outcome as SessionDeliveryRequirementReviewGate['outcome'],
      evidenceArtifactPath,
    };
  }

  private readChildWorkflowBacklinks(
    candidate: unknown,
  ): SessionDeliveryWorkflowBacklink[] | undefined {
    if (!Array.isArray(candidate)) {
      return undefined;
    }

    const backlinks: SessionDeliveryWorkflowBacklink[] = [];
    for (const backlinkCandidate of candidate) {
      const record = this.readRecord(backlinkCandidate);
      if (!record) {
        return undefined;
      }

      const capabilityId = this.readString(record.capabilityId);
      const artifactPath = this.readString(record.artifactPath);
      if (
        !capabilityId ||
        !artifactPath ||
        !DELIVERY_ALLOWED_CHILD_WORKFLOW_CAPABILITY_IDS.has(capabilityId)
      ) {
        return undefined;
      }

      backlinks.push({
        capabilityId: capabilityId as SessionDeliveryWorkflowBacklink['capabilityId'],
        artifactPath,
        summary: this.readNullableString(record.summary),
      });
    }

    return backlinks;
  }

  private readStringArray(candidate: unknown): string[] | undefined {
    if (!Array.isArray(candidate)) {
      return undefined;
    }

    const values: string[] = [];
    for (const value of candidate) {
      const normalizedValue = this.readString(value);
      if (!normalizedValue) {
        return undefined;
      }
      values.push(normalizedValue);
    }

    return values;
  }

  private readRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return value as Record<string, unknown>;
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  private readNullableString(value: unknown): string | null {
    const normalizedValue = this.readString(value);
    return normalizedValue ?? null;
  }
}
