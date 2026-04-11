import {
  AgentAvailabilityStatus,
  AgentCapabilitySupportLevel,
  type AgentProbeResult,
  buildLayeredHealthCheckResult,
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig } from '@repo-ai-governor/config';
import {
  AdapterAvailability,
  AdapterCredentialSource,
  AdapterSurface,
  AdapterTransportKind,
  GovernorErrorCode,
  RuntimeError,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  CLI_ADAPTER_FAILURE_ATTRIBUTION,
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import type {
  CliAdapterCredentialReferenceDiagnostic,
  CliAdapterSecretBackendDiagnostics,
  CliAdapterToolProbeSnapshot,
  CliAdapterVerificationResolution,
} from '../types/index.js';
import type { CliAdapterRoutingRuntime } from './adapter-routing-runtime.js';
import type { CliLocalModelProbeRuntime } from './local-model-probe-runtime.js';
import { CliSecretService } from './secrets/cli-secret-service.js';

/**
 * Aggregates adapter probe snapshots into role-level verification and next-action diagnostics.
 */
export class CliAdapterVerificationRuntime {
  private readonly secretService: CliSecretService;
  private readonly environment: NodeJS.ProcessEnv;

  public constructor(
    private readonly adaptersConfig: AdaptersConfig,
    private readonly translate: (key: string, interpolation?: Record<string, string>) => string,
    private readonly formatExecFailureDetail: (error: unknown) => string,
    private readonly adapterRoutingRuntime: CliAdapterRoutingRuntime,
    private readonly localModelProbeRuntime: CliLocalModelProbeRuntime,
    secretService = new CliSecretService(),
    private readonly localizeText: (english: string, chinese: string) => string = (english) =>
      english,
    environment: NodeJS.ProcessEnv = process.env,
  ) {
    this.secretService = secretService;
    this.secretService.setLocalizeText(this.localizeText);
    this.environment = environment;
  }

  /**
   * Resolves adapters/routing verification summary used by connect/doctor and internal readiness
   * gates.
   * @returns Adapter verification resolution.
   */
  public async resolveAdapterVerification(
    abortSignal?: AbortSignal,
  ): Promise<CliAdapterVerificationResolution> {
    const toolConfigBySurface = this.adapterRoutingRuntime.createToolConfigBySurfaceMap();
    const toolSnapshots = await this.collectAdapterToolSnapshotsBySurface(
      toolConfigBySurface,
      abortSignal,
    );
    const secretBackends = await this.resolveSecretBackendDiagnostics();
    const credentialReferences = await this.collectCredentialReferenceDiagnostics(toolSnapshots);
    const toolSnapshotBySurface = new Map<AdapterSurface, CliAdapterToolProbeSnapshot>(
      toolSnapshots.map((snapshot) => [snapshot.toolId, snapshot]),
    );
    const routingByRole = this.adaptersConfig.routing.roleBindings;
    const fallbackPrimarySurface = this.adaptersConfig.tools?.[0]?.toolId ?? AdapterSurface.CODEX;
    const roleEvaluations = this.adaptersConfig.roles.map<
      CliAdapterVerificationResolution['roleEvaluations'][number]
    >((role) => {
      const roleBinding = routingByRole[role.roleId];
      if (!roleBinding) {
        const unavailableReasons = [`missing_role_binding:${role.roleId}`];
        return {
          roleId: role.roleId,
          roleProfileId: role.roleProfileId,
          required: role.required,
          primarySurface: fallbackPrimarySurface,
          selectedSurface: null,
          selectedBy: CliAdapterRoleSelectionSource.NONE,
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          unavailableReasons,
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: role.roleId,
            surfaceId: fallbackPrimarySurface,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: fallbackPrimarySurface,
            routeKey: `cli.adapter.role.${role.roleId}`,
            routeRequirements: role.requiredCapabilities.map(String),
            fallbackAllowed: false,
            unavailableReasons,
            transportKind: null,
            providerKind: null,
            vendorBindingKind: null,
            model: null,
            credentialSource: null,
            endpointSource: null,
          }),
          failureAttributions: this.resolveFailureAttributions({
            unavailableReasons,
          }),
          status: role.required ? CliGovernanceCheckStatus.FAIL : CliGovernanceCheckStatus.WARN,
        };
      }

      const candidateSurfaces = this.adapterRoutingRuntime.resolveRoleBindingCandidateSurfaces(
        roleBinding,
        toolConfigBySurface,
      );
      const unavailableReasons: string[] = [];

      for (const candidateSurface of candidateSurfaces) {
        const toolSnapshot = toolSnapshotBySurface.get(candidateSurface);
        if (!toolSnapshot) {
          unavailableReasons.push(`missing_tool_snapshot:${candidateSurface}`);
          continue;
        }
        if (!toolSnapshot.enabled) {
          unavailableReasons.push(`tool_disabled:${candidateSurface}`);
          continue;
        }
        if (toolSnapshot.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
          unavailableReasons.push(
            `surface_unavailable:${candidateSurface}:${toolSnapshot.unavailableReasons.join('|') || 'unavailable'}`,
          );
          continue;
        }

        const unsupportedCapabilities: string[] = [];
        const degradedCapabilities: string[] = [];
        for (const requiredCapability of role.requiredCapabilities) {
          const supportLevel =
            toolSnapshot.capabilitySupportByCapability.get(requiredCapability) ??
            AgentCapabilitySupportLevel.UNSUPPORTED;
          if (supportLevel === AgentCapabilitySupportLevel.UNSUPPORTED) {
            unsupportedCapabilities.push(requiredCapability);
            continue;
          }
          if (supportLevel === AgentCapabilitySupportLevel.DEGRADED) {
            degradedCapabilities.push(requiredCapability);
          }
        }
        if (unsupportedCapabilities.length > 0) {
          unavailableReasons.push(
            `capability_gap:${candidateSurface}:${unsupportedCapabilities.join('|')}`,
          );
          continue;
        }

        const selectedBy =
          candidateSurface === roleBinding.primarySurface
            ? CliAdapterRoleSelectionSource.PRIMARY
            : CliAdapterRoleSelectionSource.FALLBACK;
        const degraded =
          toolSnapshot.availabilityStatus === AgentAvailabilityStatus.DEGRADED ||
          degradedCapabilities.length > 0;
        return {
          roleId: role.roleId,
          roleProfileId: role.roleProfileId,
          required: role.required,
          primarySurface: roleBinding.primarySurface,
          selectedSurface: candidateSurface,
          selectedBy,
          unsupportedCapabilities: [],
          degradedCapabilities,
          unavailableReasons,
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: role.roleId,
            surfaceId: candidateSurface,
            availabilityStatus: degraded
              ? AgentAvailabilityStatus.DEGRADED
              : AgentAvailabilityStatus.AVAILABLE,
            selectedEntrypoint: toolSnapshot.healthCheck?.selectedEntrypoint ?? candidateSurface,
            routeKey: `cli.adapter.role.${role.roleId}`,
            routeRequirements: role.requiredCapabilities.map(String),
            fallbackAllowed: selectedBy === CliAdapterRoleSelectionSource.FALLBACK,
            unavailableReasons,
            degradedCapabilities,
            transportKind: toolSnapshot.healthCheck?.transportKind ?? null,
            providerKind: toolSnapshot.healthCheck?.providerKind ?? null,
            vendorBindingKind: toolSnapshot.healthCheck?.vendorBindingKind ?? null,
            model: toolSnapshot.healthCheck?.model ?? null,
            credentialSource: toolSnapshot.healthCheck?.credentialSource ?? null,
            endpointSource: toolSnapshot.healthCheck?.endpointSource ?? null,
            requestCancellationMode: toolSnapshot.healthCheck?.requestCancellationMode,
          }),
          failureAttributions: this.resolveFailureAttributions({
            unavailableReasons,
            degradedCapabilities,
          }),
          status:
            selectedBy === CliAdapterRoleSelectionSource.FALLBACK || degraded
              ? CliGovernanceCheckStatus.WARN
              : CliGovernanceCheckStatus.PASS,
        };
      }

      const resolvedUnavailableReasons =
        unavailableReasons.length > 0
          ? unavailableReasons
          : [`surface_unavailable:${roleBinding.primarySurface}`];
      return {
        roleId: role.roleId,
        roleProfileId: role.roleProfileId,
        required: role.required,
        primarySurface: roleBinding.primarySurface,
        selectedSurface: null,
        selectedBy: CliAdapterRoleSelectionSource.NONE,
        unsupportedCapabilities: [],
        degradedCapabilities: [],
        unavailableReasons: resolvedUnavailableReasons,
        healthCheck: buildLayeredHealthCheckResult({
          adapterId: role.roleId,
          surfaceId: roleBinding.primarySurface,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          selectedEntrypoint: roleBinding.primarySurface,
          routeKey: `cli.adapter.role.${role.roleId}`,
          routeRequirements: role.requiredCapabilities.map(String),
          fallbackAllowed: true,
          unavailableReasons: resolvedUnavailableReasons,
          transportKind: null,
          providerKind: null,
          vendorBindingKind: null,
          model: null,
          credentialSource: null,
          endpointSource: null,
        }),
        failureAttributions: this.resolveFailureAttributions({
          unavailableReasons: resolvedUnavailableReasons,
        }),
        status: role.required ? CliGovernanceCheckStatus.FAIL : CliGovernanceCheckStatus.WARN,
      };
    });

    const requiredRoleCount = roleEvaluations.filter((role) => role.required).length;
    const requiredRoleFailedCount = roleEvaluations.filter(
      (role) => role.required && role.status === CliGovernanceCheckStatus.FAIL,
    ).length;
    const degradedRoleCount = roleEvaluations.filter(
      (role) => role.status === CliGovernanceCheckStatus.WARN,
    ).length;
    const fallbackRoleCount = roleEvaluations.filter(
      (role) => role.selectedBy === CliAdapterRoleSelectionSource.FALLBACK,
    ).length;
    const hasToolLevelWarning = toolSnapshots.some(
      (tool) => this.resolveToolProbeCheckStatus(tool) === CliGovernanceCheckStatus.WARN,
    );

    let overallStatus = CliGovernanceCheckStatus.PASS;
    if (requiredRoleCount === 0 || requiredRoleFailedCount > 0) {
      overallStatus = CliGovernanceCheckStatus.FAIL;
    } else if (degradedRoleCount > 0 || hasToolLevelWarning) {
      overallStatus = CliGovernanceCheckStatus.WARN;
    }

    const nextActions: string[] = [];
    if (requiredRoleCount === 0) {
      nextActions.push(this.translate('cli.adapterVerification.defineRequiredRole'));
    }
    if (requiredRoleFailedCount > 0) {
      nextActions.push(this.translate('cli.adapterVerification.checkRoleBindings'));
    }
    const unavailableToolIds = toolSnapshots
      .filter((tool) => tool.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE)
      .map((tool) => tool.toolId);
    const missingCommands = this.collectMissingCommandsFromToolSnapshots(toolSnapshots);
    const failedProbeCommands = this.collectFailedProbeCommandsFromToolSnapshots(toolSnapshots);
    const missingCredentials = this.collectMissingCredentialsFromToolSnapshots(toolSnapshots);
    const failedHealthChecks = this.collectFailedHealthChecksFromToolSnapshots(toolSnapshots);
    if (
      unavailableToolIds.length > 0 &&
      missingCommands.length === 0 &&
      failedProbeCommands.length === 0 &&
      missingCredentials.length === 0 &&
      failedHealthChecks.length === 0
    ) {
      nextActions.push(
        this.translate('cli.adapterVerification.probeUnavailable', {
          toolIds: unavailableToolIds.join(', '),
        }),
      );
    }
    if (missingCommands.length > 0) {
      nextActions.push(
        this.translate('cli.adapterVerification.installMissingCommands', {
          commands: missingCommands.join(', '),
        }),
      );
    }
    if (failedProbeCommands.length > 0) {
      nextActions.push(
        this.translate('cli.adapterVerification.probeFailedCommands', {
          commands: failedProbeCommands.join(', '),
        }),
      );
    }
    if (missingCredentials.length > 0) {
      const remoteApiEnvCredentials = this.collectRemoteApiCredentialDetailsFromToolSnapshots(
        toolSnapshots,
        [AdapterCredentialSource.ENV_DEFAULT, AdapterCredentialSource.ENV_EXPLICIT],
      );
      const remoteApiProviderLocalCredentials =
        this.collectRemoteApiCredentialDetailsFromToolSnapshots(toolSnapshots, [
          AdapterCredentialSource.PROVIDER_LOCAL,
        ]);
      const unresolvedCredentialReferences = credentialReferences
        .filter((credentialReference) => !credentialReference.resolved)
        .map(
          (credentialReference) => `${credentialReference.toolId}:${credentialReference.selector}`,
        );
      const genericCredentialHints = missingCredentials.filter(
        (credential) =>
          !remoteApiEnvCredentials.includes(credential) &&
          !remoteApiProviderLocalCredentials.includes(credential) &&
          !unresolvedCredentialReferences.includes(credential),
      );
      if (remoteApiEnvCredentials.length > 0) {
        nextActions.push(
          this.translate('cli.adapterVerification.setRemoteApiCredentialEnvVars', {
            credentials: remoteApiEnvCredentials.join(', '),
          }),
        );
      }
      if (remoteApiProviderLocalCredentials.length > 0) {
        nextActions.push(
          this.translate('cli.adapterVerification.verifyProviderLocalCredentialState', {
            credentials: remoteApiProviderLocalCredentials.join(', '),
          }),
        );
      }
      if (unresolvedCredentialReferences.length > 0) {
        nextActions.push(
          this.translate(
            this.hasDefaultSecretBackend(secretBackends)
              ? 'cli.adapterVerification.createCredentialReferences'
              : 'cli.adapterVerification.optIntoSecretFallback',
            {
              credentials: unresolvedCredentialReferences.join(', '),
            },
          ),
        );
      }
      if (genericCredentialHints.length > 0) {
        nextActions.push(
          this.translate('cli.adapterVerification.authenticateAdapters', {
            credentials: genericCredentialHints.join(', '),
          }),
        );
      }
    }
    if (failedHealthChecks.length > 0) {
      nextActions.push(
        this.translate('cli.adapterVerification.investigateHealthChecks', {
          healthChecks: failedHealthChecks.join(', '),
        }),
      );
    }
    const missingLocalModels = this.collectMissingLocalModelsFromToolSnapshots(toolSnapshots);
    if (missingLocalModels.length > 0) {
      nextActions.push(
        this.translate('cli.adapterVerification.pullLocalModels', {
          models: missingLocalModels.join(', '),
        }),
      );
    }
    const missingLocalModelConfigs =
      this.collectMissingLocalModelConfigsFromToolSnapshots(toolSnapshots);
    if (missingLocalModelConfigs.length > 0) {
      nextActions.push(
        this.translate('cli.adapterVerification.provideLocalModelConfig', {
          configs: missingLocalModelConfigs.join(', '),
        }),
      );
    }
    if (
      this.collectToolReasonCodes(toolSnapshots, [
        'install.local_model_endpoint_unreachable',
        'protocol.local_model_invalid_response',
      ]).length > 0
    ) {
      nextActions.push(this.translate('cli.adapterVerification.checkLocalModelEndpoint'));
    }
    if (fallbackRoleCount > 0 || degradedRoleCount > 0) {
      nextActions.push(this.translate('cli.adapterVerification.reviewRoutingPriorities'));
    }

    return {
      overallStatus,
      tools: toolSnapshots,
      roleEvaluations,
      requiredRoleCount,
      requiredRoleFailedCount,
      degradedRoleCount,
      fallbackRoleCount,
      nextActions,
      secretBackends,
      credentialReferences,
    };
  }

  private async resolveSecretBackendDiagnostics(): Promise<CliAdapterSecretBackendDiagnostics> {
    const status = await this.secretService.getStatus({
      environment: this.environment,
    });
    return {
      selectedBackendId: status.selectedBackendId,
      defaultBackendId: status.defaultBackendId,
      indexPath: status.indexPath,
      backends: status.backends.map((backendStatus) => ({
        backendId: backendStatus.backendId,
        available: backendStatus.available,
        detail: backendStatus.detail,
        warning: backendStatus.warning ?? null,
      })),
    };
  }

  private async collectCredentialReferenceDiagnostics(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): Promise<CliAdapterCredentialReferenceDiagnostic[]> {
    const credentialReferenceDetails = this.collectRemoteApiCredentialDetailsFromToolSnapshots(
      toolSnapshots,
      [AdapterCredentialSource.CREDENTIAL_REF],
    );
    const diagnostics: CliAdapterCredentialReferenceDiagnostic[] = [];

    for (const detail of credentialReferenceDetails) {
      const separatorIndex = detail.indexOf(':');
      if (separatorIndex <= 0 || separatorIndex === detail.length - 1) {
        continue;
      }
      const toolId = detail.slice(0, separatorIndex) as AdapterSurface;
      const selector = detail.slice(separatorIndex + 1);
      if (!selector.startsWith('secret://')) {
        continue;
      }

      const resolution = await this.secretService.resolveSecretValue({
        selector,
        environment: this.environment,
      });
      diagnostics.push({
        toolId,
        selector,
        keyName: this.secretService.parseSelector(selector),
        resolved: resolution !== null,
        backendId: resolution?.backendId ?? null,
      });
    }

    return diagnostics;
  }

  private hasDefaultSecretBackend(secretBackends: CliAdapterSecretBackendDiagnostics): boolean {
    if (!secretBackends.defaultBackendId) {
      return false;
    }
    const defaultBackendStatus = secretBackends.backends.find(
      (backendStatus) => backendStatus.backendId === secretBackends.defaultBackendId,
    );
    return defaultBackendStatus?.available === true && !defaultBackendStatus.warning?.trim().length;
  }

  /**
   * Aggregates tool/role attribution counts for diagnostics artifacts.
   * @param verification Adapter verification snapshot.
   * @returns Summary object keyed by attribution id.
   */
  public createFailureAttributionSummary(
    verification: CliAdapterVerificationResolution,
  ): Record<string, number> {
    const summary = new Map<string, number>();
    for (const attribution of [
      ...verification.tools.flatMap((tool) => tool.failureAttributions),
      ...verification.roleEvaluations.flatMap((role) => role.failureAttributions),
    ]) {
      summary.set(attribution, (summary.get(attribution) ?? 0) + 1);
    }
    return Object.fromEntries(summary.entries());
  }

  /**
   * Probes all tracked adapter tools using one shared tool-config lookup map.
   * @param toolConfigBySurface Surface -> tool config lookup map.
   * @returns Tool-level probe snapshots.
   */
  private async collectAdapterToolSnapshotsBySurface(
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
    abortSignal?: AbortSignal,
  ): Promise<CliAdapterToolProbeSnapshot[]> {
    const protocolBySurface =
      this.adapterRoutingRuntime.createProtocolBySurface(toolConfigBySurface);

    const snapshots: CliAdapterToolProbeSnapshot[] = [];
    const surfaces = this.adapterRoutingRuntime.resolveTrackedAdapterSurfaces(toolConfigBySurface);
    for (const surface of surfaces) {
      this.throwIfAborted(abortSignal);
      const toolConfig = toolConfigBySurface.get(surface);
      const enabled = toolConfig?.enabled ?? true;
      const configuredAvailability = enabled
        ? (toolConfig?.availability ?? null)
        : AdapterAvailability.UNAVAILABLE;
      const configuredUnavailableReasons = [...(toolConfig?.unavailableReasons ?? [])];
      const protocol = protocolBySurface[surface];
      const localModelConfigResolution = enabled
        ? this.localModelProbeRuntime.resolveLocalModelConfigurationResolution(surface, toolConfig)
        : {
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            unavailableReasons: [`disabled_by_config:${surface}`],
          };
      const localProbeResolution = enabled
        ? localModelConfigResolution.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE
          ? localModelConfigResolution
          : await this.localModelProbeRuntime.mergeLocalProbeResolutions(
              localModelConfigResolution,
              this.localModelProbeRuntime.probeLocalAdapterAvailability(
                surface,
                toolConfig,
                abortSignal,
              ),
            )
        : {
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            unavailableReasons: [`disabled_by_config:${surface}`],
          };
      try {
        this.throwIfAborted(abortSignal);
        const probeResult = await protocol.probe({
          routeKey: `cli.adapter.probe.${surface}`,
          ...(abortSignal ? { signal: abortSignal } : {}),
          requiredCapabilities: [],
        });
        const unavailableReasons = [
          ...configuredUnavailableReasons,
          ...probeResult.unavailableReasons,
          ...localProbeResolution.unavailableReasons,
        ].filter((reason, index, list) => list.indexOf(reason) === index);
        snapshots.push({
          toolId: surface,
          enabled,
          configuredAvailability,
          availabilityStatus: this.localModelProbeRuntime.mergeAvailabilityStatus(
            probeResult.availabilityStatus,
            localProbeResolution.availabilityStatus,
          ),
          unavailableReasons,
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: probeResult.healthCheck?.adapterId ?? probeResult.identity.agentId,
            surfaceId: surface,
            availabilityStatus: this.localModelProbeRuntime.mergeAvailabilityStatus(
              probeResult.availabilityStatus,
              localProbeResolution.availabilityStatus,
            ),
            selectedEntrypoint:
              probeResult.healthCheck?.selectedEntrypoint ?? probeResult.identity.surface,
            routeKey: probeResult.healthCheck?.routeKey ?? `cli.adapter.probe.${surface}`,
            routeRequirements: probeResult.healthCheck?.routeRequirements ?? [],
            fallbackAllowed: probeResult.healthCheck?.fallbackAllowed ?? true,
            unavailableReasons,
            diagnostics: probeResult.healthCheck?.diagnostics ?? [],
            transportKind: probeResult.healthCheck?.transportKind ?? null,
            providerKind: probeResult.healthCheck?.providerKind ?? null,
            vendorBindingKind: probeResult.healthCheck?.vendorBindingKind ?? null,
            model: probeResult.healthCheck?.model ?? null,
            credentialSource: probeResult.healthCheck?.credentialSource ?? null,
            endpointSource: probeResult.healthCheck?.endpointSource ?? null,
            requestCancellationMode: probeResult.healthCheck?.requestCancellationMode,
          }),
          capabilitySupportByCapability: this.createCapabilitySupportMap(probeResult),
          failureAttributions: this.resolveFailureAttributions({
            unavailableReasons,
          }),
        });
      } catch (error) {
        if (standardizeError(error).code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED) {
          throw error;
        }
        const unavailableReasons = [
          ...configuredUnavailableReasons,
          ...(enabled ? [] : [`disabled_by_config:${surface}`]),
          `probe_failed:${this.formatExecFailureDetail(error)}`,
        ].filter((reason, index, list) => list.indexOf(reason) === index);
        snapshots.push({
          toolId: surface,
          enabled,
          configuredAvailability,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons,
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: surface,
            surfaceId: surface,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: surface,
            routeKey: `cli.adapter.probe.${surface}`,
            unavailableReasons,
            transportKind: null,
            providerKind: null,
            vendorBindingKind: null,
            model: null,
            credentialSource: null,
            endpointSource: null,
          }),
          capabilitySupportByCapability: new Map(),
          failureAttributions: this.resolveFailureAttributions({
            unavailableReasons,
          }),
        });
      }
    }

    return snapshots;
  }

  /**
   * Raises a standardized cancellation error when verification was already aborted.
   * @param abortSignal Optional runtime abort signal.
   */
  private throwIfAborted(abortSignal?: AbortSignal): void {
    if (!abortSignal?.aborted) {
      return;
    }
    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
      'Adapter verification cancelled before probe completion.',
    );
  }

  /**
   * Collects missing command names from adapter tool snapshots.
   * @param toolSnapshots Tool-level snapshots.
   * @returns Unique command names that are missing locally.
   */
  private collectMissingCommandsFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): string[] {
    const healthCheckCommands = this.collectToolDiagnosticDetails(toolSnapshots, [
      'install.command_missing',
    ])
      .map((detail) => detail.split(':').at(-1) ?? detail)
      .filter((detail, index, list) => detail.length > 0 && list.indexOf(detail) === index);
    if (healthCheckCommands.length > 0) {
      return healthCheckCommands;
    }

    const commands: string[] = [];
    for (const snapshot of toolSnapshots) {
      for (const reason of snapshot.unavailableReasons) {
        if (!reason.startsWith('command_missing:')) {
          continue;
        }
        const [, , command] = reason.split(':', 3);
        if (command && !commands.includes(command)) {
          commands.push(command);
        }
      }
    }
    return commands;
  }

  /**
   * Collects command probes that failed despite command presence.
   * @param toolSnapshots Tool-level snapshots.
   * @returns Unique `<surface>:<command>` command probe identifiers.
   */
  private collectFailedProbeCommandsFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): string[] {
    const healthCheckProbeCommands = this.collectToolDiagnosticDetails(toolSnapshots, [
      'install.command_probe_failed',
    ])
      .map((detail) => {
        const [surface, command] = detail.split(':', 2);
        return surface && command ? `${surface}:${command}` : detail;
      })
      .filter((detail, index, list) => detail.length > 0 && list.indexOf(detail) === index);
    if (healthCheckProbeCommands.length > 0) {
      return healthCheckProbeCommands;
    }

    const failedCommands: string[] = [];
    for (const snapshot of toolSnapshots) {
      for (const reason of snapshot.unavailableReasons) {
        if (!reason.startsWith('command_probe_failed:')) {
          continue;
        }
        const [, surface, command] = reason.split(':', 4);
        if (!surface || !command) {
          continue;
        }
        const failedCommandId = `${surface}:${command}`;
        if (!failedCommands.includes(failedCommandId)) {
          failedCommands.push(failedCommandId);
        }
      }
    }
    return failedCommands;
  }

  /**
   * Collects payload suffixes for one unavailable-reason prefix across tool snapshots.
   * @param toolSnapshots Tool-level probe snapshots.
   * @param prefix Machine-readable reason prefix.
   * @returns Unique payload suffixes preserving original order.
   */
  private collectToolReasonPayloads(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
    prefix: string,
  ): string[] {
    const payloads: string[] = [];
    for (const snapshot of toolSnapshots) {
      for (const reason of snapshot.unavailableReasons) {
        if (!reason.startsWith(prefix)) {
          continue;
        }
        const payload = reason.slice(prefix.length);
        if (!payloads.includes(payload)) {
          payloads.push(payload);
        }
      }
    }
    return payloads;
  }

  /**
   * Collects unique normalized reason codes from tool snapshots.
   * @param toolSnapshots Tool-level probe snapshots.
   * @param expectedReasonCodes Stable reason codes to retain.
   * @returns Unique matching reason codes.
   */
  private collectToolReasonCodes(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
    expectedReasonCodes: string[],
  ): string[] {
    const matchedReasonCodes: string[] = [];
    for (const snapshot of toolSnapshots) {
      for (const reasonCode of snapshot.healthCheck?.reasonCodes ?? []) {
        if (expectedReasonCodes.includes(reasonCode) && !matchedReasonCodes.includes(reasonCode)) {
          matchedReasonCodes.push(reasonCode);
        }
      }
    }
    return matchedReasonCodes;
  }

  /**
   * Collects diagnostic detail payloads for one or more normalized reason codes.
   * @param toolSnapshots Tool-level probe snapshots.
   * @param expectedReasonCodes Stable reason codes to retain.
   * @returns Unique diagnostic detail payloads preserving encounter order.
   */
  private collectToolDiagnosticDetails(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
    expectedReasonCodes: string[],
  ): string[] {
    const matchedDetails: string[] = [];
    for (const snapshot of toolSnapshots) {
      for (const diagnostic of snapshot.healthCheck?.diagnostics ?? []) {
        if (!expectedReasonCodes.includes(diagnostic.code)) {
          continue;
        }
        const detail = diagnostic.detail ?? snapshot.toolId;
        if (!matchedDetails.includes(detail)) {
          matchedDetails.push(detail);
        }
      }
    }
    return matchedDetails;
  }

  /**
   * Collects missing-credential payloads from normalized tool health checks with legacy fallback.
   * @param toolSnapshots Tool-level probe snapshots.
   * @returns Unique credential payloads.
   */
  private collectMissingCredentialsFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): string[] {
    const healthCheckCredentials = this.collectToolDiagnosticDetails(toolSnapshots, [
      'auth.credential_missing',
      'auth.login_required',
      'auth.unauthorized',
      'auth.forbidden',
    ]);
    if (healthCheckCredentials.length > 0) {
      return healthCheckCredentials;
    }
    return this.collectToolReasonPayloads(toolSnapshots, 'credential_missing:');
  }

  /**
   * Collects remote-api credential guidance details scoped to selected credential sources.
   * @param toolSnapshots Tool-level probe snapshots.
   * @param credentialSources Credential sources to retain.
   * @returns Unique credential details preserving encounter order.
   */
  private collectRemoteApiCredentialDetailsFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
    credentialSources: AdapterCredentialSource[],
  ): string[] {
    const details: string[] = [];
    for (const snapshot of toolSnapshots) {
      if (snapshot.healthCheck?.transportKind !== AdapterTransportKind.REMOTE_API) {
        continue;
      }
      if (
        !snapshot.healthCheck.credentialSource ||
        !credentialSources.includes(snapshot.healthCheck.credentialSource)
      ) {
        continue;
      }
      const authDiagnostic = snapshot.healthCheck.diagnostics.find((diagnostic) =>
        [
          'auth.credential_reference_resolved',
          'auth.credential_missing',
          'auth.login_required',
          'auth.unauthorized',
          'auth.forbidden',
        ].includes(diagnostic.code),
      );
      const detail =
        authDiagnostic?.detail ??
        snapshot.unavailableReasons
          .find((reason) => reason.startsWith('credential_missing:'))
          ?.slice('credential_missing:'.length) ??
        snapshot.toolId;
      if (detail.length > 0 && !details.includes(detail)) {
        details.push(detail);
      }
    }
    return details;
  }

  /**
   * Collects health-check failures from normalized tool health checks with legacy fallback.
   * @param toolSnapshots Tool-level probe snapshots.
   * @returns Unique health-check failure details.
   */
  private collectFailedHealthChecksFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): string[] {
    const healthCheckFailures = this.collectToolDiagnosticDetails(toolSnapshots, [
      'protocol.health_check_timeout',
      'semantic.invalid_response',
      'protocol.health_check_failed',
      'protocol.rate_limited',
      'protocol.quota_exhausted',
      'protocol.probe_failed',
    ]);
    if (healthCheckFailures.length > 0) {
      return healthCheckFailures;
    }
    return [
      ...this.collectToolReasonPayloads(toolSnapshots, 'health_check_timeout:'),
      ...this.collectToolReasonPayloads(toolSnapshots, 'health_check_invalid_response:'),
      ...this.collectToolReasonPayloads(toolSnapshots, 'health_check_failed:'),
    ].filter((payload, index, list) => list.indexOf(payload) === index);
  }

  /**
   * Collects missing local-model names from normalized tool health checks with legacy fallback.
   * @param toolSnapshots Tool-level probe snapshots.
   * @returns Unique local-model payloads.
   */
  private collectMissingLocalModelsFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): string[] {
    const healthCheckModels = this.collectToolDiagnosticDetails(toolSnapshots, [
      'route.local_model_model_missing',
    ])
      .map((detail) => detail.split(':').at(-1) ?? detail)
      .filter((detail, index, list) => detail.length > 0 && list.indexOf(detail) === index);
    if (healthCheckModels.length > 0) {
      return healthCheckModels;
    }
    return this.collectToolReasonPayloads(toolSnapshots, 'local_model_model_missing:');
  }

  /**
   * Collects missing local-model config payloads from normalized tool health checks.
   * @param toolSnapshots Tool-level probe snapshots.
   * @returns Unique local-model config payloads.
   */
  private collectMissingLocalModelConfigsFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): string[] {
    const healthCheckConfigs = this.collectToolDiagnosticDetails(toolSnapshots, [
      'install.local_model_config_missing',
    ])
      .map((detail) => detail.split(':').at(-1) ?? detail)
      .filter((detail, index, list) => detail.length > 0 && list.indexOf(detail) === index);
    if (healthCheckConfigs.length > 0) {
      return healthCheckConfigs;
    }
    return this.collectToolReasonPayloads(toolSnapshots, 'local_model_config_missing:');
  }

  /**
   * Resolves deterministic failure-attribution buckets from reasons and capability gaps.
   * @param options Unavailable reasons plus optional capability gaps.
   * @returns Ordered attribution categories without duplicates.
   */
  private resolveFailureAttributions(options: {
    unavailableReasons: string[];
    unsupportedCapabilities?: string[];
    degradedCapabilities?: string[];
  }): string[] {
    const attributions: string[] = [];

    const pushAttribution = (attribution: string): void => {
      if (!attributions.includes(attribution)) {
        attributions.push(attribution);
      }
    };

    if (
      (options.unsupportedCapabilities?.length ?? 0) > 0 ||
      (options.degradedCapabilities?.length ?? 0) > 0
    ) {
      pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.CAPABILITY_GAP);
    }

    for (const reason of options.unavailableReasons) {
      if (
        reason.startsWith('local_model_config_missing:') ||
        reason.startsWith('missing_role_binding:') ||
        reason.startsWith('disabled_by_config:') ||
        reason.startsWith('tool_disabled:')
      ) {
        pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.CONFIGURATION_MISSING);
        continue;
      }

      if (reason.startsWith('local_model_model_missing:')) {
        pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.MODEL_UNAVAILABLE);
        continue;
      }

      if (reason.startsWith('capability_gap:')) {
        pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.CAPABILITY_GAP);
        continue;
      }

      if (reason.startsWith('surface_unavailable:')) {
        if (reason.includes('local_model_config_missing:')) {
          pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.CONFIGURATION_MISSING);
        }
        if (reason.includes('local_model_model_missing:')) {
          pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.MODEL_UNAVAILABLE);
        }
        if (reason.includes('capability_gap:')) {
          pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.CAPABILITY_GAP);
        }
        pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.ENVIRONMENT_PRECONDITION);
        continue;
      }

      if (
        reason.startsWith('command_missing:') ||
        reason.startsWith('command_probe_failed:') ||
        reason.startsWith('probe_failed:') ||
        reason.startsWith('credential_missing:') ||
        reason.startsWith('health_check_timeout:') ||
        reason.startsWith('health_check_invalid_response:') ||
        reason.startsWith('health_check_failed:') ||
        reason.startsWith('local_model_endpoint_unreachable:') ||
        reason.startsWith('local_model_probe_invalid_response:')
      ) {
        pushAttribution(CLI_ADAPTER_FAILURE_ATTRIBUTION.ENVIRONMENT_PRECONDITION);
      }
    }

    return attributions;
  }

  /**
   * Resolves adapter tool-level check status from probe snapshot.
   * @param snapshot Adapter tool probe snapshot.
   * @returns Check status used by verification summary.
   */
  private resolveToolProbeCheckStatus(
    snapshot: CliAdapterToolProbeSnapshot,
  ): CliGovernanceCheckStatus {
    if (!snapshot.enabled) {
      return CliGovernanceCheckStatus.WARN;
    }
    if (snapshot.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return CliGovernanceCheckStatus.WARN;
    }
    if (snapshot.availabilityStatus === AgentAvailabilityStatus.DEGRADED) {
      return CliGovernanceCheckStatus.WARN;
    }
    return CliGovernanceCheckStatus.PASS;
  }

  /**
   * Creates capability support lookup map from one probe result.
   * @param probeResult Adapter probe result.
   * @returns Capability -> support level lookup.
   */
  private createCapabilitySupportMap(
    probeResult: AgentProbeResult,
  ): Map<string, AgentCapabilitySupportLevel> {
    return new Map(
      probeResult.capabilityMatrix.capabilityStates.map((capabilityState) => [
        capabilityState.capability,
        capabilityState.supportLevel,
      ]),
    );
  }
}
