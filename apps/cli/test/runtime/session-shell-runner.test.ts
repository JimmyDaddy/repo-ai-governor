import {
  type OrchestrationAppendSessionMessageResponse,
  type OrchestrationListSessionsRequest,
  type OrchestrationListSessionsResponse,
  type OrchestrationResumeSessionResponse,
  type OrchestrationSessionEvent,
  OrchestrationSessionEventType,
  OrchestrationSessionRouteId,
  OrchestrationSessionStatus,
  type OrchestrationSessionSummary,
  OrchestrationSessionTranscriptRole,
  type OrchestrationStartSessionResponse,
  type OrchestrationSubscribeSessionRequest,
  type OrchestrationSubscribeSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import { CliSessionShellExitReason } from '../../src/constants/cli-session-shell.constant.js';
import { CliSessionShellRunner } from '../../src/runtime/interactive-shell/session-shell-runner.js';
import type {
  CliSessionShellCommandExecutionResult,
  CliSessionShellPromptAdapter,
  CliSessionShellRunOptions,
  CliSessionShellViewModel,
} from '../../src/types/index.js';

class RecordingSessionShellRenderer {
  public readonly frames: CliSessionShellViewModel[] = [];

  /**
   * Records one rendered frame for runner assertions.
   * @param viewModel Session-shell frame snapshot.
   * @returns Nothing.
   */
  public render(viewModel: CliSessionShellViewModel): void {
    this.frames.push({
      ...viewModel,
      transcriptItems: viewModel.transcriptItems.map((item) => ({
        ...item,
        lines: [...item.lines],
      })),
      slashSuggestions: viewModel.slashSuggestions.map((suggestion) => ({
        ...suggestion,
        highlightSegments: suggestion.highlightSegments.map((segment) => ({ ...segment })),
      })),
      promptBarLines: [...viewModel.promptBarLines],
    });
  }
}

class StubSessionShellPromptAdapter implements CliSessionShellPromptAdapter {
  private cursor = 0;
  private multilineCursor = 0;

  public constructor(
    private readonly answers: Array<string | null | RuntimeError>,
    private readonly multilineAnswers: Array<string | null> = [],
  ) {}

  public async readLine(): Promise<string | null> {
    const answer = this.answers[this.cursor];
    this.cursor += 1;

    if (answer instanceof RuntimeError) {
      throw answer;
    }

    return answer ?? null;
  }

  public async readMultiline(): Promise<string | null> {
    const answer = this.multilineAnswers[this.multilineCursor] ?? null;
    this.multilineCursor += 1;
    return answer;
  }

  public close(): void {
    return;
  }
}

class FakeSessionShellServiceClient {
  private readonly sessions = new Map<
    string,
    { summary: OrchestrationSessionSummary; events: OrchestrationSessionEvent[] }
  >();
  private sessionSequence = 0;

  public constructor(seedSessionId = 'session-shell-001') {
    this.createSession(seedSessionId);
  }

  public async startSession(): Promise<OrchestrationStartSessionResponse> {
    this.sessionSequence += 1;
    const sessionId = `session-shell-${String(this.sessionSequence).padStart(3, '0')}`;
    return this.createSession(sessionId);
  }

  public async resumeSession(sessionId?: string): Promise<OrchestrationResumeSessionResponse> {
    const resolvedSessionId =
      sessionId ?? Array.from(this.sessions.keys()).at(-1) ?? 'session-shell-001';
    const session = this.sessions.get(resolvedSessionId);
    if (!session) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        'No resumable orchestration session was found.',
      );
    }

    const event = this.appendEvent(session.summary.sessionId, {
      type: OrchestrationSessionEventType.SESSION_RESUMED,
      payload: {
        role: OrchestrationSessionTranscriptRole.SYSTEM,
        routeId: OrchestrationSessionRouteId.MAIN,
        resumeSelector: sessionId ?? 'latest',
      },
    });
    session.summary = this.rebuildSummary(session.summary.sessionId);
    return {
      session: session.summary,
      resumeSelector: sessionId ?? 'latest',
      latestEventSequence: event.sequence,
      nextCursor: event.streamCursor,
    };
  }

  public async sendMainTurn(sessionId: string, userMessage: string): Promise<void> {
    const session = this.requireSession(sessionId);
    const turnIndex =
      session.events.filter((event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED)
        .length + 1;
    this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.TURN_SUBMITTED,
      payload: {
        role: OrchestrationSessionTranscriptRole.USER,
        routeId: OrchestrationSessionRouteId.MAIN,
        content: userMessage,
      },
    });
    this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
      payload: {
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        delta: `turn:${turnIndex}:ack`,
      },
    });
    this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.TURN_COMPLETED,
      payload: {
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        turnIndex,
        latestUserMessage: userMessage,
      },
    });
    session.summary = this.rebuildSummary(sessionId);
  }

  public async appendMessage(
    sessionId: string,
    role: OrchestrationSessionTranscriptRole,
    lines: string[],
  ): Promise<OrchestrationAppendSessionMessageResponse> {
    const session = this.requireSession(sessionId);
    const event = this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED,
      payload: {
        role,
        routeId: OrchestrationSessionRouteId.MAIN,
        lines,
      },
    });
    session.summary = this.rebuildSummary(sessionId);
    return {
      session: session.summary,
      latestEventSequence: event.sequence,
      nextCursor: event.streamCursor,
      event,
    };
  }

  public async subscribeSession(
    request: OrchestrationSubscribeSessionRequest,
  ): Promise<OrchestrationSubscribeSessionResponse> {
    const session = this.requireSession(request.sessionId);
    const afterSequence = request.cursor ? Number(request.cursor.split(':').at(-1) ?? 0) : 0;
    const events = session.events.filter((event) => event.sequence > afterSequence);
    return {
      session: session.summary,
      latestEventSequence: session.summary.latestEventSequence,
      nextCursor: session.summary.nextCursor,
      events,
    };
  }

  public async listSessions(
    request?: OrchestrationListSessionsRequest,
  ): Promise<OrchestrationListSessionsResponse> {
    const sessions = Array.from(this.sessions.values()).map((entry) => entry.summary);
    const limitedSessions =
      typeof request?.limit === 'number' ? sessions.slice(0, request.limit) : sessions;
    return {
      sessions: limitedSessions,
      returnedCount: limitedSessions.length,
      totalMatchedCount: sessions.length,
    };
  }

  private createSession(sessionId: string): OrchestrationStartSessionResponse {
    const summary: OrchestrationSessionSummary = {
      sessionId,
      status: OrchestrationSessionStatus.ACTIVE,
      openedAt: '2026-03-30T12:00:00Z',
      currentRouteId: OrchestrationSessionRouteId.MAIN,
      latestEventSequence: 0,
      nextCursor: this.createCursor(sessionId, 0),
      eventCount: 0,
      context: {
        currentRouteId: OrchestrationSessionRouteId.MAIN,
      },
    };
    this.sessions.set(sessionId, { summary, events: [] });
    const event = this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.SESSION_STARTED,
      payload: {
        role: OrchestrationSessionTranscriptRole.SYSTEM,
        routeId: OrchestrationSessionRouteId.MAIN,
      },
    });
    const session = this.requireSession(sessionId);
    session.summary = this.rebuildSummary(sessionId);
    return {
      created: true,
      session: session.summary,
      latestEventSequence: event.sequence,
      nextCursor: event.streamCursor,
    };
  }

  private appendEvent(
    sessionId: string,
    options: {
      type: OrchestrationSessionEventType;
      payload: Record<string, unknown>;
    },
  ): OrchestrationSessionEvent {
    const session = this.requireSession(sessionId);
    const sequence = session.events.length + 1;
    const event: OrchestrationSessionEvent = {
      eventId: `${sessionId}:${String(sequence)}`,
      sequence,
      streamCursor: this.createCursor(sessionId, sequence),
      sessionId,
      type: options.type,
      createdAt: '2026-03-30T12:00:00Z',
      payload: options.payload,
    };
    session.events.push(event);
    return event;
  }

  private rebuildSummary(sessionId: string): OrchestrationSessionSummary {
    const session = this.requireSession(sessionId);
    return {
      ...session.summary,
      latestEventSequence: session.events.length,
      nextCursor: this.createCursor(sessionId, session.events.length),
      eventCount: session.events.length,
    };
  }

  private requireSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        `Unknown session ${sessionId}.`,
      );
    }
    return session;
  }

  private createCursor(sessionId: string, sequence: number): string {
    return `cursor:${sessionId}:${String(sequence)}`;
  }
}

const DEFAULT_TRANSLATIONS: Record<string, string> = {
  'cli.sessionShell.title': 'Repo AI Governor session shell',
  'cli.sessionShell.subtitle': 'Session shell baseline.',
  'cli.sessionShell.workspaceSummary':
    'workspace_id={{workspaceId}} mode={{workspaceMode}} root={{workspaceRoot}}',
  'cli.sessionShell.sections.transcript': 'Transcript',
  'cli.sessionShell.sections.composer': 'Composer',
  'cli.sessionShell.sections.slashPalette': 'Slash palette',
  'cli.sessionShell.sections.promptBar': 'Prompt bar',
  'cli.sessionShell.composer.placeholder': 'Type a message or /help.',
  'cli.sessionShell.palette.emptyState': 'No slash commands matched.',
  'cli.sessionShell.resumeSelector.latest': 'latest',
  'cli.sessionShell.transcript.systemLabel': 'System',
  'cli.sessionShell.transcript.userLabel': 'You',
  'cli.sessionShell.transcript.assistantLabel': 'Governor',
  'cli.sessionShell.transcript.slashLabel': 'Slash command',
  'cli.sessionShell.promptBar.modeLine':
    'shell_mode={{shellMode}} input_mode={{inputMode}} handoff={{handoffState}}',
  'cli.sessionShell.promptBar.persistenceLine':
    'session_id={{sessionId}} persistence={{persistenceOwner}} resume={{resumeSelector}}',
  'cli.sessionShell.promptBar.routeLine':
    'route={{routeId}} theme={{theme}} history={{historyCount}}',
  'cli.sessionShell.promptBar.workspaceLine': 'cwd={{cwd}} workspace={{workspace}}',
  'cli.sessionShell.promptBar.shortcuts': 'Shortcuts: /help, /confirm, /cancel.',
  'cli.sessionShell.commands.help.summary': 'List exposed session-shell commands.',
  'cli.sessionShell.commands.confirm.summary': 'Confirm the current command handoff.',
  'cli.sessionShell.commands.cancel.summary': 'Cancel the current command handoff.',
  'cli.sessionShell.commands.clear.summary': 'Clear the local transcript view.',
  'cli.sessionShell.commands.exit.summary': 'Exit the foreground shell.',
  'cli.sessionShell.commands.resume.summary': 'Resume the current or named session.',
  'cli.sessionShell.commands.history.summary': 'Show recent shell input history.',
  'cli.sessionShell.commands.search.summary': 'Search transcript and history.',
  'cli.sessionShell.commands.multiline.summary': 'Capture one multi-line turn.',
  'cli.sessionShell.commands.theme.summary': 'Inspect or update the theme.',
  'cli.sessionShell.commands.agent.summary': 'Inspect the current foreground route.',
  'cli.commands.init.description': 'Initialize governor workspace baseline.',
  'cli.commands.connect.description': 'Generate adapter onboarding diagnostics baseline.',
  'cli.commands.doctor.description': 'Run environment diagnostics baseline.',
  'cli.commands.workspace.description': 'Plan or execute workspace migration baseline.',
  'cli.commands.workflow.description': 'Preview or edit workflow definitions.',
  'cli.commands.run.description': 'Execute process runtime baseline.',
  'cli.commands.plan.description': 'Generate or update execution plan baseline.',
  'cli.commands.review.description': 'Generate code review baseline output.',
  'cli.sessionShell.responses.welcome': 'Session shell is active.',
  'cli.sessionShell.responses.stderrOnly': 'Live UI renders only to stderr.',
  'cli.sessionShell.responses.mainTurnAccepted':
    'route={{routeId}} turn={{turnIndex}} accepted by the shared session runtime.',
  'cli.sessionShell.responses.mainTurnEcho': 'echo={{userMessage}}',
  'cli.sessionShell.responses.partialSlashMatch': 'Matched commands for prefix {{query}}.',
  'cli.sessionShell.responses.unknownSlashCommand': 'Unknown slash command {{command}}.',
  'cli.sessionShell.responses.trySlashHelp': 'Use /help to inspect commands.',
  'cli.sessionShell.responses.commandPreview': 'preview={{command}} state=awaiting_confirmation',
  'cli.sessionShell.responses.commandHandoffPending':
    'Command handoff preview is ready for {{command}}.',
  'cli.sessionShell.responses.commandConfirmHint': 'Run /confirm or /cancel.',
  'cli.sessionShell.responses.commandExecutionSucceeded':
    'Command handoff completed for {{command}}.',
  'cli.sessionShell.responses.commandExecutionFailed':
    'Command handoff failed for {{command}}. reason={{reason}}',
  'cli.sessionShell.responses.commandArtifact': 'artifact={{artifactPath}}',
  'cli.sessionShell.responses.localTranscriptCleared': 'Local transcript viewport cleared.',
  'cli.sessionShell.responses.historyEmpty': 'No shell inputs recorded yet.',
  'cli.sessionShell.responses.searchRequiresQuery': 'Pass a search term after /search.',
  'cli.sessionShell.responses.searchMatches': 'Matched transcript/history lines for {{query}}:',
  'cli.sessionShell.responses.searchNoMatch': 'No transcript or history lines matched {{query}}.',
  'cli.sessionShell.responses.themeCurrent': 'Current session theme={{theme}}.',
  'cli.sessionShell.responses.themeAvailable': 'Available themes: {{themes}}.',
  'cli.sessionShell.responses.themeUnknown': 'Unknown theme {{theme}}. Choose one of: {{themes}}.',
  'cli.sessionShell.responses.themeUpdated':
    'Updated the current foreground session theme to {{theme}}.',
  'cli.sessionShell.responses.agentCurrent': 'Current foreground session route={{routeId}}.',
  'cli.sessionShell.responses.agentUnsupported':
    'Route {{routeId}} is not supported yet. The session shell currently routes foreground turns to session.main only.',
  'cli.sessionShell.responses.agentUpdated': 'Foreground route remains pinned to {{routeId}}.',
  'cli.sessionShell.responses.resumeFailed':
    'Failed to resume {{resumeSelector}}. reason={{reason}}',
  'cli.sessionShell.responses.resumeAvailableSessions': 'Known sessions: {{sessionIds}}',
  'cli.sessionShell.responses.resumeRecoverableHint': 'Resume is recoverable.',
  'cli.sessionShell.responses.resumeRecoveredWithNewSession':
    'A new session was created so the shell can stay attached.',
  'cli.sessionShell.responses.multilineCancelled': 'Multi-line capture finished without a message.',
  'cli.sessionShell.responses.passthroughRequiresCommand': 'Pass a shell command after !.',
  'cli.sessionShell.responses.passthroughCompleted':
    'Shell passthrough finished for {{command}} with exit_code={{exitCode}}.',
  'cli.sessionShell.responses.passthroughFailed': 'Shell passthrough failed. reason={{reason}}',
  'cli.sessionShell.responses.cancelWithoutPendingCommand':
    'There is no pending command preview to cancel.',
  'cli.sessionShell.responses.commandCancelled': 'The pending command preview was cancelled.',
  'cli.sessionShell.responses.confirmWithoutPendingCommand':
    'There is no pending command preview to confirm.',
  'cli.sessionShell.responses.commandBridgeUnavailable':
    'The session shell does not have a command bridge.',
  'cli.sessionShell.responses.commandNotExecutable': 'This slash command has no executable target.',
  'cli.sessionShell.responses.exitBySlash': 'Closed after /exit.',
  'cli.sessionShell.responses.exitBySigint': 'Closed after Ctrl+C.',
  'cli.sessionShell.responses.exitByEof': 'Closed after Ctrl+D.',
  'cli.sessionShell.responses.exitKeepsTranscript': 'Transcript deletion is not performed.',
  'cli.sessionShell.multilinePrompt': 'multiline> finish with {{terminator}}',
};

const DEFAULT_RUN_OPTIONS = (
  overrides: Partial<CliSessionShellRunOptions> = {},
): CliSessionShellRunOptions => ({
  sessionClient: new FakeSessionShellServiceClient(),
  currentWorkingDirectory: '/workspace/repo',
  workspaceSummary: 'workspace_id=repo mode=repo_local root=/workspace/repo/.repo-ai-governor',
  outputMode: ErrorOutputEnvironment.PRETTY,
  translate: (key, interpolation) =>
    (DEFAULT_TRANSLATIONS[key] ?? key).replace(/\{\{(\w+)\}\}/gu, (_match, placeholder: string) => {
      return interpolation?.[placeholder] ?? '';
    }),
  ...overrides,
});

describe('CliSessionShellRunner', () => {
  it('renders service-backed transcript, preview metadata, executes confirm, and exits through /exit', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: ['/workspace/repo/context/review/code-review.md'],
      commandLine: argv.join(' '),
      message: 'workspace dry-run succeeded',
      status: 'success',
      summaryLines: ['summary=workspace migration preview'],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () =>
        new StubSessionShellPromptAdapter([
          'hello governor',
          '/wo',
          '/workspace dry-run',
          '/confirm',
          '/exit',
        ]),
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        commandExecutor,
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(commandExecutor).toHaveBeenCalledWith(['workspace', 'dry-run']);
    expect(
      renderer.frames.some((frame) =>
        frame.transcriptItems.some((item) =>
          item.lines.includes('Matched commands for prefix /wo.'),
        ),
      ),
    ).toBe(true);
    expect(
      renderer.frames.some((frame) =>
        frame.promptBarLines.includes('preview=workspace dry-run state=awaiting_confirmation'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('summary=workspace migration preview'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('artifact=/workspace/repo/context/review/code-review.md'),
      ),
    ).toBe(true);
    expect(result.transcriptItems[result.transcriptItems.length - 1]?.lines).toContain(
      'Transcript deletion is not performed.',
    );
  });

  it('supports multiline capture, history/search inspection, and shell passthrough summaries', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () =>
        new StubSessionShellPromptAdapter(
          ['/multiline', '/history', '/search governor', '!printf "shell-output"', '/exit'],
          ['governor line one\ngovernor line two'],
        ),
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        passthroughExecutor: async (commandLine) => ({
          commandLine,
          exitCode: 0,
          stderrLines: [],
          stdoutLines: ['shell-output'],
        }),
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('echo=governor line one\ngovernor line two'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Matched transcript/history lines for governor:'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) => item.lines.includes('history: hello governor')),
    ).toBe(false);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Shell passthrough finished for printf "shell-output" with exit_code=0.',
        ),
      ),
    ).toBe(true);
    expect(renderer.frames.at(-1)?.promptBarLines.some((line) => line.includes('history='))).toBe(
      true,
    );
  });

  it('closes cleanly on Ctrl+D and keeps the transcript note intact', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter([null]),
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(result.exitReason).toBe(CliSessionShellExitReason.EOF);
    expect(renderer.frames.at(-1)?.transcriptItems.at(-1)?.lines).toEqual([
      'Closed after Ctrl+D.',
      'Transcript deletion is not performed.',
    ]);
  });

  it('treats Ctrl+C as a clean shell exit instead of a process failure', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () =>
        new StubSessionShellPromptAdapter([
          new RuntimeError(GovernorErrorCode.PROCESS_RUNTIME_CANCELLED, 'cancelled by test'),
        ]),
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(result.exitReason).toBe(CliSessionShellExitReason.SIGINT);
    expect(renderer.frames.at(-1)?.transcriptItems.at(-1)?.lines[0]).toBe('Closed after Ctrl+C.');
  });
});
