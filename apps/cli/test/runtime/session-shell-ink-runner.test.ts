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
import { CliSessionShellInkRunner } from '../../src/runtime/interactive-shell/session-shell-ink-runner.js';
import type { CliSessionShellViewModel } from '../../src/types/index.js';

function createViewModel(): CliSessionShellViewModel {
  return {
    sessionId: 'session-shell-live-001',
    shellMode: CliSessionShellMode.SESSION_SHELL,
    inputMode: CliSessionShellInputMode.PLAIN_TEXT,
    transcriptItems: [],
    transcriptTitle: 'Transcript',
    composerValue: '',
    composerTitle: 'Composer',
    composerPlaceholder: 'Type a message or /help.',
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
    foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
    foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
    inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
    title: 'Repo AI Governor session shell',
    subtitle: 'Session-first preview baseline.',
    promptBarTitle: 'Prompt bar',
    promptBarLines: [],
  };
}

describe('CliSessionShellInkRunner', () => {
  it('mounts once, rerenders in place, and resolves queued actions', async () => {
    const fakeInstance = {
      rerender: vi.fn(),
      clear: vi.fn(),
      unmount: vi.fn(),
    };
    let liveHandlers:
      | {
          onAction: (action: {
            type: CliSessionShellInputActionType;
            value?: string;
          }) => void;
          onInterrupt: () => void;
          onEndOfInput: () => void;
        }
      | undefined;
    const mountLiveSessionShell = vi.fn((_viewModel, interactionHandlers) => {
      liveHandlers = interactionHandlers;
      return fakeInstance;
    });
    const rerenderLiveSessionShell = vi.fn((_instance, _viewModel, interactionHandlers) => {
      liveHandlers = interactionHandlers;
    });
    const runner = new CliSessionShellInkRunner(
      {
        mountLiveSessionShell,
        rerenderLiveSessionShell,
      } as never,
      {
        stdout: process.stderr,
      },
    );
    const viewModel = createViewModel();

    const firstActionPromise = runner.readAction(viewModel);
    expect(mountLiveSessionShell).toHaveBeenCalledTimes(1);
    liveHandlers?.onAction({
      type: CliSessionShellInputActionType.COMPOSER_CHANGED,
      value: '/',
    });

    await expect(firstActionPromise).resolves.toEqual({
      type: CliSessionShellInputActionType.COMPOSER_CHANGED,
      value: '/',
    });

    liveHandlers?.onAction({
      type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
    });
    await expect(
      runner.readAction({
        ...viewModel,
        composerValue: '/',
      }),
    ).resolves.toEqual({
      type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
    });

    runner.close();

    expect(rerenderLiveSessionShell).toHaveBeenCalledTimes(1);
    expect(fakeInstance.clear).toHaveBeenCalledTimes(1);
    expect(fakeInstance.unmount).toHaveBeenCalledTimes(1);
  });

  it('surfaces Ctrl+C as a standardized interrupt error', async () => {
    const fakeInstance = {
      rerender: vi.fn(),
      clear: vi.fn(),
      unmount: vi.fn(),
    };
    let liveHandlers:
      | {
          onAction: (action: {
            type: CliSessionShellInputActionType;
            value?: string;
          }) => void;
          onInterrupt: () => void;
          onEndOfInput: () => void;
        }
      | undefined;
    const runner = new CliSessionShellInkRunner(
      {
        mountLiveSessionShell: vi.fn((_viewModel, interactionHandlers) => {
          liveHandlers = interactionHandlers;
          return fakeInstance;
        }),
        rerenderLiveSessionShell: vi.fn((_instance, _viewModel, interactionHandlers) => {
          liveHandlers = interactionHandlers;
        }),
      } as never,
      {
        stdout: process.stderr,
      },
    );

    const actionPromise = runner.readAction(createViewModel());
    liveHandlers?.onInterrupt();

    await expect(actionPromise).rejects.toMatchObject({
      code: 'PROCESS_RUNTIME_CANCELLED',
    });
  });
});
