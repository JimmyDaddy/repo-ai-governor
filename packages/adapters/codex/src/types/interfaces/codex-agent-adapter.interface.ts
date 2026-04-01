import type {
  AgentCliAdapterOptions,
  AgentCliExecRunner,
  AgentCliExecRunnerRequest,
  AgentCliExecRunnerResult,
} from '@repo-ai-governor/adapter-sdk';

export interface CodexExecRunnerRequest extends AgentCliExecRunnerRequest {
  commandArguments: string[];
}

export type CodexExecRunnerResult = AgentCliExecRunnerResult;

export type CodexExecRunner = AgentCliExecRunner<CodexExecRunnerRequest>;

/**
 * Defines Codex adapter constructor options.
 */
export interface CodexAgentAdapterOptions extends AgentCliAdapterOptions<CodexExecRunner> {}
