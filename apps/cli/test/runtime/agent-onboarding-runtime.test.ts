import {
  AgentAvailabilityStatus,
  buildLayeredHealthCheckResult,
} from '@repo-ai-governor/adapter-sdk';
import { WorkspaceMode } from '@repo-ai-governor/config';
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
} from '@repo-ai-governor/shared';
import { CliAgentOnboardingPreset } from '../../src/constants/cli-agent-onboarding.constant.js';
import {
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliAgentOnboardingRuntime } from '../../src/runtime/agent-onboarding-runtime.js';

function createGovernorConfigFixture() {
  return {
    schemaVersion: '1.1',
    workspace: {
      mode: WorkspaceMode.REPO_LOCAL,
      migrationPolicy: 'copy_verify_switch_rollback',
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
            migrationPolicy: 'copy_verify_switch_rollback',
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
    const verification = {
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
      nextActions: ['Set OPENAI_API_KEY before verify.'],
    };

    const onboardingPayload = runtime.createOnboardingContractPayload({
      commandName: 'verify',
      executionId: 'verify-123',
      workspaceId: 'workspace-1',
      verificationStatus: CliGovernanceCheckStatus.WARN,
      nextActions: verification.nextActions,
      enabledTools: [AdapterSurface.CODEX],
      adaptersConfig: sourceConfig.adapters,
      verification,
      dryRun: false,
      overwrite: false,
      singleToolAllRoles: false,
      diagnosticSummary: 'status=warn',
    });
    const verifyPayload = runtime.createVerifyMatrixPayload({
      executionId: 'verify-123',
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
    expect(verifyPayload.tool_transport_matrix).toEqual(onboardingPayload.tool_transport_matrix);
    expect(verifyPayload.role_binding_matrix).toEqual([]);
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
      diagnosticSummary: 'status=pass',
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

    const verification = {
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
    };

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

    const verification = {
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
    };

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

    const verification = {
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
            requestCancellationMode: AdapterRequestCancellationMode.PROCESS_SIGNAL,
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
    };

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
      diagnosticSummary: 'status=pass',
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
});
