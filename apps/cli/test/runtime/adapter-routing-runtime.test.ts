import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, relative, resolve, sep } from 'node:path';

import { AgentAvailabilityStatus } from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig } from '@repo-ai-governor/config';
import {
  AdapterAvailability,
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
} from '@repo-ai-governor/shared';
import { HOST_VERIFICATION_SUMMARY_SCHEMA_VERSION } from '@repo-ai-governor/standards';
import { CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY } from '../../src/constants/cli-acp-host.constant.js';
import { CliAdapterRoutingRuntime } from '../../src/runtime/adapter-routing-runtime.js';

describe('Cli adapter routing runtime', () => {
  const CLEAN_ROOM_VERIFIED_MODES = ['path', 'link', 'tgz'] as const;
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

  async function writeHostVerificationSummary(filePath: string, verifiedAt: string): Promise<void> {
    await writeFile(
      filePath,
      `${JSON.stringify(
        {
          schemaVersion: HOST_VERIFICATION_SUMMARY_SCHEMA_VERSION,
          status: 'pass',
          verifiedAt,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
  }

  async function writeCodexHostEvidence(workspaceRoot: string): Promise<void> {
    const runtimeExportRoot = resolve(workspaceRoot, 'generated', 'hosts', 'codex');
    const pluginExportRoot = resolve(workspaceRoot, 'generated', 'hosts', 'codex-plugin');
    await mkdir(runtimeExportRoot, { recursive: true });
    await mkdir(pluginExportRoot, { recursive: true });
    await writeFile(
      resolve(runtimeExportRoot, 'host-export.manifest.json'),
      `${JSON.stringify({ host: 'codex', target: 'codex.project_local' }, null, 2)}\n`,
      'utf8',
    );
    await writeHostVerificationSummary(
      resolve(runtimeExportRoot, 'host-verification.summary.json'),
      '2026-04-15T06:30:00.000Z',
    );
    await writeFile(
      resolve(pluginExportRoot, 'host-export.manifest.json'),
      `${JSON.stringify({ host: 'codex', target: 'codex.plugin' }, null, 2)}\n`,
      'utf8',
    );
    await writeHostVerificationSummary(
      resolve(pluginExportRoot, 'host-verification.summary.json'),
      '2026-04-15T06:35:00.000Z',
    );
  }

  async function writeCleanRoomReceiptSet(
    workspaceRoot: string,
    summaryFilePath: string,
    surfaceId: string,
  ): Promise<{
    runtimeServiceVerificationSummaryPaths: string[];
    packagedDistributionVerificationSummaryPaths: string[];
  }> {
    const receiptRoot = resolve(
      workspaceRoot,
      'generated',
      'acp',
      'acp-cleanroom-verification.receipts',
      surfaceId,
    );
    const runtimeReceiptRoot = resolve(receiptRoot, 'runtime-service');
    const distributionReceiptRoot = resolve(receiptRoot, 'packaged-distribution');
    await mkdir(runtimeReceiptRoot, { recursive: true });
    await mkdir(distributionReceiptRoot, { recursive: true });

    const runtimeServiceVerificationSummaryPaths = await Promise.all(
      CLEAN_ROOM_VERIFIED_MODES.map(async (mode, index) => {
        const filePath = resolve(runtimeReceiptRoot, `${mode}.host-verification.summary.json`);
        await writeHostVerificationSummary(filePath, `2026-04-15T07:0${index}:00.000Z`);
        return relative(dirname(summaryFilePath), filePath).split(sep).join('/');
      }),
    );
    const packagedDistributionVerificationSummaryPaths = await Promise.all(
      CLEAN_ROOM_VERIFIED_MODES.map(async (mode, index) => {
        const filePath = resolve(distributionReceiptRoot, `${mode}.host-verification.summary.json`);
        await writeHostVerificationSummary(filePath, `2026-04-15T07:1${index}:00.000Z`);
        return relative(dirname(summaryFilePath), filePath).split(sep).join('/');
      }),
    );

    return {
      runtimeServiceVerificationSummaryPaths,
      packagedDistributionVerificationSummaryPaths,
    };
  }

  async function writeAbsoluteCleanRoomReceiptSet(absoluteReceiptRoot: string): Promise<{
    runtimeServiceVerificationSummaryPaths: string[];
    packagedDistributionVerificationSummaryPaths: string[];
  }> {
    const runtimeReceiptRoot = resolve(absoluteReceiptRoot, 'runtime-service');
    const distributionReceiptRoot = resolve(absoluteReceiptRoot, 'packaged-distribution');
    await mkdir(runtimeReceiptRoot, { recursive: true });
    await mkdir(distributionReceiptRoot, { recursive: true });

    const runtimeServiceVerificationSummaryPaths = await Promise.all(
      CLEAN_ROOM_VERIFIED_MODES.map(async (mode, index) => {
        const filePath = resolve(runtimeReceiptRoot, `${mode}.host-verification.summary.json`);
        await writeHostVerificationSummary(filePath, `2026-04-15T08:0${index}:00.000Z`);
        return filePath;
      }),
    );
    const packagedDistributionVerificationSummaryPaths = await Promise.all(
      CLEAN_ROOM_VERIFIED_MODES.map(async (mode, index) => {
        const filePath = resolve(distributionReceiptRoot, `${mode}.host-verification.summary.json`);
        await writeHostVerificationSummary(filePath, `2026-04-15T08:1${index}:00.000Z`);
        return filePath;
      }),
    );

    return {
      runtimeServiceVerificationSummaryPaths,
      packagedDistributionVerificationSummaryPaths,
    };
  }

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
    if (!githubCopilotToolConfig) {
      return;
    }
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
    if (!codexToolConfig) {
      return;
    }
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

  it('projects packaged-distribution and runtime-service evidence into ACP diagnostics without rewriting ACP transport truth', async () => {
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
    const repoRoot = await mkdtemp(resolve(tmpdir(), 'acp-host-evidence-'));

    try {
      const workspaceRoot = resolve(repoRoot, '.repo-ai-governor');
      const runtimeExportRoot = resolve(workspaceRoot, 'generated', 'hosts-final', 'codex');
      const pluginExportRoot = resolve(workspaceRoot, 'generated', 'hosts-final', 'codex-plugin');
      await mkdir(runtimeExportRoot, { recursive: true });
      await mkdir(pluginExportRoot, { recursive: true });
      await writeFile(
        resolve(runtimeExportRoot, 'host-export.manifest.json'),
        `${JSON.stringify({ host: 'codex', target: 'codex.project_local' }, null, 2)}\n`,
        'utf8',
      );
      await writeHostVerificationSummary(
        resolve(runtimeExportRoot, 'host-verification.summary.json'),
        '2026-04-15T06:30:00.000Z',
      );
      await writeFile(
        resolve(pluginExportRoot, 'host-export.manifest.json'),
        `${JSON.stringify({ host: 'codex', target: 'codex.plugin' }, null, 2)}\n`,
        'utf8',
      );
      await writeHostVerificationSummary(
        resolve(pluginExportRoot, 'host-verification.summary.json'),
        '2026-04-15T06:35:00.000Z',
      );
      const cleanRoomSummaryPath = resolve(
        workspaceRoot,
        'generated',
        'acp',
        'acp-cleanroom-verification.summary.json',
      );
      const {
        runtimeServiceVerificationSummaryPaths,
        packagedDistributionVerificationSummaryPaths,
      } = await writeCleanRoomReceiptSet(workspaceRoot, cleanRoomSummaryPath, 'codex');
      await mkdir(resolve(workspaceRoot, 'generated', 'acp'), { recursive: true });
      await writeFile(
        cleanRoomSummaryPath,
        `${JSON.stringify(
          {
            schemaVersion: 'acp-cleanroom-verification-summary-v1',
            overallStatus: 'passed',
            distributionMode: 'default',
            surfaces: [
              {
                surfaceId: AdapterSurface.CODEX,
                status: 'pass',
                verifiedModes: [...CLEAN_ROOM_VERIFIED_MODES],
                runtimeServiceVerificationSummaryPaths,
                packagedDistributionVerificationSummaryPaths,
              },
            ],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const runtime = new CliAdapterRoutingRuntime(acpAdaptersConfig, {
        acpHostEvidenceSearchRoot: repoRoot,
        sharedProtocolCacheNamespace: `test-acp-host-positive:${Date.now().toString()}`,
      });
      const protocolBySurface = runtime.createProtocolBySurface(
        runtime.createToolConfigBySurfaceMap(),
      );
      const probeResult = await protocolBySurface[AdapterSurface.CODEX]?.probe({
        routeKey: 'cli.adapter.probe.codex',
        requiredCapabilities: [],
      });

      expect(probeResult?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
      expect(probeResult?.healthCheck?.transportKind).toBe(AdapterTransportKind.ACP_EXEC);
      expect(probeResult?.healthCheck?.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'protocol.acp_host_readiness_status',
            detail: 'runtime_service_ready',
          }),
          expect.objectContaining({
            code: 'protocol.acp_distribution_boundary',
            detail: 'packaged_distribution_ready',
          }),
          expect.objectContaining({
            code: 'protocol.acp_companion_state_summary',
            detail: CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
          }),
        ]),
      );
      expect(probeResult?.unavailableReasons).toContain(
        'health_check_failed:codex:acp_host_transport_not_ready',
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it('keeps ACP clean-room projection gated when the summary scope is partial or plugin-enabled', async () => {
    const acpAdaptersConfig: AdaptersConfig = {
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
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.ACP_EXEC,
        },
      ],
    };
    const repoRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-acp-host-routing-'));
    const workspaceRoot = resolve(repoRoot, '.repo-ai-governor');

    try {
      await writeCodexHostEvidence(workspaceRoot);
      await mkdir(resolve(workspaceRoot, 'generated', 'acp'), { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'generated', 'acp', 'acp-cleanroom-verification.summary.json'),
        `${JSON.stringify(
          {
            schemaVersion: 'acp-cleanroom-verification-summary-v1',
            overallStatus: 'passed',
            distributionMode: 'plugin-enabled',
            surfaces: [
              {
                surfaceId: AdapterSurface.CODEX,
                status: 'pass',
                verifiedModes: ['path'],
                runtimeServiceVerificationSummaryPaths: ['/tmp/codex-runtime-path.summary.json'],
                packagedDistributionVerificationSummaryPaths: [
                  '/tmp/codex-distribution-path.summary.json',
                ],
              },
            ],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const runtime = new CliAdapterRoutingRuntime(acpAdaptersConfig, {
        acpHostEvidenceSearchRoot: repoRoot,
        sharedProtocolCacheNamespace: `test-acp-host-negative:${Date.now().toString()}`,
      });
      const protocolBySurface = runtime.createProtocolBySurface(
        runtime.createToolConfigBySurfaceMap(),
      );
      const probeResult = await protocolBySurface[AdapterSurface.CODEX]?.probe({
        routeKey: 'cli.adapter.probe.codex',
        requiredCapabilities: [],
      });
      const companionSummaryDiagnostic = probeResult?.healthCheck?.diagnostics?.find(
        (diagnostic) => diagnostic.code === 'protocol.acp_companion_state_summary',
      );

      expect(probeResult?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
      expect(probeResult?.healthCheck?.transportKind).toBe(AdapterTransportKind.ACP_EXEC);
      expect(probeResult?.healthCheck?.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'protocol.acp_host_readiness_status',
            detail: 'runtime_service_ready',
          }),
          expect.objectContaining({
            code: 'protocol.acp_distribution_boundary',
            detail: 'packaged_distribution_ready',
          }),
        ]),
      );
      expect(companionSummaryDiagnostic?.detail).toBeDefined();
      expect(companionSummaryDiagnostic?.detail).not.toBe(
        CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it('keeps ACP clean-room projection gated when the originating clean-room run failed', async () => {
    const acpAdaptersConfig: AdaptersConfig = {
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
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.ACP_EXEC,
        },
      ],
    };
    const repoRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-acp-host-routing-'));
    const workspaceRoot = resolve(repoRoot, '.repo-ai-governor');

    try {
      await writeCodexHostEvidence(workspaceRoot);
      await mkdir(resolve(workspaceRoot, 'generated', 'acp'), { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'generated', 'acp', 'acp-cleanroom-verification.summary.json'),
        `${JSON.stringify(
          {
            schemaVersion: 'acp-cleanroom-verification-summary-v1',
            overallStatus: 'failed',
            distributionMode: 'default',
            surfaces: [
              {
                surfaceId: AdapterSurface.CODEX,
                status: 'pass',
                verifiedModes: ['path', 'link', 'tgz'],
                runtimeServiceVerificationSummaryPaths: [
                  '/tmp/codex-runtime-path.summary.json',
                  '/tmp/codex-runtime-link.summary.json',
                  '/tmp/codex-runtime-tgz.summary.json',
                ],
                packagedDistributionVerificationSummaryPaths: [
                  '/tmp/codex-distribution-path.summary.json',
                  '/tmp/codex-distribution-link.summary.json',
                  '/tmp/codex-distribution-tgz.summary.json',
                ],
              },
            ],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const runtime = new CliAdapterRoutingRuntime(acpAdaptersConfig, {
        acpHostEvidenceSearchRoot: repoRoot,
        sharedProtocolCacheNamespace: `test-acp-host-failed:${Date.now().toString()}`,
      });
      const protocolBySurface = runtime.createProtocolBySurface(
        runtime.createToolConfigBySurfaceMap(),
      );
      const probeResult = await protocolBySurface[AdapterSurface.CODEX]?.probe({
        routeKey: 'cli.adapter.probe.codex',
        requiredCapabilities: [],
      });
      const companionSummaryDiagnostic = probeResult?.healthCheck?.diagnostics?.find(
        (diagnostic) => diagnostic.code === 'protocol.acp_companion_state_summary',
      );

      expect(probeResult?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
      expect(probeResult?.healthCheck?.transportKind).toBe(AdapterTransportKind.ACP_EXEC);
      expect(probeResult?.healthCheck?.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'protocol.acp_host_readiness_status',
            detail: 'runtime_service_ready',
          }),
          expect.objectContaining({
            code: 'protocol.acp_distribution_boundary',
            detail: 'packaged_distribution_ready',
          }),
        ]),
      );
      expect(companionSummaryDiagnostic?.detail).toBeDefined();
      expect(companionSummaryDiagnostic?.detail).not.toBe(
        CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it('keeps ACP clean-room projection gated when recorded receipt paths are no longer readable', async () => {
    const acpAdaptersConfig: AdaptersConfig = {
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
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.ACP_EXEC,
        },
      ],
    };
    const repoRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-acp-host-routing-'));
    const workspaceRoot = resolve(repoRoot, '.repo-ai-governor');

    try {
      await writeCodexHostEvidence(workspaceRoot);
      await mkdir(resolve(workspaceRoot, 'generated', 'acp'), { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'generated', 'acp', 'acp-cleanroom-verification.summary.json'),
        `${JSON.stringify(
          {
            schemaVersion: 'acp-cleanroom-verification-summary-v1',
            overallStatus: 'passed',
            distributionMode: 'default',
            surfaces: [
              {
                surfaceId: AdapterSurface.CODEX,
                status: 'pass',
                verifiedModes: [...CLEAN_ROOM_VERIFIED_MODES],
                runtimeServiceVerificationSummaryPaths: [
                  '/tmp/codex-runtime-path.summary.json',
                  '/tmp/codex-runtime-link.summary.json',
                  '/tmp/codex-runtime-tgz.summary.json',
                ],
                packagedDistributionVerificationSummaryPaths: [
                  '/tmp/codex-distribution-path.summary.json',
                  '/tmp/codex-distribution-link.summary.json',
                  '/tmp/codex-distribution-tgz.summary.json',
                ],
              },
            ],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const runtime = new CliAdapterRoutingRuntime(acpAdaptersConfig, {
        acpHostEvidenceSearchRoot: repoRoot,
        sharedProtocolCacheNamespace: `test-acp-host-missing-receipts:${Date.now().toString()}`,
      });
      const protocolBySurface = runtime.createProtocolBySurface(
        runtime.createToolConfigBySurfaceMap(),
      );
      const probeResult = await protocolBySurface[AdapterSurface.CODEX]?.probe({
        routeKey: 'cli.adapter.probe.codex',
        requiredCapabilities: [],
      });
      const companionSummaryDiagnostic = probeResult?.healthCheck?.diagnostics?.find(
        (diagnostic) => diagnostic.code === 'protocol.acp_companion_state_summary',
      );

      expect(probeResult?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
      expect(probeResult?.healthCheck?.transportKind).toBe(AdapterTransportKind.ACP_EXEC);
      expect(probeResult?.healthCheck?.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'protocol.acp_host_readiness_status',
            detail: 'runtime_service_ready',
          }),
          expect.objectContaining({
            code: 'protocol.acp_distribution_boundary',
            detail: 'packaged_distribution_ready',
          }),
        ]),
      );
      expect(companionSummaryDiagnostic?.detail).toBeDefined();
      expect(companionSummaryDiagnostic?.detail).not.toBe(
        CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it('keeps ACP clean-room projection gated when recorded receipt paths stay readable but escape the tracked receipt directory', async () => {
    const acpAdaptersConfig: AdaptersConfig = {
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
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.ACP_EXEC,
        },
      ],
    };
    const repoRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-acp-host-routing-'));
    const workspaceRoot = resolve(repoRoot, '.repo-ai-governor');
    const absoluteReceiptRoot = await mkdtemp(
      resolve(tmpdir(), 'repo-ai-governor-acp-absolute-receipts-'),
    );

    try {
      await writeCodexHostEvidence(workspaceRoot);
      const {
        runtimeServiceVerificationSummaryPaths,
        packagedDistributionVerificationSummaryPaths,
      } = await writeAbsoluteCleanRoomReceiptSet(absoluteReceiptRoot);
      await mkdir(resolve(workspaceRoot, 'generated', 'acp'), { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'generated', 'acp', 'acp-cleanroom-verification.summary.json'),
        `${JSON.stringify(
          {
            schemaVersion: 'acp-cleanroom-verification-summary-v1',
            overallStatus: 'passed',
            distributionMode: 'default',
            surfaces: [
              {
                surfaceId: AdapterSurface.CODEX,
                status: 'pass',
                verifiedModes: [...CLEAN_ROOM_VERIFIED_MODES],
                runtimeServiceVerificationSummaryPaths,
                packagedDistributionVerificationSummaryPaths,
              },
            ],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const runtime = new CliAdapterRoutingRuntime(acpAdaptersConfig, {
        acpHostEvidenceSearchRoot: repoRoot,
        sharedProtocolCacheNamespace: `test-acp-host-absolute-receipts:${Date.now().toString()}`,
      });
      const protocolBySurface = runtime.createProtocolBySurface(
        runtime.createToolConfigBySurfaceMap(),
      );
      const probeResult = await protocolBySurface[AdapterSurface.CODEX]?.probe({
        routeKey: 'cli.adapter.probe.codex',
        requiredCapabilities: [],
      });
      const companionSummaryDiagnostic = probeResult?.healthCheck?.diagnostics?.find(
        (diagnostic) => diagnostic.code === 'protocol.acp_companion_state_summary',
      );

      expect(probeResult?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
      expect(probeResult?.healthCheck?.transportKind).toBe(AdapterTransportKind.ACP_EXEC);
      expect(probeResult?.healthCheck?.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'protocol.acp_host_readiness_status',
            detail: 'runtime_service_ready',
          }),
          expect.objectContaining({
            code: 'protocol.acp_distribution_boundary',
            detail: 'packaged_distribution_ready',
          }),
        ]),
      );
      expect(companionSummaryDiagnostic?.detail).toBeDefined();
      expect(companionSummaryDiagnostic?.detail).not.toBe(
        CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
      await rm(absoluteReceiptRoot, { recursive: true, force: true });
    }
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
