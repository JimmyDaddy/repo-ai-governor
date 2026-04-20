import type {
  AgentAvailabilityStatus,
  AgentHealthCheckDiagnostic,
  AgentInvokeStageResult,
  AgentStreamEvent,
} from '@repo-ai-governor/adapter-sdk';
import type { AdapterSurface } from '@repo-ai-governor/shared';

/**
 * Defines the resolved ACP host availability payload consumed by probe-time routing.
 */
export interface CliAcpHostAvailabilityResolution {
  availabilityStatus: AgentAvailabilityStatus;
  diagnostics: AgentHealthCheckDiagnostic[];
  unavailableReasons: string[];
}

/**
 * Defines the transport-scoped invocation facts used to build one ACP shared-execution key.
 */
export interface CliAcpInvocationContext {
  surfaceId: AdapterSurface;
  processId: string;
  executionId: string;
  stageId: string;
  routeKey: string;
}

/**
 * Defines the additive ACP-local execution state that must stay outside canonical session truth.
 */
export interface CliAcpInvocationExecutionState extends CliAcpInvocationContext {
  invocationKey: string;
  acpSessionId: string | null;
  permissionRequestIds: string[];
  terminalIds: string[];
  createdAt: string;
  updatedAt: string;
  invokeResultPromise?: Promise<AgentInvokeStageResult>;
  bufferedStreamEvents: AgentStreamEvent[];
}
