import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY,
  AgentCancellationReason,
  AgentCancellationScope,
  AgentCapability,
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
  expectInvokeLaunchTruthProjected,
  expectProbeLaunchTruthProjected,
} from '../../../../test/native-cli-exec-launch-authoring-harness.js';
import {
  CodexAgentAdapter,
  CodexAgentAdapterExecutionMode,
  type CodexExecRunner,
  type CodexExecRunnerResult,
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

function createInvokeRequest() {
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
  signal?: AbortSignal,
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

describe('codex-agent-adapter smoke', () => {
  const createExecRunnerResult = (
    responseText = 'OK',
    overrides: Partial<CodexExecRunnerResult> = {},
  ): CodexExecRunnerResult => ({
    stdout: [
      '{"type":"thread.started","thread_id":"thread-1"}',
      `{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"${responseText}"}}`,
      '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
    ].join('\n'),
    stderr: '',
    exitCode: 0,
    signal: null,
    elapsedMs: 12,
    launchDiagnostics: {
      selectedEntrypoint: 'codex',
      shellWrapped: false,
      processTreePolicy: 'process_group_best_effort',
    },
    ...overrides,
  });

  const createExecRunner = (
    responseText = 'OK',
    overrides: Partial<CodexExecRunnerResult> = {},
  ): CodexExecRunner => {
    return async () => createExecRunnerResult(responseText, overrides);
  };

  it('treats non-zero process exit as protocol failure even when completed JSON is present', async () => {
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createExecRunner('partial response', {
        stderr: 'process failed',
        exitCode: 7,
      }),
      currentWorkingDirectory: process.cwd(),
    });

    const invokeError = await adapter
      .invokeStage(createInvokeRequest())
      .then(() => null)
      .catch((error) => error as RuntimeError);

    expect(invokeError).toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      message: expect.stringContaining('exit code 7'),
    });
    const invokeDetails = invokeError?.details ?? {};
    expect(invokeDetails.exitCode).toBe(7);
    expect(invokeDetails.signal).toBeNull();
    expectInvokeLaunchTruthProjected({
      details: invokeDetails,
      expectedEntrypoint: 'codex',
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('non_zero_exit', {
      launch_diagnostics_preserved:
        invokeDetails.selectedEntrypoint === 'codex' &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
      adapter_launch_truth_projected:
        invokeDetails.selectedEntrypoint === 'codex' &&
        invokeDetails.shellWrapped === false &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
    });
  });

  it('treats signal-terminated process output as protocol failure even when completed JSON is present', async () => {
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createExecRunner('partial response', {
        stderr: 'terminated by signal',
        exitCode: null,
        signal: 'SIGTERM',
      }),
      currentWorkingDirectory: process.cwd(),
    });

    const invokeError = await adapter
      .invokeStage(createInvokeRequest())
      .then(() => null)
      .catch((error) => error as RuntimeError);

    expect(invokeError).toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      message: expect.stringContaining('signal SIGTERM'),
    });
    const invokeDetails = invokeError?.details ?? {};
    expect(invokeDetails.exitCode).toBeNull();
    expect(invokeDetails.signal).toBe('SIGTERM');
    expectInvokeLaunchTruthProjected({
      details: invokeDetails,
      expectedEntrypoint: 'codex',
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('signal_exit', {
      launch_diagnostics_preserved:
        invokeDetails.selectedEntrypoint === 'codex' &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
      adapter_launch_truth_projected:
        invokeDetails.selectedEntrypoint === 'codex' &&
        invokeDetails.shellWrapped === false &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
    });
  });

  it('treats non-zero probe process exit as unavailable even when completed JSON is present', async () => {
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createExecRunner('OK', {
        stderr: 'process failed',
        exitCode: 7,
      }),
      currentWorkingDirectory: process.cwd(),
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
    });

    expect(probeResult.availabilityStatus).toBe('unavailable');
    expect(probeResult.unavailableReasons).toEqual(
      expect.arrayContaining([expect.stringContaining('health_check_failed:codex')]),
    );
    expectProbeLaunchTruthProjected({
      selectedEntrypoint: probeResult.healthCheck?.selectedEntrypoint,
      requestCancellationMode: probeResult.healthCheck?.requestCancellationMode,
      diagnostics: probeResult.healthCheck?.diagnostics,
      expectedEntrypoint: 'codex',
      expectedRequestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('non_zero_exit', {
      launch_diagnostics_preserved:
        probeResult.healthCheck?.selectedEntrypoint === 'codex' &&
        hasAgentHealthDiagnostic(
          probeResult.healthCheck?.diagnostics,
          'install.entrypoint_resolution',
          'codex',
        ) &&
        hasAgentHealthDiagnostic(
          probeResult.healthCheck?.diagnostics,
          'protocol.process_tree_policy',
          'process_group_best_effort',
        ),
      adapter_launch_truth_projected:
        probeResult.healthCheck?.selectedEntrypoint === 'codex' &&
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

  it('treats signal-terminated probe output as unavailable even when completed JSON is present', async () => {
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createExecRunner('OK', {
        stderr: 'terminated by signal',
        exitCode: null,
        signal: 'SIGTERM',
      }),
      currentWorkingDirectory: process.cwd(),
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
    });

    expect(probeResult.availabilityStatus).toBe('unavailable');
    expect(probeResult.unavailableReasons).toEqual(
      expect.arrayContaining([expect.stringContaining('health_check_failed:codex')]),
    );
    expectProbeLaunchTruthProjected({
      selectedEntrypoint: probeResult.healthCheck?.selectedEntrypoint,
      requestCancellationMode: probeResult.healthCheck?.requestCancellationMode,
      diagnostics: probeResult.healthCheck?.diagnostics,
      expectedEntrypoint: 'codex',
      expectedRequestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('signal_exit', {
      launch_diagnostics_preserved:
        probeResult.healthCheck?.selectedEntrypoint === 'codex' &&
        hasAgentHealthDiagnostic(
          probeResult.healthCheck?.diagnostics,
          'install.entrypoint_resolution',
          'codex',
        ) &&
        hasAgentHealthDiagnostic(
          probeResult.healthCheck?.diagnostics,
          'protocol.process_tree_policy',
          'process_group_best_effort',
        ),
      adapter_launch_truth_projected:
        probeResult.healthCheck?.selectedEntrypoint === 'codex' &&
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

  it('returns Codex capability matrix via probe', async () => {
    const adapter = new CodexAgentAdapter();

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.identity.surface).toBe('codex');
    expect(probeResult.capabilityMatrix.capabilityStates).toHaveLength(
      Object.values(AgentCapability).length,
    );
  });

  it('returns normalized invocation output shape', async () => {
    const adapter = new CodexAgentAdapter();
    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
    });

    expect(invokeResult.output.adapterSurface).toBe('codex');
    expect(invokeResult.output.routeKey).toBe('codegen');
  });

  it('runs real probe/invoke through codex exec runner when cli_exec mode is enabled', async () => {
    const execRunner = vi
      .fn<CodexExecRunner>()
      .mockImplementationOnce(createExecRunner('OK'))
      .mockImplementationOnce(createExecRunner('implemented feature'));
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
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
    expect(probeResult.capabilityMatrix.cancellation.supportsCancel).toBe(false);
    expect(probeResult.capabilityMatrix.cancellation.supportsAbortSignal).toBe(false);
    expectProbeLaunchTruthProjected({
      selectedEntrypoint: probeResult.healthCheck?.selectedEntrypoint,
      requestCancellationMode: probeResult.healthCheck?.requestCancellationMode,
      diagnostics: probeResult.healthCheck?.diagnostics,
      expectedEntrypoint: 'codex',
      expectedRequestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expect(invokeResult.output.responseText).toBe('implemented feature');
    expect(invokeResult.output.threadId).toBe('thread-1');
    expect(invokeResult.usage?.totalTokens).toBe(18);
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('preserves launch diagnostics and standardized errors when cli_exec output is malformed', async () => {
    const malformedStdout = '{"type":"thread.started","thread_id":"thread-1"';
    const execRunner = vi
      .fn<CodexExecRunner>()
      .mockResolvedValueOnce({
        stdout: malformedStdout,
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 12,
        launchDiagnostics: {
          selectedEntrypoint: 'codex',
          shellWrapped: false,
          processTreePolicy: 'process_group_best_effort',
        },
      })
      .mockResolvedValueOnce({
        stdout: malformedStdout,
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 12,
        launchDiagnostics: {
          selectedEntrypoint: 'codex',
          shellWrapped: false,
          processTreePolicy: 'process_group_best_effort',
        },
      });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
    });

    expect(probeResult.availabilityStatus).toBe('unavailable');
    expectProbeLaunchTruthProjected({
      selectedEntrypoint: probeResult.healthCheck?.selectedEntrypoint,
      requestCancellationMode: probeResult.healthCheck?.requestCancellationMode,
      diagnostics: probeResult.healthCheck?.diagnostics,
      expectedEntrypoint: 'codex',
      expectedRequestCancellationMode: AdapterRequestCancellationMode.NOT_SUPPORTED,
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('probe_protocol_parse_failed', {
      launch_diagnostics_preserved:
        probeResult.healthCheck?.selectedEntrypoint === 'codex' &&
        hasAgentHealthDiagnostic(
          probeResult.healthCheck?.diagnostics,
          'install.entrypoint_resolution',
          'codex',
        ) &&
        hasAgentHealthDiagnostic(
          probeResult.healthCheck?.diagnostics,
          'protocol.process_tree_policy',
          'process_group_best_effort',
        ),
      adapter_launch_truth_projected:
        probeResult.healthCheck?.selectedEntrypoint === 'codex' &&
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

    const invokeError = await adapter
      .invokeStage(createInvokeRequest())
      .then(() => null)
      .catch((error) => error as RuntimeError);

    expect(invokeError).toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      message: expect.stringContaining('malformed JSON output'),
    });
    const invokeDetails = invokeError?.details ?? {};
    expectInvokeLaunchTruthProjected({
      details: invokeDetails,
      expectedEntrypoint: 'codex',
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('invoke_protocol_parse_failed', {
      launch_diagnostics_preserved:
        invokeDetails.selectedEntrypoint === 'codex' &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
      adapter_launch_truth_projected:
        invokeDetails.selectedEntrypoint === 'codex' &&
        invokeDetails.shellWrapped === false &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
    });
  });

  it('supports remote_api probe and invoke through OpenAI-compatible fetch', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'resp-probe',
            output_text: 'OK',
            usage: {
              input_tokens: 3,
              output_tokens: 1,
              total_tokens: 4,
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'resp-invoke',
            output_text: 'remote codex response',
            usage: {
              input_tokens: 8,
              output_tokens: 5,
              total_tokens: 13,
            },
          }),
      } as Response);
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        OPENAI_API_KEY: 'test-key',
      },
      remoteApi: {
        provider: AdapterProviderKind.OPENAI,
        vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
      },
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
    });
    const invokeResult = await adapter.invokeStage(createInvokeRequest());

    expect(probeResult.availabilityStatus).toBe('available');
    expect(probeResult.healthCheck?.transportKind).toBe('remote_api');
    expect(probeResult.healthCheck?.providerKind).toBe(AdapterProviderKind.OPENAI);
    expect(invokeResult.output.responseText).toBe('remote codex response');
    expect(invokeResult.output.remoteResponseId).toBe('resp-invoke');
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });

  it('creates, reuses, and refreshes remote_api continuation handles through previous_response_id', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'resp-created',
            output_text: 'created response',
            usage: {
              input_tokens: 8,
              output_tokens: 5,
              total_tokens: 13,
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'resp-reused',
            output_text: 'reused response',
            usage: {
              input_tokens: 6,
              output_tokens: 4,
              total_tokens: 10,
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () =>
          JSON.stringify({
            error: {
              message: 'previous_response_id not found',
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'resp-refreshed',
            output_text: 'refreshed response',
            usage: {
              input_tokens: 7,
              output_tokens: 3,
              total_tokens: 10,
            },
          }),
      } as Response);
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        OPENAI_API_KEY: 'test-key',
      },
      remoteApi: {
        provider: AdapterProviderKind.OPENAI,
        vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
      },
    });

    const firstInvokeResult = await adapter.invokeStage({
      ...createInvokeRequest(),
      continuation: {
        mode: AgentStageContinuationMode.PREFER_REUSE,
        sessionId: 'session-continuation-001',
        laneKey: 'session.main::stage-1::session.main::codex::chat_only',
      },
    });
    const firstHandle = firstInvokeResult.continuation?.handle;
    const secondInvokeResult = await adapter.invokeStage({
      ...createInvokeRequest(),
      executionId: 'execution-2',
      continuation: {
        mode: AgentStageContinuationMode.PREFER_REUSE,
        sessionId: 'session-continuation-001',
        laneKey: 'session.main::stage-1::session.main::codex::chat_only',
        handle: firstHandle,
      },
    });
    const secondHandle = secondInvokeResult.continuation?.handle;
    const thirdInvokeResult = await adapter.invokeStage({
      ...createInvokeRequest(),
      executionId: 'execution-3',
      continuation: {
        mode: AgentStageContinuationMode.PREFER_REUSE,
        sessionId: 'session-continuation-001',
        laneKey: 'session.main::stage-1::session.main::codex::chat_only',
        handle: secondHandle,
      },
    });

    const requestBodies = fetchImplementation.mock.calls.map(
      ([, init]) => JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>,
    );

    expect(firstInvokeResult.continuation).toMatchObject({
      status: AgentStageContinuationStatus.CREATED,
      laneKey: 'session.main::stage-1::session.main::codex::chat_only',
      handle: expect.objectContaining({
        value: 'resp-created',
        model: 'gpt-5',
      }),
    });
    expect(secondInvokeResult.continuation).toMatchObject({
      status: AgentStageContinuationStatus.REUSED,
      laneKey: 'session.main::stage-1::session.main::codex::chat_only',
      handle: expect.objectContaining({
        value: 'resp-reused',
      }),
    });
    expect(thirdInvokeResult.continuation).toMatchObject({
      status: AgentStageContinuationStatus.REFRESHED,
      laneKey: 'session.main::stage-1::session.main::codex::chat_only',
      invalidationReason: 'provider_handle_not_found',
      handle: expect.objectContaining({
        value: 'resp-refreshed',
      }),
    });
    expect(requestBodies[0]?.previous_response_id).toBeUndefined();
    expect(requestBodies[1]?.previous_response_id).toBe('resp-created');
    expect(requestBodies[2]?.previous_response_id).toBe('resp-reused');
    expect(requestBodies[3]?.previous_response_id).toBeUndefined();
    expect(fetchImplementation).toHaveBeenCalledTimes(4);
  });

  it('projects remote_api stream liveness metadata and remote request ids', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_input, init) =>
        createSseResponse(
          [
            'data: {"type":"response.created","response":{"id":"resp-stream-1"}}\n\n',
            'data: {"type":"response.output_text.delta","delta":"hello"}\n\n',
            'data: {"type":"response.completed","response":{"id":"resp-stream-1"}}\n\n',
          ],
          init?.signal,
        ),
      );
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        OPENAI_API_KEY: 'test-key',
      },
      remoteApi: {
        provider: AdapterProviderKind.OPENAI,
        vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
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
        remoteRequestId: 'resp-stream-1',
      }),
    );
    expect(payloads[2]).toEqual(
      expect.objectContaining({
        transportKind: 'remote_api',
        vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
        remoteRequestId: 'resp-stream-1',
        accumulatedText: 'hello',
        invokeLiveness: expect.objectContaining({
          status: 'running',
          transportKind: 'remote_api',
          vendorBindingKind: AdapterVendorBindingKind.OPENAI_RESPONSES,
          remoteRequestId: 'resp-stream-1',
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
        remoteRequestId: 'resp-stream-1',
        invokeLiveness: expect.objectContaining({
          status: 'completed',
          remoteRequestId: 'resp-stream-1',
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
          'data: {"type":"response.created","response":{"id":"resp-stream-timeout-1"}}\n\n',
          'data: {"type":"response.output_text.delta","delta":"partial"}\n\n',
        ],
        init?.signal,
        {
          stallAfterChunks: true,
        },
      ),
    );
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        OPENAI_API_KEY: 'test-key',
      },
      requestTimeoutMs: 30,
      remoteApi: {
        provider: AdapterProviderKind.OPENAI,
        vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
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
          remoteRequestId: 'resp-stream-timeout-1',
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
      await new Promise<never>((_, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('The operation was aborted.', 'AbortError')),
          { once: true },
        );
      });
    });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        OPENAI_API_KEY: 'test-key',
      },
      requestTimeoutMs: 20,
      remoteApi: {
        provider: AdapterProviderKind.OPENAI,
        vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
        maxRetries: 2,
      },
    });

    await expect(adapter.invokeStage(createInvokeRequest())).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      message: expect.stringContaining('exhausted the timeout budget'),
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it('surfaces credentialRef as manual-only probe truth when remote_api is configured directly', async () => {
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.REMOTE_API,
      remoteApi: {
        provider: AdapterProviderKind.OPENAI,
        vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
        credentialRef: 'secret://openai/api-key',
      },
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
    });

    expect(probeResult.availabilityStatus).toBe('unavailable');
    expect(probeResult.unavailableReasons).toContain(
      'credential_missing:codex:secret://openai/api-key',
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
            id: 'resp-probe',
            output_text: 'OK',
            usage: {
              input_tokens: 3,
              output_tokens: 1,
              total_tokens: 4,
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'resp-invoke',
            output_text: 'remote codex response',
            usage: {
              input_tokens: 8,
              output_tokens: 5,
              total_tokens: 13,
            },
          }),
      } as Response);
    const resolveCredentialRef = vi.fn(async () => 'secret-key');
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {},
      resolveCredentialRef,
      remoteApi: {
        provider: AdapterProviderKind.OPENAI,
        vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
        credentialRef: 'secret://openai/api-key',
      },
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
    });
    const invokeResult = await adapter.invokeStage(createInvokeRequest());

    expect(probeResult.availabilityStatus).toBe('available');
    expect(probeResult.healthCheck?.diagnostics).toContainEqual({
      layer: 'auth',
      status: 'pass',
      code: 'auth.credential_reference_resolved',
      detail: 'codex:secret://openai/api-key',
    });
    expect(invokeResult.output.responseText).toBe('remote codex response');
    expect(resolveCredentialRef.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(
      resolveCredentialRef.mock.calls.every(([selector]) => selector === 'secret://openai/api-key'),
    ).toBe(true);
  });

  it('prefers remote_api credential env vars over credentialRef when both are configured', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: 'resp-probe',
          output_text: 'OK',
          usage: {
            input_tokens: 3,
            output_tokens: 1,
            total_tokens: 4,
          },
        }),
    } as Response);
    const resolveCredentialRef = vi.fn(async () => 'secret-key');
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.REMOTE_API,
      fetchImplementation,
      environment: {
        OPENAI_API_KEY: 'env-key',
      },
      resolveCredentialRef,
      remoteApi: {
        provider: AdapterProviderKind.OPENAI,
        vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
        credentialRef: 'secret://openai/api-key',
      },
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
    });
    const requestInit = fetchImplementation.mock.calls[0]?.[1] as RequestInit | undefined;

    expect(probeResult.availabilityStatus).toBe('available');
    expect(resolveCredentialRef).not.toHaveBeenCalled();
    expect(requestInit?.headers).toMatchObject({
      authorization: 'Bearer env-key',
    });
  });

  it('accepts trivial punctuation variants in probe health-check responses', async () => {
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => ({
        stdout: [
          '{"type":"thread.started","thread_id":"thread-1"}',
          '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"OK."}}',
          '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
        ].join('\n'),
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 12,
      }),
      currentWorkingDirectory: process.cwd(),
    });

    const probeResult = await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
    });

    expect(probeResult.availabilityStatus).toBe('available');
  });

  it('passes chat-only sandbox arguments into codex exec when direct-answer policy forbids tools', async () => {
    const execRunner = vi
      .fn<CodexExecRunner>()
      .mockImplementationOnce(createExecRunner('OK'))
      .mockImplementationOnce(async (request) => {
        expect(request.commandArguments).toEqual(
          expect.arrayContaining([
            'exec',
            '--skip-git-repo-check',
            '--json',
            '-',
            '--sandbox',
            'read-only',
          ]),
        );
        return createExecRunner('chat-only response')();
      });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
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

    expect(invokeResult.output.responseText).toBe('chat-only response');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('adds dry-run fast-path prompt instructions for chat-only stage execution', async () => {
    const execRunner = vi
      .fn<CodexExecRunner>()
      .mockImplementationOnce(createExecRunner('OK'))
      .mockImplementationOnce(async (request) => {
        expect(request.commandArguments).toEqual(
          expect.arrayContaining([
            'exec',
            '--skip-git-repo-check',
            '--json',
            '-',
            '--sandbox',
            'read-only',
          ]),
        );
        expect(request.prompt).toContain('Dry-run fast path instructions:');
        expect(request.prompt).toContain(
          'Return immediately with a compact JSON object containing stageId, routeKey, phase, dryRun, status, summary, sideEffects, and nextStepRequirements.',
        );
        expect(request.prompt).toContain('Set status to "simulated" and sideEffects to "none".');
        return createExecRunner('simulated dry-run response')();
      });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
    });
    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-task-execute',
      routeKey: 'route.task.execute',
      input: {
        phase: 'execute',
        dryRun: true,
        [AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY]: {
          interactionMode: AgentStageExecutionMode.CHAT_ONLY,
          toolUsePolicy: AgentStageToolUsePolicy.FORBIDDEN,
        },
      },
    });

    expect(invokeResult.output.responseText).toBe('simulated dry-run response');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('returns explicit unsupported continuation truth in cli_exec mode when reuse is requested', async () => {
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createExecRunner('cli response'),
      currentWorkingDirectory: process.cwd(),
    });

    const invokeResult = await adapter.invokeStage({
      ...createInvokeRequest(),
      continuation: {
        mode: AgentStageContinuationMode.PREFER_REUSE,
        sessionId: 'session-continuation-cli-001',
        laneKey: 'session.main::stage-1::session.main::codex::chat_only',
      },
    });

    expect(invokeResult.output.responseText).toBe('cli response');
    expect(invokeResult.continuation).toEqual({
      status: AgentStageContinuationStatus.UNSUPPORTED,
      laneKey: 'session.main::stage-1::session.main::codex::chat_only',
    });
  });

  it('uses codex exec review for reviewer stages that target current repository changes', async () => {
    const execRunner = vi
      .fn<CodexExecRunner>()
      .mockImplementationOnce(createExecRunner('OK'))
      .mockImplementationOnce(async (request) => {
        expect(request.commandArguments).toEqual([
          'exec',
          'review',
          '--skip-git-repo-check',
          '--json',
          '--uncommitted',
        ]);
        expect(request.timeoutMs).toBe(600000);
        expect(request.prompt).toContain('repository review stage');
        expect(request.prompt).toContain('帮我 review 一下代码');
        return createExecRunner('review findings')();
      });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
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

    expect(invokeResult.output.responseText).toBe('review findings');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('passes probe abort signal into the codex exec runner', async () => {
    const abortController = new AbortController();
    const execRunner = vi.fn<CodexExecRunner>().mockImplementation(async (request) => {
      expect(request.signal).toBe(abortController.signal);
      return {
        stdout: [
          '{"type":"thread.started","thread_id":"thread-1"}',
          '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"OK"}}',
          '{"type":"turn.completed","usage":{"input_tokens":3,"output_tokens":1}}',
        ].join('\n'),
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 4,
      };
    });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
      signal: abortController.signal,
    });

    expect(probeResult.availabilityStatus).toBe('available');
    expect(execRunner).toHaveBeenCalledTimes(1);
  });

  it('degrades confirmation/cancel semantics in cli_exec mode', async () => {
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createExecRunner(),
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

  it('retries transient cli_exec probe failures before surfacing availability', async () => {
    const execRunner = vi
      .fn<CodexExecRunner>()
      .mockRejectedValueOnce(
        new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          'Codex probe failed: rate limited',
          {
            stderr: '429 rate limit exceeded',
          },
        ),
      )
      .mockResolvedValueOnce({
        stdout: [
          '{"type":"thread.started","thread_id":"thread-1"}',
          '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"OK"}}',
          '{"type":"turn.completed","usage":{"input_tokens":3,"output_tokens":1}}',
        ].join('\n'),
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 4,
      });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('available');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('streams status and completed events', async () => {
    const adapter = new CodexAgentAdapter();
    const events = [];

    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
    }

    expect(events).toEqual([AgentStreamEventType.STATUS, AgentStreamEventType.COMPLETED]);
  });

  it('reuses one cli_exec invocation across streamEvents and invokeStage for the same stage', async () => {
    const execRunner = vi.fn<CodexExecRunner>().mockResolvedValue({
      stdout: [
        '{"type":"thread.started","thread_id":"thread-1"}',
        '{"type":"turn.started"}',
        '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"shared response"}}',
        '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
      ].join('\n'),
      stderr: '',
      exitCode: 0,
      signal: null,
      elapsedMs: 12,
    });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    const streamEventTypesPromise = (async () => {
      const eventTypes: AgentStreamEventType[] = [];
      for await (const event of adapter.streamEvents(createStreamRequest())) {
        eventTypes.push(event.eventType);
      }
      return eventTypes;
    })();
    const invokeResultPromise = adapter.invokeStage(createInvokeRequest());

    const [streamEventTypes, invokeResult] = await Promise.all([
      streamEventTypesPromise,
      invokeResultPromise,
    ]);

    expect(execRunner).toHaveBeenCalledTimes(1);
    expect(streamEventTypes).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(invokeResult.output.responseText).toBe('shared response');
  });

  it('projects cli_exec invoke liveness metadata for Codex token and completion events', async () => {
    const execRunner = vi.fn<CodexExecRunner>().mockResolvedValue({
      stdout: [
        '{"type":"thread.started","thread_id":"thread-1"}',
        '{"type":"turn.started"}',
        '{"type":"item.updated","item":{"id":"item-1","type":"agent_message","text":"Review"}}',
        '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"Review findings"}}',
        '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
      ].join('\n'),
      stderr: '',
      exitCode: 0,
      signal: null,
      elapsedMs: 12,
    });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    const payloads: Array<{ type: AgentStreamEventType; payload: Record<string, unknown> }> = [];
    for await (const event of adapter.streamEvents(createInvokeRequest())) {
      payloads.push({
        type: event.eventType,
        payload: event.payload,
      });
    }

    expect(payloads.map((event) => event.type)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(payloads[1]?.payload).toEqual(
      expect.objectContaining({
        transportKind: 'cli_exec',
        invokeLiveness: expect.objectContaining({
          status: 'running',
          transportKind: 'cli_exec',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
          lastTransportActivityAt: expect.any(String),
        }),
      }),
    );
    expect(payloads[3]?.payload).toEqual(
      expect.objectContaining({
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
    expect(payloads[4]?.payload).toEqual(
      expect.objectContaining({
        responseText: 'Review findings',
        invokeLiveness: expect.objectContaining({
          status: 'completed',
          lastTerminalSignalAt: expect.any(String),
          partialOutputPreserved: false,
        }),
      }),
    );
  });

  it('reuses one repository-review cli_exec invocation across streamEvents and invokeStage with the elevated timeout budget', async () => {
    const abortController = new AbortController();
    const execRunner = vi.fn<CodexExecRunner>().mockImplementation(async (request) => {
      expect(request.commandArguments).toEqual([
        'exec',
        'review',
        '--skip-git-repo-check',
        '--json',
        '--uncommitted',
      ]);
      expect(request.timeoutMs).toBe(321000);
      expect(request.signal).toBe(abortController.signal);
      return {
        stdout: [
          '{"type":"thread.started","thread_id":"thread-1"}',
          '{"type":"turn.started"}',
          '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"review findings"}}',
          '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
        ].join('\n'),
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 12,
      };
    });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });
    const reviewRequest = {
      processId: 'process-1',
      executionId: 'execution-review-1',
      stageId: 'stage-session-main-role-reviewer',
      routeKey: 'session.main.role.reviewer',
      agentInvocationTimeoutMs: 321000,
      signal: abortController.signal,
      input: {
        roleId: 'reviewer',
        reviewScope: 'uncommitted_changes',
        userMessage: '帮我 review 代码',
        governorInstructions: 'inspect the repository in a read-only manner',
      },
    };

    const streamEventTypesPromise = (async () => {
      const eventTypes: AgentStreamEventType[] = [];
      for await (const event of adapter.streamEvents(reviewRequest)) {
        eventTypes.push(event.eventType);
      }
      return eventTypes;
    })();
    const invokeResultPromise = adapter.invokeStage(reviewRequest);

    const [streamEventTypes, invokeResult] = await Promise.all([
      streamEventTypesPromise,
      invokeResultPromise,
    ]);

    expect(execRunner).toHaveBeenCalledTimes(1);
    expect(streamEventTypes).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(invokeResult.output.responseText).toBe('review findings');
  });

  it('emits incremental token events when codex json output updates one agent message progressively', async () => {
    const execRunner = vi.fn<CodexExecRunner>().mockResolvedValue({
      stdout: [
        '{"type":"thread.started","thread_id":"thread-1"}',
        '{"type":"turn.started"}',
        '{"type":"item.updated","item":{"id":"item-1","type":"agent_message","text":"Review"}}',
        '{"type":"item.updated","item":{"id":"item-1","type":"agent_message","text":"Review findings"}}',
        '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"Review findings complete"}}',
        '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
      ].join('\n'),
      stderr: '',
      exitCode: 0,
      signal: null,
      elapsedMs: 12,
    });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    const tokenPayloads: Array<{ text?: unknown; accumulatedText?: unknown }> = [];
    for await (const event of adapter.streamEvents(createInvokeRequest())) {
      if (event.eventType === AgentStreamEventType.TOKEN) {
        tokenPayloads.push({
          text: event.payload.text,
          accumulatedText: event.payload.accumulatedText,
        });
      }
    }

    expect(tokenPayloads).toEqual([
      {
        text: 'Review',
        accumulatedText: 'Review',
      },
      {
        text: ' findings',
        accumulatedText: 'Review findings',
      },
      {
        text: ' complete',
        accumulatedText: 'Review findings complete',
      },
    ]);
  });

  it('relays repository review command and todo events as running activity details', async () => {
    const execRunner = vi
      .fn<CodexExecRunner>()
      .mockImplementationOnce(createExecRunner('OK'))
      .mockImplementationOnce(async () => ({
        stdout: [
          '{"type":"thread.started","thread_id":"thread-1"}',
          '{"type":"turn.started"}',
          '{"type":"item.started","item":{"id":"item-0","type":"command_execution","command":"/bin/zsh -lc \\"git diff -- packages/adapters/codex/src/codex-agent-adapter.ts\\"","aggregated_output":"","exit_code":null,"status":"in_progress"}}',
          '{"type":"item.completed","item":{"id":"item-0","type":"command_execution","command":"/bin/zsh -lc \\"git diff -- packages/adapters/codex/src/codex-agent-adapter.ts\\"","aggregated_output":"diff output omitted","exit_code":0,"status":"completed"}}',
          '{"type":"item.started","item":{"id":"item-1","type":"todo_list","items":[{"text":"Inspect the working-tree diff","completed":false},{"text":"Produce prioritized findings","completed":false}]}}',
          '{"type":"item.updated","item":{"id":"item-1","type":"todo_list","items":[{"text":"Inspect the working-tree diff","completed":true},{"text":"Produce prioritized findings","completed":false}]}}',
          '{"type":"item.completed","item":{"id":"item-2","type":"agent_message","text":"review findings"}}',
          '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
        ].join('\n'),
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 18,
      }));
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });
    const reviewRequest = {
      processId: 'process-1',
      executionId: 'execution-review-activity-1',
      stageId: 'stage-session-main-role-reviewer',
      routeKey: 'session.main.role.reviewer',
      input: {
        roleId: 'reviewer',
        reviewScope: 'uncommitted_changes',
        userMessage: '帮我 review 一下代码',
      },
    };

    await adapter.probe({
      routeKey: 'cli.adapter.probe.codex',
    });
    const details: string[] = [];

    for await (const event of adapter.streamEvents(reviewRequest)) {
      if (typeof event.payload.detail === 'string') {
        details.push(event.payload.detail);
      }
    }

    expect(details).toContain(
      'Running command: git diff -- packages/adapters/codex/src/codex-agent-adapter.ts',
    );
    expect(details).toContain(
      'Completed command (exit 0): git diff -- packages/adapters/codex/src/codex-agent-adapter.ts',
    );
    expect(details).toContain('Todo: Inspect the working-tree diff');
    expect(details).toContain('Completed todo: Inspect the working-tree diff');
    expect(details).toContain('Todo: Produce prioritized findings');
  });

  it('emits repository-review progress statuses while codex is still silent', async () => {
    vi.useFakeTimers();
    let resolveExecution: ((result: Awaited<ReturnType<CodexExecRunner>>) => void) | null = null;
    const execRunner = vi.fn<CodexExecRunner>().mockImplementation(
      async () =>
        await new Promise((resolve) => {
          resolveExecution = resolve;
        }),
    );
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });
    const reviewRequest = {
      processId: 'process-1',
      executionId: 'execution-review-progress-1',
      stageId: 'stage-session-main-role-reviewer',
      routeKey: 'session.main.role.reviewer',
      input: {
        roleId: 'reviewer',
        reviewScope: 'uncommitted_changes',
        userMessage: '帮我 review 代码',
        governorInstructions: 'inspect the repository in a read-only manner',
      },
    };

    const detailsPromise = (async () => {
      const details: string[] = [];
      const detailOrigins: string[] = [];
      for await (const event of adapter.streamEvents(reviewRequest)) {
        if (
          event.eventType === AgentStreamEventType.STATUS &&
          typeof event.payload.detail === 'string'
        ) {
          details.push(event.payload.detail);
          if (typeof event.payload.detailOrigin === 'string') {
            detailOrigins.push(event.payload.detailOrigin);
          }
        }
      }
      return { details, detailOrigins };
    })();

    await vi.advanceTimersByTimeAsync(31000);
    resolveExecution?.({
      stdout: [
        '{"type":"thread.started","thread_id":"thread-1"}',
        '{"type":"turn.started"}',
        '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"review findings"}}',
        '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
      ].join('\n'),
      stderr: '',
      exitCode: 0,
      signal: null,
      elapsedMs: 31000,
    });

    const { details, detailOrigins } = await detailsPromise;
    vi.useRealTimers();

    expect(details).toContain('Codex repository review is running; waiting for CLI output.');
    expect(details).toContain(
      'Codex repository review is still running (15s elapsed); waiting for CLI output.',
    );
    expect(details).toContain(
      'Codex repository review is still running (30s elapsed); waiting for CLI output.',
    );
    expect(details).toContain(
      'Codex invoke looks transport-idle; waiting for last real CLI output before escalating.',
    );
    expect(detailOrigins).toContain('system');
  });

  it('emits semantic stall suspect when codex transport keeps moving without semantic progress', async () => {
    vi.useFakeTimers();
    let resolveExecution: ((result: Awaited<ReturnType<CodexExecRunner>>) => void) | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;
    const execRunner = vi.fn<CodexExecRunner>().mockImplementation(async (request) => {
      request.onStdoutChunk?.('{"type":"thread.started","thread_id":"thread-1"}\n');
      request.onStdoutChunk?.('{"type":"turn.started"}\n');
      request.onStderrChunk?.('stderr heartbeat line\n');
      heartbeatTimer = setInterval(() => {
        request.onStderrChunk?.('stderr heartbeat line\n');
      }, 1000);
      return await new Promise((resolve) => {
        resolveExecution = resolve;
      });
    });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    const statusesPromise = (async () => {
      const statuses: string[] = [];
      for await (const event of adapter.streamEvents({
        processId: 'process-semantic-stall-1',
        executionId: 'execution-semantic-stall-1',
        stageId: 'stage-session-main-answer',
        routeKey: 'session.main.answer',
        agentInvocationTimeoutMs: 30000,
        input: {
          prompt: 'continue',
        },
      })) {
        if (typeof event.payload.status === 'string') {
          statuses.push(event.payload.status);
        }
      }
      return statuses;
    })();

    await vi.advanceTimersByTimeAsync(28000);
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }
    resolveExecution?.({
      stdout: [
        '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"final answer"}}',
        '{"type":"turn.completed","usage":{"input_tokens":4,"output_tokens":2}}',
      ].join('\n'),
      stderr: 'stderr heartbeat line\n',
      exitCode: 0,
      signal: null,
      elapsedMs: 28000,
    });

    const statuses = await statusesPromise;
    vi.useRealTimers();

    expect(statuses).toContain('semantic_stall_suspect');
  });

  it('preserves partial cli_exec output and emits graceful plus hard termination states when codex times out', async () => {
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      maxRetryAttempts: 1,
      execRunner: async (request) => {
        request.onStdoutChunk?.('{"type":"thread.started","thread_id":"thread-1"}\n');
        request.onStdoutChunk?.('{"type":"turn.started"}\n');
        request.onStdoutChunk?.(
          '{"type":"item.updated","item":{"id":"item-1","type":"agent_message","text":"partial"}}\n',
        );
        request.onGracefulInterruptStart?.('process_signal');
        request.onHardTerminateStart?.('process_signal');
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
          'Codex invoke timed out after 30ms and exceeded graceful interrupt window.',
          {
            surface: 'codex',
            operation: 'invoke',
            timeoutMs: 30,
            hardTerminated: true,
          },
        );
      },
    });

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
      .invokeStage(createInvokeRequest())
      .then(() => null)
      .catch((error) => error);

    const [events, thrownError] = await Promise.all([streamEventsPromise, invokeErrorPromise]);
    const statuses = collectStreamEventStatuses(events);

    expect(thrownError).toBeInstanceOf(RuntimeError);
    expect((thrownError as RuntimeError).message).toContain('timed out');
    expect(events.map((event) => event.type)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.FAILED,
    ]);
    expect(events[3]?.payload).toEqual(
      expect.objectContaining({
        status: 'graceful_interrupting',
        invokeLiveness: expect.objectContaining({
          status: 'graceful_interrupting',
          cancelMechanism: 'process_signal',
          suspectReasonCodes: expect.arrayContaining(['invoke_hard_timeout']),
        }),
      }),
    );
    expect(events[4]?.payload).toEqual(
      expect.objectContaining({
        status: 'hard_terminating',
        invokeLiveness: expect.objectContaining({
          status: 'hard_terminating',
          cancelMechanism: 'process_signal',
          suspectReasonCodes: expect.arrayContaining([
            'invoke_hard_timeout',
            'invoke_graceful_interrupt_exceeded',
          ]),
        }),
      }),
    );
    expect(events[5]?.payload).toEqual(
      expect.objectContaining({
        accumulatedText: 'partial',
        responseText: 'partial',
        invokeLiveness: expect.objectContaining({
          status: 'failed',
          partialOutputPreserved: true,
          cancelMechanism: 'process_signal',
          suspectReasonCodes: expect.arrayContaining([
            'invoke_hard_timeout',
            'invoke_graceful_interrupt_exceeded',
            'invoke_partial_output_preserved',
          ]),
        }),
      }),
    );
    const invokeDetails = (thrownError as RuntimeError).details ?? {};
    expectInvokeLaunchTruthProjected({
      details: invokeDetails,
      expectedEntrypoint: 'codex',
      expectedShellWrapped: false,
      expectedProcessTreePolicy: 'process_group_best_effort',
    });
    expectNativeCliExecPreservedFacts('timeout_hard_terminated', {
      launch_diagnostics_preserved:
        invokeDetails.selectedEntrypoint === 'codex' &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
      adapter_launch_truth_projected:
        invokeDetails.selectedEntrypoint === 'codex' &&
        invokeDetails.shellWrapped === false &&
        invokeDetails.processTreePolicy === 'process_group_best_effort',
      terminate_phase_preserved:
        statuses.includes('graceful_interrupting') && statuses.includes('hard_terminating'),
      partial_output_preserved_when_available: events[5]?.payload.accumulatedText === 'partial',
    });
  });

  it('keeps the hard-terminate fuse alive for real-spawn aborts until the child actually exits', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'codex-real-spawn-abort-'));
    const commandPath = join(temporaryRoot, 'fake-codex.sh');
    await writeFile(
      commandPath,
      [
        '#!/bin/sh',
        'trap "" TERM',
        'cat >/dev/null',
        'echo \'{"type":"thread.started","thread_id":"thread-1"}\'',
        'echo \'{"type":"turn.started"}\'',
        'echo \'{"type":"item.updated","item":{"id":"item-1","type":"agent_message","text":"partial"}}\'',
        'while true; do',
        '  sleep 1',
        'done',
      ].join('\n'),
      'utf8',
    );
    await chmod(commandPath, 0o755);

    const abortController = new AbortController();
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      command: commandPath,
      currentWorkingDirectory: temporaryRoot,
      requestTimeoutMs: 5000,
    });
    const request = {
      processId: 'process-real-abort-1',
      executionId: 'execution-real-abort-1',
      stageId: 'stage-real-abort-1',
      routeKey: 'codegen',
      agentInvocationTimeoutMs: 5000,
      signal: abortController.signal,
      input: {
        prompt: 'implement feature',
      },
    };

    try {
      let resolveTokenObserved: (() => void) | null = null;
      const tokenObservedPromise = new Promise<void>((resolve) => {
        resolveTokenObserved = resolve;
      });
      const streamEventsPromise = (async () => {
        const events: Array<{ type: AgentStreamEventType; payload: Record<string, unknown> }> = [];
        for await (const event of adapter.streamEvents(request)) {
          events.push({
            type: event.eventType,
            payload: event.payload,
          });
          if (event.eventType === AgentStreamEventType.TOKEN) {
            resolveTokenObserved?.();
          }
        }
        return events;
      })();
      const invokeErrorPromise = adapter
        .invokeStage(request)
        .then(() => null)
        .catch((error) => error);

      await tokenObservedPromise;
      abortController.abort();

      const [events, thrownError] = await Promise.all([streamEventsPromise, invokeErrorPromise]);
      const statuses = collectStreamEventStatuses(events);

      expect(thrownError).toBeInstanceOf(RuntimeError);
      expect((thrownError as RuntimeError).message).toContain('aborted');
      expect(events.map((event) => event.type)).toEqual([
        AgentStreamEventType.STATUS,
        AgentStreamEventType.STATUS,
        AgentStreamEventType.TOKEN,
        AgentStreamEventType.STATUS,
        AgentStreamEventType.STATUS,
        AgentStreamEventType.FAILED,
      ]);
      expect(events[3]?.payload).toEqual(
        expect.objectContaining({
          status: 'graceful_interrupting',
          invokeLiveness: expect.objectContaining({
            status: 'graceful_interrupting',
            cancelMechanism: 'abort_signal',
            partialOutputPreserved: true,
          }),
        }),
      );
      expect(events[4]?.payload).toEqual(
        expect.objectContaining({
          status: 'hard_terminating',
          invokeLiveness: expect.objectContaining({
            status: 'hard_terminating',
            cancelMechanism: 'abort_signal',
            suspectReasonCodes: expect.arrayContaining(['invoke_graceful_interrupt_exceeded']),
          }),
        }),
      );
      expect(events[5]?.payload).toEqual(
        expect.objectContaining({
          accumulatedText: 'partial',
          responseText: 'partial',
          invokeLiveness: expect.objectContaining({
            status: 'failed',
            cancelMechanism: 'abort_signal',
            partialOutputPreserved: true,
            suspectReasonCodes: expect.arrayContaining([
              'invoke_graceful_interrupt_exceeded',
              'invoke_partial_output_preserved',
            ]),
          }),
        }),
      );
      const invokeDetails = (thrownError as RuntimeError).details ?? {};
      expectInvokeLaunchTruthProjected({
        details: invokeDetails,
        expectedEntrypoint: commandPath,
        expectedShellWrapped: false,
        expectedProcessTreePolicy: 'process_group_best_effort',
      });
      expectNativeCliExecPreservedFacts('abort_hard_terminated', {
        launch_diagnostics_preserved:
          invokeDetails.selectedEntrypoint === commandPath &&
          invokeDetails.processTreePolicy === 'process_group_best_effort',
        adapter_launch_truth_projected:
          invokeDetails.selectedEntrypoint === commandPath &&
          invokeDetails.shellWrapped === false &&
          invokeDetails.processTreePolicy === 'process_group_best_effort',
        terminate_phase_preserved:
          statuses.includes('graceful_interrupting') && statuses.includes('hard_terminating'),
        partial_output_preserved_when_available: events[5]?.payload.accumulatedText === 'partial',
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('forwards codex raw stdout warnings and stderr lines through stream events', async () => {
    const execRunner = vi.fn<CodexExecRunner>().mockResolvedValue({
      stdout: [
        '2026-04-01T00:00:00Z WARN codex_state::runtime: failed to open state db',
        '{"type":"thread.started","thread_id":"thread-1"}',
        '{"type":"turn.started"}',
        '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"shared response"}}',
        '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
      ].join('\n'),
      stderr: 'stderr progress line\n',
      exitCode: 0,
      signal: null,
      elapsedMs: 12,
    });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    const details: string[] = [];
    for await (const event of adapter.streamEvents(createInvokeRequest())) {
      if (
        event.eventType === AgentStreamEventType.STATUS &&
        typeof event.payload.detail === 'string'
      ) {
        details.push(event.payload.detail);
      }
    }

    expect(details).toContain(
      'codex stdout: 2026-04-01T00:00:00Z WARN codex_state::runtime: failed to open state db',
    );
    expect(details).toContain('codex stderr: stderr progress line');
  });

  it('forwards auxiliary codex item text as live status details during repository review', async () => {
    const execRunner = vi.fn<CodexExecRunner>().mockResolvedValue({
      stdout: [
        '{"type":"thread.started","thread_id":"thread-1"}',
        '{"type":"turn.started"}',
        '{"type":"item.updated","item":{"id":"item-0","type":"reasoning","text":"Inspecting changed files before drafting findings"}}',
        '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"review findings"}}',
        '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
      ].join('\n'),
      stderr: '',
      exitCode: 0,
      signal: null,
      elapsedMs: 12,
    });
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
      currentWorkingDirectory: process.cwd(),
    });

    const details: string[] = [];
    for await (const event of adapter.streamEvents({
      processId: 'process-1',
      executionId: 'execution-review-reasoning-1',
      stageId: 'stage-session-main-role-reviewer',
      routeKey: 'session.main.role.reviewer',
      input: {
        roleId: 'reviewer',
        reviewScope: 'uncommitted_changes',
        userMessage: '帮我 review 代码',
        governorInstructions: 'inspect the repository in a read-only manner',
      },
    })) {
      if (
        event.eventType === AgentStreamEventType.STATUS &&
        typeof event.payload.detail === 'string'
      ) {
        details.push(event.payload.detail);
      }
    }

    expect(details).toContain('codex reasoning: Inspecting changed files before drafting findings');
  });
});
