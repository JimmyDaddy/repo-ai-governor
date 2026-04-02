import { AgentAvailabilityStatus } from '../src/constants/index.js';
import { createLayeredHealthCheckFromLegacyReasons } from '../src/index.js';

describe('layered health check runtime', () => {
  it('projects legacy probe reasons into layered statuses and stable reason codes', () => {
    const result = createLayeredHealthCheckFromLegacyReasons({
      adapterId: 'github-copilot-default-agent',
      surfaceId: 'github-copilot',
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      selectedEntrypoint: 'copilot',
      routeKey: 'cli.adapter.role.tester',
      routeRequirements: ['structured_output'],
      fallbackAllowed: true,
      unavailableReasons: [
        'credential_missing:github-copilot',
        'health_check_invalid_response:github-copilot:OK, ready to help.',
      ],
      unsupportedCapabilities: ['structured_output'],
    });

    expect(result.authStatus).toBe('fail');
    expect(result.semanticStatus).toBe('fail');
    expect(result.routeCapabilityStatus).toBe('fail');
    expect(result.reasonCodes).toContain('auth.credential_missing');
    expect(result.reasonCodes).toContain('semantic.invalid_response');
    expect(result.reasonCodes).toContain('route.capability_unsupported');
    expect(result.selectedEntrypoint).toBe('copilot');
  });

  it('treats route-surface wrapping and degraded capabilities as structured diagnostics', () => {
    const result = createLayeredHealthCheckFromLegacyReasons({
      adapterId: 'local-model-default-agent',
      surfaceId: 'ollama',
      availabilityStatus: AgentAvailabilityStatus.DEGRADED,
      selectedEntrypoint: 'http://127.0.0.1:11434',
      routeKey: 'cli.adapter.role.reviewer',
      routeRequirements: ['tool_calling'],
      fallbackAllowed: false,
      unavailableReasons: ['surface_unavailable:ollama:local_model_model_missing:ollama:qwen2.5'],
      degradedCapabilities: ['parallel_task'],
    });

    expect(result.routeCapabilityStatus).toBe('fail');
    expect(result.overallStatus).toBe(AgentAvailabilityStatus.DEGRADED);
    expect(result.reasonCodes).toContain('route.surface_unavailable');
    expect(result.reasonCodes).toContain('route.local_model_model_missing');
    expect(result.reasonCodes).toContain('route.capability_degraded');
  });
});
