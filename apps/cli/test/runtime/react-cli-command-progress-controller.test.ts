import { ExecutionProgressStatus } from '@repo-ai-governor/shared';
import { CliCommandName } from '../../src/constants/cli-command.constant.js';
import { ReactCliCommandProgressController } from '../../src/react-cli/index.js';

describe('ReactCliCommandProgressController', () => {
  it('reduces progress patches into one running shell panel snapshot', () => {
    const controller = new ReactCliCommandProgressController({
      commandName: CliCommandName.CONNECT,
      initialTitle: '[react-shell:connect] connect',
      initialSubtitle: 'ui=react theme=governor stdout=pretty workspace=repo_local',
      translate: (key, interpolation) => {
        if (key === 'cli.reactShell.progress.title') {
          return 'Running progress';
        }
        if (key === 'cli.reactShell.shared.shortcuts') {
          return 'Shortcuts';
        }
        if (key === 'cli.reactShell.progress.shortcut.exit') {
          return 'Ctrl+C exit';
        }
        if (key === 'cli.reactShell.progress.shortcut.cancel') {
          return 'Ctrl+C cancel';
        }
        if (key === 'cli.reactShell.progress.cancel.none') {
          return 'Cancellation unavailable';
        }
        if (key === 'cli.reactShell.progress.cancel.supported') {
          return 'Press Ctrl+C to cancel';
        }
        if (key === 'cli.reactShell.progress.cancel.requested') {
          return 'Cancellation requested';
        }
        if (key === 'cli.reactShell.progress.elapsed') {
          return `Elapsed: ${interpolation?.elapsed ?? '0s'}`;
        }
        if (key === 'cli.reactShell.progress.heartbeat') {
          return `Heartbeat: ${interpolation?.tick ?? '1'}`;
        }
        if (key === 'cli.reactShell.progress.steps') {
          return `Step ${interpolation?.completed ?? '0'}/${interpolation?.total ?? '0'}`;
        }
        if (key === 'cli.reactShell.progress.status.running') {
          return `Running ${interpolation?.command ?? 'command'}…`;
        }
        return key;
      },
    });

    controller.apply({
      commandName: CliCommandName.CONNECT,
      title: 'Connect adapters and capture diagnostics',
      runState: 'running',
      statusLine: 'Preparing connect execution…',
      currentStepTitle: 'Build candidate config',
      totalSteps: 4,
      completedSteps: 0,
      row: {
        id: 'candidate-config',
        title: 'Build candidate config',
        status: ExecutionProgressStatus.RUNNING,
      },
    });
    const snapshot = controller.apply({
      commandName: CliCommandName.CONNECT,
      statusLine: 'Connect diagnostics are ready.',
      completedSteps: 4,
      runState: 'success',
      row: {
        id: 'candidate-config',
        title: 'Build candidate config',
        status: ExecutionProgressStatus.COMPLETED,
        detail: '/tmp/connect.governor.yaml',
      },
      artifact: {
        id: 'diagnostics',
        label: 'Diagnostics artifact',
        path: '/tmp/connect.json',
      },
      logLine: 'connect_id=connect-123 adapter_status=warn',
    });

    expect(snapshot.title).toContain('Connect adapters and capture diagnostics');
    expect(snapshot.statusVariant).toBe('success');
    expect(snapshot.commandProgressPanel?.statusLine).toBe('Connect diagnostics are ready.');
    expect(snapshot.commandProgressPanel?.stepsLabel).toBe('Step 4/4');
    expect(snapshot.commandProgressPanel?.heartbeatLabel).toBeUndefined();
    expect(snapshot.commandProgressPanel?.rows).toEqual([
      {
        id: 'candidate-config',
        title: 'Build candidate config',
        status: ExecutionProgressStatus.COMPLETED,
        detail: '/tmp/connect.governor.yaml',
      },
    ]);
    expect(snapshot.commandProgressPanel?.artifacts).toEqual([
      {
        id: 'diagnostics',
        label: 'Diagnostics artifact',
        path: '/tmp/connect.json',
      },
    ]);
    expect(snapshot.commandProgressPanel?.logLines).toEqual([
      'connect_id=connect-123 adapter_status=warn',
    ]);
  });

  it('refreshes elapsed and heartbeat labels without requiring a new progress event', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-31T00:00:00Z'));

    try {
      const controller = new ReactCliCommandProgressController({
        commandName: CliCommandName.CONNECT,
        initialTitle: '[react-shell:connect] connect',
        initialSubtitle: 'ui=react theme=governor stdout=pretty workspace=repo_local',
        translate: (key, interpolation) => {
          if (key === 'cli.reactShell.progress.title') {
            return 'Running progress';
          }
          if (key === 'cli.reactShell.shared.shortcuts') {
            return 'Shortcuts';
          }
          if (key === 'cli.reactShell.progress.shortcut.exit') {
            return 'Ctrl+C exit';
          }
          if (key === 'cli.reactShell.progress.cancel.none') {
            return 'Cancellation unavailable';
          }
          if (key === 'cli.reactShell.progress.elapsed') {
            return `Elapsed: ${interpolation?.elapsed ?? '0s'}`;
          }
          if (key === 'cli.reactShell.progress.heartbeat') {
            return `Heartbeat: ${interpolation?.tick ?? '1'}`;
          }
          if (key === 'cli.reactShell.progress.status.running') {
            return `Running ${interpolation?.command ?? 'command'}…`;
          }
          return key;
        },
      });

      const initialSnapshot = controller.apply({
        commandName: CliCommandName.CONNECT,
        runState: 'running',
      });
      vi.advanceTimersByTime(1000);
      const refreshedSnapshot = controller.refresh();

      expect(initialSnapshot.commandProgressPanel?.elapsedLabel).toBe('Elapsed: 0s');
      expect(initialSnapshot.commandProgressPanel?.heartbeatLabel).toBe('Heartbeat: 1');
      expect(refreshedSnapshot.commandProgressPanel?.elapsedLabel).toBe('Elapsed: 1s');
      expect(refreshedSnapshot.commandProgressPanel?.heartbeatLabel).toBe('Heartbeat: 2');
    } finally {
      vi.useRealTimers();
    }
  });
});
