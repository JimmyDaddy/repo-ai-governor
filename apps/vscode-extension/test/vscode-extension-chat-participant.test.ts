import { vi } from 'vitest';

const vscodeChatParticipantMock = vi.hoisted(() => {
  const createChatParticipant = vi.fn((_participantId: string, handler: unknown) => ({
    dispose: vi.fn(),
    handler,
  }));

  return {
    createChatParticipant,
  };
});

vi.mock('vscode', () => ({
  chat: {
    createChatParticipant: vscodeChatParticipantMock.createChatParticipant,
  },
}));

import { VsCodeExtensionChatParticipantRuntime } from '../src/runtime/vscode-extension-chat-participant.js';

describe('VsCodeExtensionChatParticipantRuntime', () => {
  beforeEach(() => {
    vscodeChatParticipantMock.createChatParticipant.mockClear();
  });

  it('dispatches executable slash commands through the command controller and returns refreshed status', async () => {
    const serviceRuntime = {
      resolveWorkspaceContextSnapshot: vi.fn(async () => ({})),
      queryExecutionBoard: vi.fn(async () => ({
        executions: [],
      })),
      queryHitlInbox: vi.fn(async () => ({
        pendingDecisions: [],
      })),
      queryQueueOverview: vi.fn(async () => ({
        reviewQueue: [],
        automationInbox: [],
      })),
      resolveProviderLifecycleSnapshots: vi.fn(async () => [
        {
          tool: 'codex',
          availableActions: ['update_api_key'],
        },
      ]),
      resolveReviewDetailSnapshot: vi.fn(),
    };
    const selectionStore = {
      getSnapshot: vi.fn(() => ({})),
      rememberExecution: vi.fn(),
      rememberReviewSourcePath: vi.fn(),
    };
    const commandController = {
      executeChatRequest: vi.fn(async () => ({
        commandName: 'doctor',
        status: 'completed',
        summary: 'Doctor command finished.',
        detail: 'Refreshed workbench snapshot.',
      })),
    };
    const presentationBuilder = {
      buildChatResponseMarkdown: vi.fn(() => 'status-body'),
      buildProviderLifecycleChatButtons: vi.fn(() => [
        {
          command: 'repoAiGovernor.setManagedSecret',
          title: 'Update API Key',
          arguments: [
            {
              secretKeyName: 'openai/api-key',
            },
          ],
        },
      ]),
    };
    const localizer = {
      localizeText: vi.fn((englishText: string) => englishText),
    };

    const runtime = new VsCodeExtensionChatParticipantRuntime(
      serviceRuntime as never,
      selectionStore as never,
      commandController as never,
      presentationBuilder as never,
      localizer as never,
    );
    const participant = runtime.createParticipant('repo-ai-governor.governor') as unknown as {
      handler: (
        request: {
          command?: string;
          prompt?: string;
        },
        context: unknown,
        response: {
          progress: (value: string) => void;
          markdown: (value: string) => void;
          button: (value: unknown) => void;
        },
      ) => Promise<{ metadata: Record<string, unknown> }>;
    };
    const response = {
      progress: vi.fn(),
      markdown: vi.fn(),
      button: vi.fn(),
    };

    const result = await participant.handler(
      {
        command: 'doctor',
        prompt: '',
      },
      {},
      response,
    );

    expect(commandController.executeChatRequest).toHaveBeenCalledWith('doctor', '');
    expect(response.markdown).toHaveBeenCalledWith(expect.stringContaining('`/doctor`'));
    expect(response.markdown).toHaveBeenCalledWith(
      expect.stringContaining('Doctor command finished.'),
    );
    expect(response.markdown).toHaveBeenCalledWith(expect.stringContaining('status-body'));
    expect(response.button).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'repoAiGovernor.setManagedSecret',
        title: 'Update API Key',
      }),
    );
    expect(result.metadata).toMatchObject({
      executedChatCommand: 'doctor',
      commandStatus: 'completed',
      executionCount: 0,
      pendingHitlCount: 0,
      reviewQueueCount: 0,
    });
  });

  it('renders inferred command execution when the prompt resolves to one executable action', async () => {
    const serviceRuntime = {
      resolveWorkspaceContextSnapshot: vi.fn(async () => ({})),
      queryExecutionBoard: vi.fn(async () => ({
        executions: [],
      })),
      queryHitlInbox: vi.fn(async () => ({
        pendingDecisions: [],
      })),
      queryQueueOverview: vi.fn(async () => ({
        reviewQueue: [],
        automationInbox: [],
      })),
      resolveProviderLifecycleSnapshots: vi.fn(async () => []),
      resolveReviewDetailSnapshot: vi.fn(),
    };
    const selectionStore = {
      getSnapshot: vi.fn(() => ({})),
      rememberExecution: vi.fn(),
      rememberReviewSourcePath: vi.fn(),
    };
    const commandController = {
      executeChatRequest: vi.fn(async () => ({
        commandName: 'doctor',
        status: 'completed',
        summary: 'Doctor command finished.',
      })),
    };
    const presentationBuilder = {
      buildChatResponseMarkdown: vi.fn(() => 'status-body'),
      buildProviderLifecycleChatButtons: vi.fn(() => []),
    };
    const localizer = {
      localizeText: vi.fn((englishText: string) => englishText),
    };

    const runtime = new VsCodeExtensionChatParticipantRuntime(
      serviceRuntime as never,
      selectionStore as never,
      commandController as never,
      presentationBuilder as never,
      localizer as never,
    );
    const participant = runtime.createParticipant('repo-ai-governor.governor') as unknown as {
      handler: (
        request: {
          command?: string;
          prompt?: string;
        },
        context: unknown,
        response: {
          progress: (value: string) => void;
          markdown: (value: string) => void;
          button: (value: unknown) => void;
        },
      ) => Promise<{ metadata: Record<string, unknown> }>;
    };
    const response = {
      progress: vi.fn(),
      markdown: vi.fn(),
      button: vi.fn(),
    };

    const result = await participant.handler(
      {
        prompt: 'please run doctor',
      },
      {},
      response,
    );

    expect(commandController.executeChatRequest).toHaveBeenCalledWith(
      undefined,
      'please run doctor',
    );
    expect(response.progress).toHaveBeenCalledWith(
      'Interpreted your request as /doctor. Refreshing the Governor snapshot…',
    );
    expect(response.markdown).toHaveBeenCalledWith(expect.stringContaining('Resolved command'));
    expect(presentationBuilder.buildChatResponseMarkdown).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'doctor',
      }),
    );
    expect(result.metadata).toMatchObject({
      executedChatCommand: 'doctor',
      commandStatus: 'completed',
    });
  });

  it('routes unresolved prompts through the main Governor session and exposes the suggested connect action', async () => {
    const serviceRuntime = {
      executeMainSessionTurn: vi.fn(async () => ({
        sessionId: 'session-main',
        turnId: 'turn-1',
        assistantMessage: '/connect',
        responseMode: 'command_handoff_preview',
        suggestedSlashCommand: '/connect',
        handoffCommandPreview:
          'repo-ai-governor connect --preset multi-tool-default --output pretty',
        commandBatches: [
          {
            slashQuery: '/connect',
            previewCommandLine:
              'repo-ai-governor connect --preset multi-tool-default --output pretty',
          },
        ],
        handoffBacklinks: [
          {
            kind: 'slash_command',
            label: 'slash:/connect',
            target: '/connect',
          },
        ],
      })),
    };
    const selectionStore = {
      getSnapshot: vi.fn(() => ({})),
      rememberExecution: vi.fn(),
      rememberReviewSourcePath: vi.fn(),
    };
    const commandController = {
      executeChatRequest: vi.fn(async () => undefined),
    };
    const presentationBuilder = {
      buildChatResponseMarkdown: vi.fn(),
    };
    const localizer = {
      localizeText: vi.fn((englishText: string) => englishText),
    };

    const runtime = new VsCodeExtensionChatParticipantRuntime(
      serviceRuntime as never,
      selectionStore as never,
      commandController as never,
      presentationBuilder as never,
      localizer as never,
    );
    const participant = runtime.createParticipant('repo-ai-governor.governor') as unknown as {
      handler: (
        request: {
          command?: string;
          prompt?: string;
        },
        context: unknown,
        response: {
          progress: (value: string) => void;
          markdown: (value: string) => void;
          button: (value: unknown) => void;
        },
      ) => Promise<{ metadata: Record<string, unknown> }>;
    };
    const response = {
      progress: vi.fn(),
      markdown: vi.fn(),
      button: vi.fn(),
    };

    const result = await participant.handler(
      {
        prompt: 'connect openai for this repo',
      },
      {},
      response,
    );

    expect(commandController.executeChatRequest).toHaveBeenCalledWith(
      undefined,
      'connect openai for this repo',
    );
    expect(serviceRuntime.executeMainSessionTurn).toHaveBeenCalledWith(
      'connect openai for this repo',
    );
    expect(response.markdown).toHaveBeenCalledWith(
      expect.stringContaining('Suggested slash command'),
    );
    expect(response.markdown).toHaveBeenCalledWith(expect.stringContaining('`/connect`'));
    expect(response.button).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'repoAiGovernor.runConnect',
      }),
    );
    expect(result.metadata).toMatchObject({
      sessionId: 'session-main',
      turnId: 'turn-1',
      responseMode: 'command_handoff_preview',
      suggestedSlashCommand: '/connect',
    });
  });
});
