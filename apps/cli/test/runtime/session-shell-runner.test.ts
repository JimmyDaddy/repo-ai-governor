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
import {
  ErrorOutputEnvironment,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  CliSessionShellExitReason,
  CliSessionShellHandoffState,
  CliSessionShellInputActionType,
  CliSessionShellMode,
} from '../../src/constants/cli-session-shell.constant.js';
import { CliSessionShellInkController } from '../../src/runtime/interactive-shell/session-shell-ink-controller.js';
import { CliSessionShellRunner } from '../../src/runtime/interactive-shell/session-shell-runner.js';
import type {
  CliCommandProgressEvent,
  CliSessionShellCommandExecutionResult,
  CliSessionShellInputAction,
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
      ...(viewModel.commandProgressPanel
        ? {
            commandProgressPanel: {
              ...viewModel.commandProgressPanel,
              rows: viewModel.commandProgressPanel.rows.map((row) => ({ ...row })),
              artifacts: viewModel.commandProgressPanel.artifacts.map((artifact) => ({
                ...artifact,
              })),
              logLines: [...viewModel.commandProgressPanel.logLines],
            },
          }
        : {}),
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

class StubSessionShellInkRunner {
  private cursor = 0;
  public readonly snapshots: CliSessionShellViewModel[] = [];
  public closeCount = 0;
  public clearRequestCount = 0;

  public constructor(private readonly actions: Array<CliSessionShellInputAction | null>) {}

  public async readAction(
    viewModel?: CliSessionShellViewModel,
  ): Promise<CliSessionShellInputAction | null> {
    this.recordSnapshot(viewModel);

    const action = this.actions[this.cursor] ?? null;
    this.cursor += 1;
    return action;
  }

  public render(viewModel: CliSessionShellViewModel): void {
    this.recordSnapshot(viewModel);
  }

  public requestViewportClear(): void {
    this.clearRequestCount += 1;
  }

  public close(): void {
    this.closeCount += 1;
    return;
  }

  private recordSnapshot(viewModel?: CliSessionShellViewModel): void {
    if (!viewModel) {
      return;
    }

    this.snapshots.push({
      ...viewModel,
      ...(viewModel.commandProgressPanel
        ? {
            commandProgressPanel: {
              ...viewModel.commandProgressPanel,
              rows: viewModel.commandProgressPanel.rows.map((row) => ({ ...row })),
              artifacts: viewModel.commandProgressPanel.artifacts.map((artifact) => ({
                ...artifact,
              })),
              logLines: [...viewModel.commandProgressPanel.logLines],
            },
          }
        : {}),
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

class FakeSessionShellServiceClient {
  protected readonly sessions = new Map<
    string,
    { summary: OrchestrationSessionSummary; events: OrchestrationSessionEvent[] }
  >();
  protected sessionSequence = 0;

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
    metadata?: Record<string, unknown>,
  ): Promise<OrchestrationAppendSessionMessageResponse> {
    const session = this.requireSession(sessionId);
    const event = this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED,
      payload: {
        role,
        routeId: OrchestrationSessionRouteId.MAIN,
        lines,
        ...(metadata ? { metadata: { ...metadata } } : {}),
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

  public seedPendingCommandTurn(options: {
    sessionId: string;
    slashQuery: string;
    bridgeArgv: string[];
    previewCommandLine: string;
    executionMode: 'preview_confirm' | 'direct_execute';
  }): void {
    const session = this.requireSession(options.sessionId);
    const turnIndex =
      session.events.filter((event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED)
        .length + 1;
    this.appendEvent(options.sessionId, {
      type: OrchestrationSessionEventType.TURN_COMPLETED,
      payload: {
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        turnId: `${options.sessionId}:pending:${String(turnIndex)}`,
        turnIndex,
        responseMode: 'command_handoff_preview',
        suggestedSlashCommand: options.slashQuery,
        handoffCommandPreview: options.previewCommandLine,
        requiresConfirmation: options.executionMode !== 'direct_execute',
        handoffExecutionMode: options.executionMode,
        commandBatches: [
          {
            slashQuery: options.slashQuery,
            bridgeArgv: [...options.bridgeArgv],
            previewCommandLine: options.previewCommandLine,
          },
        ],
      },
    });
    session.summary = this.rebuildSummary(options.sessionId);
  }

  protected createSession(sessionId: string): OrchestrationStartSessionResponse {
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

  protected appendEvent(
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

  protected rebuildSummary(sessionId: string): OrchestrationSessionSummary {
    const session = this.requireSession(sessionId);
    return {
      ...session.summary,
      latestEventSequence: session.events.length,
      nextCursor: this.createCursor(sessionId, session.events.length),
      eventCount: session.events.length,
    };
  }

  protected requireSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        `Unknown session ${sessionId}.`,
      );
    }
    return session;
  }

  protected createCursor(sessionId: string, sequence: number): string {
    return `cursor:${sessionId}:${String(sequence)}`;
  }
}

class StreamingTurnSessionShellServiceClient extends FakeSessionShellServiceClient {
  public override async sendMainTurn(sessionId: string, userMessage: string): Promise<void> {
    const session = this.requireSession(sessionId);
    const turnIndex =
      session.events.filter((event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED)
        .length + 1;
    const turnId = `turn-stream-${String(turnIndex)}`;

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
        turnId,
        delta: 'Planning current workspace answer.',
        streamKind: 'lifecycle',
        streamState: 'running',
        title: 'Session Main Answer',
        detail: 'Planning current workspace answer.',
        selectedSurface: 'codex',
      },
    });
    session.summary = this.rebuildSummary(sessionId);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 40);
    });

    this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
      payload: {
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        turnId,
        delta: '## Workspace status',
        streamKind: 'token',
        streamState: 'running',
        title: 'Assistant Draft',
        chunkText: '## Workspace status',
        accumulatedText: '## Workspace status\n\n- clean',
        selectedSurface: 'codex',
      },
    });
    this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.TURN_COMPLETED,
      payload: {
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        turnId,
        turnIndex,
        responseMode: 'answer',
        interactionMode: 'direct_answer',
        assistantMessage: '## Workspace status\n\n- clean',
        assistantDelta: '## Workspace status',
        executionIntent: 'session.answer',
        requiresConfirmation: false,
        selectedSurface: 'codex',
        selectedBy: 'session.main.answer.primary',
        invokedRoleIds: [],
        subagentCount: 0,
      },
    });
    session.summary = this.rebuildSummary(sessionId);
  }
}

const DEFAULT_TRANSLATIONS: Record<string, string> = {
  'cli.sessionShell.title': 'Repo AI Governor session shell',
  'cli.sessionShell.subtitle': 'Session shell baseline.',
  'cli.sessionShell.workspaceSummary':
    'workspace_id={{workspaceId}} mode={{workspaceMode}} root={{workspaceRoot}}',
  'cli.sessionShell.sections.transcript': 'History',
  'cli.sessionShell.sections.composer': 'Current input',
  'cli.sessionShell.sections.slashPalette': 'Slash palette',
  'cli.sessionShell.sections.promptBar': 'Prompt bar',
  'cli.sessionShell.composer.placeholder': 'Type a message, / for commands, or ? for shortcuts.',
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
  'cli.sessionShell.promptBar.idleShortcuts': '? shortcuts · /status · Ctrl+D',
  'cli.sessionShell.promptBar.paletteShortcuts': '↑↓ · Tab/Enter · Esc',
  'cli.sessionShell.promptBar.previewShortcuts': '/confirm · /cancel · Esc',
  'cli.sessionShell.commands.help.summary': 'List exposed session-shell commands.',
  'cli.sessionShell.commands.confirm.summary': 'Confirm the current command handoff.',
  'cli.sessionShell.commands.cancel.summary': 'Cancel the current command handoff.',
  'cli.sessionShell.commands.clear.summary': 'Clear the local transcript view.',
  'cli.sessionShell.commands.exit.summary': 'Exit the foreground shell.',
  'cli.sessionShell.commands.resume.summary': 'Resume the current or named session.',
  'cli.sessionShell.commands.history.summary': 'Show recent shell input history.',
  'cli.sessionShell.commands.search.summary': 'Search transcript and history.',
  'cli.sessionShell.commands.multiline.summary': 'Capture one multi-line turn.',
  'cli.sessionShell.commands.status.summary':
    'Show session-shell status and hidden runtime details.',
  'cli.sessionShell.commands.theme.summary': 'Inspect or update the theme.',
  'cli.sessionShell.commands.agent.summary': 'Inspect the current foreground route.',
  'cli.commands.init.description': 'Initialize governor workspace baseline.',
  'cli.commands.connect.description': 'Generate adapter onboarding diagnostics baseline.',
  'cli.commands.doctor.description': 'Run environment diagnostics baseline.',
  'cli.commands.verify.description': 'Verify adapter routing pass/warn/fail baseline.',
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
  'cli.sessionShell.responses.commandPreview': 'Ready: {{command}}',
  'cli.sessionShell.responses.commandHandoffPending':
    'Command handoff preview is ready for {{command}}.',
  'cli.sessionShell.responses.commandConfirmHint': 'Run /confirm or /cancel.',
  'cli.sessionShell.responses.commandExecutionSucceeded':
    'Command handoff completed for {{command}}.',
  'cli.sessionShell.responses.commandExecutionFailed':
    'Command handoff failed for {{command}}. reason={{reason}}',
  'cli.sessionShell.responses.commandArtifact': 'artifact={{artifactPath}}',
  'cli.sessionShell.responses.commandArtifactsMore':
    '+{{count}} more related artifacts were written.',
  'cli.sessionShell.responses.commandSummary': 'Summary: {{summary}}',
  'cli.sessionShell.responses.commandStatusSummary': 'Key status: {{summary}}',
  'cli.sessionShell.responses.commandAgentSummary': 'Agent routing: {{summary}}',
  'cli.sessionShell.responses.commandAttentionSummary': 'Attention: {{summary}}',
  'cli.sessionShell.responses.commandErrorHint': 'Hint: {{hint}}',
  'cli.sessionShell.responses.commandErrorNextAction': 'Next step: {{nextAction}}',
  'cli.reactShell.shared.shortcuts': 'Shortcuts',
  'cli.reactShell.progress.title': 'Running progress',
  'cli.reactShell.progress.status.running': '{{command}} is running.',
  'cli.reactShell.progress.elapsed': 'Elapsed {{elapsed}}',
  'cli.reactShell.progress.heartbeat': 'Heartbeat {{tick}}',
  'cli.reactShell.progress.steps': 'Step {{completed}}/{{total}}',
  'cli.reactShell.progress.cancel.none': 'Cancellation unavailable.',
  'cli.reactShell.progress.cancel.supported': 'Press Ctrl+C to request cancellation.',
  'cli.reactShell.progress.cancel.requested': 'Cancellation requested.',
  'cli.reactShell.progress.shortcut.exit': 'Esc exit',
  'cli.reactShell.progress.shortcut.cancel': 'Ctrl+C cancel',
  'cli.reactShell.progress.artifactsTitle': 'Artifacts',
  'cli.reactShell.progress.logsTitle': 'Recent logs',
  'cli.sessionShell.responses.localTranscriptCleared': 'Local transcript viewport cleared.',
  'cli.sessionShell.responses.historyEmpty': 'No shell inputs recorded yet.',
  'cli.sessionShell.responses.searchRequiresQuery': 'Pass a search term after /search.',
  'cli.sessionShell.responses.searchMatches': 'Matched transcript/history lines for {{query}}:',
  'cli.sessionShell.responses.searchNoMatch': 'No transcript or history lines matched {{query}}.',
  'cli.sessionShell.responses.statusAttached': 'Attached to session {{sessionId}} on {{routeId}}.',
  'cli.sessionShell.responses.statusRuntime':
    'Resume={{resumeSelector}} persistence={{persistenceOwner}} theme={{theme}} output={{output}}.',
  'cli.sessionShell.responses.statusWorkspace': 'Workspace: {{workspace}}',
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
      summaryLines: ['Summary: workspace migration preview'],
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
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        commandExecutor,
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(commandExecutor).toHaveBeenCalledWith(
      ['workspace', 'dry-run'],
      expect.objectContaining({
        progressSink: expect.objectContaining({
          publish: expect.any(Function),
        }),
      }),
    );
    expect(
      renderer.frames.some((frame) =>
        frame.transcriptItems.some((item) =>
          item.lines.includes('Matched commands for prefix /wo.'),
        ),
      ),
    ).toBe(true);
    expect(
      renderer.frames.some(
        (frame) =>
          frame.commandPreview === 'Ready: workspace dry-run' &&
          frame.promptBarLines.includes('/confirm · /cancel · Esc'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some(
        (item) =>
          item.renderKind === 'command_recap' &&
          item.lines.includes('Summary: workspace migration preview'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('artifact=.../repo/context/review/code-review.md'),
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
      undefined,
      undefined,
      () => false,
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
    expect(renderer.frames.at(-1)?.promptBarLines).toEqual(['? shortcuts · /status · Ctrl+D']);
  });

  it('treats repeated /help as one ephemeral palette surface instead of transcript growth', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/help', '/help', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(result.transcriptItems.some((item) => item.lines.includes('/help'))).toBe(false);
    expect(
      result.transcriptItems.some((item) => item.lines.some((line) => line.startsWith('/help - '))),
    ).toBe(false);
    expect(
      renderer.frames.some(
        (frame) =>
          frame.shellMode === CliSessionShellMode.COMMAND_PALETTE &&
          frame.slashPaletteVisible &&
          frame.slashSuggestions.some((suggestion) => suggestion.command === '/confirm') &&
          frame.slashSuggestions.some((suggestion) => suggestion.command === '/workflow') &&
          frame.promptBarLines.includes('↑↓ · Tab/Enter · Esc'),
      ),
    ).toBe(true);
  });

  it('treats ? as a real shortcuts alias and opens the same help palette surface', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['?', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(result.transcriptItems.some((item) => item.lines.includes('?'))).toBe(false);
    expect(
      renderer.frames.some(
        (frame) =>
          frame.shellMode === CliSessionShellMode.COMMAND_PALETTE &&
          frame.slashPaletteVisible &&
          frame.composerValue === '?' &&
          frame.slashSuggestions.some((suggestion) => suggestion.command === '/confirm') &&
          frame.slashSuggestions.some((suggestion) => suggestion.command === '/workflow') &&
          frame.promptBarLines.includes('↑↓ · Tab/Enter · Esc'),
      ),
    ).toBe(true);
  });

  it('reveals hidden runtime details only when /status is explicitly requested', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/status', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(renderer.frames[0]?.transcriptItems.length).toBe(0);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Attached to session session-shell-001 on session.main.'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Resume=latest persistence=local_orchestration_service theme=governor output=pretty.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Workspace: workspace_id=repo mode=repo_local root=/workspace/repo/.repo-ai-governor',
        ),
      ),
    ).toBe(true);
    expect(renderer.frames.at(-1)?.promptBarLines).toEqual(['? shortcuts · /status · Ctrl+D']);
  });

  it('executes safe bridge commands like /doctor without requiring /confirm', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: 'doctor completed',
      status: 'success',
      summaryLines: ['Summary: doctor completed'],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/doctor', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        commandExecutor,
      }),
    );

    expect(commandExecutor).toHaveBeenCalledWith(
      ['doctor'],
      expect.objectContaining({
        progressSink: expect.objectContaining({
          publish: expect.any(Function),
        }),
      }),
    );
    expect(renderer.frames.some((frame) => frame.commandPreview === 'Ready: doctor')).toBe(false);
    expect(
      result.transcriptItems.some((item) => item.lines.includes('Summary: doctor completed')),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) => item.lines.includes('Run /confirm or /cancel.')),
    ).toBe(false);
  });

  it('forwards shared command execution options into direct bridge runs', async () => {
    const publishedEvents: CliCommandProgressEvent[] = [];
    const executionOptions = {
      progressSink: {
        publish: (event: CliCommandProgressEvent) => {
          publishedEvents.push(event);
        },
      },
    };
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv, nestedExecutionOptions) => {
      nestedExecutionOptions?.progressSink?.publish({
        commandName: 'doctor',
        runState: 'running',
      });
      return {
        artifactPaths: [],
        commandLine: argv.join(' '),
        message: 'doctor completed',
        status: 'success',
        summaryLines: ['Summary: doctor completed'],
      };
    });
    const runner = new CliSessionShellRunner(
      undefined,
      new RecordingSessionShellRenderer() as never,
      () => new StubSessionShellPromptAdapter(['/doctor', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    await runner.run(
      DEFAULT_RUN_OPTIONS({
        commandExecutor,
        commandExecutionOptions: executionOptions,
      }),
    );

    expect(commandExecutor).toHaveBeenCalledWith(
      ['doctor'],
      expect.objectContaining({
        progressSink: expect.objectContaining({
          publish: expect.any(Function),
        }),
      }),
    );
    expect(publishedEvents).toEqual([
      expect.objectContaining({
        commandName: 'doctor',
        runState: 'running',
      }),
    ]);
  });

  it('clears pending preview state when /exit closes the shell before confirmation', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: 'workspace dry-run completed',
      status: 'success',
      summaryLines: ['Summary: workspace dry-run completed'],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/workspace dry-run', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        commandExecutor,
      }),
    );

    expect(commandExecutor).not.toHaveBeenCalled();
    expect(renderer.frames.at(-1)?.shellMode).toBe(CliSessionShellMode.SESSION_SHELL);
    expect(renderer.frames.at(-1)?.handoffState).toBe(CliSessionShellHandoffState.IDLE);
    expect(renderer.frames.at(-1)?.commandPreview).toBeNull();
    expect(result.transcriptItems.at(-1)?.lines[0]).toBe('Closed after /exit.');
  });

  it('keeps a pending preview visible across /clear until /confirm executes it', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: 'workspace dry-run completed',
      status: 'success',
      summaryLines: ['Summary: workspace dry-run completed'],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () =>
        new StubSessionShellPromptAdapter(['/workspace dry-run', '/clear', '/confirm', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        commandExecutor,
      }),
    );

    expect(commandExecutor).toHaveBeenCalledWith(
      ['workspace', 'dry-run'],
      expect.objectContaining({
        progressSink: expect.objectContaining({
          publish: expect.any(Function),
        }),
      }),
    );
    expect(
      renderer.frames.some(
        (frame) =>
          frame.transcriptItems.at(-1)?.lines[0] === 'Local transcript viewport cleared.' &&
          frame.commandPreview === 'Ready: workspace dry-run' &&
          frame.promptBarLines.includes('/confirm · /cancel · Esc'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Summary: workspace dry-run completed'),
      ),
    ).toBe(true);
  });

  it('auto-executes direct_execute pending handoffs after an explicit /resume instead of resetting them into /confirm preview', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const sessionClient = new FakeSessionShellServiceClient('session-shell-001');
    await sessionClient.startSession();
    await sessionClient.startSession();
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: `${argv.join(' ')} completed`,
      status: 'success',
      summaryLines: [`Summary: ${argv.join(' ')} completed`],
    }));
    sessionClient.seedPendingCommandTurn({
      sessionId: 'session-shell-002',
      slashQuery: '/verify',
      bridgeArgv: ['verify', '--adapters', '--output', 'pretty'],
      previewCommandLine: 'verify --adapters --output pretty',
      executionMode: 'direct_execute',
    });
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/resume session-shell-002', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        commandExecutor,
        sessionClient,
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(commandExecutor).toHaveBeenCalledWith(
      ['verify', '--adapters', '--output', 'pretty'],
      expect.objectContaining({
        progressSink: expect.objectContaining({
          publish: expect.any(Function),
        }),
      }),
    );
    expect(
      renderer.frames.some((frame) => frame.promptBarLines.includes('/confirm · /cancel · Esc')),
    ).toBe(false);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Summary: verify --adapters --output pretty completed'),
      ),
    ).toBe(true);
  });

  it('closes cleanly on Ctrl+D and keeps the transcript note intact', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter([null]),
      undefined,
      undefined,
      () => false,
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
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(result.exitReason).toBe(CliSessionShellExitReason.SIGINT);
    expect(renderer.frames.at(-1)?.transcriptItems.at(-1)?.lines[0]).toBe('Closed after Ctrl+C.');
  });

  it('consumes live Ink actions and shows slash palette suggestions before submit', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/',
      },
      {
        type: CliSessionShellInputActionType.PALETTE_HIGHLIGHT_NEXT,
      },
      {
        type: CliSessionShellInputActionType.PALETTE_ACCEPT_HIGHLIGHTED,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/exit',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
    ]);
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter([]),
      () => new CliSessionShellInkController(),
      () => inkRunner as never,
      () => true,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      inkRunner.snapshots.some((frame) => frame.shellMode === CliSessionShellMode.COMMAND_PALETTE),
    ).toBe(true);
    expect(
      inkRunner.snapshots.some((frame) =>
        frame.promptBarLines.some((line) => line.includes('↑↓ · Tab/Enter · Esc')),
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.some(
        (frame) =>
          frame.composerValue === '/' &&
          frame.slashSuggestions.map((suggestion) => suggestion.command).join(',') ===
            '/workspace,/doctor,/verify,/connect,/review,/plan,/run,/help',
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.some((frame) =>
        frame.slashSuggestions.some((suggestion) => suggestion.command === '/workspace'),
      ),
    ).toBe(true);
    expect(inkRunner.closeCount).toBe(1);
    expect(result.transcriptItems.at(-1)?.lines[0]).toBe('Closed after /exit.');
  });

  it('renders session.main stream deltas inside the shared running-progress dock before the turn completes', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: 'summarize the current workspace',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/exit',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
    ]);
    const runner = new CliSessionShellRunner(
      undefined,
      new RecordingSessionShellRenderer() as never,
      () => new StubSessionShellPromptAdapter([]),
      () => new CliSessionShellInkController(),
      () => inkRunner as never,
      () => true,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient: new StreamingTurnSessionShellServiceClient(),
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      inkRunner.snapshots.some(
        (frame) =>
          frame.commandProgressPanel?.title === 'Running progress' &&
          frame.commandProgressPanel.runState === 'running' &&
          frame.commandProgressPanel.statusLine ===
            'Planning current workspace answer. [surface=codex]' &&
          frame.commandProgressPanel.rows.some(
            (row) =>
              row.id === 'lifecycle:session.main' &&
              row.status === ExecutionProgressStatus.RUNNING &&
              row.detail === 'Planning current workspace answer.',
          ),
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.some((frame) =>
        frame.commandProgressPanel?.rows.some(
          (row) =>
            row.id === 'draft:assistant' &&
            row.status === ExecutionProgressStatus.RUNNING &&
            row.detail === '## Workspace status\n\n- clean',
        ),
      ),
    ).toBe(true);
    expect(inkRunner.snapshots.some((frame) => frame.commandProgressPanel === undefined)).toBe(
      true,
    );
    expect(
      result.transcriptItems.some(
        (item) => item.markdownSource === '## Workspace status\n\n- clean',
      ),
    ).toBe(true);
  });

  it('renders the shared running-progress dock inside the session shell while a direct bridge command is running', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/doctor',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/exit',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
    ]);
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv, executionOptions) => {
      executionOptions?.progressSink?.publish({
        commandName: 'doctor',
        row: {
          id: 'doctor-preflight',
          title: 'Doctor preflight',
          status: ExecutionProgressStatus.RUNNING,
          detail: 'Collecting environment diagnostics.',
        },
        logLine: 'doctor preflight running',
      });
      executionOptions?.progressSink?.publish({
        commandName: 'doctor',
        runState: 'success',
        row: {
          id: 'doctor-preflight',
          title: 'Doctor preflight',
          status: ExecutionProgressStatus.COMPLETED,
          detail: 'Environment diagnostics are complete.',
        },
      });
      return {
        artifactPaths: [],
        commandLine: argv.join(' '),
        message: 'doctor completed',
        status: 'success',
        summaryLines: ['Summary: doctor completed'],
      };
    });
    const runner = new CliSessionShellRunner(
      undefined,
      new RecordingSessionShellRenderer() as never,
      () => new StubSessionShellPromptAdapter([]),
      () => new CliSessionShellInkController(),
      () => inkRunner as never,
      () => true,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        commandExecutor,
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      inkRunner.snapshots.some(
        (frame) =>
          frame.commandProgressPanel?.title === 'Running progress' &&
          frame.commandProgressPanel.rows.some(
            (row) =>
              row.id === 'doctor-preflight' &&
              row.status === ExecutionProgressStatus.RUNNING &&
              row.detail === 'Collecting environment diagnostics.',
          ) &&
          frame.commandProgressPanel.logLines.includes('doctor preflight running'),
      ),
    ).toBe(true);
    expect(inkRunner.snapshots.some((frame) => frame.commandProgressPanel === undefined)).toBe(
      true,
    );
    expect(
      result.transcriptItems.some((item) => item.lines.includes('Summary: doctor completed')),
    ).toBe(true);
  });

  it('renders the seeded running-progress dock before a direct bridge command emits any progress events', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/doctor',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/exit',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
    ]);
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: 'doctor completed without nested progress',
      status: 'success',
      summaryLines: ['Summary: doctor completed without nested progress'],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      new RecordingSessionShellRenderer() as never,
      () => new StubSessionShellPromptAdapter([]),
      () => new CliSessionShellInkController(),
      () => inkRunner as never,
      () => true,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        commandExecutor,
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      inkRunner.snapshots.some(
        (frame) =>
          frame.commandProgressPanel?.title === 'Running progress' &&
          frame.commandProgressPanel.runState === 'running' &&
          frame.commandProgressPanel.statusLine === 'doctor is running.' &&
          frame.commandProgressPanel.elapsedLabel === 'Elapsed 0s' &&
          frame.commandProgressPanel.rows.length === 0,
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Summary: doctor completed without nested progress'),
      ),
    ).toBe(true);
  });

  it('keeps a pending preview visible across Ctrl+L until /confirm executes it', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/workspace dry-run',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.SESSION_CLEAR_SCREEN,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/confirm',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/exit',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
    ]);
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: 'workspace dry-run completed',
      status: 'success',
      summaryLines: ['Summary: workspace dry-run completed'],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter([]),
      () => new CliSessionShellInkController(),
      () => inkRunner as never,
      () => true,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        commandExecutor,
      }),
    );

    expect(commandExecutor).toHaveBeenCalledWith(
      ['workspace', 'dry-run'],
      expect.objectContaining({
        progressSink: expect.objectContaining({
          publish: expect.any(Function),
        }),
      }),
    );
    expect(renderer.frames).toHaveLength(0);
    expect(
      inkRunner.snapshots.some(
        (frame) =>
          frame.transcriptItems.at(-1)?.lines[0] === 'Local transcript viewport cleared.' &&
          frame.commandPreview === 'Ready: workspace dry-run' &&
          frame.promptBarLines.includes('/confirm · /cancel · Esc'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Summary: workspace dry-run completed'),
      ),
    ).toBe(true);
  });
});
