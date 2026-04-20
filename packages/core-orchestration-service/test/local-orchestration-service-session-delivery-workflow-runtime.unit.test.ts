import {
  LocalOrchestrationServiceSessionDeliveryWorkflowRuntime,
  SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME,
  SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID,
  SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY,
  SESSION_DELIVERY_WORKFLOW_PHASE,
  SESSION_DELIVERY_WORKFLOW_VERSION,
  SESSION_MAIN_CAPABILITY_ID,
  type SessionDeliveryWorkflowSessionState,
} from '../src/index.js';

describe('LocalOrchestrationServiceSessionDeliveryWorkflowRuntime', () => {
  it('reads a valid delivery workflow state from shared-session context', () => {
    const runtime = new LocalOrchestrationServiceSessionDeliveryWorkflowRuntime();

    const state = runtime.readSessionState({
      [SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY]: {
        version: SESSION_DELIVERY_WORKFLOW_VERSION,
        workflowId: 'delivery-workflow-001',
        capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
        currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_REVIEW_PENDING,
        requirementReviewGate: {
          outcome: SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.EXPLICIT_APPROVAL,
          evidenceArtifactPath: '.repo-ai-governor/review/approved-requirement.md',
        },
        approvedDeliveryBriefPath: '.repo-ai-governor/durable/approved-delivery-brief.md',
        pendingAction: 'Wait for task decomposition commit.',
        selectedTargetStream: 'project-110/sprint-001',
        relatedArtifactPaths: ['.repo-ai-governor/durable/approved-delivery-brief.md'],
        childWorkflowBacklinks: [
          {
            capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
            artifactPath: '.repo-ai-governor/review/code_review_tk-925.md',
            summary: 'Requirement brief review receipt.',
          },
        ],
        blockedReason: null,
        resultSummary: 'Approved durable brief exported.',
      },
    });

    expect(state).toEqual(
      expect.objectContaining({
        workflowId: 'delivery-workflow-001',
        capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
        currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_REVIEW_PENDING,
        approvedDeliveryBriefPath: '.repo-ai-governor/durable/approved-delivery-brief.md',
      }),
    );
    expect(runtime.canWriteApprovedDeliveryBrief(state)).toBe(true);
  });

  it('rejects approved durable brief writes before explicit approval or docs-only review', () => {
    const runtime = new LocalOrchestrationServiceSessionDeliveryWorkflowRuntime();

    expect(
      runtime.readSessionState({
        [SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY]: {
          version: SESSION_DELIVERY_WORKFLOW_VERSION,
          workflowId: 'delivery-workflow-002',
          capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
          currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_REVIEW_PENDING,
          requirementReviewGate: {
            outcome: SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.PENDING,
            evidenceArtifactPath: null,
          },
          approvedDeliveryBriefPath: '.repo-ai-governor/durable/approved-delivery-brief.md',
          pendingAction: 'Wait for approval.',
          selectedTargetStream: 'project-110/sprint-001',
          relatedArtifactPaths: [],
          childWorkflowBacklinks: [],
          blockedReason: null,
          resultSummary: null,
        },
      }),
    ).toBeUndefined();

    expect(() =>
      runtime.requireApprovedDeliveryBriefWriteAllowed(
        SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.PENDING,
      ),
    ).toThrow('Approved durable brief writes require explicit approval or docs-only review.');
  });

  it('requires an approval or docs-only receipt backlink before accepting a positive review gate', () => {
    const runtime = new LocalOrchestrationServiceSessionDeliveryWorkflowRuntime();

    expect(
      runtime.readSessionState({
        [SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY]: {
          version: SESSION_DELIVERY_WORKFLOW_VERSION,
          workflowId: 'delivery-workflow-004',
          capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
          currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_REVIEW_PENDING,
          requirementReviewGate: {
            outcome: SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.EXPLICIT_APPROVAL,
            evidenceArtifactPath: null,
          },
          approvedDeliveryBriefPath: null,
          pendingAction: 'Write the approved durable brief.',
          selectedTargetStream: 'project-110/sprint-001',
          relatedArtifactPaths: [],
          childWorkflowBacklinks: [],
          blockedReason: null,
          resultSummary: null,
        },
      }),
    ).toBeUndefined();
    expect(
      runtime.canWriteApprovedDeliveryBrief(
        SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.EXPLICIT_APPROVAL,
      ),
    ).toBe(false);
    expect(
      runtime.canWriteApprovedDeliveryBrief({
        outcome: SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.EXPLICIT_APPROVAL,
        evidenceArtifactPath: null,
      }),
    ).toBe(false);
    expect(() =>
      runtime.requireApprovedDeliveryBriefWriteAllowed({
        outcome: SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.DOCS_ONLY_REVIEW,
        evidenceArtifactPath: null,
      }),
    ).toThrow('Approved durable brief writes require explicit approval or docs-only review.');
  });

  it('only emits a context patch when the delivery workflow state changes', () => {
    const runtime = new LocalOrchestrationServiceSessionDeliveryWorkflowRuntime();

    const state: SessionDeliveryWorkflowSessionState = {
      version: SESSION_DELIVERY_WORKFLOW_VERSION,
      workflowId: 'delivery-workflow-003',
      capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
      currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_CAPTURE,
      requirementReviewGate: {
        outcome: SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.PENDING,
        evidenceArtifactPath: null,
      },
      approvedDeliveryBriefPath: null,
      pendingAction: 'Capture the requirement summary.',
      selectedTargetStream: 'project-110/sprint-001',
      relatedArtifactPaths: [],
      childWorkflowBacklinks: [],
      blockedReason: null,
      resultSummary: null,
    };

    expect(runtime.createContextPatch({}, state)).toEqual({
      [SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY]: state,
    });
    expect(
      runtime.createContextPatch(
        {
          [SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY]: state,
        },
        state,
      ),
    ).toBeNull();
  });
});
