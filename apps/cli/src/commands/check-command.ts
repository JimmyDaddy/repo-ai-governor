import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_OPTIONAL_GOVERNANCE_SCRIPT_PATHS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import { CliAdoptionPackRuntime } from '../runtime/adoption-pack-runtime.js';
import type { CliCommandExecutorContext, CliCommandResultCheck } from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

/**
 * Owns `check` command execution outside the runtime facade.
 */
export class CliCheckCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.CHECK;

  public constructor(
    private readonly adoptionPackRuntimeFactory: (
      currentWorkingDirectory: string,
      localizeText: (english: string, chinese: string) => string,
    ) => CliAdoptionPackRuntime = (currentWorkingDirectory, localizeText) =>
      new CliAdoptionPackRuntime(currentWorkingDirectory, localizeText),
  ) {}

  public async execute(context: CliCommandExecutorContext) {
    const checks: CliCommandResultCheck[] = [];
    const failedChecks: string[] = [];
    const adoptionPackRuntime = this.adoptionPackRuntimeFactory(
      context.options.currentWorkingDirectory,
      context.localizeText,
    );

    checks.push({
      id: 'config_source',
      status:
        context.options.configSource === 'file'
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
      detail:
        context.options.configSource === 'file'
          ? context.localizeText('repository config loaded', '已加载仓库配置')
          : context.localizeText(
              'default config in use; run `init` for explicit config',
              '当前使用默认配置；如需显式配置请运行 `init`。',
            ),
    });

    for (const scriptPath of CLI_OPTIONAL_GOVERNANCE_SCRIPT_PATHS) {
      const absoluteScriptPath = resolve(context.options.currentWorkingDirectory, scriptPath);
      const checkId = scriptPath.replace('scripts/governance/', '').replace('.js', '');

      if (!existsSync(absoluteScriptPath)) {
        checks.push({
          id: checkId,
          status: CliGovernanceCheckStatus.WARN,
          detail: context.localizeText('governance script not found', '未找到治理脚本'),
        });
        continue;
      }

      try {
        const result = await context.runNodeScript(absoluteScriptPath);
        const summary = [result.stdout.trim(), result.stderr.trim()]
          .filter((value) => value.length > 0)
          .join(' | ');
        checks.push({
          id: checkId,
          status: CliGovernanceCheckStatus.PASS,
          detail: summary.length > 0 ? summary : context.localizeText('passed', '通过'),
        });
      } catch (error) {
        const detail = context.formatExecFailureDetail(error);
        failedChecks.push(checkId);
        checks.push({
          id: checkId,
          status: CliGovernanceCheckStatus.FAIL,
          detail,
        });
      }
    }

    const adoptionReadinessChecks = await adoptionPackRuntime.collectCheckReadinessChecks();
    checks.push(
      ...adoptionReadinessChecks.map((check) => ({
        id: check.checkId,
        status:
          check.status === 'fail'
            ? CliGovernanceCheckStatus.FAIL
            : check.status === 'warn'
              ? CliGovernanceCheckStatus.WARN
              : CliGovernanceCheckStatus.PASS,
        detail: check.detail,
      })),
    );
    failedChecks.push(
      ...adoptionReadinessChecks
        .filter((check) => check.status === 'fail')
        .map((check) => check.checkId),
    );

    const totals = context.calculateCheckTotals(checks);
    if (totals.fail > 0) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        context.localizeText(
          `Governance checks failed: ${failedChecks.join(', ')}.`,
          `治理检查失败：${failedChecks.join(', ')}。`,
        ),
        {
          failedChecks,
          totals,
        },
      );
    }

    const message = context.localizeText(
      `Governance checks completed: pass=${totals.pass} warn=${totals.warn} fail=${totals.fail}.`,
      `治理检查完成：通过=${totals.pass} 警告=${totals.warn} 失败=${totals.fail}。`,
    );
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.GOVERNANCE_CHECK,
        summary: message,
        check_totals: totals,
        checks,
      },
    };
  }
}
