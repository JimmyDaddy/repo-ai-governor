import {
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCapabilitySupportLevel,
  type AgentProtocolContract,
} from "@repo-ai-governor/adapter-sdk";
import type { AdaptersConfig } from "@repo-ai-governor/config";
import {
  AdapterAvailability,
  AdapterSurface,
  DefaultRoleProfileId,
  GovernorErrorCode,
  LocalModelProvider,
  RuntimeError,
  standardizeError,
} from "@repo-ai-governor/shared";
import { CliGovernanceCheckStatus } from "../../src/constants/cli-governance-runtime.constant.js";
import { CliAdapterRoutingRuntime } from "../../src/runtime/adapter-routing-runtime.js";
import { CliAdapterVerificationRuntime } from "../../src/runtime/adapter-verification-runtime.js";
import { CliLocalModelProbeRuntime } from "../../src/runtime/local-model-probe-runtime.js";

function createProbeResult(
  surface: AdapterSurface,
  capability: AgentCapability,
  supportLevel: AgentCapabilitySupportLevel,
) {
  return {
    identity: {
      agentId: `${surface}-agent`,
      role: "coder",
      surface,
      roleProfileId: DefaultRoleProfileId.CODER,
      roleSource: "default",
    },
    availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
    capabilityMatrix: {
      capabilityStates: Object.values(AgentCapability).map((candidateCapability) => ({
        capability: candidateCapability,
        supportLevel:
          candidateCapability === capability
            ? supportLevel
            : AgentCapabilitySupportLevel.UNSUPPORTED,
      })),
      timeout: {
        supportsAgentInvocationTimeout: true,
        supportsStageTimeoutSignal: true,
        supportsFlowTimeoutSignal: true,
      },
      cancellation: {
        supportsCancel: true,
        supportsReasonPropagation: true,
        supportsAbortSignal: true,
      },
      contextWindow: {
        maxInputTokens: 8000,
        maxOutputTokens: 4000,
        supportsAutoTruncation: true,
      },
    },
    unavailableReasons: [],
  };
}

describe("Cli adapter verification runtime", () => {
  it("trusts endpoint-backed ollama config before local command probing", async () => {
    const commandProbeExecutor = vi.fn(async () => {
      throw new RuntimeError(GovernorErrorCode.UNKNOWN, "probe should not execute");
    });
    const runtime = new CliLocalModelProbeRuntime(
      undefined,
      commandProbeExecutor,
      (error) => standardizeError(error).message,
    );

    const resolution = await runtime.probeLocalAdapterAvailability(AdapterSurface.OLLAMA, {
      toolId: AdapterSurface.OLLAMA,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
      localModel: {
        provider: LocalModelProvider.OLLAMA,
        endpoint: "http://127.0.0.1:11434",
        model: "qwen2.5-coder:7b",
        maxRetries: 0,
      },
    });

    expect(resolution.availabilityStatus).toBe(AgentAvailabilityStatus.AVAILABLE);
    expect(resolution.unavailableReasons).toEqual([]);
    expect(commandProbeExecutor).not.toHaveBeenCalled();
  });

  it("aggregates configuration_missing attribution from extracted verification runtime", async () => {
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: "coder",
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.CONTEXT_WINDOW],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.OLLAMA,
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.OLLAMA,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
        },
      ],
    };
    const ollamaToolConfig = adaptersConfig.tools?.[0];
    expect(ollamaToolConfig).toBeDefined();
    const toolConfigBySurface = new Map([
      [AdapterSurface.OLLAMA, ollamaToolConfig as NonNullable<AdaptersConfig["tools"]>[number]],
    ]);
    const localProbeRuntime = new CliLocalModelProbeRuntime(
      undefined,
      async () => undefined,
      (error) => standardizeError(error).message,
    );
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createToolConfigBySurfaceMap: () => typeof toolConfigBySurface;
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
      resolveRoleBindingCandidateSurfaces: (
        roleBinding: AdaptersConfig["routing"]["roleBindings"][string],
      ) => AdapterSurface[];
      resolveTrackedAdapterSurfaces: (
        trackedToolConfigBySurface?: typeof toolConfigBySurface,
      ) => AdapterSurface[];
    };
    adapterRoutingRuntime.createToolConfigBySurfaceMap = () => toolConfigBySurface;
    adapterRoutingRuntime.createProtocolBySurface = () => protocolBySurface;
    adapterRoutingRuntime.resolveRoleBindingCandidateSurfaces = (roleBinding) => [
      roleBinding.primarySurface,
    ];
    adapterRoutingRuntime.resolveTrackedAdapterSurfaces = (trackedToolConfigBySurface) =>
      Array.from((trackedToolConfigBySurface ?? new Map()).keys());
    const protocolBySurface: Record<string, AgentProtocolContract> = {
      [AdapterSurface.OLLAMA]: {
        probe: async () =>
          createProbeResult(
            AdapterSurface.OLLAMA,
            AgentCapability.CONTEXT_WINDOW,
            AgentCapabilitySupportLevel.SUPPORTED,
          ),
        invokeStage: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            "invokeStage not used in verification unit test",
          );
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            "requestConfirmation not used in verification unit test",
          );
        },
        cancel: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            "cancel not used in verification unit test",
          );
        },
      },
    };
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (english) => english,
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
    );

    const verification = await runtime.resolveAdapterVerification();

    expect(verification.overallStatus).toBe(CliGovernanceCheckStatus.FAIL);
    expect(verification.tools[0]?.failureAttributions).toContain("configuration_missing");
    expect(
      verification.nextActions.some((action) =>
        action.includes("Provide adapters.tools[].localModel"),
      ),
    ).toBe(true);
    expect(runtime.createFailureAttributionSummary(verification).configuration_missing).toBe(2);
  });
});
