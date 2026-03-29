import { stderr } from 'node:process';
import { ReactCliRunner, ReactCliStderrFramePresenter } from '../../react-cli/index.js';
import type { ReactCliStatusVariant, ReactCliViewModel } from '../../react-cli/index.js';
import type { CliInteractiveShellSessionState } from '../../types/index.js';

interface CliInteractiveShellStderrRendererLocalization {
  translate?: (key: string, interpolation?: Record<string, string>) => string;
}

/**
 * Owns stderr-only rendering for the minimal CLI interactive shell.
 */
export class CliInteractiveShellStderrRenderer {
  private readonly stderrFramePresenter: ReactCliStderrFramePresenter;
  private readonly writeStderr: (value: string) => void;
  private readonly reactCliRunner: ReactCliRunner;
  private readonly translate: (key: string, interpolation?: Record<string, string>) => string;

  public constructor(
    writeStderr: (value: string) => void = (value) => {
      stderr.write(value);
    },
    reactCliRunner: ReactCliRunner = new ReactCliRunner(),
    localization: CliInteractiveShellStderrRendererLocalization = {},
  ) {
    this.writeStderr = writeStderr;
    this.reactCliRunner = reactCliRunner;
    this.translate = localization.translate ?? ((key) => key);
    this.stderrFramePresenter = new ReactCliStderrFramePresenter(writeStderr, reactCliRunner);
  }

  /**
   * Creates one renderer clone that shares the same sink but uses a different translation runtime.
   * @param translate i18n translation function for user-visible labels.
   * @returns Renderer configured for the provided translation runtime.
   */
  public withTranslate(
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliInteractiveShellStderrRenderer {
    return new CliInteractiveShellStderrRenderer(this.writeStderr, this.reactCliRunner, {
      translate,
    });
  }

  /**
   * Renders one shell frame to stderr without touching stdout.
   * @param options Session metadata and body lines for the current shell frame.
   * @returns Nothing.
   */
  public renderFrame(options: {
    session: CliInteractiveShellSessionState;
    title: string;
    lines: string[];
  }): void {
    this.stderrFramePresenter.write(
      this.buildFrameViewModel(options.session, options.title, options.lines),
    );
  }

  /**
   * Renders the terminal restore boundary after the shell finishes or aborts.
   * @param session Session metadata after cleanup.
   * @returns Nothing.
   */
  public renderUnmount(session: CliInteractiveShellSessionState): void {
    const fallbackBehavior = session.fallbackBehavior ?? 'none';
    this.stderrFramePresenter.write({
      title: `[react-shell:${session.commandName}] session closed`,
      subtitle: `state=${session.runState} ui=${session.uiMode} theme=${session.uiTheme ?? 'governor'} stdout=${session.stdoutContract} stderr=${session.stderrRendering}`,
      themePreset: session.uiTheme,
      statusMessage: this.translate('cli.reactShell.shared.unmountedState', {
        state: session.runState,
        fallback: fallbackBehavior,
      }),
      statusVariant: this.resolveStatusVariant(session),
      sections: [
        {
          title: this.translate('cli.reactShell.shared.lifecycle'),
          lines: [
            `step=${session.currentStepTitle} total_steps=${session.totalSteps}`,
            `fallback=${fallbackBehavior}`,
          ],
        },
      ],
      footerShortcutsTitle: this.translate('cli.reactShell.shared.shortcuts'),
      footerShortcuts: [],
    });
  }

  private buildFrameViewModel(
    session: CliInteractiveShellSessionState,
    title: string,
    lines: string[],
  ): ReactCliViewModel {
    const validationSummary = Object.values(session.validationErrors);
    const sections = [
      {
        title: this.translate('cli.reactShell.shared.session'),
        lines: [`step=${session.currentStepTitle} total_steps=${session.totalSteps}`],
      },
      {
        title: this.translate('cli.reactShell.shared.details'),
        lines,
      },
    ];

    return {
      title: `[react-shell:${session.commandName}] ${title}`,
      subtitle: `state=${session.runState} ui=${session.uiMode} theme=${session.uiTheme ?? 'governor'} stdout=${session.stdoutContract} stderr=${session.stderrRendering}`,
      themePreset: session.uiTheme,
      statusMessage:
        session.runState === 'validating'
          ? this.translate('cli.reactShell.shared.validationFeedbackRequiresAnotherInputPass')
          : undefined,
      statusVariant: this.resolveStatusVariant(session),
      attentionSection:
        validationSummary.length > 0
          ? {
              title: this.translate('cli.reactShell.shared.attention'),
              lines: [`validation=${validationSummary.join('; ')}`],
            }
          : undefined,
      sections,
      helpSection: {
        title: this.translate('cli.reactShell.shared.help'),
        lines: [
          this.translate('cli.reactShell.shared.rendersOnStderrOnly'),
          `fallback=${session.fallbackBehavior ?? 'none'}`,
        ],
      },
      footerShortcutsTitle: this.translate('cli.reactShell.shared.shortcuts'),
      footerShortcuts: this.resolveFooterShortcuts(session),
    };
  }

  private resolveFooterShortcuts(session: CliInteractiveShellSessionState): string[] {
    if (session.runState === 'confirming') {
      return [
        this.translate('cli.reactShell.shared.enterConfirm'),
        this.translate('cli.reactShell.shared.restart'),
        this.translate('cli.reactShell.shared.cancel'),
      ];
    }

    if (session.runState === 'editing' || session.runState === 'validating') {
      return [
        this.translate('cli.reactShell.shared.submit'),
        this.translate('cli.reactShell.shared.cancel'),
      ];
    }

    return [this.translate('cli.reactShell.shared.cancel')];
  }

  private resolveStatusVariant(
    session: CliInteractiveShellSessionState,
  ): ReactCliStatusVariant | undefined {
    switch (session.runState) {
      case 'failure':
      case 'cancelled':
        return 'error';
      case 'validating':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  }
}
