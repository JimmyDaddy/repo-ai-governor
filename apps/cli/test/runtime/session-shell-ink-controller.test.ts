import { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import {
  CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT,
  CliSessionShellForegroundFocusTarget,
  CliSessionShellForegroundInputOwner,
  CliSessionShellHandoffState,
  CliSessionShellInputActionType,
  CliSessionShellInputMode,
  CliSessionShellMode,
  CliSessionShellPersistenceOwner,
} from '../../src/constants/cli-session-shell.constant.js';
import { CliSessionShellInkController } from '../../src/runtime/interactive-shell/session-shell-ink-controller.js';
import type { CliSessionShellViewModel } from '../../src/types/index.js';

function createViewModel(): CliSessionShellViewModel {
  return {
    sessionId: 'session-shell-ink-001',
    shellMode: CliSessionShellMode.SESSION_SHELL,
    inputMode: CliSessionShellInputMode.PLAIN_TEXT,
    transcriptItems: [],
    transcriptTitle: 'History',
    composerValue: '',
    composerTitle: 'Current input',
    composerPlaceholder: 'Type a message, / for commands, or ? for shortcuts.',
    slashQuery: '',
    slashPaletteVisible: false,
    slashSuggestions: [],
    highlightedCommand: null,
    slashPaletteTitle: 'Slash palette',
    slashPaletteEmptyState: 'No slash commands matched.',
    commandPreview: null,
    handoffState: CliSessionShellHandoffState.IDLE,
    cwd: '/workspace/repo',
    workspaceSummary: 'workspace_id=repo mode=repo_local',
    outputContract: ErrorOutputEnvironment.PRETTY,
    persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
    resumeSelector: 'latest',
    foregroundInputOwner: CliSessionShellForegroundInputOwner.READLINE_FALLBACK,
    foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
    inputActionContract: [],
    title: 'Repo AI Governor session shell',
    subtitle: 'Session-first preview baseline.',
    promptBarTitle: 'Prompt bar',
    promptBarLines: [],
  };
}

describe('CliSessionShellInkController', () => {
  it('primes one view model with Ink ownership and the shared action contract', () => {
    const controller = new CliSessionShellInkController();
    const viewModel = createViewModel();

    controller.primeViewModel(viewModel);

    expect(viewModel.foregroundInputOwner).toBe(CliSessionShellForegroundInputOwner.INK);
    expect(viewModel.foregroundFocusTarget).toBe(CliSessionShellForegroundFocusTarget.COMPOSER);
    expect(viewModel.inputActionContract).toEqual([...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT]);
  });

  it('switches to slash palette mode when composer text begins with slash', () => {
    const controller = new CliSessionShellInkController();
    const viewModel = createViewModel();

    controller.primeViewModel(viewModel);
    controller.applyAction(
      viewModel,
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/wo',
      },
      (key) => key,
    );

    expect(viewModel.shellMode).toBe(CliSessionShellMode.COMMAND_PALETTE);
    expect(viewModel.inputMode).toBe(CliSessionShellInputMode.SLASH_COMMAND);
    expect(viewModel.slashQuery).toBe('/wo');
    expect(viewModel.slashPaletteVisible).toBe(true);
    expect(viewModel.highlightedCommand).toBe('/workspace');
    expect(viewModel.foregroundFocusTarget).toBe(CliSessionShellForegroundFocusTarget.PALETTE);
  });

  it('treats bare slash as a launcher shortlist instead of exposing the full command catalog', () => {
    const controller = new CliSessionShellInkController();
    const viewModel = createViewModel();

    controller.primeViewModel(viewModel);
    controller.applyAction(
      viewModel,
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/',
      },
      (key) => key,
    );

    expect(viewModel.slashSuggestions.map((suggestion) => suggestion.command)).toEqual([
      '/workspace',
      '/workspace switch-branch',
      '/doctor',
      '/connect',
      '/review',
      '/plan',
      '/run',
      '/help',
    ]);
    expect(viewModel.highlightedCommand).toBe('/workspace');
  });

  it('surfaces nested workspace actions after the /workspace prefix without changing the launcher shortlist', () => {
    const controller = new CliSessionShellInkController();
    const viewModel = createViewModel();

    controller.primeViewModel(viewModel);
    controller.applyAction(
      viewModel,
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/workspace ',
      },
      (key) => key,
    );

    expect(viewModel.slashSuggestions.map((suggestion) => suggestion.command)).toEqual([
      '/workspace',
      '/workspace dry-run',
      '/workspace execute',
      '/workspace rollback',
      '/workspace clear-config',
      '/workspace switch-branch',
      '/workspace set-ui-theme',
    ]);
    expect(viewModel.highlightedCommand).toBe('/workspace');
  });

  it('surfaces theme preset choices after the /workspace set-ui-theme prefix', () => {
    const controller = new CliSessionShellInkController();
    const viewModel = createViewModel();

    controller.primeViewModel(viewModel);
    controller.applyAction(
      viewModel,
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/workspace set-ui-theme ',
      },
      (key) => key,
    );

    expect(viewModel.slashSuggestions.map((suggestion) => suggestion.command)).toEqual([
      '/workspace set-ui-theme governor',
      '/workspace set-ui-theme catppuccin',
      '/workspace set-ui-theme calm',
    ]);
    expect(viewModel.highlightedCommand).toBe('/workspace set-ui-theme governor');
  });

  it('treats bare question mark as a shortcuts alias and opens the full help palette', () => {
    const controller = new CliSessionShellInkController();
    const viewModel = createViewModel();

    controller.primeViewModel(viewModel);
    controller.applyAction(
      viewModel,
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '?',
      },
      (key) => key,
    );

    expect(viewModel.shellMode).toBe(CliSessionShellMode.COMMAND_PALETTE);
    expect(viewModel.inputMode).toBe(CliSessionShellInputMode.SLASH_COMMAND);
    expect(viewModel.slashQuery).toBe('?');
    expect(viewModel.slashPaletteVisible).toBe(true);
    expect(viewModel.highlightedCommand).toBe('/help');
    expect(viewModel.slashSuggestions.some((suggestion) => suggestion.command === '/confirm')).toBe(
      false,
    );
    expect(
      viewModel.slashSuggestions.some((suggestion) => suggestion.command === '/workflow'),
    ).toBe(true);
  });

  it('returns follow-up effects for submit, clear-screen, and exit actions', () => {
    const controller = new CliSessionShellInkController();
    const viewModel = createViewModel();

    expect(
      controller.applyAction(
        viewModel,
        {
          type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
        },
        (key) => key,
      ),
    ).toEqual({
      submitComposer: true,
      clearScreenRequested: false,
      exitRequested: false,
    });

    expect(
      controller.applyAction(
        viewModel,
        {
          type: CliSessionShellInputActionType.SESSION_CLEAR_SCREEN,
        },
        (key) => key,
      ),
    ).toEqual({
      submitComposer: false,
      clearScreenRequested: true,
      exitRequested: false,
    });

    expect(
      controller.applyAction(
        viewModel,
        {
          type: CliSessionShellInputActionType.SESSION_EXIT_REQUESTED,
        },
        (key) => key,
      ),
    ).toEqual({
      submitComposer: false,
      clearScreenRequested: false,
      exitRequested: true,
    });
  });

  it('ignores palette navigation and completion when slash input is not active', () => {
    const controller = new CliSessionShellInkController();
    const viewModel = createViewModel();

    controller.primeViewModel(viewModel);
    viewModel.slashSuggestions = [
      {
        command: '/help',
        summary: 'Show help',
        highlightSegments: [{ text: '/help', highlighted: false }],
      },
    ];
    viewModel.highlightedCommand = '/help';

    controller.applyAction(
      viewModel,
      {
        type: CliSessionShellInputActionType.PALETTE_HIGHLIGHT_NEXT,
      },
      (key) => key,
    );
    controller.applyAction(
      viewModel,
      {
        type: CliSessionShellInputActionType.PALETTE_ACCEPT_HIGHLIGHTED,
      },
      (key) => key,
    );

    expect(viewModel.shellMode).toBe(CliSessionShellMode.SESSION_SHELL);
    expect(viewModel.composerValue).toBe('');
    expect(viewModel.foregroundFocusTarget).toBe(CliSessionShellForegroundFocusTarget.COMPOSER);
  });

  it('lets Esc close the live palette without clearing the slash composer text', () => {
    const controller = new CliSessionShellInkController();
    const viewModel = createViewModel();

    controller.primeViewModel(viewModel);
    controller.applyAction(
      viewModel,
      {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/wo',
      },
      (key) => key,
    );
    controller.applyAction(
      viewModel,
      {
        type: CliSessionShellInputActionType.PALETTE_CLOSED,
      },
      (key) => key,
    );

    expect(viewModel.composerValue).toBe('/wo');
    expect(viewModel.slashPaletteVisible).toBe(false);
    expect(viewModel.shellMode).toBe(CliSessionShellMode.SESSION_SHELL);
    expect(viewModel.highlightedCommand).toBeNull();
  });
});
