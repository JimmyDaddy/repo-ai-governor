import type {
  AgentCliAdapterOptions,
  AgentCliExecRunner,
  AgentCliExecRunnerRequest,
  AgentCliExecRunnerResult,
} from "@repo-ai-governor/adapter-sdk";

export type CodexExecRunnerRequest = AgentCliExecRunnerRequest;

export type CodexExecRunnerResult = AgentCliExecRunnerResult;

export type CodexExecRunner = AgentCliExecRunner<CodexExecRunnerRequest>;

/**
 * Defines Codex adapter constructor options.
 */
export interface CodexAgentAdapterOptions extends AgentCliAdapterOptions<CodexExecRunner> {}
