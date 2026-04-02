import type { AdaptersConfig } from '@repo-ai-governor/config';
import { AdapterAvailability, AdapterSurface } from '@repo-ai-governor/shared';
import { CliAdapterRoutingRuntime } from '../../src/runtime/adapter-routing-runtime.js';

describe('Cli adapter routing runtime', () => {
  const adaptersConfig: AdaptersConfig = {
    roles: [
      {
        roleId: 'reviewer',
        roleProfileId: 'reviewer-default',
        requiredCapabilities: [],
        required: true,
      },
    ],
    routing: {
      roleBindings: {
        reviewer: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.GITHUB_COPILOT, AdapterSurface.CLAUDE_CODE],
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
        toolId: AdapterSurface.GITHUB_COPILOT,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
      {
        toolId: AdapterSurface.CLAUDE_CODE,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
    ],
  };

  it('reuses protocol instances across calls when surface config is unchanged', () => {
    const runtime = new CliAdapterRoutingRuntime(adaptersConfig);

    const protocolBySurfaceA = runtime.createProtocolBySurface(
      runtime.createToolConfigBySurfaceMap(),
    );
    const protocolBySurfaceB = runtime.createProtocolBySurface(
      runtime.createToolConfigBySurfaceMap(),
    );

    expect(protocolBySurfaceB[AdapterSurface.CODEX]).toBe(protocolBySurfaceA[AdapterSurface.CODEX]);
    expect(protocolBySurfaceB[AdapterSurface.GITHUB_COPILOT]).toBe(
      protocolBySurfaceA[AdapterSurface.GITHUB_COPILOT],
    );
    expect(protocolBySurfaceB[AdapterSurface.CLAUDE_CODE]).toBe(
      protocolBySurfaceA[AdapterSurface.CLAUDE_CODE],
    );
  });

  it('rebuilds one surface protocol when that surface config changes', () => {
    const runtime = new CliAdapterRoutingRuntime(adaptersConfig);
    const baselineToolConfigBySurface = runtime.createToolConfigBySurfaceMap();
    const protocolBySurfaceA = runtime.createProtocolBySurface(baselineToolConfigBySurface);
    const reconfiguredToolConfigBySurface = new Map(baselineToolConfigBySurface);
    const githubCopilotToolConfig = baselineToolConfigBySurface.get(AdapterSurface.GITHUB_COPILOT);
    expect(githubCopilotToolConfig).toBeDefined();
    reconfiguredToolConfigBySurface.set(AdapterSurface.GITHUB_COPILOT, {
      ...githubCopilotToolConfig,
      availability: AdapterAvailability.UNAVAILABLE,
    });

    const protocolBySurfaceB = runtime.createProtocolBySurface(reconfiguredToolConfigBySurface);

    expect(protocolBySurfaceB[AdapterSurface.CODEX]).toBe(protocolBySurfaceA[AdapterSurface.CODEX]);
    expect(protocolBySurfaceB[AdapterSurface.CLAUDE_CODE]).toBe(
      protocolBySurfaceA[AdapterSurface.CLAUDE_CODE],
    );
    expect(protocolBySurfaceB[AdapterSurface.GITHUB_COPILOT]).not.toBe(
      protocolBySurfaceA[AdapterSurface.GITHUB_COPILOT],
    );
  });

  it('shares protocol instances across runtime instances when one cache namespace is reused', () => {
    const namespace = `test-runtime-cache:${Date.now().toString()}`;
    const runtimeA = new CliAdapterRoutingRuntime(adaptersConfig, {
      sharedProtocolCacheNamespace: namespace,
    });
    const runtimeB = new CliAdapterRoutingRuntime(adaptersConfig, {
      sharedProtocolCacheNamespace: namespace,
    });

    const protocolBySurfaceA = runtimeA.createProtocolBySurface(
      runtimeA.createToolConfigBySurfaceMap(),
    );
    const protocolBySurfaceB = runtimeB.createProtocolBySurface(
      runtimeB.createToolConfigBySurfaceMap(),
    );

    expect(protocolBySurfaceB[AdapterSurface.CODEX]).toBe(protocolBySurfaceA[AdapterSurface.CODEX]);
    expect(protocolBySurfaceB[AdapterSurface.GITHUB_COPILOT]).toBe(
      protocolBySurfaceA[AdapterSurface.GITHUB_COPILOT],
    );
    expect(protocolBySurfaceB[AdapterSurface.CLAUDE_CODE]).toBe(
      protocolBySurfaceA[AdapterSurface.CLAUDE_CODE],
    );
  });
});
