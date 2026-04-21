import {
  AgentCancellationReason,
  AgentCancellationScope,
  AgentConfirmationDecision,
  type AgentConfirmationRequest,
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

function createConfirmationRequest(
  overrides: RequestIdentityOverrides = {},
  metadata?: Record<string, unknown>,
): AgentConfirmationRequest {
  return {
    processId: overrides.processId ?? 'process-acp-001',
    executionId: overrides.executionId ?? 'execution-acp-001',
    stageId: overrides.stageId ?? 'stage-acp-001',
    routeKey: overrides.routeKey ?? 'session.main',
    prompt: 'Confirm this ACP tool call.',
    ...(metadata ? { metadata } : {}),
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

function createPromptTurnHarness(
  localizeText: (english: string, chinese: string) => string = ACP_LOCALIZE_TEXT,
) {
  const sessionRuntime = new CliAcpSessionRuntime();
  const transportClientRuntime = new CountingCliAcpTransportClientRuntime({
    forgetInvocationState: (invocationState) =>
      sessionRuntime.forgetInvocationState(invocationState),
  });
  const promptTurnRuntime = new CliAcpPromptTurnRuntime({
    surfaceId: AdapterSurface.CODEX,
    localizeText,
    sessionRuntime,
    transportClientRuntime,
  });
  const hostOperationRuntime = new CliAcpHostOperationRuntime({
    surfaceId: AdapterSurface.CODEX,
    localizeText,
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

  it('emits tool-call events and tracks terminal ids when fixture ACP bridge capabilities are available', async () => {
    const { sessionRuntime, promptTurnRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Run ACP terminal and filesystem bridge operations.',
      acpCapabilities: {
        terminal: true,
        fsReadTextFile: true,
      },
      toolCalls: [
        {
          toolCallId: 'tool-call-terminal-001',
          toolName: 'terminal/create',
          terminalId: 'terminal-001',
          detail: 'Create the ACP terminal session.',
        },
        {
          toolCallId: 'tool-call-fs-001',
          toolName: 'fs/read_text_file',
          detail: 'Read one governed file through ACP.',
        },
      ],
    });

    const invokeResult = await promptTurnRuntime.invokeStage(request);
    const replayedEvents = await collectStreamEvents(promptTurnRuntime, request);
    const invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);

    expect(invokeResult.output.responseText).toBe(
      'ACP(codex): Run ACP terminal and filesystem bridge operations.',
    );
    expect(replayedEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOOL_CALL,
      AgentStreamEventType.TOOL_CALL,
      AgentStreamEventType.TOKEN,
      AgentStreamEventType.COMPLETED,
    ]);
    expect(
      replayedEvents
        .filter((event) => event.eventType === AgentStreamEventType.TOOL_CALL)
        .map((event) => event.payload.toolName),
    ).toEqual(['terminal/create', 'fs/read_text_file']);
    expect(invocationState.terminalIds).toEqual(['terminal-001']);
  });

  it('localizes the default tool-call detail when fixture bridge payloads omit detail text', async () => {
    const { promptTurnRuntime } = createPromptTurnHarness((_english, chinese) => chinese);
    const request = createStreamRequest({
      prompt: '用 ACP bridge 触发一次默认 detail 的 tool call。',
      acpCapabilities: {
        terminal: true,
      },
      toolCalls: [
        {
          toolCallId: 'tool-call-terminal-i18n-001',
          toolName: 'terminal/create',
          terminalId: 'terminal-i18n-001',
        },
      ],
    });

    await promptTurnRuntime.invokeStage(request);
    const replayedEvents = await collectStreamEvents(promptTurnRuntime, request);
    const toolCallEvent = replayedEvents.find(
      (event) => event.eventType === AgentStreamEventType.TOOL_CALL,
    );

    expect(toolCallEvent?.payload.detail).toBe('ACP bridge 已调用 terminal/create。');
  });

  it('localizes malformed ACP fixture tool-call payload failures', async () => {
    const { promptTurnRuntime } = createPromptTurnHarness((_english, chinese) => chinese);
    const request = createStreamRequest({
      prompt: '让 ACP bridge 以中文报出 malformed toolCalls payload。',
      toolCalls: 'not-an-array',
    });

    await expect(promptTurnRuntime.invokeStage(request)).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      message: 'codex 的 ACP fixture tool-call payload 非法：toolCalls 必须是数组。',
    });

    const replayedEvents = await collectStreamEvents(promptTurnRuntime, request);

    expect(replayedEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.FAILED,
    ]);
    expect(replayedEvents.at(-1)?.payload.message).toBe(
      'codex 的 ACP fixture tool-call payload 非法：toolCalls 必须是数组。',
    );
  });

  it('fails closed when a fixture ACP bridge tool call requires an unavailable capability', async () => {
    const { promptTurnRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Attempt ACP filesystem bridge work without write capability.',
      acpCapabilities: {
        terminal: true,
        fsReadTextFile: true,
      },
      toolCalls: [
        {
          toolCallId: 'tool-call-fs-write-001',
          toolName: 'fs/write_text_file',
          detail: 'Write one governed file through ACP.',
        },
      ],
    });

    await expect(promptTurnRuntime.invokeStage(request)).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_ROUTE_CAPABILITY_UNSATISFIED,
    });

    const replayedEvents = await collectStreamEvents(promptTurnRuntime, request);

    expect(replayedEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.FAILED,
    ]);
    expect(replayedEvents.at(-1)?.payload.message).toBe(
      'ACP fixture bridge for fs/write_text_file requires fs.writeTextFile capability on codex.',
    );
  });

  it('clears tracked carrier state when a later ACP bridge tool call fails after one terminal tool call already emitted', async () => {
    const { sessionRuntime, promptTurnRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Emit one ACP terminal tool call before a later filesystem capability failure.',
      acpCapabilities: {
        terminal: true,
      },
      toolCalls: [
        {
          toolCallId: 'tool-call-terminal-003',
          toolName: 'terminal/create',
          terminalId: 'terminal-003',
          detail: 'Create the ACP terminal session before the failure branch.',
        },
        {
          toolCallId: 'tool-call-fs-write-002',
          toolName: 'fs/write_text_file',
          detail: 'Attempt the ACP filesystem write without the capability.',
        },
      ],
    });

    await expect(promptTurnRuntime.invokeStage(request)).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_ROUTE_CAPABILITY_UNSATISFIED,
    });

    const replayedEvents = await collectStreamEvents(promptTurnRuntime, request);
    const invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);

    expect(replayedEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOOL_CALL,
      AgentStreamEventType.FAILED,
    ]);
    expect(invocationState.emittedToolCallIds).toEqual([]);
    expect(invocationState.terminalIds).toEqual([]);
    expect(invocationState.permissionRequestIds).toEqual([]);
  });

  it('fails closed when a fixture ACP bridge tool call uses an unknown filesystem carrier', async () => {
    const { promptTurnRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Attempt ACP filesystem bridge work with an unknown carrier.',
      toolCalls: [
        {
          toolCallId: 'tool-call-fs-delete-001',
          toolName: 'fs/delete_file',
          requiredCapabilities: [],
        },
      ],
    });

    await expect(promptTurnRuntime.invokeStage(request)).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_ROUTE_CAPABILITY_UNSATISFIED,
    });

    const replayedEvents = await collectStreamEvents(promptTurnRuntime, request);

    expect(replayedEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.FAILED,
    ]);
    expect(replayedEvents.at(-1)?.payload.message).toBe(
      'ACP fixture bridge does not support unknown filesystem carrier fs/delete_file on codex.',
    );
  });

  it('clears tracked terminal ids when cancellation interrupts an ACP bridge tool-call turn', async () => {
    const { sessionRuntime, promptTurnRuntime, hostOperationRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Cancel one ACP terminal bridge turn after the tool call starts.',
      acpCapabilities: {
        terminal: true,
      },
      toolCalls: [
        {
          toolCallId: 'tool-call-terminal-002',
          toolName: 'terminal/create',
          terminalId: 'terminal-002',
          detail: 'Create the cancellable ACP terminal session.',
        },
      ],
    });

    const invokePromise = promptTurnRuntime.invokeStage(request);
    let invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    for (let attempt = 0; attempt < 5 && invocationState.terminalIds.length === 0; attempt += 1) {
      await Promise.resolve();
      invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    }

    expect(invocationState.terminalIds).toEqual(['terminal-002']);

    await hostOperationRuntime.cancel({
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

    const replayedEvents = await collectStreamEvents(promptTurnRuntime, request);

    expect(invocationState.terminalIds).toEqual([]);
    expect(replayedEvents.map((event) => event.eventType)).toEqual([
      AgentStreamEventType.STATUS,
      AgentStreamEventType.TOOL_CALL,
      AgentStreamEventType.FAILED,
    ]);
  });
});

describe('CliAcpHostOperationRuntime', () => {
  it('maps active tool-call confirmation metadata onto the ACP permission bridge for the live invocation', async () => {
    const { sessionRuntime, promptTurnRuntime, hostOperationRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Bridge this ACP confirmation request through active tool-call metadata.',
      toolCalls: [
        {
          toolCallId: 'tool-call-001',
          toolName: 'approval/request',
          detail: 'Bridge approval metadata onto the live ACP turn.',
          requiredCapabilities: [],
        },
      ],
    });

    const invokePromise = promptTurnRuntime.invokeStage(request);
    let invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    for (
      let attempt = 0;
      attempt < 5 && !invocationState.emittedToolCallIds.includes('tool-call-001');
      attempt += 1
    ) {
      await Promise.resolve();
      invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    }

    const confirmationRequest = createConfirmationRequest(
      {
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
      },
      {
        acpPermissionRequestId: 'permission-001',
        toolCallId: 'tool-call-001',
        allowedDecisions: [AgentConfirmationDecision.APPROVE, AgentConfirmationDecision.REJECT],
        decision: AgentConfirmationDecision.APPROVE,
        constraints: ['workspace.write'],
        reason: 'Approved from the active ACP permission bridge.',
      },
    );

    const firstConfirmationResult =
      await hostOperationRuntime.requestConfirmation(confirmationRequest);
    const secondConfirmationResult =
      await hostOperationRuntime.requestConfirmation(confirmationRequest);
    const invokeResult = await invokePromise;

    expect(firstConfirmationResult).toMatchObject({
      decision: AgentConfirmationDecision.APPROVE,
      reason: 'Approved from the active ACP permission bridge.',
      constraints: ['workspace.write'],
      decidedAt: expect.any(String),
    });
    expect(secondConfirmationResult).toMatchObject({
      decision: AgentConfirmationDecision.APPROVE,
      reason: 'Approved from the active ACP permission bridge.',
      constraints: ['workspace.write'],
      decidedAt: expect.any(String),
    });
    expect(secondConfirmationResult.decidedAt).toBe(firstConfirmationResult.decidedAt);
    expect(invocationState.emittedToolCallIds).toEqual(['tool-call-001']);
    expect(invocationState.permissionRequestIds).toEqual(['permission-001']);
    expect(invokeResult.output.responseText).toBe(
      'ACP(codex): Bridge this ACP confirmation request through active tool-call metadata.',
    );
  });

  it('localizes the default permission bridge reason when confirmation metadata omits it', async () => {
    const { sessionRuntime, promptTurnRuntime, hostOperationRuntime } = createPromptTurnHarness(
      (_english, chinese) => chinese,
    );
    const request = createStreamRequest({
      prompt: '让 ACP permission bridge 在缺省 reason 时返回本地化文案。',
      toolCalls: [
        {
          toolCallId: 'tool-call-005',
          toolName: 'approval/request',
          detail: 'Bridge approval metadata without an explicit reason.',
          requiredCapabilities: [],
        },
      ],
    });

    const invokePromise = promptTurnRuntime.invokeStage(request);
    let invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    for (
      let attempt = 0;
      attempt < 5 && !invocationState.emittedToolCallIds.includes('tool-call-005');
      attempt += 1
    ) {
      await Promise.resolve();
      invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    }

    await expect(
      hostOperationRuntime.requestConfirmation(
        createConfirmationRequest(
          {
            processId: request.processId,
            executionId: request.executionId,
            stageId: request.stageId,
            routeKey: request.routeKey,
          },
          {
            acpPermissionRequestId: 'permission-005',
            toolCallId: 'tool-call-005',
            allowedDecisions: [AgentConfirmationDecision.APPROVE],
            decision: AgentConfirmationDecision.APPROVE,
          },
        ),
      ),
    ).resolves.toMatchObject({
      decision: AgentConfirmationDecision.APPROVE,
      reason: 'ACP permission decision 已映射到 tool-call-005。',
      constraints: [],
      decidedAt: expect.any(String),
    });

    await expect(invokePromise).resolves.toMatchObject({
      output: expect.objectContaining({
        responseText: 'ACP（codex）：让 ACP permission bridge 在缺省 reason 时返回本地化文案。',
      }),
    });
  });

  it('rejects replayed permission request ids when later metadata changes the bound confirmation facts', async () => {
    const { sessionRuntime, promptTurnRuntime, hostOperationRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Keep ACP permission request facts stable across replays.',
      toolCalls: [
        {
          toolCallId: 'tool-call-004',
          toolName: 'approval/request',
          detail: 'Bind the ACP permission request facts to the first replay.',
          requiredCapabilities: [],
        },
      ],
    });

    const invokePromise = promptTurnRuntime.invokeStage(request);
    let invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    for (
      let attempt = 0;
      attempt < 5 && !invocationState.emittedToolCallIds.includes('tool-call-004');
      attempt += 1
    ) {
      await Promise.resolve();
      invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    }

    const initialConfirmationRequest = createConfirmationRequest(
      {
        processId: request.processId,
        executionId: request.executionId,
        stageId: request.stageId,
        routeKey: request.routeKey,
      },
      {
        acpPermissionRequestId: 'permission-004',
        toolCallId: 'tool-call-004',
        allowedDecisions: [AgentConfirmationDecision.APPROVE, AgentConfirmationDecision.REJECT],
        decision: AgentConfirmationDecision.APPROVE,
        constraints: ['workspace.write'],
        reason: 'The first ACP permission decision stays bound to permission-004.',
      },
    );

    await expect(
      hostOperationRuntime.requestConfirmation(initialConfirmationRequest),
    ).resolves.toMatchObject({
      decision: AgentConfirmationDecision.APPROVE,
      reason: 'The first ACP permission decision stays bound to permission-004.',
      constraints: ['workspace.write'],
      decidedAt: expect.any(String),
    });
    await expect(
      hostOperationRuntime.requestConfirmation(
        createConfirmationRequest(
          {
            processId: request.processId,
            executionId: request.executionId,
            stageId: request.stageId,
            routeKey: request.routeKey,
          },
          {
            acpPermissionRequestId: 'permission-004',
            toolCallId: 'tool-call-004',
            allowedDecisions: [AgentConfirmationDecision.APPROVE, AgentConfirmationDecision.REJECT],
            decision: AgentConfirmationDecision.REJECT,
            constraints: ['workspace.write'],
            reason: 'This replay tries to swap in a different decision.',
          },
        ),
      ),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_CONFIRMATION_FAILED,
    });

    await expect(invokePromise).resolves.toMatchObject({
      output: expect.objectContaining({
        responseText: 'ACP(codex): Keep ACP permission request facts stable across replays.',
      }),
    });
  });

  it('fails closed when confirmation metadata is missing, forged, or requests an invalid decision', async () => {
    const { sessionRuntime, promptTurnRuntime, hostOperationRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Require valid ACP confirmation metadata before bridging.',
      toolCalls: [
        {
          toolCallId: 'tool-call-002',
          toolName: 'approval/request',
          detail: 'Validate confirmation metadata against the active ACP turn.',
          requiredCapabilities: [],
        },
      ],
    });

    const invokePromise = promptTurnRuntime.invokeStage(request);
    let invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    for (
      let attempt = 0;
      attempt < 5 && !invocationState.emittedToolCallIds.includes('tool-call-002');
      attempt += 1
    ) {
      await Promise.resolve();
      invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    }

    await expect(
      hostOperationRuntime.requestConfirmation(
        createConfirmationRequest({
          processId: request.processId,
          executionId: request.executionId,
          stageId: request.stageId,
          routeKey: request.routeKey,
        }),
      ),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_CONFIRMATION_FAILED,
    });
    await expect(
      hostOperationRuntime.requestConfirmation(
        createConfirmationRequest(
          {
            processId: request.processId,
            executionId: request.executionId,
            stageId: request.stageId,
            routeKey: request.routeKey,
          },
          {
            acpPermissionRequestId: 'permission-forged-002',
            toolCallId: 'tool-call-never-emitted',
            allowedDecisions: [AgentConfirmationDecision.APPROVE],
            decision: AgentConfirmationDecision.APPROVE,
          },
        ),
      ),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_CONFIRMATION_FAILED,
    });
    await expect(
      hostOperationRuntime.requestConfirmation(
        createConfirmationRequest(
          {
            processId: request.processId,
            executionId: request.executionId,
            stageId: request.stageId,
            routeKey: request.routeKey,
          },
          {
            acpPermissionRequestId: 'permission-002',
            toolCallId: 'tool-call-002',
            allowedDecisions: [AgentConfirmationDecision.APPROVE],
            decision: AgentConfirmationDecision.REJECT,
          },
        ),
      ),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_CONFIRMATION_FAILED,
    });

    await expect(invokePromise).resolves.toMatchObject({
      output: expect.objectContaining({
        responseText: 'ACP(codex): Require valid ACP confirmation metadata before bridging.',
      }),
    });
  });

  it('fails closed once the ACP prompt turn is no longer live even with valid confirmation metadata', async () => {
    const { promptTurnRuntime, hostOperationRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Do not allow ACP confirmation after the shared prompt turn settles.',
      toolCalls: [
        {
          toolCallId: 'tool-call-003',
          toolName: 'approval/request',
          detail: 'Keep one emitted tool call available until the turn settles.',
          requiredCapabilities: [],
        },
      ],
    });

    await expect(promptTurnRuntime.invokeStage(request)).resolves.toMatchObject({
      output: expect.objectContaining({
        responseText:
          'ACP(codex): Do not allow ACP confirmation after the shared prompt turn settles.',
      }),
    });

    await expect(
      hostOperationRuntime.requestConfirmation(
        createConfirmationRequest(
          {
            processId: request.processId,
            executionId: request.executionId,
            stageId: request.stageId,
            routeKey: request.routeKey,
          },
          {
            acpPermissionRequestId: 'permission-003',
            toolCallId: 'tool-call-003',
            allowedDecisions: [AgentConfirmationDecision.APPROVE],
            decision: AgentConfirmationDecision.APPROVE,
          },
        ),
      ),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_CONFIRMATION_FAILED,
    });
  });

  it('clears cached permission resolutions when a confirmed ACP turn is cancelled before completion', async () => {
    const { sessionRuntime, promptTurnRuntime, hostOperationRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Cancel one confirmed ACP approval turn before it completes.',
      acpCapabilities: {
        terminal: true,
      },
      toolCalls: [
        {
          toolCallId: 'tool-call-006',
          toolName: 'approval/request',
          detail: 'Grant one ACP approval before cancellation interrupts the turn.',
          requiredCapabilities: [],
        },
        {
          toolCallId: 'tool-call-terminal-004',
          toolName: 'terminal/create',
          terminalId: 'terminal-004',
          detail: 'Keep the shared ACP turn busy after the approval tool call.',
        },
        {
          toolCallId: 'tool-call-terminal-005',
          toolName: 'terminal/create',
          terminalId: 'terminal-005',
          detail: 'Keep the shared ACP turn cancellable after confirmation.',
        },
        {
          toolCallId: 'tool-call-terminal-006',
          toolName: 'terminal/create',
          terminalId: 'terminal-006',
          detail: 'Leave another terminal carrier pending for cancel cleanup.',
        },
      ],
    });

    const invokePromise = promptTurnRuntime.invokeStage(request);
    let invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    for (
      let attempt = 0;
      attempt < 5 && !invocationState.emittedToolCallIds.includes('tool-call-006');
      attempt += 1
    ) {
      await Promise.resolve();
      invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    }

    await expect(
      hostOperationRuntime.requestConfirmation(
        createConfirmationRequest(
          {
            processId: request.processId,
            executionId: request.executionId,
            stageId: request.stageId,
            routeKey: request.routeKey,
          },
          {
            acpPermissionRequestId: 'permission-006',
            toolCallId: 'tool-call-006',
            allowedDecisions: [AgentConfirmationDecision.APPROVE],
            decision: AgentConfirmationDecision.APPROVE,
            constraints: ['workspace.write'],
            reason: 'Approve the ACP permission request before cancellation cleanup.',
          },
        ),
      ),
    ).resolves.toMatchObject({
      decision: AgentConfirmationDecision.APPROVE,
      reason: 'Approve the ACP permission request before cancellation cleanup.',
      constraints: ['workspace.write'],
      decidedAt: expect.any(String),
    });

    expect(invocationState.permissionRequestIds).toEqual(['permission-006']);
    expect(invocationState.permissionRequestResolutionsById).toEqual({
      'permission-006': expect.objectContaining({
        toolCallId: 'tool-call-006',
        decision: AgentConfirmationDecision.APPROVE,
        constraints: ['workspace.write'],
      }),
    });

    await hostOperationRuntime.cancel({
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

    expect(invocationState.emittedToolCallIds).toEqual([]);
    expect(invocationState.permissionRequestIds).toEqual([]);
    expect(invocationState.permissionRequestResolutionsById).toEqual({});
  });

  it('fails closed for late ACP confirmations after cancellation has already been acknowledged', async () => {
    const { sessionRuntime, promptTurnRuntime, hostOperationRuntime } = createPromptTurnHarness();
    const request = createStreamRequest({
      prompt: 'Reject ACP permission confirmations after cancellation acknowledgement.',
      acpCapabilities: {
        terminal: true,
      },
      toolCalls: [
        {
          toolCallId: 'tool-call-007',
          toolName: 'approval/request',
          detail: 'Expose one ACP approval request before cancellation.',
          requiredCapabilities: [],
        },
        {
          toolCallId: 'tool-call-terminal-007',
          toolName: 'terminal/create',
          terminalId: 'terminal-007',
          detail: 'Keep the turn live long enough to test post-cancel confirmation.',
        },
        {
          toolCallId: 'tool-call-terminal-008',
          toolName: 'terminal/create',
          terminalId: 'terminal-008',
          detail: 'Leave another pending terminal carrier for the cancelled turn.',
        },
      ],
    });

    const invokePromise = promptTurnRuntime.invokeStage(request);
    let invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    for (
      let attempt = 0;
      attempt < 5 && !invocationState.emittedToolCallIds.includes('tool-call-007');
      attempt += 1
    ) {
      await Promise.resolve();
      invocationState = sessionRuntime.ensureInvocationState(AdapterSurface.CODEX, request);
    }

    await hostOperationRuntime.cancel({
      processId: request.processId,
      executionId: request.executionId,
      stageId: request.stageId,
      routeKey: request.routeKey,
      scope: AgentCancellationScope.STAGE,
      reason: AgentCancellationReason.USER_REQUESTED,
    });

    await expect(
      hostOperationRuntime.requestConfirmation(
        createConfirmationRequest(
          {
            processId: request.processId,
            executionId: request.executionId,
            stageId: request.stageId,
            routeKey: request.routeKey,
          },
          {
            acpPermissionRequestId: 'permission-007',
            toolCallId: 'tool-call-007',
            allowedDecisions: [AgentConfirmationDecision.APPROVE],
            decision: AgentConfirmationDecision.APPROVE,
            reason: 'Do not allow this late approval after cancellation.',
          },
        ),
      ),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ADAPTER_PROTOCOL_CONFIRMATION_FAILED,
    });

    await expect(invokePromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });

    expect(invocationState.permissionRequestIds).toEqual([]);
    expect(invocationState.permissionRequestResolutionsById).toEqual({});
  });

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
