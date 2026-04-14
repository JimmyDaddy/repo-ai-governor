import {
  AgentAvailabilityStatus,
  type AgentCancelRequest,
  type AgentCancelResult,
  AgentCancellationReason,
  AgentCancellationScope,
  AgentCapability,
  AgentCapabilitySupportLevel,
  type AgentConfirmationRequest,
  type AgentConfirmationResult,
  type AgentHealthCheckDiagnostic,
  type AgentInvokeStageRequest,
  type AgentInvokeStageResult,
  type AgentProbeRequest,
  type AgentProbeResult,
  AgentProtocol,
  type AgentStreamEvent,
  type AgentStreamEventsRequest,
  buildLayeredHealthCheckResult,
} from '@repo-ai-governor/adapter-sdk';
import {
  AdapterRequestCancellationMode,
  type AdapterSurface,
  AdapterTransportKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  CLI_ACP_HOST_COMPANION_STATE_SUMMARY,
  CLI_ACP_HOST_HEALTH_CHECK_FAILURE_DETAIL,
  CliAcpHostDiagnosticCode,
  CliAcpHostDistributionBoundary,
  CliAcpHostReadinessStatus,
} from '../constants/cli-acp-host.constant.js';
import { CliAcpHostEvidenceRuntime } from './cli-acp-host-evidence-runtime.js';

const CLI_ACP_HOST_ROLE = 'coder';
const CLI_ACP_HOST_ROLE_PROFILE_ID = 'coder-default';
const CLI_ACP_HOST_ROLE_SOURCE = 'default';
const DEFAULT_LOCALIZE_TEXT = (english: string): string => english;
const CLI_ACP_HOST_ACTION_LABELS = {
  invoke: {
    english: 'invoke',
    chinese: '调用',
  },
  stream: {
    english: 'stream',
    chinese: '流式输出',
  },
  confirm: {
    english: 'confirm',
    chinese: '确认',
  },
} as const;

const CLI_ACP_HOST_CAPABILITY_SUPPORT: Record<AgentCapability, AgentCapabilitySupportLevel> = {
  [AgentCapability.TOOL_CALLING]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STRUCTURED_OUTPUT]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.PARALLEL_TASK]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.STREAMING]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.CONFIRMATION_GATE]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.CANCELLATION]: AgentCapabilitySupportLevel.UNSUPPORTED,
  [AgentCapability.AGENT_TIMEOUT]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.STAGE_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.SUPPORTED,
  [AgentCapability.FLOW_TIMEOUT_SIGNAL]: AgentCapabilitySupportLevel.DEGRADED,
  [AgentCapability.CONTEXT_WINDOW]: AgentCapabilitySupportLevel.SUPPORTED,
};

interface CliAcpHostProtocolOptions {
  surfaceId: AdapterSurface;
  availabilityStatus?: AgentAvailabilityStatus;
  localizeText?: (english: string, chinese: string) => string;
  unavailableReasons?: string[];
  acpHostEvidenceSearchRoot?: string | null;
}

/**
 * Provides a CLI-local ACP transport baseline that keeps ACP truth explicit and fail-closed until
 * host distribution and runtime-service rollout windows are completed.
 */
export class CliAcpHostProtocol extends AgentProtocol {
  private readonly localizeText: (english: string, chinese: string) => string;
  private readonly evidenceRuntime: CliAcpHostEvidenceRuntime | null;

  public constructor(private readonly options: CliAcpHostProtocolOptions) {
    super();
    this.localizeText = options.localizeText ?? DEFAULT_LOCALIZE_TEXT;
    this.evidenceRuntime = options.acpHostEvidenceSearchRoot
      ? new CliAcpHostEvidenceRuntime(options.acpHostEvidenceSearchRoot)
      : null;
  }

  public async probe(request: AgentProbeRequest): Promise<AgentProbeResult> {
    const availabilityResolution = this.resolveProbeAvailabilityResolution();

    return {
      identity: {
        agentId: `${this.options.surfaceId}-acp-host-agent`,
        role: CLI_ACP_HOST_ROLE,
        surface: this.options.surfaceId,
        roleProfileId: CLI_ACP_HOST_ROLE_PROFILE_ID,
        roleSource: CLI_ACP_HOST_ROLE_SOURCE,
      },
      availabilityStatus: availabilityResolution.availabilityStatus,
      capabilityMatrix: {
        capabilityStates: Object.values(AgentCapability).map((capability) => ({
          capability,
          supportLevel: CLI_ACP_HOST_CAPABILITY_SUPPORT[capability],
        })),
        timeout: {
          supportsAgentInvocationTimeout: true,
          supportsStageTimeoutSignal: true,
          supportsFlowTimeoutSignal: false,
        },
        cancellation: {
          supportsCancel: false,
          supportsReasonPropagation: false,
          supportsAbortSignal: false,
        },
        contextWindow: {
          supportsAutoTruncation: true,
        },
      },
      unavailableReasons: availabilityResolution.unavailableReasons,
      healthCheck: buildLayeredHealthCheckResult({
        adapterId: `${this.options.surfaceId}-acp-host-protocol`,
        surfaceId: this.options.surfaceId,
        availabilityStatus: availabilityResolution.availabilityStatus,
        selectedEntrypoint: this.options.surfaceId,
        routeKey: request.routeKey,
        routeRequirements: [...(request.requiredCapabilities ?? [])].map(String),
        fallbackAllowed: true,
        unavailableReasons: availabilityResolution.unavailableReasons,
        diagnostics: availabilityResolution.diagnostics,
        transportKind: AdapterTransportKind.ACP_EXEC,
        requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      }),
    };
  }

  public async invokeStage(_request: AgentInvokeStageRequest): Promise<AgentInvokeStageResult> {
    throw this.createUnavailableError('invoke');
  }

  public async *streamEvents(_request: AgentStreamEventsRequest): AsyncIterable<AgentStreamEvent> {
    yield* [];
    throw this.createUnavailableError('stream');
  }

  public async requestConfirmation(
    _request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    throw this.createUnavailableError('confirm');
  }

  public async cancel(request: AgentCancelRequest): Promise<AgentCancelResult> {
    return {
      acknowledged: false,
      scope: request.scope ?? AgentCancellationScope.AGENT,
      reason: request.reason ?? AgentCancellationReason.SYSTEM_GUARD,
      cancelledAt: new Date().toISOString(),
    };
  }

  private createAcpHostDiagnostics(): AgentHealthCheckDiagnostic[] {
    const evidence = this.evidenceRuntime?.resolveEvidence(this.options.surfaceId);
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

  private resolveProbeAvailabilityResolution(): {
    availabilityStatus: AgentAvailabilityStatus;
    diagnostics: AgentHealthCheckDiagnostic[];
    unavailableReasons: string[];
  } {
    const configuredUnavailableReasons = [...(this.options.unavailableReasons ?? [])].filter(
      (reason, index, list) => reason.length > 0 && list.indexOf(reason) === index,
    );
    if (configuredUnavailableReasons.length > 0) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        diagnostics: [],
        unavailableReasons: configuredUnavailableReasons,
      };
    }

    if (this.options.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        diagnostics: [],
        unavailableReasons: [
          `surface_unavailable:${this.options.surfaceId}:configured_unavailable`,
        ],
      };
    }

    return {
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      diagnostics: this.createAcpHostDiagnostics(),
      unavailableReasons: [
        `health_check_failed:${this.options.surfaceId}:${CLI_ACP_HOST_HEALTH_CHECK_FAILURE_DETAIL}`,
      ],
    };
  }

  private createUnavailableError(action: 'invoke' | 'stream' | 'confirm'): RuntimeError {
    const actionLabels = CLI_ACP_HOST_ACTION_LABELS[action];
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
      this.localizeText(
        `ACP host-facing transport is not ready for ${this.options.surfaceId}; ${actionLabels.english} is fail-closed until rollout enablement completes.`,
        `ACP host-facing transport 尚未为 ${this.options.surfaceId} 就绪；在 rollout enablement 完成前，${actionLabels.chinese} 将保持 fail-closed。`,
      ),
      {
        surfaceId: this.options.surfaceId,
        transportKind: AdapterTransportKind.ACP_EXEC,
        action,
      },
    );
  }
}
