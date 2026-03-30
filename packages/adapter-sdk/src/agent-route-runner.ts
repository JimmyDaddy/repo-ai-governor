import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';
import { AgentCapabilityEvaluator } from './agent-capability-evaluator.js';
import { AgentProtocolErrorMapper } from './agent-protocol-error-mapper.js';
import { AgentRouteRegistry } from './agent-route-registry.js';
import {
  AGENT_LOCAL_FALLBACK_SURFACE,
  AgentAvailabilityStatus,
  AgentCapabilityFallbackAction,
  AgentNetworkMode,
  AgentRouteSelectionSource,
  AgentSurfaceNetworkRequirement,
  AgentSurfaceSkipReason,
} from './constants/index.js';
import { DefaultRestrictedNetworkFallbackHandler } from './restricted-network-fallback-handler.js';
import type {
  AgentCapabilityEvaluationResult,
  AgentCapabilityEvaluatorContract,
  AgentProbeResult,
  AgentProtocolContract,
  AgentProtocolErrorMapperContract,
  AgentRestrictedNetworkFallbackContext,
  AgentRestrictedNetworkFallbackHandlerContract,
  AgentRouteDispatchRequest,
  AgentRouteDispatchResult,
  AgentRouteDispatchRuntimeContext,
  AgentRouteResolvedPolicy,
  AgentRouteRunnerOptions,
  AgentSurfaceEvaluationRecord,
} from './types/index.js';

const DEFAULT_RESTRICTED_REASON = 'external-network-restricted';
const SURFACE_NETWORK_REQUIREMENT_VALUES = new Set<string>(
  Object.values(AgentSurfaceNetworkRequirement),
);

/**
 * Executes routeKey-based primary/fallback routing with capability-aware degrade decisions.
 *
 * Why this exists:
 * runtime should consume one deterministic SDK entry for route selection,
 * fallback progression, and adapter invocation error normalization.
 */
export class AgentRouteRunner {
  private readonly routeRegistry: AgentRouteRegistry;
  private readonly protocolBySurface: Record<string, AgentProtocolContract>;
  private readonly capabilityEvaluator: AgentCapabilityEvaluatorContract;
  private readonly errorMapper: AgentProtocolErrorMapperContract;
  private readonly surfaceNetworkRequirementBySurface: Partial<
    Record<string, AgentSurfaceNetworkRequirement>
  >;
  private readonly restrictedNetworkFallbackHandler: AgentRestrictedNetworkFallbackHandlerContract;

  /**
   * Creates route runner with route policies and protocol map.
   * @param options Route runner options.
   */
  public constructor(options: AgentRouteRunnerOptions) {
    this.assertOptions(options);
    this.routeRegistry = new AgentRouteRegistry({
      routePolicies: options.routePolicies,
    });
    this.protocolBySurface = options.protocolBySurface;
    this.surfaceNetworkRequirementBySurface = options.surfaceNetworkRequirementBySurface ?? {};
    this.capabilityEvaluator = options.capabilityEvaluator ?? new AgentCapabilityEvaluator();
    this.errorMapper = options.errorMapper ?? new AgentProtocolErrorMapper();
    this.restrictedNetworkFallbackHandler =
      options.restrictedNetworkFallbackHandler ?? new DefaultRestrictedNetworkFallbackHandler();
  }

  /**
   * Dispatches one stage invocation by routeKey with primary/fallback policy.
   * @param request Route dispatch request payload.
   * @returns Selected surface, invoke result, and route decision audit.
   */
  public async dispatchStage(
    request: AgentRouteDispatchRequest,
  ): Promise<AgentRouteDispatchResult> {
    const routePolicy = this.routeRegistry.resolveRoute(request.routeKey);
    const runtimeContext = request.runtimeContext ?? {};
    const networkMode = runtimeContext.networkMode ?? AgentNetworkMode.STANDARD;
    const restrictedNetworkTriggered = networkMode === AgentNetworkMode.RESTRICTED;
    const restrictedReason = this.resolveRestrictedReason(runtimeContext);
    const capabilityRequirement =
      request.capabilityRequirementOverride ?? routePolicy.capabilityRequirement;
    const evaluatedSurfaces: AgentSurfaceEvaluationRecord[] = [];
    const requiredFallbackActionSet = new Set<AgentCapabilityFallbackAction>();

    for (const [index, surface] of routePolicy.candidateSurfaces.entries()) {
      const protocol = this.protocolBySurface[surface];
      const selectedBy =
        index === 0 ? AgentRouteSelectionSource.PRIMARY : AgentRouteSelectionSource.FALLBACK;
      const fallbackTriggered = selectedBy === AgentRouteSelectionSource.FALLBACK;
      const networkRequirement = this.resolveSurfaceNetworkRequirement(surface);

      if (
        restrictedNetworkTriggered &&
        networkRequirement === AgentSurfaceNetworkRequirement.EXTERNAL_NETWORK
      ) {
        requiredFallbackActionSet.add(AgentCapabilityFallbackAction.USE_FALLBACK_SURFACE);
        evaluatedSurfaces.push({
          surface,
          probeSucceeded: false,
          networkRequirement,
          errorCode: GovernorErrorCode.ADAPTER_ROUTE_RESTRICTED_NETWORK_BLOCKED,
          errorMessage: `Surface "${surface}" is blocked in restricted network mode.`,
          fallbackTriggered,
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          requiredFallbackActions: [AgentCapabilityFallbackAction.USE_FALLBACK_SURFACE],
          skippedReason: AgentSurfaceSkipReason.NETWORK_RESTRICTED,
        });
        continue;
      }

      if (!protocol) {
        evaluatedSurfaces.push({
          surface,
          probeSucceeded: false,
          networkRequirement,
          errorCode: GovernorErrorCode.ADAPTER_ROUTE_SURFACE_NOT_REGISTERED,
          errorMessage: `Route candidate surface "${surface}" is not registered in protocol map.`,
          fallbackTriggered,
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          requiredFallbackActions: [],
          skippedReason: AgentSurfaceSkipReason.SURFACE_NOT_REGISTERED,
        });
        continue;
      }

      let probeResult: AgentProbeResult;
      try {
        probeResult = await protocol.probe({
          routeKey: request.routeKey,
          ...(request.signal ? { signal: request.signal } : {}),
          ...(capabilityRequirement
            ? {
                requiredCapabilities: capabilityRequirement.requiredCapabilities,
              }
            : {}),
        });
      } catch (error) {
        const mappedProbeError = this.errorMapper.mapProbeError(surface, request.routeKey, error);
        evaluatedSurfaces.push({
          surface,
          probeSucceeded: false,
          networkRequirement,
          errorCode: mappedProbeError.code,
          errorMessage: mappedProbeError.message,
          fallbackTriggered,
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          requiredFallbackActions: [],
          skippedReason: AgentSurfaceSkipReason.PROBE_FAILED,
        });
        continue;
      }

      if (probeResult.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
        evaluatedSurfaces.push({
          surface,
          probeSucceeded: true,
          networkRequirement,
          availabilityStatus: probeResult.availabilityStatus,
          fallbackTriggered,
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          requiredFallbackActions: [],
          skippedReason: AgentSurfaceSkipReason.SURFACE_UNAVAILABLE,
        });
        continue;
      }

      const capabilityEvaluation = capabilityRequirement
        ? this.capabilityEvaluator.evaluate(probeResult.capabilityMatrix, capabilityRequirement)
        : undefined;
      const fallbackActions = capabilityEvaluation?.requiredFallbackActions ?? [];
      for (const action of fallbackActions) {
        requiredFallbackActionSet.add(action);
      }
      const evaluationRecord = this.createEvaluationRecord({
        surface,
        networkRequirement,
        availabilityStatus: probeResult.availabilityStatus,
        fallbackTriggered,
        capabilityEvaluation,
      });
      evaluatedSurfaces.push(evaluationRecord);

      if (capabilityEvaluation && !capabilityEvaluation.isSatisfied) {
        if (
          capabilityEvaluation.requiredFallbackActions.includes(
            AgentCapabilityFallbackAction.USE_FALLBACK_SURFACE,
          )
        ) {
          continue;
        }
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_ROUTE_CAPABILITY_UNSATISFIED,
          `Route "${request.routeKey}" capability requirement is not satisfied on surface "${surface}".`,
          {
            routeKey: request.routeKey,
            surface,
            networkMode,
            requiredFallbackActions: capabilityEvaluation.requiredFallbackActions,
            unsupportedCapabilities: capabilityEvaluation.unsupportedCapabilities,
            degradedCapabilities: capabilityEvaluation.degradedCapabilities,
            evaluatedSurfaces,
          },
        );
      }

      try {
        const invokeResult = await protocol.invokeStage(request);
        return {
          selectedSurface: surface,
          selectedProbeResult: probeResult,
          invokeResult,
          ...(capabilityEvaluation
            ? {
                capabilityEvaluation,
              }
            : {}),
          auditRecord: {
            routeKey: request.routeKey,
            networkMode,
            restrictedNetworkTriggered,
            ...(restrictedNetworkTriggered ? { restrictedReason } : {}),
            localFallbackActivated: false,
            selectedSurface: surface,
            selectedBy,
            fallbackTriggered,
            evaluatedSurfaces,
            requiredFallbackActions: Array.from(requiredFallbackActionSet),
          },
        };
      } catch (error) {
        throw this.errorMapper.mapInvokeError(surface, request, error);
      }
    }

    const requiredFallbackActions = Array.from(requiredFallbackActionSet);
    if (restrictedNetworkTriggered && this.isRestrictedNetworkFallbackEligible(evaluatedSurfaces)) {
      if (runtimeContext.allowLocalFallback === false) {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_ROUTE_RESTRICTED_NETWORK_BLOCKED,
          `Restricted network mode blocked all candidate surfaces for route "${request.routeKey}".`,
          {
            routeKey: request.routeKey,
            restrictedReason,
            candidateSurfaces: routePolicy.candidateSurfaces,
            evaluatedSurfaces,
            requiredFallbackActions,
          },
        );
      }

      return this.dispatchByRestrictedFallback(
        request,
        routePolicy,
        restrictedReason,
        evaluatedSurfaces,
        requiredFallbackActions,
      );
    }

    throw this.buildNoAvailableSurfaceError(
      request.routeKey,
      routePolicy.candidateSurfaces,
      evaluatedSurfaces,
      requiredFallbackActions,
      networkMode,
    );
  }

  /**
   * Executes local fallback path when restricted network blocks all route surfaces.
   * @param request Route dispatch request payload.
   * @param routePolicy Resolved route policy.
   * @param restrictedReason Restricted-network reason text.
   * @param evaluatedSurfaces Surface evaluation records.
   * @param requiredFallbackActions Aggregated fallback actions.
   * @returns Route dispatch result with local fallback output.
   */
  private async dispatchByRestrictedFallback(
    request: AgentRouteDispatchRequest,
    routePolicy: AgentRouteResolvedPolicy,
    restrictedReason: string,
    evaluatedSurfaces: AgentSurfaceEvaluationRecord[],
    requiredFallbackActions: AgentCapabilityFallbackAction[],
  ): Promise<AgentRouteDispatchResult> {
    const fallbackContext: AgentRestrictedNetworkFallbackContext = {
      request,
      routePolicy,
      evaluatedSurfaces,
      reason: restrictedReason,
    };

    try {
      const invokeResult =
        await this.restrictedNetworkFallbackHandler.invokeFallback(fallbackContext);
      return {
        selectedSurface: AGENT_LOCAL_FALLBACK_SURFACE,
        invokeResult,
        auditRecord: {
          routeKey: request.routeKey,
          networkMode: AgentNetworkMode.RESTRICTED,
          restrictedNetworkTriggered: true,
          restrictedReason,
          localFallbackActivated: true,
          selectedSurface: AGENT_LOCAL_FALLBACK_SURFACE,
          selectedBy: AgentRouteSelectionSource.LOCAL_FALLBACK,
          fallbackTriggered: true,
          evaluatedSurfaces,
          requiredFallbackActions,
        },
      };
    } catch (error) {
      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_RESTRICTED_NETWORK_FALLBACK_FAILED,
        `Restricted network local fallback failed for route "${request.routeKey}".`,
        {
          routeKey: request.routeKey,
          restrictedReason,
          fallbackErrorCode: standardizedError.code,
          fallbackErrorMessage: standardizedError.message,
        },
      );
    }
  }

  /**
   * Creates surface evaluation record from availability + capability checks.
   * @param input Evaluation input payload.
   * @returns Surface evaluation record.
   */
  private createEvaluationRecord(input: {
    surface: string;
    networkRequirement: AgentSurfaceNetworkRequirement;
    availabilityStatus: AgentAvailabilityStatus;
    fallbackTriggered: boolean;
    capabilityEvaluation?: AgentCapabilityEvaluationResult;
  }): AgentSurfaceEvaluationRecord {
    const capabilityEvaluation = input.capabilityEvaluation;
    const fallbackActions = capabilityEvaluation?.requiredFallbackActions ?? [];

    return {
      surface: input.surface,
      probeSucceeded: true,
      networkRequirement: input.networkRequirement,
      availabilityStatus: input.availabilityStatus,
      capabilitySatisfied: capabilityEvaluation ? capabilityEvaluation.isSatisfied : true,
      fallbackTriggered: input.fallbackTriggered,
      unsupportedCapabilities: capabilityEvaluation?.unsupportedCapabilities ?? [],
      degradedCapabilities: capabilityEvaluation?.degradedCapabilities ?? [],
      requiredFallbackActions: fallbackActions,
      ...(capabilityEvaluation && !capabilityEvaluation.isSatisfied
        ? {
            skippedReason: AgentSurfaceSkipReason.CAPABILITY_UNSATISFIED,
            errorCode: GovernorErrorCode.ADAPTER_ROUTE_CAPABILITY_UNSATISFIED,
            errorMessage: `Capability requirement is not satisfied on surface "${input.surface}".`,
          }
        : {}),
    };
  }

  /**
   * Creates standardized no-available-surface error for route dispatch failures.
   * @param routeKey Route identifier.
   * @param candidateSurfaces Candidate surface list.
   * @param evaluatedSurfaces Evaluated surface records.
   * @param requiredFallbackActions Aggregated fallback actions.
   * @param networkMode Runtime network mode.
   * @returns Standardized runtime error.
   */
  private buildNoAvailableSurfaceError(
    routeKey: string,
    candidateSurfaces: string[],
    evaluatedSurfaces: AgentSurfaceEvaluationRecord[],
    requiredFallbackActions: AgentCapabilityFallbackAction[],
    networkMode: AgentNetworkMode,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
      `No available surface can satisfy route "${routeKey}".`,
      {
        routeKey,
        networkMode,
        candidateSurfaces,
        requiredFallbackActions,
        evaluatedSurfaces,
      },
    );
  }

  /**
   * Resolves one surface network requirement with conservative default.
   * @param surface Adapter surface id.
   * @returns Surface network requirement enum.
   */
  private resolveSurfaceNetworkRequirement(surface: string): AgentSurfaceNetworkRequirement {
    return (
      this.surfaceNetworkRequirementBySurface[surface] ??
      AgentSurfaceNetworkRequirement.EXTERNAL_NETWORK
    );
  }

  /**
   * Resolves restricted-network reason from runtime context with deterministic fallback.
   * @param runtimeContext Runtime context from route request.
   * @returns Restricted reason string for audit and fallback records.
   */
  private resolveRestrictedReason(runtimeContext: AgentRouteDispatchRuntimeContext): string {
    const restrictedReason = runtimeContext.restrictedReason?.trim();
    if (restrictedReason) {
      return restrictedReason;
    }
    return DEFAULT_RESTRICTED_REASON;
  }

  /**
   * Checks whether restricted-network fallback can be safely activated.
   * @param evaluatedSurfaces Surface evaluation rows collected during dispatch.
   * @returns True only when every candidate was skipped by network restriction.
   */
  private isRestrictedNetworkFallbackEligible(
    evaluatedSurfaces: AgentSurfaceEvaluationRecord[],
  ): boolean {
    if (evaluatedSurfaces.length === 0) {
      return false;
    }

    return evaluatedSurfaces.every(
      (evaluationRecord) =>
        evaluationRecord.skippedReason === AgentSurfaceSkipReason.NETWORK_RESTRICTED,
    );
  }

  /**
   * Validates route runner constructor options.
   * @param options Route runner options.
   */
  private assertOptions(options: AgentRouteRunnerOptions): void {
    if (!options || typeof options !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        'Agent route runner options must be an object.',
      );
    }
    if (!Array.isArray(options.routePolicies) || options.routePolicies.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        'Agent route runner options must include non-empty routePolicies.',
      );
    }
    if (!options.protocolBySurface || typeof options.protocolBySurface !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        'Agent route runner options must include protocolBySurface map.',
      );
    }
    if (
      options.surfaceNetworkRequirementBySurface !== undefined &&
      typeof options.surfaceNetworkRequirementBySurface !== 'object'
    ) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        'surfaceNetworkRequirementBySurface must be an object when provided.',
      );
    }
    if (options.surfaceNetworkRequirementBySurface) {
      for (const [surface, networkRequirement] of Object.entries(
        options.surfaceNetworkRequirementBySurface,
      )) {
        if (
          typeof networkRequirement !== 'string' ||
          !SURFACE_NETWORK_REQUIREMENT_VALUES.has(networkRequirement)
        ) {
          throw new RuntimeError(
            GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
            `surfaceNetworkRequirementBySurface["${surface}"] is invalid.`,
            {
              surface,
              networkRequirement,
              allowedValues: Array.from(SURFACE_NETWORK_REQUIREMENT_VALUES),
            },
          );
        }
      }
    }
    if (
      options.restrictedNetworkFallbackHandler !== undefined &&
      (typeof options.restrictedNetworkFallbackHandler !== 'object' ||
        typeof options.restrictedNetworkFallbackHandler.invokeFallback !== 'function')
    ) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        'restrictedNetworkFallbackHandler must expose invokeFallback(context).',
      );
    }
  }
}
