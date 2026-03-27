import type { ClaudeCodeExecRunner } from '@repo-ai-governor/adapter-claude-code';
import { AgentCliExecOperation } from '@repo-ai-governor/adapter-sdk';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  CliClaudeCodeExecFixtureEnvironmentKey,
  CliClaudeCodeExecFixtureMode,
} from '../constants/claude-code-exec-fixture.constant.js';

/**
 * Resolves deterministic Claude Code exec fixtures for gate and smoke execution paths.
 */
export class CliClaudeCodeExecFixtureRuntime {
  /**
   * Resolves one optional Claude Code exec runner override from environment.
   * @param environment Runtime environment seen by the CLI entrypoint.
   * @returns Deterministic runner override when fixture mode is configured.
   */
  public resolveExecRunner(environment: NodeJS.ProcessEnv): ClaudeCodeExecRunner | undefined {
    const configuredMode = environment[CliClaudeCodeExecFixtureEnvironmentKey.EXEC_FIXTURE]?.trim();
    if (!configuredMode) {
      return undefined;
    }

    if (environment[CliClaudeCodeExecFixtureEnvironmentKey.ENABLE_FIXTURES]?.trim() !== '1') {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `${CliClaudeCodeExecFixtureEnvironmentKey.EXEC_FIXTURE} requires ${CliClaudeCodeExecFixtureEnvironmentKey.ENABLE_FIXTURES}=1.`,
        {
          environmentKey: CliClaudeCodeExecFixtureEnvironmentKey.EXEC_FIXTURE,
          requiredGateKey: CliClaudeCodeExecFixtureEnvironmentKey.ENABLE_FIXTURES,
        },
      );
    }

    if (configuredMode === CliClaudeCodeExecFixtureMode.SUCCESS) {
      return async ({ prompt, operation }) => ({
        stdout:
          operation === AgentCliExecOperation.PROBE || prompt.includes('Respond with exactly OK.')
            ? 'OK\n'
            : 'simulated claude code response\n',
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 1,
      });
    }

    if (configuredMode === CliClaudeCodeExecFixtureMode.CREDENTIAL_MISSING) {
      return async (request) => {
        throw new RuntimeError(
          request.operation === AgentCliExecOperation.PROBE
            ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
            : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
          'Claude Code fixture simulated credential failure.',
          {
            surface: 'claude-code',
            operation: request.operation,
            stderr: 'Authentication required. Run `claude auth login` first.',
          },
        );
      };
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Unsupported ${CliClaudeCodeExecFixtureEnvironmentKey.EXEC_FIXTURE} value "${configuredMode}".`,
      {
        environmentKey: CliClaudeCodeExecFixtureEnvironmentKey.EXEC_FIXTURE,
        supportedValues: Object.values(CliClaudeCodeExecFixtureMode),
      },
    );
  }
}
