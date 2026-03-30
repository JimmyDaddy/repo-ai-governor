export type CliAgentProjectionPanelStatusVariant = 'info' | 'success' | 'warning' | 'error';

export interface CliAgentProjectionPanelRowViewModel {
  id: string;
  title: string;
  detailLines: string[];
  statusVariant: CliAgentProjectionPanelStatusVariant;
}

export interface CliAgentProjectionPanelViewModel {
  title: string;
  summaryLine: string;
  summaryBadges: string[];
  rows: CliAgentProjectionPanelRowViewModel[];
  footerNote?: string;
}
