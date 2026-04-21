import { vi } from 'vitest';

const vscodeChatParticipantMock = vi.hoisted(() => {
  const createChatParticipant = vi.fn((_participantId: string, handler: unknown) => ({
    dispose: vi.fn(),
    handler,
  }));
  const file = vi.fn((fsPath: string) => ({
    fsPath,
  }));

  return {
    createChatParticipant,
    file,
  };
});

vi.mock('vscode', () => ({
  chat: {
    createChatParticipant: vscodeChatParticipantMock.createChatParticipant,
  },
  Uri: {
    file: vscodeChatParticipantMock.file,
  },
}));

import { VsCodeExtensionChatParticipantRuntime } from '../src/runtime/vscode-extension-chat-participant.js';

describe('VsCodeExtensionChatParticipantRuntime', () => {
  beforeEach(() => {
    vscodeChatParticipantMock.createChatParticipant.mockClear();
    vscodeChatParticipantMock.file.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
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
        latestWorkspaceOperation: {
          operationKind: 'doctor',
          completedAt: '2026-04-21T10:00:00.000Z',
          locale: 'zh-CN',
          message: 'Doctor completed.',
          result: {
            operation: 'env_doctor',
            summary: 'Doctor completed with attach_mode=read_write.',
            checkTotals: {
              pass: 9,
              warn: 8,
              fail: 1,
            },
            checks: [
              {
                id: 'memory_provider',
                status: 'fail',
                detail: 'Memory provider is unavailable.',
              },
              {
                id: 'reviewer_route',
                status: 'warn',
                detail: 'Reviewer uses degraded structured_output routing.',
              },
            ],
            interactionPrompts: [
              {
                title: 'Adapter 路由需要关注',
                action:
                  '当前使用降级或 fallback 路由，建议在无人值守执行前复核成本/时延/风险优先级。',
                blocking: false,
              },
            ],
            layeredLogs: {
              summary: ['attach_mode=read_write', 'adapter_probe=true'],
              detailed: [],
            },
            artifacts: [
              {
                id: 'doctor_diagnostics',
                path: '/repo/.repo-ai-governor/context/diagnostics/doctor/doctor-1.json',
              },
            ],
          },
        },
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
      executeChatRequest: vi.fn(
        async (
          _commandName: string | undefined,
          _promptText: string | undefined,
          hooks?: {
            onDidStart?: (event: {
              commandName: string;
              inferredFromPrompt: boolean;
              allowPendingRunningSummary: boolean;
            }) => void;
          },
        ) => {
          hooks?.onDidStart?.({
            commandName: 'doctor',
            inferredFromPrompt: false,
            allowPendingRunningSummary: true,
          });
          return {
            commandName: 'doctor',
            status: 'completed',
            summary: 'Doctor command finished.',
            detail: 'Refreshed workbench snapshot.',
          };
        },
      ),
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

    expect(commandController.executeChatRequest).toHaveBeenCalledWith(
      'doctor',
      '',
      expect.any(Object),
    );
    expect(response.progress).toHaveBeenCalledWith(
      'Executed /doctor. Refreshing the Governor snapshot…',
    );
    expect(response.markdown).toHaveBeenCalledWith(expect.stringContaining('`/doctor`'));
    expect(response.markdown).toHaveBeenCalledWith(
      expect.stringContaining('Doctor command finished.'),
    );
    expect(response.markdown).toHaveBeenCalledWith(expect.stringContaining('## Result details'));
    expect(response.markdown).toHaveBeenCalledWith(
      expect.stringContaining('9 pass / 8 warn / 1 fail'),
    );
    expect(response.markdown).toHaveBeenCalledWith(
      expect.stringContaining('Memory provider is unavailable.'),
    );
    expect(response.markdown).toHaveBeenCalledWith(expect.stringContaining('doctor_diagnostics'));
    expect(response.markdown).toHaveBeenCalledWith(expect.stringContaining('status-body'));
    expect(response.button).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'repoAiGovernor.setManagedSecret',
        title: 'Update API Key',
      }),
    );
    expect(response.button).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'vscode.open',
        title: 'Open diagnostics file',
        arguments: [
          {
            fsPath: '/repo/.repo-ai-governor/context/diagnostics/doctor/doctor-1.json',
          },
        ],
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
      executeChatRequest: vi.fn(
        async (
          _commandName: string | undefined,
          _promptText: string | undefined,
          hooks?: {
            onDidStart?: (event: {
              commandName: string;
              inferredFromPrompt: boolean;
              allowPendingRunningSummary: boolean;
            }) => void;
          },
        ) => {
          hooks?.onDidStart?.({
            commandName: 'doctor',
            inferredFromPrompt: true,
            allowPendingRunningSummary: true,
          });
          return {
            commandName: 'doctor',
            status: 'completed',
            summary: 'Doctor command finished.',
          };
        },
      ),
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
      expect.any(Object),
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
      expect.any(Object),
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

  it('emits progress before one long-running inferred command finishes', async () => {
    let resolveExecution: (() => void) | undefined;
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
      executeChatRequest: vi.fn(
        async (
          _commandName: string | undefined,
          _promptText: string | undefined,
          hooks?: {
            onDidStart?: (event: {
              commandName: string;
              inferredFromPrompt: boolean;
              allowPendingRunningSummary: boolean;
            }) => void;
          },
        ) => {
          hooks?.onDidStart?.({
            commandName: 'doctor',
            inferredFromPrompt: true,
            allowPendingRunningSummary: true,
          });
          await new Promise<void>((resolve) => {
            resolveExecution = resolve;
          });
          return {
            commandName: 'doctor',
            status: 'completed',
            summary: 'Doctor command finished.',
          };
        },
      ),
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

    const pendingResult = participant.handler(
      {
        prompt: '帮我诊断一下当前项目',
      },
      {},
      response,
    );

    await Promise.resolve();

    expect(response.progress).toHaveBeenCalledWith(
      'Interpreted your request as /doctor. Refreshing the Governor snapshot…',
    );
    expect(response.markdown).not.toHaveBeenCalled();

    resolveExecution?.();
    await pendingResult;
  });

  it('returns one human-readable running summary when one chat command exceeds the wait budget', async () => {
    vi.useFakeTimers();

    const serviceRuntime = {
      executeMainSessionTurn: vi.fn(),
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
      executeChatRequest: vi.fn(
        async (
          _commandName: string | undefined,
          _promptText: string | undefined,
          hooks?: {
            onDidStart?: (event: {
              commandName: string;
              inferredFromPrompt: boolean;
              allowPendingRunningSummary: boolean;
            }) => void;
          },
        ) => {
          hooks?.onDidStart?.({
            commandName: 'doctor',
            inferredFromPrompt: true,
            allowPendingRunningSummary: true,
          });
          return new Promise(() => undefined);
        },
      ),
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

    const pendingResult = participant.handler(
      {
        prompt: '帮我诊断一下当前项目',
      },
      {},
      response,
    );

    await vi.advanceTimersByTimeAsync(4000);

    expect(response.progress).toHaveBeenCalledWith(
      'Interpreted your request as /doctor. Refreshing the Governor snapshot…',
    );
    expect(response.markdown).toHaveBeenCalledWith(
      expect.stringContaining('/doctor is still running.'),
    );
    expect(response.button).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'repoAiGovernor.refresh',
      }),
    );
    await expect(pendingResult).resolves.toMatchObject({
      metadata: {
        executedChatCommand: 'doctor',
        commandStatus: 'dispatched',
        commandPending: true,
      },
    });
    expect(serviceRuntime.executeMainSessionTurn).not.toHaveBeenCalled();
  });

  it('keeps waiting for prompt-driven commands instead of showing the running summary fallback', async () => {
    vi.useFakeTimers();

    let resolveExecution: (() => void) | undefined;
    const serviceRuntime = {
      executeMainSessionTurn: vi.fn(),
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
      executeChatRequest: vi.fn(
        async (
          _commandName: string | undefined,
          _promptText: string | undefined,
          hooks?: {
            onDidStart?: (event: {
              commandName: string;
              inferredFromPrompt: boolean;
              allowPendingRunningSummary: boolean;
            }) => void;
          },
        ) => {
          hooks?.onDidStart?.({
            commandName: 'set-managed-secret',
            inferredFromPrompt: false,
            allowPendingRunningSummary: false,
          });
          await new Promise<void>((resolve) => {
            resolveExecution = resolve;
          });
          return {
            commandName: 'set-managed-secret',
            status: 'dispatched',
            summary: 'Managed-secret authoring flow started from chat.',
          };
        },
      ),
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

    const pendingResult = participant.handler(
      {
        command: 'set-managed-secret',
        prompt: '',
      },
      {},
      response,
    );

    await vi.advanceTimersByTimeAsync(4000);
    await Promise.resolve();

    expect(response.progress).toHaveBeenCalledWith(
      'Executed /set-managed-secret. Refreshing the Governor snapshot…',
    );
    expect(response.markdown).not.toHaveBeenCalledWith(
      expect.stringContaining('is still running.'),
    );
    expect(response.button).not.toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'repoAiGovernor.refresh',
      }),
    );

    resolveExecution?.();
    await expect(pendingResult).resolves.toMatchObject({
      metadata: {
        executedChatCommand: 'set-managed-secret',
        commandStatus: 'dispatched',
      },
    });
  });
});
