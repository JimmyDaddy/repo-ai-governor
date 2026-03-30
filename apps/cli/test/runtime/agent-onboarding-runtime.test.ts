import { WorkspaceMode } from '@repo-ai-governor/config';
import { AdapterAvailability, AdapterSurface, GovernorErrorCode } from '@repo-ai-governor/shared';
import { CliAgentOnboardingPreset } from '../../src/constants/cli-agent-onboarding.constant.js';
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
});
