export {
  HOST_DISTRIBUTION_DISCOVERY_STATE_VALUES,
  HOST_DISTRIBUTION_HANDOFF_BRIDGE_VALUES,
  HOST_DISTRIBUTION_MODE_VALUES,
} from '@repo-ai-governor/standards';
import { HostDistributionHandoffBridge, HostDistributionTarget } from '@repo-ai-governor/standards';

/**
 * Defines the supported host distribution hosts for the GitHub Copilot adapter package.
 */
export const HOST_DISTRIBUTION_HOST_VALUES = new Set(['github-copilot']);

/**
 * Defines the host targets accepted by the GitHub Copilot host renderer.
 */
export const GITHUB_COPILOT_HOST_DISTRIBUTION_TARGET_VALUES = new Set<HostDistributionTarget>([
  HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL,
  HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN,
  HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT,
]);

/**
 * Defines the default handoff bridge used by GitHub Copilot staged exports.
 */
export const GITHUB_COPILOT_DEFAULT_HOST_DISTRIBUTION_HANDOFF_BRIDGE: HostDistributionHandoffBridge =
  HostDistributionHandoffBridge.CLI_WRAPPER;

/**
 * Defines the default staged export root segment for GitHub Copilot outputs.
 */
export const GITHUB_COPILOT_DEFAULT_STAGED_EXPORT_ROOT =
  '.repo-ai-governor/generated/hosts/github-copilot';
