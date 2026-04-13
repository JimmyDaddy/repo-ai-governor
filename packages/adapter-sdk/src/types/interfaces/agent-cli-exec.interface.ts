import type { AdapterRemoteApiConfig } from '@repo-ai-governor/shared';
import type {
  AgentAvailabilityStatus,
  AgentCliExecOperation,
  AgentCliExecutionMode,
} from '../../constants/index.js';

/**
 * Defines how one shared CLI runtime should terminate the spawned process tree.
 */
export type AgentCliProcessTreePolicy = 'process_only' | 'process_group_best_effort';

/**
 * Captures additive launch facts surfaced by the shared native CLI runtime.
 */
export interface AgentCliLaunchDiagnostics {
  selectedEntrypoint: string;
  shellWrapped: boolean;
  processTreePolicy: AgentCliProcessTreePolicy;
  spawnErrorCode?: string | null;
}

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
  onGracefulInterruptStart?: (cancelMechanism: 'process_signal' | 'abort_signal') => void;
  onHardTerminateStart?: (cancelMechanism: 'process_signal' | 'abort_signal') => void;
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
  launchDiagnostics?: AgentCliLaunchDiagnostics;
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
  resolveCredentialRef?: (selector: string) => Promise<string | null>;
  fetchImplementation?: typeof fetch;
  execRunner?: TExecRunner;
}

/**
 * Defines one adapter-authored launch plan consumed by the shared native CLI runtime.
 */
export interface AgentCliResolvedLaunchPlan {
  surfaceId: string;
  operation: AgentCliExecOperation;
  command: string;
  commandArguments: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
  signal?: AbortSignal;
  stdinMode?: 'pipe' | 'ignore';
  stdinPayload?: string;
  terminateGraceMs?: number;
  launchDiagnostics: AgentCliLaunchDiagnostics;
  onStarted?: (startedAt: string) => void;
  onStdoutChunk?: (chunk: string) => void;
  onStderrChunk?: (chunk: string) => void;
  onGracefulInterruptStart?: (cancelMechanism: 'process_signal' | 'abort_signal') => void;
  onHardTerminateStart?: (cancelMechanism: 'process_signal' | 'abort_signal') => void;
}
