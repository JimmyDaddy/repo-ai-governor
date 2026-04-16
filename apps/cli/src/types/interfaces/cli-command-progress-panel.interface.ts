import type { ExecutionProgressStatus } from '@repo-ai-governor/shared';
import type {
  CliCommandCancelCapability,
  CliCommandLogLevel,
  CliCommandRunState,
} from './cli-command-progress.interface.js';

export interface CliCommandProgressPanelRowViewModel {
  id: string;
  title: string;
  status: ExecutionProgressStatus;
  detail?: string;
}

export interface CliCommandProgressPanelArtifactViewModel {
  id: string;
  label: string;
  path: string;
}

export interface CliCommandProgressLogEntryViewModel {
  text: string;
  level: CliCommandLogLevel;
  label: string;
}

/**
 * Defines one transport-neutral running-progress panel consumed by CLI/desktop shells.
 */
export interface CliCommandProgressPanelViewModel {
  title: string;
  runState: CliCommandRunState;
  statusLine: string;
  currentStepTitle?: string;
  elapsedLabel?: string;
  heartbeatLabel?: string;
  stepsLabel?: string;
  artifactsTitle?: string;
  logsTitle?: string;
  cancelCapability: CliCommandCancelCapability;
  cancelLabel?: string;
  rows: CliCommandProgressPanelRowViewModel[];
  artifacts: CliCommandProgressPanelArtifactViewModel[];
  logEntries: CliCommandProgressLogEntryViewModel[];
  logLines: string[];
}
