import { CliCommandName } from '../../constants/cli-command.constant.js';
import { CLI_INIT_REACT_SHELL_DESCRIPTOR_ID } from '../../constants/cli-interactive-shell.constant.js';
import type { CliInitReactShellDescriptor } from '../../types/index.js';

/**
 * Owns descriptor definitions for the minimal `init` React-style shell.
 */
export class CliInitShellDescriptorRegistry {
  /**
   * Resolves the first bootstrap descriptor used by the `init` React-style shell.
   * @param localizeText Locale selector for English/Chinese copy.
   * @returns Stable `init` shell descriptor.
   */
  public resolveBootstrapDescriptor(
    localizeText: (english: string, chinese: string) => string,
  ): CliInitReactShellDescriptor {
    return {
      descriptorId: CLI_INIT_REACT_SHELL_DESCRIPTOR_ID,
      commandName: CliCommandName.INIT,
      title: localizeText('Bootstrap workspace defaults', '初始化工作区默认项'),
      intro: localizeText(
        'React shell baseline is active on stderr; stdout remains reserved for command results.',
        'React shell 基线已挂载到 stderr；stdout 仍只保留命令结果输出。',
      ),
      confirmationTitle: localizeText(
        'Step 3 of 3: Confirm bootstrap defaults',
        '第 3 / 3 步：确认初始化默认项',
      ),
      confirmationPrompt: localizeText(
        'Confirm bootstrap defaults? [Y/n]: ',
        '确认这些初始化默认项？[Y/n]: ',
      ),
      confirmationRestartMessage: localizeText(
        'Selection updated; returning to the first step.',
        '已重新编辑选择，返回第一步继续填写。',
      ),
      submitTitle: localizeText('Applying bootstrap defaults', '正在应用初始化默认项'),
      successMessage: localizeText(
        'Interactive setup applied successfully.',
        '交互式初始化配置已成功应用。',
      ),
      workspaceModeField: {
        fieldId: 'workspaceMode',
        title: localizeText('Step 1 of 3: Workspace mode', '第 1 / 3 步：工作区模式'),
        description: localizeText(
          'Choose where Repo AI Governor should keep its managed workspace metadata.',
          '选择 Repo AI Governor 托管工作区元数据的存放位置。',
        ),
        promptLabel: localizeText(
          'Workspace mode [1=tool_managed, 2=repo_local] (default: 1): ',
          '工作区模式 [1=tool_managed, 2=repo_local]（默认 1）: ',
        ),
      },
      workspaceModeValidationMessage: localizeText(
        'Workspace mode must be 1, 2, tool_managed, or repo_local.',
        '工作区模式只能填写 1、2、tool_managed 或 repo_local。',
      ),
      defaultLocaleField: {
        fieldId: 'defaultLocale',
        title: localizeText('Step 2 of 3: Default locale', '第 2 / 3 步：默认语言'),
        description: localizeText(
          'Choose the default locale used for human-readable CLI copy.',
          '选择 CLI 人类可读文案默认使用的语言。',
        ),
        promptLabel: localizeText(
          'Default locale [1=zh-CN, 2=en-US] (default: 1): ',
          '默认语言 [1=zh-CN, 2=en-US]（默认 1）: ',
        ),
      },
      defaultLocaleValidationMessage: localizeText(
        'Default locale must be 1, 2, zh-CN, or en-US.',
        '默认语言只能填写 1、2、zh-CN 或 en-US。',
      ),
      totalSteps: 3,
    };
  }
}
