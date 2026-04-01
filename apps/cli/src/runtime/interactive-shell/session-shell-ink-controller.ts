import {
  CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT,
  CliSessionShellForegroundFocusTarget,
  CliSessionShellForegroundInputOwner,
  CliSessionShellHandoffState,
  CliSessionShellInputActionType,
  CliSessionShellInputMode,
  CliSessionShellMode,
} from '../../constants/cli-session-shell.constant.js';
import type {
  CliSessionShellInputAction,
  CliSessionShellInputActionResult,
  CliSessionShellViewModel,
} from '../../types/index.js';
import { CliSessionSlashCommandRegistry } from './session-slash-command-registry.js';

const DEFAULT_ACTION_RESULT: CliSessionShellInputActionResult = {
  submitComposer: false,
  clearScreenRequested: false,
  exitRequested: false,
};

/**
 * Owns presenter-local Ink input state transitions for the session-shell baseline.
 *
 * Why this exists:
 * project-031 starts by moving foreground input semantics into an explicit controller so later
 * runner cutover can reuse one action vocabulary instead of hidden readline side effects.
 */
export class CliSessionShellInkController {
  public constructor(
    private readonly slashCommandRegistry: CliSessionSlashCommandRegistry = new CliSessionSlashCommandRegistry(),
  ) {}

  /**
   * Marks one session-shell view model as Ink-owned and seeds the stable action contract.
   * @param viewModel Mutable session-shell presenter view model.
   * @returns Nothing.
   */
  public primeViewModel(viewModel: CliSessionShellViewModel): void {
    viewModel.foregroundInputOwner = CliSessionShellForegroundInputOwner.INK;
    viewModel.foregroundFocusTarget = CliSessionShellForegroundFocusTarget.COMPOSER;
    viewModel.inputActionContract = [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT];
  }

  /**
   * Applies one presenter-local Ink input action and returns follow-up effects for the runner.
   * @param viewModel Mutable session-shell presenter view model.
   * @param action Normalized foreground action emitted by the Ink input seam.
   * @param translate i18n translation function used for slash suggestions.
   * @returns Presenter-local effect flags for the runner.
   */
  public applyAction(
    viewModel: CliSessionShellViewModel,
    action: CliSessionShellInputAction,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionShellInputActionResult {
    switch (action.type) {
      case CliSessionShellInputActionType.COMPOSER_CHANGED:
        this.applyComposerValue(viewModel, action.value ?? '', translate);
        return DEFAULT_ACTION_RESULT;
      case CliSessionShellInputActionType.COMPOSER_SUBMITTED:
        return {
          ...DEFAULT_ACTION_RESULT,
          submitComposer: true,
        };
      case CliSessionShellInputActionType.PALETTE_HIGHLIGHT_NEXT:
        this.rotateHighlight(viewModel, 1);
        return DEFAULT_ACTION_RESULT;
      case CliSessionShellInputActionType.PALETTE_HIGHLIGHT_PREVIOUS:
        this.rotateHighlight(viewModel, -1);
        return DEFAULT_ACTION_RESULT;
      case CliSessionShellInputActionType.PALETTE_ACCEPT_HIGHLIGHTED:
        if (this.isPaletteInteractive(viewModel) && viewModel.highlightedCommand) {
          this.applyComposerValue(viewModel, viewModel.highlightedCommand, translate);
        }
        return DEFAULT_ACTION_RESULT;
      case CliSessionShellInputActionType.PALETTE_CLOSED:
        this.closePalette(viewModel, translate);
        return DEFAULT_ACTION_RESULT;
      case CliSessionShellInputActionType.SESSION_TOGGLE_LATEST_DETAILS:
        return DEFAULT_ACTION_RESULT;
      case CliSessionShellInputActionType.SESSION_CLEAR_SCREEN:
        return {
          ...DEFAULT_ACTION_RESULT,
          clearScreenRequested: true,
        };
      case CliSessionShellInputActionType.SESSION_EXIT_REQUESTED:
        return {
          ...DEFAULT_ACTION_RESULT,
          exitRequested: true,
        };
      default:
        return DEFAULT_ACTION_RESULT;
    }
  }

  private applyComposerValue(
    viewModel: CliSessionShellViewModel,
    nextValue: string,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): void {
    viewModel.composerValue = nextValue;
    viewModel.commandPreview = null;
    viewModel.handoffState = CliSessionShellHandoffState.IDLE;

    if (nextValue === '?') {
      this.showShortcutsPalette(viewModel, translate);
      return;
    }

    if (!nextValue.startsWith('/')) {
      this.resetPalette(viewModel, translate);
      return;
    }

    const suggestions = this.slashCommandRegistry.suggest(nextValue, translate);
    viewModel.shellMode = CliSessionShellMode.COMMAND_PALETTE;
    viewModel.inputMode = CliSessionShellInputMode.SLASH_COMMAND;
    viewModel.slashQuery = nextValue;
    viewModel.slashPaletteVisible = true;
    viewModel.slashSuggestions = suggestions;
    viewModel.highlightedCommand = suggestions[0]?.command ?? null;
    viewModel.foregroundFocusTarget =
      suggestions.length > 0
        ? CliSessionShellForegroundFocusTarget.PALETTE
        : CliSessionShellForegroundFocusTarget.COMPOSER;
  }

  private showShortcutsPalette(
    viewModel: CliSessionShellViewModel,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): void {
    const suggestions = this.slashCommandRegistry.suggest('/', translate, {
      surface: 'full',
    });
    viewModel.shellMode = CliSessionShellMode.COMMAND_PALETTE;
    viewModel.inputMode = CliSessionShellInputMode.SLASH_COMMAND;
    viewModel.slashQuery = '?';
    viewModel.slashPaletteVisible = true;
    viewModel.slashSuggestions = suggestions;
    viewModel.highlightedCommand = suggestions[0]?.command ?? null;
    viewModel.foregroundFocusTarget =
      suggestions.length > 0
        ? CliSessionShellForegroundFocusTarget.PALETTE
        : CliSessionShellForegroundFocusTarget.COMPOSER;
  }

  private resetPalette(
    viewModel: CliSessionShellViewModel,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): void {
    viewModel.shellMode = CliSessionShellMode.SESSION_SHELL;
    viewModel.inputMode = CliSessionShellInputMode.PLAIN_TEXT;
    viewModel.slashQuery = '';
    viewModel.slashPaletteVisible = false;
    viewModel.slashSuggestions = this.slashCommandRegistry.suggest('', translate);
    viewModel.highlightedCommand = viewModel.slashSuggestions[0]?.command ?? null;
    viewModel.foregroundFocusTarget = CliSessionShellForegroundFocusTarget.COMPOSER;
  }

  private rotateHighlight(viewModel: CliSessionShellViewModel, direction: number): void {
    if (!this.isPaletteInteractive(viewModel) || viewModel.slashSuggestions.length === 0) {
      return;
    }

    const currentIndex = viewModel.slashSuggestions.findIndex(
      (suggestion) => suggestion.command === viewModel.highlightedCommand,
    );
    const normalizedCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex =
      (normalizedCurrentIndex + direction + viewModel.slashSuggestions.length) %
      viewModel.slashSuggestions.length;
    viewModel.highlightedCommand = viewModel.slashSuggestions[nextIndex]?.command ?? null;
    viewModel.foregroundFocusTarget = CliSessionShellForegroundFocusTarget.PALETTE;
    viewModel.shellMode = CliSessionShellMode.COMMAND_PALETTE;
  }

  private isPaletteInteractive(viewModel: CliSessionShellViewModel): boolean {
    return (
      (viewModel.slashPaletteVisible &&
        viewModel.shellMode === CliSessionShellMode.COMMAND_PALETTE) ||
      (viewModel.slashPaletteVisible && viewModel.composerValue.startsWith('/'))
    );
  }

  private closePalette(
    viewModel: CliSessionShellViewModel,
    _translate: (key: string, interpolation?: Record<string, string>) => string,
  ): void {
    viewModel.shellMode = CliSessionShellMode.SESSION_SHELL;
    viewModel.inputMode = viewModel.composerValue.startsWith('/')
      ? CliSessionShellInputMode.SLASH_COMMAND
      : CliSessionShellInputMode.PLAIN_TEXT;
    viewModel.slashQuery = '';
    viewModel.slashPaletteVisible = false;
    viewModel.slashSuggestions = [];
    viewModel.highlightedCommand = null;
    viewModel.foregroundFocusTarget = CliSessionShellForegroundFocusTarget.COMPOSER;
  }
}
