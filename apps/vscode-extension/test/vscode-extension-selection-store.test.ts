import {
  OrchestrationGovernanceAttentionLevel,
  OrchestrationGovernanceFollowUpSlaState,
  OrchestrationGovernanceNotificationStatus,
  OrchestrationGovernanceQueueKind,
  OrchestrationGovernanceTemporaryBridgeBacklinkSurface,
  OrchestrationGovernanceTemporaryBridgeCapabilityClass,
  OrchestrationGovernanceTemporaryBridgeExitCriterion,
  OrchestrationGovernanceTemporaryBridgeReceiptKind,
} from '@repo-ai-governor/orchestration-service-client';

import { VsCodeExtensionSelectionStore } from '../src/runtime/vscode-extension-selection-store.js';

describe('VsCodeExtensionSelectionStore', () => {
  it('clears stale reviewSourcePath when the next command request resolves no review path', () => {
    const selectionStore = new VsCodeExtensionSelectionStore();

    selectionStore.rememberReviewSourcePath('/repo/review-a.md');
    selectionStore.applyCommandRequest({
      executionId: 'execution-b',
      reviewSourcePath: undefined,
    });

    expect(selectionStore.getSnapshot()).toEqual({
      executionId: 'execution-b',
      reviewSourcePath: undefined,
      queueEntry: undefined,
      temporaryBridge: undefined,
    });
  });

  it('persists queue-driven selection metadata and clears it on non-queue reselection', () => {
    const selectionStore = new VsCodeExtensionSelectionStore();

    selectionStore.applyCommandRequest({
      executionId: 'execution-queue',
      queueEntry: {
        queueEntryId: 'automation:execution-queue',
        queueKind: OrchestrationGovernanceQueueKind.AUTOMATION_INBOX,
        workspaceId: 'workspace-1',
        workspaceRoot: '/repo',
        executionId: 'execution-queue',
        attentionLevel: OrchestrationGovernanceAttentionLevel.WARNING,
        notificationStatus: OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED,
        followUpSlaState: OrchestrationGovernanceFollowUpSlaState.DUE_SOON,
        actions: [],
        handoffTargets: [],
      },
    });

    expect(selectionStore.getSnapshot().queueEntry?.queueEntryId).toBe(
      'automation:execution-queue',
    );

    selectionStore.rememberExecution('execution-board', 'session-board');

    expect(selectionStore.getSnapshot()).toEqual({
      executionId: 'execution-board',
      executionSessionId: 'session-board',
      reviewSourcePath: undefined,
      queueEntry: undefined,
      temporaryBridge: undefined,
    });
  });

  it('keeps bridge selection when only the routed review path changes', () => {
    const selectionStore = new VsCodeExtensionSelectionStore();

    selectionStore.applyCommandRequest({
      temporaryBridge: {
        bridgeId: 'temporary-bridge-host-verify',
        capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_VERIFY,
        workspaceRoot: '/repo/.repo-ai-governor',
        commandWorkingDirectory: '/repo',
        previewCommandLine:
          'repo-ai-governor host verify --output-dir /repo/.repo-ai-governor/generated/hosts/github-copilot',
        receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_VERIFY_RECEIPT,
        backlinkSurface: OrchestrationGovernanceTemporaryBridgeBacklinkSurface.ARTIFACT_WORKBENCH,
        exitCriteria: [
          OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_HOST_QUERY,
        ],
      },
    });

    expect(selectionStore.getSnapshot().temporaryBridge?.bridgeId).toBe(
      'temporary-bridge-host-verify',
    );

    selectionStore.rememberReviewSourcePath('/repo/review.md');

    expect(selectionStore.getSnapshot()).toEqual({
      reviewSourcePath: '/repo/review.md',
      queueEntry: undefined,
      temporaryBridge: {
        bridgeId: 'temporary-bridge-host-verify',
        capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_VERIFY,
        workspaceRoot: '/repo/.repo-ai-governor',
        commandWorkingDirectory: '/repo',
        previewCommandLine:
          'repo-ai-governor host verify --output-dir /repo/.repo-ai-governor/generated/hosts/github-copilot',
        receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_VERIFY_RECEIPT,
        backlinkSurface: OrchestrationGovernanceTemporaryBridgeBacklinkSurface.ARTIFACT_WORKBENCH,
        exitCriteria: [
          OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_HOST_QUERY,
        ],
      },
    });
  });
});
