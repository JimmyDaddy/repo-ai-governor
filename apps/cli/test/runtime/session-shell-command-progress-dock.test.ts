import { CliCommandName } from '../../src/constants/cli-command.constant.js';
import { CliSessionShellCommandProgressDock } from '../../src/runtime/interactive-shell/session-shell-command-progress-dock.js';
import type { CliCommandProgressPanelViewModel } from '../../src/types/index.js';

function clonePanel(
  panel: CliCommandProgressPanelViewModel | undefined,
): CliCommandProgressPanelViewModel | undefined {
  if (!panel) {
    return undefined;
  }

  return {
    ...panel,
    rows: panel.rows.map((row) => ({ ...row })),
    artifacts: panel.artifacts.map((artifact) => ({ ...artifact })),
    logLines: [...panel.logLines],
  };
}

describe('CliSessionShellCommandProgressDock', () => {
  it('refreshes elapsed and heartbeat labels on a 1s tick, then stops once the run completes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-31T00:00:00Z'));

    try {
      const panelSnapshots: Array<CliCommandProgressPanelViewModel | undefined> = [];
      let renderCount = 0;
      const dock = new CliSessionShellCommandProgressDock({
        argv: [CliCommandName.DOCTOR],
        previewCommandLine: 'doctor',
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
        onPanelUpdate: (panel) => {
          panelSnapshots.push(clonePanel(panel));
        },
        onRenderRequested: () => {
          renderCount += 1;
        },
      });

      dock.seedRunningState();
      dock.startTicking();

      expect(panelSnapshots.at(-1)?.elapsedLabel).toBe('Elapsed: 0s');
      expect(panelSnapshots.at(-1)?.heartbeatLabel).toBe('Heartbeat: 1');

      vi.advanceTimersByTime(1000);

      expect(panelSnapshots.at(-1)?.elapsedLabel).toBe('Elapsed: 1s');
      expect(panelSnapshots.at(-1)?.heartbeatLabel).toBe('Heartbeat: 2');

      const executionOptions = dock.createExecutionOptions();
      executionOptions?.progressSink?.publish({
        commandName: CliCommandName.DOCTOR,
        runState: 'success',
        statusLine: 'Doctor completed.',
      });
      const renderCountAfterSuccess = renderCount;

      vi.advanceTimersByTime(2000);

      expect(renderCount).toBe(renderCountAfterSuccess);
      expect(panelSnapshots.at(-1)?.heartbeatLabel).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
