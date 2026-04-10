import type { AdaptersConfig, WorkspaceMode } from '@repo-ai-governor/config';
import type { SessionStatus } from '@repo-ai-governor/core-session';
import type {
  AdapterCapabilitySnapshotSource,
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  RoleSource,
} from '@repo-ai-governor/shared';

export interface AgentProjectionInput {
  roleId: string;
  roleProfileId: string;
  routeKey: string;
  stageId: string;
  adaptersConfig: AdaptersConfig;
  requiredCapabilities: string[];
  workspaceId: string;
  workspaceMode: WorkspaceMode;
  executionId?: string | null;
  sessionId?: string | null;
  roleSource?: RoleSource;
  selectedSurface?: AdapterSurface | null;
  selectedBy?: string | null;
  projectionStatus?: string | null;
  failureReasons?: string[];
  unsupportedCapabilities?: string[];
  degradedCapabilities?: string[];
  selectedTransport?: AdapterTransportKind | null;
  selectedProviderKind?: AdapterProviderKind | null;
  selectedVendorBindingKind?: AdapterVendorBindingKind | null;
  selectedModel?: string | null;
  capabilitySnapshotSource?: AdapterCapabilitySnapshotSource | null;
  inputSchemaRef?: string | null;
  outputSchemaRef?: string | null;
  errorContractRef?: string | null;
  retryPolicyRef?: string | null;
  timeoutPolicyRef?: string | null;
  budgetPolicyRef?: string | null;
  maxExecutionTimeSeconds?: number | null;
  stageTimeoutSeconds?: number | null;
  tokenBudget?: number | null;
  costBudget?: number | null;
  timeBudgetSeconds?: number | null;
}

export interface AgentDescriptor {
  agentId: string;
  agentRole: string;
  roleProfileId: string;
  roleSource: RoleSource | 'default' | 'custom';
  primarySurface: AdapterSurface | string;
  fallbackSurfaces: Array<AdapterSurface | string>;
  capabilities: string[];
  permissionLevel: 'read' | 'edit' | 'test' | 'commit' | 'pr';
  inputSchemaRef: string | null;
  outputSchemaRef: string | null;
  errorContractRef: string | null;
  maxExecutionTimeSeconds: number;
  stageTimeoutSeconds: number;
  tokenBudget: number | null;
  costBudget: number | null;
  timeBudgetSeconds: number | null;
  retryPolicyRef: string | null;
  timeoutPolicyRef: string | null;
  budgetPolicyRef: string | null;
  workspaceId: string;
  workspaceMode: WorkspaceMode;
  executionId: string | null;
  sessionId: string | null;
  selectedBy: string | null;
  selectedSurface: AdapterSurface | string | null;
  projectionStatus: string | null;
  failureReasons: string[];
  unsupportedCapabilities: string[];
  degradedCapabilities: string[];
  selectedTransport?: AdapterTransportKind | null;
  selectedProviderKind?: AdapterProviderKind | null;
  selectedVendorBindingKind?: AdapterVendorBindingKind | null;
  selectedModel?: string | null;
  capabilitySnapshotSource?: AdapterCapabilitySnapshotSource | null;
}

export interface AgentSessionProjectionEntry {
  agentId: string;
  agentRole: string;
  roleProfileId: string;
  sessionId: string | null;
  executionId: string | null;
  sessionStatus: SessionStatus | string | null;
  sessionEventCount: number;
  lastEventAt: string | null;
  contextKeys: string[];
}

export interface AgentSessionProjection {
  sessionId: string | null;
  executionId: string | null;
  sessionStatus: SessionStatus | string | null;
  openedAt: string | null;
  closedAt: string | null;
  totalEventCount: number;
  agentEntries: AgentSessionProjectionEntry[];
}

export interface AgentSessionRegistryReader {
  getSession(sessionId: string): Promise<{
    sessionId: string;
    executionId?: string;
    status: SessionStatus | string;
    openedAt: string;
    closedAt?: string;
    context: Record<string, unknown>;
    events: Array<{
      eventId: string;
      type: string;
      createdAt: string;
      payload: Record<string, unknown>;
    }>;
  }>;
}
