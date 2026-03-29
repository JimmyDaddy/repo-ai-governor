import type { ErrorOutputEnvironment, Locale, WorkspaceMode } from '@repo-ai-governor/shared';
import type { CliCommandName } from '../../constants/cli-command.constant.js';
import type {
  CliInteractiveShellFallbackBehavior,
  CliInteractiveShellRunState,
  CliInteractiveShellStderrRenderingMode,
  CliInteractiveUiMode,
} from '../../constants/cli-interactive-shell.constant.js';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';

/**
 * Defines one normalized UI mode resolution snapshot for the CLI interactive shell.
 */
export interface CliInteractiveShellModeResolution {
  requestedUiMode: CliInteractiveUiMode | null;
  uiMode: CliInteractiveUiMode;
  fallbackBehavior: CliInteractiveShellFallbackBehavior | null;
}

/**
 * Defines one prompt-field descriptor rendered by the minimal interactive shell.
 */
export interface CliInteractiveShellFieldOption {
  value: string;
  label: string;
}

/**
 * Defines one prompt-field descriptor rendered by the minimal interactive shell.
 */
export interface CliInteractiveShellFieldDescriptor {
  fieldId: string;
  title: string;
  description: string;
  promptLabel: string;
  options?: CliInteractiveShellFieldOption[];
}

/**
 * Defines one descriptor contract for the minimal `init` React-style wizard.
 */
export interface CliInitReactShellDescriptor {
  descriptorId: string;
  commandName: CliCommandName;
  title: string;
  intro: string;
  confirmationTitle: string;
  confirmationPrompt: string;
  confirmationRestartMessage: string;
  submitTitle: string;
  successMessage: string;
  workspaceModeField: CliInteractiveShellFieldDescriptor;
  workspaceModeValidationMessage: string;
  defaultLocaleField: CliInteractiveShellFieldDescriptor;
  defaultLocaleValidationMessage: string;
  totalSteps: number;
}

/**
 * Defines mutable shell session state shared between the runner and stderr renderer.
 */
export interface CliInteractiveShellSessionState {
  uiMode: CliInteractiveUiMode;
  commandName: CliCommandName;
  descriptorId: string;
  uiTheme?: CliReactThemePreset;
  runState: CliInteractiveShellRunState;
  currentStepTitle: string;
  totalSteps: number;
  formValues: Record<string, string>;
  validationErrors: Record<string, string>;
  stderrRendering: CliInteractiveShellStderrRenderingMode;
  stdoutContract: ErrorOutputEnvironment;
  locale: Locale;
  fallbackBehavior: CliInteractiveShellFallbackBehavior | null;
}

/**
 * Defines the prompt adapter seam used by the interactive shell runner.
 */
export interface CliInteractiveShellSelectPrompt {
  session: CliInteractiveShellSessionState;
  title: string;
  description: string;
  options: CliInteractiveShellFieldOption[];
  defaultValue: string;
  translate: (key: string, interpolation?: Record<string, string>) => string;
}

/**
 * Defines one confirmation prompt rendered through the interactive shell.
 */
export interface CliInteractiveShellConfirmPrompt {
  session: CliInteractiveShellSessionState;
  title: string;
  promptLabel: string;
  summaryLines: string[];
  translate: (key: string, interpolation?: Record<string, string>) => string;
}

/**
 * Defines one non-interactive status frame rendered through the live interactive shell.
 */
export interface CliInteractiveShellStatusFrame {
  session: CliInteractiveShellSessionState;
  title: string;
  lines: string[];
  translate: (key: string, interpolation?: Record<string, string>) => string;
}

/**
 * Defines the prompt adapter seam used by the interactive shell runner.
 */
export interface CliInteractiveShellPromptAdapter {
  select(prompt: CliInteractiveShellSelectPrompt): Promise<string>;
  confirm(prompt: CliInteractiveShellConfirmPrompt): Promise<boolean>;
  renderStatus?(frame: CliInteractiveShellStatusFrame): void;
  close(): void;
}

/**
 * Defines the selected bootstrap defaults returned by the minimal `init` shell.
 */
export interface CliInitReactShellSelection {
  workspaceMode: WorkspaceMode;
  defaultLocale: Locale;
  fallbackLocale: Locale;
}
