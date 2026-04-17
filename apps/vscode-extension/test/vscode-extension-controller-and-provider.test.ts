import { vi } from 'vitest';

import { OrchestrationGovernanceActionKind } from '@repo-ai-governor/orchestration-service-client';
import { OrchestrationGovernanceAttentionLevel } from '@repo-ai-governor/orchestration-service-client';
import { OrchestrationGovernanceFollowUpSlaState } from '@repo-ai-governor/orchestration-service-client';
import { OrchestrationGovernanceNotificationStatus } from '@repo-ai-governor/orchestration-service-client';
import { OrchestrationGovernanceQueueKind } from '@repo-ai-governor/orchestration-service-client';
import { OrchestrationGovernanceTemporaryBridgeCapabilityClass } from '@repo-ai-governor/orchestration-service-client';
import { OrchestrationGovernanceTemporaryBridgeBacklinkSurface } from '@repo-ai-governor/orchestration-service-client';
import { OrchestrationGovernanceTemporaryBridgeExitCriterion } from '@repo-ai-governor/orchestration-service-client';
import { OrchestrationGovernanceTemporaryBridgeReceiptKind } from '@repo-ai-governor/orchestration-service-client';
import { OrchestrationHandoffTargetKind } from '@repo-ai-governor/orchestration-service-client';

const vscodeMock = vi.hoisted(() => {
  const showInformationMessage = vi.fn();
  const showWarningMessage = vi.fn();
  const showErrorMessage = vi.fn();
  const openTextDocument = vi.fn();
  const showTextDocument = vi.fn();
  const executeCommand = vi.fn();
  const sendText = vi.fn();
  const createTerminal = vi.fn(() => ({
    show: vi.fn(),
    sendText,
  }));

  return {
    state: {
      trusted: false,
    },
    showInformationMessage,
    showWarningMessage,
    showErrorMessage,
    openTextDocument,
    showTextDocument,
    executeCommand,
    sendText,
    createTerminal,
  };
});

vi.mock(
  'vscode',
  () => ({
    workspace: {
      get isTrusted() {
        return vscodeMock.state.trusted;
      },
      workspaceFolders: [
        {
          name: 'ai-governor',
          uri: {
            fsPath: '/repo',
          },
        },
      ],
      openTextDocument: vscodeMock.openTextDocument,
    },
    window: {
      showInformationMessage: vscodeMock.showInformationMessage,
      showWarningMessage: vscodeMock.showWarningMessage,
      showErrorMessage: vscodeMock.showErrorMessage,
      showTextDocument: vscodeMock.showTextDocument,
      createTerminal: vscodeMock.createTerminal,
    },
    commands: {
      executeCommand: vscodeMock.executeCommand,
    },
    Uri: {
      file: (fsPath: string) => ({
        fsPath,
      }),
    },
  }),
  { virtual: true },
);

import { VsCodeExtensionCommandController } from '../src/runtime/vscode-extension-command-controller.js';
import { VsCodeExtensionReviewDetailProvider } from '../src/runtime/vscode-extension-review-detail-provider.js';
import { VsCodeExtensionSelectionStore } from '../src/runtime/vscode-extension-selection-store.js';

describe('VsCode extension controller/provider integration', () => {
  beforeEach(() => {
    vscodeMock.state.trusted = false;
    vscodeMock.showInformationMessage.mockReset();
    vscodeMock.showWarningMessage.mockReset();
    vscodeMock.showErrorMessage.mockReset();
    vscodeMock.openTextDocument.mockReset();
    vscodeMock.showTextDocument.mockReset();
    vscodeMock.executeCommand.mockReset();
    vscodeMock.sendText.mockReset();
    vscodeMock.createTerminal.mockClear();
  });

  it('refreshes review detail and clears stale review-source routing when execution-board selection changes', async () => {
    const selectionStore = new VsCodeExtensionSelectionStore();
    selectionStore.rememberReviewSourcePath('/repo/review-stale.md');
    const reviewDetailProvider = {
      refresh: vi.fn(),
    };
    const controller = new VsCodeExtensionCommandController(
      {} as never,
      selectionStore,
      {
        localizeText: (english: string) => english,
      } as never,
      {
        executionBoardProvider: {
          refresh: vi.fn(),
        } as never,
        hitlInboxProvider: {
          refresh: vi.fn(),
        } as never,
        workspaceContextProvider: {
          refresh: vi.fn(),
        } as never,
        reviewDetailProvider: reviewDetailProvider as never,
      },
    );

    const request = {
      executionId: 'execution-1',
      executionSessionId: 'session-1',
      reviewSourcePath: undefined,
    };
    await controller.handleExecutionBoardSelection([
      {
        selectionRequest: request,
      },
    ] as never);

    expect(selectionStore.getSnapshot()).toEqual({
      ...request,
      queueEntry: undefined,
      temporaryBridge: undefined,
    });
    expect(reviewDetailProvider.refresh).toHaveBeenCalledWith(request);
  });

  it('clears stale execution selection when review-queue selection only carries review source metadata', async () => {
    const selectionStore = new VsCodeExtensionSelectionStore();
    selectionStore.rememberExecution('execution-stale', 'session-stale');
    selectionStore.rememberReviewSourcePath('/repo/review-stale.md');

    const workbenchOverviewProvider = {
      refresh: vi.fn(),
    };
    const reviewDetailProvider = {
      refresh: vi.fn(),
    };
    const controller = new VsCodeExtensionCommandController(
      {} as never,
      selectionStore,
      {
        localizeText: (english: string) => english,
      } as never,
      {
        taskBoardProvider: {
          refresh: vi.fn(),
        } as never,
        hitlInboxProvider: {
          refresh: vi.fn(),
        } as never,
        reviewQueueProvider: {
          refresh: vi.fn(),
        } as never,
        workbenchOverviewProvider: workbenchOverviewProvider as never,
        reviewDetailProvider: reviewDetailProvider as never,
      },
    );

    const request = {
      executionId: undefined,
      executionSessionId: undefined,
      reviewSourcePath: '/repo/review-queue.md',
    };
    await controller.handleReviewQueueSelection([
      {
        selectionRequest: request,
      },
    ] as never);

    expect(selectionStore.getSnapshot()).toEqual({
      executionId: undefined,
      executionSessionId: undefined,
      reviewSourcePath: '/repo/review-queue.md',
      queueEntry: undefined,
      temporaryBridge: undefined,
    });
    expect(workbenchOverviewProvider.refresh).toHaveBeenCalledTimes(1);
    expect(reviewDetailProvider.refresh).toHaveBeenCalledWith(request);
  });

  it('blocks trust-gated handoff commands when the workspace is not trusted', async () => {
    const controller = new VsCodeExtensionCommandController(
      {} as never,
      new VsCodeExtensionSelectionStore(),
      {
        localizeText: (english: string) => english,
      } as never,
      {
        executionBoardProvider: {
          refresh: vi.fn(),
        } as never,
        hitlInboxProvider: {
          refresh: vi.fn(),
        } as never,
        workspaceContextProvider: {
          refresh: vi.fn(),
        } as never,
        workbenchOverviewProvider: {
          refresh: vi.fn(),
        } as never,
        reviewDetailProvider: {
          refresh: vi.fn(),
        } as never,
      },
    );

    await controller.openHandoffTarget({
      handoffTarget: {
        targetId: 'execution-1:review-document',
        executionId: 'execution-1',
        targetKind: 'review_document',
        targetPath: '/repo/review.md',
        exists: true,
      },
    });

    expect(vscodeMock.showWarningMessage).toHaveBeenCalled();
    expect(vscodeMock.openTextDocument).not.toHaveBeenCalled();
  });

  it('falls back to reviewSourcePath handoff without reusing stale execution selection', async () => {
    vscodeMock.state.trusted = true;
    vscodeMock.openTextDocument.mockResolvedValue({
      uri: {
        fsPath: '/repo/review-only.md',
      },
    });
    vscodeMock.showTextDocument.mockResolvedValue(undefined);

    const selectionStore = new VsCodeExtensionSelectionStore();
    selectionStore.rememberExecution('execution-stale', 'session-stale');
    const resolveExecutionBoardEntry = vi.fn();
    const controller = new VsCodeExtensionCommandController(
      {
        resolveExecutionBoardEntry,
      } as never,
      selectionStore,
      {
        localizeText: (english: string) => english,
      } as never,
      {
        taskBoardProvider: {
          refresh: vi.fn(),
        } as never,
        hitlInboxProvider: {
          refresh: vi.fn(),
        } as never,
        reviewQueueProvider: {
          refresh: vi.fn(),
        } as never,
        workbenchOverviewProvider: {
          refresh: vi.fn(),
        } as never,
        reviewDetailProvider: {
          refresh: vi.fn(),
        } as never,
      },
    );

    await controller.openHandoffTarget({
      executionId: undefined,
      executionSessionId: undefined,
      reviewSourcePath: '/repo/review-only.md',
    });

    expect(resolveExecutionBoardEntry).not.toHaveBeenCalled();
    expect(vscodeMock.openTextDocument).toHaveBeenCalledWith({
      fsPath: '/repo/review-only.md',
    });
    expect(selectionStore.getSnapshot()).toEqual({
      executionId: undefined,
      executionSessionId: undefined,
      reviewSourcePath: '/repo/review-only.md',
      queueEntry: undefined,
      temporaryBridge: undefined,
    });
  });

  it('prefers queue-selected handoff targets before execution-board fallback for queue-only items', async () => {
    vscodeMock.state.trusted = true;
    vscodeMock.openTextDocument.mockResolvedValue({
      uri: {
        fsPath: '/repo/review-older.md',
      },
    });
    vscodeMock.showTextDocument.mockResolvedValue(undefined);

    const selectionStore = new VsCodeExtensionSelectionStore();
    const resolveExecutionBoardEntry = vi.fn();
    const controller = new VsCodeExtensionCommandController(
      {
        resolveExecutionBoardEntry,
      } as never,
      selectionStore,
      {
        localizeText: (english: string) => english,
      } as never,
      {
        taskBoardProvider: {
          refresh: vi.fn(),
        } as never,
        hitlInboxProvider: {
          refresh: vi.fn(),
        } as never,
        reviewQueueProvider: {
          refresh: vi.fn(),
        } as never,
        workbenchOverviewProvider: {
          refresh: vi.fn(),
        } as never,
        reviewDetailProvider: {
          refresh: vi.fn(),
        } as never,
      },
    );

    await controller.openHandoffTarget({
      executionId: 'execution-older',
      executionSessionId: undefined,
      queueEntry: {
        queueEntryId: 'automation:execution-older',
        queueKind: OrchestrationGovernanceQueueKind.AUTOMATION_INBOX,
        workspaceId: 'workspace-1',
        workspaceRoot: '/repo',
        executionId: 'execution-older',
        attentionLevel: OrchestrationGovernanceAttentionLevel.WARNING,
        notificationStatus: OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED,
        followUpSlaState: OrchestrationGovernanceFollowUpSlaState.OVERDUE,
        actions: [],
        handoffTargets: [
          {
            targetId: 'execution-older:review',
            executionId: 'execution-older',
            targetKind: OrchestrationHandoffTargetKind.REVIEW_DOCUMENT,
            targetPath: '/repo/review-older.md',
            exists: true,
          },
        ],
      },
    });

    expect(resolveExecutionBoardEntry).not.toHaveBeenCalled();
    expect(vscodeMock.openTextDocument).toHaveBeenCalledWith({
      fsPath: '/repo/review-older.md',
    });
    expect(selectionStore.getSnapshot()).toEqual({
      executionId: 'execution-older',
      executionSessionId: undefined,
      reviewSourcePath: undefined,
      queueEntry: expect.objectContaining({
        queueEntryId: 'automation:execution-older',
      }),
      temporaryBridge: undefined,
    });
  });

  it('clears stale reviewSourcePath when the refreshed detail has no routed review source', async () => {
    const selectionStore = new VsCodeExtensionSelectionStore();
    selectionStore.rememberExecution('execution-1', 'session-1');
    selectionStore.rememberReviewSourcePath('/repo/review-a.md');

    const reviewDetailProvider = new VsCodeExtensionReviewDetailProvider(
      {
        resolveReviewDetailSnapshot: vi.fn().mockResolvedValue({
          workspaceContext: {
            workspaceLabel: 'ai-governor',
            workspaceRoot: '/repo',
            workspaceTrusted: true,
          },
          selectedExecution: {
            execution: {
              executionId: 'execution-2',
              executionSessionId: 'session-2',
            },
          },
        }),
      } as never,
      selectionStore,
      {
        buildReviewDetailHtml: vi.fn().mockReturnValue('<html></html>'),
      } as never,
    );

    await reviewDetailProvider.resolveWebviewView({
      webview: {
        options: {},
        html: '',
      },
    } as never);

    expect(selectionStore.getSnapshot()).toEqual({
      executionId: 'execution-2',
      executionSessionId: 'session-2',
      reviewSourcePath: undefined,
      queueEntry: undefined,
      temporaryBridge: undefined,
    });
  });

  it('preserves queue-driven selection across repeated detail renders for older queue items', async () => {
    const selectionStore = new VsCodeExtensionSelectionStore();
    selectionStore.applyCommandRequest({
      executionId: 'execution-older',
      reviewSourcePath: undefined,
      queueEntry: {
        queueEntryId: 'automation:execution-older',
        queueKind: OrchestrationGovernanceQueueKind.AUTOMATION_INBOX,
        workspaceId: 'workspace-1',
        workspaceRoot: '/repo',
        executionId: 'execution-older',
        attentionLevel: OrchestrationGovernanceAttentionLevel.WARNING,
        notificationStatus: OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED,
        followUpSlaState: OrchestrationGovernanceFollowUpSlaState.OVERDUE,
        actions: [
          {
            actionId: 'execution-older:recover',
            actionKind: OrchestrationGovernanceActionKind.RECOVER_EXECUTION,
            executionId: 'execution-older',
            enabled: true,
            requiresConfirmation: false,
          },
        ],
        handoffTargets: [
          {
            targetId: 'execution-older:review',
            executionId: 'execution-older',
            targetKind: OrchestrationHandoffTargetKind.REVIEW_DOCUMENT,
            targetPath: '/repo/review-older.md',
            exists: true,
          },
        ],
      },
    });
    const resolveReviewDetailSnapshot = vi.fn().mockResolvedValue({
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
      },
      selectedExecution: {
        execution: {
          executionId: 'execution-older',
          executionSessionId: 'session-older',
        },
        actions: [
          {
            actionId: 'execution-older:recover',
          },
        ],
        handoffTargets: [
          {
            targetId: 'execution-older:review',
          },
        ],
      },
    });
    const reviewDetailProvider = new VsCodeExtensionReviewDetailProvider(
      {
        resolveReviewDetailSnapshot,
      } as never,
      selectionStore,
      {
        buildReviewDetailHtml: vi.fn().mockReturnValue('<html></html>'),
      } as never,
    );

    await reviewDetailProvider.resolveWebviewView({
      webview: {
        options: {},
        html: '',
      },
    } as never);
    await reviewDetailProvider.refresh();

    expect(resolveReviewDetailSnapshot).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        executionId: 'execution-older',
        executionSessionId: 'session-older',
        queueEntry: expect.objectContaining({
          queueEntryId: 'automation:execution-older',
        }),
      }),
    );
    expect(selectionStore.getSnapshot().queueEntry?.queueEntryId).toBe(
      'automation:execution-older',
    );
  });

  it('opens review detail from a review-only queue request without restoring stale execution state', async () => {
    const selectionStore = new VsCodeExtensionSelectionStore();
    const resolveReviewDetailSnapshot = vi
      .fn()
      .mockResolvedValueOnce({
        workspaceContext: {
          workspaceLabel: 'ai-governor',
          workspaceRoot: '/repo',
          workspaceTrusted: true,
        },
      })
      .mockResolvedValueOnce({
        workspaceContext: {
          workspaceLabel: 'ai-governor',
          workspaceRoot: '/repo',
          workspaceTrusted: true,
        },
        requestedReviewSourcePath: '/repo/review-only.md',
      });
    const buildReviewDetailHtml = vi.fn().mockReturnValue('<html></html>');
    const show = vi.fn();
    const reviewDetailProvider = new VsCodeExtensionReviewDetailProvider(
      {
        resolveReviewDetailSnapshot,
      } as never,
      selectionStore,
      {
        buildReviewDetailHtml,
      } as never,
    );

    await reviewDetailProvider.resolveWebviewView({
      webview: {
        options: {},
        html: '',
      },
      show,
    } as never);

    selectionStore.rememberExecution('execution-stale', 'session-stale');
    selectionStore.rememberReviewSourcePath('/repo/review-stale.md');

    const controller = new VsCodeExtensionCommandController(
      {} as never,
      selectionStore,
      {
        localizeText: (english: string) => english,
      } as never,
      {
        hitlInboxProvider: {
          refresh: vi.fn(),
        } as never,
        reviewDetailProvider,
      },
    );

    await controller.openReviewDetail({
      executionId: undefined,
      executionSessionId: undefined,
      reviewSourcePath: '/repo/review-only.md',
    });

    expect(resolveReviewDetailSnapshot).toHaveBeenLastCalledWith({
      executionId: undefined,
      executionSessionId: undefined,
      reviewSourcePath: '/repo/review-only.md',
    });
    expect(selectionStore.getSnapshot()).toEqual({
      executionId: undefined,
      executionSessionId: undefined,
      reviewSourcePath: '/repo/review-only.md',
      queueEntry: undefined,
      temporaryBridge: undefined,
    });
    expect(show).toHaveBeenCalledWith(false);
    expect(buildReviewDetailHtml).toHaveBeenCalledTimes(2);
  });

  it('stages a temporary bridge command in a trusted terminal without executing it', async () => {
    vscodeMock.state.trusted = true;

    const selectionStore = new VsCodeExtensionSelectionStore();
    const controller = new VsCodeExtensionCommandController(
      {} as never,
      selectionStore,
      {
        localizeText: (english: string) => english,
      } as never,
      {
        hitlInboxProvider: {
          refresh: vi.fn(),
        } as never,
        reviewDetailProvider: {
          refresh: vi.fn(),
        } as never,
      },
    );

    await controller.stageTemporaryBridge({
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

    expect(vscodeMock.createTerminal).toHaveBeenCalledWith({
      name: 'Governor Bridge',
      cwd: '/repo',
    });
    expect(vscodeMock.sendText).toHaveBeenCalledWith(
      'repo-ai-governor host verify --output-dir /repo/.repo-ai-governor/generated/hosts/github-copilot',
      false,
    );
    expect(vscodeMock.showInformationMessage).toHaveBeenCalled();
    expect(selectionStore.getSnapshot().temporaryBridge?.bridgeId).toBe(
      'temporary-bridge-host-verify',
    );
  });

  it('stages the selected temporary bridge from workbench-overview selection when the palette command has no args', async () => {
    vscodeMock.state.trusted = true;

    const selectionStore = new VsCodeExtensionSelectionStore();
    const controller = new VsCodeExtensionCommandController(
      {} as never,
      selectionStore,
      {
        localizeText: (english: string) => english,
      } as never,
      {
        hitlInboxProvider: {
          refresh: vi.fn(),
        } as never,
        reviewDetailProvider: {
          refresh: vi.fn(),
        } as never,
      },
    );

    controller.handleWorkbenchOverviewSelection([
      {
        selectionRequest: {
          temporaryBridge: {
            bridgeId: 'temporary-bridge-host-pack',
            capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_PACK,
            workspaceRoot: '/repo/.repo-ai-governor',
            commandWorkingDirectory: '/repo',
            previewCommandLine:
              'repo-ai-governor host pack --host claude-code --mode plugin-bundle --bundle-dir /repo/.repo-ai-governor/generated/bundles/claude',
            receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_PACK_RECEIPT,
            backlinkSurface:
              OrchestrationGovernanceTemporaryBridgeBacklinkSurface.ARTIFACT_WORKBENCH,
            exitCriteria: [
              OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_HOST_QUERY,
            ],
          },
        },
      },
    ] as never);

    await controller.stageTemporaryBridge();

    expect(vscodeMock.createTerminal).toHaveBeenCalledWith({
      name: 'Governor Bridge',
      cwd: '/repo',
    });
    expect(vscodeMock.sendText).toHaveBeenCalledWith(
      'repo-ai-governor host pack --host claude-code --mode plugin-bundle --bundle-dir /repo/.repo-ai-governor/generated/bundles/claude',
      false,
    );
  });
});
