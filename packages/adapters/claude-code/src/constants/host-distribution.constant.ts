export {
  HOST_DISTRIBUTION_DISCOVERY_STATE_VALUES,
  HOST_DISTRIBUTION_HANDOFF_BRIDGE_VALUES,
  HOST_DISTRIBUTION_MODE_VALUES,
} from '@repo-ai-governor/standards';
import { HostDistributionHandoffBridge, HostDistributionTarget } from '@repo-ai-governor/standards';

/**
 * Defines the supported host distribution hosts for the Claude Code adapter package.
 */
export const HOST_DISTRIBUTION_HOST_VALUES = new Set(['claude-code']);

/**
 * Defines the host targets accepted by the Claude Code host renderer.
 */
export const CLAUDE_CODE_HOST_DISTRIBUTION_TARGET_VALUES = new Set<HostDistributionTarget>([
  HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL,
  HostDistributionTarget.CLAUDE_CODE_PLUGIN,
]);

/**
 * Defines the default handoff bridge used by Claude Code staged exports.
 */
export const CLAUDE_CODE_DEFAULT_HOST_DISTRIBUTION_HANDOFF_BRIDGE: HostDistributionHandoffBridge =
  HostDistributionHandoffBridge.CLI_WRAPPER;

/**
 * Defines the default staged export root segment for Claude Code outputs.
 */
export const CLAUDE_CODE_DEFAULT_STAGED_EXPORT_ROOT =
  '.repo-ai-governor/generated/hosts/claude-code';
