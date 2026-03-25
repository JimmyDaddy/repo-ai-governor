import type { GithubCopilotExecRunner } from "@repo-ai-governor/adapter-github-copilot";
import { AgentCliExecOperation } from "@repo-ai-governor/adapter-sdk";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  CliGithubCopilotExecFixtureEnvironmentKey,
  CliGithubCopilotExecFixtureMode,
} from "../constants/github-copilot-exec-fixture.constant.js";

const GITHUB_COPILOT_FIXTURE_SUCCESS_STDOUT = [
  '{"type":"assistant.message","data":{"content":"OK"}}',
  '{"type":"result","exitCode":0}',
].join("\n");

/**
 * Resolves deterministic GitHub Copilot exec fixtures for gate and smoke execution paths.
 */
export class CliGithubCopilotExecFixtureRuntime {
  /**
   * Resolves one optional GitHub Copilot exec runner override from environment.
   * @param environment Runtime environment seen by the CLI entrypoint.
   * @returns Deterministic runner override when fixture mode is configured.
   */
  public resolveExecRunner(environment: NodeJS.ProcessEnv): GithubCopilotExecRunner | undefined {
    const configuredMode =
      environment[CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE]?.trim();
    if (!configuredMode) {
      return undefined;
    }

    if (environment[CliGithubCopilotExecFixtureEnvironmentKey.ENABLE_FIXTURES]?.trim() !== "1") {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `${CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE} requires ${CliGithubCopilotExecFixtureEnvironmentKey.ENABLE_FIXTURES}=1.`,
        {
          environmentKey: CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE,
          requiredGateKey: CliGithubCopilotExecFixtureEnvironmentKey.ENABLE_FIXTURES,
        },
      );
    }

    if (configuredMode === CliGithubCopilotExecFixtureMode.SUCCESS) {
      return async ({ prompt, operation }) => ({
        stdout:
          operation === AgentCliExecOperation.PROBE || prompt.includes("Respond with exactly OK.")
            ? GITHUB_COPILOT_FIXTURE_SUCCESS_STDOUT
            : [
                '{"type":"assistant.message","data":{"content":"simulated github copilot response"}}',
                '{"type":"result","exitCode":0}',
              ].join("\n"),
        stderr: "",
        exitCode: 0,
        signal: null,
        elapsedMs: 1,
      });
    }

    if (configuredMode === CliGithubCopilotExecFixtureMode.CREDENTIAL_MISSING) {
      return async (request) => {
        throw new RuntimeError(
          request.operation === AgentCliExecOperation.PROBE
            ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
            : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
          "GitHub Copilot fixture simulated credential failure.",
          {
            surface: "github-copilot",
            operation: request.operation,
            stderr: "Authentication required. Run `gh auth login` or `gh copilot -- login` first.",
          },
        );
      };
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Unsupported ${CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE} value "${configuredMode}".`,
      {
        environmentKey: CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE,
        supportedValues: Object.values(CliGithubCopilotExecFixtureMode),
      },
    );
  }
}
