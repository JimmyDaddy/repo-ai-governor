import type {
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationBootstrapReadinessSnapshot,
  OrchestrationExecutionBoardEntry,
  OrchestrationGovernanceQueueEntry,
  OrchestrationGovernanceTemporaryBridgeEntry,
  OrchestrationHandoffTarget,
  OrchestrationHitlDecisionOption,
  OrchestrationQueueOverviewQueryResponse,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
  OrchestrationWorkspaceOperationKind,
} from '@repo-ai-governor/orchestration-service-client';
import type {
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
} from '@repo-ai-governor/shared';
import type {
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_ENTRYPOINT_KINDS,
  VSCODE_EXTENSION_PROVIDER_ONBOARDING_READINESS_PROJECTION_SOURCES,
} from '../../constants/index.js';

export interface VsCodeExtensionTreeNodeCommandDescriptor {
  command: string;
  title: string;
  arguments?: readonly unknown[];
}

export interface VsCodeExtensionTreeNodeDescriptor {
  nodeId: string;
  label: string;
  description?: string;
  tooltip?: string;
  themeIconId?: string;
  contextValue?: string;
  resourceUriPath?: string;
  selectionRequest?: VsCodeExtensionCommandRequest;
  command?: VsCodeExtensionTreeNodeCommandDescriptor;
  children?: readonly VsCodeExtensionTreeNodeDescriptor[];
}

export interface VsCodeExtensionServiceDiagnosticsSnapshot {
  lifecycleStatus: OrchestrationServiceLifecycleStatus;
  serviceHostKind: OrchestrationServiceHostKind;
  serviceTransportKind: OrchestrationServiceTransportKind;
  checkpointCapable: boolean;
  memoryStoreProviderId?: string;
  pid?: number;
}

export interface VsCodeExtensionUserConfigEntrySnapshot {
  keyPath: string;
  value: string;
}

export interface VsCodeExtensionUserConfigStatusSnapshot {
  configPath: string;
  configExists: boolean;
  legacyPreferencePath: string;
  legacyPreferenceExists: boolean;
  themePreference?: string;
  workspaceModePreference?: string;
  entries: readonly VsCodeExtensionUserConfigEntrySnapshot[];
}

export interface VsCodeExtensionSecretBackendStatusSnapshot {
  backendId: string;
  available: boolean;
  detail: string;
  warning?: string;
}

export interface VsCodeExtensionSecretRecordSnapshot {
  keyName: string;
  backendId: string;
  exists: boolean;
}

export interface VsCodeExtensionSecretReadinessSnapshot {
  selectedBackendId?: string;
  defaultBackendId?: string;
  indexPath: string;
  backends: readonly VsCodeExtensionSecretBackendStatusSnapshot[];
  records: readonly VsCodeExtensionSecretRecordSnapshot[];
  configuredCredentialRefs: readonly string[];
  unresolvedCredentialRefs: readonly string[];
}

export interface VsCodeExtensionSecureAuthoringSnapshot {
  userConfig?: VsCodeExtensionUserConfigStatusSnapshot;
  secretReadiness?: VsCodeExtensionSecretReadinessSnapshot;
  degradedReason?: string;
}

export type VsCodeExtensionProviderOnboardingEntrypointKind =
  (typeof VSCODE_EXTENSION_PROVIDER_ONBOARDING_ENTRYPOINT_KINDS)[keyof typeof VSCODE_EXTENSION_PROVIDER_ONBOARDING_ENTRYPOINT_KINDS];

export type VsCodeExtensionProviderOnboardingReadinessProjectionSource =
  (typeof VSCODE_EXTENSION_PROVIDER_ONBOARDING_READINESS_PROJECTION_SOURCES)[keyof typeof VSCODE_EXTENSION_PROVIDER_ONBOARDING_READINESS_PROJECTION_SOURCES];

/**
 * Captures the minimum service-owned provider-onboarding facts that the VS Code host may consume
 * without taking ownership of canonical onboarding truth away from runtime.agent-projection.
 */
export interface VsCodeExtensionProviderOnboardingSnapshot {
  surfaceId: string;
  entrypointKind: VsCodeExtensionProviderOnboardingEntrypointKind;
  mutationMode: string;
  tool: AdapterSurface;
  transport: AdapterTransportKind;
  provider: AdapterProviderKind;
  vendorBinding: AdapterVendorBindingKind;
  secretCaptureMode: string;
  secretOwner: string;
  credentialRefStrategy: string;
  readinessProjectionSource: VsCodeExtensionProviderOnboardingReadinessProjectionSource;
  configTargets: readonly string[];
  receiptFields: readonly string[];
  credentialRef: string;
  model?: string;
  endpoint?: string;
  selectedBackendId?: string;
  defaultBackendId?: string;
  availableBackends: readonly VsCodeExtensionSecretBackendStatusSnapshot[];
  warnings: readonly string[];
}

/**
 * Defines one explicit provider-onboarding apply request. Raw API keys are accepted here so the
 * host can capture them locally and immediately hand them to the managed secret seam.
 */
export interface VsCodeExtensionProviderOnboardingApplyRequest {
  tool: AdapterSurface;
  entrypointKind: VsCodeExtensionProviderOnboardingEntrypointKind;
  model: string;
  apiKey: string;
  reuseExistingCredential?: boolean;
  provider?: AdapterProviderKind;
  endpoint?: string;
  backendId?: string;
}

/**
 * Captures the redacted receipt returned after a provider-onboarding mutation succeeds.
 */
export interface VsCodeExtensionProviderOnboardingApplyReceipt {
  surfaceId: string;
  entrypointKind: VsCodeExtensionProviderOnboardingEntrypointKind;
  mutationMode: string;
  tool: AdapterSurface;
  transport: AdapterTransportKind;
  provider: AdapterProviderKind;
  vendorBinding: AdapterVendorBindingKind;
  credentialRef: string;
  secretBackend: string;
  configTargets: readonly string[];
  receiptFields: readonly string[];
  warnings: readonly string[];
  nextAction: string;
}

export interface VsCodeExtensionWorkspaceContextSnapshot {
  workspaceLabel: string;
  workspaceRoot?: string;
  workspaceTrusted: boolean;
  activeEditorPath?: string;
  activeSelectionLabel?: string;
  serviceHealth?: VsCodeExtensionServiceDiagnosticsSnapshot;
}

export interface VsCodeExtensionSelectionSnapshot {
  executionId?: string;
  executionSessionId?: string;
  reviewSourcePath?: string;
  queueEntry?: OrchestrationGovernanceQueueEntry;
  temporaryBridge?: OrchestrationGovernanceTemporaryBridgeEntry;
  workspaceOperationKind?: OrchestrationWorkspaceOperationKind;
  workspaceOperationArguments?: Record<
    string,
    boolean | number | string | readonly string[] | null
  >;
}

export interface VsCodeExtensionCommandRequest {
  executionId?: string;
  executionSessionId?: string;
  reviewSourcePath?: string;
  clearExecutionSelection?: boolean;
  queueEntry?: OrchestrationGovernanceQueueEntry;
  handoffTarget?: OrchestrationHandoffTarget;
  temporaryBridge?: OrchestrationGovernanceTemporaryBridgeEntry;
  workspaceOperationKind?: OrchestrationWorkspaceOperationKind;
  workspaceOperationArguments?: Record<
    string,
    boolean | number | string | readonly string[] | null
  >;
  hitlDecisionOption?: OrchestrationHitlDecisionOption;
  userConfigKeyPath?: string;
  secretKeyName?: string;
}

export interface VsCodeExtensionReviewDetailSnapshot {
  workspaceContext: VsCodeExtensionWorkspaceContextSnapshot;
  selectedExecution?: OrchestrationExecutionBoardEntry;
  artifactPane?: OrchestrationArtifactPaneQueryResponse;
  requestedReviewSourcePath?: string;
}

export interface VsCodeExtensionWorkbenchOverviewSnapshot {
  workspaceContext: VsCodeExtensionWorkspaceContextSnapshot;
  bootstrapReadiness?: OrchestrationBootstrapReadinessSnapshot;
  queueOverview: OrchestrationQueueOverviewQueryResponse;
  secureAuthoring?: VsCodeExtensionSecureAuthoringSnapshot;
  selectedExecution?: OrchestrationExecutionBoardEntry;
  reviewSourcePath?: string;
}

export interface VsCodeExtensionWorkflowStudioSnapshot {
  workspaceContext: VsCodeExtensionWorkspaceContextSnapshot;
  bootstrapReadiness?: OrchestrationBootstrapReadinessSnapshot;
  queueOverview: OrchestrationQueueOverviewQueryResponse;
  secureAuthoring?: VsCodeExtensionSecureAuthoringSnapshot;
  selectedExecution?: OrchestrationExecutionBoardEntry;
  artifactPane?: OrchestrationArtifactPaneQueryResponse;
  sessionContinuity?: VsCodeExtensionSessionContinuitySnapshot;
  reviewSourcePath?: string;
}

export interface VsCodeExtensionSessionContinuitySnapshot {
  sessionId: string;
  sessionStatus?: string;
  currentRouteId?: string;
  latestTurnId?: string;
  latestEventSequence?: number;
  nextCursor?: string;
  resumeSelector?: string;
  degradedReason?: string;
}

export interface VsCodeExtensionReviewQueueSelectionRequest extends VsCodeExtensionCommandRequest {
  reviewQueueEntry?: OrchestrationGovernanceQueueEntry;
}
