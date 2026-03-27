import type { RuntimeError } from '@repo-ai-governor/shared';
import type {
  AgentAvailabilityStatus,
  AgentCapabilityFallbackAction,
  AgentNetworkMode,
  AgentRouteSelectionSource,
  AgentSurfaceNetworkRequirement,
  AgentSurfaceSkipReason,
} from '../../constants/index.js';
import type {
  AgentCancelRequest,
  AgentCapabilityEvaluationResult,
  AgentCapabilityMatrix,
  AgentCapabilityRequirement,
  AgentCapabilityState,
  AgentConfirmationRequest,
  AgentInvokeStageRequest,
  AgentInvokeStageResult,
  AgentProbeResult,
  AgentProtocolContract,
  AgentStreamEventsRequest,
} from './agent-protocol.interface.js';

/**
 * Defines one routeKey policy row for adapter surface routing.
 */
export interface AgentRoutePolicy {
  routeKey: string;
  primarySurface: string;
  fallbackSurfaces?: string[];
  capabilityRequirement?: AgentCapabilityRequirement;
}

/**
 * Defines normalized route policy resolved by route registry.
 */
export interface AgentRouteResolvedPolicy {
  routeKey: string;
  primarySurface: string;
  fallbackSurfaces: string[];
  candidateSurfaces: string[];
  capabilityRequirement?: AgentCapabilityRequirement;
}

/**
 * Defines route registry constructor options.
 */
export interface AgentRouteRegistryOptions {
  routePolicies: AgentRoutePolicy[];
}

/**
 * Defines minimal contract used by route runner to resolve route policies.
 */
export interface AgentRouteRegistryContract {
  /**
   * Resolves one route policy by routeKey.
   * @param routeKey Route identifier.
   * @returns Normalized route policy.
   */
  resolveRoute(routeKey: string): AgentRouteResolvedPolicy;
}

/**
 * Defines one route dispatch request payload.
 */
export interface AgentRouteDispatchRequest extends AgentInvokeStageRequest {
  capabilityRequirementOverride?: AgentCapabilityRequirement;
  runtimeContext?: AgentRouteDispatchRuntimeContext;
}

/**
 * Defines runtime context flags that affect route dispatch behavior.
 */
export interface AgentRouteDispatchRuntimeContext {
  networkMode?: AgentNetworkMode;
  allowLocalFallback?: boolean;
  restrictedReason?: string;
}

/**
 * Defines one surface-level route evaluation record.
 */
export interface AgentSurfaceEvaluationRecord {
  surface: string;
  probeSucceeded: boolean;
  networkRequirement?: AgentSurfaceNetworkRequirement;
  availabilityStatus?: AgentAvailabilityStatus;
  errorCode?: string;
  errorMessage?: string;
  capabilitySatisfied?: boolean;
  unsupportedCapabilities: AgentCapabilityState['capability'][];
  degradedCapabilities: AgentCapabilityState['capability'][];
  requiredFallbackActions: AgentCapabilityFallbackAction[];
  fallbackTriggered: boolean;
  skippedReason?: AgentSurfaceSkipReason;
}

/**
 * Defines route decision audit record returned by route runner.
 */
export interface AgentRouteDecisionAuditRecord {
  routeKey: string;
  networkMode: AgentNetworkMode;
  restrictedNetworkTriggered: boolean;
  restrictedReason?: string;
  localFallbackActivated: boolean;
  selectedSurface?: string;
  selectedBy?: AgentRouteSelectionSource;
  fallbackTriggered: boolean;
  evaluatedSurfaces: AgentSurfaceEvaluationRecord[];
  requiredFallbackActions: AgentCapabilityFallbackAction[];
}

/**
 * Defines route dispatch result payload.
 */
export interface AgentRouteDispatchResult {
  selectedSurface: string;
  selectedProbeResult?: AgentProbeResult;
  invokeResult: AgentInvokeStageResult;
  capabilityEvaluation?: AgentCapabilityEvaluationResult;
  auditRecord: AgentRouteDecisionAuditRecord;
}

/**
 * Defines fallback context used when restricted network mode blocks all surfaces.
 */
export interface AgentRestrictedNetworkFallbackContext {
  request: AgentRouteDispatchRequest;
  routePolicy: AgentRouteResolvedPolicy;
  evaluatedSurfaces: AgentSurfaceEvaluationRecord[];
  reason: string;
}

/**
 * Defines local fallback handler contract for restricted-network dispatch.
 */
export interface AgentRestrictedNetworkFallbackHandlerContract {
  /**
   * Executes local fallback invocation when all route surfaces are blocked.
   * @param context Restricted-network fallback context payload.
   * @returns Fallback invoke result used as dispatch output.
   */
  invokeFallback(context: AgentRestrictedNetworkFallbackContext): Promise<AgentInvokeStageResult>;
}

/**
 * Defines minimal capability evaluator contract used by route runner.
 */
export interface AgentCapabilityEvaluatorContract {
  /**
   * Evaluates route capability requirement with one probe capability matrix.
   * @param capabilityMatrix Probe capability matrix.
   * @param requirement Route capability requirement.
   * @returns Capability evaluation result.
   */
  evaluate(
    capabilityMatrix: AgentCapabilityMatrix,
    requirement: AgentCapabilityRequirement,
  ): AgentCapabilityEvaluationResult;
}

/**
 * Defines protocol-level error mapper contract used by route runner.
 */
export interface AgentProtocolErrorMapperContract {
  /**
   * Maps probe-phase failures into standardized runtime errors.
   * @param surface Adapter surface identifier.
   * @param routeKey Route identifier.
   * @param error Raw probe error.
   * @returns Standardized runtime error.
   */
  mapProbeError(surface: string, routeKey: string, error: unknown): RuntimeError;

  /**
   * Maps invoke-stage failures into standardized runtime errors.
   * @param surface Adapter surface identifier.
   * @param request Stage invocation request payload.
   * @param error Raw invoke error.
   * @returns Standardized runtime error.
   */
  mapInvokeError(surface: string, request: AgentInvokeStageRequest, error: unknown): RuntimeError;

  /**
   * Maps stream-events failures into standardized runtime errors.
   * @param surface Adapter surface identifier.
   * @param request Stream-events request payload.
   * @param error Raw stream error.
   * @returns Standardized runtime error.
   */
  mapStreamError(surface: string, request: AgentStreamEventsRequest, error: unknown): RuntimeError;

  /**
   * Maps confirmation failures into standardized runtime errors.
   * @param surface Adapter surface identifier.
   * @param request Confirmation request payload.
   * @param error Raw confirmation error.
   * @returns Standardized runtime error.
   */
  mapConfirmationError(
    surface: string,
    request: AgentConfirmationRequest,
    error: unknown,
  ): RuntimeError;

  /**
   * Maps cancellation failures into standardized runtime errors.
   * @param surface Adapter surface identifier.
   * @param request Cancellation request payload.
   * @param error Raw cancel error.
   * @returns Standardized runtime error.
   */
  mapCancelError(surface: string, request: AgentCancelRequest, error: unknown): RuntimeError;
}

/**
 * Defines route runner constructor options.
 */
export interface AgentRouteRunnerOptions {
  routePolicies: AgentRoutePolicy[];
  protocolBySurface: Record<string, AgentProtocolContract>;
  surfaceNetworkRequirementBySurface?: Partial<Record<string, AgentSurfaceNetworkRequirement>>;
  restrictedNetworkFallbackHandler?: AgentRestrictedNetworkFallbackHandlerContract;
  capabilityEvaluator?: AgentCapabilityEvaluatorContract;
  errorMapper?: AgentProtocolErrorMapperContract;
}
