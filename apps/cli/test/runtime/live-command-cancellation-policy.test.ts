import { CliCommandName } from '../../src/constants/cli-command.constant.js';
import { CliLiveCommandCancellationPolicy } from '../../src/runtime/live-command-cancellation-policy.js';

describe('CliLiveCommandCancellationPolicy', () => {
  it('only enables two-stage cancellation for commands with wired abort support', () => {
    const policy = new CliLiveCommandCancellationPolicy();

    expect(policy.supportsLiveCancellation(CliCommandName.CONNECT)).toBe(true);
    expect(policy.supportsLiveCancellation(CliCommandName.DOCTOR)).toBe(true);
    expect(policy.supportsLiveCancellation(CliCommandName.RUN)).toBe(false);
    expect(policy.supportsLiveCancellation(CliCommandName.CHECK)).toBe(false);
    expect(policy.supportsLiveCancellation(CliCommandName.REVIEW)).toBe(false);
  });
});
