import type {
  AgentCliAdapterOptions,
  AgentCliExecRunner,
  AgentCliExecRunnerRequest,
  AgentCliExecRunnerResult,
} from '@repo-ai-governor/adapter-sdk';

export interface ClaudeCodeExecRunnerRequest extends AgentCliExecRunnerRequest {
  commandArgumentsPrefix: string[];
}

export type ClaudeCodeExecRunnerResult = AgentCliExecRunnerResult;

export type ClaudeCodeExecRunner = AgentCliExecRunner<ClaudeCodeExecRunnerRequest>;

/**
 * Defines Claude Code adapter constructor options.
 */
export interface ClaudeCodeAgentAdapterOptions
  extends AgentCliAdapterOptions<ClaudeCodeExecRunner> {}
