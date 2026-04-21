import {
  AgentAvailabilityStatus,
  type AgentHealthCheckDiagnostic,
} from '@repo-ai-governor/adapter-sdk';
import type { AdapterSurface } from '@repo-ai-governor/shared';
import {
  CLI_ACP_HOST_COMPANION_STATE_SUMMARY,
  CLI_ACP_HOST_HEALTH_CHECK_FAILURE_DETAIL,
  CliAcpHostDiagnosticCode,
  CliAcpHostDistributionBoundary,
  CliAcpHostReadinessStatus,
} from '../constants/cli-acp-host.constant.js';
import type { CliAcpHostAvailabilityResolution } from '../types/index.js';
import type { CliAcpHostEvidenceRuntime } from './cli-acp-host-evidence-runtime.js';

/**
 * Owns ACP capability/readiness discovery without coupling probe semantics to invoke ownership.
 */
export class CliAcpCapabilityDiscoveryRuntime {
  public constructor(private readonly evidenceRuntime: CliAcpHostEvidenceRuntime | null) {}

  /**
   * Resolves the current ACP host-facing probe posture while execution remains fail-closed.
   * @param options Surface-local readiness inputs.
   * @returns Availability resolution consumed by CliAcpHostProtocol.probe().
   */
  public resolveProbeAvailability(options: {
    surfaceId: AdapterSurface;
    availabilityStatus?: AgentAvailabilityStatus;
    unavailableReasons?: readonly string[];
  }): CliAcpHostAvailabilityResolution {
    const configuredUnavailableReasons = [...(options.unavailableReasons ?? [])].filter(
      (reason, index, list) => reason.length > 0 && list.indexOf(reason) === index,
    );
    if (configuredUnavailableReasons.length > 0) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        diagnostics: [],
        unavailableReasons: configuredUnavailableReasons,
      };
    }

    if (options.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        diagnostics: [],
        unavailableReasons: [`surface_unavailable:${options.surfaceId}:configured_unavailable`],
      };
    }

    return {
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      diagnostics: this.createAcpHostDiagnostics(options.surfaceId),
      unavailableReasons: [
        `health_check_failed:${options.surfaceId}:${CLI_ACP_HOST_HEALTH_CHECK_FAILURE_DETAIL}`,
      ],
    };
  }

  private createAcpHostDiagnostics(surfaceId: AdapterSurface): AgentHealthCheckDiagnostic[] {
    const evidence = this.evidenceRuntime?.resolveEvidence(surfaceId);
    return [
      {
        layer: 'protocol',
        status: 'fail',
        code: 'protocol.health_check_failed',
        detail: CLI_ACP_HOST_HEALTH_CHECK_FAILURE_DETAIL,
      },
      {
        layer: 'protocol',
        status: 'warn',
        code: CliAcpHostDiagnosticCode.HOST_READINESS_STATUS,
        detail: evidence?.hostReadinessStatus ?? CliAcpHostReadinessStatus.BASELINE_ONLY,
      },
      {
        layer: 'protocol',
        status: 'warn',
        code: CliAcpHostDiagnosticCode.DISTRIBUTION_BOUNDARY,
        detail:
          evidence?.distributionBoundary ??
          CliAcpHostDistributionBoundary.PACKAGED_DISTRIBUTION_PENDING,
      },
      {
        layer: 'protocol',
        status: 'warn',
        code: CliAcpHostDiagnosticCode.COMPANION_STATE_SUMMARY,
        detail: evidence?.companionStateSummary ?? CLI_ACP_HOST_COMPANION_STATE_SUMMARY,
      },
    ];
  }
}
