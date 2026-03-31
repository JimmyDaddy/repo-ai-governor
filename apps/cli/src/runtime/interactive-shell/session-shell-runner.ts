import { spawn } from 'node:child_process';
import { stderr, stdin } from 'node:process';

import {
  type OrchestrationSessionEvent,
  OrchestrationSessionEventType,
  OrchestrationSessionRouteId,
  OrchestrationSessionTranscriptRole,
  type OrchestrationStartSessionResponse,
  type OrchestrationSubscribeSessionResponse,
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
  CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT,
  CLI_SESSION_SHELL_PROMPT,
  CliSessionShellExitReason,
  CliSessionShellForegroundFocusTarget,
  CliSessionShellForegroundInputOwner,
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
import { CliSessionShellCommandProgressDock } from './session-shell-command-progress-dock.js';
import { CliSessionShellInkController } from './session-shell-ink-controller.js';
import { CliSessionShellInkRunner } from './session-shell-ink-runner.js';
import { CliSessionShellReadlinePromptAdapter } from './session-shell-readline-prompt-adapter.js';
import { CliSessionShellStderrRenderer } from './session-shell-stderr-renderer.js';
import { CliSessionShellTranscriptStore } from './session-shell-transcript-store.js';
import { CliSessionShellTurnProgressDock } from './session-shell-turn-progress-dock.js';
import { CliSessionSlashCommandRegistry } from './session-slash-command-registry.js';

interface CliSessionShellHistoryEntry {
  recordedAt: string;
  value: string;
}

interface PendingCommandExecutionStep {
  argv: string[];
  slashQuery: string;
  previewCommandLine: string;
}

interface PendingCommandExecution {
  handoffTurnId: string;
  executionMode: 'preview_confirm' | 'direct_execute';
  sourceEventSequence: number;
  steps: PendingCommandExecutionStep[];
  previewCommandLine: string;
}

interface SessionMainHandoffResolutionRecord {
  turnId: string;
  state: 'cancelled' | 'executed' | 'failed';
}

const SESSION_MAIN_HANDOFF_RESOLUTION_METADATA_KEY = 'sessionMainHandoffResolution';
const SESSION_MAIN_TURN_POLL_INTERVAL_MS = 25;

interface CliSessionShellRuntimeState {
  currentRouteId: string;
  inputHistory: CliSessionShellHistoryEntry[];
  pendingCommand: PendingCommandExecution | null;
}

/**
 * Owns the service-backed session-shell lifecycle for the CLI presenter.
 */
export class CliSessionShellRunner {
  private activeInkRunner: CliSessionShellInkRunner | null = null;

  public constructor(
    private readonly slashCommandRegistry: CliSessionSlashCommandRegistry = new CliSessionSlashCommandRegistry(),
    private readonly renderer: CliSessionShellStderrRenderer = new CliSessionShellStderrRenderer(),
    private readonly promptAdapterFactory: () => CliSessionShellPromptAdapter = () =>
      new CliSessionShellReadlinePromptAdapter(),
    private readonly inkControllerFactory: () => CliSessionShellInkController = () =>
      new CliSessionShellInkController(),
    private readonly inkRunnerFactory: () => CliSessionShellInkRunner = () =>
      new CliSessionShellInkRunner(),
    private readonly shouldUseInkInput: () => boolean = () =>
      stdin.isTTY === true && stderr.isTTY === true,
    private readonly nowProvider: () => Date = () => new Date(),
  ) {}

  /**
   * Runs one session-shell lifecycle until `/exit`, `Ctrl+C`, or `Ctrl+D` closes the foreground UI.
   * @param options Runtime localization, orchestration client, cwd, and output-contract context.
   * @returns Exit reason plus the final presenter transcript snapshot.
   */
  public async run(options: CliSessionShellRunOptions): Promise<CliSessionShellRunResult> {
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
    const turnProgressDock = new CliSessionShellTurnProgressDock({
      themePreset: viewModel.themePreset,
      translate: options.translate,
      onPanelUpdate: (panel) => {
        viewModel.commandProgressPanel = panel;
      },
      onRenderRequested: () => {
        this.renderActiveSurface(viewModel);
      },
    });
    await this.syncTranscript(
      viewModel,
      transcriptStore,
      options,
      runtimeState,
      turnProgressDock,
      true,
    );
    if (runtimeState.pendingCommand) {
      await this.recoverPendingCommandState(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
      );
    }

    if (bootstrapped.startupNoticeLines.length > 0) {
      this.appendLocalTranscriptItem(viewModel, {
        role: CliSessionTranscriptRole.SYSTEM,
        label: options.translate('cli.sessionShell.transcript.systemLabel'),
        lines: bootstrapped.startupNoticeLines,
        renderKind: 'system_notice',
      });
    }

    if (options.initialPrompt?.trim()) {
      await this.handlePlainTextTurn(
        options.initialPrompt.trim(),
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
      );
      this.resetPromptState(viewModel, options, runtimeState);
    }

    if (this.shouldUseInkInput()) {
      const fallbackPromptAdapter = this.promptAdapterFactory();
      const inkController = this.inkControllerFactory();
      const inkRunner = this.inkRunnerFactory();
      inkController.primeViewModel(viewModel);
      return await this.runWithInkInput(
        inkController,
        inkRunner,
        fallbackPromptAdapter,
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
      );
    }

    const promptAdapter = this.promptAdapterFactory();
    return await this.runWithReadlineFallback(
      promptAdapter,
      viewModel,
      transcriptStore,
      options,
      runtimeState,
      turnProgressDock,
    );
  }

  private async runWithReadlineFallback(
    promptAdapter: CliSessionShellPromptAdapter,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
    turnProgressDock: CliSessionShellTurnProgressDock,
  ): Promise<CliSessionShellRunResult> {
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

        const exitResult = await this.submitComposerValue(
          trimmedLine,
          promptAdapter,
          viewModel,
          transcriptStore,
          options,
          runtimeState,
          turnProgressDock,
        );
        this.renderer.render(viewModel);
        if (exitResult) {
          return exitResult;
        }
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

  private async runWithInkInput(
    inkController: CliSessionShellInkController,
    inkRunner: CliSessionShellInkRunner,
    fallbackPromptAdapter: CliSessionShellPromptAdapter,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
    turnProgressDock: CliSessionShellTurnProgressDock,
  ): Promise<CliSessionShellRunResult> {
    this.activeInkRunner = inkRunner;
    try {
      while (true) {
        const action = await inkRunner.readAction(viewModel);

        if (action === null) {
          return this.completeExit(viewModel, options, runtimeState, CliSessionShellExitReason.EOF);
        }

        const effects = inkController.applyAction(viewModel, action, options.translate);
        viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);

        if (effects.clearScreenRequested) {
          await this.clearLocalTranscriptView(
            viewModel,
            transcriptStore,
            options,
            runtimeState,
            turnProgressDock,
          );
          continue;
        }

        if (effects.exitRequested) {
          return this.completeExit(
            viewModel,
            options,
            runtimeState,
            CliSessionShellExitReason.SLASH_EXIT,
          );
        }

        if (!effects.submitComposer) {
          continue;
        }

        const trimmedComposerValue = viewModel.composerValue.trim();
        if (trimmedComposerValue.length === 0) {
          this.resetPromptState(viewModel, options, runtimeState);
          continue;
        }

        const requiresPromptAdapterTakeover =
          this.requiresPromptAdapterTakeover(trimmedComposerValue);
        if (requiresPromptAdapterTakeover) {
          inkRunner.close();
        }

        const exitResult = await this.submitComposerValue(
          trimmedComposerValue,
          fallbackPromptAdapter,
          viewModel,
          transcriptStore,
          options,
          runtimeState,
          turnProgressDock,
        );
        if (exitResult) {
          return exitResult;
        }
      }
    } catch (error) {
      if (
        error instanceof BaseError &&
        error.code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED
      ) {
        return this.completeExit(
          viewModel,
          options,
          runtimeState,
          CliSessionShellExitReason.SIGINT,
        );
      }

      throw error;
    } finally {
      this.activeInkRunner = null;
      inkRunner.close();
      fallbackPromptAdapter.close();
    }
  }

  private requiresPromptAdapterTakeover(inputLine: string): boolean {
    const normalizedInput = inputLine.trim().toLowerCase();
    return normalizedInput === '/multiline' || normalizedInput.startsWith('/multiline ');
  }

  private async submitComposerValue(
    inputLine: string,
    promptAdapter: CliSessionShellPromptAdapter,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
    turnProgressDock: CliSessionShellTurnProgressDock,
  ): Promise<CliSessionShellRunResult | null> {
    viewModel.composerValue = inputLine;

    if (this.isShortcutHelpAlias(inputLine)) {
      return await this.handleSlashCommand(
        inputLine,
        promptAdapter,
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
      );
    }

    if (inputLine.startsWith('!')) {
      await this.handleShellPassthrough(
        inputLine,
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
      );
      return null;
    }

    if (inputLine.startsWith('/')) {
      return await this.handleSlashCommand(
        inputLine,
        promptAdapter,
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
      );
    }

    await this.handlePlainTextTurn(
      inputLine,
      viewModel,
      transcriptStore,
      options,
      runtimeState,
      turnProgressDock,
    );
    this.resetPromptState(viewModel, options, runtimeState);
    return null;
  }

  private isShortcutHelpAlias(inputLine: string): boolean {
    return inputLine.trim() === '?';
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
    turnProgressDock: CliSessionShellTurnProgressDock,
  ): Promise<void> {
    this.recordHistory(inputLine, runtimeState);
    try {
      let turnError: unknown;
      let turnCompleted = false;
      const pendingTurn = options.sessionClient
        .sendMainTurn(viewModel.sessionId, inputLine)
        .catch((error) => {
          turnError = error;
        })
        .finally(() => {
          turnCompleted = true;
        });

      while (!turnCompleted) {
        await Promise.race([
          pendingTurn,
          new Promise<void>((resolve) => {
            setTimeout(resolve, SESSION_MAIN_TURN_POLL_INTERVAL_MS);
          }),
        ]);
        if (!turnCompleted) {
          await this.syncTranscript(
            viewModel,
            transcriptStore,
            options,
            runtimeState,
            turnProgressDock,
          );
          turnProgressDock.refresh();
        }
      }
      await pendingTurn;
      if (turnError) {
        throw turnError;
      }
      const subscription = await this.syncTranscript(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
      );
      const pendingCommand = runtimeState.pendingCommand;
      if (
        pendingCommand &&
        subscription.events.some((event) => event.sequence === pendingCommand.sourceEventSequence)
      ) {
        if (pendingCommand.executionMode === 'direct_execute') {
          await this.executePendingCommand(viewModel, transcriptStore, options, runtimeState);
          return;
        }
        this.restorePendingCommandPreviewState(viewModel, options, runtimeState);
        return;
      }
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
    _turnProgressDock?: CliSessionShellTurnProgressDock,
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
    turnProgressDock: CliSessionShellTurnProgressDock,
  ): Promise<CliSessionShellRunResult | null> {
    this.recordHistory(query, runtimeState);
    viewModel.inputMode = CliSessionShellInputMode.SLASH_COMMAND;

    if (query.trim() === '?') {
      this.showShortcutHelpPalette(viewModel, options, runtimeState);
      return null;
    }

    viewModel.slashQuery = query;
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest(query, options.translate);
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    viewModel.foregroundFocusTarget =
      viewModel.slashSuggestions.length > 0
        ? CliSessionShellForegroundFocusTarget.PALETTE
        : CliSessionShellForegroundFocusTarget.COMPOSER;
    if (query.trim() === '/') {
      this.showSlashLauncherPalette(viewModel, options, runtimeState);
      return null;
    }

    const exactCommand = this.slashCommandRegistry.resolveAction(query);
    if (exactCommand?.command !== '/help') {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.SLASH_COMMAND,
        [query],
      );
    }

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
      this.showSlashHelpPalette(viewModel, options, runtimeState);
      return null;
    }

    if (exactCommand.command === '/resume') {
      const recoveredPendingCommand = await this.handleResumeCommand(
        query,
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
      );
      if (!recoveredPendingCommand) {
        this.resetPromptState(viewModel, options, runtimeState);
      }
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
      await this.clearLocalTranscriptView(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
      );
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
        const pendingCommand = runtimeState.pendingCommand;
        runtimeState.pendingCommand = null;
        await this.appendServiceTranscriptItem(
          viewModel,
          transcriptStore,
          options,
          runtimeState,
          OrchestrationSessionTranscriptRole.SYSTEM,
          [options.translate('cli.sessionShell.responses.commandCancelled')],
          this.createHandoffResolutionMetadata(pendingCommand, 'cancelled'),
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

    if (exactCommand.command === '/status') {
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        OrchestrationSessionTranscriptRole.ASSISTANT,
        this.buildStatusLines(viewModel, options, runtimeState),
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
        turnProgressDock,
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

    const previewCommandLine = exactCommand.bridgeArgv.join(' ');
    const nextPendingCommand: PendingCommandExecution = {
      handoffTurnId: `local-slash:${exactCommand.command}:${this.nowProvider().toISOString()}`,
      executionMode: exactCommand.executionMode === 'direct' ? 'direct_execute' : 'preview_confirm',
      sourceEventSequence: Number.MAX_SAFE_INTEGER,
      steps: [
        {
          argv: [...exactCommand.bridgeArgv],
          slashQuery: exactCommand.command,
          previewCommandLine,
        },
      ],
      previewCommandLine,
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
    viewModel.inputMode = CliSessionShellInputMode.SLASH_COMMAND;
    viewModel.handoffState = CliSessionShellHandoffState.PREVIEWING;
    viewModel.composerValue = '';
    viewModel.slashPaletteVisible = false;
    viewModel.foregroundFocusTarget = CliSessionShellForegroundFocusTarget.HANDOFF_PREVIEW;
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
    turnProgressDock: CliSessionShellTurnProgressDock,
  ): Promise<boolean> {
    const requestedSessionId = this.resolveSlashCommandArgument(query);

    try {
      const resumedSession = await options.sessionClient.resumeSession(requestedSessionId);
      viewModel.sessionId = resumedSession.session.sessionId;
      viewModel.resumeSelector = resumedSession.resumeSelector;
      runtimeState.currentRouteId =
        resumedSession.session.currentRouteId ?? OrchestrationSessionRouteId.MAIN;
      runtimeState.pendingCommand = null;
      await this.syncTranscript(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
        true,
      );
      if (runtimeState.pendingCommand) {
        return await this.recoverPendingCommandState(
          viewModel,
          transcriptStore,
          options,
          runtimeState,
          turnProgressDock,
        );
      }
      return false;
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
      return false;
    }
  }

  private async handleMultilineCommand(
    promptAdapter: CliSessionShellPromptAdapter,
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
    turnProgressDock: CliSessionShellTurnProgressDock,
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
      turnProgressDock,
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
    let finalStatus: 'success' | 'error' = 'success';
    for (let index = 0; index < pendingCommand.steps.length; index += 1) {
      const pendingStep = pendingCommand.steps[index];
      if (!pendingStep) {
        continue;
      }
      viewModel.shellMode = CliSessionShellMode.COMMAND_RUNNING;
      viewModel.handoffState = CliSessionShellHandoffState.RUNNING;
      viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
      const progressDock = new CliSessionShellCommandProgressDock({
        argv: pendingStep.argv,
        previewCommandLine: pendingStep.previewCommandLine,
        themePreset: viewModel.themePreset,
        translate: options.translate,
        relayProgressSink: options.commandExecutionOptions?.progressSink,
        abortSignal: options.commandExecutionOptions?.abortSignal,
        onPanelUpdate: (panel) => {
          viewModel.commandProgressPanel = panel;
        },
        onRenderRequested: () => {
          this.renderActiveSurface(viewModel);
        },
      });
      progressDock.seedRunningState();
      progressDock.startTicking();
      this.renderActiveSurface(viewModel);

      const executionResult = await options
        .commandExecutor(pendingStep.argv, progressDock.createExecutionOptions())
        .catch((error) => {
          const standardizedError = standardizeError(error);
          return {
            artifactPaths: [],
            commandLine: pendingStep.previewCommandLine,
            message: standardizedError.message,
            status: 'error',
            summaryLines: [
              options.translate('cli.sessionShell.responses.commandExecutionFailed', {
                command: pendingStep.previewCommandLine,
                reason: standardizedError.message,
              }),
            ],
          } satisfies CliSessionShellCommandExecutionResult;
        });
      progressDock.clear();

      const isLastStep = index === pendingCommand.steps.length - 1;
      const shouldResolve =
        executionResult.status !== 'success' || isLastStep || pendingCommand.steps.length === 1;
      await this.appendServiceTranscriptItem(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        executionResult.status === 'success'
          ? OrchestrationSessionTranscriptRole.ASSISTANT
          : OrchestrationSessionTranscriptRole.SYSTEM,
        this.buildCommandExecutionLines(executionResult, options),
        {
          commandLine: executionResult.commandLine,
          ...(executionResult.artifactPaths.length > 0
            ? {
                artifactPaths: executionResult.artifactPaths,
              }
            : {}),
          ...(executionResult.status === 'success'
            ? {
                renderKind: 'command_recap',
              }
            : {}),
          ...(shouldResolve
            ? this.createHandoffResolutionMetadata(
                pendingCommand,
                executionResult.status === 'success' ? 'executed' : 'failed',
              )
            : {}),
        },
      );

      if (executionResult.status !== 'success') {
        finalStatus = 'error';
        break;
      }
    }

    runtimeState.pendingCommand = null;
    viewModel.handoffState =
      finalStatus === 'success'
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
    viewModel.slashPaletteVisible = false;
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest('', options.translate);
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    viewModel.commandPreview = null;
    viewModel.handoffState = CliSessionShellHandoffState.IDLE;
    viewModel.commandProgressPanel = undefined;
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
      renderKind: 'system_notice',
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
      slashPaletteVisible: false,
      slashSuggestions,
      highlightedCommand: slashSuggestions[0]?.command ?? null,
      slashPaletteTitle: options.translate('cli.sessionShell.sections.slashPalette'),
      slashPaletteEmptyState: options.translate('cli.sessionShell.palette.emptyState'),
      commandPreview: null,
      handoffState: CliSessionShellHandoffState.IDLE,
      commandProgressPanel: undefined,
      cwd: options.currentWorkingDirectory,
      workspaceSummary: options.workspaceSummary,
      outputContract: options.outputMode,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector,
      foregroundInputOwner: CliSessionShellForegroundInputOwner.READLINE_FALLBACK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
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
    turnProgressDock?: CliSessionShellTurnProgressDock,
    reset = false,
  ): Promise<OrchestrationSubscribeSessionResponse> {
    if (reset) {
      transcriptStore.reset(viewModel.sessionId);
      runtimeState.pendingCommand = null;
      turnProgressDock?.clear();
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
    turnProgressDock?.applySessionEvents(subscription.events);
    this.reconcilePendingCommandFromEvents(subscription.events, runtimeState);
    runtimeState.currentRouteId =
      subscription.session.currentRouteId ?? OrchestrationSessionRouteId.MAIN;
    viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
    return subscription;
  }

  private buildPromptBarLines(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
    _runtimeState: CliSessionShellRuntimeState,
  ): string[] {
    return [this.buildPromptBarShortcutSummary(viewModel, options)];
  }

  private buildPromptBarShortcutSummary(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
  ): string {
    if (
      viewModel.handoffState === CliSessionShellHandoffState.PREVIEWING ||
      viewModel.handoffState === CliSessionShellHandoffState.AWAITING_CONFIRMATION
    ) {
      return options.translate('cli.sessionShell.promptBar.previewShortcuts');
    }

    if (viewModel.shellMode === CliSessionShellMode.COMMAND_PALETTE) {
      return options.translate('cli.sessionShell.promptBar.paletteShortcuts');
    }

    return options.translate('cli.sessionShell.promptBar.idleShortcuts');
  }

  private showSlashHelpPalette(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): void {
    viewModel.shellMode = CliSessionShellMode.COMMAND_PALETTE;
    viewModel.inputMode = CliSessionShellInputMode.SLASH_COMMAND;
    viewModel.slashQuery = '';
    viewModel.slashPaletteVisible = true;
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest('/', options.translate, {
      surface: 'full',
    });
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    viewModel.composerValue = '';
    viewModel.foregroundFocusTarget = CliSessionShellForegroundFocusTarget.PALETTE;
    viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
  }

  private showShortcutHelpPalette(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): void {
    viewModel.shellMode = CliSessionShellMode.COMMAND_PALETTE;
    viewModel.inputMode = CliSessionShellInputMode.SLASH_COMMAND;
    viewModel.slashQuery = '?';
    viewModel.slashPaletteVisible = true;
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest('/', options.translate, {
      surface: 'full',
    });
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    viewModel.composerValue = '?';
    viewModel.foregroundFocusTarget = CliSessionShellForegroundFocusTarget.PALETTE;
    viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
  }

  private showSlashLauncherPalette(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): void {
    viewModel.shellMode = CliSessionShellMode.COMMAND_PALETTE;
    viewModel.inputMode = CliSessionShellInputMode.SLASH_COMMAND;
    viewModel.slashQuery = '/';
    viewModel.slashPaletteVisible = true;
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest('/', options.translate);
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    viewModel.composerValue = '/';
    viewModel.foregroundFocusTarget = CliSessionShellForegroundFocusTarget.PALETTE;
    viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
  }

  private buildStatusLines(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): string[] {
    return [
      options.translate('cli.sessionShell.responses.statusAttached', {
        sessionId: viewModel.sessionId,
        routeId: runtimeState.currentRouteId,
      }),
      options.translate('cli.sessionShell.responses.statusRuntime', {
        resumeSelector: viewModel.resumeSelector,
        persistenceOwner: viewModel.persistenceOwner,
        theme: viewModel.themePreset ?? DEFAULT_CLI_REACT_THEME_PRESET,
        output: viewModel.outputContract,
      }),
      options.translate('cli.sessionShell.responses.statusWorkspace', {
        workspace: viewModel.workspaceSummary,
      }),
    ];
  }

  private resetPromptState(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): void {
    viewModel.shellMode = CliSessionShellMode.SESSION_SHELL;
    viewModel.inputMode = CliSessionShellInputMode.PLAIN_TEXT;
    viewModel.slashQuery = '';
    viewModel.slashPaletteVisible = false;
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest('', options.translate);
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    viewModel.commandPreview = null;
    viewModel.handoffState = CliSessionShellHandoffState.IDLE;
    viewModel.commandProgressPanel = undefined;
    viewModel.composerValue = '';
    viewModel.foregroundFocusTarget = CliSessionShellForegroundFocusTarget.COMPOSER;
    viewModel.promptBarLines = this.buildPromptBarLines(viewModel, options, runtimeState);
  }

  private async clearLocalTranscriptView(
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
    turnProgressDock?: CliSessionShellTurnProgressDock,
  ): Promise<void> {
    this.activeInkRunner?.requestViewportClear();
    transcriptStore.clearView();
    turnProgressDock?.clear();
    viewModel.transcriptItems = [];
    this.appendLocalTranscriptItem(viewModel, {
      role: CliSessionTranscriptRole.SYSTEM,
      label: options.translate('cli.sessionShell.transcript.systemLabel'),
      lines: [options.translate('cli.sessionShell.responses.localTranscriptCleared')],
      renderKind: 'system_notice',
    });
    if (runtimeState.pendingCommand) {
      await this.recoverPendingCommandState(
        viewModel,
        transcriptStore,
        options,
        runtimeState,
        turnProgressDock,
      );
      return;
    }

    this.resetPromptState(viewModel, options, runtimeState);
  }

  private async recoverPendingCommandState(
    viewModel: CliSessionShellViewModel,
    transcriptStore: CliSessionShellTranscriptStore,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
    turnProgressDock?: CliSessionShellTurnProgressDock,
  ): Promise<boolean> {
    const pendingCommand = runtimeState.pendingCommand;
    if (!pendingCommand) {
      return false;
    }

    if (pendingCommand.executionMode === 'direct_execute') {
      turnProgressDock?.clear();
      await this.executePendingCommand(viewModel, transcriptStore, options, runtimeState);
      return true;
    }

    this.restorePendingCommandPreviewState(viewModel, options, runtimeState);
    return true;
  }

  private restorePendingCommandPreviewState(
    viewModel: CliSessionShellViewModel,
    options: CliSessionShellRunOptions,
    runtimeState: CliSessionShellRuntimeState,
  ): void {
    const pendingCommand = runtimeState.pendingCommand;
    if (!pendingCommand) {
      this.resetPromptState(viewModel, options, runtimeState);
      return;
    }

    viewModel.shellMode = CliSessionShellMode.COMMAND_HANDOFF_PREVIEW;
    viewModel.inputMode = CliSessionShellInputMode.SLASH_COMMAND;
    viewModel.slashQuery = '';
    viewModel.slashPaletteVisible = false;
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest('', options.translate);
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    viewModel.commandPreview = options.translate('cli.sessionShell.responses.commandPreview', {
      command: pendingCommand.previewCommandLine,
    });
    viewModel.handoffState = CliSessionShellHandoffState.PREVIEWING;
    viewModel.commandProgressPanel = undefined;
    viewModel.composerValue = '';
    viewModel.foregroundFocusTarget = CliSessionShellForegroundFocusTarget.HANDOFF_PREVIEW;
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

  private reconcilePendingCommandFromEvents(
    events: OrchestrationSessionEvent[],
    runtimeState: CliSessionShellRuntimeState,
  ): void {
    for (const event of events) {
      const pendingCommand = this.resolvePendingCommandFromEvent(event);
      if (pendingCommand) {
        runtimeState.pendingCommand = pendingCommand;
        continue;
      }
      const handoffResolution = this.readHandoffResolutionRecord(event);
      if (
        handoffResolution &&
        runtimeState.pendingCommand?.handoffTurnId === handoffResolution.turnId
      ) {
        runtimeState.pendingCommand = null;
      }
    }
  }

  private resolvePendingCommandFromEvent(
    event: OrchestrationSessionEvent,
  ): PendingCommandExecution | null {
    if (event.type !== OrchestrationSessionEventType.TURN_COMPLETED) {
      return null;
    }
    if (this.readOptionalString(event.payload.responseMode) !== 'command_handoff_preview') {
      return null;
    }
    const handoffTurnId = this.readOptionalString(event.payload.turnId);
    if (!handoffTurnId) {
      return null;
    }
    const commandBatches = this.readCommandBatches(event.payload.commandBatches);
    const fallbackSuggestedSlashCommand = this.readOptionalString(
      event.payload.suggestedSlashCommand,
    );
    const fallbackCommandPreview = this.readOptionalString(event.payload.handoffCommandPreview);
    const resolvedSteps =
      commandBatches.length > 0
        ? commandBatches
        : this.resolveLegacySingleCommandStep(
            fallbackSuggestedSlashCommand,
            fallbackCommandPreview,
          );
    if (resolvedSteps.length === 0) {
      return null;
    }
    const requiresConfirmation = this.readOptionalBoolean(event.payload.requiresConfirmation);
    const handoffExecutionMode = this.readOptionalString(event.payload.handoffExecutionMode);
    return {
      handoffTurnId,
      executionMode:
        handoffExecutionMode === 'direct_execute' || handoffExecutionMode === 'preview_confirm'
          ? handoffExecutionMode
          : requiresConfirmation === false
            ? 'direct_execute'
            : 'preview_confirm',
      sourceEventSequence: event.sequence,
      steps: resolvedSteps,
      previewCommandLine:
        resolvedSteps.length === 1
          ? (resolvedSteps[0]?.previewCommandLine ?? '')
          : resolvedSteps.map((step) => step.previewCommandLine).join(' -> '),
    };
  }

  private resolveLegacySingleCommandStep(
    suggestedSlashCommand?: string,
    handoffCommandPreview?: string,
  ): PendingCommandExecutionStep[] {
    if (!suggestedSlashCommand) {
      return [];
    }
    const action = this.slashCommandRegistry.resolveAction(suggestedSlashCommand);
    if (!action?.bridgeArgv) {
      return [];
    }
    return [
      {
        argv: [...action.bridgeArgv],
        slashQuery: suggestedSlashCommand,
        previewCommandLine: handoffCommandPreview ?? action.bridgeArgv.join(' '),
      },
    ];
  }

  private readCommandBatches(candidate: unknown): PendingCommandExecutionStep[] {
    if (!Array.isArray(candidate)) {
      return [];
    }
    return candidate
      .map((entry) => {
        if (typeof entry !== 'object' || entry === null) {
          return null;
        }
        const record = entry as Record<string, unknown>;
        const slashQuery = this.readOptionalString(record.slashQuery);
        const previewCommandLine = this.readOptionalString(record.previewCommandLine);
        const bridgeArgv = this.readStringArray(record.bridgeArgv);
        if (!slashQuery || !previewCommandLine || bridgeArgv.length === 0) {
          return null;
        }
        return {
          argv: bridgeArgv,
          slashQuery,
          previewCommandLine,
        } satisfies PendingCommandExecutionStep;
      })
      .filter((entry): entry is PendingCommandExecutionStep => entry !== null);
  }

  private readHandoffResolutionRecord(
    event: OrchestrationSessionEvent,
  ): SessionMainHandoffResolutionRecord | null {
    if (event.type !== OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED) {
      return null;
    }
    const payloadMetadata =
      typeof event.payload.metadata === 'object' && event.payload.metadata !== null
        ? (event.payload.metadata as Record<string, unknown>)
        : null;
    const resolution =
      payloadMetadata &&
      typeof payloadMetadata[SESSION_MAIN_HANDOFF_RESOLUTION_METADATA_KEY] === 'object' &&
      payloadMetadata[SESSION_MAIN_HANDOFF_RESOLUTION_METADATA_KEY] !== null
        ? (payloadMetadata[SESSION_MAIN_HANDOFF_RESOLUTION_METADATA_KEY] as Record<string, unknown>)
        : null;
    const turnId = resolution ? this.readOptionalString(resolution.turnId) : undefined;
    const state = resolution ? this.readOptionalString(resolution.state) : undefined;
    if (!turnId || (state !== 'cancelled' && state !== 'executed' && state !== 'failed')) {
      return null;
    }
    return {
      turnId,
      state,
    };
  }

  private createHandoffResolutionMetadata(
    pendingCommand: PendingCommandExecution | null,
    state: SessionMainHandoffResolutionRecord['state'],
  ): Record<string, unknown> | undefined {
    if (!pendingCommand) {
      return undefined;
    }
    return {
      [SESSION_MAIN_HANDOFF_RESOLUTION_METADATA_KEY]: {
        turnId: pendingCommand.handoffTurnId,
        state,
      },
    };
  }

  private readOptionalString(candidate: unknown): string | undefined {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
    return undefined;
  }

  private readOptionalBoolean(candidate: unknown): boolean | undefined {
    return typeof candidate === 'boolean' ? candidate : undefined;
  }

  private readStringArray(candidate: unknown): string[] {
    if (!Array.isArray(candidate)) {
      return [];
    }
    return candidate.filter((entry): entry is string => typeof entry === 'string');
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

  private renderActiveSurface(viewModel: CliSessionShellViewModel): void {
    if (this.activeInkRunner) {
      this.activeInkRunner.render(viewModel);
      return;
    }

    this.renderer.render(viewModel);
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
      ...this.buildCommandArtifactLines(result.artifactPaths, options),
    ];
  }

  private buildCommandArtifactLines(
    artifactPaths: string[],
    options: CliSessionShellRunOptions,
  ): string[] {
    if (artifactPaths.length === 0) {
      return [];
    }

    const primaryArtifactLine = options.translate('cli.sessionShell.responses.commandArtifact', {
      artifactPath: this.shortenArtifactPath(artifactPaths[0] ?? ''),
    });
    if (artifactPaths.length === 1) {
      return [primaryArtifactLine];
    }

    return [
      primaryArtifactLine,
      options.translate('cli.sessionShell.responses.commandArtifactsMore', {
        count: String(artifactPaths.length - 1),
      }),
    ];
  }

  private shortenArtifactPath(artifactPath: string): string {
    const segments = artifactPath.split(/[\\/]/u).filter((segment) => segment.length > 0);
    if (segments.length <= 4) {
      return artifactPath;
    }

    return `.../${segments.slice(-4).join('/')}`;
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
