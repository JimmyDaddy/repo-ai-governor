import { stderr, stdin } from 'node:process';
import { createInterface } from 'node:readline/promises';
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
import type {
  CliInitReactShellDescriptor,
  CliInitReactShellSelection,
  CliInteractiveShellPromptAdapter,
  CliInteractiveShellSessionState,
} from '../../types/index.js';
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
      createInterface({
        input: stdin,
        output: stderr,
      }),
  ) {}

  /**
   * Executes the minimal `init` shell and returns the selected bootstrap defaults.
   * @param options Locale-aware copy and output-contract metadata for the current CLI session.
   * @returns Selected workspace/bootstrap defaults.
   */
  public async run(options: {
    locale: Locale;
    outputMode: ErrorOutputEnvironment;
    translate: (key: string, interpolation?: Record<string, string>) => string;
  }): Promise<CliInitReactShellSelection> {
    const descriptor = this.descriptorRegistry.resolveBootstrapDescriptor(options.translate);
    const promptAdapter = this.promptAdapterFactory();
    const renderer = this.renderer.withTranslate(options.translate);
    const session = this.createSessionState(options.locale, options.outputMode, descriptor);
    let receivedSigint = false;

    const sigintHandler = (): void => {
      receivedSigint = true;
      session.runState = CliInteractiveShellRunState.CANCELLED;
      session.currentStepTitle = descriptor.confirmationTitle;
      session.fallbackBehavior = CliInteractiveShellFallbackBehavior.SIGINT;
      // Close immediately so a blocked readline question unwinds on SIGINT.
      promptAdapter.close();
    };

    process.on('SIGINT', sigintHandler);

    try {
      renderer.renderFrame({
        session,
        title: descriptor.title,
        lines: [descriptor.intro],
      });

      while (true) {
        const workspaceMode = await this.collectWorkspaceModeSelection(
          session,
          descriptor,
          promptAdapter,
          renderer,
          options.translate,
        );
        const defaultLocale = await this.collectDefaultLocaleSelection(
          session,
          descriptor,
          promptAdapter,
          renderer,
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
        renderer.renderFrame({
          session,
          title: descriptor.confirmationTitle,
          lines: [
            `workspaceMode=${workspaceMode}`,
            `defaultLocale=${defaultLocale}`,
            `fallbackLocale=${fallbackLocale}`,
          ],
        });

        const confirmed = await this.confirmSelection(promptAdapter, descriptor.confirmationPrompt);
        if (confirmed) {
          session.runState = CliInteractiveShellRunState.SUBMITTING;
          session.currentStepTitle = descriptor.submitTitle;
          renderer.renderFrame({
            session,
            title: descriptor.submitTitle,
            lines: [options.translate('cli.initShell.submittingDescriptor')],
          });

          session.runState = CliInteractiveShellRunState.SUCCESS;
          renderer.renderFrame({
            session,
            title: descriptor.submitTitle,
            lines: [descriptor.successMessage],
          });

          return {
            workspaceMode,
            defaultLocale,
            fallbackLocale,
          };
        }

        renderer.renderFrame({
          session,
          title: descriptor.confirmationTitle,
          lines: [descriptor.confirmationRestartMessage],
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
  ): CliInteractiveShellSessionState {
    return {
      uiMode: CliInteractiveUiMode.REACT,
      commandName: CliCommandName.INIT,
      descriptorId: descriptor.descriptorId,
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
    descriptor: {
      workspaceModeField: {
        title: string;
        description: string;
        promptLabel: string;
      };
      workspaceModeValidationMessage: string;
    },
    promptAdapter: CliInteractiveShellPromptAdapter,
    renderer: CliInteractiveShellStderrRenderer,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): Promise<WorkspaceMode> {
    while (true) {
      session.runState = CliInteractiveShellRunState.EDITING;
      session.currentStepTitle = descriptor.workspaceModeField.title;
      renderer.renderFrame({
        session,
        title: descriptor.workspaceModeField.title,
        lines: [descriptor.workspaceModeField.description],
      });
      const answer = (await promptAdapter.question(descriptor.workspaceModeField.promptLabel))
        .trim()
        .toLowerCase();
      const resolvedWorkspaceMode = this.resolveWorkspaceMode(answer);
      if (resolvedWorkspaceMode) {
        session.validationErrors = {};
        session.formValues.workspaceMode = resolvedWorkspaceMode;
        return resolvedWorkspaceMode;
      }

      session.runState = CliInteractiveShellRunState.VALIDATING;
      session.validationErrors = {
        workspaceMode: descriptor.workspaceModeValidationMessage,
      };
      renderer.renderFrame({
        session,
        title: descriptor.workspaceModeField.title,
        lines: [translate('cli.initShell.correctWorkspaceMode')],
      });
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
    descriptor: {
      defaultLocaleField: {
        title: string;
        description: string;
        promptLabel: string;
      };
      defaultLocaleValidationMessage: string;
    },
    promptAdapter: CliInteractiveShellPromptAdapter,
    renderer: CliInteractiveShellStderrRenderer,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): Promise<Locale> {
    while (true) {
      session.runState = CliInteractiveShellRunState.EDITING;
      session.currentStepTitle = descriptor.defaultLocaleField.title;
      renderer.renderFrame({
        session,
        title: descriptor.defaultLocaleField.title,
        lines: [descriptor.defaultLocaleField.description],
      });
      const answer = (await promptAdapter.question(descriptor.defaultLocaleField.promptLabel))
        .trim()
        .toLowerCase();
      const resolvedLocale = this.resolveDefaultLocale(answer);
      if (resolvedLocale) {
        session.validationErrors = {};
        session.formValues.defaultLocale = resolvedLocale;
        return resolvedLocale;
      }

      session.runState = CliInteractiveShellRunState.VALIDATING;
      session.validationErrors = {
        defaultLocale: descriptor.defaultLocaleValidationMessage,
      };
      renderer.renderFrame({
        session,
        title: descriptor.defaultLocaleField.title,
        lines: [translate('cli.initShell.correctLocale')],
      });
    }
  }

  /**
   * Confirms whether the operator wants to submit the collected bootstrap values.
   * @param promptAdapter Prompt adapter bound to stderr/stdin.
   * @param promptLabel Confirmation prompt label.
   * @returns True when selection should be submitted.
   */
  private async confirmSelection(
    promptAdapter: CliInteractiveShellPromptAdapter,
    promptLabel: string,
  ): Promise<boolean> {
    const answer = (await promptAdapter.question(promptLabel)).trim().toLowerCase();
    return answer.length === 0 || answer === 'y' || answer === 'yes';
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
}
