import {
  AgentAvailabilityStatus,
  buildLayeredHealthCheckResult,
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig } from '@repo-ai-governor/config';
import {
  AdapterAvailability,
  AdapterCapabilitySnapshotSource,
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  DefaultRoleProfileId,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import {
  CLI_ACP_HOST_COMPANION_STATE_SUMMARY,
  CliAcpHostDiagnosticCode,
  CliAcpHostDistributionBoundary,
  CliAcpHostReadinessStatus,
} from '../../src/constants/cli-acp-host.constant.js';
import {
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliAgentProjectionRuntime } from '../../src/runtime/agent-projection-runtime.js';
import { createCliAdapterVerificationResolution } from '../test-support/cli-command-fixtures.js';

describe('CliAgentProjectionRuntime', () => {
  it('projects selected transport/provider truth into agent descriptors', () => {
    const runtime = new CliAgentProjectionRuntime();
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: ['tool_calling'],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CODEX,
            fallbackSurfaces: [AdapterSurface.CLAUDE_CODE],
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.REMOTE_API,
          remoteApi: {
            provider: AdapterProviderKind.OPENAI,
            vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
          },
        },
      ],
    };

    const descriptors = runtime.createDescriptorsFromRoleEvaluations({
      adaptersConfig,
      verification: createCliAdapterVerificationResolution({
        overallStatus: CliGovernanceCheckStatus.WARN,
        tools: [],
        roleEvaluations: [
          {
            roleId: 'coder',
            roleProfileId: DefaultRoleProfileId.CODER,
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
              routeKey: 'cli.adapter.role.coder',
              unavailableReasons: ['credential_missing:codex:OPENAI_API_KEY'],
              transportKind: AdapterTransportKind.REMOTE_API,
              providerKind: AdapterProviderKind.OPENAI,
              vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
              model: 'gpt-5',
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
      }),
      workspace: {
        workspaceId: 'workspace-1',
        mode: WorkspaceMode.REPO_LOCAL,
      },
      executionId: 'verify-123',
      sessionId: 'session-123',
    });

    expect(descriptors).toEqual([
      expect.objectContaining({
        agentRole: 'coder',
        selectedSurface: AdapterSurface.CODEX,
        selectedBy: CliAdapterRoleSelectionSource.PRIMARY,
        selectedTransport: AdapterTransportKind.REMOTE_API,
        selectedProviderKind: AdapterProviderKind.OPENAI,
        selectedVendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
        selectedModel: 'gpt-5',
        capabilitySnapshotSource: AdapterCapabilitySnapshotSource.HEALTH_CHECK,
      }),
    ]);
  });

  it('keeps explicit cli_exec projection truth separate from configured remote_api fields', () => {
    const runtime = new CliAgentProjectionRuntime();
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: ['tool_calling'],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CODEX,
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.CLI_EXEC,
          remoteApi: {
            provider: AdapterProviderKind.OPENAI,
            vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
          },
        },
      ],
    };

    const descriptors = runtime.createDescriptorsFromRoleEvaluations({
      adaptersConfig,
      verification: createCliAdapterVerificationResolution({
        overallStatus: CliGovernanceCheckStatus.PASS,
        tools: [],
        roleEvaluations: [
          {
            roleId: 'coder',
            roleProfileId: DefaultRoleProfileId.CODER,
            required: true,
            primarySurface: AdapterSurface.CODEX,
            selectedSurface: AdapterSurface.CODEX,
            selectedBy: CliAdapterRoleSelectionSource.PRIMARY,
            unsupportedCapabilities: [],
            degradedCapabilities: [],
            unavailableReasons: [],
            failureAttributions: [],
            status: CliGovernanceCheckStatus.PASS,
          },
        ],
        requiredRoleCount: 1,
        requiredRoleFailedCount: 0,
        degradedRoleCount: 0,
        fallbackRoleCount: 0,
        nextActions: [],
      }),
      workspace: {
        workspaceId: 'workspace-1',
        mode: WorkspaceMode.REPO_LOCAL,
      },
    });

    expect(descriptors).toEqual([
      expect.objectContaining({
        selectedTransport: AdapterTransportKind.CLI_EXEC,
        selectedProviderKind: null,
        selectedVendorBindingKind: null,
        selectedModel: null,
      }),
    ]);
  });

  it('preserves explicit acp_exec truth and companion when role selection stays unresolved', () => {
    const runtime = new CliAgentProjectionRuntime();
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: ['tool_calling'],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CODEX,
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.ACP_EXEC,
          remoteApi: {
            provider: AdapterProviderKind.OPENAI,
            vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
          },
        },
      ],
    };

    const descriptors = runtime.createDescriptorsFromRoleEvaluations({
      adaptersConfig,
      verification: createCliAdapterVerificationResolution({
        overallStatus: CliGovernanceCheckStatus.FAIL,
        tools: [],
        roleEvaluations: [
          {
            roleId: 'coder',
            roleProfileId: DefaultRoleProfileId.CODER,
            required: true,
            primarySurface: AdapterSurface.CODEX,
            selectedSurface: null,
            selectedBy: CliAdapterRoleSelectionSource.NONE,
            unsupportedCapabilities: [],
            degradedCapabilities: [],
            unavailableReasons: ['surface_unavailable:codex:acp_host_transport_not_ready'],
            failureAttributions: ['environment_precondition'],
            status: CliGovernanceCheckStatus.FAIL,
          },
        ],
        requiredRoleCount: 1,
        requiredRoleFailedCount: 1,
        degradedRoleCount: 0,
        fallbackRoleCount: 0,
        nextActions: ['Investigate ACP host enablement before retrying verify.'],
      }),
      workspace: {
        workspaceId: 'workspace-1',
        mode: WorkspaceMode.REPO_LOCAL,
      },
    });

    expect(descriptors).toEqual([
      expect.objectContaining({
        selectedSurface: AdapterSurface.CODEX,
        selectedTransport: AdapterTransportKind.ACP_EXEC,
        selectedProviderKind: null,
        selectedVendorBindingKind: null,
        selectedModel: null,
        capabilitySnapshotSource: AdapterCapabilitySnapshotSource.CONFIG,
        acpHostCompanion: {
          hostReadinessStatus: CliAcpHostReadinessStatus.BASELINE_ONLY,
          distributionBoundary: CliAcpHostDistributionBoundary.PACKAGED_DISTRIBUTION_PENDING,
          companionStateSummary: CLI_ACP_HOST_COMPANION_STATE_SUMMARY,
        },
      }),
    ]);
  });

  it('projects ACP companion diagnostics into presenter-facing companion fields', () => {
    const runtime = new CliAgentProjectionRuntime();
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: ['tool_calling'],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CODEX,
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.ACP_EXEC,
          remoteApi: {
            provider: AdapterProviderKind.OPENAI,
            vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
          },
        },
      ],
    };

    const descriptors = runtime.createDescriptorsFromRoleEvaluations({
      adaptersConfig,
      verification: createCliAdapterVerificationResolution({
        overallStatus: CliGovernanceCheckStatus.PASS,
        tools: [],
        roleEvaluations: [
          {
            roleId: 'coder',
            roleProfileId: DefaultRoleProfileId.CODER,
            required: true,
            primarySurface: AdapterSurface.CODEX,
            selectedSurface: AdapterSurface.CODEX,
            selectedBy: CliAdapterRoleSelectionSource.PRIMARY,
            unsupportedCapabilities: [],
            degradedCapabilities: [],
            unavailableReasons: [],
            healthCheck: buildLayeredHealthCheckResult({
              adapterId: 'codex-agent',
              surfaceId: AdapterSurface.CODEX,
              availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
              selectedEntrypoint: AdapterSurface.CODEX,
              routeKey: 'cli.adapter.role.coder',
              transportKind: AdapterTransportKind.ACP_EXEC,
              diagnostics: [
                {
                  layer: 'protocol',
                  status: 'pass',
                  code: CliAcpHostDiagnosticCode.HOST_READINESS_STATUS,
                  detail: 'runtime_service_ready',
                },
                {
                  layer: 'protocol',
                  status: 'pass',
                  code: CliAcpHostDiagnosticCode.DISTRIBUTION_BOUNDARY,
                  detail: 'packaged_distribution_ready',
                },
                {
                  layer: 'protocol',
                  status: 'pass',
                  code: CliAcpHostDiagnosticCode.COMPANION_STATE_SUMMARY,
                  detail: 'permission_queue_attached',
                },
              ],
            }),
            failureAttributions: [],
            status: CliGovernanceCheckStatus.PASS,
          },
        ],
        requiredRoleCount: 1,
        requiredRoleFailedCount: 0,
        degradedRoleCount: 0,
        fallbackRoleCount: 0,
        nextActions: [],
      }),
      workspace: {
        workspaceId: 'workspace-1',
        mode: WorkspaceMode.REPO_LOCAL,
      },
    });

    expect(descriptors).toEqual([
      expect.objectContaining({
        selectedSurface: AdapterSurface.CODEX,
        selectedTransport: AdapterTransportKind.ACP_EXEC,
        capabilitySnapshotSource: AdapterCapabilitySnapshotSource.HEALTH_CHECK,
        acpHostCompanion: {
          hostReadinessStatus: 'runtime_service_ready',
          distributionBoundary: 'packaged_distribution_ready',
          companionStateSummary: 'permission_queue_attached',
        },
      }),
    ]);
  });
});
