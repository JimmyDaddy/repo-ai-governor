import { ErrorOutputEnvironment, Locale } from '@repo-ai-governor/shared';
import { CliCommandName } from '../../src/constants/cli-command.constant.js';
import {
  CliInteractiveShellRunState,
  CliInteractiveShellStderrRenderingMode,
  CliInteractiveUiMode,
} from '../../src/constants/cli-interactive-shell.constant.js';
import {
  CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT,
  CliSessionShellForegroundFocusTarget,
  CliSessionShellForegroundInputOwner,
  CliSessionShellHandoffState,
  CliSessionShellInputMode,
  CliSessionShellMode,
  CliSessionShellPersistenceOwner,
  CliSessionTranscriptRole,
} from '../../src/constants/cli-session-shell.constant.js';
import { ReactCliRunner, ReactCliStderrFramePresenter } from '../../src/react-cli/index.js';
import { CliInteractiveShellStderrRenderer } from '../../src/runtime/interactive-shell/interactive-shell-stderr-renderer.js';
import { CliSessionShellStderrRenderer } from '../../src/runtime/interactive-shell/session-shell-stderr-renderer.js';
import type { CliInteractiveShellSessionState } from '../../src/types/index.js';

describe('ReactCliRunner', () => {
  it('renders shared shell frames through Ink and Ink UI', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderFrame({
      title: '[react-shell:init] Bootstrap workspace defaults',
      subtitle: 'state=editing ui=react stdout=pretty stderr=stderr_only',
      statusMessage: 'Validation feedback requires another input pass.',
      statusVariant: 'warning',
      attentionSection: {
        title: 'Attention',
        lines: ['Adapter verification: warn'],
      },
      sections: [
        {
          title: 'Session',
          lines: ['step=Step 1 of 3: Workspace mode total_steps=3'],
        },
        {
          title: 'Details',
          lines: ['Choose where Repo AI Governor should keep its managed workspace metadata.'],
        },
      ],
      helpSection: {
        title: 'Help',
        lines: ['Use --ui none to disable the shared shell.'],
      },
      footerShortcutsTitle: 'Shortcuts',
      footerShortcuts: ['Enter submit', 'Ctrl+C cancel'],
    });

    expect(output).toContain('[react-shell:init] Bootstrap workspace defaults');
    expect(output).toContain('Validation feedback requires another input pass.');
    expect(output).toContain('Attention');
    expect(output).toContain('Help');
    expect(output).toContain('Shortcuts');
  });

  it('renders the session-shell frame through the shared Ink runner', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame({
      sessionId: 'session-shell-preview-123',
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.PLAIN_TEXT,
      transcriptItems: [
        {
          id: 'system:1',
          role: CliSessionTranscriptRole.SYSTEM,
          label: 'System',
          lines: ['Session shell foundation is active.'],
        },
        {
          id: 'user:2',
          role: CliSessionTranscriptRole.USER,
          label: 'You',
          lines: ['hello governor'],
        },
      ],
      transcriptTitle: 'History',
      composerTitle: 'Current input',
      composerValue: '',
      composerPlaceholder: 'Type a message, / for commands, or ? for shortcuts.',
      slashQuery: '/wo',
      slashPaletteVisible: true,
      slashSuggestions: [
        {
          command: '/workspace',
          summary: 'Plan or execute workspace migration baseline.',
          highlightSegments: [
            { text: '/', highlighted: false },
            { text: 'wo', highlighted: true },
            { text: 'rkspace', highlighted: false },
          ],
        },
      ],
      highlightedCommand: '/workspace',
      slashPaletteTitle: 'Slash palette',
      slashPaletteEmptyState: 'No slash commands matched.',
      commandPreview: 'preview=/workspace state=preview_only',
      handoffState: CliSessionShellHandoffState.PREVIEWING,
      cwd: '/workspace/repo',
      workspaceSummary: 'workspace_id=repo mode=repo_local',
      outputContract: ErrorOutputEnvironment.PRETTY,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector: 'latest',
      foregroundInputOwner: CliSessionShellForegroundInputOwner.READLINE_FALLBACK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor session shell',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['/confirm · /cancel · Esc'],
    });

    expect(output).toContain('Repo AI Governor session shell');
    expect(output).toContain('Session shell foundation is active.');
    expect(output).toContain('History');
    expect(output).toContain('Current input');
    expect(output).toContain('governor>');
    expect(output).toContain('/workspace');
    expect(output).toContain('› ');
    expect(output).not.toContain('Prompt bar');
    expect(output).not.toContain('Session-first preview baseline.');
    expect(output).not.toContain('session_id=');
    expect(output).not.toContain('shell_mode=');
    expect(output).not.toContain('query=');
    expect(output).toContain('/confirm · /cancel · Esc');
  });

  it('mounts the session-shell tree through Ink for live stderr rendering', () => {
    const fakeInstance = {
      rerender: vi.fn(),
    };
    const renderLiveTree = vi.fn(() => fakeInstance);
    const runner = new ReactCliRunner(renderLiveTree as never);

    const instance = runner.mountSessionShell(
      {
        sessionId: 'session-shell-preview-ink',
        shellMode: CliSessionShellMode.SESSION_SHELL,
        inputMode: CliSessionShellInputMode.PLAIN_TEXT,
        transcriptItems: [],
        transcriptTitle: 'History',
        composerTitle: 'Current input',
        composerValue: '',
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
        foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
        foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
        inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
        title: 'Repo AI Governor session shell',
        subtitle: 'Session-first preview baseline.',
        promptBarTitle: 'Prompt bar',
        promptBarLines: ['? shortcuts · /status · Ctrl+D'],
      },
      {
        stdout: process.stderr,
      },
    );

    expect(renderLiveTree).toHaveBeenCalledTimes(1);
    expect(instance).toBe(fakeInstance);
  });

  it('mounts the live session-shell tree with interaction handlers', () => {
    const fakeInstance = {
      rerender: vi.fn(),
    };
    const renderLiveTree = vi.fn(() => fakeInstance);
    const runner = new ReactCliRunner(renderLiveTree as never);
    const interactionHandlers = {
      onAction: vi.fn(),
      onInterrupt: vi.fn(),
      onEndOfInput: vi.fn(),
    };

    const instance = runner.mountLiveSessionShell(
      {
        sessionId: 'session-shell-live-ink',
        shellMode: CliSessionShellMode.SESSION_SHELL,
        inputMode: CliSessionShellInputMode.PLAIN_TEXT,
        transcriptItems: [],
        transcriptTitle: 'History',
        composerTitle: 'Current input',
        composerValue: '',
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
        foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
        foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
        inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
        title: 'Repo AI Governor session shell',
        subtitle: 'Session-first preview baseline.',
        promptBarTitle: 'Prompt bar',
        promptBarLines: ['? shortcuts · /status · Ctrl+D'],
      },
      interactionHandlers,
      {
        stdout: process.stderr,
      },
    );

    expect(renderLiveTree).toHaveBeenCalledTimes(1);
    expect(instance).toBe(fakeInstance);
  });

  it('hides the slash palette section when the presenter marks it closed', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame({
      sessionId: 'session-shell-hidden-palette',
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.SLASH_COMMAND,
      transcriptItems: [],
      transcriptTitle: 'History',
      composerTitle: 'Current input',
      composerValue: '/wo',
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
      foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor session shell',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['Shortcuts: /help, /exit, Ctrl+C, Ctrl+D.'],
    });

    expect(output).not.toContain('Slash palette');
    expect(output).toContain('/wo');
  });
});

describe('ReactCliStderrFramePresenter', () => {
  it('writes one rendered shared shell frame to stderr', () => {
    const buffer: string[] = [];
    const presenter = new ReactCliStderrFramePresenter((value) => {
      buffer.push(value);
    });

    presenter.write({
      title: '[react-shell:connect] Connect adapters and capture diagnostics',
      subtitle: 'ui=react stdout=pretty descriptor=cli.connect.summary.m2',
      sections: [
        {
          title: 'Summary',
          lines: ['Connect completed.'],
        },
      ],
      footerShortcutsTitle: 'Shortcuts',
      footerShortcuts: ['stdout summary follows'],
    });

    expect(buffer.join('')).toContain(
      '[react-shell:connect] Connect adapters and capture diagnostics',
    );
    expect(buffer.join('')).toContain('stdout summary follows');
  });

  it('uses the resolved terminal width when rendering stderr frames', () => {
    const renderFrame = vi.fn(() => 'rendered frame');
    const presenter = new ReactCliStderrFramePresenter(
      () => undefined,
      {
        renderFrame,
      } as unknown as ReactCliRunner,
      () => 132,
    );

    presenter.write({
      title: '[react-shell:connect] Connect adapters and capture diagnostics',
      sections: [
        {
          title: 'Summary',
          lines: ['Connect completed.'],
        },
      ],
      footerShortcutsTitle: 'Shortcuts',
      footerShortcuts: ['stdout summary follows'],
    });

    expect(renderFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '[react-shell:connect] Connect adapters and capture diagnostics',
      }),
      {
        columns: 132,
      },
    );
  });
});

describe('CliInteractiveShellStderrRenderer', () => {
  it('routes session frames through the shared React CLI runner', () => {
    const buffer: string[] = [];
    const interpolate = (template: string, interpolation?: Record<string, string>) =>
      template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => interpolation?.[key] ?? '');
    const renderer = new CliInteractiveShellStderrRenderer(
      (value) => {
        buffer.push(value);
      },
      undefined,
      {
        translate: (key, interpolation) => {
          const translations: Record<string, string> = {
            'cli.reactShell.shared.unmountedState':
              'unmounted state={{state}} fallback={{fallback}}',
            'cli.reactShell.shared.lifecycle': 'Lifecycle',
            'cli.reactShell.shared.session': 'Session',
            'cli.reactShell.shared.details': 'Details',
            'cli.reactShell.shared.validationFeedbackRequiresAnotherInputPass':
              'Validation feedback requires another input pass.',
            'cli.reactShell.shared.attention': 'Attention',
            'cli.reactShell.shared.help': 'Help',
            'cli.reactShell.shared.shortcuts': 'Shortcuts',
            'cli.reactShell.shared.rendersOnStderrOnly': 'React shell renders on stderr only.',
            'cli.reactShell.shared.enterConfirm': 'Enter confirm',
            'cli.reactShell.shared.restart': 'N restart',
            'cli.reactShell.shared.submit': 'Enter submit',
            'cli.reactShell.shared.cancel': 'Ctrl+C cancel',
          };
          return interpolate(translations[key] ?? key, interpolation);
        },
      },
    );

    const session: CliInteractiveShellSessionState = {
      uiMode: CliInteractiveUiMode.REACT,
      commandName: CliCommandName.INIT,
      descriptorId: 'cli.init.bootstrap.m1',
      runState: CliInteractiveShellRunState.EDITING,
      currentStepTitle: 'Step 1 of 3: Workspace mode',
      totalSteps: 3,
      formValues: {},
      validationErrors: {},
      stderrRendering: CliInteractiveShellStderrRenderingMode.STDERR_ONLY,
      stdoutContract: ErrorOutputEnvironment.PRETTY,
      locale: Locale.EN_US,
      fallbackBehavior: null,
    };

    renderer.renderFrame({
      session,
      title: 'Bootstrap workspace defaults',
      lines: ['Choose where Repo AI Governor should keep its managed workspace metadata.'],
    });
    renderer.renderUnmount({
      ...session,
      runState: CliInteractiveShellRunState.SUCCESS,
    });

    const output = buffer.join('');
    expect(output).toContain('[react-shell:init] Bootstrap workspace defaults');
    expect(output).toContain(
      'Choose where Repo AI Governor should keep its managed workspace metadata.',
    );
    expect(output).toContain('unmounted state=success fallback=none');
  });
});

describe('CliSessionShellStderrRenderer', () => {
  it('clears the viewport before re-rendering interactive session-shell frames', () => {
    const buffer: string[] = [];
    const clearViewport = vi.fn(() => {
      buffer.push('[clear]');
    });
    const renderSessionShellFrame = vi.fn(() => 'rendered session frame');
    const renderer = new CliSessionShellStderrRenderer(
      (value) => {
        buffer.push(value);
      },
      {
        renderSessionShellFrame,
      } as unknown as ReactCliRunner,
      () => 120,
      () => true,
      clearViewport,
    );

    renderer.render({
      sessionId: 'session-shell-preview-456',
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.PLAIN_TEXT,
      transcriptItems: [],
      transcriptTitle: 'History',
      composerTitle: 'Current input',
      composerValue: '',
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
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor session shell',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['Shortcuts: /help, /exit, Ctrl+C, Ctrl+D.'],
    });

    expect(clearViewport).toHaveBeenCalledTimes(1);
    expect(renderSessionShellFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-shell-preview-456',
      }),
      {
        columns: 120,
      },
    );
    expect(buffer).toContain('[clear]');
    expect(buffer.at(-1)).toBe('rendered session frame\n');
  });
});
