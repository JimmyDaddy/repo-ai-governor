export {
  HOST_DISTRIBUTION_DISCOVERY_STATE_VALUES,
  HOST_DISTRIBUTION_HANDOFF_BRIDGE_VALUES,
  HOST_DISTRIBUTION_MODE_VALUES,
} from '@repo-ai-governor/standards';
import { HostDistributionHandoffBridge, HostDistributionTarget } from '@repo-ai-governor/standards';

/**
 * Defines the supported host distribution hosts for the Codex adapter package.
 */
export const HOST_DISTRIBUTION_HOST_VALUES = new Set(['codex']);

/**
 * Defines the host targets accepted by the Codex host renderer.
 */
export const CODEX_HOST_DISTRIBUTION_TARGET_VALUES = new Set<HostDistributionTarget>([
  HostDistributionTarget.CODEX_PROJECT_LOCAL,
  HostDistributionTarget.CODEX_PLUGIN,
]);

/**
 * Defines the default handoff bridge used by Codex staged exports.
 */
export const CODEX_DEFAULT_HOST_DISTRIBUTION_HANDOFF_BRIDGE: HostDistributionHandoffBridge =
  HostDistributionHandoffBridge.CLI_WRAPPER;

/**
 * Defines the default staged export root segment for Codex outputs.
 */
export const CODEX_DEFAULT_STAGED_EXPORT_ROOT = '.repo-ai-governor/generated/hosts/codex';
