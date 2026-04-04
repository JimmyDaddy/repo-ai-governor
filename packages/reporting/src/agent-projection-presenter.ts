import type { ExecutionReportAgentView } from './types/index.js';

export interface AgentProjectionSummary {
  descriptorCount: number;
  activeSurfaceCount: number;
  sessionStatus: string;
  fallbackSelectionCount: number;
  degradedCount: number;
  blockedCount: number;
  capabilityGapCount: number;
}

export interface AgentProjectionRow {
  agentRole: string;
  roleProfileId: string;
  selectedSurface: string;
  selectedBy: string;
  projectionStatus: string;
  capabilityGapSummary: string;
  failureSummary: string;
}

/**
 * Builds reusable presentation-ready summaries from shared agentView payloads.
 *
 * Why this exists:
 * both CLI and desktop surfaces should reuse one transport-neutral presentation seam
 * instead of hand-formatting routing, fallback, and capability-gap facts independently.
 */
export class AgentProjectionPresenter {
  /**
   * Builds compact aggregate counts from one agentView payload.
   * @param agentView Shared execution/report agentView payload.
   * @returns Aggregate summary counts.
   */
  public buildSummary(
    agentView: NonNullable<ExecutionReportAgentView | null | undefined>,
  ): AgentProjectionSummary {
    const descriptorCount = agentView.descriptors.length;
    const activeSurfaceCount = new Set(
      agentView.descriptors.map(
        (descriptor) => descriptor.selectedSurface ?? descriptor.primarySurface,
      ),
    ).size;
    const fallbackSelectionCount = agentView.descriptors.filter(
      (descriptor) => descriptor.selectedBy === 'fallback',
    ).length;
    const degradedCount = agentView.descriptors.filter(
      (descriptor) =>
        descriptor.degradedCapabilities.length > 0 || descriptor.projectionStatus === 'warn',
    ).length;
    const blockedCount = agentView.descriptors.filter(
      (descriptor) =>
        descriptor.unsupportedCapabilities.length > 0 || descriptor.projectionStatus === 'fail',
    ).length;
    const capabilityGapCount = agentView.descriptors.filter(
      (descriptor) =>
        descriptor.unsupportedCapabilities.length > 0 || descriptor.degradedCapabilities.length > 0,
    ).length;

    return {
      descriptorCount,
      activeSurfaceCount,
      sessionStatus: agentView.sessionProjection?.sessionStatus ?? 'none',
      fallbackSelectionCount,
      degradedCount,
      blockedCount,
      capabilityGapCount,
    };
  }

  /**
   * Builds one deterministic row per projected descriptor for presenter surfaces.
   * @param agentView Shared execution/report agentView payload.
   * @returns Ordered role rows.
   */
  public buildRows(
    agentView: NonNullable<ExecutionReportAgentView | null | undefined>,
  ): AgentProjectionRow[] {
    return agentView.descriptors
      .map((descriptor) => ({
        agentRole: descriptor.agentRole,
        roleProfileId: descriptor.roleProfileId,
        selectedSurface: String(descriptor.selectedSurface ?? descriptor.primarySurface),
        selectedBy: descriptor.selectedBy ?? 'unspecified',
        projectionStatus: descriptor.projectionStatus ?? 'unknown',
        capabilityGapSummary: this.buildCapabilityGapSummary(descriptor),
        failureSummary:
          descriptor.failureReasons.length > 0 ? descriptor.failureReasons.join('|') : 'none',
      }))
      .sort((left, right) => left.agentRole.localeCompare(right.agentRole));
  }

  /**
   * Builds one locale-aware compact summary line for human-facing surfaces.
   * @param agentView Shared execution/report agentView payload.
   * @param locale Active locale identifier.
   * @returns Compact summary string.
   */
  public buildSummaryLine(
    agentView: NonNullable<ExecutionReportAgentView | null | undefined>,
    locale: string,
  ): string {
    const summary = this.buildSummary(agentView);
    return this.localizeText(
      locale,
      `agents=${summary.descriptorCount}, surfaces=${summary.activeSurfaceCount}, fallback=${summary.fallbackSelectionCount}, degraded=${summary.degradedCount}, blocked=${summary.blockedCount}, gaps=${summary.capabilityGapCount}, session=${summary.sessionStatus}`,
      `agent ${summary.descriptorCount} 个，surface ${summary.activeSurfaceCount} 个，fallback ${summary.fallbackSelectionCount} 个，降级 ${summary.degradedCount} 个，阻断 ${summary.blockedCount} 个，gap ${summary.capabilityGapCount} 个，session=${summary.sessionStatus}`,
    );
  }

  /**
   * Builds concise role-level highlight lines for fallback/capability-gap attention surfaces.
   * @param agentView Shared execution/report agentView payload.
   * @param locale Active locale identifier.
   * @param maxRows Maximum number of role highlights to return before truncation marker.
   * @returns Ordered highlight lines ready for presenter surfaces.
   */
  public buildHighlightLines(
    agentView: NonNullable<ExecutionReportAgentView | null | undefined>,
    locale: string,
    maxRows = 3,
  ): string[] {
    const rows = this.buildRows(agentView).filter(
      (row) =>
        row.selectedBy === 'fallback' ||
        row.projectionStatus === 'warn' ||
        row.projectionStatus === 'fail' ||
        row.capabilityGapSummary !== 'none' ||
        row.failureSummary !== 'none',
    );

    const visibleRows = rows
      .slice(0, Math.max(0, maxRows))
      .map((row) => this.renderHighlightRow(row, locale));
    if (rows.length > visibleRows.length) {
      visibleRows.push(
        this.localizeText(
          locale,
          `${rows.length - visibleRows.length} more roles are available in the full agentView artifact.`,
          `其余 ${rows.length - visibleRows.length} 个角色请查看完整 agentView 产物。`,
        ),
      );
    }

    return visibleRows;
  }

  private buildCapabilityGapSummary(
    descriptor: ExecutionReportAgentView['descriptors'][number],
  ): string {
    if (descriptor.unsupportedCapabilities.length > 0) {
      return `unsupported:${descriptor.unsupportedCapabilities.join('|')}`;
    }

    if (descriptor.degradedCapabilities.length > 0) {
      return `degraded:${descriptor.degradedCapabilities.join('|')}`;
    }

    return 'none';
  }

  private renderHighlightRow(row: AgentProjectionRow, locale: string): string {
    return this.localizeText(
      locale,
      `${row.agentRole}: surface=${row.selectedSurface} selected_by=${row.selectedBy} status=${row.projectionStatus} gap=${row.capabilityGapSummary} reasons=${row.failureSummary}`,
      `${row.agentRole}：surface=${row.selectedSurface} selected_by=${row.selectedBy} status=${row.projectionStatus} gap=${row.capabilityGapSummary} reasons=${row.failureSummary}`,
    );
  }

  private localizeText(locale: string, english: string, chinese: string): string {
    return locale.toLowerCase() === 'zh-cn' ? chinese : english;
  }
}
