import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { AgentCliExecOperation, AgentCliExecOperationsRuntime } from '../src/index.js';

describe('AgentCliExecOperationsRuntime', () => {
  it('retries transient failures before succeeding', async () => {
    const runtime = new AgentCliExecOperationsRuntime('codex', 2, 1);
    const timeoutBudgets: number[] = [];
    const executeAttempt = vi
      .fn<(remainingTimeoutMs: number | undefined) => Promise<string>>()
      .mockImplementationOnce(async (remainingTimeoutMs) => {
        timeoutBudgets.push(remainingTimeoutMs ?? -1);
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
          'probe failed: rate limit',
          {
            stderr: '429 rate limit exceeded',
          },
        );
      })
      .mockImplementationOnce(async (remainingTimeoutMs) => {
        timeoutBudgets.push(remainingTimeoutMs ?? -1);
        return 'ok';
      });

    const result = await runtime.executeWithRetry(AgentCliExecOperation.PROBE, executeAttempt, {
      timeoutMs: 50,
    });

    expect(result).toBe('ok');
    expect(executeAttempt).toHaveBeenCalledTimes(2);
    expect(timeoutBudgets[1]).toBeLessThanOrEqual(timeoutBudgets[0]);
  });

  it('does not retry non-transient failures', async () => {
    const runtime = new AgentCliExecOperationsRuntime('codex', 2, 1);
    const error = new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED,
      'probe failed: login required',
      {
        stderr: 'credential missing',
      },
    );
    const executeAttempt = vi
      .fn<(remainingTimeoutMs: number | undefined) => Promise<string>>()
      .mockRejectedValue(error);

    await expect(
      runtime.executeWithRetry(AgentCliExecOperation.PROBE, executeAttempt),
    ).rejects.toBe(error);
    expect(executeAttempt).toHaveBeenCalledTimes(1);
  });

  it('does not retry when the caller signal is already aborted', async () => {
    const runtime = new AgentCliExecOperationsRuntime('codex', 2, 1);
    const abortController = new AbortController();
    abortController.abort();
    const executeAttempt = vi.fn<(remainingTimeoutMs: number | undefined) => Promise<string>>();

    await expect(
      runtime.executeWithRetry(AgentCliExecOperation.PROBE, executeAttempt, {
        signal: abortController.signal,
        timeoutMs: 50,
      }),
    ).rejects.toThrow(/aborted/u);
    expect(executeAttempt).not.toHaveBeenCalled();
  });

  it('collects error detail from canonical details and redacts sensitive payloads', () => {
    const runtime = new AgentCliExecOperationsRuntime('codex', 2, 1);
    const error = new RuntimeError(
      GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
      'invoke failed',
      {
        stderr: 'Authorization: Bearer secret-token-value',
        stdout: 'api_key=my-secret',
      },
    );

    const detail = runtime.collectErrorDetail(error, 'fallback');
    const redacted = runtime.createRedactedProcessDetails({
      stderr: 'Authorization: Bearer secret-token-value',
      stdout: 'api_key=my-secret',
    });

    expect(detail).toContain('secret-token-value');
    expect(redacted.stderr).toBe('Authorization: Bearer [REDACTED]');
    expect(redacted.stdout).toBe('api_key=[REDACTED]');
  });
});
