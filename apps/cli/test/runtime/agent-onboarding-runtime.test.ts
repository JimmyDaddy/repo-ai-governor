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
  AdapterVendorBindingKind,
  GovernorErrorCode,
} from '@repo-ai-governor/shared';
import { CliAgentOnboardingPreset } from '../../src/constants/cli-agent-onboarding.constant.js';
import { CliGovernanceCheckStatus } from '../../src/constants/cli-governance-runtime.constant.js';
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

    expect(onboardingPayload.tool_transport_matrix).toEqual([
      expect.objectContaining({
        tool_id: AdapterSurface.CODEX,
        transport: AdapterTransportKind.REMOTE_API,
        remote_api_candidate: expect.objectContaining({
          provider: AdapterProviderKind.OPENAI,
          vendor_binding: AdapterVendorBindingKind.OPENAI_RESPONSES,
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
        }),
      }),
    ]);
    expect(verifyPayload.tool_transport_matrix).toEqual(onboardingPayload.tool_transport_matrix);
  });
});
