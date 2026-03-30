export enum CliAgentOnboardingPreset {
  SINGLE_TOOL_MINIMAL = 'single-tool-minimal',
  MULTI_TOOL_DEFAULT = 'multi-tool-default',
  SINGLE_TOOL_ALL_ROLES = 'single-tool-all-roles',
  RESTRICTED_NETWORK_SAFE = 'restricted-network-safe',
}

export const CLI_AGENT_ONBOARDING_PRESET_ORDER = [
  CliAgentOnboardingPreset.SINGLE_TOOL_MINIMAL,
  CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
  CliAgentOnboardingPreset.SINGLE_TOOL_ALL_ROLES,
  CliAgentOnboardingPreset.RESTRICTED_NETWORK_SAFE,
] as const;

export const CLI_AGENT_ONBOARDING_PRESET_VALUES = new Set<string>(
  Object.values(CliAgentOnboardingPreset),
);

export const CLI_AGENT_ONBOARDING_SCHEMA_VERSION = 'runtime.agent-onboarding.v1';
