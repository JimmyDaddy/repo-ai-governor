import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_OPTIONAL_GOVERNANCE_SCRIPT_PATHS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import type { CliCommandExecutorContext, CliCommandResultCheck } from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

/**
 * Owns `check` command execution outside the runtime facade.
 */
export class CliCheckCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.CHECK;

  public async execute(context: CliCommandExecutorContext) {
    const checks: CliCommandResultCheck[] = [];
    const failedChecks: string[] = [];

    checks.push({
      id: 'config_source',
      status:
        context.options.configSource === 'file'
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
      detail:
        context.options.configSource === 'file'
          ? 'repository config loaded'
          : 'default config in use; run `init` for explicit config',
    });

    for (const scriptPath of CLI_OPTIONAL_GOVERNANCE_SCRIPT_PATHS) {
      const absoluteScriptPath = resolve(context.options.currentWorkingDirectory, scriptPath);
      const checkId = scriptPath.replace('scripts/governance/', '').replace('.js', '');

      if (!existsSync(absoluteScriptPath)) {
        checks.push({
          id: checkId,
          status: CliGovernanceCheckStatus.WARN,
          detail: 'script_not_found',
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
          detail: summary.length > 0 ? summary : 'passed',
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

    const totals = context.calculateCheckTotals(checks);
    if (totals.fail > 0) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        `Governance checks failed: ${failedChecks.join(', ')}.`,
        {
          failedChecks,
          totals,
        },
      );
    }

    const message = `Governance checks completed: pass=${totals.pass} warn=${totals.warn} fail=${totals.fail}.`;
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
