import type { MemoryProviderCompositionSummary } from '@repo-ai-governor/memory-provider-registry';
import type {
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
} from '@repo-ai-governor/shared';
import type {
  OrchestrationBootstrapReadinessActionId,
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationGovernanceActionDisabledReason,
  OrchestrationGovernanceActionKind,
  OrchestrationGovernanceAttentionLevel,
  OrchestrationGovernanceFollowUpSlaState,
  OrchestrationGovernanceNotificationStatus,
  OrchestrationGovernanceQueueKind,
  OrchestrationGovernanceTemporaryBridgeBacklinkSurface,
  OrchestrationGovernanceTemporaryBridgeCapabilityClass,
  OrchestrationGovernanceTemporaryBridgeExitCriterion,
  OrchestrationGovernanceTemporaryBridgeReceiptKind,
  OrchestrationHandoffTargetKind,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
  OrchestrationSessionEventType,
  OrchestrationSessionRouteId,
  OrchestrationSessionStatus,
  OrchestrationSessionTranscriptRole,
  OrchestrationWorkspaceOperationKind,
} from '../../constants/index.js';

export interface OrchestrationExecutionLivenessSnapshot {
  adapterId?: string;
  surfaceId?: string;
  routeKey?: string;
  roleId?: string;
  startedAt?: string;
  status?: string;
  lastTransportActivityAt?: string;
  lastSemanticProgressAt?: string;
  lastTerminalSignalAt?: string;
  latestEventAt?: string;
  latestEventType?: string;
  latestTextPreview?: string;
  activeOperationKind?: string;
  activeOperationStartedAt?: string;
  partialOutputPreserved?: boolean;
  transportKind?: string;
  vendorBindingKind?: string;
  remoteRequestId?: string | null;
  cancelMechanism?: string;
  suspectReasonCodes?: string[];
}

export interface OrchestrationServiceHealthResponse {
  serviceHostKind: OrchestrationServiceHostKind;
  serviceTransportKind: OrchestrationServiceTransportKind;
  lifecycleStatus: OrchestrationServiceLifecycleStatus;
  checkpointCapable: boolean;
  memoryProvider?: MemoryProviderCompositionSummary;
  workspaceRoot: string;
  startedAt: string;
  protocolVersion: string;
  pid?: number;
}

export interface OrchestrationStartExecutionRequest {
  workspaceId: string;
  workspaceRoot: string;
  executionKind: OrchestrationExecutionKind;
  clientSurface: OrchestrationClientSurface;
  locale?: string;
  outputMode?: string;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
}

export interface OrchestrationStartExecutionResponse {
  executionId: string;
  executionSessionId: string;
  acceptedAt: string;
  status: OrchestrationExecutionStatus;
  checkpointCapable: boolean;
  memoryProvider?: MemoryProviderCompositionSummary;
  serviceHostKind: OrchestrationServiceHostKind;
  serviceTransportKind: OrchestrationServiceTransportKind;
  eventStreamToken: string;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationServiceEvent {
  eventId: string;
  sequence: number;
  streamCursor: string;
  type: OrchestrationServiceEventType;
  executionId: string;
  executionSessionId: string;
  status: OrchestrationExecutionStatus;
  timestamp: string;
  stageId?: string;
  artifactId?: string;
  artifactPath?: string;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
  message: string;
  livenessSnapshot?: OrchestrationExecutionLivenessSnapshot;
}

export interface OrchestrationExecutionSummary {
  executionId: string;
  executionSessionId: string;
  processId: string;
  workspaceId: string;
  workspaceRoot: string;
  executionKind: OrchestrationExecutionKind;
  clientSurface: OrchestrationClientSurface;
  eventStreamToken: string;
  serviceHostKind: OrchestrationServiceHostKind;
  serviceTransportKind: OrchestrationServiceTransportKind;
  memoryProvider?: MemoryProviderCompositionSummary;
  status: OrchestrationExecutionStatus;
  checkpointCapable: boolean;
  recoveryCapable: boolean;
  acceptedAt: string;
  updatedAt: string;
  pendingHitl: boolean;
  lastEventAt?: string;
  latestEventType?: OrchestrationServiceEventType;
  latestEventSequence?: number;
  nextCursor?: string;
  currentStageId?: string;
  latestArtifactId?: string;
  latestArtifactPath?: string;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
  checkpointSource?: string;
  checkpointPath?: string;
  recoveredNextNodeIds?: string[];
  livenessStatus?: string;
  livenessSuspectReasonCode?: string;
  lastTransportActivityAt?: string;
  lastSemanticProgressAt?: string;
  latestLivenessEventAt?: string;
  latestLivenessEventType?: string;
  latestLivenessTextPreview?: string;
  partialOutputPreserved?: boolean;
  transportKind?: string;
  vendorBindingKind?: string;
  remoteRequestId?: string | null;
  cancelMechanism?: string;
}

export interface OrchestrationListExecutionsFilter {
  workspaceId?: string;
  status?: OrchestrationExecutionStatus;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
}

export interface OrchestrationListExecutionsRequest {
  filter?: OrchestrationListExecutionsFilter;
  limit?: number;
}

export interface OrchestrationListExecutionsResponse {
  executions: OrchestrationExecutionSummary[];
  returnedCount: number;
  totalMatchedCount: number;
}

export interface OrchestrationSubscribeExecutionResponse {
  executionId: string;
  eventStreamToken: string;
  serviceHostKind: OrchestrationServiceHostKind;
  serviceTransportKind: OrchestrationServiceTransportKind;
  latestEventSequence: number;
  nextCursor: string;
  events: OrchestrationServiceEvent[];
}

export interface OrchestrationSubscribeExecutionRequest {
  executionId?: string;
  eventStreamToken?: string;
  cursor?: string;
  afterSequence?: number;
  limit?: number;
}

export interface OrchestrationArtifactPaneQueryRequest {
  executionId?: string;
  sessionId?: string;
  artifactLimit?: number;
  reviewLimit?: number;
  transcriptLimit?: number;
}

export interface OrchestrationArtifactPaneArtifactEntry {
  artifactId: string;
  artifactType: string;
  artifactPath: string;
  artifactVersion: string;
  artifactStatus: string;
  producerTaskId: string;
  producerExecutionId: string;
  registeredAt: string;
  lastUpdatedAt: string;
}

export interface OrchestrationArtifactPaneReviewEntry {
  reviewId: string;
  title: string;
  lifecycleStatus: string;
  filePath: string;
  scope?: string;
  updatedAt: string;
}

export interface OrchestrationArtifactPaneTranscriptEntry {
  entryId: string;
  sessionId: string;
  eventType: string;
  role: OrchestrationSessionTranscriptRole | string;
  routeId?: string;
  lines: string[];
  createdAt: string;
}

export interface OrchestrationArtifactPanePolicyTraceDetail {
  executionId: string;
  executionStatus: OrchestrationExecutionStatus;
  pendingHitl: boolean;
  recoveryCapable: boolean;
  currentStageId?: string;
  latestEventType?: OrchestrationServiceEventType;
  latestArtifactId?: string;
  latestArtifactPath?: string;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
  reviewDocumentPath?: string;
}

export interface OrchestrationArtifactPaneReviewLifecycleDetail {
  reviewSourcePath?: string;
  latestReviewId?: string;
  latestLifecycleStatus?: string;
  latestReviewFilePath?: string;
  totalReviewCount: number;
  pendingReviewCount: number;
  verifiedReviewCount: number;
  resolvedReviewCount: number;
  navigationReviewIds: string[];
}

export interface OrchestrationArtifactPaneWorkbenchDetail {
  artifactCount: number;
  reviewCount: number;
  transcriptCount: number;
  latestArtifactId?: string;
  latestArtifactPath?: string;
  latestReviewId?: string;
  latestReviewFilePath?: string;
  latestTranscriptEntryId?: string;
  latestTranscriptCreatedAt?: string;
}

export interface OrchestrationArtifactPaneEvidenceBacklinks {
  governanceWorkspacePath?: string;
  artifactPaths: string[];
  reviewPaths: string[];
  transcriptEntryIds: string[];
}

export interface OrchestrationArtifactPaneQueryResponse {
  artifacts: OrchestrationArtifactPaneArtifactEntry[];
  reviews: OrchestrationArtifactPaneReviewEntry[];
  transcript: OrchestrationArtifactPaneTranscriptEntry[];
  resolvedExecutionId?: string;
  resolvedSessionId?: string;
  reviewSourcePath?: string;
  policyTrace?: OrchestrationArtifactPanePolicyTraceDetail;
  reviewLifecycle: OrchestrationArtifactPaneReviewLifecycleDetail;
  workbench: OrchestrationArtifactPaneWorkbenchDetail;
  evidenceBacklinks: OrchestrationArtifactPaneEvidenceBacklinks;
}

export interface OrchestrationSubmitHitlDecisionRequest {
  executionId: string;
  executionSessionId: string;
  decision: string;
  resumeAction: string;
  actor: string;
  reason?: string;
  constraints?: Record<string, unknown>;
  decisionReceiptArtifactPath?: string;
}

export interface OrchestrationSubmitHitlDecisionResponse {
  accepted: boolean;
  nextStatus: OrchestrationExecutionStatus;
  decisionReceiptArtifactPath?: string;
  latestEventSequence: number;
  nextCursor: string;
  executionSummary: OrchestrationExecutionSummary;
}

export interface OrchestrationRecoverExecutionRequest {
  executionId: string;
}

export interface OrchestrationRecoverExecutionResponse {
  recovered: boolean;
  recoveryCapable: boolean;
  checkpointSource?: string;
  checkpointPath?: string;
  nextStatus: OrchestrationExecutionStatus;
  latestEventSequence: number;
  nextCursor: string;
  executionSummary: OrchestrationExecutionSummary;
  nextNodeIds?: string[];
}

export interface OrchestrationTerminateExecutionRequest {
  executionId: string;
  actor: string;
  reason?: string;
  preservePartialOutput?: boolean;
  partialSnapshotArtifactPath?: string;
}

export interface OrchestrationTerminateExecutionResponse {
  terminated: boolean;
  nextStatus: OrchestrationExecutionStatus;
  partialSnapshotArtifactPath?: string;
  latestEventSequence: number;
  nextCursor: string;
  executionSummary: OrchestrationExecutionSummary;
}

export interface OrchestrationHitlDecisionOption {
  optionId: string;
  decision: string;
  resumeAction: string;
}

export interface OrchestrationGovernanceActionAffordance {
  actionId: string;
  actionKind: OrchestrationGovernanceActionKind;
  executionId: string;
  enabled: boolean;
  requiresConfirmation: boolean;
  targetId?: string;
  disabledReason?: OrchestrationGovernanceActionDisabledReason;
  hitlDecisionOptions?: OrchestrationHitlDecisionOption[];
}

export interface OrchestrationHandoffTarget {
  targetId: string;
  executionId: string;
  targetKind: OrchestrationHandoffTargetKind;
  targetPath?: string;
  exists: boolean;
}

export interface OrchestrationExecutionBoardEntry {
  execution: OrchestrationExecutionSummary;
  actions: OrchestrationGovernanceActionAffordance[];
  handoffTargets: OrchestrationHandoffTarget[];
}

export interface OrchestrationExecutionBoardQueryRequest {
  filter?: OrchestrationListExecutionsFilter;
  limit?: number;
}

export interface OrchestrationExecutionBoardQueryResponse {
  executions: OrchestrationExecutionBoardEntry[];
  returnedCount: number;
  totalMatchedCount: number;
}

export interface OrchestrationHitlInboxEntry extends OrchestrationExecutionBoardEntry {}

export interface OrchestrationHitlInboxQueryRequest {
  filter?: OrchestrationListExecutionsFilter;
  limit?: number;
}

export interface OrchestrationHitlInboxQueryResponse {
  pendingDecisions: OrchestrationHitlInboxEntry[];
  returnedCount: number;
  totalMatchedCount: number;
}

export interface OrchestrationQueueOverviewQueryRequest {
  filter?: OrchestrationListExecutionsFilter;
  limit?: number;
  laneLimit?: number;
  workspaceLimit?: number;
}

export interface OrchestrationGovernanceQueueEntry {
  queueEntryId: string;
  queueKind: OrchestrationGovernanceQueueKind;
  workspaceId: string;
  workspaceRoot: string;
  executionId?: string;
  executionKind?: OrchestrationExecutionKind;
  executionStatus?: OrchestrationExecutionStatus;
  taskId?: string;
  projectId?: string;
  sprintId?: string;
  reviewId?: string;
  reviewLifecycleStatus?: string;
  reviewFilePath?: string;
  attentionLevel: OrchestrationGovernanceAttentionLevel;
  notificationStatus: OrchestrationGovernanceNotificationStatus;
  followUpSlaState: OrchestrationGovernanceFollowUpSlaState;
  followUpDueAt?: string;
  pendingSince?: string;
  updatedAt?: string;
  actions: OrchestrationGovernanceActionAffordance[];
  handoffTargets: OrchestrationHandoffTarget[];
}

export interface OrchestrationGovernanceParallelLaneEntry {
  laneId: string;
  workspaceId: string;
  workspaceRoot: string;
  activeExecutionIds: string[];
  activeExecutionCount: number;
  runningExecutionCount: number;
  pendingHitlCount: number;
  interruptedCount: number;
  attentionExecutionCount: number;
  attentionLevel: OrchestrationGovernanceAttentionLevel;
  latestExecutionId?: string;
  latestUpdatedAt?: string;
}

export interface OrchestrationGovernanceWorkspaceSummary {
  workspaceId: string;
  workspaceRoot: string;
  totalExecutionCount: number;
  activeExecutionCount: number;
  pendingHitlCount: number;
  automationInboxCount: number;
  reviewQueueCount: number;
  overdueFollowUpCount: number;
  attentionLevel: OrchestrationGovernanceAttentionLevel;
  latestExecutionId?: string;
  latestUpdatedAt?: string;
}

export interface OrchestrationGovernanceTemporaryBridgeEntry {
  bridgeId: string;
  capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass;
  operationKind?: OrchestrationWorkspaceOperationKind;
  operationArguments?: Record<string, boolean | number | string | readonly string[] | null>;
  workspaceRoot: string;
  commandWorkingDirectory: string;
  previewCommandLine: string;
  receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind;
  backlinkSurface: OrchestrationGovernanceTemporaryBridgeBacklinkSurface;
  exitCriteria: OrchestrationGovernanceTemporaryBridgeExitCriterion[];
}

export interface OrchestrationGovernanceNotificationOwnership {
  ownerSurface: OrchestrationClientSurface;
  pendingItemCount: number;
  dueSoonItemCount: number;
  overdueItemCount: number;
  activeWorkspaceCount: number;
  defaultFollowUpSlaMinutes: number;
  notificationStatus: OrchestrationGovernanceNotificationStatus;
}

export interface OrchestrationWorkspaceOperationLayeredLogs {
  summary: string[];
  detailed: string[];
}

export interface OrchestrationWorkspaceOperationSnapshot {
  operationKind: OrchestrationWorkspaceOperationKind;
  completedAt: string;
  locale?: string;
  message: string;
  result: OrchestrationWorkspaceOperationResult;
}

export interface OrchestrationQueueOverviewQueryResponse {
  generatedAt: string;
  automationInbox: OrchestrationGovernanceQueueEntry[];
  reviewQueue: OrchestrationGovernanceQueueEntry[];
  parallelLanes: OrchestrationGovernanceParallelLaneEntry[];
  workspaceSummary: OrchestrationGovernanceWorkspaceSummary[];
  temporaryBridges: OrchestrationGovernanceTemporaryBridgeEntry[];
  notificationOwnership: OrchestrationGovernanceNotificationOwnership;
  latestWorkspaceOperation?: OrchestrationWorkspaceOperationSnapshot;
}

export interface OrchestrationBootstrapReadinessSnapshot {
  workspaceId: string;
  repositoryRoot: string;
  workspaceRoot: string;
  configPath: string;
  configExists: boolean;
  workspaceMode: string;
  workspaceModeSource: string;
  recommendedActions: OrchestrationBootstrapReadinessActionId[];
}

export interface OrchestrationUserConfigEntry {
  keyPath: string;
  value: string;
}

export interface OrchestrationUserConfigStatus {
  configPath: string;
  configExists: boolean;
  legacyPreferencePath: string;
  legacyPreferenceExists: boolean;
  themePreference?: string;
  workspaceModePreference?: string;
  entries: OrchestrationUserConfigEntry[];
}

export interface OrchestrationSecretBackendStatus {
  backendId: string;
  available: boolean;
  detail: string;
  warning?: string;
}

export interface OrchestrationSecretRecord {
  keyName: string;
  backendId: string;
  exists: boolean;
}

export interface OrchestrationSecretReadinessSnapshot {
  selectedBackendId?: string;
  defaultBackendId?: string;
  indexPath: string;
  backends: OrchestrationSecretBackendStatus[];
  records: OrchestrationSecretRecord[];
  configuredCredentialRefs: string[];
  unresolvedCredentialRefs: string[];
}

export interface OrchestrationSecureAuthoringSnapshot {
  userConfig?: OrchestrationUserConfigStatus;
  secretReadiness?: OrchestrationSecretReadinessSnapshot;
  degradedReason?: string;
}

export interface OrchestrationSecureAuthoringQueryRequest {
  locale?: string;
}

export interface OrchestrationSetUserConfigValueRequest {
  keyPath: string;
  value: string;
  locale?: string;
}

export interface OrchestrationSetUserConfigValueResponse {
  message: string;
  configPath?: string;
  persistedValue?: string;
}

export interface OrchestrationSetManagedSecretRequest {
  keyName: string;
  value: string;
  backendId?: string;
  locale?: string;
}

export interface OrchestrationSetManagedSecretResponse {
  message: string;
  selector?: string;
  backendId?: string;
  warning?: string;
}

export interface OrchestrationProviderOnboardingSnapshotRequest {
  tool: AdapterSurface;
  entrypointKind: string;
  provider?: AdapterProviderKind;
  locale?: string;
}

export interface OrchestrationProviderOnboardingSnapshot {
  surfaceId: string;
  entrypointKind: string;
  mutationMode: string;
  tool: AdapterSurface;
  transport: AdapterTransportKind;
  provider: AdapterProviderKind;
  vendorBinding: AdapterVendorBindingKind;
  secretCaptureMode: string;
  secretOwner: string;
  credentialRefStrategy: string;
  readinessProjectionSource: string;
  configTargets: string[];
  receiptFields: string[];
  credentialRef: string;
  model?: string;
  endpoint?: string;
  selectedBackendId?: string;
  defaultBackendId?: string;
  availableBackends: OrchestrationSecretBackendStatus[];
  warnings: string[];
}

export interface OrchestrationApplyProviderOnboardingRequest {
  tool: AdapterSurface;
  entrypointKind: string;
  model: string;
  apiKey: string;
  reuseExistingCredential?: boolean;
  provider?: AdapterProviderKind;
  endpoint?: string;
  backendId?: string;
  locale?: string;
}

export interface OrchestrationApplyProviderOnboardingResponse {
  surfaceId: string;
  entrypointKind: string;
  mutationMode: string;
  tool: AdapterSurface;
  transport: AdapterTransportKind;
  provider: AdapterProviderKind;
  vendorBinding: AdapterVendorBindingKind;
  credentialRef: string;
  secretBackend: string;
  configTargets: string[];
  receiptFields: string[];
  warnings: string[];
  nextAction: string;
}

export interface OrchestrationWorkspaceOperationCheck {
  id: string;
  status: string;
  detail: string;
}

export interface OrchestrationWorkspaceOperationArtifact {
  id: string;
  path: string;
}

export interface OrchestrationWorkspaceOperationInteractionPrompt {
  title: string;
  action: string;
  blocking: boolean;
}

export interface OrchestrationWorkspaceOperationResult {
  operation: string;
  summary: string;
  checkTotals?: {
    pass: number;
    warn: number;
    fail: number;
  };
  checks?: OrchestrationWorkspaceOperationCheck[];
  artifacts?: OrchestrationWorkspaceOperationArtifact[];
  interactionPrompts?: OrchestrationWorkspaceOperationInteractionPrompt[];
  layeredLogs?: OrchestrationWorkspaceOperationLayeredLogs;
  details?: Record<string, boolean | number | string | null>;
}

export interface OrchestrationWorkspaceOperationRequest {
  operationKind: OrchestrationWorkspaceOperationKind;
  locale?: string;
  arguments?: Record<string, boolean | number | string | readonly string[] | null>;
}

export interface OrchestrationWorkspaceOperationResponse {
  message: string;
  result: OrchestrationWorkspaceOperationResult;
}

export interface OrchestrationSessionEvent {
  eventId: string;
  sequence: number;
  streamCursor: string;
  sessionId: string;
  type: OrchestrationSessionEventType;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface OrchestrationSessionSummary {
  sessionId: string;
  status: OrchestrationSessionStatus;
  openedAt: string;
  closedAt?: string;
  serviceHostKind?: OrchestrationServiceHostKind;
  serviceTransportKind?: OrchestrationServiceTransportKind;
  processId?: string;
  executionId?: string;
  currentRouteId?: string;
  latestTurnId?: string;
  latestEventSequence: number;
  nextCursor: string;
  eventCount: number;
  context: Record<string, unknown>;
}

export interface OrchestrationStartSessionRequest {
  sessionId?: string;
  processId?: string;
  executionId?: string;
  initialContext?: Record<string, unknown>;
  routeId?: OrchestrationSessionRouteId | string;
}

export interface OrchestrationStartSessionResponse {
  created: boolean;
  session: OrchestrationSessionSummary;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationSendSessionTurnRequest {
  sessionId: string;
  routeId?: OrchestrationSessionRouteId | string;
  userMessage: string;
  turnId?: string;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationSendSessionTurnResponse {
  session: OrchestrationSessionSummary;
  turnId: string;
  routeId: string;
  acceptedAt: string;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationAppendSessionMessageRequest {
  sessionId: string;
  role: OrchestrationSessionTranscriptRole | string;
  routeId?: OrchestrationSessionRouteId | string;
  lines: string[];
  metadata?: Record<string, unknown>;
}

export interface OrchestrationAppendSessionMessageResponse {
  session: OrchestrationSessionSummary;
  latestEventSequence: number;
  nextCursor: string;
  event: OrchestrationSessionEvent;
}

export interface OrchestrationListSessionsFilter {
  status?: OrchestrationSessionStatus;
  executionId?: string;
  processId?: string;
  routeId?: string;
}

export interface OrchestrationListSessionsRequest {
  filter?: OrchestrationListSessionsFilter;
  limit?: number;
}

export interface OrchestrationListSessionsResponse {
  sessions: OrchestrationSessionSummary[];
  returnedCount: number;
  totalMatchedCount: number;
}

export interface OrchestrationSubscribeSessionRequest {
  sessionId: string;
  cursor?: string;
  afterSequence?: number;
  limit?: number;
}

export interface OrchestrationSubscribeSessionResponse {
  session: OrchestrationSessionSummary;
  latestEventSequence: number;
  nextCursor: string;
  events: OrchestrationSessionEvent[];
}

export interface OrchestrationResumeSessionRequest {
  sessionId?: string;
  preferLatest?: boolean;
}

export interface OrchestrationResumeSessionResponse {
  session: OrchestrationSessionSummary;
  resumeSelector: string;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationForkSessionRequest {
  sourceSessionId: string;
  forkFromTurnId?: string;
  displayName?: string;
}

export interface OrchestrationForkSessionResponse {
  session: OrchestrationSessionSummary;
  sourceSessionId: string;
  forkedFromTurnId?: string;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationArchiveSessionRequest {
  sessionId: string;
  archiveReasonSummary?: string;
}

export interface OrchestrationArchiveSessionResponse {
  session: OrchestrationSessionSummary;
  archivedAt: string;
  archiveReasonSummary?: string;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationUnarchiveSessionRequest {
  sessionId: string;
}

export interface OrchestrationUnarchiveSessionResponse {
  session: OrchestrationSessionSummary;
  latestEventSequence: number;
  nextCursor: string;
}

export interface OrchestrationServiceClient {
  getHealth(): Promise<OrchestrationServiceHealthResponse>;
  queryBootstrapReadiness(): Promise<OrchestrationBootstrapReadinessSnapshot>;
  querySecureAuthoring(
    request?: OrchestrationSecureAuthoringQueryRequest,
  ): Promise<OrchestrationSecureAuthoringSnapshot>;
  queryProviderOnboarding(
    request: OrchestrationProviderOnboardingSnapshotRequest,
  ): Promise<OrchestrationProviderOnboardingSnapshot>;
  setUserConfigValue(
    request: OrchestrationSetUserConfigValueRequest,
  ): Promise<OrchestrationSetUserConfigValueResponse>;
  setManagedSecret(
    request: OrchestrationSetManagedSecretRequest,
  ): Promise<OrchestrationSetManagedSecretResponse>;
  applyProviderOnboarding(
    request: OrchestrationApplyProviderOnboardingRequest,
  ): Promise<OrchestrationApplyProviderOnboardingResponse>;
  runWorkspaceOperation(
    request: OrchestrationWorkspaceOperationRequest,
  ): Promise<OrchestrationWorkspaceOperationResponse>;
  startExecution(
    request: OrchestrationStartExecutionRequest,
  ): Promise<OrchestrationStartExecutionResponse>;
  getExecution(executionId: string): Promise<OrchestrationExecutionSummary | undefined>;
  queryExecutionBoard(
    request?: OrchestrationExecutionBoardQueryRequest,
  ): Promise<OrchestrationExecutionBoardQueryResponse>;
  queryHitlInbox(
    request?: OrchestrationHitlInboxQueryRequest,
  ): Promise<OrchestrationHitlInboxQueryResponse>;
  queryQueueOverview(
    request?: OrchestrationQueueOverviewQueryRequest,
  ): Promise<OrchestrationQueueOverviewQueryResponse>;
  listExecutions(
    request?: OrchestrationListExecutionsRequest,
  ): Promise<OrchestrationListExecutionsResponse>;
  queryArtifactPane(
    request?: OrchestrationArtifactPaneQueryRequest,
  ): Promise<OrchestrationArtifactPaneQueryResponse>;
  subscribeExecution(
    request: OrchestrationSubscribeExecutionRequest,
  ): Promise<OrchestrationSubscribeExecutionResponse>;
  submitHitlDecision(
    request: OrchestrationSubmitHitlDecisionRequest,
  ): Promise<OrchestrationSubmitHitlDecisionResponse>;
  recoverExecution(
    request: OrchestrationRecoverExecutionRequest,
  ): Promise<OrchestrationRecoverExecutionResponse>;
  terminateExecution(
    request: OrchestrationTerminateExecutionRequest,
  ): Promise<OrchestrationTerminateExecutionResponse>;
  startSession(
    request: OrchestrationStartSessionRequest,
  ): Promise<OrchestrationStartSessionResponse>;
  sendSessionTurn(
    request: OrchestrationSendSessionTurnRequest,
  ): Promise<OrchestrationSendSessionTurnResponse>;
  appendSessionMessage(
    request: OrchestrationAppendSessionMessageRequest,
  ): Promise<OrchestrationAppendSessionMessageResponse>;
  getSession(sessionId: string): Promise<OrchestrationSessionSummary | undefined>;
  listSessions(
    request?: OrchestrationListSessionsRequest,
  ): Promise<OrchestrationListSessionsResponse>;
  subscribeSession(
    request: OrchestrationSubscribeSessionRequest,
  ): Promise<OrchestrationSubscribeSessionResponse>;
  resumeSession(
    request?: OrchestrationResumeSessionRequest,
  ): Promise<OrchestrationResumeSessionResponse>;
  forkSession(request: OrchestrationForkSessionRequest): Promise<OrchestrationForkSessionResponse>;
  archiveSession(
    request: OrchestrationArchiveSessionRequest,
  ): Promise<OrchestrationArchiveSessionResponse>;
  unarchiveSession(
    request: OrchestrationUnarchiveSessionRequest,
  ): Promise<OrchestrationUnarchiveSessionResponse>;
}
