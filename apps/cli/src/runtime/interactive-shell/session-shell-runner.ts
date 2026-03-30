import { spawn } from 'node:child_process';

import {
  OrchestrationSessionRouteId,
  OrchestrationSessionTranscriptRole,
  type OrchestrationStartSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import {
  BaseError,
  GovernorErrorCode,
  RuntimeError,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  CLI_REACT_THEME_PRESET_ORDER,
  CLI_REACT_THEME_VALUES,
  type CliReactThemePreset,
  DEFAULT_CLI_REACT_THEME_PRESET,
} from '../../constants/cli-react-theme.constant.js';
import {
  CLI_SESSION_SHELL_PROMPT,
  CliSessionShellExitReason,
  CliSessionShellHandoffState,
  CliSessionShellInputMode,
  CliSessionShellMode,
  CliSessionShellPersistenceOwner,
  CliSessionTranscriptRole,
} from '../../constants/cli-session-shell.constant.js';
import type {
  CliSessionShellCommandExecutionResult,
  CliSessionShellPassthroughResult,
  CliSessionShellPromptAdapter,
  CliSessionShellRunOptions,
  CliSessionShellRunResult,
  CliSessionShellTranscriptItem,
  CliSessionShellViewModel,
} from '../../types/index.js';
import { CliSessionShellReadlinePromptAdapter } from './session-shell-readline-prompt-adapter.js';
import { CliSessionShellStderrRenderer } from './session-shell-stderr-renderer.js';
import { CliSessionShellTranscriptStore } from './session-shell-transcript-store.js';
import { CliSessionSlashCommandRegistry } from './session-slash-command-registry.js';

interface CliSessionShellHistoryEntry {
  recordedAt: string;
  value: string;
}

interface PendingCommandExecution {
  argv: string[];
  previewCommandLine: string;
}

interface CliSessionShellRuntimeState {
  currentRouteId: string;
  inputHistory: CliSessionShellHistoryEntry[];
  pendingCommand: PendingCommandExecution | null;
}

/**
 * Owns the service-backed session-shell lifecycle for the CLI presenter.
 */
export class CliSessionShellRunner {
  public constructor(
    private readonly slashCommandRegistry: CliSessionSlashCommandRegistry = new CliSessionSlashCommandRegistry(),
    private readonly renderer: CliSessionShellStderrRenderer = new CliSessionShellStderrRenderer(),
    private readonly promptAdapterFactory: () => CliSessionShellPromptAdapter = () =>
      new CliSessionShellReadlinePromptAdapter(),
    private readonly nowProvider: () => Date = () => new Date(),
  ) {}

  /**
   * Runs one session-shell lifecycle until `/exit`, `Ctrl+C`, or `Ctrl+D` closes the foreground UI.
   * @param options Runtime localization, orchestration client, cwd, and output-contract context.
   * @returns Exit reason plus the final presenter transcript snapshot.
   */
  public async run(options: CliSessionShellRunOptions): Promise<CliSessionShellRunResult> {
    const promptAdapter = this.promptAdapterFactory();
    const transcriptStore = new CliSessionShellTranscriptStore();
    const bootstrapped = await this.bootstrapSession(options);
    const runtimeState: CliSessionShellRuntimeState = {
      currentRouteId:
        bootstrapped.session.session.currentRouteId ?? OrchestrationSessionRouteId.MAIN,
      inputHistory: [],
      pendingCommand: null,
    };
    const viewModel = this.createInitialViewModel(
      options,
      bootstrapped.session.session.sessionId,
      bootstrapped.resumeSelector,
    );
    await this.syncTranscript(viewModel, transcriptStore, options, runtimeState, true);

    if (bootstrapped.startupNoticeLines.length > 0) {
      this.appendLocalTranscriptItem(viewModel, {
        role: CliSessionTranscriptRole.SYSTEM,
        label: options.translate('cli.sessionShell.transcript.systemLabel'),
        lines: bootstrapped.startupNoticeLines,
      });
    }

    if (options.initialPrompt?.trim()) {
      await this.handlePlainTextTurn(
        options.initialPrompt.trim(),
        viewModel,
        transcriptStore,
        options,
        runtimeState,
      );
    }

    this.renderer.render(viewModel);

    try {
      while (true) {
        const inputLine = await promptAdapter.readLine(CLI_SESSION_SHELL_PROMPT);

        if (inputLine === null) {
          const exitResult = this.completeExit(
            viewModel,
            options,
            runtimeState,
            CliSessionShellExitReason.EOF,
          );
          this.renderer.render(viewModel);
          return exitResult;
        }

        const trimmedLine = inputLine.trim();
        if (trimmedLine.length === 0) {
          this.resetPromptState(viewModel, options, runtimeState);
          this.renderer.render(viewModel);
          continue;
        }

        viewModel.composerValue = trimmedLine;

        if (trimmedLine.startsWith('!')) {
          await this.handleShellPassthrough(
            trimmedLine,
            viewModel,
            transcriptStore,
            options,
            runtimeState,
          );
          this.renderer.render(viewModel);
          continue;
        }

        if (trimmedLine.startsWith('/')) {
          const exitResult = await this.handleSlashCommand(
            trimmedLine,
            promptAdapter,
            viewModel,
            transcriptStore,
            options,
            runtimeState,
          );
          this.renderer.render(viewModel);
          if (exitResult) {
            return exitResult;
          }
          continue;
        }

        await this.handlePlainTextTurn(
          trimmedLine,
          viewModel,
          transcriptStore,
          options,
          runtimeState,
        );
        this.renderer.render(viewModel);
      }
    } catch (error) {
      if (
        error instanceof BaseError &&
        error.code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED
      ) {
        const exitResult = this.completeExit(
          viewModel,
          options,
          runtimeState,
          CliSessionShellExitReason.SIGINT,
        );
        this.renderer.render(viewModel);
        return exitResult;
      }

      throw error;
    } finally {
      promptAdapter.close();
    }
  }

  private async bootstrapSession(options: CliSessionShellRunOptions): Promise<{
    session: OrchestrationStartSessionResponse;
    resumeSelector: string;
    startupNoticeLines: string[];
  }> {
    if (!options.resumeOnStartup) {
      const startedSession = await options.sessionClient.startSession();
      return {
        session: startedSession,
        resumeSelector: options.translate('cli.sessionShell.resumeSelector.latest'),
        startupNoticeLines: [],
      };
    }

    try {
      const resumedSession = await options.sessionClient.resumeSession(
        options.requestedSessionId ?? undefined,
      );
      return {
        session: {
          created: false,
          session: resumedSession.session,
          latestEventSequence: resumedSession.latestEventSequence,
          nextCursor: resumedSession.nextCursor,
        },
        resumeSelector: resumedSession.resumeSelector,
        startupNoticeLines: [],
      };
    } catch (error) {
      const standardizedError = standardizeError(error);
      const startedSession = await options.sessionClient.startSession();
      return {
        session: startedSession,
        resumeSelector: options.translate('cli.sessionShell.resumeSelector.latest'),
        startupNoticeLines: [
          options.translate('cli.sessionShell.responses.resumeFailed', {
            resumeSelector:
              options.requestedSessionId ??
              options.translate('cli.sessionShell.resumeSelector.latest'),
            reason: standardizedError.message,
          }),
          options.translate('cli.sessionShell.responses.resumeRecoveredWithNewSession'),
        ],
      };
    }
  }

  private async handlePlainTextTurn(
    inputLine: string,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): Promise<void> {
    this.recordHistory(inputLine, runtimeState);
    try {
      await options.sessionClient.sendMainTurn(viewModel.sessionId, inputLine);
      await this.syncTranscript(viewModel, transcriptStore, options, runtimeState);
    } catch (error) {
      const standardizedError = standardizeError(error);
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SYSTEM,
        [
          options.translate('cli.sessionShell.responses.turnFailed', {
            reason: standardizedError.message,
          }),
          options.translate('cli.sessionShell.responses.turnRecoverableHint'),
        ],
      );
    }

    this.resetPromptState(viewModel, options, runtimeState);
  }

  private async handleShellPassthrough(
    inputLine: string,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): Promise<void> {
    const commandLine = inputLine.slice(1).trim();
    if (commandLine.length === 0) {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SYSTEM,
        [options.translate('cli.sessionShell.responses.passthroughRequiresCommand')],
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return;
    }

    this.recordHistory(inputLine, runtimeState);
    await this.appendServiceTranscriptItem(
      viewModel,
      transcriptStore,
      options,
      runtimeState,
      OrchestrationSessionTranscriptRole.SLASH_COMMAND,
      [inputLine],
    );
    const passthroughExecutor =
      options.passthroughExecutor ??
      (async (resolvedCommandLine: string) =>
        this.executePassthroughCommand(resolvedCommandLine, options.currentWorkingDirectory));

    try {
      const result = await passthroughExecutor(commandLine);
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.ASSISTANT,
        this.buildPassthroughSummaryLines(result, options),
      );
    } catch (error) {
      const standardizedError = standardizeError(error);
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SYSTEM,
        [
          options.translate('cli.sessionShell.responses.passthroughFailed', {
            reason: standardizedError.message,
          }),
        ],
      );
    }

    this.resetPromptState(viewModel, options, runtimeState);
  }

  private async handleSlashCommand(
    query: string,
    promptAdapter: CliSessionShellPromptAdapter,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): Promise<CliSessionShellRunResult | null> {
    this.recordHistory(query, runtimeState);
    viewModel.inputMode = CliSessionShellInputMode.SLASH_COMMAND;
    viewModel.slashQuery = query;
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest(query, options.translate);
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    await this.appendServiceTranscriptItem(
      viewModel,
      transcriptStore,
      options,
      runtimeState,
      OrchestrationSessionTranscriptRole.SLASH_COMMAND,
      [query],
    );

    const exactCommand = this.slashCommandRegistry.resolveAction(query);
    if (!exactCommand) {
      await this.handleUnknownSlashCommand(
        query,
        viewModel,
        transcriptStore,
        options,
        runtimeState,
      );
      return null;
    }

    if (exactCommand.command === '/help') {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.ASSISTANT,
        this.slashCommandRegistry
          .listCommands(options.translate)
          .map((command) => `${command.command} - ${command.summary}`),
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return null;
    }

    if (exactCommand.command === '/resume') {
      await this.handleResumeCommand(query, viewModel, transcriptStore, options, runtimeState);
      this.resetPromptState(viewModel, options, runtimeState);
      return null;
    }

    if (exactCommand.command === '/exit') {
      return this.completeExit(
        viewModel,
        options,
        runtimeState,
        CliSessionShellExitReason.SLASH_EXIT,
      );
    }

    if (exactCommand.command === '/clear') {
      transcriptStore.clearView();
      viewModel.transcriptItems = [];
      this.appendLocalTranscriptItem(viewModel, {
        role: CliSessionTranscriptRole.SYSTEM,
        label: options.translate('cli.sessionShell.transcript.systemLabel'),
        lines: [options.translate('cli.sessionShell.responses.localTranscriptCleared')],
      });
      this.resetPromptState(viewModel, options, runtimeState);
      return null;
    }

    if (exactCommand.command === '/confirm') {
      await this.executePendingCommand(viewModel, transcriptStore, options, runtimeState);
      return null;
    }

    if (exactCommand.command === '/cancel') {
      if (!runtimeState.pendingCommand) {
        await this.appendServiceTranscriptItem(
          viewModel,
          transcriptStore,
          options,
          runtimeState,
          OrchestrationSessionTranscriptRole.SYSTEM,
          [options.translate('cli.sessionShell.responses.cancelWithoutPendingCommand')],
        );
      } else {
        runtimeState.pendingCommand = null;
        await this.appendServiceTranscriptItem(
          viewModel,
          transcriptStore,
          options,
          runtimeState,
          OrchestrationSessionTranscriptRole.SYSTEM,
          [options.translate('cli.sessionShell.responses.commandCancelled')],
        );
      }
      this.resetPromptState(viewModel, options, runtimeState);
      return null;
    }

    if (exactCommand.command === '/history') {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.ASSISTANT,
        this.buildHistoryLines(runtimeState, options),
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return null;
    }

    if (exactCommand.command === '/search') {
      const queryArgument = this.resolveSlashCommandArgument(query);
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.ASSISTANT,
        this.buildSearchLines(queryArgument, transcriptStore, runtimeState, options),
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return null;
    }

    if (exactCommand.command === '/multiline') {
      await this.handleMultilineCommand(
        promptAdapter,
        viewModel,
        transcriptStore,
        options,
        runtimeState,
      );
      return null;
    }

    if (exactCommand.command === '/theme') {
      await this.handleThemeCommand(query, viewModel, transcriptStore, options, runtimeState);
      return null;
    }

    if (exactCommand.command === '/agent') {
      await this.handleAgentCommand(query, viewModel, transcriptStore, options, runtimeState);
      return null;
    }

    if (!exactCommand.bridgeArgv) {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SYSTEM,
        [options.translate('cli.sessionShell.responses.commandNotExecutable')],
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return null;
    }

    const nextPendingCommand = {
      argv: exactCommand.bridgeArgv,
      previewCommandLine: exactCommand.bridgeArgv.join(' '),
    };
    runtimeState.pendingCommand = nextPendingCommand;

    if (exactCommand.executionMode === 'direct') {
      await this.executePendingCommand(viewModel, transcriptStore, options, runtimeState);
      return null;
    }

    viewModel.commandPreview = options.translate('cli.sessionShell.responses.commandPreview', {
      command: nextPendingCommand.previewCommandLine,
    });
    viewModel.shellMode = CliSessionShellMode.COMMAND_HANDOFF_PREVIEW;
    viewModel.handoffState = CliSessionShellHandoffState.PREVIEWING;
    viewModel.composerValue = '';
    viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
    await this.appendServiceTranscriptItem(
      viewModel,
      transcriptStore,
      options,
      runtimeState,
      OrchestrationSessionTranscriptRole.ASSISTANT,
      [
        options.translate('cli.sessionShell.responses.commandHandoffPending', {
          command: nextPendingCommand.previewCommandLine,
        }),
        options.translate('cli.sessionShell.responses.commandConfirmHint'),
      ],
    );
    return null;
  }

  private async handleUnknownSlashCommand(
    query: string,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): Promise<void> {
    const suggestions = this.slashCommandRegistry.suggest(query, options.translate);
    if (suggestions.length > 0) {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.ASSISTANT,
        [
          options.translate('cli.sessionShell.responses.partialSlashMatch', {
            query,
          }),
          ...suggestions.map((suggestion) => `${suggestion.command} - ${suggestion.summary}`),
        ],
      );
    } else {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.ASSISTANT,
        [
          options.translate('cli.sessionShell.responses.unknownSlashCommand', {
            command: query,
          }),
          options.translate('cli.sessionShell.responses.trySlashHelp'),
        ],
      );
    }
    this.resetPromptState(viewModel, options, runtimeState);
  }

  private async handleResumeCommand(
    query: string,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): Promise<void> {
    const requestedSessionId = this.resolveSlashCommandArgument(query);

    try {
      const resumedSession = await options.sessionClient.resumeSession(requestedSessionId);
      viewModel.sessionId = resumedSession.session.sessionId;
      viewModel.resumeSelector = resumedSession.resumeSelector;
      runtimeState.currentRouteId =
        resumedSession.session.currentRouteId ?? OrchestrationSessionRouteId.MAIN;
      runtimeState.pendingCommand = null;
      await this.syncTranscript(viewModel, transcriptStore, options, runtimeState, true);
    } catch (error) {
      const standardizedError = standardizeError(error);
      const knownSessions = await options.sessionClient
        .listSessions({
          limit: 5,
        })
        .catch(() => undefined);
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SYSTEM,
        [
          options.translate('cli.sessionShell.responses.resumeFailed', {
            resumeSelector:
              requestedSessionId ?? options.translate('cli.sessionShell.resumeSelector.latest'),
            reason: standardizedError.message,
          }),
          knownSessions && knownSessions.sessions.length > 0
            ? options.translate('cli.sessionShell.responses.resumeAvailableSessions', {
                sessionIds: knownSessions.sessions.map((session) => session.sessionId).join(', '),
              })
            : options.translate('cli.sessionShell.responses.resumeRecoverableHint'),
        ],
      );
    }
  }

  private async handleMultilineCommand(
    promptAdapter: CliSessionShellPromptAdapter,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): Promise<void> {
    const terminator = '.';
    const multilineValue = promptAdapter.readMultiline
      ? await promptAdapter.readMultiline(
          options.translate('cli.sessionShell.multilinePrompt', { terminator }),
          terminator,
        )
      : await this.readMultilineFallback(
          promptAdapter,
          options.translate('cli.sessionShell.multilinePrompt', { terminator }),
          terminator,
        );

    if (!multilineValue || multilineValue.trim().length === 0) {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SYSTEM,
        [options.translate('cli.sessionShell.responses.multilineCancelled')],
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return;
    }

    await this.handlePlainTextTurn(
      multilineValue,
      viewModel,
      transcriptStore,
      options,
      runtimeState,
    );
  }

  private async handleThemeCommand(
    query: string,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): Promise<void> {
    const requestedTheme = this.resolveSlashCommandArgument(query)?.toLowerCase();
    const availableThemes = CLI_REACT_THEME_PRESET_ORDER.join(', ');
    if (!requestedTheme) {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.ASSISTANT,
        [
          options.translate('cli.sessionShell.responses.themeCurrent', {
            theme: viewModel.themePreset ?? DEFAULT_CLI_REACT_THEME_PRESET,
          }),
          options.translate('cli.sessionShell.responses.themeAvailable', {
            themes: availableThemes,
          }),
        ],
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return;
    }

    if (!CLI_REACT_THEME_VALUES.has(requestedTheme)) {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SYSTEM,
        [
          options.translate('cli.sessionShell.responses.themeUnknown', {
            theme: requestedTheme,
            themes: availableThemes,
          }),
        ],
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return;
    }

    viewModel.themePreset = requestedTheme as CliReactThemePreset;
    await this.appendServiceTranscriptItem(
      viewModel,
      transcriptStore,
      options,
      runtimeState,
      OrchestrationSessionTranscriptRole.ASSISTANT,
      [
        options.translate('cli.sessionShell.responses.themeUpdated', {
          theme: requestedTheme,
        }),
      ],
    );
    this.resetPromptState(viewModel, options, runtimeState);
  }

  private async handleAgentCommand(
    query: string,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): Promise<void> {
    const requestedRoute = this.resolveSlashCommandArgument(query);
    if (!requestedRoute) {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.ASSISTANT,
        [
          options.translate('cli.sessionShell.responses.agentCurrent', {
            routeId: runtimeState.currentRouteId,
          }),
        ],
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return;
    }

    if (requestedRoute !== OrchestrationSessionRouteId.MAIN && requestedRoute !== 'main') {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SYSTEM,
        [
          options.translate('cli.sessionShell.responses.agentUnsupported', {
            routeId: requestedRoute,
          }),
        ],
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return;
    }

    runtimeState.currentRouteId = OrchestrationSessionRouteId.MAIN;
    await this.appendServiceTranscriptItem(
      viewModel,
      transcriptStore,
      options,
      runtimeState,
      OrchestrationSessionTranscriptRole.ASSISTANT,
      [
        options.translate('cli.sessionShell.responses.agentUpdated', {
          routeId: runtimeState.currentRouteId,
        }),
      ],
    );
    this.resetPromptState(viewModel, options, runtimeState);
  }

  private async executePendingCommand(
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): Promise<void> {
    if (!runtimeState.pendingCommand) {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SYSTEM,
        [options.translate('cli.sessionShell.responses.confirmWithoutPendingCommand')],
      );
      this.resetPromptState(viewModel, options, runtimeState);
      return;
    }

    if (!options.commandExecutor) {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SYSTEM,
        [options.translate('cli.sessionShell.responses.commandBridgeUnavailable')],
      );
      runtimeState.pendingCommand = null;
      this.resetPromptState(viewModel, options, runtimeState);
      return;
    }

    const pendingCommand = runtimeState.pendingCommand;
    viewModel.shellMode = CliSessionShellMode.COMMAND_RUNNING;
    viewModel.handoffState = CliSessionShellHandoffState.RUNNING;
    viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
    this.renderer.render(viewModel);

    const executionResult = await options.commandExecutor(pendingCommand.argv).catch((error) => {
      const standardizedError = standardizeError(error);
      return {
        artifactPaths: [],
        commandLine: pendingCommand.previewCommandLine,
        message: standardizedError.message,
        status: 'error',
        summaryLines: [
          options.translate('cli.sessionShell.responses.commandExecutionFailed', {
            command: pendingCommand.previewCommandLine,
            reason: standardizedError.message,
          }),
        ],
      } satisfies CliSessionShellCommandExecutionResult;
    });

    await this.appendServiceTranscriptItem(
      viewModel,
      transcriptStore,
      options,
      runtimeState,
      executionResult.status === 'success'
        ? OrchestrationSessionTranscriptRole.ASSISTANT
        : OrchestrationSessionTranscriptRole.SYSTEM,
      this.buildCommandExecutionLines(executionResult, options),
      executionResult.artifactPaths.length > 0
        ? {
            artifactPaths: executionResult.artifactPaths,
            commandLine: executionResult.commandLine,
          }
        : {
            commandLine: executionResult.commandLine,
          },
    );

    runtimeState.pendingCommand = null;
    viewModel.handoffState =
      executionResult.status === 'success'
        ? CliSessionShellHandoffState.SUCCESS
        : CliSessionShellHandoffState.FAILURE;
    this.resetPromptState(viewModel, options, runtimeState);
  }

  private completeExit(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
    exitReason: CliSessionShellExitReason,
  ): CliSessionShellRunResult {
    runtimeState.pendingCommand = null;
    viewModel.shellMode = CliSessionShellMode.SESSION_SHELL;
    viewModel.inputMode = CliSessionShellInputMode.PLAIN_TEXT;
    viewModel.slashQuery = '';
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest('', options.translate);
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    viewModel.commandPreview = null;
    viewModel.handoffState = CliSessionShellHandoffState.IDLE;
    viewModel.composerValue = '';
    viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
    const exitMessage =
      exitReason === CliSessionShellExitReason.SLASH_EXIT
        ? options.translate('cli.sessionShell.responses.exitBySlash')
        : exitReason === CliSessionShellExitReason.SIGINT
          ? options.translate('cli.sessionShell.responses.exitBySigint')
          : options.translate('cli.sessionShell.responses.exitByEof');
    this.appendLocalTranscriptItem(viewModel, {
      role: CliSessionTranscriptRole.SYSTEM,
      label: options.translate('cli.sessionShell.transcript.systemLabel'),
      lines: [exitMessage, options.translate('cli.sessionShell.responses.exitKeepsTranscript')],
    });

    return {
      exitReason,
      transcriptItems: [...viewModel.transcriptItems],
    };
  }

  private createInitialViewModel(
    options: CliSessionShellRunOptions,
    sessionId: string,
    resumeSelector: string,
  ): CliSessionShellViewModel {
    const slashSuggestions = this.slashCommandRegistry.suggest('', options.translate);
    return {
      sessionId,
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.PLAIN_TEXT,
      transcriptItems: [],
      transcriptTitle: options.translate('cli.sessionShell.sections.transcript'),
      composerValue: '',
      composerTitle: options.translate('cli.sessionShell.sections.composer'),
      composerPlaceholder: options.translate('cli.sessionShell.composer.placeholder'),
      slashQuery: '',
      slashSuggestions,
      highlightedCommand: slashSuggestions[0]?.command ?? null,
      slashPaletteTitle: options.translate('cli.sessionShell.sections.slashPalette'),
      slashPaletteEmptyState: options.translate('cli.sessionShell.palette.emptyState'),
      commandPreview: null,
      handoffState: CliSessionShellHandoffState.IDLE,
      cwd: options.currentWorkingDirectory,
      workspaceSummary: options.workspaceSummary,
      outputContract: options.outputMode,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector,
      title: options.translate('cli.sessionShell.title'),
      subtitle: options.translate('cli.sessionShell.subtitle'),
      promptBarTitle: options.translate('cli.sessionShell.sections.promptBar'),
      promptBarLines: [],
      themePreset: options.uiTheme,
    };
  }

  private async syncTranscript(
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
    reset = false,
  ): Promise<void> {
    if (reset) {
      transcriptStore.reset(viewModel.sessionId);
    }

    const nextCursor = transcriptStore.getNextCursor();
    const subscription = await options.sessionClient.subscribeSession(
      nextCursor
        ? {
            sessionId: viewModel.sessionId,
            cursor: nextCursor,
          }
        : {
            sessionId: viewModel.sessionId,
          },
    );
    viewModel.transcriptItems = transcriptStore.applyEvents(
      viewModel.sessionId,
      subscription.events,
      options.translate,
    );
    runtimeState.currentRouteId =
      subscription.session.currentRouteId ?? OrchestrationSessionRouteId.MAIN;
    viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
  }

  private buildPromptBarLines(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): string[] {
    const lines = [
      options.translate('cli.sessionShell.promptBar.modeLine', {
        shellMode: viewModel.shellMode,
        inputMode: viewModel.inputMode,
        handoffState: viewModel.handoffState,
      }),
      options.translate('cli.sessionShell.promptBar.persistenceLine', {
        sessionId: viewModel.sessionId,
        persistenceOwner: viewModel.persistenceOwner,
        resumeSelector: viewModel.resumeSelector,
      }),
      options.translate('cli.sessionShell.promptBar.routeLine', {
        routeId: runtimeState.currentRouteId,
        theme: viewModel.themePreset ?? DEFAULT_CLI_REACT_THEME_PRESET,
        historyCount: String(runtimeState.inputHistory.length),
      }),
      options.translate('cli.sessionShell.promptBar.workspaceLine', {
        cwd: viewModel.cwd,
        workspace: viewModel.workspaceSummary,
      }),
      options.translate('cli.sessionShell.promptBar.shortcuts'),
    ];

    if (viewModel.commandPreview) {
      lines.push(viewModel.commandPreview);
    }

    return lines;
  }

  private resetPromptState(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): void {
    viewModel.shellMode = CliSessionShellMode.SESSION_SHELL;
    viewModel.inputMode = CliSessionShellInputMode.PLAIN_TEXT;
    viewModel.slashQuery = '';
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest('', options.translate);
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    viewModel.commandPreview = null;
    viewModel.handoffState = CliSessionShellHandoffState.IDLE;
    viewModel.composerValue = '';
    viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
  }

  private resolveSlashCommandArgument(query: string): string | undefined {
    const [, ...argumentsList] = query.trim().split(/\s+/u);
    const resolvedArgument = argumentsList.join(' ').trim();
    return resolvedArgument.length > 0 ? resolvedArgument : undefined;
  }

  private appendLocalTranscriptItem(
    viewModel: CliSessionShellViewModel,
    item: Omit<CliSessionShellTranscriptItem, 'id'>,
  ): void {
    viewModel.transcriptItems.push({
      id: `${viewModel.sessionId}:${viewModel.transcriptItems.length + 1}:local`,
      ...item,
    });
  }

  private async appendServiceTranscriptItem(
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
    role: OrchestrationSessionTranscriptRole,
    lines: string[],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await options.sessionClient.appendMessage(viewModel.sessionId, role, lines, metadata);
    await this.syncTranscript(viewModel, transcriptStore, options, runtimeState);
  }

  private recordHistory(value: string, runtimeState: CliSessionShellRuntimeState): void {
    runtimeState.inputHistory.push({
      recordedAt: this.nowProvider().toISOString(),
      value,
    });
    if (runtimeState.inputHistory.length > 20) {
      runtimeState.inputHistory.splice(0, runtimeState.inputHistory.length - 20);
    }
  }

  private buildHistoryLines(
    runtimeState: CliSessionShellRuntimeState,
    options: CliSessionShellRunOptions,
  ): string[] {
    if (runtimeState.inputHistory.length === 0) {
      return [options.translate('cli.sessionShell.responses.historyEmpty')];
    }

    return runtimeState.inputHistory
      .slice(-10)
      .map((entry, index) => `${index + 1}. [${entry.recordedAt}] ${entry.value}`);
  }

  private buildSearchLines(
    query: string | undefined,
    transcriptStore: CliSessionShellTranscriptStore,
    runtimeState: CliSessionShellRuntimeState,
    options: CliSessionShellRunOptions,
  ): string[] {
    if (!query) {
      return [options.translate('cli.sessionShell.responses.searchRequiresQuery')];
    }

    const normalizedQuery = query.toLowerCase();
    const transcriptMatches = transcriptStore
      .listItems()
      .flatMap((item) => item.lines)
      .filter((line) => line.toLowerCase().includes(normalizedQuery))
      .slice(0, 5)
      .map((line) => `transcript: ${line}`);
    const historyMatches = runtimeState.inputHistory
      .filter((entry) => entry.value.toLowerCase().includes(normalizedQuery))
      .slice(-5)
      .map((entry) => `history: ${entry.value}`);
    const matches = [...transcriptMatches, ...historyMatches];

    if (matches.length === 0) {
      return [
        options.translate('cli.sessionShell.responses.searchNoMatch', {
          query,
        }),
      ];
    }

    return [
      options.translate('cli.sessionShell.responses.searchMatches', {
        query,
      }),
      ...matches,
    ];
  }

  private buildCommandExecutionLines(
    result: CliSessionShellCommandExecutionResult,
    options: CliSessionShellRunOptions,
  ): string[] {
    const artifactLines = result.artifactPaths.map((artifactPath) =>
      options.translate('cli.sessionShell.responses.commandArtifact', {
        artifactPath,
      }),
    );

    return [
      result.status === 'success'
        ? options.translate('cli.sessionShell.responses.commandExecutionSucceeded', {
            command: result.commandLine,
          })
        : options.translate('cli.sessionShell.responses.commandExecutionFailed', {
            command: result.commandLine,
            reason: result.message,
          }),
      ...result.summaryLines,
      ...artifactLines,
    ];
  }

  private buildPassthroughSummaryLines(
    result: CliSessionShellPassthroughResult,
    options: CliSessionShellRunOptions,
  ): string[] {
    const stdoutLines = result.stdoutLines.slice(0, 10).map((line) => `stdout: ${line}`);
    const stderrLines = result.stderrLines.slice(0, 10).map((line) => `stderr: ${line}`);
    return [
      options.translate('cli.sessionShell.responses.passthroughCompleted', {
        command: result.commandLine,
        exitCode: String(result.exitCode),
      }),
      ...stdoutLines,
      ...stderrLines,
    ];
  }

  private async readMultilineFallback(
    promptAdapter: CliSessionShellPromptAdapter,
    prompt: string,
    terminator: string,
  ): Promise<string | null> {
    const lines: string[] = [];
    while (true) {
      const nextLine = await promptAdapter.readLine(lines.length === 0 ? prompt : '... ');
      if (nextLine === null) {
        return lines.length > 0 ? lines.join('\n') : null;
      }
      if (nextLine.trim() === terminator) {
        return lines.join('\n');
      }
      lines.push(nextLine);
    }
  }

  private async executePassthroughCommand(
    commandLine: string,
    currentWorkingDirectory: string,
  ): Promise<CliSessionShellPassthroughResult> {
    return await new Promise<CliSessionShellPassthroughResult>((resolve, reject) => {
      const stdoutBuffer: string[] = [];
      const stderrBuffer: string[] = [];
      const child = spawn(commandLine, {
        cwd: currentWorkingDirectory,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      child.stdout.on('data', (chunk: Buffer | string) => {
        stdoutBuffer.push(chunk.toString());
      });
      child.stderr.on('data', (chunk: Buffer | string) => {
        stderrBuffer.push(chunk.toString());
      });
      child.on('error', (error) => {
        reject(
          new RuntimeError(
            GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
            `Shell passthrough process launch failed: ${standardizeError(error).message}`,
            {
              commandLine,
            },
          ),
        );
      });
      child.on('close', (code) => {
        resolve({
          commandLine,
          exitCode: code ?? 0,
          stdoutLines: stdoutBuffer
            .join('')
            .split(/\r?\n/u)
            .filter((line) => line.length > 0),
          stderrLines: stderrBuffer
            .join('')
            .split(/\r?\n/u)
            .filter((line) => line.length > 0),
        });
      });
    });
  }
}
