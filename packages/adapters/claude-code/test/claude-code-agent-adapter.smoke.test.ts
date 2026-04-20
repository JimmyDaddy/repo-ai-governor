import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY,
  AgentCancellationReason,
  AgentCancellationScope,
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentCliExecOperation,
  AgentConfirmationDecision,
  AgentStageContinuationMode,
  AgentStageContinuationStatus,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from '@repo-ai-governor/adapter-sdk';
import {
  AdapterCredentialSource,
  AdapterEndpointSource,
  AdapterProviderKind,
  AdapterRequestCancellationMode,
  AdapterVendorBindingKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  collectStreamEventStatuses,
  expectNativeCliExecPreservedFacts,
  hasAgentHealthDiagnostic,
} from '../../../../test/native-cli-exec-compatibility-harness.js';
import {
  expectFallbackEntrypointProjection,
  expectInvokeLaunchTruthProjected,
  expectProbeLaunchTruthProjected,
} from '../../../../test/native-cli-exec-launch-authoring-harness.js';
import {
  ClaudeCodeAgentAdapter,
  ClaudeCodeAgentAdapterExecutionMode,
  type ClaudeCodeExecRunner,
} from '../src/index.js';

function createStreamRequest(): AgentStreamEventsRequest {
  return {
    processId: 'process-1',
    executionId: 'execution-1',
    stageId: 'stage-1',
    routeKey: 'codegen',
    input: {
      prompt: 'implement feature',
    },
  };
}

function createSseResponse(
  chunks: string[],
  signal?: AbortSignal | null,
  options: {
    stallAfterChunks?: boolean;
  } = {},
): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        let closed = false;
        const close = () => {
          if (!closed) {
            closed = true;
            controller.close();
          }
        };
        const fail = () => {
          if (!closed) {
            closed = true;
            controller.error(new DOMException('The operation was aborted.', 'AbortError'));
          }
        };
        signal?.addEventListener('abort', fail, { once: true });
        let index = 0;
        const pump = () => {
          if (index < chunks.length) {
            controller.enqueue(encoder.encode(chunks[index] ?? ''));
            index += 1;
            if (index >= chunks.length && !options.stallAfterChunks) {
              close();
              return;
            }
            queueMicrotask(pump);
            return;
          }
          if (!options.stallAfterChunks) {
            close();
          }
        };
        pump();
      },
    }),
    {
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
      },
    },
  );
}

describe('claude-code-agent-adapter smoke', () => {
  const createClaudeCodeExecRunner = (responseText = 'OK'): ClaudeCodeExecRunner => {
    return async ({ prompt, operation }) => ({
      stdout:
        operation === AgentCliExecOperation.PROBE || prompt.includes('Respond with exactly OK.')
          ? 'OK\n'
          : `${responseText}\n`,
      stderr: '',
      exitCode: 0,
      signal: null,
      elapsedMs: 11,
      launchDiagnostics: {
        selectedEntrypoint: 'claude',
        shellWrapped: false,
        processTreePolicy: 'process_group_best_effort',
      },
    });
  };

  it('returns Claude Code capability matrix via probe', async () => {
    const adapter = new ClaudeCodeAgentAdapter();

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });
    const parallelTaskCapability = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.PARALLEL_TASK,
    );

    expect(probeResult.identity.surface).toBe('claude-code');
    expect(probeResult.capabilityMatrix.capabilityStates).toHaveLength(
      Object.values(AgentCapability).length,
    );
    expect(parallelTaskCapability?.supportLevel).toBe(AgentCapabilitySupportLevel.DEGRADED);
  });

  it('returns truthful capability matrix in cli_exec mode', async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createClaudeCodeExecRunner(),
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });
    const confirmationGate = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.CONFIRMATION_GATE,
    );
    const cancellation = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.CANCELLATION,
    );
    const structuredOutput = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.STRUCTURED_OUTPUT,
    );

    expect(probeResult.availabilityStatus).toBe('available');
    expect(structuredOutput?.supportLevel).toBe(AgentCapabilitySupportLevel.DEGRADED);
    expect(confirmationGate?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(cancellation?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(probeResult.capabilityMatrix.cancellation.supportsCancel).toBe(false);
    expect(probeResult.capabilityMatrix.timeout.minTimeoutMs).toBe(500);
    expect(probeResult.capabilityMatrix.timeout.maxTimeoutMs).toBe(600000);
    expect(probeResult.healthCheck?.transportKind).toBe('cli_exec');
    expectProbeLaunchTruthProjected({
      selectedEntrypoint: probeResult.healthCheck?.selectedEntrypoint,
      requestCancellationMode: probeResult.healthCheck?.requestCancellationMode,
      diagnostics: probeResult.healthCheck?.diagnostics,
      expectedEntrypoint: 'claude',
      expectedRequestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
  });

  it('accepts trivial punctuation variants in probe health-check responses', async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async ({ prompt, operation }) => ({
        stdout:
          operation === AgentCliExecOperation.PROBE || prompt.includes('Respond with exactly OK.')
            ? 'OK.\n'
            : 'simulated claude code response\n',
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 11,
      }),
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('available');
  });

  it('returns normalized invocation output shape', async () => {
    const adapter = new ClaudeCodeAgentAdapter();
    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
    });

    expect(invokeResult.output.adapterSurface).toBe('claude-code');
    expect(invokeResult.output.routeKey).toBe('codegen');
  });

  it('returns normalized invocation output in cli_exec mode', async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createClaudeCodeExecRunner('simulated claude code response'),
    });
    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
    });

    expect(invokeResult.output.adapterSurface).toBe('claude-code');
    expect(invokeResult.output.responseText).toContain('simulated claude code response');
  });

  it('projects structuredResponse when cli_exec returns raw JSON text', async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createClaudeCodeExecRunner(
        JSON.stringify({
          status: 'ok',
          issues: [],
        }),
      ),
    });

    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'emit structured response',
      },
    });

    expect(invokeResult.output.responseText).toBe('{"status":"ok","issues":[]}');
    expect(invokeResult.output.structuredResponse).toEqual({
      status: 'ok',
      issues: [],
    });
  });

  it('returns explicit unsupported continuation truth in cli_exec mode', async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createClaudeCodeExecRunner('simulated claude code response'),
    });

    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
      continuation: {
        mode: AgentStageContinuationMode.PREFER_REUSE,
        sessionId: 'session-1',
        laneKey: 'session.main::stage-1::session.main::claude-code::chat_only',
      },
    });

    expect(invokeResult.output.responseText).toContain('simulated claude code response');
    expect(invokeResult.continuation).toEqual({
      status: AgentStageContinuationStatus.UNSUPPORTED,
      laneKey: 'session.main::stage-1::session.main::claude-code::chat_only',
    });
  });

  it('supports remote_api probe and invoke through Anthropic-compatible fetch', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'msg-probe',
            content: [
              {
                type: 'text',
                text: 'OK',
              },
            ],
            usage: {
              input_tokens: 4,
              output_tokens: 1,
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'msg-invoke',
            content: [
              {
                type: 'text',
                text: 'remote claude response',
              },
            ],
            usage: {
              input_tokens: 7,
              output_tokens: 5,
            },
          }),
      } as Response);
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        ANTHROPIC_API_KEY: 'test-key',
      },
      remoteApi: {
        provider: AdapterProviderKind.ANTHROPIC,
        vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        model: 'claude-sonnet-4-5',
      },
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.claude-code',
    });
    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
    });

    expect(probeResult.availabilityStatus).toBe('available');
    expect(probeResult.healthCheck?.transportKind).toBe('remote_api');
    expect(probeResult.healthCheck?.providerKind).toBe(AdapterProviderKind.ANTHROPIC);
    expect(invokeResult.output.responseText).toBe('remote claude response');
    expect(invokeResult.output.remoteMessageId).toBe('msg-invoke');
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });

  it('projects structuredResponse when remote_api returns fenced JSON text', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: 'msg-invoke',
          content: [
            {
              type: 'text',
              text: '```json\n{"status":"ok","issues":["none"]}\n```',
            },
          ],
          usage: {
            input_tokens: 7,
            output_tokens: 5,
          },
        }),
    } as Response);
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        ANTHROPIC_API_KEY: 'test-key',
      },
      remoteApi: {
        provider: AdapterProviderKind.ANTHROPIC,
        vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        model: 'claude-sonnet-4-5',
      },
    });

    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'emit structured response',
      },
    });

    expect(invokeResult.output.responseText).toBe(
      '```json\n{"status":"ok","issues":["none"]}\n```',
    );
    expect(invokeResult.output.structuredResponse).toEqual({
      status: 'ok',
      issues: ['none'],
    });
  });

  it('returns explicit unsupported continuation truth in remote_api mode', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: 'msg-invoke',
          content: [
            {
              type: 'text',
              text: 'remote claude response',
            },
          ],
          usage: {
            input_tokens: 7,
            output_tokens: 5,
          },
        }),
    } as Response);
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        ANTHROPIC_API_KEY: 'test-key',
      },
      remoteApi: {
        provider: AdapterProviderKind.ANTHROPIC,
        vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        model: 'claude-sonnet-4-5',
      },
    });

    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
      continuation: {
        mode: AgentStageContinuationMode.PREFER_REUSE,
        sessionId: 'session-1',
        laneKey: 'session.main::stage-1::session.main::claude-code::chat_only',
      },
    });

    expect(invokeResult.output.remoteMessageId).toBe('msg-invoke');
    expect(invokeResult.continuation).toEqual({
      status: AgentStageContinuationStatus.UNSUPPORTED,
      laneKey: 'session.main::stage-1::session.main::claude-code::chat_only',
    });
  });

  it('projects remote_api stream liveness metadata and remote request ids', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_input, init) =>
        createSseResponse(
          [
            'event: message_start\ndata: {"type":"message_start","message":{"id":"msg-stream-1"}}\n\n',
            'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"hello"}}\n\n',
            'event: message_stop\ndata: {"type":"message_stop","message":{"id":"msg-stream-1"}}\n\n',
          ],
          init?.signal ?? undefined,
        ),
      );
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        ANTHROPIC_API_KEY: 'test-key',
      },
      remoteApi: {
        provider: AdapterProviderKind.ANTHROPIC,
        vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        model: 'claude-sonnet-4-5',
      },
    });

    const events: AgentStreamEventType[] = [];
    const payloads: Array<Record<string, unknown>> = [];
    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
      payloads.push(event.payload);
    }

    expect(events).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(payloads[1]).toEqual(
      expect.objectContaining({
        remoteRequestId: 'msg-stream-1',
      }),
    );
    expect(payloads[2]).toEqual(
      expect.objectContaining({
        transportKind: 'remote_api',
        vendorBindingKind: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        remoteRequestId: 'msg-stream-1',
        accumulatedText: 'hello',
        invokeLiveness: expect.objectContaining({
          status: 'running',
          transportKind: 'remote_api',
          vendorBindingKind: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
          remoteRequestId: 'msg-stream-1',
          cancelMechanism: 'none',
          partialOutputPreserved: false,
          lastTransportActivityAt: expect.any(String),
          lastSemanticProgressAt: expect.any(String),
          latestTextPreview: 'hello',
        }),
      }),
    );
    expect(payloads[3]).toEqual(
      expect.objectContaining({
        remoteRequestId: 'msg-stream-1',
        invokeLiveness: expect.objectContaining({
          status: 'completed',
          remoteRequestId: 'msg-stream-1',
          lastTerminalSignalAt: expect.any(String),
          latestTextPreview: 'hello',
        }),
      }),
    );
  });

  it('keeps remote_api timeout coverage alive during stream consumption and preserves partial output', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockImplementation(async (_input, init) =>
      createSseResponse(
        [
          'event: message_start\ndata: {"type":"message_start","message":{"id":"msg-stream-timeout-1"}}\n\n',
          'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"partial"}}\n\n',
        ],
        init?.signal ?? undefined,
        {
          stallAfterChunks: true,
        },
      ),
    );
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        ANTHROPIC_API_KEY: 'test-key',
      },
      requestTimeoutMs: 30,
      remoteApi: {
        provider: AdapterProviderKind.ANTHROPIC,
        vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        model: 'claude-sonnet-4-5',
      },
    });

    const events: Array<{ type: AgentStreamEventType; payload: Record<string, unknown> }> = [];
    let thrownError: unknown;
    try {
      for await (const event of adapter.streamEvents(createStreamRequest())) {
        events.push({
          type: event.eventType,
          payload: event.payload,
        });
      }
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(RuntimeError);
    expect((thrownError as RuntimeError).message).toContain('exhausted the timeout budget');
    expect(events.map((event) => event.type)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.FAILED,
    ]);
    expect(events[3]?.payload).toEqual(
      expect.objectContaining({
        accumulatedText: 'partial',
        invokeLiveness: expect.objectContaining({
          status: 'failed',
          cancelMechanism: 'http_stream_abort',
          partialOutputPreserved: true,
          remoteRequestId: 'msg-stream-timeout-1',
          suspectReasonCodes: expect.arrayContaining([
            'invoke_hard_timeout',
            'invoke_partial_output_preserved',
          ]),
        }),
      }),
    );
  });

  it('does not restart remote_api fetch with a fresh timeout budget after one timed-out attempt', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      if (init?.signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      return await new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('The operation was aborted.', 'AbortError')),
          { once: true },
        );
      });
    });
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        ANTHROPIC_API_KEY: 'test-key',
      },
      requestTimeoutMs: 20,
      remoteApi: {
        provider: AdapterProviderKind.ANTHROPIC,
        vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        model: 'claude-sonnet-4-5',
        maxRetries: 2,
      },
    });

    await expect(
      adapter.invokeStage({
        processId: 'process-1',
        executionId: 'execution-1',
        stageId: 'stage-1',
        routeKey: 'codegen',
        input: {
          prompt: 'implement feature',
        },
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      message: expect.stringContaining('exhausted the timeout budget'),
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it('surfaces credentialRef as manual-only probe truth when remote_api is configured directly', async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
      remoteApi: {
        provider: AdapterProviderKind.ANTHROPIC,
        vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        model: 'claude-sonnet-4-5',
        credentialRef: 'secret://anthropic/api-key',
      },
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.claude-code',
    });

    expect(probeResult.availabilityStatus).toBe('unavailable');
    expect(probeResult.unavailableReasons).toContain(
      'credential_missing:claude-code:secret://anthropic/api-key',
    );
    expect(probeResult.healthCheck?.credentialSource).toBe(AdapterCredentialSource.CREDENTIAL_REF);
  });

  it('resolves remote_api credentialRef through the injected secret seam when env is absent', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'msg-probe',
            content: [
              {
                type: 'text',
                text: 'OK',
              },
            ],
            usage: {
              input_tokens: 4,
              output_tokens: 1,
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'msg-invoke',
            content: [
              {
                type: 'text',
                text: 'remote claude response',
              },
            ],
            usage: {
              input_tokens: 7,
              output_tokens: 5,
            },
          }),
      } as Response);
    const resolveCredentialRef = vi.fn(async (_selector: string) => 'secret-key');
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {},
      resolveCredentialRef,
      remoteApi: {
        provider: AdapterProviderKind.ANTHROPIC,
        vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        model: 'claude-sonnet-4-5',
        credentialRef: 'secret://anthropic/api-key',
      },
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.claude-code',
    });
    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
    });

    expect(probeResult.availabilityStatus).toBe('available');
    expect(probeResult.healthCheck?.diagnostics).toContainEqual({
      layer: 'auth',
      status: 'pass',
      code: 'auth.credential_reference_resolved',
      detail: 'claude-code:secret://anthropic/api-key',
    });
    expect(invokeResult.output.responseText).toBe('remote claude response');
    expect(resolveCredentialRef.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(
      resolveCredentialRef.mock.calls.every(
        ([selector]) => selector === 'secret://anthropic/api-key',
      ),
    ).toBe(true);
  });

  it('prefers remote_api credential env vars over credentialRef when both are configured', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: 'msg-probe',
          content: [
            {
              type: 'text',
              text: 'OK',
            },
          ],
          usage: {
            input_tokens: 4,
            output_tokens: 1,
          },
        }),
    } as Response);
    const resolveCredentialRef = vi.fn(async () => 'secret-key');
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        ANTHROPIC_API_KEY: 'env-key',
      },
      resolveCredentialRef,
      remoteApi: {
        provider: AdapterProviderKind.ANTHROPIC,
        vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        model: 'claude-sonnet-4-5',
        credentialRef: 'secret://anthropic/api-key',
      },
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.claude-code',
    });
    const requestInit = fetchImplementation.mock.calls[0]?.[1] as RequestInit | undefined;

    expect(probeResult.availabilityStatus).toBe('available');
    expect(resolveCredentialRef).not.toHaveBeenCalled();
    expect(requestInit?.headers).toMatchObject({
      'x-api-key': 'env-key',
    });
  });

  it('reads provider-local Claude settings in read-only mode when explicitly enabled', async () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'claude-provider-local-'));
    const projectRoot = join(tempRoot, 'workspace');
    mkdirSync(join(tempRoot, '.claude'), { recursive: true });
    mkdirSync(join(projectRoot, '.claude'), { recursive: true });
    writeFileSync(
      join(tempRoot, '.claude', 'settings.json'),
      JSON.stringify({
        env: {
          ANTHROPIC_API_KEY: 'provider-local-key',
          ANTHROPIC_BASE_URL: 'https://anthropic-proxy.example.test/v1/messages',
        },
      }),
      'utf8',
    );
    const fetchImplementation = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: 'message-1',
            content: [
              {
                type: 'text',
                text: 'OK',
              },
            ],
            usage: {
              input_tokens: 11,
              output_tokens: 7,
            },
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
    );

    try {
      const adapter = new ClaudeCodeAgentAdapter({
        executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
        currentWorkingDirectory: projectRoot,
        environment: {
          HOME: tempRoot,
        },
        fetchImplementation,
        remoteApi: {
          provider: AdapterProviderKind.ANTHROPIC,
          vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
          model: 'claude-sonnet-4-5',
          allowProviderLocalConfig: true,
        },
      });

      const probeResult = await adapter.probe({
        routeKey: 'cli.adapter.probe.claude-code',
      });

      expect(probeResult.availabilityStatus).toBe('available');
      expect(probeResult.healthCheck?.credentialSource).toBe(
        AdapterCredentialSource.PROVIDER_LOCAL,
      );
      expect(probeResult.healthCheck?.endpointSource).toBe(AdapterEndpointSource.PROVIDER_LOCAL);
      expect(fetchImplementation).toHaveBeenCalledWith(
        'https://anthropic-proxy.example.test/v1/messages',
        expect.any(Object),
      );
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('discovers repo-root Claude settings when launched from a workspace subdirectory', async () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'claude-provider-local-nested-'));
    const projectRoot = join(tempRoot, 'workspace');
    const launchDirectory = join(projectRoot, 'packages', 'feature-a');
    mkdirSync(join(projectRoot, '.git'), { recursive: true });
    mkdirSync(join(projectRoot, '.claude'), { recursive: true });
    mkdirSync(launchDirectory, { recursive: true });
    writeFileSync(
      join(projectRoot, '.claude', 'settings.local.json'),
      JSON.stringify({
        env: {
          ANTHROPIC_API_KEY: 'repo-root-provider-local-key',
          ANTHROPIC_BASE_URL: 'https://repo-root-anthropic.example.test/v1/messages',
        },
      }),
      'utf8',
    );
    const fetchImplementation = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: 'message-1',
            content: [
              {
                type: 'text',
                text: 'OK',
              },
            ],
            usage: {
              input_tokens: 11,
              output_tokens: 7,
            },
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
    );

    try {
      const adapter = new ClaudeCodeAgentAdapter({
        executionMode: ClaudeCodeAgentAdapterExecutionMode.REMOTE_API,
        currentWorkingDirectory: launchDirectory,
        environment: {
          HOME: tempRoot,
        },
        fetchImplementation,
        remoteApi: {
          provider: AdapterProviderKind.ANTHROPIC,
          vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
          model: 'claude-sonnet-4-5',
          allowProviderLocalConfig: true,
        },
      });

      const probeResult = await adapter.probe({
        routeKey: 'cli.adapter.probe.claude-code',
      });

      expect(probeResult.availabilityStatus).toBe('available');
      expect(probeResult.healthCheck?.credentialSource).toBe(
        AdapterCredentialSource.PROVIDER_LOCAL,
      );
      expect(probeResult.healthCheck?.endpointSource).toBe(AdapterEndpointSource.PROVIDER_LOCAL);
      expect(fetchImplementation).toHaveBeenCalledWith(
        'https://repo-root-anthropic.example.test/v1/messages',
        expect.any(Object),
      );
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('passes no-tool command arguments when chat-only policy forbids tool use', async () => {
    const execRunner = vi
      .fn<ClaudeCodeExecRunner>()
      .mockImplementationOnce(createClaudeCodeExecRunner())
      .mockImplementationOnce(async (request) => {
        expect(request.commandArgumentsPrefix).toEqual(expect.arrayContaining(['--tools', '']));
        return createClaudeCodeExecRunner('chat-only claude response')({
          ...request,
          operation: AgentCliExecOperation.INVOKE,
        });
      });
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    await adapter.probe({
      routeKey: 'codegen',
    });
    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'session.main.answer',
      input: {
        userMessage: '你好',
        [AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY]: {
          interactionMode: AgentStageExecutionMode.CHAT_ONLY,
          toolUsePolicy: AgentStageToolUsePolicy.FORBIDDEN,
        },
      },
    });

    expect(invokeResult.output.responseText).toContain('chat-only claude response');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('uses reviewer-specific read-only tool constraints for repository review stages', async () => {
    const execRunner = vi
      .fn<ClaudeCodeExecRunner>()
      .mockImplementationOnce(createClaudeCodeExecRunner())
      .mockImplementationOnce(async (request) => {
        expect(request.commandArgumentsPrefix).toEqual(
          expect.arrayContaining([
            '--allowedTools',
            'Bash(git:*) Bash(rg:*) Bash(sed:*) Bash(cat:*) Bash(ls:*) Bash(find:*) Read Grep Glob LS',
          ]),
        );
        expect(request.timeoutMs).toBeGreaterThanOrEqual(599999);
        expect(request.timeoutMs).toBeLessThanOrEqual(600000);
        expect(request.prompt).toContain('repository review stage');
        expect(request.prompt).toContain('帮我 review 一下代码');
        return createClaudeCodeExecRunner('claude review findings')({
          ...request,
          operation: AgentCliExecOperation.INVOKE,
        });
      });
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    await adapter.probe({
      routeKey: 'codegen',
    });
    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-session-main-role-reviewer',
      routeKey: 'session.main.role.reviewer',
      input: {
        roleId: 'reviewer',
        reviewScope: 'uncommitted_changes',
        userMessage: '帮我 review 一下代码',
        governorInstructions: 'inspect the repository in a read-only manner',
      },
    });

    expect(invokeResult.output.responseText).toContain('claude review findings');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('degrades confirmation/cancel semantics in cli_exec mode', async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createClaudeCodeExecRunner(),
    });

    const confirmationResult = await adapter.requestConfirmation({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      prompt: 'confirm',
    });
    const cancelResult = await adapter.cancel({
      processId: 'process-1',
      executionId: 'execution-1',
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    expect(confirmationResult.decision).toBe(AgentConfirmationDecision.REVISE);
    expect(cancelResult.acknowledged).toBe(false);
  });

  it('maps credential failures into unavailable probe reasons', async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          'Claude Code probe failed: login required',
          {
            surface: 'claude-code',
            operation: AgentCliExecOperation.PROBE,
            stderr: 'Authentication required. Run `claude auth login` first.',
          },
        );
      },
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('unavailable');
    expect(probeResult.unavailableReasons).toContain('credential_missing:claude-code');
  });

  it('retries transient cli_exec probe failures before surfacing availability', async () => {
    const execRunner = vi
      .fn<ClaudeCodeExecRunner>()
      .mockRejectedValueOnce(
        new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          'Claude Code probe failed: rate limited',
          {
            stderr: '429 rate limit exceeded',
          },
        ),
      )
      .mockResolvedValueOnce({
        stdout: 'OK\n',
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 4,
      });
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('available');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('falls back to legacy probe args when the Claude CLI does not support optimized probe flags', async () => {
    const execRunner = vi
      .fn<ClaudeCodeExecRunner>()
      .mockImplementationOnce(async (request) => {
        expect(request.commandArgumentsPrefix).toEqual(
          expect.arrayContaining(['--bare', '--tools', '']),
        );
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          'Claude Code probe failed: unknown option --bare',
          {
            stderr: "error: unknown option '--bare'",
            selectedEntrypoint: 'claude',
            shellWrapped: false,
            processTreePolicy: 'process_group_best_effort',
          },
        );
      })
      .mockImplementationOnce(async (request) => {
        expect(request.commandArgumentsPrefix).toEqual([]);
        return {
          stdout: 'OK\n',
          stderr: '',
          exitCode: 0,
          signal: null,
          elapsedMs: 4,
          launchDiagnostics: {
            selectedEntrypoint: 'claude',
            shellWrapped: false,
            processTreePolicy: 'process_group_best_effort',
          },
        };
      });
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('available');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('treats non-zero process exit as protocol failure even when stdout is present', async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => ({
        stdout: 'partial response\n',
        stderr: 'process failed',
        exitCode: 1,
        signal: null,
        elapsedMs: 6,
      }),
    });

    const invokeError = await adapter
      .invokeStage({
        processId: 'process-1',
        executionId: 'execution-1',
        stageId: 'stage-1',
        routeKey: 'codegen',
        input: {
          prompt: 'implement feature',
        },
      })
      .then(() => null)
      .catch((error) => error as RuntimeError);

    expect(invokeError).toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
    });
    const invokeDetails = invokeError?.details ?? {};
    expectInvokeLaunchTruthProjected({
      details: invokeDetails,
      expectedEntrypoint: 'claude',
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('non_zero_exit', {
      launch_diagnostics_preserved:
        invokeDetails.selectedEntrypoint === 'claude' &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
      adapter_launch_truth_projected:
        invokeDetails.selectedEntrypoint === 'claude' &&
        invokeDetails.shellWrapped === false &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
    });
  });

  it('falls back from claude to claude-code when the primary binary is missing', async () => {
    const execRunner = vi.fn<ClaudeCodeExecRunner>(async (request) => {
      if (request.command === 'claude') {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          'spawn claude ENOENT',
          {
            stderr: 'spawn claude ENOENT',
          },
        );
      }

      return {
        stdout: 'OK\n',
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 5,
        launchDiagnostics: {
          selectedEntrypoint: 'claude-code',
          shellWrapped: false,
          processTreePolicy: 'process_group_best_effort',
        },
      };
    });
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('available');
    expectFallbackEntrypointProjection({
      attemptedEntrypoints: execRunner.mock.calls.map(([request]) => request.command),
      expectedAttemptOrder: ['claude', 'claude-code'],
      projectedEntrypoint: probeResult.healthCheck?.selectedEntrypoint,
    });
    expect(execRunner).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        command: 'claude',
      }),
    );
    expect(execRunner).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        command: 'claude-code',
      }),
    );
  });

  it('preserves fallback launch diagnostics when probe parsing fails after fallback launch', async () => {
    const execRunner = vi.fn<ClaudeCodeExecRunner>(async (request) => {
      if (request.command === 'claude') {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          'spawn claude ENOENT',
          {
            stderr: 'spawn claude ENOENT',
          },
        );
      }

      return {
        stdout: '',
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 5,
        launchDiagnostics: {
          selectedEntrypoint: 'claude-code',
          shellWrapped: false,
          processTreePolicy: 'process_group_best_effort',
        },
      };
    });
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('unavailable');
    expectProbeLaunchTruthProjected({
      selectedEntrypoint: probeResult.healthCheck?.selectedEntrypoint,
      requestCancellationMode: probeResult.healthCheck?.requestCancellationMode,
      diagnostics: probeResult.healthCheck?.diagnostics,
      expectedEntrypoint: 'claude-code',
      expectedRequestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('probe_protocol_parse_failed', {
      launch_diagnostics_preserved:
        probeResult.healthCheck?.selectedEntrypoint === 'claude-code' &&
        hasAgentHealthDiagnostic(
          probeResult.healthCheck?.diagnostics,
          'install.entrypoint_resolution',
          'claude-code',
        ) &&
        hasAgentHealthDiagnostic(
          probeResult.healthCheck?.diagnostics,
          'protocol.process_tree_policy',
          'process_group_best_effort',
        ),
      adapter_launch_truth_projected:
        probeResult.healthCheck?.selectedEntrypoint === 'claude-code' &&
        hasAgentHealthDiagnostic(
          probeResult.healthCheck?.diagnostics,
          'protocol.shell_wrapped',
          'false',
        ) &&
        hasAgentHealthDiagnostic(
          probeResult.healthCheck?.diagnostics,
          'protocol.process_tree_policy',
          'process_group_best_effort',
        ),
    });
  });

  it('preserves launch diagnostics when invoke returns no response text from claude-code cli output', async () => {
    const execRunner = vi.fn<ClaudeCodeExecRunner>(async () => ({
      stdout: '',
      stderr: '',
      exitCode: 0,
      signal: null,
      elapsedMs: 5,
      launchDiagnostics: {
        selectedEntrypoint: 'claude-code',
        shellWrapped: false,
        processTreePolicy: 'process_group_best_effort',
      },
    }));
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      command: 'claude-code',
      execRunner,
    });

    const invokeError = await adapter
      .invokeStage({
        processId: 'process-1',
        executionId: 'execution-1',
        stageId: 'stage-1',
        routeKey: 'codegen',
        input: {
          prompt: 'implement feature',
        },
      })
      .then(() => null)
      .catch((error) => error as RuntimeError);

    expect(invokeError).toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      message: expect.stringContaining('returned no response text'),
    });
    const invokeDetails = invokeError?.details ?? {};
    expectInvokeLaunchTruthProjected({
      details: invokeDetails,
      expectedEntrypoint: 'claude-code',
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('invoke_protocol_parse_failed', {
      launch_diagnostics_preserved:
        invokeDetails.selectedEntrypoint === 'claude-code' &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
      adapter_launch_truth_projected:
        invokeDetails.selectedEntrypoint === 'claude-code' &&
        invokeDetails.shellWrapped === false &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
    });
  });

  it('uses lightweight probe args and places the prompt after a delimiter so --add-dir does not swallow it', async () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'claude-cli-argv-'));
    const commandPath = join(tempRoot, 'fake-claude');
    const argvLogPath = join(tempRoot, 'argv-log.json');
    writeFileSync(
      commandPath,
      [
        '#!/usr/bin/env node',
        `require('node:fs').writeFileSync(${JSON.stringify(argvLogPath)}, JSON.stringify(process.argv.slice(2)));`,
        "process.stdout.write('OK\\n');",
      ].join('\n'),
      'utf8',
    );
    chmodSync(commandPath, 0o755);

    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      command: commandPath,
      currentWorkingDirectory: tempRoot,
    });

    try {
      const probeResult = await adapter.probe({
        routeKey: 'cli.adapter.probe.claude-code',
      });
      const argv = JSON.parse(readFileSync(argvLogPath, 'utf8')) as string[];

      expect(probeResult.availabilityStatus).toBe('available');
      expect(argv).toEqual(
        expect.arrayContaining([
          '--bare',
          '--tools',
          '',
          '--add-dir',
          tempRoot,
          '--',
          'Respond with exactly OK.',
        ]),
      );
      expect(argv.indexOf('--bare')).toBeGreaterThanOrEqual(0);
      expect(argv.indexOf('--bare')).toBeLessThan(argv.indexOf('--'));
      expect(argv.indexOf('--tools')).toBeGreaterThanOrEqual(0);
      expect(argv[argv.indexOf('--tools') + 1]).toBe('');
      expect(argv.at(-2)).toBe('--');
      expect(argv.at(-1)).toBe('Respond with exactly OK.');
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('clamps requested invoke timeout overrides into the supported contract window', async () => {
    const execRunner = vi.fn<ClaudeCodeExecRunner>().mockResolvedValue({
      stdout: 'timeout contract response\n',
      stderr: '',
      exitCode: 0,
      signal: null,
      elapsedMs: 5,
    });
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-low-timeout',
      stageId: 'stage-1',
      routeKey: 'codegen',
      agentInvocationTimeoutMs: 100,
      input: {
        prompt: 'implement feature',
      },
    });
    await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-high-timeout',
      stageId: 'stage-1',
      routeKey: 'codegen',
      agentInvocationTimeoutMs: 999999,
      input: {
        prompt: 'implement feature',
      },
    });

    const firstInvokeRequest = execRunner.mock.calls[0]?.[0];
    const secondInvokeRequest = execRunner.mock.calls[1]?.[0];

    expect(firstInvokeRequest).toEqual(
      expect.objectContaining({
        timeoutMs: expect.any(Number),
      }),
    );
    expect(secondInvokeRequest).toEqual(
      expect.objectContaining({
        timeoutMs: expect.any(Number),
      }),
    );
    expect(firstInvokeRequest?.timeoutMs).toBeGreaterThanOrEqual(499);
    expect(firstInvokeRequest?.timeoutMs).toBeLessThanOrEqual(500);
    expect(secondInvokeRequest?.timeoutMs).toBeGreaterThanOrEqual(599999);
    expect(secondInvokeRequest?.timeoutMs).toBeLessThanOrEqual(600000);
  });

  it('reuses one cli_exec invocation across streamEvents and invokeStage and relays stdout/stderr incrementally', async () => {
    const abortController = new AbortController();
    const execRunner = vi.fn<ClaudeCodeExecRunner>().mockImplementation(async (request) => {
      expect(request.timeoutMs).toBeLessThanOrEqual(123000);
      expect(request.timeoutMs).toBeGreaterThan(122000);
      expect(request.signal).toBe(abortController.signal);
      if (request.onStdoutChunk) {
        request.onStdoutChunk('Review');
        request.onStdoutChunk(' findings');
      }
      if (request.onStderrChunk) {
        request.onStderrChunk('stderr progress line\n');
      }
      return {
        stdout: 'Review findings',
        stderr: 'stderr progress line\n',
        exitCode: 0,
        signal: null,
        elapsedMs: 8,
      };
    });
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });
    const invokeRequest = {
      processId: 'process-1',
      executionId: 'execution-stream-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      agentInvocationTimeoutMs: 123000,
      signal: abortController.signal,
      input: {
        prompt: 'implement feature',
      },
    };

    const streamPayloadsPromise = (async () => {
      const payloads: Array<{ type: AgentStreamEventType; payload: Record<string, unknown> }> = [];
      for await (const event of adapter.streamEvents(invokeRequest)) {
        payloads.push({
          type: event.eventType,
          payload: event.payload,
        });
      }
      return payloads;
    })();
    const invokeResultPromise = adapter.invokeStage(invokeRequest);

    const [streamPayloads, invokeResult] = await Promise.all([
      streamPayloadsPromise,
      invokeResultPromise,
    ]);

    expect(execRunner).toHaveBeenCalledTimes(1);
    expect(streamPayloads.map((event) => event.type)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(streamPayloads[0]?.payload).toEqual(
      expect.objectContaining({
        detail: 'Claude Code turn started.',
        transportKind: 'cli_exec',
        invokeLiveness: expect.objectContaining({
          status: 'starting',
          transportKind: 'cli_exec',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      }),
    );
    expect(streamPayloads[2]?.payload).toEqual(
      expect.objectContaining({
        text: ' findings',
        accumulatedText: 'Review findings',
        invokeLiveness: expect.objectContaining({
          status: 'running',
          lastTransportActivityAt: expect.any(String),
          lastSemanticProgressAt: expect.any(String),
          latestTextPreview: 'Review findings',
          transportKind: 'cli_exec',
        }),
      }),
    );
    expect(streamPayloads[4]?.payload).toEqual(
      expect.objectContaining({
        responseText: 'Review findings',
        invokeLiveness: expect.objectContaining({
          status: 'completed',
          lastTerminalSignalAt: expect.any(String),
          partialOutputPreserved: false,
        }),
      }),
    );
    expect(invokeResult.output.responseText).toBe('Review findings');
  });

  it('preserves partial cli_exec output and timeout reason codes when invocation fails', async () => {
    const adapter = new ClaudeCodeAgentAdapter({
      executionMode: ClaudeCodeAgentAdapterExecutionMode.CLI_EXEC,
      maxRetryAttempts: 1,
      execRunner: async (request) => {
        request.onStdoutChunk?.('partial');
        request.onGracefulInterruptStart?.('process_signal');
        request.onHardTerminateStart?.('process_signal');
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
          'Claude Code invoke timed out after 30ms.',
          {
            surface: 'claude-code',
            operation: AgentCliExecOperation.INVOKE,
            timeoutMs: 30,
          },
        );
      },
    });

    const invokeRequest = createStreamRequest();
    const streamEventsPromise = (async () => {
      const events: Array<{ type: AgentStreamEventType; payload: Record<string, unknown> }> = [];
      for await (const event of adapter.streamEvents(createStreamRequest())) {
        events.push({
          type: event.eventType,
          payload: event.payload,
        });
      }
      return events;
    })();
    const invokeErrorPromise = adapter
      .invokeStage(invokeRequest)
      .then(() => null)
      .catch((error) => error);

    const [events, thrownError] = await Promise.all([streamEventsPromise, invokeErrorPromise]);
    const statuses = collectStreamEventStatuses(events);

    expect(thrownError).toBeInstanceOf(RuntimeError);
    expect((thrownError as RuntimeError).message).toContain('timed out');
    expect(events.map((event) => event.type)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.FAILED,
    ]);
    expect(events[2]?.payload).toEqual(
      expect.objectContaining({
        status: 'graceful_interrupting',
        invokeLiveness: expect.objectContaining({
          status: 'graceful_interrupting',
          cancelMechanism: 'process_signal',
          suspectReasonCodes: expect.arrayContaining(['invoke_hard_timeout']),
        }),
      }),
    );
    expect(events[3]?.payload).toEqual(
      expect.objectContaining({
        status: 'hard_terminating',
        invokeLiveness: expect.objectContaining({
          status: 'hard_terminating',
          cancelMechanism: 'process_signal',
          suspectReasonCodes: expect.arrayContaining(['invoke_graceful_interrupt_exceeded']),
        }),
      }),
    );
    expect(events[4]?.payload).toEqual(
      expect.objectContaining({
        accumulatedText: 'partial',
        responseText: 'partial',
        invokeLiveness: expect.objectContaining({
          status: 'failed',
          partialOutputPreserved: true,
          cancelMechanism: 'process_signal',
          suspectReasonCodes: expect.arrayContaining([
            'invoke_hard_timeout',
            'invoke_partial_output_preserved',
          ]),
        }),
      }),
    );
    const invokeDetails = (thrownError as RuntimeError).details ?? {};
    expectInvokeLaunchTruthProjected({
      details: invokeDetails,
      expectedEntrypoint: 'claude',
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('timeout_hard_terminated', {
      launch_diagnostics_preserved:
        invokeDetails.selectedEntrypoint === 'claude' &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
      adapter_launch_truth_projected:
        invokeDetails.selectedEntrypoint === 'claude' &&
        invokeDetails.shellWrapped === false &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
      terminate_phase_preserved:
        statuses.includes('graceful_interrupting') && statuses.includes('hard_terminating'),
      partial_output_preserved_when_available: events[4]?.payload.accumulatedText === 'partial',
    });
  });

  it('streams status and completed events', async () => {
    const adapter = new ClaudeCodeAgentAdapter();
    const events = [];

    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
    }

    expect(events).toEqual([AgentStreamEventType.STATUS, AgentStreamEventType.COMPLETED]);
  });
});
