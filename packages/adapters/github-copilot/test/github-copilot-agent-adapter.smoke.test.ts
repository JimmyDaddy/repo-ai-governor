import {
  AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY,
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentCliExecOperation,
  AgentStageContinuationMode,
  AgentStageContinuationStatus,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from '@repo-ai-governor/adapter-sdk';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  GithubCopilotAgentAdapter,
  GithubCopilotAgentAdapterExecutionMode,
  type GithubCopilotExecRunner,
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

describe('github-copilot-agent-adapter smoke', () => {
  function createGithubCopilotExecRunnerFixture(): GithubCopilotExecRunner {
    return async ({ prompt, operation }) => ({
      stdout:
        operation === AgentCliExecOperation.PROBE || prompt.includes('Respond with exactly OK.')
          ? [
              '{"type":"assistant.message","data":{"content":"OK"}}',
              '{"type":"result","exitCode":0}',
            ].join('\n')
          : [
              '{"type":"assistant.message","data":{"content":"simulated github copilot response"}}',
              '{"type":"result","exitCode":0}',
            ].join('\n'),
      stderr: '',
      exitCode: 0,
      signal: null,
      elapsedMs: 7,
    });
  }

  it('returns GitHub Copilot capability matrix via probe', async () => {
    const adapter = new GithubCopilotAgentAdapter();

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });
    const structuredOutput = probeResult.capabilityMatrix.capabilityStates.find(
      (state) => state.capability === AgentCapability.STRUCTURED_OUTPUT,
    );

    expect(probeResult.identity.surface).toBe('github-copilot');
    expect(probeResult.capabilityMatrix.capabilityStates).toHaveLength(
      Object.values(AgentCapability).length,
    );
    expect(structuredOutput?.supportLevel).toBe(AgentCapabilitySupportLevel.DEGRADED);
  });

  it('returns truthful capability matrix in cli_exec mode', async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createGithubCopilotExecRunnerFixture(),
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

    expect(confirmationGate?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(cancellation?.supportLevel).toBe(AgentCapabilitySupportLevel.UNSUPPORTED);
    expect(probeResult.capabilityMatrix.cancellation.supportsCancel).toBe(false);
  });

  it('accepts trivial punctuation variants in probe health-check responses', async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async ({ prompt, operation }) => ({
        stdout:
          operation === AgentCliExecOperation.PROBE || prompt.includes('Respond with exactly OK.')
            ? [
                '{"type":"assistant.message","data":{"content":"OK."}}',
                '{"type":"result","exitCode":0}',
              ].join('\n')
            : [
                '{"type":"assistant.message","data":{"content":"simulated github copilot response"}}',
                '{"type":"result","exitCode":0}',
              ].join('\n'),
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 7,
      }),
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('available');
  });

  it('returns normalized invocation output shape', async () => {
    const adapter = new GithubCopilotAgentAdapter();
    const invokeResult = await adapter.invokeStage({
      processId: 'process-1',
      executionId: 'execution-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      input: {
        prompt: 'implement feature',
      },
    });

    expect(invokeResult.output.adapterSurface).toBe('github-copilot');
    expect(invokeResult.output.routeKey).toBe('codegen');
  });

  it('returns normalized invocation output in cli_exec mode', async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createGithubCopilotExecRunnerFixture(),
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

    expect(invokeResult.output.adapterSurface).toBe('github-copilot');
    expect(invokeResult.output.responseText).toContain('simulated github copilot response');
  });

  it('returns explicit unsupported continuation truth in cli_exec mode', async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: createGithubCopilotExecRunnerFixture(),
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
        laneKey: 'session.main::stage-1::session.main::github-copilot::chat_only',
      },
    });

    expect(invokeResult.output.responseText).toContain('simulated github copilot response');
    expect(invokeResult.continuation).toEqual({
      status: AgentStageContinuationStatus.UNSUPPORTED,
      laneKey: 'session.main::stage-1::session.main::github-copilot::chat_only',
    });
  });

  it('passes no-tool command arguments when chat-only policy forbids tool use', async () => {
    const execRunner = vi
      .fn<GithubCopilotExecRunner>()
      .mockImplementationOnce(createGithubCopilotExecRunnerFixture())
      .mockImplementationOnce(async (request) => {
        expect(request.commandArgumentsPrefix).toEqual(
          expect.arrayContaining(['--available-tools', '']),
        );
        return createGithubCopilotExecRunnerFixture()({
          ...request,
          operation: AgentCliExecOperation.INVOKE,
        });
      });
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
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

    expect(invokeResult.output.responseText).toContain('simulated github copilot response');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('uses reviewer-specific shell allow-list for repository review stages', async () => {
    const execRunner = vi
      .fn<GithubCopilotExecRunner>()
      .mockImplementationOnce(createGithubCopilotExecRunnerFixture())
      .mockImplementationOnce(async (request) => {
        expect(request.commandArgumentsPrefix).toEqual(
          expect.arrayContaining([
            '--available-tools',
            'shell',
            '--allow-tool',
            'shell(git:*)',
            '--allow-tool',
            'shell(rg:*)',
            '--allow-tool',
            'shell(sed:*)',
            '--allow-tool',
            'shell(cat:*)',
            '--allow-tool',
            'shell(ls:*)',
            '--allow-tool',
            'shell(find:*)',
          ]),
        );
        expect(request.prompt).toContain('repository review stage');
        expect(request.prompt).toContain('帮我 review 一下代码');
        return createGithubCopilotExecRunnerFixture()({
          ...request,
          operation: AgentCliExecOperation.INVOKE,
        });
      });
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
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

    expect(invokeResult.output.responseText).toContain('simulated github copilot response');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('treats non-zero process exit as protocol failure even when assistant output is present', async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => ({
        stdout: '{"type":"assistant.message","data":{"content":"partial response"}}',
        stderr: 'process failed',
        exitCode: 1,
        signal: null,
        elapsedMs: 6,
      }),
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
    });
  });

  it('treats non-zero JSON result exit code as protocol failure', async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => ({
        stdout: [
          '{"type":"assistant.message","data":{"content":"partial response"}}',
          '{"type":"result","exitCode":2}',
        ].join('\n'),
        stderr: 'result failed',
        exitCode: 0,
        signal: null,
        elapsedMs: 6,
      }),
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
    });
  });

  it('maps credential failures into unavailable probe reasons', async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async () => {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          'GitHub Copilot probe failed: login required',
          {
            surface: 'github-copilot',
            operation: AgentCliExecOperation.PROBE,
            stderr: 'Authentication required. Run `gh auth login` first.',
          },
        );
      },
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('unavailable');
    expect(probeResult.unavailableReasons).toContain('credential_missing:github-copilot');
  });

  it('retries transient cli_exec probe failures before surfacing availability', async () => {
    const execRunner = vi
      .fn<GithubCopilotExecRunner>()
      .mockRejectedValueOnce(
        new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          'GitHub Copilot probe failed: rate limited',
          {
            stderr: '429 rate limit exceeded',
          },
        ),
      )
      .mockResolvedValueOnce({
        stdout: [
          '{"type":"assistant.message","data":{"content":"OK"}}',
          '{"type":"result","exitCode":0}',
        ].join('\n'),
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 4,
      });
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('available');
    expect(execRunner).toHaveBeenCalledTimes(2);
  });

  it('falls back from direct copilot command to gh wrapper when direct binary is missing', async () => {
    const execRunner = vi.fn<GithubCopilotExecRunner>(async (request) => {
      if (request.command === 'copilot') {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          'spawn copilot ENOENT',
          {
            stderr: 'spawn copilot ENOENT',
          },
        );
      }

      return {
        stdout: [
          '{"type":"assistant.message","data":{"content":"OK"}}',
          '{"type":"result","exitCode":0}',
        ].join('\n'),
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 5,
      };
    });
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });

    const probeResult = await adapter.probe({
      routeKey: 'codegen',
    });

    expect(probeResult.availabilityStatus).toBe('available');
    expect(execRunner).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        command: 'copilot',
        commandArgumentsPrefix: [],
      }),
    );
    expect(execRunner).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        command: 'gh',
        commandArgumentsPrefix: ['copilot', '--'],
      }),
    );
  });

  it('reuses one cli_exec invocation across streamEvents and invokeStage and relays token/status output incrementally', async () => {
    const abortController = new AbortController();
    const execRunner = vi.fn<GithubCopilotExecRunner>().mockImplementation(async (request) => {
      expect(request.timeoutMs).toBeLessThanOrEqual(234000);
      expect(request.timeoutMs).toBeGreaterThan(233000);
      expect(request.signal).toBe(abortController.signal);
      request.onStdoutChunk?.(
        `${[
          '{"type":"assistant.delta","data":{"delta":"Review"}}',
          '{"type":"assistant.delta","data":{"delta":" findings"}}',
          '{"type":"assistant.message","data":{"content":"Review findings complete"}}',
          '{"type":"result","exitCode":0}',
        ].join('\n')}\n`,
      );
      request.onStderrChunk?.('stderr progress line\n');
      return {
        stdout: [
          '{"type":"assistant.delta","data":{"delta":"Review"}}',
          '{"type":"assistant.delta","data":{"delta":" findings"}}',
          '{"type":"assistant.message","data":{"content":"Review findings complete"}}',
          '{"type":"result","exitCode":0}',
        ].join('\n'),
        stderr: 'stderr progress line\n',
        exitCode: 0,
        signal: null,
        elapsedMs: 9,
      };
    });
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner,
    });
    const invokeRequest = {
      processId: 'process-1',
      executionId: 'execution-stream-1',
      stageId: 'stage-1',
      routeKey: 'codegen',
      agentInvocationTimeoutMs: 234000,
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
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.STATUS,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(streamPayloads[0]?.payload).toEqual(
      expect.objectContaining({
        detail: 'GitHub Copilot turn started.',
        transportKind: 'cli_exec',
        invokeLiveness: expect.objectContaining({
          status: 'starting',
          transportKind: 'cli_exec',
          partialOutputPreserved: false,
          cancelMechanism: 'none',
        }),
      }),
    );
    expect(streamPayloads[3]?.payload).toEqual(
      expect.objectContaining({
        text: ' complete',
        accumulatedText: 'Review findings complete',
        invokeLiveness: expect.objectContaining({
          status: 'running',
          lastTransportActivityAt: expect.any(String),
          lastSemanticProgressAt: expect.any(String),
          latestTextPreview: 'Review findings complete',
          transportKind: 'cli_exec',
        }),
      }),
    );
    expect(streamPayloads[6]?.payload).toEqual(
      expect.objectContaining({
        responseText: 'Review findings complete',
        invokeLiveness: expect.objectContaining({
          status: 'completed',
          lastTerminalSignalAt: expect.any(String),
          partialOutputPreserved: false,
        }),
      }),
    );
    expect(invokeResult.output.responseText).toBe('Review findings complete');
  });

  it('preserves partial cli_exec output and timeout reason codes when invocation fails', async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      maxRetryAttempts: 1,
      execRunner: async (request) => {
        request.onStdoutChunk?.('{"type":"assistant.delta","data":{"delta":"partial"}}\n');
        request.onGracefulInterruptStart?.('process_signal');
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
          'GitHub Copilot invoke timed out after 30ms.',
          {
            surface: 'github-copilot',
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

    expect(thrownError).toBeInstanceOf(RuntimeError);
    expect((thrownError as RuntimeError).message).toContain('timed out');
    expect(events.map((event) => event.type)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
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
  });

  it('streams status and completed events', async () => {
    const adapter = new GithubCopilotAgentAdapter();
    const events = [];

    for await (const event of adapter.streamEvents(createStreamRequest())) {
      events.push(event.eventType);
    }

    expect(events).toEqual([AgentStreamEventType.STATUS, AgentStreamEventType.COMPLETED]);
  });

  it('surfaces auxiliary text-bearing JSON events as live activity status details', async () => {
    const adapter = new GithubCopilotAgentAdapter({
      executionMode: GithubCopilotAgentAdapterExecutionMode.CLI_EXEC,
      execRunner: async ({ prompt, operation }) => ({
        stdout:
          operation === AgentCliExecOperation.PROBE || prompt.includes('Respond with exactly OK.')
            ? [
                '{"type":"assistant.message","data":{"content":"OK"}}',
                '{"type":"result","exitCode":0}',
              ].join('\n')
            : [
                '{"type":"assistant.chunk","data":{"delta":"Review"}}',
                '{"type":"analysis","data":{"message":"Inspecting changed files before drafting findings"}}',
                '{"type":"assistant.message","data":{"content":"Review findings complete"}}',
                '{"type":"result","exitCode":0}',
              ].join('\n'),
        stderr: '',
        exitCode: 0,
        signal: null,
        elapsedMs: 9,
      }),
    });
    const invokeRequest: AgentStreamEventsRequest = {
      processId: 'process-review-1',
      executionId: 'execution-review-1',
      stageId: 'stage-session-main-role-reviewer',
      routeKey: 'session.main.role.reviewer',
      input: {
        roleId: 'reviewer',
        reviewScope: 'uncommitted_changes',
        userMessage: '帮我 review 一下代码',
      },
    };

    const detailsPromise = (async () => {
      const details: string[] = [];
      for await (const event of adapter.streamEvents(invokeRequest)) {
        if (
          event.eventType === AgentStreamEventType.STATUS &&
          typeof event.payload.detail === 'string'
        ) {
          details.push(event.payload.detail);
        }
      }
      return details;
    })();
    const invokeResultPromise = adapter.invokeStage(invokeRequest);

    const [details, invokeResult] = await Promise.all([detailsPromise, invokeResultPromise]);

    expect(details).toContain(
      'github-copilot analysis: Inspecting changed files before drafting findings',
    );
    expect(invokeResult.output.responseText).toBe('Review findings complete');
  });
});
