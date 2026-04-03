import {
  AgentAvailabilityStatus,
  AgentCapabilitySupportLevel,
  buildLayeredHealthCheckResult,
} from '@repo-ai-governor/adapter-sdk';
import {
  AdapterAvailability,
  AdapterEndpointSource,
  AdapterRequestCancellationMode,
  AdapterSurface,
  AdapterTransportKind,
  DEFAULT_I18N_RUNTIME_CONFIG,
  ExecutionProgressStage,
  I18nRuntime,
} from '@repo-ai-governor/shared';
import {
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliAdapterDiagnosticsRuntime } from '../../src/runtime/adapter-diagnostics-runtime.js';
import type { CliAdapterVerificationResolution } from '../../src/types/index.js';

function createVerificationFixture(): CliAdapterVerificationResolution {
  return {
    overallStatus: CliGovernanceCheckStatus.WARN,
    requiredRoleCount: 1,
    requiredRoleFailedCount: 0,
    degradedRoleCount: 1,
    fallbackRoleCount: 1,
    nextActions: ['Review fallback priority before unattended execution.'],
    tools: [
      {
        toolId: AdapterSurface.OLLAMA,
        enabled: true,
        configuredAvailability: AdapterAvailability.AVAILABLE,
        availabilityStatus: AgentAvailabilityStatus.DEGRADED,
        unavailableReasons: [
          'local_model_endpoint_unreachable:ollama:http%3A%2F%2F127.0.0.1%3A11434:ECONNREFUSED:refused',
        ],
        failureAttributions: ['configuration_missing'],
        healthCheck: buildLayeredHealthCheckResult({
          adapterId: 'ollama-agent',
          surfaceId: AdapterSurface.OLLAMA,
          availabilityStatus: AgentAvailabilityStatus.DEGRADED,
          selectedEntrypoint: AdapterSurface.OLLAMA,
          routeKey: 'cli.adapter.probe.ollama',
          unavailableReasons: [
            'local_model_endpoint_unreachable:ollama:http%3A%2F%2F127.0.0.1%3A11434:ECONNREFUSED:refused',
          ],
          transportKind: AdapterTransportKind.BASELINE,
          providerKind: null,
          vendorBindingKind: null,
          model: 'qwen2.5-coder:7b',
          credentialSource: null,
          endpointSource: AdapterEndpointSource.CONFIG_EXPLICIT,
          requestCancellationMode: AdapterRequestCancellationMode.LOCAL_ABORT_ONLY,
        }),
        capabilitySupportByCapability: new Map([
          ['structured_output', AgentCapabilitySupportLevel.SUPPORTED],
        ]),
      },
    ],
    roleEvaluations: [
      {
        roleId: 'reviewer',
        roleProfileId: 'default.reviewer',
        required: true,
        primarySurface: AdapterSurface.CLAUDE_CODE,
        selectedSurface: AdapterSurface.OLLAMA,
        selectedBy: CliAdapterRoleSelectionSource.FALLBACK,
        unsupportedCapabilities: [],
        degradedCapabilities: ['structured_output'],
        unavailableReasons: ['surface_unavailable:claude_code:login_required'],
        failureAttributions: ['configuration_missing'],
        healthCheck: buildLayeredHealthCheckResult({
          adapterId: 'ollama-agent',
          surfaceId: AdapterSurface.OLLAMA,
          availabilityStatus: AgentAvailabilityStatus.DEGRADED,
          selectedEntrypoint: AdapterSurface.OLLAMA,
          routeKey: 'cli.adapter.role.reviewer',
          unavailableReasons: ['surface_unavailable:claude_code:login_required'],
          transportKind: AdapterTransportKind.BASELINE,
          providerKind: null,
          vendorBindingKind: null,
          model: 'qwen2.5-coder:7b',
          credentialSource: null,
          endpointSource: AdapterEndpointSource.CONFIG_EXPLICIT,
          requestCancellationMode: AdapterRequestCancellationMode.LOCAL_ABORT_ONLY,
        }),
        status: CliGovernanceCheckStatus.WARN,
      },
    ],
  };
}

describe('Cli adapter diagnostics runtime', () => {
  it('renders human-friendly probe detail and safe_local boundary payload', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runtime = new CliAdapterDiagnosticsRuntime(
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      () => ({
        configuration_missing: 2,
      }),
    );
    const verification = createVerificationFixture();
    const toolSnapshot = verification.tools[0];

    expect(toolSnapshot).toBeDefined();
    if (!toolSnapshot) {
      return;
    }

    const detail = runtime.resolveToolProbeCheckDetail(toolSnapshot);
    const safeLocalBoundary = runtime.createSafeLocalBoundaryArtifactPayload(true);

    expect(detail).toContain('availability=degraded');
    expect(detail).toContain('attribution=configuration_missing');
    expect(detail).toContain('local-model surface "ollama" cannot reach endpoint');
    expect(detail).toContain('transport=baseline');
    expect(detail).toContain('model=qwen2.5-coder:7b');
    expect(detail).toContain('cancel=local_abort_only');
    expect(safeLocalBoundary.mode).toBe('safe_local_only');
    expect(safeLocalBoundary.fixEnabled).toBe(true);
  });

  it('shapes verification payload, role progress, and prompts outside the facade', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runtime = new CliAdapterDiagnosticsRuntime(
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      () => ({
        configuration_missing: 2,
      }),
    );
    const verification = createVerificationFixture();

    const payload = runtime.createAdapterVerificationArtifactPayload(verification) as {
      failureAttributionSummary?: Record<string, number>;
    };
    const rows = runtime.createAdapterRoleProgressRows({
      verification,
      stage: ExecutionProgressStage.CONNECT,
      diagnosticsPath: '/tmp/connect.json',
      executionId: 'connect-123',
    });
    const prompts = runtime.createAdapterInteractionPrompts({
      verification,
      stage: ExecutionProgressStage.CONNECT,
    });

    expect(payload.failureAttributionSummary?.configuration_missing).toBe(2);
    expect(rows[0]?.roleId).toBe('reviewer');
    expect(rows[0]?.status).toBe('warning');
    expect(rows[0]?.detail).toContain('transport=baseline');
    expect(rows[0]?.detail).toContain('cancel=local_abort_only');
    expect(rows[0]?.backlink?.artifactPath).toBe('/tmp/connect.json');
    expect(prompts[0]?.blocking).toBe(false);
    expect(prompts[0]?.title).toBe('Adapter route attention');
  });

  it('humanizes rate-limited and quota-exhausted remote health-check failures', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runtime = new CliAdapterDiagnosticsRuntime(
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      () => ({
        environment_precondition: 1,
      }),
    );

    const rateLimitedDetail = runtime.resolveToolProbeCheckDetail({
      toolId: AdapterSurface.CODEX,
      enabled: true,
      configuredAvailability: AdapterAvailability.AVAILABLE,
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      unavailableReasons: ['health_check_failed:codex:rate_limited'],
      failureAttributions: ['environment_precondition'],
      capabilitySupportByCapability: new Map(),
    });
    const quotaExhaustedDetail = runtime.resolveToolProbeCheckDetail({
      toolId: AdapterSurface.GITHUB_COPILOT,
      enabled: true,
      configuredAvailability: AdapterAvailability.AVAILABLE,
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      unavailableReasons: ['health_check_failed:github-copilot:quota_exhausted'],
      failureAttributions: ['environment_precondition'],
      capabilitySupportByCapability: new Map(),
    });

    expect(rateLimitedDetail).toContain('surface "codex" health check is currently rate limited');
    expect(quotaExhaustedDetail).toContain(
      'surface "github-copilot" health check is blocked by exhausted quota',
    );
  });
});
