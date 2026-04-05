import { vi } from 'vitest';

const vscodeMock = vi.hoisted(() => {
  const showInformationMessage = vi.fn();
  const showWarningMessage = vi.fn();
  const showErrorMessage = vi.fn();
  const openTextDocument = vi.fn();
  const showTextDocument = vi.fn();
  const executeCommand = vi.fn();
  const createTerminal = vi.fn(() => ({
    show: vi.fn(),
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
    vscodeMock.createTerminal.mockClear();
  });

  it('refreshes review detail when execution-board selection changes', async () => {
    const selectionStore = new VsCodeExtensionSelectionStore();
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
    };
    await controller.handleExecutionBoardSelection([
      {
        selectionRequest: request,
      },
    ] as never);

    expect(selectionStore.getSnapshot()).toEqual(request);
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
    });
  });
});
