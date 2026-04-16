import { isDeepStrictEqual } from 'node:util';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME,
  SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID,
  SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY,
  SESSION_DELIVERY_WORKFLOW_PENDING_ACTION,
  SESSION_DELIVERY_WORKFLOW_PHASE,
  SESSION_DELIVERY_WORKFLOW_VERSION,
} from './constants/session-delivery-workflow.constant.js';
import { SESSION_MAIN_CAPABILITY_ID } from './constants/session-main-capability.constant.js';
import type {
  SessionDeliveryRequirementReviewGate,
  SessionDeliveryRequirementReviewOutcome,
  SessionDeliveryWorkflowBacklink,
  SessionDeliveryWorkflowPhase,
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
const DELIVERY_MESSAGE_METADATA_UPDATE_KEY = 'deliveryWorkflowUpdate';

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

  /**
   * Resolves one appended-message metadata update into the next delivery state plus presenter fields.
   * @param context Current shared-session context snapshot.
   * @param metadata Appended-message metadata payload.
   * @returns Next state plus presenter-safe metadata, or `null` when no delivery update applies.
   */
  public resolveMessageMetadataUpdate(
    context: Record<string, unknown> | null | undefined,
    metadata: Record<string, unknown> | undefined,
    sessionId?: string,
  ): {
    nextState: SessionDeliveryWorkflowSessionState;
    presenterMetadata: Record<string, unknown>;
  } | null {
    const updateRecord = this.readRecord(metadata?.[DELIVERY_MESSAGE_METADATA_UPDATE_KEY]);
    if (!updateRecord) {
      return null;
    }

    const currentState = this.readSessionState(context);
    const nextStateBaseline =
      currentState ??
      this.createBootstrapStateForMessageMetadataUpdate(context, sessionId, updateRecord);
    if (!nextStateBaseline) {
      return null;
    }

    const nextState = this.applyMessageMetadataUpdate(nextStateBaseline, updateRecord);
    if (!nextState) {
      return null;
    }

    return {
      nextState,
      presenterMetadata: this.createPresenterMetadata(nextState),
    };
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

  private createBootstrapStateForMessageMetadataUpdate(
    context: Record<string, unknown> | null | undefined,
    sessionId: string | undefined,
    updateRecord: Record<string, unknown>,
  ): SessionDeliveryWorkflowSessionState | null {
    if (!sessionId || (context && Object.hasOwn(context, SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY))) {
      return null;
    }

    const currentPhase = this.readString(updateRecord.currentPhase);
    if (!currentPhase || !DELIVERY_ALLOWED_PHASES.has(currentPhase)) {
      return null;
    }

    return {
      version: SESSION_DELIVERY_WORKFLOW_VERSION,
      workflowId: `delivery-workflow-${sessionId}-bootstrap`,
      capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
      currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_CAPTURE,
      requirementReviewGate: {
        outcome: SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.PENDING,
        evidenceArtifactPath: null,
      },
      approvedDeliveryBriefPath: null,
      pendingAction:
        SESSION_DELIVERY_WORKFLOW_PENDING_ACTION.CAPTURE_REQUIREMENT_OR_ATTACH_APPROVED_BRIEF,
      selectedTargetStream: null,
      relatedArtifactPaths: [],
      childWorkflowBacklinks: [],
      blockedReason: null,
      resultSummary: null,
    };
  }

  private applyMessageMetadataUpdate(
    currentState: SessionDeliveryWorkflowSessionState,
    updateRecord: Record<string, unknown>,
  ): SessionDeliveryWorkflowSessionState | null {
    const currentPhase = this.readString(updateRecord.currentPhase);
    if (!currentPhase || !DELIVERY_ALLOWED_PHASES.has(currentPhase)) {
      return null;
    }

    const relatedArtifactPathsUpdate = this.readOptionalStringArrayField(
      updateRecord,
      'relatedArtifactPaths',
    );
    if (Object.hasOwn(updateRecord, 'relatedArtifactPaths') && !relatedArtifactPathsUpdate) {
      return null;
    }

    const childWorkflowBacklinksUpdate = this.readOptionalChildWorkflowBacklinksField(
      updateRecord,
      'childWorkflowBacklinks',
    );
    if (Object.hasOwn(updateRecord, 'childWorkflowBacklinks') && !childWorkflowBacklinksUpdate) {
      return null;
    }

    const pendingActionUpdate = this.readOptionalNullableStringField(updateRecord, 'pendingAction');
    const selectedTargetStreamUpdate = this.readOptionalNullableStringField(
      updateRecord,
      'selectedTargetStream',
    );
    const resultSummaryUpdate = this.readOptionalNullableStringField(updateRecord, 'resultSummary');
    const approvedDeliveryBriefPathUpdate = this.readOptionalNullableStringField(
      updateRecord,
      'approvedDeliveryBriefPath',
    );
    const blockedReasonUpdate = this.readOptionalNullableStringField(updateRecord, 'blockedReason');

    return this.requireValidState({
      ...currentState,
      currentPhase: currentPhase as SessionDeliveryWorkflowPhase,
      pendingAction: pendingActionUpdate?.hasValue
        ? pendingActionUpdate.value
        : currentState.pendingAction,
      selectedTargetStream: selectedTargetStreamUpdate?.hasValue
        ? selectedTargetStreamUpdate.value
        : currentState.selectedTargetStream,
      approvedDeliveryBriefPath: approvedDeliveryBriefPathUpdate?.hasValue
        ? approvedDeliveryBriefPathUpdate.value
        : currentState.approvedDeliveryBriefPath,
      relatedArtifactPaths: this.mergeStringArrays(
        currentState.relatedArtifactPaths,
        relatedArtifactPathsUpdate?.value ?? [],
      ),
      childWorkflowBacklinks: this.mergeChildWorkflowBacklinks(
        currentState.childWorkflowBacklinks,
        childWorkflowBacklinksUpdate?.value ?? [],
      ),
      blockedReason: blockedReasonUpdate?.hasValue
        ? blockedReasonUpdate.value
        : currentState.blockedReason,
      resultSummary: resultSummaryUpdate?.hasValue
        ? resultSummaryUpdate.value
        : currentState.resultSummary,
    });
  }

  private createPresenterMetadata(
    state: SessionDeliveryWorkflowSessionState,
  ): Record<string, unknown> {
    return {
      turn_delivery_phase: state.currentPhase,
      turn_delivery_pending_action: state.pendingAction,
      turn_delivery_related_artifact_paths: [...state.relatedArtifactPaths],
      turn_delivery_selected_stream: state.selectedTargetStream,
      turn_delivery_result_summary: state.resultSummary,
    };
  }

  private readOptionalNullableStringField(
    record: Record<string, unknown>,
    fieldName: string,
  ): {
    hasValue: boolean;
    value: string | null;
  } | null {
    if (!Object.hasOwn(record, fieldName)) {
      return null;
    }

    return {
      hasValue: true,
      value: this.readNullableString(record[fieldName]),
    };
  }

  private readOptionalStringArrayField(
    record: Record<string, unknown>,
    fieldName: string,
  ): {
    value: string[];
  } | null {
    if (!Object.hasOwn(record, fieldName)) {
      return null;
    }

    const value = this.readStringArray(record[fieldName]);
    return value ? { value } : null;
  }

  private readOptionalChildWorkflowBacklinksField(
    record: Record<string, unknown>,
    fieldName: string,
  ): {
    value: SessionDeliveryWorkflowBacklink[];
  } | null {
    if (!Object.hasOwn(record, fieldName)) {
      return null;
    }

    const value = this.readChildWorkflowBacklinks(record[fieldName]);
    return value ? { value } : null;
  }

  private mergeStringArrays(currentValues: string[], nextValues: string[]): string[] {
    return [...new Set([...currentValues, ...nextValues])];
  }

  private mergeChildWorkflowBacklinks(
    currentValues: SessionDeliveryWorkflowBacklink[],
    nextValues: SessionDeliveryWorkflowBacklink[],
  ): SessionDeliveryWorkflowBacklink[] {
    const mergedBacklinks = new Map<string, SessionDeliveryWorkflowBacklink>();
    for (const backlink of [...currentValues, ...nextValues]) {
      mergedBacklinks.set(`${backlink.capabilityId}:${backlink.artifactPath}`, {
        ...backlink,
      });
    }

    return [...mergedBacklinks.values()];
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
