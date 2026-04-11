import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

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
import { CliSecretService } from '../runtime/secrets/cli-secret-service.js';
import type {
  CliCommandExecutorContext,
  CliCommandResultCheck,
  CliGovernanceCommandResult,
} from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

type CliSecretAction = 'set' | 'import' | 'delete' | 'list' | 'status';

interface CliSecretCommandDependencies {
  secretService?: CliSecretService;
  stdinReader?: () => Promise<string>;
  promptReader?: (promptText: string) => Promise<string>;
  promptInput?: NodeJS.ReadableStream;
  promptOutput?: NodeJS.WritableStream;
}

/**
 * Owns secure secret mutation UX while keeping selector truth out of config files.
 */
export class CliSecretCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.SECRET;

  private readonly secretService: CliSecretService;
  private readonly stdinReader: () => Promise<string>;
  private readonly promptReader: (promptText: string) => Promise<string>;
  private readonly promptInput: NodeJS.ReadableStream;
  private readonly promptOutput: NodeJS.WritableStream;

  public constructor(dependencies: CliSecretCommandDependencies = {}) {
    this.secretService = dependencies.secretService ?? new CliSecretService();
    this.stdinReader = dependencies.stdinReader ?? this.readSecretFromStdin.bind(this);
    this.promptInput = dependencies.promptInput ?? process.stdin;
    this.promptOutput = dependencies.promptOutput ?? process.stderr;
    this.promptReader = dependencies.promptReader ?? this.readSecretFromPrompt.bind(this);
  }

  public async execute(context: CliCommandExecutorContext): Promise<CliGovernanceCommandResult> {
    this.secretService.setLocalizeText(context.localizeText);
    const action = this.resolveAction(context);
    switch (action) {
      case 'set':
        return this.executeSet(context);
      case 'import':
        return this.executeImport(context);
      case 'delete':
        return this.executeDelete(context);
      case 'list':
        return this.executeList(context);
      case 'status':
        return this.executeStatus(context);
      default:
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          context.localizeText(
            `Unsupported secret action "${action}".`,
            `不支持的 secret 动作 "${action}"。`,
          ),
          {
            command: CliCommandName.SECRET,
            action,
          },
        );
    }
  }

  private async executeSet(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const keyName = this.requireKeyName(context);
    const environment = context.options.environment ?? process.env;
    if (context.options.secretCommandOptions?.fromEnv) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        context.localizeText(
          'secret set only accepts --stdin or the secure no-echo prompt; use `secret import --from-env ...` for environment imports.',
          'secret set 只接受 --stdin 或安全无回显输入；如需从环境变量导入，请使用 `secret import --from-env ...`。',
        ),
        {
          command: CliCommandName.SECRET,
          action: 'set',
        },
      );
    }
    const secretValue = await this.resolveSecretValueInput(context, 'set');
    const result = await this.secretService.setSecret({
      keyName,
      value: secretValue,
      backendId: context.options.secretCommandOptions?.backend,
      environment,
    });
    return this.createMutationResult(
      context,
      CLI_RUNTIME_OPERATION.SECRET_SET,
      'set',
      result.keyName,
      result.selector,
      result.backendId,
      result.warning,
    );
  }

  private async executeImport(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const keyName = this.requireKeyName(context);
    const environment = context.options.environment ?? process.env;
    const fromEnv = context.options.secretCommandOptions?.fromEnv?.trim() ?? '';
    if (fromEnv.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        context.localizeText(
          'secret import requires --from-env <ENV_VAR>.',
          'secret import 需要传入 --from-env <ENV_VAR>。',
        ),
        {
          command: CliCommandName.SECRET,
          action: 'import',
        },
      );
    }
    if (context.options.secretCommandOptions?.stdin) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        context.localizeText(
          'secret import accepts --from-env only; do not combine it with --stdin.',
          'secret import 只接受 --from-env；不要和 --stdin 组合使用。',
        ),
        {
          command: CliCommandName.SECRET,
          action: 'import',
        },
      );
    }
    const secretValue = environment[fromEnv] ?? '';
    if (secretValue.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_INPUT_INVALID,
        context.localizeText(
          `Environment variable ${fromEnv} is empty or undefined.`,
          `环境变量 ${fromEnv} 为空或未定义。`,
        ),
        {
          command: CliCommandName.SECRET,
          action: 'import',
          environmentKey: fromEnv,
        },
      );
    }
    const result = await this.secretService.setSecret({
      keyName,
      value: secretValue,
      backendId: context.options.secretCommandOptions?.backend,
      environment,
    });
    return this.createMutationResult(
      context,
      CLI_RUNTIME_OPERATION.SECRET_IMPORT,
      'import',
      result.keyName,
      result.selector,
      result.backendId,
      result.warning,
      fromEnv,
    );
  }

  private async executeDelete(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const keyName = this.requireKeyName(context);
    const environment = context.options.environment ?? process.env;
    const result = await this.secretService.deleteSecret({
      keyName,
      backendId: context.options.secretCommandOptions?.backend,
      environment,
    });
    const checks: CliCommandResultCheck[] = [
      {
        id: 'secret_action',
        status: CliGovernanceCheckStatus.PASS,
        detail: 'action=delete',
      },
      {
        id: 'secret_backend',
        status:
          result.deletedBackendIds.length > 0
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.WARN,
        detail:
          result.deletedBackendIds.length > 0 ? result.deletedBackendIds.join('|') : 'not_found',
      },
    ];
    const message = this.translate(context, 'cli.commandMessages.secret.deleteCompleted', {
      keyName: result.keyName,
      count: String(result.deletedBackendIds.length),
    });
    const experience = this.createExperience(context, message, null, [
      `key_name=${result.keyName}`,
      `selector=${result.selector}`,
      `deleted_backends=${
        result.deletedBackendIds.length > 0 ? result.deletedBackendIds.join('|') : 'none'
      }`,
    ]);

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.SECRET_DELETE,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action: 'delete',
          key_name: result.keyName,
          selector: result.selector,
          deleted_backend_ids:
            result.deletedBackendIds.length > 0 ? result.deletedBackendIds.join(' | ') : null,
          deleted_backend_count: result.deletedBackendIds.length,
        },
      },
    };
  }

  private async executeList(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const records = await this.secretService.listSecrets(
      context.options.environment ?? process.env,
    );
    const checks: CliCommandResultCheck[] = [
      {
        id: 'secret_action',
        status: CliGovernanceCheckStatus.PASS,
        detail: 'action=list',
      },
      {
        id: 'secret_records',
        status: records.length > 0 ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
        detail: `count=${records.length}`,
      },
    ];
    const recordsSummary = records
      .map(
        (record) =>
          `${record.keyName}@${record.backendId}:${record.exists ? 'present' : 'missing'}`,
      )
      .join(' | ');
    const message = this.translate(context, 'cli.commandMessages.secret.listCompleted', {
      count: String(records.length),
    });
    const experience = this.createExperience(
      context,
      message,
      null,
      records.length > 0
        ? records.map(
            (record) =>
              `${record.keyName}@${record.backendId}:${record.exists ? 'present' : 'missing'}`,
          )
        : ['records=none'],
    );

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.SECRET_LIST,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action: 'list',
          record_count: records.length,
          records: recordsSummary.length > 0 ? recordsSummary : null,
        },
      },
    };
  }

  private async executeStatus(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const status = await this.secretService.getStatus({
      requestedBackendId: context.options.secretCommandOptions?.backend,
      environment: context.options.environment ?? process.env,
    });
    const checks: CliCommandResultCheck[] = status.backends.map((backendStatus) => ({
      id: `secret_backend_${backendStatus.backendId}`,
      status: backendStatus.available
        ? CliGovernanceCheckStatus.PASS
        : CliGovernanceCheckStatus.WARN,
      detail: backendStatus.detail,
    }));
    const summary = status.backends
      .map(
        (backendStatus) =>
          `${backendStatus.backendId}:${backendStatus.available ? 'available' : 'unavailable'}`,
      )
      .join(' | ');
    const message = this.translate(context, 'cli.commandMessages.secret.statusCompleted', {
      backend:
        status.selectedBackendId ??
        status.defaultBackendId ??
        this.translate(context, 'cli.commandMessages.secret.noneLabel'),
    });
    const experience = this.createExperience(
      context,
      message,
      status.backends.find((backendStatus) => backendStatus.warning)?.warning ?? null,
      [
        `selected_backend=${status.selectedBackendId ?? 'none'}`,
        `default_backend=${status.defaultBackendId ?? 'none'}`,
        `index_path=${status.indexPath}`,
        ...status.backends.map(
          (backendStatus) =>
            `${backendStatus.backendId}=${backendStatus.available ? 'available' : 'unavailable'}:${backendStatus.detail}`,
        ),
      ],
    );

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.SECRET_STATUS,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action: 'status',
          selected_backend: status.selectedBackendId,
          default_backend: status.defaultBackendId,
          index_path: status.indexPath,
          backends: summary,
        },
      },
    };
  }

  private resolveAction(context: CliCommandExecutorContext): CliSecretAction {
    const rawAction = context.options.secretCommandOptions?.action?.trim().toLowerCase() ?? null;
    switch (rawAction) {
      case 'set':
      case 'import':
      case 'delete':
      case 'list':
      case 'status':
        return rawAction;
      default:
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          this.translate(context, 'cli.commands.secret.subcommandRequired'),
          {
            command: CliCommandName.SECRET,
          },
        );
    }
  }

  private requireKeyName(context: CliCommandExecutorContext): string {
    const keyName = context.options.secretCommandOptions?.keyName?.trim() ?? '';
    if (keyName.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        context.localizeText(
          'secret requires a <keyName> argument for this action.',
          '当前 secret 动作需要传入一个 <keyName> 参数。',
        ),
        {
          command: CliCommandName.SECRET,
        },
      );
    }
    return keyName;
  }

  private async resolveSecretValueInput(
    context: CliCommandExecutorContext,
    action: 'set',
  ): Promise<string> {
    if (context.options.secretCommandOptions?.stdin) {
      const value = this.stripSingleTrailingLineEnding(await this.stdinReader());
      if (value.length === 0) {
        throw new RuntimeError(
          GovernorErrorCode.SECRET_INPUT_INVALID,
          context.localizeText(
            'stdin secret input is empty.',
            '通过 stdin 读取到的 secret 输入为空。',
          ),
          {
            command: CliCommandName.SECRET,
            action,
          },
        );
      }
      return value;
    }

    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (!runtimeDebugOptions.inputTty || !runtimeDebugOptions.interactive) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_INPUT_INVALID,
        context.localizeText(
          'secret set requires --stdin in non-interactive mode; secure no-echo prompt is only available in interactive TTY sessions.',
          'secret set 在非交互模式下必须使用 --stdin；安全无回显输入只在交互式 TTY 会话中可用。',
        ),
        {
          command: CliCommandName.SECRET,
          action,
        },
      );
    }
    const value = await this.promptReader(context.localizeText('Secret value: ', 'Secret 值：'));
    if (value.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_INPUT_INVALID,
        context.localizeText('Prompted secret input is empty.', '交互输入得到的 secret 为空。'),
        {
          command: CliCommandName.SECRET,
          action,
        },
      );
    }
    return value;
  }

  private createMutationResult(
    context: CliCommandExecutorContext,
    operation: typeof CLI_RUNTIME_OPERATION.SECRET_SET | typeof CLI_RUNTIME_OPERATION.SECRET_IMPORT,
    action: 'set' | 'import',
    keyName: string,
    selector: string,
    backendId: string,
    warning: string | null,
    fromEnv: string | null = null,
  ): CliGovernanceCommandResult {
    const checks: CliCommandResultCheck[] = [
      {
        id: 'secret_action',
        status: CliGovernanceCheckStatus.PASS,
        detail: `action=${action}`,
      },
      {
        id: 'secret_backend',
        status: warning ? CliGovernanceCheckStatus.WARN : CliGovernanceCheckStatus.PASS,
        detail: backendId,
      },
    ];
    const message = this.translate(context, `cli.commandMessages.secret.${action}Completed`, {
      keyName,
      backend: backendId,
    });
    const experience = this.createExperience(context, message, warning, [
      `key_name=${keyName}`,
      `selector=${selector}`,
      `backend=${backendId}`,
      ...(fromEnv ? [`from_env=${fromEnv}`] : []),
    ]);

    return {
      message,
      commandResult: {
        operation,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action,
          key_name: keyName,
          selector,
          backend: backendId,
          warning: warning,
          from_env: fromEnv,
        },
      },
    };
  }

  private createExperience(
    context: CliCommandExecutorContext,
    summary: string,
    warning: string | null,
    details: string[],
  ) {
    return context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'secret-command',
          stage: ExecutionProgressStage.REPORT,
          status: warning ? ExecutionProgressStatus.WARNING : ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary,
        },
      ],
      interactionPrompts: [
        {
          category: ExecutionInteractionCategory.NONE,
          stage: ExecutionProgressStage.REPORT,
          title: this.translate(context, 'cli.commandMessages.secret.nextStepTitle'),
          action: warning ?? this.translate(context, 'cli.commandMessages.secret.precedenceHint'),
          blocking: false,
        },
      ],
      layeredLogs: {
        summary: [summary],
        detailed: details,
      },
    });
  }

  private async readSecretFromStdin(): Promise<string> {
    const chunks: string[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    }
    return chunks.join('');
  }

  private async readSecretFromPrompt(promptText: string): Promise<string> {
    const mutedOutput = new Writable({
      write: (_chunk, _encoding, callback) => {
        callback();
      },
    });
    const interfaceHandle = createInterface({
      input: this.promptInput,
      output: mutedOutput,
      terminal: true,
    });
    try {
      this.promptOutput.write(promptText);
      const value = await interfaceHandle.question('');
      this.promptOutput.write('\n');
      return value;
    } finally {
      interfaceHandle.close();
      mutedOutput.end();
    }
  }

  private stripSingleTrailingLineEnding(value: string): string {
    return value.replace(/\r?\n$/u, '');
  }

  private translate(
    context: CliCommandExecutorContext,
    key: string,
    interpolation?: Record<string, string>,
  ): string {
    return context.translate(key, interpolation);
  }
}
