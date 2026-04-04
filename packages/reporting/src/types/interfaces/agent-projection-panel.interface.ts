import type { AgentProjectionPanelStatusVariant } from '../../constants/index.js';

/**
 * Defines one transport-neutral row rendered by CLI or desktop agent-projection panels.
 */
export interface AgentProjectionPanelRowViewModel {
  id: string;
  title: string;
  detailLines: string[];
  statusVariant: AgentProjectionPanelStatusVariant;
}

/**
 * Defines one transport-neutral agent-projection panel payload.
 */
export interface AgentProjectionPanelViewModel {
  title: string;
  summaryLine: string;
  summaryBadges: string[];
  rows: AgentProjectionPanelRowViewModel[];
  footerNote?: string;
}
