import { ErrorOutputEnvironment, Locale } from '@repo-ai-governor/shared';
import { CliCommandName } from '../../src/constants/cli-command.constant.js';
import {
  CliInteractiveShellRunState,
  CliInteractiveShellStderrRenderingMode,
  CliInteractiveUiMode,
} from '../../src/constants/cli-interactive-shell.constant.js';
import { ReactCliRunner, ReactCliStderrFramePresenter } from '../../src/react-cli/index.js';
import { CliInteractiveShellStderrRenderer } from '../../src/runtime/interactive-shell/interactive-shell-stderr-renderer.js';
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
