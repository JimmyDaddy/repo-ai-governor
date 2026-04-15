import { type AdaptersConfig, WorkspaceMode } from '@repo-ai-governor/config';
import {
  AdapterCapabilitySnapshotSource,
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  GovernorErrorCode,
} from '@repo-ai-governor/shared';
import { AgentProjectionService } from '../src/index.js';

function createAdaptersConfigFixture(): AdaptersConfig {
  return {
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
      },
    },
    tools: [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: 'available',
      },
    ],
  };
}

describe('AgentProjectionService', () => {
  it('projects one stable descriptor from role and route inputs', () => {
    const service = new AgentProjectionService();

    const descriptor = service.project({
      roleId: 'coder',
      roleProfileId: 'coder-default',
      routeKey: 'route.coder',
      stageId: 'stage-coder',
      adaptersConfig: createAdaptersConfigFixture(),
      requiredCapabilities: ['tool_calling'],
      workspaceId: 'workspace-001',
      workspaceMode: WorkspaceMode.REPO_LOCAL,
      executionId: 'exec-001',
      sessionId: 'shared-exec-001',
      selectedSurface: AdapterSurface.GITHUB_COPILOT,
      selectedBy: 'fallback',
      projectionStatus: 'planned',
      failureReasons: ['remote_quota'],
      selectedTransport: AdapterTransportKind.REMOTE_API,
      selectedProviderKind: AdapterProviderKind.OPENAI,
      selectedVendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
      selectedModel: 'gpt-5',
      capabilitySnapshotSource: AdapterCapabilitySnapshotSource.HEALTH_CHECK,
    });

    expect(descriptor).toEqual(
      expect.objectContaining({
        agentId: 'stage-coder:coder:route.coder',
        agentRole: 'coder',
        roleProfileId: 'coder-default',
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.GITHUB_COPILOT],
        permissionLevel: 'edit',
        selectedSurface: AdapterSurface.GITHUB_COPILOT,
        selectedBy: 'fallback',
        projectionStatus: 'planned',
        failureReasons: ['remote_quota'],
        selectedTransport: AdapterTransportKind.REMOTE_API,
        selectedProviderKind: AdapterProviderKind.OPENAI,
        selectedVendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
        selectedModel: 'gpt-5',
        capabilitySnapshotSource: AdapterCapabilitySnapshotSource.HEALTH_CHECK,
        workspaceId: 'workspace-001',
        executionId: 'exec-001',
        sessionId: 'shared-exec-001',
      }),
    );
  });

  it('preserves acp host companion as additive projection-owned transport truth', () => {
    const service = new AgentProjectionService();

    const descriptor = service.project({
      roleId: 'coder',
      roleProfileId: 'coder-default',
      routeKey: 'route.coder',
      stageId: 'stage-coder',
      adaptersConfig: createAdaptersConfigFixture(),
      requiredCapabilities: ['tool_calling'],
      workspaceId: 'workspace-001',
      workspaceMode: WorkspaceMode.REPO_LOCAL,
      selectedTransport: AdapterTransportKind.ACP_EXEC,
      acpHostCompanion: {
        hostReadinessStatus: 'baseline_only',
        distributionBoundary: 'packaged_distribution_pending',
        companionStateSummary: 'runtime_service_enablement_pending',
      },
    });

    expect(descriptor).toEqual(
      expect.objectContaining({
        selectedTransport: AdapterTransportKind.ACP_EXEC,
        acpHostCompanion: {
          hostReadinessStatus: 'baseline_only',
          distributionBoundary: 'packaged_distribution_pending',
          companionStateSummary: 'runtime_service_enablement_pending',
        },
      }),
    );
  });

  it('fails closed when role binding is missing from adapters routing', () => {
    const service = new AgentProjectionService();

    expect(() =>
      service.project({
        roleId: 'reviewer',
        roleProfileId: 'reviewer-default',
        routeKey: 'route.review',
        stageId: 'stage-review',
        adaptersConfig: createAdaptersConfigFixture(),
        requiredCapabilities: ['structured_output'],
        workspaceId: 'workspace-001',
        workspaceMode: WorkspaceMode.REPO_LOCAL,
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
      }),
    );
  });
});
