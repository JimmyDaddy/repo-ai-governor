import type {
  AgentAvailabilityStatus,
  AgentCancellationReason,
  AgentCancellationScope,
  AgentCapability,
  AgentCapabilityFallbackAction,
  AgentCapabilitySupportLevel,
  AgentConfirmationDecision,
  AgentStreamEventType,
} from "../../constants/index.js";

/**
 * Describes one capability support row in the capability matrix.
 */
export interface AgentCapabilityState {
  capability: AgentCapability;
  supportLevel: AgentCapabilitySupportLevel;
  notes?: string;
}

/**
 * Describes timeout behavior contract exposed by one adapter surface.
 */
export interface AgentTimeoutCapability {
  supportsAgentInvocationTimeout: boolean;
  supportsStageTimeoutSignal: boolean;
  supportsFlowTimeoutSignal: boolean;
  minTimeoutMs?: number;
  maxTimeoutMs?: number;
}

/**
 * Describes cancellation behavior contract exposed by one adapter surface.
 */
export interface AgentCancellationCapability {
  supportsCancel: boolean;
  supportsReasonPropagation: boolean;
  supportsAbortSignal: boolean;
}

/**
 * Describes context-window contract exposed by one adapter surface.
 */
export interface AgentContextWindowCapability {
  maxInputTokens?: number;
  maxOutputTokens?: number;
  supportsAutoTruncation: boolean;
}

/**
 * Defines unified capability matrix consumed by runtime and routing policies.
 */
export interface AgentCapabilityMatrix {
  capabilityStates: AgentCapabilityState[];
  timeout: AgentTimeoutCapability;
  cancellation: AgentCancellationCapability;
  contextWindow: AgentContextWindowCapability;
}

/**
 * Defines canonical identity metadata returned by adapter protocol probes.
 */
export interface AgentProtocolIdentity {
  agentId: string;
  role: string;
  surface: string;
  roleProfileId: string;
  roleSource: string;
}

/**
 * Defines capability-probe request payload.
 */
export interface AgentProbeRequest {
  routeKey: string;
  requiredCapabilities?: AgentCapability[];
}

/**
 * Defines capability-probe result payload.
 */
export interface AgentProbeResult {
  identity: AgentProtocolIdentity;
  availabilityStatus: AgentAvailabilityStatus;
  capabilityMatrix: AgentCapabilityMatrix;
  unavailableReasons: string[];
}

/**
 * Defines stage invocation request payload.
 */
export interface AgentInvokeStageRequest {
  processId: string;
  executionId: string;
  stageId: string;
  routeKey: string;
  input: Record<string, unknown>;
  agentInvocationTimeoutMs?: number;
  stageTimeoutMs?: number;
  flowTimeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Defines token and cost usage metrics returned by one invocation.
 */
export interface AgentTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

/**
 * Defines stage invocation result payload.
 */
export interface AgentInvokeStageResult {
  output: Record<string, unknown>;
  usage?: AgentTokenUsage;
  elapsedMs: number;
}

/**
 * Defines stream-events request payload.
 */
export interface AgentStreamEventsRequest {
  processId: string;
  executionId: string;
  stageId: string;
  routeKey: string;
  input: Record<string, unknown>;
}

/**
 * Defines one stream event emitted by adapter protocol.
 */
export interface AgentStreamEvent {
  eventType: AgentStreamEventType;
  timestamp: string;
  processId: string;
  executionId: string;
  stageId: string;
  routeKey: string;
  payload: Record<string, unknown>;
}

/**
 * Defines human-confirmation request payload.
 */
export interface AgentConfirmationRequest {
  processId: string;
  executionId: string;
  stageId: string;
  routeKey: string;
  prompt: string;
  metadata?: Record<string, unknown>;
  deadlineAt?: string;
}

/**
 * Defines human-confirmation result payload.
 */
export interface AgentConfirmationResult {
  decision: AgentConfirmationDecision;
  reason: string;
  constraints: string[];
  decidedAt: string;
}

/**
 * Defines cancellation request payload.
 */
export interface AgentCancelRequest {
  processId: string;
  executionId: string;
  stageId?: string;
  routeKey?: string;
  scope: AgentCancellationScope;
  reason: AgentCancellationReason;
}

/**
 * Defines cancellation result payload.
 */
export interface AgentCancelResult {
  acknowledged: boolean;
  scope: AgentCancellationScope;
  reason: AgentCancellationReason;
  cancelledAt: string;
}

/**
 * Defines fallback rule for one required capability.
 */
export interface AgentCapabilityFallbackRule {
  capability: AgentCapability;
  onUnsupported: AgentCapabilityFallbackAction;
  onDegraded: AgentCapabilityFallbackAction;
  note?: string;
}

/**
 * Defines required capabilities and fallback preferences for one route.
 */
export interface AgentCapabilityRequirement {
  requiredCapabilities: AgentCapability[];
  allowDegradedCapabilities?: AgentCapability[];
  fallbackRules?: AgentCapabilityFallbackRule[];
}

/**
 * Defines one capability gap resolved by evaluator.
 */
export interface AgentCapabilityGap {
  capability: AgentCapability;
  supportLevel: AgentCapabilitySupportLevel;
  fallbackAction: AgentCapabilityFallbackAction;
  note?: string;
}

/**
 * Defines evaluator output consumed by runtime fallback decisions.
 */
export interface AgentCapabilityEvaluationResult {
  isSatisfied: boolean;
  unsupportedCapabilities: AgentCapability[];
  degradedCapabilities: AgentCapability[];
  requiredFallbackActions: AgentCapabilityFallbackAction[];
  capabilityGaps: AgentCapabilityGap[];
}

/**
 * Defines unified adapter protocol contract consumed by runtime and SDK routing.
 */
export interface AgentProtocolContract {
  /**
   * Probes one adapter surface and returns capability matrix + availability.
   * @param request Probe request payload.
   * @returns Probe result with capability matrix and availability status.
   */
  probe(request: AgentProbeRequest): Promise<AgentProbeResult>;

  /**
   * Invokes one runtime stage on the adapter surface.
   * @param request Stage invocation request payload.
   * @returns Stage invocation output and usage metadata.
   */
  invokeStage(request: AgentInvokeStageRequest): Promise<AgentInvokeStageResult>;

  /**
   * Streams stage events from adapter surface for progressive runtime updates.
   * @param request Stream-events request payload.
   * @returns Async iterable stream event sequence.
   */
  streamEvents(request: AgentStreamEventsRequest): AsyncIterable<AgentStreamEvent>;

  /**
   * Requests human confirmation from adapter-attached confirmation channel.
   * @param request Human-confirmation request payload.
   * @returns Confirmation decision payload.
   */
  requestConfirmation(request: AgentConfirmationRequest): Promise<AgentConfirmationResult>;

  /**
   * Cancels ongoing execution on adapter surface.
   * @param request Cancellation request payload.
   * @returns Cancellation acknowledgement payload.
   */
  cancel(request: AgentCancelRequest): Promise<AgentCancelResult>;
}
