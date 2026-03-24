import type { AgentAvailabilityStatus } from "@repo-ai-governor/adapter-sdk";
import type { CodexAgentAdapterExecutionMode } from "../../constants/codex-agent-adapter.constant.js";

export interface CodexExecRunnerRequest {
  command: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  prompt: string;
  timeoutMs: number;
  signal?: AbortSignal;
  operation: "probe" | "invoke";
}

export interface CodexExecRunnerResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  elapsedMs: number;
}

export type CodexExecRunner = (request: CodexExecRunnerRequest) => Promise<CodexExecRunnerResult>;

/**
 * Defines Codex adapter constructor options.
 */
export interface CodexAgentAdapterOptions {
  agentId?: string;
  role?: string;
  roleProfileId?: string;
  roleSource?: string;
  availabilityStatus?: AgentAvailabilityStatus;
  unavailableReasons?: string[];
  executionMode?: CodexAgentAdapterExecutionMode;
  command?: string;
  currentWorkingDirectory?: string;
  environment?: NodeJS.ProcessEnv;
  requestTimeoutMs?: number;
  probeCacheTtlMs?: number;
  execRunner?: CodexExecRunner;
}
