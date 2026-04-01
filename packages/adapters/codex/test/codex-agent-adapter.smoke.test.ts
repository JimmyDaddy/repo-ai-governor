import {
  AgentCancellationReason,
  AgentCancellationScope,
  AgentCapability,
  AgentConfirmationDecision,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from '@repo-ai-governor/adapter-sdk';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
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
});
