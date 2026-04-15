import {
  AgentAvailabilityStatus,
  AgentCapabilitySupportLevel,
  buildLayeredHealthCheckResult,
} from '@repo-ai-governor/adapter-sdk';
import {
  AdapterAvailability,
  AdapterEndpointSource,
  AdapterRequestCancellationMode,
  AdapterSurface,
  AdapterTransportKind,
  DEFAULT_I18N_RUNTIME_CONFIG,
  ExecutionProgressStage,
  I18nRuntime,
} from '@repo-ai-governor/shared';
import { expectNativeCliExecPreservedFacts } from '../../../../test/native-cli-exec-compatibility-harness.js';
import {
  CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
  CliAcpHostDistributionBoundary,
  CliAcpHostReadinessStatus,
} from '../../src/constants/cli-acp-host.constant.js';
import {
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliAdapterDiagnosticsRuntime } from '../../src/runtime/adapter-diagnostics-runtime.js';
import type { CliAdapterVerificationResolution } from '../../src/types/index.js';

function createVerificationFixture(): CliAdapterVerificationResolution {
  return {
    overallStatus: CliGovernanceCheckStatus.WARN,
    requiredRoleCount: 1,
    requiredRoleFailedCount: 0,
    degradedRoleCount: 1,
    fallbackRoleCount: 1,
    nextActions: ['Review fallback priority before unattended execution.'],
    tools: [
      {
        toolId: AdapterSurface.OLLAMA,
        enabled: true,
        configuredAvailability: AdapterAvailability.AVAILABLE,
        availabilityStatus: AgentAvailabilityStatus.DEGRADED,
        unavailableReasons: [
          'local_model_endpoint_unreachable:ollama:http%3A%2F%2F127.0.0.1%3A11434:ECONNREFUSED:refused',
        ],
        failureAttributions: ['configuration_missing'],
        healthCheck: buildLayeredHealthCheckResult({
          adapterId: 'ollama-agent',
          surfaceId: AdapterSurface.OLLAMA,
          availabilityStatus: AgentAvailabilityStatus.DEGRADED,
          selectedEntrypoint: AdapterSurface.OLLAMA,
          routeKey: 'cli.adapter.probe.ollama',
          unavailableReasons: [
            'local_model_endpoint_unreachable:ollama:http%3A%2F%2F127.0.0.1%3A11434:ECONNREFUSED:refused',
          ],
          transportKind: AdapterTransportKind.BASELINE,
          providerKind: null,
          vendorBindingKind: null,
          model: 'qwen2.5-coder:7b',
          credentialSource: null,
          endpointSource: AdapterEndpointSource.CONFIG_EXPLICIT,
          requestCancellationMode: AdapterRequestCancellationMode.LOCAL_ABORT_ONLY,
        }),
        capabilitySupportByCapability: new Map([
          ['structured_output', AgentCapabilitySupportLevel.SUPPORTED],
        ]),
      },
    ],
    roleEvaluations: [
      {
        roleId: 'reviewer',
        roleProfileId: 'default.reviewer',
        required: true,
        primarySurface: AdapterSurface.CLAUDE_CODE,
        selectedSurface: AdapterSurface.OLLAMA,
        selectedBy: CliAdapterRoleSelectionSource.FALLBACK,
        unsupportedCapabilities: [],
        degradedCapabilities: ['structured_output'],
        unavailableReasons: ['surface_unavailable:claude_code:login_required'],
        failureAttributions: ['configuration_missing'],
        healthCheck: buildLayeredHealthCheckResult({
          adapterId: 'ollama-agent',
          surfaceId: AdapterSurface.OLLAMA,
          availabilityStatus: AgentAvailabilityStatus.DEGRADED,
          selectedEntrypoint: AdapterSurface.OLLAMA,
          routeKey: 'cli.adapter.role.reviewer',
          unavailableReasons: ['surface_unavailable:claude_code:login_required'],
          transportKind: AdapterTransportKind.BASELINE,
          providerKind: null,
          vendorBindingKind: null,
          model: 'qwen2.5-coder:7b',
          credentialSource: null,
          endpointSource: AdapterEndpointSource.CONFIG_EXPLICIT,
          requestCancellationMode: AdapterRequestCancellationMode.LOCAL_ABORT_ONLY,
        }),
        status: CliGovernanceCheckStatus.WARN,
      },
    ],
  };
}

function createCliExecVerificationFixture(options: {
  unavailableReason: string;
  shellWrapped: boolean;
  processTreePolicy?: string;
  spawnErrorCode?: string;
}): CliAdapterVerificationResolution {
  const diagnostics = [
    {
      layer: 'install' as const,
      status: 'pass' as const,
      code: 'install.entrypoint_resolution',
      detail: AdapterSurface.CODEX,
    },
    {
      layer: 'protocol' as const,
      status: 'pass' as const,
      code: 'protocol.shell_wrapped',
      detail: String(options.shellWrapped),
    },
    ...(options.processTreePolicy
      ? [
          {
            layer: 'protocol' as const,
            status: 'pass' as const,
            code: 'protocol.process_tree_policy',
            detail: options.processTreePolicy,
          },
        ]
      : []),
    ...(options.spawnErrorCode
      ? [
          {
            layer: 'install' as const,
            status: 'fail' as const,
            code: 'install.spawn_error_code',
            detail: options.spawnErrorCode,
          },
        ]
      : []),
  ];

  return {
    overallStatus: CliGovernanceCheckStatus.WARN,
    requiredRoleCount: 1,
    requiredRoleFailedCount: 0,
    degradedRoleCount: 1,
    fallbackRoleCount: 0,
    nextActions: ['Inspect cli_exec launch diagnostics before retrying.'],
    tools: [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        configuredAvailability: AdapterAvailability.AVAILABLE,
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: [options.unavailableReason],
        failureAttributions: ['execution_runtime'],
        healthCheck: buildLayeredHealthCheckResult({
          adapterId: 'codex-agent',
          surfaceId: AdapterSurface.CODEX,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          selectedEntrypoint: AdapterSurface.CODEX,
          routeKey: 'cli.adapter.probe.codex',
          unavailableReasons: [options.unavailableReason],
          transportKind: AdapterTransportKind.CLI_EXEC,
          requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
          diagnostics,
        }),
        capabilitySupportByCapability: new Map(),
      },
    ],
    roleEvaluations: [
      {
        roleId: 'reviewer',
        roleProfileId: 'default.reviewer',
        required: true,
        primarySurface: AdapterSurface.CODEX,
        selectedSurface: AdapterSurface.CODEX,
        selectedBy: CliAdapterRoleSelectionSource.PRIMARY,
        unsupportedCapabilities: [],
        degradedCapabilities: [],
        unavailableReasons: [options.unavailableReason],
        failureAttributions: ['execution_runtime'],
        healthCheck: buildLayeredHealthCheckResult({
          adapterId: 'codex-agent',
          surfaceId: AdapterSurface.CODEX,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          selectedEntrypoint: AdapterSurface.CODEX,
          routeKey: 'cli.adapter.role.reviewer',
          unavailableReasons: [options.unavailableReason],
          transportKind: AdapterTransportKind.CLI_EXEC,
          requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
        }),
        status: CliGovernanceCheckStatus.WARN,
      },
    ],
  };
}

function createAcpVerificationFixture(): CliAdapterVerificationResolution {
  const diagnostics = [
    {
      layer: 'protocol' as const,
      status: 'pass' as const,
      code: 'protocol.acp_host_readiness_status',
      detail: 'runtime_service_ready',
    },
    {
      layer: 'protocol' as const,
      status: 'pass' as const,
      code: 'protocol.acp_distribution_boundary',
      detail: 'packaged_distribution_ready',
    },
    {
      layer: 'protocol' as const,
      status: 'pass' as const,
      code: 'protocol.acp_companion_state_summary',
      detail: CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
    },
  ];

  return {
    overallStatus: CliGovernanceCheckStatus.WARN,
    requiredRoleCount: 1,
    requiredRoleFailedCount: 0,
    degradedRoleCount: 1,
    fallbackRoleCount: 0,
    nextActions: ['Run ACP clean-room verify before support uplift.'],
    tools: [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        configuredAvailability: AdapterAvailability.AVAILABLE,
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
        failureAttributions: ['environment_precondition'],
        healthCheck: buildLayeredHealthCheckResult({
          adapterId: 'codex-acp-host-protocol',
          surfaceId: AdapterSurface.CODEX,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          selectedEntrypoint: AdapterSurface.CODEX,
          routeKey: 'cli.adapter.probe.codex',
          unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
          transportKind: AdapterTransportKind.ACP_EXEC,
          requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
          diagnostics,
        }),
        capabilitySupportByCapability: new Map(),
      },
    ],
    roleEvaluations: [
      {
        roleId: 'coder',
        roleProfileId: 'default.coder',
        required: true,
        primarySurface: AdapterSurface.CODEX,
        selectedSurface: AdapterSurface.CODEX,
        selectedBy: CliAdapterRoleSelectionSource.PRIMARY,
        unsupportedCapabilities: [],
        degradedCapabilities: [],
        unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
        failureAttributions: ['environment_precondition'],
        healthCheck: buildLayeredHealthCheckResult({
          adapterId: 'codex-acp-host-protocol',
          surfaceId: AdapterSurface.CODEX,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          selectedEntrypoint: AdapterSurface.CODEX,
          routeKey: 'cli.adapter.role.coder',
          unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
          transportKind: AdapterTransportKind.ACP_EXEC,
          requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
          diagnostics,
        }),
        status: CliGovernanceCheckStatus.WARN,
      },
    ],
  };
}

describe('Cli adapter diagnostics runtime', () => {
  it('renders human-friendly probe detail and safe_local boundary payload', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runtime = new CliAdapterDiagnosticsRuntime(
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      () => ({
        configuration_missing: 2,
      }),
    );
    const verification = createVerificationFixture();
    const toolSnapshot = verification.tools[0];

    expect(toolSnapshot).toBeDefined();
    if (!toolSnapshot) {
      return;
    }

    const detail = runtime.resolveToolProbeCheckDetail(toolSnapshot);
    const safeLocalBoundary = runtime.createSafeLocalBoundaryArtifactPayload(true);

    expect(detail).toContain('availability=degraded');
    expect(detail).toContain('attribution=configuration_missing');
    expect(detail).toContain('local-model surface "ollama" cannot reach endpoint');
    expect(detail).toContain('transport=baseline');
    expect(detail).toContain('model=qwen2.5-coder:7b');
    expect(detail).toContain('cancel=local_abort_only');
    expect(safeLocalBoundary.mode).toBe('safe_local_only');
    expect(safeLocalBoundary.fixEnabled).toBe(true);
  });

  it('shapes verification payload, role progress, and prompts outside the facade', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runtime = new CliAdapterDiagnosticsRuntime(
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      () => ({
        configuration_missing: 2,
      }),
    );
    const verification = createVerificationFixture();

    const payload = runtime.createAdapterVerificationArtifactPayload(verification) as {
      failureAttributionSummary?: Record<string, number>;
    };
    const rows = runtime.createAdapterRoleProgressRows({
      verification,
      stage: ExecutionProgressStage.CONNECT,
      diagnosticsPath: '/tmp/connect.json',
      executionId: 'connect-123',
    });
    const prompts = runtime.createAdapterInteractionPrompts({
      verification,
      stage: ExecutionProgressStage.CONNECT,
    });

    expect(payload.failureAttributionSummary?.configuration_missing).toBe(2);
    expect(rows[0]?.roleId).toBe('reviewer');
    expect(rows[0]?.status).toBe('warning');
    expect(rows[0]?.detail).toContain('transport=baseline');
    expect(rows[0]?.detail).toContain('cancel=local_abort_only');
    expect(rows[0]?.backlink?.artifactPath).toBe('/tmp/connect.json');
    expect(prompts[0]?.blocking).toBe(false);
    expect(prompts[0]?.title).toBe('Adapter route attention');
  });

  it('humanizes rate-limited and quota-exhausted remote health-check failures', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runtime = new CliAdapterDiagnosticsRuntime(
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      () => ({
        environment_precondition: 1,
      }),
    );

    const rateLimitedDetail = runtime.resolveToolProbeCheckDetail({
      toolId: AdapterSurface.CODEX,
      enabled: true,
      configuredAvailability: AdapterAvailability.AVAILABLE,
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      unavailableReasons: ['health_check_failed:codex:rate_limited'],
      failureAttributions: ['environment_precondition'],
      capabilitySupportByCapability: new Map(),
    });
    const quotaExhaustedDetail = runtime.resolveToolProbeCheckDetail({
      toolId: AdapterSurface.GITHUB_COPILOT,
      enabled: true,
      configuredAvailability: AdapterAvailability.AVAILABLE,
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      unavailableReasons: ['health_check_failed:github-copilot:quota_exhausted'],
      failureAttributions: ['environment_precondition'],
      capabilitySupportByCapability: new Map(),
    });

    expect(rateLimitedDetail).toContain('surface "codex" health check is currently rate limited');
    expect(quotaExhaustedDetail).toContain(
      'surface "github-copilot" health check is blocked by exhausted quota',
    );
  });

  it('adds spawn_failed launch_diagnostics to verification report payload tool and role rows', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runtime = new CliAdapterDiagnosticsRuntime(
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      () => ({
        execution_runtime: 2,
      }),
    );
    const verification = createCliExecVerificationFixture({
      unavailableReason: 'spawn_failed:codex:ENOENT',
      shellWrapped: true,
      spawnErrorCode: 'ENOENT',
    });

    const payload = runtime.createAdapterVerificationArtifactPayload(verification) as {
      tools?: Array<{ toolId?: string; launch_diagnostics?: Record<string, unknown> }>;
      roles?: Array<{ roleId?: string; launch_diagnostics?: Record<string, unknown> }>;
    };
    const toolRow = payload.tools?.find((tool) => tool.toolId === AdapterSurface.CODEX);
    const roleRow = payload.roles?.find((role) => role.roleId === 'reviewer');

    expect(toolRow?.launch_diagnostics).toEqual({
      selected_entrypoint: AdapterSurface.CODEX,
      request_cancellation_mode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      shell_wrapped: true,
      spawn_error_code: 'ENOENT',
    });
    expect(roleRow?.launch_diagnostics).toEqual(toolRow?.launch_diagnostics);
    expectNativeCliExecPreservedFacts('spawn_failed', {
      launch_diagnostics_preserved:
        toolRow?.launch_diagnostics?.selected_entrypoint === AdapterSurface.CODEX &&
        toolRow?.launch_diagnostics?.spawn_error_code === 'ENOENT',
      adapter_launch_truth_projected:
        toolRow?.launch_diagnostics?.request_cancellation_mode ===
          AdapterRequestCancellationMode.NOT_SUPPORTED &&
        roleRow?.launch_diagnostics?.selected_entrypoint === AdapterSurface.CODEX,
    });
  });

  it('adds parse-failure launch_diagnostics to verification report payload tool and role rows', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runtime = new CliAdapterDiagnosticsRuntime(
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      () => ({
        execution_runtime: 2,
      }),
    );
    const verification = createCliExecVerificationFixture({
      unavailableReason: 'health_check_invalid_response:codex:malformed_json',
      shellWrapped: false,
      processTreePolicy: 'process_group_best_effort',
    });

    const payload = runtime.createAdapterVerificationArtifactPayload(verification) as {
      tools?: Array<{ toolId?: string; launch_diagnostics?: Record<string, unknown> }>;
      roles?: Array<{ roleId?: string; launch_diagnostics?: Record<string, unknown> }>;
    };
    const toolRow = payload.tools?.find((tool) => tool.toolId === AdapterSurface.CODEX);
    const roleRow = payload.roles?.find((role) => role.roleId === 'reviewer');

    expect(toolRow?.launch_diagnostics).toEqual({
      selected_entrypoint: AdapterSurface.CODEX,
      request_cancellation_mode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      shell_wrapped: false,
      process_tree_policy: 'process_group_best_effort',
    });
    expect(roleRow?.launch_diagnostics).toEqual(toolRow?.launch_diagnostics);
    expectNativeCliExecPreservedFacts('probe_protocol_parse_failed', {
      launch_diagnostics_preserved:
        toolRow?.launch_diagnostics?.selected_entrypoint === AdapterSurface.CODEX &&
        toolRow?.launch_diagnostics?.process_tree_policy === 'process_group_best_effort',
      adapter_launch_truth_projected:
        toolRow?.launch_diagnostics?.request_cancellation_mode ===
          AdapterRequestCancellationMode.NOT_SUPPORTED &&
        roleRow?.launch_diagnostics?.selected_entrypoint === AdapterSurface.CODEX,
    });
  });

  it('adds acp_host_companion payloads and ACP readiness footnotes to verification artifacts', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runtime = new CliAdapterDiagnosticsRuntime(
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      () => ({
        environment_precondition: 2,
      }),
    );
    const verification = createAcpVerificationFixture();
    const payload = runtime.createAdapterVerificationArtifactPayload(verification) as {
      tools?: Array<{ toolId?: string; acp_host_companion?: Record<string, unknown> }>;
      roles?: Array<{ roleId?: string; acp_host_companion?: Record<string, unknown> }>;
    };
    const toolRow = payload.tools?.find((tool) => tool.toolId === AdapterSurface.CODEX);
    const roleRow = payload.roles?.find((role) => role.roleId === 'coder');
    const toolDetail = runtime.resolveToolProbeCheckDetail(verification.tools[0] as never);

    expect(toolRow?.acp_host_companion).toEqual({
      hostReadinessStatus: CliAcpHostReadinessStatus.RUNTIME_SERVICE_READY,
      distributionBoundary: CliAcpHostDistributionBoundary.PACKAGED_DISTRIBUTION_READY,
      companionStateSummary: CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
    });
    expect(roleRow?.acp_host_companion).toEqual(toolRow?.acp_host_companion);
    expect(toolDetail).toContain('acp_runtime=runtime_service_ready');
    expect(toolDetail).toContain('acp_distribution=packaged_distribution_ready');
    expect(toolDetail).toContain(`acp_state=${CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY}`);
  });
});
