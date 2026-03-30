import type { ExecutionReportAgentView } from '@repo-ai-governor/reporting';
import type { CliAgentProjectionPanelViewModel } from '../../types/interfaces/index.js';
import {
  CliAgentProjectionPresenter,
  type CliAgentProjectionRow,
  type CliAgentProjectionSummary,
} from './agent-projection-presenter.js';

export interface CliAgentProjectionPanelBuildOptions {
  agentView: NonNullable<ExecutionReportAgentView | null | undefined>;
  locale: string;
  title: string;
  maxRows?: number;
  footerNote?: string;
}

/**
 * Builds one transport-neutral panel view-model from shared agentView payloads.
 */
export class CliAgentProjectionPanelViewModelBuilder {
  public constructor(
    private readonly presenter: CliAgentProjectionPresenter = new CliAgentProjectionPresenter(),
  ) {}

  /**
   * Creates one reusable agent-projection panel view-model.
   * @param options Shared agentView payload and localized presentation metadata.
   * @returns Transport-neutral panel view-model for richer UI consumers.
   */
  public build(options: CliAgentProjectionPanelBuildOptions): CliAgentProjectionPanelViewModel {
    const summary = this.presenter.buildSummary(options.agentView);
    const visibleRows = this.presenter
      .buildRows(options.agentView)
      .slice(0, options.maxRows ?? Number.POSITIVE_INFINITY)
      .map((row) => this.buildRowViewModel(row, options.locale));
    const hiddenRowCount = options.agentView.descriptors.length - visibleRows.length;

    return {
      title: options.title,
      summaryLine: this.presenter.buildSummaryLine(options.agentView, options.locale),
      summaryBadges: this.buildSummaryBadges(summary, options.locale),
      rows: visibleRows,
      footerNote:
        hiddenRowCount > 0
          ? this.renderTruncationNote(hiddenRowCount, options.locale)
          : options.footerNote,
    };
  }

  private buildSummaryBadges(summary: CliAgentProjectionSummary, locale: string): string[] {
    if (this.isZhCnLocale(locale)) {
      return [
        `fallback=${summary.fallbackSelectionCount}`,
        `降级=${summary.degradedCount}`,
        `阻断=${summary.blockedCount}`,
        `session=${summary.sessionStatus}`,
      ];
    }

    return [
      `fallback=${summary.fallbackSelectionCount}`,
      `degraded=${summary.degradedCount}`,
      `blocked=${summary.blockedCount}`,
      `session=${summary.sessionStatus}`,
    ];
  }

  private buildRowViewModel(row: CliAgentProjectionRow, locale: string) {
    return {
      id: `${row.agentRole}:${row.roleProfileId}`,
      title: `${row.agentRole} -> ${row.selectedSurface}`,
      detailLines: this.buildDetailLines(row, locale),
      statusVariant: this.resolveStatusVariant(row),
    } as const;
  }

  private buildDetailLines(row: CliAgentProjectionRow, locale: string): string[] {
    const detailLines = [
      `profile=${row.roleProfileId} selected_by=${row.selectedBy} status=${row.projectionStatus}`,
    ];
    if (row.capabilityGapSummary !== 'none') {
      detailLines.push(
        this.isZhCnLocale(locale)
          ? `能力差距=${row.capabilityGapSummary}`
          : `capability_gap=${row.capabilityGapSummary}`,
      );
    }
    if (row.failureSummary !== 'none') {
      detailLines.push(
        this.isZhCnLocale(locale)
          ? `失败原因=${row.failureSummary}`
          : `reasons=${row.failureSummary}`,
      );
    }

    return detailLines;
  }

  private resolveStatusVariant(row: CliAgentProjectionRow) {
    if (row.projectionStatus === 'fail' || row.capabilityGapSummary.startsWith('unsupported:')) {
      return 'error' as const;
    }

    if (
      row.projectionStatus === 'warn' ||
      row.selectedBy === 'fallback' ||
      row.capabilityGapSummary !== 'none' ||
      row.failureSummary !== 'none'
    ) {
      return 'warning' as const;
    }

    return 'success' as const;
  }

  private renderTruncationNote(hiddenRowCount: number, locale: string): string {
    if (this.isZhCnLocale(locale)) {
      return `其余 ${hiddenRowCount} 个角色请查看完整 agentView 产物。`;
    }

    return `${hiddenRowCount} more roles are available in the full agentView artifact.`;
  }

  private isZhCnLocale(locale: string): boolean {
    return locale.toLowerCase() === 'zh-cn';
  }
}
