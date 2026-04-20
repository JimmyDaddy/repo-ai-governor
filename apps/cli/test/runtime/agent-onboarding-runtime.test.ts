import {
  AgentAvailabilityStatus,
  buildLayeredHealthCheckResult,
} from '@repo-ai-governor/adapter-sdk';
import { type GovernorConfig, WorkspaceMode } from '@repo-ai-governor/config';
import {
  AdapterAvailability,
  AdapterCredentialSource,
  AdapterEndpointSource,
  AdapterProviderKind,
  AdapterRequestCancellationMode,
  AdapterSurface,
  AdapterTransportKind,
  AdapterTransportSelectionSource,
  AdapterVendorBindingKind,
  GovernorErrorCode,
  LocalModelProvider,
  WorkspaceMigrationPolicy,
} from '@repo-ai-governor/shared';
import { expectNativeCliExecPreservedFacts } from '../../../../test/native-cli-exec-compatibility-harness.js';
import {
  CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
  CliAcpHostDistributionBoundary,
  CliAcpHostReadinessStatus,
} from '../../src/constants/cli-acp-host.constant.js';
import { CliAgentOnboardingPreset } from '../../src/constants/cli-agent-onboarding.constant.js';
import {
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliAgentOnboardingRuntime } from '../../src/runtime/agent-onboarding-runtime.js';
import { createCliAdapterVerificationResolution } from '../test-support/cli-command-fixtures.js';

type GovernorConfigWithAdapters = GovernorConfig & {
  adapters: NonNullable<GovernorConfig['adapters']>;
};

function createGovernorConfigFixture(): GovernorConfigWithAdapters {
  return {
    schemaVersion: '1.1',
    workspace: {
      mode: WorkspaceMode.REPO_LOCAL,
      migrationPolicy: WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK,
    },
    i18n: {
      runtimeEngine: 'i18next',
      defaultLocale: 'zh-CN',
      fallbackLocale: 'en-US',
      supportedLocales: ['zh-CN', 'en-US'],
    },
    adapters: {
      roles: [
        {
          roleId: 'planner',
          roleProfileId: 'planner-default',
          requiredCapabilities: ['structured_output'],
          required: true,
        },
        {
          roleId: 'coder',
          roleProfileId: 'coder-default',
          requiredCapabilities: ['tool_calling'],
          required: true,
        },
        {
          roleId: 'reviewer',
          roleProfileId: 'reviewer-default',
          requiredCapabilities: ['structured_output'],
          required: true,
        },
        {
          roleId: 'architect',
          roleProfileId: 'architect-default',
          requiredCapabilities: ['structured_output'],
          required: false,
        },
      ],
      routing: {
        roleBindings: {
          planner: {
            primarySurface: AdapterSurface.CODEX,
            fallbackSurfaces: [AdapterSurface.CLAUDE_CODE],
          },
          coder: {
            primarySurface: AdapterSurface.CODEX,
            fallbackSurfaces: [AdapterSurface.GITHUB_COPILOT],
          },
          reviewer: {
            primarySurface: AdapterSurface.CLAUDE_CODE,
            fallbackSurfaces: [AdapterSurface.CODEX],
          },
          architect: {
            primarySurface: AdapterSurface.GITHUB_COPILOT,
            fallbackSurfaces: [AdapterSurface.CODEX],
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
        },
        {
          toolId: AdapterSurface.CLAUDE_CODE,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
        },
        {
          toolId: AdapterSurface.GITHUB_COPILOT,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
        },
      ],
    },
  };
}

describe('CliAgentOnboardingRuntime', () => {
  it('keeps single-tool-minimal candidate scoped to minimal roles even without overwrite', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const resolution = runtime.buildConnectCandidateConfig({
      sourceConfig: createGovernorConfigFixture(),
      presetId: CliAgentOnboardingPreset.SINGLE_TOOL_MINIMAL,
      requestedTools: [AdapterSurface.CODEX],
      toolTransportOverrides: [],
      remoteApiOverrides: [],
      overwrite: false,
      singleToolAllRoles: false,
      roleBindingOverrides: [],
    });

    expect(resolution.candidateAdaptersConfig.roles.map((role) => role.roleId)).toEqual([
      'planner',
      'coder',
      'reviewer',
    ]);
    expect(Object.keys(resolution.candidateAdaptersConfig.routing.roleBindings)).toEqual([
      'planner',
      'coder',
      'reviewer',
    ]);
    expect(resolution.candidateAdaptersConfig.tools?.map((tool) => tool.toolId)).toEqual([
      AdapterSurface.CODEX,
    ]);
  });

  it('throws a standardized error when the source config has no adapters baseline', () => {
    const runtime = new CliAgentOnboardingRuntime();

    expect(() =>
      runtime.buildConnectCandidateConfig({
        sourceConfig: {
          schemaVersion: '1.1',
          workspace: {
            mode: WorkspaceMode.REPO_LOCAL,
            migrationPolicy: WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK,
          },
          i18n: {
            runtimeEngine: 'i18next',
            defaultLocale: 'zh-CN',
            fallbackLocale: 'en-US',
            supportedLocales: ['zh-CN', 'en-US'],
          },
        },
        presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
        requestedTools: [],
        toolTransportOverrides: [],
        remoteApiOverrides: [],
        overwrite: false,
        singleToolAllRoles: false,
        roleBindingOverrides: [],
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
      }),
    );
  });

  it('projects remote-api candidate truth into onboarding and verify payloads', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        transport: AdapterTransportKind.REMOTE_API,
        remoteApi: {
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
          credentialEnvVar: 'OPENAI_API_KEY',
          allowProviderLocalConfig: true,
        },
      },
    ];
    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['credential_missing:codex:OPENAI_API_KEY'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['credential_missing:codex:OPENAI_API_KEY'],
            transportKind: AdapterTransportKind.REMOTE_API,
            providerKind: AdapterProviderKind.OPENAI,
            vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
            credentialSource: AdapterCredentialSource.ENV_DEFAULT,
            endpointSource: AdapterEndpointSource.VENDOR_DEFAULT,
            requestCancellationMode: AdapterRequestCancellationMode.LOCAL_ABORT_ONLY,
          }),
          capabilitySupportByCapability: new Map(),
          failureAttributions: ['environment_precondition'],
        },
      ],
      roleEvaluations: [],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 1,
      degradedRoleCount: 0,
      fallbackRoleCount: 0,
      nextActions: ['Set OPENAI_API_KEY before doctor.'],
    });

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'doctor',
      executionId: 'doctor-123',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.WARN,
      nextActions: verification.nextActions,
      enabledTools: [AdapterSurface.CODEX],
      adaptersConfig: sourceConfig.adapters,
      verification,
      dryRun: false,
      overwrite: false,
      singleToolAllRoles: false,
    });
    const verifyPayload = runtime.createVerifyMatrixPayload({
      executionId: 'doctor-123',
      verification,
      adaptersConfig: sourceConfig.adapters,
    });

    expect(onboardingPayload.enabled_tools).toEqual([
      expect.objectContaining({
        tool_id: AdapterSurface.CODEX,
        transport_kind: AdapterTransportKind.REMOTE_API,
        provider_kind: AdapterProviderKind.OPENAI,
        vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
        transport_selection_source: AdapterTransportSelectionSource.CONFIG_EXPLICIT,
        transport_selection_locked: true,
        configured_remote_api: expect.objectContaining({
          provider_kind: AdapterProviderKind.OPENAI,
          vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
          credential_mode: AdapterCredentialSource.ENV_EXPLICIT,
          endpoint_source: AdapterEndpointSource.PROVIDER_LOCAL,
        }),
      }),
    ]);
    expect(onboardingPayload.tool_transport_matrix).toEqual([
      expect.objectContaining({
        tool_id: AdapterSurface.CODEX,
        transport: AdapterTransportKind.REMOTE_API,
        transport_kind: AdapterTransportKind.REMOTE_API,
        transport_selection_source: AdapterTransportSelectionSource.CONFIG_EXPLICIT,
        transport_selection_locked: true,
        configured_remote_api: expect.objectContaining({
          provider_kind: AdapterProviderKind.OPENAI,
          vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
        }),
        remote_api_candidate: expect.objectContaining({
          provider_kind: AdapterProviderKind.OPENAI,
          vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
          credential_env_var: 'OPENAI_API_KEY',
          allow_provider_local_config: true,
          discovery_mode: 'read_only',
          mutation_scope: 'manual_only',
        }),
        probe_truth: expect.objectContaining({
          transport_kind: AdapterTransportKind.REMOTE_API,
          provider_kind: AdapterProviderKind.OPENAI,
          vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
          credential_source: AdapterCredentialSource.ENV_DEFAULT,
          endpoint_source: AdapterEndpointSource.VENDOR_DEFAULT,
          request_cancellation_mode: AdapterRequestCancellationMode.LOCAL_ABORT_ONLY,
          reason_codes: ['auth.credential_missing'],
        }),
        invoke_liveness_diagnostics: expect.objectContaining({
          transport_kind: AdapterTransportKind.REMOTE_API,
          provider_kind: AdapterProviderKind.OPENAI,
          vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
          request_cancellation_mode: AdapterRequestCancellationMode.LOCAL_ABORT_ONLY,
          reason_codes: ['auth.credential_missing'],
          unavailable_reasons: ['credential_missing:codex:OPENAI_API_KEY'],
          failure_attributions: ['environment_precondition'],
        }),
      }),
    ]);
    expect(onboardingPayload).toMatchObject({
      verification_status: CliGovernanceCheckStatus.WARN,
      diagnostic_summary: 'status=warn required_failures=1 fallback_roles=0 degraded_roles=0',
      next_action: 'Set OPENAI_API_KEY before doctor.',
      next_actions: ['Set OPENAI_API_KEY before doctor.'],
    });
    expect(verifyPayload).toMatchObject({
      verification_status: CliGovernanceCheckStatus.WARN,
      diagnostic_summary: 'status=warn required_failures=1 fallback_roles=0 degraded_roles=0',
      next_action: 'Set OPENAI_API_KEY before doctor.',
      next_actions: ['Set OPENAI_API_KEY before doctor.'],
    });
    expect(verifyPayload.tool_transport_matrix).toEqual(onboardingPayload.tool_transport_matrix);
    expect(verifyPayload.role_binding_matrix).toEqual([]);
  });

  it('adds safe_local fix counts to doctor readiness composition without mutating probe truth', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [],
      roleEvaluations: [],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 0,
      degradedRoleCount: 1,
      fallbackRoleCount: 0,
      nextActions: ['Review adapter diagnostics before retrying doctor.'],
    });

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'doctor',
      executionId: 'doctor-safe-local',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.WARN,
      nextActions: verification.nextActions,
      enabledTools: [AdapterSurface.CODEX],
      adaptersConfig: sourceConfig.adapters,
      verification,
      dryRun: false,
      overwrite: false,
      singleToolAllRoles: false,
      safeLocalFixCount: 2,
    });
    const verifyPayload = runtime.createVerifyMatrixPayload({
      commandName: 'doctor',
      executionId: 'doctor-safe-local',
      verification,
      adaptersConfig: sourceConfig.adapters,
      nextActions: verification.nextActions,
      safeLocalFixCount: 2,
    });

    expect(onboardingPayload.diagnostic_summary).toBe(
      'status=warn required_failures=0 fallback_roles=0 degraded_roles=1 safe_local_fix=2',
    );
    expect(verifyPayload.diagnostic_summary).toBe(
      'status=warn required_failures=0 fallback_roles=0 degraded_roles=1 safe_local_fix=2',
    );
    expect(verifyPayload.next_action).toBe('Review adapter diagnostics before retrying doctor.');
    expect(verifyPayload.next_actions).toEqual([
      'Review adapter diagnostics before retrying doctor.',
    ]);
  });

  it('keeps explicit acp_exec onboarding truth separate from configured remote_api fields', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        transport: AdapterTransportKind.ACP_EXEC,
        remoteApi: {
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
          credentialEnvVar: 'OPENAI_API_KEY',
        },
      },
    ];
    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-acp-host-protocol',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
            transportKind: AdapterTransportKind.ACP_EXEC,
            requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
          }),
          capabilitySupportByCapability: new Map(),
          failureAttributions: ['environment_precondition'],
        },
      ],
      roleEvaluations: [],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 1,
      degradedRoleCount: 0,
      fallbackRoleCount: 0,
      nextActions: ['Investigate ACP host enablement before doctor.'],
    });

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'doctor',
      executionId: 'doctor-acp-123',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.WARN,
      nextActions: verification.nextActions,
      enabledTools: [AdapterSurface.CODEX],
      adaptersConfig: sourceConfig.adapters,
      verification,
      dryRun: false,
      overwrite: false,
      singleToolAllRoles: false,
    });

    expect(onboardingPayload.enabled_tools).toEqual([
      expect.objectContaining({
        tool_id: AdapterSurface.CODEX,
        transport_kind: AdapterTransportKind.ACP_EXEC,
        provider_kind: AdapterProviderKind.OPENAI,
        vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
        credential_mode: AdapterCredentialSource.ENV_EXPLICIT,
        endpoint_source: AdapterEndpointSource.VENDOR_DEFAULT,
      }),
    ]);
    expect(onboardingPayload.tool_transport_matrix).toEqual([
      expect.objectContaining({
        tool_id: AdapterSurface.CODEX,
        transport: AdapterTransportKind.ACP_EXEC,
        transport_kind: AdapterTransportKind.ACP_EXEC,
        provider_kind: AdapterProviderKind.OPENAI,
        vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
        credential_mode: AdapterCredentialSource.ENV_EXPLICIT,
        endpoint_source: AdapterEndpointSource.VENDOR_DEFAULT,
        acp_host_companion: {
          hostReadinessStatus: CliAcpHostReadinessStatus.BASELINE_ONLY,
          distributionBoundary: CliAcpHostDistributionBoundary.PACKAGED_DISTRIBUTION_PENDING,
          companionStateSummary: 'runtime_service_enablement_pending',
        },
      }),
    ]);
    expect(onboardingPayload.enabled_tools).toEqual([
      expect.objectContaining({
        acp_host_companion: {
          hostReadinessStatus: CliAcpHostReadinessStatus.BASELINE_ONLY,
          distributionBoundary: CliAcpHostDistributionBoundary.PACKAGED_DISTRIBUTION_PENDING,
          companionStateSummary: 'runtime_service_enablement_pending',
        },
      }),
    ]);
    expect(
      (onboardingPayload.enabled_tools[0] as Record<string, unknown>).launch_diagnostics,
    ).toBeUndefined();
  });

  it('summarizes ACP readiness evidence and projects companion payloads into verify matrices', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        transport: AdapterTransportKind.ACP_EXEC,
      },
    ];
    const healthCheck = buildLayeredHealthCheckResult({
      adapterId: 'codex-acp-host-protocol',
      surfaceId: AdapterSurface.CODEX,
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      selectedEntrypoint: AdapterSurface.CODEX,
      routeKey: 'cli.adapter.probe.codex',
      unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
      transportKind: AdapterTransportKind.ACP_EXEC,
      requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      diagnostics: [
        {
          layer: 'protocol',
          status: 'pass',
          code: 'protocol.acp_host_readiness_status',
          detail: 'runtime_service_ready',
        },
        {
          layer: 'protocol',
          status: 'pass',
          code: 'protocol.acp_distribution_boundary',
          detail: 'packaged_distribution_ready',
        },
        {
          layer: 'protocol',
          status: 'pass',
          code: 'protocol.acp_companion_state_summary',
          detail: 'runtime_service_and_distribution_ready',
        },
      ],
    });
    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
          healthCheck,
          capabilitySupportByCapability: new Map(),
          failureAttributions: ['environment_precondition'],
        },
      ],
      roleEvaluations: [
        {
          roleId: 'coder',
          roleProfileId: 'coder-default',
          required: true,
          primarySurface: AdapterSurface.CODEX,
          selectedSurface: AdapterSurface.CODEX,
          selectedBy: CliAdapterRoleSelectionSource.PRIMARY,
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
          healthCheck,
          failureAttributions: ['environment_precondition'],
          status: CliGovernanceCheckStatus.WARN,
        },
      ],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 0,
      degradedRoleCount: 1,
      fallbackRoleCount: 0,
      nextActions: ['Run ACP clean-room verify before support uplift.'],
    });

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'doctor',
      executionId: 'doctor-acp-ready',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.WARN,
      nextActions: verification.nextActions,
      enabledTools: [AdapterSurface.CODEX],
      adaptersConfig: sourceConfig.adapters,
      verification,
      dryRun: false,
      overwrite: false,
      singleToolAllRoles: false,
    });
    const verifyPayload = runtime.createVerifyMatrixPayload({
      commandName: 'verify',
      executionId: 'verify-acp-ready',
      verification,
      adaptersConfig: sourceConfig.adapters,
      nextActions: verification.nextActions,
    });

    expect(onboardingPayload.diagnostic_summary).toContain('acp_runtime_ready=1/1');
    expect(onboardingPayload.diagnostic_summary).toContain('acp_distribution_ready=1/1');
    expect(verifyPayload.diagnostic_summary).toContain('acp_runtime_ready=1/1');
    expect(verifyPayload.diagnostic_summary).toContain('acp_distribution_ready=1/1');
    expect(verifyPayload.tool_matrix).toEqual([
      expect.objectContaining({
        tool: AdapterSurface.CODEX,
        acp_host_companion: {
          hostReadinessStatus: 'runtime_service_ready',
          distributionBoundary: 'packaged_distribution_ready',
          companionStateSummary: 'runtime_service_and_distribution_ready',
        },
      }),
    ]);
    expect(verifyPayload.role_binding_matrix).toEqual([
      expect.objectContaining({
        primary_tool: AdapterSurface.CODEX,
        acp_host_companion: {
          hostReadinessStatus: 'runtime_service_ready',
          distributionBoundary: 'packaged_distribution_ready',
          companionStateSummary: 'runtime_service_and_distribution_ready',
        },
      }),
    ]);
  });

  it('keeps ACP clean-room verified companions visible without adding extra readiness counts', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        transport: AdapterTransportKind.ACP_EXEC,
      },
    ];
    const healthCheck = buildLayeredHealthCheckResult({
      adapterId: 'codex-acp-host-protocol',
      surfaceId: AdapterSurface.CODEX,
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      selectedEntrypoint: AdapterSurface.CODEX,
      routeKey: 'cli.adapter.probe.codex',
      unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
      transportKind: AdapterTransportKind.ACP_EXEC,
      requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      diagnostics: [
        {
          layer: 'protocol',
          status: 'pass',
          code: 'protocol.acp_host_readiness_status',
          detail: 'runtime_service_ready',
        },
        {
          layer: 'protocol',
          status: 'pass',
          code: 'protocol.acp_distribution_boundary',
          detail: 'packaged_distribution_ready',
        },
        {
          layer: 'protocol',
          status: 'pass',
          code: 'protocol.acp_companion_state_summary',
          detail: CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
        },
      ],
    });
    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
          healthCheck,
          capabilitySupportByCapability: new Map(),
          failureAttributions: ['environment_precondition'],
        },
      ],
      roleEvaluations: [
        {
          roleId: 'coder',
          roleProfileId: 'coder-default',
          required: true,
          primarySurface: AdapterSurface.CODEX,
          selectedSurface: AdapterSurface.CODEX,
          selectedBy: CliAdapterRoleSelectionSource.PRIMARY,
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
          healthCheck,
          failureAttributions: ['environment_precondition'],
          status: CliGovernanceCheckStatus.WARN,
        },
      ],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 0,
      degradedRoleCount: 1,
      fallbackRoleCount: 0,
      nextActions: [],
    });

    const verifyPayload = runtime.createVerifyMatrixPayload({
      commandName: 'verify',
      executionId: 'verify-acp-cleanroom-ready',
      verification,
      adaptersConfig: sourceConfig.adapters,
      nextActions: verification.nextActions,
    });

    expect(verifyPayload.diagnostic_summary).toContain('acp_runtime_ready=1/1');
    expect(verifyPayload.diagnostic_summary).toContain('acp_distribution_ready=1/1');
    expect(verifyPayload.tool_matrix).toEqual([
      expect.objectContaining({
        tool: AdapterSurface.CODEX,
        acp_host_companion: {
          hostReadinessStatus: 'runtime_service_ready',
          distributionBoundary: 'packaged_distribution_ready',
          companionStateSummary: CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
        },
      }),
    ]);
  });

  it('distinguishes inferred remote_api selection from an explicit transport lock', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        remoteApi: {
          provider: AdapterProviderKind.OPENAI,
          model: 'gpt-5',
        },
      },
    ];

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'connect',
      executionId: 'connect-inferred-transport',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.PASS,
      nextActions: [],
      enabledTools: [AdapterSurface.CODEX],
      adaptersConfig: sourceConfig.adapters,
      dryRun: true,
      overwrite: false,
      singleToolAllRoles: false,
    });

    expect(onboardingPayload.enabled_tools).toEqual([
      expect.objectContaining({
        tool_id: AdapterSurface.CODEX,
        transport_kind: AdapterTransportKind.REMOTE_API,
        transport_selection_source: AdapterTransportSelectionSource.INFERRED_FROM_REMOTE_API,
        transport_selection_locked: false,
        configured_remote_api: expect.objectContaining({
          provider_kind: AdapterProviderKind.OPENAI,
          vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
          credential_mode: AdapterCredentialSource.ENV_DEFAULT,
          endpoint_source: AdapterEndpointSource.VENDOR_DEFAULT,
        }),
        invoke_liveness_diagnostics: expect.objectContaining({
          transport_kind: AdapterTransportKind.REMOTE_API,
          provider_kind: AdapterProviderKind.OPENAI,
          vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
        }),
      }),
    ]);
  });

  it('does not project configured remote_api fields as selected cli_exec truth', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        transport: AdapterTransportKind.CLI_EXEC,
        remoteApi: {
          provider: AdapterProviderKind.OPENAI,
          model: 'gpt-5',
          credentialEnvVar: 'OPENAI_API_KEY',
        },
      },
    ];

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'connect',
      executionId: 'connect-explicit-cli-exec',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.PASS,
      nextActions: [],
      enabledTools: [AdapterSurface.CODEX],
      adaptersConfig: sourceConfig.adapters,
      dryRun: true,
      overwrite: false,
      singleToolAllRoles: false,
    });

    expect(onboardingPayload.enabled_tools).toEqual([
      expect.objectContaining({
        tool_id: AdapterSurface.CODEX,
        transport_kind: AdapterTransportKind.CLI_EXEC,
        provider_kind: null,
        vendor_binding_kind: null,
        model: null,
        credential_mode: null,
        endpoint_source: null,
        transport_selection_source: AdapterTransportSelectionSource.CONFIG_EXPLICIT,
        transport_selection_locked: true,
        configured_remote_api: expect.objectContaining({
          provider_kind: AdapterProviderKind.OPENAI,
          vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
          credential_mode: AdapterCredentialSource.ENV_EXPLICIT,
        }),
        invoke_liveness_diagnostics: expect.objectContaining({
          transport_kind: AdapterTransportKind.CLI_EXEC,
          provider_kind: null,
          vendor_binding_kind: null,
          model: null,
          request_timeout_ms: 30000,
          max_retries: 2,
        }),
      }),
    ]);
  });

  it('projects invoke-liveness diagnostics into verify role binding rows', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        transport: AdapterTransportKind.REMOTE_API,
        remoteApi: {
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
          credentialEnvVar: 'OPENAI_API_KEY',
          requestTimeoutMs: 90000,
          maxRetries: 2,
        },
      },
    ];

    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [],
      roleEvaluations: [
        {
          roleId: 'planner',
          roleProfileId: 'planner-default',
          required: true,
          primarySurface: AdapterSurface.CODEX,
          selectedSurface: AdapterSurface.CODEX,
          selectedBy: CliAdapterRoleSelectionSource.PRIMARY,
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          unavailableReasons: ['credential_missing:codex:OPENAI_API_KEY'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.role.planner',
            unavailableReasons: ['credential_missing:codex:OPENAI_API_KEY'],
            transportKind: AdapterTransportKind.REMOTE_API,
            providerKind: AdapterProviderKind.OPENAI,
            vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
            credentialSource: AdapterCredentialSource.ENV_DEFAULT,
            endpointSource: AdapterEndpointSource.VENDOR_DEFAULT,
            requestCancellationMode: AdapterRequestCancellationMode.LOCAL_ABORT_ONLY,
          }),
          failureAttributions: ['environment_precondition'],
          status: CliGovernanceCheckStatus.WARN,
        },
      ],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 0,
      degradedRoleCount: 1,
      fallbackRoleCount: 0,
      nextActions: ['Set OPENAI_API_KEY before verify.'],
    });

    const verifyPayload = runtime.createVerifyMatrixPayload({
      executionId: 'verify-456',
      verification,
      adaptersConfig: sourceConfig.adapters,
    });

    expect(verifyPayload.role_binding_matrix).toEqual([
      expect.objectContaining({
        role_profile_id: 'planner-default',
        primary_tool: AdapterSurface.CODEX,
        binding_status: CliGovernanceCheckStatus.WARN,
        invoke_liveness_diagnostics: expect.objectContaining({
          transport_kind: AdapterTransportKind.REMOTE_API,
          provider_kind: AdapterProviderKind.OPENAI,
          vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
          request_timeout_ms: 90000,
          max_retries: 2,
          request_cancellation_mode: AdapterRequestCancellationMode.LOCAL_ABORT_ONLY,
          reason_codes: ['auth.credential_missing'],
          unavailable_reasons: ['credential_missing:codex:OPENAI_API_KEY'],
          failure_attributions: ['environment_precondition'],
        }),
      }),
    ]);
  });

  it('keeps probe availability truth separate from fallback binding status in verify tool rows', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();

    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          unavailableReasons: [],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: [],
            transportKind: AdapterTransportKind.CLI_EXEC,
          }),
          capabilitySupportByCapability: new Map(),
          failureAttributions: [],
        },
        {
          toolId: AdapterSurface.CLAUDE_CODE,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['credential_missing:claude-code:provider-local'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'claude-code-agent',
            surfaceId: AdapterSurface.CLAUDE_CODE,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CLAUDE_CODE,
            routeKey: 'cli.adapter.probe.claude-code',
            unavailableReasons: ['credential_missing:claude-code:provider-local'],
            transportKind: AdapterTransportKind.CLI_EXEC,
          }),
          capabilitySupportByCapability: new Map(),
          failureAttributions: ['environment_precondition'],
        },
      ],
      roleEvaluations: [
        {
          roleId: 'planner',
          roleProfileId: 'planner-default',
          required: true,
          primarySurface: AdapterSurface.CLAUDE_CODE,
          selectedSurface: AdapterSurface.CODEX,
          selectedBy: CliAdapterRoleSelectionSource.FALLBACK,
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          unavailableReasons: ['surface_unavailable:claude-code:credential_missing:provider-local'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'planner',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.DEGRADED,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.role.planner',
            fallbackAllowed: true,
            unavailableReasons: [
              'surface_unavailable:claude-code:credential_missing:provider-local',
            ],
            transportKind: AdapterTransportKind.CLI_EXEC,
          }),
          failureAttributions: ['environment_precondition'],
          status: CliGovernanceCheckStatus.WARN,
        },
      ],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 0,
      degradedRoleCount: 1,
      fallbackRoleCount: 1,
      nextActions: ['Review routing priorities before unattended execution.'],
    });

    const verifyPayload = runtime.createVerifyMatrixPayload({
      executionId: 'verify-fallback-status-split',
      verification,
      adaptersConfig: sourceConfig.adapters,
    });

    expect(verifyPayload.tool_matrix).toEqual([
      expect.objectContaining({
        tool: AdapterSurface.CODEX,
        surface: AdapterSurface.CODEX,
        role_profile_id: 'planner-default',
        availability_status: AgentAvailabilityStatus.AVAILABLE,
        binding_status: CliGovernanceCheckStatus.WARN,
        selected_by: CliAdapterRoleSelectionSource.FALLBACK,
        binding_unavailable_reasons: [
          'surface_unavailable:claude-code:credential_missing:provider-local',
        ],
        binding_failure_attributions: ['environment_precondition'],
        invoke_liveness_diagnostics: expect.objectContaining({
          unavailable_reasons: [],
          failure_attributions: [],
        }),
      }),
    ]);
  });

  it('preserves selected tool transport and remote-api config when building connect candidate config', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        transport: AdapterTransportKind.REMOTE_API,
        remoteApi: {
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
          credentialEnvVar: 'OPENAI_API_KEY',
          allowProviderLocalConfig: true,
        },
      },
      {
        toolId: AdapterSurface.CLAUDE_CODE,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
    ];

    const resolution = runtime.buildConnectCandidateConfig({
      sourceConfig,
      presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
      requestedTools: [AdapterSurface.CODEX],
      toolTransportOverrides: [],
      remoteApiOverrides: [],
      overwrite: true,
      singleToolAllRoles: false,
      roleBindingOverrides: [],
    });

    expect(resolution.candidateAdaptersConfig.tools).toEqual([
      expect.objectContaining({
        toolId: AdapterSurface.CODEX,
        transport: AdapterTransportKind.REMOTE_API,
        remoteApi: expect.objectContaining({
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
          credentialEnvVar: 'OPENAI_API_KEY',
          allowProviderLocalConfig: true,
        }),
      }),
    ]);
  });

  it('materializes inferred remote_api transport for transport-aware connect candidates', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        remoteApi: {
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
          credentialEnvVar: 'OPENAI_API_KEY',
        },
      },
    ];

    const resolution = runtime.buildConnectCandidateConfig({
      sourceConfig,
      presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
      requestedTools: [AdapterSurface.CODEX],
      toolTransportOverrides: [],
      remoteApiOverrides: [],
      overwrite: true,
      singleToolAllRoles: false,
      roleBindingOverrides: [],
    });

    expect(resolution.candidateAdaptersConfig.tools).toEqual([
      expect.objectContaining({
        toolId: AdapterSurface.CODEX,
        transport: AdapterTransportKind.REMOTE_API,
        remoteApi: expect.objectContaining({
          provider: AdapterProviderKind.OPENAI,
          model: 'gpt-5',
        }),
      }),
    ]);
  });

  it('synthesizes first-time remote_api config from connect authoring overrides', () => {
    const runtime = new CliAgentOnboardingRuntime();

    const resolution = runtime.buildConnectCandidateConfig({
      sourceConfig: createGovernorConfigFixture(),
      presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
      requestedTools: [AdapterSurface.CODEX],
      toolTransportOverrides: [],
      remoteApiOverrides: [
        {
          toolId: AdapterSurface.CODEX,
          model: 'gpt-5',
        },
      ],
      overwrite: true,
      singleToolAllRoles: false,
      roleBindingOverrides: [],
    });

    expect(resolution.candidateAdaptersConfig.tools).toEqual([
      expect.objectContaining({
        toolId: AdapterSurface.CODEX,
        transport: AdapterTransportKind.REMOTE_API,
        remoteApi: expect.objectContaining({
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
          credentialEnvVar: 'OPENAI_API_KEY',
        }),
      }),
    ]);
  });

  it('applies per-tool transport overrides while preserving configured remote_api truth', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        remoteApi: {
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
          credentialEnvVar: 'OPENAI_API_KEY',
        },
      },
    ];

    const resolution = runtime.buildConnectCandidateConfig({
      sourceConfig,
      presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
      requestedTools: [AdapterSurface.CODEX],
      toolTransportOverrides: [
        {
          toolId: AdapterSurface.CODEX,
          transport: AdapterTransportKind.CLI_EXEC,
        },
      ],
      remoteApiOverrides: [],
      overwrite: true,
      singleToolAllRoles: false,
      roleBindingOverrides: [],
    });

    expect(resolution.candidateAdaptersConfig.tools).toEqual([
      expect.objectContaining({
        toolId: AdapterSurface.CODEX,
        transport: AdapterTransportKind.CLI_EXEC,
        remoteApi: expect.objectContaining({
          provider: AdapterProviderKind.OPENAI,
          model: 'gpt-5',
        }),
      }),
    ]);
  });

  it('keeps the default multi-tool selection stable when one tool gets a transport override', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();

    const resolution = runtime.buildConnectCandidateConfig({
      sourceConfig,
      presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
      requestedTools: [],
      toolTransportOverrides: [
        {
          toolId: AdapterSurface.CODEX,
          transport: AdapterTransportKind.CLI_EXEC,
        },
      ],
      remoteApiOverrides: [],
      overwrite: true,
      singleToolAllRoles: false,
      roleBindingOverrides: [],
    });

    expect(resolution.selectedTools).toEqual([
      AdapterSurface.CODEX,
      AdapterSurface.CLAUDE_CODE,
      AdapterSurface.GITHUB_COPILOT,
    ]);
    expect(resolution.candidateAdaptersConfig.routing.roleBindings.reviewer).toEqual({
      primarySurface: AdapterSurface.CLAUDE_CODE,
      fallbackSurfaces: [AdapterSurface.CODEX, AdapterSurface.GITHUB_COPILOT],
    });
    expect(resolution.candidateAdaptersConfig.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolId: AdapterSurface.CODEX,
          transport: AdapterTransportKind.CLI_EXEC,
        }),
        expect.objectContaining({
          toolId: AdapterSurface.CLAUDE_CODE,
        }),
        expect.objectContaining({
          toolId: AdapterSurface.GITHUB_COPILOT,
        }),
      ]),
    );
  });

  it('rejects transport overrides for tools outside the explicit selected tool scope', () => {
    const runtime = new CliAgentOnboardingRuntime();

    expect(() =>
      runtime.buildConnectCandidateConfig({
        sourceConfig: createGovernorConfigFixture(),
        presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
        requestedTools: [AdapterSurface.CLAUDE_CODE],
        toolTransportOverrides: [
          {
            toolId: AdapterSurface.CODEX,
            transport: AdapterTransportKind.CLI_EXEC,
          },
        ],
        remoteApiOverrides: [],
        overwrite: true,
        singleToolAllRoles: false,
        roleBindingOverrides: [],
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
      }),
    );
  });

  it('rejects remote_api authoring overrides for tools outside the explicit selected tool scope', () => {
    const runtime = new CliAgentOnboardingRuntime();

    expect(() =>
      runtime.buildConnectCandidateConfig({
        sourceConfig: createGovernorConfigFixture(),
        presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
        requestedTools: [AdapterSurface.CLAUDE_CODE],
        toolTransportOverrides: [],
        remoteApiOverrides: [
          {
            toolId: AdapterSurface.CODEX,
            model: 'gpt-5',
          },
        ],
        overwrite: true,
        singleToolAllRoles: false,
        roleBindingOverrides: [],
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
      }),
    );
  });

  it('requires a model when first-time remote_api authoring starts from an empty config', () => {
    const runtime = new CliAgentOnboardingRuntime();

    expect(() =>
      runtime.buildConnectCandidateConfig({
        sourceConfig: createGovernorConfigFixture(),
        presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
        requestedTools: [AdapterSurface.CODEX],
        toolTransportOverrides: [],
        remoteApiOverrides: [
          {
            toolId: AdapterSurface.CODEX,
            credentialEnvVar: 'OPENAI_API_KEY',
          },
        ],
        overwrite: true,
        singleToolAllRoles: false,
        roleBindingOverrides: [],
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
      }),
    );
  });

  it('rejects remote_api transport overrides when the tool lacks remoteApi config', () => {
    const runtime = new CliAgentOnboardingRuntime();

    expect(() =>
      runtime.buildConnectCandidateConfig({
        sourceConfig: createGovernorConfigFixture(),
        presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
        requestedTools: [AdapterSurface.CODEX],
        toolTransportOverrides: [
          {
            toolId: AdapterSurface.CODEX,
            transport: AdapterTransportKind.REMOTE_API,
          },
        ],
        remoteApiOverrides: [],
        overwrite: true,
        singleToolAllRoles: false,
        roleBindingOverrides: [],
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
      }),
    );
  });

  it('rejects unsupported connect transport overrides for github-copilot', () => {
    const runtime = new CliAgentOnboardingRuntime();

    expect(() =>
      runtime.buildConnectCandidateConfig({
        sourceConfig: createGovernorConfigFixture(),
        presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
        requestedTools: [AdapterSurface.GITHUB_COPILOT],
        toolTransportOverrides: [
          {
            toolId: AdapterSurface.GITHUB_COPILOT,
            transport: AdapterTransportKind.REMOTE_API,
          },
        ],
        remoteApiOverrides: [],
        overwrite: true,
        singleToolAllRoles: false,
        roleBindingOverrides: [],
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
      }),
    );
  });

  it('preserves selected tool local-model config when building connect candidate config', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.OLLAMA,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        localModel: {
          provider: LocalModelProvider.OLLAMA,
          endpoint: 'http://127.0.0.1:11434',
          model: 'qwen2.5-coder:7b',
        },
      },
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
    ];

    const resolution = runtime.buildConnectCandidateConfig({
      sourceConfig,
      presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
      requestedTools: [AdapterSurface.OLLAMA],
      toolTransportOverrides: [],
      remoteApiOverrides: [],
      overwrite: true,
      singleToolAllRoles: false,
      roleBindingOverrides: [],
    });

    expect(resolution.candidateAdaptersConfig.tools).toEqual([
      expect.objectContaining({
        toolId: AdapterSurface.OLLAMA,
        localModel: expect.objectContaining({
          provider: LocalModelProvider.OLLAMA,
          endpoint: 'http://127.0.0.1:11434',
          model: 'qwen2.5-coder:7b',
        }),
      }),
    ]);
  });

  it('projects CLI-backed runtime budget defaults into invoke-liveness diagnostics', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();

    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.PASS,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          unavailableReasons: [],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: [],
            transportKind: AdapterTransportKind.CLI_EXEC,
            requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
          }),
          capabilitySupportByCapability: new Map(),
          failureAttributions: [],
        },
      ],
      roleEvaluations: [],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 0,
      degradedRoleCount: 0,
      fallbackRoleCount: 0,
      nextActions: [],
    });

    const verifyPayload = runtime.createVerifyMatrixPayload({
      executionId: 'verify-cli-budget',
      verification,
      adaptersConfig: sourceConfig.adapters,
    });

    expect(verifyPayload.tool_transport_matrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tool_id: AdapterSurface.CODEX,
          transport: AdapterTransportKind.CLI_EXEC,
          transport_kind: AdapterTransportKind.CLI_EXEC,
          transport_selection_source: AdapterTransportSelectionSource.SURFACE_DEFAULT,
          transport_selection_locked: false,
          invoke_liveness_diagnostics: expect.objectContaining({
            transport_kind: AdapterTransportKind.CLI_EXEC,
            request_timeout_ms: 30000,
            max_retries: 2,
            route_key: 'cli.adapter.probe.codex',
          }),
        }),
      ]),
    );
  });

  it('preserves cli_exec selected entrypoint and cancellation truth in verify matrix probe rows', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();

    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['health_check_invalid_response:codex:malformed_json'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['health_check_invalid_response:codex:malformed_json'],
            transportKind: AdapterTransportKind.CLI_EXEC,
            requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
            diagnostics: [
              {
                layer: 'install',
                status: 'pass',
                code: 'install.entrypoint_resolution',
                detail: AdapterSurface.CODEX,
              },
              {
                layer: 'protocol',
                status: 'pass',
                code: 'protocol.shell_wrapped',
                detail: 'false',
              },
              {
                layer: 'protocol',
                status: 'pass',
                code: 'protocol.process_tree_policy',
                detail: 'process_group_best_effort',
              },
            ],
          }),
          capabilitySupportByCapability: new Map(),
          failureAttributions: ['execution_runtime'],
        },
      ],
      roleEvaluations: [],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 1,
      degradedRoleCount: 0,
      fallbackRoleCount: 0,
      nextActions: ['Re-run doctor after fixing malformed cli_exec output.'],
    });

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'doctor',
      executionId: 'verify-cli-exec-preserved-facts',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.FAIL,
      nextActions: verification.nextActions,
      enabledTools: [AdapterSurface.CODEX],
      adaptersConfig: sourceConfig.adapters,
      verification,
      dryRun: false,
      overwrite: false,
      singleToolAllRoles: false,
    });
    const verifyPayload = runtime.createVerifyMatrixPayload({
      executionId: 'verify-cli-exec-preserved-facts',
      verification,
      adaptersConfig: sourceConfig.adapters,
    });

    const onboardingEnabledToolRow = onboardingPayload.enabled_tools[0] as Record<string, unknown>;
    const onboardingTransportRow = onboardingPayload.tool_transport_matrix[0] as Record<
      string,
      unknown
    >;
    const codexRow = verifyPayload.tool_transport_matrix[0] as Record<string, unknown>;
    const launchDiagnostics = codexRow.launch_diagnostics as Record<string, unknown>;
    const probeTruth = codexRow.probe_truth as Record<string, unknown>;
    const invokeLivenessDiagnostics = codexRow.invoke_liveness_diagnostics as Record<
      string,
      unknown
    >;

    expect(invokeLivenessDiagnostics).toEqual(
      expect.objectContaining({
        selected_entrypoint: AdapterSurface.CODEX,
        request_cancellation_mode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      }),
    );
    expect(launchDiagnostics).toEqual(
      expect.objectContaining({
        selected_entrypoint: AdapterSurface.CODEX,
        request_cancellation_mode: AdapterRequestCancellationMode.NOT_SUPPORTED,
        shell_wrapped: false,
        process_tree_policy: 'process_group_best_effort',
      }),
    );
    expect(onboardingEnabledToolRow.launch_diagnostics).toEqual(launchDiagnostics);
    expect(onboardingTransportRow.launch_diagnostics).toEqual(launchDiagnostics);
    expectNativeCliExecPreservedFacts('probe_protocol_parse_failed', {
      launch_diagnostics_preserved:
        launchDiagnostics.selected_entrypoint === AdapterSurface.CODEX &&
        Array.isArray(probeTruth.reason_codes) &&
        probeTruth.reason_codes.includes('semantic.invalid_response') &&
        launchDiagnostics.process_tree_policy === 'process_group_best_effort',
      adapter_launch_truth_projected:
        launchDiagnostics.selected_entrypoint === AdapterSurface.CODEX &&
        launchDiagnostics.request_cancellation_mode ===
          AdapterRequestCancellationMode.NOT_SUPPORTED &&
        codexRow.transport_kind === AdapterTransportKind.CLI_EXEC,
    });
  });

  it('projects cli_exec spawn_error_code into the additive launch_diagnostics companion', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.FAIL,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['spawn_failed:codex:ENOENT'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['spawn_failed:codex:ENOENT'],
            transportKind: AdapterTransportKind.CLI_EXEC,
            requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
            diagnostics: [
              {
                layer: 'install',
                status: 'pass',
                code: 'install.entrypoint_resolution',
                detail: AdapterSurface.CODEX,
              },
              {
                layer: 'protocol',
                status: 'pass',
                code: 'protocol.shell_wrapped',
                detail: 'true',
              },
              {
                layer: 'install',
                status: 'fail',
                code: 'install.spawn_error_code',
                detail: 'ENOENT',
              },
            ],
          }),
          capabilitySupportByCapability: new Map(),
          failureAttributions: ['environment_precondition'],
        },
      ],
      roleEvaluations: [],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 1,
      degradedRoleCount: 0,
      fallbackRoleCount: 0,
      nextActions: ['Install codex before retrying doctor.'],
    });

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'doctor',
      executionId: 'verify-cli-exec-spawn-error',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.FAIL,
      nextActions: verification.nextActions,
      enabledTools: [AdapterSurface.CODEX],
      adaptersConfig: sourceConfig.adapters,
      verification,
      dryRun: false,
      overwrite: false,
      singleToolAllRoles: false,
    });
    const verifyPayload = runtime.createVerifyMatrixPayload({
      executionId: 'verify-cli-exec-spawn-error',
      verification,
      adaptersConfig: sourceConfig.adapters,
    });
    const codexRow = verifyPayload.tool_transport_matrix[0] as Record<string, unknown>;
    const onboardingEnabledToolRow = onboardingPayload.enabled_tools[0] as Record<string, unknown>;
    const onboardingTransportRow = onboardingPayload.tool_transport_matrix[0] as Record<
      string,
      unknown
    >;

    expect(codexRow.launch_diagnostics).toEqual({
      selected_entrypoint: AdapterSurface.CODEX,
      request_cancellation_mode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      shell_wrapped: true,
      spawn_error_code: 'ENOENT',
    });
    expect(onboardingEnabledToolRow.launch_diagnostics).toEqual(codexRow.launch_diagnostics);
    expect(onboardingTransportRow.launch_diagnostics).toEqual(codexRow.launch_diagnostics);
  });

  it('projects cli_exec non-zero consumer launch diagnostics into verify tool and role matrices', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['non_zero_exit:codex:1'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['non_zero_exit:codex:1'],
            transportKind: AdapterTransportKind.CLI_EXEC,
            requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
            diagnostics: [
              {
                layer: 'install',
                status: 'pass',
                code: 'install.entrypoint_resolution',
                detail: AdapterSurface.CODEX,
              },
              {
                layer: 'protocol',
                status: 'pass',
                code: 'protocol.shell_wrapped',
                detail: 'false',
              },
              {
                layer: 'protocol',
                status: 'pass',
                code: 'protocol.process_tree_policy',
                detail: 'process_group_best_effort',
              },
            ],
          }),
          capabilitySupportByCapability: new Map(),
          failureAttributions: ['execution_runtime'],
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
          unavailableReasons: ['non_zero_exit:codex:1'],
          failureAttributions: ['execution_runtime'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.role.reviewer',
            unavailableReasons: ['non_zero_exit:codex:1'],
            transportKind: AdapterTransportKind.CLI_EXEC,
            requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
          }),
          status: CliGovernanceCheckStatus.WARN,
        },
      ],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 0,
      degradedRoleCount: 1,
      fallbackRoleCount: 0,
      nextActions: ['Inspect non-zero cli_exec output before retrying.'],
    });

    const verifyPayload = runtime.createVerifyMatrixPayload({
      executionId: 'verify-cli-exec-non-zero',
      verification,
      adaptersConfig: sourceConfig.adapters,
    });
    const toolMatrixRow = verifyPayload.tool_matrix[0] as Record<string, unknown>;
    const roleBindingRow = verifyPayload.role_binding_matrix[0] as Record<string, unknown>;

    expect(toolMatrixRow.launch_diagnostics).toEqual({
      selected_entrypoint: AdapterSurface.CODEX,
      request_cancellation_mode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      shell_wrapped: false,
      process_tree_policy: 'process_group_best_effort',
    });
    expect(roleBindingRow.launch_diagnostics).toEqual(toolMatrixRow.launch_diagnostics);
    expectNativeCliExecPreservedFacts('non_zero_exit', {
      launch_diagnostics_preserved:
        (toolMatrixRow.launch_diagnostics as Record<string, unknown>).selected_entrypoint ===
          AdapterSurface.CODEX &&
        (roleBindingRow.launch_diagnostics as Record<string, unknown>).process_tree_policy ===
          'process_group_best_effort',
      adapter_launch_truth_projected:
        (toolMatrixRow.launch_diagnostics as Record<string, unknown>).request_cancellation_mode ===
        AdapterRequestCancellationMode.NOT_SUPPORTED,
    });
  });

  it('projects cli_exec signal-exit launch diagnostics into verify tool and role matrices', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    const verification = createCliAdapterVerificationResolution({
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          configuredAvailability: AdapterAvailability.AVAILABLE,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['signal_exit:codex:SIGTERM'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['signal_exit:codex:SIGTERM'],
            transportKind: AdapterTransportKind.CLI_EXEC,
            requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
            diagnostics: [
              {
                layer: 'install',
                status: 'pass',
                code: 'install.entrypoint_resolution',
                detail: AdapterSurface.CODEX,
              },
              {
                layer: 'protocol',
                status: 'pass',
                code: 'protocol.shell_wrapped',
                detail: 'true',
              },
              {
                layer: 'protocol',
                status: 'pass',
                code: 'protocol.process_tree_policy',
                detail: 'process_group_best_effort',
              },
            ],
          }),
          capabilitySupportByCapability: new Map(),
          failureAttributions: ['execution_runtime'],
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
          unavailableReasons: ['signal_exit:codex:SIGTERM'],
          failureAttributions: ['execution_runtime'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.role.reviewer',
            unavailableReasons: ['signal_exit:codex:SIGTERM'],
            transportKind: AdapterTransportKind.CLI_EXEC,
            requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
          }),
          status: CliGovernanceCheckStatus.WARN,
        },
      ],
      requiredRoleCount: 1,
      requiredRoleFailedCount: 0,
      degradedRoleCount: 1,
      fallbackRoleCount: 0,
      nextActions: ['Inspect signal-terminated cli_exec output before retrying.'],
    });

    const verifyPayload = runtime.createVerifyMatrixPayload({
      executionId: 'verify-cli-exec-signal-exit',
      verification,
      adaptersConfig: sourceConfig.adapters,
    });
    const toolMatrixRow = verifyPayload.tool_matrix[0] as Record<string, unknown>;
    const roleBindingRow = verifyPayload.role_binding_matrix[0] as Record<string, unknown>;

    expect(toolMatrixRow.launch_diagnostics).toEqual({
      selected_entrypoint: AdapterSurface.CODEX,
      request_cancellation_mode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      shell_wrapped: true,
      process_tree_policy: 'process_group_best_effort',
    });
    expect(roleBindingRow.launch_diagnostics).toEqual(toolMatrixRow.launch_diagnostics);
    expectNativeCliExecPreservedFacts('signal_exit', {
      launch_diagnostics_preserved:
        (toolMatrixRow.launch_diagnostics as Record<string, unknown>).shell_wrapped === true &&
        (roleBindingRow.launch_diagnostics as Record<string, unknown>).selected_entrypoint ===
          AdapterSurface.CODEX,
      adapter_launch_truth_projected:
        (toolMatrixRow.launch_diagnostics as Record<string, unknown>).selected_entrypoint ===
          AdapterSurface.CODEX &&
        (toolMatrixRow.launch_diagnostics as Record<string, unknown>).request_cancellation_mode ===
          AdapterRequestCancellationMode.NOT_SUPPORTED,
    });
  });

  it('projects default cli_exec transport truth for Claude Code without explicit transport config', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'connect',
      executionId: 'connect-claude-default-transport',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.PASS,
      nextActions: [],
      enabledTools: [AdapterSurface.CLAUDE_CODE],
      adaptersConfig: sourceConfig.adapters,
      dryRun: true,
      overwrite: false,
      singleToolAllRoles: false,
    });

    expect(onboardingPayload.tool_transport_matrix).toEqual([
      expect.objectContaining({
        tool_id: AdapterSurface.CLAUDE_CODE,
        transport: AdapterTransportKind.CLI_EXEC,
        transport_kind: AdapterTransportKind.CLI_EXEC,
        transport_selection_source: AdapterTransportSelectionSource.SURFACE_DEFAULT,
        transport_selection_locked: false,
        invoke_liveness_diagnostics: expect.objectContaining({
          transport_kind: AdapterTransportKind.CLI_EXEC,
          request_timeout_ms: 30000,
          max_retries: 2,
        }),
      }),
    ]);
  });

  it('keeps configured_remote_api nested while explicit cli_exec rows stay provider-null', () => {
    const runtime = new CliAgentOnboardingRuntime();
    const sourceConfig = createGovernorConfigFixture();
    sourceConfig.adapters.tools = [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
        transport: AdapterTransportKind.CLI_EXEC,
        remoteApi: {
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
          credentialEnvVar: 'OPENAI_API_KEY',
        },
      },
    ];

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'connect',
      executionId: 'connect-explicit-cli-exec',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.PASS,
      nextActions: [],
      enabledTools: [AdapterSurface.CODEX],
      adaptersConfig: sourceConfig.adapters,
      dryRun: true,
      overwrite: false,
      singleToolAllRoles: false,
    });

    expect(onboardingPayload.enabled_tools).toEqual([
      expect.objectContaining({
        tool_id: AdapterSurface.CODEX,
        transport_kind: AdapterTransportKind.CLI_EXEC,
        provider_kind: null,
        vendor_binding_kind: null,
        model: null,
        credential_mode: null,
        endpoint_source: null,
        configured_remote_api: expect.objectContaining({
          provider_kind: AdapterProviderKind.OPENAI,
          vendor_binding_kind: AdapterVendorBindingKind.OPENAI_RESPONSES,
          model: 'gpt-5',
        }),
      }),
    ]);
  });
});
