import {
  AgentCancellationReason,
  AgentCancellationScope,
  type AgentInvokeStageRequest,
  type AgentInvokeStageResult,
  AgentStreamEventType,
  type AgentStreamEventsRequest,
} from '@repo-ai-governor/adapter-sdk';
import { AdapterSurface, GovernorErrorCode } from '@repo-ai-governor/shared';
import { CliAcpHostOperationRuntime } from '../../src/runtime/cli-acp-host-operation-runtime.js';
import { CliAcpPromptTurnRuntime } from '../../src/runtime/cli-acp-prompt-turn-runtime.js';
import { CliAcpSessionRuntime } from '../../src/runtime/cli-acp-session-runtime.js';
import { CliAcpTransportClientRuntime } from '../../src/runtime/cli-acp-transport-client-runtime.js';
import type { CliAcpInvocationExecutionState } from '../../src/types/index.js';

const ACP_LOCALIZE_TEXT = (english: string): string => english;

interface CountingPromptTurnExecutionOptions {
  surfaceId: AdapterSurface;
  request: AgentInvokeStageRequest | AgentStreamEventsRequest;
  invocationState: CliAcpInvocationExecutionState;
  execution: {
    settled: boolean;
    cancelled: boolean;
    terminalStatus: 'completed' | 'failed' | null;
    cancelScope: AgentCancellationScope;
    cancelReason: AgentCancellationReason;
    waiters: Set<() => void>;
    resultPromise: Promise<AgentInvokeStageResult>;
  };
  localizeText: (english: string, chinese: string) => string;
}

class CountingCliAcpTransportClientRuntime extends CliAcpTransportClientRuntime {
  public executionStarts = 0;

  protected override async startPromptTurnExecution(
    options: CountingPromptTurnExecutionOptions,
  ): Promise<AgentInvokeStageResult> {
    this.executionStarts += 1;
    return await super.startPromptTurnExecution(options);
  }
}

interface RequestIdentityOverrides {
  processId?: string;
  executionId?: string;
  stageId?: string;
  routeKey?: string;
}

function createStreamRequest(
  input: Record<string, unknown>,
  overrides: RequestIdentityOverrides = {},
): AgentStreamEventsRequest & {
  processId: string;
  executionId: string;
  stageId: string;
  routeKey: string;
} {
  return {
    processId: overrides.processId ?? 'process-acp-001',
    executionId: overrides.executionId ?? 'execution-acp-001',
    stageId: overrides.stageId ?? 'stage-acp-001',
    routeKey: overrides.routeKey ?? 'session.main',
    input,
  };
}

async function collectStreamEvents(
  runtime: CliAcpPromptTurnRuntime,
  request: AgentStreamEventsRequest,
) {
  const events = [];
  for await (const event of runtime.streamEvents(request)) {
    events.push(event);
  }
  return events;
}

function createPromptTurnHarness() {
  const sessionRuntime = new CliAcpSessionRuntime();
  const transportClientRuntime = new CountingCliAcpTransportClientRuntime({
    forgetInvocationState: (invocationState) =>
      sessionRuntime.forgetInvocationState(invocationState),
  });
  const promptTurnRuntime = new CliAcpPromptTurnRuntime({
    surfaceId: AdapterSurface.CODEX,
    localizeText: ACP_LOCALIZE_TEXT,
    sessionRuntime,
    transportClientRuntime,
  });
  const hostOperationRuntime = new CliAcpHostOperationRuntime({
    surfaceId: AdapterSurface.CODEX,
    localizeText: ACP_LOCALIZE_TEXT,
    sessionRuntime,
    transportClientRuntime,
  });

  return {
    sessionRuntime,
    transportClientRuntime,
    promptTurnRuntime,
    hostOperationRuntime,
  };
}

describe('CliAcpPromptTurnRuntime', () => {
  it('returns fixture-backed invokeStage output and buffers the shared ACP prompt-turn events', async () => {
    const { transportClientRuntime, sessionRuntime, promptTurnRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Implement ACP bridge baseline.',
    });

    const result = await promptTurnRuntime.invokeStage(request);
    const invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);

    expect(result.output).toEqual(
      expect.objectContaining({
        adapterSurface: AdapterSurface.CODEX,
        routeKey: 'session.main',
        stageId: 'stage-acp-001',
        responseText: 'ACP(codex): Implement ACP bridge baseline.',
        acpSessionId: expect.any(String),
        acpInvocationKey: invocationState.invocationKey,
      }),
    );
    expect(invocationState.acpSessionId).toBe(
      'codex::process-acp-001::execution-acp-001::stage-acp-001::acp-session',
    );
    expect(invocationState.bufferedStreamEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(transportClientRuntime.executionStarts).toBe(1);
  });

  it('reuses one shared execution when streamEvents attaches after invokeStage completes', async () => {
    const { transportClientRuntime, promptTurnRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      responseText: 'ACP fixture output from invoke-first flow.',
    });

    const invokeResult = await promptTurnRuntime.invokeStage(request);
    const events = await collectStreamEvents(promptTurnRuntime, request);

    expect(transportClientRuntime.executionStarts).toBe(1);
    expect(events.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(events[2]?.payload.responseText).toBe(invokeResult.output.responseText);
  });

  it('reuses the completed invoke result after successful cache eviction and still replays buffered events', async () => {
    const { transportClientRuntime, promptTurnRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      responseText: 'ACP fixture output from the completed replay path.',
    });

    const firstInvokeResult = await promptTurnRuntime.invokeStage(request);
    const secondInvokeResult = await promptTurnRuntime.invokeStage(request);
    const replayedEvents = await collectStreamEvents(promptTurnRuntime, request);

    expect(transportClientRuntime.executionStarts).toBe(1);
    expect(secondInvokeResult).toEqual(firstInvokeResult);
    expect(replayedEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(replayedEvents[2]?.payload.responseText).toBe(firstInvokeResult.output.responseText);
  });

  it('reuses one shared execution when streamEvents starts before a later invokeStage lookup', async () => {
    const { transportClientRuntime, promptTurnRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      userMessage: 'Route this ACP turn through the shared store.',
    });

    const streamPromise = collectStreamEvents(promptTurnRuntime, request);
    await Promise.resolve();
    const invokeResult = await promptTurnRuntime.invokeStage(request);
    const events = await streamPromise;

    expect(transportClientRuntime.executionStarts).toBe(1);
    expect(invokeResult.output.responseText).toBe(
      'ACP(codex): Route this ACP turn through the shared store.',
    );
    expect(events[2]?.payload.responseText).toBe(invokeResult.output.responseText);
  });

  it('does not restart a completed stream-first ACP turn when invokeStage attaches after completion', async () => {
    const { transportClientRuntime, promptTurnRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      userMessage: 'Complete the ACP turn from stream-first flow.',
    });

    const streamedEvents = await collectStreamEvents(promptTurnRuntime, request);
    const invokeResult = await promptTurnRuntime.invokeStage(request);

    expect(transportClientRuntime.executionStarts).toBe(1);
    expect(streamedEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(invokeResult.output.responseText).toBe(
      'ACP(codex): Complete the ACP turn from stream-first flow.',
    );
  });

  it('replays one cancelled ACP terminal to late streamEvents callers before explicit invokeStage retry starts fresh execution', async () => {
    const { transportClientRuntime, sessionRuntime, promptTurnRuntime, hostOperationRuntime } =
      createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Retry this ACP prompt turn from stream-first flow after cancellation.',
    });

    const cancelledInvokePromise = promptTurnRuntime.invokeStage(request);
    await Promise.resolve();
    await hostOperationRuntime.cancel({
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    await expect(cancelledInvokePromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });

    const cancelledEvents = await collectStreamEvents(promptTurnRuntime, request);
    expect(transportClientRuntime.executionStarts).toBe(1);
    expect(
      cancelledEvents.some((event) => event.eventType === AgentStreamEventType.COMPLETED),
    ).toBe(false);
    expect(cancelledEvents.at(-1)?.eventType).toBe(AgentStreamEventType.FAILED);

    const retryResult = await promptTurnRuntime.invokeStage(request);
    const retryEvents = await collectStreamEvents(promptTurnRuntime, request);
    const invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);

    expect(transportClientRuntime.executionStarts).toBe(2);
    expect(retryResult.output.responseText).toBe(
      'ACP(codex): Retry this ACP prompt turn from stream-first flow after cancellation.',
    );
    expect(retryEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(invocationState.bufferedStreamEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
  });

  it('evicts aged-out completed invocation keys from the shared session store after retention compaction', async () => {
    const { transportClientRuntime, sessionRuntime, promptTurnRuntime } = createPromptTurnHarness();
    const requests = Array.from({ length: 33 }, (_, index) =>
      createStreamRequest(
        {
          responseText: `ACP retention request ${index + 1}.`,
        },
        {
          processId: `process-acp-${index + 1}`,
          executionId: `execution-acp-${index + 1}`,
          stageId: `stage-acp-${index + 1}`,
        },
      ),
    );

    for (const request of requests) {
      await promptTurnRuntime.invokeStage(request);
    }

    const latestRequest = requests.at(-1);
    expect(latestRequest).toBeDefined();
    if (!latestRequest) {
      return;
    }
    const latestReplayResult = await promptTurnRuntime.invokeStage(latestRequest);
    const firstRequest = requests[0];
    const latestState = sessionRuntime.findInvocationState(AdapterSurface.CODEX, {
      processId: latestRequest.processId,
      executionId: latestRequest.executionId,
      stageId: latestRequest.stageId,
      routeKey: latestRequest.routeKey,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    expect(transportClientRuntime.executionStarts).toBe(33);
    expect(latestReplayResult.output.responseText).toBe('ACP retention request 33.');
    expect(
      sessionRuntime.findInvocationState(AdapterSurface.CODEX, {
        processId: firstRequest.processId,
        executionId: firstRequest.executionId,
        stageId: firstRequest.stageId,
        routeKey: firstRequest.routeKey,
        scope: AgentCancellationScope.STAGE,
        reason: AgentCancellationReason.USER_REQUESTED,
      }),
    ).toBeUndefined();
    expect(latestState?.bufferedStreamEvents.at(-1)?.eventType).toBe(
      AgentStreamEventType.COMPLETED,
    );
  });
});

describe('CliAcpHostOperationRuntime', () => {
  it('cancels an active shared ACP prompt turn and surfaces standardized cancellation output', async () => {
    const { transportClientRuntime, promptTurnRuntime, hostOperationRuntime } =
      createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Start one cancellable ACP prompt turn.',
    });

    const invokePromise = promptTurnRuntime.invokeStage(request);
    const streamPromise = collectStreamEvents(promptTurnRuntime, request);
    await Promise.resolve();
    const cancelResult = await hostOperationRuntime.cancel({
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    await expect(invokePromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });
    const events = await streamPromise;

    expect(cancelResult).toMatchObject({
      acknowledged: true,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });
    expect(events.some((event) => event.eventType === AgentStreamEventType.COMPLETED)).toBe(false);
    expect(events.at(-1)?.eventType).toBe(AgentStreamEventType.FAILED);
    expect(events.at(-1)?.payload.message).toBe('ACP prompt turn was cancelled for codex.');
    expect(transportClientRuntime.executionStarts).toBe(1);
  });

  it('restarts the shared ACP prompt turn after one cancelled execution for the same invocation key', async () => {
    const { transportClientRuntime, sessionRuntime, promptTurnRuntime, hostOperationRuntime } =
      createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Retry this ACP prompt turn after cancellation.',
    });

    const cancelledInvokePromise = promptTurnRuntime.invokeStage(request);
    await Promise.resolve();
    await hostOperationRuntime.cancel({
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    await expect(cancelledInvokePromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });

    const retryResult = await promptTurnRuntime.invokeStage(request);
    const retryEvents = await collectStreamEvents(promptTurnRuntime, request);
    const invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);

    expect(transportClientRuntime.executionStarts).toBe(2);
    expect(retryResult.output.responseText).toBe(
      'ACP(codex): Retry this ACP prompt turn after cancellation.',
    );
    expect(retryEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(invocationState.bufferedStreamEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
  });

  it('allows an immediate same-key retry after cancel acknowledgement to start a fresh ACP turn', async () => {
    const { transportClientRuntime, promptTurnRuntime, hostOperationRuntime } =
      createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Retry this ACP prompt turn immediately after cancel acknowledgement.',
    });

    const cancelledInvokePromise = promptTurnRuntime.invokeStage(request);
    await Promise.resolve();
    const cancelResult = await hostOperationRuntime.cancel({
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });
    const immediateRetryPromise = promptTurnRuntime.invokeStage(request);

    await expect(cancelledInvokePromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });

    const retryResult = await immediateRetryPromise;
    const retryEvents = await collectStreamEvents(promptTurnRuntime, request);

    expect(cancelResult).toMatchObject({
      acknowledged: true,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });
    expect(transportClientRuntime.executionStarts).toBe(2);
    expect(retryResult.output.responseText).toBe(
      'ACP(codex): Retry this ACP prompt turn immediately after cancel acknowledgement.',
    );
    expect(retryEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
  });

  it('acknowledges cancellation from one process/execution-local request when the live invocation is unique', async () => {
    const { transportClientRuntime, promptTurnRuntime, hostOperationRuntime } =
      createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Cancel this ACP prompt turn without stage-specific facts.',
    });

    const invokePromise = promptTurnRuntime.invokeStage(request);
    const streamPromise = collectStreamEvents(promptTurnRuntime, request);
    await Promise.resolve();
    const cancelResult = await hostOperationRuntime.cancel({
      processId: request.processId,
      executionId: request.executionId,
      scope: AgentCancellationScope.AGENT,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    await expect(invokePromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });
    const events = await streamPromise;

    expect(cancelResult).toMatchObject({
      acknowledged: true,
      scope: AgentCancellationScope.AGENT,
      reason: AgentCancellationReason.USER_REQUESTED,
    });
    expect(events.at(-1)?.eventType).toBe(AgentStreamEventType.FAILED);
    expect(transportClientRuntime.executionStarts).toBe(1);
  });

  it('ignores retained completed turns when one later live stage is the only cancellable match for process/execution-local cancel', async () => {
    const { transportClientRuntime, promptTurnRuntime, hostOperationRuntime } =
      createPromptTurnHarness();
    const completedRequest = createStreamRequest(
      {
        responseText: 'ACP retained completed stage in shared execution.',
      },
      {
        processId: 'process-acp-shared',
        executionId: 'execution-acp-shared',
        stageId: 'stage-acp-completed',
        routeKey: 'route.completed',
      },
    );
    const liveRequest = createStreamRequest(
      {
        prompt: 'Cancel the live ACP stage in the shared execution.',
      },
      {
        processId: 'process-acp-shared',
        executionId: 'execution-acp-shared',
        stageId: 'stage-acp-live',
        routeKey: 'route.live',
      },
    );

    await promptTurnRuntime.invokeStage(completedRequest);

    const liveInvokePromise = promptTurnRuntime.invokeStage(liveRequest);
    const liveStreamPromise = collectStreamEvents(promptTurnRuntime, liveRequest);
    await Promise.resolve();
    const cancelResult = await hostOperationRuntime.cancel({
      processId: liveRequest.processId,
      executionId: liveRequest.executionId,
      scope: AgentCancellationScope.AGENT,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    await expect(liveInvokePromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });
    const liveEvents = await liveStreamPromise;

    expect(cancelResult).toMatchObject({
      acknowledged: true,
      scope: AgentCancellationScope.AGENT,
      reason: AgentCancellationReason.USER_REQUESTED,
    });
    expect(liveEvents.at(-1)?.eventType).toBe(AgentStreamEventType.FAILED);
    expect(transportClientRuntime.executionStarts).toBe(2);
  });

  it('ignores retained failed turns when one later live stage is the only cancellable match for process/execution-local cancel', async () => {
    const { transportClientRuntime, promptTurnRuntime, hostOperationRuntime } =
      createPromptTurnHarness();
    const failedRequest = createStreamRequest(
      {
        prompt: 'Cancel the retained failed ACP stage in the shared execution.',
      },
      {
        processId: 'process-acp-retained-failed',
        executionId: 'execution-acp-retained-failed',
        stageId: 'stage-acp-failed',
        routeKey: 'route.failed',
      },
    );
    const liveRequest = createStreamRequest(
      {
        prompt: 'Cancel the live ACP stage while a retained failed stage still exists.',
      },
      {
        processId: 'process-acp-retained-failed',
        executionId: 'execution-acp-retained-failed',
        stageId: 'stage-acp-live',
        routeKey: 'route.live',
      },
    );

    const failedInvokePromise = promptTurnRuntime.invokeStage(failedRequest);
    await Promise.resolve();
    await hostOperationRuntime.cancel({
      processId: failedRequest.processId,
      executionId: failedRequest.executionId,
      stageId: failedRequest.stageId,
      routeKey: failedRequest.routeKey,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });
    await expect(failedInvokePromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });
    const failedReplayEvents = await collectStreamEvents(promptTurnRuntime, failedRequest);

    const liveInvokePromise = promptTurnRuntime.invokeStage(liveRequest);
    const liveStreamPromise = collectStreamEvents(promptTurnRuntime, liveRequest);
    await Promise.resolve();
    const cancelResult = await hostOperationRuntime.cancel({
      processId: liveRequest.processId,
      executionId: liveRequest.executionId,
      scope: AgentCancellationScope.AGENT,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    await expect(liveInvokePromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });
    const liveEvents = await liveStreamPromise;

    expect(failedReplayEvents.at(-1)?.eventType).toBe(AgentStreamEventType.FAILED);
    expect(cancelResult).toMatchObject({
      acknowledged: true,
      scope: AgentCancellationScope.AGENT,
      reason: AgentCancellationReason.USER_REQUESTED,
    });
    expect(liveEvents.at(-1)?.eventType).toBe(AgentStreamEventType.FAILED);
    expect(transportClientRuntime.executionStarts).toBe(2);
  });
});
