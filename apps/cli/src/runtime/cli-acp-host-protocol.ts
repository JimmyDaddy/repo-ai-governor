import {
  type AgentAvailabilityStatus,
  type AgentCancelRequest,
  type AgentCancelResult,
  AgentCapability,
  AgentCapabilitySupportLevel,
  type AgentConfirmationRequest,
  type AgentConfirmationResult,
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
} from '@repo-ai-governor/shared';
import { CliAcpCapabilityDiscoveryRuntime } from './cli-acp-capability-discovery-runtime.js';
import { CliAcpHostEvidenceRuntime } from './cli-acp-host-evidence-runtime.js';
import { CliAcpHostOperationRuntime } from './cli-acp-host-operation-runtime.js';
import { CliAcpPromptTurnRuntime } from './cli-acp-prompt-turn-runtime.js';
import { CliAcpSessionRuntime } from './cli-acp-session-runtime.js';
import { CliAcpTransportClientRuntime } from './cli-acp-transport-client-runtime.js';

const CLI_ACP_HOST_ROLE = 'coder';
const CLI_ACP_HOST_ROLE_PROFILE_ID = 'coder-default';
const CLI_ACP_HOST_ROLE_SOURCE = 'default';
const DEFAULT_LOCALIZE_TEXT = (english: string): string => english;
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
  private readonly capabilityDiscoveryRuntime: CliAcpCapabilityDiscoveryRuntime;
  private readonly promptTurnRuntime: CliAcpPromptTurnRuntime;
  private readonly hostOperationRuntime: CliAcpHostOperationRuntime;

  public constructor(private readonly options: CliAcpHostProtocolOptions) {
    super();
    this.localizeText = options.localizeText ?? DEFAULT_LOCALIZE_TEXT;
    this.evidenceRuntime = options.acpHostEvidenceSearchRoot
      ? new CliAcpHostEvidenceRuntime(options.acpHostEvidenceSearchRoot)
      : null;
    const transportClientRuntime = new CliAcpTransportClientRuntime();
    const sessionRuntime = new CliAcpSessionRuntime();
    this.capabilityDiscoveryRuntime = new CliAcpCapabilityDiscoveryRuntime(this.evidenceRuntime);
    this.promptTurnRuntime = new CliAcpPromptTurnRuntime({
      surfaceId: this.options.surfaceId,
      localizeText: this.localizeText,
      sessionRuntime,
      transportClientRuntime,
    });
    this.hostOperationRuntime = new CliAcpHostOperationRuntime({
      surfaceId: this.options.surfaceId,
      localizeText: this.localizeText,
      transportClientRuntime,
    });
  }

  public async probe(request: AgentProbeRequest): Promise<AgentProbeResult> {
    const availabilityResolution = this.capabilityDiscoveryRuntime.resolveProbeAvailability({
      surfaceId: this.options.surfaceId,
      availabilityStatus: this.options.availabilityStatus,
      unavailableReasons: this.options.unavailableReasons,
    });

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

  public async invokeStage(request: AgentInvokeStageRequest): Promise<AgentInvokeStageResult> {
    return await this.promptTurnRuntime.invokeStage(request);
  }

  public async *streamEvents(request: AgentStreamEventsRequest): AsyncIterable<AgentStreamEvent> {
    yield* this.promptTurnRuntime.streamEvents(request);
  }

  public async requestConfirmation(
    request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    return await this.hostOperationRuntime.requestConfirmation(request);
  }

  public async cancel(request: AgentCancelRequest): Promise<AgentCancelResult> {
    return await this.hostOperationRuntime.cancel(request);
  }
}
