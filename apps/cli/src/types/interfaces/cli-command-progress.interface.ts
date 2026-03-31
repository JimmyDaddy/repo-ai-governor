import type { ExecutionProgressStatus } from '@repo-ai-governor/shared';
import type { CliCommandName } from '../../constants/cli-command.constant.js';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';

export type CliCommandRunState = 'idle' | 'running' | 'success' | 'failure' | 'cancelled';

export type CliCommandCancelCapability = 'none' | 'supported' | 'cancel_requested';

export interface CliCommandProgressRowPatch {
  id: string;
  title: string;
  status: ExecutionProgressStatus;
  detail?: string;
}

export interface CliCommandProgressArtifactPatch {
  id: string;
  label: string;
  path: string;
}

/**
 * Defines one transport-neutral progress patch emitted by long-running CLI commands.
 */
export interface CliCommandProgressEvent {
  commandName: CliCommandName;
  title?: string;
  subtitle?: string;
  themePreset?: CliReactThemePreset;
  runState?: CliCommandRunState;
  statusLine?: string;
  currentStepTitle?: string;
  totalSteps?: number;
  completedSteps?: number;
  cancelCapability?: CliCommandCancelCapability;
  row?: CliCommandProgressRowPatch;
  artifact?: CliCommandProgressArtifactPatch;
  logLine?: string;
  occurredAt?: string;
}

/**
 * Defines one optional progress event sink owned by the CLI transport layer.
 */
export interface CliCommandProgressSink {
  publish(event: CliCommandProgressEvent): void;
}

/**
 * Defines additive execution options for long-running command UX seams.
 */
export interface CliGovernanceCommandExecutionOptions {
  progressSink?: CliCommandProgressSink;
  abortSignal?: AbortSignal;
}

/**
 * Defines additive nested-entry execution options used when the session shell re-enters `runCli`.
 */
export interface CliNestedCommandExecutionOptions extends CliGovernanceCommandExecutionOptions {
  suppressLiveProgressPresenter?: boolean;
}
