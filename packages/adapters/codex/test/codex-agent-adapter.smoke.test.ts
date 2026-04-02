import {
  AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY,
  AgentCancellationReason,
  AgentCancellationScope,
  AgentCapability,
  AgentConfirmationDecision,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from '@repo-ai-governor/adapter-sdk';
import {
  AdapterProviderKind,
  AdapterVendorBindingKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  CodexAgentAdapter,
  CodexAgentAdapterExecutionMode,
  type CodexExecRunner,
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

describe('codex-agent-adapter smoke', () => {
  const createExecRunner = (responseText = 'OK'): CodexExecRunner => {
    return async () => ({
      stdout: [
        '{"type":"thread.started","thread_id":"thread-1"}',
        `{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"${responseText}"}}`,
        '{"type":"turn.completed","usage":{"input_tokens":11,"output_tokens":7}}',
      ].join('\n'),
      stderr: '',
      exitCode: 0,
      signal: null,
      elapsedMs: 12,
    });
  };

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
    expect(invokeResult.output.responseText).toBe('implemented feature');
    expect(invokeResult.output.threadId).toBe('thread-1');
    expect(invokeResult.usage?.totalTokens).toBe(18);
    expect(execRunner).toHaveBeenCalledTimes(2);
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
      name: 'AbortError',
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it('fails closed when remote_api credentialRef is configured directly on the adapter', async () => {
    const adapter = new CodexAgentAdapter({
      executionMode: CodexAgentAdapterExecutionMode.REMOTE_API,
      environment: {
        OPENAI_API_KEY: 'test-key',
      },
      remoteApi: {
        provider: AdapterProviderKind.OPENAI,
        vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        model: 'gpt-5',
        credentialRef: 'secret://openai/api-key',
      },
    });

    await expect(
      adapter.probe({
        routeKey: 'cli.adapter.probe.codex',
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.AGENT_PROTOCOL_INVALID,
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
    expect(detailOrigins).toContain('system');
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
