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
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliAgentProjectionRuntime } from '../../src/runtime/agent-projection-runtime.js';

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
      verification: {
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
      },
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
});
