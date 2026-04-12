import {
  type OrchestrationAppendSessionMessageResponse,
  type OrchestrationArchiveSessionResponse,
  type OrchestrationForkSessionResponse,
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
  type OrchestrationUnarchiveSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import {
  ErrorOutputEnvironment,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  CliSessionShellExitReason,
  CliSessionShellForegroundFocusTarget,
  CliSessionShellHandoffState,
  CliSessionShellInputActionType,
  CliSessionShellInputMode,
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
        ...(item.details
          ? {
              details: {
                ...item.details,
                lines: [...item.details.lines],
              },
            }
          : {}),
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
        ...(item.details
          ? {
              details: {
                ...item.details,
                lines: [...item.details.lines],
              },
            }
          : {}),
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
  private readonly seedSessionId: string;
  private seedSessionConsumed = false;

  public constructor(seedSessionId = 'session-shell-001') {
    this.seedSessionId = seedSessionId;
    this.sessionSequence = this.parseSessionSequence(seedSessionId);
    this.createSession(seedSessionId);
  }

  public async startSession(): Promise<OrchestrationStartSessionResponse> {
    const seedSession = this.sessions.get(this.seedSessionId);
    if (
      this.seedSessionConsumed === false &&
      seedSession?.summary.status === OrchestrationSessionStatus.ACTIVE
    ) {
      this.seedSessionConsumed = true;
      return {
        created: true,
        session: seedSession.summary,
        latestEventSequence: seedSession.summary.latestEventSequence,
        nextCursor: seedSession.summary.nextCursor,
      };
    }

    this.seedSessionConsumed = true;
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

  public async sendMainTurn(
    sessionId: string,
    userMessage: string,
    options?: {
      displayUserMessage?: string;
    },
  ): Promise<void> {
    const session = this.requireSession(sessionId);
    const visibleUserMessage = options?.displayUserMessage ?? userMessage;
    const turnIndex =
      session.events.filter((event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED)
        .length + 1;
    const turnId = `turn-${String(turnIndex)}`;
    this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.TURN_SUBMITTED,
      payload: {
        role: OrchestrationSessionTranscriptRole.USER,
        routeId: OrchestrationSessionRouteId.MAIN,
        turnId,
        content: visibleUserMessage,
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
        turnId,
        turnIndex,
        latestUserMessage: visibleUserMessage,
      },
    });
    session.summary.context = {
      ...session.summary.context,
      latestTurnId: turnId,
      latestTurnAt: '2026-03-30T12:00:00Z',
      previewSummary: `answer:${visibleUserMessage}`,
      latestNoteSummary: `goal=${visibleUserMessage} | last_reply=answer:${visibleUserMessage}`,
    };
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
    const sessions = Array.from(this.sessions.values())
      .map((entry) => entry.summary)
      .filter((summary) =>
        request?.filter?.status ? summary.status === request.filter.status : true,
      );
    const limitedSessions =
      typeof request?.limit === 'number' ? sessions.slice(0, request.limit) : sessions;
    return {
      sessions: limitedSessions,
      returnedCount: limitedSessions.length,
      totalMatchedCount: sessions.length,
    };
  }

  public async forkSession(
    sourceSessionId: string,
    displayName?: string,
  ): Promise<OrchestrationForkSessionResponse> {
    const sourceSession = this.requireSession(sourceSessionId);
    this.sessionSequence += 1;
    const sessionId = `session-shell-${String(this.sessionSequence).padStart(3, '0')}`;
    const started = this.createSession(sessionId, {
      sourceKind: 'forked',
      sourceSessionId,
      ...(displayName ? { displayName } : {}),
      ...(typeof sourceSession.summary.context.latestNoteSummary === 'string'
        ? {
            latestNoteSummary: sourceSession.summary.context.latestNoteSummary,
          }
        : {}),
      ...(typeof sourceSession.summary.context.previewSummary === 'string'
        ? {
            previewSummary: sourceSession.summary.context.previewSummary,
          }
        : {}),
    });
    return {
      session: started.session,
      sourceSessionId,
      latestEventSequence: started.latestEventSequence,
      nextCursor: started.nextCursor,
    };
  }

  public async archiveSession(sessionId: string): Promise<OrchestrationArchiveSessionResponse> {
    const session = this.requireSession(sessionId);
    session.summary = {
      ...session.summary,
      status: OrchestrationSessionStatus.ARCHIVED,
      context: {
        ...session.summary.context,
        archivedAt: '2026-03-30T13:00:00Z',
      },
    };
    const event = this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED,
      payload: {
        role: OrchestrationSessionTranscriptRole.SYSTEM,
        routeId: OrchestrationSessionRouteId.MAIN,
        lines: [`Archived session ${sessionId}.`],
        metadata: {
          renderKind: 'system_notice',
        },
      },
    });
    session.summary = this.rebuildSummary(sessionId);
    return {
      session: session.summary,
      archivedAt: '2026-03-30T13:00:00Z',
      latestEventSequence: event.sequence,
      nextCursor: event.streamCursor,
    };
  }

  public async unarchiveSession(sessionId: string): Promise<OrchestrationUnarchiveSessionResponse> {
    const session = this.requireSession(sessionId);
    const { archivedAt: _archivedAt, ...nextContext } = session.summary.context;
    session.summary = {
      ...session.summary,
      status: OrchestrationSessionStatus.ACTIVE,
      context: nextContext,
    };
    const event = this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED,
      payload: {
        role: OrchestrationSessionTranscriptRole.SYSTEM,
        routeId: OrchestrationSessionRouteId.MAIN,
        lines: [`Restored archived session ${sessionId} to active status.`],
        metadata: {
          renderKind: 'system_notice',
        },
      },
    });
    session.summary = this.rebuildSummary(sessionId);
    return {
      session: session.summary,
      latestEventSequence: event.sequence,
      nextCursor: event.streamCursor,
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

  protected createSession(
    sessionId: string,
    contextPatch: Record<string, unknown> = {},
  ): OrchestrationStartSessionResponse {
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
        sourceKind: 'new',
        ...contextPatch,
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

  private parseSessionSequence(sessionId: string): number {
    const parsedSuffix = Number(sessionId.split('-').at(-1));
    return Number.isInteger(parsedSuffix) && parsedSuffix > 0 ? parsedSuffix : 0;
  }
}

class RecordingTurnPayloadSessionShellServiceClient extends FakeSessionShellServiceClient {
  public readonly turnPayloads: Array<{
    userMessage: string;
    displayUserMessage: string | null;
  }> = [];

  public override async sendMainTurn(
    sessionId: string,
    userMessage: string,
    options?: {
      displayUserMessage?: string;
    },
  ): Promise<void> {
    this.turnPayloads.push({
      userMessage,
      displayUserMessage: options?.displayUserMessage ?? null,
    });
    return super.sendMainTurn(sessionId, userMessage, options);
  }
}

class StreamingTurnSessionShellServiceClient extends FakeSessionShellServiceClient {
  public override async sendMainTurn(
    sessionId: string,
    userMessage: string,
    options?: {
      displayUserMessage?: string;
    },
  ): Promise<void> {
    const session = this.requireSession(sessionId);
    const visibleUserMessage = options?.displayUserMessage ?? userMessage;
    const turnIndex =
      session.events.filter((event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED)
        .length + 1;
    const turnId = `turn-stream-${String(turnIndex)}`;

    this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.TURN_SUBMITTED,
      payload: {
        role: OrchestrationSessionTranscriptRole.USER,
        routeId: OrchestrationSessionRouteId.MAIN,
        content: visibleUserMessage,
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
        delta: 'Inspecting workspace status.',
        streamKind: 'tool_call',
        streamState: 'running',
        title: 'Workspace inspection',
        detail: 'Inspecting workspace status.',
        toolName: 'repo_status',
        toolCallId: 'tool-call-1',
        selectedSurface: 'codex',
      },
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
    session.summary = this.rebuildSummary(sessionId);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 40);
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

class DelayedTurnWithoutStreamSessionShellServiceClient extends FakeSessionShellServiceClient {
  public override async sendMainTurn(
    sessionId: string,
    userMessage: string,
    options?: {
      displayUserMessage?: string;
    },
  ): Promise<void> {
    const session = this.requireSession(sessionId);
    const visibleUserMessage = options?.displayUserMessage ?? userMessage;
    const turnIndex =
      session.events.filter((event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED)
        .length + 1;
    const turnId = `turn-delayed-${String(turnIndex)}`;

    this.appendEvent(sessionId, {
      type: OrchestrationSessionEventType.TURN_SUBMITTED,
      payload: {
        role: OrchestrationSessionTranscriptRole.USER,
        routeId: OrchestrationSessionRouteId.MAIN,
        content: visibleUserMessage,
      },
    });
    session.summary = this.rebuildSummary(sessionId);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 40);
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
        assistantMessage: 'Hello back from delayed turn.',
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

class MissingSessionOnFirstTurnSessionShellServiceClient extends FakeSessionShellServiceClient {
  private failedOnce = false;

  public override async sendMainTurn(
    sessionId: string,
    userMessage: string,
    options?: {
      displayUserMessage?: string;
    },
  ): Promise<void> {
    if (!this.failedOnce) {
      this.failedOnce = true;
      this.sessions.delete(sessionId);
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        `Session "${sessionId}" was not found in memory store.`,
      );
    }

    return super.sendMainTurn(sessionId, userMessage, options);
  }
}

class MissingSessionOnFirstTwoTurnsSessionShellServiceClient extends FakeSessionShellServiceClient {
  private failureCount = 0;

  public override async sendMainTurn(
    sessionId: string,
    userMessage: string,
    options?: {
      displayUserMessage?: string;
    },
  ): Promise<void> {
    if (this.failureCount < 2) {
      this.failureCount += 1;
      this.sessions.delete(sessionId);
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        `Session "${sessionId}" was not found in memory store.`,
      );
    }

    return super.sendMainTurn(sessionId, userMessage, options);
  }
}

class MissingSessionThenDelayedTurnWithoutStreamSessionShellServiceClient extends DelayedTurnWithoutStreamSessionShellServiceClient {
  private failedOnce = false;

  public override async sendMainTurn(
    sessionId: string,
    userMessage: string,
    options?: {
      displayUserMessage?: string;
    },
  ): Promise<void> {
    if (!this.failedOnce) {
      this.failedOnce = true;
      this.sessions.delete(sessionId);
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        `Session "${sessionId}" was not found in memory store.`,
      );
    }

    return super.sendMainTurn(sessionId, userMessage, options);
  }
}

class FailingLifecycleCommandSessionShellServiceClient extends FakeSessionShellServiceClient {
  public constructor(
    private readonly failureMode: 'fork' | 'archive' | 'unarchive',
    private readonly failureMessage: string,
  ) {
    super();
  }

  public override async forkSession(
    sourceSessionId: string,
    displayName?: string,
  ): Promise<OrchestrationForkSessionResponse> {
    if (this.failureMode === 'fork') {
      throw new RuntimeError(GovernorErrorCode.MEMORY_SESSION_NOT_FOUND, this.failureMessage);
    }

    return super.forkSession(sourceSessionId, displayName);
  }

  public override async archiveSession(
    sessionId: string,
  ): Promise<OrchestrationArchiveSessionResponse> {
    if (this.failureMode === 'archive') {
      throw new RuntimeError(GovernorErrorCode.MEMORY_SESSION_NOT_FOUND, this.failureMessage);
    }

    return super.archiveSession(sessionId);
  }

  public override async unarchiveSession(
    sessionId: string,
  ): Promise<OrchestrationUnarchiveSessionResponse> {
    if (this.failureMode === 'unarchive') {
      throw new RuntimeError(GovernorErrorCode.MEMORY_SESSION_NOT_FOUND, this.failureMessage);
    }

    return super.unarchiveSession(sessionId);
  }
}

const DEFAULT_TRANSLATIONS: Record<string, string> = {
  'cli.sessionShell.title': 'Repo AI Governor session shell',
  'cli.sessionShell.subtitle': 'Session shell baseline.',
  'cli.sessionShell.workspaceSummary':
    'workspace_id={{workspaceId}} mode={{workspaceMode}} root={{workspaceRoot}}',
  'cli.sessionShell.sections.transcript': 'History',
  'cli.sessionShell.sections.composer': 'Current input',
  'cli.sessionShell.sections.secureCaptureComposer': 'Secure input',
  'cli.sessionShell.sections.slashPalette': 'Slash palette',
  'cli.sessionShell.sections.promptBar': 'Prompt bar',
  'cli.sessionShell.composer.placeholder': 'Type a message, / for commands, or ? for shortcuts.',
  'cli.sessionShell.composer.securePlaceholder': 'Secret input stays hidden while you type.',
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
  'cli.sessionShell.promptBar.secureCaptureShortcuts': 'Enter submit · Esc cancel · Ctrl+D',
  'cli.sessionShell.promptBar.showExecutionDetailsShortcut': 'Ctrl+O details',
  'cli.sessionShell.promptBar.hideExecutionDetailsShortcut': 'Ctrl+O hide details',
  'cli.sessionShell.commands.help.summary': 'List exposed session-shell commands.',
  'cli.sessionShell.commands.confirm.summary': 'Confirm the current command handoff.',
  'cli.sessionShell.commands.cancel.summary': 'Cancel the current command handoff.',
  'cli.sessionShell.commands.clear.summary': 'Clear the local transcript view.',
  'cli.sessionShell.commands.exit.summary': 'Exit the foreground shell.',
  'cli.sessionShell.commands.resume.summary': 'Resume the current or named session.',
  'cli.sessionShell.commands.sessions.summary': 'List recent active or archived sessions.',
  'cli.sessionShell.commands.fork.summary': 'Fork the current session into a new branch.',
  'cli.sessionShell.commands.archive.summary': 'Archive the current or named session.',
  'cli.sessionShell.commands.unarchive.summary': 'Restore an archived session and attach to it.',
  'cli.sessionShell.commands.history.summary': 'Show recent shell input history.',
  'cli.sessionShell.commands.search.summary': 'Search transcript and history.',
  'cli.sessionShell.commands.multiline.summary': 'Capture one multi-line turn.',
  'cli.sessionShell.commands.planSync.summary':
    'Preview or commit deterministic sprint-ledger projection for an existing plan.',
  'cli.sessionShell.commands.status.summary':
    'Show session-shell status and hidden runtime details.',
  'cli.sessionShell.commands.theme.summary': 'Inspect or update the theme.',
  'cli.sessionShell.commands.agent.summary': 'Inspect the current foreground route.',
  'cli.commands.init.description': 'Initialize governor workspace baseline.',
  'cli.commands.workspace.description': 'Plan or execute workspace migration baseline.',
  'cli.commands.workspace.actionGuideDryRun':
    'Preview the workspace migration plan; requires --workspace-mode <repo_local|tool_managed>.',
  'cli.commands.workspace.actionGuideExecute':
    'Apply the workspace migration plan for the selected workspace mode.',
  'cli.commands.workspace.actionGuideRollback':
    'Restore the previous workspace surface from a saved --workspace-plan artifact.',
  'cli.commands.workspace.actionGuideClearConfig':
    'Remove the current governor workspace config so init can rebuild a clean baseline.',
  'cli.commands.workspace.actionGuideSetUiTheme':
    'Open the session-shell theme selector or persist one explicit workspace/global theme.',
  'sessionMainCapabilities.catalog.connect.summary':
    'Prepare and apply adapter onboarding changes for this workspace.',
  'sessionMainCapabilities.catalog.doctor.summary':
    'Diagnose adapter health, environment readiness, and route blockers.',
  'sessionMainCapabilities.catalog.verify.summary':
    'Verify routing, projection, and adapter readiness truth.',
  'sessionMainCapabilities.catalog.workflow.summary':
    'Preview or enter the governed workflow definition surface.',
  'sessionMainCapabilities.catalog.run.summary':
    'Start a reusable governed workflow or task-driven execution flow.',
  'sessionMainCapabilities.catalog.plan.summary':
    'Generate or refine a task breakdown for the current goal.',
  'sessionMainCapabilities.catalog.review.summary':
    'Run the governed code-review path for the current scope.',
  'sessionMainCapabilities.catalog.review_verify.summary':
    'Recheck a review report and confirm whether accepted findings are actually fixed.',
  'cli.sessionShell.responses.welcome': 'Session shell is active.',
  'cli.sessionShell.responses.stderrOnly': 'Live UI renders only to stderr.',
  'cli.sessionShell.responses.liveTurnRunningSummary': 'Running · {{elapsed}}',
  'cli.sessionShell.responses.liveTurnThinking': 'Thinking...',
  'cli.sessionShell.responses.liveTurnThinkingPulse': 'Thinking{{suffix}}',
  'cli.sessionShell.responses.liveTurnThinkingDetail': 'Thinking: {{detail}}',
  'cli.sessionShell.responses.liveTurnCurrentDetail': '{{detail}}',
  'cli.sessionShell.responses.liveTurnRoleActivity': '{{role}}: {{detail}}',
  'cli.sessionShell.responses.liveTurnToolCall': 'Tool: {{toolName}} - {{detail}}',
  'cli.sessionShell.responses.liveTurnActivityTitle': 'Live activity',
  'cli.sessionShell.responses.executionDetailsTitle': 'Execution details',
  'cli.sessionShell.responses.executionDetailsCollapsed':
    '▶ Collapsed · {{count}} entries · Ctrl+O to open',
  'cli.sessionShell.responses.executionDetailsExpanded':
    '▼ Expanded · {{count}} entries · Ctrl+O to hide',
  'cli.sessionShell.responses.mainTurnAccepted':
    'route={{routeId}} turn={{turnIndex}} accepted by the shared session runtime.',
  'cli.sessionShell.responses.mainTurnEcho': 'echo={{userMessage}}',
  'cli.sessionShell.responses.partialSlashMatch': 'Matched commands for prefix {{query}}.',
  'cli.sessionShell.responses.unknownSlashCommand': 'Unknown slash command {{command}}.',
  'cli.sessionShell.responses.trySlashHelp': 'Use /help to inspect commands.',
  'cli.sessionShell.responses.verifyRemoved':
    'The public `/verify` slash command has been removed from the session shell.',
  'cli.sessionShell.responses.verifyRemovedNextAction':
    'Use `/doctor` for readiness diagnostics, or `/connect` if you need onboarding changes plus follow-up checks.',
  'cli.sessionShell.responses.commandPreview': 'Ready: {{command}}',
  'cli.sessionShell.responses.commandHandoffPending':
    'Command handoff preview is ready for {{command}}.',
  'cli.sessionShell.responses.commandConfirmHint': 'Run /confirm or /cancel.',
  'cli.sessionShell.responses.commandExecutionSucceeded':
    'Command handoff completed for {{command}}.',
  'cli.sessionShell.responses.commandDirectExecutionNotice':
    'This slash command ran immediately, so /confirm is not required.',
  'cli.sessionShell.responses.commandExecutionFailed':
    'Command handoff failed for {{command}}. reason={{reason}}',
  'cli.sessionShell.responses.secureSecretCaptureReserved':
    '{{command}} is reserved for secure local capture and will not enter command preview.',
  'cli.sessionShell.responses.secureSecretCaptureRequiresInk':
    'Secure local capture currently requires the live Ink shell. Re-run {{command}} in interactive pretty mode.',
  'cli.sessionShell.responses.secureSecretCaptureActive':
    'Secure local capture is active for {{command}}. Typed input stays hidden on this device.',
  'cli.sessionShell.responses.secureSecretCaptureCancelled':
    'Secure local capture cancelled for {{command}}.',
  'cli.sessionShell.responses.secureSecretCaptureEmpty':
    'No secret was entered for {{command}}. Re-run the command to start secure local capture again.',
  'cli.sessionShell.responses.secureSecretCaptureMutationUnavailable':
    'Secure local secret mutation is unavailable in this shell attachment. Re-run {{command}} after the local mutation seam is configured.',
  'cli.sessionShell.responses.secureSecretCaptureSucceeded':
    'Secret set completed for {{command}} via backend {{backendId}}.',
  'cli.sessionShell.responses.secureSecretCaptureBackendWarning': 'Backend warning: {{warning}}',
  'cli.sessionShell.responses.secureSecretCaptureFailed':
    'Secure local secret mutation failed for {{command}}. reason={{reason}}',
  'cli.sessionShell.responses.secureSecretCaptureFailedBackendUnavailable':
    'Secure local secret mutation could not reach a writable backend for {{command}}.',
  'cli.sessionShell.responses.secureSecretCaptureFailedBackendUnavailableNextStep':
    'Run /secret status to inspect backend availability, or use the standalone CLI with --backend unsafe-local-file --stdin only if you explicitly want the local-only fallback.',
  'cli.sessionShell.responses.secureSecretCaptureFailedInvalidInput':
    'Secure local secret mutation rejected the captured input for {{command}}.',
  'cli.sessionShell.responses.secureSecretCaptureFailedInvalidInputNextStep':
    'Re-run {{command}} and enter the secret again in secure local capture.',
  'cli.sessionShell.responses.secureSecretCaptureFailedOperation':
    'Secure local secret mutation failed while writing the captured secret for {{command}}.',
  'cli.sessionShell.responses.secureSecretCaptureFailedOperationNextStep':
    'Run /secret status to inspect backend availability, then retry {{command}} in secure local capture.',
  'cli.sessionShell.responses.secureSecretCaptureCaptured':
    'Secure input was captured locally for {{command}}. Direct mutation handoff is not wired in this attachment yet.',
  'cli.sessionShell.responses.secureSecretSlashSuffixRejected':
    'Do not enter secret in slash text. Re-run {{command}} and continue in secure local capture.',
  'cli.sessionShell.responses.commandArtifact': 'artifact={{artifactPath}}',
  'cli.sessionShell.responses.commandArtifactsMore':
    '+{{count}} more related artifacts were written.',
  'cli.sessionShell.responses.commandSummary': 'Summary: {{summary}}',
  'cli.sessionShell.responses.commandStatusSummary': 'Key status: {{summary}}',
  'cli.sessionShell.responses.commandFailureSummary': 'Failure: {{summary}}',
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
  'cli.reactShell.progress.run.starting': 'Preparing run execution…',
  'cli.reactShell.progress.run.assembling': 'Assemble task-driven run',
  'cli.reactShell.progress.run.compiling': 'Compile process IR',
  'cli.reactShell.progress.run.executingRuntime': 'Execute runtime graph',
  'cli.reactShell.progress.run.writingArtifacts': 'Write execution artifacts',
  'cli.reactShell.progress.run.completed': 'Run execution finished.',
  'cli.reactShell.progress.run.failed': 'Run execution ended with a failure.',
  'cli.sessionShell.responses.localTranscriptCleared': 'Local transcript viewport cleared.',
  'cli.sessionShell.responses.historyEmpty': 'No shell inputs recorded yet.',
  'cli.sessionShell.responses.searchRequiresQuery': 'Pass a search term after /search.',
  'cli.sessionShell.responses.searchMatches': 'Matched transcript/history lines for {{query}}:',
  'cli.sessionShell.responses.searchNoMatch': 'No transcript or history lines matched {{query}}.',
  'cli.sessionShell.responses.sessionsHeading': 'Recent sessions (filter={{filter}}):',
  'cli.sessionShell.responses.sessionsEmpty': 'No recent sessions matched filter={{filter}}.',
  'cli.sessionShell.responses.sessionsEntry':
    'session={{sessionId}} status={{status}} source={{sourceKind}} opened_at={{openedAt}}',
  'cli.sessionShell.responses.sessionsDisplayName': 'display_name={{displayName}}',
  'cli.sessionShell.responses.sessionsNoteSummary': 'note={{summary}}',
  'cli.sessionShell.responses.sessionsPreviewSummary': 'preview={{summary}}',
  'cli.sessionShell.responses.sessionsArchivedAt': 'archived_at={{archivedAt}}',
  'cli.sessionShell.responses.sessionsUnknownFilter':
    'Unsupported /sessions filter {{filter}}. Use active, archived, or all.',
  'cli.sessionShell.responses.sessionsFailed': 'Failed to list sessions. reason={{reason}}',
  'cli.sessionShell.responses.statusAttached': 'Attached to session {{sessionId}} on {{routeId}}.',
  'cli.sessionShell.responses.statusRuntime':
    'Resume={{resumeSelector}} persistence={{persistenceOwner}} theme={{theme}} output={{output}}.',
  'cli.sessionShell.responses.statusWorkspace': 'Workspace: {{workspace}}',
  'cli.sessionShell.responses.statusStartup':
    'Startup path={{startupPath}} lazy_boundary={{lazyBoundary}} bootstrap_ms={{bootstrapMs}}.',
  'cli.sessionShell.responses.statusProjection':
    'Projection source={{sourceKind}} display_name={{displayName}}.',
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
  'cli.sessionShell.responses.sessionForkedFrom':
    'Forked session {{sourceSessionId}} into the current branch {{sessionId}}.',
  'cli.sessionShell.responses.sessionNoteSummary': 'Note: {{summary}}',
  'cli.sessionShell.responses.sessionPreviewSummary': 'Preview: {{summary}}',
  'cli.sessionShell.responses.sessionArchivedAt': 'Archived at {{archivedAt}}.',
  'cli.sessionShell.responses.sessionArchived': 'Archived session {{sessionId}}.',
  'cli.sessionShell.responses.sessionArchiveReplacementAttached':
    'Attached a fresh session {{sessionId}} so the foreground shell can keep running.',
  'cli.sessionShell.responses.forkFailed': 'Failed to fork the current session. reason={{reason}}',
  'cli.sessionShell.responses.archiveFailed':
    'Failed to archive the requested session. reason={{reason}}',
  'cli.sessionShell.responses.unarchiveRequiresSessionId':
    'Pass one archived session id after /unarchive so the shell knows which session to restore.',
  'cli.sessionShell.responses.unarchiveFailed':
    'Failed to restore the requested session. reason={{reason}}',
  'cli.sessionShell.responses.resumeRecoveredWithNewSession':
    'A new session was created so the shell can stay attached.',
  'cli.sessionShell.responses.turnRetryingAfterSessionRecovery':
    'The shell is retrying your latest message in a new attached session.',
  'cli.sessionShell.responses.sessionRecoveredContinueHint':
    'The shell reattached to a new session so foreground actions can continue.',
  'cli.sessionShell.responses.multilineCancelled': 'Multi-line capture finished without a message.',
  'cli.sessionShell.responses.passthroughRequiresCommand': 'Pass a shell command after !.',
  'cli.sessionShell.responses.passthroughCompleted':
    'Shell passthrough finished for {{command}} with exit_code={{exitCode}}.',
  'cli.sessionShell.responses.passthroughFailed': 'Shell passthrough failed. reason={{reason}}',
  'cli.sessionShell.responses.cancelWithoutPendingCommand':
    'There is no pending command preview to cancel.',
  'cli.sessionShell.responses.commandCancelled': 'The pending command preview was cancelled.',
  'cli.sessionShell.responses.confirmWithoutPendingCommand':
    'There is no pending command preview to confirm. Direct slash commands such as /review may already have executed.',
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
  secureSecretMutator: {
    setSecret: async ({ keyName }) => ({
      keyName,
      selector: `secret://${keyName}`,
      backendId: 'macos-keychain',
      warning: null,
    }),
  },
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
  it('renders service-backed transcript, auto-executes direct bridge commands, and exits through /exit', async () => {
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
      renderer.frames.some((frame) => frame.promptBarLines.includes('/confirm · /cancel · Esc')),
    ).toBe(false);
    expect(
      result.transcriptItems.some(
        (item) =>
          item.renderKind === 'command_recap' &&
          item.lines.includes('Summary: workspace migration preview'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'There is no pending command preview to confirm. Direct slash commands such as /review may already have executed.',
        ),
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
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Startup path=default_session_shell lazy_boundary=session_shell_only bootstrap_ms=0.',
        ),
      ),
    ).toBe(true);
    expect(renderer.frames.at(-1)?.promptBarLines).toEqual(['? shortcuts · /status · Ctrl+D']);
  });

  it('lists archived sessions through /sessions and surfaces projection note summaries', async () => {
    const sessionClient = new FakeSessionShellServiceClient('session-shell-001');
    await sessionClient.sendMainTurn('session-shell-001', 'hello governor');
    await sessionClient.archiveSession('session-shell-001');
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/sessions archived', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient,
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Recent sessions (filter=archived):'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'session=session-shell-001 status=archived source=new opened_at=2026-03-30T12:00:00Z',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('note=goal=hello governor | last_reply=answer:hello governor'),
      ),
    ).toBe(true);
  });

  it('forks the current session into a new branch and exposes fork projection details in /status', async () => {
    const sessionClient = new FakeSessionShellServiceClient('session-shell-001');
    await sessionClient.sendMainTurn('session-shell-001', 'ship the release note');
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/fork release-note', '/status', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient,
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Forked session session-shell-001 into the current branch session-shell-002.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Projection source=forked display_name=release-note.'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Note: goal=ship the release note | last_reply=answer:ship the release note',
        ),
      ),
    ).toBe(true);
  });

  it('surfaces a presenter-safe receipt when /fork fails and keeps the current attachment', async () => {
    const sessionClient = new FailingLifecycleCommandSessionShellServiceClient(
      'fork',
      'fork is temporarily unavailable.',
    );
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/fork release-note', '/status', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient,
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Failed to fork the current session. reason=fork is temporarily unavailable.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Attached to session session-shell-001 on session.main.'),
      ),
    ).toBe(true);
  });

  it('archives the current session and attaches a fresh session so the shell can continue', async () => {
    const sessionClient = new FakeSessionShellServiceClient('session-shell-001');
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/archive', '/status', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient,
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Archived session session-shell-001.'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Attached a fresh session session-shell-002 so the foreground shell can keep running.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Attached to session session-shell-002 on session.main.'),
      ),
    ).toBe(true);
  });

  it('surfaces a presenter-safe receipt when /archive fails and keeps the current attachment', async () => {
    const sessionClient = new FailingLifecycleCommandSessionShellServiceClient(
      'archive',
      'archive is temporarily unavailable.',
    );
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/archive', '/status', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient,
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Failed to archive the requested session. reason=archive is temporarily unavailable.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Attached to session session-shell-001 on session.main.'),
      ),
    ).toBe(true);
  });

  it('restores an archived session through /unarchive and reattaches the foreground shell', async () => {
    const sessionClient = new FakeSessionShellServiceClient('session-shell-001');
    await sessionClient.startSession();
    await sessionClient.startSession();
    await sessionClient.sendMainTurn('session-shell-002', 'restore the release context');
    await sessionClient.archiveSession('session-shell-002');
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/unarchive session-shell-002', '/status', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient,
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Restored archived session session-shell-002 to active status.'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Attached to session session-shell-002 on session.main.'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Note: goal=restore the release context | last_reply=answer:restore the release context',
        ),
      ),
    ).toBe(true);
  });

  it('surfaces a presenter-safe receipt when /unarchive fails and keeps the current attachment', async () => {
    const sessionClient = new FailingLifecycleCommandSessionShellServiceClient(
      'unarchive',
      'restore is temporarily unavailable.',
    );
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/unarchive session-shell-002', '/status', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient,
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Failed to restore the requested session. reason=restore is temporarily unavailable.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Attached to session session-shell-001 on session.main.'),
      ),
    ).toBe(true);
  });

  it('requires an explicit session id before attempting /unarchive', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/unarchive', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Pass one archived session id after /unarchive so the shell knows which session to restore.',
        ),
      ),
    ).toBe(true);
  });

  it('surfaces presenter-safe note summary when resuming a session on startup', async () => {
    const sessionClient = new FakeSessionShellServiceClient('session-shell-001');
    await sessionClient.sendMainTurn('session-shell-001', 'summarize the sprint');
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient,
        resumeOnStartup: true,
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Note: goal=summarize the sprint | last_reply=answer:summarize the sprint',
        ),
      ),
    ).toBe(true);
  });

  it('starts a fresh session and retries the turn when the attached session disappears', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['hello governor', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient: new MissingSessionOnFirstTurnSessionShellServiceClient(),
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('A new session was created so the shell can stay attached.'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('The shell is retrying your latest message in a new attached session.'),
      ),
    ).toBe(true);
    expect(result.transcriptItems.some((item) => item.lines.includes('echo=hello governor'))).toBe(
      true,
    );
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('was not found in memory store')),
      ),
    ).toBe(false);
    expect(
      renderer.frames.some((frame) =>
        frame.transcriptItems.some((item) =>
          item.lines.includes(
            'The shell is retrying your latest message in a new attached session.',
          ),
        ),
      ),
    ).toBe(true);
  });

  it('retries through multiple missing-session recoveries before surfacing a turn failure', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['帮我 review 代码', '/exit']),
      undefined,
      undefined,
      () => false,
      () => new Date('2026-03-30T12:00:00Z'),
    );

    const result = await runner.run(
      DEFAULT_RUN_OPTIONS({
        sessionClient: new MissingSessionOnFirstTwoTurnsSessionShellServiceClient(),
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('A new session was created so the shell can stay attached.'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('The shell is retrying your latest message in a new attached session.'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) => item.lines.includes('echo=帮我 review 代码')),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('was not found in memory store')),
      ),
    ).toBe(false);
    expect(
      renderer.frames.some((frame) =>
        frame.transcriptItems.some((item) =>
          item.lines.includes(
            'The shell is retrying your latest message in a new attached session.',
          ),
        ),
      ),
    ).toBe(true);
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

  it('bridges bare /workflow into workflow preview so discoverability affordances stay truthful', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: 'workflow preview completed',
      status: 'success',
      summaryLines: ['Summary: workflow preview completed'],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/workflow', '/exit']),
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
      ['workflow', 'preview'],
      expect.objectContaining({
        progressSink: expect.objectContaining({
          publish: expect.any(Function),
        }),
      }),
    );
    expect(
      renderer.frames.some((frame) => frame.commandPreview === 'Ready: workflow preview'),
    ).toBe(false);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Summary: workflow preview completed'),
      ),
    ).toBe(true);
  });

  it('reserves exact /secret set routes away from ordinary command preview handoff', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: 'unexpected execution',
      status: 'success',
      summaryLines: ['Summary: unexpected execution'],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/secret set openai/api-key', '/exit']),
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
    expect(
      renderer.frames.some((frame) => frame.commandPreview === 'Ready: secret set openai/api-key'),
    ).toBe(false);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          '/secret set openai/api-key is reserved for secure local capture and will not enter command preview.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Secure local capture currently requires the live Ink shell. Re-run /secret set openai/api-key in interactive pretty mode.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some(
        (item) =>
          item.label === 'Slash command' && item.lines.includes('/secret set openai/api-key'),
      ),
    ).toBe(false);
  });

  it('enters secure-local capture mode in the Ink shell without reflecting the secret into presenter-visible state', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/secret set openai/api-key',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_APPEND,
        value: 'sk-live-secret',
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/history',
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

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      inkRunner.snapshots.some(
        (frame) =>
          frame.shellMode === CliSessionShellMode.SECURE_LOCAL_CAPTURE &&
          frame.inputMode === CliSessionShellInputMode.SECURE_LOCAL &&
          frame.foregroundFocusTarget === CliSessionShellForegroundFocusTarget.SECURE_CAPTURE &&
          frame.composerValue === '' &&
          frame.secureCapture?.displayCommand === '/secret set openai/api-key' &&
          frame.commandPreview ===
            'Secure local capture is active for /secret set openai/api-key. Typed input stays hidden on this device.' &&
          frame.promptBarLines.includes('Enter submit · Esc cancel · Ctrl+D'),
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.some((frame) =>
        frame.transcriptItems.some((item) =>
          item.lines.some((line) => line.includes('sk-live-secret')),
        ),
      ),
    ).toBe(false);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Secret set completed for /secret set openai/api-key via backend macos-keychain.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('sk-live-secret')),
      ),
    ).toBe(false);
    const historyMatches = result.transcriptItems.flatMap((item) =>
      item.lines.filter((line) => /^1\. \[[^\]]+\] \/secret set openai\/api-key$/u.test(line)),
    );
    expect(historyMatches).toHaveLength(1);
  });

  it('surfaces backend warning metadata on secure local mutation without leaking the captured secret', async () => {
    const backendWarning =
      'unsafe-local-file stores plaintext secrets on disk; use it only with explicit local-only opt-in.';
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/secret set openai/api-key',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_APPEND,
        value: 'sk-warning-secret',
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_SUBMITTED,
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
        secureSecretMutator: {
          setSecret: async ({ keyName }) => ({
            keyName,
            selector: `secret://${keyName}`,
            backendId: 'unsafe-local-file',
            warning: backendWarning,
          }),
        },
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Secret set completed for /secret set openai/api-key via backend unsafe-local-file.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(`Backend warning: ${backendWarning}`),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('sk-warning-secret')),
      ),
    ).toBe(false);
  });

  it('maps secure local backend-unavailable failures to redacted fallback guidance', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/secret set openai/api-key',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_APPEND,
        value: 'sk-failed-secret',
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_SUBMITTED,
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
        secureSecretMutator: {
          setSecret: async () => {
            throw new RuntimeError(
              GovernorErrorCode.SECRET_BACKEND_UNAVAILABLE,
              'Secret backend "macos-keychain" is unavailable: security CLI is unavailable or keychain access failed.',
              {
                backend: 'macos-keychain',
              },
            );
          },
        },
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Secure local secret mutation could not reach a writable backend for /secret set openai/api-key.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Run /secret status to inspect backend availability, or use the standalone CLI with --backend unsafe-local-file --stdin only if you explicitly want the local-only fallback.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) =>
          line.includes('security CLI is unavailable or keychain access failed.'),
        ),
      ),
    ).toBe(false);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('sk-failed-secret')),
      ),
    ).toBe(false);
  });

  it('maps secure local invalid-input failures to redacted retry guidance', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/secret set openai/api-key',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_APPEND,
        value: 'sk-invalid-secret',
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_SUBMITTED,
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
        secureSecretMutator: {
          setSecret: async () => {
            throw new RuntimeError(
              GovernorErrorCode.SECRET_INPUT_INVALID,
              'captured secret sk-invalid-secret was rejected by the local mutator.',
            );
          },
        },
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Secure local secret mutation rejected the captured input for /secret set openai/api-key.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Re-run /secret set openai/api-key and enter the secret again in secure local capture.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('captured secret sk-invalid-secret was rejected')),
      ),
    ).toBe(false);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('sk-invalid-secret')),
      ),
    ).toBe(false);
  });

  it('maps generic secure local mutation failures to redacted backend-status guidance', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/secret set openai/api-key',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_APPEND,
        value: 'sk-operation-secret',
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_SUBMITTED,
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
        secureSecretMutator: {
          setSecret: async () => {
            throw new RuntimeError(
              GovernorErrorCode.SECRET_OPERATION_FAILED,
              'write failed for sk-operation-secret while storing the secret.',
            );
          },
        },
      }),
    );

    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Secure local secret mutation failed while writing the captured secret for /secret set openai/api-key.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Run /secret status to inspect backend availability, then retry /secret set openai/api-key in secure local capture.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('write failed for sk-operation-secret')),
      ),
    ).toBe(false);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('sk-operation-secret')),
      ),
    ).toBe(false);
  });

  it('clears the secure-local buffer on cancel without leaking the typed secret into transcript or history', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/secret set openai/api-key',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_APPEND,
        value: 'sk-cancel-secret',
      },
      {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_CANCELLED,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/history',
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

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Secure local capture cancelled for /secret set openai/api-key.'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('sk-cancel-secret')),
      ),
    ).toBe(false);
    const historyMatches = result.transcriptItems.flatMap((item) =>
      item.lines.filter((line) => /^1\. \[[^\]]+\] \/secret set openai\/api-key$/u.test(line)),
    );
    expect(historyMatches).toHaveLength(1);
  });

  it('rejects secret suffix slash input before transcript or history can store the raw value', async () => {
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: 'unexpected execution',
      status: 'success',
      summaryLines: ['Summary: unexpected execution'],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      new RecordingSessionShellRenderer() as never,
      () =>
        new StubSessionShellPromptAdapter([
          '/secret set openai/api-key sk-test-secret',
          '/history',
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

    expect(commandExecutor).not.toHaveBeenCalled();
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Do not enter secret in slash text. Re-run /secret set openai/api-key and continue in secure local capture.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('sk-test-secret')),
      ),
    ).toBe(false);
    const historyMatches = result.transcriptItems.flatMap((item) =>
      item.lines.filter((line) => /^1\. \[[^\]]+\] \/secret set openai\/api-key$/u.test(line)),
    );
    expect(historyMatches).toHaveLength(1);
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

  it('keeps direct bridge execution immediate even when /exit follows right away', async () => {
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

    expect(commandExecutor).toHaveBeenCalledWith(
      ['workspace', 'dry-run'],
      expect.objectContaining({
        progressSink: expect.objectContaining({
          publish: expect.any(Function),
        }),
      }),
    );
    expect(renderer.frames.at(-1)?.shellMode).toBe(CliSessionShellMode.SESSION_SHELL);
    expect(renderer.frames.at(-1)?.handoffState).toBe(CliSessionShellHandoffState.IDLE);
    expect(renderer.frames.at(-1)?.commandPreview).toBeNull();
    expect(result.transcriptItems.at(-1)?.lines[0]).toBe('Closed after /exit.');
  });

  it('applies the new theme to the current session shell immediately after workspace set-ui-theme succeeds', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: 'workspace set-ui-theme calm completed',
      status: 'success',
      summaryLines: ['Summary: workspace set-ui-theme calm completed'],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/workspace set-ui-theme calm', '/status', '/exit']),
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
      ['workspace', 'set-ui-theme', 'calm'],
      expect.objectContaining({
        progressSink: expect.objectContaining({
          publish: expect.any(Function),
        }),
      }),
    );
    expect(renderer.frames.some((frame) => frame.themePreset === 'calm')).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Resume=latest persistence=local_orchestration_service theme=calm output=pretty.',
        ),
      ),
    ).toBe(true);
  });

  it('clears the local viewport after direct workspace execution and reports stray /confirm usage', async () => {
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
          frame.commandPreview === null &&
          frame.promptBarLines.includes('? shortcuts · /status · Ctrl+D'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'There is no pending command preview to confirm. Direct slash commands such as /review may already have executed.',
        ),
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
      slashQuery: '/doctor',
      bridgeArgv: ['doctor', '--adapters', '--output', 'pretty'],
      previewCommandLine: 'doctor --adapters --output pretty',
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
      ['doctor', '--adapters', '--output', 'pretty'],
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
        item.lines.includes('Summary: doctor --adapters --output pretty completed'),
      ),
    ).toBe(true);
  });

  it('shows verify removal guidance instead of generic unknown-command copy for /verify inputs', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const commandExecutor = vi.fn<
      (argv: string[]) => Promise<CliSessionShellCommandExecutionResult>
    >(async (argv) => ({
      artifactPaths: [],
      commandLine: argv.join(' '),
      message: `${argv.join(' ')} completed`,
      status: 'success',
      summaryLines: [`Summary: ${argv.join(' ')} completed`],
    }));
    const runner = new CliSessionShellRunner(
      undefined,
      renderer as never,
      () => new StubSessionShellPromptAdapter(['/verify adapters', '/exit']),
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
    expect(commandExecutor).not.toHaveBeenCalled();
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'The public `/verify` slash command has been removed from the session shell.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Use `/doctor` for readiness diagnostics, or `/connect` if you need onboarding changes plus follow-up checks.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('Unknown slash command /verify adapters.'),
      ),
    ).toBe(false);
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
            '/workspace,/workspace switch-branch,/doctor,/connect,/review,/plan,/run,/help',
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

  it('surfaces nested workspace suggestions in the live slash palette once /workspace is typed', async () => {
    const renderer = new RecordingSessionShellRenderer();
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/workspace ',
      },
      {
        type: CliSessionShellInputActionType.PALETTE_CLOSED,
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
      inkRunner.snapshots.some(
        (frame) =>
          frame.composerValue === '/workspace ' &&
          frame.slashSuggestions.map((suggestion) => suggestion.command).join(',') ===
            '/workspace,/workspace dry-run,/workspace execute,/workspace rollback,/workspace clear-config,/workspace switch-branch,/workspace set-ui-theme',
      ),
    ).toBe(true);
  });

  it('persists Ink secure-route rejection guidance in the transcript after the composer is cleared', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/secret set openai/api-key sk-live-secret',
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

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      inkRunner.snapshots.some(
        (frame) =>
          frame.commandPreview ===
            'Do not enter secret in slash text. Re-run /secret set openai/api-key and continue in secure local capture.' &&
          frame.composerValue === '',
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'Do not enter secret in slash text. Re-run /secret set openai/api-key and continue in secure local capture.',
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.includes('sk-live-secret')),
      ),
    ).toBe(false);
  });

  it('renders session.main stream deltas inside the transcript surface before the turn completes', async () => {
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
          frame.commandProgressPanel === undefined &&
          frame.composerValue === '' &&
          frame.transcriptItems.some(
            (item) =>
              item.renderKind === 'live_activity' &&
              item.label === 'Live activity' &&
              item.summaryLine === 'Running · 0s' &&
              item.lines.includes('Planning current workspace answer.'),
          ),
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.some((frame) =>
        frame.transcriptItems.some(
          (item) =>
            item.renderKind === 'live_activity' &&
            item.lines.includes('Tool: repo_status - Inspecting workspace status.'),
        ),
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.some((frame) =>
        frame.transcriptItems.some(
          (item) =>
            item.renderKind === 'live_markdown' &&
            item.markdownSource === '## Workspace status\n\n- clean',
        ),
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.filter((frame) =>
        frame.transcriptItems.some(
          (item) =>
            item.renderKind === 'live_activity' &&
            item.label === 'Live activity' &&
            item.summaryLine === 'Running · 0s',
        ),
      ).length,
    ).toBeGreaterThan(1);
    expect(
      result.transcriptItems.some(
        (item) => item.markdownSource === '## Workspace status\n\n- clean',
      ),
    ).toBe(true);
  });

  it('keeps /plan ai-workflow transcript and history on the user-authored slash input without duplicate history rows', async () => {
    const sessionClient = new RecordingTurnPayloadSessionShellServiceClient();
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/plan ship a tetris clone',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/history',
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
        sessionClient,
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(sessionClient.turnPayloads).toEqual([
      {
        userMessage: [
          'Use the standard planning template to create an execution plan for the following goal.',
          'Do not sync anything to the sprint ledger yet.',
          '',
          'Goal: ship a tetris clone',
        ].join('\n'),
        displayUserMessage: '/plan ship a tetris clone',
      },
    ]);
    expect(
      result.transcriptItems.some((item) => item.lines.includes('/plan ship a tetris clone')),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) => line.endsWith('/plan ship a tetris clone')),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.some((line) =>
          line.includes(
            'Use the standard planning template to create an execution plan for the following goal.',
          ),
        ),
      ),
    ).toBe(false);
    const historyMatches = result.transcriptItems.flatMap((item) =>
      item.lines.filter((line) => /^1\. \[[^\]]+\] \/plan ship a tetris clone$/u.test(line)),
    );
    expect(historyMatches).toHaveLength(1);
  });

  it('shows immediate running feedback for delayed session.main turns before assistant output arrives', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: 'hello',
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
        sessionClient: new DelayedTurnWithoutStreamSessionShellServiceClient(),
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      inkRunner.snapshots.some(
        (frame) =>
          frame.commandProgressPanel === undefined &&
          frame.composerValue === '' &&
          frame.transcriptItems.some(
            (item) =>
              item.renderKind === 'live_activity' &&
              item.label === 'Live activity' &&
              item.summaryLine === 'Running · 0s' &&
              item.lines.length === 0,
          ),
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.some((frame) =>
        frame.transcriptItems.some((item) => item.label === 'You' && item.lines.includes('hello')),
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.filter((frame) =>
        frame.transcriptItems.some(
          (item) =>
            item.renderKind === 'live_activity' &&
            item.label === 'Live activity' &&
            item.summaryLine === 'Running · 0s',
        ),
      ).length,
    ).toBeGreaterThan(1);
    expect(
      result.transcriptItems.some(
        (item) => item.markdownSource === 'Hello back from delayed turn.',
      ),
    ).toBe(true);
  });

  it('keeps showing live running feedback after auto-recovering into a new session before delayed output arrives', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '帮我 cr',
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
    const renderer = new RecordingSessionShellRenderer();
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
        sessionClient: new MissingSessionThenDelayedTurnWithoutStreamSessionShellServiceClient(),
      }),
    );

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes('A new session was created so the shell can stay attached.'),
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.some((frame) =>
        frame.transcriptItems.some(
          (item) =>
            item.renderKind === 'live_activity' &&
            item.label === 'Live activity' &&
            item.summaryLine === 'Running · 0s' &&
            item.lines.includes(
              'The shell is retrying your latest message in a new attached session.',
            ),
        ),
      ),
    ).toBe(true);
    expect(
      inkRunner.snapshots.some((frame) =>
        frame.transcriptItems.some(
          (item) => item.label === 'You' && item.lines.includes('帮我 cr'),
        ),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some(
        (item) => item.markdownSource === 'Hello back from delayed turn.',
      ),
    ).toBe(true);
  });

  it('recalls prior composer inputs with ArrowUp and restores the draft with ArrowDown in Ink mode', async () => {
    const inkRunner = new StubSessionShellInkRunner([
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: 'hello governor',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: 'hel',
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_HISTORY_PREVIOUS,
      },
      {
        type: CliSessionShellInputActionType.COMPOSER_HISTORY_NEXT,
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

    const result = await runner.run(DEFAULT_RUN_OPTIONS());

    expect(result.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
    expect(inkRunner.snapshots.some((frame) => frame.composerValue === 'hello governor')).toBe(
      true,
    );
    expect(inkRunner.snapshots.some((frame) => frame.composerValue === 'hel')).toBe(true);
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
    expect(
      result.transcriptItems.some(
        (item) =>
          item.renderKind === 'command_recap' &&
          item.details?.lines.some((line) => line.endsWith('doctor preflight running')) &&
          item.details.lines.some((line) => line.endsWith('Summary: doctor completed')),
      ),
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

  it('clears the Ink viewport after direct workspace execution and reports stray /confirm usage', async () => {
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
          frame.commandPreview === null &&
          frame.promptBarLines.includes('? shortcuts · /status · Ctrl+D'),
      ),
    ).toBe(true);
    expect(
      result.transcriptItems.some((item) =>
        item.lines.includes(
          'There is no pending command preview to confirm. Direct slash commands such as /review may already have executed.',
        ),
      ),
    ).toBe(true);
  });
});
