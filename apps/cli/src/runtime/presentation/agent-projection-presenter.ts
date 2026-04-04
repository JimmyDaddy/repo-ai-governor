import {
  AgentProjectionPresenter,
  type AgentProjectionRow,
  type AgentProjectionSummary,
} from '@repo-ai-governor/reporting';

export type CliAgentProjectionSummary = AgentProjectionSummary;
export type CliAgentProjectionRow = AgentProjectionRow;

/**
 * Preserves the CLI-local presenter name while delegating to the shared reporting seam.
 *
 * Why this exists:
 * existing CLI call sites and tests can keep their stable imports while desktop and CLI now
 * share the same implementation under `packages/reporting`.
 */
export class CliAgentProjectionPresenter extends AgentProjectionPresenter {}
