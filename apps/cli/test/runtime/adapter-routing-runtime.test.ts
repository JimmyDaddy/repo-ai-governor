import { AgentAvailabilityStatus } from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig } from '@repo-ai-governor/config';
import {
  AdapterAvailability,
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
} from '@repo-ai-governor/shared';
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

  it('rebuilds the codex protocol when transport flips from cli_exec to remote_api', () => {
    const runtime = new CliAdapterRoutingRuntime(adaptersConfig);
    const baselineToolConfigBySurface = runtime.createToolConfigBySurfaceMap();
    const protocolBySurfaceA = runtime.createProtocolBySurface(baselineToolConfigBySurface);
    const reconfiguredToolConfigBySurface = new Map(baselineToolConfigBySurface);
    const codexToolConfig = baselineToolConfigBySurface.get(AdapterSurface.CODEX);
    expect(codexToolConfig).toBeDefined();
    reconfiguredToolConfigBySurface.set(AdapterSurface.CODEX, {
      ...codexToolConfig,
      transport: AdapterTransportKind.REMOTE_API,
      remoteApi: {
        provider: AdapterProviderKind.OPENAI,
        model: 'gpt-5',
      },
    });

    const protocolBySurfaceB = runtime.createProtocolBySurface(reconfiguredToolConfigBySurface);

    expect(protocolBySurfaceB[AdapterSurface.CODEX]).not.toBe(
      protocolBySurfaceA[AdapterSurface.CODEX],
    );
    expect(protocolBySurfaceB[AdapterSurface.GITHUB_COPILOT]).toBe(
      protocolBySurfaceA[AdapterSurface.GITHUB_COPILOT],
    );
  });

  it('uses explicit acp_exec protocol truth without reinterpreting it as cli_exec', async () => {
    const acpAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.ACP_EXEC,
        },
      ],
    };
    const runtime = new CliAdapterRoutingRuntime(acpAdaptersConfig);
    const protocolBySurface = runtime.createProtocolBySurface(
      runtime.createToolConfigBySurfaceMap(),
    );
    const probeResult = await protocolBySurface[AdapterSurface.CODEX]?.probe({
      routeKey: 'cli.adapter.probe.codex',
      requiredCapabilities: [],
    });

    expect(probeResult?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
    expect(probeResult?.unavailableReasons).toContain(
      'health_check_failed:codex:acp_host_transport_not_ready',
    );
    expect(probeResult?.healthCheck?.transportKind).toBe(AdapterTransportKind.ACP_EXEC);
    expect(probeResult?.healthCheck?.reasonCodes).toContain('protocol.health_check_failed');
  });

  it('localizes the acp_exec fail-closed runtime error through the routing bridge', async () => {
    const acpAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.ACP_EXEC,
        },
      ],
    };
    const runtime = new CliAdapterRoutingRuntime(acpAdaptersConfig, {
      localizeText: (_english, chinese) => chinese,
    });
    const protocolBySurface = runtime.createProtocolBySurface(
      runtime.createToolConfigBySurfaceMap(),
    );

    await expect(
      protocolBySurface[AdapterSurface.CODEX]?.invokeStage({} as never),
    ).rejects.toMatchObject({
      message:
        'ACP host-facing transport 尚未为 codex 就绪；在 rollout enablement 完成前，调用 将保持 fail-closed。',
    });
  });

  it('preserves config-disabled ACP probe truth instead of rewriting it as host-not-ready', async () => {
    const acpAdaptersConfig: AdaptersConfig = {
      ...adaptersConfig,
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: false,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.ACP_EXEC,
        },
      ],
    };
    const runtime = new CliAdapterRoutingRuntime(acpAdaptersConfig);
    const protocolBySurface = runtime.createProtocolBySurface(
      runtime.createToolConfigBySurfaceMap(),
    );
    const probeResult = await protocolBySurface[AdapterSurface.CODEX]?.probe({
      routeKey: 'cli.adapter.probe.codex',
      requiredCapabilities: [],
    });

    expect(probeResult?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
    expect(probeResult?.unavailableReasons).toContain('disabled_by_config:codex');
    expect(probeResult?.healthCheck?.reasonCodes).toContain('route.disabled_by_config');
    expect(probeResult?.healthCheck?.reasonCodes).not.toContain('protocol.health_check_failed');
  });
});
