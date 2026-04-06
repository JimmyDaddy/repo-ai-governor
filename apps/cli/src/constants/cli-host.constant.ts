import {
  HostDistributionHandoffBridge,
  HostDistributionHost,
  HostDistributionMode,
  HostDistributionTarget,
} from '@repo-ai-governor/standards';

/**
 * Defines the sub-actions supported by the `host` command surface.
 */
export enum CliHostAction {
  EXPORT = 'export',
  VERIFY = 'verify',
  PACK = 'pack',
}

/**
 * Defines the GitHub Copilot target shorthands accepted by CLI parsing.
 */
export enum CliGithubCopilotTargetOption {
  REPO_LOCAL = 'repo-local',
  CLI_PLUGIN = 'cli-plugin',
  GITHUB_COM_AGENT = 'github-com-agent',
}

/**
 * Re-exports host-action values as a validation set.
 */
export const CLI_HOST_ACTION_VALUES = new Set<string>(Object.values(CliHostAction));

/**
 * Re-exports host values as a validation set.
 */
export const CLI_HOST_VALUES = new Set<string>(Object.values(HostDistributionHost));

/**
 * Re-exports host-mode values as a validation set.
 */
export const CLI_HOST_MODE_VALUES = new Set<string>(Object.values(HostDistributionMode));

/**
 * Re-exports host-target values as a validation set.
 */
export const CLI_HOST_TARGET_VALUES = new Set<string>(Object.values(HostDistributionTarget));

/**
 * Re-exports handoff-bridge values as a validation set.
 */
export const CLI_HOST_HANDOFF_BRIDGE_VALUES = new Set<string>(
  Object.values(HostDistributionHandoffBridge),
);

/**
 * Re-exports GitHub Copilot target shorthands as a validation set.
 */
export const CLI_GITHUB_COPILOT_TARGET_OPTION_VALUES = new Set<string>(
  Object.values(CliGithubCopilotTargetOption),
);
