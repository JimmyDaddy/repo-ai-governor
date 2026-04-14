import {
  AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY,
  type AgentStageContinuationHandleKind,
  AgentStageContinuationMode,
  type AgentStageContinuationRequest,
  type AgentStageContinuationResult,
  AgentStageContinuationStatus,
  AgentStageContinuationTransportKind,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
  type ProviderContinuationHandle,
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig } from '@repo-ai-governor/config';
import type {
  SessionProviderContinuationHandle,
  SessionProviderContinuationMutation,
  SessionProviderContinuationSessionState,
  SessionProviderContinuationSlot,
  SessionProviderContinuationSummary,
} from '@repo-ai-governor/core-orchestration-service';
import { AdapterSurface, AdapterTransportKind } from '@repo-ai-governor/shared';
import { SessionMainProviderContinuationPolicyEnvelope } from '../constants/session-main-provider-continuation.constant.js';

const SESSION_MAIN_PROVIDER_CONTINUATION_LANE_LABEL = 'session.main';
const SESSION_MAIN_PROVIDER_CONTINUATION_UNSUPPORTED_CLEAR_REASON = 'adapter_reported_unsupported';
const SESSION_MAIN_PROVIDER_CONTINUATION_INVALID_CLEAR_REASON = 'provider_handle_invalid';
const SESSION_MAIN_PROVIDER_CONTINUATION_TRANSPORT_UNSUPPORTED_CLEAR_REASON =
  'transport_not_continuation_capable';

interface SessionMainProviderContinuationLane {
  laneKey: string;
  laneLabel: string;
  routeId: string;
  stageId: string;
  roleId: string | null;
  selectedSurface: string;
  providerId: string;
  transportKind: AgentStageContinuationTransportKind;
  model: string | null;
  policyEnvelope: string;
}

interface PreparedProviderContinuationRequest {
  lane: SessionMainProviderContinuationLane;
  request?: AgentStageContinuationRequest;
  existingSlot?: SessionProviderContinuationSlot;
  preDispatchMutation?: SessionProviderContinuationMutation;
  suppressStreamRelay: boolean;
}

/**
 * Owns session.main lane-key derivation and presenter-safe continuation mutation projection.
 *
 * Why this exists:
 * the CLI runtime needs one dedicated seam for provider continuation request/slot logic so raw
 * handles stay out of prompt metadata while direct-answer and role-delegate flows share rules.
 */
export class SessionMainProviderContinuationRuntime {
  public constructor(
    private readonly options: {
      workspaceRoot: string;
      currentWorkingDirectory: string;
    },
  ) {}

  /**
   * Resolves one policy envelope for the current stage input without leaking raw handles.
   * @param input Stage input passed to the adapter.
   * @param roleId Optional role id for delegated role stages.
   * @returns Policy envelope used for lane isolation.
   */
  public resolvePolicyEnvelopeFromInput(
    input: Record<string, unknown>,
    roleId: string | null,
  ): SessionMainProviderContinuationPolicyEnvelope {
    if (
      typeof input.reviewScope === 'string' ||
      (typeof roleId === 'string' && roleId.trim().length > 0 && roleId === 'reviewer')
    ) {
      return SessionMainProviderContinuationPolicyEnvelope.READ_ONLY;
    }

    const executionPolicy = this.readRecord(input[AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY]);
    if (
      executionPolicy?.interactionMode === AgentStageExecutionMode.CHAT_ONLY &&
      executionPolicy.toolUsePolicy === AgentStageToolUsePolicy.FORBIDDEN
    ) {
      return SessionMainProviderContinuationPolicyEnvelope.CHAT_ONLY;
    }

    return SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE;
  }

  /**
   * Builds one continuation request for a resolved lane when the selected surface supports it.
   * @param options Lane and session inputs for the upcoming adapter invocation.
   * @returns Prepared request metadata, a pre-dispatch invalidation payload, or `null` when the
   * surface neither supports continuation nor needs slot cleanup.
   */
  public prepareRequest(options: {
    sessionId: string;
    routeId: string;
    stageId: string;
    roleId: string | null;
    selectedSurface: AdapterSurface;
    toolConfig?: NonNullable<AdaptersConfig['tools']>[number];
    providerContinuationState?: SessionProviderContinuationSessionState;
    policyEnvelope: SessionMainProviderContinuationPolicyEnvelope;
  }): PreparedProviderContinuationRequest | null {
    const laneKey = this.createLaneKey({
      routeId: options.routeId,
      stageId: options.stageId,
      roleId: options.roleId,
      selectedSurface: options.selectedSurface,
      policyEnvelope: options.policyEnvelope,
    });
    const existingSlot = options.providerContinuationState?.slots[laneKey];
    const transportKind = this.resolveTransportKind(options.selectedSurface, options.toolConfig);
    if (!transportKind) {
      if (!existingSlot) {
        return null;
      }
      const lane = this.createLaneFromExistingSlot(existingSlot);
      return {
        lane,
        existingSlot,
        preDispatchMutation: this.createClearMutation(
          lane,
          SESSION_MAIN_PROVIDER_CONTINUATION_TRANSPORT_UNSUPPORTED_CLEAR_REASON,
          AgentStageContinuationStatus.UNSUPPORTED,
        ),
        suppressStreamRelay: false,
      };
    }

    const lane = this.createLane({
      routeId: options.routeId,
      stageId: options.stageId,
      roleId: options.roleId,
      selectedSurface: options.selectedSurface,
      transportKind,
      toolConfig: options.toolConfig,
      policyEnvelope: options.policyEnvelope,
    });
    const preDispatchInvalidationReason = existingSlot
      ? this.resolvePreDispatchInvalidationReason(existingSlot, lane)
      : null;
    const preDispatchMutation =
      existingSlot && preDispatchInvalidationReason
        ? this.createClearMutation(
            lane,
            preDispatchInvalidationReason,
            AgentStageContinuationStatus.CLEARED,
          )
        : undefined;
    const handle =
      existingSlot && !preDispatchInvalidationReason
        ? this.cloneAdapterHandle(existingSlot.handle)
        : null;

    return {
      lane,
      request: {
        mode: AgentStageContinuationMode.PREFER_REUSE,
        sessionId: options.sessionId,
        laneKey: lane.laneKey,
        ...(handle ? { handle } : {}),
      },
      ...(existingSlot ? { existingSlot } : {}),
      ...(preDispatchMutation ? { preDispatchMutation } : {}),
      suppressStreamRelay:
        transportKind === AgentStageContinuationTransportKind.REMOTE_API && Boolean(handle),
    };
  }

  /**
   * Resolves shared-session mutations from one adapter invoke result continuation payload.
   * @param prepared Prepared request metadata for the lane.
   * @param continuation Adapter continuation result payload.
   * @returns Session-owned mutations to persist after the turn completes.
   */
  public resolveMutations(
    prepared: PreparedProviderContinuationRequest | null,
    continuation: AgentStageContinuationResult | undefined,
  ): SessionProviderContinuationMutation[] {
    if (!prepared) {
      return [];
    }

    const mutations = prepared.preDispatchMutation ? [prepared.preDispatchMutation] : [];
    if (!continuation) {
      return mutations;
    }

    if (
      continuation.status === AgentStageContinuationStatus.CREATED ||
      continuation.status === AgentStageContinuationStatus.REUSED ||
      continuation.status === AgentStageContinuationStatus.REFRESHED
    ) {
      if (!continuation.handle) {
        return mutations;
      }
      mutations.push({
        laneKey: prepared.lane.laneKey,
        slot: this.createSlot(prepared.lane, continuation.handle),
        summary: this.createSummary(
          prepared.lane,
          continuation.status,
          continuation.invalidationReason,
        ),
      });
      return mutations;
    }

    if (
      continuation.status === AgentStageContinuationStatus.CLEARED ||
      continuation.status === AgentStageContinuationStatus.INVALID
    ) {
      mutations.push(
        this.createClearMutation(
          prepared.lane,
          continuation.invalidationReason ??
            (continuation.status === AgentStageContinuationStatus.INVALID
              ? SESSION_MAIN_PROVIDER_CONTINUATION_INVALID_CLEAR_REASON
              : undefined),
          continuation.status,
        ),
      );
      return mutations;
    }

    if (continuation.status === AgentStageContinuationStatus.UNSUPPORTED) {
      mutations.push(
        this.createClearMutation(
          prepared.lane,
          continuation.invalidationReason ??
            (prepared.existingSlot && !prepared.preDispatchMutation
              ? SESSION_MAIN_PROVIDER_CONTINUATION_UNSUPPORTED_CLEAR_REASON
              : undefined),
          AgentStageContinuationStatus.UNSUPPORTED,
        ),
      );
      return mutations;
    }

    return mutations;
  }

  private createLane(options: {
    routeId: string;
    stageId: string;
    roleId: string | null;
    selectedSurface: AdapterSurface;
    transportKind: AgentStageContinuationTransportKind;
    toolConfig?: NonNullable<AdaptersConfig['tools']>[number];
    policyEnvelope: SessionMainProviderContinuationPolicyEnvelope;
  }): SessionMainProviderContinuationLane {
    const laneLabel = this.resolveLaneLabel(options.roleId);
    const providerId =
      options.transportKind === AgentStageContinuationTransportKind.REMOTE_API
        ? (options.toolConfig?.remoteApi?.provider ?? options.selectedSurface)
        : options.selectedSurface;
    const model =
      options.transportKind === AgentStageContinuationTransportKind.REMOTE_API
        ? (options.toolConfig?.remoteApi?.model ?? null)
        : null;

    return {
      laneKey: this.createLaneKey({
        routeId: options.routeId,
        stageId: options.stageId,
        roleId: options.roleId,
        selectedSurface: options.selectedSurface,
        policyEnvelope: options.policyEnvelope,
      }),
      laneLabel,
      routeId: options.routeId,
      stageId: options.stageId,
      roleId: options.roleId,
      selectedSurface: options.selectedSurface,
      providerId,
      transportKind: options.transportKind,
      model,
      policyEnvelope: options.policyEnvelope,
    };
  }

  private createLaneFromExistingSlot(
    existingSlot: SessionProviderContinuationSlot,
  ): SessionMainProviderContinuationLane {
    return {
      laneKey: existingSlot.laneKey,
      laneLabel: this.resolveLaneLabel(existingSlot.roleId),
      routeId: existingSlot.routeId,
      stageId: existingSlot.stageId,
      roleId: existingSlot.roleId,
      selectedSurface: existingSlot.selectedSurface,
      providerId: existingSlot.providerId,
      transportKind: existingSlot.transportKind as AgentStageContinuationTransportKind,
      model: existingSlot.model,
      policyEnvelope: existingSlot.policyEnvelope,
    };
  }

  private createLaneKey(options: {
    routeId: string;
    stageId: string;
    roleId: string | null;
    selectedSurface: AdapterSurface;
    policyEnvelope: SessionMainProviderContinuationPolicyEnvelope;
  }): string {
    return [
      options.routeId,
      options.stageId,
      this.resolveLaneLabel(options.roleId),
      options.selectedSurface,
      options.policyEnvelope,
    ].join('::');
  }

  private resolveLaneLabel(roleId: string | null): string {
    return typeof roleId === 'string' && roleId.trim().length > 0
      ? roleId
      : SESSION_MAIN_PROVIDER_CONTINUATION_LANE_LABEL;
  }

  private resolveTransportKind(
    surface: AdapterSurface,
    toolConfig?: NonNullable<AdaptersConfig['tools']>[number],
  ): AgentStageContinuationTransportKind | null {
    if (
      toolConfig?.transport === AdapterTransportKind.BASELINE ||
      toolConfig?.transport === AdapterTransportKind.ACP_EXEC ||
      surface === AdapterSurface.OLLAMA
    ) {
      return null;
    }
    if (toolConfig?.transport === AdapterTransportKind.REMOTE_API) {
      return AgentStageContinuationTransportKind.REMOTE_API;
    }
    if (toolConfig?.transport === AdapterTransportKind.CLI_EXEC) {
      return AgentStageContinuationTransportKind.CLI_EXEC;
    }
    if (toolConfig?.remoteApi) {
      return AgentStageContinuationTransportKind.REMOTE_API;
    }
    return AgentStageContinuationTransportKind.CLI_EXEC;
  }

  private resolvePreDispatchInvalidationReason(
    existingSlot: SessionProviderContinuationSlot,
    lane: SessionMainProviderContinuationLane,
  ): string | null {
    if (existingSlot.routeId !== lane.routeId) {
      return 'route_changed';
    }
    if (existingSlot.stageId !== lane.stageId) {
      return 'stage_changed';
    }
    if ((existingSlot.roleId ?? null) !== lane.roleId) {
      return 'role_changed';
    }
    if (existingSlot.selectedSurface !== lane.selectedSurface) {
      return 'surface_changed';
    }
    if (existingSlot.providerId !== lane.providerId) {
      return 'provider_changed';
    }
    if (existingSlot.transportKind !== lane.transportKind) {
      return 'transport_changed';
    }
    if ((existingSlot.model ?? null) !== lane.model) {
      return 'model_changed';
    }
    if (existingSlot.policyEnvelope !== lane.policyEnvelope) {
      return 'policy_envelope_changed';
    }
    if (existingSlot.workspaceRoot !== this.options.workspaceRoot) {
      return 'workspace_root_changed';
    }
    if (existingSlot.currentWorkingDirectory !== this.options.currentWorkingDirectory) {
      return 'current_working_directory_changed';
    }
    return null;
  }

  private createSlot(
    lane: SessionMainProviderContinuationLane,
    handle: ProviderContinuationHandle,
  ): SessionProviderContinuationSlot {
    return {
      laneKey: lane.laneKey,
      routeId: lane.routeId,
      stageId: lane.stageId,
      roleId: lane.roleId,
      selectedSurface: lane.selectedSurface,
      providerId: lane.providerId,
      transportKind: lane.transportKind,
      model: lane.model,
      policyEnvelope: lane.policyEnvelope,
      workspaceRoot: this.options.workspaceRoot,
      currentWorkingDirectory: this.options.currentWorkingDirectory,
      handle: this.cloneSessionHandle(handle),
      updatedAt: handle.acquiredAt,
    };
  }

  private createSummary(
    lane: SessionMainProviderContinuationLane,
    status: AgentStageContinuationStatus,
    invalidationReason?: string,
  ): SessionProviderContinuationSummary {
    return {
      laneKey: lane.laneKey,
      laneLabel: lane.laneLabel,
      status,
      surface: lane.selectedSurface,
      providerId: lane.providerId,
      transportKind: lane.transportKind,
      model: lane.model,
      stageId: lane.stageId,
      roleId: lane.roleId,
      policyEnvelope: lane.policyEnvelope,
      ...(invalidationReason ? { invalidationReason } : {}),
    };
  }

  private createClearMutation(
    lane: SessionMainProviderContinuationLane,
    invalidationReason: string | undefined,
    status: AgentStageContinuationStatus,
  ): SessionProviderContinuationMutation {
    return {
      laneKey: lane.laneKey,
      summary: this.createSummary(lane, status, invalidationReason),
    };
  }

  private cloneSessionHandle(
    handle: ProviderContinuationHandle,
  ): SessionProviderContinuationHandle {
    return {
      providerId: handle.providerId,
      surface: handle.surface,
      transportKind: handle.transportKind,
      handleKind: handle.handleKind,
      value: handle.value,
      model: handle.model ?? null,
      acquiredAt: handle.acquiredAt,
      ...(handle.metadata ? { metadata: { ...handle.metadata } } : {}),
    };
  }

  private cloneAdapterHandle(
    handle: SessionProviderContinuationHandle,
  ): ProviderContinuationHandle {
    return {
      providerId: handle.providerId,
      surface: handle.surface,
      transportKind: handle.transportKind as AgentStageContinuationTransportKind,
      handleKind: handle.handleKind as AgentStageContinuationHandleKind,
      value: handle.value,
      model: handle.model ?? null,
      acquiredAt: handle.acquiredAt,
      ...(handle.metadata ? { metadata: { ...handle.metadata } } : {}),
    };
  }

  private readRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  }
}
