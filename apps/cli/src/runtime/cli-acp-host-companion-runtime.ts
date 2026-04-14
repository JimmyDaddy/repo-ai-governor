import type { AgentLayeredHealthCheckResult } from '@repo-ai-governor/adapter-sdk';
import { AdapterTransportKind } from '@repo-ai-governor/shared';
import {
  CLI_ACP_HOST_COMPANION_STATE_SUMMARY,
  CliAcpHostDiagnosticCode,
  CliAcpHostDistributionBoundary,
  CliAcpHostReadinessStatus,
} from '../constants/cli-acp-host.constant.js';

export interface CliAcpHostCompanionPayload {
  hostReadinessStatus: string;
  distributionBoundary: string;
  companionStateSummary: string;
}

/**
 * Resolves presenter-safe ACP host companion payloads from transport-scoped health diagnostics.
 */
export class CliAcpHostCompanionRuntime {
  public createCompanionPayload(options: {
    transportKind: string | null | undefined;
    healthCheck?: AgentLayeredHealthCheckResult | null;
  }): CliAcpHostCompanionPayload | null {
    if (options.transportKind !== AdapterTransportKind.ACP_EXEC) {
      return null;
    }

    return {
      hostReadinessStatus:
        this.findHealthCheckDiagnosticDetail(
          options.healthCheck,
          CliAcpHostDiagnosticCode.HOST_READINESS_STATUS,
        ) ?? CliAcpHostReadinessStatus.BASELINE_ONLY,
      distributionBoundary:
        this.findHealthCheckDiagnosticDetail(
          options.healthCheck,
          CliAcpHostDiagnosticCode.DISTRIBUTION_BOUNDARY,
        ) ?? CliAcpHostDistributionBoundary.PACKAGED_DISTRIBUTION_PENDING,
      companionStateSummary:
        this.findHealthCheckDiagnosticDetail(
          options.healthCheck,
          CliAcpHostDiagnosticCode.COMPANION_STATE_SUMMARY,
        ) ?? CLI_ACP_HOST_COMPANION_STATE_SUMMARY,
    };
  }

  private findHealthCheckDiagnosticDetail(
    healthCheck: AgentLayeredHealthCheckResult | null | undefined,
    code: CliAcpHostDiagnosticCode,
  ): string | null {
    const diagnostic = healthCheck?.diagnostics.find((candidate) => candidate.code === code);
    return typeof diagnostic?.detail === 'string' && diagnostic.detail.length > 0
      ? diagnostic.detail
      : null;
  }
}
