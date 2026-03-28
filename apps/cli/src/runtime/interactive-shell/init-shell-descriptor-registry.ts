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
      },
      workspaceModeValidationMessage: translate('cli.initShell.workspaceModeValidation'),
      defaultLocaleField: {
        fieldId: 'defaultLocale',
        title: translate('cli.initShell.defaultLocaleTitle'),
        description: translate('cli.initShell.defaultLocaleDescription'),
        promptLabel: translate('cli.initShell.defaultLocalePromptLabel'),
      },
      defaultLocaleValidationMessage: translate('cli.initShell.defaultLocaleValidation'),
      totalSteps: 3,
    };
  }
}
