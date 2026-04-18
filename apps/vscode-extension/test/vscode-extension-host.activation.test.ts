import { vi } from 'vitest';

const vscodeActivationMock = vi.hoisted(() => {
  const registerCommand = vi.fn((_commandId: string, _handler: unknown) => ({
    dispose: vi.fn(),
  }));
  const registerWebviewViewProvider = vi.fn((_viewId: string, _provider: unknown) => ({
    dispose: vi.fn(),
  }));
  const registerCodeActionsProvider = vi.fn((_selector: unknown, _provider: unknown) => ({
    dispose: vi.fn(),
  }));
  const executeCommand = vi.fn(async () => undefined);
  const createTreeView = vi.fn((_viewId: string, _options: unknown) => ({
    dispose: vi.fn(),
    onDidChangeSelection: vi.fn(() => ({
      dispose: vi.fn(),
    })),
  }));
  const createChatParticipant = vi.fn((_participantId: string, _handler: unknown) => ({
    iconPath: undefined as unknown,
    dispose: vi.fn(),
  }));
  const joinPath = vi.fn((...segments: unknown[]) => ({
    segments,
  }));
  let chatApiEnabled = false;

  class EventEmitter<T> {
    public readonly event = vi.fn();

    public fire(_value: T): void {}

    public dispose(): void {}
  }

  return {
    registerCommand,
    registerWebviewViewProvider,
    registerCodeActionsProvider,
    executeCommand,
    createTreeView,
    createChatParticipant,
    joinPath,
    enableChatApi(): void {
      chatApiEnabled = true;
    },
    disableChatApi(): void {
      chatApiEnabled = false;
    },
    getChatApi(): { createChatParticipant: typeof createChatParticipant } | undefined {
      return chatApiEnabled
        ? {
            createChatParticipant,
          }
        : undefined;
    },
    EventEmitter,
  };
});

vi.mock(
  'vscode',
  () => ({
    workspace: {
      isTrusted: true,
      workspaceFolders: [
        {
          name: 'ai-governor',
          uri: {
            fsPath: '/repo',
          },
        },
      ],
      onDidGrantWorkspaceTrust: vi.fn(() => ({
        dispose: vi.fn(),
      })),
      onDidChangeWorkspaceFolders: vi.fn(() => ({
        dispose: vi.fn(),
      })),
    },
    window: {
      createTreeView: vscodeActivationMock.createTreeView,
      registerWebviewViewProvider: vscodeActivationMock.registerWebviewViewProvider,
      onDidChangeActiveTextEditor: vi.fn(() => ({
        dispose: vi.fn(),
      })),
    },
    languages: {
      registerCodeActionsProvider: vscodeActivationMock.registerCodeActionsProvider,
    },
    commands: {
      registerCommand: vscodeActivationMock.registerCommand,
      executeCommand: vscodeActivationMock.executeCommand,
    },
    get chat() {
      return vscodeActivationMock.getChatApi();
    },
    CodeActionKind: {
      QuickFix: {},
    },
    EventEmitter: vscodeActivationMock.EventEmitter,
    ThemeIcon: class ThemeIcon {},
    Uri: {
      joinPath: vscodeActivationMock.joinPath,
      file: vi.fn((fsPath: string) => ({
        fsPath,
      })),
    },
    env: {
      language: 'en',
    },
  }),
  { virtual: true },
);

import { VsCodeExtensionHost } from '../src/runtime/vscode-extension-host.js';

describe('VsCodeExtensionHost activation', () => {
  beforeEach(() => {
    vscodeActivationMock.registerCommand.mockClear();
    vscodeActivationMock.registerWebviewViewProvider.mockClear();
    vscodeActivationMock.registerCodeActionsProvider.mockClear();
    vscodeActivationMock.executeCommand.mockClear();
    vscodeActivationMock.createTreeView.mockClear();
    vscodeActivationMock.createChatParticipant.mockClear();
    vscodeActivationMock.joinPath.mockClear();
    vscodeActivationMock.disableChatApi();
  });

  it('registers core workbench commands even when the chat API is unavailable', async () => {
    const host = new VsCodeExtensionHost();
    const context = {
      extensionUri: {
        fsPath: '/extension',
      },
      subscriptions: [],
    };

    await expect(host.activate(context as never)).resolves.toBeUndefined();

    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.refresh',
      expect.any(Function),
    );
    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.runWorkspaceBootstrap',
      expect.any(Function),
    );
    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.runDoctor',
      expect.any(Function),
    );
    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.runCheck',
      expect.any(Function),
    );
    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.runWorkflowPreview',
      expect.any(Function),
    );
    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.runWorkflowCreate',
      expect.any(Function),
    );
    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.runWorkflowEdit',
      expect.any(Function),
    );
    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.openReviewDetail',
      expect.any(Function),
    );
    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.openUserConfig',
      expect.any(Function),
    );
    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.configureUserDefault',
      expect.any(Function),
    );
    expect(vscodeActivationMock.registerCommand).toHaveBeenCalledWith(
      'repoAiGovernor.setManagedSecret',
      expect.any(Function),
    );
    expect(vscodeActivationMock.createTreeView).toHaveBeenCalled();
    expect(vscodeActivationMock.registerWebviewViewProvider).toHaveBeenCalled();
  });

  it('registers the chat participant when the chat API is available', async () => {
    vscodeActivationMock.enableChatApi();

    const host = new VsCodeExtensionHost();
    const context = {
      extensionUri: {
        fsPath: '/extension',
      },
      subscriptions: [],
    };

    await expect(host.activate(context as never)).resolves.toBeUndefined();

    expect(vscodeActivationMock.createChatParticipant).toHaveBeenCalledWith(
      'repo-ai-governor.governor',
      expect.any(Function),
    );
    expect(vscodeActivationMock.joinPath).toHaveBeenCalledWith(
      context.extensionUri,
      'resources',
      'governor.svg',
    );

    const chatParticipant = vscodeActivationMock.createChatParticipant.mock.results[0]?.value;
    expect(chatParticipant).toBeDefined();
    expect(chatParticipant.iconPath).toEqual(vscodeActivationMock.joinPath.mock.results[0]?.value);
    expect(context.subscriptions).toContain(chatParticipant);
  });
});
