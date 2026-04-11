import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import { CliUserConfigService } from '../runtime/cli-user-config-service.js';
import type {
  CliCommandExecutorContext,
  CliCommandResultCheck,
  CliGovernanceCommandResult,
} from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

type CliConfigAction = 'get' | 'set' | 'unset' | 'list' | 'status';

interface CliConfigCommandDependencies {
  userConfigService?: CliUserConfigService;
}

/**
 * Owns user-local default config authoring through the canonical user-config.yaml surface.
 */
export class CliConfigCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.CONFIG;

  private readonly userConfigService: CliUserConfigService;

  public constructor(dependencies: CliConfigCommandDependencies = {}) {
    this.userConfigService = dependencies.userConfigService ?? new CliUserConfigService();
  }

  public async execute(context: CliCommandExecutorContext): Promise<CliGovernanceCommandResult> {
    this.userConfigService.setLocalizeText(context.localizeText);
    const action = this.resolveAction(context);
    switch (action) {
      case 'get':
        return this.executeGet(context);
      case 'set':
        return this.executeSet(context);
      case 'unset':
        return this.executeUnset(context);
      case 'list':
        return this.executeList(context);
      case 'status':
        return this.executeStatus(context);
      default:
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          context.localizeText(
            `Unsupported config action "${action}".`,
            `不支持的 config 动作 "${action}"。`,
          ),
          {
            command: CliCommandName.CONFIG,
            action,
          },
        );
    }
  }

  private async executeGet(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const keyPath = this.requireKeyPath(context);
    const environment = context.options.environment ?? process.env;
    const status = this.userConfigService.resolveStatus({ environment });
    const document = this.userConfigService.loadConfig({ environment });
    const value = this.userConfigService.getValue(document, keyPath);
    const checks: CliCommandResultCheck[] = [
      {
        id: 'config_action',
        status: CliGovernanceCheckStatus.PASS,
        detail: 'action=get',
      },
      {
        id: 'config_key',
        status: value === null ? CliGovernanceCheckStatus.WARN : CliGovernanceCheckStatus.PASS,
        detail: keyPath,
      },
    ];
    const message =
      value === null
        ? this.translate(context, 'cli.commandMessages.config.getMissing', {
            keyPath,
          })
        : this.translate(context, 'cli.commandMessages.config.getCompleted', {
            keyPath,
            value,
          });
    const experience = this.createExperience(context, message, [
      `key_path=${keyPath}`,
      `value=${value ?? 'unset'}`,
      `config_path=${status.configPath}`,
      `legacy_preference_path=${status.legacyPreferencePath}`,
    ]);

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.USER_CONFIG_GET,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action: 'get',
          key_path: keyPath,
          value: value,
          config_path: status.configPath,
          legacy_preference_path: status.legacyPreferencePath,
          config_exists: status.configExists,
          legacy_preference_exists: status.legacyPreferenceExists,
        },
      },
    };
  }

  private async executeSet(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const keyPath = this.requireKeyPath(context);
    const environment = context.options.environment ?? process.env;
    const rawValue = context.options.configCommandOptions?.value?.trim() ?? '';
    if (rawValue.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        context.localizeText(
          'config set requires both <keyPath> and <value>.',
          'config set 需要同时传入 <keyPath> 和 <value>。',
        ),
        {
          command: CliCommandName.CONFIG,
          action: 'set',
        },
      );
    }

    const status = this.userConfigService.resolveStatus({ environment });
    const currentDocument = this.userConfigService.loadCanonicalConfig({ environment });
    const nextDocument = this.userConfigService.setValue(currentDocument, keyPath, rawValue);
    await this.persistConfig(
      status.configPath,
      this.userConfigService.renderConfigContent(nextDocument),
    );
    const persistedValue = this.userConfigService.getValue(nextDocument, keyPath) ?? rawValue;
    const checks: CliCommandResultCheck[] = [
      {
        id: 'config_action',
        status: CliGovernanceCheckStatus.PASS,
        detail: 'action=set',
      },
      {
        id: 'config_path',
        status: CliGovernanceCheckStatus.PASS,
        detail: status.configPath,
      },
    ];
    const message = this.translate(context, 'cli.commandMessages.config.setCompleted', {
      keyPath,
      value: persistedValue,
    });
    const experience = this.createExperience(context, message, [
      `key_path=${keyPath}`,
      `value=${persistedValue}`,
      `config_path=${status.configPath}`,
    ]);

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.USER_CONFIG_SET,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action: 'set',
          key_path: keyPath,
          value: persistedValue,
          config_path: status.configPath,
        },
      },
    };
  }

  private async executeUnset(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const keyPath = this.requireKeyPath(context);
    const environment = context.options.environment ?? process.env;
    const status = this.userConfigService.resolveStatus({ environment });
    const currentDocument = this.userConfigService.loadCanonicalConfig({ environment });
    const nextDocument = this.userConfigService.unsetValue(currentDocument, keyPath);
    await this.persistConfig(
      status.configPath,
      this.userConfigService.renderConfigContent(nextDocument),
    );
    const checks: CliCommandResultCheck[] = [
      {
        id: 'config_action',
        status: CliGovernanceCheckStatus.PASS,
        detail: 'action=unset',
      },
      {
        id: 'config_path',
        status: CliGovernanceCheckStatus.PASS,
        detail: status.configPath,
      },
    ];
    const message = this.translate(context, 'cli.commandMessages.config.unsetCompleted', {
      keyPath,
    });
    const experience = this.createExperience(context, message, [
      `key_path=${keyPath}`,
      `config_path=${status.configPath}`,
    ]);

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.USER_CONFIG_UNSET,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action: 'unset',
          key_path: keyPath,
          config_path: status.configPath,
        },
      },
    };
  }

  private async executeList(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const environment = context.options.environment ?? process.env;
    const status = this.userConfigService.resolveStatus({ environment });
    const document = this.userConfigService.loadConfig({ environment });
    const entries = this.userConfigService.listValues(document);
    const checks: CliCommandResultCheck[] = [
      {
        id: 'config_action',
        status: CliGovernanceCheckStatus.PASS,
        detail: 'action=list',
      },
      {
        id: 'config_entries',
        status: entries.length > 0 ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
        detail: `count=${entries.length}`,
      },
    ];
    const entriesSummary = entries.map((entry) => `${entry.keyPath}=${entry.value}`).join(' | ');
    const message = this.translate(context, 'cli.commandMessages.config.listCompleted', {
      count: String(entries.length),
    });
    const experience = this.createExperience(context, message, [
      `config_path=${status.configPath}`,
      ...(entries.length > 0
        ? entries.map((entry) => `${entry.keyPath}=${entry.value}`)
        : ['entries=none']),
    ]);

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.USER_CONFIG_LIST,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action: 'list',
          config_path: status.configPath,
          entry_count: entries.length,
          entries: entriesSummary.length > 0 ? entriesSummary : null,
        },
      },
    };
  }

  private async executeStatus(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const status = this.userConfigService.resolveStatus({
      environment: context.options.environment ?? process.env,
    });
    const checks: CliCommandResultCheck[] = [
      {
        id: 'config_action',
        status: CliGovernanceCheckStatus.PASS,
        detail: 'action=status',
      },
      {
        id: 'config_path',
        status: status.configExists ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
        detail: status.configPath,
      },
    ];
    const message = this.translate(context, 'cli.commandMessages.config.statusCompleted', {
      configPath: status.configPath,
    });
    const experience = this.createExperience(context, message, [
      `config_path=${status.configPath}`,
      `config_exists=${status.configExists}`,
      `legacy_preference_path=${status.legacyPreferencePath}`,
      `legacy_preference_exists=${status.legacyPreferenceExists}`,
      `theme_preference=${status.themePreference ?? 'unset'}`,
      `workspace_mode_preference=${status.workspaceModePreference ?? 'unset'}`,
    ]);

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.USER_CONFIG_STATUS,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action: 'status',
          config_path: status.configPath,
          config_exists: status.configExists,
          legacy_preference_path: status.legacyPreferencePath,
          legacy_preference_exists: status.legacyPreferenceExists,
          theme_preference: status.themePreference,
          workspace_mode_preference: status.workspaceModePreference,
        },
      },
    };
  }

  private resolveAction(context: CliCommandExecutorContext): CliConfigAction {
    const rawAction = context.options.configCommandOptions?.action?.trim().toLowerCase() ?? null;
    switch (rawAction) {
      case 'get':
      case 'set':
      case 'unset':
      case 'list':
      case 'status':
        return rawAction;
      default:
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          this.translate(context, 'cli.commands.config.subcommandRequired'),
          {
            command: CliCommandName.CONFIG,
          },
        );
    }
  }

  private requireKeyPath(context: CliCommandExecutorContext): string {
    const keyPath = context.options.configCommandOptions?.keyPath?.trim() ?? '';
    if (keyPath.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        context.localizeText(
          'config requires a supported <keyPath> argument for this action.',
          '当前 config 动作需要传入一个受支持的 <keyPath> 参数。',
        ),
        {
          command: CliCommandName.CONFIG,
        },
      );
    }
    return keyPath;
  }

  private async persistConfig(configPath: string, content: string): Promise<void> {
    await mkdir(dirname(configPath), { recursive: true });
    await writeFile(configPath, content, 'utf8');
  }

  private createExperience(context: CliCommandExecutorContext, summary: string, details: string[]) {
    return context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'user-config',
          stage: ExecutionProgressStage.REPORT,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary,
        },
      ],
      interactionPrompts: [
        {
          category: ExecutionInteractionCategory.NONE,
          stage: ExecutionProgressStage.REPORT,
          title: this.translate(context, 'cli.commandMessages.config.nextStepTitle'),
          action: this.translate(context, 'cli.commandMessages.config.precedenceHint'),
          blocking: false,
        },
      ],
      layeredLogs: {
        summary: [summary],
        detailed: details,
      },
    });
  }

  private translate(
    context: CliCommandExecutorContext,
    key: string,
    interpolation?: Record<string, string>,
  ): string {
    return context.translate(key, interpolation);
  }
}
