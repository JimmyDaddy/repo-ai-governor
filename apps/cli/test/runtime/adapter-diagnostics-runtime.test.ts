import {
  AgentAvailabilityStatus,
  AgentCapabilitySupportLevel,
} from "@repo-ai-governor/adapter-sdk";
import {
  AdapterAvailability,
  AdapterSurface,
  ExecutionProgressStage,
} from "@repo-ai-governor/shared";
import {
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from "../../src/constants/cli-governance-runtime.constant.js";
import { CliAdapterDiagnosticsRuntime } from "../../src/runtime/adapter-diagnostics-runtime.js";
import type { CliAdapterVerificationResolution } from "../../src/types/index.js";

function createVerificationFixture(): CliAdapterVerificationResolution {
  return {
    overallStatus: CliGovernanceCheckStatus.WARN,
    requiredRoleCount: 1,
    requiredRoleFailedCount: 0,
    degradedRoleCount: 1,
    fallbackRoleCount: 1,
    nextActions: ["Review fallback priority before unattended execution."],
    tools: [
      {
        toolId: AdapterSurface.OLLAMA,
        enabled: true,
        configuredAvailability: AdapterAvailability.AVAILABLE,
        availabilityStatus: AgentAvailabilityStatus.DEGRADED,
        unavailableReasons: [
          "local_model_endpoint_unreachable:ollama:http%3A%2F%2F127.0.0.1%3A11434:ECONNREFUSED:refused",
        ],
        failureAttributions: ["configuration_missing"],
        capabilitySupportByCapability: new Map([
          ["structured_output", AgentCapabilitySupportLevel.SUPPORTED],
        ]),
      },
    ],
    roleEvaluations: [
      {
        roleId: "reviewer",
        roleProfileId: "default.reviewer",
        required: true,
        primarySurface: AdapterSurface.CLAUDE_CODE,
        selectedSurface: AdapterSurface.OLLAMA,
        selectedBy: CliAdapterRoleSelectionSource.FALLBACK,
        unsupportedCapabilities: [],
        degradedCapabilities: ["structured_output"],
        unavailableReasons: ["surface_unavailable:claude_code:login_required"],
        failureAttributions: ["configuration_missing"],
        status: CliGovernanceCheckStatus.WARN,
      },
    ],
  };
}

describe("Cli adapter diagnostics runtime", () => {
  it("renders human-friendly probe detail and safe_local boundary payload", () => {
    const runtime = new CliAdapterDiagnosticsRuntime(
      (english) => english,
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

    expect(detail).toContain("availability=degraded");
    expect(detail).toContain("attribution=configuration_missing");
    expect(detail).toContain('local-model surface "ollama" cannot reach endpoint');
    expect(safeLocalBoundary.mode).toBe("safe_local_only");
    expect(safeLocalBoundary.fixEnabled).toBe(true);
  });

  it("shapes verification payload, role progress, and prompts outside the facade", () => {
    const runtime = new CliAdapterDiagnosticsRuntime(
      (english) => english,
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
      diagnosticsPath: "/tmp/connect.json",
      executionId: "connect-123",
    });
    const prompts = runtime.createAdapterInteractionPrompts({
      verification,
      stage: ExecutionProgressStage.CONNECT,
    });

    expect(payload.failureAttributionSummary?.configuration_missing).toBe(2);
    expect(rows[0]?.roleId).toBe("reviewer");
    expect(rows[0]?.status).toBe("warning");
    expect(rows[0]?.backlink?.artifactPath).toBe("/tmp/connect.json");
    expect(prompts[0]?.blocking).toBe(false);
    expect(prompts[0]?.title).toBe("Adapter route attention");
  });

  it("humanizes rate-limited and quota-exhausted remote health-check failures", () => {
    const runtime = new CliAdapterDiagnosticsRuntime(
      (english) => english,
      () => ({
        environment_precondition: 1,
      }),
    );

    const rateLimitedDetail = runtime.resolveToolProbeCheckDetail({
      toolId: AdapterSurface.CODEX,
      enabled: true,
      configuredAvailability: AdapterAvailability.AVAILABLE,
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      unavailableReasons: ["health_check_failed:codex:rate_limited"],
      failureAttributions: ["environment_precondition"],
      capabilitySupportByCapability: new Map(),
    });
    const quotaExhaustedDetail = runtime.resolveToolProbeCheckDetail({
      toolId: AdapterSurface.GITHUB_COPILOT,
      enabled: true,
      configuredAvailability: AdapterAvailability.AVAILABLE,
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      unavailableReasons: ["health_check_failed:github-copilot:quota_exhausted"],
      failureAttributions: ["environment_precondition"],
      capabilitySupportByCapability: new Map(),
    });

    expect(rateLimitedDetail).toContain('surface "codex" health check is currently rate limited');
    expect(quotaExhaustedDetail).toContain(
      'surface "github-copilot" health check is blocked by exhausted quota',
    );
  });
});
