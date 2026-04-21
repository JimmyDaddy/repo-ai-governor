import type {
  AgentAvailabilityStatus,
  AgentConfirmationDecision,
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
 * Defines the transport-scoped confirmation facts that stay bound to one ACP permission request id.
 */
export interface CliAcpPermissionRequestResolution {
  toolCallId: string;
  allowedDecisions: AgentConfirmationDecision[];
  decision: AgentConfirmationDecision;
  constraints: string[];
  reason: string;
  decidedAt: string;
}

/**
 * Defines the additive ACP-local execution state that must stay outside canonical session truth.
 */
export interface CliAcpInvocationExecutionState extends CliAcpInvocationContext {
  invocationKey: string;
  acpSessionId: string | null;
  emittedToolCallIds: string[];
  permissionRequestResolutionsById: Record<string, CliAcpPermissionRequestResolution>;
  permissionRequestIds: string[];
  terminalIds: string[];
  createdAt: string;
  updatedAt: string;
  invokeResultPromise?: Promise<AgentInvokeStageResult>;
  bufferedStreamEvents: AgentStreamEvent[];
}
