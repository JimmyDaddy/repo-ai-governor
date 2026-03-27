import { AGENT_LOCAL_FALLBACK_SURFACE } from './constants/index.js';
import type {
  AgentRestrictedNetworkFallbackContext,
  AgentRestrictedNetworkFallbackHandlerContract,
} from './types/index.js';

/**
 * Provides deterministic local fallback output when restricted network blocks adapter routing.
 *
 * Why this exists:
 * restricted-network mode must still keep local governance, flow orchestration, and
 * ledger writes executable even when all external adapter surfaces are unreachable.
 */
export class DefaultRestrictedNetworkFallbackHandler
  implements AgentRestrictedNetworkFallbackHandlerContract
{
  /**
   * Builds a local fallback invoke result for one restricted dispatch request.
   * @param context Restricted-network fallback context with route and reason metadata.
   * @returns Local invoke-stage result that can be consumed by runtime/audit layers.
   */
  public async invokeFallback(context: AgentRestrictedNetworkFallbackContext) {
    return {
      output: {
        adapterSurface: AGENT_LOCAL_FALLBACK_SURFACE,
        routeKey: context.request.routeKey,
        stageId: context.request.stageId,
        restrictedNetworkMode: true,
        restrictedReason: context.reason,
        localFallbackApplied: true,
        echoedInput: context.request.input,
      },
      elapsedMs: 0,
    };
  }
}
