import type { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import { BaseError, GovernorErrorCode, type Locale, RuntimeError } from '@repo-ai-governor/shared';
import { CliCommandName } from '../../constants/cli-command.constant.js';
import {
  CliInteractiveShellFallbackBehavior,
  CliInteractiveShellRunState,
  CliInteractiveShellStderrRenderingMode,
  CliInteractiveUiMode,
} from '../../constants/cli-interactive-shell.constant.js';
import {
  CLI_REACT_THEME_PRESET_ORDER,
  CLI_REACT_THEME_VALUES,
  type CliReactThemePreset,
  DEFAULT_CLI_REACT_THEME_PRESET,
} from '../../constants/cli-react-theme.constant.js';
import { CliWorkspaceThemeScope } from '../../constants/cli-workspace.constant.js';
import type {
  CliInteractiveShellFieldOption,
  CliInteractiveShellPromptAdapter,
  CliInteractiveShellSessionState,
} from '../../types/index.js';
import { CliInitReactShellInkPromptAdapter } from './init-react-shell-ink-prompt-adapter.js';
import { CliInteractiveShellStderrRenderer } from './interactive-shell-stderr-renderer.js';

/**
 * Owns the minimal React-shell selector used by `set-ui-theme` when the preset is omitted.
 */
export class CliThemeSelectReactShellRunner {
  public constructor(
    private readonly renderer: CliInteractiveShellStderrRenderer = new CliInteractiveShellStderrRenderer(),
    private readonly promptAdapterFactory: () => CliInteractiveShellPromptAdapter = () =>
      new CliInitReactShellInkPromptAdapter(),
  ) {}

  /**
   * Collects one theme preset through the shared React-shell select surface.
   * @param options Locale-aware shell metadata plus the target persistence scope.
   * @returns The theme preset selected by the user.
   */
  public async run(options: {
    locale: string;
    outputMode: ErrorOutputEnvironment;
    uiTheme?: CliReactThemePreset;
    currentTheme?: CliReactThemePreset | null;
    themeScope: CliWorkspaceThemeScope;
    translate: (key: string, interpolation?: Record<string, string>) => string;
  }): Promise<CliReactThemePreset> {
    const promptAdapter = this.promptAdapterFactory();
    const renderer = this.renderer.withTranslate(options.translate);
    const session = this.createSessionState(
      options.locale,
      options.outputMode,
      options.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET,
      options.themeScope,
    );
    let receivedSigint = false;

    const sigintHandler = (): void => {
      receivedSigint = true;
      session.runState = CliInteractiveShellRunState.CANCELLED;
      session.currentStepTitle = options.translate('cli.reactShell.themeSelector.title');
      session.fallbackBehavior = CliInteractiveShellFallbackBehavior.SIGINT;
      promptAdapter.close();
    };

    process.on('SIGINT', sigintHandler);

    try {
      while (true) {
        session.runState =
          Object.keys(session.validationErrors).length > 0
            ? CliInteractiveShellRunState.VALIDATING
            : CliInteractiveShellRunState.EDITING;
        session.currentStepTitle = options.translate('cli.reactShell.themeSelector.title');

        const selectedTheme = await promptAdapter.select({
          session,
          title: options.translate('cli.reactShell.themeSelector.title'),
          description: this.resolveScopeDescription(options.themeScope, options.translate),
          options: this.buildThemeOptions(options.currentTheme, options.translate),
          defaultValue: options.currentTheme ?? DEFAULT_CLI_REACT_THEME_PRESET,
          translate: options.translate,
        });

        if (!CLI_REACT_THEME_VALUES.has(selectedTheme)) {
          session.validationErrors = {
            theme: options.translate('cli.reactShell.themeSelector.validation'),
          };
          continue;
        }

        session.validationErrors = {};
        session.formValues = {
          theme: selectedTheme,
          scope: options.themeScope,
        };
        session.runState = CliInteractiveShellRunState.SUBMITTING;
        session.currentStepTitle = options.translate(
          'cli.reactShell.themeSelector.submittingTitle',
        );
        this.renderStatusFrame(promptAdapter, renderer, {
          session,
          title: options.translate('cli.reactShell.themeSelector.submittingTitle'),
          lines: [
            options.translate('cli.reactShell.themeSelector.submittingMessage', {
              theme: selectedTheme,
              scope: options.themeScope,
            }),
          ],
          translate: options.translate,
        });

        session.runState = CliInteractiveShellRunState.SUCCESS;
        this.renderStatusFrame(promptAdapter, renderer, {
          session,
          title: options.translate('cli.reactShell.themeSelector.submittingTitle'),
          lines: [
            options.translate('cli.reactShell.themeSelector.successMessage', {
              theme: selectedTheme,
              scope: options.themeScope,
            }),
          ],
          translate: options.translate,
        });

        return selectedTheme as CliReactThemePreset;
      }
    } catch (error) {
      if (receivedSigint) {
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
          options.translate('cli.reactShell.themeSelector.cancelledBySigint'),
          {
            commandName: CliCommandName.WORKSPACE,
            uiMode: CliInteractiveUiMode.REACT,
          },
        );
      }

      if (error instanceof BaseError) {
        throw error;
      }

      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        options.translate('cli.reactShell.themeSelector.failedBeforeApply'),
        {
          commandName: CliCommandName.WORKSPACE,
          uiMode: CliInteractiveUiMode.REACT,
        },
      );
    } finally {
      process.off('SIGINT', sigintHandler);
      promptAdapter.close();
      renderer.renderUnmount(session);
    }
  }

  /**
   * Creates the shared session state used by the selector shell and stderr renderer.
   * @param locale Current CLI locale string.
   * @param outputMode Current stdout contract.
   * @param uiTheme Theme used to render the selector shell itself.
   * @param themeScope Target persistence scope for the selected preset.
   * @returns New mutable shell session state.
   */
  private createSessionState(
    locale: string,
    outputMode: ErrorOutputEnvironment,
    uiTheme: CliReactThemePreset,
    themeScope: CliWorkspaceThemeScope,
  ): CliInteractiveShellSessionState {
    return {
      uiMode: CliInteractiveUiMode.REACT,
      commandName: CliCommandName.WORKSPACE,
      descriptorId: 'cli.workspace.theme-selector.m1',
      uiTheme,
      runState: CliInteractiveShellRunState.IDLE,
      currentStepTitle: 'theme-selector',
      totalSteps: 1,
      formValues: {
        scope: themeScope,
      },
      validationErrors: {},
      stderrRendering: CliInteractiveShellStderrRenderingMode.STDERR_ONLY,
      stdoutContract: outputMode,
      locale: locale as Locale,
      fallbackBehavior: null,
    };
  }

  /**
   * Builds localized theme options while biasing the current target theme to the top.
   * @param currentTheme Current persisted theme for the selected scope, when available.
   * @param translate i18n translation function.
   * @returns Ordered select options consumed by the shared prompt adapter.
   */
  private buildThemeOptions(
    currentTheme: CliReactThemePreset | null | undefined,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliInteractiveShellFieldOption[] {
    const orderedThemes = currentTheme
      ? [currentTheme, ...CLI_REACT_THEME_PRESET_ORDER.filter((theme) => theme !== currentTheme)]
      : [...CLI_REACT_THEME_PRESET_ORDER];

    return orderedThemes.map((theme) => ({
      value: theme,
      label: `${theme}: ${translate(`cli.reactShell.themePresets.${theme}.description`)}`,
    }));
  }

  /**
   * Resolves the selector scope hint shown above the live theme list.
   * @param themeScope Target persistence scope.
   * @param translate i18n translation function.
   * @returns Localized scope-specific selector description.
   */
  private resolveScopeDescription(
    themeScope: CliWorkspaceThemeScope,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): string {
    return themeScope === CliWorkspaceThemeScope.GLOBAL
      ? translate('cli.reactShell.themeSelector.globalDescription')
      : translate('cli.reactShell.themeSelector.workspaceDescription');
  }

  /**
   * Renders one status-only shell frame when the selector is applying or finishing.
   * @param promptAdapter Prompt adapter bound to stderr/stdin.
   * @param renderer Shared stderr renderer.
   * @param frame Status frame payload.
   * @returns Nothing.
   */
  private renderStatusFrame(
    promptAdapter: CliInteractiveShellPromptAdapter,
    renderer: CliInteractiveShellStderrRenderer,
    frame: {
      session: CliInteractiveShellSessionState;
      title: string;
      lines: string[];
      translate: (key: string, interpolation?: Record<string, string>) => string;
    },
  ): void {
    if (promptAdapter.renderStatus) {
      promptAdapter.renderStatus(frame);
      return;
    }

    renderer.renderFrame({
      session: frame.session,
      title: frame.title,
      lines: frame.lines,
    });
  }
}
