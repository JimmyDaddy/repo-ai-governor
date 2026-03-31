import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import type {
  CliCommandProgressEvent,
  CliCommandProgressPanelArtifactViewModel,
  CliCommandProgressPanelRowViewModel,
  CliCommandRunState,
} from '../../types/index.js';
import type {
  ReactCliStatusVariant,
  ReactCliViewModel,
} from '../state/react-cli-view-model.interface.js';
import { ReactCliSessionController } from './react-cli-session-controller.js';

const LOG_TAIL_LIMIT = 5;
const HEARTBEAT_TICK_CYCLE = 4;

export interface ReactCliCommandProgressControllerOptions {
  commandName: string;
  initialTitle: string;
  initialSubtitle: string;
  themePreset?: CliReactThemePreset;
  translate: (key: string, interpolation?: Record<string, string>) => string;
}

/**
 * Reduces transport-neutral progress events into a shared React CLI running-state view-model.
 */
export class ReactCliCommandProgressController {
  private readonly sessionController: ReactCliSessionController;
  private readonly progressRows = new Map<string, CliCommandProgressPanelRowViewModel>();
  private readonly progressArtifacts = new Map<string, CliCommandProgressPanelArtifactViewModel>();
  private readonly logTail: string[] = [];
  private readonly startedAtMs = Date.now();
  private shellTitle: string;
  private shellSubtitle: string;
  private themePreset?: CliReactThemePreset;
  private runState: CliCommandRunState = 'running';
  private statusLine: string;
  private currentStepTitle: string | undefined;
  private totalSteps: number | undefined;
  private completedSteps: number | undefined;
  private cancelCapability: 'none' | 'supported' | 'cancel_requested' = 'none';

  public constructor(private readonly options: ReactCliCommandProgressControllerOptions) {
    this.shellTitle = options.initialTitle;
    this.shellSubtitle = options.initialSubtitle;
    this.themePreset = options.themePreset;
    this.statusLine = options.translate('cli.reactShell.progress.status.running', {
      command: options.commandName,
    });
    this.sessionController = new ReactCliSessionController({
      title: this.shellTitle,
      subtitle: this.shellSubtitle,
      themePreset: this.themePreset,
      sections: [],
      footerShortcutsTitle: options.translate('cli.reactShell.shared.shortcuts'),
      footerShortcuts: [options.translate('cli.reactShell.progress.shortcut.exit')],
    });
  }

  /**
   * Applies one progress patch and returns the latest running-shell snapshot.
   * @param event Transport-neutral progress patch.
   * @returns Latest shared React CLI view model.
   */
  public apply(event: CliCommandProgressEvent): ReactCliViewModel {
    if (event.title) {
      this.shellTitle = `[react-shell:${event.commandName}] ${event.title}`;
    }
    if (event.subtitle) {
      this.shellSubtitle = event.subtitle;
    }
    if (event.themePreset) {
      this.themePreset = event.themePreset;
    }
    if (event.runState) {
      this.runState = event.runState;
    }
    if (event.statusLine) {
      this.statusLine = event.statusLine;
    }
    if (event.currentStepTitle !== undefined) {
      this.currentStepTitle = event.currentStepTitle;
    }
    if (event.totalSteps !== undefined) {
      this.totalSteps = event.totalSteps;
    }
    if (event.completedSteps !== undefined) {
      this.completedSteps = event.completedSteps;
    }
    if (event.cancelCapability) {
      this.cancelCapability = event.cancelCapability;
    }
    if (event.row) {
      this.progressRows.set(event.row.id, {
        ...event.row,
      });
    }
    if (event.artifact) {
      this.progressArtifacts.set(event.artifact.id, {
        ...event.artifact,
      });
    }
    if (event.logLine) {
      this.logTail.push(event.logLine);
      if (this.logTail.length > LOG_TAIL_LIMIT) {
        this.logTail.splice(0, this.logTail.length - LOG_TAIL_LIMIT);
      }
    }

    return this.commit();
  }

  /**
   * Recomputes the running-shell snapshot without requiring a new transport event.
   * @returns Latest shared React CLI view model with refreshed elapsed/heartbeat labels.
   */
  public refresh(): ReactCliViewModel {
    return this.commit();
  }

  private commit(): ReactCliViewModel {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - this.startedAtMs) / 1000));
    const elapsedLabel = this.options.translate('cli.reactShell.progress.elapsed', {
      elapsed: `${elapsedSeconds}s`,
    });
    const heartbeatLabel =
      this.runState === 'running'
        ? this.options.translate('cli.reactShell.progress.heartbeat', {
            tick: String((elapsedSeconds % HEARTBEAT_TICK_CYCLE) + 1),
          })
        : undefined;
    const stepsLabel =
      this.totalSteps !== undefined
        ? this.options.translate('cli.reactShell.progress.steps', {
            completed: String(this.completedSteps ?? 0),
            total: String(this.totalSteps),
          })
        : undefined;
    const cancelLabel =
      this.cancelCapability === 'supported'
        ? this.options.translate('cli.reactShell.progress.cancel.supported')
        : this.cancelCapability === 'cancel_requested'
          ? this.options.translate('cli.reactShell.progress.cancel.requested')
          : this.options.translate('cli.reactShell.progress.cancel.none');
    return this.sessionController.update({
      title: this.shellTitle,
      subtitle: this.shellSubtitle,
      themePreset: this.themePreset,
      statusMessage: this.statusLine,
      statusVariant: this.resolveStatusVariant(),
      commandProgressPanel: {
        title: this.options.translate('cli.reactShell.progress.title'),
        runState: this.runState,
        statusLine: this.statusLine,
        currentStepTitle: this.currentStepTitle,
        elapsedLabel,
        heartbeatLabel,
        stepsLabel,
        artifactsTitle: this.options.translate('cli.reactShell.progress.artifactsTitle'),
        logsTitle: this.options.translate('cli.reactShell.progress.logsTitle'),
        cancelCapability: this.cancelCapability,
        cancelLabel,
        rows: [...this.progressRows.values()],
        artifacts: [...this.progressArtifacts.values()],
        logLines: [...this.logTail],
      },
      footerShortcuts: [
        this.cancelCapability === 'supported'
          ? this.options.translate('cli.reactShell.progress.shortcut.cancel')
          : this.options.translate('cli.reactShell.progress.shortcut.exit'),
      ],
    });
  }

  private resolveStatusVariant(): ReactCliStatusVariant {
    if (this.runState === 'failure' || this.runState === 'cancelled') {
      return 'error';
    }

    if (this.runState === 'success') {
      return 'success';
    }

    return 'info';
  }
}
