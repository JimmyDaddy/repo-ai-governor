import type { CodexExecRunner } from '@repo-ai-governor/adapter-codex';
import { AgentCliExecOperation } from '@repo-ai-governor/adapter-sdk';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  CliCodexExecFixtureEnvironmentKey,
  CliCodexExecFixtureMode,
} from '../constants/codex-exec-fixture.constant.js';

const CODEX_FIXTURE_SUCCESS_STDOUT = [
  '{"type":"thread.started","thread_id":"fixture-thread"}',
  '{"type":"item.completed","item":{"type":"agent_message","text":"OK"}}',
  '{"type":"turn.completed","usage":{"input_tokens":3,"output_tokens":1,"total_tokens":4}}',
].join('\n');

/**
 * Resolves deterministic Codex exec fixtures for gate and smoke execution paths.
 */
export class CliCodexExecFixtureRuntime {
  /**
   * Resolves one optional Codex exec runner override from environment.
   * @param environment Runtime environment seen by the CLI entrypoint.
   * @returns Deterministic runner override when fixture mode is configured.
   */
  public resolveExecRunner(environment: NodeJS.ProcessEnv): CodexExecRunner | undefined {
    const configuredMode = environment[CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE]?.trim();
    if (!configuredMode) {
      return undefined;
    }

    if (environment[CliCodexExecFixtureEnvironmentKey.ENABLE_FIXTURES]?.trim() !== '1') {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `${CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE} requires ${CliCodexExecFixtureEnvironmentKey.ENABLE_FIXTURES}=1.`,
        {
          environmentKey: CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE,
          requiredGateKey: CliCodexExecFixtureEnvironmentKey.ENABLE_FIXTURES,
        },
      );
    }

    if (configuredMode === CliCodexExecFixtureMode.SUCCESS) {
      return async () => ({
        stdout: CODEX_FIXTURE_SUCCESS_STDOUT,
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 1,
      });
    }

    if (configuredMode === CliCodexExecFixtureMode.CREDENTIAL_MISSING) {
      return async (request) => {
        throw new RuntimeError(
          request.operation === AgentCliExecOperation.PROBE
            ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
            : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
          'Codex fixture simulated credential failure.',
          {
            surface: 'codex',
            operation: request.operation,
            stderr: 'Not logged in. Run `codex login` first.',
          },
        );
      };
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Unsupported ${CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE} value "${configuredMode}".`,
      {
        environmentKey: CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE,
        supportedValues: Object.values(CliCodexExecFixtureMode),
      },
    );
  }
}
