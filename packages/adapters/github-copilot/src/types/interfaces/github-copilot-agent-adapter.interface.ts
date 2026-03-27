import type {
  AgentCliAdapterOptions,
  AgentCliExecRunner,
  AgentCliExecRunnerRequest,
  AgentCliExecRunnerResult,
} from '@repo-ai-governor/adapter-sdk';

export interface GithubCopilotExecRunnerRequest extends AgentCliExecRunnerRequest {
  commandArgumentsPrefix: string[];
}

export type GithubCopilotExecRunnerResult = AgentCliExecRunnerResult;

export type GithubCopilotExecRunner = AgentCliExecRunner<GithubCopilotExecRunnerRequest>;

/**
 * Defines GitHub Copilot adapter constructor options.
 */
export interface GithubCopilotAgentAdapterOptions
  extends AgentCliAdapterOptions<GithubCopilotExecRunner> {}
