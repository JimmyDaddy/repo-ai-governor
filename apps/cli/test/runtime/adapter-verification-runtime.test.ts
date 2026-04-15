import {
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCapabilitySupportLevel,
  type AgentProtocolContract,
  buildLayeredHealthCheckResult,
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig } from '@repo-ai-governor/config';
import {
  AdapterAvailability,
  AdapterCredentialSource,
  AdapterEndpointSource,
  AdapterProviderKind,
  AdapterRequestCancellationMode,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  DEFAULT_I18N_RUNTIME_CONFIG,
  DefaultRoleProfileId,
  GovernorErrorCode,
  I18nRuntime,
  LocalModelProvider,
  RuntimeError,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  expectNativeCliExecPreservedFacts,
  hasAgentHealthDiagnostic,
} from '../../../../test/native-cli-exec-compatibility-harness.js';
import {
  CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
  CLI_ACP_HOST_HEALTH_CHECK_FAILURE_DETAIL,
} from '../../src/constants/cli-acp-host.constant.js';
import {
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliAdapterRoutingRuntime } from '../../src/runtime/adapter-routing-runtime.js';
import { CliAdapterVerificationRuntime } from '../../src/runtime/adapter-verification-runtime.js';
import { CliLocalModelProbeRuntime } from '../../src/runtime/local-model-probe-runtime.js';
import type { CliSecretService } from '../../src/runtime/secrets/cli-secret-service.js';

function createProbeResult(
  surface: AdapterSurface,
  capability: AgentCapability,
  supportLevel: AgentCapabilitySupportLevel,
) {
  return {
    identity: {
      agentId: `${surface}-agent`,
      role: 'coder',
      surface,
      roleProfileId: DefaultRoleProfileId.CODER,
      roleSource: 'default',
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

function createMockSecretService(
  options: {
    defaultBackendId?: string | null;
    selectedBackendId?: string | null;
    backends?: Array<{
      backendId: string;
      available: boolean;
      detail: string;
      warning?: string | null;
    }>;
    resolvedSecrets?: Record<
      string,
      {
        backendId: string;
        value: string;
      }
    >;
  } = {},
): CliSecretService {
  const resolvedSecrets = options.resolvedSecrets ?? {};
  const backends = options.backends ?? [];

  return {
    setLocalizeText: vi.fn(),
    getStatus: vi.fn(async () => ({
      selectedBackendId: options.selectedBackendId ?? options.defaultBackendId ?? null,
      defaultBackendId: options.defaultBackendId ?? null,
      indexPath: '/tmp/test-secret-index.json',
      backends,
    })),
    resolveSecretValue: vi.fn(async ({ selector }: { selector: string }) => {
      const resolvedSecret = resolvedSecrets[selector];
      if (!resolvedSecret) {
        return null;
      }
      return {
        keyName: selector.replace(/^secret:\/\//u, ''),
        backendId: resolvedSecret.backendId,
        value: resolvedSecret.value,
      };
    }),
    parseSelector: vi.fn((selector: string) => selector.replace(/^secret:\/\//u, '')),
  } as unknown as CliSecretService;
}

describe('Cli adapter verification runtime', () => {
  it('prefers direct copilot CLI version probe before gh wrapper fallback', async () => {
    const commandProbeExecutor = vi.fn(async () => undefined);
    const runtime = new CliLocalModelProbeRuntime(
      undefined,
      commandProbeExecutor,
      (error) => standardizeError(error).message,
    );

    const resolution = await runtime.probeLocalAdapterAvailability(AdapterSurface.GITHUB_COPILOT, {
      toolId: AdapterSurface.GITHUB_COPILOT,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
    });

    expect(resolution.availabilityStatus).toBe(AgentAvailabilityStatus.AVAILABLE);
    expect(commandProbeExecutor).toHaveBeenCalledTimes(1);
    expect(commandProbeExecutor).toHaveBeenNthCalledWith(1, 'copilot', ['--version']);
  });

  it('falls back to gh copilot wrapper when direct copilot binary is missing', async () => {
    const commandProbeExecutor = vi.fn(async (command: string) => {
      if (command === 'copilot') {
        throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'spawn copilot ENOENT');
      }
    });
    const runtime = new CliLocalModelProbeRuntime(
      undefined,
      commandProbeExecutor,
      (error) => standardizeError(error).message,
    );

    const resolution = await runtime.probeLocalAdapterAvailability(AdapterSurface.GITHUB_COPILOT, {
      toolId: AdapterSurface.GITHUB_COPILOT,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
    });

    expect(resolution.availabilityStatus).toBe(AgentAvailabilityStatus.AVAILABLE);
    expect(commandProbeExecutor).toHaveBeenNthCalledWith(1, 'copilot', ['--version']);
    expect(commandProbeExecutor).toHaveBeenNthCalledWith(2, 'gh', ['copilot', '--', '--version']);
  });

  it('trusts endpoint-backed ollama config before local command probing', async () => {
    const commandProbeExecutor = vi.fn(async () => {
      throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'probe should not execute');
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
        endpoint: 'http://127.0.0.1:11434',
        model: 'qwen2.5-coder:7b',
        maxRetries: 0,
      },
    });

    expect(resolution.availabilityStatus).toBe(AgentAvailabilityStatus.AVAILABLE);
    expect(resolution.unavailableReasons).toEqual([]);
    expect(commandProbeExecutor).not.toHaveBeenCalled();
  });

  it('passes abort signal into local probe execution and rethrows standardized cancellation', async () => {
    const commandProbeExecutor = vi.fn(
      async (_command: string, _args: readonly string[], abortSignal?: AbortSignal) =>
        await new Promise<void>((_resolve, reject) => {
          if (abortSignal?.aborted) {
            reject(new DOMException('aborted', 'AbortError'));
            return;
          }
          abortSignal?.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    const runtime = new CliLocalModelProbeRuntime(
      undefined,
      commandProbeExecutor,
      (error) => standardizeError(error).message,
    );
    const abortController = new AbortController();

    const probePromise = runtime.probeLocalAdapterAvailability(
      AdapterSurface.CODEX,
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
      abortController.signal,
    );
    abortController.abort();

    await expect(probePromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });
    expect(commandProbeExecutor).toHaveBeenCalledWith(
      'codex',
      ['--version'],
      abortController.signal,
    );
  });

  it('skips cli_exec command probing and preserves acp_exec probe truth as its own surface', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const commandProbeExecutor = vi.fn(async () => undefined);
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
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
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(adaptersConfig);
    const localProbeRuntime = new CliLocalModelProbeRuntime(
      undefined,
      commandProbeExecutor,
      (error) => standardizeError(error).message,
    );
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
      createMockSecretService(),
      (english: string) => english,
      {},
    );

    const verification = await runtime.resolveAdapterVerification();
    const codexTool = verification.tools.find((tool) => tool.toolId === AdapterSurface.CODEX);

    expect(commandProbeExecutor).not.toHaveBeenCalled();
    expect(codexTool?.healthCheck?.transportKind).toBe(AdapterTransportKind.ACP_EXEC);
    expect(codexTool?.unavailableReasons).toContain(
      'health_check_failed:codex:acp_host_transport_not_ready',
    );
    expect(
      codexTool?.unavailableReasons.some((reason) => reason.startsWith('command_missing:')),
    ).toBe(false);
  });

  it('emits ACP-specific next actions instead of generic probe-unavailable hints for acp_exec surfaces', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
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
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(adaptersConfig);
    const localProbeRuntime = new CliLocalModelProbeRuntime(
      undefined,
      async () => undefined,
      (error) => standardizeError(error).message,
    );
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
      createMockSecretService(),
      (english: string) => english,
      {},
    );

    const verification = await runtime.resolveAdapterVerification();

    expect(verification.nextActions).toContain(
      'Complete ACP runtime-service enablement and host handoff verification before relying on: codex.',
    );
    expect(verification.nextActions).toContain(
      'Capture ACP packaged-distribution evidence and keep it transport-scoped for: codex.',
    );
    expect(verification.nextActions).not.toContain(
      'Probe/login dependencies are unavailable for: codex.',
    );
    expect(verification.nextActions).not.toContain(
      `Investigate remote adapter health checks before unattended execution: ${CLI_ACP_HOST_HEALTH_CHECK_FAILURE_DETAIL}.`,
    );
  });

  it('stops asking for ACP clean-room verify once clean-room evidence is already projected', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
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
    const healthCheck = buildLayeredHealthCheckResult({
      adapterId: 'codex-acp-host-protocol',
      surfaceId: AdapterSurface.CODEX,
      availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
      selectedEntrypoint: AdapterSurface.CODEX,
      routeKey: 'cli.adapter.probe.codex',
      unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
      transportKind: AdapterTransportKind.ACP_EXEC,
      requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      diagnostics: [
        {
          layer: 'protocol',
          status: 'warn',
          code: 'protocol.acp_host_readiness_status',
          detail: 'runtime_service_ready',
        },
        {
          layer: 'protocol',
          status: 'warn',
          code: 'protocol.acp_distribution_boundary',
          detail: 'packaged_distribution_ready',
        },
        {
          layer: 'protocol',
          status: 'warn',
          code: 'protocol.acp_companion_state_summary',
          detail: CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
        },
      ],
    });
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(
      adaptersConfig,
    ) as CliAdapterRoutingRuntime & {
      createProtocolBySurface: () => Record<string, AgentProtocolContract>;
      createToolConfigBySurfaceMap: () => Map<
        AdapterSurface,
        NonNullable<AdaptersConfig['tools']>[number]
      >;
      resolveRoleBindingCandidateSurfaces: (
        roleBinding: AdaptersConfig['routing']['roleBindings'][string],
      ) => AdapterSurface[];
      resolveTrackedAdapterSurfaces: (
        trackedToolConfigBySurface?: Map<
          AdapterSurface,
          NonNullable<AdaptersConfig['tools']>[number]
        >,
      ) => AdapterSurface[];
    };
    const toolConfigBySurface = new Map([
      [
        AdapterSurface.CODEX,
        adaptersConfig.tools?.[0] as NonNullable<AdaptersConfig['tools']>[number],
      ],
    ]);
    adapterRoutingRuntime.createToolConfigBySurfaceMap = () => toolConfigBySurface;
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: {
        probe: async () => ({
          identity: {
            agentId: 'codex-acp-host-agent',
            role: 'coder',
            surface: AdapterSurface.CODEX,
            roleProfileId: DefaultRoleProfileId.CODER,
            roleSource: 'default',
          },
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          capabilityMatrix: {
            capabilityStates: Object.values(AgentCapability).map((capability) => ({
              capability,
              supportLevel:
                capability === AgentCapability.TOOL_CALLING
                  ? AgentCapabilitySupportLevel.SUPPORTED
                  : AgentCapabilitySupportLevel.UNSUPPORTED,
            })),
            timeout: {
              supportsAgentInvocationTimeout: true,
              supportsStageTimeoutSignal: true,
              supportsFlowTimeoutSignal: false,
            },
            cancellation: {
              supportsCancel: false,
              supportsReasonPropagation: false,
              supportsAbortSignal: false,
            },
            contextWindow: {
              supportsAutoTruncation: true,
            },
          },
          unavailableReasons: ['health_check_failed:codex:acp_host_transport_not_ready'],
          healthCheck,
        }),
      } as AgentProtocolContract,
    });
    adapterRoutingRuntime.resolveRoleBindingCandidateSurfaces = (roleBinding) => [
      roleBinding.primarySurface,
    ];
    adapterRoutingRuntime.resolveTrackedAdapterSurfaces = (trackedToolConfigBySurface) =>
      Array.from((trackedToolConfigBySurface ?? new Map()).keys());
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      new CliLocalModelProbeRuntime(
        undefined,
        async () => undefined,
        (error) => standardizeError(error).message,
      ),
      createMockSecretService(),
      (english: string) => english,
      {},
    );

    const verification = await runtime.resolveAdapterVerification();

    expect(verification.nextActions).not.toContain(
      'ACP runtime-service and packaged-distribution evidence exist for codex; run clean-room verify and keep support wording gated to evidence-backed surfaces.',
    );
  });

  it('aggregates configuration_missing attribution from extracted verification runtime', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
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
      [AdapterSurface.OLLAMA, ollamaToolConfig as NonNullable<AdaptersConfig['tools']>[number]],
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
        roleBinding: AdaptersConfig['routing']['roleBindings'][string],
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
            'invokeStage not used in verification unit test',
          );
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'requestConfirmation not used in verification unit test',
          );
        },
        cancel: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'cancel not used in verification unit test',
          );
        },
      },
    };
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
      createMockSecretService(),
      (english: string) => english,
      {},
    );

    const verification = await runtime.resolveAdapterVerification();

    expect(verification.overallStatus).toBe(CliGovernanceCheckStatus.FAIL);
    expect(verification.tools[0]?.failureAttributions).toContain('configuration_missing');
    expect(
      verification.nextActions.some((action) =>
        action.includes('Provide adapters.tools[].localModel'),
      ),
    ).toBe(true);
    expect(runtime.createFailureAttributionSummary(verification).configuration_missing).toBe(2);
  });

  it('surfaces remote-api env credential next actions with transport-aware detail', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CODEX,
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
            credentialEnvVar: 'OPENAI_API_KEY',
          },
        },
      ],
    };
    const codexToolConfig = adaptersConfig.tools?.[0];
    expect(codexToolConfig).toBeDefined();
    const toolConfigBySurface = new Map([
      [AdapterSurface.CODEX, codexToolConfig as NonNullable<AdaptersConfig['tools']>[number]],
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
        roleBinding: AdaptersConfig['routing']['roleBindings'][string],
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
      [AdapterSurface.CODEX]: {
        probe: async () => ({
          ...createProbeResult(
            AdapterSurface.CODEX,
            AgentCapability.TOOL_CALLING,
            AgentCapabilitySupportLevel.SUPPORTED,
          ),
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['credential_missing:codex:OPENAI_API_KEY'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['credential_missing:codex:OPENAI_API_KEY'],
            transportKind: AdapterTransportKind.REMOTE_API,
            providerKind: AdapterProviderKind.OPENAI,
            vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
            credentialSource: AdapterCredentialSource.ENV_DEFAULT,
            endpointSource: AdapterEndpointSource.VENDOR_DEFAULT,
          }),
        }),
        invokeStage: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'invokeStage not used in verification unit test',
          );
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'requestConfirmation not used in verification unit test',
          );
        },
        cancel: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'cancel not used in verification unit test',
          );
        },
      },
    };
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
    );

    const verification = await runtime.resolveAdapterVerification();

    expect(verification.nextActions).toContain(
      'Set or export the required remote-api credential environment variables before connect/doctor: codex:OPENAI_API_KEY.',
    );
    expect(verification.nextActions).not.toContain(
      'Authenticate or refresh login for remote adapters before connect/doctor: codex:OPENAI_API_KEY.',
    );
  });

  it('separates provider-local and credentialRef next actions for remote-api probes', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CLAUDE_CODE,
            fallbackSurfaces: [AdapterSurface.CODEX],
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CLAUDE_CODE,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.REMOTE_API,
          remoteApi: {
            provider: AdapterProviderKind.ANTHROPIC,
            vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
            model: 'claude-sonnet-4-5',
            allowProviderLocalConfig: true,
          },
        },
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
          transport: AdapterTransportKind.REMOTE_API,
          remoteApi: {
            provider: AdapterProviderKind.OPENAI,
            vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
            credentialRef: 'secret://openai/api-key',
          },
        },
      ],
    };
    const toolConfigBySurface = new Map(
      (adaptersConfig.tools ?? []).map((tool) => [tool.toolId, tool]),
    );
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
        roleBinding: AdaptersConfig['routing']['roleBindings'][string],
      ) => AdapterSurface[];
      resolveTrackedAdapterSurfaces: (
        trackedToolConfigBySurface?: typeof toolConfigBySurface,
      ) => AdapterSurface[];
    };
    adapterRoutingRuntime.createToolConfigBySurfaceMap = () => toolConfigBySurface;
    adapterRoutingRuntime.createProtocolBySurface = () => protocolBySurface;
    adapterRoutingRuntime.resolveRoleBindingCandidateSurfaces = (roleBinding) => [
      roleBinding.primarySurface,
      ...(roleBinding.fallbackSurfaces ?? []),
    ];
    adapterRoutingRuntime.resolveTrackedAdapterSurfaces = (trackedToolConfigBySurface) =>
      Array.from((trackedToolConfigBySurface ?? new Map()).keys());
    const protocolBySurface: Record<string, AgentProtocolContract> = {
      [AdapterSurface.CLAUDE_CODE]: {
        probe: async () => ({
          ...createProbeResult(
            AdapterSurface.CLAUDE_CODE,
            AgentCapability.TOOL_CALLING,
            AgentCapabilitySupportLevel.SUPPORTED,
          ),
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['credential_missing:claude-code:provider-local'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'claude-code-agent',
            surfaceId: AdapterSurface.CLAUDE_CODE,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CLAUDE_CODE,
            routeKey: 'cli.adapter.probe.claude-code',
            unavailableReasons: ['credential_missing:claude-code:provider-local'],
            transportKind: AdapterTransportKind.REMOTE_API,
            providerKind: AdapterProviderKind.ANTHROPIC,
            vendorBindingKind: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
            model: 'claude-sonnet-4-5',
            credentialSource: AdapterCredentialSource.PROVIDER_LOCAL,
            endpointSource: AdapterEndpointSource.PROVIDER_LOCAL,
          }),
        }),
        invokeStage: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'invokeStage not used in verification unit test',
          );
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'requestConfirmation not used in verification unit test',
          );
        },
        cancel: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'cancel not used in verification unit test',
          );
        },
      },
      [AdapterSurface.CODEX]: {
        probe: async () => ({
          ...createProbeResult(
            AdapterSurface.CODEX,
            AgentCapability.TOOL_CALLING,
            AgentCapabilitySupportLevel.SUPPORTED,
          ),
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['credential_missing:codex:secret://openai/api-key'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['credential_missing:codex:secret://openai/api-key'],
            transportKind: AdapterTransportKind.REMOTE_API,
            providerKind: AdapterProviderKind.OPENAI,
            vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
            credentialSource: AdapterCredentialSource.CREDENTIAL_REF,
            endpointSource: AdapterEndpointSource.VENDOR_DEFAULT,
          }),
        }),
        invokeStage: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'invokeStage not used in verification unit test',
          );
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'requestConfirmation not used in verification unit test',
          );
        },
        cancel: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'cancel not used in verification unit test',
          );
        },
      },
    };
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
      createMockSecretService(),
      (english: string) => english,
      {},
    );

    const verification = await runtime.resolveAdapterVerification();

    expect(verification.nextActions).toContain(
      'Remote-api credential discovery stays read-only here; verify provider-local login state manually for: claude-code:provider-local.',
    );
    expect(
      verification.nextActions.some(
        (action) =>
          action.includes('secret://openai/api-key') && action.includes('unsafe-local-file'),
      ),
    ).toBe(true);
  });

  it('prefers create/import guidance when a default secret backend is available', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CODEX,
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
            credentialRef: 'secret://openai/api-key',
          },
        },
      ],
    };
    const codexToolConfig = adaptersConfig.tools?.[0];
    expect(codexToolConfig).toBeDefined();
    const toolConfigBySurface = new Map([
      [AdapterSurface.CODEX, codexToolConfig as NonNullable<AdaptersConfig['tools']>[number]],
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
        roleBinding: AdaptersConfig['routing']['roleBindings'][string],
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
      [AdapterSurface.CODEX]: {
        probe: async () => ({
          ...createProbeResult(
            AdapterSurface.CODEX,
            AgentCapability.TOOL_CALLING,
            AgentCapabilitySupportLevel.SUPPORTED,
          ),
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['credential_missing:codex:secret://openai/api-key'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['credential_missing:codex:secret://openai/api-key'],
            transportKind: AdapterTransportKind.REMOTE_API,
            providerKind: AdapterProviderKind.OPENAI,
            vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
            credentialSource: AdapterCredentialSource.CREDENTIAL_REF,
            endpointSource: AdapterEndpointSource.VENDOR_DEFAULT,
          }),
        }),
        invokeStage: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'invokeStage not used in verification unit test',
          );
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'requestConfirmation not used in verification unit test',
          );
        },
        cancel: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'cancel not used in verification unit test',
          );
        },
      },
    };
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
      createMockSecretService({
        defaultBackendId: 'macos-keychain',
        backends: [
          {
            backendId: 'macos-keychain',
            available: true,
            detail: 'ready',
          },
        ],
      }),
      (english: string) => english,
      {},
    );

    const verification = await runtime.resolveAdapterVerification();

    expect(verification.nextActions).toContain(
      'Create or import the missing secret-backed remote-api credentials before connect/doctor: codex:secret://openai/api-key. Use `secret set` or `secret import` to populate the backend.',
    );
    expect(verification.credentialReferences).toEqual([
      {
        toolId: AdapterSurface.CODEX,
        selector: 'secret://openai/api-key',
        keyName: 'openai/api-key',
        resolved: false,
        backendId: null,
      },
    ]);
  });

  it('keeps warning-bearing default secret backends on the unsafe opt-in guidance path', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CODEX,
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
            credentialRef: 'secret://openai/api-key',
          },
        },
      ],
    };
    const codexToolConfig = adaptersConfig.tools?.[0];
    expect(codexToolConfig).toBeDefined();
    const toolConfigBySurface = new Map([
      [AdapterSurface.CODEX, codexToolConfig as NonNullable<AdaptersConfig['tools']>[number]],
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
        roleBinding: AdaptersConfig['routing']['roleBindings'][string],
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
      [AdapterSurface.CODEX]: {
        probe: async () => ({
          ...createProbeResult(
            AdapterSurface.CODEX,
            AgentCapability.TOOL_CALLING,
            AgentCapabilitySupportLevel.SUPPORTED,
          ),
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['credential_missing:codex:secret://openai/api-key'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['credential_missing:codex:secret://openai/api-key'],
            transportKind: AdapterTransportKind.REMOTE_API,
            providerKind: AdapterProviderKind.OPENAI,
            vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
            credentialSource: AdapterCredentialSource.CREDENTIAL_REF,
            endpointSource: AdapterEndpointSource.VENDOR_DEFAULT,
          }),
        }),
        invokeStage: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'invokeStage not used in verification unit test',
          );
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'requestConfirmation not used in verification unit test',
          );
        },
        cancel: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'cancel not used in verification unit test',
          );
        },
      },
    };
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
      createMockSecretService({
        defaultBackendId: 'unsafe-local-file',
        selectedBackendId: 'unsafe-local-file',
        backends: [
          {
            backendId: 'unsafe-local-file',
            available: true,
            detail: '/tmp/secrets.json',
            warning: 'plaintext fallback',
          },
        ],
      }),
      (english: string) => english,
      {},
    );

    const verification = await runtime.resolveAdapterVerification();

    expect(verification.nextActions).toContain(
      'No default secret backend is available for these credential references: codex:secret://openai/api-key. Run `secret status` to inspect backend support, or opt into `--backend unsafe-local-file` only if you accept the local-only plaintext fallback.',
    );
    expect(verification.nextActions).not.toContain(
      'Create or import the missing secret-backed remote-api credentials before connect/doctor: codex:secret://openai/api-key. Use `secret set` or `secret import` to populate the backend.',
    );
  });

  it('preserves successful credentialRef selector details for downstream diagnostics', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CODEX,
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
            credentialRef: 'secret://openai/api-key',
          },
        },
      ],
    };
    const codexToolConfig = adaptersConfig.tools?.[0];
    expect(codexToolConfig).toBeDefined();
    const toolConfigBySurface = new Map([
      [AdapterSurface.CODEX, codexToolConfig as NonNullable<AdaptersConfig['tools']>[number]],
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
        roleBinding: AdaptersConfig['routing']['roleBindings'][string],
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
      [AdapterSurface.CODEX]: {
        probe: async () => ({
          ...createProbeResult(
            AdapterSurface.CODEX,
            AgentCapability.TOOL_CALLING,
            AgentCapabilitySupportLevel.SUPPORTED,
          ),
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          unavailableReasons: [],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: [],
            diagnostics: [
              {
                layer: 'auth',
                status: 'pass',
                code: 'auth.credential_reference_resolved',
                detail: 'codex:secret://openai/api-key',
              },
            ],
            transportKind: AdapterTransportKind.REMOTE_API,
            providerKind: AdapterProviderKind.OPENAI,
            vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
            credentialSource: AdapterCredentialSource.CREDENTIAL_REF,
            endpointSource: AdapterEndpointSource.VENDOR_DEFAULT,
          }),
        }),
        invokeStage: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'invokeStage not used in verification unit test',
          );
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'requestConfirmation not used in verification unit test',
          );
        },
        cancel: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'cancel not used in verification unit test',
          );
        },
      },
    };
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
      createMockSecretService({
        defaultBackendId: 'macos-keychain',
        backends: [
          {
            backendId: 'macos-keychain',
            available: true,
            detail: 'ready',
          },
        ],
        resolvedSecrets: {
          'secret://openai/api-key': {
            backendId: 'macos-keychain',
            value: 'secret-key',
          },
        },
      }),
      (english: string) => english,
      {},
    );

    const verification = await runtime.resolveAdapterVerification();

    expect(verification.credentialReferences).toEqual([
      {
        toolId: AdapterSurface.CODEX,
        selector: 'secret://openai/api-key',
        keyName: 'openai/api-key',
        resolved: true,
        backendId: 'macos-keychain',
      },
    ]);
  });

  it('keeps explicit remote_api failures fail-closed instead of silently reusing same-surface cli_exec truth', async () => {
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
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
        {
          toolId: AdapterSurface.CLAUDE_CODE,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
        },
      ],
    };
    const toolConfigBySurface = new Map(
      (adaptersConfig.tools ?? []).map((tool) => [tool.toolId, tool]),
    );
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
        roleBinding: AdaptersConfig['routing']['roleBindings'][string],
      ) => AdapterSurface[];
      resolveTrackedAdapterSurfaces: (
        trackedToolConfigBySurface?: typeof toolConfigBySurface,
      ) => AdapterSurface[];
    };
    adapterRoutingRuntime.createToolConfigBySurfaceMap = () => toolConfigBySurface;
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: {
        probe: async () => ({
          ...createProbeResult(
            AdapterSurface.CODEX,
            AgentCapability.TOOL_CALLING,
            AgentCapabilitySupportLevel.SUPPORTED,
          ),
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['credential_missing:codex:OPENAI_API_KEY'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['credential_missing:codex:OPENAI_API_KEY'],
            transportKind: AdapterTransportKind.REMOTE_API,
            providerKind: AdapterProviderKind.OPENAI,
            vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
            model: 'gpt-5',
            credentialSource: AdapterCredentialSource.ENV_DEFAULT,
            endpointSource: AdapterEndpointSource.VENDOR_DEFAULT,
          }),
        }),
        invokeStage: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused in verification test');
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused in verification test');
        },
        cancel: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused in verification test');
        },
      },
      [AdapterSurface.CLAUDE_CODE]: {
        probe: async () => ({
          ...createProbeResult(
            AdapterSurface.CLAUDE_CODE,
            AgentCapability.TOOL_CALLING,
            AgentCapabilitySupportLevel.SUPPORTED,
          ),
          availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
          unavailableReasons: [],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'claude-code-agent',
            surfaceId: AdapterSurface.CLAUDE_CODE,
            availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
            selectedEntrypoint: AdapterSurface.CLAUDE_CODE,
            routeKey: 'cli.adapter.probe.claude-code',
            unavailableReasons: [],
            transportKind: AdapterTransportKind.CLI_EXEC,
          }),
        }),
        invokeStage: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused in verification test');
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused in verification test');
        },
        cancel: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused in verification test');
        },
      },
    });
    adapterRoutingRuntime.resolveRoleBindingCandidateSurfaces = (roleBinding) => [
      roleBinding.primarySurface,
      ...(roleBinding.fallbackSurfaces ?? []),
    ];
    adapterRoutingRuntime.resolveTrackedAdapterSurfaces = (trackedToolConfigBySurface) =>
      Array.from((trackedToolConfigBySurface ?? new Map()).keys());
    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => i18nRuntime.t(key, interpolation),
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
    );

    const verification = await runtime.resolveAdapterVerification();
    const coderRole = verification.roleEvaluations[0];
    const codexTool = verification.tools.find((tool) => tool.toolId === AdapterSurface.CODEX);

    expect(coderRole).toMatchObject({
      selectedSurface: AdapterSurface.CLAUDE_CODE,
      selectedBy: CliAdapterRoleSelectionSource.FALLBACK,
      status: CliGovernanceCheckStatus.WARN,
    });
    expect(coderRole.unavailableReasons).toContain(
      'surface_unavailable:codex:credential_missing:codex:OPENAI_API_KEY',
    );
    expect(coderRole.healthCheck?.transportKind).toBe(AdapterTransportKind.CLI_EXEC);
    expect(codexTool?.healthCheck?.transportKind).toBe(AdapterTransportKind.REMOTE_API);
    expect(codexTool?.availabilityStatus).toBe(AgentAvailabilityStatus.UNAVAILABLE);
    expect(verification.nextActions).toContain(
      'Set or export the required remote-api credential environment variables before connect/doctor: codex:OPENAI_API_KEY.',
    );
  });

  it('preserves cli_exec launch truth when probe parsing fails before onboarding consumers read verification rows', async () => {
    const _i18nRuntime = new I18nRuntime(DEFAULT_I18N_RUNTIME_CONFIG);
    const adaptersConfig: AdaptersConfig = {
      roles: [
        {
          roleId: 'coder',
          roleProfileId: DefaultRoleProfileId.CODER,
          requiredCapabilities: [AgentCapability.TOOL_CALLING],
          required: true,
        },
      ],
      routing: {
        roleBindings: {
          coder: {
            primarySurface: AdapterSurface.CODEX,
            fallbackSurfaces: [],
          },
        },
      },
      tools: [
        {
          toolId: AdapterSurface.CODEX,
          enabled: true,
          availability: AdapterAvailability.AVAILABLE,
        },
      ],
    };
    const toolConfigBySurface = new Map(
      (adaptersConfig.tools ?? []).map((tool) => [tool.toolId, tool]),
    );
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
        roleBinding: AdaptersConfig['routing']['roleBindings'][string],
      ) => AdapterSurface[];
      resolveTrackedAdapterSurfaces: (
        trackedToolConfigBySurface?: typeof toolConfigBySurface,
      ) => AdapterSurface[];
    };
    adapterRoutingRuntime.createToolConfigBySurfaceMap = () => toolConfigBySurface;
    adapterRoutingRuntime.createProtocolBySurface = () => ({
      [AdapterSurface.CODEX]: {
        probe: async () => ({
          ...createProbeResult(
            AdapterSurface.CODEX,
            AgentCapability.TOOL_CALLING,
            AgentCapabilitySupportLevel.SUPPORTED,
          ),
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: ['health_check_invalid_response:codex:malformed_json'],
          healthCheck: buildLayeredHealthCheckResult({
            adapterId: 'codex-agent',
            surfaceId: AdapterSurface.CODEX,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            selectedEntrypoint: AdapterSurface.CODEX,
            routeKey: 'cli.adapter.probe.codex',
            unavailableReasons: ['health_check_invalid_response:codex:malformed_json'],
            transportKind: AdapterTransportKind.CLI_EXEC,
            requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
            diagnostics: [
              {
                layer: 'install',
                status: 'pass',
                code: 'install.entrypoint_resolution',
                detail: AdapterSurface.CODEX,
              },
              {
                layer: 'protocol',
                status: 'pass',
                code: 'protocol.shell_wrapped',
                detail: 'false',
              },
              {
                layer: 'protocol',
                status: 'pass',
                code: 'protocol.process_tree_policy',
                detail: 'process_group_best_effort',
              },
            ],
          }),
        }),
        invokeStage: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused in verification test');
        },
        streamEvents: async function* () {},
        requestConfirmation: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused in verification test');
        },
        cancel: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused in verification test');
        },
      },
    });
    adapterRoutingRuntime.resolveRoleBindingCandidateSurfaces = (roleBinding) => [
      roleBinding.primarySurface,
      ...(roleBinding.fallbackSurfaces ?? []),
    ];
    adapterRoutingRuntime.resolveTrackedAdapterSurfaces = (trackedToolConfigBySurface) =>
      Array.from((trackedToolConfigBySurface ?? new Map()).keys());

    const runtime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key) => key,
      (error) => standardizeError(error).message,
      adapterRoutingRuntime,
      localProbeRuntime,
    );

    const verification = await runtime.resolveAdapterVerification();
    const codexTool = verification.tools.find((tool) => tool.toolId === AdapterSurface.CODEX);

    expect(codexTool?.healthCheck).toEqual(
      expect.objectContaining({
        selectedEntrypoint: AdapterSurface.CODEX,
        requestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      }),
    );
    expectNativeCliExecPreservedFacts('probe_protocol_parse_failed', {
      launch_diagnostics_preserved:
        codexTool?.healthCheck?.selectedEntrypoint === AdapterSurface.CODEX &&
        hasAgentHealthDiagnostic(
          codexTool.healthCheck?.diagnostics,
          'install.entrypoint_resolution',
          AdapterSurface.CODEX,
        ) &&
        hasAgentHealthDiagnostic(
          codexTool.healthCheck?.diagnostics,
          'protocol.process_tree_policy',
          'process_group_best_effort',
        ),
      adapter_launch_truth_projected:
        codexTool?.healthCheck?.selectedEntrypoint === AdapterSurface.CODEX &&
        codexTool.healthCheck?.requestCancellationMode ===
          AdapterRequestCancellationMode.NOT_SUPPORTED,
    });
  });
});
