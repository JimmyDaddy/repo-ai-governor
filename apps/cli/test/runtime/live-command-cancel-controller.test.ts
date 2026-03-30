import { GovernorErrorCode } from '@repo-ai-governor/shared';
import { CliCommandName } from '../../src/constants/cli-command.constant.js';
import { CliLiveCommandCancelController } from '../../src/runtime/live-command-cancel-controller.js';
import type { CliCommandProgressEvent } from '../../src/types/index.js';

describe('CliLiveCommandCancelController', () => {
  it('requests graceful cancellation first and forces termination on second Ctrl+C', async () => {
    const progressEvents: CliCommandProgressEvent[] = [];
    const controller = new CliLiveCommandCancelController({
      commandName: CliCommandName.CONNECT,
      progressSink: {
        publish: (event) => {
          progressEvents.push(event);
        },
      },
      translate: (key) => {
        if (key === 'cli.reactShell.progress.cancel.requested') {
          return 'Cancellation requested. Waiting for command shutdown.';
        }
        if (key === 'cli.reactShell.progress.cancel.forced') {
          return 'Second Ctrl+C received. Stopping command immediately.';
        }
        return key;
      },
    });

    const executionOptions = controller.createExecutionOptions();
    const pendingExecution = controller.raceExecution(new Promise<never>(() => undefined));

    controller.handleSigint();
    expect(executionOptions.abortSignal?.aborted).toBe(true);
    expect(progressEvents[0]).toMatchObject({
      commandName: CliCommandName.CONNECT,
      runState: 'running',
      cancelCapability: 'cancel_requested',
      statusLine: 'Cancellation requested. Waiting for command shutdown.',
    });

    controller.handleSigint();

    await expect(pendingExecution).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
      message: 'Second Ctrl+C received. Stopping command immediately.',
    });
    expect(progressEvents[1]).toMatchObject({
      commandName: CliCommandName.CONNECT,
      runState: 'cancelled',
      cancelCapability: 'cancel_requested',
      statusLine: 'Second Ctrl+C received. Stopping command immediately.',
    });
  });
});
