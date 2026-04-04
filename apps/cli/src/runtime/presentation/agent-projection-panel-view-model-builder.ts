import {
  type AgentProjectionPanelBuildOptions,
  AgentProjectionPanelViewModelBuilder,
} from '@repo-ai-governor/reporting';

export type CliAgentProjectionPanelBuildOptions = AgentProjectionPanelBuildOptions;

/**
 * Preserves the CLI-local builder name while delegating to the shared reporting seam.
 */
export class CliAgentProjectionPanelViewModelBuilder extends AgentProjectionPanelViewModelBuilder {}
