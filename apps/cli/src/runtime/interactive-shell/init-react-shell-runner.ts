import {
  BaseError,
  DEFAULT_I18N_FALLBACK_LOCALE,
  DEFAULT_I18N_LOCALE,
  type ErrorOutputEnvironment,
  GovernorErrorCode,
  type Locale,
  RuntimeError,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import { CliCommandName } from '../../constants/cli-command.constant.js';
import {
  CliInteractiveShellFallbackBehavior,
  CliInteractiveShellRunState,
  CliInteractiveShellStderrRenderingMode,
  CliInteractiveUiMode,
} from '../../constants/cli-interactive-shell.constant.js';
import {
  type CliReactThemePreset,
  DEFAULT_CLI_REACT_THEME_PRESET,
} from '../../constants/cli-react-theme.constant.js';
import type {
  CliInitReactShellDescriptor,
  CliInitReactShellSelection,
  CliInteractiveShellPromptAdapter,
  CliInteractiveShellSessionState,
} from '../../types/index.js';
import { CliInitReactShellInkPromptAdapter } from './init-react-shell-ink-prompt-adapter.js';
import { CliInitShellDescriptorRegistry } from './init-shell-descriptor-registry.js';
import { CliInteractiveShellStderrRenderer } from './interactive-shell-stderr-renderer.js';

/**
 * Owns the minimal React-style `init` wizard baseline with descriptor-driven state and stderr rendering.
 */
export class CliInitReactShellRunner {
  public constructor(
    private readonly descriptorRegistry: CliInitShellDescriptorRegistry = new CliInitShellDescriptorRegistry(),
    private readonly renderer: CliInteractiveShellStderrRenderer = new CliInteractiveShellStderrRenderer(),
    private readonly promptAdapterFactory: () => CliInteractiveShellPromptAdapter = () =>
      new CliInitReactShellInkPromptAdapter(),
  ) {}

  /**
   * Executes the minimal `init` shell and returns the selected bootstrap defaults.
   * @param options Locale-aware copy and output-contract metadata for the current CLI session.
   * @returns Selected workspace/bootstrap defaults.
   */
  public async run(options: {
    locale: Locale;
    outputMode: ErrorOutputEnvironment;
    uiTheme?: CliReactThemePreset;
    translate: (key: string, interpolation?: Record<string, string>) => string;
  }): Promise<CliInitReactShellSelection> {
    const descriptor = this.descriptorRegistry.resolveBootstrapDescriptor(options.translate);
    const promptAdapter = this.promptAdapterFactory();
    const renderer = this.renderer.withTranslate(options.translate);
    const session = this.createSessionState(
      options.locale,
      options.outputMode,
      descriptor,
      options.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET,
    );
    let receivedSigint = false;

    const sigintHandler = (): void => {
      receivedSigint = true;
      session.runState = CliInteractiveShellRunState.CANCELLED;
      session.currentStepTitle = descriptor.confirmationTitle;
      session.fallbackBehavior = CliInteractiveShellFallbackBehavior.SIGINT;
      // Close immediately so a blocked Ink prompt resolves cleanup on SIGINT.
      promptAdapter.close();
    };

    process.on('SIGINT', sigintHandler);

    try {
      while (true) {
        const workspaceMode = await this.collectWorkspaceModeSelection(
          session,
          descriptor,
          promptAdapter,
          options.translate,
        );
        const defaultLocale = await this.collectDefaultLocaleSelection(
          session,
          descriptor,
          promptAdapter,
          options.translate,
        );
        const fallbackLocale =
          defaultLocale === DEFAULT_I18N_LOCALE
            ? DEFAULT_I18N_FALLBACK_LOCALE
            : DEFAULT_I18N_LOCALE;

        session.runState = CliInteractiveShellRunState.CONFIRMING;
        session.currentStepTitle = descriptor.confirmationTitle;
        session.formValues = {
          workspaceMode,
          defaultLocale,
          fallbackLocale,
        };
        session.validationErrors = {};

        const confirmed = await this.confirmSelection(
          session,
          promptAdapter,
          {
            title: descriptor.confirmationTitle,
            promptLabel: descriptor.confirmationPrompt,
            summaryLines: [
              `workspaceMode=${workspaceMode}`,
              `defaultLocale=${defaultLocale}`,
              `fallbackLocale=${fallbackLocale}`,
            ],
          },
          options.translate,
        );
        if (confirmed) {
          session.runState = CliInteractiveShellRunState.SUBMITTING;
          session.currentStepTitle = descriptor.submitTitle;
          this.renderStatusFrame(promptAdapter, renderer, {
            session,
            title: descriptor.submitTitle,
            lines: [options.translate('cli.initShell.submittingDescriptor')],
            translate: options.translate,
          });

          session.runState = CliInteractiveShellRunState.SUCCESS;
          this.renderStatusFrame(promptAdapter, renderer, {
            session,
            title: descriptor.submitTitle,
            lines: [descriptor.successMessage],
            translate: options.translate,
          });

          return {
            workspaceMode,
            defaultLocale,
            fallbackLocale,
          };
        }

        this.renderStatusFrame(promptAdapter, renderer, {
          session,
          title: descriptor.confirmationTitle,
          lines: [descriptor.confirmationRestartMessage],
          translate: options.translate,
        });
      }
    } catch (error) {
      if (receivedSigint) {
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
          options.translate('cli.initShell.cancelledBySigint'),
          {
            commandName: CliCommandName.INIT,
            uiMode: CliInteractiveUiMode.REACT,
          },
        );
      }

      if (error instanceof BaseError) {
        throw error;
      }

      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        options.translate('cli.initShell.failedBeforeApply'),
        {
          commandName: CliCommandName.INIT,
          uiMode: CliInteractiveUiMode.REACT,
        },
      );
    } finally {
      // `on` is paired with `off` here so both normal exit and non-SIGINT failures release the listener.
      process.off('SIGINT', sigintHandler);
      // A second close is intentional: SIGINT uses it to break the prompt, finally uses it as teardown.
      promptAdapter.close();
      renderer.renderUnmount(session);
    }
  }

  /**
   * Creates the initial shell session state used by the runner and stderr renderer.
   * @param locale Current CLI locale.
   * @param outputMode Current stdout contract.
   * @param descriptor Resolved `init` shell descriptor.
   * @returns New mutable shell session state.
   */
  private createSessionState(
    locale: Locale,
    outputMode: ErrorOutputEnvironment,
    descriptor: CliInitReactShellDescriptor,
    uiTheme: CliReactThemePreset,
  ): CliInteractiveShellSessionState {
    return {
      uiMode: CliInteractiveUiMode.REACT,
      commandName: CliCommandName.INIT,
      descriptorId: descriptor.descriptorId,
      uiTheme,
      runState: CliInteractiveShellRunState.IDLE,
      currentStepTitle: descriptor.workspaceModeField.title,
      totalSteps: descriptor.totalSteps,
      formValues: {},
      validationErrors: {},
      stderrRendering: CliInteractiveShellStderrRenderingMode.STDERR_ONLY,
      stdoutContract: outputMode,
      locale,
      fallbackBehavior: null,
    };
  }

  /**
   * Collects the bootstrap workspace mode with descriptor-driven validation feedback.
   * @param session Mutable shell session state.
   * @param descriptor Resolved `init` shell descriptor.
   * @param promptAdapter Prompt adapter bound to stderr/stdin.
   * @param translate i18n translation function.
   * @returns Valid workspace mode selection.
   */
  private async collectWorkspaceModeSelection(
    session: CliInteractiveShellSessionState,
    descriptor: Pick<
      CliInitReactShellDescriptor,
      'workspaceModeField' | 'workspaceModeValidationMessage'
    >,
    promptAdapter: CliInteractiveShellPromptAdapter,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): Promise<WorkspaceMode> {
    while (true) {
      session.runState =
        Object.keys(session.validationErrors).length > 0
          ? CliInteractiveShellRunState.VALIDATING
          : CliInteractiveShellRunState.EDITING;
      session.currentStepTitle = descriptor.workspaceModeField.title;
      const answer = await promptAdapter.select({
        session,
        title: descriptor.workspaceModeField.title,
        description: descriptor.workspaceModeField.description,
        options: descriptor.workspaceModeField.options ?? [],
        defaultValue: WorkspaceMode.TOOL_MANAGED,
        translate,
      });
      const resolvedWorkspaceMode = this.resolveWorkspaceMode(answer.trim().toLowerCase());
      if (resolvedWorkspaceMode) {
        session.validationErrors = {};
        session.formValues.workspaceMode = resolvedWorkspaceMode;
        return resolvedWorkspaceMode;
      }

      session.validationErrors = {
        workspaceMode: descriptor.workspaceModeValidationMessage,
      };
    }
  }

  /**
   * Collects the bootstrap default locale with descriptor-driven validation feedback.
   * @param session Mutable shell session state.
   * @param descriptor Resolved `init` shell descriptor.
   * @param promptAdapter Prompt adapter bound to stderr/stdin.
   * @param translate i18n translation function.
   * @returns Valid default locale selection.
   */
  private async collectDefaultLocaleSelection(
    session: CliInteractiveShellSessionState,
    descriptor: Pick<
      CliInitReactShellDescriptor,
      'defaultLocaleField' | 'defaultLocaleValidationMessage'
    >,
    promptAdapter: CliInteractiveShellPromptAdapter,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): Promise<Locale> {
    while (true) {
      session.runState =
        Object.keys(session.validationErrors).length > 0
          ? CliInteractiveShellRunState.VALIDATING
          : CliInteractiveShellRunState.EDITING;
      session.currentStepTitle = descriptor.defaultLocaleField.title;
      const answer = await promptAdapter.select({
        session,
        title: descriptor.defaultLocaleField.title,
        description: descriptor.defaultLocaleField.description,
        options: descriptor.defaultLocaleField.options ?? [],
        defaultValue: DEFAULT_I18N_LOCALE,
        translate,
      });
      const resolvedLocale = this.resolveDefaultLocale(answer.trim().toLowerCase());
      if (resolvedLocale) {
        session.validationErrors = {};
        session.formValues.defaultLocale = resolvedLocale;
        return resolvedLocale;
      }

      session.validationErrors = {
        defaultLocale: descriptor.defaultLocaleValidationMessage,
      };
    }
  }

  /**
   * Confirms whether the operator wants to submit the collected bootstrap values.
   * @param promptAdapter Prompt adapter bound to stderr/stdin.
   * @param promptLabel Confirmation prompt label.
   * @returns True when selection should be submitted.
   */
  private async confirmSelection(
    session: CliInteractiveShellSessionState,
    promptAdapter: CliInteractiveShellPromptAdapter,
    options: {
      title: string;
      promptLabel: string;
      summaryLines: string[];
    },
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): Promise<boolean> {
    return await promptAdapter.confirm({
      session,
      title: options.title,
      promptLabel: options.promptLabel,
      summaryLines: options.summaryLines,
      translate,
    });
  }

  /**
   * Resolves one workspace-mode answer into the canonical enum value.
   * @param answer Raw prompt answer.
   * @returns Workspace mode when valid; otherwise `null`.
   */
  private resolveWorkspaceMode(answer: string): WorkspaceMode | null {
    if (answer.length === 0 || answer === '1' || answer === WorkspaceMode.TOOL_MANAGED) {
      return WorkspaceMode.TOOL_MANAGED;
    }

    if (answer === '2' || answer === WorkspaceMode.REPO_LOCAL) {
      return WorkspaceMode.REPO_LOCAL;
    }

    return null;
  }

  /**
   * Resolves one locale answer into the canonical enum value.
   * @param answer Raw prompt answer.
   * @returns Locale when valid; otherwise `null`.
   */
  private resolveDefaultLocale(answer: string): Locale | null {
    if (answer.length === 0 || answer === '1' || answer === DEFAULT_I18N_LOCALE.toLowerCase()) {
      return DEFAULT_I18N_LOCALE;
    }

    if (answer === '2' || answer === DEFAULT_I18N_FALLBACK_LOCALE.toLowerCase()) {
      return DEFAULT_I18N_FALLBACK_LOCALE;
    }

    return null;
  }

  /**
   * Renders one status transition through the live prompt adapter when supported.
   * Why: keeping submit/success states inside the same Ink instance avoids stacked stderr frames.
   * @param promptAdapter Prompt adapter bound to the current live shell session.
   * @param renderer Static stderr renderer used as a compatibility fallback.
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
