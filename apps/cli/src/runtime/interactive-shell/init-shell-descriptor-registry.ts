import {
  DEFAULT_I18N_FALLBACK_LOCALE,
  DEFAULT_I18N_LOCALE,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import { CliCommandName } from '../../constants/cli-command.constant.js';
import { CLI_INIT_REACT_SHELL_DESCRIPTOR_ID } from '../../constants/cli-interactive-shell.constant.js';
import type { CliInitReactShellDescriptor } from '../../types/index.js';

/**
 * Owns descriptor definitions for the minimal `init` React-style shell.
 */
export class CliInitShellDescriptorRegistry {
  /**
   * Resolves the first bootstrap descriptor used by the `init` React-style shell.
   * @param translate i18n translation function for keyed copy resolution.
   * @returns Stable `init` shell descriptor.
   */
  public resolveBootstrapDescriptor(
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliInitReactShellDescriptor {
    return {
      descriptorId: CLI_INIT_REACT_SHELL_DESCRIPTOR_ID,
      commandName: CliCommandName.INIT,
      title: translate('cli.initShell.bootstrapTitle'),
      intro: translate('cli.initShell.bootstrapIntro'),
      confirmationTitle: translate('cli.initShell.confirmationTitle'),
      confirmationPrompt: translate('cli.initShell.confirmationPrompt'),
      confirmationRestartMessage: translate('cli.initShell.confirmationRestartMessage'),
      submitTitle: translate('cli.initShell.submitTitle'),
      successMessage: translate('cli.initShell.successMessage'),
      workspaceModeField: {
        fieldId: 'workspaceMode',
        title: translate('cli.initShell.workspaceModeTitle'),
        description: translate('cli.initShell.workspaceModeDescription'),
        promptLabel: translate('cli.initShell.workspaceModePromptLabel'),
        options: [
          {
            value: WorkspaceMode.TOOL_MANAGED,
            label: translate('cli.initShell.workspaceModeToolManagedOption'),
          },
          {
            value: WorkspaceMode.REPO_LOCAL,
            label: translate('cli.initShell.workspaceModeRepoLocalOption'),
          },
        ],
      },
      workspaceModeValidationMessage: translate('cli.initShell.workspaceModeValidation'),
      defaultLocaleField: {
        fieldId: 'defaultLocale',
        title: translate('cli.initShell.defaultLocaleTitle'),
        description: translate('cli.initShell.defaultLocaleDescription'),
        promptLabel: translate('cli.initShell.defaultLocalePromptLabel'),
        options: [
          {
            value: DEFAULT_I18N_LOCALE,
            label: translate('cli.initShell.defaultLocaleZhCnOption'),
          },
          {
            value: DEFAULT_I18N_FALLBACK_LOCALE,
            label: translate('cli.initShell.defaultLocaleEnUsOption'),
          },
        ],
      },
      defaultLocaleValidationMessage: translate('cli.initShell.defaultLocaleValidation'),
      totalSteps: 3,
    };
  }
}
