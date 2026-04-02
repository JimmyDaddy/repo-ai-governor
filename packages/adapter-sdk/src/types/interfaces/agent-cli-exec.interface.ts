import type { AdapterRemoteApiConfig } from '@repo-ai-governor/shared';
import type {
  AgentAvailabilityStatus,
  AgentCliExecOperation,
  AgentCliExecutionMode,
} from '../../constants/index.js';

/**
 * Defines the shared request contract for CLI-backed adapter exec runners.
 */
export interface AgentCliExecRunnerRequest {
  command: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  prompt: string;
  timeoutMs: number;
  signal?: AbortSignal;
  operation: AgentCliExecOperation;
  onStdoutChunk?: (chunk: string) => void;
  onStderrChunk?: (chunk: string) => void;
}

/**
 * Defines the shared process result contract for CLI-backed adapter exec runners.
 */
export interface AgentCliExecRunnerResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  elapsedMs: number;
}

/**
 * Defines one typed CLI-backed exec runner function.
 */
export type AgentCliExecRunner<
  TRequest extends AgentCliExecRunnerRequest = AgentCliExecRunnerRequest,
> = (request: TRequest) => Promise<AgentCliExecRunnerResult>;

/**
 * Defines shared constructor options used by CLI-backed remote adapter implementations.
 */
export interface AgentCliAdapterOptions<TExecRunner = AgentCliExecRunner> {
  agentId?: string;
  role?: string;
  roleProfileId?: string;
  roleSource?: string;
  availabilityStatus?: AgentAvailabilityStatus;
  unavailableReasons?: string[];
  executionMode?: AgentCliExecutionMode;
  command?: string;
  currentWorkingDirectory?: string;
  environment?: NodeJS.ProcessEnv;
  requestTimeoutMs?: number;
  probeCacheTtlMs?: number;
  maxRetryAttempts?: number;
  retryBackoffMs?: number;
  remoteApi?: AdapterRemoteApiConfig;
  fetchImplementation?: typeof fetch;
  execRunner?: TExecRunner;
}
