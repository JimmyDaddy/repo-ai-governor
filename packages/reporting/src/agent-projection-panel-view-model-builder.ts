import {
  AgentProjectionPresenter,
  type AgentProjectionRow,
  type AgentProjectionSummary,
} from './agent-projection-presenter.js';
import { AgentProjectionPanelStatusVariant } from './constants/index.js';
import type { AgentProjectionPanelViewModel, ExecutionReportAgentView } from './types/index.js';

export interface AgentProjectionPanelBuildOptions {
  agentView: NonNullable<ExecutionReportAgentView | null | undefined>;
  locale: string;
  title: string;
  maxRows?: number;
  footerNote?: string;
}

/**
 * Builds one transport-neutral panel view-model from shared agentView payloads.
 */
export class AgentProjectionPanelViewModelBuilder {
  public constructor(
    private readonly presenter: AgentProjectionPresenter = new AgentProjectionPresenter(),
  ) {}

  /**
   * Creates one reusable agent-projection panel view-model.
   * @param options Shared agentView payload and localized presentation metadata.
   * @returns Transport-neutral panel view-model for richer UI consumers.
   */
  public build(options: AgentProjectionPanelBuildOptions): AgentProjectionPanelViewModel {
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

  private buildSummaryBadges(summary: AgentProjectionSummary, locale: string): string[] {
    return [
      `fallback=${summary.fallbackSelectionCount}`,
      this.localizeText(
        locale,
        `degraded=${summary.degradedCount}`,
        `降级=${summary.degradedCount}`,
      ),
      this.localizeText(locale, `blocked=${summary.blockedCount}`, `阻断=${summary.blockedCount}`),
      `session=${summary.sessionStatus}`,
    ];
  }

  private buildRowViewModel(row: AgentProjectionRow, locale: string) {
    return {
      id: `${row.agentRole}:${row.roleProfileId}`,
      title: `${row.agentRole} -> ${row.selectedSurface}`,
      detailLines: this.buildDetailLines(row, locale),
      statusVariant: this.resolveStatusVariant(row),
    } as const;
  }

  private buildDetailLines(row: AgentProjectionRow, locale: string): string[] {
    const detailLines = [
      `profile=${row.roleProfileId} selected_by=${row.selectedBy} status=${row.projectionStatus}`,
    ];
    if (row.capabilityGapSummary !== 'none') {
      detailLines.push(
        this.localizeText(
          locale,
          `capability_gap=${row.capabilityGapSummary}`,
          `能力差距=${row.capabilityGapSummary}`,
        ),
      );
    }
    if (row.failureSummary !== 'none') {
      detailLines.push(
        this.localizeText(
          locale,
          `reasons=${row.failureSummary}`,
          `失败原因=${row.failureSummary}`,
        ),
      );
    }

    return detailLines;
  }

  private resolveStatusVariant(row: AgentProjectionRow): AgentProjectionPanelStatusVariant {
    if (row.projectionStatus === 'fail' || row.capabilityGapSummary.startsWith('unsupported:')) {
      return AgentProjectionPanelStatusVariant.ERROR;
    }

    if (
      row.projectionStatus === 'warn' ||
      row.selectedBy === 'fallback' ||
      row.capabilityGapSummary !== 'none' ||
      row.failureSummary !== 'none'
    ) {
      return AgentProjectionPanelStatusVariant.WARNING;
    }

    return AgentProjectionPanelStatusVariant.SUCCESS;
  }

  private renderTruncationNote(hiddenRowCount: number, locale: string): string {
    return this.localizeText(
      locale,
      `${hiddenRowCount} more roles are available in the full agentView artifact.`,
      `其余 ${hiddenRowCount} 个角色请查看完整 agentView 产物。`,
    );
  }

  private localizeText(locale: string, english: string, chinese: string): string {
    return locale.toLowerCase() === 'zh-cn' ? chinese : english;
  }
}
