import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { AgentCapabilityEvaluator } from "./agent-capability-evaluator.js";
import { AgentProtocolErrorMapper } from "./agent-protocol-error-mapper.js";
import { AgentRouteRegistry } from "./agent-route-registry.js";
import {
  AgentAvailabilityStatus,
  AgentCapabilityFallbackAction,
  AgentRouteSelectionSource,
  AgentSurfaceSkipReason,
} from "./constants/index.js";
import type {
  AgentCapabilityEvaluationResult,
  AgentProbeResult,
  AgentProtocolContract,
  AgentRouteDispatchRequest,
  AgentRouteDispatchResult,
  AgentRouteRunnerOptions,
  AgentSurfaceEvaluationRecord,
} from "./types/index.js";

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
  private readonly capabilityEvaluator;
  private readonly errorMapper;

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
    this.capabilityEvaluator = options.capabilityEvaluator ?? new AgentCapabilityEvaluator();
    this.errorMapper = options.errorMapper ?? new AgentProtocolErrorMapper();
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
    const capabilityRequirement =
      request.capabilityRequirementOverride ?? routePolicy.capabilityRequirement;
    const evaluatedSurfaces: AgentSurfaceEvaluationRecord[] = [];
    const requiredFallbackActionSet = new Set<AgentCapabilityFallbackAction>();

    for (const [index, surface] of routePolicy.candidateSurfaces.entries()) {
      const protocol = this.protocolBySurface[surface];
      const selectedBy =
        index === 0 ? AgentRouteSelectionSource.PRIMARY : AgentRouteSelectionSource.FALLBACK;
      const fallbackTriggered = selectedBy === AgentRouteSelectionSource.FALLBACK;

      if (!protocol) {
        evaluatedSurfaces.push({
          surface,
          probeSucceeded: false,
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

    throw this.buildNoAvailableSurfaceError(
      request.routeKey,
      routePolicy.candidateSurfaces,
      evaluatedSurfaces,
      Array.from(requiredFallbackActionSet),
    );
  }

  /**
   * Creates surface evaluation record from availability + capability checks.
   * @param input Evaluation input payload.
   * @returns Surface evaluation record.
   */
  private createEvaluationRecord(input: {
    surface: string;
    availabilityStatus: AgentAvailabilityStatus;
    fallbackTriggered: boolean;
    capabilityEvaluation?: AgentCapabilityEvaluationResult;
  }): AgentSurfaceEvaluationRecord {
    const capabilityEvaluation = input.capabilityEvaluation;
    const fallbackActions = capabilityEvaluation?.requiredFallbackActions ?? [];

    return {
      surface: input.surface,
      probeSucceeded: true,
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
   * @returns Standardized runtime error.
   */
  private buildNoAvailableSurfaceError(
    routeKey: string,
    candidateSurfaces: string[],
    evaluatedSurfaces: AgentSurfaceEvaluationRecord[],
    requiredFallbackActions: AgentCapabilityFallbackAction[],
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
      `No available surface can satisfy route "${routeKey}".`,
      {
        routeKey,
        candidateSurfaces,
        requiredFallbackActions,
        evaluatedSurfaces,
      },
    );
  }

  /**
   * Validates route runner constructor options.
   * @param options Route runner options.
   */
  private assertOptions(options: AgentRouteRunnerOptions): void {
    if (!options || typeof options !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        "Agent route runner options must be an object.",
      );
    }
    if (!Array.isArray(options.routePolicies) || options.routePolicies.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        "Agent route runner options must include non-empty routePolicies.",
      );
    }
    if (!options.protocolBySurface || typeof options.protocolBySurface !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        "Agent route runner options must include protocolBySurface map.",
      );
    }
  }
}
